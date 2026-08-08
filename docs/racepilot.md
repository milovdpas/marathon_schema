# RacePilot — the multi-sport conversion

**Status: in progress.** This document tracks a conversion that spans several
releases: turning a running-only "Marathon Tracker" into **RacePilot**, an
endurance planner that covers marathon, ultra, backyard ultra, trail, cycling,
swimming and triathlon.

It exists because the work is too big for one commit and the *reasons* behind
the decisions are easy to lose between slices. Read this before starting any
slice; update it **within** the slice, not afterwards.

Where this sits next to the other docs — the boundary matters, or all four rot:

| doc | answers |
|---|---|
| [`architecture.md`](architecture.md) | How the app works **now**. Edited when a slice lands. |
| [`roadmap.md`](roadmap.md) | Features not started, unrelated to this conversion. |
| [`tech-debt.md`](tech-debt.md) | Refactors deliberately deferred. |
| **this file** | This conversion: sequence, progress, decisions and their reasons. |

---

## 1. What RacePilot is becoming

One planner for seven race types, personalised to the athlete rather than
showing everyone everything:

🏃 Marathon · 🏃 Ultra · 🏃 Backyard Ultra · 🏔️ Trail · 🚴 Cycling · 🏊 Swimming · 🏊🚴🏃 Triathlon

The app stays what it is: free, no account, no database, no ads. Training data
lives in the browser's `localStorage`, or in the user's *own* Google Drive. That
promise is now stated on the landing page and in onboarding, which makes it a
constraint on every future slice rather than a marketing line.

---

## 2. Slices

| # | slice | status | landed in |
|---|---|---|---|
| 1 | Rebrand + `/app/*` routing + full-page onboarding + athlete types + example-plan catalogue + SEO | **done** | see git log |
| 2 | Units & country (km/mi), Settings toggle, AI context | not started | — |
| 3 | Multi-sport workouts (`Workout.sport`), cycling / swimming / trail | not started | — |
| 4 | Triathlon (multi-leg races, bricks, transitions) | not started | — |
| 5 | Remaining example plans (cycling, swimming, triathlon) | blocked on 3 | — |

Slice 1 is shipped. Slice 2 (units) is the next one to start.

### Slice 1 — rebrand, routing, onboarding

- Rebrand the *product* to RacePilot. Domain data keeps its names (see
  "Frozen identifiers" below).
- `/` becomes a server-rendered marketing page; the app moves to `/app/*` with
  308 redirects from the old paths.
- New full-page onboarding at `/welcome` — privacy first, then a short tour,
  athlete profile, feature opt-ins, and finally "create a plan" or "look
  around". The popup mechanism survives, but only as the *what's new* channel
  for existing users.
- `athleteTypes` multi-select, driving `lib/athlete.ts` capabilities.
- An example-plan **catalogue** so each athlete type can get a relevant demo.
- SEO: per-page metadata, sitemap, robots, OG image, Search Console.

### Slice 2 — units & country

Store canonical units forever (km, °C, metres) and convert only at display.
Derive the country from `navigator.language`'s region subtag with an `Intl`
timezone fallback; the user can always override it in Settings, and it is passed
to the AI as context. ~45–50 display sites; input fields come last, because they
are the only place a unit conversion can *corrupt* stored data through
round-trip drift.

### Slice 3 — multi-sport workouts

`Workout.sport` (`"run" | "bike" | "swim"`), **orthogonal to `Workout.type`**.
Stats gain a per-sport breakdown and a total time.

### Slice 4 — triathlon

`RaceType` gains `"multisport"`, `PlanMeta.legs[]` carries per-leg distances and
transition times, and race day becomes **three linked workouts** sharing a
`raceGroupId` rather than one workout containing legs. Bricks fall out of the
same model for free.

---

## 3. Decisions, and why

These are the ones that are expensive to rediscover.

**No analytics beyond Search Console.** Google Search Console reports search
impressions and clicks — how people *find* the app — which is enough. There is
deliberately no GTM, no product analytics and no consent banner, because "we
collect no data about you" is only worth saying if it is literally true.

**Marketing at `/`, app at `/app/*`.** Every app page renders behind
`HydrationGate`, which shows a skeleton until Zustand rehydrates from
`localStorage`. A crawler's `localStorage` is empty, so it *never* sees content
— before this change the entire indexable body of `/` was six words. A real
prefix (rather than a route group) also means the app's chrome and its
`noindex` live in one layout, `app/app/layout.tsx`.

**`sport` is orthogonal to `type`.** `WorkoutType` is an *intensity* axis
(`easy`/`tempo`/`interval`/`long`/`recovery`) — proven by `longRunProgression`
filtering on `type === "long"`. "Tempo" means the same thing on a bike, so the
two axes multiply rather than merge: sport picks the icon, intensity picks the
colour, and the badge doesn't grow.

**One canonical pace unit.** Seconds per kilometre, for every sport, converted
at display: min/100m is (min/km) ÷ 10 and km/h is 3600 ÷ (s/km). Storing each
sport's idiomatic unit would mean every stat, chart and merge helper learning
three representations.

**`athleteTypes` is a tri-state.** `undefined` means never asked (so existing
users get the one-time prompt), `[]` means asked and declined (never ask
again). This is why there is no companion `athleteTypesSeen` flag — a plain
boolean, like `splitScannerOnboardingSeen`, cannot tell `false` from "not
asked". The gate predicate must therefore be `athleteTypes === undefined` and
**not** `!athleteTypes?.length`, which would re-ask a decliner forever.

**Capabilities, not raw types.** *Feature* gating branches on
`capabilitiesFor(types)` (`lib/athlete.ts`), never on `types.includes("ultra")`.
A capability survives adding an eighth athlete type; a scattered `includes` does
not. The one deliberate exception is the example catalogue, where each entry
already declares the types it is for, so `examplesFor` matches on those directly
rather than inventing a capability per demo.

**`capabilitiesFor` is cached on the exact list, not a sorted one.** Order is
meaningful — the first type picked becomes `primary` and drives the app's mark —
so `["cyclist","runner"]` and `["runner","cyclist"]` must not share a cache
entry. A test pins this; it was wrong first time round.

**Unknown profile shows everything.** `capabilitiesFor(undefined)` and
`capabilitiesFor([])` both enable every capability. Never hide a feature from
someone who hasn't told us anything about themselves.

**Example plans for bike / swim / tri are blocked, not forgotten.** An example
plan is data in the current schema, and `Workout` has no `sport` field yet — so
those plans are literally unrepresentable until slice 3. They are not faked by
relabelling running workouts: a demo whose job is to show the user their sport
is worse than useless if it lies.

**The install prompt is a popup, not an onboarding step.** `useInstallApp()`
only reaches `mode: "prompt"` once Chrome fires `beforeinstallprompt`, which
often happens *after* the user has clicked through `/welcome`. As a step it
would render for one user and blank for the next.

---

## 4. Frozen identifiers

Changing any of these breaks existing installs. They look like branding; they
are not.

| identifier | where | why it's frozen |
|---|---|---|
| `STORAGE_KEY = "marathon-training-v1"` | `lib/plan/storage.ts` | Orphans every existing user's `localStorage`. |
| `manifest.id: "/"` | `app/manifest.ts` | Chrome keys the installed Android WebAPK on it — a change mints a *second* icon on every home screen. `start_url` is the field that may move. |
| `DEFAULT_PLAN_ID = "milo-marathon"` | `lib/plan/defaults.ts` | Existing installs already hold a plan with this id; it stays the marathon example's id. |
| `DEFAULT_PLAN_META.raceName`, `MARATHON_KM` | `lib/plan/defaults.ts` | Domain data, not product name. |

---

## 5. Known gaps

Things a slice deliberately left half-done. Close them in the slice named, or
record why not.

- **Athlete types can only personalise what exists.** As of slice 1 that is the
  race-format picker, the distance presets, the app's in-app mark and which
  example plans are offered — because `RaceType` is still just
  `"standard" | "backyard"`. Slice 3 gives it real surface area.
- **Picking "cyclist", "swimmer" or "triathlete" adds no example plan.** There
  is nothing to add: those demos need `Workout.sport`. The Settings card says so
  explicitly (`examples.comingSoon`) rather than silently showing an unchanged
  list, and `defaultExampleFor` falls back to the marathon block so a first run
  is never empty. Delete that message in slice 5, when the plans exist.
- **The installed app icon cannot vary per athlete.** Android bakes icons into
  the WebAPK at install time and rate-limits updates to days; iOS snapshots the
  touch icon when the user adds it. Only the in-app mark and the browser tab
  favicon can change — and the favicon is invisible in `display: standalone`.
  Do not attempt a dynamic manifest.
- **Dutch has no separate URLs.** `hreflang` needs locale routes and a
  per-request-safe i18n layer; today's is a process-level singleton that would
  race across concurrent renders. Revisit only if Search Console shows real
  Dutch impressions.
