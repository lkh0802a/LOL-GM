// Employment/training squads remain team.roster. Only these submitted lists
// determine official participation; an internal move does not rewrite them.
function officialRegistrationEnabled(db){return db.world?.registrationVersion===1}
function officialPlayerCanRepresent(db,p,t){
  if(!p||p.retired||!p.contract||!p.team||t?.active===false)return false;
  if(p.loan)return p.loan.borrowerId===t.id&&p.team===t.id;
  const assigned=db.teams[p.team];return !!assigned&&(assigned.parent||assigned.id)===(t.parent||t.id);
}
function officialRosterCap(db,t){return (t.division||1)===1?10:rosterRulesForTeam(db,t).reserveTeamMax}
function initialOfficialRoster(db,t){
  const candidates=t.roster.filter(id=>officialPlayerCanRepresent(db,db.players[id],t)),selected=[],limit=nonLocalLimitForTeam(db,t);
  const preferred=Array.from(new Set([...ROLES.map(r=>t.depthChart?.[r]),...candidates])).filter(id=>candidates.includes(id));
  for(const id of preferred){const p=db.players[id];
    if(selected.length>=officialRosterCap(db,t))break;
    if(!isLocalPlayer(p,t.region)&&selected.filter(x=>!isLocalPlayer(db.players[x],t.region)).length>=limit)continue;
    selected.push(id);
  }
  return selected;
}
function initializeOfficialRegistrations(db){
  if(!officialRegistrationEnabled(db))return;
  for(const t of activeTeams(db))if(t.registration?.year!==db.world.year){
    t.registration={year:db.world.year,players:initialOfficialRoster(db,t),date:db.worldDate,depthChart:{},history:[]};
    for(const id of t.registration.players)localServiceRegistration(db,db.players[id],t,true);
  }
}
function internationalRegistrationSeasons(db,t){
  return Object.values(db.world?.seasons||{}).filter(s=>!s.done&&db.competitions[s.comp]?.international&&
    db.competitions[s.comp].teams.includes(t.id));
}
function internationalRosterLocked(db,t){
  return internationalRegistrationSeasons(db,t).some(s=>db.worldDate>=s.days[0]?.date);
}
function officialRegistrationOpen(db,t){
  if(!officialRegistrationEnabled(db))return true;
  if(db.world.pendingOfficial)return false;
  if(internationalRosterLocked(db,t))return false;
  if(db.world.phase!=='season')return true;
  const R=db.regions[t.region],periods=R.registrationWindows||R.transferWindows||
    [{from:'01-07',through:'01-31'},{from:'07-01',through:'07-14'}],md=db.worldDate.slice(5);
  return periods.some(w=>(!w.phase||w.phase==='season')&&md>=w.from&&md<=w.through);
}
function internalSquadMoveError(db,parent,assignments){
  if(!officialRegistrationEnabled(db))return null;
  const moving=Object.entries(assignments||{}).filter(([pid,dst])=>db.players[pid]?.team!==dst);
  if(!moving.length)return null;
  if(organizationTeams(db,parent).some(t=>internationalRosterLocked(db,t)))return '국제대회 진행 중에는 1군·2군 소속도 고정됩니다';
  if(db.world.pendingOfficial)return '진행 중인 공식 시리즈를 먼저 완료해야 합니다';
  const R=db.regions[parent.region],md=db.worldDate.slice(5),windows=R.internalMoveWindows;
  if(db.world.phase==='season'&&windows&&!windows.some(w=>md>=w.from&&md<=w.through))return '지역의 내부 이동 기간이 닫혔습니다';
  const days=Math.max(0,R.internalMoveWaitDays||0);
  if(moving.some(([pid])=>db.players[pid].lastInternalMoveDate&&
    addDays(db.players[pid].lastInternalMoveDate,days)>db.worldDate))return '내부 이동 후 지역 규정의 대기기간이 남아 있습니다';
  return null;
}
function officialRegistrationErrors(db,t,players,proposed={}){
  const errors=[];
  if(!Array.isArray(players)||players.some(id=>typeof id!=='string'))return ['유효한 등록 명단이 필요합니다'];
  if(new Set(players).size!==players.length)errors.push('같은 선수를 중복 등록할 수 없습니다');
  if(players.length<5||players.length>officialRosterCap(db,t))errors.push('공식 명단은 5~'+officialRosterCap(db,t)+'명이어야 합니다');
  if(players.some(id=>!officialPlayerCanRepresent(db,db.players[id],t)))errors.push('계약 또는 임대 권한이 없는 선수가 포함되었습니다');
  if(players.filter(id=>!isLocalPlayer(db.players[id],t.region)).length>nonLocalLimitForTeam(db,t))errors.push('공식 명단 비로컬 상한을 넘었습니다');
  for(const other of activeTeams(db))if(other.id!==t.id&&
    (proposed[other.id]||other.registration?.players||[]).some(id=>players.includes(id)&&officialPlayerCanRepresent(db,db.players[id],other)))
    errors.push('다른 공식 스쿼드에 등록된 선수는 먼저 등록 해제해야 합니다');
  return errors;
}
function officialRegistrationSnapshot(db,c){
  return JSON.parse(JSON.stringify({date:db.worldDate,phase:db.world.phase,pending:!!db.world.pendingOfficial,
    teams:Object.values(db.teams).map(t=>[t.id,t.active,t.parent,t.registration]),
    players:c.players.map(id=>[id,db.players[id]?.team,db.players[id]?.contract,db.players[id]?.loan,db.players[id]?.medical,playerActiveLocalRegion(db.players[id])]),
    policy:db.regions[db.teams[c.teamId].region],international:internationalRegistrationSeasons(db,db.teams[c.teamId]).map(s=>[s.id,s.done,s.days[0]?.date,s.entries])}));
}
function writeOfficialRegistration(db,t,players,source='manager'){
  const prior=t.registration;
  t.registration={year:db.world.year,players:players.slice(),date:db.worldDate,
    depthChart:Object.fromEntries(ROLES.map(r=>[r,players.includes(prior?.depthChart?.[r])?prior.depthChart[r]:null])),
    history:[...(prior?.history||[]),{date:db.worldDate,source,players:players.slice()}].slice(-8)};
  for(const s of internationalRegistrationSeasons(db,t))if(db.worldDate<s.days[0]?.date&&s.entries)
    s.entries[t.id]=players.slice();
  return t.registration;
}
WORLD_ACTION_HANDLERS['roster.register']={
  validate(db,a){
    const t=db.teams[a.teamId];
    if(!t||t.active===false||!officialRegistrationEnabled(db))return worldActionError('invalid_registration','공식 등록 대상을 찾을 수 없습니다');
    if(a.actor==='system')return worldActionError('unauthorized','일반 등록은 구단의 결정을 통해 제출합니다');
    if(a.actor==='manager'&&!managerControlsSquad(db,t)||a.actor==='ai'&&managerControlsSquad(db,t))
      return worldActionError('unauthorized','관리 권한이 없는 스쿼드입니다');
    if(!officialRegistrationOpen(db,t))return worldActionError('registration_closed','공식 등록 기간이 닫혔습니다');
    const registrations=a.registrations||{[t.id]:a.players},errors=[];
    if(!registrations||typeof registrations!=='object'||Array.isArray(registrations)||!Object.hasOwn(registrations,t.id))
      return worldActionError('invalid_registration','유효한 공식 등록 계획이 필요합니다');
    for(const [id,ids] of Object.entries(registrations)){
      const target=db.teams[id];
      if(!target||parentTeamOf(db,target)?.id!==parentTeamOf(db,t)?.id||
        a.actor==='manager'&&!managerControlsSquad(db,target)||a.actor==='ai'&&managerControlsSquad(db,target))
        return worldActionError('unauthorized','같은 관리 조직의 등록 계획만 제출할 수 있습니다');
      if(!officialRegistrationOpen(db,target))return worldActionError('registration_closed','일부 스쿼드의 등록 기간이 닫혔습니다');
      errors.push(...officialRegistrationErrors(db,target,ids,registrations));
    }
    if(a.lineup){
      const check=validateStartingLineup(db,t,a.lineup,registrations[t.id]);errors.push(...check.errors);
    }
    return errors.length?{ok:false,reason:'invalid_registration',errors}:{ok:true,teamId:t.id,
      players:Array.from(new Set(Object.values(registrations).flat())),registrations:JSON.parse(JSON.stringify(registrations)),lineup:a.lineup||null};
  },
  canonical(db,a,v){return {type:a.type,actor:a.actor,teamId:v.teamId,players:v.players.slice(),
    registrations:v.registrations,lineup:v.lineup}},
  snapshot:officialRegistrationSnapshot,
  changes(db,c){return [{kind:'official_registration',teamId:c.teamId,players:c.players.slice()}]},
  apply(db,c){
    const affected=Array.from(new Set(Object.keys(c.registrations).flatMap(id=>[
      ...(db.teams[id].registration?.players||[]),...c.registrations[id]])));
    for(const [id,players] of Object.entries(c.registrations))writeOfficialRegistration(db,db.teams[id],players,c.actor);
    for(const id of affected){const p=db.players[id],t=activeTeams(db).find(t=>t.registration?.players.includes(id)&&officialPlayerCanRepresent(db,p,t));
      localServiceRegistration(db,p,t||null,true);
    }
    if(c.lineup)db.teams[c.teamId].registration.depthChart={...c.lineup};
    return {registration:db.teams[c.teamId].registration};
  }
};
function aiReviewOfficialRegistrations(db){
  if(!officialRegistrationEnabled(db))return;
  initializeOfficialRegistrations(db);
  for(const t of activeTeams(db).filter(t=>!t.parent)){
    const teams=organizationTeams(db,t).filter(x=>!managerControlsSquad(db,x)&&officialRegistrationOpen(db,x));
    if(!teams.length)continue;
    const registrations=Object.fromEntries(teams.map(x=>[x.id,initialOfficialRoster(db,x)]));
    if(teams.some(x=>JSON.stringify(registrations[x.id])!==JSON.stringify(x.registration.players)))
      commitWorldAction(db,{type:'roster.register',actor:'ai',teamId:teams[0].id,registrations});
  }
}
function validateStoredRegistrations(db){
  if(!officialRegistrationEnabled(db))return;
  const seen=new Map();
  for(const t of Object.values(db.teams))if(t.registration){
    const r=t.registration;
    if(!Number.isInteger(r.year)||!Array.isArray(r.players)||new Set(r.players).size!==r.players.length||
      r.players.length>officialRosterCap(db,t)||r.players.some(id=>typeof id!=='string')||!r.depthChart||!Array.isArray(r.history))
      throw Error('공식 등록 저장 데이터가 손상되었습니다');
    for(const id of r.players)if(officialPlayerCanRepresent(db,db.players[id],t)){
      if(seen.has(id))throw Error('선수가 두 공식 스쿼드에 중복 등록되었습니다');seen.set(id,t.id);
    }
  }
  for(const s of Object.values(db.world.seasons||{}))if(s.entries)
    for(const [tid,ids] of Object.entries(s.entries))if(!db.teams[tid]||!Array.isArray(ids)||
      new Set(ids).size!==ids.length||ids.length>officialRosterCap(db,db.teams[tid])||ids.some(id=>typeof id!=='string'))
      throw Error('국제대회 최종 엔트리 저장 데이터가 손상되었습니다');
}
