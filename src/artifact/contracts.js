// ===== LOL GM: Player contract / FA market domain =====
// Owns market valuation, contract terms, options, signing and AI contract/FA market behavior.

function invalidContractNumericTerms(terms){
  const values=[terms.salary,terms.years,terms.signingBonus,terms.buyout?.amount??0,terms.option?.salary??0,...Object.values(terms.bonuses||{})];
  return values.every(Number.isFinite)?null:worldActionError('invalid_terms','유효하지 않은 계약 금액입니다');
}

function recentMarketPerformance(db,p){
  const rows=(p.career||[]).slice(-6),g=rows.reduce((a,c)=>a+(c.g||0),0);if(!g)return {games:0,rating:6.5,intl:0,titles:0};
  const rating=rows.reduce((a,c)=>a+(c.rating||6.5)*(c.g||0),0)/g,intl=rows.filter(c=>c.international).reduce((a,c)=>a+(c.g||0),0),titles=(p.careerEvents||[]).filter(e=>e.type==='title'&&e.year>=db.year-2).length;
  return {games:g,rating,intl,titles};
}
function marketDemandSnapshot(db,rid){
  db._marketDemandCache=db._marketDemandCache||{};
  const teams=activeTeams(db,rid,1),key=[db.year,rid||'ALL',Object.keys(db.players).length,teams.length].join('|'),slot=rid||'ALL',cached=db._marketDemandCache[slot];
  if(cached&&cached.key===key)return cached.values;
  const counts=Object.fromEntries(ROLES.map(r=>[r,0]));
  for(const p of Object.values(db.players))if(!p.retired&&(!rid||p.region===rid)&&(p.age<=30||p.team))counts[p.role]=(counts[p.role]||0)+1;
  const values=Object.fromEntries(ROLES.map(role=>[role,clamp(Math.max(1,teams.length*1.35)/Math.max(1,counts[role]||0),.72,1.38)]));
  db._marketDemandCache[slot]={key,values};return values;
}
function invalidateMarketDemand(db){if(db)db._marketDemandCache={}}
function roleMarketDemand(db,role,rid){return marketDemandSnapshot(db,rid)[role]??1}
function marketSalary(db,p,rid){
  const o=playerOvr(p),region=rid||p.region,ps=psOf(db,region),up=Math.max(0,p.pot-o),perf=recentMarketPerformance(db,p),demand=roleMarketDemand(db,p.role,region);
  const repMul=.82+(p.reputation??o)/220,perfMul=clamp(1+(perf.rating-6.5)*.08+Math.min(.1,perf.intl*.004)+Math.min(.08,perf.titles*.035),.82,1.28),ageMul=p.age<=21?1.02:p.age>=29?.88:1;
  return Math.max(.3*ps,Math.round(.41*Math.exp((o-60)*.13)*(1+up*(p.age<=21?.035:.008))*ps*repMul*perfMul*demand*ageMul*10)/10);
}
function playerMarketValue(db,p){
  const o=playerOvr(p),rep=p.reputation??o,up=Math.max(0,p.pot-o),rid=p.team&&db.teams[p.team]?db.teams[p.team].region:p.region,ps=psOf(db,rid),perf=recentMarketPerformance(db,p),demand=roleMarketDemand(db,p.role,rid);
  const ageMul=p.age<=20?1.25:p.age<=23?1.16:p.age<=26?1:p.age<=29?.82:.58,left=p.contract?Math.max(0,p.contract.until-db.year+1):0,contractMul=p.contract?1+Math.min(3,left)*.14:.68;
  const perfMul=clamp(1+(perf.rating-6.5)*.09+Math.min(.13,perf.intl*.004)+Math.min(.12,perf.titles*.045)+(p.form||0)*.008,.75,1.35);
  const raw=.62*Math.exp((o-60)*.115)*ps*(.76+rep/175)*(1+up*(p.age<=22?.047:.018))*ageMul*contractMul*perfMul*demand*(1-medicalContractRisk(db,p)*.75);
  return Math.round(Math.max(.2*ps,raw)*10)/10;
}
function asking(db,p,rid){return Math.round(marketSalary(db,p,rid)*(1+p.personality.ambition/420)*(.95+(p.reputation??playerOvr(p))/1700)*10)/10}
function defaultPromisedRole(db,p,t){const cur=starterFor(db,t,p.role);if(!cur)return 'starter';const gap=playerOvr(p)-playerOvr(cur);return gap>=3?'starter':gap>=-2?'competition':p.age<=21?'prospect':'backup'}
function contractDurationPolicy(db,p,t=null){
  const goal=playerCareerGoal(p),amb=p.personality?.ambition??50;
  let preferred=2,reason='balanced';
  if(p.age>=29){preferred=1;reason='veteran_flexibility'}
  else if(p.age<=21&&goal==='development'){preferred=3;reason='development_security'}
  else if(goal==='stability'){preferred=3;reason='career_stability'}
  else if(amb>=82&&p.age>=23){preferred=1;reason='ambitious_flexibility'}
  return {min:1,max:3,preferred,choices:[1,2,3],reason};
}
function contractDurationFit(db,p,t,years){
  const policy=contractDurationPolicy(db,p,t),
    y=clamp(Math.round(+years||policy.preferred),policy.min,policy.max),
    distance=Math.abs(y-policy.preferred);
  // Reuse the pre-D04 duration weight (.055 per step): B1 changes direction
  // by player preference, not the magnitude of contract-term utility.
  return Math.max(.055,.165-distance*.055);
}
function contractGuaranteePolicy(p){
  return {defaultRate:.5,choices:[.5,.75,1],preferred:.5};
}
function regionalContractGuaranteeRate(db,t){
  const rate=db.regions[t.region]?.releaseGuaranteeRate;
  return contractGuaranteePolicy(null).choices.includes(rate)?rate:.5;
}
function bindingAgreementTerms(db,p,t,a){
  return {...normalizeContractTerms(db,p,t,a.salary,a.years,a.terms),
    releaseGuaranteeRate:contractGuaranteeRate(a.terms)};
}
function contractGuaranteeRate(contract){
  // Missing terms in old saves retain the historical half-salary protection.
  const policy=contractGuaranteePolicy(null);
  return policy.choices.includes(contract?.releaseGuaranteeRate)
    ?contract.releaseGuaranteeRate:policy.defaultRate;
}
function contractGuaranteeTermsValid(terms){
  return terms?.releaseGuaranteeRate==null||
    contractGuaranteePolicy(null).choices.includes(terms.releaseGuaranteeRate);
}
// Numeric buyouts in existing saves were ordinary seller asks, because the
// old engine never distinguished a release clause from a negotiated fee.
// Keep that meaning on read. New contracts persist the explicit clause kind.
function normalizeBuyoutClause(value){
  if(value==null)return null;
  const row=typeof value==='number'?{amount:value,type:'negotiation'}:value;
  const amount=+row.amount,type=['release','negotiation'].includes(row.type)?row.type:'negotiation';
  return Number.isFinite(amount)&&amount>0
    ?{amount:Math.round(amount*10)/10,type}:null;
}
function normalizeContractTerms(db,p,t,salary,years,terms={},opt={}){
  const duration=contractDurationPolicy(db,p,t),
    requestedYears=years==null||years===''?duration.preferred:+years;
  salary=Math.max(.1,Math.round(+salary*10)/10);
  years=clamp(Math.round(Number.isFinite(requestedYears)?requestedYears:duration.preferred),
    duration.min,duration.max);
  const sign=Math.max(0,Math.round((terms.signingBonus??0)*10)/10);
  const bonuses={performance:Math.max(0,Math.round((terms.bonuses?.performance??0)*10)/10),title:Math.max(0,Math.round((terms.bonuses?.title??0)*10)/10),international:Math.max(0,Math.round((terms.bonuses?.international??0)*10)/10)};
  const optionType=['team','player'].includes(terms.option?.type)?terms.option.type:'none',until=db.year+years-1;
  const option=optionType==='none'?null:{type:optionType,year:until+1,salary:Math.round((terms.option?.salary??salary)*10)/10};
  const buyout=normalizeBuyoutClause(terms.buyout);
  return {salary,years,signingBonus:sign,bonuses,buyout,option,
    releaseGuaranteeRate:opt.preserveGuarantee?contractGuaranteeRate(terms):regionalContractGuaranteeRate(db,t),
    promisedRole:SQUAD_ROLES.includes(terms.promisedRole)?terms.promisedRole:defaultPromisedRole(db,p,t)};
}
function contractExpectedValue(c){if(!c)return 0;const b=c.bonuses||{};return c.salary+(c.signingBonus||0)/Math.max(1,c.years||1)+(b.performance||0)*.35+(b.title||0)*.14+(b.international||0)*.2}
function teamInternationalAppeal(db,t){const R=db.regions[t.region],power=db.global?.power?.[R.id]||1;return clamp((R.slots||1)/4*.55+(teamStrength(db,t.id)-R.strength)/18*.3+(t.fans||30)/180+power*.08,0,1.25)}
function offerUtility(db,p,t,offer,opt={}){
  ensureSatisfaction(p);const ask=Math.max(.1,asking(db,p,t.region)),moneyScore=contractExpectedValue(offer)/ask,role=offer.promisedRole||defaultPromisedRole(db,p,t),roleScore={core:.72,starter:.62,competition:.24,backup:.02,prospect:p.age<=21?.38:-.08}[role]??0;
  const strength=(teamStrength(db,t.id)-db.regions[t.region].strength)/12,facilities=ensureFacilities(t),fac=(facilities.training-2)*.055+(p.age<=22?(facilities.youth-2)*.075:(facilities.recovery-2)*.018),coach=(staffProfile(t).development-55)/160,intl=teamInternationalAppeal(db,t),durationFit=contractDurationFit(db,p,t,offer.years);
  const home=db.worldConfig.universalLanguage?(p.region===t.region?.04:0):(p.region===t.region?.22:-.08),amb=p.personality.ambition/100,career=playerCareerGoal(p);
  let careerFit=0;if(career==='development')careerFit=fac+coach+(role==='prospect'||role==='competition'?.16:0);else if(career==='starter')careerFit=['core','starter'].includes(role)?.22:-.12;else if(career==='international')careerFit=intl*.18;else if(career==='titles')careerFit=Math.max(0,strength)*.16+intl*.1;else careerFit=durationFit;
  const option=offer.option?.type==='player'?.07:offer.option?.type==='team'?-.025:0,
    buyoutClause=normalizeBuyoutClause(offer.buyout),
    buyout=buyoutClause?clamp(buyoutClause.amount/Math.max(.2,playerMarketValue(db,p)),.4,4)*-.018:0;
  const currentPenalty=opt.renewal?(p.satisfaction-50)/170+(p.managerTrust-50)/105+(p.managerRelationship-50)/190-(p.wantsOut?.4:0):0;
  // Reuse the duration utility unit per protection tier; default 50% offers
  // preserve their prior utility. Stability/development goals value security.
  const guarantee=(contractGuaranteeRate(offer)-.5)/.25*.055*
    (career==='stability'||career==='development'?1:.5);
  return moneyScore*1.05+roleScore+strength*amb*.18+intl*amb*.22+(t.fans||30)/250+fac+coach+careerFit+durationFit+home+option+buyout+currentPenalty+guarantee+clamp((playerTeamRelationship(db,p,t)-50)/250,-.2,.2);
}
function contractBonusCost(db,t,year){
  let sum=0;for(const id of t.roster){const p=db.players[id],c=p&&p.contract;if(!c||!c.bonuses)continue;const rows=(p.career||[]).filter(x=>x.year===year),g=rows.reduce((a,x)=>a+(x.g||0),0),rating=g?rows.reduce((a,x)=>a+(x.rating||6.5)*(x.g||0),0)/g:0;
    if(g>=10&&rating>=7.2)sum+=c.bonuses.performance||0;if(rows.some(x=>x.international&&x.g>=3))sum+=c.bonuses.international||0;if((p.careerEvents||[]).some(e=>e.year===year&&e.type==='title'))sum+=c.bonuses.title||0}
  return Math.round(sum*10)/10;
}
function signContract(db,p,t,salary,years,terms={}){
  const old=p.team,offer=normalizeContractTerms(db,p,t,salary,years,terms,{preserveGuarantee:true});assignPlayerToTeam(db,p,t);invalidateMarketDemand(db);p.faYears=0;
  p.contract={salary:offer.salary,until:db.year+offer.years-1,signed:db.year,years:offer.years,signingBonus:offer.signingBonus,bonuses:offer.bonuses,buyout:offer.buyout,option:offer.option,releaseGuaranteeRate:offer.releaseGuaranteeRate,promisedRole:offer.promisedRole};
  startContractRolePromise(db,p,t);ensurePlayerAgent(p);
  if(offer.signingBonus&&t.finance)payFinancePrepaid(t,'signingBonus',offer.signingBonus);
  setRosterRole(db,p,offer.promisedRole,'contract',true);ensureSatisfaction(p);if(old!==t.id){p.satisfaction=clamp(Math.max(p.satisfaction,58),0,100);p.managerRelationship=55;p.managerTrust=52;p.concernStreak=0;p.wantsOut=false;p.wantsOutReason=null}else{p.managerRelationship=clamp(p.managerRelationship+2,0,100);p.managerTrust=clamp(p.managerTrust+3,0,100)}
  if(db.world)recordPlayerEvent(p,'contract',db.year,{team:t.id,salary:p.contract.salary,years:offer.years,until:p.contract.until,renewal:old===t.id,rosterRole:p.rosterRole,releaseGuaranteeRate:offer.releaseGuaranteeRate,signingBonus:offer.signingBonus,buyout:offer.buyout,option:offer.option,date:db.worldDate});
  return p.contract;
}
function contractReleaseCost(db,p,mode='manager'){
  return contractReleaseSettlement(db,p,mode).amount;
}
function contractReleaseSettlement(db,p,mode='manager',agreedAmount=null){
  const contract=p.contract;
  const remainingYears=contract&&contract.until>=db.year?contract.until-db.year+1:0,
    exempt=mode==='initial'||mode==='medical_end'||!!contract?.medicalReplacement,
    guaranteeRate=contractGuaranteeRate(contract),
    amount=exempt?0:remainingYears?(contract.salary*remainingYears*guaranteeRate):0;
  const settlement={pid:p.id,playerName:p.name,date:db.worldDate||null,year:db.year,mode,
    salary:contract?.salary||0,contractUntil:contract?.until??null,
    remainingYears,guaranteeRate,exempt,amount};
  if(mode==='mutual'&&Number.isFinite(agreedAmount)){
    const consent=contractMutualTerminationTerms(db,p);
    return {...settlement,amount:agreedAmount,guaranteedAmount:amount,
      minimumAmount:consent.minimumAmount,consentReason:consent.reason};
  }
  return settlement;
}
function medicalContractYears(db,p,years){
  const risk=medicalContractRisk(db,p);
  return risk>=.115?Math.min(years,1):risk>=.065?Math.min(years,2):years;
}
function contractYearsForPlayer(db,p,rng,t=null){
  const elite=(p.reputation||playerOvr(p))>=85,policy=contractDurationPolicy(db,p,t);
  let years;
  if(p.age<=20){const x=rng.next();years=x<(elite?.1:.15)?1:x<(elite?.62:.72)?2:3}
  else if(p.age<=25){const x=rng.next();years=x<(elite?.25:.45)?1:x<(elite?.78:.9)?2:3}
  else if(p.age<=28)years=rng.chance(elite?.42:.7)?1:2;
  else years=rng.chance(.88)?1:2;
  return clamp(medicalContractYears(db,p,years),policy.min,policy.max);
}

function eligibleFillFAs(db,t,role=null){
  const room=Math.max(0,nonLocalLimitForTeam(db,t)-teamNonLocalCount(db,t));
  return Object.values(db.players).filter(p=>!p.retired&&!p.team&&(!role||p.role===role)&&(projectedPlayerIsLocal(db,p,t)||room>0))
    .sort((a,b)=>(pFillScore(db,b,t)-pFillScore(db,a,t)));
}
function aiMarketObservation(db,p,t){
  // All AI recruitment paths, including the first-season auction, consume
  // scouting-domain reports. Initial dossiers are seeded once by scouting.js.
  return aiScoutReport(db,t,p);
}
function aiMarketValue(db,p,t){const est=aiMarketObservation(db,p,t),up=Math.max(0,est.potential-est.ability),w={'win-now':0.1,'youth':0.6,'balanced':0.3,'superstar':0.15,'cost':0.35}[t.philosophy]||0.3;return est.ability+up*w-(t.philosophy==='youth'&&p.age>26?2:0)-medicalContractRisk(db,p)*18+clamp((knownRecruitRelationship(db,t,p)-50)/25,-2,2)}
function pFillScore(db,p,t){const domestic=projectedPlayerIsLocal(db,p,t)?2:0,age=p.age<=21?1:0,cost=Math.min(4,asking(db,p,t.region)/Math.max(.2,psOf(db,t.region)));return aiMarketValue(db,p,t)+domestic+age-cost*.15}
function optionDecision(db,p,t){
  const o=p.contract&&p.contract.option;if(!o||o.year!==db.year)return false;
  const next={...p.contract,salary:o.salary,years:1,signingBonus:0,bonuses:p.contract.bonuses||{},option:null,promisedRole:p.contract.promisedRole||p.rosterRole};
  if(o.type==='team')return contractExpectedValue(next)<=asking(db,p,t.region)*1.08||starterFor(db,t,p.role)===p;
  if(o.type==='player')return offerUtility(db,p,t,next,{renewal:true})>=offerAcceptanceThreshold(db,p)-.06;
  return false;
}
function shouldAutoExerciseOption(db,p,t,mine){
  const o=p.contract&&p.contract.option;if(!o||o.year!==db.year)return false;
  if(t.id===mine&&o.type==='team')return false;
  return optionDecision(db,p,t);
}
function exerciseContractOption(db,p,t,source='engine'){
  const o=p.contract&&p.contract.option;if(!o||o.year!==db.year)return false;p.contract.until=db.year;p.contract.salary=o.salary;p.contract.years=(p.contract.years||1)+1;p.contract.option=null;
  recordPlayerEvent(p,'contract_option',db.year,{team:t.id,type:o.type,salary:o.salary,source,date:db.worldDate});return true;
}
function commitMarketPlayerAction(db,command){
  const result=commitWorldAction(db,command);
  if(!result.ok)throw new Error('Market player transaction failed: '+(result.errors||[]).join(' · '));
  return result;
}
function signMarketContract(db,p,t,salary,years,terms={},kind='fa',actor='ai'){
  terms={releaseGuaranteeRate:contractGuaranteePolicy(p).preferred,...terms};
  return commitMarketPlayerAction(db,{type:'player.sign',pid:p.id,teamId:t.id,salary,years,terms,kind,actor}).contract;
}
function aiMarketOfferCandidates(db,t,fas,role,budgetRoom,year=db.year){
  const R=db.regions[t.region],cur=starterFor(db,t,role),
    cv=cur?playerValue(db,cur,t):-99,importGap=R.importRecruitMinGap??3,
    imports=teamNonLocalCount(db,t);
  return fas.filter(p=>p.role===role&&
      (projectedPlayerIsLocal(db,p,t)||(playerOvr(p)>=R.strength+importGap&&
        imports<nonLocalLimitForTeam(db,t))))
    .map(p=>({p,v:aiMarketValue(db,p,t),ask:asking(db,p,t.region)}))
    .filter(x=>x.ask<=budgetRoom&&
      (!cur||cur.wantsOut||cur.contract.until<=year||x.v>cv+5))
    .sort((a,b)=>b.v-a.v||a.p.id.localeCompare(b.p.id));
}

function contractMarket(db,rng,rep,ev){
  const year=db.year, size=5+(db.worldConfig.subs||0), w=db.world, mine=w&&w.manage==='manual'?managedRecruitmentTeamId(db):null;
  const imports=t=>teamNonLocalCount(db,t);
  const release=(t,p,why)=>{
    const terms=contractMutualTerminationTerms(db,p),mutual=terms.ok&&terms.willing;
    return commitMarketPlayerAction(db,{type:'player.release',pid:p.id,teamId:t.id,
      mode:mutual?'mutual':t.id===mine&&(!p.contract||p.contract.until<year)?'expired':'market',
      ...(mutual?{amount:terms.minimumAmount}:{}),actor:'system'});
  };
  // 1) 옵션 및 만료 계약 처리
  for(const t of activeTeams(db))for(const id of t.roster.slice()){const p=db.players[id];if(!p||!p.contract||p.contract.medicalReplacement||p.contract.until>=year)continue;const opt=p.contract.option;
    if(opt&&opt.year===year&&shouldAutoExerciseOption(db,p,t,mine))commitMarketPlayerAction(db,{type:'player.option',pid:p.id,teamId:t.id,actor:opt.type==='player'?'system':'ai'});
  }
  for(const t of activeTeams(db)) for(const id of t.roster.slice()){
    const p=db.players[id]; if(!p||p.retired)continue;
    if(!p.contract){release(t,p);rep.expired.push({pid:p.id,team:t.id,why:'무계약 상태 — FA 전환'});continue}
    if(p.contract.medicalReplacement||p.contract.until>=year)continue;
    if(t.id===mine){release(t,p);rep.expired.push({pid:p.id,team:t.id,why:'재계약하지 않음'});continue}
    const decision=aiRenewalDecision(db,p,t,rng);
    if(w.contractWindow?.completed){
      release(t,p);rep.expired.push({pid:p.id,team:t.id,why:'우선협상 기간 종료 — FA 전환'});
    }else if(decision.accepted){
      signMarketContract(db,p,t,decision.proposal.salary,decision.yrs,
        decision.proposal,'renewal','ai');
      rep.resign.push({pid:p.id,team:t.id,salary:decision.proposal.salary,
        years:decision.yrs,terms:decision.proposal,
        representative:decision.representative,negotiationRounds:decision.rounds});
    }else{
      release(t,p);rep.expired.push({pid:p.id,team:t.id,
        why:!decision.want?'재계약 제안 없음':
          decision.proposal.salary>decision.room?'연봉 이견':'FA 시장 도전'});
    }
  }
  // 2) FA 시장 (3라운드: 제안 → 선수 선택)
  aiMarketReserveCallups(db,rep);
  const budgetLeft={};activeTeams(db).forEach(t=>budgetLeft[t.id]=salaryBudget(db,t)-payroll(db,t));
  for(let round=0;round<3;round++){
    const fas=Object.values(db.players).filter(p=>!p.retired&&!p.team);
    const offers={};
    if(round===0&&mine)for(const o of w.offers||[]){const p=db.players[o.pid];if(p&&!p.team)(offers[p.id]=offers[p.id]||[]).push({t:db.teams[mine],sal:o.salary,years:o.years,starter:starterFor(db,db.teams[mine],p.role)?playerOvr(p)>playerOvr(starterFor(db,db.teams[mine],p.role)):true,mine:true})}
    for(const t of activeTeams(db).filter(t=>t.id!==mine&&!t.parent).sort(()=>rng.next()-0.5)){
      const R=db.regions[t.region];
      for(const role of ROLES){
        const cur=starterFor(db,t,role), cv=cur?playerValue(db,cur,t):-99;
        const importGap=R.importRecruitMinGap??3;
        const cand=aiMarketOfferCandidates(db,t,fas,role,budgetLeft[t.id],year);
        const c=cand[0]; if(!c)continue;
        const sal=Math.round(c.ask*(['win-now','superstar'].includes(t.philosophy)?rng.range(1,1.15):rng.range(0.95,1.05))*(1-medicalContractRisk(db,c.p)*.4)*10)/10;
        (offers[c.p.id]=offers[c.p.id]||[]).push({t,sal,starter:true});
      }
    }
    for(const [pid,os] of Object.entries(offers)){
      const p=db.players[pid], ask=asking(db,p);
      const u=o=>o.sal/ask*1.2+(teamStrength(db,o.t.id)-db.regions[o.t.region].strength)/10*p.personality.ambition/100+(o.t.fans||30)/100*0.4+(o.starter?0.5:0)+(db.worldConfig.universalLanguage?(o.t.region===p.region?0.08:0):(o.t.region===p.region?0.4:-0.2))+(db.regions[o.t.region].slots||1)*0.05+rng.normal(0,0.1);
      const best=os.map(o=>({o,v:u(o)})).sort((a,b)=>b.v-a.v)
        .find(x=>budgetLeft[x.o.t.id]>=x.o.sal&&!localRegistrationError(db,x.o.t,p));
      if(!best)continue;
      const t=best.o.t,yrs=best.o.years?best.o.years:contractYearsForPlayer(db,p,rng),
        offer=normalizeContractTerms(db,p,t,best.o.sal,yrs,{
          releaseGuaranteeRate:contractGuaranteePolicy(p).preferred,
          promisedRole:best.o.starter?'starter':defaultPromisedRole(db,p,t)});
      let finalOffer=offer,counterRounds=0;
      if(!contractOfferReasonable(db,p,t,offer,'fa')||
        offerUtility(db,p,t,offer)<offerAcceptanceThreshold(db,p,{kind:'fa'})){
        if(best.o.mine)continue;
        ensurePlayerAgent(p);
        const counter=aiRepresentativeCounterTerms(db,p,t,'fa',offer,
          Math.min(budgetLeft[t.id],best.o.sal*1.15),t.finance.cash);
        if(!counter.terms)continue;
        finalOffer=counter.terms;counterRounds=1+counter.rounds;
      }
      const prev=starterFor(db,t,p.role);
      // Multiple market offers can be based on the same earlier import count.
      // Recheck with the shared action validator and skip an obsolete offer.
      const signed=commitWorldAction(db,{type:'player.sign',pid:p.id,teamId:t.id,
        salary:best.o.mine?best.o.sal:finalOffer.salary,
        years:best.o.mine?yrs:finalOffer.years,kind:'fa',actor:best.o.mine?'manager':'ai',
        terms:best.o.mine?{releaseGuaranteeRate:offer.releaseGuaranteeRate}:finalOffer});
      if(!signed.ok)continue;
      if(best.o.mine)w.marketLog.push(`${p.name}: ${best.o.t.id===mine?'영입 성공':'다른 구단 선택'}`);
      budgetLeft[t.id]-=finalOffer.salary;
      rep.signings.push({pid:p.id,team:t.id,salary:finalOffer.salary,years:finalOffer.years,rookie:p.age<=19&&!p.career.length,import:!projectedPlayerIsLocal(db,p,t),offers:os.length,out:null,representative:playerAgent(p)?.id||null,negotiationRounds:counterRounds});
      if(t.roster.length>size+1){const bench=t.roster.map(id=>db.players[id]).filter(x=>x!==p&&!x.contract?.medicalReplacement&&starterFor(db,t,x.role)!==x).sort((a,b)=>playerValue(db,a,t)-playerValue(db,b,t))[0];
        if(bench){release(t,bench);rep.signings[rep.signings.length-1].out=bench.id}}
      else if(prev)rep.signings[rep.signings.length-1].out=null;
    }
  }
  aiMarketPermanentTransfers(db,rng,rep,mine);
  // 3) 로스터 채우기 / 정리
  for(const t of activeTeams(db)){
    for(const role of ROLES) if(!starterFor(db,t,role)){
      const fa=eligibleFillFAs(db,t,role)[0];
      if(!fa)throw new Error('Talent supply invariant failed during market: '+t.id+' '+role+' has no eligible free agent');
      signMarketContract(db,fa,t,asking(db,fa,t.region),contractYearsForPlayer(db,fa,rng),{},'fa',t.id===mine?'system':'ai');rep.signings.push({pid:fa.id,team:t.id,salary:fa.contract.salary,years:fa.contract.until-year+1,rookie:fa.age<=19,fill:true});
    }
    while(t.roster.length<size){
      const fa=eligibleFillFAs(db,t)[0];
      if(!fa)throw new Error('Talent supply invariant failed during market: '+t.id+' has no eligible free agent for bench slot');
      signMarketContract(db,fa,t,asking(db,fa,t.region),contractYearsForPlayer(db,fa,rng),{},'fa',t.id===mine?'system':'ai');rep.signings.push({pid:fa.id,team:t.id,salary:fa.contract.salary,years:fa.contract.until-year+1,rookie:fa.age<=19,fill:true});
    }
    while(t.roster.length>size){const b=t.roster.map(id=>db.players[id]).filter(x=>!x.contract?.medicalReplacement&&starterFor(db,t,x.role)!==x).sort((a,b)=>playerValue(db,a,t)-playerValue(db,b,t))[0];if(!b)break;release(t,b)}
    // SFR 하한은 강제 연봉 인상이 아니라 분배 자격 기준으로만 사용한다.
  }
}
function reconcileMinimumRosterAfterExpiry(db,rng,rep){
  // Contracts now legally expire on Worlds+14 rather than waiting for the
  // later market-close routine. Never leave an active organization below the
  // same five-available-player invariant protected by medical acceptance.
  const rows=[];
  for(const t of activeTeams(db)){
    let guard=0;
    while(medicalAvailable(db,t)<5&&guard++<8){
      let accepted=null;
      for(const fa of eligibleFillFAs(db,t)){
        const years=contractYearsForPlayer(db,fa,rng,t),ask=asking(db,fa,t.region);
        for(const mult of [1,1.05,1.15]){
          const terms=normalizeContractTerms(db,fa,t,ask*mult,years,{
            releaseGuaranteeRate:contractGuaranteePolicy(fa).preferred,
            promisedRole:defaultPromisedRole(db,fa,t)});
          if(contractOfferReasonable(db,fa,t,terms,'fa')&&
            offerUtility(db,fa,t,terms)>=offerAcceptanceThreshold(db,fa,{kind:'fa'})){
            accepted={fa,terms};break;
          }
        }
        if(accepted)break;
      }
      if(!accepted)throw new Error('No willing eligible free agent for post-expiry minimum roster: '+t.id);
      const {fa,terms}=accepted;
      signMarketContract(db,fa,t,terms.salary,terms.years,terms,'fa','system');
      const row={pid:fa.id,team:t.id,salary:terms.salary,years:terms.years,
        compliance:true,reason:'post_expiry_minimum_roster'};
      rows.push(row);if(rep)rep.signings.push(row);
    }
    if(medicalAvailable(db,t)<5)
      throw new Error('Post-expiry roster reconciliation failed: '+t.id);
  }
  return rows;
}

// 리그 팀 수를 짝수로 유지 (1부·2부 각각)
