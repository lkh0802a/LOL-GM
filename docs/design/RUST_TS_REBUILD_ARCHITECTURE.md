# LOL-GM: Rust 엔진 + TypeScript UI 병행 재구축 아키텍처

> 상태: 2026-11-06 사용자 승인 방향의 **설계안**. 이 파일 자체는 구현/병합/테스트 완료 증거가 아니다.
> 범위: 기존 JavaScript 게임을 보존하면서 새 구현을 만드는 주요 아키텍처 결정.
> 연결: [재구축 실행·검증 계획](RUST_TS_REBUILD_EXECUTION.md), [현재 아키텍처](../ARCHITECTURE.md), [실제 실행 지도 #242](https://github.com/lkh0802a/LOL-GM/issues/242), [정본 작업 #331](https://github.com/lkh0802a/LOL-GM/issues/331).

## 0. 결정 및 비목표

1. **병행 재구축(Parallel Rewrite)**. 기존 기능을 고쳐 쓰면서 한 번에 언어를 치환하지 않는다. 새 코드는 독립 경로에만 만든다. 기존 배포·개발 진입점과 레거시 테스트는 전환 승인 때까지 유지한다.
2. **Rust가 게임 사실의 유일한 소유자**다. 월드 시간, 공식 경기/스크림 결과, 밴픽 적법성, 계약·재정·이적 실행, AI 결정, 성장/의료, 대회·기록 및 시뮬레이션 난수 상태를 소유한다.
3. **TypeScript는 사용자 경험을 소유**한다. React + TypeScript + Vite를 신규 앱 기본 선택으로 정한다. UI는 출력용 view model을 받아 렌더링하고, 요청은 버전 있는 command protocol로 전달한다. UI store에는 게임 진실의 복제본을 두지 않는다.
4. **브라우저 로컬 실행**을 기본으로 한다. Rust 코어는 UI/DOM/브라우저 API에 의존하지 않는 native-testable 라이브러리이고, 브라우저에서는 WebAssembly로 구동한다. 서버 런타임·외부 API는 필수가 아니다.
5. **기존 save는 비파괴적으로 읽고 별도 공간에 신규 save로 변환**한다. 새 앱은 기존 `lol-gm-v15` 네임스페이스를 쓰거나 지우지 않는다.
6. **규정 정본 우선**. 레거시 JS 동작은 비교 기준이되 승인된 룰북을 대체하지 않는다. 과거의 부정확한 동작까지 강제적으로 복제하지 않는다.
7. **기존 릴리스 및 테스트 보존**. 기존 CI 및 코드에 손대지 않는 설계/스캐폴딩 PR부터 시작한다. 자동 병합·릴리스·게임 동작 전환은 금지한다.

비목표: 이 문서만으로 Rust 엔진의 구현이 완료됐다고 주장하는 것, 옛 경기 집계 엔진을 새로운 5v5 물리·시간 엔진으로 오인하는 것, 기존 데이터/검증 근거 없는 수치를 도입하는 것, 새로운 대규모 게임 기능을 재구축 범위에 섞는 것.

## 1. 확인된 기존 구현 (2026-11-06 main bf670926)

- 배포 경로: `scripts/build.mjs` → `scripts/build-ui-v2.mjs` → JS 엔진 `src/artifact/` + 활성 JS UI `src/ui-v2/` → 생성물 `index.html`, `dist/index.html`.
- 엔진 모듈 원본: `scripts/artifact-modules.mjs`의 `ENGINE_MODULES`. 이전 `src/artifact/ui-*.js` 계열은 현행 제품 화면이 아니지만 역사적 테스트/저장 브리지 참조가 남아 있다.
- 저장: 월드 스키마 `v15`, 인코딩 `saveFormat 2`(기존 v15 format-1/2 복원 지원), 저장 네임스페이스 `lol-gm-v15`, 기본 10슬롯; `src/artifact/save.js`, `save-migration.js`, `src/ui-v2/browser-storage.js` 및 native 저장 브리지가 실제 동작 기준.
- RNG: `src/artifact/random.js`의 명명된 시드 스트림과 현재 match/series/competition 기록을 검증 대상으로 확보한다.
- 게임의 승인 규칙은 현재 진행 중인 #331 규정 정본화 및 실제 최근 사용자 결정을 기준으로 결정한다. 브랜치나 미병합 PR의 본문은 최종 승인 근거가 아니다.

위 파일들은 **초기 기준선**이며 신규 Rust 코어로 복사해 쓰거나 현재 JS 제품을 즉시 교체하는 지시가 아니다.

## 2. 목표 의존성 및 디렉터리

~~~text
apps/web (React + TypeScript + Vite, responsive mobile-first)
  ├─ routes / features / presentation / accessibility
  ├─ application (command client + query cache + app-only state)
  ├─ workers/engine.worker.ts (ordered request queue)
  └─ storage (IndexedDB writer, import/export, crash recovery)
          │ typed, versioned protocol
          ▼
crates/lolgm-wasm (wasm-bindgen adapter; no game rules)
          │
          ▼
crates/lolgm-core (pure Rust domain + simulation)
  ├─ application (validated command/query dispatch)
  ├─ domain (world, match, draft, series, competition, market, ...)
  ├─ rules + content (source-pinned config)
  ├─ deterministic (RNG streams and stable event ordering)
  └─ persistence (versioned snapshot codec)
          ▲
packages/protocol (Rust-derived TS types; machine checked)
tests/parity (legacy fixtures, invariants, divergence register)
~~~

예정 경로:
- `crates/lolgm-core`: UI 독립 Rust domain/application; 로컬 native `cargo test`가 가능해야 한다.
- `crates/lolgm-wasm`: wasm-bindgen export와 byte/JSON 변환만 수행. 규칙과 상태 writer 없음.
- `apps/web`: TS UI, Worker, 저장소 어댑터, 오프라인 패키징.
- `packages/protocol`: Rust 타입에서 생성된 TS 계약, 버전 및 계약 검증.
- `tests/parity`: 기존 JS와 새 Rust의 명시적 fixture/cross-engine 비교.
- 기존 `src/artifact`, `src/ui-v2`, `scripts`, `index.html`, `dist/index.html`: 레거시 기존 구현을 유지한다. 최종 패키지 경로는 우선 `dist/next` 등으로 **분리**한다.

의존성 방향: UI → protocol → application command/query → Rust core → immutable rules/config. Rust core는 화면, React, 라우터, 브라우저 저장 API를 import하지 않는다.

## 3. 엔진 내부 책임 경계

| 책임 소유자 | 단일 사실·writer | 현재 JS 비교 원본(참조) |
|---|---|---|
| World/Calendar | 세계 날짜, 일별 확정 순서, 핫픽스 실효 시각, 시즌 진행 | `world.js`, `calendar.js`, `season.js`, `offseason.js` |
| Match/Draft/Series | 실제 5v5 경기 입력·상태·판정·이벤트, 합법 밴픽, Fearless, Bo시리즈·First Selection | `match-core-*.js`, `engine.js`, `draft.js`, `series.js` |
| Competition | 일정·참가자·시드·판정·순위·역사, 공식 결과 단일 출처 | `competition*.js`, `international-entry.js` |
| Club/Roster | 5명 경기 출전 구성, 소속·등록·자격·원자적 로스터 변경 | `roster.js`, `lineup.js`, `registration*.js` |
| Market/Contract/Finance | 계약 합의 vs 감독 최종 서명, 실제 시장/현금 원장/AI 거래의 단일 커밋 | `contract*.js`, `transfer*.js`, `finance.js`, `state-transaction.js` |
| Player/AI/Observation | 성장·의료·스카우팅·관계·스크림·관측 가능한 정보만 제공 | `player.js`, `development.js`, `medical.js`, `scouting*.js`, `scrim*.js` |
| Persistence | 세계 스키마·저장 코드·세이브 스냅샷·복원 검증 | `save.js`, `save-migration.js` |

각 도메인은 자기 invariant validator를 제공하고, 외부 수정은 `Engine::dispatch(command)`을 통과한다. `world advance`와 `match result commit`은 한 번만 기록되며, UI 변경·뒤로 가기·재렌더는 경기를 재시뮬레이션하지 않는다. 긴 연산은 명령 내 중간 상태와 완료 커밋을 명시적으로 구분한다. 도메인 이벤트(`MatchCompleted`, `ContractSigned`, `PatchActivated` 등)는 저장 기록의 원인과 후속 화면 갱신을 연결하지만, 전체 이벤트 소싱 도입은 필수가 아니다.

현행 5명 구성 관련 최근 결정은 최종 룰북과 비교해 **경기 출전 5인** 및 포지션·교체 적법성으로 모델링한다. 구단의 전체 보유 인원을 5명으로 강제할지는 별도의 승인된 로스터 규정으로 판단한다.

## 4. 데이터 계층과 엔진 불변식

- ID: Team/Player/Manager/League/Competition/Match/Season/Champion/Patch/Save의 영속 ID는 고정 식별자이며 표시명으로 join하지 않는다.
- Source data: 챔피언·아이템·룬 메커니즘은 패치 고정 원자료와 출처를 구분한다. 프로 경기 보정에는 승인된 조직 경기 기록만 사용한다. 데이터 미확보 구간을 임의의 확률·성능 값으로 채우지 않는다.
- 원장: 계약/이적/현금/등록 변경은 하나의 검증·실행 트랜잭션이다. 실패 시 부분 적용을 남기지 않고, 이중 청구/중복 소속/이중 경기 결과를 막는다.
- 정보: UI가 보는 값은 관리 주체와 시점에 허용된 공개·관측 정보로 투영한다. 상대의 숨은 기량, 의료 비공개, 미공개 스크림, 미래 결과를 정상 view로 반환하지 않는다. 오프라인 로컬 파일/메모리의 접근을 보안상 불가능하게 한다는 주장은 하지 않는다.
- 시계: 세계 날짜는 하나만 소유하고, 경기 내 시뮬레이션 시간은 별개 개념으로 둔다. 월드 시계는 같은 날짜의 공식경기·시장·패치 이벤트의 확정 순서를 관장한다.
- 숫자/난수: 돈은 명확한 최소 화폐 단위와 검증된 정수 처리, 규정 수치는 단위와 경계 체크를 명세한다. 경기 수치 계산은 정의된 반올림/정밀도 규칙을 기록한다. seed·스트림 식별자·소비 상태를 재현 가능하게 저장한다. platform RNG/시간/해시 순서에 결과가 의존해서는 안 된다.
- 기록: 원시 공식 경기 기록이 단일 원본, 순위/통계/화면은 검증 가능한 파생값이다. 당시 패치/밴픽/공식 판정/선수 참여의 역사적 identity를 보존한다.

## 5. TypeScript ↔ Rust 프로토콜 v1

게임 상태의 전체 mutable 객체를 React store에 복제하지 않는다. Worker 안에서 단일 Rust `EngineSession`을 소유하고, TS는 명령·조회·save export만 수행한다. 최초에는 JSON 메시지 + `Uint8Array` 저장 스냅샷을 사용하며, 직렬화 병목이 실측될 때만 바이너리 프로토콜로 바꾼다.

~~~ts
type EngineRequest =
  | { protocolVersion: 1; requestId: string; op: "newGame"; config: NewGameConfig }
  | { protocolVersion: 1; requestId: string; op: "importSave"; bytes: Uint8Array }
  | { protocolVersion: 1; requestId: string; op: "dispatch"; expectedRevision: number; command: GameCommand }
  | { protocolVersion: 1; requestId: string; op: "query"; query: GameQuery }
  | { protocolVersion: 1; requestId: string; op: "exportSave" };

type EngineReply =
  | { requestId: string; ok: true; revision: number; data: unknown; events?: DomainEvent[] }
  | { requestId: string; ok: false; revision: number | null; error: EngineError };

type EngineError = {
  code: "INVALID_COMMAND" | "STALE_REVISION" | "INVALID_SAVE" |
        "UNSUPPORTED_VERSION" | "NOT_AUTHORIZED" | "ENGINE_FAILURE";
  safeMessage: string;
};
~~~

필수 계약:
1. Rust command는 명시적 액터/게임/세션 맥락을 검증한다. `expectedRevision`이 다르면 처리하지 않고 현재 revision을 응답한다.
2. 모든 변경 명령은 FIFO 단일 writer를 거친다. 요청 재시도 시 `requestId`/명령 식별자와 실제 재적용 여부를 판별한다(같은 명령 중복 커밋 금지).
3. 완료 응답은 실제로 커밋된 revision·도메인 이벤트·변경 조회키를 제공한다. 읽기 전용 query는 revision을 바꾸지 않는다.
4. TS view model은 public/managed/scouting-bounded 조회로만 생성하며, 내부 Rust 상태·원시 hidden truth를 일반 UI 응답에 직접 넣지 않는다.
5. 공개 protocol 타입은 **Rust에서 단방향 생성**(예: `ts-rs` + `serde` 기반)하고 CI에서 생성물 drift, 역직렬화, 에러 계약, 미지 필드를 검증한다. UI가 중복 수작업 모델을 영구 소유하지 않는다.
6. worker crash/reload 때 마지막 **내구성 확인된 스냅샷**으로만 복원한다. worker 프로세스가 죽었다는 이유로 UI가 게임 결과를 조작하지 않는다.

## 6. 저장·마이그레이션 설계

기존 저장을 **절대로 제자리 변환하지 않는다**.

- Legacy reader: 검증된 JS `packDB/unpackDB`, `save-migration.js`의 현행 v15 format 1/2 지원 범위를 fixture로 고정하고, 임시 읽기/변환 어댑터로 사용하거나 동등한 Rust 복원기를 작성해 cross-check한다. 지원하지 않는 옛 스키마는 임의 추정 복원하지 않는다.
- Import gate: 원본 슬롯/파일의 bytes·출처·checksum을 확인하고, 복원된 world에 대해 IDs, roster, money, match history, pending official, future rule pointers 등을 검증한다.
- New storage: 기존 `lol-gm-v15` 및 `lol-gm-ui-v2-world`와 구별되는 신규 IndexedDB DB/키 공간(예: `lol-gm-rs-v1`). 신규 저장 헤더는 `productVersion`, `schemaVersion`, `formatVersion`, `engineVersion`, `saveId`, `worldRevision`, `sourceLegacyChecksum`, `snapshotChecksum`, `savedAt`를 포함한다. 실제 값/이전 규칙은 코드화한 schema migration으로 관리한다.
- Import commit: 변환 결과는 **임시 신규 슬롯**에 기록하고 read-back + checksum + 엔진 복원 검증 후 새 슬롯을 활성화한다. 실패·중단 시 기존 저장 원본과 기존 활성 슬롯을 그대로 보존하고 실패 이유를 표시한다.
- Durability: 슬롯별 저장은 직렬화, snapshot 생성 시 revision 고정, IndexedDB transaction 성공 뒤에만 `saved` ACK를 표시한다. 메모리 커밋 성공과 내구 저장 성공은 별개의 상태다. 저장 실패를 성공으로 표시하지 않고, 파일 export/재시도 경로를 제공한다.
- Export: 외부 JSON/파일 내보내기는 안정적 format과 checksum 검증을 거친다. 새 저장에서 옛 JS 엔진으로 역변환하는 기능은 기본적으로 **미지원**이다. 원본 legacy 저장이 남는 것이 롤백 경로다.
- Slots: 기존 10슬롯 규모·수동 선택·덮어쓰기 보호·손상 복구 동작을 regression 기준으로 삼는다. 신규 슬롯 삭제/재사용 정책은 현재 #273과 승인된 UX 규정을 먼저 적용한다.

## 7. 실행·오프라인·Android 배포

- Browser: Rust → `wasm32-unknown-unknown` + `wasm-bindgen`; Web Worker에서 WASM 초기화 및 시뮬레이션. React 렌더 스레드는 경기·시즌 장기 실행으로 막지 않는다.
- Build: `cargo test`, wasm target build, TS type generation/typecheck, Vite build를 독립 실행. 빌드 버전과 content hash를 핀하고 외부 네트워크가 없는 환경에서 핵심 플레이를 지원한다.
- Offline: 초기 `dist/next` 번들에서 자산 캐시/앱 셸 오프라인 콜드 스타트를 검증한다. **현행 단일 `index.html`을 파일로 열어도 동작한다는 요구를 자동으로 포기하지 않는다.** WASM+Worker의 `file://` 제한을 먼저 실험하고, 필요 시 WASM 자산 내장형 단일 HTML을 별도 build target로 검증한다. 어려우면 승인 없이 다중 파일 패키지만을 동등 출시물로 선언하지 않는다.
- Android: 기존 `docs/ANDROID_TARGET.md`의 오프라인, 생명주기 중단/복원, 접근성/터치, 설치 및 실제 장치 수용 조건을 따른다. 서버 의존을 추가하지 않는다.

## 8. 세부 정책·기술 위험

| 위험 | 제어 및 검증 |
|---|---|
| 레거시 구현과 룰북 충돌 | 승인 규정 → 신규 Rust의 계약 테스트, 레거시와 차이는 deviation register에 사유·출처·테스트 기록 |
| JS/Rust 난수·부동소수점 차이 | 엄격 재현 가능 구간 vs 의도적 모델 변경 구간 분리; seed/스트림/수학 규약 고정 |
| 대형 world 직렬화 비용 | worker 내 world 유지, 조회 projection/페이지네이션, 변화분 캐시; 성능 계측 전 최적화 금지 |
| WASM 패키징/모바일 메모리 | 첫 수직 slice에서 실기기·오프라인·파일 열기 feasibility 확인 |
| 병행 작업의 중복 writer | 활성 레거시와 신규 앱은 서로 다른 세이브 네임스페이스; 실제 각각의 게임 인스턴스 내에서 단일 writer |
| 현재 #331 규정 정본과 충돌 | 기존 룰북 작업에 끼어들지 않으며 정본 확정 뒤 실제 조항/헤드 기준 재검증 |
| 외부 데이터 미확보 | `BLOCKED_SOURCE` 표기하고 mock 승률·경기 판정을 정식 구현으로 승격하지 않음 |
| 미병합 PR/오래된 지시 | 문서·브랜치·이슈 상태는 실행 시 재조회; PR의 존재는 구현 완료 아님 |

## 9. 설계 수용 기준

이 설계 PR은 문서만 수정한다. 실제 완료는 후속 작은 PR들의 정확 HEAD CI와 실행 증거로 확인한다. 필수 아키텍처 수용 조건은 다음과 같다.

- 레거시 build/CI 실행 경로가 그대로 보존되고 언제든 기본 게임으로 돌아갈 수 있다.
- Rust core를 native test로 호출 가능하고, Web Worker + TS UI가 **실제 Rust command**를 수행한다.
- Rust world, protocol, 저장 writer, TypeScript UI의 책임이 분리되어 중복 게임 시계/결과를 만들지 않는다.
- 기존 v15 저장 원본의 비파괴 import, 실패/중단 복구, 기록/계약/소유권 검사 성공.
- 기존 룰북과 코드 기준의 invariant와 신규 5v5 요구가 증거를 가진 테스트로 검증된다.
- 100시즌·시드 반복·모바일/Android·오프라인·무결성·접근성 검증 뒤에만 새 구현의 기본 실행 전환을 제안한다.

**권한:** 이 설계 승인은 구조의 목표를 정한 것이며, 기존 코어 폐기·기존 저장 파괴·자동 병합·최종 배포 권한까지 포함하지 않는다.
