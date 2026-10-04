// Bounded, optional source investigation. This is not professional calibration,
// a production policy change, or a test requiring the known defect to remain.
import assert from 'node:assert/strict';
import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runEngineFixture} from './test-harness.mjs';
const seedArg=process.argv.find(x=>x.startsWith('--seeds='));
const seeds=seedArg?seedArg.slice(8).split(','):['record-official','shop-availability-A','shop-availability-B','shop-availability-C'];
assert(seeds.length>0&&seeds.length<=8&&seeds.every(x=>x.length>0&&x.length<=100),'Use 1–8 bounded seeds');
const output=process.argv.find(x=>x.startsWith('--output='))?.slice(9);
const sourceFiles=['engine.js','item-purchases.js','role-quest-match.js','champion-source.js','system-source.js'];
const sourceHashes=Object.fromEntries(await Promise.all(sourceFiles.map(async file=>[file,createHash('sha256').update(await readFile(new URL('../src/artifact/'+file,import.meta.url))).digest('hex')])));
const data=await runEngineFixture(`(()=>{
 const seeds=${JSON.stringify(seeds)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,div2:true,system:'franchise'})];cfg.internationals=[];
 const db=buildWorld(cfg),[a,b]=activeTeams(db,'NA',1);setManagedTeam(db,a.id);
 for(const t of [a,b])for(const role of ROLES){const p=genPlayer(db,new RNG('match-history|'+t.id+role),{region:t.region,role,age:22,base:65});signContract(db,p,t,1,3);t.depthChart[role]=p.id}
 db.world={year:db.year,manage:'manual',phase:'season',seasons:{}};
 const savedWorld=packDB(db);
 const projection=r=>({winner:r.winner,ending:r.ending,duration:r.duration,durationStr:r.durationStr,goldHist:r.goldHist,firsts:r.firsts,draft:r.draft,log:r.log,expl:r.expl,
 sides:r.sides.map(s=>({team:s.team.id,towers:s.towers,inhibAt:s.inhibAt,nexusT:s.nexusT,nexus:s.nexus,kills:s.kills,towersTaken:s.towersTaken,dragons:s.dragons,barons:s.barons,
 players:s.ps.map(p=>({id:p.p.id,role:p.role,champ:p.champ.id,lvl:p.lvl,xp:p.xp,earned:p.goldEarned,held:p.gold,spent:p.itemSpent,wardSpent:p.questWardSpent||0,items:p.items,runes:p.runes,k:p.k,d:p.d,a:p.a,cs:p.cs,dmg:p.dmg,dmgTaken:p.dmgTaken,vision:p.vision,objectives:p.objectives,quest:p.quest,questBoots:p.questBoots,recall:p.recall,deadUntil:p.deadUntil,hp:p.hp}))}))});
 const baseline=seeds.map(seed=>{const copy=unpackDB(packDB(db));return [false,true].map(quiet=>projection(simulateMatch(copy,a.id,b.id,seed,null,quiet)))});
 for(const pair of baseline){const core=r=>{const {log,expl,...core}=r;return JSON.stringify(core)};if(core(pair[0])!==core(pair[1]))throw Error('Logged/quiet adjudication differs')}
 const originals={incomeTick,visionTick,laningTick,jungleTick,objectiveTick,macroTick,towerTick,killPlayer,commitItemCraftBatch,roleQuestWard,log};
 let context=null,current=null;
 const inPhase=(name,fn,args)=>{const previous=context;context={name,st:args[0],parent:previous?.name||null};try{return fn(...args)}finally{context=previous}};
 incomeTick=(...args)=>inPhase('income',originals.incomeTick,args);
 visionTick=(...args)=>inPhase('vision',originals.visionTick,args);
 laningTick=(...args)=>inPhase('laning',originals.laningTick,args);
 jungleTick=(...args)=>inPhase('jungle',originals.jungleTick,args);
 objectiveTick=(...args)=>inPhase('objective',originals.objectiveTick,args);
 macroTick=(...args)=>inPhase('macro',originals.macroTick,args);
 towerTick=(...args)=>inPhase('tower',originals.towerTick,args);
 killPlayer=(...args)=>{
  const [st,,victim]=args,before={hp:victim.hp,deadUntil:victim.deadUntil,recall:victim.recall};
  const result=inPhase('kill',originals.killPlayer,args);
  if(current)current.deaths.push({minute:st.t,eventSecond:st.eventSecond,player:victim.p.id,before,after:{hp:victim.hp,deadUntil:victim.deadUntil,recall:victim.recall,penalty:victim.penalty},aliveNow:alive(st,victim),aliveAtDeadline:alive({...st,t:victim.deadUntil},victim),locationStateFields:['location','baseAvailable','shopState','recallUntil','returnAt'].filter(k=>Object.hasOwn(victim,k))});
  return result;
 };
 commitItemCraftBatch=(p,actions,next)=>{
  const before={held:p.gold,spent:p.itemSpent,items:p.items.slice()},result=originals.commitItemCraftBatch(p,actions,next);
  if(result&&current){const st=context?.st;current.crafts.push({phase:context?.name||'unknown',parent:context?.parent||null,minute:st?.t??null,eventSecond:st?.eventSecond??null,player:p.p.id,role:p.role,champion:p.champ.id,recall:p.recall,deadUntil:p.deadUntil,
   locationStateFields:['location','baseAvailable','shopState','recallUntil','returnAt'].filter(k=>Object.hasOwn(p,k)),actions:actions.map(x=>({id:x.id,cost:x.cost,consume:x.consume})),before,after:{held:p.gold,spent:p.itemSpent,items:p.items.slice()}})}
  return result;
 };
 roleQuestWard=(st,p)=>{const before=p.questWardSpent||0,result=originals.roleQuestWard(st,p);if(current&&(p.questWardSpent||0)>before)current.wards.push({minute:st.t,eventSecond:st.eventSecond,player:p.p.id,role:p.role,champion:p.champ.id,recall:p.recall,deadUntil:p.deadUntil,cost:p.questWardSpent-before});return result};
 log=(st,text,opt={})=>{const result=originals.log(st,text,opt);if(current&&opt.kind==='recall')current.recalls.push({minute:st.t,eventSecond:st.eventSecond,text,quiet:st.quiet,players:st.sides.flatMap(s=>s.ps).filter(p=>p.recall).map(p=>({id:p.p.id,hp:p.hp,recall:p.recall,deadUntil:p.deadUntil,locationStateFields:['location','baseAvailable','shopState','recallUntil','returnAt'].filter(k=>Object.hasOwn(p,k))}))});return result};
 const runs=[];
 seeds.forEach((seed,index)=>{for(const quiet of [false,true]){
  current={seed,quiet,crafts:[],wards:[],recalls:[],deaths:[]};const copy=unpackDB(packDB(db)),r=simulateMatch(copy,a.id,b.id,seed,null,quiet),actual=projection(r);
  if(JSON.stringify(actual)!==JSON.stringify(baseline[index][quiet?1:0]))throw Error('Probe changed actual seeded outcome/stats/history: '+seed+'/'+quiet);
  runs.push({...current,winner:r.winner,duration:r.duration,ending:r.ending,parity:true});current=null;
 }});
 // Observe the actual shared writers directly. These synthetic invocations do
 // not establish physical location or claim that the Ornn exception exists.
 const directWriters=[];
 for(const name of ['Ornn','JarvanIV']){
  const cid=Object.keys(db.patch.champions).find(id=>db.patch.champions[id].name.replaceAll(' ','')===name);
  if(!cid)throw Error('Missing reviewed champion: '+name);
  for(const consumable of [false,true]){
   const d=Object.values(db.patch.itemDefs).find(d=>d.active!==false&&d.shopActive!==false&&!(d.from?.length)&&!d.requiredChampion&&d.cost>0&&(d.tier==='consumable')===consumable);
   if(!d)throw Error('Missing source item');
   const p=newPS(db.players[a.depthChart.TOP],0,'TOP',cid,db.patch);
   p.items=[];p.starterItem=null;p.itemSpent=0;p.gold=p.goldEarned=d.cost;p.itemActions=[];p.itemPlan=[];p.quest=null;
   const before=JSON.stringify(p),accepted=applyItemCraftAction(p,{id:d.id,cost:d.recipeCost??d.cost,consume:d.from||[]});
   directWriters.push({champion:name,item:d.id,name:d.name,tier:d.tier,consumable,cost:d.cost,accepted,held:p.gold,spent:p.itemSpent,inventory:p.items.slice(),changed:before!==JSON.stringify(p),locationStateFields:['location','baseAvailable','shopState','recallUntil','returnAt'].filter(k=>Object.hasOwn(p,k))});
  }
 }
 if(packDB(db)!==savedWorld)throw Error('Source probe changed original world/save');
 return {worldSavePure:true,loggedQuietParity:true,sourcePatch:CHAMPION_SOURCE_SNAPSHOT.version,sourceCommit:CHAMPION_SOURCE_SNAPSHOT.sourceCommit,ornnPassive:CHAMPION_SOURCE_SNAPSHOT.champions.Ornn.passive,directWriters,runs};
})()`,{timeout:60000,filename:'shop-availability-source-probe'});
const result={schema:1,kind:'fictional-engine-read-only-shop-source-probe',sourceHashes,method:'Original production functions; wrappers observe craft/ward/recall/death only, no RNG/outcome/state edits; exact projection parity against unwrapped seeded runs. Isolated direct writer invocations use cloned synthetic participants, not official records.',limits:['No proven physical position from recall=false or synthetic direct invocation','Purchases while dead are observations, not a claim that buying while dead is illegal','Minute/event cursor is aggregate ordering, not exact recall/travel seconds','Ornn direct writer acceptance does not prove a lawful passive exception','No imported professional matches or new mechanics/timers','No ordinary own-base shop/recall cancellation/respawn-return implementation'],...data};
if(output)await writeFile(output,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({seeds:seeds.length,runs:data.runs.length,parity:data.runs.every(r=>r.parity),directWriters:data.directWriters,summary:data.runs.map(r=>({seed:r.seed,quiet:r.quiet,crafts:r.crafts.length,craftsInsideKill:r.crafts.filter(c=>c.phase==='kill').length,craftsWhileDead:r.crafts.filter(c=>c.deadUntil>c.minute).length,wardPurchases:r.wards.length,recalls:r.recalls.length,deaths:r.deaths.length,lastRecallMinute:r.recalls.at(-1)?.minute??null,explicitShopStates:r.crafts.filter(c=>c.locationStateFields.length).length}))}));
