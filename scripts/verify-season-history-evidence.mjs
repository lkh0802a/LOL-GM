import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {ENGINE_MODULES} from './artifact-modules.mjs';
import {historicalSourceHash} from './season-history-source-successor.mjs';
const root=new URL('../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
const e=JSON.parse(await readFile(new URL('docs/evidence/season-history-compaction-2026-10-08.json',root)));
const zipped=await readFile(new URL(e.archive.path,root));assert.equal(sha(zipped),e.archive.sha256);
const raw=gunzipSync(zipped);assert.equal(sha(raw),e.archive.decodedSha256);const rows=JSON.parse(raw);
for(const r of rows){const b=Buffer.from(r.base64,'base64');assert.equal(b.length,r.bytes);assert.equal(sha(b),r.sha256)}
for(const [p,h] of Object.entries(e.sources))assert.equal(sha(await readFile(new URL(p,root))),h,p);
for(const [p,h] of Object.entries(e.originals))assert(rows.some(r=>r.path==='original/'+p&&r.sha256===h),p);
assert((await readFile(new URL('docs/DEVELOPMENT.md',root))).includes(Buffer.from(rows.find(r=>r.path==='original/docs/DEVELOPMENT.md').base64,'base64')));
assert.equal(ENGINE_MODULES.length,101);let changed=0;
for(const f of ENGINE_MODULES){const p='src/artifact/'+f,current=sha(await readFile(new URL(p,root)));if(current!==e.engine[f]){assert.equal(f,'season.js');assert.equal(current,e.sources[p]);assert.equal(await historicalSourceHash(p),e.engine[f]);changed++}}
assert.equal(changed,1,'only the intentional season history correction changes engine bytes');
console.log('시즌 기록 증거 검증 통과: 원본 전체 가이드·실패·소스 보존, 엔진 100개 바이트 동일·시즌 기록 교정 1개');
