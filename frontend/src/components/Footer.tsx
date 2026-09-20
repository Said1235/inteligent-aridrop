import Link from "next/link";
import { CHAIN_ID, CHAIN_NAME, EXPLORER_URL, STUDIO_IMPORT_URL } from "@/lib/chain";
import { CONTRACT_ADDRESS } from "@/lib/contract";
import { shortAddress } from "@/lib/format";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-[color:var(--rule)]">
      <div className="mx-auto flex max-w-shell flex-wrap items-center gap-x-6 gap-y-2 px-4 py-6 text-2xs text-muted sm:px-6">
        <span>
          Contract{" "}
          <a
            className="font-mono text-accent underline underline-offset-2"
            href={STUDIO_IMPORT_URL(CONTRACT_ADDRESS)}
            rel="noreferrer noopener"
            target="_blank"
            title={CONTRACT_ADDRESS}
          >
            {shortAddress(CONTRACT_ADDRESS)}
          </a>
        </span>
        <span>
          {CHAIN_NAME} · chain {CHAIN_ID}
        </span>
        {EXPLORER_URL ? (
          <a
            className="underline underline-offset-2 hover:text-ink"
            href={EXPLORER_URL}
            rel="noreferrer noopener"
            target="_blank"
          >
            Explorer
          </a>
        ) : null}
        <Link className="ml-auto underline underline-offset-2 hover:text-ink" href="/app">
          Open the app
        </Link>
      </div>
    </footer>
  );
}
