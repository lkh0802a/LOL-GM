// ===== LOL GM: Player contract negotiation domain =====
// Owns shared negotiation state, player terms, rounds, reopening and contract agreement.
// Recruitment tracking and seller fee negotiation remain transfer-domain consumers.

// ---- 선수 계약 협상 엔진 ----
function negotiationStore(db){const w=db.world;if(!w)return {};w.negotiations=w.negotiations||{};return w.negotiations}
function negotiationId(db,pid,kind,teamId=null){return 'NEG_'+db.year+'_'+pid+'_'+kind+
  ((teamId&&(kind==='initial'||kind==='early_fa'))?'_'+teamId:'')}
function negotiationRoundLimit(p){return clamp(3+Math.round((p.personality.professionalism-50)/35)-(p.personality.ambition>=82?1:0),2,5)}
function negotiationPreferredYears(db,p,t){return contractDurationPolicy(db,p,t).preferred}
function negotiationSituationSnapshot(db,p,t,kind){
  ensureSatisfaction(p);
  const issues=kind==='renewal'
    ?satisfactionIssues(db,p,{year:db.year,offseason:true}).map(x=>x.code).sort()
    :[];
  const intlGames=(p.career||[]).reduce((n,row)=>n+(row.international?(row.g||0):0),0),
    titles=(p.careerEvents||[]).filter(e=>e.type==='title').length;
  return {
    playerTeamId:p.team||null,teamId:t?.id||null,
    wantsOut:!!p.wantsOut,wantsOutReason:p.wantsOutReason||null,
    careerGoal:playerCareerGoal(p),rosterRole:p.rosterRole||null,
    satisfactionBand:satisfactionLabel(p.satisfaction),
    trustBand:p.managerTrust>=65?'strong':p.managerTrust>=55?'ok':'low',
    relationshipBand:p.managerRelationship>=45?'ok':'low',
    issues,intlGames,titles,contractUntil:p.contract?.until??null
  };
}
function negotiationSituationChanges(before,after){
  if(!before||!after)return [];
  const keys=['playerTeamId','teamId','wantsOut','wantsOutReason','careerGoal',
    'rosterRole','satisfactionBand','trustBand','relationshipBand',
    'intlGames','titles','contractUntil'];
  const changed=keys.filter(k=>before[k]!==after[k]);
  if(JSON.stringify(before.issues||[])!==JSON.stringify(after.issues||[]))changed.push('issues');
  return changed;
}
function latestNegotiationAttempt(db,pid,kind,teamId){
  return Object.values(negotiationStore(db)).filter(n=>n.pid===pid&&n.kind===kind&&n.teamId===teamId)
    .sort((a,b)=>String(b.closedDate||b.createdDate||'').localeCompare(
      String(a.closedDate||a.createdDate||'')))[0]||null;
}
function negotiationReopenCheck(db,prev,p,t,kind){
  if(!prev||prev.status==='open'||!['withdrawn'].includes(prev.status))
    return {ok:true,changes:[]};
  if(kind==='renewal'&&prev.cooldownUntil&&db.worldDate<prev.cooldownUntil)
    return {ok:false,reason:'cooldown',until:prev.cooldownUntil,changes:[]};
  const now=negotiationSituationSnapshot(db,p,t,kind),
    changes=negotiationSituationChanges(prev.situationAtClose,now);
  if(prev.reopenRequiresChange&&!changes.length)
    return {ok:false,reason:'meaningful_change_required',until:prev.cooldownUntil||null,changes};
  return {ok:true,changes};
}
function negotiationAttemptSummary(neg){
  return {
    id:neg.id,attempt:neg.attempt||1,status:neg.status,reason:neg.reason||null,
    failureType:neg.failureType||null,createdDate:neg.createdDate||null,closedDate:neg.closedDate||null,
    cooldownUntil:neg.cooldownUntil||null,reopenRequiresChange:!!neg.reopenRequiresChange,
    situationAtClose:neg.situationAtClose||null
  };
}
function closePlayerNegotiationFailure(db,neg,p,hardBreak){
  neg.status='withdrawn';
  neg.failureType=hardBreak?'breakdown':'rejected';
  neg.reason=hardBreak?'조건 격차 또는 인내 소진으로 완전 결렬':'협상 라운드 종료로 제안 거절';
  neg.closedDate=db.worldDate;
  neg.situationAtClose=negotiationSituationSnapshot(db,p,db.teams[neg.teamId],neg.kind);
  neg.reopenRequiresChange=!!hardBreak;
  neg.cooldownUntil=neg.kind==='renewal'
    ?addDays(db.worldDate,neg.maxRounds||negotiationRoundLimit(p))
    :null;
  const target=recruitmentTarget(db,neg.pid);
  if(target){target.stage='evaluated';target.result='negotiation_failed';target.negotiationId=null}
}
function negotiationCompetition(db,p,t,rng,kind){
  if(kind==='renewal')return [];
  return activeTeams(db,null,1).filter(x=>x.id!==t.id&&!x.parent&&
    (kind!=='early_fa'||earlyContactAllowed(db,p,x))).map(team=>{
    if(localRegistrationError(db,team,p))return null;
    const cur=starterFor(db,team,p.role),need=!cur?8:aiMarketObservation(db,p,team).ability-playerOvr(cur),baseBudget=(kind==='initial')?initialSalaryBudget(db,team):salaryBudget(db,team),room=baseBudget-payroll(db,team),ask=asking(db,p,team.region);
    if(room<ask*.82||need<-4)return null;
    const years=contractYearsForPlayer(db,p,rng,team),terms=normalizeContractTerms(db,p,team,ask*rng.range(.94,1.12)*(1-medicalContractRisk(db,p)*.4),years,{releaseGuaranteeRate:contractGuaranteePolicy(p).preferred,promisedRole:defaultPromisedRole(db,p,team),option:rng.chance(.14)?{type:'player'}:null});
    return {teamId:team.id,terms,utility:offerUtility(db,p,team,terms),need};
  }).filter(Boolean).sort((a,b)=>b.utility-a.utility).slice(0,2);
}
function negotiationDemand(db,p,t,kind,rng,competitors=[]){
  const ask=asking(db,p,t.region),best=competitors.length?Math.max(...competitors.map(x=>x.utility)):0,goal=playerCareerGoal(p),years=negotiationPreferredYears(db,p,t);
  ensureSatisfaction(p);let premium=1+(p.personality.ambition-50)/500+(p.wantsOut&&kind==='renewal'?.12:0)+(best>offerAcceptanceThreshold(db,p,{kind})?.06:0);
  if(kind==='renewal'){premium+=Math.max(0,(55-p.managerTrust)/230)+Math.max(0,(45-p.managerRelationship)/320);if(p.satisfaction>=75&&p.managerTrust>=65)premium-=.045}
  const role=goal==='starter'?'starter':defaultPromisedRole(db,p,t),sign=ask*(p.reputation>=82?.18:p.personality.ambition>=75?.14:.09);
  const option=p.personality.ambition>=78&&p.age<=27?{type:'player'}:null,buyout=p.personality.ambition>=82?Math.round(playerMarketValue(db,p)*1.8*10)/10:null;
  return normalizeContractTerms(db,p,t,ask*premium,years,{releaseGuaranteeRate:contractGuaranteePolicy(p).preferred,signingBonus:sign,bonuses:{performance:ask*.07,title:ask*.12,international:ask*.07},promisedRole:role,option,buyout});
}
function startNegotiation(db,pid,kind='fa',extra={}){
  const w=db.world,t=extra.teamId?db.teams[extra.teamId]:myT(db),p=db.players[pid];if(!w||!t||!p)return {ok:false,msg:'협상 대상을 찾을 수 없습니다'};
  if(kind==='transfer'){const moveErr=contractedMoveError(db,p);if(moveErr)return {ok:false,msg:moveErr}}
  if(kind==='early_fa'){
    const contactErr=contractWindowContactError(db,p,t,'early_fa');
    if(contactErr)return {ok:false,msg:contactErr};
  }
  if(kind==='renewal'&&w.phase==='offseason'&&w.contractWindow){
    const contactErr=contractWindowContactError(db,p,t,'renewal');
    if(contactErr)return {ok:false,msg:contactErr};
  }
  if(kind==='renewal'&&w.contractWindow?.completed&&p.contract?.until<db.year)
    return {ok:false,msg:'기존 계약이 종료되어 재계약 우선협상 기간이 끝났습니다'};
  if((kind==='fa'||kind==='initial')&&p.team)return {ok:false,msg:'FA 선수가 아닙니다'};if(kind==='renewal'&&p.team!==t.id)return {ok:false,msg:'우리 팀 선수가 아닙니다'};
  if(kind==='initial'){const allowed=new Set(setupTeamsForManager(db).map(x=>x.id));if(!allowed.has(t.id))return {ok:false,msg:'내 구단 조직의 스쿼드만 계약 대상이 될 수 있습니다'}}
  if((kind==='fa'||kind==='early_fa'||kind==='transfer'||kind==='initial')&&!recruitmentReady(db,pid,t.id))return {ok:false,msg:'관심 등록 → 관찰 → 내부 평가를 완료한 뒤 공식 협상을 시작할 수 있습니다'};
  const id=negotiationId(db,pid,kind,
      (kind==='initial'||kind==='early_fa')?t.id:null),
    store=negotiationStore(db),
    current=store[id];
  if(current&&current.status==='open')return {ok:true,neg:current,msg:p.name+' 협상이 이미 진행 중입니다'};
  const previous=current||latestNegotiationAttempt(db,pid,kind,t.id),
    reopen=negotiationReopenCheck(db,previous,p,t,kind);
  if(!reopen.ok){
    if(reopen.reason==='cooldown')return {ok:false,msg:p.name+' 재계약 협상 냉각기간입니다 · '+reopen.until+'부터 재개 가능'};
    return {ok:false,msg:p.name+' 측과 완전 결렬된 협상은 선수·구단 상황이 의미 있게 바뀌어야 재개할 수 있습니다'};
  }
  const attempt=(previous?.attempt||0)+1,
    // Preserve the pre-B2 RNG stream for every first negotiation. Only an
    // actual reopened attempt receives a distinct deterministic stream.
    seed=w.seed+'/'+db.year+'/'+pid+'/'+kind+'/'+t.id+(attempt>1?'/'+attempt:''),
    rng=new RNG(seed,'negotiation'),
    competitors=negotiationCompetition(db,p,t,rng,kind),demand=negotiationDemand(db,p,t,kind,rng,competitors),rounds=negotiationRoundLimit(p),
    previousAttempts=previous?[...(previous.previousAttempts||[]),negotiationAttemptSummary(previous)]:[];
  const neg={id,pid,teamId:t.id,kind,status:'open',stage:kind==='transfer'?'club':'player',sellerId:extra.sellerId||p.team||null,fee:extra.fee||0,clubCounter:null,round:0,maxRounds:rounds,patience:rounds,competitors,demand,counter:demand,lastOffer:null,lastUtility:null,history:[],createdDate:db.worldDate,attempt,previousAttempts,reopenedChanges:reopen.changes};
  store[id]=neg;const target=recruitmentTarget(db,pid);if(target){target.stage='negotiating';target.negotiationId=id}
  return {ok:true,neg,msg:p.name+' 측과 협상을 시작했습니다'};
}
function negotiationBudgetError(db,p,t,terms,kind){
  const current=kind==='renewal'&&p.contract?p.contract.salary:0,projected=payroll(db,t)-current+terms.salary,baseBudget=kind==='initial'?initialSalaryBudget(db,t):salaryBudget(db,t);
  if(kind==='initial'){const x=initialOfferCheck(db,p,t,terms);if(!x.ok)return x.reason}
  else if(projected>baseBudget*1.2)return '연봉 예산을 크게 초과합니다';
  if((terms.signingBonus||0)>t.finance.cash)return '계약금을 지급할 현금이 부족합니다';
  if(kind!=='renewal'){const localErr=localRegistrationError(db,t,p);if(localErr)return localErr}
  return null;
}
function negotiationCounter(db,neg,offer){
  const p=db.players[neg.pid],t=db.teams[neg.teamId],d=neg.demand,blend=(a,b,w)=>Math.round((a+(b-a)*w)*10)/10,rank={backup:0,prospect:1,competition:2,starter:3,core:4};
  const role=(rank[offer.promisedRole]||0)>=(rank[d.promisedRole]||0)?offer.promisedRole:d.promisedRole,years=offer.years===d.years?offer.years:(Math.abs(offer.years-d.years)<=1?d.years:Math.round((offer.years+d.years)/2));
  const option=d.option?.type==='player'?{type:'player',salary:blend(offer.salary,d.salary,.55)}:(offer.option?.type==='team'&&p.personality.ambition>=72?null:offer.option),buyout=d.buyout?Math.min(offer.buyout||d.buyout,d.buyout):offer.buyout;
  return normalizeContractTerms(db,p,t,Math.max(offer.salary*1.025,blend(offer.salary,d.salary,.68)),years,{releaseGuaranteeRate:Math.max(contractGuaranteeRate(offer),contractGuaranteeRate(d)),signingBonus:Math.max(offer.signingBonus||0,blend(offer.signingBonus||0,d.signingBonus||0,.72)),bonuses:{performance:Math.max(offer.bonuses?.performance||0,(d.bonuses?.performance||0)*.78),title:Math.max(offer.bonuses?.title||0,(d.bonuses?.title||0)*.78),international:Math.max(offer.bonuses?.international||0,(d.bonuses?.international||0)*.78)},promisedRole:role,option,buyout});
}
function finalizeNegotiation(db,neg,terms){
  const p=db.players[neg.pid],t=db.teams[neg.teamId];
  if(!p||!t)return {ok:false,msg:'협상 선수 또는 구단이 존재하지 않습니다'};
  const future=(neg.kind==='renewal'||neg.kind==='early_fa')&&
    db.world?.phase==='offseason'&&db.world?.contractWindow?.stage==='exclusive'&&
    contractExpiresThisSeason(db,p);
  let result;
  if(future){
    result=recordContractAgreement(db,p,t,terms,neg.kind,'manager');
  }else{
    const command={type:'player.sign',pid:p.id,teamId:t.id,kind:neg.kind,
      fromId:neg.kind==='transfer'?neg.sellerId:null,fee:neg.kind==='transfer'?neg.fee:0,
      salary:terms.salary,years:terms.years,terms,actor:'manager'},
      postWorldsFa=neg.kind==='fa'&&db.world?.phase==='offseason'&&
        db.world?.contractWindow?.stage==='fa';
    result=postWorldsFa
      ?withContractStartSeason(db,db.world.contractWindow.startSeason,
        ()=>commitWorldAction(db,command))
      :commitWorldAction(db,command);
    if(!result.ok)result={ok:false,msg:(result.errors||['계약 조건이 변경되었습니다']).join(' · ')};
  }
  if(!result.ok)return result;
  neg.status='accepted';neg.counter=null;neg.acceptedTerms=terms;neg.closedDate=db.worldDate;
  if(future)neg.agreement=contractAgreementFor(db,p.id);
  const target=recruitmentTarget(db,neg.pid);
  if(target){target.stage='closed';target.result=future?
    (neg.kind==='early_fa'?'early_fa_agreed':'renewal_agreed'):'signed';target.negotiationId=neg.id}
  return {ok:true,msg:future?result.msg:p.name+' 계약 합의 · '+money(terms.salary)+' · '+terms.years+'년'};
}
function submitNegotiationOffer(db,nid,terms){
  if(!contractGuaranteeTermsValid(terms))
    return {ok:false,msg:'유효하지 않은 방출 보장률입니다'};
  const neg=negotiationStore(db)[nid];if(!neg||neg.status!=='open'||neg.stage!=='player')return {ok:false,msg:'진행 중인 선수 협상이 아닙니다'};
  const p=db.players[neg.pid],t=db.teams[neg.teamId];
  if(['renewal','early_fa'].includes(neg.kind)&&db.world?.phase==='offseason'&&db.world?.contractWindow){
    const contactErr=contractWindowContactError(db,p,t,neg.kind);
    if(contactErr)return {ok:false,msg:contactErr};
  }
  const offer=normalizeContractTerms(db,p,t,terms.salary,terms.years,terms),err=negotiationBudgetError(db,p,t,offer,neg.kind);if(err)return {ok:false,msg:err};if(neg.kind==='transfer'&&(offer.signingBonus||0)>Math.max(0,t.finance.cash-(neg.fee||0)))return {ok:false,msg:'이적료 지급 후 계약금을 지급할 현금이 부족합니다'};
  const util=offerUtility(db,p,t,offer,{renewal:neg.kind==='renewal'}),
    comp=neg.competitors.length?Math.max(...neg.competitors.map(x=>x.utility)):0,
    threshold=Math.max(offerAcceptanceThreshold(db,p,{kind:neg.kind}),comp-.035),
    reasonable=!['fa','early_fa','renewal'].includes(neg.kind)||
      contractOfferReasonable(db,p,t,offer,neg.kind);
  neg.round++;if(neg.lastUtility!=null&&util<neg.lastUtility-.03)neg.patience--;if(util<threshold-.22)neg.patience--;neg.lastOffer=offer;neg.lastUtility=util;neg.history.push({round:neg.round,side:'club',terms:offer,utility:Math.round(util*1000)/1000});
  if(reasonable&&util>=threshold){const r=finalizeNegotiation(db,neg,offer);neg.history.push({round:neg.round,side:'player',result:r.ok?'accept':'commit_rejected'});return r}
  if(neg.round>=neg.maxRounds||neg.patience<=0||util<threshold-.62){
    const hardBreak=neg.patience<=0||util<threshold-.62;
    closePlayerNegotiationFailure(db,neg,p,hardBreak);
    return {ok:false,msg:hardBreak?p.name+' 측과 협상이 완전 결렬됐습니다':
      p.name+' 측이 이번 '+(neg.kind==='renewal'?'재계약 ':'')+'제안을 거절했습니다'}
  }
  if((neg.kind==='fa'||neg.kind==='initial')&&neg.round>=2&&neg.competitors.length){
    const rival=neg.competitors[0],rt=db.teams[rival.teamId],gap=rival.utility-util,rrng=new RNG(db.world.seed+'/'+neg.id+'/'+neg.round,'negotiation-rival');
    if(rt&&!p.team&&!negotiationBudgetError(db,p,rt,rival.terms,'fa')&&rival.utility>=offerAcceptanceThreshold(db,p,{kind:'fa'})-.02&&(gap>.08||rrng.chance(clamp(.16+Math.max(0,gap)*1.8,.12,.72)))){
      const signed=commitWorldAction(db,{type:'player.sign',pid:p.id,teamId:rt.id,kind:'fa',actor:'ai',
        salary:rival.terms.salary,years:rival.terms.years,terms:rival.terms});
      if(signed.ok){
        neg.status='lost';neg.reason='경쟁 구단 선택';neg.closedDate=db.worldDate;
        neg.history.push({round:neg.round,side:'player',result:'rival',teamId:rt.id});
        const target=recruitmentTarget(db,neg.pid);
        if(target){target.stage='closed';target.result='lost_to_rival';target.negotiationId=neg.id}
        return {ok:false,msg:p.name+' 선수가 협상 중 '+rt.name+'의 제안을 선택했습니다'};
      }
    }
  }
  neg.counter=negotiationCounter(db,neg,offer);neg.history.push({round:neg.round,side:'player',result:'counter',terms:neg.counter});return {ok:true,counter:neg.counter,msg:p.name+' 측이 역제안했습니다'};
}
function acceptNegotiationCounter(db,nid){const neg=negotiationStore(db)[nid];if(!neg||neg.status!=='open'||!neg.counter)return {ok:false,msg:'수락할 역제안이 없습니다'};return submitNegotiationOffer(db,nid,neg.counter)}
function cancelNegotiation(db,nid){const neg=negotiationStore(db)[nid];if(!neg||neg.status!=='open')return '진행 중인 협상이 아닙니다';neg.status='cancelled';neg.closedDate=db.worldDate;const target=recruitmentTarget(db,neg.pid);if(target){target.stage='evaluated';target.result='cancelled';target.negotiationId=null}return db.players[neg.pid].name+' 협상을 종료했습니다'}
