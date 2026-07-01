import { NextResponse } from "next/server";
import { getHourly, isWeatherConfigured } from "@/lib/server/weather";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isWeatherConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const params = new URL(request.url).searchParams;
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));
  const dt = Number(params.get("dt"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(dt)) {
    return NextResponse.json({ error: "bad_params" }, { status: 400 });
  }
  try {
    const { snapshot, tzOffset } = await getHourly(lat, lon, dt);
    return NextResponse.json(
      { snapshot, tzOffset },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    console.error("Weather hourly failed:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
