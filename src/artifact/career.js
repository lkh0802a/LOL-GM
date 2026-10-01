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
function cheapestInitialRows(db,team){
  const rows=Object.values(db.players).filter(p=>!p.retired&&!p.team).map(p=>({id:p.id,s:asking(db,p,team.region),nonLocal:!isLocalPlayer(p,team.region)}));
  return {local:rows.filter(x=>!x.nonLocal).sort((a,b)=>a.s-b.s),foreign:rows.filter(x=>x.nonLocal).sort((a,b)=>a.s-b.s)};
}
function minimumViableInitialPayroll(db,t){
  const team=teamRef(db,t);db.initialPayrollFloorCache=db.initialPayrollFloorCache||{};const key=initialPayrollFloorKey(db,team);
  if(db.initialPayrollFloorCache[key]!=null)return db.initialPayrollFloorCache[key];
  const lim=initialSquadLimits(db,team),cap=nonLocalLimitForTeam(db,team),rows=cheapestInitialRows(db,team);let best=Infinity;
  for(let foreignN=0;foreignN<=Math.min(cap,lim.min,rows.foreign.length);foreignN++){
    const localN=lim.min-foreignN;if(localN>rows.local.length)continue;
    const cost=rows.local.slice(0,localN).reduce((s,x)=>s+x.s,0)+rows.foreign.slice(0,foreignN).reduce((s,x)=>s+x.s,0);best=Math.min(best,cost);
  }
  const floor=Math.round((Number.isFinite(best)?best:0)*1.12*10)/10;db.initialPayrollFloorCache[key]=floor;return floor;
}
// Fix the starting wage envelope before sign-on bonuses drain cash and
// lower a club's dynamic runway-derived budget during the initial auction.
function seedInitialPayrollBudgets(db){db.initialPayrollFloorCache={};for(const t of activeTeams(db)){const floor=minimumViableInitialPayroll(db,t);t.initialPayrollBudget=Math.max(t.initialPayrollBudget||0,floor,salaryBudget(db,t))}}
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
function initialReleasePlayer(db,pid){
  const p=db.players[pid],allowed=new Set(setupTeamsForManager(db).map(t=>t.id));
  if(!p||!p.team||!allowed.has(p.team))return '초기 로스터에서 방출할 수 없는 선수입니다';
  const result=commitWorldAction(db,{type:'player.release',pid,teamId:p.team,mode:'initial',actor:'manager'});
  return result.ok?p.name+' 선수를 FA 풀로 되돌렸습니다':result.errors.join(' · ');
}
function initialCandidateScore(db,p,t,key='',salary=null){
  const ps=Math.max(.2,psOf(db,t.region)),cost=(salary??asking(db,p,t.region))/ps,costWeight={cost:.55,balanced:.28,youth:.3,'win-now':.16,superstar:.1}[t.philosophy]??.28;
  const star=t.philosophy==='superstar'?(p.reputation||0)*.025:0,covered=(t.roster||[]).some(id=>db.players[id]?.role===p.role),coverage=covered?0:1.25;
  const noise=((hashStr(worldSimulationSeed(db)+'|initial|'+t.id+'|'+p.id+'|'+key)%2001)/1000-1)*1.2;
  return aiMarketValue(db,p,t)+star+coverage-cost*costWeight+noise;
}
function initialMarketSnapshot(db,teams){
  const free=Object.values(db.players).filter(p=>!p.retired&&!p.team),priceCache=new Map(),regions=[...new Set((teams||activeTeams(db)).map(t=>t.region))],byRegion={};
  const price=(p,region)=>{const k=region+'|'+p.id;if(!priceCache.has(k))priceCache.set(k,asking(db,p,region));return priceCache.get(k)};
  for(const region of regions){const rows=free.map(p=>({p,id:p.id,s:price(p,region),nonLocal:!isLocalPlayer(p,region)}));byRegion[region]={local:rows.filter(x=>!x.nonLocal).sort((a,b)=>a.s-b.s),foreign:rows.filter(x=>x.nonLocal).sort((a,b)=>a.s-b.s)}}
  return {free,price,byRegion};
}
function initialCheapestCost(rows,excludeId,n){if(n<=0)return 0;let cost=0,count=0;for(const x of rows){if(x.id===excludeId)continue;cost+=x.s;if(++count>=n)break}return count===n?cost:Infinity}
function initialFutureFeasible(db,t,candidate,salary,snap=null){
  const team=teamRef(db,t),lim=initialSquadLimits(db,team),projected=(team.roster||[]).length+1,need=Math.max(0,lim.min-projected);
  const usedImports=teamNonLocalCount(db,team)+(isLocalPlayer(candidate,team.region)?0:1),cap=nonLocalLimitForTeam(db,team),budget=initialSalaryCeiling(db,team)-payroll(db,team)-salary;
  if(projected>lim.max||usedImports>cap||budget<-.001)return false;if(!need)return true;
  const market=snap||initialMarketSnapshot(db,[team]),rows=market.byRegion[team.region],room=cap-usedImports;let best=Infinity;
  for(let foreignN=0;foreignN<=Math.min(room,need);foreignN++){const localN=need-foreignN,cost=initialCheapestCost(rows.local,candidate.id,localN)+initialCheapestCost(rows.foreign,candidate.id,foreignN);best=Math.min(best,cost)}
  return best<=budget+.001;
}
function initialCandidateShortlist(db,team,market,softMax){
  const ps=Math.max(.2,psOf(db,team.region)),covered=new Set((team.roster||[]).map(id=>db.players[id]?.role).filter(Boolean)),seen=new Set(),out=[];
  const add=p=>{if(p&&!p.team&&!seen.has(p.id)){seen.add(p.id);out.push(p)}};
  const regional=market.byRegion[team.region]||{local:[],foreign:[]};for(const x of regional.local.slice(0,18))add(x.p);for(const x of regional.foreign.slice(0,10))add(x.p);
  const publicTop=market.free.map(p=>{const salary=market.price(p,team.region),coverage=covered.has(p.role)?0:3,youth=(team.philosophy==='youth'&&p.age<=21)?3:0,star=team.philosophy==='superstar'?(p.reputation||0)*.12:0,pricePenalty=Math.max(0,salary-softMax)/ps*.08;return {p,q:(p.reputation||50)+coverage+youth+star-pricePenalty}}).sort((a,b)=>b.q-a.q).slice(0,28);
  for(const x of publicTop)add(x.p);return out;
}
function initialPickCandidate(db,t,key='',snap=null){
  const team=teamRef(db,t),market=snap||initialMarketSnapshot(db,[team]),target=team.initialRosterTarget||initialRosterTarget(db,team),room=Math.max(0,initialSalaryCeiling(db,team)-payroll(db,team)),slotsLeft=Math.max(1,target-team.roster.length),softMax=room/slotsLeft*1.35,rows=[];
  for(const p of initialCandidateShortlist(db,team,market,softMax)){const salary=market.price(p,team.region),chk=initialOfferCheck(db,p,team,{salary});if(!chk.ok)continue;rows.push({p,salary,score:initialCandidateScore(db,p,team,key,salary)})}
  rows.sort((a,b)=>(a.salary<=softMax)!==(b.salary<=softMax)?(a.salary<=softMax?-1:1):b.score-a.score||a.salary-b.salary);
  for(const row of rows)if(initialFutureFeasible(db,team,row.p,row.salary,market))return row.p;return null;
}
function aiInitialContractTerms(db,p,t,rng){
  const ask=asking(db,p,t.region),years=contractYearsForPlayer(db,p,rng),premium=rng.range(.96,1.08),role=defaultPromisedRole(db,p,t),room=Math.max(.1,initialSalaryCeiling(db,t)-payroll(db,t)),salary=Math.min(room,ask*premium);
  return normalizeContractTerms(db,p,t,salary,years,{releaseGuaranteeRate:contractGuaranteePolicy(p).preferred,signingBonus:rng.chance(.28)?ask*rng.range(.04,.12):0,bonuses:rng.chance(.32)?{performance:ask*.05,title:ask*.08,international:ask*.05}:{},promisedRole:role,option:rng.chance(.15)?{type:rng.chance(.55)?'team':'player'}:null,buyout:p.personality.ambition>=86&&rng.chance(.35)?playerMarketValue(db,p)*1.8:null});
}
function initialOfferForTeam(db,t,round,seed,market,target){
  const want=target??t.initialRosterTarget??initialRosterTarget(db,t);if(t.roster.length>=want)return null;
  const key='market|'+round+'|'+want,p=initialPickCandidate(db,t,key,market);if(!p)return null;
  const rng=new RNG((seed||'initial-market')+'|'+t.id+'|'+key,'initial-offer'),terms=aiInitialContractTerms(db,p,t,rng),chk=initialOfferCheck(db,p,t,terms);if(!chk.ok)return null;
  return {team:t,player:p,terms,value:offerUtility(db,p,t,terms)+((hashStr((seed||'initial-market')+'|choose|'+p.id+'|'+t.id+'|'+round)%1001)/1000-.5)*.08};
}
function resolveInitialOfferRound(db,teams,round,seed,targetFn){
  const market=initialMarketSnapshot(db,teams),offers=teams.map(t=>initialOfferForTeam(db,t,round,seed,market,targetFn(t))).filter(Boolean),byPlayer={};for(const o of offers)(byPlayer[o.player.id]=byPlayer[o.player.id]||[]).push(o);
  let signed=0;for(const os of Object.values(byPlayer)){const best=os.sort((a,b)=>b.value-a.value||b.terms.salary-a.terms.salary)[0],p=best.player,t=best.team;if(p.team)continue;const chk=initialOfferCheck(db,p,t,best.terms);if(!chk.ok||!initialFutureFeasible(db,t,p,best.terms.salary,market))continue;const done=commitWorldAction(db,{type:'player.sign',pid:p.id,teamId:t.id,kind:'initial',actor:'ai',
      salary:best.terms.salary,years:best.terms.years,terms:best.terms});
    if(done.ok)signed++}
  return {offers:offers.length,signed};
}
function runInitialMarketTo(db,teams,seed,targetFn,maxRounds=80){
  const done=t=>t.roster.length>=targetFn(t);
  for(let round=0;round<maxRounds&&!teams.every(done);round++){const contenders=teams.filter(t=>!done(t)),r=resolveInitialOfferRound(db,contenders,round,seed,targetFn);if(!r.signed)break}
  return teams.filter(t=>!done(t));
}
function initialLegalMinimumTarget(db,t){
  const team=teamRef(db,t),lim=initialSquadLimits(db,team);if(!team?.parent)return lim.min;
  const root=parentTeamOf(db,team),reserves=reserveTeamsOf(db,root),rules=rosterRulesForTeam(db,root),base=rules.firstTeamMin+reserves.length*rules.reserveTeamMin;let extra=Math.max(0,rules.integratedMin-base);
  for(const reserve of reserves){const rlim=initialSquadLimits(db,reserve),add=Math.min(extra,Math.max(0,rlim.max-rlim.min));if(reserve.id===team.id)return rlim.min+add;extra-=add}
  return lim.min;
}
function runInitialMinimumMarket(db,teams,seed){return runInitialMarketTo(db,teams,seed+'|minimum',t=>initialLegalMinimumTarget(db,t),80)}
function runInitialDepthMarket(db,teams,seed){return runInitialMarketTo(db,teams,seed+'|depth',t=>t.initialRosterTarget||initialRosterTarget(db,t),80)}
function autoBuildInitialSquad(db,t,rng,target=null){
  const team=teamRef(db,t),limits=initialSquadLimits(db,team),want=Math.min(limits.max,Math.max(limits.min,target??initialRosterTarget(db,team)));team.initialRosterTarget=want;
  while(team.roster.length<want){const market=initialMarketSnapshot(db,[team]),p=initialPickCandidate(db,team,'depth|'+team.roster.length,market);if(!p)break;const terms=aiInitialContractTerms(db,p,team,rng),chk=initialOfferCheck(db,p,team,terms);if(!chk.ok)break;const done=commitWorldAction(db,{type:'player.sign',pid:p.id,teamId:team.id,kind:'initial',actor:'system',
      salary:terms.salary,years:terms.years,terms});if(!done.ok)throw new Error('Initial roster transaction rejected: '+done.reason+' / '+(done.errors||[]).join(' | '))}
  const errors=initialSquadErrors(db,team);if(errors.length)throw new Error(team.name+' 초기 로스터 오류: '+errors.join(', '));return team;
}
function autoBuildInitialWorld(db,excludedIds,seed){
  const excluded=new Set(excludedIds||[]),teams=activeTeams(db).filter(t=>!excluded.has(t.id));for(const t of teams)t.initialRosterTarget=initialRosterTarget(db,t);
  const short=runInitialMinimumMarket(db,teams,seed);if(short.length)throw new Error(short[0].name+' AI 로스터가 법정 최소 인원을 확보하지 못했습니다');
  runInitialDepthMarket(db,teams,seed);for(const t of teams)t.initialRosterBuilt=t.roster.length;
}
function beginInitialRosterPhase(db,teamId,seed){
  if(!isManagerSelectableTeam(db,teamId))throw new Error('감독 시작 팀으로 선택할 수 없는 구단입니다');setManagedTeam(db,teamId);seedInitialPayrollBudgets(db);db.manager.startMode='blank_roster';db.manager.careerStartedAt=null;
  db.world={year:db.year,seed,manage:db.worldConfig.manage||'manual',phase:'initial_roster',seasons:{},steps:[],step:-1,report:null,lastDate:db.worldDate,offers:[],negotiations:{},recruitment:{targets:{}},marketLog:[]};return db.world;
}
// The first-year blind auction can exhaust the unsigned player pool.
// Replenish only after the legitimate initial roster market has closed:
// otherwise clubs simply consume the reserve during setup. The goal is a small
// real labor market, NOT on-demand emergency generation when an injury occurs.
function seedFirstSeasonFreeAgentDepth(db){
  if(!db.firstSeasonSetup?.blankRosters||db.firstSeasonSetup.completed)return [];
  const created=[],seed=db.world?.seed||'first-season';
  for(const region of Object.values(db.regions)){
    const n=activeTeams(db,region.id).length;
    if(!n)continue;
    // 10 clubs: two unsigned players per position; 20 clubs: four.
    // Nearby regions remain separate for local registration eligibility.
    const minPerRole=Math.max(2,Math.min(5,Math.ceil(n/5)));
    const rng=new RNG(seed+'|'+db.year+'|'+region.id,'initial-fa-depth');
    for(const role of ROLES){
      const free=()=>Object.values(db.players).filter(p=>
        !p.retired&&!p.team&&isLocalPlayer(p,region.id)&&p.role===role).length;
      // Bound additions per call and count actual unsigned, local athletes.
      const missing=Math.max(0,minPerRole-free());
      for(let i=0;i<missing;i++){
        const age=rng.pick([18,19,20,21,22,23,24,25,27,29]);
        const base=region.strength-12+clamp(rng.normal(0,3),-6,6);
        const p=genPlayer(db,rng,{role,age,base,region:region.id,
          entryYear:db.year,entryPath:'open_qualifier'});
        created.push(p.id);
      }
    }
  }
  return created;
}

function finalizeInitialRosters(db){
  const root=managedTeam(db);if(!root)throw new Error('관리 구단이 없습니다');const mine=setupTeamsForManager(db),errors=initialOrganizationErrors(db,root);if(errors.length)throw new Error(errors[0]);
  const mineIds=new Set(mine.map(t=>t.id)),pending=Object.values(negotiationStore(db)).filter(n=>n.status==='open'&&n.kind==='initial'&&mineIds.has(n.teamId));if(pending.length)throw new Error('진행 중인 창단 계약 협상을 먼저 마무리해야 합니다');
  autoBuildInitialWorld(db,mine.map(t=>t.id),db.world.seed);
  const allErrors=[];for(const t of activeTeams(db))for(const e of initialSquadErrors(db,t))allErrors.push(t.name+': '+e);
  for(const t of activeTeams(db).filter(t=>!t.parent&&reserveTeamsOf(db,t).length)){const rules=rosterRulesForTeam(db,t),n=organizationRoster(db,t).length;if(n<rules.integratedMin||n>rules.integratedMax)allErrors.push(t.name+': 통합 로스터 '+n+'명')}
  if(allErrors.length)throw new Error('AI 초기 로스터 구성 실패 · '+allErrors[0]);for(const t of activeTeams(db))initializeTeamRosterRoles(db,t,true);seedFirstSeasonFreeAgentDepth(db);db.manager.careerStartedAt=db.worldDate;db.firstSeasonSetup.completed=true;const seed=db.world.seed,teamId=root.id;startWorldSeason(db,teamId,seed);return db.world;
}
