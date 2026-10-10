import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {UI_EVIDENCE_MODULES,uiEvidencePlan} from './ui-evidence-runner.mjs';
import {runSequential} from './regression-runner.mjs';

test('화면 검사 원래 명령 세 개와 순서를 모두 유지한다',async()=>{
 const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url)));
 assert.deepEqual(uiEvidencePlan(pkg.scripts['check:ui-finance-contracts']),UI_EVIDENCE_MODULES);
 const calls=[];
 await runSequential(UI_EVIDENCE_MODULES,{snapshot:async()=> '원본',load:async f=>calls.push(f),report:()=>{}});
 assert.deepEqual(calls,UI_EVIDENCE_MODULES);
});
test('증거 검증 누락·중복·순서 변경·추가 명령은 실행 전에 거절한다',()=>{
 const command=UI_EVIDENCE_MODULES.map(f=>'node scripts/'+f).join(' && ');
 for(const bad of [command.split(' && ').slice(0,2).join(' && '),command+' && node scripts/verify-shortlist-comparison-evidence.mjs',command.split(' && ').reverse().join(' && '),command+'; echo 우회'])assert.throws(()=>uiEvidencePlan(bad));
});
test('첫 증거 검증의 원본 오류 뒤 두 번째 검증과 성공 보고를 실행하지 않는다',async()=>{
 const calls=[],reports=[],failure=new Error('압축 증거 해시 불일치');
 await assert.rejects(runSequential(UI_EVIDENCE_MODULES,{snapshot:async()=> '원본',load:async f=>{calls.push(f);if(f===UI_EVIDENCE_MODULES[1])throw failure},report:r=>reports.push(r.file)}),e=>e===failure);
 assert.deepEqual(calls,UI_EVIDENCE_MODULES.slice(0,2));assert.deepEqual(reports,UI_EVIDENCE_MODULES.slice(0,1));
});
