import test from 'node:test';
import assert from 'node:assert/strict';
import {validationScope} from './ci-scope.mjs';
import {readFileSync} from 'node:fs';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {execFileSync} from 'node:child_process';

test('PR scope excludes publication commits that advanced only the base',()=>{
  const dir=mkdtempSync(join(tmpdir(),'lol-gm-scope-'));
  const git=(...args)=>execFileSync('git',args,{cwd:dir,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  try{
    git('init','-b','main');git('config','user.name','scope-test');git('config','user.email','scope@example.invalid');
    writeFileSync(join(dir,'index.html'),'old');git('add','.');git('commit','-m','base');
    git('switch','-c','ui');writeFileSync(join(dir,'ui.js'),'new');git('add','.');git('commit','-m','ui');
    git('switch','main');writeFileSync(join(dir,'index.html'),'published');git('add','.');git('commit','-m','publish');
    assert(git('diff','--name-only','main','ui').split('\n').includes('index.html'));
    const mergeBase=git('merge-base','main','ui');
    assert.deepEqual(git('diff','--name-only',mergeBase,'ui').split('\n'),['ui.js']);
    const workflow=readFileSync(new URL('../.github/workflows/ci.yml',import.meta.url),'utf8');
    assert(workflow.includes('base="$(git merge-base "$PR_BASE_SHA" "$PR_HEAD_SHA")"'));
  }finally{
    assert(resolve(dir).startsWith(resolve(tmpdir())+sep));rmSync(dir,{recursive:true,force:true});
  }
});
test('every PR, including drafts, documentation and CI edits, runs all required validation',()=>{
  for(const files of [['src/artifact/world.js'],['docs/DEVELOPMENT.md'],['.github/workflows/ci.yml','scripts/ci-scope.test.mjs'],['.github/workflows/ci.yml','scripts/ci-scope.mjs','docs/DEVELOPMENT.md']]){
    const s=validationScope('pull_request',files);
    assert.equal(s.docs_only,files.every(f=>f.startsWith('docs/')||!f.includes('/')&&f.endsWith('.md')));
    for(const key of ['run_full','run_ui','run_calendar','run_build'])assert.equal(s[key],true,key);
  }
});
test('main pushes also run the full gate before standalone publication',()=>{
  const s=validationScope('push',['src/artifact/world.js']);
  assert.deepEqual(s,{docs_only:false,run_full:true,run_ui:true,run_calendar:true,run_build:true});
  assert.equal(validationScope('push',['docs/DEVELOPMENT.md']).run_full,true);
});
test('manual runs keep the complete gate and unknown diffs stay conservative',()=>{
  assert.equal(validationScope('workflow_dispatch',['docs/a.md']).run_full,true);
  assert.equal(validationScope('pull_request',[]).run_full,true);
});
test('workflow runs all domains regardless of paths or draft state',()=>{
  const workflow=readFileSync(new URL('../.github/workflows/ci.yml',import.meta.url),'utf8');
  for(const [job,output] of [['ui-finance-contracts','run_ui'],['calendar-scouting','run_calendar'],['perf-build','run_build'],['medical','run_full'],['daily-career-smoke','run_full']]){
    const block=workflow.match(new RegExp('^  '+job+':[\\s\\S]*?(?=^  [a-z][a-z-]*:|$(?![\\s\\S]))','m'))?.[0];
    assert(block?.includes("if: needs.changes.outputs."+output+" == 'true'"),job);
  }
  assert(!workflow.includes('PR_DRAFT'));
  assert(workflow.includes('converted_to_draft'));
});
