"use client";

import Link from "next/link";
import { claimPath, shortClaimId } from "@/lib/claimId";
import { isClaimStatus, STATUS_LABEL, type ClaimStatus } from "@/lib/contract";
import { formatWhen } from "@/lib/format";
import { ConsensusMark } from "./ConsensusMark";
import { StatusBadge } from "./StatusBadge";

/**
 * A row in the local history. It links by the exact claim ID it stores; it
 * never derives which claim it refers to from its position in the list.
 */
export function ClaimCard({
  id,
  savedAt,
  status,
}: {
  id: string;
  savedAt: number;
  status?: string;
}) {
  const known: ClaimStatus | null = isClaimStatus(status) ? status : null;

  return (
    <li>
      <Link
        href={claimPath(id)}
        className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[color:var(--rule)] px-1 py-4 hover:bg-surface"
      >
        <span className="shrink-0">
          {known ? <ConsensusMark status={known} height={18} /> : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-mono text-sm tnum" title={id}>
            {shortClaimId(id)}
          </span>
          <span className="mt-0.5 block text-2xs text-faint">Saved {formatWhen(savedAt)}</span>
        </span>
        {known ? (
          <StatusBadge status={known} size="sm" />
        ) : (
          <span className="text-2xs text-faint">{STATUS_LABEL.pending}</span>
        )}
      </Link>
    </li>
  );
}
