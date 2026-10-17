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
// Legacy training-slider controls were retired; the squad page still owns
// staged lineup, tactics and role submissions.
function bindSquadPracticeControls(root=document){
  const t=DB.teams[SQUAD],current=t&&practiceUiAllowed(DB,t)?practiceUiGuard(t,()=>SQUAD===t.id):()=>false;
  const apply=root.querySelector('#sqapply'),discard=root.querySelector('#sqdiscard');
  if(apply)apply.onclick=()=>{if(current())applySquadEdit()};
  if(discard)discard.onclick=()=>{if(current())discardSquadEdit()};
  const reset=root.querySelector('#sqreviewreset');
  if(reset)reset.onclick=()=>{if(!current())return;if(confirm('관리 구단의 모든 미적용 초안을 취소하고 현재 상태에서 다시 편집할까요?')&&current())discardSquadEdit()};
}
function clubPracticeModel(db=DB,tid=managedTeamId(db)){
  const ctx=clubBriefContext(db);
  if(!ctx||!ctx.teams.includes(tid)||!managerControlsSquad(db,db.teams[tid]))return null;
  const read=JSON.parse(JSON.stringify(db)),t=read.teams[tid],day=practiceDay(read,t),
    booked=officialBookedTeams(read).has(tid),readiness=scrimReadiness(read,t);
  const rows=t.roster.map(id=>read.players[id]).filter(p=>p&&!p.retired&&p.team===tid)
    .map(p=>({id:p.id,name:p.name,out:medicalOut(p),plan:medicalPlanFor(read,p)}));
  const recent=(t.scrimLog||[]).slice(-5).reverse().map(x=>({
    date:x.date,opponent:read.teams[x.opponent]?.name||x.opponent,games:x.games||0
  }));
  return {t,date:read.worldDate,day,booked,readiness,rows,recent};
}
function renderClubPracticeBriefing(){
  const ctx=clubBriefContext();if(!ctx)return '';
  return `<h4>스크림 · 회복 현황</h4><p class="hint">실제 스크림 기록과 선수들의 회복 상태를 확인합니다. 수동 훈련 포인트와 강도 설정은 사용하지 않습니다.</p><div class="controls">${ctx.teams.map(tid=>`<button data-brief-practice="${esc(tid)}">${esc(DB.teams[tid].name)} · 스크림 현황</button>`).join('')}</div>`;
}
function openClubPractice(tid){
  const m=clubPracticeModel(DB,tid);if(!m||UI_OVERLAY)return false;
  const root=document.querySelector('#overlay'),close=()=>{if(UI_OVERLAY===dialog)closeUiOverlay()};
  let dialog=null;
  const recent=m.recent.length?m.recent.map(x=>
    `<p>${esc(x.date||'날짜 미정')} · ${esc(x.opponent)} · ${x.games}세트</p>`).join(''):
    '<p class="hint">기록된 스크림이 없습니다.</p>';
  openUiOverlay({kind:'club-practice',label:'구단 스크림·회복 현황',dismissible:true,
    onDismiss:close,focusSelector:'#brief-practice-close',
    html:`<div class="ovin"><div class="ovhead"><b>${esc(m.t.name)} · 스크림·회복</b><button id="brief-practice-close" class="ghost">브리핑으로 돌아가기</button></div>
    <p>기준일 ${esc(m.date||'날짜 미정')} · ${m.booked?'공식 경기일 · 스크림 불가':m.readiness.ok?'스크림 가능':'스크림 제한 · '+esc(m.readiness.reason)}</p>
    <p>현재 스크림 가용 ${m.readiness.remaining??0}세트 · 최근 결과 및 상대에 따라 다음 상대를 선택할 수 있습니다.</p>
    <h4>최근 실제 스크림</h4>${recent}
    <h4>선수 회복 상태</h4><div class="cfgs">${m.rows.map(p=>`<div class="cfgcard compact"><b>${esc(p.name)}</b><p>${esc(MEDICAL_PLAN_LABELS[p.plan]||p.plan)}${p.out?' · 출전 불가':''}</p></div>`).join('')}</div>
    <p class="hint">성장과 코칭 피드백은 실제 공식 경기·스크림·통합 랭크 활동을 근거로 계산합니다. 이 화면은 훈련 포인트를 생성하거나 소모하지 않습니다.</p></div>`});
  dialog=UI_OVERLAY;
  root.querySelector('#brief-practice-close').onclick=close;
  return true;
}
function bindClubPracticeBriefing(){
  const ctx=clubBriefContext();if(!ctx)return;
  const db=DB,w=db.world,slot=SLOT,render=UI_RENDER_ID,manager=db.manager,date=db.worldDate,phase=w.phase;
  document.querySelectorAll('[data-brief-practice]').forEach(b=>b.onclick=()=>{
    if(clubBriefCurrent(db,w,slot,render,ctx.t.id)&&db.manager===manager&&db.worldDate===date&&w.phase===phase&&!UI_OVERLAY)
      openClubPractice(b.dataset.briefPractice);
  });
}
