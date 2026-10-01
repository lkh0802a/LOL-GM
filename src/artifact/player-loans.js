// Temporary sporting registration; the original contract remains with the lender.
// All starts, recalls and accruals use the same scoped transaction journal.
const LOAN_INDEX=new WeakMap();
function loanIndex(db){
  let index=LOAN_INDEX.get(db);
  if(!index){index={players:[],owners:new Map()};
    for(const p of Object.values(db.players))if(p.loan&&!p.retired){
      index.players.push(p.id);
      const ids=index.owners.get(p.loan.ownerId)||[];ids.push(p.id);index.owners.set(p.loan.ownerId,ids);
    }
    LOAN_INDEX.set(db,index);
  }
  return index;
}
function loanOutgoingPlayers(db,t){return (loanIndex(db).owners.get(t.id)||[]).map(id=>db.players[id])}
function loanRosterCapacityError(db,t,p){
  if(officialRegistrationEnabled(db))return null;
  if(t.roster.includes(p.id))return null;
  const reserved=loanOutgoingPlayers(db,t).filter(x=>x.id!==p.id),
    rules=rosterRulesForTeam(db,t),max=t.parent||(t.division||1)===2?rules.reserveTeamMax:rules.firstTeamMax;
  return t.roster.length+reserved.length>=max?'임대 복귀 자리 포함 선수단 상한을 넘습니다':null;
}
function loanMarketOpen(db,t){
  if(db.world?.phase!=='season')return false;
  const md=(db.worldDate||'').slice(5),windows=db.regions[t.region]?.loanWindows||
    [{from:'01-07',through:'01-31'},{from:'07-01',through:'07-14'}];
  return windows.some(w=>md>=w.from&&md<=w.through);
}
function loanEndDate(db,duration){
  const year=contractedMoveSeason(db),half=year+'-07-01';
  return duration==='half'&&db.worldDate<half?half:year+'-12-31';
}
function loanPlayerConsent(db,p,t,role){
  // Salary is retained, not renegotiated. Only sporting opportunities change.
  const player=JSON.parse(JSON.stringify(p));
  player.contract={...player.contract,promisedRole:role};
  return contractTransferConsent({...db,players:{...db.players,[p.id]:player}},player,t);
}
function loanSnapshot(db,c){
  const p=db.players[c.pid];
  return JSON.parse(JSON.stringify({base:playerActionSnapshot(db,c),loan:p?.loan||null,
    usage:p?.usage||null,rolePromise:p?.rolePromise||null,
    finances:[c.fromId,c.teamId].map(id=>db.teams[id]?.finance),
    reservations:[c.fromId,c.teamId].map(id=>loanOutgoingPlayers(db,db.teams[id]).map(p=>p.id)),
    phase:db.world?.phase,windows:db.regions[db.teams[c.teamId]?.region]?.loanWindows||null}));
}
function validateLoanStart(db,a){
  const p=db.players[a.pid],from=playerActionTeam(db,a.fromId),to=playerActionTeam(db,a.teamId);
  if(!p||p.retired||!from||!to||p.team!==from.id||parentTeamOf(db,from).id===parentTeamOf(db,to).id)
    return worldActionError('invalid_loan','다른 구단 소속 선수가 필요합니다');
  if(p.loan||!p.contract||p.contract.medicalReplacement||p.contract.until<contractedMoveSeason(db)||
    !Number.isFinite(p.contract.salary)||p.contract.salary<=0)
    return worldActionError('invalid_contract','임대 가능한 일반 계약이 필요합니다');
  if(a.actor==='system')return worldActionError('unauthorized','시스템이 새 임대를 강제할 수 없습니다');
  const managingSource=a.actor==='manager'&&!playerActionAuthority(db,'manager',from),
    auth=playerActionAuthority(db,a.actor,to);if(auth&&!managingSource)return auth;
  if(a.actor==='ai'){const sourceAuth=playerActionAuthority(db,'ai',from);if(sourceAuth)return sourceAuth}
  if(!loanMarketOpen(db,to))return worldActionError('market_closed','도착 지역의 임대 시장이 닫혔습니다');
  if(!['half','season'].includes(a.duration)||!SQUAD_ROLES.includes(a.promisedRole)||
    typeof a.recall!=='boolean'||!Number.isFinite(a.salaryShare)||a.salaryShare<0||a.salaryShare>1||
    !Number.isFinite(a.fee)||a.fee<0)
    return worldActionError('invalid_terms','기간·역할·리콜·급여 분담·임대료 조건이 유효하지 않습니다');
  if(!playerActionFinance(from)||!playerActionFinance(to)||to.finance.cash+1e-8<a.fee)
    return worldActionError('invalid_finance','임대료를 지급할 재정 정보 또는 현금이 부족합니다');
  const rules=rosterRulesForTeam(db,from),minimum=from.parent||(from.division||1)===2?rules.reserveTeamMin:rules.firstTeamMin;
  if(from.roster.length<=minimum||(reserveTeamsOf(db,from).length&&organizationRoster(db,from).length<=rules.integratedMin))
    return worldActionError('roster_minimum','원소속 선수단의 최소 인원을 유지해야 합니다');
  const error=contractedMoveError(db,p)||localRegistrationError(db,to,p)||loanRosterCapacityError(db,to,p);
  if(error)return worldActionError('registration_limit',error);
  // The AI lender protects starters and requires wages in exchange for a free loan.
  const detached=JSON.parse(JSON.stringify(from)),view={...db,teams:{...db.teams,[from.id]:detached}},
    starter=starterFor(view,detached,p.role)?.id===p.id;
  if(!managingSource&&(starter&&!p.wantsOut||a.salaryShare<.5&&a.fee<p.contract.salary*.25))
    return worldActionError('club_consent','원소속 구단이 출전 계획 또는 비용 분담 조건을 거절했습니다');
  if(managingSource){
    const destination=JSON.parse(JSON.stringify(to)),decisionView={...db,teams:{...db.teams,[to.id]:destination}},
      current=starterFor(decisionView,destination,p.role);
    if(p.contract.salary*a.salaryShare>aiTransferSalaryRoom(db,to,a.fee)||
      current&&aiMarketValue(db,p,to)<=aiMarketValue(db,current,to)+3)
      return worldActionError('club_consent','도착 구단이 급여 예산 또는 전력 보강 조건을 거절했습니다');
  }
  const consent=loanPlayerConsent(db,p,to,a.promisedRole);
  if(!consent.ok||!consent.willing)return worldActionError('player_consent','선수가 임대 기회와 조건에 동의하지 않았습니다. '+consent.reason);
  const purchase=validateLoanPurchaseTerms(db,p,from,to,a,managingSource);
  if(!purchase.ok)return worldActionError('invalid_purchase',purchase.reason);
  return {ok:true,pid:p.id,fromId:from.id,teamId:to.id,duration:a.duration,
    promisedRole:a.promisedRole,recall:a.recall,salaryShare:a.salaryShare,fee:a.fee,
    endDate:loanEndDate(db,a.duration),consent,...(purchase.purchase?{purchase:purchase.purchase}:{})};
}
function loanWageAmount(db,p,date){
  const loan=p.loan,year=loan.season,start=loan.lastWageDate,
    end=date<loan.endDate?date:loan.endDate,
    days=Math.max(0,(Date.parse(end+'T00:00:00Z')-Date.parse(start+'T00:00:00Z'))/86400000),
    yearDays=(Date.UTC(year+1,0,1)-Date.UTC(year,0,1))/86400000;
  return p.contract.salary*loan.salaryShare*days/yearDays;
}
function accrueLoanWages(db,p,date){
  const loan=p.loan,amount=loanWageAmount(db,p,date);
  if(amount){recordLoanWageAdjustment(db.teams[loan.ownerId],loan.season,-amount,p.id);
    recordLoanWageAdjustment(db.teams[loan.borrowerId],loan.season,amount,p.id)}
  if(date>loan.lastWageDate)loan.lastWageDate=date<loan.endDate?date:loan.endDate;
}
function loanMovePlayer(db,p,t){LOAN_INDEX.delete(db);assignPlayerToTeam(db,p,t);initializeDepthChart(db,t,true)}
function applyLoanStart(db,c){
  const p=db.players[c.pid],from=db.teams[c.fromId],to=db.teams[c.teamId],
    u=p.usage?.year===db.year?p.usage:null;
  p.loan={ownerId:from.id,borrowerId:to.id,season:contractedMoveSeason(db),
    startDate:db.worldDate,lastWageDate:db.worldDate,endDate:c.endDate,
    duration:c.duration,recall:c.recall,salaryShare:c.salaryShare,fee:c.fee,
    ...(c.purchase?{purchase:JSON.parse(JSON.stringify(c.purchase))}:{}),
    promisedRole:c.promisedRole,originalRole:p.rosterRole,
    usageStart:JSON.parse(JSON.stringify(u||null)),
    promiseStart:{year:db.year,date:db.worldDate,games:u?.games||0,
      teamGames:u?.teamGames||0,unavailableTeamGames:u?.unavailableTeamGames||0}};
  recordContractedMove(db,p,'loan',from,to,{fee:c.fee});
  loanMovePlayer(db,p,to);p.rosterRole=c.promisedRole;initializeDepthChart(db,from,true);
  receiveFinancePrepaidTransfer(from,c.fee);payFinancePrepaid(to,'transferPaid',c.fee);
  recordPlayerEvent(p,'loan_start',db.year,{...p.loan,consent:c.consent});
  news(db,p.name+' 임대: '+from.short+' → '+to.short);
  return {pid:p.id,loan:p.loan};
}
function validateLoanExisting(db,a){
  const p=db.players[a.pid],loan=p?.loan;
  if(!loan||p.team!==loan.borrowerId||a.fromId!==loan.borrowerId||a.teamId!==loan.ownerId||
    !p.contract||!playerActionFinance(db.teams[loan.ownerId])||!playerActionFinance(db.teams[loan.borrowerId]))
    return worldActionError('invalid_loan','진행 중인 임대 구단 정보가 일치하지 않습니다');
  const due=db.worldDate>=loan.endDate||db.world?.phase==='offseason';
  if(a.type==='player.loan-accrue'){
    if(a.actor!=='system')return worldActionError('unauthorized','급여 정산은 달력에서 처리합니다');
  }else if(!due){
    if(!loan.recall)return worldActionError('no_recall','계약에 조기 복귀 조항이 없습니다');
    const auth=playerActionAuthority(db,a.actor,db.teams[loan.ownerId]);if(auth)return auth;
    if(a.actor==='system')return worldActionError('unauthorized','만료 전 강제 복귀는 허용되지 않습니다');
  }else if(a.actor!=='system'){
    const auth=playerActionAuthority(db,a.actor,db.teams[loan.ownerId]);if(auth)return auth;
  }
  if(a.type==='player.loan-return'&&loan.purchase?.type==='obligation')
    return worldActionError('binding_purchase','의무 매입은 복귀로 취소할 수 없습니다');
  if(a.type==='player.loan-return'&&db.teams[loan.ownerId].active===false)
    return worldActionError('club_closed','해체 구단 계약은 해체 정산에서 처리해야 합니다');
  return {ok:true,pid:p.id,fromId:loan.borrowerId,teamId:loan.ownerId};
}
function applyLoanReturn(db,c){
  const p=db.players[c.pid],loan=p.loan,from=db.teams[loan.borrowerId],to=db.teams[loan.ownerId];
  accrueLoanWages(db,p,db.worldDate);
  // Suspend owner promises during the loan; borrower games cannot satisfy or
  // breach the original promise. Aggregate career usage remains intact.
  for(const baseline of [p.contract.rolePromiseStart,p.rolePromise?.start]){
    if(baseline?.year!==db.year)continue;
    for(const key of ['games','teamGames','unavailableTeamGames'])
      baseline[key]=(baseline[key]||0)+Math.max(0,(p.usage?.[key]||0)-(loan.usageStart?.[key]||0));
  }
  delete p.loan;loanMovePlayer(db,p,to);p.rosterRole=loan.originalRole;
  initializeDepthChart(db,from,true);
  recordPlayerEvent(p,'loan_return',db.year,{from:from.id,to:to.id,date:db.worldDate});
  news(db,p.name+' 임대 종료 · '+to.short+' 복귀');
  return {pid:p.id,teamId:to.id};
}
for(const [type,validate,apply] of [
  ['player.loan',validateLoanStart,applyLoanStart],
  ['player.loan-return',validateLoanExisting,applyLoanReturn],
  ['player.loan-accrue',validateLoanExisting,(db,c)=>{accrueLoanWages(db,db.players[c.pid],db.worldDate);return {pid:c.pid}}]
])WORLD_ACTION_HANDLERS[type]={validate,apply,snapshot:loanSnapshot,
  canonical(db,a,v){const {ok,...terms}=v;return {type:a.type,actor:a.actor,...terms}},
  changes(db,c){return [{pid:c.pid,kind:c.type,from:c.fromId,to:c.teamId,
    ...(c.type==='player.loan'?{fee:c.fee,salaryShare:c.salaryShare,endDate:c.endDate}:{})}]}};
function processLoanDaily(db){
  for(const pid of loanIndex(db).players.slice()){
    const p=db.players[pid];
    const due=db.worldDate>=p.loan.endDate||db.world?.phase==='offseason',purchase=due&&p.loan.purchase?.type==='obligation',
      result=commitWorldAction(db,{type:purchase?'player.loan-purchase':due?'player.loan-return':'player.loan-accrue',
        pid:p.id,fromId:purchase?p.loan.ownerId:p.loan.borrowerId,
        teamId:purchase?p.loan.borrowerId:p.loan.ownerId,actor:'system'});
    if(!result.ok)throw new Error((result.errors||[]).join(' · '));
  }
}
