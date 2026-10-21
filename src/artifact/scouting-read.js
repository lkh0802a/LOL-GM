// Ephemeral query/preview copies. Existing scouting, registration and finance
// writers still own policy; unrelated match archives and foreign dossiers are
// shared only with their existing read consumers, never copied or written here.
function queryViewFields(view,fields){
  // Assignment cannot shadow an inherited read-only property/getter. Define
  // the copies on the new view, including when the source is frozen.
  for(const [key,value] of Object.entries(fields))Object.defineProperty(view,key,{value,writable:true,enumerable:true,configurable:true});
  return view;
}
function ownedQueryView(db){
  const read=queryViewFields(Object.create(db),{teams:{...db.teams},players:{...db.players},_marketDemandCache:{...(db._marketDemandCache||{})}}),owned=Object.values(db.teams).filter(t=>!db.world?.fired&&managerControlsSquad(db,t)),ids=new Set(owned.map(t=>t.id));
  for(const t of owned)read.teams[t.id]=JSON.parse(JSON.stringify(t));
  // Registration/lineup readers may normalize an owned player's eligibility.
  for(const p of Object.values(db.players))if(ids.has(p.team))read.players[p.id]=JSON.parse(JSON.stringify(p));
  return read;
}
function scoutingReadView(db){
  const read=ownedQueryView(db);
  if(db.world?.fired){
    // Match ensureScoutReport's existing revocation without touching the
    // former employer's stored records, or even reading its dossier getters.
    queryViewFields(read,{scout:{},world:queryViewFields(Object.create(db.world),{recruitment:{targets:{}},negotiations:{}})});
  }else{
    queryViewFields(read,{scout:JSON.parse(JSON.stringify(db.scout||{})),world:{...db.world,recruitment:JSON.parse(JSON.stringify(db.world?.recruitment||{})),negotiations:JSON.parse(JSON.stringify(db.world?.negotiations||{}))}});
  }
  return read;
}
// Only the real scouting command's writable branches determine whether its
// preview/commit changed state. Pricing caches are derived, not a paid action.
function scoutingEffectStamp(db){
  if(db.world?.fired)return 'null';
  const teams=Object.values(db.teams).filter(t=>managerControlsSquad(db,t));
  return JSON.stringify([db.scout,db.world?.recruitment,db.world?.negotiations,teams]);
}
function scoutingReadStamp(db){
  const w=db.world,fired=!!w?.fired,cw=w?.contractWindow,teams=Object.values(db.teams),owned=teams.filter(t=>!fired&&managerControlsSquad(db,t)),ids=new Set(owned.map(t=>t.id));
  const players=Object.values(db.players);
  return JSON.stringify([
    db.year,db.worldDate,db.manager,db.worldConfig,
    w&&[w.year,w.phase,w.manage,w.fired,w.step,w.lastDate,w.lastDailyTick,
      cw&&[cw.stage,cw.seasonYear,cw.startSeason,cw.seasonEndDate,cw.startDate,cw.exclusiveThrough,cw.contractExpiryDate,cw.outsideContactDate,cw.completed,owned.map(t=>cw.financePayroll?.[t.id])],
      w.pendingOfficial&&[w.pendingOfficial.date,(w.pendingOfficial.queue||[]).map(q=>[q.seasonKey,q.matchId,q.date])],
      fired?null:w.recruitment,fired?null:w.sponsorOffers,fired?[]:Object.values(w.negotiations||{}).filter(n=>ids.has(n.teamId)),
      Object.values(w.seasons||{}).map(s=>[s.id,s.comp,s.year,s.done,s.cur,s.stage,s.champion,s.runnerUp,s.pstats,s.entries])],
    fired?null:db.scout,db.patch&&[db.patch.id,db.patch._revision,db.patch._systemRevision],db.metaGames,
    Object.values(db.regions).map(r=>[r.id,r.name,r.short,r.strength,r.payScale,r.salaryCap,r.salaryFloor,r.spendingRule,r.sfrMode,r.sfrTeamShare,r.luxuryTax,r.importLimit,r.slots,r.metrics]),
    Object.values(db.competitions).map(c=>[c.id,c.name,c.short,c.region,c.div,c.international,c.teams,c.rules,c.stages]),
    db.global?.power,owned,
    players.map(p=>[p.id,p.name,p.retired,p.team,p.role,p.region,p.age,p.reputation,p.contract?.until,p.loan&&[p.loan.ownerId,p.loan.borrowerId,p.loan.endDate]]),
    players.filter(p=>ids.has(p.team)),
    players.filter(p=>p.loan&&ids.has(p.loan.ownerId)&&!ids.has(p.team)).map(p=>[p.id,p.contract,p.loan])
  ]);
}
