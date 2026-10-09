import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createGunzip} from 'node:zlib';
import {Readable} from 'node:stream';
import {REGRESSION_MODULES,regressionPlan} from './regression-runner.mjs';
import {ENGINE_MODULES} from './artifact-modules.mjs';
const root=new URL('../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
const e=JSON.parse(await readFile(new URL('docs/evidence/regression-runner-2026-10-09.json',root)));
assert.deepEqual(e.modules,REGRESSION_MODULES);
const packageBytes=await readFile(new URL('package.json',root));
assert.equal(sha(packageBytes),e.originals['package.json']);regressionPlan(JSON.parse(packageBytes).scripts.regression);
const workflow=await readFile(new URL('.github/workflows/ci.yml',root),'utf8');
const originalWorkflow=workflow.replace(e.workflow.addedStep,'').replace(e.workflow.currentCommand,e.workflow.originalCommand);
assert.notEqual(originalWorkflow,workflow);assert.equal(sha(Buffer.from(originalWorkflow)),e.originals['.github/workflows/ci.yml'],'기존 모든 job·제한·의료/집계/verify·게시 조건 유지');
for(const [path,hash] of Object.entries(e.unchanged))assert.equal(sha(await readFile(new URL(path,root))),hash,path+' 기존 검사 원문 유지');
assert.equal(ENGINE_MODULES.length,101);
for(const [file,hash] of Object.entries(e.engine))assert.equal(sha(await readFile(new URL('src/artifact/'+file,root))),hash,file+' 기존 엔진 유지');
assert.equal(Object.keys(e.engine).length,101);
for(const [path,hash] of Object.entries(e.sources))assert.equal(sha(await readFile(new URL(path,root))),hash,path+' 현재 검증 source');
const parts=[];
for(const p of e.archive.parts){const bytes=await readFile(new URL(p.path,root));assert.equal(bytes.length,p.bytes);assert.equal(sha(bytes),p.sha256);parts.push(bytes);}
assert.equal(sha(Buffer.concat(parts)),e.archive.sha256);
const hash=createHash('sha256'),files=new Map(),docs=new Map(),parity=new Map();let pending=Buffer.alloc(0),rows=0;
function observe(path,bytes){
 if(!e.parityLogs.includes(path))return;
 const state=parity.get(path)||{decoder:new TextDecoder(),pending:'',hash:createHash('sha256'),count:0};
 state.pending+=state.decoder.decode(bytes,{stream:true});let end;
 while((end=state.pending.indexOf('\n'))>=0){
  const line=state.pending.slice(0,end);state.pending=state.pending.slice(end+1);
  if(!line||line.startsWith('> ')||line.startsWith('    at ')||line.startsWith('회귀 순차 검사 ')||line.startsWith('회귀 runner 통과 '))continue;
  state.hash.update(line+'\n');state.count++;
 }
 parity.set(path,state);
}
for await(const chunk of Readable.from(parts).pipe(createGunzip())){
 hash.update(chunk);pending=Buffer.concat([pending,chunk]);let end;
 while((end=pending.indexOf(10))>=0){
  const row=JSON.parse(pending.subarray(0,end));pending=pending.subarray(end+1);rows++;
  const bytes=Buffer.from(row.base64,'base64');assert.equal(bytes.length,row.bytes);assert.equal(sha(bytes),row.sha256);
  observe(row.path,bytes);
  const f=files.get(row.path)||{hash:createHash('sha256'),bytes:0,next:0};assert.equal(row.chunk,f.next++);f.hash.update(bytes);f.bytes+=bytes.length;files.set(row.path,f);
  if(row.path==='original/docs/DEVELOPMENT.md'||row.path==='original/docs/README.md')docs.set(row.path,bytes);
 }
}
assert.equal(pending.length,0);assert.equal(rows,e.archive.rows);assert.equal(hash.digest('hex'),e.archive.decodedSha256);
assert.equal(files.size,e.archive.files.length);
for(const f of e.archive.files){const actual=files.get(f.path);assert(actual,f.path);assert.equal(actual.bytes,f.bytes);assert.equal(actual.next,f.chunks);assert.equal(actual.hash.digest('hex'),f.sha256);}
for(const file of ['docs/DEVELOPMENT.md','docs/README.md']){
 const original=docs.get('original/'+file);assert(original,file+' 원문 보존');assert.equal(sha(original),e.originals[file]);assert((await readFile(new URL(file,root))).includes(original));
}
assert(e.measurements.parity.recordBytesExact);assert.equal(e.measurements.parity.recordLinesBefore,73);assert.equal(e.measurements.parity.recordLinesAfter,73);
assert.equal(e.measurements.baseline.exit,0);assert.equal(e.measurements.after.exit,0);
for(const path of e.parityLogs){const p=parity.get(path);assert(p,path);assert.equal(p.pending,'');assert.equal(p.decoder.decode(),'');assert.equal(p.count,73);assert.equal(p.hash.digest('hex'),e.measurements.parity.recordSha256,path+' 실제 원시 결과73개 동등');}
console.log('회귀 runner 증거 통과: 기존14검사·엔진101·가이드 전체·원본 로그/실패 SHA·현재 검증 source·결과 동등성 유지');
