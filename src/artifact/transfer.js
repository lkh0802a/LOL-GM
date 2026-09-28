// ===== LOL GM: Recruitment / negotiation / transfer domain =====
// Owns recruitment board workflow, player negotiations, seller negotiations and permanent transfers.

const RECRUIT_PRIORITY=['A','B','C'];
function recruitmentStore(db){const w=db.world;if(!w)return {};w.recruitment=w.recruitment||{};w.recruitment.targets=w.recruitment.targets||{};return w.recruitment.targets}
function recruitmentTarget(db,pid){return recruitmentStore(db)[pid]||null}
function setRecruitmentPriority(db,pid,priority='B'){
  const p=db.players[pid];if(!p||p.retired)return {ok:false,msg:'영입 대상을 찾을 수 없습니다'};
  priority=RECRUIT_PRIORITY.includes(priority)?priority:'B';const store=recruitmentStore(db),prev=store[pid];
  store[pid]={pid,priority,stage:prev?.stage||'interest',addedDate:prev?.addedDate||db.worldDate,knowledge:knowledge(db,p),evaluation:prev?.evaluation||null,negotiationId:prev?.negotiationId||null,result:prev?.result||null};
  syncRecruitmentObservation(db,pid);return {ok:true,target:store[pid],msg:`${p.name} 영입 후보 ${priority}로 등록했습니다`};
}
function removeRecruitmentTarget(db,pid){const store=recruitmentStore(db),e=store[pid];if(!e)return '영입 후보에 없는 선수입니다';const n=e.negotiationId&&negotiationStore(db)[e.negotiationId];if(n&&n.status==='open')return '진행 중인 협상을 먼저 종료해야 합니다';const name=db.players[pid]?.name||pid;delete store[pid];return name+' 영입 후보 등록을 해제했습니다'}
function syncRecruitmentObservation(db,pid){
  const e=recruitmentTarget(db,pid),p=db.players[pid];if(!e||!p)return e;const k=knowledge(db,p);e.knowledge=k;
  if(e.stage==='interest'&&k>=35)e.stage='observed';return e;
}
function recruitmentEvaluation(db,pid,teamId=null){
  const t=teamId?db.teams[teamId]:myT(db),p=db.players[pid],e=recruitmentTarget(db,pid);if(!t||!p)return {ok:false,msg:'영입 대상을 찾을 수 없습니다'};if(!e)return {ok:false,msg:'먼저 관심목록에 등록해야 합니다'};
  syncRecruitmentObservation(db,pid);const k=knowledge(db,p);if(k<35)return {ok:false,msg:`관찰 정보가 부족합니다 (현재 ${k}%, 내부 평가에는 35% 이상 필요)`};
  const r=scoutReport(db,p),ability=Math.round(avg(r.ability)),potential=Math.round(avg(r.potential)),cur=starterFor(db,t,p.role),gap=cur?ability-playerOvr(cur):8,baseBudget=(db.world?.phase==='initial_roster'&&typeof initialSalaryBudget==='function')?initialSalaryBudget(db,t):salaryBudget(db,t),room=Math.max(.1,baseBudget-payroll(db,t)),cost=asking(db,p,t.region)/room;
  const fit=Math.round(clamp(50+gap*4+(potential-ability)*.9+(p.age<=21?5:0)+teamInternationalAppeal(db,t)*5-Math.max(0,cost-1)*18,0,100));
  e.stage='evaluated';e.knowledge=k;e.evaluation={teamId:t.id,date:db.worldDate,knowledge:k,ability:r.ability,potential:r.potential,fit,expectedRole:defaultPromisedRole(db,p,t),salaryAsk:asking(db,p,t.region),marketValue:playerMarketValue(db,p),risk:Math.round(scoutingRisk(db,p)*10)/10};
  return {ok:true,target:e,msg:`${p.name} 내부 평가 완료 · 적합도 ${fit}/100`};
}
function recruitmentReady(db,pid,teamId=null){const e=syncRecruitmentObservation(db,pid);return !!(e&&['evaluated','negotiating'].includes(e.stage)&&(!teamId||!e.evaluation?.teamId||e.evaluation.teamId===teamId))}
function recruitmentBoard(db){const rank={A:0,B:1,C:2};return Object.values(recruitmentStore(db)).sort((a,b)=>(rank[a.priority]??9)-(rank[b.priority]??9)||String(a.addedDate||'').localeCompare(String(b.addedDate||'')))}
function mInterest(db,pid,priority='B'){return setRecruitmentPriority(db,pid,priority).msg}
function mEvaluateTarget(db,pid,teamId=null){return recruitmentEvaluation(db,pid,teamId).msg}
function mDropInterest(db,pid){return removeRecruitmentTarget(db,pid)}

// ---- 선수 계약 협상 엔진 ----
function negotiationStore(db){const w=db.world;if(!w)return {};w.negotiations=w.negotiations||{};return w.negotiations}
function negotiationId(db,pid,kind,teamId=null){return 'NEG_'+db.year+'_'+pid+'_'+kind+(teamId?'_'+teamId:'')}
function negotiationRoundLimit(p){return clamp(3+Math.round((p.personality.professionalism-50)/35)-(p.personality.ambition>=82?1:0),2,5)}
function negotiationPreferredYears(p){const goal=playerCareerGoal(p);if(p.age>=29)return 1;if(p.age<=21&&goal==='development')return 3;if(goal==='stability')return 3;if(p.personality.ambition>=82&&p.age>=23)return 1;return 2}
function negotiationCompetition(db,p,t,rng,kind){
  if(kind==='renewal')return [];
  return activeTeams(db,null,1).filter(x=>x.id!==t.id&&!x.parent).map(team=>{
    if(localRegistrationError(db,team,p))return null;
    const cur=starterFor(db,team,p.role),need=!cur?8:aiMarketObservation(db,p,team).ability-playerOvr(cur),baseBudget=(kind==='initial'&&typeof initialSalaryBudget==='function')?initialSalaryBudget(db,team):salaryBudget(db,team),room=baseBudget-payroll(db,team),ask=asking(db,p,team.region);
    if(room<ask*.82||need<-4)return null;
    const years=contractYearsForPlayer(db,p,rng),terms=normalizeContractTerms(db,p,team,ask*rng.range(.94,1.12),years,{promisedRole:defaultPromisedRole(db,p,team),option:rng.chance(.14)?{type:'player'}:null});
    return {teamId:team.id,terms,utility:offerUtility(db,p,team,terms),need};
  }).filter(Boolean).sort((a,b)=>b.utility-a.utility).slice(0,2);
}
function negotiationDemand(db,p,t,kind,rng,competitors=[]){
  const ask=asking(db,p,t.region),best=competitors.length?Math.max(...competitors.map(x=>x.utility)):0,goal=playerCareerGoal(p),years=negotiationPreferredYears(p);
  ensureSatisfaction(p);let premium=1+(p.personality.ambition-50)/500+(p.wantsOut&&kind==='renewal'?.12:0)+(best>offerAcceptanceThreshold(db,p)?.06:0);
  if(kind==='renewal'){premium+=Math.max(0,(55-p.managerTrust)/230)+Math.max(0,(45-p.managerRelationship)/320);if(p.satisfaction>=75&&p.managerTrust>=65)premium-=.045}
  const role=goal==='starter'?'starter':defaultPromisedRole(db,p,t),sign=ask*(p.reputation>=82?.18:p.personality.ambition>=75?.14:.09);
  const option=p.personality.ambition>=78&&p.age<=27?{type:'player'}:null,buyout=p.personality.ambition>=82?Math.round(playerMarketValue(db,p)*1.8*10)/10:null;
  return normalizeContractTerms(db,p,t,ask*premium,years,{signingBonus:sign,bonuses:{performance:ask*.07,title:ask*.12,international:ask*.07},promisedRole:role,option,buyout});
}
function startNegotiation(db,pid,kind='fa',extra={}){
  const w=db.world,t=extra.teamId?db.teams[extra.teamId]:myT(db),p=db.players[pid];if(!w||!t||!p)return {ok:false,msg:'협상 대상을 찾을 수 없습니다'};
  if(kind==='transfer'){const moveErr=contractedMoveError(db,p);if(moveErr)return {ok:false,msg:moveErr}}
  if((kind==='fa'||kind==='initial')&&p.team)return {ok:false,msg:'FA 선수가 아닙니다'};if(kind==='renewal'&&p.team!==t.id)return {ok:false,msg:'우리 팀 선수가 아닙니다'};
  if(kind==='initial'){const allowed=typeof setupTeamsForManager==='function'?new Set(setupTeamsForManager(db).map(x=>x.id)):new Set([managedTeamId(db)]);if(!allowed.has(t.id))return {ok:false,msg:'내 구단 조직의 스쿼드만 계약 대상이 될 수 있습니다'}}
  if((kind==='fa'||kind==='transfer'||kind==='initial')&&!recruitmentReady(db,pid,t.id))return {ok:false,msg:'관심 등록 → 관찰 → 내부 평가를 완료한 뒤 공식 협상을 시작할 수 있습니다'};
  const id=negotiationId(db,pid,kind,kind==='initial'?t.id:null),store=negotiationStore(db);if(store[id]&&store[id].status==='open')return {ok:true,neg:store[id],msg:p.name+' 협상이 이미 진행 중입니다'};
  const rng=new RNG(w.seed+'/'+db.year+'/'+pid+'/'+kind+'/'+t.id,'negotiation'),competitors=negotiationCompetition(db,p,t,rng,kind),demand=negotiationDemand(db,p,t,kind,rng,competitors),rounds=negotiationRoundLimit(p);
  const neg={id,pid,teamId:t.id,kind,status:'open',stage:kind==='transfer'?'club':'player',sellerId:extra.sellerId||p.team||null,fee:extra.fee||0,clubCounter:null,round:0,maxRounds:rounds,patience:rounds,competitors,demand,counter:demand,lastOffer:null,lastUtility:null,history:[],createdDate:db.worldDate};
  store[id]=neg;const target=recruitmentTarget(db,pid);if(target){target.stage='negotiating';target.negotiationId=id}
  return {ok:true,neg,msg:p.name+' 측과 협상을 시작했습니다'};
}
function negotiationBudgetError(db,p,t,terms,kind){
  const current=kind==='renewal'&&p.contract?p.contract.salary:0,projected=payroll(db,t)-current+terms.salary,baseBudget=kind==='initial'&&typeof initialSalaryBudget==='function'?initialSalaryBudget(db,t):salaryBudget(db,t);
  if(kind==='initial'&&typeof initialOfferCheck==='function'){const x=initialOfferCheck(db,p,t,terms);if(!x.ok)return x.reason}
  else if(projected>baseBudget*1.2)return '연봉 예산을 크게 초과합니다';
  if((terms.signingBonus||0)>t.finance.cash)return '계약금을 지급할 현금이 부족합니다';
  if(kind!=='renewal'){const localErr=localRegistrationError(db,t,p);if(localErr)return localErr}
  return null;
}
function negotiationCounter(db,neg,offer){
  const p=db.players[neg.pid],t=db.teams[neg.teamId],d=neg.demand,blend=(a,b,w)=>Math.round((a+(b-a)*w)*10)/10,rank={backup:0,prospect:1,competition:2,starter:3,core:4};
  const role=(rank[offer.promisedRole]||0)>=(rank[d.promisedRole]||0)?offer.promisedRole:d.promisedRole,years=offer.years===d.years?offer.years:(Math.abs(offer.years-d.years)<=1?d.years:Math.round((offer.years+d.years)/2));
  const option=d.option?.type==='player'?{type:'player',salary:blend(offer.salary,d.salary,.55)}:(offer.option?.type==='team'&&p.personality.ambition>=72?null:offer.option),buyout=d.buyout?Math.min(offer.buyout||d.buyout,d.buyout):offer.buyout;
  return normalizeContractTerms(db,p,t,Math.max(offer.salary*1.025,blend(offer.salary,d.salary,.68)),years,{signingBonus:Math.max(offer.signingBonus||0,blend(offer.signingBonus||0,d.signingBonus||0,.72)),bonuses:{performance:Math.max(offer.bonuses?.performance||0,(d.bonuses?.performance||0)*.78),title:Math.max(offer.bonuses?.title||0,(d.bonuses?.title||0)*.78),international:Math.max(offer.bonuses?.international||0,(d.bonuses?.international||0)*.78)},promisedRole:role,option,buyout});
}
function finalizeNegotiation(db,neg,terms){
  const p=db.players[neg.pid],t=db.teams[neg.teamId];
  if(!p||!t)return {ok:false,msg:'협상 선수 또는 구단이 존재하지 않습니다'};
  const result=commitWorldAction(db,{type:'player.sign',pid:p.id,teamId:t.id,kind:neg.kind,
    fromId:neg.kind==='transfer'?neg.sellerId:null,fee:neg.kind==='transfer'?neg.fee:0,
    salary:terms.salary,years:terms.years,terms,actor:'manager'});
  if(!result.ok)return {ok:false,msg:(result.errors||['계약 조건이 변경되었습니다']).join(' · ')};
  neg.status='accepted';neg.counter=null;neg.acceptedTerms=terms;neg.closedDate=db.worldDate;
  const target=recruitmentTarget(db,neg.pid);if(target){target.stage='closed';target.result='signed';target.negotiationId=neg.id}
  return {ok:true,msg:p.name+' 계약 합의 · '+money(terms.salary)+' · '+terms.years+'년'};
}
function submitNegotiationOffer(db,nid,terms){
  const neg=negotiationStore(db)[nid];if(!neg||neg.status!=='open'||neg.stage!=='player')return {ok:false,msg:'진행 중인 선수 협상이 아닙니다'};
  const p=db.players[neg.pid],t=db.teams[neg.teamId],offer=normalizeContractTerms(db,p,t,terms.salary,terms.years,terms),err=negotiationBudgetError(db,p,t,offer,neg.kind);if(err)return {ok:false,msg:err};if(neg.kind==='transfer'&&(offer.signingBonus||0)>Math.max(0,t.finance.cash-(neg.fee||0)))return {ok:false,msg:'이적료 지급 후 계약금을 지급할 현금이 부족합니다'};
  const util=offerUtility(db,p,t,offer,{renewal:neg.kind==='renewal'}),comp=neg.competitors.length?Math.max(...neg.competitors.map(x=>x.utility)):0,threshold=Math.max(offerAcceptanceThreshold(db,p),comp-.035);
  neg.round++;if(neg.lastUtility!=null&&util<neg.lastUtility-.03)neg.patience--;if(util<threshold-.22)neg.patience--;neg.lastOffer=offer;neg.lastUtility=util;neg.history.push({round:neg.round,side:'club',terms:offer,utility:Math.round(util*1000)/1000});
  if(util>=threshold){const r=finalizeNegotiation(db,neg,offer);neg.history.push({round:neg.round,side:'player',result:r.ok?'accept':'commit_rejected'});return r}
  if(neg.round>=neg.maxRounds||neg.patience<=0||util<threshold-.62){neg.status='withdrawn';neg.reason='조건 차이가 커 협상 결렬';neg.closedDate=db.worldDate;const target=recruitmentTarget(db,neg.pid);if(target){target.stage='evaluated';target.result='negotiation_failed';target.negotiationId=null}return {ok:false,msg:p.name+' 측이 협상에서 철수했습니다'}}
  if((neg.kind==='fa'||neg.kind==='initial')&&neg.round>=2&&neg.competitors.length){
    const rival=neg.competitors[0],rt=db.teams[rival.teamId],gap=rival.utility-util,rrng=new RNG(db.world.seed+'/'+neg.id+'/'+neg.round,'negotiation-rival');
    if(rt&&!p.team&&!negotiationBudgetError(db,p,rt,rival.terms,'fa')&&rival.utility>=offerAcceptanceThreshold(db,p)-.02&&(gap>.08||rrng.chance(clamp(.16+Math.max(0,gap)*1.8,.12,.72)))){
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
function sellerTransferAsk(db,p,from){if(p.contract?.buyout)return p.contract.buyout;const base=transferFee(db,p),starter=starterFor(db,from,p.role)===p,financeNeed=from.finance.cash<0?.88:1,exit=p.wantsOut?.82:1;return Math.round(base*(starter?1.12:.96)*financeNeed*exit*10)/10}
function mTransferBid(db,pid,fee){
  const t=myT(db),p=db.players[pid],from=p&&db.teams[p.team];if(!p||!from||from.id===t.id)return '이적 대상을 찾을 수 없습니다';if(fee>t.finance.cash)return '보유 자금이 부족합니다';
  const moveErr=contractedMoveError(db,p);if(moveErr)return moveErr;const localErr=localRegistrationError(db,t,p);if(localErr)return localErr;
  const id=negotiationId(db,pid,'transfer'),store=negotiationStore(db),ask=sellerTransferAsk(db,p,from);let neg=store[id];
  if(!neg||neg.status!=='open'){const st=startNegotiation(db,pid,'transfer',{sellerId:from.id});if(!st.ok)return st.msg;neg=st.neg;neg.stage='club';neg.clubRounds=0}
  neg.clubRounds=(neg.clubRounds||0)+1;neg.history.push({round:neg.clubRounds,stage:'club',side:'buyer',fee});
  const acceptAt=ask*(from.finance.cash<0?.9:1);
  if(fee>=acceptAt){neg.fee=Math.round(fee*10)/10;neg.stage='player';neg.clubCounter=null;neg.history.push({round:neg.clubRounds,stage:'club',side:'seller',result:'accept',fee:neg.fee});return from.name+'과 이적료 '+money(neg.fee)+' 합의 · 이제 '+p.name+' 측과 개인조건을 협상하세요'}
  if(neg.clubRounds>=3&&fee<ask*.82){neg.status='withdrawn';neg.reason='이적료 협상 결렬';return from.name+': 이적료 협상 종료'}
  neg.clubCounter=Math.round(Math.max(fee*1.06,(fee+ask)/2)*10)/10;neg.history.push({round:neg.clubRounds,stage:'club',side:'seller',result:'counter',fee:neg.clubCounter});return from.name+' 역제안: '+money(neg.clubCounter);
}
function acceptSellerCounter(db,nid){const neg=negotiationStore(db)[nid];if(!neg||neg.status!=='open'||neg.stage!=='club'||!neg.clubCounter)return '수락할 구단 역제안이 없습니다';return mTransferBid(db,neg.pid,neg.clubCounter)}
function closeOpenNegotiationsForDeadline(db){
  for(const neg of Object.values(negotiationStore(db))){if(neg.status!=='open')continue;neg.status='expired';neg.reason='이적시장 마감';neg.closedDate=db.worldDate;const target=recruitmentTarget(db,neg.pid);if(target){target.stage='closed';target.result='deadline';target.negotiationId=neg.id}}
}
// ---- 이적료 / 직접 운영 ----
function transferFee(db,p){const left=p.contract?Math.max(1,p.contract.until-db.year+1):1;return Math.round(playerMarketValue(db,p)*(.62+.18*Math.min(3,left))*(p.wantsOut?.75:1)*10)/10}
function doTransfer(db,p,from,to,fee){
  const moveErr=contractedMoveError(db,p),localErr=localRegistrationError(db,to,p);if(moveErr||localErr)throw new Error(moveErr||localErr);
  recordContractedMove(db,p,'permanent',from,to,{fee});assignPlayerToTeam(db,p,to);
  from.finance.cash=Math.round((from.finance.cash+fee)*10)/10;to.finance.cash=Math.round((to.finance.cash-fee)*10)/10;
  recordPlayerEvent(p,'transfer',db.year,{from:from.id,to:to.id,fee,date:db.worldDate});
  news(db,`이적: ${p.name} ${from.name} → ${to.name} (이적료 ${money(fee)})`);
}
function myT(db){return managedTeam(db)}
function mResign(db,pid,years){const r=startNegotiation(db,pid,'renewal');return r.msg}
function mExerciseTeamOption(db,pid){
  const t=myT(db),p=db.players[pid],o=p?.contract?.option;
  if(!t||!p||p.team!==t.id)return '우리 팀 선수가 아닙니다';
  if(!o||o.type!=='team'||o.year!==db.year)return '행사할 수 있는 팀 옵션이 없습니다';
  const result=commitWorldAction(db,{type:'player.option',pid,teamId:t.id,actor:'manager'});
  if(!result.ok)return (result.errors||['팀 옵션 행사에 실패했습니다']).join(' · ');
  return p.name+' 팀 옵션 행사 · '+db.year+'년 연봉 '+money(p.contract.salary);
}
function mRelease(db,pid){
  const t=myT(db),p=db.players[pid];
  const result=commitWorldAction(db,{type:'player.release',pid,teamId:t?.id,mode:'manager',actor:'manager'});
  if(!result.ok)return (result.errors||['방출할 수 없습니다']).join(' · ');
  return p.name+' 방출'+(result.cost?' (해지금 '+money(result.cost)+')':'');
}
function mOffer(db,pid,salary,years){const st=startNegotiation(db,pid,'fa');if(!st.ok)return st.msg;return submitNegotiationOffer(db,st.neg.id,{salary,years}).msg}
function mTransfer(db,pid,fee){return mTransferBid(db,pid,fee)}
// ---- 스카우팅: 관찰·경기 표본·보고서 노후화를 함께 추적한다 ----
