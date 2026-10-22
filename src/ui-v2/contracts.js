const V2_TERM_FIELDS=[['salary','연봉 · 억 원/년'],['years','계약 기간 · 년'],['signingBonus','계약금 · 억 원']];
function v2Negotiations(){if(!v2Team()||V2.db.world.fired)return [];const ids=new Set(setupTeamsForManager(V2.db).map(t=>t.id));return Object.values(V2.db.world?.negotiations||{}).filter(n=>ids.has(n.teamId));}
function v2Draft(n){const stamp=JSON.stringify([V2.db.worldDate,n]);if(V2.drafts[n.id]?.stamp!==stamp)V2.drafts[n.id]={stamp,terms:JSON.parse(JSON.stringify(n.counter||n.demand))};return V2.drafts[n.id].terms;}
function v2CaptureDrafts(){if(!V2.db)return;document.querySelectorAll('[data-neg-form]').forEach(form=>{const n=V2.db.world?.negotiations?.[form.dataset.negForm];if(!n)return;const terms=v2Draft(n);for(const [key] of V2_TERM_FIELDS){const input=form.querySelector('[data-term="'+key+'"]');if(input)terms[key]=Number(input.value)}});}
function v2Terms(terms){if(!terms)return '';return `<div class="statline"><span>연봉 · 연간</span><strong>${v2Money(terms.salary)}</strong></div><div class="statline"><span>기간</span><strong>${v2Esc(terms.years)}년</strong></div><div class="statline"><span>계약금</span><strong>${v2Money(terms.signingBonus||0)}</strong></div><div class="statline"><span>방출 보장 비율</span><strong>${Math.round(contractGuaranteeRate(terms)*100)}%</strong></div>${Object.entries(terms.bonuses||{}).filter(([,v])=>v).map(([k,v])=>`<div class="statline"><span>${({performance:'성과 보너스',title:'우승 보너스',international:'국제전 보너스'})[k]||v2Esc(k)}</span><strong>${v2Money(v)}</strong></div>`).join('')}<p class="hint">${v2Esc(SQUAD_ROLE_KO[terms.promisedRole]||'역할 약속 없음')}${terms.option?' · '+v2Esc(terms.option.type==='player'?'선수 옵션':'구단 옵션'):''}${terms.buyout?' · 바이아웃 '+v2Money(terms.buyout.amount):''}</p>`;}
function v2OwnedNegotiation(nid){return v2Negotiations().find(n=>n.id===nid)||null;}
function v2NegotiationState(n){return n.status!=='open'?({accepted:'계약 완료',cancelled:'협상 종료',withdrawn:'철회',rejected:'거절'})[n.status]||n.status:n.stage==='waiting'?'응답 대기':n.stage==='agreement'?'조건 합의':n.counter?'역제안 검토':'조건 작성';}
function v2NegotiationList(){
 if(V2.nid)return v2NegotiationDetail(V2.nid);
 const rows=v2Negotiations();if(!rows.length)return '<section class="panel empty">진행 중인 협상이 없습니다.<p><button class="btn btn-primary" data-tab="선수 검색">선수 찾아보기</button></p></section>';
 return v2WaitingProgress()+'<section class="stack">'+rows.map(n=>{const terms=n.agreedTerms||n.counter||n.demand;return `<article class="panel"><div class="panel-heading"><strong>${v2Esc(V2.db.players[n.pid]?.name||'선수 정보 없음')}</strong><span class="state-tag">${v2Esc(v2NegotiationState(n))}</span></div><p class="small subtle">${v2Esc(V2.db.teams[n.teamId]?.name||'정보 없음')} · 연봉 ${v2Money(terms?.salary)} / 년</p><button class="btn btn-outline" data-negotiation-open="${v2Esc(n.id)}">협상 상세 →</button></article>`}).join('')+'</section>';
}
function v2NegotiationDetail(nid){
 const n=v2OwnedNegotiation(nid);if(!n)return '<section class="panel"><p>현재 관리 구단의 협상을 확인할 수 없습니다.</p><button class="btn btn-outline" id="negotiation-back">협상 목록으로</button></section>';
 if(n.stage==='club'&&n.status==='open')return v2SellerView(n);
 const p=V2.db.players[n.pid],open=n.status==='open',agreed=n.stage==='agreement',waiting=n.stage==='waiting',terms=waiting?n.response?.terms:open&&!agreed?v2Draft(n):n.agreedTerms||n.acceptedTerms||n.demand;
 return `<section class="panel"><button class="btn btn-outline btn-small" id="negotiation-back">← 협상 목록으로</button><div class="content-head"><div><h2>${v2Esc(p?.name||'선수 정보 없음')}</h2><p class="small subtle">대상 선수단 · ${v2Esc(V2.db.teams[n.teamId]?.name||'정보 없음')}</p></div><span class="state-tag">${v2Esc(v2NegotiationState(n))}</span></div><button class="btn btn-soft" id="contract-advice" data-advice="${v2Esc(n.id)}">비서에게 검토 요청</button>${open&&!agreed&&!waiting?`<form data-neg-form="${v2Esc(n.id)}" onsubmit="return false">${V2_TERM_FIELDS.map(([key,label])=>`<label class="field">${label}<input class="input" type="number" data-term="${key}" min="${key==='years'?1:0}" step="${key==='years'?1:.1}" value="${v2Esc(terms[key]||0)}" required></label>`).join('')}<details><summary>보너스·보장·옵션 조건</summary>${v2Terms(terms)}</details><button class="btn btn-primary" type="button" id="review-offer" data-offer-review="${v2Esc(n.id)}">제안 검토</button></form>`:v2Terms(terms)}${waiting?`<p>응답 예정 ${v2Esc(v2TimeText(n.response?.dueAt))}</p><p class="hint">현재 제안을 수정하려면 취소한 뒤 다시 제출하세요. 선수·자리·예산을 예약하지 않습니다.</p>${v2WaitingProgress()}`:''}${v2CurrentContact()?.id===n.id?'<button class="btn btn-primary" id="contract-match-resume">연락 검토를 마치고 현재 경기 재개</button>':''}${agreed&&open?`<p class="hint">아직 계약과 소속은 바뀌지 않았습니다. 최종 계약은 감독이 직접 결정합니다.</p><button class="btn btn-primary" id="review-final" data-final-review="${v2Esc(n.id)}">최종 계약 검토</button>`:''}${open?`<p><button class="btn btn-outline btn-small" data-end-neg="${v2Esc(n.id)}">협상 종료</button></p>`:''}<details><summary>주고받은 제안 · ${n.history?.length||0}건</summary>${(n.history||[]).map(h=>`<p class="small">${v2Esc(h.at?v2TimeText(h.at):h.date||n.createdDate||'날짜 정보 없음')} · ${v2Esc(v2NegotiationLabel(h))}${h.terms?' · 연봉 '+v2Money(h.terms.salary)+' / 년':''}${h.reason?' · '+v2Esc(h.reason):''}</p>`).join('')}</details></section>`;
}
function v2ReviewCurrent(review=V2.review){const n=review&&v2OwnedNegotiation(review.nid);return !!n&&review.db===V2.db&&review.manager===V2.db.manager&&review.owner===managedTeamId(V2.db)&&review.target===V2.target&&!manualNegotiationError(V2.db,n)&&review.stamp===v2NegotiationStamp(n)&&(review.mode==='final'||JSON.stringify(review.inputTerms)===JSON.stringify(v2Draft(n)));}
function v2ContractReviewView(){const r=V2.review,n=v2OwnedNegotiation(r?.nid),current=v2ReviewCurrent(r),plan=current&&r.mode!=='final'?negotiationResponsePlan(V2.db,n,r.terms):null;return `<section class="panel" id="contract-review"><p class="small">${v2Esc(V2.db.players[n?.pid]?.name||'선수 정보 없음')} · 대상 선수단 ${v2Esc(V2.db.teams[n?.teamId]?.name||'정보 없음')}</p>${r.adjusted?.length?'<p class="hint" role="status">기존 계약 규칙에 따라 '+r.adjusted.map(v2Esc).join(' · ')+'을 적용했습니다. 표시된 조건을 확인하거나 입력으로 돌아가 수정하세요.</p>':''}${v2Terms(r.terms)}${plan?.ok?`<p>${plan.immediate?'기존 최단 회차의 수락 조건에 따라 즉시 응답합니다.':'응답 예정 '+v2Esc(v2TimeText(plan.dueAt))}</p>`:''}<p class="hint">${r.mode==='final'?'직접 확정하면 현재 예산·자리·자격을 다시 확인하고 계약을 체결합니다.':'제안을 제출해도 선수단·예산·자리를 예약하지 않습니다.'}</p>${!current?'<p role="alert">조건이나 현재 권한이 바뀌었습니다. 닫고 다시 검토하세요.</p>':''}<div class="tag-flex"><button class="btn btn-primary" id="confirm-contract"${!current?' disabled':''}>${r.mode==='final'?'최종 계약 확정':'이 조건으로 제출'}</button><button class="btn btn-outline" id="cancel-review">${r.mode==='final'?'합의로 돌아가기':'조건 수정으로'}</button></div></section>`;}
function v2OpenNegotiation(nid){if(!v2OwnedNegotiation(nid))return v2Tell('현재 관리 구단의 협상을 확인하세요');v2Navigate('market','진행 중인 협상',null,nid);}
function v2SubmitReview(){const review=V2.review;if(!v2ReviewCurrent(review))return v2Tell('조건이나 게임 상태가 바뀌었습니다. 현재 조건을 다시 검토하세요.');const n=v2OwnedNegotiation(review.nid);V2.review=null;v2ContractAction(()=>review.mode==='final'?finalizeStagedNegotiation(V2.db,n.id):stageNegotiationOffer(V2.db,n.id,review.terms),n.id);}
function v2NegotiationLabel(h){return ({agreed:'선수 조건 수락 · 최종 계약 전',finalized:'감독 최종 계약 확정',submitted:'제안 접수 · 응답 대기',cancelled:'대기 제안 취소',response_unavailable:'현재 조건으로 응답 처리 불가',accept:'조건 수락',counter:'역제안',commit_rejected:'계약 처리 거절',rival:'경쟁 구단 선택'})[h.result]||(h.side==='club'?'구단 제안':'선수 응답');}
function v2NegotiationStamp(n){const db=V2.db;return JSON.stringify([db.manager,db.worldDate,db.world.phase,db.world.manage,db.world.fired,db.world.pendingOfficial,db.world.negotiationClock,db.world.officialGameTimeThrough,officialClockState(db),db.world.contractWindow,db.world.negotiations,db.players[n.pid],db.teams[n.teamId],db.regions[db.teams[n.teamId]?.region]]);}
function v2Review(nid,mode){
 v2CaptureDrafts();const n=V2.db.world?.negotiations?.[nid],error=manualNegotiationError(V2.db,n);if(error)return v2Tell(error);
 if(n.status!=='open'||n.stage!==(mode==='final'?'agreement':'player'))return v2Tell('현재 협상 상태가 바뀌었습니다');
 const form=document.querySelector(`[data-neg-form="${CSS.escape(nid)}"]`);if(mode!=='final'&&form&&!form.reportValidity())return;
 if(V2.official?.open||V2.managementReview||V2.roleReview||V2.advice)return v2Tell('현재 작업 창을 먼저 닫으세요');
 const inputTerms=JSON.parse(JSON.stringify(mode==='final'?n.agreedTerms:v2Draft(n)));
 if(!contractGuaranteeTermsValid(inputTerms)||invalidContractNumericTerms(inputTerms))return v2Tell('계약 금액·기간·보장 조건을 다시 확인하세요');
 const terms=mode==='final'?inputTerms:normalizeContractTerms(V2.db,V2.db.players[n.pid],V2.db.teams[n.teamId],inputTerms.salary,inputTerms.years,inputTerms);
 const labels={salary:'연봉',years:'계약 기간',signingBonus:'계약금',bonuses:'보너스',buyout:'바이아웃',option:'옵션',releaseGuaranteeRate:'방출 보장',promisedRole:'선수단 역할'},adjusted=Object.keys(labels).filter(k=>JSON.stringify(inputTerms[k])!==JSON.stringify(terms[k])).map(k=>labels[k]);
 V2.review={db:V2.db,manager:V2.db.manager,owner:managedTeamId(V2.db),target:V2.target,nid,mode,stamp:v2NegotiationStamp(n),inputTerms,terms,adjusted};v2Render();
}
function v2BindContracts(){
 v2Bind('#renew-player',()=>v2StartRenewal());
 v2Bind('#release-player',()=>v2ReviewPlayerRelease());v2Bind('#contact-waiver',()=>v2ReviewOwnedDecision('contact-waiver'));v2Bind('#window-option',()=>v2ReviewOwnedDecision('window-option'));v2Bind('#team-option',()=>v2ReviewManagement({type:'player.option',actor:'manager',pid:V2.pid,teamId:V2.db.players[V2.pid].team},'기존 팀 옵션 행사 검토',['저장된 기존 옵션 조건과 현재 권한을 다시 검사합니다.']));
 v2Bind('#seller-review',()=>v2ReviewSeller(V2.nid,Number(document.getElementById('seller-fee').value)));
 const seller=document.getElementById('seller-fee'),sellerCurrent=v2Guard();if(seller)seller.oninput=()=>{if(!sellerCurrent())return;const n=v2OwnedNegotiation(V2.nid);if(!n)return;V2.sellerDrafts??={};V2.sellerDrafts[n.id]={stamp:v2NegotiationStamp(n),fee:Number(seller.value)}};

 v2Bind('#contracts-advance',()=>v2ContractAction(()=>advanceToNegotiationResponse(V2.db)));
 v2Bind('#contract-match-resume',()=>v2ResumeAfterContact());
 v2Bind('[data-offer-review]',el=>v2Review(el.dataset.offerReview,'offer'));
 v2Bind('[data-final-review]',el=>v2Review(el.dataset.finalReview,'final'));
 v2Bind('[data-negotiation-open]',el=>v2OpenNegotiation(el.dataset.negotiationOpen));
 v2Bind('#negotiation-back',()=>v2Navigate('market','진행 중인 협상'));
 v2Bind('[data-advice]',el=>v2OpenAdvice(el.dataset.advice));
 v2Bind('#cancel-review',()=>v2CloseTask());
 v2Bind('#confirm-contract',()=>v2SubmitReview());
 v2Bind('[data-end-neg]',el=>{const n=V2.db.world?.negotiations?.[el.dataset.endNeg],error=manualNegotiationError(V2.db,n);if(error)return v2Tell(error);v2ContractAction(()=>v2CancelNegotiation(n.id),n.id)});
 const current=v2Guard();document.querySelectorAll('[data-neg-form] input').forEach(el=>el.oninput=()=>{if(current())v2CaptureDrafts()});
}
function v2Mail(){return v2Negotiations().flatMap(n=>(n.history||[]).map((h,i)=>({id:n.id+':'+i,nid:n.id,pid:n.pid,date:h.date||n.createdDate||'',title:(V2.db.players[n.pid]?.name||'선수')+' · '+v2NegotiationLabel(h),terms:h.terms}))).reverse();}
function v2Inbox(){const rows=v2Mail().filter(m=>V2.tab!=='읽지 않음'||!V2.read[m.id]);return `<section class="stack">${rows.map(m=>`<button class="mail-item" data-mail="${v2Esc(m.id)}"><span>${v2Icon('mail')}</span><span class="grow"><span class="title">${V2.read[m.id]?'':'● '}${v2Esc(m.title)}</span><span class="player-meta" style="display:block">${v2Esc(m.date)}</span></span><span>›</span></button>`).join('')||'<div class="panel empty">확인할 계약 연락이 없습니다.</div>'}</section>`;}

function v2CurrentContact(){return manualContactPending(V2.db)?V2.db.world.pendingOfficial.queue[0].contact:null;}
function v2TimeText(at){if(typeof at!=='string'||!Number.isFinite(Date.parse(at)))return '시각 확인 필요';const p=venueClockParts(at,'Asia/Seoul');return p.date+' '+p.time+' · 한국 시간';}
function v2WaitingProgress(){const rows=waitingNegotiationResponses(V2.db,true);return rows.length?`<section class="panel"><p>현재 게임 시각 ${v2Esc(v2TimeText(negotiationClockAt(V2.db)))}</p><p class="hint">다음 판단 연락 또는 공식 경기 준비에서 진행을 멈춥니다. 제안과 최종 계약은 자동으로 확정하지 않습니다.</p><button class="btn btn-primary" id="contracts-advance"${v2ManualError()?' disabled':''}>다음 선수 연락까지 진행</button></section>`:'';}
function v2ContractAction(action,nid=null){
 const error=nid?manualNegotiationError(V2.db,v2OwnedNegotiation(nid)):v2ManualError();if(error)return v2Tell(error);
 if(V2.managementReview||V2.roleReview||V2.advice||V2.official?.open)return v2Tell('현재 작업 창을 먼저 닫으세요');
 const undo=pendingOfficialUndo(V2.db);let out;try{out=action();if(!out?.ok&&!out?.response){undo();v2Tell(out?.msg||'현재 계약 상태를 다시 확인하세요');return out;}}catch(error){undo();v2Tell(error.message);return {ok:false,msg:error.message};}
 v2AfterCommittedAction(()=>{v2Tell(out.msg||'연락과 현재 상태를 확인하세요');v2Save();if(!v2ShowContractResponse(out))v2Render();});return out;
}
function v2ResumeAfterContact(){
 if(!v2CurrentContact())return v2Tell('현재 경기의 연락을 다시 확인하세요');
 const undo=pendingOfficialUndo(V2.db);let out;try{out=resumeManualAfterContact(V2.db);if(!out.ok&&!out.response&&!out.game){undo();return v2Tell(out.msg);}}catch(error){undo();return v2Tell(error.message);}
 v2AfterCommittedAction(()=>{v2AcceptOfficialOutput(out);if(!v2CurrentContact()&&V2.db.world.pendingOfficial)v2OfficialOpen();});
}

function v2ShowContractResponse(out){
 if(!out?.response)return false;const now=negotiationClockAt(V2.db),direct=out.negotiationId||(out.pending?.kind==='negotiation'?out.pending.id:null)||v2CurrentContact()?.id,n=direct?v2OwnedNegotiation(direct):v2Negotiations().find(n=>n.history?.some(h=>h.side==='player'&&h.at===now));
 if(!n)return false;v2OpenNegotiation(n.id);return true;
}

function v2CancelNegotiation(nid){const n=v2OwnedNegotiation(nid);if(!n||n.status!=='open')return {ok:false,msg:'진행 중인 협상이 아닙니다'};const msg=cancelNegotiation(V2.db,nid);return {ok:n.status==='cancelled',msg};}

// 게임 작성이 성공한 뒤의 표시 실패는 저장한 결정을 되돌리지 않는다.
function v2AfterCommittedAction(show){try{show();}catch(error){v2Tell('게임 처리는 유지했습니다. 화면을 다시 여세요 · '+error.message);}}

// 기존 재계약·판매 구단 협상을 새 화면에서 접근한다. 계약 작성은 기존 엔진만 한다.
function v2StartRenewal(pid=V2.pid){
 const db=V2.db,p=db.players[pid],t=v2Team(),error=v2ManagementError();if(error)return v2Tell(error);
 if(!p||p.retired||!t||t.parent||p.team!==t.id||!t.roster.includes(pid)||p.loan||p.contract?.medicalReplacement)return v2Tell('현재 관리 구단의 일반 소속 선수만 재계약을 검토하세요');
 if(v2TaskSpec())return v2Tell('현재 작업 창을 먼저 닫으세요');
 const undo=pendingOfficialUndo(db);try{const out=startNegotiation(db,pid,'renewal');if(!out.ok){undo();return v2Tell(out.msg)}v2Save();v2OpenNegotiation(out.neg.id)}catch(error){undo();v2Tell(error.message)}
}
function v2SellerView(n){
 const p=V2.db.players[n.pid],draft=V2.sellerDrafts?.[n.id],fee=draft?.stamp===v2NegotiationStamp(n)?draft.fee:n.clubCounter??0;
 return `<section class="panel"><button class="btn btn-outline" id="negotiation-back">← 협상 목록</button><h2>${v2Esc(p.name)} · 판매 구단 협상</h2><p>대상 선수단 ${v2Esc(V2.db.teams[n.teamId]?.name)} · 원소속 ${v2Esc(V2.db.teams[n.sellerId]?.name)}</p><p class="hint">받은 역제안이 있을 때만 상대 요구액을 표시합니다. 구단 간 합의 후에도 선수 동의와 별도 수동 최종 서명이 필요합니다.</p>${n.clubCounter?`<p>받은 역제안 ${v2Money(n.clubCounter)}</p>`:''}<label class="field">제안 이적료 · 억 원<input class="input" type="number" min="0" step="0.1" id="seller-fee" value="${v2Esc(fee)}"></label><button class="btn btn-primary" id="seller-review">이적료 제안 검토</button><button class="btn btn-outline" data-end-neg="${v2Esc(n.id)}">협상 종료</button></section>`;
}
function v2ReviewSeller(nid,fee){
 const n=v2OwnedNegotiation(nid),error=manualNegotiationError(V2.db,n);if(error)return v2Tell(error);
 if(n.stage!=='club'||n.status!=='open'||!Number.isFinite(fee)||fee<0)return v2Tell('현재 판매 구단 협상과 제안액을 확인하세요');
 if(v2TaskSpec())return v2Tell('현재 작업 창을 먼저 닫으세요');
 V2.managementReview={db:V2.db,world:V2.db.world,manager:V2.db.manager,stamp:v2ManagementStamp(),sellerOffer:{nid,fee,stamp:v2NegotiationStamp(n)},sellerTerms:JSON.stringify([nid,fee]),preview:{command:{type:'transfer.fee-review'}},title:'판매 구단 이적료 제안 검토',lines:[V2.db.players[n.pid].name+' · '+v2Money(fee),'판매 구단이 현재 상태에서 독립 판단합니다. 이적료 합의만으로 선수 계약·소속·지급을 확정하지 않습니다.']};v2Render();
}
function v2CommitSeller(r){
 const c=r.sellerOffer,n=v2OwnedNegotiation(c.nid),error=manualNegotiationError(V2.db,n);if(error)return {ok:false,errors:[error]};
 if(n.stage!=='club'||n.status!=='open'||c.stamp!==v2NegotiationStamp(n)||r.sellerTerms!==undefined&&r.sellerTerms!==JSON.stringify([c.nid,c.fee]))return {ok:false,errors:['현재 판매 구단 조건을 다시 확인하세요']};
 const undo=pendingOfficialUndo(V2.db),before=JSON.stringify(n);try{const msg=mTransferBid(V2.db,n.pid,c.fee);if(JSON.stringify(n)===before){undo();return {ok:false,errors:[msg]}}return {ok:true,msg}}catch(error){undo();return {ok:false,errors:[error.message]}}
}
function v2ReviewPlayerRelease(pid=V2.pid){
 const p=v2RolePlayer(pid);if(!p)return v2Tell('현재 관리 선수를 확인하세요');
 const command={type:'player.release',actor:'manager',pid,teamId:p.team,mode:'manager'},plan=previewWorldAction(V2.db,command);if(!plan.ok)return v2Tell(plan.errors.join(' · '));
 v2ReviewManagement(command,p.name+' · 계약 해지 검토',['계약 종료 보상 '+v2Money(plan.changes[0]?.cost||0),'현재 등록·로스터·계약·재정 조건을 다시 검사한 뒤 수동 확정합니다.']);
}
function v2OwnedDecisionStamp(pid){const db=V2.db,p=db.players[pid];return JSON.stringify([db.worldDate,db.year,db.world.contractWindow,db.world.contractAgreements,p,db.teams[p?.team]])}
function v2ReviewOwnedDecision(kind,pid=V2.pid){
 const p=v2RolePlayer(pid),error=v2ManagementError();if(error)return v2Tell(error);if(!p||v2Team()?.parent||v2TaskSpec())return v2Tell('현재 관리 선수와 작업 창을 확인하세요');
 if(!['contact-waiver','window-option'].includes(kind))return;
 V2.managementReview={db:V2.db,world:V2.db.world,manager:V2.db.manager,stamp:v2ManagementStamp(),ownedDecision:{kind,pid,stamp:v2OwnedDecisionStamp(pid)},ownedTerms:JSON.stringify([kind,pid]),preview:{command:{type:'contract.window-decision'}},title:kind==='contact-waiver'?'타 구단 조기 접촉 허용 검토':'기존 팀 옵션 행사 검토',lines:[p.name,kind==='contact-waiver'?'원소속 독점기간의 조기 접촉을 허용합니다. 선수의 계약 종료나 타 구단 서명을 자동으로 결정하지 않습니다.':'저장된 기존 옵션 조건을 행사합니다. 선수 옵션은 감독이 대신 행사하지 않습니다.']};v2Render();
}
function v2CommitOwnedDecision(r){
 const c=r.ownedDecision,p=v2RolePlayer(c.pid),error=v2ManagementError();if(error)return {ok:false,errors:[error]};if(!p||!['contact-waiver','window-option'].includes(c.kind)||r.ownedTerms!==JSON.stringify([c.kind,c.pid])||c.stamp!==v2OwnedDecisionStamp(c.pid))return {ok:false,errors:['현재 계약 조건을 다시 확인하세요']};
 const undo=pendingOfficialUndo(V2.db);try{const out=c.kind==='contact-waiver'?grantEarlyContact(V2.db,c.pid,'manager'):exerciseExclusiveTeamOption(V2.db,c.pid);if(!out?.ok){undo();return {ok:false,errors:[out?.msg||'현재 계약에서 행사할 수 없습니다']}}return out}catch(error){undo();return {ok:false,errors:[error.message]}}
}
