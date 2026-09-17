"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GenLayerTransactionPanel, type SubmitInput, type TrackedStatus } from "@genlayer/transaction-kit-react";
import { WalletButton } from "@/components/WalletButton";
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
  const [step, setStep] = useState<"form" | "review">("form");
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
  const canReview = trimmed.length > 0;

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
    <main style={{ maxWidth: 680, margin: "0 auto", padding: "24px 20px 90px" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 28 }}>
        <WalletButton />
      </div>

      {/* ---- Landing / how it works ---- */}
      <section style={{ marginBottom: 40, paddingBottom: 32, borderBottom: "1px solid var(--border)" }}>
        <h1 style={{ fontSize: 30, lineHeight: 1.15, maxWidth: "18ch" }}>
          Submit evidence. Let independent validators judge it.
        </h1>
        <p style={{ fontSize: 15, marginTop: 16, maxWidth: "58ch", color: "#4a4437" }}>
          This is an eligibility oracle, not a payout system. You describe a piece of
          work with concrete evidence, and a consensus of independent AI validators —
          not one company, not a single backend — judges whether it genuinely satisfies
          the campaign&apos;s public requirements. The verdict is{" "}
          <strong>qualifies</strong> or <strong>does not qualify</strong>. What happens
          with that verdict (a payout, access, anything else) is the job of a separate
          system — this contract only settles the judgment itself.
        </p>
        <p style={{ fontSize: 14, marginTop: 14, maxWidth: "58ch", color: "var(--pending)" }}>
          Why does that matter? A single backend judging its own campaign has no
          accountability — it could quietly favor or reject claims with nobody able to
          check. Here, the requirements are public, the evidence is public, and the
          verdict comes from a decentralized validator consensus checking the same
          criteria everyone else can see.
        </p>
      </section>

      {/* ---- Submit ---- */}
      <section>
        <h2 style={{ fontSize: 20, marginBottom: 4 }}>Submit your evidence</h2>
        <p style={{ fontSize: 13, color: "var(--pending)", marginBottom: 18 }}>
          This is a two-step process: submitting your evidence, then a separate,
          explicit step to request evaluation once you&apos;re on the claim page.
        </p>

        <div style={{ marginBottom: 20 }}>
          <RequirementsList />
        </div>

        {step === "form" && (
          <>
            <textarea
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="Describe the specific work you completed, with concrete, checkable details (links, steps, outputs)…"
            />
            <div style={{ fontSize: 12, color: "var(--notqualify)", marginTop: 8, minHeight: 16 }}>
              {trimmed.length === 0 ? "Write your evidence before submitting." : ""}
            </div>
            <div style={{ marginTop: 20 }}>
              <button className="btn-primary" disabled={!canReview} onClick={() => setStep("review")}>
                Review before signing →
              </button>
            </div>
          </>
        )}

        {step === "review" && (
          <div style={{ marginTop: 4 }}>
            <button className="btn-secondary" onClick={() => setStep("form")} style={{ marginBottom: 16 }}>
              ← Edit text
            </button>

            <div className="surface" style={{ padding: 16, marginBottom: 16, whiteSpace: "pre-wrap", fontSize: 14 }}>
              {evidence}
            </div>

            <div
              className="surface"
              style={{ padding: "14px 16px", marginBottom: 18, fontSize: 13, borderLeft: "3px solid var(--accent)" }}
            >
              This claim will live at its own page (<span className="mono">/claim/{claimId}</span>) from the
              moment it&apos;s submitted. Requesting evaluation afterward is a separate signature you do on that page,
              whenever you&apos;re ready — it isn&apos;t part of this transaction.
            </div>

            {!isConnected && (
              <p style={{ fontSize: 13, color: "var(--notqualify)", marginBottom: 12 }}>
                Connect your wallet above to sign and submit.
              </p>
            )}

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
              <p style={{ fontSize: 13, color: "var(--notqualify)" }}>
                {!contractAddress
                  ? "Contract address not configured — set NEXT_PUBLIC_CONTRACT_ADDRESS in frontend/.env."
                  : "Connect your wallet to continue."}
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
