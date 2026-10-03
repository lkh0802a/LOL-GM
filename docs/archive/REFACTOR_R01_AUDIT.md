> Documentation review 2026-10-03: [navigation](../README.md), [active priorities and validation](../DEVELOPMENT.md). Latest explicit user direction and later confirmed decisions supersede dated instructions; historical evidence is retained.

# R01 Dependency / Ownership Audit

Baseline: `main@0331ffa50a20fce7a4d4e2cd2e032e5c37221e95`

This audit is the entry point for Issue #62. It does not change game rules. The goal is to identify the actual source of truth and the smallest safe refactor boundaries before moving files or deleting compatibility code.

## Runtime shape

The standalone runtime now concatenates **74 classic-script modules** in the order declared by `scripts/artifact-modules.mjs`:

- 57 engine/domain modules
- 17 UI/application modules

The files are physically split, but dependencies remain implicit browser globals. Therefore file size alone is not the main refactor criterion. Mutation ownership, transaction entry points and caller count take priority.

Generated root `index.html` is not source. Canonical runtime source is `src/artifact/*`.

## Current source-of-truth map

| Domain | Current owners | Runtime entry / writer path | R01 finding |
| --- | --- | --- | --- |
| World action gateway | `state-transaction.js`, `state-player-actions.js`, `state-rollback.js` | `validateWorldAction → previewWorldAction/applyWorldAction → commitWorldAction` | Player sign/transfer/release/option already have a shared gateway and rollback scope. Preserve it. |
| Contracts | `contracts.js`, `contract-negotiation.js`, `contract-window.js`, `contract-agreement.js`, `contract-contact-ai.js`, `contract-market-behavior.js` | negotiation/market/window → `commitWorldAction(player.sign/player.option/player.release)` → domain writer | Negotiation state moved out of transfer; release preview/application/UI share contractReleaseCost. Accepted B1–B3 rules remain intact. |
| Transfers / recruitment | `transfer.js` | seller fee/recruitment → player negotiation → `commitWorldAction(player.transfer)` → `doTransfer` | Seller and player terms have explicit owners; permanent movement uses the existing player gateway. |
| Finance | `finance.js` | expense/transfer/wage APIs → cash + prepaid ledger; release obligation → annual settlement | Callers no longer write club cash directly. Payroll, obligations, forecast and closeout consume the same contract state. |
| Roster / registration | `roster.js`, `lineup.js` | shared gateway → roster.plan or roster.market-callup → roster writers | AI market maintenance now uses its own atomic command, preserving underfilled-market semantics and manager authority. Lineup owns match slots. |
| Calendar / world day | `calendar.js`, `timezone-calendar.js`, `broadcast-calendar.js` | season/window/offseason → setWorldCalendarDate; season → applyWorldDailyEffects | One raw date writer; raw positioning remains separate from daily effects. Worlds+14/day-15 boundaries are preserved. |
| Competition | `competition.js`, `league-aggregation.js`, `series.js` | season creates/advances competition state | No direct roster/cash/world-date mutation hotspot was found in the competition module scan. This boundary is comparatively clean. |
| Scouting | `scouting.js`, `scouting-ai*.js` | observation/report APIs and AI operations → finance expense API | Knowledge stays in scouting; dated operations consume calendar state; manual and AI costs use finance. |
| Medical | `medical.js` | exposure/recovery + player replacement gateway → finance wage API | Medical owns deterministic exposure; calendar orders daily effects; three-decimal replacement wages remain finance-owned. |
| Development / facilities | `development.js` | training/construction state → finance expense API | Board chooses investment; calendar activates completed construction; no UI copy of facility rules. |
| UI | `ui-*.js`, `app.js` | UI calls domain/controller APIs; `app.js` owns storage controller | Sampled management UI has no direct roster/cash writer. `ui-negotiations.js` consumes the engine `contractDurationPolicy` instead of copying duration rules. Keep UI as consumer, not rule owner. |
| Persistence | `save.js`, `save-migration.js`, `app.js` | `saveDB → packDB → IndexedDB/local fallback`; load → migration/normalization → `unpackDB` | World schema v15 / save format 2 compatibility is active product behavior, not removable legacy. |

## R01 baseline mutation findings (resolved below)

This section records the original findings, not the current caller graph.
R03 resolved cash/release ownership, R04 resolved clock ownership and R05
resolved the market-callup bypass. The final map above describes current code.

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

Canonical path is `commitWorldAction(roster.plan) → roster validation/application`.
AI market replenishment uses `commitWorldAction(roster.market-callup)` with the
same gateway/rollback and its own market-specific validator. Weekly move events
and full-roster registration requirements do not apply to market replenishment.

### World-day progression

Canonical in-season path is `season::playWorldDay → calendar::nextCalendarDate →
calendar::applyWorldDailyEffects`. Season/window/offseason raw positioning uses
calendar::setWorldCalendarDate without replaying daily effects.

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

## R02 source ownership guard

`scripts/mutation-ownership.mjs`, invoked by the existing static check using its
already-loaded sources, records 26 recognized sites across 13 runtime modules:
10 direct `.finance.cash` writes, 8 `.worldDate` writes, 5 assignment calls and
3 removal calls. The initial inventory also includes two staff cash writes and
the medical-replacement cash writer in `state-player-actions.js`; these were
missing from the R01 hotspot list and must be considered during migration.

The baseline is a migration ledger, not approval of each bypass. New modules,
additional recognized sites, removed sites and removed owner modules require an
explicit baseline review. Move the implementation, establish behavioral parity,
switch callers and shrink the old owner's counts in the same change. Bootstrap,
rollback and supported migration behavior must remain intact.

This is a conservative source-text guard: it recognizes direct dot/literal-bracket
cash/date assignments and calls to the two low-level roster writers. It does not
resolve aliases (`f.cash`), dynamic property names, indirect calls or equivalent
site replacement within one module. It also scans matching text inside comments
and strings. It complements code review and behavioral/save/rollback tests; it
does not prove a complete dependency graph or transaction correctness.

Focused guard tests cover a new UI cash writer, growth within an existing owner,
caller migration/removal, reads versus writes and literal bracket spelling.
Runtime code, RNG, save format and game rules are unchanged in this R02 step.

## R03 incremental finance writer migration

The signing-bonus and permanent-transfer paths now call
`finance.js::payFinancePrepaid` / `receiveFinancePrepaidTransfer`. They update
cash and its existing prepaid category together in the finance domain. Their
prior one-decimal cash rounding, category rounding, and transfer call order are
preserved. Player action transaction snapshots still own rollback. The ownership
guard now expects zero direct cash writes in `contracts.js` and `transfer.js`,
and records their two new writers in `finance.js`.

The follow-up moves facility investment, manual/AI scouting expenses and AI /
manager staff severance onto the same finance-owned expense API. Each caller
retains its existing affordability check and action flow; zero-cost severance
still does not create a prepaid row. The guard inventory now shows zero direct
cash writes in those caller modules too.

Medical replacement signing and daily conditional wages now use
`finance.js::payMedicalReplacementWage`, which preserves their three-decimal
cash and prepaid rounding. The medical acceptance continues to cover the
conditional-pay rules. Accounting paths that use a local `cash` alias remain
outside this conservative guard. Search actual callers and ledger categories
before each migration; do not claim all finance mutation is centralized yet.

## R03 player negotiation boundary

`contract-negotiation.js` now owns `world.negotiations`, negotiation identifiers,
player demand/rounds/reopening and final contract agreement. The implementation
is moved verbatim from `transfer.js`; all public names, RNG calls, terms and save
keys are retained. `transfer.js` retains recruitment tracking, seller fee
negotiation and permanent transfer execution. Player negotiations still consume
recruitment APIs and finalize through the existing player-action/agreement
gateways; this file split does not remove classic-script global dependencies.

The manifest loads the new domain before transfer/window consumers. Static
ownership checks require the player negotiation entry points in their new owner
and reject their return to transfer/contracts/finance. Existing negotiation-state,
contract-window, save/rollback and regression coverage remain the behavioral gate.
Next: converge offseason world-date writers while preserving B3 boundaries,
then address the AI reserve-callup bypass with parity coverage.

## R04 calendar clock owner

`calendar.js` owns `nextCalendarDate`, dated patch processing and
`applyWorldDailyEffects`, moved from season orchestration. All eight direct date
assignment sites in season/window/offseason now use `setWorldCalendarDate`; the
conservative mutation inventory has one raw date writer in calendar.js.

Raw positioning does not run daily effects. Contract exclusivity dates remain
Worlds+1 through Worlds+14, with outside contact on day 15. Offseason medical
recovery still positions at the last competition date before its full passive
recovery calculation, then moves to January 6. No additional daily tick, RNG
call or training/scouting/medical event is introduced. In-season daily effect
ordering and the lastDailyTick duplicate/backward guards remain intact.

Next: remove the AI reserve-callup bypass through roster-plan parity coverage,
then audit replacement-complete helpers for deletion and final compatibility QA.

## R05 AI market callup convergence

`contracts.js` now requests `aiMarketReserveCallups`; selection thresholds,
assignment order and report entries are owned by roster.js. Each atomic callup
uses `roster.market-callup` through the shared preview, stale-state check,
revalidation, scoped rollback and post-commit membership guard. Contracts retain
only the intentional signContract bootstrap/domain assignment.

Market replenishment is not a registered-season roster plan: releases can leave
an organization below minimum before FA signings refill it. Reusing weekly
roster.plan would reject historically accepted callups, and its squad events
would alter satisfaction. The dedicated market command preserves those
semantics while restricting execution to AI market maintenance and protecting
the managed club. No registration rule, RNG call or selection threshold changes.

market-reserve-acceptance.mjs compares five baseline scenarios, including
underfilled rosters, swaps and no-callup thresholds, across complete DB/report
and save/restore state. It also verifies pure previews, late-writer rollback and
manager authority. This acceptance is part of local check and the existing
shared Actions domain runner. Next: release-settlement ownership and final
legacy/dependency/compatibility audit.

## R03 final release / payroll source of truth

UI release confirmation, command preview and command application now consume
contracts.js::contractReleaseCost. Its existing medical/initial exemptions,
half-remaining-salary formula and unrounded precision are retained. Finance owns
release-obligation accrual plus payroll, top-five payroll and spending-tax reads;
these read helpers move verbatim and still consume the current contract state.
Immediate cash is unchanged; closeFinances remains the sole annual settlement.

The source ownership guard now covers direct finance.buyout assignments as well
as cash/date/roster mutations. Thirty cost cases and actual preview/apply/accrual/
save restoration are covered in contract-release-acceptance.mjs, included in the
shared CI runner. D04-B4 guarantees/termination remain feature work, not part of
this structural refactor. Next: remove proven unused wrappers and close the
compatibility/dependency audit with final full/parity QA.

## R06/R07 unused API and compatibility closure

Runtime + shell candidate inventory was followed by repository-wide source,
script/test and document searches. These private, unexported helpers had no
callers or persisted references and are removed:

| Removed helper | Former owner | Retained canonical path / evidence |
| --- | --- | --- |
| mulberry32 | random.js | RNG class; actual stream implementation unchanged |
| monteCarlo | engine.js | cancellable UI manager batches call simulateMatch |
| ensureChampionVisual | champion-data.js | creation/release/patch uses generatedChampionVisual directly |
| seriesOpeningDraft | series.js | createSeriesSession / seriesSessionPrepareGame, including managed resumable series |
| spendingTax | finance.js | actual accounting calls spendingTaxForPayroll |
| potLabel | ui-roster.js | observed player/scouting surfaces; no template or handler caller |

No supported runtime module is now empty, so there is no legacy file to delete.
The optional guards for UI_OVERLAY / uiEnhanceScrollRegions are removed: both
are mandatory manifest-owned dependencies. Overlay tests now explicitly supply
and observe this dependency. Browser API capability checks stay intact.

Retained low-frequency APIs have real acceptance callers: renewalDisposition,
rosterMoveCheck, rosterIntegrityErrors and autoBuildInitialSquad. World v15,
format-1-to-2 restoration, facility/staff normalization, parked fixture dates,
three local save slots, IndexedDB and local fallback are supported behavior,
not dead shims. No save compatibility path is removed.

Static checks reject the six removed names, required-UI optional fallback and
engine references to application UI/storage globals. These are conservative
source-text checks, not an alias-aware dependency proof. The ordered classic-
script runtime remains a deliberate build mechanism; directory/ESM conversion
is not required for domain ownership and is not fabricated as completed.

## R08 complete manifest / dependency and change map

The 73 modules at the R08 acceptance snapshot belong to the cohorts below. Dependencies are public
classic-script APIs, not ES imports. Manifest order controls top-level evaluation;
cross-domain function calls can resolve later declarations. Consequently this
table is an ownership/change map, not a claim of an acyclic import graph.

| Change area | Modules to inspect | Dependencies / consumers |
| --- | --- | --- |
| Pinned external snapshots | champion-source, system-source | Data normalization consumes snapshots; generated HTML is never source. |
| RNG and match rules | random, engine, draft, systems | Series/competition consume deterministic simulation; UI supplies commands. |
| Data and content naming | data, champion-data, system-data, champs2, content-naming | World/patch consume normalized templates and procedural naming. |
| Meta and patch | meta, patch, patch-balance, patch-content | Match evidence informs diagnosis; calendar triggers dated patch events. |
| Competition results | series, competition, league-aggregation | Consume simulation, roster/lineup eligibility and calendar schedule helpers; season orchestrates lifecycle. |
| Schedule construction | timezone-calendar, broadcast-calendar | Competition/season consume date/time helpers; no world-clock writer. |
| Player state and growth | player, development, player-relations, medical, role-conversion | Consume RNG, contracts, roster, staff and finance APIs; calendar orders daily effects. |
| World lifecycle | world, calendar, season, offseason, career | Compose domain APIs; world owns bootstrap, calendar owns clock, season owns phase orchestration. |
| Serialization | save, save-migration | Read domain state; migrate supported encoding; app owns storage I/O. |
| Player commands and membership | roster, lineup, state-transaction, state-rollback, state-player-actions | UI/AI share command gateway; domain application consumes contracts/finance; lineup owns match slots. |
| Governance | office, office-international | World/offseason consume regional/topology governance; retirement/restructure use intentional low-level roster removal. |
| Economy and contracts | finance, contracts, contract-market-behavior, contract-negotiation, transfer, contract-window, contract-contact-ai, contract-agreement | Contract terms feed finance; recruitment consumes scouting; persistent player changes enter shared gateway. |
| Scouting | scouting, scouting-ai, scouting-ai-ops, scouting-ai-reassessment | Consume calendar/player/finance; contract and draft queries consume observed knowledge. |
| Staff, practice and club features | staff, scrim-partner, scrim, features, draft-analysis | Consume player/roster/scouting/finance/simulation; draft-analysis does not own draft legality. |
| Contract UI | ui-negotiations, ui-market-initial, ui-market-staff, ui-market | Consume engine policy/previews and issue commands; no duplicate settlement rule. |
| Setup and information UI | ui-patch, ui-champion, ui-setup, ui-data, ui-player | Consume engine state; save-slot operations go through app controller. |
| Play and management UI | ui-match, ui-manager, ui-roster, ui-draft, ui-season | Consume domain commands and observed information; manager batches cancellable simulation. |
| UI lifecycle and storage | ui-overlay, ui-state, app | Overlay owns focus/modal lifecycle, state owns routing, app owns storage/async ownership tokens. Engine does not reference their globals. |

Names in the table have the `.js` suffix omitted. Conservative static checks
guard duplicate globals, mandatory dependencies, mutation ownership and engine
UI/storage isolation. Behavioral gates cover what text checks cannot: late
failure rollback, pure previews, save restoration and canonical seed results.

`scripts/refactor-parity.mjs` runs the same current full smoke and two-season
career oracle against the pinned R01 engine and current HEAD. It requires exact
SHA-256 equality for five smoke runtime/persisted result sets and ten career
runtime/persisted checkpoints, including two format-1 restores. Only saveId
(wall-clock storage identity) is excluded; no gameplay field or RNG state is
excluded. Existing assertions, seeds, match counts and seasons are unchanged.
This opt-in Actions evidence is in validation-smoke-parity/refactor-parity.json.

Completion requires the final PR full CI and explicitly dispatched parity gate
to succeed before merge, followed by main full CI. Issue #62 is the authoritative
completion status. D04-B4 and Android delivery remain subsequent work.


D04-B4d1 adds club-closure.js to player-command/governance composition.
Current manifest: 74 modules (57 engine, 17 UI). Office-directed closure uses
the gateway instead of direct roster removal; finance owns cash and unpaid claims.
This subsequent feature does not change the historical R08 acceptance evidence.
