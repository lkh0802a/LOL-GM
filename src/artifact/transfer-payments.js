// Club-to-club invoices live in both finance journals. Payment, including a
// partial payment in distress, always uses the existing prepaid cash writers.
function normalizeTransferFeePlan(db,fee,input){
  if(input==null)return {ok:true,plan:null,upfront:fee};
  const moneyValid=n=>Number.isFinite(n)&&n>=0&&Math.abs(n*10-Math.round(n*10))<1e-7,
    validDate=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&
      new Date(d+'T00:00:00Z').toISOString().slice(0,10)===d,
    through=addDays(db.worldDate,730),installments=input.installments||[],addOns=input.addOns||[];
  if(!moneyValid(fee)||!moneyValid(input.upfront)||!Array.isArray(installments)||installments.length>6||
    !Array.isArray(addOns)||addOns.length>3||
    installments.some(r=>!r||!moneyValid(r.amount)||r.amount<=0||!validDate(r.date)||r.date<=db.worldDate||r.date>through)||
    addOns.some(r=>!r||!['appearances','international','titles'].includes(r.kind)||!Number.isInteger(r.threshold)||
      r.threshold<1||r.threshold>200||!moneyValid(r.amount)||r.amount<=0||!validDate(r.through)||
      r.through<db.worldDate||r.through>through)||
    Math.abs(input.upfront+installments.reduce((n,r)=>n+r.amount,0)-fee)>1e-7)
    return {ok:false,reason:'분할금·선지급 합계, 날짜 또는 성과 조건이 유효하지 않습니다'};
  return {ok:true,upfront:input.upfront,plan:{upfront:input.upfront,
    installments:installments.map(r=>({date:r.date,amount:r.amount})),
    addOns:addOns.map(r=>({kind:r.kind,threshold:r.threshold,amount:r.amount,through:r.through}))}};
}
function transferDealRows(t){return Object.values(t?.finance?.transferDeals||{})}
function transferCounter(p,teamId,kind){return p?.transferCounters?.[teamId]?.[kind]||0}
function recordTransferAppearances(p,teamId,games,international){
  const c=p.transferCounters?.[teamId];if(!c||!games)return;
  c.appearances+=games;if(international)c.international+=games;
}
function writeTransferDeal(db,deal){
  for(const id of [deal.fromId,deal.teamId]){
    const f=db.teams[id].finance;f.transferDeals=f.transferDeals||{};
    f.transferDeals[deal.id]=JSON.parse(JSON.stringify(deal));
    const closed=transferDealRows(db.teams[id]).filter(d=>d.rows.every(r=>r.status==='paid'||r.status==='expired'));
    for(const old of closed.slice(0,Math.max(0,closed.length-10)))delete f.transferDeals[old.id];
  }
}
function settleTransferSigningFee(db,p,from,to,fee,plan=null){
  const upfront=plan?plan.upfront:fee;
  receiveFinancePrepaidTransfer(from,upfront);payFinancePrepaid(to,'transferPaid',upfront);
  if(!plan)return;
  const f=from.finance;f.transferSequence=(f.transferSequence||0)+1;
  p.transferCounters=p.transferCounters||{};
  p.transferCounters[to.id]=p.transferCounters[to.id]||{appearances:0,international:0};
  const rows=[...plan.installments.map(r=>({...r,kind:'installment',paid:0,status:'pending'})),
    ...plan.addOns.map(r=>({...r,baseline:transferCounter(p,to.id,r.kind),
      observedTitles:[],excludedTitles:Object.values(db.world?.seasons||{}).filter(s=>s.done).map(s=>s.year+'/'+s.id),
      paid:0,status:'pending'}))];
  writeTransferDeal(db,{id:from.id+'/'+f.transferSequence,pid:p.id,fromId:from.id,teamId:to.id,
    date:db.worldDate,fee,upfront,rows});
}
function transferInvoiceReview(db,deal){
  const p=db.players[deal.pid],date=db.worldDate;
  return deal.rows.map(row=>{
    const r=JSON.parse(JSON.stringify(row));if(r.status!=='pending')return r;
    if(r.kind==='installment'){if(r.date<=date)r.status='earned';return r}
    let count=transferCounter(p,deal.teamId,r.kind)-r.baseline;
    if(r.kind==='titles'){
      const titles=Object.values(db.world?.seasons||{}).filter(s=>s.done&&s.champion===deal.teamId&&
        s.days?.length&&seasonLastDate(s)>=deal.date&&seasonLastDate(s)<=r.through)
        .map(s=>s.year+'/'+s.id).filter(id=>!(r.excludedTitles||[]).includes(id));
      r.observedTitles=Array.from(new Set([...(r.observedTitles||[]),...titles]));count=r.observedTitles.length;
    }
    if(count>=r.threshold&&date<=r.through||r.kind==='titles'&&count>=r.threshold){r.status='earned';r.date=date}
    else if(date>r.through)r.status='expired';
    return r;
  });
}
function validateTransferPayment(db,a){
  const from=db.teams[a.fromId],to=db.teams[a.teamId],deal=to?.finance?.transferDeals?.[a.dealId];
  if(a.actor!=='system')return worldActionError('unauthorized','이적료 지급은 합의한 일정에 따라 정산합니다');
  if(!deal||deal.fromId!==from?.id||deal.teamId!==to?.id||
    JSON.stringify(deal)!==JSON.stringify(from.finance?.transferDeals?.[deal.id])||
    !playerActionFinance(from)||!playerActionFinance(to))
    return worldActionError('invalid_invoice','양측 이적료 정산 기록이 일치하지 않습니다');
  const rows=transferInvoiceReview(db,deal),payments=[];let cash=Math.max(0,to.finance.cash);
  for(let i=0;i<rows.length;i++){
    const row=rows[i];if(row.status!=='earned')continue;
    const amount=Math.floor((Math.min(cash,row.amount-row.paid)+1e-8)*10)/10;
    if(amount>0){payments.push({index:i,amount});cash-=amount}
  }
  return {ok:true,pid:deal.pid,fromId:from.id,teamId:to.id,dealId:deal.id,rows,payments};
}
WORLD_ACTION_HANDLERS['finance.transfer-payment']={validate:validateTransferPayment,
  canonical(db,a,v){const {ok,...c}=v;return {type:a.type,actor:a.actor,...c}},
  snapshot(db,c){return JSON.parse(JSON.stringify({date:db.worldDate,
    teams:[c.fromId,c.teamId].map(id=>db.teams[id].finance),
    counters:db.players[c.pid]?.transferCounters||null,
    titles:Object.values(db.world?.seasons||{}).filter(s=>s.done&&s.champion===c.teamId).map(s=>[s.year,s.id])}))},
  changes(db,c){return c.payments.map(r=>({kind:'transfer_payment',...r}))},
  apply(db,c){
    const deal=JSON.parse(JSON.stringify(db.teams[c.teamId].finance.transferDeals[c.dealId]));deal.rows=c.rows;
    for(const {index,amount} of c.payments){
      payFinancePrepaid(db.teams[c.teamId],'transferPaid',amount);
      receiveFinancePrepaidTransfer(db.teams[c.fromId],amount);
      const row=deal.rows[index];row.paid=Math.round((row.paid+amount)*10)/10;
      if(row.paid>=row.amount)row.status='paid';
    }
    writeTransferDeal(db,deal);return {payments:c.payments};
  }};
function processTransferPayments(db){
  for(const t of Object.values(db.teams))for(const d of transferDealRows(t)){
    if(d.teamId!==t.id||d.rows.every(r=>r.status==='paid'||r.status==='expired'))continue;
    const reviewed=transferInvoiceReview(db,d),due=reviewed.some(r=>r.status==='earned'&&r.paid<r.amount),
      changed=JSON.stringify(reviewed)!==JSON.stringify(d.rows);
    if(!changed&&(!due||t.finance.cash<.1))continue;
    const result=commitWorldAction(db,{type:'finance.transfer-payment',actor:'system',
      pid:d.pid,fromId:d.fromId,teamId:d.teamId,dealId:d.id});
    if(!result.ok)throw new Error((result.errors||[]).join(' · '));
  }
}
function transferPaymentExposure(t){
  const deals=transferDealRows(t).filter(d=>d.teamId===t.id);
  return {guaranteed:deals.reduce((n,d)=>n+d.rows.filter(r=>r.kind==='installment'||r.status==='earned')
    .reduce((sum,r)=>sum+(r.status==='paid'||r.status==='expired'?0:r.amount-r.paid),0),0),
    contingent:deals.reduce((n,d)=>n+d.rows.filter(r=>r.kind!=='installment'&&r.status==='pending')
      .reduce((sum,r)=>sum+r.amount,0),0)};
}
function financeCommittedTransferCash(db,t){
  return transferPaymentExposure(t).guaranteed+loanIndex(db).players.reduce((n,id)=>{
    const loan=db.players[id].loan,q=loan.purchase;
    return n+(loan.borrowerId===t.id&&q?.type==='obligation'?q.fee+q.terms.signingBonus:0);
  },0);
}
function validateStoredTransferState(db){
  const validDate=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&
    Number.isFinite(Date.parse(d))&&new Date(d+'T00:00:00Z').toISOString().slice(0,10)===d;
  for(const t of Object.values(db.teams))for(const d of transferDealRows(t)){
    if(!d||!Array.isArray(d.rows)||!db.teams[d.fromId]||!db.teams[d.teamId]||
      d.fromId===d.teamId||![d.fromId,d.teamId].includes(t.id)||!validDate(d.date)||typeof d.id!=='string'||
      ![d.fee,d.upfront].every(n=>Number.isFinite(n)&&n>=0)||
      Math.abs(d.upfront+d.rows.filter(r=>r?.kind==='installment').reduce((n,r)=>n+r.amount,0)-d.fee)>1e-7||
      d.rows.some(r=>!r||!['pending','earned','paid','expired'].includes(r.status)||
        !Number.isFinite(r.amount)||r.amount<=0||!Number.isFinite(r.paid)||r.paid<0||r.paid>r.amount||
        !['installment','appearances','international','titles'].includes(r.kind)||
        r.status==='paid'&&r.paid!==r.amount||r.status==='pending'&&r.paid!==0||
        r.kind==='installment'&&(!validDate(r.date)||r.status==='expired')||
        r.kind!=='installment'&&(!validDate(r.through)||!Number.isInteger(r.threshold)||r.threshold<1||
          !Number.isFinite(r.baseline)||r.baseline<0)))
      throw Error('이적료 정산 저장 데이터가 손상되었습니다');
    if(d.rows.some(r=>r.status!=='paid'&&r.status!=='expired')){
      const mirror=db.teams[t.id===d.fromId?d.teamId:d.fromId].finance?.transferDeals?.[d.id];
      if(JSON.stringify(d)!==JSON.stringify(mirror))throw Error('양측 이적료 정산 저장 기록이 일치하지 않습니다');
    }
  }
  for(const p of Object.values(db.players))if(p.loan?.purchase){
    const q=p.loan.purchase;
    if(!['option','obligation'].includes(q.type)||!Number.isFinite(q.fee)||q.fee<0||
      !q.terms||!Number.isFinite(q.terms.salary)||q.terms.salary<=0||!Number.isInteger(q.terms.years)||
      q.terms.years<1||q.terms.years>3||q.type==='obligation'&&p.loan.recall||!q.consent?.willing)
      throw Error('임대 매입 합의 저장 데이터가 손상되었습니다');
  }
}
