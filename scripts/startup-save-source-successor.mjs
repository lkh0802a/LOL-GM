import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const root=new URL('../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
const pins={"src/artifact/app.js":"dbac858105a0dbedfef5d2c4d48039308c28f69653124ceccc4836abcddf69f2","src/artifact/ui-startup.js":"b6acb95c3085613aad1ea6c9af7fd5133e018508078ee2cf582c018514e8dcd0","src/artifact/ui-save-library.js":"99bb40e2db337143a65a7f5751ba5afa624c57958254390e60f8a1f1ba486264","scripts/startup-flow-acceptance.mjs":"0198543f9dc6f71c8b957fad0a201cc7d54c45c22f21791247627c7a3496801b","scripts/stove-fa-source-successor.mjs":"01b9bd898e54832976be8917864d79aa93e5fcb8563153dcb57f47dabb51a0d3","index.html":"c3d9a5c80438a94fa54a0a690c9d9eab9f5a588f2a0d1d039e7d225a48c736dd","scripts/check.mjs":"f2d4c1653709250cf0eb8207f66dc8e4aaa1c76b1083f943e8f934f70f9c36dd","scripts/artifact-modules.mjs":"62d46cd76d728f073071d758730650bc613b962f514272147f5805ef82294808",".github/workflows/ci.yml":"d0fd8cd0a6ed4353110cb999007c98a6cacaeb55525d504607daa45bad2fb684"};
let verified;
async function verify(){
 if(verified)return verified;
 const e=JSON.parse(await readFile(new URL('docs/evidence/startup-save-library-2026-10-10.json',root)));
 assert.equal(e.base,'8f6ee6b4f3d7bab09effcc81f96c5803b43562d3');assert.deepEqual(e.originals,pins);
 const zip=await readFile(new URL(e.archive.path,root));assert.equal(zip.length,e.archive.bytes);assert.equal(sha(zip),e.archive.sha256);const raw=gunzipSync(zip);assert.equal(sha(raw),e.archive.decodedSha256);const rows=JSON.parse(raw);assert.equal(rows.length,e.archive.rows);
 for(const r of rows){const b=Buffer.from(r.base64,'base64');assert.equal(b.length,r.bytes);assert.equal(sha(b),r.sha256)}
 const original=p=>Buffer.from(rows.find(r=>r.path==='original/'+p).base64,'base64').toString();
 for(const [p,h] of Object.entries(pins))assert.equal(sha(Buffer.from(original(p))),h);
 for(const [p,h] of Object.entries(e.sources))assert.equal(sha(await readFile(new URL(p,root))),h);
 const p='scripts/stove-fa-source-successor.mjs';let expected="import {startupSaveSourceHash,startupSaveSourceText} from './startup-save-source-successor.mjs';\n"+original(p);
 expected=expected.replace(" for(const [p,h] of Object.entries(e.sources))assert.equal(sha(await readFile(new URL(p,root))),h);"," for(const [p,h] of Object.entries(e.sources))assert.equal(await startupSaveSourceHash(p),h);").replace("export async function stoveFaSourceHash(p){const {e}=await verify();return e.originals[p]||sha(await readFile(new URL(p,root)))}","export async function stoveFaSourceHash(p){const {e}=await verify();return e.originals[p]||await startupSaveSourceHash(p)}").replace("export async function stoveFaSourceText(p){const {e,rows}=await verify();return e.originals[p]?Buffer.from(rows.find(r=>r.path==='original/'+p).base64,'base64').toString():readFile(new URL(p,root),'utf8')}","export async function stoveFaSourceText(p){const {e,rows}=await verify();return e.originals[p]?Buffer.from(rows.find(r=>r.path==='original/'+p).base64,'base64').toString():startupSaveSourceText(p)}");
 assert.equal(await readFile(new URL(p,root),'utf8'),expected,'원래 검증 조건·해시·자료를 보존한 현재 소스 연결');
 const f='scripts/startup-flow-acceptance.mjs';assert.equal(await readFile(new URL(f,root),'utf8'),original(f).replace("viewStartup().includes('저장 슬롯 복원')","viewStartup().includes('저장된 게임')").replace("const [startup,app,data,setup,themeSource,saveLibrary]=","const [startupSource,startupStorage,app,data,setup,themeSource,saveLibrary]=").replace("['ui-startup.js','app.js'","['ui-startup.js','ui-startup-storage.js','app.js'").replace("const storage=app.slice","const startup=startupSource+'\\n'+startupStorage;\nconst storage=app.slice"),'화면 명칭만 교정하고 기존 검사 조건 보존');
 assert.equal(await readFile(new URL('scripts/artifact-modules.mjs',root),'utf8'),original('scripts/artifact-modules.mjs').replace("  'ui-startup.js',","  'ui-startup-storage.js',\n  'ui-startup.js',"),'기존 순서 유지와 저장 전달 화면만 추가');
 assert.equal(await readFile(new URL('scripts/check.mjs',root),'utf8'),original('scripts/check.mjs').replace("  'ui-startup.js': 7000,","  'ui-startup.js': 7000,\n  'ui-startup-storage.js': 5500,"),'기존 크기 제한 유지와 새 파일 제한');
 assert.equal(await readFile(new URL('.github/workflows/ci.yml',root),'utf8'),original('.github/workflows/ci.yml').replace('      - name: Upload validation report\n','      - name: 시작 저장 복원과 빈 저장 선택\n        run: node scripts/ci-run.mjs startup-save -- node scripts/startup-save-acceptance.mjs\n\n      - name: Upload validation report\n'),'기존 작업·시간 제한 유지와 독립 저장 검사만 추가');
 for(const [p,h] of Object.entries(e.engine))assert.equal(sha(await readFile(new URL('src/artifact/'+p,root))),h);assert.equal(Object.keys(e.engine).length,101);
 for(const p of ['docs/README.md','docs/DEVELOPMENT.md'])assert((await readFile(new URL(p,root),'utf8')).includes(original(p)),'전체 승인 원문 연속 보존');
 verified={e,rows};return verified;
}
export async function startupSaveSourceHash(p){const {e}=await verify();return e.originals[p]||sha(await readFile(new URL(p,root)))}
export async function startupSaveSourceText(p){const {e,rows}=await verify();return e.originals[p]?Buffer.from(rows.find(r=>r.path==='original/'+p).base64,'base64').toString():readFile(new URL(p,root),'utf8')}
