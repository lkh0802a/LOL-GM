// Shared current-interest observation projection; callers provide a scoped read view.
function shortlistComparisonModel(m,c){
  const db=m.read,ids=[...new Set(c.ids)].slice(0,3),rows=ids.map(id=>{
    const p=db.players[id],e=recruitmentTarget(db,id);
    if(!p||p.retired||!e)return {id,name:p?.name||id,status:'현재 관심 후보가 아닙니다'};
    return {id,name:p.name,p,e,report:scoutReport(db,p),metrics:observedPlayerCoreMetrics(db,p),attrs:observedPlayerAttributes(db,p),sources:initialComparisonSources(db,p,c)};
  });
  const sourceRows=rows.filter(r=>r.p).flatMap(r=>initialComparisonSources(db,r.p,{patch:'ALL',comp:'ALL',from:''}).rows);
  return {rows,date:db.worldDate,patches:[...new Set(sourceRows.map(r=>r.patch).filter(Boolean))].sort(),comps:[...new Set(sourceRows.map(r=>r.comp).filter(Boolean))].sort()};
}
