// Preserve the previous public source for historical retention assertions.
// This does not inherit its test success for current engine bytes.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
let verified;
async function originals(){
 if(verified)return verified;
 const result={};
 for(const name of ['system-choice-hash','draft-staff-profile']){
  const e=JSON.parse(await readFile(new URL('docs/evidence/'+name+'-2026-10-17.json',root)));
  assert.equal(e.predecessorPublicCommit,'a5cc905cb23160e8505b9b479b9b098796df7a96');
  const zip=await readFile(new URL(e.archive.path,root));assert.equal(zip.length,e.archive.bytes);assert.equal(sha(zip),e.archive.sha256);
  if(name==='system-choice-hash'){
   const raw=gunzipSync(zip).toString();assert.equal(sha(raw),e.predecessorSha256);
   assert.equal(sha(await readFile(new URL('src/artifact/systems.js',root))),e.currentSha256);result['src/artifact/systems.js']=raw;
  }else{
   const raw=JSON.parse(gunzipSync(zip));for(const [p,h] of Object.entries(e.originals)){assert.equal(sha(raw[p]),h);result['src/artifact/'+p]=raw[p];}
   for(const [p,h] of Object.entries(e.sources))assert.equal(sha(await readFile(new URL(p,root))),h,p+' exact current performance source');
  }
 }
 verified=result;return result;
}
export async function draftPerformanceSource(path){return (await originals())[path]??null}
