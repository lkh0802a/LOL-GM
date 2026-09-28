// ===== LOL GM: command validation, preview and guarded application =====
// The pure preview is a short-lived decision object, not persistent game state.
// Human and AI callers use the same handlers; actor-specific authority is checked here.

function worldActionError(reason,message){
  return {ok:false,reason,errors:[message]};
}

function rosterActionSnapshot(db,parentId){
  return {
    date:db.worldDate||null,
    year:db.world?.year??db.year,
    teams:organizationTeams(db,parentId).map(t=>({
      id:t.id,roster:(t.roster||[]).slice().sort()
    }))
  };
}

const WORLD_ACTION_HANDLERS={
  'roster.plan':{
    validate(db,action){
      const parent=parentTeamOf(db,action.parentId);
      if(!parent||parent.active===false)return worldActionError('missing_team','구단을 찾을 수 없습니다');
      const owner=managedTeamId(db);
      if(owner&&action.actor==='manager'&&parent.id!==owner)
        return worldActionError('unauthorized','관리하지 않는 구단의 로스터는 변경할 수 없습니다');
      if(owner&&action.actor==='ai'&&parent.id===owner)
        return worldActionError('unauthorized','관리 구단의 로스터는 AI가 자동 확정할 수 없습니다');
      if(!action.assignments||typeof action.assignments!=='object'||Array.isArray(action.assignments))
        return worldActionError('invalid_action','유효한 로스터 배치 계획이 필요합니다');
      const checked=validateRosterPlan(db,parent,{assignments:action.assignments});
      if(!checked.ok)return {ok:false,reason:'roster_invalid',errors:checked.errors.slice()};
      const moves=Object.entries(checked.assignments)
        .filter(([pid,dst])=>db.players[pid].team!==dst)
        .map(([pid,to])=>({pid,from:db.players[pid].team,to,kind:to===parent.id?'callup':'senddown'}));
      return {ok:true,parentId:parent.id,assignments:{...checked.assignments},
        counts:{...checked.counts},total:checked.total,moves};
    },
    apply(db,action){
      return applyRosterPlan(db,action.parentId,{assignments:action.assignments},action.actor);
    },
    snapshot:rosterActionSnapshot
  }
};

function validateWorldAction(db,command){
  if(!db||!db.teams||!db.players||!command||typeof command!=='object')
    return worldActionError('invalid_action','게임 상태 또는 요청이 올바르지 않습니다');
  const actor=command.actor||'manager';
  if(actor!=='manager'&&actor!=='ai')
    return worldActionError('invalid_actor','지원하지 않는 작업 주체입니다');
  const handler=WORLD_ACTION_HANDLERS[command.type];
  if(!handler)return worldActionError('unknown_action','지원하지 않는 작업입니다');
  return handler.validate(db,{...command,actor});
}

function previewWorldAction(db,command){
  const checked=validateWorldAction(db,command);
  if(!checked.ok)return checked;
  const actor=command.actor||'manager',handler=WORLD_ACTION_HANDLERS[command.type];
  return {ok:true,type:command.type,
    command:{type:command.type,actor,parentId:checked.parentId,assignments:{...checked.assignments}},
    expected:handler.snapshot(db,checked.parentId),
    changes:checked.moves.map(m=>({...m})),
    counts:{...checked.counts},total:checked.total};
}

function applyWorldAction(db,preview){
  if(!preview||preview.ok!==true||!preview.command||!preview.expected)
    return worldActionError('invalid_preview','먼저 유효한 작업 미리보기를 생성해야 합니다');
  const handler=WORLD_ACTION_HANDLERS[preview.command.type];
  if(!handler)return worldActionError('unknown_action','지원하지 않는 작업입니다');
  const current=handler.snapshot(db,preview.command.parentId);
  if(JSON.stringify(current)!==JSON.stringify(preview.expected))
    return worldActionError('stale_preview','로스터 또는 게임 날짜가 변경되었습니다. 계획을 다시 확인하세요');
  const checked=validateWorldAction(db,preview.command);
  if(!checked.ok)return checked;
  if(JSON.stringify(checked.moves)!==JSON.stringify(preview.changes))
    return worldActionError('stale_preview','계획의 변경 내역이 달라졌습니다. 미리보기를 다시 생성하세요');
  const applied=handler.apply(db,preview.command);
  return {...applied,ok:true,type:preview.command.type};
}
