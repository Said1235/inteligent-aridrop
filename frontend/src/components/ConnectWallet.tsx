"use client";

import { useWallet } from "./WalletProvider";
import { Button } from "./Button";
import { shortAddress } from "@/lib/format";

export function ConnectWallet({ size = "md" }: { size?: "md" | "lg" }) {
  const { status, account, connect, disconnect } = useWallet();

  if (status === "unsupported") {
    return (
      <a
        className="inline-flex min-h-[40px] items-center rounded border border-[color:var(--rule-strong)] bg-surface px-3.5 text-[0.9375rem] hover:bg-[color:var(--sunk)]"
        href="https://metamask.io/download/"
        rel="noreferrer noopener"
        target="_blank"
      >
        Install a wallet
      </a>
    );
  }

  if (status === "connected" && account) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden font-mono text-sm text-muted sm:inline" title={account}>
          {shortAddress(account)}
        </span>
        <Button variant="secondary" size={size} onClick={disconnect}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button size={size} onClick={connect} disabled={status === "connecting"}>
      {status === "connecting" ? "Waiting for wallet…" : "Connect wallet"}
    </Button>
  );
}
