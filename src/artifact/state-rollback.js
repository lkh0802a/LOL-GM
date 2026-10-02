// ===== LOL GM: action-scoped rollback journal =====
// Player and squad command writers use in-place game state. Keep an operation-
// scoped undo log so a late writer exception never leaves half a transfer,
// partial fee settlement, or a partly applied 1st/reserve assignment.
// Capture only affected players, rosters and finances rather than cloning the
// entire world, champion database and competition schedules on every signing.

function actionJournalClone(value){return JSON.parse(JSON.stringify(value))}

function actionJournalRestoreObject(target,record){
  for(const key of Object.keys(target))if(!Object.prototype.hasOwnProperty.call(record,key))delete target[key];
  for(const [key,value] of Object.entries(record))target[key]=value;
}

function actionJournalTeamSnapshot(team){
  const hasDepth=Object.prototype.hasOwnProperty.call(team,'depthChart');
  const hasFinance=Object.prototype.hasOwnProperty.call(team,'finance');
  const hasRoster=Object.prototype.hasOwnProperty.call(team,'roster');
  return {
    team,hasDepth,hasFinance,hasRoster,
    lifecycle:['active','folded','license','competitionLicense','officePreferences'].map(key=>({key,
      present:Object.prototype.hasOwnProperty.call(team,key),value:team[key]})),
    rosterRef:team.roster,roster:(team.roster||[]).slice(),
    depthRef:team.depthChart,depth:hasDepth?actionJournalClone(team.depthChart):null,
    financeRef:team.finance,finance:hasFinance?actionJournalClone(team.finance):null,
    registration:team.registration?actionJournalClone(team.registration):null
  };
}

function actionJournalRestoreTeam(entry){
  const {team}=entry;
  if(entry.registration)team.registration=entry.registration;else delete team.registration;
  for(const {key,present,value} of entry.lifecycle)
    if(present)team[key]=value;else delete team[key];
  if(entry.hasRoster){
    if(Array.isArray(entry.rosterRef)){
      entry.rosterRef.splice(0,entry.rosterRef.length,...entry.roster);
      team.roster=entry.rosterRef;
    }else team.roster=actionJournalClone(entry.rosterRef);
  }else delete team.roster;
  for(const [has,ref,record,prop] of [
    [entry.hasDepth,entry.depthRef,entry.depth,'depthChart'],
    [entry.hasFinance,entry.financeRef,entry.finance,'finance']
  ]){
    if(!has)delete team[prop];
    else if(ref&&typeof ref==='object'&&!Array.isArray(ref)){
      actionJournalRestoreObject(ref,record);team[prop]=ref;
    }else team[prop]=actionJournalClone(record);
  }
}

function actionJournalTargets(db,command){
  const playerIds=new Set(),teamIds=new Set();
  if(command.type==='club.close'){
    for(const id of command.financeTeamIds)teamIds.add(id);
    for(const pid of command.playerIds)playerIds.add(pid);
  }else if(command.type==='roster.register'||command.type==='roster.official-lineup'||command.type==='competition.staff-register'){
    teamIds.add(command.teamId);
    for(const id of Object.keys(command.registrations||{}))teamIds.add(id);
    if(command.type==='roster.register')for(const id of Object.keys(command.registrations))
      for(const pid of [...(db.teams[id].registration?.players||[]),...command.registrations[id]])playerIds.add(pid);
  }else if(command.type==='roster.plan'||command.type==='roster.market-callup'){
    for(const team of organizationTeams(db,command.parentId)){
      teamIds.add(team.id);
    }
    for(const [pid,dst] of Object.entries(command.assignments||{})){
      if(db.players[pid]?.team!==dst)playerIds.add(pid);
    }
  }else{
    if(command.pid&&!['finance.transfer-payment','finance.estate-recovery'].includes(command.type))playerIds.add(command.pid);
    for(const id of [command.teamId,command.fromId,db.players[command.pid]?.team])
      if(id)teamIds.add(id);
  }
  // Low-level player assignment also clears any old roster entry, including a
  // stale legacy duplicate. Include every such owner in the undo scope.
  for(const team of Object.values(db.teams||{})){
    if((team.roster||[]).some(pid=>playerIds.has(pid)))teamIds.add(team.id);
  }
  return {playerIds,teamIds};
}

function captureWorldActionJournal(db,command){
  if(command.type.startsWith('scrim.'))return captureScrimPlanJournal(db);
  if(command.type.startsWith('staff.'))return captureStaffActionJournal(db,command);
  const staffJournal=command.type==='club.close'?captureStaffActionJournal(db,command):null;
  const {playerIds,teamIds}=actionJournalTargets(db,command);
  const players=Array.from(playerIds, pid=>{
    const player=db.players[pid];
    return {pid,player,record:actionJournalClone(player)};
  });
  const teams=Array.from(teamIds,id=>actionJournalTeamSnapshot(db.teams[id]));
  const newsRef=db.news,newsRows=Array.isArray(newsRef)?newsRef.slice():null;
  const hasDemand=Object.prototype.hasOwnProperty.call(db,'_marketDemandCache');
  const demandRef=db._marketDemandCache;
  const w=db.world,closure=command.type==='club.close'&&w?{
    firedPresent:Object.prototype.hasOwnProperty.call(w,'fired'),fired:w.fired,
    rows:[...command.negotiationIds.map(id=>[w.negotiations,id]),
      ...command.agreementIds.map(id=>[w.contractAgreements,id])]
      .map(([store,id])=>({store,id,ref:store[id],record:actionJournalClone(store[id])}))
  }:null;
  const entries=(command.type==='roster.register'||command.type==='competition.staff-register'||command.emergencyRegistration||command.kind==='medical_replacement')?Object.values(w?.seasons||{}).map(s=>({s,
    value:s.entries?actionJournalClone(s.entries):null,staffValue:s.staffEntries?actionJournalClone(s.staffEntries):null,
    staffRecords:s.staffEntryRecords?actionJournalClone(s.staffEntryRecords):null})):[];
  return {
    playerIds,
    rollback(){
      if(staffJournal)staffJournal.rollback();
      for(const row of entries){if(row.value)row.s.entries=row.value;else delete row.s.entries;if(row.staffValue)row.s.staffEntries=row.staffValue;else delete row.s.staffEntries;if(row.staffRecords)row.s.staffEntryRecords=row.staffRecords;else delete row.s.staffEntryRecords}
      if(closure){
        if(closure.firedPresent)w.fired=closure.fired;else delete w.fired;
        for(const {store,id,ref,record} of closure.rows){
          actionJournalRestoreObject(ref,record);store[id]=ref;
        }
      }
      for(const entry of teams)actionJournalRestoreTeam(entry);
      for(const {pid,player,record} of players){
        actionJournalRestoreObject(player,record);
        db.players[pid]=player;
      }
      LOAN_INDEX.delete(db);
      if(newsRows){
        newsRef.splice(0,newsRef.length,...newsRows);
        db.news=newsRef;
      }else if(newsRef===undefined)delete db.news;
      else db.news=newsRef;
      if(hasDemand)db._marketDemandCache=demandRef;
      else delete db._marketDemandCache;
    }
  };
}

function worldActionScopeErrors(db,command,playerIds){
  if(command.type.startsWith('staff.'))return staffStateErrors(db);
  const errors=command.type==='club.close'?staffStateErrors(db):[];
  for(const pid of playerIds){
    const p=db.players[pid];
    if(!p){errors.push('선수 정보 누락: '+pid);continue}
    let appearances=0,owner=null;
    for(const team of Object.values(db.teams)){
      const count=(team.roster||[]).filter(id=>id===pid).length;
      if(count){appearances+=count;owner=team.id}
    }
    if(p.team?(appearances!==1||owner!==p.team):(appearances!==0))
      errors.push('로스터 소속 불일치: '+pid);
  }
  return errors;
}
