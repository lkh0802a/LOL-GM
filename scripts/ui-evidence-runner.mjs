import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {runSequential,sourceSnapshot} from './regression-runner.mjs';
import {testHarnessStats} from './test-harness.mjs';

export const UI_EVIDENCE_MODULES=Object.freeze([
 'ui-finance-contracts-runner.mjs',
 'verify-club-recruitment-evidence.mjs',
 'verify-shortlist-comparison-evidence.mjs'
]);
export function uiEvidencePlan(command){
 const plan=command.split(' && ').map(part=>{
  const match=/^node scripts\/([a-z-]+\.mjs)$/.exec(part);
  assert(match,'지원하지 않는 화면 검사 명령: '+part);return match[1];
 });
 assert.deepEqual(plan,UI_EVIDENCE_MODULES,'기존 화면 검사 전체 순서가 달라졌습니다');
 return plan;
}
export async function runUiEvidence(){
 const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url)));
 const plan=uiEvidencePlan(pkg.scripts['check:ui-finance-contracts']);
 assert.equal(testHarnessStats().contexts,0,'화면 검사 시작 전에 실행 문맥이 생겼습니다');
 const rows=await runSequential(plan,{
  load:file=>import(new URL(file,import.meta.url)),snapshot:sourceSnapshot,
  report:row=>console.log('화면 증거 순차 검사 '+JSON.stringify(row))
 });
 const stats=testHarnessStats();
 assert.equal(stats.engineCompiles,1,'기존 엔진 컴파일은 한 번이어야 합니다');
 assert.equal(stats.contexts,89,'기존 화면 검사89개는 각각 새 문맥이어야 합니다');
 console.log('UI_EVIDENCE_RUNNER '+JSON.stringify({modules:rows.length,freshContexts:stats.contexts,engineCompiles:stats.engineCompiles,rows}));
 return rows;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await runUiEvidence();
