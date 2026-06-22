# Roadmap & planned features

Planned / deferred work, with enough context for an agent to pick it up. Update
this when shipping an item (move it out) or when scoping a new one. See
[`architecture.md`](architecture.md) for how the app is built.

---

## 1. Google Calendar integration for off days (create-plan flow)

**Status:** deferred. There's a visible placeholder already — a disabled
**"Connect Google Calendar (coming soon)"** button in the wizard's off-days step.

**Why:** when adding off days (vacations/trips/busy periods) in the wizard, let
the user pull their real agenda so they can pick periods instead of typing dates.

**Where it hooks in:**
- Placeholder button: `components/wizard/add-plan-wizard.tsx`, step 2 (off days), using i18n key `wizard.calendarSoon` (in `lib/i18n/locales/{en,nl}.ts`).
- Off-day editing UI also lives in `components/off-days/off-days-view.tsx` (standalone tab) — consider sharing.
- Auth/Google plumbing already exists in `lib/google-drive.ts` (GIS token client) — extend it, don't rebuild.

**What it entails:**
- Add the read-only Calendar scope (`https://www.googleapis.com/auth/calendar.readonly`) to the GIS token client `SCOPES` in `lib/google-drive.ts`. Note this changes the OAuth consent (extra scope → re-consent; update the Google Cloud consent screen + README setup).
- Fetch events in the plan's date range via the Calendar REST API (`GET /calendar/v3/calendars/primary/events?timeMin=…&timeMax=…`), same Bearer-token `fetch` style as the Drive helpers.
- Show fetched events as **suggested off days** the user can one-tap add (map an all-day or multi-day event → `OffDay { start, end, title, note }`).
- Keep it optional and gated on `isSyncConfigured()` — works without it (manual entry stays the default).

**Considerations:** Calendar is a **sensitive scope** → it deepens the unverified-app warning and requires consent-screen changes. Keep it strictly read-only and opt-in. Stays 100% client-side (no backend).

---

## 2. In-app AI plan coach (chat to edit your plan)

**Status:** designed, deferred. Full design already written in
[`ai-plan-coach.md`](ai-plan-coach.md) — read that before starting.

**Summary:** a chat panel where the user types a change ("I'm sick, make next
week easy") and an LLM edits the active plan via tool calls mapped to the store
actions. Chosen approach: in-app chat with the user's **own** API key (no
backend); see the doc for the tool schema, guardrails (propose-diff-then-confirm),
and the path to a serverless-proxy variant.

**Note:** today the equivalent is the **manual** export→AI→import flow already
shipped (the "Edit your plan with AI" prompt in Settings, and the add-plan
wizard). This item is about making that in-app/conversational.

---

## How to propose a new future item

Add a section here with: **what** it is, **why**, **where it hooks in** (files +
existing utilities to reuse), **what it entails**, and **considerations/risks**.
If it's large, write a dedicated `docs/<feature>.md` and link it from here.
