# LOL GM Architecture Guardrails

## Purpose

LOL GM remains a standalone-first simulation, but standalone delivery does not justify a single monolithic source file. Canonical source is split by simulation domain and concatenated only at build time.

## Module boundaries

The authoritative module order lives in `scripts/artifact-modules.mjs`.

- source snapshots: `champion-source.js`, `system-source.js`
- simulation core: `engine.js` (match simulation) and `draft.js` (champion/system evaluation, automatic item/rune environment, draft decisions)
- baseline/domain data: `data.js`, `champs2.js`
- player lifecycle: `player.js` (evaluation/identity, squad-role promises, champion learning, player generation, rookie cohorts)
- player development/training: `development.js` (training plans, facilities, daily recovery, age curves, seasonal growth)
- professional meta evidence: `meta.js`
- patch lifecycle/balance: `patch.js`
- series engine: `series.js` (First Selection, Fearless, best-of sessions, replay)
- competition engine: `competition.js` (schedules, stages, standings, scheduled-series orchestration)
- world configuration/bootstrap: `world.js`
- season orchestration: `season.js` (league/international calendar, official-match pause/resume, day progression)
- offseason orchestration: `offseason.js` (season closeout, market close, promotion/relegation)
- persistence: `save.js` (compact save view and unpack/migration handoff)
- roster/registration: `roster.js` (local eligibility, contracted-move accounting, organization roster rules, 1st↔reserve planning/movement, roster integrity)
- management domains: `office.js`, `finance.js`, `contracts.js`, `transfer.js`, `scouting.js`, `staff.js`, `scrim.js`, `player-relations.js`, `features.js`, `role-conversion.js`, `career.js`
- draft information layer: `draft-analysis.js` (scouting-bounded mastery estimates, meta/composition evidence, opponent-intent explanation); legality and selection remain in `draft.js`
- domain UI: `ui-patch.js`, `ui-market.js`, `ui-champion.js`, `ui-player.js`, `ui-roster.js`, `ui-draft.js`, `ui-season.js`
- application shell/controller: `app.js`

The match, draft, series and competition engines stay separate. `engine.js` owns one-game simulation; `draft.js` owns draft legality/selection; `series.js` owns First Selection/Fearless and best-of state; `competition.js` owns schedules/stages/standings. Scouting-bounded draft analysis stays in `draft-analysis.js`; interactive draft state stays in `ui-draft.js`.

New large UI surfaces should be added as `ui-<domain>.js` modules instead of extending `app.js`. Squad editing lives in `ui-roster.js`; player detail/scouting lives in `ui-player.js`; draft UI lives in `ui-draft.js`. Small files are kept separate only when they own a coherent domain boundary, not merely to increase module count.

## Domain ownership notes

- `meta.js` owns match-derived meta evidence and query indexes. `patch.js` may consume that evidence for balance diagnosis but does not own meta-history storage/query logic.

- `finance.js` owns club cash flow, payroll/spending controls, revenue/cost closeout and sponsorship acceptance.
- `contracts.js` owns player market valuation, contract terms/options/signing and the AI contract/FA market.
- `transfer.js` owns recruitment workflow, negotiations and permanent transfer execution.
- `scouting.js` owns observed player knowledge and reports; contract/transfer code may consume its public estimates but must not reimplement scouting uncertainty.
- `staff.js` owns staff departments, staffing limits, coaching profile, generation, AI management and manager staff actions.
- `player-relations.js` owns player condition modifiers, relationships, usage and satisfaction/transfer-request lifecycle.
- `scrim.js` owns scrim readiness, AI partner scheduling/value and practice effects.

## State and cache rules

Roster mutation must flow through the roster-domain helpers (`assignPlayerToTeam`, `removePlayerFromTeam`, `validateRosterPlan`/`applyRosterPlan`) instead of ad-hoc cross-module array edits when the operation is covered by those APIs. Match-slot changes are a separate concern owned by `lineup.js`.

Player generation and rookie-supply rules belong in `player.js`. Training/facilities/seasonal attribute growth belong in `development.js`.

World bootstrap must not own season execution, offseason processing or persistence. `season.js` owns competition/calendar orchestration, `offseason.js` owns year-transition processing, and `save.js` owns serialization. `world.js` is limited to configuration, region/team topology and career bootstrap.


Persistent game state lives under the world DB object. Module-level caches must never own persistent state.

Caches that depend on a world or patch use `WeakMap` ownership so a reset/new save can be garbage-collected and cannot reuse another world's values. Cached champion/system evaluation and item/rune fit are invalidated by patch revision counters. Draft pool snapshots also include world date and tournament pool identity so professional-eligibility changes cannot reuse stale pools. Meta-history indexes invalidate when the history array identity or length changes.

Historical patch objects are reconstructed from the pinned 26.19 source plus retained patch deltas. A full baseline copy is not serialized into every save.

## Save rules

`SAVE_VERSION` and the `buildWorld().version` schema must match; CI rejects drift.

High-volume records may use a compact persisted representation only when `unpackDB` restores the exact runtime structure. Meta-history packing preserves date, patch/competition dimensions, teams, players, positions, items, runes and bans.

Derived caches and baseline snapshots must not be serialized. Save compaction must build a serialization view; it may not delete or rewrite fields in live runtime objects merely to reduce persisted size.

## Build and CI rules

`scripts/artifact-modules.mjs` is the only module-order manifest used by build/check/smoke tooling.

CI rejects:

- JavaScript syntax failures
- duplicate top-level global symbols across concatenated artifact modules
- save-schema version mismatch
- incomplete pinned champion/item/rune source coverage
- core UI monolith growth past the maintainability budget
- dedicated 11.5 regression-baseline violations from `scripts/regression.mjs` (world/player/roster/contracts/staff/local rules/patch/system/draft/Bo3/Bo5/save-resume)
- smoke-test violations including patch-cache isolation, query-cache invalidation, non-mutating save packing and save round trips
- performance-probe execution failures for series simulation, draft/system caches and indexed meta queries

The generated root `index.html` is a deployment artifact. Canonical edits belong in `src/artifact/*`. Main-branch CI rebuilds it from the canonical module manifest and commits it only when the generated standalone differs.

- lineup domain: `lineup.js` owns official five-player slot assignment and validation; `p.role` is player identity, not an eligibility gate.
- role conversion domain: `role-conversion.js` owns proposal acceptance/refusal, long-term training progress, role-use acceleration, opportunity cost and primary-role identity changes. It does not gate one-off lineup assignment.
- player detail/scouting domain: `ui-player.js` owns player detail, scouting search/report rendering and role-conversion controls; `ui-roster.js` owns squad editing/bindings.
