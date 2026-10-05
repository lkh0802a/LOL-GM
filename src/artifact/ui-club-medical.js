// Owned medical presentation and the existing per-player manual plan writer.
function clubMedicalStamp(db,t){
  return JSON.stringify({date:db.worldDate,year:db.year,phase:db.world?.phase,manage:db.world?.manage,
    pending:db.world?.pendingOfficial,active:t.active,roster:t.roster,training:t.training,
    players:(t.roster||[]).map(id=>db.players[id])});
}
function medicalUiAllowed(db,t){return !!db.world&&!db.world.fired&&db.world.manage==='manual'&&
  !['pick','initial_roster'].includes(db.world.phase)&&t?.active!==false&&managerControlsSquad(db,t)&&!db.world.pendingOfficial?.queue?.length}
function medicalUiGuard(t,allowed=()=>true){
  const db=DB,w=db.world,slot=SLOT,render=UI_RENDER_ID,view=VIEW,manager=managedTeamId(db),managerRef=db.manager,dialog=UI_OVERLAY,stamp=clubMedicalStamp(db,t);
  return ()=>DB===db&&DB.world===w&&SLOT===slot&&!SLOT_SWITCHING&&UI_RENDER_ID===render&&VIEW===view&&
    UI_OVERLAY===dialog&&managedTeamId(db)===manager&&db.manager===managerRef&&DB.teams[t.id]===t&&medicalUiAllowed(db,t)&&clubMedicalStamp(db,t)===stamp&&allowed();
}
function writeMedicalUiPlan(p,mode){
  if(!Object.hasOwn(MEDICAL_PLAN_LABELS,mode))return false;
  // The existing roster writer: no medical tick, selection or history rewrite.
  p.medicalPlan=mode;return true;
}
function bindMedicalPlanControls(root=document,allowed=()=>true,after=()=>{saveDB();navKeepScroll()}){
  root.querySelectorAll('[data-medical-plan]').forEach(el=>{
    const p=DB.players[el.dataset.medicalPlan],t=p&&DB.teams[p.team];
    const current=t&&medicalUiAllowed(DB,t)?medicalUiGuard(t,allowed):()=>false;
    el.onchange=()=>{if(!current()||DB.players[p.id]!==p||p.retired||!t.roster.includes(p.id)||!Object.hasOwn(MEDICAL_PLAN_LABELS,el.value)||(p.medicalPlan||'auto')===el.value)return;
      writeMedicalUiPlan(p,el.value);after();};
  });
}
function clubMedicalHistory(p){
  const labels={medical_start:'의료 관리 시작',medical_return:'치료 후 복귀',medical_scar:'중증 부상 후유증',medical_callup:'의료 대체 조직 이동',medical_emergency_fa:'의료 대체 계약',medical_replacement_end:'의료 대체 계약 종료'},events=(p.careerEvents||[]).filter(e=>Object.hasOwn(labels,e.type));
  return `<details><summary>저장된 의료 이력 ${events.length}건</summary><p class="hint">최근 저장 순서 최대 8건입니다. 당시 기록이며 현재 진단·복귀 예정·수동 대체 영입 권한을 뜻하지 않습니다.</p>${events.length?`<ul>${events.slice(-8).reverse().map(e=>`<li>${esc(e.date||((e.year?'연도 '+e.year+' · ':'')+'날짜 기록 없음'))} · ${labels[e.type]}${e.type==='medical_start'?' · '+esc(MEDICAL_LABELS[e.site]||MEDICAL_LABELS[e.kind]||'건강 문제')+(Number.isFinite(e.days)?' · 당시 예상 '+e.days+'일':' · 당시 기간 기록 없음')+' · '+(e.out===true?'당시 결장':e.out===false?'당시 제한 출전':'당시 가용 기록 없음'):''}</li>`).join('')}</ul>`:'<p>저장된 의료 이력이 없습니다.</p>'}</details>`;
}
function clubMedicalModel(db=DB,tid=managedTeamId(db)){
  const ctx=clubBriefContext(db);if(!ctx||!ctx.teams.includes(tid)||!managerControlsSquad(db,db.teams[tid]))return null;
  const read=JSON.parse(JSON.stringify(db)),t=read.teams[tid];
  return {t,date:read.worldDate,canAct:medicalUiAllowed(db,db.teams[tid]),rows:(t.roster||[]).map(id=>read.players[id]).filter(p=>p&&!p.retired&&p.team===tid).map(p=>({id:p.id,name:p.name,role:ROLE_KO[p.role]||'역할 기록 없음',summary:medicalSummary(p),out:medicalOut(p),selected:p.medicalPlan||'auto',effective:medicalPlanFor(read,p),rest:medicalScrimRest(read,p),condition:p.condition,fatigue:p.fatigue,day:p.medicalPlanDate||null,dayPlan:p.medicalDayPlan||null,history:clubMedicalHistory(p)}))};
}
function renderClubMedicalBriefing(){
  const ctx=clubBriefContext();if(!ctx)return '';
  return `<h4>의료 가용 · 회복 계획</h4><p class="hint">고용·공식 등록·저장 선발과 현재 의료 가용은 별개입니다. 예상 관리 일수는 복귀 보장이 아닙니다.</p><div class="controls">${ctx.teams.map(tid=>{const m=clubMedicalModel(DB,tid);return m?`<button data-brief-medical="${esc(tid)}">${esc(m.t.name)} · 의료·회복 ${m.rows.filter(p=>p.out).length}명 출전 불가</button>`:''}).join('')}</div>`;
}
function openClubMedical(tid){
  const m=clubMedicalModel(DB,tid);if(!m||UI_OVERLAY)return false;
  const t=DB.teams[tid],root=document.querySelector('#overlay');let dialog=null,current=null;
  const close=()=>{if(UI_OVERLAY===dialog)closeUiOverlay()};
  openUiOverlay({kind:'club-medical',label:'내 구단 의료·회복 계획',dismissible:true,onDismiss:close,focusSelector:'#brief-medical-close',html:`<div class="ovin"><div class="ovhead"><b>${esc(m.t.name)} · 의료·회복</b><button id="brief-medical-close" class="ghost">브리핑으로 돌아가기</button></div><p class="hint">기준일 ${esc(m.date||'날짜 미정')}. 휴식·재활은 일일 훈련·스크림에서 제외되지만 그 자체가 공식 출전 금지는 아닙니다. 공식 출전에는 의료 상태 외 등록·명단 조건도 적용됩니다. 자동 계획은 기존 일일 판단을 따릅니다. 변경은 적용 버튼을 눌러야 저장됩니다.</p>${!m.canAct?'<p class="hint">현재는 수동 계획을 변경할 수 없습니다.</p>':''}<div class="cfgs">${m.rows.map(p=>`<div class="cfgcard compact"><h4>${esc(p.name)} · ${esc(p.role)}</h4><p>${esc(p.summary)} · 현재 의료상 ${p.out?'출전 불가':'출전 불가 아님'}</p><p>컨디션 ${Number.isFinite(p.condition)?Math.round(p.condition):'기록 없음'} · 피로 ${Number.isFinite(p.fatigue)?Math.round(p.fatigue):'기록 없음'}</p><p>저장 계획 ${esc(MEDICAL_PLAN_LABELS[p.selected]||'기록 미상')}</p><p>현재 적용 계획 ${esc(MEDICAL_PLAN_LABELS[p.effective]||'기록 미상')} · 훈련·스크림 ${p.out||p.rest?'의료 조건으로 제외':'의료 조건 충족, 다른 조건 별도'}</p><p class="hint">마지막 일일 계획 ${esc(p.day||'기록 없음')} · ${esc(MEDICAL_PLAN_LABELS[p.dayPlan]||'기록 없음')}. 미래 상태를 예측하지 않습니다.</p>${p.history}${m.canAct?`<label>회복 계획 <select data-medical-draft="${esc(p.id)}" aria-label="${esc(p.name)} 회복 계획">${Object.entries(MEDICAL_PLAN_LABELS).map(([mode,label])=>`<option value="${mode}"${mode===p.selected?' selected':''}>${esc(label)}</option>`).join('')}</select></label><button data-medical-apply="${esc(p.id)}">계획 적용</button>`:`<p>저장 계획 ${esc(MEDICAL_PLAN_LABELS[p.selected]||'기록 미상')}</p>`}</div>`).join('')}</div></div>`});
  dialog=UI_OVERLAY;current=medicalUiGuard(t,()=>UI_OVERLAY===dialog);root.querySelector('#brief-medical-close').onclick=close;
  root.querySelectorAll('[data-medical-apply]').forEach(b=>b.onclick=()=>{
    if(!current())return;const p=DB.players[b.dataset.medicalApply],el=root.querySelector(`[data-medical-draft="${b.dataset.medicalApply}"]`),mode=el?.value;
    if(!p||p.retired||p.team!==tid||!t.roster.includes(p.id)||!Object.hasOwn(MEDICAL_PLAN_LABELS,mode)||(p.medicalPlan||'auto')===mode)return;
    if(!confirm(`${p.name} · ${MEDICAL_PLAN_LABELS[mode]} 계획을 적용할까요?`)||!current())return;
    writeMedicalUiPlan(p,mode);clubBriefState().message=p.name+' · '+MEDICAL_PLAN_LABELS[mode]+' 계획 적용';
    closeUiOverlay({restoreFocus:false});saveDB();navKeepScroll();
    [...document.querySelectorAll('[data-brief-medical]')].find(x=>x.dataset.briefMedical===tid)?.focus?.({preventScroll:true});
  });return true;
}
function bindClubMedicalBriefing(){
  const ctx=clubBriefContext();if(!ctx)return;const db=DB,w=ctx.w,slot=SLOT,render=UI_RENDER_ID,date=db.worldDate,phase=w.phase;
  document.querySelectorAll('[data-brief-medical]').forEach(b=>b.onclick=()=>{if(clubBriefCurrent(db,w,slot,render,ctx.t.id)&&db.worldDate===date&&w.phase===phase&&!UI_OVERLAY)openClubMedical(b.dataset.briefMedical)});
}
