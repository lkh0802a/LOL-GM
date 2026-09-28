# LOL GM 11.5 / Stage 5: Legacy cleanup and single rule ownership

## Goal and boundaries

Remove demonstrably unused compatibility stubs and duplicate rule implementations **without changing** gameplay, market decisions, saved-world representation, or the established 11.5 stage 3 transaction contract. This is deliberately a small domain-owned cleanup rather than deleting all historical data migration or rewriting source modules. World schema stays at **15** and compact save format stays at **2**.

## Consolidations

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

## Verification

- Regression **11d** checks legacy fallback reads are pure, manager preview matches roster-domain foreign registration and season-move rejection, naturalization/local eligibility works with a filled foreign quota, and rejected commands leave serialized world data unchanged.
- Regression **11e** checks transfer/release clear duplicate roster entries while preserving other players and successful save/load recovery.
- Regression **11f** guards removed dead APIs, policy-driven regional pay values and the active renewal negotiation route.
- CI checks forbid duplicate transaction-only registration and move-limit implementations or a reintroduced empty `PAY_SCALE` table. Smoke tests assert region-defined pay scales and absence of the removed table. Stages 1–4 regression, long-season performance, build and standalone sync remain mandatory.

**Not included:** Stage 6 UI-state architecture; new patch, youth or transfer rules; deleting any historical save/patch/game record; globally replacing the bootstrap/domain-writer APIs with a new data model.
