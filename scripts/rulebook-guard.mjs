import {readFileSync} from 'node:fs';
import {dirname, resolve, posix} from 'node:path';
import {fileURLToPath} from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const CHAPTERS = Object.freeze([
  ['docs/rulebook/00-CORE.md','CORE'],
  ['docs/rulebook/10-COMPETITIONS.md','COMP'],
  ['docs/rulebook/15-NATIONAL-TEAMS.md','NAT'],
  ['docs/rulebook/20-CALENDAR.md','CAL'],
  ['docs/rulebook/30-TRANSFERS.md','TRANS'],
  ['docs/rulebook/40-PLAYERS.md','PLAYER'],
  ['docs/rulebook/50-MATCH.md','MATCH'],
  ['docs/rulebook/60-BUSINESS.md','BIZ'],
  ['docs/rulebook/70-GOVERNANCE.md','GOV'],
]);
export const EXTERNAL_REQUIREMENTS = Object.freeze([
  ['docs/interface-spec/USER_EXPERIENCE_REQUIREMENTS.md','UI'],
]);

export const DOCUMENTS = Object.freeze([
  ...CHAPTERS.map(([path])=>path),
  ...EXTERNAL_REQUIREMENTS.map(([path])=>path),
  'docs/rulebook/80-EXPERIENCE.md',
  'docs/rulebook-audit/CANON_2026_11_08_ADDENDUM.md',
  'docs/implementation-spec/WORLD_ENGINE_AND_PRODUCT_ACCEPTANCE.md',
  'docs/rulebook/README.md',
  'docs/rulebook/CHANGELOG.md',
  'docs/AI_RULEBOOK_GUIDE.md',
  'docs/RULEBOOK_MIGRATION_AUDIT.md',
  'docs/RULEBOOK_APPROVAL_ADJUDICATION_2026_11_01.md',
  'docs/rulebook-audit/CLAUSE_DECISION_MATRIX_2026_11_01.md',
  'docs/rulebook-audit/STEP1_APPROVAL_EFFECT_AUDIT_2026_11_01.md',
  'docs/rulebook-audit/STEP1_CHOICE_SOURCE_INVENTORY_2026_11_01.md',
  'docs/rulebook-audit/STEP1_CHOICE_SOURCE_INVENTORY_B_2026_11_01.md',
  'docs/rulebook-audit/STEP1_SUPERSESSION_CHAINS_2026_11_01.md',
  'docs/rulebook-audit/STEP1_CROSS_ISSUE_EFFECT_AUDIT_2026_11_01.md',
  'docs/rulebook-audit/STEP1_R01_R21_SOURCE_ADJUDICATION_2026_11_01.md',
  'docs/rulebook-audit/STEP1_CALENDAR_LICENSE_SUPERSESSION_2026_11_01.md',
  'docs/rulebook-audit/STEP1_QA72_NORMATIVE_BOUNDARY_2026_11_01.md',
  'docs/rulebook-audit/STEP1_SOURCE_COMPLETENESS_AND_DECISION_GATE_2026_11_01.md',
  'docs/rulebook-audit/STEP1_M01_M212_SOURCE_DETAIL_2026_11_01.md',
  'docs/rulebook-audit/STEP1_R_CHOICES_SOURCE_DETAIL_2026_11_01.md',
  'docs/rulebook-audit/STEP1_INITIAL_30_DECISION_DETAILS_2026_11_01.md',
  'docs/rulebook-audit/STEP1_ALL_ISSUE_POLICY_CLASSIFICATION_2026_11_01.md',
  'docs/rulebook-audit/STEP1_LEGACY_PR_NORMATIVE_BOUNDARY_2026_11_01.md',
  'docs/rulebook-audit/STEP1_42_CLAUSES_SOURCE_PRECISION_QUEUE_2026_11_01.md',
  'docs/rulebook-audit/STEP1_DIRECT_ISSUE_SOURCE_16_CLAUSES_2026_11_01.md',
  'docs/rulebook-audit/STEP1_PR_BODY_POLICY_SCREEN_2026_11_01.md',
  'docs/rulebook-audit/CROSS_DOCUMENT_CONFLICT_AUDIT_2026_11_01.md',
  'docs/RULEBOOK_SEMANTIC_AUDIT_2026_11_01.md',
  'AGENTS.md',
]);

// These are regression sentinels for the APPROVED DOCUMENTED policy, not a
// substitute for running the game's contract/calendar/match/finance tests.
export const POLICY_PINS = Object.freeze({
  'BIZ-005':[/복수 메인 스폰서를 일률적으로 한 개로 제한하지 않는다/,/실제 계약상 수령 가치와 이행을 현금 지급과 구분/,/현물 지원만으로 실재하지 않는 현금을 생성하지 않으며/,/유효한 독점 권리를 중복 판매하지 않는다/],
  'BIZ-008':[/실제 선수단 유지, 가용 현금과 확정 채무·만기를 함께 살핀다/,/약팀이라는 이유만으로 자동 현금 지원을 만들거나 AI의 무제한 차입을 허용하지 않는다/,/실제 재원·승인 권한이 있는 지원이나 차입까지 일률적으로 금지하는 뜻은 아니다/,/실제 경제 격차와 육성·분배·후원·시설 시장에 미치는 장기 결과는 실제 표본과 원장을 근거로 검토/,/경제력을 강제로 평준화하거나 경기 결과를 보정하지 않는다/,/제한된 기간의 실행만으로 장기 경제 검증이 완료되었다고 간주하지 않는다/],
  'UI-001':[/첫 영입 안내는 \*\*선택형\*\*/,/실제 자유계약 선수와 직원이 합법적으로 관측한 근거/,/직접 검색과 선수 비교/,/안내 이행이나 영입을 강제하지 않고/,/실재하지 않는 선수단이나 임의 계약을 만들지 않는다/,/중요한 사건과 오류를 중심/,/모든 미세 이벤트의 알림을 강제하지 않는다/,/최종 서명권은 감독에게 남는다/,/법적·계약상 응답 기한과 감독의 필수 의사결정 여부/,/중요한 의무를 분류 과정에서 누락하지 않고/],
  'UI-008':[/합법적으로 선택 가능한 자동 진행 정지 조건을 조정/,/실제 권한 담당자의 필수 결정을 건너뛰는 권한을 부여하지 않는다/],
  'UI-005':[/실제 계약 만료 전망·장기 선수단 계획·노화/,/합리적으로 입증된 미래 수요도 고려할 수 있으나/,/인위적인 수요를 만들지 않는다/,/매주 유망주 보고·특별 발견 알림·반복 수집 배지\*\*의 도입 결정은 철회되었다/,/후보 열람·무시 자체에는 비용이나 벌칙이 없으며/],
  'PLAYER-012':[/선수 능력 분포를 맞추기 위한 일괄 강등이나 근거 없는 난이도 보정을 적용하지 않는다/,/비공개 실제 능력·잠재력은 해당 정보를 적법하게 관측할 권한이 없는 주체에게 공개하지/],
  'CORE-009':[/새로운 세계 사건에는 그 사건의 발생 시점에 효력을 가진/,/개정 이전에 확정된 사건의 적법성은 당시 유효한 규범/,/과거 경기 결과·등록·계약·실제 현금·확정 채무를 소급 수정하지/,/기술적 변경만으로 당시 적용된 규정의 효력을 바꾸지 아니한다/],
  'CORE-010':[/중대한 선택은 당시의 적법한 결정권자/,/반복되는 운영·정산·일상 업무는 담당자와 세계 엔진이 자동 집행/,/법적 최종 서명·의료상 출전 부적격 판정·참가 자격 검증·선수 동의를 임의로 대체할 수 없다/,/실제로 발생한 활동·지급·비용·일정·계약 결과/,/사용자와 AI에 동일한 권한·제약·비용 원칙/,/BIZ-004/,/업무 시간·담당량과 휴식에 따른 과부하/,/기존 적성·경험의 일부와 실제 경력을 보존/,/스크림 일정을 추천할 수 있으나 관리 구단의 감독이 이를 결정한다/,/선수의 실제 전술 숙련과 합법적으로 소유한 자료를 전면 초기화하지 않으며/,/현 감독의 기존 수동 권한을 무단으로 무력화하지 않는다/],
  'BIZ-004':[/세계 공통 정산 통화 하나를 사용/,/국가별 환율·외환 변동 엔진을 신설하지 않는다/,/불확실한 예상 수입은 확정된 현금·지급·채무와 구분/,/에이전트 수수료는 실제 계약에 명시된 지급자·수령자·조건과 시각에 한하여 지급/,/원장에 한 번 기록/,/국제대회 이동비는 실제 이동 거리와 비용/,/주최자·사무국의 계약상 합법 지원을 구분한다/,/공식 캘린더 우선과 실제 재정 원장을 지키며/,/같은 비용이나 지원을 중복 지급하지 않는다/,/승인되지 않은 거리 요금·지원 비율을 만들지 않는다/,/실제 가용자금이 충분하고 유효한 지급 조건을 충족한 채무는 별도의 반복 조작 없이 기한 내 지급/,/AI의 임의 지연이나 시스템상의 지급 누락으로 연체를 생성하지 않는다/,/자금이 부족하여 이행할 수 없는 확정 의무는 미지급 채무로 기록/,/기존 유효 계약과 적용 규정에 명시된 경우에만/,/새 임의 연체료·강제 추심·반복 납부 조작을 신설하지 않는다/,/바이아웃 요건을 미지급 장부로 우회해서는 안 되며/,/자동 소급 취소하지 않는다/],
  'COMP-018':[/공식 지역·국제대회는 적법한 공식 사무국/,/직접 주관·운영한다/,/공식 대회로 편입·전환할 수 없다/,/공인 여부와 공식 개최 주체/,/공식 국제대회 출전권과 계수는 자동 발생하지 않는다/,/대표 공식 사무국 하나가 모든 최종 결정을 책임지고/,/공동 개최만으로 민간 개최사를 공식 주관자로 바꾸거나 독립 대회를 공식 캘린더에 편입할 수 없다/],
  'COMP-019':[/동률은 해당 대회의 경기 시작 전에 공표된 타이브레이크 규정/,/규정이 순위 결정전을 실제로 요구하는 경우에만/,/모든 동률에 별도 결정전을 일률적으로 강제하지 않으며/,/87C의 87B 최종 철회·정정/,/D-032 형식을 해당 시즌에 적용하는 경우/,/8\/9위 또는 16\/17위 진출 경계/,/두 팀이면 실제 승자승을 우선하고 맞대결이 없으면 BO1/,/일부 맞대결이 없거나 비교 후에도 경계가 동률/,/미해결 팀만 BO1 단일 라운드로빈/,/경계와 무관한 동률에 확대하지 않고/,/진출 경계를 영구 고정하지 않는다/],
  'COMP-020':[/일부 2군만 선택해 신규 발급할 수 없다/,/독립 구단 집단 역시 신규 보호권 발급에서/,/독립 구단 전원 보호 시 2군 전원도 보호되어야 하며/,/잔여 구단의 보호권을 일괄 박탈하는 규칙이 아니다/],
  'COMP-021':[/1군의 유효한 기준 보호 라이선스를 필요조건/,/모든 보호 라이선스 상실의 효력은 연간 경쟁 시즌 종료 이후에만 발생/,/2군 보호권이 자동 복원되지는 않으며/,/자동 강등·퇴출·경기 결과 소급 취소가 아니며/],
  'BIZ-015':[/공식 경기의 같이보기·동시 중계\(코스트리밍\)는 모든 시청자와 스트리머에게 자유롭게 허용/,/모든 실제 경기의 다시보기\(VOD\)는 영구 무료 공개/,/기존 유효한 광고·계약상 책임/,/영상 파일을 별도로 영구 보존하거나 실제 발생하지 않은 영상을 자동 생성해야 한다는 뜻이 아니며/],
  'GOV-010':[/구단별 현역 선수 대표 선출/,/에이전트 대리권/,/이적·은퇴·구단 해체/],
  'GOV-011':[/독립적인 행정 재심/,/사무국장 1인의 자의적 즉시 번복/,/불법 출전·무작위 규정 위반을 일부러 발생시키는 사후 징계·이의신청 게임 엔진 승인으로 확대하지 않는다/,/사전 검증/],
  'GOV-012':[/이해충돌이 있는 안건/,/공개하고 관련 심의·결정에서 회피/,/무작위 사건으로 발생시키는 게임 시스템을 허가하지 않는다/],
  'CORE-007':[/공식 대회 체계의 구조적 개편은 원칙적으로 차기 시즌부터/,/기존 독립 대회의 구조적 개편은 원칙적으로 차기 회차부터/,/신규 독립 대회는 당해 시즌에도 신설할 수 있으나/,/공식 일정 우선권/,/세계 공통 경기 금지 기간/,/소급 변경할 수 없으며/],
  'COMP-011':[/공식 대회 체계의 구조적 개편을 원칙적으로 차기 시즌부터/,/기존 독립 대회의 구조를 개편하는 경우에는 원칙적으로 차기 회차부터/,/새로운 독립 대회는 당해 시즌에도 적법하게 신설할 수 있다/,/공식 대회 우선권/,/세계 공통 경기 금지 기간의 검증을 통과해야 한다/,/소급 변경되지 않으며/],
  'COMP-003':[/신규 지역/,/2부/,/권고/],
  'CAL-001':[/12월 첫째 화요일 00:00 UTC/],
  'CAL-002':[/28일/,/종료 시각/],
  'CAL-003':[/공식 지역/,/공식 국제/,/독립 지역/,/독립 국제/,/금지/],
  'CAL-004':[/World/,/마지막 공식 경기/,/양 팀의 적법한 실격/,/우승자·경기·경기 시각을 만들어내지 않고 결승 단계의 종료\/판정 이력으로 피날레를 확인/,/COMP-006의 무우승 판정/],
  'TRANS-003':[/7일/,/14일/,/동의/,/TRANS-005/,/미보유/],
  'TRANS-005':[/라이선스 미보유/,/바이아웃/,/원소속|원팀/],
  'TRANS-011':[/공식 국제대회가 진행되는 기간을 우선적인 개장 시점으로 활용/,/국제대회마다 의무적으로 개설하거나/,/개장 여부, 횟수 및 시작·종료 시각을 사전에 공표/,/계약 선수 완전이적·임대 영입/,/원소속 구단의 동의 또는 합법적인 바이아웃/,/영입 지역의 개장만으로 원소속 구단의 계약상 권리/,/국제대회 참가 중인 선수도 적법한 이적 협상·체결/,/확정 명단을 소급 변경/,/CAL-001~003/,/TRANS-004/,/TRANS-005/],
  'PLAYER-002':[/5대5/,/1~5인/,/파티/],
  'PLAYER-003':[/직전 일반 매칭의 같은 팀원을 다시 만나는 것을 별도로 우대하거나 회피하지 않으며/,/직접 구성한 파티의 구성원은 유지/,/챔피언 선택 단계에서 매칭으로 배정된 역할은 별도로 교환하지 않지만/,/경기 중 적법한 라인 이동·전술은 금지하지 않는다/],
  'PLAYER-004':[/RP/,/세계 순위/,/같은 불균형을 이중 보정하지 않는다/,/같은 RP의 선수는 공동 세계 순위/,/솔로·부분 파티·5인 파티 비중과 역할·실제 경기 표본/,/비공개 MMR이나 미관측 개인 기량은 노출하지 않는다/,/시즌 시작 때 공개 RP는 소프트 리셋하고/,/내부 비공개 MMR은 일부 연속성을 가진다/],
  'PLAYER-005':[/닷지 기능을 도입하지 않는다/,/항복 선택이나 투표를 두지 않고/,/중단·탈주·불완전 경기 등은 기존 별도 처리 대상/],
  'PLAYER-006':[/1인 1계정|인물 한 명당 고유 랭크 계정 하나/,/닉네임 변경/,/실명/,/요구하지 않는다/],
  'BIZ-010':[/100% 소유/,/한 곳뿐/,/독립 경영/],
  'BIZ-011':[/육성/,/실제 예산/,/지급 비율·금액·분할식·자격·발효 시점·기금 조성은 미확정/,/중복 계산/,/무상 이적이나 첫 프로 계약에 존재하지 않는 이적료를 만들지 않으며/,/재이적 셀온은 실제 유효 계약의 기간·권리 범위·발효 및 종료 조건을 따르며 계약 없는 영구권을 만들지 않는다/,/검증 가능한 기여에 근거한 공개된 합법 규정으로 평가한다/,/미승인 금액·자격이나 배분식을 임의로 확정하지 않는다/,/임대 중 실제 육성은 당시 소유 구단과 임대 구단을 구별/,/실제 기여 이력과 이미 발생했거나 발생하지 않은 채권을 구분/,/실제 계약상 채권자와 적법한 권리 승계/,/모든 권리의 자동 소멸이나 이전·새 구단에 대한 자동 승계를 가정하지 않는다/,/같은 실질 소유자에게 같은 사유로 보상을 이중 지급하지 않는다/,/의미 없는 보유 기간만으로 자동 육성 보상을 만들지 않는다/,/서로 다른 실제 기여와 유효한 별도 권리까지 일률적으로 삭제하지 않는다/,/다른 리그의 실제 육성 기여도 공통 기준에 따른 이력으로 인정/,/리그 간 금전 이전은 승인된 관할·지급 의무·재원을 충족할 때만/,/확정된 채무와 대회 운영 의무를 우선 보호하며/,/이미 적법하게 발생한 육성 지원 채무를 임의로 소멸시키지 않는다/,/확정되지 않은 지원에 없는 돈을 지급하지 않는다/,/단순 추정은 확정 채권이나 지급된 현금이 아니다/,/선수·후원사의 구단 선택이나 브랜드 평가에 영향을 줄 수 있으나/,/유명해졌다는 사실만으로 자동 현금 보상을 만들지 않는다/,/유효한 계약상 채권이나 육성 지원 채무는 그 조건에 따라 유지한다/],
  'BIZ-012':[/프로\/세미프로\/아마추어/,/배타적/,/프로 라이선스/],
  'COMP-004':[/동일한 부/,/적격한 실제 하위 부/,/행정적으로 이동/,/매각 또는 해체/,/일반 자동 강등이 아니며/,/하위 부의 실재 여부·등록 자격·수용 정원/,/다른.*2부로의 임의 재배치/,/COMP-017/],
  'COMP-006':[/엘리미네이션 단계\/브래킷/,/대회 전체에서 2패를 초과할 수 없다는 뜻이 아니다/,/Grand Final Reset/,/양 팀 적법 실격/],
  'COMP-010':[/결승 이전 단계에서 양 팀이 적법하게 실격/,/실제 대진과 적격 차순위 근거/,/경기 자리를 승계하여 실제 경기/,/임의의 팀이나 동률 순서를 만들어 채우지 않는다/,/결승에서 양 팀이 실격하면/,/우승자 없이 종료한다/,/선수 출전 기록을 소급 변경하지 않으며/,/단측의 적법한 행정승/],
  'COMP-015':[/MSI 미진출팀/,/Masters/,/Open/,/중복 출전/],
  'BIZ-013':[/상위 5명/,/전체 선수단/,/미확정/],
  'BIZ-014':[/유한/,/복제/,/인수/,/확정 채무·실제 현금흐름·투자 수요·법적 배당 가능액/,/해당 결정권자의 권한/,/회계상 흑자만으로 사용할 현금을 만들어 내거나/,/구단주가 무제한 인출할 수 있다고 가정하지 않는다/,/독립 구단의 예산·원장과 BIZ-010의 독립 경영/],
  'MATCH-008':[/순수 밸런스 핫픽스/,/전 세계의 해당 일자 공식 대회 경기와 세트가 모두 종료된 이후/,/한 번만/,/패치 잠금/],
  'MATCH-011':[/주장/,/도입하지 않는다/],
  'COMP-014':[/공식 지역대회/,/독립 지역대회/,/참가/],
  'MATCH-002':[/Fearless Draft/,/해제/],
  'MATCH-003':[/First Selection/,/변경 대상이 아니다/,/실제 밴픽은 해당 시리즈·세트의 세계 시간/,/적법한 감독의 선택 전에 이를 자동 확정하거나 입력 지연만으로 실제 존재하지 않은 기권·기술 사고/],
  'MATCH-004':[/세트 사이/,/진행 중인 한 세트에서 선수 교체는 불허/,/각 공식 경기에서 최종 출전·등록의 적법성은 감독이 확인/,/대회가 해당 예외를 명시적으로 허용한 경우에만 의료 확인과 등록 심사/,/타 구단의 비공개 진단을 공개하거나 선수를 자동 생성해 무조건 등록하지 않는다/],
  'GOV-004':[/과반/,/지역 대표/],
  'UI-002':[/삭제/,/다른 슬롯/],
  'UI-007':[/완전한 재현에 필요한 근거가 부족한 경우/,/재현의 한계를 명시/,/저장된 공식 판정과 역사를 우선/,/기본적으로 간결한 요약을 제공하고 상세 보기는 선택/,/같은 실제 경기와 기록을 표시/,/두 번째 경기를 생성하지 않는다/,/다른 선택을 검토할 때는 당시 관측 가능한 장단점과 불확실성을 별도로 설명/,/가상의 대안에 대한 승패를 이미 확정된 공식 결과나 역사에 혼입하지 않는다/],
  'UI-009':[/게임 세계 밖의 개발·설계 메타 설명/,/오류/,/GitHub/],
  'UI-010':[/제출하지 않은/,/다시 검증/,/이미 제출된/,/확정된 지급/],
  'CAL-009':[/같은 공식 지역리그/,/겹치지 않도록/,/서로 다른 공식 리그/],
  'CAL-010':[/하루에 한 공식 시리즈만/,/타이브레이크/,/예외의 발생 근거·해당 팀·단계·시리즈를 기록/],
  'CAL-011':[/연쇄적으로 순연하거나 취소하지 않는다/,/같은 대회 안/],
  'TRANS-008':[/맞교환에는 추가 이적료·분할금·조건부 옵션/,/복합 거래 전체를 원자적으로 체결/,/일부 선수만 이적하거나 같은 지급을 중복 처리하지 않는다/,/선택적 매입권 또는 조건부 의무 매입/,/임대 시작만으로 자동 완전 이적시키지 않는다/,/실제 공식 세트 출전 수·비중과 계약상 정당한 부상·등록 제한 예외/,/명단 등록이나 랭크·스크림을 공식 세트 출전으로 간주하지 않는다/,/메디컬 조건이 있는 경우 선수 동의와 적법한 의료 접근권/,/다른 구단의 상세 의료 정보를 공개하지 않는다/,/실제 모구단과 산하 2군 사이의 선수 이동·출전/,/대회의 등록·마감, 이동 자격과 동시간 출전 제한/],
  'TRANS-009':[/대리권 변경이 발효되면 아직 합의·서명되지 않은 진행 중 제안은 만료/,/계약·확정 채무·소속과 역사는 대리인 변경으로 소급 파기하지 않는다/,/실제 존재하고 해당 당사자에게 적법하게 전달되었거나 공표된 범위/,/미공개 입찰이나 AI 구단 내부 계획을 공개하거나 허구의 경쟁 제안을 만들지 않는다/,/먼저 발견했다는 사실만으로 독점 계약 우선권을 자동 부여하지 않는다/,/선수 본인의 독립적인 목표·동의를 따르며/,/관측 순서만을 이유로 다른 구단의 적법한 제안을 차단하지 않는다/,/이미 유효하게 성립한 별도 계약상의 권리는 실제 계약과 적용 규정에 따라 판단한다/],
  'PLAYER-001':[/멘토링은 실제 활동·관계와 배움의 기회에 근거/,/멘토로 지정했다는 사실만으로 선수 능력을 즉시 높이지 않는다/],
  'PLAYER-007':[/스카우트는 서로 다른 독립 프로구단에 동시에 고용될 수 없다/,/모구단과 적법한 산하 2군·Academy의 조직 내부 공유는 허용/,/합법적인 이직이나 공개 자료 분석까지 금지하지 않는다/,/구단 소유 비공개 자료의 권한을 보존/,/표본이 적은 유망주의 능력·성장 평가는 \*\*미관측 또는 불확실\*\*/,/AI도 권한 없이 비공개 실제 능력·잠재력에 직접 접근하지 않으며/,/관측 부족은 능력 부족이나 자동 계약을 뜻하지 않는다/,/스카우팅 담당자의 가용 업무·시간·예산과 관측 권한 범위/,/실제로 수행하지 않은 즉시 조사 결과를 만들지 않는다/,/수집 배지는 복원하지 않는다/,/자료의 시점·출처와 소유·관측 범위를 근거로 연결/,/후속 실제 평가와 판단 수정 이력을 구분/,/다른 구단의 비공개 자료를 당시 판단 근거로 소급해 제시하지 않는다/,/실제 개인 사정에 따른 정당한 휴가/,/등록·대체 자격·일정을 함께 확인/,/실제 활동 지역·상황과 시설 용량/,/매일 숙소를 수동 배치하도록 강제하거나 방송·기술 장비 관리 업무를 다시 도입하지 않는다/,/코칭스태프 일부 공유는 실제 계약·업무시간·겸직 자격과 업무량/,/같은 활동의 선수 성장 효과를 이중으로 부여하지 않는다/,/실제 이용 시간이 충돌하면 1군이 우선/,/공식 경기 일정을 임의 변경하지 않고/],
  'GOV-008':[/기존 구단도 새 리그의 참가 자격·라이선스 심사를 다시 거쳐야/,/기존 참가권의 정당한 전환 책임/,/완료 경기·우승 역사를 자동 삭제하거나 소급 무효화하는 권한이 아니다/],
  'BIZ-001':[/구단 인수만으로 구단명·브랜드를 변경하거나 팬덤을 일률적으로 감소시키지 않는다/,/리브랜딩은 권리와 독립 경영을 존중하는 별도의 적법한 선택/],
  'BIZ-006':[/이전 구단의 초상·광고 이용은 유효한 기존 계약의 기간·매체·자료·권리 범위에서만 유지/,/새로운 광고 사용은 현재 적법한 권리자의 동의/,/무료 다시보기·동시 중계와 구분/],
  'BIZ-007':[/숨은 능력·잠재력이나 비공개 진료·보고서를 직접 읽지 않는다/,/실제 경기와 이후 공개 평판에 간접적으로 반영/,/실제 판매 권리, 장소·좌석·입장 규모와 운영 원가/,/팬덤 크기만으로 발생하지 않은 입장권 판매를 기록하지 않는다/,/기존·새 팬의 실제 접근성, 상업 노출 권리와 팬 반응을 구분/,/기존 구단 역사와 계약 원본을 보존/,/모든 개별 팬의 전수 시뮬레이션을 강제하지 않는다/,/실제 발언·행사와 당시 이력에 근거/,/근거 없는 무작위 스캔들이나 불필요한 수동 관리 패널을 만들지 않는다/],
  'COMP-016':[/승강 결정전/,/자동 승격·강등시키지 않는다/,/다음 시즌부터/],
  'COMP-017':[/2군은 공식 지역리그에서 승격하거나 승격 결정전에 참가할 수 없다/,/승격권/],
});

export function readDocuments(root=ROOT){
  return Object.fromEntries(DOCUMENTS.map(file=>[file,readFileSync(resolve(root,file),'utf8')]));
}

export function validateRulebook(docs){
  const errors=[],ids=new Map();
  const add=(code,message)=>errors.push(code+': '+message);
  for(const file of DOCUMENTS){
    if(typeof docs[file]!=='string'||!docs[file].trim())add('FILE_MISSING',file);
  }
  if(errors.length)return {errors,ruleCount:0,chapterCount:0};
  for(const [file,prefix] of [...CHAPTERS,...EXTERNAL_REQUIREMENTS]){
    const content=docs[file];
    const matches=[...content.matchAll(/^### ([A-Z]+)-([0-9]{3}) · ([^\n]+)$/gm)];
    if(!matches.length)add('NO_RULES',file);
    for(let i=0;i<matches.length;i++){
      const m=matches[i],id=m[1]+'-'+m[2],body=content.slice(m.index+m[0].length,matches[i+1]?.index??content.length);
      if(m[1]!==prefix)add('WRONG_CHAPTER',file+' '+id+' belongs in '+prefix);
      if(ids.has(id))add('DUPLICATE_ID',id+' '+ids.get(id).file+' '+file);
      if(!body.trim())add('EMPTY_RULE',id);
      ids.set(id,{file,body});
    }
  }
  // Editorial diagnostics only: obvious conversational expressions do not
  // belong in the current normative chapters. Historical evidence remains intact.
  const colloquial=/가짜|딱지|원팀|그해|그때|꾸며내|하드코딩|버프/;
  for(const [file] of CHAPTERS){
    if(/https:\/\/github\.com|2026-\d\d-\d\d 사용자 대화/.test(docs[file]))add('CANON_PROVENANCE',file+' contains editorial source text');
    const match=colloquial.exec(docs[file]);
    if(match)add('COLLOQUIAL_STYLE',file+' contains informal wording: '+match[0]);
  }
  for(const [id,checks] of Object.entries(POLICY_PINS)){
    const rule=ids.get(id);
    if(!rule){add('MISSING_PIN',id);continue;}
    for(const re of checks)if(!re.test(rule.body))add('BROKEN_PIN',id+' missing '+re.source);
  }
  // A list of tournament names and the word 금지 alone can coexist with an
  // explicit exception that contradicts the market-wide suspension.
  const marketRule=ids.get('CAL-003');
  if(marketRule && /독립 대회[^.\n]*(?:실제 경기|실경기)[^.\n]*(?:허용한다|허용할 수 있다|가능하다)/.test(marketRule.body)){
    add('CONFLICTING_MARKET_EXCEPTION','CAL-003 permits independent matches during the market');
  }
  // The non-normative adjudication matrix must reflect current clauses and
  // evidence depth. This verifies indexing, NOT whether a linked source
  // actually contains the user's final approval.
  const matrix=docs['docs/rulebook-audit/CLAUSE_DECISION_MATRIX_2026_11_01.md'];
  const matrixIds=new Set();
  const matrixStatusCounts=new Map();
  let matrixDirect=0;
  for(const line of matrix.split('\n')){
    const m=line.match(/^\| ([A-Z]+-\d{3}) \|/);
    if(!m)continue;
    const id=m[1];
    const cells=line.split('|').map(part=>part.trim());
    if(matrixIds.has(id))add('MATRIX_DUPLICATE',id);
    matrixIds.add(id);
    const rule=ids.get(id);
    if(!rule){add('MATRIX_ORPHAN',id);continue;}
    const evidence=cells[3];
    if(!/#\d+/.test(evidence||''))add('MATRIX_EVIDENCE_MISSING',id);
    const declared=cells[4];
    if(!['이슈·기타','댓글 직접 링크'].includes(declared))add('MATRIX_SOURCE_DEPTH',id+' invalid '+declared);
    if(declared==='댓글 직접 링크')matrixDirect++;
    const status=cells[5];
    if(!['관련 원문 부분대조','세부 판정 대기','**후속 대체 확인·교정 필요**'].includes(status)){
      add('MATRIX_STATUS',id+' '+status);
    }
    matrixStatusCounts.set(status,(matrixStatusCounts.get(status)||0)+1);
  }
  // Chapter headings are human-facing totals and must match the indexed rules.
  // The 2026-11-01 matrix is an immutable 113-item historical audit, not the
  // final canon count after 2026-11-08 amendments.
  for(const prefix of ['CORE','COMP','CAL','TRANS','PLAYER','MATCH','BIZ','GOV','UI']){
    const m=matrix.match(new RegExp('^### '+prefix+' — (\\d+)개 조항$', 'm'));
    const actual=[...matrixIds].filter(id=>id.startsWith(prefix+'-')).length;
    if(!m||Number(m[1])!==actual)add('MATRIX_CHAPTER_COUNT',prefix+' '+(m?.[1]??'missing')+' / '+actual);
  }
  const addendum=docs['docs/rulebook-audit/CANON_2026_11_08_ADDENDUM.md'];
  const newRuleIds=new Set();
  for(const line of addendum.split('\n')){
    const m=line.match(/^\| ([A-Z]+-\d{3}) \|/);
    if(!m)continue;
    if(newRuleIds.has(m[1]))add('ADDENDUM_DUPLICATE',m[1]);
    newRuleIds.add(m[1]);
  }
  for(const id of ids.keys())if(!matrixIds.has(id)&&!newRuleIds.has(id))add('SOURCE_AUDIT_MISSING',id);
  for(const id of newRuleIds){
    if(!ids.has(id))add('ADDENDUM_ORPHAN',id);
    if(matrixIds.has(id))add('ADDENDUM_LEGACY_COLLISION',id);
  }
  if(matrixIds.size+newRuleIds.size!==ids.size)add('SOURCE_AUDIT_COUNT','legacy '+matrixIds.size+' + approved addendum '+newRuleIds.size+' / rules '+ids.size);
  const summaries=[
    ['관련 원문 부분대조','관련 원문 부분대조'],
    ['세부 판정 대기','세부 판정 대기'],
    ['후속 대체 확인·교정 필요','**후속 대체 확인·교정 필요**'],
  ];
  for(const [label,status] of summaries){
    const line=matrix.split('\n').find(l=>l.startsWith('| '+label+' |'));
    const declared=line?Number(line.split('|')[2].trim()):NaN;
    if(!Number.isInteger(declared)||declared!==(matrixStatusCounts.get(status)||0)){
      add('MATRIX_SUMMARY',label+' '+declared+' / '+(matrixStatusCounts.get(status)||0));
    }
  }
  const depthLine=matrix.split('\n').find(l=>l.startsWith('| 직접 댓글 링크 포함 |'));
  const declaredDirect=depthLine?Number(depthLine.split('|')[2].trim()):NaN;
  if(declaredDirect!==matrixDirect)add('MATRIX_DEPTH_SUMMARY',declaredDirect+' / '+matrixDirect);

  // Existing AGENTS.md intentionally links many legacy documents outside
  // this limited rulebook fixture; only validate relative links authored here.
  for(const file of [...CHAPTERS.map(([path])=>path),...EXTERNAL_REQUIREMENTS.map(([path])=>path),'docs/rulebook/80-EXPERIENCE.md','docs/rulebook/README.md','docs/rulebook/CHANGELOG.md','docs/AI_RULEBOOK_GUIDE.md']){
    const content=docs[file];
    for(const match of content.matchAll(/\[[^\]\n]+\]\(([^)\s]+)(?:\s+[^)]*)?\)/g)){
      const target=match[1].split('#')[0];
      if(!target||/^(?:https?:\/\/|mailto:)/i.test(target))continue;
      if(target.startsWith('/')||target.startsWith('..'+posix.sep+'..'+posix.sep)){
        // One parent level (e.g. ../AI_RULEBOOK_GUIDE.md) is legitimate;
        // the normalized destination must remain in the repository.
      }
      const joined=posix.normalize(posix.join(posix.dirname(file),target));
      if(joined==='..'||joined.startsWith('../')||joined.startsWith('/'))add('LINK_ESCAPE',file+' -> '+target);
      else if(!(joined in docs))add('BROKEN_LOCAL_LINK',file+' -> '+joined);
    }
  }

  // Product and technical acceptance requirements are separate from world law.
  const product=docs['docs/implementation-spec/WORLD_ENGINE_AND_PRODUCT_ACCEPTANCE.md'];
  for(const required of ['구버전','마이그레이션','마지막 성공 스냅샷','슬롯 간 격리','현실 시간 카운트다운','스크림 예약·회의·보고 버튼을 강제하지 않는다','인수인계 기능','1·3·6·12개월','다지역·다시즌 표본','육성 구단 보상 보고','입력 차이가 있다는 사실만으로 다른 결과를 강제하거나 임의 현금을 생성하지 않는다','실제 재정 원장과 계약에 근거해']){
    if(!product.includes(required))add('PRODUCT_REQUIREMENT',required);
  }
  // Evidence is kept outside the standalone normative text.
  const sourceDepth = {
    directCommentLinked: matrixDirect,
    issueOnlyOrOther: ids.size-matrixDirect,
  };
  const agent=docs['AGENTS.md'];
  for(const required of ['## 규정집 필수 참조','docs/rulebook/README.md','docs/AI_RULEBOOK_GUIDE.md','npm run check:rulebook']){
    if(!agent.includes(required))add('CODEX_ENTRY',required);
  }
  if(!docs['docs/AI_RULEBOOK_GUIDE.md'].includes('비규범'))add('GUIDE_SCOPE','AI guide must not define new policy');
  // Version is a living publication marker, not a hard-coded initial release.
  const version=docs['docs/rulebook/README.md'].match(/\*\*규정집 발행본:\*\*\s*(v\d+\.\d+\.\d+)/)?.[1];
  if(!version)add('VERSION','rulebook README lacks a semantic publication version');
  else if(!docs['docs/rulebook/CHANGELOG.md'].includes(' '+version))add('CHANGELOG','no entry for the current rulebook version '+version);
  return {errors,ruleCount:ids.size,worldRuleCount:ids.size-[...ids.keys()].filter(id=>id.startsWith('UI-')).length,chapterCount:CHAPTERS.length,sourceDepth};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const result=validateRulebook(readDocuments());
  if(result.errors.length){
    for(const error of result.errors)console.error('rulebook: '+error);
    process.exitCode=1;
  }else{
    console.log('rulebook: PASS '+result.worldRuleCount+' world-law clauses / '+result.ruleCount+' world and UI contract IDs in '+result.chapterCount+' world chapters. Canon text is source-free; evidence indexed separately. Structural and policy pins verified (DOCUMENT CHECK ONLY).');
  }
}
