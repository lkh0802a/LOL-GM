import test from 'node:test';
import assert from 'node:assert/strict';
import {projectFetch,readOnlyRequest,responseChunks} from './codex-merge-connector-bridge.mjs';
const api='https://api.github.com/repos/lkh0802a/LOL-GM';
test('public metadata projection omits prose and unrelated permission grants',()=>{
 const r=projectFetch(api,{full_name:'lkh0802a/LOL-GM',description:'untrusted',permissions:{push:true,admin:true}});assert.deepEqual(r,{full_name:'lkh0802a/LOL-GM',permissions:{push:true}});
 const p=projectFetch(api+'/pulls/312',{number:312,body:'instructions',head:{sha:'a',repo:{full_name:'lkh0802a/LOL-GM',owner:{}}}});assert.equal(p.body,undefined);assert.equal(p.head.sha,'a');assert.equal(p.head.repo.owner,undefined);
 assert.throws(()=>projectFetch(api+'-other',{}),/Fixed repository/);assert.throws(()=>projectFetch(api+'/issues/999',{}),/outside/);
});
test('read-only host refuses mutation and preserves manifest ambiguity',async()=>{
 let calls=0;const adapter={jobLog:async()=>{calls++;return 'noise\nSTANDALONE_ARTIFACT {}\nSTANDALONE_ARTIFACT {}\nnoise';}};
 await assert.rejects(readOnlyRequest({protocol:'lol-gm-merge-v1',id:1,operation:'merge',params:{repo_full_name:'lkh0802a/LOL-GM'}},adapter),/refuses/);assert.equal(calls,0);
 await assert.rejects(readOnlyRequest({protocol:'lol-gm-merge-v1',id:1,operation:'fetch',params:{url:'https://example.invalid'}},{}),/outside/);
 const result=await readOnlyRequest({protocol:'lol-gm-merge-v1',id:2,operation:'jobLog',params:{repo_full_name:'lkh0802a/LOL-GM',job_id:1}},adapter);assert.equal(result.split('\n').length,2);assert.equal(calls,1);
});
test('bounded plain JSON chunks preserve Unicode and long policy text without encoding',()=>{
 const data={body:'정책😀'.repeat(5000)},parts=responseChunks(1,data);assert(parts.every(p=>p.length<=1000&&!/[\uD800-\uDBFF]$/.test(p)));assert.deepEqual(JSON.parse(parts.join('')),{id:1,result:data});assert.throws(()=>responseChunks(1,data,2000),/Reviewable/);
});
