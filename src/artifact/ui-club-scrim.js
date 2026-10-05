// Owned bookings and recorded participants; existing scrim writers own rules.
let CLUB_SCRIM={db:null,slot:null,manager:null,tid:null,draft:null};
function scrimUiAllowed(db,t){return !!db.world&&!db.world.fired&&db.world.manage==='manual'&&db.world.phase==='season'&&t?.active!==false&&managerControlsSquad(db,t)&&!db.world.pendingOfficial?.queue?.length}
function scrimUiStamp(db){return JSON.stringify([db.year,db.worldDate,db.manager,db.world,db.teams,db.players,db.patch]);}
function scrimUiGuard(t,allowed=()=>true){
  const db=DB,w=db.world,slot=SLOT,manager=db.manager,render=UI_RENDER_ID,view=VIEW,dialog=UI_OVERLAY,stamp=scrimUiStamp(db);
  return ()=>DB===db&&db.world===w&&SLOT===slot&&!SLOT_SWITCHING&&db.manager===manager&&UI_RENDER_ID===render&&VIEW===view&&UI_OVERLAY===dialog&&db.teams[t.id]===t&&scrimUiAllowed(db,t)&&scrimUiStamp(db)===stamp&&allowed();
}
function clubScrimModel(db=DB,tid=managedTeamId(db)){
  if(!clubBriefContext(db)||db.world.phase!=='season'||!managerControlsSquad(db,db.teams[tid])||db.teams[tid]?.active===false)return null;
  const read=JSON.parse(JSON.stringify(db)),t=read.teams[tid],plans=scrimPlans(read).filter(p=>p.teamId===tid||p.opponentId===tid);
  return {read,t,plans,day:practiceDay(read,t),ready:scrimReadiness(read,t),canAct:scrimUiAllowed(db,db.teams[tid]),logs:(Array.isArray(t.scrimLog)?t.scrimLog:[]).slice(-8).reverse()};
}
function clubScrimState(tid){
  if(CLUB_SCRIM.db!==DB||CLUB_SCRIM.slot!==SLOT||CLUB_SCRIM.manager!==DB.manager||CLUB_SCRIM.tid!==tid)CLUB_SCRIM={db:DB,slot:SLOT,manager:DB.manager,tid,draft:null};
  return CLUB_SCRIM;
}
function clubScrimFields(root,values=null){const out={};for(const id of ['scrimdate','scrimpartner','scrimslot','scrimgames']){const el=root.querySelector('#'+id);if(el){if(values&&id in values)el.value=values[id];out[id]=el.value}}return out;}
function renderClubScrimBriefing(){const m=clubScrimModel();if(!m)return '';return `<div id="club-scrim" class="cfgcard"><h4 tabindex="-1">날짜별 스크림 예약</h4><p>저장된 예정 예약 ${m.plans.filter(p=>p.status==='accepted'&&p.date>DB.worldDate).length}건 · 오늘 스크림 자원 소비 ${m.day.scrim}점</p><div class="controls">${clubBriefContext().teams.map(id=>`<button data-brief-scrim="${esc(id)}">${esc(DB.teams[id].name)} 예약·참가 기록</button>`).join('')}</div></div>`;}
function clubScrimRecords(m){
  return m.logs.map(log=>{const evidence=(Array.isArray(m.t.practiceEvidence)?m.t.practiceEvidence:[]).find(e=>e?.version===1&&e.id===log.practiceEvidenceId&&e.team===m.t.id&&typeof e.observer==='string'&&Array.isArray(e.games));
    return `<div class="cfgcard compact"><b>${esc(log.date)} · ${esc(m.read.teams[log.opponent]?.name||'상대 미상')} · ${log.games}세트</b><p class="hint">${esc(log.purpose||'저장된 연습')} · ${esc(log.patch||'패치 미상')} · ${evidence?.model==='aggregate'?'집계 연습 모형':evidence?.model==='engine'?'엔진 연습 기록':'모형 근거 미상'}</p>${evidence?evidence.games.map(g=>`<p>${g.n}세트 · ${validPracticePicks(g.picks)?g.picks.map(p=>`${ROLE_KO[p.role]} ${esc(m.read.players[p.player]?.name||p.player)} · ${esc(championLabel(m.read,p.champ))}`).join(' / '):'당시 선수·챔피언 명단 근거 없음'}</p>`).join(''):'<p class="hint">연결된 당시 참가 원자료가 없습니다. 현재 명단으로 과거 참가자를 재구성하지 않습니다.</p>'}</div>`;
  }).join('')||'<p class="hint">저장된 내 구단 스크림 기록이 없습니다.</p>';
}
function openClubScrim(tid){
  const m=clubScrimModel(DB,tid);if(!m||UI_OVERLAY)return false;
  const state=clubScrimState(tid),stamp=scrimUiStamp(DB),root=document.querySelector('#overlay');let current=()=>false,dialog=null;
  const close=()=>{if(UI_OVERLAY!==dialog)return;if(current())state.draft={stamp,values:clubScrimFields(root)};closeUiOverlay({restoreFocus:false});document.querySelector(`[data-brief-scrim="${tid}"]`)?.focus?.({preventScroll:true});};
  openUiOverlay({kind:'club-scrim',label:'날짜별 스크림 예약·참가 기록',dismissible:true,onDismiss:close,focusSelector:'#brief-scrim-close',html:`<div class="ovin"><div class="ovhead"><b>${esc(m.t.name)} 스크림 예약·참가 기록</b><button id="brief-scrim-close">브리핑으로 돌아가기</button></div><p class="hint">기준일 ${esc(m.read.worldDate)} · 예약은 연습 자원을 미리 지급하지 않습니다. 참가일의 공식 일정·의료 상태와 양팀 가용 여부를 다시 확인합니다.</p><p>오늘 공유 자원: 스크림 ${m.day.scrim}점 · 일일 연습 ${m.day.drills}점 · 잔여 ${m.day.remaining}점</p><p>현재 스크림 검사: ${esc(m.ready.reason)}${m.ready.ok?` · 잔여 ${m.ready.remaining}세트 · ${m.ready.availableSlots.map(s=>s==='afternoon'?'오후':'저녁').join('·')}`:''}</p><p class="hint">훈련 능력 배분과 공유 자원은 다른 단위입니다. 미래 가용·수락·참가를 보장하지 않습니다.</p><p id="brief-scrim-message" role="status"></p>${scrimPlansPanel(m.t,m.read,m.canAct)}<h4>완료된 내 구단 참가 원자료</h4><p class="hint">예약으로 참가 선수가 확정되지는 않습니다. 참가일의 선발 명단과 의료 상태에 따라 참가 선수가 정해집니다. 아래 최대8건은 이미 저장된 내 구단 연습 기록이며 공식 경기와 분리됩니다. 상대 비공개 연습·능력·수락 확률은 표시하지 않습니다.</p>${clubScrimRecords(m)}</div>`});dialog=UI_OVERLAY;
  current=scrimUiGuard(DB.teams[tid],()=>UI_OVERLAY===dialog);if(state.draft?.stamp===stamp)clubScrimFields(root,state.draft.values);root.querySelector('#brief-scrim-close').onclick=close;
  bindScrimPlans(current,root,(msg,changed)=>{clubBriefState().message=msg;if(changed){state.draft=null;saveDB();closeUiOverlay({restoreFocus:false});navKeepScroll();document.querySelector(`[data-brief-scrim="${tid}"]`)?.focus?.({preventScroll:true});}else {state.draft={stamp,values:clubScrimFields(root)};root.querySelector('#brief-scrim-message').textContent=msg;}},tid);
  return true;
}
function bindClubScrimBriefing(){const ctx=clubBriefContext();if(!ctx){CLUB_SCRIM.db=null;return;}const db=DB,slot=SLOT,manager=db.manager,render=UI_RENDER_ID;const current=()=>DB===db&&SLOT===slot&&!SLOT_SWITCHING&&DB.manager===manager&&UI_RENDER_ID===render&&!UI_OVERLAY&&clubBriefContext()?.t===ctx.t;document.querySelectorAll('[data-brief-scrim]').forEach(b=>b.onclick=()=>{if(current())openClubScrim(b.dataset.briefScrim)});}
