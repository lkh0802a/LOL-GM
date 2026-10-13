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
 for(const fault of ['observation','lateConsumer']){const broken=unpackDB(packDB(mid)),bs=Object.values(broken.world.seasons).find(x=>x.id===midSeason.id),bm=bs.days[bs.cur].matches.find(x=>x.id===m.id);if(fault==='observation')bm.clockGame.observation.sides[0].ps=null;const before=JSON.stringify(broken),world=broken.world,club=managedTeam(broken),oldMeta=recordMeta;let rejected=false;if(fault==='lateConsumer')recordMeta=function(current,r){oldMeta(current,r);throw Error('controlled late observation consumer');};try{playOfficialGamesThrough(broken,bs,bm,firstEnd);}catch{rejected=true;}finally{recordMeta=oldMeta;}if(!rejected||JSON.stringify(broken)!==before||broken.world!==world||managedTeam(broken)!==club)throw Error('saved event '+fault+' rollback or identity differs');}
 const final=finalizeStagedNegotiation(mid,offer.n.id);if(!final.ok)throw Error('actual manual decision at contact missing');const manualContract=JSON.stringify(mid.players[offer.n.pid].contract);
 playOfficialGamesThrough(mid,midSeason,midMatch,firstEnd);playOfficialGamesThrough(midSaved,midSavedSeason,midSavedMatch,firstEnd);
 if(midMatch.clockSession.games.length!==1||JSON.stringify(midMatch.clockSession)!==JSON.stringify(midSavedMatch.clockSession)||JSON.stringify(mid.players[offer.n.pid].contract)!==manualContract)throw Error('frozen game restore overwrites later manual decision');
 const contact=playWorldDay(restored),actual=negotiationClockAt(restored),written=Object.values(restored.world.seasons).flatMap(s=>s.days.flatMap(d=>d.matches)).find(x=>x.id===m.id);
 if(written?.res||written.clockSession?.games.length!==1||written.clockSession.games[0].duration!==series.rec.games[0].duration||written.gameTime.gameTimeThrough!==firstEnd||!contact.response||actual!==firstEnd)throw Error('single game and actual contact boundary differs');
 const resumed=unpackDB(packDB(restored)),savedGame=JSON.stringify(written.clockSession),savedMeta=JSON.stringify(restored.metaHistory),tick=restored.world.lastDailyTick;
 if(!savedGame||resumed.world.negotiations[offer.n.id].stage!=='agreement')throw Error('actual partial and agreement save missing');
 const rs=Object.values(restored.world.seasons).find(x=>x.days[x.cur]?.matches.some(y=>y.id===m.id)),ss=Object.values(resumed.world.seasons).find(x=>x.days[x.cur]?.matches.some(y=>y.id===m.id)),sm=ss.days[ss.cur].matches.find(y=>y.id===m.id);
 const lateFailure=unpackDB(packDB(restored)),lateSeason=Object.values(lateFailure.world.seasons).find(x=>x.id===rs.id),lateMatch=lateSeason.days[lateSeason.cur].matches.find(x=>x.id===m.id),lateBefore=JSON.stringify(lateFailure),lateWorld=lateFailure.world,oldService=recordStaffMatchService;let lateRejected=false;recordStaffMatchService=function(...args){const result=oldService(...args);if(args[0]===lateFailure)throw Error('controlled completed-series service failure');return result;};try{playOfficialGamesThrough(lateFailure,lateSeason,lateMatch,seriesEnd);}catch{lateRejected=true;}finally{recordStaffMatchService=oldService;}if(!lateRejected||JSON.stringify(lateFailure)!==lateBefore||lateFailure.world!==lateWorld||lateMatch.clockSession.games.length!==1||lateMatch.res)throw Error('late completed series failure loses prior game or state');
 const denied=JSON.parse(JSON.stringify(restored)),ds=denied.world.seasons[rs.id]||Object.values(denied.world.seasons).find(x=>x.id===rs.id),dm=ds.days[ds.cur].matches.find(x=>x.id===m.id);setManagedTeam(denied,m.a);const deniedBefore=JSON.stringify(denied);let rejected=false;try{playOfficialGamesThrough(denied,ds,dm,seriesEnd);}catch{rejected=true;}if(!rejected||JSON.stringify(denied)!==deniedBefore)throw Error('new manual authority applies old automatic input');
 playOfficialGamesThrough(restored,rs,written,seriesEnd);playOfficialGamesThrough(resumed,ss,sm,seriesEnd);
 if(!written.res||JSON.stringify(written.res)!==JSON.stringify(series.rec)||JSON.stringify(sm.res)!==JSON.stringify(written.res)||written.clockGame||written.clockSession)throw Error('original series and saved resume differ');
 if(restored.world.lastDailyTick!==tick||stringifyMetaHistory(restored.metaHistory)!==stringifyMetaHistory(resumed.metaHistory)||JSON.stringify(restored.players)!==JSON.stringify(resumed.players))throw Error('restore consumer differs');
 const duplicate=JSON.stringify(restored);playOfficialGamesThrough(restored,rs,written,seriesEnd);if(JSON.stringify(restored)!==duplicate)throw Error('duplicate result consumer');
 return JSON.stringify({unfinishedGameNoEffects:true,frozenGameSave:true,manualDecisionPreserved:true,invalidEventRejected:true,failedConsumerRollback:true,priorGamePreserved:true,saveAndResume:true,currentAuthority:true,originalSeriesEqual:true,duplicateInert:true,actualDurationVerified:true,basis:'isolated valid save derived from actual first-game duration and approved response interval',hours:offer.plan.hours,loadedAt,due:submission.dueAt,seriesEnd,received:actual,response:!!contact.response,publishedGames:JSON.parse(savedGame).games.length,late:actual>submission.dueAt});
})()`);
assert.equal(JSON.parse(endedContact).late,false);
console.log('OFFICIAL_ENDED_CONTACT_ACCEPTANCE '+endedContact);

// 실제 생성 편성의 객체 순서만 바꾼 반례. 경기 시각·가격·시드는 변경하지 않는다.
const globalEvents=await runEngineFixture(String.raw`(()=>{
 const check=(v,m)=>{if(!v)throw Error('OFFICIAL_GLOBAL_EVENTS '+m)};
 const cfg=defaultWorldConfig();cfg.regions=['KR','CN'].map(id=>regionCfg(id,{teams:10,div2:false}));cfg.internationals=[];
 const base=buildWorld(cfg),team=activeTeams(base,'KR',1).sort((a,b)=>salaryBudget(base,b)-salaryBudget(base,a))[0];startCareer(base,team.id,'clock-contact-order');autoBuildInitialSquad(base,team,new RNG('clock-roster','fixture'),5);finalizeInitialRosters(base);
 let count=0;while(true){const date=nextCalendarDate(base),own=Object.values(base.world.seasons).flatMap(s=>s.days.flatMap(d=>d.matches)).find(m=>!m.res&&(m.a===team.id||m.b===team.id)&&m.utcAt?.slice(0,10)===date);if(own&&date===nextDate(base)){applyWorldDailyEffects(base,date);break;}check(++count<=30,'bounded generated fixture');playWorldDay(base);}
 const canonical=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
 const run=(reverse,save)=>{
  let db=JSON.parse(JSON.stringify(base));if(reverse)db.world.seasons=Object.fromEntries(Object.entries(db.world.seasons).reverse());if(save)db=unpackDB(packDB(db));
  const trace=[],starts=[],meta=recordMeta,prepare=prepareOfficialClockGame,world=db.world,club=managedTeam(db);
  recordMeta=function(current,r){if(current===db){const m=Object.values(db.world.seasons).flatMap(s=>s.days.flatMap(d=>d.matches)).find(m=>m.clockGame?.observation===r);if(m)trace.push({id:m.id,end:m.clockGame.endAt,game:m.clockGame.session.games.length});}return meta(current,r);};
  prepareOfficialClockGame=function(current,s,m){if(current===db&&!m.clockGame)starts.push({id:m.id,at:m.gameTime?.gameTimeThrough||m.utcAt,completed:trace.length});return prepare(current,s,m);};
  try{const result=playWorldDay(db);check(result.pending&&db.world===world&&managedTeam(db)===club,'manual preparation and active identities');}finally{recordMeta=meta;prepareOfficialClockGame=prepare;}
  check(trace.length>=4&&trace.every((x,i)=>!i||x.end>=trace[i-1].end),'world actual end order');
  check(starts.some(x=>x.at>trace[0].end&&x.at<trace[1].end&&x.completed===1),'overlapping start reads first completed game only');
  return {db,trace,starts};
 };
 const normal=run(false,true),reversed=run(true,true);
 check(canonical(normal.db)===canonical(reversed.db)&&canonical(normal.trace)===canonical(reversed.trace)&&canonical(normal.starts)===canonical(reversed.starts),'restored property order independent full state and seed');
 const live=run(false,false);check(canonical(unpackDB(packDB(live.db)))===canonical(normal.db),'live and restored world equivalent');
 const frozen=unpackDB(packDB(base));
 const n=Object.values(frozen.players).find(p=>p.team===team.id&&!p.retired);const start=startNegotiation(frozen,n.id,'renewal');check(start.ok,'real renewal');start.neg.maxRounds=3;start.neg.competitors=[];
 const terms={...start.neg.demand,salary:start.neg.demand.salary*2},plan=negotiationResponsePlan(frozen,start.neg,terms);check(plan.ok&&plan.hours>=2&&plan.hours<=8,'approved response interval');
 const first=normal.trace[0].end,at=new Date(Date.parse(first)-plan.hours*3600000).toISOString();check(at.slice(0,10)===frozen.worldDate&&at>=negotiationClockAt(frozen),'derived valid saved clock');frozen.world.negotiationClock={at};check(stageNegotiationOffer(frozen,start.neg.id,terms).waiting,'real queued offer');
 const contact=playWorldDay(frozen);check(contact.response&&negotiationClockAt(frozen)===first,'contact at first actual end');
 const failed=unpackDB(packDB(frozen)),failedWorld=failed.world,failedClub=managedTeam(failed),oldUndo=pendingOfficialUndo,oldMeta=recordMeta;let checkpoint,refused=false;
 pendingOfficialUndo=function(current){if(current===failed)checkpoint=JSON.stringify(current);return oldUndo(current);};recordMeta=function(current,r){const value=oldMeta(current,r);if(current===failed)throw Error('controlled global end consumer failure');return value;};
 try{playWorldDay(failed);}catch{refused=true;}finally{pendingOfficialUndo=oldUndo;recordMeta=oldMeta;}
 check(refused&&JSON.stringify(failed)===checkpoint&&failed.world===failedWorld&&managedTeam(failed)===failedClub,'global failed event restores full state and identities');
 const preserved=Object.values(failed.world.seasons).flatMap(s=>s.days.flatMap(d=>d.matches)).find(m=>m.clockSession);check(preserved?.clockSession.games.length===1&&preserved.clockGame&&!preserved.res,'prior game and pending receipt preserved after failure');
 const damaged=unpackDB(packDB(failed)),dm=Object.values(damaged.world.seasons).flatMap(s=>s.days.flatMap(d=>d.matches)).find(m=>m.clockGame);dm.clockGame.observation.sides[0].ps=null;const damagedBefore=JSON.stringify(damaged);let damagedRejected=false;try{playWorldDay(damaged);}catch{damagedRejected=true;}check(damagedRejected&&JSON.stringify(damaged)===damagedBefore,'damaged saved receipt rejected before any world event');
 const badConsumption=unpackDB(packDB(failed)),cm=Object.values(badConsumption.world.seasons).flatMap(s=>s.days.flatMap(d=>d.matches)).find(m=>m.clockSession);cm.gameTime.gameTimeThrough=addDays(badConsumption.worldDate,1)+'T12:00:00.000Z';const consumptionBefore=JSON.stringify(badConsumption);let consumptionRejected=false;try{playWorldDay(badConsumption);}catch{consumptionRejected=true;}check(consumptionRejected&&JSON.stringify(badConsumption)===consumptionBefore,'invalid partial consumed time rejected before chronology');
 const noNexus=unpackDB(packDB(failed)),nm=Object.values(noNexus.world.seasons).flatMap(s=>s.days.flatMap(d=>d.matches)).find(m=>m.clockGame);nm.clockGame.session.games.at(-1).publicRecord.ending.kind='gold';const noNexusBefore=JSON.stringify(noNexus);let noNexusRejected=false;try{playWorldDay(noNexus);}catch{noNexusRejected=true;}check(noNexusRejected&&JSON.stringify(noNexus)===noNexusBefore,'gold-based ending cannot write official effects');
 const handoff=unpackDB(packDB(failed)),hm=Object.values(handoff.world.seasons).flatMap(s=>s.days.flatMap(d=>d.matches)).find(m=>m.clockGame);setManagedTeam(handoff,hm.a);const handoffBefore=JSON.stringify(handoff);let handoffRejected=false;try{playWorldDay(handoff);}catch{handoffRejected=true;}check(handoffRejected&&JSON.stringify(handoff)===handoffBefore,'old automatic game cannot consume new manager authority');
 const partial=unpackDB(packDB(frozen));partial.world.seasons=Object.fromEntries(Object.entries(partial.world.seasons).reverse());
 const tick=frozen.world.lastDailyTick;playWorldDay(frozen);playWorldDay(partial);check(canonical(unpackDB(packDB(frozen)))===canonical(unpackDB(packDB(partial)))&&frozen.world.lastDailyTick===tick,'partial game contact restore and single daily consumer');
 return JSON.stringify({worldEndOrder:true,overlappingStartUsesPastOnly:true,propertyOrderFullStateEqual:true,liveSavedEqual:true,partialContactSaveEqual:true,failedGlobalConsumerRollback:true,priorGameAndReceiptPreserved:true,damagedSaveInert:true,nexusEndRequired:true,partialConsumedTimeInert:true,authorityHandoffInert:true,manualPreparation:true,dailyOnce:true,trace:normal.trace,starts:normal.starts});
})()`);
assert.equal(JSON.parse(globalEvents).propertyOrderFullStateEqual,true);
console.log('OFFICIAL_GLOBAL_EVENTS_ACCEPTANCE '+globalEvents);

const globalAutomatic=await runEngineFixture(String.raw`(()=>{
 const check=(v,m)=>{if(!v)throw Error('OFFICIAL_GLOBAL_AUTOMATIC '+m)};
 const cfg=defaultWorldConfig();cfg.regions=['KR','CN'].map(id=>regionCfg(id,{teams:4,div2:false}));cfg.internationals=[];
 const base=buildWorld(cfg),team=activeTeams(base,'KR',1)[0];startCareer(base,team.id,'global-auto');autoBuildInitialSquad(base,team,new RNG('clock-roster','fixture'),5);finalizeInitialRosters(base);base.world.manage='ai';
 while(nextCalendarDate(base)!==nextDate(base))playWorldDay(base);applyWorldDailyEffects(base,nextDate(base));
 const canonical=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
 const left=unpackDB(packDB(base)),right=unpackDB(packDB(base));right.world.seasons=Object.fromEntries(Object.entries(right.world.seasons).reverse());
 const date=base.worldDate,tick=base.world.lastDailyTick;playWorldDay(left);playWorldDay(right);
 check(canonical(left)===canonical(right),'automatic complete state independent of season order');check(left.world.lastDailyTick===tick&&left.worldDate===date,'single existing daily consumer');
 const finishFailure=unpackDB(packDB(base)),finishWorld=finishFailure.world,oldFinishUndo=pendingOfficialUndo,oldScout=scoutFromDay;let finishCheckpoint,finishRejected=false;
 pendingOfficialUndo=function(current){if(current===finishFailure)finishCheckpoint=JSON.stringify(current);return oldFinishUndo(current);};scoutFromDay=function(current,...args){const result=oldScout(current,...args);if(current===finishFailure)throw Error('controlled global day consumer failure');return result;};
 try{playWorldDay(finishFailure);}catch{finishRejected=true;}finally{pendingOfficialUndo=oldFinishUndo;scoutFromDay=oldScout;}
 check(finishRejected&&JSON.stringify(finishFailure)===finishCheckpoint&&finishFailure.world===finishWorld,'completed games survive failed day consumer without partial stage advance');
 playWorldDay(finishFailure);check(canonical(finishFailure)===canonical(left),'failed day consumer explicit retry preserves full result');
 const invalid=unpackDB(packDB(base)),fixture=Object.values(invalid.world.seasons).flatMap(s=>s.days[s.cur].matches).find(m=>!m.res);fixture.utcAt='invalid';const before=JSON.stringify(invalid),world=invalid.world;let refused=false;try{playWorldDay(invalid);}catch{refused=true;}check(refused&&JSON.stringify(invalid)===before&&invalid.world===world,'invalid future input rejected before daily or match writes');
 // 겹치지 않는 기존 한 대회 편성은 원래 작성자의 전체 결과와 비교한다.
 const oneCfg=defaultWorldConfig();oneCfg.regions=[regionCfg('KR',{teams:2,div2:false})];oneCfg.internationals=[];
 const one=buildWorld(oneCfg),oneTeam=activeTeams(one,'KR',1)[0];startCareer(one,oneTeam.id,'global-non-overlap');autoBuildInitialSquad(one,oneTeam,new RNG('clock-roster','fixture'),5);finalizeInitialRosters(one);one.world.manage='ai';
 while(nextCalendarDate(one)!==nextDate(one))playWorldDay(one);applyWorldDailyEffects(one,nextDate(one));
 const current=JSON.parse(JSON.stringify(one)),old=JSON.parse(JSON.stringify(one));playWorldDay(current);negotiationWorldDayBeforeClock(old);
 check(canonical(current)===canonical(old),'non-overlap original writer complete state and seed equal');
 return JSON.stringify({automaticOrderIndependent:true,allCurrentResultsEqual:true,dailyOnce:true,invalidInputBeforeWrites:true,failedDayConsumerRollback:true,completedGamesPreserved:true,explicitRetryEqual:true,nonOverlapOriginalStateEqual:true});
})()`);
assert.equal(JSON.parse(globalAutomatic).automaticOrderIndependent,true);
console.log('OFFICIAL_GLOBAL_AUTOMATIC_ACCEPTANCE '+globalAutomatic);

// d148b83652d61cb4beb5df090e1b34cd4c5f9650의 실제 공개 작성자에서 추출했다.
// 원본 모듈 SHA256 38bbbf81c8e42630e37eb54f8781aa876d0b7b369491ea20e48de69179a124d5.
// 성능 단언은 고정하지 않는다. 동일 실제 편성의 전체 상태/시드와 보호 경계를 검사한다.
const previewCopyBaselinePrepare="function originalClockPreviewPrepare(db,s,m){\n  const me=db.world.manage==='manual'&&!db.world.fired?managedTeamId(db):null;\n  if(me&&(m.a===me||m.b===me))throw Error('현재 감독의 경기에는 다른 구단의 자동 입력을 적용할 수 없습니다');\n  if(m.clockGame){officialQueuedGameError(db,s,m,m.clockGame);return;}\n  officialClockSessionCheck(s,m);\n  const copy=JSON.parse(JSON.stringify(db)),session=JSON.parse(JSON.stringify(m.clockSession||scheduledSeriesSession(copy,s,m).session));\n  const played=playSeriesSessionGame(copy,session,null,true),record=officialGameTimeRecord(m,session.games);\n  m.clockGame={endAt:record.gameTimeThrough,session,observation:officialGameObservation(played.game)};\n  officialQueuedGameError(db,s,m,m.clockGame);\n}\n";
const previewCopyBaselineWorld="function originalClockWorldEvents(db,date){\n  const w=db.world,me=w.manage==='manual'&&!w.fired?managedTeamId(db):null;\n  const days=Object.entries(w.seasons||{}).filter(([,s])=>!s.done&&s.days[s.cur]?.date===date)\n    .map(([key,s])=>({key,s,day:s.days[s.cur]})).sort((a,b)=>a.key.localeCompare(b.key));\n  const matches=days.flatMap(d=>d.day.matches.filter(m=>!m.res).map(m=>({...d,m})));\n  if(!days.length||matches.some(({m})=>m.utcAt==null))return null;\n  negotiationClockAt(db);\n  for(const {s,m} of matches){officialGameTimeRecord(m,[]);officialClockSessionCheck(s,m);if(m.clockGame)officialQueuedGameError(db,s,m,m.clockGame);if(me&&(m.a===me||m.b===me)&&(m.clockGame||m.clockSession))throw Error('진행 중인 다른 구단의 경기입니다. 현재 감독 경기로 자동 전환하지 않습니다');}\n  const n=waitingNegotiationResponses(db,true)[0];\n  if(n){const error=negotiationResponseError(n);if(error)throw Error(error);if(n.response.dueAt<date+'T00:00:00.000Z')return null;}\n  const advanced=applyWorldDailyEffects(db,date),played=days.map(({s,day})=>({s,day}));\n  const finish=()=>{\n    const undo=pendingOfficialUndo(db);\n    try{\n      for(const {s,day} of days){\n        if(day.matches.some(m=>!m.res))continue;\n        const comp=db.competitions[s.comp],idx=comp.stages.findIndex(x=>x.id===day.stage);\n        if(finalizeCompetitionDay(db,s,day,idx,comp.stages[idx]))scoutFromDay(db,s,day);\n      }\n    }catch(error){undo();throw error;}\n  };\n  while(true){\n    const events=matches.filter(({m})=>!m.res).map(ref=>{\n      const {m}=ref,owned=me&&(m.a===me||m.b===me);\n      if(owned&&(m.clockGame||m.clockSession))throw Error('진행 중인 다른 구단의 경기입니다. 현재 감독 경기로 자동 전환하지 않습니다');\n      return {...ref,kind:m.clockGame?'end':owned?'manual':'start',priority:m.clockGame?0:owned?2:3,\n        at:m.clockGame?.endAt||officialGameTimeRecord(m,m.clockSession?.games||[])?.gameTimeThrough||m.utcAt};\n    });\n    const contact=waitingNegotiationResponses(db,true)[0];\n    if(contact&&contact.response.dueAt<addDays(date,1)+'T00:00:00.000Z')events.push({kind:'contact',priority:1,at:contact.response.dueAt,key:contact.id});\n    events.sort((a,b)=>a.at.localeCompare(b.at)||a.priority-b.priority||a.key.localeCompare(b.key)||String(a.m?.id||'').localeCompare(String(b.m?.id||'')));\n    const event=events[0];if(!event){finish();if(!activeSeasons(db).length)advanceStep(db);return {date,played,pending:w.pendingOfficial,advanced};}\n    const undo=pendingOfficialUndo(db);\n    try{\n      // 이전 저장의 이미 소비된 하한은 되감지 않는다.\n      const current=negotiationClockAt(db),at=event.at<current?current:event.at;\n      if(me)w.negotiationClock={at};\n      if(event.kind==='contact'){\n        const response=resolveDueNegotiationResponse(db);finish();\n        return {date,played,pending:{kind:'negotiation',id:contact.id},advanced,...response};\n      }\n      if(event.kind==='end'){consumeOfficialClockGame(db,event.s,event.m);continue;}\n      const forfeit=event.m.clockSession?null:scheduledRegistrationForfeit(db,event.s,event.m);\n      if(forfeit){commitScheduledSeries(db,event.s,event.m,forfeit);continue;}\n      if(event.kind==='manual'){\n        w.pendingOfficial={date,queue:[{seasonKey:event.key,matchId:event.m.id,date}]};finish();\n        return {date,played,pending:w.pendingOfficial,advanced};\n      }\n      prepareOfficialClockGame(db,event.s,event.m);\n    }catch(error){undo();throw error;}\n  }\n}\n";
const previewCopy=await runEngineFixture("(()=>{\n const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:10,splits:1,legs:1,regularBo:1,playoffBo:3,playoffTake:4,div2:false,system:'franchise',format:'rr_po'}),regionCfg('EU',{teams:10,splits:1,legs:1,regularBo:1,playoffBo:3,playoffTake:4,div2:true,div2Teams:8,system:'relegation',format:'rr_po'})];cfg.internationals=[{id:'DAILY_WORLD',name:'Long-career international',short:'LCI',tier:1,timing:'end',teams:8,baseSlots:4,maxSlots:4,format:'swiss_ko',bo:3,prestige:3}];cfg.subs=1;\n const db=buildWorld(cfg),team=activeTeams(db,'NA',1)[0];startCareer(db,team.id,'daily-ci');db.world.manage='ai';autoBuildInitialSquad(db,team,new RNG('daily-ci','founding'),6);finalizeInitialRosters(db);\n let ticks=0;while(nextCalendarDate(db)!==nextDate(db)){if(++ticks>20)throw Error('bounded initial calendar');playWorldDay(db);}\n const saved=JSON.stringify(db),canonical=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);\n const currentPrepare=prepareOfficialClockGame,currentWorld=playOfficialWorldEvents;\n const measure=(before)=>{const sample=JSON.parse(saved);let prepareMs=0,prepareCalls=0;prepareOfficialClockGame=function(current,...args){const start=performance.now(),result=(before?originalClockPreviewPrepare:currentPrepare)(current,...args);if(current===sample){prepareCalls++;prepareMs+=performance.now()-start;}return result;};playOfficialWorldEvents=before?originalClockWorldEvents:currentWorld;const start=performance.now();let out;try{out=playWorldDay(sample);}finally{prepareOfficialClockGame=currentPrepare;playOfficialWorldEvents=currentWorld;}return {sample,ms:performance.now()-start,prepareMs,prepareCalls,date:out.date};};\n let before,after;if(0===1){after=measure(false);before=measure(true);}else{before=measure(true);after=measure(false);}if(canonical(before.sample)!==canonical(after.sample))throw Error('snapshot projection whole state or seed differs');\n const fault=JSON.parse(saved),faultDate=nextDate(fault);applyWorldDailyEffects(fault,faultDate);const faultBefore=JSON.stringify(fault),faultWorld=fault.world,faultTeams=fault.teams,oldCheck=officialQueuedGameError;let rejected=false;officialQueuedGameError=function(){throw Error('controlled start receipt validation failure');};try{playOfficialWorldEvents(fault,faultDate);}catch{rejected=true;}finally{officialQueuedGameError=oldCheck;}if(!rejected||JSON.stringify(fault)!==faultBefore||fault.world!==faultWorld||fault.teams!==faultTeams)throw Error('start failure failed complete state or object restoration');\n const copy=officialClockPreview(db),live=JSON.stringify(db);\n if(copy.players===db.players||copy.teams===db.teams||copy.metaStats===db.metaStats||copy.metaHistory===db.metaHistory)throw Error('mutable preview input shared');\n for(const change of [()=>{copy.world.phase='changed';},()=>{copy.history.push({fake:true});},()=>{copy.patch.rules.csGold=999;},()=>{copy.patch.champions[Object.keys(copy.patch.champions)[0]].base.hp=1;}]){try{change();}catch{}if(JSON.stringify(db)!==live)throw Error('preview readonly input leaked');}\n const changed=JSON.parse(JSON.stringify(after.sample)),oldGold=changed.patch.rules.csGold,oldRow=officialClockPreview(changed).patch;changed.patch.rules.csGold=oldGold+1;const newRow=officialClockPreview(changed).patch;if(newRow.rules.csGold!==oldGold+1||newRow===oldRow||officialClockPreview(changed).patch!==newRow)throw Error('current patch content ignored or repeat clone');\n if(changed.metaHistory.length){const old=officialClockPreview(changed).metaHistory[0];changed.metaHistory[0].date='2027-01-18';if(officialClockPreview(changed).metaHistory[0].date!=='2027-01-18'||officialClockPreview(changed).metaHistory[0]===old)throw Error('current history edits ignored');}\n return JSON.stringify({actualFixtureDays:1,pairOrder:0,beforeMs:before.ms,afterMs:after.ms,beforePrepareMs:before.prepareMs,afterPrepareMs:after.prepareMs,games:before.prepareCalls,date:before.date,wholeStateAndSeedEqual:true,mutableInputDetached:true,readonlyInputNoLeak:true,currentPatchAndHistoryContentChecked:true,startFailureFullStateRestored:true});\n})()",{setupSources:[previewCopyBaselinePrepare,previewCopyBaselineWorld]});
assert.equal(JSON.parse(previewCopy).wholeStateAndSeedEqual,true);
console.log('OFFICIAL_CLOCK_PREVIEW_COPY_ACCEPTANCE '+previewCopy);
