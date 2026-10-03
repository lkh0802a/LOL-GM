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
| 12. Product, UI, saves, performance and delivery | all-domain convenience, accessibility, offline HTML/web, save integrity, measured bottlenecks | Existing integration/UI work; useful decisions, working controls, parity/rollback and stable delivery |
| 13. Playtest fixes and final verification | user playtest → feedback fixes → final long/device/TalkBack QA → Android | Final acceptance; 100-season/device QA cannot start before feedback/fixes |

**Immediate numbered work and evidence:**

- 8.1 Nexus-based match ending: implemented/local acceptance; current-head CI
  pending. No gold-timeout winner; transparent computation guard, ordinary-match
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
   required exact-head CI still gates delivery. Never fabricate an official winner.
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
