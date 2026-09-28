// ===== LOL GM: Roster / registration domain =====
// Owns player-local eligibility, contracted club-move counting, roster rule profiles,
// owned-reserve organization planning/movement, team/player assignment and roster integrity.
// Match-slot assignment remains in lineup.js; transfers/contracts remain in finance.js.

// 등록 자격은 선수의 출신/국적과 분리한다. region은 레거시 출신 생태계 키로만 유지한다.
const FIRST_TEAM_NON_LOCAL_LIMIT=2, CONTRACTED_MOVE_LIMIT_PER_SEASON=2;
function ensurePlayerEligibility(p){
  if(!p)return null;
  const origin=p.originRegion||p.region||p.nationality||null;
  if(!p.originRegion)p.originRegion=origin;
  if(!p.originLocalRegion)p.originLocalRegion=p.originRegion||origin;
  if(!p.activeLocalRegion)p.activeLocalRegion=p.originLocalRegion||origin;
  p.localEligibility=p.localEligibility||{};
  if(!p.localEligibility.origin)p.localEligibility.origin=p.originLocalRegion;
  p.localEligibility.active=p.activeLocalRegion;
  p.localEligibility.qualifications=p.localEligibility.qualifications||{};
  if(!Array.isArray(p.contractedMoves))p.contractedMoves=[];
  return p;
}
function playerOriginRegion(p){return ensurePlayerEligibility(p)?.originRegion||null}
function playerActiveLocalRegion(p){return ensurePlayerEligibility(p)?.activeLocalRegion||null}
function isLocalPlayer(p,regionId){return !!p&&!!regionId&&playerActiveLocalRegion(p)===regionId}
function nonLocalLimitForTeam(db,t){
  const team=teamRef(db,t);if(!team)return FIRST_TEAM_NON_LOCAL_LIMIT;
  if((team.division||1)===1)return FIRST_TEAM_NON_LOCAL_LIMIT;
  const R=db.regions[team.region];return Math.max(0,R?.reserveImportLimit??FIRST_TEAM_NON_LOCAL_LIMIT);
}
function teamNonLocalCount(db,t,excludePid=null){
  const team=teamRef(db,t);if(!team)return 0;
  return (team.roster||[]).reduce((n,id)=>{if(id===excludePid)return n;const p=db.players[id];return n+(p&&!isLocalPlayer(p,team.region)?1:0)},0);
}
function localRegistrationError(db,t,p){
  const team=teamRef(db,t),player=playerRef(db,p);if(!team||!player)return '등록 대상을 찾을 수 없습니다';
  if(isLocalPlayer(player,team.region))return null;
  if((team.roster||[]).includes(player.id))return null;
  return teamNonLocalCount(db,team)>=nonLocalLimitForTeam(db,team)?'비로컬 선수 등록 상한을 넘습니다':null;
}
function contractedMoveSeason(db){return db?.world?.year??db?.year}
function contractedMoveCount(db,p){ensurePlayerEligibility(p);const y=contractedMoveSeason(db);return (p?.contractedMoves||[]).filter(x=>x.season===y&&x.counts!==false).length}
function contractedMoveError(db,p){return contractedMoveCount(db,p)>=CONTRACTED_MOVE_LIMIT_PER_SEASON?'한 시즌 계약 구단 이동은 최대 2회까지 가능합니다':null}
function recordContractedMove(db,p,kind,from,to,extra={}){
  ensurePlayerEligibility(p);const season=contractedMoveSeason(db);
  if(kind==='loan_return'||kind==='loan_purchase_conversion'||kind==='restructure')return null;
  if(contractedMoveError(db,p))throw new Error('Contracted move limit exceeded: '+p.id);
  const row={season,kind,from:from?.id||from||null,to:to?.id||to||null,date:db.worldDate||null,counts:true,...extra};
  p.contractedMoves.push(row);return row;
}

const GLOBAL_FIRST_TEAM_MIN=5,GLOBAL_FIRST_TEAM_MAX=10,GLOBAL_RESERVE_TEAM_MIN=5;
function rosterRule(id,source,{integratedMin=GLOBAL_FIRST_TEAM_MIN,integratedMax=GLOBAL_FIRST_TEAM_MAX,reserveTeamMax=10,reserveSubMax=5}={}){
  return {id,source,integratedMin,integratedMax,firstTeamMin:GLOBAL_FIRST_TEAM_MIN,firstTeamMax:GLOBAL_FIRST_TEAM_MAX,reserveTeamMin:GLOBAL_RESERVE_TEAM_MIN,reserveTeamMax,reserveSubMax};
}
const ROSTER_RULE_PROFILES={
  STANDARD_TIER1_2026:rosterRule('STANDARD_TIER1_2026','GLOBAL_2026'),
  ENGINE_OWNED_RESERVE:rosterRule('ENGINE_OWNED_RESERVE','POLICY_ENGINE',{integratedMin:11,integratedMax:20}),
  OWNED_RESERVE_LCK_STYLE_2026:rosterRule('OWNED_RESERVE_LCK_STYLE_2026','LCK_2026',{integratedMin:11,integratedMax:20}),
  LCS_2026:rosterRule('LCS_2026','LCS_2026',{integratedMin:5,integratedMax:10,reserveSubMax:7}),
  LCP_2026:rosterRule('LCP_2026','LCP_2026'),
  LEC_2026:rosterRule('LEC_2026','LEC_2026'),
  LPL_2026:rosterRule('LPL_2026','LPL_2026'),
  CBLOL_2026:rosterRule('CBLOL_2026','CBLOL_2026')
};
function rosterRuleProfile(id='STANDARD_TIER1_2026'){return ROSTER_RULE_PROFILES[id]||ROSTER_RULE_PROFILES.STANDARD_TIER1_2026}

function engineRosterRuleProfile(region){
  if(region&&region.div2&&region.system==='franchise')return ROSTER_RULE_PROFILES.ENGINE_OWNED_RESERVE;
  return ROSTER_RULE_PROFILES.STANDARD_TIER1_2026;
}
function rosterRulesForTeam(db,t){
  const team=teamRef(db,t);if(!team)return ROSTER_RULE_PROFILES.STANDARD_TIER1_2026;
  const region=db.regions[team.region];return region&&region.rosterRuleProfile?rosterRuleProfile(region.rosterRuleProfile):engineRosterRuleProfile(region);
}
function parentTeamOf(db,t){const team=teamRef(db,t);if(!team)return null;return team.parent?db.teams[team.parent]||null:team}
function reserveTeamsOf(db,t){const parent=parentTeamOf(db,t);if(!parent)return [];return activeTeams(db,parent.region,2).filter(x=>x.parent===parent.id)}
function organizationTeams(db,t){const parent=parentTeamOf(db,t);if(!parent)return [];return [parent,...reserveTeamsOf(db,parent)]}
function organizationRoster(db,t){return Array.from(new Set(organizationTeams(db,t).flatMap(x=>x.roster||[])))}
function rosterPlanState(db,t){
  const parent=parentTeamOf(db,t);if(!parent)return null;
  const teams=organizationTeams(db,parent),assignments={};
  for(const team of teams)for(const pid of (team.roster||[]))assignments[pid]=team.id;
  return {parentId:parent.id,teamIds:teams.map(x=>x.id),assignments};
}
function validateRosterPlan(db,t,plan){
  const parent=parentTeamOf(db,t),errors=[];if(!parent)return {ok:false,errors:['구단을 찾을 수 없습니다']};
  const teams=organizationTeams(db,parent),teamIds=new Set(teams.map(x=>x.id)),rules=rosterRulesForTeam(db,parent);
  if(!reserveTeamsOf(db,parent).length)errors.push('이 구단은 산하 2군을 운영하지 않습니다');
  const base=organizationRoster(db,parent),baseSet=new Set(base),assign=plan&&plan.assignments||{},counts=Object.fromEntries(teams.map(x=>[x.id,0]));
  for(const pid of base){
    const p=db.players[pid],dst=assign[pid]||p?.team;
    if(!p){errors.push('존재하지 않는 선수가 로스터에 포함되어 있습니다: '+pid);continue}
    if(!teamIds.has(dst)){errors.push(p.name+': 같은 구단의 1군/2군에만 배치할 수 있습니다');continue}
    counts[dst]=(counts[dst]||0)+1;
  }
  for(const pid of Object.keys(assign))if(!baseSet.has(pid))errors.push('구단 통합 로스터 밖의 선수를 이동할 수 없습니다: '+pid);
  const first=parent,firstN=counts[first.id]||0;
  if(firstN<rules.firstTeamMin)errors.push('1군은 최소 '+rules.firstTeamMin+'명이어야 합니다 (현재 계획 '+firstN+'명)');
  if(firstN>rules.firstTeamMax)errors.push('1군은 최대 '+rules.firstTeamMax+'명까지 가능합니다 (현재 계획 '+firstN+'명)');
  for(const reserve of teams.filter(x=>x.parent)){
    const n=counts[reserve.id]||0;
    if(n<rules.reserveTeamMin)errors.push(reserve.name+'은 최소 '+rules.reserveTeamMin+'명이어야 합니다 (현재 계획 '+n+'명)');
    if(n>rules.reserveTeamMax)errors.push(reserve.name+'은 최대 '+rules.reserveTeamMax+'명까지 가능합니다 (현재 계획 '+n+'명)');
  }
  const total=Object.values(counts).reduce((x,y)=>x+y,0);
  if(total<rules.integratedMin||total>rules.integratedMax)errors.push('통합 로스터는 '+rules.integratedMin+'~'+rules.integratedMax+'명이어야 합니다 (현재 '+total+'명)');
  return {ok:errors.length===0,errors,counts,total,parentId:parent.id,assignments:Object.fromEntries(base.map(pid=>[pid,assign[pid]||db.players[pid].team]))};
}
function applyRosterPlan(db,t,plan,source='manager'){
  const checked=validateRosterPlan(db,t,plan);if(!checked.ok)throw new Error(checked.errors.join('\n'));
  const parent=db.teams[checked.parentId],before=Object.fromEntries(Object.keys(checked.assignments).map(pid=>[pid,db.players[pid].team])),moves=[];
  for(const [pid,dst] of Object.entries(checked.assignments))if(before[pid]!==dst)moves.push({pid,from:before[pid],to:dst,kind:dst===parent.id?'callup':'senddown'});
  for(const team of organizationTeams(db,parent))team.roster=(team.roster||[]).filter(pid=>!moves.some(m=>m.pid===pid));
  for(const m of moves){const p=db.players[m.pid],dst=db.teams[m.to];dst.roster.push(p.id);p.team=dst.id}
  if(db.world)for(const m of moves){const p=db.players[m.pid];recordPlayerEvent(p,'squad_move',db.year,{from:m.from,to:m.to,kind:m.kind,date:db.worldDate,source});if(typeof onSquadMoveSatisfaction==='function')onSquadMoveSatisfaction(db,p,m)}
  for(const team of organizationTeams(db,parent))initializeDepthChart(db,team,true);
  return {...checked,moves};
}
function rosterMoveCheck(db,p,target){
  const player=playerRef(db,p),dst=teamRef(db,target);
  if(!player)return {ok:false,reason:'선수를 찾을 수 없습니다'};
  if(!dst||dst.active===false)return {ok:false,reason:'이동할 팀을 찾을 수 없습니다'};
  const src=player.team&&db.teams[player.team];if(!src||src.active===false)return {ok:false,reason:'현재 소속팀이 없습니다'};
  if(src.id===dst.id)return {ok:false,reason:'이미 해당 스쿼드 소속입니다'};
  const plan=rosterPlanState(db,src);if(!plan)return {ok:false,reason:'구단을 찾을 수 없습니다'};
  plan.assignments[player.id]=dst.id;
  const checked=validateRosterPlan(db,src,plan);
  return checked.ok?{ok:true,kind:dst.parent?'senddown':'callup',from:src.id,to:dst.id,parent:checked.parentId}:{ok:false,reason:checked.errors[0],errors:checked.errors};
}
function movePlayerBetweenSquads(db,p,target){
  const player=playerRef(db,p),src=player&&player.team&&db.teams[player.team];
  if(!src)throw new Error('현재 소속팀이 없습니다');
  const plan=rosterPlanState(db,src);
  plan.assignments[player.id]=teamRef(db,target)?.id;
  const preview=previewWorldAction(db,{type:'roster.plan',parentId:src.id,assignments:plan.assignments,actor:'manager'});
  if(!preview.ok)throw new Error(preview.errors.join('\n'));
  const result=applyWorldAction(db,preview);
  if(!result.ok)throw new Error(result.errors.join('\n'));
  return result.moves[0];
}
function aiManageOwnedReserve(db,t){
  const parent=teamRef(db,t);if(!parent||parent.parent||parent.id===managedTeamId(db))return [];
  const reserve=reserveTeamsOf(db,parent)[0];if(!reserve)return [];
  const last=parent.reserveReviewDate;if(last&&Math.abs((new Date(db.worldDate)-new Date(last))/86400000)<7)return [];
  parent.reserveReviewDate=db.worldDate;initializeDepthChart(db,parent,false);initializeDepthChart(db,reserve,false);
  const fit=p=>Math.max(...ROLES.map(role=>playerRoleRating(p,role)))+(p.form||0)*.22+(p.condition??96)*.025;
  const first=(parent.roster||[]).map(id=>db.players[id]).filter(Boolean).sort((a,b)=>fit(a)-fit(b));
  const second=(reserve.roster||[]).map(id=>db.players[id]).filter(Boolean).sort((a,b)=>fit(b)-fit(a));
  if(!first.length||!second.length)return [];
  const down=first[0],up=second[0],gap=fit(up)-fit(down),starterTrouble=ROLES.some(role=>parent.depthChart?.[role]===down.id&&((down.form??0)<=-7||down.condition<55));
  if(gap<2&&!(gap>=0&&starterTrouble))return [];
  const plan=rosterPlanState(db,parent);plan.assignments[up.id]=parent.id;plan.assignments[down.id]=reserve.id;
  const preview=previewWorldAction(db,{type:'roster.plan',parentId:parent.id,assignments:plan.assignments,actor:'ai'});
  if(!preview.ok)return [];
  const applied=applyWorldAction(db,preview);if(!applied.ok)return [];
  rebalanceAiRosterRoles(db,parent);rebalanceAiRosterRoles(db,reserve);
  return [{pid:up.id,kind:'callup',swap:down.id},{pid:down.id,kind:'senddown',swap:up.id}];
}
function playerRef(db,p){return typeof p==='string'?db.players[p]:p}
function teamRef(db,t){return typeof t==='string'?db.teams[t]:t}
function removePlayerFromTeam(db,p){
  const player=playerRef(db,p);if(!player)return null;
  const oldId=player.team;
  for(const t of Object.values(db.teams))if(t.roster&&t.roster.includes(player.id))t.roster=t.roster.filter(id=>id!==player.id);
  player.team=null;
  return oldId;
}
function assignPlayerToTeam(db,p,t){
  const player=playerRef(db,p),team=teamRef(db,t);
  if(!player)throw new Error('Unknown player');
  if(!team)throw new Error(`Unknown team: ${typeof t==='string'?t:'?'}`);
  const oldTeam=player.team&&db.teams[player.team],oldOrg=oldTeam?(oldTeam.parent||oldTeam.id):null,newOrg=team.parent||team.id;
  for(const other of Object.values(db.teams))if(other.id!==team.id&&other.roster&&other.roster.includes(player.id))other.roster=other.roster.filter(id=>id!==player.id);
  team.roster=Array.from(new Set([...(team.roster||[]),player.id]));player.team=team.id;
  if(typeof pState==='function'){pState(player);if(oldOrg!==newOrg){player.teamAdaptation=oldOrg?45:55;player.tacticalAdaptation=oldOrg?48:58}}
  return player;
}
function rosterIntegrityErrors(db){
  const errors=[],seen=new Map();
  for(const t of Object.values(db.teams)){
    const roster=t.roster||[];
    const local=new Set();
    for(const pid of roster){
      if(local.has(pid))errors.push(`duplicate roster entry ${t.id}:${pid}`);else local.add(pid);
      const p=db.players[pid];
      if(!p){errors.push(`missing player ${pid} in ${t.id}`);continue}
      if(p.team!==t.id)errors.push(`team mismatch ${pid}: player=${p.team||'FA'}, roster=${t.id}`);
      const prev=seen.get(pid);if(prev&&prev!==t.id)errors.push(`player ${pid} listed by ${prev} and ${t.id}`);else seen.set(pid,t.id);
    }
  }
  for(const p of Object.values(db.players)){
    if(!p.team)continue;
    const t=db.teams[p.team];
    if(!t)errors.push(`player ${p.id} references missing team ${p.team}`);
    else if(!(t.roster||[]).includes(p.id))errors.push(`player ${p.id} references ${p.team} but is absent from roster`);
  }
  return errors;
}
