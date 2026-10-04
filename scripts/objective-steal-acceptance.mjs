import {runEngineFixture,artifactSource} from './test-harness.mjs';
const engine=await artifactSource('engine.js'),init=engine.slice(engine.indexOf('function simulateMatch(')).replace('  let t;','  return st;\n  let t;').replace('function simulateMatch(','function initialStealState(');
await runEngineFixture(String.raw`(()=>{
 const check=(v,m)=>{if(!v)throw Error('OBJECTIVE_STEAL '+m)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,div2:true,system:'franchise'})];cfg.internationals=[];const db=buildWorld(cfg),[a,b]=activeTeams(db,'NA',1);setManagedTeam(db,a.id);
 for(const t of [a,b])for(const role of ROLES){const p=genPlayer(db,new RNG('match-history|'+t.id+role),{region:t.region,role,age:22,base:65});signContract(db,p,t,1,3);t.depthChart[role]=p.id}
 const state=()=>{const s=initialStealState(db,a.id,b.id,'steal-preflight',null,false);s.t=5;s.obj.dragonAt=5;return s};
 for(const side of [0,1]){
  const st=state(),ps=st.sides[side].ps,j=ps.find(p=>p.role==='JGL'),others=ps.filter(p=>p!==j);j.quest.progress=j.quest.rules.threshold-1;
  const gold=ps.map(p=>p.goldEarned);check(awardMatchObjective(st,'dragon',side,others,false,j),'actual actor not accepted');
  const e=st.objectiveEvents[0];check(e.stealer===j.p.id&&e.participants.length===5&&j.objectives===1&&j.quest.completed,'actor missing from unique participation/real quest');check(ps.every((p,i)=>p.goldEarned===gold[i]+40),'existing gold eligibility changed');
  st.obj.dragonAt=5;st.obj.dragonIdx=0;const before=JSON.stringify(st);check(!awardMatchObjective(st,'dragon',side,others,false,j)&&JSON.stringify(st)===before,'duplicate spawn mutated');
  const duplicate=state(),jp=duplicate.sides[side].ps.find(p=>p.role==='JGL');check(awardMatchObjective(duplicate,'dragon',side,[jp,jp],false,jp)&&jp.objectives===1&&duplicate.objectiveEvents[0].participants.length===1,'actor already participant double credit');
  const normal=state();check(awardMatchObjective(normal,'dragon',side,normal.sides[side].ps)&&!('stealer' in normal.objectiveEvents[0]),'normal claim fabricated stealer');
  const rejected=state(),own=rejected.sides[side].ps,dead=own.find(p=>p.role==='JGL');dead.deadUntil=6;
  for(const actor of [dead,own[0],rejected.sides[1-side].ps[0],{},undefined]){const snap=JSON.stringify(rejected);if(actor===undefined)continue;check(!awardMatchObjective(rejected,'dragon',side,own,false,actor)&&JSON.stringify(rejected)===snap,'invalid actor mutation');}
  const ended=state();ended.ending={kind:'nexus'};const snap=JSON.stringify(ended);check(!awardMatchObjective(ended,'dragon',side,ended.sides[side].ps,false,ended.sides[side].ps[1])&&JSON.stringify(ended)===snap,'terminal mutation');
  const stale=state();stale.obj.dragonAt=6;const ss=JSON.stringify(stale);check(!awardMatchObjective(stale,'dragon',side,stale.sides[side].ps,false,stale.sides[side].ps[1])&&JSON.stringify(stale)===ss,'unavailable spawn mutation');
 }
 const original={teamCall,log,awardMatchObjective},calls=new WeakMap(),pending=new WeakMap(),events=[];
 teamCall=(st,side,key,...rest)=>{const r=original.teamCall(st,side,key,...rest);let c=calls.get(st);if(!c)calls.set(st,c={});(c[key]||=[])[side]=r.part.map(p=>p.p.id);return r};
 log=(st,text,opts)=>{if(text.includes(' 스틸!'))pending.set(st,{actor:st.sides[opts.side].ps.find(p=>p.role==='JGL'),calls:JSON.parse(JSON.stringify(calls.get(st)))});return original.log(st,text,opts)};
 awardMatchObjective=(st,key,side,part,...rest)=>{const p=pending.get(st),before=p&&p.actor.objectives,ok=original.awardMatchObjective(st,key,side,part,...rest);if(p){events.push({actor:p.actor.p.id,call:p.calls[key][side],before,after:p.actor.objectives,receipt:st.objectiveEvents.at(-1)});pending.delete(st)}return ok};
 const world=packDB(db),digest=r=>JSON.stringify({winner:r.winner,ending:r.ending,duration:r.duration,objectives:r.objectiveEvents,takedowns:r.takedownEvents,gold:r.goldHist,ps:r.sides.map(s=>s.ps.map(p=>({id:p.p.id,k:p.k,d:p.d,a:p.a,objectives:p.objectives,quest:p.quest,gold:p.goldEarned,held:p.gold,items:p.items,xp:p.xp,damage:p.dmg})))});
 const results=[];for(const seed of ['objective-steal-source-35','record-official'])for(const ids of [[a.id,b.id],[b.id,a.id]]){
  const r=simulateMatch(db,...ids,seed,null,false),q=simulateMatch(db,...ids,seed,null,true);check(digest(r)===digest(q),'logged/quiet real outcome divergence');check(r.ending.kind==='nexus','real terminal missing');results.push(r);
 }
 const missing=events.find(e=>!e.call.includes(e.actor));check(missing&&missing.receipt.id==='dragon:5:0'&&missing.receipt.stealer===missing.actor&&missing.receipt.participants.includes(missing.actor)&&missing.after===missing.before+1,'natural omitted actor not corrected');
 check(events.every(e=>e.receipt.stealer===e.actor&&e.receipt.participants.filter(id=>id===e.actor).length===1&&e.after===e.before+1),'real steal credit/source mismatch');check(packDB(db)===world,'observer simulation altered world');
 teamCall=original.teamCall;log=original.log;awardMatchObjective=original.awardMatchObjective;
 const unobserved=simulateMatch(db,b.id,a.id,'objective-steal-source-35',null,false);check(digest(unobserved)===digest(results[1]),'read-only wrappers changed actual outcome');
 const natural=results.find(r=>r.objectiveEvents.some(e=>e.stealer===missing.actor)),publicSource=publicMatchRecord(natural,db.patch.id);check(recordedObjectivesValid(publicSource)&&publicSource.objectives.events.some(e=>e.stealer===missing.actor),'actual source lost actor');
 globalThis.esc=s=>String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));check(renderRecordedObjectives(publicSource).includes('스틸 실행: '+db.players[missing.actor].name),'actual archived actor UI disconnected');
 const legacy=JSON.parse(JSON.stringify(publicSource));for(const e of legacy.objectives.events)delete e.stealer;const saved=JSON.stringify(legacy);check(recordedObjectivesValid(legacy)&&!renderRecordedObjectives(legacy).includes('스틸 실행:')&&JSON.stringify(legacy)===saved,'legacy actor fabricated');
 for(const id of ['foreign',null,42,'']){const malformed=JSON.parse(JSON.stringify(publicSource));malformed.objectives.events[0].stealer=id;check(!recordedObjectivesValid(malformed),'malformed source accepted');}
 db.world={year:db.year,manage:'manual',phase:'season',seasons:{}};const session=createSeriesSession(db,a.id,b.id,1,'steal-official-8',{compId:'steal'});db.world.pendingOfficial={queue:[{session}]};const copy=unpackDB(packDB(db)),ss=copy.world.pendingOfficial.queue[0].session;playSeriesSessionGame(copy,ss,null,false);const rec=seriesSessionResult(copy,ss).rec,g=rec.games[0];check(recordedPublicMatch(copy,rec,g).record&&recordedObjectivesValid(g.publicRecord)&&g.publicRecord.objectives.events.some(e=>e.stealer),'actual official stealer source invalid');
 copy.world.seasons.steal={id:'steal',comp:'steal',region:'NA',done:true,days:[{date:g.date,matches:[{res:rec}]}]};for(const region of ['NA','EU']){copy.world.seasons.steal.region=region;const reloaded=unpackDB(packDB(copy));check(JSON.stringify(reloaded.world.seasons.steal.days[0].matches[0].res.games[0].publicRecord)===JSON.stringify(g.publicRecord),'actual full/lite history changed');}
 console.log('OBJECTIVE_STEAL_ACCEPTANCE PASS '+JSON.stringify({pairs:4,observedSteals:events.length,naturalOmission:missing,uniqueCredit:true,existingGold:true,invalidAtomic:true,officialPendingFullLite:true,officialStealers:g.publicRecord.objectives.events.filter(e=>e.stealer).length,legacyPure:true}));
})()`,{timeout:60000,setupSources:[init,await artifactSource('ui-match-history.js'),await artifactSource('ui-takedown-history.js')]});
