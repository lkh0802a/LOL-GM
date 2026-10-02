// Club closure composes the existing player release and finance writers.
// Closing a parent also closes its owned reserves; closing a reserve is local.
function clubClosureTeams(db,t){
  return [t,...(t.parent?[]:activeTeams(db).filter(x=>x.parent===t.id))];
}
function clubClosureFinanceTeams(db,teams){
  const parent=teams[0].parent&&playerActionTeam(db,teams[0].parent);
  return parent?[...teams,parent]:teams;
}
function clubClosureFundingPlan(db,c){
  const teams=c.teamIds.map(id=>db.teams[id]),
    original=new Map(teams.map(t=>[t.id,clubClosureAllocation(db,t)])),
    parent=db.teams[teams[0].parent||teams[0].id],transfers=[];
  if(parent&&parent.active!==false){
    const own=original.get(parent.id)||{...financeReleaseObligations(parent),
      reservedTransferAmount:financeCommittedTransferCash(db,parent)};
    financeClosureReservedAllocation(parent.finance.cash,own,own.reservedTransferAmount);
    // Owned squads return only cash left after protecting their own claims.
    // Recover it before calculating support, so a closing organization does
    // not strand reserve cash while its parent has unpaid player obligations.
    for(const t of teams.filter(t=>t.parent===parent.id)){
      const claims=original.get(t.id),surplus=Math.max(0,t.finance.cash-claims.totalClaimAmount);
      if(surplus>0)transfers.push({fromId:t.id,toId:parent.id,
        amount:surplus,kind:'cash_recovery'});
    }
    const recovered=transfers.reduce((n,row)=>n+row.amount,0);
    const needs=teams.filter(t=>t.parent===parent.id)
      .map(t=>({t,need:original.get(t.id).totalClaimAmount>0?
        Math.max(0,original.get(t.id).totalClaimAmount-t.finance.cash):0})).filter(row=>row.need>0),
      total=needs.reduce((n,row)=>n+row.need,0),
      available=Math.min(total,Math.max(0,parent.finance.cash+recovered-own.amount-own.reservedTransferAmount));
    if(available>0)for(const {t,need} of needs)
      transfers.push({fromId:parent.id,toId:t.id,amount:available*need/total,
        kind:'reserve_support'});
  }
  const changes=teams.map(t=>{
    const received=transfers.filter(x=>x.toId===t.id).reduce((n,x)=>n+x.amount,0),
      provided=transfers.filter(x=>x.fromId===t.id).reduce((n,x)=>n+x.amount,0),
      claims=original.get(t.id),funding={received,provided,cashBefore:t.finance.cash,
        transfers:transfers.filter(x=>x.fromId===t.id||x.toId===t.id)};
    return {teamId:t.id,kind:'club_closure',funding,
      settlement:financeClosureReservedAllocation(t.finance.cash+received-provided,claims,
        claims.reservedTransferAmount)};
  });
  return {transfers,changes};
}
function validateClubClosure(db,a){
  if(a.actor!=='system')return worldActionError('unauthorized','구단 해체는 사무국이 결정합니다');
  const t=playerActionTeam(db,a.teamId);
  if(!t)return worldActionError('missing_team','해체할 활성 구단을 찾을 수 없습니다');
  const teams=clubClosureTeams(db,t),teamIds=teams.map(x=>x.id),playerIds=[];
  for(const team of teams){
    if(!playerActionFinance(team)||team.finance.closureSettlement||!Array.isArray(team.roster))
      return worldActionError('invalid_finance','구단 해체 재정 정보가 유효하지 않습니다');
    for(const pid of team.roster){
      const p=db.players[pid];
      if(!p||p.team!==team.id||playerIds.includes(pid))
        return worldActionError('invalid_roster','해체할 선수단 소속이 일치하지 않습니다');
      const settlement=contractReleaseSettlement(db,p,'club_closure');
      if(!Number.isFinite(settlement.amount)||settlement.amount<0)
        return worldActionError('invalid_contract','해체 시 계약 보장액이 유효하지 않습니다');
      playerIds.push(pid);
    }
  }
  const affectedLoans=loanIndex(db).players.map(id=>db.players[id])
    .filter(p=>teamIds.includes(p.loan.ownerId)||teamIds.includes(p.loan.borrowerId));
  for(const p of affectedLoans)if(!playerIds.includes(p.id))playerIds.push(p.id);
  const w=db.world,negotiationIds=Object.entries(w?.negotiations||{})
    .filter(([,n])=>n.status==='open'&&(teamIds.includes(n.teamId)||playerIds.includes(n.pid)))
    .map(([id])=>id),agreementIds=Object.keys(w?.contractAgreements||{})
    .filter(pid=>w.contractAgreements[pid].status==='agreed'&&
      teamIds.includes(w.contractAgreements[pid].teamId));
  const financeTeams=Array.from(new Set([...clubClosureFinanceTeams(db,teams).map(t=>t.id),
    ...affectedLoans.flatMap(p=>[p.loan.ownerId,p.loan.borrowerId])])).map(id=>db.teams[id]);
  if(financeTeams.some(team=>!playerActionFinance(team)))
    return worldActionError('invalid_finance','모구단 지원 재정 정보가 유효하지 않습니다');
  try{clubClosureFundingPlan(db,{teamIds})}
  catch(e){return worldActionError('invalid_finance',e.message)}
  return {ok:true,teamId:t.id,teamIds,financeTeamIds:financeTeams.map(x=>x.id),
    playerIds,negotiationIds,agreementIds};
}
function clubClosureAllocation(db,t){
  const ownedIds=[...t.roster.filter(pid=>!db.players[pid]?.loan),...loanOutgoingPlayers(db,t).map(p=>p.id)],
    pending=financeReleaseObligations(t),newItems=ownedIds.map(pid=>
    contractReleaseSettlement(db,db.players[pid],'club_closure')).filter(row=>row.amount>0),
    staffItems=staffClosureClaims(db,t),items=[...pending.items,...newItems,...staffItems],amount=pending.amount+
      [...newItems,...staffItems].reduce((sum,row)=>sum+row.amount,0);
  // Retain agreed transfer dates rather than accelerating invoices on closure.
  // Closing loans return before settlement, so their unactivated purchases are
  // not included; existing mirrored guaranteed transfer invoices remain owed.
  return financeClosureReservedAllocation(t.finance.cash,{amount,items,
    unattributedAmount:pending.unattributedAmount},transferPaymentExposure(t).guaranteed);
}
function clubClosureSnapshot(db,c){
  const w=db.world;
  return JSON.parse(JSON.stringify({date:db.worldDate||null,year:db.year,saveId:db.saveId,
    loans:c.playerIds.map(pid=>({pid,loan:db.players[pid]?.loan,usage:db.players[pid]?.usage})),
    teams:c.financeTeamIds.map(id=>{
      const t=db.teams[id];
      return {id,active:t?.active,parent:t?.parent||null,roster:t?.roster,
        license:t?.competitionLicense?.current,owner:t?.owner?.id,
        finance:t?.finance,staff:t?.staffRoster,players:(t?.roster||[]).map(pid=>({pid,
          team:db.players[pid]?.team,contract:db.players[pid]?.contract}))};
    }),negotiations:c.negotiationIds.map(id=>w?.negotiations?.[id]),
    agreements:c.agreementIds.map(id=>w?.contractAgreements?.[id])}));
}
function applyClubClosure(db,c){
  const w=db.world,settlements=[],plan=clubClosureFundingPlan(db,c);
  for(const pid of c.playerIds){const p=db.players[pid];if(p.loan)
    applyLoanReturn(db,{pid,fromId:p.loan.borrowerId,teamId:p.loan.ownerId,actor:'system'})}
  applyClubClosureFunding(db,plan.transfers,c.teamIds,db.year,db.worldDate||null);
  for(const id of c.teamIds){
    const t=db.teams[id];
    for(const pid of t.roster.slice())
      applyPlayerReleaseAction(db,{pid,teamId:id,mode:'club_closure',actor:'system'});
    releaseClosingStaff(db,t);
    const funding=plan.changes.find(row=>row.teamId===id).funding,
      settlement=settleClubClosureFinance(t,db.year,db.worldDate||null,funding,
        transferPaymentExposure(t).guaranteed);
    ensureClubLicense(db,t);t.active=false;t.folded=db.year;
    syncClubLicense(db,t,'club-closure');
    settlements.push({teamId:id,...settlement});
  }
  for(const id of c.negotiationIds){
    const n=w.negotiations[id];n.status='cancelled';n.reason='club_closed';n.closedDate=db.worldDate;
  }
  for(const id of c.agreementIds){
    const a=w.contractAgreements[id];a.status='cancelled';a.reason='club_closed';a.closedDate=db.worldDate;
  }
  if(w&&c.teamIds.includes(managedTeamId(db)))w.fired=true;
  return {teamIds:c.teamIds,settlements};
}
WORLD_ACTION_HANDLERS['club.close']={
  validate:validateClubClosure,
  canonical(db,a,v){return {type:a.type,actor:a.actor,teamId:v.teamId,
    teamIds:v.teamIds.slice(),financeTeamIds:v.financeTeamIds.slice(),playerIds:v.playerIds.slice(),
    negotiationIds:v.negotiationIds.slice(),agreementIds:v.agreementIds.slice()}},
  snapshot:clubClosureSnapshot,
  changes(db,c){return clubClosureFundingPlan(db,c).changes},
  apply:applyClubClosure
};
