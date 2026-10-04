"use client";

import { createClient, createAccount } from "genlayer-js";
import type { GenLayerClient, GenLayerChain } from "genlayer-js/types";
import { chain, RPC_URL } from "./chain";

let cached: GenLayerClient<GenLayerChain> | null = null;

/**
 * A read-only client. GenLayer view calls are executed with a `from` account,
 * so an ephemeral throwaway account is generated for reads; it never signs
 * anything, never holds funds, and is not persisted.
 */
export function getReadClient(): GenLayerClient<GenLayerChain> {
  if (cached) return cached;
  cached = createClient({
    chain,
    endpoint: RPC_URL,
    account: createAccount(),
  }) as GenLayerClient<GenLayerChain>;
  return cached;
}
