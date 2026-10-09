import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {join} from 'node:path';
import {runEngineFixture,testHarnessStats} from './test-harness.mjs';
import {REGRESSION_MODULES,regressionPlan,runSequential,sourceSnapshot} from './regression-runner.mjs';

const command=REGRESSION_MODULES.map(f=>'node scripts/'+f).join(' && ');
test('기존 전체 명령·순서와 각 검사 실행을 유지한다',async()=>{
 assert.deepEqual(regressionPlan(command),REGRESSION_MODULES);
 const calls=[],reports=[];
 await runSequential(REGRESSION_MODULES,{snapshot:async()=> '고정',load:async f=>calls.push(f),report:r=>reports.push(r.file)});
 assert.deepEqual(calls,REGRESSION_MODULES);assert.deepEqual(reports,calls);
});
test('누락·중복·순서 변경·shell 명령은 실행 전 거절한다',()=>{
 for(const bad of [command.replace('node scripts/regression.mjs',''),command+' && node scripts/regression.mjs',command.split(' && ').reverse().join(' && '),command+'; echo 우회'])assert.throws(()=>regressionPlan(bad));
});
test('실패 뒤 다음 검사와 성공 보고를 실행하지 않는다',async()=>{
 const calls=[],reports=[],failure=new Error('원본 실패');
 await assert.rejects(runSequential(['첫째','실패','미실행'],{snapshot:async()=> '고정',load:async f=>{calls.push(f);if(f==='실패')throw failure;},report:r=>reports.push(r.file)}),e=>e===failure);
 assert.deepEqual(calls,['첫째','실패']);assert.deepEqual(reports,['첫째']);
});
test('실행 중 소스 변경을 거절하고 후속 검사를 중단한다',async()=>{
 let state='원본';const calls=[];
 await assert.rejects(runSequential(['변경','미실행'],{snapshot:async()=>state,load:async f=>{calls.push(f);state='변경';},report:()=>assert.fail('성공 보고 금지')}),/검사 중 현재 소스/);
 assert.deepEqual(calls,['변경']);
});
test('압축 증거와 실제 소스의 바이트 변경도 검출한다',async()=>{
 const path=await mkdtemp(join(tmpdir(),'lol-gm-runner-fixture-')),base=pathToFileURL(path+'/');
 try{
  for(const dir of ['scripts','src/artifact','docs/evidence','.github/workflows'])await mkdir(join(path,dir),{recursive:true});
  for(const file of ['package.json','index.html','docs/README.md','docs/DEVELOPMENT.md','.github/workflows/ci.yml','scripts/fixture.mjs','src/artifact/fixture.js','docs/evidence/raw.json.gz'])await writeFile(join(path,file),'원본');
  const original=await sourceSnapshot(base);
  for(const file of ['scripts/fixture.mjs','src/artifact/fixture.js','docs/evidence/raw.json.gz']){
   await writeFile(join(path,file),'수정');assert.notEqual(await sourceSnapshot(base),original,file);
   await writeFile(join(path,file),'원본');assert.equal(await sourceSnapshot(base),original,file);
  }
 }finally{await rm(path,{recursive:true,force:true});}
});
test('불변 Script를 공유해도 실제 fixture 상태는 새 VM에서 시작한다',async()=>{
 const before=testHarnessStats();
 assert.equal(await runEngineFixture('globalThis.runnerIsolation=23;runnerIsolation'),23);
 assert.equal(await runEngineFixture('typeof runnerIsolation'),'undefined');
 const after=testHarnessStats();assert.equal(after.contexts-before.contexts,2);assert.equal(after.engineCompiles,1);
});
