import {verifyClubHomeSources} from './club-home-source-successor.mjs';
import {ENGINE_MODULES} from './artifact-modules.mjs';
import assert from 'node:assert/strict';
const e=await verifyClubHomeSources();assert.equal(ENGINE_MODULES.length,101);assert.equal(Object.keys(e.engine).length,101);
console.log('운영 홈 증거 통과: 원본 가이드·실패·전체 raw SHA·엔진101개 바이트 동일·기존 검증 기준 승계');
