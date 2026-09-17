"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { GenLayerTransactionPanel, type SubmitInput, type TrackedStatus } from "@genlayer/transaction-kit-react";
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

  const handleEvaluateDone = (_status: TrackedStatus) => {
    invalidateClaim();
  };

  return (
    <main>
      <Link href="/" className="mono body-copy" style={{ display: "inline-block", marginBottom: 24 }}>
        ← New claim
      </Link>

      {!validId && <NotFound reason="This isn't a valid claim ID." />}

      {validId && isLoading && <p className="body-copy">Loading claim…</p>}

      {validId && !isLoading && isError && (
        <p className="body-copy" style={{ color: "var(--notqualify)" }}>
          Could not reach the contract. Check the network and try again.
        </p>
      )}

      {validId && !isLoading && !isError && claim === null && (
        <NotFound reason="No record found for this ID." />
      )}

      {validId && !isLoading && !isError && claim && (
        <div className="view">
          <div className="record-head">
            <StatusBadge status={claim.status} />
            <span className="body-copy" style={{ margin: 0 }}>
              Claim #<TechnicalField label="Claim ID" value={claimId} />
            </span>
          </div>

          <div style={{ marginBottom: 18 }}>
            <RequirementsList />
          </div>

          <div className="evidence">
            <div className="evidence-label">Evidence submitted</div>
            {claim.evidenceText}
          </div>

          {claim.status === "pending" && (
            <div style={{ marginBottom: 8 }}>
              {kit && contractAddress ? (
                <>
                  <p className="body-copy" style={{ marginBottom: 10 }}>
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
                <p className="body-copy" style={{ color: "var(--notqualify)" }}>
                  Connect a wallet to request evaluation.
                </p>
              )}
            </div>
          )}

          {claim.status === "does_not_qualify" && (
            <p className="body-copy result-reveal">
              This claim&apos;s evidence did not qualify. The contract doesn&apos;t record a
              specific reason beyond this verdict.
            </p>
          )}

          {claim.status === "qualifies" && (
            <p className="body-copy result-reveal" style={{ color: "var(--qualifies)" }}>
              This claim qualified. What happens next (payout, access, anything else)
              is handled outside this contract.
            </p>
          )}

          <details className="tech-details">
            <summary>Technical details</summary>
            <div className="tech-row">
              <span className="label">Claimant</span>
              <TechnicalField label="Claimant address" value={claim.claimant} />
            </div>
            <div className="tech-row">
              <span className="label">Claim ID (full)</span>
              <TechnicalField label="Claim ID" value={claimId} />
            </div>
          </details>
        </div>
      )}
    </main>
  );
}

function NotFound({ reason }: { reason: string }) {
  return (
    <div className="empty-state">
      <h1 className="h1" style={{ marginBottom: 8 }}>No claim found</h1>
      <p className="body-copy" style={{ marginBottom: 0 }}>{reason}</p>
      <Link href="/" className="btn btn-primary" style={{ textDecoration: "none" }}>
        Submit a new claim
      </Link>
    </div>
  );
}
