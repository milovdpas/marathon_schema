import "server-only";
import { NextResponse } from "next/server";

/**
 * Reduce a caller-supplied `returnTo` to a same-origin path, or "/".
 *
 * Resolve-then-verify rather than string sniffing, because it has to agree
 * with the parser the redirect itself will use. A prefix check does not:
 * `/\evil.com` starts with "/" and not "//", yet `new URL()` reads the
 * backslash as a slash and resolves it to `https://evil.com/` — an open
 * redirect handed a user who has just completed a real Google login.
 */
export function safeReturnTo(
  value: string | null | undefined,
  origin: string,
): string {
  if (!value) return "/";
  try {
    const url = new URL(value, origin);
    if (url.origin !== origin) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

/**
 * Map a Drive/OAuth error to an HTTP response. Auth failures (refresh expired or
 * Drive 401) become 401 so the client shows "Reconnect"; everything else 500.
 */
export function driveErrorResponse(e: unknown): NextResponse {
  const name = e instanceof Error ? e.name : "";
  if (name === "RefreshError" || name === "DriveUnauthorizedError") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  console.error("Drive request failed:", e);
  return NextResponse.json({ error: "server_error" }, { status: 500 });
}
