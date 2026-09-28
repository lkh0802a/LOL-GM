# LOL GM Architecture Guardrails

## Purpose

LOL GM remains a standalone-first simulation, but standalone delivery does not justify a single monolithic source file. Canonical source is split by simulation domain and concatenated only at build time.

## Module boundaries

The authoritative module order lives in `scripts/artifact-modules.mjs`.

- source snapshots: `champion-source.js`, `system-source.js`
- deterministic utilities: `random.js` (RNG streams and shared numeric helpers)
- simulation core: `engine.js` (one-game match), `draft.js` (draft), `systems.js` (automatic items/runes and system-meta)
- baseline/domain data: `data.js` (templates), `champion-data.js` (champion normalization), `system-data.js` (item/rune normalization), `champs2.js`
- player lifecycle: `player.js` (evaluation/identity, squad-role promises, champion learning, player generation, rookie cohorts)
- player development/training: `development.js` (training plans, facilities, daily recovery, age curves, seasonal growth)
- professional meta evidence: `meta.js`
- patch lifecycle/balance: `patch.js` (replay/calendar), `patch-balance.js` (diagnosis), `patch-content.js` (content lifecycle)
- series engine: `series.js` (First Selection, Fearless, best-of sessions, replay)
- competition engine: `competition.js` (schedules, stages, standings, scheduled-series orchestration)
- world configuration/bootstrap: `world.js`
- season orchestration: `season.js` (league/international calendar, official-match pause/resume, day progression)
- offseason orchestration: `offseason.js` (season closeout, market close, promotion/relegation)
- persistence: `save.js` (non-mutating compact save view and parse handoff), `save-migration.js` (versioned encoding migration, legacy v15 normalization and transient cache cleanup)
- roster/registration: `roster.js` (local eligibility, contracted-move accounting, organization roster rules, 1st↔reserve planning/movement, roster integrity)
- transaction gateway: `state-transaction.js` (shared read-only validation/preview, stale-state guards, revalidation and guarded commit), `state-player-actions.js` (signing/renewal, full transfer, release and contract-option command handlers) and `state-rollback.js` (action-scoped undo log and post-commit membership checks)
- management domains: `office.js` (regions), `office-international.js` (global governance), `finance.js`, `contracts.js`, `transfer.js`, `scouting.js`, `staff.js`, `scrim.js`, `player-relations.js`, `features.js`, `role-conversion.js`, `career.js`
- draft information layer: `draft-analysis.js` (scouting-bounded mastery estimates, meta/composition evidence, opponent-intent explanation); legality and selection remain in `draft.js`
- domain UI: `ui-setup.js`, `ui-match.js`, `ui-manager.js`, `ui-data.js`, `ui-patch.js`, `ui-market.js`, `ui-market-initial.js`, `ui-negotiations.js`, `ui-market-staff.js`, `ui-champion.js`, `ui-player.js`, `ui-roster.js`, `ui-draft.js`, `ui-season.js`
- application shell/controller: `app.js` (storage/bootstrap, shared UI state/helpers, navigation only)

The match, draft, item/rune, series and competition engines stay separate. `engine.js` owns one-game simulation; `draft.js` owns draft legality/selection; `series.js` owns First Selection/Fearless and best-of state; `competition.js` owns schedules/stages/standings. Scouting-bounded draft analysis stays in `draft-analysis.js`; interactive draft state stays in `ui-draft.js`.

`ui-market-initial.js` owns first-season roster markets; `ui-negotiations.js` owns negotiation forms; `ui-market-staff.js` owns staffing and sponsorship panels and bindings. `ui-match.js` owns scrim/match/series-result rendering, `ui-setup.js` owns world/team selection, `ui-manager.js` owns finance/Monte-Carlo surfaces, and `ui-data.js` owns save-slot/import-export surfaces. `app.js` is not a view bucket.

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

Roster mutation must flow through the roster-domain helpers (`assignPlayerToTeam`, `removePlayerFromTeam`, `validateRosterPlan`/`applyRosterPlan`) instead of ad-hoc cross-module array edits when the operation is covered by those APIs. Managed-club and AI reserve-squad decisions submit `roster.plan` through the shared `validateWorldAction` / `previewWorldAction` / `applyWorldAction` gateway. Manager negotiations, yearly contract/FA markets, AI transfers, releases and options use the same gateway with `player.sign`, `player.transfer`, `player.release` or `player.option`. Engine-enforced roster maintenance is explicitly marked as `system`, distinct from user-selected `manager` and club-decided `ai` actions; these all share underlying player transaction validators. The preview contains only command intent, save-identity/roster/date ownership snapshots and proposed changes; never store the preview in a save. Domain writer failures, partial financial updates and invalid post-write membership roll back the affected player's state, club rosters/depth charts, cash/fees, news and derived market-demand cache before returning an error. This journal is action-scoped, not a global world-undo facility. Old direct low-level roster helpers remain available for world bootstrap and migration. Low-level `signContract` and `doTransfer` also remain as domain writers for world bootstrap and transaction application. The gateway does not yet cover every retirement, league restructure or youth intake mutation. Match-slot changes are a separate concern owned by `lineup.js`.

Player generation and rookie-supply rules belong in `player.js`. Training/facilities/seasonal attribute growth belong in `development.js`.

World bootstrap must not own season execution, offseason processing or persistence. `season.js` owns competition/calendar orchestration, `offseason.js` owns year-transition processing, and `save.js` owns serialization. `world.js` is limited to configuration, region/team topology and career bootstrap.


Persistent game state lives under the world DB object. Module-level caches must never own persistent state.

Caches that depend on a world or patch use `WeakMap` ownership so a reset/new save can be garbage-collected and cannot reuse another world's values. Cached champion/system evaluation and item/rune fit are invalidated by patch revision counters. Draft pool snapshots also include world date and tournament pool identity so professional-eligibility changes cannot reuse stale pools. Meta-history indexes invalidate when the history array identity or length changes.

Historical patch objects are reconstructed from the pinned 26.19 source plus retained patch deltas. A full baseline copy is not serialized into every save.

## Save rules

`SAVE_VERSION` and the `buildWorld().version` schema must match; CI rejects drift. The world schema remains 15; storage encoding changes are independently tracked by `saveFormat` (current format 2), and missing markers mean legacy format 1. Unsupported world/encoding versions or malformed payloads cause a clear load error, never a silent new-world replacement.

High-volume records may use a compact persisted representation only when `unpackDB` restores the exact runtime structure. Meta-history packing preserves date, patch/competition dimensions, teams, players, positions, items, runes and bans.

Derived caches and baseline snapshots must not be serialized. Save compaction must build a serialization view; it may not delete or rewrite fields in live runtime objects merely to reduce persisted size. Save migration is a load-time operation only; it restores player attr/tendency/pool arrays, legacy staff fields, eligibility data, compressed meta history and safe missing world-market containers without changing pending official series, career history, contracts or negotiation state. Older storage namespaces are kept as backups and not purged during startup; cross-major world-schema upgrades (e.g. 14 → 15) are not assumed safe. Corrupt/unsupported saves are preserved for recovery. Slot writes capture the destination key and world when scheduled to prevent writing into the wrong slot after switching.

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
