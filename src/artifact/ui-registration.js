function officialRegistrationPanel(t,db=DB){
  if(!officialRegistrationEnabled(db))return '';
  const mine=!db.world?.fired&&managerControlsSquad(db,t),open=officialRegistrationOpen(db,t),
    root=parentTeamOf(db,t),teams=managedTeam(db)?.parent?[t]:organizationTeams(db,root),
    players=mine?Array.from(new Set(teams.flatMap(x=>[...x.roster,...(x.registration?.players||[])]))):t.registration?.players||[],
    current=t.registration?.players||[],depth=mine?officialMatchView(db,null,t.id,t.id).teams[t.id].depthChart:{};
  return `<section><h3>공식 등록 · ${current.length}/${officialRosterCap(db,t)}명</h3>
    <p class="hint">${open?'등록 기간 열림':'등록 기간 닫힘'} · 계약·훈련 소속과 공식 출전 명단은 별개입니다. 미등록 선수도 훈련·스크림에 참여합니다.</p>
    <details class="cfgcard"><summary>공식 명단 확인 / 변경</summary>
      ${players.map(id=>{const p=db.players[id];if(!p)return '';const registered=teams.find(x=>x.registration?.players.includes(id));
        return `<label class="cfgcard"><b>${esc(p.name)}</b> · 훈련 ${esc(db.teams[p.team]?.short||'무소속')}
          ${mine&&open?`<select data-official-destination="${id}"><option value="">미등록</option>${teams.map(x=>`<option value="${x.id}"${registered?.id===x.id?' selected':''}>${esc(x.short)} 공식 명단</option>`).join('')}</select>`:
          `<span>${registered?esc(registered.short)+' 등록':'미등록'}</span>`}</label>`}).join('')}
      ${mine&&open?`<button class="primary" data-official-submit="${t.id}">공식 명단 변경 확인</button>`:''}</details>
    ${competitionStaffRegistrationPanel(t,db)}
    ${mine?`<details class="cfgcard"><summary>공식전 선발 5명</summary><p class="hint">등록된 선수 안의 선발 변경은 등록 기간 밖에도 가능합니다. 훈련 그룹 선발과 별도로 적용됩니다.</p>
      ${ROLES.map(role=>`<label>${ROLE_KO[role]}<select data-official-role="${role}">${current.filter(id=>officialPlayerCanRepresent(db,db.players[id],t)).map(id=>`<option value="${id}"${depth[role]===id?' selected':''}>${esc(db.players[id].name)} · 적합 ${playerRoleRating(db.players[id],role)}</option>`).join('')}</select></label>`).join('')}
      <button class="ghost" data-official-lineup="${t.id}">공식 선발 적용</button></details>`:''}</section>`;
}
function bindOfficialRegistrationControls(allowed=()=>true,root=document,after=()=>navKeepScroll()){
  root.querySelectorAll('[data-official-submit]').forEach(b=>b.onclick=()=>{
    if(!allowed())return;
    const t=DB.teams[b.dataset.officialSubmit],teams=managedTeam(DB)?.parent?[t]:organizationTeams(DB,t),
      registrations=Object.fromEntries(teams.map(x=>[x.id,[]]));
    root.querySelectorAll('[data-official-destination]').forEach(el=>{
      if(Object.hasOwn(registrations,el.value))registrations[el.value].push(el.dataset.officialDestination);
    });
    const preview=previewWorldAction(DB,{type:'roster.register',actor:'manager',teamId:t.id,registrations});
    if(!preview.ok){MSG=preview.errors.join(' · ');after();return}
    if(!confirm('공식 명단을 제출할까요?\n'+teams.map(x=>x.short+' '+registrations[x.id].length+'명').join(' · ')+
      '\n계약·훈련 배치는 유지됩니다. 제출 즉시 출전 자격이 변경됩니다.'))return;
    if(!allowed())return;
    const result=applyWorldAction(DB,preview);MSG=result.ok?'공식 명단 제출 완료':result.errors.join(' · ');
    if(result.ok)saveDB();after();
  });
  root.querySelectorAll('[data-official-lineup]').forEach(b=>b.onclick=()=>{
    if(!allowed())return;
    const lineup=Object.fromEntries(Array.from(root.querySelectorAll('[data-official-role]')).map(el=>[el.dataset.officialRole,el.value]));
    const result=commitWorldAction(DB,{type:'roster.official-lineup',actor:'manager',teamId:b.dataset.officialLineup,lineup});
    MSG=result.ok?'공식 선발 변경 완료':result.errors.join(' · ');if(result.ok)saveDB();after();
  });
  root.querySelectorAll('[data-competition-staff-submit]').forEach(b=>b.onclick=()=>{
    if(!allowed())return;
    const ids=Array.from(root.querySelectorAll(`[data-competition-staff="${b.dataset.competitionStaffSubmit}"]:checked`)).map(x=>x.value),preview=previewWorldAction(DB,{type:'competition.staff-register',actor:'manager',seasonId:b.dataset.competitionStaffSubmit,teamId:b.dataset.teamId,staffIds:ids});
    if(!preview.ok){MSG=preview.errors.join(' · ');after();return}
    if(!confirm('대회 현장 스태프 '+ids.length+'명을 등록할까요?\n마감 뒤에는 변경할 수 없습니다.'))return;
    if(!allowed())return;
    const result=applyWorldAction(DB,preview);MSG=result.ok?'대회 현장 스태프 등록 완료':result.errors.join(' · ');if(result.ok)saveDB();after();
  });
}
function competitionStaffRegistrationPanel(t,db=DB){
  const seasons=Object.values(db.world?.seasons||{}).filter(s=>db.competitions[s.comp]?.teams.includes(t.id)&&competitionStaffPolicy(db,s));if(!seasons.length)return '';
  return seasons.map(s=>{
    const p=competitionStaffPolicy(db,s),open=!db.world?.fired&&managerControlsSquad(db,t)&&staffRegistrationOpen(db,s),selected=new Set(competitionStaffEntry(db,s,t.id)),members=teamStaffMembers(t),
      departed=(s.staffEntryRecords?.[t.id]?.staff||[]).filter(x=>!members.some(m=>m.id===x.id));
    return `<details class="cfgcard"><summary>${esc(db.competitions[s.comp].name)} 현장 스태프 · ${selected.size}/${p.max}명</summary><p class="hint">${s.done?'대회 종료':open?'마감 전 변경 가능':'등록 마감됨'} · 마감 ${esc(p.lockAt)} · 공식전 코칭·분석은 현재 고용 중인 등록 직원이 담당합니다. AI는 관측 평가·공개 전문성의 보완 효과로 선택하며 필수 직무 할당은 없습니다. 구단 훈련·회복은 전체 고용 인원이 담당합니다.</p>${members.map(x=>`<label><input type="checkbox" data-competition-staff="${esc(s.id)}" value="${esc(x.id)}"${selected.has(x.id)?' checked':''}${!open?' disabled':''}> ${esc(x.name)} · ${esc(STAFF_ROLES[x.role])}${x.role==='analyst'||staffSecondaryRoles(x).includes('analyst')?' · '+(ANALYSIS_CONTEXTS[x.analysisFocus]||'범용'):''}</label>`).join('')}${departed.map(x=>`<p class="hint">${esc(x.name)} · ${esc(STAFF_ROLES[x.role]||x.role)} · 제출 후 퇴사</p>`).join('')}${open?`<button class="primary" data-competition-staff-submit="${esc(s.id)}" data-team-id="${esc(t.id)}">현장 명단 제출</button>`:''}</details>`;
  }).join('');
}
