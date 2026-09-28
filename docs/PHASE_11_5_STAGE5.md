# LOL GM 11.5 / Stage 5: Legacy cleanup — COMPLETE (4 substages)

## Completion plan

- **5-1 — canonical registration and roster helpers (completed):** deduplicate local-region and contracted-move checks, route player actions and AI market through the roster domain, unify detachment, prune proven-dead `PAY_SCALE` and `mResign` aliases.
- **5-2 — remaining legacy/optional domain fallback audit (completed):** remove fallback branches for APIs guaranteed by the canonical module manifest; prevent missing active gameplay dependencies from being silently skipped. Retain actual optional browser APIs and historical save migration.
- **5-3 — duplicate-flow and module-boundary consolidation (completed):** audit remaining reachable contract, lineup and roster flows; remove only proven duplicates and add parity regressions.
- **5-4 — final compatibility and acceptance (three small increments):**
  - **5-4a (completed, PR #14):** critical-path regression coverage for initial-manager negotiation, scheduled series preparation, legal reserve call-ups and stale-preview rejection.
  - **5-4b (completed, PR #15):** two successive real domestic league/postseason competitions, two rookie/offseason/market cycles, current v15 format-2 and format-1 compatibility restore and roster/supply invariants.
  - **5-4c (completed, PR #15 and main CI):** mandatory new acceptance script plus full existing regression, performance, build, generated artifact parity, PR CI, post-merge main CI and standalone sync.


## Goal and boundaries

Remove demonstrably unused compatibility stubs and duplicate rule implementations **without changing** gameplay, market decisions, saved-world representation, or the established 11.5 stage 3 transaction contract. This is deliberately a small domain-owned cleanup rather than deleting all historical data migration or rewriting source modules. World schema stays at **15** and compact save format stays at **2**.

## Stage 5-1 consolidations

1. **Single eligibility and season-move authority — `roster.js`.**
   - `isLocalPlayer` reads active local region with historical fallback (active local → origin local → origin region → region → nationality) without silently rewriting the player. `ensurePlayerEligibility` remains the explicit writer used by player bootstrap and save restoration.
   - `contractedMoveCount` is read-only and tolerates absent/invalid legacy history containers. The exact season definition, two-contracted-moves cap, exceptions and error messages remain in `roster.js`.
   - `state-player-actions.js` now calls `localRegistrationError`, `contractedMoveError`, and `teamNonLocalCount` instead of maintaining its own foreign-slot, local-status and move-count algorithms.
   - AI market candidate checks use the same `localRegistrationError`, preventing preview and AI market registration rules from diverging.

2. **Single roster-detachment mechanism — `roster.js`.**
   - `detachPlayerFromRosters` is shared by permanent assignment and release. Both clean up stale legacy duplicate membership entries, while leaving unrelated players and team selections alone. The helpers retain their previous return types and event/contract ownership.

3. **Removed unused legacy compatibility code.**
   - Delete the empty `PAY_SCALE` global. Regional pay scales continue to come from the configured `db.regions` policy via `psOf`.
   - Delete the unreferenced `mResign` wrapper; the supported manager renewal process is `startNegotiation` and the normal contract transaction.
   - Do **not** remove `migrateLegacyStaffState`, `save-migration.js`, format-1 world-v15 compatibility, or the previous storage namespace preservation rules. These are supported data-restoration paths, not dead code.

## Stage 5-1 verification

- Regression **11d** checks legacy fallback reads are pure, manager preview matches roster-domain foreign registration and season-move rejection, naturalization/local eligibility works with a filled foreign quota, and rejected commands leave serialized world data unchanged.
- Regression **11e** checks transfer/release clear duplicate roster entries while preserving other players and successful save/load recovery.
- Regression **11f** guards removed dead APIs, policy-driven regional pay values and the active renewal negotiation route.
- CI checks forbid duplicate transaction-only registration and move-limit implementations or a reintroduced empty `PAY_SCALE` table. Smoke tests assert region-defined pay scales and absence of the removed table. Stages 1–4 regression, long-season performance, build and standalone sync remain mandatory.

## Stage 5-2: Required module hooks and dead fallback branches

The standalone build concatenates all modules in `scripts/artifact-modules.mjs` into a single classic-JavaScript scope. Source symbol inventory confirms each of the following has exactly one real owner and is always present in the engine artifact. Their older `typeof name==='function'` / `typeof name!=='undefined'` fallback checks were unreachable for supported builds and, if an owner were missing, would silently weaken gameplay.

- `system-data.js` → `systems.js`: use canonical `SYSTEM_EFFECT_KEYS` for item and rune composition instead of a duplicated fallback list.
- `player.js` → `patch.js`: champion skill/baseline/rework changes always update practiced champion pools; an absent hook is not ignored.
- `player-relations.js`, `role-conversion.js` and `staff.js` → player, roster, development and patch evidence: satisfaction, role-conversion match usage, player-state defaults and youth coaching effects are always applied rather than falling back to neutral values.
- `career.js` → `transfer.js`: initial-squad salary budget, valid managed squad destinations and initial-offer checks always use the implemented career domain, rather than accepting incomplete fallback behavior.
- `staff.js` → `save-migration.js`: legacy staff restoration is a required migration, never silently omitted.

An obsolete guarded call to the **nonexistent** `resetRoleConversionSeasonLoad` API in player aging was also removed; it previously did nothing. A new season-reset mechanic is not introduced in a behavior-preserving cleanup. That mechanic, if desired, requires separate gameplay acceptance tests and approval.\n\nThis removes *only* optional guards around required, available engine APIs and that inert dead call. It does not remove `migrateLegacyStaffState`, old player/roster-save field migrations, version-15 format-1 compatibility, or historical world records. Browser-dependent guards (`indexedDB`, direct-file preview and timer globals) remain because their availability actually varies at runtime. No draft choices, budget formulae, imports, patches or career outcomes are intentionally altered.

Regression `11g` verifies player-state/role-satisfaction, rework-pool adaptation and full rune selection. Regression `11h` verifies the first-squad salary/ownership/offer checks. Structural CI validates required module owners and rejects a reintroduced optional hook guard. Full preexisting regression/smoke/perf/build gates, plus PR/main CI and generated HTML sync, are mandatory for this substage.

## Stage 5-3: Unreachable entrypoints and duplicate dispatch inventory

Static source audit covers all 55 engine/UI modules (excluding the generated
champion and system source datasets), the standalone HTML shell and the
regression/smoke scripts. Six declarations have no runtime caller anywhere in
these supported surfaces. Delete only these functions; do not modify
their active replacements or call semantics:

| Retired function | Owner | Active source of truth |
|---|---|---|
| `initialSignPlayer` | `career.js` | `initialStartNegotiation` + negotiation UI |
| `normalizeInitialSalaryFloor` | `career.js` | configured initial budgets / `initialOfferCheck`; no automatic forced salary raises |
| `nextMid` | `competition.js` | canonical scheduling and match IDs inside competition state |
| `scheduledOpeningDraft` | `competition.js` | `scheduledSeriesSession` and current season/draft preparation |
| `movePlayerBetweenSquads` | `roster.js` | `roster.plan` preview/application through transaction gateway |
| `mOffer` | `transfer.js` | `startNegotiation` and `submitNegotiationOffer` |

Two candidates were **deliberately retained**, because smoke tests execute
them: `autoBuildInitialSquad` (initial managed squad filling) and
`rosterMoveCheck` (reserve roster legality). The older-save migrator,
`migrateLegacyStaffState`, match records and all world-v15 format-1
compatibility paths remain untouched.

Regression `11i` checks that these six retired entrypoints stay removed
while the supported APIs are still callable, and that canonical squad
preflight remains pure. Structural CI rejects declarations or references to
the six retired names anywhere in canonical source and protects both
smoke-called functions. Prior regression `01`–`11h`, initial-market/roster
smoke, item/rune/draft performance and standalone build remain mandatory.

**5-4 final compatibility and acceptance is not included in 5-3.**

## Stage 5-4a: Focused existing-feature regression (completed in PR #14)

Scope is strictly **new tests and maintenance documentation**, not another
gameplay refactor. The preceding 5-1–5-3 cleanup removed unused entrypoints
but must leave supported managers, world simulation and roster flows intact.

- Regression `11j` exercises the real `initialStartNegotiation` route:
  unauthorized external squad, unevaluated prospect, evaluated candidate,
  single open negotiation and no premature player/team mutation.
- Regression `11k` exercises `scheduledSeriesSession` in a regular-season
  league fixture: deterministic series seed, Bo3, First Selection, Fearless,
  first-game setup and unchanged pending official fixture.
- Regression `11l` verifies the supported `rosterMoveCheck` against the
  manager `roster.plan` transaction gateway: read-only preflight and preview,
  legal call-up, consistent membership and replay protection.
- `scripts/check.mjs` makes 11j–11l mandatory so future cleanup cannot
  silently drop these acceptance tests.

All earlier stage 1–5-3 tests and smoke/perf/build remain required. No
new save format, salary, roster, draft or patch rule is introduced.
Long-career and save-resume stress acceptance is **5-4b**, not included
here. The 5-4c HTML/CI sign-off is complete.



**Not included:** Stage 6 UI-state architecture; new patch, youth or transfer rules; deleting any historical save/patch/game record; globally replacing the bootstrap/domain-writer APIs with a new data model.


## Stage 5-4b: Long-career and versioned save acceptance

The standalone `scripts/career-acceptance.mjs` loads every canonical engine
module, builds a bounded but **real ten-club single-region world**, starts a
managed blank-roster career, fills the first squad via the existing contract
gateway and allows the AI initial market to fill remaining teams.

Over two consecutive calendar years, it plays genuine domestic league and
knockout rounds (not fabricated winners), preserving completed match
IDs/results, checking one season champion per complete competition and
requiring at least 50 official matches across both years. It runs both
`runOffseason` and `closeMarket` each year and checks real rookie intake,
team registration/roster limits, starting lineup roles and labor supply.

The test serializes and restores at season bootstrap, mid-season with completed
official matches, offseason boundary, market open, market closed, and next
season bootstrap. It checks that packing leaves live state untouched, that
derived caches are absent from restored records, and that saved team
ownership/rosters remain intact. Two checkpoints emulate supported **world-v15
format-1** records by omitting `saveFormat` (including absent legacy local
eligibility), and verify that they load as save format 2 without erasing
gameplay state.

Run independently using `npm run career:acceptance`; `npm run check` includes
this script so CI cannot pass without multi-year and legacy restore coverage.
The VM has a bounded execution timeout and explicit per-season day limit;
acceptance fails rather than silently skipping an unfinished season.

## Stage 5-4c: Final quality and generated artifact gates

Completion requires the PR CI and post-merge `main` CI to pass all existing
static checks and regressions 01–11l, system snapshot validation, full world
smoke including managed Bo3/Bo5, multi-year career acceptance, the performance
probe, build, artifact verification, and standalone preview. `main` must
contain the generated `index.html` corresponding to the canonical module
sources; root HTML must not be hand-edited.

## Final verified acceptance — 2026-09-28

Stage 5 is **complete**. In PR
[#15](https://github.com/lkh0802a/LOL-GM/pull/15), all required checks
passed ([PR CI #36406398432](https://github.com/lkh0802a/LOL-GM/actions/runs/36406398432)).
The squash commit `f72f381c16f20bcc11a7bbfdd496bd20c8a199a9`
also passed post-merge
[main CI #36406723092](https://github.com/lkh0802a/LOL-GM/actions/runs/36406723092):
syntax/structural gates, regression 01–11l, full world smoke,
`CAREER_ACCEPTANCE`, indexed-meta/system perf, production build,
standalone artifact verification and `Sync generated standalone`.

The two-year career runner actually resolved **186 official fixtures**
(93 in 2027 and 93 in 2028), generated **30 / 19** rookies in its
bounded single-region fixture, performed **8** modern save resumes and
**2** v15-format-1 migration resumes. World schema remains **15** and
save encoding **2**. The generated root `index.html` matched the
canonical build, so no additional standalone sync commit was needed.

Stage 6 (UI-state consolidation) and phases 12–23 are **not** covered
by this Stage 5 sign-off.
