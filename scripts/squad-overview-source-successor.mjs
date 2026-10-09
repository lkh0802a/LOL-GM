import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const root=new URL('../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
const originals={"src/artifact/ui-roster.js": "b444b38b0491c9002ed5098100c369ef35d10d318a76f8e82412f27f1f3b304b", "src/artifact/ui-squad-controls.js": "600a2a1649019e51ce2c6f3e3974217a9c013544de03172d25f3379e4192c6c7", "src/artifact/ui-state.js": "451ed86d4bb2356cb98968923f45ad07f07c54ce7280f7c876c60f4a3c22a884", "index.html": "ab0c871aca7ef641fd77889b1b455cf5a3343f892f40c46cce3fbadef328bba8", "scripts/club-home-source-successor.mjs": "59921121fe5cad03923077ff2fba942de0d9404a71ac3d04d402bff81f5f4d11", "scripts/verify-regression-runner-evidence.mjs": "e67cb4349eea090f23e5693585b92062b6794e461db87d9367433103a4cc1bda", "scripts/scout-return-acceptance.mjs": "3446d4777f496985dd82773a03d1b41f311a09fc0135d89efa87552e87aab67e", "src/artifact/ui-squad-preparation.js": "33fb7b3c15b003fa38b9d4b194f4695489191092141f626e6f5facf47defdf09"};
let verified;
async function verify(){
 if(verified)return verified;
 const e=JSON.parse(await readFile(new URL('docs/evidence/squad-overview-2026-10-09.json',root)));
 assert.deepEqual(e.originals,originals,'승계 대상은 검토한 current-main 원문만 허용');
 const compressed=await readFile(new URL(e.archive.path,root));assert.equal(sha(compressed),e.archive.sha256);assert.equal(compressed.length,e.archive.bytes);
 const bytes=gunzipSync(compressed);assert.equal(sha(bytes),e.archive.decodedSha256);const rows=JSON.parse(bytes);
 for(const row of rows){const b=Buffer.from(row.base64,'base64');assert.equal(b.length,row.bytes);assert.equal(sha(b),row.sha256)}
 for(const [path,h] of Object.entries(originals))assert(rows.some(x=>x.path==='original/'+path&&x.sha256===h),path+' 이전 원문 보존');
 assert.deepEqual(Object.keys(e.sources).sort(),[...Object.keys(originals),'scripts/squad-overview-acceptance.mjs','scripts/squad-overview-source-successor.mjs'].sort(),'승계 source 목록 누락/확대 거절');
 for(const [path,h] of Object.entries(e.sources))assert.equal(sha(await readFile(new URL(path,root))),h,path+' 검토한 현재 바이트');
 const originalText=path=>Buffer.from(rows.find(x=>x.path==='original/'+path).base64,'base64').toString();
 const dependency='scripts/scout-return-acceptance.mjs';assert.equal(await readFile(new URL(dependency,root),'utf8'),originalText(dependency).replace("['ui-roster.js'","['ui-squad-controls.js','ui-roster.js'"),'기존 scout-return 모든 assertion 원문·의존성만 추가');
 for(const path of ['scripts/club-home-source-successor.mjs','scripts/verify-regression-runner-evidence.mjs']){
  const prefix="import {squadOverviewSourceHash} from './squad-overview-source-successor.mjs';\n";
  const transformed=originalText(path).replaceAll("sha(await readFile(new URL(p,root)))","await squadOverviewSourceHash(p)").replaceAll("sha(await readFile(new URL(path,root)))","await squadOverviewSourceHash(path)");
  assert.equal(await readFile(new URL(path,root),'utf8'),prefix+transformed,path+' 기존 assertion 원문·정확한 승계 hash 호출만 변경');
 }
 for(const [path,h] of Object.entries(e.engine))assert.equal(sha(await readFile(new URL('src/artifact/'+path,root))),h,path+' 엔진 원문 유지');assert.equal(Object.keys(e.engine).length,101);
 for(const file of ['docs/README.md','docs/DEVELOPMENT.md']){const row=rows.find(x=>x.path==='original/'+file);assert(row);assert((await readFile(new URL(file,root))).includes(Buffer.from(row.base64,'base64')),file+' 전체 원문 연속 보존')}
 await import('./squad-overview-acceptance.mjs');verified=e;return e;
}
export async function squadOverviewSourceHash(path){
 const actual=sha(await readFile(new URL(path,root)));if(!Object.hasOwn(originals,path))return actual;
 await verify();return originals[path];
}
export {verify as verifySquadOverviewSources};
