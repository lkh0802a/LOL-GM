// Reproducible internal study. Runs canonical world days; no extra games are
// inserted into a player's career and no forced draft/winner is used.
import vm from 'node:vm';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {compiledEngine} from './test-harness.mjs';
import {ENGINE_MODULES} from './artifact-modules.mjs';
const output=process.argv[2],resumePath=process.argv[3]||null;
const resume=resumePath?JSON.parse(await readFile(resumePath,'utf8')):null;
const maxSteps=Number(process.env.LOL_GM_SAMPLE_MAX_STEPS||600);
if(!Number.isInteger(maxSteps)||maxSteps<1||maxSteps>600)throw Error('Study step budget must be 1..600');
if(!output)throw Error('Provide a private output directory for the internal world study');
await mkdir(output,{recursive:true});
const startedUtc=new Date().toISOString(),sha=b=>createHash('sha256').update(b).digest('hex');
const sources=Object.fromEntries(await Promise.all(ENGINE_MODULES.map(async f=>[f,sha(await readFile(new URL('../src/artifact/'+f,import.meta.url)))])));
if(resume&&JSON.stringify(resume.sources)!==JSON.stringify(sources))throw Error('Resume engine hashes do not match; prior checks are not inherited');
const context=vm.createContext({__sampleResume:resume,console,Date,Math,JSON,Set,Map,WeakMap,Object,Array,String,Number,Boolean,RegExp,Error,Intl,performance,crypto});
(await compiledEngine()).runInContext(context,{timeout:30000});
vm.runInContext(String.raw`
 const SAMPLE_CFG=defaultWorldConfig(); // Preserve the game's active regions and divisions verbatim.
 let SAMPLE_DB=__sampleResume?unpackDB(__sampleResume.game):buildWorld(SAMPLE_CFG);const SAMPLE_OWNER=activeTeams(SAMPLE_DB,null,2).find(t=>t.parent)||activeTeams(SAMPLE_DB,null,1)[0];
 if(!__sampleResume){startCareer(SAMPLE_DB,SAMPLE_OWNER.id,'active-leagues-div2-patch-2026-10-16');
 if(!SAMPLE_OWNER.parent)for(const t of setupTeamsForManager(SAMPLE_DB))autoBuildInitialSquad(SAMPLE_DB,t,new RNG('active-leagues-div2-patch-2026-10-16',t.id),6);
 finalizeInitialRosters(SAMPLE_DB);setManagedTeam(SAMPLE_DB,null);}
 let SAMPLE_DAYS=__sampleResume?.days||0,SAMPLE_SAVES=__sampleResume?.saves||0,SAMPLE_LAST_DATE=SAMPLE_DB.worldDate;
 const SAMPLE_CAPTURED=new Map((__sampleResume?.patches||[]).map(p=>[p.id,p]));
 function sampleSetGroups(db,id){
  const groups={first:{games:0,champions:{}},later:{games:0,champions:{}},unknown:{games:0,champions:{}}};
  for(const season of Object.values(db.world.seasons))for(const day of season.days)for(const match of day.matches){
   // Completed games and consumed partial sessions only. clockGame is future input.
   for(const game of match.res?.games||match.clockSession?.games||[]){
    if(game.patch!==id)continue;
    const group=groups[game.n===1?'first':Number.isInteger(game.n)&&game.n>1?'later':'unknown'];group.games++;
    const add=(cid,key)=>{const row=group.champions[cid]||(group.champions[cid]={p:0,w:0,b:0});row[key]++};
    (game.picks||[]).forEach((side,i)=>side.forEach(cid=>{add(cid,'p');if([game.blue,game.red][i]===game.winner)add(cid,'w')}));
    for(const cid of (game.bans||[]).flat())add(cid,'b');
   }
  }
  return groups;
 }
 function samplePatchSummary(db,id){
  const rows=metaHistoryIndex(db).byPatch.get(id)||[],stats={},divisions={},regions={};
  for(const row of rows){
   const comp=db.competitions[row.comp],group=row.international?'international':String(comp?.div||'unknown'),division=divisions[group]||(divisions[group]={games:0,champions:{}});division.games++;
   for(const rid of row.regions||[])regions[rid]=(regions[rid]||0)+1;
   const add=(bag,cid,key)=>{const s=bag[cid]||(bag[cid]={p:0,w:0,b:0,roles:{}});s[key]++;return s};
   for(const side of row.sides||[])for(const pick of side.picks||[]){
    const s=add(stats,pick.champ,'p'),d=add(division.champions,pick.champ,'p');if(side.win){s.w++;d.w++}
    const r=s.roles[pick.role]||(s.roles[pick.role]={p:0,w:0});r.p++;if(side.win)r.w++;
   }
   for(const cid of row.bans||[]){add(stats,cid,'b');add(division.champions,cid,'b')}
  }
  const patch=getPatch(db,id),champions=Object.values(patch.champions).map(c=>{
   const s=stats[c.id]||{p:0,w:0,b:0,roles:{}};return {cid:c.id,...s,wr:s.p?s.w/s.p:null,interval:patchWinInterval(s.w,s.p)};
  }),counts=champions.map(c=>c.p).sort((a,b)=>a-b),distribution={zero:counts.filter(n=>n===0).length,under5:counts.filter(n=>n<5).length,under20:counts.filter(n=>n<20).length,median:counts[Math.floor(counts.length/2)]||0,max:counts.at(-1)||0};
  return {id,games:rows.length,setGroups:sampleSetGroups(db,id),firstDate:rows[0]?.date||null,lastDate:rows.at(-1)?.date||null,distribution,divisions,regions,champions};
 }
 const sampleRealNewPatch=newPatch;
 newPatch=function(db,date,major,rng){if(db===SAMPLE_DB)SAMPLE_CAPTURED.set(db.patch.id,samplePatchSummary(db,db.patch.id));return sampleRealNewPatch(db,date,major,rng)};
 function sampleDay(){
  if(SAMPLE_DB.world.phase!=='season')return false;
  const r=playWorldDay(SAMPLE_DB);SAMPLE_DAYS++;
  if(SAMPLE_DB.worldDate<SAMPLE_LAST_DATE)throw Error('Study calendar moved backwards');SAMPLE_LAST_DATE=SAMPLE_DB.worldDate;
  if(SAMPLE_DB.world.pendingOfficial?.queue?.length)throw Error('Unmanaged study unexpectedly needs manual play');
  if(SAMPLE_DAYS%100===0){
   const before=stringifyMetaHistory(SAMPLE_DB.metaHistory),restored=unpackDB(packDB(SAMPLE_DB));
   if(stringifyMetaHistory(restored.metaHistory)!==before)throw Error('Study meta changed across full save/restore');SAMPLE_DB=restored;SAMPLE_SAVES++;
  }
  return true;
 }
 function sampleProgress(){return {days:SAMPLE_DAYS,date:SAMPLE_DB.worldDate,phase:SAMPLE_DB.world.phase,games:SAMPLE_DB.metaHistory?.length||0,patch:SAMPLE_DB.patch.id,saves:SAMPLE_SAVES,regions:Object.keys(SAMPLE_DB.regions).length,teamsByDivision:Object.fromEntries([1,2].map(div=>[div,activeTeams(SAMPLE_DB,null,div).length]))}}
`,context,{timeout:120000});
let progress=vm.runInContext('sampleProgress()',context,{timeout:30000});
await writeFile(resolve(output,'start.json'),JSON.stringify({startedUtc,sources,seed:'active-leagues-div2-patch-2026-10-16',scope:'unmodified defaultWorldConfig active regions/divisions and configured international presets, normal patch cadence, canonical autonomous calendar; no winner/draft forcing',config:vm.runInContext('SAMPLE_CFG',context,{timeout:30000}),progress},null,2));
console.log('WORLD_SAMPLE_START '+JSON.stringify(progress));
try{
 for(let i=0;i<maxSteps&&progress.phase==='season';i++){
  vm.runInContext('sampleDay()',context,{timeout:120000});
  progress=vm.runInContext('sampleProgress()',context,{timeout:30000});
  await writeFile(resolve(output,'progress.json'),JSON.stringify({observedUtc:new Date().toISOString(),...progress},null,2));
  const checkpoint=vm.runInContext('({game:packDB(SAMPLE_DB),days:SAMPLE_DAYS,saves:SAMPLE_SAVES,patches:[...SAMPLE_CAPTURED.values()]})',context,{timeout:120000});
  await writeFile(resolve(output,'checkpoint.json'),JSON.stringify({sources,config:vm.runInContext('SAMPLE_CFG',context,{timeout:30000}),...checkpoint}));
  if(i%10===0)console.log('WORLD_SAMPLE_PROGRESS '+JSON.stringify(progress));
 }
 if(progress.phase==='season'&&maxSteps===600)throw Error('Study did not complete a season within 600 calendar steps');
 const report=vm.runInContext(`(()=>{
  SAMPLE_CAPTURED.set(SAMPLE_DB.patch.id,samplePatchSummary(SAMPLE_DB,SAMPLE_DB.patch.id));
  const finished=Object.values(SAMPLE_DB.world.seasons).map(s=>({id:s.id,comp:s.comp,region:s.region,div:SAMPLE_DB.competitions[s.comp]?.div||null,done:s.done}));
  return {progress:sampleProgress(),finished,patches:[...SAMPLE_CAPTURED.values()],currentReview:diagnosePatchMeta(SAMPLE_DB).reviews,patchHistory:SAMPLE_DB.patches.history.map(p=>({id:p.id,date:p.date,major:p.major,analysis:p.analysis,championNotes:p.notes.filter(n=>['skill','base','kit','rework'].includes(n.type))}))};
 })()`,context,{timeout:120000});
 for(const [f,h] of Object.entries(sources))if(sha(await readFile(new URL('../src/artifact/'+f,import.meta.url)))!==h)throw Error('Engine source changed during fixed-source study: '+f);
 const endedUtc=new Date().toISOString();await writeFile(resolve(output,'report.json'),JSON.stringify({startedUtc,endedUtc,elapsedMs:Date.parse(endedUtc)-Date.parse(startedUtc),sources,completeSeason:progress.phase!=='season',...report},null,2));
 console.log('WORLD_SAMPLE_COMPLETE '+JSON.stringify({startedUtc,endedUtc,...progress,patches:report.patches.length}));
}catch(error){await writeFile(resolve(output,'failure.json'),JSON.stringify({startedUtc,endedUtc:new Date().toISOString(),progress,error:error.stack},null,2));throw error}
