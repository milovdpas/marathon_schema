# Known tech debt

Refactors that are worth doing but weren't done, with enough context to pick up
cold. Feature work lives in [`roadmap.md`](roadmap.md); this file is only about
the shape of the code.

Written up during the August 2026 cleanup pass, which did the calendar
decomposition, the layout tokens and the dead-code removal, and deliberately
stopped there. Delete an item when it's done.

---

## 1. No test coverage on the pure logic

**Status:** not started. Highest value item here.

**Why it matters.** `mergeLoggedWorkouts`, `rekeyCollidingWorkouts` and
`findMatchingPlanId` (`store/use-training-store.ts`) are what stop an
AI-generated re-import from silently destroying logged training. The failure
mode is irreversible: there is no backend, so a bad merge means the user's real
runs are gone from localStorage with nothing to restore from. Today the only
way to exercise them is to hand-craft an import JSON in the browser.

Also worth covering: `placeBars` (`lib/calendar-layout.ts`) has four
interacting edge cases — week-boundary clipping, track packing, reuse of a
freed track, and a `chosenOffset` that falls outside the visible segment — none
of which are visible until a specific overlap of off-days and flexible windows
lands in one week. And `resolveElevations` (`lib/split-scanner.ts`).

**Shape.** `vitest` as the only new devDependency. Node environment, no jsdom,
no Testing Library, `include: ["lib/**/*.test.ts"]`. Component tests would need
i18n + Zustand + Base UI portals and cost more than everything else here.
Import `{ describe, it, expect }` explicitly rather than enabling globals, so
ESLint stays green with no config change.

**Do first:** move the pure functions out of `store/use-training-store.ts`
(roughly lines 84–200) into `lib/plan-merge.ts`. They're already
side-effect-free and module-private, so it's a mechanical move, and it drops
the store by ~110 lines.

**Pin this edge case:** `isLogged` (`lib/workout.ts`) treats
`actualDistanceKm: 0` as logged, because `0 != null`. That is deliberate.

**Also:** add `npm test` to the verify line in `AGENTS.md` and
`architecture.md` alongside `build` and `lint`, or the suite will rot.

---

## 2. The pace/duration/distance triangle is duplicated four ways

**Status:** not started. Highest *risk* item here.

`components/plan/workout-form-dialog.tsx` and
`components/common/complete-workout-dialog.tsx` each contain the same
"distance + one of duration/pace fills in the third" logic **twice**: once to
render the computed field as locked, once to build the save payload.

**Why it matters.** Four copies that can drift. Display and save drifting is
precisely the bug that saves a run at a pace the user never saw on screen.

**Fix.** One `resolveLoggedRun(fields)` in `lib/pace.ts` returning both the
domain values (`actualDistanceKm`, `durationMin`, `actualPace`) and the display
values (which field is computed, what to show in each input). Both dialogs call
it once. Preserve two behaviours exactly: `if (actualDistanceKm)` is falsy at 0,
and a failed derivation falls back to the user's free-form pace string. Write
the test before touching the dialogs — see item 1.

---

## 3. Smaller duplication

None of these are urgent; they're listed so nobody has to rediscover them.

| What | Where | Note |
|---|---|---|
| `newId()` | `lib/storage.ts`, `store/use-training-store.ts`, `components/wizard/add-plan-wizard.tsx` | 3 identical copies → `lib/id.ts` |
| `function Field({label, children})` | `off-days-view.tsx`, `workout-form-dialog.tsx`, `settings-view.tsx`, `add-plan-wizard.tsx` | byte-identical in all four → `components/common/field.tsx` (not `ui/`, which is scaffolded shadcn) |
| `Math.round(loopKm * targetYards * 10) / 10` | `settings-view.tsx` ×2, `add-plan-wizard.tsx` ×2 | → `backyardDistanceKm()` next to `BACKYARD_LOOP_KM` in `lib/types.ts` |
| `num(v: string)` | `complete-workout-dialog.tsx`, `workout-form-dialog.tsx` | byte-identical |
| Raw `<textarea>` | `add-plan-wizard.tsx`, `settings-view.tsx` | a genuine primitive gap: `ui/input.tsx` exists, `ui/textarea.tsx` doesn't. Base UI has no Textarea, so render a plain element matching `input.tsx`'s style |

**Clipboard copy is a latent bug, not just duplication.** Four copies
(`settings-view.tsx` ×2, `add-plan-wizard.tsx` ×2) each do a bare
`await navigator.clipboard.writeText(…)` in an async handler: on a permission
denial or a non-secure context that's an unhandled rejection and the button
silently does nothing. All four also leak a `setTimeout` that can fire after
unmount. A `useCopyToClipboard(resetMs)` hook returning `{ copied, copy }`
fixes the behaviour and removes the duplication in one go.

---

## 4. Two oversized view components

`components/wizard/add-plan-wizard.tsx` (733 lines) and
`components/settings/settings-view.tsx` (529) are both larger than
`calendar-view.tsx` was before it was decomposed.

**Why they were skipped.** Unlike the calendar — where a layout algorithm, the
sticky-offset arithmetic and three view modes were tangled into one render —
these are mostly linear JSX with low interconnection: four wizard steps, N
settings cards. The size is real but the coupling isn't, so the payoff per hour
is the lowest on this list.

**Seams when you do get to it.**
- Wizard → `components/wizard/steps/step-{race,off-days,training,ai}.tsx`, each
  taking `{ draft, set }`, plus `lib/plan-request.ts` for `buildRequest()` and
  the `Draft`/`LatestRun` types. That last one is pure data transformation for a
  versioned wire format — the part most likely to need a test when the AI schema
  version bumps.
- Settings → one `*-card.tsx` per section. The pattern is already established:
  `cloud-sync-card`, `split-scanner-card` and `weather-card` exist;
  `settings-view.tsx` just hasn't finished following it. Candidates:
  plans, race details, appearance, data.

---

## 5. Won't fix (recorded so it isn't re-litigated)

**`lib/google-drive.ts` and `lib/server/drive.ts` export the same four names**
(`findFile`/`downloadFile`/`createFile`/`updateFile`) with different signatures.
Looks like a trap, isn't one in practice: nothing imports both, they run in
different runtimes (`store/use-sync-store.ts` takes the client pair,
`app/api/drive/*` the server pair), and renaming is churn on the one subsystem
where a mistake loses user data. A header comment on each saying which side of
the wire it's on is enough.

**`lib/weather-sync.ts` imports the Zustand stores directly**, which inverts the
dependency direction the rest of `lib/` respects. It is explicitly the glue
layer between UI actions and the weather client — that's what its header says.
Purifying it means threading store state through five call sites to make one
file tidier. Net negative.

**`shadcn` sits in `dependencies`, not `devDependencies`.** It looks like a
misplaced CLI, but `app/globals.css` does `@import "shadcn/tailwind.css"`, so it
is needed at build time. Moving it risks a broken deploy under any install that
skips dev dependencies, and gains nothing.
