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

한 명의 구현 담당자가 기존 시간당 45–55분 단위로 진행한다. 현재 열린 PR의 실패를 보존·해결하고 중복 작업을 피한다. PR #164의 초기 head `575d6203d605672173777411c32f19a6807755bc`에서 발생한 35초 core 실패는 보존한다. 최종 head `45e55e3d1eb75785cf80b5feafe9c39130c031fa`의 필수 CI `37147718717` 전체 성공(의료 4시드·2집계 포함)을 확인한 뒤 main `606b3d63eca2e6923ef4b004ae26b575dac2c4f2`로 병합했다. 분석실 첫 흐름 PR #165는 main `b9e3a65c510dde5b0e8a94ebbd5b83b3cb1b158a`의 CI `37149338522`와 Pages `37149770866`까지 성공했다. 공개/내부 티어 PR #166은 최종 head `a69ed20662acd96230f6427b9dadcdf3d7ff2c78`의 필수 CI `37151397972` 전체 성공 후 main `9d4d13cb91a788d555ced365929e9293ca612801`로 병합했다. 같은 main의 CI `37151887620`·standalone-sync 및 Pages `37152219937` 성공과 저장소 HTML 일치를 확인했다. 같은 후보 비교 PR #167은 최종 head `69390728286792597b6db00f246302030314f4c6`의 필수 CI `37154848493` 전체 성공(의료 4시드·2집계 포함) 후 main `023db1ebb731a50551bb829e94577c3424a7c6bd`로 순차 병합했다. 이 main의 CI `37155290244`·standalone-sync와 Pages `37155554005` 성공, 검증 head와 main HTML 일치를 확인했다. 이전 `c55efce`의 CI `37154672981`은 제한 설명 수정으로 대체/취소된 기록이며 최종 게이트 통과로 간주하지 않는다. 실제 밴픽 비교 PR #168은 최종 head `caaf6bea008620d9efa4b7d7ec33dcfbaabb37a6`의 필수 CI `37158156615` 전체 성공(의료 4시드·2집계 포함) 뒤 main `d43c9e161c52bc178555db71c50077b4eb4afb98`로 순차 병합됐다. 같은 main의 CI `37158616072`·standalone-sync와 Pages `37159016683`의 검증 artifact·조립·배포 성공, 테스트 head와 main HTML 일치를 확인했다. 수동 밴픽 당시 근거 PR #169는 최종 head `169cdd32f849b5a2e3f20b22141e1086b3ec623f`의 필수 CI `37161438479` 전체 성공(의료 4시드·2집계 포함) 후 main `041817b77164508cc756c663f73068d489f79f6b`로 순차 병합됐다. 같은 main의 전체 CI `37161783420`·standalone-sync와 Pages `37162158263`의 검증 artifact·온라인/오프라인 조립·배포 성공, 테스트 코드/docs/HTML 일치를 확인했다. Cloud 정책이 github.io 접속을 403으로 차단해 실제 공개 HTTP 응답은 여기서 재확인하지 못했다. 분석 흐름의 배포 워크플로 성공은 전체 분석실/재설계 완료를 뜻하지 않는다. 재설계 구현은 별도 검토 가능한 작업 단위/PR로 진행하고 정확한 현재 head의 필수 CI 성공 후 순차 병합·HTML/웹 배포한다. 전체 구조/구단 개요 12.3–12.5도 남아 있고 분석 12.9.5가 병합·게시됐으며 현재 경기 단위는 8.1.1이고, 전면 교체가 끝났다는 선언보다 실제 화면별 연결 증거를 기록한다.

현재 검증된 출시 기준(2026-10-04): PR #171 최종 `d173a7f67f9da33dc7d6506be5ee3f9b629f99ac` 전체 CI `37168431212` 후 main `b1cf7abb94bd00583baf78d34872d19de96a9605` 병합. 같은 main 전체 CI/standalone `37168684378`, 검증 artifact/Pages `37168959385` 성공. 현재 구현 단위는 8.2.1이며 아직 새 출시 게이트를 통과하지 않았다. 직접 github.io HTTP는 정책 차단 상태다. 이전 출시 증거는 위 기록과 각 단위에 보존한다.

## Unified numeric roadmap

This is the development task hierarchy, not a change to internal game architecture.
Current work uses numeric stages, task names, goals, completion criteria and
precise remaining work. Existing
implementation and validation evidence remain preserved in the historical archive.
Each substantial work unit uses a dotted number and a coherent 45–55-minute boundary.

| Stage | Current scope | Acceptance boundary |
| --- | --- | --- |
| 1. Foundation and new game | world/team selection, initial FA supply, identity/calendar | Previously verified foundation; reproduce legal starts, budgets/registration and save; legal initial supply now verified in PR #164; preserve roster minimums/import limits and recheck future starts |
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
- 1.1 Legal initial FA supply: PR #164 implements deterministic pre-auction
  supply with actual roster/import constraints; focused acceptance and exact-head
  required CI passed. External professional/group data remains independently blocked.

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

## 12.9 분석실 독립 탭 — 첫 조회 흐름 구현, 확장 진행 중

사용자는 FM처럼 별도 분석실 탭에서 분석 기능을 사용할 수 있게 요청했다. 분석실을 메인 내비게이션의 독립 화면으로 추가하고 실제 자료와 근거를 한곳에서 비교한다. 기존 `ui-patch.js:patchAnalystCard`, `ui-opponent-report.js`, `ui-opponent-draft.js` 및 분석/관측 집계를 먼저 재사용한다. `ui-state.js:UI_ROUTES`에 analysis 경로와 메인 분석실 탭을 추가했다. 첫 구현은 관리 구단의 기존 관측 보고서와 상대 공개 보고서의 실제 조회 흐름이며, 아래 전체 분석 영역의 완료를 뜻하지 않는다. 실제 패치 노트/규칙과 분석 화면을 혼동하지 않게 구분하며 기존 명령·저장 원본을 복제하지 않는다.

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

## 후속 발견 등록 — 검토 후보, 구현 완료 아님

지속 발굴 지시에 따라 다음 누락 후보를 등록한다. 직전 승인 범위와 겹치면 기존 완료 조건에 통합하고, 실제 소스 검토/규칙 근거 전 미구현·확정 정책으로 단정하지 않는다.

- 대회 예외: 부전승/기권과 실제 경기 통계 분리; 시리즈 조기 확정 이후 불필요 경기 미실행; 동률 절차의 우선순위/사유; 재경기/무효 경기의 공식 통계 편입 규칙; 참가팀 변경 후 대진/시드/등록 일관성; 조건부 출전권의 최종 확정 상태; 국가별 2부와 상위 리그의 일정 경계; 팀별 휴식/이동 편중 점검.
- 밴픽 경계: Fearless 규칙별 사용 제한 범위; 시리즈 내 역할/선수 교체 후 금지 이력 유지; 챔피언 사용 가능 날짜와 대회 패치 동시 검사; 유효 조합이 없는 예외의 사전 처리; First Selection 선택/잔여 선택의 중복·순서 오류; 마지막 순간 로스터 변경 시 준비 보고서의 오래된 조건 안내.
- 판정 검증: 동일 입력/패치/시드 재현; 블루/레드 교환 대칭 시나리오; 표기/정렬만으로 난수 소비가 달라지는지; 경계값/반올림의 판정 영향; 결과에 영향을 주지 않는 변수가 설명 원인에 등장하는지; 실제 계산과 집계 연습의 결과 구분; 작은 규칙 변경의 과도한 효과와 상호작용; 재현용 최소 상태/규칙/seed 보존.
- 세계/경제 예외: 약속된 수입 미입금과 실제 가용 현금 구분; 구단 해체 후 보존할 지급/계약 의무; 스폰서 조건과 스포츠 권한 충돌 검토; 이미 약속된 시설/고용 지출과 자유 예산 분리; 참가팀 부족 시 사무국의 합법 유지/보류 경로. 새 계약 정책/가격은 근거 검토 대상이다.
- 웹/오프라인: 저장 용량/브라우저 제한 사전 안내; 저장 실패 시 성공 메시지 금지; 다운로드 HTML/웹 빌드·대회 패치·게임 날짜 구분; 웹 업데이트 중 진행 작업/정상 저장 보호; 내보내기 파일의 무결성/호환 검사; 외부 접속 없는 상태의 기능 지원 범위; 사용자 메모/대상 이름 입력의 안전한 표시. 기록 삭제/유료 서비스 도입으로 문제를 숨기지 않는다.

각 항목은 기존 담당 단계에 소스/실패 재현/권한/실제 소비/UI/save 검증을 붙여 검토한다. 재경기/스폰서 등 새로운 정책이 필요한 항목은 확정 규칙을 발명하지 않는다. 검증 활동은 짧고 대표적인 시나리오로 제한하며 최종 장기/기기 QA와 혼동하지 않는다.

## 10.1 연결 검증 / 초기·후속 시장 병목과 조직 권한 보강

PR #164의 이전 head `3385154d2dfb77076ef549790e07a2494e88f83a` 필수 CI `37143840624`에서 core smoke의 35초 제한 및 ui-finance-contracts의 훈련 기회비용 검사가 실패했다. 이 실패는 그대로 보존한다. 최종 head의 성공·병합 상태는 위 현재 방향에 기록하며 이전 실패를 성공으로 바꾸지 않는다.

- 원인/측정: `/tmp/league-smoke.cpuprofile`에서 `marketDemandSnapshot`과 `activeTeams`가 주요 CPU 소비였다. 수요 캐시가 적중해도 가격 조회마다 전체 선수 키와 활성 1부 목록을 다시 만들었다. 확대된 초기/후속 시장의 가격·후보 정렬에서 반복됐으며 제한을 올리지 않았다.
- 구현: `contract-market-pricing.js`가 시장 수요/가격과 동기적인 topology-read 인덱스를 소유한다. `initialMarketSnapshot`, `eligibleFillFAs`, `aiMarketOfferCandidates`의 선수/팀 구성 불변 조회 범위에서 기존 키의 연도·선수 수·지역별 1부 수를 한 번 구한다. WeakMap 인덱스는 finally로 제거되고 세계/save에 저장하지 않는다. 입찰·계약·추가/은퇴/시즌 변경은 범위 밖에서 기존 재검증/캐시 무효화를 유지한다. 새 모듈은 5500자 제한이며 기존 contracts.js의 26000자 제한은 유지한다.
- 동일성: `market-reserve-acceptance.mjs`는 최적화 비활성 기준과 모든 지역 가격/정렬·FA 보충 후보·AI 후보·전체 세계 상태를 비교한다. 실제 초기 입찰 라운드의 제안/영입 결과와 계약/재정/관측/이력 포함 전체 상태도 일치했다. 전역/미상 지역, 중첩/예외 정리, 범위 종료 후 선수 수/연도/활성팀 변경 확인도 통과했다.
- 성능의 범위: 같은 VM의 대표 지역별 가격 일괄 조회에서 기준 794/826ms, 인덱스 83/89ms를 관측했다. 이는 가격 조회 측정이며 전체 경기 엔진이나 모든 UI가 그 비율만큼 빨라졌다는 뜻이 아니다. 120모듈 최종 core smoke는 기존 35000ms 제한에서 28002.6ms에 통과했다. 과거 실패/프로파일은 `/tmp/league-smoke-*`와 GitHub CI 로그에 보존한다.
- 드러난 실제 권한 결함: 최소 로스터 보충에서 관리 모구단은 system을 사용했지만 소유 2군은 ai로 실행되어 공유 validator에 거절됐다. 수동 관리 조직은 모구단/2군 모두 계약 권한을 지키며 기존 최소 보충만 system 경로를 사용한다. 일반 AI 영입/팀 옵션/재계약은 관리 조직을 침범하지 않는다. 소유 2군 감독의 계약 권한이 모구단에 있는 기존 정책은 유지한다. 집중 검사에 실제 reserve market 보충과 AI 직접 계약 거절을 추가했다.
- 테스트의 별도 원인: `cohesion-practice-acceptance`가 풀의 첫 삽입 챔피언을 실제 훈련 대상으로 가정했다. 확대 세계의 선택 선수에서는 해당 챔피언이 훈련되지 않아 실패했다. 대상 하나를 임의 고르지 않고 실제 전체 챔피언 훈련량과 개인 훈련의 상반된 변화가 모두 있는지 검증한다. 공유 시간/연간 성장 소비/코칭/AI/저장 검증은 유지했고 production 훈련 판정은 바꾸지 않았다.
- 로컬 증거: 시장/입찰 동일성·조직 권한, 훈련 기회비용, 리그 표시/6개 실제 2부/최초 합법 로스터, 기존 30초 회귀, 120모듈 검사·standalone 빌드 통과. 필수 전체 CI는 최종 커밋 head에서 별도 성공해야 한다. 아직 국가별 2부/중계 충돌/분석실/전면 UI 재설계가 구현됐다는 증거는 아니다.

이 head의 필수 CI·순차 병합은 완료했다. 검증된 main 배포를 확인하고 10.2/10.3과 12.3/12.9 중 실제 연결 경계가 명확한 한 단위를 이어간다. 분석실 첫 조회 흐름은 아래 12.9 증거와 PR #165로 구분한다. 이미 승인된 전 범위·지속 발견은 유지하며 장기/실기기/TalkBack QA는 보류한다.

### 동일 Node 22 러너 기준 추가 병목 보강

최적화 head `2ca892806e7b88c99526c65e3e7ca6d89e0d6978` CI `37147169602`는 UI/계약·리그/일정·회귀 등에서 통과했지만 core smoke가 35초 제한에 다시 실패했다. 로컬 Node 24 통과만으로 병합하지 않았고 `/tmp`에 Node 22.23.3 실행기를 준비해 CI와 같은 버전으로 대표 측정했다. 기존 시간/메모리/검사 범위를 늘리지 않는다.

Node 22 CPU 프로파일에서 `activeTeams`가 가장 큰 누적 소비였다. 후보/제안의 topology-read 범위까지 인덱스를 연결하고, `world.js`의 `withActiveTeamReadIndex`가 그 동기 구간에서만 지역/부문 조회를 재사용한다. 반환 배열은 항상 복사해 호출자 sort/reverse가 다른 조회 순서를 바꾸지 않는다. finally에서 제거하고 로스터/계약 실행 전 범위를 끝내므로 쓰기 이후 조회는 실제 최신 상태다. 타입/미상 지역/기본 부문 필터 의미, 중첩/예외 정리, 전체 입찰 상태 동일성 검사를 유지·확장했다.

같은 Node 22에서 대표 core smoke가 29675.3ms(수요 read 범위)에서 24583ms(활성 팀 read 포함)로 줄었다. 최초 로스터 구간은 13017.9→8379.2ms였다. 프로파일 오버헤드/런너 환경이 달라 CI 시간 보장이나 전체 경기 속도 비율로 일반화하지 않는다. 정확한 최신 head 필수 CI가 통과하기 전에는 여전히 병합/배포 완료가 아니다. 원래 실패와 원본 측정을 보존한다.

최종 Node 22 전체/핵심 smoke는 각각 26725.7/26591.3ms에 통과했고 live 세계·후속 시장·시리즈·저장 세계·저장 시장의 canonical fingerprint가 모두 동일했다. 이 실행은 fingerprint 작성 비용을 포함한다. 필수 CI 최종 head 확인은 여전히 별도 gate다.


### 12.9 첫 분석실 구현 증거와 다음 경계

- 화면 소유: `src/artifact/ui-analysis.js`의 `viewAnalysis`/`bindAnalysis`. 내비게이션과 일시적 `ANALYSIS_SET`은 `ui-state.js`, 메인 탭은 `shell.html`이다. 기존 보고서와 엔진 원본을 복제하거나 새 게임 저장 필드를 만들지 않았다.
- 실제 경로: 분석실 → 우리 팀/상대 준비 → 관리 권한이 있는 1군·소유 2군 선택 → 최근 30/90일·전체 기간, 패치, 기록 역할 필터 → 공식전/엔진 스크림/집계 연습 구분, 전술 및 분석가 관측, 상대 공개 선수/픽밴 보고서. 없는 패치/표본은 자료 없음으로 표시한다.
- 운영 연결: 선수단·훈련·전술, 일정·경기 기록, 패치·메타 자료로 공통 라우터를 통해 이동한다. 소유 2군을 선택한 경우 선수단 화면도 같은 구단을 선택한다. 기존 실제 명령에서 사용자가 직접 설정하며 분석이 자동으로 전술/훈련을 바꾸지 않는다.
- 권한/연속성: 조작된 외부 관찰 구단 ID는 권한 있는 구단으로 되돌린다. 2군 감독은 관리 2군만 조회하고 부모 구단 비공개 연습에 접근하지 않는다. 해임 후 비공개 보고서를 제공하지 않는다. 세계/저장 슬롯 교체 시 모든 분석 조건을 초기화하고 다시 권한을 확인한다. 단순 조회/필터/이동은 게임 원본을 변경하지 않으며 저장·재로드 뒤 기존 보고서를 다시 읽는다.
- 집중 검증: `scripts/analysis-room-acceptance.mjs`는 실제 공식 경기·연습 기록과 렌더러/이벤트 바인딩을 이용해 필터, 외부 ID, 상대 비공개 자료/숨은 능력 접근 차단, 2군/해임 권한, 이동, 원본 불변성과 저장 연속성을 확인한다. 공통 라우팅·비동기·기본 접근성 계약 검사도 통과했다. 추가로 실제 Chromium에서 필터/상대 선택/보고서 표시와 키보드 이동, 1280px·320px 문서 가로 넘침 없음 및 페이지 오류 없음을 확인했다. 실행 환경 정책이 file URL 탐색을 막아 동일 standalone HTML을 브라우저 문서에 주입했다. 실제 호스팅·실기기·TalkBack 최종 검증 완료를 의미하지 않는다.
- 남음: 경기별 전환점 복기, 티어의 추가 대회/상대/조합 맥락과 고정 보고서(첫 분리는 아래 12.9.1), 맥락을 맞춘 선수 비교, 보고서 고정/관심 목록/메모/조건 저장/권한 내 내보내기. 기존 보고서의 직접 선수·경기 근거 링크와 대회별 필터도 해당 영역 구현에서 연결해야 한다. 전체 분석실이나 전면 UI 재설계가 완료된 것은 아니다.
- 새 확인점: 기존 보고서 조회를 한곳에 모으는 것과 평가 소비자·권한 있는 근거 이동을 완성하는 것은 별도 경계다. 이를 새 중복 기능으로 늘리지 않고 기존 12.9 완료 조건으로 유지한다. 정확한 신규 PR head CI·순차 병합 및 main 배포가 성공하기 전에는 배포된 기능으로 표시하지 않는다.

검증 실패 원본: 첫 통합 검사는 신규 fixture 추가 후 고정 VM context 수가 54→55로 바뀌어 실패했다. 기존 검증을 제거하지 않고 새 fixture를 포함한 정확한 기대 수로 수정해 Node 22 통합 검사가 성공했다. sandbox의 프로세스 생명주기 검사/Chromium 소켓 제한과 file URL 탐색 제한도 기록하며, 허용 네트워크 실행에서 프로세스 검사와 동일 HTML 브라우저 주입 검사를 수행했다.

첫 화면 브라우저 점검에서 필터 재렌더링으로 기존 입력 요소가 교체되는 것을 확인하여, 동일 필터/조회 모드의 키보드 포커스를 새 요소에 복원했다. 공통 컨트롤 스타일을 재사용해 좁은 화면의 조건 선택을 세로로 배치했고, 필터 포커스 연속성을 실제 Chromium과 이벤트 검사에 추가했다.


### 12.9.1 대중·팀 내부 티어의 실제 평가 연결

상태: PR #166의 정확한 최종 head CI, 순차 병합, main CI·standalone-sync 및 Pages 배포 성공을 위 현재 지점에 기록했다. 이는 티어의 첫 분리/연결 완료이며 전체 분석실 완료가 아니다. 다음 비교/대회 근거 연결은 아래 12.9.2에서 구분한다.

| 흐름/책임 | 실제 구현과 완료 경계 |
| --- | --- |
| 대중 티어 | `analysis-tiers.js:publicChampionTiers`는 공개 공식 경기와 현재 패치 규칙만 사용한다. 비공개 구단/선수 자료를 전부 접근 차단한 새 저장 복원본에서도 같은 결과를 확인했다. 기존 `ui-patch.js`의 밴픽 빈도 등급/표본 없을 때 패치 예상 순위 규칙을 `championTierLabels`로 재사용한다. 검증된 외부 대회 보정 자료를 수집했다고 주장하지 않는다. |
| 팀 내부 준비도 | `internalChampionTiers`는 관리 권한과 해임 상태를 먼저 확인하고 선택 구단의 현재 명시적 주전 배치만 읽는다. 선수별 숙련과 기존 구단 메타 연구/분석·스크림 지원/전술을 밴픽 평가 소비자 `draftPickValue`에 연결한다. 미훈련 챔피언의 기존 기본 평가값은 실제 숙련 관측으로 표시하지 않는다. |
| 공용 평가/행동 동일성 | `draft.js:draftTeamMetaAssessment`로 기존 세션의 구단별 메타 평가를 분리했다. 모든 기존 계수·잡음·표본 가중치·배열 순서를 유지한다. 검증된 이전 main의 `createDraftSession`을 테스트 전용 원본으로 보존하고 3개 seed의 메타 값 및 전체 픽/밴/배치/설명 동일성을 확인했다. 표시된 내부 후보의 역할별 점수/요인도 실제 새 드래프트와 동일하다. |
| 화면/명령/근거 이동 | `ui-analysis-tiers.js`는 분석실 밴픽·메타 → 대중/내부 전환 → 후보 역할/챔피언 검색 → 평가 요인 펼치기 → 실제 챔피언 규칙 또는 해당 선수 상세/선수단 이동을 연결한다. `ANALYSIS_SET`은 일시적 UI 조건이며 세계 교체 시 초기화한다. 새 영입/훈련/아이템 수동 입력 업무를 추가하지 않는다. |
| 자료·상태 한계 | 대중 후보 역할은 현재 챔피언 설정을 좁히는 조건이며 밴을 특정 역할에 귀속하지 않는다. 날짜 미확인/미도래 자료는 파생 공개 표본에서 제외하고 원본은 보존한다. 과거 패치 당시 내부 상태를 현재 숙련으로 복원하지 않는다. 내부 평가는 현재의 사전 후보 상대 순위이며 승리 확률이 아니다. 상대 픽/현재 조합/Fearless/시리즈 경험은 아직 이 표의 맥락에 연결하지 않았다. |

- 플레이 예: 우리 팀 미드의 특정 챔피언 숙련 기록이 바뀌면 내부 후보의 실제 숙련 기여가 바뀌지만 대중 티어는 그대로다. 주전 슬롯이 비었거나 외부 선수를 가리키면 분석 조회가 배치를 자동 보정하거나 외부 선수의 비공개 건강/숙련을 읽지 않는다. 기존 선수단에서 실제 배치를 확인해야 한다.
- 검증: `scripts/analysis-tiers-acceptance.mjs`의 실제 공식 경기, 공유 평가/전체 드래프트 seed 동일성, 공개/비공개 getter 접근 차단, 과거 상태/잘못된 배치/미도래 기록, 표시/전환/검색/선수·챔피언 링크, 2군/해임/저장 재로드. Node 22 UI·재정·계약 통합 검사의 57개 acceptance, 독립 엔진 context 56개 및 123모듈 검사/standalone 빌드가 단기 증거다. 최종 head CI는 별도 필수다.
- 실제 Chromium: 공식 경기 1전 자료를 만들어 내부 전환/요인 펼치기/역할 필터 포커스/챔피언·선수 상세 이동/검색 빈 상태를 확인했다. 1280px·320px 문서 가로 넘침과 페이지 오류가 없었다. 동일 HTML 문서 주입 검사이며 공개 사이트 실응답·실기기/TalkBack 최종 검증을 뜻하지 않는다.
- 이번 확인점을 기존 승인에 통합: `starterFor`는 조회 중 배치를 초기화할 수 있고 `createDraftSession` 전체는 양쪽 전술/지원 자료를 읽는다. 조회 화면은 명시적 배치와 권한 있는 구단별 평가만 재사용한다. 공개/내부 권한과 조회 순수성의 완료 조건이며 별도 새 기능 수로 늘리지 않는다. 현재 패치의 날짜 미확인 원자료가 있으면 내부 평가를 보류한다. 이 방어는 기존 모든 엔진 표본 경로를 전수 정비했다는 증거가 아니다.
- 다음 자연스러운 45–55분 경계: 공개 티어와 내부 준비도를 같은 후보/역할에서 나란히 비교하고 실제 차이 이유를 연결하되, 기존 관측 집계와 같은 점수를 재사용한다. 대회별 필터 및 실제 선택 조합/공개 상대 맥락 중 완전한 조회→근거 이동→권한/저장 경계부터 연결한다. 보고서 고정/관심 목록·메모/권한 내 내보내기와 전체 경기 복기/선수 비교는 다음 단위로 남긴다. 외부 보정/경험적 등급 재설계는 검증된 프로 데이터와 정책 검토 전에 발명하지 않는다.

추가 단기 증거: Node 22 기존 회귀 검사와 core smoke 통과(core 26.3초, 기존 35초 제한 유지). 이는 평가 함수 분리 후의 관련 회귀 증거이며 전체 성능 향상이나 장기 최종 QA 완료 주장으로 사용하지 않는다.


### 12.9.2 같은 후보의 대중·내부 티어 비교와 대회 근거 이동

상태: PR #167의 정확한 최종 head 필수 CI, 순차 병합, main 재검증·HTML/Pages 배포 성공을 위 현재 지점에 기록했다. 새 게임 정책이나 평가 계수를 추가한 단계가 아니다.

| 흐름/소유 파일 | 구현·완료 경계 |
| --- | --- |
| 같은 후보 비교 | `analysis-tiers.js:championTierComparison`은 기존 공개 등급과 권한 있는 현재 내부 평가를 챔피언 ID/선택 후보 역할로 결합한다. 내부 순위/실제 점수·요인을 그대로 사용하며 서로 다른 등급을 차감·합산하거나 차이를 인과 효과로 주장하지 않는다. 유효 내부 후보가 없으면 현재 배치/패치/권한 이유를 표시한다. 공식 사용 제한 챔피언은 주전 미배치로 오인시키지 않고 실제 사용 제한 사유를 구분한다. |
| 실제 대회 조건 | `ui-analysis.js:analysisFilter`의 대회 조건은 공개 공식 기록과 기존 우리 팀/상대 보고서에 연결된다. 대회 후보는 날짜가 확인된 실제 공개 원자료에서만 추출해 미래 기록만 있는 대회를 노출하지 않는다. 대회별 공식 1전+1전 fixture에서 전체 공개 2전과 선택 대회 1전을 구분했다. 기존 연습 비교 소비자는 대회 조건이 스크림에 해당하지 않으므로 연습을 제외하고 이유를 표시한다. 내부 준비도는 현재 패치 전체/지역 메타 및 구단 자료를 사용하며 선택 대회/기간에 맞춰 과거 내부 상태로 재계산하지 않는다. |
| 화면·근거 이동 | 독립 `ui-analysis-comparison.js`는 밴픽·메타 → 나란히 비교 → 대회/역할/검색 → 후보별 실제 요인 → 선수/챔피언 상세 또는 실제 공개 대회·패치 원자료 화면으로 연결한다. 공개 기록 이동은 대회/패치/기간/후보 역할을 유지하고 이전 구단·선수·상대·실제 픽 역할·진영 조건을 초기화해 공개 분모가 다른 팀의 자료나 역할별 밴 추정으로 바뀌지 않게 한다. |
| 실제 출처·날짜 경계 | `publicTierSourceGroups`는 확인된 날짜의 공식 원자료를 대회·기록 패치별 경기 수/최초·최종일로 묶는다. 미상 대회·패치를 추정하거나 이동 불가능한 가짜 버튼을 제공하지 않는다. 기존 원자료 화면이 비교에서 제외한 미도래/날짜 미확인 기록을 다시 포함할 수 있는 반례를 확인했으므로 해당 출처의 이동은 검토 전 보류하고 이유를 표시한다. 비교 표의 유효 표본은 계속 제공하며 원본 기록은 삭제/변조하지 않는다. 이는 기존 모든 메타 소비자의 날짜 판정을 정비했다는 뜻이 아니다. |
| 유지보수·상태 | 평가/집계는 엔진 모듈, 화면·이동은 비교 UI 모듈, 조건은 일시적 `ANALYSIS_SET.comp`에 둔다. 세계 교체 시 대회 조건도 초기화하고 저장 스키마/계수/RNG/게임 기록을 변경하지 않는다. 별도 프레임워크/의존성이나 새 강제 업무가 없다. |

- 플레이 예: 특정 대회의 관측 빈도는 낮지만 우리 미드의 숙련·기존 전술 효용이 높으면 같은 후보 행에서 공개 등급과 내부 순위/숙련/실제 기여를 볼 수 있다. 차이가 숙련 때문이라고 자동 결론 내리지 않으며, 대회 빈도와 실제 선수·구단 평가의 다른 기준을 설명한다. 상세 기록 보기 후 분석실로 돌아와 대회/후보 역할/검색을 유지한다.
- 집중 검증: `scripts/analysis-comparison-acceptance.mjs`는 실제 엔진 공식 2전의 대회별 분모, ID/역할 결합, 기존 내부 점수 동일성, 실제 `practiceChampion` 누적 writer → `growPlayer` 시즌 숙련 writer → 밴픽 소비자/내부 준비도 변화를 검증했다. 연습을 즉시 별도 승률 보너스로 가산하지 않으며 이 검사는 특정 일일 훈련 조작 흐름을 새로 구현했다는 증거가 아니다. 공개 결과 독립성, 상대 비공개 getter 차단, 허위 관찰자/소유 2군·해임, 조회 순수성, 저장 복원, 미도래 원자료 보존/이동 차단, 실제 필터/포커스/출처 이동의 초기화도 확인했다.
- 실제 Chromium: 동일 빌드 HTML 주입으로 1280px/320px 렌더링, 비교 전환·평가 펼치기·대회/역할 필터의 키보드 포커스, 검색 빈 상태, 공개 기록/선수/챔피언 상세 이동과 되돌아온 조건 유지, 미도래 출처의 가짜 버튼 없음, 페이지 오류/문서 가로 넘침 없음을 확인했다. 실기기/TalkBack/공개 HTTP 최종 QA와 구분한다.
- 검증 중 보존 사항: 초기 신규 fixture의 대회 ID가 비어 있던 설정을 등록된 fixture ID로 수정했다. acceptance 증가에 따라 공유 runner의 실제 독립 VM 수 기대값을 56→57로 갱신했다. Cloud 기본 샌드박스에서 CI logger의 자식 출력이 비어 기존 보존 검사에 실패했으며 `/tmp/analysis-comparison-static.log`, `/tmp/analysis-comparison-probe/` 증거를 보존했다. 같은 코드를 추가 네트워크 허용 실행 범위에서 다시 검증해 static 성공을 확인했으며 logger/계측을 제거하지 않았다. 브라우저 초기 자동 선택의 포커스 가정을 수정해 실제 포커스 후 변경/복원 경로를 검사했다.
- 당시 다음 컨텍스트 연결은 아래 12.9.3에서 실제 구현·검증·배포했다. 해당 연결의 목표는 실제 선택 조합/공개 상대 픽을 평가하는 조회 컨텍스트와 `draftPickValue` 소비자를 연결하고, 기존 드래프트/Fearless/시리즈 상태의 사용 가능 범위를 명시한다. 경기 전 보고서에서 상대 숨은 훈련·실력·미래 결과를 읽지 않고 실제 입력 변경→이유/유효 후보→UI→권한/저장 경계를 끝낸다. 상세 경기 전환점, 선수 맥락 비교, 고정 보고서/관심 목록/메모/조건 저장/권한 내 내보내기와 전체 12.3–12.5 재설계·다른 승인 영역도 남아 있다. 검증된 외부 대회 보정이나 등급 정책 재설계 완료를 주장하지 않는다.

추가 단기 증거: Node 22 공유 UI·재정·계약 runner의 58개 acceptance / 57개 독립 VM, 124모듈 static/standalone 빌드가 통과했다. PR #167의 최종 head 필수 CI와 main 배포는 위 현재 지점의 성공 기록으로 확인했다.


### 12.9.3 실제 밴픽의 선택 조합·상대 공개 픽 후보 비교

상태: PR #168의 정확한 최종 head 필수 CI·순차 병합·main CI/HTML/Pages 성공을 위 현재 지점에 기록했다. 기존 단일 후보 분석·스태프 조언·분석실 티어를 재구현하거나 전체 UI 재설계 완료로 세지 않는다.

| 판정/화면 연결과 소유 모듈 | 근거·구현·완료 경계 |
| --- | --- |
| 승인된 연결 누락 → 실제 컨텍스트 조회 | 단일 후보 상세는 이미 `draftCandidateAnalysis`에 있었지만 후보끼리 현재 조합/공개 상대 픽 기준으로 비교하는 소비자는 없었다. `draft-preparation.js:draftPreparationReport`는 현재 실제 세션만 읽으며 `draftLegalChampions`/`draftAssignmentsFor`/`draftFeasibleRoles`의 합법 후보와 기존 `draftPickValue`의 점수·기여를 그대로 제공한다. 임시 상대 세션, 새로운 계수, AI 임의 변동이나 미래 세트 상태를 만들지 않는다. |
| 실제 입력 → 이유·선택 | 우리 공개 픽과 구단 전술, 자기 선수 숙련, 상대 공개 픽의 가능한 배치, 이미 기록된 시리즈 승/패 챔피언이 기존 소비자에 들어간다. 역할별 기여/상성 입력을 표시하고 기존 상세의 조합 이유·메타 표본·선수 챔프폭과 연결한다. 최상위 가능한 역할은 검토 기준이며 상대 또는 최종 포지션 확정이 아니다. 효용은 승률·실제 피해량·스태프 추천 순위와 다르다. |
| 모달과 수동 권한 | 공식 `DRAFT_UI.locked`/`UI_OVERLAY`와 `navigateTo` 잠금을 유지한다. `ui-draft-preparation.js`의 후보 버튼 → 실제 차례/권한/합법 후보 재검증 → 기존 후보 분석·포커스 → 기존 `draftUiLock` → `draftApplyChoice`를 연결한다. 후보 클릭은 픽을 실행하지 않는다. 밴/다른 팀 차례/완료/미확인 우리 배치/해임·허위 관찰자에는 명시적인 빈 상태를 제공한다. 소유 2군 권한은 기존 `managerControlsSquad`를 쓰고 2군 감독에게 부모 자료를 열지 않는다. |
| 기존 수동 설명 결함 | `draftUiLock`은 기존에 픽의 `f`/`v`를 넘기지 않아 `draftApplyChoice`의 세션 설명이 모든 기여 0으로 기록됐다. 현재 선택의 기존 최상위 합법 역할 점수·기여를 전달해 세션 `expl`에 실제 검토 기준을 남기고, 확정 시 해임/관리 권한도 재검증한다. 선택 챔피언·최종 배치·RNG·전투 계수는 바꾸지 않는다. 공식 최종 강제 밴픽 소비자가 수동 설명을 영구 경기 설명으로 넘기는 연결은 아래 남은 검증/수정으로 구분한다. |
| 표시·유지보수 | 데스크톱에는 선택적으로 펼치는 비교, 좁은 화면에는 기존 정보 탭의 후보 비교를 둔다. 검색·포지션에 맞는 합법 후보 중 상위 12명을 표시하고 전체 해당 수를 밝힌다. 검색/역할 이동에서 펼침 상태를 유지하고 작은 화면에서 두 열을 줄바꿈하며 스크롤을 키보드로 사용할 수 있다. `ui-draft-analysis.js`로 기존 후보 상세/관측 조합 설명을 내용 변경 없이 분리해 기존 22,000자 예산을 올리지 않았다. 루트 파일은 상호작용/확정, 새 비교 UI는 표시/선택, 엔진은 평가만 소유한다. 저장 스키마·의존성·강제 추가 업무는 없다. |

- 플레이 예: 상대 플렉스 픽이 공개되면 가능한 상대 배치를 기준으로 상성 기여를 비교한다. 우리 팀에 이미 탱커가 있거나 주력 미드의 숙련이 다르면 기존 조합·숙련 기여와 합법 역할이 함께 달라진다. 비교 후보를 눌러 상세 근거를 확인한 뒤 직접 픽을 확정한다. 역할 검토를 새로운 포지션 공개/승률 보장으로 오해하지 않도록 표시한다.
- 집중 엔진/UI acceptance: `scripts/draft-preparation-acceptance.mjs`에서 실제 20턴 드래프트의 우리 5번 픽, 각 역할의 `draftPickValue` 완전 동일성, 실제 자기 숙련/시리즈 승패 소비자, 공개 플렉스 상대 입력, 합법 후보/공식 사용 제한·연습/Fearless, 상대 pool/attrs/pot/medical/tactics/meta getter 차단, 순수 조회와 RNG/shortlist/배치 불변, 허위 상대 주전/관찰자·해임·소유 2군, 지난 선택/중복 확정 거절을 확인했다. 실제 버튼 선택→상세 포커스→기존 확정 writer→강제 밴픽 경기→원본 동등 저장 기록도 확인했다.
- 실제 Chromium: 동일 standalone HTML 주입으로 실제 pending 공식 Bo3의 선택권·잠긴 밴픽을 열었다. 후보 비교/검색 빈 상태/펼침 유지/Enter 선택·상세 포커스/확정, 분석실 이동·Escape 우회 차단, 저장 후 동일 pending 세트 seed 복원과 임시 픽 초기화, 실제 첫 경기 반영→메타 1전→다음 세트→저장 복원을 확인했다. 1280px·320px 문서/모달 가로 넘침과 페이지 오류가 없었다. 직접 file/production URL은 Cloud 정책 제한 때문에 주입 렌더링과 구분하며 공개 HTTP·실기기·TalkBack 최종 QA를 주장하지 않는다.
- 관련 검사: Node 22 공유 runner 59 acceptance / 58 독립 VM, 기존 관측/조합/스카우팅 UI acceptance, 127모듈 static/standalone 빌드 및 회귀 검사를 통과했다. 단기 시나리오 검사이며 장기 100시즌 최종 QA가 아니다.
- 실패/진단 보존: `/tmp/live-draft-preparation-focused.log`의 fixture getter 복원 시 없는 원속성 처리, `focused-2.log`의 기존 log에 없는 source 필드 가정, `focused-3.log`의 저장 복원 객체 키 순서 비교 실패를 보존했다. 원본 writer 구조에 맞춰 실제 cursor/pickList/sequence와 정규 `packMetaHistory` 동등성을 검사하도록 고쳤다. 초기 static의 `ui-draft.js` 문자 예산 실패는 기존 상세를 명확한 모듈로 분리해 해결했으며 예산을 올리지 않았다. logger/계측과 원본 기록은 삭제하지 않았다. `/tmp/live-draft-preparation-focused-final.log`, `integration.log`, `static.log`, `regression.log`, `browser-final.log`에 결과가 있다.
- 이익/비용/한계: 숨은 상대 자료를 조회하지 않고 현재 결정의 비교·이유를 한 모달에서 확인할 수 있다. 추가 비교는 전체 합법 후보 조회와 표시 비용이 있으며 선택적으로 펼친다. 기존 추상 조합/초반·포킹 상성 모델을 설명한 것이지 정확한 주문 실행·맵 기하나 검증된 외부 프로 보정을 새로 구현한 것이 아니다. 과거 내부 상태 복원/분석실 임의 조합 편집과 상대 세트 예측을 제공하지 않는다.
- 당시 다음 이벤트 시점 기록 연결은 아래 12.9.4에서 구현·검증한다. 발견 당시 문제: 실제 수동 밴픽의 이벤트 시점 설명/출처를 공식 결과·경기 복기에 지속 연결해야 했다. 현재 `resolvePendingOfficialMatch`는 picks/bans만 넘기고 `runDraft`의 forced 소비자는 일반 재현 설명을 만들므로 실시간 비교 이유가 영구 경기 근거가 되었다고 주장할 수 없다. 기존 sequence/series/current/pending 저장·결과/UI를 조사해 실제 선택→최종 역할 배치→공식 기록→근거 조회·저장 연결을 끝내고, 공개 기록과 자기 비공개 전술/숙련 설명의 소유 권한을 분리한다. 이후 상세 전환점·선수 맥락 비교·고정 보고서/관심 목록/메모/조건 저장/내보내기와 다른 승인 영역은 계속 남는다.


### 12.9.4 수동 밴픽의 당시 판단 기록·공식 결과·저장·복기 연결

상태: PR #169의 정확한 최종 head 필수 CI·순차 병합·main 재검증·HTML/Pages 배포 성공을 위 현재 지점에 기록했다.

| 발견/소유 모듈 | 구현·완료 경계 |
| --- | --- |
| 공식 writer의 연결 누락 | `resolvePendingOfficialMatch`가 picks/bans만 넘겨 수동 sequence/이유를 잃었다. `draft.js:draftApplyChoice`는 검증된 실제 수동 픽 확정 직전에 `draft-history.js:manualDraftEvidence`로 기존 합법 역할/`draftPickValue`와 공개 컨텍스트를 복사한다. `draftResult` → pending writer → `playSeriesSessionGame` → `sess.games` → `seriesSessionResult` → `commitScheduledSeries`가 원래 공개 sequence와 자기 팀의 `draftEvidence`를 지속한다. AI 픽을 수동 기록으로 만들지 않는다. |
| 소유권·원본·출처 | 기록에는 소유 팀, turn, 당시 date/patch/선수·챔피언 이름, 검토 역할, 공개 우리/상대 픽, 실제 공개 상대 가능한 역할 입력, 기존 기여/표본/신뢰/조합 이유만 들어간다. 확정된 최종 역할은 실제 최종 picks에서 별도로 표시한다. 저장 writer는 현재 소유 구단만 받으며 sequence event/prefix/date/patch/유한 합계와 스키마를 검증한다. reader는 권한을 먼저 검사하고 이후 출처·미래 날짜를 검사한다. 자기 평가와 상대 공개 픽을 사용하며 상대 비공개 선수 상태를 수동 기록에 추가하지 않는다. 로컬 세이브를 암호학적으로 인증하는 기능은 아니다. |
| 유지보수·실제 복기 | `ui-draft-history.js`가 표시·권한 재검증·source 버튼을 소유하고 `ui-match.js:renderSeries/bindSeries`에 선택적 펼침으로 연결된다. 지금의 숙련/전술로 당시 이유를 다시 계산하지 않는다. 선수 정보는 현재 같은 팀일 때만 연결하며 챔피언 버튼은 **현재 챔피언 정보**라고 명시한다. 현재 페이지/공식 모달 잠금은 기존 `navigateTo`를 유지한다. 당시 검토 효용은 승률이나 패배 원인 증명이 아니다. |
| 저장·구형 경계 | `save.js:seriesResultForSave`의 기존 다른 지역/종료 리그 lite 경로도 수동 기록의 date/patch/sequence/picks/bans를 보존한다. live 객체를 수정하거나 원래 경기를 삭제하지 않는다. pending·일반·lite 저장/복원이 연결되고 구형 기록에 수동 근거가 없으면 기록 없음으로 표시한다. 새 의존성·저장 버전 상승·선택 자동화는 없다. |
| 재현된 화면 결함 | 실제 경기 탭 진입에서 `viewMatch`의 선언 없는 `${detail}`이 ReferenceError를 내며 전체 화면을 멈췄다. 남은 미정의 삽입을 제거해 공식 결과 → 세트 요약 → 당시 평가 펼침/출처 이동을 사용할 수 있게 했다. 초기 브라우저 실패 원본을 보존한다. |

- 플레이 예: 첫 미드 픽을 확정할 때 당시 숙련·조합·공개 상대 픽과 효용을 보존한다. 시즌 후 숙련/전술이 달라져도 당시 검토 기준과 최종 포지션을 함께 읽을 수 있다. 과거에 저장하지 않은 이유는 만들어 채우지 않는다.
- `scripts/draft-history-acceptance.mjs`: 실제 수동 20턴/5픽, 같은 시드·picks/bans/sequence의 평가 미저장 대비 경기 승자·전체 선수 lines·정규 공개 메타 동등성, 현재 숙련/전술 변경 후 원본 불변, 외부 소유 getter 읽기 전 차단/해임/소유 2군 경계, 허위 외부 writer·출처 prefix·날짜·누락 picks/sequence, 순수 조회, pending/lite/일반 저장을 확인했다. 실제 `newSeason`의 Bo3가 pending 선택권 → 세트별 수동 드래프트 → 공식 commit → queue 종료 → 역사 재저장까지 완료하며 각 경기의 자기 5건을 유지한다. 완료된 드래프트/공식 결과의 중복 실행은 거절되고 기록은 변하지 않는다. 새로운 공식 경기 전체 트랜잭션 재설계나 모든 기존 실패의 원자성 완료를 주장하지 않는다.
- 실제 Chromium 1280/320px: 실제 공식 Bo3 3게임 전체를 버튼 확정으로 완료했다. 다음 세트 pending 재저장, 원본 5건씩 표시, summary 키보드 펼침, 챔피언/선수 실제 route 이동, 완료 역사 저장·복원·해임 비공개 표시 제거와 문서 폭 320px/페이지 오류 없음이 통과했다. 동일 standalone HTML 주입이며 정책상 차단된 file/production HTTP 검증이나 장기 모바일/기기/TalkBack QA가 아니다.
- 관련 검사: Node 22 runner 60 acceptance / 59 독립 VM, 129모듈 static/standalone과 기존 회귀 검사를 통과했다. 최종 변경 후 필수 CI에서 전체를 다시 검사한다. 문자 예산을 올리지 않았다.
- 실패/증거: `/tmp/draft-history-browser.log`는 실제 기존 detail 미정의 결함, `browser-2.log`는 검사 코드가 없는 UI_STATE를 가정한 실패다. 검사만 기존 VIEW route에 맞춰 수정했으며 원본 로그를 삭제하지 않았다. `focused-final.log`, `scheduled-2.log`, `integration.log`, `static-final.log`, `regression.log`, `browser-final.log`와 실제 화면 캡처에 결과가 있다. 기존 #164–#168 실패·진단은 위/기존 항목대로 보존한다.
- 이익/비용/한계: 수동 결정의 당시 설명과 공개 선택 순서가 사라지지 않는다. 경기당 자기 픽 최대 5건의 저장 비용과 확정 직전 기존 합법 후보 평가 조회 비용이 추가된다. 조합 평가·상성은 기존 aggregate 모델이며 정확한 스킬 실행/기하·외부 프로 보정을 새로 구현하지 않는다. 전체 save export는 기존 전체 게임 파일이며 관찰자용 공개 데이터 내보내기 기능으로 바꾸지 않았다. 이미 과거에 사라진 이유·전투 로그를 복원하지 않는다.
- **정확한 다음 45–55분 단위:** 분석실의 실제 공식 경기 복기 소비자와 관측 경계를 연결한다. 기존 `ui-match.js:renderDraft`의 경기 재생은 상대 `ps.prof.mastery`를 그대로 표시하고 `replayGame`은 오늘의 선수 상태로 경기/설명을 재생한다. 이 source-backed 발견은 다음 재현·교정 대상으로 등록했다(새 정책 제안이 아님). 저장된 공개 기록/자기 당시 근거와 재생 추정을 분리하고, 숨은 상대 숙련을 관측값으로 노출하지 않는 실제 match review → source/navigation → permission/save 흐름을 끝낸다. 정확한 전환점이 필요하면 기존 actual event writer와 저장 가능한 근거를 먼저 조사하고 미저장 과거 로그는 만들어 채우지 않는다. 상세 전환점·맥락 선수 비교·보고서 도구와 전체 재설계/다른 승인 영역은 계속 남는다.


### 12.9.5 분석실 공식 경기 복기·당시 공개 기록·관측 경계

상태: PR #170 최종 head `2d84a0db7e6d66e2119b7560420d104a980893e5`의 전체 필수 CI `37165915389`(의료 4시드·2집계·verify) 성공 후 main `63b6741af382c013139b5e9a43e2dd6e74bf1da8`로 순차 병합됐다. 같은 main의 전체 CI `37166328093`·standalone-sync와 Pages `37166672307`의 검증 artifact·온라인/오프라인 조립·게시 성공 및 src/docs/scripts/index 동일성을 확인했다. 직접 github.io HTTP는 Cloud 정책 차단으로 확인하지 못했다. 전체 분석실/전체 UI 재설계 완료는 아니다.

| 발견·소유 파일 | 실제 구현·완료 경계 |
| --- | --- |
| 과거 결과를 오늘 재계산하던 경로 | `bindSeries`가 `replayGame`을 호출해 오늘의 선수 상태로 만든 경기/설명을 과거 기록처럼 표시했다. 이제 세트 버튼은 `renderPublicMatchReview`로 당시 저장된 공개 결과를 읽는다. 기록 없는 과거 경기에는 상세 미저장 상태를 표시하며 현재 상태로 채우지 않는다. 기존 `replayGame` 함수/개발 계측은 삭제하지 않았다. |
| 당시 공개 원본 writer | `match-history.js:publicMatchRecord`는 실제 `playSeriesSessionGame` 결과에서 10명의 실제 이름/역할/챔피언/KDA/CS/획득 골드/피해량/레벨/아이템과 당시 챔피언·아이템 이름, date/patch/winner/duration을 명시적으로 복사한다. attrs/pool/숙련/잠재력/전술/ratings는 저장하지 않는다. 아이템 표시는 실제 `matchQuestItems`의 6칸+원딜 역할 보상 신발을 포함하며 이를 임의의 불법 7칸 구매로 간주하지 않는다. |
| 사건 writer·한계 | 이미 생성된 실제 로그의 공개 처치/교전/오브젝트/구조물/넥서스 사건에서 최대 24건(많으면 처음 12+마지막 12)을 보존하고 원래 해당 사건 수/생략을 명시한다. quiet AI 경기는 기존 로그가 없으므로 결과로 타임라인을 만들지 않는다. 모든 로그를 켜거나 RNG/승패/효과를 변경하지 않았다. 사건은 기존 aggregate 엔진의 계산 기록이며 정확한 개별 주문/위치를 재현한 데이터가 아니다. |
| 실제 분석실 소비자 | `ui-match-history.js`는 독립 표시 모듈이다. 기존 분석실에 경기 복기 모드를 연결하고 현재 관리 1군/소유 2군, 기간·패치·대회·실제 기록 역할 조건에 맞는 완료 공식 기록 중 최근 30세트를 고른다. 선택은 권한/조건에서 다시 검증하고 필터 변경 시 범위 밖 기록을 표시하지 않는다. 자기 당시 밴픽 근거와 기존 검증된 챔피언/선수 route를 함께 연결하며 비공개 상대 기록을 읽지 않는다. transient review ID는 저장에 들어가지 않고 world/slot reset에서 초기화된다. |
| 노출 결함 교정 | `renderDraft`는 상대의 실제 `ps.prof.mastery`를 항상 출력했다. 현재 소유 구단에만 현재 계산 숙련을 명시하고 상대 값을 읽지 않는다. 세트 요약의 내부 멘탈 계수 표시를 제거하고 선택권 이유도 그 결정을 소유한 구단에만 보여준다. 사용자 결과 화면의 전체 내부 `renderExpl` 원값 노출은 집계 모델 설명으로 대체했다. 원본 r.expl/로그/재생 함수는 유지해 실패를 숨기거나 계측을 제거하지 않았다. |
| 저장·권한·표시 | `save.js`의 기존 lite 저장에서도 당시 공개 기록과 date/patch를 보존한다. 구형·미확인·미래 출처는 원본을 훼손하지 않고 조회 상태를 명시한다. reader는 현재 private 선수 필드/재시뮬레이션을 사용하지 않는다. 연습 score sheet는 참가 구단의 비공개 관측으로 먼저 권한을 검사하고 공식 경기 목록/공개 보정에서 제외한다. 단순 과거 replay 실행으로 새 당시 기록을 생성하지 않는다. 관리/해임/소유 2군 경계는 기존 shared predicate를 쓴다. 실제 320px 선택 폼 16px 가로 넘침을 발견해 기존 controls/analysis-controls 패턴으로 연결했고 큰 표는 키보드 접근 가능한 가로 스크롤 안에 둔다. |

- 예: 경기 후 선수 숙련/전술을 바꿔도 지난 경기 KDA·CS·아이템·이름/사건은 당시 저장값 그대로 남는다. 오래된 상세 미저장 경기나 quiet 경기의 없는 로그는 새로 만들어 보여주지 않는다. 공개 경기 수치만으로 승패 원인을 단정하지 않는다.
- `scripts/match-history-acceptance.mjs`: 실제 공식 시뮬레이션의 공개 값·끝 사건·24건 상한, capture/미capture의 같은 모드·같은 시드 전체 선수 lines·정규 공개 meta 동일성, 자기 현재 숙련 변경 후 불변, 상대 attrs/숙련 getter trap, 외부 관찰자/해임, 잘못된 출처/구형·lite 저장, 실제 분석실 패널과 순수 조회를 확인했다. 대표 로그 포함 1경기 공개 snapshot JSON은 3,041문자다(UTF-8 byte나 장기 메모리 측정이 아님). 저장 비용이 새로 생기는 정확도/기록 보존 개선이며 성능 최적화로 주장하지 않는다. 기존 CI의 저장/시간/메모리 예산을 올리지 않는다.
- 실제 Chromium: 실제 pending Bo3 3게임을 버튼으로 완료하고 세트→당시 기록, 분석실 경기 모드→기간/경기 선택→공개 수치/사건·자기 근거→실제 챔피언 route→선택 유지, 저장/reload→world reset·같은 역사 재선택, 해임 표시 차단을 확인했다. 1280/320px, 표 키보드 스크롤, 문서 넘침/페이지 오류 없음이 통과했다. 동일 HTML 주입 렌더링이며 정책상 차단된 production/file URL이나 최종 기기/TalkBack QA는 아니다.
- 단기 관련 검사: Node 22 UI runner 61 acceptance/60 독립 VM, 131모듈 static/build 및 기존 회귀가 통과했다. 추가 reader/snapshot과 기존 플레이 결과의 동등성을 별도로 구분했으며 현재 head 전체 CI에서 다시 검사한다. 기록 역할 조건은 실제 선수 표의 해당 역할에 적용하며, 전후 공개 사건은 다른 역할의 맥락도 포함한다.
- 실패 원본: `/tmp/match-history-focused.log`/`source-probe.log`는 실제 원딜의 역할 보상 신발을 임의의 6개 표시 상한으로 거절한 초기 validator 오류다. 기존 writer를 조사해 6+1 표시를 수용했다. `focused-2.log`는 원래 quiet/logged 모드의 duration/lines가 같다는 잘못된 fixture 가정이고, 같은 모드 capture/미capture의 실제 패리티로 교정했다. `focused-final.log`는 안내문 단어 숙련을 숫자 노출로 오인한 검사 가정, `integration-2.log`는 새 transient review 키를 기존 reset 예상값에 누락한 검사다. `browser.log`/`layout-probe.log`에는 실제 320px 폼 넘침을 보존했고 공통 controls로 수정했다. 역할 조건을 실제 표에 연결한 추가 검사 `/tmp/match-history-role-final.log`는 사건 로그에도 다른 역할 이름이 남는 것을 표 필터 오류로 오인했다. 표의 행을 검사하도록 고쳤으며 원본 로그와 대체 head/CI 기록도 보존한다. 초기/최종 로그·원본 진단·기존 #164–#169 기록은 삭제하지 않는다.
- **새 검증 결함·보존된 엔진 후속 단위(승인된 종료/효과 순서 판정):** seed `record-official`의 실제 공개 원본은 넥서스 파괴 26:50 이후 상대 포탑 파괴 26:56을 기록했다. `simulateMatch`의 macro/tower phase와 파괴 후 같은 분의 처리, 두 side 순서, 종료 감지/시각·logged/quiet 차이를 조사한다. 원본 사건을 삭제하거나 복기에서 숨겨 맞춘 것으로 만들지 않는다. 최초 넥서스 파괴 뒤 실행 가능한 실제 writer/consumer를 재현하고 종료 이후 피해·보상·구조물·상태/추가 판정이 발생하지 않게 자연스러운 경계에서 교정한다. 골드 판정/억지 승자·보정률·정책을 추가하지 않는다. 의도적인 현실성 수정과 동작 보존 변경을 구분하며 양 side·동일 분·quiet/logged·공식 결과/저장/복기/시드 시나리오로 검증한다. 상세 전환점 원인·맥락 선수 비교·보고서 도구와 전체 재설계/나머지 승인 영역은 계속 남는다.

#### 12.9.5.1 FM식 정보 구조 적용과 상단 메뉴 정리

- 사용자 최신 정정(2026-10-04): FM 참고 이미지의 **메뉴 체계와 정보 계층**을 참고하되 주요 이동은 모바일을 고려해 **상단에 유지**한다. 좌측 전역 사이드바로 바꾸지 않는다. 커리어 시작 전에는 운영 목적지가 불필요하므로 새 게임 메뉴만 표시하고 불러오기는 별도 상단 버튼으로 둔다. 화면 색상 설정은 실제 자동/어둡게/밝게 선택으로 연결했다. 화면 내부 탭은 선택한 대상의 상세 정보 구분용이다. 이 방향은 12.3–12.5 전체 교체에도 적용한다.
- 실제 구현: `shell.html`의 상단 상태 줄에 현재 화면·관리 구단·날짜와 색상 설정, 그 아래 목적별 상단 메뉴를 정돈했다. `ui-state.js:updateAppNavigation`은 커리어 유무/현재 route에 따라 표시와 명칭을 갱신하며 기존 navigation/overlay 잠금과 shared commands를 유지한다. 스크림 목적지는 경기·스크림, 저장·불러오기는 운영 메뉴에서 제외해 오른쪽 위 별도 유틸리티 버튼으로 옮겼다. 실제 기존 저장 route로 이동하며 시작 전에는 불러오기 명칭을 쓴다. 시작 전 화면에는 가짜 운영 메뉴나 기능 없는 설정 버튼을 추가하지 않았다. 상단 메뉴는 작은 화면에서 가로 스크롤하며 본문을 밀어내지 않는다.
- 분석실 실제 교체: `ui-match-history.js`는 경기 목록 → 선택 경기 요약 → 선수 기록/주요 사건/밴픽 검토의 단일 작업 공간으로 교체했다. 1280px에서는 실제 경기 목록과 상세를 나란히 두고 좁은 화면에서는 목록을 선택 폼으로 줄인다. 긴 사건 목록과 비공개 당시 근거는 해당 탭에서만 표시한다. 현재 팀·역할·기간·대회·패치 조건을 유지하며 실제 기록을 선택 시 다시 검증한다. 수치 열 정렬과 표 간격을 통일하고 아이템은 개수/펼치기로 확인한다. 탭은 실제 자료를 바꾸며 좌우/Home/End 키, 선택/focus/tabpanel 연결을 지원한다. reviewTab은 transient UI이며 world/slot reset에서 초기화된다.
- 집중 실제 Chromium 검증: 새 세계의 분석 메뉴 숨김/새 게임 명칭, 실제 색상 설정, 실제 공식 Bo3 3게임, 복기 선택/역할 필터/주요 사건·밴픽 탭/키보드 전환/원본 챔피언 route/조건 유지, pending 및 history save/reload와 해임 차단을 확인했다. 1280/320px에서 문서 가로 넘침·페이지 오류가 없었다. 표 자체의 가로 스크롤은 키보드 접근 가능하다. `/tmp/match-history-fm-top-browser.log`와 `fm-desktop.png`/`fm-320.png`는 동일 rebuild HTML 주입 검사이며 production HTTP나 최종 모바일 기기 QA가 아니다. 첫 static 실행의 sandbox process-test 실패/브랜딩 검사 실패는 `/tmp/match-history-fm-static.log`에 보존했고 기존 브랜드 구조를 복원했다. 제한 내 재검사 성공은 별도 로그에 남긴다.
- **승인된 UI 후속 단위: 12.3–12.4 구단 운영 개요와 목적별 상단 내비게이션.** 실제 시작/커리어/초기 영입/시즌/해임 상태 및 기존 선수단·계약·훈련·일정·재정 command 연결을 조사한 뒤, 오늘 해야 할 결정과 다음 일정·구단 상태에서 실제 관련 화면/행동으로 이어지는 구단 개요를 완성한다. 없는 route에 버튼만 붙이거나 오늘의 내부 상태를 과거 근거로 재구성하지 않는다. 기존 화면은 대체 흐름의 권한/취소/중복/저장까지 확인한 뒤 교체한다. 12.5 선수단·선수 상세, 계약·시장, 스태프·훈련, 리그·일정, 경기, 통계, 재정·사무국, 저장·설정의 전체 교체는 계속 남는다. 종료 이후 사건 결함도 위의 원본과 재현 조건을 보존하며 별도 엔진 단위로 교정한다.
- 완료율 보고 기준: 전체 기능과 UI를 섞은 임의 백분율을 쓰지 않는다. 승인된 numeric task별 구현·focused acceptance·현재 head CI·main/배포 상태를 구분해 집계한다. 현재 전역 UI 구조/분석실 일부를 구현한 것은 전체 UI 또는 전체 승인 범위 완료가 아니다. 단위 수만으로 난이도 가중 완료율을 추정하지 않는다. 12.3 실제 연결 감사에서 전체 inventory와 UI inventory 상태를 별도로 갱신한다.

- 추가 사용자 방향: 주요 메뉴를 기존 6개 큰 화면에 계속 몰아넣지 않는다. 12.3–12.5 교체에서 선수단, 계약·시장, 스태프, 훈련, 일정·대회, 경기, 분석실, 재정, 사무국, 패치·메타 목적지를 각각 실제 독립 흐름으로 연결한다. 저장·불러오기는 상단 오른쪽 유틸리티로 분리한다. 이 단위에서 구현된 것은 상단 위치 유지/시작 전 구분/저장 분리와 복기 공간이며, 나머지 독립 도메인 화면이 구현됐다고 주장하지 않는다. 기존 바인더는 여러 섹션을 함께 가정하므로 화면 일부를 숨기거나 가짜 route만 늘리는 방식으로 완료하지 않는다. 다음 구단 개요 단위에서 명시적인 domain 모듈/command 연결과 이 목적지 분리의 첫 완결 경계를 정한다.
- 새 경험치 검토 근거: 사용자 27분대 미드 13레벨 지적. `engine.js:incomeTick`은 실제 CS를 쓰며 `addXp(ps,cs*58+역할/시간 상수)`로 일반 경험치를 준다. `addXp`는 누적 XP_TABLE 문턱으로 레벨을 계산하므로 시간 고정 레벨은 아니다. 그러나 미니언 막타 수와 주변 경험치 수급을 사실상 묶은 aggregate proxy이며, 처치 실패·경험치 거리/공유·죽음/귀환/로밍의 구분이 충분하다고 검증되지 않았다. 사진 하나로 정상 레벨이나 프로 목표 분포를 단정하지 않는다. 승인된 wave/camp/XP 판정 inventory에 실제 이 writer/consumer 재현, reviewed patch XP/공유 metadata, 수입/레벨/아이템/성장 소비자, paired lane/roam/death 시나리오를 연결하는 후속으로 병합한다. 임의 XP/레벨 상향이나 화면 숫자 수정은 하지 않았다.

- 최신 우선순위 정정: 사용자는 경기 엔진이 최우선임을 재확인했다. 현재 UI/복기 연결 단위를 완결한 뒤 **다음 구현 단위는 위의 실제 종료 이후 사건·logged/quiet 판정 시계 결함 교정**이다. 12.3–12.5 상단 도메인 분리/구단 개요는 승인 상태로 유지하되 이 엔진 결함보다 먼저 반복적인 외형 변경을 하지 않는다. 전체 경기 검토 inventory는 종료·동시 사건, 미니언·웨이브, 캠프, XP·경제·구매, 접근·타깃·피해·회복·CC, 아이템·룬 효과/팀 유틸리티, 시야·정보, 귀환·이동·죽음, 오브젝트·구조물 전환, 밴픽·전술·시리즈, 선수 상태·실행력, 패치·적응, 당시 근거·재현성·AI 동등성으로 기존 승인 항목에 병합한다. 전체 재검토 목록은 새 기능 수/완료 수로 중복 집계하지 않으며 실제 source-backed 판정 결함과 미검증 조건을 구분한다.

- 사용자 표시 정정: 선수 기록 표의 제목은 ‘아이템’으로 단순화했다. 역할 보상 아이템을 숨기거나 저장/실제 아이템 소비를 바꾸지 않으며 긴 구현 설명을 열 제목에 반복하지 않는다.

- 최종 사용자 복기 표시 정정: 아이템 열 자체를 복기 표에서 제거했다. KDA·CS·획득 골드·피해량·레벨을 유지하고 아이템 배열/당시 이름의 저장은 판정 검증·원본 역사 보존을 위해 유지한다. 아이템 효과·구매 writer를 삭제하거나 기록을 지워 화면을 간소화하지 않는다. 앞선 제목 단순화보다 이 최종 정정이 우선한다.

## 8.1.1 최초 넥서스 종료와 로그 독립 판정 시각

상태: `fix/match-end-adjudication`에서 실제 구현·집중 검증. 현재 head 전체 CI·순차 병합·같은 main HTML/게시 게이트는 별도로 확인한다. 8.1의 종료 판정 보강이며 새 승리 정책·밸런스 변경이나 전체 전투/웨이브 완성 선언이 아니다.

| 발견·source | 구현·완료 경계 |
| --- | --- |
| 실제 종료 뒤 구조물/보상 | baseline main `63b6741`의 실제 공식 `record-official/g1`은 넥서스 26:50 이후 상대 바텀 2차 포탑 26:56을 기록하고 26:57로 종료했다. `simulateMatch`가 macro→tower→억제기 재생성 후에만 dead nexus를 확인했고 `takeStructure`는 이미 파괴된 넥서스를 재처리했다. [원본과 비교](evidence/match-end-original-series.json)에 전체 원본 앞 사건과 뒤 사건을 보존했다. 이는 가상 엔진 재현이며 프로 보정 자료가 아니다. |
| 최초 종료 writer | `match-adjudication.js:destroyMatchNexus`가 실제 구조물 처리의 첫 넥서스 파괴에서 승자/분/초/version을 확정한다. `takeStructure`, 수입·시야·라인·정글·오브젝트·macro·tower, 교전·처치·conversion에 실제 종료 guard를 연결했고 tower phase는 첫 종료에서 즉시 반환한다. 같은 분의 두 번째 넥서스 호출·다음 side·추가 action/trace는 state/RNG를 바꾸지 않는다. 마지막 골드 history는 종료 시점의 읽기용 snapshot으로 남긴다. |
| 로그 여부가 duration/평점을 바꿈 | 기존 `log`는 quiet에서 초 계산도 생략했고 종료 duration은 로그 cursor+1로 계산했다. 이제 `matchEventSecond`는 같은 기존 시간 스트림/증분으로 사건 초를 항상 계산하고 quiet는 저장만 생략한다. 종료 duration/문자열은 실제 첫 종료 snapshot을 소비하며 마지막 로그 초를 다시 써서 맞추지 않는다. 기존 시간 표현은 집계 모델의 seeded 초 표현으로, 실제 개별 스킬/이동 시각이나 물리적인 동시 교환을 재현한다고 주장하지 않는다. |
| 실제 결과·meta·저장·UI | 종료 snapshot은 실제 `seriesResultLines`의 duration/rate/rating, 공식 결과/meta, `publicMatchRecord`의 종료 근거, 원본 세트/분석실 복기와 기존 pending/full/lite 저장으로 연결된다. 공개 종료 근거는 팀 ID로 변환해 표시하며 winner/시각/duration/사건 범위를 검증한다. 종료 근거 없는 이전 기록은 원본으로 유지하고 오늘의 엔진으로 재작성하지 않는다. 새 원본에서만 종료 후 사건이 없다. |
| 판정·권한·비용 | 전투·보상·패치 계수/AI 정책/골드 승리/임의 보정률을 추가하지 않았다. 첫 실제 ordered event가 종료를 확정한다. 현 엔진은 동시 물리 틱 모델이 아니며 동일 초의 실제 동시 넥서스 교환 규칙까지 구현했다고 주장하지 않는다. 기존 공식 writer/observer/private 권한과 세이브 버전은 유지한다. 단순 trace clock에 quiet도 참여하고 작은 종료 metadata가 저장되는 정확도 수정이며 성능 최적화가 아니다. 기존 예산·실패 기록은 유지한다. |

- 실제 원본 재현 전후: `record-official/g1`의 첫 넥서스 26:50·승자는 그대로, 26:56 포탑/보상 처리는 발생하지 않고 종료는 26:50이다. 첫 종료 전 사건 배열은 동일하다. 일반 3시드×양 side의 6짝에서도 이전 source와 종료 전 사건·이전 분 골드 history가 동일하고 승자는 같았다. 중복 넥서스 2건이 1건으로 줄어든 사례를 보존했다. 이 표본은 글로벌 승패율/밸런스 근거가 아니다.
- `scripts/match-adjudication-acceptance.mjs`: 6짝 logged/quiet의 실제 종료·승자·선수 KDA/XP/레벨/골드/피해/아이템·quest/시야·오브젝트·rates/평점/골드 history 동일성, 양 side 최초 종료/같은 분 추가 종료 차단, 실제 모든 post-end phase/action/log/expl의 state/RNG 불변, 실제 공식 lines/public meta 동일성, 종료 source·미확인/구형·lite 저장을 확인한다. 기존 `match-ending-acceptance`의 구조물 stall/180분 실패·post-70 실제 넥서스·save 재현도 유지한다. unresolved 경기에 골드 승자나 가짜 종료를 만들지 않는다.
- 실제 Chromium: First Selection→수동 밴픽→실제 공식 Bo3 3게임, 각 snapshot의 단일 마지막 넥서스/종료 초/duration/조회 validator, pending save/reopen와 기록 저장/reload, 원본 세트/분석실 종료 근거, source 이동과 fired 경계를 확인했다. 1280/320px 문서 가로 넘침/페이지 오류 없음. 동일 rebuilt HTML 주입 검증이며 production HTTP/최종 device/mobile/TalkBack QA가 아니다.
- 관련 검증: Node22 UI runner 62 acceptance/61 독립 VM, 132-module static/build 및 기존 회귀가 통과했다. module budget은 기존 engine 34k를 유지하고 작은 단일 책임 `match-adjudication.js`로 분리했다. [정확한 원본 비교](evidence/match-end-original-series.json)는 시행 당시 엔진 commit·setup·가상 자료 구분을 포함한다. `/tmp/match-end-baseline-source.json`/baseline.log, original-engine.js, original-series.log/json, comparison.log/json, browser.log와 screenshots를 보존한다.
- 초기 검사 실패: `/tmp/match-adjudication-focused.log`/save-probe.log는 fixture에서 완료된 시즌 표시를 누락해 full 저장을 lite로 오인한 실패다. source 종료값/조회는 이미 일치했고 fixture에 실제 완료 조건을 추가했다. `/tmp/match-end-integration.log`는 새 독립 acceptance를 추가한 뒤 기존 VM 기대 수 60을 그대로 둔 검증 실패이며 실제 수 61로 수정했다. 원본 실패와 후속 통과를 삭제/은폐하지 않는다.
- 첫 PR head `a90b4a9`의 CI `37168170229` calendar-scouting은 `role-quest-match-acceptance`가 수동으로 만든 quiet 상태에 로그 RNG를 생략하여 실패했다. 실제 quiet 경기와 같은 판정 시각 입력을 제공하도록 fixture에 독립 seeded log RNG를 추가했다. production의 RNG 누락을 감추는 fallback이나 로그/검사 제거는 하지 않았다. 원본 `/tmp/match-end-ci-calendar-failure.log`를 보존하며 새 head의 전체 CI가 최종 gate다.
- **정확한 다음 45–55분 단위: 8.5.1 미니언·웨이브 XP/수입 연결의 첫 수직 경계.** 현재 `incomeTick`의 `CS×58` 경험치와 역할/시간 상수, CS·gold·XP writer→level/구매→combat/macro 소비자를 검토한다. 기존 pinned Data Dragon source는 챔피언·아이템·룬이며 미니언 종류별 XP/공유/도착/보상 metadata가 있다는 증거가 아니다. reviewed patch-pinned minion XP·공유·spawn/arrival·보상 metadata를 먼저 확보하고 source/license/version/단위/누락을 보존한다. 확보된 규칙으로 막타와 근처 경험치 수급·공유, 죽음/귀환/로밍/배분 비용을 구분하는 첫 실제 writer-consumer 및 paired 시나리오를 구현한다. 27분 MID를 임의 목표 레벨로 맞추거나 자료 없는 계수를 만들지 않는다. source 확보가 막히면 정확한 원본/source gap·bounded 재현과 실제 다음 경계를 기록한다. full camp/웨이브/구조물 health-resistance·시야/전환 전체를 이 단위 완료로 부풀리지 않는다. 8.2/8.3/8.4/8.6/9.1과 다른 승인 영역도 유지한다.

### 12.5·12.9 선수 관측 평가·실제 지표 레이더 — 추가 승인, 구현 예정

- 사용자는 선수 평가와 경기 지표의 레이더 차트, 같은 조건의 두 선수 비교를 승인했다. `ui-player.js`의 현재 수치 grid와 `scouting.js:observedPlayerCoreMetrics`, 선수/분석 보고서와 실제 경기 지표를 먼저 감사한다. 차트를 추가한 것만으로 적법한 observed 평가가 되는 것은 아니므로 내부 원값·추정값의 출처/권한/관측 시점/불확실성·실제 consumer를 검증한다.
- 능력 평가와 실제 성적을 별도 그래프로 표시한다. 역할·기간·대회·patch·표본·기준을 비교 조건으로 보존하고 숫자 표/근거 이동을 함께 둔다. 없는 자료는 임의 0점이나 평균으로 채우지 않고 숨은 true ability·상대 private practice를 노출하지 않는다. 정규화와 방향(예: 기복 낮음)·단위는 설명 가능한 실제 규칙으로 검토하며 단독 KDA/면적/확정 순위를 만들지 않는다.
- 기존 선수 상세/12.9 contextual comparison 승인 scope에 병합하는 표시·조회 작업이며 새로운 능력 변수나 효과 계수가 아니다. 레이더·전체 domain UI는 아직 구현되지 않았다. 상단 유지/시작 전 운영 메뉴 숨김/별도 저장 utility/독립 domain 목적지 방향은 유지하고 경기 엔진을 최우선으로 진행한다.

- 추가 종료/자원 검증: [종료 뒤 포탑 보상 비교](evidence/match-end-resource-conversion.json)는 원본 사건 삭제가 아니라 실제 post-end 지급 차단을 확인한다. `record-official/g1`의 상대 TOP/MID가 종료 뒤 받던 각각 150골드가 실제 writer에서 사라졌고, 종료 전 사건은 동일하다. 이때 raw `ps.gold`의 의미가 정상 구매 장부라고 검증된 것은 아니다.
- 자연스러운 자원 열세 승리: bounded 32게임 탐색에서 선택한 [양 side 사례](evidence/match-end-resource-scenarios.json)를 추가 acceptance에 연결했다. seed `nexus-resource-scenario-13`은 상대 골드 56,686 대 승리 팀 54,848에도 실제 수성 교전·열린 기지·넥서스 파괴로 종료했고, `...-21`은 승리 팀 66,319 대 상대 68,676에서 실제 드래곤/영혼·열린 기지·넥서스 기록을 갖는다. 실제 생존 공격자와 파괴된 쌍둥이/억제기 조건을 검증했다. preset 승자·comeback 목표/확률·새 계수를 넣지 않았다. 사건은 설명 가능한 실제 경로이며 정확한 위치/개별 행동이나 단독 인과 확정은 아니다. 탐색 표본을 프로 목표 분포나 균형 승률로 쓰지 않는다.

### 8.2·8.3 추가 검증 결함과 다음 우선 단위 — 실제 구매 장부

- 종료 후 지급의 전후 비교에서 **구매 비용이 raw 보유 골드에서 차감되지 않는 실제 결함**을 확인했다. `newPS`는 시작 아이템만 차감하고 `addGold`는 보유/누적 골드를 함께 증가시킨다. `advanceItemPurchases`는 `goldEarned−questWardSpent >= threshold`로 구매하며 `applyItemCraftAction`은 재료·아이템만 변경하고 `ps.gold`를 차감하지 않는다. 그런데 `roleQuestWard`는 raw ps.gold를 실제 구매 가능 금액으로 소비한다. 이는 표시 전용 숫자 문제가 아니다. [실제 applied recipe cost와 raw bank](evidence/item-purchase-ledger-gap.json), `/tmp/item-ledger-defect.log/json`을 보존했다. 소스 가격을 합산한 장부 대조이며 자산 가격이나 수수료를 발명하지 않았다.
- **다음 우선 45–55분 구현은 이 8.2·8.3 구매 장부 경계다.** 실제 starter/cumulative recipe/component/quest/ward 비용, 500 시작 골드와 `500+spent` threshold의 불필요한 추가 문턱, affordability와 six-slot atomic combine/재료 소모/거절/반복 호출을 조사한다. 획득·소비·보유 금액을 기존 actual costs로 일치시키고 실제 automatic purchase writer·ward consumer·inventory/effects·official result/save와 paired 시나리오를 연결한다. 포괄적인 item exclusivity/판매/환불/팀 counter 효과가 이미 완성됐다고 주장하지 않는다. 누락된 금지 그룹 metadata는 먼저 확보한다. 효과·결과가 바뀌는 정정과 동작 보존 변경을 구분하고 AI/player parity·budget/seed/rollback을 검증한다. 새 manager 아이템 조작을 추가하지 않는다.
- 앞의 **8.5.1 XP/웨이브 source-backed 단위도 승인·유지**하며 구매 장부 교정 다음 순서다. 막타/경험치 수급 결합과 27분 MID 레벨 질문을 덮거나 임의 레벨로 맞추지 않는다. 이번 넥서스 단위가 구매 장부·full camp/wave/기하·미검증 item effect를 끝낸 것으로 부풀리지 않는다.
## 8·9 엔진 고도화 전체 판정·검증 목록 — 2026-10-04 사용자 문서화 승인

사용자가 직전 보고의 **38개 항목 전부 문서화**하도록 지시했다. 아래 번호는 이 검토 목록의 순번이며 새로운 개발 단계/기능 수가 아니다. 기존 7.1·8.1–8.6·9.1·3·12.9에 통합한다. 기존 승인·구현 증거·원본 규칙은 유지하며 등록을 구현/검증/게시 완료로 계산하지 않는다. 같은 항목을 다른 이름의 신규 기능으로 반복 제안하지 않는다.

현재 기준: PR #171 최종 head `d173a7f67f9da33dc7d6506be5ee3f9b629f99ac`의 필수 CI `37168431212` 전체 성공 후 main `b1cf7abb94bd00583baf78d34872d19de96a9605`로 병합됐다. 같은 main의 전체 CI/standalone-sync `37168684378`, Pages `37168959385`의 검증 artifact/온라인·오프라인 조립/게시가 성공했다. 이전 실패 head와 원본은 8.1.1대로 보존한다. Cloud 직접 github.io HTTP는 차단되어 응답 검증 성공을 주장하지 않는다. 본 문서화는 별도 사용자 요청이며 시간당 게임 구현 단위 완료로 집계하지 않는다.

**공통 등록·완료 계약**
- 모든 행은 기존 승인 범위다. 재현된 결함, 코드로 확인한 aggregate 한계, 조사 가설, 구현/검증/게시를 구분한다. 표의 '승인·검토'는 시스템이 전혀 없다는 뜻이 아니라 기존 부분 구현을 감사하고 남은 실제 연결/반례를 완결한다는 뜻이다.
- source는 해당 경기의 pinned patch/검토된 공식 메커니즘·기존 확정 가상 규칙·실제 상태와 사건이다. 경험적 보정은 provenance/license/날짜/patch/event/tier/side/role/game ID/중복/누락/단위를 검증한 organized competition 자료만 사용한다. 솔로랭크/혼합 미검증 자료·가상 경기 표본을 프로 목표로 사용하지 않는다.
- 입력 단위는 골드/비용, XP/레벨, 게임 초/분, 실제 HP·피해·보호막/회복, 개수/거리 또는 명시한 aggregate 접근 상태로 정의한다. 추상 효과 계수를 실제 AD/HP/거리로 위장하지 않고 source 없는 가격·계수·CC 시간을 만들지 않는다. 완전한 주문 시전/2D geometry/물리적 동시 틱 구현은 주장하지 않는다.
- writer는 실제 engine/shared command이고 consumer는 구매/인벤토리/전투/운영/공식 결과다. 화면은 확인된 원본·소유 관측·범위/누락과 실제 실패 이유를 보여준다. 숨은 true ability/상대 private 상태는 엔진 내부 결과 계산과 관리자의 관측을 구분하며 보고서·AI 판단 입력을 감사한다.
- 각 구현은 실제 행동→가능 조건→상태 변경→결과/근거 UI→pending/full/lite 저장·재접속을 연결한다. 중복/실패/취소·rollback, 종료 경계, seeded 재현, AI/player 같은 규칙, 원본 history/diagnostics 보존을 검사한다. public/private event-time source를 오늘의 상태로 재구성하지 않는다.
- 기대 이익은 표의 실제 오판정 감소다. 비용은 상태·source·검증·저장 증가, 기존 새 경기 결과 변화, 데이터 확보 부담이다. 의도적 현실성 수정과 동작 보존 최적화를 구분하며 measured bottleneck 없는 rewrite를 하지 않는다.
- 우선도: P0 재현된 실제 결함, P1 기반 자원/효과 정확도, P2 기반 소비자 위 확장/설명. 크기는 초기 추정으로 중=보통 2–3개 45–55분 수직 단위, 대=3개 이상/규칙 확보 의존이며 실제 조사 후 자연스러운 경계를 확정한다. 구매 장부 첫 단위는 기존 8.2·8.3의 45–55분 범위이며 전체 구매/효과 완성을 한 번에 주장하지 않는다.

| 순번·기존 단계 | 필요한 판정 / 현재 상태·source writer→consumer | 예시·집중 완료 조건 | 우선도·크기·의존 |
| --- | --- | --- | --- |
| 1 · 8.2·8.3 | 획득·소비·보유 골드 장부. **재현·8.2.1 구현, 출시 게이트 대기**: newPS/addGold→advanceItemPurchases/applyItemCraftAction→ward/전투. 기존 actual craft가 ps.gold를 차감하지 않았음; 현재 검증은 8.2.1 참조 | 기존 evidence의 실제 10명 cost/bank 대조; 벌고 쓴 금액과 잔액 일치, 부족/중복/조합 거절·원자성·save 검증 | P0·중; 실제 recipe/cost |
| 2 · 8.2·8.6 | 구매 가능 시점과 실제 구매 시점. **승인·검토**: addGold의 자동 구매→귀환/가용 상태 | 전장 획득 골드가 즉시 장비 효과가 되는지 재현; 검토된 구매 장소/귀환 조건 소비, manager 조작 추가 없음 | P1·중; 1·9 |
| 3 · 8.3 | 골드와 실제 장비 전투력의 중복. **코드 한계**: combatStats0의 goldEarned×ITEM_CONV와 systemEffects 동시 소비 | 같은 획득 골드/다른 실제 장비·미소비 골드의 차이; 장비별 구매·효과 인과, source 없는 계수로 대체 금지 | P1·대; 1·4·11 |
| 4 · 8.2 | 구매 writer 합법성. **승인·부분 구현 감사**: systems의 plan/craft/advance, role-quests equipment→inventory/effects | 재료·가격·고유/배타 그룹·6칸 결합·boots/champion·역할 보상; 허용 repeated component와 불허 final 중복 구분 | P1·대; pinned 누락 metadata 확보 |
| 5 · 8.5.1 | 막타 골드와 주변 XP 분리. **코드 한계**: incomeTick CS×58→addXp/level | 막타 실패 vs XP 수급 범위 밖을 분리; 27분 MID 임의 목표 레벨 금지 | P1·대; minion XP/share source |
| 6 · 8.5 | 웨이브 실제 공급량. **승인·검토**: lanePush/incomeTick→CS/gold/XP | 생성·도착·사망·잔여 미니언보다 많은 수입 불가; 종류별 공급/수요 장부, 이전 history 보존 | P1·대; 5·patch spawn/reward |
| 7 · 8.5·8.3 | XP 공유·역할 자원 배분. **승인·검토**: income/quest→levels/purchases | support 동행/정글 cover/roam/사이드 독식의 개인·팀 자원 차이, 국소 공유 대상·시간 조건 | P1·대; 5·6·9·source |
| 8 · 8.5 | 캠프별 가용성·처치 비용. **승인·검토**: jungleTick/jgNext/income→동선/XP/구매 | camp 생성·respawn·HP/resist·clear time·reward·이미 먹힘/카정, farm 대신 gank의 실제 손실 | P1·대; camp metadata·9 |
| 9 · 8.6 | 귀환·부활·이동 시간. **코드 한계**: laningTick 귀환 즉시 hp=1/recall→income/합류 | recall 시작/중단/완료·구매·복귀 중 공백; 회복 직후 원위치 전투나 용 합류가 가능한지 반례 | P1·대; 1·2·10 |
| 10 · 8.3·8.6 | 부분 시간 자원·참여 손실. **승인·검토**: deadUntil/penalty/분 tick→income/fight | 같은 사망 시간의 분 경계 전후 수입/XP/합류 차이; 절대 시각 vs 표시 시각 구분 | P1·중; 5·9·33 |
| 11 · 8.3·9.1 | 피해 유형별 방어. **코드 한계**: combatStats0 arm/mr 혼합 EHP→fight | 물리/마법/고정 피해별 상대 방어 빌드 대응; 피해 subtype·원천·실제 stats 검토 | P1·대; 3·4·source |
| 12 · 8.4 | 팀 방어 감소와 개인 관통. **승인·검토**: reviewed effects→실제 피해 consumer | 적용자·stack/order·coverage/uptime·수혜 공격자; 같은 방어 감소 두 번 중복 효과 반례 | P1·대; 11·mechanics source |
| 13 · 8.6 | 접근 가능한 공격 대상. **승인·검토**: fight target selection→damage | 후방 딜러 선택 전에 range/access/frontline/peel/disengage 조건; aggregate 접근 한계 명시 | P1·대; 14·17·28 |
| 14 · 8.3·8.6 | 순간·지속 피해의 시간 차이. **기존 burst/ext/clean 보강**: fightSkillPhase/fight→damage | 짧은·긴 실제 교전의 공격 가능/생존 시간과 누적 피해 차이; 고정 승률 설정 금지 | P1·대; 13·15·16 |
| 15 · 8·9.1 | 핵심 스킬/소환사 주문 가용성. **점멸 등 기존 상태 감사**: flashAt/roleQuestSmite/skillProfile→행동 | 재사용 전 사용 불가, 직전 교전 소모가 다음 운영에 영향; 검토된 cooldown·지원 효과만 연결 | P1·대; source·시간 상태 |
| 16 · 8.3 | 실제 마나/기력 등 자원. **코드 한계**: combatStats0 resource 계수→off | 부족/소모/회복이 가능한 행동·지속 시간을 바꿈; 서로 다른 자원 규칙/소스, 없는 자원 발명 금지 | P1·대; 14·15·source |
| 17 · 8·9.1 | CC 종류·겹침. **aggregate cc 기존 보강**: skill profile→fight 접근/시간 | stun/root/slow/displacement별 공격·이동·해제와 overlap; 모르는 CC 시간 임의 설정 금지 | P1·대; 13·15·source |
| 18 · 8.4 | 유효 회복/보호막/치감. **승인·검토**: system/skill effects→실제 HP/수혜 대상 | full HP overheal·unused expired shield·사망 대상·중복 치감; 유효량과 원래 생성량 분리 | P1·대; 11·17·source |
| 19 · 8.3·12.9 | 실제 피해와 overkill. **검토 필요**: fight의 d와 round(d×.9)→HP/dmg/dmgTaken/quest | 남은 HP보다 큰 한 번 피해, blocked/shielded/overkill 구분; 실제 감소와 통계/퀘스트 일관성 | P1·중; 11·18 |
| 20 · 8.2–8.4·9.1 | 조건부 item/rune 효과. **systemEffects 소비자 감사** | 조건/target/cooldown/횟수/적용 불가 이유; passive 수치만 합산한 상태를 전체 메커니즘 완성으로 간주하지 않음 | P1·대; 4·15–18·source |
| 21 · 8.4 | 팀 utility 배분. **승인·검토**: selectItemBuild→actual applicable effects | 치감/방깎 안정 적용자·damage type·coverage·대체 장비 비용; 모든 선수 동일 counter 중복 구매 비교 | P2·대; 4·12·18·20 |
| 22 · 8.6 | 교전 뒤 잔여 전력. **승인·검토**: fight survivors/hp→convert/objective | 살아 있지만 HP/자원/cooldown 부족해 baron 포기, 역습/귀환/웨이브 손실; 승리와 다음 행동 가능성 분리 | P1·대; 9·14–18 |
| 23 · 8.5·8.6 | 웨이브 상태 지속. **lanePush proxy 보강** | 쌓인 wave/도착/clear time/freeze/억제기 pressure가 다음 선택에 남음; 상태를 장식 값으로 추가하지 않음 | P1·대; 6·9 |
| 24 · 8.6 | 구조물 공격 조건. **takeStructure/towerTick 보강** | wave/살아 있는 공격자/방어 병력/보호 규칙/시간·퇴로 확인; 우세 score만으로 즉시 철거하지 않음 | P1·대; 22·23·source |
| 25 · 8.6 | 다이브 비용. **승인·검토**: laning/fight/tower→피해/죽음/전환 | turret aggro/target switch·적 증원/퇴로·생존; 킬 이득보다 손실이 큰 사례, 알려진 규칙 근거 | P2·대; 9·13·24 |
| 26 · 8.5·8.6 | 오브젝트 처치/교환 비용. **objectiveTick/convert 보강** | clear time/받는 피해/smite/접근/반대편 손실; 먼저 확보한 objective가 언제나 이득이 아닌 paired 사례 | P1·대; 8·15·22–24 |
| 27 · 8·9.1 | 버프의 실제 소비. **combatStats/tower의 기존 buff 감사** | 소유·만료·갱신, patch별 baron wave/공성·elder 지원 효과; 고정 전투 배수만으로 전체 효과 완료 주장 금지 | P1·대; 20·23·24·source |
| 28 · 8.6·3 | 시야 위치/수명/마지막 관측. **visionTick scalar 보강** | 현재 보임 vs last seen·기간 경과 uncertainty, 제거/만료/정보 공유; 정확 2D sight geometry 주장 금지 | P1·대; 9·23·source |
| 29 · 8.6·7.1·3 | 관측 가능한 AI 판단 입력. **조사 가설**: jungle/teamCall/macro/draft→선택 | 실제 상대 HP/위치/cooldown을 비관측 상태에서 읽는지 감사; 엔진 참 상태와 합법적 판단 정보 분리 | P1·대; 28·기존 observation |
| 30 · 7.1·8·6 | 전술 실행 가능성. **기존 tactics/콜 보강** | aggressive 지시 vs 조합/wave/자원/도착/실행력, 불가능 조건·대기·실패 사유; forced success 금지 | P2·대; 9·13·22·28 |
| 31 · 7.1 | 근거 있는 series 적응. **series/draft evidence 소비 감사** | 실제 이전 세트 공개 pick/운영·자기 소유 관측만 다음 세트 사용; enemy private/future state 금지 | P2·중; 29·기존 series source |
| 32 · 2·6·8 | 피로/숙련/팀워크 영향 분리. **기존 playerMod/mf/sk/mods 감사** | 판단·실행·협업 중 실제 적용 위치/겹침; 단일 반복 보너스·임의 handicap 금지, 동일 조건 비교 | P2·대; source·30 |
| 33 · 8.1 | 동시 사건/처리 순서. **넥서스 경계 구현, 나머지 검토**: fight queued damage/순서→kill/reward | 양쪽 교환·이미 예정된 공격·caster 사망·objective 경합, 배열/side 순서 반례; 새 동시 규칙은 명시적 검토 | P1·대; actual timing/source |
| 34 · 8·9 | 효과/보상/cache 일관성. **조사 가설**: quest/equipment/buff/combatStats cache→결과 | 같은 event 재처리·만료·장비 변환 뒤 cache stale, actual writer 변경과 실제 effect; logger 제거 금지 | P1·중; 4·15·20·27 |
| 35 · 8·12.9 | 설명과 계산 일치. **기존 event-time source 보강**: actual events/expl→review | 실제로 사용한 원인·관측/추론/평가 구분, unsupported 인과 단정/과거 재구성 금지; source 링크·권한·save | P2·중; 각 실제 consumer |
| 36 · 9.1·7.1·8 | patch 실제 파급. **기존 revision/consumers 감사** | price/stats/recipes/effects/skills/spawn/rewards 변경→구매/draft/combat/macro, paired before/after·rollback | P1·대; 1–34·reviewed source |
| 37 · 3·7·8·9 | organized competition 보정. **외부 자료 미수집·미검증** | source/license/game IDs/중복/결측/단위 검증 후 role CS/XP/resource/purchase/objective·시간 분포 및 chronological holdout | P2·대; 수집/검증·기계적 정확도 |
| 38 · 8·9·12 | 재현성과 engine version 경계. **기존 seeded/save 보강** | 같은 input/patch/seed·side 교환·표시/정렬/noise 영향·save 연속; 새 engine 결과 변화와 보존된 역사 분리 | P1·중; 모든 writer/consumer |

### 8·9 추가 source 발견 — 기존 승인 조건 보강, 완료 아님

이번 코드 읽기에서 아래 후보를 추가했다. **코드 표현 확인과 실제 경기 결함 재현은 구분**하며, 새 가격/효과/정책을 확정하지 않는다. 모두 위/기존 승인 항목의 구체적인 반례로 통합하며 신규 기능 수를 늘리지 않는다. 관측/UI/save/rollback/AI 계약은 위 공통 기준을 그대로 적용한다. 우선순위는 P1이며 구매 장부 첫 단위 이후 해당 consumer의 수직 작업에서 조사한다.

| 추가 발견·상태·기존 담당 | source/trigger·입력/단위·writer→consumer | 이익·반례·의존/비용·정확한 다음 조사 |
| --- | --- | --- |
| 저체력의 교전 진입 최소치 — **코드 불일치 후보**, 8.3·8.6/목록 18·22 | fight가 F.hp=EHP×clamp(ps.hp,.2,1)로 시작하지만 교전 후 hp는 .05까지 저장한다. HP ratio 5–19% 생존자의 다음 교전 진입 | 자동 회복 없이 5% 상태가 20% 시작으로 상승하는지 실제 연속 교전 재현. 부활/시간 회복과 다른 현상으로 구분; aggregate 최소치의 근거 검토, 무조건 삭제/계수 교체 금지. 중·HP 회복/시간 상태 의존 |
| 오브젝트 획득 두 writer의 기록 차이 — **코드 연결 공백 후보**, 8.5·8.6/26·34 | objectiveTick.run은 involved.objectives/epics/jungleStacks와 reward를 처리; convert의 직접 baron 경로는 barons/buff/gold/log만 처리 | 동일 실제 획득이 경로 때문에 참여 기록/quest 진척 누락·중복되는지 실제 paired fixture. 실제 참여자는 관측/가용·시간 조건으로 정하고 무조건 alive 전원 배분 금지. 중·공유 actual award writer 검토 |
| patch 밖의 보상 상수 — **코드 확인·규칙 감사 필요**, 8.3·9.1/1·36 | takeStructure gold 250/300/350, dragon 40, baron 300, 일부 elder spawn/buff 상수 등과 patch.rules 소비 경계를 대조 | reviewed 패치 보상이 실제 모든 지급 경로에 닿는지 확인; source 없는 값을 규칙으로 옮기는 것만으로 정확성 완료 아님. 중·source/license/version·2경로 의존 |
| assist 배분/반올림 보존 — **미재현 가설**, 8.3/1·19·34 | killPlayer가 assistGold/as.length를 각각 Math.round; killer/victim/assist 대상 목록→실제 gold/XP/quest | 지원 규칙에 따른 총 지급량·대상 유일성·killer 제외·유효 관여 확인. 반올림 오차를 무조건 버그로 단정하지 않고 정책/단위 확보, 1/2/3/4명 반례. 중·실제 assist source |
| global/local 보상 수령 자격 — **규칙 확인 후보**, 8.3·8.6/7·24·26 | tower/dragon/baron이 aliveOf에 보상을 지급하는 경로. 사망한 아군 vs 실제 근처 공격자/참여자 | patch의 팀 전역/국소 지급·사망 상태 규칙을 대조, 지급 자격과 참여 기록 분리. 죽은 선수 항상 지급/미지급으로 새 규칙 발명 금지. 중·metadata·실제 source |
| sort comparator 안 난수 — **코드 확인·재현성 가설**, 8.6/33·38 | takeStructure lanes.sort comparator가 st.rng.dec.next 소비; 정렬 호출 순서→다음 실제 의사결정 stream | 지원 runtime/같은 input 재현과 total-order/동률·정렬 소비를 최소 fixture로 확인. source 없는 정책 변경 없이 사전 seeded keys 등 검토; 출력 변화면 의도적 변경으로 기록. 중·seed/side parity |
| 전투 능력치 cache 갱신 조건 — **미재현 가설**, 8.3/3·20·27·34 | combatStats key는 t/goldEarned/lvl/questRevision/buff/soul; 실제 items/runes/patch 상태 변경 writer가 모든 경로에서 key를 바꾸는지 감사 | 같은 시각 장비 변환/조건 효과/patch snapshot에서 cached vs fresh combatStats0 결과 비교. stale 재현 전에 cache rewrite 금지; measured 성능·behavior parity. 중·실제 mutation 경로 |
| 구매 preview의 공유 상태 — **코드 alias·미재현 가설**, 8.2/1·4·34 | advanceItemPurchases preview={...ps,items:ps.items.slice()}, applyItemCraftAction→syncRoleQuestEquipment; items 외 quest/관련 객체 공유 여부 | 슬롯 부족/중간 조합 거절 preview가 원본 quest/equipment/state를 바꾸는지 before-after 비교. 실패·중복 시 bank/inventory/quest/RNG 불변; 필요한 clone/순수 검증 경계만 적용. 중·actual quest writer/ledger |

**정확한 다음 구현 순서:** 8.2·8.3 실제 구매 장부 첫 45–55분 단위 → 실제 inventory/골드 전투력 중복 감사 → source-backed 8.5.1 XP·웨이브 → camp/귀환·이동·실제 참여 시간 → 피해/방어/효과 → 정보 기반 운영. 의존이 겹치는 반례는 해당 수직 단위에 함께 검증한다. 전체 approved scope/숫자 roadmap, 엔진 최우선, 한 worker, 정확한 head CI/순차 merge/validated HTML·Pages, 원본/실패/이력 보호와 최종 장기/실기기 QA 보류를 유지한다.


### 8.2.1 실제 구매 장부·원자적 조합·기록 연결 — 2026-10-04

범위/추정: 기존 8.2·8.3의 한 worker 45–55분 수직 단위. `fix/item-purchase-ledger`는 main `b1cf7abb`에서 시작했으며 구현/로컬 수용 완료, PR·정확한 head 전체 CI·병합·게시 게이트는 아직 대기한다. 등록된 38항목 전체 완료가 아니다.

- 재현/원본: [실제 10명 기존 장부 결함](evidence/item-purchase-ledger-gap.json)을 보존한다. starter만 차감하고 이후 recipe writer가 장비를 지급하면서 실제 bank를 차감하지 않았다. 추가 500 누적 threshold는 시작 골드가 이미 earned에 포함된 상태에서 실제 구매를 늦췄다. 현재 writer는 패치의 actual recipeCost/from/active 정보를 검증하고 실제 잔액을 차감한다. 선수/AI 모두 같은 engine-owned 경로를 사용하며 새 감독 조작은 없다.
- 새 `item-purchases.js`는 순수 inventory 검증→전체 조합 비용/재료 multiplicity/6칸 검사→단일 commit을 소유한다. 부족·잘못된 가격·누락 재료·불법 final 중복·champion boots·반복 실행은 지출/장비/quest를 바꾸지 않는다. 반복 component는 허용한다. 기존 starter disposal은 실제 시작 아이템에만 한정하고 환불을 만들지 않는다. source에서 값싼 recipe component도 starter로 분류되어 있어 기존 blanket disposal은 실제 재료를 버렸고, 기존 writer는 누락 재료를 무시했다. 실제 6,866개 champion/role build 검증으로 이 연결을 확인했다.
- 미완성 boots recipe를 MID/ADC 퀘스트 무료 변환이 먼저 소비하지 않도록 최종 조합까지 보류한다. 완료 뒤 기존 무료 upgrade/별도 boots 보상을 유지한다. support ward는 실제 bank를 사용하고 소비 금액/동일 시점 중복 제한을 유지한다. preview는 quest를 호출하지 않는다. 이전 shallow alias의 구체적 quest 손상은 미재현 상태이며 새 순수 preview 검증을 원본 결함 재현으로 부풀리지 않는다.
- 실제 inventory 변경 revision을 기존 combat cache에 연결했다. earned gold가 같은 상태에서 장비를 구매한 반례에서 cache와 fresh 계산의 실제 효과가 일치한다. combat 계수/AI 정책을 바꾸지 않았다.
- `match-history.js`는 실제 official 결과에 optional resources v1(earned/items/wards/held)을 저장하고 10명/비음수/장부 등식/기존 earned row를 검증한다. `ui-match-history.js`는 선택적 ‘종료 당시 골드 사용’만 보여준다. 아이템 목록 열은 복원하지 않는다. 기존 기록에 없으면 저장되지 않았다는 상태를 표시하고 현재 상태로 재구성하지 않는다. full/lite save의 기존 publicRecord 경계를 재사용한다. practice는 기존 참가자/현재 권한 경계를 따르며 공개 official 분석으로 편입하지 않는다.
- focused 수용: 실제 1,380개 구매 action, 4개 logged/quiet seed/side paired match, 정확한 비용·잔액 보존·재료/가격/잔액 거절·6칸 atomic combine·MID/ADC/SUP·같은 earned cache·official writer/UI·위조 source 거절·legacy/lite save·fired practice 경계 통과. UI 통합 63 acceptance/62 독립 VM, 133-module static/build, system 16경기/6,866 inventory, ending 6 pairs와 regression 통과. Chromium 1280/320px에서 실제 First Selection/수동 밴픽/공식 Bo3 3경기·pending/history save·장부 펼치기/키보드·분석 필터/source·fired/overflow 검증 통과. 정책상 동일 rebuilt HTML 주입이며 실제 production HTTP 검증/최종 기기 QA는 아니다.
- 결과 해석/원본 보호: 구매 시점/잔액/장비 가용성이 교정되므로 승패·income이 달라질 수 있는 의도적 판정 수정이다. 이전 seed13/21 behind-win 증거는 원본 commit 그대로 보존하며 현재 자연 발생 seed19/22에서 뒤진 골드→실제 교전/접근→넥서스 반례를 확인했다. 검사 script가 기존 임시 scenario JSON을 덮어쓴 실수는 새 결과를 별도 파일로 분리하고 정확한 b1cf7abb 입력/함수로 복원한 뒤 원본 전체 bounded log 일치를 확인했다. 원본 committed evidence는 변경하지 않았다.
- 진단: `/tmp/item-ledger-system-first.log`의 실제 recipe stall, focused-first의 fixture esc 누락, ending-first의 의도적 timing 변경에 따른 구 seed 반례 실패, original-scenario restoration의 sandbox/중복 선언 실패와 최종 원본 일치, 이전 사용량 auto-review 실패를 보존한다. 최신 성공은 각각 corrected 로그이고 원 실패가 성공이었다고 주장하지 않는다. `/tmp/item-ledger-browser.log`, integration/build/regression/system/focused/ending 로그와 원자료를 유지한다.
- 한계/후속: 아직 실제 상점 위치/귀환·이동과 구매 시점이 연결되지 않고, 기존 earned-gold generic 전투력 계수도 남는다. sale/refund, 모든 exclusive group, conditional item/rune 효과와 team utility coordination의 전체 합법성/현실성을 완료했다고 주장하지 않는다. 다음 엔진 단위는 실제 inventory와 generic earned power의 이중 소비를 source/consumer로 재현하고 검토된 효과 경계로 교정하는 것, 이후 8.5.1 source-backed wave/XP다. 현재 퀘스트/slot 전환의 기존 aggregate 한계를 유지한다.

### 12.3–12.5 시작 화면 최신 사용자 방향 및 진행 중 위험 연결

최신 승인: 처음 화면은 ‘새로 시작하기 / 불러오기 / 설정’만 제공하고 긴 리그·국제대회·생성 세계 설명을 제거한다. 팀/커리어 선택은 새로 시작하기 이후 실제 흐름으로 옮긴다. 스크린샷의 국제대회 undefined 문구는 실제 UI 결함 증거다. 이 변경은 아직 구현되지 않았으며 구매 장부 후 별도 coherent UI 단위에서 실제 new/load/settings·취소·키보드·반응형·기존 저장/route 연결을 검증한다. 진행 중 주요 메뉴는 상단을 유지하고 저장 utility·아이템 열 제거·관측 radar 승인은 그대로 유지한다.

게임 진행 위험은 기존 승인 목록에 병합한다: 장비 재료 삭제/조합 및 quest 변환은 8.2.1 재현·수정; 낮은 HP 바닥/중립목표 두 writer/patch reward/분배·반올림은 위 추가 감사의 코드 가설; offseason 만료·임대·등록 순서와 연기 일정의 피로/준비/pending 참조는 4·10·11 연결 검증; 저장 실패/반복 action의 보상 중복·원자성은 11; 이적/해임 후 report 권한과 현재 patch의 과거 재구성은 3·9·12 관측/역사 경계다. 미재현 위험은 결함 확정으로 표시하지 않으며 각 실제 trigger/기존 writer/거절·save 반례를 해당 도메인 단위에서 검증한다.

최신 연결 승인(2026-10-04): 한국어 단일 지원에서 기능이 없는 ‘공용어 사용’ 설정은 시작 화면 정리 단위에서 제거한다. 구매 장소는 일반적으로 아군 기지 상점이며 오른은 실제 patch-pinned passive 구매 예외를 검증해야 한다. 8.2.1은 bank/recipe만 교정했고 상점 밖 자동 구매 제한을 완료하지 않았다. 다음 8.2.2는 현재 recall/respawn/travel/기지 상태 writer→구매 가능 consumer→actual effect timing→official/save 반례를 우선하고, source로 검토된 오른 조건 외 전장 구매를 허용하지 않는다. 이동·귀환 모델에 없는 상태는 임의 계수로 꾸미지 않는다. 실제 아이템/generic earned 전투력 중복 감사와 8.5.1 wave XP는 이어지는 엔진 우선순위로 유지한다. 표의 항목별 위/아래 정렬 요청은 12.5·12.9의 정렬/컨텍스트 유지 조건에 등록하되 열 정렬/화면 배치 의미는 확인 중이다.
