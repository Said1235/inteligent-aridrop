"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ConnectWallet } from "./ConnectWallet";
import { CHAIN_NAME } from "@/lib/chain";
import logo from "@/app/assets/allocyn-logo.png";

const NAV = [
  { href: "/app", label: "Requirements" },
  { href: "/app/submit", label: "Submit evidence" },
  { href: "/claims", label: "My claims" },
  { href: "/organizer", label: "Manage rules" },
];

export function Header({ variant = "app" }: { variant?: "app" | "landing" }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--rule)] bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-shell items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Image src={logo} alt="" priority height={30} className="h-[30px] w-auto" />
          <span className="font-semibold tracking-tight">
            Allocyn
            <span className="sr-only"> — Intelligent Airdrop</span>
          </span>
        </Link>

        {variant === "app" ? (
          <nav aria-label="Main" className="ml-2 hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV.map((item) => {
                const active =
                  item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`inline-flex min-h-[36px] items-center rounded px-2.5 text-sm ${
                        active ? "bg-[color:var(--sunk)] font-medium" : "text-muted hover:text-ink"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-2xs text-faint lg:inline">{CHAIN_NAME}</span>
          {variant === "landing" ? (
            <Link
              href="/app"
              className="inline-flex min-h-[40px] items-center rounded border border-ink bg-ink px-3.5 text-[0.9375rem] font-medium text-[color:var(--surface)] hover:bg-[#0c110f]"
            >
              Open the app
            </Link>
          ) : (
            <ConnectWallet />
          )}
          {variant === "app" ? (
            <button
              type="button"
              className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded border border-[color:var(--rule-strong)] md:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
              <span aria-hidden="true">{open ? "✕" : "☰"}</span>
            </button>
          ) : null}
        </div>
      </div>

      {variant === "app" && open ? (
        <nav id="mobile-nav" aria-label="Main" className="border-t border-[color:var(--rule)] md:hidden">
          <ul className="mx-auto max-w-shell px-4 py-2 sm:px-6">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-[44px] items-center border-b border-[color:var(--rule)] text-[0.9375rem]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
