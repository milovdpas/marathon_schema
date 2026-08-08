import { cookies } from "next/headers";
import { redirectTo, safeReturnTo } from "@/lib/server/api";
import {
  exchangeCode,
  fetchUserInfo,
  isOauthConfigured,
} from "@/lib/server/google-oauth";
import { getSession } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  // Relative, and pointing at the real settings path: `request.url`'s origin is
  // the container's bind address behind a proxy, and /settings has been
  // /app/settings since the routing move.
  const settingsError = redirectTo("/app/settings?sync=error");

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
    // Re-validated even though the login route already did: the cookie is
    // ours, but this is the hop that actually performs the redirect.
    returnTo = safeReturnTo(parsed.returnTo, url.origin);
    if (parsed.state !== stateParam) return settingsError;

    const tokens = await exchangeCode(code);
    const session = await getSession();
    if (tokens.refresh_token) session.refreshToken = tokens.refresh_token;

    // No refresh token returned and none stored — re-run consent to obtain one.
    if (!session.refreshToken) {
      return redirectTo(
        `/api/auth/google/login?returnTo=${encodeURIComponent(returnTo)}`,
      );
    }

    session.accessToken = tokens.access_token;
    session.accessTokenExpiry = Date.now() + (tokens.expires_in ?? 3600) * 1000;
    session.user = await fetchUserInfo(tokens.access_token!);
    await session.save();

    return redirectTo(returnTo);
  } catch (e) {
    console.error("OAuth callback failed:", e);
    return settingsError;
  }
}
