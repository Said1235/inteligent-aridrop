"use client";

import { CONTRACT_ADDRESS, METHODS, isClaimStatus, type Claim } from "./contract";
import { getReadClient } from "./readClient";

/**
 * Calldata decodes maps either as a JS `Map` or as a plain object depending on
 * the value, so read both shapes rather than assuming one.
 */
function field(source: unknown, key: string): unknown {
  if (source instanceof Map) return source.get(key);
  if (source && typeof source === "object") return (source as Record<string, unknown>)[key];
  return undefined;
}

function asText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  if (value instanceof Uint8Array) {
    return `0x${Array.from(value, (b) => b.toString(16).padStart(2, "0")).join("")}`;
  }
  if (typeof value === "object" && "toString" in value) return String(value);
  return String(value);
}

export async function fetchRequirements(): Promise<string[]> {
  const result = await getReadClient().readContract({
    address: CONTRACT_ADDRESS,
    functionName: METHODS.getRequirements,
    args: [],
  });

  if (!Array.isArray(result)) return [];
  return result.map((item) => asText(item)).filter((item) => item.length > 0);
}

export class ClaimNotFoundError extends Error {
  constructor() {
    super("claim not found");
    this.name = "ClaimNotFoundError";
  }
}

/**
 * Read one claim by its exact id. There is deliberately no
 * `fetchLatestClaim`, `fetchMyClaims` or any other lookup that could return a
 * different claim than the one asked for.
 */
export async function fetchClaim(claimId: bigint): Promise<Claim> {
  let result: unknown;
  try {
    result = await getReadClient().readContract({
      address: CONTRACT_ADDRESS,
      functionName: METHODS.getClaim,
      args: [claimId],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("claim not found")) throw new ClaimNotFoundError();
    throw error;
  }

  const status = asText(field(result, "status"));
  if (!isClaimStatus(status)) {
    throw new Error(`Unexpected claim status from the contract: ${status || "(empty)"}`);
  }

  return {
    claimant: asText(field(result, "claimant")),
    evidenceText: asText(field(result, "evidence_text")),
    status,
  };
}
