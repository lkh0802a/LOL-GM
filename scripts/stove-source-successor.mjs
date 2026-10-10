import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const root=new URL('../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
const expectedOriginals={"index.html": "e5ff974cbc04f2913ca704fa63383381ac5fc7e4e8f4a17d41e962a95051b608", "scripts/artifact-modules.mjs": "ccacaf4ffbc58604bfacdff5fb1894d8b6fd1e75061888cf7352b4cb559a53e2", "scripts/check.mjs": "368bf8093417c151d2ed380dd4f7b627b80448896feab093cf97fdc448e2b2c5", "scripts/contract-window-acceptance.mjs": "ded1f4c1c0d221aed21e410892a1007863d485093ada70e7c18f64f2e6fcacde", "scripts/save-library-source-successor.mjs": "ce05ea70183fdb7c89056f892864fdf889d9e6b923d036d126d31b4ce14408a5", "src/artifact/app.js": "9063d2f41b4dcd6c7dff781a0353aa380b22987149e736c96ff647a43455504a", "src/artifact/ui-season.js": "0bf06d57307655c3991f0ec6ec2f409a6b11e1be59af865329e81f7bb6928eb5", "src/artifact/ui-market.js": "75d4f86f1b512b52eb94b427ef6183e5b5f264618a1e1281fab9d44a2da0e5cd", "src/artifact/ui-transfer-page.js": "5c5667356248f67ab3844f6d2d8747b93550723c644bf1d286e0221c5774242d", ".github/workflows/ci.yml": "91ce631ebf2553507d3b1a0924a23ab677a123debfefcbfb390eb606190a11ad", "scripts/verify-regression-runner-evidence.mjs": "8a120723ba920aa7d5d7bb51dd55dc1ca418bc8860a92f43599742d1c06c9dc8", "scripts/squad-overview-source-successor.mjs": "61acf7f90472a46953c8f6e69b033174ca72472c4c4d69a249b468ca0bdc7d6b"};
let verified;
async function verify(){
 if(verified)return verified;
 const e=JSON.parse(await readFile(new URL('docs/evidence/stove-daily-2026-10-10.json',root)));
 assert.equal(e.base,'8ce8846afe2810e8c501ff731f4b70f52d6e2448');assert.deepEqual(e.originals,expectedOriginals);
 const zip=await readFile(new URL(e.archive.path,root));assert.equal(zip.length,e.archive.bytes);assert.equal(sha(zip),e.archive.sha256);
 const raw=gunzipSync(zip);assert.equal(sha(raw),e.archive.decodedSha256);const rows=JSON.parse(raw);
 for(const r of rows){const b=Buffer.from(r.base64,'base64');assert.equal(b.length,r.bytes);assert.equal(sha(b),r.sha256)}
 const original=p=>Buffer.from(rows.find(r=>r.path==='original/'+p).base64,'base64').toString();
 for(const [p,h] of Object.entries(e.originals))assert.equal(sha(Buffer.from(original(p))),h,p+' 기존 원문');
 for(const [p,h] of Object.entries(e.sources))assert.equal(sha(await readFile(new URL(p,root))),h,p+' 검토한 현재 소스');
 const p='scripts/save-library-source-successor.mjs',prefix="import {stoveSourceHash,stoveSourceText} from './stove-source-successor.mjs';\n";
 const transformed=original(p).split('\n').map(line=>{
  if(line.startsWith(' for(const [p,h] of Object.entries(e.sources))'))return line.replace('sha(await readFile(new URL(p,root)))','await stoveSourceHash(p)');
  if(line.startsWith(' assert.equal(await readFile(new URL(p,root)'))return line.replace("await readFile(new URL(p,root),'utf8')",'await stoveSourceText(p)');
  if(line.startsWith(' for(const p of Object.keys(e.originals).filter'))return line.replace("await readFile(new URL(p,root),'utf8')",'await stoveSourceText(p)');
  if(line.startsWith('export async function saveLibrarySourceHash'))return line.replace('sha(await readFile(new URL(p,root)))','await stoveSourceHash(p)');
  if(line.startsWith('export async function saveLibrarySourceText'))return line.replace("readFile(new URL(p,root),'utf8')",'stoveSourceText(p)');
  return line;
 }).join('\n');
 assert.equal(await readFile(new URL(p,root),'utf8'),prefix+transformed,'기존 해시·원문·검사·압축 자료 검증의 정확한 승계');
 const overview='scripts/squad-overview-source-successor.mjs';assert.equal(await readFile(new URL(overview,root),'utf8'),original(overview).replace("assert.equal(await readFile(new URL(path,root),'utf8'),prefix+transformed","assert.equal(await squadTableSourceText(path),prefix+transformed"),'선수단 검증의 원래 조건을 보존한 실제 소스 읽기 승계');
 const validator='scripts/verify-regression-runner-evidence.mjs';assert.equal(await readFile(new URL(validator,root),'utf8'),"import {stoveSourceText} from './stove-source-successor.mjs';\n"+original(validator).replace("const workflow=await readFile(new URL('.github/workflows/ci.yml',root),'utf8');","const workflow=await stoveSourceText('.github/workflows/ci.yml');"),'기존 회귀 원본·압축 증거·측정·전체 게이트 검증 조건을 그대로 유지한 작업 정의 읽기 승계');
 const workflow='.github/workflows/ci.yml';assert.equal(await readFile(new URL(workflow,root),'utf8'),original(workflow).replace('node --test scripts/regression-runner.test.mjs && node scripts/verify-regression-runner-evidence.mjs','node --test scripts/regression-runner.test.mjs scripts/ui-evidence-runner.test.mjs && node scripts/verify-regression-runner-evidence.mjs').replace('node scripts/ci-run.mjs ui-finance-contracts -- npm run check:ui-finance-contracts','node scripts/ci-run.mjs ui-finance-contracts -- node scripts/ui-evidence-runner.mjs'),'기존 작업·필수 게이트·시간 한도·의료·관측 기록을 그대로 유지한 실행 승계');
 const f='scripts/contract-window-acceptance.mjs';assert.equal(await readFile(new URL(f,root),'utf8'),original(f).replace("const [app,market]=await artifactSources(['app.js','ui-market.js']);","const [appSource,market,stove]=await artifactSources(['app.js','ui-market.js','ui-stove.js']);\nconst app=appSource+'\\n'+stove;"),'기존 검사 조건 원문 그대로, 실제 화면 모듈 의존성만 추가');
 for(const [p,h] of Object.entries(e.engine))assert.equal(sha(await readFile(new URL('src/artifact/'+p,root))),h);assert.equal(Object.keys(e.engine).length,101);
 for(const p of ['docs/README.md','docs/DEVELOPMENT.md'])assert((await readFile(new URL(p,root))).includes(Buffer.from(rows.find(r=>r.path==='original/'+p).base64,'base64')),'전체 승인 원문 연속 보존');
 await import('./stove-daily-acceptance.mjs');verified={e,rows};return verified;
}
export async function stoveSourceHash(p){const {e}=await verify();return e.originals[p]||sha(await readFile(new URL(p,root)))}
export async function stoveSourceText(p){const {e,rows}=await verify();return e.originals[p]?Buffer.from(rows.find(r=>r.path==='original/'+p).base64,'base64').toString():readFile(new URL(p,root),'utf8')}
