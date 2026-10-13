// 실제 합의와 최종 계약의 수동 결정/취소/오래된 입력 거절.
negotiationHistoryText=function(n){
  const labels={counter:'역제안',accept:'수락·계약 처리',commit_rejected:'계약 처리 거절',rival:'경쟁 구단 선택',agreed:'선수 조건 수락 · 최종 계약 전',finalized:'감독 최종 계약 확정'};
  return `<details><summary>주고받은 제안 ${n.history?.length||0}건</summary><p>협상 시작 ${esc(n.createdDate||'날짜 정보 없음')}</p>${(n.history||[]).map(h=>`<p>${esc(h.round)}차 · ${h.stage==='club'?(h.side==='seller'?(h.result==='accept'?'구단 이적료 수락':'구단 이적료 역제안'):'구단 이적료 제안'):(labels[h.result]||(h.side==='club'?'구단 제안':'선수 응답'))}${h.stage==='club'&&Number.isFinite(h.fee)?' · '+esc(money(h.fee)):h.terms?' · '+esc(contractTermsText(h.terms)):''}</p>`).join('')||'<p>아직 제출한 제안이 없습니다.</p>'}</details>`;
};
const negotiationRenderBeforeFinal=renderNegotiations;
renderNegotiations=function(teamIds=null,db=DB){
  const allowed=new Set(teamIds||[managedTeamId(db)]),all=Object.values(db.world?.negotiations||{}),agreements=all.filter(n=>allowed.has(n.teamId)&&n.status==='open'&&n.stage==='agreement');
  const view=Object.create(db);view.world={...db.world,negotiations:Object.fromEntries(all.filter(n=>n.stage!=='agreement').map(n=>[n.id,n]))};
  const normal=negotiationRenderBeforeFinal(teamIds,view);
  return (agreements.length&&normal.includes('진행 중인 공식 협상이 없습니다.')?'':normal)+agreements.map(n=>`<section class="cfgcard"><h4>${esc(db.players[n.pid]?.name||'선수 정보 없음')} · 조건 합의</h4><p>${esc(contractTermsText(n.agreedTerms))}</p><p class="hint">아직 계약·소속·지급은 변경되지 않았습니다. 최종 확정 때 현재 예산·자리·자격을 다시 확인합니다.</p><button type="button" class="primary" data-neg-final="${n.id}">최종 계약 검토</button><button type="button" class="ghost" data-neg-cancel="${n.id}">협상 종료</button><section data-neg-review="${n.id}" hidden tabindex="-1" aria-label="최종 계약 검토"></section>${negotiationHistoryText(n)}</section>`).join('');
};
function reviewManualNegotiation(id,mode,opener,act,allowed,root){
  const db=DB,w=db.world,n=w?.negotiations?.[id],panel=root.querySelector(`[data-neg-review="${id}"]`);
  if(!panel||!allowed()||manualNegotiationError(db,n))return;
  const final=mode==='final',terms=final?n.agreedTerms:mode==='counter'?n.counter:negotiationTermsFromDom(id,root);
  if(!terms||n.status!=='open'||n.stage!==(final?'agreement':'player'))return;
  const slot=SLOT,render=UI_RENDER_ID,view=VIEW,dialog=UI_OVERLAY,manager=db.manager;
  const stamp=()=>JSON.stringify([db.year,db.worldDate,w.phase,w.manage,w.fired,w.pendingOfficial,w.contractWindow,w.contractAgreements,w.negotiations,db.players[n.pid],db.teams[n.teamId],db.teams[n.sellerId],db.regions[db.teams[n.teamId]?.region]]),basis=stamp(),token={};
  panel.reviewToken=token;panel.hidden=false;
  panel.innerHTML=`<h4>${esc(db.players[n.pid].name)} · ${final?'최종 계약':'제안 조건'} 검토</h4><p>${esc(contractTermsText(terms))}</p><p class="hint">${final?'직접 확정하면 현재 조건을 재검사한 뒤 계약을 작성합니다.':'선수의 조건 수락과 최종 계약은 별개입니다. 현재 선수 답변은 즉시 판정됩니다.'}</p><button type="button" data-review-commit>${final?'최종 계약 확정':'이 조건으로 제출'}</button><button type="button" class="ghost" data-review-cancel>${final?'합의로 돌아가기':'조건 수정으로 돌아가기'}</button><p role="status" data-review-status></p>`;
  const hide=()=>{if(panel.reviewToken!==token)return;panel.reviewToken=null;panel.hidden=true;opener.focus({preventScroll:true})};
  panel.querySelector('[data-review-cancel]').onclick=hide;
  panel.querySelector('[data-review-commit]').onclick=()=>{
    if(panel.reviewToken!==token)return;
    const current=DB===db&&DB.world===w&&db.manager===manager&&SLOT===slot&&UI_RENDER_ID===render&&VIEW===view&&UI_OVERLAY===dialog&&!SLOT_SWITCHING&&allowed()&&stamp()===basis;
    if(!current||(!final&&mode!=='counter'&&JSON.stringify(negotiationTermsFromDom(id,root))!==JSON.stringify(terms))){panel.querySelector('[data-review-status]').textContent='조건이나 게임 상태가 바뀌었습니다. 닫고 현재 조건을 다시 검토하세요.';return}
    hide();act((final?finalizeStagedNegotiation(db,id):stageNegotiationOffer(db,id,terms)).msg);
  };
  panel.focus({preventScroll:true});
}
const negotiationBindBeforeFinal=bindNegotiationControls;
bindNegotiationControls=function(act,allowed=()=>true,root=document){
  negotiationBindBeforeFinal(act,allowed,root);
  for(const [selector,field,mode] of [['[data-neg-submit]','negSubmit','offer'],['[data-neg-accept]','negAccept','counter'],['[data-neg-final]','negFinal','final']])root.querySelectorAll(selector).forEach(b=>b.onclick=()=>reviewManualNegotiation(b.dataset[field],mode,b,act,allowed,root));
};
