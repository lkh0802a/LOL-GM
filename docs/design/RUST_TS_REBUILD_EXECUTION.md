# LOL-GM: Rust/TypeScript 재구축 실행·검증 계약

> 2026-11-06 설계. [아키텍처 결정](RUST_TS_REBUILD_ARCHITECTURE.md)의 실행 계획.
> 기존 코드/세이브/CI 보존이 선행 조건. 이 문서는 작업 지시 초안이지 이미 검증된 구현 기록이 아니다.

> **구현 상태:** [기반 PR #354](https://github.com/lkh0802a/LOL-GM/pull/354)는 별도 `rebuild/`에서 Svelte와 규칙 없는 Rust/WASM 호출·단일 HTML을 검증한다. 게임 명령·Worker·저장 이관과 실기기·`file://` 최초 실행을 완성한 것은 아니며, 아래 R1 전체 완료로 간주하지 않는다.

## 0. 실행 원칙 및 현재 업무와의 관계

이 계획은 언어 변경을 위한 **대체 구현 레인**을 명확히 한다. 현재 작업 지도 [#242](https://github.com/lkh0802a/LOL-GM/issues/242), 단일 규정 정본 [#331](https://github.com/lkh0802a/LOL-GM/issues/331) / [PR #328](https://github.com/lkh0802a/LOL-GM/pull/328), 기존 개발 코드/검증을 무시한 새 시작을 허용하지 않는다.

- Step 01 룰북 정본은 여전히 우선이며, 정본이 확정되기 전에 불확실한 신규 경기/시장 규칙을 Rust에 구현하지 않는다. 구조/도구/무규칙 harness는 독립적으로 설계·검증할 수 있다.
- #332 기존 경량화·증거 아카이브와 충돌 없이 실제 베이스라인과 테스트를 남긴다. 706MB의 기존 원문 증거·히스토리 파일을 편의로 삭제하지 않는다.
- 현재 진행 중인 Draft PR을 새 목표에 맞춘다는 이유로 일괄 병합/폐기하지 않는다. 각 PR의 실제 코드·CI·규정 의존을 검토해 레거시에 필요한 안전 패치와 새 엔진으로 이전할 계약을 구분한다.
- 같은 도메인의 **동시 구현 writer는 하나**다. Codex 단일 작업자가 한 번에 하나의 작은 슬라이스를 구현→검증→PR 제출한다. PR을 작성했다고 예약이 시작되거나 병합된 것은 아니다.
- 정본이 병합된 후 #242의 실행 단계는 새 언어 목표와 기존 미완료 기능을 함께 정렬해 갱신한다. 별도 중복 백로그를 양산하지 않는다.

## 1. 변경하지 않는 자산과 기준선

| 자산 | 기준 경로 | 보존 요구 |
|---|---|---|
| 레거시 엔진 | `src/artifact/`, `scripts/artifact-modules.mjs` | 직접 제거/대량 수정 금지; 현행 게임 플레이 가능 |
| 활성 레거시 UI | `src/ui-v2/`, `scripts/build-ui-v2.mjs` | 신규 UI는 `apps/web`에서 별도로 빌드 |
| 레거시 단일 HTML | `index.html`, `dist/index.html` 생성물 | 현재 기본 실행/배포 유지; 생성 HTML 직접 편집 금지 |
| 기존 세이브 | `save.js`, `save-migration.js`, `browser-storage.js` | 월드 v15, 포맷 1/2, 10슬롯, 원본 byte 보존 |
| 규정·출처 | `docs/DECISIONS.md`, #331 정본, `docs/CHAMPION_DATA.md` | 사용자 최신 승인 효력·Riot/공식 경기 출처 검증 |
| 회귀 및 CI | `scripts/*acceptance.mjs`, `npm run check`, GitHub Actions | 검사 감소·예상값 약화·증거 삭제 금지 |

**기준선 게이트:** 실행 착수 시 실제 main SHA, 기존 녹색 CI run, 현행 동작 build, seed fixture, 세이브 fixture, 경기 기록 fixture 및 열린 PR 상태를 manifest로 고정한다. 새 시작용 보존 태그는 실제 commit과 테스트 근거를 확인한 뒤 별도로 생성한다(문서만으로 생성됐다고 표기하지 않음).

## 2. 단계별 작업과 완료 게이트

### R0 — 레거시 수용 기준선 + 룰북 매핑

산출물:
- 사용자 승인·철회 실효 및 최신 정본의 조항 ID → 테스트/기존 코드 owner 매핑; unresolved·blocked 항목 분리.
- fixtures: 새 게임/구단 선택, 5인 공식 출전, 일자 진행, Fearless·First Selection, BO1/BO3/BO5, 정식 판정·과거 경기, 계약/이적/재정 원장, AI·스카우팅 정보 경계, v15 저장 포맷 1/2, 중단된 공식 경기, 10 슬롯.
- 기존 JS의 정확 SHA에서 실행 가능한 관측 결과를 기록. 통과한 항목과 단순 설계에만 있는 항목을 구분.

Gate: 기준 코드/테스트가 실제로 재실행 가능하고, 정본과 레거시 차이를 기록했으며, 원본 파일·증거 손실 없음.

### R1 — Rust workspace/TS UI/빌드 스캐폴딩

작은 독립 PR:
- `Cargo.toml` workspace, `crates/lolgm-core`, `crates/lolgm-wasm`, `apps/web` 및 `packages/protocol`의 최소 패키지 skeleton.
- Rust native test, `wasm32-unknown-unknown` 빌드, `wasm-bindgen` glue, Svelte/TypeScript 타입검사, 신규 번들 build, 별도 CI job.
- 모듈 경계 검사: core에서 browser/DOM/Svelte 의존 금지. 새로운 정적 출력은 `dist/next`로 분리.
- 상수 스텁이 아닌 최소 `newGame → query → dispatch(최소 테스트용 상태 전이) → export/import` 상태 왕복. 구현 전엔 게임 시뮬레이션 기능 완료로 표시 금지.

Gate: 레거시 빌드/CI 무변경 PASS; Rust native + wasm + TS 빌드/계약 왕복 실제 PASS; 워커에서 응답 취소/오류를 안전하게 처리.

### R2 — 프로토콜 및 저장의 첫 수직 slice

- Rust-generated TS 타입 + protocolVersion/expectedRevision; 단일 mutation queue, no double-commit, 오류 코드를 계약 테스트로 고정.
- IndexedDB 신규 namespace에 스냅샷을 저장·복원하고 worker crash 뒤 마지막 durable ACK 기준 복원.
- 레거시 v15 fixture를 **읽기 전용으로** 가져와 검증/신규 슬롯 staging 후 이관; 중단/손상/지원 밖 버전/브라우저 저장 실패를 실험.
- 초기 세이브 import의 모든 도메인 복원이 아직 불가능하면 전체 이관 지원을 주장하지 않고 지원되는 fixture 범위를 명시한다.

Gate: 기존 슬롯 바이트 해시 전후 동일, 오류 때 기존 슬롯 생존, 새 슬롯의 write/read-back/verify 및 export/import 성공.

### R3 — 실제 경기 수직 slice

**첫 유저 관측 통합 목표**: TS UI에서 경기 입력을 확정 → Rust가 경기/시리즈 상태를 전개 → 공식 결과/통계/일정에 단 한 번 커밋 → 새 앱 재시작 뒤 동일 결과와 역사 표시.

- Draft 상태 머신, 5인 출전과 선수/팀 권한, Fearless, side/First Selection, BO series, 경기 중단·재개를 분리해 계약 테스트.
- 기존 `match-core-*`는 구현 완료된 신형 5v5 엔진이라는 보장이 없다. 실제 위치·시간·경제·자원·교전·승패/기록은 #233 승인 요구와 신뢰 가능한 원자료 확인 뒤 구축.
- UI에서 결과/시계/현금/확률 값을 계산하거나 화면 전환 시 재경기를 실행하지 않는다.
- 필수 소스 누락은 `BLOCKED_SOURCE`로 기록하고 공식 결과를 임의 생성하지 않는다. 그동안 드래프트 적법성, 경기 상태 영속화, 컴포넌트 경계를 먼저 구현할 수 있다.

Gate: 승인된 경기 법칙에 대한 결정론·합법성·저장/재개·중복 명령 회귀 PASS. 실제 경기 엔진이 차단 상태이면 R3 완료로 선언하지 않음.

### R4 — 시즌/구단/시장/대회 도메인 이관

의존성 중심의 작은 PR로 진행:
1. 세계 생성·단일 시계·일자 진행·패치 시점/시즌 경계: #234.
2. 선수/구단 소속·등록·5인 출전 구성·AI 동일 제약: #321, #311, #324의 정본.
3. 계약·FA·이적·현금 원장·감독 최종 서명·시장 시계: #224 및 관련 현행 이슈.
4. 대회 운영·시드/토너먼트/공식 경기 승계·결승: #323.
5. 성장·의료·훈련·스크림·스카우팅·메타·장기 역사: #232, #235, #236, #238, #239 등의 정본.

Gate: 도메인별 command 실패 롤백, AI/사용자 동일 규칙, 정보 누출 방지, 시드 재현, 세이브 재시작/시즌 전환과 서로 다른 도메인 관통 수용 PASS. 구현되지 않은 도메인은 실제 명시된 unsupported 에러/비활성 UI로 다루고, 가짜 성공 처리를 하지 않는다.

### R5 — TypeScript UI 전면 이관

현재 활성 `src/ui-v2/app.js`의 실제 메뉴/흐름을 기준으로 작은 vertical slice로 이관한다.

| 현재 기능 영역 | 신규 TS feature 경계 | Rust 조회/명령 |
|---|---|---|
| 홈·받은편지함 | `home`, `inbox` | 상태 요약, 실제 domain event 투영 |
| 선수단·직원·훈련·스크림 | `squad`, `staff`, `practice` | roster/lineup/staff/practice 검증된 명령 |
| 이적시장·스카우트·협상 | `market`, `scouting`, `contracts` | 합법 관측 정보, 협상 상태, 최종 서명 |
| 일정·공식 경기 | `schedule`, `match` | pending official, draft, session resume |
| 대회·역사·분석 | `competition`, `history`, `analysis` | 커밋된 결과 원본 기반 투영 |
| 재정·설정·저장 | `finance`, `settings`, `save` | 원장 조회, 별도 영속성 adapter |

Gate: 모바일 세로 UX, 백/해시 이동·모달 접근성·포커스/키보드, 낡은 응답 취소, 중복 클릭 방지, 같은 명령의 동일 도메인 결과 및 실제 저장 성공 표시. 설정/브라우저 상태는 app-only로 보관.

### R6 — 오프라인/장기 커리어/전환 수용

- 레거시 대비 사용자 여정 전수 및 의도된 차이 승인. 기존 기능의 명백한 누락이 있으면 기본 제품 전환 불가.
- 100시즌 장기 커리어·복수 시드·시간/메모리/세이브 크기/모바일 스크롤 실측. 기존과 동일 하드웨어·조건에서 비교하고 실제 수치/회귀 한도를 기록해 승인; 임의 성능 개선 배수 약속 금지.
- 브라우저 online→offline 재시작, `file://` 독립 HTML 경로, 업데이트 중 저장 무결성, Android 실기기 중단/복원·오프라인/접근성/설치 테스트.
- 게임 식별자·시드/스트림·스키마/파일 migration·경기 역사/계약과 소유권 인접 테스트가 최종 HEAD에서 통과.
- 사용자 승인 전까지 default `npm run build` 및 기존 Pages/배포 엔트리를 신규 앱으로 바꾸지 않는다. 실배포/병합 자동화 비활성.

Gate: 사용자 검토 가능한 기능 대응표 + CI/장치 증거 + 리스크 목록 + 되돌리는 방법이 준비됐고, **기본 실행 버전 전환은 별도 사용자 승인**을 받은 경우에만 수행.

## 3. 동등성 테스트 구분

레거시/신규 엔진 비교는 한 가지 `same output` assertion으로 통일할 수 없다. 의도적인 새 5v5 모델은 기존 집계 엔진과 동일한 킬/시간/승패를 보장하지 않는다.

| 검증 종류 | 예시 | 판정 |
|---|---|---|
| 엄격 비교 | ID/원장/날짜/저장된 공식 결과/계약·등록 규정과 보정 불필요한 deterministic utilities | 입력·상태·명령 순서와 이전 정책이 동일한 fixture에 한해 동등 |
| 규칙·불변식 | 불법 밴픽 거절, 소속 중복 방지, 계약 승인≠최종 서명, 동일 경기 1회 커밋, AI 권한 제한 | 기존/신규 모두 승인된 규정 만족 |
| 통계·시뮬레이션 검증 | 신규 5v5 경기 시간·자원·교전/승률 분포 | 출처·방법·표본·오차·시드 공개, 사전 승인된 calibration/sanity gate |
| 차이 승인 | 레거시의 구형 규칙, 알려진 버그, 새 모델 변경 | `deviation register`에 규정/자료 출처, 변경 이유, 영향과 테스트 지정 |
| 제품 수용 | 화면 흐름·성능·모바일 접근성·세이브 복원 | 실제 유저 여정 + 측정 가능한 증거 |

권장 fixture 기록: `caseId`, `legacySha`, `rulesetRevision`, `seed`, `streamState`, `initialSnapshotChecksum`, `commands[]`, `expectedEvents[]`, `expectedInvariants[]`, `evidenceRefs[]`, `comparisonClass`. 채택/폐기된 fixture를 구분하고 현재 정본과 충돌한 과거 황금 결과를 새 정답으로 복제하지 않는다.

## 4. CI 계층 및 필수 거부 조건

- **Legacy lane:** 현재 `npm run build`, `npm run check` 및 실제 필요한 full CI는 기존 그대로 유지. 새 코드 추가가 이를 깨면 PR 실패.
- **Rust lane:** fmt/clippy/test, feature별 invariant/proptest(도입 후), wasm target, wasm smoke, release-size 체크.
- **Protocol lane:** Rust 타입 → TS generated diff, TS typecheck, malformed/stale/replayed request, hidden projection, serialization round trip.
- **Save lane:** v15 legacy import fixtures, 원본 해시 보존, 새 namespace 격리, slot switch/overwrite/crash/unsupported version/restore.
- **Integration lane:** 완전한 한 경기→결과·기록→재로드→다음 날, 계약·재정·대회 관통 흐름, 시드 반복.
- **Delivery lane:** `dist/next` 오프라인, 빌드 자산 무결성, 모바일/Android QA, 100시즌 long career(단계별 적절한 cadence).

실패 또는 테스트 **미실행**을 PASS로 쓰지 않는다. 모든 후속 PR에는 변경된 파일·최종 SHA, 관련 규정, 재현 케이스, 실행 명령/결과, 누락한 검증, 구형 저장/새 저장 영향, 인접 PR과 충돌을 기록한다. 정확한 HEAD로 검증하고 자동 병합하지 않는다.

## 5. 첫 구현 PR에 넘길 Codex 작업 카드

**목표:** 게임 규칙 포팅에 착수하기 전에 **비파괴 scaffolding + 최소 command round trip + 독립 빌드**를 만든다.

**착수 전 확인:** 현재 #242/#331의 최신 효력·병합/CI/동시 writer를 확인한다. 룰북과 충돌하지 않는 순수 인프라만 작업하고, 정본 충돌 또는 다른 Codex 작업 진행 시 병행 writer를 만들지 않는다. 사용자가 이미 승인한 이 문서의 구조 변경 외에 새 경제·대회 규칙을 만들어 넣지 않는다.

**변경 허용:** `crates/`, `apps/web/`, `packages/protocol/`, `tests/parity/`의 신규 파일 및 이 신규 경로에만 적용되는 build/CI 명령. 기존 `src/artifact/`·`src/ui-v2/`의 코드, 기존 `scripts/build.mjs`, `index.html`, `dist/index.html`, 레거시 저장 키는 변경 금지. 현행 CI와 충돌하는 기존 공용 설정 변경은 별도 근거/사람 검토가 필요하다.

**구현 슬라이스:** core가 안정된 session ID와 revision을 만들고 query가 세계 기본 상태를 반환하며 한 번의 합법 command로 revision이 증가한다. 동일 요청 재적용 거부 및 stale revision 에러를 명확히 검증한다. 새 TS UI는 이 결과를 실제 worker→wasm 통로로 화면에 표시한다. 이 스캐폴딩은 게임 핵심 기능 구현으로 표시하지 않는다.

**완료 증거:** 독립 Rust unit test, worker/wasm round trip smoke, TS build, 기존 npm build/check, 정확 HEAD CI; 새 `dist/next`에서만 실행되는 화면을 제공하고 기존 제품을 변경하지 않는다.

## 6. 검토가 필요한 후속 결정 (개발 차단 사항과 분리)

- 완전 독립 단일 HTML을 WASM/Worker와 함께 지원하는 실제 패키징 전략은 R1에서 측정해야 한다. 단일 HTML 요구를 삭제하는 결정은 여기서 하지 않는다.
- 신규 world schema의 구체적인 version number와 기존 `v15` 필드 변환 로직은 R2 fixture 조사 후 확정한다. v15 이름을 재사용해 호환성을 가장하지 않는다.
- 장기 성능 한도는 기준 기기와 실제 legacy benchmark 이후 정한다. 무근거한 밀리초/메모리 수치를 통과 기준으로 도입하지 않는다.
- 새 Rust 엔진은 모든 승인 규칙 구현 완료 전에는 운영 게임의 공식 대체물이 아니다.

**완료 조건의 최종 원칙:** 설계 승인 ≠ 코드 존재 ≠ 기능 완료 ≠ CI PASS ≠ 기본 배포 전환.
