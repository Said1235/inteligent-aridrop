import { createClient } from "genlayer-js";
import { GENLAYER_CHAIN } from "../genlayer/client";
import type { Claim, RawClaim } from "./types";

/**
 * IntelligentAirdrop read-only wrapper.
 *
 * Writes (submit_claim, evaluate_claim) are NOT exposed here — per the
 * boilerplate's own pattern (see CreateBetModal.tsx upstream), writes go
 * straight through @genlayer/transaction-kit-react's
 * <GenLayerTransactionPanel /> so the user sees real fee estimation, signing,
 * and consensus tracking rather than a wrapper hiding those steps.
 */
class IntelligentAirdrop {
  private contractAddress: `0x${string}`;
  private client: any;

  constructor(contractAddress: string, address?: string | null) {
    this.contractAddress = contractAddress as `0x${string}`;

    const config: any = { chain: GENLAYER_CHAIN };
    if (address) {
      config.account = address as `0x${string}`;
    }
    this.client = createClient(config);
  }

  updateAccount(address: string): void {
    this.client = createClient({
      chain: GENLAYER_CHAIN,
      account: address as `0x${string}`,
    });
  }

  /** get_requirements() -> list[str] */
  async getRequirements(): Promise<string[]> {
    try {
      const requirements: any = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_requirements",
        args: [],
      });

      if (Array.isArray(requirements)) {
        return requirements.map((r) => String(r));
      }
      return [];
    } catch (error) {
      console.error("Error fetching requirements:", error);
      throw new Error("Failed to fetch requirements from contract");
    }
  }

  /**
   * get_claim(claim_id) -> {claimant, evidence_text, status}
   * Returns null (not an error) when the contract raises "claim not found" —
   * that is a normal, expected state for a claim_id nobody has submitted yet
   * or that was mistyped, per the non-negotiable error-handling spec.
   */
  async getClaim(claimId: string): Promise<Claim | null> {
    try {
      const raw: RawClaim = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_claim",
        args: [claimId],
      });

      if (!raw) return null;

      return {
        claimant: String(raw.claimant),
        evidenceText: String(raw.evidence_text),
        status: (raw.status || "pending") as Claim["status"],
      };
    } catch (error: any) {
      const message = String(error?.message ?? error ?? "");
      if (message.toLowerCase().includes("claim not found")) {
        return null;
      }
      console.error("Error fetching claim:", error);
      throw new Error("Failed to fetch claim from contract");
    }
  }
}

export default IntelligentAirdrop;
