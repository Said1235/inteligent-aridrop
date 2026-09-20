/**
 * A local index of claim IDs this browser has generated or opened.
 *
 * This is a bookmark list, nothing more. The contract has no enumeration
 * method, so there is no way to list "all claims" on chain. Every entry stores
 * the exact `claim_id` that was generated client-side, and every read performed
 * from this list uses that exact id.
 *
 * `savedAt` exists only to order the bookmarks for display. It is never used to
 * decide which claim is which — see src/lib/claimId.ts.
 */
import { parseClaimId } from "./claimId";

const KEY = "intelligent-airdrop:claims:v1";
const DRAFT_PREFIX = "intelligent-airdrop:draft:v1:";
const MAX_ENTRIES = 200;

export type ClaimBookmark = {
  /** Decimal u256, exactly as generated. */
  id: string;
  savedAt: number;
  /** Cached only so the history list can render before the reads land. */
  lastKnownStatus?: string;
  submittedBy?: string;
};

/** A submission that has been assigned an id but not yet confirmed on chain. */
export type ClaimDraft = {
  id: string;
  evidenceText: string;
  createdAt: number;
  account?: string;
};

const canUseStorage = () => typeof window !== "undefined" && !!window.localStorage;

function readAll(): ClaimBookmark[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e): e is ClaimBookmark => !!e && typeof (e as ClaimBookmark).id === "string")
      .filter((e) => parseClaimId(e.id) !== null);
  } catch {
    return [];
  }
}

function writeAll(entries: ClaimBookmark[]) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    /* quota or private mode — the URL remains the source of truth */
  }
}

export function listBookmarks(): ClaimBookmark[] {
  return readAll().sort((a, b) => b.savedAt - a.savedAt);
}

export function rememberClaim(entry: {
  id: string;
  submittedBy?: string;
  lastKnownStatus?: string;
}) {
  if (parseClaimId(entry.id) === null) return;
  const existing = readAll();
  const previous = existing.find((e) => e.id === entry.id);
  const next: ClaimBookmark = {
    id: entry.id,
    savedAt: previous?.savedAt ?? Date.now(),
    submittedBy: entry.submittedBy ?? previous?.submittedBy,
    lastKnownStatus: entry.lastKnownStatus ?? previous?.lastKnownStatus,
  };
  writeAll([next, ...existing.filter((e) => e.id !== entry.id)]);
}

export function forgetClaim(id: string) {
  writeAll(readAll().filter((e) => e.id !== id));
}

export function saveDraft(draft: ClaimDraft) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(DRAFT_PREFIX + draft.id, JSON.stringify(draft));
  } catch {
    /* ignore */
  }
}

/** Read the draft for one exact id. There is no "get the latest draft". */
export function readDraft(id: string): ClaimDraft | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_PREFIX + id);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ClaimDraft;
    return parsed && parsed.id === id ? parsed : null;
  } catch {
    return null;
  }
}

export function clearDraft(id: string) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(DRAFT_PREFIX + id);
  } catch {
    /* ignore */
  }
}
