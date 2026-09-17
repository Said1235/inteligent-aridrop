import type { ClaimStatus } from "@/lib/contracts/types";

const LABELS: Record<ClaimStatus, string> = {
  pending: "Pending",
  qualifies: "Qualifies",
  does_not_qualify: "Not approved",
};

const COLORS: Record<ClaimStatus, string> = {
  pending: "var(--pending)",
  qualifies: "var(--qualifies)",
  does_not_qualify: "var(--notqualify)",
};

function Icon({ status }: { status: ClaimStatus }) {
  if (status === "qualifies") {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === "does_not_qualify") {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 5.2V8L9.8 9.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Status is communicated by text + icon shape, never color alone
 * (accessibility requirement). Only these 3 states exist — the contract
 * defines no others.
 */
export function StatusBadge({ status }: { status: ClaimStatus }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        borderRadius: "var(--radius)",
        border: `1px solid ${COLORS[status]}`,
        color: COLORS[status],
        background: "#fff",
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      <Icon status={status} />
      {LABELS[status]}
    </span>
  );
}
