// Competition on-site staff entries are separate from club employment. A
// competition limits them only when its office publishes a policy.
function competitionStaffPolicy(db,s){
  const raw=s?.staffRegistrationPolicy||db.competitions[s?.comp]?.rules?.staffRegistration;
  if(!raw||!Number.isInteger(raw.max)||raw.max<0)return null;
  return {max:raw.max,lockAt:raw.lockAt||s.days[0]?.date||null};
}
function staffRegistrationSeason(db,id){return Object.values(db.world?.seasons||{}).find(s=>s.id===id||s.key===id)||null}
function competitionStaffEntry(db,s,tid){return s.staffEntries?.[tid]||[]}
function staffRegistrationOpen(db,s){const p=competitionStaffPolicy(db,s);return !!p&&!s.done&&!!p.lockAt&&(db.worldDate||'')<p.lockAt}
function staffRegistrationErrors(db,s,t,staffIds){
  const p=competitionStaffPolicy(db,s),errors=[];
  if(!p)return ['이 대회는 현장 스태프 등록 정책을 공표하지 않았습니다'];
  if(!Array.isArray(staffIds)||staffIds.some(id=>typeof id!=='string')||new Set(staffIds).size!==staffIds.length)return ['중복 없는 스태프 명단이 필요합니다'];
  if(staffIds.length>p.max)errors.push('현장 등록 인원은 최대 '+p.max+'명입니다');
  const ids=new Set((t.staffRoster||[]).filter(x=>!x.retired&&x.contract?.until>=db.year).map(x=>x.id));
  if(staffIds.some(id=>!ids.has(id)))errors.push('현재 구단이 고용한 스태프만 등록할 수 있습니다');
  return errors;
}
function staffRegistrationSnapshot(db,c){
  const s=staffRegistrationSeason(db,c.seasonId);return {date:db.worldDate,seasonId:c.seasonId,
    done:s?.done,policy:competitionStaffPolicy(db,s),participants:db.competitions[s?.comp]?.teams,
    entries:s?.staffEntries?JSON.parse(JSON.stringify(s.staffEntries)):null,
    roster:(db.teams[c.teamId]?.staffRoster||[]).map(x=>[x.id,x.contract?.until||null,x.retired||false,x.name,x.role,
      ...(c.actor==='ai'?[competitionStaffObservedContributions(db,db.teams[c.teamId],x)]:[])]),
    active:db.teams[c.teamId]?.active,manager:managedTeamId(db)};
}
WORLD_ACTION_HANDLERS['competition.staff-register']={
  validate(db,a){
    const s=staffRegistrationSeason(db,a.seasonId),t=db.teams[a.teamId];
    if(!s||!t||t.active===false||!db.competitions[s.comp]?.teams.includes(t.id))return worldActionError('missing_competition','대회 또는 참가 구단을 찾을 수 없습니다');
    if(a.actor==='system'||a.actor==='manager'&&!managerControlsSquad(db,t)||a.actor==='ai'&&managerControlsSquad(db,t))return worldActionError('unauthorized','현장 등록 권한이 없습니다');
    if(!staffRegistrationOpen(db,s))return worldActionError('staff_registration_closed','현장 등록 마감 이후에는 변경할 수 없습니다');
    const errors=staffRegistrationErrors(db,s,t,a.staffIds);return errors.length?{ok:false,reason:'invalid_staff_registration',errors}:{ok:true,seasonId:s.id,teamId:t.id,staffIds:a.staffIds.slice()};
  },
  canonical(db,a,v){return {type:a.type,actor:a.actor,seasonId:v.seasonId,teamId:v.teamId,staffIds:v.staffIds.slice()}},
  snapshot:staffRegistrationSnapshot,
  changes(db,c){return [{kind:'competition_staff_registration',seasonId:c.seasonId,teamId:c.teamId,staffIds:c.staffIds.slice()}]},
  apply(db,c){const s=staffRegistrationSeason(db,c.seasonId),t=db.teams[c.teamId];s.staffEntries={...(s.staffEntries||{}),[c.teamId]:c.staffIds.slice()};
    s.staffEntryRecords={...(s.staffEntryRecords||{}),[c.teamId]:{date:db.worldDate,source:c.actor,
      staff:c.staffIds.map(id=>{const x=t.staffRoster.find(x=>x.id===id);return {id,name:x.name,role:x.role}})}};
    return {staffIds:c.staffIds.slice()}}
};
function initializeCompetitionStaffRegistrations(db,s){
  const p=competitionStaffPolicy(db,s);if(!p)return;
  s.staffRegistrationPolicy={...p};s.staffEntries=s.staffEntries||{};
}
// Fictional selection policy, not staffing quotas or real-world effect sizes.
// Only contexts used by the official draft/observation view count. Club-only
// training/recovery remain available from the full employment roster.
const COMPETITION_STAFF_COVERAGE_WEIGHTS=[1,1/3,1/3,1/3,.25];
function competitionStaffObservedContributions(db,t,x){
  const secondary=staffSecondaryRoles(x),base=clamp(staffObservation(db,t,x).estimate,0,99)*staffSpecialtyAllocation(x),
    role=r=>x.role===r?base:secondary.includes(r)?base*STAFF_SECONDARY_WEIGHT:0;
  // Secondary field names are public; their hidden numeric ability is not.
  return [role('strategicCoach'),...Object.keys(ANALYSIS_CONTEXTS).map(k=>clamp(role('analyst')*staffAnalysisMultiplier(x,k),0,99)),role('scout')];
}
function competitionStaffCoverageScore(contributions){
  return COMPETITION_STAFF_COVERAGE_WEIGHTS.reduce((n,w,i)=>n+w*staffWeightedValues(contributions.map(xs=>xs[i]).sort((a,b)=>b-a)),0);
}
function aiCompetitionStaffPlan(db,s,t){
  const p=competitionStaffPolicy(db,s);if(!p)return [];
  const candidates=(t.staffRoster||[]).filter(x=>!x.retired&&x.contract?.until>=db.year)
    .map(x=>({id:x.id,values:competitionStaffObservedContributions(db,t,x)})).sort((a,b)=>a.id.localeCompare(b.id)),chosen=[],values=[];
  let score=0;
  while(chosen.length<p.max){
    let best=null,gain=0;
    for(const x of candidates){if(chosen.includes(x.id))continue;const marginal=competitionStaffCoverageScore([...values,x.values])-score;
      if(marginal>gain+1e-8){best=x;gain=marginal}}
    if(!best)break;chosen.push(best.id);values.push(best.values);score+=gain;
  }
  return chosen;
}
function aiReviewCompetitionStaffRegistrations(db){
  for(const s of Object.values(db.world?.seasons||{})){
    if(!staffRegistrationOpen(db,s))continue;
    for(const tid of db.competitions[s.comp].teams){const t=db.teams[tid];if(!t||t.active===false||managerControlsSquad(db,t))continue;
      const staffIds=aiCompetitionStaffPlan(db,s,t);
      if(!Object.hasOwn(s.staffEntries||{},tid)||JSON.stringify(competitionStaffEntry(db,s,tid))!==JSON.stringify(staffIds))
        commitWorldAction(db,{type:'competition.staff-register',actor:'ai',seasonId:s.id,teamId:tid,staffIds});
    }
  }
}
function competitionStaffMatchRoster(db,s,t){
  if(!s||!competitionStaffPolicy(db,s)||!s.staffEntries)return t.staffRoster;
  const selected=new Set(competitionStaffEntry(db,s,t.id));
  return (t.staffRoster||[]).filter(x=>selected.has(x.id)&&!x.retired&&x.contract?.until>=db.year);
}
function validateStoredStaffRegistrations(db){
  for(const s of Object.values(db.world?.seasons||{})){
    const p=competitionStaffPolicy(db,s);if(!p)continue;
    if(!p.lockAt||!/^\d{4}-\d{2}-\d{2}$/.test(p.lockAt)||!Number.isFinite(Date.parse(p.lockAt)))throw Error('대회 현장 스태프 마감 데이터가 손상되었습니다');
    // Submitted IDs are historical evidence. An employee may leave after the
    // lock or after the event; current employment is checked only on submission
    // and when deriving the match roster, never against old saved entries.
    if(s.staffEntries&&(!saveObject(s.staffEntries)))throw Error('대회 현장 스태프 등록 저장 데이터가 손상되었습니다');
    for(const [tid,ids] of Object.entries(s.staffEntries||{}))if(!db.teams[tid]||!Array.isArray(ids)||
      ids.some(id=>typeof id!=='string')||new Set(ids).size!==ids.length||ids.length>p.max)
      throw Error('대회 현장 스태프 등록 저장 데이터가 손상되었습니다');
    if(s.staffEntryRecords){
      if(!saveObject(s.staffEntryRecords))throw Error('대회 현장 스태프 이력이 손상되었습니다');
      for(const [tid,r] of Object.entries(s.staffEntryRecords))if(!r||!Array.isArray(r.staff)||
        JSON.stringify(r.staff.map(x=>x?.id))!==JSON.stringify(s.staffEntries?.[tid])||
        r.staff.some(x=>typeof x.name!=='string'||typeof x.role!=='string'))throw Error('대회 현장 스태프 이력이 손상되었습니다');
    }
  }
}
