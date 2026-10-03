# LOL GM — Development Guide

## Current direction and handoff

The canonical repository is lkh0802a/LOL-GM. Implement the full authorized game scope under the unified numeric development roadmap, then bounded verified UI/engine refinements. A
stage name, module count or old acceptance does not prove whole-roadmap completion.
No consolidated source-backed completion percentage is currently established.
Desktop/mobile offline standalone HTML comes first; Android packaging comes later.

Read [document navigation](README.md), [specification](LOL_GM_SPEC.md),
[decisions](DECISIONS.md), applicable confirmed rules, and the relevant source.
Latest explicit user instructions take precedence. Preserve the fictional league;
real esports informs credible behavior, not automatic replacement of its rules.

One implementation worker, no parallel agents. Each hourly run selects a coherent
45–55-minute implementation slice including focused acceptance and documentation.
State scope/estimate before edits. Combine related tasks, split larger features
at a natural vertical boundary, and record precise continuation. Merge/CI/HTML
publication are required follow-through, not the implementation slice itself.
Check branch/PR/current main and ownership before editing; do not assume local
files or another worker's unpushed changes exist in Cloud.

## UI 전면 재설계 — 승인된 현재 범위

사용자는 기존 내부 기능과 화면의 괴리가 크다고 지적했고, 부분적인 외형 수정 대신 UI 전면 재설계를 승인했다. 이 결정은 구현 예정 범위이며, 현재 리그 선택 표시 수정만으로 재설계 완료를 주장하지 않는다. 기존 엔진, 공유 명령, 권한, AI 동등성, 저장 호환성과 게임 기록을 유지하면서 사용자 작업 흐름과 화면 구조를 다시 설계한다.

- **12.3 운영 흐름과 화면 구조:** 실제 현재 화면/명령을 전수 연결 점검하고 구단 현황 → 필요한 일 → 선수·계약·훈련·대회/경기 → 결정 → 결과 확인 흐름을 설계한다. 현재 상태, 가능한 행동, 조건·비용·제한 및 결과의 이유를 일관되게 배치한다. 메뉴 이름만 바꾸거나 가짜 버튼을 추가하지 않는다. 산출물은 기존 문서 내 화면/기능 연결 목록, 우선순위 및 실제 첫 운영 화면 구현이다.
- **12.4 화면별 교체와 기능 연결:** 구단 현황과 내비게이션부터 선수/로스터·계약/시장·스태프/훈련·대회/일정·밴픽/경기·결과/통계·재정/사무국·저장/설정까지 자연스러운 세로 단위로 교체한다. 모든 영역을 검토하되 실제 확인한 의존성과 결함에 따라 순서를 조정한다. 국가별 2부/연고국/육성 거점과 중계 일정도 해당 엔진 구현과 함께 UI에 연결한다. 기존 화면은 동등한 필수 기능이 새 화면에서 작동하는 것을 확인한 뒤 교체한다.
- **12.5 일관성·편의성과 집중 검증:** 반복 입력·불필요한 이동·중복 알림을 줄이고 검색/필터/선택 맥락을 유지한다. 반응형 정보 배치, 표·스크롤, 키보드/포커스, 폼 오류, 로딩/빈 상태/저장 피드백을 검증한다. 직접 운영 기본값과 의미 있는 선택은 보존한다. 집중 브라우저/레이아웃 검사는 허용하며 최종 장기/실기기/TalkBack QA는 계속 보류한다.

**수정하기 쉬운 구조도 필수 기준이다.** 화면 표시/내비게이션과 엔진·공유 명령의 상태 변경을 분리한다. 공통 버튼·폼·표·오류/저장 피드백은 실제 반복되는 범위에서 재사용하고 색상·간격·타이포그래피와 반복 문구는 중앙 정의로 관리한다. 도메인 화면은 책임이 명확한 모듈로 두며 거대한 단일 화면 파일, 규칙 계산 복제, 불필요한 프레임워크/의존성·추상화 계층을 피한다. 기존 모듈/빌드 제약과 standalone HTML을 먼저 확인하고 단순한 명시적 인터페이스를 우선한다. 각 화면의 소유 모듈, 호출하는 엔진/명령 진입점과 집중 검증 방법을 문서에 남겨 다음 수정 위치와 영향 범위를 쉽게 찾을 수 있게 한다. 실제 구현으로 이 기준을 입증해야 하며 문서 작성만으로 구조 개선 완료를 주장하지 않는다.

각 교체 단위의 완료 조건은 **화면 조작 → 권한/조건 확인 → 실제 공유 명령·엔진 반영 → 관련 화면의 상태와 결과/이유 표시 → 저장·재접속 상태 유지**다. 실패·취소 시 rollback과 중복 실행 방지도 필요한 경로에서 확인한다. 내부 함수만 있거나 화면만 있는 기능은 완료가 아니다. 기능/권한/저장 의미 변경은 UI 정리로 숨기지 않는다.

한 명의 구현 담당자가 기존 시간당 45–55분 단위로 진행한다. 현재 열린 PR의 실패를 보존·해결하고 중복 작업을 피한다. 기존 PR #164의 head `575d6203d605672173777411c32f19a6807755bc` 필수 CI에서 smoke(core)가 35초 제한으로 실패했으므로, 해당 변경은 아직 병합/배포 완료가 아니다. 재설계 구현은 별도 검토 가능한 작업 단위/PR로 진행하고 정확한 현재 head의 필수 CI 성공 후 순차 병합·HTML/웹 배포한다. 다음 재설계 단위는 12.3이며, 전면 교체가 끝났다는 선언보다 실제 화면별 연결 증거를 기록한다.

## Unified numeric roadmap

This is the development task hierarchy, not a change to internal game architecture.
Current work uses numeric stages, task names, goals, completion criteria and
precise remaining work. Existing
implementation and validation evidence remain preserved in the historical archive.
Each substantial work unit uses a dotted number and a coherent 45–55-minute boundary.

| Stage | Current scope | Acceptance boundary |
| --- | --- | --- |
| 1. Foundation and new game | world/team selection, initial FA supply, identity/calendar | Previously verified foundation; reproduce legal starts, budgets/registration and save; confirmed zero-substitute supply defect remains |
| 2. Players, medical and development | ability, roles, relationships, fatigue/recovery, growth/retirement | Existing medical and relationship systems; observed causes, actual practice/match effects, save/AI parity |
| 3. Scouting and prospects | cohorts, observation uncertainty, stale reports, shortlist comparisons | Existing observation systems; no hidden-information shortcuts, legitimate observed AI decisions |
| 4. Contracts and transfer market | consent, negotiations, representatives, loans, payments, insolvency | Existing contracts and loans; full command/UI/finance/save/rollback and remaining claim/lifecycle scope |
| 5. Clubs, squads, staff and facilities | owned reserve authority, movement, staff contracts/departments, facilities/governance | Existing organization/staff systems; sporting/economic authority and actual employment effects |
| 6. Training and scrims | shared time/resource budget, plans, partner availability, private observations | Existing practice systems; opportunity cost, no duplicate resource use, official/private separation |
| 7. Draft, tactics and series | composition, matchups, mastery, public evidence, First Selection/Fearless | Existing draft plus contextual selection work; actual decisions/series effects, manual locks |
| 8. Match adjudication | purchases, combat/resources, minions/camps, vision, rotations, side lanes, objectives, nexus | Existing match systems; causal scenario acceptance and professional-only empirical calibration |
| 9. Balance patches and meta | champion/item/rune and minion/camp/objective rules, diagnosis/adaptation | Existing patch systems; real consumers, dated snapshots, avoid unjustified buff/nerf oscillation |
| 10. Leagues, competition and history | domestic/international slots, registration/license, seasons, standings, records | Existing competition/world work; confirmed fictional rules and historical attribution |
| 11. Finance and club strategy | cash, liabilities, sponsor/operating flows, AI budgets/medium-term choices | Existing finance/insolvency work; affordability, shared settlements, no invented prices/fees |
| 12. Product, UI, saves, performance and delivery | all-domain convenience, accessibility, offline HTML/web, save integrity, measured bottlenecks | Authorized full UI redesign (12.3–12.5); actual screen→command→engine→result→save acceptance, useful decisions, parity/rollback and stable delivery |
| 13. Playtest fixes and final verification | user playtest → feedback fixes → final long/device/TalkBack QA → Android | Final acceptance; 100-season/device QA cannot start before feedback/fixes |

**Immediate numbered work and evidence:**

- 10.1 League identities and Americas: current implementation uses L-prefixed
  three-letter major pairs LCK/LKC, LPL/LDL, LEC/LEA, LCS/LNA, LCP/LPA,
  LSA/LSC. New careers have real tier twos in all six major regions; newly
  founded leagues must create and retain tier two. South America replaces the
  Brazil-only preset; Central America/Caribbean is a North American child market.
  Legacy geography, competition keys, player local identities/contracts and
  historical labels remain; generated display aliases alone are repaired.
  Evidence: `league-identity-acceptance.mjs` covers legal initial formation,
  actual scheduled tier-twos, displayed picker labels, save keys/history/custom
  names, new regional/future league formation and required-tier abolition guard.
  Exact-head CI and validated publication remain required before completion.
- 10.2 Country-level tier twos under integrated regions: confirmed next slice.
  Add independently selectable club home-country, reserve development/operating country and country league membership; build separate
  real tier-two schedules/standings and selection while retaining umbrella top
  tier, regional local eligibility, parent authority and event-time attribution. Reserve development may be outside the parent home country; admission belongs to the office and location alone cannot rewrite athlete nationality/local eligibility.
  League offices own promotion/relegation eligibility, places, qualifiers and effective dates; the developer connects decisions to actual next-season membership. Owned reserves cannot join their parent in tier one. No inferred nationality from region codes or copied real league policies.
  Current region-wide tier-two leagues are not acceptance for this country scope.


- 8.1 Nexus-based match ending: PR #163 passed required exact-head CI and merged;
  publication-head main validation remains the delivery gate. No gold-timeout winner; transparent computation guard, ordinary-match
  parity, post-70 natural resolution and failure without official result.
- 8.2 Item purchase legality: pinned unique/exclusive groups and actual writer
  checks, allowed repeated materials/consumables, recipes, slots, costs/quest/champion
  exceptions. Source group metadata is missing; acquire before inventing rules.
- 8.3 Resource and power: earned/unspent/spent gold, actual inventory and levels,
  purchase timing/scaling; first measure generic gold-stat versus item effects.
- 8.4 Coordinated counter-items: apply/allocate healing reduction and armor
  reduction with reviewed stacking, eligible applicators, uptime and opportunity cost;
  distinguish team reduction from personal penetration.
- 8.5 Waves/camps and 8.6 macro conversion: expand existing proxies vertically,
  preserving current lane/jungle/objective/fight code; use actual patchable rules.
- 7.1 Draft/series and 9.1 patch consumption: inspect existing causal gaps, preserve
  legitimate observed information, update one proven path at a time.
- 8.7 Professional calibration: collect validated competition-only data, group
  chronological holdouts and compare distributions. Source networking is blocked.
- 12.1 Document navigation/status consolidation and 12.2 stable web/offline HTML:
  current delivery work. Review existing behavior before declaring every domain complete.
- 1.1 Legal initial FA supply: already reproduced and independent of blocked
  professional/group data; continue if external acquisition remains unavailable.

This is a unified scope/trace, not an accepted global completion count. Each stage
updates actual implementation, tests, failures and remaining work; repeated new
roadmaps are not substitutes for implementation.

## Current evidence and next work

- PR #162 (`92ce5a9b29d86af69d4573056c32302a7cbba774`) passed all 13 required
  checks in Actions 37128893953 and merged as `abed56c8d7467c022a1ea2d21db294914bf00a49`.
  Publication main `8e7e5a438f47517c10207d5ef9cbb998b97f571c` passed all 14
  required checks in Actions 37129437786, including standalone-sync. Both medical
  runs contain core + four seed + two aggregate successes.
- Delivered: owned-reserve manual training, lineup, roster roles and conversion
  choices survive daily/offseason AI; valid manual starters survive internal
  movements. Reserve-only coaches retain sporting authority; AI parents retain
  economic authority. Focused route: 121 official matches, save/idempotence,
  invalid-slot repair and exact rollback. Details are preserved in the history.
- Verified next bootstrap gap: KR eight-parent/eight-reserve subs=0 produces 85
  available players for 88 required; career construction fails. NA also fails.
  Fix legitimate initial FA supply while preserving global FA, budgets, registration
  and confirmed integrated minimum 11. Cover zero/default subs and each career type.
  Original evidence: `/tmp/owned-coaching-zero-subs-evidence.log` and reproductions.
- Untested hypothesis: loan movement force=true may overwrite valid manual lineup
  choices. Reproduce before changing player-loans; do not describe it as confirmed.
- User-requested engine priority: realistic draft, match and balance-patch decisions,
  backed by competition data only. Read [source and calibration policy](CHAMPION_DATA.md#competition-only-calibration).
  Gold is an advantage, not a victory condition; win must follow nexus destruction.
  The 70-minute gold-winner fallback is reproduced: injected structure stall
  returned a winner with both nexuses alive. Now removed: ordinary tick/fight/
  structure conversion continues after 70 until nexus destruction, with an
  explicit failure at a 180-minute computation guard, not a tournament time rule.
  An injected stalled match fails without changing career state; a released stall
  resolves after 70 through actual nexus destruction. A bounded 32-game normal sample has
  no cap hits; it is not global balance evidence. Original logs remain under
  `/tmp/match-ending-baseline.log`. Replace the fallback; retain honest failure. Gold-derived class stats alongside item effects,
  fixed combat multipliers and historical patch-strength attribution are review
  candidates, not already measured balance defects.

## Validation, integration and preservation

Every PR and main push runs full required CI, including medical core, four seed
shards, two aggregate invariants and verify. Merge sequentially only after all
required checks succeed on the exact current PR head; recheck head/main before
merge. Rebuild standalone HTML from integrated main and verify publication-head
CI/standalone-sync. Attach each created PR. Canceled/failed runs are not successes.
See [CI result guide](CI_RESULTS.md). Standard public ubuntu-latest is authorized;
paid runners, billing changes and budget increases are not.

Preserve failures, original diagnostics, historical source/records, save compatibility,
AI/player rule parity, observation boundaries, permission checks and rollback.
Do not assume prior machine diagnostics are present or recreate/delete them.
Do not hide failures with record deletion, production GC, budget increases or
instrumentation removal. Internal seeded tests are allowed; seed controls are not
player features. Only optimize measured bottlenecks; verify result/RNG parity for
behavior-preserving changes and identify intentional gameplay changes separately.

Long 100-season, real mobile/device and TalkBack final QA remain deferred until
implementation and user playtest feedback/fixes are complete. Focused UI/browser,
scenario and bounded profiling checks are allowed. Final QA limits remain heap
1536 MiB / RSS 4096 MiB. After roadmap and authorized refinements, wait for playtest
feedback/design priorities; do not repeatedly rerun unchanged reviews.

## Functional and convenience acceptance

A feature must connect actual controls, shared domain validation, engine effects,
AI, saves and failure/rollback paths. No fake buttons, decorative engine numbers
or completion inferred from function presence. Direct management is the default;
delegation requires an explicit authorized scope. Preserve useful decisions while
reducing repeated navigation/inputs; use atomic final-state multi-edit validation,
actionable error messages, filter/scroll retention and focused keyboard checks.
Aggregate spell profiles are not exact casts, geometry or hitboxes. Unknown source
mechanics remain unknown; do not invent CC timings, real policies, asset prices or
mandatory agency fees. Source stats and professional observations are distinct.

## Documentation review and engine acceptance limits

All root docs have been reviewed/classified as active guidance or dated evidence.
README obsolete stage/preview instructions and core-model schema-9 guidance are
updated. Obsolete migration handoff/integration/checklist/first-core plans are deleted;
duplicate obsolete planning prose is pruned. Relevant decisions, compatibility,
failures and regressions are retained. No game source snapshots, tests, game
history or diagnostics are deleted.
The former 4,000+ line development log is archived with rebased links; this guide
contains current rules, priorities, source policies and the focused development map.
This is documentation/source review, not full acceptance of every implementation.
Item uniqueness/group legality and a six-slot inventory are separate requirements;
read SYSTEM_DATA before claiming complete item legality.

## Engine refinement continuation

Prioritize reproducible causes over adding variables for their own sake:

1. Match ending: the 70-minute gold fallback is removed in this slice. Preserve
   normal tick/nexus resolution and transparent bounded unresolved failures;
   required exact-head PR CI passed; publication validation still gates delivery. Never fabricate an official winner.
2. Economy/combat: separate earned, unspent and spent gold; inspect actual recipe
   purchase effects and power spikes for double-counting. Compare equal gold with
   different roles/items, uneven carry allocation, casualties and scaling phases.
3. Decisions: verify lane priority, vision, availability, engage/disengage, target
   selection, waves and objective trades have relevant costs and observable effects.
   Add state only when its writer, consumer and observable consequence are defined.
4. Draft/series: check mastery, public opponent evidence, flex uncertainty, composition
   weaknesses and late-series Fearless adaptation against professional records.
5. Balance patches: verify champion base/skills, item price/stats/recipes, runes and
   objective spawn/reward/buff rules all change actual matches. Diagnose pick-ban,
   role, sample, region/team/player concentration and before/after response; control
   overshoot and oscillation. Existing simulated-world evidence remains separate
   from external professional calibration and historical patch snapshots.

Paired fixed-seed scenario checks must show credible routes for a gold-leading
team to lose and a behind team to win; do not force a fixed comeback percentage.
Professional holdout comparisons are unavailable until a validated dated dataset
is acquired. No 1:1 reproduction claim, artificial handicap or hidden catch-up buff.

### 전 부문 현실성·편의성 검토 우선순위 (2026-10-03)

사용자는 전 부문의 필요한 보완·현실성 추가 후보와 편의를 위해 줄이거나
제거할 후보까지 넓혀 정리하도록 요청했다. 아래는 **검토 백로그**이며,
전부 미구현이라는 진단이나 모든 신규 정책의 구현 확정을 뜻하지 않는다.
현재 코드·화면에서 이미 연결된 기능은 중복 개발하지 않는다. 기존 설계와
일치하는 재현된 결함/누락은 수정하고, 새 밸런스·정책·의미 있는 선택의
삭제는 효과와 비용을 제시한 뒤 설계 우선순위를 정한다.

판단 근거: LOL_GM_SPEC §1–11, §16–23, §30–35B와 DECISIONS D-UX-001.
소스 연결 후보는 아래에 적었다. 근거 수준은 확인된 결함(P0 첫 항목),
재현 전 가설(P0 둘째 항목), 설계 기반 제안(P1/P2)을 구분한다.
모든 제안의 공통 완료 조건은 실제 UI→공유 명령→엔진/AI→save 연결,
권한·취소·늦은 실패 rollback, 관찰 가능한 정보만 표시, 관련 focused
acceptance와 현재 head CI다. 장기/기기/TalkBack 최종 QA는 계속 유예한다.

**P0 — 플레이를 막거나 선택을 훼손하는 것부터**

- 새 게임/선수 공급: 위에서 재현한 subs=0 초기 FA 부족을 먼저 수정한다.
  기존 조직 최소 11명, 예산, 등록 정책은 유지한다. 자동 선수 생성으로
  시장 도중 부족을 숨기는 기능을 추가하지 않는다.
- 소유 2군/권한: 이번 수동 코칭 수정 후 임대 이동의 force=true 선발 재작성
  가설을 재현한다. 의료·등록상 불가능한 선수만 교체하고, 유효한 수동 선택은
  보존하는지 확인한다. 임대 코드 결함이라고 아직 단정하지 않는다.
- 완료 근거: 각 기능의 실제 플레이 경로/AI/save/실패 증거와 남은 연결을
  통합한다. 문서의 단계 이름이나 기존 함수 존재만으로 완료 처리하지 않는다.

**P1 — 먼저 검토할 운영·설명·편의성 연결**

| 부문 / 소스 후보 | 추가·보완 후보와 플레이 예 | 기대 효과 / 비용·의존성 / 줄일 후보 |
| --- | --- | --- |
| 홈·일정 / timezone-calendar, ui-season | 이번 주 경기·등록·협상 마감과 처리 필요 업무를 한 브리핑에 연결 | 방문 횟수 감소. 기존 알림·일정 재사용; 동일 사건 중복 팝업은 묶고 중대한 마감은 유지 |
| 훈련·회복 / development, medical, meta-practice | 실제 일정에 기반한 7일 훈련·휴식 비교, 자원 충돌과 회복 위험 표시 | 선택 결과 이해. 예측은 범위/한계를 명시; 매일 같은 배분 입력은 기간 계획·일괄 편집으로 줄임 |
| 선수·관계 / player-relations, ui-player-commitments | 출전·역할 약속과 실제 기용, 불만·재계약 의향의 관찰된 원인을 연결 | 이유 없는 페널티처럼 보이는 현상 감소. 숨은 정확한 점수 공개 없이 설명; 같은 불만 반복 통지는 변화 때만 |
| 영입·스카우팅 / scouting, ui-market, ui-scouting-regions | A/B/C 후보 비교에 역할 적합성·관찰 날짜·불확실성·총 비용을 함께 표시 | 합리적 대안 선택. 기존 보고서/쇼트리스트 재사용; 선수마다 화면을 왕복하는 절차 축소 |
| 계약·이적·임대 / contracts, transfer-payments, player-loans | 제안 전 확정 지출·분할 채무·조건부 비용·선수 동의·구단 권리·등록 가능성을 요약 | 실수 방지. 계약/규칙 원자료 의존; 필수 조항 강제와 같은 의미의 반복 확인은 피함, 최종 중요 확인 유지 |
| 1·2군 육성 / roster, ui-squad-preparation | 육성 목표·실제 출전·성장/피로 추세와 모구단/감독 권한을 같은 선수 경로에서 표시 | 이동 의미와 권한 명확화. 기록 재사용; 내부 배치와 공식 등록은 별개 규칙을 유지하되 중복 입력 검토 |
| 밴픽 / draft-analysis, ui-draft | 숙련·현재 패치·Fearless·상대 공개 기록을 근거로 후보의 장단점과 부족 역할 설명 | 티어순 클릭 감소. 기존 분석 재사용; 자동 정답 추천/숨은 flex 공개 금지, 중복 점수 배지는 정리 |
| 전술 / meta-tactics, meta-composition | 양끝 성향의 얻는 것/잃는 것과 현재 조합의 실행 제약을 미리 설명 | 슬라이더 의미 개선. 원인→결과 시나리오 필요; 같은 효과를 중복 조절하는 컨트롤은 통합 후보 |
| 경기·시리즈 / engine, series, ui-match | 실제 라인·자원·오브젝트·피로·조합 기록을 요약하고 다음 세트 변경점과 연결 | 패배 학습과 Bo3/Bo5 의미 강화. 집계 proxy 한계 유지; 모든 사건을 강제로 읽게 하는 흐름은 접기/요약 |
| 패치·메타 / patch, ui-patch, ui-player-champions | 변경점→선수 풀/준비 조합의 영향과 아직 적은 표본을 연결 | 재훈련 우선순위 결정. 패치 시점 데이터 의존; 모든 챔피언을 매번 재확인하는 절차 축소 |
| 재정 / finance, transfer-payments, ui-data | 현재 현금과 확정 채무·예상 수입을 구분한 현금 흐름 전망, 영입 전 감당 가능성 표시 | 잔액만 보고 지출하는 실수 감소. 가정/기간 명시; 동일 장부 수작업 입력·이중 집계 제거 후보 |
| 스태프·시설 / staff-contracts, staff-registration, office | 실제 업무 효과·담당 공백·유지비·완료 시점을 비교 | 무조건 최대 고용/시설 투자 방지. 실제 엔진 효과 확인; 엔진에 쓰이지 않는 장식 수치 정리 후보 |
| 규정·국제전 / registration, office-international | 탈락/몰수/출전 불가/슬롯 산정의 당시 규정과 수정 가능한 원인을 해당 화면에서 안내 | 규칙 암기 부담 감소. 확정 가상 정책·과거 스냅샷 의존; 정보를 찾기 위한 사무국 왕복 축소 |
| 통계·역사 / league-aggregation, ui-data, save | 공식/스크림·대회 수준·표본·패치·시점 필터와 원본 근거 연결 | 작은 표본의 과장 방지. 기존 기록 보존; 중복 표/설명 없는 단일 종합 순위는 정리 후보 |
| UI·검색·접근성 / ui-state, ui-overlay, ui-roster | 검색·비교·필터/스크롤 유지, 관련 다중 편집, 적용 전 차이·오류·저장 피드백, 키보드 기본 동작 | 반복 조작 감소. 기존 화면 흐름 재현; 깊은 메뉴·중복 모달·삭제 후 맥락 초기화 축소 |
| 저장·오프라인 / save, save-migration, state-rollback | 저장 상태·실패 시 복구 방법·내보내기/불러오기 안내와 이탈 시 미적용 선택 안내 검토 | 긴 커리어 손실 방지. 원본/호환성 유지; 매 행동 수동 저장 요구는 피함, 슬롯 삭제 확인 유지 |
| 성능 / engine, league-aggregation, ui-data | 실제 느린 날짜 진행·목록·집계·저장만 측정해 개선 | 조작 지연 감소. 대표 baseline/결과 parity 필수; 화면 밖 상세 렌더는 생략 가능하나 AI 경기 규칙·기록은 유지 |

**P2 — 의미가 있지만 새 정책·밸런스 검토가 필요한 확장**

- 구단 목표/팬/소유주: 구단 규모·재정·육성 목표에 맞는 기대와 최근 결과의
  맥락을 설명한다. 스타 판매/장기 부진 반응 강화는 재정·평가 영향 및 빈도를
  제안한 뒤 결정한다. 매 경기 강제 인터뷰·일률적인 숨은 징벌은 도입하지 않는다.
- 선수 생애/유망주: 기존 은퇴·노화·성장·공급 경로가 실제로 작동하는지 먼저
  확인한다. 코호트와 기회 차이로 커리어가 달라지는 보완은 후보이며 확정 잠재력
  공개/특급 신인 남발/외형만 다른 신규 성장 수치는 피한다.
- AI 구단 철학: 기존 관찰 정보·예산·대안 후보로 즉시전력/육성/비용 절감이
  결과에 나타나는지 비교한다. 중기 계획 보강은 새 판단 정책이므로 균형 검토가
  필요하다. 숨은 정보, 보정 자금, 플레이어만 적용되는 불이익은 추가하지 않는다.
- 감독 커리어: 해임이 세이브 종료가 되지 않는 지속성 원칙을 지킨다. 구직/이직
  확장은 핵심 경로 안정 후 후보이며 불필요한 계약 서류·반복 면접을 강제하지 않는다.
- 선택 위임: 안정된 계획 반복·기한 알림 같은 업무부터 범위/권한/중단 조건을
  사용자에게 명확히 표시하는 후보다. 직접 운영 기본을 유지하며 계약·영입·선발을
  동의 없이 자동화하지 않는다.

**편의를 위해 줄일 것 / 유지할 것**

반복 확인, 중복 통지, 같은 정보를 가진 여러 화면, 의미 없는 독립 보너스/수치,
개별 선수별 동일 입력, 억지 일일 체크리스트는 삭제·통합·접기 후보다.
실제 소스/플레이 검토 전에는 그런 UI가 현재 존재한다고 단정하지 않는다.
이미 합의된 SPEC §33 정리 항목은 잔존 여부부터 확인하고 중복 작업하지 않는다.
출전 경쟁, 훈련·휴식 배분, 선수 동의, 계약 비용·권리, 예산, 공식 등록,
밴픽·전술 trade-off와 기록은 판단의 핵심이므로 유지한다. 절차를 줄이는 것이
정책 우회·무조건 최적화·원본 삭제로 이어져서는 안 된다.

각 후보는 재현 트리거/현재 행동, 파일·규칙 근거, 사용자 예, 이익·단점,
범위·의존성·우선순위·근거 수준을 기록하며 구현 전 실제 누락을 좁힌다.
당장은 P0 초기 FA 공급 → 전체 기능의 남은 연결 확인 → P1 브리핑/원인 설명/
반복 조작 축소를 우선한다. 전 부문 검토가 모든 후보를 플레이 피드백 전에
구현하겠다는 약속은 아니다. 주요 확장은 피드백/설계 우선순위를 받아 선택하며,
검증된 수정과 연결 보완은 승인된 범위에서 계속한다.


## Focused development map

Start from latest main and the relevant unfinished row in DEVELOPMENT.md / the
depth audit. Do not reread every source or repeat accepted gameplay work.
`scripts/artifact-modules.mjs` is the executable source-order manifest;
ARCHITECTURE.md records ownership. Canonical code is in `src/artifact/`.

### Entry points and first checks

These are initial local reproductions, not a proof that other domains are
unaffected. Cross-domain changes need their union; unknown/shared engine changes
require full Actions validation. Every PR and main push, including documentation changes, keeps the complete CI gate.

| Change | Read first | First focused command |
| --- | --- | --- |
| World/bootstrap seed | world.js `buildWorld`, player.js, career.js | `node scripts/bootstrap-seed-acceptance.mjs` |
| Navigation/async UI | ui-state.js, ui-overlay.js, app.js | relevant `ui-state`, `ui-overlay`, `ui-async` or `ui-mobile-a11y` acceptance in scripts/ |
| Save slots/storage | app.js `loadDB` / `switchSaveSlot`, ui-data.js | `node scripts/ui-async-acceptance.mjs` |
| Save encoding/migration | save.js `packDB` / `unpackDB`, save-migration.js | Actions regression + career; preserve legacy resume |
| Finance/contracts/market | finance.js, contracts.js, contract-*.js, transfer.js | `node scripts/ui-finance-contracts-runner.mjs` |
| Player transactions | state-transaction.js, state-player-actions.js, state-rollback.js, roster.js | Actions regression + contract domain + career |
| Calendar/scouting/scrim | calendar.js, season.js `advanceStep`, timezone-calendar.js, scouting*.js, scrim-partner.js | `node scripts/calendar-scouting-runner.mjs` |
| Medical/development | medical.js, development.js, calendar.js, season.js | Actions medical core/regional/calendar; reproduce only failing seed locally |
| Match/draft/series/patch | engine.js, draft.js, series.js, meta.js, patch*.js | Actions regression + both smoke shards + career |
| Build/module manifest/shared RNG | scripts/build.mjs, artifact-modules.mjs, random.js | `node scripts/check.mjs`, then full Actions |
| CI report/publisher | scripts/ci-run.mjs, sync-standalone.mjs | corresponding `node --test scripts/<name>.test.mjs` |
| Documentation only | relevant doc and referenced code | links/diff review; complete current-head CI |

For one known invariant, run its individual acceptance instead of the whole
domain runner. `npm run check` remains the complete serial local fallback, not
the routine edit loop. Use CI_RESULTS.md for small JSON summaries and failed
logs. Actions owns repeated heavy simulations and production builds.

### Narrow discovery

Find paths with `rg --files src/artifact scripts docs`; then search only the
owning modules and relevant acceptance. For example:

```sh
rg -n 'applyWorldAction|validateWorldAction' src/artifact/state-*.js
rg -n 'switchSaveSlot|loadDB|saveDB' src/artifact/app.js scripts/ui-async-acceptance.mjs
```

When the shell does not expand globs, pass an explicit directory and `-g` filter:
`rg -n 'applyWorldAction' src/artifact -g 'state-*.js'`.
Avoid searching generated `index.html`, `dist/`, and the large champion/system
snapshots unless the change concerns generated output or pinned source data.
Do not infer dead code from name counts: HTML handlers and global concatenation
are real callers. The complete manifest ownership/change map is in
[REFACTOR_R01_AUDIT.md](archive/REFACTOR_R01_AUDIT.md#r08-complete-manifest--dependency-and-change-map).


## Implementation history

[Preserved delivery, design checkpoints, measurements and failures](archive/DEVELOPMENT_HISTORY_2026_10_03.md).
Historical instructions do not supersede this guide or current decisions.

## Latest requested scope and automation (2026-10-03)

The hourly automation prompt was updated while preserving its existing hourly
Asia/Seoul schedule and single-worker execution. It now includes competition-only
data, document freshness, causal draft/match/patch refinement, item purchase
legality/exclusive groups and coordinated healing/armor-reduction utility.
Its detailed system scope includes minions, jungle camps, waves, structures and
objectives with actual match consumers; see SYSTEM_DATA.
User direction: use unified numeric stages, not letter-prefixed task stages;
continue necessary work across every domain, not engine-only development.
Provide a stable playable web URL and directly downloadable offline HTML.

Implemented in this slice: removal of the reproduced gold-timeout winner only;
not complete engine realism, item group legality or camp modeling. The initial
32-match bounded probe had no timeout hits and no gold-behind winners; it cannot
establish real comeback calibration. Original stalled reproduction/log preserved.
The focused ending acceptance covers normal nexus results, stalled failure,
post-70 nexus resolution, unchanged career state and deterministic save resume.
The original ending log incorrectly showed 71+ minutes because the exhausted for
loop advanced t; unresolved matches now fail instead of emitting that bogus result.

Next coherent slice: acquire pinned item group restrictions and reproduce actual
illegal purchases/recipes; implement shared purchase validation and AI selection
with allowed repeated components and atomic inventory handling. Professional
calibration acquisition remains separately blocked on source-host networking;
current static snapshot lacks reviewed group metadata. If acquisition remains
blocked, complete the already reproduced initial-FA gap rather than inventing rules.

Local checks for this slice: 119-module static validation, regression, 19 calendar/engine acceptances in 19 fresh contexts (one compile), ending acceptance and build/standalone parity pass. Final Markdown path audit checks 41 retained documents, zero missing local targets; this does not validate external URLs or every historical claim. Full current-head CI remains required.

Stable delivery: the playable-site workflow consumes only a successful push-to-main
CI run's validated HTML artifact, rejects a superseded main head, and publishes
a launcher, online play.html and identical downloadable LOL-GM.html. No external
API is needed to play. Browser/file origins do not share local saves automatically;
export/import remains the supported handoff. Hosting permission/status must be
verified before reporting a public URL as live.

Ordinary-match before/after parity: 32 seeded games retain full result/log/stats/items exactly. The first parity runner hit sandbox spawnSync git EPERM; original log preserved, baseline source then read via a shell snapshot and the read-only rerun passed. Site assembly checks verify online and downloadable game bytes equal the validated standalone. Hosting API reads are unavailable through the connector endpoint allowlist and shell gh returned Forbidden; actual Pages enablement remains to be verified in its deployment workflow.

Delivery follow-through: PR #163 final head
`de3f451ece5ca061c37d6326039cae1e2c2959a6` passed all 13 required checks in
Actions `37131935751`, including medical core/four seeds/two aggregates and verify.
All seven medical CI_RESULT records succeed. PR/run head, unchanged main and
mergeability were checked before sequential merge
`441169555e249be9c69a26a3a6e38ec1da43ae85`. Standalone HTML is rebuilt from
integrated main. Publication-head CI and actual playable-site deployment still
require success before reporting a live website. This slice does not complete
item exclusive groups, coordinated counters or camp/wave modeling.

Pinned static-source follow-up: the original Data Dragon mirror commit is
confirmed in noxelisdev/LoL_DDragon at `1cf34d485c572a9894c223efd3d66c1e5ad7f22f`.
Its en_US item.json reports version 16.19.1 and 870 cross-mode entries; it has
no explicit exclusive-group fields. Raw file remains `/tmp/items-ddragon-16.19.1-en.json`.
Do not treat all cross-mode entries or absent stack metadata as accepted Summoner's
Rift restrictions. Competition-only source collection remains separate.

## League integration evidence and limits — 2026-10-04

Trigger: the picker mixed numeric first division and generic Challengers second
division, China displayed the wrong alias, and only KR/CN enabled tier two.
Current slice unifies abbreviations and connects all six starting regions to actual
reserve competitions, with new-region mandatory tier twos and L-prefixed naming.

The expanded default first auction failed with KR/CN local pools exhausted:
142 active squads / 898 athletes, 136 still unsigned globally, five squads below
minimum. Original `/tmp/league-initial-market-probe.log` and earlier fixture errors
remain preserved. Generation now adds a source-defined capacity shortfall before
FA conversion: legal squad minimums plus maximum external import capacity.
Existing legal registration/import/budget constraints stay; no mid-bid creation.
The larger initial FA pool is a deliberate capacity tradeoff, not an optimization
or empirical estimate of real professional player populations.

The first fixture also incorrectly required every mixed-league second-tier club
to have a parent. Corrected acceptance permits legitimate independent clubs;
the original failure log remains. Current country origin is still region-coded;
country-level competitions are separately authorized pending work (10.2).
Neither a country-by-country model nor complete roadmap coverage is claimed.

Latest confirmed 10.2 state: club home-country and reserve development/operating
country are separate selectable identities. The reserve need not train in its
parent's country. Domestic tier-two participation is office-approved, not inferred
from a training address; athlete nationality/origin/local eligibility are separate.
The interface, licensed country competition membership, scheduling, office
promotion decisions and save compatibility form the next coherent vertical slice.

Measured generation bottleneck: the added 948 athletes made full default world
generation about 1.8 seconds (1811/1829/1748 ms, 1846 total athletes), and the
unchanged 30-second regression guard rejected the run. Append-only initial supply
now uses a scoped nickname set and player count instead of repeatedly scanning
the entire roster. The index is not saved or retained in live state. Representative
three-world before/after parity compares all players, teams, regions and supply
metadata; focused acceptance also compares ordinary/indexed athlete generation.
Original timeout and baseline evidence are preserved in /tmp/league-* logs.

- 10.3 Broadcast-window connection, confirmed after scope correction: viewers
  must be able to follow all international official series, and each domestic
  league must run one series at a time. Different domestic leagues may overlap.
  Event periods can overlap: Eastern/Western Cup are equal-prestige peers and
  may share a period. Starts alone are insufficient; planned series windows and
  actual overruns must sequence broadcasts and preserve absolute UTC/venue/KST
  display, one daily tick, team availability and saved/pending match references.
  The current scheduler provides venue start slots but lacks verified end-window/
  overrun collision protection. This is pending authorized implementation; do not
  claim that serializing entire tournaments satisfies the corrected requirement.
- Official domestic split defaults now read 스플릿 1/스플릿 2/스플릿 3.
  `region.splitNames` provides office-configured display overrides for each
  region's generated season. Timing/qualification IDs remain numeric. Historical
  saved names stay intact.

Repeated default-world construction remained a measured bottleneck after the
scoped identity index (about 0.65–0.75 seconds per full world). One bounded
serialized initial-world template now keys normalized configuration, generation
seed and fresh static patch input. Each hit parses a separate world and refreshes
only its storage identity; live edits cannot alter the template, different config
or static patch input replaces it, and the cache never grows beyond one entry.
Whole-generated-state seeded parity and mutation-isolation acceptance are required.
The existing regression's old long-brand-only assertion was updated for the user-
confirmed three-letter display alias, still retaining/verifying full invented brand.
The 30-second guard is unchanged; timeouts remain in their original logs.

Whole-generated-state parity passed before/after: baseline 1796/1615/1598 ms;
indexed/template generation 809 ms cold then 102/97 ms warm. Full regression
passes its unchanged 30-second guard after caching. This measures generated-world
creation only, not match speed or end-to-end frame performance. Focused country/
broadcast follow-through is still pending and must not be marked delivered.

## 3.1 아마추어 배경과 선수 이야기 — 승인된 구현 예정 범위

사용자는 정식 3부 리그 추가가 아니라 아마추어 생태계를 이야기의 기반으로 추가하도록 승인했다. **아마추어 경기/리그 시뮬레이션은 돌리지 않는다.** 별도 일정을 촘촘히 계산하거나 모든 아마추어 팀·선수를 상시 생성하지 않는다. 필요한 선수/팀의 배경 이력과 사건을 제한적으로 생성·보존하고 실제 스카우팅 제보, 테스트 참가 및 영입 경로에 연결한다. 기존 선수 생성/entryPath·cohort·관측·관계·이력 시스템부터 조사해 중복 구현을 피한다.

- 목표: 지역 팀 출신 신인, 함께 프로 진입을 준비한 동료, 방출 후 재도전하는 베테랑 등의 이력이 선수를 기억하게 하고 운영 결정에 맥락을 더한다.
- 경계: 아마추어 배경은 가상 세계의 생성 이력이다. 실제 프로 대회 데이터나 계산된 경기 결과로 가장하지 않는다. 상세 경기 통계·가짜 승패 기록을 만들어 능력의 증거로 사용하지 않는다. 이야기 문구만으로 숨은 실제 능력이나 다른 팀의 비공개 정보를 노출하지 않는다.
- 연결: 배경 제보 → 합법적인 관측/테스트 → 기존 영입·계약 명령 → 구단/선수 이력으로 이어진다. 테스트나 영입은 사용자 선택이며 선수의 구원/성공을 미리 정하지 않는다. 2부 진입은 사무국 승인 규칙에 따르고 이야기 사건만으로 참가권을 부여하지 않는다.
- UI: 중요한 새 사건은 짧은 알림 하나로 제공하고 선수 프로필에서 관련 인물·시점·이력을 선택적으로 읽는다. 반복 알림을 묶고 추가 필수 입력/퀘스트를 만들지 않는다. 한국어 문구·오타·일관성·동일 사건 중복 표시를 검수한다.
- 완료 증거: 고정 시드의 안정적인 배경 생성, 영입 전후 인물/이력 참조 일치, 관측 권한, 명령 취소/실패 시 이력 불변, 저장·재접속/기존 저장 호환, 알림 중복 방지, 아마추어 경기 시뮬레이션 미호출을 집중 검사한다. 실제 구현 전에는 완료로 표시하지 않는다.
- 첫 45–55분 단위: 기존 생성/관측/이력 경로를 확인하고 제한된 배경 유형을 선수 프로필과 기존 스카우팅/테스트 진입점까지 연결한다. 기존 관측/테스트 연결이 없거나 전체 단위가 크면 자연스러운 구현 경계와 정확한 후속 상태를 기록한다. 현재 PR의 실패 해결과 필수 CI/순차 병합 기준은 유지한다.

### 이야기 디테일 후보 — 추가 정책은 아직 제안

| 우선순위 | 소재/발생 조건 | 플레이어에게 보이는 예 | 이점과 제한 |
| --- | --- | --- | --- |
| 높음 | 과거 소속팀과 실제 재대결 | 방출/이적한 선수가 상대 로스터에 있을 때 기존 기록을 경기 전 짧게 연결 | 기록 재사용, 비용 작음. 복수심 능력 보너스나 승리 강제 없음 |
| 높음 | 육성 선수의 실제 첫 기록 | 최초 공식 출전·첫 선발·첫 우승을 구단 육성 이력과 연결 | 운영 결과에 애착. 별도 미션/보상 난발 없음 |
| 높음 | 함께 입단한 선수들의 경로 | 같은 출신/동기 이력이 있는 선수의 승격·이적을 비교 | 관계/경력 맥락. 존재하지 않는 관계나 유출 정보 생성 금지 |
| 중간 | 구단의 실제 어려운 결정 | 기존 계약 종료·감독 교체·주전 변경의 이유와 후속 사건을 연결 | 선택의 기억. 신규 불이익·감정 수치는 별도 설계 승인 없이 추가하지 않음 |
| 중간 | 은퇴 후 재회 | 기존 은퇴 선수와 실제 스태프 채용 체계가 연결될 수 있는지 조사 | 장기 세계의 연속성. 자동 취업·실력 이전을 보장하지 않음 |
| 중간 | 시즌의 짧은 구단 회고 | 실제 데뷔·승격·이적·우승 중 중요한 기록만 시즌 종료에 묶기 | 중복 알림 축소. 새로운 가짜 사건이나 장문 반복 생성 없음 |

이 후보들은 기존 상태·이력을 활용하는 방향이며 현재 구현 완료나 추가 게임 정책 확정이 아니다. 구현 시 실제 데이터 존재, 표시 권한, 비용과 반복성을 확인한 뒤 기존 문서에 근거와 결과를 남긴다.

## 12.6 뉴스와 실제 사건 연결 — 승인된 구현 예정 범위

실제 게임 사건을 세계의 이야기로 연결하는 뉴스 보강을 승인했다. 기존 news/event 작성자·이력·뉴스 UI를 먼저 조사하고 재사용한다. 이적·스태프 교체·데뷔·이변·승강·패치 및 지원되는 아마추어 제보에서 공개 가능한 실제 사건만 짧은 기사로 제공한다. 선수/구단/대회 링크는 실제 관련 화면으로 이동하고 관심 대상·종류별 필터를 제공한다. 계약 응답/기한 등 처리할 업무는 업무 알림에 두고 선택적인 세계 뉴스와 명확히 구분한다. 동일 사건 중복 기사/알림은 묶어 운영 부담을 줄인다.

기사의 사건 ID·관련 인물·시점과 공개 권한을 유지하고 저장·재접속에서도 이력/필터/읽음 상태가 일관되어야 한다. 가짜 사실·상대팀 비공개 데이터·미계산 아마추어 경기 통계를 기사로 만들지 않는다. 소문 시스템은 별도 제안이며 현재 확정 범위가 아니다. 실제 사건→기사→관련 화면 이동 및 중복/권한/저장 동작을 집중 검증한다. 현재 상태는 구현 예정이며 기존 뉴스 존재만으로 완료로 보지 않는다.
