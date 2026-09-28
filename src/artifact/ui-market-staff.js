// ===== LOL GM: club staff/sponsor market panels and actions =====
function sponsorBlock(t){
  const cur=t.sponsor&&t.sponsor.until>=DB.year?t.sponsor:null, offers=DB.world.sponsorOffers||[];
  return `<h4>메인 스폰서</h4>${cur?`<p>${esc(cur.name)} ${esc(cur.type)} — 기본 ${money(cur.base)}${cur.perWin?` + 승리당 ${money(cur.perWin)}`:''} (${cur.until}년까지)</p>`:offers.map(o=>`<div class="mrow"><span><b>${esc(o.name)}</b> ${esc(o.type)} · 기본 ${money(o.base)}${o.perWin?` + 승리당 ${money(o.perWin)}`:''} · ${o.years}년</span><button class="ghost sm2" data-spon="${o.id}">계약</button></div>`).join('')+'<p class="hint">계약하지 않으면 팬덤에 따라 매년 다시 정해집니다.</p>'}`;
}
function coachBlock(t){
  const ps=psOf(DB,t.region),members=teamStaffMembers(t);ensureFacilities(t);const profile=staffProfile(t);
  const dept=(d)=>members.filter(s=>staffDepartment(s.role)===d),cards=members.slice().sort((a,b)=>staffDepartment(a.role).localeCompare(staffDepartment(b.role))||b.rating-a.rating).map(x=>`<div class="mrow"><span><b>${esc(x.name)}</b> · ${STAFF_ROLES[x.role]} · 능력 ${x.rating} · 연봉 ${money(staffSalary(x,ps))}</span><button class="ghost sm2" data-fire-staff="${x.id}">계약 해지</button></div>`).join('');
  const limits=`코칭팀 ${dept('coach').length}/${STAFF_DEPT_LIMITS.coach} · 분석팀 ${dept('analyst').length}/${STAFF_DEPT_LIMITS.analyst} · 스카우팅팀 ${dept('scout').length}/${STAFF_DEPT_LIMITS.scout}`;
  const market=(DB.staffPool||[]).slice().sort((a,b)=>b.rating-a.rating).map(x=>{const d=staffDepartment(x.role),full=staffDeptCount(t,d)>=STAFF_DEPT_LIMITS[d];return `<div class="mrow"><span><b>${esc(x.name)}</b> · ${STAFF_ROLES[x.role]} · 능력 ${x.rating} · 연봉 ${money(staffSalary(x,ps))}</span><button class="ghost sm2" data-hire-staff="${x.id}"${full?' disabled':''}>${full?'부서 정원':'선임'}</button></div>`}).join('');
  return `<div class="fin"><div><span>헤드코치</span><b>플레이어</b><small>최종 스포츠 결정</small></div><div><span>부서 정원</span><b>${limits}</b><small>범용 수석코치 없음</small></div><div><span>스태프 효과</span><b>전략 ${Math.round(profile.draft)} · 분석 ${Math.round(profile.analysis)}</b><small>육성 ${Math.round(profile.development)} · 스카우팅 ${Math.round(profile.scouting)}</small></div></div><h4>현재 스태프</h4>${cards||'<p class="hint">고용된 전문 스태프가 없습니다.</p>'}<h4>스태프 시장</h4>${market}`;
}
function bindClubOfficeControls(act){
  document.querySelectorAll('[data-spon]').forEach(b=>b.onclick=()=>act(mSponsor(DB,b.dataset.spon)));
  document.querySelectorAll('[data-hire-staff]').forEach(b=>b.onclick=()=>{const x=(DB.staffPool||[]).find(s=>s.id===b.dataset.hireStaff);if(x&&confirm(`${STAFF_ROLES[x.role]} ${x.name}을(를) 선임할까요?\n능력 ${x.rating} · ${STAFF_DEPT_LABEL[staffDepartment(x.role)]}`))act(mHireStaff(DB,b.dataset.hireStaff))});
  document.querySelectorAll('[data-fire-staff]').forEach(b=>b.onclick=()=>{const s=teamStaffMembers(managedTeam(DB)).find(x=>x.id===b.dataset.fireStaff);if(s&&confirm(`${STAFF_ROLES[s.role]} ${s.name}의 계약을 해지할까요?`))act(mReleaseStaff(DB,b.dataset.fireStaff))});
}
