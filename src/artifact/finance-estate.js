function financeClosureReservedAllocation(cash,claims,reservedTransferAmount=0){
  if(!Number.isFinite(reservedTransferAmount)||reservedTransferAmount<0)
    throw new Error('구단 해체 이적료 예약액이 유효하지 않습니다');
  return {...financeClosureAllocation(cash-reservedTransferAmount,claims),
    reservedTransferAmount,totalClaimAmount:claims.amount+reservedTransferAmount};
}
function settleClubEstateRecovery(t,date,reservedAmount){
  const f=t.finance,cashBefore=f.cash,
    allocation=financeClosureAllocation(Math.max(0,cashBefore-reservedAmount),financeReleaseObligations(t));
  if(!allocation.paidAmount)return null;
  t.finance.cash-=allocation.paidAmount;t.finance.buyout=allocation.unpaidAmount;
  f.releaseObligations=allocation.items.filter(row=>row.unpaidAmount>0)
    .map(row=>({...row,originalAmount:row.originalAmount??row.amount,amount:row.unpaidAmount}));
  const recovery=f.estateRecovery||{paidAmount:0,distributions:0,history:[]};
  recovery.paidAmount+=allocation.paidAmount;recovery.distributions++;
  recovery.history=[...recovery.history,{date,cashBefore,cashAfter:f.cash,reservedAmount,...allocation}].slice(-20);
  f.estateRecovery=recovery;return allocation;
}
// Outstanding guaranteed invoices retain their agreed dates. Only cash beyond
// those commitments is available for further proportional release payouts.
function clubEstateRecoveryPlan(db,t){
  const reservedAmount=financeCommittedTransferCash(db,t),
    allocation=financeClosureAllocation(Math.max(0,t.finance.cash-reservedAmount),financeReleaseObligations(t));
  return {reservedAmount,allocation};
}
WORLD_ACTION_HANDLERS['finance.estate-recovery']={
  validate(db,a){
    if(a.actor!=='system')return worldActionError('unauthorized','해체 구단 회수금은 사무국이 정산합니다');
    const t=db.teams[a.teamId];
    if(!t||t.active!==false||!t.finance?.closureSettlement||!playerActionFinance(t))
      return worldActionError('invalid_estate','정산할 해체 구단 재산이 없습니다');
    try{return {ok:true,teamId:t.id,...clubEstateRecoveryPlan(db,t)}}
    catch(e){return worldActionError('invalid_finance',e.message)}
  },
  canonical(db,a,v){return {type:a.type,actor:a.actor,teamId:v.teamId,
    reservedAmount:v.reservedAmount,allocation:v.allocation}},
  snapshot(db,c){return JSON.parse(JSON.stringify({date:db.worldDate,finance:db.teams[c.teamId].finance,
    active:db.teams[c.teamId].active,reservedAmount:financeCommittedTransferCash(db,db.teams[c.teamId])}))},
  changes(db,c){return [{kind:'estate_recovery',teamId:c.teamId,...c.allocation,reservedAmount:c.reservedAmount}]},
  apply(db,c){return {allocation:settleClubEstateRecovery(db.teams[c.teamId],db.worldDate,c.reservedAmount)}}
};
function processClubEstateRecoveries(db){
  for(const t of Object.values(db.teams)){
    if(t.active!==false||!t.finance?.closureSettlement||!(t.finance.buyout>0)||!(t.finance.cash>0))continue;
    const plan=clubEstateRecoveryPlan(db,t);if(!plan.allocation.paidAmount)continue;
    const result=commitWorldAction(db,{type:'finance.estate-recovery',actor:'system',teamId:t.id});
    if(!result.ok)throw new Error((result.errors||[]).join(' · '));
  }
}
