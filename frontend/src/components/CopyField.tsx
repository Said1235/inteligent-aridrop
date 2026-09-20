"use client";

import { useEffect, useState } from "react";

/**
 * Long identifiers (claim IDs, addresses, hashes) are shown truncated but the
 * full value is always what gets copied, and is always readable via the title
 * attribute and the screen-reader-only span.
 */
export function CopyField({
  value,
  display,
  label,
  href,
}: {
  value: string;
  display?: string;
  label: string;
  href?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const shown = display ?? value;

  return (
    <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
      {href ? (
        <a
          className="truncate font-mono text-sm text-accent underline decoration-[color:var(--rule-strong)] underline-offset-2 hover:decoration-accent"
          href={href}
          rel="noreferrer noopener"
          target="_blank"
          title={value}
        >
          {shown}
        </a>
      ) : (
        <span className="truncate font-mono text-sm tnum" title={value}>
          {shown}
        </span>
      )}
      <span className="sr-only">
        {label}: {value}
      </span>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded-xs border border-[color:var(--rule-strong)] bg-surface px-1.5 py-0.5 text-2xs text-muted hover:text-ink"
        aria-label={copied ? `${label} copied` : `Copy ${label}`}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </span>
  );
}
