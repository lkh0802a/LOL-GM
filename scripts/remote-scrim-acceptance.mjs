import assert from 'node:assert/strict';
import {runEngineFixture} from './test-harness.mjs';

const result=await runEngineFixture(String.raw`(()=>{
  const check=(ok,why)=>{if(!ok)throw Error('REMOTE_SCRIM '+why)};
  const cfg=defaultWorldConfig();
  cfg.regions=['KR','CN','NA'].map(id=>regionCfg(id,{teams:10,div2:false}));cfg.internationals=[];
  const db=buildWorld(cfg),a=activeTeams(db,'KR',1)[0],b=activeTeams(db,'CN',1)[0],far=activeTeams(db,'NA',1)[0];
  startCareer(db,a.id,'remote-scrim');
  for(const t of activeTeams(db,null,1))autoBuildInitialSquad(db,t,new RNG('remote-roster/'+t.id),5);
  finalizeInitialRosters(db);db.worldDate=addDays(nextDate(db),-10);
  for(const p of Object.values(db.players)){p.fatigue=0;p.condition=96;p.medicalPlan='normal';p.injury=null;}
  negotiationStore(db);recruitmentStore(db);
  const original=JSON.stringify(db),overlap=scrimTimeOverlap(db,a,b,db.worldDate,'afternoon');
  check(teamPracticeVenue(db,a).region!==teamPracticeVenue(db,b).region&&scrimOverlapGames(overlap)===2,'actual remote UTC overlap');
  const offer=scrimPartnerAssessment(db,a,b);
  check(offer.allowed,'different regions must not forbid available remote practice');
  check(JSON.stringify(db)===original,'assessment mutates world');
  check(!scrimPartnerAssessment(db,a,far).allowed&&!scrimTimeOverlap(db,a,far,db.worldDate,'afternoon'),'no shared hours must still refuse');

  const local=unpackDB(packDB(db));local.teams[b.id].region=a.region;
  local.teams[b.id].practiceTimeZone=teamPracticeVenue(db,b).timeZone;
  const same=scrimPartnerAssessment(local,local.teams[a.id],local.teams[b.id]);
  check(same.allowed&&same.acceptance===offer.acceptance&&same.weight===offer.weight&&JSON.stringify(same.left)===JSON.stringify(offer.left)&&JSON.stringify(same.right)===JSON.stringify(offer.right),'region adds a ping or strength penalty');
  const schedule=scrimScheduleContext(db,activeTeams(db));
  check(JSON.stringify(scrimPartnerAssessment(db,a,b,null,null,null,schedule))===JSON.stringify(offer),'cached remote assessment differs');
  const moved=unpackDB(packDB(db));moved.teams[b.id].practiceTimeZone='America/Los_Angeles';
  check(!scrimPartnerAssessment(moved,moved.teams[a.id],moved.teams[b.id]).allowed,'remote team with no overlap accepted');
  const embargo=unpackDB(packDB(db));embargo.world.seasons._remoteRival={days:[{date:addDays(db.worldDate,3),matches:[{a:a.id,b:b.id,res:null}]}]};
  check(!scrimPartnerAssessment(embargo,embargo.teams[a.id],embargo.teams[b.id]).allowed,'remote practice bypasses official rival secrecy');

  const command={type:'scrim.request',actor:'manager',teamId:a.id,opponentId:b.id,date:addDays(db.worldDate,2),slot:'afternoon',games:2};
  let accepted=null,declined=null;
  for(let i=0;i<50&&(!accepted||!declined);i++){
    const x=unpackDB(packDB(db));x.world.seed='remote-consent-'+i;
    const before=JSON.stringify(x),p=previewWorldAction(x,command);
    check(p.ok&&JSON.stringify(x)===before,'remote preview not legal or pure');
    if(p.changes[0].status==='accepted'&&!accepted)accepted=x;
    if(p.changes[0].status==='declined'&&!declined)declined=x;
  }
  check(accepted&&declined,'actual independent consent must accept and refuse');
  const booked=commitWorldAction(accepted,command);
  check(booked.ok&&booked.accepted&&scrimPlans(accepted)[0].status==='accepted','existing booking writer');
  const basis=scrimPlans(accepted)[0].scheduleBasis;
  check(basis.venues[0].region==='KR'&&basis.venues[1].region==='CN'&&basis.startsAt===scrimTimeOverlap(accepted,accepted.teams[a.id],accepted.teams[b.id],command.date,command.slot).startsAt,'booking invents travel or loses actual time zones');
  check(!accepted.teams[a.id].practiceDay&&!accepted.teams[b.id].practiceDay&&!accepted.teams[a.id].scrimLog?.length,'reservation grants practice');
  const duplicate=JSON.stringify(accepted);check(!commitWorldAction(accepted,command).ok&&JSON.stringify(accepted)===duplicate,'duplicate request changes reservation');
  check(commitWorldAction(declined,command).ok&&scrimPlans(declined)[0].status==='declined','independent refusal missing');
  const refusal=JSON.stringify(declined);check(!commitWorldAction(declined,{...command,games:1}).ok&&JSON.stringify(declined)===refusal,'refusal rerolls consent');

  const saved=packDB(accepted),first=unpackDB(saved),second=unpackDB(saved);
  first.worldDate=second.worldDate=command.date;
  const meta=first.metaGames,official=JSON.stringify(first.world.seasons);
  runScheduledScrims(first);runScheduledScrims(second);
  check(packDB(first)===packDB(second),'saved remote consumption is not deterministic');
  check(scrimPlans(first)[0].status==='completed'&&scrimPlans(first)[0].playedGames===2,'actual remote games missing');
  check([a.id,b.id].every(id=>first.teams[id].practiceDay.scrim===20&&first.teams[id].scrimLog.at(-1).startsAt===basis.startsAt&&first.teams[id].scrimLog.at(-1).games===2),'both teams did not consume the same actual session');
  check(first.teams[a.id].practiceEvidence.at(-1).games.length===2&&!first.teams[b.id].practiceEvidence,'own participant evidence or private opponent boundary changed');
  check(first.metaGames===meta&&JSON.stringify(first.world.seasons)===official,'private remote practice fabricates official results');
  const consumed=packDB(first);runScheduledScrims(first);check(packDB(first)===consumed,'repeated consumption duplicates growth or history');
  check(JSON.stringify(scrimPlans(unpackDB(consumed)))===JSON.stringify(scrimPlans(first)),'completed receipt lost on save');
  const cancelled=unpackDB(saved);check(commitWorldAction(cancelled,{type:'scrim.cancel',actor:'manager',id:scrimPlans(cancelled)[0].id}).ok,'manual cancellation refused');
  cancelled.worldDate=command.date;runScheduledScrims(cancelled);check(scrimPlans(cancelled)[0].status==='cancelled'&&!cancelled.teams[a.id].scrimLog?.length,'cancelled session consumed');
  const stale=unpackDB(saved);stale.worldDate=command.date;stale.teams[b.id].practiceTimeZone='America/Los_Angeles';
  const resources=JSON.stringify([stale.players,stale.teams,stale.history]);runScheduledScrims(stale);
  check(scrimPlans(stale)[0].status==='blocked'&&JSON.stringify([stale.players,stale.teams,stale.history])===resources,'changed agreed hours consume resources');
  const collision=unpackDB(saved);collision.worldDate=command.date;
  collision.world.seasons._remoteOfficial={days:[{date:command.date,matches:[{a:b.id,b:far.id,res:null}]}]};
  runScheduledScrims(collision);check(scrimPlans(collision)[0].status==='blocked'&&!collision.teams[a.id].scrimLog?.length,'official match lost priority');
  const denied=unpackDB(saved),beforeDenied=JSON.stringify(denied);
  check(!commitWorldAction(denied,{...command,actor:'ai'}).ok&&JSON.stringify(denied)===beforeDenied,'AI bypasses managed consent');
  const failed=unpackDB(saved);failed.worldDate=command.date;const all=JSON.stringify(failed),world=failed.world,team=failed.teams[a.id],writer=recordScrimPractice;
  recordScrimPractice=(...args)=>{writer(...args);throw Error('controlled remote consumption failure')};
  let rejected=false;try{runScheduledScrims(failed)}catch{rejected=true}finally{recordScrimPractice=writer}
  check(rejected&&JSON.stringify(failed)===all&&failed.world===world&&failed.teams[a.id]===team,'late remote failure loses whole state or references');
  const aiBase=unpackDB(packDB(db));
  // Foreign clubs choose their own medical plan: the manager cannot rest them.
  // Use an actually unavailable recovery fixture, not an unauthorized override.
  for(const team of activeTeams(aiBase,null,1))if(![a.id,b.id].includes(team.id))for(const id of team.roster)aiBase.players[id].condition=60;
  check(activeTeams(aiBase,null,1).filter(t=>scrimReadiness(aiBase,t).ok).map(t=>t.id).sort().join('|')===[a.id,b.id].sort().join('|'),'AI fixture must have exactly two eligible clubs');
  let aiResult=null;
  for(let i=0;i<40&&!aiResult;i++){
    const x=unpackDB(packDB(aiBase)),out=aiRunScrims(x,new RNG('remote-ai-'+i,'daily'));
    if(out.blocks){check([a.id,b.id].every(id=>x.teams[id].scrimLog?.some(log=>log.opponent===(id===a.id?b.id:a.id))),'AI selects unavailable local team');aiResult=out;}
  }
  check(aiResult?.sets>=1,'AI hard regional filter still excludes the available remote partner');
  return {actualUtcOverlap:true,noPingPenalty:true,independentConsent:true,scheduledBothResources:20,actualGames:2,saveDeterminism:true,duplicateCancelAndStale:true,officialPriority:true,wholeRollback:true,privateOpponentEvidence:true,actualAiRemoteBlocks:aiResult.blocks};
})()`,{timeout:120000});
assert.equal(result.actualGames,2);
console.log('REMOTE_SCRIM_ACCEPTANCE',JSON.stringify(result));
