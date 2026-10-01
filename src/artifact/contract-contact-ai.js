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
        return {t,offer,utility:offerUtility(db,p,t,offer)};
      }).filter(Boolean).sort((a,b)=>b.utility-a.utility||
        a.t.id.localeCompare(b.t.id));
    const best=candidates[0];
    if(!best||!contractOfferReasonable(db,p,best.t,best.offer,'early_fa')||
      best.utility<offerAcceptanceThreshold(db,p,{kind:'early_fa'}))continue;
    const r=recordContractAgreement(db,p,best.t,best.offer,'early_fa','ai');
    if(r.ok)rows.push(r.agreement);
  }
  return rows;
}
