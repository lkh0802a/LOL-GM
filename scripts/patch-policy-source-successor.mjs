import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const root=new URL('../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
let verified;
async function verify(){
 if(verified)return verified;
 const e=JSON.parse(await readFile(new URL('docs/evidence/patch-review-2026-10-16.json',root)));
 assert.equal(e.base,'f121a05b848bd12944eed708a4b7d60c8f5c432a');
 const zipped=await readFile(new URL(e.archive.path,root));assert.equal(zipped.length,e.archive.bytes);assert.equal(sha(zipped),e.archive.sha256);
 const raw=gunzipSync(zipped);assert.equal(sha(raw),e.archive.decodedSha256);const rows=JSON.parse(raw);assert.equal(rows.length,e.archive.rows);
 const originals={};for(const r of rows){const b=Buffer.from(r.base64,'base64');assert.equal(b.length,r.bytes);assert.equal(sha(b),r.sha256);assert.equal(e.originals[r.path],r.sha256);originals[r.path]=b.toString()}
 assert.deepEqual(Object.keys(originals),Object.keys(e.originals));
 for(const [p,h] of Object.entries(e.sources))assert.equal(sha(await readFile(new URL(p,root))),h,p+' exact reviewed current bytes');
 for(const p of ['scripts/negotiation-summary-source-successor.mjs','scripts/initial-negotiation-review-source-successor.mjs','scripts/startup-save-source-successor.mjs','scripts/stove-fa-source-successor.mjs']){
  let expected="import {patchPolicySourceHash} from './patch-policy-source-successor.mjs';\n"+originals[p].split('\n').map(line=>
    /^(?:for\(|assert\.)/.test(line.trim())?line.replace("sha(await readFile(new URL('src/artifact/'+p,root)))","await patchPolicySourceHash('src/artifact/'+p)"):line).join('\n');
  if(p==='scripts/stove-fa-source-successor.mjs')expected=expected.replace('import {patchPolicySourceHash}', 'import {patchPolicySourceHash,patchPolicySourceText}').replace("(await readFile(new URL('src/artifact/calendar.js',root),'utf8')).startsWith","(await patchPolicySourceText('src/artifact/calendar.js')).startsWith");
  assert.equal(await readFile(new URL(p,root),'utf8'),expected,p+' predecessor assertions retained; only exact reviewed engine successor routed');
 }
 const smoke=originals['scripts/smoke.mjs'].replace("import { createHash }","await import('./patch-rework-acceptance.mjs');\nawait import('./patch-lifecycle-acceptance.mjs');\nawait import('./patch-calendar-carry-acceptance.mjs');\nimport { createHash }").replace("flex:1,diagnosis:'검증',why:'검증'}]});","flex:1,diagnosis:'검증',why:'검증'}],reviews:[{cid:rwChamp.id,status:'candidate',scope:'mid',reason:'검증된 후보를 입력하는 기존 작성자 단위 검사'}]});");
 const smokeObserved=smoke.replace('seasonPatch(pDb,patchDates[0],prng);const p0=',"seasonPatch(pDb,patchDates[0],prng);pDb.metaHistory=Array.from({length:24},()=>({date:patchDates[0],patch:pDb.patch.id,sides:[],bans:[]}));const p0=");
 assert.equal(await readFile(new URL('scripts/smoke.mjs',root),'utf8'),smokeObserved,'all existing smoke assertions retained; new policy acceptance plus explicit writer fixture');
 assert(Object.keys(e.sources).length>=15,'current reviewed sources must be explicitly bound');
 const calendar=originals['scripts/calendar-depth-acceptance.mjs'].replace('  const oldPatchCount=db.patches.list.length;',"  const oldPatchCount=db.patches.list.length;\n  // Controlled public observations isolate the original scheduled-day assertion.\n  db.metaHistory=Array.from({length:24},()=>({date:initial,patch:db.patch.id,sides:[],bans:[]}));");
 assert.equal(await readFile(new URL('scripts/calendar-depth-acceptance.mjs',root),'utf8'),calendar,'original timing assertions retained with explicit adequate observation fixture');
 const clockPath='scripts/negotiation-clock-acceptance.mjs',insertion=e.clockDecidingSet;
 assert.equal(originals[clockPath].split(insertion.anchor).length,2,'unique original deciding-set assertion anchor');
 const clock=originals[clockPath].replace(insertion.anchor,insertion.before+insertion.anchor).replace("cfg.regions=[regionCfg('BR',{teams:10,div2:false})];","cfg.regions=[regionCfg('BR',{teams:10,div2:false,regularBo:5})];");
 assert.equal(await readFile(new URL(clockPath,root),'utf8'),clock,'all original clock assertions retained; native deciding set and explicit midnight Bo5 fixture only');
 verified={e,originals};return verified;
}
// Return predecessor hashes only for explicitly archived, current-byte-verified
// changes. This proves old evidence retention, never current engine identity.
export async function patchPolicySourceHash(p){const {e}=await verify();return e.originals[p]||sha(await readFile(new URL(p,root)))}
export async function patchPolicySourceText(p){const {originals}=await verify();return originals[p]??readFile(new URL(p,root),'utf8')}
