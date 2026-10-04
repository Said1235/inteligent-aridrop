/**
 * Contract errors are surfaced verbatim. Every `gl.vm.UserError` the contract
 * can raise is listed here with the plain-language consequence; the raw string
 * is always shown next to it so what you read matches what the chain recorded.
 */
export const CONTRACT_ERRORS: Record<string, { title: string; detail: string }> = {
  "claim_id already exists": {
    title: "That claim ID is already taken",
    detail:
      "Each claim ID can only be used once. Start a new submission to get a fresh ID.",
  },
  "empty evidence": {
    title: "Evidence was empty",
    detail: "The contract rejects an empty evidence field. Write your evidence and submit again.",
  },
  "already evaluated": {
    title: "This claim already has a verdict",
    detail: "A claim is evaluated once. The recorded verdict is final and cannot be replaced.",
  },
  "claim not found": {
    title: "No claim with that ID",
    detail: "Nothing has been submitted under this ID yet.",
  },
  "requirements not configured yet": {
    title: "Requirements are not set",
    detail:
      "The organizer has not published the requirements, so there is nothing to evaluate against yet.",
  },
  "requirements already set": {
    title: "Requirements are already published",
    detail: "Requirements can be set once and are immutable afterwards.",
  },
  "only the organizer can set requirements": {
    title: "Only the organizer can do that",
    detail: "Requirements can only be set by the wallet that deployed this contract.",
  },
  "requirements must be a list of strings": {
    title: "Requirements must be a list",
    detail: "Enter one requirement per line.",
  },
  "each requirement must be a non-empty string": {
    title: "A requirement was empty",
    detail: "Remove blank lines before publishing.",
  },
};

export type AppError = {
  /** Short, human. */
  title: string;
  /** What to do next. */
  detail: string;
  /** The untouched string from the chain or the wallet, when there is one. */
  raw?: string;
  kind: "contract" | "wallet" | "rpc" | "timeout" | "unknown";
};

const WALLET_REJECTION_CODES = new Set([4001, "ACTION_REJECTED"]);

function textOf(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const e = error as { message?: unknown; shortMessage?: unknown; details?: unknown };
    const parts = [e.shortMessage, e.message, e.details].filter(
      (p): p is string => typeof p === "string",
    );
    if (parts.length) return parts.join(" — ");
  }
  return "";
}

/** Find a known contract error anywhere inside a message. */
export function matchContractError(text: string): AppError | null {
  for (const [needle, copy] of Object.entries(CONTRACT_ERRORS)) {
    if (text.includes(needle)) {
      return { ...copy, raw: needle, kind: "contract" };
    }
  }
  return null;
}

export function toAppError(error: unknown): AppError {
  const text = textOf(error);

  const code = (error as { code?: unknown } | null)?.code;
  if (code !== undefined && WALLET_REJECTION_CODES.has(code as never)) {
    return {
      title: "Signature rejected",
      detail: "You dismissed the wallet prompt. Nothing was sent and nothing was charged.",
      kind: "wallet",
    };
  }
  if (/user rejected|user denied|rejected the request/i.test(text)) {
    return {
      title: "Signature rejected",
      detail: "You dismissed the wallet prompt. Nothing was sent and nothing was charged.",
      kind: "wallet",
    };
  }

  const contract = matchContractError(text);
  if (contract) return contract;

  if (/timeout|timed out|exceeded .*retries/i.test(text)) {
    return {
      title: "The network stopped responding",
      detail:
        "The transaction may still be processing. Reload this page — the claim ID in the URL will show its current state.",
      raw: text || undefined,
      kind: "timeout",
    };
  }

  if (/fetch|network|Failed to fetch|ECONN|502|503|504|rpc/i.test(text)) {
    return {
      title: "Could not reach the GenLayer node",
      detail: "The RPC endpoint did not answer. Check your connection and try again.",
      raw: text || undefined,
      kind: "rpc",
    };
  }

  return {
    title: "Something went wrong",
    detail: "The action did not complete.",
    raw: text || undefined,
    kind: "unknown",
  };
}

/**
 * Pull the contract's rollback payload out of a GenLayer receipt so the exact
 * `UserError` string reaches the UI instead of a generic "transaction failed".
 */
export function errorFromReceipt(receipt: unknown): AppError | null {
  if (!receipt || typeof receipt !== "object") return null;

  const seen = new Set<unknown>();
  const strings: string[] = [];

  const walk = (node: unknown, depth: number) => {
    if (depth > 8 || node === null || node === undefined) return;
    if (typeof node === "string") {
      strings.push(node);
      return;
    }
    if (typeof node !== "object") return;
    if (seen.has(node)) return;
    seen.add(node);
    for (const value of Object.values(node as Record<string, unknown>)) {
      walk(value, depth + 1);
    }
  };
  walk(receipt, 0);

  for (const s of strings) {
    const match = matchContractError(s);
    if (match) return match;
  }

  const rollback = strings.find((s) => /rollback|ERROR|stderr/i.test(s) && s.length < 600);
  if (rollback) {
    return {
      title: "The contract rejected this transaction",
      detail: "Validators ran the call and it reverted.",
      raw: rollback,
      kind: "contract",
    };
  }
  return null;
}
