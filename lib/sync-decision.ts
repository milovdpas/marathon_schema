// Which copy of the training wins when local and Drive disagree.
//
// Split out from the sync store because this is the only place data can be
// destroyed: pick wrong and either the user's phone overwrites their laptop or
// the other way round. Keeping it pure means it can be exhaustively tested
// without a network.

/** What Drive reports about the stored file. */
export interface RemoteMeta {
  id: string;
  /** RFC 3339 UTC, e.g. "2026-08-08T10:11:12.000Z". */
  modifiedTime: string;
}

export type SyncPlan =
  /** No remote file yet and we have something worth uploading. */
  | { action: "create" }
  /** No remote file and nothing local worth creating one for. */
  | { action: "skip" }
  /** Drive is ahead — replace local. */
  | { action: "pull"; fileId: string }
  /** Local is ahead — replace Drive. */
  | { action: "push"; fileId: string }
  /** Same timestamp, or local is ahead but empty: just remember the file id. */
  | { action: "adopt"; fileId: string };

/**
 * Newest wins, comparing RFC 3339 strings directly — they're fixed-width UTC,
 * so lexicographic order is chronological order and no parsing is needed.
 *
 * An absent local timestamp becomes "", which sorts before every real one, so
 * a fresh install always pulls rather than clobbering Drive.
 */
export function decideSync(input: {
  /** `lastModified` from the training store; "" / null on a fresh install. */
  localModified: string | null | undefined;
  /** Whether there is actually a plan to upload. */
  hasPlan: boolean;
  remote: RemoteMeta | null;
}): SyncPlan {
  const local = input.localModified || "";

  if (!input.remote) {
    return input.hasPlan ? { action: "create" } : { action: "skip" };
  }

  const { id, modifiedTime } = input.remote;
  if (modifiedTime > local) return { action: "pull", fileId: id };

  if (local > modifiedTime) {
    // Never upload an empty export over a real file. `exportData()` returns ""
    // when there are no plans, and deleting the last plan stamps a fresh
    // `lastModified` before the replacement example plan finishes loading —
    // a reconcile in that window would otherwise wipe Drive.
    return input.hasPlan
      ? { action: "push", fileId: id }
      : { action: "adopt", fileId: id };
  }

  return { action: "adopt", fileId: id };
}
