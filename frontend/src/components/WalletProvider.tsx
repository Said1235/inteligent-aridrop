"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Eip1193Provider } from "@genlayer/transaction-kit";
import { CHAIN_ID, CHAIN_ID_HEX, CHAIN_NAME, RPC_URL } from "@/lib/chain";
import { toAppError, type AppError } from "@/lib/errors";

type InjectedProvider = Eip1193Provider & {
  on?: (event: string, handler: (...args: never[]) => void) => void;
  removeListener?: (event: string, handler: (...args: never[]) => void) => void;
  isMetaMask?: boolean;
};

export type WalletStatus =
  | "unsupported"
  | "disconnected"
  | "connecting"
  | "connected";

type WalletState = {
  status: WalletStatus;
  account: `0x${string}` | null;
  chainId: number | null;
  /** True when a wallet is connected but pointed at a different network. */
  wrongNetwork: boolean;
  error: AppError | null;
  switching: boolean;
  provider: InjectedProvider | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
  dismissError: () => void;
};

const WalletContext = createContext<WalletState | null>(null);

function getInjected(): InjectedProvider | null {
  if (typeof window === "undefined") return null;
  const eth = (window as unknown as { ethereum?: InjectedProvider }).ethereum;
  return eth ?? null;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<WalletStatus>("disconnected");
  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [switching, setSwitching] = useState(false);
  const providerRef = useRef<InjectedProvider | null>(null);

  const readChain = useCallback(async (provider: InjectedProvider) => {
    try {
      const hex = (await provider.request({ method: "eth_chainId" })) as string;
      setChainId(Number.parseInt(hex, 16));
    } catch {
      setChainId(null);
    }
  }, []);

  // Initial probe: reflect an already-authorised wallet without prompting.
  useEffect(() => {
    const provider = getInjected();
    providerRef.current = provider;
    if (!provider) {
      setStatus("unsupported");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const accounts = (await provider.request({ method: "eth_accounts" })) as string[];
        if (cancelled) return;
        if (accounts?.length) {
          setAccount(accounts[0] as `0x${string}`);
          setStatus("connected");
          await readChain(provider);
        } else {
          setStatus("disconnected");
        }
      } catch {
        if (!cancelled) setStatus("disconnected");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [readChain]);

  // React to the wallet changing underneath us: a different account selected,
  // a different network selected, or the site disconnected from the extension.
  useEffect(() => {
    const provider = providerRef.current;
    if (!provider?.on) return;

    const onAccounts = (...args: never[]) => {
      const accounts = args[0] as unknown as string[] | undefined;
      if (!accounts || accounts.length === 0) {
        setAccount(null);
        setStatus("disconnected");
        setError({
          title: "Wallet disconnected",
          detail: "The wallet disconnected this site. Connect again to sign transactions.",
          kind: "wallet",
        });
        return;
      }
      setAccount(accounts[0] as `0x${string}`);
      setStatus("connected");
      setError(null);
    };

    const onChain = (...args: never[]) => {
      const hex = args[0] as unknown as string;
      setChainId(Number.parseInt(hex, 16));
    };

    provider.on("accountsChanged", onAccounts);
    provider.on("chainChanged", onChain);
    return () => {
      provider.removeListener?.("accountsChanged", onAccounts);
      provider.removeListener?.("chainChanged", onChain);
    };
  }, []);

  const connect = useCallback(async () => {
    const provider = providerRef.current ?? getInjected();
    providerRef.current = provider;
    if (!provider) {
      setStatus("unsupported");
      return;
    }
    setError(null);
    setStatus("connecting");
    try {
      const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
      if (!accounts?.length) {
        setStatus("disconnected");
        setError({
          title: "No account was shared",
          detail: "The wallet returned no account. Unlock it and connect again.",
          kind: "wallet",
        });
        return;
      }
      setAccount(accounts[0] as `0x${string}`);
      setStatus("connected");
      await readChain(provider);
    } catch (err) {
      setStatus("disconnected");
      setError(toAppError(err));
    }
  }, [readChain]);

  const disconnect = useCallback(() => {
    // EIP-1193 has no revoke; forget the session locally and stop signing.
    setAccount(null);
    setStatus("disconnected");
    setError(null);
  }, []);

  const switchNetwork = useCallback(async () => {
    const provider = providerRef.current;
    if (!provider) return;
    setSwitching(true);
    setError(null);
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CHAIN_ID_HEX }],
      });
    } catch (err) {
      const code = (err as { code?: number })?.code;
      if (code === 4902) {
        try {
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: CHAIN_ID_HEX,
                chainName: CHAIN_NAME,
                rpcUrls: [RPC_URL],
                nativeCurrency: { name: "GEN Token", symbol: "GEN", decimals: 18 },
              },
            ],
          });
        } catch (addErr) {
          setError(toAppError(addErr));
        }
      } else {
        setError(toAppError(err));
      }
    } finally {
      setSwitching(false);
      const p = providerRef.current;
      if (p) await readChain(p);
    }
  }, [readChain]);

  const value = useMemo<WalletState>(
    () => ({
      status,
      account,
      chainId,
      wrongNetwork: status === "connected" && chainId !== null && chainId !== CHAIN_ID,
      error,
      switching,
      provider: providerRef.current,
      connect,
      disconnect,
      switchNetwork,
      dismissError: () => setError(null),
    }),
    [status, account, chainId, error, switching, connect, disconnect, switchNetwork],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
