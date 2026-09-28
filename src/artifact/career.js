// ===== LOL GM: first-season blank roster setup =====
const INITIAL_ROSTER_TARGET=6;
const INITIAL_GOAL_KO={title:'리그 우승 도전',final:'결승권 진입',playoffs:'플레이오프 진출',top_half:'상위권 정착',survive:'1부 잔류',promotion:'1부 승격 도전',develop:'유망주 육성과 경쟁력 확보'};

function prepareFirstSeasonFreeAgency(db){
  const strength={};
  for(const t of activeTeams(db))strength[t.id]=teamStrength(db,t.id);
  for(const t of activeTeams(db)){
    t.reputation=Math.round(clamp(strength[t.id]*0.75+(t.fans||40)*0.25,25,95));
    t.initialStrength=strength[t.id];
    t.initialPayrollBudget=Math.max(payroll(db,t)*1.1,0);
  }
  for(const R of Object.values(db.regions))for(const div of R.div2?[1,2]:[1]){
    const ts=activeTeams(db,R.id,div).slice().sort((a,b)=>(b.reputation||0)-(a.reputation||0)),n=ts.length;
    ts.forEach((t,i)=>{
      if(div===2)t.setupGoal=t.parent?'develop':i<Math.min(2,n)?'promotion':i<Math.ceil(n/2)?'playoffs':'develop';
      else t.setupGoal=i<1?'title':i<2?'final':i<Math.min(R.playoffTake||4,n)-1?'playoffs':i<n/2?'top_half':'survive';
    });
  }
  for(const p of Object.values(db.players)){p.initialTeam=p.team||null;p.team=null;p.contract=null;p.faYears=0}
  for(const t of Object.values(db.teams))t.roster=[];
  db.firstSeasonSetup={blankRosters:true,universalLanguage:true,preparedAt:db.worldDate,completed:false};
  return db;
}
function initialGoalLabel(t){return INITIAL_GOAL_KO[t&&t.setupGoal]||'경쟁력 있는 첫 시즌'}
function promotionStatus(db,t){
  const team=teamRef(db,t);if(!team)return '—';const R=db.regions[team.region];
  if(team.parent)return '승격 불가 · 모구단 산하 2군';
  if((team.division||1)===1)return ['relegation','mixed'].includes(R.system)?'승강제 적용':'1부 고정';
  return ['relegation','mixed'].includes(R.system)?'1부 승격 가능':'승격 없음';
}
function setupTeamsForManager(db){const root=managedTeam(db);if(!root)return [];return root.parent?[root]:[root,...reserveTeamsOf(db,root)]}
function initialPayrollFloorKey(db,team){const lim=initialSquadLimits(db,team),R=db.regions[team.region];return [team.region,lim.min,R.importLimit??2].join('|')}
function minimumViableInitialPayroll(db,t){
  const team=teamRef(db,t);db.initialPayrollFloorCache=db.initialPayrollFloorCache||{};const key=initialPayrollFloorKey(db,team);
  if(db.initialPayrollFloorCache[key]!=null)return db.initialPayrollFloorCache[key];
  const free=Object.values(db.players).filter(p=>!p.retired&&!p.team),used=new Set(),chosen=[];let imports=0;
  const priced=free.map(p=>({p,s:asking(db,p,team.region)})),byRole=Object.fromEntries(ROLES.map(r=>[r,[]]));
  for(const x of priced)byRole[x.p.role].push(x);for(const role of ROLES)byRole[role].sort((a,b)=>a.s-b.s);
  for(const role of ROLES){const candidates=byRole[role],pick=candidates.find(x=>x.p.region===team.region&&!used.has(x.p.id))||(imports<(db.regions[team.region].importLimit??2)?candidates.find(x=>!used.has(x.p.id)):null);if(pick){chosen.push(pick.s);used.add(pick.p.id);if(pick.p.region!==team.region)imports++}}
  const lim=initialSquadLimits(db,team),extra=Math.max(0,lim.min-chosen.length),bench=priced.filter(x=>!used.has(x.p.id)).map(x=>x.s).sort((a,b)=>a-b).slice(0,extra);
  const floor=Math.round((chosen.reduce((a,b)=>a+b,0)+bench.reduce((a,b)=>a+b,0))*1.12*10)/10;db.initialPayrollFloorCache[key]=floor;return floor;
}
function seedInitialPayrollBudgets(db){db.initialPayrollFloorCache={};for(const t of activeTeams(db)){if(t.initialPayrollBudget==null)t.initialPayrollBudget=minimumViableInitialPayroll(db,t)}}
function initialSalaryBudget(db,t){const team=teamRef(db,t);return Math.max(salaryBudget(db,team),team.initialPayrollBudget||0)}
function initialSalaryCeiling(db,t){return initialSalaryBudget(db,t)}
function initialSquadLimits(db,t){const team=teamRef(db,t),rules=rosterRulesForTeam(db,team),first=!team.parent;return {min:first?rules.firstTeamMin:rules.reserveTeamMin,max:first?rules.firstTeamMax:rules.reserveTeamMax}}
function initialSquadErrors(db,t){
  const team=teamRef(db,t);if(!team)return ['팀을 찾을 수 없습니다'];
  const R=db.regions[team.region],limits=initialSquadLimits(db,team),errors=[],roster=team.roster||[];
  if(roster.length<limits.min)errors.push('최소 '+limits.min+'명 필요');
  if(roster.length>limits.max)errors.push('최대 '+limits.max+'명 초과');
  for(const role of ROLES)if(!roster.some(id=>db.players[id]&&db.players[id].role===role))errors.push(ROLE_KO[role]+' 포지션 필요');
  const imports=roster.filter(id=>db.players[id]&&db.players[id].region!==team.region).length;if(imports>(R.importLimit??2))errors.push('외국인 등록 한도 '+(R.importLimit??2)+'명 초과');
  const pay=payroll(db,team),budget=initialSalaryBudget(db,team);
  if(pay>budget+0.001)errors.push('구단 연봉 예산 초과');
  return errors;
}
function initialOrganizationErrors(db,t){
  const root=parentTeamOf(db,t)||teamRef(db,t),squads=root?[root,...reserveTeamsOf(db,root)]:[],errors=[];
  for(const s of squads)for(const e of initialSquadErrors(db,s))errors.push(s.name+': '+e);
  if(root&&reserveTeamsOf(db,root).length){const rules=rosterRulesForTeam(db,root),total=organizationRoster(db,root).length;if(total<rules.integratedMin)errors.push('통합 로스터 최소 '+rules.integratedMin+'명 필요');if(total>rules.integratedMax)errors.push('통합 로스터 최대 '+rules.integratedMax+'명 초과')}
  return errors;
}
function initialOfferCheck(db,p,target,terms={}){
  const player=playerRef(db,p),team=teamRef(db,target);if(!player||player.retired)return {ok:false,reason:'계약할 수 없는 선수입니다'};if(player.team)return {ok:false,reason:'이미 소속팀이 있는 선수입니다'};if(!team||team.active===false)return {ok:false,reason:'대상 팀이 없습니다'};
  const limits=initialSquadLimits(db,team);if((team.roster||[]).length>=limits.max)return {ok:false,reason:'스쿼드 최대 '+limits.max+'명입니다'};
  const root=parentTeamOf(db,team),rules=rosterRulesForTeam(db,root);if(root&&reserveTeamsOf(db,root).length&&organizationRoster(db,root).length>=rules.integratedMax)return {ok:false,reason:'통합 로스터 최대 '+rules.integratedMax+'명입니다'};
  const R=db.regions[team.region],imports=(team.roster||[]).filter(id=>db.players[id]&&db.players[id].region!==team.region).length;if(player.region!==team.region&&imports>=(R.importLimit??2))return {ok:false,reason:'외국인 등록 한도에 도달했습니다'};
  const salary=Math.max(.1,+terms.salary||asking(db,player,team.region)),projected=payroll(db,team)+salary,ceiling=initialSalaryCeiling(db,team);if(projected>ceiling+0.001)return {ok:false,reason:'연봉 예산을 초과합니다'};
  return {ok:true,salary};
}
function initialSignCheck(db,p,target){return initialOfferCheck(db,p,target,{salary:asking(db,playerRef(db,p),teamRef(db,target)?.region)})}
function initialStartNegotiation(db,pid,targetId){
  const player=db.players[pid],target=db.teams[targetId],allowed=new Set(setupTeamsForManager(db).map(t=>t.id));if(!allowed.has(targetId))return '내 구단 조직의 스쿼드에만 등록할 수 있습니다';
  const chk=initialSignCheck(db,player,target);if(!chk.ok)return chk.reason;return startNegotiation(db,pid,'initial',{teamId:targetId}).msg;
}
function initialSignPlayer(db,pid,targetId){return initialStartNegotiation(db,pid,targetId)}
function initialReleasePlayer(db,pid){const p=db.players[pid],allowed=new Set(setupTeamsForManager(db).map(t=>t.id));if(!p||!p.team||!allowed.has(p.team))return '초기 로스터에서 방출할 수 없는 선수입니다';removePlayerFromTeam(db,p);p.contract=null;p.faYears=0;return p.name+' 선수를 FA 풀로 되돌렸습니다'}
function initialCandidateScore(db,p,t,rng){return aiMarketValue(db,p,t)+(p.region===t.region?0.5:0)+rng.normal(0,1.2)}
function initialPickCandidate(db,t,role,rng){
  const team=teamRef(db,t),room=Math.max(0,initialSalaryCeiling(db,team)-payroll(db,team));
  const slotsLeft=Math.max(1,INITIAL_ROSTER_TARGET-team.roster.length),softMax=room/slotsLeft*1.35;
  const candidates=Object.values(db.players).filter(p=>!p.retired&&!p.team&&(!role||p.role===role)).map(p=>({p,chk:initialSignCheck(db,p,team)})).filter(x=>x.chk.ok)
    .map(x=>({p:x.p,salary:x.chk.salary,score:initialCandidateScore(db,x.p,team,rng)-x.chk.salary*0.35}));
  if(!candidates.length)return null;
  // Mandatory role coverage preserves import slots when a legal local option exists.
  // This prevents an early foreign luxury signing from making a later required role impossible.
  const local=role?candidates.filter(x=>x.p.region===team.region):[],pool=local.length?local:candidates;
  const prudent=pool.filter(x=>x.salary<=softMax+0.001).sort((a,b)=>b.score-a.score);
  if(prudent.length)return prudent[0].p;
  return pool.sort((a,b)=>a.salary-b.salary||b.score-a.score)[0].p;
}
function normalizeInitialSalaryFloor(db,t){
  const team=teamRef(db,t),R=db.regions[team.region];if((team.division||1)!==1||!R.salaryFloor)return;
  const pay=payroll(db,team);if(pay<=0||pay>=R.salaryFloor)return;
  const k=R.salaryFloor/pay;
  for(const id of team.roster){const p=db.players[id];if(p&&p.contract)p.contract.salary=Math.round(p.contract.salary*k*10)/10}
  const gap=Math.round((R.salaryFloor-payroll(db,team))*10)/10;
  if(gap>0&&team.roster.length){const p=db.players[team.roster[0]];p.contract.salary=Math.round((p.contract.salary+gap)*10)/10}
}
function aiInitialContractTerms(db,p,t,rng){
  const ask=asking(db,p,t.region),years=contractYearsForPlayer(db,p,rng),premium=rng.range(.96,1.08),role=defaultPromisedRole(db,p,t),room=Math.max(.1,initialSalaryCeiling(db,t)-payroll(db,t)),salary=Math.min(room,ask*premium);
  return normalizeContractTerms(db,p,t,salary,years,{signingBonus:rng.chance(.28)?ask*rng.range(.04,.12):0,bonuses:rng.chance(.32)?{performance:ask*.05,title:ask*.08,international:ask*.05}:{},promisedRole:role,option:rng.chance(.15)?{type:rng.chance(.55)?'team':'player'}:null,buyout:p.personality.ambition>=86&&rng.chance(.35)?playerMarketValue(db,p)*1.8:null});
}
function autoBuildInitialSquad(db,t,rng,target=INITIAL_ROSTER_TARGET){
  const team=teamRef(db,t),limits=initialSquadLimits(db,team),want=Math.min(limits.max,Math.max(limits.min,target));
  for(const role of ROLES){if(team.roster.some(id=>db.players[id]&&db.players[id].role===role))continue;const p=initialPickCandidate(db,team,role,rng);if(!p)throw new Error(team.name+'의 '+ROLE_KO[role]+' 선수를 확보하지 못했습니다');const terms=aiInitialContractTerms(db,p,team,rng),chk=initialOfferCheck(db,p,team,terms);if(!chk.ok)throw new Error(team.name+' 초기 계약 실패: '+chk.reason);signContract(db,p,team,terms.salary,terms.years,terms)}
  while(team.roster.length<want){const p=initialPickCandidate(db,team,null,rng);if(!p)break;const terms=aiInitialContractTerms(db,p,team,rng),chk=initialOfferCheck(db,p,team,terms);if(!chk.ok)break;signContract(db,p,team,terms.salary,terms.years,terms)}
  const errors=initialSquadErrors(db,team);if(errors.length)throw new Error(team.name+' 초기 로스터 오류: '+errors.join(', '));return team;
}
function autoBuildInitialWorld(db,excludedIds,seed){
  const excluded=new Set(excludedIds||[]),rng=new RNG(seed||'initial-market','ai-roster'),teams=activeTeams(db).filter(t=>!excluded.has(t.id));
  for(const role of ROLES){const order=teams.map(t=>({t,tie:rng.next()})).sort((a,b)=>(b.t.reputation||0)-(a.t.reputation||0)||a.tie-b.tie).map(x=>x.t);for(const t of order){if(t.roster.some(id=>db.players[id]&&db.players[id].role===role))continue;const p=initialPickCandidate(db,t,role,rng);if(!p)throw new Error(t.name+' AI 로스터가 '+ROLE_KO[role]+' 선수를 확보하지 못했습니다');const terms=aiInitialContractTerms(db,p,t,rng),chk=initialOfferCheck(db,p,t,terms);if(!chk.ok)throw new Error(t.name+' AI 초기 계약 실패: '+chk.reason);signContract(db,p,t,terms.salary,terms.years,terms)}}
  for(const t of teams)autoBuildInitialSquad(db,t,rng,INITIAL_ROSTER_TARGET);
}
function beginInitialRosterPhase(db,teamId,seed){
  if(!isManagerSelectableTeam(db,teamId))throw new Error('감독 시작 팀으로 선택할 수 없는 구단입니다');setManagedTeam(db,teamId);seedInitialPayrollBudgets(db);db.manager.startMode='blank_roster';db.manager.careerStartedAt=null;
  db.world={year:db.year,seed,manage:db.worldConfig.manage||'manual',phase:'initial_roster',seasons:{},steps:[],step:-1,report:null,lastDate:db.worldDate,offers:[],negotiations:{},recruitment:{targets:{}},marketLog:[]};return db.world;
}
function finalizeInitialRosters(db){
  const root=managedTeam(db);if(!root)throw new Error('관리 구단이 없습니다');const mine=setupTeamsForManager(db),errors=initialOrganizationErrors(db,root);if(errors.length)throw new Error(errors[0]);
  const mineIds=new Set(mine.map(t=>t.id)),pending=Object.values(negotiationStore(db)).filter(n=>n.status==='open'&&n.kind==='initial'&&mineIds.has(n.teamId));if(pending.length)throw new Error('진행 중인 창단 계약 협상을 먼저 마무리해야 합니다');
  autoBuildInitialWorld(db,mine.map(t=>t.id),db.world.seed);
  const allErrors=[];for(const t of activeTeams(db))for(const e of initialSquadErrors(db,t))allErrors.push(t.name+': '+e);
  for(const t of activeTeams(db).filter(t=>!t.parent&&reserveTeamsOf(db,t).length)){const rules=rosterRulesForTeam(db,t),n=organizationRoster(db,t).length;if(n<rules.integratedMin||n>rules.integratedMax)allErrors.push(t.name+': 통합 로스터 '+n+'명')}
  if(allErrors.length)throw new Error('AI 초기 로스터 구성 실패 · '+allErrors[0]);for(const t of activeTeams(db))initializeTeamRosterRoles(db,t,true);db.manager.careerStartedAt=db.worldDate;db.firstSeasonSetup.completed=true;const seed=db.world.seed,teamId=root.id;startWorldSeason(db,teamId,seed);return db.world;
}
