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
function stageNegotiationOffer(db,nid,terms){
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
