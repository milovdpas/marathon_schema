import { NextResponse } from "next/server";
import { isOauthConfigured, revoke } from "@/lib/server/google-oauth";
import { getSession } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  if (isOauthConfigured()) {
    const session = await getSession();
    if (session.refreshToken) await revoke(session.refreshToken);
    session.destroy();
  }
  return NextResponse.json({ ok: true });
}
