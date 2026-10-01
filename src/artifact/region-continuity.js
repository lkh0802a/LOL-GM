// Office-directed reorganization preserves the legal club and employment
// organization. A reserve cannot become an independent first team by relocation.
function moveClubForRegionReorganization(db,t,destination,reason){
  if(!t||t.active===false||!db.regions[destination])throw Error('지역 개편 대상이 올바르지 않습니다');
  const clubs=[t,...activeTeams(db).filter(a=>a.parent===t.id)],from=t.region;
  if(from===destination)return [];
  const records=[];
  for(const club of clubs){
    const previous=club.region;
    for(const pid of [...(club.roster||[]),...loanOutgoingPlayers(db,club).map(p=>p.id)]){
      const p=db.players[pid];if(!p||!p.contract||!isLocalPlayer(p,previous,club.id))continue;
      ensurePlayerEligibility(p);
      const rows=p.localEligibility.legacyContracts=p.localEligibility.legacyContracts||[];
      if(!rows.some(q=>q.region===destination&&q.signed===p.contract.signed&&q.until===p.contract.until&&q.teams.includes(club.id)))
        rows.push({region:destination,teams:clubs.map(x=>x.id),signed:p.contract.signed,until:p.contract.until,source:previous});
    }
    club.region=destination;
    if(club.parent)club.division=2;
    if((club.division||1)===2)db.regions[destination].div2=true;
    const record={year:db.year,date:db.worldDate,clubId:club.id,continuity:'same-club',
      from:previous,to:destination,division:club.division||1,parent:club.parent||null,reason};
    club.regionHistory=[...(club.regionHistory||[]),record];records.push(record);
  }
  return records;
}
function recordRegionSuccession(db,source,successors,reason,retired=false){
  const region=db.regions[source],ids=Array.from(new Set(successors));
  if(!region||!ids.length||ids.some(id=>!db.regions[id]))throw Error('후속 지역이 올바르지 않습니다');
  db.global=db.global||{};
  const record={year:db.year,date:db.worldDate,source,successors:ids,reason,retired,
    previousName:region.name,previousLeagueName:region.leagueName};
  db.global.regionHistory=[...(db.global.regionHistory||[]),record];
  for(const id of ids)if(id!==source)db.regions[id].predecessors=Array.from(new Set([...(db.regions[id].predecessors||[]),source]));
  const season=localChoiceSeason(db);
  for(const p of Object.values(db.players)){
    if(p.retired)continue;ensurePlayerEligibility(p);const e=p.localEligibility;
    const service=e.service,successor=p.team&&db.teams[p.team]?.region;
    if(service?.region===source&&successor!==source&&ids.includes(successor))service.region=successor;
    else if(retired&&ids.length===1&&service?.region===source)service.region=ids[0];
    const origin=(e.successorOrigin||p.originLocalRegion)===source,earned=e.qualifications[source];
    if(!origin&&playerActiveLocalRegion(p)!==source&&(!earned||earned.expiresAfter<season))continue;
    for(const id of ids)if(id!==source&&(!e.qualifications[id]||origin))e.qualifications[id]={
      ...(e.qualifications[id]||{}),
      successorOf:source,successorRoot:earned?.successorRoot||source,
      originSuccessor:origin||!!earned?.originSuccessor,earnedYear:db.year,availableFrom:season,
      expiresAfter:origin?9999:Math.max(season,earned?.expiresAfter??season+localServicePolicy(db,source).choiceYears)};
  }
  return record;
}
