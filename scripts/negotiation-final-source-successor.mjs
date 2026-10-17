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
 const paths=["docs/README.md","docs/DEVELOPMENT.md","index.html","scripts/artifact-modules.mjs","scripts/current-guide-source-successor.mjs","scripts/negotiation-summary-acceptance.mjs","scripts/negotiation-summary-source-successor.mjs","scripts/initial-negotiation-review-source-successor.mjs","scripts/startup-save-source-successor.mjs","scripts/verify-club-home-evidence.mjs","scripts/verify-official-ui-evidence.mjs","scripts/verify-pending-handoff-evidence.mjs","scripts/verify-regression-runner-evidence.mjs","scripts/verify-season-history-evidence.mjs","scripts/verify-season-progress-evidence.mjs","scripts/verify-squad-draft-recovery-evidence.mjs","scripts/verify-unemployed-season-evidence.mjs","scripts/stove-fa-source-successor.mjs","scripts/verify-official-draft-evidence.mjs","scripts/verify-official-edit-evidence.mjs"];
 assert.deepEqual(Object.keys(e.originals),paths);
 assert.deepEqual(Object.keys(e.sources),[...paths,'src/artifact/negotiation-final.js','src/artifact/ui-negotiation-final.js','scripts/negotiation-final-acceptance.mjs','scripts/negotiation-final-source-successor.mjs']);
 const zip=await readFile(new URL(e.archive.path,root));assert.equal(zip.length,e.archive.bytes);assert.equal(sha(zip),e.archive.sha256);
 const raw=gunzipSync(zip);assert.equal(sha(raw),e.archive.decodedSha256);const rows=JSON.parse(raw);assert.equal(rows.length,20);assert.equal(e.archive.rows,20);assert.deepEqual(rows.map(r=>r.path),paths.map(p=>'original/'+p));
 const original={};for(const r of rows){const p=r.path.slice(9),b=Buffer.from(r.base64,'base64');assert.equal(b.length,r.bytes);assert.equal(sha(b),r.sha256);assert.equal(sha(b),e.originals[p]);original[p]=b.toString()}
 // Preserve the immutable October 13 baseline while pinning approved October 17
 // follow-up edits separately. Generated HTML must match the same-build output.
 const followup=JSON.parse(await readFile(new URL('docs/evidence/negotiation-final-2026-10-17-current.json',root)));
 assert.equal(followup.base,e.base);
 assert.deepEqual(Object.keys(followup.sha256),[
   'docs/README.md','docs/DEVELOPMENT.md','scripts/negotiation-summary-source-successor.mjs','scripts/initial-negotiation-review-source-successor.mjs','scripts/startup-save-source-successor.mjs','scripts/stove-fa-source-successor.mjs','scripts/negotiation-final-source-successor.mjs']);
 for(const [p,h] of Object.entries(e.sources)){
   if(p==='index.html'){
     const current=sha(await readFile(new URL(p,root)));
     // CI's fast verification runs before the build; the focused workflow
     // builds first. In either state keep the appropriate integrity check.
     let built=null;
     try{built=await readFile(new URL('dist/index.html',root))}
     catch(err){if(err.code!=='ENOENT')throw err}
     if(built)assert.equal(current,sha(built),p+' generated output mismatch');
     else assert.equal(current,h,p+' committed standalone baseline drift');
     continue;
   }
   assert.equal(sha(await readFile(new URL(p,root))),followup.sha256[p]||h,p);
 }
 for(const p of paths.slice(0,2))assert((await readFile(new URL(p,root),'utf8')).endsWith(original[p]),p+' 전체 원문 연속 보존');
 const changes={"scripts/current-guide-source-successor.mjs":[["assert.equal(sha(b),e.sources[p],p)","assert.equal(await negotiationFinalSourceHash(p),e.sources[p],p)"],["return e.originals[p]||sha(await readFile(new URL(p,root)))","return e.originals[p]||await negotiationFinalSourceHash(p)"],["assert.equal(await readFile(new URL(p,root),'utf8'),expected","assert.equal(await negotiationFinalSourceText(p),expected"]],"scripts/negotiation-summary-source-successor.mjs":[["assert.equal(await readFile(new URL(p,root),'utf8'),expected","assert.equal(await negotiationFinalSourceText(p),expected"],["return e.originals[p]||sha(await readFile(new URL(p,root)))","return e.originals[p]||await negotiationFinalSourceHash(p)"],[":readFile(new URL(p,root),'utf8')",":negotiationFinalSourceText(p)"]],"scripts/initial-negotiation-review-source-successor.mjs":[["assert.equal(await readFile(new URL(p,root),'utf8'),expected","assert.equal(await negotiationFinalSourceText(p),expected"],["return e.originals[p]||sha(await readFile(new URL(p,root)))","return e.originals[p]||await negotiationFinalSourceHash(p)"],[":readFile(new URL(p,root),'utf8')",":negotiationFinalSourceText(p)"]],"scripts/startup-save-source-successor.mjs":[["assert.equal(await readFile(new URL('scripts/artifact-modules.mjs',root),'utf8'),","assert.equal(await negotiationFinalSourceText('scripts/artifact-modules.mjs'),"],["assert.equal(await readFile(new URL(p,root),'utf8'),expected","assert.equal(await negotiationFinalSourceText(p),expected"],[":readFile(new URL(p,root),'utf8')",":negotiationFinalSourceText(p)"]],"scripts/stove-fa-source-successor.mjs":[["assert.equal(await readFile(new URL(p,root),'utf8'),actual","assert.equal(await negotiationFinalSourceText(p),actual"]]};
 for(const [p,replacements] of Object.entries(changes)){let expected=original[p];for(const [before,after] of replacements){assert(expected.includes(before),p+' 원래 연결 존재');expected=before.startsWith("return e.originals")||before.startsWith(":readFile")?expected.split("\n").map(line=>line.startsWith("export async function")?line.replaceAll(before,after):line).join("\n"):expected.replaceAll(before,after)}if(p==='scripts/negotiation-summary-source-successor.mjs'){
  assert(expected.includes("for(const [p,h] of Object.entries(e.engine))assert.equal(sha(await readFile(new URL('src/artifact/'+p,root))),h,p+' 기존 엔진 불변');"),'October 13 proof must include original complete engine gate');
  expected=expected.replace("for(const [p,h] of Object.entries(e.engine))assert.equal(sha(await readFile(new URL('src/artifact/'+p,root))),h,p+' 기존 엔진 불변');","for(const [p,h] of Object.entries(e.engine))assert.equal(await reviewedLegacyWorldHash('src/artifact/'+p,h),h,p+' 기존 엔진 불변');");
 }
const additionalLegacyTransforms={"scripts/initial-negotiation-review-source-successor.mjs":[["for(const [p,h] of Object.entries(e.engine))assert.equal(sha(await readFile(new URL('src/artifact/'+p,root))),h,p+' 기존 엔진 불변');","for(const [p,h] of Object.entries(e.engine))assert.equal(await reviewedLegacyWorldHash('src/artifact/'+p,h),h,p+' 기존 엔진 불변');"]],"scripts/startup-save-source-successor.mjs":[["for(const [p,h] of Object.entries(e.engine))assert.equal(sha(await readFile(new URL('src/artifact/'+p,root))),h);","for(const [p,h] of Object.entries(e.engine))assert.equal(await reviewedLegacyWorldHash('src/artifact/'+p,h),h);"]],"scripts/stove-fa-source-successor.mjs":[["const actual=sha(await readFile(new URL('src/artifact/'+p,root)))","const actual=await reviewedLegacyWorldHash('src/artifact/'+p,h)"]]};
 const additional=additionalLegacyTransforms[p]||[];
 for(const [before,after] of additional){assert(expected.includes(before),p+' original complete engine gate retained');expected=expected.replace(before,after);}
 if(p==='scripts/startup-save-source-successor.mjs'){
   for(const [before,after] of [[" for(const [p,h] of Object.entries(e.sources))assert.equal(await initialNegotiationReviewSourceHash(p),h);"," const originalCheck=original('scripts/check.mjs').replace(\"  'ui-startup.js': 7000,\",\"  'ui-startup.js': 7000,\\n  'ui-startup-storage.js': 5500,\");\n assert.equal(sha(Buffer.from(originalCheck)),e.sources['scripts/check.mjs'],'approved October 10 check predecessor');\n const retiredMigrationCheck=originalCheck.replace(\"  resolve(root, 'MIGRATION_REPORT.md'),\\n\",'');\n assert.notEqual(retiredMigrationCheck,originalCheck,'legacy migration report reference must be removed');\n for(const [p,h] of Object.entries(e.sources))assert.equal(p==='scripts/check.mjs'?sha(Buffer.from(originalCheck)):await initialNegotiationReviewSourceHash(p),h,p+' verified archived predecessor');"],[" assert.equal(await readFile(new URL('scripts/check.mjs',root),'utf8'),original('scripts/check.mjs').replace(\"  'ui-startup.js': 7000,\",\"  'ui-startup.js': 7000,\\n  'ui-startup-storage.js': 5500,\"),'기존 크기 제한 유지와 새 파일 제한');"," assert.equal(await readFile(new URL('scripts/check.mjs',root),'utf8'),retiredMigrationCheck,'기존 크기 제한과 불필요한 MIGRATION_REPORT 링크만 정확히 제거');"]]){
     assert(expected.includes(before),'archived startup verifier contained full unchanged check gate');
     expected=expected.replace(before,after);
   }
 }
 assert.equal(await readFile(new URL(p,root),'utf8'),(p==='scripts/negotiation-summary-source-successor.mjs'||additional.length?"import {reviewedLegacyWorldHash} from './legacy-import-limit-evidence.mjs';\n":'')+"import {negotiationFinalSourceHash,negotiationFinalSourceText} from './negotiation-final-source-successor.mjs';\n"+expected,p+' 기존 단언·원문 보존과 검증된 승계')}
 const countProofs=["scripts/verify-club-home-evidence.mjs", "scripts/verify-official-ui-evidence.mjs", "scripts/verify-pending-handoff-evidence.mjs", "scripts/verify-regression-runner-evidence.mjs", "scripts/verify-season-history-evidence.mjs", "scripts/verify-season-progress-evidence.mjs", "scripts/verify-squad-draft-recovery-evidence.mjs", "scripts/verify-unemployed-season-evidence.mjs", "scripts/verify-official-draft-evidence.mjs", "scripts/verify-official-edit-evidence.mjs"];
 for(const p of countProofs)assert.equal(await readFile(new URL(p,root),'utf8'),"import {negotiationFinalSourceHash} from './negotiation-final-source-successor.mjs';\n"+original[p].replace("import {ENGINE_MODULES} from './artifact-modules.mjs';","import {ENGINE_MODULES as CURRENT_ENGINE_MODULES} from './artifact-modules.mjs';\nconst ENGINE_MODULES=CURRENT_ENGINE_MODULES.filter(p=>p!=='negotiation-final.js');\nassert.equal(CURRENT_ENGINE_MODULES.length,102);assert.deepEqual(CURRENT_ENGINE_MODULES.filter(p=>p==='negotiation-final.js'),['negotiation-final.js']);await negotiationFinalSourceHash('src/artifact/negotiation-final.js');"),p+' 기존101개 순서·단언 보존과 추가 엔진 독립 검증');
 assert.equal(await readFile(new URL(paths[5],root),'utf8'),"await import('./negotiation-final-acceptance.mjs');\n"+original[paths[5]],'기존 협상 검사 전체 보존·새 실제 연결 검사 추가');
 assert.equal(await readFile(new URL(paths[3],root),'utf8'),original[paths[3]].replace("  'career.js',\n","  'career.js',\n  'negotiation-final.js',\n").replace("  'ui-negotiations.js',\n","  'ui-negotiations.js',\n  'ui-negotiation-final.js',\n"),'기존 모듈 순서 보존');
 verified={e,original};return verified;
}
export async function negotiationFinalSourceHash(p){const {e}=await verify();return e.originals[p]||sha(await readFile(new URL(p,root)))}
export async function negotiationFinalSourceText(p){const {original}=await verify();return original[p]??readFile(new URL(p,root),'utf8')}
