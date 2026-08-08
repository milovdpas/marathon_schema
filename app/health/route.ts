/**
 * Liveness probe for the container healthcheck and the nginx upstream.
 *
 * Deliberately trivial: it answers "this Node process is serving requests",
 * nothing more. There is no database or upstream to check — the app is
 * localStorage-first, and Drive/weather are optional and user-triggered, so
 * probing them here would take the container down for an outage that doesn't
 * affect the app's core function.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return new Response("ok", {
    status: 200,
    headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" },
  });
}
