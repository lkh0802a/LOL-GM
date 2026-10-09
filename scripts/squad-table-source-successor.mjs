import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const root=new URL('../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
const originals={"index.html":"230bd972b1069c835710aef55d8f92151834150c0aaf46a7cc7cdc3035f6182c","scripts/artifact-modules.mjs":"d16106f4eee918208615cc8d6c1dd9929ec71bc0d3748bbc81e240208c84a48d","scripts/check.mjs":"db5040d1158fcf1122af0b5ab1857f604d828e1b1047966502ad6c90e919cb82","scripts/scout-return-acceptance.mjs":"65485d18effdca39ff30df67d60d1334b1819220f86a6fc5a5c9db52d6d27919","scripts/squad-observer-information-acceptance.mjs":"5e73edf4c21f9471ec94b7e326a5cc3c5e277054573b428de4d9e00604b3ef8c","scripts/squad-overview-source-successor.mjs":"edd83f12a8e2fcd1e17a88bcf43bc1778c1e9c73a31baa4095875252d38feae3","scripts/squad-staging-acceptance.mjs":"13c85dbb67dabda1cc829ba8c464c1a25d717d1d266403aab2065e487bea89a0","src/artifact/ui-roster.js":"300a31390247f9dd884501005f8f6d84d62d68629aebc29b8ed86bd78f57f107","scripts/ui-mobile-a11y-acceptance.mjs":"252e8919e867ad4d08ca12eb844f2a114a092110c91bcb8633763391263dbae2"};
let verified;
async function verify(){
 if(verified)return verified;
 const e=JSON.parse(await readFile(new URL('docs/evidence/squad-table-2026-10-09.json',root)));
 assert.deepEqual(e.originals,originals,'검토한 base 원문 whitelist 고정');
 assert.deepEqual(Object.keys(e.sources).sort(),[...Object.keys(originals),'src/artifact/ui-squad-table.js','scripts/squad-table-acceptance.mjs','scripts/squad-table-source-successor.mjs'].sort(),'승계 목록 누락/확대 거절');
 const compressed=await readFile(new URL(e.archive.path,root));assert.equal(sha(compressed),e.archive.sha256);assert.equal(compressed.length,e.archive.bytes);
 const raw=gunzipSync(compressed);assert.equal(sha(raw),e.archive.decodedSha256);const rows=JSON.parse(raw);
 for(const row of rows){const b=Buffer.from(row.base64,'base64');assert.equal(b.length,row.bytes);assert.equal(sha(b),row.sha256)}
 for(const [path,h] of Object.entries(e.originals))assert(rows.some(row=>row.path==='original/'+path&&row.sha256===h),path+' 원문 보존');
 for(const [path,h] of Object.entries(e.sources))assert.equal(sha(await readFile(new URL(path,root))),h,path+' reviewed bytes');
 const original=path=>Buffer.from(rows.find(row=>row.path==='original/'+path).base64,'base64').toString();
 for(const name of ['scout-return','squad-staging','squad-observer-information']){const path='scripts/'+name+'-acceptance.mjs';assert.equal(await readFile(new URL(path,root),'utf8'),original(path).replaceAll("'ui-roster.js'","'ui-squad-table.js','ui-roster.js'"),path+' 원래 assertion 전체·의존성만 추가')}
 const a11y='scripts/ui-mobile-a11y-acceptance.mjs';const a11yOriginal=original(a11y);const a11yCurrent=await readFile(new URL(a11y,root),'utf8');assert.deepEqual(a11yCurrent.split('\n').filter(x=>x.trim().startsWith('assert')),a11yOriginal.split('\n').filter(x=>x.trim().startsWith('assert')),'모든 기존 접근성 assertion 원문 유지');
 const path='scripts/squad-overview-source-successor.mjs',prefix="import {squadTableSourceHash,squadTableSourceText} from './squad-table-source-successor.mjs';\n";
 const transformed=original(path).replace("assert.equal(sha(await readFile(new URL(path,root))),h","assert.equal(await squadTableSourceHash(path),h").replace("const actual=sha(await readFile(new URL(path,root)));","const actual=await squadTableSourceHash(path);").replace("assert.equal(await readFile(new URL(dependency,root),'utf8'),","assert.equal(await squadTableSourceText(dependency),");
 assert.equal(await readFile(new URL(path,root),'utf8'),prefix+transformed,'이전 검증의 모든 assertion 원문 유지·좁힌 승계');
 for(const [path,h] of Object.entries(e.engine))assert.equal(sha(await readFile(new URL('src/artifact/'+path,root))),h);assert.equal(Object.keys(e.engine).length,101);
 for(const path of ['docs/README.md','docs/DEVELOPMENT.md'])assert((await readFile(new URL(path,root))).includes(Buffer.from(rows.find(row=>row.path==='original/'+path).base64,'base64')),path+' 전체 연속 원문 유지');
 await import('./squad-table-acceptance.mjs');verified={e,rows};return verified;
}
export async function squadTableSourceHash(path){const actual=sha(await readFile(new URL(path,root)));const {e}=await verify();return e.originals[path]||actual}
export async function squadTableSourceText(path){const {rows,e}=await verify();return e.originals[path]?Buffer.from(rows.find(row=>row.path==='original/'+path).base64,'base64').toString():readFile(new URL(path,root),'utf8')}
