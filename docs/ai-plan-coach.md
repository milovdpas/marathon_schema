# AI Plan Coach — design notes (not implemented yet)

Status: **deferred**. This documents the intended design so it can be picked up later. Nothing here is built.

## Goal

Let the user change their training plan by talking to an AI in plain language, e.g.:

- "Move this week's long run to Saturday."
- "I'm sick — make next week an easy recovery week."
- "Add a 5 km parkrun every Saturday in August."
- "I ran 13.2 km at 5:01 today, log it on the easy run."

The AI edits the **active plan** by calling the store's existing mutation actions. The plan is already a clean JSON document with export/import, so the AI layer sits on top without changing how data is stored.

## Chosen approach: Option B — in-app chat, bring-your-own-key

- A chat panel in the app. The user pastes their **own** LLM API key (Anthropic recommended), stored in `localStorage`.
- The browser calls the LLM API directly with **tool use**; tools map 1:1 to store actions.
- Keeps the **no-backend / Vercel-static** architecture intact. No cost to the app owner.
- Trade-off: the key lives in the browser. Acceptable for a personal / self-hosted app; **not** suitable if the AI feature is opened to other people.

> If we ever want AI for *other* users, switch to **Option C**: a single Vercel serverless function proxies to the LLM with the owner's key. Same chat + tool layer; only the key location and an added (small) backend differ. Build B so this swap is a localized change (isolate the "call the model" function).

Rejected for now:
- **Option A** (manual copy-paste of Export JSON into an external chatbot) — works today with zero code, mention it in the UI as the no-build option.
- **Option C** — adds a backend + per-use cost; revisit only for multi-user.

## Architecture

```
components/ai/
  ai-coach-panel.tsx     # chat UI (messages, input, key prompt, diff confirm)
lib/ai/
  client.ts              # provider call (Anthropic Messages API w/ tools); the ONE swappable bit
  tools.ts               # tool JSON-schemas + dispatch to store actions
store/
  use-ai-store.ts        # apiKey (persisted), messages, status, pendingDiff
```

### Provider / model
- Anthropic Messages API with tool use. Use a current model (e.g. Claude Sonnet/Opus). See the `claude-api` reference for exact model ids, headers, and tool-use shape before implementing — do not hardcode from memory.
- Anthropic browser calls need `anthropic-dangerous-direct-browser-access: true` plus the user's key. This is the crux of the BYO-key trade-off — call it out in the UI.

### Tools (map to existing store actions in `store/use-training-store.ts`)
- `update_workout(id, patch)` → `updateWorkout`
- `add_workout(workout)` → `addWorkout`
- `delete_workout(id)` → `deleteWorkout`
- `update_plan_meta(patch)` → `updatePlanMeta`
- (maybe) `move_workout(id, newDate)` → convenience wrapper over `updateWorkout`

Pass the workout/plan TypeScript types as JSON schema for the tool inputs. Reuse `lib/types.ts`.

### Context sent to the model
- The active plan (or a compacted view: weeks + workouts), today's date, and the user's fitness notes/goal.
- For large plans, send a summarized form and let the model request detail, or just send the active plan (it's small enough — ~16 weeks).

### Guardrails (important — plan edits are destructive)
1. The model proposes a **diff** ("I'll change these 3 workouts: …") rather than mutating silently.
2. The user **confirms** before any store action runs. Render the diff (before → after per workout).
3. Apply confirmed tool calls inside one batch; bump `lastModified` once so cloud sync pushes the result normally.
4. Never let the model fabricate ids — it must reference existing workout ids from the context.

### Sync interaction
- Edits go through the normal store actions, so the existing Drive auto-push (debounced, newest-wins) handles backup automatically. No special casing.

## Open questions for later
- Streaming vs. single response for the chat UX.
- How much plan context to send vs. token cost (probably fine to send whole active plan).
- Whether to support multi-plan operations ("create a new half-marathon plan for April") via `addPlan`.
- Rate-limit / error UX when the user's key is invalid or out of credit.

## Rough effort
~1 day for Option B given the store is already action-based: chat UI + key handling + tool schema/dispatch + diff-confirm. Option C adds a serverless route + owner key handling on top.
