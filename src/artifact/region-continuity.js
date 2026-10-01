// Office-directed reorganization preserves the legal club and employment
// organization. A reserve cannot become an independent first team by relocation.
function moveClubForRegionReorganization(db,t,destination,reason){
  if(!t||t.active===false||!db.regions[destination])throw Error('지역 개편 대상이 올바르지 않습니다');
  const clubs=[t,...activeTeams(db).filter(a=>a.parent===t.id)],from=t.region;
  if(from===destination)return [];
  const records=[];
  for(const club of clubs){
    const previous=club.region;
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
  return record;
}
