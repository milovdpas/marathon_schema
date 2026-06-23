import "server-only";
import { getIronSession, type IronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import type { SyncUser } from "@/lib/drive-types";

/** What we keep in the encrypted session cookie. No id_token (keeps it small). */
export interface SessionData {
  refreshToken?: string;
  accessToken?: string;
  accessTokenExpiry?: number; // epoch ms
  user?: SyncUser;
}

export const sessionOptions: SessionOptions = {
  // iron-session requires a >=32 char password; routes guard on isOauthConfigured()
  // before touching the session, so an empty value here is never used in practice.
  password: process.env.SESSION_SECRET ?? "",
  cookieName: "marathon-session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
