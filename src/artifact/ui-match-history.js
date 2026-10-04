// Stored results are separate from current-state simulations and private models.
function renderPublicMatchReview(db,rec,game,filter={}){
  const read=recordedPublicMatch(db,rec,game),p=read.record;
  if(!p)return `<section><h3>저장된 경기 기록</h3><p class="hint">${read.reason==='not-recorded'?'이 경기의 당시 상세 기록이 없습니다. 세트 요약과 기록된 밴픽 근거만 확인할 수 있습니다.':'경기 기록의 출처를 확인할 수 없습니다.'} 현재 선수 상태로 과거 기록을 다시 만들지 않습니다.</p></section>`;
  return `<section><h3>당시 확정된 경기 기록</h3><p class="hint">${esc(p.date)} · 패치 ${esc(p.patch)} · ${p.duration.toFixed(1)}분. 공개 경기 결과이며 숨은 능력·숙련 추정이나 승패 원인 판정이 아닙니다.</p>${p.sides.map(s=>`<h4>${esc(s.name)}</h4><div class="scroll"><table><thead><tr><th>선수·역할</th><th>챔피언</th><th>K/D/A</th><th>CS</th><th>획득 골드</th><th>피해량</th><th>레벨</th><th>아이템·역할 보상 포함</th></tr></thead><tbody>${s.players.filter(x=>!filter.position||x[2]===filter.position).map(x=>`<tr><td>${esc(x[1])} · ${ROLE_KO[x[2]]}</td><td>${esc(p.championNames[x[3]]||x[3])}</td><td>${x[4]}/${x[5]}/${x[6]}</td><td>${x[7]}</td><td>${x[8]}</td><td>${x[9]}</td><td>${x[10]}</td><td>${x[11].map(id=>esc(p.itemNames[id]||id)).join(', ')||'없음'}</td></tr>`).join('')}</tbody></table></div>`).join('')}<h4>실제 주요 사건</h4><p class="hint">${p.events.length?'당시 로그의 공개 처치·교전·오브젝트·구조물 사건 '+p.events.length+'건 / '+p.eventCount+'건'+(p.eventCount>p.events.length?' · 중간 사건은 저장 크기를 제한하기 위해 생략했습니다.':''): '당시 주요 사건 로그를 수집하지 않았습니다. 결과로 사건을 추정하지 않습니다.'}</p><ol>${p.events.map(e=>`<li><time>${fmtTime(e[0],e[1])}</time> ${esc(e[4])}</li>`).join('')}</ol></section>`;
}
function analysisMatchPanel(db,team,filter){
  const rows=officialMatchReviews(db,team.id,filter),shown=rows.slice(0,30),selected=shown.find(x=>JSON.stringify([x.key,x.di,x.mi,x.gi])===ANALYSIS_SET.review)||null;
  return `<section><h3>공식 경기 복기</h3><p class="hint">조건에 맞는 ${rows.length}세트 중 최근 ${shown.length}세트. 저장된 공개 결과와 자기 구단의 당시 밴픽 평가를 구분합니다.</p>${shown.length?`<div class="controls analysis-controls"><label>경기<select id="analysis-review"><option value="">경기를 선택하세요</option>${shown.map(x=>{const id=JSON.stringify([x.key,x.di,x.mi,x.gi]);return `<option value="${esc(id)}"${selected===x?' selected':''}>${esc(x.date)} · ${esc(db.competitions[x.comp]?.name||x.comp)} · ${esc(db.teams[x.game.blue]?.short||x.game.blue)} / ${esc(db.teams[x.game.red]?.short||x.game.red)} · ${x.game.n}세트</option>`}).join('')}</select></label></div>`:'<p class="empty">조건에 맞는 완료된 공식 경기 기록이 없습니다.</p>'}${selected?renderPublicMatchReview(db,selected.rec,selected.game,filter)+renderRecordedDraftReview(db,selected.rec,selected.game):''}</section>`;
}
function bindAnalysisMatch(){
  const node=$('#analysis-review');if(node)node.onchange=e=>{const team=analysisSelectedTeam(DB),rows=team?officialMatchReviews(DB,team.id,analysisFilter(DB,team)):[];
    if(e.target.value&&!rows.slice(0,30).some(x=>JSON.stringify([x.key,x.di,x.mi,x.gi])===e.target.value))return;
    ANALYSIS_SET.review=e.target.value;analysisRefresh();};
  const team=analysisSelectedTeam(DB),selected=team&&officialMatchReviews(DB,team.id,analysisFilter(DB,team)).find(x=>JSON.stringify([x.key,x.di,x.mi,x.gi])===ANALYSIS_SET.review);
  if(selected)bindRecordedDraftReview(document,selected.rec);
}
