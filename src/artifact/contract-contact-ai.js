// ===== LOL GM: AI incumbent waivers and early-contact offers =====
// Shared eligibility/writer lives in contract-window.js; AI never waives
// the human-managed organization's exclusivity.

function aiWantsRenewal(db,p,t){
  const starter=starterFor(db,t,p.role)===p;
  return starter||['core','starter','competition'].includes(p.rosterRole)||
    (p.age<=21&&p.pot-playerOvr(p)>=6)||
    (p.rosterRole==='backup'&&t.roster.length<7&&p.satisfaction>=50);
}
function aiGrantEarlyContact(db){
  const cw=db.world?.contractWindow;
  if(!cw||cw.aiWaiversProcessed)return [];
  const mine=db.world?.manage==='manual'?managedRecruitmentTeamId(db):null,waivers=[];
  for(const t of activeTeams(db)){
    if(mine&&parentTeamOf(db,t)?.id===mine)continue;
    for(const id of (t.roster||[])){
      const p=db.players[id];
      if(!contractExpiresThisSeason(db,p)||contractHasPendingOption(db,p))continue;
      const room=salaryBudget(db,t)-payroll(db,t)+(p.contract?.salary||0),
        ask=asking(db,p,t.region),
        // Reuse the same established AI-market floor used by player
        // reasonableness instead of a separate waiver-only salary constant.
        minimum=ask*.95*(1-medicalContractRisk(db,p)*.4),
        plansToRenew=aiWantsRenewal(db,p,t)&&room>=minimum;
      if(!plansToRenew){
        const r=grantEarlyContact(db,id,'ai');
        if(r.ok)waivers.push(r.waiver);
      }
    }
  }
  cw.aiWaiversProcessed=true;return waivers;
}
function aiRunEarlyContactOffers(db){
  const cw=db.world?.contractWindow;
  if(!cw||cw.stage!=='exclusive')return [];
  const mine=db.world.manage==='manual'?managedRecruitmentTeamId(db):null,rows=[],
    rng=new RNG(db.world.seed+'/'+db.worldDate,'early-contact');
  for(const waiver of Object.values(cw.contactWaivers||{})){
    const p=db.players[waiver.pid];if(!p||!contractExpiresThisSeason(db,p)||
      contractAgreementFor(db,p.id)?.status==='agreed')continue;
    const candidates=activeTeams(db,null,1).filter(t=>!t.parent&&
      (!mine||parentTeamOf(db,t)?.id!==mine)&&earlyContactAllowed(db,p,t))
      .map(t=>{
        const room=salaryBudget(db,t)-payroll(db,t),
          shortlist=aiMarketOfferCandidates(db,t,[p],p.role,room,cw.startSeason);
        if(!shortlist.length)return null;
        const offer=normalizeContractTerms(db,p,t,asking(db,p,t.region)*
          (1-medicalContractRisk(db,p)*.4),contractYearsForPlayer(db,p,rng,t),{
            releaseGuaranteeRate:contractGuaranteePolicy(p).preferred,
            promisedRole:defaultPromisedRole(db,p,t)});
        if(negotiationBudgetError(db,p,t,offer,'early_fa'))return null;
        let terms=offer,rounds=1,utility=offerUtility(db,p,t,terms);
        if(!contractOfferReasonable(db,p,t,terms,'early_fa')||
          utility<offerAcceptanceThreshold(db,p,{kind:'early_fa'})){
          ensurePlayerAgent(p);
          const counter=aiRepresentativeCounterTerms(db,p,t,'early_fa',terms,room,t.finance.cash);
          if(!counter.terms||negotiationBudgetError(db,p,t,counter.terms,'early_fa'))return null;
          terms=counter.terms;rounds+=counter.rounds;utility=offerUtility(db,p,t,terms);
        }
        return {t,offer:terms,utility,rounds,representative:playerAgent(p)?.id||null};
      }).filter(Boolean).sort((a,b)=>b.utility-a.utility||
        a.t.id.localeCompare(b.t.id));
    const best=candidates[0];
    if(!best||!contractOfferReasonable(db,p,best.t,best.offer,'early_fa')||
      best.utility<offerAcceptanceThreshold(db,p,{kind:'early_fa'}))continue;
    const r=recordContractAgreement(db,p,best.t,best.offer,'early_fa','ai');
    if(r.ok)rows.push({...r.agreement,representative:best.representative,
      negotiationRounds:best.rounds});
  }
  return rows;
}

function aiRenewalDecision(db,p,t,rng){
  const want=aiWantsRenewal(db,p,t),
    ask=asking(db,p,t.region),
    room=salaryBudget(db,t)-payroll(db,t)+(p.contract?.salary||0),
    yrs=contractYearsForPlayer(db,p,rng),
    initialProposal=normalizeContractTerms(db,p,t,
      ask*rng.range(.96,1.08)*(1-medicalContractRisk(db,p)*.4),yrs,{
        releaseGuaranteeRate:contractGuaranteePolicy(p).preferred,
        promisedRole:recommendedRosterRole(db,p,t),
        option:rng.chance(.18)?{type:rng.chance(.55)?'team':'player'}:null
      });
  ensureSatisfaction(p);
  let proposal=initialProposal;
  const noise=rng.normal(0,.06),threshold=offerAcceptanceThreshold(db,p,{kind:'renewal'});
  let stay=contractOfferReasonable(db,p,t,proposal,'renewal')&&
    offerUtility(db,p,t,proposal,{renewal:true})+noise>=threshold,rounds=1;
  if(want&&!stay&&proposal.salary<=room){
    ensurePlayerAgent(p);
    const counter=aiRepresentativeCounterTerms(db,p,t,'renewal',proposal,room,t.finance.cash);
    rounds+=counter.rounds;
    if(counter.terms){proposal=counter.terms;stay=contractOfferReasonable(db,p,t,proposal,'renewal')&&
      offerUtility(db,p,t,proposal,{renewal:true})+noise>=threshold}
  }
  return {want,ask,room,yrs:proposal.years,proposal,stay,rounds,
    representative:playerAgent(p)?.id||null,
    accepted:want&&proposal.salary<=room&&stay};
}
