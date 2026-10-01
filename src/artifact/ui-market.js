// ===== LOL GM: recruitment market views / control dispatch =====
// ---------- 이적 시장 (직접 운영) ----------
function recruitStageLabel(e){return !e?'미등록':e.stage==='interest'?'관심':e.stage==='observed'?'관찰 완료':e.stage==='evaluated'?'내부 평가 완료':e.stage==='negotiating'?'협상 중':e.stage==='closed'?(e.result==='signed'?'영입 완료':e.result==='lost_to_rival'?'경쟁 구단 선택':'종료'):e.stage}
function recruitButtons(p,e){
  if(p.team===managedTeamId(DB))return '';
  if(!e)return `<button class="ghost sm2" data-interest="${p.id}">관심 등록</button><button class="ghost sm2" data-scout="${p.id}">스카우팅</button>`;
  const evalBtn=['interest','observed'].includes(e.stage)?`<button class="ghost sm2" data-evaluate="${p.id}"${knowledge(DB,p)<35?' disabled':''}>내부 평가</button>`:'';
  return `<select data-priority="${p.id}" aria-label="영입 우선순위">${RECRUIT_PRIORITY.map(x=>`<option value="${x}"${e.priority===x?' selected':''}>${x}순위</option>`).join('')}</select><button class="ghost sm2" data-scout="${p.id}">스카우팅</button>${evalBtn}<button class="ghost sm2" data-drop="${p.id}">후보 해제</button>`;
}
function renderRecruitmentBoard(){
  const rows=recruitmentBoard(DB).filter(e=>DB.players[e.pid]&&!DB.players[e.pid].retired),rank={A:0,B:1,C:2};
  if(!rows.length)return '<p class="hint">아직 영입 후보가 없습니다. FA나 이적 대상에서 관심 등록 후 스카우팅과 내부 평가를 진행하세요.</p>';
  return rows.sort((a,b)=>(rank[a.priority]??9)-(rank[b.priority]??9)).map(e=>{const p=DB.players[e.pid],ev=e.evaluation,where=p.team?esc(tshort(p.team)):'FA';return `<div class="mrow"><span><b>${e.priority}</b> <span class="role">${ROLE_KO[p.role]}</span> <b>${esc(p.name)}</b> · ${where} · ${recruitStageLabel(e)} · 정보 ${knowledge(DB,p)}%${ev?` · 적합도 <b>${ev.fit}</b>/100 · 능력 ${ev.ability[0]}–${ev.ability[1]} · 잠재 ${ev.potential[0]}–${ev.potential[1]} · 예상 역할 ${SQUAD_ROLE_KO[ev.expectedRole]||ev.expectedRole} · 의료 가용성 위험 ${Math.round(medicalContractRisk(DB,p)*100)}%`:''}</span><span>${recruitButtons(p,e)}${e.stage==='evaluated'&&!p.team?`<button class="primary sm2" data-start-fa="${p.id}">공식 협상</button>`:''}</span></div>`}).join('');
}
function renderContractWindow(){
  const w=DB.world,cw=w?.contractWindow,t=DB.teams[managedTeamId(DB)];
  if(!cw||!t)return '';
  const exclusive=cw.stage==='exclusive',
    own=(t.roster||[]).map(id=>DB.players[id]).filter(p=>contractExpiresThisSeason(DB,p)),
    waived=exclusive?Object.values(cw.contactWaivers||{}).map(x=>DB.players[x.pid])
      .filter(p=>p&&!p.retired&&p.team&&p.team!==t.id&&!contractAgreementFor(DB,p.id)):[],
    fas=!exclusive?Object.values(DB.players).filter(p=>!p.retired&&!p.team)
      .sort((a,b)=>obsOvr(DB,b)-obsOvr(DB,a)).slice(0,25):[];
  const ownRows=own.map(p=>{
    const a=contractAgreementFor(DB,p.id),waiver=cw.contactWaivers?.[p.id],
      n=negotiationStore(DB)[negotiationId(DB,p.id,'renewal')],
      o=p.contract?.option,option=o&&o.year===cw.startSeason?o:null;
    let action;
    if(a?.status==='agreed')action=`<small class="hi">재계약 합의 · ${a.effectiveDate} 새 계약 시작</small>`;
    else if(waiver)action='<small class="hint">타 구단 조기 접촉 허용됨 · 재계약 독점권 포기</small>';
    else if(option?.type==='team')action=`<button class="ghost sm2" data-exercise-window-option="${p.id}">팀 옵션 행사</button>`;
    else if(option?.type==='player')action='<small class="hint">선수 옵션은 독점기간 종료 때 선수 측 결정</small>';
    else if(n?.status==='open')action='<small class="hi">협상 중</small>';
    else action=`<button class="primary sm2" data-start-renew="${p.id}">재계약 협상</button><button class="ghost sm2" data-allow-contact="${p.id}">재계약 안 함 · 타 구단 접촉 허용</button>`;
    return `<div class="mrow"><span><span class="role">${ROLE_KO[p.role]}</span> <b>${esc(p.name)}</b> · 현재 ${money(p.contract.salary)} · ${cw.contractExpiryDate} 계약 종료${option?` · ${option.type==='team'?'팀':'선수'} 옵션 ${money(option.salary)}`:''}</span><span>${action}</span></div>`;
  }).join('');
  const earlyRows=waived.map(p=>{
    const e=recruitmentTarget(DB,p.id),a=contractAgreementFor(DB,p.id),
      n=negotiationStore(DB)[negotiationId(DB,p.id,'early_fa',t.id)];
    return `<div class="mrow"><span><span class="role">${ROLE_KO[p.role]}</span> <b>${esc(p.name)}</b> · ${esc(tshort(p.team))} · ${p.age}세 · 종합 ${obsOvr(DB,p)}${knowledge(DB,p)<100?'?':''} · ${cw.contractExpiryDate}까지 현 계약 유지 · <small>${recruitStageLabel(e)}</small></span><span>${a?.status==='agreed'?'<small class="hint">다음 계약 합의 완료</small>':`${recruitButtons(p,e)}${e?.stage==='evaluated'&&!(n&&n.status==='open')?`<button class="primary sm2" data-start-early="${p.id}">조기 계약 협상</button>`:''}`}</span></div>`;
  }).join('');
  const faRows=fas.map(p=>{
    const e=recruitmentTarget(DB,p.id),n=negotiationStore(DB)[negotiationId(DB,p.id,'fa')];
    return `<div class="mrow"><span><span class="role">${ROLE_KO[p.role]}</span> <b>${esc(p.name)}</b> · ${p.age}세 · 종합 ${obsOvr(DB,p)}${knowledge(DB,p)<100?'?':''} · <small>${recruitStageLabel(e)}</small></span><span>${recruitButtons(p,e)}${e?.stage==='evaluated'&&!(n&&n.status==='open')?`<button class="primary sm2" data-start-fa="${p.id}">FA 협상</button>`:''}</span></div>`;
  }).join('');
  return `<section class="market contractwindow"><h3>월즈 종료 후 계약 협상 — ${esc(t.name)}</h3>
    <p class="hint">최종 경기 ${cw.seasonEndDate} · 원소속 독점 ${cw.startDate}~${cw.exclusiveThrough} · 기존 계약 만료 ${cw.contractExpiryDate} · FA 접촉 ${cw.outsideContactDate}부터</p>
    <p class="${exclusive?'warn':'hi'}">${exclusive?'기존 계약은 14일 유지됩니다. 원소속은 독점 재계약권을 갖지만 재계약 의사가 없으면 해당 선수의 타 구단 조기 접촉을 허용할 수 있습니다.':'독점기간과 기존 계약이 끝났습니다. 미재계약 선수는 FA이며 모든 구단이 협상할 수 있습니다.'}</p>
    <h4>진행 중인 협상</h4>${renderNegotiations()}
    ${exclusive?`<h4>우리 팀 만료 예정 계약</h4>${ownRows||'<p class="hint">이번 독점기간 만료 예정 선수가 없습니다.</p>'}<h4>타 구단이 조기 접촉을 허용한 선수</h4>${earlyRows||'<p class="hint">현재 조기 접촉 허용 선수가 없습니다.</p>'}`:
      `<h4>FA 시장</h4>${faRows||'<p class="hint">현재 협상 가능한 FA가 없습니다.</p>'}`}
  </section>`;
}
function bindContractWindow(){
  const act=m=>{MSG=m;saveDB();nav();const e=document.querySelector('.contractwindow');e&&e.scrollIntoView({block:'start'})};
  document.querySelectorAll('[data-start-renew]').forEach(b=>b.onclick=()=>act(startNegotiation(DB,b.dataset.startRenew,'renewal').msg));
  document.querySelectorAll('[data-allow-contact]').forEach(b=>b.onclick=()=>act(grantEarlyContact(DB,b.dataset.allowContact,'manager').msg));
  document.querySelectorAll('[data-exercise-window-option]').forEach(b=>b.onclick=()=>act(exerciseExclusiveTeamOption(DB,b.dataset.exerciseWindowOption).msg));
  document.querySelectorAll('[data-start-early]').forEach(b=>b.onclick=()=>act(startNegotiation(DB,b.dataset.startEarly,'early_fa',{teamId:managedTeamId(DB)}).msg));
  document.querySelectorAll('[data-start-fa]').forEach(b=>b.onclick=()=>act(startNegotiation(DB,b.dataset.startFa,'fa').msg));
  document.querySelectorAll('[data-interest]').forEach(b=>b.onclick=()=>act(mInterest(DB,b.dataset.interest,'B')));
  document.querySelectorAll('[data-priority]').forEach(el=>el.onchange=()=>act(mInterest(DB,el.dataset.priority,el.value)));
  document.querySelectorAll('[data-evaluate]').forEach(b=>b.onclick=()=>act(mEvaluateTarget(DB,b.dataset.evaluate)));
  document.querySelectorAll('[data-drop]').forEach(b=>b.onclick=()=>act(mDropInterest(DB,b.dataset.drop)));
  document.querySelectorAll('[data-scout]').forEach(b=>b.onclick=()=>act(scoutPlayers(DB,[b.dataset.scout],40,0.1*psOf(DB,DB.teams[managedTeamId(DB)].region))));
  bindNegotiationControls(act);
}

function renderMarket(){
  const w=DB.world,t=DB.teams[managedTeamId(DB)],R=DB.regions[t.region],pay=payroll(DB,t),budget=salaryBudget(DB,t);
  const exp=t.roster.map(id=>DB.players[id]).filter(p=>!p.contract||!p.contract.medicalReplacement&&p.contract.until<DB.year);
  const roster=t.roster.map(id=>DB.players[id]);
  const fas=Object.values(DB.players).filter(p=>!p.retired&&!p.team&&(MK.role==='ALL'||p.role===MK.role)&&(MK.scope==='all'||isLocalPlayer(p,t.region))).sort((a,b)=>obsOvr(DB,b)-obsOvr(DB,a)).slice(0,25);
  const tgts=activeTeams(DB,MK.scope==='all'?null:t.region,1).filter(o=>o.id!==t.id).flatMap(o=>o.roster.map(id=>DB.players[id])).filter(p=>p&&p.contract&&(MK.role==='ALL'||p.role===MK.role)).sort((a,b)=>obsOvr(DB,b)-obsOvr(DB,a)).slice(0,25);
  return `<section class="market"><h3>이적 시장 — ${esc(t.name)}</h3>
  <div class="fin"><div><span>보유 자금</span><b>${money(t.finance.cash)}</b></div><div><span>연봉 총액</span><b>${money(pay)}</b><small>${R.spendingRule==='sfr_top5'?`SFR 상위 5인 ${money(regulatedPayroll(DB,t))} / ${money(R.salaryCap)}`:'리그 하드캡 없음'}</small></div><div><span>영입 예산</span><b>${money(Math.max(0,budget-pay))}</b></div><div><span>로스터</span><b>${t.roster.length}/${5+(DB.worldConfig.subs||0)}</b></div></div>
  ${MSG?`<p class="msg" role="status">${esc(MSG)}</p>`:''}
  <h4>진행 중인 협상</h4>${renderNegotiations()}
  <h4>영입 후보 A/B/C</h4>${renderRecruitmentBoard()}
  ${exp.length?`<h4>계약 결정 — 헤드코치 직접 확정</h4>${exp.map(p=>{const n=negotiationStore(DB)[negotiationId(DB,p.id,'renewal')],o=p.contract?.option,opt=o&&o.year===DB.year?o:null;return `<div class="mrow"><span><span class="role">${ROLE_KO[p.role]}</span> <b>${esc(p.name)}</b> ${p.age}세 · 종합 ${playerOvr(p)} · ${p.contract?`현재 ${money(p.contract.salary)} · 시장 요구 약 ${money(asking(DB,p,t.region))}`:'무계약 상태 · 정식 계약 필요'}${opt?` · ${opt.type==='team'?'팀':'선수'} 옵션 ${money(opt.salary)}`:''}</span><span>${opt?.type==='team'?`<button class="ghost sm2" data-exercise-option="${p.id}">팀 옵션 행사</button>`:opt?.type==='player'?'<small class="hint">선수 측 옵션 결정</small>':''}${n&&n.status==='open'?'<small class="hi">협상 중</small>':`<button class="primary sm2" data-start-renew="${p.id}">재계약 협상</button>`}</span></div>`}).join('')}`:''}
  <h4>현재 로스터</h4>${roster.map(p=>`<div class="mrow"><span><span class="role">${ROLE_KO[p.role]}</span> <b>${esc(p.name)}</b> ${p.age}세 · 종합 ${playerOvr(p)} · ${p.contract?.medicalReplacement?'의료 대체 · 연 환산 '+money(p.contract.salary)+' · 보장 '+p.contract.medicalReplacement.guaranteedThrough+' · 조건 종료 '+p.contract.medicalReplacement.expiresOn:p.contract?money(p.contract.salary)+' ~'+p.contract.until:''}${starterFor(DB,t,p.role)===p?'':' <small class="hint">후보</small>'}</span><button class="ghost sm2" data-release="${p.id}">방출</button></div>`).join('')}
  ${sponsorBlock(t)}
  <div class="controls" style="margin-top:12px"><div class="seg"><button data-mk="fa" aria-pressed="${MK.tab==='fa'}">FA</button><button data-mk="tr" aria-pressed="${MK.tab==='tr'}">이적 대상</button><button data-mk="coach" aria-pressed="${MK.tab==='coach'}">스태프</button></div>
    <label>포지션<select id="mkrole"><option value="ALL">전체</option>${ROLES.map(r=>`<option value="${r}"${MK.role===r?' selected':''}>${ROLE_KO[r]}</option>`).join('')}</select></label>
    <label>범위<select id="mkscope"><option value="region"${MK.scope==='region'?' selected':''}>내 지역</option><option value="all"${MK.scope==='all'?' selected':''}>전 세계 (비로컬 등록 제한 적용)</option></select></label></div>
  ${MK.tab==='coach'?coachBlock(t):MK.tab==='fa'?fas.map(p=>{const e=recruitmentTarget(DB,p.id),n=negotiationStore(DB)[negotiationId(DB,p.id,'fa')],ask=asking(DB,p,t.region);return `<div class="mrow"><span><span class="role">${ROLE_KO[p.role]}</span> <b>${esc(p.name)}</b> ${p.age}세 · 종합 ${obsOvr(DB,p)}${knowledge(DB,p)<100?'?':''} · 잠재 ${potText(p)} · 요구 약 ${money(ask)}${!isLocalPlayer(p,t.region)?` <small>비로컬 · ${esc((DB.regions[playerOriginRegion(p)]||{name:playerOriginRegion(p)||''}).name)}</small>`:''} · <small>${recruitStageLabel(e)}</small></span><span>${recruitButtons(p,e)}${e?.stage==='evaluated'&&!(n&&n.status==='open')?`<button class="primary sm2" data-start-fa="${p.id}">공식 협상</button>`:''}</span></div>`}).join('')||'<p class="hint">조건에 맞는 FA가 없습니다.</p>'
  :tgts.map(p=>{const e=recruitmentTarget(DB,p.id),fee=transferFee(DB,p),n=negotiationStore(DB)[negotiationId(DB,p.id,'transfer')];return `<div class="mrow"><span><span class="role">${ROLE_KO[p.role]}</span> <b>${esc(p.name)}</b> ${esc(tshort(p.team))} · ${p.age}세 · 종합 ${obsOvr(DB,p)}${knowledge(DB,p)<100?'?':''} · 연봉 ${money(p.contract.salary)} ~${p.contract.until} · 시장 이적가 추정 ${money(fee)} · <small>${recruitStageLabel(e)}</small></span><span>${recruitButtons(p,e)}${e?.stage==='evaluated'&&!(n&&n.status==='open')?`<input type="number" step="0.5" min="0" value="${fee}" data-fee="${p.id}" aria-label="이적료">억<button class="primary sm2" data-bid="${p.id}">구단 협상</button>`:''}</span></div>`}).join('')}
  <p class="hint">영입은 관심 등록 → 관찰/스카우팅 → 내부 평가 → 공식 제안 순서입니다. 재계약도 자동 확정되지 않으며 선수 측과 조건을 협상해야 합니다.</p></section>`;
}
function bindMarket(){
  const act=m=>{MSG=m;saveDB();nav();const e=document.querySelector('.market');e&&e.scrollIntoView({block:'start'})};
  bindClubOfficeControls(act);
  document.querySelectorAll('[data-exercise-option]').forEach(b=>b.onclick=()=>act(mExerciseTeamOption(DB,b.dataset.exerciseOption)));
  document.querySelectorAll('[data-start-renew]').forEach(b=>b.onclick=()=>act(startNegotiation(DB,b.dataset.startRenew,'renewal').msg));
  document.querySelectorAll('[data-release]').forEach(b=>b.onclick=()=>{const p=DB.players[b.dataset.release],cost=contractReleaseCost(DB,p);if(confirm(`${p.name} 선수를 방출할까요?\n해지금 ${money(cost)}${p.contract?` · 계약 ${p.contract.until}년까지`:''}\n방출 후 즉시 FA가 됩니다.`))act(mRelease(DB,b.dataset.release))});
  document.querySelectorAll('[data-interest]').forEach(b=>b.onclick=()=>act(mInterest(DB,b.dataset.interest,'B')));
  document.querySelectorAll('[data-priority]').forEach(el=>el.onchange=()=>act(mInterest(DB,el.dataset.priority,el.value)));
  document.querySelectorAll('[data-evaluate]').forEach(b=>b.onclick=()=>act(mEvaluateTarget(DB,b.dataset.evaluate)));
  document.querySelectorAll('[data-drop]').forEach(b=>b.onclick=()=>act(mDropInterest(DB,b.dataset.drop)));
  document.querySelectorAll('[data-start-fa]').forEach(b=>b.onclick=()=>act(startNegotiation(DB,b.dataset.startFa,'fa').msg));
  document.querySelectorAll('[data-bid]').forEach(b=>b.onclick=()=>{const id=b.dataset.bid;act(mTransfer(DB,id,+document.querySelector(`[data-fee="${id}"]`).value))});
  document.querySelectorAll('[data-scout]').forEach(b=>b.onclick=()=>act(scoutPlayers(DB,[b.dataset.scout],40,0.1*psOf(DB,DB.teams[managedTeamId(DB)].region))));
  bindNegotiationControls(act);
  document.querySelectorAll('[data-mk]').forEach(b=>b.onclick=()=>{MK.tab=b.dataset.mk;nav()});
  $('#mkrole').onchange=e=>{MK.role=e.target.value;nav()};$('#mkscope').onchange=e=>{MK.scope=e.target.value;nav()};
}
