// Recorded regional evidence, never exact hidden staff ability.
function staffRegionalKnowledgeSummary(s,db=DB){
  const rows=Object.entries(s.scoutRegions||{}).sort((a,b)=>b[1].knowledge-a[1].knowledge).slice(0,3);
  return rows.length?'<p class="hint">지역 관찰 경험 · '+rows.map(([id,r])=>esc(db.regions[id]?.name||id)+' '+Math.round(r.knowledge)+'% / '+r.observations+'회').join(' · ')+'</p>':'';
}
function scoutRegionalSummary(db,p){
  const view=scoutingRegionalPower(db,managedTeam(db),p),s=view.members[0],row=s?.scoutRegions?.[view.region];
  return '<p class="hint">관찰 지역 '+esc(db.regions[view.region]?.name||view.region)+' · '+(s?esc(s.name)+' · 기록된 지역 지식 '+Math.round(row?.knowledge||0)+'% ('+(row?.observations||0)+'회)':'개인 담당자 없음')+' · 실제 관찰로 경험이 쌓여 조사 효율에 반영됩니다. 과거 경험은 소급 생성하지 않습니다.</p>';
}
