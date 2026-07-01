import { NextResponse } from "next/server";
import { getDaily, isWeatherConfigured } from "@/lib/server/weather";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isWeatherConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const params = new URL(request.url).searchParams;
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));
  const startRaw = params.get("start");
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "bad_coords" }, { status: 400 });
  }
  try {
    const { days, tzOffset } = await getDaily(
      lat,
      lon,
      startRaw ? Number(startRaw) : undefined,
    );
    return NextResponse.json(
      { days, tzOffset },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    console.error("Weather daily failed:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
