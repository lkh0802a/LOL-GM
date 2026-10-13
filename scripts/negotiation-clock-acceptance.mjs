import assert from 'node:assert/strict';
import {runEngineFixture} from './test-harness.mjs';
const result=await runEngineFixture(String.raw`(()=>{
 const check=(v,m)=>{if(!v)throw Error('NEGOTIATION_CLOCK '+m)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('KR',{teams:3,div2:true})];cfg.internationals=[];
 const base=buildWorld(cfg),team=activeTeams(base,'KR',1)[0];startCareer(base,team.id,'response-clock');
 const p=Object.values(base.players).find(p=>!p.team&&!p.retired&&p.region===team.region&&initialSignCheck(base,p,team).ok);
 mInterest(base,p.id,'B');mEvaluateTarget(base,p.id,team.id);initialStartNegotiation(base,p.id,team.id);
 const id=negotiationId(base,p.id,'initial',team.id),n=base.world.negotiations[id];n.maxRounds=3;n.competitors=[];
 const terms={...n.demand,salary:Math.floor((initialSalaryBudget(base,team)-payroll(base,team))*10)/10};
 const before=JSON.stringify(base),plan=negotiationResponsePlan(base,n,terms);
  const invalidStart=JSON.parse(before);delete invalidStart.world.negotiations;const invalidStartState=JSON.stringify(invalidStart);check(!startNegotiation(invalidStart,'missing','fa').ok&&JSON.stringify(invalidStart)===invalidStartState,'invalid start does not create negotiation storage');
 check(plan.ok&&!plan.immediate&&plan.hours>=2&&plan.hours<=8,'approved normal hours');check(JSON.stringify(base)===before,'planning read only');
 const db=JSON.parse(before),submitted=stageNegotiationOffer(db,id,terms);check(submitted.ok&&submitted.waiting,'actual queued submission');
 check(!db.players[p.id].team&&db.world.negotiations[id].round===0,'no early signing or judgement');
 const queued=JSON.stringify(db);check(!stageNegotiationOffer(db,id,terms).ok&&JSON.stringify(db)===queued,'duplicate submission inert');
 const restored=unpackDB(packDB(db));check(restored.world.negotiations[id].response.dueAt===plan.dueAt,'pending actual save');
 const world=db.world,manager=db.manager,club=db.teams[team.id];
 const a=advanceToNegotiationResponse(db),b=advanceToNegotiationResponse(restored);check(a.response&&b.response,'actual contact stop');
 check(db.world===world&&db.manager===manager&&db.teams[team.id]===club,'progress keeps active screen identity');
 check(db.world.negotiations[id].stage==='agreement'&&!db.players[p.id].team,'agreement before manual final');
 check(db.world.negotiationClock.at===plan.dueAt&&db.world.negotiations[id].history.some(h=>h.at===plan.dueAt&&h.result==='agreed'),'response time and history');
 check(restored.world.negotiationClock.at===db.world.negotiationClock.at&&JSON.stringify(restored.world.negotiations[id])===JSON.stringify(db.world.negotiations[id]),'restore response identical');
 const responded=JSON.stringify(db);check(!advanceToNegotiationResponse(db).ok&&JSON.stringify(db)===responded,'contact not repeated');
 check(finalizeStagedNegotiation(db,id).ok&&db.players[p.id].team===team.id,'manual final remains actual writer');
 const instant=JSON.parse(before);instant.world.negotiations[id].maxRounds=2;check(stageNegotiationOffer(instant,id,terms).agreed,'shortest accepted round immediate');
 const slow=JSON.parse(before);const low={...terms,salary:.1};const slowPlan=negotiationResponsePlan(slow,slow.world.negotiations[id],low);check(slowPlan.ok&&slowPlan.hours>=24&&slowPlan.hours<=72,'hesitation approved days');
 const cancelled=JSON.parse(queued);cancelNegotiation(cancelled,id);const cancelledState=JSON.stringify(cancelled);check(!advanceToNegotiationResponse(cancelled).ok&&JSON.stringify(cancelled)===cancelledState,'cancel prevents response');
  check(cancelled.world.negotiations[id].history.some(h=>h.result==='cancelled'&&h.at),'actual cancellation history');const reopen=startNegotiation(cancelled,p.id,'initial',{teamId:team.id});check(reopen.ok&&cancelled.world.negotiations[id].previousAttempts.at(-1).history.some(h=>h.result==='submitted'),'reopened full previous submission history');
  const days=JSON.parse(before);check(stageNegotiationOffer(days,id,low).waiting,'slow offer queued');const dayStart=days.worldDate;
  const firstDay=advanceNegotiationTime(days);check(firstDay.ok&&!firstDay.response&&days.worldDate===addDays(dayStart,1)&&days.world.lastDailyTick===days.worldDate,'actual daily consumer');
  const dayState=JSON.stringify(days);check(applyWorldDailyEffects(days,days.worldDate)===false&&JSON.stringify(days)===dayState,'daily consumer once');
  const lastDay=advanceToNegotiationResponse(days);check(lastDay.response&&days.world.negotiationClock.at===slowPlan.dueAt,'slow contact actual clock');
 const changed=JSON.parse(queued);changed.world.fired=true;const changedState=JSON.stringify(changed);check(!advanceToNegotiationResponse(changed).ok&&JSON.stringify(changed)===changedState,'authority rollback');
  const other=JSON.parse(queued),otherTeam=activeTeams(other,'KR',1).find(t=>t.id!==team.id);setManagedTeam(other,otherTeam.id);const otherState=JSON.stringify(other);check(waitingNegotiationResponses(other,true).length===0&&!advanceToNegotiationResponse(other).ok&&JSON.stringify(other)===otherState,'previous club response is not current manager input');
  for(const fault of ['time','round']){const invalid=JSON.parse(queued);if(fault==='time')invalid.world.negotiations[id].response.dueAt='invalid';else invalid.world.negotiations[id].round++;const state=JSON.stringify(invalid);check(!advanceToNegotiationResponse(invalid).ok&&JSON.stringify(invalid)===state,'invalid saved '+fault+' does not apply old intent');}
 const expired=JSON.parse(before),deadline=negotiationContactDeadline(expired,expired.world.negotiations[id]);setWorldCalendarDate(expired,deadline.slice(0,10));expired.world.negotiationClock={at:deadline};const expiredState=JSON.stringify(expired);check(!stageNegotiationOffer(expired,id,terms).ok&&JSON.stringify(expired)===expiredState,'opening deadline no submit');
 const stale=JSON.parse(queued);setWorldCalendarDate(stale,addDays(stale.worldDate,1));check(advanceToNegotiationResponse(stale).response&&stale.world.negotiationClock.at>=plan.dueAt,'overdue no rewind');
  const season=JSON.parse(before);startWorldSeason(season,team.id,'response-season');mInterest(season,p.id);mEvaluateTarget(season,p.id,team.id);const started=startNegotiation(season,p.id,'fa');check(started.ok,'actual season negotiation');started.neg.maxRounds=3;started.neg.competitors=[];const seasonOffer={...started.neg.demand,salary:started.neg.demand.salary*2};
  check(stageNegotiationOffer(season,started.neg.id,seasonOffer).waiting,'actual season queue');const seasonDate=season.worldDate,seasonWorld=season.world;const seasonContact=playWorldDay(season);check(seasonContact.response&&seasonContact.pending&&season.world===seasonWorld&&season.worldDate===seasonDate,'season continue stops at same-day contact before fixture');
 return JSON.stringify({normalHours:plan.hours,slowHours:slowPlan.hours,immediate:true,save:true,contactStop:true,manualFinal:true,cancel:true,authority:true,deadline:true,overdue:true});
})()`);
assert.equal(JSON.parse(result).contactStop,true);
console.log('NEGOTIATION_CLOCK_ACCEPTANCE '+result);

const officialResult=await runEngineFixture(String.raw`(()=>{
 const check=(v,m)=>{if(!v)throw Error('OFFICIAL_GAME_CLOCK '+m)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('KR',{teams:3,div2:false,regularBo:1,playoffBo:1})];cfg.internationals=[];
 const db=buildWorld(cfg),team=activeTeams(db,'KR',1)[0];startCareer(db,team.id,'clock-official-reproduction');
 autoBuildInitialSquad(db,team,new RNG('clock-roster','fixture'),5);finalizeInitialRosters(db);
 let count=0;while(!db.world.pendingOfficial?.queue?.length){check(++count<=30,'bounded actual fixture');playWorldDay(db);}
 const before=JSON.parse(JSON.stringify(db)),q=db.world.pendingOfficial.queue[0],refs=pendingOfficialRefs(db,q);
 for(const fault of ['start','floor']){const bad=JSON.parse(JSON.stringify(db)),r=pendingOfficialRefs(bad,bad.world.pendingOfficial.queue[0]);if(fault==='start')r.m.utcAt='invalid';else bad.world.officialGameTimeThrough='invalid';const old=JSON.stringify(bad);let rejected=false;try{resolvePendingOfficialMatch(bad,null);}catch{rejected=true}check(rejected&&JSON.stringify(bad)===old,'invalid pending '+fault+' rejected before game and session writes');}
 const oldDate=db.worldDate,oldTick=db.world.lastDailyTick,world=db.world;
 const first=resolvePendingOfficialMatch(db,null);
 check(db.world===world&&db.worldDate===oldDate&&db.world.lastDailyTick===oldTick,'game consumes no duplicate daily effects or world replacement');
 const expected=new Date(Date.parse(refs.m.utcAt)+Math.round((q.session.games||[]).reduce((n,g)=>n+g.duration,0)*60000)).toISOString();
 check(negotiationClockAt(db)>=expected&&refs.m.gameTime.gameTimeThrough===expected,'actual game time consumed');
 const restored=unpackDB(packDB(db));check(negotiationClockAt(restored)===negotiationClockAt(db),'actual pending save retains consumed time');
 while(db.world.pendingOfficial?.queue?.length)resolvePendingOfficialMatch(db,null);
 while(restored.world.pendingOfficial?.queue?.length)resolvePendingOfficialMatch(restored,null);
 check(negotiationClockAt(db)===negotiationClockAt(restored),'restored remaining games same time');
 check(JSON.stringify(refs.m.res)===JSON.stringify(Object.values(restored.world.seasons).flatMap(s=>s.days.flatMap(d=>d.matches)).find(m=>m.id===refs.m.id).res),'restored actual results identical');
 // 기존 작성자와 비교할 때 새 시간 기록만 제외하고 전체 상태를 비교한다.
 const wrappedCommit=commitScheduledSeries,wrappedResolve=resolvePendingOfficialMatch;
 commitScheduledSeries=officialCommitBeforeClock;resolvePendingOfficialMatch=officialResolveBeforeClock;
 while(before.world.pendingOfficial?.queue?.length)resolvePendingOfficialMatch(before,null);
 commitScheduledSeries=wrappedCommit;resolvePendingOfficialMatch=wrappedResolve;
 const withoutTime=x=>{x=JSON.parse(JSON.stringify(x));delete x.world.officialGameTimeThrough;for(const s of Object.values(x.world.seasons))for(const d of s.days)for(const m of d.matches)delete m.gameTime;return x};
 check(JSON.stringify(withoutTime(db))===JSON.stringify(withoutTime(before)),'same seed complete state unchanged except consumed time');
 const state=JSON.stringify(db);check(negotiationClockAt(db)>=refs.m.gameTime.gameTimeThrough&&JSON.stringify(db)===state,'read does not rewrite saved history');
 const crossing={utcAt:db.worldDate+'T23:50:00.000Z'},timing=officialGameTimeRecord(crossing,[{duration:30}]);
 check(timing.gameTimeThrough===addDays(db.worldDate,1)+'T00:20:00.000Z','UTC date crossing uses actual minutes');
 recordOfficialGameTime(db,crossing,timing);check(negotiationClockAt(db)===timing.gameTimeThrough,'date crossing never reads earlier midnight');
 check(negotiationClockAt(unpackDB(packDB(db)))===timing.gameTimeThrough,'crossing survives real save');
 for(const fault of [{utcAt:'invalid'}, {utcAt:'2027-01-19T08:00:00.000Z'}]){
  const old=JSON.stringify(db);let rejected=false;try{commitScheduledSeries(db,refs.s,fault,{rec:{games:[{duration:NaN}]},lines:[]});}catch{rejected=true}
  check(rejected&&JSON.stringify(db)===old,'invalid source rejected before actual writers');
 }
 check(officialGameTimeRecord({},[{duration:30}])===null&&officialGameTimeRecord({utcAt:'2027-01-19T08:00:00.000Z'},[{dur:'30:00'}])===null&&officialGameTimeRecord({utcAt:'2027-01-19T08:00:00.000Z'},[])===null,'legacy missing units and forfeits do not invent game time');
 const legacy={worldDate:'2027-01-19',world:{}};check(negotiationClockAt(legacy)==='2027-01-19T00:00:00.000Z'&&JSON.stringify(legacy)==='{"worldDate":"2027-01-19","world":{}}','legacy read unchanged');
 const orderCfg=defaultWorldConfig();orderCfg.regions=[regionCfg('KR',{teams:10,div2:false,regularBo:1,playoffBo:1})];orderCfg.internationals=[];
 const order=buildWorld(orderCfg),orderTeam=activeTeams(order,'KR',1)[0];startCareer(order,orderTeam.id,'clock-official-reproduction');autoBuildInitialSquad(order,orderTeam,new RNG('clock-roster','fixture'),5);finalizeInitialRosters(order);
 count=0;while(!order.world.pendingOfficial?.queue?.length){check(++count<=30,'bounded manual order');playWorldDay(order);}
 const pendingRefs=pendingOfficialRefs(order,order.world.pendingOfficial.queue[0]);
 const ahead=Object.values(order.world.seasons).flatMap(s=>s.days.flatMap(d=>d.matches)).find(m=>m.res&&m.utcAt>pendingRefs.m.utcAt&&m.utcAt.slice(0,10)===order.worldDate);
 check(ahead&&ahead.gameTime&&negotiationClockAt(order)<=pendingRefs.m.utcAt,'later precomputed game cannot consume time before manual preparation');
 return JSON.stringify({laterGameDoesNotSkipManual:true,actualStart:refs.m.utcAt,gameTimeThrough:expected,completedClock:restored.world.officialGameTimeThrough,firstDone:first.done,save:true,seedParity:true,invalidSource:true,dateCrossing:true,dailyUnchanged:true});
})()`);
assert.equal(JSON.parse(officialResult).seedParity,true);
console.log('OFFICIAL_GAME_CLOCK_ACCEPTANCE '+officialResult);
