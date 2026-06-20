# 🏃 Marathon Tracker

A clean, mobile-first web app for tracking marathon training — built for a sub-3:30 goal on **October 11, 2026**, with an auto-generated 16-week plan that builds to a 30 km peak and works around real-life interruptions (vacations, a surf trip).

No backend, no login. Everything lives in your browser's **localStorage**. Deploys to Vercel as a static app.

> Design language: **Strava × Notion** — calm surfaces, data-dense cards, an orange race-day accent, and full dark mode.

---

## Screenshots

| Dashboard | Dashboard (dark) |
| --- | --- |
| ![Dashboard](docs/screenshots/dashboard-light.png) | ![Dashboard dark](docs/screenshots/dashboard-dark.png) |

| Plan | Calendar | Stats |
| --- | --- | --- |
| ![Plan](docs/screenshots/plan-light.png) | ![Calendar](docs/screenshots/calendar-light.png) | ![Stats](docs/screenshots/stats-light.png) |

| Calendar (dark) | Stats (dark) | Settings |
| --- | --- | --- |
| ![Calendar dark](docs/screenshots/calendar-dark.png) | ![Stats dark](docs/screenshots/stats-dark.png) | ![Settings](docs/screenshots/settings-light.png) |

---

## Features

- **Dashboard** — countdown to race day, % through the training block, plan-completion %, weekly & monthly mileage (planned vs actual), upcoming and recently-completed workouts.
- **Marathon plan** — all training weeks, grouped and collapsible, with a phase badge (Base / Build / Peak / Taper / Race / Reduced) and special-period labels. Mark complete, edit, add custom workouts.
- **Workout tracking** — date, type (Easy / Tempo / Interval / Long / Recovery), planned & actual distance, planned & actual pace, duration. Actual pace is auto-derived from distance + time.
- **Statistics** — total distance, longest run, weighted average pace, runs completed, weekly mileage trend, and long-run progression (planned vs actual) charts.
- **Calendar** — monthly grid with colored workout dots (faded = planned, solid = completed); tap a day to view, edit, or add workouts.
- **Settings** — race details, theme (light/dark/system), and **export / import JSON** so you can hand the whole schema to an agent and re-import it. Regenerate the default plan anytime.

---

## The training plan

The plan is generated deterministically in [`lib/plan-generator.ts`](lib/plan-generator.ts) from today's week through race week. Each week follows the schedule **Mon easy · Wed quality · Thu easy · Sun long**, with paces derived from the sub-3:30 goal (race pace ~4:58/km) and slightly softened in the first three weeks for an injury return.

Long runs build with periodic cutbacks to a **30 km peak two weeks out**, then taper into the marathon. Special periods are encoded once in [`lib/date.ts`](lib/date.ts) and applied automatically:

| Period | Effect |
| --- | --- |
| Jul 3–5 (Vacation) | No training that weekend — long run dropped |
| Jul 24 – Aug 2 (Surf trip) | Limited — short optional jogs only |
| Sep 16–23 (Vacation) | Reduced volume |

Want a different plan? Either tweak the constants in `lib/plan-generator.ts` / `lib/date.ts` and redeploy, or export your JSON, edit it, and import it back from **Settings**.

---

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) (Base UI primitives)
- [Zustand](https://github.com/pmndrs/zustand) with `persist` → localStorage
- [Recharts](https://recharts.org) for graphs · [date-fns](https://date-fns.org) for dates · [next-themes](https://github.com/pacocoursey/next-themes) for dark mode

---

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On first load the app generates your plan and saves it to localStorage.

```bash
npm run build   # production build (Vercel-ready)
npm run start   # serve the production build
```

### Deploy to Vercel

Push to a Git repo and import it in Vercel. It builds and serves as a fully static client app. The only (optional) configuration is the Google Drive sync client ID below — leave it unset and the app runs localStorage-only.

---

## Cloud sync setup (optional)

By default everything lives in your browser's localStorage. You can optionally connect a **Google account** to back up and sync your progress via **Google Drive** — done entirely client-side (no backend, no secrets). Data is stored in Drive's hidden **app-data folder**, invisible in your Drive and accessible only to this app.

Without a client ID, the app still works fully (local only) and the Settings → Cloud sync card simply shows "not configured".

To enable it, create an OAuth client in the [Google Cloud Console](https://console.cloud.google.com/):

1. **Create a project** (or pick one).
2. **APIs & Services → Library →** enable **Google Drive API**.
3. **APIs & Services → OAuth consent screen:** choose **External**, keep it in **Testing** mode, add your own Google account under **Test users**, and add the scope `https://www.googleapis.com/auth/drive.appdata`.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID → Web application.** Under **Authorized JavaScript origins** add `http://localhost:3000` and your deployed URL (e.g. `https://your-app.vercel.app`). No redirect URIs are needed (token flow).
5. Copy the **Client ID** into `.env.local` (see `.env.local.example`):

   ```bash
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
   ```

   For Vercel, add the same variable under **Project → Settings → Environment Variables** and redeploy.

Then open **Settings → Cloud sync → Connect Google Drive**.

- The client ID is public/safe to ship; there is no client secret in the browser.
- In Testing mode Google shows an "unverified app" screen — expected for personal use; continue past it.
- Sync is **newest-wins**: it pulls on connect, auto-pushes a few seconds after each edit, and offers a manual **Sync now**. Disconnecting revokes the token but keeps your local data.

### Troubleshooting: `Error 403: access_denied` ("has not completed the Google verification process")

Your consent screen is in **Testing** mode and the account you signed in with isn't an approved tester. Fix it in **OAuth consent screen → Audience → Test users → + Add users**, add the exact email you log in with, wait a minute, and retry. (Or **Publish app** to skip the test-user list — still works behind the unverified-app warning for personal use.)

---

## Project structure

```
app/                 # Routes: dashboard (/), plan, calendar, stats, settings
components/
  ui/                # shadcn/ui primitives
  layout/            # nav, theme provider/toggle
  common/            # shared widgets (workout row, stat card, progress ring, …)
  dashboard|plan|calendar|stats|settings/   # per-page views
lib/
  types.ts           # domain models
  plan-generator.ts  # generateDefaultPlan() — the core logic
  date.ts            # week ranges + SPECIAL_PERIODS
  pace.ts            # pace parsing / formatting / derivation
  stats.ts           # derived statistics (pure functions)
  storage.ts         # export / import + migration hook
  google-drive.ts    # client-side Google Drive sync (GIS + Drive REST)
store/
  use-training-store.ts   # Zustand store + localStorage persistence
  use-sync-store.ts       # Google Drive sync state + auto-push
hooks/                # useHydrated, useStats
```

Statistics are **derived live** from your workouts rather than stored, so they never go stale — the only persisted state is the plan, your workouts, and preferences.
