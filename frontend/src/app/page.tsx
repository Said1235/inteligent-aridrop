import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ButtonLink } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { ConsensusMark } from "@/components/ConsensusMark";
import { CHAIN_NAME } from "@/lib/chain";

function Section({
  id,
  heading,
  children,
  bordered = true,
}: {
  id?: string;
  heading?: string;
  children: React.ReactNode;
  bordered?: boolean;
}) {
  return (
    <section
      id={id}
      className={`mx-auto max-w-shell px-4 py-14 sm:px-6 sm:py-20 ${
        bordered ? "border-t border-[color:var(--rule)]" : ""
      }`}
    >
      {heading ? <h2 className="text-title font-semibold">{heading}</h2> : null}
      {children}
    </section>
  );
}

/** The hero figure: the mechanism itself, drawn from the contract's real shape. */
function MechanismFigure() {
  return (
    <figure className="rounded-sm border border-[color:var(--rule-strong)] bg-surface">
      <figcaption className="border-b border-[color:var(--rule)] px-5 py-3 text-sm text-muted">
        How one claim reaches a verdict
      </figcaption>

      <div className="grid gap-px bg-[color:var(--rule)] sm:grid-cols-3">
        <div className="bg-surface p-5">
          <p className="text-2xs text-faint">Fixed by the organizer, once</p>
          <p className="mt-2 font-medium">Requirements</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li className="flex gap-2">
              <span className="font-mono text-faint">01</span>
              <span>Deployed a contract on a testnet</span>
            </li>
            <li className="flex gap-2">
              <span className="font-mono text-faint">02</span>
              <span>Evidence names the deploying address</span>
            </li>
          </ul>
        </div>

        <div className="bg-surface p-5">
          <p className="text-2xs text-faint">Written by the claimant</p>
          <p className="mt-2 font-medium">Evidence</p>
          <p className="mt-3 border-l-2 border-[color:var(--rule-strong)] pl-3 font-mono text-sm leading-relaxed text-muted">
            Deployed IntelligentAirdrop from 0x7bd1…4a02, tx 0x9c1a…, contract visible in Studio.
          </p>
        </div>

        <div className="bg-surface p-5">
          <p className="text-2xs text-faint">Each validator judges alone</p>
          <p className="mt-2 font-medium">Verdict</p>
          <div className="mt-3 flex items-center gap-3">
            <ConsensusMark status="qualifies" height={26} animate />
            <StatusBadge status="qualifies" size="sm" />
          </div>
          <p className="mt-3 text-sm text-muted">
            Recorded on chain as <span className="font-mono">qualifies</span>, with the evidence
            that produced it.
          </p>
        </div>
      </div>
    </figure>
  );
}

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-ink focus:px-3 focus:py-2 focus:text-[color:var(--surface)]"
      >
        Skip to content
      </a>
      <Header variant="landing" />

      <main id="main" className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-shell px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14">
            <div className="max-w-prose">
              <h1 className="text-display font-semibold">
                Prove you did the work. Let independent validators decide.
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted">
                An organizer publishes a fixed set of requirements. You submit evidence in your own
                words. Several AI validators read it separately, with no way to coordinate, and the
                contract records what they agreed on.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <ButtonLink href="/app/submit" size="lg">
                  Submit your evidence
                </ButtonLink>
                <ButtonLink href="/app" variant="secondary" size="lg">
                  See the active requirements
                </ButtonLink>
              </div>
              <p className="mt-5 text-sm text-faint">
                Runs on {CHAIN_NAME}. No tokens move through this contract.
              </p>
            </div>

            <MechanismFigure />
          </div>
        </section>

        {/* Problem */}
        <Section heading="One evaluator is a single point of failure">
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div className="max-w-prose space-y-4 text-[1.0625rem] leading-relaxed">
              <p>
                Task verification usually ends at one desk: a company, an admin, or a single language
                model with nothing checking it. Whoever sits there can be tired, biased, or talked
                into the wrong answer — and the person submitting evidence has a direct reason to
                try.
              </p>
              <p>
                That incentive is the whole problem. Evidence is free to exaggerate. A vague
                paragraph that sounds like work often passes, and a real contribution written
                plainly sometimes does not.
              </p>
              <p>
                GenLayer answers that specific shape of problem. Several validators evaluate the
                same evidence against the same published rules, independently, and the result is
                only recorded when they agree. Convincing one reader is easy. Convincing several
                that cannot talk to each other is a different thing.
              </p>
            </div>

            <div className="rounded-sm border border-[color:var(--rule)] bg-surface">
              <div className="border-b border-[color:var(--rule)] p-5">
                <p className="font-medium">A single evaluator</p>
                <p className="mt-2 text-sm text-muted">
                  One judgment, one point of pressure. Nothing contradicts it, and the reasoning is
                  usually private.
                </p>
              </div>
              <div className="p-5">
                <p className="font-medium">Validator consensus</p>
                <p className="mt-2 text-sm text-muted">
                  Several judgments on identical inputs. A verdict is recorded only where they
                  converge, and the evidence behind it stays readable by anyone.
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* How it works — a genuine sequence, so it is numbered */}
        <Section heading="How it works">
          <ol className="mt-8 grid gap-px bg-[color:var(--rule)] sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                n: "01",
                t: "Requirements are published",
                b: "The organizer sets them once, from the wallet that deployed the contract. After that first call they cannot be edited by anyone, including the organizer.",
              },
              {
                n: "02",
                t: "You submit evidence",
                b: "Free text: links, IDs, a description of what you did. Your wallet address is taken from the transaction, never typed into a field.",
              },
              {
                n: "03",
                t: "Validators evaluate",
                b: "Anyone can trigger the evaluation. Each validator reads the same evidence against the same requirements and decides on its own.",
              },
              {
                n: "04",
                t: "The verdict is recorded",
                b: "The contract stores approved or not approved against your claim ID. It is written once and never changes.",
              },
            ].map((step) => (
              <li key={step.n} className="bg-paper p-5">
                <span className="font-mono text-sm text-accent tnum">{step.n}</span>
                <p className="mt-2.5 font-medium">{step.t}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.b}</p>
              </li>
            ))}
          </ol>
        </Section>

        {/* Benefits */}
        <Section heading="What you actually get">
          <div className="mt-8 grid max-w-prose gap-6 lg:max-w-none lg:grid-cols-3">
            {[
              {
                t: "No single evaluator to convince",
                b: "The verdict comes from several validators judging independently, not from one account you could persuade or pressure.",
              },
              {
                t: "Every claim is readable by anyone",
                b: "The evidence and the verdict both live on chain under a claim ID. An outside auditor can read any claim without asking permission.",
              },
              {
                t: "The rules cannot move",
                b: "Requirements are set once and frozen. The conditions you were judged against are the same ones everyone else got.",
              },
            ].map((item) => (
              <div key={item.t} className="border-t-2 border-ink pt-4">
                <p className="font-medium">{item.t}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.b}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Use cases */}
        <Section heading="What people use it for">
          <dl className="mt-8 divide-y divide-[color:var(--rule)] border-y border-[color:var(--rule)]">
            {[
              {
                t: "Testnet deployments",
                b: "Checking that someone really deployed a working contract, rather than pasting an address they found.",
                e: "Deployed at 0x7bd1…4a02 on Studio, tx 0x9c1a…, source in the repo below.",
              },
              {
                t: "Written documentation",
                b: "Checking that a tutorial or guide exists, is theirs, and covers what the requirements asked for.",
                e: "Wrote the integration guide at example.dev/guide, published 12 March, author handle @eloin.",
              },
              {
                t: "Bug reports",
                b: "Checking that a report describes a real, reproducible problem instead of a generic complaint.",
                e: "Filed issue #212 with a reproduction repo and the failing test output.",
              },
            ].map((item) => (
              <div key={item.t} className="grid gap-3 py-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
                <dt className="font-medium">{item.t}</dt>
                <dd>
                  <p className="max-w-prose text-sm leading-relaxed text-muted">{item.b}</p>
                  <p className="mt-2.5 max-w-prose border-l-2 border-[color:var(--rule-strong)] pl-3 font-mono text-sm text-muted">
                    {item.e}
                  </p>
                </dd>
              </div>
            ))}
          </dl>
        </Section>

        {/* Product experience */}
        <Section heading="What a finished claim looks like">
          <p className="mt-3 max-w-prose text-muted">
            Every claim gets its own page at a fixed address. Reload it, bookmark it, or send it to
            someone months later — it always shows the same claim.
          </p>

          <div className="mt-8 max-w-3xl rounded-sm border border-[color:var(--rule-strong)] bg-surface">
            <div className="flex flex-wrap items-center gap-3 border-b border-[color:var(--rule)] px-5 py-4">
              <ConsensusMark status="does_not_qualify" height={22} />
              <span className="font-mono text-sm text-muted">/claim/8814…20713</span>
              <span className="ml-auto">
                <StatusBadge status="does_not_qualify" size="sm" />
              </span>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <p className="text-2xs text-faint">Evidence, as submitted</p>
                <p className="mt-2 font-mono text-sm leading-relaxed text-muted">
                  I have been active in the community for a long time and contributed a lot to the
                  ecosystem.
                </p>
              </div>
              <p className="max-w-prose text-sm">
                Not approved. The requirements ask for a specific, verifiable action; this describes
                a general impression instead. The contract does not store a reason, so the app does
                not invent one.
              </p>
            </div>
          </div>
        </Section>

        {/* Transparency — only verifiable claims */}
        <Section heading="What this does and does not guarantee">
          <div className="mt-8 grid gap-10 lg:grid-cols-2">
            <div>
              <p className="font-medium">What you can verify yourself</p>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
                <li className="border-l-2 border-approved pl-3">
                  Requirements are stored on chain and the contract rejects a second attempt to set
                  them.
                </li>
                <li className="border-l-2 border-approved pl-3">
                  The claimant address is read from the transaction sender, so it cannot be typed in
                  or faked through the form.
                </li>
                <li className="border-l-2 border-approved pl-3">
                  Evidence and verdict are both readable by anyone with the claim ID, through this
                  app or directly against the contract.
                </li>
                <li className="border-l-2 border-approved pl-3">
                  A claim is evaluated once; the recorded verdict cannot be overwritten.
                </li>
                <li className="border-l-2 border-approved pl-3">
                  No tokens move through this contract. It has no payable method and no transfer.
                </li>
              </ul>
            </div>
            <div>
              <p className="font-medium">What it does not do</p>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
                <li className="border-l-2 border-[color:var(--rule-strong)] pl-3">
                  It does not stop one person from submitting many claims from many wallets. There
                  is no Sybil resistance here.
                </li>
                <li className="border-l-2 border-[color:var(--rule-strong)] pl-3">
                  It does not detect duplicate or copied evidence between claims.
                </li>
                <li className="border-l-2 border-[color:var(--rule-strong)] pl-3">
                  It does not visit links. Validators judge the text they are given.
                </li>
                <li className="border-l-2 border-[color:var(--rule-strong)] pl-3">
                  It does not explain a verdict. Only the two words are stored.
                </li>
                <li className="border-l-2 border-[color:var(--rule-strong)] pl-3">
                  It does not pay anyone. Deciding what an approved claim is worth belongs to
                  another system.
                </li>
              </ul>
            </div>
          </div>
        </Section>

        {/* Final CTA */}
        <section className="border-t border-[color:var(--rule)]">
          <div className="mx-auto max-w-shell px-4 py-16 sm:px-6 sm:py-20">
            <div className="max-w-prose">
              <h2 className="text-title font-semibold">Ready to put it on the record?</h2>
              <p className="mt-4 text-lg text-muted">
                Read the active requirements, then write what you did and who can check it.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/app/submit" size="lg">
                  Submit your evidence
                </ButtonLink>
                <Link
                  href="/organizer"
                  className="inline-flex min-h-[48px] items-center text-base underline decoration-[color:var(--rule-strong)] underline-offset-4 hover:decoration-ink"
                >
                  I deployed this contract
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
