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

Push to a Git repo and import it in Vercel — no environment variables or configuration needed. It builds and serves as a fully static client app.

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
store/
  use-training-store.ts   # Zustand store + localStorage persistence
hooks/                # useHydrated, useStats
```

Statistics are **derived live** from your workouts rather than stored, so they never go stale — the only persisted state is the plan, your workouts, and preferences.
