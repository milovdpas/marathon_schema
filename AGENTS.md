<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Marathon Tracker — agent orientation

**Read [`docs/architecture.md`](docs/architecture.md) before changing anything.** It is the authoritative guide (data model, state, flows, conventions, how to build/verify). Planned/deferred features (e.g. Google Calendar in the off-days flow, in-app AI coach) are in [`docs/roadmap.md`](docs/roadmap.md). `README.md` is user-facing and may lag.

Quick orientation:

- **Client-only Next.js (App Router) SPA. No backend / DB / auth.** Data lives in `localStorage` (Zustand `persist`); optional client-side Google Drive sync. Deploys static to Vercel. Mobile-first, dark mode, English + Dutch.
- **Single source of truth:** `store/use-training-store.ts` — a `plans` map + `activePlanId`. Read the active plan via `useActivePlan()` (there is no `s.plan`). Domain types: `lib/types.ts`.
- **Top gotchas that will bite you:**
  - shadcn here is **Base UI (`@base-ui/react`), not Radix** → compose with the **`render` prop**, not `asChild`.
  - **Tailwind v4** (CSS `@theme`, no config file); dynamic class names aren't generated — use static class maps.
  - i18n: every UI string is a key in **both** `lib/i18n/locales/en.ts` and `nl.ts` (the `Dict` type enforces parity). Use `useTranslation()`.
  - Persisted-shape changes require **bumping the persist `version` + an additive `migrate`** in `use-training-store.ts` (currently v4).
  - Pages are thin server components rendering a `"use client"` view inside `<HydrationGate>`.
- **Verify:** keep `npm run build` and `npm run lint` green. Browser smoke via `playwright-core` + system Chrome (`channel: "chrome"`); see `docs/architecture.md` → "Build & verify".
