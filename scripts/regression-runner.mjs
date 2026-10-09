import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {pathToFileURL} from 'node:url';
import {testHarnessStats} from './test-harness.mjs';

export const REGRESSION_MODULES=Object.freeze([
 'verify-club-home-evidence.mjs','club-home-acceptance.mjs',
 'verify-pending-handoff-evidence.mjs','pending-handoff-acceptance.mjs',
 'verify-official-ui-evidence.mjs','official-ui-authority-acceptance.mjs',
 'verify-season-progress-evidence.mjs','season-progress-acceptance.mjs',
 'verify-unemployed-season-evidence.mjs','unemployed-season-acceptance.mjs',
 'unemployed-season-ui-acceptance.mjs','verify-season-history-evidence.mjs',
 'season-history-compaction-acceptance.mjs','regression.mjs'
]);
export function regressionPlan(command){
 const plan=command.split(' && ').map(part=>{
  const match=/^node scripts\/([a-z-]+\.mjs)$/.exec(part);
  assert(match,'지원하지 않는 회귀 검사 명령: '+part);
  return match[1];
 });
 assert.deepEqual(plan,REGRESSION_MODULES,'기존 회귀 검사 전체 순서가 달라졌습니다');
 return plan;
}
const root=new URL('../',import.meta.url);
export async function sourceSnapshot(base=root){
 const paths=['package.json','index.html','docs/README.md','docs/DEVELOPMENT.md','.github/workflows/ci.yml'];
 for(const dir of ['scripts/','src/artifact/','docs/evidence/']){
  for(const entry of await readdir(new URL(dir,base),{withFileTypes:true})){
   if(entry.isFile())paths.push(dir+entry.name);
  }
 }
 const hash=createHash('sha256');
 for(const path of paths.sort()){
  const fileHash=createHash('sha256');
  for await(const bytes of createReadStream(new URL(path,base)))fileHash.update(bytes);
  hash.update(path+'\0'+fileHash.digest('hex')+'\n');
 }
 return hash.digest('hex');
}
export async function runSequential(plan,{load,snapshot,report}={}){
 const initial=await snapshot();const rows=[];
 for(const file of plan){
  assert.equal(await snapshot(),initial,'검사 사이에 현재 소스가 바뀌었습니다');
  const started=performance.now();
  await load(file);
  assert.equal(await snapshot(),initial,'검사 중 현재 소스가 바뀌었습니다');
  const row={file,ms:Math.round((performance.now()-started)*10)/10};rows.push(row);report(row);
 }
 return rows;
}
export async function runRegression(){
 const pkg=JSON.parse(await readFile(new URL('package.json',root)));
 const plan=regressionPlan(pkg.scripts.regression),before=testHarnessStats();
 assert.equal(before.contexts,0,'회귀 시작 전에 fixture가 실행됐습니다');
 const rows=await runSequential(plan,{
  load:file=>import(new URL(file,import.meta.url)),snapshot:sourceSnapshot,
  report:row=>console.log('회귀 순차 검사 '+JSON.stringify(row))
 });
 const after=testHarnessStats();
 assert.equal(after.engineCompiles,1,'엔진의 불변 Script는 한 번만 컴파일해야 합니다');
 assert.equal(after.contexts,7,'기존 일곱 fixture는 각각 새 VM 문맥을 사용해야 합니다');
 console.log('회귀 runner 통과 '+JSON.stringify({modules:rows.length,freshContexts:after.contexts,engineCompiles:after.engineCompiles,rows}));
 return rows;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await runRegression();
