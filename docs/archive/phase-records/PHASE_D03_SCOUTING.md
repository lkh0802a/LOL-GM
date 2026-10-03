> Documentation review 2026-10-03: [navigation](../../README.md), [active priorities and validation](../../DEVELOPMENT.md). Latest explicit user direction and later confirmed decisions supersede dated instructions; historical evidence is retained.

> Dated scope/acceptance record. For current priorities and validation sequencing,
> read [DEVELOPMENT.md](../../DEVELOPMENT.md). This record does not establish whole-game completion.

# D03 — 구단별 스카우팅 관찰 메모리 심화

> 출처: `docs/RETROACTIVE_DEPTH_AUDIT_1_11.md`의 D03/P0.
> 원칙: 기존 관리 구단 `db.scout` 구현을 재작성하지 않고, AI 구단이 실제 숨은 능력/잠재력을 시장 판단에서 직접 읽는 경로만 단계적으로 제거한다.

## D03-B1 — 구단별 독립 관찰 메모리와 시장 AI 연결

### 확인된 기존 상태

- 관리 구단은 `scouting.js`의 선수별 보고서, 관찰 누적, 표본·지역 불확실성, 연간 노후화, 스카우터/시설 효과를 이미 사용한다.
- AI 시장은 기존 `contracts.js::aiMarketObservation`에서 구단 ID·연도별 결정적 노이즈를 더했지만, 매 평가 때 실제 `playerOvr(p)`를 직접 기준으로 삼고 지속되는 구단별 보고서를 저장하지 않았다.
- 스태프에는 이미 `staffProfile(t).scouting`, 시설에는 `facilities.scouting` 효과가 있으므로 별도 스카우트 능력 시스템을 만들지 않는다.

### B1 구현 규칙

- 각 독립 구단은 팀 저장 상태 `scoutingState` 안에 선수별 `reports`와 관찰한 대회 메타데이터를 가진다. 모구단과 소유 2군은 같은 스카우팅 부서를 공유한다.
- **일반 시즌 이후 시장**에서 미관찰 선수 평가는 평판·최근 공식 경기 성적·지역성 같은 공개 정보에서 만든 `public` 추정치만 사용한다. 최초 백지 로스터 경매는 기존 acceptance와 D02 장기 시드의 기초 모집 구성을 바꾸지 않도록 B1에서 기존 현재능력 baseline을 보존하며, 이 초기시장 경로의 관찰 모델 전환은 후속 D03 단위로 남긴다.
- 실제 관찰이 발생하면 시뮬레이터가 숨은 능력/잠재력에서 **노이즈가 포함된 신호**를 생성해 보고서에 저장한다. 시장 AI는 이후 숨은 원값이 아니라 저장된 보고서만 소비한다.
- 같은 선수를 보더라도 구단 ID별 관측 오차와 각 구단의 기존 스카우터 능력/스카우팅 시설 수준 때문에 보고서가 달라질 수 있다.
- 반복 관찰은 지식을 누적하고 불확실성을 줄인다. 연도 경계에서는 보고서 지식이 감소하고 `staleYears`가 증가하지만 과거 추정값 자체를 현재 실력으로 자동 갱신하지 않는다.
- 관리 구단의 기존 `db.scout` 데이터와 UI 흐름은 변경하지 않는다.
- 모든 AI 보고서는 팀 객체에 저장되므로 기존 save packing/restoration을 그대로 통과해야 한다.

### 실제 경기 관찰 연결

기존 `scoutFromDay` 훅을 재사용한다. AI 구단은 자신의 국내 리그 경기에서 선수 관찰을 축적하고, 국제대회에서는 해당 구단이 직접 참가한 경기의 상대를 관찰한다. 관찰량은 기존 스카우팅 스태프/시설 프로필을 사용하며 관리 구단 데이터와 공유하지 않는다.

### B1 acceptance

`scripts/scouting-depth-acceptance.mjs`에서 다음을 고정한다.

- 같은 선수에 대해 서로 다른 두 AI 구단이 독립 보고서를 보유한다.
- 스카우터/시설이 강한 구단이 동일 관찰량에서 더 많은 지식을 획득한다.
- 반복 관찰 뒤 지식 증가와 불확실성 축소가 발생한다.
- 연도 경계 뒤 지식 감소·stale 증가·추정치 고정이 발생한다.
- 미관찰 제3구단은 다른 구단 보고서를 받지 않고 공개정보 fallback을 사용한다.
- 일반 시즌 이후 `aiMarketObservation`은 구단 보고서/공개정보 fallback을 통해 `aiMarketValue`에 연결된다. 최초 `initial_roster` 경매만 기존 현재능력 baseline을 별도 함수로 격리해 보존한다.
- 저장/복원 후 보고서·관찰 횟수·경기 표본과 구단 격리가 유지된다.

## B1에서 의도적으로 남긴 D03 작업

B1은 D03 전체 완료가 아니다. 다음 단위에서는 최초 백지 로스터 시장의 관찰 모델, 시장 개장 전 **능동 타깃 선정/관찰 비용**, 지역·리그 담당 범위 확대와 예산/스태프 배분, 오래된 보고서를 근거로 한 실제 영입 실패 및 이후 재평가를 실제 시장 시나리오로 검증해야 한다. 관리 구단의 기존 수동 스카우팅 UI와 D07 스태프 계약 심화는 이번 단계에서 건드리지 않는다.


## B1 검증 결과

PR CI에서 `D03_SCOUTING_ACCEPTANCE`는 동일 선수에 대해 강한 스카우팅 조직이 반복 6회·12경기 표본 뒤 지식 54, 약한 조직은 별도 보고서를 유지했고, 강한 조직의 불확실성은 9.8 → 7.3으로 축소됐다. 연도 경계 뒤 해당 보고서는 지식 46·불확실성 9.3으로 노후화됐으며 추정 능력/잠재력은 자동으로 현재값에 갱신되지 않았다. 미관찰 제3구단은 `public` fallback을 유지했고 save format 2 왕복 뒤 관찰 6회·12경기 표본이 그대로 복원됐다.

첫 구현에서는 새 공개정보 fallback이 최초 백지 로스터 경매의 선수 선택까지 바꿔 D02 다지역 의료 시드의 기존 5인 하한 결과를 흔드는 회귀가 발생했다. B1 범위를 기존 일반시장에 맞게 조정하여 `initial_roster`는 보호된 baseline을 유지했고, 재실행에서 D02 다지역 78,514 선수·일/948경기/15,636 스크림 블록 검증, regression, smoke, 2시즌 career, perf, production build가 모두 통과했다. 이 초기시장 baseline 자체의 관찰 모델 전환은 잔여 D03 작업이다.


## D03-B2 — 최초 백지 로스터 시장의 창단 스카우팅 dossier

### 문제

B1에서는 첫 시즌 `initial_roster` 경매만 기존 `contracts.js::initialRosterMarketObservation`을 보존했다. 이 함수는 경매가 선수를 비교할 때마다 실제 현재 OVR을 다시 기준으로 계산했기 때문에, 구단별 보고서가 시장 판단의 단일 정보원이 된다는 D03 규칙에 예외가 남아 있었다.

### B2 구현 규칙

- 기존 창단 경매의 선수 선택·의료 장기 시드·로스터 수급 결과를 바꾸지 않기 위해, 기존 초기시장 능력/잠재 추정 공식을 **동일한 1회 관측 신호**로 사용한다. 밸런스 수치는 조정하지 않는다.
- 이 신호 생성은 `scouting.js::initialAiMarketDossierSignal` 안에서만 수행한다. 최초로 해당 선수를 검토한 구단은 `seedInitialAiScoutReport`를 통해 자신의 `scoutingState.reports[player]`에 `founding_dossier`를 저장한다.
- `contracts.js::aiMarketObservation`의 `initial_roster` 특례와 숨은 OVR 직접 조회를 제거한다. 창단 경매와 일반 시장 모두 `aiScoutReport` 하나를 통해서만 정보를 소비한다.
- dossier가 생성된 뒤에는 같은 창단시장 안에서 선수의 실제 능력치가 변하더라도 저장된 ability/potential을 유지한다. 즉 후보 정렬 중 현재 OVR을 재조회하지 않는다.
- 서로 다른 구단은 동일 선수에 대해 각자 별도 dossier를 생성하며, 기존 구단 ID 기반 관측 오차를 그대로 유지한다.
- 창단 dossier는 save/restore 대상이다. 이후 실제 경기 관찰이 들어오면 `source='scouted'`로 전환되어 B1의 누적 관찰/노후화 경로를 그대로 사용한다.

### B2 acceptance

기존 `scripts/scouting-depth-acceptance.mjs`를 확장해 다음을 검증한다.

- 초기시장 dossier의 ability/potential/uncertainty가 B1 이전에 보호했던 기존 창단 경매 공식과 정확히 일치한다.
- dossier 최초 생성 이후 실제 OVR을 강제로 변화시켜도 `aiMarketObservation`과 `aiMarketValue`는 변하지 않는다.
- 두 AI 구단은 같은 선수에 대해 서로 독립된 dossier 객체를 가진다.
- `aiMarketObservation`에는 더 이상 `playerOvr`/실제 잠재력 직접 조회나 초기시장 별도 함수가 존재하지 않는다.
- `initial_roster` 상태에서 save/restore 후에도 founding dossier가 동일하게 복원된다.
- B1의 일반시장 구단별 관찰, 스태프/시설 효과, 반복 관찰, 연간 노후화 acceptance도 함께 유지한다.

## B2 이후 남은 D03

D03 전체 완료는 아니다. 다음 독립 단위는 **능동 스카우팅 운영**이다. 시장 개장 전 AI가 제한된 조사 자원을 어떤 선수/지역/리그에 배분하는지, 관찰 비용과 구단 재정·스카우터/시설 역량이 어떻게 연결되는지 구현해야 한다. 이후 오래된 보고서 때문에 실제 영입 판단을 틀리고 추가 관찰 후 재평가하는 시장 시나리오까지 검증해야 한다. D07의 스태프 계약 자체는 계속 별도 범위다.


### B2 검증 결과

최종 코드 PR CI에서 65개 Artifact 모듈 구조 검사가 통과했다. 최초 구현은 B2 로직을 기존 `scouting.js`에 추가하면서 14,000자 유지보수성 예산을 초과했고, 예산을 늘리지 않고 AI 구단 보고서/시장 관찰을 `scouting-ai.js`로 분리했다. 최종 크기는 관리 구단 스카우팅 도메인 약 6.5k자, AI 스카우팅 도메인 약 8.0k자이며 새 모듈에는 10k 유지보수성 예산을 별도로 둔다.

`D03_SCOUTING_ACCEPTANCE`의 창단시장 표본에서 실제 OVR을 74 → 92로 강제 변경해도 최초 저장 dossier의 관측 능력 73·잠재 81과 시장 평가는 변하지 않았고, B1 이전 초기시장 공식과 `baselineParity=true`를 확인했다. 서로 다른 두 구단의 dossier는 독립 객체로 저장되며 초기시장 save/restore도 통과했다. B1 일반시장 검증도 지식 46 → 반복관찰 54 → 연간 노후화 46, 불확실성 9.8 → 7.3 → 9.3으로 그대로 유지됐다.

같은 CI에서 D02 다지역 실제 달력 628일·공식 경기 948건·국제전 18건·실제 스크림 블록 15,636건·78,514 선수·일을 동일하게 완주했고, regression baseline, world smoke, 2시즌 career(공식 경기 186건·modern save resume 8회·legacy resume 2회), performance probe와 production build가 모두 통과했다. 창단 경매의 밸런스 상수나 의료 확률은 변경하지 않았다.


## D03-B3 — 능동 스카우팅 운영과 재정/커버리지 연결

### B3 구현 규칙

- B3는 AI 구단의 **시장 개장 직전 능동 조사**만 추가한다. 관리 구단은 기존 수동 `scoutPlayers` 경로를 그대로 사용한다.
- AI 조사 비용은 별도 밸런스 상수를 만들지 않고 관리 구단 초기시장 스카우팅과 같은 **선수당 `0.1 × 지역 pay scale`**을 사용한다. 실제 관찰 gain도 기존 관리 구단의 40 노력 입력이 변환하는 **22 gain**을 재사용한다.
- 구단은 스카우터 인원과 스카우팅 시설 단계의 합만큼 한 번의 시장 전 조사 capacity를 가진다. 시설/인력이 큰 조직은 더 많은 선수와 더 넓은 지역을 담당할 수 있지만 한 시즌 프로그램은 최대 10명으로 제한한다.
- 지역 커버리지는 홈 지역을 우선 배정하고, 남은 슬롯은 공개 정보(`aiPublicMarketObservation`) 기준으로 실제 영입 후보가 강한 지역에 배정한다. 각 배정에는 담당 스카우터 ID와 리그 식별자를 저장한다. 다음 시즌 competition 인스턴스가 아직 없는 프리시즌에는 안정적인 `REGION:DIV1/2` 키를 사용하고, 이미 생성된 competition이 있으면 실제 ID를 사용한다.
- 타깃 선정은 실제 OVR/POT을 읽지 않고 공개 관측 ability/potential, 최근 공식 경기 표본, 포지션 공백, 구단 철학과 정보 불확실성으로 순위를 만든다.
- 조사 대상은 현재 FA이거나 새 시즌 기준 계약이 만료되어 실제 시장에서 영입 가능한 선수로 제한한다. 전 세계 선수를 자동 갱신하지 않는다.
- 현금 지출 전에 기존 `financeRunway`의 월 운영비 기준 **3개월 reserve**를 남긴다. reserve를 확보하지 못하면 조사하지 않는다.
- 실제 지출은 즉시 `finance.cash`에서 차감하고 기존 `recordFinancePrepaid(..., 'scoutingExpense', ...)`에 기록한다. 따라서 결산에서 이중 차감 없이 스카우팅 비용으로 표시된다.
- 조사 결과와 지역/리그/담당 스카우터/지출/유동성 판단은 `scoutingState.operations`와 `lastOperation`에 저장하며 최근 6개 프로그램만 보존한다.
- 오프시즌에서는 시즌 결산·신인 생성·스태프 정비·시설 투자 판단이 끝난 뒤, 시장 phase로 전환하기 직전에 `aiRunActiveScouting`을 한 번 실행한다.

### B3 acceptance

`scripts/scouting-operations-acceptance.mjs`에서 다음을 고정한다.

- 동일한 충분한 현금을 가진 구단끼리 스카우터/시설 자원이 큰 구단이 더 많은 타깃과 더 넓은 지역을 조사한다.
- 지역 assignment에 리그 ID와 담당 스카우터 ID가 저장되며, 실제 타깃은 배정된 지역 안에서만 선택된다.
- 선수당 원단가는 관리 구단 수동 스카우팅과 동일하며, 전체 target의 원가를 기존 재정 장부 단위인 0.1억으로 한 번 반올림한 배치 청구액이 현금 감소 및 `finance.prepaid.scoutingExpense`와 일치한다.
- 3개월 reserve를 확보하지 못하는 구단은 targetLimit 0, spent 0으로 종료한다.
- 선택한 선수만 `scouted` 보고서로 갱신되고 같은 커버리지 지역의 미선택 선수는 `public` 상태를 유지한다.
- 능동 조사 보고서는 이후 `aiMarketObservation`이 실제 시장 평가에 소비한다.
- operation audit trail, 비용, 보고서가 save/restore 후 유지된다.

## B3 이후 남은 D03

D03의 마지막 핵심 검증은 **오래된 보고서 기반 영입 실패와 재평가**다. 시간이 지나 실제 능력과 저장된 추정치가 어긋난 선수를 AI가 합리적으로 잘못 평가하는 사례, 추가 관찰로 추정치가 수정되고 영입 순위/제안 판단이 바뀌는 실제 시장 시나리오를 검증해야 한다. D07의 스태프 계약 협상은 계속 별도 범위다.


### B3 검증 결과

최종 PR CI에서 `D03_SCOUTING_OPS_ACCEPTANCE`가 통과했다. 동일하게 충분한 현금을 준 표본에서 스카우터 4명·스카우팅 시설 5단계 구단은 `capacity=9`, 타깃 9명, NA+EU 2개 지역을 담당했고 총 0.8억을 지출했다. 기본 조직은 `capacity=3`, 타깃 3명, NA 단일 지역, 0.3억 지출이었다. 강한 조직의 각 실제 관찰은 기존 보고서 지식을 28~30포인트 높였고, 선택되지 않은 같은 커버리지 선수는 `public` 상태로 남았다. `financeRunway='strained'`인 표본은 `targetLimit=0`, 지출 0으로 종료했다. 테스트의 지역 pay scale에서 원단가는 선수당 0.088억, 관찰 gain은 기존 관리 구단과 동일한 22였다.

첫 acceptance에서는 프리시즌에 다음 시즌 `db.competitions` 인스턴스가 아직 없어 리그 assignment가 빈 배열이 되는 문제를 확인했다. 리그 담당 범위를 시즌 인스턴스와 분리해 `REGION:DIV1/2` 키로도 보존하도록 수정했다. 두 번째 acceptance에서는 0.1억 단위인 기존 재정 장부에 선수별 소액을 반복 기록하면서 현금과 prepaid가 서로 다르게 반올림되는 문제를 확인했다. 관리 구단 `scoutPlayers`처럼 타깃 전체를 한 배치로 0.1억 단위 정산하도록 수정했으며 재정 허용 가능 타깃 수도 이 실제 배치 청구액 기준으로 계산한다.

같은 최종 CI에서 B1/B2 스카우팅 acceptance, 66개 Artifact 모듈 구조 검사, D02 다지역 628일·948 공식 경기·15,636 스크림 블록·78,514 선수·일, regression baseline, world smoke, 2시즌 career 186경기, performance probe, production build가 모두 통과했다. 의료 확률과 기존 창단시장 밸런스는 변경하지 않았다.


## D03-B4 — 오래된 보고서의 영입 오류와 재관찰 후 재평가

### B4 구현 규칙

- 오래된 보고서가 남아 있는 선수는 실제 현재 능력과 저장 추정치가 달라질 수 있으며, AI는 **저장된 보고서만** 사용하므로 합리적인 오판이 발생할 수 있다. 현재 OVR/POT을 몰래 확인해 정정하지 않는다.
- B3의 능동 조사 우선순위는 기존 공개정보 점수를 유지하되, `staleYears`, 현재 보고서 불확실성, 공개정보와 기존 보고서의 불일치가 큰 선수를 제한적으로 더 우선한다. 이 우선순위에는 숨은 OVR/POT을 사용하지 않는다.
- 실제 FA 영입 판단을 만드는 기존 `contractMarket` 후보 필터/정렬을 `aiMarketOfferCandidates`로 공통화한다. 런타임 시장과 acceptance가 동일 함수를 사용하며 시장 평가 공식 자체는 바꾸지 않는다.
- stale 선수를 재관찰하기 직전과 직후, 해당 선수가 실제 생산용 FA shortlist에서 가지는 순위·선두 후보·`aiMarketValue`를 기록한다.
- 재평가 기록은 `scoutingState.reassessments`에 최근 12건까지 보존하고, 각 B3 operation에도 그 실행에서 발생한 reassessment를 연결한다.
- fresh 관찰은 기존 `observeAiPlayer`만 사용하므로 실제 현재 능력을 직접 읽는 곳은 관측 신호 생성 지점 하나뿐이며, 시장은 여전히 저장 보고서만 소비한다.
- 재평가 정보와 stale 오류 상태 모두 기존 save/restore 경로를 그대로 통과해야 한다.

### B4 acceptance

`scripts/scouting-reassessment-acceptance.mjs`는 같은 포지션의 두 FA만 비교하는 통제 시장을 만든다.

- 한 선수를 강할 때 실제 관찰한 뒤 1년이 지나고, 보이지 않는 사이 실제 능력이 크게 하락한 상태를 만든다. 보고서는 자동 갱신되지 않아 stale estimate가 그대로 남아야 한다.
- 실제 현재 OVR은 대체 선수가 더 높지만, 생산용 `aiMarketOfferCandidates`는 stale report 때문에 하락한 선수를 우선해야 한다.
- stale 상태를 save/restore한 뒤에도 같은 잘못된 우선순위가 유지되어야 한다.
- 실제 `aiRunScoutingOperation`이 그 stale 선수를 재조사하고 reassessment audit를 남겨야 한다.
- 재관찰 뒤 저장 추정 능력과 시장가치가 하락하고, 동일 생산용 shortlist의 1순위가 대체 선수로 바뀌어야 한다.
- stale 분기와 fresh 분기에서 동일 `signMarketContract` 거래 경로를 실행했을 때 각각 서로 다른 선수가 실제 계약되어야 한다.
- reassessment 기록은 save/restore 후 유지되어야 한다.

B4 acceptance와 전체 장기 회귀가 통과하면 D03의 감사 기준인 구단별 상이한 정보, 관찰 후 오차 감소, 시간 경과 감쇠, 스태프/시설 투자 효과, 오래된 보고서 기반 합리적 실패와 재평가가 모두 충족되므로 D03을 완료 처리한다.


### B4 검증 결과 — D03 완료

최종 PR CI의 `D03_SCOUTING_REASSESSMENT_ACCEPTANCE`에서 TOP 두 FA를 통제 비교했다. 오래된 보고서를 가진 선수의 실제 OVR은 50까지 하락했고 대체 선수는 76이었지만, 구단의 stale 보고서는 ability 93을 유지해 생산용 `aiMarketOfferCandidates`가 stale 선수를 먼저 선택했다. 이 잘못된 우선순위는 save/restore 후에도 그대로 유지됐다.

실제 `aiRunScoutingOperation` 재관찰 뒤 해당 선수의 저장 ability는 93 → 67, 시장가치는 93 → 67.1로 `-25.9` 하락했다. 전체 실제 FA shortlist에서는 순위가 1위 → 4위로 내려갔고 leader와 rank가 모두 변경됐다. 두 선수만 둔 통제 shortlist에서는 1순위가 stale 선수 `NA_0`에서 실제 OVR 76인 대체 선수 `NA_6`로 반전됐다. stale 분기와 fresh 분기에서 동일 `signMarketContract` 경로를 실행해 각각 그 시점의 서로 다른 1순위가 실제 계약되는 것도 확인했다. reassessment 기록 역시 save/restore 뒤 유지됐다.

같은 CI에서 B1/B2의 구단별 보고서·창단 dossier, B3의 능동 운영 acceptance, 67개 Artifact 모듈 구조 검사, D02 다지역 628일·948 공식 경기·15,636 스크림 블록·78,514 선수·일, regression baseline, world smoke, 2시즌 career 186경기, performance probe, production build가 모두 통과했다. 의료·계약·시장가치·스카우팅 비용/관찰 gain의 밸런스 상수는 변경하지 않았다.

따라서 감사 문서의 D03 수락 기준인 **구단별 상이한 정보/영입 판단, 관찰 후 오차 감소, 시간 경과 정보 감쇠, 시설·스태프 투자 효과, 오래된 보고서로 인한 합리적 실패와 재평가**를 모두 충족한 것으로 기록하고 D03을 COMPLETE 처리한다. 다음 가장 앞선 미완료 항목은 D04/P0 계약 기간·보장·냉각·우선협상 심화다.


## 챔피언별 저장 관측과 밴픽 연결 (2026-10-03)

- D03의 실제 관찰/저장/구단 격리 규칙을 챔피언 숙련 관측에도 적용한다.
  유료 조사와 AI 조사 작업은 공개 출전으로 신원이 확인된 챔피언만 조사한다.
  공식 경기 관찰은 관찰 당일 선수 ID로 확인된 출전 챔피언만 기록한다.
  숨은 풀 목록, 미출전 챔피언, 창단 dossier에서 숙련 수치를 생성하지 않는다.
- 기존 `aiScoutUncertainty`의 1–12 오차 모델과 구단별 hash 신호를 관측
  시점에만 사용한다. 구단·선수·챔피언·관찰 날짜·횟수에 따른 신호이며
  선수의 실제 숙련을 그대로 확정 공개하거나 출전 횟수를 숙련으로 바꾸지 않는다.
- 보고서의 `championObservations`는 관찰자/선수/챔피언, 날짜, 출처와 대회,
  공개 근거 기간/횟수, 추정치/불확실성/지식을 저장한다. 소비 경로는 숨은
  현재 숙련을 다시 읽지 않는다. 공개 횟수와 저장 추정을 UI에서 구분한다.
- 경과 365일당 오차 반경 +1.25, 신뢰 -8을 기존 D03 노후화율로 적용한다.
  중심값은 자동 갱신되지 않는다. 재관찰해야 새 숙련 변화가 보고서에 반영된다.
  범위는 20–99로 제한하며 오차가 0이 되지 않는다. 이는 가상 관측 모델이다.
- AI의 모구단·소유 2군은 같은 부서를 공유한다. 인간 보고서는 실제 관리
  구단 귀속이며 다른 구단/관리자에게 이월된 관측을 자동 공개하지 않는다.
  해고 상태에는 인간 보고서의 수치 접근을 허용하지 않는다.
- 이전 지식 숫자만 있는 보고서, 미래 날짜, 잘못된 관찰자/선수/챔피언,
  훼손된 수치/근거는 미관측으로 처리한다. 기존 저장 포맷은 유지하고
  optional 관측 필드를 보존한다. 기존 중첩 rollback이 조사 비용·스태프
  경험과 챔피언별 기록 객체까지 원자적으로 복구하는 것을 검증한다.
- acceptance는 실제 인간 유료 조사, AI 조사/늦은 결제 실패, 공식 편성 경기의
  종료 후 관찰, 독립 구단과 소유 2군, live pool getter trap, 저장/레거시/
  미래/손상, 노후화/재관찰과 선수·밴픽 UI를 포함한다. 완전 미관측은 기존
  넓은 범위/중립 점수를 유지한다. 관찰된 상대 밴픽 판단은 의도적으로 바뀐다.
