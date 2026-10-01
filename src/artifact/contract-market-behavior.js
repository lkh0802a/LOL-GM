// ===== LOL GM: D04 contract-market career continuity =====
// Players account for the career cost of remaining unsigned, while established
// market offer floors still prevent desperation from accepting clear undervaluation.

function unsignedSeasonCareerRisk(db,p,kind='fa'){
  // A year without professional matches already compounds faYears/retirement.
  // Apply the opportunity cost only at genuine offseason contract decisions.
  const w=db.world;
  if(!w||!['offseason','market'].includes(w.phase)||p.retired||
    !['fa','early_fa','renewal'].includes(kind))return 0;
  if(kind==='renewal'&&(!w.contractWindow||!contractExpiresThisSeason(db,p)||p.wantsOut))
    return 0;
  if(kind==='early_fa'&&!w.contractWindow)return 0;
  // Reuse existing negotiation magnitudes instead of inventing a separate
  // "desperation" scale: one duration-utility step is .055 and .22 is the
  // existing meaningful under-offer/patience boundary.
  const step=.055,base=kind==='renewal'?step:step*2,
    unsigned=Math.min(2,p.faYears||0)*step,
    prime=p.age>=24&&p.age<=29?step:0;
  return Math.min(.22,base+unsigned+prime);
}
function offerAcceptanceThreshold(db,p,opt={}){
  const rep=(p.reputation||playerOvr(p)),amb=p.personality.ambition/100,
    base=1.04+rep/520+amb*.12+(p.age<=20?.04:0);
  return base-unsignedSeasonCareerRisk(db,p,opt.kind||(p.team?'renewal':'fa'));
}
function contractOfferReasonable(db,p,t,offer,kind='fa'){
  // The opportunity cost of unemployment does not override genuine
  // undervaluation: low guaranteed pay + bench/minor role is still rejectable.
  const ask=Math.max(.1,asking(db,p,t.region)),
    guaranteed=offer.salary+(offer.signingBonus||0)/Math.max(1,offer.years||1),
    // Existing AI market offers start at .95 of ask before the same medical
    // risk discount. Treat anything below that established floor as genuine
    // undervaluation; role/club quality remains inside offerUtility.
    establishedFloor=.95*(1-medicalContractRisk(db,p)*.4);
  return guaranteed>=ask*establishedFloor;
}

// Club agreement does not authorize a player's permanent move. Evaluate the
// same personal-terms policy as negotiation against a detached decision view.
function contractTransferConsent(db,p,t,offer=null){
  if(p?.loan)return {ok:false,willing:false,reason:'임대 복귀 후 이적을 협상해야 합니다'};
  if(!p?.team||p.retired||!p.contract||p.contract.until<db.year||
    p.contract.medicalReplacement||!t||t.active===false||t.id===p.team)
    return {ok:false,willing:false,reason:'이적 가능한 일반 선수 계약과 다른 구단이 필요합니다'};
  if(db.world?.contractAgreements?.[p.id]?.status==='agreed')
    return {ok:false,willing:false,reason:'이미 합의한 다음 계약을 먼저 처리해야 합니다'};
  const player=JSON.parse(JSON.stringify(p)),team=JSON.parse(JSON.stringify(t)),
    view={...db,players:{...db.players,[p.id]:player},
      teams:{...db.teams,[t.id]:team},_marketDemandCache:{}},
    terms=offer?JSON.parse(JSON.stringify(offer)):{...player.contract,
      years:Math.max(1,player.contract.until-db.year+1),
      signingBonus:0,
      promisedRole:player.contract.promisedRole||player.rosterRole||defaultPromisedRole(view,player,team)},
    utility=offerUtility(view,player,team,terms),
    threshold=offerAcceptanceThreshold(view,player,{kind:'transfer'}),
    reasonable=!offer||contractOfferReasonable(view,player,team,terms,'transfer'),
    willing=Number.isFinite(utility)&&Number.isFinite(threshold)&&reasonable&&utility>=threshold;
  return {ok:true,willing,utility,threshold,terms,
    reason:willing?'선수가 이적 조건에 동의했습니다':
      '선수가 이적 조건을 거절했습니다. 연봉·역할·커리어에 맞는 개인 조건을 협상하세요'};
}

// Offseason departure consent is a player decision, not a second release writer.
function contractMutualTerminationTerms(db,p){
  if(!['offseason','market'].includes(db.world?.phase))
    return {ok:false,reason:'상호 해지는 오프시즌에만 협상할 수 있습니다'};
  if(!p?.team||p.retired||!p.contract||p.contract.until<db.year||p.contract.medicalReplacement)
    return {ok:false,reason:'유효한 일반 선수 계약이 필요합니다'};
  if(db.world?.contractAgreements?.[p.id]?.status==='agreed')
    return {ok:false,reason:'이미 합의한 다음 계약을 먼저 처리해야 합니다'};
  const guaranteedAmount=contractReleaseCost(db,p);
  if(!Number.isFinite(guaranteedAmount)||guaranteedAmount<=0)
    return {ok:false,reason:'계약 보장액이 유효하지 않습니다'};
  const goal=playerCareerGoal({...p}),unhappy=(p.satisfaction??50)<50,
    seekingRole=['backup','competition'].includes(p.rosterRole)&&goal==='starter',
    willing=!!p.wantsOut||unhappy||seekingRole,
    reason=p.wantsOut?'선수의 이적 희망':unhappy?'현재 구단 생활에 대한 불만':
      seekingRole?'다른 구단에서 주전 기회 탐색':'선수가 현재 계약 유지를 희망합니다',
    // Reuse the protection tiers: departure intent can trade some guaranteed
    // compensation for immediate freedom; other unhappy players keep it all.
    fraction=p.wantsOut?.5:seekingRole?.75:1,
    minimumAmount=Math.min(guaranteedAmount,Math.ceil(guaranteedAmount*fraction*10-1e-8)/10);
  return {ok:true,willing,reason,guaranteedAmount,minimumAmount};
}
