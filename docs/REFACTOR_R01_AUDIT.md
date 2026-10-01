# R01 Dependency / Ownership Audit

Baseline: `main@0331ffa50a20fce7a4d4e2cd2e032e5c37221e95`

This audit is the entry point for Issue #62. It does not change game rules. The goal is to identify the actual source of truth and the smallest safe refactor boundaries before moving files or deleting compatibility code.

## Runtime shape

The standalone runtime currently concatenates **71 classic-script modules** in the order declared by `scripts/artifact-modules.mjs`:

- 54 engine/domain modules
- 17 UI/application modules

The files are physically split, but dependencies remain implicit browser globals. Therefore file size alone is not the main refactor criterion. Mutation ownership, transaction entry points and caller count take priority.

Generated root `index.html` is not source. Canonical runtime source is `src/artifact/*`.

## Current source-of-truth map

| Domain | Current owners | Runtime entry / writer path | R01 finding |
| --- | --- | --- | --- |
| World action gateway | `state-transaction.js`, `state-player-actions.js`, `state-rollback.js` | `validateWorldAction → previewWorldAction/applyWorldAction → commitWorldAction` | Player sign/transfer/release/option already have a shared gateway and rollback scope. Preserve it. |
| Contracts | `contracts.js`, `contract-window.js`, `contract-agreement.js`, `contract-contact-ai.js`, `contract-market-behavior.js` | negotiation/market/window → `commitWorldAction(player.sign/player.option/player.release)` → `signContract` | B1–B3 rules are already implemented. Do not rebuild. Ownership is split across several modules and negotiation state still lives in `transfer.js`. |
| Transfers / recruitment | `transfer.js` | recruitment/negotiation → `commitWorldAction(player.transfer/player.sign/player.release/player.option)` → `doTransfer` / player action writer | `transfer.js` currently owns recruitment, generic negotiation state and permanent transfer execution helpers. Boundary with contracts is broader than the filename suggests. |
| Finance | `finance.js` for forecasts, statements and prepaid ledger | domain writer mutates cash + `recordFinancePrepaid` | Cash ownership is distributed. Direct `team.finance.cash` writes exist in contracts, transfer, medical, scouting, scouting AI and facilities/development. This is the clearest R03 consolidation target. |
| Roster / registration | `roster.js`, `lineup.js` | roster plan / eligibility helpers; low-level `assignPlayerToTeam`, `removePlayerFromTeam` | Most permanent player movement uses shared helpers. One important bypass remains: AI reserve call-up inside `contracts.js` directly calls `assignPlayerToTeam` instead of the roster-plan transaction path. |
| Calendar / world day | `season.js` for normal daily progression; `timezone-calendar.js`, `broadcast-calendar.js` for schedule construction | `playWorldDay → nextCalendarDate → applyWorldDailyEffects` | Normal-season ownership is clear, but `contract-window.js` and `offseason.js` directly assign `db.worldDate`. The post-Worlds contract clock is a second mutation path that R04 must converge without changing B3 date semantics. |
| Competition | `competition.js`, `league-aggregation.js`, `series.js` | season creates/advances competition state | No direct roster/cash/world-date mutation hotspot was found in the competition module scan. This boundary is comparatively clean. |
| Scouting | `scouting.js`, `scouting-ai*.js` | observation/report APIs and AI operations | Scouting knowledge ownership is localized. Manual and AI scouting both debit club cash directly, so finance integration is cross-domain. |
| Medical | `medical.js` | medical state + replacement actions; replacement sign/release uses world action gateway | Player medical state is localized, but replacement wages directly mutate club cash before recording prepaid finance rows. |
| Development / facilities | `development.js` | training/facility state | Facility investment directly mutates club cash and records prepaid finance rows. |
| UI | `ui-*.js`, `app.js` | UI calls domain/controller APIs; `app.js` owns storage controller | Sampled management UI has no direct roster/cash writer. `ui-negotiations.js` consumes the engine `contractDurationPolicy` instead of copying duration rules. Keep UI as consumer, not rule owner. |
| Persistence | `save.js`, `save-migration.js`, `app.js` | `saveDB → packDB → IndexedDB/local fallback`; load → migration/normalization → `unpackDB` | World schema v15 / save format 2 compatibility is active product behavior, not removable legacy. |

## Code-backed mutation hotspots

### 1. Finance mutation is not actually finance-owned

The following domain modules write club cash directly and then call `recordFinancePrepaid`:

- `contracts.js`: signing bonus
- `transfer.js`: transfer fee credit/debit
- `medical.js`: replacement-player wage
- `scouting.js`: manual scouting cost
- `scouting-ai-ops.js`: AI scouting cost
- `development.js`: facility investment

This means the ledger has a shared recorder but not a shared atomic money writer. R03 should introduce finance-owned debit/credit/transfer primitives and move callers one at a time, preserving current rounding, rollback and accounting categories.

### 2. Roster-plan gateway has an AI call-up bypass

`contracts.js::contractMarket` performs reserve call-ups with direct `assignPlayerToTeam` calls for the candidate and displaced starter.

That conflicts with the current architecture rule that manager and AI reserve decisions should pass the same final-state roster-plan validation. It should not be patched inside R01. First add parity coverage, then move this caller to the canonical plan/action path.

### 3. Calendar mutation has two owners

Normal play advances through `season.js::playWorldDay` and `applyWorldDailyEffects`.

Post-Worlds contract handling separately changes the clock in:

- `contract-window.js::initOffseasonContractWindow`
- `contract-window.js::closeExclusiveContractWindow`
- `contract-window.js::advanceOffseasonContractDay`
- `offseason.js` rollover transitions

B3 acceptance currently locks Worlds+14 expiry and day-15 FA opening. Any R04 clock consolidation must preserve those exact boundaries and medical/facility/day effects.

### 4. Low-level writers that are intentional

Do not delete or hide these merely because a higher-level gateway exists:

- `contracts.js::signContract`: domain writer used by transaction application and world bootstrap
- `transfer.js::doTransfer`: permanent-transfer domain writer used by player action application
- `roster.js::assignPlayerToTeam/removePlayerFromTeam`: low-level roster writers still needed by bootstrap/migration/internal application
- `save-migration.js`: supported v15 format migration

The refactor target is unauthorized caller count, not the existence of low-level writers.

## Canonical transaction/change map

### Signing / renewal

`UI / AI / contract window → commitWorldAction(player.sign) → state-player-actions::applyPlayerSignAction → contracts::signContract → roster assignment + contract state + finance prepaid entry`

### Permanent transfer

`transfer negotiation → commitWorldAction(player.transfer) → state-player-actions::applyPlayerTransferAction → transfer::doTransfer → roster assignment + contracted-move record + cash/ledger`

### Release

`UI / market / system → commitWorldAction(player.release) → state-player-actions::applyPlayerReleaseAction → roster removal + contract clear + buyout accounting`

### Roster planning

Canonical path is `roster plan validation/preview/apply` with `roster.js` owning local-registration and move-limit rules. The AI reserve call-up in `contracts.js` is the known exception to remove after parity coverage.

### World-day progression

Canonical in-season path is `season::playWorldDay → nextCalendarDate → applyWorldDailyEffects`. Offseason contract-window date mutation is the known parallel path.

### Save/load

`app::saveDB → save::packDB → IndexedDB/local fallback`

`app::loadDB → save-migration validation/migration → save::unpackDB → runtime normalization`

## Legacy / compatibility classification

### Must retain

- world schema v15 and save format 1→2 restoration support
- three active save slots and local fallback behavior
- generated standalone build artifact flow
- low-level bootstrap writers that still have real callers

### Already removed / guarded

Existing architecture checks already reject duplicate top-level globals and earlier Stage 5 work removed known unreachable wrappers. No additional file should be deleted from age/name alone.

### Deletion rule for R06/R07

A candidate is deletable only after:

1. caller search is zero,
2. replacement path has equivalent acceptance coverage,
3. save/API compatibility is checked,
4. final full regression is green.

## Refactor order derived from this audit

1. **R02 — mutation boundary guardrails:** add a small source-backed ownership acceptance that records the current authorized low-level writers and prevents new direct cash/date/roster mutation sites while refactoring.
2. **R03 — finance transaction primitives:** centralize cash debit/credit/transfer without changing accounting categories or numerical behavior; migrate contract/transfer callers first.
3. **R03 — contract/transfer boundary:** separate generic negotiation state from permanent-transfer execution, keeping one player-action gateway.
4. **R04 — calendar ownership:** route offseason contract-window day movement through a shared clock primitive while preserving B3 exact-date acceptance.
5. **R04 — scouting/medical finance callers:** migrate their cash writes to the finance primitive.
6. **R05 — roster caller convergence:** move the `contractMarket` reserve-callup bypass onto the canonical roster-plan path.
7. Only after caller counts reach zero: remove redundant wrappers/shims under R06/R07.

## Non-goals

- no gameplay balance changes
- no RNG sequence changes
- no contract threshold/probability changes
- no save schema bump
- no Android wrapper/framework selection
- no large directory move until the above caller boundaries are stable
