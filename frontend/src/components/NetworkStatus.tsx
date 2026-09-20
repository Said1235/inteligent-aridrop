"use client";

import { useWallet } from "./WalletProvider";
import { Button } from "./Button";
import { CHAIN_ID, CHAIN_NAME } from "@/lib/chain";
import { ErrorState } from "./States";

/**
 * Signing is blocked until the wallet's network is positively confirmed to
 * match this app — not merely "not known to be wrong". Right after connecting,
 * `chainId` is briefly null while the probe is in flight; a write attempt in
 * that window must wait, not proceed, because genlayer-js's own chain-mismatch
 * guard is a no-op for Studio networks (it returns early whenever
 * `chainConfig.isStudio` is true), so there is no SDK-level fallback check.
 */
export function NetworkStatus() {
  const { status, wrongNetwork, chainId, networkConfirmed, switchNetwork, switching, error, dismissError } =
    useWallet();
  const checkingNetwork = status === "connected" && !networkConfirmed && !wrongNetwork;

  return (
    <>
      {error ? (
        <div className="mb-4">
          <ErrorState error={error} onRetry={dismissError} retryLabel="Dismiss" />
        </div>
      ) : null}

      {wrongNetwork ? (
        <div
          role="alert"
          className="mb-4 rounded-sm border border-[color:var(--pending)] bg-pending-soft p-4"
        >
          <p className="flex items-start gap-2 font-medium text-pending">
            <span aria-hidden="true">⚠</span>
            Wrong network
          </p>
          <p className="mt-1.5 max-w-prose text-sm">
            Your wallet is on chain {chainId}. This app talks to {CHAIN_NAME} (chain {CHAIN_ID}).
            Signing stays disabled until you switch.
          </p>
          <Button variant="secondary" className="mt-3" onClick={switchNetwork} disabled={switching}>
            {switching ? "Switching…" : `Switch to ${CHAIN_NAME}`}
          </Button>
        </div>
      ) : null}

      {checkingNetwork ? (
        <div role="status" aria-live="polite" className="mb-4 text-sm text-muted">
          Confirming your wallet's network before enabling signing…
        </div>
      ) : null}
    </>
  );
}
