// Owned contract presentation; existing negotiation and option writers own rules.
function clubContractAllowed(db,t){return !!db.world&&!db.world.fired&&db.world.manage==='manual'&&
  !managedTeam(db)?.parent&&!['pick','initial_roster'].includes(db.world.phase)&&t?.active!==false&&
  parentTeamOf(db,t)?.id===managedTeamId(db)&&!db.world.pendingOfficial?.queue?.length}
function clubContractStamp(db,t){return JSON.stringify({date:db.worldDate,year:db.year,phase:db.world?.phase,
  manage:db.world?.manage,pending:db.world?.pendingOfficial,window:db.world?.contractWindow,
  agreements:db.world?.contractAgreements,negotiations:db.world?.negotiations,team:t,
  players:(t.roster||[]).map(id=>db.players[id])})}
function clubContractGuard(t,allowed=()=>true){
  const db=DB,w=db.world,slot=SLOT,render=UI_RENDER_ID,view=VIEW,manager=db.manager,
    tid=managedTeamId(db),dialog=UI_OVERLAY,stamp=clubContractStamp(db,t);
  return ()=>DB===db&&db.world===w&&SLOT===slot&&!SLOT_SWITCHING&&UI_RENDER_ID===render&&VIEW===view&&
    db.manager===manager&&managedTeamId(db)===tid&&UI_OVERLAY===dialog&&db.teams[t.id]===t&&
    clubContractAllowed(db,t)&&clubContractStamp(db,t)===stamp&&allowed();
}
function clubContractAction(db,pid,kind){
  const p=db.players[pid];
  if(kind==='renew')return startNegotiation(db,pid,'renewal',{teamId:p?.team});
  if(kind==='window-option')return exerciseExclusiveTeamOption(db,pid);
  return {msg:mExerciseTeamOption(db,pid)};
}
function bindContractEntryControls(act,allowed=()=>true,root=document){
  for(const [attr,kind] of [['start-renew','renew'],['exercise-option','option'],['exercise-window-option','window-option']])
    root.querySelectorAll(`[data-${attr}]`).forEach(b=>{
      const pid=b.getAttribute('data-'+attr),p=DB.players[pid],t=p&&DB.teams[p.team],current=t?clubContractGuard(t,allowed):()=>false;
      b.onclick=()=>{if(!current()||!p||p.retired||DB.players[pid]!==p||!t.roster.includes(pid))return;
        const r=clubContractAction(DB,pid,kind);act(r.msg,r);};
    });
}
function clubContractModel(db=DB,tid=managedTeamId(db)){
  const ctx=clubBriefContext(db);if(!ctx||!ctx.teams.includes(tid))return null;
  const read=JSON.parse(JSON.stringify(db)),t=read.teams[tid];
  const rows=(t.roster||[]).map(id=>read.players[id]).filter(p=>p&&!p.retired&&p.team===tid).map(p=>{
    const c=p.contract,agreement=read.world.contractAgreements?.[p.id]||null,
      n=Object.values(read.world.negotiations||{}).find(n=>n.pid===p.id&&n.teamId===tid&&n.kind==='renewal'&&n.status==='open');
    const probe=JSON.parse(JSON.stringify(read)),renew=clubContractAllowed(db,db.teams[tid])&&!p.loan&&!c?.medicalReplacement?
      clubContractAction(probe,p.id,'renew'):{ok:false,msg:p.loan?'임대 계약과 원소속 재계약은 별도로 처리합니다':c?.medicalReplacement?'의료 대체 계약의 일별 종료는 별도 조건입니다':'현재 수동 계약 권한이 없습니다'};
    let option=null;
    if(clubContractAllowed(db,db.teams[tid])&&c?.option?.type==='team'){
      const exclusive=read.world.phase==='offseason'&&read.world.contractWindow?.stage==='exclusive';
      if(exclusive||tid===managedTeamId(db)){
        const kind=exclusive?'window-option':'option',copy=JSON.parse(JSON.stringify(read)),before=JSON.stringify(copy.players[p.id].contract),result=clubContractAction(copy,p.id,kind);
        option={kind,msg:result.msg,ok:JSON.stringify(copy.players[p.id].contract)!==before,after:copy.players[p.id].contract,payroll:payroll(copy,copy.teams[tid]),cash:copy.teams[tid].finance.cash};
      }
    }
    return {id:p.id,name:p.name,role:ROLE_KO[p.role],contract:c,loan:!!p.loan,promise:contractRolePromiseStatus(read,p),agreement,nid:n?.id,renew:{...renew,msg:renew.ok?(n?'현재 진행 중인 재계약을 확인할 수 있습니다':'현재 재계약 시작 가능 · 선수 수락은 별도입니다'):renew.msg},option};
  });return {t,date:read.worldDate,year:read.year,window:read.world.contractWindow,payroll:payroll(read,t),rows};
}
function renderClubContractBriefing(){
  const ctx=clubBriefContext();if(!ctx)return '';
  return `<h4>선수 계약 · 옵션 · 역할 약속</h4><p class="hint">계약 보유와 공식 등록·의료 가용·경기 선발은 별개입니다. 합의 전 제안은 확정 의무가 아닙니다.</p><div class="controls">${ctx.teams.map(tid=>`<button data-brief-contract="${esc(tid)}">${esc(DB.teams[tid].name)} · 계약 확인</button>`).join('')}</div>`;
}
function clubContractRow(p){
  const c=p.contract,r=p.promise,o=c?.option,a=p.agreement;
  return `<div class="cfgcard compact"><h4>${esc(p.name)} · ${esc(p.role||'역할 미상')}</h4>${c?`<p>현재 연봉 ${money(c.salary)} · 계약 ${esc(String(c.signed??'기록 없음'))}~${esc(String(c.until))}년</p><p>${esc(contractTermsText({...c,years:Number.isFinite(c.years)?c.years:'기간 기록 없음'}))}</p>${c.medicalReplacement?`<p>의료 대체 · 보장 ${esc(c.medicalReplacement.guaranteedThrough||'기록 없음')} · 조건 종료 ${esc(c.medicalReplacement.expiresOn||'기록 없음')}. 연간 계약 종료와 별개입니다.</p>`:''}`:'<p>저장된 계약이 없습니다.</p>'}
    ${o?`<p>${o.type==='team'?'팀':'선수'} 옵션 · ${esc(String(o.year))}년 · 연봉 ${money(o.salary)}. ${o.type==='player'?'선수 측 결정이며 구단 수동 행사 대상이 아닙니다.':'행사 전에는 확정된 계약 연장이 아닙니다.'}</p>`:''}
    ${r?`<p>계약·임대 역할 기대 ${esc(SQUAD_ROLE_KO[r.role]||'기록 없음')} · 기준 ${esc(r.start||'날짜 기록 없음')} · 실제 ${r.games}/${r.teamGames}경기${r.teamGames?' · '+Math.round(r.actual*100)+'%':' · 표본 없음'} · 기존 기대 ${Math.round(r.expected*100)}%</p><p class="hint">현재 시즌의 기존 사용량 소비자 기준이며 의료상 불가 경기는 분모에서 제외합니다. 경기별 선발 의무·미래 출전 보장이 아닙니다.</p>`:'<p class="hint">현재 유효한 계약 역할 약속 집계가 없습니다. 없는 표본은 0% 평가로 만들지 않습니다.</p>'}
    ${a?`<p>저장된 다음 계약 · ${esc(({agreed:'합의·적용 대기',effective:'적용 완료',void:'무효'})[a.status]||'상태 기록 미상')} · 합의 ${esc(a.agreedDate||'기록 없음')} · 적용 ${esc(a.effectiveDate||'기록 없음')}. 현재 계약과 구분합니다.</p><p>${a.terms?esc(contractTermsText(a.terms)):'합의 조건 기록 없음'}</p>`:''}
    <p class="hint">계약금은 이미 지급된 조건일 수 있으며 보너스는 조건부입니다. 미래 현금·성과를 보장하지 않습니다.</p><p>${esc(p.renew.msg)}</p>${p.renew.ok?`<button data-start-renew="${esc(p.id)}">${p.nid?'진행 중 재계약 확인':'재계약 협상 시작'}</button>`:''}${p.option?.ok?`<p>행사 시 계약 ${p.option.after.until}년까지 · 연봉 ${money(p.option.after.salary)} · 구단 연간 분담 연봉 ${money(p.option.payroll)} · 현재 현금 ${money(p.option.cash)}</p><button data-exercise-${p.option.kind==='window-option'?'window-option':'option'}="${esc(p.id)}">팀 옵션 행사</button>`:p.option?`<p>${esc(p.option.msg)}</p>`:''}</div>`;
}
function openClubContracts(tid){
  const m=clubContractModel(DB,tid);if(!m||UI_OVERLAY)return false;
  const root=document.querySelector('#overlay');let dialog=null;
  const close=()=>{if(UI_OVERLAY===dialog)closeUiOverlay()};
  openUiOverlay({kind:'club-contracts',label:'내 구단 선수 계약',dismissible:true,onDismiss:close,focusSelector:'#brief-contract-close',html:`<div class="ovin"><div class="ovhead"><b>${esc(m.t.name)} · 선수 계약</b><button id="brief-contract-close" class="ghost">브리핑으로 돌아가기</button></div><p class="hint">기준일 ${esc(m.date||'날짜 미정')} · ${m.year}년. 현재 저장 계약과 기존 규칙에 따른 가능 조건입니다. 수락·출전·미래 비용을 예측하지 않습니다.</p><p>현재 구단 연간 분담 연봉 ${money(m.payroll)} · 임대 분담 포함, 의료 대체 연봉 제외 · 즉시 지급액이 아닙니다.</p>${m.window?`<p>저장된 계약 창구 · 독점 종료 ${esc(m.window.exclusiveThrough||'기록 없음')} · 다음 계약 적용 ${esc(m.window.effectiveDate||'기록 없음')}. 개별 협상 만료일이 아닙니다.</p>`:''}<div class="cfgs">${m.rows.map(clubContractRow).join('')}</div></div>`});
  dialog=UI_OVERLAY;root.querySelector('#brief-contract-close').onclick=close;
  bindContractEntryControls((msg,r)=>{clubBriefState().message=String(msg||'처리 결과 없음');closeUiOverlay({restoreFocus:false});saveDB();navKeepScroll();
    [...document.querySelectorAll('[data-brief-contract]')].find(b=>b.dataset.briefContract===tid)?.focus?.({preventScroll:true});
    if(r?.ok&&r.neg)openClubBriefNegotiation(r.neg.id,tid);
  },()=>UI_OVERLAY===dialog,root);return true;
}
function bindClubContractBriefing(){
  const ctx=clubBriefContext();if(!ctx)return;const db=DB,w=ctx.w,slot=SLOT,render=UI_RENDER_ID,date=db.worldDate,phase=w.phase;
  document.querySelectorAll('[data-brief-contract]').forEach(b=>b.onclick=()=>{if(clubBriefCurrent(db,w,slot,render,ctx.t.id)&&db.worldDate===date&&w.phase===phase&&!UI_OVERLAY)openClubContracts(b.dataset.briefContract)});
}
