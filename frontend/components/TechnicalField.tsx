"use client";

import { toast } from "@/lib/utils/toast";

function truncate(value: string, front = 6, back = 4): string {
  if (value.length <= front + back + 1) return value;
  return `${value.slice(0, front)}…${value.slice(-back)}`;
}

export function TechnicalField({ label, value }: { label: string; value: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  return (
    <span
      className="mono"
      style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--pending)" }}
    >
      {truncate(value)}
      <button
        onClick={copy}
        className="mono"
        style={{
          background: "none",
          border: "1px solid var(--border)",
          borderRadius: 3,
          fontSize: 10,
          padding: "2px 6px",
          color: "var(--pending)",
        }}
      >
        copy
      </button>
    </span>
  );
}
