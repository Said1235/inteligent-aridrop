import { studionet, studioDevnet, testnetBradbury } from "genlayer-js/chains";
import type { GenLayerChain } from "genlayer-js/types";

/**
 * Network selection.
 *
 * genlayer-js@2.0.0-rc.1 ships three relevant chains:
 *   studionet       id 61999  https://studio.genlayer.com/api       (old StudioNet, isStudio: true)
 *   studioDevnet    id 61997  https://studio-dev.genlayer.com/api   (Studio Next, isStudio: true, no native explorer)
 *   testnetBradbury id 4221   https://rpc-bradbury.genlayer.com     (public testnet, isStudio: false — full native support)
 *
 * Both Studio chains set `isStudio: true`, which makes genlayer-js's own
 * `assertChainMatch` wallet-chain guard a documented no-op
 * (`if (chainConfig.isStudio) return;`). Bradbury does NOT set that flag, so
 * the SDK's own guard actually runs there — one more reason this app's own
 * `networkConfirmed` gate (see WalletProvider.tsx) must never be skipped
 * regardless of which of these three is active.
 *
 * "Studio Next" (studioDevnet here) is reachable at studio-next.genlayer.com
 * rather than the SDK's own default studio-dev.genlayer.com hostname; other
 * live GenLayer hackathon projects confirm both hostnames answer
 * eth_chainId = 61997 — the same chain under two names, not a third network.
 * That override lives in NETWORK_DEFAULTS below, same as before.
 *
 * Default here is `studioDevnet` ("Studio Next"), per explicit instruction to
 * default to Studio to avoid complications. Switch with:
 *   NEXT_PUBLIC_GENLAYER_NETWORK=testnetBradbury   (the public testnet)
 *   NEXT_PUBLIC_GENLAYER_NETWORK=studionet          (the older Studio chain)
 */
export type NetworkKey = "studionet" | "studioDevnet" | "testnetBradbury";

const CHAINS: Record<NetworkKey, GenLayerChain> = {
  studionet: studionet as GenLayerChain,
  studioDevnet: studioDevnet as GenLayerChain,
  testnetBradbury: testnetBradbury as GenLayerChain,
};

/**
 * Per-network overrides and the contract address last known deployed on each
 * network. Keeping the address here, keyed by network, is deliberate: a
 * contract address is only ever valid on the one chain it was deployed to,
 * so switching NEXT_PUBLIC_GENLAYER_NETWORK now automatically switches to the
 * address that actually belongs to that network, instead of carrying over a
 * single global fallback that silently goes stale the next time this project
 * redeploys to a different chain. NEXT_PUBLIC_CONTRACT_ADDRESS still
 * overrides whichever of these is picked.
 */
const NETWORK_DEFAULTS: Record<
  NetworkKey,
  {
    rpcUrl?: string;
    explorerUrl?: string;
    studioIdeUrl?: string;
    displayName: string;
    defaultContractAddress: string;
  }
> = {
  studionet: {
    rpcUrl: "https://studio.genlayer.com/api",
    explorerUrl: "https://genlayer-explorer.vercel.app", // the chain's own native explorer
    studioIdeUrl: "https://studio.genlayer.com",
    displayName: "GenLayer StudioNet",
    // Last known deployed here; unconfirmed on this exact network — see README.
    defaultContractAddress: "0x0ef4Dc745B60609cFeDE21340A8cDbE4B0058525",
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
    defaultContractAddress: "0x6f8D867fB662fd0f07fd529E2369A46D12F52d6A",
  },
  testnetBradbury: {
    // No overrides: this chain's own RPC/explorer from genlayer-js/chains are
    // used as-is (see chain.blockExplorers / chain.rpcUrls below).
    displayName: "GenLayer Bradbury Testnet",
    defaultContractAddress: "0x8188f355d6ebED82774A670daCA414B34656a855",
  },
};

function resolveKey(): NetworkKey {
  const raw = process.env.NEXT_PUBLIC_GENLAYER_NETWORK?.trim();
  if (raw === "studionet" || raw === "testnetBradbury") return raw;
  return "studioDevnet";
}

export const NETWORK_KEY = resolveKey();
export const chain: GenLayerChain = CHAINS[NETWORK_KEY];
const defaults = NETWORK_DEFAULTS[NETWORK_KEY];

export const CHAIN_ID: number = Number(chain.id);
export const CHAIN_ID_HEX = `0x${CHAIN_ID.toString(16)}` as const;
export const CHAIN_NAME: string = defaults.displayName;

export const RPC_URL: string =
  process.env.NEXT_PUBLIC_GENLAYER_RPC_URL?.trim() ||
  defaults.rpcUrl ||
  chain.rpcUrls.default.http[0];

const nativeExplorer = (chain as { blockExplorers?: { default?: { url?: string } } })
  .blockExplorers?.default?.url;

export const EXPLORER_URL: string =
  process.env.NEXT_PUBLIC_EXPLORER_URL?.trim() || defaults.explorerUrl || nativeExplorer || "";

export function explorerTxUrl(hash: string): string | undefined {
  if (!EXPLORER_URL) return undefined;
  return `${EXPLORER_URL.replace(/\/$/, "")}/tx/${hash}`;
}

export function explorerAddressUrl(address: string): string | undefined {
  if (!EXPLORER_URL) return undefined;
  return `${EXPLORER_URL.replace(/\/$/, "")}/address/${address}`;
}

/**
 * Where a human can open the contract in a Studio-style web IDE. Bradbury has
 * no such IDE (it's a plain public testnet) — the function returns undefined
 * there and callers must not render a dead link.
 */
export const STUDIO_IMPORT_URL = (address: string): string | undefined =>
  defaults.studioIdeUrl ? `${defaults.studioIdeUrl}/?import-contract=${address}` : undefined;

/** This network's own last-known-deployed contract address, before any env override. */
export const NETWORK_DEFAULT_CONTRACT_ADDRESS = defaults.defaultContractAddress;
