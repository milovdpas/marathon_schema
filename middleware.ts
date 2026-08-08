import { NextResponse, type NextRequest } from "next/server";
import { APP_COOKIE } from "@/lib/app-cookie";
import { APP_PATH } from "@/lib/site";

/**
 * Send returning users from the landing page straight into the app, before a
 * single byte of marketing copy is painted.
 *
 * `components/marketing/returning-user-redirect.tsx` does the same thing from
 * the client, but it can only run once Zustand has rehydrated, so the landing
 * page flashes first. This runs before the response is built.
 *
 * It stays a fallback rather than a replacement: the client redirect also
 * covers an installed PWA (which middleware can't detect) and anyone whose
 * cookie was cleared while their `localStorage` survived.
 */
export function middleware(request: NextRequest) {
  if (request.cookies.get(APP_COOKIE)?.value === "1") {
    return NextResponse.redirect(new URL(APP_PATH, request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Only `/`. A broader matcher would put middleware in front of every static
  // page for no benefit; with this, `/` itself is still prerendered and served
  // from the cache whenever the cookie is absent.
  matcher: "/",
};
