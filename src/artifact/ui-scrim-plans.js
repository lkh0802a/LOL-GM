function scrimPlansPanel(t){
  if(DB.world?.fired||DB.world?.phase!=='season'||!managerControlsSquad(DB,t))return '';
  const status={accepted:'예약 확정',declined:'상대 거절',cancelled:'취소',completed:'완료',blocked:'진행 불가'},
    rows=scrimPlans(DB).filter(p=>p.teamId===t.id||p.opponentId===t.id).slice(-12).reverse();
  return `<section><h3>스크림 요청</h3><div class="controls"><label>날짜<input id="scrimdate" type="date" min="${addDays(DB.worldDate,1)}" max="${addDays(DB.worldDate,7)}" value="${addDays(DB.worldDate,1)}"></label><label>상대<select id="scrimpartner">${activeTeams(DB).filter(o=>o.id!==t.id).map(o=>`<option value="${esc(o.id)}">${esc(o.name)}</option>`).join('')}</select></label><label>시간<select id="scrimslot"><option value="afternoon">오후</option><option value="evening">저녁</option></select></label><label>세트<select id="scrimgames">${[1,2,3].map(n=>`<option>${n}</option>`).join('')}</select></label><button class="primary" id="scrimrequest">상대에게 요청</button></div><p class="hint">상대가 수락하면 양팀 시간을 예약합니다. 경기·회복 상황이 바뀌면 당일 취소될 수 있습니다.</p>${rows.map(p=>`<div class="mrow"><span>${esc(p.date)} ${p.slot==='afternoon'?'오후':'저녁'} · ${esc(DB.teams[p.teamId===t.id?p.opponentId:p.teamId]?.short||'구단')} · ${p.games}세트 · ${status[p.status]||'확인 중'}<small class="hint"> ${esc(p.reason)}</small></span>${p.status==='accepted'&&p.date>DB.worldDate?`<button class="ghost" data-scrim-cancel="${esc(p.id)}">취소</button>`:''}</div>`).join('')}</section>`;
}
function bindScrimPlans(){
  const submit=command=>{
    const preview=previewWorldAction(DB,command);
    if(!preview.ok){MSG=preview.errors.join(' · ');navKeepScroll();return}
    const result=applyWorldAction(DB,preview);
    MSG=result.ok?(result.reason||'스크림 일정을 취소했습니다'):result.errors.join(' · ');
    if(result.ok)saveDB();navKeepScroll();
  };
  if($('#scrimrequest'))$('#scrimrequest').onclick=()=>submit({type:'scrim.request',teamId:SQUAD,opponentId:$('#scrimpartner').value,date:$('#scrimdate').value,slot:$('#scrimslot').value,games:+$('#scrimgames').value});
  document.querySelectorAll('[data-scrim-cancel]').forEach(b=>b.onclick=()=>submit({type:'scrim.cancel',id:b.dataset.scrimCancel}));
}
