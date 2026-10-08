// Owned practice presentation; existing preparation and daily writers own rules.
function practiceUiAllowed(db,t){return !!db.world&&!db.world.fired&&db.world.manage==='manual'&&
  !['pick','initial_roster'].includes(db.world.phase)&&t?.active!==false&&managerControlsSquad(db,t)&&!db.world.pendingOfficial?.queue?.length}
function practiceUiStamp(db,t){const parent=parentTeamOf(db,t);return JSON.stringify({date:db.worldDate,year:db.year,
  phase:db.world?.phase,manage:db.world?.manage,pending:db.world?.pendingOfficial,
  preparation:squadPreparationSnapshot(db,{parentId:parent.id}),teams:organizationTeams(db,parent),
  players:organizationRoster(db,parent).map(id=>db.players[id]),seasons:db.world?.seasons});}
function practiceUiGuard(t,allowed=()=>true){
  const db=DB,w=db.world,slot=SLOT,manager=db.manager,render=UI_RENDER_ID,view=VIEW,dialog=UI_OVERLAY,stamp=practiceUiStamp(db,t);
  return ()=>DB===db&&db.world===w&&SLOT===slot&&!SLOT_SWITCHING&&db.manager===manager&&
    UI_RENDER_ID===render&&VIEW===view&&UI_OVERLAY===dialog&&db.teams[t.id]===t&&practiceUiAllowed(db,t)&&practiceUiStamp(db,t)===stamp&&allowed();
}
function bindSquadPracticeControls(root=document){
  const t=DB.teams[SQUAD],current=t&&practiceUiAllowed(DB,t)?practiceUiGuard(t,()=>SQUAD===t.id):()=>false;
  const focus=root.querySelector('#practicefocus'),intensity=root.querySelector('#trint');
  if(focus)focus.onchange=()=>{if(!current()||!Object.hasOwn(PRACTICE_FOCUS,focus.value))return;const d=squadEditState(t);d.training.focus=focus.value;d.dirty=true};
  if(intensity)intensity.onchange=()=>{if(!current()||!['light','normal','high'].includes(intensity.value))return;const d=squadEditState(t);d.training.intensity=intensity.value;d.dirty=true};
  root.querySelectorAll('[data-tr]').forEach(el=>el.oninput=()=>{if(!current())return;const d=squadEditState(t),k=el.dataset.tr;d.training=setTrainingAllocation(d.training,k,el.value);el.value=d.training[k];d.dirty=true;el.previousElementSibling?.querySelector('output')&&(el.previousElementSibling.querySelector('output').textContent=el.value);const left=root.querySelector('#trleft');if(left)left.textContent=`남은 포인트 ${TRAIN_POINTS-Object.keys(ATTR_GROUPS).reduce((n,g)=>n+d.training[g],0)} / ${TRAIN_POINTS}`;});
  const apply=root.querySelector('#sqapply'),discard=root.querySelector('#sqdiscard');
  if(apply)apply.onclick=()=>{if(current())applySquadEdit()};
  if(discard)discard.onclick=()=>{if(current())discardSquadEdit()};
  const reset=root.querySelector('#sqreviewreset');
  if(reset)reset.onclick=()=>{if(!current())return;if(confirm('관리 구단의 모든 미적용 초안을 취소하고 현재 상태에서 다시 편집할까요?')&&current())discardSquadEdit()};
}
function clubPracticeModel(db=DB,tid=managedTeamId(db)){
  const ctx=clubBriefContext(db);if(!ctx||!ctx.teams.includes(tid)||!managerControlsSquad(db,db.teams[tid]))return null;
  const read=JSON.parse(JSON.stringify(db)),t=read.teams[tid],parent=parentTeamOf(read,t),day=practiceDay(read,t),booked=officialBookedTeams(read).has(tid),training=normalizeTraining(t.training);
  const command={type:'squad.preparation',actor:'manager',parentId:parent.id,expected:squadPreparationSnapshot(read,{parentId:parent.id}),assignments:rosterPlanState(read,parent).assignments,roles:{},squads:{[tid]:{starters:{...(t.depthChart||{})},tactics:{...t.tactics},training}}};
  return {t,training,day,booked,date:read.worldDate,canAct:practiceUiAllowed(db,db.teams[tid]),command,
    rows:t.roster.map(id=>read.players[id]).filter(p=>p&&!p.retired&&p.team===tid).map(p=>({id:p.id,name:p.name,out:medicalOut(p),plan:medicalPlanFor(read,p),day:p.practiceDay?.date===read.worldDate?p.practiceDay:null,usage:p.practiceUsage?.year===read.year?p.practiceUsage:null,multiplier:trainingTimeMultiplier(t,read.year,p)})),usage:t.practiceUsage?.year===read.year?t.practiceUsage:null};
}
function renderClubPracticeBriefing(){const ctx=clubBriefContext();if(!ctx)return '';return `<h4>훈련 · 오늘의 연습 자원</h4><p class="hint">능력 배분과 하루 시간은 별개입니다. 내 구단의 실제 설정·소비만 확인합니다.</p><div class="controls">${ctx.teams.map(tid=>`<button data-brief-practice="${esc(tid)}">${esc(DB.teams[tid].name)} · 훈련·연습 확인</button>`).join('')}</div>`;}
function openClubPractice(tid){
  const m=clubPracticeModel(DB,tid);if(!m||UI_OVERLAY)return false;
  const root=document.querySelector('#overlay'),t=DB.teams[tid],draft={...m.training};let dialog=null,current=null;
  const close=()=>{if(UI_OVERLAY===dialog)closeUiOverlay()};
  const number=n=>Number.isFinite(n)?String(Math.round(n*100)/100):'기록 없음';
  openUiOverlay({kind:'club-practice',label:'내 구단 훈련·연습',dismissible:true,onDismiss:close,focusSelector:'#brief-practice-close',html:`<div class="ovin"><div class="ovhead"><b>${esc(m.t.name)} · 훈련·연습</b><button id="brief-practice-close" class="ghost">브리핑으로 돌아가기</button></div><p>기준일 ${esc(m.date||'날짜 미정')} · ${m.booked?'공식 경기일 · 일일 훈련 시간 0점':'공식 경기일 아님'}</p><p>하루 연습 자원 ${PRACTICE_POINTS}점 · 스크림 소비 ${number(m.day.scrim)}점 · 일일 훈련 소비 ${number(m.day.drills)}점 · 잔여 ${number(m.day.remaining)}점 · ${m.day.completed?'일일 처리 완료':'일일 처리 전'}</p><p>오늘 저장된 처리 중점 ${esc(PRACTICE_FOCUS_KO[m.day.focus]||'기록 없음')}</p><p>현재 연도 팀 누적 · 기록된 ${number(m.usage?.days)}일 · 개인 기량 ${number(m.usage?.individual)}점 · 챔피언 ${number(m.usage?.champions)}점 · 전술 ${number(m.usage?.tactics)}점 · 호흡 ${number(m.usage?.teamwork)}점 · 스크림 ${number(m.usage?.scrim)}점</p><p class="hint">팀 누적은 모든 선수의 개인 참여 일수와 같지 않습니다. 오늘 처리 중점과 현재 변경 초안을 구분하며, 처리 완료 후 설정을 바꿔도 이미 소비한 시간을 다시 배분하지 않습니다.</p><p class="hint">스크림 1세트는 기존 ${SCRIM_PRACTICE_COST}점을 사용합니다. 일일 처리에서 남은 시간을 중점별로 나누며, 공식 경기일에는 훈련으로 쓰지 않습니다. 잔여 자원이 스크림 수락·가용 보장은 아닙니다. 이미 처리한 훈련을 다시 실행하지 않습니다. 로스터 화면의 다른 임시 변경을 함께 적용하지 않습니다.</p><h4>현재 설정 · 변경 초안</h4><p class="hint">아래 ${TRAIN_POINTS}점은 개인 능력 영역의 배분입니다. 하루 시간에 더해지는 자원이 아닙니다. 현재 적용된 설정은 저장된 구단 설정이며, 변경은 확인 뒤 적용합니다. 성장량·미래 의료 상태를 보장하지 않습니다.</p><label>훈련 강도<select id="brief-practice-intensity"${m.canAct?'':' disabled'}>${Object.entries({light:'가볍게 · 회복 우선',normal:'보통 · 균형',high:'강하게 · 성장 우선'}).map(([k,v])=>`<option value="${k}"${draft.intensity===k?' selected':''}>${v}</option>`).join('')}</select></label><label>연습 중점<select id="brief-practice-focus"${m.canAct?'':' disabled'}>${Object.entries(PRACTICE_FOCUS_KO).map(([k,v])=>`<option value="${k}"${(draft.focus||'balanced')===k?' selected':''}>${v}</option>`).join('')}</select></label><div class="tac training-grid">${Object.keys(ATTR_GROUPS).map(k=>`<label><span>${GROUP_KO[k]}<output>${draft[k]}</output></span><input type="range" min="0" max="${TRAIN_POINTS}" value="${draft[k]}" data-practice-allocation="${k}" aria-label="${GROUP_KO[k]} 훈련 배분"${m.canAct?'':' disabled'}></label>`).join('')}</div><p id="brief-practice-left">남은 배분 ${TRAIN_POINTS-Object.keys(ATTR_GROUPS).reduce((n,k)=>n+draft[k],0)}점</p>${m.canAct?'<button id="brief-practice-apply">이 구단 훈련 설정 적용</button>':'<p>현재 수동 변경 권한이 없습니다.</p>'}<p role="status" id="brief-practice-message"></p><h4>내 선수의 현재 의료 조건 · 실제 소비</h4><div class="cfgs">${m.rows.map(p=>`<div class="cfgcard compact"><b>${esc(p.name)}</b><p>${p.out?'의료 출전 불가':['rest','rehab'].includes(p.plan)?'휴식·재활로 훈련 제외':'현재 의료 조건상 훈련 제외 아님'} · ${esc(MEDICAL_PLAN_LABELS[p.plan]||'계획 미상')}</p><p>오늘 개인 훈련 ${number(p.day?.individual)}점 · 전향 ${number(p.day?.conversion)}점 · 챔피언 ${number(p.day?.champions)}점 · 전술 ${number(p.day?.tactics)}점 · 호흡 ${number(p.day?.teamwork)}점</p><p class="hint">현재 연도 개인 누적 ${number(p.usage?.individual)}점 / 기록된 ${number(p.usage?.days)}일. 기존 성장 시간 배율 ${number(p.multiplier)}배 · 소수 둘째 자리 표시${p.usage?.days?'':' · 개인 표본 없음; 기존 팀/구형 저장 fallback 포함'}. 실제 성장에는 연령·잠재력·출전·코칭·시설·배분 등 다른 조건도 적용됩니다.</p></div>`).join('')}</div></div>`});
  dialog=UI_OVERLAY;current=practiceUiGuard(t);root.querySelector('#brief-practice-close').onclick=close;
  root.querySelectorAll('[data-practice-allocation]').forEach(el=>el.oninput=()=>{if(!current())return;Object.assign(draft,setTrainingAllocation(draft,el.dataset.practiceAllocation,el.value));el.value=draft[el.dataset.practiceAllocation];el.previousElementSibling?.querySelector('output')&&(el.previousElementSibling.querySelector('output').textContent=el.value);root.querySelector('#brief-practice-left').textContent='남은 배분 '+(TRAIN_POINTS-Object.keys(ATTR_GROUPS).reduce((n,k)=>n+draft[k],0))+'점';});
  const apply=root.querySelector('#brief-practice-apply');if(apply)apply.onclick=()=>{
    if(!current())return;draft.intensity=root.querySelector('#brief-practice-intensity').value;draft.focus=root.querySelector('#brief-practice-focus').value;
    const command=JSON.parse(JSON.stringify(m.command));command.squads[tid].training={...draft};
    const preview=previewWorldAction(JSON.parse(JSON.stringify(DB)),command),message=root.querySelector('#brief-practice-message');
    if(!preview.ok){message.textContent=preview.errors.join(' · ');return}
    if(JSON.stringify(normalizeTraining(t.training))===JSON.stringify(normalizeTraining(draft)))return;
    if(!confirm(t.name+'의 훈련 설정을 적용할까요?')||!current())return;
    const result=commitWorldAction(DB,command);if(!result.ok){message.textContent=result.errors.join(' · ');return}
    clubBriefState().message=t.name+' · 훈련 설정 적용';closeUiOverlay({restoreFocus:false});saveDB();navKeepScroll();
    [...document.querySelectorAll('[data-brief-practice]')].find(b=>b.dataset.briefPractice===tid)?.focus?.({preventScroll:true});
  };return true;
}
function bindClubPracticeBriefing(){const ctx=clubBriefContext();if(!ctx)return;const db=DB,w=ctx.w,slot=SLOT,render=UI_RENDER_ID,manager=db.manager,date=db.worldDate,phase=w.phase;document.querySelectorAll('[data-brief-practice]').forEach(b=>b.onclick=()=>{if(clubBriefCurrent(db,w,slot,render,ctx.t.id)&&db.manager===manager&&db.worldDate===date&&w.phase===phase&&!UI_OVERLAY)openClubPractice(b.dataset.briefPractice)});}
