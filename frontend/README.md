# Allocyn — frontend

A Next.js app for the `IntelligentAirdrop` Intelligent Contract on GenLayer. An
organizer publishes a fixed set of eligibility requirements once; claimants
submit free-text evidence; independent AI validators decide whether the evidence
satisfies every requirement; the contract records `qualifies` or
`does_not_qualify`.

**No tokens move through this contract.** It is an eligibility oracle. Paying,
granting access or minting belongs to a separate system.

---

## Network: three options, one default

This project has been redeployed more than once across different GenLayer
networks, and each redeploy produces a **new contract address that is only
ever valid on the chain it was deployed to**. To stop that from causing
silent mismatches again, the contract address is no longer a single global
fallback — it's keyed per network in `src/lib/chain.ts`, right next to the
network's own RPC/explorer/chain-ID, so switching
`NEXT_PUBLIC_GENLAYER_NETWORK` switches the address with it.

| `NEXT_PUBLIC_GENLAYER_NETWORK` | Chain | ID | RPC used | Default contract address |
| --- | --- | --- | --- | --- |
| `studioDevnet` (**default**) | Studio Next | 61997 | `https://studio-next.genlayer.com/api` (override; SDK default is `studio-dev.genlayer.com` — see below) | `0x6f8D867fB662fd0f07fd529E2369A46D12F52d6A` |
| `testnetBradbury` | GenLayer Bradbury Testnet | 4221 | `https://rpc-bradbury.genlayer.com` (native, from `genlayer-js/chains`) | `0x8188f355d6ebED82774A670daCA414B34656a855` |
| `studionet` | GenLayer StudioNet | 61999 | `https://studio.genlayer.com/api` (native) | `0x0ef4Dc745B60609cFeDE21340A8cDbE4B0058525` — **unconfirmed on this chain**, carried over from before the Studio Next migration |

**Why `studioDevnet` is the default:** asked directly which to default to,
the answer was "use Studio, to avoid more trouble" — so that's what's wired
in. `testnetBradbury` is fully, natively supported by `genlayer-js` (its RPC,
explorer and consensus contract all come straight from the SDK, no URL
overrides needed) and is a real public testnet rather than a Studio sandbox,
so it's a reasonable alternative if Studio Next turns out not to be required,
or not to work. Switch with:

```
NEXT_PUBLIC_GENLAYER_NETWORK=testnetBradbury
```

To override the address independently of network (e.g. you redeployed again
and don't want to edit `chain.ts`):

```
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
```

### Why Studio Next needs a hostname override and Bradbury doesn't

`genlayer-js@2.0.0-rc.1`'s own `studioDevnet` chain object points at
`studio-dev.genlayer.com` by default, not `studio-next.genlayer.com`.
Multiple other live GenLayer hackathon projects confirm both hostnames answer
`eth_chainId = 0xf22d` (61997) — the same chain under two names, not two
different networks — so `chain.ts` overrides just the RPC/explorer/IDE URLs
for `studioDevnet`, leaving the chain ID and consensus contract untouched.
`testnetBradbury` needed no such treatment: its RPC
(`rpc-bradbury.genlayer.com`), explorer (`explorer-bradbury.genlayer.com`)
and consensus contract are all correct as shipped.

One more real difference: Studio chains set `isStudio: true`, which makes
`genlayer-js`'s own wallet-chain-mismatch guard (`assertChainMatch`) a
documented no-op. Bradbury does not set that flag, so the SDK's own guard
actually runs there. Either way, this app's own `networkConfirmed` gate
(`WalletProvider.tsx`) is what actually blocks signing on the wrong chain —
treat the SDK guard as a bonus on Bradbury, not a given.

### Confirm the contract address yourself before trusting it

None of the three RPCs above (`studio-next.genlayer.com`, `studio.genlayer.com`,
`rpc-bradbury.genlayer.com`) are reachable from the sandbox this project was
built in — its network egress is restricted to package registries, so every
claim about which network a given contract address lives on in this file was
verified by reading other projects' public source, not by directly querying
these RPCs. Run this yourself, from a machine with normal internet access,
before deploying — swap the URL for whichever network you're checking:

```bash
curl -X POST https://studio-next.genlayer.com/api \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getCode","params":["<your contract address>","latest"],"id":1}'
```

A `result` longer than `"0x"` means the contract's bytecode is really there.
An empty `"0x"` means it isn't — either it's deployed elsewhere, or it hasn't
been deployed to this network at all. A contract address only exists on the
chain it was actually deployed to; no frontend configuration changes that.

---

## Configuration

Copy `.env.example` to `.env.local` and adjust:

| Variable                        | Default                                      | Purpose                                          |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------ |
| `NEXT_PUBLIC_CONTRACT_ADDRESS`  | per-network, see table above                  | Override the active network's default contract.    |
| `NEXT_PUBLIC_GENLAYER_NETWORK`  | `studioDevnet`                                | `studioDevnet` (Studio Next), `testnetBradbury`, or `studionet`. |
| `NEXT_PUBLIC_GENLAYER_RPC_URL`  | the chain's own RPC                           | Override the RPC endpoint.                        |
| `NEXT_PUBLIC_EXPLORER_URL`      | the chain's own explorer                      | Override the explorer. Links are hidden if unset. |

All four are `NEXT_PUBLIC_` and therefore visible in the browser. That is
correct: none of them is a secret, and the app holds no private keys.

## Running locally

```bash
npm install
npm run dev            # http://localhost:3000
npm run build          # production build
npm run typecheck      # tsc --noEmit
npm run check:identity # the transaction-identity guard, see below
```

Requires Node 18.6+ and a browser wallet (an EIP-1193 provider such as MetaMask)
set to the network above.

## Deploying to Vercel

1. Push this folder to a Git repository.
2. In Vercel, **Add New → Project** and import it. If this repo also contains
   `contract/` alongside `frontend/`, set **Root Directory** to `frontend` —
   Vercel needs to run the build from inside this folder, where
   `package.json` and `next.config.mjs` live.
3. `vercel.json` in this folder pins `"framework": "nextjs"`, so the
   **Framework Preset** is forced to Next.js regardless of what Vercel's
   auto-import UI shows. Leave the build command and output directory alone.
4. Under **Settings → Environment Variables**, add at least
   `NEXT_PUBLIC_CONTRACT_ADDRESS` and `NEXT_PUBLIC_GENLAYER_NETWORK` for
   Production, Preview and Development.
5. Deploy.

No server-side secrets, no database, no API routes — the app reads and writes
directly from the browser against the GenLayer RPC.

### If the build succeeds but the deploy fails with "No Output Directory named 'public' found"

This is Vercel serving the project as a generic static site instead of as
Next.js — it means the **Framework Preset** in Project Settings → General is
set to "Other", so Vercel expects a static `public/` folder instead of
invoking the Next.js adapter on `.next/`. `next build` succeeding locally (or
in the build log) says nothing about this setting; it's applied at the
deploy step, after the build. Two fixes, either is enough on its own:

- **Immediate, no redeploy of code needed:** Project Settings → General →
  Build & Development Settings → Framework Preset → select **Next.js** →
  Save → go to Deployments → redeploy the latest one.
- **Permanent:** this repo's `vercel.json` (`{"framework": "nextjs"}`) forces
  this regardless of the dashboard setting, so a fresh import of the same repo
  won't hit it again. If you deployed from a zip or a repo made before this
  file existed, add it and push again.

Alternatively, from this folder:

```bash
npx vercel --prod
```

---

## Transaction identity — the rule this codebase is built around

A previous project was rejected for resolving "which record did I just create?"
by diffing a wallet's list of records. That approach cannot distinguish two
submissions made at nearly the same time by the same wallet, so it eventually
attributes the wrong record to the wrong submission.

This app never has to answer that question:

1. `generateClaimId()` (`src/lib/claimId.ts`) draws a 256-bit ID from
   `crypto.getRandomValues`, in the browser.
2. The submit page writes the evidence to `localStorage` under that exact ID and
   immediately navigates to `/claim/<that ID>` — **before** the wallet is opened
   and before any transaction exists.
3. The claim page reads its ID from the URL and signs `submit_claim` with it.
4. Every read is `get_claim(<that exact ID>)`. There is no
   `fetchLatestClaim`, no list diffing, no timestamp comparison, no lookup by
   array position, anywhere.
5. Reload, bookmark, or reopen months later: the URL already holds the ID.

Two tabs submitting at once own two different URLs from the first instant, so
there is no moment where they could cross.

`npm run check:identity` compiles the real modules and asserts this, including
concurrent generation, per-ID draft isolation, URL round-tripping, rejection of
malformed IDs, and 20,000 draws without a collision.

The local claim list (`/claims`) is a **bookmark list**, not a source of truth.
The contract has no enumeration method, so no app can list every claim. The list
sorts by a locally stored `savedAt` **for display order only**; each row links by
the exact ID it stores.

---

## Project structure

```
src/
  app/
    page.tsx              Landing
    app/page.tsx          Active requirements
    app/submit/page.tsx   Evidence form — generates the claim ID
    claim/[id]/page.tsx   One claim, addressed by its ID
    claims/page.tsx       Local bookmarks + open-by-ID
    organizer/page.tsx    "Manage rules" — one-shot set_requirements via a
                          dynamic per-rule input builder, never a JSON/text field
    icon.png              Favicon — auto-served by Next's app-router convention
    apple-icon.png         Apple touch icon — same convention, opaque background
    assets/allocyn-logo.png  Header wordmark image (transparent background)
  components/             AppShell, Header, ConnectWallet, NetworkStatus,
                          TransactionStatus, ClaimCard, RequirementsList,
                          EvidenceBlock, ConsensusMark, StatusBadge, CopyField,
                          States (Loading/Error/Empty/Notice), Button, Footer
  hooks/                  useWriteTransaction, useClaim, useRequirements
  lib/                    chain, contract, claimId, claimIndex, reads,
                          readClient, errors, format
scripts/identity-check.mjs
```

`icon.png` and `apple-icon.png` need no code or `<head>` markup — placing them
directly under `src/app/` is a Next.js App Router convention, and the
framework injects the right `<link rel="icon">` / `<link rel="apple-touch-icon">`
tags on every page automatically. To replace the logo, swap
`src/app/assets/allocyn-logo.png` and re-export `icon.png` / `apple-icon.png`
the same way (crop tight, transparent background for the favicon, opaque
background for the Apple icon since iOS renders transparency unpredictably).

Contract logic is confined to `src/lib` and `src/hooks`; components receive data
and render it.

## Transactions

All three writes go through `@genlayer/transaction-kit`:
`estimate()` → `submit()` → `track()`. Signing is blocked when the kit reports a
fee-policy `mismatch`, because the quote was built on stale prices.

| Transaction        | Who can send it                    | Reverts with                                                                     |
| ------------------ | ---------------------------------- | -------------------------------------------------------------------------------- |
| `set_requirements` | only the deploying wallet, once    | `only the organizer can set requirements`, `requirements already set`             |
| `submit_claim`     | any connected wallet               | `claim_id already exists`, `empty evidence`                                       |
| `evaluate_claim`   | any connected wallet               | `requirements not configured yet`, `claim not found`, `already evaluated`         |

When a transaction reverts, the app fetches the receipt and surfaces the
contract's exact `UserError` string rather than a generic failure message.

### Wallet network gate

`genlayer-js`'s own write path already pins transactions to legacy type
(`type: "0x0"`) and builds nonce/gas manually before calling
`eth_sendTransaction` on the injected provider — it does not rely on viem's
automatic EIP-1559 negotiation at any point, for local accounts or for
browser wallets like MetaMask. Read that source (`_sendTransaction` in
`genlayer-js/dist/index.js`) before assuming a fee/transaction-type bug
lives at the application layer; it usually doesn't.

What the SDK does **not** do is guard against a wallet being on the wrong
chain: its `assertChainMatch` check is a documented no-op whenever
`chainConfig.isStudio` is true, which both `studionet` and `studioDevnet`
are. This app's own `networkConfirmed` state (`WalletProvider.tsx`) is the
only thing standing between a mis-set wallet and a doomed transaction, so
every signing button gates on `networkConfirmed` — not on `!wrongNetwork`.
The distinction matters: right after connecting, `chainId` is briefly
`null` while the probe is in flight, which is "unknown", not "known
correct" — treating unknown as safe-to-sign fails open.

## Design tokens

Defined once in `src/app/globals.css` as CSS custom properties and exposed to
Tailwind in `tailwind.config.ts`.

- **Colour** — ground `#e7eae7`, surface `#f4f6f3`, ink `#131a17`, rule
  `#cdd3cc`, accent `#1d4e89`. Semantic: pending `#7d6317`, approved `#2b6242`,
  declined `#93291f`.
- **Type** — IBM Plex Sans for text, IBM Plex Mono for identifiers and evidence.
  Loaded from Google Fonts at runtime with real fallback stacks, so the build
  needs no network access.
- **Radius** — 2/3/4px. **Spacing** — Tailwind's 4px scale. **Motion** — one
  animation, the consensus mark resolving; `prefers-reduced-motion` respected.

## Known limits

- The contract has no way to list claims, so `/claims` only shows what this
  browser has seen.
- A verdict of `does_not_qualify` carries no stored reason, and the app does not
  invent one.
- There is no Sybil resistance and no duplicate-evidence detection. The landing
  page says so rather than implying otherwise.
- Next.js is pinned to `14.2.35`, the latest patch on the 14.x line as of this
  writing — it fixes the critical RSC vulnerability disclosed
  [2025-12-11](https://nextjs.org/blog/security-update-2025-12-11)
  (`npm audit` will otherwise warn on `14.2.15`). `postcss` is forced to
  `8.5.28` everywhere, including inside Next's own dependency tree, via the
  `overrides` field in `package.json` — Next 14.2.35 still bundles an older,
  vulnerable `postcss` internally that Vercel has not backported a fix for.
  `npm audit` will still report one `critical` finding against `next` itself:
  its only offered fix is a major-version jump to Next 16, which touches the
  App Router and React version and hasn't been attempted here — run
  `npm audit` before deploying to see whether a newer 14.x patch has shipped
  since.
