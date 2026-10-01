// Eligibility is earned through actual registration, not nationality or guessed
// pre-save history. Each service run snapshots its region's agreed game policy.
function localServicePolicy(db,rid){
  const r=db.regions[rid]?.localServiceRule||{};
  return {seasons:Math.max(1,Math.round(r.seasons??4)),days:Math.max(0,Math.round(r.days??0)),
    choiceYears:Math.max(1,Math.round(r.choiceYears??2)),effectiveYear:r.effectiveYear??db.year};
}
function localServiceRegistration(db,p,t,official=false){
  if(t&&officialRegistrationEnabled(db)&&!official)return;
  ensurePlayerEligibility(p);const e=p.localEligibility,date=db.worldDate||db.year+'-01-01';
  if(e.service){const s=e.service,days=Math.max(0,(Date.parse(date)-Date.parse(s.lastDate))/86400000);
    if(!s.paused&&Number.isFinite(days))s.days+=days;
    if(date>s.lastDate)s.lastDate=date;
  }
  if(!t){if(e.service)e.service.paused=true;return}
  const owner=p.loan&&db.teams[p.loan.ownerId],crossLoan=owner&&owner.region!==t.region,
    region=crossLoan?owner.region:t.region;
  if(!e.service||e.service.region!==region)e.service={region,days:0,seasons:[],
    lastDate:date,paused:false,rule:localServicePolicy(db,region)};
  const s=e.service;if(date>s.lastDate)s.lastDate=date;s.paused=!!crossLoan;
  if(!s.paused&&!s.seasons.includes(db.year))s.seasons.push(db.year);
  checkLocalServiceQualification(db,p);
}
function checkLocalServiceQualification(db,p){
  const e=p.localEligibility,s=e?.service;if(!s||s.paused||s.region===p.originLocalRegion)return;
  if(s.seasons.length>=s.rule.seasons&&s.days>=s.rule.days&&!e.qualifications[s.region])
    e.qualifications[s.region]={earnedYear:db.year,availableFrom:db.year+1,
      expiresAfter:db.year+s.rule.choiceYears,rule:{...s.rule}};
}
function processLocalServiceDaily(db){
  const date=db.worldDate;if(!date)return;
  const registered=officialRegistrationEnabled(db)?new Map(activeTeams(db).flatMap(t=>(t.registration?.players||[])
    .filter(id=>officialPlayerCanRepresent(db,db.players[id],t)).map(id=>[id,t]))):null;
  for(const p of Object.values(db.players)){
    if(p.retired)continue;
    const t=registered?registered.get(p.id):p.team&&db.teams[p.team],e=p.localEligibility;
    if(!e?.service){if(t)localServiceRegistration(db,p,t,true);continue}
    const s=e.service,owner=p.loan&&db.teams[p.loan.ownerId],paused=!t||!!(owner&&owner.region!==t.region);
    const elapsed=Math.max(0,(Date.parse(date+'T00:00:00Z')-Date.parse(s.lastDate+'T00:00:00Z'))/86400000);
    if(!paused&&!s.paused&&Number.isFinite(elapsed))s.days+=elapsed;
    if(date>s.lastDate)s.lastDate=date;s.paused=paused;
    if(!paused&&!s.seasons.includes(db.year))s.seasons.push(db.year);
    checkLocalServiceQualification(db,p);
  }
}
function localChoiceSeason(db){return db.world?.phase==='offseason'?contractedMoveSeason(db)+1:db.year}
function projectedPlayerLocal(db,p){
  const pending=p.localEligibility?.pending;
  return ['offseason','market'].includes(db.world?.phase)&&pending?.season===localChoiceSeason(db)
    ?pending.region:playerActiveLocalRegion(p);
}
function projectedPlayerIsLocal(db,p,t){return !!p&&!!t&&
  (projectedPlayerLocal(db,p)===t.region||legacyLocalForClub(p,t.region,t.id))}
function localChoiceOptions(db,p){
  const season=localChoiceSeason(db),e=p.localEligibility||{},options=[e.successorOrigin||p.originLocalRegion||playerActiveLocalRegion(p)];
  for(const [rid,q] of Object.entries(e.qualifications||{}))
    if(q?.availableFrom<=season&&q.expiresAfter>=season)options.push(rid);
  return Array.from(new Set(options)).filter(rid=>db.regions[rid]&&
    (rid!==playerActiveLocalRegion(p)||e.qualifications[rid]?.originSuccessor&&e.successorOrigin!==rid));
}
function validateStoredLocalService(db){
  for(const p of Object.values(db.players)){
    const e=p.localEligibility,s=e?.service,q=e?.pending;
    if(e?.legacyContracts&&(!Array.isArray(e.legacyContracts)||e.legacyContracts.some(row=>
      !row||typeof row.region!=='string'||!Array.isArray(row.teams)||row.teams.some(id=>typeof id!=='string')||
      !Number.isInteger(row.until)||(row.signed!==undefined&&!Number.isInteger(row.signed)))))
      throw Error('지역 개편 계약 로컬 보호 데이터가 손상되었습니다');
    if(s&&(!Number.isFinite(s.days)||s.days<0||!Array.isArray(s.seasons)||
      s.seasons.some(y=>!Number.isInteger(y))||!s.rule||!Number.isInteger(s.rule.seasons)||s.rule.seasons<1||
      !Number.isInteger(s.rule.days)||s.rule.days<0||!Number.isInteger(s.rule.choiceYears)||s.rule.choiceYears<1||
      typeof s.region!=='string'||typeof s.paused!=='boolean'||typeof s.lastDate!=='string'||!Number.isFinite(Date.parse(s.lastDate))))
      throw Error('로컬 근속 저장 데이터가 손상되었습니다');
    if(q&&(typeof q.region!=='string'||!Number.isInteger(q.season)))throw Error('다음 시즌 로컬 선택이 손상되었습니다');
  }
}
WORLD_ACTION_HANDLERS['player.local-choice']={
  validate(db,a){
    const p=db.players[a.pid],t=p?.team&&playerActionTeam(db,p.team);
    if(!p||p.retired||!['offseason','market'].includes(db.world?.phase)||
      !localChoiceOptions(db,p).includes(a.region))
      return worldActionError('invalid_local_choice','오프시즌에 유효한 다음 시즌 로컬을 선택해야 합니다');
    if(a.actor==='system')return worldActionError('unauthorized','시스템이 로컬 선택을 강제할 수 없습니다');
    if(t){const auth=playerActionAuthority(db,a.actor,t);if(auth)return auth}
    else if(a.actor!=='ai')return worldActionError('unauthorized','무소속 선수의 결정은 선수가 직접 합니다');
    const qualification=p.localEligibility?.qualifications?.[a.region],successor=qualification?.successorOf,
      willing=successor&&[successor,qualification.successorRoot].some(source=>
        [p.localEligibility?.successorOrigin||p.originLocalRegion,playerActiveLocalRegion(p)].includes(source))||
      t?.region===a.region||a.region===(p.localEligibility?.successorOrigin||p.originLocalRegion)&&
      (p.careerGoal==='stability'||(p.personality?.ambition??50)<50);
    if(!willing)return worldActionError('player_consent','선수가 현재 커리어와 맞지 않는 로컬 전환을 거절했습니다');
    if(t&&a.region!==t.region){
      const count=t.roster.filter(id=>id!==p.id&&!projectedPlayerIsLocal(db,db.players[id],t)).length+
        loanOutgoingPlayers(db,t).filter(x=>!projectedPlayerIsLocal(db,x,t)).length;
      if(count>=nonLocalLimitForTeam(db,t))return worldActionError('registration_limit','다음 시즌 비로컬 자리를 확보해야 합니다');
    }
    return {ok:true,pid:p.id,teamId:p.team||null,region:a.region,season:localChoiceSeason(db)};
  },
  canonical(db,a,v){const {ok,...c}=v;return {type:a.type,actor:a.actor,...c}},
  snapshot(db,c){const p=db.players[c.pid];return JSON.parse(JSON.stringify({base:playerActionSnapshot(db,c),
    eligibility:p.localEligibility,phase:db.world?.phase,personality:p.personality,goal:p.careerGoal,
    otherChoices:(db.teams[c.teamId]?.roster||[]).map(id=>db.players[id]?.localEligibility?.pending)}))},
  changes(db,c){return [{pid:c.pid,kind:'local_choice',region:c.region,season:c.season}]},
  apply(db,c){db.players[c.pid].localEligibility.pending={region:c.region,season:c.season};return {pid:c.pid}}};
function activateLocalChoices(db,year){
  for(const p of Object.values(db.players)){
    const e=p.localEligibility,q=e?.pending;if(!q||q.season>year)continue;
    const previous=playerActiveLocalRegion(p);
    const qualification=e.qualifications[q.region];
    if(qualification?.successorOf){
      const source=qualification.successorOf;
      if(qualification.originSuccessor||source===(e.successorOrigin||p.originLocalRegion))e.successorOrigin=q.region;
      for(const [rid,entry] of Object.entries(e.qualifications))if(entry.successorOf===source||
        qualification.successorRoot&&entry.successorRoot===qualification.successorRoot)delete e.qualifications[rid];
      e.successorChoices=[...(e.successorChoices||[]),{year,source,region:q.region}];
    }
    if(previous!==p.originLocalRegion)delete e.qualifications[previous];
    p.activeLocalRegion=q.region;e.active=q.region;delete e.pending;
    if(e.service&&e.service.region===previous&&previous!==q.region){
      e.service.days=0;e.service.seasons=[];e.service.lastDate=db.worldDate;
    }
    recordPlayerEvent(p,'local_choice',year,{from:previous,to:q.region,date:db.worldDate});
  }
}
function aiChooseLocalEligibility(db){
  for(const p of Object.values(db.players)){
    const t=p.team&&db.teams[p.team];if(p.retired||t&&playerActionAuthority(db,'ai',t))continue;
    if(!t){const options=localChoiceOptions(db,p).filter(rid=>p.localEligibility?.qualifications[rid]?.successorOf);
      if(options.length&&p.localEligibility?.pending?.region!==options[0])commitWorldAction(db,{type:'player.local-choice',actor:'ai',pid:p.id,region:options[0]});continue;}
    if(p.localEligibility?.pending?.region===t.region&&p.localEligibility.pending.season===localChoiceSeason(db))continue;
    if(localChoiceOptions(db,p).includes(t.region))commitWorldAction(db,{type:'player.local-choice',actor:'ai',pid:p.id,region:t.region});
  }
}
