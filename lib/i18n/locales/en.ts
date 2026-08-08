export const en = {
  common: {
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    add: "Add",
    appName: "RacePilot",
    appTagline: "Training tracker",
    createPlan: "Create a plan",
    decrease: "Decrease",
    increase: "Increase",
    now: "Now",
    gotIt: "Got it",
    example: "Example",
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
    goalLine: "{{goal}} · {{pace}}",
    goalLineBackyard: "{{goal}} · {{loop}} loop",
    throughBlock: "You're <b>{{pct}}%</b> through your training block.",
    planComplete: "Plan complete",
    workoutsRatio: "{{done}}/{{total}} workouts",
    totalDistance: "Total distance",
    longest: "longest {{distance}}",
    thisWeek: "This week",
    ofPlanned: "of {{distance}} planned",
    thisMonth: "This month",
    doneRatio: "{{done}}/{{total}} done",
    upcoming: "Upcoming workouts",
    viewPlan: "View plan",
    caughtUp: "No upcoming workouts - you're all caught up! 🎉",
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
    desc: "We pre-filled your planned target - adjust it to what you actually ran.",
    confirm: "Log & complete",
    planned: "Planned: {{distance}} · {{pace}}",
  },
  plan: {
    title: "Training plan",
    subtitle: "Your training block, grouped by week.",
    addWorkout: "Add workout",
    week: "Week {{n}}",
    thisWeek: "this week",
    weekMeta: "{{range}} · {{distance}} · {{done}}/{{total}} done",
    restWeek: "Rest week - no scheduled runs.",
    pickDay: "Pick a day",
    finishedTitle: "Plan complete 🏁",
    finishedBody:
      "{{race}} is behind you: {{runs}} runs, {{distance}} logged. Start your next plan and bring this training along as context.",
    createNext: "Create next plan",
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
    distance: "Distance ({{unit}})",
    paceLabel: "Pace (mm:ss {{unit}})",
    durationMin: "Duration (mm:ss)",
    computeHint: "Fill in distance + either duration or pace - the third is calculated automatically.",
    notes: "Notes",
    notesPlaceholder: "How did it feel?",
    completed: "Completed",
    flexible: "Flexible (complete any day in a window)",
    windowStart: "Window start",
    windowEnd: "Window end",
    startTime: "Started at (optional)",
  },
  calendar: {
    title: "Calendar",
    subtitle: "Your training month at a glance.",
    today: "Today",
    prev: "Previous",
    next: "Next",
    viewMonth: "Month",
    viewWeek: "Week",
    viewDay: "Day",
    viewAgenda: "Agenda",
    agendaEmpty: "No workouts scheduled in this plan yet.",
    weather: "Weather",
    offDayLabel: "Off day",
    legend:
      "Tap a day to see or edit its workouts. Faded dots are planned; solid dots are completed.",
    flexLegend:
      "Vacations and flexible workouts show as bars spanning their days. The underline on a flexible bar marks the day it's currently planned - tap the bar to change it.",
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
    ofPlanned: "of {{distance}} planned",
    longestRun: "Longest run",
    avgPace: "Avg pace",
    runsCompleted: "Runs completed",
    pctOfPlan: "{{pct}}% of plan",
    weeklyMileage: "Weekly mileage",
    historyTitle: "Mileage history",
    historySub:
      "Every logged run by calendar week - including runs from before this plan and from your other plans.",
    splitPaces: "Split paces",
    splitPacesSub:
      "{{title}} · {{date}} - fastest {{fastest}}, slowest {{slowest}}.",
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
    raceDistance: "Race distance ({{unit}})",
    startDate: "Start date",
    raceDate: "Race date",
    goalLabel: "Goal label",
    goalPace: "Goal pace (mm:ss {{unit}})",
    raceDateNote: "Changing the race date updates race details only - use the AI plan tools to reshape the schedule.",
    appearance: "Display & units",
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
    aiPrompt: `Here is my training plan as JSON.

Change I want: [describe your change here - e.g. "I'm at a festival from 2026-08-14 to 2026-08-16 and can't train; move, shorten or remove those workouts and adjust the surrounding days so the build still makes sense"].

The plan has an "offDays" list (vacations/trips with a note on whether I can train). Respect it: avoid scheduling hard or long sessions during those periods, and don't remove an off day unless I ask.

You MAY freely reschedule, add, remove or modify any PLANNED (not-yet-completed) future workout to make this work.

Each workout has PLANNED targets ("plannedDistanceKm", "plannedPace") and, once I've done it, LOGGED actuals ("actualDistanceKm", "actualPace", "durationMin" in minutes, optional "startTime" as "HH:mm", optional "weather" = {tempC, condition, ...}, and optional "splits" = per-kilometer pacing [{km, pace "mm:ss", elevM}]). Use "splits" to see how the run was paced (even splits, positive/negative split, a blow-up late on, hills via elevM). Compare planned vs actual to judge how the training is actually going (e.g. consistently slower/shorter than planned, or hard sessions done in heat) and adapt upcoming workouts accordingly.

You MUST follow these rules:
- NEVER change the race date. Keep "raceDate" exactly the same and keep the race-day workout on its date. The race date is fixed.
- NEVER alter a completed workout: any workout with "completed": true must stay exactly as-is, including its "id", "completed", "actualDistanceKm", "actualPace", "durationMin", "startTime", "weather" and "splits" (don't lose my logged progress).
- Keep the JSON structure valid (plans, weeks, workouts). If you move a workout to a different week, also move its id into that week's "workoutIds", and keep each workout's "date" inside its week's start/end range.
- Return the complete updated JSON only, nothing else.
- IMPORTANT - give me the result as a downloadable .json FILE so I can attach it directly. If you can't create a file, put the ENTIRE JSON in a single \`\`\`json code block, including the very first { and the very last } - never split it or leave characters out.

JSON (paste below, or attach the exported .json file):
[paste your exported JSON here]`,
    importedOk: "Plans imported successfully.",
    importFailed:
      "Import failed - the JSON may have been copied incompletely. Copy the AI's whole response (including the first { and last }), or use the .json file with Import file.",
    planDeleted: "Plan deleted.",
    support: "Support",
    supportDesc:
      "This app is free and runs entirely in your browser. If it helps your training, you can leave a small tip.",
    buyMeAWater: "Buy me a water",
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
    reauthHint: "Sign-in expired - reconnect to resume syncing.",
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
    splitsTitle: "Scan your splits?",
    splitsBody:
      "Upload your Strava splits screenshot when logging a run and the pace for every kilometer is read from it automatically. It runs on your device, so the image is never uploaded.",
    enableSplits: "Enable scanning",
  },
  nextPlan: {
    title: "Race done! 🏁",
    body: "Nice work on {{name}}. Want to plan your next race and take this block's training along as context?",
    create: "Plan my next race",
  },
  weather: {
    title: "Weather",
    notConfigured:
      "Weather isn't configured for this deployment. Add an OpenWeather key to enable it.",
    enable: "Show weather",
    enableBody:
      "Use your location to record the weather conditions of each run you log. Toggle the calendar display from the calendar's legend.",
    locationDenied:
      "Location access was denied - allow it in your browser to use weather.",
    locationUnavailable: "Couldn't get your location. Try again.",
  },
  install: {
    title: "Install the app",
    body: "Add RacePilot to your home screen so it opens like a normal app, full screen and without browser chrome. It also keeps working without a signal.",
    action: "Install app",
    iosStep1: "Tap the Share button in Safari.",
    iosStep2: "Scroll down and choose \"Add to Home Screen\".",
    iosStep3: "Tap \"Add\" - RacePilot then opens like a normal app.",
  },
  units: {
    storedNote:
      "Your training is always stored the same way, so this only changes what you see.",
    country: "Country",
    countryUnset: "Not set",
    measure: "Distance and pace",
    metric: "Kilometers",
    imperial: "Miles",
    followsCountry: "Following your country. Pick one above to override it.",
    explicit: "Set by you. Your country would default to {{country}}.",
  },
  athlete: {
    runner: "Road runner",
    runnerDesc: "5K to marathon",
    trail: "Trail runner",
    trailDesc: "Hills and technical terrain",
    ultra: "Ultra runner",
    ultraDesc: "Beyond the marathon",
    triathlete: "Triathlete",
    triathleteDesc: "Swim, bike, run",
    cyclist: "Cyclist",
    cyclistDesc: "Road, gravel or track",
    swimmer: "Swimmer",
    swimmerDesc: "Pool or open water",
    promptTitle: "What do you train for?",
    promptBody:
      "Pick everything that applies and RacePilot will only show you what's relevant. You can change this any time in Settings.",
    cardTitle: "Your sports",
    cardBody: "What you train for. Shapes which race formats and features you see.",
    none: "Not set - everything is shown.",
  },
  examples: {
    marathon: "Marathon plan",
    marathonDesc: "A real 16-week road marathon block, splits and all.",
    trail: "Trail 50K plan",
    trailDesc: "Twelve weeks of hills and long days on the trails.",
    ultra: "100 km ultra plan",
    ultraDesc: "Sixteen weeks built on back-to-back long runs.",
    backyard: "Backyard ultra plan",
    backyardDesc: "Fourteen weeks of loop practice for a 20-yard goal.",
    addTitle: "Try an example plan",
    addBody:
      "Example plans are someone else's training, there to explore. They're never used as context when an AI writes yours.",
    showAll: "Show all sports",
    added: "Added",
    comingSoon:
      "No example plan for {{sports}} yet. Those sports arrive once RacePilot can plan bike and swim sessions, which is the next big step.",
  },
  welcome: {
    continue: "Continue",
    back: "Back",
    privacyTitle: "Free, and yours",
    privacySubtitle:
      "Before anything else, here's what happens to your training data.",
    tourTitle: "What you get",
    tourSubtitle: "Four things RacePilot does well.",
    profileTitle: "What do you train for?",
    profileSubtitle: "So we only show you what's relevant.",
    featuresTitle: "Optional extras",
    featuresSubtitle: "All off by default. Turn on what you want.",
    finishTitle: "Ready when you are",
    finishSubtitle: "Build your own plan, or look around with an example first.",
    profileHint:
      "Optional - skip it and everything stays visible. You can change this in Settings.",
    exploreWith: "Look around with the {{plan}}",
    privacy: {
      free: "Completely free",
      freeBody: "No subscription, no trial, no ads.",
      local: "Stored in your browser",
      localBody: "There's no account and no database. Your training lives on this device.",
      drive: "Your Drive, if you want it",
      driveBody: "Turn on sync and the file goes to your own Google Drive. We never hold a copy.",
      noTracking: "No trackers",
      noTrackingBody: "No analytics, no advertising, nothing to consent to.",
      readMore: "Read the full privacy page",
    },
    tour: {
      plan: "A plan around your week",
      planBody: "Pick your training days and target. Build it yourself, or have an AI write it and import the result.",
      calendar: "A calendar that fits a phone",
      calendarBody: "Month, week, day, or a scrolling agenda of just your training days.",
      log: "Log a run in seconds",
      logBody: "Distance, duration and pace solve for each other - and your splits can be read straight off a screenshot.",
      stats: "Numbers that mean something",
      statsBody: "Weekly volume, long-run progression and pace trends for the block you're in.",
    },
    finish: {
      create: "Create my plan",
      createBody: "Answer a few questions and get a plan built around your week.",
      explore: "Look around first",
      exploreBody: "Load an example plan and click through a real training block.",
    },
  },
  features: {
    title: "Features",
    subtitle: "Optional extras you can switch on.",
  },
  splitScanner: {
    title: "Split scanner",
    enable: "Scan splits from a screenshot",
    enableBody:
      "When logging a run, upload your Strava splits screenshot and the per-kilometer paces are read from it automatically. It runs on your device, so the image is never uploaded and is discarded after scanning.",
    scanButton: "Scan screenshot",
    scanning: "Scanning…",
    scanned_one: "Scanned {{count}} split",
    scanned_other: "Scanned {{count}} splits",
    scanFailed:
      "Couldn't read splits from that image. Make sure the Splits table is visible in the screenshot.",
    splitsTitle: "Splits",
    clear: "Clear splits",
    helpTitle: "Which screenshot?",
    helpBody:
      "In Strava, open a run and screenshot the “Splits” table: the part listing each kilometer and its pace.",
    exampleCaption: "Example of what to capture",
    tip1: "Make sure the whole Splits table is visible, including the last partial kilometer.",
    tip2: "Extra content around it (the pace chart, best efforts) is fine, because it gets ignored.",
    tip3: "Works in any language, and in light or dark mode.",
    // Column labels as Strava's English app shows them, so the example matches.
    mockHeading: "Splits",
    mockKm: "Km",
    mockPace: "Pace",
    mockElev: "Elev",
  },
  wizard: {
    title: "Create a plan",
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
    raceDistance: "Race distance ({{unit}})",
    distanceCustom: "Custom (km)",
    raceDate: "Race date",
    startDate: "When do you start this plan?",
    startDateHint: "The plan is built from this date - not today.",
    goalQ: "What's your goal?",
    goalFinish: "Just finish",
    goalTime: "Target time",
    goalPace: "Target pace",
    goalTimePlaceholder: "e.g. 3:45:00",
    goalPacePlaceholder: "e.g. 5:20 {{unit}}",
    // Step 2
    offDaysIntro:
      "Add vacations, trips or busy periods that will limit your training. The AI will plan around them.",
    calendarSoon: "Connect Google Calendar (coming soon)",
    // Step 3
    raceTypeQ: "What kind of race is it?",
    raceTypeStandard: "Standard race",
    raceTypeStandardDesc: "A set distance you run once, like a 10K or marathon.",
    raceTypeBackyard: "Backyard ultra",
    raceTypeBackyardDesc:
      "A loop repeated every hour, on the hour, until one runner is left.",
    loopKm: "Loop distance ({{unit}})",
    targetYards: "Target yards",
    backyardDerived: "{{hours}} yards = {{hours}} hours · {{distance}} total",
    previousPlans: "Previous plans as context",
    previousPlansHint:
      "Attach earlier training so the AI can see how you actually progressed. Saves entering recent runs by hand.",
    planFinished: "finished",
    planInProgress: "in progress",
    planRuns: "{{runs}} runs · {{distance}} logged",
    showAllPlans: "Show all {{count}} plans",
    showLess: "Show less",
    latestRuns: "Your latest runs",
    latestRunsHint:
      "Optional - gives the AI a sense of your current fitness. Add a few recent runs.",
    addRun: "Add run",
    runDistance: "Distance ({{unit}})",
    runTimePlaceholder: "Total time (e.g. 50:43)",
    daysPerWeek: "Training days per week",
    trainingDaysQ: "Which days do you want to train?",
    flexibleDays: "I'm flexible - no fixed days",
    planningModeQ: "How should workouts be scheduled?",
    planningExact: "Exact dates",
    planningExactDesc: "Each workout is pinned to a specific day.",
    planningFlexible: "Flexible periods",
    planningFlexibleDesc:
      "Each workout gets a window (e.g. Mon–Wed) and you pick the exact day.",
    targetQ: "Distance you want to run comfortably before the race",
    targetUnknown: "I don't know - let the AI decide",
    targetKm: "Target distance (km)",
    // Step 4
    aiIntro:
      "Your plan request is ready. Hand it to an AI chatbot to build the full schedule:",
    aiStep1: "1. Export the plan request (or copy it) below.",
    aiStep2: "2. Copy the prompt and paste it into your AI chatbot, attaching the exported file.",
    aiStep3: "3. The AI returns a plan as JSON - it may ask a few questions first.",
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
      "Couldn't read that as a plan - it may have been copied incompletely. Copy the AI's whole response (including the first { and last }), or attach the .json file.",
    aiPrompt: `You are building a running training plan for me. I'll attach a plan-request JSON describing my race and preferences. Read it, then output a plan in EXACTLY the JSON schema below so I can import it into my app.

What the attached plan-request fields mean:
- race.name: what to call the plan. race.raceName: the race's name.
- race.distanceKm: the race distance in kilometers.
- athlete: where I am and which units I read. EVERY number in this request is metric (km, min/km) regardless of athlete.units - that is the wire format. If athlete.units is "imperial", write the plan's workout TITLES and NOTES in miles and min/mile (1 mi = 1.609344 km), but still emit "plannedDistanceKm" and "plannedPace" as kilometers and min/km in the JSON. Use athlete.country for seasons and typical weather.
- race.date: race day (YYYY-MM-DD).
- startDate: the date I'll begin this plan (YYYY-MM-DD). Build week 1 from this date - do NOT assume today's date.
- race.type: "standard" (one continuous race over a set distance) or "backyard" (see below).
- goal: my race goal - { type: "finish" | "time" | "pace" | "yards", value }. "finish" = just complete it; "time" = target finish time (value); "pace" = target pace per km (value); "yards" = target number of backyard yards (value). Use it to set "goalPace"/"goalLabel" and the plan's intensity.

If race.type is "backyard", this is a BACKYARD ULTRA and the usual fixed-distance race logic does NOT apply:
- The format: I run a fixed loop (race.loopKm, usually 6.706 km) every hour, ON THE HOUR. Finish the loop faster and the remaining time is my rest. Anyone who fails to start or finish a loop is out; the last runner standing wins. One "yard" = one loop = one hour, so race.targetYards is both my distance goal and my duration goal (e.g. 24 yards = 24 hours = about 161 km).
- Train time on feet, not speed. There is no finish time and no single peak long run to taper from.
- Build toward my target with: long back-to-back runs on consecutive days; "mock backyards" (several loops started on the hour, progressively more yards); at least some running at night and on tired legs; and deliberate practice at eating, drinking and changing kit inside the short rest between loops.
- "goalPace" should be an easy, repeatable loop pace that still banks useful rest each hour (finishing a loop in roughly 40-50 minutes is typical), NOT a race pace. "goalLabel" should read like "24 yards".
- Taper into race week, but the peak sessions are duration and repeated loops rather than one long distance.
- offDays[]: periods I can't fully train - { start, end, title, note }. The "note" says how limited it is (e.g. no training / very limited / reduced).
- latestRuns[]: my recent runs - { distanceKm, durationMin (TOTAL time for the run, in minutes), pace (min/km, derived from distance + total time), date }. Use these to estimate my current fitness. If this is empty, ask me about my fitness.
- previousPlans[]: my earlier training blocks, as READ-ONLY history. Each has { name, raceName, raceDistanceKm, raceDate, startDate, goalPace, goalLabel, weeks, summary, weeklyMileage[], completedRuns[] }.
  - summary: { completionPct (how much of that plan I actually did), completedRuns, totalKm, plannedTotalKm, longestRunKm, averagePace, peakWeekKm }.
  - weeklyMileage[]: { week, plannedKm, actualKm } - planned vs actual per week, so you can see adherence and how volume ramped.
  - completedRuns[]: only the runs I actually logged - { date, type, title, plannedDistanceKm, plannedPace, distanceKm, pace, durationMin, startTime, tempC, condition, splits, elevM, notes }. "splits" is per-kilometer pace where the FIRST entry is km 1, the second km 2, and so on; "elevM" (when present) is the matching elevation change per kilometer.
  Use this to judge my real training load, how consistently I hit planned paces, how my long runs progressed, and a realistic goal for the new race.
- training.daysPerWeek: how many days per week I want to run.
- training.trainingDays: the weekdays I prefer to run (e.g. ["Monday","Wednesday"]). null means I'm flexible - choose sensible days yourself.
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
          // "startTime" ("HH:mm"), optional "weather" {tempC, condition, ...} and optional
          // "splits" [{km, pace, elevM}] - leave these out for new plans.
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
- "previousPlans" is history to learn from, NOT a template. Return ONLY the new plan in "plans" - never copy a previous plan, its weeks or its workouts into your output. Every id you emit must be brand new and unique.
- Give me the result as a downloadable .json FILE so I can attach it directly. If you can't create a file, put the ENTIRE JSON in a single \`\`\`json code block, including the very first { and the very last } - never split it or leave characters out.
- Ask me any clarifying questions first, then return ONLY the JSON.`,
  },
};

export type Dict = typeof en;
