export type ClaimStatus = "pending" | "qualifies" | "does_not_qualify";

export interface Claim {
  claimant: string;
  evidenceText: string;
  status: ClaimStatus;
}

/** Raw shape as returned by genlayer-js's readContract for get_claim(). */
export interface RawClaim {
  claimant: string;
  evidence_text: string;
  status: string;
}
