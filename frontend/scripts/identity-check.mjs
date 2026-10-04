/**
 * Transaction-identity check.
 *
 * Guards the single rule the product cannot ship without: a claim is
 * identified by an ID generated client-side before any transaction exists, and
 * never by recency, list position or timestamp.
 *
 * Run with:  npm run check:identity
 */
import { webcrypto } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

if (!globalThis.crypto?.getRandomValues) {
  Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
}

// Compile the real source modules — the check must run against shipped code.
const outDir = mkdtempSync(join(tmpdir(), "identity-"));
execFileSync(
  "npx",
  ["tsc", "src/lib/claimId.ts", "src/lib/claimIndex.ts",
   "--target", "ES2022", "--module", "ESNext", "--outDir", outDir, "--skipLibCheck"],
  { stdio: "inherit" },
);
for (const name of ["claimId", "claimIndex"]) {
  const js = join(outDir, `${name}.js`);
  const mjs = join(outDir, `${name}.mjs`);
  writeFileSync(js, readFileSync(js, "utf8").replace('from "./claimId"', 'from "./claimId.mjs"'));
  renameSync(js, mjs);
}

// Minimal localStorage so claimIndex runs outside a browser.
const store = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  },
};

const claimIdMod = await import(join(outDir, "claimId.mjs"));
const { generateClaimId, claimIdToString, parseClaimId, claimPath, shortClaimId } = claimIdMod;

let failures = 0;
const check = (name, cond, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? "  " + extra : ""}`);
  if (!cond) failures++;
};

// --- 1. Two submissions started at the same instant, same wallet -----------
const tabA = generateClaimId();
const tabB = generateClaimId();
check("two concurrent claims get different IDs", tabA !== tabB);
check("their URLs differ from the first instant", claimPath(tabA) !== claimPath(tabB),
  `${claimPath(tabA).slice(0, 18)}… vs ${claimPath(tabB).slice(0, 18)}…`);

// --- 2. Drafts are keyed by exact ID, never by recency ---------------------
const { saveDraft, readDraft, clearDraft, rememberClaim, listBookmarks } =
  await import(join(outDir, "claimIndex.mjs"));

const now = Date.now();
saveDraft({ id: claimIdToString(tabA), evidenceText: "EVIDENCE A", createdAt: now, account: "0xwallet" });
saveDraft({ id: claimIdToString(tabB), evidenceText: "EVIDENCE B", createdAt: now, account: "0xwallet" });

check("draft A resolves to A's evidence", readDraft(claimIdToString(tabA)).evidenceText === "EVIDENCE A");
check("draft B resolves to B's evidence", readDraft(claimIdToString(tabB)).evidenceText === "EVIDENCE B");

// Same wallet, identical timestamps: recency cannot separate them, the ID can.
rememberClaim({ id: claimIdToString(tabA), submittedBy: "0xwallet" });
rememberClaim({ id: claimIdToString(tabB), submittedBy: "0xwallet" });
const marks = listBookmarks();
check("both claims are bookmarked separately", marks.length === 2);
check("each bookmark carries its own exact ID",
  marks.every((m) => m.id === claimIdToString(tabA) || m.id === claimIdToString(tabB)));

// Clearing one draft must not touch the other.
clearDraft(claimIdToString(tabA));
check("clearing A leaves B intact",
  readDraft(claimIdToString(tabA)) === null && readDraft(claimIdToString(tabB)) !== null);

// --- 3. URL round-trip survives reload / reopen ----------------------------
const fromUrl = parseClaimId(claimPath(tabB).split("/").pop());
check("ID parsed back from the URL is identical", fromUrl === tabB);

// --- 4. Untrusted input is rejected, not guessed ---------------------------
for (const bad of ["", "0", "abc", "-5", "12.5", " ", null, undefined,
                   (2n ** 256n).toString()]) {
  if (parseClaimId(bad) !== null) { check(`rejects ${JSON.stringify(bad)}`, false); }
}
check("invalid IDs all rejected", true);
check("a shortened ID does not parse back", parseClaimId(shortClaimId(tabA)) === null,
  shortClaimId(tabA));

// --- 5. Spread over many draws, no collisions ------------------------------
const seen = new Set();
for (let i = 0; i < 20000; i++) seen.add(claimIdToString(generateClaimId()));
check("20000 generated IDs are all distinct", seen.size === 20000);

console.log(failures === 0 ? "\nALL IDENTITY CHECKS PASSED" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
