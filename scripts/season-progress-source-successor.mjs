import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
const reviewed=new Set(['src/artifact/app.js','src/artifact/ui-season.js','package.json','index.html','scripts/unemployed-season-source-successor.mjs','scripts/verify-unemployed-season-evidence.mjs']);
let evidence;
export async function verifyProgressSources(){
 if(evidence)return evidence;
 const e=JSON.parse(await readFile(new URL('docs/evidence/season-progress-authority-2026-10-09.json',root)));
 for(const dep of e.dependencies||[])assert.equal(sha(await readFile(new URL(dep.path,root))),dep.sha256,dep.path+' retained earlier evidence');
 const zip=await readFile(new URL(e.archive.path,root));assert.equal(sha(zip),e.archive.sha256);
 const raw=gunzipSync(zip);assert.equal(sha(raw),e.archive.decodedSha256);const rows=JSON.parse(raw);
 for(const row of rows){const b=Buffer.from(row.base64,'base64');assert.equal(b.length,row.bytes);assert.equal(sha(b),row.sha256)}
 for(const p of reviewed){
  assert(rows.some(r=>r.path==='original/'+p&&r.sha256===e.originals[p]),p+' exact validated main original retained');
  assert(rows.some(r=>r.path==='current/'+p&&r.sha256===e.sources[p]),p+' reviewed source retained');
 }
 for(const [p,h] of Object.entries(e.sources))assert.equal(sha(await readFile(new URL(p,root))),h,p+' exact reviewed progress source');
 assert((await readFile(new URL('docs/DEVELOPMENT.md',root))).includes(Buffer.from(rows.find(r=>r.path==='original/docs/DEVELOPMENT.md').base64,'base64')));
 evidence=e;return e;
}
export async function progressSourceHash(path){
 const actual=sha(await readFile(new URL(path,root)));if(!reviewed.has(path))return actual;
 const e=await verifyProgressSources();return e.originals[path];
}
