import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
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
