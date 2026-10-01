// Touch controls use a pure preview followed by explicit confirmation.
function playerLoanPanel(p){
  const mine=managedTeam(DB),loan=p.loan;
  if(loan){
    const owner=DB.teams[loan.ownerId],borrower=DB.teams[loan.borrowerId],
      canRecall=loan.recall&&!mine?.parent&&parentTeamOf(DB,owner)?.id===mine?.id;
    return `<h4>임대</h4><p>계약 구단 ${esc(owner.short)} · 출전 구단 ${esc(borrower.short)}</p>
      <p>~${loan.endDate}${loan.duration==='season'?' · 시즌 종료 시 복귀':''} · ${SQUAD_ROLE_KO[loan.promisedRole]} · 임대료 ${money(loan.fee)} · 임대 구단 급여 ${Math.round(loan.salaryShare*100)}% · ${loan.recall?'조기 복귀 가능':'조기 복귀 불가'}</p>
      ${loan.purchase?loanPurchaseControls(p):''}
      ${canRecall?`<button class="ghost" data-loan-return="${p.id}">조기 복귀 내용 확인</button>`:''}`;
  }
  if(!mine||mine.parent||!p.team||!p.contract||p.retired)return '';
  const outgoing=parentTeamOf(DB,DB.teams[p.team])?.id===mine.id,
    targets=outgoing?activeTeams(DB).filter(t=>parentTeamOf(DB,t)?.id!==mine.id&&loanMarketOpen(DB,t)):[];
  if(outgoing?!targets.length:!loanMarketOpen(DB,mine))return '';
  return `<h4>임대 제안</h4><div class="controls">
    ${outgoing?`<label>도착 구단<select data-loan-target="${p.id}">${targets.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></label>`:''}
    <label>기간<select data-loan-duration="${p.id}"><option value="half">반 시즌</option><option value="season">이번 시즌</option></select></label>
    <label>기회<select data-loan-role="${p.id}">${SQUAD_ROLES.map(r=>`<option value="${r}"${r==='starter'?' selected':''}>${SQUAD_ROLE_KO[r]}</option>`).join('')}</select></label>
    <label>급여 부담 (%)<input data-loan-share="${p.id}" type="number" min="0" max="100" value="100" inputmode="decimal"></label>
    <label>임대료 (억)<input data-loan-fee="${p.id}" type="number" min="0" step="0.1" value="0" inputmode="decimal"></label>
    <label><input data-loan-recall="${p.id}" type="checkbox">원소속 조기 리콜 허용</label>
    </div>${loanPurchaseOfferFields(p)}<button class="primary" data-loan-preview="${p.id}">제안 내용 확인</button>
    <p class="hint">원계약과 연봉은 유지됩니다. 선수와 원소속 구단 동의가 필요합니다. 반 시즌은 7월 1일 또는 이번 시즌 종료까지입니다. 임대 중에는 방출·재계약·다른 구단 이적이 제한됩니다.</p>`;
}
function bindLoanControls(){
  const read=(key,id)=>document.querySelector(`[data-loan-${key}="${id}"]`);
  const apply=preview=>{
    if(!preview.ok){MSG=(preview.errors||[]).join(' · ');navKeepScroll();return}
    const c=preview.command,p=DB.players[c.pid],returning=c.type==='player.loan-return';
    if(!confirm(returning?`${p.name} 선수를 원소속으로 즉시 복귀시킬까요?`:
      `${p.name} 임대 · ${c.endDate}까지\n임대료 ${money(c.fee)} · 급여 ${Math.round(c.salaryShare*100)}%\n${SQUAD_ROLE_KO[c.promisedRole]} · ${c.recall?'리콜 허용':'리콜 없음'}\n${loanPurchaseDescription(c)}\n${c.purchase?transferFeePlanText(c.purchase.feePlan):''}\n확정할까요?`))return;
    const result=applyWorldAction(DB,preview);
    MSG=result.ok?(returning?'임대 복귀 완료':'임대 계약 완료'):(result.errors||[]).join(' · ');
    if(result.ok)saveDB();navKeepScroll();
  };
  document.querySelectorAll('[data-loan-preview]').forEach(b=>b.onclick=e=>{
    e.stopPropagation();const id=b.dataset.loanPreview,p=DB.players[id];
    apply(previewWorldAction(DB,{type:'player.loan',pid:id,fromId:p.team,
      teamId:read('target',id)?.value||managedTeamId(DB),actor:'manager',duration:read('duration',id).value,
      promisedRole:read('role',id).value,salaryShare:Number(read('share',id).value)/100,
      fee:Number(read('fee',id).value),recall:read('recall',id).checked,
      purchase:loanPurchaseFromDom(p,read('role',id).value,read('duration',id).value)}));
  });
  document.querySelectorAll('[data-loan-return]').forEach(b=>b.onclick=e=>{
    e.stopPropagation();const p=DB.players[b.dataset.loanReturn];
    apply(previewWorldAction(DB,{type:'player.loan-return',pid:p.id,
      fromId:p.loan.borrowerId,teamId:p.loan.ownerId,actor:'manager'}));
  });
}
function squadLoanPanel(t){
  const players=loanOutgoingPlayers(DB,t);if(!players.length)return '';
  return `<section><h3>임대 중인 선수</h3>${players.map(p=>`<div class="mrow"><span><b>${esc(p.name)}</b> · ${esc(DB.teams[p.team].short)} · ~${p.loan.endDate} · 급여 부담 ${Math.round((1-p.loan.salaryShare)*100)}%</span>${p.loan.recall&&managerControlsSquad(DB,t)&&!managedTeam(DB)?.parent?`<button class="ghost" data-loan-return="${p.id}">조기 복귀</button>`:''}</div>`).join('')}<p class="hint">계약은 원소속 구단이 유지하며 복귀 인원과 비로컬 자리를 확보합니다.</p></section>`;
}
