import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {ENGINE_MODULES} from './artifact-modules.mjs';
const root=new URL('../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
const e=JSON.parse(await readFile(new URL('docs/evidence/official-draft-comparison-2026-10-08.json',root)));
if(e.priorArchive){const prior=await readFile(new URL(e.priorArchive.path,root));assert.equal(sha(prior),e.priorArchive.sha256);assert.equal(sha(gunzipSync(prior)),e.priorArchive.decodedSha256)}
const zipped=await readFile(new URL(e.archive.path,root));assert.equal(sha(zipped),e.archive.sha256);
const raw=gunzipSync(zipped);assert.equal(sha(raw),e.archive.decodedSha256);const rows=JSON.parse(raw);
for(const r of rows){const b=Buffer.from(r.base64,'base64');assert.equal(b.length,r.bytes);assert.equal(sha(b),r.sha256)}
for(const [p,h] of Object.entries(e.sources))assert.equal(sha(await readFile(new URL(p,root))),h,p);
for(const [p,h] of Object.entries(e.originals))assert(rows.some(r=>r.path==='original/'+p&&r.sha256===h),p);
assert((await readFile(new URL('docs/DEVELOPMENT.md',root))).includes(Buffer.from(rows.find(r=>r.path==='original/docs/DEVELOPMENT.md').base64,'base64')));
for(const f of ENGINE_MODULES)assert.equal(sha(await readFile(new URL('src/artifact/'+f,root))),e.engine[f],f);
console.log('OFFICIAL_DRAFT_EVIDENCE PASS original/source/guide hashes and unchanged engines');
