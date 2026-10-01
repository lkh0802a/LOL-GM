import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {spawnSync,spawn} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const runner=fileURLToPath(new URL('./ci-run.mjs',import.meta.url));
async function run(command,args,verify){
  const dir=await mkdtemp(join(tmpdir(),'lol-gm-ci-report-'));
  try{
    const summary=join(dir,'summary.md');
    const proc=spawnSync(process.execPath,[runner,'probe','--',command,...args],{
      encoding:'utf8',env:{...process.env,CI_RESULTS_DIR:dir,GITHUB_STEP_SUMMARY:summary}
    });
    await verify(proc,JSON.parse(await readFile(join(dir,'probe.json'),'utf8')),
      await readFile(summary,'utf8'),await readFile(join(dir,'probe.log'),'utf8'));
    const lifecycle=JSON.parse(await readFile(join(dir,'probe.process.json'),'utf8'));
    assert.equal(lifecycle.exitCode,JSON.parse(await readFile(join(dir,'probe.json'),'utf8')).exitCode);
    assert.equal(lifecycle.status,proc.status===0?'success':'failure');
    assert(lifecycle.parentPid>0);assert(lifecycle.startedUtc&&lifecycle.endedUtc);
    assert.equal(lifecycle.childPid,JSON.parse(await readFile(join(dir,'probe.json'),'utf8')).childPid);
    assert(lifecycle.revision===null||/^[0-9a-f]{40}$/.test(lifecycle.revision));
  }finally{
    assert.equal(dirname(resolve(dir)),resolve(tmpdir()));
    await rm(dir,{recursive:true,force:true});
  }
}
test('preserves success, multiline output and structured evidence',async()=>{
  await run('node',['-e','process.stdout.write("PROBE ");setTimeout(()=>console.log(JSON.stringify({seed:7,count:42})),5);console.error("stderr preserved")'],(proc,result,summary,log)=>{
    assert.equal(proc.status,0);assert.equal(result.status,'success');
    assert.deepEqual(result.records,[{marker:'PROBE',value:{seed:7,count:42}}]);
    assert(log.includes('stderr preserved'));assert(summary.includes('PROBE'));
    assert(proc.stdout.includes('PROBE {"seed":7,"count":42}'));
  });
});
test('propagates failure and preserves the first error in the log',async()=>{
  await run('node',['-e','console.error("Error: failing invariant <expected>");process.exitCode=7'],(proc,result,summary,log)=>{
    assert.equal(proc.status,7);assert.equal(result.exitCode,7);assert.equal(result.status,'failure');
    assert(log.includes('failing invariant'));assert(summary.includes('&lt;expected&gt;'));
  });
});
test('failed spawn cannot report green',async()=>{
  await run('lol-gm-missing-command',[],(proc,result)=>{
    assert.notEqual(proc.status,0);assert.equal(result.status,'failure');assert(result.error.includes('ENOENT'));
  });
});
test('records a live child before completion and preserves forced termination',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'lol-gm-ci-lifecycle-'));
  const proc=spawn(process.execPath,[runner,'probe','--','node','-e','setTimeout(()=>{},30000)'],{
    stdio:'ignore',env:{...process.env,CI_RESULTS_DIR:dir}
  });
  const closed=new Promise(resolve=>proc.on('close',(code,signal)=>resolve({code,signal})));
  let childPid=null;
  try{
    let live;
    for(let i=0;i<250;i++){
      try{live=JSON.parse(await readFile(join(dir,'probe.process.json'),'utf8'));break}catch{}
      await new Promise(resolve=>setTimeout(resolve,20));
    }
    assert.equal(live?.status,'running');assert.equal(live.parentPid,proc.pid);
    childPid=live.childPid;assert(childPid>0);assert.equal(live.exitCode,undefined);
    process.kill(childPid,'SIGTERM');
    const outcome=await closed;childPid=null;assert.notEqual(outcome.code,0);
    const final=JSON.parse(await readFile(join(dir,'probe.process.json'),'utf8'));
    assert.equal(final.status,'failure');assert.notEqual(final.exitCode,0);
    assert(final.endedUtc);assert(final.signal!==undefined);
  }finally{
    if(childPid){try{process.kill(childPid)}catch{}}
    if(proc.exitCode===null)proc.kill();
    await closed;
    assert.equal(dirname(resolve(dir)),resolve(tmpdir()));await rm(dir,{recursive:true,force:true});
  }
});
