import {negotiationFinalSourceHash,negotiationFinalSourceText} from './negotiation-final-source-successor.mjs';
import {currentGuideSourceHash} from './current-guide-source-successor.mjs';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const root=new URL('../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
let verified;
async function verify(){
 if(verified)return verified;
 const e=JSON.parse(await readFile(new URL('docs/evidence/negotiation-summary-2026-10-11.json',root)));
 assert.equal(e.base,'49588dbf786bf49dbda6c136a5e89afa72841413');
 const zip=await readFile(new URL(e.archive.path,root));assert.equal(zip.length,e.archive.bytes);assert.equal(sha(zip),e.archive.sha256);
 const raw=gunzipSync(zip);assert.equal(sha(raw),e.archive.decodedSha256);const rows=JSON.parse(raw);assert.equal(rows.length,e.archive.rows);
 for(const r of rows){const b=Buffer.from(r.base64,'base64');assert.equal(b.length,r.bytes);assert.equal(sha(b),r.sha256)}
 const original=p=>Buffer.from(rows.find(r=>r.path==='original/'+p).base64,'base64').toString();
 for(const [p,h] of Object.entries(e.originals))assert.equal(sha(Buffer.from(original(p))),h);
 for(const [p,h] of Object.entries(e.sources))assert.equal(await currentGuideSourceHash(p),h,p);
 const p='scripts/initial-negotiation-review-source-successor.mjs';
 let expected="import {negotiationSummarySourceHash,negotiationSummarySourceText} from './negotiation-summary-source-successor.mjs';\n"+original(p);
 expected=expected.replace('for(const [p,h] of Object.entries(e.sources))assert.equal(sha(await readFile(new URL(p,root))),h,p);','for(const [p,h] of Object.entries(e.sources))assert.equal(await negotiationSummarySourceHash(p),h,p);').replace("assert.equal(await readFile(new URL('.github/workflows/ci.yml',root),'utf8'),workflow","assert.equal(await negotiationSummarySourceText('.github/workflows/ci.yml'),workflow");
 assert.equal(await negotiationFinalSourceText(p),expected,'기존 증거·단언을 보존한 현재 소스 검사 승계');
 assert.equal(await readFile(new URL('.github/workflows/ci.yml',root),'utf8'),original('.github/workflows/ci.yml').replace('      - name: Upload validation report\n','      - name: 협상 요약과 실제 제안 기록\n        run: node scripts/ci-run.mjs negotiation-summary -- node scripts/negotiation-summary-acceptance.mjs\n\n      - name: Upload validation report\n'),'기존 작업·시간 제한과 모든 검사 유지');
 assert.equal(Object.keys(e.engine).length,101);for(const [p,h] of Object.entries(e.engine))assert.equal(sha(await readFile(new URL('src/artifact/'+p,root))),h,p+' 기존 엔진 불변');
 for(const p of ['docs/README.md','docs/DEVELOPMENT.md'])assert((await readFile(new URL(p,root),'utf8')).includes(original(p)),'전체 승인 원문 연속 보존');
 verified={e,rows};return verified;
}
export async function negotiationSummarySourceHash(p){const {e}=await verify();return e.originals[p]||await negotiationFinalSourceHash(p)}
export async function negotiationSummarySourceText(p){const {e,rows}=await verify();return e.originals[p]?Buffer.from(rows.find(r=>r.path==='original/'+p).base64,'base64').toString():negotiationFinalSourceText(p)}
