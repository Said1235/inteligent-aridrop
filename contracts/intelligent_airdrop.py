# { "Depends": "py-genlayer:9b8kjyda2ycxyq4ea6g4yfpnydxhd52gqba5rb8dw7krkh5mn9p0" }
#
# ⚠️ NOTE ON PROVENANCE
# The hackathon brief describes this contract as "already implemented and
# finalized" but only gave its public interface, not its source. This file
# implements exactly that interface (same method names, same signatures,
# same three claim states, no reward/payment logic of any kind) so the
# project is deployable end to end. If a different, already-deployed
# IntelligentAirdrop contract exists, deploy THAT one instead and just point
# NEXT_PUBLIC_CONTRACT_ADDRESS at it — the frontend only depends on the
# interface below, not on this file.
#
# Runner hash pinned above matches the one shipped in the v2-dev boilerplate's
# own example contract (contracts/football_bets.py), not the "current hash"
# from sdk.genlayer.com's docs (which was a different, likely newer value).
# The boilerplate's own pin is the more trustworthy source for what Studio
# Next actually expects right now, since docs and a live deployment can drift
# out of sync with each other. Still, this was not verified against a live
# `genlayer network` / deployment response — if deployment fails on a runner
# mismatch, that response is the authoritative source to re-check against.

from dataclasses import dataclass
import genlayer as gl
from genlayer.storage import allow as allow_storage

DEFAULT_REQUIREMENTS = [
    "The evidence describes one specific, completed action — not a plan, "
    "intention, or general summary of ongoing work.",
    "The evidence is checkable: it includes concrete, verifiable details "
    "(a link, a specific step, a specific output) that a third party could "
    "independently confirm.",
    "The evidence corresponds to the task defined for this campaign, not a "
    "different or unrelated task.",
]


@allow_storage
@dataclass
class Claim:
    claimant: gl.Address
    evidence_text: str
    status: str  # "pending" | "qualifies" | "does_not_qualify"


class IntelligentAirdrop(gl.contract.Contract):
    requirements: gl.storage.DynArray[str]
    claims: gl.storage.TreeMap[gl.u256, Claim]

    def __init__(self, requirements: list[str] = None):
        source = requirements if requirements else DEFAULT_REQUIREMENTS
        for requirement in source:
            self.requirements.append(requirement)

    @gl.public.view
    def get_requirements(self) -> list[str]:
        return list(self.requirements)

    @gl.public.write
    def submit_claim(self, claim_id: gl.u256, evidence_text: str) -> None:
        if not evidence_text.strip():
            raise gl.vm.UserError("empty evidence")
        if claim_id in self.claims:
            raise gl.vm.UserError("claim_id already exists")

        self.claims[claim_id] = Claim(
            claimant=gl.message.sender_address,
            evidence_text=evidence_text,
            status="pending",
        )

    @gl.public.write
    def evaluate_claim(self, claim_id: gl.u256) -> None:
        if claim_id not in self.claims:
            raise gl.vm.UserError("claim not found")

        claim = self.claims[claim_id]
        if claim.status != "pending":
            raise gl.vm.UserError("already evaluated")

        requirements_block = "\n".join(f"- {r}" for r in self.requirements)
        evidence_text = claim.evidence_text

        def get_verdict() -> str:
            task = f"""You are judging whether submitted evidence satisfies ALL of the
following requirements for a task-completion claim.

Requirements:
{requirements_block}

Evidence submitted by the claimant:
\"\"\"
{evidence_text}
\"\"\"

Respond with exactly one word and nothing else: "qualifies" if the evidence
genuinely satisfies every requirement above, or "does_not_qualify" if it
does not (including if it is vague, unverifiable, or unrelated to the task).
"""
            return gl.nondet.exec_prompt(task).strip().lower()

        verdict = gl.eq_principle.prompt_comparative(
            get_verdict,
            "The output must be exactly one of the two literal strings "
            "'qualifies' or 'does_not_qualify'. Validators must reach the "
            "same verdict when judging this evidence against the same "
            "requirements listed above.",
        )

        if "does_not_qualify" in verdict:
            claim.status = "does_not_qualify"
        elif "qualifies" in verdict:
            claim.status = "qualifies"
        else:
            # Malformed leader output: fail closed rather than guess.
            claim.status = "does_not_qualify"

        self.claims[claim_id] = claim

    @gl.public.view
    def get_claim(self, claim_id: gl.u256) -> dict:
        if claim_id not in self.claims:
            raise gl.vm.UserError("claim not found")

        claim = self.claims[claim_id]
        return {
            "claimant": claim.claimant,
            "evidence_text": claim.evidence_text,
            "status": claim.status,
        }
