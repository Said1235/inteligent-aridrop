"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { GenLayerTransactionPanel, type SubmitInput, type TrackedStatus } from "@genlayer/transaction-kit-react";
import { WalletButton } from "@/components/WalletButton";
import { RequirementsList } from "@/components/RequirementsList";
import { StatusBadge } from "@/components/StatusBadge";
import { TechnicalField } from "@/components/TechnicalField";
import { useClaim, useInvalidateClaim } from "@/lib/hooks/useIntelligentAirdrop";
import { useTransactionKit } from "@/lib/genlayer/kit";
import { useWallet } from "@/lib/genlayer/wallet";
import { getContractAddress, GENLAYER_NETWORK } from "@/lib/genlayer/client";
import { isValidClaimId } from "@/lib/utils/claimId";

export default function ClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: claimId } = use(params);
  const { address } = useWallet();
  const kit = useTransactionKit(address);
  const contractAddress = getContractAddress();
  const invalidateClaim = useInvalidateClaim(claimId);

  const validId = isValidClaimId(claimId);
  const { data: claim, isLoading, isError } = useClaim(validId ? claimId : null);

  const evaluateTx = useMemo<SubmitInput>(
    () => ({
      kind: "write",
      address: contractAddress as `0x${string}`,
      method: "evaluate_claim",
      args: [BigInt(validId ? claimId : "0")],
    }),
    [contractAddress, claimId, validId],
  );

  const handleEvaluateDone = (status: TrackedStatus) => {
    invalidateClaim();
  };

  return (
    <main style={{ maxWidth: 680, margin: "0 auto", padding: "24px 20px 90px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <Link href="/" className="mono" style={{ fontSize: 12, color: "var(--pending)" }}>
          ← New claim
        </Link>
        <WalletButton />
      </div>

      {!validId && (
        <NotFound reason="This isn't a valid claim ID." />
      )}

      {validId && isLoading && (
        <p style={{ fontSize: 14, color: "var(--pending)" }}>Loading claim…</p>
      )}

      {validId && !isLoading && isError && (
        <p style={{ fontSize: 14, color: "var(--notqualify)" }}>
          Could not reach the contract. Check the network and try again.
        </p>
      )}

      {validId && !isLoading && !isError && claim === null && (
        <NotFound reason="No record found for this ID." />
      )}

      {validId && !isLoading && !isError && claim && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
            <StatusBadge status={claim.status} />
            <span className="mono" style={{ fontSize: 12, color: "var(--pending)", display: "flex", alignItems: "center", gap: 8 }}>
              Claim #<TechnicalField label="Claim ID" value={claimId} />
            </span>
          </div>

          <div style={{ marginBottom: 18 }}>
            <RequirementsList />
          </div>

          <div className="surface" style={{ padding: 18, marginBottom: 22 }}>
            <div style={{ fontSize: 11, color: "var(--pending)", marginBottom: 10 }}>Evidence submitted</div>
            <div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{claim.evidenceText}</div>
          </div>

          {claim.status === "pending" && (
            <div style={{ marginBottom: 8 }}>
              {kit && contractAddress ? (
                <>
                  <p style={{ fontSize: 13, color: "var(--pending)", marginBottom: 10 }}>
                    Anyone can request evaluation — not only the claimant.
                  </p>
                  <GenLayerTransactionPanel
                    kit={kit}
                    tx={evaluateTx}
                    network={GENLAYER_NETWORK.chainName}
                    theme="light"
                    trackUntil="decided"
                    onDone={handleEvaluateDone}
                  />
                </>
              ) : (
                <p style={{ fontSize: 13, color: "var(--notqualify)" }}>
                  Connect a wallet to request evaluation.
                </p>
              )}
            </div>
          )}

          {claim.status === "does_not_qualify" && (
            <p style={{ fontSize: 14, color: "var(--pending)" }}>
              This claim&apos;s evidence did not qualify. The contract doesn&apos;t record a
              specific reason beyond this verdict.
            </p>
          )}

          {claim.status === "qualifies" && (
            <p style={{ fontSize: 14, color: "var(--qualifies)" }}>
              This claim qualified. What happens next (payout, access, anything else)
              is handled outside this contract.
            </p>
          )}

          <details style={{ marginTop: 28, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
            <summary style={{ cursor: "pointer", fontSize: 13, color: "var(--pending)" }}>Technical details</summary>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: 13, marginTop: 10 }}>
              <span style={{ color: "var(--pending)" }}>Claimant</span>
              <TechnicalField label="Claimant address" value={claim.claimant} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: 13 }}>
              <span style={{ color: "var(--pending)" }}>Claim ID (full)</span>
              <TechnicalField label="Claim ID" value={claimId} />
            </div>
          </details>
        </>
      )}
    </main>
  );
}

function NotFound({ reason }: { reason: string }) {
  return (
    <div className="surface" style={{ padding: "40px 24px", textAlign: "center" }}>
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>No claim found</h1>
      <p style={{ fontSize: 14, color: "var(--pending)", marginBottom: 20 }}>{reason}</p>
      <Link href="/" className="btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>
        Submit a new claim
      </Link>
    </div>
  );
}
