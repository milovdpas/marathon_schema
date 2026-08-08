/**
 * A hint, readable on the server, that this browser already has training data.
 *
 * The store lives in `localStorage`, which middleware cannot see, so without
 * this the "you already use the app" redirect can only run after hydration and
 * the landing page flashes first. The cookie carries no data beyond its own
 * existence — it is a signal, not state, and `localStorage` remains the source
 * of truth.
 *
 * A crawler never has it, so `/` still serves the marketing page to Google.
 */
export const APP_COOKIE = "rp_has_plans";

/** A year. Refreshed on every app load, so an active user never loses it. */
export const APP_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
