/**
 * Ids for plans, workouts and off days. `crypto.randomUUID` needs a secure
 * context, so the fallback keeps things working on plain http (a LAN dev
 * server, say) where it's absent.
 */
export function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `plan-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
}
