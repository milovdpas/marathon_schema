import type { Dict } from "./en";

export const nl: Dict = {
  common: {
    km: "km",
    perKm: "/km",
    cancel: "Annuleren",
    save: "Opslaan",
    delete: "Verwijderen",
    add: "Toevoegen",
    edit: "Bewerken",
    dash: "—",
    appName: "Marathon",
    appTagline: "Trainingstracker",
    createPlan: "Maak een plan",
  },
  nav: {
    dashboard: "Dashboard",
    plan: "Plan",
    calendar: "Kalender",
    offDays: "Vrije dagen",
    stats: "Statistieken",
    settings: "Instellingen",
    theme: "Thema",
  },
  workoutType: {
    easy: "Rustige duurloop",
    tempo: "Tempo",
    interval: "Interval",
    long: "Lange duurloop",
    recovery: "Herstel",
  },
  phase: {
    base: "Basis",
    build: "Opbouw",
    peak: "Piek",
    taper: "Afbouw",
    race: "Wedstrijd",
    reduced: "Verminderd",
  },
  dashboard: {
    title: "Dashboard",
    subtitle: "Op weg naar de startstreep.",
    daysToGo: "dagen te gaan",
    goalLine: "{{goal}} · {{pace}}/km",
    throughBlock: "Je bent <b>{{pct}}%</b> door je trainingsblok.",
    planComplete: "Plan voltooid",
    workoutsRatio: "{{done}}/{{total}} trainingen",
    totalDistance: "Totale afstand",
    longest: "langste {{km}} km",
    thisWeek: "Deze week",
    ofPlanned: "van {{km}} km gepland",
    thisMonth: "Deze maand",
    doneRatio: "{{done}}/{{total}} gedaan",
    upcoming: "Aankomende trainingen",
    viewPlan: "Bekijk plan",
    caughtUp: "Geen aankomende trainingen — je bent helemaal bij! 🎉",
    recent: "Onlangs voltooid",
    noPlanTitle: "Nog geen plan",
    noPlanBody: "Maak je eerste trainingsplan om te beginnen.",
  },
  workoutRow: {
    custom: "eigen",
    flexible: "Flexibel",
  },
  plan: {
    title: "Marathonplan",
    subtitle: "Je trainingsblok, gegroepeerd per week.",
    addWorkout: "Training toevoegen",
    week: "Week {{n}}",
    thisWeek: "deze week",
    weekMeta: "{{range}} · {{km}} km · {{done}}/{{total}} gedaan",
    restWeek: "Rustweek — geen geplande trainingen.",
    pickDay: "Kies een dag",
  },
  workoutForm: {
    editTitle: "Training bewerken",
    addTitle: "Training toevoegen",
    editDesc: "Pas geplande doelen aan of leg vast wat je echt liep.",
    addDesc: "Voeg een eigen training toe aan je plan.",
    modePlan: "Inplannen",
    modeLog: "Loggen",
    date: "Datum",
    type: "Type",
    titleLabel: "Titel",
    titlePlaceholder: "bijv. 6×800m intervallen",
    planned: "Gepland",
    distanceKm: "Afstand (km)",
    paceLabel: "Tempo (mm:ss)",
    actual: "Werkelijk",
    durationMin: "Duur (mm:ss)",
    paceAuto: "automatisch uit afstand + tijd",
    willCompute: "Wordt berekend op {{pace}}/km",
    computeHint: "Vul afstand + duur óf tempo in — de derde wordt automatisch berekend.",
    notes: "Notities",
    notesPlaceholder: "Hoe voelde het?",
    completed: "Voltooid",
    flexible: "Flexibel (voltooi op elke dag binnen een periode)",
    windowStart: "Begin periode",
    windowEnd: "Einde periode",
  },
  calendar: {
    title: "Kalender",
    subtitle: "Je trainingsmaand in één oogopslag.",
    today: "Vandaag",
    prevMonth: "Vorige maand",
    nextMonth: "Volgende maand",
    legend:
      "Tik op een dag om de trainingen te bekijken of bewerken. Vage stippen zijn gepland; volle stippen zijn voltooid.",
    flexLegend:
      "Vakanties en flexibele trainingen verschijnen als balken over hun dagen. De onderstreping op een flexibele balk markeert de dag waarop hij nu gepland staat — tik op de balk om dit te wijzigen.",
    workoutsScheduled_one: "{{count}} training gepland",
    workoutsScheduled_other: "{{count}} trainingen gepland",
    nothingScheduled: "Niets gepland deze dag.",
    addWorkout: "Training toevoegen",
  },
  offDays: {
    title: "Vrije dagen",
    subtitle: "Periodes die je training kunnen beperken.",
    intro:
      "Vakanties, reizen en andere periodes die je training beperken. Deze verschijnen op je kalender en gaan als context mee met je geëxporteerde plan.",
    emptyTitle: "Nog geen vrije dagen",
    emptyBody: "Voeg een vakantie of reis toe zodat er rekening mee wordt gehouden.",
    addTitle: "Vrije dag toevoegen",
    editTitle: "Vrije dag bewerken",
    dialogDesc: "Beschrijf de periode en of er getraind kan worden.",
    titleLabel: "Titel",
    titlePlaceholder: "bijv. Vakantie naar Gent",
    from: "Van",
    to: "Tot",
    note: "Notitie (trainingsmogelijkheid)",
    notePlaceholder: "bijv. Waarschijnlijk geen training / zeer beperkt hardlopen",
  },
  stats: {
    title: "Statistieken",
    subtitle: "Je training, in cijfers.",
    totalDistance: "Totale afstand",
    ofPlanned: "van {{km}} km gepland",
    longestRun: "Langste loop",
    avgPace: "Gem. tempo",
    runsCompleted: "Voltooide lopen",
    pctOfPlan: "{{pct}}% van plan",
    weeklyMileage: "Wekelijkse kilometers",
    historyTitle: "Kilometergeschiedenis",
    historySub:
      "Elke vastgelegde loop per kalenderweek — inclusief lopen van vóór dit plan en uit je andere plannen.",
    longRunProgression: "Opbouw lange duurloop",
    longRunHint: "Opbouw naar je piek, daarna afbouwen richting wedstrijddag.",
    planned: "Gepland",
    actual: "Werkelijk",
  },
  settings: {
    title: "Instellingen",
    subtitle: "Voorkeuren, thema en je gegevens.",
    plans: "Plannen",
    activePlan: "Actief plan",
    addPlan: "Plan toevoegen",
    deleteThisPlan: "Dit plan verwijderen",
    deletePlanTitle: "Plan verwijderen?",
    deletePlanDesc:
      "Dit verwijdert “{{name}}” en de bijbehorende voortgang permanent. Dit kan niet ongedaan worden gemaakt.",
    raceDetails: "Wedstrijdgegevens",
    trainingPrefs: "Trainingsvoorkeuren",
    planName: "Plannaam",
    raceName: "Wedstrijdnaam",
    raceDistance: "Wedstrijdafstand (km)",
    startDate: "Startdatum",
    raceDate: "Wedstrijddatum",
    goalLabel: "Doel-label",
    goalPace: "Doeltempo (mm:ss /km)",
    raceDateNote:
      "Het wijzigen van de wedstrijddatum gaat in wanneer je dit plan opnieuw genereert.",
    appearance: "Weergave",
    language: "Taal",
    themeLight: "Licht",
    themeDark: "Donker",
    themeSystem: "Systeem",
    data: "Gegevens",
    dataIntro:
      "Alles wordt lokaal in je browser opgeslagen. Exporteer al je plannen als back-up of om het schema aan een AI te geven.",
    exportJson: "JSON exporteren",
    copyJson: "JSON kopiëren",
    copied: "Gekopieerd",
    importFile: "Bestand importeren",
    pasteJson: "…of plak JSON",
    importPasted: "Geplakte JSON importeren",
    aiTitle: "Je plan aanpassen met AI",
    aiIntro:
      "Exporteer je JSON, plak het in een AI-chatbot met de prompt hieronder en importeer het resultaat. De AI mag aankomende trainingen vrij verschuiven, maar de prompt houdt je wedstrijddatum vast en je voltooide trainingen onaangeroerd.",
    copyPrompt: "Prompt kopiëren",
    aiPrompt: `Hier is mijn marathon-trainingsplan als JSON.

Gewenste wijziging: [beschrijf hier je wijziging — bijv. "Ik ben op een festival van 2026-08-14 tot 2026-08-16 en kan niet trainen; verplaats, verkort of verwijder die trainingen en pas de omliggende dagen aan zodat de opbouw logisch blijft"].

Het plan heeft een "offDays"-lijst (vakanties/reizen met een notitie of ik kan trainen). Respecteer deze: plan geen zware of lange trainingen tijdens die periodes, en verwijder een vrije dag niet tenzij ik erom vraag.

Je MAG elke GEPLANDE (nog niet voltooide) toekomstige training vrij verplaatsen, toevoegen, verwijderen of aanpassen om dit voor elkaar te krijgen.

Je MOET je aan deze regels houden:
- WIJZIG NOOIT de wedstrijddatum. Houd "raceDate" exact hetzelfde en houd de marathon / wedstrijddag-training op zijn datum — de marathondatum staat vast.
- WIJZIG NOOIT een voltooide training: elke training met "completed": true moet exact zo blijven, inclusief "id", "completed", "actualDistanceKm", "actualPace" en "durationMin" (zodat ik mijn vastgelegde voortgang niet verlies).
- Houd de JSON-structuur geldig (plans, weeks, workouts). Als je een training naar een andere week verplaatst, verplaats dan ook zijn id naar de "workoutIds" van die week, en houd de "date" van elke training binnen het start/eind-bereik van zijn week.
- Geef alleen de volledige bijgewerkte JSON terug, niets anders.

JSON (plak hieronder, of voeg het geëxporteerde .json-bestand toe):
[plak hier je geëxporteerde JSON]`,
    regenerateTitle: "Plan opnieuw genereren",
    regenerateDesc:
      "Bouw “{{name}}” opnieuw op voor de wedstrijddatum. Dit wist alle vastgelegde voortgang en eigen trainingen in dit plan.",
    regenerate: "Opnieuw genereren",
    regenerateConfirmTitle: "Dit plan opnieuw genereren?",
    regenerateConfirmDesc:
      "Dit vervangt “{{name}}” en verwijdert alle voltooide en eigen trainingen erin. Dit kan niet ongedaan worden gemaakt.",
    regenerateYes: "Ja, opnieuw genereren",
    importedOk: "Plannen succesvol geïmporteerd.",
    importFailed: "Importeren mislukt.",
    planRegenerated: "Plan opnieuw gegenereerd.",
    planDeleted: "Plan verwijderd.",
  },
  sync: {
    title: "Cloudsynchronisatie",
    notConfigured:
      "Google Drive-synchronisatie is niet geconfigureerd voor deze omgeving. Je gegevens worden lokaal in deze browser opgeslagen.",
    connected: "Verbonden",
    reconnectNeeded: "Opnieuw verbinden nodig",
    reconnecting: "Opnieuw verbinden…",
    syncing: "Synchroniseren…",
    lastSynced: "Laatst gesynchroniseerd {{time}}",
    backingUp: "Back-up naar je verborgen Drive-appmap.",
    reauthHint: "Aanmelding verlopen — verbind opnieuw om te blijven synchroniseren.",
    syncNow: "Nu synchroniseren",
    reconnect: "Opnieuw verbinden",
    disconnect: "Verbinding verbreken",
    connectBody:
      "Verbind je Google-account om je voortgang naar Drive te back-uppen en te synchroniseren tussen apparaten. Zonder dit blijven gegevens lokaal in deze browser.",
    connect: "Verbind Google Drive",
  },
  onboarding: {
    planTitle: "Welkom! 👋",
    planBody:
      "Op naar de startstreep. Wil je nu je trainingsplan opbouwen?",
    createPlan: "Maak mijn plan",
    lookAround: "Even rondkijken",
    driveTitle: "Synchroniseren tussen apparaten?",
    driveBody:
      "Verbind Google Drive om je voortgang te back-uppen en je plan op elk apparaat te zien.",
    connect: "Verbind Google Drive",
    notNow: "Niet nu",
  },
  wizard: {
    title: "Een plan maken",
    step: "Stap {{n}} van {{total}}",
    back: "Terug",
    next: "Volgende",
    stepRace: "Wedstrijd",
    stepOffDays: "Vrije dagen",
    stepTraining: "Training",
    stepAi: "Genereren met AI",
    // Stap 1
    planName: "Plannaam",
    planNamePlaceholder: "bijv. Marathon van Berlijn",
    raceName: "Wedstrijdnaam",
    raceNamePlaceholder: "bijv. Marathon",
    raceDistance: "Wedstrijdafstand",
    distanceCustom: "Aangepast (km)",
    raceDate: "Wedstrijddatum",
    startDate: "Wanneer start je dit plan?",
    startDateHint: "Het plan wordt vanaf deze datum opgebouwd — niet vanaf vandaag.",
    goalQ: "Wat is je doel?",
    goalFinish: "Gewoon uitlopen",
    goalTime: "Streeftijd",
    goalPace: "Streeftempo",
    goalTimePlaceholder: "bijv. 3:45:00",
    goalPacePlaceholder: "bijv. 5:20 /km",
    // Stap 2
    offDaysIntro:
      "Voeg vakanties, reizen of drukke periodes toe die je training beperken. De AI plant eromheen.",
    calendarSoon: "Verbind Google Agenda (binnenkort)",
    // Stap 3
    latestRuns: "Je laatste lopen",
    latestRunsHint:
      "Optioneel — geeft de AI een idee van je huidige conditie. Voeg een paar recente lopen toe.",
    addRun: "Loop toevoegen",
    runDistance: "Afstand (km)",
    runTimePlaceholder: "Totale tijd (bijv. 50:43)",
    runDate: "Datum",
    daysPerWeek: "Trainingsdagen per week",
    trainingDaysQ: "Op welke dagen wil je trainen?",
    flexibleDays: "Ik ben flexibel — geen vaste dagen",
    planningModeQ: "Hoe moeten trainingen worden ingepland?",
    planningExact: "Exacte datums",
    planningExactDesc: "Elke training staat vast op een specifieke dag.",
    planningFlexible: "Flexibele periodes",
    planningFlexibleDesc:
      "Elke training krijgt een periode (bijv. ma–wo) en jij kiest de exacte dag.",
    targetQ: "Afstand die je comfortabel wilt kunnen lopen vóór de wedstrijd",
    targetUnknown: "Ik weet het niet — laat de AI beslissen",
    targetKm: "Doelafstand (km)",
    // Stap 4
    aiIntro:
      "Je planaanvraag is klaar. Geef het aan een AI-chatbot om het volledige schema te bouwen:",
    aiStep1: "1. Exporteer de planaanvraag (of kopieer het) hieronder.",
    aiStep2: "2. Kopieer de prompt en plak het in je AI-chatbot, met het geëxporteerde bestand erbij.",
    aiStep3: "3. De AI geeft een plan terug als JSON — mogelijk stelt het eerst een paar vragen.",
    aiStep4: "4. Plak of voeg die JSON hieronder toe en druk op Plan voltooien.",
    exportRequest: "Aanvraag exporteren (JSON)",
    copyRequest: "Aanvraag kopiëren",
    copyPrompt: "Prompt kopiëren",
    copied: "Gekopieerd",
    importLabel: "Plak de plan-JSON van de AI",
    attachFile: "Bestand toevoegen",
    completePlan: "Plan voltooien",
    completeError:
      "Kon dit niet als plan lezen. Zorg dat het de JSON is die de AI teruggaf.",
    aiPrompt: `Je bouwt een hardloop-trainingsplan voor mij. Ik voeg een plan-aanvraag-JSON toe met mijn wedstrijd en voorkeuren. Lees het en geef daarna een plan terug in EXACT onderstaand JSON-schema zodat ik het in mijn app kan importeren.

Wat de velden in de bijgevoegde plan-aanvraag betekenen:
- race.name: hoe het plan moet heten. race.raceName: de naam van de wedstrijd.
- race.distanceKm: de wedstrijdafstand in kilometers.
- race.date: wedstrijddag (YYYY-MM-DD).
- startDate: de datum waarop ik dit plan begin (YYYY-MM-DD). Bouw week 1 vanaf deze datum — ga NIET uit van de datum van vandaag.
- goal: mijn wedstrijddoel — { type: "finish" | "time" | "pace", value }. "finish" = gewoon uitlopen; "time" = streeftijd (value); "pace" = streeftempo per km (value). Gebruik dit om "goalPace"/"goalLabel" en de intensiteit te bepalen.
- offDays[]: periodes waarin ik niet volledig kan trainen — { start, end, title, note }. De "note" zegt hoe beperkt (bijv. geen training / zeer beperkt / verminderd).
- latestRuns[]: mijn recente lopen — { distanceKm, durationMin (TOTALE tijd van de loop, in minuten), pace (min/km, afgeleid uit afstand + totale tijd), date }. Gebruik deze om mijn conditie te schatten. Als dit leeg is, vraag me dan naar mijn conditie.
- training.daysPerWeek: hoeveel dagen per week ik wil hardlopen.
- training.trainingDays: de weekdagen waarop ik wil lopen (bijv. ["Monday","Wednesday"]). null betekent dat ik flexibel ben — kies dan zelf logische dagen.
- training.flexibleDays: true als ik geen vaste trainingsdagen heb.
- training.planningMode: "exact" = elke training vast op een specifieke dag; "flexible" = geef elke training een periode en ik kies zelf de exacte dag.
- training.targetDistanceKm: de langste ENKELE lange duurloop die ik comfortabel wil halen vóór de wedstrijd (NIET mijn wekelijkse omvang). null betekent dat jij beslist op basis van de wedstrijdafstand.

Uitvoer-schema (geef precies deze vorm terug, niets anders):
{
  "plans": {
    "<planId>": {
      "id": "<planId>",
      "name": "<plannaam>",
      "raceName": "<wedstrijdnaam>",
      "raceDistanceKm": <getal>,
      "raceDate": "YYYY-MM-DD",
      "goalPace": "mm:ss",            // per km
      "goalLabel": "<kort doel>",
      "version": 1,
      "createdAt": "<ISO datetime>",
      "offDays": [ { "id": "...", "start": "YYYY-MM-DD", "end": "YYYY-MM-DD", "title": "...", "note": "..." } ],
      "weeks": [ { "weekNumber": 1, "startDate": "YYYY-MM-DD(maandag)", "endDate": "YYYY-MM-DD(zondag)", "phase": "base|build|peak|taper|race|reduced", "label": "optioneel", "workoutIds": ["..."] } ],
      "workouts": {
        "<workoutId>": {
          "id": "<workoutId>", "date": "YYYY-MM-DD", "type": "easy|tempo|interval|long|recovery",
          "title": "...", "weekNumber": 1, "plannedDistanceKm": <getal>, "plannedPace": "mm:ss",
          "completed": false
          // Voor flexibele planning voeg ook toe: "flexible": true, "windowStart": "YYYY-MM-DD", "windowEnd": "YYYY-MM-DD"
        }
      }
    }
  },
  "activePlanId": "<planId>"
}

Regels:
- Weken lopen maandag→zondag. Week 1 begint op "startDate"; de lange duurloop van de laatste week is de wedstrijd op raceDate.
- Plan trainingen op mijn voorkeursdagen; als ik flexibel ben, kies dan logische dagen.
- Als planningMode "flexible" is: zet "flexible": true met "windowStart"/"windowEnd" op elke training, en houd de "date" binnen die periode.
- Respecteer "offDays": vermijd zware/lange trainingen in die periodes (none/limited/reduced volgens de notitie).
- Bouw lange duurlopen geleidelijk op naar mijn doelafstand, en bouw daarna af richting de wedstrijdweek.
- Gebruik mijn laatste lopen om conditie en tempo's te schatten. Zet elke training op "completed": false.
- Als mijn doeltijd/-tempo niet is gegeven, leid dan een logische "goalPace"/"goalLabel" af uit mijn laatste lopen en de wedstrijdafstand (of vraag het me eerst).
- Het id van elke training moet in de "workoutIds" van zijn week staan, en de "date" moet binnen die week vallen.
- Stel eerst eventuele verduidelijkende vragen en geef daarna ALLEEN de JSON terug.`,
  },
};
