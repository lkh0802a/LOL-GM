import {verifyOfficialUiSources} from './official-ui-source-successor.mjs';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {ENGINE_MODULES} from './artifact-modules.mjs';
const root=new URL('../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex'),e=await verifyOfficialUiSources();
assert.equal(ENGINE_MODULES.length,101);
for(const f of ENGINE_MODULES)assert.equal(sha(await readFile(new URL('src/artifact/'+f,root))),e.engine[f],f+' unchanged validated main engine');
console.log('공식 UI 증거 검증 통과: 원본 가이드·실패·검토된 소스 승계·엔진101개 바이트 유지');
