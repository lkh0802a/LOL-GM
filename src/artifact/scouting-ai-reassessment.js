// ===== LOL GM: stale scouting report reassessment =====
// Information-state research priority and the exact market-offer ranking audit.
function aiScoutingResearchPriority(db,t,p){
  const base=aiScoutingPublicFit(db,t,p),
    r=aiScoutingOwner(db,t)?.scoutingState?.reports?.[p.id];
  if(!r||!(r.staleYears>0)||r.ability==null)return base;
  const pub=aiPublicMarketObservation(db,p,t),
    uncertainty=aiScoutUncertainty(db,t,p,r.knowledge||0,r.staleYears||0),
    disagreement=Math.abs((r.ability??pub.ability)-pub.ability);
  // Staleness, uncertainty and disagreement are all information-state signals;
  // none reads current hidden OVR/POT. They only decide who deserves re-checking.
  return base+Math.min(9,(r.staleYears||0)*1.5+uncertainty*.25+disagreement*.12);
}
function aiMarketOfferRankSnapshot(db,t,p){
  if(!p||p.team)return {rank:null,leader:null,value:null,offerable:false};
  const fas=Object.values(db.players).filter(x=>!x.retired&&!x.team),
    room=Math.max(0,salaryBudget(db,t)-payroll(db,t)),
    rows=aiMarketOfferCandidates(db,t,fas,p.role,room,db.year),
    i=rows.findIndex(x=>x.p.id===p.id);
  return {rank:i<0?null:i+1,leader:rows[0]?.p.id||null,
    value:Math.round(aiMarketValue(db,p,t)*10)/10,offerable:i>=0};
}

