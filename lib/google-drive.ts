// Client-side Google Drive sync. No backend, no client secret: we use Google
// Identity Services (GIS) for an OAuth access token and call the Drive REST API
// directly with fetch. Data lives in the hidden appDataFolder.

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const SCOPES =
  "openid email profile https://www.googleapis.com/auth/drive.appdata";
const FILE_NAME = "marathon-tracker.json";
const GIS_SRC = "https://accounts.google.com/gsi/client";

export interface SyncUser {
  email: string;
  name: string;
  picture: string;
}

export interface DriveFileMeta {
  id: string;
  modifiedTime: string; // RFC 3339, Drive's server clock
}

/** Thrown on a 401 so callers can refresh the token and retry once. */
export class DriveAuthError extends Error {
  constructor() {
    super("UNAUTHORIZED");
    this.name = "DriveAuthError";
  }
}

export function isSyncConfigured(): boolean {
  return CLIENT_ID.length > 0;
}

// ---- GIS loading + token client ------------------------------------------

let gisPromise: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisPromise) return gisPromise;

  gisPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GIS_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("GIS failed to load")));
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("GIS failed to load"));
    document.head.appendChild(script);
  });
  return gisPromise;
}

let tokenClient: TokenClient | null = null;
let accessToken: string | null = null;
let tokenExpiry = 0; // epoch ms
let pending: {
  resolve: (token: string) => void;
  reject: (err: Error) => void;
} | null = null;

async function ensureTokenClient(): Promise<TokenClient> {
  await loadGis();
  const oauth2 = window.google!.accounts.oauth2;
  if (tokenClient) return tokenClient;
  tokenClient = oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (response) => {
      if (response.error || !response.access_token) {
        pending?.reject(new Error(response.error_description || response.error || "Token request failed"));
        pending = null;
        return;
      }
      accessToken = response.access_token;
      tokenExpiry = Date.now() + (response.expires_in ?? 3600) * 1000;
      pending?.resolve(accessToken);
      pending = null;
    },
    error_callback: (err) => {
      pending?.reject(new Error(err.message || err.type || "Token request failed"));
      pending = null;
    },
  });
  return tokenClient;
}

/**
 * Request an access token. `prompt: "consent"` shows the account chooser (used
 * on explicit connect); `prompt: ""` attempts a silent grant (reconnect/refresh).
 */
export async function requestToken(prompt: "" | "consent"): Promise<string> {
  const client = await ensureTokenClient();
  return new Promise<string>((resolve, reject) => {
    pending = { resolve, reject };
    client.requestAccessToken({ prompt });
  });
}

/** A valid cached token, or a silent refresh if expired/near-expiry. */
async function getValidToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiry - 60_000) return accessToken;
  return requestToken("");
}

export function revokeToken(): void {
  if (accessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(accessToken);
  }
  accessToken = null;
  tokenExpiry = 0;
}

// ---- Identity -------------------------------------------------------------

export async function fetchUserInfo(): Promise<SyncUser> {
  const token = await getValidToken();
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new DriveAuthError();
  if (!res.ok) throw new Error(`userinfo failed (${res.status})`);
  const data = await res.json();
  return {
    email: data.email ?? "",
    name: data.name ?? data.email ?? "Google account",
    picture: data.picture ?? "",
  };
}

// ---- Drive REST -----------------------------------------------------------

async function driveFetch(url: string, init: RequestInit): Promise<Response> {
  const token = await getValidToken();
  const res = await fetch(url, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new DriveAuthError();
  return res;
}

export async function findFile(): Promise<DriveFileMeta | null> {
  const q = encodeURIComponent(`name='${FILE_NAME}'`);
  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,modifiedTime)`,
    { method: "GET" },
  );
  if (!res.ok) throw new Error(`Drive list failed (${res.status})`);
  const data = await res.json();
  const file = data.files?.[0];
  return file ? { id: file.id, modifiedTime: file.modifiedTime } : null;
}

export async function downloadFile(id: string): Promise<string> {
  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files/${id}?alt=media`,
    { method: "GET" },
  );
  if (!res.ok) throw new Error(`Drive download failed (${res.status})`);
  return res.text();
}

export async function createFile(json: string): Promise<DriveFileMeta> {
  const boundary = "marathon_tracker_boundary";
  const metadata = { name: FILE_NAME, parents: ["appDataFolder"] };
  const body =
    `--${boundary}\r\n` +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) +
    `\r\n--${boundary}\r\n` +
    "Content-Type: application/json\r\n\r\n" +
    json +
    `\r\n--${boundary}--`;
  const res = await driveFetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,modifiedTime",
    {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    },
  );
  if (!res.ok) throw new Error(`Drive create failed (${res.status})`);
  return res.json();
}

export async function updateFile(
  id: string,
  json: string,
): Promise<DriveFileMeta> {
  const res = await driveFetch(
    `https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=media&fields=id,modifiedTime`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: json,
    },
  );
  if (!res.ok) throw new Error(`Drive update failed (${res.status})`);
  return res.json();
}
