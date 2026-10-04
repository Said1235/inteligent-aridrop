"use client";

import { isInFlight, type TxState } from "@/hooks/useWriteTransaction";
import { explorerTxUrl } from "@/lib/chain";
import { shortHash } from "@/lib/format";
import { CopyField } from "./CopyField";
import { ErrorState } from "./States";

/**
 * Every phase gets its own sentence. Nothing here reports success before the
 * network has decided, and no hash is invented: identifiers render only once
 * the kit has actually returned them.
 */
const COPY: Record<string, { title: string; body: string }> = {
  preparing: {
    title: "Preparing the transaction",
    body: "Reading the network's current fee policy. Your wallet has not been asked for anything yet.",
  },
  awaiting_signature: {
    title: "Waiting for your signature",
    body: "Approve the request in your wallet. Nothing is sent until you do.",
  },
  submitted: {
    title: "Sent to the network",
    body: "The transaction is in. Waiting for validators to pick it up.",
  },
  pending: {
    title: "Queued",
    body: "The network has accepted the transaction and has not started it yet.",
  },
  processing: {
    title: "Validators are running it",
    body: "Each validator is executing the call independently. This is the slow part.",
  },
  decided: {
    title: "Recording the result",
    body: "Consensus has been reached and the result is being written.",
  },
};

export function TransactionStatus({
  state,
  successTitle,
  successBody,
  onRetry,
  action,
}: {
  state: TxState;
  successTitle: string;
  successBody: string;
  onRetry?: () => void;
  action?: React.ReactNode;
}) {
  if (state.phase === "idle") return null;

  if (state.phase === "error" || state.phase === "reverted") {
    return (
      <div className="mt-4">
        <ErrorState
          error={
            state.error ?? {
              title: "The transaction did not go through",
              detail: "No further detail was returned.",
              kind: "unknown",
            }
          }
          onRetry={onRetry}
        />
        {state.genlayerTxId ? (
          <p className="mt-2 text-sm text-muted">
            Transaction:{" "}
            <CopyField
              label="Transaction ID"
              value={state.genlayerTxId}
              display={shortHash(state.genlayerTxId)}
              href={explorerTxUrl(state.genlayerTxId)}
            />
          </p>
        ) : null}
      </div>
    );
  }

  if (state.phase === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mt-4 rounded-sm border border-[color:var(--approved)] bg-approved-soft p-4"
      >
        <p className="flex items-start gap-2 font-medium text-approved">
          <span aria-hidden="true">✓</span>
          {successTitle}
        </p>
        <p className="mt-1.5 max-w-prose text-sm">{successBody}</p>
        {state.genlayerTxId ? (
          <p className="mt-2.5 text-sm">
            <span className="text-muted">Transaction: </span>
            <CopyField
              label="Transaction ID"
              value={state.genlayerTxId}
              display={shortHash(state.genlayerTxId)}
              href={explorerTxUrl(state.genlayerTxId)}
            />
          </p>
        ) : null}
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    );
  }

  const copy = COPY[state.phase] ?? {
    title: "Working",
    body: "The transaction is in progress.",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-4 rounded-sm border border-[color:var(--rule-strong)] bg-surface p-4"
    >
      <p className="flex items-center gap-2.5 font-medium">
        <span
          aria-hidden="true"
          className="inline-flex items-end gap-[3px]"
          style={{ height: 14 }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="mark-in"
              style={{
                display: "block",
                width: 3,
                height: 14,
                background: "var(--accent)",
                animationDelay: `${i * 120}ms`,
                animationIterationCount: "infinite",
                animationDirection: "alternate",
              }}
            />
          ))}
        </span>
        {copy.title}
      </p>
      <p className="mt-1.5 max-w-prose text-sm text-muted">{copy.body}</p>

      {typeof state.queuePosition === "number" ? (
        <p className="mt-1.5 text-sm text-muted tnum">
          {state.queuePosition === 0
            ? "Next up in the queue."
            : `${state.queuePosition} transaction${state.queuePosition === 1 ? "" : "s"} ahead in the queue.`}
        </p>
      ) : null}

      {state.genlayerTxId ? (
        <p className="mt-2.5 text-sm">
          <span className="text-muted">Transaction: </span>
          <CopyField
            label="Transaction ID"
            value={state.genlayerTxId}
            display={shortHash(state.genlayerTxId)}
            href={explorerTxUrl(state.genlayerTxId)}
          />
        </p>
      ) : null}

      {isInFlight(state.phase) ? (
        <p className="mt-2.5 text-2xs text-faint">
          Safe to leave this page — the claim ID stays in the URL.
        </p>
      ) : null}
    </div>
  );
}
