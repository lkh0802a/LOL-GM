> Documentation review 2026-10-03: [navigation](README.md), [active priorities and validation](DEVELOPMENT.md). Latest explicit user direction and later confirmed decisions supersede dated instructions; historical evidence is retained.

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
- facilities and club economy: `development.js` owns infrastructure levels, timed construction and physical training/analysis/recovery effects. `finance.js` owns budgets, prepaid cash movements, conservative forecasts and audited annual statements, while `offseason.js` chooses board investments and `calendar.js` activates completed construction on world days. See `docs/PHASE_12_FINANCE.md`.
- management domains: `office.js` (regions), `office-international.js` (global governance), `finance.js`, `contracts.js`, `contract-negotiation.js`, `transfer.js`, `scouting.js`, `staff.js`, `scrim.js`, `player-relations.js`, `features.js`, `role-conversion.js`, `career.js`
- draft information layer: `draft-analysis.js` (scouting-bounded mastery estimates, meta/composition evidence, opponent-intent explanation); legality and selection remain in `draft.js`
- domain UI: `ui-setup.js`, `ui-match.js`, `ui-manager.js`, `ui-data.js`, `ui-patch.js`, `ui-market.js`, `ui-market-initial.js`, `ui-negotiations.js`, `ui-market-staff.js`, `ui-champion.js`, `ui-player.js`, `ui-roster.js`, `ui-draft.js`, `ui-season.js`
- modal/keyboard ownership: `ui-overlay.js` (single dialog lifecycle, background inerting, focus containment/return, dismissibility policy for match reports, practice drafts and locked official First Selection)
- shared transient UI state and screen routing: `ui-state.js` (cross-screen view state, six routes, route bindings, scroll restoration and world-replacement reset). Programmatic route focus and keyboard access to overflowing tables are owned here; the markup shell carries the main landmark/skip link and narrow-screen/reduced-motion rules. Cooperative season-day/Monte-Carlo work carries a world/slot/view/render token; route changes cancel outstanding batches and persist completed days.
- Persistence controller: `app.js` serializes every write per save-slot key, prioritizes successful local fallbacks over stale IndexedDB writes on load, and atomically commits a new active slot only after outgoing save and incoming load succeed. UI navigation and interactions are blocked while a slot switch is in progress.
- application shell/controller: `app.js` (storage/bootstrap, shared read helpers and season landing surface)

The match, draft, item/rune, series and competition engines stay separate. `engine.js` owns one-game simulation; `draft.js` owns draft legality/selection; `series.js` owns First Selection/Fearless and best-of state; `competition.js` owns schedules/stages/standings. Scouting-bounded draft analysis stays in `draft-analysis.js`; interactive draft state and confirmation stay in `ui-draft.js`. `draft-preparation.js` reads the actual live pick context through existing legality/utility helpers; it does not create another session or selection policy. `ui-draft-analysis.js` owns existing candidate details, and `ui-draft-preparation.js` owns live comparison presentation and guarded selection back into the existing confirmation path. Focused acceptance is `draft-preparation-acceptance.mjs`; official modal locks, role uncertainty, opponent-private boundaries and pending-seed resume remain required.

`draft-history.js` owns event-time manual pick snapshots, public-sequence/source validation and observer-first private history reads. `draft.js` captures only actual manual confirmations, `series.js` persists authorized snapshots with original public draft order through scheduled commits, and `save.js` retains these source fields through existing lite compaction. `ui-draft-history.js` owns optional archived evidence presentation and revalidated current player/champion navigation, connected by `ui-match.js:renderSeries/bindSeries`. This does not recompute historical utility or certify replayed current-state explanations. Focused acceptance: `draft-history-acceptance.mjs` (scheduled full Bo3, exact seeded outcome/lines/public-meta parity, authority, legacy/pending/lite saves and source buttons).

`match-history.js` captures explicitly public actual game observations and validates archived sources; `series.js` is its writer and `save.js` retains them through lite saves. `ui-match-history.js` owns stored official result rendering and the Analysis Room match selector. Historical series clicks read these records rather than re-running current player state. `ui-match.js` gates owned current mastery/selection reasons and keeps internal explanatory instrumentation out of public result rendering. Focused acceptance: `match-history-acceptance.mjs`; 24-event excerpts, missing quiet/legacy evidence and original model limits remain explicit.

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

R06/R07 remove unused mulberry32, monteCarlo, ensureChampionVisual,
seriesOpeningDraft, spendingTax and potLabel. The supported RNG, batched
simulation, generated visuals, resumable series and finance payroll queries
remain canonical. UI overlay/state dependencies are required by the manifest;
engine modules may not consume application UI/storage globals.


Club closure is composed by club-closure.js through the system-only club.close
action. Office calls this gateway; roster release remains player-writer-owned
and cash/debt allocation finance-owned. The action journal additionally restores
club lifecycle, selected agreements/negotiations and the managed club fired flag.
Preview snapshots organization membership, contracts, finance and commitments.
Paid/unpaid closure statements persist; annual close excludes inactive clubs.
Separate club cash pools and player-only claims are explicit current scope,
not an assertion about insolvency law or parent guarantees.


D04-B4d2 adds financeTeamIds to closure canonical commands so an active supporting
parent is snapshotted and journaled even when only its reserve closes. The pure
funding plan protects parent claims, proposes matched cash transfers and then
reuses claim allocation. Finance owns both transfer sides; an active parent's
bounded closureSupportHistory is a settled cash record, not annual operating cost.
Closed statements retain funding details; old statements without funding remain valid.


Match/coaching ownership and recruitment ownership are distinct for owned-reserve
careers. managedTeamId remains the actual coached squad for match pauses and saves;
managedRecruitmentTeamId is null for an owned reserve so parent AI continues its
economic work. managerControlsSquad permits only that reserve's sporting controls.
Player-action and negotiation entry points independently reject academy-coach
recruitment; hiding controls alone is insufficient. Parent organization roster.plan
remains AI-owned. First-year academy start uses the shared global initial market,
then the coach confirms the provided roster without rebuilding it at finalization.


D04-B4d3 closure planning recovers a closing owned reserve's surplus after its
claims, then calculates parent support using recovered cash while protecting
parent claims. Negative reserve cash contributes to the liquidity gap when
player claims exist. Existing finance transfer writes and closure journal are
reused. cash_recovery and reserve_support describe matched internal transfers;
active-parent recovery history is bounded to 20 settled entries and never feeds
annual operating revenue. UI renders the transfer direction/kind; legacy support
rows without kind still display as support.


contract-market-behavior owns permanent-transfer consent. Decision evaluation
clones the target team/player and isolates market-demand cache so legacy
normalization in negotiation utilities cannot mutate original preview state.
Player transaction validation checks it for player.transfer and transfer-kind
player.sign, and canonical consent evidence is freshly recomputed before writes.
The transfer writer archives consent with the move; roster internal assignment
continues to use its separate gateway. AI candidate and swap selection reuse the
same consent policy instead of assuming club fee agreement authorizes the player.


D04-B4e2: contract-transfer-market owns AI permanent-transfer proposals and the
market purchase loop. It consumes shared player consent and sends retained/new
contracts to the existing atomic commands. Payroll room is computed from actual
contracts and cash after the fee, with no speculative swap credit. Proposal views
clone player/team data; contracts retains FA/renewal processing and invokes this
module once. Both standalone and engine manifests include the module.


D04-B4f1: player-relations owns signed-role promise status and its usage baseline.
Contract/transfer writers start the baseline inside existing atomic actions;
roster role edits leave promisedRole intact. Official usage tracks unavailable
medical games and satisfaction consumes eligible contract-relative appearances.
The current-role and contractual-role UI are distinct. Optional baseline fields
persist with existing player/contract saves and rollback snapshots.


D04-B4f2/B4g1: player-representation owns embedded stable agent entities and
oral role promises. It registers player.promise with the existing atomic handler
registry after player actions. The player journal already captures promise/agent
fields and career events. Satisfaction selects the stronger commitment and reuses
one usage evaluator. Representatives shape negotiating demands and patience, not
client utility. UI-player-commitments owns compact status and confirm/cancel
controls; player detail/roster delegate to it. Agents/promises are optional save
fields; no second contract, roster, finance or preview ledger is introduced.

상단 내비게이션과 표시 상태는 `ui-state.js:updateAppNavigation`, 공통 토큰·레이아웃은 `shell.html`이 소유한다. 주요 이동은 모바일을 고려해 상단에 유지한다. 시작 전에는 새 게임/불러오기, 커리어 시작 후에는 기존 목적별 route를 표시한다. 분석실 경기 복기는 `ui-match-history.js`의 목록/선택 요약/실제 기록·사건·밴픽 탭으로 구성하며 transient review/reviewTab 상태와 source authority를 분리한다. 전체 도메인 UI 교체는 12.3–12.5의 다음 실제 연결 검증 단위로 남는다.

`match-adjudication.js` owns the first nexus terminal state and aggregate event clock, independent of optional trace storage. `engine.js` applies termination guards to actual phases/actions and final duration; `seriesResultLines` and public official observations consume that exact duration. `match-history.js` preserves/validates optional versioned ending provenance; old observations remain unchanged. `ui-match-history.js` shows only stored ending source. Acceptance: match-adjudication/match-ending plus real official pending/save/review and quiet/logged parity. This is an ordered aggregate model, not exact simultaneous geometry; Purchase ledger follows in DEVELOPMENT 8.2.1; source-backed XP/wave adjudication remains 8.5.1.

`item-purchases.js` owns pure pinned recipe/inventory validation and atomic actual-bank purchase commits; systems owns plans, engine owns cash accrual/cache revision, role-quest-match owns existing free transforms and actual ward debit. match-history owns optional actual resources v1 validation, ui-match-history owns optional archived economy presentation, save retains whole publicRecord in full/lite histories. Focused verification: item-purchase-ledger-acceptance, system-patch-experiments and real official pending/history browser flow. No manager purchase command, generic earned-power redesign, new refund or complete exclusive metadata is implied. Startup three-action replacement remains the next authorized UI slice; engine source priorities are DEVELOPMENT 8.2.1/8.5.1.


## 구매 장소 조사 도구와 구현 경계

`scripts/shop-availability-probe.mjs`는 테스트 harness의 실제 엔진을 독립 VM에서 실행한다. `npm run investigate:shop -- --output=/tmp/shop-probe.json`으로 기본 네 시드/기록·무기록을 관측하고 `--seeds=seed1,seed2`로 1–8개 시드를 지정한다. 도구는 제품 모듈/저장 형식에 포함되지 않는다. 원래 함수와 같은 입력의 승패·개인 기록·골드/장비/퀘스트·종료·기록/설명 동등성 및 세계 저장 불변을 검사한다. 합성 직접 writer 호출은 물리적 위치 또는 공식 경기 증거로 사용하지 않는다. 귀환·사망은 `engine.js`, 장비 골드 writer는 `item-purchases.js`, 와드 골드 writer는 `role-quest-match.js`가 소유한다. 아직 실제 기지/복귀 가용성이 구매에 연결되지 않았으며, 출처 없는 시간을 추가하지 않는다. 현재 증거·원자료 요청 제한·구체적인 연결 수용은 DEVELOPMENT의 8.2.2에 유지한다.


## 8.3.1 장비 기반 방어 소비

`system-data.js:itemDefenseStatEffect`는 기존 source 정규화에서 HP/armor/MR의 방어 proxy 기여만 분리한다. 새 `itemDefs.defenseStatEffect`는 source 기준으로 저장되고 legacy 누락은 순수 읽기로 유도한다. `systems.js:inventoryDefenseStats`는 실제 inventory/퀘스트 장비의 raw stats를 합산한다. `engine.js`는 base+level+gear를 사용하며 동일 raw proxy를 중복 적용하지 않고 기존 effect delta/비수치 proxy와 aggregate식을 유지한다. patch revision은 실제 combat cache 갱신에 포함한다. 장비/장부 writer, 공식 source/history UI와 저장 소유권은 바뀌지 않는다. `inventory-defense-acceptance.mjs`와 기존 ledger/ending/patch/domain runner가 소비 경계를 확인한다. 이 절 작성 당시 공격 earned-gold는 미완료였고 아래8.3.2에서 현금 경로를 제거한다. 전체 raw stat/effect mechanics는 아직 미완료다. 과거 공식 source는 재계산하지 않는다.


## 8.3.2 공격 장비 소비

`system-data.js:itemAttackStatEffects`는 기존 정규화의 AD/AP source 기여를 분리해 저장한다. `systems.js:inventoryAttackStats`는 실제 inventory/quest equipment의 raw AD/AP를 읽으며 legacy split을 순수 유도한다. `engine.js:combatStats0`는 base+level+owned AD를 소비하고 raw AD의 기존 proxy 중복 및 cash conversion을 제거한다. 기존 AP/AS/crit는 집계 proxy로 남으며 MID bonusPower는 장비 AD/남은 AP 기여에 적용한다. 구매/패치/퀘스트 cache, 원자적 장부와 source/UI/history 소유자는 유지한다. 집중 acceptance는 inventory-offense, 기존 실제 scheduled draft-history 및 domain runner에 있다. 전체 피해/주문/가용성·shop 구현으로 확대 주장하지 않는다.


## 8.4.1 교전 자원·실제 기록 연결

`combat-resources.js:applyFightDamage`는 target remaining aggregate EHP를 소비하는 작은 shared writer다. module list에서 engine 앞에 로드하며 기존 quest/terminal 함수를 소비한다. `engine.js:fight`는 실제 starting/survivor HP fraction, 기존 queued order/RNG를 유지하고 effective packet 결과를 공통 writer에 전달한다. `simulateMatch.damageBasis`→`match-history.js:publicMatchRecord` optional source→`ui-match-history.js` 공식/분석 설명→기존 full/lite save로 이어진다. legacy는 source를 추정하지 않는다. `combat-resource-acceptance.mjs`가 writer/fight/official/source/UI/legacy/저장 경계를 확인한다. engine size budget을 바꾸지 않았다. 나머지 효과/피해/동시 처리 및 old record의 진짜 source 인증은 별도 미완료다.
