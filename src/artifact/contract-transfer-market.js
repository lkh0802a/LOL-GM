// ===== LOL GM: AI permanent-transfer personal terms =====
function buyoutTransferError(player,fee){const c=normalizeBuyoutClause(player.contract?.buyout);return c?.type==='release'&&fee+1e-8<c.amount?worldActionError('release_clause','구단 거부 불가 바이아웃 전액이 필요합니다'):null}
// AI uses the same personal-terms decision and actual available payroll.
function aiTransferPersonalTerms(db,p,t,salaryRoom,cashRoom=t?.finance?.cash??0){
  if(!Number.isFinite(salaryRoom)||salaryRoom<0)return null;
  const retained=contractTransferConsent(db,p,t);
  if(!retained.ok)return null;
  if(retained.willing&&p.contract.salary<=salaryRoom)
    return {kind:'retained',salary:p.contract.salary,consent:retained};
  // Normalize on detached entities: legacy career/lineup defaults may write.
  const player=JSON.parse(JSON.stringify(p)),team=JSON.parse(JSON.stringify(t));
  ensurePlayerAgent(player);
  const
    view={...db,players:{...db.players,[p.id]:player},
      teams:{...db.teams,[t.id]:team},_marketDemandCache:{}},
    ask=asking(view,player,team.region),years=contractDurationPolicy(view,player,team).preferred,
    promisedRole=defaultPromisedRole(view,player,team);
  // Reuse the existing expiry-market offer ladder, bounded by real payroll room.
  for(const mult of [1,1.05,1.15]){
    const terms=normalizeContractTerms(view,player,team,ask*mult,years,
      {promisedRole,releaseGuaranteeRate:contractGuaranteePolicy(player).preferred});
    if(terms.salary>salaryRoom)continue;
    const consent=contractTransferConsent(db,p,t,terms);
    if(consent.willing)return {kind:'new',salary:terms.salary,years,terms,consent};
    const counter=aiRepresentativeCounterTerms(view,player,team,'transfer',terms,
      Math.min(salaryRoom,ask*1.15),cashRoom);
    if(counter.terms){const counterConsent=contractTransferConsent(db,p,t,counter.terms);
      if(counterConsent.willing)return {kind:'new',salary:counter.terms.salary,
        years:counter.terms.years,terms:counter.terms,consent:counterConsent,
        rounds:1+counter.rounds,representative:counter.representative};}
  }
  return null;
}

function aiTransferSalaryRoom(db,t,fee){
  const detached=JSON.parse(JSON.stringify(t)),
    team={...detached,finance:{...detached.finance,cash:detached.finance.cash-fee}},
    view={...db,teams:{...db.teams,[team.id]:team}};
  return Math.max(0,salaryBudget(view,team)-payroll(view,team));
}

function aiMarketPermanentTransfers(db,rng,rep,mine){
  const size=5+(db.worldConfig.subs||0);
  // 이적료 거래: 예산이 넉넉한 구단이 다른 구단 주전을 사 온다
  let deals=0;
  for(const t of activeTeams(db,null,1).filter(t=>t.id!==mine&&transferMarketOpen(db,t)&&t.finance.cash>20*psTeam(db,t)&&financeRunway(db,t).months>=9&&financeForecast(db,t).closingCash>8*psTeam(db,t)).sort(()=>rng.next()-0.5)){
    if(deals>=Math.max(2,Math.ceil(activeTeams(db,null,1).length/10)))break;
    const role=rng.pick(ROLES), cur=starterFor(db,t,role); if(!cur)continue;
    if(contractedMoveError(db,cur))continue;
    // A reciprocal move may be refused. Never spend its hypothetical wage saving.
    const cand=activeTeams(db,t.region,1).filter(o=>o.id!==t.id&&o.id!==mine).map(o=>starterFor(db,o,role)).filter(p=>p&&p.contract&&!contractedMoveError(db,p)&&aiMarketValue(db,p,t)>playerValue(db,cur,t)+5)
      .map(p=>({p,fee:sellerTransferAsk(db,p,db.teams[p.team])})).filter(x=>x.fee<=t.finance.cash*0.6)
      .map(x=>({...x,personal:aiTransferPersonalTerms(db,x.p,t,
        aiTransferSalaryRoom(db,t,x.fee),Math.max(0,t.finance.cash-x.fee))}))
      .filter(x=>x.personal).sort((a,b)=>aiMarketValue(db,b.p,t)-aiMarketValue(db,a.p,t))[0];
    if(!cand)continue;
    const seller=db.teams[cand.p.team];
    if(localRegistrationError(db,t,cand.p)||localRegistrationError(db,seller,cur))continue;
    if(!(financeRunway(db,seller).severity!=='stable'||cand.p.wantsOut||rng.chance(.2)))continue;
    const personal=cand.personal;
    commitMarketPlayerAction(db,{type:personal.kind==='new'?'player.sign':'player.transfer',
      pid:cand.p.id,fromId:seller.id,teamId:t.id,fee:cand.fee,actor:'ai',
      ...(personal.kind==='new'?{kind:'transfer',salary:personal.salary,
        years:personal.years,terms:personal.terms}:{})});deals++;
    rep.transfers.push({pid:cand.p.id,from:seller.id,to:t.id,fee:cand.fee,
      personalTerms:personal.kind,salary:cand.p.contract.salary,
      representative:personal.representative||playerAgent(cand.p)?.id||null,
      negotiationRounds:personal.rounds||0});
    if(t.roster.length>size&&contractTransferConsent(db,cur,seller).willing){commitMarketPlayerAction(db,{type:'player.transfer',pid:cur.id,fromId:t.id,teamId:seller.id,fee:0,actor:'ai'});rep.transfers[rep.transfers.length-1].swap=cur.id}
  }
}
