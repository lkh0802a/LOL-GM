import {verifyPendingHandoffSources} from './pending-handoff-source-successor.mjs';
import {ENGINE_MODULES} from './artifact-modules.mjs';
import assert from 'node:assert/strict';
const e=await verifyPendingHandoffSources();assert.equal(ENGINE_MODULES.length,101);assert.equal(Object.keys(e.engine).length,101);
assert.notEqual(e.sources['src/artifact/season.js'],e.originals['src/artifact/season.js']);
console.log('대기 공식 경기 인계 증거 통과: 원본 가이드·실패·전체 raw chunk SHA·현재 엔진100개 바이트 동일/시즌1개 의도한 교정·이전 검증 기준 승계');
