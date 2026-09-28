// ===== LOL GM: first-season blank roster setup =====
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
function initialPayrollFloorKey(db,team){const lim=initialSquadLimits(db,team);return [team.region,lim.min,nonLocalLimitForTeam(db,team)].join('|')}
function cheapestInitialRoleOptions(db,team,role,excludeId=null){
  return Object.values(db.players).filter(p=>!p.retired&&!p.team&&p.id!==excludeId&&p.role===role)
    .map(p=>({p,s:asking(db,p,team.region),nonLocal:!isLocalPlayer(p,team.region)})).sort((a,b)=>a.s-b.s);
}
function minimumViableInitialPayroll(db,t){
  const team=teamRef(db,t);db.initialPayrollFloorCache=db.initialPayrollFloorCache||{};const key=initialPayrollFloorKey(db,team);
  if(db.initialPayrollFloorCache[key]!=null)return db.initialPayrollFloorCache[key];
  const cap=nonLocalLimitForTeam(db,team),states=[{cost:0,imports:0}];
  for(const role of ROLES){
    const xs=cheapestInitialRoleOptions(db,team,role),local=xs.find(x=>!x.nonLocal),foreign=xs.find(x=>x.nonLocal),choices=[local,foreign].filter(Boolean);
    const next=[];for(const st of states)for(const x of choices){const imports=st.imports+(x.nonLocal?1:0);if(imports<=cap)next.push({cost:st.cost+x.s,imports})}
    states.splice(0,states.length,...next.sort((a,b)=>a.cost-b.cost).slice(0,cap+2));
  }
  const core=states.length?states[0].cost:0,lim=initialSquadLimits(db,team),extra=Math.max(0,lim.min-ROLES.length);
  const bench=Object.values(db.players).filter(p=>!p.retired&&!p.team).map(p=>asking(db,p,team.region)).sort((a,b)=>a-b).slice(0,extra).reduce((a,b)=>a+b,0);
  const floor=Math.round((core+bench)*1.12*10)/10;db.initialPayrollFloorCache[key]=floor;return floor;
}
function seedInitialPayrollBudgets(db){db.initialPayrollFloorCache={};for(const t of activeTeams(db)){const floor=minimumViableInitialPayroll(db,t);t.initialPayrollBudget=Math.max(t.initialPayrollBudget||0,floor)}}
function initialSalaryBudget(db,t){const team=teamRef(db,t);return Math.max(salaryBudget(db,team),team.initialPayrollBudget||0)}
function initialSalaryCeiling(db,t){return initialSalaryBudget(db,t)}
function initialSquadLimits(db,t){const team=teamRef(db,t),rules=rosterRulesForTeam(db,team),first=!team.parent;return {min:first?rules.firstTeamMin:rules.reserveTeamMin,max:first?rules.firstTeamMax:rules.reserveTeamMax}}
function initialRosterTarget(db,t){
  const team=teamRef(db,t),lim=initialSquadLimits(db,team),floor=Math.max(.1,minimumViableInitialPayroll(db,team)),room=Math.max(0,initialSalaryBudget(db,team)-floor);
  const cheapExtra=Math.max(.1,(floor/Math.max(5,lim.min))*.55),affordable=Math.max(0,Math.floor(room/cheapExtra)),goal=team.setupGoal||'top_half';
  if(team.parent)return clamp(lim.min+Math.min(3,Math.max(0,affordable)),lim.min,lim.max);
  if(['title','final'].includes(goal))return clamp(lim.min+(team.philosophy==='youth'&&affordable>=2?1:0),lim.min,lim.max);
  if(['survive','develop','promotion'].includes(goal)){
    const intent=1+(['youth','cost'].includes(team.philosophy)?1:0)+(affordable>=3?1:0);
    return clamp(lim.min+Math.min(3,Math.min(affordable,intent)),lim.min,Math.min(8,lim.max));
  }
  const extra=['youth','cost'].includes(team.philosophy)&&affordable>=1?1:0;
  return clamp(lim.min+extra,lim.min,lim.max);
}
function initialSquadErrors(db,t){
  const team=teamRef(db,t);if(!team)return ['팀을 찾을 수 없습니다'];
  const limits=initialSquadLimits(db,team),errors=[],roster=team.roster||[];
  if(roster.length<limits.min)errors.push('최소 '+limits.min+'명 필요');
  if(roster.length>limits.max)errors.push('최대 '+limits.max+'명 초과');
  const imports=teamNonLocalCount(db,team),cap=nonLocalLimitForTeam(db,team);if(imports>cap)errors.push('비로컬 등록 한도 '+cap+'명 초과');
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
  const imports=teamNonLocalCount(db,team),cap=nonLocalLimitForTeam(db,team);if(!isLocalPlayer(player,team.region)&&imports>=cap)return {ok:false,reason:'비로컬 등록 한도에 도달했습니다'};
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
function initialCandidateScore(db,p,t,key='',salary=null){
  const ps=Math.max(.2,psOf(db,t.region)),cost=(salary??asking(db,p,t.region))/ps,costWeight={cost:.55,balanced:.28,youth:.3,'win-now':.16,superstar:.1}[t.philosophy]??.28;
  const star=t.philosophy==='superstar'?(p.reputation||0)*.025:0,noise=((hashStr((db.world?.seed||db.saveId)+'|initial|'+t.id+'|'+p.id+'|'+key)%2001)/1000-1)*1.2;
  return aiMarketValue(db,p,t)+star-cost*costWeight+noise;
}
function initialMissingRoles(db,t,extraPlayer=null){
  const ids=(t.roster||[]).map(id=>db.players[id]).filter(Boolean);if(extraPlayer)ids.push(extraPlayer);
  return ROLES.filter(role=>!ids.some(p=>p.role===role));
}
function initialMarketSnapshot(db,teams){
  const free=Object.values(db.players).filter(p=>!p.retired&&!p.team),byRole=Object.fromEntries(ROLES.map(r=>[r,[]])),priceCache=new Map(),regions=[...new Set((teams||activeTeams(db)).map(t=>t.region))];
  for(const p of free)if(byRole[p.role])byRole[p.role].push(p);
  const price=(p,region)=>{const k=region+'|'+p.id;if(!priceCache.has(k))priceCache.set(k,asking(db,p,region));return priceCache.get(k)};
  const alternatives={};
  for(const region of regions){
    alternatives[region]={};
    for(const role of ROLES){
      let local=[],foreign=[];for(const p of byRole[role]){const row={id:p.id,s:price(p,region),nonLocal:!isLocalPlayer(p,region)};(row.nonLocal?foreign:local).push(row)}
      alternatives[region][role]={local:local.sort((a,b)=>a.s-b.s).slice(0,2),foreign:foreign.sort((a,b)=>a.s-b.s).slice(0,2)};
    }
  }
  return {free,byRole,price,alternatives,supply:Object.fromEntries(ROLES.map(r=>[r,byRole[r].length]))};
}
function initialFutureRoleChoices(team,missing,excludeId,snap){
  const out={};for(const role of missing){const src=snap.alternatives[team.region]?.[role]||{local:[],foreign:[]};out[role]={local:src.local.find(x=>x.id!==excludeId)||null,foreign:src.foreign.find(x=>x.id!==excludeId)||null}}return out;
}
function initialFutureFeasible(db,t,candidate,salary,snap=null){
  const team=teamRef(db,t),lim=initialSquadLimits(db,team),projected=(team.roster||[]).length+1,missing=initialMissingRoles(db,team,candidate);
  if(projected+missing.length>lim.max)return false;
  const usedImports=teamNonLocalCount(db,team)+(isLocalPlayer(candidate,team.region)?0:1),cap=nonLocalLimitForTeam(db,team),budget=initialSalaryCeiling(db,team)-payroll(db,team)-salary;
  if(usedImports>cap||budget<-.001)return false;
  const market=snap||initialMarketSnapshot(db,[team]),best=initialFutureRoleChoices(team,missing,candidate.id,market);let states=[{cost:0,imports:usedImports}];
  for(const role of missing){
    const choices=Object.values(best[role]||{}).filter(Boolean);if(!choices.length)return false;
    const next=[];for(const st of states)for(const x of choices){const imports=st.imports+(x.nonLocal?1:0),cost=st.cost+x.s;if(imports<=cap&&cost<=budget+.001)next.push({cost,imports})}
    states=next;if(!states.length)return false;
  }
  return true;
}
function initialPickCandidate(db,t,role,key='',snap=null){
  const team=teamRef(db,t),market=snap||initialMarketSnapshot(db,[team]),target=team.initialRosterTarget||initialRosterTarget(db,team),room=Math.max(0,initialSalaryCeiling(db,team)-payroll(db,team)),slotsLeft=Math.max(1,target-team.roster.length),softMax=room/slotsLeft*1.35,pool=role?market.byRole[role]:market.free;
  const rows=[];for(const p of pool){if(p.team)continue;const salary=market.price(p,team.region),chk=initialOfferCheck(db,p,team,{salary});if(!chk.ok)continue;rows.push({p,salary,score:initialCandidateScore(db,p,team,key,salary)})}
  rows.sort((a,b)=>(a.salary<=softMax)!==(b.salary<=softMax)?(a.salary<=softMax?-1:1):b.score-a.score||a.salary-b.salary);
  for(const row of rows)if(initialFutureFeasible(db,team,row.p,row.salary,market))return row.p;
  return null;
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
function initialOfferForTeam(db,t,phase,round,seed,market,forcedRole=null){
  const missing=initialMissingRoles(db,t),target=t.initialRosterTarget||initialRosterTarget(db,t);if(phase==='roles'&&!missing.length)return null;if(phase==='depth'&&t.roster.length>=target)return null;
  const role=phase==='roles'?(forcedRole||missing.slice().sort((a,b)=>(market.supply[a]||0)-(market.supply[b]||0))[0]):null;if(role&&!missing.includes(role))return null;const key=phase+'|'+round+'|'+(role||'ANY'),p=initialPickCandidate(db,t,role,key,market);if(!p)return null;
  const rng=new RNG((seed||'initial-market')+'|'+t.id+'|'+key,'initial-offer'),terms=aiInitialContractTerms(db,p,t,rng),chk=initialOfferCheck(db,p,t,terms);if(!chk.ok)return null;
  return {team:t,player:p,terms,role,value:offerUtility(db,p,t,terms)+((hashStr((seed||'initial-market')+'|choose|'+p.id+'|'+t.id+'|'+round)%1001)/1000-.5)*.08};
}
function resolveInitialOfferRound(db,teams,phase,round,seed,forcedRole=null){
  const market=initialMarketSnapshot(db,teams),offers=teams.map(t=>initialOfferForTeam(db,t,phase,round,seed,market,forcedRole)).filter(Boolean),byPlayer={};for(const o of offers)(byPlayer[o.player.id]=byPlayer[o.player.id]||[]).push(o);
  let signed=0;for(const os of Object.values(byPlayer)){const best=os.sort((a,b)=>b.value-a.value||b.terms.salary-a.terms.salary)[0],p=best.player,t=best.team;if(p.team)continue;const chk=initialOfferCheck(db,p,t,best.terms);if(!chk.ok||!initialFutureFeasible(db,t,p,best.terms.salary,market))continue;signContract(db,p,t,best.terms.salary,best.terms.years,best.terms);signed++}
  return {offers:offers.length,signed};
}
function initialRoleMarketOrder(db,teams){
  const market=initialMarketSnapshot(db,teams);return ROLES.slice().sort((a,b)=>{const an=teams.filter(t=>initialMissingRoles(db,t).includes(a)).length,bn=teams.filter(t=>initialMissingRoles(db,t).includes(b)).length;return (market.supply[a]/Math.max(1,an))-(market.supply[b]/Math.max(1,bn))});
}
function runInitialMandatoryMarket(db,teams,seed){
  for(const role of initialRoleMarketOrder(db,teams)){
    const pending=()=>teams.filter(t=>initialMissingRoles(db,t).includes(role));
    for(let round=0;round<80&&pending().length;round++){const contenders=pending(),r=resolveInitialOfferRound(db,contenders,'roles',round,seed+'|'+role,role);if(!r.signed)break}
    const left=pending();if(left.length)return {role,teams:left};
  }
  return null;
}
function runInitialDepthMarket(db,teams,seed){
  const done=t=>t.roster.length>=(t.initialRosterTarget||initialRosterTarget(db,t));
  for(let round=0;round<40&&!teams.every(done);round++){const contenders=teams.filter(t=>!done(t)),r=resolveInitialOfferRound(db,contenders,'depth',round,seed);if(!r.signed)break}
  return teams.filter(t=>!done(t));
}
function autoBuildInitialSquad(db,t,rng,target=null){
  const team=teamRef(db,t),limits=initialSquadLimits(db,team),want=Math.min(limits.max,Math.max(limits.min,target??initialRosterTarget(db,team)));team.initialRosterTarget=want;
  for(let guard=0;guard<20&&initialMissingRoles(db,team).length;guard++){const role=initialMissingRoles(db,team)[0],market=initialMarketSnapshot(db,[team]),p=initialPickCandidate(db,team,role,'single|'+guard,market);if(!p)break;const terms=aiInitialContractTerms(db,p,team,rng),chk=initialOfferCheck(db,p,team,terms);if(!chk.ok)break;signContract(db,p,team,terms.salary,terms.years,terms)}
  while(team.roster.length<want){const market=initialMarketSnapshot(db,[team]),p=initialPickCandidate(db,team,null,'depth|'+team.roster.length,market);if(!p)break;const terms=aiInitialContractTerms(db,p,team,rng),chk=initialOfferCheck(db,p,team,terms);if(!chk.ok)break;signContract(db,p,team,terms.salary,terms.years,terms)}
  const errors=initialSquadErrors(db,team);if(errors.length)throw new Error(team.name+' 초기 로스터 오류: '+errors.join(', '));return team;
}
function autoBuildInitialWorld(db,excludedIds,seed){
  const excluded=new Set(excludedIds||[]),teams=activeTeams(db).filter(t=>!excluded.has(t.id));for(const t of teams)t.initialRosterTarget=initialRosterTarget(db,t);
  const failed=runInitialMandatoryMarket(db,teams,seed);if(failed)throw new Error(failed.teams[0].name+' AI 로스터가 '+ROLE_KO[failed.role]+' 선수를 확보하지 못했습니다');
  runInitialDepthMarket(db,teams,seed);for(const t of teams)t.initialRosterBuilt=t.roster.length;
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
