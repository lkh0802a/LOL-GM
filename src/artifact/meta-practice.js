// Private, recorded own-squad practice evidence. Never feeds professional meta.
function validPracticePicks(picks){
  return Array.isArray(picks)&&picks.length===5&&new Set(picks.map(p=>p?.player)).size===5&&ROLES.every(r=>picks.filter(p=>p?.role===r).length===1)&&picks.every(p=>typeof p?.player==='string'&&!!p.player&&typeof p.champ==='string'&&!!p.champ);
}
function preparePracticeEvidence(db,rec,lines){
  if(db.world?.fired)return [];
  const prepared=[];
  for(const tid of new Set([rec.a,rec.b])){
    const team=db.teams[tid];if(!managerControlsSquad(db,team)||(team.practiceEvidence!==undefined&&!Array.isArray(team.practiceEvidence)))continue;
    const id=tid+'|practice|'+((team.practiceEvidence||[]).length+1),model=['engine','aggregate'].includes(rec.practiceModel)?rec.practiceModel:null;
    const games=(rec.games||[]).map((g,i)=>{
      const entries=lines.filter(l=>l.tid===tid&&l.practiceGame===i+1),picks=entries.map(l=>({player:l.pid,role:l.role,champ:l.champ}));
      const complete=validPracticePicks(picks);
      return {n:i+1,win:[rec.a,rec.b].includes(g.winner)?g.winner===tid:null,color:g.blue===tid?'BLUE':g.red===tid?'RED':null,picks:complete?picks:null};
    });
    prepared.push({team,entry:{version:1,id,team:tid,observer:managedTeamId(db),region:team.region,opponent:tid===rec.a?rec.b:rec.a,date:rec.date||db.worldDate,patch:rec.patch||null,model,games}});
  }
  return prepared;
}
function practiceRowMatches(row,filter){
  return (!filter.region||row.region===filter.region)&&(!filter.patch||row.patch===filter.patch)&&(!filter.year||+String(row.date).slice(0,4)===+filter.year)&&(!filter.from||row.date>=filter.from)&&(!filter.to||row.date<=filter.to)&&(!filter.opponent||row.opponent===filter.opponent);
}
function practicePickMatches(picks,filter,cid){
  return !(cid||filter.player||filter.position)||(picks||[]).some(p=>{const x=typeof p==='string'?{champ:p}:p;return x&&(!cid||x.champ===cid)&&(!filter.player||x.player===filter.player)&&(!filter.position||x.role===filter.position)});
}
function ownPracticeComparison(db,filter={},cid=null){
  const team=filter.team||managedTeamId(db),out={allowed:false,team,engine:{games:0,wins:0},aggregate:{games:0,wins:0},official:{games:0,wins:0},unknownGames:0,legacyGames:0,officialOnly:!!(filter.comp||filter.season||filter.split||filter.league||filter.scope)};
  if(db.world?.fired||!managerControlsSquad(db,db.teams[team]))return out;
  out.allowed=true;const scoped={...filter,team},club=db.teams[team];
  for(const row of metaRowsFiltered(db,scoped))for(const side of row.sides||[]){
    if(metaSideMatches(row,side,scoped)&&practicePickMatches(side.picks,scoped,cid)){out.official.games++;if(side.win)out.official.wins++}
  }
  if(out.officialOnly)return out;
  const ids=new Set();
  for(const row of Array.isArray(club.practiceEvidence)?club.practiceEvidence:[]){
    if(row?.version!==1||row.team!==team||typeof row.observer!=='string'||!Array.isArray(row.games))continue;
    ids.add(row.id);if(!practiceRowMatches(row,scoped))continue;
    for(const game of row.games){
      // Unknown coverage is before detail/color filters: absent details cannot
      // be assigned to a selected champion, player or side.
      if(!['engine','aggregate'].includes(row.model)||typeof game?.win!=='boolean'||!validPracticePicks(game.picks)){out.unknownGames++;continue}
      if((scoped.color&&game.color!==scoped.color)||!practicePickMatches(game.picks,scoped,cid))continue;
      out[row.model].games++;if(game.win)out[row.model].wins++;
    }
  }
  // Retain old summary coverage without reconstructing missing appearances or
  // double-counting newly linked summaries. Historical region is unknown here.
  for(const row of club.scrimLog||[]){
    if(ids.has(row.practiceEvidenceId)||scoped.region)continue;
    if(practiceRowMatches(row,scoped))out.legacyGames+=Number.isInteger(row.games)&&row.games>0?row.games:0;
  }
  return out;
}
function ownPracticeFacets(db){
  const teams=[],players=new Set(),mine=managedTeam(db);
  if(!mine||db.world?.fired)return {teams,players:[]};
  for(const team of Object.values(db.teams))if(managerControlsSquad(db,team)){
    teams.push(team.id);
    for(const row of Array.isArray(team.practiceEvidence)?team.practiceEvidence:[])if(row?.version===1&&row.team===team.id&&Array.isArray(row.games)){if(typeof row.opponent==='string'&&!teams.includes(row.opponent))teams.push(row.opponent);for(const g of row.games)if(validPracticePicks(g?.picks))for(const p of g.picks)players.add(p.player)}
  }
  return {teams,players:[...players].sort()};
}
