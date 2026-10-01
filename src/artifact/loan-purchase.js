// A purchase is agreed by all three parties when the loan is signed. Exercise
// changes contract ownership, not sporting registration or the move counter.
function validateLoanPurchaseTerms(db,p,from,to,a,managingSource){
  if(a.purchase==null)return {ok:true,purchase:null};
  const quote=a.purchase,salary=quote.salary??quote.terms?.salary,years=quote.years??quote.terms?.years;
  if(!['option','obligation'].includes(quote.type)||!Number.isFinite(quote.fee)||quote.fee<0||
    !Number.isFinite(salary)||salary<=0||!Number.isInteger(years)||years<1||years>3||
    !contractGuaranteeTermsValid(quote.terms)||quote.type==='obligation'&&a.recall)
    return {ok:false,reason:'완전이적 조건이 유효하지 않습니다. 의무 매입과 조기 리콜은 함께 사용할 수 없습니다'};
  const terms=playerActionTerms(db,p,to,{...quote,salary,years}),plan=normalizeTransferFeePlan(db,quote.fee,quote.feePlan),
    detached=JSON.parse(JSON.stringify(from)),player=JSON.parse(JSON.stringify(p)),
    view={...db,players:{...db.players,[p.id]:player},teams:{...db.teams,[from.id]:detached},_marketDemandCache:{}};
  if(!plan.ok)return plan;
  if(plan.plan?.installments.some(row=>row.date<=loanEndDate(db,a.duration)))
    return {ok:false,reason:'매입 분할금은 임대 예정 종료일 이후 날짜여야 합니다'};
  if(!managingSource&&quote.fee+1e-8<sellerTransferAsk(view,player,detached)*.9)
    return {ok:false,reason:'원소속 구단이 매입 이적료를 거절했습니다'};
  if(to.finance.cash+1e-8<a.fee+plan.upfront+terms.signingBonus||
    quote.type==='obligation'&&to.finance.cash+1e-8<a.fee+quote.fee+terms.signingBonus)
    return {ok:false,reason:'매입 선지급금 또는 의무 매입 보장액을 확보할 수 없습니다'};
  const consent=contractTransferConsent(db,p,to,terms);
  if(!consent.ok||!consent.willing)return {ok:false,reason:'선수가 매입 후 개인 조건을 거절했습니다'};
  return {ok:true,purchase:{type:quote.type,fee:quote.fee,terms,feePlan:plan.plan,consent}};
}
function recordLoanConversionWages(db,p,owner,borrower,newSalary,nextSeason){
  const year=contractedMoveSeason(db);
  if(db.world?.contractWindow?.financePayroll)return; // The completed year's basis is already frozen.
  const total=Date.UTC(year+1,0,1)-Date.UTC(year,0,1),
    elapsed=nextSeason?1:clamp((Date.parse(db.worldDate+'T00:00:00Z')-Date.UTC(year,0,1))/total,0,1);
  for(const [t,amount] of [[owner,p.contract.salary*elapsed],[borrower,nextSeason?0:-newSalary*elapsed]]){
    if(!amount)continue;
    const f=t.finance;
    if(f.loanConversionWages&&f.loanConversionWages.year!==year)throw Error('이전 연도 소유권 정산이 남아 있습니다');
    f.loanConversionWages=f.loanConversionWages||{year,amount:0,players:{}};
    f.loanConversionWages.amount+=amount;
    f.loanConversionWages.players[p.id]=(f.loanConversionWages.players[p.id]||0)+amount;
  }
}
function validateLoanPurchase(db,a){
  const p=db.players[a.pid],loan=p?.loan,quote=loan?.purchase,
    from=playerActionTeam(db,a.fromId),to=playerActionTeam(db,a.teamId);
  if(!quote||!from||!to||loan.ownerId!==from.id||loan.borrowerId!==to.id||p.team!==to.id)
    return worldActionError('invalid_purchase','행사할 수 있는 임대 매입 합의가 없습니다');
  const due=db.worldDate>=loan.endDate||db.world?.phase==='offseason';
  if(a.actor==='system'){
    if(quote.type!=='obligation'||!due)return worldActionError('unauthorized','시스템은 만료된 의무 매입만 발효합니다');
  }else{
    const auth=playerActionAuthority(db,a.actor,to);if(auth)return auth;
    if(quote.type==='obligation'&&!due)return worldActionError('not_due','의무 매입은 합의한 임대 종료 시점에 발효합니다');
  }
  const upfront=quote.feePlan?quote.feePlan.upfront:quote.fee;
  if(quote.type==='option'&&to.finance.cash+1e-8<upfront+quote.terms.signingBonus)
    return worldActionError('insufficient_cash','옵션 매입 선지급금과 계약금이 부족합니다');
  if(!playerActionFinance(from)||!playerActionFinance(to))return worldActionError('invalid_finance','매입 구단 재정이 유효하지 않습니다');
  return {ok:true,pid:p.id,fromId:from.id,teamId:to.id,purchase:JSON.parse(JSON.stringify(quote)),
    startSeason:db.world?.phase==='offseason'?contractedMoveSeason(db)+1:db.year};
}
WORLD_ACTION_HANDLERS['player.loan-purchase']={validate:validateLoanPurchase,snapshot:loanSnapshot,
  canonical(db,a,v){const {ok,...c}=v;return {type:a.type,actor:a.actor,...c}},
  changes(db,c){return [{pid:c.pid,kind:'loan_purchase',from:c.fromId,to:c.teamId,
    fee:c.purchase.fee,salary:c.purchase.terms.salary,startSeason:c.startSeason}]},
  apply(db,c){
    const p=db.players[c.pid],loan=p.loan,from=db.teams[c.fromId],to=db.teams[c.teamId],quote=c.purchase;
    accrueLoanWages(db,p,db.worldDate);
    recordLoanConversionWages(db,p,from,to,quote.terms.salary,c.startSeason>contractedMoveSeason(db));
    delete p.loan;LOAN_INDEX.delete(db);
    settleTransferSigningFee(db,p,from,to,quote.fee,quote.feePlan);
    withContractStartSeason(db,c.startSeason,()=>signContract(db,p,to,quote.terms.salary,quote.terms.years,quote.terms));
    recordContractedMove(db,p,'loan_purchase_conversion',from,to);
    recordPlayerEvent(p,'loan_purchase',db.year,{from:from.id,to:to.id,fee:quote.fee,
      clause:quote.type,date:db.worldDate,startSeason:c.startSeason,loanStartDate:loan.startDate});
    news(db,p.name+' 임대 후 완전이적 · '+to.short);
    return {pid:p.id,teamId:to.id};
  }};
function loanPurchaseDescription(loan){
  const p=loan?.purchase;if(!p)return '매입 조항 없음';
  return (p.type==='option'?'선택 매입':'만료 시 의무 매입')+' · '+money(p.fee)+' · '+money(p.terms.salary)+' / '+p.terms.years+'년';
}
// Accrued loan salary is shared by returns and permanent ownership conversion.
function recordLoanWageAdjustment(t,year,amount,pid){
  if(!Number.isFinite(amount)||!t?.finance)throw new Error('임대 급여 정산 정보가 유효하지 않습니다');
  const f=t.finance;
  if(f.loanWages&&f.loanWages.year!==year)throw new Error('미정산 임대 급여 연도가 다릅니다');
  f.loanWages=f.loanWages||{year,amount:0,players:{}};f.loanWages.amount+=amount;
  f.loanWages.players[pid]=(f.loanWages.players[pid]||0)+amount;
}
