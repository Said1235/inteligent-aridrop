import { studionet, studioDevnet } from "genlayer-js/chains";
import type { GenLayerChain } from "genlayer-js/types";

/**
 * Network selection.
 *
 * genlayer-js@2.0.0-rc.1 ships exactly two Studio chains:
 *   studionet    id 61999  https://studio.genlayer.com/api        (old StudioNet)
 *   studioDevnet id 61997  https://studio-dev.genlayer.com/api    (no explorer in the SDK)
 *
 * The project's original contract address was deployed via studio.genlayer.com
 * (studionet, 61999), but this hackathon's own announcement requires "Studio
 * Next" — chain 61997, publicly reachable at studio-next.genlayer.com rather
 * than the SDK's default studio-dev.genlayer.com hostname. Multiple other
 * live GenLayer hackathon projects confirm studio-next.genlayer.com and
 * studio-dev.genlayer.com both answer eth_chainId = 61997 and are the same
 * network under two hostnames — this file treats them as the same chain with
 * an overridden RPC/explorer, not a third, separate network.
 *
 * Default here is `studioDevnet`, with its RPC/explorer/Studio-IDE URLs
 * pointed at the studio-next.genlayer.com hostnames. Override with
 * NEXT_PUBLIC_GENLAYER_NETWORK=studionet to go back to the old chain, or with
 * NEXT_PUBLIC_GENLAYER_RPC_URL / NEXT_PUBLIC_EXPLORER_URL to point at neither.
 */
export type NetworkKey = "studionet" | "studioDevnet";

const CHAINS: Record<NetworkKey, GenLayerChain> = {
  studionet: studionet as GenLayerChain,
  studioDevnet: studioDevnet as GenLayerChain,
};

/** Per-network defaults that the SDK's own chain objects don't carry. */
const NETWORK_DEFAULTS: Record<
  NetworkKey,
  { rpcUrl: string; explorerUrl: string; studioIdeUrl: string; displayName: string }
> = {
  studionet: {
    rpcUrl: "https://studio.genlayer.com/api",
    explorerUrl: "https://explorer-studio.genlayer.com",
    studioIdeUrl: "https://studio.genlayer.com",
    displayName: "GenLayer StudioNet",
  },
  studioDevnet: {
    rpcUrl: "https://studio-next.genlayer.com/api",
    explorerUrl: "https://explorer-studio-dev.genlayer.com",
    studioIdeUrl: "https://studio-next.genlayer.com",
    // genlayer-js's own chain object names this "GenLayer Studio Devnet" —
    // overridden here because this hackathon calls chain 61997 "Studio Next"
    // and showing the SDK's internal name in the UI would read as a mismatch.
    // The chain id, RPC and consensus contract are untouched; this is display only.
    displayName: "GenLayer Studio Next",
  },
};

function resolveKey(): NetworkKey {
  const raw = process.env.NEXT_PUBLIC_GENLAYER_NETWORK?.trim();
  return raw === "studionet" ? "studionet" : "studioDevnet";
}

export const NETWORK_KEY = resolveKey();
export const chain: GenLayerChain = CHAINS[NETWORK_KEY];
const defaults = NETWORK_DEFAULTS[NETWORK_KEY];

export const CHAIN_ID: number = Number(chain.id);
export const CHAIN_ID_HEX = `0x${CHAIN_ID.toString(16)}` as const;
export const CHAIN_NAME: string = defaults.displayName;

export const RPC_URL: string = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL?.trim() || defaults.rpcUrl;

export const EXPLORER_URL: string =
  process.env.NEXT_PUBLIC_EXPLORER_URL?.trim() || defaults.explorerUrl;

export function explorerTxUrl(hash: string): string {
  return `${EXPLORER_URL.replace(/\/$/, "")}/tx/${hash}`;
}

export function explorerAddressUrl(address: string): string {
  return `${EXPLORER_URL.replace(/\/$/, "")}/address/${address}`;
}

/** Where a human can open the contract in the Studio IDE for the active network. */
export const STUDIO_IMPORT_URL = (address: string) =>
  `${defaults.studioIdeUrl}/?import-contract=${address}`;
