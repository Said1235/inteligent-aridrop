/**
 * Claim identity.
 *
 * ── The rule this file exists to enforce ────────────────────────────────────
 * A claim is identified by a u256 `claim_id` generated in the browser, with a
 * CSPRNG, BEFORE any transaction is built or signed. The id goes into the URL
 * immediately. Every later read uses that exact id.
 *
 * Nothing in this codebase may identify a claim by "the most recent one", by
 * diffing a wallet's transaction list, by timestamp ordering, or by position in
 * any array. Those techniques cannot distinguish two claims submitted
 * concurrently by the same wallet (two tabs, a double click, an impatient
 * retry) and will eventually attribute the wrong record to the wrong
 * submission.
 *
 * Because the id exists before the transaction does, concurrent submissions are
 * independent from the first instant: each one already owns a distinct URL.
 * ───────────────────────────────────────────────────────────────────────────
 */

const U256_MAX = (1n << 256n) - 1n;

/**
 * A fresh 256-bit claim id. Collision probability across any realistic number
 * of claims is negligible; this is the same size as an Ethereum private key.
 *
 * Zero is rejected and redrawn so that a falsy-looking id can never exist.
 */
export function generateClaimId(): bigint {
  if (typeof globalThis.crypto?.getRandomValues !== "function") {
    // Refuse rather than silently fall back to Math.random(), which is not a
    // CSPRNG and would weaken the uniqueness guarantee above.
    throw new Error(
      "Secure random numbers are unavailable in this browser, so a claim ID cannot be generated.",
    );
  }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const bytes = new Uint8Array(32);
    globalThis.crypto.getRandomValues(bytes);
    let value = 0n;
    for (const byte of bytes) value = (value << 8n) | BigInt(byte);
    if (value !== 0n) return value;
  }
  throw new Error("Could not generate a claim ID.");
}

/** Decimal string form used in URLs, localStorage keys and calldata. */
export function claimIdToString(id: bigint): string {
  return id.toString(10);
}

/**
 * Parse an id coming from an untrusted source (the URL, storage, a pasted
 * value). Returns null rather than throwing so callers render a "not found"
 * state instead of crashing the route.
 */
export function parseClaimId(raw: string | null | undefined): bigint | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!/^[0-9]+$/.test(trimmed)) return null;
  try {
    const value = BigInt(trimmed);
    if (value <= 0n || value > U256_MAX) return null;
    return value;
  } catch {
    return null;
  }
}

/**
 * Short display form: first and last digits of the decimal id. Display only —
 * never parse a shortened id back, and never compare two claims by it.
 */
export function shortClaimId(id: bigint | string): string {
  const s = typeof id === "bigint" ? id.toString(10) : id;
  if (s.length <= 14) return s;
  return `${s.slice(0, 7)}…${s.slice(-5)}`;
}

export const claimPath = (id: bigint | string) =>
  `/claim/${typeof id === "bigint" ? claimIdToString(id) : id}`;
