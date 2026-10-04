"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, ButtonLink } from "@/components/Button";
import { ConnectWallet } from "@/components/ConnectWallet";
import { NetworkStatus } from "@/components/NetworkStatus";
import { RequirementsList } from "@/components/RequirementsList";
import { EmptyState, ErrorState, LoadingState, Notice, Panel } from "@/components/States";
import { useRequirements } from "@/hooks/useRequirements";
import { useWallet } from "@/components/WalletProvider";
import { claimIdToString, claimPath, generateClaimId } from "@/lib/claimId";
import { rememberClaim, saveDraft } from "@/lib/claimIndex";
import { toAppError, type AppError } from "@/lib/errors";

const MAX_CHARS = 8000;

export default function SubmitPage() {
  const router = useRouter();
  const { status, account, networkConfirmed, wrongNetwork } = useWallet();
  const { requirements, unconfigured, loading, error, reload } = useRequirements();

  const [evidence, setEvidence] = useState("");
  const [localError, setLocalError] = useState<AppError | null>(null);
  const [handingOff, setHandingOff] = useState(false);

  const connected = status === "connected" && !!account;
  const trimmed = evidence.trim();
  const tooLong = evidence.length > MAX_CHARS;
  const canStart =
    connected && networkConfirmed && trimmed.length > 0 && !tooLong && !unconfigured && !handingOff;

  /**
   * ── The transaction-identity step ──────────────────────────────────────────
   * The claim ID is generated here, in the browser, from a CSPRNG, and the app
   * navigates to /claim/<that exact id> immediately. The wallet has not been
   * opened yet and no transaction exists. The signing happens on the claim
   * page, which reads the ID from the URL.
   *
   * Consequence: two submissions started in two tabs already own two different
   * URLs before either one is signed, so they can never be confused for one
   * another — there is no moment where the app has to work out "which claim was
   * mine".
   * ──────────────────────────────────────────────────────────────────────────
   */
  const startSubmission = () => {
    if (!canStart || !account) return;
    setLocalError(null);
    setHandingOff(true);
    try {
      const claimId = generateClaimId();
      const id = claimIdToString(claimId);

      saveDraft({ id, evidenceText: trimmed, createdAt: Date.now(), account });
      rememberClaim({ id, submittedBy: account });

      router.push(`${claimPath(id)}?new=1`);
    } catch (err) {
      setHandingOff(false);
      setLocalError(toAppError(err));
    }
  };

  return (
    <AppShell
      title="Submit evidence"
      lead="Describe what you did and how someone could check it. Your claim gets its own permanent address before anything is signed."
    >
      <NetworkStatus />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
        <div>
          {localError ? (
            <div className="mb-5">
              <ErrorState error={localError} />
            </div>
          ) : null}

          {unconfigured ? (
            <div className="mb-5">
              <Notice tone="warn" title="Requirements have not been published yet">
                <p>
                  The organizer has not set the requirements on this contract, so there is nothing
                  to be judged against. Evaluation is blocked until they do.
                </p>
              </Notice>
            </div>
          ) : null}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              startSubmission();
            }}
          >
            <label htmlFor="evidence" className="block font-medium">
              Your evidence
            </label>
            <p id="evidence-help" className="mt-1.5 max-w-prose text-sm text-muted">
              Plain text. Include links, transaction hashes, usernames or IDs — whatever the
              requirements ask for. Validators read exactly what you write here and nothing else.
            </p>

            <textarea
              id="evidence"
              name="evidence"
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              aria-describedby="evidence-help evidence-count"
              aria-invalid={tooLong || undefined}
              rows={12}
              spellCheck
              className="mt-3 block min-h-[14rem] w-full resize-y rounded-sm border border-[color:var(--rule-strong)] bg-surface p-4 font-mono text-sm leading-relaxed"
              placeholder={
                "Deployed the contract at 0x… on Studio.\nTransaction: 0x…\nSource: github.com/…"
              }
            />

            <p
              id="evidence-count"
              className={`mt-2 text-sm tnum ${tooLong ? "text-declined" : "text-faint"}`}
            >
              {evidence.length.toLocaleString()} of {MAX_CHARS.toLocaleString()} characters
              {tooLong ? " — too long to submit" : ""}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {connected ? (
                <Button type="submit" size="lg" disabled={!canStart}>
                  {handingOff ? "Opening your claim…" : "Submit evidence"}
                </Button>
              ) : (
                <ConnectWallet size="lg" />
              )}

              {connected && trimmed.length === 0 ? (
                <span className="text-sm text-muted">Write your evidence first.</span>
              ) : null}
              {connected && wrongNetwork ? (
                <span className="text-sm text-muted">Switch network to continue.</span>
              ) : null}
            </div>

            <p className="mt-4 max-w-prose text-sm text-muted">
              Submitting creates the claim on chain. Requesting the evaluation is a second, separate
              transaction — you will do it from the claim page.
            </p>
          </form>
        </div>

        <aside>
          <Panel as="section" className="p-5">
            <h2 className="font-medium">What you are being judged against</h2>
            {loading ? <LoadingState label="Reading requirements" /> : null}
            {error ? <ErrorState error={error} onRetry={reload} /> : null}
            {!loading && !error && requirements && requirements.length > 0 ? (
              <div className="mt-2">
                <RequirementsList requirements={requirements} compact />
              </div>
            ) : null}
            {!loading && !error && unconfigured ? (
              <p className="mt-3 text-sm text-muted">Nothing published yet.</p>
            ) : null}
          </Panel>

          <Panel as="section" className="mt-5 p-5">
            <h2 className="font-medium">Writing evidence that holds up</h2>
            <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-muted">
              <li>Name the specific thing you did, not the category of work.</li>
              <li>Include something checkable: an address, a hash, a URL, an issue number.</li>
              <li>Cover every requirement — validators judge them as a set, not individually.</li>
              <li>
                Anything vague enough to apply to anyone tends to come back not approved.
              </li>
            </ul>
          </Panel>

          <div className="mt-5">
            <ButtonLink href="/claims" variant="secondary" className="w-full">
              See claims saved in this browser
            </ButtonLink>
          </div>
        </aside>
      </div>

      {!connected ? (
        <div className="mt-8">
          <EmptyState
            title="Connect a wallet to submit"
            body="Your address is read from the transaction you sign. There is no field to type it into, and no way to submit on someone else's behalf."
          />
        </div>
      ) : null}
    </AppShell>
  );
}
