// ===== LOL GM: player contract / transfer / release transaction commands =====
// A command validates against a read-only view and commits through the existing
// domain writers. Do not serialize previews or create a second roster ledger.

function playerActionLocal(p,regionId){
  return !!p&&!!regionId&&(p.activeLocalRegion||p.originLocalRegion||p.originRegion||p.region||p.nationality||null)===regionId;
}
function playerActionLocalError(db,team,p){
  if(!team||!p)return '등록 대상을 찾을 수 없습니다';
  if(playerActionLocal(p,team.region)||(team.roster||[]).includes(p.id))return null;
  const count=(team.roster||[]).reduce((n,pid)=>{
    const other=db.players[pid];return n+(other&&!playerActionLocal(other,team.region)?1:0);
  },0);
  return count>=nonLocalLimitForTeam(db,team)?'비로컬 선수 등록 상한을 넘습니다':null;
}
function playerActionMoveError(db,p){
  const count=(p.contractedMoves||[]).filter(m=>m.season===(db.world?.year??db.year)&&m.counts!==false).length;
  return count>=CONTRACTED_MOVE_LIMIT_PER_SEASON?'한 시즌 계약 구단 이동은 최대 2회까지 가능합니다':null;
}
function playerActionAuthority(db,actor,team,exception=null){
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
        foreign:(t.roster||[]).reduce((n,pid)=>n+(db.players[pid]&&!playerActionLocal(db.players[pid],t.region)?1:0),0)}
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
  const auth=playerActionAuthority(db,a.actor,t);
  if(auth)return auth;
  const kind=a.kind||'fa',from=p.team&&playerActionTeam(db,p.team);
  if(!['fa','renewal','initial','transfer'].includes(kind))
    return worldActionError('invalid_action','지원하지 않는 계약 유형입니다');
  if(kind==='renewal'&&p.team!==t.id)
    return worldActionError('invalid_contract','기존 소속 구단에서만 재계약할 수 있습니다');
  if((kind==='fa'||kind==='initial')&&p.team)
    return worldActionError('invalid_contract','FA가 아닌 선수는 신규 계약할 수 없습니다');
  if(kind==='transfer'&&(!from||from.id===t.id||a.fromId!==from.id))
    return worldActionError('invalid_transfer','원소속 구단 정보가 일치하지 않습니다');
  if(!Number.isFinite(+a.salary)||+a.salary<=0||!Number.isFinite(+a.years)||+a.years<=0)
    return worldActionError('invalid_terms','연봉과 계약 기간은 양수여야 합니다');
  const terms=playerActionTerms(db,p,t,a);
  const allNumbers=[terms.salary,terms.years,terms.signingBonus,terms.buyout??0,terms.option?.salary??0,...Object.values(terms.bonuses||{})];
  if(!allNumbers.every(Number.isFinite))
    return worldActionError('invalid_terms','유효하지 않은 계약 금액입니다');
  if(!playerActionFinance(t))return worldActionError('invalid_finance','구단 재정 정보가 없습니다');
  if(kind!=='renewal'){
    const registration=playerActionLocalError(db,t,p);
    if(registration)return worldActionError('registration_limit',registration);
  }
  let fee=0;
  if(kind==='transfer'){
    if(!playerActionFinance(from))return worldActionError('invalid_finance','원소속 구단 재정 정보가 없습니다');
    if(!Number.isFinite(a.fee)||a.fee<0)return worldActionError('invalid_fee','이적료는 0 이상의 유효한 금액이어야 합니다');
    fee=a.fee;
    const move=playerActionMoveError(db,p);if(move)return worldActionError('move_limit',move);
  }
  if(fee+terms.signingBonus>0&&t.finance.cash+1e-8<fee+terms.signingBonus)
    return worldActionError('insufficient_cash','이적료 및 계약금을 지급할 현금이 부족합니다');
  return {ok:true,pid:p.id,teamId:t.id,kind,fromId:from?.id||null,fee,terms};
}
function validatePlayerTransferAction(db,a){
  const p=db.players[a.pid],from=playerActionTeam(db,a.fromId),to=playerActionTeam(db,a.teamId);
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
  const move=playerActionMoveError(db,p)||playerActionLocalError(db,to,p);
  if(move)return worldActionError('invalid_transfer',move);
  return {ok:true,pid:p.id,fromId:from.id,teamId:to.id,fee:a.fee};
}
function validatePlayerReleaseAction(db,a){
  const p=db.players[a.pid],t=playerActionTeam(db,a.teamId),mode=a.mode||'manager';
  if(!p||!t||p.team!==t.id)return worldActionError('invalid_release','방출할 소속 선수를 찾을 수 없습니다');
  if(!['manager','market','initial','expired'].includes(mode))
    return worldActionError('invalid_action','지원하지 않는 방출 유형입니다');
  if(a.actor==='manager'&&mode==='market'||a.actor==='ai'&&(mode==='manager'||mode==='initial'))
    return worldActionError('unauthorized','선택한 작업 주체가 방출 유형과 일치하지 않습니다');
  const auth=playerActionAuthority(db,a.actor,t,mode==='expired'?'expiry':null);if(auth)return auth;
  if(mode==='expired'&&p.contract?.until>=db.year)
    return worldActionError('invalid_release','만료되지 않은 계약은 자동 종료할 수 없습니다');
  if(!playerActionFinance(t))return worldActionError('invalid_finance','구단 재정 정보가 없습니다');
  const cost=mode==='initial'?0:p.contract&&p.contract.until>=db.year?p.contract.salary*(p.contract.until-db.year+1)*.5:0;
  if(!Number.isFinite(cost))return worldActionError('invalid_contract','방출 비용을 계산할 수 없습니다');
  return {ok:true,pid:p.id,teamId:t.id,mode,cost};
}
function validatePlayerOptionAction(db,a){
  const p=db.players[a.pid],t=playerActionTeam(db,a.teamId),option=p?.contract?.option;
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
  const base={type:a.type,actor:a.actor,pid:v.pid,teamId:v.teamId};
  if(a.type==='player.sign')return {...base,kind:v.kind,fromId:v.fromId,fee:v.fee,
    salary:v.terms.salary,years:v.terms.years,terms:JSON.parse(JSON.stringify(v.terms))};
  if(a.type==='player.transfer')return {...base,fromId:v.fromId,fee:v.fee};
  if(a.type==='player.release')return {...base,mode:v.mode};
  return base;
}
function playerActionChanges(db,c,v){
  const from=db.players[c.pid]?.team||null;
  if(c.type==='player.sign')return [{pid:c.pid,kind:c.kind,from,to:c.teamId,
    salary:c.salary,years:c.years,signingBonus:c.terms.signingBonus,fee:c.fee}];
  if(c.type==='player.transfer')return [{pid:c.pid,kind:'transfer',from,to:c.teamId,fee:c.fee}];
  if(c.type==='player.release')return [{pid:c.pid,kind:'release',from,to:null,cost:v.cost}];
  return [{pid:c.pid,kind:'option',team:c.teamId,type:v.option.type,
    salary:v.option.salary}];
}
function applyPlayerSignAction(db,c){
  const p=db.players[c.pid],t=db.teams[c.teamId];
  if(c.kind==='transfer')doTransfer(db,p,db.teams[c.fromId],t,c.fee);
  const contract=signContract(db,p,t,c.salary,c.years,c.terms);
  return {contract};
}
function applyPlayerTransferAction(db,c){
  doTransfer(db,db.players[c.pid],db.teams[c.fromId],db.teams[c.teamId],c.fee);
  return {pid:c.pid,from:c.fromId,to:c.teamId,fee:c.fee};
}
function applyPlayerReleaseAction(db,c){
  const p=db.players[c.pid],t=db.teams[c.teamId],contract=p.contract,
    cost=c.mode==='initial'?0:contract&&contract.until>=db.year?contract.salary*(contract.until-db.year+1)*.5:0;
  if(cost)t.finance.buyout=(t.finance.buyout||0)+cost;
  removePlayerFromTeam(db,p);
  if(c.mode==='manager')invalidateMarketDemand(db);
  p.contract=null;p.faYears=0;
  if(c.mode==='manager')recordPlayerEvent(p,'release',db.year,{team:t.id,cost,date:db.worldDate});
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
