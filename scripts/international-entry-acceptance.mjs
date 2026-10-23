import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {runEngineFixture} from './test-harness.mjs';
const result=await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error('INTERNATIONAL_ENTRY '+m)},cfg=defaultWorldConfig();cfg.regions=cfg.regions.map(r=>({...r,teams:6,splits:1,div2:false}));cfg.internationals=[];
 const planned=buildWorld();startWorldSeason(planned,activeTeams(planned,'KR',1)[0].id,'entry-publication-order');
 check(planned.world.steps.flatMap(s=>s.kind==='intl'?s.ids:[]).join(',')==='FIRST_STAND,MID_SEASON_INVITATIONAL,EASTERN_CUP,WESTERN_CUP,WORLD_CHAMPIONSHIP,MASTERS,OPEN','actual publisher did not prioritize upper-tier events');
 check([{id:'A',tier:'top',prestige:1},{id:'B',tier:'top',prestige:3}].sort(internationalEventPriority).map(x=>x.id).join()==='A,B','legacy top ordering changed');
 const db=buildWorld(cfg),owner=activeTeams(db,'NA',1)[0];startCareer(db,owner.id,'entry-actual-qualifiers');for(const t of setupTeamsForManager(db))autoBuildInitialSquad(db,t,new RNG('entry-qualifier/'+t.id));finalizeInitialRosters(db);db.world.manage='auto';
 let turns=0;while(activeSeasons(db).length&&turns++<500){const date=nextDate(db);setWorldCalendarDate(db,date);for(const s of activeSeasons(db))if(s.days[s.cur]?.date===date)playDay(db,s);}
 check(!activeSeasons(db).length,'regional official writer did not finish');const qualifiers=Object.values(db.world.seasons);check(qualifiers.length===6&&qualifiers.every(s=>s.done),'six actual regional seasons');
 const rawRegional=JSON.stringify(db.world.seasons),qualifierGames=qualifiers.flatMap(s=>s.days.flatMap(d=>d.matches)).reduce((n,m)=>{check(m.res.games.every(g=>g.publicRecord?.ending.kind==='nexus'),'regional nexus source');return n+m.res.games.length},0);
 db.worldConfig.internationals=defaultWorldConfig().internationals;const base=packDB(db),regional=JSON.stringify(unpackDB(base).world.seasons),worlds=db.worldConfig.internationals.find(x=>x.id==='WORLD_CHAMPIONSHIP'),readBefore=JSON.stringify(db);
 const predicted=presetInternationalEntries(db,worlds,new Set());check(predicted.length===24&&JSON.stringify(db)===readBefore,'read-only declared Worlds slots');
 for(const s of qualifiers){const R=db.regions[db.competitions[s.comp].region],sd=s.stageData.playoffs,expected=new Set([s.champion,...sd.elim.slice(-3)]),chosen=predicted.filter(t=>db.teams[t].region===R.id);check(chosen.length===4&&chosen.every(t=>expected.has(t)),'actual top four playoff entrants '+R.id);}
 let fixture=null;const originalStrength=teamStrength;teamStrength=()=>{throw Error('entry read current hidden strength after qualification')};
 try{
  check(startInternational(db,'FIRST_STAND','2027-06-01',new Set()),'actual First Stand writer');check(db.competitions.FIRST_STAND.teams.length===12,'First Stand base slots');
  check(startInternational(db,'MID_SEASON_INVITATIONAL','2027-07-01',new Set()),'actual MSI writer');check(db.competitions.MID_SEASON_INVITATIONAL.teams.length===16,'MSI declared extras');
  check(JSON.stringify(Object.fromEntries(Object.entries(db.world.seasons).filter(([,s])=>!db.competitions[s.comp].international)))===rawRegional,'constructors changed original full regional graph');
  db.worldConfig.internationals.find(x=>x.id==='MID_SEASON_INVITATIONAL').phase=3;
  check(db.world.seasons.MID_SEASON_INVITATIONAL.internationalPeriodSnapshot.phase===2,'current config changed original event period');
  let resumed=unpackDB(packDB(db));
  for(const original of qualifiers){const saved=resumed.world.seasons[Object.keys(db.world.seasons).find(k=>db.world.seasons[k]===original)];for(let di=0;di<original.days.length;di++)for(let mi=0;mi<original.days[di].matches.length;mi++){const a=original.days[di].matches[mi].res,b=saved.days[di].matches[mi].res;check(a.seed===b.seed&&a.winner===b.winner&&JSON.stringify(a.score)===JSON.stringify(b.score),'native official identity/result changed');for(let gi=0;gi<a.games.length;gi++)check(JSON.stringify(a.games[gi].publicRecord)===JSON.stringify(b.games[gi].publicRecord),'native public record changed');}}
for(const id of ['EASTERN_CUP','WESTERN_CUP'])check(startInternational(resumed,id,'2027-07-01',new Set()),'resumed Cup writer '+id);
  const mid=['MID_SEASON_INVITATIONAL','EASTERN_CUP','WESTERN_CUP'].flatMap(id=>resumed.competitions[id].teams);check(mid.length===32&&new Set(mid).size===32,'same-phase native resume reused entrant');
  const cup=resumed.worldConfig.internationals.find(x=>x.id==='EASTERN_CUP'),nullable=presetInternationalEntries(resumed,{...cup,phase:null},new Set()),normal=presetInternationalEntries(resumed,cup,new Set());
  // Thirty-two of the 36 qualified clubs are committed; two eastern clubs remain.
  check(nullable.length===2&&nullable.join()===normal.join()&&nullable.every(t=>!mid.includes(t)),'null optional phase ignored published participation');
  for(const [id,regions] of [['EASTERN_CUP',['KR','CN','AP']],['WESTERN_CUP',['EU','NA','BR']]]){const teams=resumed.competitions[id].teams;check(teams.length===8&&regions.map(r=>teams.filter(t=>resumed.teams[t].region===r).length).join(',')==='3,3,2','Cup coefficient 3-3-2 '+id);}
  check(startInternational(resumed,'WORLD_CHAMPIONSHIP','2027-09-01',new Set()),'later phase Worlds writer');check(resumed.competitions.WORLD_CHAMPIONSHIP.teams.length===24,'Worlds capacity and phase isolation');
  check(JSON.stringify(Object.fromEntries(Object.entries(resumed.world.seasons).filter(([,s])=>!resumed.competitions[s.comp].international)))===regional,'entry rewrote completed regional records');
  const before=JSON.stringify(resumed);check(!startInternational(resumed,'WORLDS','2027-09-01',new Set())&&JSON.stringify(resumed)===before,'duplicate canonical bracket mutation');
  fixture=packDB(resumed);
 }finally{teamStrength=originalStrength;}
 const limits=unpackDB(base),first=limits.worldConfig.internationals.find(x=>x.id==='FIRST_STAND'),msi=limits.worldConfig.internationals.find(x=>x.id==='MID_SEASON_INVITATIONAL');
 check(presetInternationalEntries(limits,{...first,entry:null},new Set()).length===12,'null optional entry mode');
 for(const bad of [NaN,Infinity,-1,3,1.5])check(presetInternationalEntries(limits,{...first,teams:bad},new Set()).length===0,'invalid named-preset capacity fell back');
 check(presetInternationalEntries(limits,{...msi,extraSlots:0},new Set()).length===12,'unpublished extras invented');
 check(presetInternationalEntries(limits,{...worlds,maxSlots:3},new Set()).length===18,'per-region hard cap ignored');
 const short=limits.regions.KR.short;limits.regions.KR.short='RENAMED';check(presetInternationalEntries(limits,worlds,new Set()).join()===predicted.join(),'renamed league lost actual qualification');limits.regions.KR.short=short;
 const future=unpackDB(base);for(const s of Object.values(future.world.seasons))s.year=future.world.year+1;
 const noFuture=presetInternationalEntries(future,worlds,new Set()).join();for(const s of Object.values(future.world.seasons)){[s.champion,s.runnerUp]=[s.runnerUp,s.champion];s.stageData.playoffs.elim.reverse();}check(presetInternationalEntries(future,worlds,new Set()).join()===noFuture,'future regional results changed current entries');
 const rising=addRegion(limits,new RNG('entry-new-region'),regionCfg('JP',{teams:6,div2:false}));check(rising.tier==='emerging'&&presetInternationalEntries(limits,worlds,new Set()).every(t=>limits.teams[t].region!=='JP'),'new region acquired automatic direct berth');
 const legacy=unpackDB(base),legacyA={...first,id:'LEGACY_A',name:'Legacy invitation A',teams:6,format:'groups_ko',tier:'top',entry:'champions'},legacyB={...first,id:'LEGACY_B',name:'Legacy invitation B',teams:6,format:'groups_ko',tier:'low',entry:'champions'};legacy.worldConfig.internationals=[legacyA,legacyB];
 check(startInternational(legacy,'LEGACY_A','2027-06-01',new Set()),'legacy writer stopped working');legacy.worldConfig.internationals=[legacyB];const legacyBefore=JSON.stringify(legacy);
 check(!startInternational(legacy,'LEGACY_B','2027-06-01',new Set())&&JSON.stringify(legacy)===legacyBefore,'legacy entry reused published champions after config removal');
 // Failure must roll back the real writer and the caller-owned exclusion set.
 const failed=unpackDB(base),set=new Set([owner.id]),before=JSON.stringify(failed),finance=failed.teams[owner.id].finance,originalNewSeason=newSeason;let rejected=false;
 newSeason=function(game,...args){originalNewSeason(game,...args);game.teams[owner.id].finance.cash--;throw Error('entry rollback probe')};
 try{startInternational(failed,'FIRST_STAND','2027-06-01',set)}catch(e){rejected=e.message==='entry rollback probe'}finally{newSeason=originalNewSeason;}
 check(rejected&&JSON.stringify(failed)===before&&failed.teams[owner.id].finance===finance&&set.size===1&&set.has(owner.id),'constructor failure whole-state/reference/exclusion rollback');
 const late=unpackDB(base),lateSet=new Set(),lateBefore=JSON.stringify(late),worldRef=late.world,originalNews=news;let lateRejected=false;
 news=function(...args){originalNews(...args);throw Error('late entry rollback')};try{startInternational(late,'FIRST_STAND','2027-06-01',lateSet)}catch(e){lateRejected=e.message==='late entry rollback'}finally{news=originalNews}
 check(lateRejected&&JSON.stringify(late)===lateBefore&&late.world===worldRef&&lateSet.size===0,'late news/registration/season/reference rollback');
 late.worldConfig.internationals.find(x=>x.id==='FIRST_STAND').maxSlots=0;const denied=JSON.stringify(late);check(!startInternational(late,'FIRST_STAND','2027-06-01',lateSet)&&JSON.stringify(late)===denied&&lateSet.size===0,'zero rights created event or mutated state');

 return {fixture,regionalSeasons:6,qualifierGames,scope:'six configured six-team regions; direct official writer, not full default world daily AI',firstStand:12,msi:16,cups:[8,8],worlds:24,samePhaseUnique:32,actualPlayoffQualification:true,publicationPriority:true,legacyExclusions:true,pureProjection:true,hiddenStrengthNotRead:true,nativeResume:true,regionalHistoryUnchanged:true,constructorRollback:true,mastersOpenAllocationNotCompleted:true,msiWorldsFormatsNotCompleted:true};
})()`,{timeout:180000});
if(process.env.INTERNATIONAL_ENTRY_FIXTURE)await writeFile(process.env.INTERNATIONAL_ENTRY_FIXTURE,JSON.stringify({game:result.fixture}));delete result.fixture;
assert(result.constructorRollback);console.log('INTERNATIONAL_ENTRY_ACCEPTANCE',JSON.stringify(result));
