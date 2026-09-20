"use client";

import React from "react";
import Link from "next/link";

type Variant = "primary" | "secondary" | "quiet" | "danger";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded font-medium " +
  "transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45 " +
  "border";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-[color:var(--surface)] border-ink hover:bg-[#0c110f]",
  secondary: "bg-surface text-ink border-[color:var(--rule-strong)] hover:bg-[color:var(--sunk)]",
  quiet: "bg-transparent text-ink border-transparent hover:bg-[color:var(--sunk)]",
  danger: "bg-transparent text-declined border-[color:var(--declined)] hover:bg-declined-soft",
};

const sizes: Record<Size, string> = {
  md: "min-h-[40px] px-3.5 text-[0.9375rem]",
  lg: "min-h-[48px] px-5 text-base",
};

type CommonProps = { variant?: Variant; size?: Size; className?: string };

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  href,
  children,
  ...rest
}: CommonProps & { href: string; children: React.ReactNode } & Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    "href"
  >) {
  const external = href.startsWith("http");
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;
  if (external) {
    return (
      <a className={cls} href={href} rel="noreferrer noopener" target="_blank" {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link className={cls} href={href} {...rest}>
      {children}
    </Link>
  );
}
