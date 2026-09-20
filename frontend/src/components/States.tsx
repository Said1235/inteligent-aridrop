"use client";

import React from "react";
import type { AppError } from "@/lib/errors";
import { Button } from "./Button";

export function Panel({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}) {
  return (
    <Tag className={`rounded-sm border border-[color:var(--rule)] bg-surface ${className}`}>
      {children}
    </Tag>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 p-5 text-muted" role="status" aria-live="polite">
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
              background: "var(--rule-strong)",
              animationDelay: `${i * 120}ms`,
              animationIterationCount: "infinite",
              animationDirection: "alternate",
            }}
          />
        ))}
      </span>
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
  retryLabel = "Try again",
}: {
  error: AppError;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div
      role="alert"
      className="rounded-sm border border-[color:var(--declined)] bg-declined-soft p-4"
    >
      <p className="flex items-start gap-2 font-medium text-declined">
        <span aria-hidden="true">✕</span>
        {error.title}
      </p>
      <p className="mt-1.5 max-w-prose text-sm text-ink">{error.detail}</p>
      {error.raw ? (
        <p className="mt-2 break-words font-mono text-2xs text-muted">
          <span className="sr-only">Exact message from the network: </span>
          {error.raw}
        </p>
      ) : null}
      {onRetry ? (
        <Button variant="secondary" className="mt-3" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-sm border border-dashed border-[color:var(--rule-strong)] p-6">
      <p className="font-medium">{title}</p>
      <p className="mt-1.5 max-w-prose text-sm text-muted">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Notice({
  tone = "neutral",
  title,
  children,
}: {
  tone?: "neutral" | "warn";
  title: string;
  children?: React.ReactNode;
}) {
  const warn = tone === "warn";
  return (
    <div
      className="rounded-sm border p-4"
      style={{
        borderColor: warn ? "var(--pending)" : "var(--rule)",
        background: warn ? "var(--pending-soft)" : "var(--surface)",
      }}
    >
      <p className="font-medium" style={{ color: warn ? "var(--pending)" : "var(--ink)" }}>
        {title}
      </p>
      {children ? <div className="mt-1.5 max-w-prose text-sm text-ink">{children}</div> : null}
    </div>
  );
}
