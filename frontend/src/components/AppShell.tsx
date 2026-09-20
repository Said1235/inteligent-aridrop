import React from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function AppShell({
  children,
  title,
  lead,
}: {
  children: React.ReactNode;
  title?: string;
  lead?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-ink focus:px-3 focus:py-2 focus:text-[color:var(--surface)]"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="mx-auto w-full max-w-shell flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {title ? (
          <div className="mb-8">
            <h1 className="text-title font-semibold">{title}</h1>
            {lead ? <p className="mt-2 max-w-prose text-muted">{lead}</p> : null}
          </div>
        ) : null}
        {children}
      </main>
      <Footer />
    </div>
  );
}
