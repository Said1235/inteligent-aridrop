import { STATUS_LABEL, type ClaimStatus } from "@/lib/contract";

/**
 * Status is carried by text, shape and colour together, never colour alone.
 */
const STYLE: Record<ClaimStatus, { bg: string; fg: string; glyph: string }> = {
  pending: { bg: "var(--pending-soft)", fg: "var(--pending)", glyph: "◷" },
  qualifies: { bg: "var(--approved-soft)", fg: "var(--approved)", glyph: "✓" },
  does_not_qualify: { bg: "var(--declined-soft)", fg: "var(--declined)", glyph: "✕" },
};

export function StatusBadge({ status, size = "md" }: { status: ClaimStatus; size?: "sm" | "md" }) {
  const s = STYLE[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-xs border font-medium ${
        size === "sm" ? "px-2 py-0.5 text-2xs" : "px-2.5 py-1 text-sm"
      }`}
      style={{ background: s.bg, color: s.fg, borderColor: s.fg }}
    >
      <span aria-hidden="true">{s.glyph}</span>
      {STATUS_LABEL[status]}
    </span>
  );
}
