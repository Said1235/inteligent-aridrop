"use client";

import { useWallet, formatAddress } from "@/lib/genlayer/wallet";
import { GENLAYER_NETWORK } from "@/lib/genlayer/client";
import { userRejected, error as toastError } from "@/lib/utils/toast";

/**
 * Persistent nav status: network badge + wallet state, always visible
 * (Web3 heuristic: network context should never be hidden, only shown on
 * error). States: disconnected / connecting / connected / wrong_network.
 */
export function WalletButton() {
  const {
    address,
    isConnected,
    isLoading,
    isMetaMaskInstalled,
    isOnCorrectNetwork,
    connectWallet,
    disconnectWallet,
  } = useWallet();

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (err: any) {
      if (!String(err?.message || "").includes("rejected")) {
        toastError("Could not connect wallet", { description: err?.message });
      } else {
        userRejected("Connection cancelled");
      }
    }
  };

  let walletLabel = "Not connected";
  let dotColor = "var(--pending)";

  if (isLoading) {
    walletLabel = "Connecting…";
    dotColor = "var(--accent)";
  } else if (isConnected && !isOnCorrectNetwork) {
    walletLabel = "Wrong network";
    dotColor = "var(--notqualify)";
  } else if (isConnected && address) {
    walletLabel = formatAddress(address, 12);
    dotColor = "var(--qualifies)";
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className="surface"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 9px" }}
      >
        <span
          style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--qualifies)" }}
        />
        {GENLAYER_NETWORK.chainName}
      </span>

      <button
        className="surface"
        onClick={isConnected ? disconnectWallet : handleConnect}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 9px", fontSize: 12 }}
        title={!isMetaMaskInstalled ? "MetaMask not detected — click to open install page" : undefined}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor }} />
        <span className="mono">{walletLabel}</span>
      </button>
    </div>
  );
}
