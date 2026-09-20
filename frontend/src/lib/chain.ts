import { studionet, studioDevnet } from "genlayer-js/chains";
import type { GenLayerChain } from "genlayer-js/types";

/**
 * Network selection.
 *
 * genlayer-js@2.0.0-rc.1 ships exactly two Studio chains:
 *   studionet    id 61999  https://studio.genlayer.com/api
 *   studioDevnet id 61997  https://studio-dev.genlayer.com/api  (no explorer)
 *
 * The default here is `studionet`, because that is the network behind
 * studio.genlayer.com, where this project's contract is deployed. Override with
 * NEXT_PUBLIC_GENLAYER_NETWORK=studioDevnet if you redeploy elsewhere.
 */
export type NetworkKey = "studionet" | "studioDevnet";

const CHAINS: Record<NetworkKey, GenLayerChain> = {
  studionet: studionet as GenLayerChain,
  studioDevnet: studioDevnet as GenLayerChain,
};

function resolveKey(): NetworkKey {
  const raw = process.env.NEXT_PUBLIC_GENLAYER_NETWORK?.trim();
  return raw === "studioDevnet" ? "studioDevnet" : "studionet";
}

export const NETWORK_KEY = resolveKey();
export const chain: GenLayerChain = CHAINS[NETWORK_KEY];

export const CHAIN_ID: number = Number(chain.id);
export const CHAIN_ID_HEX = `0x${CHAIN_ID.toString(16)}` as const;
export const CHAIN_NAME: string = chain.name;

export const RPC_URL: string =
  process.env.NEXT_PUBLIC_GENLAYER_RPC_URL?.trim() || chain.rpcUrls.default.http[0];

/**
 * Explorer base. studioDevnet intentionally has no explorer in genlayer-js, so
 * this can legitimately be undefined and the UI must not render a dead link.
 */
export const EXPLORER_URL: string | undefined =
  process.env.NEXT_PUBLIC_EXPLORER_URL?.trim() ||
  (chain as { blockExplorers?: { default?: { url?: string } } }).blockExplorers?.default?.url ||
  undefined;

export function explorerTxUrl(hash: string): string | undefined {
  if (!EXPLORER_URL) return undefined;
  return `${EXPLORER_URL.replace(/\/$/, "")}/tx/${hash}`;
}

export function explorerAddressUrl(address: string): string | undefined {
  if (!EXPLORER_URL) return undefined;
  return `${EXPLORER_URL.replace(/\/$/, "")}/address/${address}`;
}

/** Where a human can open the contract in Studio. */
export const STUDIO_IMPORT_URL = (address: string) =>
  `https://studio.genlayer.com/?import-contract=${address}`;
