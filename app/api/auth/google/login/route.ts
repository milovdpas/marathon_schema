import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { buildAuthUrl, isOauthConfigured } from "@/lib/server/google-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Only allow same-origin relative paths as returnTo (no open redirects). */
function safeReturnTo(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export async function GET(request: Request) {
  if (!isOauthConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const url = new URL(request.url);
  const returnTo = safeReturnTo(url.searchParams.get("returnTo"));
  const state = randomUUID();

  const jar = await cookies();
  jar.set("oauth_state", JSON.stringify({ state, returnTo }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes to complete the flow
  });

  return NextResponse.redirect(buildAuthUrl(state));
}
