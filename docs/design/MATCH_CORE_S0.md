# 신규 단일 경기 코어 S0 — 사건·신원·복원 기반

소유: #233. 기존 #285 데이터/경계 설계를 잇는 실행 코드이며, 경기 물리·승패 및 운영 전환의 완료를 뜻하지 않는다.

`MatchCoreKernel`은 실제로 실행 가능한 경기 내부 시계·행동 소유자다. `scripts/artifact-modules.mjs`를 통해 현재 독립 HTML에도 조립한다. 기존 `simulateMatch`의 호출은 아직 전환하지 않는다. 새 코어가 물리·결과·세계 adapter 수용을 통과할 때까지 현재 게임을 유지하며, 두 엔진의 결과를 혼합하지 않는다.

## 현재 실행 계약

- 생성 입력: `matchId`, `seed`, 고정된 `patchSnapshot: {id, revision, sourceVersion}`, BLUE/RED 두 구단, 각 TOP/JGL/MID/ADC/SUP의 안정 선수ID·챔피언ID. 입력 순서를 정규화하고 필요한 신원만 복사한다. 외부 입력을 변경하거나 선수의 숨은 능력/의료를 읽지 않는다.
- `command(teamId, {id, type:'wait', actorId, durationMs})`: 구단 소유·단일 활동·정수 시각/오버플로를 검증한 뒤 명령과 완료 사건을 기록한다. 명령ID는 구단별이며 같은 요청의 재시도는 중복 효과를 만들지 않는다. 다른 내용의 같은 ID는 거절한다.
- `command(teamId, {id, type:'cancel', actorId, targetId})`: 현재 자기 활동만 취소한다. 세대 토큰이 지난 사건은 나중에 도착해도 새 활동에 영향을 주지 않는다.
- `advanceTo(elapsedMs)`: 세계 달력을 직접 변경하지 않는 경기 내부 경과 밀리초다. 미래 사건을 조기 적용하지 않고, 시각/접수 순번의 힙으로 처리하며 시간을 되돌리지 않는다. 기록은 실제 접수·취소·완료의 원본 투영이다.
- `random('decision'|'execution')`: 기존 공통 RNG를 서로 독립된 새 코어 스트림으로 사용한다. 별도 난수 알고리즘이나 승패 보정을 만들지 않는다.
- `observe(teamId)`: 공개 신원/패치/시각 및 자기 활동만 반환한다. 상대 활동·미래 큐·난수 상태·내부 명령 이력은 포함하지 않는다. trusted 저장 경로의 `snapshot()`과 AI 관측 경로를 혼용하지 않는다.
- `snapshot()` / `MatchCoreKernel.restore(jsonOrObject)`: v1의 단일 상태를 직렬화하고 복원한다. 객체 키 순서와 무관하며 신원·힙 순서·명령/활동·실제 기록·난수 상태를 검증한다. 알 수 없는 버전/필드와 가짜 결과는 거절한다. 복원 실패는 이미 실행 중인 인스턴스를 변경하지 않는다.

## 아직 없는 경계

`mechanicsStatus`는 항상 `NOT_IMPLEMENTED`, `result`는 항상 `null`이다. `wait`는 스케줄러 계약용 활동이며 훈련·경험치·회복·임의 경기 보상이 아니다. 이동/귀환·웨이브/캠프·QWER/피해·시야·상점/아이템·구조물/넥서스 및 원본 결과의 공식전·스크림·랭크·세계 저장 adapter는 후속 수직 구현이다. 미지원 명령을 확률적 결과로 대체하지 않는다.

현재 패치 입력은 신원/버전 메타데이터만 고정한다. 외부 수치 원본/효과 의미의 인증이나 실행 가능한 스킬 데이터를 수집했다는 뜻이 아니다. #285의 `sourceBytesVerified:false` / `executableMechanicsVerified:false` 경계를 유지한다. 후속 물리 기능은 검증한 해당 패치 자료만 소비하며 수치 공백을 발명하지 않는다.

## 검증

`node scripts/match-core-foundation-acceptance.mjs`: 제어된 10인 S0 입력에서 순서/키 순서 불변, 접수·취소·중복·오래된 사건, 접근 권한, 입력 getter 고정, 시간 경계, 관측 분리, 두 RNG 스트림의 재개, 손상/미래 snapshot 거절, 특수 ID 및 1,000개 활동을 검사한다. 이는 공식 경기·전체 시즌 또는 기존 세계 세이브 연동 검증이 아니다. 새 검사는 원래 정적 gate에도 추가하며 기존 모든 검사를 유지한다.

최종 HEAD의 집중/인접·기존 full/check·build·CI·모바일 및 결과 main/Pages 수용은 각각 실제 결과로 기록한다. 저장 이력/과거 확정 경기는 재계산하지 않는다.
