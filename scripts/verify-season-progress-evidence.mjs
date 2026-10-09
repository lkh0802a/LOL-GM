import {verifyProgressSources} from './season-progress-source-successor.mjs';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {ENGINE_MODULES} from './artifact-modules.mjs';
const root=new URL('../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
const e=await verifyProgressSources();assert.equal(ENGINE_MODULES.length,101);
for(const f of ENGINE_MODULES)assert.equal(sha(await readFile(new URL('src/artifact/'+f,root))),e.engine[f],f+' unchanged validated engine');
console.log('진행 권한 증거 검증 통과: 검증된 main 원문·승인 가이드·모든 보관 실패 유지, 경기 엔진101개 바이트 동일');
