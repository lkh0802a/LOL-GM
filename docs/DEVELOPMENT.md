# LOL GM — Development Guide

## Current direction and handoff

The canonical repository is lkh0802a/LOL-GM. Implement the full authorized game scope under the unified numeric development roadmap, then bounded verified UI/engine refinements. A
stage name, module count or old acceptance does not prove whole-roadmap completion.
No consolidated source-backed completion percentage is currently established.
Desktop/mobile offline standalone HTML comes first; Android packaging comes later.

Read [document navigation](README.md), [specification](LOL_GM_SPEC.md),
[decisions](DECISIONS.md), applicable confirmed rules, and the relevant source.
Latest explicit user instructions take precedence. Preserve the fictional league;
real esports informs credible behavior, not automatic replacement of its rules.

One implementation worker, no parallel agents. Each hourly run selects a coherent
45–55-minute implementation slice including focused acceptance and documentation.
State scope/estimate before edits. Combine related tasks, split larger features
at a natural vertical boundary, and record precise continuation. Merge/CI/HTML
publication are required follow-through, not the implementation slice itself.
Check branch/PR/current main and ownership before editing; do not assume local
files or another worker's unpushed changes exist in Cloud.

## 현재 검증된 출시와 이번 구현 경계 — 2026-10-05 (12.3.8)

직전 검증 출시 [#196](https://github.com/lkh0802a/LOL-GM/pull/196): exact head `9892b46f3b0aaac66994d52d657d6b3f5f081776` / ALL PR CI `37304527564`·verify `111747317750` → main `c821737e3c84d4a08a17075d94577fe47560d8fa` / ALL CI `37305557479`·verify `111750328614`·standalone `111750359415`(unchanged/Artifact download completed successfully.) / Pages `37306230747`·publication `111750457265`(validated checkout/current-main guard/Reported success!). 의료 core/regional0·1/calendar0·1/두집계7 labelled success/exitCode0는 PR196 body와 원본 gates에 보존한다. 실제 preview artifact `11342619189` ZIP digest `15839976d20048e0cb697a8f71f3cc3ad1da0e07f21ed1ec7d59a211f742648a`, Pages `11343517413` digest `690454d1d024bf66cad2cd57b6c4f4c032d451dedb1cc7c4788f1fe30af0cc85`, 실제 tar launcher/play/offline과 validated HTML SHA256 `0aea5aa2a987a05c4c8d3745bfb4246f44f5c21125ea7bbcf31eea35d4a39cac` bytes 일치가 확인됐다. Native196 cell95 hung bounded 종료로 성공 미확인, production HTTP는 workflow와 별개 Cloud 정책 아래 미검증이다.

이번 **12.3.8 소유 구단 현재 훈련 설정·공유 연습 자원→기존 수동 preparation→실제 일일·의료·성장·공식 소비·복귀·저장**은 편집 전45–55분 예상 범위였다. 12:29 무렵 이후 환경 starting/실행 도구 소실로 중단했으며14:36 재개 후 actual remote/main/branches/open27·28/rules/current-main README·DEVELOPMENT/변경·tmp와 별도 dirty analysis를 다시 확인했다. 대기는 구현 시간이나 새 slice로 세지 않는다. 관련 기존 전술·선발·역할·조직 배치 초안 입력도 같은 문맥 방어를 공유한다. 새 exact-head PR/main/게시 gates는 확인 전 성공으로 쓰지 않는다. 전체38/eight-audit/13서사/all-domain inventory와 모든 원본 행을 같은 순서로 보존한다. 아래 이전 NEXT는 역사 기록이며 현재 다음 경계는 맨 아래12.3.8 절이다.

## 현재 검증된 출시와 이번 구현 경계 — 2026-10-05 (12.3.7)

직전 검증 출시 #195: exact PR head `28524044cfae81c5b944383e8dc0ccb0945df957` / ALL PR CI `37291461346`·verify `111705113391` → main `87a504e61ce8bbd945d2185dcc745acdefa79bfe` / ALL CI `37292460449`·verify `111708256068`·standalone `111708293956`(unchanged, Artifact download completed successfully.) / Pages `37293240932`·publication `111708363806`(validated checkout/current-main guard/Reported success!). 의료 core/regional0·1/calendar0·1/두집계7 labelled success/exitCode0는 원기록과 PR195 body에 보존한다. Preview artifact `11337208274` ZIP digest `81ba92034182986514c3b1d3d76767f827106a0df1a3b26a4b265721ca90c4fe`, Pages artifact `11337552132` ZIP digest `c66dd45906b1c981c4e9a0044889567e9562e4926ad19aca49d9703f46673545`, 실제 tar launcher/play/offline과 validated HTML SHA256 `6669642f7f1e81af029e7484ddb9f0b59798e131c9619f5442fab32b4c76b1c4` 일치는 원기록에 보존한다. 이번 fresh remote/main/branches/open27·28/파일 충돌/rulesets/current-main README·DEVELOPMENT/규칙·해당 source와 PR195/head/세 workflow 성공을 다시 확인했다. Native195 cell86 hung bounded 종료로 성공 미확인, 직접 production HTTP는 workflow와 별개 Cloud 정책 아래 미검증이다.

이번 실제 **12.3.7 소유 선수 현재 계약·옵션·역할 약속→기존 수동 재계약/팀 옵션→실제 계약·공식 사용량 소비·복귀·저장**은 편집 전45–55분 예상 범위다. 새 exact-head PR/main/게시 gates는 확인 전 성공으로 쓰지 않는다. 가격/계수/계약/AI/등록/의료/경제/101 engine bytes/save schema는 기존 main과 동일하다. 전체 계약/UI/38/eight-audit/13서사/all-domain 완료가 아니다.

아래 12.3.6 헤더와 이전 NEXT는 원문 역사 기록이다. 원본 행을 같은 순서로 보존하고 현재 이어갈 경계는 맨 아래 12.3.7 절에서 명시한다.

## 현재 검증된 출시와 이번 구현 경계 — 2026-10-05 (12.3.6)

직전 검증 출시 #194: exact PR head `19bc8063cc08ecd508c542bc67d2af6dc5fe28fb` / ALL PR CI `37279212726` → main `39847edfddca94114026e070e312a9a84eb593ad` / ALL CI·standalone `37281684828`(unchanged) / Pages `37282267337`·publication job `111672850129`. 의료 core/regional0·1/calendar0·1/두집계 7 labelled success/exitCode0+verify, validated checkout/superseded-head guard/actual Reported success는 PR194 원문에 보존한다. CI preview artifact `11332861945` ZIP SHA256/digest `daac005111e7ca3306423391268501162ebec472ce49f139b67acce760d8d366`, Pages artifact `11332593745` ZIP SHA256/digest `fd28283bc663c19fdc3d4800afcf893b6f0b23ab9f28921b3a3eff7f55122b94`, HTML SHA256 `fe793cedc9ad175ef5ad1bb0db60cea457a3784fa217364840081eedd4618620`·동일 launcher-online-offline 실제 다운로드/조립은 원기록에 보존한다. 이번 fresh remote main/PR194/head/세 workflow 성공·branches/open27·28/파일 충돌·rulesets/current-main README·DEVELOPMENT와 해당 승인/source를 다시 확인했다. Native194 cell71 hung bounded 종료로 성공 미확인, production HTTP는 별도 Cloud 정책 아래 미검증이다.

이번 실제 **12.3.6 소유 구단의 현재 의료 가용·수동 휴식/재활 계획·저장 이력→기존 일일·훈련/스크림·공식 소비·결과·복귀·저장**은 편집 전45–55분 예상 구현 범위다. 현재 새 exact-head PR/main/게시 gates는 확인 전 성공으로 쓰지 않는다. 가격/계수/의료 사건·자동 대체/훈련/AI/등록/고용/공식 선발/save schema와 101 engine bytes는 기존 main과 동일하다. 전체 의료/UI/38/eight-audit/13서사/all-domain 완료가 아니다.

아래 12.3.5 헤더와 모든 이전 NEXT는 당시 원문 역사 기록이다. 원본 행을 같은 순서로 보존하며 현재 이어갈 경계는 맨 아래 12.3.6 절에서 명시한다.

## 현재 검증된 출시와 이번 구현 경계 — 2026-10-05 (12.3.5)

직전 검증 출시 #193: exact PR head `2011aeea09e394bbac5be7512ec405da7041b54e` / ALL PR CI `37272435523` → main `8042519806fb15a57af90b8e0a21bbb31e4b131f` / ALL CI·standalone `37272979584`(unchanged) / Pages `37273625892`·publication job `111645747439`. 의료 core/regional0·1/calendar0·1/두집계7 labelled success/exitCode0와 verify, validated checkout/superseded-head guard/artifact `11329805217` digest `sha256:3bf1c89c916251d7897397d5aca3ad65955f5f6f63bb111425015719a840ac6e` 실제 다운로드 일치·동일 launcher-online-offline·actual Reported success는 #193 원기록에 보존한다. 실제 remote/main/branches/open27·28/conflicts/current-main README·DEVELOPMENT/규칙을 다시 확인했다. Native193 attachment cell53 hung bounded 종료로 성공 미확인; 직접 productionHTTP는 workflow와 별개 Cloud 정책 아래 미검증이다.

이번 실제 **12.3.5 관측 직원·수동 고용/재계약/해지·공식 현장 등록→실제 지원 소비·결과·복귀·저장**은 편집 전45–55분 예상 범위였다. 가격/고용/현장/등록/AI/효과/101engine/save schema를 바꾸지 않는다. 새 exact-head PR CI/main/게시 gates는 확인 전 성공으로 쓰지 않는다. COMPLETE38/eight-audit/13서사/all-domain과 모든 원본 기록은 유지한다.

### 보존된 #192→#193 당시 header 원문

## 현재 검증된 출시와 이번 구현 경계 — 2026-10-05 (12.3.4)

직전 검증 출시 #192: exact PR head `310815f226dc9f89ddb0ef009f4aa1934c0846f4` / ALL CI `37262523203` → main `fc85cb68a018f64f9570bdf38982e742299cbb78` / ALL CI·standalone `37263352295`(unchanged) / Pages `37263884559`·publication job `111616515299`. 의료7 labelled success/exitCode0·verify, validated checkout/superseded-head guard/artifact `11325895880` digest `sha256:3d29a914396027dde6fbb6361462486e62114efbc4366959b644e0e79117d235` actual ZIP download SHA256 일치·동일 launcher-online-offline 조립·actual deployment는 PR192 최종 body/raw 증거에 보존한다. 실제 remote/main/branches/open27·28/파일 충돌·현재 main 가이드를 다시 확인했다. Native192 attachment hung cell32 bounded 종료로 성공 미확인, 직접 productionHTTP는 workflow와 별개 Cloud정책 아래 미검증이다.

이번 실제 **12.3.4 현재 현금·확정 의무·조건부 예상→기존 재정 상세·실제 후원 선택→실제 수입 소비·결산·복귀·저장**은 편집 전45–55분 예상 범위다. 엔진101개 파일은 기존 main과 bytes 동일하며 가격/계수/AI/결산/save schema를 바꾸지 않는다. 새 PR exact-head ALL CI/병합/main/게시 gates는 확인 전 성공으로 쓰지 않는다. COMPLETE38/eight-audit/13서사/all-domain·전체 승인 inventory와 원본 기록은 모두 유지한다.

### 보존된 #191→#192 당시 header 원문

## 현재 검증된 출시와 이번 구현 경계 — 2026-10-05 (12.3.3)

직전 검증 출시 #191: exact PR head `c9266a203076e575ab2bb57de63beeae8f734066` / ALL CI `37251916342` → main `5d15131e50101a5ac364845af8b3a97dc4ff4e87` / ALL CI·standalone `37252561842`(unchanged) / Pages `37252857286`·publication job `111583867914`. 의료 core/regional0·1/calendar0·1/두집계의 7개 labelled exitCode0 및 verify, validated checkout/superseded-head guard/artifact `11322140073` digest `sha256:a241cd3246d31938810765c904749351d630d4c2acc34ca3dd2166c858ec1747` 실제 다운로드 일치·동일 launcher-online-offline 조립·actual deployment는 PR191 최종 body/raw 증거에 보존한다. 이번 실제 remote main/PR191/해당 CI·Pages 완료 및 열린27·28·중복·파일 충돌·현재 main 가이드를 재확인했다. Native191 attachment는 bounded cell446 종료로 성공 미확인, 직접 productionHTTP는 workflow와 별개로 Cloud 정책 아래 미검증이다.

이번 실제 구현 **12.3.3 소유 구단 공식 등록·의료 가용·출전 원인→기존 수동 명단·선발→실제 공식 소비·결과·복귀·저장**은 편집 전45–55분 예상 범위였다. 02:17 UTC 이후 환경이 starting으로 바뀌어 로컬 도구가 사라졌고03:57 재개 후 실제 변경·로그·remote 보존을 확인했다. 이 대기는 구현 시간/새 hourly slice로 계산하지 않는다. 기존 등록/의료/AI/계약/경제/경기/save 규칙은 변경하지 않으며 현재 검사와 미래 출전을 구분한다. 새 PR의 exact-head ALL CI/main/게시 gates는 실제 확인 전 성공으로 쓰지 않는다. 아래 COMPLETE38/eight-audit/13서사/all-domain 승인은 원래 행·순서대로 보존한다.

### 보존된 #190→#191 당시 header 원문

## 현재 검증된 출시와 이번 구현 경계 — 2026-10-05

직전 검증 출시 #190: exact head `19df51fa48a8550ef26cc999df9d2fdc6b99cc11` / ALL CI `37247738941` → main `fadee0765f9f17b193e184a3d436c82639f03f67` / ALL CI·standalone `37248220503`(unchanged) / Pages `37248671083`·publication job `111571608645`. 의료 core/regional0·1/calendar0·1/두집계의 7개 labelled exitCode0와 verify, validated checkout/head guard/artifact `11319392946` digest `sha256:e9e33981aff6fb70c6eea23467b8634acc2b9f48c239abf5c3374748ab486508` 실제 다운로드 일치·동일 launcher-online-offline 조립·actual publication은 PR190 body/raw 증거에 보존한다. 이번 fresh main/열린27·28/중복·파일 충돌/현재 main 가이드를 재확인했다. native attachment190은 bounded cell332 종료로 성공 미확인, 직접 productionHTTP는 Cloud 정책 아래 별도 미검증이다.

이번 실제 구현 **12.3.2 현재 소유 구단 브리핑→실제 공식 일정·열린 협상→기존 수동 행동·결과·복귀·저장**은 편집 전45–55분을 예상했다. 새 화면 소유 모듈은 실제 저장 상태를 순수하게 읽고, 날짜·경기·계약 writer/가격/기간/경제/AI/역사/save schema는 그대로 사용한다. 새 팝업과 기존 시장 입력이 공존하는 실제 DOM 반례를 재현해 선택적 root 경계를 공통 컨트롤에 연결했다. exact-head 전체CI/main/게시 gates는 실제 확인 전 성공으로 쓰지 않는다. 전체38/eight-audit/13서사/all-domain inventory는 아래 원래 순서·문구 그대로 보존한다.

### 보존된 #189→#190 당시 header 원문

## 현재 검증된 출시와 이번 구현 경계 — 2026-10-05 (UTC 10-04)

직전 검증 출시 #189: exact head `6206e2697beae74d6cdaac66b4d42c86f2285d79`/전체CI `37242889207` → main `8913a4bfc999958131b88a16162af9f8295d6fca`/전체CI·standalone `37243308243`/Pages `37243745571`. 이번 fresh remote/main·열린PR27/28·현재 main 두 workflow success를 재확인했다. 의료 core/regional0/1/calendar0/1/두집계 7개 exitCode0와 verify, publication job `111557431229`, artifact `11318111816` digest `sha256:0c6b1082119e855befbad3154178394991089102059830d2dd40196a7ae51a61` 실제 다운로드 SHA256 일치·head guard·동일 온라인/오프라인 조립·actual publication은 #189 원기록에 보존한다. native attachment189은 cell252 종료로 성공 미확인; direct production HTTP는 workflow와 별개로 정책상 미검증이다. 이전 standalone 문자열 probe(false)는 실제 `Artifact download completed successfully.`와 digest로 재확인한 진단이며 workflow 실패가 아니다.

이번 실제 구현 **12.3.1 처음 화면의 새 시작·불러오기·설정→기존 커리어 선택·저장·취소/복구**는 편집 전 예상45–55분이었다. UI와 ephemeral routing만 별도 소유하며 기존 슬롯/세계/계약/수동 권한/engine/history/save schema를 유지한다. 읽지 못한 저장을 빈 슬롯으로 대체하는 controlled counterexample과 오래된 실제 utility callback을 교정한다. 새로운 PR/current-head/main/게시 gates는 실제 확인 전 성공으로 쓰지 않는다. 전체38/eight-audit/13서사/all-domain 승인 inventory와 미완료는 아래 그대로 유지한다.

### 보존된 #188→#189 당시 header 원문

## 현재 검증된 출시와 이번 구현 경계 — 2026-10-05 (UTC 10-04)

직전 검증 출시 #188: exact head `eefc6050c33ea2e1fb3b4d3179231501f6a24df6`/전체CI `37231939674` → main `215ae7d4f2c45f1eea1dc5504ae6ce1e19068c5a`/전체CI·standalone `37232340992`/Pages `37232700587`. 이번 fresh main·열린PR27/28·두 workflow success를 재확인했다. 의료 core/regional0/1/calendar0/1/두집계 7개 exitCode0와 verify, 게시 job `111525577675`, artifact `11314715786` digest `sha256:58620f4b4e6b2ea0478ee467b437a7f1159e2ca978a0cebd631462d0b9973e77` 실제 다운로드 SHA256 일치·head guard·동일 온라인/오프라인 조립·실제 게시 근거는 #188 원기록에 보존한다. native attachment188은 cell148 종료로 성공 미확인; production HTTP는 workflow 성공과 별개로 정책상 미검증이다.

이번 실제 구현 **12.5.3 초기 영입의 조건부 인원·로컬·연봉·현금 전후→기존 수동 제안·합의**는 편집 전 예상45–55분이었다. 실제 기존 초기 규칙/재정/명령을 private copy에서 소비하며 가격·역할 의무·언어 정책·수락 예측을 새로 만들지 않는다. 실제 검사/현재headCI/main/게시 gates는 확인한 것만 성공으로 기록한다. 전체38/eight-audit/13서사/all-domain 승인 inventory와 미완료 작업은 아래 원본 그대로 유지한다.

### 보존된 #187→#188 당시 출시·구현 설명 (현재 상태는 위 header와 각 task evidence)

### 당시 header 원문

PR #187 exact head `750dd3a4f6d5a8d86398a2de284b2d346e145db8`/전체CI `37228884121` → main `8593979f1eb2da770eeb7e22b1b3d6a161d4f727`/전체CI·standalone `37229255417`/Pages `37229527508`가 직전 검증 출시다. 이번 fresh remote main/두 workflow success를 재확인했다. 의료 core·regional/calendar0/1·두집계 7개 exitCode0와 verify, publication job `111516068291`, artifact `11313520732` digest `sha256:81c7c63ae66d89c92719b186a5ee66a43ce58d32f2aa5224e633076e99310690` 검증·다운로드·동일 온라인/오프라인 조립·실제 게시 근거는 #187 원기록에 보존한다. native attachment는 cell78 종료로 성공 미확인; direct production HTTP는 workflow와 별개로 정책상 미검증이다.

이번 실제 구현은 **12.5.2 초기 영입의 임시2–3인 같은 문맥 관측 비교→기존 평가·협상→복귀**(편집 전 예상45–55분)다. 관측 숫자/역할/날짜·공개 원자료와 같은 관측축 radar를 연결하고 실제 stale 명령과 챔피언 이름 표시 오류를 교정한다. 새 PR/head/main/게시 gates는 실제 확인 전 성공으로 표시하지 않는다. 전체38/eight-audit/13서사/all-domain 승인 inventory, shop·XP source 제한과 최종QA 보류를 유지한다.

### 이전 #186·12.5.1 출시 헤더 원문 (보존)

PR #186 exact head `0f1853e717469193cf643fe6628b3b5f4ee1dee1`/전체CI `37223816383` → main `b408caf29078cf207f607f323bb797abbbf2d134`/전체CI·standalone `37224349516`/Pages `37224803267`가 실제 직전 출시다. 이번 fresh remote main/두 workflow success를 재확인했다. 의료 core·regional/calendar0/1·두집계의 7개 exitCode0와 verify, publication job `111502143377`, artifact `11310759928` digest `sha256:3dcaf0312e19f6abd1b0e49457c817d056b7aef12c495a1aeab16d99e2996aa9` 검증·다운로드·동일 온라인/오프라인 조립·실제 배포 근거는 #186 원기록에 보존한다. native attachment는 bounded cell39 종료로 성공 미확인; direct production HTTP는 workflow와 별개로 정책상 미검증이다.

이번 45–55분 실제 구현은 **12.5.1 초기 영입 관측 후보 목록→상세→기존 평가·협상→복귀**다. 별도 dirty explorer(9e2b085)의 코드/문서는 그대로 보존하고 현재 main에 UI 코드를 검토·연결했다. 그 오래된 문서로 현재 전체 guide를 덮어쓰지 않는다. 현재 PR/전체CI/merge/Pages는 실제 gates 확인 전 성공으로 표시하지 않는다. 전체38/eight-audit/13서사/all-domain 승인 inventory, 상점·XP source 제한과 최종QA 보류를 유지한다.

### 이전 #185·8.4.5 출시 헤더 원문 (보존)

PR #185 최종 head `6c4f149008bbdbf8f3f49bbeb478291753a0d0f0` 전체CI `37219630658`(의료4시드·두집계/core/verify, 7개 exitCode0) 성공 후 main `493ebb245cb2047dcd655cbc6cd18bf16bbc7b4f`에 순차 병합됐다. 같은 main 전체CI/standalone `37220243594`(unchanged)와 Pages `37220701653`/job `111490277242`의 validated checkout/head guard/artifact `11309968007` digest·download/동일 online·offline 조립/실제 게시 성공이 직전 출시 근거다. 이번 fresh remote 조회도 동일 main/두 workflow success를 확인했다. native attachment는 cell1045 응답 중단으로 성공 미확인, direct productionHTTP는 정책상 별도 미검증이다. 첫08ae1164/37219490595은 오래된 상태 문구의 역사 라벨 보강으로 대체·취소됐다. 원본38행·실패·#164–#185 역사와 #180 캡처 보존 한계를 유지한다.

이번 실제 구현은 **8.4.5 전투 캐시 실제 입력 감사·측정된 현금 재계산 제거**(예상45–55분)다. 지원 writer에서 stale 결과는 아직 재현되지 않았으며, 실제4경기에서 확인한 현금-only 재계산195회만 제거한다. 새 PR/head/main/Pages gates는 성공 전 기록하지 않는다. 전체 승인 범위·source-blocked shop/XP·최종QA 보류를 유지한다.

### 이전 #184·8.4.4 출시 헤더 원문 (보존)

PR #184 최종 head `78af14fbb3622d5a9a5b095290cd322f04a2477e` 전체CI `37216333851`(의료4시드·두집계/core/verify, 7개 exitCode0) 성공 후 main `5906f0fc492975904c33c6bead9e3171ecf93aba`에 순차 병합됐다. 같은 main 전체CI/standalone `37216894941`(unchanged)와 Pages `37217351540`/job `111480458463`의 validated checkout/head guard/artifact `11308598002` digest·download/동일 online·offline 조립/실제 게시 성공을 재확인했다. native attachment는 cell981 응답 중단으로 성공 미확인, direct productionHTTP는 정책상 별도 미검증이다. 첫 c3dec2e/CI37216028963은 초기 trace hash 최신화로 대체·취소됐으며 final 성공이 아니다. 원본·중간·최종 source/취소 의료 로그와 #164–#184 역사, #180 캡처 보존 한계를 보호한다.

이번 실제 구현은 **8.4.4 라인전 HP 비용의 자원 보존과 당시 설명**(예상45–55분)이다. 기존 nonlethal trade/올인/귀환 규칙을 보존하고 피해 비용의 암묵적 회복만 막는다. 새로운 current-head CI/병합/Pages gates는 실제 성공 전 기록하지 않는다. 전체 승인 inventory와 source-blocked shop·XP/장기 QA 보류를 유지한다.

### 이전 #183·8.4.3 출시 헤더 원문 (보존)

PR #183 최종 head `54bd08216adf70ab9cad43136f64c0351b7d7f8e` 전체CI `37212450588`(의료4시드·두집계·core·verify) 성공 후 main `6e7f3b5e4fb8eafa14e9cb537a9af08a31d235c6`에 순차 병합됐다. 같은 main 전체CI/standalone `37212986820`와 Pages `37213498615`/job `111469241076`는 validated checkout/head guard/artifact `11307222654` digest·download/동일 online·offline 조립/실제 게시 성공으로 확인됐다. native attachment는 응답 중단으로 성공 미확인, direct productionHTTP는 정책상 별도 미검증이다. #164–#183 원본·실패·역사와 #180 캡처 덮어쓰기 한계를 보호한다.

이번 실제 구현은 **8.4.3 준비된 라운드 피해와 잘못된 입력의 자원·기록 경계**(예상45–55분)다. 기존 같은 라운드의 준비된 공격을 사망 후 일괄 취소하는 정책을 도입하지 않는다. 새 PR/current-main/게시 gates는 확인 전 성공으로 쓰지 않는다. 전체 승인 inventory와 source-blocked shop·XP/장기 QA 보류를 유지한다.

### 이전 #182·8.6.4 출시 헤더 원문 (보존)

PR #182 최종 head `84fe343eed0bae1cb91d159fd7df2e3151b428a7` 전체CI `37208769320`(의료4시드·두집계·core·verify) 성공 뒤 main `9c775db7091dee8b85a8e386e8d21d70b57cfcb6`에 순차 병합됐다. 같은 main 전체CI/standalone `37209044929`와 Pages `37209470858`/job `111457523392`는 validated checkout/head guard/artifact `11305942798` digest·download/동일 online·offline 조립/실제 게시 성공으로 재확인했다. native attachment는 응답 중단으로 성공 미확인, direct productionHTTP는 정책상 별도 미검증이다. #164–#182 원본·실패·역사를 보호한다. 첫 b743185/CI37208548063은 기존 UI8000자 제한 초과로 실패했고 잘못 집계한 로컬 static 결과를 정정한 기록도 보존한다. 최종 파일 분리 후 exacthead CI가 통과한 것이며 초기 실패를 성공으로 바꾸지 않는다.

이번 실제 구현은 **8.6.4 macro 끊기 참여자 선택·시드 순서와 당시 기록**(예상45–55분)이다. 새 PR/current-main/게시 gates는 실제 결과 확인 전 성공으로 쓰지 않는다. 전체 승인 inventory/source-blocked shop·XP/장기 QA 보류를 유지한다.

### 이전 #181·8.6.3 출시 헤더 원문 (보존)

PR #181 최종 head `3c8de8a0071191cf7f7421c726b1fc225022e732` 전체CI `37205092249`(의료4시드·두집계·core·verify) 성공 뒤 main `83a8fd53d844065c2fbca12846dc4967a716006a`에 순차 병합됐다. 동일 main 전체CI/standalone `37205575145`(unchanged)와 Pages `37205987090`/job `111447150601`의 validated checkout/head guard/artifact `11304453229` digest·download/동일 online·offline 조립/실제 게시 성공을 재확인했다. native attachment/확인용 lookup은 bounded 응답 중단으로 성공 미확인, direct productionHTTP는 정책상 별도 미검증이다. #164–#181 원본·실패·역사를 보호한다.

이번 실제 구현은 **8.6.3 구조물 전환의 합법 라인 선택·동률 난수 순서**(예상45–55분)이며 아래 절이 재현·수용·한계·정확한 다음을 소유한다. 새 current-head CI/main/게시 gates는 확인 전 성공으로 기록하지 않는다. 전체 승인 inventory/source-blocked shop·XP/장기 QA 보류를 유지한다.

### 이전 #180·8.6.2 출시 헤더 원문 (보존)

PR #180 최종 head `023cb7a51a792a40187d02005f84016c24ec2bcc`의 전체CI `37202374295`(의료4시드·두집계·verify) 성공 후 main `dfabb6642f107d5e37789adff117143cf61a4286`에 순차 병합됐다. 동일 main 전체CI/standalone `37202898064`(unchanged)와 Pages `37203346448`/job `111439347081`의 검증 checkout/head guard/artifact `11303153931` digest·download/동일 online·offline 조립/실제 게시 성공을 재확인했다. native PR attachment는 성공했고 direct productionHTTP는 별도 정책상 미검증이다. #164–#180 원본·실패·역사를 보존한다. 첫 head9253496/run37202080210은 escape 보강으로 대체·취소된 기록이며 최종 성공으로 바꾸지 않는다.

이번 45–55분 실제 구현은 **8.6.2 스틸 실행자와 참여·퀘스트·당시 source의 일치**다. 아래 절이 재현·구현·수용·한계·정확한 다음을 소유한다. 새 PR/current-main CI·merge·publication은 실제 gates 확인 전 성공으로 쓰지 않는다. 전체 승인 inventory와 source-blocked shop/XP는 유지한다.

**#180 캡처 보존 한계:** 최종 browser 재검사에서 기존 성공 screenshot 경로를 재사용해 첫 성공 화면의 원본 바이트를 덮어썼다. 초기 로그/첫 코드와 별도 final-* 최종 화면은 남지만 최종 PNG를 초기 원본으로 표시하지 않는다. 원래 실패 로그·raw baseline·게임 역사는 삭제하지 않았다. 이번 단위는 초기/최종 캡처와 로그에 서로 다른 경로를 사용한다. 이 한계와 대체 CI 진단은 [보존 기록](evidence/objective-steal-diagnostics.json)에 이어간다.

### 이전 #179·8.3.3 출시 헤더 원문 (보존)

PR #179 최종 head `7ac21fbc3d8ca5e54b4ef1db3bb0540c9d480d0f` 전체CI `37198443318`(의료4시드·두집계·verify) 성공 후 main `a063fc4e9fb342eb7c87bdc8bc33dc6c6cab6f3b`에 순차 병합됐다. 동일 main 전체CI/standalone `37198946795`와 Pages `37199283260`/job `111427435200`의 검증 checkout/head guard/artifact `11301917477` download/동일 online·offline 조립/실제 게시 성공은 다시 확인했다. native attachment는 호출했으나 bounded wait 종료로 성공 미확인, 직접 production HTTP는 별도 정책상 미검증이다. #164–#179 원본 source·실패·역사는 보존한다.

이번 실제 구현 단위는 **8.3.3 실제 장비 AD/HP/방어력/마법 저항력 패치 작성자·소비 연결**(예상45–55분)이다. 구현/로컬 수용과 PR/current-main CI/병합/게시를 구분하며 출시 gates 확인 전 성공으로 쓰지 않는다. 아래8.3.3이 현재 구현·근거·한계·정확한 다음을 소유한다. 이전8.4.2 원기록과 당시 다음 단계는 아래 역사로 보존한다. 전체38·여덟 감사 후보·13서사·모든 운영/언어/재정/UI 승인 inventory와 source-blocked 상점/웨이브를 축소하지 않는다.

### 이전 출시·8.4.2 구현 원기록 (보존)

PR #178 최종 head `6d769e1fda083791f19429f4ad565a3d9204c542` 전체CI `37195327722`(의료4시드·두집계·verify 포함) 성공 후 main `f9d61b10a0f4a014a8f91062cbc0254dd3dcf4a0`에 순차 병합됐다. 동일 main 전체CI/standalone `37195824593`(HTML unchanged)과 Pages `37196247996`/job `111418627459`의 검증 checkout/head guard/artifact `11301016883` download/동일 online·offline 조립/실제 게시 성공을 재확인했다. tested source/docs/scripts/package/index가 main과 동일했고 원래 #164–#178 source·실패·역사를 보존한다. native attachment는 호출·boundedwait 후 cell606 종료로 성공 미확인, direct productionHTTP는 별도 정책상 미검증이다.

이번 실제 구현은 **8.4.2 처치 지원 보상의 대상·중복·당시 지급 기록 연결**이다. 현재 PR/main release gates는 확인 전 성공으로 쓰지 않는다. 설정150/실제152의 반올림 현상은 재현했지만 실서버 지급 정책을 발명해 교정하지 않는다. XP/웨이브8.5.1·상점8.2.2의 reviewed metadata 공백과 전체 승인 inventory는 유지한다.

**이전 검증 원문(당시177 출시 근거):** PR #177 최종 head `60d741918198a006491980ed61b20c9dd3789c1b`의 전체 CI `37192011689`(의료4시드·두집계·verify 포함) 성공 뒤 main `edb382594de0d2d2985c70953e6cb6a45703bc74`로 순차 병합됐다. 동일 main 전체CI/standalone `37192515477`(HTML unchanged)과 Pages `37192759788`/job `111408237811`의 검증 checkout/head guard/artifact `11299572273` download/동일 online·offline 조립/실제 게시 성공을 재확인했다. native attachment는 호출·boundedwait 중단으로 성공 미확인, direct productionHTTP는 별도 정책상 미검증이다. 원래 #164–#177 실패·원자료·게임 역사는 보호한다.

**당시178 구현 경계 원문:** 이번 경계는 **8.6.1 실제 오브젝트 획득의 참여·보상·퀘스트 공통 작성자**였다. 당시 미검증 gates는 위178 재확인으로 대체되고 원래 자료·미완료 inventory는 유지한다.

**이전 검증 원문(당시176 출시 근거):** PR #176 최종 head `e60ea9ecea4a94e97e5de4e53fa3ff7ae49814ad`는 전체 CI `37188431416`(의료 네 시드·두 집계·verify 포함) 성공 후 main `69b65d26c5d59bcaa242c52c9d07a47dad4c7bd4`로 순차 병합됐다. 동일 main 전체 CI/standalone `37188748994`과 Pages `37189147290`의 검증 checkout/head guard/artifact download/동일 online·offline assembly/실제 게시 성공을 다시 확인했다. tested source/docs/scripts/package/index가 main과 동일했다. native attachment는 호출했으나 bounded wait 뒤 응답 중단으로 성공 미확인이고 direct production HTTP는 정책상 별도 미검증이다. 원래 #164–#175 실패·원자료·출시 근거는 보호하며 지난 dated 조사/구현 절의 다음 작업은 그 당시 상태다.
## UI 전면 재설계 — 승인된 현재 범위

사용자는 기존 내부 기능과 화면의 괴리가 크다고 지적했고, 부분적인 외형 수정 대신 UI 전면 재설계를 승인했다. 이 결정은 구현 예정 범위이며, 현재 리그 선택 표시 수정만으로 재설계 완료를 주장하지 않는다. 기존 엔진, 공유 명령, 권한, AI 동등성, 저장 호환성과 게임 기록을 유지하면서 사용자 작업 흐름과 화면 구조를 다시 설계한다.

- **12.3 운영 흐름과 화면 구조:** 실제 현재 화면/명령을 전수 연결 점검하고 구단 현황 → 필요한 일 → 선수·계약·훈련·대회/경기 → 결정 → 결과 확인 흐름을 설계한다. 현재 상태, 가능한 행동, 조건·비용·제한 및 결과의 이유를 일관되게 배치한다. 메뉴 이름만 바꾸거나 가짜 버튼을 추가하지 않는다. 산출물은 기존 문서 내 화면/기능 연결 목록, 우선순위 및 실제 첫 운영 화면 구현이다.
- **12.4 화면별 교체와 기능 연결:** 구단 현황과 내비게이션부터 선수/로스터·계약/시장·스태프/훈련·대회/일정·밴픽/경기·결과/통계·재정/사무국·저장/설정까지 자연스러운 세로 단위로 교체한다. 모든 영역을 검토하되 실제 확인한 의존성과 결함에 따라 순서를 조정한다. 국가별 2부/연고국/육성 거점과 중계 일정도 해당 엔진 구현과 함께 UI에 연결한다. 기존 화면은 동등한 필수 기능이 새 화면에서 작동하는 것을 확인한 뒤 교체한다.
- **12.5 일관성·편의성과 집중 검증:** 반복 입력·불필요한 이동·중복 알림을 줄이고 검색/필터/선택 맥락을 유지한다. 반응형 정보 배치, 표·스크롤, 키보드/포커스, 폼 오류, 로딩/빈 상태/저장 피드백을 검증한다. 직접 운영 기본값과 의미 있는 선택은 보존한다. 집중 브라우저/레이아웃 검사는 허용하며 최종 장기/실기기/TalkBack QA는 계속 보류한다.

**수정하기 쉬운 구조도 필수 기준이다.** 화면 표시/내비게이션과 엔진·공유 명령의 상태 변경을 분리한다. 공통 버튼·폼·표·오류/저장 피드백은 실제 반복되는 범위에서 재사용하고 색상·간격·타이포그래피와 반복 문구는 중앙 정의로 관리한다. 도메인 화면은 책임이 명확한 모듈로 두며 거대한 단일 화면 파일, 규칙 계산 복제, 불필요한 프레임워크/의존성·추상화 계층을 피한다. 기존 모듈/빌드 제약과 standalone HTML을 먼저 확인하고 단순한 명시적 인터페이스를 우선한다. 각 화면의 소유 모듈, 호출하는 엔진/명령 진입점과 집중 검증 방법을 문서에 남겨 다음 수정 위치와 영향 범위를 쉽게 찾을 수 있게 한다. 실제 구현으로 이 기준을 입증해야 하며 문서 작성만으로 구조 개선 완료를 주장하지 않는다.

각 교체 단위의 완료 조건은 **화면 조작 → 권한/조건 확인 → 실제 공유 명령·엔진 반영 → 관련 화면의 상태와 결과/이유 표시 → 저장·재접속 상태 유지**다. 실패·취소 시 rollback과 중복 실행 방지도 필요한 경로에서 확인한다. 내부 함수만 있거나 화면만 있는 기능은 완료가 아니다. 기능/권한/저장 의미 변경은 UI 정리로 숨기지 않는다.

한 명의 구현 담당자가 기존 시간당 45–55분 단위로 진행한다. 현재 열린 PR의 실패를 보존·해결하고 중복 작업을 피한다. PR #164의 초기 head `575d6203d605672173777411c32f19a6807755bc`에서 발생한 35초 core 실패는 보존한다. 최종 head `45e55e3d1eb75785cf80b5feafe9c39130c031fa`의 필수 CI `37147718717` 전체 성공(의료 4시드·2집계 포함)을 확인한 뒤 main `606b3d63eca2e6923ef4b004ae26b575dac2c4f2`로 병합했다. 분석실 첫 흐름 PR #165는 main `b9e3a65c510dde5b0e8a94ebbd5b83b3cb1b158a`의 CI `37149338522`와 Pages `37149770866`까지 성공했다. 공개/내부 티어 PR #166은 최종 head `a69ed20662acd96230f6427b9dadcdf3d7ff2c78`의 필수 CI `37151397972` 전체 성공 후 main `9d4d13cb91a788d555ced365929e9293ca612801`로 병합했다. 같은 main의 CI `37151887620`·standalone-sync 및 Pages `37152219937` 성공과 저장소 HTML 일치를 확인했다. 같은 후보 비교 PR #167은 최종 head `69390728286792597b6db00f246302030314f4c6`의 필수 CI `37154848493` 전체 성공(의료 4시드·2집계 포함) 후 main `023db1ebb731a50551bb829e94577c3424a7c6bd`로 순차 병합했다. 이 main의 CI `37155290244`·standalone-sync와 Pages `37155554005` 성공, 검증 head와 main HTML 일치를 확인했다. 이전 `c55efce`의 CI `37154672981`은 제한 설명 수정으로 대체/취소된 기록이며 최종 게이트 통과로 간주하지 않는다. 실제 밴픽 비교 PR #168은 최종 head `caaf6bea008620d9efa4b7d7ec33dcfbaabb37a6`의 필수 CI `37158156615` 전체 성공(의료 4시드·2집계 포함) 뒤 main `d43c9e161c52bc178555db71c50077b4eb4afb98`로 순차 병합됐다. 같은 main의 CI `37158616072`·standalone-sync와 Pages `37159016683`의 검증 artifact·조립·배포 성공, 테스트 head와 main HTML 일치를 확인했다. 수동 밴픽 당시 근거 PR #169는 최종 head `169cdd32f849b5a2e3f20b22141e1086b3ec623f`의 필수 CI `37161438479` 전체 성공(의료 4시드·2집계 포함) 후 main `041817b77164508cc756c663f73068d489f79f6b`로 순차 병합됐다. 같은 main의 전체 CI `37161783420`·standalone-sync와 Pages `37162158263`의 검증 artifact·온라인/오프라인 조립·배포 성공, 테스트 코드/docs/HTML 일치를 확인했다. Cloud 정책이 github.io 접속을 403으로 차단해 실제 공개 HTTP 응답은 여기서 재확인하지 못했다. 분석 흐름의 배포 워크플로 성공은 전체 분석실/재설계 완료를 뜻하지 않는다. 재설계 구현은 별도 검토 가능한 작업 단위/PR로 진행하고 정확한 현재 head의 필수 CI 성공 후 순차 병합·HTML/웹 배포한다. 전체 구조/구단 개요 12.3–12.5도 남아 있고 분석 12.9.5가 병합·게시됐으며 현재 경기 단위는 8.1.1이고, 전면 교체가 끝났다는 선언보다 실제 화면별 연결 증거를 기록한다.

이전 검증된 출시 기준(2026-10-04): PR #171 최종 `d173a7f67f9da33dc7d6506be5ee3f9b629f99ac` 전체 CI `37168431212` 후 main `b1cf7abb94bd00583baf78d34872d19de96a9605` 병합. 같은 main 전체 CI/standalone `37168684378`, 검증 artifact/Pages `37168959385` 성공. 당시 구현 단위는 8.2.1이었다. 최신 출시 기준과 이어가기는 아래 기록을 따른다. 직접 github.io HTTP는 정책 차단 상태다. 이전 출시 증거는 위 기록과 각 단위에 보존한다.

현재 검증된 출시 기준 갱신(2026-10-04): PR #172 최종 `d309a635140e514b3a15c845a6a42dd2f7c0962e`의 전체 CI `37175037544` 성공 후 main `a529566d838f50f1b6215ffa07bba9c9b9f61b30`로 병합했다. 같은 main의 전체 CI/standalone `37175385189`와 Pages `37175728063` 성공을 확인했다. 문서 PR #173 최종 `9e2b0850d7ddb93ddd930576dbbc78cafc71338a`은 전체 CI `37176582788` 후 main `6ab1f55461ffbd8441226e55ec9600f8eceb970d`로 병합됐다. 같은 main의 전체 CI `37178547630`·standalone-sync와 Pages `37178753632`의 검증된 checkout/이전 head 차단/artifact 다운로드/온라인·오프라인 조립/실제 게시 성공을 확인했다. 문서 배포는 새 게임 기능 구현 단위가 아니다. 직접 공개 HTTP 응답은 Cloud 정책 차단으로 별도 확인되지 않았다. 현재 엔진 단위는 **8.2.2 구매 장소·귀환 상태 연결**이며 아래 소스 조사 경계와 미구현 사항을 따른다. 최초 영입 화면의 별도 미커밋 작업은 보존하고 출시로 간주하지 않는다.

## Unified numeric roadmap

This is the development task hierarchy, not a change to internal game architecture.
Current work uses numeric stages, task names, goals, completion criteria and
precise remaining work. Existing
implementation and validation evidence remain preserved in the historical archive.
Each substantial work unit uses a dotted number and a coherent 45–55-minute boundary.

| Stage | Current scope | Acceptance boundary |
| --- | --- | --- |
| 1. Foundation and new game | world/team selection, initial FA supply, identity/calendar | Previously verified foundation; reproduce legal starts, budgets/registration and save; legal initial supply now verified in PR #164; preserve roster minimums/import limits and recheck future starts |
| 2. Players, medical and development | ability, roles, relationships, fatigue/recovery, growth/retirement | Existing medical and relationship systems; observed causes, actual practice/match effects, save/AI parity |
| 3. Scouting and prospects | cohorts, observation uncertainty, stale reports, shortlist comparisons | Existing observation systems; no hidden-information shortcuts, legitimate observed AI decisions |
| 4. Contracts and transfer market | consent, negotiations, representatives, loans, payments, insolvency | Existing contracts and loans; full command/UI/finance/save/rollback and remaining claim/lifecycle scope |
| 5. Clubs, squads, staff and facilities | owned reserve authority, movement, staff contracts/departments, facilities/governance | Existing organization/staff systems; sporting/economic authority and actual employment effects |
| 6. Training and scrims | shared time/resource budget, plans, partner availability, private observations | Existing practice systems; opportunity cost, no duplicate resource use, official/private separation |
| 7. Draft, tactics and series | composition, matchups, mastery, public evidence, First Selection/Fearless | Existing draft plus contextual selection work; actual decisions/series effects, manual locks |
| 8. Match adjudication | purchases, combat/resources, minions/camps, vision, rotations, side lanes, objectives, nexus | Existing match systems; causal scenario acceptance and professional-only empirical calibration |
| 9. Balance patches and meta | champion/item/rune and minion/camp/objective rules, diagnosis/adaptation | Existing patch systems; real consumers, dated snapshots, avoid unjustified buff/nerf oscillation |
| 10. Leagues, competition and history | domestic/international slots, registration/license, seasons, standings, records | Existing competition/world work; confirmed fictional rules and historical attribution |
| 11. Finance and club strategy | cash, liabilities, sponsor/operating flows, AI budgets/medium-term choices | Existing finance/insolvency work; affordability, shared settlements, no invented prices/fees |
| 12. Product, UI, saves, performance and delivery | all-domain convenience, accessibility, offline HTML/web, save integrity, measured bottlenecks | Authorized full UI redesign (12.3–12.5); actual screen→command→engine→result→save acceptance, useful decisions, parity/rollback and stable delivery |
| 13. Playtest fixes and final verification | user playtest → feedback fixes → final long/device/TalkBack QA → Android | Final acceptance; 100-season/device QA cannot start before feedback/fixes |

**Immediate numbered work and evidence:**

- 10.1 League identities and Americas: current implementation uses L-prefixed
  three-letter major pairs LCK/LKC, LPL/LDL, LEC/LEA, LCS/LNA, LCP/LPA,
  LSA/LSC. New careers have real tier twos in all six major regions; newly
  founded leagues must create and retain tier two. South America replaces the
  Brazil-only preset; Central America/Caribbean is a North American child market.
  Legacy geography, competition keys, player local identities/contracts and
  historical labels remain; generated display aliases alone are repaired.
  Evidence: `league-identity-acceptance.mjs` covers legal initial formation,
  actual scheduled tier-twos, displayed picker labels, save keys/history/custom
  names, new regional/future league formation and required-tier abolition guard.
  Exact-head CI and validated publication remain required before completion.
- 10.2 Country-level tier twos under integrated regions: confirmed next slice.
  Add independently selectable club home-country, reserve development/operating country and country league membership; build separate
  real tier-two schedules/standings and selection while retaining umbrella top
  tier, regional local eligibility, parent authority and event-time attribution. Reserve development may be outside the parent home country; admission belongs to the office and location alone cannot rewrite athlete nationality/local eligibility.
  League offices own promotion/relegation eligibility, places, qualifiers and effective dates; the developer connects decisions to actual next-season membership. Owned reserves cannot join their parent in tier one. No inferred nationality from region codes or copied real league policies.
  Current region-wide tier-two leagues are not acceptance for this country scope.


- 8.1 Nexus-based match ending: PR #163 passed required exact-head CI and merged;
  publication-head main validation remains the delivery gate. No gold-timeout winner; transparent computation guard, ordinary-match
  parity, post-70 natural resolution and failure without official result.
- 8.2 Item purchase legality: pinned unique/exclusive groups and actual writer
  checks, allowed repeated materials/consumables, recipes, slots, costs/quest/champion
  exceptions. Source group metadata is missing; acquire before inventing rules.
- 8.3 Resource and power: earned/unspent/spent gold, actual inventory and levels,
  purchase timing/scaling; first measure generic gold-stat versus item effects.
- 8.4 Coordinated counter-items: apply/allocate healing reduction and armor
  reduction with reviewed stacking, eligible applicators, uptime and opportunity cost;
  distinguish team reduction from personal penetration.
- 8.5 Waves/camps and 8.6 macro conversion: expand existing proxies vertically,
  preserving current lane/jungle/objective/fight code; use actual patchable rules.
- 7.1 Draft/series and 9.1 patch consumption: inspect existing causal gaps, preserve
  legitimate observed information, update one proven path at a time.
- 8.7 Professional calibration: collect validated competition-only data, group
  chronological holdouts and compare distributions. Source networking is blocked.
- 12.1 Document navigation/status consolidation and 12.2 stable web/offline HTML:
  current delivery work. Review existing behavior before declaring every domain complete.
- 1.1 Legal initial FA supply: PR #164 implements deterministic pre-auction
  supply with actual roster/import constraints; focused acceptance and exact-head
  required CI passed. External professional/group data remains independently blocked.

This is a unified scope/trace, not an accepted global completion count. Each stage
updates actual implementation, tests, failures and remaining work; repeated new
roadmaps are not substitutes for implementation.

## Current evidence and next work

- PR #162 (`92ce5a9b29d86af69d4573056c32302a7cbba774`) passed all 13 required
  checks in Actions 37128893953 and merged as `abed56c8d7467c022a1ea2d21db294914bf00a49`.
  Publication main `8e7e5a438f47517c10207d5ef9cbb998b97f571c` passed all 14
  required checks in Actions 37129437786, including standalone-sync. Both medical
  runs contain core + four seed + two aggregate successes.
- Delivered: owned-reserve manual training, lineup, roster roles and conversion
  choices survive daily/offseason AI; valid manual starters survive internal
  movements. Reserve-only coaches retain sporting authority; AI parents retain
  economic authority. Focused route: 121 official matches, save/idempotence,
  invalid-slot repair and exact rollback. Details are preserved in the history.
- Verified next bootstrap gap: KR eight-parent/eight-reserve subs=0 produces 85
  available players for 88 required; career construction fails. NA also fails.
  Fix legitimate initial FA supply while preserving global FA, budgets, registration
  and confirmed integrated minimum 11. Cover zero/default subs and each career type.
  Original evidence: `/tmp/owned-coaching-zero-subs-evidence.log` and reproductions.
- Untested hypothesis: loan movement force=true may overwrite valid manual lineup
  choices. Reproduce before changing player-loans; do not describe it as confirmed.
- User-requested engine priority: realistic draft, match and balance-patch decisions,
  backed by competition data only. Read [source and calibration policy](CHAMPION_DATA.md#competition-only-calibration).
  Gold is an advantage, not a victory condition; win must follow nexus destruction.
  The 70-minute gold-winner fallback is reproduced: injected structure stall
  returned a winner with both nexuses alive. Now removed: ordinary tick/fight/
  structure conversion continues after 70 until nexus destruction, with an
  explicit failure at a 180-minute computation guard, not a tournament time rule.
  An injected stalled match fails without changing career state; a released stall
  resolves after 70 through actual nexus destruction. A bounded 32-game normal sample has
  no cap hits; it is not global balance evidence. Original logs remain under
  `/tmp/match-ending-baseline.log`. Replace the fallback; retain honest failure. Gold-derived class stats alongside item effects,
  fixed combat multipliers and historical patch-strength attribution are review
  candidates, not already measured balance defects.

## Validation, integration and preservation

Every PR and main push runs full required CI, including medical core, four seed
shards, two aggregate invariants and verify. Merge sequentially only after all
required checks succeed on the exact current PR head; recheck head/main before
merge. Rebuild standalone HTML from integrated main and verify publication-head
CI/standalone-sync. Attach each created PR. Canceled/failed runs are not successes.
See [CI result guide](CI_RESULTS.md). Standard public ubuntu-latest is authorized;
paid runners, billing changes and budget increases are not.

Preserve failures, original diagnostics, historical source/records, save compatibility,
AI/player rule parity, observation boundaries, permission checks and rollback.
Do not assume prior machine diagnostics are present or recreate/delete them.
Do not hide failures with record deletion, production GC, budget increases or
instrumentation removal. Internal seeded tests are allowed; seed controls are not
player features. Only optimize measured bottlenecks; verify result/RNG parity for
behavior-preserving changes and identify intentional gameplay changes separately.

Long 100-season, real mobile/device and TalkBack final QA remain deferred until
implementation and user playtest feedback/fixes are complete. Focused UI/browser,
scenario and bounded profiling checks are allowed. Final QA limits remain heap
1536 MiB / RSS 4096 MiB. After roadmap and authorized refinements, wait for playtest
feedback/design priorities; do not repeatedly rerun unchanged reviews.

## Functional and convenience acceptance

A feature must connect actual controls, shared domain validation, engine effects,
AI, saves and failure/rollback paths. No fake buttons, decorative engine numbers
or completion inferred from function presence. Direct management is the default;
delegation requires an explicit authorized scope. Preserve useful decisions while
reducing repeated navigation/inputs; use atomic final-state multi-edit validation,
actionable error messages, filter/scroll retention and focused keyboard checks.
Aggregate spell profiles are not exact casts, geometry or hitboxes. Unknown source
mechanics remain unknown; do not invent CC timings, real policies, asset prices or
mandatory agency fees. Source stats and professional observations are distinct.

## Documentation review and engine acceptance limits

All root docs have been reviewed/classified as active guidance or dated evidence.
README obsolete stage/preview instructions and core-model schema-9 guidance are
updated. Obsolete migration handoff/integration/checklist/first-core plans are deleted;
duplicate obsolete planning prose is pruned. Relevant decisions, compatibility,
failures and regressions are retained. No game source snapshots, tests, game
history or diagnostics are deleted.
The former 4,000+ line development log is archived with rebased links; this guide
contains current rules, priorities, source policies and the focused development map.
This is documentation/source review, not full acceptance of every implementation.
Item uniqueness/group legality and a six-slot inventory are separate requirements;
read SYSTEM_DATA before claiming complete item legality.

## Engine refinement continuation

Prioritize reproducible causes over adding variables for their own sake:

1. Match ending: the 70-minute gold fallback is removed in this slice. Preserve
   normal tick/nexus resolution and transparent bounded unresolved failures;
   required exact-head PR CI passed; publication validation still gates delivery. Never fabricate an official winner.
2. Economy/combat: separate earned, unspent and spent gold; inspect actual recipe
   purchase effects and power spikes for double-counting. Compare equal gold with
   different roles/items, uneven carry allocation, casualties and scaling phases.
3. Decisions: verify lane priority, vision, availability, engage/disengage, target
   selection, waves and objective trades have relevant costs and observable effects.
   Add state only when its writer, consumer and observable consequence are defined.
4. Draft/series: check mastery, public opponent evidence, flex uncertainty, composition
   weaknesses and late-series Fearless adaptation against professional records.
5. Balance patches: verify champion base/skills, item price/stats/recipes, runes and
   objective spawn/reward/buff rules all change actual matches. Diagnose pick-ban,
   role, sample, region/team/player concentration and before/after response; control
   overshoot and oscillation. Existing simulated-world evidence remains separate
   from external professional calibration and historical patch snapshots.

Paired fixed-seed scenario checks must show credible routes for a gold-leading
team to lose and a behind team to win; do not force a fixed comeback percentage.
Professional holdout comparisons are unavailable until a validated dated dataset
is acquired. No 1:1 reproduction claim, artificial handicap or hidden catch-up buff.

### 전 부문 현실성·편의성 검토 우선순위 (2026-10-03)

사용자는 전 부문의 필요한 보완·현실성 추가 후보와 편의를 위해 줄이거나
제거할 후보까지 넓혀 정리하도록 요청했다. 아래는 **검토 백로그**이며,
전부 미구현이라는 진단이나 모든 신규 정책의 구현 확정을 뜻하지 않는다.
현재 코드·화면에서 이미 연결된 기능은 중복 개발하지 않는다. 기존 설계와
일치하는 재현된 결함/누락은 수정하고, 새 밸런스·정책·의미 있는 선택의
삭제는 효과와 비용을 제시한 뒤 설계 우선순위를 정한다.

판단 근거: LOL_GM_SPEC §1–11, §16–23, §30–35B와 DECISIONS D-UX-001.
소스 연결 후보는 아래에 적었다. 근거 수준은 확인된 결함(P0 첫 항목),
재현 전 가설(P0 둘째 항목), 설계 기반 제안(P1/P2)을 구분한다.
모든 제안의 공통 완료 조건은 실제 UI→공유 명령→엔진/AI→save 연결,
권한·취소·늦은 실패 rollback, 관찰 가능한 정보만 표시, 관련 focused
acceptance와 현재 head CI다. 장기/기기/TalkBack 최종 QA는 계속 유예한다.

**P0 — 플레이를 막거나 선택을 훼손하는 것부터**

- 새 게임/선수 공급: 위에서 재현한 subs=0 초기 FA 부족을 먼저 수정한다.
  기존 조직 최소 11명, 예산, 등록 정책은 유지한다. 자동 선수 생성으로
  시장 도중 부족을 숨기는 기능을 추가하지 않는다.
- 소유 2군/권한: 이번 수동 코칭 수정 후 임대 이동의 force=true 선발 재작성
  가설을 재현한다. 의료·등록상 불가능한 선수만 교체하고, 유효한 수동 선택은
  보존하는지 확인한다. 임대 코드 결함이라고 아직 단정하지 않는다.
- 완료 근거: 각 기능의 실제 플레이 경로/AI/save/실패 증거와 남은 연결을
  통합한다. 문서의 단계 이름이나 기존 함수 존재만으로 완료 처리하지 않는다.

**P1 — 먼저 검토할 운영·설명·편의성 연결**

| 부문 / 소스 후보 | 추가·보완 후보와 플레이 예 | 기대 효과 / 비용·의존성 / 줄일 후보 |
| --- | --- | --- |
| 홈·일정 / timezone-calendar, ui-season | 이번 주 경기·등록·협상 마감과 처리 필요 업무를 한 브리핑에 연결 | 방문 횟수 감소. 기존 알림·일정 재사용; 동일 사건 중복 팝업은 묶고 중대한 마감은 유지 |
| 훈련·회복 / development, medical, meta-practice | 실제 일정에 기반한 7일 훈련·휴식 비교, 자원 충돌과 회복 위험 표시 | 선택 결과 이해. 예측은 범위/한계를 명시; 매일 같은 배분 입력은 기간 계획·일괄 편집으로 줄임 |
| 선수·관계 / player-relations, ui-player-commitments | 출전·역할 약속과 실제 기용, 불만·재계약 의향의 관찰된 원인을 연결 | 이유 없는 페널티처럼 보이는 현상 감소. 숨은 정확한 점수 공개 없이 설명; 같은 불만 반복 통지는 변화 때만 |
| 영입·스카우팅 / scouting, ui-market, ui-scouting-regions | A/B/C 후보 비교에 역할 적합성·관찰 날짜·불확실성·총 비용을 함께 표시 | 합리적 대안 선택. 기존 보고서/쇼트리스트 재사용; 선수마다 화면을 왕복하는 절차 축소 |
| 계약·이적·임대 / contracts, transfer-payments, player-loans | 제안 전 확정 지출·분할 채무·조건부 비용·선수 동의·구단 권리·등록 가능성을 요약 | 실수 방지. 계약/규칙 원자료 의존; 필수 조항 강제와 같은 의미의 반복 확인은 피함, 최종 중요 확인 유지 |
| 1·2군 육성 / roster, ui-squad-preparation | 육성 목표·실제 출전·성장/피로 추세와 모구단/감독 권한을 같은 선수 경로에서 표시 | 이동 의미와 권한 명확화. 기록 재사용; 내부 배치와 공식 등록은 별개 규칙을 유지하되 중복 입력 검토 |
| 밴픽 / draft-analysis, ui-draft | 숙련·현재 패치·Fearless·상대 공개 기록을 근거로 후보의 장단점과 부족 역할 설명 | 티어순 클릭 감소. 기존 분석 재사용; 자동 정답 추천/숨은 flex 공개 금지, 중복 점수 배지는 정리 |
| 전술 / meta-tactics, meta-composition | 양끝 성향의 얻는 것/잃는 것과 현재 조합의 실행 제약을 미리 설명 | 슬라이더 의미 개선. 원인→결과 시나리오 필요; 같은 효과를 중복 조절하는 컨트롤은 통합 후보 |
| 경기·시리즈 / engine, series, ui-match | 실제 라인·자원·오브젝트·피로·조합 기록을 요약하고 다음 세트 변경점과 연결 | 패배 학습과 Bo3/Bo5 의미 강화. 집계 proxy 한계 유지; 모든 사건을 강제로 읽게 하는 흐름은 접기/요약 |
| 패치·메타 / patch, ui-patch, ui-player-champions | 변경점→선수 풀/준비 조합의 영향과 아직 적은 표본을 연결 | 재훈련 우선순위 결정. 패치 시점 데이터 의존; 모든 챔피언을 매번 재확인하는 절차 축소 |
| 재정 / finance, transfer-payments, ui-data | 현재 현금과 확정 채무·예상 수입을 구분한 현금 흐름 전망, 영입 전 감당 가능성 표시 | 잔액만 보고 지출하는 실수 감소. 가정/기간 명시; 동일 장부 수작업 입력·이중 집계 제거 후보 |
| 스태프·시설 / staff-contracts, staff-registration, office | 실제 업무 효과·담당 공백·유지비·완료 시점을 비교 | 무조건 최대 고용/시설 투자 방지. 실제 엔진 효과 확인; 엔진에 쓰이지 않는 장식 수치 정리 후보 |
| 규정·국제전 / registration, office-international | 탈락/몰수/출전 불가/슬롯 산정의 당시 규정과 수정 가능한 원인을 해당 화면에서 안내 | 규칙 암기 부담 감소. 확정 가상 정책·과거 스냅샷 의존; 정보를 찾기 위한 사무국 왕복 축소 |
| 통계·역사 / league-aggregation, ui-data, save | 공식/스크림·대회 수준·표본·패치·시점 필터와 원본 근거 연결 | 작은 표본의 과장 방지. 기존 기록 보존; 중복 표/설명 없는 단일 종합 순위는 정리 후보 |
| UI·검색·접근성 / ui-state, ui-overlay, ui-roster | 검색·비교·필터/스크롤 유지, 관련 다중 편집, 적용 전 차이·오류·저장 피드백, 키보드 기본 동작 | 반복 조작 감소. 기존 화면 흐름 재현; 깊은 메뉴·중복 모달·삭제 후 맥락 초기화 축소 |
| 저장·오프라인 / save, save-migration, state-rollback | 저장 상태·실패 시 복구 방법·내보내기/불러오기 안내와 이탈 시 미적용 선택 안내 검토 | 긴 커리어 손실 방지. 원본/호환성 유지; 매 행동 수동 저장 요구는 피함, 슬롯 삭제 확인 유지 |
| 성능 / engine, league-aggregation, ui-data | 실제 느린 날짜 진행·목록·집계·저장만 측정해 개선 | 조작 지연 감소. 대표 baseline/결과 parity 필수; 화면 밖 상세 렌더는 생략 가능하나 AI 경기 규칙·기록은 유지 |

**P2 — 의미가 있지만 새 정책·밸런스 검토가 필요한 확장**

- 구단 목표/팬/소유주: 구단 규모·재정·육성 목표에 맞는 기대와 최근 결과의
  맥락을 설명한다. 스타 판매/장기 부진 반응 강화는 재정·평가 영향 및 빈도를
  제안한 뒤 결정한다. 매 경기 강제 인터뷰·일률적인 숨은 징벌은 도입하지 않는다.
- 선수 생애/유망주: 기존 은퇴·노화·성장·공급 경로가 실제로 작동하는지 먼저
  확인한다. 코호트와 기회 차이로 커리어가 달라지는 보완은 후보이며 확정 잠재력
  공개/특급 신인 남발/외형만 다른 신규 성장 수치는 피한다.
- AI 구단 철학: 기존 관찰 정보·예산·대안 후보로 즉시전력/육성/비용 절감이
  결과에 나타나는지 비교한다. 중기 계획 보강은 새 판단 정책이므로 균형 검토가
  필요하다. 숨은 정보, 보정 자금, 플레이어만 적용되는 불이익은 추가하지 않는다.
- 감독 커리어: 해임이 세이브 종료가 되지 않는 지속성 원칙을 지킨다. 구직/이직
  확장은 핵심 경로 안정 후 후보이며 불필요한 계약 서류·반복 면접을 강제하지 않는다.
- 선택 위임: 안정된 계획 반복·기한 알림 같은 업무부터 범위/권한/중단 조건을
  사용자에게 명확히 표시하는 후보다. 직접 운영 기본을 유지하며 계약·영입·선발을
  동의 없이 자동화하지 않는다.

**편의를 위해 줄일 것 / 유지할 것**

반복 확인, 중복 통지, 같은 정보를 가진 여러 화면, 의미 없는 독립 보너스/수치,
개별 선수별 동일 입력, 억지 일일 체크리스트는 삭제·통합·접기 후보다.
실제 소스/플레이 검토 전에는 그런 UI가 현재 존재한다고 단정하지 않는다.
이미 합의된 SPEC §33 정리 항목은 잔존 여부부터 확인하고 중복 작업하지 않는다.
출전 경쟁, 훈련·휴식 배분, 선수 동의, 계약 비용·권리, 예산, 공식 등록,
밴픽·전술 trade-off와 기록은 판단의 핵심이므로 유지한다. 절차를 줄이는 것이
정책 우회·무조건 최적화·원본 삭제로 이어져서는 안 된다.

각 후보는 재현 트리거/현재 행동, 파일·규칙 근거, 사용자 예, 이익·단점,
범위·의존성·우선순위·근거 수준을 기록하며 구현 전 실제 누락을 좁힌다.
당장은 P0 초기 FA 공급 → 전체 기능의 남은 연결 확인 → P1 브리핑/원인 설명/
반복 조작 축소를 우선한다. 전 부문 검토가 모든 후보를 플레이 피드백 전에
구현하겠다는 약속은 아니다. 주요 확장은 피드백/설계 우선순위를 받아 선택하며,
검증된 수정과 연결 보완은 승인된 범위에서 계속한다.


## Focused development map

Start from latest main and the relevant unfinished row in DEVELOPMENT.md / the
depth audit. Do not reread every source or repeat accepted gameplay work.
`scripts/artifact-modules.mjs` is the executable source-order manifest;
ARCHITECTURE.md records ownership. Canonical code is in `src/artifact/`.

### Entry points and first checks

These are initial local reproductions, not a proof that other domains are
unaffected. Cross-domain changes need their union; unknown/shared engine changes
require full Actions validation. Every PR and main push, including documentation changes, keeps the complete CI gate.

| Change | Read first | First focused command |
| --- | --- | --- |
| World/bootstrap seed | world.js `buildWorld`, player.js, career.js | `node scripts/bootstrap-seed-acceptance.mjs` |
| Navigation/async UI | ui-state.js, ui-overlay.js, app.js | relevant `ui-state`, `ui-overlay`, `ui-async` or `ui-mobile-a11y` acceptance in scripts/ |
| Save slots/storage | app.js `loadDB` / `switchSaveSlot`, ui-data.js | `node scripts/ui-async-acceptance.mjs` |
| Save encoding/migration | save.js `packDB` / `unpackDB`, save-migration.js | Actions regression + career; preserve legacy resume |
| Finance/contracts/market | finance.js, contracts.js, contract-*.js, transfer.js | `node scripts/ui-finance-contracts-runner.mjs` |
| Player transactions | state-transaction.js, state-player-actions.js, state-rollback.js, roster.js | Actions regression + contract domain + career |
| Calendar/scouting/scrim | calendar.js, season.js `advanceStep`, timezone-calendar.js, scouting*.js, scrim-partner.js | `node scripts/calendar-scouting-runner.mjs` |
| Medical/development | medical.js, development.js, calendar.js, season.js | Actions medical core/regional/calendar; reproduce only failing seed locally |
| Match/draft/series/patch | engine.js, draft.js, series.js, meta.js, patch*.js | Actions regression + both smoke shards + career |
| Build/module manifest/shared RNG | scripts/build.mjs, artifact-modules.mjs, random.js | `node scripts/check.mjs`, then full Actions |
| CI report/publisher | scripts/ci-run.mjs, sync-standalone.mjs | corresponding `node --test scripts/<name>.test.mjs` |
| Documentation only | relevant doc and referenced code | links/diff review; complete current-head CI |

For one known invariant, run its individual acceptance instead of the whole
domain runner. `npm run check` remains the complete serial local fallback, not
the routine edit loop. Use CI_RESULTS.md for small JSON summaries and failed
logs. Actions owns repeated heavy simulations and production builds.

### Narrow discovery

Find paths with `rg --files src/artifact scripts docs`; then search only the
owning modules and relevant acceptance. For example:

```sh
rg -n 'applyWorldAction|validateWorldAction' src/artifact/state-*.js
rg -n 'switchSaveSlot|loadDB|saveDB' src/artifact/app.js scripts/ui-async-acceptance.mjs
```

When the shell does not expand globs, pass an explicit directory and `-g` filter:
`rg -n 'applyWorldAction' src/artifact -g 'state-*.js'`.
Avoid searching generated `index.html`, `dist/`, and the large champion/system
snapshots unless the change concerns generated output or pinned source data.
Do not infer dead code from name counts: HTML handlers and global concatenation
are real callers. The complete manifest ownership/change map is in
[REFACTOR_R01_AUDIT.md](archive/REFACTOR_R01_AUDIT.md#r08-complete-manifest--dependency-and-change-map).


## Implementation history

[Preserved delivery, design checkpoints, measurements and failures](archive/DEVELOPMENT_HISTORY_2026_10_03.md).
Historical instructions do not supersede this guide or current decisions.

## Latest requested scope and automation (2026-10-03)

The hourly automation prompt was updated while preserving its existing hourly
Asia/Seoul schedule and single-worker execution. It now includes competition-only
data, document freshness, causal draft/match/patch refinement, item purchase
legality/exclusive groups and coordinated healing/armor-reduction utility.
Its detailed system scope includes minions, jungle camps, waves, structures and
objectives with actual match consumers; see SYSTEM_DATA.
User direction: use unified numeric stages, not letter-prefixed task stages;
continue necessary work across every domain, not engine-only development.
Provide a stable playable web URL and directly downloadable offline HTML.

Implemented in this slice: removal of the reproduced gold-timeout winner only;
not complete engine realism, item group legality or camp modeling. The initial
32-match bounded probe had no timeout hits and no gold-behind winners; it cannot
establish real comeback calibration. Original stalled reproduction/log preserved.
The focused ending acceptance covers normal nexus results, stalled failure,
post-70 nexus resolution, unchanged career state and deterministic save resume.
The original ending log incorrectly showed 71+ minutes because the exhausted for
loop advanced t; unresolved matches now fail instead of emitting that bogus result.

Next coherent slice: acquire pinned item group restrictions and reproduce actual
illegal purchases/recipes; implement shared purchase validation and AI selection
with allowed repeated components and atomic inventory handling. Professional
calibration acquisition remains separately blocked on source-host networking;
current static snapshot lacks reviewed group metadata. If acquisition remains
blocked, complete the already reproduced initial-FA gap rather than inventing rules.

Local checks for this slice: 119-module static validation, regression, 19 calendar/engine acceptances in 19 fresh contexts (one compile), ending acceptance and build/standalone parity pass. Final Markdown path audit checks 41 retained documents, zero missing local targets; this does not validate external URLs or every historical claim. Full current-head CI remains required.

Stable delivery: the playable-site workflow consumes only a successful push-to-main
CI run's validated HTML artifact, rejects a superseded main head, and publishes
a launcher, online play.html and identical downloadable LOL-GM.html. No external
API is needed to play. Browser/file origins do not share local saves automatically;
export/import remains the supported handoff. Hosting permission/status must be
verified before reporting a public URL as live.

Ordinary-match before/after parity: 32 seeded games retain full result/log/stats/items exactly. The first parity runner hit sandbox spawnSync git EPERM; original log preserved, baseline source then read via a shell snapshot and the read-only rerun passed. Site assembly checks verify online and downloadable game bytes equal the validated standalone. Hosting API reads are unavailable through the connector endpoint allowlist and shell gh returned Forbidden; actual Pages enablement remains to be verified in its deployment workflow.

Delivery follow-through: PR #163 final head
`de3f451ece5ca061c37d6326039cae1e2c2959a6` passed all 13 required checks in
Actions `37131935751`, including medical core/four seeds/two aggregates and verify.
All seven medical CI_RESULT records succeed. PR/run head, unchanged main and
mergeability were checked before sequential merge
`441169555e249be9c69a26a3a6e38ec1da43ae85`. Standalone HTML is rebuilt from
integrated main. Publication-head CI and actual playable-site deployment still
require success before reporting a live website. This slice does not complete
item exclusive groups, coordinated counters or camp/wave modeling.

Pinned static-source follow-up: the original Data Dragon mirror commit is
confirmed in noxelisdev/LoL_DDragon at `1cf34d485c572a9894c223efd3d66c1e5ad7f22f`.
Its en_US item.json reports version 16.19.1 and 870 cross-mode entries; it has
no explicit exclusive-group fields. Raw file remains `/tmp/items-ddragon-16.19.1-en.json`.
Do not treat all cross-mode entries or absent stack metadata as accepted Summoner's
Rift restrictions. Competition-only source collection remains separate.

## League integration evidence and limits — 2026-10-04

Trigger: the picker mixed numeric first division and generic Challengers second
division, China displayed the wrong alias, and only KR/CN enabled tier two.
Current slice unifies abbreviations and connects all six starting regions to actual
reserve competitions, with new-region mandatory tier twos and L-prefixed naming.

The expanded default first auction failed with KR/CN local pools exhausted:
142 active squads / 898 athletes, 136 still unsigned globally, five squads below
minimum. Original `/tmp/league-initial-market-probe.log` and earlier fixture errors
remain preserved. Generation now adds a source-defined capacity shortfall before
FA conversion: legal squad minimums plus maximum external import capacity.
Existing legal registration/import/budget constraints stay; no mid-bid creation.
The larger initial FA pool is a deliberate capacity tradeoff, not an optimization
or empirical estimate of real professional player populations.

The first fixture also incorrectly required every mixed-league second-tier club
to have a parent. Corrected acceptance permits legitimate independent clubs;
the original failure log remains. Current country origin is still region-coded;
country-level competitions are separately authorized pending work (10.2).
Neither a country-by-country model nor complete roadmap coverage is claimed.

Latest confirmed 10.2 state: club home-country and reserve development/operating
country are separate selectable identities. The reserve need not train in its
parent's country. Domestic tier-two participation is office-approved, not inferred
from a training address; athlete nationality/origin/local eligibility are separate.
The interface, licensed country competition membership, scheduling, office
promotion decisions and save compatibility form the next coherent vertical slice.

Measured generation bottleneck: the added 948 athletes made full default world
generation about 1.8 seconds (1811/1829/1748 ms, 1846 total athletes), and the
unchanged 30-second regression guard rejected the run. Append-only initial supply
now uses a scoped nickname set and player count instead of repeatedly scanning
the entire roster. The index is not saved or retained in live state. Representative
three-world before/after parity compares all players, teams, regions and supply
metadata; focused acceptance also compares ordinary/indexed athlete generation.
Original timeout and baseline evidence are preserved in /tmp/league-* logs.

- 10.3 Broadcast-window connection, confirmed after scope correction: viewers
  must be able to follow all international official series, and each domestic
  league must run one series at a time. Different domestic leagues may overlap.
  Event periods can overlap: Eastern/Western Cup are equal-prestige peers and
  may share a period. Starts alone are insufficient; planned series windows and
  actual overruns must sequence broadcasts and preserve absolute UTC/venue/KST
  display, one daily tick, team availability and saved/pending match references.
  The current scheduler provides venue start slots but lacks verified end-window/
  overrun collision protection. This is pending authorized implementation; do not
  claim that serializing entire tournaments satisfies the corrected requirement.
- Official domestic split defaults now read 스플릿 1/스플릿 2/스플릿 3.
  `region.splitNames` provides office-configured display overrides for each
  region's generated season. Timing/qualification IDs remain numeric. Historical
  saved names stay intact.

Repeated default-world construction remained a measured bottleneck after the
scoped identity index (about 0.65–0.75 seconds per full world). One bounded
serialized initial-world template now keys normalized configuration, generation
seed and fresh static patch input. Each hit parses a separate world and refreshes
only its storage identity; live edits cannot alter the template, different config
or static patch input replaces it, and the cache never grows beyond one entry.
Whole-generated-state seeded parity and mutation-isolation acceptance are required.
The existing regression's old long-brand-only assertion was updated for the user-
confirmed three-letter display alias, still retaining/verifying full invented brand.
The 30-second guard is unchanged; timeouts remain in their original logs.

Whole-generated-state parity passed before/after: baseline 1796/1615/1598 ms;
indexed/template generation 809 ms cold then 102/97 ms warm. Full regression
passes its unchanged 30-second guard after caching. This measures generated-world
creation only, not match speed or end-to-end frame performance. Focused country/
broadcast follow-through is still pending and must not be marked delivered.

## 3.1 아마추어 배경과 선수 이야기 — 승인된 구현 예정 범위

사용자는 정식 3부 리그 추가가 아니라 아마추어 생태계를 이야기의 기반으로 추가하도록 승인했다. **아마추어 경기/리그 시뮬레이션은 돌리지 않는다.** 별도 일정을 촘촘히 계산하거나 모든 아마추어 팀·선수를 상시 생성하지 않는다. 필요한 선수/팀의 배경 이력과 사건을 제한적으로 생성·보존하고 실제 스카우팅 제보, 테스트 참가 및 영입 경로에 연결한다. 기존 선수 생성/entryPath·cohort·관측·관계·이력 시스템부터 조사해 중복 구현을 피한다.

- 목표: 지역 팀 출신 신인, 함께 프로 진입을 준비한 동료, 방출 후 재도전하는 베테랑 등의 이력이 선수를 기억하게 하고 운영 결정에 맥락을 더한다.
- 경계: 아마추어 배경은 가상 세계의 생성 이력이다. 실제 프로 대회 데이터나 계산된 경기 결과로 가장하지 않는다. 상세 경기 통계·가짜 승패 기록을 만들어 능력의 증거로 사용하지 않는다. 이야기 문구만으로 숨은 실제 능력이나 다른 팀의 비공개 정보를 노출하지 않는다.
- 연결: 배경 제보 → 합법적인 관측/테스트 → 기존 영입·계약 명령 → 구단/선수 이력으로 이어진다. 테스트나 영입은 사용자 선택이며 선수의 구원/성공을 미리 정하지 않는다. 2부 진입은 사무국 승인 규칙에 따르고 이야기 사건만으로 참가권을 부여하지 않는다.
- UI: 중요한 새 사건은 짧은 알림 하나로 제공하고 선수 프로필에서 관련 인물·시점·이력을 선택적으로 읽는다. 반복 알림을 묶고 추가 필수 입력/퀘스트를 만들지 않는다. 한국어 문구·오타·일관성·동일 사건 중복 표시를 검수한다.
- 완료 증거: 고정 시드의 안정적인 배경 생성, 영입 전후 인물/이력 참조 일치, 관측 권한, 명령 취소/실패 시 이력 불변, 저장·재접속/기존 저장 호환, 알림 중복 방지, 아마추어 경기 시뮬레이션 미호출을 집중 검사한다. 실제 구현 전에는 완료로 표시하지 않는다.
- 첫 45–55분 단위: 기존 생성/관측/이력 경로를 확인하고 제한된 배경 유형을 선수 프로필과 기존 스카우팅/테스트 진입점까지 연결한다. 기존 관측/테스트 연결이 없거나 전체 단위가 크면 자연스러운 구현 경계와 정확한 후속 상태를 기록한다. 현재 PR의 실패 해결과 필수 CI/순차 병합 기준은 유지한다.

### 이야기 디테일 전체 — 승인된 구현 예정 범위

사용자가 아래 전체 항목을 승인했다. 우선순위는 구현 순서일 뿐 범위를 제외하는 기준이 아니며, 이후 제안 보고에서도 후보 전체와 승인/구현 상태를 보여준다. 현재는 승인 상태이며 구현 완료를 뜻하지 않는다.

| 항목 | 구현 연결과 플레이어에게 보이는 내용 | 경계/완료 기준 |
| --- | --- | --- |
| 아마추어 배경 | 지역 팀 출신·동료와 프로 도전·방출 후 재도전을 프로필/제보에 연결 (3.1) | 별도 아마추어 경기 시뮬레이션 없음 |
| 선수 경력 | 첫 계약·공식 데뷔·첫 선발·첫 우승·은퇴를 경력에 표시 | 실제 기록의 시점/소속/인물 참조와 저장 유지 |
| 육성 발자취 | 발굴→입단→육성→1군 정착 기록 연결 | 실제 구단 육성/출전 경로, 성공 강제 없음 |
| 동료의 진로 | 같은 출신/입단 동기의 승격·이적·경력을 연결 | 생성된 배경 또는 실제 동료 이력만 사용, 비공개 정보 보호 |
| 재대결 | 친정팀·옛 동료·옛 감독과의 실제 경기 전 소개 | 실제 과거 소속/고용과 현재 대진 확인, 능력 보너스 없음 |
| 라이벌 | 반복된 결승·접전·승강 경쟁을 대결 기록과 연결 | 판별 근거 공개, 임의 승패/핸디캡 없음 |
| 구단 역사 | 장기 근속 주장·대표 선수·중요 경기를 구단 역사에 표시 | 검증 가능한 근속/역할/경기 기록에 근거 |
| 영입 평가 | 당시 합법적으로 관측한 보고서와 이후 관측 가능한 활약 비교 | 과거 보고서를 최신 숨은 능력으로 덮어쓰지 않음 |
| 운영 결정의 후속 | 주전 변경·계약 종료·감독 교체와 실제 후속 경로 연결 | 기록된 사실/선택 이유만 표시, 신규 감정 페널티 없음 |
| 은퇴 이후 | 은퇴 선수의 지도자 전환·옛 구단 복귀 경로 | 기존 스태프 자격/직무·채용·계약 권한에 연결, 자동 취업/능력 이전 없음 |
| 팬 기대와 반응 | 기존 명성·목표·성적에 따른 짧은 분위기 표시 | 근거를 설명하고 필수 여론 관리/추가 벌점 없음 |
| 뉴스 | 이적·데뷔·이변·승강·패치·유망주 소식 (12.6) | 실제 사건/공개 정보와 관련 화면 연결, 중복 억제 |
| 시즌 회고 | 주요 인물·선택·경기·성과를 시즌 종료에 묶기 | 실제 기록을 재사용, 반복 장문/가짜 사건 없음 |

### 12.7 기록 기반 이야기 연결과 12.8 구단 역사·시즌 회고

3.1과 12.6을 포함해 위 전체 범위를 구현한다. 12.7은 경력/육성/동료/재대결/라이벌/영입 평가/운영 결정/은퇴 후 경로를 기존 이벤트·권한·프로필에 연결하고, 12.8은 구단 역사/팬 반응/시즌 회고를 실제 기록에 연결한다. 큰 범위는 사건 작성자→관측/표시→저장까지 포함하는 45–55분 세로 단위로 나누고 각 항목의 완료 증거/남은 일을 기존 문서에 유지한다. 구현 순서 때문에 나머지를 제안 상태로 되돌리지 않는다.

공통 기준: 기존 생성·cohort·관계·고용·보고서·공식 경기·역사 시스템을 먼저 조사하고 재사용한다. 신규 표현용 이벤트의 출처/인물/소속/시점과 중복 방지 키를 정의하고, 도메인 상태의 원본을 이중 관리하지 않는다. UI는 짧은 중요 사건과 선택적 상세 읽기로 구성한다. 임의 능력 보너스·승패 보정·성공 강제·필수 미션·추가 벌점/여론 업무는 이 승인에 포함되지 않는다. 관측 권한/과거 자료 보존/실패 rollback/중복 알림/저장 호환과 관련 화면의 실제 연결을 확인해야 완료다. 최종 장기/기기 QA는 계속 보류한다.

## 12.6 뉴스와 실제 사건 연결 — 승인된 구현 예정 범위

실제 게임 사건을 세계의 이야기로 연결하는 뉴스 보강을 승인했다. 기존 news/event 작성자·이력·뉴스 UI를 먼저 조사하고 재사용한다. 이적·스태프 교체·데뷔·이변·승강·패치 및 지원되는 아마추어 제보에서 공개 가능한 실제 사건만 짧은 기사로 제공한다. 선수/구단/대회 링크는 실제 관련 화면으로 이동하고 관심 대상·종류별 필터를 제공한다. 계약 응답/기한 등 처리할 업무는 업무 알림에 두고 선택적인 세계 뉴스와 명확히 구분한다. 동일 사건 중복 기사/알림은 묶어 운영 부담을 줄인다.

기사의 사건 ID·관련 인물·시점과 공개 권한을 유지하고 저장·재접속에서도 이력/필터/읽음 상태가 일관되어야 한다. 가짜 사실·상대팀 비공개 데이터·미계산 아마추어 경기 통계를 기사로 만들지 않는다. 소문 시스템은 별도 제안이며 현재 확정 범위가 아니다. 실제 사건→기사→관련 화면 이동 및 중복/권한/저장 동작을 집중 검증한다. 현재 상태는 구현 예정이며 기존 뉴스 존재만으로 완료로 보지 않는다.

## 전 부문 현실성·편의성 검토 목록 — 전체 문서화

아래 전체 항목을 누락 없이 검토한다. 이는 코드 조사 전 미구현 판정이나 검증 완료 선언이 아니다. 이미 승인된 기능의 결함/연결은 구현하며, 새로운 판정·효과·정책은 근거와 부작용을 구체화해 문서에 구분한다. 대회 데이터만 경험적 보정에 쓰고 확정 가상 규칙·수동 운영 기본값·관측 권한·저장/기록을 유지한다.

| 부문 | 전체 검토 내용 | 판정/편의성 기준 |
| --- | --- | --- |
| 선수 평가 | 현재 실력·잠재력·최근 폼·관측 신뢰도 | 짧은 활약으로 잠재력까지 급등하지 않기 |
| 스카우팅 | 관측 기간·상대 수준·역할·패치별 평가 차이 | 근거·표본·불확실성 표시 |
| 성장 | 출전·훈련 질·역할 안정성·지도자 영향 | 무한 성장/훈련량 만능 방지 |
| 적응 | 이적 후 언어·생활·전술·역할 적응 | 국적 일괄 페널티 금지, 새 효과는 근거 필요 |
| 팀워크 | 함께 뛴 경험·의사소통·선수 교체 | 친밀도와 경기 호흡 구분 |
| 주장/리더십 | 콜 조율·신인 적응·갈등 중재 | 근거 없는 팀 전체 능력 보너스 금지 |
| 출전 경쟁 | 주전·교체·육성 계획과 기대 | 실제 약속/출전의 차이에 따른 반응 |
| 피로/의료 | 훈련·경기·이동·회복 누적 | 회복 효과·관측 불확실성, 기존 의료 깊이 보존 |
| 훈련 | 개인 약점·조합·상대 준비의 시간 배분 | 공유 시간 중복 사용 금지 |
| 스크림 | 목적·상대 수준·숨긴 전략·실험 조합 | 승률을 공식 실력으로 직접 환산 금지 |
| 감독/스태프 | 직무별 책임·전문성·선수 적합성 | 실제 고용/업무/효과 연결 |
| 영입/계약 | 역할·출전·지역·구단 전망 선호 | 돈만으로 동의 보장 금지 |
| 이적시장 | 포지션 수요·대체 후보·기한 | AI/사용자 정보·예산·동의 규칙 동등 |
| 재정 | 현금·장부 수익·지급 시점·채무 | 예상 수입을 가용 현금으로 취급 금지 |
| 구단 운영 | 연고지·육성 거점·시설·스폰서 | 근거 없는 자산 가격/수수료 금지 |
| 리그/사무국 | 국가별 하부·등록·승강·라이선스 | 확정 가상 규칙/사무국 개정의 실제 적용 |
| 일정/이동 | 중계 충돌·초과 시간·이동/준비 | 자동 연결, 감독 수동 시간표 편집 요구 금지 |
| 밴픽 | 숙련도·역할·조합·상대 공개 정보·시리즈 적응 | 단일 티어순 선택 탈피, 공개/비공개 경계 |
| 경기 엔진 | 웨이브·시야·귀환·숫자 우위·사이드·오브젝트 교환 | 골드 우세와 넥서스 승리 조건 구분, 모델 한계 명시 |
| 아이템 | 구매 시점·조합식·중복/배타·팀 치감/방깎 | 검토된 메커니즘을 실제 writer/효과에 적용 |
| 패치/메타 | 챔피언·아이템·룬·미니언·정글·오브젝트 | 밴픽/경기 소비 경로까지 연결, 근거 없는 수치 금지 |
| 티어리스트 | 대중/팀 내부 평가·패치·표본·관측 | 대회 데이터만 보정, 타 팀 비공개 정보 보호 |
| 뉴스/이야기 | 실제 선택/사건과 인물·구단 역사 연결 | 중요 사건만 알림, 선택적 상세 읽기 |
| UI/위임 | 상태·행동·이유·결과, 반복 업무 선택적 위임 | 직접 운영 기본, 권한·해제·실패 피드백 명확 |

줄이거나 없앨 대상도 전체 검토한다: 동일 사건의 뉴스/팝업/알림 중복; 엔진 소유 아이템 구매를 감독에게 매번 요구하는 입력; 실제 소비되지 않는 장식 수치/슬라이더; 의사결정에 도움이 안 되는 상세 훈련 입력; 관측 없이 공개되는 정확한 능력; 스크림 승률/대중 티어 하나로 단정하는 표시; 매 이야기마다 답변/보상을 요구하는 반복 이벤트. 실제 존재 여부와 호출/권한/저장 의존성을 확인한 뒤만 정리한다. 정보 삭제보다 선택적 상세/묶음/위임이 적합한 경우를 구분하고 의미 있는 결정과 기록을 보존한다.

각 항목에 실제 소스/규칙, 재현 조건, 현재 구현/결함/추가 정책 여부, 변경 내용과 사용자 예, 비용/부작용, 검증, 남은 일을 기록한다. 새 적응/리더십 등 효과는 임의 계수를 도입하지 않고 정책안과 구현 결함 수정을 구분한다.

## 10.4 사무국 규정 개정 엔진 — 승인된 연결/고도화 범위

사무국이 세계의 상황을 보고 규정을 개정하는 엔진을 기존 기능에 연결·보강한다. 현재 `office.js:officeDecisions`에는 지표/효용 평가, 구단 의견(`officeFormatConsultation`), 변경 그룹별 간격 제한, 한 회차 안건 수 제한, 공표일/다음 시즌 시행연도 기록이 있다. `office-international.js`의 국제 권한도 함께 조사한다. 이 존재만으로 아래 전체가 완료됐다고 보지 않고 중복 엔진을 만들지 않는다.

1. **관할과 변경 가능 범위:** 지역/국가별 하부/국제 사무국의 권한을 명시한다. 확정된 필수 2부·소유 2군 승격 제한·동의/등록 권한·국제/동일 리그 중계 충돌 금지 등은 임의 효용으로 폐기할 수 없다. 새 정책은 검토된 허용안/범위에서만 선택하고 경기 밸런스 패치는 별도 엔진 권한이다.
2. **개정 근거:** 실제 경쟁 균형·참가/등록 상황·재정 지속성·선수 공급·일정 부담·흥행/관측 지표를 출처/기간/표본과 함께 사용한다. 데이터가 부족하면 유지/보류하고 근거를 남긴다. 가짜 시청률이나 실제 Riot 정책을 발명하지 않는다.
3. **제안과 영향 검토:** 개정 전후 차이, 구단/선수/국가별 하부/등록/일정에 대한 영향을 검토한다. 기존 구단 의견 수렴을 연결하되 사용자에게 상시 투표 업무를 추가하지 않는다. 실현 불가능한 일정·팀 수·선수 공급·재정 요구를 거절/보류한다.
4. **결정/공표/시행:** 의결 결과와 이유, 규칙 버전, 공표일·시행일/시즌, 적용 대회를 기록한다. 이미 진행 중인 대회·완료 기록·체결 계약에 소급 적용하지 않는다. 긴급 개정 예외는 별도 확정 규칙 없이는 만들지 않는다.
5. **실제 적용:** 승강 자격/자리/예선·다음 시즌 멤버십·국가별 2부·등록/라이선스·스플릿/대회 방식·중계 일정의 실제 writer/consumer에 연결한다. 당시 대회 규칙 스냅샷과 pending/save 참조를 유지한다. 기록만 다음 시즌이라면서 현재 규칙을 조기 변경하는지 검사한다.
6. **시행 후 평가:** 개정 당시 기대와 시행 후 실제 지표/부작용을 비교해 유지·보완·재검토한다. 평가 기간/표본과 적용 규칙 버전을 기록하고 한 시즌의 잡음만으로 되돌리지 않는다. 실제 효과를 검증하지 않고 성공을 선언하지 않는다.
7. **안정성/원자성:** 반복 개정/되돌림 진동을 억제하고 동시에 채택된 규칙 간 충돌을 검사한다. 실패 시 규칙·멤버십·재정/권한·이력이 부분 변경되지 않도록 rollback하며 결정 ID로 재접속/재진행 중복 적용을 막는다.
8. **UI/뉴스:** 사무국 화면에서 현행/예고 규칙, 변경 이유/차이, 시행 시점과 내 구단 영향이 보이고 관련 대회·등록 화면으로 연결된다. 중요한 개정 뉴스는 한번 알리며 사용자는 규칙을 직접 편집하지 않는다.
9. **검증:** 근거 충분/부족, 찬반 의견, 개정 유지/채택, 다음 시즌 적용, 필수 규칙 거절, 소유 2군 제한, 과거 기록 불변, 저장·재접속 중복 방지, 충돌/실패 rollback과 AI/사용자 동등성을 고정 시드 집중 시나리오로 확인한다.

첫 45–55분 단위는 기존 개정의 공표/시행과 실제 writer를 추적해 한 개 규칙의 제안→예고→정확한 시즌 적용→UI 설명→저장 경로를 완성하는 것이다. 10.2/10.3과 연결 강한 변경은 한 담당자가 세로로 구현한다. 법정처럼 보이는 새 규칙을 임의로 추가하지 않고 단위별 완료 증거와 정책 근거를 기존 문서에 유지한다. 필수 현재-head CI/순차 병합/검증된 HTML·웹 배포 및 최종 QA 보류는 그대로다.

## 추가 승인 항목의 단일 배치와 중복 방지

사용자는 직전 추가/수정/삭제 검토 목록 전체를 승인했다. 아래는 새 별도 기능 목록이 아니라 각 기존 단계에 한 번만 배치한 현재 실행 기준이다. 같은 의미의 항목을 다른 이름으로 새 제안처럼 반복하지 않는다. 기존 전 부문 검토표 중 아래와 겹치는 내용은 이 완료 조건을 참조한다. 모두 구현 예정이며 실제 코드 조사로 기존/부분/결함/신규를 구분해야 한다.

| 승인 내용 | 단일 담당 단계 | 기존 범위와 관계 / 완료 조건 |
| --- | --- | --- |
| 선수 경력 목표 | 2·4 | 계약 선호 보강: 우승/출전/안정/귀향 선호와 실제 협상 연결, 성격만으로 결과 강제 금지 |
| 역할별 영입시장 수급 | 4 | 기존 수요/대체 후보 보강: 관측 가능한 후보·구단 수요 반영, 임의 가격 가산 금지 |
| 대체 선수/비상 계획 | 2·5·10 | 기존 의료/로스터/등록 연결: 합법 콜업·교체와 실제 출전, 갑작스런 구제 선수 생성 금지 |
| 국제대회 준비 | 6·10 | 기존 훈련/이동/일정 보강: 분석·연습 환경·이동/적응의 준비 시간, 수동 여행 예약 없음 |
| 계약 연속성 | 4·11 | 기존 옵션/임대/지급 연결: 갱신·옵션·복귀·분할 지급의 기한/명령/정산과 통합 안내 |
| 사무국 개정 사후 평가 | 10.4 | 새 연결: 기대 효과와 실제 지표/부작용 비교→유지/보완, 기간/표본 없이 되돌림 금지 |
| 소유주 변화/인수 | 5·11 | 기존 소유주 체계 조사·연결: 목표/가용 투자/운영 방향, 검토되지 않은 인수가격 생성 금지 |
| 공개 정보 전달 시점 | 3·4·12.6 | 뉴스/관측 보강: 확정·등록·공식 발표 구분, 비공개 협상 조기 공개 금지 |
| 대회별 평가 맥락 | 3·12.7 | 평가 보강: 상대·역할·경기 수와 관측 자료, 승률/KDA만으로 동일 가치 단정 금지 |
| 대회별 패치 적용 | 7·9·10 | 기존 패치 스냅샷 연결: 세계 최신과 대회 사용 버전 구분, 시행 시점/준비 영향 UI |
| 감독 권한 | 5·12.4 | 기존 권한 검증: 감독/단장/소유주/2군 감독 UI와 실제 명령 권한 일치 |
| AI 장기 계획 | 4·5·11 | 기존 AI 보강: 예산·계약 만료·육성·역할 수급, 미래/숨은 정보 참조 금지 |
| 경기 결과 설명 | 8·12.4 | 기존 경기/UI 연결: 관측 가능한 전환점·자원/아이템/전술 근거, 미계산 원인 발명 금지 |
| 위임 확인/권한 회수 | 5·12.4 | 기존 선택적 위임 보강: 실제 결정/근거·실패 확인과 이후 권한 회수, 이미 확정된 행위를 무조건 취소하지 않음 |
| 동일 정보의 여러 원본 통합 | 12.4 | UI/저장 보강: 계약·등록·소속의 단일 원본과 파생 표시, 호출/저장 호환 조사 후 통합 |
| 사후에만 보이는 제한 수정 | 12.4 | UI 보강: 비용·등록 자격·기한을 사전에 안내하고 명령 시 최신 상태 재검증 |
| 의미 없는 확인창 정리 | 12.5 | 편의성 보강: 중요한 결정 확인은 유지, 단순 이동/읽기/반복 진행 확인 축소 |
| 수치 반복 평가 문구 정리 | 3·12.5 | 문구 보강: 역할·장점·위험·관측 근거로 설명, 근거 없는 자동 칭찬 금지 |

향후 후보 보고는 먼저 기존 문서/승인 목록과 대조한 뒤 **실제 신규 / 기존 범위 보강 / 중복 제외**를 구분한다. 새 후보 전체를 보여주되 같은 승인 목록을 매번 재승인받지 않는다. 기능 이름 변경으로 범위나 완료 수를 부풀리지 않는다. 기존 명령/수치의 재사용 여부, 변경 이유와 증거, 화면/저장/AI 영향 및 남은 작업을 해당 단계에 함께 유지한다. 새 효과/가격/계수는 승인된 목적만으로 발명하지 않고 검토 가능한 근거와 시나리오를 정의한다.

## 세부 연결·완료 조건 전체 승인

사용자가 직전 전체 세부 검토 목록을 승인했다. 아래 항목은 담당 단계의 완료 조건으로 통합하며 별도 기능 수/완료 수를 부풀리지 않는다. 실제 기존 구현을 조사해 재사용/보강하고 현재 상태는 구현 예정이다.

| 담당 단계 | 승인된 세부 내용 전체 |
| --- | --- |
| 2·3·7 선수/평가 | 역할 수행 이력; 챔피언 숙련의 라인전/운영/교전 경험 차이; 주력 챔피언의 패치 적응; 전향 시 공통 경험과 역할 경험 승계; 선호 역할과 실제 배치; 장기 결장 후 건강/경기 감각 복귀 구분; 역할/대회/구단별 개인 기록; 관측에 따른 평가 갱신 속도; 선수 비교의 조건/표본 차이; 과거 평가 오류 보존 |
| 6·7 준비/전술 | 전술 버전/변경 이유; 연습 목적 달성; 조합 실행 난도와 실패 비용; 상대 전략 정보 최신성; 시리즈 중 공개 정보 갱신; 교체의 전략적 이유; 전술 지시 충돌/실행 가능성; 관측 가능한 전략 실패와 실행 실패 구분 |
| 8 경기 엔진 | 귀환 기회비용; 이동 중 전력 공백; 처치 후 전환 조건; 오브젝트 포기/반대편 교환; 교전 후 잔여 전력; 시야 유효 기간; 직접 관측과 추론 구분; 방어 선택의 가치; 우세 팀 공격의 실제 위험; 결과 설명과 해당 경기 기록의 연결 |
| 4·5·10·11 시장/구단/사무국 | 협상안 조건 비교; 제안 만료/변경 기록; 여러 영입의 예산/등록/계획 의존성; 차기 역할별 계약 공백; 임대 목적과 실제 복귀 판단; 시설 투자 완료/효과 시점; 구단 목표 변경 기록; 대회 참가의 일정/이동/가용 부담; 실제 규정 해석 사례; 개정 예고의 내 구단 영향 |
| 12.6·12.7·12.8 뉴스/기록 | 기사 정정/후속 연결; 사실과 해석 구분; 기록 달성 범위; 구단 역사와 당시 인물 연결; 프로필 사건 묶음; 뉴스 중요도 개인화; 과거 정보의 기준 시점; 반복/과장 문구 검수; 근거 없는 극적 서술 제외; 평범한 사건의 과도한 이벤트화 제거 |
| 12.3–12.5 UI/편의성 | 변경 전후 비교; 관련 정보 제자리 확인; 진행 차단 원인/해결 통합 안내; 비교/필터/스크롤 유지; 확정 전 수정과 규칙에 따른 취소; 단위/기준일 일관성; 비활성 행동 이유; 선수 상세 중복 화면 통합; 의미가 같은 필터/설정 통합; 미연결 기능을 작동하는 것처럼 노출하지 않기 |

공통 제약은 유지한다: 구체적인 효과/숙련 판정은 기존 모델과 근거를 확인하고 임의 계수를 발명하지 않는다. 경기 항목은 실제 집계 모델의 소비 경로를 검증하는 조건이며 정확한 개별 시전/geometry를 구현했다고 주장하지 않는다. 가용·관측 정보만 사용하고 과거 자료·게임 기록·저장 호환과 권한/rollback을 지킨다. 승인된 새 연결은 실제 UI/명령/엔진/save까지 구현·검증한다. 기능 목록/문서 작성만으로 완료를 주장하지 않는다.

후속 제안은 수량을 미리 정하지 않는다. 기존 승인 목록과 대조해 실제 빠진 필요만 제시하고 같은 조건을 새 이름으로 반복하지 않는다. 중요한 누락은 보여주되 추측·정책 변경·실제 결함을 구분한다.

## 지속적인 아이디어 발굴·등록과 판정 정확도 개선

사용자의 최신 지시는 아이디어를 계속 발굴·등록하고 모든 부문의 판정 정확도를 높이는 것이다. 아이디어 등록을 중단하거나 기존 승인 구현 뒤로만 미루지 않는다. 각 실제 개발/소스 검토 중 발견한 내용은 기존 담당 단계에 즉시 등록하고 검토 가능한 실제 보강을 구현한다. 단순 목록 작성이 구현을 대체하지 않도록 한 단위에 실제 코드/화면 연결과 집중 검증을 포함한다. 수량을 정하거나 채우지 않고 전체 새 발견을 보고한다. 기존 범위와 겹치면 조건을 합치되 추가 근거/시나리오는 보존한다.

등록 항목마다 목적/실제 촉발 조건, 기존 소스·규칙/외부 근거, 입력과 단위, 상태 작성자와 판정 소비자, 관측/권한, 효과/비용/부작용, UI 설명, 재현/반례/집중 검증, 저장/rollback/AI 영향, 구현 상태와 다음 작업을 적는다. 아이디어 등록은 해당 기능의 검증 완료나 임의 정책/계수의 확정이 아니다. 현재 합의 내 검증 가능한 개선은 진행하고 확정 규칙을 바꾸는 큰 정책은 별도로 명시한다. 정확도 개선은 더 많은 장식 변수나 근거 없는 수치를 뜻하지 않는다. 패치/단위/조건/적용 순서/관측 경계/시간/동시성의 구체적인 오판정을 줄이고, 구현하지 않은 개별 시전/geometry를 구현했다고 주장하지 않는다.

아래는 직전 전체 제안의 누락 없는 등록이다. 기존 경로를 먼저 조사해 기존/부분/결함/신규를 구분하고, 일치 항목은 담당 단계의 보강으로 통합한다.

| 담당 범위 | 등록한 전체 아이디어 |
| --- | --- |
| 선수/구단 선택 (2·4·5·6) | 계약 종료 후 무소속 활동/테스트/진로; 공개 가능한 제안 거절 이유; 조건 변경에 따른 결렬 후 재접촉과 반복 제안 편법 방지; 같은 주전 자리 중복 약속 등 이행 가능성; 지도자 업무 수용량; 부상/이적/전향에 따른 육성 계획 변경; 역할/챔피언 폭/교체 활용을 고려한 구성; 기존 계약 체계 안의 임대/육성 협력 관계 |
| 대회/세계 연속성 (4·10·11) | 대회별 등록 명단; 이적 확정/계약 시작/등록 완료 사이 참가 자격; 순연의 휴식/훈련/준비 영향 1회 적용; 대회 취소/참가 철회 시 결과/정산/등록 처리 규칙 검토; 계약 만료/임대 복귀/승강/등록/일정 생성의 시즌 경계 순서; 사무국 간 관할/일정/규정 충돌 해결; 개정 공표/준비 기간; 공동/동률 기록의 정확한 표시 |
| 경기 판정 정확도 (8·9) | 동시 사건 처리 순서의 편향; 동일 처치/보조/오브젝트/퀘스트 보상 중복; XP와 골드 별도 경로; 사망/복귀/이동/출전 상태 일관성; 버프 소유/만료/갱신의 실제 효과; 검토된 방어 감소/관통/보호막/회복/치감 적용 순서; 효과 적용 불가 이유; 넥서스 종료 후 행동/보상/통계 확정; 계산 중단을 공식 결과로 저장하지 않기 |
| 정보/기록 신뢰성 (3·10·12) | 평가/티어/사무국의 근거 자료 연결; 누락 정보와 낮은 성적 구분; 데이터 제외 이유; 공개 통계/내부 관측 출처·권한; 인물/구단 이름 변경 후 ID/경력 연속성; 해체/은퇴 후 기록 접근; 실제 계산과 원인 설명 일치 |
| 편의성 (12.3–12.5) | 다음 경기 준비 요약; 다른 계획에 영향을 주는 변경의 미리보기; 핵심/펼쳐보기 정보 밀도; 날짜 진행 후 최근 작업 맥락 복귀; 대량 작업의 부분 실패와 안전한 재시도; 중요도 낮은 자동 팝업 축소; 반올림/단위/기간 표현 통합; 미소비 설정 연결/제거; 고급 분석 읽기 기본 강요 제거 |

아마추어 경기 시뮬레이션 금지, 프로 대회 데이터만 경험적 보정, 확정 가상 규칙, 원본/진단/게임 역사 보존, 한 담당자·시간당 45–55분 구현 단위, 정확한 PR head 필수 CI·순차 병합·검증된 웹/HTML 배포와 최종 QA 보류는 유지한다. 변경 없는 검토를 반복하지 않고 개발에서 새 근거와 재현을 찾는다. 의미 있는 새 발견·구현·실패만 보고하며 문서 등록과 배포된 기능을 구분한다.

## 12.9 분석실 독립 탭 — 첫 조회 흐름 구현, 확장 진행 중

사용자는 FM처럼 별도 분석실 탭에서 분석 기능을 사용할 수 있게 요청했다. 분석실을 메인 내비게이션의 독립 화면으로 추가하고 실제 자료와 근거를 한곳에서 비교한다. 기존 `ui-patch.js:patchAnalystCard`, `ui-opponent-report.js`, `ui-opponent-draft.js` 및 분석/관측 집계를 먼저 재사용한다. `ui-state.js:UI_ROUTES`에 analysis 경로와 메인 분석실 탭을 추가했다. 첫 구현은 관리 구단의 기존 관측 보고서와 상대 공개 보고서의 실제 조회 흐름이며, 아래 전체 분석 영역의 완료를 뜻하지 않는다. 실제 패치 노트/규칙과 분석 화면을 혼동하지 않게 구분하며 기존 명령·저장 원본을 복제하지 않는다.

| 분석실 영역 | 실제 연결 기준 |
| --- | --- |
| 우리 팀 | 관리 권한이 있는 1군/2군의 공식 경기·허용된 연습 관측, 역할/조합/전술/성장·피로 분석. 숨은 능력을 보고서의 관측값으로 노출하지 않음 |
| 상대 분석 | 실제 공개 로스터·출전·픽밴·운영 기록, 현재 선수와 당시 소속 구분, 타 팀 비공개 연습 제외 |
| 경기 복기 | 기록이 지원하는 자원/구매/교전/오브젝트 전환점과 결과 이유, 해당 경기 기록으로 이동. 없는 위치/시전 정보를 만들어 표시하지 않음 |
| 밴픽·메타 | 별개의 대중 티어/팀 내부 티어, 역할/패치/대회/기간별 표본과 픽밴·조합. 공개/비공개 권한과 관측 불확실성 유지 |
| 선수 비교 | 당시 보고서와 현재 관측, 역할/상대/출전 표본을 맞춘 비교. 평가 근거로 이동 |

공통 조건은 관리/공개 범위, 기간·대회·패치·역할·표본/누락·출처가 보이는 것이다. 적은 표본/여러 패치/집계 연습의 모델 차이를 안내하고 인과 효과로 단정하지 않는다. 표/차트는 지원되는 실제 자료만 사용한다. 자료가 없으면 왜 없는지와 합법적으로 자료를 얻는 경로를 보여주고 빈 화면을 가짜 수치로 채우지 않는다.

분석 결과에서 관련 선수/구단/경기/패치로 이동하고 사용자가 전술·훈련에 반영할 때는 기존 실제 설정 화면/공유 명령과 조건 안내로 연결한다. 추천을 무조건 자동 적용하거나 추가 필수 분석 업무를 만들지 않는다. 기간/비교/스크롤 맥락을 유지하며 담당 모듈/집계 진입점/검증을 명시한다. 단순한 명시적 인터페이스로 분석실 화면과 엔진 집계를 분리하고 FM 자산/문구를 복제하지 않는다.

첫 45–55분 구현 단위: 현재 PR의 필수 CI 실패 해결/중복 작업 확인 후 별도 분석실 모듈·메인 탭·공통 라우터를 추가하고 기존 공개/권한 있는 보고서 중 완전한 조회 경로부터 연결한다. 실제 조회→필터/자료 없음→관련 화면 이동→세계/슬롯 변경 시 맥락 초기화·권한 재검증을 집중 확인한다. 나머지 영역은 정확한 남은 경로를 기록해 이어서 구현하며 가짜 탭이나 전체 완료 선언을 피한다. UI 전면 재설계/현재-head CI/순차 병합·배포·최종 QA 보류 기준을 유지한다.

## 감독 커리어·분석 도구·효과 판정·사용성 전체 승인

사용자가 직전 목록 전체를 추가하도록 승인했다. 아래 전체 내용을 기존 단계의 구현/검증 범위에 통합한다. 기존 상태/소스 확인 후 재사용·연결·결함 수정·신규를 구분하며 현재는 승인/구현 예정이다. 정책/메커니즘 근거 없이 가격/효과/성공률을 만들지 않는다.

| 담당 단계 | 승인된 전체 내용 |
| --- | --- |
| 5·11·12 감독 커리어 | 감독 경력 페이지; 구단 목적별 채용 기준; 감독 계약/권한/목표/여건 제안 비교; 취임 인수인계; 이직 후 구단 상태/계획 연속성; 근거 있는 해임/사임 이유; 실제 공석/조건과 구단 지원; 플레이어의 실제 선택에서 형성된 감독 스타일 평가 |
| 3·12.9 분석실 도구 | 당시 패치/조건/원자료를 고정한 보고서 저장; 관심 선수/조합 묶음; 선택적 사용자 메모/태그; 비교 기준 저장; 원자료/해석/사용자 메모 구분; 패치/역할/상대 차이 경고; 동시 변화의 원인 단정 방지; 선택/강팀 표본 편향 안내; 역할별 자원 대비 성과; 권한 내 보고서 내보내기; 분석→기존 준비 계획의 적용 전 변경 비교 |
| 8·9 효과 판정 | 피해 유형별 대응; 공격 접근 가능성과 사거리; 순간/지속 피해와 교전 시간; 핵심 효과 가용 상태; 실제 보호/공격 대상; 과잉 효과의 유효 가치; 실제 유효 회복/보호막; 제어 효과 종류; 아이템/룬 적용 조건; 자원 부족에 따른 행동; 대상 변경/중단 비용; 웨이브/방어/시간을 포함한 구조물 공격 조건 |
| 12 사용성/저장 | 선수/구단/대회/규칙 통합 검색; 즐겨찾는 화면; 선택적 첫 화면 안내; 문맥 용어 사전; 글자 크기/표 밀도; 권한 내 정확 수치/요약 표현; 저장 구단/시즌/게임 날짜/빌드/시점 정보; 기존 저장/새 게임 변경 차이 안내; 덮어쓰기/불러오기 실패 시 정상 저장 보호; 실제 업데이트 요약; 행동별 도움말; PC 단축키와 작은 화면 기능 동등성 |
| 3·5·8·12 제거/수정 검토 | 여러 화면의 중복 확정 절차; 분석가 부족 때문에 공개 원자료까지 숨기는 방식; 표본 수만으로 정확성을 단정; 역할 무시 KDA/승률 순위; 스태프 한 명의 전 업무 만능 효과; 모든 AI 구단의 같은 목표/영입/전술; 메뉴 개수만 늘리는 독립 화면; 새 사건 없는 반복 불만/팬 반응; 실제 원인과 무관한 장식 그래프; 영향 설명 없는 옵션 |

효과 판정은 검토된 패치 메커니즘과 지원하는 모델/자원의 실제 writer→consumer→결과를 검사한다. 집계 모델을 정확한 개별 시전/geometry로 과장하지 않고 일부 메커니즘만 구현된 경우 지원 범위를 표시한다. 생활/커리어·분석은 관측/고용/계약/진행 권한을 지키며 숨은 정보를 내보내지 않는다. 스태프 전문성은 해석/업무 효과와 공개 원자료의 접근을 구분한다. 표본 수가 많아도 편향/조건 혼합을 제거한 것으로 간주하지 않는다.

각 단위의 실제 화면/명령/상태/저장 연결과 반례 검증을 기록한다. 공개 웹과 다운받은 HTML 양쪽의 작동을 고려하되 최종 장기/실기기 QA는 선행 조건 충족 전 보류한다. 새 아이디어는 지속 등록하고 동일 승인 기능은 한 번만 배치한다.

## 후속 발견 등록 — 검토 후보, 구현 완료 아님

지속 발굴 지시에 따라 다음 누락 후보를 등록한다. 직전 승인 범위와 겹치면 기존 완료 조건에 통합하고, 실제 소스 검토/규칙 근거 전 미구현·확정 정책으로 단정하지 않는다.

- 대회 예외: 부전승/기권과 실제 경기 통계 분리; 시리즈 조기 확정 이후 불필요 경기 미실행; 동률 절차의 우선순위/사유; 재경기/무효 경기의 공식 통계 편입 규칙; 참가팀 변경 후 대진/시드/등록 일관성; 조건부 출전권의 최종 확정 상태; 국가별 2부와 상위 리그의 일정 경계; 팀별 휴식/이동 편중 점검.
- 밴픽 경계: Fearless 규칙별 사용 제한 범위; 시리즈 내 역할/선수 교체 후 금지 이력 유지; 챔피언 사용 가능 날짜와 대회 패치 동시 검사; 유효 조합이 없는 예외의 사전 처리; First Selection 선택/잔여 선택의 중복·순서 오류; 마지막 순간 로스터 변경 시 준비 보고서의 오래된 조건 안내.
- 판정 검증: 동일 입력/패치/시드 재현; 블루/레드 교환 대칭 시나리오; 표기/정렬만으로 난수 소비가 달라지는지; 경계값/반올림의 판정 영향; 결과에 영향을 주지 않는 변수가 설명 원인에 등장하는지; 실제 계산과 집계 연습의 결과 구분; 작은 규칙 변경의 과도한 효과와 상호작용; 재현용 최소 상태/규칙/seed 보존.
- 세계/경제 예외: 약속된 수입 미입금과 실제 가용 현금 구분; 구단 해체 후 보존할 지급/계약 의무; 스폰서 조건과 스포츠 권한 충돌 검토; 이미 약속된 시설/고용 지출과 자유 예산 분리; 참가팀 부족 시 사무국의 합법 유지/보류 경로. 새 계약 정책/가격은 근거 검토 대상이다.
- 웹/오프라인: 저장 용량/브라우저 제한 사전 안내; 저장 실패 시 성공 메시지 금지; 다운로드 HTML/웹 빌드·대회 패치·게임 날짜 구분; 웹 업데이트 중 진행 작업/정상 저장 보호; 내보내기 파일의 무결성/호환 검사; 외부 접속 없는 상태의 기능 지원 범위; 사용자 메모/대상 이름 입력의 안전한 표시. 기록 삭제/유료 서비스 도입으로 문제를 숨기지 않는다.

각 항목은 기존 담당 단계에 소스/실패 재현/권한/실제 소비/UI/save 검증을 붙여 검토한다. 재경기/스폰서 등 새로운 정책이 필요한 항목은 확정 규칙을 발명하지 않는다. 검증 활동은 짧고 대표적인 시나리오로 제한하며 최종 장기/기기 QA와 혼동하지 않는다.

## 10.1 연결 검증 / 초기·후속 시장 병목과 조직 권한 보강

PR #164의 이전 head `3385154d2dfb77076ef549790e07a2494e88f83a` 필수 CI `37143840624`에서 core smoke의 35초 제한 및 ui-finance-contracts의 훈련 기회비용 검사가 실패했다. 이 실패는 그대로 보존한다. 최종 head의 성공·병합 상태는 위 현재 방향에 기록하며 이전 실패를 성공으로 바꾸지 않는다.

- 원인/측정: `/tmp/league-smoke.cpuprofile`에서 `marketDemandSnapshot`과 `activeTeams`가 주요 CPU 소비였다. 수요 캐시가 적중해도 가격 조회마다 전체 선수 키와 활성 1부 목록을 다시 만들었다. 확대된 초기/후속 시장의 가격·후보 정렬에서 반복됐으며 제한을 올리지 않았다.
- 구현: `contract-market-pricing.js`가 시장 수요/가격과 동기적인 topology-read 인덱스를 소유한다. `initialMarketSnapshot`, `eligibleFillFAs`, `aiMarketOfferCandidates`의 선수/팀 구성 불변 조회 범위에서 기존 키의 연도·선수 수·지역별 1부 수를 한 번 구한다. WeakMap 인덱스는 finally로 제거되고 세계/save에 저장하지 않는다. 입찰·계약·추가/은퇴/시즌 변경은 범위 밖에서 기존 재검증/캐시 무효화를 유지한다. 새 모듈은 5500자 제한이며 기존 contracts.js의 26000자 제한은 유지한다.
- 동일성: `market-reserve-acceptance.mjs`는 최적화 비활성 기준과 모든 지역 가격/정렬·FA 보충 후보·AI 후보·전체 세계 상태를 비교한다. 실제 초기 입찰 라운드의 제안/영입 결과와 계약/재정/관측/이력 포함 전체 상태도 일치했다. 전역/미상 지역, 중첩/예외 정리, 범위 종료 후 선수 수/연도/활성팀 변경 확인도 통과했다.
- 성능의 범위: 같은 VM의 대표 지역별 가격 일괄 조회에서 기준 794/826ms, 인덱스 83/89ms를 관측했다. 이는 가격 조회 측정이며 전체 경기 엔진이나 모든 UI가 그 비율만큼 빨라졌다는 뜻이 아니다. 120모듈 최종 core smoke는 기존 35000ms 제한에서 28002.6ms에 통과했다. 과거 실패/프로파일은 `/tmp/league-smoke-*`와 GitHub CI 로그에 보존한다.
- 드러난 실제 권한 결함: 최소 로스터 보충에서 관리 모구단은 system을 사용했지만 소유 2군은 ai로 실행되어 공유 validator에 거절됐다. 수동 관리 조직은 모구단/2군 모두 계약 권한을 지키며 기존 최소 보충만 system 경로를 사용한다. 일반 AI 영입/팀 옵션/재계약은 관리 조직을 침범하지 않는다. 소유 2군 감독의 계약 권한이 모구단에 있는 기존 정책은 유지한다. 집중 검사에 실제 reserve market 보충과 AI 직접 계약 거절을 추가했다.
- 테스트의 별도 원인: `cohesion-practice-acceptance`가 풀의 첫 삽입 챔피언을 실제 훈련 대상으로 가정했다. 확대 세계의 선택 선수에서는 해당 챔피언이 훈련되지 않아 실패했다. 대상 하나를 임의 고르지 않고 실제 전체 챔피언 훈련량과 개인 훈련의 상반된 변화가 모두 있는지 검증한다. 공유 시간/연간 성장 소비/코칭/AI/저장 검증은 유지했고 production 훈련 판정은 바꾸지 않았다.
- 로컬 증거: 시장/입찰 동일성·조직 권한, 훈련 기회비용, 리그 표시/6개 실제 2부/최초 합법 로스터, 기존 30초 회귀, 120모듈 검사·standalone 빌드 통과. 필수 전체 CI는 최종 커밋 head에서 별도 성공해야 한다. 아직 국가별 2부/중계 충돌/분석실/전면 UI 재설계가 구현됐다는 증거는 아니다.

이 head의 필수 CI·순차 병합은 완료했다. 검증된 main 배포를 확인하고 10.2/10.3과 12.3/12.9 중 실제 연결 경계가 명확한 한 단위를 이어간다. 분석실 첫 조회 흐름은 아래 12.9 증거와 PR #165로 구분한다. 이미 승인된 전 범위·지속 발견은 유지하며 장기/실기기/TalkBack QA는 보류한다.

### 동일 Node 22 러너 기준 추가 병목 보강

최적화 head `2ca892806e7b88c99526c65e3e7ca6d89e0d6978` CI `37147169602`는 UI/계약·리그/일정·회귀 등에서 통과했지만 core smoke가 35초 제한에 다시 실패했다. 로컬 Node 24 통과만으로 병합하지 않았고 `/tmp`에 Node 22.23.3 실행기를 준비해 CI와 같은 버전으로 대표 측정했다. 기존 시간/메모리/검사 범위를 늘리지 않는다.

Node 22 CPU 프로파일에서 `activeTeams`가 가장 큰 누적 소비였다. 후보/제안의 topology-read 범위까지 인덱스를 연결하고, `world.js`의 `withActiveTeamReadIndex`가 그 동기 구간에서만 지역/부문 조회를 재사용한다. 반환 배열은 항상 복사해 호출자 sort/reverse가 다른 조회 순서를 바꾸지 않는다. finally에서 제거하고 로스터/계약 실행 전 범위를 끝내므로 쓰기 이후 조회는 실제 최신 상태다. 타입/미상 지역/기본 부문 필터 의미, 중첩/예외 정리, 전체 입찰 상태 동일성 검사를 유지·확장했다.

같은 Node 22에서 대표 core smoke가 29675.3ms(수요 read 범위)에서 24583ms(활성 팀 read 포함)로 줄었다. 최초 로스터 구간은 13017.9→8379.2ms였다. 프로파일 오버헤드/런너 환경이 달라 CI 시간 보장이나 전체 경기 속도 비율로 일반화하지 않는다. 정확한 최신 head 필수 CI가 통과하기 전에는 여전히 병합/배포 완료가 아니다. 원래 실패와 원본 측정을 보존한다.

최종 Node 22 전체/핵심 smoke는 각각 26725.7/26591.3ms에 통과했고 live 세계·후속 시장·시리즈·저장 세계·저장 시장의 canonical fingerprint가 모두 동일했다. 이 실행은 fingerprint 작성 비용을 포함한다. 필수 CI 최종 head 확인은 여전히 별도 gate다.


### 12.9 첫 분석실 구현 증거와 다음 경계

- 화면 소유: `src/artifact/ui-analysis.js`의 `viewAnalysis`/`bindAnalysis`. 내비게이션과 일시적 `ANALYSIS_SET`은 `ui-state.js`, 메인 탭은 `shell.html`이다. 기존 보고서와 엔진 원본을 복제하거나 새 게임 저장 필드를 만들지 않았다.
- 실제 경로: 분석실 → 우리 팀/상대 준비 → 관리 권한이 있는 1군·소유 2군 선택 → 최근 30/90일·전체 기간, 패치, 기록 역할 필터 → 공식전/엔진 스크림/집계 연습 구분, 전술 및 분석가 관측, 상대 공개 선수/픽밴 보고서. 없는 패치/표본은 자료 없음으로 표시한다.
- 운영 연결: 선수단·훈련·전술, 일정·경기 기록, 패치·메타 자료로 공통 라우터를 통해 이동한다. 소유 2군을 선택한 경우 선수단 화면도 같은 구단을 선택한다. 기존 실제 명령에서 사용자가 직접 설정하며 분석이 자동으로 전술/훈련을 바꾸지 않는다.
- 권한/연속성: 조작된 외부 관찰 구단 ID는 권한 있는 구단으로 되돌린다. 2군 감독은 관리 2군만 조회하고 부모 구단 비공개 연습에 접근하지 않는다. 해임 후 비공개 보고서를 제공하지 않는다. 세계/저장 슬롯 교체 시 모든 분석 조건을 초기화하고 다시 권한을 확인한다. 단순 조회/필터/이동은 게임 원본을 변경하지 않으며 저장·재로드 뒤 기존 보고서를 다시 읽는다.
- 집중 검증: `scripts/analysis-room-acceptance.mjs`는 실제 공식 경기·연습 기록과 렌더러/이벤트 바인딩을 이용해 필터, 외부 ID, 상대 비공개 자료/숨은 능력 접근 차단, 2군/해임 권한, 이동, 원본 불변성과 저장 연속성을 확인한다. 공통 라우팅·비동기·기본 접근성 계약 검사도 통과했다. 추가로 실제 Chromium에서 필터/상대 선택/보고서 표시와 키보드 이동, 1280px·320px 문서 가로 넘침 없음 및 페이지 오류 없음을 확인했다. 실행 환경 정책이 file URL 탐색을 막아 동일 standalone HTML을 브라우저 문서에 주입했다. 실제 호스팅·실기기·TalkBack 최종 검증 완료를 의미하지 않는다.
- 남음: 경기별 전환점 복기, 티어의 추가 대회/상대/조합 맥락과 고정 보고서(첫 분리는 아래 12.9.1), 맥락을 맞춘 선수 비교, 보고서 고정/관심 목록/메모/조건 저장/권한 내 내보내기. 기존 보고서의 직접 선수·경기 근거 링크와 대회별 필터도 해당 영역 구현에서 연결해야 한다. 전체 분석실이나 전면 UI 재설계가 완료된 것은 아니다.
- 새 확인점: 기존 보고서 조회를 한곳에 모으는 것과 평가 소비자·권한 있는 근거 이동을 완성하는 것은 별도 경계다. 이를 새 중복 기능으로 늘리지 않고 기존 12.9 완료 조건으로 유지한다. 정확한 신규 PR head CI·순차 병합 및 main 배포가 성공하기 전에는 배포된 기능으로 표시하지 않는다.

검증 실패 원본: 첫 통합 검사는 신규 fixture 추가 후 고정 VM context 수가 54→55로 바뀌어 실패했다. 기존 검증을 제거하지 않고 새 fixture를 포함한 정확한 기대 수로 수정해 Node 22 통합 검사가 성공했다. sandbox의 프로세스 생명주기 검사/Chromium 소켓 제한과 file URL 탐색 제한도 기록하며, 허용 네트워크 실행에서 프로세스 검사와 동일 HTML 브라우저 주입 검사를 수행했다.

첫 화면 브라우저 점검에서 필터 재렌더링으로 기존 입력 요소가 교체되는 것을 확인하여, 동일 필터/조회 모드의 키보드 포커스를 새 요소에 복원했다. 공통 컨트롤 스타일을 재사용해 좁은 화면의 조건 선택을 세로로 배치했고, 필터 포커스 연속성을 실제 Chromium과 이벤트 검사에 추가했다.


### 12.9.1 대중·팀 내부 티어의 실제 평가 연결

상태: PR #166의 정확한 최종 head CI, 순차 병합, main CI·standalone-sync 및 Pages 배포 성공을 위 현재 지점에 기록했다. 이는 티어의 첫 분리/연결 완료이며 전체 분석실 완료가 아니다. 다음 비교/대회 근거 연결은 아래 12.9.2에서 구분한다.

| 흐름/책임 | 실제 구현과 완료 경계 |
| --- | --- |
| 대중 티어 | `analysis-tiers.js:publicChampionTiers`는 공개 공식 경기와 현재 패치 규칙만 사용한다. 비공개 구단/선수 자료를 전부 접근 차단한 새 저장 복원본에서도 같은 결과를 확인했다. 기존 `ui-patch.js`의 밴픽 빈도 등급/표본 없을 때 패치 예상 순위 규칙을 `championTierLabels`로 재사용한다. 검증된 외부 대회 보정 자료를 수집했다고 주장하지 않는다. |
| 팀 내부 준비도 | `internalChampionTiers`는 관리 권한과 해임 상태를 먼저 확인하고 선택 구단의 현재 명시적 주전 배치만 읽는다. 선수별 숙련과 기존 구단 메타 연구/분석·스크림 지원/전술을 밴픽 평가 소비자 `draftPickValue`에 연결한다. 미훈련 챔피언의 기존 기본 평가값은 실제 숙련 관측으로 표시하지 않는다. |
| 공용 평가/행동 동일성 | `draft.js:draftTeamMetaAssessment`로 기존 세션의 구단별 메타 평가를 분리했다. 모든 기존 계수·잡음·표본 가중치·배열 순서를 유지한다. 검증된 이전 main의 `createDraftSession`을 테스트 전용 원본으로 보존하고 3개 seed의 메타 값 및 전체 픽/밴/배치/설명 동일성을 확인했다. 표시된 내부 후보의 역할별 점수/요인도 실제 새 드래프트와 동일하다. |
| 화면/명령/근거 이동 | `ui-analysis-tiers.js`는 분석실 밴픽·메타 → 대중/내부 전환 → 후보 역할/챔피언 검색 → 평가 요인 펼치기 → 실제 챔피언 규칙 또는 해당 선수 상세/선수단 이동을 연결한다. `ANALYSIS_SET`은 일시적 UI 조건이며 세계 교체 시 초기화한다. 새 영입/훈련/아이템 수동 입력 업무를 추가하지 않는다. |
| 자료·상태 한계 | 대중 후보 역할은 현재 챔피언 설정을 좁히는 조건이며 밴을 특정 역할에 귀속하지 않는다. 날짜 미확인/미도래 자료는 파생 공개 표본에서 제외하고 원본은 보존한다. 과거 패치 당시 내부 상태를 현재 숙련으로 복원하지 않는다. 내부 평가는 현재의 사전 후보 상대 순위이며 승리 확률이 아니다. 상대 픽/현재 조합/Fearless/시리즈 경험은 아직 이 표의 맥락에 연결하지 않았다. |

- 플레이 예: 우리 팀 미드의 특정 챔피언 숙련 기록이 바뀌면 내부 후보의 실제 숙련 기여가 바뀌지만 대중 티어는 그대로다. 주전 슬롯이 비었거나 외부 선수를 가리키면 분석 조회가 배치를 자동 보정하거나 외부 선수의 비공개 건강/숙련을 읽지 않는다. 기존 선수단에서 실제 배치를 확인해야 한다.
- 검증: `scripts/analysis-tiers-acceptance.mjs`의 실제 공식 경기, 공유 평가/전체 드래프트 seed 동일성, 공개/비공개 getter 접근 차단, 과거 상태/잘못된 배치/미도래 기록, 표시/전환/검색/선수·챔피언 링크, 2군/해임/저장 재로드. Node 22 UI·재정·계약 통합 검사의 57개 acceptance, 독립 엔진 context 56개 및 123모듈 검사/standalone 빌드가 단기 증거다. 최종 head CI는 별도 필수다.
- 실제 Chromium: 공식 경기 1전 자료를 만들어 내부 전환/요인 펼치기/역할 필터 포커스/챔피언·선수 상세 이동/검색 빈 상태를 확인했다. 1280px·320px 문서 가로 넘침과 페이지 오류가 없었다. 동일 HTML 문서 주입 검사이며 공개 사이트 실응답·실기기/TalkBack 최종 검증을 뜻하지 않는다.
- 이번 확인점을 기존 승인에 통합: `starterFor`는 조회 중 배치를 초기화할 수 있고 `createDraftSession` 전체는 양쪽 전술/지원 자료를 읽는다. 조회 화면은 명시적 배치와 권한 있는 구단별 평가만 재사용한다. 공개/내부 권한과 조회 순수성의 완료 조건이며 별도 새 기능 수로 늘리지 않는다. 현재 패치의 날짜 미확인 원자료가 있으면 내부 평가를 보류한다. 이 방어는 기존 모든 엔진 표본 경로를 전수 정비했다는 증거가 아니다.
- 다음 자연스러운 45–55분 경계: 공개 티어와 내부 준비도를 같은 후보/역할에서 나란히 비교하고 실제 차이 이유를 연결하되, 기존 관측 집계와 같은 점수를 재사용한다. 대회별 필터 및 실제 선택 조합/공개 상대 맥락 중 완전한 조회→근거 이동→권한/저장 경계부터 연결한다. 보고서 고정/관심 목록·메모/권한 내 내보내기와 전체 경기 복기/선수 비교는 다음 단위로 남긴다. 외부 보정/경험적 등급 재설계는 검증된 프로 데이터와 정책 검토 전에 발명하지 않는다.

추가 단기 증거: Node 22 기존 회귀 검사와 core smoke 통과(core 26.3초, 기존 35초 제한 유지). 이는 평가 함수 분리 후의 관련 회귀 증거이며 전체 성능 향상이나 장기 최종 QA 완료 주장으로 사용하지 않는다.


### 12.9.2 같은 후보의 대중·내부 티어 비교와 대회 근거 이동

상태: PR #167의 정확한 최종 head 필수 CI, 순차 병합, main 재검증·HTML/Pages 배포 성공을 위 현재 지점에 기록했다. 새 게임 정책이나 평가 계수를 추가한 단계가 아니다.

| 흐름/소유 파일 | 구현·완료 경계 |
| --- | --- |
| 같은 후보 비교 | `analysis-tiers.js:championTierComparison`은 기존 공개 등급과 권한 있는 현재 내부 평가를 챔피언 ID/선택 후보 역할로 결합한다. 내부 순위/실제 점수·요인을 그대로 사용하며 서로 다른 등급을 차감·합산하거나 차이를 인과 효과로 주장하지 않는다. 유효 내부 후보가 없으면 현재 배치/패치/권한 이유를 표시한다. 공식 사용 제한 챔피언은 주전 미배치로 오인시키지 않고 실제 사용 제한 사유를 구분한다. |
| 실제 대회 조건 | `ui-analysis.js:analysisFilter`의 대회 조건은 공개 공식 기록과 기존 우리 팀/상대 보고서에 연결된다. 대회 후보는 날짜가 확인된 실제 공개 원자료에서만 추출해 미래 기록만 있는 대회를 노출하지 않는다. 대회별 공식 1전+1전 fixture에서 전체 공개 2전과 선택 대회 1전을 구분했다. 기존 연습 비교 소비자는 대회 조건이 스크림에 해당하지 않으므로 연습을 제외하고 이유를 표시한다. 내부 준비도는 현재 패치 전체/지역 메타 및 구단 자료를 사용하며 선택 대회/기간에 맞춰 과거 내부 상태로 재계산하지 않는다. |
| 화면·근거 이동 | 독립 `ui-analysis-comparison.js`는 밴픽·메타 → 나란히 비교 → 대회/역할/검색 → 후보별 실제 요인 → 선수/챔피언 상세 또는 실제 공개 대회·패치 원자료 화면으로 연결한다. 공개 기록 이동은 대회/패치/기간/후보 역할을 유지하고 이전 구단·선수·상대·실제 픽 역할·진영 조건을 초기화해 공개 분모가 다른 팀의 자료나 역할별 밴 추정으로 바뀌지 않게 한다. |
| 실제 출처·날짜 경계 | `publicTierSourceGroups`는 확인된 날짜의 공식 원자료를 대회·기록 패치별 경기 수/최초·최종일로 묶는다. 미상 대회·패치를 추정하거나 이동 불가능한 가짜 버튼을 제공하지 않는다. 기존 원자료 화면이 비교에서 제외한 미도래/날짜 미확인 기록을 다시 포함할 수 있는 반례를 확인했으므로 해당 출처의 이동은 검토 전 보류하고 이유를 표시한다. 비교 표의 유효 표본은 계속 제공하며 원본 기록은 삭제/변조하지 않는다. 이는 기존 모든 메타 소비자의 날짜 판정을 정비했다는 뜻이 아니다. |
| 유지보수·상태 | 평가/집계는 엔진 모듈, 화면·이동은 비교 UI 모듈, 조건은 일시적 `ANALYSIS_SET.comp`에 둔다. 세계 교체 시 대회 조건도 초기화하고 저장 스키마/계수/RNG/게임 기록을 변경하지 않는다. 별도 프레임워크/의존성이나 새 강제 업무가 없다. |

- 플레이 예: 특정 대회의 관측 빈도는 낮지만 우리 미드의 숙련·기존 전술 효용이 높으면 같은 후보 행에서 공개 등급과 내부 순위/숙련/실제 기여를 볼 수 있다. 차이가 숙련 때문이라고 자동 결론 내리지 않으며, 대회 빈도와 실제 선수·구단 평가의 다른 기준을 설명한다. 상세 기록 보기 후 분석실로 돌아와 대회/후보 역할/검색을 유지한다.
- 집중 검증: `scripts/analysis-comparison-acceptance.mjs`는 실제 엔진 공식 2전의 대회별 분모, ID/역할 결합, 기존 내부 점수 동일성, 실제 `practiceChampion` 누적 writer → `growPlayer` 시즌 숙련 writer → 밴픽 소비자/내부 준비도 변화를 검증했다. 연습을 즉시 별도 승률 보너스로 가산하지 않으며 이 검사는 특정 일일 훈련 조작 흐름을 새로 구현했다는 증거가 아니다. 공개 결과 독립성, 상대 비공개 getter 차단, 허위 관찰자/소유 2군·해임, 조회 순수성, 저장 복원, 미도래 원자료 보존/이동 차단, 실제 필터/포커스/출처 이동의 초기화도 확인했다.
- 실제 Chromium: 동일 빌드 HTML 주입으로 1280px/320px 렌더링, 비교 전환·평가 펼치기·대회/역할 필터의 키보드 포커스, 검색 빈 상태, 공개 기록/선수/챔피언 상세 이동과 되돌아온 조건 유지, 미도래 출처의 가짜 버튼 없음, 페이지 오류/문서 가로 넘침 없음을 확인했다. 실기기/TalkBack/공개 HTTP 최종 QA와 구분한다.
- 검증 중 보존 사항: 초기 신규 fixture의 대회 ID가 비어 있던 설정을 등록된 fixture ID로 수정했다. acceptance 증가에 따라 공유 runner의 실제 독립 VM 수 기대값을 56→57로 갱신했다. Cloud 기본 샌드박스에서 CI logger의 자식 출력이 비어 기존 보존 검사에 실패했으며 `/tmp/analysis-comparison-static.log`, `/tmp/analysis-comparison-probe/` 증거를 보존했다. 같은 코드를 추가 네트워크 허용 실행 범위에서 다시 검증해 static 성공을 확인했으며 logger/계측을 제거하지 않았다. 브라우저 초기 자동 선택의 포커스 가정을 수정해 실제 포커스 후 변경/복원 경로를 검사했다.
- 당시 다음 컨텍스트 연결은 아래 12.9.3에서 실제 구현·검증·배포했다. 해당 연결의 목표는 실제 선택 조합/공개 상대 픽을 평가하는 조회 컨텍스트와 `draftPickValue` 소비자를 연결하고, 기존 드래프트/Fearless/시리즈 상태의 사용 가능 범위를 명시한다. 경기 전 보고서에서 상대 숨은 훈련·실력·미래 결과를 읽지 않고 실제 입력 변경→이유/유효 후보→UI→권한/저장 경계를 끝낸다. 상세 경기 전환점, 선수 맥락 비교, 고정 보고서/관심 목록/메모/조건 저장/권한 내 내보내기와 전체 12.3–12.5 재설계·다른 승인 영역도 남아 있다. 검증된 외부 대회 보정이나 등급 정책 재설계 완료를 주장하지 않는다.

추가 단기 증거: Node 22 공유 UI·재정·계약 runner의 58개 acceptance / 57개 독립 VM, 124모듈 static/standalone 빌드가 통과했다. PR #167의 최종 head 필수 CI와 main 배포는 위 현재 지점의 성공 기록으로 확인했다.


### 12.9.3 실제 밴픽의 선택 조합·상대 공개 픽 후보 비교

상태: PR #168의 정확한 최종 head 필수 CI·순차 병합·main CI/HTML/Pages 성공을 위 현재 지점에 기록했다. 기존 단일 후보 분석·스태프 조언·분석실 티어를 재구현하거나 전체 UI 재설계 완료로 세지 않는다.

| 판정/화면 연결과 소유 모듈 | 근거·구현·완료 경계 |
| --- | --- |
| 승인된 연결 누락 → 실제 컨텍스트 조회 | 단일 후보 상세는 이미 `draftCandidateAnalysis`에 있었지만 후보끼리 현재 조합/공개 상대 픽 기준으로 비교하는 소비자는 없었다. `draft-preparation.js:draftPreparationReport`는 현재 실제 세션만 읽으며 `draftLegalChampions`/`draftAssignmentsFor`/`draftFeasibleRoles`의 합법 후보와 기존 `draftPickValue`의 점수·기여를 그대로 제공한다. 임시 상대 세션, 새로운 계수, AI 임의 변동이나 미래 세트 상태를 만들지 않는다. |
| 실제 입력 → 이유·선택 | 우리 공개 픽과 구단 전술, 자기 선수 숙련, 상대 공개 픽의 가능한 배치, 이미 기록된 시리즈 승/패 챔피언이 기존 소비자에 들어간다. 역할별 기여/상성 입력을 표시하고 기존 상세의 조합 이유·메타 표본·선수 챔프폭과 연결한다. 최상위 가능한 역할은 검토 기준이며 상대 또는 최종 포지션 확정이 아니다. 효용은 승률·실제 피해량·스태프 추천 순위와 다르다. |
| 모달과 수동 권한 | 공식 `DRAFT_UI.locked`/`UI_OVERLAY`와 `navigateTo` 잠금을 유지한다. `ui-draft-preparation.js`의 후보 버튼 → 실제 차례/권한/합법 후보 재검증 → 기존 후보 분석·포커스 → 기존 `draftUiLock` → `draftApplyChoice`를 연결한다. 후보 클릭은 픽을 실행하지 않는다. 밴/다른 팀 차례/완료/미확인 우리 배치/해임·허위 관찰자에는 명시적인 빈 상태를 제공한다. 소유 2군 권한은 기존 `managerControlsSquad`를 쓰고 2군 감독에게 부모 자료를 열지 않는다. |
| 기존 수동 설명 결함 | `draftUiLock`은 기존에 픽의 `f`/`v`를 넘기지 않아 `draftApplyChoice`의 세션 설명이 모든 기여 0으로 기록됐다. 현재 선택의 기존 최상위 합법 역할 점수·기여를 전달해 세션 `expl`에 실제 검토 기준을 남기고, 확정 시 해임/관리 권한도 재검증한다. 선택 챔피언·최종 배치·RNG·전투 계수는 바꾸지 않는다. 공식 최종 강제 밴픽 소비자가 수동 설명을 영구 경기 설명으로 넘기는 연결은 아래 남은 검증/수정으로 구분한다. |
| 표시·유지보수 | 데스크톱에는 선택적으로 펼치는 비교, 좁은 화면에는 기존 정보 탭의 후보 비교를 둔다. 검색·포지션에 맞는 합법 후보 중 상위 12명을 표시하고 전체 해당 수를 밝힌다. 검색/역할 이동에서 펼침 상태를 유지하고 작은 화면에서 두 열을 줄바꿈하며 스크롤을 키보드로 사용할 수 있다. `ui-draft-analysis.js`로 기존 후보 상세/관측 조합 설명을 내용 변경 없이 분리해 기존 22,000자 예산을 올리지 않았다. 루트 파일은 상호작용/확정, 새 비교 UI는 표시/선택, 엔진은 평가만 소유한다. 저장 스키마·의존성·강제 추가 업무는 없다. |

- 플레이 예: 상대 플렉스 픽이 공개되면 가능한 상대 배치를 기준으로 상성 기여를 비교한다. 우리 팀에 이미 탱커가 있거나 주력 미드의 숙련이 다르면 기존 조합·숙련 기여와 합법 역할이 함께 달라진다. 비교 후보를 눌러 상세 근거를 확인한 뒤 직접 픽을 확정한다. 역할 검토를 새로운 포지션 공개/승률 보장으로 오해하지 않도록 표시한다.
- 집중 엔진/UI acceptance: `scripts/draft-preparation-acceptance.mjs`에서 실제 20턴 드래프트의 우리 5번 픽, 각 역할의 `draftPickValue` 완전 동일성, 실제 자기 숙련/시리즈 승패 소비자, 공개 플렉스 상대 입력, 합법 후보/공식 사용 제한·연습/Fearless, 상대 pool/attrs/pot/medical/tactics/meta getter 차단, 순수 조회와 RNG/shortlist/배치 불변, 허위 상대 주전/관찰자·해임·소유 2군, 지난 선택/중복 확정 거절을 확인했다. 실제 버튼 선택→상세 포커스→기존 확정 writer→강제 밴픽 경기→원본 동등 저장 기록도 확인했다.
- 실제 Chromium: 동일 standalone HTML 주입으로 실제 pending 공식 Bo3의 선택권·잠긴 밴픽을 열었다. 후보 비교/검색 빈 상태/펼침 유지/Enter 선택·상세 포커스/확정, 분석실 이동·Escape 우회 차단, 저장 후 동일 pending 세트 seed 복원과 임시 픽 초기화, 실제 첫 경기 반영→메타 1전→다음 세트→저장 복원을 확인했다. 1280px·320px 문서/모달 가로 넘침과 페이지 오류가 없었다. 직접 file/production URL은 Cloud 정책 제한 때문에 주입 렌더링과 구분하며 공개 HTTP·실기기·TalkBack 최종 QA를 주장하지 않는다.
- 관련 검사: Node 22 공유 runner 59 acceptance / 58 독립 VM, 기존 관측/조합/스카우팅 UI acceptance, 127모듈 static/standalone 빌드 및 회귀 검사를 통과했다. 단기 시나리오 검사이며 장기 100시즌 최종 QA가 아니다.
- 실패/진단 보존: `/tmp/live-draft-preparation-focused.log`의 fixture getter 복원 시 없는 원속성 처리, `focused-2.log`의 기존 log에 없는 source 필드 가정, `focused-3.log`의 저장 복원 객체 키 순서 비교 실패를 보존했다. 원본 writer 구조에 맞춰 실제 cursor/pickList/sequence와 정규 `packMetaHistory` 동등성을 검사하도록 고쳤다. 초기 static의 `ui-draft.js` 문자 예산 실패는 기존 상세를 명확한 모듈로 분리해 해결했으며 예산을 올리지 않았다. logger/계측과 원본 기록은 삭제하지 않았다. `/tmp/live-draft-preparation-focused-final.log`, `integration.log`, `static.log`, `regression.log`, `browser-final.log`에 결과가 있다.
- 이익/비용/한계: 숨은 상대 자료를 조회하지 않고 현재 결정의 비교·이유를 한 모달에서 확인할 수 있다. 추가 비교는 전체 합법 후보 조회와 표시 비용이 있으며 선택적으로 펼친다. 기존 추상 조합/초반·포킹 상성 모델을 설명한 것이지 정확한 주문 실행·맵 기하나 검증된 외부 프로 보정을 새로 구현한 것이 아니다. 과거 내부 상태 복원/분석실 임의 조합 편집과 상대 세트 예측을 제공하지 않는다.
- 당시 다음 이벤트 시점 기록 연결은 아래 12.9.4에서 구현·검증한다. 발견 당시 문제: 실제 수동 밴픽의 이벤트 시점 설명/출처를 공식 결과·경기 복기에 지속 연결해야 했다. 현재 `resolvePendingOfficialMatch`는 picks/bans만 넘기고 `runDraft`의 forced 소비자는 일반 재현 설명을 만들므로 실시간 비교 이유가 영구 경기 근거가 되었다고 주장할 수 없다. 기존 sequence/series/current/pending 저장·결과/UI를 조사해 실제 선택→최종 역할 배치→공식 기록→근거 조회·저장 연결을 끝내고, 공개 기록과 자기 비공개 전술/숙련 설명의 소유 권한을 분리한다. 이후 상세 전환점·선수 맥락 비교·고정 보고서/관심 목록/메모/조건 저장/내보내기와 다른 승인 영역은 계속 남는다.


### 12.9.4 수동 밴픽의 당시 판단 기록·공식 결과·저장·복기 연결

상태: PR #169의 정확한 최종 head 필수 CI·순차 병합·main 재검증·HTML/Pages 배포 성공을 위 현재 지점에 기록했다.

| 발견/소유 모듈 | 구현·완료 경계 |
| --- | --- |
| 공식 writer의 연결 누락 | `resolvePendingOfficialMatch`가 picks/bans만 넘겨 수동 sequence/이유를 잃었다. `draft.js:draftApplyChoice`는 검증된 실제 수동 픽 확정 직전에 `draft-history.js:manualDraftEvidence`로 기존 합법 역할/`draftPickValue`와 공개 컨텍스트를 복사한다. `draftResult` → pending writer → `playSeriesSessionGame` → `sess.games` → `seriesSessionResult` → `commitScheduledSeries`가 원래 공개 sequence와 자기 팀의 `draftEvidence`를 지속한다. AI 픽을 수동 기록으로 만들지 않는다. |
| 소유권·원본·출처 | 기록에는 소유 팀, turn, 당시 date/patch/선수·챔피언 이름, 검토 역할, 공개 우리/상대 픽, 실제 공개 상대 가능한 역할 입력, 기존 기여/표본/신뢰/조합 이유만 들어간다. 확정된 최종 역할은 실제 최종 picks에서 별도로 표시한다. 저장 writer는 현재 소유 구단만 받으며 sequence event/prefix/date/patch/유한 합계와 스키마를 검증한다. reader는 권한을 먼저 검사하고 이후 출처·미래 날짜를 검사한다. 자기 평가와 상대 공개 픽을 사용하며 상대 비공개 선수 상태를 수동 기록에 추가하지 않는다. 로컬 세이브를 암호학적으로 인증하는 기능은 아니다. |
| 유지보수·실제 복기 | `ui-draft-history.js`가 표시·권한 재검증·source 버튼을 소유하고 `ui-match.js:renderSeries/bindSeries`에 선택적 펼침으로 연결된다. 지금의 숙련/전술로 당시 이유를 다시 계산하지 않는다. 선수 정보는 현재 같은 팀일 때만 연결하며 챔피언 버튼은 **현재 챔피언 정보**라고 명시한다. 현재 페이지/공식 모달 잠금은 기존 `navigateTo`를 유지한다. 당시 검토 효용은 승률이나 패배 원인 증명이 아니다. |
| 저장·구형 경계 | `save.js:seriesResultForSave`의 기존 다른 지역/종료 리그 lite 경로도 수동 기록의 date/patch/sequence/picks/bans를 보존한다. live 객체를 수정하거나 원래 경기를 삭제하지 않는다. pending·일반·lite 저장/복원이 연결되고 구형 기록에 수동 근거가 없으면 기록 없음으로 표시한다. 새 의존성·저장 버전 상승·선택 자동화는 없다. |
| 재현된 화면 결함 | 실제 경기 탭 진입에서 `viewMatch`의 선언 없는 `${detail}`이 ReferenceError를 내며 전체 화면을 멈췄다. 남은 미정의 삽입을 제거해 공식 결과 → 세트 요약 → 당시 평가 펼침/출처 이동을 사용할 수 있게 했다. 초기 브라우저 실패 원본을 보존한다. |

- 플레이 예: 첫 미드 픽을 확정할 때 당시 숙련·조합·공개 상대 픽과 효용을 보존한다. 시즌 후 숙련/전술이 달라져도 당시 검토 기준과 최종 포지션을 함께 읽을 수 있다. 과거에 저장하지 않은 이유는 만들어 채우지 않는다.
- `scripts/draft-history-acceptance.mjs`: 실제 수동 20턴/5픽, 같은 시드·picks/bans/sequence의 평가 미저장 대비 경기 승자·전체 선수 lines·정규 공개 메타 동등성, 현재 숙련/전술 변경 후 원본 불변, 외부 소유 getter 읽기 전 차단/해임/소유 2군 경계, 허위 외부 writer·출처 prefix·날짜·누락 picks/sequence, 순수 조회, pending/lite/일반 저장을 확인했다. 실제 `newSeason`의 Bo3가 pending 선택권 → 세트별 수동 드래프트 → 공식 commit → queue 종료 → 역사 재저장까지 완료하며 각 경기의 자기 5건을 유지한다. 완료된 드래프트/공식 결과의 중복 실행은 거절되고 기록은 변하지 않는다. 새로운 공식 경기 전체 트랜잭션 재설계나 모든 기존 실패의 원자성 완료를 주장하지 않는다.
- 실제 Chromium 1280/320px: 실제 공식 Bo3 3게임 전체를 버튼 확정으로 완료했다. 다음 세트 pending 재저장, 원본 5건씩 표시, summary 키보드 펼침, 챔피언/선수 실제 route 이동, 완료 역사 저장·복원·해임 비공개 표시 제거와 문서 폭 320px/페이지 오류 없음이 통과했다. 동일 standalone HTML 주입이며 정책상 차단된 file/production HTTP 검증이나 장기 모바일/기기/TalkBack QA가 아니다.
- 관련 검사: Node 22 runner 60 acceptance / 59 독립 VM, 129모듈 static/standalone과 기존 회귀 검사를 통과했다. 최종 변경 후 필수 CI에서 전체를 다시 검사한다. 문자 예산을 올리지 않았다.
- 실패/증거: `/tmp/draft-history-browser.log`는 실제 기존 detail 미정의 결함, `browser-2.log`는 검사 코드가 없는 UI_STATE를 가정한 실패다. 검사만 기존 VIEW route에 맞춰 수정했으며 원본 로그를 삭제하지 않았다. `focused-final.log`, `scheduled-2.log`, `integration.log`, `static-final.log`, `regression.log`, `browser-final.log`와 실제 화면 캡처에 결과가 있다. 기존 #164–#168 실패·진단은 위/기존 항목대로 보존한다.
- 이익/비용/한계: 수동 결정의 당시 설명과 공개 선택 순서가 사라지지 않는다. 경기당 자기 픽 최대 5건의 저장 비용과 확정 직전 기존 합법 후보 평가 조회 비용이 추가된다. 조합 평가·상성은 기존 aggregate 모델이며 정확한 스킬 실행/기하·외부 프로 보정을 새로 구현하지 않는다. 전체 save export는 기존 전체 게임 파일이며 관찰자용 공개 데이터 내보내기 기능으로 바꾸지 않았다. 이미 과거에 사라진 이유·전투 로그를 복원하지 않는다.
- **정확한 다음 45–55분 단위:** 분석실의 실제 공식 경기 복기 소비자와 관측 경계를 연결한다. 기존 `ui-match.js:renderDraft`의 경기 재생은 상대 `ps.prof.mastery`를 그대로 표시하고 `replayGame`은 오늘의 선수 상태로 경기/설명을 재생한다. 이 source-backed 발견은 다음 재현·교정 대상으로 등록했다(새 정책 제안이 아님). 저장된 공개 기록/자기 당시 근거와 재생 추정을 분리하고, 숨은 상대 숙련을 관측값으로 노출하지 않는 실제 match review → source/navigation → permission/save 흐름을 끝낸다. 정확한 전환점이 필요하면 기존 actual event writer와 저장 가능한 근거를 먼저 조사하고 미저장 과거 로그는 만들어 채우지 않는다. 상세 전환점·맥락 선수 비교·보고서 도구와 전체 재설계/다른 승인 영역은 계속 남는다.


### 12.9.5 분석실 공식 경기 복기·당시 공개 기록·관측 경계

상태: PR #170 최종 head `2d84a0db7e6d66e2119b7560420d104a980893e5`의 전체 필수 CI `37165915389`(의료 4시드·2집계·verify) 성공 후 main `63b6741af382c013139b5e9a43e2dd6e74bf1da8`로 순차 병합됐다. 같은 main의 전체 CI `37166328093`·standalone-sync와 Pages `37166672307`의 검증 artifact·온라인/오프라인 조립·게시 성공 및 src/docs/scripts/index 동일성을 확인했다. 직접 github.io HTTP는 Cloud 정책 차단으로 확인하지 못했다. 전체 분석실/전체 UI 재설계 완료는 아니다.

| 발견·소유 파일 | 실제 구현·완료 경계 |
| --- | --- |
| 과거 결과를 오늘 재계산하던 경로 | `bindSeries`가 `replayGame`을 호출해 오늘의 선수 상태로 만든 경기/설명을 과거 기록처럼 표시했다. 이제 세트 버튼은 `renderPublicMatchReview`로 당시 저장된 공개 결과를 읽는다. 기록 없는 과거 경기에는 상세 미저장 상태를 표시하며 현재 상태로 채우지 않는다. 기존 `replayGame` 함수/개발 계측은 삭제하지 않았다. |
| 당시 공개 원본 writer | `match-history.js:publicMatchRecord`는 실제 `playSeriesSessionGame` 결과에서 10명의 실제 이름/역할/챔피언/KDA/CS/획득 골드/피해량/레벨/아이템과 당시 챔피언·아이템 이름, date/patch/winner/duration을 명시적으로 복사한다. attrs/pool/숙련/잠재력/전술/ratings는 저장하지 않는다. 아이템 표시는 실제 `matchQuestItems`의 6칸+원딜 역할 보상 신발을 포함하며 이를 임의의 불법 7칸 구매로 간주하지 않는다. |
| 사건 writer·한계 | 이미 생성된 실제 로그의 공개 처치/교전/오브젝트/구조물/넥서스 사건에서 최대 24건(많으면 처음 12+마지막 12)을 보존하고 원래 해당 사건 수/생략을 명시한다. quiet AI 경기는 기존 로그가 없으므로 결과로 타임라인을 만들지 않는다. 모든 로그를 켜거나 RNG/승패/효과를 변경하지 않았다. 사건은 기존 aggregate 엔진의 계산 기록이며 정확한 개별 주문/위치를 재현한 데이터가 아니다. |
| 실제 분석실 소비자 | `ui-match-history.js`는 독립 표시 모듈이다. 기존 분석실에 경기 복기 모드를 연결하고 현재 관리 1군/소유 2군, 기간·패치·대회·실제 기록 역할 조건에 맞는 완료 공식 기록 중 최근 30세트를 고른다. 선택은 권한/조건에서 다시 검증하고 필터 변경 시 범위 밖 기록을 표시하지 않는다. 자기 당시 밴픽 근거와 기존 검증된 챔피언/선수 route를 함께 연결하며 비공개 상대 기록을 읽지 않는다. transient review ID는 저장에 들어가지 않고 world/slot reset에서 초기화된다. |
| 노출 결함 교정 | `renderDraft`는 상대의 실제 `ps.prof.mastery`를 항상 출력했다. 현재 소유 구단에만 현재 계산 숙련을 명시하고 상대 값을 읽지 않는다. 세트 요약의 내부 멘탈 계수 표시를 제거하고 선택권 이유도 그 결정을 소유한 구단에만 보여준다. 사용자 결과 화면의 전체 내부 `renderExpl` 원값 노출은 집계 모델 설명으로 대체했다. 원본 r.expl/로그/재생 함수는 유지해 실패를 숨기거나 계측을 제거하지 않았다. |
| 저장·권한·표시 | `save.js`의 기존 lite 저장에서도 당시 공개 기록과 date/patch를 보존한다. 구형·미확인·미래 출처는 원본을 훼손하지 않고 조회 상태를 명시한다. reader는 현재 private 선수 필드/재시뮬레이션을 사용하지 않는다. 연습 score sheet는 참가 구단의 비공개 관측으로 먼저 권한을 검사하고 공식 경기 목록/공개 보정에서 제외한다. 단순 과거 replay 실행으로 새 당시 기록을 생성하지 않는다. 관리/해임/소유 2군 경계는 기존 shared predicate를 쓴다. 실제 320px 선택 폼 16px 가로 넘침을 발견해 기존 controls/analysis-controls 패턴으로 연결했고 큰 표는 키보드 접근 가능한 가로 스크롤 안에 둔다. |

- 예: 경기 후 선수 숙련/전술을 바꿔도 지난 경기 KDA·CS·아이템·이름/사건은 당시 저장값 그대로 남는다. 오래된 상세 미저장 경기나 quiet 경기의 없는 로그는 새로 만들어 보여주지 않는다. 공개 경기 수치만으로 승패 원인을 단정하지 않는다.
- `scripts/match-history-acceptance.mjs`: 실제 공식 시뮬레이션의 공개 값·끝 사건·24건 상한, capture/미capture의 같은 모드·같은 시드 전체 선수 lines·정규 공개 meta 동일성, 자기 현재 숙련 변경 후 불변, 상대 attrs/숙련 getter trap, 외부 관찰자/해임, 잘못된 출처/구형·lite 저장, 실제 분석실 패널과 순수 조회를 확인했다. 대표 로그 포함 1경기 공개 snapshot JSON은 3,041문자다(UTF-8 byte나 장기 메모리 측정이 아님). 저장 비용이 새로 생기는 정확도/기록 보존 개선이며 성능 최적화로 주장하지 않는다. 기존 CI의 저장/시간/메모리 예산을 올리지 않는다.
- 실제 Chromium: 실제 pending Bo3 3게임을 버튼으로 완료하고 세트→당시 기록, 분석실 경기 모드→기간/경기 선택→공개 수치/사건·자기 근거→실제 챔피언 route→선택 유지, 저장/reload→world reset·같은 역사 재선택, 해임 표시 차단을 확인했다. 1280/320px, 표 키보드 스크롤, 문서 넘침/페이지 오류 없음이 통과했다. 동일 HTML 주입 렌더링이며 정책상 차단된 production/file URL이나 최종 기기/TalkBack QA는 아니다.
- 단기 관련 검사: Node 22 UI runner 61 acceptance/60 독립 VM, 131모듈 static/build 및 기존 회귀가 통과했다. 추가 reader/snapshot과 기존 플레이 결과의 동등성을 별도로 구분했으며 현재 head 전체 CI에서 다시 검사한다. 기록 역할 조건은 실제 선수 표의 해당 역할에 적용하며, 전후 공개 사건은 다른 역할의 맥락도 포함한다.
- 실패 원본: `/tmp/match-history-focused.log`/`source-probe.log`는 실제 원딜의 역할 보상 신발을 임의의 6개 표시 상한으로 거절한 초기 validator 오류다. 기존 writer를 조사해 6+1 표시를 수용했다. `focused-2.log`는 원래 quiet/logged 모드의 duration/lines가 같다는 잘못된 fixture 가정이고, 같은 모드 capture/미capture의 실제 패리티로 교정했다. `focused-final.log`는 안내문 단어 숙련을 숫자 노출로 오인한 검사 가정, `integration-2.log`는 새 transient review 키를 기존 reset 예상값에 누락한 검사다. `browser.log`/`layout-probe.log`에는 실제 320px 폼 넘침을 보존했고 공통 controls로 수정했다. 역할 조건을 실제 표에 연결한 추가 검사 `/tmp/match-history-role-final.log`는 사건 로그에도 다른 역할 이름이 남는 것을 표 필터 오류로 오인했다. 표의 행을 검사하도록 고쳤으며 원본 로그와 대체 head/CI 기록도 보존한다. 초기/최종 로그·원본 진단·기존 #164–#169 기록은 삭제하지 않는다.
- **새 검증 결함·보존된 엔진 후속 단위(승인된 종료/효과 순서 판정):** seed `record-official`의 실제 공개 원본은 넥서스 파괴 26:50 이후 상대 포탑 파괴 26:56을 기록했다. `simulateMatch`의 macro/tower phase와 파괴 후 같은 분의 처리, 두 side 순서, 종료 감지/시각·logged/quiet 차이를 조사한다. 원본 사건을 삭제하거나 복기에서 숨겨 맞춘 것으로 만들지 않는다. 최초 넥서스 파괴 뒤 실행 가능한 실제 writer/consumer를 재현하고 종료 이후 피해·보상·구조물·상태/추가 판정이 발생하지 않게 자연스러운 경계에서 교정한다. 골드 판정/억지 승자·보정률·정책을 추가하지 않는다. 의도적인 현실성 수정과 동작 보존 변경을 구분하며 양 side·동일 분·quiet/logged·공식 결과/저장/복기/시드 시나리오로 검증한다. 상세 전환점 원인·맥락 선수 비교·보고서 도구와 전체 재설계/나머지 승인 영역은 계속 남는다.

#### 12.9.5.1 FM식 정보 구조 적용과 상단 메뉴 정리

- 사용자 최신 정정(2026-10-04): FM 참고 이미지의 **메뉴 체계와 정보 계층**을 참고하되 주요 이동은 모바일을 고려해 **상단에 유지**한다. 좌측 전역 사이드바로 바꾸지 않는다. 커리어 시작 전에는 운영 목적지가 불필요하므로 새 게임 메뉴만 표시하고 불러오기는 별도 상단 버튼으로 둔다. 화면 색상 설정은 실제 자동/어둡게/밝게 선택으로 연결했다. 화면 내부 탭은 선택한 대상의 상세 정보 구분용이다. 이 방향은 12.3–12.5 전체 교체에도 적용한다.
- 실제 구현: `shell.html`의 상단 상태 줄에 현재 화면·관리 구단·날짜와 색상 설정, 그 아래 목적별 상단 메뉴를 정돈했다. `ui-state.js:updateAppNavigation`은 커리어 유무/현재 route에 따라 표시와 명칭을 갱신하며 기존 navigation/overlay 잠금과 shared commands를 유지한다. 스크림 목적지는 경기·스크림, 저장·불러오기는 운영 메뉴에서 제외해 오른쪽 위 별도 유틸리티 버튼으로 옮겼다. 실제 기존 저장 route로 이동하며 시작 전에는 불러오기 명칭을 쓴다. 시작 전 화면에는 가짜 운영 메뉴나 기능 없는 설정 버튼을 추가하지 않았다. 상단 메뉴는 작은 화면에서 가로 스크롤하며 본문을 밀어내지 않는다.
- 분석실 실제 교체: `ui-match-history.js`는 경기 목록 → 선택 경기 요약 → 선수 기록/주요 사건/밴픽 검토의 단일 작업 공간으로 교체했다. 1280px에서는 실제 경기 목록과 상세를 나란히 두고 좁은 화면에서는 목록을 선택 폼으로 줄인다. 긴 사건 목록과 비공개 당시 근거는 해당 탭에서만 표시한다. 현재 팀·역할·기간·대회·패치 조건을 유지하며 실제 기록을 선택 시 다시 검증한다. 수치 열 정렬과 표 간격을 통일하고 아이템은 개수/펼치기로 확인한다. 탭은 실제 자료를 바꾸며 좌우/Home/End 키, 선택/focus/tabpanel 연결을 지원한다. reviewTab은 transient UI이며 world/slot reset에서 초기화된다.
- 집중 실제 Chromium 검증: 새 세계의 분석 메뉴 숨김/새 게임 명칭, 실제 색상 설정, 실제 공식 Bo3 3게임, 복기 선택/역할 필터/주요 사건·밴픽 탭/키보드 전환/원본 챔피언 route/조건 유지, pending 및 history save/reload와 해임 차단을 확인했다. 1280/320px에서 문서 가로 넘침·페이지 오류가 없었다. 표 자체의 가로 스크롤은 키보드 접근 가능하다. `/tmp/match-history-fm-top-browser.log`와 `fm-desktop.png`/`fm-320.png`는 동일 rebuild HTML 주입 검사이며 production HTTP나 최종 모바일 기기 QA가 아니다. 첫 static 실행의 sandbox process-test 실패/브랜딩 검사 실패는 `/tmp/match-history-fm-static.log`에 보존했고 기존 브랜드 구조를 복원했다. 제한 내 재검사 성공은 별도 로그에 남긴다.
- **승인된 UI 후속 단위: 12.3–12.4 구단 운영 개요와 목적별 상단 내비게이션.** 실제 시작/커리어/초기 영입/시즌/해임 상태 및 기존 선수단·계약·훈련·일정·재정 command 연결을 조사한 뒤, 오늘 해야 할 결정과 다음 일정·구단 상태에서 실제 관련 화면/행동으로 이어지는 구단 개요를 완성한다. 없는 route에 버튼만 붙이거나 오늘의 내부 상태를 과거 근거로 재구성하지 않는다. 기존 화면은 대체 흐름의 권한/취소/중복/저장까지 확인한 뒤 교체한다. 12.5 선수단·선수 상세, 계약·시장, 스태프·훈련, 리그·일정, 경기, 통계, 재정·사무국, 저장·설정의 전체 교체는 계속 남는다. 종료 이후 사건 결함도 위의 원본과 재현 조건을 보존하며 별도 엔진 단위로 교정한다.
- 완료율 보고 기준: 전체 기능과 UI를 섞은 임의 백분율을 쓰지 않는다. 승인된 numeric task별 구현·focused acceptance·현재 head CI·main/배포 상태를 구분해 집계한다. 현재 전역 UI 구조/분석실 일부를 구현한 것은 전체 UI 또는 전체 승인 범위 완료가 아니다. 단위 수만으로 난이도 가중 완료율을 추정하지 않는다. 12.3 실제 연결 감사에서 전체 inventory와 UI inventory 상태를 별도로 갱신한다.

- 추가 사용자 방향: 주요 메뉴를 기존 6개 큰 화면에 계속 몰아넣지 않는다. 12.3–12.5 교체에서 선수단, 계약·시장, 스태프, 훈련, 일정·대회, 경기, 분석실, 재정, 사무국, 패치·메타 목적지를 각각 실제 독립 흐름으로 연결한다. 저장·불러오기는 상단 오른쪽 유틸리티로 분리한다. 이 단위에서 구현된 것은 상단 위치 유지/시작 전 구분/저장 분리와 복기 공간이며, 나머지 독립 도메인 화면이 구현됐다고 주장하지 않는다. 기존 바인더는 여러 섹션을 함께 가정하므로 화면 일부를 숨기거나 가짜 route만 늘리는 방식으로 완료하지 않는다. 다음 구단 개요 단위에서 명시적인 domain 모듈/command 연결과 이 목적지 분리의 첫 완결 경계를 정한다.
- 새 경험치 검토 근거: 사용자 27분대 미드 13레벨 지적. `engine.js:incomeTick`은 실제 CS를 쓰며 `addXp(ps,cs*58+역할/시간 상수)`로 일반 경험치를 준다. `addXp`는 누적 XP_TABLE 문턱으로 레벨을 계산하므로 시간 고정 레벨은 아니다. 그러나 미니언 막타 수와 주변 경험치 수급을 사실상 묶은 aggregate proxy이며, 처치 실패·경험치 거리/공유·죽음/귀환/로밍의 구분이 충분하다고 검증되지 않았다. 사진 하나로 정상 레벨이나 프로 목표 분포를 단정하지 않는다. 승인된 wave/camp/XP 판정 inventory에 실제 이 writer/consumer 재현, reviewed patch XP/공유 metadata, 수입/레벨/아이템/성장 소비자, paired lane/roam/death 시나리오를 연결하는 후속으로 병합한다. 임의 XP/레벨 상향이나 화면 숫자 수정은 하지 않았다.

- 최신 우선순위 정정: 사용자는 경기 엔진이 최우선임을 재확인했다. 현재 UI/복기 연결 단위를 완결한 뒤 **다음 구현 단위는 위의 실제 종료 이후 사건·logged/quiet 판정 시계 결함 교정**이다. 12.3–12.5 상단 도메인 분리/구단 개요는 승인 상태로 유지하되 이 엔진 결함보다 먼저 반복적인 외형 변경을 하지 않는다. 전체 경기 검토 inventory는 종료·동시 사건, 미니언·웨이브, 캠프, XP·경제·구매, 접근·타깃·피해·회복·CC, 아이템·룬 효과/팀 유틸리티, 시야·정보, 귀환·이동·죽음, 오브젝트·구조물 전환, 밴픽·전술·시리즈, 선수 상태·실행력, 패치·적응, 당시 근거·재현성·AI 동등성으로 기존 승인 항목에 병합한다. 전체 재검토 목록은 새 기능 수/완료 수로 중복 집계하지 않으며 실제 source-backed 판정 결함과 미검증 조건을 구분한다.

- 사용자 표시 정정: 선수 기록 표의 제목은 ‘아이템’으로 단순화했다. 역할 보상 아이템을 숨기거나 저장/실제 아이템 소비를 바꾸지 않으며 긴 구현 설명을 열 제목에 반복하지 않는다.

- 최종 사용자 복기 표시 정정: 아이템 열 자체를 복기 표에서 제거했다. KDA·CS·획득 골드·피해량·레벨을 유지하고 아이템 배열/당시 이름의 저장은 판정 검증·원본 역사 보존을 위해 유지한다. 아이템 효과·구매 writer를 삭제하거나 기록을 지워 화면을 간소화하지 않는다. 앞선 제목 단순화보다 이 최종 정정이 우선한다.

## 8.1.1 최초 넥서스 종료와 로그 독립 판정 시각

상태: `fix/match-end-adjudication`에서 실제 구현·집중 검증. 현재 head 전체 CI·순차 병합·같은 main HTML/게시 게이트는 별도로 확인한다. 8.1의 종료 판정 보강이며 새 승리 정책·밸런스 변경이나 전체 전투/웨이브 완성 선언이 아니다.

| 발견·source | 구현·완료 경계 |
| --- | --- |
| 실제 종료 뒤 구조물/보상 | baseline main `63b6741`의 실제 공식 `record-official/g1`은 넥서스 26:50 이후 상대 바텀 2차 포탑 26:56을 기록하고 26:57로 종료했다. `simulateMatch`가 macro→tower→억제기 재생성 후에만 dead nexus를 확인했고 `takeStructure`는 이미 파괴된 넥서스를 재처리했다. [원본과 비교](evidence/match-end-original-series.json)에 전체 원본 앞 사건과 뒤 사건을 보존했다. 이는 가상 엔진 재현이며 프로 보정 자료가 아니다. |
| 최초 종료 writer | `match-adjudication.js:destroyMatchNexus`가 실제 구조물 처리의 첫 넥서스 파괴에서 승자/분/초/version을 확정한다. `takeStructure`, 수입·시야·라인·정글·오브젝트·macro·tower, 교전·처치·conversion에 실제 종료 guard를 연결했고 tower phase는 첫 종료에서 즉시 반환한다. 같은 분의 두 번째 넥서스 호출·다음 side·추가 action/trace는 state/RNG를 바꾸지 않는다. 마지막 골드 history는 종료 시점의 읽기용 snapshot으로 남긴다. |
| 로그 여부가 duration/평점을 바꿈 | 기존 `log`는 quiet에서 초 계산도 생략했고 종료 duration은 로그 cursor+1로 계산했다. 이제 `matchEventSecond`는 같은 기존 시간 스트림/증분으로 사건 초를 항상 계산하고 quiet는 저장만 생략한다. 종료 duration/문자열은 실제 첫 종료 snapshot을 소비하며 마지막 로그 초를 다시 써서 맞추지 않는다. 기존 시간 표현은 집계 모델의 seeded 초 표현으로, 실제 개별 스킬/이동 시각이나 물리적인 동시 교환을 재현한다고 주장하지 않는다. |
| 실제 결과·meta·저장·UI | 종료 snapshot은 실제 `seriesResultLines`의 duration/rate/rating, 공식 결과/meta, `publicMatchRecord`의 종료 근거, 원본 세트/분석실 복기와 기존 pending/full/lite 저장으로 연결된다. 공개 종료 근거는 팀 ID로 변환해 표시하며 winner/시각/duration/사건 범위를 검증한다. 종료 근거 없는 이전 기록은 원본으로 유지하고 오늘의 엔진으로 재작성하지 않는다. 새 원본에서만 종료 후 사건이 없다. |
| 판정·권한·비용 | 전투·보상·패치 계수/AI 정책/골드 승리/임의 보정률을 추가하지 않았다. 첫 실제 ordered event가 종료를 확정한다. 현 엔진은 동시 물리 틱 모델이 아니며 동일 초의 실제 동시 넥서스 교환 규칙까지 구현했다고 주장하지 않는다. 기존 공식 writer/observer/private 권한과 세이브 버전은 유지한다. 단순 trace clock에 quiet도 참여하고 작은 종료 metadata가 저장되는 정확도 수정이며 성능 최적화가 아니다. 기존 예산·실패 기록은 유지한다. |

- 실제 원본 재현 전후: `record-official/g1`의 첫 넥서스 26:50·승자는 그대로, 26:56 포탑/보상 처리는 발생하지 않고 종료는 26:50이다. 첫 종료 전 사건 배열은 동일하다. 일반 3시드×양 side의 6짝에서도 이전 source와 종료 전 사건·이전 분 골드 history가 동일하고 승자는 같았다. 중복 넥서스 2건이 1건으로 줄어든 사례를 보존했다. 이 표본은 글로벌 승패율/밸런스 근거가 아니다.
- `scripts/match-adjudication-acceptance.mjs`: 6짝 logged/quiet의 실제 종료·승자·선수 KDA/XP/레벨/골드/피해/아이템·quest/시야·오브젝트·rates/평점/골드 history 동일성, 양 side 최초 종료/같은 분 추가 종료 차단, 실제 모든 post-end phase/action/log/expl의 state/RNG 불변, 실제 공식 lines/public meta 동일성, 종료 source·미확인/구형·lite 저장을 확인한다. 기존 `match-ending-acceptance`의 구조물 stall/180분 실패·post-70 실제 넥서스·save 재현도 유지한다. unresolved 경기에 골드 승자나 가짜 종료를 만들지 않는다.
- 실제 Chromium: First Selection→수동 밴픽→실제 공식 Bo3 3게임, 각 snapshot의 단일 마지막 넥서스/종료 초/duration/조회 validator, pending save/reopen와 기록 저장/reload, 원본 세트/분석실 종료 근거, source 이동과 fired 경계를 확인했다. 1280/320px 문서 가로 넘침/페이지 오류 없음. 동일 rebuilt HTML 주입 검증이며 production HTTP/최종 device/mobile/TalkBack QA가 아니다.
- 관련 검증: Node22 UI runner 62 acceptance/61 독립 VM, 132-module static/build 및 기존 회귀가 통과했다. module budget은 기존 engine 34k를 유지하고 작은 단일 책임 `match-adjudication.js`로 분리했다. [정확한 원본 비교](evidence/match-end-original-series.json)는 시행 당시 엔진 commit·setup·가상 자료 구분을 포함한다. `/tmp/match-end-baseline-source.json`/baseline.log, original-engine.js, original-series.log/json, comparison.log/json, browser.log와 screenshots를 보존한다.
- 초기 검사 실패: `/tmp/match-adjudication-focused.log`/save-probe.log는 fixture에서 완료된 시즌 표시를 누락해 full 저장을 lite로 오인한 실패다. source 종료값/조회는 이미 일치했고 fixture에 실제 완료 조건을 추가했다. `/tmp/match-end-integration.log`는 새 독립 acceptance를 추가한 뒤 기존 VM 기대 수 60을 그대로 둔 검증 실패이며 실제 수 61로 수정했다. 원본 실패와 후속 통과를 삭제/은폐하지 않는다.
- 첫 PR head `a90b4a9`의 CI `37168170229` calendar-scouting은 `role-quest-match-acceptance`가 수동으로 만든 quiet 상태에 로그 RNG를 생략하여 실패했다. 실제 quiet 경기와 같은 판정 시각 입력을 제공하도록 fixture에 독립 seeded log RNG를 추가했다. production의 RNG 누락을 감추는 fallback이나 로그/검사 제거는 하지 않았다. 원본 `/tmp/match-end-ci-calendar-failure.log`를 보존하며 새 head의 전체 CI가 최종 gate다.
- **정확한 다음 45–55분 단위: 8.5.1 미니언·웨이브 XP/수입 연결의 첫 수직 경계.** 현재 `incomeTick`의 `CS×58` 경험치와 역할/시간 상수, CS·gold·XP writer→level/구매→combat/macro 소비자를 검토한다. 기존 pinned Data Dragon source는 챔피언·아이템·룬이며 미니언 종류별 XP/공유/도착/보상 metadata가 있다는 증거가 아니다. reviewed patch-pinned minion XP·공유·spawn/arrival·보상 metadata를 먼저 확보하고 source/license/version/단위/누락을 보존한다. 확보된 규칙으로 막타와 근처 경험치 수급·공유, 죽음/귀환/로밍/배분 비용을 구분하는 첫 실제 writer-consumer 및 paired 시나리오를 구현한다. 27분 MID를 임의 목표 레벨로 맞추거나 자료 없는 계수를 만들지 않는다. source 확보가 막히면 정확한 원본/source gap·bounded 재현과 실제 다음 경계를 기록한다. full camp/웨이브/구조물 health-resistance·시야/전환 전체를 이 단위 완료로 부풀리지 않는다. 8.2/8.3/8.4/8.6/9.1과 다른 승인 영역도 유지한다.

### 12.5·12.9 선수 관측 평가·실제 지표 레이더 — 추가 승인, 구현 예정

- 사용자는 선수 평가와 경기 지표의 레이더 차트, 같은 조건의 두 선수 비교를 승인했다. `ui-player.js`의 현재 수치 grid와 `scouting.js:observedPlayerCoreMetrics`, 선수/분석 보고서와 실제 경기 지표를 먼저 감사한다. 차트를 추가한 것만으로 적법한 observed 평가가 되는 것은 아니므로 내부 원값·추정값의 출처/권한/관측 시점/불확실성·실제 consumer를 검증한다.
- 능력 평가와 실제 성적을 별도 그래프로 표시한다. 역할·기간·대회·patch·표본·기준을 비교 조건으로 보존하고 숫자 표/근거 이동을 함께 둔다. 없는 자료는 임의 0점이나 평균으로 채우지 않고 숨은 true ability·상대 private practice를 노출하지 않는다. 정규화와 방향(예: 기복 낮음)·단위는 설명 가능한 실제 규칙으로 검토하며 단독 KDA/면적/확정 순위를 만들지 않는다.
- 기존 선수 상세/12.9 contextual comparison 승인 scope에 병합하는 표시·조회 작업이며 새로운 능력 변수나 효과 계수가 아니다. 레이더·전체 domain UI는 아직 구현되지 않았다. 상단 유지/시작 전 운영 메뉴 숨김/별도 저장 utility/독립 domain 목적지 방향은 유지하고 경기 엔진을 최우선으로 진행한다.

- 추가 종료/자원 검증: [종료 뒤 포탑 보상 비교](evidence/match-end-resource-conversion.json)는 원본 사건 삭제가 아니라 실제 post-end 지급 차단을 확인한다. `record-official/g1`의 상대 TOP/MID가 종료 뒤 받던 각각 150골드가 실제 writer에서 사라졌고, 종료 전 사건은 동일하다. 이때 raw `ps.gold`의 의미가 정상 구매 장부라고 검증된 것은 아니다.
- 자연스러운 자원 열세 승리: bounded 32게임 탐색에서 선택한 [양 side 사례](evidence/match-end-resource-scenarios.json)를 추가 acceptance에 연결했다. seed `nexus-resource-scenario-13`은 상대 골드 56,686 대 승리 팀 54,848에도 실제 수성 교전·열린 기지·넥서스 파괴로 종료했고, `...-21`은 승리 팀 66,319 대 상대 68,676에서 실제 드래곤/영혼·열린 기지·넥서스 기록을 갖는다. 실제 생존 공격자와 파괴된 쌍둥이/억제기 조건을 검증했다. preset 승자·comeback 목표/확률·새 계수를 넣지 않았다. 사건은 설명 가능한 실제 경로이며 정확한 위치/개별 행동이나 단독 인과 확정은 아니다. 탐색 표본을 프로 목표 분포나 균형 승률로 쓰지 않는다.

### 8.2·8.3 추가 검증 결함과 다음 우선 단위 — 실제 구매 장부

- 종료 후 지급의 전후 비교에서 **구매 비용이 raw 보유 골드에서 차감되지 않는 실제 결함**을 확인했다. `newPS`는 시작 아이템만 차감하고 `addGold`는 보유/누적 골드를 함께 증가시킨다. `advanceItemPurchases`는 `goldEarned−questWardSpent >= threshold`로 구매하며 `applyItemCraftAction`은 재료·아이템만 변경하고 `ps.gold`를 차감하지 않는다. 그런데 `roleQuestWard`는 raw ps.gold를 실제 구매 가능 금액으로 소비한다. 이는 표시 전용 숫자 문제가 아니다. [실제 applied recipe cost와 raw bank](evidence/item-purchase-ledger-gap.json), `/tmp/item-ledger-defect.log/json`을 보존했다. 소스 가격을 합산한 장부 대조이며 자산 가격이나 수수료를 발명하지 않았다.
- **다음 우선 45–55분 구현은 이 8.2·8.3 구매 장부 경계다.** 실제 starter/cumulative recipe/component/quest/ward 비용, 500 시작 골드와 `500+spent` threshold의 불필요한 추가 문턱, affordability와 six-slot atomic combine/재료 소모/거절/반복 호출을 조사한다. 획득·소비·보유 금액을 기존 actual costs로 일치시키고 실제 automatic purchase writer·ward consumer·inventory/effects·official result/save와 paired 시나리오를 연결한다. 포괄적인 item exclusivity/판매/환불/팀 counter 효과가 이미 완성됐다고 주장하지 않는다. 누락된 금지 그룹 metadata는 먼저 확보한다. 효과·결과가 바뀌는 정정과 동작 보존 변경을 구분하고 AI/player parity·budget/seed/rollback을 검증한다. 새 manager 아이템 조작을 추가하지 않는다.
- 앞의 **8.5.1 XP/웨이브 source-backed 단위도 승인·유지**하며 구매 장부 교정 다음 순서다. 막타/경험치 수급 결합과 27분 MID 레벨 질문을 덮거나 임의 레벨로 맞추지 않는다. 이번 넥서스 단위가 구매 장부·full camp/wave/기하·미검증 item effect를 끝낸 것으로 부풀리지 않는다.
## 8·9 엔진 고도화 전체 판정·검증 목록 — 2026-10-04 사용자 문서화 승인

사용자가 직전 보고의 **38개 항목 전부 문서화**하도록 지시했다. 아래 번호는 이 검토 목록의 순번이며 새로운 개발 단계/기능 수가 아니다. 기존 7.1·8.1–8.6·9.1·3·12.9에 통합한다. 기존 승인·구현 증거·원본 규칙은 유지하며 등록을 구현/검증/게시 완료로 계산하지 않는다. 같은 항목을 다른 이름의 신규 기능으로 반복 제안하지 않는다.

**이 inventory의 상태 문구는 최초 작성 당시 snapshot으로 보존한다.** 아래 #171 출시 문단과38행의 '현재/대기/한계'는 당시 기록이다. 전체38개 승인은 계속 유효하며 최신 실제 구현·검증·출시 상태는 문서 상단과 각 담당8.x 후속 절의 source evidence를 우선한다. 예컨대8.2.1 장부와8.3.1–8.3.3 raw stats/패치,8.4.1–8.4.4 자원 경계를 이후 구현했지만 전체 item/XP/효과/38개 완료로 확장하지 않는다. 원래 문구를 새로운 성공으로 덮어쓰지 않는다.

현재 기준: PR #171 최종 head `d173a7f67f9da33dc7d6506be5ee3f9b629f99ac`의 필수 CI `37168431212` 전체 성공 후 main `b1cf7abb94bd00583baf78d34872d19de96a9605`로 병합됐다. 같은 main의 전체 CI/standalone-sync `37168684378`, Pages `37168959385`의 검증 artifact/온라인·오프라인 조립/게시가 성공했다. 이전 실패 head와 원본은 8.1.1대로 보존한다. Cloud 직접 github.io HTTP는 차단되어 응답 검증 성공을 주장하지 않는다. 본 문서화는 별도 사용자 요청이며 시간당 게임 구현 단위 완료로 집계하지 않는다.

**공통 등록·완료 계약**
- 모든 행은 기존 승인 범위다. 재현된 결함, 코드로 확인한 aggregate 한계, 조사 가설, 구현/검증/게시를 구분한다. 표의 '승인·검토'는 시스템이 전혀 없다는 뜻이 아니라 기존 부분 구현을 감사하고 남은 실제 연결/반례를 완결한다는 뜻이다.
- source는 해당 경기의 pinned patch/검토된 공식 메커니즘·기존 확정 가상 규칙·실제 상태와 사건이다. 경험적 보정은 provenance/license/날짜/patch/event/tier/side/role/game ID/중복/누락/단위를 검증한 organized competition 자료만 사용한다. 솔로랭크/혼합 미검증 자료·가상 경기 표본을 프로 목표로 사용하지 않는다.
- 입력 단위는 골드/비용, XP/레벨, 게임 초/분, 실제 HP·피해·보호막/회복, 개수/거리 또는 명시한 aggregate 접근 상태로 정의한다. 추상 효과 계수를 실제 AD/HP/거리로 위장하지 않고 source 없는 가격·계수·CC 시간을 만들지 않는다. 완전한 주문 시전/2D geometry/물리적 동시 틱 구현은 주장하지 않는다.
- writer는 실제 engine/shared command이고 consumer는 구매/인벤토리/전투/운영/공식 결과다. 화면은 확인된 원본·소유 관측·범위/누락과 실제 실패 이유를 보여준다. 숨은 true ability/상대 private 상태는 엔진 내부 결과 계산과 관리자의 관측을 구분하며 보고서·AI 판단 입력을 감사한다.
- 각 구현은 실제 행동→가능 조건→상태 변경→결과/근거 UI→pending/full/lite 저장·재접속을 연결한다. 중복/실패/취소·rollback, 종료 경계, seeded 재현, AI/player 같은 규칙, 원본 history/diagnostics 보존을 검사한다. public/private event-time source를 오늘의 상태로 재구성하지 않는다.
- 기대 이익은 표의 실제 오판정 감소다. 비용은 상태·source·검증·저장 증가, 기존 새 경기 결과 변화, 데이터 확보 부담이다. 의도적 현실성 수정과 동작 보존 최적화를 구분하며 measured bottleneck 없는 rewrite를 하지 않는다.
- 우선도: P0 재현된 실제 결함, P1 기반 자원/효과 정확도, P2 기반 소비자 위 확장/설명. 크기는 초기 추정으로 중=보통 2–3개 45–55분 수직 단위, 대=3개 이상/규칙 확보 의존이며 실제 조사 후 자연스러운 경계를 확정한다. 구매 장부 첫 단위는 기존 8.2·8.3의 45–55분 범위이며 전체 구매/효과 완성을 한 번에 주장하지 않는다.

| 순번·기존 단계 | 필요한 판정 / 현재 상태·source writer→consumer | 예시·집중 완료 조건 | 우선도·크기·의존 |
| --- | --- | --- | --- |
| 1 · 8.2·8.3 | 획득·소비·보유 골드 장부. **재현·8.2.1 구현, 출시 게이트 대기**: newPS/addGold→advanceItemPurchases/applyItemCraftAction→ward/전투. 기존 actual craft가 ps.gold를 차감하지 않았음; 현재 검증은 8.2.1 참조 | 기존 evidence의 실제 10명 cost/bank 대조; 벌고 쓴 금액과 잔액 일치, 부족/중복/조합 거절·원자성·save 검증 | P0·중; 실제 recipe/cost |
| 2 · 8.2·8.6 | 구매 가능 시점과 실제 구매 시점. **승인·검토**: addGold의 자동 구매→귀환/가용 상태 | 전장 획득 골드가 즉시 장비 효과가 되는지 재현; 검토된 구매 장소/귀환 조건 소비, manager 조작 추가 없음 | P1·중; 1·9 |
| 3 · 8.3 | 골드와 실제 장비 전투력의 중복. **코드 한계**: combatStats0의 goldEarned×ITEM_CONV와 systemEffects 동시 소비 | 같은 획득 골드/다른 실제 장비·미소비 골드의 차이; 장비별 구매·효과 인과, source 없는 계수로 대체 금지 | P1·대; 1·4·11 |
| 4 · 8.2 | 구매 writer 합법성. **승인·부분 구현 감사**: systems의 plan/craft/advance, role-quests equipment→inventory/effects | 재료·가격·고유/배타 그룹·6칸 결합·boots/champion·역할 보상; 허용 repeated component와 불허 final 중복 구분 | P1·대; pinned 누락 metadata 확보 |
| 5 · 8.5.1 | 막타 골드와 주변 XP 분리. **코드 한계**: incomeTick CS×58→addXp/level | 막타 실패 vs XP 수급 범위 밖을 분리; 27분 MID 임의 목표 레벨 금지 | P1·대; minion XP/share source |
| 6 · 8.5 | 웨이브 실제 공급량. **승인·검토**: lanePush/incomeTick→CS/gold/XP | 생성·도착·사망·잔여 미니언보다 많은 수입 불가; 종류별 공급/수요 장부, 이전 history 보존 | P1·대; 5·patch spawn/reward |
| 7 · 8.5·8.3 | XP 공유·역할 자원 배분. **승인·검토**: income/quest→levels/purchases | support 동행/정글 cover/roam/사이드 독식의 개인·팀 자원 차이, 국소 공유 대상·시간 조건 | P1·대; 5·6·9·source |
| 8 · 8.5 | 캠프별 가용성·처치 비용. **승인·검토**: jungleTick/jgNext/income→동선/XP/구매 | camp 생성·respawn·HP/resist·clear time·reward·이미 먹힘/카정, farm 대신 gank의 실제 손실 | P1·대; camp metadata·9 |
| 9 · 8.6 | 귀환·부활·이동 시간. **코드 한계**: laningTick 귀환 즉시 hp=1/recall→income/합류 | recall 시작/중단/완료·구매·복귀 중 공백; 회복 직후 원위치 전투나 용 합류가 가능한지 반례 | P1·대; 1·2·10 |
| 10 · 8.3·8.6 | 부분 시간 자원·참여 손실. **승인·검토**: deadUntil/penalty/분 tick→income/fight | 같은 사망 시간의 분 경계 전후 수입/XP/합류 차이; 절대 시각 vs 표시 시각 구분 | P1·중; 5·9·33 |
| 11 · 8.3·9.1 | 피해 유형별 방어. **코드 한계**: combatStats0 arm/mr 혼합 EHP→fight | 물리/마법/고정 피해별 상대 방어 빌드 대응; 피해 subtype·원천·실제 stats 검토 | P1·대; 3·4·source |
| 12 · 8.4 | 팀 방어 감소와 개인 관통. **승인·검토**: reviewed effects→실제 피해 consumer | 적용자·stack/order·coverage/uptime·수혜 공격자; 같은 방어 감소 두 번 중복 효과 반례 | P1·대; 11·mechanics source |
| 13 · 8.6 | 접근 가능한 공격 대상. **승인·검토**: fight target selection→damage | 후방 딜러 선택 전에 range/access/frontline/peel/disengage 조건; aggregate 접근 한계 명시 | P1·대; 14·17·28 |
| 14 · 8.3·8.6 | 순간·지속 피해의 시간 차이. **기존 burst/ext/clean 보강**: fightSkillPhase/fight→damage | 짧은·긴 실제 교전의 공격 가능/생존 시간과 누적 피해 차이; 고정 승률 설정 금지 | P1·대; 13·15·16 |
| 15 · 8·9.1 | 핵심 스킬/소환사 주문 가용성. **점멸 등 기존 상태 감사**: flashAt/roleQuestSmite/skillProfile→행동 | 재사용 전 사용 불가, 직전 교전 소모가 다음 운영에 영향; 검토된 cooldown·지원 효과만 연결 | P1·대; source·시간 상태 |
| 16 · 8.3 | 실제 마나/기력 등 자원. **코드 한계**: combatStats0 resource 계수→off | 부족/소모/회복이 가능한 행동·지속 시간을 바꿈; 서로 다른 자원 규칙/소스, 없는 자원 발명 금지 | P1·대; 14·15·source |
| 17 · 8·9.1 | CC 종류·겹침. **aggregate cc 기존 보강**: skill profile→fight 접근/시간 | stun/root/slow/displacement별 공격·이동·해제와 overlap; 모르는 CC 시간 임의 설정 금지 | P1·대; 13·15·source |
| 18 · 8.4 | 유효 회복/보호막/치감. **승인·검토**: system/skill effects→실제 HP/수혜 대상 | full HP overheal·unused expired shield·사망 대상·중복 치감; 유효량과 원래 생성량 분리 | P1·대; 11·17·source |
| 19 · 8.3·12.9 | 실제 피해와 overkill. **검토 필요**: fight의 d와 round(d×.9)→HP/dmg/dmgTaken/quest | 남은 HP보다 큰 한 번 피해, blocked/shielded/overkill 구분; 실제 감소와 통계/퀘스트 일관성 | P1·중; 11·18 |
| 20 · 8.2–8.4·9.1 | 조건부 item/rune 효과. **systemEffects 소비자 감사** | 조건/target/cooldown/횟수/적용 불가 이유; passive 수치만 합산한 상태를 전체 메커니즘 완성으로 간주하지 않음 | P1·대; 4·15–18·source |
| 21 · 8.4 | 팀 utility 배분. **승인·검토**: selectItemBuild→actual applicable effects | 치감/방깎 안정 적용자·damage type·coverage·대체 장비 비용; 모든 선수 동일 counter 중복 구매 비교 | P2·대; 4·12·18·20 |
| 22 · 8.6 | 교전 뒤 잔여 전력. **승인·검토**: fight survivors/hp→convert/objective | 살아 있지만 HP/자원/cooldown 부족해 baron 포기, 역습/귀환/웨이브 손실; 승리와 다음 행동 가능성 분리 | P1·대; 9·14–18 |
| 23 · 8.5·8.6 | 웨이브 상태 지속. **lanePush proxy 보강** | 쌓인 wave/도착/clear time/freeze/억제기 pressure가 다음 선택에 남음; 상태를 장식 값으로 추가하지 않음 | P1·대; 6·9 |
| 24 · 8.6 | 구조물 공격 조건. **takeStructure/towerTick 보강** | wave/살아 있는 공격자/방어 병력/보호 규칙/시간·퇴로 확인; 우세 score만으로 즉시 철거하지 않음 | P1·대; 22·23·source |
| 25 · 8.6 | 다이브 비용. **승인·검토**: laning/fight/tower→피해/죽음/전환 | turret aggro/target switch·적 증원/퇴로·생존; 킬 이득보다 손실이 큰 사례, 알려진 규칙 근거 | P2·대; 9·13·24 |
| 26 · 8.5·8.6 | 오브젝트 처치/교환 비용. **objectiveTick/convert 보강** | clear time/받는 피해/smite/접근/반대편 손실; 먼저 확보한 objective가 언제나 이득이 아닌 paired 사례 | P1·대; 8·15·22–24 |
| 27 · 8·9.1 | 버프의 실제 소비. **combatStats/tower의 기존 buff 감사** | 소유·만료·갱신, patch별 baron wave/공성·elder 지원 효과; 고정 전투 배수만으로 전체 효과 완료 주장 금지 | P1·대; 20·23·24·source |
| 28 · 8.6·3 | 시야 위치/수명/마지막 관측. **visionTick scalar 보강** | 현재 보임 vs last seen·기간 경과 uncertainty, 제거/만료/정보 공유; 정확 2D sight geometry 주장 금지 | P1·대; 9·23·source |
| 29 · 8.6·7.1·3 | 관측 가능한 AI 판단 입력. **조사 가설**: jungle/teamCall/macro/draft→선택 | 실제 상대 HP/위치/cooldown을 비관측 상태에서 읽는지 감사; 엔진 참 상태와 합법적 판단 정보 분리 | P1·대; 28·기존 observation |
| 30 · 7.1·8·6 | 전술 실행 가능성. **기존 tactics/콜 보강** | aggressive 지시 vs 조합/wave/자원/도착/실행력, 불가능 조건·대기·실패 사유; forced success 금지 | P2·대; 9·13·22·28 |
| 31 · 7.1 | 근거 있는 series 적응. **series/draft evidence 소비 감사** | 실제 이전 세트 공개 pick/운영·자기 소유 관측만 다음 세트 사용; enemy private/future state 금지 | P2·중; 29·기존 series source |
| 32 · 2·6·8 | 피로/숙련/팀워크 영향 분리. **기존 playerMod/mf/sk/mods 감사** | 판단·실행·협업 중 실제 적용 위치/겹침; 단일 반복 보너스·임의 handicap 금지, 동일 조건 비교 | P2·대; source·30 |
| 33 · 8.1 | 동시 사건/처리 순서. **넥서스 경계 구현, 나머지 검토**: fight queued damage/순서→kill/reward | 양쪽 교환·이미 예정된 공격·caster 사망·objective 경합, 배열/side 순서 반례; 새 동시 규칙은 명시적 검토 | P1·대; actual timing/source |
| 34 · 8·9 | 효과/보상/cache 일관성. **조사 가설**: quest/equipment/buff/combatStats cache→결과 | 같은 event 재처리·만료·장비 변환 뒤 cache stale, actual writer 변경과 실제 effect; logger 제거 금지 | P1·중; 4·15·20·27 |
| 35 · 8·12.9 | 설명과 계산 일치. **기존 event-time source 보강**: actual events/expl→review | 실제로 사용한 원인·관측/추론/평가 구분, unsupported 인과 단정/과거 재구성 금지; source 링크·권한·save | P2·중; 각 실제 consumer |
| 36 · 9.1·7.1·8 | patch 실제 파급. **기존 revision/consumers 감사** | price/stats/recipes/effects/skills/spawn/rewards 변경→구매/draft/combat/macro, paired before/after·rollback | P1·대; 1–34·reviewed source |
| 37 · 3·7·8·9 | organized competition 보정. **외부 자료 미수집·미검증** | source/license/game IDs/중복/결측/단위 검증 후 role CS/XP/resource/purchase/objective·시간 분포 및 chronological holdout | P2·대; 수집/검증·기계적 정확도 |
| 38 · 8·9·12 | 재현성과 engine version 경계. **기존 seeded/save 보강** | 같은 input/patch/seed·side 교환·표시/정렬/noise 영향·save 연속; 새 engine 결과 변화와 보존된 역사 분리 | P1·중; 모든 writer/consumer |

### 8·9 추가 source 발견 — 기존 승인 조건 보강, 완료 아님

이번 코드 읽기에서 아래 후보를 추가했다. **코드 표현 확인과 실제 경기 결함 재현은 구분**하며, 새 가격/효과/정책을 확정하지 않는다. 모두 위/기존 승인 항목의 구체적인 반례로 통합하며 신규 기능 수를 늘리지 않는다. 관측/UI/save/rollback/AI 계약은 위 공통 기준을 그대로 적용한다. 우선순위는 P1이며 구매 장부 첫 단위 이후 해당 consumer의 수직 작업에서 조사한다.

| 추가 발견·상태·기존 담당 | source/trigger·입력/단위·writer→consumer | 이익·반례·의존/비용·정확한 다음 조사 |
| --- | --- | --- |
| 저체력의 교전 진입 최소치 — **8.4.1 재현·교정, 원본 조사 근거 보존**, 8.3·8.6/목록 18·22 | fight가 F.hp=EHP×clamp(ps.hp,.2,1)로 시작하지만 교전 후 hp는 .05까지 저장한다. HP ratio 5–19% 생존자의 다음 교전 진입 | 자동 회복 없이 5% 상태가 20% 시작으로 상승하는지 실제 연속 교전 재현. 부활/시간 회복과 다른 현상으로 구분; aggregate 최소치의 근거 검토, 무조건 삭제/계수 교체 금지. 중·HP 회복/시간 상태 의존 |
| 오브젝트 획득 두 writer의 기록 차이 — **8.6.1 실제 재현·구현, 전체 참여 모델 미완료**, 8.5·8.6/26·34 | objectiveTick.run은 involved.objectives/epics/jungleStacks와 reward를 처리; convert의 직접 baron 경로는 barons/buff/gold/log만 처리 | 동일 실제 획득이 경로 때문에 참여 기록/quest 진척 누락·중복되는지 실제 paired fixture. 실제 참여자는 관측/가용·시간 조건으로 정하고 무조건 alive 전원 배분 금지. 중·공유 actual award writer 검토 |
| patch 밖의 보상 상수 — **코드 확인·규칙 감사 필요**, 8.3·9.1/1·36 | takeStructure gold 250/300/350, dragon 40, baron 300, 일부 elder spawn/buff 상수 등과 patch.rules 소비 경계를 대조 | reviewed 패치 보상이 실제 모든 지급 경로에 닿는지 확인; source 없는 값을 규칙으로 옮기는 것만으로 정확성 완료 아님. 중·source/license/version·2경로 의존 |
| assist 배분/반올림 보존 — **8.4.2 실제 지급 재현·중복 writer 교정, 반올림 정책 교정 미완료**, 8.3/1·19·34 | killPlayer가 assistGold/as.length를 각각 Math.round; killer/victim/assist 대상 목록→실제 gold/XP/quest | 지원 규칙에 따른 총 지급량·대상 유일성·killer 제외·유효 관여 확인. 반올림 오차를 무조건 버그로 단정하지 않고 정책/단위 확보, 1/2/3/4명 반례. 중·실제 assist source |
| global/local 보상 수령 자격 — **규칙 확인 후보**, 8.3·8.6/7·24·26 | tower/dragon/baron이 aliveOf에 보상을 지급하는 경로. 사망한 아군 vs 실제 근처 공격자/참여자 | patch의 팀 전역/국소 지급·사망 상태 규칙을 대조, 지급 자격과 참여 기록 분리. 죽은 선수 항상 지급/미지급으로 새 규칙 발명 금지. 중·metadata·실제 source |
| sort comparator 안 난수 — **코드 확인·재현성 가설**, 8.6/33·38 | takeStructure lanes.sort comparator가 st.rng.dec.next 소비; 정렬 호출 순서→다음 실제 의사결정 stream | 지원 runtime/같은 input 재현과 total-order/동률·정렬 소비를 최소 fixture로 확인. source 없는 정책 변경 없이 사전 seeded keys 등 검토; 출력 변화면 의도적 변경으로 기록. 중·seed/side parity |
| 전투 능력치 cache 갱신 조건 — **미재현 가설**, 8.3/3·20·27·34 | combatStats key는 t/goldEarned/lvl/questRevision/buff/soul; 실제 items/runes/patch 상태 변경 writer가 모든 경로에서 key를 바꾸는지 감사 | 같은 시각 장비 변환/조건 효과/patch snapshot에서 cached vs fresh combatStats0 결과 비교. stale 재현 전에 cache rewrite 금지; measured 성능·behavior parity. 중·실제 mutation 경로 |
| 구매 preview의 공유 상태 — **코드 alias·미재현 가설**, 8.2/1·4·34 | advanceItemPurchases preview={...ps,items:ps.items.slice()}, applyItemCraftAction→syncRoleQuestEquipment; items 외 quest/관련 객체 공유 여부 | 슬롯 부족/중간 조합 거절 preview가 원본 quest/equipment/state를 바꾸는지 before-after 비교. 실패·중복 시 bank/inventory/quest/RNG 불변; 필요한 clone/순수 검증 경계만 적용. 중·actual quest writer/ledger |

**정확한 다음 구현 순서:** 8.2·8.3 실제 구매 장부 첫 45–55분 단위 → 실제 inventory/골드 전투력 중복 감사 → source-backed 8.5.1 XP·웨이브 → camp/귀환·이동·실제 참여 시간 → 피해/방어/효과 → 정보 기반 운영. 의존이 겹치는 반례는 해당 수직 단위에 함께 검증한다. 전체 approved scope/숫자 roadmap, 엔진 최우선, 한 worker, 정확한 head CI/순차 merge/validated HTML·Pages, 원본/실패/이력 보호와 최종 장기/실기기 QA 보류를 유지한다.


### 8.2.1 실제 구매 장부·원자적 조합·기록 연결 — 2026-10-04

범위/추정: 기존 8.2·8.3의 한 worker 45–55분 수직 단위. `fix/item-purchase-ledger`는 main `b1cf7abb`에서 시작했으며 구현/로컬 수용 완료, PR·정확한 head 전체 CI·병합·게시 게이트는 아직 대기한다. 등록된 38항목 전체 완료가 아니다.

- 재현/원본: [실제 10명 기존 장부 결함](evidence/item-purchase-ledger-gap.json)을 보존한다. starter만 차감하고 이후 recipe writer가 장비를 지급하면서 실제 bank를 차감하지 않았다. 추가 500 누적 threshold는 시작 골드가 이미 earned에 포함된 상태에서 실제 구매를 늦췄다. 현재 writer는 패치의 actual recipeCost/from/active 정보를 검증하고 실제 잔액을 차감한다. 선수/AI 모두 같은 engine-owned 경로를 사용하며 새 감독 조작은 없다.
- 새 `item-purchases.js`는 순수 inventory 검증→전체 조합 비용/재료 multiplicity/6칸 검사→단일 commit을 소유한다. 부족·잘못된 가격·누락 재료·불법 final 중복·champion boots·반복 실행은 지출/장비/quest를 바꾸지 않는다. 반복 component는 허용한다. 기존 starter disposal은 실제 시작 아이템에만 한정하고 환불을 만들지 않는다. source에서 값싼 recipe component도 starter로 분류되어 있어 기존 blanket disposal은 실제 재료를 버렸고, 기존 writer는 누락 재료를 무시했다. 실제 6,866개 champion/role build 검증으로 이 연결을 확인했다.
- 미완성 boots recipe를 MID/ADC 퀘스트 무료 변환이 먼저 소비하지 않도록 최종 조합까지 보류한다. 완료 뒤 기존 무료 upgrade/별도 boots 보상을 유지한다. support ward는 실제 bank를 사용하고 소비 금액/동일 시점 중복 제한을 유지한다. preview는 quest를 호출하지 않는다. 이전 shallow alias의 구체적 quest 손상은 미재현 상태이며 새 순수 preview 검증을 원본 결함 재현으로 부풀리지 않는다.
- 실제 inventory 변경 revision을 기존 combat cache에 연결했다. earned gold가 같은 상태에서 장비를 구매한 반례에서 cache와 fresh 계산의 실제 효과가 일치한다. combat 계수/AI 정책을 바꾸지 않았다.
- `match-history.js`는 실제 official 결과에 optional resources v1(earned/items/wards/held)을 저장하고 10명/비음수/장부 등식/기존 earned row를 검증한다. `ui-match-history.js`는 선택적 ‘종료 당시 골드 사용’만 보여준다. 아이템 목록 열은 복원하지 않는다. 기존 기록에 없으면 저장되지 않았다는 상태를 표시하고 현재 상태로 재구성하지 않는다. full/lite save의 기존 publicRecord 경계를 재사용한다. practice는 기존 참가자/현재 권한 경계를 따르며 공개 official 분석으로 편입하지 않는다.
- focused 수용: 실제 1,380개 구매 action, 4개 logged/quiet seed/side paired match, 정확한 비용·잔액 보존·재료/가격/잔액 거절·6칸 atomic combine·MID/ADC/SUP·같은 earned cache·official writer/UI·위조 source 거절·legacy/lite save·fired practice 경계 통과. UI 통합 63 acceptance/62 독립 VM, 133-module static/build, system 16경기/6,866 inventory, ending 6 pairs와 regression 통과. Chromium 1280/320px에서 실제 First Selection/수동 밴픽/공식 Bo3 3경기·pending/history save·장부 펼치기/키보드·분석 필터/source·fired/overflow 검증 통과. 정책상 동일 rebuilt HTML 주입이며 실제 production HTTP 검증/최종 기기 QA는 아니다.
- 결과 해석/원본 보호: 구매 시점/잔액/장비 가용성이 교정되므로 승패·income이 달라질 수 있는 의도적 판정 수정이다. 이전 seed13/21 behind-win 증거는 원본 commit 그대로 보존하며 현재 자연 발생 seed19/22에서 뒤진 골드→실제 교전/접근→넥서스 반례를 확인했다. 검사 script가 기존 임시 scenario JSON을 덮어쓴 실수는 새 결과를 별도 파일로 분리하고 정확한 b1cf7abb 입력/함수로 복원한 뒤 원본 전체 bounded log 일치를 확인했다. 원본 committed evidence는 변경하지 않았다.
- 진단: `/tmp/item-ledger-system-first.log`의 실제 recipe stall, focused-first의 fixture esc 누락, ending-first의 의도적 timing 변경에 따른 구 seed 반례 실패, original-scenario restoration의 sandbox/중복 선언 실패와 최종 원본 일치, 이전 사용량 auto-review 실패를 보존한다. 최신 성공은 각각 corrected 로그이고 원 실패가 성공이었다고 주장하지 않는다. `/tmp/item-ledger-browser.log`, integration/build/regression/system/focused/ending 로그와 원자료를 유지한다.
- 한계/후속: 아직 실제 상점 위치/귀환·이동과 구매 시점이 연결되지 않고, 기존 earned-gold generic 전투력 계수도 남는다. sale/refund, 모든 exclusive group, conditional item/rune 효과와 team utility coordination의 전체 합법성/현실성을 완료했다고 주장하지 않는다. 다음 엔진 단위는 실제 inventory와 generic earned power의 이중 소비를 source/consumer로 재현하고 검토된 효과 경계로 교정하는 것, 이후 8.5.1 source-backed wave/XP다. 현재 퀘스트/slot 전환의 기존 aggregate 한계를 유지한다.

### 12.3–12.5 시작 화면 최신 사용자 방향 및 진행 중 위험 연결

최신 승인: 처음 화면은 ‘새로 시작하기 / 불러오기 / 설정’만 제공하고 긴 리그·국제대회·생성 세계 설명을 제거한다. 팀/커리어 선택은 새로 시작하기 이후 실제 흐름으로 옮긴다. 스크린샷의 국제대회 undefined 문구는 실제 UI 결함 증거다. 이 변경은 아직 구현되지 않았으며 구매 장부 후 별도 coherent UI 단위에서 실제 new/load/settings·취소·키보드·반응형·기존 저장/route 연결을 검증한다. 진행 중 주요 메뉴는 상단을 유지하고 저장 utility·아이템 열 제거·관측 radar 승인은 그대로 유지한다.

게임 진행 위험은 기존 승인 목록에 병합한다: 장비 재료 삭제/조합 및 quest 변환은 8.2.1 재현·수정; 낮은 HP 바닥/중립목표 두 writer/patch reward/분배·반올림은 위 추가 감사의 코드 가설; offseason 만료·임대·등록 순서와 연기 일정의 피로/준비/pending 참조는 4·10·11 연결 검증; 저장 실패/반복 action의 보상 중복·원자성은 11; 이적/해임 후 report 권한과 현재 patch의 과거 재구성은 3·9·12 관측/역사 경계다. 미재현 위험은 결함 확정으로 표시하지 않으며 각 실제 trigger/기존 writer/거절·save 반례를 해당 도메인 단위에서 검증한다.

최신 연결 승인(2026-10-04): 한국어 단일 지원에서 기능이 없는 ‘공용어 사용’ 설정은 시작 화면 정리 단위에서 제거한다. 구매 장소는 일반적으로 아군 기지 상점이며 오른은 실제 patch-pinned passive 구매 예외를 검증해야 한다. 8.2.1은 bank/recipe만 교정했고 상점 밖 자동 구매 제한을 완료하지 않았다. 다음 8.2.2는 현재 recall/respawn/travel/기지 상태 writer→구매 가능 consumer→actual effect timing→official/save 반례를 우선하고, source로 검토된 오른 조건 외 전장 구매를 허용하지 않는다. 이동·귀환 모델에 없는 상태는 임의 계수로 꾸미지 않는다. 실제 아이템/generic earned 전투력 중복 감사와 8.5.1 wave XP는 이어지는 엔진 우선순위로 유지한다. 표의 항목별 위/아래 정렬 요청은 12.5·12.9의 정렬/컨텍스트 유지 조건에 등록하되 열 정렬/화면 배치 의미는 확인 중이다.


<a id="recruitment-language-refinements"></a>

## 2·3·4·12 영입·의사소통·FM 참고와 세부 편의성 — 2026-10-04 전체 문서화

이 절은 사용자 직접 문서화 요청으로 추가했다. 기존 단계/승인 조건의 구체화이며 별도 24개 기능으로 집계하지 않는다. 등록은 구현/출시가 아니다. 8.2.1 actual ledger PR #172 최종 head `d309a635140e514b3a15c845a6a42dd2f7c0962e`의 전체 CI `37175037544`(medical 4 seed/2 aggregate/verify 포함) 성공 후 main `a529566d838f50f1b6215ffa07bba9c9b9f61b30`로 순차 병합했다. 같은 main 전체 CI `37175385189`·standalone-sync와 Pages `37175728063` 게시가 성공했다. Pages의 fully validated checkout/superseded guard/성공 artifact 다운로드/launcher·offline 조립/게시 steps를 확인했다. 직접 github.io HTTP는 Cloud 정책 차단으로 별도 검증되지 않았다. 이전 171 evidence와 현재 코드/HTML parity를 보존한다.

### 확정 방향과 실제 현재 상태

1. **언어 규칙 변경 승인(2·5·6·8·12.5):** ‘가상 공용어로 해외 선수 의사소통 페널티 없음’ 규칙을 사용자의 ‘의사소통 패널티 되살리자’가 대체한다. `ui-market-initial.js`의 고정 ‘공용어 사용’ 안내는 시작 화면이 아니라 게임 시작 뒤 첫 영입 화면이다. 기존 규칙/표시는 원래 결정의 증거로 유지하며 실제 교체 후 최신 UI에서는 제거한다. 언어 숙련/팀 실제 업무 언어/적응 시간은 **승인·미구현**이다. 기존 `teamAdaptation`, playerMod/lineupCohesion, practice-resources의 적응 writer를 조사해 일반 팀워크와 중복 페널티를 막는다. 국적 하나로 숙련을 정하거나 외국 선수를 일괄 불이익 처리하지 않는다. 각 입력 단위/생성·학습 writer/실제 수행 consumer/훈련 기회비용/관측 권한/legacy 기본값과 효과 크기는 검토 후 확정한다. 실제 이적→영입 정보→훈련/적응→경기 수행→save/AI 대칭을 수용해야 구현 완료다. 기존 결과/계약을 소급 변경하지 않는다.
2. **초기 영입 정보(3·4·12.5):** FM의 아이디어는 자산/문구/브랜딩 복제가 아닌 목록→관측 능력/보고서→조건→협상→목록 복귀 흐름이다. 현재 first market는 기량/잠재 범위가 있지만 이름이 inert text이고 상세 연결이 없다. ui-player/scouting의 existing observed reports/metrics를 재사용해 계약 전 강점/약점/포지션/합법적으로 관측된 champion/신뢰도를 보여준다. 내부 observedPlayerCoreMetrics가 true core를 반환하는 분기가 있으므로 명칭만 믿지 않는다. hidden 정확한 attrs/potential/타팀 practice를 공개하지 않는다. 실제 후보 상세→보고서→기존 evaluation/negotiation→취소/확정→선택/스크롤 복귀→save가 수용 경계다. **승인·미구현**.
3. **지역 후보 기본값(3·4·12.5):** 기본 지역 내, 해외, 전체 구분을 유지한다. 활동 지역·출신/국적·리그 local 자격·업무 언어 숙련은 서로 다른 개념이다. 현재 initial scope all/local은 eligibility를 사용하므로 그대로 ‘지역 내 활동’이라고 바꾸지 않는다. 생성/현 소속/FA 기록의 실제 region 의미를 검토하고 탭 기준을 정의한다. 해외 출신의 기존 언어 숙련과 국내 출신의 비로컬 자격 반례를 포함한다. default/탭 이동/전체 보기/정렬/권한/관측 범위·return/save를 검증한다. 해외 영입 금지·강제 확인·새 agency fee는 없다. **사용자 방향·구현 대기**, 세부 활동 기준은 source 조사 대상.
4. **처음 화면(12.3–12.5):** 새로 시작하기/불러오기/설정만 제공하고 긴 세계/리그 설명을 제거한다. 팀/커리어 선택은 새로 시작하기 다음으로 연결한다. 실제 screenshot undefined 국제대회 문구를 보존하고 관련 현재 화면 writer를 교정한다. 실제 new/load/settings·취소·기존 save·키보드·좁은 화면 연결이 완료 조건이다. 주요 career nav는 상단, save utility는 별도, 화면은 절제된 typography/table hierarchy를 유지한다. **승인·미구현**.
5. **정렬/레이더(12.5·12.9):** ‘항목별 위/아래 정렬’은 열 오름/내림 또는 화면 배치 의미 확인 질문을 보냈으며 아직 답이 없다. 우선 표 열 정렬을 작업 가정으로 삼고 현재 기준·방향·동률 안정성·미관측값·filter/선택/scroll과 keyboard를 검증한다. 레이더는 관측 능력과 실제 경기 지표를 분리하고 같은 context 비교/숫자 표/source/missing axes를 유지한다. **승인·미구현**, 가짜 normalization·KDA 단일 우열·다른 역할의 확정 순위는 없다.
6. **구매 장소(8.2.2):** 일반 선수는 실제 아군 기지 상점에서 구매하고 오른은 검토된 passive 예외다. pinned Riot Data Dragon16.19.1/sourceCommit1cf34d485c572a9894c223efd3d66c1e5ad7f22f의 간이 대장간 설명은 ‘어디에서든 골드를 써서 소모품을 제외한 아이템 제작’이다. current recall은 hp 회복/다음 income 감소 flag이며 기지 체류·귀환 완료·복귀 상태가 없다. 실제 main seed record-official의 read-only kill/commit wrappers에서 **처치 처리 안 구매27회**를 재현했다. 3분 JarvanIV/Nilah boots 700조합은 recall=false다. 원본 `/tmp/item-ledger-shop-baseline.log`와 probe를 보존하고 결과/RNG를 변경하지 않았다. **재현·미수정**, 다음 coherent45–55분 엔진 단위에서 상태/writer/consumer/source를 연결한다. 임의 귀환 시간/전장 위치·계수나 모든 오른 구매 허용으로 해결하지 않는다.

### 최근 제시한 세부 아이디어 전체 — 기존 담당 단계에 병합

공통 수용: 아래 trigger→기존 writer/관측/권한을 먼저 확인한다. 실제 source가 없으면 ‘없음/불확실’이며 숫자를 만들지 않는다. 효과 없는 fake control은 추가하지 않는다. 상태 보존은 world/save slot/권한 변경 시 해제·재검증하고 취소/중복/rollback/save/AI 영향까지 기록한다. P1은 실제 의사결정·오류 방지, P2는 그 위 탐색 편의성이다. 작은 UI는 개별 PR로 쪼개지 않고 해당 화면의45–55분 flow에 함께 구현한다. source/engine 의존이 큰 것은 별도 수직 단위다. 아래 상태는 **첫12개 사용자 전체 추가 승인**, 뒤12개는 **기존 승인 범위의 등록·검증 후보**이며 재현되지 않은 결함을 확정하지 않는다.

| 담당/우선 | trigger·현재 문제 또는 후보 | 개선과 선수-facing 예 | 비용/의존·수용 |
| --- | --- | --- | --- |
| 3·12.5/P1 | 낮은 기량과 적은 정보 혼동 | 정보 부족 표시: 낮은 점수와 미관측 구분 | knowledge/report 범위; 공개→관찰 변화·missing counterexample |
| 2·3·12.5/P1 | 포지션 다른 종합 점수 비교 | 역할 핵심 능력 강조, SUP/ADC 동일 우열 금지 | 기존 role weight/observed source; hidden getter guard |
| 4·12.5/P1 | 보고서를 닫고 선수를 재검색 | 보고서→현재 합법 협상 직접 이동 | 기존 shared command/preconditions; stale/fired 거절·취소·복귀 |
| 3·12.9/P2 | 후보 비교 반복 이동 | 임시2–3명 비교함, 능력 범위/연봉/역할/언어 나란히 | 관측/동일context; 수/축 누락·departed/save-slot reset |
| 4·5·12.5/P1 | 영입 이후 제한을 뒤늦게 발견 | 실제 선수단/비로컬/연봉 전후 미리보기 | 기존 preview/rule authority; 실패 불변·real commit 일치 |
| 2·6·12.5/P1 | ‘적응 중’ 이유/변화 없음 | 실제 언어 학습/적응 변화 기록 | 새 언어 writer 승인·미구현; 과거값 보존·no invented improvement |
| 7·10·12.5/P1 | 준비 제한이 여러 화면 분산 | 실제 등록/부상/역할 blockers 한곳 표시 | 현재 rule writers; allow/reject 동일·최신성 |
| 8·12.9/P1 | 복기 사실과 추정 혼동 | 저장된 사실과 평가 라벨 구분 | existing public record/private reason; legacy missing·불변 |
| 12.5/P2 | 현재 표 순서 불명 | ‘요구 연봉 낮은 순’ 등 활성 정렬 제목 | sort/context; 동률·키보드·미관측·필터 |
| 3·11·12.9/P1 | 이적/은퇴 후 비교 stale | 대상 이탈 상태/당시 report 날짜 표시 | existing history/observer-first; 현재 권한·save load |
| 11·12.6/P2 | 같은 제한 반복 알림 | 실제 제한이 바뀌었을 때 갱신 | event identity/state change; 중요 deadline 누락 금지 |
| 12.5/P2 | 상세/협상 후 위치 분실 | 선택 선수/필터/scroll 복귀 | transient routing; cancel·slot/world reset·focus |
| 3·12.5/P1 | 같은 이름 후보 오선택 가설 | 포지션/나이/소속 식별 정보 | actual ID stable; 동명이인 fixture·source label |
| 3·12.5/P2 | 빈 검색의 원인 모름 | 어떤 filter로 후보가 제외됐는지 안내 | real filtered counts; hidden/private counts 노출 금지 |
| 3·12.9/P1 | 겹치는 추정 범위의 확정 우열 | 65–75/68–78이면 판단 유보 | observed intervals; arbitrary confidence/tier bonus 없음 |
| 4·12.5/P1 | 새 협상에서 달라진 조건 찾기 | 연봉/기간/역할 변경만 표시 | 실제 prior/current offer; stale/cancel/save 원본 |
| 4·5·12.5/P1 | cash와 쓸 수 있는 돈 혼동 | 지급 의무와 현금 별도 표시 | existing finance/payments; 예약/확정 중복 차감 금지·units |
| 4·7·12.5/P1 | 조건부 계획이 확정처럼 보임 | ‘영입 성공 시’ 계획 라벨 | 실제 pending/committed source; no premature roster mutation |
| 4·10·11/P1 | 같은 선수 임대/방출/등록 충돌 가설 | 최신 계약/소속 재검증·정확한 막힘 이유 | shared command version/ownership; stale/duplicate atomic |
| 2·4·12.5/P1 | 약속과 실제 기용 비교 반복 | 약속 역할↔실제 usage 나란히 | original promises/actual official appearances; 부상/시점 context |
| 7·9·12.5/P2 | 전체 patch를 읽어야 내 영향 파악 | 실제 주력/현재 lineup 관련 변경 먼저 | reviewed pinned before/after; 미래/hidden enemy prep 금지 |
| 3·9·12.9/P1 | 평가 변화 원인 혼동 | 선수·표본·patch·filter 변화 구분 | original snapshot/source/date; no causal certainty 재구성 |
| 3·12.9/P1 | radar 면적/다른 단위 오해 | 축 단위/역할/표본/누락 설명 | authorized radar/numeric table; no fake axes·accessible missing |
| 4·11·12.5/P1 | 권한 상실 전 열린 dialog stale | 해임/이적/구단 변경 후 적용 차단 | observer-first + command authority; saved/reopened dialog counterexamples |

정확한 이어가기: 현재172 main/standalone/Pages follow-through 확인 후8.2.2 기지 구매 상태·오른 예외가 엔진 최우선. UI는 startup→실제 팀 선택→지역 후보/관측 능력 상세·비교→기존 협상→복귀의 coherent 단위로 교체한다. 언어는 그 화면의 가짜 상태로 먼저 표시하지 않고 실제 적응 writer/수행 consumer 단위와 함께 연결한다. source metadata 부족·공개 전문 경기 미수집은 정직하게 기록한다. long/device/TalkBack final QA는 여전히 보류다.


### 추가 긴 목록 전체와 구단 차원의 업무 언어·지원 지출 승인

최신 사용자는 추가 아이디어 전부를 기존 단계에 추가하고, 업무 언어와 그 지원 지출을 **팀 차원에서 판단**하도록 승인했다. 이는 감독이 매번 언어/금액을 입력하게 만드는 정책 제안을 대체한다. 구단의 실제 선수·스태프 언어 상태, existing owner/finance authority와 cash/확정 의무를 사용해 판단하고 actual ledger/shared command/AI-player parity로 지출한다. 결정 이유·실제 지급·적응 상태는 lawful UI/news에서 확인 가능해야 한다. 실제 cost/learning rate/source/model이 없는 지원 항목에 가격/보너스를 발명하지 않는다. 업무 언어 선택·staff 지원 경로·학습 기회비용/훈련 자원은 승인된 구단 정책의 세부 구현 조사다. 기존 manual manager authority 전체를 임의로 자동화하는 승인이 아니며 언어 운영의 구단 차원 판단으로 한정한다. **승인·미구현**. 과거 common-language 결정과 과거 결과는 original evidence로 보존하되 현행 지시로 취급하지 않는다.

다음은 대화에서 추가로 제시한 긴 목록 전체다. 사용자 전체 추가 승인이며 기존 단계의 concrete acceptance로 통합한다. source 조사 전 확정 결함/구현 완료로 표시하지 않는다. 각 행의 기존 domain writer/source와 실제 trigger를 검사해 input/unit/authority/tradeoff/UI/save/rollback/AI를 구체화한다. 같은 도메인 항목은 coherent45–55분 slice로 묶고 source/state 기반이 필요한 것은 선행 단위를 의존한다. 신규 effect/정책 숫자를 임의로 도입하지 않는다.

| 담당/우선·의존 | 전체 구체화 항목 | benefit·tradeoff·수용 경계 |
| --- | --- | --- |
| 8.2·8.6/P0–P1·actual travel/shop | 획득/완성시점 분리; 귀환 목적(회복/구매/회피/목표준비); 압박 때문에 못 하는 귀환; 귀환 후 목표 도착; 사망 중 구매와 부활/복귀; 큰 미사용 bank; 실제 component 효과 | 전장 골드=즉시 전투력 오류 방지. 정확한 위치/시간 model이 없으면 그 한계를 드러내고 arbitrary timing으로 채우지 않는다. actual shop purchase/arrival paired case·same-source save |
| 8.2–8.4/P1·effects/resources | 일회/지속효과 중복; 처치 전후 자원; 목표 획득 후 체력/생존/웨이브; 추격·철수 조건; 부활 뒤 만료된 기회; 총골드 vs 역할 집중; engage-followup 접근; retarget 비용/overkill; CC 만료와 행동 | 인과 정확도/실행 가능한 행동. side/target/time/availability/real stored trace 반례, coefficient redesign은 별도 검토 |
| 7·8.7·12.9/P1·observed map/series | 발견 vs 행동가능; unknown enemy/lastseen 오래됨; 공개 이전 세트에 대한 대응; 결과 설명 반례 | AI hidden access trap, 무근거 causal 문구 제거, original sources와 계산 일치; 미래/타팀private금지 |
| 2·5·6/P1·language writer | 일상 언어 vs 경기 콜; 개인 숙련 vs 다섯명 공통 소통; 구단 업무 언어 변경 영향; 기존 staff 지원; 훈련 콜 활용/시간비용; 같은 언어 이적 때 지식 보존; 임대 복귀의 익숙함; 후보 선수의 practice 적응 | 새로운 세부 축 필요성은 actual model 조사. nationality만으로 penalty/이적 때 언어 reset 금지, actual learning/change/history/opportunity cost/finance/AI/save 반례 |
| 2·3·6/P1·observed growth/medical | 역할 전환 준비도 vs 원래 기량; 건강 복귀 vs sharpness; 좋은 성적 vs 성장; 관측된 소통 문제의 불확실성 | role/context·medical writer·actual practice source를 구분. 낮은 승률을 language cause로 단정하지 않음 |
| 3·4·12.5/P1·initial/report/commands | 첫 시즌 추정 출처; 적합 이유와 위험 함께; 정보 최신성; 관찰로 새로 안 부분; 다른 구단 실제 계약 발생; 주전/후보 영입 역할 맥락; 후보 실패 뒤 계획 복구 | 없는 초기 detailed stats/경쟁 offer를 발명하지 않음. 관측범위·original date·actual candidate transition·filter/return/source 검증 |
| 4·5·10/P1·finance/registration | 협상 중 예산/등록/비로컬 변화; 복수 offer vs 확정 지급 의무; 옵션 행사 시점/주체; 임대 종료 전망; 관찰 확장 비용 | preflight와 commit 동일 authority/실제 최신 조건, 의무/지출 중복 금지, no inventedfee·unlimitedobservation |
| 5·6·10/P1·daily practice/staff | calendar 실제 훈련 부담; 같은 날 중복훈련; 의료/소속 변경 불참; staff 빈 영역 실제 상태; 스태프 업무 인계; 위임 실행 vs 감독 확정; 소유2군 lawful observations; 주전 교체 실제 이유 | daily/time budget·event identity·report owner·permission/parity, no unsupported staffpenalty/무료동시훈련, actual before-after/save/rollback |
| 10·11/P1·calendar/office/series | 연기 전후 비교; prep/scrim/rest/registration 충돌; 연기 전후 준비 중복; 현행 vs future office rules; 실제 승격 자격; result확정→다음round 생성순서; tournament fixedpatch; 국가2부/통합1부 탐색; 개정 후 actual 영향 | actual schedule/broadcast pending 참조·effectivedate·membership state·idempotence·history. nofuture rules applyingtoday/no double reward |
| 3·9·12.6·12.9/P1·observation/history | smallsample 평가확신; 다른role/patch/event/opponent 비교; original영입판단보존; 당시 player/club 이름; 개인 vs 팀 결과; 실제 뉴스 정정출처; 같은 사건기사 통합; 관심뉴스/필수deadline 분리; actual seasondecisions/results recap; qualified retirement-staff history | original/observed/public/private 소유 구분, arbitrary stability coef 없음, hidden enemy/no fabricated corrections, real event→navigation/read/filter/save |
| 11·12.5/P1–P2·common UI/save | 일관 선수식별; 미관측 정렬값; filter 밖 batch selection; 현장 disabled reason; 실행중 duplicatebutton; cancel vs finalconfirmation; slot metadata; last good save 보호; load 후 stale work; 실제 cancelable 범위; noncolor status; keyboard profile-table-return; context help; new engine vs past records; recoverable error feedback | fakecontrols 금지·meaningfulchoice 보존, 기존 저장보호/rollback·world-slot/권한 reset·units/keyboard/좁은화면. whole deviceQA 아닌 focused flow |

### 추가 동시 사건·변경 조건 반례 전체 — 등록·승인, 재현 상태 별도

| 단계 | 구체 trigger | 검증해야 할 불변식 |
| --- | --- | --- |
| 4·10 | 영입/등록 deadline/경기 같은 날 | 계약만으로 등록전 공식출전 불가; office/effective ordering |
| 8.2·8.6 | 귀환 도중 잔액 충분 또는 귀환 취소 | 일반선수 완료전 구매/취소된귀환 회복 불가; actual 상태·Ornn예외 |
| 8.5·8.6 | 부활과 목표 spawn 근접 | alive가 즉시현장참여를 의미하지 않음; actual travel/arrival |
| 8.4 | 처리중 target사망/이탈 | stale target재검증, overkill 이전·비용 없는 retarget 금지 |
| 8.1·8.4 | buffexpiry와 attack 같은 시점 | 일관 ordered source/consumer/설명·no fabricated physical simultaneity |
| 8.2·8.3·8.5 | kill/quest/reward 한 사건 | 각 정당 reward1회, effect/cache 중복 없음·identity |
| 8.2·9 | 레시피 바뀐 tournament | 경기 고정 patch의 cost/from, current/global 혼합 없음 |
| 2·5·6 | 구단 업무 언어 변경 | 학습 원본/기존언어 보존·새 적응 구분; 반복 변경 exploit 조사 |
| 2·4·5 | 임대 원/차입 구단 언어 차이 | 구단별 정책/지출/관측권한 구분·복귀 연속성 |
| 5 | language지원 확정 후 insolvency | 이미 확정 의무와 새가용예산 구분; nofree지원/몰래의무취소 |
| 3·4·5 | 같은 후보 1군/2군 검토 | evaluation owner/contractactor 분리·foreign report완료가 현재승인 아님 |
| 4·11·12.5 | 열린 상세 중 소속변경 | current authority/condition 재검증·stale command 거절 |
| 3·12.5 | 정렬중 보고서갱신 | 선택 ID 보존·newsort 표시·batch 오선택 없음 |
| 3·12.9 | empty/old report혼합 | no-information vs old-information·0ability 동일취급 금지 |
| 8·11 | pendingofficial 저장직전 오류 | 마지막정상저장/확정게임/미확정선택 구분·재시도 no doublegame |
| 10·11 | 연기후 reload | oldwindow/newdate/pendingrefs 동일 실제match 연결 |
| 5·12.7 | 과거 구단 해체/개명 | event-time labels/stableidentity/historynavigation 유지 |

예약 지시문은 사용자 요청대로2만자 이하로 압축하되 전체 승인 범위/단일 가이드/필수 검증·publication/한worker·hourly/최종QA보류를 유지한다. 중복 release prose는 요약하지만 source/failure 기록은 삭제하지 않는다. 문서화는 사용자 직접 요청이며 새로운 hourly 구현 완료로 집계하지 않는다.


### 2026-10-04 의사결정·반복 작업 옵션 전체 승인 보강

사용자의 “ㅇㅇ 추가하고 더 많이 진짜 개 많이 줘봐”는 직전 제시된 아래 전체 목록의 추가 승인을 뜻한다. 기존 numeric stage에 합쳐 추적하고 별도 기능 개수로 중복 집계하지 않는다. 상태는 **승인·등록 / 구현 및 소스별 수용 검증 미완료**다. 이번 기록은 진행 중 initial recruitment explorer 구현과 별개이며 구현 완료 증거가 아니다.

| 단계 | 승인된 기능·보강 전체 | 실제 결정/편의와 제한 |
| --- | --- | --- |
| 3·4·12.5 | 영입 필수/선호 조건 분리; 관측 중심/하한 기준 필터; 후보 제외 이유; 복수 후보 협상 대기열; 실제 조건 변화 관심 알림; 영입 전후 선수단 비교 | 관측 불확실성/등록/예산을 구분; 자동 계약·숨은 능력 공개 없음 |
| 4·12.5 | 재제안 변경점 표시; 계약 만료 업무 묶음; 실제 결원 때만 대체 계획 | 확정은 선수별, 정상 주전 강제 교체/반복 계획 과제 없음 |
| 7·8·12.9 | 준비안 저장/현재 조건 재검사; 적용 전 차이; 전술 실행 제약 설명; 다음 세트 선택 비교; 복기→실제 설정 연결; 변경 당시 근거 보관 | 계산·공식 원본 근거만, 새 계수/과거 이유 재구성/결과 보장 없음 |
| 5·6·12.5 | 훈련 예외 검토; 다중 대상 적용 가능 여부; 실제 스태프 업무량 배분 | 회복/시간/업무 제약 및 감독 권한 보존 |
| 2·5 | 구단 업무 언어 변경 영향 비교; 구단 언어 지원 지출/적응 내역 | 구단 차원 결정·실제 재정 원장, 비용/학습률 근거 확보 전 임의 효과 없음 |
| 5·12.5 | 현금 부족 시점/확정 지급 보기; 중요 업무 진행 묶음 | 확정 의무/예측·미확정 제안 구별 |
| 12.6·12.8 | 사건 단위 알림; 변경된 제한만 재알림; 중요한 결정 전까지 날짜 진행 | 필수 업무와 선택 뉴스 분리, 마감/미처리 결정을 자동 통과하지 않음 |
| 3·11·12.5·12.9 | 화면별 열/정렬/필터 기억; 비교 묶음/과거 원본 보존; 보고서 갱신 필요; 개인 표시 기본값; 행동 취소 범위; 미확정 업무 이어하기 | 슬롯/권한/날짜 원본 구분, 계약/전술 자동 확정 없음 |
| 5·12.4 | 위임 전 권고 시험 검토; 위임 예외 검토 | 시험은 실제 mutation 없음; 범위/승인/회수 및 이미 확정된 결과 보존 |
| 5·12.7 | 새 감독 인수인계 요약 | 실제 확정 의무/미처리 업무와 새 감독의 합법 관측만 |

추가 아이디어는 계속 발굴하되 기존 승인 보강/별도 정책 후보/검증 전 가설을 구별한다. 후보 등록은 구현 또는 정책 승인 완료가 아니다. 각각 trigger, 실제 source/writer/consumer, 관측/권한, 선택 변화·시간 절감, 비용/상충, UI, 반례/수용, 저장/취소/AI 영향을 확인한 뒤 coherent slice로 진행한다. 현재 작업은 최초 영입의 관측 기준 검색·정렬·전체 결과 페이지·상세 연결이며 언어 엔진/레이더/전체 UI/모든 옵션 구현 완료를 주장하지 않는다.

### 2026-10-04 추가 114개 전체 승인 — 기존 단계 보강 inventory

사용자의 “다 넣고 또 더 없어? 아니면 보강점이라던가”로 직전 전체 114개를 승인·등록한다. 아래 번호는 대화 목록 추적용이며 새로운 개발 단계/독립 기능 개수/구현 완료 수가 아니다. 기존 항목과 중복은 합치되 원래 조건과 예시를 보존한다. 구현·배포는 미완료이며 source/action/UI/save acceptance로 확인한다.

| 대화 목록 | 기존 단계 | 승인 내용 전체 |
| --- | --- | --- |
| 1–15 | 3·4·12.5 | 현재 주전 대비 검색; 부족 특성 보완 검색; 즉시 전력/장기 육성 분리; 실제 출전 경로 비교; 영입 포기 이유 메모; 제외 후보 재검토; 비교 조건 고정; 정보 부족 부분 추가 조사; 조사 중복 안내; 후보 없음의 대안; 조건별 분포; 목록에서 비교 추가; 후보 검토 시점; 후보 변동 요약; 검색 조건 복사 |
| 16–25 | 4·5·12.5 | 계약 조건 교환 관계; 미확정 제안/확정 지출 분리; 동시 영입 충돌; 대체 영입/기존 선수 처리 순서; 협상 종료 이유; 마지막 제안 불러오기; 임대 복귀 자리 확인; 임대 관측/출전 기록 분리; 계약 종료 후 의무; 일괄 검토/개별 확정 |
| 26–35 | 2·3·6·12.5 | 현재/기대 역할 비교; 역할 전환 기록; 챔피언 폭/실전 사용 가능성; 성장 정체 근거; 육성 중간 점검; 출전 맥락 경쟁 비교; 2군 승격 준비; 회복 후 기존 계획 복귀; 장기 미출전 검토; 개인 성장/팀 적응 분리 |
| 36–43 | 2·5·6 | 업무 언어별 인원; 언어 변경 영향 대상; 영입 언어 적응 상태; 지원/경기 실행 문제 분리; 지원 지출 중복 확인; 임대/이적 적응 연속성; 반복 정책 변경 부담 조사; 적응 상태 변화 요약 |
| 44–53 | 5·6·12.4 | 일정 변경 훈련 충돌; 계획 복사 재검사; 훈련 계획/실제 참여; 스태프 공석 실제 영향; 담당자 변경 인계; 권고 근거/한계; 위임 중지 업무 회수; 위임 규칙 충돌; 결과 기반 위임 범위 조정; 단순 반복 업무 선택 위임 |
| 54–63 | 7·8·12.9 | 준비 정보 기준 시점; 밴 기회비용; 플렉스 가능/확정 역할; 픽으로 제한되는 우리 선택; 선수 교체 준비 영향; 세트 사이 유지할 부분; 시리즈 선택 이력; 상대 분석 새 정보; 준비 완료/충분 구분; 드래프트 판단/실행 결과 |
| 64–74 | 8·12.9 | 전환점 전후 실제 상태; 우세 상실/열세 극복; 킬 이후 실제 전환; 단일 경기/반복 경향; 유사 상황 비교; 분석 제외 이유; 분석 조건 변경 전후; 레이더 축/원본 수치; 비교 불가 축; 메모/실제 기록; 결론 근거 이동 |
| 75–82 | 10·12.5 | 일정 변경 영향; 현재/다음 시즌 규정; 등록 불가 해결 경로; 공식 문의 답변 이력; 1군/2군 일정 충돌; 대회별 준비 업무; 연기 원래 일정; 규정 개정 실제 영향 |
| 83–89 | 5·12.5 | 확정/조건부/예상 금액; 지출 실제 원인; 계획별 재정 비교; 반복 지출 변경점; 시설 작업 기간 영향; 구단 목표/결정 충돌; 예산/계약 여유 |
| 90–98 | 3·5·12.6·12.7·12.8 | 이전/현재 감독 결정; 이적 선수 이후 공개 기록; 원래 보고서/이후 관측; 뉴스 후속 실제 사건; 정정 이력; 회고 관심 분야; 대표 선수 역사 근거; 옛 동료/코치 실제 재회; 은퇴 후 실제 경력 |
| 99–114 | 11·12.3·12.5 | 최근 본 목록; 뒤로가기 문맥; 관련 화면 비교; 미완료 입력 보존; 위험한 이탈만 확인; 빈 화면 다음 행동; 키보드 상세 이동; 표 밀도; 열 고정; 단위 일관성; 저장 진행 위치; 불러오기 전 호환성; 정상 저장 복구; 선택적 진단 내보내기; 업데이트 기존 저장 영향; 실제 행동 바로가기 |

공통 경계: 현재 관측만 합법적으로 사용; 보고서 원본/과거 사건 보존; source 없는 축/효과/원인/가격/규정 생성 금지; 일괄 검토가 자동 계약/등록/전술 확정을 뜻하지 않음; 위임은 직접 운영 기본과 범위/회수 보존; 기존 계약 조항·출전 약속 등 지원되지 않는 정책은 명시적 설계와 근거 필요; 구단 업무 언어/지원 지출은 이미 승인된 구단 차원 결정; 모든 초기 영입 UI/엔진 미완료 범위를 유지한다.

### 2026-10-04 추가 70개 연결·안정성 보강 전체 승인

사용자의 “다 추가하고 또 더 없어?”로 직전 70개 전체를 승인·등록한다. 기존 단계 및 위 114개와 겹치는 보강은 하나로 합치며 기능 개수/완료율을 늘리지 않는다. 현재 상태는 승인·등록, 구현·재현·검증은 각 실제 소스별 확인 전 미완료다. 대화 번호는 추적용이다.

| 대화 목록 | 단계 | 전체 승인 보강 |
| --- | --- | --- |
| 1–10 | 3·4·12.5 | 추천 제외 이유; 후보별 관측 확신도; 순위 변경 이유; 조건 단계별 완화; 공통 관측 항목 비교; 비교 제외 메모 보존; 보고서/감독 선호 분리; 다른 역할 검토 이유; 실제 개선 자리; 미영입 선택 비교 |
| 11–20 | 4·5·12.5 | 동시 제안 수락 부담; 협상 중 변경 재검사; 계약/육성 기간 충돌; 지급일 기준 비교; 보류 지출 재검토 조건; 확정 의무 예산; 이탈/대체 영입 묶음; 갱신 차이; 구단 자동 지출 근거; 예상 수입 수정 영향 |
| 21–30 | 2·5·6 | 임시/장기 계획; 복귀 감독 검토; 관측 문제/훈련 연결; 훈련 기회비용; 휴식 원인; 교체 적응 영향; 언어 정책/학습 이력; 언어 문제 관측 근거; 언어/팀워크/전술 중복 불이익; 지원/효과 확인 분리 |
| 31–48 | 7·8·9 | 판단/실행 가능성; 행동 조건 재검사; 소비 자원 보존; 귀환 취소 구매/회복; 실제 구매 전투력; 부활/현장 복귀; 실제 참여 인원; 교전 후 행동 비용; 오브젝트 포기 자원; 실제 버프 소비; 웨이브/구조물 조건; 유효 피해; 유효 회복/보호막; 효과 대상/중첩; 종료 후 효과 중단; 계산/설명 일치; 경기 고정 패치; 합법 AI 정보 |
| 49–58 | 5·12.4·12.6 | 위임 미실행 이유; 권고/실행 비교; 권한 변경 대기 작업; 감독/스태프 중복; 알림 행동 이동; 재알림 조건; 해결 업무 정리; 하루 진행 차단 묶음; 선택 뉴스 진행 비차단; 실제 업무 선행 조건 |
| 59–70 | 11·12.3·12.5·12.9 | 일괄 작업 부분 성공; 실패 대상만 재시도; ID 선택 유지; 필터 밖 선택 안내; 오래 열린 화면 변경; 저장 실패 진행 보존; 저장 보존 범위; 이직 비공개 권한; 과거/현재 이름; 보관/삭제 구분; 선택 상세 접기; 단축키 일관성 |

실제 source/action/UI/save 연결과 권한·rollback·부분 성공·중복 재시도 반례를 검증한다. 제안된 위험은 재현 결함과 구분한다. 계약 조항/소비 비용/학습률/물리 동시 판정 등 지원되지 않은 정책·계수는 이 승인만으로 임의 생성하지 않는다. 엔진 최우선과 현재 initial recruitment explorer의 미완료 상태 및 8.2.2 own-base purchase continuation을 유지한다. 이번 문서 기록은 hourly 구현 slice 완료 또는 배포 증거가 아니다.


### 2026-10-04 기능 간 연결 보강과 추가 게임성 전체 승인

사용자의 “다 추가해”로 직전 제시한 연결 보강 34개와 별도 설계가 필요한 게임성 4개를 모두 승인된 과제로 등록한다. 기존 numeric stage의 원래 승인·완료 조건과 합치며 별도 기능 수나 완료율을 부풀리지 않는다. 상태는 **승인·등록 / 소스 감사·설계·구현·수용 검증 미완료**다. 후보/제안 전용 상태로 계속 보류하지 않고, 실제 구현 중 정의와 근거를 확보해 진행한다. 현재 코드에서 이미 지원하는 동작은 재사용하고 중복 구현하지 않는다.

| 기존 단계 | 승인된 전체 보강 | 선택 변화·제약·수용 방향 |
| --- | --- | --- |
| 3·4·5·12.5 | 결정 보류 이유; 배타적인 대안 계획; 결정 전 확인 가능한/없는 정보; 판단 재검토 조건; 폐기 계획 이유; 변경과 무관한 항목 유지; 확정 전 관련 부분 수정 후 검토 이어가기 | 미확정 계획/확정 의무 구분. 대안 A/B를 동시 확정 계획으로 계산하지 않음. 보류 조건은 실제 변화로 재검사하며 자동 계약/지출 없음. 계획 변경·취소·중복 확정·저장 후 문맥 수용 확인 |
| 3·12.9 | 동일 원본 보고서 표시; 보고서 의견 차이; 추천 기준 변경 순위 비교; 부족한 추가 관측 안내; 결론 유보 상태; 공개 원본 수정 영향; 추천 사용 기준 공개 | 같은 경기의 두 보고서를 독립 표본 두 개로 세지 않음. 관측 범위/기간/역할과 보고서 원본 보존. 자료 부족을 낮은 능력으로 표시하지 않음. 숨은 능력/외부 비공개 원본/확실한 미래 예측 사용 금지. 정정 이후 현재 분석과 원래 보고서 구분 |
| 2·5·6·12.5 | 선수 계획 변경 이력; 2군 이동 목적/실제 활동; 복수 육성 목표 충돌; 적응 지원 미완료 이유; 선수·스태프 구성 변화에 따른 구단 언어 재검토; 일상 언어와 경기 용어 적응 구분 검토 | 실제 시간·참여·언어 관측·지원 원장 사용. 구단 언어/재정 결정의 기존 승인 유지. 변경 횟수만으로 임의 벌점 금지. 경기 용어를 별도 효과로 만들기 전 source/input/unit/learning writer/consumer/cost와 팀워크 중복을 정의 |
| 7·8·12.9 | 준비 예상/실제 상황; 전술 미실행/실행 실패; 성공 행동 반복 가능 조건; 유지 결정 당시 정보; 복기/실제 설정 변경 연결; 판정 근거 부족 표시 | 실제 event-time 정보와 실행 조건/소비 근거만. 예상 불일치가 자동 실패는 아님. 성공 보장/복기 읽기 보너스 없음. 오래된 미저장 원인을 현재 상태로 재구성하지 않음. 기존 엔진·명령·로그 연결/seed parity와 의도된 변화 구분 |
| 11·12.3·12.5·12.9 | 작업 중 변경 시 입력/대상 분리 보존; 긴 작업 진행/취소 범위; 개별 작업 오류/세계 상태 분리; 오프라인 외부 연결 실패; 설정 적용 범위; 화면 문맥만 초기화; export 기준 시점 고정; 갱신 목록 선택 위치 안내 | 취소 가능하지 않은 작업에 가짜 취소 버튼 없음. 실패한 보고서가 무관한 진행을 차단하지 않음. network 차단과 게임 실행 불가 구별. 저장 슬롯/구단 권한/비공개 자료 경계 유지. 문맥 초기화는 세계/계약/역사 삭제가 아님. export 중 시점 혼합 방지 |

아래 네 가지도 **승인된 설계·구현 과제**이며 단순 제안 목록으로 남겨두지 않는다. 다만 구체적인 규칙·효과·가격·계수는 이 승인만으로 임의 생성하지 않는다. 기존 결정/엔진/관측/고용/목표와 겹치는 부분을 먼저 확인하고, 정의가 필요한 부분은 근거·상충·반례를 문서화하며 중요한 새 세부 정책은 명확히 제시한다.

| 기존 단계 | 승인된 게임성 보강 | 필수 설계·수용 경계 |
| --- | --- | --- |
| 2·4·12.7 | 선수 선호 역할·커리어 방향과 협상 연결 | 기존 career goals/역할/협상 재사용. 선호와 실제 계약 약속 구분. 지원되는 약속/위반 판정·관측·고용 연속성을 정의하고 성공 강제·숨은 미래 의사 노출 금지 |
| 5·6 | 스태프 전문 분야와 업무 배치 연결 | 실제 스태프 능력/고용/담당 writer·업무 consumer 검사. 직책 이름만으로 임의 보너스 생성 금지. 업무 시간/비용/대체 담당/AI parity/해고·인계·save 수용 |
| 5·12.7 | 선택적 구단 장기 운영 방향 | 기존 구단 목표/육성·성과·재정 선택 재사용. 새 mandatory story/임의 벌점/자동 의사결정 없음. 목표 상충·변경·평가 기간과 실제 관측 결과 연결 |
| 7·8 | 상대의 반복 공개 대응에 따른 준비 변화 | 기존 실제 series adaptation/공개 match history 재사용. observer-first 공개 근거와 당시 patch/role/sample 보존. 상대 private tactics/hidden true ability/future actions 금지. 실제 준비 소비·수동 감독 기본·AI/player parity 검증 |

문서 추가 자체는 기능 구현·hourly slice·CI·merge·publication 완료 증거가 아니다. 진행 중 최초 영입 explorer 및 엔진 최우선 8.2.2 own-base purchase continuation, 전체 승인 backlog, 한 implementation worker, exact-head sequential CI/merge/main standalone/publication, final QA 보류를 유지한다.

### 2026-10-04 경기 운영·장기 연속성 추가 36개 전체 승인

사용자의 “다 추가하고 더 없어?”로 직전 전체 목록을 승인·등록한다. 기존 단계/승인 inventory에 합치며 독립 feature count나 구현 완료로 집계하지 않는다. 상태: 승인·등록, 소스 감사/설계/구현/수용 미완료. 아래 번호는 대화 추적용이다.

| 목록 | 기존 단계 | 전체 승인 항목 |
| --- | --- | --- |
| 1–12 | 7·8 | 귀환 기회를 만드는 플레이; 팀 동시 귀환/잔류; 구매 대기 비용; 라인전 이후 웨이브 수령자 변경; 사망 중 자원 손실/복귀 회수 구분; 목표 포기/손실 제한; 공격 중단 조건; 시야 정보 유효 기간; 목표 확보 후 이탈; 수비 성공 실제 기록; 분할 압박/본대 부담; 목표 사전 준비/막판 도착 구분 |
| 13–20 | 3·4·5·7·12.9 | 기존 전술 허용 범위; 전술 예외 사전 검토; 공개 선택 이력; 정보 부족 감수/조사 선택; 외부 영입/내부 육성 비교; 임시/장기 해결; 구단 정책 예외 요청; 장기 계획 종료 조건 |
| 21–28 | 5·10·11·12.7·12.9 | 시즌 경계 업무 연속성; 새 시즌 변경 항목만 재확인; 실행 불가 계획 이유; 역사 요약/원본 연결; 저장된 기준 시점 비교; 이직 자료 소유권; 설정간 자원 충돌; 은퇴/해체 역사 연결 |
| 29–36 | 11·12.3·12.5 | 최근 변경 설정; 동명 검색 결과 종류; 비교 대상 교체 조건 유지; 갱신 중 읽던 위치; 일괄 실행 전 대상/실제 비용; 실행 결과 다음 업무; 선택 알림 숨김/필수 업무 구분; 현재 차단 조건 도움말 |

수용 경계: 기존 이동/귀환/웨이브/시야/목표/자원 상태를 실제 소비 경로에 연결하고 물리적 geometry/정확한 spell simulation을 주장하지 않는다. 상대 위치는 observer-lastseen/source 기반이며 미래/비공개 상태를 쓰지 않는다. 강제 역전율/새 handicap/미검토 timing·price·effect coefficient 없음. 전술 범위는 실제 지원되는 설정만; 정보 수집 선택은 실제 시간/비용 모델이 있어야 한다. 구단 정책 예외 요청은 기존 구단 권한의 설계·구현 과제로 승인되었으며 league-office 등록/자격/mandatory tier2/방송 고정 제약 우회가 아니다. 자료 반출/이직은 public/personal/club-private 소유권을 정의하고 현재 actor 권한을 먼저 검사한다. 저장된 기준 시점이 없는 과거 값을 재구성하지 않는다. 취소는 실제 reversible action만, history/raw sources/diagnostics 보존. 현재 최초 영입 explorer 구현 및 다음 엔진 8.2.2 own-base purchase 연결 상태 유지. 문서 수정은 CI/merge/publication 또는 hourly slice 완료 증거가 아니다.

### 2026-10-04 경기 경계·준비·평가 추가 36개 전체 승인

사용자의 “다 추가하고 … 전수조사해서”로 직전 36개 전체를 승인·등록한다. 기존 승인 과제에 합치며 source 없는 효과/정책/coefficients를 임의 생성하지 않는다. 모두 등록 단계이고 실제 구현 및 수용 상태는 개별 확인한다.

| 대화 범위 | 단계 | 전체 승인 |
| --- | --- | --- |
| 1–12 | 8 | 최대 체력 변화의 현재 체력; 임시 효과 종료 복원; 공격 속도/실제 공격 시간; 보호막 피해 종류; 제어 중 가능한 행동; 자원 부족 대체 행동; 사망 효과 유지/소멸; 재적용 효과 갱신; 구조물 효과 대상; 몬스터 피해 제한; 처치 보상 원인; 이벤트/최종 합계 |
| 13–18 | 7·9·10 | 대회 챔피언 사용 가능; 패치 준비안 영향; 시리즈 규칙 고정; 참가 확정 전후 준비; 상대 대회 맥락; 규칙 변경 저장 설정 |
| 19–24 | 2·3·5·12.9 | 관측 성향/감독 지시; 평가 환경 변화; 교체 후보 준비; 스태프 권고 이후 결과; 평가 수정 근거; 특정 선수 의존 |
| 25–30 | 5·6·7 | 연습 상대 선택; 연습 검증 목적; 준비 자료 업무 우선순위; 내부 보고서 공유 범위; 공개 발표/내부 확정; 시즌 목표 중간 검토 |
| 31–36 | 11·12 | 판단 근거 강조; 동일 사실 표현; 읽지 않음/수정 구분; 자료 요청 결과 한계; 닫은 화면 업무 추적; 무관 갱신 입력 보존 |

<a id="whole-domain-audit-2026-10-04"></a>

### 2026-10-04 전 영역 조사 — 소스 inventory·보강·한계

**조사 성격:** 사용자 직접 요청의 bounded source investigation이다. 모든 알려진 도메인을 coverage matrix로 대조했지만 모든 함수의 모든 실행 경로/시간조합/긴 커리어/기기를 전수 실행한 것은 아니다. “한 개도 누락 없음” 또는 전 게임 버그 없음/전체 구현 완료를 주장하지 않는다. 등록된 114/70/34+4/36/36 및 기존 38-engine/13-narrative 승인과 중복을 합친다.

**현재 기준:** Git main `a529566d838f50f1b6215ffa07bba9c9b9f61b30` 확인. 열린 PR #173 docs `9e2b0850d7ddb93ddd930576dbbc78cafc71338a`와 오래된 #27/#28 확인; 중복 merge/branch edits 하지 않음. 로컬 `feat/initial-recruitment-explorer`에는 UI 변경과 승인 문서가 아직 미커밋이다. 이것을 main/게시된 게임 상태로 제시하지 않는다.

**이 coverage matrix는 a529 당시의 역사 snapshot이다.** 초기 메뉴/언어 문구와 관측 목록의 최신 교체는12.3.1/12.5.1–3 evidence를 따르며 원래 조사 상태·승인 inventory는 보존한다.

**coverage:** manifest engine97/UI37=134 modules + shell=135 files; structural inventory 14,118lines/1,275named functions, 변경 중 workingtree 기준. 모든 파일의 기능 목록/marker/hash 대조와 주요 도메인 소스 selected deep read를 구분한다. 활성 문서의 상대 파일 링크93개 대상 존재 확인(anchors와 runtime nav 전체 검증 아님). 생성된 embedded sources는 provenance/consumer 중심, 모든 raw champion spell/mechanics 개별 검증 아님. 독립 source fixture3건만 실행; full CI/browser/100season/device/TalkBack 미실행.

**중복 정정:** 실제 scrimPartnerAssessment/scrimPlanCheck가 상대 선택·수락·예약을 지원하고 staffRoleAbility는 specialty allocation을 실제 소비한다. playerCareerGoal/effectiveRolePromiseStatus도 존재한다. 이들을 새 시스템 부재로 제안하지 않고 UI/근거/연속성/판정 보강으로 합친다. 172 ledger와 171 ending 수정은 보호하며 location gating나 complete mechanics 완료로 확대하지 않는다.

| 단계 | 영역 | 실제 원본/entry | 전체 보강·완료 inventory | 현재 확인/한계 | 우선 | 집중 수용 |
| --- | --- | --- | --- | --- | --- | --- |
| 1·12.3 | 시작·세계 생성 | [world.js:buildWorld](../src/artifact/world.js); [ui-setup.js:seasonSetup](../src/artifact/ui-setup.js); [career.js:beginInitialRosterPhase](../src/artifact/career.js) | 새로시작/불러오기/설정만 시작에 표시; 실제 팀 선택은 다음 흐름; 6지역 필수 2부·합법 FA·예산·zero/default subs·legacy identity 유지 | 긴 startup 설명/운영 메뉴 남음; 국제 설명 undefined 재현 | P1 | 실제 시작→팀 선택→초기 영입→save; 생성 규칙 회귀와 초기화 취소 |
| 5·12.7 | 감독 커리어·인계 | [world.js:setManagedTeam](../src/artifact/world.js); [ui-season.js:bindSeason](../src/artifact/ui-season.js); [app.js:viewSeason](../src/artifact/app.js) | 직업/취임/계약/해임/인계/타구단 continuidad; 이전 의무/내 결정 구분; former private 권한 | 팀 선택·해임 후 재선택은 있음, 완전 career/job lifecycle 근거 미완료 | P1 | 이직 전후 선수·계약·역사/비공개 접근·pending 업무/save |
| 2·10 | 선수 정체성·로컬·국가 | [roster.js:playerOriginRegion](../src/artifact/roster.js); [roster.js:playerActiveLocalRegion](../src/artifact/roster.js); [local-service.js:processLocalServiceDaily](../src/artifact/local-service.js) | 국적/출신/활동지역/로컬/업무 언어 별개; country home/development/location office admission | 기존 local-service 있음; origin을 현재 활동/언어로 추정 금지 | P1 | 이적/임대/2군 외국 거점·국적/로컬 보존 및 등록 |
| 2·3·12.5 | 선수 능력·성장·역할 | [player.js:playerCoreMetrics](../src/artifact/player.js); [development.js:growPlayer](../src/artifact/development.js); [role-conversion.js:advanceRoleConversionPlayer](../src/artifact/role-conversion.js) | 관측 능력/잠재/성장·환경/성향 구분; role 전환 시간·비용; 낮음 vs 모름; observed radar/numeric/source/context | 내부 core metrics true branch 존재, observed-only extension audit 필수 | P1 | own/foreign/FA/fired 관측·실제 훈련/출전/성장·save |
| 3·12.9 | 스카우팅·보고서 | [scouting.js:observePlayer](../src/artifact/scouting.js); [scouting-ai-ops.js:performAiScoutingOperation](../src/artifact/scouting-ai-ops.js); [scouting-champions.js:recordChampionScoutObservation](../src/artifact/scouting-champions.js) | 지역 조사/담당/비용/기회;원본/갱신/확신/동일 원본 중복/의견 차이/제외 sample/source/bias | 기존 private observations/AI regional operations 있음; 과거 recruitment 원본 장기 archive 미완료 | P1 | 실제 조사→관측→평가→비교·owner별 save/이직; no hidden ability |
| 3·4·12.5 | 초기 영입·일반 시장 | 미커밋 별도 작업 `ui-initial-candidates.js:initialCandidatePage`; [ui-market-initial.js:bindInitialRosterMarket](../src/artifact/ui-market-initial.js); [transfer.js:recruitmentBoard](../src/artifact/transfer.js) | origin regional/overseas/all; 조건 mandatory/preferred; center/lower bound; full count/page/sort/column/selection; actual detail/evaluation/negotiation/return | 현재 explorer 작업 중, 아직 acceptance/PR/release 없음 | P1 | FA 실제 detail/관측/최소 필터/80cap 제거/10선택·stale·save/authority |
| 4 | 계약·약속·협상 | [contract-negotiation.js:finalizeNegotiation](../src/artifact/contract-negotiation.js); [player-representation.js:effectiveRolePromiseStatus](../src/artifact/player-representation.js); [contract-window.js:recordContractAgreement](../src/artifact/contract-window.js) | 대표/동의/기간/옵션/역할 약속/갱신/해지; 재제안 diff·동시 대안/실패/재개/일괄 검토 개별 확정 | 기존 negotiation/role promises 있음; 새 동일 시스템 중복 금지 | P1 | 소속/예산/권한 바뀐 열린 제안; 확정1회·거절/취소 rollback |
| 4·11 | 이적료·지급·해체 | [transfer-payments.js:processTransferPayments](../src/artifact/transfer-payments.js); [club-closure.js:applyClubClosure](../src/artifact/club-closure.js); [finance-estate.js:processClubEstateRecoveries](../src/artifact/finance-estate.js) | actual commitments/invoices/부분 지급/보장/잔여 claims; 미확정 제안/예상/확정 분리; arbitrary asset fee 금지 | 기존 결제/estate recoveries partial; 전체 liquidation/creditor policy 근거 미완료 | P1 | 송금 동일 원장·stale/rollback·양측 지급일·future obligation save |
| 4·5 | 임대·복귀·전환 | [player-loans.js:applyLoanStart](../src/artifact/player-loans.js); [player-loans.js:processLoanDaily](../src/artifact/player-loans.js); [loan-purchase.js:validateLoanPurchase](../src/artifact/loan-purchase.js) | 원소속/차입/급여/등록/교육/만료/회수/전환; 복귀 자리/언어 연속성/보고서 owner | 기존 shared lifecycle 있음; force lineup overwrite는 가설 유지 | P1 | return day/등록/계약 겹침·parent/reserve 권한·수동 lineup |
| 5·10 | 선수단·출전·등록 | [roster.js:applyRosterPlan](../src/artifact/roster.js); [registration.js:writeOfficialRegistration](../src/artifact/registration.js); [registration-match.js:officialMatchView](../src/artifact/registration-match.js) | 고정 주전·경쟁/후보·실제 결원 때만대체; current vs projected salary/eligibility; official roster/entry/긴급 대체 | 기존 실제 command 있음; 항상 계획작성/강제 rotation 불필요 | P1 | 선발→조건→actual match/기용→save; invalid/duplicate/undo |
| 2·6 | 의료·피로·회복 | [medical.js:medicalDailyTick](../src/artifact/medical.js); [player-relations.js:playerMod](../src/artifact/player-relations.js); [development.js:dailyRecovery](../src/artifact/development.js) | 피로/부상/상태/잔여/휴식/재활·경기감각 별 원인; 과훈련/일정·복귀/의료 대체 | 기존 daily 의료/4seed test 있음; language/teamwork 중복 효과 검토 | P1 | daily once·official/scrim/rest/exposure→actual performance·tradeoffs |
| 2·5·6 | 업무 언어·적응·지원 지출 | [player-relations.js:lineupCohesion](../src/artifact/player-relations.js); [practice-resources.js:runDailyPractice](../src/artifact/practice-resources.js); [ui-setup.js:managerTeamPicker](../src/artifact/ui-setup.js) | club decides working language/support spend; 실제 proficiency/learning/cost/uncertainty; regional first list는 언어 대체 아님 | 복원 승인 미구현; ui-setup no-language-barrier 문구 아직 남음 | P1 | 영입/profile/training→학습/회계→actual execution; legacy/AI·no nationality-only |
| 2·5 | 관계·리더십·만족·목표 | [player-relations.js:applySatisfaction](../src/artifact/player-relations.js); [player.js:playerCareerGoal](../src/artifact/player.js); [player-representation.js:applyOralRolePromise](../src/artifact/player-representation.js) | actual playing/관계/기대/커리어/지원된 약속; 역할/이탈/복귀; 근거없는 leadership aura 금지 | 기존 goal/usage/relationship 있음; hidden public露출 범위 검사 | P2 | 실제 약속/기용 변화→원인/이적·재협상; 원본 event/history |
| 5·6 | 스태프·전문성·고용 | [staff.js:staffRoleAbility](../src/artifact/staff.js); [staff-contracts.js:applyStaffAction](../src/artifact/staff-contracts.js); [staff-registration.js:competitionStaffMatchRoster](../src/artifact/staff-registration.js) | 전문 영역/secondary allocation·observed hiring/부서 공석/업무 인계/대표 고용/현장 service/은퇴 | 전문성 기존 실제 consumer 있음; 새 직책 보너스 중복 금지 | P2 | 실제 채용→배치→업무/등록→지출/save; vacancy·expired/fired |
| 5·11 | 시설·구단·소유권 | [development.js:upgradeFacility](../src/artifact/development.js); [development.js:advanceFacilityConstruction](../src/artifact/development.js); [club-ownership.js:transferClubOwnership](../src/artifact/club-ownership.js) | construction day/cash/upkeep/actual effect; 소유권 바뀌어도 club id/license/contracts/history 보존 | 기존 timed시설·takeover continuity 있음; 예외/장기 goal 설계 보강 | P2 | 공사 전후 training/recovery/scouting; 인수·해체·예산 continuity |
| 6 | 훈련·육성·연습 자원 | [practice-resources.js:runDailyPractice](../src/artifact/practice-resources.js); [development.js:setTrainingAllocation](../src/artifact/development.js); [role-conversion.js:roleConversionGrowthMultiplier](../src/artifact/role-conversion.js) | 목표/실참여/복수 목표 기회비용/공식일·휴식·개인전환/shared budget; exception 검토/copy | 기존 daily shared budget·manual owned coaching 있음 | P1 | 동일 day중복/reentry/비참여·실제 개인 효과/source |
| 6 | 스크림·파트너·목적 | [scrim-partner.js:scrimPartnerAssessment](../src/artifact/scrim-partner.js); [scrim-plans.js:scrimPlanCheck](../src/artifact/scrim-plans.js); [scrim.js:recordScrimPractice](../src/artifact/scrim.js) | 상호 목적/수락/예약/현지 시간/회복/공식대진·중복/취소;검증목적 vs승리·private evidence | 실제 상대 선택/수락/예약 이미 있음; 기능 없는 것으로 재제안하지 않음 | P2 | request→bilateral booking→execution→resources/report/save; no public calibration |
| 7 | 밴픽·First Selection | [draft.js:draftApplyChoice](../src/artifact/draft.js); [first-selection.js:firstSelectionEvidence](../src/artifact/first-selection.js); [draft-preparation.js:draftPreparationReport](../src/artifact/draft-preparation.js) | public/private tiers·own mastery·legal/flex/role/scarcity/ban opportunity/Fearless·actual confirmation source | 12.9.3/4 실제 live/context/snapshot 있음; 전체 mechanics calibration는 별도 | P1 | 20turn/forced actual official/취소/duplicate/foreign traps·no RNG changes |
| 7·8 | 전술·시리즈·준비 | [meta-tactics.js:matchTacticSnapshot](../src/artifact/meta-tactics.js); [series.js:playSeriesSessionGame](../src/artifact/series.js); [season.js:resolvePendingOfficialMatch](../src/artifact/season.js) | intent/feasible execution/failure·public adaptation·변경/유지 원본·조건차이·pending/patch pinned | 기존 tactic·series 소비 있음; 새 complete execution/사건 설명 추가 필요 | P1 | actual selection→series writer→review/save·same patch/context; no future info |
| 8.1 | 종료·시계·동시 사건 | [match-adjudication.js:destroyMatchNexus](../src/artifact/match-adjudication.js); [engine.js:simulateMatch](../src/artifact/engine.js) | first nexus·postend frozen·quiet/logged clock; ordered simultaneous/reward/end-state 분리 | 8.1.1 수정/출시 보호; 물리 동시 nexus 정책 미구현 | P0 | 양side/quiet/full same stats·unresolved guard; no gold winner |
| 8.2·8.3·8.4 | 골드·구매·아이템·룬 | [item-purchases.js:commitItemCraftBatch](../src/artifact/item-purchases.js); [engine.js:addGold](../src/artifact/engine.js); [engine.js:combatStats0](../src/artifact/engine.js); [systems.js:systemEffects](../src/artifact/systems.js) | earned/spent/held ledger; own base recall/Ornn; recipes/slots/unique/exclusive/repeated/components/quest/sale supported; actual power/conditional/team utility | 172 ledger 수정 출시; 실제 own-base gating와 generic earned-gold power 소비는 남음 | P0 | 27 killPlayer purchase baseline→recall/location writer; sources·paired timing/AI/save |
| 8.5 | 웨이브·캠프·XP | [engine.js:incomeTick](../src/artifact/engine.js); [engine.js:jungleTick](../src/artifact/engine.js); [system-data.js:buildSystemBaseline](../src/artifact/system-data.js) | finite supply/spawn/arrival/shared nearby XP not CS;camp hp/resists/clear/respawn/reward/availability; allocation/death/roam | cs*58+role constants/current farm cadence proxy; complete waves/camps 미구현 | P1 | reviewed patch metadata→resource/level/purchase/macro; MID27min no display fudge |
| 8.4 | 교전·피해·접근·효과 | [engine.js:fight](../src/artifact/engine.js); [engine.js:combatStats0](../src/artifact/engine.js); [engine.js:fightSkillPhase](../src/artifact/engine.js) | damage/defense/reduction/penetration·reach/target/time/availability/resource/CC/heal/shield/effective/overkill/status expiry/retarget | aggregate bounded existing; lowHP clamp/source 후보 포함 많은 mechanics 미검증 | P1 | source-based paired cases·both sides/status order/end·conditional item consumers |
| 8.6 | 시야·이동·목표·구조물 | [engine.js:visionTick](../src/artifact/engine.js); [engine.js:teamCall](../src/artifact/engine.js); [engine.js:convert](../src/artifact/engine.js); [engine.js:takeStructure](../src/artifact/engine.js) | lastseen/observer AI·recall/respawn/travel·postfight resources·persistent waves/towers/dive/objective cost/trade/buff/abandon | 현재 alive/global proxy·hardcoded rewards·convert baron alternate writer; reviewed causal expansion 필요 | P1 | ahead loss/behind win source scenarios no predetermined rate·actual rewards once |
| 9 | 패치·메타·진단 | [patch.js:applyNote](../src/artifact/patch.js); [patch-balance.js:patchChampionEvidence](../src/artifact/patch-balance.js); [patch-content.js:generateNewItem](../src/artifact/patch-content.js) | champ base/skill/item price/recipe/effect/rune/objective/wave/camp→draft/combat/macro; adaptation/sample concentration/holdout/rollback/oscillation | 기존 diagnosis/patch consumers 있음; event-time team strength vs current lookup 가설 조사 | P1 | pinned baseline+old note replay; actual causal pair/output/save; no invented coefficient |
| 8.7·9 | 외부 프로 자료·정적 출처 | [champion-source.js](../src/artifact/champion-source.js); [system-source.js](../src/artifact/system-source.js); [docs/CHAMPION_DATA.md](../docs/CHAMPION_DATA.md); [docs/SYSTEM_DATA.md](../docs/SYSTEM_DATA.md) | pro-only event/date/patch/tier/side/role/gameID/duplicates/missing/units/license/raw/chronological holdout; static mechanics 별도 | validated professional calibration 미수집; network/source blockers 정확히 기록 | P1 | source validation 먼저; fictional result와 actual external data 혼합 금지 |
| 10.1·10.2 | 지역·국가·2부·승강 | [world.js:addRegion](../src/artifact/world.js); [offseason.js:promotionRelegation](../src/artifact/offseason.js); [region-continuity.js:recordRegionSuccession](../src/artifact/region-continuity.js) | Lalias6pairs/NA-SA/CA-Caribbean; country tier2/home/development/office admission; no parent-owned reserve promotion | 6major tier2/name 구현; country/membership/office continuation 미완료 | P1 | next-season actual schedules/standings/membership·legacy ID/nationality/contracts |
| 10.4 | 국내·국제 사무국·규정 | [office.js:officeDecisions](../src/artifact/office.js); [office-consultation.js:officeFormatConsultation](../src/artifact/office-consultation.js); [office-international.js:globalOffice](../src/artifact/office-international.js) | jurisdiction/metrics/consult/cooldown/version/announced/effective/atomic changes/consumer/post reform sample evaluation | 기존 lifecycle 일부 있음; full country/broadcast/registration scope completion 아님 | P1 | announced vs effective·idempotent replay/rollback·no retroactive results/contracts |
| 10 | 달력·중계·대회 | [timezone-calendar.js:pushVenueRound](../src/artifact/timezone-calendar.js); [broadcast-calendar.js:broadcastSlotTime](../src/artifact/broadcast-calendar.js); [season.js:playWorldDay](../src/artifact/season.js) | UTC/venue/KST/daily tick/pending/deadline·global international/sameleague nonoverlap; actual reserved end/overrun shift | staggered starts ≠ full reservedwindows/overrun; actual connected continuation 필요 | P1 | same day/UTC rollover/overrun→next refs/training/registration/save |
| 10·12.9 | 결과·통계·분석실 | [match-history.js:officialMatchReviews](../src/artifact/match-history.js); [ui-match-history.js:analysisMatchPanel](../src/artifact/ui-match-history.js); [analysis-tiers.js:internalChampionTiers](../src/artifact/analysis-tiers.js) | stored public outcome/own original reasons·24excerpt limit·radar/context comparisons/snapshots/watchlists/notes/conditions/exports/source | 165–172 vertical slices 있음; fullroom tools UI incomplete; no fake old logs | P1 | own/reserve/opponent/fired·dated samecontext/full-lite/pending·source nav |
| 3.1·12.6·12.7·12.8 | 뉴스·이야기 13영역 | [season.js:news](../src/artifact/season.js); [player.js:recordPlayerEvent](../src/artifact/player.js); [player.js:rookieGlobalCohort](../src/artifact/player.js); [staff.js:staffRetirementReview](../src/artifact/staff.js) | amateur origin/milestone/development/cohort/reunion/rivalry/clubrepresentative/report-later/decision/retiredstaff/fan/news/recap | existing history/cohort/public news; 120/250 source truncation 재현·full narrative connection 미완료 | P1 | real event→lawful article/profile/relatedflow/save; no amateur match/forced story/bonus |
| 11 | 회계·스폰서·전략 | [finance.js:financeForecast](../src/artifact/finance.js); [finance.js:closeFinances](../src/artifact/finance.js); [features.js:sponsorOffers](../src/artifact/features.js) | cash/liabilities/commitments/prepaid/tax/staff/facility/sponsor·future obligations/board language support·AI planning | 기존 finance statements 있음; bounded history replacement archive 조사 | P1 | actual writer conservation/obligation expiry/partial failure·no invented price |
| 12.3·12.4·12.5 | UI·공통 조작·접근성 | [ui-state.js:UI_ROUTES](../src/artifact/ui-state.js); [ui-overlay.js:openUiOverlay](../src/artifact/ui-overlay.js); [shell.html](../src/artifact/shell.html); [ui-market-initial.js:bindInitialRosterMarket](../src/artifact/ui-market-initial.js) | top FM-inspired hierarchy/separate domains/save utility/3startup; filter/sort/context/tabledensity/keyboard/focus/error/loading/empty/units/Korean/no fake control | 6routes only; full domain replacements/radar remain; current explorer unpublished | P1 | each action→command→result→save; rollback/dup and focused desktop320 not finaldevice |
| 11·12 | 저장·복구·소유권·정보 | [save.js:packDB](../src/artifact/save.js); [save-migration.js:migrateSaveState](../src/artifact/save-migration.js); [app.js:persistWorldSnapshot](../src/artifact/app.js); [ui-data.js:bindData](../src/artifact/ui-data.js) | slot/compat/migration/recovery/export/legalownership/pending/full-lite/eventtime/current distinctions; local plaintext backup vs public debug info | existing queued IDB/local fallback/source retention; new report ownership/tools need continuity | P1 | read purity/atomic switch/invalid source/history preserved·no irreversible partialoverwrite |
| 5·12.4 | 위임·업무 흐름·편의 | [state-transaction.js:commitWorldAction](../src/artifact/state-transaction.js); [state-rollback.js:captureWorldActionJournal](../src/artifact/state-rollback.js); [ui-state.js:beginUiTask](../src/artifact/ui-state.js) | manual default·permission scope/trial/exceptions/revoke·batch partial/retry·task state/plans/dependency deadlines/no duplicate notification | shared command guarded; integrated delegation/workflow replacements incomplete | P2 | beforecondition→actual lawful mutation→feedback/save; no automatic major contracts |
| 12·13 | 성능·배포·검증 | [scripts/perf.mjs](../scripts/perf.mjs); [scripts/check.mjs](../scripts/check.mjs); [.github/workflows/ci.yml](../.github/workflows/ci.yml); [.github/workflows/pages.yml](../.github/workflows/pages.yml) | measured bottleneck representative baseline/outputparity/seed/version/history/AI·exacthead CI/sequential merge/validated main offline/playable URL | 172 validated release; 173open+uncommitted explorer; no new full CI/Pages; finalQA deferred | P1 | no instrumentation/budget/record deletion; source tests ≠ everydomain completion |

**공통 finding schema/작업 크기:** 각 행은 trigger=current recorded gap 또는 해당 scope의 실제 action/조건 변경, source=linked entry, writer/consumer/UI/save=acceptance path, 기대 이익=정확한 결정·반복 감소·정보/역사 보존이다. 비용/상충은 추가 observation/processing/storage/표현 밀도이며 강제 감독 입력·능력 보너스로 해결하지 않는다. 각 domain 전체는 여러45–55분 vertical slices; 개별 변경은 source/권한/조건→writer→consumer→UI→save/rollback까지 natural boundary로 나눈다. 경기 mechanics/source 확보→실제 writer→설명/화면 순, 과거 없는 원본 재구성 금지. AI/player 동일 명령·manual 기본을 보존한다.

**좁은 실제 source 재현:** [전체 inventory/원본 재현](evidence/whole-domain-audit-2026-10-04.json).

1. `player.js:recordPlayerEvent` 121개 입력 후120개만 남고 auditIndex0이 사라짐. Player career 원본/medical risk/title/goal consumer와 연결되므로 recent view와 영구 source를 분리하는 보호된 archive continuation 필요(P1). 무조건 cap을 없애거나 history budget을 올리는 수정 금지; source archive/읽기 window/save 비용을 측정하고 원래 기록을 보존. 이미 잘린 과거는 복원했다고 주장하지 않음.
2. `season.js:news` 251개 입력 후250개 유지, 초기 사건 제거. 현재 row fields year/text뿐이다. 모든 underlying domain history가 사라졌다는 증거는 아니며 각각 archive 존재 확인 필요. actual event identity/date/category/navigation/read/filter 원본과 bounded recent feed를 분리(12.6/P1). No fabricated archived articles.
3. `ui-season.js:worldTable`에 실제 defaultWorldConfig internationals7개를 사용하면 entry/format 설명에 undefined가 출력됨. UI_RUNTIME_EXCEPTION이 아니라 문자열 누락 결함이다. 최초 synthetic format fixture를 exception으로 예상한 probe 실패 로그를 보존했고 actual default fixture로 corrected diagnosis를 확보. startup3buttons replacement/competition domain에서 supported fields만 소비하고 missing metadata는 정직한 빈 상태로 처리(P1).
4. `ui-setup.js:managerTeamPicker`의 no-language-barrier notice는 latest superseding rule과 충돌하는 verified stale wording. 초기 recruitment notice만 없앤 현재 미검증 explorer가 전체 language restoration을 완료한 것은 아님. 실제 language workflow slice에서 code/rules/UI 함께 교체.
5. `docs/SYSTEM_DATA.md`의 append-only purchase legality 설명은172 actual atomic ledger writer와 불일치하는 dated documentation. 기존 raw rule/미확보 exclusive group과 source gaps는 보존하고 현재 구현 경계만 evidence-backed 갱신한다. README/ARCHITECTURE/retro audit의 날짜 있는 phase references는 historical evidence와 현재 지시를 구분해 follow-up.

**미재현 hypothesis/source candidates:** lowHP5–19→fight20clamp; objectiveTick/convert baron participation/quest 경로 차이; hardcoded reward patch propagation; assist rounding/global-local alive eligibility; RNG sort comparator portability; combat cache dependency completeness; patch diagnosis current team strength versus event-time strength; bounded role/rookie/scout/office/finance/scrim state replacement의 영구 archive 부재 여부; pending series patch lock 모든 날짜 변경 경로; loan force/manual lineup. source expression만으로 전 gameplay 결함 재현을 주장하지 않는다. 개별 반례를 확보한 뒤 correction. purchase shallow preview·ledger cache는172수정 보호, 별도 남은 alias 경로가 없으면 중복 defect count에서 제거한다.

**누락 방지 재검토:** 모든 엔진38개(장부/구매시간/gold double power/legality; CS vs nearbyXP/finite waves/share/allocation/camps; recall/respawn/travel/partial loss; damage/defense/reduction/penetration/reach/burst-sustained/skill-summoner availability/resources/CC/heal-shield/effective damage/conditional effects/team utility; postfight/waves/structures/dive/objective trade/buff/vision/AI/tactics/series/fatigue-mastery-teamwork; ordering/reward-cache/calculation reasons/patch/calibration/seed-version-history)는 위8.x/7/9 rows 및 원래38 inventory로 통합 유지한다. 이야기13개는 amateur origins, milestones, academy paths, cohorts, reunions, actual rivalries, clubrepresentatives, originalreport-later observation, management decisions, qualifiedretiredstaff, groundedfans, eventnews, seasonrecaps를 모두 유지한다. UI 전면12.3–12.5/Analysis12.9/managercareer/office10.4/country10.2 승인도 완료 처리하지 않는다.

**조사 후 precise continuation:** 진행 중 initial recruitment explorer의 actual query/detail/permission/selection/save acceptance를 완료해야 한다. 다음 engine priority는8.2.2 actual own-base purchase/recall/respawn/Ornn reviewed exception, 이후8.3 earned-gold generic power 및8.5.1 source-backed nearby/sharedXP/waves/camps. Career event 원본 archive와12.6 event-backed news/undefined/startup 설명 교체는 관련 vertical slice에 연결한다. 이번 조사만으로 임시 UI를 출시/173 merge/예약 변경/전체 기능 완료라고 주장하지 않는다. 생산 HTTP/외부 프로 데이터는 기존 blocked/미확보 한계 유지. 구현 phase 후 playtest fixes 전 final QA 금지.


### 8.2.2 구매 장소·귀환·부활 경로의 재현 가능한 조사 경계 — 2026-10-04

**상태:** 한 구현 담당자의 45–55분으로 추정한 제한된 엔진 조사 단위다. `scripts/shop-availability-probe.mjs`로 실제 함수·고정 입력·네 시드의 기록/무기록 총 여덟 실행을 재현한다. 게임의 구매 장소 수정, 귀환 시간 모델 또는 오른 예외 구현 완료가 아니다. 빠진 시간을 임의로 정해 구매 기능을 막거나 가짜 기지 상태를 만들지 않는다. 이전 8.2.1 장부 구현·원본 기록은 유지한다.

**발생 조건과 실제 경로:** `engine.js:addGold → advanceItemPurchases → commitItemCraftBatch`는 실제 골드를 차감하며 장비를 조합하지만 기지 위치를 입력받거나 확인하지 않는다. 처치·수입·구조물 보상이 같은 경로를 소비한다. `role-quest-match.js:roleQuestWard`는 별도 골드 차감·와드 구매 경로이며 역시 상점 상태를 확인하지 않는다. 일반 구매는 아군 기지라는 최신 승인에 맞게 두 경로를 함께 연결해야 한다. 감독의 아이템 구매 조작은 추가하지 않는다.

| 시드 · 기록/무기록 각각 | 조합 배치 | 처치 처리 중 배치 | 와드 구매 | 귀환 이벤트 | 사망 기록 | 명시적 상점 상태 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| record-official | 106 | 27 | 6 | 1 | 33 | 0 |
| shop-availability-A | 155 | 25 | 27 | 3 | 57 | 0 |
| shop-availability-B | 162 | 34 | 29 | 0 | 53 | 0 |
| shop-availability-C | 127 | 24 | 13 | 1 | 38 | 0 |

**관측의 한계:** 배치 수는 개별 재료 수 또는 완성 아이템 수가 아니다. `recall=false`는 물리적 전장 위치 증거가 아니며, 현재 위치 상태가 없다는 것이 문제다. 사망 중 구매는 각 시드 4/6/7/5배치로 관측됐지만, 사망 중 구매 자체가 불법이라는 판정은 아니다. `deadUntil`은 부활 가능 시간 경계이지 실제 기지·복귀 경로가 아니다. 오른/자르반의 장화·체력 물약 실제 writer 직접 호출도 모두 같은 위치 없는 방식으로 허용되므로, 오른의 전장 예외가 구현돼 있다는 근거가 될 수 없다. 직접 호출은 합성 참가자 조사이며 공식 경기 기록이 아니다.

**상태 작성·소비 경계:** 현재 `laningTick`은 초반 저체력 참가자를 즉시 `hp=1, recall=true`로 바꾸고 다음 `incomeTick`에서 CS 감소 후 표식을 지운다. `roleQuestIncome`은 기존 12초 대리값을 소비한다. 후반 귀환·귀환 취소·기지 도착·체류·복귀 상태는 이 표식으로 검증되지 않는다. `killPlayer`는 HP/사망 시각/손실 대리값을 쓰며 `alive`는 사망 시각만 검사한다. 기지 체류를 새로 구현할 때 수입·경험치·퀘스트·교전·시야·목표 합류까지 같은 가용성을 소비해야 한다. 기존 사망/귀환 손실을 중복 차감하지 않는다. 이 표식들을 정확한 이동·채널 시뮬레이션으로 설명하지 않는다.

**자료 확보 제한:** 고정 Riot Data Dragon 16.19.1의 오른 간이 대장간 설명은 어디서든 **소모품을 제외한** 제작을 지원한다. 자료 commit은 `1cf34d485c572a9894c223efd3d66c1e5ad7f22f`이다. 그러나 현재 저장된 자료는 일반 귀환의 채널·취소·복귀 시간 또는 오른 제작 가용성의 전체 조건을 제공하지 않는다. 고정 버전 summoner.json 요청도 HTTP 403/curl 22로 차단됐다. 이 응답은 자료 부재를 증명하는 것이 아니라 현재 수집 제한이다. `summoner.json` 확보만으로 이동 규칙 전체가 충족된다고도 가정하지 않는다. 정책을 우회하거나 8초/1분 같은 값을 출처 없이 추가하지 않았다.

**산출물과 집중 수용:** 이전 [기본 구매 원본](evidence/shop-availability-source-probe.json)을 덮어쓰지 않고 [전이·실제 writer·로그 동등성 원본](evidence/shop-availability-transition-probe.json)을 별도 보존한다. 다섯 실제 작성/자료 모듈의 SHA256, 가격의 골드 단위, 분/이벤트 순서 초, 제작 전후 잔액·재료·장비, 사망 전후/부활 경계, 귀환 기록과 원래 함수 실행 대비 정확한 결과 동등성을 남긴다. 승자·종료·경기 길이·플레이어 KDA/CS/XP/레벨/골드/아이템/퀘스트/시야/피해량·구조물·골드 이력·밴픽·기록/설명은 관측 wrapper 전후 동일하다. 기록/무기록의 실제 결과도 동일하고 원래 세계의 저장값은 불변이다. CLI 시드는 1–8개로 제한한다. 이 도구는 현재 결함을 반드시 남겨야 통과하는 테스트가 아니며 미래 교정 후에도 관측과 동등성 경계를 사용한다. [수집·초기 fixture 실패 진단](evidence/shop-availability-diagnostics.json)과 `/tmp/shop-availability-*` 로그는 보존한다. 초기 영어 champion 이름/템플릿 escape fixture 실패는 시뮬레이션 실패로 분류하지 않는다. 로컬 기존 정적 테스트의 자식 프로세스가 sandbox에서 EPERM인데 빈 출력/종료 0을 반환하는 환경 문제도 Node 22/24에서 독립 재현하고 원 진단을 보존했다. 권한 자동 검토 후 동일한 기존 정적 검사 전체가 성공했으며 테스트·계측·예산을 바꾸지 않았다. 외부 프로 경기 보정은 수행하지 않았다.

**로컬 검사:** 정적 검사·133모듈 빌드와 기존 실제 장부 수용(1,380 action/4 logged·quiet paired matches/공식 결과·복기·저장)이 성공했다. UI 통합 runner 결과는 원 로그에 보존한다. 제품 JS/HTML은 현재 main과 동일하며 이 조사의 출시 여부는 새 PR의 정확한 head 전체 CI·병합·같은 main CI/standalone/Pages 후에만 기록한다. 이번 코드에는 사용자 화면 변화가 없어 같은 화면의 브라우저 장기 검사를 반복하지 않았다.

**정확한 다음 구현:** 고정 패치의 귀환 완료·중단, 부활 후 기지와 복귀, 이동 가용성·오른 제작 조건의 검토 가능한 원자료를 확보하고 단위/출처를 기존 자료 체계에 등록한다. 실제 상태 작성자 → 공유 구매 장소 판정 → 장비 조합/와드의 골드 writer → 실제 효과 시점과 가용성 소비 → 공식 결과/저장·복기까지 연결한다. 반례는 일반 전장 구매 거절, 귀환 중 피격 취소, 기지에서 정확한 잔액·6칸 조합, 사망·부활 경계, 오른의 합법 비소모품/소모품 구분, 같은 시각 중복/실패 원자성, 종료 후 불변, 기록/무기록·AI/선수 동등성, 공식 pending/full/lite 저장이다. 자료 제한이 계속되면 안전한 독립 엔진 단위 8.3의 earned 골드·실제 장비 이중 전투력 소비를 조사·교정하고, 구매 장소 연결은 미완료로 유지한다. 8.5.1 출처 기반 웨이브/경험치 및 전체 승인 범위도 유지한다. 장기·실기기·TalkBack 최종 QA는 아직 시작하지 않는다.


**8.3의 다음 경계에 대한 추가 실제 재현(8.2.2 조사 중):** [고정 장비·레벨/미사용 골드 소비 원본](evidence/unspent-gold-power-source-probe.json). 같은 합성 자르반 참가자/레벨1/빈 장비/분12에서 `addGold`로 미사용 골드만 500→6,500으로 늘리자 실제 `combatStats`의 offense는 39.036→141.506, EHP는845.056→3,297.647로 증가했다. 장비 효과는 모두0이며 실제 350골드 롱소드 writer 구매 후 offense146.256/EHP3,338.210으로 다시 늘었다. 원인은 `combatStats0`의 `goldEarned-500` 전환과 `systemEffects`의 동시 소비다. 이 수치는 실제 초당 피해량/체력이나 전문 경기 보정 목표가 아닌 엔진 내부 대리지표다. **조사 당시 기존 승인8.3 가설을 실제 소비 재현으로 승격했다. 이후 방어 부분만 8.3.1에서 교정하며 공격 부분은 미완료다.** 구매를 기지로 제한해도 이 미사용 골드 전투력 경로가 남으면 귀환·구매의 비용이 왜곡될 수 있다. 검토된 raw item stats/패치 효과/챔피언 damage 소비 경계 및 오래된 generic 계수 의존을 먼저 대조하고, 새 arbitrary 수치 없이 실제 보유 장비·레벨·효과만 소비하도록 substantial 자연 경계에서 교정한다. 기존 결과 변화는 의도적 판정 교정으로 기록하며 역사를 다시 계산하지 않는다.


### 8.3.1 실제 보유 장비의 체력·저항력 소비 — 2026-10-04

**목표·규모·우선순위:** P0 경기 엔진의 45–55분 세로 단위. 같은 레벨/장비에서 미사용 골드가 HP·방어력·마법 저항력을 올리는 재현 결함을 교정하고 실제 구매 → 재료 소비/장비 → 교전 → 공식 기록/복기 → 저장까지 확인한다. 공격/AP 전체를 출처 없는 비율로 대체하지 않고 별도 자연 경계로 남긴다. 큰 8.3를 분할했으며 기능 수를 추가로 부풀리지 않는다.

**출처와 writer/consumer:** 고정 Riot DDragon 16.19.1의 `system-source.js` 및 기존 `itemDefs.stats`에 있는 `FlatHPPoolMod`(HP), `FlatArmorMod`(방어력), `FlatSpellBlockMod`(MR)를 사용한다. `item-purchases.js`의 원자적 장부/레시피 writer와 퀘스트 장비 변환은 유지한다. `systems.js:inventoryDefenseStats`는 `matchQuestItems`의 실제 소유 항목만 합산한다. `engine.js:combatStats0`는 챔피언 기본값/레벨 성장 + 그 장비 수치를 소비하고 골드 기반 방어 전환을 제거한다. 기존 EHP의 가중 저항력·전투 시간·숙련 등 집계식은 유지한다. 실제 피해 유형별 공식/주문/거리/CC 전체 구현이라는 주장은 하지 않는다.

**중복·패치·호환성:** 기존 `system-data.js`의 동일 raw stat 방어 proxy를 원래 rounding/clamp 식으로 분리해 전투 방어 보너스에서 한 번만 제외한다. draft 선택의 전체 effects는 유지한다. 보호막 텍스트 proxy·기존 방어 효과 패치의 delta는 지우지 않는다. `defenseStatEffect`는 원래 source 기여분이며 가격 변경은 장비 HP/저항력을 직접 바꾸지 않는다. 이전 저장의 누락 필드는 동일한 기존 source 정규화로 읽기 시 계산하며 원본 저장을 변형하지 않는다. patch revision을 기존 실제 전투 캐시 판정에 연결해 같은 분의 효과 변경/되돌리기도 반영한다. 이 경로는 양 팀/AI/수동 동일하며 새로운 감독 구매 명령은 없다.

**재현·플레이 예·수용:** [원본과 교정된 고정 시나리오](evidence/inventory-defense-correction.json)는 baseline main, source hashes, 같은 fixture/seed와 실제 이벤트를 보존한다. 레벨1/분12/빈 장비 자르반의 미사용 골드 500→6,500에서 이전 내부 EHP 845.056→3,297.647, 교정 후 845.056→845.056이다. 실제 루비 수정 400골드 구매는 장비 HP +150으로 이어져 EHP 1,055.947이 된다. 내부 지표이지 실제 HP/초당 피해·전문 경기 목표가 아니다. 다섯 챔피언의 레벨1/11, 실제 체력·방어·MR 구매, 재료 소모/최종 장비 중복 없음, out-of-slot 퀘스트 신발, 거절 원자성, 모든 정규화 항목의 legacy 동등성, 기존 effect patch/price/rollback/cache, 두 시드·양쪽 순서의 네 기록/무기록 paired outcome, 공식 공개 source와 full/lite 저장/역사 불변 및 기존 복기의 아이템 열 없음까지 `inventory-defense-acceptance.mjs`로 검증한다. local focused·장부/patch, UI 64수용/63독립VM, 달력·스카우팅20수용, Node22 regression·smoke(27,031ms; 기존35초 제한 유지)가 통과했다. 병행 Node24 smoke35초 timeout 원 로그와 단독 Node22 성공을 diagnostics에 함께 보존하며 CI·출시는 별도 gate다.

**의도적 변화·진단:** 이 수정은 동등 최적화가 아니라 잘못된 방어 입력 교정이다. 네 대표 경기의 승패/시간 변화와 전 이벤트를 삭제하지 않고 보존한다. 기존 골드 열세 승리 19/22 fixture는 해당 구버전의 결과이며 이번 변화 후 assertion 실패를 `/tmp/inventory-defense-ending.log`에 보존했다. [같은 설정의 제한된 32시드 관측](evidence/inventory-defense-resource-scenarios.json)은 현재 seed8/15의 실제 열세 승리·살아 있는 공격자·열린 기지·교전/오브젝트→넥서스를 확인한다. 원래 assertions를 유지하며 승률·컴백 목표를 정하거나 승자를 조작하지 않는다. 초기 champion identity와 재료 전체 조합을 빠뜨린 새 fixture 오류도 focused 로그1–3에 보존했다. 이전 근거는 그대로 둔다.

**상충·한계·정확한 다음 단위:** 장비 구매 전후의 방어 차이가 실제 재고에 연결되는 이익이 있다. 승패/교전 시간은 의도적으로 달라지고 전체 밸런스 검증은 남는다. AP/스킬 damage의 검토된 계수가 충분하지 않아 **미사용 earned 골드의 offense 전환은 아직 존재**하며 attack/AS/AP/치명타·penetration·효과 가용성은 다음 **8.3.2 공격 장비와 실제 피해 소비** 단위에서 원본 writer/consumer를 대조해 자연 경계로 교정한다. 가격을 공격력으로 바꾸거나 임의 AP→AD 계수를 만들지 않는다. 장비 stats 패치 writer 전체, 조건부 보호막/회복, 팀 armor reduction/개인 penetration, 퀘스트 bonus, 구매 장소/귀환 metadata 및 8.5.1 XP/waves도 미완료다. 이미 저장된 공식 결과는 재계산하지 않는다. draft 중 pending save의 새 엔진 재실행은 아직 완전한 과거 엔진 버전 고정이 아니며 그 한계를 숨기지 않는다. 장기/실기기/TalkBack 최종 QA와 외부 전문 보정은 수행하지 않았다. 전체 언어/UI/분석실/서사/사무국 및 승인된 범위는 그대로 유지한다.


### 8.3.2 실제 보유 공격 장비와 미사용 골드 소비 교정 — 2026-10-04

**발생·근거·규모:** P0 엔진 45–55분 세로 단위. 8.3.1 이후에도 `combatStats0`가 `goldEarned-500`에 class별 AD 전환을 적용했다. 레벨1/빈 장비 자르반·분12에서 미사용 골드 500→6,500만으로 내부 offense 39.187→142.053이었다. [원본/교정 입력·전체 사건·source hashes](evidence/inventory-offense-correction.json)는 baseline `9611ea4c043b3b57ccc1cdff240425e499754d48`의 실제 함수와 동일 fixture/seed를 보존한다. 교정 후 39.187→39.187, 실제 350골드 롱소드 구매 후 46.432다. 내부 집계 지표이며 실제 DPS/프로 경기 목표가 아니다.

**writer → consumer·단위:** `item-purchases.js`의 실제 잔액/레시피/퀘스트 writer를 유지한다. `systems.js:inventoryAttackStats`가 `matchQuestItems`의 실제 소유 장비 `FlatPhysicalDamageMod`(AD)와 AP 원자료/기존 source 기여를 읽는다. `engine.js`는 기본 AD+레벨 성장+보유 장비 AD를 소비하고 earned/price/spent gold를 공격력으로 바꾸지 않는다. `system-data.js:itemAttackStatEffects`가 기존 rounding/clamp 정규화의 AD 기여를 분리해 동일 AD proxy 중복을 한 번 제거한다. draft의 전체 정규화 effects와 AP/AS/crit·penetration 텍스트 proxy는 유지한다. 실제 장비·퀘스트·패치 revision 캐시를 그대로 쓰며 새로운 감독 구매 조작은 없다. 양 팀/AI가 같은 소비 경로다.

**기존 규칙·호환성:** 기존 MID 퀘스트 `bonusPower`를 장비 bonus AD 및 남은 AP source proxy에 연결한다. 새 비율/스킬 계수/치명타 배율/챔피언 예외는 만들지 않았다. `attackStatEffects`는 원래 source 기준 기여이며 effects 패치 delta를 지우지 않는다. 장비 가격만 바뀌면 보유 AD는 불변이고 실제 affordability는 바뀐다. legacy 누락 split은 기존 합법 source로 읽기 시 유도하며 저장/역사를 변경하지 않는다. 원자적 실패/중복 조합/재료 소모와 8.3.1 방어는 유지한다. 사용되지 않게 된 class별 `ITEM_CONV`/`ITEM_COST`는 source callers 확인 후 제거하며 원본 함수/committed 근거는 보호한다.

**집중 수용:** `inventory-offense-acceptance.mjs`는 현재 모든 챔피언·레벨1/11·MID 퀘스트 전후 688조건의 미사용 골드 공격/방어 불변, 실제 롱소드·반복 재료·완성품 재료 소모, affordability/중복 거절 원자성, 같은 시각 cache, effect/price patch 및 rollback, 모든 source item legacy split, AP/AS/crit의 기존 proxy 연결을 검증한다. 네 실제 기록/무기록 paired match의 승자/종료/시간·KDA·XP·장비·장부·골드 이력 동등성과 세계 read purity, 공식 series session pending save 및 public source full/lite 역사, 복기 아이템 열 제거를 검증한다. 실제 scheduled First Selection → 20턴 수동 draft → `resolvePendingOfficialMatch` → 결과 commit/queue → pending/full save 및 완료 중복 거절은 기존 `draft-history-acceptance.mjs`를 새 엔진으로 실행한다. 세션 저장만으로 전체 공식 transaction rollback 완료를 주장하지 않는다.

**의도적 변화·실패 보호:** 동일 네 경기의 승패/시간/전체 trace를 원본과 나란히 보존한다. 성능 동등 최적화나 밸런스 재설계가 아니라 잘못된 현금 입력 교정이다. 기존 8/15 열세 승리 fixture와 기존 여섯 경기의 양쪽 winner coverage가 이번 결과에서 실패한 원 로그를 [진단](evidence/inventory-offense-diagnostics.json)에 보존했다. [동일 설정의 첫32시드 관측](evidence/inventory-offense-resource-scenarios.json)은 실제 seed5/18 열세 골드 승리의 살아 있는 공격자·열린 기지·교전/오브젝트→넥서스 trace를 보존한다. paired fixture의 seed0은 실제 반대 winner를 제공한다. 기존 assertions/32시드 한도는 유지하고 승자/컴백 비율/계수는 조작하지 않았다. 원래 #171/#175 결과/실패는 그대로 보호한다.

**이익·상충·남은 범위·정확한 다음:** 구매하지 않은 현금만으로 공격력이 오르지 않아 자원→실제 장비→교전 연결이 일관된다. 승패와 시간은 의도적으로 변하며 전체 밸런스/전문 보정은 아직 없다. AP는 정확한 스킬 계수, AS는 실제 공격 횟수/챔피언 예외, crit는 정확한 치명타 판정으로 구현되지 않았고 기존 aggregate proxy다. raw stats 전체 패치 writer·피해 유형/관통/conditional effects/구매 위치도 미완료다. 기존 history는 재계산하지 않으며 pending draft는 과거 엔진 버전을 완전히 고정하지 않는다. 다음 45–55분 단위 **8.5.1 유한 웨이브·last hit와 nearby/shared XP**는 현재 income/level writer와 pinned metadata 보유 여부를 조사하고 원자료가 있는 범위의 공급·경험치·참가 가용성→레벨/아이템/교전 연결을 구현한다. source 부족은 정확히 기록하며 level 표시/임의 XP 계수로 보상하지 않는다. 8.2.2는 genuine transition 자료가 확보될 때 이어가고 같은 차단 조사만 반복하지 않는다. 전체 승인 38/8/13 및 UI/언어/사무국·서사 범위는 유지하며 장기/실기기/TalkBack final QA는 보류한다.

**현재 로컬 검사·한계:** 정적/133모듈 build, focused 원본 대조·ledger/ending/scheduled 및 UI65수용/64독립VM·calendar20수용이 성공했다. 실제 Chromium1280/320px에서 수동 공식Bo3 세 게임·pending/history save·당시 source/탭/키보드/filter/navigation/fired omission을 검증했고 document overflow/page error는 없었다. URL 정책 때문에 동일 rebuilt HTML을 주입한 검사이며 생산 HTTP/final device QA가 아니다. 초기 Chromium sandbox socket 권한 실패 후 자동 권한 검토로 동일 검사에 성공했다. 여러 검사와 동시에 실행한 Node22 regression30초 timeout은 보존하고 동일 제한의 단독 실행으로 재검증하며 한도를 올리지 않는다. 이 결과와 PR/main release gates는 별도다.

**로컬 최종 결과:** 같은 제한의 단독 Node22 regression·smoke27,050ms/35초·두 시즌186공식 경기/modern8·legacy2 save resume가 성공했다. 앞선30초 timeout은 진단 원본에 보존한다. UI65/64·calendar20·133module build/static 및 실제 scheduled/브라우저 수용은 통과했고 전체 required PR/main CI·standalone/Pages는 별도 확인한다.


### 8.4.1 교전의 남은 체력·유효 피해 보존 — 2026-10-04

**규모·우선순위·발생:** P0 경기 인과성의 45–55분 세로 단위. 다음8.5.1 원자료 검토에서 [웨이브·공유XP source 공백](evidence/wave-xp-source-gap.json)을 확인했다. pinned16.19.1 item/rune/champion snapshot은 full finite wave/spawn/nearbyXP 규칙이 아니다. fresh Cloud restricted/enforced·empty allowed hosts 상태에서 이전403을 반복하거나 우회하지 않고 독립적인8.4 승인 결함을 구현한다. XP/레벨 표시/기지 시간을 임의로 올리지 않는다.

**원본 writer/consumer·반례:** `engine.js:fight`는 실제 `ps.hp` 비율이 8.60%인데 다음 교전 F.hp를 EHP×20%로 만들었다. 다른 생존자는 실제0.56%를5%로 저장했다. 실제 회복/부활/시간 writer 없이 증가했고 SPEC19의 이전 상태→다음 상태 연결과 충돌한다. 남은 EHP232.56에 attempt311.37을 받으면 기록280이었으나 기존 .9 변환 안의 유효 예산은209다. 네 실제 seeded match에서 start raise4건/survivor raise3건/overkill 기록134건을 확인했다. [원본·교정 입력/전체 사건/관측/source hashes](evidence/combat-resource-correction.json)는 baseline `69b65d26c5d59bcaa242c52c9d07a47dad4c7bd4`, 고정 NA4 franchise와 실제 선수 seed/양쪽 순서·world purity 및 관측/비관측 완전 outcome parity를 보존한다. 이 값은 실제 HP/DPS/프로 target이 아닌 집계 EHP와 기존 보고 변환이다.

**구현·소유·단위:** `engine.js`는 F 시작/생존자 저장에서 합법적인 actual remaining fraction을0–1 범위로 그대로 소비한다. 새 `combat-resources.js:applyFightDamage`는 대상의 remaining EHP budget 안에서 packet을 한 번 소비하고 동일 recorded damage를 attacker dmg·victim dmgTaken·teamfightDmg·기존 `matchQuestEvent`에 전달한다. dead target/같은 packet 재호출/terminal/nonpositive은 예산·통계·quest/RNG를 변경하지 않는다. overkill을 다른 target에 공짜 이동하지 않는다. 기존 .9 report proxy/packet rounding, 대상 선택·queued order/RNG·처치 보상, income heal·귀환/부활 writer와 coefficients는 유지한다. 전체 heal/shield/CC·damage type·physical simultaneous casts/geometry를 구현했다는 뜻이 아니다. 다른 실제 damage event를 같은 적에게 다시 주는 행동 전체의 event-ID replay 방지는 아직 아니다.

**공식 source→UI→저장:** actual `simulateMatch.damageBasis`만 `publicMatchRecord`의 optional `effective-aggregate-v1` 근거로 저장한다. 공식 report와 Analysis Room 공통 `ui-match-history.js`가 새 기록은 남은 체력 예산 집계/스킬별 정확 판정 아님을 한국어로 설명한다. old missing marker는 집계 방식 미저장으로 표시하며 현재 값으로 재계산/태그하지 않는다. unknown marker는 source 거절한다. private practice observer-first guard·public/private 구분·item column 제거·navigation/modal lock은 유지한다. 이 source 검증은 암호학적 save 인증이 아니다. full/lite compaction은 optional source를 원래 값으로 보존하며 역사 삭제/전 기록 갱신은 없다.

**수용·비용·상충:** `combat-resource-acceptance.mjs`는 실제 F 진입/생존 비율 전부의 보존과 low<20%/<5% 사례, 큰 공격1000/remaining100→record90/MID actual damage quest90×기존 규칙, dead/terminal/중복·별도 target/0·음수/NaN budget·RNG 불변, 실제 네 logged/quiet/side pair의 KDA·damage/quest/gold/items/end equality와 양쪽 전체 dealt=taken을 확인한다. official session pending/public model marker/full/lite/legacy pure reader/malformed source/UI 설명까지 연결한다. 실제 scheduled FirstSelection/manual20turn/resolvePendingOfficial/commit/queue/pending·history·duplicate는 기존 focused를 새 엔진으로 검증한다. 전체 transaction rollback 완성 주장은 하지 않는다. 실제 Chromium1280/320px 공식Bo3 세 경기·pending/history/복기 피해 기준/분석필터·탭·키보드/source/return/fired omission에 overflow/pageerror 없음. rebuilt HTML 주입 검사이며 productionHTTP/final device QA 아니다.

네 대표 경기에서 winner/time은 같지만 피해 합계는236262→213104,188487→166735,149835→137292,172376→153626으로 바뀌고 실제 남은 HP/퀘스트도 달라진다. corrected start/survivor raise와 overkill 집계는 모두0이다. 이는 인과 교정이며 동등 최적화/전문 보정이 아니다. 다른 시드의 결과 변화 가능성은 보호한다. [원래 크기 제한 실패와 진단](evidence/combat-resource-diagnostics.json) 및 `/tmp/combat-resource-*` 전체 로그/원본 source/provisional evidence를 보존한다. engine34000자 제한을 올리지 않고 피해 writer를 독립 모듈로 옮겼다. 첫 combined module등록 line pattern 누락을 확인·교정하고 current134module static/build/focused/browser가 통과했다. implementation/module count만으로 feature 완료를 집계하지 않는다.

**정확한 다음·한계:** 웨이브/XP8.5.1 및 구매 위치8.2.2는 reviewed metadata가 들어올 때 이어간다. 같은 차단 조사만 새 단위로 반복하지 않는다. 다음 독립 엔진45–55분 단위는 **8.6.1 실제 오브젝트 획득의 공통 보상·참여·퀘스트 경로**: `objectiveTick.run`과 `convert` 직접 baron 경로의 actual outcome/event identity·참여/epics/jungleStacks·buff/gold writer를 실제 paired scenario로 재현하고 기존 합법 규칙/관여자를 유지한 shared award consumer와 official/save/UI 증거로 연결한다. 전역/국소 지급 eligibility·가격/시간/보상 coefficient를 source 없이 새로 만들지 않는다. 실제 귀환/회복·buff 변화에 따른 current/max HP, queued actor death/retarget, effective heal/shield, 모든38 engine/8 audit/13 narrative·UI/언어/office-countrytier2-broadcast/career inventory는 그대로 남는다. 장기100season/device/TalkBack final QA와 외부 전문 calibration은 아직 하지 않는다. release gates는 exact current PR/main CI/standalone/validated Pages 후에만 성공 기록한다.

**로컬 최종 결과:** 분리 모듈을 실제 등록한 최종 source에서 UI66 acceptance/65 freshVM·engine98module를 통과했다. current134module static/build, focused, 실제 browser 및 단독 Node22 regression·smoke27,537.7ms/기존35초·두 시즌186공식 경기/modern8·legacy2 resume가 성공했다. 앞선 inline 형태의 UI/calendar 결과와 새 등록 후 결과를 구분한다. 잘못된 `check:ui` script 호출은 진단에 보존하고 실제 `check:ui-finance-contracts`로 검증했다. exact PR/main 전체 CI·standalone/Pages는 로컬 통과와 별도 게이트다.


### 8.6.1 실제 오브젝트 획득의 참여·보상·퀘스트 공통 경로 — 2026-10-04

**범위·규모·우선:** P1 경기 인과성 45–55분 세로 단위. 현재 원본 `edb382594de0d2d2985c70953e6cb6a45703bc74`의 두 바론 경로를 대조했다. 초기4/default32시드×2side에서 직접 conversion이 없었던 결과도 보존한다. 실제 지원 전술 objective_priority0/aggression100의32시드×2side 중 seed objective-award-source-13의27분 Red 획득1건에서, 살아 있던4선수에게300골드/버프를 지급했지만 objectives/quest sequence는 그대로였다. 빈도·프로 목표/결함 없음의 전수 증명으로 쓰지 않는다. [설정·원본·교정 전체 사건·source hashes](evidence/objective-award-correction.json)는 fictional engine source다.

**작성자·입력/단위·소비:** `objective-awards.js:awardMatchObjective`가 기존 dragon/elder/herald/baron 지급을 소유한다. `objectiveTick.run`의 실제 call participant 목록과 `fight`가 새로 반환하는 actual participant IDs→`convert`의 생존한 실제 참가자를 각각 소비한다. 단순 alive roster 전체를 관여자로 추정하지 않는다. 기존 전체 alive 금전 수령 자격은 관여 기록과 별개로 보존하며 global/local/dead reward metadata의 정확성 완료 주장이 아니다. `epics=1`·JGL stack1은 기존 `matchQuestEvent`와 rules writer로 전달해 실제 완료/revision·강타/이후 장비·효과 소비에 연결한다. 기존 dragon40/baron300·elder6분, buff/respawn patch rules·결정 확률과 source 없는 시간은 재설계하지 않았다.

**중복·조건·한계:** kind+실제 spawn deadline(+dragon index) identity로 이미 받은 획득을 다시 지급하지 않는다. 실제 available 조건·side/소유 participant/빈 목록을 검증한 뒤 변경하며 중복 participant는1회만 관여한다. 정상 만료/반대 side의 다음 출현은 허용한다. terminal guard와 phase boundary를 보강했으나 현재 crossmap `takeStructure`는 allowNexus가 없어 정상 경로의 post-end 지급 결함은 재현하지 못했다. 합성 종료 거절을 실제 자연 발생 결함으로 발표하지 않는다. 잘못된 claim의 사전 거절 불변은 검증했지만 임의 훼손된 내부 state/consumer 예외의 전체 rollback·모든 live event replay authentication을 구현한 것은 아니다. aggregate fight survivors는 정확한 이동/합류/clear/마지막 타격 증거가 아니다. call 목록의 기존 사망 참여 의미도 reviewed metadata 없이 변경하지 않았다.

**실제 source→UI→저장:** 새 actual writer의 id/kind/side/minute/second/participantIDs를 match result→optional publicRecord.objectives v1로 deep copy한다. 최대4종×기존180분 guard=720 건 validation은 저장 근거 상한이며 승리/보상 규칙이 아니다. player IDs는 당시 scoreboard 소유 side와 일치해야 한다. `ui-match-history.js:renderRecordedObjectives`는 공식 복기·Analysis 주요사건에 선택적 실제 획득/참여 펼침과 이름/시간, 정확한 위치/마지막 타격 아님을 한국어로 표시한다. 현재 선수/숨은 능력/상대 private evidence를 재구성하지 않으며 practice observer-first guard를 보존한다. old missing source는 ‘미저장’, 새 실제0건은 실제 empty로 구분한다. quiet의 새 획득 writer는 원본 기록을 직접 저장하며 예전 quiet 로그를 복원하지 않는다. full/lite public source와 원래 game history는 유지한다. local validation은 암호학적 save 인증이 아니다.

**수용·변화·진단:** 새 focused는 실제 call/convert 작성자의 동일 participant/quest/gold, near-complete JGL stack→완료/실제 smite, 비참가 생존자 제외, 중복 출현 stale replay/다음 opposite respawn, invalid/empty/foreign/terminal 불변, 기존 live buff patch 소비와4 actual logged/quiet/side pairs/자연 conversion1건을 검증한다. 네 실제 경기의 관여 합계=writer participant 합계를 확인한다. 실제 official session/pending/full/lite/legacy pure/malformed source/UI로 이어진다. 합성 paired test는 후속 구조물 처치를 test-only stub으로 분리하며 full actual conversion은 별도 그대로 검사한다. [원래 fixture assertion 실패·중간 결과·한계](evidence/objective-award-diagnostics.json)와 `/tmp/objective-award-*` source/probes/logs/screenshots를 보존한다. 전투 참가 ID 연결 전 검사와 최종 검사를 구분하고 예산/계수/instrumentation을 올리거나 제거하지 않는다. 버그 수정의 관여/quest/wait 변화로 결과가 바뀔 수 있으며 동등 최적화 또는 전문 calibration이 아니다.

**정확한 다음:** 독립 엔진 **8.4.2 처치 지원 골드의 실제 pool·대상·배분 연결** 45–55분: `killPlayer`의 patch.assistGold/assists/as.length/각 반올림 writer를 실제1–4지원자·real fight hitter source로 재현하고 source/단위/유일성·killer 제외·보상 consumers를 확인한다. 정책·단위가 확보된 경계만 공유 writer→실제 bank/purchases/quest/공식 source/UI/save와 terminal/duplicate/AI·seeded parity로 교정한다. 반복 후보 나열로 끝내지 않되 미재현 오차를 실제 결함으로 먼저 선언하지 않는다. XP/웨이브8.5.1·shop8.2.2는 genuine source가 들어오면 이어간다. 모든38/eight-audit/13-narrative/언어/clubfinance/career/UI/Analysis/office-countrytier2-broadcast 승인 scope 및 final100season/device/TalkBack QA 보류를 유지한다.

**로컬 최종 결과:** 실제 fight participant ID가 연결된 최종 source에서 UI67 acceptance/66 freshVM/99engine module,135module build, 최종 focused·단독 Node22 regression/smoke26,811.3ms(기존35초)/두 시즌186경기·modern8/legacy2 resume가 통과했다. 최종 동일HTML Chromium1280/320px 공식Bo3 세 경기·pending/history save·공식/분석 획득 기록·새 details의 keyboard Enter·필터/탭/source/return/fired 권한에서 document overflow/page error가 없었다. 옛 참가자 연결 전 결과를 최종 게이트로 쓰지 않는다. exact current PR/main 전체 requiredCI·standalone·validatedPages는 별도 확인한다.

**추가 source 후보(8.6 기존 승인에 병합·미재현):** objectiveTick 스틸의 `lj`는 alive 검사로 선택하지만 call participant 목록과 항상 같은지는 확정되지 않았다. 현재 스틸 거리/합류·death eligibility와 call intent는 집계 모델이다. 이번 source는 기존 call 목록을 보존하며 이를 정확한 근접/마지막 타격 증거로 표시하지 않는다. 실제 lj/합류/사망·공개 기록의 paired counterexample과 reviewed 가용성 규칙을 확보한 뒤 참여·스틸 consumer를 보강한다. 새 스틸 성공률/거리/타이밍 coefficient를 만들지 않는다.


### 8.4.2 처치 지원 보상의 대상·중복·당시 지급 연결 — 2026-10-04

**규모·우선·source:** P1 엔진45–55분 세로 경계. 원본 main `f9d61b10a0f4a014a8f91062cbc0254dd3dcf4a0`의 `engine.js:killPlayer`가 실제 gold/XP/KDA/quest 작성자였다. 기존 patch.rules killGold300/assistGold150과 base champion XP writer를 읽었다. 1/2/3/4지원자 합성 지급은150/150/150/152였고, 실제 네 경기150처치 trace에서4지원자152지급2건이 있었다. [원본·교정 전체 trace·반례](evidence/takedown-reward-correction.json)는 가상 엔진 자료다. 프로 보정/실서버 rounding 근거가 아니다. 내부 정밀 계산 철학만으로 실제 Riot 반올림 정책을 주장하지 않는다.

**재현된 writer 결함과 구분:** 소유한 동일 지원자 `[x,x]`를 직접 넣으면 원본 assist2회/quest2회가 발생하고, 같은 dead victim을 다시 넣으면 killer/death/gold/XP/quest가 또 증가했다. 교정은 같은 지원자 한 번, 이미 사망 처리된 victim 재호출 inert다. 이 두 재현은 **합성 actual writer 반례**이며 정상 네 경기에서 자연 중복이 있었다고 주장하지 않는다. 정상 실제 네 경기의150처치 전후 trace·개인KDA/골드/XP/quest/장비/승패/종료/골드 history/log는 동일했다. 150→152는 actual 현상이지만 reviewed 배분·반올림 정책 부족으로 **교정하지 않고 명시**한다.

**writer·입력·단위·소유:** `takedown-rewards.js:killPlayer`가 실제 작성자를 작은 독립 모듈로 이동했다. terminal/victim availability·실제 match squad 객체·killer 반대편·보상 값의 유한/비음수를 상태 변경 전에 확인하고 지원자 object 유일성/킬러 제외/동료 피해자 제외를 적용한다. 죽은 killer/assist의 과거 관여를 임의로 지우지 않으며 실제 fight hitter Set/라인·갱킹 제공 대상을 재사용한다. 골드와 champion XP/roleQuestTakedown은 기존 addGold→actual bank/구매/cache, addXp→level, quest writer로 전달한다. 기존 사망 deadline/lanePush/first blood/log RNG/HP reset과 지급 계수는 유지한다. 부활 deadline 이후 새 death ordinal은 새 receipt이며 과거 사건을 replay하지 않는다. 사용자 수동 처치/아이템 명령이나 취소 작업을 새로 만들지 않는다. preflight 거절은 state/RNG 불변이고 callback exception의 완전 rollback은 미완료다.

**당시 설명·UI·save:** 각 실제 사건의 victim/death ordinal·side/minute/second·killer·assist 설정·실제 지급 합계·선수별 처치/지원 base gold/XP 및 실제 quest 추가 gold/XP를 기록한다. roleQuest 완료 보상이 있으면 실제 증가량도 quest 추가에 포함한다. 전체 match result receipt는 실제KDA와 보존 검사한다. 공식 source `publicRecord.takedowns v1`은 기존24사건 경계(first12+last12)/원래 count로 history 크기를 제한한다. 공식 복기/Analysis에 선택적 **처치·지원 보상** 펼침을 연결하고 설정150/지급152를 구분한다. 이름은 당시 archived 이름이며 hidden ability/private practice를 공개하지 않는다. 별도 `ui-takedown-history.js`가 순수 표현을 소유한다. 기존 화면8000character 제한을 올리지 않고 새 모듈·실제 소비 fixture 로딩을 연결했다. legacy missing source는 미저장, 현대0건은 실제 empty다. public source validator는 archived squad·유일 대상·side·시간·보상 단위/합계·count/death 합계·현재 집계 rounding basis를 확인하며 cryptographic 인증은 아니다. 과거 source는 재계산하지 않는다. full/lite save·pending official에 기존 optional source로 유지한다.

**효익·tradeoff·한계:** 잘못된 중복 writer 호출이 경제/quest를 중복 변경하지 않고, 선수에게 실제 왜 얼마를 받았는지 설명할 수 있다. normal actual case는 기존 결과를 유지하지만 새 source 크기가 늘고24건 이상이면 중간 상세는 생략된다. 반올림 차이, XP의 정확한 server share/dead eligibility, proximity/assist expiration, simultaneous deaths/physical geometry, bounty/shutdown/source-backed economy 정책은 전체 완료가 아니다. 고정 소스 메커니즘을 발명하지 않았고 기존 paid gold의 임의 pool compensation·무료 경제/아이템 파워·강제 역전은 없다. shop은 여전히 장소 미연결이다.

**수용·진단:** actual0–4지원자/킬러 제외·동일 대상/중복 지원/foreign/friendly killer/negative rule/terminal 불변, 실제 부활 후 다른 ordinal, 살아 있지 않은 지원자 기존 정책 유지, 기존 patch 변경/quest bonus/은행,4logged/quiet·양side와 실제4지원자2건, actualKDA↔receipt 수량, 세계 저장 불변, 실제 official session/pending/full-lite/history/legacy/malformed/UI 연결을 확인한다. original fixture world null 접근 실패와 writer 추출 시 잘못된 denominator 실패, 기본 sandbox static child-process 실패를 원문 보존한다. 수정은 null fixture와 실제 eligible 분모/의존 presentation 모듈 로딩, 기존 static의 permission-reviewed 실행이다. 검사/계수/예산/계측을 없애지 않는다. 최종 local UI68수용/67독립VM·100engine/137module static/build, Node22 regression/smoke27910.4ms(기존35초)/두시즌186경기 및 실제Chromium1280/320 공식Bo3세경기·pending/history·새보상details Enter·filter/source/권한/저장에 document overflow/pageerror없음을 확인했다. 이는 동일 rebuiltHTML 주입 focused 검사이며 productionHTTP/최종기기QA가 아니다. 최종 관련 checks/브라우저 증거는 [진단](evidence/takedown-reward-diagnostics.json)에 actual 결과로 기록한다. PR/current main CI/게시 확인 전 출시 완료로 쓰지 않는다. 장기100season/device/mobile/TalkBack final QA·외부 professional calibration은 보류한다.

**정확한 다음:** 독립 엔진 **8.3.3 실제 보유 AD/HP/armor/MR의 raw item stat patch 작성자·소비 연결**45–55분. 기존 itemDefs.stats(raw values)와 itemDefs.source(provenance)/분리 source proxy·effect patch/version/rollback/AI selection/public notes/실제 combat cache와 draft consumers를 읽고, 현재 지원하는 원자료/스탯 단위가 있는 경계만 수정한다. 가격·효과 proxy를 실제 stat change로 가장하지 않고 같은 raw contribution을 두 번 적용하지 않는다. defined mutation→실제 owned stats/combat·관련 patch UI/official/save/historical boundaries를 연결하며 새 AP/AS/crit/spell ratio·compensation coefficient를 발명하지 않는다. approved38/eightaudit/13narrative/모든운영·서사·UI·언어·office inventory는 유지한다. XP8.5.1/shop8.2.2는 genuine metadata가 확보되면 이어간다. 동시에 발생한 처치의 기존 actor payout 시점/queued attacker 정책은 **별도 미재현 가설**이며 이번 독립 배분 guard로 구현했다고 하지 않는다.


### 8.3.3 실제 보유 장비 스탯 패치 작성자·소비 연결 — 2026-10-04

**목표·상태·우선순위:** 엔진 최우선, 45–55분의 승인된 수치 패치 연결 단위. `itemDefs.stats`가 실제 수치, `itemDefs.source`가 provider/version/map provenance다. 이전 handoff의 `source.stats` 표현은 실제 소스와 달라 교정했다. 본 절은 구현과 focused local 수용 상태이며 PR exact-head CI·병합·same-main CI/standalone·Pages는 확인 전 완료로 쓰지 않는다. 전체8.3/AP·공속·치명타·조건 효과/정확한 스킬 피해나 전체 밸런스 엔진 완료가 아니다.

**trigger·원본 근거:** 기존 `applyNote`의 item/offense·defense 노트는 합법적인 aggregate 효과 보정만 바꿨고 raw 수치를 변경하지 않았다. 실제 Long Sword의 AD10/offense .01에서 효과 .02를 쓰면 raw AD는10이며, 새 raw 노트는 원본 작성자가 지원하지 않았다. 이는 기존 효과 패치가 모두 잘못됐다는 주장이 아니라 승인 로드맵의 실제 스탯 변경 연결 공백이다. [원본](evidence/item-stat-patch-baseline.json)은 기준 main SHA·Riot Data Dragon16.19.1/map11/provider를 보존한다. 가격·지출·현금을 실제 스탯으로 대체하지 않는다.

**source·writer·단위·가용:** `system-data.js`가 AD(`FlatPhysicalDamageMod`), HP(`FlatHPPoolMod`), armor(`FlatArmorMod`), MR(`FlatSpellBlockMod`) 네 고정 원자료 수치만 허용한다. 실제 pinned item ID/provider/version/map·원자료에 존재하는 양의 스탯·현재 유한/비음수 값과 노트 old/new를 검증한다. AP/AS/crit·generated/출처 불명·지원하지 않는 필드는 raw 변경 대상으로 만들지 않는다. `patch.js:applyNote`의 `item_stat` 분기가 preflight→원자적인 stats/effects/source split 갱신→revision을 작성한다. stale old·중복·음수/nonfinite·출처 불일치는 raw/effect/revision/세계 상태를 변경하지 않는다. 이미 적용한 patch 값을 다시 쓰지 않으며 inverse 노트의 old는 현재 new와 일치해야 한다. 이 내부 패치 작성자는 외부 입력 보안 인증이나 모든 callback exception rollback을 의미하지 않는다.

**실제 소비·AI·tradeoff:** 기존 rounded/clamped 정규화의 바뀐 AD/방어 기여만 effects에 반영하고 독립 효과 패치 차이는 유지한다. `defenseStatEffect`/`attackStatEffects`를 같은 변경에서 갱신하여 실제 combat HP/armor/MR/AD와 같은 raw proxy가 두 번 계산되지 않는다. inventory/quest boots·legacy read-only split, combat cache와 system choice/draft meta cache는 기존 revision 경로를 사용한다. 기존 밸런스 선택기가 offense/defense를 골랐고 해당 원자료가 있으면 실제 스탯 노트를 만든다. 가격 확률·기존 사용/승률/표본 정책·기존 `PATCH_SIZE_PROFILE.stat` 크기만 재사용하고 새 효과 계수/보상/전문가 목표/전문 경기 분포를 발명하지 않는다. 해당 원자료가 없는 경우 기존 효과 변경을 유지한다. `lastSystemChange`는 새 타입도 최근 변경으로 세어 기존 cooldown을 우회하지 않는다. 한 패치의 여러 노트는 구단/원자료를 변경하지 않는 private planning copy에서 순서대로 구성하여 published old/new와 실제 적용 순서를 연결한다. 자동 노트 RNG/결과가 의도적으로 바뀌는 기능 확장이지 behavior-preserving 최적화가 아니다.

**player-facing example·UI:** 피바라기 AD80→81.6의 실제 보유 장비를 바꾸면 controlled aggregate offense89.3393→90.3320이며 가격이나 현금을 바꾸지 않았다. HP150→153, armor15→15.3, MR20→20.4도 실제 보유 EHP에 전달된다. 이 수치는 실제 DPS/피해량·프로 목표가 아닌 기존 내부 aggregate 지표다. `ui-patch.js:noteText`는 당시 아이템 이름·한국어 스탯·old→new·기준 자료16.19.1·게임 내 조정을 표시한다. fictional patch와 실제 Riot 변경을 혼동하지 않는다. 기존 패치 화면과 native details/키보드를 재사용하고 manager 구매/새 설정/필수 분석 절차를 만들지 않는다. 새 raw note 표시 경로는 malformed save의 old/new 문자열도 HTML로 실행하지 않고 escape된 텍스트로 표시한다. 이는 모든 기존 패치 UI의 보안 감사 완료를 뜻하지 않는다. 주요 TOP nav, save/load utility와 제거된 match item column은 유지한다.

**수용·기록·save:** [교정 수용](evidence/item-stat-patch-correction.json)에는 네 스탯/현재 AD·AP 클래스와1·11레벨, actual affordable recipe 구매/보유·비보유, out-of-slot quest 장비, 같은 시각 cache/fresh, 기존 effect delta 보존, clamp saturation·inverse/duplicate/invalid/legacy, cash 불변, draft/choice revision, 네 logged/quiet·양side 실제 넥서스 종료, 세계/pinned snapshot 불변, 실제 official session/pending/full-lite/old history와 한국어 렌더링이 기록된다. `scripts/item-stat-patch-acceptance.mjs`가 기존 CI domain runner에 연결됐다. [실제 경기 기반 자동 선택](evidence/item-stat-patch-natural.json)은 계산한 가상24경기→`recordMeta`→독립16 seeded `newPatch` 결정의 raw 노트2건과 actual mutation/replay를 보존한다. professional calibration/발생률 목표가 아니며 낮은표본·가상게임 편중은 기존 선택 정책의 한계다. 별도 synthetic64-selector 입력4노트는 경로 수용이지 전문 통계가 아니다. 재실행 도구는 `scripts/item-stat-patch-scenarios.mjs`다. 과거 공식 source/KDA/골드/역사는 재계산하지 않고 이벤트 당시 patch ID·노트 replay와 현재 full/lite 장비 수치를 보존한다. 오래된 save의 기존 generic 노트도 유지한다.

**검사·실패·한계:** focused 수용·UI69acceptances/68독립VM·100engine/137module static/build, 실제 Chromium1280/320 공식Bo3세경기·pending/history save·새 patch note/source/Enter 펼침·narrow overflow없음·권한/Analysis/source navigation을 확인했다. 동일 rebuilt HTML 주입으로 검사했으므로 production HTTP/final device QA는 아니다. 최초 old-history fixture는 실제 stat 복원 대신 일회성 합성 rollback들의 transient revision까지 동등하다고 잘못 비교해 실패했다. 원문을 보존하고 historical item definitions·actual current cache 경계를 나눠 검증했다. 기존 static child-process 검사와 browser 실행의 기본 sandbox 실패 및 permission-reviewed 동일 검사 결과는 [진단](evidence/item-stat-patch-diagnostics.json)에 보존한다. 예산·assertion·계측·프로덕션 fallback을 약화하지 않는다. source snapshot은 immutable며 새로운 외부 자료를 수집했다고 주장하지 않는다. Node22 isolated regression·smoke28410.6ms(기존35초)·두시즌186공식 경기와 calendar20수용도 통과했다. PR/current-main CI 결과는 실제 종료를 보고 기록한다. HP·방어력·AD의 raw 연결만으로 spell AP ratio/AS timing/crit exception/penetration/조건아이템/상점/웨이브/전체 패치 adjudication은 완료되지 않는다. 장기100season/device/mobile/TalkBack final QA는 계속 보류한다.

**발견·정확한 다음:** 다음 coherent45–55분 단위는 **8.6.2 실제 스틸 실행자와 오브젝트 참여/quest/source의 일치**다. `engine.js:objectiveTick.run`의 살아 있는 `lj` 스틸 실행 경로는 `c[taker].part`에 lj가 없을 가능성을 검사하지 않고, award는 call participant 배열을 그대로 받는다. 아직 실제 누락을 재현한 defect라고 단정하지 않는 **기등록 source hypothesis의 구체화**다. actual seeded trace로 stealing actor/call/fight/award를 대조한 후 실행자 source→공통 award/quest→optional 공식/UI/full-lite/history 연결을 검증한다. 확률·보상·새 reach/proximity/dead eligibility를 발명하지 않는다. 정상 case/중복/terminal/양side/logged-quiet/AI parity와 원본 trace를 보존하고 verified writer inconsistency가 있으면 승인된 경계를 교정한다. queued actor/simultaneous 정책은 별도 미재현 가설이다. XP8.5.1/shop8.2.2는 genuine reviewed metadata 확보 때 재개하며 unchanged blocked 조사를 반복하지 않는다. 전체38/eightaudit/13narrative/UI/언어/커리어/office 승인 inventory는 그대로 남는다.


### 8.6.2 스틸 실행자·참여·퀘스트·당시 기록의 일치 — 2026-10-04

**목표·우선·크기:** 엔진 최우선 45–55분 세로 경계. 등록 가설을 실제 seeded source로 재현한 뒤 실제 실행자→공통 award→관여/퀘스트→공식 source/UI/save를 연결한다. 전체 오브젝트/정확한 geometry/steal 규칙 완료가 아니다.

**trigger·원본·근거:** main dfabb664의 `objectiveTick.run`은 실제 살아 있는 패배 측 정글러 lj의 스틸을 실행하지만 award에는 `c[taker].part`만 전달했다. [초기64경기](evidence/objective-steal-initial-scan.json)는 스틸11/누락0, [추가128경기](evidence/objective-steal-continued-scan.json)는 스틸20/누락1이었다. 둘 다 원본으로 보존하며 빈 결과를 결함 없음의 증명으로 쓰지 않는다. 실제 seed `objective-steal-source-35`, CR/VXG 순서, 5분 드래곤에서 NA_52 정글러는 스틸했으나 call의 NA_51/53/54/55만 관여를 받았다. 스틸 실행자의 관여0/quest10.8398296703/sequence6이 전부 그대로였다. [원본·교정 두 경기 전체 사건/선수/source hashes](evidence/objective-steal-correction.json)는 가상 엔진 재현이며 외부 프로 데이터·발생률 목표가 아니다.

**writer·단위·실제 소비:** `objectiveTick`은 기존 스틸 성공 분기에서만 lj를 전달한다. `objective-awards.js`가 현재 같은 측 소유 JGL·alive·비conversion claim을 preflight하고 기존 call participant와 Set으로 합쳐 한 번만 관여/epics/jungleStacks 사건을 작성한다. 기존 gold alive 지급, respawn/buff, 스틸 확률/RNG·smite 성공 계산·call/죽은 기존 참가자의 eligibility는 바꾸지 않는다. 따라서 actor 미참여 case는 관여0→1/quest10.8398→11.8398/sequence6→7이 된다. 실제 near-threshold 합성 반례는 기존 quest 완료→smite consumer까지 확인한다. 보상·새 위치·reach·dead eligibility·계수/시간은 만들지 않았다. actor가 이미 참여한 정상 스틸은 중복 관여가 없다. invalid/foreign/non-JGL/dead actor, stale/duplicate spawn와 terminal claim은 award preflight에서 mutation 없이 거절된다. 이 작은 writer preflight는 모든 callback exception rollback이나 외부 데이터 인증을 뜻하지 않는다.

**당시 source·UI·save:** 새 스틸의 실제 receipt에 optional `stealer` ID를 저장한다. 기존 v1 기록과 일반 획득은 필드가 없으며 과거 로그로 복원하지 않는다. public reader는 해당 side의 archived JGL·participant 포함을 검증한다. 기존 `match-history`의 실제 복사와 full/lite 저장을 재사용하며 스틸 실행자는 당시 이름으로 공식 복기·Analysis의 optional native details에 표시된다. 표시 모듈은 `ui-match-history.js:renderRecordedObjectives`, 엔진 소유자는 objective-awards다. 위치/개별 스킬 마지막 타격을 정확히 계산했다고 표시하지 않는다. manager micromanagement/새 필수 메뉴를 만들지 않으며 match item column 제거와 TOP nav를 유지한다.

**수용·한계·tradeoff:** `objective-steal-acceptance.mjs`가 양측 synthetic missing/already-present actor/near-threshold quest/기존40골드/duplicate index/invalid atomic/terminal/stale를 검사한다. 실제 두 seed×양 side의 네 logged/quiet pairs와 비관측 실행은 동일한 결과를 보존하며 자연 누락 actor는 정확히 한 번 기록된다. 실제 official `steal-official-1`의 pending session→계산→archived source→full/lite history와 legacy/malformed/render를 검증한다. 서로 다른 두 원본·교정 match의 winner/time은 같고 최종 NA_52 관여4→5만 달랐지만 quest timing은 의도적으로 바뀐다. 다른 조건에서 승패가 바뀔 수 있으므로 전역 behavior-preserving optimization/전문 calibration이라고 하지 않는다. 유한표본/원래 집계 call·alive eligibility·정확한 거리/스킬/마지막타격/동시 처리·queued actor 정책은 남는다. `objective-steal-probe.mjs`는 최대64시드×양측 bounded observer tool이며 original scan/hash/world purity를 보존한다. 최종 로컬 UI70수용/69독립VM·100engine/137module static/build·calendar20·Node22 regression/smoke30844.8ms(기존35초)/두시즌186공식 경기와 Chromium1280/320 실제Bo3세경기+실제 스틸 공식 기록의 pending/history/save/Enter/filter/source/fired·넘침/pageerror 없음이 통과했다. 동일 rebuilt HTML 주입이므로 production HTTP/final device QA가 아니다. PR/current-main CI·게시 gates는 별도로 확인한다. 최종100season/device/mobile/TalkBack QA는 보류한다.

**실패·보존:** 최초 duplicate fixture는 dragonAt만 되돌리고 dragonIdx를 유지해 합법 다음 identity를 잘못 중복으로 판단했다. fixture에서 같은 spawn의 두 필드를 맞췄으며 production identity/assertion은 약화하지 않았다. 공식 source fixture는 load 전 seed를 실제 pending load 후 상태에도 그대로 사용할 수 있다고 잘못 가정했다. 원래/load 후 bounded 검색을 보존하고 실제 load 후 스틸이 발생한 seed1로 검증했다. 강제 결과나 약화한 assertion은 없다. static child-process와 Chromium socket 기본 sandbox 실패 뒤 동일 검사를 permission review로 실행했다. [진단](evidence/objective-steal-diagnostics.json)과 /tmp/objective-steal-* initial/final 원본들을 보호하며 #180 취소 CI/캡처 overwrite 한계도 명시한다. 기존 예산·계측·history는 제거하지 않는다. 첫 최종 browser는 fresh series 전체 rec를 저장 전후 동일하다고 가정해 기존 compact save가 생략하는 seed/firstChoice에서 실패했다. 원래 전체 차이 진단을 보존했고 실제 publicRecord/스틸 이름·참여는 저장 전후 정확히 동일했다. compaction이나 기존 history 정책은 수정하지 않았다.

**정확한 다음·발견 병합:** 다음 coherent45–55분 후보는 **8.6.3 실제 구조물 전환의 lane 선택·난수 순서 경계**다. `takeStructure`의 `lanes.sort` comparator 안에서 `rng.dec.next()`를 호출하는 실제 source를 기존 여덟 audit 후보의 RNG-in-sort에 병합한다. 아직 실행 환경별 결함이나 최종 교정으로 단정하지 않는다. bounded 같은-state/같은-seed permutation·sort 호출 순서·RNG draw와 실제 구조물/보상/source를 재현하고, 기존 진행도/노이즈 크기를 재사용해 lawful deterministic selection을 교정한다. 임의 가중치/확률 보상이나 history 재계산을 하지 않는다. queued actor availability/simultaneous payout은 별도 미검증 가설이며 이번 actor 관여로 완료되지 않는다. shop8.2.2와 XP8.5.1은 genuine metadata 확보 시 재개한다. 전체38/eight-audit/13-narrative/UI·언어·재정·커리어·office-countrytier2-broadcast 승인 inventory와 장기 QA 보류는 그대로 남는다.


### 8.6.3 구조물 전환의 합법 대상·동률 난수 순서 — 2026-10-04

**목표·크기·상태:** 엔진 최우선 45–55분 실제 구조물 writer→기존 gold/quest→당시 공식 source/UI/save 경계. 미구현 대규모 구조물 HP/거리/다이브/웨이브 모델을 완료했다고 하지 않는다. 전체 approved38/eight-audit/13-narrative/모든 운영·UI·언어·office scope를 축소하지 않는다.

**trigger·원본 근거:** `takeStructure`는 `laneProgress`(파괴된 구조물 수)의 차이에 매 comparator 호출마다 `(rng.dec.next()-.5)*1.5`를 더했다. 차이는 정수이며 노이즈 절댓값<.75이므로 진행도 차이1 이상은 뒤집지 않지만 동률 비교는 비일관적이며 호출 순서에 난수 상태가 의존한다. [원본 bounded 재현](evidence/structure-selection-baseline.json)의 같은12시드×6후보 permutation은 모든12시드에서 같은 진행도·seed의 선택을 바꿨다. 이 샘플의 draws 수는 같았으며 환경별 draws 차이/모든 브라우저 차이를 재현했다고 하지 않는다. 같은 fixture에서 높은 진행도의 top 억제기를 선택한 뒤 allowInhib=false로 포기했지만 mid/bot 포탑은 합법적으로 남아 있었다. [실제 원본·교정8경기](evidence/structure-selection-correction.json)는 기존 default tactics, 실제 source/RNG/전후 gold/quest·전체 사건·module hashes·world purity를 보존한다. 원본206구조물 call 중 합법 대체 포탑이 있는데 포기한16건을 확인했고 교정161call에서는0건이었다. 가상 엔진 source이며 전문 보정/빈도 목표/전수 증명은 아니다.

**writer·소비·rule:** `engine.js:selectStructureLane`는 canonical LANES 순서로 후보를 읽고 현재 최대 진행도를 먼저 고른다. 유일 최고 후보는 난수를 소비하지 않으며 동률 후보 각각에 기존 .5/1.5 표현의 key를 한 번 할당하고 최고 key를 고른다. 정확히 같은 key는 canonical 첫 라인으로 고정한다. comparator 안에서 난수를 소비하지 않고 후보 배열을 mutate하지 않는다. `takeStructure`는 allowInhib로 허용하지 않은 idx3을 선택 전에 제외한다. 명시 lane이 금지된 억제기라면 다른 곳으로 몰래 전환하지 않고 기존처럼 거절한다. 완전히 소진된 명시 lane의 기존 fallback은 유지한다. 알 수 없는 lane/side·terminal은 mutation 없이 거절한다. 허용된 inhibitor/nexus·억제기 respawn·alive gold/quest/first tower writer·250/300/350의 기존 tower reward는 유지한다. 연속 takeStructure는 다음 구조물 tier를 대상으로 하는 별도 합법 call이며 새 transaction ID/중복 억제 정책을 발명하지 않는다. 전체 callback rollback이나 respawn tick을 통한 재생까지 모든 실패가 불변이라고 주장하지 않는다.

**이익·tradeoff·결과:** 억제기를 공격할 수 없어도 공격 가능한 다른 포탑을 선택하고, 같은 state/seed/candidate set은 같은 target/RNG가 된다. 유일 progress 후보의 불필요 comparator 난수 소비를 제거하고 동률분포/이후 stream을 의도적으로 바꾸므로 결과 보존 최적화가 아니다. 실제8경기에서 승패2건과 종료 시간이 바뀌었고 raw 원본을 보존한다. 새 진행도 가중치·보상·스틸 확률·가격·거리·임의 보정은 없다. 기존 seeded save/history를 새 엔진으로 소급 계산하지 않는다. 완전한 pending engine-version freeze도 구현되지 않는다.

**당시 source·UI·저장:** 실제 새 result의 `structureSelectionBasis:progress-seeded-ties-v1`을 `match-history.js:publicMatchRecord`가 복사하고 reader는 지원 marker만 수용한다. 실제 official pending session→계산→기록→full/lite 저장에 연결됐다. 기존 `ui-match-history.js:renderPublicMatchReview`는 당시 기록의 허용 라인·진행도·seed 동률 기준을 한국어로 설명한다. legacy missing basis는 그대로 두고 설명을 새로 만들어 붙이지 않는다. 실제 tower log/골드/quest writer와 저장 source를 재사용하며 정확한 이동/거리나 winner 설명을 가장하지 않는다. source validation은 local consistency이며 암호학적 인증이 아니다. match item column 제거/TOP nav/manual authority는 유지한다.

**focused·기존 검사·보존:** `structure-selection-acceptance.mjs`는12seed×6permutation의 동일 target/RNG, primary progress/정확한keytie, 양측 allowed/denied inhibitor/명시 lane 취소/소진 fallback/연속tier/invalid/terminal/기존125골드, 네 logged/quiet 양side 실제 넥서스·world purity, 실제 official pending/full-lite/history, legacy/malformed/Korean source를 검증한다. `structure-selection-probe.mjs`는 실제 bounded8경기 read-only source tool이다. 기존 ending fixture5/18은 새 결과에서 behind-gold winner가 아니어서 실패했다. 원본 fixture/로그를 보호하며 [같은 설정32seed](evidence/structure-selection-resource-scenarios.json)의 실제 behind winners0/20와 both-winner coverage1을 사용해 기존 gold/nexus/살아있는 전환·base access·실제 fight/objective assertions를 그대로 유지했다. 전술 objective_priority0/aggression100의32×양side는 실제 conversion17을 발견했으며 기존13 trace와 실패를 보호하고 실제17로 자연 경로 assertion을 유지했다. 강제 승자·comeback rate·예산 상향·계측 삭제가 없다. 기본 child-process/Chromium socket sandbox 실패와 unchanged permission-reviewed 검사도 보존한다. 최종 로컬 UI71수용/70독립VM·100engine/137module static/build·calendar20·Node22 regression/smoke27089.6ms(기존35초)/두시즌186공식 경기·Chromium1280/320 실제Bo3세경기/pending-history/source marker/한국어 설명/Enter/filter/save/fired·document overflow/pageerror 없음이 통과했다. 동일 rebuilt HTML 주입이므로 production HTTP/final device QA는 아니다. 초기/최종 screenshot 경로를 재사용하지 않았고 원래 실패·source를 보존했다. 새 current-head 전체CI·병합·same-main standalone/Pages 게시 gates는 실제 결과로 별도 확인한다. 최종100season/device/mobile/TalkBack QA/외부 전문 calibration은 하지 않는다.

**새 source 발견·정확한 다음:** 다음 coherent45–55분 단위는 **8.6.4 macro 끊기 참여자 선택의 난수·가용성 경계**다. 실제 `macroTick`의 `al.slice().sort(()=>R.dec.next()-.5).slice(0,Math.min(3,al.length))`도 comparator 내부 RNG이며 기존 eight-audit 후보에 병합한다. 이번 구조물 선택을 고쳤다고 hunter 선택/queued death 판정까지 완료되지 않는다. 실제 살아 있는 후보→선택 pool→fight 참여/source→conversion·gold/quest/공식UI/save를 bounded seed/후보순서/실행·순수 observer 반례로 재현하고 기존 max3/확률/권한·일관성 범위에서 교정한다. 새로운 reach/출전 정책·noise 계수·강제 결과를 만들지 않는다. queued actor availability/simultaneous payout은 별도 미검증 가설이며 genuine metadata 없는 shop8.2.2/XP8.5.1 조사도 반복하지 않는다. 전체 승인 inventory와 보류 QA를 유지한다.

8.6.3 첫 PR head `b743185`/CI `37208548063`은 `ui-match-history.js` 기존 8,000자 제한 초과로 실패했다. 로컬 static-reviewed 로그도 같은 실패였으며 앞선 통과 집계는 잘못이었다. 원본 로그를 보존하고 당시 보상 해석 문구를 기존 `ui-takedown-history.js`의 `renderRecordedAdjudicationBasis`로 분리했다. 제한·검증 조건을 늘리거나 지우지 않았다. 최종 head 검증은 별도로 확인한다.


### 8.6.4 macro 끊기 참여자 선택·시드 순서·당시 기록 — 2026-10-04

**목표·우선·크기:** 엔진 최우선45–55분 경계. 살아 있는 실제 후보→최대3명 선택→실제 fight/convert/기존 gold·quest→공식 복기·저장 연결이며 전체 match·UI/Analysis 기능 완료가 아니다. approved38/eight-audit/13-narrative/모든 운영·UI 승인 inventory를 유지한다.

**trigger·원본·근거:** `macroTick`은 실제 성공한 끊기에서 `al.slice().sort(()=>R.dec.next()-.5).slice(0,Math.min(3,al.length))`를 썼다. [같은12seed×120순열](evidence/macro-hunter-baseline.json)은 각 시드의 동일 후보 집합에서 선택3명 조합10가지, draws4–9회를 보였다. 이는 exact 기존 comparator 표현의 합성 source 재현이며 실제 다른 브라우저를 비교한 결과가 아니다. [원본·교정8경기](evidence/macro-hunter-correction.json)의 실제 read-only fight wrapper는 원본18/교정21 끊기 교전과 실제 participants/alive/gold/quest/전체로그·module hashes를 보존한다. 표본의 승패2건·종료 시간이 바뀌었고 전문 보정/발생률 목표/전수 증명이나 behavior-preserving optimization이 아니다.

**writer·소비·단위:** 새 `macro-picks.js:selectMacroHunters`는 현재 side.ps의 canonical roster 순서에서 후보 소유·alive·유일성을 확인하고 각 후보당 기존 decision RNG key를 한 번 받아 수치 sort를 한다. comparator는 RNG를 소비하지 않으며 같은 key는 canonical index로 정한다. 기존2명 이상/최대3명, 실제 대상·시야·끊기 성공확률·상대 도움 .3*rotation 확률·fight/convert/보상 계수를 유지한다. dead/foreign/invalid/terminal 후보는 거절하며 후보/선수 상태는 변경하지 않는다. 이 순서는 실제 경기 안의 roster 순서이며 선수 능력·지역 가중치를 만들지 않는다. 실제 `fight`가 사용한 양측 참가자/target/winner를 교전 후·convert 전에 기록한다. selector는 누가 참여했는지 바꾸므로 결과·다음 RNG가 의도적으로 달라진다. 새로운 거리/reach/이동·사망 정책·확률·보상·강제 승자는 없다. 기존 quest·bank·구매·구조물/오브젝트 전환이 실제 selected fight 결과를 그대로 소비한다.

**당시 source·UI·save:** 새 actual result의 `macroPickEvents`를 `publicMacroPicks`가 optional v1/basis/count/first12+last12로 복사한다. actual id/side/lane/minute/second/target/hunters/defenders/winner와 실제 archived roster 소유/유일성/수량/시간을 검증한다. `ui-takedown-history.js:renderRecordedMacroPicks`가 실제 당시 이름·공격/방어 참가자·교전 승리와 정확한 이동/개별스킬 여부가 아니라는 한국어 설명을 native details에 표시하고 `ui-match-history` 공식 복기/Analysis가 연결한다. 실패한 끊기 시도 전부를 기록했다고 하지 않으며 새 필수 manager workflow가 없다. old missing source는 그대로 누락, 실제0건은 empty로 구분한다. official pending session→계산→public source→full/lite history와 재접속을 검증하며 과거 결과를 재계산하지 않는다. local consistency 검증은 암호학적 인증이 아니다. match item column 제거/TOP nav/manual authority를 유지한다.

**focused·실패·tradeoff:** `macro-hunter-acceptance.mjs`는12×120×양side 동일선택/후속RNG·정확keytie·2/3/5명·소유/생존/중복·invalid/terminal·roster 불변, 실제4logged/quiet pairs의8끊기 참가자→fight결과 동일·world purity·실제 official pending/full-lite/source/render/legacy/malformed/24excerpt/deepcopy를 검증한다. 처음 fixture는 매 순열마다 큰 경기 state를 만들고 JSON 직렬화해 기존60초 한도를 넘었다. 원본 Node24/22 실패를 보존하며 canonical state를 재사용하고 전체 roster 전후 불변 비교를 순열그룹당 한 번 실행해 동일 assertions/한도를 유지했다. 실제 simulator optimization이 아니다. 최초 잘못된 `check:ui` 호출/childprocess/socket sandbox 실패도 보존한다. 원래 ending0/20 fixture는 새 결과에서 behind win이 아니어서 실패했고 objective conversion17과 official steal1도 더는 해당 자연 사건이 없었다. 원본 파일/로그를 보존하고 [같은 설정32seed](evidence/macro-hunter-resource-scenarios.json)의 실제14/27 behind winners·conversion5 및 [실제 pending-save/load32sessions](evidence/macro-hunter-official-search.json)의 official steal8을 사용해 기존 nexus/gold/base access/fight/객체/steal assertions를 그대로 유지했다. natural missing actor35의 minute5 dragon은 여전히 검증된다. 시드 선택은 실제 발생 시나리오 fixture이며 발생률/comeback 목표가 아니다. 최종 local/CI/Pages 결과는 [진단](evidence/macro-hunter-diagnostics.json)과 exacthead에서 확인한 뒤 구분한다. full callback rollback·모든 재호출/queued actors/동시 피해·전문 calibration·최종100season/device/mobile/TalkBack QA는 완료하지 않았다. 모든 원본 /tmp/macro-hunter-* source/로그/캡처는 보호하고 캡처 경로를 재사용하지 않는다.

**새 source 발견·정확한 다음:** 다음 coherent45–55분은 **8.4.3 queued 피해 패킷의 실제 시간·생존·동시 처리 경계**다. `fight`는 round 시작 alive에서 모든 packet을 준비하고 mech shuffle 후 `applyFightDamage`를 호출하며 alive 표시는 round 끝에 갱신한다. writer는 target remaining HP를 검증하지만 이미 HP0인 attacker의 예정 packet은 취소하지 않는다. 이는 source 가설이지 실제 잘못된 동시 규칙으로 재현·확정한 결함이 아니다. actual 준비/적용/HP/kill-credit/quest·last·양측 상호 처치·초과 피해/죽은 target 반례를 bounded observer와 paired scenario로 재현하고, 기존 aggregate round 의도/결정/선행 승인과 비교해 실제 불일치만 교정한다. 물리적 동시 서버 규칙·cast duration·새 우선순위/계수를 발명하거나 사망 후 이미 날아간 스킬을 일괄 금지하지 않는다. settled policy 변경이 필요하면 근거/상충과 별도 제안으로 구분하고 독립적인 승인 source-backed writer 교정을 이어간다. genuine source가 없는 shop8.2.2/XP8.5.1의 unchanged 조사는 반복하지 않으며 전체 승인 범위는 남는다.

8.6.4 최종 로컬 수용: UI72수용/71독립VM·101engine, calendar20수용, static/build138module, Node22 regression/smoke30957.1ms(기존35초)/두시즌186공식경기, 실제Chromium1280/320 공식Bo3세경기/새참여details Enter/당시 source/save/Analysis filter/권한/넘침·pageerror없음. 새 원본 진단·구현 이후 gates는 아직 별도다.


### 8.4.3 준비된 라운드 피해·소유·생존·입력 경계 — 2026-10-04

**상태·근거:** 승인된45–55분 구현 단위다. 실제 `fight`는 라운드 시작의 살아 있는 참가자가 피해를 준비하고 mech shuffle 순서로 적용한 뒤 라운드 끝에 alive 표시를 갱신한다. [원본4경기](evidence/fight-round-original.json)의 실제 read-only packet observer는1361패킷 중 같은 라운드에서 HP0이 된 공격자의 준비된 유효 피해79건과 이미 HP0인 대상의 무효 패킷202건을 보존한다. 이 경로는 기존 aggregate-round 의도와 일치하며 잘못된 시전으로 확정하지 않는다. 정확한 서버 동시성·시전/투사체 시간·물리적 도달·상호 처치 우선순위는 이 자료로 정의할 수 없다.

**재현된 독립 결함:** [합성 actual-writer 입력](evidence/fight-round-invalid-baseline.json)에서 아군, 경기 밖 fake ps, 준비되지 않은HP0 공격자, Infinity 피해를 원래 writer가 받았다. 각각18/18/18/90 recorded damage와 hitters/quest/stat에 접근했다. 자연 경기에서 이 잘못된 입력들이 발생했다고 주장하지 않는다. 입력 소유·생존·유한 값 경계를 강화하는 승인된 writer correction이며 새 확률·보상·시전 정책이 아니다.

**구현·source/writer/consumer:** `combat-resources.js:applyPreparedFightRound`가 실제 actor의 라운드 시작 자원을 Set으로 고정하고 전체 packet의 경기 소유·서로 다른 side·시작 생존·유한 양수 피해를 적용 전 검증한다. `applyFightDamage`는 actual side.ps 소유와 alive/deadline, target remaining HP, 유한 양수 packet을 확인한다. 같은 라운드에 HP0이 된 공격자는 준비된 Set에 있을 때만 기존 피해를 적용하고 새 direct 공격/다음 라운드 준비는 거절한다. 실제 engine 준비·shuffle→공통 writer→실효 dealt/taken/teamfight/MID quest/hitters/last→기존 kill/보상/구매 경로를 유지한다. invalid whole input batch/terminal은 mutation·RNG 없이 취소한다. 서로 다른 정상 패킷을 같은 이벤트로 간주하는 새 중복정책이나 callback exception 전체 rollback은 구현하지 않는다.

**플레이어 예·UI/저장:** 새 실제 결과의 `combatRoundBasis:prepared-round-budget-v1`만 optional 공식 publicRecord에 복사해 공식 복기/Analysis에서 “같은 라운드에서 체력이 소진돼도 이미 준비된 피해는 남고, 다음 라운드의 새 공격에는 참여하지 않습니다”를 표시한다. 관측 가능한 당시 판정 설명이며 정확한 개별 스킬 실행이라는 뜻이 아니다. archived 선수/기록, pending/full/lite save를 통과하고 marker 없는 원래 기록은 설명을 추정하거나 재계산하지 않는다. 미지원 marker는 source reject. 검증은 로컬 source checking이며 cryptographic authentication이 아니다. match item column 제거·top navigation·엔진 소유 구매는 유지한다.

**수용·변화·tradeoff:** `fight-round-acceptance.mjs`가 양측 상호 예정 피해, HP0 다음 공격, dead target/친선/외부/Infinity/NaN/음수/terminal과 whole-batch 무변경, 실제4logged/quiet 양side pairs·world purity·실제 official pending/full-lite/history·legacy/malformed/Korean source를 확인한다. [최종교정4경기](evidence/fight-round-final.json)의 모든 준비/적용 패킷·선수통계·quest·gold/items/XP·전체log·winner/ending/duration은 원본과 동일하다. bounded 실제 경계의 parity이지 전체 엔진 최적화 또는 professional calibration은 아니다. 공격을 순차 준비·처리한다는 aggregate 한계와 기존 .9 reporting/rounding·RNG·처치 자격/계수는 남는다. 새 invalid-input 차단은 의도된 동작 교정이다.

**실패 보호·검증 구분:** 기존 combat fixture는 side.ps와 actor.side/alive/HP를 생략해 새 ownership 검증에서 실패했다. 원본 fixture/로그를 보존하고 실제 state 모양을 공급했으며 기존 damage90·별도target·quest/assertions를 유지했다. 최초 static child-process/socket sandbox 실패와 UI/calendar/browser를 함께 실행한 Node22 smoke 기존35초 초과도 보호한다. 같은 검사를 격리하거나 명시 권한 검토 후 재실행하며 한도/assertions/instrumentation/예산을 바꾸지 않는다. focused·전체local·정확head CI·병합·게시를 [진단](evidence/fight-round-diagnostics.json)에 구분한다. /tmp/fight-round-* 원본source/log/초기·최종 별도캡처를 보호한다. 최종100season/device/mobile/TalkBack QA·professional calibration은 보류다.

**발견·정확한 다음:** 다음 coherent45–55분은 **8.4.4 라인전 교환의 실제 HP 자원 보존**이다. 실제 `laningTick`의 패자 `Math.max(0.05, hp-loss)`/승자 `Math.max(0.1, hp-0.07)`/올인 실패 floor도 저체력 상태를 올릴 수 있는 별도 source 후보다. 이번 round 교정이 이를 고쳤다는 뜻은 아니다. source observer로 실제 low-HP 교환 전후와 all-in/귀환/킬 분기를 재현하고 기존 교환·kill/recall 규칙·계수를 보존하는 자연 vertical boundary로 수정한다. HP0 처리에서 새 정책이 필요한지 기존 규칙/반례를 먼저 검사하며 임의 death policy·계수·timing·보상을 만들지 않는다. actual HP→올인/귀환/fight→official/source/UI/save, logged/quiet/AI/terminal/history와 tradeoff를 확인한다. genuine metadata 없는8.2.2상점/8.5.1XP 조사는 반복하지 않고 전체 승인 inventory를 유지한다.

8.4.3 최종 로컬 수용: UI73수용/72독립VM·101engine, calendar20, static/build138module, 격리Node22 regression/smoke27489.8ms(기존35초)/두시즌186공식경기, 실제Chromium1280/320 공식Bo3세경기/당시round설명·source·Enter·Analysis filter·pending/history save·권한·넘침/pageerror없음. exacthead CI/main/Pages는 별도 gates다.

8.4.3 source 검증에서 초기 교정 trace의 combat-resources hash가 마지막 optional ownership/음수HP guard 전 상태임을 발견했다. 초기 fight-round-correction.json과 hash를 그대로 보존하고 현재 최종source hash·동일4경기를 fight-round-final.json으로 별도 기록했다. 첫 head c3dec2e/CI37216028963은 이 evidence 최신화 전 실행이며 final 성공이라고 집계하지 않는다. 코드·검사/budget 변경 없이 최종head에서 다시 모든 CI를 확인한다.


### 8.4.4 라인전 HP 비용·자원 보존·당시 설명 — 2026-10-04

**상태·trigger·source:** coherent45–55분 구현 단위. `laningTick`의 패자/승자/올인 실패 HP 비용이 기존 .05/.1 비치명적 하한으로 저체력 상태를 올릴 수 있다. [원본](evidence/laning-hp-baseline.json)은 실제4경기 normal raises0과 같은 실제 phase 함수의8개 controlled lowHP setup에서28 implicit raises를 보존한다. 통제 state는 합성 입력이며 자연 경기28건 또는 pro target이라고 주장하지 않는다. 현재 정상 tick 순서의 income 회복이 이4경기를 보호한 사실도 기록한다. 앞선 상태가 다음 상태에 영향을 준다는 SPEC19/기존8.4 자원 보존에 맞춰 비용을 회복 writer와 구분한다.

**writer·단위·선택:** 기존 `combat-resources.js:applyLaningHpCost`는 actual side.ps ownership/생존/terminal·0–1 HP fraction·유한 nonnegative cost/0–1 floor를 확인하고 `min(before,max(existingFloor,before-cost))`를 쓴다. below-floor HP를 올리거나 new trade death를 만들지 않는다. 기존 패자 cost `min(.5,.1+abs(diff)*1.4)`/floor.05, 승자.07/floor.1, 올인 실패.2/floor.05를 그대로 전달한다. 실제 낮아진 HP가 low target 선택·올인 성공 probability·귀환 조건과 다음 fight 자원을 소비한다. 올인 처치/kill gold·quest·item, 귀환HP1/income/death deadline 정책은 바꾸지 않는다. trade 비용을 EHP로 변환해 damage/quest에 발명한 통계를 넣지 않는다. 이 aggregate nonlethal trade floor 자체의 현실성/정확한 spell/geometry/heal/shield는 별도 미완료다.

**UI·save·예:** 새 실제 결과의 optional `laningHpBasis:bounded-nonlethal-cost-v1`만 공식/public→공식 복기/Analysis의 한국어 “피해 비용으로 체력이 회복되지는 않습니다”→pending/full-lite/history에 연결한다. 예: HP2%인 선수에게 비용을 적용해5%로 올리지 않고2%를 유지하며 실제 귀환이 발생하면 별도HP1 writer가 회복한다. marker 없는 과거는 설명을 추정하거나 다시 돌리지 않으며 unsupported marker reject. local source checks는 cryptographic save authentication이 아니다. engine-owned item/top nav/item-column removal/full approved UI scope를 보존한다.

**재현·교정·tradeoff:** [교정](evidence/laning-hp-corrected.json)의 controlled raises0, 원본과 normal4경기 전체 phase traces/HP/KDA/gold/items/XP/damage/quest/log/nexus/time 동일. controlled8setup 중6trace 결과가 바뀌며 intentional invalid cost-healing correction이다. bounded normal parity이지 전체 최적화·professional calibration·comeback 발생률 목표가 아니다. below-floor 상태의 nonlethal 비용은 새 처치 정책 없이0까지 제한될 수 있어 기존 보호 하한 의미를 유지한다. 앞으로 reviewed 별도 lethal trade/spell 모델이 생기면 이 한계를 다시 검토하며 이번에 settled policy를 바꾸지 않는다.

**수용·소유:** `laning-hp-acceptance.mjs`가128양side HP/floor/cost 경계·normal cost·기존 nonlethal floor·below-floor/zero·반복 가능한 정상 비용·foreign/side/dead/HPNaN/negative/above1/costInfinity/floorinvalid/terminal 무변경과 실제귀환 consumer,4logged/quiet pairs·world purity·actual official pending/full-lite/source/Korean/legacy/malformed를 확인한다. `laning-hp-probe.mjs`는 실제 phase 표현에 순수 observer를 넣고 module hashes/원본·교정 full bounded traces/합성lowHP를 보존한다. seed/outcome 강제나 실제생존비율 목표를 만들지 않는다. focused/local/정확headCI/병합/Pages를 [진단](evidence/laning-hp-diagnostics.json)에 구분한다. 원본 /tmp/laning-hp-* source/log/고유 초기·최종캡처와 모든 이전 실패를 보호한다. 장기100season/device/mobile/TalkBack QA·외부 프로 보정은 보류다.

**정확한 다음:** coherent45–55분 **8.4.5 combat cache 입력·실제 mutation/consumer 연결 감사와 확인된 교정**이다. 기존 eight-audit combat cache 후보에 병합한다. 현재 key의 t/goldEarned/lvl/questRevision/itemRevision/patch revision/side buff와 실제 `combatStats0` 입력 mastery/confidence/playerMod/mods/owned raw stats/effects를 대조하고 지원 writer에서 같은 시각·버전의 cached/uncached 결과를 bounded source/seed/양측/rollback/patch/event ordering로 재현한다. stale 결과는 아직 확정 결함이 아니다. 실제 정상 invalidation을 보존하며 확인된 누락만 구현하고 speculative rewrite/계수/미관측 private 입력을 추가하지 않는다. 개선 성능을 주장하려면 bounded baseline/before-after/parity를 측정한다. source-supported 결함이 없으면 actionable evidence/정확 continuation을 기록하고 이미 승인된 initial-recruitment observed flow 등 독립된 실제 구현을 이어간다. genuine metadata 없는 shop8.2.2/XP8.5.1 조사·완료된 HP/round/objective/macro 단위를 반복하지 않는다. 전체 승인38/eightaudit/13narrative/UIAnalysisradar/languagefinancecareer/officecountrytier2broadcast inventory를 유지한다.

8.4.4 최종 로컬 수용: UI74수용/73독립VM·101engine, calendar20, static/build138module, 격리Node22 regression/smoke26060.1ms(기존35초)/두시즌186공식경기, actualChromium1280/320 공식Bo3세경기/새비용설명·source·Enter·Analysis filter·pending/history save·권한·넘침/pageerror없음. identical rebuiltHTML injection이며 직접productionHTTP/장기deviceQA 아니다. 정확headCI/병합/동일main/Pages gates는 별도다.

### 8.4.5 전투 캐시 실제 입력·측정된 현금 재계산 제거 — 2026-10-04

**상태·source·trigger:** existing eight-audit cache 후보/38목록34에 통합한45–55분 수직 단위다. `combatStats0`는 시간 phase·level·owned equipment/quest gear·item/rune/patch revision·side buff를 소비하며 실제 HP/deadUntil 가용성은 teamPower/fight의 별도 소비다. `newPS`의 profile/player attrs/playerMod와 simulateMatch의 mods는 isolated 한 경기에서 고정되고 실제 match writer에서 변경하지 않는다. 지원 purchase/quest/raw patch/effect patch/buff/level writer를 감사했으며 **stale 결과 결함은 재현되지 않았다**. 미지원 mastery 직접 편집을 자연 결함으로 부르지 않는다. 반면 raw stats175–176 이후 cash가 계산 입력에서 사라졌는데 cache key의 goldEarned는 남아 있었다.

**bounded baseline·구현:** [원본](evidence/combat-cache-baseline.json) 실제 가상4경기/양순서 source observer에서 requests5770, 실제계산1315, 그중 같은 time/level/equipment/quest/patch/buff의 cash-only195를 재현했다. `engine.js:combatStats`는 t/level/questRevision/buff flags의 명시적 string key와 기존 itemRevision·patch object/revision을 유지하고 goldEarned를 key에서 제외한다. 현금/가격/지출 전투력 환산이나 새 coefficient가 아니다. 상수 시간 단위 packed-number를 별도 의존값 표현으로 바꾸었지만 부동소수점 충돌을 재현 결함이라고 주장하지 않는다. 새로운 cache/module/framework/전역 소유권은 만들지 않는다.

**측정·선수 예·tradeoff:** [교정](evidence/combat-cache-corrected.json)은 같은5770요청에서 실제계산1120, cash-only0으로195회/14.83% 재계산 감소다. 네 원본/교정 match의 KDA/HP/골드/XP/items/damage/quest/log/nexus/time/골드 이력은 정확히 같다. 예: 이미 가진 장비 그대로 킬 보상만 받으면 전투 수치를 재계산하지 않지만, 실제 Long Sword 구매/퀘스트 장비 변환/레벨/버프/패치 변경은 즉시 새 값을 쓴다. ms는 observer/warmup을 포함한 단일 bounded pass이며 전체 게임 속도 향상률/프로 보정/global parity를 주장하지 않는다. 이는 행동 보존 최적화이며 새로운 gameplay 정책이 아니다. 앞으로 match 중 profile/mod/rune writer를 추가하면 그 의존 revision도 함께 연결해야 한다.

**수용·ownership/UI/save:** `combat-cache-acceptance.mjs`는 양측 actual cash credit/affordable·rejected purchase/XP level/quest completion/raw stat patch+rollback/stale rejection/buff 만료/시간/availability를 cached↔uncached 대조하고 actual4logged/quiet pairs의11540요청 값을 확인한다. 기존 player/AI shared simulateMatch를 사용하며 world/pinned/history를 바꾸지 않는다. 실제 공식 pending play→public source→Korean review→full/lite history continuity를 확인한다. cache 최적화는 player-facing 규칙/기록을 바꾸지 않아 새 history marker나 장식 UI를 만들지 않는다. 기존복기·Analysis·topnav/item-column 제거 유지. 과거 기록은 재계산하지 않는다. 기존 source-backed patch/quest/item runner가 추가 writer 경계를 검증한다. `combat-cache-probe.mjs --original`은 당시 cache 함수만 원본으로 바꾸어 fresh fictional paired sample을 재현하고 RNG를 변경하지 않는다. 전체 source/원본·교정·실패는 [진단](evidence/combat-cache-diagnostics.json)과 /tmp/combat-cache-*에 보존한다.

**한계·정확한 다음:** actual supported stale defect는 미재현이며 full engine/effect/shop/XP 완료가 아니다. all38/eightaudit/all13narrative/UIAnalysisradar/languagefinancecareer/officecountrytier2broadcast 승인 inventory 그대로다. 다음 coherent45–55분은 **12.5.1 최초 영입의 관측 후보 탐색→상세→협상/복귀** 첫 실제 화면 단위다. 별도 dirty explorer를 보존·diff하고 current guide를 덮어쓰지 않는다. region/overseas/all의 실제 기준과 authorized observed ability/filter/sort/detail/report/빈 상태/권한/reset/save/기존 evaluation-negotiation을 연결하되 hidden core branch를 안전한 관측으로 오해하지 않는다. comparison/radar/language fake status를 구현 없이 완료라고 붙이지 않는다. 시작화면/전체 UI는 별도 남은 수직 단위이며 known source-blocked8.2.2/8.5.1은 유효 metadata 확보 때 재개한다. 독립 source-backed engine defect가 재현되면 engine 우선 원칙으로 진행한다. 최종 장기/기기 QA는 보류다.

8.4.5 로컬 최종: UI75수용/74freshVM·101engine, calendar20, static/build138module, Node22 동일 full regression/smoke29027.5ms(기존35초)/두시즌186공식경기 통과. actualChromium1280/320 scheduled FirstSelection/manual20turn/Bo3세경기/pending-history save/source/Analysis filters/키보드/해임/no overflow-pageerror 통과. identical rebuiltHTML injection이며 productionHTTP/finaldeviceQA 아니다. 원본 focused rollback fixture 오류(default note는 rollback 뒤 다시 유효), default childprocess/Chromium sandbox 실패와 calendar 종료 전 regression을 시작해 겹친35초 smoke 실패를 모두 보존한다. 동일 full chain을 격리해 통과했으며 예산·assertion·instrumentation·fallback은 변경하지 않는다. 새로운 exactheadCI/merge/main/Pages gates는 별도 확인한다.

### 12.5.1 최초 영입의 관측 후보 탐색·상세·기존 명령 연결 — 2026-10-05 (UTC 10-04)

**trigger·source·우선도/크기:** main b408caf의 `ui-market-initial.js`는 이름이 inert, 결과80명 상한, 지역 scope가 local eligibility, 관측 목록 열람이 lazy scout report/가격 cache를 작성하고 시장가치에 true attrs를 사용했다. 사용자 승인(12.5/P1)에 따라 최초 목록→상세→실제 관심/관찰/평가/협상→복귀를 한45–55분 세로 경계로 연결한다. 기대 이익은 협상 전 정보를 실제로 읽고 후보 누락·반복 검색을 줄이는 것이다. 모든 엔진/전면 UI/언어 구현 완료는 아니다.

**실제 구현·소유:** `ui-initial-candidates.js`는 region/overseas/all(현재 선수 `p.region`의 출신 지역, 국적·활동 지역·로컬 자격·언어와 별개), 기본region, 이름/역할/관측 종합 최소1–99(0은 제한 없음), 기준/오름·내림·ID동률, 전체 수/25명 paging, 상세·복귀/세계·슬롯·권한 문맥을 소유한다. 새 모듈9500자, 기존 market15000/negotiation9500 한도 유지. 정보 부족 후보는 최소0일 때 누락하지 않고 '정보 부족'으로 보이며 정렬 뒤에 둔다. 원본의 MID `ROLE_KEY_ATTRS.roaming`은 attrs가 아니라 TENDENCIES source에 있어 NaN이 됐다. 이를 재현한 뒤 obsOvr가 실제 observed attrs만 기존 playerRoleRating에 전달하도록 연결했다. 기존 true role 평가가 이미 가진 누락 key의 중립 정규화(default50)를 재사용하며 새 coefficient나 실제 성향/hidden 값을 공개하지 않는다. 원본46MID의 NaN→유한값, 다른178후보의 정확한 종전 점수 동등성을 source fixture에서 확인했다. 이 변경은 관측 소비 오류 수정이며 관리자의 목록 정렬/내부 평가/새 관측 snapshot 소비는 의도적으로 교정되며 AI의 별도 scoutReport/불확실성 writer는 변경하지 않았다; 전체 경기/경제 parity는 주장하지 않는다. genuinely missing/malformed 관측값은 여전히 '정보 부족'이다.

`ui-market-initial.js`의 공통 action 표시/guard는 **실제 owned 스쿼드+초기 phase+alive career 권한+현재 FA**를 확인한 후 기존 mInterest/scoutPlayers/mEvaluateTarget/initialStartNegotiation을 호출한다. A/B/C 수동 우선순위, 관찰의 기존 비용, 내부 평가35% 조건·스쿼드/날짜·예산/로컬 조건, 기존 협상 입력·취소·계약을 유지한다. 조건을 무시하는 직접 계약/자동 동의/강제 스카우팅을 추가하지 않는다. 상세에서 행동하고 기존 협상 카드로 이동할 수 있다. 상대 private mastery/core/potential 단일 true 수치는 표시하지 않는다. 관측 core getter의 내부 true branch는 현재 FA guard로 차단하고 테스트에서 실제 player 객체 입력을 금지했다. 공개 챔피언은 기존 public report의 실제 출전/날짜만 표시하며 표본 없음과 낮은 능력을 구별한다; 성장 trail/private 챔피언 pool은 출력하지 않는다.

**read/save/context:** getter용 view는 scout 및 world recruitment/negotiations, 가격 cache만 별도로 복사하여 실제 DB에 보고서/시장 상태를 생성하지 않는다. `renderNegotiations(teamIds,db=DB)`는 read context를 받고 기존 기간/조건 정책을 그대로 소비한다; 초기시장만 stale DB/world/slot/target handler guard를 전달한다. 필터/페이지 밖 선택도 최대10명 ID로 유지하며 밖에 남은 수를 알린다. 스쿼드 변경·검색 초기화는 명시적 선택 초기화, 상세 닫기는 검색/페이지/정렬/선택·원래 스크롤/선수 focus 복귀다. 세계/load/slot/manager identity가 바뀌면 임시 탐색 문맥은 초기화하고 실제 보고서/평가/협상/계약은 기존 full/compact save에 보존한다. UI 필터는 새 영구 save schema가 아니다. 산하2군 감독의 배정 선수단/개막 권한은 기존 경로를 유지한다.

**한계·설계 tradeoff:** 지역 기본은 현재 source가 가진 출신 기준이다. 실제 활동지역 필터/언어 숙련·구단 업무언어·지원 지출은 별도 승인 미완료이며 국적으로 추정하지 않는다. 구식 '공용어 사용/해외 선수 페널티 없음' 고정 안내만 실제 화면에서 제거했다. 2–3인 비교/radar·표 열 선호 기억/전면 UI·시작화면 세 버튼/전체AnalysisRoom은 이 slice 완료가 아니다. 공개 경기 상세의 전체 patch/event/role source 확장, 역할별 강조와 비교는 다음 실제 수직 단위에서 기존 public rows/observed getter 권한으로 연결한다. 가격/스카우팅/AI 구매 정책과 엔진 결과/기존 역사를 바꾸지 않았다. 관측 최소값은 현재 종합 추정치 조건이며 확정 실력 보장이 아니다.

**수용·실패·출시:** [집중 수용/원자료](evidence/initial-recruitment-flow.json)와 [원래 실패·한계](evidence/initial-recruitment-diagnostics.json), 실행 `scripts/initial-recruitment-acceptance.mjs` 및 실제 Chromium 초기시장 흐름이 근거다. 초기 실패의 native structuredClone 없는 VM, >80 후보 fixture 생성/등록 오류와 missing 관측값 누락, 기존 DB 문자열 source assert, 산하2군 mock DOM/기존 개막 연결, 예산 경계 offer fixture, 기존 전체HTML 첫 이름 위치를 정렬로 가정한 fixture(실제 data-p 행 순서로 같은 관측 정렬 검증), 새 독립 VM fixture를 추가하고 기존74→75 count 연결을 놓친 실패 및 sandbox 로그는 보존한다. 기존 계약 기간 정책/assertion을 새 explicit read context 이름으로 연결하며 기간 선택 검증은 유지한다. 코드 예외를 가리기 위한 production fallback/예산·테스트 제한 확대는 없다. 최종 로컬 수용은 UI76/독립VM75/engine101, calendar20, static/build139모듈, isolated Node22 regression/smoke27357.1ms(기존35s)/2시즌186공식경기, 실제 Chromium1280/320 초기시장 관측순수성·상세Enter·실제A/B/C·평가/협상/취소·페이지/선택/scroll/focus·save/old-handler/fired/문서overflow·pageerror0로 통과했다. 실제 계약 합의/중복 재거절과 full/compact save는 VM에서 기존 실제 명령으로 수용했다. Browser는 동일 rebuildHTML 주입이며 productionHTTP가 아니다. 새 CI/main/게시 gates는 확인 전 대기다; 장기/device/TalkBack/100season QA와 외부 프로 calibration은 수행하지 않는다.

**정확한 다음:** coherent45–55분 **12.5.2 같은 영입 문맥의 임시2–3인 관측 비교→역할 관련 지표/보고서 날짜·공개 champion/date/patch/event/sample source→기존 평가/협상→목록 복귀**. 12.5.1의 actual observed model/guard/context를 재사용하고 missing axes·다른 role의 확정 순위·hidden true branch를 차단한다. 소스 gap이면 표시를 정직하게 제한하고 비교표/합법 행동·선택/reset/save를 substantial boundary로 수용한다. 새 source-backed 엔진 결함은 우선하되 완료된 cache/HP/round/objective/structure/macro와 unchanged blocked shop/XP 조사를 반복하지 않는다. 전체 승인 inventory는 그대로다.


### 12.5.2 초기 영입의 같은 문맥 관측 비교·원자료·행동 — 2026-10-05 (UTC 10-04)

**trigger·경계:** 기존12.5.1 비교/radar 미완료 문구는 당시 상태 원문이다. 이번45–55분 단위는 현재 FA 2–3명 임시 비교→관측 숫자·원자료 확인→기존 관심/관찰/평가/협상→목록 복귀를 실제 구현한다. 전체 player profile/실제 경기 통계 radar/AnalysisRoom/시작화면/언어 완료로 확장하지 않는다. 별도 dirty explorer와 그 오래된 문서는 그대로 보존하고 현재 main guide에 추가한다. 새 경기/경제/역할/언어 정책은 없다.

**소유·실제 UI:** `ui-initial-comparison.js`는 최대3명 유일 ID와 임시 문맥·공통 공개표본 patch/event/from 조건·read-only model·비교표/원자료/명령 bindings를 소유한다. 10명 일괄 관심 선택과 별도이며 페이지/필터 밖 비교도 유지한다. 현재 FA/초기단계/owned target/해임/DB·세계·슬롯 identity를 실제 명령 전에 다시 검증한다. 명단·상세 모두 같은 action owner를 쓰고 비교에는 같은 A/B/C·실제 paid scout·기존35% 내부 평가·수동 협상/취소를 연결한다. 닫기는 원래 opener focus/scroll로 복귀하며 세계/load/slot/대상 squad 변경은 문맥을 초기화한다. 새 save schema가 없고 실제 보고서/평가/협상은 기존 full/compact save를 유지한다. signed/retired/missing 후보는 상태만 설명하고 현재 private true 능력을 읽지 않는다.

**source·단위·불확실성:** 실제 `observedPlayerAttributes`/기존10 `observedPlayerCoreMetrics`의 1–99 관측값·능력/잠재력 범위·정보확신%·보고서 날짜/지난 연수·기존 요구 연봉을 숫자 표로 보여준다. 진짜 잠재력 단일값/비공개 연습·mastery·상대 true core는 없다. 기존 ROLE_KEY_ATTRS의 관측 능력만 강조하며 MID roaming처럼 실제 attrs 축이 없는 성향은 '능력축 없음'으로 정직하게 표시한다. 다른 역할·겹치는 범위는 확정 순위가 아니다. 표본 조건은 공개 출전 원자료에 적용하며 현재 관측 능력을 그 패치 당시 능력으로 재구성하지 않는다.

실제 `recordMeta`/`metaRowsFiltered`와 유효한 `observedMetaDate`·현재 날짜를 쓰며 미래/누락/한 선수 양쪽 중복·애매한 role/champ 행을 제외하고 제외 건수를 보여준다. side color는 실제 상보 BLUE/RED source에서만 읽고 결과도 실제 boolean/unknown을 구분한다. 원자료 버튼은 실제 details를 열어 summary에 focus를 주며 날짜/event/stage/patch/role/진영/champion/result를 보여준다. 현재 이 표본 저장은 **game ID를 보관하지 않는다**. 따라서 '원자료 건'이지 검증된 독립 경기 수/중복 제거된 professional sample이라고 주장하지 않는다. 원본 raw를 지우거나 임의 game ID·dedup 정책·license·확신을 만들지 않는다. future-only patch/event는 선택 옵션에도 새지 않는다. public source 링크/빈 상태는 실제 데이터만 소비한다.

**radar:** `ui-observed-radar.js`는 같은10 관측축을 0–99 눈금에 그린다. 새로운 정규화/능력 계수/실제 경기 지표가 아니다. 축이 하나라도 missing/nonfinite이면 해당 polygon을 그리지 않고 숫자 표에 정보 부족을 남기며 0으로 채우지 않는다. 실선/긴점선/짧은점선·이름 legend·SVG 설명/숫자 표로 색에만 의존하지 않는다. 면적을 승률/역할 순위로 쓰지 않는다. 동일 기준 관측 능력 radar의 실제 경계만 구현됐으며 전 도메인/실제 match metric radar는 남는다.

**재현된 관련 결함:** 기존 bindInitialRosterMarket은 guarded common handler 뒤에서 scout/evaluate/negotiate/drop/priority를 direct binding으로 덮어썼다. 실제 원본 DOM scout handler를 저장한 뒤 pack/unpack으로 DB를 바꾼 controlled callback은 current guard=false인데 새세계 cash38.4→38.3/report observation1을 만들었다. direct 중복 bindings를 없애 같은 guard를 소비하게 했고 같은 stale callback은 무변경이다. 자연 유저 발생 빈도 또는 새 permission 정책이라고 주장하지 않는다. 정상 현재 버튼의 실제 관찰 비용/관측 작성은 그대로 통과한다. 기존 detail의 nonempty 공개 챔피언 경로가 없는 `cname`을 호출해 ReferenceError가 났다. 실제 established `championLabel(view,id)`로 상세/비교를 연결한다. 원본 함수/로그를 보존하며 오류를 감추는 fallback을 추가하지 않는다.

**수용·실패 보호:** 실행 `scripts/initial-comparison-acceptance.mjs`, [집중 원자료](evidence/initial-candidate-comparison.json), [실패/진단](evidence/initial-candidate-comparison-diagnostics.json)이 actual sources/authority/read purity/full-lite boundaries를 소유한다. max3/unique/cross-role/missing/retired-signed/fired-foreign/stale/context reset·true-core trap, 실제 fictional simulateSeries→recordMeta/공개 원자료·공통 조건·future/ambiguous 제외·역사 source 보존, 현재 paid scouting/평가/협상과 과거handler 무변경을 검증한다. final 로컬 UI77수용/76독립VM·101engine, static14 tests/build141모듈, isolated Node22 regression/smoke27745ms(기존35초)/두시즌186공식경기 통과. 실제Chromium1280/320 초기 영입 3인 비교 Enter/숫자·radar·source details/filters/역할·기존 평가/협상/취소/scroll-focus/save-newDB-oldhandler/fired/no document overflow-pageerror 통과. 실제 별도 Bo3는2–0의 두 경기이고 public source가 있음을 확인했다. Browser는 동일 rebuiltHTML injection이며 productionHTTP/최종deviceQA/pro calibration이 아니다. 정확headCI/main/게시 gates는 별도다.

처음 actual series 반환을 .games로 가정한 fixture 실패, 실제 cname ReferenceError, 공통 action을 다른 파일에 넣어 actual browser 버튼이 없어 timeout한 실패와 default Chromium socket/child-process sandbox 실패를 보존한다. 원본 budget8066/8026/8005→최종7984는 코드/중복 문구 정리로 새 module8000 안에 맞췄고 기존 budget/assertion/instrumentation/production fallback을 바꾸지 않는다. 기존 runner의 새 module dependencies만 연결한다. 최초 Python 편집 문법 오류는 mutation 전에 발생했다. intermediate browser 성공/원본 실패/final-release captures는 서로 다른 경로이며 현재 source hash와 구분한다. #180 과거 성공 캡처 덮어쓰기 한계는 계속 보존한다. /tmp/initial-comparison-*가 있으면 원본 그대로 보호하며 missing originals를 재생성한 것처럼 쓰지 않는다. 최종100season/device/mobile/TalkBack QA는 보류다.

**정확한 다음:** coherent45–55분 **12.5.3 초기 영입 실제 스쿼드·등록자격·연봉 전후 미리보기→같은 수동 협상/계약 결과**. 실제 initialSignCheck/initialSquadLimits/initialSalaryBudget/payroll/teamNonLocalCount/현재 로컬 자격·역할 coverage·실제 조건부 offer 소비를 먼저 읽고, current owned target/save context에서 후보 영입 전후 actual projected squad/count/nonlocal/payroll/budget와 missing 조건을 연결한다. 임의 계약 가격·재정 정책·언어 상태를 만들거나 확정 계약인 것처럼 보이지 않는다. 현재 진행중/취소/낡은 예산·signed/foreign/fired/duplicate/actual agreement/rollback/full-compact/UI 복귀를 수용한다. 실제 engine 결함이 새로 재현되면 engine 우선이며 완료된 reviews/변경 없는 blocked shop8.2.2·waves8.5.1 획득은 반복하지 않는다. 비교의 general profile/실제 match metric radar, startup3버튼/전면UI/AnalysisRoom/언어구단재정/all13서사/office-countrytier2-broadcast/complete38/eight-audit/all-domain scope는 계속 미완료다.


## 12.5.3 초기 영입의 조건부 스쿼드·연봉 전후와 실제 수동 계약 — 2026-10-05

**구현 경계:** `ui-initial-offer-preview.js`는 현재 권한 있는 FA/owned target만 받아 전체 JSON private copy에 기존 `playerActionTerms`/`negotiationBudgetError`/`previewWorldAction`/`applyWorldAction`을 사용한다. 기존 가격·기간·초기 인원·통합 로스터·로컬 판정·연봉 ceiling·계약금 현금 검사를 재사용한다. 실제 world/history/player/finance는 열람으로 바뀌지 않는다. 기존 초기 계약 writer와 AI 경로는 변경하지 않고 제안은 원래 수동 협상/수락/취소 명령으로만 체결된다. 사후 source를 재계산하거나 세계 저장 schema를 추가하지 않는다.

기존 현재 `payroll`/`initialSalaryBudget`/`teamNonLocalCount`/`organizationRoster`/`initialOrganizationErrors`/`spendingTaxForPayroll`로 현재/합의 성공 시 인원·비로컬·조직 인원·연간 연봉·예산·여유·현금·현재 가상 SFR 규칙 연간 부담금 추정을 표시한다. 금액 단위는 기존 억이며 실제 Riot 정책/정확한 미래 현금 예측이 아니다. 계약금은 실제 writer의 즉시 현금 차감; 조건부 성과/우승/국제전 보너스는 현재 현금에서 차감하지 않는다. 진행 중 다른 협상은 확정 지급의무로 합산하지 않는다. 기존 initialPayrollBudget과 동적 salaryBudget의 큰 값이 예산이며 이를 임의로 현금과 같게 만들지 않는다.

전문 역할별 인원은 배치 참고이고 등록에 각 역할 인원을 강제하는 규칙이 아니다. 요구 연봉만 보는 preview는 기존 writer 내부 자동 약속 역할을 표시하지 않고, 실제 작성/선수 요구 조건에 있는 약속 역할만 보여준다. 약속 역할/실제 depth chart와 구분한다. 출신/국적/활동/언어와 로컬 판정을 분리한다. 합의 후 남은 초기 조직 조건을 보여주되 공식 대회 등록/출전 자격·선수 수락을 보장하지 않는다. malformed/없는 현금·금액·권한과 현재 규칙상 거절은 이유를 보여주고 실제 world는 inert다.

**실제 연결:** 목록/상세/같은 문맥 비교의 공통 버튼 → 요구 연봉 기준 preview, 협상 form → 열 때 작성한 제안, 현재 요구/역제안 → 별도 preview. 협상 preview 버튼은 선택한 대상 스쿼드 카드에만 표시하며 다른 소유 스쿼드는 대상 선택 후 검토한다. form의 연봉/기간/계약금/보너스/buyout/option/promisedRole 원문 입력은 ephemeral snapshot으로 재렌더/닫기 후 복원한다. 협상 round/attempt 변경·취소·합의/대상 변경과 DB/world/slot/manager/fired 변경은 기존 guard와 context reset으로 stale 행동을 막는다. 같은 계약의 다른 조건을 자동으로 제출하거나 수락하지 않는다. 닫기 후 실제 버튼 focus/scroll로 돌아온다.

**수용:** `scripts/initial-offer-preview-acceptance.mjs`와 [실제 전후 근거](evidence/initial-offer-impact.json), [진단 원문](evidence/initial-offer-diagnostics.json). 현재/프로젝션과 실제 기존 writer 체결의 인원·연봉·현금·예산·비로컬·조직 errors 일치, 실제 interest/evaluate/negotiate/submit agreement와 duplicate/cancel/save, asking와 금액/보너스·비로컬 한도·최대 인원·현재 예산 변경·foreign/fired/signed·소유2군 권한/열람 purity를 검증한다. 실제 Chromium1280/320에서 Enter/preview/원래 form 입력 복원/역제안과 구분/닫기 focus/실제 submit 체결/전후 일치/save reset/fired/no overflow-pageerror를 확인했다. Browser는 동일 rebuiltHTML injection으로 productionHTTP/최종deviceQA/프로 보정이 아니다. 최종 로컬 UI78수용/77독립VM·101engine, calendar20, static14/build142모듈, Node22 regression/smoke29432.9ms(기존35초)/두시즌186공식경기 통과. 마지막 추가 실제 예산변경 rejection은 별도 focused log에서 같은 world 무변경 assertion으로 통과했다. 회귀 체인의 calendar 중첩은 아래 진단에 명시하며 isolated speed evidence가 아니다. 새 module budget7000과 기존 모든 limits/assertions/instrumentation을 유지한다. 전체UI/언어/AnalysisRoom/실제match metric radar·startup 및 다른 승인 domain 완료가 아니다.

default static ci-run 자식 프로세스 검사 실패와 Chromium socket sandbox 실패 원문을 보호하며 동일 checks는 explicit permission auto-review로 통과했다. guessed `scripts/ui-acceptance.mjs`/`ui-shell.js`/`styles.css`/`transaction-players.js` 경로 부재는 source navigation 진단이며 test success가 아니다. 기존 별도 dirty explorer와 원본 sources/docs는 보호했다. 처음 privacy fixture가 실제 계약 문장이 아닌 설명의 주전 배치 단어까지 검색한 실패는 원문을 보존하고 실제 contract paragraph assertion으로 범위를 교정했다. calendar 종료 확인 전에 regression을 시작한 중첩은 원문 로그로 구분하고 isolated 성능 수치라고 표시하지 않는다. #180 성공 screenshot 덮어쓰기 한계는 계속 보존하며 이번 원본/최종 캡처 이름은 서로 다르다. /tmp/initial-offer-*가 실제 존재하면 유지하고 missing originals를 재생성했다고 주장하지 않는다.

**정확한 다음:** coherent45–55분 **12.3.1 실제 첫 화면의 새 시작/불러오기/설정→기존 커리어 선택·생성·취소/복귀**. 현재 `ui-state.js`는 전체 nav 논리 맵을 유지하지만 `shell.html`의 data-career=false CSS가 커리어 전 추가 탭을 이미 숨긴다. `seasonSetup`은 리그/국제/세계/팀 선택을 한 화면에 배치하고 theme select는 별도 header에 있다. 실제 세 작업 첫 화면과 새 시작 뒤 커리어 선택은 아직 이 경계에서 구현하지 않았다. app loadDB/switchSlot/새세계 저장/빈slot·기존history·실패/취소와 기존 manager picker부터 fresh inspect한다. 첫 화면은 세 작업만, 커리어 선택은 새 시작 다음 단계, settings와 save utility/상단 nav를 실제 handler로 연결하며 기존 저장을 임의로 초기화하지 않는다. 뒤로가기/기존slot load/error/keyboard/mobile layout/권한/실제 새커리어→초기영입/save를 수용한다. 새 source-backed engine 결함이 재현되면 engine 우선; 완료된 reviews·변경 없는 blocked shop8.2.2/waves8.5.1은 반복하지 않는다. 전체38/eight-audit/13서사/all-domain 승인 범위와 general/match radar·AnalysisRoom·언어/clubfinance/career/office-countrytier2-broadcast는 계속 남는다.


## 12.3.1 처음 화면·기존 커리어 선택·저장 보호와 복원 — 2026-10-05

**실제 연결:** `ui-startup.js`가 처음 화면의 한국어 새 시작/불러오기/설정 세 작업과 ephemeral page/부팅 오류를 소유한다. 저장된 커리어가 있어도 첫 화면은 세 작업이며, New Start 다음에만 기존 `seasonSetup`/`managerTeamPicker`의 팀 선택을 제공한다. 기존 full nav map과 data-career=false CSS는 이미 추가 탭을 숨겼다; 이번에는 startup 동안 nav/save utility/header theme을 숨기고, 커리어를 계속하면 상단 주요 nav·별도 save utility가 복귀한다. 설정은 실제 기존 auto/dark/light 색상 저장을 사용한다. 언어/가격/구단 정책을 새로 만들지 않는다. 팀 선택의 낡은 공용어/언어 장벽 없음 문구는 최신 승인에 맞춰 사실적인 개발 상태/로컬 구분으로 교체했고 언어 engine 자체는 미완료다.

새 시작은 기록/커리어 없는 현재 세계 또는 실제 확인한 다른 빈 슬롯에서만 진행한다. 슬롯 metadata 없음은 비어 있음의 근거가 아니며 표시도 그렇게 교정했다. 모든 슬롯이 사용 중/손상/읽기 실패면 기존 커리어를 임의 초기화하지 않는다. 실제 저장 원본·세계·history는 취소/거절 때 유지된다. 슬롯 선택은 기존 `switchSaveSlot`의 현재 저장→목표 복원→identity commit을 재사용한다. actual `startCareer`는 private full JSON copy에서 실행하고 기존 per-slot `persistWorldSnapshot` 성공 후에만 DB를 교체한다. 저장 실패는 현재 세계를 유지하고 이유를 보여준다. 실제 수동 초기 영입/기존 owned-reserve 규칙은 동일 writer다. 이미 성공한 저장을 실패 표시로 남기지 않는다. 다른 브라우저 탭 사이의 분산 잠금이나 외부 I/O 전체 transaction 인증을 구현한 것은 아니다.

부팅에서 손상/읽기 실패로 DB를 복원하지 못해도 세 작업과 다른 슬롯의 복원/새 시작에 접근할 수 있다. DB=null recovery는 저장할 outgoing world가 없으므로 원래 손상된 슬롯에 쓰지 않으며 다른 선택 슬롯을 실제 `loadDB`로 복원한 뒤 identity를 바꾼다. 확인한 진짜 빈 슬롯만 새 세계가 된다. 기존 직접파일/local fallback·valid IDB 경로는 유지한다. 읽지 못한 IDB를 absent로 간주하지 않는다. 구버전/JSON 백업 원본의 자동 삭제·재작성이나 새로운 migration/schema는 없다. 원본 raw 백업 탐색/더 깊은 슬롯 provenance UI는 여전히 별도 승인 작업이다.

**재현과 교정:** 원본 실제 `loadDB`에 controlled existing-backend read failure를 공급하면 새 world를 반환했다. 수정 후 새 world를 만들지 않고 복원 오류를 반환한다. 자연적으로 관측한 데이터 손실/발생 빈도 주장이 아니다. 원본 실제 `bindData`의 retained apply callback은 다른 DB identity 이후에도 JSON을 적용해 현재 DB를 바꿨다. 수정 후 DB/slot/render/전환 guard로 inert다. 실제 import 성공 후 controls를 새 identity로 재바인딩하며 startup load의 실패 이유도 status에 보인다. actual prior/current source와 raw 결과는 [근거](evidence/startup-career-flow.json), [실패·한계](evidence/startup-career-diagnostics.json)에 보존한다.

**수용:** `scripts/startup-flow-acceptance.mjs`는 세 버튼/새 시작 뒤 선택·취소 purity/설정, invalid 원본/unknown read 거절/failed write rollback/current manual initial career+actual saved state, duplicate/stale/full slots/진짜 빈 슬롯/이전 커리어 저장, stale utility, invalid cold boot→정상 슬롯 복원/빈 슬롯 New Start를 실행한다. actual Chromium1280/320에서 Enter/선택/취소·색상, 실제 초기영입·저장, occupied/invalid/empty slot, 실제 JSON 열기→재적용→현재 커리어 계속, stale picker/import, malformed active slot의 cold boot 복원과 actual 저장 실패·원본 유지, top nav/save utility/no overflow-pageerrors를 확인한다. 동일 rebuiltHTML injection과 controlled browser localStorage adapter로 실제 storage writers를 실행했으며 productionHTTP/최종deviceQA/프로 보정이 아니다. 최종 local UI79수용/78독립VM·101engine, calendar20, static14/build143모듈, isolated Node22 regression/smoke26808.2ms(기존35초 제한)·두시즌186공식경기 통과. 실제 별도 FirstSelection→수동20턴→공식Bo3 세 경기/pending-history/source/Analysis filters/keyboard/fired 경계도 확인했다. 최종 local/CI 결과는 확인한 raw evidence에 기록하며 module count는 완료 근거가 아니다.

**원본 실패 보존:** 초기 ui-state6500자 budget 실패를 보존하고 기존 주석/소유 연결을 정리해 같은 budget에 맞췄다. default static subprocess와 Chromium socket sandbox 실패는 동일 checks의 explicit permission review 결과와 구분한다. 첫 browser fixture는 함수 대입 표현을 Playwright가 반환 함수 호출로 평가해 null event TypeError였다. 두 번째 대용량 JSON `Locator.fill`은 target crashed; 같은 저장 roundtrip을 실제 JSON 열기 버튼으로 검사했다. 오류 원문/큰 raw 로그는 삭제하지 않는다. 원 guide의 contiguous substring assertion은 역사 annotation 삽입 때문에 실패했다. 모든 원래 줄의 순서 보존과 production source hashes equality를 별도 검사해 통과했으며 inventory 삭제가 아니다. 초기에 tail brace 경로가 option으로 해석된 진단과 존재하지 않는 guessed runner 경로도 source/test 진단이며 성공이 아니다. intermediate 성공 source/캡처를 마지막 source로 표시하지 않는다. `/tmp/startup-flow-*` 원본이 실제 존재하면 보존하고 없어진 원본을 재생성한 것처럼 쓰지 않는다. 모든 캡처는 서로 다른 경로다. #180 첫 성공 screenshot overwrite 한계와 #164–#189 전체 이전 원본/실패/게임 역사는 계속 보존하며 assertions/budgets/instrumentation/production fallback을 약화하지 않는다.

**정확한 다음 coherent45–55분:** **12.3.2 현재 소유 구단의 운영 브리핑→실제 일정/협상 행동→결과·저장**. 기존 `viewSeason`/`nextMine`/`nextDate`, 실제 negotiationStore/기한·상태, owned manager/fired/초기영입·preseason·season branches부터 fresh inspect한다. 현재 구단의 다가오는 실제 공식 경기와 처리 가능한 실제 협상 업무를 짧은 한 화면에 연결하고 기존 날짜 진행/수동 협상·취소/관련 상세로 이동한다. 없는 업무·마감·가격·예상 승리·상대 private 정보를 만들지 않는다. 사무국/등록/재정 브리핑은 전체 승인 상태로 유지하며 같은55분에 source/action 수용까지 못하면 정확한 substantial 경계/후속을 기록한다. 현재 ID·world/slot/fired stale·duplicate/실패·취소/return/focus/full-lite save/초기 phase 반례를 검증한다. source-backed engine defect가 실제 새로 재현되면 engine 우선이다. shop8.2.2/waves8.5.1의 변함없는 blocked 획득·완료된 audits는 반복하지 않는다. full UI/AnalysisRoom/general·match radar/language-clubfinance/career/all13서사/office-countrytier2-broadcast/complete38/eight-audit/all-domain과 최종100season/device/mobile/TalkBack QA 조건은 별도로 유지한다.


### 12.3.2 내 구단 운영 브리핑·공식 일정·수동 협상 — 2026-10-05

**범위와 소유:** `ui-club-briefing.js`가 현재 관리 구단의 pure read/model, ephemeral message·raw draft, 기존 overlay/수동 컨트롤/복귀를 소유한다. 실제 `viewSeason`/`bindSeason`에 연결한다. initial_roster/pick은 기존 화면이 그대로 담당하고 해임이면 브리핑·계약 작업을 노출하지 않는다. 모구단 감독의 소유 조직 계약 권한을 유지하되 reserve 감독에게 선수 계약 권한을 주지 않는다. club-stage 이적료 writer가 실제 managedTeam을 사용하므로 해당 단계는 현재 관리 구단의 협상만 연결한다. AI 위임 중 수동 제안을 새로 실행하지 않고 기존 운영 설정을 안내한다. 수동 운영 기본값을 바꾸지 않는다.

**실제 일정·행동:** 실제 world.seasons의 현재 이후 생성된 match 중 미완료·내 구단 소유 대진만 날짜/시간/ID 순서로 선택한다. 실제 대회·스테이지·Bo·양 구단/현지 시간·UTC 기준일을 표시한다. 완료 경기/없는 대진은 예측하지 않는다. 해당 일정 버튼은 기존 SSET.view/tab과 일정·결과 소비자로 이동하고 브리핑 복귀·focus를 제공한다. 하루/내 경기 진행은 기존 실제 버튼·playWorldDay·pendingOfficial/FirstSelection/수동 밴픽을 재사용한다. 기존 controls와 task lock·중복·pending draft 권한을 우회하지 않는다. 새로운 경기 기록/승자/전술·확률은 만들지 않았다.

**실제 협상·근거:** 현재 owned 조직의 실제 open negotiation ID/선수/구단/stage/round/createdDate를 보여준다. retired/missing/foreign/signed-FA/변경된 원소속·invalid kind/selector를 거른다. 개별 만료일은 현재 n에 없으므로 발명하지 않으며 actual contractWindow의 독점 종료/접촉일과 구분한다. 전체 private JSON 복사본의 단일 협상만 기존 renderNegotiations에 전달하므로 negotiationStore 등 lazy view writer는 live world를 만들지 않는다. 요구/역제안은 실제 현재 협상 조건이며 true core/잠재력/상대 private practice를 읽지 않는다. 실제 제안·수락·이적료·취소는 기존 writer를 사용하고 현재 budget/local/동의/등록 판단과 실제 오류를 그대로 반환한다. 같은 맥락의 raw 계약/fee fields는 닫기·재열람에서 복원하되 n/round/date/DB/world/slot/manager가 바뀌면 복원하지 않는다. 기존 overlay close/focus와 navKeepScroll을 재사용한다. 다른 dialog를 stale close로 닫지 않으며 실제 처리 후 메시지/저장/return을 연결한다. 추가 saved UI schema나 도메인 원본 복제는 없다.

**실제 새 연결 반례:** 새 팝업과 기존 시장 협상이 동시에 있을 때 기존 공통 전역 입력 조회는 팝업의0.1억 대신 배경0.8억을 읽었다. controlled actual Chromium 원본 log를 보존한다. 기존 main-only 호출의 기본 document는 유지하고 `bindNegotiationControls`/`negotiationTermsFromDom`/`initialNegotiationDraft`/`transferFeePlanFromDom`에 선택적 root를 연결해 실제 열린 팝업의 제안·fee·raw draft만 읽는다. 최종 actual1280/320에서는 배경0.6억과 별개로 팝업0.1억이 실제 lastOffer/동일 existing writer 결과에 전달된다. provisional 새 UI의 재현 결함이며 직전 출시나 자연 사용자 발생 빈도 결함으로 주장하지 않는다.

**수용·한계:** [실제 연결·최종 source hashes](evidence/club-operational-briefing.json)와 [원본 source·실패·raw logs](evidence/club-operational-briefing-diagnostics.json)를 보존한다. `scripts/club-briefing-acceptance.mjs`의 actual generated fixture/완료 제외/자료 없음/read purity/actual renewal/foreign/fired/date/load/slot/manager/AI/initial/pending/duplicate cancel/다른 dialog stale close/실제 합의·명령 전후·실제 fee input/save 검사가 통과했다. 실제 브라우저는 새 버튼 Enter·같은 문맥 raw draft·입력 root·합의/취소/changed cash rejection·save·stale callback·320px/no document overflow-pageerror와 별도 실제 브리핑 일정/진행→공식 FirstSelection/20턴/Bo3 세 경기/pending-history/source/Analysis/keyboard/fired를 검증한다. 동일 rebuiltHTML injection·controlled localStorage adapter이며 productionHTTP/최종deviceQA/프로 보정이 아니다. 전체 등록/재정/사무국 브리핑·UI/언어/AnalysisRoom 완료가 아니다. actor/가격/기간·게임엔진/AI/save format은 변경하지 않았으며 behavior-preserving optimization/전체 match parity라고 부르지 않는다.

**실패/원본 보존:** 최초 fixture가 engine money를 중복 선언한 SyntaxError와 없는 dateAdd를 호출한 실패, 새 owned briefing 의존성을 빠뜨린 기존 minimal async VM의 bindClubBriefing ReferenceError, scoped overlay mock에 querySelectorAll이 없던 실패를 원본 그대로 남겼다. 실제 module/source/real fixture 형태를 공급하고 동일 assertions/timeout을 유지했다. 기본 static child-process·Chromium socket sandbox 실패와 동일 검사의 explicit permission review 통과를 구분한다. 합의 후 whole DB diff는 실제 market 재렌더의 derived `_marketDemandCache` 한 항목뿐이었다. expected도 같은 existing getter를 호출해 전체 JSON equality assertion을 그대로 검사한다. 전체 pack roundtrip의 synthetic 최소 world는 actual 생성 writer에 있는 offers/marketLog를 빠뜨렸으며 raw diff를 남기고 같은 actual world 구조를 공급했다. 모든 browser Assert AST는 동일함을 확인했다. 자동 승인 검토는 계산 정리/재실행 묶음을 assertion 약화 위험으로 거절했다. 그 계산은 제거하지 않았고 읽기 전용 증거로 차이를 입증한 뒤 narrow retry가 승인됐다. 처음 line-level assertion 보존 비교는 대입과 assert가 같은 줄이라 실패했다; AST assertion 비교로 실제 동일 조건을 입증했다. 거절·실패 raw tool 진단과 원본 expected/actual JSON을 보존한다. 새로운 budgets/assertions/instrumentation/production fallback을 약화하지 않았다. unique captures만 사용하며 #180 첫 성공 screenshot overwrite 한계와 ALL #164–#190 원본/역사를 유지한다.

**정확한 다음45–55분 구현:** **12.3.3 내 구단의 실제 공식 등록·가용·출전 차단 원인→기존 roster/등록 수동 행동→실제 일정/결과·복귀·저장**. 실제 registration/managerControlsSquad/경기 roster eligibility/의료 replacement·소유 reserve/일정 source와 현재 UI actions부터 fresh inspect한다. 등록·계약·깊이 차트·의료 가용을 같은 개념으로 합치지 않고 actual writer/소비자 이유만 같은 브리핑에 연결한다. 없는 마감/비용/자동 선발/추가 벌점·새 출전 정책을 만들지 않는다. 현재 세계·slot·manager/fired/duplicate·실패·save·반례와 실제 official 소비자를 수용한다. 사무국·재정 업무/전체 UI/언어/all13서사/office-countrytier2-broadcast/complete38/eight-audit/all-domain은 계속 승인·미완료다. 신규 source-backed engine defect가 재현되면 최우선으로 구현한다. completed audit나 source-blocked shop8.2.2/waves8.5.1 획득은 반복하지 않는다. 최종100season/device/mobile/TalkBack QA는 기존 조건까지 보류한다.

최종 local focused/static14/build144, calendar20, isolated Node22 regression/smoke27892.5ms(기존35초)·두시즌186공식경기 통과. UI 전체 최종 rerun의80수용/79freshVM·101engine 결과는 raw log와 exact-head CI로 별도 확인한다. actual 최종 Chromium1280/320 브리핑/시장 공존 입력·기존 writer 전후 일치·합의/취소/changed cash rejection/save/stale/fired, 별도 브리핑 실제 진행→FirstSelection/20턴/Bo3 세 경기/pending-history·Analysis·source/keyboard/no document overflow-pageerror 통과. 모듈 수는 전체 완료 근거가 아니다.

최종 경계 재검사에서 다른 같은 종류의 협상 dialog로 바꾼 뒤 retained cancel callback이 원래 협상을 변경하는 controlled writer 반례를 재현했다. 원본 소스·실패를 별도 보존하고 kind 비교를 actual dialog identity 비교로 교정했다. 다른 동일 kind dialog 뒤의 이전 callback은 inert이며 기존 모든 assertions를 유지하고 focused/actual browser 조건을 추가했다. 자연 사용자 발생 빈도나 전체 callback rollback을 주장하지 않는다.

마지막 dialog identity 교정 후 전체 local UI80수용/79freshVM·101engine(111097.5ms), focused·static14/build144와 actual1280/320 재검사를 통과했다. 모든 기존24 browser Assert는 유지했고 actual same-kind stale callback assertion을 하나 추가했다. 현재 최종 hash·raw 로그는 위 근거 파일에 보존한다.


### 12.3.3 소유 구단의 공식 등록·가용·수동 선발·실제 경기 소비 — 2026-10-05

**범위·원본:** fresh main `5d15131e50101a5ac364845af8b3a97dc4ff4e87`, 현재 main README/DEVELOPMENT·전체 승인 inventory·규칙/결정/구조 및 registration/registration-match/lineup/medical/roster/실제 UI를 읽었다. 별도 dirty `feat/initial-recruitment-explorer` base9e2b085는 그대로 보존했고 열린27/28의 ui-season/package/manifest/check 충돌을 검토했다. 한 worker, 새 branch/PR, 원본 sources/logs/captures 보호. 환경 재시작 후에도 실제 main/열린PR/파일·로그 생존을 재확인했다.

**실제 연결:** 새 소유 presentation `ui-club-eligibility.js`가 full JSON 복사본에서 actual `officialSeasonRoster`/`officialMatchView`/`officialPlayerCanRepresent`/medicalSummary/medicalOut/기존 명령 preview를 사용한다. employment·훈련 소속, 현재 구단 공식 등록, 다음 실제 생성 경기의 국내 명단/국제 제출 엔트리, 저장된 수동 선발, 조회 시점 경기뷰의 기존 가용 보정, 의료 결장은 서로 구분한다. 경기뷰 보정을 감독이 저장한 선발로 가장하거나 미래 출전을 보장하지 않는다. 없는 일정/선수·구형 등록 미기록은 정직하게 표시한다. 현재 공식 등록/저장 선발의 차단 이유는 기존 writer errors다. 새 기한·자동 선발·전문 역할 자격·비용·계수·언어 상태/상대 비공개 능력·연습을 만들지 않는다.

현재 구단과 감독이 실제 관리하는 소유2군 버튼→순수 복사본의 기존 officialRegistrationPanel→동일 `roster.register`/`roster.official-lineup` 명령→기존 history/명단·선발/결과 메시지·save/navKeepScroll/focus에 연결했다. 공통 panel의 선택적 db, 컨트롤의 선택적 allowed/root/after를 사용하되 기존 default callers를 유지한다. 팝업 입력만 읽어 배경 role select와 섞지 않는다. 같은 DB/world/slot/manager/date/phase/등록 snapshot/dialog identity에서만 raw 미확정 입력을 복원한다. 확인 후에도 context를 재검사한다. fired/foreign/AI 위임/initial/다른 같은kind dialog/load/slot/가용 변화/중복 retained callbacks는 inert. world reset은 새 ephemeral draft를 지우며 saved UI schema가 아니다. 등록 기간 밖 선발 변경은 기존 규칙대로 가능하고 진행 중 세트는 actual command가 거절한다. 의료 대체 계약/임시콜업/만료와 broader office·재정·언어·전체 UI는 이 경계로 완료하지 않는다.

**수용·실제 결과:** controlled 실제 등록 fixture의 훈련 소속을 2군으로 옮겨도 등록 자격이 유지되고, 새로 고용됐지만 미등록인 선수는 공식전에 들어오지 않는다. 의료 out 상태는 등록과 별개로 출전 불가다. 국제 제출 엔트리는 현재 국내 명단으로 재구성하지 않는다. 실제 팝업 수동 TOP 지정 `NA_68`→같은 명령의 exact whole-world 예상 결과→정상 공식 시뮬레이션의 TOP `NA_68`을 확인했다. 실제 등록 제출도 동일 명령의 전후 명단/whole JSON과 일치한다. invalid plan/중복 선발/confirm 취소/confirm 중 날짜 변경/late writer exception rollback/foreign·owned reserve·fired·slot·load·medical change/pending/legacy/read purity/full-compact save를 검사했다. 새 거래 ID/AI 정책/의료 가용 판정·보상/예산/가격은 추가하지 않는다.

Local UI81수용/80freshVM·101engine, calendar20, static14/build145, isolated Node22 regression/smoke27762.2ms(기존35초)·두시즌186official games를 확인했다. 마지막 focused 기록은 실제 before-after/행/ID와 source hashes를 보존한다. 실제 Chromium1280/320 Enter/팝업 입력과 배경 controls 공존/등록·선발 적용/owned reserve/raw draft·close focus·scroll/save/world reset/stale same-kind·load·fired·duplicate/no document overflow·pageerror 통과. 별도 실제 등록 fixture에서 브리핑 진행→FirstSelection/수동20턴→공식Bo3세경기의 publicRecord 모든 세트에 수동 지정 선수 포함, 실제 넥서스·이벤트 source/Analysis 필터/pending·history 저장을 확인했다. 동일 rebuiltHTML injection·controlled storage이며 productionHTTP/finaldeviceQA/pro calibration이 아니다. 최적화 또는 전 경기 behavior parity 주장이 아니다.

**증거·실패 보존:** [집중 수용](../scripts/club-eligibility-acceptance.mjs), [실제 명단·선발·공식 소비](evidence/club-registration-briefing.json), [원본 sources/logs/진단](evidence/club-registration-briefing-diagnostics.json). ALL `/tmp/registration-briefing-*` 원본이 실제 있으면 유지하며 missing originals를 재생성한 것으로 쓰지 않는다. 첫 fixture가 없는 newSeason.key를 가정해 저장 후 domestic season을 잃은 오류→실제 instance key/comp, default 자식프로세스/Chromium socket sandbox→같은 checks explicit review, 함수 대입식을 Playwright가 실행해 버튼 전에 팝업이 닫힌 fixture→block 대입(원래24 Assert AST 유지), 추가 official fixture의 res.lines 부재→실제 publicRecord.sides.players 모든 세트에서 동일 선수 ID 검사 원문을 보존했다. tool unavailable 환경 진단과 guessed absent path도 test success로 쓰지 않는다. 기존 UI budgets/assertions/instrumentation/production fallback은 그대로이며 ui-state6496/6500·ui-registration5835/6500, 새 소유 presentation6364/7500이다. 이 숫자는 수용/완료 증거를 대신하지 않는다. #180 최초 성공 캡처 bytes overwrite 한계는 이전 기록에 남기며 이번 모든 성공/재검사 캡처 경로는 고유다. 생산 season.js의 실제 key를 controlled fixture에 공급하고 final4/officialfinal3로 재검사했으며 이전 성공 원본은 intermediate로 그대로 유지한다. 원래38 inventory와 ALL #164–191 역사·실패/진단을 삭제하지 않았다.

**정확한 다음 45–55분 구현:** **12.3.4 현재 소유 구단의 실제 현금·확정 의무·예상 결산 구분→기존 재정 상세와 실제 현재 스폰서 제안/수동 선택→기존 재정 소비·결과·복귀·저장**. fresh inspect ui-manager.finance UI/financeForecast/financePrepaidSettlement/financeReleaseObligations/transfer payment records, sponsorBlock/mSponsor/actual offer·기간·기존 소비자·actor guards 먼저. 순수 복사본 읽기, 현재 cash와 이미 지급된 금액/미지급 확정 채무/조건부·예상 income을 구분하고 실제 제안만 기존 writer로 연결한다. 새 가격/수수료/미래 현금 보장/언어 지출 정책/Riot SFR 정책을 만들지 않는다. parent·reserve 권한, fired/manual/stale/duplicate/expired offer/rejection/rollback/save/context/source 수용. 새로 실제 재현한 source-backed engine defect가 있으면 최우선이나 완료 audits/blocked shop8.2.2·XP8.5.1 획득을 반복하지 않는다. broader medical replacement·office·언어/전체 UI/AnalysisRoom/radar/all13서사/all-domain COMPLETE 승인은 계속 미완료 상태로 유지한다.

### 12.3.4 현재 현금·의무·예측과 실제 후원·결산 소비 — 2026-10-05

`ui-club-finance.js`는 현재 소유 구단/소유2군의 private full JSON read에서 기존 forecast/prepaid/release/transfer exposure/payroll을 읽어 현금·미지급 방출 보상·확정 이적/의무구매 예약액·미달성 추가금·현금에 이미 반영된 항목·연간 연봉·조건부 예상 결산을 구분한다. 기존 financePanel/transferPaymentsPanel의 optional db는 default DB caller를 유지하고 clone 조회에 사용한다. 현재 cash에 prepaid를 다시 차감하지 않으며 모든 금액은 기존 가상 억 단위다. 임의 가격·예산·언어지출/Riot정책·미래현금보장 없음.

실제 현재 후원 계약/저장된 제안→기존 mSponsor를 복사본에 적용한 선택 가정의 연간 수입·예상결산 전후→동일 수동 writer→메시지/save/복귀focus로 연결한다. 계약 때 현재 현금은 늘지 않고 실제 국내 공식 승수가 상업수입을 소비하며 연간 결산이 현금/history를 작성한다. 기본/승수/목표 수당·기간은 기존 proposal terms 그대로다. sponsorExpectedValue의 기존 예상은 수당 보장이나 현재 지급금으로 표시하지 않는다. 제안의 발행 연도·구단/개별만료 기록이 없는 한계는 source 설명으로 남기고 새 expiry 정책을 만들지 않는다. 이 metadata 연결은 기존11·12 승인 보강의 남은 source 조건이며 새 기능 수가 아니다.

원본 실제 bindClubOfficeControls 콜백은 pack/unpack 뒤 새 DB에 fixed sponsor 계약을 썼다(통제 반례, 자연 빈도 아님). 공통 bindSponsorControls가 현재 DB/world/slot/manager/render/view/date/phase/manual/offer·finance snapshot/actual dialog identity를 검사하여 시장·브리핑의 같은 stale 콜백을 inert로 만든다. 실제 현재 행동은 기존 writer와 whole JSON 일치한다. parent 감독은 owned reserve 재정을 읽되 reserve 감독에게 parent 금융 권한을 주지 않는다. foreign/fired/AI/initial/closed club/새dialog/load/slot/year/date/offer/cash/manager/duplicate를 검증한다. 새 saved UI schema·강제 확인·자동 후원/가격정책·엔진 rewrite 없음. full callback exception rollback/분산탭/storage failure guarantee는 구현하지 않았다.

수용: 순수 model/popup/선택 가정·actual writer whole-world equality·cash 무즉시 지급·현재 금융 소비·원본 stale source/actual market DOM 재현, 두 실제 가상 구단의 organized official Bo1·넥서스 종료·실제 승수별 후원 수입·기존 연간 결산/history, 계약 유지/만료제안 거절·owned reserve/authority·full/compact finance continuity·확정 mirrored invoice source 통과. UI82acceptances/81freshVM/101engine·calendar20·static14/build146, Node22 regression/smoke32830.5ms(unchanged35초)·두시즌186공식 경기 통과. regression은 UI와 짧게 중첩했으므로 isolated speed evidence/최적화로 부르지 않는다. 최종 source/fixture는 exact-head CI에서 다시 검증한다. 실제 Chromium1280/320 Enter/순수조회/후원 선택·기존 writer 전체상태/현재cash/시장 stale callback·same-kind·save/load/fired/복귀focus/no document overflow-pageerror 통과. 동일 rebuiltHTML injection/controlledlocalStorage이며 productionHTTP/finaldeviceQA/프로 보정 아니다.

[실행 수용](../scripts/club-finance-acceptance.mjs), [실제 소스·소비 증거](evidence/club-finance-briefing.json), [원본 source·실패·진단](evidence/club-finance-briefing-diagnostics.json) 및 실제 존재하는 ALL `/tmp/club-finance-*` 원본을 보존한다. 초기 잘못된 함수명/연산순서/year·season fields/publicRecord shape/minimal VM dependency/literal DB assertion/incomplete invoice save refusal/default childprocess/socket sandbox 실패 원문과 교정 근거를 유지한다. 실제 complete invoice writer로 fixture를 공급하고 validator/assertions/budgets/instrumentation/fallback은 약화하지 않았다. 원본 first와 final2/final3 캡처는 경로를 재사용하지 않는다. 역사#180 최초 성공 screenshot bytes overwrite 한계는 계속 기록한다. 전체 UI·독립 목적지·사무국·언어·AnalysisRoom·레이더·모든 승인 범위 완료가 아니다.

**정확한 다음45–55분 구현: 12.3.5 현재 소유 구단의 실제 스태프 고용·공식 현장 등록·공석 구분→기존 관측/면접·수동 계약/등록→실제 준비·현장 소비·결과·복귀·저장.** Fresh inspect staffProfile/teamStaffMembers/competitionStaffRegistration/staffOnsite/직무·실제 effect consumer, ui-market-staff staffEmploymentCard/bindClubOfficeControls, shared staff command·authority·예산·기간·보상부터. 직무별 실제 현행 고용/현장/관측을 분리하고 없는 vacancy 과제·업무량/가격·벌점·언어상태/새효과를 만들지 않는다. 조회의 lazy report/facility getter는 private copy, actual interview/hire/renew/release/registration은 기존 writer와 최신 권한/금액/기간으로 연결한다. parent/reserve·foreign/fired/manual/stale/root/confirm cancellation·rejection/rollback/full-lite·현장 effect source/반례를 수용한다. 큰 boundary가55분을 넘으면 actual observed staff→manual contract→실제 consumer 경계를 완결하고 continuation을 기록한다. 새 source-backed engine defect 우선, completed engine audits/unchanged blocked shop8.2.2·XP8.5.1 획득 반복 금지. COMPLETE38/eightaudit/13서사/all-domain, full UI/목적별topnav/언어·clubfinance/career/office-countrytier2-broadcast, final100season/device/mobile/TalkBack 조건은 별도로 남는다.


### 12.3.5 관측 직원·고용·공식 현장과 실제 소비 — 2026-10-05

`ui-club-staff.js`는 current owned/ownedreserve private full JSON read와 임시 직무/페이지/raw inputs/문맥을 소유한다. 고용 상한은 실제 coach9/analyst4/scout6 규칙이며 남은 자리를 의무 공석으로 만들지 않는다. 자기 고용 지원/훈련·회복 전체 고용과 공식 draft/analysis/scouting 현장 명단을 분리한다. 실제 공개된 competitionStaffPolicy의 max/lockAt만 표시하며 없는 대회·마감·업무·언어 상태를 만들지 않는다. 관측 시장 카드의 범위/현재 면접 날짜/기존 요구 연봉·기간/경력은 기존 getter를 private clone에서 읽는다. 상대 실제 능력이나 비공개 연습은 읽지 않는다.

`ui-staff-controls.js`는 기존 시장과 팝업의 scoped root를 공유하며 실제 staff.interview/sign/renew/release previewWorldAction→confirm→current guard 재검사→commitWorldAction을 사용한다. current DB/world/slot/manager/render/VIEW/actual dialog/date/year/staff/finance/phase/manual/fired/active를 검사한다. 거절한 raw 조건도 같은 문맥의 재개에 유지한다. 계약은 현재 관리 구단만 가능하며 parent의 소유 reserve 조회·기존 공식 등록 권한이 계약 대행을 만들지 않는다. 기존 명령의 현재 돈/교체 동의/기간/보상/거절/rollback이 최종 권한이다. 계약 총액은 일시 선납으로 표시하지 않는다. 기존 registration panel/writer는 현장 수동 선택·현재 창구를 소비하고 departed staff history는 남긴다. 저장 형식·새 효과 계수/가격/자동 선발은 없다.

원본 실제 market interview DOM callback after pack/unpack는 새 DB report와 1 save를 작성했다. controlled source counterexample와 원본 source/log는 [진단](evidence/club-staff-briefing-diagnostics.json)에 보존한다. 새 shared guard의 동일 stale callback은 inert다. 자연 사용자 빈도/전체 callback rollback/분산 탭 보장은 주장하지 않는다. 실제 브라우저 filter 후 close focus 오류도 재현해 원래 브리핑 버튼으로 복원했다.

[focused 수용](../scripts/club-staff-acceptance.mjs)과 [증거](evidence/club-staff-briefing.json)는 pure read/면접/7년 고용/현재 만료 재계약/해지·취소/음수 연봉 거절/duplicate/stale/confirm date change/parentreserve·foreign·fired·AI·initial/실제 whole-world 기존 writer equality/full-lite history/late rollback을 연결한다. 실제 published max1 현장 선택은 officialMatchView의 strategy 1명/미등록 분석 제외와 actual domestic Bo1 nexus CR37:32/staffService/career series1에 이어졌다. 강제 결과·프로 보정이 아니다.

로컬 UI83수용/82freshVM/101engine, calendar20, static14/build148, Node22 regression/smoke28294ms(기존35s)·두시즌186공식 경기 통과. Chromium1280/320 actual Enter/관측·raw7년/배경3년 vs 팝업7년·whole writer/현장 등록/official consumer/save/stale/fired/same-kind/scroll·focus/no overflow-pageerror 통과. 동일 rebuiltHTML injection·controlled localStorage이며 productionHTTP/최종 기기 QA가 아니다. 재계약·해지/닫힌 창구·퇴사 기록/거절 raw 복귀를 확장한 최종 focused도 통과했다. 새 exact-head CI는 별도로 확인한다. module 수는 전체 완료 근거가 아니다.

원본 실패/fixture의 실제 source shape/VM globals/페이지·만료 조건/selector·coach tab/default sandbox/current focus와 수정은 진단 raw에 보존한다. 기존 budgets/assertions/instrumentation/fallback/GC/billing을 약화하지 않았다. 별도 dirty analysis explorer/base9e2b085는 unchanged, 열린27/28은 충돌 검토만 하고 merge하지 않았다.

다음 **12.3.6 현재 소유 의료 가용·수동 휴식/재활 계획→기존 실제 일일·훈련/스크림·공식 소비→결과·복귀·저장**. fresh inspect medicalPlanFor/medicalScrimRest/medicalOut/medicalDailyTick/medicalRosterStatus와 ui-roster 실제 writer/ownedreserve/manual 권한부터. 현재 가용·추정 복귀·고용/등록/선발을 분리, 없는 마감/치료비/새효과/미래복귀 보장을 만들지 않는다. system-only medicalEmergencyFASigning은 새 수동 권한으로 바꾸지 않는다. source-backed engine defect는 최우선이며 완료 audit/변함없는 shop8.2.2·XP8.5.1 source gap 획득을 반복하지 않는다. 전체 UI/직원·의료/AnalysisRoom/언어/13서사/38/eight-audit/all-domain 승인 미완료와 최종100season/device/mobile/TalkBack 유예는 유지한다.


### 12.3.6 소유 구단 의료 가용·수동 회복 계획·저장 이력→실제 소비·결과·복귀·저장 — 2026-10-05

**경계/구현:** `ui-club-medical.js`가 current owned/owned reserve의 private full JSON 복사본에서 `medicalSummary`/`medicalOut`/`medicalPlanFor`/`medicalScrimRest`와 실제 현재 컨디션·피로·마지막 일일 계획·저장된 의료 사건을 읽는다. 없는 값은 기록 없음, 없는 과거 사건은 없음으로 표시한다. 최대8건 저장 순서 이력과 전체 보존 건수를 표시하며 당시 예상/결장과 현재 상태를 구분한다. 고용·계약/등록·저장 선발·현재 의료 가용은 별개이며 복귀·미래 출전 보장/치료비/언어 정책/새 계수·마감을 만들지 않는다. 새 `medicalRosterStatus`를 발명하지 않고 실제 존재하는 위 consumer를 사용한다.

브리핑→현재 선수별 계획 초안→확인/취소→기존 단일 `p.medicalPlan` writer→기존 saveDB/navKeepScroll/메시지·원래 버튼 focus로 연결한다. 로스터의 기존 의료 select도 같은 현재-context binding을 사용한다. DB/world/slot/manager ID·객체/render/VIEW/실제 dialog identity/date/year/phase/현재 소유 roster·선수 의료·훈련 snapshot/manual/active/pending를 검사하고 확인 뒤 재검사한다. 없는 선수/외국 구단/은퇴·fired/AI/initial/invalid/duplicate/slot switching/load/같은kind 새dialog/의료 변경/다른 감독 객체는 변경하지 않는다. 부모의 실제 소유2군 계획 권한과 2군 감독의 모구단 불허는 기존 `managerControlsSquad`다. 계획 초안은 취소·닫기 때 적용하지 않으며 새 저장 UI schema를 만들지 않는다. 공식 명단이나 자동 의료 대체 계약을 수동으로 만들지 않는다.

**실제 원본 반례:** 원래 로스터 retained 의료 DOM callback을 실제 pack/unpack 뒤 호출하면 새 DB의 계획이 rest로 바뀌고 save1이 발생했다. 원본 ui-roster 전체 source·실제 binding/probe/log를 [원본 진단](evidence/club-medical-briefing-diagnostics.json)에 보존한다. 새 shared guard에서 같은 stale callback은 inert이며 현재 로스터와 팝업의 실제 적용은 성공한다. controlled source 반례이며 자연 사용자 발생 빈도나 전체 callback rollback·분산탭 보장을 주장하지 않는다. 거절·취소·문맥 변경은 live state/history를 쓰지 않는다. 기존 비동기 저장 실패는 기존 SAVEFAIL/JSON 백업 경로이며 모든 I/O 실패 후 의료 state rollback을 새로 보장하지 않는다.

**수용/실제 소비:** [실행 검사](../scripts/club-medical-acceptance.mjs)·[수용 source/hashes](evidence/club-medical-briefing.json)는 pure view/actual current writer whole JSON/모든5 plan/rehab→기존 회복/일일 부하12에서 rest8.76·normal10.4/실제 훈련 제외/5인 스크림 가능·제외/휴식 자체는 공식 결장 아님/medicalOut 공식 선발 차단/invalid·cancel·duplicate·confirm date change·same manager object·owned reserve/foreign/fired/AI/initial/changed medical/load/slot/history/full-lite를 검증한다. 실제 가상 domestic Bo1 VXG34:38 넥서스 종료·actual publicRecord tuple IDs·의료 결장 제외·저장 연속이 통과했다. 101engine 모든 파일 bytes는 base39847과 동일하다. 최종 UI84수용/83freshVM·101engine, calendar20, static14/build149, Node22 regression/smoke27286.1ms(기존35초)·두시즌186officialgames 통과. UI/의료 core 병렬은 속도 근거가 아니며 regression은 이들이 종료된 뒤 실행했다.

Chromium1280/320에서 실제 Enter/공통 roster·popup scoped input/확인·취소·원문 DB 동등/저장/중복·same-kind stale·owned reserve·AI/fired/복귀 focus/no document overflow·pageerror가 통과했다. 별도 실제 의료 사건→수동 rehab→일일 휴식 소비→기존 수동 TOP 공식 선발→FirstSelection/20턴/Bo3세경기·의료 결장 tuple ID 제외/넥서스48:56·20:59·35:05/pending-history·public source·Analysis 필터·키보드/save가 통과했다. 동일 rebuiltHTML injection·controlledlocalStorage이며 production HTTP/최종device·TalkBack/pro calibration이 아니다.

**실패·진단 보호:** 최초 공식 등록 roster에서 의료 결장 ID 제거를 기대한 검사, 같은 연도 initializer가 새 고용을 다시 등록한다는 가정, 훈련 이미 소모한 copy의 스크림 비교, bestStartingLineup이 4명을 반환한다는 가정, 새 dependency 없는 최소 VM, crafted foreign select의 callback 부재, 82 고정 fresh VM 수, 실제 archive tuple 대신 p.id를 검사한 중간 pass, 이미 active 의료 사건에 새 사건을 쓴 history fixture를 각각 실제 source 조건으로 교정했다. 원본 실패·중간 로그는 모두 별도 유지한다. 실제 현재 의료 사건은 덮어쓰지 않고 건강한 복사본에 기존 사건 writer를 사용한다. default childprocess/socket sandbox 실패→같은 check explicit review 통과. 09:31 로컬 조회 cell71 지연 bounded 종료와 exec-server transport disconnected/상태running의 불일치, GitHub source raw content를 JSON으로 parse한 실패도 보존하며 연결 복구 뒤 actualtree/main/sourcehash/tmp를 다시 확인했다. 대기는 구현으로 세지 않는다.

첫 browser 성공 screenshot 경로를 final1에서 재사용해 최초1280·320 이미지 bytes 보존을 증명할 수 없는 실수가 있었다. 원본 성공 로그는 보존하되 copied original-320-preserved 파일 이름도 원본 bytes 증거가 아니다. 이후 final2/3·officialfinal1/2는 별도 경로이며 중간 capture를 최종 source로 재명명하지 않는다. #180의 기존 최초 screenshot overwrite 한계도 유지한다. 일부 중간 fixture 전체 bytes는 별도 복사하지 않았으며 원본 실패 로그·대화의 편집 기록과 실제 남은 source만 보존하고 재생성 원본이라고 주장하지 않는다. ALL `/tmp/club-medical-*` 실제 존재 원본/로그/캡처/게이트를 보호한다. 기존 assertion/예산/instrumentation/fallback/GC/billing은 약화하지 않았다. 새 소유 medical UI budget7500은 기존 module budget을 올리지 않는다.

**정확한 다음 45–55분 구현 12.3.7:** 소유 선수의 실제 계약 기간·옵션·급여/역할 약속과 현재 재계약 가능 조건→기존 수동 재계약/조건 협상→실제 계약·의무/역할 소비·복귀·저장. fresh inspect contracts/contract window/optionDecision/exerciseContractOption/rolePromise 상태·기존 startNegotiation(renewal)·player.sign 및 actual UI/shared commands 먼저. 계약 연도·일별 대체 계약 종료·옵션/보너스/약속을 같은 확정 만료로 합치지 않는다. source가 없는 개별 deadline·수수료·성과/언어 상태·자동 이행 권한/사적인 기량을 만들지 않는다. 기존 owned/current manager/manual/parent-reserve writer 권한과 날짜·창구/예산/거절·취소/stale/duplicate/save/history·실제 consumer를 검증한다. 기존 열린 협상12.3.2·initial offer12.5.3을 다시 구현 완료로 세지 않는다. 새 실제 source-backed engine defect가 있으면 최우선이며 shop8.2.2·XP8.5.1 unchanged source gap 획득과 완료 audits를 반복하지 않는다. 의료 emergency/전반 roster·office/언어/전체 UI·AnalysisRoom·13서사·38/eight-audit/all-domain COMPLETE 승인과 최종100season/device/mobile/TalkBack 유예는 계속 유지한다.


## 12.3.7 소유 선수 계약·옵션·역할 약속과 기존 수동 재계약 (2026-10-05)

**구현 경계:** `ui-club-contracts.js`가 현재 소유 구단·소유 2군의 private full JSON 복사본에서 현재 연봉/연간 계약 종료/계약금·조건부 보너스·보장/팀·선수 옵션/역할 약속의 실제 사용량/저장된 다음 시즌 합의를 분리한다. `finance.payroll`의 실제 구단 분담 연봉(임대 분담 포함, 의료 대체 연봉 제외)은 즉시 지급액이 아니다. 의료 대체 guaranteedThrough/expiresOn은 연간 until과 별개이며 임대·의료 대체 계약에 새 수동 재계약 권한을 주지 않는다. 계약금은 이미 지급됐을 수 있고 조건부 보너스·미래 현금·출전은 보장하지 않는다. 없는 역할 표본은 0% 평가로 만들지 않는다. 기존 expectedPlayShare는 가상 게임 규칙이며 실제 프로 목표나 새 계수가 아니다.

**작성자·소비자:** 재계약 가능 조건은 private copy의 실제 `startNegotiation(...,'renewal',{teamId})` 결과로 확인하고 live world에 lazy negotiationStore를 만들지 않는다. 실제 버튼은 같은 작성자→기존 `openClubBriefNegotiation`의 scoped input/수동 submit·counter accept·cancel→기존 계약 의무/rolePromiseStart/career event를 연결한다. 독점 창구 합의는 기존 contractAgreements에 남고 저장된 미래 연봉·기간·옵션·역할 조건은 현재 조건과 분리하고 현재 계약은 적용일까지 유지되며 `applyDueRenewalAgreements`가 실제 적용한다. 팀 옵션은 기존 `mExerciseTeamOption` 또는 `exerciseExclusiveTeamOption`·journal만 사용한다. 선수 옵션을 구단 수동 버튼으로 만들지 않는다. 소유 2군 재계약은 기존 모구단 권한을 재사용한다. 일반 2군 옵션은 기존 managedTeam-only 작성자 때문에 추가 대행 권한을 만들지 않으며 독점 옵션은 기존 parent ownership 조건을 따른다. 2군 감독은 계약 조회만 한다. 전체 협상/초기 영입 projection을 중복 완료로 세지 않는다.

**통제된 실제 반례:** 원래 시장 retained `[data-start-renew]` DOM 콜백을 pack/unpack 뒤 호출하면 새 DB에 `NEG_2027_NA_38_renewal`과 save1이 쓰였다. 원본 HTML의 실제 Chromium 버튼에서도 재현했다. 시장·독점 창구·새 팝업의 계약 진입을 하나의 guarded binding으로 공유한 뒤 같은 retained 콜백은 inert이며 현재 버튼은 기존 작성자와 whole-world JSON이 일치한다. 자연 사용자 빈도나 전체 callback rollback을 주장하지 않는다. DB/world/slot-switching/manager 객체·ID/render/VIEW/actual dialog/date/year/phase/manual/fired/pending/실제 team·roster·player·finance·contract source snapshot을 재검사한다. same-kind 새 dialog는 같은 dialog가 아니다. 기존 협상 창은 current manager object도 확인하고 결과 후 원래 계약 브리핑 버튼으로 focus를 복원한다. 기존 비동기 saveDB I/O 전체 rollback/분산 탭 보장은 아니다.

**수용과 실제 소비:** [실행 검사](../scripts/club-contract-acceptance.mjs), [source/hashes·최종 수용](evidence/club-contract-briefing.json), [원본 source·진단·automation 전체](evidence/club-contract-briefing-diagnostics.json). pure read/actual writer whole JSON/현재 재계약·수락·취소/팀·선수 옵션/독점 옵션·창구 종료/다음 시즌 합의와 실제 적용/owned reserve·foreign/fired/AI/initial/pending/date/year/현금 변경·retired/duplicate/load/slot/manager 객체·same-kind dialog/늦은 옵션 작성 예외의 journal rollback/full-lite 계약·합의·career·공식 기록이 통과했다. 역할 사용량은 기존 의료상 불가 분모를 제외해 7/9이며 당시 NA-only fixture의 실제 가상 domestic Bo1 VXG39:28 넥서스 종료 후8/10으로 증가한 원본 로그를 보존한다. 최종 실제 NA+EU fixture는 owned NA VXG35:59와 foreign EU NLN33:24 넥서스 종료·대회 최종화를 거쳐 각각 full/compact 소비자를 검증했다. publicRecord의 실제 저장 tuple ID를 검증하고 원자료를 보존한다. 실전 spell execution/프로 calibration/강제 결과가 아니다.

최종 production source의 UI85수용/84freshVM·101engine, calendar20, static14/build150 통과. Node22 regression/smoke31496.8ms(기존35초)·두시즌186officialgames 통과; UI/calendar 종료 후 실행했지만 최적화·전역 outcome parity 증거로 쓰지 않는다. 최종 fixture에 추가한 독점 옵션·폐쇄 창구·공식 tuple 로그는 별도 focused 통과하며 exact-head CI가 전체 최종 fixture를 검사한다. Chromium1280/320 실제 Enter/순수 조회/scoped 배경0.8 vs 팝업0.1/재계약·취소·팀 옵션/독점 합의·옵션·폐쇄 창구/저장·stale·권한·owned reserve/복귀 focus/no document overflow·pageerror 통과. 별도 실제 재계약→수동 TOP·FirstSelection/20턴→공식 Bo3세경기에서 역할 사용량·tuple IDs·넥서스48:56/20:59/35:05/pending-history/public source/Analysis 필터·키보드/save를 확인했다. 동일 rebuilt HTML injection·controlledlocalStorage이며 production HTTP/최종 device·mobile·TalkBack QA가 아니다.

**실패·진단 보호:** 새 UI dependency를 최소 async VM의 읽기/destructure만 추가하고 실제 evaluate를 누락한 ReferenceError 원본·첫 교정 실패를 보존한 뒤 실제 source 평가를 추가했다. default childprocess/socket sandbox 실패→같은 checks explicit review 통과. browser fixture의 존재하지 않는 VIEW market/fa 가정을 실제 UI_ROUTES·phase market/VIEW season으로 교정했으며 production defect로 세지 않는다. 추가 공식 source 로그의 닫는 괄호 SyntaxError 두 건, players를 객체 playerId로 읽어 null 로그가 된 진단은 원본 보존 후 실제 tuple을 그대로 출력하고 모든 ID의 DB 존재 assertion을 추가했다. 독점 browser extension의 Python 따옴표 SyntaxError도 보존한다. 기존 assertions/budgets/instrumentation/fallback/GC/billing은 약화하지 않는다. 모든 캡처는 distinct final2/final3/final5/final6/officialfinal1·2·3 경로이며 intermediate를 최종 source로 재명명하지 않는다. 과거 #180·#195 최초 성공 screenshot bytes 한계는 그대로 보존한다. 실제 존재 /tmp/club-contract-*만 보존하고 missing original을 재생성한 것으로 쓰지 않는다. 원본 DEVELOPMENT1776행이 같은 순서로 남고 101engine bytes가 base87a504와 동일하다. 별도 dirty analysis checkout과 open27·28 충돌 검토를 유지했으며 파일을 덮어쓰지 않았다.

**정확한 다음 경계 12.3.8:** 현재 소유 구단의 실제 훈련 강도·배분·연습 중점과 오늘 공유 연습 자원→기존 `squad.preparation` 수동 확정·취소→실제 `runDailyPractice`/medical plan/officialBookedTeams/스크림 자원 소비·성장·복귀·저장. fresh inspect ui-roster squadEditState/applySquadEdit/normalizeTraining/setTrainingAllocation, squadPreparationSnapshot/validateSquadPreparation, practiceDay/runDailyPractice/trainingTimeMultiplier/scrimReadiness/기존 일일·성장 writer부터. 실제 100점 훈련 배분과 100 연습 자원은 같은 단위로 합치지 않는다. 개인·팀 훈련/의료 제외/공식 예약/이미 소비·미소비를 구분하고 상대 private practice·새 효과/가격/언어 상태/출전 보장을 만들지 않는다. parent/reserve/manual/fired/initial/stale/scoped root/cancel/duplicate/거절·rollback/purity/full-lite/actual consumer 수용. 스크림 수락·예약 UI 확대는55분을 넘으면 별도 substantial 경계로 기록한다. 신규 실제 source-backed engine defect는 최우선이며 완료 audits/변함없는 shop8.2.2·XP8.5.1 blocked 획득을 반복하지 않는다. 전체 UI/계약·훈련/AnalysisRoom/언어/13서사/38/eight-audit/all-domain은 승인·미완료를 유지한다. 최종100season/device/mobile/TalkBack 유예와 feature acceptance 이후 verified refinement 승인은 유지한다.

**12.3.7 저장 증거의 검증 정정:** 실제 `save.js:packDB(db)`는 두 번째 인자를 받지 않는다. 이전 `club-medical-acceptance.mjs`13·25행과 이번 초기 fixture의 `packDB(DB,compact)` 반복만으로는 별도 간소화 분기를 증명하지 못한다. #195의 원본 주장·source·로그는 삭제하지 않고 이 한계를 병기한다. 다른 기존 save acceptance의 독립적인 full/lite 증거를 일괄 무효로 주장하지 않는다. 실제 `worldForSave`는 완료된 다른 지역 국내 시즌에서만 `seriesResultForSave(...,true)`를 적용한다. 이번 최종 fixture는 기존 정식 NA/EU 대회를 실제 simulate/commit/finalize writer로 끝내고, owned full·foreign lite/compact flags·공개 넥서스 원자료·계약 화면/role usage·agreement·career의 실제 복원을 검증한다. 처음 완료 처리가 빠져 compact assertion이 실패한 원본과 후속 정상 source·원자료를 보존했다. 실제 브라우저의 기존 full-save/lite-save 파일은 같은 packDB 경로로 동일 bytes이며 두 간소화 모드 증거가 아니다. 실제 경기 archive/계약 전후 whole JSON·정식 저장 원본은 별도 unique final3 경로로 보존한다.


### 12.3.8 현재 훈련·공유 연습 자원과 기존 수동 준비 — 2026-10-05

**구현 경계:** `ui-club-practice.js`가 current owned/owned reserve의 private full JSON 복사본에서 현재 강도·능력 배분·중점, 오늘 공유 연습 자원의 스크림 소비/일일 소비/잔여/처리 중점·공식 예약, 연간 팀/개인 참여 기록과 기존 성장 시간 배율을 구분한다. 능력 배분100점과 하루 연습 자원100점은 서로 다른 단위다. 현재 의료 제외·휴식/재활/가벼운 참여를 표시하며 미래 성장/복귀를 보장하지 않는다. 상대 private practice/능력·새 가격/계수/기한/언어 상태를 발명하지 않는다. 고용·등록·선발·의료 가용도 같은 개념으로 합치지 않는다.

팝업의 실제 scoped 입력→private 기존 `squad.preparation` preview→확인/현재 문맥 재검사→기존 `commitWorldAction`·journal rollback→message/save/navKeepScroll/원래 브리핑 버튼 focus를 연결한다. parent의 소유 reserve 코칭은 기존 `managerControlsSquad` 권한이며 계약 대행권한이 아니다. `bindSquadPracticeControls`와 `ui-squad-controls.js`가 기존 선수단의 훈련·전술·선발·역할·조직 배치 초안을 같은 current DB/world/slot-switching/manager object/render/VIEW/actual dialog/date-year/phase-pending/manual-fired-active/roster-training-medical/full player source 문맥으로 검사한다. 기존 writer/가격/경제/AI/의료/등록/훈련/성장/save schema와101 engine files는 원 main bytes 동일하다. 새 화면 소유 budget10500/3000이며 기존 예산은 올리지 않았다.

**실제 반례와 수용:** 원본 actual `bindSquad`의 retained 훈련 DOM after real pack/unpack/load가 새 DB를 바꾸고 save1을 실행했다. 추가 실제 원본 HTML에서 retained 전술 입력이 새 초안에 aggression17을 넣어 현재 수동 확정으로 소비됐다. 최종 동일 콜백은 live world/새 초안에 inert, 현재 입력의 정상 수동 writer는 whole JSON으로 기존 명령 결과와 동일하다. 통제 실제-source/브라우저 반례이며 자연 발생 빈도/전체 callback rollback/분산탭/async save I/O 전체 rollback/최적화/global match parity를 주장하지 않는다. popup cancel/confirm cancel/date change/invalid/rejection/late journal rollback/foreign-fired-AI-initial/pending/medical-cash-independent source/slot-manager-load/same kind dialog/duplicate/parent-reserve를 검증한다.

`consumeScrimPractice` 실제2세트20점→`runDailyPractice` 잔여80점→개인 기량 중점64점, rest 의료 제외와 existing `trainingTimeMultiplier`1.056/동일 RNG의 기록 시간별 `growPlayer` 소비를 확인했다. 실제 공식 예약일은 일일 drills0이다. 실제 NA/EU 공식 가상 대회를 simulate/commit/finalize하여 실제 nexus/public source와 owned full·완료 foreign lite/compact 저장 flags/훈련·참여·의료·history 복원을 검증한다. 브라우저 full-save/lite-save 두 파일 이름은 같은 canonical pack bytes로 두 분기 증거가 아니며 독립 focused NA/EU 분기가 실제 간소화를 검증한다. amateur/pro 보정/강제 결과가 아니다.

실행 source [club-practice-acceptance](../scripts/club-practice-acceptance.mjs), [원본 수용](evidence/club-practice-briefing.json), [진단](evidence/club-practice-briefing-diagnostics.json)에 source hashes/whole JSON/history/실제 consumer/기존 guide1803행 순서/자동화196 prompt 전체·실패·중간·최종 raw 기록을 보존한다. 브라우저는 동일 rebuilt HTML injection·controlled storage,1280/320 실제 Enter·취소/입력 공존·수동 확정·save·stale·focus·no overflow/pageerror와 실제 rehab/daily/manual TOP/FirstSelection20턴/Bo3 세 경기(public nexus48:56/20:59/35:05)/role usage/tuple/source/Analysis filters를 검증한다. Production HTTP/최종 device/TalkBack QA가 아니다. 검사의 최종 수치와 source hashes는 증거 파일을 따른다. 원본25+25 JS check expressions 및42 Python official Assert AST는 유지하고 새 반례 assertion만 추가한다. ALL /tmp/club-practice-* 실제 존재 originals/logs/captures만 보존하며 missing 원본을 재생성 보존했다고 주장하지 않는다. #180/#195 최초 성공 screenshot bytes 한계도 유지한다. 이번 final4/officialfinal3 capture는 고유 경로다.

**정확한 다음 구현12.3.9:** 내 구단의 실제 날짜별 스크림 제안·수락/예약·참가자·취소와 오늘 공유 자원→기존 수동 scrim writer→실제 날짜별 일일/의료·공식 예약 소비→결과·복귀·저장. `scrim-plans`/`scrim-partner`/`practice-resources`/`ui-roster`/현재 UI command·authority부터 새로 읽고, 훈련 배분과 자원을 구분하며 actual pending/date/participants/source/scoped/manual/parentreserve/stale/cancel/duplicate/rejection/rollback/full-lite/history를 수용한다. 없는 상대 private practice/가격/수락 보장/계수/정책은 만들지 않는다. 스크림 예약 UI 확대는 이번 훈련 단위에 구현됐다고 세지 않는다. 새 실제 source-backed engine defect는 최우선, 완료 audits/변함없는 shop8.2.2·XP8.5.1 blocked 획득 반복 금지. 전체 UI/AnalysisRoom/radar/언어/13서사/38/eight-audit/all-domain 미완료 승인을 유지하며 최종100season/device/mobile/TalkBack은 features/playtest/fixes 이후다.
