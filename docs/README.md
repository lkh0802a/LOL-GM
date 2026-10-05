# Documentation navigation

## Active entry points

| Purpose | Document |
| --- | --- |
| Current priorities, continuation and validation | [DEVELOPMENT](DEVELOPMENT.md) |
| Full game design | [LOL_GM_SPEC](LOL_GM_SPEC.md) |
| Settled decisions and later overrides | [DECISIONS](DECISIONS.md) |
| Source-backed depth gaps; dated evidence needs current-code review | [RETROACTIVE_DEPTH_AUDIT_1_11](RETROACTIVE_DEPTH_AUDIT_1_11.md) |
| Code ownership and build | [ARCHITECTURE](ARCHITECTURE.md), [artifact modules](../src/artifact/README.md) |
| Professional-only calibration and static champion sources | [CHAMPION_DATA](CHAMPION_DATA.md) |
| Item/rune baseline | [SYSTEM_DATA](SYSTEM_DATA.md) |
| CI interpretation | [CI_RESULTS](CI_RESULTS.md) |
| HTML first, Android later | [ANDROID_TARGET](ANDROID_TARGET.md) |

## Confirmed domain rules

[Player relationships/contracts](PLAYER_RELATION_CONTRACT_RULES.md),
[rosters/transfers/local status](ROSTER_TRANSFER_LOCAL_RULES.md),
[staff](STAFF_RULES.md), [international offices](INTERNATIONAL_OFFICE_RULES.md),
[governance/restructuring](GOVERNANCE_RESTRUCTURE_RULES.md).
Use current decisions and explicit user overrides if a dated rule conflicts.

## Historical and focused records

[Retained implementation evidence](archive/DEVELOPMENT_HISTORY_2026_10_03.md)
contains still-relevant delivery, decisions, failures and measurements.
Dated focused acceptance records live in archive/phase-records. Obsolete migration
handoffs, migration checklist and first-core planning documents are deleted;
duplicate old workflow/planning prose is removed from the history. Retain history
only where it explains current behavior, compatibility or a reproducible regression.
Do not treat historical next-work instructions as the active plan.

## Unified stage hierarchy

Use [numeric stages 1–13 and dotted work units](DEVELOPMENT.md#unified-numeric-roadmap) for current tasks. Phase records now live in archive/phase-records; current guidance remains here.

[8.1.1 넥서스 종료 결함의 원본·교정 비교](evidence/match-end-original-series.json)는 가상 엔진 재현 자료이며 프로 경기 보정 데이터가 아닙니다. 현재 상태·한계·후속은 DEVELOPMENT의 8.1.1을 따릅니다.

[전체 엔진 판정·검증 목록과 실제 구매 장부/시작 화면 후속](DEVELOPMENT.md#821-실제-구매-장부원자적-조합기록-연결--2026-10-04)은 현재 개발 가이드에 통합되어 있습니다. 등록/구현/검증/출시 상태를 구분합니다.

[영입·언어 복원·FM 참고·지역 후보·세부 아이디어 전체](DEVELOPMENT.md#recruitment-language-refinements)는 승인/조사/구현 상태와 실제 검증 조건을 함께 기록합니다.

[2026-10-04 전 영역 조사·소스 근거·구현 한계](DEVELOPMENT.md#whole-domain-audit-2026-10-04)는 모든 알려진 도메인의 coverage와 재현/미검증 상태를 구분합니다. 전체 함수 실행·전체 기능 완료 선언이 아닙니다.

[8.2.2 실제 구매 장소·귀환 경로 조사와 자료 제한](DEVELOPMENT.md#822-구매-장소귀환부활-경로의-재현-가능한-조사-경계--2026-10-04)은 재현 도구와 원본 증거를 연결합니다. 구매 위치 구현 완료가 아닙니다.

[8.3.2 실제 공격 장비 소비·현금 전투력 제거](DEVELOPMENT.md#832-실제-보유-공격-장비와-미사용-골드-소비-교정--2026-10-04)는 원본/교정 사건·실패·AP/AS/crit proxy 한계와 다음 경험치 단위를 연결합니다.

[8.4.1 남은 체력·유효 피해와 공식 기록](DEVELOPMENT.md#841-교전의-남은-체력유효-피해-보존--2026-10-04)은 실제 재현·공통 writer·복기/저장 및 웨이브 source 부족과 후속 경계를 구분합니다.

[8.6.1 실제 획득·참여·퀘스트와 당시 기록](DEVELOPMENT.md#861-실제-오브젝트-획득의-참여보상퀘스트-공통-경로--2026-10-04)은 두 바론 경로의 실제 재현·공통 작성자·복기/저장과 아직 미완료인 이동/보상 metadata를 연결합니다.

[8.4.2 실제 처치 지원 보상·중복 방지·당시 지급](DEVELOPMENT.md#842-처치-지원-보상의-대상중복당시-지급-연결--2026-10-04)은 실제 지급 재현과 합성 writer 반례, 반올림 정책 미완료·공식 설명/저장 및 다음 스탯 패치 단위를 구분합니다.

[8.6.2 실제 스틸 실행자와 참여·퀘스트·당시 기록](DEVELOPMENT.md#862-스틸-실행자참여퀘스트당시-기록의-일치--2026-10-04)은 자연 재현, 공통 작성자와 공식 복기/저장, 원본 보존 한계를 연결합니다. 전체 스틸/오브젝트 판정 완료가 아닙니다.

[8.6.3 구조물의 합법 대상·동률 시드 순서](DEVELOPMENT.md#863-구조물-전환의-합법-대상동률-난수-순서--2026-10-04)는 원본 재현·의도적 결과 변화·기존 보상/공식 기록·저장 및 남은 macro 참여자 선택을 연결합니다.

[8.6.4 끊기 실제 참여자·시드 순서와 당시 복기](DEVELOPMENT.md#864-macro-끊기-참여자-선택시드-순서당시-기록--2026-10-04)는 원본 순열/경기와 의도적 결과 변화·공식 저장/한계를 연결합니다.

[8.4.3 준비된 라운드 피해·잘못된 입력 경계](DEVELOPMENT.md#843-준비된-라운드-피해소유생존입력-경계--2026-10-04)는 원본 패킷·기존 라운드 정책·writer 교정·공식 복기/저장과 한계를 연결합니다.

[8.4.4 라인전 HP 비용의 자원 보존](DEVELOPMENT.md#844-라인전-hp-비용자원-보존당시-설명--2026-10-04)은 정상4경기/통제저체력 재현, nonlethal 정책 유지, 공식 설명/저장 및 한계를 연결합니다.

[8.4.5 전투 캐시 입력·측정된 재계산 감소](DEVELOPMENT.md#845-전투-캐시-실제-입력측정된-현금-재계산-제거--2026-10-04)는 실제 writer 감사·원본/교정 동일 결과·공식 저장과 남은 범위를 구분합니다.

[12.5.1 초기 영입의 관측 목록·상세·평가·협상·복귀](DEVELOPMENT.md#1251-최초-영입의-관측-후보-탐색상세기존-명령-연결--2026-10-05-utc-10-04)는 실제 명령/권한/저장 수용과 아직 미완료인 비교·언어·전면 UI를 구분합니다.

[12.5.2 초기 영입 같은 문맥 관측 비교·원자료·행동](DEVELOPMENT.md#1252-초기-영입의-같은-문맥-관측-비교원자료행동--2026-10-05-utc-10-04)은 임시3인 숫자 비교/관측 radar, 실제 source·권한/복귀 수용과 남은 전면 UI를 구분합니다.

[12.5.3 실제 초기 영입 전후·수동 계약 근거](evidence/initial-offer-impact.json)는 private projection과 실제 합의/현재 권한/저장 경계를 검증합니다. 전체 UI·언어·AnalysisRoom 완료는 DEVELOPMENT의 별도 수용 조건을 따릅니다.

[12.3.1 처음 화면·커리어 선택·저장 보존/복원](evidence/startup-career-flow.json)은 실제 세 작업·기존 writer와 오류 경계를 연결합니다. 전체 UI/언어/AnalysisRoom 완료가 아닙니다.

[12.3.2 현재 구단의 실제 일정·수동 협상 브리핑](evidence/club-operational-briefing.json)은 실제 소유·조회·명령·결과·저장 경계를 연결합니다. 전체 등록·재정·UI 완료를 뜻하지 않습니다.

- 12.3.3 소유 구단의 공식 등록·의료 가용·수동 선발과 실제 공식 소비: [수용 증거](evidence/club-registration-briefing.json), [원본 진단](evidence/club-registration-briefing-diagnostics.json), [실행 검사](../scripts/club-eligibility-acceptance.mjs). 전체 등록/의료/재정/UI 완료가 아니다.

- 12.3.4 현재 현금·의무·조건부 예상과 실제 수동 후원/결산: [수용](evidence/club-finance-briefing.json), [원본 진단](evidence/club-finance-briefing-diagnostics.json). 전체 UI·재정·언어 완료가 아니다.

- 12.3.5 관측 직원·수동 고용과 공식 현장 지원: [수용](evidence/club-staff-briefing.json), [원본 진단](evidence/club-staff-briefing-diagnostics.json). 전체 직원/UI/언어 완료가 아니다.

- 12.3.6 현재 소유 의료 가용·수동 휴식/재활·저장 이력과 실제 일일·훈련·스크림·공식 소비: [수용](evidence/club-medical-briefing.json), [원본 진단](evidence/club-medical-briefing-diagnostics.json). 전체 의료/UI/언어 완료가 아니다.
