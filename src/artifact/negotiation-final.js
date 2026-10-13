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
    if(stored.at.slice(0,10)===date)return officialGameClockFloor(db,stored.at);
  }
  return officialGameClockFloor(db,date+'T00:00:00.000Z');
}
// 넥서스 종료까지 실제 엔진이 소비한 분 단위 시간만 기록한다.
// 세트 사이 준비/휴식과 중계 종료 시간은 자료가 없어 만들어 넣지 않는다.
function officialGameTimeRecord(m,games){
  if(!Array.isArray(games)||games.some(g=>g.duration!=null&&(!Number.isFinite(g.duration)||g.duration<0)))throw Error('공식 경기의 실제 소요 시간을 확인할 수 없습니다');
  if(m.utcAt!=null&&(typeof m.utcAt!=='string'||!Number.isFinite(Date.parse(m.utcAt))||new Date(m.utcAt).toISOString()!==m.utcAt))throw Error('공식 경기 시작 시각을 확인할 수 없습니다');
  // 이전 저장의 누락된 시각/수치에는 새 시간을 추정하지 않는다.
  if(m.utcAt==null||Array.isArray(games)&&(!games.length||games.some(g=>g.duration==null)))return null;
  const minutes=games.reduce((sum,g)=>sum+g.duration,0),end=Date.parse(m.utcAt)+Math.round(minutes*60000);
  if(!Number.isFinite(end))throw Error('공식 경기 종료 시각을 확인할 수 없습니다');
  return {scheduledAt:m.utcAt,gameTimeThrough:new Date(end).toISOString(),minutes,games:games.length};
}
function officialGameClockFloor(db,at){
  const floor=db.world?.officialGameTimeThrough;
  if(!floor)return at;
  if(typeof floor!=='string'||!Number.isFinite(Date.parse(floor))||new Date(floor).toISOString()!==floor)throw Error('저장된 공식 경기 소비 시각을 확인할 수 없습니다');
  return floor>at?floor:at;
}
function recordOfficialGameTime(db,m,record){
  if(!record)return;
  m.gameTime=record;
  // 기존 일괄 작성자가 미리 계산한 다른 경기 때문에 수동 준비를 건너뛰지 않는다.
  const w=db.world,me=w.manage==='manual'&&!w.fired?managedTeamId(db):null;
  if(me&&m.a!==me&&m.b!==me&&Object.values(w.seasons||{}).some(s=>(s.days||[]).some(d=>d.matches.some(next=>!next.res&&(next.a===me||next.b===me)&&next.utcAt&&next.utcAt<record.gameTimeThrough))))return;
  db.world.officialGameTimeThrough=officialGameClockFloor(db,record.gameTimeThrough);
}
const officialCommitBeforeClock=commitScheduledSeries;
commitScheduledSeries=function(db,s,m,series){
  // 중복 결과와 잘못된 입력은 기존 결과/재정/사용 기록 작성 전에 거절한다.
  if(m.res)return officialCommitBeforeClock(db,s,m,series);
  officialGameClockFloor(db,m.utcAt);
  const record=officialGameTimeRecord(m,series.rec.games||[]);
  const result=officialCommitBeforeClock(db,s,m,series);
  recordOfficialGameTime(db,m,record);return result;
};
const officialResolveBeforeClock=resolvePendingOfficialMatch;
resolvePendingOfficialMatch=function(db,forcedDraft){
  const q=db.world?.pendingOfficial?.queue?.[0],refs=q&&pendingOfficialRefs(db,q);
  if(refs){officialGameClockFloor(db,refs.m.utcAt);officialGameTimeRecord(refs.m,q.session?.games||[]);}
  const result=officialResolveBeforeClock(db,forcedDraft);
  if(refs&&!result.done)recordOfficialGameTime(db,refs.m,officialGameTimeRecord(refs.m,q.session.games));
  return result;
};
const officialPlayDayBeforeClock=playDay;
// 진행 중인 다른 경기의 다음 게임은 실제 종료 때만 관측/결과에 반영한다.
// 미래 세계 전체를 덮어쓰지 않고, 해당 게임의 기존 세션과 관측 입력만 보존한다.
function officialClockState(db){
  return Object.values(db.world?.seasons||{}).flatMap(s=>(s.days||[]).flatMap(d=>d.matches)).filter(m=>m.clockGame||m.clockSession).map(m=>[m.id,m.clockSession?.games.length||0,m.clockGame?.endAt||null]);
}
function officialGameObservation(r){
  return JSON.parse(JSON.stringify({winner:r.winner,date:r.date,patch:r.patch,comp:r.comp,metaContext:r.metaContext,
    draft:{bans:r.draft.bans,sequence:r.draft.sequence},sides:r.sides.map(s=>({
      team:{id:s.team.id,region:s.team.region,staffRoster:teamStaffMembers(s.team)},color:s.color,tacticContext:s.tacticContext,
      ps:s.ps.map(p=>({champ:{id:p.champ.id},p:{id:p.p.id},role:p.role,items:p.items,questBoots:p.questBoots,runes:p.runes}))}))}));
}
function officialQueuedGameError(db,s,m,event){
  const session=event?.session;
  if(!session||session.a!==m.a||session.b!==m.b||session.bestOf!==m.bo||session.seed!==`${s.seed}/${s.year}/${m.id}`||session.opt?.compId!==s.comp||session.opt?.metaContext?.season!==s.id)throw Error('진행 중인 다른 경기와 공식 편성이 다릅니다');
  const record=officialGameTimeRecord(m,session.games);
  if(!record||event.endAt!==record.gameTimeThrough||session.games.length!==(m.clockSession?.games.length||0)+1||event.observation?.date!==s.days[s.cur].date)throw Error('진행 중인 다른 게임의 종료 기록을 확인할 수 없습니다');
  const game=session.games.at(-1),observation=event.observation;
  if(game.publicRecord?.ending?.kind!=='nexus'||game.publicRecord.ending.winner!==game.winner||game.publicRecord.winner!==game.winner||game.publicRecord.duration!==game.duration||game.publicRecord.ending.minute+game.publicRecord.ending.second/60!==game.duration)throw Error('실제 넥서스 종료 기록을 확인할 수 없습니다');
  if(![0,1].includes(observation.winner)||observation.sides?.length!==2||observation.sides[0].team?.id!==game.blue||observation.sides[1].team?.id!==game.red||[game.blue,game.red][observation.winner]!==game.winner||observation.comp!==s.comp||observation.metaContext?.season!==s.id)throw Error('진행 중인 게임과 관측 입력이 다릅니다');
  if(!Array.isArray(observation.draft?.bans)||observation.draft.bans.length!==2||observation.draft.bans.some(xs=>!Array.isArray(xs)||xs.some(id=>typeof id!=='string'))||observation.sides.some(side=>!Array.isArray(side.ps)||side.ps.length!==ROLES.length||side.ps.some(p=>typeof p?.champ?.id!=='string'||typeof p?.p?.id!=='string'||!Array.isArray(p.items)||!Array.isArray(p.runes))))throw Error('저장된 게임의 관측 입력을 확인할 수 없습니다');
  if([m.a,m.b].some(id=>!db.teams[id]||db.teams[id].active===false)||db.world.phase!=='season'||db.world.year!==s.year)throw Error('진행 중인 다른 경기의 현재 참가 권한을 확인할 수 없습니다');
  return record;
}
function officialClockSessionCheck(s,m){
  if(m.clockSession){
    const record=officialGameTimeRecord(m,m.clockSession.games);
    if(m.gameTime&&(!record||['scheduledAt','gameTimeThrough','minutes','games'].some(key=>m.gameTime[key]!==record[key])))throw Error('저장된 세션의 실제 소비 시각이 다릅니다');
  }
  if(m.clockSession&&(m.clockSession.a!==m.a||m.clockSession.b!==m.b||m.clockSession.bestOf!==m.bo||m.clockSession.seed!==`${s.seed}/${s.year}/${m.id}`||m.clockSession.opt?.compId!==s.comp||m.clockSession.opt?.metaContext?.season!==s.id||m.clockSession.g!==m.clockSession.games?.length+1))throw Error('저장된 진행 세션과 현재 공식 편성이 다릅니다');
}
function prepareOfficialClockGame(db,s,m){
  const me=db.world.manage==='manual'&&!db.world.fired?managedTeamId(db):null;
  if(me&&(m.a===me||m.b===me))throw Error('현재 감독의 경기에는 다른 구단의 자동 입력을 적용할 수 없습니다');
  if(m.clockGame){officialQueuedGameError(db,s,m,m.clockGame);return;}
  officialClockSessionCheck(s,m);
  const copy=JSON.parse(JSON.stringify(db)),session=JSON.parse(JSON.stringify(m.clockSession||scheduledSeriesSession(copy,s,m).session));
  const played=playSeriesSessionGame(copy,session,null,true),record=officialGameTimeRecord(m,session.games);
  m.clockGame={endAt:record.gameTimeThrough,session,observation:officialGameObservation(played.game)};
  officialQueuedGameError(db,s,m,m.clockGame);
}
function consumeOfficialClockGame(db,s,m){
  const me=db.world.manage==='manual'&&!db.world.fired?managedTeamId(db):null;
  if(me&&(m.a===me||m.b===me))throw Error('현재 감독의 경기에는 다른 구단의 자동 입력을 적용할 수 없습니다');
  const event=m.clockGame,record=officialQueuedGameError(db,s,m,event);
  // 실제 종료 때 기존 작성자만 소비한다. 시작 때 격리한 세계를 덮어쓰지 않는다.
  recordMeta(db,event.observation);m.clockSession=event.session;delete m.clockGame;
  recordOfficialGameTime(db,m,record);
  if(seriesSessionDone(m.clockSession)){
    commitScheduledSeries(db,s,m,seriesSessionResult(db,m.clockSession));delete m.clockSession;
  }
}
function playOfficialGamesThrough(db,s,m,boundary){
  if(typeof boundary!=='string'||!Number.isFinite(Date.parse(boundary))||new Date(boundary).toISOString()!==boundary)throw Error('공식 경기 진행 경계 시각을 확인할 수 없습니다');
  const me=db.world.manage==='manual'&&!db.world.fired?managedTeamId(db):null;
  if(me&&(m.a===me||m.b===me))throw Error('현재 감독의 경기에는 다른 구단의 자동 입력을 적용할 수 없습니다');
  while(!m.res){
    const undo=pendingOfficialUndo(db);
    try{
      prepareOfficialClockGame(db,s,m);
      if(m.clockGame.endAt>boundary)return false;
      const end=m.clockGame.endAt;consumeOfficialClockGame(db,s,m);
      if(m.res)return true;
      if(end>=boundary)return false;
    }catch(error){undo();throw error;}
  }
  return true;
}
// 대회 객체 나열 순서 대신 실제 시작·게임 종료·판단 연락을 함께 비교한다.
function playOfficialWorldEvents(db,date){
  const w=db.world,me=w.manage==='manual'&&!w.fired?managedTeamId(db):null;
  const days=Object.entries(w.seasons||{}).filter(([,s])=>!s.done&&s.days[s.cur]?.date===date)
    .map(([key,s])=>({key,s,day:s.days[s.cur]})).sort((a,b)=>a.key.localeCompare(b.key));
  const matches=days.flatMap(d=>d.day.matches.filter(m=>!m.res).map(m=>({...d,m})));
  if(!days.length||matches.some(({m})=>m.utcAt==null))return null;
  negotiationClockAt(db);
  for(const {s,m} of matches){officialGameTimeRecord(m,[]);officialClockSessionCheck(s,m);if(m.clockGame)officialQueuedGameError(db,s,m,m.clockGame);if(me&&(m.a===me||m.b===me)&&(m.clockGame||m.clockSession))throw Error('진행 중인 다른 구단의 경기입니다. 현재 감독 경기로 자동 전환하지 않습니다');}
  const n=waitingNegotiationResponses(db,true)[0];
  if(n){const error=negotiationResponseError(n);if(error)throw Error(error);if(n.response.dueAt<date+'T00:00:00.000Z')return null;}
  const advanced=applyWorldDailyEffects(db,date),played=days.map(({s,day})=>({s,day}));
  const finish=()=>{
    const undo=pendingOfficialUndo(db);
    try{
      for(const {s,day} of days){
        if(day.matches.some(m=>!m.res))continue;
        const comp=db.competitions[s.comp],idx=comp.stages.findIndex(x=>x.id===day.stage);
        if(finalizeCompetitionDay(db,s,day,idx,comp.stages[idx]))scoutFromDay(db,s,day);
      }
    }catch(error){undo();throw error;}
  };
  while(true){
    const events=matches.filter(({m})=>!m.res).map(ref=>{
      const {m}=ref,owned=me&&(m.a===me||m.b===me);
      if(owned&&(m.clockGame||m.clockSession))throw Error('진행 중인 다른 구단의 경기입니다. 현재 감독 경기로 자동 전환하지 않습니다');
      return {...ref,kind:m.clockGame?'end':owned?'manual':'start',priority:m.clockGame?0:owned?2:3,
        at:m.clockGame?.endAt||officialGameTimeRecord(m,m.clockSession?.games||[])?.gameTimeThrough||m.utcAt};
    });
    const contact=waitingNegotiationResponses(db,true)[0];
    if(contact&&contact.response.dueAt<addDays(date,1)+'T00:00:00.000Z')events.push({kind:'contact',priority:1,at:contact.response.dueAt,key:contact.id});
    events.sort((a,b)=>a.at.localeCompare(b.at)||a.priority-b.priority||a.key.localeCompare(b.key)||String(a.m?.id||'').localeCompare(String(b.m?.id||'')));
    const event=events[0];if(!event){finish();if(!activeSeasons(db).length)advanceStep(db);return {date,played,pending:w.pendingOfficial,advanced};}
    const undo=pendingOfficialUndo(db);
    try{
      // 이전 저장의 이미 소비된 하한은 되감지 않는다.
      const current=negotiationClockAt(db),at=event.at<current?current:event.at;
      if(me)w.negotiationClock={at};
      if(event.kind==='contact'){
        const response=resolveDueNegotiationResponse(db);finish();
        return {date,played,pending:{kind:'negotiation',id:contact.id},advanced,...response};
      }
      if(event.kind==='end'){consumeOfficialClockGame(db,event.s,event.m);continue;}
      const forfeit=event.m.clockSession?null:scheduledRegistrationForfeit(db,event.s,event.m);
      if(forfeit){commitScheduledSeries(db,event.s,event.m,forfeit);continue;}
      if(event.kind==='manual'){
        w.pendingOfficial={date,queue:[{seasonKey:event.key,matchId:event.m.id,date}]};finish();
        return {date,played,pending:w.pendingOfficial,advanced};
      }
      prepareOfficialClockGame(db,event.s,event.m);
    }catch(error){undo();throw error;}
  }
}
playDay=function(db,s,opt={}){
  if(!s||s.done||(!opt.deferTeam&&!s.days[s.cur].matches.some(m=>m.clockGame||m.clockSession)))return officialPlayDayBeforeClock(db,s,opt);
  const day=s.days[s.cur],w=db.world;
  const pending=Object.values(w.seasons||{}).filter(next=>!next.done&&next.days[next.cur]?.date===day.date)
    .flatMap(next=>next.days[next.cur].matches).filter(m=>!m.res&&(m.a===opt.deferTeam||m.b===opt.deferTeam));
  const contact=w.phase==='season'&&opt.deferTeam===managedTeamId(db)?waitingNegotiationResponses(db,true)[0]:null;
  if(contact){const error=negotiationResponseError(contact);if(error)throw Error(error);}
  const running=day.matches.some(m=>m.clockGame||m.clockSession);
  if((!pending.length&&!contact&&!running)||pending.some(m=>m.utcAt==null)||day.matches.some(m=>!m.res&&m.utcAt==null))return officialPlayDayBeforeClock(db,s,opt);
  // 날짜만 남은 이전 저장은 원래 작성자가 처리한다. 현재 시각의 오류는 작성 전 거절한다.
  for(const m of [...pending,...day.matches.filter(m=>!m.res)])officialGameTimeRecord(m,[]);
  const boundary=[...pending.map(m=>m.utcAt),...(contact?[contact.response.dueAt]:[])].sort()[0]||'9999-12-31T23:59:59.999Z',comp=db.competitions[s.comp],cfgIdx=comp.stages.findIndex(x=>x.id===day.stage),cfg=comp.stages[cfgIdx],queue=[];
  for(const m of day.matches){
    if(m.res)continue;
    if(m.a===opt.deferTeam||m.b===opt.deferTeam){
      if(m.clockGame||m.clockSession)throw Error('진행 중인 다른 구단의 경기입니다. 현재 감독 경기로 자동 전환하지 않습니다');
      if(contact&&m.utcAt>=contact.response.dueAt)continue;
      const forfeit=scheduledRegistrationForfeit(db,s,m);
      if(forfeit)commitScheduledSeries(db,s,m,forfeit);else queue.push({matchId:m.id});
      continue;
    }
    // 늦게 시작할 경기는 결과·사용/의료 효과·관측을 아직 작성하지 않는다.
    if(m.utcAt>=boundary)continue;
    const forfeit=m.clockGame||m.clockSession?null:scheduledRegistrationForfeit(db,s,m);
    if(forfeit)commitScheduledSeries(db,s,m,forfeit);
    else playOfficialGamesThrough(db,s,m,boundary);
  }
  return {day,pending:queue,finalized:finalizeCompetitionDay(db,s,day,cfgIdx,cfg)};
};
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
  if(w.phase==='season'&&!w.pendingOfficial?.queue?.length){
    const date=nextCalendarDate(db);
    if(date&&date===nextDate(db)){const result=playOfficialWorldEvents(db,date);if(result)return result;}
  }
  if(!n||w.phase!=='season'||w.pendingOfficial?.queue?.length)return negotiationWorldDayBeforeClock(db);
  const responseError=negotiationResponseError(n);if(responseError)return {date:db.worldDate,played:[],pending:{kind:'negotiation',id:n.id},advanced:false,msg:responseError};
  const date=nextCalendarDate(db);if(!date)return negotiationWorldDayBeforeClock(db);
  const due=n.response.dueAt,at=negotiationClockAt(db),dayEnd=addDays(date,1)+'T00:00:00.000Z';
  const fixtureStarts=Object.values(w.seasons).filter(s=>!s.done).flatMap(s=>s.days[s.cur]?.date===date?s.days[s.cur].matches.filter(m=>!m.res).map(m=>m.utcAt):[]).filter(Boolean).sort();
  // 실재 편성의 첫 경기보다 이른 연락만 먼저 소비한다. 경기 준비는 기존 작성자가 담당한다.
  const boundary=fixtureStarts[0]||dayEnd;
  if(due>at&&(due>boundary||due>=dayEnd)){
    const result=negotiationWorldDayBeforeClock(db);
    // 시작한 다른 경기를 게임 종료 경계에서 보존한 뒤 연락 시각에 멈춘다.
    if(due<dayEnd&&!db.world.pendingOfficial?.queue?.length&&db.world.phase==='season'){
      db.world.negotiationClock={at:due};const response=resolveDueNegotiationResponse(db);
      if(response)return {...result,...response,pending:{kind:'negotiation',id:n.id},advanced:result?.advanced||false};
    }
    return result;
  }
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
  const teamId=extra.teamId||managedTeamId(db),previous=db.world?.negotiations?latestNegotiationAttempt(db,pid,kind,teamId):null,history=previous?.history?.some(h=>h.result==='submitted')?JSON.parse(JSON.stringify(previous.history)):null;
  const result=negotiationStartBeforeClock(db,pid,kind,extra);
  if(result.ok&&history&&result.neg!==previous&&result.neg.previousAttempts?.length)result.neg.previousAttempts.at(-1).history=history;
  return result;
};
