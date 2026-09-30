// ===== LOL GM: D04-B3 offseason incumbent exclusivity / pre-contract window =====
// Contract years remain year-based in the save schema. B3 derives the exact
// expiry boundary as Dec 31 of contract.until and activates future agreements
// on Jan 1 without creating a second roster ledger.

function contractWindowYear(db){return db.world?.year??db.year}
function contractWindowDates(db){
  const w=db.world,year=contractWindowYear(db),
    seasonEnd=w?.lastDate||db.worldDate||year+'-11-01';
  return {
    seasonYear:year,seasonEndDate:seasonEnd,startDate:addDays(seasonEnd,1),
    exclusiveThrough:addDays(seasonEnd,14),outsideContactDate:addDays(seasonEnd,15),
    contractExpiryDate:year+'-12-31',effectiveDate:(year+1)+'-01-01'
  };
}
function contractExpiresThisSeason(db,p){
  const year=contractWindowYear(db);
  return !!(p&&!p.retired&&p.team&&p.contract&&!p.contract.medicalReplacement&&
    p.contract.until===year);
}
function contractHasPendingOption(db,p){
  const year=contractWindowYear(db),o=p?.contract?.option;
  return !!(o&&o.year===year+1);
}
function contractAgreementStore(db){
  const w=db.world;if(!w)return {};
  w.contractAgreements=w.contractAgreements||{};
  return w.contractAgreements;
}
function contractAgreementFor(db,pid){return contractAgreementStore(db)[pid]||null}
function initOffseasonContractWindow(db){
  const w=db.world;if(!w||w.phase!=='offseason')return w?.contractWindow||null;
  if(w.contractWindow)return w.contractWindow;
  const d=contractWindowDates(db);
  w.contractWindow={...d,stage:'exclusive',incumbentProcessed:false,
    outsideProcessed:false,completed:false};
  contractAgreementStore(db);
  if(!db.worldDate||db.worldDate<d.startDate)db.worldDate=d.startDate;
  return w.contractWindow;
}
function contractWindowContactError(db,p,t,kind){
  const w=db.world,cw=w?.contractWindow;
  if(!w||w.phase!=='offseason'||!cw)return '오프시즌 계약 협상 기간이 아닙니다';
  if(!p||!t||!contractExpiresThisSeason(db,p))
    return '이번 시즌 종료 시 만료되는 계약만 이 기간에 협상할 수 있습니다';
  const existing=contractAgreementFor(db,p.id);
  if(existing?.status==='agreed')
    return '이미 다음 계약에 합의한 선수입니다';
  if(kind==='renewal'){
    if(p.team!==t.id)return '재계약은 현 소속 구단만 협상할 수 있습니다';
    return null;
  }
  if(kind!=='precontract')return '지원하지 않는 오프시즌 계약 유형입니다';
  if(p.team===t.id)return '현 소속 선수는 재계약 협상을 사용해야 합니다';
  if(cw.stage!=='outside'||db.worldDate<cw.outsideContactDate)
    return '원소속 구단의 14일 독점 우선협상 기간입니다';
  if(contractHasPendingOption(db,p))
    return '다음 시즌 계약 옵션이 남아 있어 가계약 대상이 아닙니다';
  return null;
}
function recordContractAgreement(db,p,t,terms,kind,actor='manager'){
  const err=contractWindowContactError(db,p,t,kind);
  if(err)return {ok:false,msg:err};
  const normalized=normalizeContractTerms(db,p,t,terms.salary,terms.years,terms),
    budgetErr=negotiationBudgetError(db,p,t,normalized,
      kind==='renewal'?'renewal':'precontract');
  if(budgetErr)return {ok:false,msg:budgetErr};
  const cw=db.world.contractWindow,
    row={pid:p.id,fromTeamId:p.team,teamId:t.id,kind,status:'agreed',
      agreedDate:db.worldDate,effectiveDate:cw.effectiveDate,
      contractExpiryDate:cw.contractExpiryDate,salary:normalized.salary,
      years:normalized.years,terms:normalized,actor};
  contractAgreementStore(db)[p.id]=row;
  recordPlayerEvent(p,kind==='renewal'?'renewal_agreement':'precontract_agreement',
    cw.seasonYear,{from:p.team,to:t.id,agreedDate:db.worldDate,
      effectiveDate:cw.effectiveDate,salary:normalized.salary,years:normalized.years});
  for(const neg of Object.values(negotiationStore(db))){
    if(neg.pid!==p.id||neg.status!=='open')continue;
    if(neg.teamId===t.id&&neg.kind===kind)continue;
    neg.status='superseded';neg.reason='선수가 다음 계약에 합의';neg.closedDate=db.worldDate;
  }
  return {ok:true,agreement:row,msg:p.name+' 다음 계약 합의 · '+
    cw.effectiveDate+' 발효 · '+money(normalized.salary)+' · '+normalized.years+'년'};
}
function aiRunExclusiveRenewals(db){
  const w=db.world,cw=w?.contractWindow;if(!cw||cw.incumbentProcessed)return [];
  const manual=w.manage==='manual'?managedTeamId(db):null,
    rng=new RNG(w.seed+'/'+cw.seasonYear,'exclusive-renewal'),rows=[];
  for(const t of activeTeams(db).filter(t=>t.id!==manual)){
    for(const id of (t.roster||[]).slice()){
      const p=db.players[id];if(!contractExpiresThisSeason(db,p)||contractAgreementFor(db,p.id))continue;
      const decision=aiRenewalDecision(db,p,t,rng);
      if(!decision.accepted)continue;
      const r=recordContractAgreement(db,p,t,decision.proposal,'renewal','ai');
      if(r.ok)rows.push(r.agreement);
    }
  }
  cw.incumbentProcessed=true;return rows;
}
function advanceOffseasonContractWindow(db){
  const cw=initOffseasonContractWindow(db);
  if(!cw)return {ok:false,msg:'계약 협상 기간을 열 수 없습니다'};
  if(cw.stage==='exclusive'){
    const renewals=aiRunExclusiveRenewals(db);
    cw.stage='outside';db.worldDate=cw.outsideContactDate;
    return {ok:true,stage:'outside',renewals,
      msg:'14일 원소속 독점 기간 종료 · '+cw.outsideContactDate+'부터 타 구단 접촉/가계약 가능'};
  }
  return {ok:true,stage:cw.stage,msg:'이미 타 구단 접촉 기간입니다'};
}
function aiPreContractOffer(db,p,t,rng){
  if(contractWindowContactError(db,p,t,'precontract'))return null;
  const room=salaryBudget(db,t)-payroll(db,t),
    viable=aiMarketOfferCandidates(db,t,[p],p.role,room,contractWindowYear(db));
  if(!viable.length)return null;
  const ask=asking(db,p,t.region),
    salary=Math.round(ask*rng.range(.95,1.05)*
      (1-medicalContractRisk(db,p)*.4)*10)/10,
    years=contractYearsForPlayer(db,p,rng,t),
    terms=normalizeContractTerms(db,p,t,salary,years,{
      promisedRole:defaultPromisedRole(db,p,t),
      option:rng.chance(.14)?{type:'player'}:null
    }),
    err=negotiationBudgetError(db,p,t,terms,'precontract');
  if(err)return null;
  return {team:t,terms,utility:offerUtility(db,p,t,terms),years};
}
function aiRunOutsidePreContracts(db){
  const w=db.world,cw=w?.contractWindow;
  if(!cw||cw.stage!=='outside'||cw.outsideProcessed)return [];
  const manual=w.manage==='manual'?managedTeamId(db):null,
    rng=new RNG(w.seed+'/'+cw.seasonYear,'outside-precontract'),rows=[];
  for(const p of Object.values(db.players)){
    if(!contractExpiresThisSeason(db,p)||contractHasPendingOption(db,p)||
      contractAgreementFor(db,p.id))continue;
    const offers=activeTeams(db,null,1).filter(t=>!t.parent&&t.id!==p.team&&t.id!==manual)
      .map(t=>aiPreContractOffer(db,p,t,rng)).filter(Boolean)
      .sort((a,b)=>b.utility-a.utility||a.team.id.localeCompare(b.team.id));
    const best=offers[0];
    if(!best||best.utility<offerAcceptanceThreshold(db,p))continue;
    const r=recordContractAgreement(db,p,best.team,best.terms,'precontract','ai');
    if(r.ok)rows.push(r.agreement);
  }
  cw.outsideProcessed=true;return rows;
}
function contractAgreementActionKind(row){
  return row.kind==='renewal'?'renewal_agreement':'precontract';
}
function applyDueContractAgreements(db,rep=null){
  const w=db.world,store=contractAgreementStore(db),applied=[];
  for(const row of Object.values(store)){
    if(row.status!=='agreed'||row.effectiveDate>db.worldDate)continue;
    const p=db.players[row.pid],t=db.teams[row.teamId];
    if(!p||p.retired||!t||t.active===false)
      throw new Error('Binding contract agreement lost player/team: '+row.pid);
    const result=commitWorldAction(db,{type:'player.sign',pid:p.id,teamId:t.id,
      fromId:row.fromTeamId,kind:contractAgreementActionKind(row),actor:'system',
      salary:row.salary,years:row.years,terms:row.terms});
    if(!result.ok)throw new Error('Binding contract agreement failed: '+
      row.pid+' '+(result.errors||[]).join(' · '));
    row.status='effective';row.appliedDate=db.worldDate;applied.push(row);
    if(rep){
      if(row.kind==='renewal')rep.resign.push({pid:p.id,team:t.id,
        salary:row.salary,years:row.years,terms:row.terms,agreement:true});
      else rep.signings.push({pid:p.id,team:t.id,salary:row.salary,
        years:row.years,precontract:true,from:row.fromTeamId});
    }
  }
  return applied;
}
function settleOffseasonContractRollover(db,rep){
  const w=db.world,cw=w?.contractWindow;
  if(!cw)return {applied:[],released:[],options:[]};
  if(cw.stage==='exclusive')advanceOffseasonContractWindow(db);
  const precontracts=aiRunOutsidePreContracts(db);
  cw.completed=true;
  const restoreDate=db.worldDate,effective=cw.effectiveDate;
  db.worldDate=effective;
  const applied=applyDueContractAgreements(db,rep),released=[],options=[],
    mine=w.manage==='manual'?managedTeamId(db):null;
  for(const t of activeTeams(db))for(const id of (t.roster||[]).slice()){
    const p=db.players[id];if(!p?.contract||p.contract.medicalReplacement||
      p.contract.until>=db.year)continue;
    const o=p.contract.option;
    if(o&&o.year===db.year&&shouldAutoExerciseOption(db,p,t,mine)){
      const r=commitWorldAction(db,{type:'player.option',pid:p.id,teamId:t.id,
        actor:o.type==='player'?'system':'ai'});
      if(r.ok){options.push(p.id);continue}
    }
    if(o&&o.year===db.year&&t.id===mine&&o.type==='team')continue;
    const from=t.id,r=commitWorldAction(db,{type:'player.release',pid:p.id,
      teamId:from,mode:'expired',actor:'system'});
    if(!r.ok)throw new Error('Expired contract release failed: '+p.id);
    released.push(p.id);
    if(rep)rep.expired.push({pid:p.id,team:from,why:'계약 종료 — FA 전환'});
  }
  db.worldDate=restoreDate;
  return {applied,released,options,precontracts};
}
