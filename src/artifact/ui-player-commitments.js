// ===== LOL GM: compact player representation / oral promise controls =====
function playerCommitmentsPanel(p){
  const agent=playerAgent(p),oral=oralRolePromiseStatus(DB,p),t=DB.teams[p.team],
    floor=Math.max(SQUAD_ROLE_ORDER[p.contract?.promisedRole]??0,SQUAD_ROLE_ORDER[p.rosterRole]??0),
    roles=SQUAD_ROLES.filter(r=>SQUAD_ROLE_ORDER[r]>floor),
    canManage=!p.loan&&managerControlsSquad(DB,t)&&p.contract&&!p.contract.medicalReplacement&&p.contract.until>=DB.year,
    revisions=oral?SQUAD_ROLES.filter(r=>SQUAD_ROLE_ORDER[r]<SQUAD_ROLE_ORDER[oral.role]&&
      SQUAD_ROLE_ORDER[r]>=(SQUAD_ROLE_ORDER[p.contract?.promisedRole]??0)):[],
    canPromise=canManage&&!oral&&roles.length;
  return `<h4>협상 / 구두 약속</h4><p class="hint">${esc(playerRepresentativeText(p))}${agent?` · ${esc(CAREER_GOAL_KO[agent.focus]||agent.focus)}`:''}</p>
    ${oral?`<p>구두 약속 · <b>${SQUAD_ROLE_KO[oral.role]}</b> · ${oral.games}/${oral.teamGames}게임 · 기대 출전 ${Math.round(oral.expected*100)}% · ~${p.rolePromise.until}</p>`:'<p class="hint">진행 중인 구두 역할 약속이 없습니다.</p>'}
    ${canPromise?`<div class="controls"><label>추가 역할 약속 <select data-promise-role="${p.id}" aria-label="구두 약속 역할">${roles.map(r=>`<option value="${r}">${SQUAD_ROLE_KO[r]}</option>`).join('')}</select></label><button class="ghost" data-promise-preview="${p.id}">약속 내용 확인</button></div><p class="hint">계약을 바꾸지 않는 추가 기회 약속입니다. 기용하지 않으면 신뢰와 재계약 의향에 영향을 줍니다. 기존 약속은 반복 제안으로 초기화할 수 없습니다.</p>`:''}
    ${canManage&&revisions.length?`<div class="controls"><label>역할 축소 협의 <select data-promise-revision-role="${p.id}" aria-label="재협상 역할">${revisions.map(r=>`<option value="${r}">${SQUAD_ROLE_KO[r]}</option>`).join('')}</select></label><button class="ghost" data-promise-revise="${p.id}">선수 동의 확인</button></div>`:''}`;
}
function bindRolePromiseControls(){
  document.querySelectorAll('[data-promise-preview], [data-promise-revise]').forEach(b=>b.onclick=e=>{
    e.stopPropagation();
    const revision=!!b.dataset.promiseRevise,p=DB.players[b.dataset.promiseRevise||b.dataset.promisePreview],role=document.querySelector(
      `[data-promise-${revision?'revision-role':'role'}="${p.id}"]`).value,
      preview=previewWorldAction(DB,{type:revision?'player.promise-revise':'player.promise',pid:p.id,teamId:p.team,role,actor:'manager'});
    if(!preview.ok){MSG=(preview.errors||[]).join(' · ');navKeepScroll();return}
    if(!confirm(`${p.name} · ${SQUAD_ROLE_KO[role]} 구두 약속\n기대 출전 ${Math.round(preview.changes[0].expected*100)}% · ${preview.command.until}년 계약 종료까지\n${revision?'선수가 역할 축소에 동의했습니다. 이전 기용 기록과 신뢰 변화는 유지됩니다.':'약속 불이행은 감독 신뢰와 재계약에 영향을 줍니다.'} 확정할까요?`))return;
    const result=applyWorldAction(DB,preview);
    MSG=result.ok?(revision?'구두 역할 약속을 재협상했습니다':'구두 역할 약속을 확정했습니다'):(result.errors||[]).join(' · ');
    if(result.ok)saveDB();navKeepScroll();
  });
}
