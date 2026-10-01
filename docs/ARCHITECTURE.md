# LOL GM Architecture Guardrails

## Purpose

LOL GM currently uses a standalone HTML development preview. The final delivery target is an offline-capable Android app (see ANDROID_TARGET.md). Canonical source is split by simulation domain and concatenated only at build time; mobile packaging must preserve clear engine/UI/storage boundaries.

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
- calendar: `calendar.js` (world clock positioning, next calendar day, dated patches and once-per-day effects)
- season orchestration: `season.js` (league/international calendar, official-match pause/resume, day progression)
- offseason orchestration: `offseason.js` (season closeout, market close, promotion/relegation)
- persistence: `save.js` (non-mutating compact save view and parse handoff), `save-migration.js` (versioned encoding migration, legacy v15 normalization and transient cache cleanup)
- roster/registration: `roster.js` (local eligibility, contracted-move accounting, organization roster rules, 1st↔reserve planning/movement, roster integrity)
- transaction gateway: `state-transaction.js` (shared read-only validation/preview, stale-state guards, revalidation and guarded commit), `state-player-actions.js` (signing/renewal, full transfer, release and contract-option command handlers) and `state-rollback.js` (action-scoped undo log and post-commit membership checks)
- facilities and club economy: `development.js` owns infrastructure levels, timed construction and physical training/analysis/recovery effects. `finance.js` owns budgets, prepaid cash movements, conservative forecasts and audited annual statements, while `offseason.js` chooses board investments and `season.js` activates completed construction on world days. See `docs/PHASE_12_FINANCE.md`.
- management domains: `office.js` (regions), `office-international.js` (global governance), `finance.js`, `contracts.js`, `contract-negotiation.js`, `transfer.js`, `scouting.js`, `staff.js`, `scrim.js`, `player-relations.js`, `features.js`, `role-conversion.js`, `career.js`
- draft information layer: `draft-analysis.js` (scouting-bounded mastery estimates, meta/composition evidence, opponent-intent explanation); legality and selection remain in `draft.js`
- domain UI: `ui-setup.js`, `ui-match.js`, `ui-manager.js`, `ui-data.js`, `ui-patch.js`, `ui-market.js`, `ui-market-initial.js`, `ui-negotiations.js`, `ui-market-staff.js`, `ui-champion.js`, `ui-player.js`, `ui-roster.js`, `ui-draft.js`, `ui-season.js`
- modal/keyboard ownership: `ui-overlay.js` (single dialog lifecycle, background inerting, focus containment/return, dismissibility policy for match reports, practice drafts and locked official First Selection)
- shared transient UI state and screen routing: `ui-state.js` (cross-screen view state, six routes, route bindings, scroll restoration and world-replacement reset). Programmatic route focus and keyboard access to overflowing tables are owned here; the markup shell carries the main landmark/skip link and narrow-screen/reduced-motion rules. Cooperative season-day/Monte-Carlo work carries a world/slot/view/render token; route changes cancel outstanding batches and persist completed days.
- Persistence controller: `app.js` serializes every write per save-slot key, prioritizes successful local fallbacks over stale IndexedDB writes on load, and atomically commits a new active slot only after outgoing save and incoming load succeed. UI navigation and interactions are blocked while a slot switch is in progress.
- application shell/controller: `app.js` (storage/bootstrap, shared read helpers and season landing surface)

The match, draft, item/rune, series and competition engines stay separate. `engine.js` owns one-game simulation; `draft.js` owns draft legality/selection; `series.js` owns First Selection/Fearless and best-of state; `competition.js` owns schedules/stages/standings. Scouting-bounded draft analysis stays in `draft-analysis.js`; interactive draft state stays in `ui-draft.js`.

`ui-market-initial.js` owns first-season roster markets; `ui-negotiations.js` owns negotiation forms; `ui-market-staff.js` owns staffing and sponsorship panels and bindings. `ui-match.js` owns scrim/match/series-result rendering, `ui-setup.js` owns world/team selection, `ui-manager.js` owns finance/Monte-Carlo surfaces, and `ui-data.js` owns save-slot/import-export surfaces. `app.js` is not a view bucket.

New large UI surfaces should be added as `ui-<domain>.js` modules instead of extending `app.js`. Squad editing lives in `ui-roster.js`; player detail/scouting lives in `ui-player.js`; draft UI lives in `ui-draft.js`. Small files are kept separate only when they own a coherent domain boundary, not merely to increase module count.

## Domain ownership notes

- `meta.js` owns match-derived meta evidence and query indexes. `patch.js` may consume that evidence for balance diagnosis but does not own meta-history storage/query logic.

- `finance.js` owns club cash flow, payroll/spending controls, revenue/cost closeout and sponsorship acceptance.
- `contracts.js` owns player market valuation, contract terms/options/signing and the AI contract/FA market.
- `contract-negotiation.js` owns shared persisted negotiation state, player terms/rounds, reopening and agreement through the player-action gateway. It serves initial, FA, renewal and transfer personal terms.
- `transfer.js` owns recruitment workflow, seller fee negotiations and permanent transfer execution. Recruitment tracking remains a shared consumer of player negotiation outcomes.
- `scouting.js` owns observed player knowledge and reports; contract/transfer code may consume its public estimates but must not reimplement scouting uncertainty.
- `staff.js` owns staff departments, staffing limits, coaching profile, generation, AI management and manager staff actions.
- `player-relations.js` owns player condition modifiers, relationships, usage and satisfaction/transfer-request lifecycle.

- World-office league expansion (`office-international.js`) combines historical region presets with `FUTURE_LEAGUE_MARKETS`. The latter contains only potential geographic markets, not real league identities. On a successful expansion roll the office selects historical or speculative candidates; speculative leagues receive a generated, collision-checked `leagueName` and unique `short`. The initial world preset list remains unchanged. New league history and branding must survive v15 saves, and the same canonical `addRegion` team generation, roster and `leagueComp` schedule rules apply. No static preset-only assumption is allowed when reading the chosen candidate's strength.

- `scrim.js` owns scrim readiness, AI partner scheduling/value and practice effects.

Static reachability audits distinguish dead wrappers from supported entrypoints. Legacy stage 5-3 removes uncalled initial-signing, forced-salary-floor, match-ID, scheduled-opening-draft, direct squad-moving and FA-offer aliases; canonical negotiation, competition and `roster.plan` transaction paths remain. Both `autoBuildInitialSquad` and `rosterMoveCheck` are still required by smoke acceptance and must not be removed. This is not permission to delete save migration or compatibility code.

Required cross-domain hooks are not optional features: the ordered standalone manifest always loads `SYSTEM_EFFECT_KEYS`, champion-pool patch adaptation, satisfaction/player-state/role-conversion usage rules, staff migration and initial-market budget/ownership checks. Do not hide a missing engine dependency behind a `typeof ...==='function'` fallback. Runtime-dependent browser APIs (`indexedDB`, preview timers) and the supported legacy save-migration procedures are separate concerns and must not be pruned simply because a static reference appears rare. A previous player-aging call to the undefined `resetRoleConversionSeasonLoad` symbol was dead and has been removed without introducing a new yearly reset mechanic.

## State and cache rules

Roster mutation must flow through the roster-domain helpers (`assignPlayerToTeam`, `removePlayerFromTeam`, `validateRosterPlan`/`applyRosterPlan`) instead of ad-hoc cross-module array edits when the operation is covered by those APIs. Managed-club and AI reserve-squad decisions submit `roster.plan` through the shared `validateWorldAction` / `previewWorldAction` / `applyWorldAction` gateway. Manager negotiations, yearly contract/FA markets, AI transfers, releases and options use the same gateway with `player.sign`, `player.transfer`, `player.release` or `player.option`. Engine-enforced roster maintenance is explicitly marked as `system`, distinct from user-selected `manager` and club-decided `ai` actions; these all share underlying player transaction validators. The preview contains only command intent, save-identity/roster/date ownership snapshots and proposed changes; never store the preview in a save. Domain writer failures, partial financial updates and invalid post-write membership roll back the affected player's state, club rosters/depth charts, cash/fees, news and derived market-demand cache before returning an error. This journal is action-scoped, not a global world-undo facility. Old direct low-level roster helpers remain available for world bootstrap and migration. Low-level `signContract` and `doTransfer` also remain as domain writers for world bootstrap and transaction application. The gateway does not yet cover every retirement, league restructure or youth intake mutation. Match-slot changes are a separate concern owned by `lineup.js`.

Read-only eligibility lookups and contracted-move counting belong exclusively to `roster.js` and never normalize player state during command previews. Domain writers and save restoration explicitly normalize legacy eligibility. The same `localRegistrationError`, `contractedMoveError` and `teamNonLocalCount` functions serve AI candidate selection, manager actions and transaction validation; do not introduce parallel registration or move-limit implementations. Permanent reassignment and release both use the roster domain's `detachPlayerFromRosters` helper to clear stale memberships. The old empty `PAY_SCALE` compatibility table and unused renewal alias have been retired; regional finance remains configurable, and old version-15 save migrations remain supported.

Player generation and rookie-supply rules belong in `player.js`. Training/facilities/seasonal attribute growth belong in `development.js`.

World bootstrap must not own season execution, offseason processing or persistence. `season.js` owns competition orchestration, `calendar.js` owns world-clock positioning and daily effects, `offseason.js` owns year-transition processing, and `save.js` owns serialization. `world.js` is limited to configuration, region/team topology and career bootstrap.


Persistent game state lives under the world DB object. Module-level caches must never own persistent state.

Caches that depend on a world or patch use `WeakMap` ownership so a reset/new save can be garbage-collected and cannot reuse another world's values. Cached champion/system evaluation and item/rune fit are invalidated by patch revision counters. Draft pool snapshots also include world date and tournament pool identity so professional-eligibility changes cannot reuse stale pools. Meta-history patch/competition/region indexes incrementally append newly recorded matches and rebuild on history array replacement, truncation or tail-row identity change. Filtered-query results and sorted patch evidence have 64/12-entry LRU bounds, and patch UI filter facets use the same index. Current-patch item/rune usage evidence is aggregated once per patch/row revision, preserving direct-scan statistics. Historical reconstructed patch snapshots are held in a per-world 8-entry LRU and can be reconstructed from retained note history after eviction. These derived caches never enter saves.

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

Market FA replenishment uses the same preview/commit/rollback gateway via
`roster.market-callup`, with decision and assignment owned by `roster.js`. This
maintenance operation precedes complete registration and preserves historical
market behavior (including no squad-move satisfaction/event changes); it is
AI-only, market-only and cannot operate on a manually managed club. Ordinary
manager/weekly reserve swaps retain full `roster.plan` validation.

Release cost is read from `contracts.js::contractReleaseCost` by both the UI
and player commands. `finance.js` owns release liability accrual, payroll and
spending-tax calculations; current contract state remains their only input.
