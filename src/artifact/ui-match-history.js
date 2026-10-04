// Stored results are separate from current-state simulations and private models.
function renderPublicMatchReview(db,rec,game,filter={}){
  const read=recordedPublicMatch(db,rec,game),p=read.record;
  if(!p)return `<section><h3>저장된 경기 기록</h3><p class="hint">${read.reason==='no-authority'?'이 연습 경기 기록의 조회 권한이 없습니다.':read.reason==='not-recorded'?'이 경기의 당시 상세 기록이 없습니다. 세트 요약과 기록된 밴픽 근거만 확인할 수 있습니다.':'경기 기록의 출처를 확인할 수 없습니다.'} 현재 선수 상태로 과거 기록을 다시 만들지 않습니다.</p></section>`;
  return `<section><h3>${rec.practiceModel?'연습 당시 관측된 경기 기록':'당시 확정된 경기 기록'}</h3><p class="hint">${esc(p.date)} · 패치 ${esc(p.patch)} · ${p.duration.toFixed(1)}분${p.ending?` · 넥서스 파괴 ${fmtTime(p.ending.minute,p.ending.second)}`:''}. ${rec.practiceModel?'참가 구단의 비공개 연습 관측입니다.':'공개 경기 결과입니다.'} 숨은 능력·숙련 추정이나 승패 원인 판정이 아닙니다.</p>${renderRecordedAdjudicationBasis(p)}${p.sides.map(s=>`<h4>${esc(s.name)}</h4><div class="scroll"><table><thead><tr><th>선수·역할</th><th>챔피언</th><th>K/D/A</th><th>CS</th><th>획득 골드</th><th>피해량</th><th>레벨</th></tr></thead><tbody>${s.players.filter(x=>!filter.position||x[2]===filter.position).map(x=>`<tr><td>${esc(x[1])} · ${ROLE_KO[x[2]]}</td><td>${esc(p.championNames[x[3]]||x[3])}</td><td>${x[4]}/${x[5]}/${x[6]}</td><td>${x[7]}</td><td>${x[8]}</td><td>${x[9]}</td><td>${x[10]}</td></tr>`).join('')}</tbody></table></div>`).join('')}${renderRecordedGoldUse(p,filter)}${renderRecordedObjectives(p)}${renderRecordedTakedowns(p)}${filter.events===false?'':`<h4>실제 주요 사건</h4><p class="hint">${p.events.length?'당시 로그의 공개 처치·교전·오브젝트·구조물 사건 '+p.events.length+'건 / '+p.eventCount+'건'+(p.eventCount>p.events.length?' · 중간 사건은 저장 크기를 제한하기 위해 생략했습니다.':''): '당시 주요 사건 로그를 수집하지 않았습니다. 결과로 사건을 추정하지 않습니다.'}</p><ol>${p.events.map(e=>`<li><time>${fmtTime(e[0],e[1])}</time> ${esc(e[4])}</li>`).join('')}</ol>`}</section>`;
}
function renderRecordedGoldUse(p,filter){
  if(!p.resources)return '<p class="hint">이 경기의 당시 골드 사용 내역은 저장되지 않았습니다.</p>';
  return `<details><summary>종료 당시 골드 사용</summary><p class="hint">구매에 사용한 골드와 남은 골드입니다. 판매·환불은 계산하지 않으며, 각 합계는 반올림했습니다.</p>${p.sides.map(s=>{
    const values=s.players.filter(x=>!filter.position||x[2]===filter.position).map(x=>p.resources.players[x[0]]),sum=k=>Math.round(values.reduce((v,x)=>v+x[k],0));
    return `<p><strong>${esc(s.name)}</strong> · 장비 구매 ${sum('items')} · 시야 구매 ${sum('wards')} · 미사용 ${sum('held')} 골드</p>`;
  }).join('')}</details>`;
}
function renderRecordedObjectives(p){
  if(!p.objectives)return '<p class="hint">당시 오브젝트 참여 기록이 저장되지 않았습니다.</p>';
  const names={dragon:'드래곤',elder:'장로 드래곤',herald:'협곡의 전령',baron:'바론'},players=Object.fromEntries(p.sides.flatMap(s=>s.players.map(x=>[x[0],x[1]])));
  return `<details><summary>오브젝트 획득·참여 기록 (${p.objectives.events.length}건)</summary><p class="hint">당시 판정에 참여한 선수 기록입니다. 스틸 실행자는 당시 엔진 판정이며, 정확한 위치나 개별 스킬의 마지막 타격 기록은 아닙니다.</p>${p.objectives.events.length?`<ol>${p.objectives.events.map(e=>`<li><time>${fmtTime(e.minute,e.second)}</time> ${esc(p.sides[e.side].name)} · ${names[e.key]} · ${e.participants.map(id=>esc(players[id])).join(', ')}${e.stealer?' · 스틸 실행: '+esc(players[e.stealer]):''}</li>`).join('')}</ol>`:'<p class="empty">이 경기에서 판정된 오브젝트 획득이 없습니다.</p>'}</details>`;
}
function analysisMatchPanel(db,team,filter){
  const rows=officialMatchReviews(db,team.id,filter),shown=rows.slice(0,30),key=x=>JSON.stringify([x.key,x.di,x.mi,x.gi]),selected=shown.find(x=>key(x)===ANALYSIS_SET.review)||null;
  const tab=['records','events','draft'].includes(ANALYSIS_SET.reviewTab)?ANALYSIS_SET.reviewTab:'records',read=selected&&recordedPublicMatch(db,selected.rec,selected.game),p=read?.record;
  const label=x=>`${db.teams[x.game.blue]?.short||x.game.blue} / ${db.teams[x.game.red]?.short||x.game.red}`;
  const empty='<div class="review-empty"><h4>복기할 경기를 선택하세요</h4><p>왼쪽 경기 목록에서 세트를 선택하면 당시 선수 기록, 주요 사건, 우리 구단의 밴픽 검토를 확인할 수 있습니다.</p></div>';
  let detail=empty;
  if(selected){
    const source=p?`${p.duration.toFixed(1)}분 · 당시 저장된 공개 기록${p.ending?' · 넥서스 파괴 '+fmtTime(p.ending.minute,p.ending.second):''}`:'당시 상세 기록 없음',winner=db.teams[selected.game.winner]?.short||selected.game.winner;
    let content;
    if(tab==='draft')content=renderRecordedDraftReview(db,selected.rec,selected.game)||'<p class="empty">조회할 수 있는 당시 밴픽 검토가 없습니다. 현재 상태로 재구성하지 않습니다.</p>';
    else if(!p)content=renderPublicMatchReview(db,selected.rec,selected.game,filter);
    else if(tab==='events')content=`<section class="review-events">${renderRecordedObjectives(p)}${renderRecordedTakedowns(p)}<h4>주요 사건</h4><p class="hint">${p.events.length?p.events.length+'건 / 당시 공개 사건 '+p.eventCount+'건'+(p.eventCount>p.events.length?' · 처음과 마지막 사건을 보존한 발췌입니다.':''):'당시 사건 로그를 수집하지 않았습니다. 결과로 사건을 추정하지 않습니다.'}</p><ol>${p.events.map(e=>`<li><time>${fmtTime(e[0],e[1])}</time><span>${esc(e[4])}</span></li>`).join('')}</ol></section>`;
    else content=renderPublicMatchReview(db,selected.rec,selected.game,{...filter,events:false});
    detail=`<header class="review-heading"><p>${esc(db.competitions[selected.comp]?.name||selected.comp)} · ${selected.game.n}세트</p><h3>${esc(label(selected))}</h3><p class="review-result">${esc(winner)} 승리 <span>${esc(selected.date)} · 패치 ${esc(selected.patch)}</span></p><p class="hint">${esc(source)}. 기록과 당시 평가를 구분하며, 승패 원인을 단정하지 않습니다.</p></header><div class="review-tabs" role="tablist" aria-label="경기 복기 자료">${[['records','선수 기록'],['events','주요 사건'],['draft','밴픽 검토']].map(([id,name])=>`<button id="review-tab-${id}" data-review-tab="${id}" role="tab" aria-selected="${tab===id}" aria-controls="review-content" tabindex="${tab===id?0:-1}">${name}</button>`).join('')}</div><div id="review-content" role="tabpanel" aria-labelledby="review-tab-${tab}" tabindex="0">${content}</div>`;
  }
  return `<section class="match-workspace"><div class="review-title"><h3>공식 경기 복기</h3><p class="hint">조건에 맞는 ${rows.length}세트 · 최근 ${shown.length}세트 표시</p></div><div class="review-layout"><aside class="review-list" aria-label="복기할 경기"><div class="review-picker"><label>경기 선택<select id="analysis-review"><option value="">경기를 선택하세요</option>${shown.map(x=>`<option value="${esc(key(x))}"${selected===x?' selected':''}>${esc(x.date)} · ${esc(label(x))} · ${x.game.n}세트</option>`).join('')}</select></label></div>${shown.length?`<div class="review-list-buttons">${shown.map(x=>`<button data-review-game="${esc(key(x))}" aria-pressed="${selected===x}"><span>${esc(x.date)} · ${x.game.n}세트</span><strong>${esc(label(x))}</strong><small>${esc(db.competitions[x.comp]?.name||x.comp)}</small></button>`).join('')}</div>`:'<p class="empty">조건에 맞는 완료된 공식 경기가 없습니다.</p>'}</aside><div class="review-detail">${detail}</div></div></section>`;
}
function bindAnalysisMatch(){
  const choose=value=>{const team=analysisSelectedTeam(DB),rows=team?officialMatchReviews(DB,team.id,analysisFilter(DB,team)):[];
    if(value&&!rows.slice(0,30).some(x=>JSON.stringify([x.key,x.di,x.mi,x.gi])===value))return;
    ANALYSIS_SET.review=value;analysisRefresh();};
  const node=$('#analysis-review');if(node)node.onchange=e=>choose(e.target.value);
  document.querySelectorAll('[data-review-game]').forEach(b=>b.onclick=()=>choose(b.dataset.reviewGame));
  const tabs=[...document.querySelectorAll('[data-review-tab]')];
  const activate=b=>{ANALYSIS_SET.reviewTab=b.dataset.reviewTab;analysisRefresh();document.getElementById(b.id)?.focus()};
  tabs.forEach((b,i)=>{b.onclick=()=>activate(b);b.onkeydown=e=>{let n;if(e.key==='ArrowRight')n=(i+1)%tabs.length;if(e.key==='ArrowLeft')n=(i+tabs.length-1)%tabs.length;if(e.key==='Home')n=0;if(e.key==='End')n=tabs.length-1;if(n!==undefined){e.preventDefault();activate(tabs[n])}}});
  const team=analysisSelectedTeam(DB),selected=team&&officialMatchReviews(DB,team.id,analysisFilter(DB,team)).find(x=>JSON.stringify([x.key,x.di,x.mi,x.gi])===ANALYSIS_SET.review);
  if(selected)bindRecordedDraftReview(document,selected.rec);
}
