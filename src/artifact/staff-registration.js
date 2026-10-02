// Competition on-site staff entries are separate from club employment. A
// competition limits them only when its office publishes a policy.
function competitionStaffPolicy(db,s){
  const raw=db.competitions[s?.comp]?.rules?.staffRegistration;
  if(!raw||!Number.isInteger(raw.max)||raw.max<0)return null;
  return {max:raw.max,lockAt:raw.lockAt||s.days[0]?.date||null};
}
function staffRegistrationSeason(db,id){return Object.values(db.world?.seasons||{}).find(s=>s.id===id||s.key===id)||null}
function competitionStaffEntry(db,s,tid){return s.staffEntries?.[tid]||[]}
function staffRegistrationOpen(db,s){const p=competitionStaffPolicy(db,s);return !!p&&!!p.lockAt&&(db.worldDate||'')<p.lockAt}
function staffRegistrationErrors(db,s,t,staffIds){
  const p=competitionStaffPolicy(db,s),errors=[];
  if(!p)return ['이 대회는 현장 스태프 등록 정책을 공표하지 않았습니다'];
  if(!Array.isArray(staffIds)||new Set(staffIds).size!==staffIds.length)errors.push('중복 없는 스태프 명단이 필요합니다');
  if(staffIds.length>p.max)errors.push('현장 등록 인원은 최대 '+p.max+'명입니다');
  const ids=new Set((t.staffRoster||[]).map(x=>x.id));
  if((staffIds||[]).some(id=>!ids.has(id)))errors.push('현재 구단이 고용한 스태프만 등록할 수 있습니다');
  return errors;
}
function staffRegistrationSnapshot(db,c){
  const s=staffRegistrationSeason(db,c.seasonId);return {date:db.worldDate,seasonId:c.seasonId,
    entries:s?.staffEntries?JSON.parse(JSON.stringify(s.staffEntries)):null,
    roster:(db.teams[c.teamId]?.staffRoster||[]).map(x=>[x.id,x.contract?.until||null])};
}
WORLD_ACTION_HANDLERS['competition.staff-register']={
  validate(db,a){
    const s=staffRegistrationSeason(db,a.seasonId),t=db.teams[a.teamId];
    if(!s||!t||!db.competitions[s.comp]?.teams.includes(t.id))return worldActionError('missing_competition','대회 또는 참가 구단을 찾을 수 없습니다');
    if(a.actor==='system'||a.actor==='manager'&&!managerControlsSquad(db,t)||a.actor==='ai'&&managerControlsSquad(db,t))return worldActionError('unauthorized','현장 등록 권한이 없습니다');
    if(!staffRegistrationOpen(db,s))return worldActionError('staff_registration_closed','현장 등록 마감 이후에는 변경할 수 없습니다');
    const errors=staffRegistrationErrors(db,s,t,a.staffIds||[]);return errors.length?{ok:false,reason:'invalid_staff_registration',errors}:{ok:true,seasonId:s.id,teamId:t.id,staffIds:a.staffIds.slice()};
  },
  canonical(db,a,v){return {type:a.type,actor:a.actor,seasonId:v.seasonId,teamId:v.teamId,staffIds:v.staffIds.slice()}},
  snapshot:staffRegistrationSnapshot,
  changes(db,c){return [{kind:'competition_staff_registration',seasonId:c.seasonId,teamId:c.teamId,staffIds:c.staffIds.slice()}]},
  apply(db,c){const s=staffRegistrationSeason(db,c.seasonId);s.staffEntries={...(s.staffEntries||{}),[c.teamId]:c.staffIds.slice()};return {staffIds:c.staffIds.slice()}}
};
function initializeCompetitionStaffRegistrations(db,s){
  const p=competitionStaffPolicy(db,s);if(!p)return;s.staffEntries=s.staffEntries||{};
  for(const tid of db.competitions[s.comp].teams){const t=db.teams[tid];if(!t||managerControlsSquad(db,t))continue;
    s.staffEntries[tid]=(t.staffRoster||[]).slice().sort((a,b)=>staffObservation(db,t,b).estimate-staffObservation(db,t,a).estimate).slice(0,p.max).map(x=>x.id);
  }
}
function validateStoredStaffRegistrations(db){for(const s of Object.values(db.world?.seasons||{})){const p=competitionStaffPolicy(db,s);if(!p)continue;for(const [tid,ids] of Object.entries(s.staffEntries||{})){const t=db.teams[tid];if(!t||staffRegistrationErrors(db,s,t,ids).length)throw Error('대회 현장 스태프 등록 저장 데이터가 손상되었습니다')}}}
