# LOL-GM 분야별 문서 길잡이 — 비규범적 구현 안내

**게임 제작의 첫 문서는 [구현 진입점](GAME_IMPLEMENTATION_ENTRYPOINT.md)**이며, 세계의 모든 권한·행위·계산·기록 판정은 [세계관 정본](rulebook/README.md)에 따른다. 이 안내서는 법률이나 게임 내부 시행 규정이 아니다.

| 개발 대상 | 세계관 정본 | 반드시 함께 확인할 관계 |
|---|---|---|
| 세계 날짜·기간·역사 | [CORE](rulebook/00-CORE.md), [CAL](rulebook/20-CALENDAR.md) | 규정 버전·사건 시점·소급 금지 |
| 구단 대회·승강·시드 | [COMP](rulebook/10-COMPETITIONS.md) | CAL, GOV, 선수·구단 참가 자격 |
| 국가대표·복수팀 | [NAT](rulebook/15-NATIONAL-TEAMS.md) | 국가협회, 국제사무국, 선수 의사, 구단 계약, 시장 |
| 계약·이적·대회 등록 | [TRANS](rulebook/30-TRANSFERS.md) | CAL, PLAYER, BIZ, NAT |
| 선수 성장·랭크·스카우팅 | [PLAYER](rulebook/40-PLAYERS.md) | MATCH, CORE, 의료·휴식·실제 정보 |
| 실제 경기·밴픽·스크림 | [MATCH](rulebook/50-MATCH.md) | COMP, CAL, PLAYER, 전지훈련·패치 |
| 구단 재정·계약 지급·후원 | [BIZ](rulebook/60-BUSINESS.md) | TRANS, COMP, 계약과 실제 원장 |
| 사무국·이사회·재심 | [GOV](rulebook/70-GOVERNANCE.md) | CORE, COMP, 내부 규정의 제정·시행 |
| 화면·조작·저장 | [UI·UX 요구사항](interface-spec/USER_EXPERIENCE_REQUIREMENTS.md) | 법령을 바꾸지 않고 정보와 감독 권한을 표현 |
| 제품 회귀·장기 검증 | [엔진·제품 수용 명세](implementation-spec/WORLD_ENGINE_AND_PRODUCT_ACCEPTANCE.md) | 세계 단일 결과·정보·계약·경제 일관성 |

## 구현 규약

- 조문의 고유 ID(`CORE-001`, `COMP-001`, `NAT-001` 등)는 독립적인 분야의 적용 조건을 찾는 식별자이다. 단일 세계 사건에 여러 분야의 규칙이 적용될 수 있다.
- 어떤 조문이 다른 분야의 규칙을 참조하면 같은 의무를 복제하지 말고 해당 조문의 유효한 버전·적용 범위를 조회한다.
- 외부 헌장이 내부 기관에 제정권을 부여한 것과 실제 해당 세계에서 규정이 시행된 것은 다른 사실이다. 제안만 있는 규정을 확정 상태로 만들지 않는다.
- 엔진은 실제로 관측한 정보만 AI의 의사결정에 제공하고, 행위의 유효성과 실질 결과는 헌장·내부 규정·계약·원장·시간에 따라 판정한다.
- 문서에 특정 활동의 이름이 없어도 그 명칭만으로 자동 금지·허용하지 않는다. 새로운 활동은 [단일 판정 절차](GAME_IMPLEMENTATION_ENTRYPOINT.md)에 따라 실질을 검증한다.
- UI/개발 명세는 정본의 하위 법규가 아니라 별도의 제품 요구사항이다. 모든 제품 기능은 세계관의 적법한 권리·의무·금지 및 단일 원장을 보존해야 한다.

정본 변경은 기존 법률과 구체적 내부 시행 규정의 적용 범위·효력 시점·기존 기록 보호를 함께 점검하고, [규정 변경 이력](rulebook/CHANGELOG.md)에 별도 기록한다. 이력 문서는 법률 본문이 아니다.
