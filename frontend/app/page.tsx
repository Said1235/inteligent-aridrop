"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GenLayerTransactionPanel, type SubmitInput, type TrackedStatus } from "@genlayer/transaction-kit-react";
import { RequirementsList } from "@/components/RequirementsList";
import { useTransactionKit } from "@/lib/genlayer/kit";
import { useWallet } from "@/lib/genlayer/wallet";
import { getContractAddress, GENLAYER_NETWORK } from "@/lib/genlayer/client";
import { generateClaimId } from "@/lib/utils/claimId";
import { error as toastError } from "@/lib/utils/toast";

export default function Home() {
  const router = useRouter();
  const { address, isConnected } = useWallet();
  const kit = useTransactionKit(address);
  const contractAddress = getContractAddress();

  const [evidence, setEvidence] = useState("");
  const [step, setStep] = useState<"submit" | "review">("submit");
  // Generated ONCE, client-side, before any signature — never from a tx
  // return value, never inferred from "the caller's last claim".
  const [claimId] = useState<string>(() => generateClaimId());

  const submitTx = useMemo<SubmitInput>(
    () => ({
      kind: "write",
      address: contractAddress as `0x${string}`,
      method: "submit_claim",
      args: [BigInt(claimId), evidence],
    }),
    [contractAddress, claimId, evidence],
  );

  const trimmed = evidence.trim();

  const handleDone = (status: TrackedStatus) => {
    if (status.successful !== false) {
      router.push(`/claim/${claimId}`);
      return;
    }
    toastError("Submission did not complete", {
      description: "The transaction finished without a successful outcome. You can try again with a new claim.",
    });
  };

  return (
    <main>
      {/* ===== Landing ===== */}
      <div className="landing-hero">
        <h1>Prove the work. Let consensus decide.</h1>
        <p>
          This isn&apos;t a token faucet — it&apos;s an eligibility oracle. You did
          something real; describe it with evidence, and a consensus of independent
          AI validators decides whether it genuinely satisfies the campaign&apos;s public
          requirements. Not one company. Not a private backend.
        </p>
      </div>

      <div className="landing-section">
        <h2>The problem with self-graded claims</h2>
        <p className="body-copy">
          A single backend judging its own campaign has no accountability — it could
          quietly favor or reject claims and nobody could check. Vague, low-effort
          evidence dressed up to look like real work is hard to catch when one party
          both sets the bar and grades against it.
        </p>
      </div>

      <div className="landing-section">
        <h2>How it works</h2>
        <div className="steps">
          <div className="step"><span className="n mono">1</span><span className="t">Read the requirements below — the real, on-chain rubric, not a summary.</span></div>
          <div className="step"><span className="n mono">2</span><span className="t">Submit your evidence — concrete, specific, checkable.</span></div>
          <div className="step"><span className="n mono">3</span><span className="t">On your claim&apos;s own page, request an evaluation — anyone can, not just you.</span></div>
          <div className="step"><span className="n mono">4</span><span className="t">A validator consensus judges it: qualifies, or does not qualify.</span></div>
        </div>
      </div>

      <div className="landing-section">
        <h2>Why decentralized judgment</h2>
        <p className="body-copy">
          The requirements are public (<span className="mono">get_requirements()</span>),
          the evidence is public, and the verdict comes from a validator consensus
          checking the same criteria anyone else can read — not a rule nobody can audit.
          What happens with a qualifying verdict (a payout, access, anything else) is
          the job of a separate system; this contract only settles the judgment itself.
        </p>
      </div>

      {/* ===== Submit ===== */}
      <div className="landing-section" style={{ borderBottom: "none" }}>
        <h2>Submit your evidence</h2>
        <p className="body-copy" style={{ marginBottom: 18 }}>
          This is a two-step process: submitting your evidence now, then a separate,
          explicit signature to request evaluation once you&apos;re on the claim page.
        </p>

        <div style={{ marginBottom: 20 }}>
          <RequirementsList />
        </div>

        {step === "submit" && (
          <>
            <textarea
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="Describe the specific work you completed, with concrete, checkable details (links, steps, outputs)…"
            />
            <div className="validation">
              {trimmed.length === 0 ? "Write your evidence before submitting." : ""}
            </div>
            <div className="actions">
              <button className="btn btn-primary" disabled={trimmed.length === 0} onClick={() => setStep("review")}>
                Review before signing →
              </button>
            </div>
          </>
        )}

        {step === "review" && (
          <div className="view">
            <div className="review-text">{evidence}</div>

            <div className="notice">
              This claim will live at its own page (<span className="mono">/claim/{claimId}</span>) from
              the moment it&apos;s submitted. Requesting evaluation afterward is a separate
              signature you do on that page, whenever you&apos;re ready — it isn&apos;t part of
              this transaction.
            </div>

            {!isConnected && (
              <p className="body-copy" style={{ color: "var(--notqualify)" }}>
                Connect your wallet above to sign and submit.
              </p>
            )}

            <div className="actions" style={{ marginTop: 0, marginBottom: 18 }}>
              <button className="btn btn-secondary" onClick={() => setStep("submit")}>
                ← Edit text
              </button>
            </div>

            {kit && contractAddress ? (
              <GenLayerTransactionPanel
                kit={kit}
                tx={submitTx}
                network={GENLAYER_NETWORK.chainName}
                theme="light"
                trackUntil="decided"
                onDone={handleDone}
              />
            ) : (
              <p className="body-copy" style={{ color: "var(--notqualify)" }}>
                {!contractAddress
                  ? "Contract address not configured — set NEXT_PUBLIC_CONTRACT_ADDRESS in frontend/.env."
                  : "Connect your wallet to continue."}
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
