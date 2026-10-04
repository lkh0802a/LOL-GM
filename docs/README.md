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
