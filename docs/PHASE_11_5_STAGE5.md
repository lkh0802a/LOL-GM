# LOL GM 11.5 / Stage 5: Legacy cleanup (4 substages)

## Completion plan

- **5-1 — canonical registration and roster helpers (completed):** deduplicate local-region and contracted-move checks, route player actions and AI market through the roster domain, unify detachment, prune proven-dead `PAY_SCALE` and `mResign` aliases.
- **5-2 — remaining legacy/optional domain fallback audit (this PR):** remove fallback branches for APIs guaranteed by the canonical module manifest; prevent missing active gameplay dependencies from being silently skipped. Retain actual optional browser APIs and historical save migration.
- **5-3 — duplicate-flow and module-boundary consolidation (pending):** audit remaining reachable contract, lineup and roster flows; remove only proven duplicates and add parity regressions.
- **5-4 — final compatibility and acceptance (pending):** expanded regression and multi-season/save-resume checks, full CI and main-build verification before declaring stage 5 complete.


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

**5-3 and 5-4 are not included in stage 5-2.**

**Not included:** Stage 6 UI-state architecture; new patch, youth or transfer rules; deleting any historical save/patch/game record; globally replacing the bootstrap/domain-writer APIs with a new data model.
