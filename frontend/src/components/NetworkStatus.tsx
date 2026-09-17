"use client";

import { useWallet } from "./WalletProvider";
import { Button } from "./Button";
import { CHAIN_ID, CHAIN_NAME } from "@/lib/chain";
import { ErrorState } from "./States";

/**
 * Signing is blocked while the wallet points at another chain. Shown as a
 * banner above any form that can produce a transaction.
 */
export function NetworkStatus() {
  const { wrongNetwork, chainId, switchNetwork, switching, error, dismissError } = useWallet();

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
    </>
  );
}
