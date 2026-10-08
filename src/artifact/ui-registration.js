function officialRegistrationPanel(t,db=DB){
  if(!officialRegistrationEnabled(db))return '';
  const mine=!db.world?.fired&&managerControlsSquad(db,t),open=officialRegistrationOpen(db,t),
    root=parentTeamOf(db,t),teams=managedTeam(db)?.parent?[t]:organizationTeams(db,root),
    players=mine?Array.from(new Set(teams.flatMap(x=>[...x.roster,...(x.registration?.players||[])]))):t.registration?.players||[],
    current=t.registration?.players||[],depth=mine?officialMatchView(db,null,t.id,t.id).teams[t.id].depthChart:{};
  return `<section><p role="status" data-official-status></p><h3>공식 등록 · ${current.length}/${officialRosterCap(db,t)}명</h3>
    <p class="hint">${open?'등록 기간 열림':'등록 닫힘'} · 훈련 소속과 공식 명단은 별개.</p>
    <details class="cfgcard"><summary>공식 명단 확인 / 변경</summary>
      ${players.map(id=>{const p=db.players[id];if(!p)return '';const registered=teams.find(x=>x.registration?.players.includes(id));
        return `<label class="cfgcard"><b>${esc(p.name)}</b> · 훈련 ${esc(db.teams[p.team]?.short||'무소속')}
          ${mine&&open?`<select data-official-destination="${id}"><option value="">미등록</option>${teams.map(x=>`<option value="${x.id}"${registered?.id===x.id?' selected':''}>${esc(x.short)} 공식 명단</option>`).join('')}</select>`:
          `<span>${registered?esc(registered.short)+' 등록':'미등록'}</span>`}</label>`}).join('')}
      ${mine&&open?`<button class="primary" data-official-submit="${t.id}">공식 명단 제출</button>`:''}</details>
    ${competitionStaffRegistrationPanel(t,db)}
    ${mine?`<details class="cfgcard"><summary>공식전 선발 5명</summary><p class="hint">등록 기간 밖에도 선발 변경 가능. 훈련 선발과 별도 적용.</p>
      ${ROLES.map(role=>`<label>${ROLE_KO[role]}<select data-official-role="${role}">${current.filter(id=>officialPlayerCanRepresent(db,db.players[id],t)).map(id=>`<option value="${id}"${depth[role]===id?' selected':''}>${esc(db.players[id].name)} · 적합 ${playerRoleRating(db.players[id],role)}</option>`).join('')}</select></label>`).join('')}
      <button class="ghost" data-official-lineup="${t.id}">공식 선발 적용</button></details>`:''}</section>`;
}
function bindOfficialRegistrationControls(ok=()=>true,root=document,after=()=>navKeepScroll()){
const db=DB,w=db.world,slot=SLOT,rid=UI_RENDER_ID,oid=managedTeamId(db),view=VIEW,overlay=UI_OVERLAY;
const stamp=()=>JSON.stringify([w.year,w.manage,w.fired,w.registrationVersion,w.pendingOfficial,
Object.values(db.teams).map(t=>[t.id,t.roster]),officialRegistrationSnapshot(db,{teamId:oid,players:Object.keys(db.players)})]);
const start=stamp(),guard=()=>ok()&&DB===db&&DB.world===w&&SLOT===slot&&VIEW===view&&
UI_RENDER_ID===rid&&UI_OVERLAY===overlay&&!SLOT_SWITCHING&&!w.fired&&w.manage==='manual'&&managedTeamId(db)===oid&&stamp()===start;
const valid=()=>{if(guard())return true;if(DB===db&&ok()){MSG='상태 변경: 초안을 취소하고 다시 확인하세요';const n=root.querySelector('[data-official-status]');if(n)n.textContent=MSG}return false};
root.querySelectorAll('[data-official-submit]').forEach(b=>b.onclick=()=>{
  if(!valid())return;
  const t=DB.teams[b.dataset.officialSubmit],teams=managedTeam(DB)?.parent?[t]:organizationTeams(DB,t),
    registrations=Object.fromEntries(teams.map(x=>[x.id,[]]));
  root.querySelectorAll('[data-official-destination]').forEach(el=>{
    if(Object.hasOwn(registrations,el.value))registrations[el.value].push(el.dataset.officialDestination);
  });
  const preview=previewWorldAction(DB,{type:'roster.register',actor:'manager',teamId:t.id,registrations});
  if(!preview.ok){MSG=preview.errors.join(' · ');after();return}
  if(!confirm('공식 명단을 제출할까요?\n'+teams.map(x=>x.short+' '+registrations[x.id].length+'명').join(' · ')+
    '\n계약·훈련 유지. 제출 즉시 출전 자격 변경.'))return;
  if(!valid())return;
  const result=applyWorldAction(DB,preview);MSG=result.ok?'공식 명단 제출 완료':result.errors.join(' · ');
  if(result.ok)saveDB();after();
});
root.querySelectorAll('[data-official-lineup]').forEach(b=>b.onclick=()=>{
  if(!valid())return;
  const lineup=Object.fromEntries(Array.from(root.querySelectorAll('[data-official-role]')).map(el=>[el.dataset.officialRole,el.value]));
  const result=commitWorldAction(DB,{type:'roster.official-lineup',actor:'manager',teamId:b.dataset.officialLineup,lineup});
  MSG=result.ok?'공식 선발 적용 완료':result.errors.join(' · ');if(result.ok)saveDB();after();
});
root.querySelectorAll('[data-competition-staff-submit]').forEach(b=>b.onclick=()=>{
  if(!valid())return;
  const ids=Array.from(root.querySelectorAll(`[data-competition-staff="${b.dataset.competitionStaffSubmit}"]:checked`)).map(x=>x.value),preview=previewWorldAction(DB,{type:'competition.staff-register',actor:'manager',seasonId:b.dataset.competitionStaffSubmit,teamId:b.dataset.teamId,staffIds:ids});
  if(!preview.ok){MSG=preview.errors.join(' · ');after();return}
  if(!confirm('대회 현장 스태프 '+ids.length+'명을 등록할까요?\n마감 후 변경 불가.'))return;
  if(!valid())return;
  const result=applyWorldAction(DB,preview);MSG=result.ok?'현장 스태프 등록 완료':result.errors.join(' · ');if(result.ok)saveDB();after();
});
}
function competitionStaffRegistrationPanel(t,db=DB){
  const seasons=Object.values(db.world?.seasons||{}).filter(s=>db.competitions[s.comp]?.teams.includes(t.id)&&competitionStaffPolicy(db,s));if(!seasons.length)return '';
  return seasons.map(s=>{
    const p=competitionStaffPolicy(db,s),open=!db.world?.fired&&db.world.manage==='manual'&&managerControlsSquad(db,t)&&staffRegistrationOpen(db,s),selected=new Set(competitionStaffEntry(db,s,t.id)),members=teamStaffMembers(t),
      departed=(s.staffEntryRecords?.[t.id]?.staff||[]).filter(x=>!members.some(m=>m.id===x.id));
    return `<details class="cfgcard"><summary>${esc(db.competitions[s.comp].name)} 현장 스태프 · ${selected.size}/${p.max}명</summary><p class="hint">${s.done?'대회 종료':open?'마감 전 변경 가능':'등록 마감됨'} · 마감 ${esc(p.lockAt)} · 공식전 지원은 현재 고용된 등록 직원이 담당합니다. 훈련·회복은 전체 직원 담당.</p>${members.map(x=>`<label><input type="checkbox" data-competition-staff="${esc(s.id)}" value="${esc(x.id)}"${selected.has(x.id)?' checked':''}${!open?' disabled':''}> ${esc(x.name)} · ${esc(STAFF_ROLES[x.role])}${x.role==='analyst'||staffSecondaryRoles(x).includes('analyst')?' · '+(ANALYSIS_CONTEXTS[x.analysisFocus]||'범용'):''}</label>`).join('')}${departed.map(x=>`<p class="hint">${esc(x.name)} · ${esc(STAFF_ROLES[x.role]||x.role)} · 제출 후 퇴사</p>`).join('')}${open?`<button class="primary" data-competition-staff-submit="${esc(s.id)}" data-team-id="${esc(t.id)}">현장 명단 제출</button>`:''}</details>`;
  }).join('');
}
