// Read-only annual closeout preflight and prize plan. Cash/statements remain
// owned by closeFinances; no separate settlement writer or retroactive payout.
function financeCloseoutState(db,w){
  const clubs=activeTeams(db),settled=clubs.filter(t=>(t.finance?.history||[]).some(row=>row.year===w.year));
  if(w.financeClosedYear===w.year||clubs.length&&settled.length===clubs.length)return 'closed';
  return settled.length?'partial':'open';
}
function assertFinanceCloseout(db,w){
  const state=financeCloseoutState(db,w);
  if(state==='partial')throw Error('연간 결산 일부가 이미 기록되어 있습니다: '+w.year);
  return state;
}
function financeCloseoutPrizes(db,w){
  const prize={};
  for(const season of Object.values(w.seasons||{})){
    if(!season.done)continue;
    const c=db.competitions[season.comp];
    if(!c)continue;
    const pool=c.international?(isWorldChampionshipId(c.id)?45:c.tier==='low'?5:18):9*psOf(db,c.region);
    const participants=(c.teams||[]).filter(id=>db.teams[id]);
    const weights=participants.map(id=>[id,1+elimReach(db,season,id)*3]);
    const total=weights.reduce((n,row)=>n+row[1],0);
    if(total)for(const [id,weight] of weights)prize[id]=(prize[id]||0)+pool*weight/total;
  }
  return prize;
}
