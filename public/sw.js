/*
 * Service worker. Two jobs:
 *
 *  1. Chrome will not install a web app on Android (a WebAPK, as opposed to a
 *     home-screen bookmark) unless a service worker with a fetch handler is
 *     registered. This is the fetch handler.
 *  2. Genuine offline use — the app is localStorage-only, so once the shell is
 *     cached you can log a run with no signal.
 *
 * Deliberately conservative. A cache-first service worker that swallows HTML
 * will happily serve a stale app forever, and there is no way to push a fix to
 * someone whose browser refuses to ask for one. So:
 *
 *  - navigations: network first, cache only as a fallback  -> a deploy is live
 *    immediately, and offline still works
 *  - /_next/static/*: cache first                          -> content-hashed,
 *    so a given URL's bytes never change
 *  - everything else (API routes, cross-origin): untouched -> never cache
 *    anything auth- or user-specific
 */

const VERSION = "v1";
const SHELL = `shell-${VERSION}`;
const ASSETS = `assets-${VERSION}`;
const OFFLINE_FALLBACK = "/";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL);
      // Best effort: a failed pre-cache must not block activation.
      await cache.add(OFFLINE_FALLBACK).catch(() => {});
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== SHELL && k !== ASSETS)
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Route handlers do auth and hit Google — never serve those from a cache.
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(SHELL);
          cache.put(OFFLINE_FALLBACK, fresh.clone());
          return fresh;
        } catch {
          return (
            (await caches.match(request)) ??
            (await caches.match(OFFLINE_FALLBACK)) ??
            Response.error()
          );
        }
      })(),
    );
    return;
  }

  // Build output is content-hashed, so a hit is always correct.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      (async () => {
        const hit = await caches.match(request);
        if (hit) return hit;
        const fresh = await fetch(request);
        if (fresh.ok) {
          const cache = await caches.open(ASSETS);
          cache.put(request, fresh.clone());
        }
        return fresh;
      })(),
    );
  }
});
