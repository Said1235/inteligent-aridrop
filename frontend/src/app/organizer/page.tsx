"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, ButtonLink } from "@/components/Button";
import { ConnectWallet } from "@/components/ConnectWallet";
import { NetworkStatus } from "@/components/NetworkStatus";
import { RequirementsList } from "@/components/RequirementsList";
import { TransactionStatus } from "@/components/TransactionStatus";
import { ErrorState, LoadingState, Notice, Panel } from "@/components/States";
import { useRequirements } from "@/hooks/useRequirements";
import { isInFlight, useWriteTransaction } from "@/hooks/useWriteTransaction";
import { useWallet } from "@/components/WalletProvider";
import { METHODS } from "@/lib/contract";

const MAX_REQUIREMENTS = 20;
const MAX_REQUIREMENT_CHARS = 500;

export default function OrganizerPage() {
  const { status: walletStatus, account, wrongNetwork } = useWallet();
  const { requirements, unconfigured, loading, error, reload } = useRequirements();
  const tx = useWriteTransaction();

  const [text, setText] = useState("");

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const overLimit = lines.length > MAX_REQUIREMENTS;
  const tooLong = lines.find((l) => l.length > MAX_REQUIREMENT_CHARS);

  const connected = walletStatus === "connected" && !!account;
  const sending = isInFlight(tx.state.phase);
  const alreadySet = requirements !== null && requirements.length > 0;

  const canPublish =
    connected && !wrongNetwork && !alreadySet && !overLimit && !tooLong && !sending;

  const publish = async () => {
    // An empty list is valid: the contract falls back to its default
    // requirements. That still consumes the one and only call.
    const result = await tx.run({ method: METHODS.setRequirements, args: [lines] });
    if (result.phase === "success") reload();
  };

  return (
    <AppShell
      title="Organizer"
      lead="Publish the requirements every claim will be judged against. Only the wallet that deployed this contract can do it, and only once."
    >
      <NetworkStatus />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
        <div>
          {loading ? (
            <Panel>
              <LoadingState label="Checking whether requirements are already published" />
            </Panel>
          ) : null}

          {error ? <ErrorState error={error} onRetry={reload} /> : null}

          {!loading && alreadySet ? (
            <section>
              <Notice title="Requirements are already published">
                <p>
                  They were set once and are now immutable. A second call reverts with{" "}
                  <span className="font-mono text-sm">requirements already set</span>.
                </p>
              </Notice>
              <Panel className="mt-5 px-5">
                <RequirementsList requirements={requirements ?? []} />
              </Panel>
              <div className="mt-6">
                <ButtonLink href="/app">Go to the app</ButtonLink>
              </div>
            </section>
          ) : null}

          {!loading && !error && unconfigured ? (
            <section>
              <Notice tone="warn" title="This cannot be undone">
                <p>
                  Requirements are written once. There is no edit, no reset and no admin override —
                  check the wording carefully before publishing.
                </p>
              </Notice>

              <form
                className="mt-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (canPublish) void publish();
                }}
              >
                <label htmlFor="requirements" className="block font-medium">
                  Requirements, one per line
                </label>
                <p id="requirements-help" className="mt-1.5 max-w-prose text-sm text-muted">
                  Write each rule so a validator can check it against submitted evidence. Up to{" "}
                  {MAX_REQUIREMENTS} rules, {MAX_REQUIREMENT_CHARS} characters each. Leave this
                  empty to publish the contract&rsquo;s built-in defaults instead.
                </p>

                <textarea
                  id="requirements"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  aria-describedby="requirements-help requirements-count"
                  aria-invalid={overLimit || !!tooLong || undefined}
                  rows={10}
                  className="mt-3 block min-h-[12rem] w-full resize-y rounded-sm border border-[color:var(--rule-strong)] bg-surface p-4 font-mono text-sm leading-relaxed"
                  placeholder={
                    "The claimant must have deployed a working contract on GenLayer Studio\nThe evidence must include the deployed contract address"
                  }
                />

                <p
                  id="requirements-count"
                  className={`mt-2 text-sm tnum ${overLimit ? "text-declined" : "text-faint"}`}
                >
                  {lines.length} of {MAX_REQUIREMENTS} rules
                  {overLimit ? " — too many, the contract will reject this" : ""}
                </p>
                {tooLong ? (
                  <p role="alert" className="mt-1 max-w-prose text-sm text-declined">
                    One rule is longer than {MAX_REQUIREMENT_CHARS} characters. Shorten it before
                    publishing.
                  </p>
                ) : null}

                {lines.length > 0 ? (
                  <div className="mt-6">
                    <h2 className="font-medium">Preview</h2>
                    <Panel className="mt-3 px-5">
                      <RequirementsList requirements={lines} compact />
                    </Panel>
                  </div>
                ) : null}

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {connected ? (
                    <Button type="submit" size="lg" disabled={!canPublish}>
                      {sending ? "Publishing…" : "Set requirements"}
                    </Button>
                  ) : (
                    <ConnectWallet size="lg" />
                  )}
                  {connected && lines.length === 0 ? (
                    <span className="text-sm text-muted">
                      Publishing with an empty list uses the contract defaults.
                    </span>
                  ) : null}
                </div>

                <TransactionStatus
                  state={tx.state}
                  successTitle="Requirements published"
                  successBody="They are now active and immutable. Claims can be evaluated against them."
                  onRetry={tx.reset}
                />
              </form>
            </section>
          ) : null}
        </div>

        <aside>
          <Panel as="section" className="p-5">
            <h2 className="font-medium">Who can do this</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Only the wallet that deployed the contract. Any other wallet is rejected with{" "}
              <span className="font-mono text-2xs">only the organizer can set requirements</span>.
              The organizer address is fixed at deploy time and is not a field anyone can set.
            </p>
          </Panel>

          <Panel as="section" className="mt-5 p-5">
            <h2 className="font-medium">Until this is done</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              People can submit evidence, but no claim can be evaluated. The contract refuses to run
              an evaluation against an empty rule set, so nobody can be approved by default.
            </p>
          </Panel>
        </aside>
      </div>
    </AppShell>
  );
}
