// ===== LOL GM: atomic squad coaching preparation =====
// Transient UI edits share one roster/role plan, with separate squad coaching.
// The canonical writer reuses roster/lineup/role domains and the scoped journal.
function squadPreparationSnapshot(db,c){
  return {roster:rosterActionSnapshot(db,c.parentId),manager:managedTeamId(db),fired:!!db.world?.fired,
    teams:organizationTeams(db,c.parentId).map(t=>({id:t.id,active:t.active!==false,
      starters:{...(t.depthChart||{})},tactics:{...t.tactics},training:{...t.training}})),
    roles:organizationRoster(db,c.parentId).map(pid=>({pid,role:db.players[pid]?.rosterRole||null}))};
}
function validateSquadPreparation(db,c){
  const root=parentTeamOf(db,c.parentId),mine=managedTeam(db);
  if(!db.world||!root||root.active===false||!mine||mine.active===false||db.world.fired||!managerControlsSquad(db,root)&&mine.parent!==root.id)
    return worldActionError('unauthorized','관리 권한이 없는 구단의 준비를 변경할 수 없습니다');
  if(c.actor!=='manager')
    return worldActionError('unauthorized','관리 구단의 준비는 감독이 직접 확정합니다');
  if(c.expected&&JSON.stringify(c.expected)!==JSON.stringify(squadPreparationSnapshot(db,c)))
    return worldActionError('stale_preparation','선수단이나 준비 상태가 변경되었습니다. 임시 변경을 취소하고 다시 편집하세요');
  if(!c.squads||typeof c.squads!=='object'||Array.isArray(c.squads)||!c.roles||typeof c.roles!=='object'||Array.isArray(c.roles))
    return worldActionError('invalid_action','팀별 준비와 선수 역할 계획이 필요합니다');
  const hasReserve=!mine.parent&&reserveTeamsOf(db,root).length>0;
  const plan=hasReserve?WORLD_ACTION_HANDLERS['roster.plan'].validate(db,{...c,type:'roster.plan'}):null;
  if(plan&&!plan.ok)return plan;
  const assignments=plan?.assignments||rosterPlanState(db,root).assignments;
  if(mine.parent&&JSON.stringify(c.assignments)!==JSON.stringify(assignments))
    return worldActionError('unauthorized','1·2군 배치는 모구단 감독이 결정합니다');
  const allowed=new Set((mine.parent?mine.roster:organizationRoster(db,root)).map(id=>id));
  for(const [pid,role] of Object.entries(c.roles))if(!db.players[pid]||!allowed.has(pid)||!SQUAD_ROLES.includes(role))
    return worldActionError('invalid_role','현재 관리 선수의 유효한 로스터 역할만 변경할 수 있습니다');
  const squads={};
  for(const [id,x] of Object.entries(c.squads)){
    const t=db.teams[id];
    if(!t||t.active===false||parentTeamOf(db,t)?.id!==root.id||
      c.actor==='manager'&&!managerControlsSquad(db,t))
      return worldActionError('unauthorized','관리하지 않는 스쿼드의 준비는 변경할 수 없습니다');
    if(!x||typeof x!=='object'||Array.isArray(x)||Object.values(x.starters||{}).some(pid=>db.players[pid]?.retired))
      return worldActionError('invalid_lineup','현재 활동 중인 선수로 선발을 구성하세요');
    const lineup=validateStartingLineup(db,t,x?.starters,Object.keys(assignments).filter(pid=>assignments[pid]===id));
    if(!lineup.ok)return {ok:false,reason:'invalid_lineup',errors:lineup.errors.map(e=>t.name+': '+e)};
    const keys=Object.keys(t.tactics||{}),tactics={};
    for(const key of keys){const v=x?.tactics?.[key];if(!Number.isFinite(v)||v<0||v>100)
      return worldActionError('invalid_tactics','전술 값은 0~100이어야 합니다');tactics[key]=v}
    if(!x.training||!['light','normal','high'].includes(x.training.intensity)||
      x.training.focus!==undefined&&!Object.hasOwn(PRACTICE_FOCUS,x.training.focus))
      return worldActionError('invalid_training','유효한 훈련 강도와 연습 중점이 필요합니다');
    const groups=Object.keys(ATTR_GROUPS);
    if(groups.some(k=>!Number.isInteger(x.training[k])||x.training[k]<0)||groups.reduce((n,k)=>n+x.training[k],0)>TRAIN_POINTS)
      return worldActionError('invalid_training','훈련 배분은 총 100점 이내여야 합니다');
    squads[id]={starters:lineup.assignment,tactics,training:normalizeTraining(x.training)};
  }
  return {ok:true,parentId:root.id,assignments,roles:{...c.roles},squads,moves:plan?.moves||[]};
}
WORLD_ACTION_HANDLERS['squad.preparation']={
  validate:validateSquadPreparation,
  canonical(db,c,v){return {type:c.type,actor:c.actor,parentId:v.parentId,assignments:{...v.assignments},roles:{...v.roles},squads:actionJournalClone(v.squads)}},
  snapshot:squadPreparationSnapshot,
  changes(db,c,v){return v.moves.map(m=>({...m}))},
  apply(db,c){
    const moves=Object.entries(c.assignments).some(([pid,dst])=>db.players[pid].team!==dst);
    if(moves)applyRosterPlan(db,c.parentId,{assignments:c.assignments},c.actor);
    for(const [id,x] of Object.entries(c.squads)){
      const t=db.teams[id];
      for(const role of ROLES){const result=setDepthStarter(db,t,role,x.starters[role],c.actor,false);if(!result.ok)throw Error(result.reason)}
      t.tactics={...x.tactics};t.training=normalizeTraining(x.training);
    }
    for(const [pid,role] of Object.entries(c.roles))if(db.players[pid].rosterRole!==role){
      const result=setRosterRole(db,pid,role,c.actor,false);if(!result.ok)throw Error(result.reason);
    }
    return {ok:true};
  }
};

function captureSquadPreparationJournal(db,c){
  const demand=db._marketDemandCache,demandValue=demand?actionJournalClone(demand):null;
  const base=captureWorldActionJournal(db,{...c,type:'roster.plan'}),
    playerIds=new Set(organizationRoster(db,c.parentId)),
    players=Array.from(playerIds,pid=>({pid,ref:db.players[pid],value:actionJournalClone(db.players[pid])})),
    teams=organizationTeams(db,c.parentId).map(team=>({team,fields:['tactics','training'].map(key=>({key,
      present:Object.hasOwn(team,key),ref:team[key],value:team[key]===undefined?null:actionJournalClone(team[key])}))}));
  return {playerIds,rollback(){
    base.rollback();
    if(demand&&demandValue)actionJournalRestoreObject(demand,demandValue);
    for(const {team,fields} of teams)for(const {key,present,ref,value} of fields){
      if(!present)delete team[key];
      else if(ref&&typeof ref==='object'){actionJournalRestoreObject(ref,value);team[key]=ref}
      else team[key]=ref;
    }
    for(const {pid,ref,value} of players){actionJournalRestoreObject(ref,value);db.players[pid]=ref}
  }};
}
