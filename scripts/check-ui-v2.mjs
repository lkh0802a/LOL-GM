// 집중 검사는 새 VM을 유지하고 읽기 전용 엔진 컴파일만 공유한다.
import {buildUiV2} from './build-ui-v2.mjs';
import {testHarnessStats} from './test-harness.mjs';
await buildUiV2();
for(const script of ['ui-v2-acceptance','ui-v2-retirement-acceptance','ui-v2-management-acceptance','ui-v2-context-acceptance','ui-v2-initial-comparison-acceptance','ui-v2-shortlist-comparison-acceptance','ui-v2-observation-report-acceptance','ui-v2-official-acceptance','ui-v2-dialog-acceptance','ui-v2-role-conversion-acceptance','ui-v2-medical-acceptance','ui-v2-facility-acceptance','ui-v2-save-import-acceptance','ui-v2-season-transition-acceptance','ui-v2-contract-day-acceptance','ui-v2-offseason-flow-acceptance','ui-v2-clock-contracts-acceptance','ui-v2-clock-official-acceptance','ui-v2-native-storage-acceptance','ui-v2-scrim-acceptance','ui-v2-career-acceptance','ui-v2-contract-access-acceptance','ui-v2-records-acceptance','ui-v2-player-transactions-acceptance'])await import('./'+script+'.mjs');
console.log('UI_V2_CHECK_RUNNER',JSON.stringify({tests:24,...testHarnessStats()}));
