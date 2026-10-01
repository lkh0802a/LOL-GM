// Run the same current acceptance oracle against the pinned R01 engine and HEAD.
// This is an opt-in Actions gate; fixtures, seeds and acceptance assertions stay intact.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, relative, isAbsolute, sep } from 'node:path';

const baseline='0331ffa50a20fce7a4d4e2cd2e032e5c37221e95';
const root=resolve(import.meta.dirname,'..');
const temporaryRoot=resolve(tmpdir());
const workspace=await mkdtemp(join(temporaryRoot,'lol-gm-refactor-parity-'));
const gitFile=path=>execFileSync('git',['show',`${baseline}:${path}`],
  {cwd:root,encoding:'utf8',maxBuffer:16*1024*1024});
const execute=(repo,script,env)=>{
  try{
    execFileSync(process.execPath,[join(repo,'scripts',script)],{
      cwd:repo,env:{...process.env,...env},encoding:'utf8',maxBuffer:16*1024*1024,
      timeout:180000,
    });
  }catch(error){
    throw new Error(`${script} failed in ${repo===root?'current':'baseline'} engine\n`+
      String(error.stdout||'').slice(-5000)+'\n'+String(error.stderr||'').slice(-5000),{cause:error});
  }
};

try{
  const oldRoot=join(workspace,'baseline');
  await mkdir(join(oldRoot,'scripts'),{recursive:true});
  await mkdir(join(oldRoot,'src','artifact'),{recursive:true});
  const manifest=gitFile('scripts/artifact-modules.mjs');
  const list=manifest.match(/export const ENGINE_MODULES\s*=\s*\[([\s\S]*?)\];/);
  assert(list,'baseline engine manifest missing');
  const modules=[...list[1].matchAll(/'([^']+)'/g)].map(match=>match[1]);
  assert(modules.length>0&&modules.every(file=>/^[a-z0-9-]+\.js$/.test(file)),
    'invalid baseline module names');
  await writeFile(join(oldRoot,'scripts','artifact-modules.mjs'),manifest);
  for(const file of modules)await writeFile(join(oldRoot,'src','artifact',file),
    gitFile(`src/artifact/${file}`));
  // Both engines use exactly the same fixtures and observers, not historical tests.
  for(const script of ['smoke.mjs','career-acceptance.mjs'])
    await copyFile(join(root,'scripts',script),join(oldRoot,'scripts',script));

  const results={};
  for(const [label,repo] of [['baseline',oldRoot],['current',root]]){
    const smokePath=join(workspace,`${label}-smoke.json`);
    execute(repo,'smoke.mjs',{SMOKE_MODE:'full',SMOKE_RESULT_FILE:smokePath});
    const smoke=JSON.parse(await readFile(smokePath,'utf8'));
    assert.deepEqual(Object.keys(smoke.state).sort(),
      ['db','marketDb','series','persistedDB','persistedMarket'].sort());
    const careerPath=join(workspace,`${label}-career.json`);
    execute(repo,'career-acceptance.mjs',{CAREER_RESULT_FILE:careerPath});
    const career=JSON.parse(await readFile(careerPath,'utf8'));
    assert.equal(career.checkpoints.length,10,'missing career checkpoint evidence');
    assert.equal(career.checkpoints.filter(row=>row.legacy).length,2);
    results[label]={smoke:smoke.state,career:career.checkpoints};
  }
  // Canonical hashes omit only saveId (wall-clock storage identity), not game state.
  assert.deepEqual(results.current,results.baseline,'R01/current state parity failed');
  const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
  console.log('REFACTOR_PARITY '+JSON.stringify({baseline,head,exact:true,
    smoke:results.current.smoke,career:results.current.career}));
}finally{
  const inside=relative(temporaryRoot,resolve(workspace));
  assert(inside&&!inside.startsWith(`..${sep}`)&&inside!=='..'&&!isAbsolute(inside),
    'temporary cleanup escaped its root');
  await rm(workspace,{recursive:true,force:true});
}
