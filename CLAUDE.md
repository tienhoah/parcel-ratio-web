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
- **F3: done, PR #3 (`f3-parcels-screen1`, branched off `f2-shell-map` — rebased onto `main`
  after PR #2 merged).**
  - Pure helpers: `src/app/ratio-stats.ts` (`ratio` = `assessedValue / lastSalePrice` or
    `null`; `median` handles even/odd; `cod` = `100 × (Σ|r−med|/n) / med`; `ratioBucket` +
    exported `RatioBucket` union off the 0.90/0.96/1.04/1.10 thresholds) and
    `src/app/parcel-geojson.ts` (`toFeatureCollection` → `FeatureCollection<Point, ParcelProps>`,
    `properties: { id, bucket }`, exported `ParcelProps`).
  - `App`: `toSignal(parcelService.getAll(), { initialValue: [] })` → `parcels` signal;
    `computed` for `features` / `medianRatio` / `codValue` / `soldCount` / `totalCount`
    (`soldRatios` filters nulls with an `r is number` guard).
  - `MapView`: `features = input<FeatureCollection<…> | null>(null)`, bound from `App` via
    `[features]="features()"`. `map` promoted to a `signal` (so the effect can react to
    "map created"); `styleReady` signal set in `map.on('load')`. A single `effect()` gates on
    `map() && styleReady() && features()` — reads all three before any early return so all stay
    tracked — then `syncParcels()`: `addSource` + two `circle` layers (`parcels` filtered
    `bucket != 'none'` with a `match` on the 5 ramp colours; `parcels-nosale` filtered
    `== 'none'`, transparent fill + grey stroke — circles can't dash). Re-runs take the
    `getSource(...).setData()` branch.
  - `ParcelService.getAll()` now passes `params: { pageSize: 100 }` — `/parcels` defaults to 20.
  - **Real dataset counts: 45 parcels, 30 sold, 15 no-sale** (plan doc's "52 / 22 / 30" was
    approximate). Median ≈ 0.944, COD ≈ 6.3 over the 30 sold — the mockup's 0.994 / 6.8 were
    placeholder design numbers; 0.944 matches a backend-verified figure in the plan.
  - **F3 done when:** Screen 1 panel + every parcel the right colour on the map. ✅
- **F4: done, PR #4 (`f4-draw-screen2`, off `main`).**
  - Deps: `terra-draw@1` + **`terra-draw-maplibre-gl-adapter`** (hyphenated — the plan doc's
    `@terra-draw/maplibre-gl-adapter` scoped name is pre-v1 and does not exist). Peers want
    `maplibre-gl >=4`, so the v5 pin is fine.
  - `src/app/ramp.ts` — `RAMP: Record<RatioBucket, string>`, the single source for the 5 ramp
    hexes + no-sale grey. Wired into `MapView`'s `match` expression and the legend `@for`.
  - `MapView`: **Terra Draw created inside `map.on('load')`** (starting it before the style
    loads = adapter never attaches pointer handlers, silent dead draw). `new TerraDraw({ adapter:
    new TerraDrawMapLibreGLAdapter({ map }), modes: [new TerraDrawRectangleMode()] })`, `.start()`,
    `.setMode('static')`. `'static'` is auto-registered alongside `'rectangle'`. `draw.on('finish',
    (id, ctx) => …)` — guard `ctx.mode === 'rectangle'` and `feature.geometry.type === 'Polygon'`
    (Terra Draw's store geometry is a union), then `ringToBbox(coordinates[0])` → `areaDrawn`
    output. `startDraw()` = `setMode('rectangle')`; `clearDraw()` = `clear()` + `setMode('static')`.
    Teardown via the field: `onDestroy(() => { this.draw?.stop(); map.remove(); })`.
  - `ringToBbox(ring: number[][])` in `parcel-geojson.ts` — min/max of the closed ring →
    `[minLon, minLat, maxLon, maxLat]`.
  - `App`: `mapView = viewChild(MapView)` (signal query — the sanctioned way to call a child's
    imperative method, distinct from the F2 "no viewChild for the mount element" rule).
    `area = signal<WithinResult | null>(null)` is the whole F4 screen state — `@if (area(); as a)`
    swaps Screen 2 / Screen 1 in the template. `onArea(bbox)` → `getWithin(...).pipe(
    takeUntilDestroyed(this.destroyRef)).subscribe(r => this.area.set(r))` (manual subscribe is
    right for an event-triggered call). `clearArea()` → `area.set(null)` + `mapView()?.clearDraw()`.
    `areaSold` / `areaSoldCount` / `areaNoSaleCount` / `areaRows` (sorted) / `areaFinding` computed.
  - `/within` returns **all** parcels in the box (sold + no-sale); `medianRatio`/`cod` are
    server-computed over sold only, both `0` when the box has no sold parcel (template shows `—`).
    Count line is derived client-side.
  - `areaFinding` fires the "Consistent, but low." callout when `median > 0 && median < 0.9 &&
    cod <= 15`. The "~15% below market" wording is hardcoded (fine for the Marpole demo ≈ 0.845).
  - **F4 done when:** a box over Marpole shows ≈ 0.845 / ≈ 2.8 + the finding sentence. ✅
- **F5: done, PR #5 (`f5-parcel-detail`, off `main`).**
  - `MapView`: `map.on('click', 'parcels', …)` — **layer-scoped** click, so only sold parcels
    fire; emits `parcelSelected = output<string>()`. `mouseenter`/`mouseleave` on `'parcels'`
    toggle `map.getCanvas().style.cursor`. Handlers registered outside `map.on('load')` — MapLibre
    queues layer handlers fine. No-sale parcels are simply not wired → not clickable (the plan's
    "pick one" choice).
  - Highlight: `selectedId = input<string | null>(null)`; `syncParcels` adds a `parcels-selected`
    circle layer last (draws on top), filter starts `['==', ['get','id'], '']` (matches nothing).
    A **second `effect()`** reads `selectedId()` and calls
    `setFilter('parcels-selected', ['==', ['get','id'], id ?? ''])`.
  - `src/app/geo.ts` — `haversineMetres(aLat, aLon, bLat, bLon)`, client-side comp distance.
  - `App`: `detail = signal<{ parcel: Parcel; comps: Parcel[] } | null>(null)`. `onParcel(id)` →
    `forkJoin({ parcel: getById(id), comps: getComparables(id) })` (parallel, one emission) →
    `.subscribe(d => { this.detail.set(d); this.area.set(null); this.mapView()?.clearDraw(); })` —
    a parcel supersedes an area selection. `clearDetail()` → `detail.set(null)`. `compRows`
    computed maps comps → `{ id, date, price, r, metres }`.
  - Template precedence: `@if (detail(); as d) { S3 } @else if (area(); as a) { S2 } @else { S1 }`.
    Bindings: `[selectedId]="detail()?.parcel?.id ?? null"`, `(parcelSelected)="onParcel($event)"`.
    `ratio` / `ratioBucket` exposed as `readonly` fields for template use.
  - Screen 3 markup: pin (📍 emoji stand-in) + id + address + "← All sales" pill; assessed /
    last-sale grid; ratio chip (ramp dot + ring); 4 attribute rows (**no bedrooms**); comparables
    list with amber hollow dots, `date · N m away`, price + ratio. The green check glyph from the
    mockup (decorative) is **not** implemented.
  - **F5 done when:** clicking any sold parcel fills the detail panel + rings it on the map;
    no-sale parcels are inert. ✅
- **F6: in progress, PR #6 (`f6-panel-split`, off `main`).**
  - **Panel split done.** `App` 120 → ~58 lines: data (`parcels`, `features`), state (`area`,
    `detail`), four handlers, no panel `computed`s. Three components, one contract each:
    `<app-panel-all [parcels] (draw)>`, `<app-panel-area [result] (clear)>`,
    `<app-panel-parcel [detail] (back)>` — one `input.required<T>()` down, one `output<void>()`
    up, each owns its derived state. `@if (detail(); as d)` guarantees the input is non-null so
    `input.required` is safe.
  - `src/app/panel-{all,area,parcel}/` — `.ts`/`.html`/`.css` each. `ParcelDetail` interface
    lives in `panel-parcel.ts`.
  - **CSS:** shared panel primitives (`.block` `.label` `.callout` `.stat` `.stats` `.divider`
    `.head-row` `.pill` `.link-btn` `.table` `.ticks` `.ends` `.s1-title` `.s1-sub`) moved to
    global `styles.css` — component `ViewEncapsulation` would otherwise stop them reaching child
    templates. Each panel component's `:host { display: flex; flex-direction: column; gap: 24px }`
    is the layout; `.panel` in `app.css` is now just the 340px box.
  - `panel-area`: `medianColour` computed — median in its ramp colour **except** the near-white
    `mid` bucket (`#e8e6e0` is illegible as text on the panel), where it falls back to ink.
  - **Still open in F6 (droppable):** empty/loading/error states (a failed `getAll`/`getWithin`
    currently shows nothing); deploy (Azure Static Web Apps + API).

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
- `input()` (F3) — signal-based component input, the modern `@Input()`. Returns a read-only
  `Signal`; parent binds with `[features]="expr"`. Because it's a signal it can be an `effect`
  dependency directly — no `ngOnChanges`. `input.required<T>()` for no-default.
- `effect()` (F3) — like `useEffect` but dependencies are **inferred** from which signals the
  callback reads at run time, not a manual array. Ordering gotcha: an early `return` before a
  signal read means that signal isn't tracked that run. Auto-disposed via injection context.
  Used to coordinate 3 async events (map created / style loaded / data arrived) that resolve
  in any order. `computed()` = `useMemo` with no dep array (F3, in `App`).
- `toSignal(obs, { initialValue })` (F3) lives in `@angular/core/rxjs-interop`; subscribes and
  unsubscribes for you. `$` suffix = variable holds an `Observable` (RxJS convention, unrelated
  to `inject`).
- `output<T>()` (F4) — modern `@Output()`, no `EventEmitter`. Bind `(areaDrawn)="onArea($event)"`,
  fire with `.emit(value)`.
- `viewChild(Cmp)` (F4) — signal query, returns `Signal<Cmp | undefined>`. Fine for calling a
  child's imperative method; still don't use it for a component's own mount element.
- `takeUntilDestroyed(destroyRef)` (F4) — pass `this.destroyRef` when calling outside an
  injection context (e.g. an event handler); the no-arg form only works in a field/constructor.
- `forkJoin({ a: obs, b: obs })` (F5) — RxJS; fires all in parallel, emits once when all complete
  as `{ a, b }`. The `Promise.all` of Observables. Where React would `Promise.all([...])`.
- MapLibre `map.on('click', 'layerId', cb)` (F5) — layer-scoped; `e.features[0].properties`.
  Register any time; won't fire until the layer exists. Feature highlight = a filtered extra
  layer + `map.setFilter(...)` driven by a signal, no per-DOM markers.
- `@else if` chains after `@if` (F5); `@if (x(); as y)` aliases the truthy value inside the block.
- `input.required<T>()` (F6) — no default, parent must bind. Safe when a parent `@if` guarantees
  the value. `output<void>()` for a pure signal ("clear", "back", "draw") — `.emit()` no arg.
- Component `ViewEncapsulation` (default Emulated) scopes a component's `.css` to its own
  template — a parent's classes don't reach a child's DOM. Shared "design-system" classes go in
  global `styles.css`; component `.css` holds only that component's bespoke rules + `:host`.

## Capture as you go

Three sentences on what surprised him in Angular vs React — prompt at F1, F3, F5, not at the end.
Candidates: standalone vs NgModules, signals vs hooks, `inject()` vs constructor DI, new control
flow, RxJS where he'd reach for a promise, zoneless change detection.
