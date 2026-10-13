// 기존 선수 판정과 계약 작성자를 유지한 수동 합의/최종 계약 경계.
function manualNegotiationError(db,n){
  const w=db.world,t=n&&db.teams[n.teamId],p=n&&db.players[n.pid],me=managedTeam(db);
  if(!w||!n||!t||!p||p.retired||t.active===false)return '협상 당사자를 확인할 수 없습니다';
  if(w.manage!=='manual'||w.fired||!me||me.parent||w.pendingOfficial)return '현재 감독 권한으로 계약을 결정할 수 없습니다';
  if(n.kind==='initial'){
    if(w.phase!=='initial_roster'||!setupTeamsForManager(db).some(x=>x.id===t.id))return '현재 창단 선수단의 협상이 아닙니다';
  }else if(w.phase==='initial_roster'||t.id!==me.id)return '현재 소유 구단의 협상이 아닙니다';
  return null;
}
function resolveNegotiationOffer(db,nid,terms){
  const n=db.world?.negotiations?.[nid],error=manualNegotiationError(db,n);
  if(error)return {ok:false,msg:error};
  if(n.status!=='open'||n.stage!=='player')return {ok:false,msg:'제출할 수 있는 선수 협상이 아닙니다'};
  // 실제 기존 판정을 격리된 상태에서 실행한다. 예산/자리의 예약은 만들지 않는다.
  const preview=JSON.parse(JSON.stringify(db)),result=submitNegotiationOffer(preview,nid,terms),next=preview.world.negotiations[nid];
  if(!result.ok||next.status!=='accepted')return submitNegotiationOffer(db,nid,terms);
  const agreed=JSON.parse(JSON.stringify(next.acceptedTerms));
  const pending={...next,status:'open',stage:'agreement',counter:null,agreedTerms:agreed,agreedDate:db.worldDate};
  delete pending.acceptedTerms;delete pending.closedDate;delete pending.agreement;
  pending.history=pending.history.map(h=>h.side==='player'&&h.result==='accept'?{...h,result:'agreed',terms:agreed}:h);
  db.world.negotiations[nid]=pending;
  return {ok:true,agreed:true,msg:db.players[n.pid].name+' 측이 조건을 수락했습니다 · 최종 계약은 직접 확정하세요'};
}
function finalizeStagedNegotiation(db,nid){
  const n=db.world?.negotiations?.[nid],error=manualNegotiationError(db,n);
  if(error)return {ok:false,msg:error};
  if(n.status!=='open'||n.stage!=='agreement'||!n.agreedTerms)return {ok:false,msg:'최종 확정할 합의가 없습니다'};
  const deadline=negotiationContactDeadline(db,n);
  if(deadline&&negotiationClockAt(db)>=deadline)return {ok:false,msg:'기존 협상 마감이 지나 최종 계약을 확정할 수 없습니다'};
  const p=db.players[n.pid],t=db.teams[n.teamId],terms=n.agreedTerms;
  if(!contractGuaranteeTermsValid(terms))return {ok:false,msg:'유효하지 않은 계약 조건입니다'};
  if((n.kind==='fa'||n.kind==='initial')&&p.team)return {ok:false,msg:'선수가 이미 다른 계약을 체결했습니다'};
  if(n.kind==='renewal'&&p.team!==t.id)return {ok:false,msg:'선수의 소속 구단이 변경되었습니다'};
  if(['early_fa','renewal'].includes(n.kind)&&db.world?.phase==='offseason'&&db.world.contractWindow){
    const contact=contractWindowContactError(db,p,t,n.kind);if(contact)return {ok:false,msg:contact};
  }
  const budget=negotiationBudgetError(db,p,t,terms,n.kind);if(budget)return {ok:false,msg:budget};
  if(n.kind==='transfer'&&((terms.signingBonus||0)>Math.max(0,t.finance.cash-(n.feePlan?.upfront??n.fee??0))))return {ok:false,msg:'이적료 지급 후 계약금을 지급할 현금이 부족합니다'};
  const result=finalizeNegotiation(db,n,terms);
  if(result.ok)n.history.push({round:n.round,side:'club',result:'finalized',terms,date:db.worldDate});
  return result;
}

// 시각 조회는 이전 저장을 변경하지 않는다. 날짜 소비는 기존 달력 작성자를 사용한다.
function negotiationClockAt(db){
  const date=db.worldDate,stored=db.world?.negotiationClock;
  if(!freeAgencyDateValid(date))throw Error('협상 날짜를 확인할 수 없습니다');
  if(stored){
    if(typeof stored.at!=='string'||!Number.isFinite(Date.parse(stored.at))||new Date(stored.at).toISOString()!==stored.at)throw Error('협상 시각을 확인할 수 없습니다');
    if(stored.at.slice(0,10)>date)throw Error('협상 시각이 현재 날짜보다 늦습니다');
    if(stored.at.slice(0,10)===date)return stored.at;
  }
  return date+'T00:00:00.000Z';
}
function negotiationResponsePlan(db,n,terms){
  const preview=JSON.parse(JSON.stringify(db)),result=resolveNegotiationOffer(preview,n.id,terms),next=preview.world.negotiations[n.id];
  const changed=JSON.stringify(next)!==JSON.stringify(n);
  if(!changed)return {ok:false,msg:result.msg};
  const immediate=next.stage==='agreement'&&n.maxRounds===2;
  const slow=next.stage!=='agreement'||(n.competitors||[]).length>0;
  const rng=new RNG(db.world.seed+'/'+n.id+'/'+(n.round+1),'response-time');
  const hours=immediate?0:slow?rng.int(24,72):rng.int(2,8);
  const submittedAt=negotiationClockAt(db),dueAt=new Date(Date.parse(submittedAt)+hours*3600000).toISOString();
  return {ok:true,immediate,hours,submittedAt,dueAt,terms:JSON.parse(JSON.stringify(terms))};
}
function stageNegotiationOffer(db,nid,terms){
  const n=db.world?.negotiations?.[nid],error=manualNegotiationError(db,n);
  if(error)return {ok:false,msg:error};
  if(n.status!=='open'||n.stage!=='player')return {ok:false,msg:'대기 중인 제안은 취소한 뒤 다시 제출하세요'};
  const plan=negotiationResponsePlan(db,n,terms);if(!plan.ok)return plan;
  const deadline=negotiationContactDeadline(db,n);
  if(deadline&&plan.dueAt>=deadline)return {ok:false,msg:'응답 예정 시각이 기존 협상 마감에 도달합니다. 이번 제안은 제출하지 않았습니다'};
  if(plan.immediate)return resolveNegotiationOffer(db,nid,terms);
  n.stage='waiting';n.response={submittedAt:plan.submittedAt,dueAt:plan.dueAt,terms:plan.terms,round:n.round+1};
  n.history.push({round:n.round+1,side:'club',result:'submitted',terms:plan.terms,date:db.worldDate,at:plan.submittedAt,dueAt:plan.dueAt});
  const shown=venueClockParts(plan.dueAt,'Asia/Seoul');
  return {ok:true,waiting:true,dueAt:plan.dueAt,msg:'제안을 접수했습니다 · 선수 응답 예정 '+shown.date+' '+shown.time+' (한국 시간) · 최종 계약은 직접 확정하세요'};
}
function waitingNegotiationResponses(db,ownedOnly=false){
  return Object.values(db.world?.negotiations||{}).filter(n=>n.status==='open'&&n.stage==='waiting'&&n.response)
    .filter(n=>!ownedOnly||!manualNegotiationError(db,n))
    .sort((a,b)=>String(a.response.dueAt).localeCompare(String(b.response.dueAt))||String(a.id).localeCompare(String(b.id)));
}
function negotiationContactDeadline(db,n){
  const w=db.world,cw=w?.contractWindow;
  if(w?.phase==='offseason'&&['renewal','early_fa'].includes(n.kind)&&cw?.stage==='exclusive')return cw.outsideContactDate+'T00:00:00.000Z';
  if(!['initial_roster','market','preseason'].includes(w?.phase))return null;
  // 기존 시즌 작성자를 격리된 상태에서 실행해 실제 편성의 개최일을 읽는다.
  const copy=JSON.parse(JSON.stringify(db));startWorldSeason(copy,managedTeamId(copy),w.seed);
  const starts=Object.values(copy.world.seasons).flatMap(s=>s.days.flatMap(d=>d.matches.map(m=>{
    if(!m.localDate||!m.timeZone)throw Error('공식 경기의 개최일과 시간대를 확인할 수 없습니다');
    return venueToUtc(m.localDate,'00:00',m.timeZone);
  })));
  if(!starts.length)throw Error('기존 개막 편성에서 협상 마감을 확인할 수 없습니다');
  return starts.sort()[0];
}
function negotiationResponseError(n){
  const r=n.response;
  if(!r||typeof r.dueAt!=='string'||!Number.isFinite(Date.parse(r.dueAt))||new Date(r.dueAt).toISOString()!==r.dueAt)return '응답 예정 시각을 확인할 수 없습니다';
  if(!Number.isInteger(r.round)||r.round!==n.round+1)return '제출 당시 협상 회차가 바뀌었습니다. 제안을 취소하고 현재 조건을 다시 확인하세요';
  return null;
}
function resolveDueNegotiationResponse(db){
  const now=negotiationClockAt(db),n=waitingNegotiationResponses(db,true).find(n=>n.response.dueAt<=now);
  if(!n)return null;
  const response=n.response,error=manualNegotiationError(db,n);
  if(error)return {ok:false,blocked:true,msg:error};
  const responseError=negotiationResponseError(n);if(responseError)return {ok:false,blocked:true,msg:responseError};
  // 제출 시점의 판정을 적용하지 않고 실제 응답 시점의 상태를 재검사한다.
  n.stage='player';delete n.response;
  const before=n.history.length,result=resolveNegotiationOffer(db,n.id,response.terms),current=db.world.negotiations[n.id];
  if(current.history.length===before){
    current.history.push({round:response.round,side:'player',result:'response_unavailable',date:db.worldDate,at:now,reason:result.msg});
  }else for(const row of current.history.slice(before)){row.date=db.worldDate;row.at=now;}
  return {...result,response:true,negotiationId:n.id,msg:result.msg};
}
function commitNegotiationTime(db,copy){
  const world=db.world,nextWorld=copy.world,oldTeam=managedTeam(db),nextTeam=copy.teams[oldTeam?.id];
  if(oldTeam&&nextTeam){for(const key of Object.keys(oldTeam))delete oldTeam[key];Object.assign(oldTeam,nextTeam);copy.teams[oldTeam.id]=oldTeam;}
  if(JSON.stringify(copy.manager)===JSON.stringify(db.manager))copy.manager=db.manager;
  delete copy.world;for(const key of Object.keys(db))if(key!=='world')delete db[key];Object.assign(db,copy);for(const key of Object.keys(world))delete world[key];Object.assign(world,nextWorld);
}
function advanceNegotiationTime(db){
  const w=db.world,t=managedTeam(db);
  if(!w||!t||t.active===false||t.parent||w.manage!=='manual'||w.fired||w.pendingOfficial)return {ok:false,msg:'현재 감독 권한으로 시간을 진행할 수 없습니다'};
  if(!['initial_roster','market','offseason'].includes(w.phase))return {ok:false,msg:'현재 화면에서 협상 시간을 직접 진행할 수 없습니다'};
  const pending=waitingNegotiationResponses(db,true);if(!pending.length)return {ok:false,msg:'응답을 기다리는 현재 구단의 제안이 없습니다'};
  const responseError=negotiationResponseError(pending[0]);if(responseError)return {ok:false,msg:responseError};
  const now=negotiationClockAt(db),nextMidnight=addDays(db.worldDate,1)+'T00:00:00.000Z',due=pending[0].response.dueAt;
  if(!Number.isFinite(Date.parse(due)))return {ok:false,msg:'응답 예정 시각을 확인할 수 없습니다'};
  const copy=JSON.parse(JSON.stringify(db)),target=due<=now?now:due<nextMidnight?due:nextMidnight;
  if(target===nextMidnight){
    let result;
    if(w.phase==='offseason')result=w.contractWindow?.stage==='exclusive'?negotiationExclusiveDayBeforeClock(copy):negotiationFreeAgencyDayBeforeClock(copy);
    else {applyWorldDailyEffects(copy,target.slice(0,10));result={ok:true};}
    if(!result?.ok)return result;
  }
  copy.world.negotiationClock={at:target};
  const result=resolveDueNegotiationResponse(copy);
  if(result?.blocked)return result;
  commitNegotiationTime(db,copy);
  return result||{ok:true,advanced:true,msg:'협상 시간 진행 · '+target};
}
function advanceToNegotiationResponse(db){
  const copy=JSON.parse(JSON.stringify(db));let result;
  if(copy.world?.phase==='season'){
    const t=managedTeam(copy);
    if(!t||t.active===false||t.parent||copy.world.manage!=='manual'||copy.world.fired||copy.world.pendingOfficial)return {ok:false,msg:'현재 감독 권한으로 시간을 진행할 수 없습니다'};
    if(!waitingNegotiationResponses(copy).some(n=>!manualNegotiationError(copy,n)))return {ok:false,msg:'응답을 기다리는 현재 구단의 제안이 없습니다'};
    do{result=playWorldDay(copy);}while(result&&!result.pending&&copy.world.phase==='season'&&waitingNegotiationResponses(copy).some(n=>!manualNegotiationError(copy,n)));
    commitNegotiationTime(db,copy);
    return {ok:true,msg:result?.msg||'기존 공식 일정에서 진행을 중단했습니다. 현재 준비와 연락을 확인하세요',response:!!result?.response};
  }
  do{result=advanceNegotiationTime(copy);if(!result?.ok&&!result?.response)return result;}while(!result.response&&waitingNegotiationResponses(copy,true).length);
  commitNegotiationTime(db,copy);
  return result;
}
const negotiationExclusiveDayBeforeClock=advanceOffseasonContractDay;
const negotiationExclusiveWindowBeforeClock=advanceOffseasonContractWindow;
const negotiationFreeAgencyDayBeforeClock=advanceOffseasonFreeAgencyDay;
function negotiationResponseBeforeDate(db,date){
  const n=waitingNegotiationResponses(db,true)[0];
  return !!(n&&n.response.dueAt<=date+'T00:00:00.000Z');
}
advanceOffseasonContractDay=function(db){
  if(negotiationResponseBeforeDate(db,addDays(db.worldDate,1))){const r=advanceToNegotiationResponse(db);return r.response?{...r,ok:true}:r;}
  return negotiationExclusiveDayBeforeClock(db);
};
advanceOffseasonContractWindow=function(db){
  if(negotiationResponseBeforeDate(db,db.world?.contractWindow?.outsideContactDate)){const r=advanceToNegotiationResponse(db);return r.response?{...r,ok:true}:r;}
  return negotiationExclusiveWindowBeforeClock(db);
};
advanceOffseasonFreeAgencyDay=function(db,actor='manager'){
  if(actor==='manager'&&negotiationResponseBeforeDate(db,addDays(db.worldDate,1))){const r=advanceToNegotiationResponse(db);return r.response?{...r,ok:true}:r;}
  return negotiationFreeAgencyDayBeforeClock(db,actor);
};
const negotiationWorldDayBeforeClock=playWorldDay;
playWorldDay=function(db){
  const w=db.world,n=waitingNegotiationResponses(db).find(n=>!manualNegotiationError(db,n));
  if(!n||w.phase!=='season'||w.pendingOfficial?.queue?.length)return negotiationWorldDayBeforeClock(db);
  const responseError=negotiationResponseError(n);if(responseError)return {date:db.worldDate,played:[],pending:{kind:'negotiation',id:n.id},advanced:false,msg:responseError};
  const date=nextCalendarDate(db);if(!date)return negotiationWorldDayBeforeClock(db);
  const due=n.response.dueAt,at=negotiationClockAt(db),dayEnd=addDays(date,1)+'T00:00:00.000Z';
  const fixtureStarts=Object.values(w.seasons).filter(s=>!s.done).flatMap(s=>s.days[s.cur]?.date===date?s.days[s.cur].matches.filter(m=>!m.res).map(m=>m.utcAt):[]).filter(Boolean).sort();
  // 실재 편성의 첫 경기보다 이른 연락만 먼저 소비한다. 경기 준비는 기존 작성자가 담당한다.
  const boundary=fixtureStarts[0]||dayEnd;
  if(due>=boundary||due>=dayEnd)return negotiationWorldDayBeforeClock(db);
  const copy=JSON.parse(JSON.stringify(db)),target=due<=at?at:due;
  if(target.slice(0,10)>db.worldDate)applyWorldDailyEffects(copy,target.slice(0,10));
  copy.world.negotiationClock={at:target};const r=resolveDueNegotiationResponse(copy);
  if(r?.blocked)return {date:db.worldDate,played:[],pending:{kind:'negotiation',id:n.id},advanced:false,msg:r.msg};
  if(!r?.response)return negotiationWorldDayBeforeClock(db);
  // 일괄 진행의 세계 참조를 유지해 권한 변화로 잘못 처리하지 않는다.
  commitNegotiationTime(db,copy);
  return {date:db.worldDate,played:[],pending:{kind:'negotiation',id:n.id},response:true,advanced:true,msg:r.msg};
};
const negotiationCancelBeforeClock=cancelNegotiation;
cancelNegotiation=function(db,nid){
  const n=db.world?.negotiations?.[nid];
  if(n?.status==='open'&&n.stage==='waiting')n.history.push({round:n.response.round,side:'club',result:'cancelled',date:db.worldDate,at:negotiationClockAt(db),terms:n.response.terms});
  return negotiationCancelBeforeClock(db,nid);
};
const negotiationStartBeforeClock=startNegotiation;
startNegotiation=function(db,pid,kind='fa',extra={}){
  const teamId=extra.teamId||managedTeamId(db),previous=latestNegotiationAttempt(db,pid,kind,teamId),history=previous?.history?.some(h=>h.result==='submitted')?JSON.parse(JSON.stringify(previous.history)):null;
  const result=negotiationStartBeforeClock(db,pid,kind,extra);
  if(result.ok&&history&&result.neg!==previous&&result.neg.previousAttempts?.length)result.neg.previousAttempts.at(-1).history=history;
  return result;
};
