import type { Address } from "genlayer-js/types";

const FALLBACK_ADDRESS = "0x0ef4Dc745B60609cFeDE21340A8cDbE4B0058525";

const raw = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS?.trim() || FALLBACK_ADDRESS) as string;

export const CONTRACT_ADDRESS = raw as Address;

export const isValidAddress = (value: string) => /^0x[0-9a-fA-F]{40}$/.test(value);

/**
 * The contract's complete surface. Five methods, no more. Keeping the names in
 * one place means a typo is a compile error rather than a runtime revert.
 */
export const METHODS = {
  setRequirements: "set_requirements",
  submitClaim: "submit_claim",
  evaluateClaim: "evaluate_claim",
  getRequirements: "get_requirements",
  getClaim: "get_claim",
} as const;

export type ClaimStatus = "pending" | "qualifies" | "does_not_qualify";

export type Claim = {
  claimant: string;
  evidenceText: string;
  status: ClaimStatus;
};

export const isClaimStatus = (v: unknown): v is ClaimStatus =>
  v === "pending" || v === "qualifies" || v === "does_not_qualify";

/** Human wording for each on-chain status. The contract stores no reason. */
export const STATUS_LABEL: Record<ClaimStatus, string> = {
  pending: "Pending review",
  qualifies: "Approved",
  does_not_qualify: "Not approved",
};

export const STATUS_DESCRIPTION: Record<ClaimStatus, string> = {
  pending: "No evaluation has been recorded yet. Anyone can request one.",
  qualifies: "Validators agreed the evidence satisfies every active requirement.",
  does_not_qualify:
    "Validators did not agree the evidence satisfies every active requirement. The contract does not store a reason.",
};
