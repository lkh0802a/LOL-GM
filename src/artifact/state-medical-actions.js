// 기존 회복 계획 필드의 수동 선택을 명령 경계에 둔다. 치료/소비 규칙은 medical.js가 유지한다.
function validateManualMedicalPlan(db,c){
 const p=db.players[c.pid],t=p&&db.teams[p.team],w=db.world;
 if(c.actor!=='manager'||!w||w.manage!=='manual'||w.fired||['pick','initial_roster'].includes(w.phase)||w.pendingOfficial?.queue?.length||!p||p.retired||!t||t.active===false||!t.roster?.includes(p.id)||!managerControlsSquad(db,t))return worldActionError('unauthorized','현재 관리 선수의 회복 계획을 직접 변경할 권한이 없습니다');
 if(typeof c.mode!=='string'||!Object.hasOwn(MEDICAL_PLAN_LABELS,c.mode))return worldActionError('invalid_medical_plan','기존 회복 계획 중 하나를 선택하세요');
 if((p.medicalPlan||'auto')===c.mode)return worldActionError('unchanged_medical_plan','현재 저장된 회복 계획과 같습니다');
 return {ok:true};
}
WORLD_ACTION_HANDLERS['medical.plan']={
 validate:validateManualMedicalPlan,
 canonical(db,c){return {type:c.type,actor:c.actor,pid:c.pid,mode:c.mode}},
 snapshot(db,c){const p=db.players[c.pid];return JSON.parse(JSON.stringify({date:db.worldDate,year:db.year,manager:db.manager,phase:db.world.phase,manage:db.world.manage,fired:db.world.fired,pending:db.world.pendingOfficial,player:p,team:db.teams[p.team]}));},
 changes(db,c){return [{pid:c.pid,from:db.players[c.pid].medicalPlan||'auto',to:c.mode}]},
 apply(db,c){writeMedicalPlan(db.players[c.pid],c.mode);return {ok:true,msg:'회복 계획을 '+MEDICAL_PLAN_LABELS[c.mode]+'으로 저장했습니다'};}
};
const manualMedicalPlanJournalBefore=captureWorldActionJournal;
captureWorldActionJournal=function(db,c){
 if(c.type!=='medical.plan')return manualMedicalPlanJournalBefore(db,c);
 const p=db.players[c.pid],present=Object.hasOwn(p,'medicalPlan'),value=p.medicalPlan;
 return {playerIds:new Set([c.pid]),rollback(){if(present)p.medicalPlan=value;else delete p.medicalPlan;}};
};
