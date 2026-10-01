function clubLicenseState(db,t){
  const R=db.regions[t.region],parent=t.parent&&db.teams[t.parent];
  const owner=ensureClubOwnership(parent||t);
  const division=t.division||1,status=t.active===false?'returned':'approved';
  const kind=t.parent?'reserve':division===2?'open':R?.system==='franchise'?'franchise':
    R?.system==='mixed'&&t.franchised?'certified':'open';
  return {region:t.region,division,parent:t.parent||null,kind,status,holder:owner.id};
}
function ensureClubLicense(db,t){
  if(!t.competitionLicense)t.competitionLicense={id:t.id+':license',clubId:t.id,
    current:clubLicenseState(db,t),history:[]};
  return t.competitionLicense;
}
function syncClubLicense(db,t,reason){
  const previous=ensureClubLicense(db,t),current=clubLicenseState(db,t);
  t.license=current.kind;
  if(JSON.stringify(previous.current)===JSON.stringify(current))return previous;
  const event={year:db.year,date:db.worldDate,reason,previous:previous.current,current};
  // Replace the record so action rollback can restore its untouched predecessor.
  t.competitionLicense={...previous,current,history:[...previous.history,event]};
  return t.competitionLicense;
}
function syncCompetitionLicenses(db,reason){
  for(const t of Object.values(db.teams))syncClubLicense(db,t,reason);
}
