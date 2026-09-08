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
- **F1: in progress.**
  - `ng new parcel-ratio-web` — Angular 22, standalone, signals, zoneless, `--style=css`,
    `--routing=false`, `--ssr=false`, pnpm. Committed to `main` as `initial commit`.
  - GitHub repo `tienhoah/parcel-ratio-web` (private) created + pushed.
  - **Next, on a branch:** `Parcel` interface (mirror the JSON shape in the plan) →
    `src/environments/` via `ng generate environments`, add `apiBaseUrl` (`http://localhost:5005`)
    and the MapTiler key → `ParcelService` (`inject(HttpClient)`, `getAll/getById/getComparables/
    getWithin`) → `provideHttpClient()` in `app.config.ts` → dump `/parcels` into a bare `@for`
    list in `App` to prove the live connection.
  - **F1 done when:** the list renders live API data.

## Angular surface notes (already established)

- Zoneless: no Zone.js, no `provideZoneChangeDetection`. Signals are how change detection is
  driven — not optional sugar. Good React-contrast interview point.
- File naming drops the `.component` suffix (`app.ts`, class `App`).
- No `NgModule`. `bootstrapApplication(App, appConfig)` in `main.ts`; app-wide providers live
  in `app.config.ts`.
- `HttpClient` returns RxJS `Observable`, not `Promise`. `toSignal()` bridges to a signal.
- Tests are Vitest now — irrelevant, tests are out of scope.

## Capture as you go

Three sentences on what surprised him in Angular vs React — prompt at F1, F3, F5, not at the end.
Candidates: standalone vs NgModules, signals vs hooks, `inject()` vs constructor DI, new control
flow, RxJS where he'd reach for a promise, zoneless change detection.
