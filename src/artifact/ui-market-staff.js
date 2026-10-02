// ===== Staff/sponsor market =====
function sponsorBlock(t){
  const cur=t.sponsor&&t.sponsor.until>=DB.year?t.sponsor:null, offers=DB.world.sponsorOffers||[];
  return `<h4>메인 스폰서</h4>${cur?`<p>${esc(cur.name)} ${esc(cur.type)} — 기본 ${money(cur.base)}${cur.perWin?` + 국내 1승당 ${money(cur.perWin)}`:''}${cur.milestone?` + ${sponsorGoalLabel(cur.milestone)} 달성 시 ${money(cur.milestoneBonus)}`:''} (${cur.until}년까지)</p>`:offers.map(o=>`<div class="mrow"><span><b>${esc(o.name)}</b> ${esc(o.type)} · 보장 ${money(o.base)}${o.perWin?` + 국내 1승당 ${money(o.perWin)}`:''}${o.milestone?` + ${sponsorGoalLabel(o.milestone)} 보너스 ${money(o.milestoneBonus)}`:''} · ${o.years}년 <small class="hint">예상 연간 ${money(sponsorExpectedValue(DB,t,o))}</small></span><button class="ghost sm2" data-spon="${o.id}">계약</button></div>`).join('')+'<p class="hint">기본 계약과 성과형 보너스의 확실성이 다릅니다. 계약 전 조건을 비교해 선택하세요. 제안은 시장 연도에만 유효합니다.</p>'}`;
}
function coachBlock(t){
  const members=teamStaffMembers(t);ensureFacilities(t);const profile=staffProfile(t);
  const dept=(d)=>members.filter(s=>staffDepartment(s.role)===d),cards=members.slice().sort((a,b)=>staffDepartment(a.role).localeCompare(staffDepartment(b.role))).map(x=>staffEmploymentCard(t,x,true)).join('');
  const limits=`코칭팀 ${dept('coach').length}/${STAFF_DEPT_LIMITS.coach} · 분석팀 ${dept('analyst').length}/${STAFF_DEPT_LIMITS.analyst} · 스카우팅팀 ${dept('scout').length}/${STAFF_DEPT_LIMITS.scout}`;
  const labels=FACILITY_LABELS;
  const facilities=t.facilities||{},projects=t.facilityProjects||[];
  const building=projects.map(p=>labels[p.key]+' '+p.from+'→'+p.to+' (완료 예정 '+p.ready+')').join(' · ');
  const candidates=staffMarketCandidates(DB,t).filter(s=>!MK.staffRole||MK.staffRole==='ALL'||s.role===MK.staffRole).sort((a,b)=>staffObservation(DB,t,b).estimate-staffObservation(DB,t,a).estimate),page=Math.min(MK.staffPage||0,Math.max(0,Math.ceil(candidates.length/20)-1));
  const market=`<div class="controls"><label>전문 직무<select data-staff-role><option value="ALL">전체</option>${Object.entries(STAFF_ROLES).map(([id,label])=>`<option value="${id}"${MK.staffRole===id?' selected':''}>${label}</option>`).join('')}</select></label><span>${candidates.length}명 · ${page+1}/${Math.max(1,Math.ceil(candidates.length/20))}</span><button class="ghost" data-staff-page="${page-1}"${page===0?' disabled':''}>이전</button><button class="ghost" data-staff-page="${page+1}"${(page+1)*20>=candidates.length?' disabled':''}>다음</button></div>`+candidates.slice(page*20,(page+1)*20).map(s=>staffEmploymentCard(t,s,false)).join('');
  return `<div class="fin"><div><span>헤드코치</span><b>플레이어</b><small>최종 스포츠 결정</small></div><div><span>부서 정원</span><b>${limits}</b><small>범용 수석코치 없음</small></div><div><span>스태프 효과</span><b>전략 ${Math.round(profile.draft)} · 분석 ${Math.round(profile.analysis)}</b><small>육성 ${Math.round(profile.development)} · 스카우팅 ${Math.round(profile.scouting)}</small></div></div><h4>시설 운영 현황</h4><p class="hint">${Object.entries(labels).map(([k,v])=>v+' '+(facilities[k]||1)+'단계').join(' · ')} · 연간 유지비 ${money(facilityUpkeep(DB,t))}</p><p class="hint">훈련: 시즌 능력치 성장 · 데이터 분석: 조합/상대 준비 · 회복: 일일 피로 회복 · 유소년: 젊은 선수 성장/영입 매력 · 스카우팅: 관찰 보고서 정확도</p><p class="hint">다음 시설 투자 판단: ${FACILITY_TYPES.filter(k=>facilities[k]<5).map(k=>labels[k]+' '+facilityInvestmentScore(DB,t,k).toFixed(2)).sort().join(' · ')} (투자 적합도, 현재 선수단·구단 철학·비용 반영)</p><p class="hint">${building?'시설 증설 중: '+esc(building):'진행 중인 시설 증설 없음'} · 구단 경영진이 투자 판단</p><h4>현재 스태프</h4>${cards||'<p class="hint">고용된 전문 스태프가 없습니다.</p>'}<h4>스태프 시장</h4>${market}`;
}
function bindClubOfficeControls(act){
  document.querySelectorAll('[data-spon]').forEach(b=>b.onclick=()=>act(mSponsor(DB,b.dataset.spon)));
  document.querySelectorAll('[data-staff-role]').forEach(s=>s.onchange=()=>{MK.staffRole=s.value;MK.staffPage=0;navKeepScroll()});
  document.querySelectorAll('[data-staff-page]').forEach(b=>b.onclick=()=>{MK.staffPage=Number(b.dataset.staffPage);navKeepScroll()});
  document.querySelectorAll('[data-interview-staff]').forEach(b=>b.onclick=()=>{const out=commitWorldAction(DB,{type:'staff.interview',actor:'manager',teamId:managedTeamId(DB),sid:b.dataset.interviewStaff});act(out.ok?'면접 완료 · 추정 범위가 좁아졌습니다':out.errors.join(' · '))});
  document.querySelectorAll('[data-hire-staff]').forEach(b=>b.onclick=()=>{
    const sid=b.dataset.hireStaff,t=managedTeam(DB),found=locateStaff(DB,sid);if(!found)return;
    const preview=previewWorldAction(DB,{type:found.team?.id===t.id?'staff.renew':'staff.sign',actor:'manager',teamId:t.id,sid,replaceSid:document.querySelector(`[data-staff-replace="${sid}"]`)?.value||undefined,years:Number(document.querySelector(`[data-staff-years="${sid}"]`).value),salary:Number(document.querySelector(`[data-staff-salary="${sid}"]`).value)});
    if(!preview.ok){act(preview.errors.join(' · '));return}
    if(!confirm(found.staff.name+' 계약\n연봉 '+money(preview.command.salary)+' · '+preview.command.years+'년\n위약금·해지 보상 '+money(preview.command.fee)+(preview.command.replaceSid?'\n교체: '+locateStaff(DB,preview.command.replaceSid).staff.name:'')+'\n확정할까요?'))return;
    const result=applyWorldAction(DB,preview);act(result.ok?'스태프 계약 완료':result.errors.join(' · '));
  });
  document.querySelectorAll('[data-fire-staff]').forEach(b=>b.onclick=()=>{const s=teamStaffMembers(managedTeam(DB)).find(x=>x.id===b.dataset.fireStaff);if(s&&confirm(`${STAFF_ROLES[s.role]} ${s.name}의 계약을 해지할까요?\n해지 보상 ${money(staffExitFee(DB,s))}`))act(mReleaseStaff(DB,b.dataset.fireStaff))});
}
function staffEmploymentCard(t,s,own){
  const seen=staffObservation(DB,t,s),employer=locateStaff(DB,s.id)?.team,canOffer=!own||s.contract?.until<=DB.year;
  return `<details class="cfgcard"><summary>${esc(s.name)} · ${STAFF_ROLES[s.role]} · 추정 ${seen.min}~${seen.max}</summary>
    <p>${s.age}세 · ${employer?esc(employer.name):'자유 계약'}${s.contract?' · '+s.contract.until+'년까지 · 연봉 '+money(s.contract.salary):''}</p>
    <p>보조 전문 분야: ${staffSecondaryRoles(s).map(r=>STAFF_ROLES[r]).join(' · ')||'없음'} · 전문분야가 많을수록 각 효과가 분산됩니다.${s.role==='analyst'||s.specialties?.analyst>0?' · 분석 전문: '+(ANALYSIS_CONTEXTS[s.analysisFocus]||'범용'):''}</p>
    ${staffRegionalKnowledgeSummary(s)}
    ${s.retirementReview?`<p class="hint">${s.retirementReview.year}년 활동 검토 · ${staffRetirementExplanation(s.retirementReview)} (가상 엔진 판단, 은퇴 확정 예고가 아님)</p>`:''}
    ${(s.career||[]).slice(-2).map(r=>`<p class="hint">${r.year} · ${esc(DB.teams[r.teamId]?.name||r.teamId)} · 현장 ${r.series}시리즈 ${r.wins}승 (팀 결과)</p>`).join('')}
    ${!own?`<button class="ghost" data-interview-staff="${s.id}"${seen.interviewed?' disabled':''}>${seen.interviewed?'면접 완료':'면접'}</button>`:''}
    ${!own&&!staffCanHire(t,s)?`<label>교체 대상<select data-staff-replace="${s.id}"><option value="">대상 선택</option>${teamStaffMembers(t,staffDepartment(s.role)).map(x=>`<option value="${x.id}">${esc(x.name)} · ${STAFF_ROLES[x.role]}</option>`).join('')}</select></label>`:''}
    ${canOffer?`<div class="controls"><label>연봉 (억)<input type="number" min="0.1" step="0.1" inputmode="decimal" data-staff-salary="${s.id}" value="${staffAskingSalary(DB,t,s)}"></label><label>기간<select data-staff-years="${s.id}">${[1,2,3].map(y=>`<option value="${y}"${y===2?' selected':''}>${y}년</option>`).join('')}</select></label><button class="primary" data-hire-staff="${s.id}">${own?'재계약':'계약 제안'}</button></div>`:''}
    ${own?`<button class="ghost" data-fire-staff="${s.id}">계약 해지 · ${money(staffExitFee(DB,s))}</button>`:''}
    ${(s.history||[]).slice(-3).map(h=>`<p class="hint">${h.year} · ${({signing:'계약',renewal:'재계약',release:'해지',expire:'만료',retire:'은퇴'})[h.type]||esc(h.type)}${h.to?' · '+esc(DB.teams[h.to]?.name||h.to):''}</p>`).join('')}</details>`;
}
