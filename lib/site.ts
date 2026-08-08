// Site-level identity, in one place. Read by the root metadata, the sitemap,
// robots.txt and the OG image — all of which must agree on the origin, or
// canonical URLs and social previews point at the wrong host.

export const SITE_NAME = "RacePilot";
export const SITE_TAGLINE = "Plan your race, track your training";

/** The path the app itself lives under. `/` is the marketing page. */
export const APP_PATH = "/app";

/**
 * The canonical origin, with no trailing slash.
 *
 * `VERCEL_URL` is a per-deployment hostname, so it is the *fallback*, not the
 * answer: using it for canonicals would point every preview at itself and
 * production at whichever deployment happened to build the page.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined) ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
  "http://localhost:3000"
).replace(/\/$/, "");

/** True only on the production deployment — preview builds must not be indexed. */
export const IS_PRODUCTION_DEPLOY =
  process.env.VERCEL_ENV === undefined || process.env.VERCEL_ENV === "production";
