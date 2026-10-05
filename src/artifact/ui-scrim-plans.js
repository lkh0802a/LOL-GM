function scrimPlansPanel(t,db=DB,canAct=scrimUiAllowed(db,t)){
  if(db.world?.fired||db.world?.phase!=='season'||!managerControlsSquad(db,t))return '';
  const status={accepted:'예약 확정',declined:'상대 거절',cancelled:'취소',completed:'완료',blocked:'진행 불가'},
    rows=scrimPlans(db).filter(p=>p.teamId===t.id||p.opponentId===t.id).slice(-12).reverse();
  return `<section><h3>스크림 요청</h3>${canAct?`<div class="controls"><label>날짜<input id="scrimdate" type="date" min="${addDays(db.worldDate,1)}" max="${addDays(db.worldDate,7)}" value="${addDays(db.worldDate,1)}"></label><label>상대<select id="scrimpartner">${activeTeams(db).filter(o=>o.id!==t.id).map(o=>`<option value="${esc(o.id)}">${esc(o.name)}</option>`).join('')}</select></label><label>시간<select id="scrimslot"><option value="afternoon">오후</option><option value="evening">저녁</option></select></label><label>세트<select id="scrimgames">${[1,2,3].map(n=>`<option>${n}</option>`).join('')}</select></label><button class="primary" id="scrimrequest">상대에게 요청</button></div>`:'<p class="hint">현재 수동 요청 권한이 없습니다.</p>'}<p class="hint">상대가 수락하면 양팀 시간을 예약합니다. 경기·회복 상황이 바뀌면 당일 취소될 수 있습니다.</p>${rows.map(p=>`<div class="mrow"><span>${esc(p.date)} ${p.slot==='afternoon'?'오후':'저녁'} · ${esc(db.teams[p.teamId===t.id?p.opponentId:p.teamId]?.short||'구단')} · ${p.games}세트 · ${status[p.status]||'확인 중'}<small class="hint"> ${esc(p.reason)}${Number.isInteger(p.playedGames)?` · 실제 진행 ${p.playedGames}세트`:""}</small></span>${canAct&&p.status==='accepted'&&p.date>db.worldDate?`<button class="ghost" data-scrim-cancel="${esc(p.id)}">취소</button>`:''}</div>`).join('')}</section>`;
}
function bindScrimPlans(allowed=null,root=document,after=null,tid=SQUAD){
  const t=DB.teams[tid],current=t?scrimUiGuard(t,allowed||(()=>SQUAD===tid)):()=>false;
  const submit=command=>{
    if(!current())return;
    const read=JSON.parse(JSON.stringify(DB)),preview=previewWorldAction(read,command);
    if(!preview.ok){finish(preview.errors.join(' · '),false);return}
    if(!confirm(command.type==='scrim.cancel'?'이 예정 스크림을 취소할까요?':`${command.date} ${command.slot==='afternoon'?'오후':'저녁'} ${command.games}세트 요청을 보낼까요? 상대의 수락과 당일 진행은 보장하지 않습니다.`)||!current())return;
    const result=commitWorldAction(DB,command);
    finish(result.ok?(result.reason||'스크림 일정을 취소했습니다'):result.errors.join(' · '),result.ok);
  };
  const finish=(msg,changed)=>{MSG=msg;if(after){after(msg,changed);return}if(changed)saveDB();navKeepScroll()};
  const request=root.querySelector('#scrimrequest');if(request)request.onclick=()=>{if(!current())return;submit({type:'scrim.request',actor:'manager',teamId:tid,opponentId:root.querySelector('#scrimpartner').value,date:root.querySelector('#scrimdate').value,slot:root.querySelector('#scrimslot').value,games:+root.querySelector('#scrimgames').value});};
  root.querySelectorAll('[data-scrim-cancel]').forEach(b=>b.onclick=()=>submit({type:'scrim.cancel',actor:'manager',id:b.dataset.scrimCancel}));
}
