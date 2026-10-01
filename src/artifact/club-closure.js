// Club closure composes the existing player release and finance writers.
// Closing a parent also closes its owned reserves; closing a reserve is local.
function clubClosureTeams(db,t){
  return [t,...(t.parent?[]:activeTeams(db).filter(x=>x.parent===t.id))];
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
  const w=db.world,negotiationIds=Object.entries(w?.negotiations||{})
    .filter(([,n])=>n.status==='open'&&(teamIds.includes(n.teamId)||playerIds.includes(n.pid)))
    .map(([id])=>id),agreementIds=Object.keys(w?.contractAgreements||{})
    .filter(pid=>w.contractAgreements[pid].status==='agreed'&&
      teamIds.includes(w.contractAgreements[pid].teamId));
  try{for(const team of teams)clubClosureAllocation(db,team)}
  catch(e){return worldActionError('invalid_finance',e.message)}
  return {ok:true,teamId:t.id,teamIds,playerIds,negotiationIds,agreementIds};
}
function clubClosureAllocation(db,t){
  const pending=financeReleaseObligations(t),newItems=t.roster.map(pid=>
    contractReleaseSettlement(db,db.players[pid],'club_closure')).filter(row=>row.amount>0),
    items=[...pending.items,...newItems],amount=pending.amount+
      newItems.reduce((sum,row)=>sum+row.amount,0);
  return financeClosureAllocation(t.finance.cash,{amount,items,
    unattributedAmount:pending.unattributedAmount});
}
function clubClosureSnapshot(db,c){
  const w=db.world;
  return JSON.parse(JSON.stringify({date:db.worldDate||null,year:db.year,saveId:db.saveId,
    teams:c.teamIds.map(id=>{
      const t=db.teams[id];
      return {id,active:t?.active,parent:t?.parent||null,roster:t?.roster,
        finance:t?.finance,players:(t?.roster||[]).map(pid=>({pid,
          team:db.players[pid]?.team,contract:db.players[pid]?.contract}))};
    }),negotiations:c.negotiationIds.map(id=>w?.negotiations?.[id]),
    agreements:c.agreementIds.map(id=>w?.contractAgreements?.[id])}));
}
function applyClubClosure(db,c){
  const w=db.world,settlements=[];
  for(const id of c.teamIds){
    const t=db.teams[id];
    for(const pid of t.roster.slice())
      applyPlayerReleaseAction(db,{pid,teamId:id,mode:'club_closure',actor:'system'});
    const settlement=settleClubClosureFinance(t,db.year,db.worldDate||null);
    t.active=false;t.folded=db.year;
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
    teamIds:v.teamIds.slice(),playerIds:v.playerIds.slice(),
    negotiationIds:v.negotiationIds.slice(),agreementIds:v.agreementIds.slice()}},
  snapshot:clubClosureSnapshot,
  changes(db,c){return c.teamIds.map(id=>({teamId:id,kind:'club_closure',
    settlement:clubClosureAllocation(db,db.teams[id])}))},
  apply:applyClubClosure
};
