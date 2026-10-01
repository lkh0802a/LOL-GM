import test from 'node:test';
import assert from 'node:assert/strict';
import {validationScope} from './ci-scope.mjs';
import {readFileSync} from 'node:fs';
test('engine and unknown changes retain all required validation',()=>{
  for(const file of ['src/artifact/club-license.js','scripts/test-harness.mjs','package.json','unknown']){
    const s=validationScope('pull_request','false',[file]);
    for(const key of ['run_full','run_ui','run_calendar','run_build'])assert.equal(s[key],true,file+key);
  }
});
test('draft, documentation and CI orchestration avoid game simulations',()=>{
  for(const [draft,files] of [['true',['src/artifact/world.js']],['false',['docs/DEVELOPMENT.md']],['false',['.github/workflows/ci.yml','scripts/ci-scope.test.mjs']],['false',['.github/workflows/ci.yml','scripts/ci-scope.mjs','docs/DEVELOPMENT.md']]]){
    const s=validationScope('pull_request',draft,files);
    for(const key of ['run_full','run_ui','run_calendar','run_build'])assert.equal(s[key],false,key);
  }
});
test('UI selects acceptance and build; mixed engine changes broaden coverage',()=>{
  const s=validationScope('pull_request','false',['src/artifact/ui-season.js']);
  assert.deepEqual(s,{docs_only:false,run_full:false,run_ui:true,run_calendar:false,run_build:true});
  assert.equal(validationScope('pull_request','false',['src/artifact/ui-season.js','src/artifact/world.js']).run_full,true);
});
test('explicit full dispatch and uncertain diffs stay conservative',()=>{
  assert.equal(validationScope('workflow_dispatch','true',['docs/a.md']).run_full,true);
  assert.equal(validationScope('pull_request','false',[]).run_full,true);
});
test('main publishes the validated merge without repeating season suites',()=>{
  const s=validationScope('push','false',['src/artifact/world.js']);
  assert.deepEqual(s,{docs_only:false,run_full:false,run_ui:false,run_calendar:false,run_build:true});
  assert.equal(validationScope('push','false',['docs/DEVELOPMENT.md']).run_build,false);
});
test('workflow domain jobs use the selected scope rather than docs-only',()=>{
  const workflow=readFileSync(new URL('../.github/workflows/ci.yml',import.meta.url),'utf8');
  for(const [job,output] of [['ui-finance-contracts','run_ui'],['calendar-scouting','run_calendar'],['perf-build','run_build'],['medical','run_full'],['daily-career-smoke','run_full']]){
    const block=workflow.match(new RegExp('^  '+job+':[\\s\\S]*?(?=^  [a-z][a-z-]*:|$(?![\\s\\S]))','m'))?.[0];
    assert(block?.includes("if: needs.changes.outputs."+output+" == 'true'"),job);
  }
});
