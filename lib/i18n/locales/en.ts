export const en = {
  common: {
    km: "km",
    perKm: "/km",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    add: "Add",
    edit: "Edit",
    dash: "—",
    appName: "Marathon",
    appTagline: "Training tracker",
    createPlan: "Create a plan",
    decrease: "Decrease",
    increase: "Increase",
  },
  nav: {
    dashboard: "Dashboard",
    plan: "Plan",
    calendar: "Calendar",
    offDays: "Off days",
    stats: "Stats",
    settings: "Settings",
    theme: "Theme",
  },
  workoutType: {
    easy: "Easy Run",
    tempo: "Tempo",
    interval: "Interval",
    long: "Long Run",
    recovery: "Recovery",
  },
  phase: {
    base: "Base",
    build: "Build",
    peak: "Peak",
    taper: "Taper",
    race: "Race",
    reduced: "Reduced",
  },
  dashboard: {
    title: "Dashboard",
    subtitle: "Your road to the start line.",
    daysToGo: "days to go",
    goalLine: "{{goal}} · {{pace}}/km",
    throughBlock: "You're <b>{{pct}}%</b> through your training block.",
    planComplete: "Plan complete",
    workoutsRatio: "{{done}}/{{total}} workouts",
    totalDistance: "Total distance",
    longest: "longest {{km}} km",
    thisWeek: "This week",
    ofPlanned: "of {{km}} km planned",
    thisMonth: "This month",
    doneRatio: "{{done}}/{{total}} done",
    upcoming: "Upcoming workouts",
    viewPlan: "View plan",
    caughtUp: "No upcoming workouts — you're all caught up! 🎉",
    recent: "Recently completed",
    noPlanTitle: "No plan yet",
    noPlanBody: "Create your first training plan to get started.",
  },
  workoutRow: {
    custom: "custom",
    flexible: "Flexible",
  },
  completeWorkout: {
    title: "Log this run",
    desc: "We pre-filled your planned target — adjust it to what you actually ran.",
    confirm: "Log & complete",
    planned: "Planned: {{km}} km · {{pace}}/km",
  },
  plan: {
    title: "Marathon Plan",
    subtitle: "Your training block, grouped by week.",
    addWorkout: "Add workout",
    week: "Week {{n}}",
    thisWeek: "this week",
    weekMeta: "{{range}} · {{km}} km · {{done}}/{{total}} done",
    restWeek: "Rest week — no scheduled runs.",
    pickDay: "Pick a day",
  },
  workoutForm: {
    editTitle: "Edit workout",
    addTitle: "Add workout",
    editDesc: "Update planned targets or log what you actually ran.",
    addDesc: "Add a custom workout to your plan.",
    modePlan: "Plan",
    modeLog: "Log",
    date: "Date",
    type: "Type",
    titleLabel: "Title",
    titlePlaceholder: "e.g. 6×800m intervals",
    planned: "Planned",
    distanceKm: "Distance (km)",
    paceLabel: "Pace (mm:ss)",
    actual: "Actual",
    durationMin: "Duration (mm:ss)",
    paceAuto: "auto from distance + time",
    willCompute: "Will compute to {{pace}}/km",
    computeHint: "Fill in distance + either duration or pace — the third is calculated automatically.",
    notes: "Notes",
    notesPlaceholder: "How did it feel?",
    completed: "Completed",
    flexible: "Flexible (complete any day in a window)",
    windowStart: "Window start",
    windowEnd: "Window end",
    finishTime: "Finished at (optional)",
  },
  calendar: {
    title: "Calendar",
    subtitle: "Your training month at a glance.",
    today: "Today",
    prevMonth: "Previous month",
    nextMonth: "Next month",
    weather: "Weather",
    offDayLabel: "Off day",
    legend:
      "Tap a day to see or edit its workouts. Faded dots are planned; solid dots are completed.",
    flexLegend:
      "Vacations and flexible workouts show as bars spanning their days. The underline on a flexible bar marks the day it's currently planned — tap the bar to change it.",
    workoutsScheduled_one: "{{count}} workout scheduled",
    workoutsScheduled_other: "{{count}} workouts scheduled",
    nothingScheduled: "Nothing scheduled this day.",
    addWorkout: "Add workout",
  },
  offDays: {
    title: "Off days",
    subtitle: "Periods that may limit training.",
    intro:
      "Vacations, trips and other periods that limit training. These show on your calendar and travel with your exported plan as context.",
    emptyTitle: "No off days yet",
    emptyBody: "Add a vacation or trip so it's factored into your training.",
    addTitle: "Add off day",
    editTitle: "Edit off day",
    dialogDesc: "Describe the period and whether any training is possible.",
    titleLabel: "Title",
    titlePlaceholder: "e.g. Vacation to Ghent",
    from: "From",
    to: "To",
    note: "Note (training possibility)",
    notePlaceholder: "e.g. Likely no training / very limited running",
  },
  stats: {
    title: "Statistics",
    subtitle: "Your training, by the numbers.",
    totalDistance: "Total distance",
    ofPlanned: "of {{km}} km planned",
    longestRun: "Longest run",
    avgPace: "Avg pace",
    runsCompleted: "Runs completed",
    pctOfPlan: "{{pct}}% of plan",
    weeklyMileage: "Weekly mileage",
    historyTitle: "Mileage history",
    historySub:
      "Every logged run by calendar week — including runs from before this plan and from your other plans.",
    longRunProgression: "Long-run progression",
    longRunHint: "Building toward your peak, then tapering for race day.",
    planned: "Planned",
    actual: "Actual",
  },
  settings: {
    title: "Settings",
    subtitle: "Preferences, theme, and your data.",
    plans: "Plans",
    activePlan: "Active plan",
    addPlan: "Add plan",
    deleteThisPlan: "Delete this plan",
    deletePlanTitle: "Delete plan?",
    deletePlanDesc:
      "This permanently removes “{{name}}” and its logged progress. This cannot be undone.",
    raceDetails: "Race details",
    trainingPrefs: "Training preferences",
    planName: "Plan name",
    raceName: "Race name",
    raceDistance: "Race distance (km)",
    startDate: "Start date",
    raceDate: "Race date",
    goalLabel: "Goal label",
    goalPace: "Goal pace (mm:ss /km)",
    raceDateNote: "Changing the race date takes effect when you regenerate this plan.",
    appearance: "Appearance",
    language: "Language",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    data: "Data",
    dataIntro:
      "Everything is stored locally in your browser. Export all your plans to back up or to hand the schema to an agent.",
    exportJson: "Export JSON",
    copyJson: "Copy JSON",
    copied: "Copied",
    importFile: "Import file",
    pasteJson: "…or paste JSON",
    importPasted: "Import pasted JSON",
    aiTitle: "Edit your plan with AI",
    aiIntro:
      "Export your JSON, paste it to an AI chatbot with the prompt below, then import the result. The AI can freely reshuffle upcoming workouts, but the prompt keeps your race date fixed and your completed workouts untouched.",
    copyPrompt: "Copy prompt",
    aiPrompt: `Here is my marathon training plan as JSON.

Change I want: [describe your change here — e.g. "I'm at a festival from 2026-08-14 to 2026-08-16 and can't train; move, shorten or remove those workouts and adjust the surrounding days so the build still makes sense"].

The plan has an "offDays" list (vacations/trips with a note on whether I can train). Respect it: avoid scheduling hard or long sessions during those periods, and don't remove an off day unless I ask.

You MAY freely reschedule, add, remove or modify any PLANNED (not-yet-completed) future workout to make this work.

Each workout has PLANNED targets ("plannedDistanceKm", "plannedPace") and, once I've done it, LOGGED actuals ("actualDistanceKm", "actualPace", "durationMin" in minutes, optional "finishTime" as "HH:mm", and optional "weather" = {tempC, condition, ...}). Compare planned vs actual to judge how the training is actually going (e.g. consistently slower/shorter than planned, or hard sessions done in heat) and adapt upcoming workouts accordingly.

You MUST follow these rules:
- NEVER change the race date. Keep "raceDate" exactly the same and keep the marathon / race-day workout on its date — the marathon date is fixed.
- NEVER alter a completed workout: any workout with "completed": true must stay exactly as-is, including its "id", "completed", "actualDistanceKm", "actualPace", "durationMin", "finishTime" and "weather" (don't lose my logged progress).
- Keep the JSON structure valid (plans, weeks, workouts). If you move a workout to a different week, also move its id into that week's "workoutIds", and keep each workout's "date" inside its week's start/end range.
- Return the complete updated JSON only, nothing else.
- IMPORTANT — give me the result as a downloadable .json FILE so I can attach it directly. If you can't create a file, put the ENTIRE JSON in a single \`\`\`json code block, including the very first { and the very last } — never split it or leave characters out.

JSON (paste below, or attach the exported .json file):
[paste your exported JSON here]`,
    regenerateTitle: "Regenerate plan",
    regenerateDesc:
      "Rebuild “{{name}}” from scratch for its race date. This erases all logged progress and custom workouts in this plan.",
    regenerate: "Regenerate",
    regenerateConfirmTitle: "Regenerate this plan?",
    regenerateConfirmDesc:
      "This replaces “{{name}}” and removes all completed and custom workouts in it. This cannot be undone.",
    regenerateYes: "Yes, regenerate",
    importedOk: "Plans imported successfully.",
    importFailed:
      "Import failed — the JSON may have been copied incompletely. Copy the AI's whole response (including the first { and last }), or use the .json file with Import file.",
    planRegenerated: "Plan regenerated.",
    planDeleted: "Plan deleted.",
  },
  sync: {
    title: "Cloud sync",
    notConfigured:
      "Google Drive sync isn't configured for this deployment. Your data is saved locally in this browser.",
    connected: "Connected",
    reconnectNeeded: "Reconnect needed",
    reconnecting: "Reconnecting…",
    syncing: "Syncing…",
    lastSynced: "Last synced {{time}}",
    backingUp: "Backing up to your hidden Drive app folder.",
    reauthHint: "Sign-in expired — reconnect to resume syncing.",
    syncNow: "Sync now",
    reconnect: "Reconnect",
    disconnect: "Disconnect",
    connectBody:
      "Connect your Google account to back up your progress to Drive and sync it across devices. Without it, data stays local to this browser.",
    connect: "Connect Google Drive",
  },
  onboarding: {
    planTitle: "Welcome! 👋",
    planBody:
      "Let's get you to the start line. Want to build your training plan now?",
    createPlan: "Create my plan",
    lookAround: "Just look around",
    driveTitle: "Sync across devices?",
    driveBody:
      "Connect Google Drive to back up your progress and pick up your plan on any device.",
    connect: "Connect Google Drive",
    notNow: "Not now",
    weatherTitle: "Show weather?",
    weatherBody:
      "See the forecast in your calendar and capture the conditions for each run. Uses your device location.",
    enableWeather: "Enable weather",
  },
  weather: {
    title: "Weather",
    notConfigured:
      "Weather isn't configured for this deployment. Add an OpenWeather key to enable it.",
    enable: "Show weather",
    enableBody:
      "Use your location to record the weather conditions of each run you log. Toggle the calendar display from the calendar's legend.",
    inCalendar: "Show weather in calendar",
    locationDenied:
      "Location access was denied — allow it in your browser to use weather.",
    locationUnavailable: "Couldn't get your location. Try again.",
  },
  wizard: {
    title: "Create a plan",
    step: "Step {{n}} of {{total}}",
    back: "Back",
    next: "Next",
    stepRace: "Race",
    stepOffDays: "Off days",
    stepTraining: "Training",
    stepAi: "Generate with AI",
    // Step 1
    planName: "Plan name",
    planNamePlaceholder: "e.g. Berlin Marathon",
    raceName: "Race name",
    raceNamePlaceholder: "e.g. Marathon",
    raceDistance: "Race distance",
    distanceCustom: "Custom (km)",
    raceDate: "Race date",
    startDate: "When do you start this plan?",
    startDateHint: "The plan is built from this date — not today.",
    goalQ: "What's your goal?",
    goalFinish: "Just finish",
    goalTime: "Target time",
    goalPace: "Target pace",
    goalTimePlaceholder: "e.g. 3:45:00",
    goalPacePlaceholder: "e.g. 5:20 /km",
    // Step 2
    offDaysIntro:
      "Add vacations, trips or busy periods that will limit your training. The AI will plan around them.",
    calendarSoon: "Connect Google Calendar (coming soon)",
    // Step 3
    latestRuns: "Your latest runs",
    latestRunsHint:
      "Optional — gives the AI a sense of your current fitness. Add a few recent runs.",
    addRun: "Add run",
    runDistance: "Distance (km)",
    runTimePlaceholder: "Total time (e.g. 50:43)",
    runDate: "Date",
    daysPerWeek: "Training days per week",
    trainingDaysQ: "Which days do you want to train?",
    flexibleDays: "I'm flexible — no fixed days",
    planningModeQ: "How should workouts be scheduled?",
    planningExact: "Exact dates",
    planningExactDesc: "Each workout is pinned to a specific day.",
    planningFlexible: "Flexible periods",
    planningFlexibleDesc:
      "Each workout gets a window (e.g. Mon–Wed) and you pick the exact day.",
    targetQ: "Distance you want to run comfortably before the race",
    targetUnknown: "I don't know — let the AI decide",
    targetKm: "Target distance (km)",
    // Step 4
    aiIntro:
      "Your plan request is ready. Hand it to an AI chatbot to build the full schedule:",
    aiStep1: "1. Export the plan request (or copy it) below.",
    aiStep2: "2. Copy the prompt and paste it into your AI chatbot, attaching the exported file.",
    aiStep3: "3. The AI returns a plan as JSON — it may ask a few questions first.",
    aiStep4: "4. Paste or attach that JSON below and press Complete plan.",
    exportRequest: "Export request (JSON)",
    copyRequest: "Copy request",
    copyPrompt: "Copy prompt",
    copied: "Copied",
    importLabel: "Paste the AI's plan JSON",
    attachFile: "Attach file",
    completePlan: "Complete plan",
    created: "Plan created",
    completeError:
      "Couldn't read that as a plan — it may have been copied incompletely. Copy the AI's whole response (including the first { and last }), or attach the .json file.",
    aiPrompt: `You are building a running training plan for me. I'll attach a plan-request JSON describing my race and preferences. Read it, then output a plan in EXACTLY the JSON schema below so I can import it into my app.

What the attached plan-request fields mean:
- race.name: what to call the plan. race.raceName: the race's name.
- race.distanceKm: the race distance in kilometres.
- race.date: race day (YYYY-MM-DD).
- startDate: the date I'll begin this plan (YYYY-MM-DD). Build week 1 from this date — do NOT assume today's date.
- goal: my race goal — { type: "finish" | "time" | "pace", value }. "finish" = just complete it; "time" = target finish time (value); "pace" = target pace per km (value). Use it to set "goalPace"/"goalLabel" and the plan's intensity.
- offDays[]: periods I can't fully train — { start, end, title, note }. The "note" says how limited it is (e.g. no training / very limited / reduced).
- latestRuns[]: my recent runs — { distanceKm, durationMin (TOTAL time for the run, in minutes), pace (min/km, derived from distance + total time), date }. Use these to estimate my current fitness. If this is empty, ask me about my fitness.
- training.daysPerWeek: how many days per week I want to run.
- training.trainingDays: the weekdays I prefer to run (e.g. ["Monday","Wednesday"]). null means I'm flexible — choose sensible days yourself.
- training.flexibleDays: true if I have no fixed training days.
- training.planningMode: "exact" = pin each workout to a specific day; "flexible" = give each workout a window and I'll pick the exact day.
- training.targetDistanceKm: the longest SINGLE long run I want to comfortably reach before race day (NOT my weekly volume). null means you decide based on the race distance.

Output schema (return exactly this shape, nothing else):
{
  "plans": {
    "<planId>": {
      "id": "<planId>",
      "name": "<plan name>",
      "raceName": "<race name>",
      "raceDistanceKm": <number>,
      "raceDate": "YYYY-MM-DD",
      "goalPace": "mm:ss",            // per km
      "goalLabel": "<short goal>",
      "version": 1,
      "createdAt": "<ISO datetime>",
      "offDays": [ { "id": "...", "start": "YYYY-MM-DD", "end": "YYYY-MM-DD", "title": "...", "note": "..." } ],
      "weeks": [ { "weekNumber": 1, "startDate": "YYYY-MM-DD(Monday)", "endDate": "YYYY-MM-DD(Sunday)", "phase": "base|build|peak|taper|race|reduced", "label": "optional", "workoutIds": ["..."] } ],
      "workouts": {
        "<workoutId>": {
          "id": "<workoutId>", "date": "YYYY-MM-DD", "type": "easy|tempo|interval|long|recovery",
          "title": "...", "weekNumber": 1, "plannedDistanceKm": <number>, "plannedPace": "mm:ss",
          "completed": false
          // For flexible scheduling also add: "flexible": true, "windowStart": "YYYY-MM-DD", "windowEnd": "YYYY-MM-DD"
          // New plans set "completed": false. Once I log a run the app fills in actuals:
          // "actualDistanceKm", "actualPace" ("mm:ss"), "durationMin" (number), optional
          // "finishTime" ("HH:mm") and optional "weather" {tempC, condition, ...} — leave these out for new plans.
        }
      }
    }
  },
  "activePlanId": "<planId>"
}

Rules:
- Weeks run Monday→Sunday. Week 1 starts from "startDate"; the final week's long run is the race on raceDate.
- Schedule workouts on my preferred training days; if I said I'm flexible, choose sensible days.
- If planningMode is "flexible": set "flexible": true with "windowStart"/"windowEnd" on each workout, and keep its "date" inside that window.
- Respect "offDays": avoid hard/long sessions in those periods (none/limited/reduced per the note).
- Build long runs progressively to my target distance, then taper into race week.
- Use my latest runs to estimate fitness and paces. Set every workout "completed": false.
- If my goal time/pace isn't provided, infer a sensible "goalPace"/"goalLabel" from my latest runs and the race distance (or ask me first).
- Each workout's id must appear in its week's "workoutIds", and its "date" must fall within that week.
- Give me the result as a downloadable .json FILE so I can attach it directly. If you can't create a file, put the ENTIRE JSON in a single \`\`\`json code block, including the very first { and the very last } — never split it or leave characters out.
- Ask me any clarifying questions first, then return ONLY the JSON.`,
  },
};

export type Dict = typeof en;
