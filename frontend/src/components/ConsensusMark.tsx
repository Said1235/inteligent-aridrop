"use client";

import type { ClaimStatus } from "@/lib/contract";

/**
 * The product's one signature visual: a row of marks standing for independent
 * validators arriving at a single verdict.
 *
 * Honesty constraint: the contract stores only the final status, never a
 * per-validator breakdown. So the marks are a state indicator, not vote data,
 * and the component never claims a count of agreeing validators.
 */
const TONE: Record<ClaimStatus, { fill: string; label: string }> = {
  pending: { fill: "var(--pending)", label: "Awaiting evaluation" },
  qualifies: { fill: "var(--approved)", label: "Validators agreed" },
  does_not_qualify: { fill: "var(--declined)", label: "Validators did not agree" },
};

export function ConsensusMark({
  status,
  marks = 5,
  height = 22,
  animate = false,
}: {
  status: ClaimStatus;
  marks?: number;
  height?: number;
  animate?: boolean;
}) {
  const tone = TONE[status];
  const settled = status !== "pending";

  return (
    <span
      className="inline-flex items-end gap-[3px]"
      role="img"
      aria-label={tone.label}
      style={{ height }}
    >
      {Array.from({ length: marks }, (_, i) => (
        <span
          key={i}
          className={animate ? "mark-in" : undefined}
          style={{
            display: "block",
            width: 4,
            height: settled ? height : height * (i % 2 === 0 ? 0.55 : 0.4),
            background: settled ? tone.fill : "var(--rule-strong)",
            transformOrigin: "bottom",
            animationDelay: animate ? `${i * 70}ms` : undefined,
          }}
        />
      ))}
    </span>
  );
}
