function negotiationTimeText(at){if(typeof at!=='string'||!Number.isFinite(Date.parse(at)))return '시각 확인 필요';const value=venueClockParts(at,'Asia/Seoul');return value.date+' '+value.time+' · 한국 시간';}
// 기존 구단 브리핑의 같은 당사자 검사를 대기/합의에도 적용한다.
const clubBriefNegotiationsBeforeClock=typeof clubBriefNegotiations==='function'?clubBriefNegotiations:null;
if(clubBriefNegotiationsBeforeClock)clubBriefNegotiations=function(db,ctx){
  const negotiations=db.world?.negotiations||{},read=Object.create(db),originals=new Map();
  read.world={...db.world,negotiations:Object.fromEntries(Object.entries(negotiations).map(([id,n])=>{const projected=n&&['waiting','agreement'].includes(n.stage)?{...n,stage:'player'}:n;originals.set(projected,n);return [id,projected]}))};
  return clubBriefNegotiationsBeforeClock(read,ctx).map(n=>originals.get(n));
};
// 실제 합의와 최종 계약의 수동 결정/취소/오래된 입력 거절.
negotiationHistoryText=function(n){
  const labels={contact:'선수 연락 도착',counter:'역제안',accept:'수락·계약 처리',commit_rejected:'계약 처리 거절',rival:'경쟁 구단 선택',agreed:'선수 조건 수락 · 최종 계약 전',finalized:'감독 최종 계약 확정',submitted:'제안 접수 · 응답 대기',response_unavailable:'현재 조건으로 응답 처리 불가',cancelled:'제안 취소'};
  return `<details><summary>주고받은 제안 ${n.history?.length||0}건</summary><p>협상 시작 ${esc(n.createdDate||'날짜 정보 없음')}</p>${(n.history||[]).map(h=>`<p>${esc(h.round)}차 · ${h.stage==='club'?(h.side==='seller'?(h.result==='accept'?'구단 이적료 수락':'구단 이적료 역제안'):'구단 이적료 제안'):(labels[h.result]||(h.side==='club'?'구단 제안':'선수 응답'))}${h.stage==='club'&&Number.isFinite(h.fee)?' · '+esc(money(h.fee)):h.terms?' · '+esc(contractTermsText(h.terms)):''}</p>`).join('')||'<p>아직 제출한 제안이 없습니다.</p>'}</details>`;
};
const negotiationRenderBeforeFinal=renderNegotiations;
renderNegotiations=function(teamIds=null,db=DB){
  const allowed=new Set(teamIds||[managedTeamId(db)]),all=Object.values(db.world?.negotiations||{}),agreements=all.filter(n=>allowed.has(n.teamId)&&n.status==='open'&&n.stage==='agreement'),waiting=all.filter(n=>allowed.has(n.teamId)&&n.status==='open'&&n.stage==='waiting');
  const view=Object.create(db);view.world={...db.world,negotiations:Object.fromEntries(all.filter(n=>!['agreement','waiting'].includes(n.stage)).map(n=>[n.id,n]))};
  const normal=negotiationRenderBeforeFinal(teamIds,view);
  const running=Object.values(db.world?.seasons||{}).flatMap(s=>(s.days||[]).flatMap(d=>d.matches)).filter(m=>!m.res&&(m.clockGame||m.clockSession));
  const progress=running.length?`<p role="status">다른 공식 경기 ${running.length}개가 진행 중입니다. 완료한 게임만 기록했으며, 다음 진행에서 남은 경기를 이어갑니다.</p>`:'';
  return progress+((agreements.length||waiting.length)&&normal.includes('진행 중인 공식 협상이 없습니다.')?'':normal)+(waiting.length?`<div class="controls"><button type="button" class="primary" data-neg-continue>다음 선수 연락까지 진행</button></div><p>현재 게임 시각 ${esc(negotiationTimeText(negotiationClockAt(db)))}</p>`:'')+waiting.map(n=>`<section class="cfgcard"><h4>${esc(db.players[n.pid]?.name||'선수 정보 없음')} · 응답 대기</h4><p>응답 예정 ${esc(negotiationTimeText(n.response.dueAt))}</p><p>${esc(contractTermsText(n.response.terms))}</p><p>수정하려면 현재 제안을 취소한 뒤 다시 제출하세요. 선수와 예산은 예약되지 않습니다.</p><button type="button" class="ghost" data-neg-cancel="${n.id}">제안 취소</button>${negotiationHistoryText(n)}</section>`).join('')+agreements.map(n=>`<section class="cfgcard"><h4>${esc(db.players[n.pid]?.name||'선수 정보 없음')} · 조건 합의</h4><p>${esc(contractTermsText(n.agreedTerms))}</p><p class="hint">아직 계약·소속·지급은 변경되지 않았습니다. 최종 확정 때 현재 예산·자리·자격을 다시 확인합니다.</p><button type="button" class="primary" data-neg-final="${n.id}">최종 계약 검토</button><button type="button" class="ghost" data-neg-cancel="${n.id}">협상 종료</button><section data-neg-review="${n.id}" hidden tabindex="-1" aria-label="최종 계약 검토"></section>${negotiationHistoryText(n)}</section>`).join('');
};
function reviewManualNegotiation(id,mode,opener,act,allowed,root){
  const db=DB,w=db.world,n=w?.negotiations?.[id],panel=root.querySelector(`[data-neg-review="${id}"]`);
  if(!panel||!allowed()||manualNegotiationError(db,n))return;
  const final=mode==='final',terms=final?n.agreedTerms:mode==='counter'?n.counter:negotiationTermsFromDom(id,root);
  if(!terms||n.status!=='open'||n.stage!==(final?'agreement':'player'))return;
  const plan=final?null:negotiationResponsePlan(db,n,terms);
  const responseText=plan?.ok?(plan.immediate?'기존 조건에 따라 즉시 응답할 수 있습니다.':'응답 예정 '+negotiationTimeText(plan.dueAt)):(plan?.msg||'');
  const slot=SLOT,render=UI_RENDER_ID,view=VIEW,dialog=UI_OVERLAY,manager=db.manager;
  const stamp=()=>JSON.stringify([db.year,db.worldDate,w.negotiationClock,w.officialGameTimeThrough,officialClockState(db),w.phase,w.manage,w.fired,w.pendingOfficial,w.contractWindow,w.contractAgreements,w.negotiations,db.players[n.pid],db.teams[n.teamId],db.teams[n.sellerId],db.regions[db.teams[n.teamId]?.region]]),basis=stamp(),token={};
  panel.reviewToken=token;panel.hidden=false;
  panel.innerHTML=`<h4>${esc(db.players[n.pid].name)} · ${final?'최종 계약':'제안 조건'} 검토</h4><p>${esc(contractTermsText(terms))}</p><p class="hint">${final?'직접 확정하면 현재 조건을 재검사한 뒤 계약을 작성합니다.':'선수의 조건 수락과 최종 계약은 별개입니다. 선수별 응답 예정 시각을 기록하고 실제 시간이 진행되면 답변을 처리합니다. 기존 조건에 따른 즉시 수락도 가능합니다.'}</p>${!final?`<p>${esc(responseText)}</p>`:''}<button type="button" data-review-commit>${final?'최종 계약 확정':'이 조건으로 제출'}</button><button type="button" class="ghost" data-review-cancel>${final?'합의로 돌아가기':'조건 수정으로 돌아가기'}</button><p role="status" data-review-status></p>`;
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
  const db=DB,w=db.world,slot=SLOT,render=UI_RENDER_ID,view=VIEW,manager=db.manager,dialog=UI_OVERLAY,basis=JSON.stringify([db.worldDate,w.negotiationClock,w.officialGameTimeThrough,officialClockState(db),w.negotiations]);let used=false;
  root.querySelectorAll('[data-neg-continue]').forEach(b=>b.onclick=()=>{if(used||!allowed()||DB!==db||db.world!==w||db.manager!==manager||SLOT!==slot||UI_RENDER_ID!==render||VIEW!==view||SLOT_SWITCHING||UI_OVERLAY!==dialog||dialog&&dialog.kind!=='club-negotiation'||JSON.stringify([db.worldDate,w.negotiationClock,w.officialGameTimeThrough,officialClockState(db),w.negotiations])!==basis)return;used=true;act(advanceToNegotiationResponse(db).msg);});
  for(const [selector,field,mode] of [['[data-neg-submit]','negSubmit','offer'],['[data-neg-accept]','negAccept','counter'],['[data-neg-final]','negFinal','final']])root.querySelectorAll(selector).forEach(b=>b.onclick=()=>reviewManualNegotiation(b.dataset[field],mode,b,act,allowed,root));
};

// 완료 게임 뒤의 연락과 다음 수동 준비는 감독의 서로 다른 결정이다.
const officialUiBindBeforeManualContact=typeof officialUiBindPending==='function'?officialUiBindPending:null;
if(officialUiBindBeforeManualContact)officialUiBindPending=function(staleFrame=()=>false){
  const q=DB.world?.pendingOfficial?.queue?.[0];if(!q||!Object.hasOwn(q,'contact')&&!Object.hasOwn(q,'inflight'))return officialUiBindBeforeManualContact(staleFrame);
  if(!Object.hasOwn(q,'contact')){
    const context=officialUiContext(DB),receipt=q.inflight;document.querySelectorAll('.controls button').forEach(b=>b.disabled=true);
    document.querySelector('.controls')?.insertAdjacentHTML('beforeend','<p role="status">제출한 입력으로 게임이 진행 중입니다. 종료한 게임만 기록합니다.</p><button class="primary" id="manual-game-continue">진행 중 게임 계속</button>');
    const button=$('#manual-game-continue');if(button){button.disabled=!validManualInflightGame(DB);button.onclick=()=>{if(!officialUiCurrent(context)||q.inflight!==receipt||!validManualInflightGame(DB)||UI_OVERLAY||staleFrame())return;try{const result=resolvePendingOfficialMatch(DB,null);LAST=result.game||null;LASTSER=result.done?result.rec:null;saveDB();nav();}catch(error){MSG=error.message;nav();}};}return;
  }
  const c=officialUiContext(DB),contact=q.contact,n=DB.world.negotiations?.[contact?.id];
  document.querySelectorAll('.controls button').forEach(b=>b.disabled=true);
  document.querySelector('.controls')?.insertAdjacentHTML('beforeend','<p role="status">'+(manualContactPending(DB)?(q.inflight?'진행 중인 게임보다 먼저 선수 연락이 도착했습니다. 연락을 검토한 뒤 게임을 직접 계속하세요.':'완료한 게임 뒤 선수 연락이 도착했습니다. 연락을 검토하고 다음 경기 준비를 직접 다시 여세요.'):'현재 대기 연락의 저장 정보를 확인할 수 없습니다. 현재 저장과 경기 상태를 확인하세요.')+'</p><button class="primary" id="manual-contact-review">선수 연락 검토</button><button class="ghost" id="manual-contact-resume">'+(q.inflight?'진행 중 게임 계속':'현재 경기 준비 다시 열기')+'</button>');
  const valid=()=>officialUiCurrent(c)&&manualContactPending(DB)&&q.contact===contact&&!UI_OVERLAY&&!staleFrame();
  const review=$('#manual-contact-review'),resume=$('#manual-contact-resume');if(!review||!resume)return;
  review.disabled=resume.disabled=!valid();
  resume.onclick=()=>{if(!valid())return;try{const result=resumeManualAfterContact(DB);if(!result.ok&&!result.response&&!result.game)return;LAST=result.game||null;LASTSER=result.done?result.rec:null;saveDB();nav();}catch(error){MSG=error.message;nav();}};
  review.onclick=()=>{
    if(!valid()||!n)return;const db=DB,w=db.world,root=$('#overlay'),read=Object.create(db),state=clubBriefState(),stamp=JSON.stringify(n),date=db.worldDate;read.world={...w,negotiations:{[n.id]:n}};let dialog;
    const current=()=>officialUiCurrent(c)&&DB===db&&db.world===w&&q.contact===contact&&UI_OVERLAY===dialog&&manualContactPending(db);
    const close=()=>{if(UI_OVERLAY!==dialog)return;if(current())state.draft={nid:n.id,stamp,date,values:clubBriefDraft(n.id,root)};closeUiOverlay();};
    openUiOverlay({kind:'club-negotiation',label:'완료 게임 뒤 선수 연락',dismissible:true,onDismiss:close,focusSelector:'#manual-contact-close',html:'<div class="ovin"><div class="ovhead"><b>선수 연락 검토</b><button class="ghost" id="manual-contact-close">경기 진행으로 돌아가기</button></div><p>연락 시각 '+esc(negotiationTimeText(contact.at))+'</p>'+renderNegotiations([n.teamId],read)+(n.status==='open'?'':'<section><h4>'+esc(db.players[n.pid]?.name||'선수 정보 없음')+' · 협상 결과</h4>'+negotiationHistoryText(n)+'</section>')+'</div>'});dialog=UI_OVERLAY;
    if(state.draft?.nid===n.id&&state.draft.stamp===stamp&&state.draft.date===date)clubBriefDraft(n.id,root,state.draft.values);
    $('#manual-contact-close').onclick=close;
    bindNegotiationControls(msg=>{if(UI_OVERLAY!==dialog)return;state.draft=null;closeUiOverlay({restoreFocus:false});MSG=msg;saveDB();nav();$('#manual-contact-review')?.focus?.();},current,root);
  };
};
