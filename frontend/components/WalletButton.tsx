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
    isOnCorrectNetwork,
    connectWallet,
    disconnectWallet,
  } = useWallet();

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (err: any) {
      if (String(err?.message || "").toLowerCase().includes("rejected")) {
        userRejected("Connection cancelled");
      } else {
        toastError("Could not connect wallet", { description: err?.message });
      }
    }
  };

  let walletLabel = "Not connected";
  let dotClass = "off";

  if (isLoading) {
    walletLabel = "Connecting…";
    dotClass = "warn";
  } else if (isConnected && !isOnCorrectNetwork) {
    walletLabel = "Wrong network";
    dotClass = "warn";
  } else if (isConnected && address) {
    walletLabel = formatAddress(address, 12);
    dotClass = "on";
  }

  return (
    <div className="nav-status">
      <span className="badge">
        <span className="dot on" />
        {GENLAYER_NETWORK.chainName}
      </span>

      <button className="badge" onClick={isConnected ? disconnectWallet : handleConnect}>
        <span className={`dot ${dotClass}`} />
        <span className="mono">{walletLabel}</span>
      </button>
    </div>
  );
}
