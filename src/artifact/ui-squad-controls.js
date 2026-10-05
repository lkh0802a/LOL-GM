// Current-context bindings for the existing staged roster/preparation inputs.
function bindSquadDraftControls(root=document){
  const t=DB.teams[SQUAD],current=t&&practiceUiAllowed(DB,t)?practiceUiGuard(t,()=>SQUAD===t.id):()=>false;
  root.querySelectorAll('[data-squad-dst]').forEach(el=>el.onchange=e=>{e.stopPropagation();if(!current())return;const d=squadEditState(t);d.rosterPlan.assignments[el.dataset.squadDst]=el.value;d.dirty=true;navKeepScroll()});
  root.querySelectorAll('[data-lineup-player]').forEach(el=>{el.onclick=e=>e.stopPropagation();el.onchange=e=>{e.stopPropagation();if(!current())return;const pid=el.dataset.lineupPlayer,d=squadEditState(t);if(!DB.players[pid]||d.rosterPlan.assignments[pid]!==SQUAD)return;const next=el.value;for(const r of ROLES)if(d.starters[r]===pid)delete d.starters[r];if(next)d.starters[next]=pid;d.dirty=true;navKeepScroll()}});
  root.querySelectorAll('[data-srole]').forEach(el=>{el.onclick=e=>e.stopPropagation();el.onchange=e=>{e.stopPropagation();if(!current())return;const p=DB.players[el.dataset.srole],d=squadEditState(t);if(p&&d.rosterPlan.assignments[p.id]===SQUAD){d.roles[p.id]=el.value;d.dirty=true}}});
  root.querySelectorAll('[data-tac]').forEach(el=>el.oninput=el.onchange=e=>{if(!current())return;const k=el.dataset.tac;const d=squadEditState(t);d.tactics[k]=+el.value;d.dirty=true;if(el.previousElementSibling)el.previousElementSibling.querySelector('output').textContent=el.value});
}
