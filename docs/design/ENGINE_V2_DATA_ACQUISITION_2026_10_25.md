# LOL-GM 새 경기 코어 — 실제 LoL 규칙 데이터 파이프라인
> 2026-10-25. `main` SHA `3cea8c7081a2e148d9a505ec19acd056408a575e` 정적 소스 감사 기반. 관련 소유 #233 경기 / #240 최적화 / #232 가상 패치 / #236 5대5 통합 랭크 / #241 QA.
>
> 사용자는 프로젝트의 Riot LoL 관련 이용 허가를 확보했다고 밝힘. **허가를 받은 전제로 실제 챔피언·아이템·룬·게임 규칙을 사용하는 경기 코어를 설계**한다. 구체적인 라이선스/권리 허용 범위·재배포 조건은 이 문서에서 확인한 것으로 주장하지 않으며, 필요시 배포 단계에서 허가 범위에 맞춰 검증한다. 기존 LOL-GM 가상 세계·대회·계약·역사·세이브·UI는 보존하고 **경기 내부 규칙 코어만 점진적으로 교체**한다.

## 1. 실제 수집 범위와 데이터 출처

| 데이터 | 수집 1순위 | 누락 시 | 검증/소비 |
| --- | --- | --- | --- |
| 챔피언 173명 기본 스탯·레벨별 성장·자원·평타/공격 속도/사거리 | **버전 고정** Riot Data Dragon 원본 | 동일 버전 검증된 게임 자료/CommunityDragon을 출처와 함께 보충; 불명 항목은 `UNVERIFIED` | 체력·AD/AP/방어·마저·마나/기력·회복·레벨 성장 및 실제 피해 타입 |
| 각 P/Q/W/E/R 능력 | Riot 공식 설명·Data Dragon | 패치 고정 CommunityDragon 및 신뢰 가능한 공식 자료/검증된 클라이언트 데이터 | 스킬 레벨별 시전 시간·쿨다운·비용·적용 사거리·타격 형상·피해/계수/CC/보호막·회복·부가효과 |
| 스킬 고유 상태·변신/재시전·스택/소환체/투사체 | 검증된 동일 패치 세부 클라이언트 자료 및 리뷰 테스트 | 원문 텍스트/영상 검토와 수동 mechanics mapping; 출처 없이 숫자 생성 금지 | 원인 이벤트별 분기·시간·상태·타깃 합법성 |
| 아이템/조합·룬·소환사 주문·역할 퀘스트 | 버전 고정 Riot 아이템/룬/소환사 주문 데이터 + 당시 규칙 설명 | 검증된 동일 버전 보조 원본, 수동 명세 | 실제 구매 조건·보유/장착·액티브·쿨다운/중첩·개별 트리거·중복 금지 |
| 미니언/캠프/스마이트/오브젝트/포탑/시야/맵 규칙 | 해당 게임 버전의 공식 규칙·패치 노트/검증 자료 | 수동 규칙 정본 + 단위/상태 전이 테스트 | 웨이브·거리·공격·몬스터 HP/리젠·처치·보상·넥서스 종료 |
| 실제 프로 경기 통계 | 이용 조건 확인된 조직 경기 데이터 + 대회별 경기 원본 | 근거 부족 상태 `NO_EVIDENCE`; 솔로랭크로 대체 금지 | **현실 초기 엔진 정밀도 검증만**(킬, 골드, 시간, CS, 오브젝트, 역전 양상). 개별 Q 사용 위치 등 없는 이벤트 생성 금지 |
| 가상 세계 프로·랭크·스크림 결과 | LOL-GM 자체 **실행된 경기 이벤트 원장** | 기록 없으면 0건/미관측으로 유지 | 미래 가상 패치, 지역·팀 메타, 선수 성장. 랭크/프로/스크림 각각 출처 분리 |

**절대 혼용하지 말 것:** 현실 2026 현재 서버의 수치를 가상 2035년 패치에 덮어쓰지 않는다. 라이브 랭크/프로 경기 데이터는 실제 게임 규칙 검증 자료일 뿐, 세계 내부 시뮬레이션 경기를 '이미 플레이한 기록'으로 대체하지 않는다. 통합 랭크는 팀당 5명인 5대5이나 **고정 5인 파티 의무 없음**; 듀오/큐/매칭 상세는 기존 설계 `NEEDS_DECISION`을 준수.

## 2. 현재 파이프라인에서 실제 확인된 심각한 결함

- `src/artifact/champion-source.js` 내장 버전 `16.19.1`은 **173 챔피언 모두 `base.adg=0`**. `scripts/sync-champions.mjs`는 원본 `attackdamageperlevel`을 그대로 매핑하며 `scripts/validate-champion-snapshot.mjs`는 필드의 유한수 여부만 확인한다. `engine.js:34`가 이 값으로 레벨별 AD를 계산하므로 실제 성장량이 0으로 재현된다. 해당 필드만 **패치 동일·출처 증명 가능한 보조 자료**에서 수정하고, 원본 불변·보정 차이·근거를 기록할 것. 임의 클래스 평균으로 전체 채우지 않음.
- 내장 챔피언 원본의 P/Q/W/E/R은 한국어 이름/설명/쿨다운·비용·사거리 배열을 갖지만, **173명 모두 실제 스킬 `numeric` 보충 필드 없음**. `champion-data.js:40`은 쿨다운 배열의 **첫 레벨만** scalar로 쓰고, `draft.js:33–50`은 스킬들을 평균 파워/가동률/CC/사거리/유틸리티로 압축한다. `engine.js:49–63`의 한타는 Q/W/E/R 개별 시전 이벤트가 아니라 bounded 집계 보정이다.
- `engine.js:34–38`은 AP 아이템 합계를 계산해도 실제 스킬별 AP 계수×주문 피해를 수행하지 않는다. 스킬 레벨·남은 MP/기력·각 쿨다운/시전 시간, 투사체·히트박스·적중·재시전·패시브 상태 등은 별도 경기 코어가 필요하다.
- `engine.js:465–475`는 매분 보장 CS/XP·정글·교전/오브젝트를 순차 호출한다. 필드 골드 획득 즉시 구매, 귀환 즉시 완전 회복, 포지션=현재 라인, 사망 동수면 전력 기반 강제 교전 승리 등은 **데이터 보정만으로 고쳐지지 않음**.
- `docs/CHAMPION_DATA.md`의 source 우선순위와 정확 버전/검증 원칙은 유지. 이 문서는 **스킬 설명 수집 성공≠실제 효과 구현**이라는 차이를 분명히 한다.

## 3. 수집 파이프라인: 원본 → 검증된 규칙 → 실행 가능한 효과

**감사 도구 실행/검증 경계:** `node scripts/audit-champion-source.mjs`는 내장 원본을 읽기만 하며 현재 173명 AD 성장0, 692개 스킬의 구조화 numeric 부재, 사거리 sentinel 39개를 경고한다. `--strict`는 전체 누락뿐 아니라 **하나의 미지원 스킬/성장0/sentinel도** 실패로 보고한다. 패시브·QWER identity/배열·Riot key·provider/version/sourceCommit 메타데이터의 구조 오류는 기본 모드에서도 실패한다. `node scripts/audit-champion-source-acceptance.mjs` 및 기존 정적 게이트에서 부분 누락·중복 ID·malformed·기본/strict CLI·원문 바이트 불변 반례를 검사한다.

**numeric 객체 존재 ≠ 의미/실행 검증:** numeric coverage는 비어 있지 않은 객체의 존재만 센다. 도구는 `sourceBytesVerified:false`, `executableMechanicsVerified:false`를 명시하며 메타데이터 형식 통과만으로 외부 원본 취득/해시 일치·수치 단위/효과 provenance·스킬 실행 구현을 인증하지 않는다. 이 후속 검증은 아래 S1–S5가 소유한다. 합성 반례의 테스트 값은 제품 원본에 쓰지 않는다. 신규 코어 및 공식/스크림/랭크 adapter는 아직 미구현이다.

**S1 원본 획득:** 데이터 원본 URL·provider·게임 버전·locale·취득 시각·SHA-256·면허/재배포 조건·원본 schema 기록. `src/data/raw/{version}/{provider}/...`은 변경 불가능한 버전 자료. 승인되지 않은 무제한 최신 갱신·기존 플레이어 세이브의 원본 덮어쓰기 금지.

**로컬 원본 번들 대조 CLI:** `node scripts/verify-champion-source-bundle.mjs --manifest manifest.json --root raw-directory --version 16.19.1`. 읽기 전용이며 다운로드/네트워크 요청이나 제품 데이터 덮어쓰기를 하지 않는다. manifest v1은 `provider: "Riot Data Dragon"`, 정확한 `version`, `locale: "en_US" | "ko_KR"`, 비어 있지 않은 `files`를 가진다. 파일마다 `championId`, `path: "<championId>.json"`, 해당 버전/locale의 정확한 Riot URL, UTC `retrievedAt`, 소문자 SHA256 `sha256`, `bytes`, `rights: {reference, redistribution: "UNVERIFIED" | "REVIEWED"}`를 기록한다. 이 메타데이터는 취득·권리 주장의 기록일 뿐이다.

CLI는 호출자가 별도로 지정한 버전과 manifest/URL/실제 JSON 버전·챔피언 ID/Riot key를 대조하고 실제 파일 바이트 길이·SHA256을 검사한다. 중복/경로 이탈/루트 밖 심볼릭 링크·잘못된 UTF8/JSON·다른 버전/ID는 거절한다. 종료코드 0은 `INTEGRITY_CHECKED`, 개별 원본 읽기 실패/자료 거절은 1, 사용법/manifest·루트 접근 오류는 2다. **작성자가 해시와 URL을 함께 바꿀 수 있으므로 해시 일치는 원격 출처의 진위 증명이 아니다.** `remoteOriginVerified`, `rightsVerified`, `numericSemanticsVerified`, `executableMechanicsVerified`는 항상 false이며 별도 원본 취득/의미 검토가 필요하다. 이 도구는 스킬 수치를 채우거나 새 코어에 물리 데이터를 승인하는 경로가 아니다. 제어된 스키마/바이트 fixture의 PASS를 Riot 원본 취득 완료로 세지 않는다.

**S2 항목 대조/정규화:** stable champion/spell/item ID로 provider 간 합치고, (health, AD, armor, MR, resource, move speed, attack speed, growth)를 명시적 단위로 정규화. 각 스킬 단계는 `spellId, slot, ranks, cooldown[], cost[], castTime, effectiveRange, hitGeometry, damagePackets, ratios, effectGraph, status/CC, targeting, tags, provenance`를 분리. `25000` 같은 Data Dragon 사거리 sentinel을 실제 무한 공격 범위로 취급하지 않음.

**S3 의미 단위/출처 검수:** zero AD growth, 0/NaN/누락 계수, 스킬 레벨 배열 불일치, 피해량·스케일링 단위·평타/마법 피해 혼선, 잘못된 AP/AD 비율, 소모량/최대 자원 부조리, 2중 버프, 챔피언 예외 기제(무기 전환/탈것/빙의/다단 타격/소환체 등) 수동 검수 큐. 모르는 수치는 `UNVERIFIED`, 해당 effect는 개발 테스트에서 fail/quarantine — **조용히 generic을 Riot 원본 수치처럼 표시 금지**.

**S4 스킬별 실행 명세:** `onCast → projectile/hitcheck → damage/CC/buff/area/summon → onHit/onKill/onRecast/onExpire` 이벤트를 결정론적 작은 effect primitives로 컴파일. champion-specific mechanic은 필요한 곳만 독립 구현하고, 원본 effect primitive 재사용. 새로운 패치가 해당 스킬 수치를 변경할 경우 효과의 실제 사용/피해가 바뀌어야 함.

**S5 연동 테스트:** 동일 시드에서 Q 랭크/쿨다운/마나·거리·CC·방어/관통, 아이템 AP/AD/AS/crit/active, 이동·스마이트·포탑 피해를 1개씩 변경해 **실제 전투 사건**이 바뀌는가 확인. 스킬 설명/드래프트 파워만 변하고 전투 event가 변하지 않으면 FAIL. champion × ability 최소 정적 coverage와 보충자료 비율 표시.

## 4. 새 경기 코어의 경계

- **명령/관측:** 감독/AI가 실제 알 수 있는 정보 → 드래프트·전술/스킬/이동 목표. 숨은 적 실력·미관측 위치/미래 이벤트는 행동 선택에 공급하지 않음.
- **결정론적 사건 실행:** 시간 우선순위 큐, 위치는 필요 정확도를 만족하는 구역+경로/거리(필요 시 좌표+hitbox), actor 당 현재 한 위치·활동, 스킬/공격/피해/실드/CC/자원/사망·부활, 미니언·캠프·포탑·오브젝트는 **실체 있는 actor/HP·예약**으로 처리.
- **경제·경기 결과:** 실제 미니언/몬스터/킬·포탑 마지막 공격/도움 → gold/XP/아이템(shop 구역만)·레벨업 → 실제 넥서스 파괴만 match 종료. 교전은 중립/쌍방 후퇴/역전 가능.
- **세계 연결:** 단일 `simulateGame(GameSpec, PatchSnapshot, seed, outputMode)` API 형식의 **설계 제안**(실제 코드/API 확정 아님). 경기 종류 `official|scrim|ranked`는 **입력/밴픽·출전/스케줄·성장/관측·보존 정책**에만 영향을 주고 전투 물리 규칙을 갈라놓지 않는다. 결과 receipt는 matchId, patchSnapshotId, seed, 참석 10명, 객관 이벤트·스탯·넥서스 결과·정확한 시간·구별된 기록 원천을 지님.
- **롤 FM 세계 보존:** 구단/계약/경제/캘린더/대회/Fearless·유효 라인업/저장·모바일 신 UI를 어댑터로 유지. 기존 `simulateMatch`와 새 코어의 대조 실행→별도 검증→세계 전환이며 기존 경력 리플레이를 재시뮬레이션해 덮어쓰기 금지.

## 5. 정확성을 희생하지 않는 최적화

- **계산 한 번, 표현만 다르게:** 프로/스크림/랭크의 실제 게임 규칙은 동일. 상세 로그 `full`, 장기 기록 `compact`, 런타임 `quiet`의 **결과·RNG 의사결정·통계 불변**; `quiet`일 때도 실제 승패와 영수증을 계산해야 함. 동기적 또는 chunked 실행의 동일 결과 보장.
- **핫 경로:** data-driven primitive를 패치별 compile/cache하고, 게임 당 공유 불변 규칙+선수 최소 mutable state, event heap/캘린더 due queue, 국소 변경·증분 통계. 저장 때 게임 세계 전체 JSON 복사 금지. 패치 revision이 바뀌면 관련 캐시만 무효화.
- **규모:** 173 챔피언 × P/Q/W/E/R 효과 coverage(최대 865 entries) + 아이템/룬/오브젝트별 소유 테스트; 1/10/100 게임과 세계 일일·월간·20+/100시즌 다중시드, 엔진 1게임 CPU/메모리·배치/메타 분석·모바일 프레임/저장 크기 baseline 기록. **숫자 목표는 기기/현 성능 계측 후 확정**, 임의 숫자 못박지 않음.
- **데이터 용량:** 원본과 버전별 영구 스냅샷 분리, 매 경기 로그의 필요한 영구 사실만 기록, 지표는 event append시 증분 인덱스. 상세 리플레이 제공을 위해 실제 snapshot/seed/effect version이 없으면 재현 가능한 척하지 않음.

## 6. Codex 수직 구현 순서

1. **Data quality 게이트**: champion snapshot 전체 스캔/173×스킬 누락/AD growth 전원0 진단, 원본 보존+검증된 2차 자료 매핑 및 필드 provenance, 원본 validator 강화. **현행 스냅샷이 실패인 상태를 숨기지 않음**.
2. **Core API/event skeleton**: 패치 스냅샷 독립/seed·시간·location·actor·event receipt/게임종료. 새 모듈/adapter는 기존 공식전 경로를 이 단계에서 바꾸지 않음. 다중시드 baseline.
3. **레벨·스킬·자원 수직 컷**: 대표 챔피언 일반 스킬 1개를 실제 `cast→cost→cooldown→hit→damage/CC`로 구현, AP/AD/거리/방어 테스트. 이후 정상 특수형(충전·재시전·변신·소환)으로 source coverage 확대.
4. **월드 규칙**: 웨이브/캠프·시야/이동/귀환·아이템/룬·오브젝트/포탑·퀘스트·넥서스와 실제 전투 주체 연결.
5. **세계 adapter**: 기존 `simulateMatch` 드래프트·라인업·경력/시리즈·스크림 어댑터, 이후 문서 확정된 실제 ranked 참가/매칭 어댑터·랭크 활동 원장. 새로운 랜덤 기술 버그/방송/서버 사고 사건 생성 금지.
6. **실측/전환 게이트**: 원본 기존 경기·패치/선수·저장 테스트, 신규 정확성 테스트, 프로 분포 검증(원본 실제 획득 가능한 자료만), 모바일/standalone/CI·20+/100시즌. 코드/로그/세이브 메모리/성능 측정 없이는 `IMPLEMENTED_VERIFIED` 표시 불가. 전환 전 기존 코어 병렬 비교는 임시 검증 경로에 국한하고 실제 이중 시뮬레이션·결과 이중 적용 금지.

## 7. 반드시 피할 실수

- 외부 real LoL Q/W/E/R 설명을 텍스트로 가져왔다는 이유로 스킬 구현 완료 처리.
- 173명 전체 `adg=0`을 정상 성장치로 간주하거나, 소스 없이 임의 보간·과거 대회에 현재 live 값 소급.
- 신규 고정 슬롯/매칭 파티/감독 자동 결정 권한 임의 추가.
- 데이터 없는 현실 프로전/랭크 통계를 가상 세계에 실제 일어난 경기처럼 합성.
- 본문에 없는 `Riot 공식 수식`을 이름만 권위화해 입력.
- 새로운 무거운 3D 게임 클라이언트를 만들거나, 반대로 강팀 승률 주사위로 실제 게임 코어를 대체.
