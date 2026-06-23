import "server-only";
import { NextResponse } from "next/server";

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
