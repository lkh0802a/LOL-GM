// ===== LOL GM: command validation, preview and guarded application =====
// The pure preview is a short-lived decision object, not persistent game state.
// Human and AI callers use the same handlers; actor-specific authority is checked here.

function worldActionError(reason,message){
  return {ok:false,reason,errors:[message]};
}

function rosterActionSnapshot(db,parentId){
  return {
    saveId:db.saveId||null,
    date:db.worldDate||null,
    year:db.world?.year??db.year,
    teams:organizationTeams(db,parentId).map(t=>({
      id:t.id,roster:(t.roster||[]).slice().sort()
    }))
  };
}

const WORLD_ACTION_HANDLERS={
  'roster.market-callup':{
    validate:validateMarketReserveCallup,
    canonical(db,a,v){return {type:a.type,actor:a.actor,parentId:v.parentId,
      reserveId:v.reserveId,role:v.role,pid:v.pid,downId:v.downId,
      assignments:{...v.assignments}}},
    snapshot(db,c){return rosterActionSnapshot(db,c.parentId)},
    changes(db,c,v){return v.moves.map(m=>({...m}))},
    apply:applyMarketReserveCallup
  },
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
  if(actor!=='manager'&&actor!=='ai'&&actor!=='system')
    return worldActionError('invalid_actor','지원하지 않는 작업 주체입니다');
  const handler=WORLD_ACTION_HANDLERS[command.type];
  if(!handler)return worldActionError('unknown_action','지원하지 않는 작업입니다');
  return handler.validate(db,{...command,actor});
}

// Every handler canonicalizes the intent, renders a read-only preview and checks a
// current source-state snapshot before any mutation. Keep persisted DBs preview-free.
function previewWorldAction(db,command){
  const checked=validateWorldAction(db,command);
  if(!checked.ok)return checked;
  const actor=command.actor||'manager',handler=WORLD_ACTION_HANDLERS[command.type];
  const intent=handler.canonical
    ?handler.canonical(db,{...command,actor},checked)
    :{type:command.type,actor,parentId:checked.parentId,assignments:{...checked.assignments}};
  const changes=handler.changes
    ?handler.changes(db,intent,checked)
    :checked.moves.map(m=>({...m}));
  const result={ok:true,type:command.type,command:intent,
    expected:handler.snapshot(db,handler.canonical?intent:checked.parentId),
    changes};
  if(checked.counts)result.counts={...checked.counts};
  if(checked.total!==undefined)result.total=checked.total;
  return result;
}

function applyWorldAction(db,preview){
  if(!db||!preview||preview.ok!==true||!preview.command||!preview.expected)
    return worldActionError('invalid_preview','먼저 유효한 작업 미리보기를 생성해야 합니다');
  const handler=WORLD_ACTION_HANDLERS[preview.command.type];
  if(!handler)return worldActionError('unknown_action','지원하지 않는 작업입니다');
  const key=handler.canonical?preview.command:preview.command.parentId;
  if(JSON.stringify(handler.snapshot(db,key))!==JSON.stringify(preview.expected))
    return worldActionError('stale_preview','게임 상태가 변경되었습니다. 계획을 다시 확인하세요');
  const fresh=previewWorldAction(db,preview.command);
  if(!fresh.ok)return fresh;
  if(JSON.stringify(fresh.command)!==JSON.stringify(preview.command)||
     JSON.stringify(fresh.changes)!==JSON.stringify(preview.changes))
    return worldActionError('stale_preview','적용할 작업이 미리보기와 다릅니다. 다시 확인하세요');
  // Domain writers are synchronous but may still throw after changing a
  // player's roster, contract or a transfer fee. Undo the affected scope if
  // any writer or post-commit membership check fails.
  let journal=null;
  try{
    journal=captureWorldActionJournal(db,fresh.command);
    const applied=handler.apply(db,fresh.command);
    if(!applied||applied.ok===false)
      throw new Error((applied?.errors||['도메인 작업 적용 실패']).join(' · '));
    const errors=worldActionScopeErrors(db,fresh.command,journal.playerIds);
    if(errors.length)throw new Error(errors.join(' · '));
    return {...applied,ok:true,type:preview.command.type};
  }catch(e){
    if(journal)journal.rollback();
    return worldActionError('apply_failed','작업을 적용하지 못해 변경 사항을 되돌렸습니다: '+(e?.message||String(e)));
  }
}

function commitWorldAction(db,command){
  const preview=previewWorldAction(db,command);
  return preview.ok?applyWorldAction(db,preview):preview;
}
