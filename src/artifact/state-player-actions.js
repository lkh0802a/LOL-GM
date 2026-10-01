// ===== LOL GM: player contract / transfer / release transaction commands =====
// A command validates against a read-only view and commits through the existing
// domain writers. Do not serialize previews or create a second roster ledger.

function playerActionAuthority(db,actor,team,exception=null){
  if(actor==='manager'&&managedTeam(db)?.parent)
    return worldActionError('unauthorized','소유 2군의 선수 영입·계약·방출은 모구단이 담당합니다');
  const owner=managedTeamId(db),org=team&&parentTeamOf(db,team),managed=!!(owner&&org?.id===owner);
  if(actor==='manager'&&!managed)return worldActionError('unauthorized','관리 구단 소속 작업만 직접 실행할 수 있습니다');
  if(actor==='ai'&&db.world?.manage==='manual'&&managed&&!['expiry','player-option'].includes(exception))
    return worldActionError('unauthorized','관리 구단의 계약 결정은 AI가 확정할 수 없습니다');
  return null;
}
function playerActionTeam(db,id){
  const t=id&&db.teams[id];return t&&t.active!==false?t:null;
}
function playerActionFinance(t){
  return t?.finance&&Number.isFinite(t.finance.cash)?t.finance:null;
}
function playerActionSnapshot(db,action){
  const p=db.players[action.pid],source=p?.team||null;
  const ids=Array.from(new Set([action.teamId||null,action.fromId||null,source])).filter(Boolean).sort();
  return {
    saveId:db.saveId||null,date:db.worldDate||null,year:db.world?.year??db.year,
    player:p?{
      id:p.id,team:p.team||null,retired:!!p.retired,
      contract:p.contract?JSON.parse(JSON.stringify(p.contract)):null,
      contractedMoves:JSON.parse(JSON.stringify(p.contractedMoves||[])),
      activeLocalRegion:p.activeLocalRegion||null,
      originLocalRegion:p.originLocalRegion||null,originRegion:p.originRegion||null,
      region:p.region||null,rosterRole:p.rosterRole||null
    }:null,
    teams:ids.map(id=>{
      const t=db.teams[id];
      return t?{id,active:t.active!==false,roster:(t.roster||[]).slice().sort(),
        cash:t.finance?.cash??null,buyout:t.finance?.buyout??null,
        foreign:teamNonLocalCount(db,t)}
      :{id,missing:true};
    })
  };
}
function playerActionTerms(db,p,t,action){
  // Starter lookup repairs its team's depth chart. Evaluate the same default
  // role against a detached chart instead of altering game state in preview.
  const terms=action.terms||{};
  const role=SQUAD_ROLES.includes(terms.promisedRole)?terms.promisedRole
    :defaultPromisedRole(db,p,{...t,depthChart:{...(t.depthChart||{})},roster:(t.roster||[]).slice()});
  return normalizeContractTerms(db,p,t,action.salary,action.years,{...terms,promisedRole:role});
}
function validatePlayerSignAction(db,a){
  const p=db.players[a.pid],t=playerActionTeam(db,a.teamId);
  if(!p||p.retired||!t)return worldActionError('missing_target','계약할 선수 또는 구단을 찾을 수 없습니다');
  if(p.loan)return worldActionError('active_loan','임대 중에는 원계약을 변경할 수 없습니다');
  const auth=playerActionAuthority(db,a.actor,t);
  if(auth)return auth;
  const kind=a.kind||'fa',from=p.team&&playerActionTeam(db,p.team);
  if(!['fa','renewal','initial','transfer','medical_replacement',
      'renewal_agreement','early_fa_agreement'].includes(kind))
    return worldActionError('invalid_action','지원하지 않는 계약 유형입니다');
  const futureAgreement=['renewal_agreement','early_fa_agreement'].includes(kind)
    ?contractAgreementFor(db,p.id):null;
  if(kind==='renewal_agreement'){
    if(a.actor!=='system'||!futureAgreement||futureAgreement.status!=='agreed'||
      futureAgreement.kind!=='renewal'||futureAgreement.teamId!==t.id||
      p.team!==futureAgreement.fromTeamId||futureAgreement.effectiveDate>db.worldDate||
      (p.contract&&p.contract.until>=db.year))
      return worldActionError('invalid_contract','발효 가능한 원소속 재계약 합의가 아닙니다');
  }
  if(kind==='early_fa_agreement'){
    if(a.actor!=='system'||!futureAgreement||futureAgreement.status!=='agreed'||
      futureAgreement.kind!=='early_fa'||futureAgreement.teamId!==t.id||
      p.team||p.contract||futureAgreement.effectiveDate>db.worldDate)
      return worldActionError('invalid_contract','발효 가능한 조기접촉 계약 합의가 아닙니다');
  }
  if(kind==='renewal'&&p.team!==t.id)
    return worldActionError('invalid_contract','기존 소속 구단에서만 재계약할 수 있습니다');
  if((kind==='fa'||kind==='initial'||kind==='medical_replacement'||kind==='early_fa_agreement')&&p.team)
    return worldActionError('invalid_contract','FA가 아닌 선수는 신규 계약할 수 없습니다');
  if(kind==='transfer'&&(!from||from.id===t.id||a.fromId!==from.id))
    return worldActionError('invalid_transfer','원소속 구단 정보가 일치하지 않습니다');
  if(!Number.isFinite(+a.salary)||+a.salary<=0||!Number.isFinite(+a.years)||+a.years<=0)
    return worldActionError('invalid_terms','연봉과 계약 기간은 양수여야 합니다');
  if(!contractGuaranteeTermsValid(a.terms))
    return worldActionError('invalid_terms','방출 보장률은 50%, 75%, 100% 중 선택해야 합니다');
  const terms=playerActionTerms(db,p,t,a);
  if(futureAgreement){
    const agreed=normalizeContractTerms(db,p,t,futureAgreement.salary,
      futureAgreement.years,futureAgreement.terms);
    if(+a.salary!==futureAgreement.salary||+a.years!==futureAgreement.years||
      JSON.stringify(terms)!==JSON.stringify(agreed))
      return worldActionError('invalid_terms','미래 계약 발효 조건은 원래 합의한 조건과 같아야 합니다');
  }
  let replacement=null;
  if(kind==='medical_replacement'){
    const original=db.players[a.replacement?.forPid],days=+a.replacement?.absenceDays;
    if(a.actor!=='system'||!original||original===p||original.team!==t.id||
      medicalOut(original)||medicalAvailable(db,t)!==5||p.medical?.daysLeft>0||
      !Number.isInteger(days)||days<2||days>90||+a.years!==1||
      terms.signingBonus||terms.option||terms.buyout||
      Object.values(terms.bonuses).some(Boolean))
      return worldActionError('invalid_contract','의료 긴급 대체 계약의 전제 조건이 충족되지 않았습니다');
    replacement=medicalReplacementClause(db,original,days,terms.salary);
    if(t.finance?.cash+1e-8<replacement.paid)
      return worldActionError('insufficient_cash','긴급 대체 계약의 보장급을 지급할 현금이 부족합니다');
  }else if(a.replacement)
    return worldActionError('invalid_contract','일반 선수 계약에는 의료 대체 조건을 붙일 수 없습니다');
  const allNumbers=[terms.salary,terms.years,terms.signingBonus,terms.buyout??0,terms.option?.salary??0,...Object.values(terms.bonuses||{})];
  if(!allNumbers.every(Number.isFinite))
    return worldActionError('invalid_terms','유효하지 않은 계약 금액입니다');
  if(!playerActionFinance(t))return worldActionError('invalid_finance','구단 재정 정보가 없습니다');
  if(kind!=='renewal'&&kind!=='renewal_agreement'){
    const capacity=loanOutgoingPlayers(db,t).length&&loanRosterCapacityError(db,t,p);
    if(capacity)return worldActionError('registration_limit',capacity);
    const registration=localRegistrationError(db,t,p);
    if(registration)return worldActionError('registration_limit',registration);
  }
  let fee=0;
  if(kind==='transfer'){
    if(!playerActionFinance(from))return worldActionError('invalid_finance','원소속 구단 재정 정보가 없습니다');
    if(!Number.isFinite(a.fee)||a.fee<0)return worldActionError('invalid_fee','이적료는 0 이상의 유효한 금액이어야 합니다');
    fee=a.fee;
    const move=contractedMoveError(db,p);if(move)return worldActionError('move_limit',move);
  }
  if(fee+terms.signingBonus>0&&t.finance.cash+1e-8<fee+terms.signingBonus)
    return worldActionError('insufficient_cash','이적료 및 계약금을 지급할 현금이 부족합니다');
  let consent=null;
  if(kind==='transfer'){
    consent=contractTransferConsent(db,p,t,terms);
    if(!consent.ok||!consent.willing)return worldActionError('player_consent',consent.reason);
  }
  return {ok:true,pid:p.id,teamId:t.id,kind,fromId:from?.id||null,fee,terms,replacement,consent};
}
function validatePlayerTransferAction(db,a){
  const p=db.players[a.pid],from=playerActionTeam(db,a.fromId),to=playerActionTeam(db,a.teamId);
  if(p?.loan)return worldActionError('active_loan','임대 중에는 다른 구단으로 이적할 수 없습니다');
  if(!p||p.retired||!from||!to||from.id===to.id||p.team!==from.id)
    return worldActionError('invalid_transfer','이적 구단 또는 소속 선수 정보가 일치하지 않습니다');
  const auth=playerActionAuthority(db,a.actor,to);
  if(auth)return auth;
  if(a.actor==='ai'&&db.world?.manage==='manual'){
    const fromAuth=playerActionAuthority(db,'ai',from);
    if(fromAuth)return fromAuth;
  }
  if(!Number.isFinite(a.fee)||a.fee<0)return worldActionError('invalid_fee','이적료는 0 이상의 유효한 금액이어야 합니다');
  if(!playerActionFinance(from)||!playerActionFinance(to))return worldActionError('invalid_finance','구단 재정 정보가 없습니다');
  if(a.fee>0&&to.finance.cash+1e-8<a.fee)return worldActionError('insufficient_cash','이적료를 지급할 현금이 부족합니다');
  const move=contractedMoveError(db,p)||localRegistrationError(db,to,p);
  if(move)return worldActionError('invalid_transfer',move);
  const capacity=loanOutgoingPlayers(db,to).length&&loanRosterCapacityError(db,to,p);
  if(capacity)return worldActionError('registration_limit',capacity);
  const consent=contractTransferConsent(db,p,to);
  if(!consent.ok||!consent.willing)return worldActionError('player_consent',consent.reason);
  return {ok:true,pid:p.id,fromId:from.id,teamId:to.id,fee:a.fee,consent};
}
function validatePlayerReleaseAction(db,a){
  const p=db.players[a.pid],t=playerActionTeam(db,a.teamId),mode=a.mode||'manager';
  if(p?.loan)return worldActionError('active_loan','임대 선수의 계약은 임대 구단이 방출할 수 없습니다');
  if(!p||!t||p.team!==t.id)return worldActionError('invalid_release','방출할 소속 선수를 찾을 수 없습니다');
  if(!['manager','market','initial','expired','medical_end','mutual'].includes(mode))
    return worldActionError('invalid_action','지원하지 않는 방출 유형입니다');
  if(a.actor==='manager'&&mode==='market'||a.actor==='ai'&&(mode==='manager'||mode==='initial'))
    return worldActionError('unauthorized','선택한 작업 주체가 방출 유형과 일치하지 않습니다');
  const date=mode==='medical_end'?a.date||db.worldDate:null;
  if(mode==='medical_end'&&(a.actor!=='system'||!medicalReplacementSafeToEnd(db,p,date)))
    return worldActionError('invalid_release','의료 대체 계약의 종료 시점 또는 법정 등록 인원 조건이 충족되지 않았습니다');
  if((mode==='market'||mode==='expired')&&p.contract?.medicalReplacement)
    return worldActionError('invalid_release','의료 대체 계약은 의료 종료 규칙으로만 자동 만료됩니다');
  const auth=playerActionAuthority(db,a.actor,t,mode==='expired'?'expiry':null);if(auth)return auth;
  if(mode==='expired'&&p.contract?.until>=db.year)
    return worldActionError('invalid_release','만료되지 않은 계약은 자동 종료할 수 없습니다');
  if(!playerActionFinance(t))return worldActionError('invalid_finance','구단 재정 정보가 없습니다');
  let cost=contractReleaseCost(db,p,mode);
  if(mode==='mutual'){
    const consent=contractMutualTerminationTerms(db,p);
    if(!consent.ok||!consent.willing)
      return worldActionError('player_consent',consent.reason);
    if(!Number.isFinite(a.amount)||a.amount<consent.minimumAmount||a.amount>consent.guaranteedAmount)
      return worldActionError('invalid_terms','합의금은 선수 요구액 이상, 계약 보장액 이하여야 합니다');
    cost=a.amount;
  }
  if(!Number.isFinite(cost))return worldActionError('invalid_contract','방출 비용을 계산할 수 없습니다');
  return {ok:true,pid:p.id,teamId:t.id,mode,cost,date};
}
function validatePlayerOptionAction(db,a){
  const p=db.players[a.pid],t=playerActionTeam(db,a.teamId),option=p?.contract?.option;
  if(p?.loan)return worldActionError('active_loan','임대 복귀 후 원소속 구단에서 옵션을 처리합니다');
  if(!p||!t||p.team!==t.id||!option||option.year!==db.year)
    return worldActionError('invalid_option','행사할 수 있는 계약 옵션이 없습니다');
  if(a.actor==='manager'&&option.type!=='team')
    return worldActionError('invalid_option','선수 옵션은 구단이 직접 행사할 수 없습니다');
  const auth=playerActionAuthority(db,a.actor,t,option.type==='player'?'player-option':null);
  if(auth)return auth;
  if(!Number.isFinite(option.salary))return worldActionError('invalid_terms','옵션 연봉이 유효하지 않습니다');
  return {ok:true,pid:p.id,teamId:t.id,option:{...option}};
}
function playerActionCanonical(db,a,v){
  const base={type:a.type,actor:a.actor,pid:v.pid,teamId:v.teamId,
    ...(v.consent?{consent:JSON.parse(JSON.stringify(v.consent))}:{})};
  if(a.type==='player.sign')return {...base,kind:v.kind,fromId:v.fromId,fee:v.fee,
    salary:v.terms.salary,years:v.terms.years,terms:JSON.parse(JSON.stringify(v.terms)),
    ...(v.replacement?{replacement:{...v.replacement}}:{})};
  if(a.type==='player.transfer')return {...base,fromId:v.fromId,fee:v.fee};
  if(a.type==='player.release')return {...base,mode:v.mode,
    ...(v.mode==='mutual'?{amount:v.cost}:{}),
    ...(v.mode==='medical_end'?{date:v.date}:{})};
  return base;
}
function playerActionChanges(db,c,v){
  const from=db.players[c.pid]?.team||null;
  if(c.type==='player.sign')return [{pid:c.pid,kind:c.kind,from,to:c.teamId,
    salary:c.salary,years:c.years,signingBonus:c.terms.signingBonus,fee:c.fee}];
  if(c.type==='player.transfer')return [{pid:c.pid,kind:'transfer',from,to:c.teamId,fee:c.fee}];
  if(c.type==='player.release')return [{pid:c.pid,kind:'release',from,to:null,cost:v.cost,
    settlement:contractReleaseSettlement(db,db.players[c.pid],c.mode,c.amount)}];
  return [{pid:c.pid,kind:'option',team:c.teamId,type:v.option.type,
    salary:v.option.salary}];
}
function applyPlayerSignAction(db,c){
  const p=db.players[c.pid],t=db.teams[c.teamId];
  if(c.kind==='transfer')doTransfer(db,p,db.teams[c.fromId],t,c.fee,c.consent);
  const cw=db.world?.contractWindow,
    offseasonFaSeason=c.kind==='fa'&&db.world?.phase==='offseason'&&
      cw?.stage==='fa'?cw.startSeason:null,
    beforeYear=db.year;
  if(offseasonFaSeason)db.year=offseasonFaSeason;
  const contract=signContract(db,p,t,c.salary,c.years,c.terms);
  if(offseasonFaSeason)db.year=beforeYear;
  if(c.kind==='medical_replacement'){
    contract.medicalReplacement={...c.replacement};
    payMedicalReplacementWage(t,c.replacement.paid);
    recordPlayerEvent(p,'medical_emergency_fa',db.year,{date:db.worldDate,
      for:c.replacement.forPid,to:t.id,salary:contract.salary,
      guaranteedThrough:c.replacement.guaranteedThrough,
      expiresOn:c.replacement.expiresOn,guarantee:c.replacement.paid});
  }
  return {contract};
}
function applyPlayerTransferAction(db,c){
  doTransfer(db,db.players[c.pid],db.teams[c.fromId],db.teams[c.teamId],c.fee,c.consent);
  return {pid:c.pid,from:c.fromId,to:c.teamId,fee:c.fee};
}
function applyPlayerReleaseAction(db,c){
  const p=db.players[c.pid],t=db.teams[c.teamId],contract=p.contract,
    settlement=contractReleaseSettlement(db,p,c.mode,c.amount),cost=settlement.amount;
  recordContractReleaseObligation(t,cost,settlement);
  removePlayerFromTeam(db,p);
  if(['manager','medical_end','mutual','club_closure'].includes(c.mode))invalidateMarketDemand(db);
  closeOralRolePromise(db,p,'release');
  p.contract=null;p.faYears=0;
  if(['manager','mutual','club_closure'].includes(c.mode)||cost>0)
    recordPlayerEvent(p,c.mode==='mutual'?'mutual_termination':
      c.mode==='club_closure'?'club_closure':'release',db.year,
    {team:t.id,cost,date:db.worldDate,settlement});
  if(c.mode==='medical_end'){
    recordPlayerEvent(p,'medical_replacement_end',db.year,{
      date:c.date,team:t.id,for:contract.medicalReplacement.forPid,
      paid:contract.medicalReplacement.paid});
    if(parentTeamOf(db,t)?.id===managedTeamId(db))
      news(db,p.name+' 선수의 의료 대체 계약이 종료되어 FA로 복귀했습니다 ('+t.short+')');
  }
  return {pid:p.id,teamId:t.id,cost};
}
function applyPlayerOptionAction(db,c){
  if(!exerciseContractOption(db,db.players[c.pid],db.teams[c.teamId],c.actor==='manager'?'manager':db.players[c.pid].contract.option.type==='player'?'player':'ai'))
    throw new Error('Contract option changed after validation');
  return {contract:db.players[c.pid].contract};
}

for(const [type,validate,apply] of [
  ['player.sign',validatePlayerSignAction,applyPlayerSignAction],
  ['player.transfer',validatePlayerTransferAction,applyPlayerTransferAction],
  ['player.release',validatePlayerReleaseAction,applyPlayerReleaseAction],
  ['player.option',validatePlayerOptionAction,applyPlayerOptionAction]
]){
  WORLD_ACTION_HANDLERS[type]={
    validate,
    canonical:playerActionCanonical,
    snapshot:playerActionSnapshot,
    changes:playerActionChanges,
    apply
  };
}
