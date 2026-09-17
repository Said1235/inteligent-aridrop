"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import IntelligentAirdrop from "../contracts/IntelligentAirdrop";
import { getContractAddress } from "../genlayer/client";
import { useWallet } from "../genlayer/wallet";
import { configError } from "../utils/toast";
import type { Claim } from "../contracts/types";

/**
 * Contract instance. Reads (get_requirements, get_claim) work without a
 * connected wallet — only submit_claim / evaluate_claim need one, and those
 * go through the transaction panel, not this hook.
 */
export function useIntelligentAirdropContract(): IntelligentAirdrop | null {
  const { address } = useWallet();
  const contractAddress = getContractAddress();

  const contract = useMemo(() => {
    if (!contractAddress) {
      configError(
        "Setup required",
        "Contract address not configured. Set NEXT_PUBLIC_CONTRACT_ADDRESS in frontend/.env.",
      );
      return null;
    }
    return new IntelligentAirdrop(contractAddress, address);
  }, [contractAddress, address]);

  return contract;
}

/** get_requirements() — the 3 (or N) fixed rules a claim is judged against. */
export function useRequirements() {
  const contract = useIntelligentAirdropContract();

  return useQuery<string[], Error>({
    queryKey: ["requirements"],
    queryFn: () => (contract ? contract.getRequirements() : Promise.resolve([])),
    enabled: !!contract,
    staleTime: 60_000, // fixed at deploy time, no need to refetch often
  });
}

/**
 * get_claim(claim_id). `claimId` is a decimal-string u256 generated
 * client-side before signing — never a value returned by a transaction.
 */
export function useClaim(claimId: string | null) {
  const contract = useIntelligentAirdropContract();

  return useQuery<Claim | null, Error>({
    queryKey: ["claim", claimId],
    queryFn: () => (contract && claimId ? contract.getClaim(claimId) : Promise.resolve(null)),
    enabled: !!contract && !!claimId,
    refetchOnWindowFocus: true,
    staleTime: 2000,
  });
}

export function useInvalidateClaim(claimId: string | null) {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["claim", claimId] });
  }, [queryClient, claimId]);
}
