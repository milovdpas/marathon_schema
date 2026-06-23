import { NextResponse } from "next/server";
import { isOauthConfigured } from "@/lib/server/google-oauth";
import { getSession } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isOauthConfigured()) {
    return NextResponse.json({ configured: false, connected: false, user: null });
  }
  const session = await getSession();
  return NextResponse.json(
    {
      configured: true,
      connected: !!session.refreshToken,
      user: session.user ?? null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
