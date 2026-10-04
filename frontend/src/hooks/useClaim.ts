"use client";

import { useCallback, useEffect, useState } from "react";
import { ClaimNotFoundError, fetchClaim } from "@/lib/reads";
import type { Claim } from "@/lib/contract";
import { toAppError, type AppError } from "@/lib/errors";

export type ClaimState = {
  claim: Claim | null;
  /** The contract has no record under this exact id. */
  notFound: boolean;
  loading: boolean;
  error: AppError | null;
  reload: () => void;
};

/**
 * Read a single claim by the exact id given. The id is the only input; this
 * hook has no notion of "current wallet", "latest" or "most recent".
 */
export function useClaim(claimId: bigint | null): ClaimState {
  const [claim, setClaim] = useState<Claim | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(claimId !== null);
  const [error, setError] = useState<AppError | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (claimId === null) {
      setClaim(null);
      setNotFound(false);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchClaim(claimId)
      .then((value) => {
        if (cancelled) return;
        setClaim(value);
        setNotFound(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ClaimNotFoundError) {
          setClaim(null);
          setNotFound(true);
          return;
        }
        setError(toAppError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // claimId is a bigint; stringify so the effect key is stable.
  }, [claimId ? claimId.toString() : null, nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { claim, notFound, loading, error, reload };
}
