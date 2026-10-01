// ===== LOL GM: Recruitment / negotiation / transfer domain =====
// Owns recruitment board workflow, seller fee negotiations and permanent transfers.

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
  const r=scoutReport(db,p),ability=Math.round(avg(r.ability)),potential=Math.round(avg(r.potential)),cur=starterFor(db,t,p.role),gap=cur?ability-playerOvr(cur):8,baseBudget=(db.world?.phase==='initial_roster')?initialSalaryBudget(db,t):salaryBudget(db,t),room=Math.max(.1,baseBudget-payroll(db,t)),cost=asking(db,p,t.region)/room;
  const fit=Math.round(clamp(50+gap*4+(potential-ability)*.9+(p.age<=21?5:0)+teamInternationalAppeal(db,t)*5-Math.max(0,cost-1)*18-medicalContractRisk(db,p)*22,0,100));
  e.stage='evaluated';e.knowledge=k;e.evaluation={teamId:t.id,date:db.worldDate,knowledge:k,ability:r.ability,potential:r.potential,fit,expectedRole:defaultPromisedRole(db,p,t),salaryAsk:asking(db,p,t.region),marketValue:playerMarketValue(db,p),risk:Math.round(scoutingRisk(db,p)*10)/10,medicalRiskPct:Math.round(medicalContractRisk(db,p)*1000)/10};
  return {ok:true,target:e,msg:`${p.name} 내부 평가 완료 · 적합도 ${fit}/100`};
}
function recruitmentReady(db,pid,teamId=null){const e=syncRecruitmentObservation(db,pid);return !!(e&&['evaluated','negotiating'].includes(e.stage)&&(!teamId||!e.evaluation?.teamId||e.evaluation.teamId===teamId))}
function recruitmentBoard(db){const rank={A:0,B:1,C:2};return Object.values(recruitmentStore(db)).sort((a,b)=>(rank[a.priority]??9)-(rank[b.priority]??9)||String(a.addedDate||'').localeCompare(String(b.addedDate||'')))}
function mInterest(db,pid,priority='B'){return setRecruitmentPriority(db,pid,priority).msg}
function mEvaluateTarget(db,pid,teamId=null){return recruitmentEvaluation(db,pid,teamId).msg}
function mDropInterest(db,pid){return removeRecruitmentTarget(db,pid)}

// ---- 구단 간 이적료 협상 ----
function sellerTransferAsk(db,p,from){if(p.contract?.buyout)return p.contract.buyout;const base=transferFee(db,p),starter=starterFor(db,from,p.role)===p,financeNeed=from.finance.cash<0?.88:1,exit=p.wantsOut?.82:1;return Math.round(base*(starter?1.12:.96)*financeNeed*exit*10)/10}
function mTransferBid(db,pid,fee,feePlan=null){
  const t=myT(db),p=db.players[pid],from=p&&db.teams[p.team];if(!p||!from||from.id===t.id)return '이적 대상을 찾을 수 없습니다';
  const window=permanentTransferWindowError(db,p,t);if(window)return window;
  const payment=normalizeTransferFeePlan(db,fee,feePlan);if(!payment.ok)return payment.reason;
  if(payment.upfront>t.finance.cash)return '선지급할 보유 자금이 부족합니다';
  const moveErr=contractedMoveError(db,p);if(moveErr)return moveErr;const localErr=localRegistrationError(db,t,p);if(localErr)return localErr;
  const id=negotiationId(db,pid,'transfer'),store=negotiationStore(db),ask=sellerTransferAsk(db,p,from);let neg=store[id];
  if(!neg||neg.status!=='open'){const st=startNegotiation(db,pid,'transfer',{sellerId:from.id});if(!st.ok)return st.msg;neg=st.neg;neg.stage='club';neg.clubRounds=0}
  neg.clubRounds=(neg.clubRounds||0)+1;neg.history.push({round:neg.clubRounds,stage:'club',side:'buyer',fee});
  const acceptAt=ask*(from.finance.cash<0?.9:1);
  if(fee-(fee-payment.upfront)*.05>=acceptAt){neg.fee=Math.round(fee*10)/10;neg.feePlan=payment.plan;neg.stage='player';neg.clubCounter=null;neg.history.push({round:neg.clubRounds,stage:'club',side:'seller',result:'accept',fee:neg.fee,feePlan:payment.plan});return from.name+'과 이적료 '+money(neg.fee)+' 합의 · 이제 '+p.name+' 측과 개인조건을 협상하세요'}
  if(neg.clubRounds>=3&&fee<ask*.82){neg.status='withdrawn';neg.reason='이적료 협상 결렬';return from.name+': 이적료 협상 종료'}
  neg.clubCounter=Math.round(Math.max(fee*1.06,(fee+ask)/2)*10)/10;neg.history.push({round:neg.clubRounds,stage:'club',side:'seller',result:'counter',fee:neg.clubCounter});return from.name+' 역제안: '+money(neg.clubCounter);
}
function acceptSellerCounter(db,nid){const neg=negotiationStore(db)[nid];if(!neg||neg.status!=='open'||neg.stage!=='club'||!neg.clubCounter)return '수락할 구단 역제안이 없습니다';return mTransferBid(db,neg.pid,neg.clubCounter)}
function closeOpenNegotiationsForDeadline(db){
  for(const neg of Object.values(negotiationStore(db))){if(neg.status!=='open')continue;neg.status='expired';neg.reason='이적시장 마감';neg.closedDate=db.worldDate;const target=recruitmentTarget(db,neg.pid);if(target){target.stage='closed';target.result='deadline';target.negotiationId=neg.id}}
}
// ---- 이적료 / 직접 운영 ----
function transferFee(db,p){const left=p.contract?Math.max(1,p.contract.until-db.year+1):1;return Math.round(playerMarketValue(db,p)*(.62+.18*Math.min(3,left))*(p.wantsOut?.75:1)*10)/10}
function doTransfer(db,p,from,to,fee,consent=null,feePlan=null){
  const moveErr=contractedMoveError(db,p),localErr=localRegistrationError(db,to,p);if(moveErr||localErr)throw new Error(moveErr||localErr);
  recordContractedMove(db,p,'permanent',from,to,{fee});assignPlayerToTeam(db,p,to);
  startContractRolePromise(db,p,to);
  settleTransferSigningFee(db,p,from,to,fee,feePlan);
  recordPlayerEvent(p,'transfer',db.year,{from:from.id,to:to.id,fee,date:db.worldDate,
    ...(consent?{consent}:{}),...(feePlan?{feePlan}:{})});
  news(db,`이적: ${p.name} ${from.name} → ${to.name} (이적료 ${money(fee)})`);
}
function myT(db){return managedTeam(db)}
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
function mTransfer(db,pid,fee){return mTransferBid(db,pid,fee)}
// ---- 스카우팅: 관찰·경기 표본·보고서 노후화를 함께 추적한다 ----
