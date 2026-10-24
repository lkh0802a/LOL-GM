// Review once per regional window, never on a background timer. AI uses its
// existing observations and the same club/player consent gateway as the manager.
function aiReviewLoanMarket(db){
  const w=db.world;if(w?.phase!=='season')return 0;
  const date=db.worldDate,md=date.slice(5),regions=Object.values(db.regions)
    .filter(R=>(R.loanWindows||[{from:'01-07',through:'01-31'},{from:'07-01',through:'07-14'}])
      .some(period=>md>=period.from&&md<=period.through))
    .sort((a,b)=>a.id.localeCompare(b.id));
  let deals=0;
  for(const R of regions){
    const period=(R.loanWindows||[{from:'01-07',through:'01-31'},{from:'07-01',through:'07-14'}])
      .find(period=>md>=period.from&&md<=period.through),key=R.id+'/'+w.year+'/'+period.from;
    if(w.loanMarketReviews?.[key])continue;
    w.loanMarketReviews=w.loanMarketReviews||{};w.loanMarketReviews[key]=date;
    const borrowers=activeTeams(db,R.id,1).filter(t=>!playerActionAuthority(db,'ai',t))
      .sort((a,b)=>a.id.localeCompare(b.id));
    for(const to of borrowers){
      const role=ROLES.slice().sort((a,b)=>{
        const pa=starterFor(db,to,a),pb=starterFor(db,to,b);
        return (pa?aiMarketValue(db,pa,to):0)-(pb?aiMarketValue(db,pb,to):0);
      })[0],current=starterFor(db,to,role),room=Math.max(0,salaryBudget(db,to)-payroll(db,to));
      const candidates=Object.values(db.players).filter(p=>p.team&&!p.loan&&!p.retired&&p.role===role&&
        p.contract&&!p.contract.medicalReplacement&&p.contract.salary<=room&&
        p.team!==to.id&&!playerActionAuthority(db,'ai',db.teams[p.team])&&
        db.teams[p.team]?.active!==false&&db.teams[p.team]?.roster.length>5&&
        !contractedMoveError(db,p)&&!localRegistrationError(db,to,p))
        .map(p=>({p,value:aiMarketValue(db,p,to)}))
        .filter(x=>!current||x.value>aiMarketValue(db,current,to)+3)
        .sort((a,b)=>b.value-a.value||a.p.id.localeCompare(b.p.id)).slice(0,8);
      for(const {p} of candidates){
        const result=commitWorldAction(db,{type:'player.loan',actor:'ai',pid:p.id,
          fromId:p.team,teamId:to.id,duration:md<'07-01'?'half':'season',
          salaryShare:1,fee:0,promisedRole:'starter',recall:true,
          ...aiLoanPurchaseProposal(db,p,to)});
        if(result.ok){deals++;break}
      }
    }
  }
  return deals;
}
function aiLoanPurchaseProposal(db,p,to){
  const fee=sellerTransferAsk(db,p,db.teams[p.team]);
  if(fee>Math.max(0,to.finance.cash-financeCommittedTransferCash(db,to))*.4)return {};
  const personal=aiTransferPersonalTerms(db,p,to,Math.max(0,salaryBudget(db,to)-payroll(db,to)));
  if(!personal)return {};
  const terms=personal.kind==='retained'?personal.consent.terms:personal.terms;
  return {purchase:{type:'option',fee,salary:terms.salary,years:terms.years,terms}};
}
// Weekly reviews follow each actual loan, rather than restarting every month.
function loanDecisionReviewDue(db,loan,kind='purchase'){
  const key=kind==='purchase'?'aiPurchaseReviewDate':kind==='recall'?'aiRecallReviewDate':null;
  if(!key)return false;
  const date=db.worldDate,start=loan?.startDate,previous=loan?.[key]??start,dates=[date,start,previous];
  if(dates.some(d=>typeof d!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(d)))return false;
  try{if(dates.some(d=>addDays(d,0)!==d))return false}catch{return false}
  const days=(Date.parse(date+'T00:00:00Z')-Date.parse(previous+'T00:00:00Z'))/86400000;
  return previous>=start&&Number.isInteger(days)&&days>=7;
}
function claimLoanDecisionReview(db,loan,kind){
  if(!loanDecisionReviewDue(db,loan,kind))return false;
  loan[kind==='purchase'?'aiPurchaseReviewDate':'aiRecallReviewDate']=db.worldDate;return true;
}
function aiReviewLoanDecisions(db){
  for(const pid of loanIndex(db).players.slice()){
    const p=db.players[pid],l=p.loan,owner=db.teams[l.ownerId],borrower=db.teams[l.borrowerId];
    if(!owner||!borrower||owner.active===false||borrower.active===false)continue;
    if(l.purchase?.type==='option'&&!playerActionAuthority(db,'ai',borrower)&&claimLoanDecisionReview(db,l,'purchase')){
      const starter=borrower.depthChart?.[p.role]===p.id,quote=l.purchase,
        room=salaryBudget(db,borrower)-payroll(db,borrower)+p.contract.salary*l.salaryShare;
      if(starter&&quote.terms.salary<=room&&quote.fee+quote.terms.signingBonus<=
        borrower.finance.cash-financeCommittedTransferCash(db,borrower)){
        const result=commitWorldAction(db,{type:'player.loan-purchase',actor:'ai',pid,
          fromId:owner.id,teamId:borrower.id});if(result.ok)continue;
      }
    }
    if(l.recall&&l.purchase?.type!=='obligation'&&!playerActionAuthority(db,'ai',owner)&&claimLoanDecisionReview(db,l,'recall')){
      const role=p.role,current=owner.depthChart?.[role]&&db.players[owner.depthChart[role]],
        ownsCurrent=current&&current.team===owner.id&&!current.loan&&
          owner.roster.includes(current.id)&&!current.retired,
        shortage=ownsCurrent&&medicalOut(current)&&medicalAvailable(db,owner)<5,
        stronger=ownsCurrent&&!medicalOut(current)&&
          aiMarketValue(db,p,owner)>aiMarketValue(db,current,owner)+3;
      // A return clause also lets an AI lender restore a materially stronger
      // role fit. Reuse the existing AI recruitment margin; do not invent a
      // second quality scale or override a binding purchase obligation.
      if(shortage||stronger)
        commitWorldAction(db,{type:'player.loan-return',actor:'ai',pid,fromId:borrower.id,teamId:owner.id});
    }
  }
}
