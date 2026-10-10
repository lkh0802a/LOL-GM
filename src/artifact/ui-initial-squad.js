// Initial organization status lives on the squad screen; recruitment stays manual.
function initialSquadOverviewAllowed(){return DB?.world?.phase==='initial_roster'&&!DB.world.fired&&!!managedTeam(DB)&&!managedTeam(DB).parent}
function initialSquadRoute(f,bind=false){if(!initialSquadOverviewAllowed())return f();return bind?bindInitialSquadOverview():renderInitialSquadOverview()}
function initialOrganizationCards(view,squads){return squads.map(t=>{const errors=initialSquadErrors(view,t),lim=initialSquadLimits(view,t),pay=payroll(view,t);return `<section><h3>${esc(t.name)} <small class="${errors.length?'warn':'hi'}">${t.roster.length}/${lim.max}명 · ${errors.length?'미완성':'등록 가능'}</small></h3><p>연봉 ${money(pay)} / 예산 ${money(initialSalaryBudget(view,t))} · 비로컬 ${teamNonLocalCount(view,t)}/${nonLocalLimitForTeam(view,t)}명</p>${errors.length?`<p class="warn">${errors.map(esc).join(' · ')}</p>`:''}${t.roster.length?`<div class="scroll"><table><thead><tr><th>포지션</th><th>선수</th><th>연봉</th><th>계약</th><th>선수 관리</th></tr></thead><tbody>${t.roster.map(id=>{const p=view.players[id];return `<tr><td>${ROLE_KO[p.role]}</td><td>${esc(p.name)}</td><td>${money(p.contract.salary)}</td><td>${p.contract.years}년${p.contract.signingBonus?' · 계약금 '+money(p.contract.signingBonus):''}</td><td><button class="linklike" type="button" data-init-release="${p.id}">FA로 되돌리기</button></td></tr>`}).join('')}</tbody></table></div>`:'<p class="hint">아직 등록 선수가 없습니다.</p>'}</section>`}).join('')}
function renderInitialSquadOverview(){
 initialCandidateContext(DB);const view=JSON.parse(JSON.stringify(DB)),root=managedTeam(view),squads=setupTeamsForManager(view);
 return `<section class="teamhead"><h2>선수단 구성</h2><p>${esc(root.name)} · 첫 시즌 준비</p><button id="init-back-recruitment" class="linklike" type="button">FA 영입으로 돌아가기</button></section>${MSG?`<p role="status">${esc(MSG)}</p>`:''}${initialOrganizationCards(view,squads)}<p class="hint">현재 계약·등록 조건입니다. 시즌 개막은 FA 영입 화면에서 직접 확정합니다.</p>`;
}
function initialOrganizationGuard(){
 const db=DB,world=DB.world,manager=DB.manager,owner=managedTeamId(DB),slot=SLOT,view=VIEW,render=UI_RENDER_ID,date=DB.worldDate,year=DB.year,manage=DB.world.manage,teams=setupTeamsForManager(DB),snapshot=()=>JSON.stringify(teams.map(t=>[t.id,DB.teams[t.id]===t,t.roster,t.finance,t.registration,t.roster.map(id=>[id,DB.players[id]?.team,DB.players[id]?.contract])])),before=snapshot();
 return ()=>DB===db&&DB.world===world&&DB.manager===manager&&managedTeamId(DB)===owner&&SLOT===slot&&VIEW===view&&UI_RENDER_ID===render&&DB.worldDate===date&&DB.year===year&&DB.world.manage===manage&&!SLOT_SWITCHING&&!UI_OVERLAY&&initialSquadOverviewAllowed()&&snapshot()===before;
}
function bindInitialSquadOverview(){
 const current=initialOrganizationGuard();document.getElementById('init-back-recruitment').onclick=()=>{if(current())navigateTo('transfer')};
 document.querySelectorAll('[data-init-release]').forEach(b=>b.onclick=()=>{if(!current()||DB.world.manage!=='manual')return;const pid=b.dataset.initRelease,p=DB.players[pid];if(!p||!setupTeamsForManager(DB).some(t=>t.id===p.team&&t.roster.includes(pid)))return;MSG=initialReleasePlayer(DB,pid);saveDB();navKeepScroll()});
}
