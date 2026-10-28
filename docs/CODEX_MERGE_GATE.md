# 검증 기반 병합 게이트 — #311

## 현재 사용자 권한

최신 사용자 직접 지시와 GitHub #311이 이전 일일 08:00/전 등급 사람 검토 지침보다 우선한다. 정상 신규 기능·엔진 교체/고도화·AI·일정·UI·안전한 정리는 사전 승인 없이 구현·검증할 수 있다. 엔진 경로 자체가 사람 승인 사유는 아니다. 게임 정체성·감독 최종 권한·공정성·현재 지원 데이터 무결성 파괴, 중대한 권한/보안·위험한 배포 정책은 보호한다.

최신 #311/#313에 따라 최초 시즌부터 지역별로 서로 다른 국내 구조를 허용하며 글로벌3Split/3Circuit/14기간을 강제하지 않는다. 통합 연간 리그는 선택형 한 가지이고 모든 지역에 단일 PO를 강제하지 않는다. 팀 수·비로컬 수·기간/지역 포맷은 사무국이 관할·공표·발효 시즌·실제 일정/예산/가용성과 공정성에 따라 바꿀 수 있고 과거 경기·계약·기록은 소급 수정하지 않는다. 모든 지역1·2부 국내 정규/PO/선발전은 Worlds 개막 전에 끝나며 Worlds 결승은 시즌 마지막 공식 경기로 영구 보존한다. Fearless/First Selection도 사용자 영구 규칙이다. 중간 국제대회는 실제 점유·이동·회복·중계·공정성/마감 검증 후 국내 일부 병행을 허용하고 신규 지역2부 의무는 미결정을 유지한다. 이전 글로벌 프레임 fixture는 과거 회귀 자료이며 새로운 지역별 세계의 수용 계약을 대신하지 않는다. 독점 재계약은7일(FA 전체7일 아님), 일반/예선→KO 보편3일 휴식은 폐지하되 국내 정규→PO의 별도3일은 유지한다. 구형 개발 포맷의 무조건 호환은 강제하지 않지만 현행 지원 저장의 원자성/슬롯 격리/기록은 필수이며 안정화 이후 명시적 마이그레이션을 강화한다. 이 문단은 해당 게임 writer 구현 완료를 뜻하지 않는다.

Codex 의도 주기는 정확한300분이다. `0 */5`를 정확한5시간으로 사용하지 않는다. 실제 Codex 예약을 조회/수정할 수 없으면 설치/실행을 주장하지 않고 새 ChatGPT 예약을 만들거나 재활성화하지 않는다. main 보호는 주요 개발/안정화 후 별도 도입하며 현재 임의 활성화하지 않는다.

## 구현된 첫 수직 범위

`scripts/codex-merge-gate.mjs`는 별도 판단기와 조정자 상태 머신이다. 후보 PR의 라벨/자기 승인/단일 CI green으로 활성화되지 않는다.

- 최근 관측, 같은 저장소의 열린 비Draft main PR, 정확 HEAD/최신 base·test-merge 부모, 실제 write 가능성·merge 상태를 대조한다. CLI는 ref 입력을40자리 SHA로 제한하고 신뢰 origin의 실제 main을 읽어 snapshot과 대조한다. 테스트한 HEAD에 최신 main이 조상으로 포함되지 않으면 clean/과거 PASS여도 거절한다.
- GitHub Actions provider·정확 HEAD·실행 저장소/워크플로·필수15개 결과와 최신 시도를 확인한다. 누락/미완료/실패/알 수 없는 검사는 차단한다.
- 변경 파일 목록 완결성과 삭제/이름변경/민감 운영 경로를 구분한다. 엔진은 두 개 이상의 재현 시드·정확 HEAD의 강화 수용을 요구하며 경로만으로 사람 승인을 요구하지 않는다. 기존 테스트 수정은 별도 독립 무결성 검토 전 차단한다.
- 로컬 최종 pipeline의 UI/full/medical/core exit0·고정 소스·실제 tracked 바이트 전체를 읽어 확인한다. 전달된 PASS 선언만으로 sourceBinding을 만들지 않는다.
- #309의 신뢰된 preflight 코드와 실제 owner/공유 Git 디렉터리·프로세스 큐를 재사용한다. 소유권/UNKNOWN·리뷰 변경요청/미해결 스레드는 차단한다.
- 적용 직전 새 관측을 받고 HEAD/base/owner가 변하면 거절한다. durable intent 기록이 성공한 뒤에만 인증된 어댑터에 HEAD 조건부 merge 요청을 전달한다. 실패는 기록하고 자동 재시도하지 않는다.
- 실제 merge 결과와 부모를 대조한다. main이 경합 중 선행했거나 결과를 못 읽으면 통합 재검증 상태로 남긴다. 병합 성공도 별도 결과main/CI/저장·Pages 검증 전 배포 완료가 아니다. 강제push/reset/보호 우회/무조건 역병합은 없다.

## 활성화 경계와 아직 남은 작업

**현재 자동 병합은 미활성이다.** 판단 CLI와 읽기 전용 connector bridge는 토큰·네트워크 writer·설정 변경을 갖지 않는다. broker의 `--apply`는 신뢰 main 설치와 별도의 인증된 쓰기 어댑터가 모두 필요하며, 제공된 읽기 전용 bridge는 merge 요청을 항상 거절한다. 실행 코드가 실제 최신 main의 신뢰 코드와 같지 않으면 bootstrap 자체를 거절한다. 미병합 PR이 자기 코드를 승인하거나 권한을 새로 얻을 수 없다.

#310/PR312의 직접 main push 제거, #309 preflight 기반, 이 게이트의 신뢰 main 설치와 쓰기 통합을 단계적으로 확인해야 한다. 실제 GitHub 읽기 감사에서 PR312의 정확 HEAD·CI producer manifest·불변 artifact ID/digest·test-merge 부모/tree·#311 정책 해시를 대조했다. 다운로드한 ZIP 본문 검증이나 실제 merge 성공을 뜻하지 않는다. 다른 HEAD의 로컬 수용은 거절됐고 설치되지 않은 판단기는 활성화되지 않았다. 실제 GitHub 쓰기 어댑터·운영 end-to-end 병합/결과main 검증은 남아 있다.

`scripts/codex-merge-connector-bridge.mjs`는 기존 연결에 고정된 GET·review threads·producer log·artifact metadata만 요청한다. 파일/리뷰/검사 페이지는 broker가 최대20페이지 안에서 완결성을 확인하며, 스레드의 비어 있지 않은 불완전 응답은 차단한다. 공개 PR 본문·불필요한 권한·전체 로그 대신 필요한 필드와 manifest 줄만 전달하고, 평문 JSON을 최대1000문자 단위로 나눈다. 이는 큰 터미널 입력의 자동 승인 검토 거절 후 안내된 작은 입력 방식이며 인증/네트워크 우회가 아니다.

강화 수용은 실제 daily-career writer가 runtime와 저장 데이터의 causalStateHash를 기록하고, 정확 HEAD·실제 bundle 해시·고유 종료 프로세스·최소2시드 각2회/2시즌의 원문을 결합한다. fixture의 가상 메타데이터는 생산 증거가 아니다. 공유 fingerprint는 saveId만 제외하고 숫자형 키를 포함한 기존 canonical 결과를 보존한다. 기존 smoke 단언과 check 계획은 유지한다.

네트워크 연결 실패·프로세스 관측 UNKNOWN·보호 규칙 미확인에서는 fail closed다. 보호된 main은 보호 규칙 별도 감사 전 거절하며, 보호를 해제하거나 임의 활성화하지 않는다. 자동화 예약이 현재 연결에서 조회되지 않으면 정확300분 등록/첫 실행을 주장하지 않는다.

GitHub REST merge는 expected HEAD를 지원하지만 expected base의 원자적 CAS는 제공하지 않는다. 단일 협력 잠금과 적용 직전 확인의 범위를 넘어서는 다른 main 작성자 경합을 숨기지 않는다. 실제 부모가 달라지면 결과main을 다시 검증하고 실패 시 기존 정상 배포를 유지하며 수정 PR로 복구한다. main 보호/merge queue를 몰래 활성화해 해결하지 않는다.

판단 CLI 예시(신뢰 main 설치 후):

```sh
node scripts/codex-merge-gate.mjs /absolute/candidate/root /outside/snapshot.json /outside/new-report.json
```

보고서는 새 파일만 만들며 snapshot은 신뢰된 GitHub 조회 결과, 실제 로컬 증거 경로, 소유 lease 파일을 포함해야 한다. `READY_FOR_FRESH_RECHECK`는 병합 완료/승인/자동 활성화가 아니다. 기존 체크포인트·실패 원문을 보존하고 실제 HEAD·run·PID부터 재개한다.

읽기 전용 broker 실행 예시(기존 인증 연결을 사용하는 호스트가 JSON line 응답 제공):

```sh
node scripts/codex-merge-broker.mjs /absolute/candidate/root PR_NUMBER /outside/final-evidence /outside/lease/owner.json RUN_ID CURRENT_POLICY_SHA256 /outside/new-audit.json --audit
```

호스트는 `lol-gm-merge-v1` 요청에 bridge의 `readOnlyRequest`를 사용하고 `responseChunks`의 평문 응답을 전달한다. 도구를 제공하지 않은 단독 CLI는 스스로 GitHub에 연결하지 않는다. 출처가 불명확한 PR 스크립트를 인증 호스트에서 평가하지 않는다.
