// ===== LOL GM: player representatives and oral sporting commitments =====
function playerAgent(p){return p?.agent?.clientId===p.id?p.agent:null}
function ensurePlayerAgent(p){
  if(playerAgent(p)||p.retired||(p.reputation||0)<82)return playerAgent(p);
  // Reuse the established high-reputation contract-demand boundary.
  const rng=new RNG(p.id+'/agent','representation'),
    trait=()=>Math.round(clamp(rng.normal(60,15),10,99));
  // Independent stable stream; reuse the player's existing personality model.
  p.agent={id:'AGENT_'+p.id,clientId:p.id,name:p.name+' 담당 에이전트',
    profile:{professionalism:trait(),ambition:trait()},focus:playerCareerGoal(p)};
  return p.agent;
}
function negotiationRepresentativeProfile(p){return playerAgent(p)?.profile||p.personality}
function playerRepresentativeText(p){return playerAgent(p)?.name||'선수 직접 협상'}
function oralRolePromiseStatus(db,p,year=db.year){
  const promise=p.rolePromise;
  if(!promise||!p.team||!p.contract||p.contract.until<year||promise.until<year)return null;
  return {...rolePromiseUsageStatus(db,p,promise.role,promise.start,year),source:'oral'};
}
function effectiveRolePromiseStatus(db,p,year=db.year){
  const contract=contractRolePromiseStatus(db,p,year),oral=oralRolePromiseStatus(db,p,year);
  return oral&&(!contract||SQUAD_ROLE_ORDER[oral.role]>SQUAD_ROLE_ORDER[contract.role])
    ?oral:contract;
}
function closeOralRolePromise(db,p,reason){
  if(!p.rolePromise)return;
  recordPlayerEvent(p,'role_promise_closed',db.year,{role:p.rolePromise.role,
    team:p.rolePromise.teamId,date:db.worldDate,reason});
  delete p.rolePromise;
}
function rolePromiseActionSnapshot(db,a){
  const p=db.players[a.pid];
  return {...playerActionSnapshot(db,a),managed:managedTeamId(db),manage:db.world?.manage,
    usage:p?.usage?JSON.parse(JSON.stringify(p.usage)):null,
    promise:p?.rolePromise?JSON.parse(JSON.stringify(p.rolePromise)):null};
}
WORLD_ACTION_HANDLERS['player.promise']={
  validate(db,a){
    const p=db.players[a.pid],t=db.teams[a.teamId];
    if(!p||p.retired||!t||t.active===false||p.team!==t.id||!p.contract||
      p.contract.until<db.year||p.contract.medicalReplacement)
      return worldActionError('invalid_promise','현재 소속의 유효한 일반 계약 선수가 필요합니다');
    if(a.actor==='system'||a.actor==='manager'&&!managerControlsSquad(db,t)||
      a.actor==='ai'&&db.world?.manage==='manual'&&managerControlsSquad(db,t))
      return worldActionError('unauthorized','관리하는 선수의 역할 약속만 결정할 수 있습니다');
    if(!SQUAD_ROLES.includes(a.role))return worldActionError('invalid_terms','유효한 역할이 필요합니다');
    if(oralRolePromiseStatus(db,p))
      return worldActionError('active_promise','기존 구두 약속은 새 약속으로 초기화할 수 없습니다');
    const floor=Math.max(SQUAD_ROLE_ORDER[p.contract.promisedRole]??0,
      SQUAD_ROLE_ORDER[p.rosterRole]??0);
    if(SQUAD_ROLE_ORDER[a.role]<=floor)
      return worldActionError('player_consent','현재 역할과 계약보다 높은 기회를 약속해야 합니다');
    return {ok:true,pid:p.id,teamId:t.id,role:a.role,until:p.contract.until};
  },
  canonical(db,a,v){return {type:a.type,actor:a.actor,pid:v.pid,teamId:v.teamId,
    role:v.role,until:v.until}},
  snapshot:rolePromiseActionSnapshot,
  changes(db,a){return [{pid:a.pid,role:a.role,until:a.until,
    expected:expectedPlayShare({rosterRole:a.role},db.teams[a.teamId])}]},
  apply(db,a){
    const p=db.players[a.pid],u=p.usage?.year===db.year?p.usage:null;
    p.rolePromise={role:a.role,teamId:a.teamId,until:a.until,issuer:a.actor,
      start:{year:db.year,date:db.worldDate||null,games:u?.games||0,
        teamGames:u?.teamGames||0,unavailableTeamGames:u?.unavailableTeamGames||0}};
    recordPlayerEvent(p,'role_promise',db.year,{role:a.role,team:a.teamId,
      until:a.until,date:db.worldDate,source:a.actor});
    return {promise:p.rolePromise};
  }
};
function aiSportingRolePromise(db,p,t){
  if(!p?.contract||p.contract.medicalReplacement||oralRolePromiseStatus(db,p))return;
  const role=recommendedRosterRole(db,p,t);
  if(starterFor(db,t,p.role)!==p||SQUAD_ROLE_ORDER[role]<=
    Math.max(SQUAD_ROLE_ORDER[p.contract.promisedRole]??0,SQUAD_ROLE_ORDER[p.rosterRole]??0))return;
  return commitWorldAction(db,{type:'player.promise',pid:p.id,teamId:t.id,role,actor:'ai'});
}
