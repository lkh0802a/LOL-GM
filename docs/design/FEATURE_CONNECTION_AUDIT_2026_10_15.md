# 실제 기능 연결 조사 — 2026-10-15

단일 지침은 DEVELOPMENT.md다. 원래 단계1–13과 전체 해결/실패/승인을 이 문서로 대체하지 않는다. 이번 조사는 만든 파일을 완료 기능으로 세지 않기 위한 전수 정적 조사와 실제 수용의 구분이다.

## 현재 실제로 확인한 연결과 누락

| 분야 | 실제 경로와 현황 | 남은 수용/다음 연결 |
| --- | --- | --- |
| 공식 경기 | pendingOfficialSelectionSetup → 새 official.js → applyPendingOfficialSelection / pendingOfficialDraftSetup → 수동 밴픽 → resolvePendingOfficialMatch → 실제 넥서스/기록/저장. 현재 전체2게임과 원래 작성자의 전체 결과 동일성 수용 | PR230의 시간 응답·사건/자정·중계 교정은 별도 초안이며 이번 화면에 합쳤다고 하지 않음 |
| 신챔피언 외형 | maybeNewChampion → generatedChampionVisual → patch.js의 champion.visual 저장 → 새 champion-art.js → 밴픽 후보/선택 미리보기/진영 선택/피어리스 표시 | 시드 기반 벡터 초상이며 원화 생성기는 아님. 원화 생성/검수/ID별 자산 저장은 미구현. 실존 원본 이미지 서버403으로 실제 원화 표시는 미확인 |
| 피어리스 | 실제 draftCtx.fearless/used → 상단 잠금 표시, 기존 draftLegalChampions/draftValidateChoice가 재선택 차단 | 규칙이 없는 대회에 새 제한을 생성하지 않음. 현재 금지와 이전 세트 사용을 분리 |
| 첫 영입 | 검색/관심/관측·평가 → 기존 제안/합의 → 별도 수동 최종 계약 → 현재 선수단/재정/연락/저장. 산하 대상/상세 복귀 수용 | 출시 엔진은 즉시 응답. PR230 시간 응답·판매 구단/경쟁·모든 계약 경로의 새 화면 수용은 미완료 |
| 선발·전술·직원 | 기존 squad.preparation·직원 작성자와 새 management.js 연결. 미리보기/현재 권한/되돌리기 수용 | 후보 역할은 기존 기능. 전향 proposeRoleConversion/cancelRoleConversion을 소유 선수 상세/단일 수동 검토에 연결하고 독립 결과/취소/저장/권한을 집중 검증 중. 전체 선수단 작업 수용과 구분. 별도 인수인계 기능 추가는 제외 |
| 훈련·스크림 | 기존 runScheduledScrims/일일 소비 경로는 존재 | 새 화면의 숫자 배분/강도는 최신 디자인으로 거절된 부분. 일정 기반 편성·상대 검토/취소·실제 소비/의료 충돌을 연결해야 함. 엔진 존재로 새 화면 완료라 하지 않음 |
| 의료 | medicalCare/의료 일일 처리의 내부 호출은 유지 | 기존 현재 의료/회복 계획을 새 소유 선수 상세와 단일 수동 검토에 연결·집중 검증 중. 계획/실제 소비/공식 결장을 구분하며 전체 복귀/의료진 조언 수용은 별도. 직접 화면 참조 없음은 의료 엔진 미사용 증거가 아님 |
| 후원·개인 방송 | 기존 finance.js의 후원 계약·정산 경로와 별개로 src/domain/commercial-contracts.js 시험 초안 존재 | 초안은 조립에 빠짐. 구단/선수 독점 충돌·실제 활동 근거·연간 재정 연결 결함의 기존 증거를 유지. 강제 조립하지 않으며 권리/이행 작성자부터 교정 |
| 재정·시설 | 기존 경영진 자동 투자/공사·finance/development 소비 유지. 새 재정 시설 목록→상세에 공사·적용 단계·선지급/유지비·당시 결산·기존 효과 연결(13.18) | 후원 수동 선택·미수금/분할 지급·전체 재정 접근 미완료. 시설 감독 승인/공사 이용 제한은 기존 권한/규칙과 별도 추가 수용 필요 |
| 대회·경력·뉴스·분석 | 기존 대회/결과/경력 작성자는 보존. 새 대회 목록/선수단 인원 요약은 조회만 함 | 목록/표제만으로 실제 참가권·단계 진행·경력/뉴스/분석실/레이더 사용 흐름을 완료로 세지 않음 |
| 공통 표시·이름 | 새 v2Money는 내부 억 원을 유지한 표시8사례 확인. 기존 이름·ID 보존 | 모든 비율/기간/날짜·금액 화면 전수 통일 및 새 닉네임 포화 중복 교정은 미완료 |
| 대화창 사용 흐름 | 공식 밴픽을 native dialog로 분리. 배경 조작 차단·초점·닫기/명시 재개·검색/목록 위치 보존 | 모든 화면을 한 페이지/중첩 대화창으로 몰지 않음. 목록→상세→판단 작업별 창의 계약/직원 검토도 같은 창으로 연결하며 전체 목록/상세 재구축은 순차 수용 |

## 재현 방법과 정적 조사 경계

`node scripts/audit-feature-connections.mjs /tmp/LOL-GM-connections.json`으로 현재 엔진 전 파일의 해시/함수 선언과 새 화면·다른 엔진·검사 파일의 참조 목록을 다시 생성한다. JSON은 원본 코드 내용/게임 저장을 담지 않는다. 현재102파일/1082개 function 선언/새 화면 직접 참조72개다. 화살표·객체 함수·같은 파일 내부 호출·명령 등록/동적 호출은 별도 검토하며 참조 숫자는 실행 횟수나 완료율이 아니다. 새 화면9개는 조립 목록에 있고 기존 화면70개는 전면 재구축 결정으로 새 조립에서 제외한다. 후원 초안만 확인된 src/domain 조립 제외 후보이며 이 사실이 모든 미연결 기능이 하나라는 뜻은 아니다.

아래는 엔진102파일 전체를 빠짐없이 확인하기 위한 정적 색인이다. '직접 참조 함수'가0이어도 버려진 기능으로 단정하지 않는다. 실제 작성자→소비자→권한/저장→새 화면 수용을 순차 완결한다.

| 엔진 파일 | 함수 선언 | 새 화면 직접 참조 함수 | 다른 엔진 참조 함수 | 검사/증명 참조 함수 |
| --- | ---: | ---: | ---: | ---: |
| `src/artifact/champion-source.js` | 0 | 0 | 0 | 0 |
| `src/artifact/system-source.js` | 0 | 0 | 0 | 0 |
| `src/artifact/random.js` | 4 | 0 | 4 | 4 |
| `src/artifact/match-adjudication.js` | 3 | 0 | 3 | 1 |
| `src/artifact/combat-resources.js` | 4 | 0 | 2 | 3 |
| `src/artifact/objective-awards.js` | 3 | 0 | 2 | 2 |
| `src/artifact/takedown-rewards.js` | 3 | 0 | 2 | 2 |
| `src/artifact/macro-picks.js` | 4 | 0 | 4 | 3 |
| `src/artifact/engine.js` | 33 | 0 | 10 | 27 |
| `src/artifact/draft.js` | 29 | 8 | 13 | 20 |
| `src/artifact/systems.js` | 12 | 0 | 11 | 11 |
| `src/artifact/item-purchases.js` | 6 | 0 | 2 | 4 |
| `src/artifact/role-quests.js` | 6 | 0 | 5 | 3 |
| `src/artifact/role-quest-match.js` | 11 | 0 | 8 | 7 |
| `src/artifact/data.js` | 1 | 0 | 1 | 1 |
| `src/artifact/champion-data.js` | 11 | 2 | 7 | 8 |
| `src/artifact/system-data.js` | 11 | 0 | 6 | 5 |
| `src/artifact/champs2.js` | 1 | 0 | 1 | 0 |
| `src/artifact/content-naming.js` | 15 | 0 | 3 | 4 |
| `src/artifact/meta.js` | 18 | 0 | 11 | 15 |
| `src/artifact/meta-side.js` | 2 | 0 | 1 | 1 |
| `src/artifact/meta-composition.js` | 1 | 0 | 1 | 1 |
| `src/artifact/meta-draft-order.js` | 4 | 0 | 4 | 3 |
| `src/artifact/meta-tactics.js` | 4 | 0 | 3 | 2 |
| `src/artifact/meta-practice.js` | 6 | 0 | 5 | 4 |
| `src/artifact/meta-analyst.js` | 2 | 0 | 1 | 1 |
| `src/artifact/meta-opponent.js` | 3 | 0 | 2 | 1 |
| `src/artifact/meta-opponent-draft.js` | 1 | 0 | 0 | 1 |
| `src/artifact/patch.js` | 9 | 0 | 9 | 7 |
| `src/artifact/patch-balance.js` | 19 | 0 | 5 | 8 |
| `src/artifact/patch-content.js` | 9 | 0 | 4 | 4 |
| `src/artifact/first-selection.js` | 7 | 0 | 4 | 3 |
| `src/artifact/series.js` | 18 | 0 | 7 | 13 |
| `src/artifact/timezone-calendar.js` | 13 | 0 | 8 | 9 |
| `src/artifact/broadcast-calendar.js` | 5 | 1 | 3 | 1 |
| `src/artifact/competition.js` | 25 | 0 | 11 | 11 |
| `src/artifact/league-aggregation.js` | 4 | 0 | 3 | 4 |
| `src/artifact/player.js` | 31 | 0 | 21 | 19 |
| `src/artifact/development.js` | 23 | 2 | 17 | 17 |
| `src/artifact/player-relations.js` | 27 | 0 | 21 | 18 |
| `src/artifact/medical.js` | 21 | 0 | 11 | 16 |
| `src/artifact/world.js` | 29 | 7 | 21 | 22 |
| `src/artifact/calendar.js` | 7 | 0 | 3 | 6 |
| `src/artifact/season.js` | 32 | 8 | 15 | 27 |
| `src/artifact/offseason.js` | 4 | 0 | 0 | 3 |
| `src/artifact/save.js` | 8 | 2 | 2 | 8 |
| `src/artifact/save-migration.js` | 5 | 0 | 2 | 4 |
| `src/artifact/roster.js` | 35 | 2 | 27 | 25 |
| `src/artifact/lineup.js` | 9 | 0 | 8 | 7 |
| `src/artifact/state-transaction.js` | 6 | 2 | 5 | 5 |
| `src/artifact/state-rollback.js` | 7 | 0 | 4 | 5 |
| `src/artifact/squad-preparation.js` | 3 | 1 | 1 | 0 |
| `src/artifact/office.js` | 7 | 0 | 5 | 2 |
| `src/artifact/office-consultation.js` | 2 | 0 | 1 | 2 |
| `src/artifact/local-policy.js` | 4 | 0 | 2 | 2 |
| `src/artifact/office-international.js` | 4 | 0 | 1 | 4 |
| `src/artifact/club-ownership.js` | 2 | 0 | 2 | 2 |
| `src/artifact/club-license.js` | 4 | 0 | 3 | 1 |
| `src/artifact/region-continuity.js` | 2 | 0 | 2 | 2 |
| `src/artifact/finance.js` | 35 | 2 | 20 | 22 |
| `src/artifact/contract-market-pricing.js` | 8 | 1 | 6 | 6 |
| `src/artifact/contracts.js` | 32 | 1 | 24 | 16 |
| `src/artifact/contract-market-behavior.js` | 5 | 0 | 4 | 4 |
| `src/artifact/contract-transfer-market.js` | 4 | 0 | 4 | 2 |
| `src/artifact/scouting.js` | 32 | 4 | 15 | 23 |
| `src/artifact/scouting-ai.js` | 12 | 0 | 9 | 2 |
| `src/artifact/scouting-champions.js` | 4 | 0 | 2 | 1 |
| `src/artifact/scouting-ai-ops.js` | 10 | 0 | 3 | 3 |
| `src/artifact/scouting-ai-reassessment.js` | 2 | 0 | 2 | 0 |
| `src/artifact/contract-negotiation.js` | 20 | 3 | 7 | 13 |
| `src/artifact/transfer.js` | 21 | 3 | 7 | 15 |
| `src/artifact/contract-window.js` | 18 | 0 | 11 | 8 |
| `src/artifact/contract-contact-ai.js` | 4 | 0 | 3 | 2 |
| `src/artifact/contract-agreement.js` | 8 | 0 | 3 | 1 |
| `src/artifact/state-player-actions.js` | 15 | 0 | 6 | 9 |
| `src/artifact/player-representation.js` | 12 | 0 | 7 | 7 |
| `src/artifact/player-loans.js` | 15 | 0 | 8 | 4 |
| `src/artifact/transfer-payments.js` | 12 | 0 | 7 | 8 |
| `src/artifact/finance-estate.js` | 4 | 0 | 2 | 1 |
| `src/artifact/transfer-market-rules.js` | 2 | 0 | 2 | 0 |
| `src/artifact/loan-purchase.js` | 5 | 0 | 2 | 0 |
| `src/artifact/local-service.js` | 11 | 0 | 8 | 7 |
| `src/artifact/registration.js` | 14 | 0 | 9 | 5 |
| `src/artifact/registration-match.js` | 7 | 1 | 5 | 5 |
| `src/artifact/player-loan-market.js` | 3 | 0 | 2 | 2 |
| `src/artifact/club-closure.js` | 7 | 0 | 0 | 0 |
| `src/artifact/staff.js` | 38 | 4 | 25 | 26 |
| `src/artifact/staff-contracts.js` | 17 | 5 | 9 | 9 |
| `src/artifact/staff-registration.js` | 13 | 0 | 5 | 6 |
| `src/artifact/scrim-partner.js` | 6 | 0 | 3 | 4 |
| `src/artifact/scrim.js` | 6 | 0 | 3 | 4 |
| `src/artifact/scrim-plans.js` | 5 | 0 | 2 | 2 |
| `src/artifact/practice-resources.js` | 6 | 1 | 5 | 6 |
| `src/artifact/features.js` | 14 | 0 | 8 | 8 |
| `src/artifact/role-conversion.js` | 15 | 0 | 4 | 7 |
| `src/artifact/draft-analysis.js` | 7 | 0 | 4 | 6 |
| `src/artifact/draft-preparation.js` | 1 | 1 | 1 | 1 |
| `src/artifact/draft-history.js` | 3 | 0 | 2 | 1 |
| `src/artifact/match-history.js` | 5 | 1 | 1 | 4 |
| `src/artifact/analysis-tiers.js` | 5 | 0 | 0 | 4 |
| `src/artifact/career.js` | 37 | 7 | 6 | 17 |
| `src/artifact/negotiation-final.js` | 3 | 3 | 0 | 2 |
