import assert from 'node:assert/strict';
import {runEngineFixture} from './test-harness.mjs';
const result=await runEngineFixture(String.raw`(()=>{
 const passed=[],check=(v,m)=>{if(!v)throw Error('PATCH_LIFECYCLE '+m)},test=(name,fn)=>{fn();passed.push(name)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:10,div2:false})];cfg.internationals=[];
 let db=buildWorld(cfg);const teams=activeTeams(db).slice(0,2).map(t=>t.id);
 startCareer(db,teams[0],'patch-lifecycle');autoBuildInitialSquad(db,db.teams[teams[0]],new RNG('patch-lifecycle','squad'),5);finalizeInitialRosters(db);
 const comp='PATCH_LOCK_FIXTURE';db.competitions[comp]={id:comp,name:'통제된 패치 고정 대회',international:true,teams,stages:[{id:'regular',name:'검증',type:'round_robin',legs:2,bestOf:3}],rules:{fearless:true}};
 const opening=addDays(db.worldDate,2),s=newSeason(db,comp,db.year,'patch-lock',opening);db.world.seasons[comp]=s;
 test('planning and early registration views do not pin a future opening patch',()=>{check(!s.patchLock,'planning pinned patch');officialMatchView(db,s,...teams);check(!s.patchLock,'view wrote lock')});
 db.worldDate=s.days[0].date;newPatch(db,db.worldDate,false,new RNG('patch-opening'));
 const openingId=db.patch.id;lockInternationalPatch(db,s);
 const queued=unpackDB(packDB(db));setManagedTeam(queued,null);const qs=queued.world.seasons[comp],qm=qs.days[0].matches[0];prepareOfficialClockGame(queued,qs,qm);
 test('actual opening fixes eligible pool and complete numeric patch',()=>{check(s.patchLock.id===openingId&&s.patchLock.date===db.worldDate,'opening identity');check(JSON.stringify(s.championPool)===JSON.stringify(Object.values(db.patch.champions).filter(c=>championProEligible(db,c)).map(c=>c.id)),'opening pool')});
 const day=s.days[0],m=day.matches[0],opts=scheduledSeriesOptions(db,s,day,db.competitions[comp].stages[0]),sess=createSeriesSession(db,m.a,m.b,m.bo,'patch-lock-series',opts),fixed=JSON.stringify(db.patch);
 playSeriesSessionGame(db,sess,null,true);
 db.worldDate=addDays(db.worldDate,1);newPatch(db,db.worldDate,true,new RNG('patch-world-change'));
 test('world changes leave international numbers and subsequent fearless sets fixed',()=>{
  check(db.patch.id!==openingId,'world failed to change');const view=seriesOfficialView(db,sess);check(JSON.stringify(view.patch)===fixed,'numeric patch drift');check(view.patch.id===openingId&&view.patch!==db.patch,'world patch reused');
  while(!seriesSessionDone(sess))playSeriesSessionGame(db,sess,null,true);
  const out=seriesSessionResult(db,sess);check(out.rec.patch===openingId&&out.rec.games.every(g=>g.patch===openingId),'series or game record mislabeled');check(db.metaHistory.filter(row=>row.comp===comp).every(row=>row.patch===openingId),'international observations used world fallback');check(sess.ctx.used.length>0,'fearless usage missing');
 });
 test('queued official game rejects changed patch labels without writing state',()=>{
  for(const field of ['observation','game','public']){const event=JSON.parse(JSON.stringify(qm.clockGame));if(field==='observation')event.observation.patch='wrong';else if(field==='game')event.session.games.at(-1).patch='wrong';else event.session.games.at(-1).publicRecord.patch='wrong';const before=JSON.stringify(queued);let rejected=false;try{officialQueuedGameError(queued,qs,qm,event)}catch{rejected=true}check(rejected&&JSON.stringify(queued)===before,'changed '+field+' patch accepted or wrote state')}
 });
 test('ordinary leagues and practice read current world patch',()=>{const domestic=Object.values(db.world.seasons).find(x=>!db.competitions[x.comp].international);check(officialMatchView(db,domestic,...teams).patch===db.patch,'domestic frozen');check(seriesOfficialView(db,{...sess,opt:{...sess.opt,practice:true}}).patch===db.patch,'practice frozen')});
 test('full save restores pinned numeric patch and next fixture context',()=>{db=unpackDB(packDB(db));const restored=db.world.seasons[comp];check(restored.patchLock.id===openingId,'lock lost');check(JSON.stringify(internationalMatchPatch(db,restored))===fixed,'historic values lost');const options=scheduledSeriesOptions(db,restored,restored.days[1],db.competitions[comp].stages[0]);check(JSON.stringify(options.championPool)===JSON.stringify(s.championPool),'next-round pool drift')});
 test('roster inspection remains read-only without inventing missing opening metadata',()=>{const d=unpackDB(packDB(db)),saved=d.world.seasons[comp];delete saved.patchLock;const before=JSON.stringify(d);officialMatchView(d,saved,...teams);check(JSON.stringify(d)===before,'roster inspection wrote opening data');let rejected=false;try{seriesOfficialView(d,{a:teams[0],b:teams[1],opt:{metaContext:{season:saved.id}}})}catch{rejected=true}check(rejected&&JSON.stringify(d)===before,'actual series silently used current patch')});
 test('missing historic lock and unknown patch fail instead of using newest values',()=>{const saved=db.world.seasons[comp],bad={...saved,patchLock:{id:'missing-patch',date:opening}};let rejected=false;try{internationalMatchPatch(db,bad)}catch{rejected=true}check(rejected,'missing patch silently fell back');rejected=false;try{lockInternationalPatch(db,{...saved,patchLock:null})}catch{rejected=true}check(rejected,'unknown opening inferred from later patch')});
 test('next event pins its own actual opening instead of previous tournament',()=>{const next={...db.world.seasons[comp],id:'next-event',patchLock:null,championPool:null,days:[{date:db.worldDate}]};lockInternationalPatch(db,next);check(next.patchLock.id===db.patch.id&&next.patchLock.id!==openingId,'next event inherited stale lock')});
 test('season major and split major both retain 21-day adaptation',()=>{const d=unpackDB(packDB(db));seasonPatch(d,d.worldDate,new RNG('cadence-major'));check(d.patches.nextDate===addDays(d.worldDate,21),'season adaptation missing');d.world.majorPatchEvents=[{date:d.worldDate,step:99,split:2}];applyCalendarPatchEvents(d,d.worldDate);check(d.patches.nextDate===addDays(d.worldDate,21),'split adaptation missing')});
 test('insufficient current-patch official sample defers without RNG or catch-up burst',()=>{const d=unpackDB(packDB(db)),due=d.worldDate;d.patches.nextDate=due;d.metaHistory=[];const id=d.patch.id,count=d.patches.history.length;patchTick(d,addDays(due,20),{chance:()=>{throw Error('premature RNG')}});check(d.patch.id===id&&d.patches.nextDate===due&&d.patches.history.length===count,'sparse sample patched');d.metaHistory=Array.from({length:24},()=>({date:due,patch:openingId,sides:[],bans:[]}));patchTick(d,addDays(due,20),{chance:()=>{throw Error('old international RNG')}});check(d.patch.id===id,'old international sample fed world patch');d.metaHistory=d.metaHistory.map(r=>({...r,patch:id}));const applied=addDays(due,20);patchTick(d,applied,new RNG('cadence-observed'));check(d.patches.history.length===count+1&&d.patches.history.at(-1).date===applied&&d.patches.nextDate>applied,'retroactive burst or wrong effective date')});
 test('53/47 are uncertain performance signals; low use never grants buffs',()=>{
  const d=unpackDB(packDB(db)),cid=Object.keys(d.patch.champions)[0],rows=Array.from({length:200},(_,i)=>({date:d.worldDate,patch:d.patch.id,sides:[{team:teams[i%2],region:'NA',win:i<104,picks:[{champ:cid,role:'TOP',player:'p'+i}]}],bans:[]}));
  const a=patchChampionEvidence(d,cid,rows),b=patchChampionEvidence(d,cid,rows.map((r,i)=>({...r,sides:[{...r.sides[0],win:i<160}]})));
  check(a.nerfSignal<b.nerfSignal&&patchWinInterval(104,200).lower<.53&&patchWinInterval(160,200).lower>.53,'uncertain or strong win signal');check(patchChampionEvidence(d,cid,[]).buffSignal===0,'low use buff');
 });
 return {passed,controlledFixtures:true,interpretation:'native series/draft/save and patch writers; controlled tournament/observations are acceptance fixtures, not full-season frequency evidence'};
})()`,{timeout:120000});
assert.equal(result.passed.length,12);console.log('PATCH_LIFECYCLE_ACCEPTANCE '+JSON.stringify(result));
