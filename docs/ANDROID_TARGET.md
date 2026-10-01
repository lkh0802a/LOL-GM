# Final platform target — Android first

User decision, 2026-10-01. This supersedes descriptions of a web page/standalone
HTML as the final product. Updated user direction: before APK packaging,
deliver a playable standalone HTML game on desktop and mobile browsers.

## First delivery milestone — desktop and mobile HTML

The HTML version is a playable milestone, not just a development page. It must
open without a development server and support new games, club management,
multiple seasons, save/load and resumption. Mobile-browser acceptance includes
portrait touch workflows at 320/360/390px, readable controls, layered information
and no required hover, right-click or keyboard shortcuts. Build all game code
and required assets into the standalone artifact so core play works offline.
Browser-local saves and exported saves must support continuing a career; verify
storage behavior on the actual supported mobile browser/file-opening path.

Complete and verify this HTML milestone before Android packaging. Keep the
engine/UI/storage boundaries reusable for Android. Browser acceptance does not
substitute for later APK lifecycle or actual-device installation evidence.

Final acceptance is an installable production Android APK/app that works without
a development server: create a world, manage a club, simulate multiple seasons,
save, terminate/relaunch and continue. Core single-player simulation and saves
must work offline. iOS expansion should remain possible, but is secondary.

## Required sequence

1. **Complete:** development-efficiency checklist in Issue #57.
2. **Complete:** incremental ownership refactor under Issue #62.
3. **Complete:** remove fully replaced legacy callers/adapters; retain needed migrations.
4. Continue the first unfinished item in the actual roadmap/audit.
5. Complete mobile UX and mobile CPU/RAM/battery/save performance.
6. Deliver and validate the playable desktop/mobile standalone HTML milestone.
7. Select and implement Android packaging, build a release APK and validate it.

Neither CI setup nor optimization alone is project completion. Do not rebuild
already accepted contracts, patch/meta or medical behavior from their names.

## Performance work during mobile development

User decision, 2026-10-01: development-efficiency optimization and the planned
refactor are complete. Perform remaining engine and mobile performance work
while developing the relevant roadmap feature or platform integration; do not
insert another standalone general optimization phase before feature development.

- Feature implementation: measure and improve affected simulation, AI, market,
  growth, scheduling, statistics and save/load paths when a bottleneck is found.
- Mobile HTML UX: implement efficient rendering, bounded memory/save growth,
  useful batching/caches, low idle CPU and background suspension alongside the
  related screens and simulation controls. Measure long careers and sessions,
  including CPU/RAM, battery and heat on supported mobile devices.
- Android integration: verify release-mode lifecycle, durable saves, kill/reopen
  recovery, background behavior and resource use on an actual Android device.

The mobile performance milestone in the required sequence is the final
acceptance gate for this integrated work. It does not postpone performance until
all features are finished. Existing optimization completion does not mean these
mobile requirements have passed. Keep deterministic engine/save checks and the
desktop/mobile HTML-before-APK delivery order.

## Current evidence and technology decision boundary

The repository has dependency-free JavaScript global modules concatenated by
`scripts/build.mjs` into HTML. There is no Android project or native build yet.
The engine is local; app.js uses IndexedDB with localStorage fallback and serialized
slot writes, and save-migration.js validates world v15/encoding format 2.
These are reusable components, not proof of crash-safe Android persistence.
The shell still requests Google Fonts. Explicit visibility/pagehide app suspension
handling was not found in app.js/ui-state.js during this audit.

Choose the app architecture after evaluating reuse, long-simulation performance,
durable local storage, lifecycle, offline assets, touch UX and release tooling.
Do not assume a temporary WebView wrapper satisfies those requirements. No mobile
framework, package ID, signing identity or store account is selected by this doc.

## Mobile acceptance checklist — not yet complete

- Portrait-first, one-handed touch navigation; readable typography, useful tap
  targets, safe areas and device-size adaptation. No required hover/right-click
  or keyboard shortcuts. Replace wide dense tables with cards/lists/disclosure.
- Layer information across home, schedule, squad/player, tactics, matches,
  scrims, contracts/market, patch/meta, standings/competitions, finance and news.
- Offline new game, load/save, calendar, match/AI/development/contracts/market,
  patches and competitions; optional network services isolated from those paths.
- Autosave, manual save and multiple slots; atomic writes/recovery after forced
  termination, versioned migration and update compatibility with bounded size.
- Pause expensive work in the background; checkpoint safely on lifecycle events.
  Cover home/lock/calls/background/OS kill/force-stop and resumption. Do not rely
  on an async shutdown callback being guaranteed to complete.
- Measure seasons/AI/market/schedules/stats/rendering/save-load over long careers:
  CPU, RAM, battery, heat, save size and resume time. No idle polling/render loop;
  batch heavy simulation, reuse valid computations and check retained memory.
- Produce a release-mode APK through a conditional Android Actions workflow;
  upload installable artifacts. Validate installation, offline cold start,
  save/load, season advancement, kill/relaunch, touch screens and long sessions
  on a real Android device. Emulator-only success is insufficient.

## Validation ownership

Use focused local reproduction for diagnosis. Actions owns repeatable full
regression, long simulations and builds. Add Android/long-career workflows only
when their actual implementation exists; trigger expensive runs explicitly or
by relevant changes, use dependency caches when measured useful, cancel stale
runs, and retain summaries/artifacts. Never reduce seeds/seasons/assertions to
manufacture a green check. Real-device evidence must be reported separately from
hosted CI; no APK or real-device validation is claimed today.
