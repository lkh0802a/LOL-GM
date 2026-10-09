import {progressSourceHash} from './season-progress-source-successor.mjs';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
const reviewed=new Set(['scripts/ui-async-acceptance.mjs','src/artifact/app.js','src/artifact/ui-season.js','src/artifact/offseason.js','package.json','index.html','scripts/season-history-source-successor.mjs','scripts/verify-season-history-evidence.mjs']);
let evidence;
async function successor(){
 if(evidence)return evidence;
 const e=JSON.parse(await readFile(new URL('docs/evidence/unemployed-season-context-2026-10-08.json',root)));
 const zipped=await readFile(new URL(e.archive.path,root));assert.equal(sha(zipped),e.archive.sha256);
 const raw=gunzipSync(zipped);assert.equal(sha(raw),e.archive.decodedSha256);const rows=JSON.parse(raw);
 for(const row of rows){const b=Buffer.from(row.base64,'base64');assert.equal(b.length,row.bytes);assert.equal(sha(b),row.sha256)}
 for(const p of reviewed){
  assert(rows.some(r=>r.path==='original/'+p&&r.sha256===e.originals[p]),p+' exact 209 source retained');
  assert(rows.some(r=>r.path==='current/'+p&&r.sha256===e.sources[p]),p+' reviewed correction retained');
  assert.equal(await progressSourceHash(p),e.sources[p],p+' exact current correction');
 }
 evidence=e;return e;
}
export async function seasonUiSourceHash(path){
 const actual=sha(await readFile(new URL(path,root)));if(!reviewed.has(path))return actual;
 const e=await successor();return e.originals[path];
}
