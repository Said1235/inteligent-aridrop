# Intelligent Airdrop — evidence-based eligibility oracle

Not a token faucet. Someone did real work, describes it as evidence, and a
consensus of independent AI validators judges whether that evidence
genuinely satisfies a fixed, public set of requirements — `qualifies` or
`does_not_qualify`. What happens with that verdict (a payout, access,
anything else) is explicitly the job of a *different* system; this contract
only settles the judgment.

Built on the [GenLayer project boilerplate](https://github.com/genlayerlabs/genlayer-project-boilerplate)
(`v2-dev` branch), targeting **GenLayer Studio Next** (Consensus v0.6).

## Why decentralized judgment matters here

A single backend judging its own campaign has no accountability — it could
quietly favor or reject claims and nobody could check. Here the
requirements are public (`get_requirements()`), the evidence is public
(`get_claim()`), and the verdict comes from a validator consensus checking
the same criteria anyone else can read, not a private rule engine.

## Project structure

```
contracts/intelligent_airdrop.py   → the Intelligent Contract (Python)
deploy/deployScript.ts             → deploy script, run by the GenLayer CLI
frontend/                          → Next.js 15 app (App Router)
  app/page.tsx                     → Landing + Submit (single page)
  app/claim/[id]/page.tsx          → Claim Detail
  components/                      → StatusBadge, RequirementsList, WalletButton, TechnicalField
  lib/contracts/                   → read-only contract wrapper + types
  lib/genlayer/                    → client/network/wallet/transaction-kit setup (from the boilerplate, unchanged)
  lib/hooks/                       → TanStack Query hooks
  lib/utils/claimId.ts             → client-side u256 claim_id generator
```

## Contract interface (only these 4 methods exist)

```python
submit_claim(claim_id: u256, evidence_text: str) -> None
evaluate_claim(claim_id: u256) -> None
get_claim(claim_id: u256) -> dict  # {claimant, evidence_text, status}
get_requirements() -> list[str]
```

States: `pending` | `qualifies` | `does_not_qualify`. No `pay_claim`. No
reward amount, no token, no transfer, anywhere in this contract.

> **Note on provenance:** the hackathon brief described this contract as
> "already implemented" but only gave its interface, not its source. This
> repo implements that exact interface so the project is deployable end to
> end. If a different IntelligentAirdrop contract is already deployed
> somewhere, deploy that one instead and just point
> `NEXT_PUBLIC_CONTRACT_ADDRESS` at it — the frontend only depends on the
> interface above, nothing else.

## 1. Deploy the contract

Requirements: Python ≥ 3.12, GenLayer CLI (`npm install -g genlayer`).

```shell
genlayer network        # choose Studio Next
genlayer deploy         # runs deploy/deployScript.ts against contracts/intelligent_airdrop.py
```

No constructor args are required — the contract falls back to 3 hardcoded
default requirements if none are passed. Pass a `list[str]` as the deploy
arg for a custom requirements list.

Copy the deployed contract address from the CLI output.

## 2. Run the frontend locally

```shell
cd frontend
cp .env.example .env
# edit .env: set NEXT_PUBLIC_CONTRACT_ADDRESS to the address from step 1
npm install
npm run dev
```

App runs at `http://localhost:3000`.

## 3. Deploy the frontend (Netlify / Vercel)

The Next.js app lives in `frontend/`, not the repo root, so on **both**
platforms set the project's **base / root directory to `frontend`**.

- **Vercel:** import the repo → set *Root Directory* to `frontend` in
  project settings → add the 4 env vars from `frontend/.env.example` (with
  your real contract address) → deploy. Vercel auto-detects Next.js, no
  extra config file needed.
- **Netlify:** import the repo → set *Base directory* to `frontend` →
  Netlify picks up `frontend/netlify.toml` (already included, uses
  `@netlify/plugin-nextjs`) → add the same 4 env vars in Site settings →
  Environment → deploy.

⚠️ **UNVERIFIED**: `frontend/netlify.toml` follows Netlify's documented
Next.js plugin setup but wasn't tested against a live Netlify deploy in
this session — if the build fails there, check Netlify's current
Next.js-runtime docs first, since Next 15/16 + App Router support on
Netlify has changed across plugin versions.

## 4. Verify a result yourself (official review criterion #6)

1. Open the deployed app, connect a wallet with Studio Next test funds.
2. Go to the home page, read the 3 (or N) requirements pulled live from
   `get_requirements()`.
3. Write evidence, review it, sign `submit_claim` — you land on
   `/claim/{claim_id}` immediately (that ID was generated in your browser
   before you signed anything).
4. On that page, click **Request evaluation** (anyone can do this, not just
   the submitter) and sign `evaluate_claim`.
5. Wait — "Validators are reviewing this evidence." (no fake percentage).
   When it resolves, the badge flips to **Qualifies** or **Not approved**.
6. Anyone can independently confirm this by opening the same
   `/claim/{claim_id}` URL and reading `get_claim()` directly — no wallet
   needed for that, reads are public.

## ⚠️ UNVERIFIED / BLOCKED items (reported, not hidden)

1. **Runner hash** — `contracts/intelligent_airdrop.py`'s first line now
   matches the hash pinned in the boilerplate's own example contract
   (`contracts/football_bets.py` in `v2-dev`), which is a more trustworthy
   source than a possibly-stale docs page. It was **not** verified against
   a live deployment response. If `genlayer deploy` fails on a runner
   mismatch, that error is the authoritative source to re-check against.
2. **Netlify deploy** — config included, not live-tested (see above).
3. **Fee profile** — the boilerplate ships a `fee-profile.json` mechanism
   for `@genlayer/transaction-kit` (`npm run test:fees` against a running
   Studio instance) that was not regenerated for this contract; the app
   runs on network fee defaults, which the boilerplate's own docs say is
   fine but not fee-optimized.
4. **`@genlayer/transaction-kit` internals** were not read directly from
   `node_modules/.d.ts` in this session (network/time constraints) — the
   integration follows the real, working usage already present in the
   boilerplate's own `CreateBetModal.tsx`, per the fallback priority you
   specified, not invented by analogy with other wallet SDKs.

## 🎥 Reminder: video demo required

Per the hackathon announcement, a video demo showing the app working
end-to-end (submit → request evaluation → verdict) is **mandatory**, even
though the Portal form may mark it optional. That recording is a separate
task for you — it isn't something this implementation covers.
