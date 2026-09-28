# LOL GM Architecture Guardrails

## Purpose

LOL GM remains a standalone-first simulation, but standalone delivery does not justify a single monolithic source file. Canonical source is split by simulation domain and concatenated only at build time.

## Module boundaries

The authoritative module order lives in `scripts/artifact-modules.mjs`.

- source snapshots: `champion-source.js`, `system-source.js`
- simulation core: `engine.js` (match simulation) and `draft.js` (champion/system evaluation, automatic item/rune environment, draft decisions)
- baseline/domain data: `data.js`, `champs2.js`
- player lifecycle: `player.js` (evaluation/identity, squad-role promises, champion learning, player generation, rookie cohorts)
- player development: `development.js` (training, facilities, age curves, seasonal growth)
- patch/meta: `patch.js`
- competition/world: `competition.js`, `world.js`
- roster/registration: `roster.js` (local eligibility, contracted-move accounting, organization roster rules, 1st↔reserve planning/movement, roster integrity)
- management domains: `office.js`, `finance.js`, `features.js`, `role-conversion.js`, `career.js`
- draft information layer: `draft-analysis.js` (scouting-bounded mastery estimates, meta/composition evidence, opponent-intent explanation); legality and selection remain in `draft.js`
- domain UI: `ui-patch.js`, `ui-market.js`, `ui-champion.js`, `ui-player.js`, `ui-roster.js`, `ui-draft.js`, `ui-season.js`
- application shell/controller: `app.js`

The match engine and draft engine stay separate. Draft legality/selection state stays in `draft.js`; scouting-bounded informational analysis stays in `draft-analysis.js`; interactive state stays in `ui-draft.js`.

New large UI surfaces should be added as `ui-<domain>.js` modules instead of extending `app.js`. Squad editing lives in `ui-roster.js`; player detail/scouting lives in `ui-player.js`; draft UI lives in `ui-draft.js`. Small files are kept separate only when they own a coherent domain boundary, not merely to increase module count.

## State and cache rules

Roster mutation must flow through the roster-domain helpers (`assignPlayerToTeam`, `removePlayerFromTeam`, `validateRosterPlan`/`applyRosterPlan`) instead of ad-hoc cross-module array edits when the operation is covered by those APIs. Match-slot changes are a separate concern owned by `lineup.js`.

Player generation and rookie-supply rules belong in `player.js`. Training/facilities/seasonal attribute growth belong in `development.js`. `world.js` may orchestrate those systems but must not reimplement them.


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
- smoke-test violations including patch-cache isolation, query-cache invalidation, non-mutating save packing and save round trips
- performance-probe execution failures for series simulation, draft/system caches and indexed meta queries

The generated root `index.html` is a deployment artifact. Canonical edits belong in `src/artifact/*`. Main-branch CI rebuilds it from the canonical module manifest and commits it only when the generated standalone differs.

- lineup domain: `lineup.js` owns official five-player slot assignment and validation; `p.role` is player identity, not an eligibility gate.
- role conversion domain: `role-conversion.js` owns proposal acceptance/refusal, long-term training progress, role-use acceleration, opportunity cost and primary-role identity changes. It does not gate one-off lineup assignment.
- player detail/scouting domain: `ui-player.js` owns player detail, scouting search/report rendering and role-conversion controls; `ui-roster.js` owns squad editing/bindings.
