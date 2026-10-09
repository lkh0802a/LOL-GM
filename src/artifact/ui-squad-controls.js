// Current-context bindings for the existing staged roster/preparation inputs.
function bindSquadDraftControls(root=document){
  const t=DB.teams[SQUAD],current=t&&practiceUiAllowed(DB,t)?practiceUiGuard(t,()=>SQUAD===t.id):()=>false;
  root.querySelectorAll('[data-squad-dst]').forEach(el=>el.onchange=e=>{e.stopPropagation();if(!current())return;const d=squadEditState(t);d.rosterPlan.assignments[el.dataset.squadDst]=el.value;d.dirty=true;navKeepScroll()});
  root.querySelectorAll('[data-lineup-player]').forEach(el=>{el.onclick=e=>e.stopPropagation();el.onchange=e=>{e.stopPropagation();if(!current())return;const pid=el.dataset.lineupPlayer,d=squadEditState(t);if(!DB.players[pid]||d.rosterPlan.assignments[pid]!==SQUAD)return;const next=el.value;for(const r of ROLES)if(d.starters[r]===pid)delete d.starters[r];if(next)d.starters[next]=pid;d.dirty=true;navKeepScroll()}});
  root.querySelectorAll('[data-srole]').forEach(el=>{el.onclick=e=>e.stopPropagation();el.onchange=e=>{e.stopPropagation();if(!current())return;const p=DB.players[el.dataset.srole],d=squadEditState(t);if(p&&d.rosterPlan.assignments[p.id]===SQUAD){d.roles[p.id]=el.value;d.dirty=true}}});
  root.querySelectorAll('[data-tac]').forEach(el=>el.oninput=el.onchange=e=>{if(!current())return;const k=el.dataset.tac;const d=squadEditState(t);d.tactics[k]=+el.value;d.dirty=true;if(el.previousElementSibling)el.previousElementSibling.querySelector('output').textContent=el.value});
}

// Public club lookup changes presentation only; retained callbacks cannot cross contexts.
function renderSquadEmpty(){
  return `${renderClubHomeSquadControls('<option value="">조회할 구단 선택</option>'+teamOpts(null))}<section><h2>조회할 선수단을 선택하세요</h2><p>현재 관리 구단이 없습니다. 구단을 선택하면 공개 명단과 관측 정보를 확인할 수 있습니다.</p></section>`;
}
function bindSquadTeamSelection(){
  const el=$('#sq');if(!el)return;
  const db=DB,world=DB.world,manager=DB.manager,team=DB.manager?.teamId,slot=SLOT,view=VIEW,render=UI_RENDER_ID,squad=SQUAD,date=DB.worldDate,year=DB.year,mode=world?.manage,fired=world?.fired;
  el.onchange=e=>{
    if(DB!==db||DB.world!==world||DB.manager!==manager||DB.manager?.teamId!==team||SLOT!==slot||VIEW!==view||UI_RENDER_ID!==render||SQUAD!==squad||DB.worldDate!==date||DB.year!==year||world?.manage!==mode||world?.fired!==fired||SLOT_SWITCHING||UI_OVERLAY)return;
    const id=e.target.value,t=DB.teams[id];
    if(!t||t.active===false||!managerSelectableTeams(DB,t.region,t.division).some(x=>x.id===id))return;
    SQUAD=id;OPEN_P=null;nav();
  };
}
