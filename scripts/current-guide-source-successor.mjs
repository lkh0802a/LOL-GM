import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const root=new URL('../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
let verified;
async function verify(){
 if(verified)return verified;
 const e=JSON.parse(await readFile(new URL('docs/evidence/current-guide-2026-10-12.json',root)));
 assert.equal(e.base,'7622a625de58c9baf46becd0a400607152ba14d7');
 const paths=['docs/README.md','docs/DEVELOPMENT.md','scripts/negotiation-summary-source-successor.mjs'];
 assert.deepEqual(Object.keys(e.originals),paths);assert.deepEqual(Object.keys(e.sources),paths);
 const zip=await readFile(new URL(e.archive.path,root));assert.equal(zip.length,e.archive.bytes);assert.equal(sha(zip),e.archive.sha256);
 const raw=gunzipSync(zip);assert.equal(sha(raw),e.archive.decodedSha256);const rows=JSON.parse(raw);assert.equal(rows.length,3);assert.equal(rows.length,e.archive.rows);
 assert.deepEqual(rows.map(r=>r.path),paths.map(p=>'original/'+p));
 const original={};for(const r of rows){const p=r.path.slice(9),b=Buffer.from(r.base64,'base64');assert.equal(b.length,r.bytes);assert.equal(sha(b),r.sha256);assert.equal(sha(b),e.originals[p]);original[p]=b.toString()}
 for(const p of paths){const b=await readFile(new URL(p,root));assert.equal(sha(b),e.sources[p],p)}
 for(const p of paths.slice(0,2))assert((await readFile(new URL(p,root),'utf8')).endsWith(original[p]),p+' 전체 승인·역사 원문 연속 보존');
 const p=paths[2];
 const expected=("import {currentGuideSourceHash} from './current-guide-source-successor.mjs';\n"+original[p]).replace('for(const [p,h] of Object.entries(e.sources))assert.equal(sha(await readFile(new URL(p,root))),h,p);','for(const [p,h] of Object.entries(e.sources))assert.equal(await currentGuideSourceHash(p),h,p);');
 assert.equal(await readFile(new URL(p,root),'utf8'),expected,'기존 압축 증거·검사·엔진·작업·시간 제한 단언 보존');
 verified=e;return e;
}
export async function currentGuideSourceHash(p){const e=await verify();return e.originals[p]||sha(await readFile(new URL(p,root)))}
