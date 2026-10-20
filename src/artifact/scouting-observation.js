// Observer-derived attributes and valuation consume stored reports only.
// Reuse the established observation signal; no separate trait noise or scouting
// policy is introduced by rendering derived metrics.
function observedPlayerAttributes(db,p,k=knowledge(db,p)){
  return Object.fromEntries([...new Set(Object.values(ATTR_GROUPS).flat())].map(a=>[a,obsAttr(db,p,a,k)]));
}
function observedPlayerCoreMetrics(db,p,k=knowledge(db,p)){
  if(playerChampionInternalAccess(db,p))return playerCoreMetrics(p);
  const metrics=playerCoreMetrics({role:p.role,attrs:observedPlayerAttributes(db,p,k),tend:{}});
  delete metrics.aggression;return metrics;
}
function observedPlayerMarketValue(db,p,k=knowledge(db,p)){
  if(playerChampionInternalAccess(db,p))return playerMarketValue(db,p);
  const potential=scoutPotentialRange(db,p),view=Object.create(p);
  Object.defineProperties(view,{attrs:{value:observedPlayerAttributes(db,p,k)},pot:{value:avg(potential)},form:{value:0},medical:{value:null},medicalResidual:{value:null},careerEvents:{value:(p.careerEvents||[]).filter(e=>!e.type.startsWith('medical_'))}});
  return playerMarketValue(db,view);
}
