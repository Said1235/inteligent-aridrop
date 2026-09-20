"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchRequirements } from "@/lib/reads";
import { toAppError, type AppError } from "@/lib/errors";

export type RequirementsState = {
  requirements: string[] | null;
  /** True once we know the organizer has not published anything yet. */
  unconfigured: boolean;
  loading: boolean;
  error: AppError | null;
  reload: () => void;
};

export function useRequirements(): RequirementsState {
  const [requirements, setRequirements] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchRequirements()
      .then((list) => {
        if (cancelled) return;
        setRequirements(list);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(toAppError(err));
        setRequirements(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return {
    requirements,
    unconfigured: requirements !== null && requirements.length === 0,
    loading,
    error,
    reload,
  };
}
