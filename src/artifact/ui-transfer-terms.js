// Advanced economic terms are collapsed on small screens. Preview always shows
// guaranteed cost separately from contingent bonuses before confirmation.
function transferFeeOfferFields(id){
  return `<details class="cfgcard"><summary>분할 지급 / 성과 이적료</summary><div class="controls">
    <label>선지급 비율<select data-fee-upfront="${id}"><option value="100">100%</option><option value="50">50%</option><option value="0">0%</option></select></label>
    <label>추가 지급 조건<select data-fee-kind="${id}"><option value="appearances">공식 출전 게임</option><option value="international">국제대회 출전 게임</option><option value="titles">구단 우승</option></select></label>
    <label>조건 횟수<input data-fee-threshold="${id}" type="number" min="1" max="200" value="10" inputmode="numeric"></label>
    <label>조건 달성 추가금 (억)<input data-fee-bonus="${id}" type="number" min="0" step="0.1" value="0" inputmode="decimal"></label></div>
    <p class="hint">잔금은 이적 30일 후, 매입 조항은 임대 예정 종료 30일 후 지급합니다. 추가금 조건의 유효기간은 이적/임대 예정 종료 후 1년입니다. 조건부 추가금은 보장 이적료와 별도입니다.</p></details>`;
}
function transferFeePlanFromDom(id,fee,anchor=DB.worldDate,root=document){
  const read=key=>root.querySelector(`[data-fee-${key}="${id}"]`),
    fraction=Number(read('upfront')?.value??100)/100,
    upfront=Math.round(fee*fraction*10)/10,bonus=Number(read('bonus')?.value||0),
    installment=Math.round((fee-upfront)*10)/10;
  if(fraction===1&&!bonus)return null;
  return {upfront,installments:installment?[{date:addDays(anchor,30),amount:installment}]:[],
    addOns:bonus?[{kind:read('kind').value,threshold:Number(read('threshold').value),amount:bonus,through:addDays(anchor,365)}]:[]};
}
function transferFeePlanText(plan){
  if(!plan)return '이적료 전액 선지급';
  return '선지급 '+money(plan.upfront)+plan.installments.map(r=>' · '+r.date+' '+money(r.amount)).join('')+
    plan.addOns.map(r=>' · '+({appearances:'공식 출전',international:'국제전 출전',titles:'구단 우승'}[r.kind])+
      ' '+r.threshold+'회 달성 시 '+money(r.amount)+' (~'+r.through+')').join('');
}
function loanPurchaseOfferFields(p){
  return `<details class="cfgcard"><summary>임대 후 매입 조항</summary><div class="controls">
    <label>매입 방식<select data-purchase-type="${p.id}"><option value="none">없음</option><option value="option">선택 매입 옵션</option><option value="obligation">만료 시 의무 매입</option></select></label>
    <label>매입 이적료 (억)<input data-purchase-fee="${p.id}" type="number" min="0" step="0.1" value="${transferFee(DB,p)}" inputmode="decimal"></label>
    <label>매입 후 연봉 (억)<input data-purchase-salary="${p.id}" type="number" min="0.1" step="0.1" value="${p.contract.salary}" inputmode="decimal"></label>
    <label>매입 후 기간<select data-purchase-years="${p.id}">${[1,2,3].map(y=>`<option value="${y}"${y===2?' selected':''}>${y}년</option>`).join('')}</select></label></div>
    <p class="hint">선수와 양 구단이 새 계약까지 사전 동의합니다. 의무 매입은 임대 종료 시 자동 발효되며 조기 리콜과 함께 선택할 수 없습니다. 시즌 종료 시 매입 계약은 다음 시즌부터 시작합니다.</p>
    ${transferFeeOfferFields('loan/'+p.id)}</details>`;
}
function loanPurchaseFromDom(p,role,duration){
  const read=key=>document.querySelector(`[data-purchase-${key}="${p.id}"]`),type=read('type')?.value||'none';
  if(type==='none')return null;
  const fee=Number(read('fee').value);
  return {type,fee,salary:Number(read('salary').value),years:Number(read('years').value),
    terms:{promisedRole:role},feePlan:transferFeePlanFromDom('loan/'+p.id,fee,loanEndDate(DB,duration))};
}
function loanPurchaseControls(p){
  const loan=p.loan,q=loan?.purchase,mine=managedTeam(DB),to=DB.teams[loan?.borrowerId];
  if(!q)return '';
  return `<p>${esc(loanPurchaseDescription(loan))}</p><p class="hint">${esc(transferFeePlanText(q.feePlan))}</p>
    ${q.type==='option'&&mine&&!mine.parent&&parentTeamOf(DB,to).id===mine.id?
      `<button class="primary" data-loan-purchase="${p.id}">매입 내용 확인</button>`:''}`;
}
function bindLoanPurchaseControls(){
  document.querySelectorAll('[data-loan-purchase]').forEach(b=>b.onclick=e=>{
    e.stopPropagation();const p=DB.players[b.dataset.loanPurchase],loan=p.loan,
      preview=previewWorldAction(DB,{type:'player.loan-purchase',actor:'manager',pid:p.id,
        fromId:loan.ownerId,teamId:loan.borrowerId});
    if(!preview.ok){MSG=preview.errors.join(' · ');navKeepScroll();return}
    if(!confirm(p.name+' 완전이적\n'+loanPurchaseDescription(loan)+'\n'+transferFeePlanText(loan.purchase.feePlan)+
      '\n계약 소유권을 이전하고 임대 복귀 자리를 해제합니다. 확정할까요?'))return;
    const result=applyWorldAction(DB,preview);MSG=result.ok?'임대 후 완전이적 완료':result.errors.join(' · ');
    if(result.ok)saveDB();navKeepScroll();
  });
}
function transferPaymentsPanel(t,db=DB){
  const deals=transferDealRows(t),exposure=transferPaymentExposure(t);if(!deals.length)return '';
  return `<details class="cfgcard"><summary>분할 / 성과 이적료 · 미지급 보장 ${money(exposure.guaranteed)}</summary>
    <p class="hint">미달성 추가금 최대 ${money(exposure.contingent)} · 지급한 이적료는 결산에서 중복 차감하지 않습니다. 현금 부족 시 미지급액을 보존합니다.</p>
    ${deals.map(d=>`<div class="cfgcard"><b>${esc(db.players[d.pid]?.name||d.pid)}</b> · ${d.fromId===t.id?'받을 금액':'지급할 금액'}
      ${d.rows.map(r=>`<p>${esc(r.date||r.through)} · ${money(r.amount)} · 지급 ${money(r.paid)} · ${({pending:'예정 / 조건 미달성',earned:'지급 의무 발생',paid:'지급 완료',expired:'조건 만료'})[r.status]}</p>`).join('')}</div>`).join('')}</details>`;
}
