"use client";

import { useCallback, useRef, useState } from "react";
import {
  createTransactionKit,
  type SubmitInput,
  type TrackedStatus,
} from "@genlayer/transaction-kit";
import { chain } from "@/lib/chain";
import { CONTRACT_ADDRESS } from "@/lib/contract";
import { errorFromReceipt, toAppError, type AppError } from "@/lib/errors";
import { getReadClient } from "@/lib/readClient";
import { useWallet } from "@/components/WalletProvider";

/**
 * Every distinct thing that can be true of a write transaction. Deliberately
 * not collapsed into a single "loading" flag: the wallet prompt, the queue and
 * the consensus round fail in different ways and need different wording.
 */
export type TxPhase =
  | "idle"
  | "preparing"
  | "awaiting_signature"
  | "submitted"
  | "pending"
  | "processing"
  | "decided"
  | "success"
  | "reverted"
  | "error";

export type TxState = {
  phase: TxPhase;
  /** Position in the pending queue, when the network reports one. */
  queuePosition?: number;
  genlayerTxId?: `0x${string}`;
  evmTxHash?: `0x${string}`;
  error?: AppError;
  /** True when fee accounting is off on this network (gasless Studio). */
  gasless?: boolean;
};

const IN_FLIGHT: TxPhase[] = [
  "preparing",
  "awaiting_signature",
  "submitted",
  "pending",
  "processing",
  "decided",
];

export const isInFlight = (phase: TxPhase) => IN_FLIGHT.includes(phase);

export type WriteArgs = {
  method: string;
  args: unknown[];
};

export function useWriteTransaction() {
  const { provider, account } = useWallet();
  const [state, setState] = useState<TxState>({ phase: "idle" });
  const runIdRef = useRef(0);

  const reset = useCallback(() => {
    runIdRef.current += 1;
    setState({ phase: "idle" });
  }, []);

  const run = useCallback(
    async ({ method, args }: WriteArgs): Promise<TxState> => {
      const runId = (runIdRef.current += 1);
      const commit = (next: TxState) => {
        if (runIdRef.current === runId) setState(next);
        return next;
      };

      if (!provider || !account) {
        return commit({
          phase: "error",
          error: {
            title: "No wallet connected",
            detail: "Connect a wallet before sending a transaction.",
            kind: "wallet",
          },
        });
      }

      const tx: SubmitInput = {
        kind: "write",
        address: CONTRACT_ADDRESS,
        method,
        args,
      };

      const kit = createTransactionKit({ chain, provider, account });

      // 1. Quote the fee policy. This is a live read; it does not sign.
      commit({ phase: "preparing" });
      let quote;
      try {
        quote = await kit.estimate({ preset: "standard" }, tx);
      } catch (err) {
        return commit({ phase: "error", error: toAppError(err) });
      }

      // The kit compares the quote against the chain's current fee policy.
      // A mismatch means the quote was built on stale prices, so stop before
      // asking anyone to sign something priced incorrectly.
      if (quote.verification.status === "mismatch") {
        return commit({
          phase: "error",
          error: {
            title: "Fee quote is out of date",
            detail:
              "The network's fee policy changed while this transaction was being prepared. Try again to get a fresh quote.",
            raw: `expected ${quote.verification.expectedHash ?? "?"} / actual ${
              quote.verification.actualHash ?? "?"
            }`,
            kind: "rpc",
          },
        });
      }

      // 2. Submit. This is the step that opens the wallet.
      commit({ phase: "awaiting_signature", gasless: quote.gasless });
      let submitted: { genlayerTxId: `0x${string}`; evmTxHash?: `0x${string}` };
      try {
        submitted = await kit.submit(quote, tx);
      } catch (err) {
        return commit({ phase: "error", error: toAppError(err), gasless: quote.gasless });
      }

      const base: TxState = {
        phase: "submitted",
        genlayerTxId: submitted.genlayerTxId,
        evmTxHash: submitted.evmTxHash,
        gasless: quote.gasless,
      };
      commit(base);

      // 3. Follow it to a decision.
      let tracked: TrackedStatus;
      try {
        tracked = await kit.track(
          submitted.genlayerTxId,
          (update) => {
            if (runIdRef.current !== runId) return;
            const phase: TxPhase =
              update.phase === "finalized" || update.phase === "decided"
                ? "decided"
                : (update.phase as TxPhase);
            commit({
              ...base,
              phase,
              queuePosition: update.queuePosition,
              evmTxHash: update.evmTxHash ?? base.evmTxHash,
            });
          },
          { until: "decided" },
        );
      } catch (err) {
        return commit({ ...base, phase: "error", error: toAppError(err) });
      }

      if (tracked.successful) {
        return commit({ ...base, phase: "success", evmTxHash: tracked.evmTxHash ?? base.evmTxHash });
      }

      // 4. It reverted. Pull the contract's own UserError out of the receipt so
      //    the person sees the real reason, not "transaction failed".
      let error: AppError | null = null;
      try {
        // genlayer-js types the hash as a branded 66-char string; the kit
        // returns a plain 0x-string, so widen it at this one boundary.
        const receipt = await getReadClient().getTransaction({
          hash: submitted.genlayerTxId as unknown as Parameters<
            ReturnType<typeof getReadClient>["getTransaction"]
          >[0]["hash"],
        });
        error = errorFromReceipt(receipt);
      } catch {
        error = null;
      }

      return commit({
        ...base,
        phase: "reverted",
        error:
          error ?? {
            title: "The contract rejected this transaction",
            detail:
              tracked.executionResultName ??
              tracked.statusName ??
              "Validators ran the call and it did not succeed.",
            kind: "contract",
          },
      });
    },
    [provider, account],
  );

  return { state, run, reset };
}
