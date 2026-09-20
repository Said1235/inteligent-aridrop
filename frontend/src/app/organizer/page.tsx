"use client";

import { useId, useState } from "react";
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

type Rule = { id: number; text: string };

let ruleIdSeq = 0;
const newRule = (text = ""): Rule => ({ id: (ruleIdSeq += 1), text });

/**
 * "Manage rules" — the organizer builds the requirements as discrete inputs,
 * one per rule, added and removed individually. There is no raw-JSON or
 * newline-delimited text field anywhere here: the array sent to
 * set_requirements is assembled directly from these inputs' values.
 */
export default function OrganizerPage() {
  const { status: walletStatus, account, networkConfirmed } = useWallet();
  const { requirements, unconfigured, loading, error, reload } = useRequirements();
  const tx = useWriteTransaction();
  const helpId = useId();
  const countId = useId();

  const [rules, setRules] = useState<Rule[]>([newRule()]);

  const values = rules.map((r) => r.text.trim());
  const nonEmpty = values.filter((v) => v.length > 0);
  const overLimit = nonEmpty.length > MAX_REQUIREMENTS;
  const overLongIds = rules.filter((r) => r.text.length > MAX_REQUIREMENT_CHARS).map((r) => r.id);

  const connected = walletStatus === "connected" && !!account;
  const sending = isInFlight(tx.state.phase);
  const alreadySet = requirements !== null && requirements.length > 0;

  const canPublish =
    connected && networkConfirmed && !alreadySet && !overLimit && overLongIds.length === 0 && !sending;

  const addRule = () => setRules((rs) => [...rs, newRule()]);
  const removeRule = (id: number) => setRules((rs) => rs.filter((r) => r.id !== id));
  const updateRule = (id: number, text: string) =>
    setRules((rs) => rs.map((r) => (r.id === id ? { ...r, text } : r)));

  const publish = async () => {
    // An empty list is valid: the contract falls back to its default
    // requirements. That still consumes the one and only call.
    const result = await tx.run({ method: METHODS.setRequirements, args: [nonEmpty] });
    if (result.phase === "success") reload();
  };

  return (
    <AppShell
      title="Manage rules"
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
                <div className="flex items-baseline justify-between gap-4">
                  <span className="block font-medium">Requirements</span>
                  <span
                    id={countId}
                    className={`text-sm tnum ${overLimit ? "text-declined" : "text-faint"}`}
                  >
                    {nonEmpty.length} of {MAX_REQUIREMENTS}
                  </span>
                </div>
                <p id={helpId} className="mt-1.5 max-w-prose text-sm text-muted">
                  One rule per field, written so a validator can check it against submitted
                  evidence. Add as many as this claim type needs; leave all of them blank to
                  publish the contract&rsquo;s built-in defaults instead.
                </p>

                <ol className="mt-4 space-y-3">
                  {rules.map((rule, i) => {
                    const tooLong = overLongIds.includes(rule.id);
                    return (
                      <li key={rule.id} className="flex items-start gap-2.5">
                        <span
                          className="mt-2.5 shrink-0 font-mono text-sm text-faint tnum"
                          aria-hidden="true"
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0 flex-1">
                          <label htmlFor={`rule-${rule.id}`} className="sr-only">
                            Requirement {i + 1}
                          </label>
                          <input
                            id={`rule-${rule.id}`}
                            type="text"
                            value={rule.text}
                            onChange={(e) => updateRule(rule.id, e.target.value)}
                            aria-describedby={helpId}
                            aria-invalid={tooLong || undefined}
                            className="block w-full rounded-sm border border-[color:var(--rule-strong)] bg-surface p-2.5 text-[0.9375rem]"
                            placeholder="e.g. The evidence must include the deployed contract address"
                          />
                          {tooLong ? (
                            <p role="alert" className="mt-1 text-sm text-declined">
                              {rule.text.length} characters — over the {MAX_REQUIREMENT_CHARS} limit.
                            </p>
                          ) : null}
                        </div>
                        <Button
                          type="button"
                          variant="quiet"
                          size="md"
                          className="mt-0.5 shrink-0 !px-2 text-muted hover:text-declined"
                          onClick={() => removeRule(rule.id)}
                          aria-label={`Remove requirement ${i + 1}`}
                        >
                          <span aria-hidden="true">✕</span>
                        </Button>
                      </li>
                    );
                  })}
                </ol>

                <Button type="button" variant="secondary" className="mt-4" onClick={addRule}>
                  + Add rule
                </Button>

                {overLimit ? (
                  <p role="alert" className="mt-3 text-sm text-declined">
                    That&rsquo;s {nonEmpty.length} rules — the contract accepts at most{" "}
                    {MAX_REQUIREMENTS}. Remove {nonEmpty.length - MAX_REQUIREMENTS} to continue.
                  </p>
                ) : null}

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {connected ? (
                    <Button type="submit" size="lg" disabled={!canPublish}>
                      {sending ? "Publishing…" : "Set requirements"}
                    </Button>
                  ) : (
                    <ConnectWallet size="lg" />
                  )}
                  {connected && nonEmpty.length === 0 ? (
                    <span className="text-sm text-muted">
                      Publishing with none filled in uses the contract defaults.
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
