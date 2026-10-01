// Opt-in proof before changing shard boundaries; CI normally runs only both shards.
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const dir=await mkdtemp(join(tmpdir(),'lol-gm-smoke-parity-'));
try{
  const results={};
  for(const mode of ['full','core','patch-system']){
    const output=join(dir,mode+'.json');
    const run=spawnSync(process.execPath,[fileURLToPath(new URL('./smoke.mjs',import.meta.url))],{
      env:{...process.env,SMOKE_MODE:mode,SMOKE_RESULT_FILE:output},encoding:'utf8'
    });
    assert.equal(run.status,0,mode+' failed:\n'+run.stdout+'\n'+run.stderr);
    assert(run.stdout.includes(mode==='patch-system'?'SMOKE_SHARD_OK':'World smoke test: OK'));
    results[mode]=JSON.parse(await readFile(output,'utf8'));
    assert.equal(results[mode].mode,mode);
  }
  const names=mode=>results[mode].phases.map(p=>p.name);
  assert.deepEqual(names('patch-system'),['bootstrap-policy-rookie','patch-system-cache']);
  assert.deepEqual(names('core'),names('full').filter(p=>p!=='patch-system-cache'));
  assert.deepEqual([...new Set([...names('core'),...names('patch-system')])].sort(),names('full').sort());
  assert.deepEqual(Object.keys(results.full.state).sort(),['db','marketDb','persistedDB','persistedMarket','series'].sort());
  assert.deepEqual(results.full.state,results.core.state,'full/core runtime, persisted and RNG results must match');
  console.log('SMOKE_SHARD_PARITY '+JSON.stringify({exact:true,state:results.full.state,
    timings:Object.fromEntries(Object.entries(results).map(([mode,r])=>[mode,r.totalMs]))}));
}finally{
  await rm(dir,{recursive:true,force:true});
}
