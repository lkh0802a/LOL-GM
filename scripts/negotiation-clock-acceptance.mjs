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
 let ready;
 count=0;while(!order.world.pendingOfficial?.queue?.length){check(++count<=30,'bounded manual order');const date=nextCalendarDate(order);const own=Object.values(order.world.seasons).flatMap(s=>s.days.flatMap(d=>d.matches)).some(m=>!m.res&&(m.a===orderTeam.id||m.b===orderTeam.id)&&m.utcAt?.slice(0,10)===date);if(own&&date===nextDate(order)){applyWorldDailyEffects(order,date);ready=JSON.parse(JSON.stringify(order));}playWorldDay(order);}
 check(ready&&JSON.stringify(order.players)===JSON.stringify(ready.players)&&JSON.stringify(order.teams)===JSON.stringify(ready.teams)&&JSON.stringify(order.metaHistory)===JSON.stringify(ready.metaHistory),'future matches write no player club or observation effects before manual preparation');
 const pendingRefs=pendingOfficialRefs(order,order.world.pendingOfficial.queue[0]);
 const ahead=Object.values(order.world.seasons).flatMap(s=>s.days.flatMap(d=>d.matches)).find(m=>!m.res&&m.utcAt>pendingRefs.m.utcAt&&m.utcAt.slice(0,10)===order.worldDate);
 check(ahead&&!ahead.gameTime&&negotiationClockAt(order)<=pendingRefs.m.utcAt,'later game result and time not written before manual preparation');
 const orderDate=order.worldDate,orderTick=order.world.lastDailyTick,orderWorld=order.world,orderCursor=pendingRefs.s.cur;
 const blockedState=JSON.stringify(order);check(playWorldDay(order).pending&&JSON.stringify(order)===blockedState,'manual preparation never auto resolves or repeats effects');
 const orderRestored=unpackDB(packDB(order));
 const invalidReady=JSON.parse(JSON.stringify(ready)),invalidSeason=Object.values(invalidReady.world.seasons).find(s=>s.days[s.cur].matches.some(m=>m.a===orderTeam.id||m.b===orderTeam.id));invalidSeason.days[invalidSeason.cur].matches.at(-1).utcAt='invalid';const invalidState=JSON.stringify(invalidReady);let rejected=false;try{playDay(invalidReady,invalidSeason,{deferTeam:orderTeam.id});}catch{rejected=true}check(rejected&&JSON.stringify(invalidReady)===invalidState,'invalid future start rejected before any match writer');
 const ai=JSON.parse(JSON.stringify(ready)),oldAi=JSON.parse(JSON.stringify(ready));ai.world.manage='ai';oldAi.world.manage='ai';negotiationWorldDayBeforeClock(ai);const currentPlayDay=playDay;playDay=officialPlayDayBeforeClock;negotiationWorldDayBeforeClock(oldAi);playDay=currentPlayDay;check(JSON.stringify(ai)===JSON.stringify(oldAi),'existing AI writer complete state and seed unchanged');
 const legacyReady=JSON.parse(JSON.stringify(ready)),legacySeason=Object.values(legacyReady.world.seasons).find(s=>s.days[s.cur].matches.some(m=>m.a===orderTeam.id||m.b===orderTeam.id));delete legacySeason.days[legacySeason.cur].matches.at(-1).utcAt;const oldLegacy=JSON.parse(JSON.stringify(legacyReady)),oldLegacySeason=oldLegacy.world.seasons[legacySeason.key];playDay(legacyReady,legacySeason,{deferTeam:orderTeam.id});officialPlayDayBeforeClock(oldLegacy,oldLegacySeason,{deferTeam:orderTeam.id});check(JSON.stringify(legacyReady)===JSON.stringify(oldLegacy),'legacy missing time preserves complete original path');
 const unavailable=JSON.parse(JSON.stringify(ready)),unavailableSeason=Object.values(unavailable.world.seasons).find(s=>s.days[s.cur].matches.some(m=>m.a===orderTeam.id||m.b===orderTeam.id)),unavailableMatch=unavailableSeason.days[unavailableSeason.cur].matches.find(m=>m.a===orderTeam.id||m.b===orderTeam.id);unavailable.teams[orderTeam.id].registration.players=[];
 const forfeit=scheduledRegistrationForfeit(unavailable,unavailableSeason,unavailableMatch);check(forfeit,'actual existing registration shortage');playDay(unavailable,unavailableSeason,{deferTeam:orderTeam.id});check(JSON.stringify(unavailableMatch.res)===JSON.stringify(forfeit.rec),'existing administrative forfeit preserved');
 while(order.world.pendingOfficial?.queue?.length)resolvePendingOfficialMatch(order,null);
 while(orderRestored.world.pendingOfficial?.queue?.length)resolvePendingOfficialMatch(orderRestored,null);
 check(!ahead.res&&pendingRefs.s.cur===orderCursor&&order.worldDate===orderDate&&order.world.lastDailyTick===orderTick,'own finish leaves later fixture outstanding on same processed day');
 const resumed=playWorldDay(order),resumedSave=playWorldDay(orderRestored);
 check(ahead.res&&order.world===orderWorld&&order.worldDate===orderDate&&order.world.lastDailyTick===orderTick&&!resumed.advanced,'resume later fixture without second daily consumer');
 const savedAhead=Object.values(orderRestored.world.seasons).flatMap(s=>s.days.flatMap(d=>d.matches)).find(m=>m.id===ahead.id);
 check(JSON.stringify(ahead.res)===JSON.stringify(savedAhead.res)&&negotiationClockAt(order)===negotiationClockAt(orderRestored)&&resumedSave.date===orderDate,'pending save resumes same later result and clock');
 return JSON.stringify({laterGameDoesNotSkipManual:true,futureEffectsDeferred:true,sameDayResume:true,existingForfeit:true,actualStart:refs.m.utcAt,gameTimeThrough:expected,completedClock:restored.world.officialGameTimeThrough,firstDone:first.done,save:true,seedParity:true,invalidSource:true,dateCrossing:true,dailyUnchanged:true});
})()`);
assert.equal(JSON.parse(officialResult).seedParity,true);
console.log('OFFICIAL_GAME_CLOCK_ACCEPTANCE '+officialResult);

const orderedContact=await runEngineFixture(String.raw`(()=>{
 const cfg=defaultWorldConfig();cfg.regions=['KR','CN'].map(id=>regionCfg(id,{teams:10,div2:false}));cfg.internationals=[];
 const db=buildWorld(cfg),team=activeTeams(db,'KR',1).sort((a,b)=>salaryBudget(db,b)-salaryBudget(db,a))[0];startCareer(db,team.id,'clock-contact-order');autoBuildInitialSquad(db,team,new RNG('clock-roster','fixture'),5);finalizeInitialRosters(db);
 let count=0;while(true){const date=nextCalendarDate(db);const own=Object.values(db.world.seasons).flatMap(s=>s.days.flatMap(d=>d.matches)).find(m=>!m.res&&(m.a===team.id||m.b===team.id)&&m.utcAt?.slice(0,10)===date);if(own&&date===nextDate(db)){applyWorldDailyEffects(db,date);break;}if(++count>30)throw Error('bounded official day');playWorldDay(db);}
 let offer;
 for(const p of Object.values(db.players).filter(p=>!p.team&&!p.retired&&p.region===team.region)){
  mInterest(db,p.id);mEvaluateTarget(db,p.id,team.id);const start=startNegotiation(db,p.id,'fa');if(!start.ok)continue;
  const n=start.neg;n.maxRounds=3;n.competitors=[];const terms={...n.demand,salary:n.demand.salary*2},plan=negotiationResponsePlan(db,n,terms);
  if(plan.ok&&plan.hours>=6&&plan.hours<=8){offer={n,terms,plan};break;}cancelNegotiation(db,n.id);
 }
 if(!offer)throw Error('actual accepted time fixture missing');
 const submitted=stageNegotiationOffer(db,offer.n.id,offer.terms);if(!submitted.waiting)throw Error(submitted.msg);
 const first=playWorldDay(db);if(!first.response)throw Error('first actual contact missing');if(!finalizeStagedNegotiation(db,offer.n.id).ok)throw Error('actual manual final missing');
 let next;
 for(const p of Object.values(db.players).filter(p=>p.team===team.id&&!p.retired)){
  const start=startNegotiation(db,p.id,'renewal');if(!start.ok)continue;const n=start.neg;n.maxRounds=3;n.competitors=[];const terms={...n.demand,salary:n.demand.salary*2},plan=negotiationResponsePlan(db,n,terms);
  if(plan.ok&&plan.hours>=3&&plan.hours<=6){next={n,terms,plan};break;}cancelNegotiation(db,n.id);
 }
 if(!next)throw Error('actual affordable renewal interval missing');if(!stageNegotiationOffer(db,next.n.id,next.terms).waiting)throw Error('actual renewal queue missing');
 const queued=unpackDB(packDB(db)),date=db.worldDate,tick=db.world.lastDailyTick;
 const prepared=playWorldDay(db),savedPrepared=playWorldDay(queued);
 const late=Object.values(db.world.seasons).flatMap(s=>s.days.flatMap(d=>d.matches)).find(m=>!m.res&&m.utcAt?.slice(0,10)===db.worldDate&&m.utcAt>=next.plan.dueAt);if(!late)throw Error('later real fixture missing');
 while(db.world.pendingOfficial?.queue?.length)resolvePendingOfficialMatch(db,null);
 while(queued.world.pendingOfficial?.queue?.length)resolvePendingOfficialMatch(queued,null);
 let result=prepared,savedResult=savedPrepared;for(let i=0;!result?.response&&i<4;i++){result=playWorldDay(db);if(result?.response)break;if(result?.pending)throw Error('unexpected manual fixture before response');}
 for(let i=0;!savedResult?.response&&i<4;i++){savedResult=playWorldDay(queued);if(savedResult?.response)break;if(savedResult?.pending)throw Error('unexpected restored fixture');}
 if(!result?.response||!savedResult?.response||late.res||db.worldDate!==date||db.world.lastDailyTick!==tick)throw Error('late fixture or daily effects consumed before actual contact');
 if(negotiationClockAt(db)!==negotiationClockAt(queued)||JSON.stringify(db.world.negotiations[next.n.id])!==JSON.stringify(queued.world.negotiations[next.n.id]))throw Error('actual saved contact differs');
 return JSON.stringify({firstHours:offer.plan.hours,secondHours:next.plan.hours,firstResultPending:!!prepared.pending,due:next.plan.dueAt,received:negotiationClockAt(db),lateStart:late.utcAt,lateResolved:!!late.res,response:true,restoredClock:negotiationClockAt(queued),date,tick,stage:db.world.negotiations[next.n.id].stage});
})()`);
assert.equal(JSON.parse(orderedContact).response,true);
console.log('OFFICIAL_RESULT_CONTACT_ACCEPTANCE '+orderedContact);

const endedContact=await runEngineFixture(String.raw`(()=>{
 const cfg=defaultWorldConfig();cfg.regions=['KR','CN'].map(id=>regionCfg(id,{teams:10,div2:false}));cfg.internationals=[];
 const db=buildWorld(cfg),team=activeTeams(db,'KR',1).sort((a,b)=>salaryBudget(db,b)-salaryBudget(db,a))[0];startCareer(db,team.id,'clock-contact-order');autoBuildInitialSquad(db,team,new RNG('clock-roster','fixture'),5);finalizeInitialRosters(db);
 let count=0;while(true){const date=nextCalendarDate(db),own=Object.values(db.world.seasons).flatMap(s=>s.days.flatMap(d=>d.matches)).find(m=>!m.res&&(m.a===team.id||m.b===team.id)&&m.utcAt?.slice(0,10)===date);if(own&&date===nextDate(db)){applyWorldDailyEffects(db,date);break;}if(++count>30)throw Error('bounded existing fixture');playWorldDay(db);}
 let offer;for(const p of Object.values(db.players).filter(p=>p.team===team.id&&!p.retired)){const start=startNegotiation(db,p.id,'renewal');if(!start.ok)continue;const n=start.neg;n.maxRounds=3;n.competitors=[];const terms={...n.demand,salary:n.demand.salary*2},plan=negotiationResponsePlan(db,n,terms);if(plan.ok&&plan.hours>=2&&plan.hours<=8){offer={n,terms,plan};break;}cancelNegotiation(db,n.id);}if(!offer)throw Error('actual accepted renewal missing');
 const live=JSON.stringify(db),preview=JSON.parse(live),s=Object.values(preview.world.seasons).find(s=>s.days[s.cur].matches.some(m=>m.a!==team.id&&m.b!==team.id)),day=s.days[s.cur],m=day.matches.find(m=>m.a!==team.id&&m.b!==team.id),cfgStage=preview.competitions[s.comp].stages.find(x=>x.id===day.stage),series=simulateScheduledSeries(preview,s,day,m,cfgStage);
 if(JSON.stringify(db)!==live||series.rec.games.length<2)throw Error('read-only actual series fixture');
 const firstEnd=new Date(Date.parse(m.utcAt)+Math.round(series.rec.games[0].duration*60000)).toISOString(),seriesEnd=officialGameTimeRecord(m,series.rec.games).gameTimeThrough,loadedAt=new Date(Date.parse(firstEnd)-offer.plan.hours*3600000).toISOString();
 if(loadedAt.slice(0,10)!==db.worldDate||loadedAt<negotiationClockAt(db))throw Error('derived valid saved time would rewind');
 // 격리된 유효 저장 시각을 기존 첫 게임 종료와 승인 간격으로 계산한다. 진행/가격 정책이 아니다.
 db.world.negotiationClock={at:loadedAt};const restored=unpackDB(packDB(db)),submission=stageNegotiationOffer(restored,offer.n.id,offer.terms);if(submission.dueAt!==firstEnd)throw Error('actual due time differs');
 const mid=unpackDB(packDB(db));mid.world.negotiationClock={at:new Date(Date.parse(loadedAt)-1000).toISOString()};
 const midOffer=stageNegotiationOffer(mid,offer.n.id,offer.terms),midBefore=JSON.stringify([mid.players,mid.teams,mid.metaHistory]);
 const midContact=playWorldDay(mid),midSeason=Object.values(mid.world.seasons).find(x=>x.days[x.cur]?.matches.some(y=>y.id===m.id)),midMatch=midSeason.days[midSeason.cur].matches.find(y=>y.id===m.id);
 if(!midContact.response||negotiationClockAt(mid)!==midOffer.dueAt||midMatch.res||midMatch.clockSession||!midMatch.clockGame||JSON.stringify([mid.players,mid.teams,mid.metaHistory])!==midBefore)throw Error('unfinished game has early effects before contact');
 const midSaved=unpackDB(packDB(mid)),midSavedSeason=Object.values(midSaved.world.seasons).find(x=>x.id===midSeason.id),midSavedMatch=midSavedSeason.days[midSavedSeason.cur].matches.find(x=>x.id===m.id);
 const invalid=JSON.parse(JSON.stringify(mid)),invalidSeason=Object.values(invalid.world.seasons).find(x=>x.id===midSeason.id),invalidMatch=invalidSeason.days[invalidSeason.cur].matches.find(x=>x.id===m.id);invalidMatch.clockGame.endAt='invalid';const invalidBefore=JSON.stringify(invalid);let invalidRejected=false;try{playOfficialGamesThrough(invalid,invalidSeason,invalidMatch,firstEnd);}catch{invalidRejected=true;}if(!invalidRejected||JSON.stringify(invalid)!==invalidBefore)throw Error('invalid saved event mutates current world');
 const final=finalizeStagedNegotiation(mid,offer.n.id);if(!final.ok)throw Error('actual manual decision at contact missing');const manualContract=JSON.stringify(mid.players[offer.n.pid].contract);
 playOfficialGamesThrough(mid,midSeason,midMatch,firstEnd);playOfficialGamesThrough(midSaved,midSavedSeason,midSavedMatch,firstEnd);
 if(midMatch.clockSession.games.length!==1||JSON.stringify(midMatch.clockSession)!==JSON.stringify(midSavedMatch.clockSession)||JSON.stringify(mid.players[offer.n.pid].contract)!==manualContract)throw Error('frozen game restore overwrites later manual decision');
 const contact=playWorldDay(restored),actual=negotiationClockAt(restored),written=Object.values(restored.world.seasons).flatMap(s=>s.days.flatMap(d=>d.matches)).find(x=>x.id===m.id);
 if(written?.res||written.clockSession?.games.length!==1||written.clockSession.games[0].duration!==series.rec.games[0].duration||written.gameTime.gameTimeThrough!==firstEnd||!contact.response||actual!==firstEnd)throw Error('single game and actual contact boundary differs');
 const resumed=unpackDB(packDB(restored)),savedGame=JSON.stringify(written.clockSession),savedMeta=JSON.stringify(restored.metaHistory),tick=restored.world.lastDailyTick;
 if(!savedGame||resumed.world.negotiations[offer.n.id].stage!=='agreement')throw Error('actual partial and agreement save missing');
 const rs=Object.values(restored.world.seasons).find(x=>x.days[x.cur]?.matches.some(y=>y.id===m.id)),ss=Object.values(resumed.world.seasons).find(x=>x.days[x.cur]?.matches.some(y=>y.id===m.id)),sm=ss.days[ss.cur].matches.find(y=>y.id===m.id);
 const denied=JSON.parse(JSON.stringify(restored)),ds=denied.world.seasons[rs.id]||Object.values(denied.world.seasons).find(x=>x.id===rs.id),dm=ds.days[ds.cur].matches.find(x=>x.id===m.id);setManagedTeam(denied,m.a);const deniedBefore=JSON.stringify(denied);let rejected=false;try{playOfficialGamesThrough(denied,ds,dm,seriesEnd);}catch{rejected=true;}if(!rejected||JSON.stringify(denied)!==deniedBefore)throw Error('new manual authority applies old automatic input');
 playOfficialGamesThrough(restored,rs,written,seriesEnd);playOfficialGamesThrough(resumed,ss,sm,seriesEnd);
 if(!written.res||JSON.stringify(written.res)!==JSON.stringify(series.rec)||JSON.stringify(sm.res)!==JSON.stringify(written.res)||written.clockGame||written.clockSession)throw Error('original series and saved resume differ');
 if(restored.world.lastDailyTick!==tick||stringifyMetaHistory(restored.metaHistory)!==stringifyMetaHistory(resumed.metaHistory)||JSON.stringify(restored.players)!==JSON.stringify(resumed.players))throw Error('restore consumer differs');
 const duplicate=JSON.stringify(restored);playOfficialGamesThrough(restored,rs,written,seriesEnd);if(JSON.stringify(restored)!==duplicate)throw Error('duplicate result consumer');
 return JSON.stringify({unfinishedGameNoEffects:true,frozenGameSave:true,manualDecisionPreserved:true,invalidEventRejected:true,saveAndResume:true,currentAuthority:true,originalSeriesEqual:true,duplicateInert:true,actualDurationVerified:true,basis:'isolated valid save derived from actual first-game duration and approved response interval',hours:offer.plan.hours,loadedAt,due:submission.dueAt,seriesEnd,received:actual,response:!!contact.response,publishedGames:JSON.parse(savedGame).games.length,late:actual>submission.dueAt});
})()`);
assert.equal(JSON.parse(endedContact).late,false);
console.log('OFFICIAL_ENDED_CONTACT_ACCEPTANCE '+endedContact);
