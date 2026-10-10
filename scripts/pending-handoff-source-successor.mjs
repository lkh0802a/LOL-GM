import {stoveFaSourceHash} from './stove-fa-source-successor.mjs';
import {clubHomeSourceHash} from './club-home-source-successor.mjs';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createGunzip} from 'node:zlib';
import {Readable} from 'node:stream';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
const reviewed=new Set(['src/artifact/season.js','src/artifact/ui-season.js','src/artifact/ui-official-context.js','scripts/official-ui-source-successor.mjs','scripts/verify-official-ui-evidence.mjs','scripts/verify-season-progress-evidence.mjs','scripts/verify-unemployed-season-evidence.mjs','scripts/ui-async-acceptance.mjs','package.json','index.html']);
let evidence;
export async function verifyPendingHandoffSources(){
 if(evidence)return evidence;
 const e=JSON.parse(await readFile(new URL('docs/evidence/pending-official-handoff-2026-10-09.json',root)));
 assert.equal(e.archive.format,'jsonl-chunks-v1');const parts=[];
 for(const p of e.archive.parts){const b=await readFile(new URL(p.path,root));assert.equal(b.length,p.bytes);assert.equal(sha(b),p.sha256);parts.push(b)}
 assert.equal(sha(Buffer.concat(parts)),e.archive.sha256);
 const rawHash=createHash('sha256'),rows=[],files=new Map();let pending=Buffer.alloc(0),count=0;
 for await(const chunk of Readable.from(parts).pipe(createGunzip())){
  rawHash.update(chunk);pending=Buffer.concat([pending,chunk]);let end;
  while((end=pending.indexOf(10))>=0){const r=JSON.parse(pending.subarray(0,end));pending=pending.subarray(end+1);const b=Buffer.from(r.base64,'base64');assert.equal(b.length,r.bytes);assert.equal(sha(b),r.sha256);count++;
   const f=files.get(r.path)||{hash:createHash('sha256'),bytes:0,next:0};assert.equal(r.chunk,f.next++);f.hash.update(b);f.bytes+=b.length;files.set(r.path,f);
   if(r.chunks===1&&r.path.startsWith('original/'))rows.push({path:r.path,sha256:r.sha256,base64:r.base64});
  }
 }
 assert.equal(pending.length,0);assert.equal(count,e.archive.rows);assert.equal(rawHash.digest('hex'),e.archive.decodedSha256);
 for(const f of e.archive.files){const actual=files.get(f.path);assert(actual,f.path+' complete raw retained');assert.equal(actual.next,f.chunks);assert.equal(actual.bytes,f.bytes);assert.equal(actual.hash.digest('hex'),f.sha256)}assert.equal(files.size,e.archive.files.length);
 for(const p of reviewed){assert(rows.some(r=>r.path==='original/'+p&&r.sha256===e.originals[p]),p+' exact main original');assert(e.sources[p],p+' explicit successor')}
 for(const [p,h] of Object.entries(e.sources))assert.equal(await clubHomeSourceHash(p),h,p+' reviewed current bytes');
 for(const d of e.dependencies)assert.equal(sha(await readFile(new URL(d.path,root))),d.sha256,d.path+' prior evidence unchanged');
 assert((await readFile(new URL('docs/DEVELOPMENT.md',root))).includes(Buffer.from(rows.find(r=>r.path==='original/docs/DEVELOPMENT.md').base64,'base64')));
 for(const [f,h] of Object.entries(e.engine))assert.equal(await stoveFaSourceHash('src/artifact/'+f),f==='season.js'?e.sources['src/artifact/season.js']:h,f+' current engine bytes');
 evidence=e;return e;
}
export async function handoffSourceHash(path){
 const actual=await clubHomeSourceHash(path);if(!reviewed.has(path))return actual;
 const e=await verifyPendingHandoffSources();return e.originals[path];
}
