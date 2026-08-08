import { NextResponse, type NextRequest } from "next/server";
import { APP_COOKIE } from "@/lib/app-cookie";
import { APP_PATH } from "@/lib/site";

/**
 * Send returning users from the landing page straight into the app, before a
 * single byte of marketing copy is painted.
 *
 * (This is the file convention formerly called `middleware`. Next renamed it to
 * `proxy` to signal that it is a network boundary in front of the app, and to
 * discourage reaching for it — which is fair: a redirect decided from a cookie,
 * before the page is built, is one of the few things it is genuinely for.)
 *
 * `components/marketing/returning-user-redirect.tsx` does the same thing from
 * the client, but it can only run once Zustand has rehydrated, so the landing
 * page flashes first. This runs before the response is built.
 *
 * It stays a fallback rather than a replacement: the client redirect also
 * covers an installed PWA (which this can't detect) and anyone whose cookie was
 * cleared while their `localStorage` survived.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.get(APP_COOKIE)?.value === "1") {
    return NextResponse.redirect(new URL(APP_PATH, request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Only `/`. A broader matcher would put this in front of every static page
  // for no benefit; as it stands `/` is still prerendered and served from the
  // cache whenever the cookie is absent.
  matcher: "/",
};
