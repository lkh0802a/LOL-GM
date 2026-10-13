import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const root=new URL('../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
let verified;
async function verify(){
 if(verified)return verified;
 const e=JSON.parse(await readFile(new URL('docs/evidence/negotiation-final-2026-10-13.json',root)));
 assert.equal(e.base,'8fa903c5bbaf27b66911efa4b9b5fcc34704a5d2');
 const paths=['docs/README.md','docs/DEVELOPMENT.md','index.html','scripts/artifact-modules.mjs','scripts/current-guide-source-successor.mjs','scripts/negotiation-summary-acceptance.mjs'];
 assert.deepEqual(Object.keys(e.originals),paths);
 assert.deepEqual(Object.keys(e.sources),[...paths,'src/artifact/negotiation-final.js','src/artifact/ui-negotiation-final.js','scripts/negotiation-final-acceptance.mjs','scripts/negotiation-final-source-successor.mjs']);
 const zip=await readFile(new URL(e.archive.path,root));assert.equal(zip.length,e.archive.bytes);assert.equal(sha(zip),e.archive.sha256);
 const raw=gunzipSync(zip);assert.equal(sha(raw),e.archive.decodedSha256);const rows=JSON.parse(raw);assert.equal(rows.length,6);assert.equal(e.archive.rows,6);assert.deepEqual(rows.map(r=>r.path),paths.map(p=>'original/'+p));
 const original={};for(const r of rows){const p=r.path.slice(9),b=Buffer.from(r.base64,'base64');assert.equal(b.length,r.bytes);assert.equal(sha(b),r.sha256);assert.equal(sha(b),e.originals[p]);original[p]=b.toString()}
 for(const [p,h] of Object.entries(e.sources))assert.equal(sha(await readFile(new URL(p,root))),h,p);
 for(const p of paths.slice(0,2))assert((await readFile(new URL(p,root),'utf8')).endsWith(original[p]),p+' 전체 원문 연속 보존');
 const guide='scripts/current-guide-source-successor.mjs';
 const expected=("import {negotiationFinalSourceHash} from './negotiation-final-source-successor.mjs';\n"+original[guide]).replace('assert.equal(sha(b),e.sources[p],p)','assert.equal(await negotiationFinalSourceHash(p),e.sources[p],p)').replace('return e.originals[p]||sha(await readFile(new URL(p,root)))','return e.originals[p]||await negotiationFinalSourceHash(p)');
 assert.equal(await readFile(new URL(guide,root),'utf8'),expected,'기존 증거·역사·단언 승계만 변경');
 assert.equal(await readFile(new URL(paths[5],root),'utf8'),"await import('./negotiation-final-acceptance.mjs');\n"+original[paths[5]],'기존 협상 검사 전체 보존·새 실제 연결 검사 추가');
 assert.equal(await readFile(new URL(paths[3],root),'utf8'),original[paths[3]].replace("  'career.js',\n","  'career.js',\n  'negotiation-final.js',\n").replace("  'ui-negotiations.js',\n","  'ui-negotiations.js',\n  'ui-negotiation-final.js',\n"),'기존 모듈 순서 보존');
 verified=e;return e;
}
export async function negotiationFinalSourceHash(p){const e=await verify();return e.originals[p]||sha(await readFile(new URL(p,root)))}
