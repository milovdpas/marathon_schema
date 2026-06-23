import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  exchangeCode,
  fetchUserInfo,
  isOauthConfigured,
} from "@/lib/server/google-oauth";
import { getSession } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safePath(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const settingsError = NextResponse.redirect(
    new URL("/settings?sync=error", url.origin),
  );

  if (!isOauthConfigured()) return settingsError;

  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");

  const jar = await cookies();
  const stateCookie = jar.get("oauth_state")?.value;
  jar.delete("oauth_state");

  if (!code || !stateParam || !stateCookie) return settingsError;

  let returnTo = "/";
  try {
    const parsed = JSON.parse(stateCookie) as { state: string; returnTo: string };
    returnTo = safePath(parsed.returnTo);
    if (parsed.state !== stateParam) return settingsError;

    const tokens = await exchangeCode(code);
    const session = await getSession();
    if (tokens.refresh_token) session.refreshToken = tokens.refresh_token;

    // No refresh token returned and none stored — re-run consent to obtain one.
    if (!session.refreshToken) {
      return NextResponse.redirect(
        new URL(
          `/api/auth/google/login?returnTo=${encodeURIComponent(returnTo)}`,
          url.origin,
        ),
      );
    }

    session.accessToken = tokens.access_token;
    session.accessTokenExpiry = Date.now() + (tokens.expires_in ?? 3600) * 1000;
    session.user = await fetchUserInfo(tokens.access_token!);
    await session.save();

    return NextResponse.redirect(new URL(returnTo, url.origin));
  } catch (e) {
    console.error("OAuth callback failed:", e);
    return settingsError;
  }
}
