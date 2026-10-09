// Pure owned-club briefing; existing season/contract writers keep authority.
let CLUB_BRIEF={db:null,slot:null,team:null,message:'',draft:null};
function clubBriefContext(db=DB){
  const w=db?.world,t=w&&managedTeam(db);
  if(!t||w.fired||['pick','initial_roster'].includes(w.phase))return null;
  return {db,w,t,teams:setupTeamsForManager(db).map(x=>x.id)};
}
function clubBriefState(){
  if(CLUB_BRIEF.db!==DB||CLUB_BRIEF.slot!==SLOT||CLUB_BRIEF.team!==managedTeamId(DB))CLUB_BRIEF={db:DB,slot:SLOT,team:managedTeamId(DB),message:'',draft:null};
  return CLUB_BRIEF;
}
function clubBriefNegotiations(db,ctx=clubBriefContext(db)){
  if(!ctx||ctx.t.parent)return [];
  return Object.values(db.world.negotiations||{}).filter(n=>n&&typeof n.id==='string'&&/^[A-Za-z0-9_:/.\-]+$/.test(n.id)&&['club','player'].includes(n.stage)&&(n.stage==='club'?n.teamId===ctx.t.id&&!!db.teams[n.sellerId]:!!(n.counter||n.demand))&&n.status==='open'&&ctx.teams.includes(n.teamId)&&db.players[n.pid]&&!db.players[n.pid].retired&&db.teams[n.teamId]&&
    (['renewal','fa','early_fa','transfer'].includes(n.kind))&&(n.kind==='renewal'?db.players[n.pid].team===n.teamId:['transfer','early_fa'].includes(n.kind)?db.players[n.pid].team===n.sellerId:!db.players[n.pid].team))
    .sort((a,b)=>String(a.createdDate||'').localeCompare(String(b.createdDate||''))||String(a.id).localeCompare(String(b.id)));
}
function clubBriefFixture(db,ctx=clubBriefContext(db)){
  if(!ctx||ctx.w.phase!=='season')return null;
  const rows=[];
  for(const s of Object.values(ctx.w.seasons||{}))if(!s.done&&db.competitions[s.comp])
    for(const d of s.days.slice(s.cur))for(const m of d.matches)
      if(!m.res&&(m.a===ctx.t.id||m.b===ctx.t.id)&&db.teams[m.a]&&db.teams[m.b])rows.push({s,d,m});
  rows.sort((a,b)=>String(a.d.date).localeCompare(String(b.d.date))||String(a.m.time||'').localeCompare(String(b.m.time||''))||String(a.m.id).localeCompare(String(b.m.id)));
  return rows[0]||null;
}
function renderClubBriefing(){
  const ctx=clubBriefContext();if(!ctx){CLUB_ENTRY_DRAFT=null;return '';}
  const state=clubBriefState(),nx=clubBriefFixture(DB,ctx),ns=clubBriefNegotiations(DB,ctx),cw=ctx.w.contractWindow;
  return `<section id="club-briefing"><h3 tabindex="-1">구단 운영 브리핑</h3><p class="hint">${esc(ctx.t.name)} · 기준일 ${esc(DB.worldDate||'날짜 미정')} · ${ctx.w.manage==='manual'?'직접 운영':'현재 AI 위임 설정'} · 확정된 일정과 진행 중인 내 구단 협상만 표시합니다.</p><p role="status">${esc(state.message)}</p>
    <div class="club-home-actions"><button data-club-home-squad>내 선수단 열기</button></div><div class="club-home-grid">${renderClubActions()}${nx?`<div class="cfgcard"><h4>다음 공식 경기</h4><p>${esc(DB.competitions[nx.s.comp].name)} · ${esc(nx.d.label||'')} · Bo${nx.m.bo}</p><p>${esc(nx.d.date)} UTC · ${esc(fixtureTimeInfo(nx.m))} · ${esc(DB.teams[nx.m.a].name)} vs ${esc(DB.teams[nx.m.b].name)}</p><div class="controls"><button data-brief-schedule="${esc(nx.s.key)}">해당 일정 확인</button><button data-brief-progress="smine">내 경기까지 진행</button></div></div>`:'<p class="hint">현재 생성된 일정에 남은 내 공식 경기가 없습니다. 아직 생성되지 않은 대진은 예측하지 않습니다.</p>'}</div>
    ${renderClubHomeDetails(`${renderClubEligibility()}${renderClubFinanceBriefing()}${renderClubStaffBriefing()}${renderClubMedicalBriefing()}${renderClubContractBriefing()}${renderClubPracticeBriefing()}${renderClubScrimBriefing()}${renderClubRecruitBriefing()}`)}
    ${SSET.tab==='sched'?'<button class="ghost" data-brief-return>브리핑으로 돌아오기</button>':''}
    ${ctx.w.phase==='season'?'<div class="controls"><button data-brief-progress="sday">하루 진행</button></div>':''}
    ${cw&&ctx.w.phase==='offseason'?`<p class="hint">현재 계약 창구 · ${cw.stage==='exclusive'?'원소속 독점 협상':'FA 시장'}${cw.exclusiveThrough?' · 독점 종료 '+esc(cw.exclusiveThrough):''}${cw.outsideContactDate?' · 타 구단 접촉 '+esc(cw.outsideContactDate):''}. 개별 협상 만료일로 해석하지 않습니다.</p>`:''}
    ${ctx.w.manage!=='manual'?'<p class="hint">AI 위임 중에는 이 브리핑에서 수동 제안을 보내지 않습니다. 기존 운영 설정에서 직접 운영으로 바꾸세요.</p>':''}<h4>열린 협상 ${ns.length}건</h4>${ns.length?`<div class="cfgs">${ns.map(n=>`<div class="cfgcard compact"><b>${esc(DB.players[n.pid].name)} · ${esc(DB.teams[n.teamId].name)}</b><p class="hint">${n.stage==='club'?'구단 이적료':'선수 개인조건'} · 시작 ${esc(n.createdDate||'날짜 미상')} · ${n.stage==='club'?n.clubRounds||0:n.round}/${n.stage==='club'?3:n.maxRounds}라운드</p><button data-brief-neg="${esc(n.id)}"${ctx.w.manage!=='manual'?' disabled':''}>조건 확인·수동 협상</button></div>`).join('')}</div>`:'<p class="hint">현재 처리 가능한 열린 협상이 없습니다. 개인별 마감은 저장된 근거가 없으면 만들지 않습니다.</p>'}</section>`;
}
function clubBriefCurrent(db,w,slot,render,team){return DB===db&&db.world===w&&SLOT===slot&&UI_RENDER_ID===render&&VIEW==='season'&&managedTeamId(db)===team&&!SLOT_SWITCHING&&!!clubBriefContext(db)}
function openClubBriefNegotiation(nid,returnContractTeam=null){
  const ctx=clubBriefContext(),n=clubBriefNegotiations(DB,ctx).find(x=>x.id===nid);
  if(!n||ctx.w.manage!=='manual'||UI_OVERLAY||ctx.w.pendingOfficial?.queue?.length)return false;
  const db=DB,w=ctx.w,slot=SLOT,render=UI_RENDER_ID,stamp=JSON.stringify(n),date=db.worldDate,phase=w.phase,managerRef=db.manager;
  const current=()=>clubBriefCurrent(db,w,slot,render,ctx.t.id)&&db.manager===managerRef&&db.worldDate===date&&w.phase===phase&&w.manage==='manual'&&UI_OVERLAY===dialog&&JSON.stringify(db.world.negotiations?.[nid])===stamp&&clubBriefNegotiations(db).some(x=>x.id===nid);
  const read=JSON.parse(JSON.stringify(db));read.world.negotiations={[nid]:read.world.negotiations[nid]};
  const state=clubBriefState(),root=document.querySelector('#overlay');let dialog=null;
  const close=()=>{if(UI_OVERLAY!==dialog)return;if(current())state.draft={nid,stamp,date,values:clubBriefDraft(nid,root)};closeUiOverlay()};
  openUiOverlay({kind:'club-negotiation',label:'내 구단 수동 협상',dismissible:true,onDismiss:close,focusSelector:'#brief-neg-close',html:`<div class="ovin"><div class="ovhead"><b>내 구단 수동 협상</b><button id="brief-neg-close" class="ghost">브리핑으로 돌아가기</button></div><p class="hint">작성은 제안 보내기 전까지 적용되지 않습니다. 수락·등록을 보장하지 않습니다.</p>${renderNegotiations([n.teamId],read)}</div>`});
  dialog=UI_OVERLAY;
  if(state.draft?.nid===nid&&state.draft.stamp===stamp&&state.draft.date===date)clubBriefDraft(nid,root,state.draft.values);
  $('#brief-neg-close').onclick=close;
  bindNegotiationControls(msg=>{state.message=String(msg||'처리 결과 없음');state.draft=null;closeUiOverlay({restoreFocus:false});saveDB();navKeepScroll();([...document.querySelectorAll('[data-brief-contract]')].find(b=>b.dataset.briefContract===returnContractTeam)||[...document.querySelectorAll('[data-brief-neg]')].find(b=>b.dataset.briefNeg===nid)||document.querySelector('#club-briefing h3'))?.focus?.({preventScroll:true})},current,root);
  return true;
}
function bindClubBriefing(){
  const ctx=clubBriefContext();if(!ctx)return;
  bindClubHome();bindClubActions();bindClubEligibility();bindClubFinanceBriefing();bindClubStaffBriefing();bindClubMedicalBriefing();bindClubContractBriefing();bindClubPracticeBriefing();bindClubScrimBriefing();bindClubRecruitBriefing();
  const db=DB,w=ctx.w,slot=SLOT,render=UI_RENDER_ID,date=db.worldDate,phase=w.phase,nx=clubBriefFixture(db),current=()=>clubBriefCurrent(db,w,slot,render,ctx.t.id)&&db.worldDate===date&&w.phase===phase&&!UI_OVERLAY;
  document.querySelectorAll('[data-brief-neg]').forEach(b=>b.onclick=()=>{if(current())openClubBriefNegotiation(b.dataset.briefNeg)});
  document.querySelectorAll('[data-brief-schedule]').forEach(b=>b.onclick=()=>{if(!current()||clubBriefFixture(db)?.m.id!==nx?.m.id)return;SSET.view=b.dataset.briefSchedule;SSET.tab='sched';navKeepScroll();document.querySelector('#stab')?.setAttribute?.('tabindex','-1');document.querySelector('#stab')?.focus?.()});
  document.querySelectorAll('[data-brief-return]').forEach(b=>b.onclick=()=>{if(current())document.querySelector('#club-briefing h3')?.focus?.()});
  document.querySelectorAll('[data-brief-progress]').forEach(b=>b.onclick=()=>{if(!current()||w.phase!=='season'||w.pendingOfficial?.queue?.length)return;const target=document.querySelector('#'+b.dataset.briefProgress);if(target&&!target.disabled)target.click()});
}

function clubBriefDraft(nid,root,values=null){
  const neg=initialNegotiationDraft(nid,values?.neg||null,root),fees={};
  for(const key of ['fee','upfront','kind','threshold','bonus']){const el=root.querySelector(`[data-${key==='fee'?'neg-fee':'fee-'+key}="${nid}"]`);if(el){if(values?.fees&&key in values.fees)el.value=values.fees[key];fees[key]=el.value}}
  return {neg,fees};
}
