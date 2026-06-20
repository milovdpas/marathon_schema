import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  createFile,
  downloadFile,
  DriveAuthError,
  fetchUserInfo,
  findFile,
  isSyncConfigured,
  requestToken,
  revokeToken,
  updateFile,
  type SyncUser,
} from "@/lib/google-drive";
import { useTrainingStore } from "@/store/use-training-store";

export type SyncStatus =
  | "idle"
  | "connecting"
  | "syncing"
  | "connected"
  | "disconnected"
  | "error";

interface SyncState {
  status: SyncStatus;
  connected: boolean;
  user: SyncUser | null;
  fileId: string | null;
  lastSyncedAt: string | null;
  error: string | null;

  init: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => void;
  syncNow: () => Promise<void>;
}

const nowISO = () => new Date().toISOString();
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

// --- module-scoped sync machinery (kept out of persisted state) ---
let suppressAutoPush = false;
let autoPushTimer: ReturnType<typeof setTimeout> | null = null;
let subscribed = false;

/** Stamp the training store's lastModified without triggering an auto-push. */
function stampLocal(time: string) {
  suppressAutoPush = true;
  useTrainingStore.setState({ lastModified: time });
  suppressAutoPush = false;
}

/** Run a Drive operation, retrying once after a silent token refresh on 401. */
async function runDrive(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (e) {
    if (e instanceof DriveAuthError) {
      await requestToken("");
      await fn();
    } else {
      throw e;
    }
  }
}

/** Bidirectional newest-wins reconcile (used on connect and "Sync now"). */
async function reconcile(): Promise<void> {
  await runDrive(async () => {
    const training = useTrainingStore.getState();
    const localTime = training.lastModified || "";
    const meta = await findFile();

    if (!meta) {
      if (training.plan) {
        const created = await createFile(training.exportData());
        stampLocal(created.modifiedTime);
        useSyncStore.setState({ fileId: created.id });
      }
    } else if (meta.modifiedTime > localTime) {
      const json = await downloadFile(meta.id);
      suppressAutoPush = true;
      useTrainingStore.getState().applyRemote(json, meta.modifiedTime);
      suppressAutoPush = false;
      useSyncStore.setState({ fileId: meta.id });
    } else if (localTime > meta.modifiedTime) {
      const updated = await updateFile(meta.id, training.exportData());
      stampLocal(updated.modifiedTime);
      useSyncStore.setState({ fileId: meta.id });
    } else {
      useSyncStore.setState({ fileId: meta.id });
    }

    useSyncStore.setState({ lastSyncedAt: nowISO() });
  });
}

/** Upload the current local state (used by the debounced auto-push). */
async function pushLocal(): Promise<void> {
  const sync = useSyncStore.getState();
  const training = useTrainingStore.getState();
  if (!sync.connected || !training.plan) return;
  useSyncStore.setState({ status: "syncing", error: null });
  try {
    await runDrive(async () => {
      let id = useSyncStore.getState().fileId;
      if (!id) id = (await findFile())?.id ?? null;
      const json = training.exportData();
      const meta = id ? await updateFile(id, json) : await createFile(json);
      stampLocal(meta.modifiedTime);
      useSyncStore.setState({
        fileId: meta.id,
        lastSyncedAt: nowISO(),
        status: "connected",
      });
    });
  } catch (e) {
    useSyncStore.setState({ status: "error", error: msg(e) });
  }
}

/** Subscribe (once) to local mutations to drive the debounced auto-push. */
function ensureSubscription() {
  if (subscribed) return;
  subscribed = true;
  useTrainingStore.subscribe((state, prev) => {
    if (suppressAutoPush) return;
    if (state.lastModified === prev.lastModified) return;
    if (!useSyncStore.getState().connected) return;
    if (autoPushTimer) clearTimeout(autoPushTimer);
    autoPushTimer = setTimeout(() => {
      void pushLocal();
    }, 3000);
  });
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      status: "idle",
      connected: false,
      user: null,
      fileId: null,
      lastSyncedAt: null,
      error: null,

      init: async () => {
        if (!isSyncConfigured()) return;
        ensureSubscription();
        if (!get().connected) return;
        // Previously connected: attempt a silent reconnect.
        set({ status: "connecting", error: null });
        try {
          const user = await fetchUserInfo();
          set({ connected: true, user, status: "connected" });
          await reconcile();
        } catch {
          set({
            connected: false,
            status: "disconnected",
            error: "Session expired — reconnect to resume syncing.",
          });
        }
      },

      connect: async () => {
        if (!isSyncConfigured()) return;
        ensureSubscription();
        set({ status: "connecting", error: null });
        try {
          await requestToken("consent");
          const user = await fetchUserInfo();
          set({ connected: true, user });
          await reconcile();
          set({ status: "connected" });
        } catch (e) {
          set({ status: "error", error: msg(e), connected: false });
        }
      },

      disconnect: () => {
        revokeToken();
        if (autoPushTimer) clearTimeout(autoPushTimer);
        set({
          connected: false,
          user: null,
          fileId: null,
          lastSyncedAt: null,
          status: "disconnected",
          error: null,
        });
      },

      syncNow: async () => {
        if (!get().connected) return;
        set({ status: "syncing", error: null });
        try {
          await reconcile();
          set({ status: "connected" });
        } catch (e) {
          set({ status: "error", error: msg(e) });
        }
      },
    }),
    {
      name: "marathon-sync-v1",
      storage: createJSONStorage(() => localStorage),
      // Never persist tokens; only the connected flag + cached profile for UI.
      partialize: (state) => ({ connected: state.connected, user: state.user }),
    },
  ),
);
