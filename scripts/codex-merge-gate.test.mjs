import test from 'node:test';
import assert from 'node:assert/strict';
import {assessMerge,prepareMerge,verifyMergeResult,REQUIRED_CHECKS,main,bindLocalAcceptance,executeMerge} from './codex-merge-gate.mjs';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
const head='a'.repeat(40),base='b'.repeat(40),merge='c'.repeat(40),now=Date.parse('2026-10-28T00:00:00Z');
const fixture=()=>({observedAt:new Date(now).toISOString(),runId:'owned-run',ciComplete:true,repository:{full_name:'lkh0802a/LOL-GM',default_branch:'main',archived:false,disabled:false,allow_merge_commit:true,permissions:{push:true}},pr:{number:999,state:'open',draft:false,merged:false,base:{ref:'main',sha:base,repo:{full_name:'lkh0802a/LOL-GM'}},head:{sha:head,repo:{full_name:'lkh0802a/LOL-GM'}},changed_files:1,mergeable:true,mergeable_state:'clean',merge_commit_sha:merge},main:{commit:{sha:base}},testedMerge:{sha:merge,parents:[{sha:base},{sha:head}]},files:[{filename:'src/ui-v2/market.js',status:'modified'}],checks:REQUIRED_CHECKS.map((name,i)=>({id:i+1,name,app:{slug:'github-actions'},head_sha:head,status:'completed',conclusion:'success',details_url:'https://github.com/lkh0802a/LOL-GM/actions/runs/100/job/'+(i+1)})),runs:[{id:100,head_sha:head,status:'completed',conclusion:'success',event:'pull_request',path:'.github/workflows/ci.yml',repository:{full_name:'lkh0802a/LOL-GM'}}],reviews:[],threads:[],local:{head,clean:true,fixedSources:true,sourceBindingVerified:true,tests:Object.fromEntries(['focus','adjacent','build','check','ui','medical','core'].map(k=>[k,'PASS']))},lease:{runId:'owned-run',repository:'lkh0802a/LOL-GM',owned:true,queue:'READY'}});
const assess=x=>assessMerge(x,{now});
test('valid normal changes yield an assessment only, no self-enabling merge or human engine-path approval',()=>{
 const x=fixture(),r=assess(x);assert.equal(r.state,'READY_FOR_FRESH_RECHECK');assert.equal(r.automaticMergeAllowed,false);assert.equal(r.reasons.length,0);assert.equal(r.snapshotSha256.length,64);
 x.files[0].filename='src/artifact/engine.js';assert(assess(x).reasons.includes('ENHANCED_ENGINE_ACCEPTANCE_REQUIRED'));x.local.enhanced={head,status:'PASS',deterministic:true,seeds:['A','B'],sourceCommit:head};assert.equal(assess(x).state,'READY_FOR_FRESH_RECHECK');x.local.enhanced.seeds=['A','A'];assert(assess(x).reasons.includes('ENHANCED_ENGINE_ACCEPTANCE_REQUIRED'));
});
test('labels, passed tests and author assertions never override sensitive/deleted/test-integrity paths',()=>{
 for(const filename of ['.github/workflows/ci.yml','AGENTS.md','package.json','scripts/codex-merge-gate.mjs','docs/DECISIONS.md','../escape']){const x=fixture();x.labels=['low-risk','approved'];x.files[0].filename=filename;assert.equal(assess(x).state,'BLOCKED',filename);}
 for(const status of ['removed','renamed','unknown']){const x=fixture();x.files[0].status=status;assert.equal(assess(x).state,'BLOCKED');}
 const x=fixture();x.files[0]={filename:'scripts/existing.test.mjs',status:'modified'};assert(assess(x).reasons.includes('EXISTING_TEST_CHANGE_REQUIRES_INDEPENDENT_INTEGRITY_REVIEW'));x.files[0].status='added';assert.equal(assess(x).state,'READY_FOR_FRESH_RECHECK');
});
test('missing/truncated evidence, forks, dirty states, stale base and unknown write capability fail closed',()=>{
 const cases=[x=>delete x.checks,x=>delete x.ciComplete,x=>x.files.push({filename:'README.md',status:'modified'}),x=>x.pr.draft=true,x=>x.pr.merged=true,x=>x.pr.head.repo.full_name='fork/repo',x=>x.pr.base.sha='d'.repeat(40),x=>x.pr.mergeable=null,x=>delete x.repository.permissions,x=>x.local.clean=false,x=>x.local.fixedSources=false,x=>x.local.sourceBindingVerified=false,x=>x.local.head=base,x=>x.lease.queue='UNKNOWN',x=>x.lease.runId='other',x=>x.observedAt=new Date(now-120001).toISOString(),x=>x.observedAt=new Date(now+5001).toISOString(),x=>delete x.testedMerge,x=>x.testedMerge.parents.reverse()];
 for(const change of cases){const x=fixture();change(x);assert.equal(assess(x).state,'BLOCKED',String(change));}
 for(const name of ['focus','adjacent','build','check','ui','medical','core']){const x=fixture();x.local.tests[name]='NOT_RUN';assert.equal(assess(x).state,'BLOCKED',name);}
});
test('checks bind provider/run/HEAD and newer pending or failed attempts cannot inherit old green',()=>{
 const changes=[c=>c.app.slug='fake',c=>c.head_sha=base,c=>c.status='in_progress',c=>c.conclusion='failure',c=>c.details_url='https://example.invalid/actions/runs/100/job/1'];for(const change of changes){const x=fixture();change(x.checks[0]);assert.equal(assess(x).state,'BLOCKED');}
 const x=fixture();x.checks.push({...x.checks[0],id:1000,status:'queued',conclusion:null});assert.equal(assess(x).state,'BLOCKED');
 for(const change of [r=>r.head_sha=base,r=>r.event='workflow_dispatch',r=>r.path='.github/workflows/untrusted.yml',r=>r.conclusion='failure',r=>r.repository.full_name='fork/repo']){const x=fixture();change(x.runs[0]);assert.equal(assess(x).state,'BLOCKED');}
 const y=fixture();y.checks.push({name:'security-scan',status:'completed',conclusion:'failure'});assert.equal(assess(y).state,'BLOCKED');
});
test('change requests and unresolved threads remain authoritative without requiring blanket human approval',()=>{
 const x=fixture();x.reviews=[{id:1,state:'CHANGES_REQUESTED',user:{login:'reviewer'}}];assert.equal(assess(x).state,'BLOCKED');x.reviews.push({id:2,state:'COMMENTED',user:{login:'reviewer'}});assert.equal(assess(x).state,'BLOCKED');x.reviews.push({id:3,state:'APPROVED',user:{login:'reviewer'}});assert.equal(assess(x).state,'READY_FOR_FRESH_RECHECK');x.threads=[{isResolved:false}];assert.equal(assess(x).state,'BLOCKED');
});
test('fresh recheck rejects HEAD/base/owner races; merge result requires actual parents and separate main validation',()=>{
 const x=fixture(),plan=prepareMerge(x,structuredClone(x),{now});assert.equal(plan.expected_head_sha,head);assert.equal(plan.expectedBase,base);assert.equal(plan.merge_method,'merge');
 for(const change of [y=>y.pr.head.sha=base,y=>y.main.commit.sha=head,y=>y.runId='another']){const y=structuredClone(x);change(y);assert.throws(()=>prepareMerge(x,y,{now}),/refused/);}
 assert.deepEqual(verifyMergeResult(plan,{merged:true,sha:merge},{sha:merge,parents:[{sha:base},{sha:head}]}),{state:'MERGED_AWAITING_MAIN_VALIDATION',head:merge,deployAllowed:false});assert.equal(verifyMergeResult(plan,{merged:false},{sha:merge}).state,'MERGE_REJECTED');assert.equal(verifyMergeResult(plan,{merged:true,sha:merge},{sha:merge,parents:[{sha:head},{sha:base}]}).deployAllowed,false);
});
test('CLI cannot bootstrap its own policy or write a report when trusted main gate is missing',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'lol-gm-merge-bootstrap-')),git=(...a)=>execFileSync('git',['-C',root,...a],{encoding:'utf8',stdio:'pipe'});
 try{git('init');await writeFile(path.join(root,'source.txt'),'keep');git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-m','base');const sha=git('rev-parse','HEAD').trim(),snapshot=fixture(),dir=await mkdtemp(path.join(os.tmpdir(),'lol-gm-merge-snapshot-'));try{snapshot.pr.head.sha=sha;snapshot.main.commit.sha=sha;const input=path.join(dir,'input.json'),out=path.join(dir,'report.json');await writeFile(input,JSON.stringify(snapshot));await assert.rejects(main([root,input,out]),/failed|bootstrap|Trusted/);await assert.rejects(readFile(out),{code:'ENOENT'});assert.equal(await readFile(path.join(root,'source.txt'),'utf8'),'keep');assert.equal(git('status','--porcelain').trim(),'');}finally{await rm(dir,{recursive:true,force:true});}}finally{await rm(root,{recursive:true,force:true});}
});

test('actual local pipeline and tracked byte coverage are derived rather than accepting a declared PASS',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'lol-gm-merge-binding-')),evidence=await mkdtemp(path.join(os.tmpdir(),'lol-gm-merge-proof-')),git=(...a)=>execFileSync('git',['-C',root,...a],{encoding:'utf8',stdio:'pipe'});
 try{git('init');await writeFile(path.join(root,'source.txt'),'actual');git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-m','base');const head=git('rev-parse','HEAD').trim(),pipeline={head,status:'success',fixedSources:true,jobs:['ui-v2','full','medical-core','core-smoke'].map(job=>({job,exit:0,fixedSources:true}))},start={head,sources:{'source.txt':createHash('sha256').update('actual').digest('hex')}};await writeFile(path.join(evidence,'pipeline.json'),JSON.stringify(pipeline));await writeFile(path.join(evidence,'validation-start.json'),JSON.stringify(start));const bound=await bindLocalAcceptance(root,evidence,{tests:{focus:'PASS'}});assert.equal(bound.sourceBindingVerified,true);assert.equal(bound.clean,true);assert.equal(bound.tests.check,'PASS');assert.equal(bound.tests.focus,'PASS');
  await writeFile(path.join(root,'source.txt'),'changed');await assert.rejects(bindLocalAcceptance(root,evidence),/source changed/);await writeFile(path.join(root,'source.txt'),'actual');start.sources={};await writeFile(path.join(evidence,'validation-start.json'),JSON.stringify(start));await assert.rejects(bindLocalAcceptance(root,evidence),/coverage changed/);pipeline.jobs.pop();await writeFile(path.join(evidence,'pipeline.json'),JSON.stringify(pipeline));await assert.rejects(bindLocalAcceptance(root,evidence),/pipeline is incomplete/);
 }finally{await rm(root,{recursive:true,force:true});await rm(evidence,{recursive:true,force:true});}
});

test('coordinator records durable intent before HEAD-conditional merge; no retry or deployment on rejection/race',async()=>{
 const snapshot=fixture(),events=[];const result=await executeMerge({snapshot,refresh:async()=>structuredClone(snapshot),merge:async args=>{events.push(['merge',args]);return {merged:true,sha:merge};},readCommit:async()=>({sha:merge,parents:[{sha:base},{sha:head}]}),record:async r=>events.push(['record',r]),now});
 assert.equal(events[0][1].state,'MERGE_INTENT');assert.equal(events[1][1].expected_head_sha,head);assert.equal(events[2][1].state,'MERGED_AWAITING_MAIN_VALIDATION');assert.equal(result.deployAllowed,false);
 let calls=0;await assert.rejects(executeMerge({snapshot,refresh:async()=>structuredClone(snapshot),merge:async()=>{calls++;throw Error('permission denied');},readCommit:async()=>assert.fail('no commit to read'),record:async()=>{},now}),/permission denied/);assert.equal(calls,1);
 calls=0;await assert.rejects(executeMerge({snapshot,refresh:async()=>structuredClone(snapshot),merge:async()=>calls++,readCommit:async()=>assert.fail(),record:async()=>{throw Error('cannot persist intent');},now}),/persist intent/);assert.equal(calls,0);
 const race=await executeMerge({snapshot,refresh:async()=>structuredClone(snapshot),merge:async()=>({merged:true,sha:merge}),readCommit:async()=>({sha:merge,parents:[{sha:head},{sha:head}]}),record:async()=>{},now});assert.equal(race.state,'INTEGRATION_REVALIDATION_REQUIRED');assert.equal(race.deployAllowed,false);
});
