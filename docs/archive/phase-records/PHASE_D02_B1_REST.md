> Documentation review 2026-10-03: [navigation](../../README.md), [active priorities and validation](../../DEVELOPMENT.md). Latest explicit user direction and later confirmed decisions supersede dated instructions; historical evidence is retained.

> Dated scope/acceptance record. For current priorities and validation sequencing,
> read [DEVELOPMENT.md](../../DEVELOPMENT.md). This record does not establish whole-game completion.

# D02-B1 — 선수별 휴식 및 재활 지시 (2026-09-29)

## 구현

- 관리 구단 및 산하 2군에서 선수 단위로 **자동 / 일반 훈련 / 훈련 감량 / 완전 휴식 / 재활**을 직접 선택하고 즉시 저장한다. 관리하지 않는 구단은 부상, 치료 잔여 기간, 피로·컨디션에 맞춰 매일 자체적으로 계획을 결정한다. 이적한 선수가 타 구단의 과거 관리 구단 지시를 그대로 따르지 않는다.
- **완전 휴식/재활**은 해당 선수의 당일 스크림 참여를 금지하며, 다른 등록 선수가 있으면 스크림 한정 최적 5인 라인업에 자동 대체한다. 대체할 인원이 없으면 팀 스크림을 생략한다. 공식 경기는 실제 의학적 결장 여부만 적용하고 감독의 휴식 설정만으로 강제 결장시키지 않는다.
- 휴식일은 피로·컨디션을 더 빠르게 회복하고 훈련 부하 및 과부하 누적을 줄인다. 재활은 회복 시설·전문 인력 효과와 별도로 치료 속도에 소폭 영향을 준다. 휴식/재활로 소모한 시즌 훈련일은 연말 성장량에 **최대 18%의 완만한 기회비용**을 적용하며 시즌 성장 처리 후 초기화한다. 휴식 중 경기 감각의 작은 감쇠도 적용한다.
- 수치들은 확립된 의료 통계가 아닌 게임 밸런스 가정이다. 기존 선수 **월드 스키마 v15/포맷2**와 호환되며, 과거 저장에 건강 지시나 휴식일 누적이 없어도 자동 계산한다.
- 강제 사건 중복, 경기/스크림 부하, AI·인간의 공통 치료 엔진, 기존 D02-A 로스터 보호와 저장 복원 규칙은 유지한다.

## 검증

`scripts/medical-acceptance.mjs`에서 감독 지시, 자동 재활, 휴식 중 공식전 출전 자격, 5인 스크림 차단, 일일 피로·컨디션 차등, 치료 속도 비교, 훈련일 누적·중복방지, 세이브 복원·과거 v15 로딩, 관리 구단 UI 컨트롤을 함께 검사한다. 전체 `npm run check`, 성능 검사, 빌드, CI가 필요한 변경이다.

## 다른 D02 작업과 후속 범위

긴급 아카데미 대체 등록은 별도 [PR #37](https://github.com/lkh0802a/LOL-GM/pull/37)에서 완료되었다. 적법한 5인 여력이 없는 구단은 기존 보수적 경증 처리 예외가 남아 있으며, 외부 단기 FA 영입까지 구현된 것으로 간주하지 않는다. 본 변경은 등록 처리를 중복하지 않고 개인 휴식·재활만 책임진다.

의료 기록의 계약·재계약 반영과 다중 시드/장기 연령·발생률 밸런스 실측은 여전히 후속 과제다.
