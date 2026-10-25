// Full graph and reference parity against the preceding public implementation.
// Runtime measurements belong to a separate, controlled private probe.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {runEngineFixture} from './test-harness.mjs';
const root=new URL('../',import.meta.url);
const evidence=JSON.parse(await readFile(new URL('docs/evidence/official-undo-clock-2026-10-21.json',root)));
const archive=await readFile(new URL(evidence.archive.path,root));
const sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(sha(archive),evidence.archive.sha256);
const prior=gunzipSync(archive).toString();assert.equal(sha(prior),evidence.predecessorSha256);
// Reconstruct reviewed retirement, formats, entries and administrative wiring.
// Verify the entire original source against its unchanged immutable pin.
const liveSeason=await readFile(new URL('src/artifact/season.js',root),'utf8');
const successor='  const scrim=days>=1&&fat<54&&cond>70;return {scrim,next,days,fat,cond};';
const predecessor="  const intensity=fat>38||cond<84||days<=1?'light':days>=5&&fat<20&&cond>91?'high':'normal';\n  const scrim=days>=1&&fat<54&&cond>70;return {intensity,scrim,next,days,fat,cond};";
assert.equal(liveSeason.split(successor).length,2,'one reviewed retirement replacement');
const formatSuccessor='stages:intlStages(it.format,teams,it.bo,it)';
const formatPredecessor='stages:intlStages(it.format,teams,it.bo)';
assert.equal(liveSeason.split(formatSuccessor).length,2,'one reviewed format-options call');
let referenceSeason=liveSeason;
for(const [current,previous] of [
  ['  expireCurrentAIMarketOffers(db);\n',''],
  ['  if(disqualifiedFinalResult(s))return administrativeTournamentPlacements(db,s);\n',''],
  ['  if(s.qualificationSuccessions?.length)return qualificationTournamentPlacements(db,s);\n',''],
  ['  const succession=resolvePendingQualificationSuccession(db,refs,q,forcedDraft);if(succession)return succession;\n',''],
  ['  const administrative=resolvePendingDisqualifiedFinal(db,refs,q);if(administrative)return administrative;\n',''],
  ['.sort(internationalEventPriority)','.sort((a,b)=>(a.prestige||1)-(b.prestige||1))'],
  ['  const rollback=pendingOfficialUndo(db),previousTaken=[...taken];let committed=false;\n  try{\n',''],
  ['  const presetEntries=presetInternationalEntries(db,it,taken);\n',''],
  ['  const legacyExcluded=presetEntries?null:internationalEntryExclusions(db,it,taken);\n',''],
  ['const regs=presetEntries?[]:','const regs='],
  ['const teams=presetEntries||[];','const teams=[];'],
  ['  s.internationalPeriodSnapshot={phase:it.phase??null,timing:it.timing??null};\n',''],
  ['  committed=true;return true;','  return true;'],
  ['  }finally{if(!committed){rollback();taken.clear();for(const t of previousTaken)taken.add(t)}}\n','']
]){
  assert.equal(referenceSeason.split(current).length,2,'one reviewed domain wiring replacement');
  referenceSeason=referenceSeason.replace(current,previous);
}
assert.equal(referenceSeason.split('!legacyExcluded.has(t)').length,4,'three reviewed legacy exclusion reads');
referenceSeason=referenceSeason.replaceAll('!legacyExcluded.has(t)','!taken.has(t)');
assert.equal(sha(referenceSeason.replace(successor,predecessor).replace(formatSuccessor,formatPredecessor)),evidence.currentSha256);
const start=prior.indexOf('function pendingOfficialUndo(db){'),end=prior.indexOf('\nfunction pendingOfficialSession',start);
assert(start>=0&&end>start);
const original=prior.slice(start,end).replace('function pendingOfficialUndo','function priorOfficialUndo');
const result=await runEngineFixture(original+String.raw`
(()=>{
 const check=(ok,msg)=>{if(!ok)throw Error('OFFICIAL_UNDO '+msg)};
 function graph(){
  const leaf={number:3,signed:-0,nan:NaN},array=[];
  array.length=7;array[2]=leaf;array.extra={value:4};
  const root={world:{pending:{session:{games:[{winner:'A'}]}},seasons:{one:{history:[leaf]}}},
   teams:{A:{finance:{cash:9},roster:['p']}},players:{p:{pool:{one:{mastery:12}}}},
   scout:{foreign:{observations:[{value:7}]}},array,alias:leaf};
  root.self=root;root.world.owner=root.teams.A;return root;
 }
 let checks=0;
 for(const undoFn of [priorOfficialUndo,pendingOfficialUndo]){
  const db=graph(),world=db.world,club=db.teams.A,leaf=db.alias,array=db.array,extra=array.extra,foreign=db.scout.foreign.observations[0];
  const undo=undoFn(db);
  db.world={};club.finance.cash=-9;club.roster.push('new');leaf.number=99;leaf.signed=0;leaf.nan=1;
  db.players.p.pool.one.mastery=100;foreign.value=88;db.scout.added={};delete db.teams.A;
  array.length=1;array[0]='new';array.extra={};extra.value=9;db.alias=null;db.self=null;db.added=true;
  undo();
  check(db.world===world&&db.teams.A===club&&db.alias===leaf&&db.self===db,'root and aliases');
  check(leaf.number===3&&Object.is(leaf.signed,-0)&&Number.isNaN(leaf.nan),'exact primitive values');
  check(db.players.p.pool.one.mastery===12&&foreign.value===7&&!Object.hasOwn(db.scout,'added'),'foreign graph rollback');
  check(array===db.array&&array.length===7&&array[2]===leaf&&!(0 in array)&&!(6 in array)&&array.extra===extra&&extra.value===4,'array holes and extra fields');
  check(club.finance.cash===9&&club.roster.length===1&&!Object.hasOwn(db,'added'),'finance and roster');
  // An outer rollback must survive a successful inner operation and an inner
  // rollback; earlier snapshots never borrow mutable buffers from later calls.
  const outer=undoFn(db);club.finance.cash=8;const inner=undoFn(db);club.finance.cash=6;
  inner();check(club.finance.cash===8,'nested checkpoint');club.finance.cash=5;outer();check(club.finance.cash===9,'outer checkpoint');
  const a=[];Object.defineProperty(a,'0',{enumerable:true,configurable:true,get(){a.length=4;return leaf}});
  const odd={a};const getterUndo=undoFn(odd);a.length=1;getterUndo();check(a.length===4,'array getter length order');
  checks+=8;
 }
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:10,div2:false})];
 const db=buildWorld(cfg);startCareer(db,'VXG','official-undo-full-graph');
 const before=packDB(db),world=db.world,team=db.teams.VXG,pid=team.roster[0],undo=pendingOfficialUndo(db);
 db.worldDate='2099-01-01';db.world.extra={};team.finance.cash=-123;
 if(pid)db.players[pid].pool={};undo();
 check(db.world===world&&db.teams.VXG===team&&packDB(db)===before,'native save and identity parity');
 const restored=unpackDB(before);check(packDB(unpackDB(packDB(restored)))===packDB(restored),'canonical restoration');
 return {checks:checks+2,fullGraph:true,nestedSnapshots:true,save:true};
})()`,{timeout:30000,filename:'official-undo-acceptance.js'});
console.log('OFFICIAL_UNDO_ACCEPTANCE '+JSON.stringify(result));

// A getter in the first child can change a later sibling while taking the
// snapshot. Preserve the predecessor's read order, not just a plain JSON tree.
const order=await runEngineFixture(original+String.raw`
(()=>{
 const run=undoFn=>{const seen=[],second={number:3},leaf={number:7},first={};
  Object.defineProperty(first,'value',{enumerable:true,configurable:true,get(){seen.push('first');second.number=5;return leaf;}});
  const db={first,second,alias:leaf};const undo=undoFn(db),calls=seen.slice();second.number=99;leaf.number=88;db.first={};undo();
  if(db.first!==first||db.second!==second||db.alias!==leaf||second.number!==5||leaf.number!==7||JSON.stringify(seen)!==JSON.stringify(calls))throw Error('full graph getter traversal order');
  return {calls,number:second.number,leaf:leaf.number};};
 const prior=run(priorOfficialUndo),current=run(pendingOfficialUndo);if(JSON.stringify(prior)!==JSON.stringify(current))throw Error('predecessor traversal parity');
 const db={};let node=db;for(let i=0;i<6000;i++){node.next={value:i};node=node.next;}const end=node,undo=pendingOfficialUndo(db);end.value=-1;db.next={};undo();node=db;for(let i=0;i<6000;i++)node=node.next;if(node!==end||end.value!==5999)throw Error('deep graph exact references');
 return {getterOrder:true,predecessorWholeParity:true,deepObjects:6001,deepReferences:true};
})()`,{timeout:30000});
assert(order.getterOrder&&order.deepReferences);
console.log('OFFICIAL_UNDO_TRAVERSAL_ACCEPTANCE '+JSON.stringify(order));
