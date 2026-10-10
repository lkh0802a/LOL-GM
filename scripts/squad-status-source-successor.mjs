import {initialTableSourceHash,initialTableSourceText} from './initial-table-source-successor.mjs';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const root=new URL('../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
const reviewed=['src/artifact/ui-official-edit.js','index.html','scripts/artifact-modules.mjs','scripts/check.mjs','src/artifact/ui-roster.js','src/artifact/ui-squad-table.js','src/artifact/ui-registration.js','scripts/scout-return-acceptance.mjs','scripts/squad-staging-acceptance.mjs','scripts/squad-observer-information-acceptance.mjs','scripts/squad-table-acceptance.mjs','scripts/squad-table-source-successor.mjs'];
const added=['src/artifact/ui-squad-status.js','scripts/squad-status-acceptance.mjs','scripts/squad-status-source-successor.mjs'];
const originals={"index.html":"4ced5c0e0cda3273e31fe6bdd4438ade0da9cbe4ce8f386f985b19d9f13120e7","scripts/artifact-modules.mjs":"a8156df7a326f56f0d119f7229ba47dae375d988f28dd2d12755014f87eb52b6","scripts/check.mjs":"b434c815056311897aab379553a2ecae33f1cb9689e4be9911d82fcca8bfa2ae","src/artifact/ui-roster.js":"ea35573cf26e77541d482dc61958dd6b53377debc97f56656502d38856851f9e","src/artifact/ui-squad-table.js":"bcf89ee1b5999172ac92bf3bc8a98265e4612ff669334e6e176560aeecfef5fe","src/artifact/ui-registration.js":"f7eb3f9123ffbb50118dd6d2e4e1db76f1815b20f1e36a58a2845889177c5f4c","scripts/scout-return-acceptance.mjs":"89e8e95def8fb250f10c5056c2bb950d66df3200c239ee490a6a39e364a88de9","scripts/squad-staging-acceptance.mjs":"91f0825475cf562ca4c53bec4f0caa53b5a726ea0e67e3d76168f6bcab78694e","scripts/squad-observer-information-acceptance.mjs":"b8f1438ebf603eb3281ef5c341c937da26e49509f54db217efa28835e9aa9c4c","scripts/squad-table-acceptance.mjs":"87dd22f4c2129dd8ddef2340b9a5bf45eb0b8d8a94a95e19b591bf9356ccb26a","scripts/squad-table-source-successor.mjs":"fda682d03b7250e2f08ac0c78d1f9a13711965094b905f71731e6c07e1938f5f","src/artifact/ui-official-edit.js":"56e1c28602107354616e8efbeec89505fb3e35cafc2846b4cc57a991fd5937e4"};
let verified;
async function verify(){
 if(verified)return verified;
 const e=JSON.parse(await readFile(new URL('docs/evidence/squad-status-2026-10-09.json',root)));
 assert.deepEqual(e.originals,originals,'current-main 원본 SHA 고정');
 assert.deepEqual(Object.keys(e.sources).sort(),[...reviewed,...added].sort());
 const zip=await readFile(new URL(e.archive.path,root));assert.equal(zip.length,e.archive.bytes);assert.equal(sha(zip),e.archive.sha256);
 const raw=gunzipSync(zip);assert.equal(sha(raw),e.archive.decodedSha256);const rows=JSON.parse(raw);
 for(const r of rows){const b=Buffer.from(r.base64,'base64');assert.equal(b.length,r.bytes);assert.equal(sha(b),r.sha256)}
 for(const [p,h] of Object.entries(e.originals))assert(rows.some(r=>r.path==='original/'+p&&r.sha256===h));
 for(const [p,h] of Object.entries(e.sources))assert.equal(await initialTableSourceHash(p),h,p+' current reviewed bytes');
 const original=p=>Buffer.from(rows.find(r=>r.path==='original/'+p).base64,'base64').toString();
 for(const n of ['scout-return','squad-staging','squad-observer-information']){const p='scripts/'+n+'-acceptance.mjs';assert.equal(await initialTableSourceText(p),original(p).replaceAll("'ui-squad-table.js'","'ui-squad-status.js','ui-squad-table.js'"),'기존 모든 assertion·실제 의존성만 추가')}
 const p='scripts/squad-table-source-successor.mjs',prefix="import {squadStatusSourceHash,squadStatusSourceText} from './squad-status-source-successor.mjs';\n";
 assert.equal(await initialTableSourceText(p),prefix+original(p).split('\n').map(l=>{
  if(l.startsWith(' for(const [path,h] of Object.entries(e.sources))')||l.startsWith('export async function squadTableSourceHash('))l=l.replace('sha(await readFile(new URL(path,root)))','await squadStatusSourceHash(path)');
  if(l.startsWith(' for(const name of ')||l.startsWith(' assert.equal(await readFile(new URL(path,root)'))l=l.replace("await readFile(new URL(path,root),'utf8')",'await squadStatusSourceText(path)');
  if(l.startsWith('export async function squadTableSourceText('))l=l.replace("readFile(new URL(path,root),'utf8')",'squadStatusSourceText(path)');return l;
 }).join('\n'),'이전 검증 assertion·원문 SHA 유지');
 const a='scripts/squad-table-acceptance.mjs';assert.deepEqual((await readFile(new URL(a,root),'utf8')).split('\n').filter(x=>x.includes('assert')),original(a).split('\n').filter(x=>x.includes('assert')),'기존 표 모든 assertion 유지');
 for(const [p,h] of Object.entries(e.engine))assert.equal(sha(await readFile(new URL('src/artifact/'+p,root))),h);assert.equal(Object.keys(e.engine).length,101);
 for(const p of ['docs/README.md','docs/DEVELOPMENT.md'])assert((await readFile(new URL(p,root))).includes(Buffer.from(rows.find(r=>r.path==='original/'+p).base64,'base64')),'전체 승인 원문 연속 보존');
 await import('./squad-status-acceptance.mjs');verified={e,rows};return verified;
}
export async function squadStatusSourceHash(p){const {e}=await verify();return e.originals[p]||await initialTableSourceHash(p)}
export async function squadStatusSourceText(p){const {e,rows}=await verify();return e.originals[p]?Buffer.from(rows.find(r=>r.path==='original/'+p).base64,'base64').toString():initialTableSourceText(p)}
