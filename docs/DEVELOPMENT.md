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

### 이야기 디테일 전체 — 승인된 구현 예정 범위

사용자가 아래 전체 항목을 승인했다. 우선순위는 구현 순서일 뿐 범위를 제외하는 기준이 아니며, 이후 제안 보고에서도 후보 전체와 승인/구현 상태를 보여준다. 현재는 승인 상태이며 구현 완료를 뜻하지 않는다.

| 항목 | 구현 연결과 플레이어에게 보이는 내용 | 경계/완료 기준 |
| --- | --- | --- |
| 아마추어 배경 | 지역 팀 출신·동료와 프로 도전·방출 후 재도전을 프로필/제보에 연결 (3.1) | 별도 아마추어 경기 시뮬레이션 없음 |
| 선수 경력 | 첫 계약·공식 데뷔·첫 선발·첫 우승·은퇴를 경력에 표시 | 실제 기록의 시점/소속/인물 참조와 저장 유지 |
| 육성 발자취 | 발굴→입단→육성→1군 정착 기록 연결 | 실제 구단 육성/출전 경로, 성공 강제 없음 |
| 동료의 진로 | 같은 출신/입단 동기의 승격·이적·경력을 연결 | 생성된 배경 또는 실제 동료 이력만 사용, 비공개 정보 보호 |
| 재대결 | 친정팀·옛 동료·옛 감독과의 실제 경기 전 소개 | 실제 과거 소속/고용과 현재 대진 확인, 능력 보너스 없음 |
| 라이벌 | 반복된 결승·접전·승강 경쟁을 대결 기록과 연결 | 판별 근거 공개, 임의 승패/핸디캡 없음 |
| 구단 역사 | 장기 근속 주장·대표 선수·중요 경기를 구단 역사에 표시 | 검증 가능한 근속/역할/경기 기록에 근거 |
| 영입 평가 | 당시 합법적으로 관측한 보고서와 이후 관측 가능한 활약 비교 | 과거 보고서를 최신 숨은 능력으로 덮어쓰지 않음 |
| 운영 결정의 후속 | 주전 변경·계약 종료·감독 교체와 실제 후속 경로 연결 | 기록된 사실/선택 이유만 표시, 신규 감정 페널티 없음 |
| 은퇴 이후 | 은퇴 선수의 지도자 전환·옛 구단 복귀 경로 | 기존 스태프 자격/직무·채용·계약 권한에 연결, 자동 취업/능력 이전 없음 |
| 팬 기대와 반응 | 기존 명성·목표·성적에 따른 짧은 분위기 표시 | 근거를 설명하고 필수 여론 관리/추가 벌점 없음 |
| 뉴스 | 이적·데뷔·이변·승강·패치·유망주 소식 (12.6) | 실제 사건/공개 정보와 관련 화면 연결, 중복 억제 |
| 시즌 회고 | 주요 인물·선택·경기·성과를 시즌 종료에 묶기 | 실제 기록을 재사용, 반복 장문/가짜 사건 없음 |

### 12.7 기록 기반 이야기 연결과 12.8 구단 역사·시즌 회고

3.1과 12.6을 포함해 위 전체 범위를 구현한다. 12.7은 경력/육성/동료/재대결/라이벌/영입 평가/운영 결정/은퇴 후 경로를 기존 이벤트·권한·프로필에 연결하고, 12.8은 구단 역사/팬 반응/시즌 회고를 실제 기록에 연결한다. 큰 범위는 사건 작성자→관측/표시→저장까지 포함하는 45–55분 세로 단위로 나누고 각 항목의 완료 증거/남은 일을 기존 문서에 유지한다. 구현 순서 때문에 나머지를 제안 상태로 되돌리지 않는다.

공통 기준: 기존 생성·cohort·관계·고용·보고서·공식 경기·역사 시스템을 먼저 조사하고 재사용한다. 신규 표현용 이벤트의 출처/인물/소속/시점과 중복 방지 키를 정의하고, 도메인 상태의 원본을 이중 관리하지 않는다. UI는 짧은 중요 사건과 선택적 상세 읽기로 구성한다. 임의 능력 보너스·승패 보정·성공 강제·필수 미션·추가 벌점/여론 업무는 이 승인에 포함되지 않는다. 관측 권한/과거 자료 보존/실패 rollback/중복 알림/저장 호환과 관련 화면의 실제 연결을 확인해야 완료다. 최종 장기/기기 QA는 계속 보류한다.

## 12.6 뉴스와 실제 사건 연결 — 승인된 구현 예정 범위

실제 게임 사건을 세계의 이야기로 연결하는 뉴스 보강을 승인했다. 기존 news/event 작성자·이력·뉴스 UI를 먼저 조사하고 재사용한다. 이적·스태프 교체·데뷔·이변·승강·패치 및 지원되는 아마추어 제보에서 공개 가능한 실제 사건만 짧은 기사로 제공한다. 선수/구단/대회 링크는 실제 관련 화면으로 이동하고 관심 대상·종류별 필터를 제공한다. 계약 응답/기한 등 처리할 업무는 업무 알림에 두고 선택적인 세계 뉴스와 명확히 구분한다. 동일 사건 중복 기사/알림은 묶어 운영 부담을 줄인다.

기사의 사건 ID·관련 인물·시점과 공개 권한을 유지하고 저장·재접속에서도 이력/필터/읽음 상태가 일관되어야 한다. 가짜 사실·상대팀 비공개 데이터·미계산 아마추어 경기 통계를 기사로 만들지 않는다. 소문 시스템은 별도 제안이며 현재 확정 범위가 아니다. 실제 사건→기사→관련 화면 이동 및 중복/권한/저장 동작을 집중 검증한다. 현재 상태는 구현 예정이며 기존 뉴스 존재만으로 완료로 보지 않는다.

## 전 부문 현실성·편의성 검토 목록 — 전체 문서화

아래 전체 항목을 누락 없이 검토한다. 이는 코드 조사 전 미구현 판정이나 검증 완료 선언이 아니다. 이미 승인된 기능의 결함/연결은 구현하며, 새로운 판정·효과·정책은 근거와 부작용을 구체화해 문서에 구분한다. 대회 데이터만 경험적 보정에 쓰고 확정 가상 규칙·수동 운영 기본값·관측 권한·저장/기록을 유지한다.

| 부문 | 전체 검토 내용 | 판정/편의성 기준 |
| --- | --- | --- |
| 선수 평가 | 현재 실력·잠재력·최근 폼·관측 신뢰도 | 짧은 활약으로 잠재력까지 급등하지 않기 |
| 스카우팅 | 관측 기간·상대 수준·역할·패치별 평가 차이 | 근거·표본·불확실성 표시 |
| 성장 | 출전·훈련 질·역할 안정성·지도자 영향 | 무한 성장/훈련량 만능 방지 |
| 적응 | 이적 후 언어·생활·전술·역할 적응 | 국적 일괄 페널티 금지, 새 효과는 근거 필요 |
| 팀워크 | 함께 뛴 경험·의사소통·선수 교체 | 친밀도와 경기 호흡 구분 |
| 주장/리더십 | 콜 조율·신인 적응·갈등 중재 | 근거 없는 팀 전체 능력 보너스 금지 |
| 출전 경쟁 | 주전·교체·육성 계획과 기대 | 실제 약속/출전의 차이에 따른 반응 |
| 피로/의료 | 훈련·경기·이동·회복 누적 | 회복 효과·관측 불확실성, 기존 의료 깊이 보존 |
| 훈련 | 개인 약점·조합·상대 준비의 시간 배분 | 공유 시간 중복 사용 금지 |
| 스크림 | 목적·상대 수준·숨긴 전략·실험 조합 | 승률을 공식 실력으로 직접 환산 금지 |
| 감독/스태프 | 직무별 책임·전문성·선수 적합성 | 실제 고용/업무/효과 연결 |
| 영입/계약 | 역할·출전·지역·구단 전망 선호 | 돈만으로 동의 보장 금지 |
| 이적시장 | 포지션 수요·대체 후보·기한 | AI/사용자 정보·예산·동의 규칙 동등 |
| 재정 | 현금·장부 수익·지급 시점·채무 | 예상 수입을 가용 현금으로 취급 금지 |
| 구단 운영 | 연고지·육성 거점·시설·스폰서 | 근거 없는 자산 가격/수수료 금지 |
| 리그/사무국 | 국가별 하부·등록·승강·라이선스 | 확정 가상 규칙/사무국 개정의 실제 적용 |
| 일정/이동 | 중계 충돌·초과 시간·이동/준비 | 자동 연결, 감독 수동 시간표 편집 요구 금지 |
| 밴픽 | 숙련도·역할·조합·상대 공개 정보·시리즈 적응 | 단일 티어순 선택 탈피, 공개/비공개 경계 |
| 경기 엔진 | 웨이브·시야·귀환·숫자 우위·사이드·오브젝트 교환 | 골드 우세와 넥서스 승리 조건 구분, 모델 한계 명시 |
| 아이템 | 구매 시점·조합식·중복/배타·팀 치감/방깎 | 검토된 메커니즘을 실제 writer/효과에 적용 |
| 패치/메타 | 챔피언·아이템·룬·미니언·정글·오브젝트 | 밴픽/경기 소비 경로까지 연결, 근거 없는 수치 금지 |
| 티어리스트 | 대중/팀 내부 평가·패치·표본·관측 | 대회 데이터만 보정, 타 팀 비공개 정보 보호 |
| 뉴스/이야기 | 실제 선택/사건과 인물·구단 역사 연결 | 중요 사건만 알림, 선택적 상세 읽기 |
| UI/위임 | 상태·행동·이유·결과, 반복 업무 선택적 위임 | 직접 운영 기본, 권한·해제·실패 피드백 명확 |

줄이거나 없앨 대상도 전체 검토한다: 동일 사건의 뉴스/팝업/알림 중복; 엔진 소유 아이템 구매를 감독에게 매번 요구하는 입력; 실제 소비되지 않는 장식 수치/슬라이더; 의사결정에 도움이 안 되는 상세 훈련 입력; 관측 없이 공개되는 정확한 능력; 스크림 승률/대중 티어 하나로 단정하는 표시; 매 이야기마다 답변/보상을 요구하는 반복 이벤트. 실제 존재 여부와 호출/권한/저장 의존성을 확인한 뒤만 정리한다. 정보 삭제보다 선택적 상세/묶음/위임이 적합한 경우를 구분하고 의미 있는 결정과 기록을 보존한다.

각 항목에 실제 소스/규칙, 재현 조건, 현재 구현/결함/추가 정책 여부, 변경 내용과 사용자 예, 비용/부작용, 검증, 남은 일을 기록한다. 새 적응/리더십 등 효과는 임의 계수를 도입하지 않고 정책안과 구현 결함 수정을 구분한다.

## 10.4 사무국 규정 개정 엔진 — 승인된 연결/고도화 범위

사무국이 세계의 상황을 보고 규정을 개정하는 엔진을 기존 기능에 연결·보강한다. 현재 `office.js:officeDecisions`에는 지표/효용 평가, 구단 의견(`officeFormatConsultation`), 변경 그룹별 간격 제한, 한 회차 안건 수 제한, 공표일/다음 시즌 시행연도 기록이 있다. `office-international.js`의 국제 권한도 함께 조사한다. 이 존재만으로 아래 전체가 완료됐다고 보지 않고 중복 엔진을 만들지 않는다.

1. **관할과 변경 가능 범위:** 지역/국가별 하부/국제 사무국의 권한을 명시한다. 확정된 필수 2부·소유 2군 승격 제한·동의/등록 권한·국제/동일 리그 중계 충돌 금지 등은 임의 효용으로 폐기할 수 없다. 새 정책은 검토된 허용안/범위에서만 선택하고 경기 밸런스 패치는 별도 엔진 권한이다.
2. **개정 근거:** 실제 경쟁 균형·참가/등록 상황·재정 지속성·선수 공급·일정 부담·흥행/관측 지표를 출처/기간/표본과 함께 사용한다. 데이터가 부족하면 유지/보류하고 근거를 남긴다. 가짜 시청률이나 실제 Riot 정책을 발명하지 않는다.
3. **제안과 영향 검토:** 개정 전후 차이, 구단/선수/국가별 하부/등록/일정에 대한 영향을 검토한다. 기존 구단 의견 수렴을 연결하되 사용자에게 상시 투표 업무를 추가하지 않는다. 실현 불가능한 일정·팀 수·선수 공급·재정 요구를 거절/보류한다.
4. **결정/공표/시행:** 의결 결과와 이유, 규칙 버전, 공표일·시행일/시즌, 적용 대회를 기록한다. 이미 진행 중인 대회·완료 기록·체결 계약에 소급 적용하지 않는다. 긴급 개정 예외는 별도 확정 규칙 없이는 만들지 않는다.
5. **실제 적용:** 승강 자격/자리/예선·다음 시즌 멤버십·국가별 2부·등록/라이선스·스플릿/대회 방식·중계 일정의 실제 writer/consumer에 연결한다. 당시 대회 규칙 스냅샷과 pending/save 참조를 유지한다. 기록만 다음 시즌이라면서 현재 규칙을 조기 변경하는지 검사한다.
6. **시행 후 평가:** 개정 당시 기대와 시행 후 실제 지표/부작용을 비교해 유지·보완·재검토한다. 평가 기간/표본과 적용 규칙 버전을 기록하고 한 시즌의 잡음만으로 되돌리지 않는다. 실제 효과를 검증하지 않고 성공을 선언하지 않는다.
7. **안정성/원자성:** 반복 개정/되돌림 진동을 억제하고 동시에 채택된 규칙 간 충돌을 검사한다. 실패 시 규칙·멤버십·재정/권한·이력이 부분 변경되지 않도록 rollback하며 결정 ID로 재접속/재진행 중복 적용을 막는다.
8. **UI/뉴스:** 사무국 화면에서 현행/예고 규칙, 변경 이유/차이, 시행 시점과 내 구단 영향이 보이고 관련 대회·등록 화면으로 연결된다. 중요한 개정 뉴스는 한번 알리며 사용자는 규칙을 직접 편집하지 않는다.
9. **검증:** 근거 충분/부족, 찬반 의견, 개정 유지/채택, 다음 시즌 적용, 필수 규칙 거절, 소유 2군 제한, 과거 기록 불변, 저장·재접속 중복 방지, 충돌/실패 rollback과 AI/사용자 동등성을 고정 시드 집중 시나리오로 확인한다.

첫 45–55분 단위는 기존 개정의 공표/시행과 실제 writer를 추적해 한 개 규칙의 제안→예고→정확한 시즌 적용→UI 설명→저장 경로를 완성하는 것이다. 10.2/10.3과 연결 강한 변경은 한 담당자가 세로로 구현한다. 법정처럼 보이는 새 규칙을 임의로 추가하지 않고 단위별 완료 증거와 정책 근거를 기존 문서에 유지한다. 필수 현재-head CI/순차 병합/검증된 HTML·웹 배포 및 최종 QA 보류는 그대로다.

## 추가 승인 항목의 단일 배치와 중복 방지

사용자는 직전 추가/수정/삭제 검토 목록 전체를 승인했다. 아래는 새 별도 기능 목록이 아니라 각 기존 단계에 한 번만 배치한 현재 실행 기준이다. 같은 의미의 항목을 다른 이름으로 새 제안처럼 반복하지 않는다. 기존 전 부문 검토표 중 아래와 겹치는 내용은 이 완료 조건을 참조한다. 모두 구현 예정이며 실제 코드 조사로 기존/부분/결함/신규를 구분해야 한다.

| 승인 내용 | 단일 담당 단계 | 기존 범위와 관계 / 완료 조건 |
| --- | --- | --- |
| 선수 경력 목표 | 2·4 | 계약 선호 보강: 우승/출전/안정/귀향 선호와 실제 협상 연결, 성격만으로 결과 강제 금지 |
| 역할별 영입시장 수급 | 4 | 기존 수요/대체 후보 보강: 관측 가능한 후보·구단 수요 반영, 임의 가격 가산 금지 |
| 대체 선수/비상 계획 | 2·5·10 | 기존 의료/로스터/등록 연결: 합법 콜업·교체와 실제 출전, 갑작스런 구제 선수 생성 금지 |
| 국제대회 준비 | 6·10 | 기존 훈련/이동/일정 보강: 분석·연습 환경·이동/적응의 준비 시간, 수동 여행 예약 없음 |
| 계약 연속성 | 4·11 | 기존 옵션/임대/지급 연결: 갱신·옵션·복귀·분할 지급의 기한/명령/정산과 통합 안내 |
| 사무국 개정 사후 평가 | 10.4 | 새 연결: 기대 효과와 실제 지표/부작용 비교→유지/보완, 기간/표본 없이 되돌림 금지 |
| 소유주 변화/인수 | 5·11 | 기존 소유주 체계 조사·연결: 목표/가용 투자/운영 방향, 검토되지 않은 인수가격 생성 금지 |
| 공개 정보 전달 시점 | 3·4·12.6 | 뉴스/관측 보강: 확정·등록·공식 발표 구분, 비공개 협상 조기 공개 금지 |
| 대회별 평가 맥락 | 3·12.7 | 평가 보강: 상대·역할·경기 수와 관측 자료, 승률/KDA만으로 동일 가치 단정 금지 |
| 대회별 패치 적용 | 7·9·10 | 기존 패치 스냅샷 연결: 세계 최신과 대회 사용 버전 구분, 시행 시점/준비 영향 UI |
| 감독 권한 | 5·12.4 | 기존 권한 검증: 감독/단장/소유주/2군 감독 UI와 실제 명령 권한 일치 |
| AI 장기 계획 | 4·5·11 | 기존 AI 보강: 예산·계약 만료·육성·역할 수급, 미래/숨은 정보 참조 금지 |
| 경기 결과 설명 | 8·12.4 | 기존 경기/UI 연결: 관측 가능한 전환점·자원/아이템/전술 근거, 미계산 원인 발명 금지 |
| 위임 확인/권한 회수 | 5·12.4 | 기존 선택적 위임 보강: 실제 결정/근거·실패 확인과 이후 권한 회수, 이미 확정된 행위를 무조건 취소하지 않음 |
| 동일 정보의 여러 원본 통합 | 12.4 | UI/저장 보강: 계약·등록·소속의 단일 원본과 파생 표시, 호출/저장 호환 조사 후 통합 |
| 사후에만 보이는 제한 수정 | 12.4 | UI 보강: 비용·등록 자격·기한을 사전에 안내하고 명령 시 최신 상태 재검증 |
| 의미 없는 확인창 정리 | 12.5 | 편의성 보강: 중요한 결정 확인은 유지, 단순 이동/읽기/반복 진행 확인 축소 |
| 수치 반복 평가 문구 정리 | 3·12.5 | 문구 보강: 역할·장점·위험·관측 근거로 설명, 근거 없는 자동 칭찬 금지 |

향후 후보 보고는 먼저 기존 문서/승인 목록과 대조한 뒤 **실제 신규 / 기존 범위 보강 / 중복 제외**를 구분한다. 새 후보 전체를 보여주되 같은 승인 목록을 매번 재승인받지 않는다. 기능 이름 변경으로 범위나 완료 수를 부풀리지 않는다. 기존 명령/수치의 재사용 여부, 변경 이유와 증거, 화면/저장/AI 영향 및 남은 작업을 해당 단계에 함께 유지한다. 새 효과/가격/계수는 승인된 목적만으로 발명하지 않고 검토 가능한 근거와 시나리오를 정의한다.

## 세부 연결·완료 조건 전체 승인

사용자가 직전 전체 세부 검토 목록을 승인했다. 아래 항목은 담당 단계의 완료 조건으로 통합하며 별도 기능 수/완료 수를 부풀리지 않는다. 실제 기존 구현을 조사해 재사용/보강하고 현재 상태는 구현 예정이다.

| 담당 단계 | 승인된 세부 내용 전체 |
| --- | --- |
| 2·3·7 선수/평가 | 역할 수행 이력; 챔피언 숙련의 라인전/운영/교전 경험 차이; 주력 챔피언의 패치 적응; 전향 시 공통 경험과 역할 경험 승계; 선호 역할과 실제 배치; 장기 결장 후 건강/경기 감각 복귀 구분; 역할/대회/구단별 개인 기록; 관측에 따른 평가 갱신 속도; 선수 비교의 조건/표본 차이; 과거 평가 오류 보존 |
| 6·7 준비/전술 | 전술 버전/변경 이유; 연습 목적 달성; 조합 실행 난도와 실패 비용; 상대 전략 정보 최신성; 시리즈 중 공개 정보 갱신; 교체의 전략적 이유; 전술 지시 충돌/실행 가능성; 관측 가능한 전략 실패와 실행 실패 구분 |
| 8 경기 엔진 | 귀환 기회비용; 이동 중 전력 공백; 처치 후 전환 조건; 오브젝트 포기/반대편 교환; 교전 후 잔여 전력; 시야 유효 기간; 직접 관측과 추론 구분; 방어 선택의 가치; 우세 팀 공격의 실제 위험; 결과 설명과 해당 경기 기록의 연결 |
| 4·5·10·11 시장/구단/사무국 | 협상안 조건 비교; 제안 만료/변경 기록; 여러 영입의 예산/등록/계획 의존성; 차기 역할별 계약 공백; 임대 목적과 실제 복귀 판단; 시설 투자 완료/효과 시점; 구단 목표 변경 기록; 대회 참가의 일정/이동/가용 부담; 실제 규정 해석 사례; 개정 예고의 내 구단 영향 |
| 12.6·12.7·12.8 뉴스/기록 | 기사 정정/후속 연결; 사실과 해석 구분; 기록 달성 범위; 구단 역사와 당시 인물 연결; 프로필 사건 묶음; 뉴스 중요도 개인화; 과거 정보의 기준 시점; 반복/과장 문구 검수; 근거 없는 극적 서술 제외; 평범한 사건의 과도한 이벤트화 제거 |
| 12.3–12.5 UI/편의성 | 변경 전후 비교; 관련 정보 제자리 확인; 진행 차단 원인/해결 통합 안내; 비교/필터/스크롤 유지; 확정 전 수정과 규칙에 따른 취소; 단위/기준일 일관성; 비활성 행동 이유; 선수 상세 중복 화면 통합; 의미가 같은 필터/설정 통합; 미연결 기능을 작동하는 것처럼 노출하지 않기 |

공통 제약은 유지한다: 구체적인 효과/숙련 판정은 기존 모델과 근거를 확인하고 임의 계수를 발명하지 않는다. 경기 항목은 실제 집계 모델의 소비 경로를 검증하는 조건이며 정확한 개별 시전/geometry를 구현했다고 주장하지 않는다. 가용·관측 정보만 사용하고 과거 자료·게임 기록·저장 호환과 권한/rollback을 지킨다. 승인된 새 연결은 실제 UI/명령/엔진/save까지 구현·검증한다. 기능 목록/문서 작성만으로 완료를 주장하지 않는다.

후속 제안은 수량을 미리 정하지 않는다. 기존 승인 목록과 대조해 실제 빠진 필요만 제시하고 같은 조건을 새 이름으로 반복하지 않는다. 중요한 누락은 보여주되 추측·정책 변경·실제 결함을 구분한다.

## 지속적인 아이디어 발굴·등록과 판정 정확도 개선

사용자의 최신 지시는 아이디어를 계속 발굴·등록하고 모든 부문의 판정 정확도를 높이는 것이다. 아이디어 등록을 중단하거나 기존 승인 구현 뒤로만 미루지 않는다. 각 실제 개발/소스 검토 중 발견한 내용은 기존 담당 단계에 즉시 등록하고 검토 가능한 실제 보강을 구현한다. 단순 목록 작성이 구현을 대체하지 않도록 한 단위에 실제 코드/화면 연결과 집중 검증을 포함한다. 수량을 정하거나 채우지 않고 전체 새 발견을 보고한다. 기존 범위와 겹치면 조건을 합치되 추가 근거/시나리오는 보존한다.

등록 항목마다 목적/실제 촉발 조건, 기존 소스·규칙/외부 근거, 입력과 단위, 상태 작성자와 판정 소비자, 관측/권한, 효과/비용/부작용, UI 설명, 재현/반례/집중 검증, 저장/rollback/AI 영향, 구현 상태와 다음 작업을 적는다. 아이디어 등록은 해당 기능의 검증 완료나 임의 정책/계수의 확정이 아니다. 현재 합의 내 검증 가능한 개선은 진행하고 확정 규칙을 바꾸는 큰 정책은 별도로 명시한다. 정확도 개선은 더 많은 장식 변수나 근거 없는 수치를 뜻하지 않는다. 패치/단위/조건/적용 순서/관측 경계/시간/동시성의 구체적인 오판정을 줄이고, 구현하지 않은 개별 시전/geometry를 구현했다고 주장하지 않는다.

아래는 직전 전체 제안의 누락 없는 등록이다. 기존 경로를 먼저 조사해 기존/부분/결함/신규를 구분하고, 일치 항목은 담당 단계의 보강으로 통합한다.

| 담당 범위 | 등록한 전체 아이디어 |
| --- | --- |
| 선수/구단 선택 (2·4·5·6) | 계약 종료 후 무소속 활동/테스트/진로; 공개 가능한 제안 거절 이유; 조건 변경에 따른 결렬 후 재접촉과 반복 제안 편법 방지; 같은 주전 자리 중복 약속 등 이행 가능성; 지도자 업무 수용량; 부상/이적/전향에 따른 육성 계획 변경; 역할/챔피언 폭/교체 활용을 고려한 구성; 기존 계약 체계 안의 임대/육성 협력 관계 |
| 대회/세계 연속성 (4·10·11) | 대회별 등록 명단; 이적 확정/계약 시작/등록 완료 사이 참가 자격; 순연의 휴식/훈련/준비 영향 1회 적용; 대회 취소/참가 철회 시 결과/정산/등록 처리 규칙 검토; 계약 만료/임대 복귀/승강/등록/일정 생성의 시즌 경계 순서; 사무국 간 관할/일정/규정 충돌 해결; 개정 공표/준비 기간; 공동/동률 기록의 정확한 표시 |
| 경기 판정 정확도 (8·9) | 동시 사건 처리 순서의 편향; 동일 처치/보조/오브젝트/퀘스트 보상 중복; XP와 골드 별도 경로; 사망/복귀/이동/출전 상태 일관성; 버프 소유/만료/갱신의 실제 효과; 검토된 방어 감소/관통/보호막/회복/치감 적용 순서; 효과 적용 불가 이유; 넥서스 종료 후 행동/보상/통계 확정; 계산 중단을 공식 결과로 저장하지 않기 |
| 정보/기록 신뢰성 (3·10·12) | 평가/티어/사무국의 근거 자료 연결; 누락 정보와 낮은 성적 구분; 데이터 제외 이유; 공개 통계/내부 관측 출처·권한; 인물/구단 이름 변경 후 ID/경력 연속성; 해체/은퇴 후 기록 접근; 실제 계산과 원인 설명 일치 |
| 편의성 (12.3–12.5) | 다음 경기 준비 요약; 다른 계획에 영향을 주는 변경의 미리보기; 핵심/펼쳐보기 정보 밀도; 날짜 진행 후 최근 작업 맥락 복귀; 대량 작업의 부분 실패와 안전한 재시도; 중요도 낮은 자동 팝업 축소; 반올림/단위/기간 표현 통합; 미소비 설정 연결/제거; 고급 분석 읽기 기본 강요 제거 |

아마추어 경기 시뮬레이션 금지, 프로 대회 데이터만 경험적 보정, 확정 가상 규칙, 원본/진단/게임 역사 보존, 한 담당자·시간당 45–55분 구현 단위, 정확한 PR head 필수 CI·순차 병합·검증된 웹/HTML 배포와 최종 QA 보류는 유지한다. 변경 없는 검토를 반복하지 않고 개발에서 새 근거와 재현을 찾는다. 의미 있는 새 발견·구현·실패만 보고하며 문서 등록과 배포된 기능을 구분한다.

## 12.9 분석실 독립 탭 — 승인된 구현 예정 범위

사용자는 FM처럼 별도 분석실 탭에서 분석 기능을 사용할 수 있게 요청했다. 분석실을 메인 내비게이션의 독립 화면으로 추가하고 실제 자료와 근거를 한곳에서 비교한다. 기존 `ui-patch.js:patchAnalystCard`, `ui-opponent-report.js`, `ui-opponent-draft.js` 및 분석/관측 집계를 먼저 재사용한다. 현재 `ui-state.js:UI_ROUTES`에는 season/match/squad/patch/data만 있어 독립 분석실은 아직 미구현이다. 실제 패치 노트/규칙과 분석 화면을 혼동하지 않게 구분하며 기존 명령·저장 원본을 복제하지 않는다.

| 분석실 영역 | 실제 연결 기준 |
| --- | --- |
| 우리 팀 | 관리 권한이 있는 1군/2군의 공식 경기·허용된 연습 관측, 역할/조합/전술/성장·피로 분석. 숨은 능력을 보고서의 관측값으로 노출하지 않음 |
| 상대 분석 | 실제 공개 로스터·출전·픽밴·운영 기록, 현재 선수와 당시 소속 구분, 타 팀 비공개 연습 제외 |
| 경기 복기 | 기록이 지원하는 자원/구매/교전/오브젝트 전환점과 결과 이유, 해당 경기 기록으로 이동. 없는 위치/시전 정보를 만들어 표시하지 않음 |
| 밴픽·메타 | 별개의 대중 티어/팀 내부 티어, 역할/패치/대회/기간별 표본과 픽밴·조합. 공개/비공개 권한과 관측 불확실성 유지 |
| 선수 비교 | 당시 보고서와 현재 관측, 역할/상대/출전 표본을 맞춘 비교. 평가 근거로 이동 |

공통 조건은 관리/공개 범위, 기간·대회·패치·역할·표본/누락·출처가 보이는 것이다. 적은 표본/여러 패치/집계 연습의 모델 차이를 안내하고 인과 효과로 단정하지 않는다. 표/차트는 지원되는 실제 자료만 사용한다. 자료가 없으면 왜 없는지와 합법적으로 자료를 얻는 경로를 보여주고 빈 화면을 가짜 수치로 채우지 않는다.

분석 결과에서 관련 선수/구단/경기/패치로 이동하고 사용자가 전술·훈련에 반영할 때는 기존 실제 설정 화면/공유 명령과 조건 안내로 연결한다. 추천을 무조건 자동 적용하거나 추가 필수 분석 업무를 만들지 않는다. 기간/비교/스크롤 맥락을 유지하며 담당 모듈/집계 진입점/검증을 명시한다. 단순한 명시적 인터페이스로 분석실 화면과 엔진 집계를 분리하고 FM 자산/문구를 복제하지 않는다.

첫 45–55분 구현 단위: 현재 PR의 필수 CI 실패 해결/중복 작업 확인 후 별도 분석실 모듈·메인 탭·공통 라우터를 추가하고 기존 공개/권한 있는 보고서 중 완전한 조회 경로부터 연결한다. 실제 조회→필터/자료 없음→관련 화면 이동→세계/슬롯 변경 시 맥락 초기화·권한 재검증을 집중 확인한다. 나머지 영역은 정확한 남은 경로를 기록해 이어서 구현하며 가짜 탭이나 전체 완료 선언을 피한다. UI 전면 재설계/현재-head CI/순차 병합·배포·최종 QA 보류 기준을 유지한다.

## 감독 커리어·분석 도구·효과 판정·사용성 전체 승인

사용자가 직전 목록 전체를 추가하도록 승인했다. 아래 전체 내용을 기존 단계의 구현/검증 범위에 통합한다. 기존 상태/소스 확인 후 재사용·연결·결함 수정·신규를 구분하며 현재는 승인/구현 예정이다. 정책/메커니즘 근거 없이 가격/효과/성공률을 만들지 않는다.

| 담당 단계 | 승인된 전체 내용 |
| --- | --- |
| 5·11·12 감독 커리어 | 감독 경력 페이지; 구단 목적별 채용 기준; 감독 계약/권한/목표/여건 제안 비교; 취임 인수인계; 이직 후 구단 상태/계획 연속성; 근거 있는 해임/사임 이유; 실제 공석/조건과 구단 지원; 플레이어의 실제 선택에서 형성된 감독 스타일 평가 |
| 3·12.9 분석실 도구 | 당시 패치/조건/원자료를 고정한 보고서 저장; 관심 선수/조합 묶음; 선택적 사용자 메모/태그; 비교 기준 저장; 원자료/해석/사용자 메모 구분; 패치/역할/상대 차이 경고; 동시 변화의 원인 단정 방지; 선택/강팀 표본 편향 안내; 역할별 자원 대비 성과; 권한 내 보고서 내보내기; 분석→기존 준비 계획의 적용 전 변경 비교 |
| 8·9 효과 판정 | 피해 유형별 대응; 공격 접근 가능성과 사거리; 순간/지속 피해와 교전 시간; 핵심 효과 가용 상태; 실제 보호/공격 대상; 과잉 효과의 유효 가치; 실제 유효 회복/보호막; 제어 효과 종류; 아이템/룬 적용 조건; 자원 부족에 따른 행동; 대상 변경/중단 비용; 웨이브/방어/시간을 포함한 구조물 공격 조건 |
| 12 사용성/저장 | 선수/구단/대회/규칙 통합 검색; 즐겨찾는 화면; 선택적 첫 화면 안내; 문맥 용어 사전; 글자 크기/표 밀도; 권한 내 정확 수치/요약 표현; 저장 구단/시즌/게임 날짜/빌드/시점 정보; 기존 저장/새 게임 변경 차이 안내; 덮어쓰기/불러오기 실패 시 정상 저장 보호; 실제 업데이트 요약; 행동별 도움말; PC 단축키와 작은 화면 기능 동등성 |
| 3·5·8·12 제거/수정 검토 | 여러 화면의 중복 확정 절차; 분석가 부족 때문에 공개 원자료까지 숨기는 방식; 표본 수만으로 정확성을 단정; 역할 무시 KDA/승률 순위; 스태프 한 명의 전 업무 만능 효과; 모든 AI 구단의 같은 목표/영입/전술; 메뉴 개수만 늘리는 독립 화면; 새 사건 없는 반복 불만/팬 반응; 실제 원인과 무관한 장식 그래프; 영향 설명 없는 옵션 |

효과 판정은 검토된 패치 메커니즘과 지원하는 모델/자원의 실제 writer→consumer→결과를 검사한다. 집계 모델을 정확한 개별 시전/geometry로 과장하지 않고 일부 메커니즘만 구현된 경우 지원 범위를 표시한다. 생활/커리어·분석은 관측/고용/계약/진행 권한을 지키며 숨은 정보를 내보내지 않는다. 스태프 전문성은 해석/업무 효과와 공개 원자료의 접근을 구분한다. 표본 수가 많아도 편향/조건 혼합을 제거한 것으로 간주하지 않는다.

각 단위의 실제 화면/명령/상태/저장 연결과 반례 검증을 기록한다. 공개 웹과 다운받은 HTML 양쪽의 작동을 고려하되 최종 장기/실기기 QA는 선행 조건 충족 전 보류한다. 새 아이디어는 지속 등록하고 동일 승인 기능은 한 번만 배치한다.
