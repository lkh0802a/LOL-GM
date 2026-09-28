# LOL GM 11.5 — Stage 5: Legacy and duplicate logic cleanup

Work is split into four independently merged and CI-verified substages.
Do not remove old-save migrations or change engine rules just to reduce lines.

## 5-1 — Canonical player registration and move-count rules

**Scope:** `roster.js` owns the single pure interpretation of a player's
effective local region, team nonlocal quota and contracted club moves per
season. `state-player-actions.js` consumes these pure functions for manager,
AI and system previews instead of maintaining local copies of the formulas.

- Introduce `playerLocalRegionView`, `isLocalPlayerReadOnly`,
  `teamNonLocalCountReadOnly`, `localRegistrationErrorReadOnly`,
  `contractedMoveCountReadOnly` and `contractedMoveErrorReadOnly`.
- Preserve public legacy domain operations (`isLocalPlayer`,
  `localRegistrationError`, `contractedMoveError`), including their
  intentionally lazy `ensurePlayerEligibility` normalization for low-level
  domain writers. Both paths delegate to the same canonical rules.
- Remove transaction-only duplicate local-region, registration and
  contracted-move formula implementations.
- Make snapshots count foreign players with the same nonmutating quota helper.
- Retain exactly the same import limits, ownership checks, registration errors,
  two-seasonal-moves cap, contract financial terms and save schema.
- Regression `11d`–`11e` verifies read-only behavior even for unnormalized
  older player fields, parity with domain writers, open/closed import slots,
  counted versus exempt moves, season boundaries, actual commit and save/load.

**Acceptance:** syntax/structural baseline, original stage 1–4 regression
suite, new parity checks, world smoke/performance/standalone production build,
PR CI, merge, and post-merge main CI + standalone sync.

## 5-2 — Dead code and compatibility-surface audit

Search for unused helpers, unreachable UI routes and obsolete aliases. Remove
only references proven unused by source inventory, dynamic UI event discovery
and regression tests. Retain required compatibility for world-v15 format-1
saves and live engine bootstrap.

## 5-3 — Domain-path and module-boundary consolidation

Consolidate remaining duplicate contract/roster domain decisions and improve
module ownership, without changing AI decisions, negotiation flow or economics.
Add parity tests for the affected paths.

## 5-4 — Full removal verification

Audit build/check/smoke/perf, simulate career restore and season progression,
and verify no removed symbols, no stale compatibility references and no
generated artifact drift. Merge only after PR/main CI is green.

**The latter three substages are not part of 5-1.**
