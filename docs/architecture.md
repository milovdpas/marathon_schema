# Architecture & developer guide

This is the authoritative guide for working on this codebase. Read it before
making changes. (`README.md` is user-facing and may lag behind features.)

## What this app is

A **marathon / running training tracker**. Almost entirely a **client-side SPA on
Next.js (App Router)** — **no database**. All data lives in the browser's
`localStorage`. The **only** server code is a thin set of Route Handlers under
`app/api/*` that implement **server-side Google OAuth** for the optional Drive
sync (refresh token in an encrypted session cookie; no DB). Deploys to Vercel
(Route Handlers run as Functions). Mobile-first, dark mode, English + Dutch.

## Tech stack & non-obvious gotchas

- **Next.js 16 + React 19**, App Router, no `src/` dir, import alias `@/*`.
- **Tailwind CSS v4** — CSS-based config in `app/globals.css` (`@theme`), no `tailwind.config`. Dynamic class names are NOT generated: workout-type colors use a **static class map** (`TYPE_STYLE` in `components/common/workout-type-badge.tsx`), never `bg-${type}`.
- **shadcn/ui on Base UI (`@base-ui/react`), NOT Radix.** Compose with the **`render` prop**, not `asChild`. e.g. `<DialogTrigger render={<Button/>}>…`. `Select.Value` shows the raw value unless given a function child for the label.
- **Zustand + `persist`** for state. **react-i18next** for i18n. **Recharts** for charts. **date-fns** for dates. **next-themes** for dark mode. **lucide-react** icons.
- Everything interactive is a client component (`"use client"`). Pages in `app/*` are thin server components that render a client `*View` inside `<HydrationGate>`.
- `Date.now()`/`Math.random()`/`new Date()` are fine here (browser runtime) — the no-`Date` restriction only applies to Workflow scripts, not app code.

## Data model — `lib/types.ts` (read this first)

- **`TrainingPlan`** = `PlanMeta` + `{ id, version, createdAt, weeks[], workouts{}, offDays[], trainingPrefs? }`.
- **`PlanMeta`** = `{ name, raceName, raceDistanceKm, raceDate, startDate?, goalPace, goalLabel }`.
- **`Workout`** = `{ id, date, type, title, weekNumber, plannedDistanceKm, plannedPace?, actualDistanceKm?, actualPace?, durationMin?, notes?, completed, isCustom?, flexible?, windowStart?, windowEnd? }`. A **flexible** workout may be done any day in `[windowStart, windowEnd]`; `date` is its current placement.
- **`TrainingWeek`** = `{ weekNumber, startDate(Mon), endDate(Sun), phase, label?, workoutIds[] }`.
- **`OffDay`** = `{ id, start, end, title, note? }` — vacations/trips; context + calendar display.
- **`TrainingPrefs`** = `{ daysPerWeek, flexibleDays, trainingDays[7 Mon→Sun], planningMode: "exact"|"flexible", targetDistanceKm|null }`.
- **`Preferences`** = `{ theme, locale?, onboardingSeen? }` (app-wide, not per-plan).

## State & persistence — `store/use-training-store.ts`

The single source of truth. Shape: `{ plans: Record<id,TrainingPlan>, activePlanId, preferences, hydrated, lastModified }`.

- **Active plan** is read via the `useActivePlan()` hook (`hooks/use-active-plan.ts`) — components select it, not `s.plan` (there is no `s.plan`).
- **Actions:** plan mgmt (`addPlan`, `addPlanFromImport`, `selectPlan`, `deletePlan`, `updatePlanMeta`, `updateTrainingPrefs`, `regenerateActivePlan`, `initializePlan`), off days (`add/update/deleteOffDay`), workouts (`toggleComplete`, `updateWorkout`, `addWorkout`, `deleteWorkout`), data (`exportData`, `importData`, `applyRemote`), and `setPreferences`. Mutations bump `lastModified` (used for sync conflict resolution).
- **persist**: key `marathon-training-v1`, **`version: 4`**, `partialize` persists `{plans, activePlanId, preferences, lastModified}`. The **`migrate`** fn is additive & idempotent — bump the version and backfill new fields without touching workouts (see how `offDays`, `raceDistanceKm`, `onboardingSeen` were added). `onRehydrateStorage` sets `hydrated` + calls `initializePlan`.
- **Hydration**: `<HydrationGate>` (`hooks/use-hydrated.ts`) renders a skeleton until rehydrated, avoiding SSR/client mismatch. `useMounted()` is used where a value differs server vs client.

## Plan generation — `lib/plan-generator.ts`

`generateDefaultPlan(opts)` builds the **seeded "Milo's Marathon" example** plan (Mon/Wed/Thu/Sun schedule, sub-3:30 paces, 30 km peak then taper). Honors `planStart`/`createdAt` (regenerate reproduces elapsed weeks), `seedRuns` (logged history), `offDays`, `trainingPrefs`. `DEFAULT_PLAN_ID = "milo-marathon"`; `SPECIAL_PERIODS` in `lib/date.ts` shape the seeded plan. This generator is for the **example/default plan only** — real user plans come from the AI wizard import.

## Key flows

- **Onboarding** (`components/common/onboarding-gate.tsx`): fresh install (`!onboardingSeen` & no plans) shows a Drive dialog (when `useSyncStore().configured` && not yet connected) then a "create plan?" popup. "Just look around" seeds the example; "Create my plan" → `/plan/new`. Migration marks existing users `onboardingSeen: true`. `initializePlan` only seeds once `onboardingSeen` is true.
- **AI Add-Plan wizard** (`app/plan/new`, `components/wizard/add-plan-wizard.tsx`): 4 steps collect a `PlanDraft` → step 4 exports a **plan-request JSON** + a localized **prompt** (`wizard.aiPrompt` in the dictionaries, which documents the importable plan schema). User pastes/attaches the AI's plan → `addPlanFromImport(json, trainingPrefs, startDate)` validates via `parseImport` and inserts it as a new active plan. The importable schema == what `parseImport` accepts.
- **Google Drive sync** — **server-side OAuth**:
  - **Server** (`lib/server/*` + `app/api/*`): `google-oauth.ts` (auth URL, code exchange, refresh, `getValidAccessToken`, revoke, userinfo), `session.ts` (iron-session encrypted cookie `marathon-session` holding `{refreshToken, accessToken, accessTokenExpiry, user}`), `drive.ts` (Drive REST against the hidden `appDataFolder`, token-parameterized). Routes: `auth/google/login` (redirect to consent w/ `access_type=offline&prompt=consent`, CSRF `state` cookie), `auth/google/callback` (exchange + save session), `auth/session` (`{configured, connected, user}` — no tokens), `auth/logout` (revoke + destroy), `drive/meta` (findFile), `drive/content` (GET download / POST create / PATCH update). All `runtime="nodejs"`, `dynamic="force-dynamic"`; a 401 (refresh failed / Drive 401) → client re-auth.
  - **Client** (`lib/google-drive.ts`, `store/use-sync-store.ts`): a thin same-origin fetch client (`findFile`/`downloadFile`/`createFile`/`updateFile` → `/api/drive/*`, serialized via a single-flight queue; `fetchSession`/`loginUrl`/`logout`). `connect()` is a **full-page redirect** to `/api/auth/google/login`. The store learns `configured`/`connected`/`user` from `/api/auth/session` on `init()`; conflict = newest-wins (`lastModified` vs Drive `modifiedTime`); 3s debounced auto-push + refresh-on-refocus unchanged.
  - Enabled only when `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`SESSION_SECRET` are set; otherwise the UI shows "not configured". No COOP header / no Google SDK in the browser (the old GIS token flow is gone).
- **Weather** (optional, server-side key, OpenWeatherMap One Call 4.0): server `lib/server/weather.ts` + routes `app/api/weather/{status,daily,hourly}` (key `OPENWEATHER_API_KEY`, never `NEXT_PUBLIC_`). Client `lib/weather.ts` (cache-first via `lib/weather-cache.ts`, localStorage `marathon-weather-cache-v1`), `store/use-weather-store.ts` (`{configured, ready, lastCoords}`, init in `sync-initializer.tsx`). `lib/weather-sync.ts` captures a `Workout.weather` snapshot on log (geolocation) and lazily backfills finished workouts; calendar shows per-day icon+temp via `useCalendarWeather` (one `daily` call per visible week). Gated by `preferences.weatherEnabled`/`weatherCalendar`; "not configured" when the key is absent. `Workout.finishTime` ("HH:mm") drives precise hourly lookups.
- **Workout dialog** (`components/plan/workout-form-dialog.tsx`): a **Plan vs Log** mode toggle. Plan mode = scheduling (date or flexible window + planned distance/pace; no actuals). Log mode = actuals (distance, duration `mm:ss`, pace, notes, completed). Distance + (duration *or* pace) auto-computes and locks the third field.

## i18n — `lib/i18n/`

react-i18next, locales `en`/`nl` in `lib/i18n/locales/`. `lib/i18n/locales/en.ts` exports `type Dict = typeof en` (NOT `as const` — that breaks `nl: Dict`), so **`nl` must mirror `en`'s keys** (the compiler enforces it). Use `const { t } = useTranslation()` and `t("namespace.key", { vars })`. **Adding a string = add the key to BOTH `en.ts` and `nl.ts`.** Locale lives in `preferences.locale`; `components/layout/i18n-provider.tsx` applies it + keeps `lib/date-locale.ts` (the date-fns locale holder used by `lib/date.ts`) in sync. The big AI prompts live in the dictionaries (`settings.aiPrompt`, `wizard.aiPrompt`) and keep JSON field names in English on purpose.

## Folder map

```
app/                      routes (dashboard /, plan, plan/new, calendar, off-days, stats, settings)
components/ui/            shadcn (Base UI) primitives — generally don't edit
components/{layout,common,dashboard,plan,calendar,off-days,stats,settings,wizard}/  feature UI
hooks/                    useActivePlan, useStats, useHydrated, useMounted
lib/                      types, plan-generator, stats (derived), pace, date(+date-locale), storage(export/import+migrate), google-drive (thin sync client), drive-types, i18n, utils
lib/server/               server-only Drive OAuth: session (iron-session), google-oauth, drive, api (error helper)
app/api/                  Route Handlers: auth/google/{login,callback}, auth/{session,logout}, drive/{meta,content}
store/                    use-training-store, use-sync-store
docs/                     this guide, roadmap.md (planned features), ai-plan-coach.md (deferred design)
```

## Build & verify

- `npm install` then `npm run dev`. `npm run build` (Vercel-ready), `npm run lint` — **keep both green** (lint runs `react-hooks` rules stricter than build; avoid `setState`-in-effect — use the render-time reset or `useMounted`).
- Optional Drive sync: copy `.env.local.example` → `.env.local`, set `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`GOOGLE_REDIRECT_URI`/`SESSION_SECRET`, and register the redirect URI + publish the consent screen (see README "Cloud sync setup").
- **Test the generator** without a browser: `npx tsx` a small script importing `generateDefaultPlan` from `lib/plan-generator.ts`.
- **Browser smoke** (no extra deps committed): `npm i -D playwright-core`, launch with `chromium.launch({ channel: "chrome" })` (uses system Chrome — no browser download), drive the app, then `npm uninstall playwright-core`. Use isolated `browser.newContext()` per scenario to reset localStorage. Onboarding popups appear on fresh state — the Drive dialog only shows when sync is configured (server env set), otherwise you go straight to the "create plan?" popup; choose a plan option.

## When extending

- New persisted field on a plan/preferences → add to `lib/types.ts`, default it in the generator and `lib/storage.ts` `normalizePlan`, and **bump the persist `version` + backfill in `migrate`**.
- New UI string → add to both dictionaries.
- New page → thin server `page.tsx` rendering a `"use client"` view inside `<HydrationGate>`, with a `<PageHeader titleKey=… />`; add a nav entry in `components/layout/app-nav.tsx`.
- Statistics are **derived live** (`lib/stats.ts` + `hooks/use-stats.ts`), never persisted.

## Future work

Planned/deferred features (with where to hook in) live in
[`roadmap.md`](roadmap.md) — e.g. Google Calendar integration for the off-days
step, and the in-app AI coach ([`ai-plan-coach.md`](ai-plan-coach.md)). Update
the roadmap when you ship or scope an item.
