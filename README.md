# Allocyn

An eligibility oracle on GenLayer, built on the `IntelligentAirdrop`
Intelligent Contract. An organizer publishes a fixed set of
requirements once; a claimant submits free-text evidence; independent AI
validators decide whether the evidence satisfies every requirement; the
contract records `qualifies` or `does_not_qualify`.

**No tokens move through this contract.** It is a pure eligibility oracle —
paying, granting access or minting is the job of a separate system.

This package has two independent parts:

```
intelligent-airdrop/
├── contract/     The Intelligent Contract itself, plus its tests
└── frontend/     The Next.js app that talks to it
```

Each has its own README-level instructions below. `contract/` needs Python and
the GenLayer tooling; `frontend/` needs only Node. Neither depends on the
other at build time — the frontend talks to the contract purely over RPC, at
whatever address you deploy it to.

**On the two names:** "Allocyn" is the product's brand name — what the
frontend, the logo and the browser tab show. `IntelligentAirdrop` is the
on-chain contract's own class name, set before the product was named and left
untouched here on purpose: renaming it would mean redeploying and re-running
every test in `contract/tests/` against a new address. The frontend never
shows that name to a claimant or an organizer.

---

## contract/

```
contract/
├── contracts/
│   └── intelligent_airdrop.py       The contract. Five methods, no more.
└── tests/
    ├── direct/                      Fast in-process tests (genlayer-test)
    │   ├── conftest.py
    │   └── test_intelligent_airdrop.py
    └── integration/                 Optional: a real deploy against GLSim
        └── test_deploy_glsim.py
```

### The contract's surface

| Method | Who can call it | Notes |
| --- | --- | --- |
| `set_requirements(requirements: list[str])` | only the deploying wallet (`organizer`) | exactly once — reverts with `requirements already set` afterwards |
| `submit_claim(claim_id: u256, evidence_text: str)` | anyone | `claim_id` is chosen by the caller, generated client-side |
| `evaluate_claim(claim_id: u256)` | anyone | reverts with `requirements not configured yet` if called before `set_requirements` |
| `get_requirements() -> list[str]` | anyone, view | |
| `get_claim(claim_id: u256) -> dict` | anyone, view | `{claimant, evidence_text, status}` |

The constructor takes **no arguments** — this is deliberate, not an
oversight. A `list[str]` constructor parameter renders as a broken
`[object Object]` field in the Studio deploy form; moving requirement
configuration to a post-deploy, one-shot call sidesteps that and also closes a
real gap (an empty rule set would otherwise be vacuously satisfied by any
evidence). `organizer` is set from `gl.message.sender_address` at deploy time
and is never a parameter anyone can pass in.

Runner pinned in the contract header:
`py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6` — the
stable GenVM v0.2.16 line, confirmed against the official docs and against
the linter's own resolution of the latest stable runner. The newer syntax
documented at `sdk.genlayer.com/main` (`import genlayer as gl`,
`gl.contract.Contract`) belongs to the still-unreleased v0.3 line and is
**not** compatible with this runner — don't "upgrade" the imports.

### Running the tests

```bash
cd contract
pip install genlayer-test genvm-linter --break-system-packages

genvm-lint check contracts/intelligent_airdrop.py --json
pytest tests/direct/ -v
```

Expect:

```
{"ok":true,"lint":{"ok":true,"passed":3},"validate":{"ok":true,"contract":"IntelligentAirdrop","methods":5,"view_methods":2,"write_methods":3,"ctor_params":0}}
29 passed
```

`tests/integration/test_deploy_glsim.py` is optional and skips itself unless
a GLSim instance is reachable on `127.0.0.1:4000`:

```bash
pip install "genlayer-test[sim]"
glsim --port 4000 --validators 5      # separate terminal
pytest tests/integration/ -v -s
```

GLSim caveat, documented in that file: it runs the Python runner natively and
keeps module state across deploys, so only the **first** deploy in a given
GLSim process succeeds — restart GLSim between deploys. That is a GLSim
artifact, not a contract defect.

### Deploying

Import `contracts/intelligent_airdrop.py` in GenLayer Studio (or deploy it
however you deploy elsewhere), with **zero constructor arguments**. Then call
`set_requirements` once, from the same wallet that deployed it, before
anyone's claim can be evaluated.

---

## frontend/

A Next.js app. Full detail — including the network configuration you need to
get right before deploying — is in `frontend/README.md`. Short version:

```bash
cd frontend
npm install
cp .env.example .env.local     # set NEXT_PUBLIC_CONTRACT_ADDRESS, verify the network
npm run dev                    # http://localhost:3000
npm run check:identity         # the transaction-identity guard
npm run build
```

Deploy to Vercel with `npx vercel --prod`, or by importing the repo — set the
same environment variables in the Vercel dashboard.

**Read the network section in `frontend/README.md` before deploying.** The
brief's "Studio Next, chain 61997" does not match any chain shipped in
`genlayer-js@2.0.0-rc.1`; the app defaults to `studionet` (chain 61999,
`studio.genlayer.com`), which is what your Studio import link points at.
Confirm this matches where you actually deployed the contract.

### The one rule this frontend is built around

A claim's identity is a random 256-bit ID generated **in the browser**,
before any transaction is built or signed. The app navigates to
`/claim/<that id>` immediately, and every later read — reload, days later,
a different device — uses that exact ID. Nothing in the codebase identifies a
claim by "the most recent one" or by diffing a wallet's transaction list;
`frontend/scripts/identity-check.mjs` (`npm run check:identity`) asserts this
against the real, compiled source, including a concurrent-submission
scenario.

---

## Verified, and what wasn't

Both `contract/` and `frontend/` were checked against installed tooling and
the real package sources — not from memory. What could **not** be checked
from this environment: `studio.genlayer.com` and its RPC are unreachable here
(network egress is restricted to a package-registry allowlist), so no read or
write in this package has been run against your actual deployed contract.
Confirm the network setting and run the app against it before treating this
as production-ready.
