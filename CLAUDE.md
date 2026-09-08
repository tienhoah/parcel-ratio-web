# parcel-ratio-web — session brief

Front end for the Parcel Ratio Study. **Read `../parcel-web-plan.md` first** — it is the full
brief: stack, the mockup spec (three screens, one shell), the colour ramp, the milestone plan
F0–F6, and every decision already made. Also read `../parcel-api/CLAUDE.md` for the project's
one rule and the out-of-scope list — both still apply.

## The one rule

Small. The deliverable is the sentences the developer can say in the interview, not the repo.
Every extra feature is time not spent rehearsing. If a suggestion adds a day, it's wrong.

## Mentorship workflow (strict — do not skip)

The developer is a 7-yr JS/TS/React dev; **Angular is the weak spot** this milestone closes.

1. **Explain the concept/design before any code is written** — why this shape, what transfers
   from React, what is genuinely new in Angular.
2. **He writes the `.ts` himself.** Claude does not write application source files. Config/tooling
   files (`.gitignore`, `angular.json` tweaks, `environment.ts` if it's just a URL constant) are
   fine to write directly.
3. Review his diff like a real PR reviewer — concrete issues, not a rewrite.
4. **Branch + PR per milestone.** Never commit straight to `main`.
5. Ask a comprehension-check question before advancing to the next milestone.

## Progress

- **F0 (CORS on the API repo): done, merged.** `http://localhost:4200` allowed.
- **F1: done, merged (PR #1).** `Parcel` interface, `src/environments/` (`apiBaseUrl`, MapTiler
  key), `ParcelService` (`getAll/getById/getComparables/getWithin`), `provideHttpClient()`,
  `/parcels` dumped into a `@for` list. `parcel.service.ts` / `parcel.ts` stay for F3.
- **F2: done, PR #2 open (`f2-shell-map`).**
  - Shell: top bar + flex body + 340px static panel; IBM Plex Sans/Mono via `index.html` +
    `styles.css`.
  - `MapView` component (`src/app/map-view/`) owns the MapLibre instance: host element is the
    container (no `viewChild`), `new Map()` in `afterNextRender`, `inject(DestroyRef).onDestroy`
    → `map.remove()`. MapTiler Dataviz Light, Vancouver centre.
  - **`maplibre-gl` pinned to v5** (`^5`). v6.7 loads its tile-parser worker from a split
    `maplibre-gl-worker.mjs` ES-module worker → the Angular/Vite dev server can't serve it
    through dep pre-bundling → dead worker, sources never load, blank map. v5 inlines the
    worker as a blob. (Terra Draw's adapter targets v5 anyway.) `allowedCommonJsDependencies:
    ["maplibre-gl"]` in `angular.json` silences a prod-build warning.
  - `MapView` `:host { display: block }` — component hosts are `display: inline` by default,
    so the container had zero height and MapLibre rendered nothing. Both bugs stacked.
  - **F2 done when:** empty shell + basemap renders. ✅

## Angular surface notes (already established)

- Zoneless: no Zone.js, no `provideZoneChangeDetection`. Signals are how change detection is
  driven — not optional sugar. Good React-contrast interview point.
- File naming drops the `.component` suffix (`app.ts`, class `App`).
- No `NgModule`. `bootstrapApplication(App, appConfig)` in `main.ts`; app-wide providers live
  in `app.config.ts`.
- `HttpClient` returns RxJS `Observable`, not `Promise`. `toSignal()` bridges to a signal.
- Tests are Vitest now — irrelevant, tests are out of scope.
- Wrapping an imperative lib (MapLibre): the component's host element is the mount point —
  `inject(ElementRef)`, no template ref / `viewChild`. Create in `afterNextRender` (browser-only,
  post-first-render), tear down via `inject(DestroyRef).onDestroy(...)` — the `inject()`-era
  replacement for `implements OnDestroy`, closer to a `useEffect` cleanup return than a class hook.
- Host elements are `display: inline` unless `:host` says otherwise — a sizing gotcha for any
  component that needs real dimensions.

## Capture as you go

Three sentences on what surprised him in Angular vs React — prompt at F1, F3, F5, not at the end.
Candidates: standalone vs NgModules, signals vs hooks, `inject()` vs constructor DI, new control
flow, RxJS where he'd reach for a promise, zoneless change detection.
