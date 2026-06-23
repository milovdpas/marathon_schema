import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  createFile,
  downloadFile,
  DriveAuthError,
  fetchUserInfo,
  findFile,
  getTokenExpiry,
  hasValidToken,
  isSyncConfigured,
  prepareSync,
  requestToken,
  revokeToken,
  silentRefresh,
  updateFile,
  type SyncUser,
} from "@/lib/google-drive";
import { useTrainingStore } from "@/store/use-training-store";

export type SyncStatus =
  | "idle"
  | "connecting"
  | "reconnecting"
  | "syncing"
  | "connected"
  | "disconnected"
  | "error";

interface SyncState {
  status: SyncStatus;
  /** Persisted intent: the user has linked a Google account. */
  connected: boolean;
  /** We hold the intent but couldn't silently refresh — a one-tap reconnect is needed. */
  needsReauth: boolean;
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
const REAUTH_MSG = "Couldn't refresh your Google session automatically — tap Reconnect.";

// --- module-scoped sync machinery (kept out of persisted state) ---
let suppressAutoPush = false;
let autoPushTimer: ReturnType<typeof setTimeout> | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let listenersBound = false;
// True while a connect()/resume() auth handshake is running. Guards against a
// second handshake firing concurrently — e.g. the visibilitychange that fires
// when the OAuth popup closes racing the connect() that opened it.
let authInFlight = false;

/** Stamp the training store's lastModified without triggering an auto-push. */
function stampLocal(time: string) {
  suppressAutoPush = true;
  useTrainingStore.setState({ lastModified: time });
  suppressAutoPush = false;
}

/**
 * Run a Drive operation. On a 401, attempt one silent token refresh and retry;
 * if the silent refresh fails, surface it as a re-auth need.
 */
async function runDrive(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (e) {
    if (e instanceof DriveAuthError) {
      if (await silentRefresh()) {
        await fn();
        return;
      }
      throw new DriveAuthError();
    }
    throw e;
  }
}

/** Keep the access token alive while the app is open by refreshing ~2 min early. */
function scheduleProactiveRefresh() {
  if (refreshTimer) clearTimeout(refreshTimer);
  const expiry = getTokenExpiry();
  if (!expiry) return;
  const delay = Math.max(0, expiry - Date.now() - 120_000);
  refreshTimer = setTimeout(async () => {
    if (!useSyncStore.getState().connected || authInFlight) return;
    authInFlight = true;
    try {
      if (await silentRefresh()) {
        scheduleProactiveRefresh();
      } else {
        useSyncStore.setState({ needsReauth: true, status: "error", error: REAUTH_MSG });
      }
    } finally {
      authInFlight = false;
    }
  }, delay);
}

/** Bidirectional newest-wins reconcile (used on connect and "Sync now"). */
async function reconcile(): Promise<void> {
  await runDrive(async () => {
    const training = useTrainingStore.getState();
    const localTime = training.lastModified || "";
    const meta = await findFile();

    if (!meta) {
      if (training.activePlanId) {
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
  if (!sync.connected || !training.activePlanId) return;
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
        needsReauth: false,
      });
    });
  } catch (e) {
    if (e instanceof DriveAuthError) {
      useSyncStore.setState({ status: "error", needsReauth: true, error: REAUTH_MSG });
    } else {
      useSyncStore.setState({ status: "error", error: msg(e) });
    }
  }
}

/**
 * Try to silently restore a working session (used on load and whenever the tab
 * becomes visible again). Falls back to a re-auth prompt if Google needs UI.
 */
async function resume(): Promise<void> {
  const { connected } = useSyncStore.getState();
  if (!connected || authInFlight) return;
  if (hasValidToken() && useSyncStore.getState().status === "connected") return;

  authInFlight = true;
  useSyncStore.setState({ status: "reconnecting", error: null });
  try {
    if (!(await silentRefresh())) {
      useSyncStore.setState({ status: "error", needsReauth: true, error: REAUTH_MSG });
      return;
    }
    const user = await fetchUserInfo();
    useSyncStore.setState({ user, needsReauth: false, status: "connected", error: null });
    scheduleProactiveRefresh();
    await reconcile();
  } catch {
    useSyncStore.setState({ status: "error", needsReauth: true, error: REAUTH_MSG });
  } finally {
    authInFlight = false;
  }
}

/** Wire up auto-push (on local edits) and silent re-auth on tab refocus — once. */
function bindListeners() {
  if (listenersBound) return;
  listenersBound = true;

  useTrainingStore.subscribe((state, prev) => {
    if (suppressAutoPush) return;
    if (state.lastModified === prev.lastModified) return;
    if (!useSyncStore.getState().connected) return;
    if (autoPushTimer) clearTimeout(autoPushTimer);
    autoPushTimer = setTimeout(() => void pushLocal(), 3000);
  });

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState !== "visible") return;
      // Don't race an in-progress handshake — e.g. this event also fires when
      // the OAuth popup that connect() opened closes and returns focus.
      if (authInFlight) return;
      const s = useSyncStore.getState();
      if (s.connected && !hasValidToken()) void resume();
    });
  }
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      status: "idle",
      connected: false,
      needsReauth: false,
      user: null,
      fileId: null,
      lastSyncedAt: null,
      error: null,

      init: async () => {
        if (!isSyncConfigured()) return;
        bindListeners();
        // Preload GIS so the Connect button's popup opens within the click gesture.
        void prepareSync();
        if (!get().connected) return;
        await resume();
      },

      connect: async () => {
        if (!isSyncConfigured()) return;
        bindListeners();
        authInFlight = true;
        set({ status: "connecting", error: null });
        try {
          // Open the account chooser directly (no await before it, so the click
          // gesture isn't consumed and the popup isn't blocked).
          await requestToken("consent");
          const user = await fetchUserInfo();
          set({ connected: true, needsReauth: false, user });
          scheduleProactiveRefresh();
          await reconcile();
          set({ status: "connected" });
        } catch (e) {
          set({ status: "error", error: msg(e) });
        } finally {
          authInFlight = false;
        }
      },

      disconnect: () => {
        revokeToken();
        if (autoPushTimer) clearTimeout(autoPushTimer);
        if (refreshTimer) clearTimeout(refreshTimer);
        set({
          connected: false,
          needsReauth: false,
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
          set({ status: "connected", needsReauth: false });
        } catch (e) {
          if (e instanceof DriveAuthError) {
            set({ status: "error", needsReauth: true, error: REAUTH_MSG });
          } else {
            set({ status: "error", error: msg(e) });
          }
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
