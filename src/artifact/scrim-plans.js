// Future bookings reserve both clubs. The calendar rechecks health and fixtures
// before spending practice time; a reservation is never a free practice grant.
function scrimPlans(db){return db.world?.scrimPlans||[]}
function scrimPlanCheck(db,a){
  const t=db.teams[a.teamId],o=db.teams[a.opponentId];
  if(!db.world||db.world.phase!=='season'||!t||!o||t.id===o.id)
    return worldActionError('invalid_team','시즌 중 다른 구단에 요청하세요');
  if(a.actor==='manager'&&!managerControlsSquad(db,t)||a.actor==='ai'&&managerControlsSquad(db,t))
    return worldActionError('unauthorized','관리 구단의 연습만 결정할 수 있습니다');
  if(a.actor==='ai'&&managerControlsSquad(db,o))
    return worldActionError('manager_consent','관리 구단의 예약은 감독이 직접 요청해야 합니다');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(a.date||'')||!Number.isFinite(Date.parse(a.date+'T00:00:00Z'))||new Date(a.date+'T00:00:00Z').toISOString().slice(0,10)!==a.date||a.date<addDays(db.worldDate,1)||a.date>addDays(db.worldDate,7)||
    !['afternoon','evening'].includes(a.slot)||!Number.isInteger(a.games)||a.games<1||a.games>3)
    return worldActionError('invalid_schedule','내일부터 7일 이내, 오후/저녁 1~3세트를 선택하세요');
  const pair=[t.id,o.id].sort().join('|'),id=pair+'|'+a.date+'|'+a.slot;
  // Changing sets, reversing clubs or cancelling must not reroll consent.
  if(scrimPlans(db).some(p=>p.id===id))return worldActionError('duplicate','이미 요청한 상대·시간입니다');
  const future={...db,worldDate:a.date},booked=officialBookedTeams(future),
    offer=scrimPartnerAssessment(future,t,o),overlap=scrimTimeOverlap(future,t,o,a.date,a.slot);
  if(!offer.allowed)return worldActionError('partner_unavailable',offer.reason);
  if(!overlap||a.games>scrimOverlapGames(overlap))return worldActionError('no_overlap','양팀 연습 시간이 겹치지 않습니다');
  for(const club of [t,o]){
    const ready=scrimReadiness(future,club,booked),reservations=scrimPlans(db).filter(p=>p.status==='accepted'&&p.date===a.date&&(p.teamId===club.id||p.opponentId===club.id));
    if(!ready.ok||!ready.availableSlots.includes(a.slot)||reservations.some(p=>p.slot===a.slot)||
      reservations.reduce((n,p)=>n+p.games,0)+a.games>ready.remaining)
      return worldActionError('busy','공식전·회복·다른 연습 일정과 충돌합니다');
  }
  const secrecy=offer.rivalDays>7&&offer.rivalDays<=14?.68:1,
    accepted=new RNG(db.world.seed+'|'+id,'manual-scrim-consent').chance(offer.right.approval*secrecy);
  return {ok:true,id,accepted,reason:accepted?offer.right.reason:'상대 구단이 훈련 목적·전력 차이를 고려해 거절했습니다',startsAt:overlap.startsAt,endsAt:overlap.endsAt};
}
function scrimPlanSnapshot(db,c){
  const teams=[c.teamId,c.opponentId].map(id=>db.teams[id]),future={...db,worldDate:c.date};
  return {date:db.worldDate,phase:db.world?.phase,manager:managedTeamId(db),
    plans:scrimPlans(db).map(p=>({...p})),
    readiness:teams.map(t=>t?{id:t.id,roster:t.roster.slice(),ready:scrimReadiness(future,t)}:null),
    offer:teams.every(Boolean)?scrimPartnerAssessment(future,...teams):null};
}
WORLD_ACTION_HANDLERS['scrim.request']={
  validate:scrimPlanCheck,
  canonical(db,a){return {type:a.type,actor:a.actor,teamId:a.teamId,opponentId:a.opponentId,date:a.date,slot:a.slot,games:a.games}},
  snapshot:scrimPlanSnapshot,
  changes(db,c,v){return [{id:v.id,status:v.accepted?'accepted':'declined',reason:v.reason,startsAt:v.startsAt,endsAt:v.endsAt}]},
  apply(db,c){const v=scrimPlanCheck(db,c);if(!v.ok)return v;
    db.world.scrimPlans=[...scrimPlans(db),{...c,id:v.id,status:v.accepted?'accepted':'declined',reason:v.reason,requestedOn:db.worldDate}];
    return {ok:true,accepted:v.accepted,reason:v.reason};}
};
WORLD_ACTION_HANDLERS['scrim.cancel']={
  validate(db,a){const p=scrimPlans(db).find(p=>p.id===a.id);
    if(!p||p.status!=='accepted'||p.date<=db.worldDate)return worldActionError('not_pending','취소할 예정 스크림이 없습니다');
    if(a.actor==='manager'&&!managerControlsSquad(db,p.teamId)&&!managerControlsSquad(db,p.opponentId))return worldActionError('unauthorized','내 구단 일정만 취소할 수 있습니다');
    if(a.actor==='ai'&&(managerControlsSquad(db,p.teamId)||managerControlsSquad(db,p.opponentId)))return worldActionError('unauthorized','관리 구단 일정을 AI가 취소할 수 없습니다');
    return {ok:true};},
  canonical(db,a){return {type:a.type,actor:a.actor,id:a.id}},
  snapshot(db){return {date:db.worldDate,manager:managedTeamId(db),plans:scrimPlans(db).map(p=>({...p}))}},
  changes(db,c){return [{id:c.id,status:'cancelled'}]},
  apply(db,c){db.world.scrimPlans=scrimPlans(db).map(p=>p.id===c.id?{...p,status:'cancelled',reason:'구단이 연습을 취소했습니다'}:p);return {ok:true};}
};
function captureScrimPlanJournal(db){
  const present=Object.hasOwn(db.world,'scrimPlans'),ref=db.world.scrimPlans;
  return {playerIds:[],rollback(){if(present)db.world.scrimPlans=ref;else delete db.world.scrimPlans}};
}
function runScheduledScrims(db){
  const booked=officialBookedTeams(db);
  for(const p of scrimPlans(db).filter(p=>p.status==='accepted'&&p.date<=db.worldDate).sort((a,b)=>a.date.localeCompare(b.date)||a.slot.localeCompare(b.slot)||a.id.localeCompare(b.id))){
    const t=db.teams[p.teamId],o=db.teams[p.opponentId],rec=p.date===db.worldDate&&t&&o?
      simulateBackgroundScrim(db,t,o,p.games,new RNG(db.world.seed+'|'+p.id,'booked-scrim'),p.slot,booked):null;
    p.status=rec?'completed':'blocked';p.playedGames=rec?.games.length||0;
    p.reason=rec?'예정 스크림 완료':'공식전·회복·구단 이동 등으로 연습 불가';
  }
  // Preserve upcoming reservations and recent responses, never season-sized logs.
  const plans=scrimPlans(db);
  db.world.scrimPlans=[...plans.filter(p=>p.date<db.worldDate&&p.status!=='accepted'&&p.date>=addDays(db.worldDate,-14)).slice(-128),...plans.filter(p=>p.date>=db.worldDate||p.status==='accepted')];
}
