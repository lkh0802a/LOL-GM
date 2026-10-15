// 집중 검사는 새 VM을 유지하고 읽기 전용 엔진 컴파일만 공유한다.
import {buildUiV2} from './build-ui-v2.mjs';
import {testHarnessStats} from './test-harness.mjs';
await buildUiV2();
for(const script of ['ui-v2-acceptance','ui-v2-management-acceptance','ui-v2-context-acceptance','ui-v2-official-acceptance','ui-v2-dialog-acceptance'])await import('./'+script+'.mjs');
console.log('UI_V2_CHECK_RUNNER',JSON.stringify({tests:5,...testHarnessStats()}));
