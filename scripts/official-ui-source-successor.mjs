import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
const reviewed=new Set(['src/artifact/ui-season.js','src/artifact/ui-draft.js','src/artifact/ui-draft-preparation.js','scripts/artifact-modules.mjs','scripts/check.mjs','scripts/ui-async-acceptance.mjs','package.json','index.html','scripts/season-progress-source-successor.mjs','scripts/unemployed-season-source-successor.mjs']);
let evidence;
export async function verifyOfficialUiSources(){
 if(evidence)return evidence;
 const e=JSON.parse(await readFile(new URL('docs/evidence/official-ui-authority-2026-10-09.json',root)));
 const segments=[];for(const part of e.archive.parts){const b=await readFile(new URL(part.path,root));assert.equal(sha(b),part.sha256);assert.equal(b.length,part.bytes);segments.push(b)}
 const zipped=Buffer.concat(segments);assert.equal(sha(zipped),e.archive.sha256);
 const raw=gunzipSync(zipped);assert.equal(sha(raw),e.archive.decodedSha256);assert.equal(e.archive.format,'jsonl-v1');
 const rows=[];let start=0;while(start<raw.length){const end=raw.indexOf(10,start);assert(end>=start,'complete evidence row');const r=JSON.parse(raw.subarray(start,end));const b=Buffer.from(r.base64,'base64');assert.equal(b.length,r.bytes);assert.equal(sha(b),r.sha256);rows.push({path:r.path,sha256:r.sha256,...(r.path.startsWith('original/')?{base64:r.base64}:{})});start=end+1}assert.equal(rows.length,e.archive.rows);
 for(const p of reviewed){assert(rows.some(r=>r.path==='original/'+p&&r.sha256===e.originals[p]),p+' exact validated main source');assert(rows.some(r=>r.path==='current/'+p&&r.sha256===e.sources[p]),p+' reviewed successor source')}
 for(const [p,h] of Object.entries(e.sources))assert.equal(sha(await readFile(new URL(p,root))),h,p+' exact current source');
 for(const d of e.dependencies)assert.equal(sha(await readFile(new URL(d.path,root))),d.sha256,d.path+' previous evidence retained');
 assert((await readFile(new URL('docs/DEVELOPMENT.md',root))).includes(Buffer.from(rows.find(r=>r.path==='original/docs/DEVELOPMENT.md').base64,'base64')));
 evidence=e;return e;
}
export async function officialUiSourceHash(path){
 const actual=sha(await readFile(new URL(path,root)));if(!reviewed.has(path))return actual;
 const e=await verifyOfficialUiSources();return e.originals[path];
}
