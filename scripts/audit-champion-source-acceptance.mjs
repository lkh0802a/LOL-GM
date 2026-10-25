import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {auditChampionSource as audit,championSourceAuditExitCode as exitCode} from './audit-champion-source.mjs';

// Synthetic schema-only fixtures. These are never production champion values.
function fixture(){
  const champions={};
  for(const [i,alias] of ['FixtureA','FixtureB'].entries())champions[alias]={
    riotKey:i+1,alias,nameKo:alias,nameEn:alias,
    base:{hp:1,hpg:1,ad:1,adg:1,arm:1,armg:1,mr:1,mrg:1,as:1,asg:1,range:1,ms:1},
    passive:{nameKo:'P',descriptionKo:'Synthetic passive'},
    spells:['Q','W','E','R'].map(slot=>({slot,nameKo:slot,descriptionKo:'Synthetic spell',
      cooldown:[1],cost:[0],range:[1],numeric:{syntheticTestOnly:true}}))
  };
  return {schema:2,version:'16.19.1',provider:'Riot Data Dragon',sourceCommit:'a'.repeat(40),champions};
}
const good=fixture(),before=structuredClone(good),report=audit(good);
assert.equal(exitCode(report,true),0);assert.deepEqual(good,before,'audit must not mutate input');
assert.equal(report.sourceBytesVerified,false);assert.equal(report.executableMechanicsVerified,false,
  'even complete numeric-shaped fields cannot certify source or executable effects');
const partial=fixture();delete partial.champions.FixtureA.spells[0].numeric;
const partialReport=audit(partial);
assert.equal(partialReport.mechanics.spellsWithoutStructuredNumeric,1);
assert.equal(partialReport.mechanics.championsWithoutStructuredNumeric,0);
assert.equal(exitCode(partialReport),0);assert.equal(exitCode(partialReport,true),1,
  'one unsupported spell must not disappear behind other populated spells');
const growth=fixture();growth.champions.FixtureA.base.adg=0;
assert.equal(audit(growth).growth.allZero,false);assert.equal(exitCode(audit(growth),true),1,
  'a partial zero-growth anomaly still requires source review');
const passive=fixture();delete passive.champions.FixtureA.passive;
assert(audit(passive).invalidFieldsSample.includes('FixtureA.P.identity'));
assert.equal(exitCode(audit(passive)),1);
for(const mutate of [
  d=>{d.provider='Unverified provider'},d=>{d.version='latest'},d=>{delete d.sourceCommit},
  d=>{d.champions.FixtureB.riotKey=1},d=>{d.champions.FixtureA=null},
  d=>{d.champions.FixtureA.spells[0]=null},d=>{d.champions.FixtureA.spells[1].range='global'},
  d=>{d.champions.FixtureA.spells[2].cost=[NaN]},d=>{d.champions.FixtureA.spells=[]}
]){const bad=fixture();mutate(bad);assert.equal(exitCode(audit(bad)),1,'malformed source must fail with diagnostics');}
for(const numeric of [null,[],{},'unverified']){
  const bad=fixture();bad.champions.FixtureA.spells[0].numeric=numeric;
  assert.equal(exitCode(audit(bad),true),1,'non-record numeric must not count as coverage');
}
assert.equal(exitCode(audit(null)),1);assert.equal(audit(null).growth.allZero,false);
const sentinel=fixture();sentinel.champions.FixtureA.spells[0].range=[25000];
assert.equal(exitCode(audit(sentinel),true),1);

const sourceUrl=new URL('../src/artifact/champion-source.js',import.meta.url),sourceBefore=await readFile(sourceUrl);
const cli=new URL('./audit-champion-source.mjs',import.meta.url);
const run=args=>spawnSync(process.execPath,[fileURLToPath(cli),...args],{encoding:'utf8'});
const normal=run([]),strict=run(['--strict']);
assert.ifError(normal.error);assert.ifError(strict.error);
assert.equal(normal.status,0,normal.stderr);assert.equal(strict.status,1,strict.stderr);
const current=JSON.parse(normal.stdout);assert.deepEqual(JSON.parse(strict.stdout),current);
assert.equal(current.championCount,173);assert.equal(current.spellCount,692);
assert.equal(current.growth.zeroAdGrowthCount,173);
assert.equal(current.mechanics.spellsWithoutStructuredNumeric,692);
assert.deepEqual(await readFile(sourceUrl),sourceBefore,'CLI must leave the embedded source byte-identical');
console.log('CHAMPION_SOURCE_AUDIT_ACCEPTANCE PASS partial coverage / P-QWER / malformed / pin metadata / strict / read-only; executable mechanics NOT_VERIFIED');
