// Current owned entry/availability reads use private copies; commands own all changes.
let CLUB_ENTRY_DRAFT=null;
function clubEntryModel(db=DB,tid=managedTeamId(db)){
  const ctx=clubBriefContext(db),t=db?.teams?.[tid];
  if(!ctx||!t||!managerControlsSquad(db,t))return null;
  const read=JSON.parse(JSON.stringify(db)),team=read.teams[tid],nx=clubBriefFixture(read,{...clubBriefContext(read),t:team}),s=nx?.s||null,
    enabled=officialRegistrationEnabled(read),ids=officialSeasonRoster(read,team,s).slice(),
    view=officialMatchView(read,s,tid,tid),effective=view.teams[tid],stored=team.registration?.depthChart||{},
    pool=Array.from(new Set([...team.roster,...(team.registration?.players||[]),...ids]));
  const rows=pool.map(id=>{
    const p=read.players[id],listed=ids.includes(id),rights=!!p&&(!enabled?!p.retired&&team.roster.includes(id):officialPlayerCanRepresent(read,p,team)),out=!!p&&medicalOut(p);
    return {id,name:p?.name||'선수 기록 없음',training:read.teams[p?.team]?.short||'무소속',registered:!!team.registration?.players?.includes(id),listed,
      health:p?medicalSummary(p):'기록 없음',available:listed&&rights&&!out,
      reason:!p?'선수 기록 없음':!listed?'해당 공식 명단에 없음':!rights?'현재 대표 자격 없음':out?'의료상 출전 불가':'현재 출전 가능'};
  });
  const registration=enabled?previewWorldAction(read,{type:'roster.register',actor:'manager',teamId:tid,players:team.registration?.players||[]}):null,
    lineup=enabled?previewWorldAction(read,{type:'roster.official-lineup',actor:'manager',teamId:tid,lineup:stored}):null;
  return {read,team,nx,enabled,international:!!s&&!!read.competitions[s.comp]?.international,rows,stored,effective:effective.depthChart,
    available:rows.filter(x=>x.available).length,registration,lineup,checked:validateStartingLineup(view,effective)};
}
function clubEntryConditions(m){return `<details><summary>선수별 출전 조건과 선발 근거</summary>${m.rows.map(x=>`<p><b>${esc(x.name)}</b> · 훈련 ${esc(x.training)} · 구단 공식 ${!m.enabled?'기록 없음':x.registered?'등록':'미등록'} · 대상 명단 ${x.listed?'포함':'미포함'} · ${esc(x.health)} · ${esc(x.reason)}</p>`).join('')||'<p>선수 명단 없음</p>'}
    <p class="hint">${ROLES.map(r=>esc(ROLE_KO[r])+': 저장 '+esc(m.read.players[m.stored[r]]?.name||'미지정')+' / 현재 경기뷰 '+esc(m.read.players[m.effective[r]]?.name||'가용 선수 없음')).join(' · ')}. 경기뷰는 기존 엔진의 가용 검사와 보정 결과이며 수동 저장 선발로 가장하지 않습니다.</p></details>`}
function renderClubEligibility(){
  const m=clubEntryModel();if(!m)return '';
  if(CLUB_ENTRY_DRAFT&&(CLUB_ENTRY_DRAFT.key[0]!==DB||CLUB_ENTRY_DRAFT.key[1]!==SLOT||CLUB_ENTRY_DRAFT.key[6]!==managedTeamId(DB)))CLUB_ENTRY_DRAFT=null;
  const error=p=>p? p.ok?'기존 명령의 현재 검증 통과':p.errors.join(' · '):'구형 저장: 별도 공식 등록 규칙 미사용';
  return `<div id="club-entry" class="cfgcard"><h4 tabindex="-1">공식 등록 · 가용 확인</h4><p class="hint">${esc(m.nx?'일정 '+m.nx.m.id+' · '+m.nx.d.date:'남은 공식 일정 없음 · 현재 명단 기준')} · ${!m.enabled?'구형 저장의 계약·훈련 명단':m.international?'해당 국제대회 제출 엔트리':'현재 공식 등록 명단'} · 현재 가용 ${m.available}명</p>
    <p class="hint">계약·훈련 소속, 등록, 선발, 의료 가용은 별개입니다. 미래 출전이나 수락을 보장하지 않습니다. 등록 검사: ${esc(error(m.registration))} · 저장된 선발 검사: ${esc(error(m.lineup))}</p>
    ${clubEntryConditions(m)}
    ${m.enabled?`<button data-brief-entry="${esc(m.team.id)}"${DB.world.manage!=='manual'?' disabled':''}>공식 명단·선발 수동 확인</button>${clubBriefContext().teams.filter(id=>id!==m.team.id).map(id=>`<button data-brief-entry="${esc(id)}"${DB.world.manage!=='manual'?' disabled':''}>${esc(DB.teams[id].name)} 등록·가용 확인</button>`).join('')}`:''}</div>`;
}
function clubEntryStamp(db,tid){
  const t=db.teams[tid],teams=organizationTeams(db,parentTeamOf(db,t)),players=Array.from(new Set(teams.flatMap(x=>[...x.roster,...(x.registration?.players||[])])));
  return JSON.stringify(officialRegistrationSnapshot(db,{teamId:tid,players}))+JSON.stringify([db.world.registrationVersion,db.world.manage,clubBriefFixture(db)?.m.id])+officialStaffEditStamp(db,tid);
}
function clubEntryDraft(root,values=null){
  const fields=[...root.querySelectorAll('[data-official-destination]'),...root.querySelectorAll('[data-official-role]'),...root.querySelectorAll('[data-competition-staff]')],out={};
  for(const el of fields){const d=el.dataset,key=d.officialDestination?'player:'+d.officialDestination:d.officialRole?'role:'+d.officialRole:'staff:'+d.competitionStaff+':'+el.value;if(values&&key in values){if(d.competitionStaff)el.checked=values[key];else el.value=values[key]}out[key]=d.competitionStaff?el.checked:el.value}return out;
}
function openClubEntry(tid){
  const ctx=clubBriefContext(),m=clubEntryModel(DB,tid);if(!m?.enabled||ctx.w.manage!=='manual'||UI_OVERLAY)return false;
  const db=DB,w=db.world,slot=SLOT,render=UI_RENDER_ID,stamp=clubEntryStamp(db,tid),date=db.worldDate,phase=w.phase,root=document.querySelector('#overlay');let dialog=null,comparisonStart;
  const context=()=>clubBriefCurrent(db,w,slot,render,ctx.t.id)&&!w.fired&&w.manage==='manual'&&db.worldDate===date&&w.phase===phase&&UI_OVERLAY===dialog&&managerControlsSquad(db,db.teams[tid]);
  const current=()=>context()&&clubEntryStamp(db,tid)===stamp;
  const draftKey=[db,slot,tid,date,phase,stamp,ctx.t.id];
  const close=()=>{if(UI_OVERLAY!==dialog)return;if(current())CLUB_ENTRY_DRAFT={key:draftKey,values:clubEntryDraft(root),start:comparisonStart};closeUiOverlay()};
  openUiOverlay({kind:'club-entry',label:'공식 명단·선발 수동 확인',dismissible:true,onDismiss:close,focusSelector:'#brief-entry-close',html:`<div class="ovin"><div class="ovhead"><b>${esc(m.team.name)} 공식 명단·선발</b><button id="brief-entry-close" class="ghost">브리핑으로 돌아가기</button></div><p class="hint">작성은 제출 전까지 적용되지 않습니다. 등록 기간과 현재 자격은 기존 명령이 다시 검사합니다.</p>${clubEntryConditions(m)}<button id="brief-entry-reset" class="ghost">초안 취소 · 현재 명단 다시 열기</button><div data-official-comparison></div>${officialRegistrationPanel(m.team,m.read)}</div>`});dialog=UI_OVERLAY;
  const cached=CLUB_ENTRY_DRAFT?.key.every((v,i)=>v===draftKey[i])?CLUB_ENTRY_DRAFT:null;
  comparisonStart=clubOfficialEditStart(db,tid,root,cached);if(!cached)CLUB_ENTRY_DRAFT=null;
  $('#brief-entry-close').onclick=close;
  $('#brief-entry-reset').onclick=()=>{
    if(DB!==db||DB.world!==w||SLOT!==slot||UI_RENDER_ID!==render||UI_OVERLAY!==dialog||managedTeamId(db)!==ctx.t.id||SLOT_SWITCHING||w.fired||w.manage!=='manual')return;
    if(!confirm('미적용 명단·선발·현장 스태프 입력을 모두 취소하고 현재 상태를 다시 열까요?'))return;
    if(DB!==db||DB.world!==w||SLOT!==slot||UI_RENDER_ID!==render||UI_OVERLAY!==dialog||managedTeamId(db)!==ctx.t.id||SLOT_SWITCHING||w.fired||w.manage!=='manual')return;
    CLUB_ENTRY_DRAFT=null;closeUiOverlay({restoreFocus:false});openClubEntry(tid);
  };
  const readable=()=>DB===db&&DB.world===w&&SLOT===slot&&UI_RENDER_ID===render&&UI_OVERLAY===dialog&&!SLOT_SWITCHING&&!w.fired&&w.manage==='manual'&&managedTeamId(db)===ctx.t.id&&VIEW==='season';
  const review=bindClubOfficialComparison(root,tid,readable,comparisonStart);
  bindOfficialRegistrationControls(current,root,()=>{CLUB_ENTRY_DRAFT=null;clubBriefState().message=MSG;closeUiOverlay({restoreFocus:false});navKeepScroll();document.querySelector('#club-entry h4')?.focus?.({preventScroll:true})},()=>clubOfficialEditRejected(root,readable,review));
  return true;
}
function bindClubEligibility(){
  const ctx=clubBriefContext();if(!ctx)return;
  const db=DB,w=ctx.w,slot=SLOT,render=UI_RENDER_ID,date=db.worldDate;
  document.querySelectorAll('[data-brief-entry]').forEach(b=>b.onclick=()=>{if(clubBriefCurrent(db,w,slot,render,ctx.t.id)&&db.worldDate===date&&!UI_OVERLAY)openClubEntry(b.dataset.briefEntry)});
}
