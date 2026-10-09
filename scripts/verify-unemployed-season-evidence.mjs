import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {ENGINE_MODULES} from './artifact-modules.mjs';
import {seasonUiSourceHash} from './unemployed-season-source-successor.mjs';
const root=new URL('../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
const e=JSON.parse(await readFile(new URL('docs/evidence/unemployed-season-context-2026-10-08.json',root)));
const zip=await readFile(new URL(e.archive.path,root));assert.equal(sha(zip),e.archive.sha256);const raw=gunzipSync(zip);assert.equal(sha(raw),e.archive.decodedSha256);const rows=JSON.parse(raw);
for(const row of rows){const b=Buffer.from(row.base64,'base64');assert.equal(b.length,row.bytes);assert.equal(sha(b),row.sha256)}
for(const [p,h] of Object.entries(e.sources))assert.equal(sha(await readFile(new URL(p,root))),h,p);
for(const [p,h] of Object.entries(e.originals))assert(rows.some(r=>r.path==='original/'+p&&r.sha256===h),p);
assert((await readFile(new URL('docs/DEVELOPMENT.md',root))).includes(Buffer.from(rows.find(r=>r.path==='original/docs/DEVELOPMENT.md').base64,'base64')));
assert.equal(ENGINE_MODULES.length,101);let changes=0;
for(const f of ENGINE_MODULES){const p='src/artifact/'+f,current=sha(await readFile(new URL(p,root)));if(current!==e.engine[f]){assert.equal(f,'offseason.js');assert.equal(current,e.sources[p]);assert.equal(await seasonUiSourceHash(p),e.engine[f]);changes++}}
assert.equal(changes,1);
console.log('무소속 시즌 증거 검증 통과: 전체 승인 가이드·원본/실패 유지, 엔진100 동일·오프시즌 무소속 제안 교정1');
