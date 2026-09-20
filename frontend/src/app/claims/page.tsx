"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, ButtonLink } from "@/components/Button";
import { ClaimCard } from "@/components/ClaimCard";
import { EmptyState, Notice, Panel } from "@/components/States";
import { listBookmarks, type ClaimBookmark } from "@/lib/claimIndex";
import { claimPath, parseClaimId } from "@/lib/claimId";
import { useRouter } from "next/navigation";

export default function ClaimsPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<ClaimBookmark[] | null>(null);
  const [lookup, setLookup] = useState("");
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    setEntries(listBookmarks());
  }, []);

  const openById = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseClaimId(lookup);
    if (!id) {
      setLookupError("Enter the full numeric claim ID. Shortened IDs cannot be resolved.");
      return;
    }
    setLookupError(null);
    router.push(claimPath(id));
  };

  return (
    <AppShell
      title="My claims"
      lead="Claim IDs this browser has created or opened. The contract cannot list claims, so this is a local bookmark list — the claims themselves live on chain."
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
        <div>
          {entries === null ? null : entries.length === 0 ? (
            <EmptyState
              title="Nothing saved in this browser"
              body="Claims you create here are bookmarked automatically. If you submitted from another device, open the claim by its ID."
              action={<ButtonLink href="/app/submit">Submit evidence</ButtonLink>}
            />
          ) : (
            <>
              <ul className="border-t border-[color:var(--rule)]">
                {entries.map((entry) => (
                  <ClaimCard
                    key={entry.id}
                    id={entry.id}
                    savedAt={entry.savedAt}
                    status={entry.lastKnownStatus}
                  />
                ))}
              </ul>
              <p className="mt-4 max-w-prose text-sm text-muted">
                Statuses shown here are the last ones this browser saw. Open a claim to read its
                current state from the contract.
              </p>
            </>
          )}
        </div>

        <aside>
          <Panel as="section" className="p-5">
            <h2 className="font-medium">Open a claim by ID</h2>
            <form onSubmit={openById}>
              <label htmlFor="claim-lookup" className="mt-2 block text-sm text-muted">
                Paste the full claim ID from a link or a bookmark.
              </label>
              <input
                id="claim-lookup"
                value={lookup}
                onChange={(e) => setLookup(e.target.value)}
                inputMode="numeric"
                aria-invalid={lookupError ? true : undefined}
                aria-describedby={lookupError ? "claim-lookup-error" : undefined}
                className="mt-2 block w-full rounded-sm border border-[color:var(--rule-strong)] bg-paper p-2.5 font-mono text-sm"
                placeholder="881423…20713"
              />
              {lookupError ? (
                <p id="claim-lookup-error" role="alert" className="mt-2 text-sm text-declined">
                  {lookupError}
                </p>
              ) : null}
              <Button type="submit" variant="secondary" className="mt-3 w-full">
                View claim
              </Button>
            </form>
          </Panel>

          <div className="mt-5">
            <Notice title="Why this list is local">
              <p>
                The contract stores claims by ID and has no method to enumerate them, so no app can
                list every claim. Anyone holding a claim ID can read that claim in full.
              </p>
            </Notice>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
