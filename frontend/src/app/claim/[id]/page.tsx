"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, ButtonLink } from "@/components/Button";
import { ConnectWallet } from "@/components/ConnectWallet";
import { ConsensusMark } from "@/components/ConsensusMark";
import { CopyField } from "@/components/CopyField";
import { EvidenceBlock } from "@/components/EvidenceBlock";
import { NetworkStatus } from "@/components/NetworkStatus";
import { RequirementsList } from "@/components/RequirementsList";
import { StatusBadge } from "@/components/StatusBadge";
import { TransactionStatus } from "@/components/TransactionStatus";
import { EmptyState, ErrorState, LoadingState, Notice, Panel } from "@/components/States";
import { useWallet } from "@/components/WalletProvider";
import { useClaim } from "@/hooks/useClaim";
import { useRequirements } from "@/hooks/useRequirements";
import { isInFlight, useWriteTransaction } from "@/hooks/useWriteTransaction";
import { explorerAddressUrl } from "@/lib/chain";
import { parseClaimId, shortClaimId } from "@/lib/claimId";
import { clearDraft, readDraft, rememberClaim, type ClaimDraft } from "@/lib/claimIndex";
import { METHODS, STATUS_DESCRIPTION } from "@/lib/contract";
import { sameAddress, shortAddress } from "@/lib/format";

export default function ClaimPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const { status: walletStatus, account, networkConfirmed } = useWallet();

  /**
   * The claim ID comes from the URL and from nowhere else. It was generated
   * before the transaction existed, so reloading, sharing or reopening this
   * page days later resolves to the same claim — there is no lookup by
   * recency, by wallet history, or by list position anywhere in this file.
   */
  const rawId = params?.id ?? "";
  const claimId = parseClaimId(rawId);
  const idText = claimId ? claimId.toString() : rawId;

  const { claim, notFound, loading, error, reload } = useClaim(claimId);
  const requirements = useRequirements();

  const submitTx = useWriteTransaction();
  const evaluateTx = useWriteTransaction();

  const [draft, setDraft] = useState<ClaimDraft | null>(null);
  const autoRan = useRef(false);

  useEffect(() => {
    if (!claimId) return;
    setDraft(readDraft(claimId.toString()));
  }, [claimId]);

  const connected = walletStatus === "connected" && !!account;
  const isNew = search?.get("new") === "1";
  const canSign = connected && networkConfirmed;

  const submitEvidence = useCallback(async () => {
    if (!claimId || !draft) return;
    const result = await submitTx.run({
      method: METHODS.submitClaim,
      args: [claimId, draft.evidenceText],
    });
    if (result.phase === "success") {
      clearDraft(claimId.toString());
      setDraft(null);
      rememberClaim({ id: claimId.toString(), submittedBy: account ?? undefined });
      reload();
    }
  }, [claimId, draft, submitTx, account, reload]);

  // Continue the submission the person already started on the submit page.
  // Only fires for this exact ID, once, and only after the read confirmed the
  // claim is not on chain yet.
  useEffect(() => {
    if (autoRan.current) return;
    if (!isNew || !draft || !notFound || loading || !canSign) return;
    autoRan.current = true;
    void submitEvidence();
  }, [isNew, draft, notFound, loading, canSign, submitEvidence]);

  const requestEvaluation = useCallback(async () => {
    if (!claimId) return;
    const result = await evaluateTx.run({
      method: METHODS.evaluateClaim,
      args: [claimId],
    });
    if (result.phase === "success") reload();
  }, [claimId, evaluateTx, reload]);

  useEffect(() => {
    if (claim && claimId) {
      rememberClaim({ id: claimId.toString(), lastKnownStatus: claim.status });
    }
  }, [claim, claimId]);

  if (!claimId) {
    return (
      <AppShell title="Claim not readable">
        <EmptyState
          title="That is not a valid claim ID"
          body="A claim ID is the full decimal number generated when the claim was created. Check the link you followed — a truncated ID will not resolve."
          action={<ButtonLink href="/app/submit">Start a new claim</ButtonLink>}
        />
      </AppShell>
    );
  }

  const submitting = isInFlight(submitTx.state.phase);
  const evaluating = isInFlight(evaluateTx.state.phase);
  const isOwner = claim ? sameAddress(claim.claimant, account) : false;

  return (
    <AppShell>
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <ButtonLink href="/claims" variant="quiet" className="-ml-2">
          ← My claims
        </ButtonLink>
      </nav>

      <div className="mb-8">
        <p className="text-2xs text-faint">Claim</p>
        <h1 className="mt-1.5 flex flex-wrap items-center gap-3">
          <span className="font-mono text-section font-semibold tnum" title={idText}>
            {shortClaimId(idText)}
          </span>
          {claim ? <StatusBadge status={claim.status} /> : null}
        </h1>
        <div className="mt-3 max-w-full">
          <CopyField label="Claim ID" value={idText} display={idText} />
        </div>
      </div>

      <NetworkStatus />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
        <div className="min-w-0">
          {loading ? (
            <Panel>
              <LoadingState label="Reading this claim from the contract" />
            </Panel>
          ) : null}

          {error ? <ErrorState error={error} onRetry={reload} /> : null}

          {/* Not on chain yet, but this browser holds the evidence for this ID. */}
          {!loading && notFound && draft ? (
            <section>
              <Notice title="This claim has not been submitted yet">
                <p>
                  The ID above is reserved for this submission and already lives in the URL. The
                  evidence below is stored in this browser only until you sign.
                </p>
              </Notice>

              <h2 className="mt-6 font-medium">Evidence to submit</h2>
              <div className="mt-3">
                <EvidenceBlock text={draft.evidenceText} />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                {connected ? (
                  <Button size="lg" onClick={submitEvidence} disabled={submitting || !networkConfirmed}>
                    {submitting ? "Submitting…" : "Submit evidence"}
                  </Button>
                ) : (
                  <ConnectWallet size="lg" />
                )}
                <ButtonLink href="/app/submit" variant="quiet">
                  Edit and start over
                </ButtonLink>
              </div>

              <TransactionStatus
                state={submitTx.state}
                successTitle="Evidence submitted"
                successBody="The claim is on chain. Request an evaluation when you are ready."
                onRetry={submitTx.reset}
              />
            </section>
          ) : null}

          {/* Not on chain and nothing local: an ID that does not exist. */}
          {!loading && notFound && !draft ? (
            <EmptyState
              title="No claim has been submitted under this ID"
              body="Either the link is wrong, or the submission was never signed. Claim IDs are created in the browser, so an unsigned one leaves no trace on chain."
              action={<ButtonLink href="/app/submit">Submit new evidence</ButtonLink>}
            />
          ) : null}

          {claim ? (
            <section>
              <div className="flex flex-wrap items-center gap-4 rounded-sm border border-[color:var(--rule-strong)] bg-surface p-5">
                <ConsensusMark status={claim.status} height={28} animate={claim.status !== "pending"} />
                <div className="min-w-0">
                  <p className="font-medium">{STATUS_DESCRIPTION[claim.status]}</p>
                  {claim.status === "does_not_qualify" ? (
                    <p className="mt-1.5 text-sm text-muted">
                      No further explanation is available, because the contract does not store one.
                    </p>
                  ) : null}
                </div>
              </div>

              <h2 className="mt-8 font-medium">Evidence, as submitted</h2>
              <div className="mt-3">
                <EvidenceBlock text={claim.evidenceText} />
              </div>

              {claim.status === "pending" ? (
                <section className="mt-8">
                  <h2 className="font-medium">Evaluation</h2>
                  <p className="mt-1.5 max-w-prose text-sm text-muted">
                    Anyone with a connected wallet can trigger the evaluation, not only the person
                    who submitted it. It runs once and the result is permanent.
                  </p>

                  {requirements.unconfigured ? (
                    <div className="mt-4">
                      <Notice tone="warn" title="Requirements are not published">
                        <p>
                          The contract rejects evaluation until the organizer sets the requirements.
                        </p>
                      </Notice>
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {connected ? (
                      <Button
                        size="lg"
                        onClick={requestEvaluation}
                        disabled={evaluating || !networkConfirmed || requirements.unconfigured}
                      >
                        {evaluating ? "Evaluation running…" : "Request evaluation"}
                      </Button>
                    ) : (
                      <ConnectWallet size="lg" />
                    )}
                    <Button variant="secondary" onClick={reload} disabled={loading}>
                      Refresh status
                    </Button>
                  </div>

                  <TransactionStatus
                    state={evaluateTx.state}
                    successTitle="Evaluation recorded"
                    successBody="The validators reached a verdict and the contract stored it."
                    onRetry={evaluateTx.reset}
                  />
                </section>
              ) : null}
            </section>
          ) : null}
        </div>

        <aside className="min-w-0">
          <Panel as="section" className="p-5">
            <h2 className="font-medium">Record</h2>
            <dl className="mt-3 space-y-3.5 text-sm">
              <div>
                <dt className="text-2xs text-faint">Claimant</dt>
                <dd className="mt-1 min-w-0">
                  {claim ? (
                    <>
                      <CopyField
                        label="Claimant address"
                        value={claim.claimant}
                        display={shortAddress(claim.claimant)}
                        href={explorerAddressUrl(claim.claimant)}
                      />
                      {isOwner ? (
                        <span className="mt-1 block text-2xs text-faint">
                          This is your connected wallet.
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-muted">Not on chain yet</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-2xs text-faint">Status</dt>
                <dd className="mt-1">
                  {claim ? <StatusBadge status={claim.status} size="sm" /> : (
                    <span className="text-muted">—</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-2xs text-faint">Claim ID</dt>
                <dd className="mt-1 break-all font-mono text-2xs text-muted tnum">{idText}</dd>
              </div>
            </dl>
            <p className="mt-4 border-t border-[color:var(--rule)] pt-3 text-2xs leading-relaxed text-faint">
              This page is addressed by the claim ID itself, so it always shows this claim and never
              another one from the same wallet.
            </p>
          </Panel>

          <Panel as="section" className="mt-5 p-5">
            <h2 className="font-medium">Requirements it is judged against</h2>
            {requirements.loading ? <LoadingState label="Reading requirements" /> : null}
            {requirements.error ? (
              <ErrorState error={requirements.error} onRetry={requirements.reload} />
            ) : null}
            {requirements.requirements && requirements.requirements.length > 0 ? (
              <div className="mt-2">
                <RequirementsList requirements={requirements.requirements} compact />
              </div>
            ) : null}
            {requirements.unconfigured ? (
              <p className="mt-3 text-sm text-muted">Not published yet.</p>
            ) : null}
          </Panel>
        </aside>
      </div>
    </AppShell>
  );
}
