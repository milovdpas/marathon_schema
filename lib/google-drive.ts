// Client sync layer. Authentication + Drive access now live in the Next.js
// backend (server-side OAuth with refresh tokens); this module just calls the
// same-origin /api routes. No Google SDK, no tokens in the browser.

import type { DriveFileMeta, SyncUser } from "@/lib/drive-types";

export type { DriveFileMeta, SyncUser };

/** Thrown when an /api/drive call returns 401 (session/refresh gone). */
export class DriveAuthError extends Error {
  constructor() {
    super("UNAUTHORIZED");
    this.name = "DriveAuthError";
  }
}

// Serialize Drive calls so an auto-push can't overlap a reconcile and race the
// server-side token refresh / session-cookie write.
let chain: Promise<unknown> = Promise.resolve();
function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function api(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(path, { ...init, cache: "no-store" });
  if (res.status === 401) throw new DriveAuthError();
  return res;
}

export async function findFile(): Promise<DriveFileMeta | null> {
  return serialize(async () => {
    const res = await api("/api/drive/meta");
    if (!res.ok) throw new Error(`Drive meta failed (${res.status})`);
    const data = await res.json();
    return data && data.id ? (data as DriveFileMeta) : null;
  });
}

export async function downloadFile(id: string): Promise<string> {
  return serialize(async () => {
    const res = await api(`/api/drive/content?id=${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`Drive download failed (${res.status})`);
    return res.text();
  });
}

export async function createFile(json: string): Promise<DriveFileMeta> {
  return serialize(async () => {
    const res = await api("/api/drive/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json,
    });
    if (!res.ok) throw new Error(`Drive create failed (${res.status})`);
    return res.json();
  });
}

export async function updateFile(
  id: string,
  json: string,
): Promise<DriveFileMeta> {
  return serialize(async () => {
    const res = await api(`/api/drive/content?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: json,
    });
    if (!res.ok) throw new Error(`Drive update failed (${res.status})`);
    return res.json();
  });
}

// ---- Auth / session -------------------------------------------------------

export interface SessionInfo {
  configured: boolean;
  connected: boolean;
  user: SyncUser | null;
}

export async function fetchSession(): Promise<SessionInfo> {
  try {
    const res = await fetch("/api/auth/session", { cache: "no-store" });
    if (!res.ok) return { configured: false, connected: false, user: null };
    return res.json();
  } catch {
    return { configured: false, connected: false, user: null };
  }
}

/** Full-page redirect target that starts the Google consent flow. */
export function loginUrl(returnTo: string): string {
  return `/api/auth/google/login?returnTo=${encodeURIComponent(returnTo)}`;
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}
