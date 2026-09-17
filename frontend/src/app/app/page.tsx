"use client";

import { AppShell } from "@/components/AppShell";
import { ButtonLink } from "@/components/Button";
import { RequirementsList } from "@/components/RequirementsList";
import { EmptyState, ErrorState, LoadingState, Panel } from "@/components/States";
import { useRequirements } from "@/hooks/useRequirements";
import { CHAIN_NAME, STUDIO_IMPORT_URL } from "@/lib/chain";
import { CONTRACT_ADDRESS } from "@/lib/contract";
import { CopyField } from "@/components/CopyField";
import { shortAddress } from "@/lib/format";

export default function AppHome() {
  const { requirements, unconfigured, loading, error, reload } = useRequirements();

  return (
    <AppShell
      title="Active requirements"
      lead="These are read live from the contract. They were set once and cannot be changed by anyone, including the organizer."
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
        <div>
          {loading ? (
            <Panel>
              <LoadingState label="Reading requirements from the contract" />
            </Panel>
          ) : null}

          {error ? <ErrorState error={error} onRetry={reload} /> : null}

          {!loading && !error && unconfigured ? (
            <EmptyState
              title="No requirements have been published"
              body="The organizer has not called set_requirements yet. You can still submit evidence, but no claim can be evaluated until the requirements exist."
              action={
                <div className="flex flex-wrap gap-3">
                  <ButtonLink href="/app/submit">Submit evidence anyway</ButtonLink>
                  <ButtonLink href="/organizer" variant="secondary">
                    I deployed this contract
                  </ButtonLink>
                </div>
              }
            />
          ) : null}

          {!loading && !error && requirements && requirements.length > 0 ? (
            <>
              <Panel className="px-5">
                <RequirementsList requirements={requirements} />
              </Panel>
              <p className="mt-4 max-w-prose text-sm text-muted">
                Validators judge these as a set. Evidence that satisfies most of them but misses one
                is recorded as not approved.
              </p>
              <div className="mt-6">
                <ButtonLink href="/app/submit" size="lg">
                  Submit evidence
                </ButtonLink>
              </div>
            </>
          ) : null}
        </div>

        <aside>
          <Panel as="section" className="p-5">
            <h2 className="font-medium">This contract</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-2xs text-faint">Address</dt>
                <dd className="mt-1">
                  <CopyField
                    label="Contract address"
                    value={CONTRACT_ADDRESS}
                    display={shortAddress(CONTRACT_ADDRESS)}
                    href={STUDIO_IMPORT_URL(CONTRACT_ADDRESS)}
                  />
                </dd>
              </div>
              <div>
                <dt className="text-2xs text-faint">Network</dt>
                <dd className="mt-1 text-muted">{CHAIN_NAME}</dd>
              </div>
            </dl>
            <p className="mt-4 border-t border-[color:var(--rule)] pt-3 text-2xs leading-relaxed text-faint">
              No tokens move through this contract. It records eligibility only.
            </p>
          </Panel>

          <div className="mt-5">
            <ButtonLink href="/claims" variant="secondary" className="w-full">
              My claims
            </ButtonLink>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
