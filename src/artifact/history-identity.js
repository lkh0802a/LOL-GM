// Event-time public identity only; never infer historical names from live maps.
function mergeRecordedIdentity(target,source){
  for(const [id,row] of Object.entries(source.teams))if(!target.teams[id])target.teams[id]={...row};
  for(const [id,row] of Object.entries(source.players)){
    const old=target.players[id];if(!old){target.players[id]={name:row.name,roles:row.roles.slice(),teams:row.teams.map(t=>({...t}))};continue}
    for(const role of row.roles)if(!old.roles.includes(role))old.roles.push(role);
    for(const team of row.teams)if(!old.teams.some(t=>t.id===team.id&&t.name===team.name))old.teams.push({...team});
  }
  Object.assign(target.champions,source.champions);
  if(!target.competition&&source.competition)target.competition={...source.competition};
  return target;
}
function emptyRecordedIdentity(){return {teams:Object.create(null),players:Object.create(null),champions:Object.create(null),competition:null}}
function recordedSeriesIdentity(db,rec,game=null){
  const out=emptyRecordedIdentity();
  if(!game&&isDoubleDisqualification(rec)){assertDoubleDisqualification(rec);mergeRecordedIdentity(out,rec.administrative.identity);}
  for(const g of game?[game]:rec?.games||[]){
    const p=recordedPublicMatch(db,rec,g).record;if(!p)continue;
    const one=emptyRecordedIdentity();one.competition=p.competition||null;one.champions=p.championNames;
    for(const side of p.sides){
      one.teams[side.team]={name:side.name,short:side.short||side.name,region:side.region||null,regionName:side.regionName||null};
      for(const row of side.players)one.players[row[0]]={name:row[1],roles:[row[2]],teams:[{id:side.team,name:side.name}]};
    }
    mergeRecordedIdentity(out,one);
  }
  return out;
}
function recordedSeasonIdentity(db,s){
  const out=emptyRecordedIdentity();
  for(const day of s.days||[])for(const match of day.matches||[])if(match.res)mergeRecordedIdentity(out,recordedSeriesIdentity(db,match.res));
  return out;
}
function recordedTeamLabel(identity,id,short=false){return (short?identity.teams[id]?.short:identity.teams[id]?.name)||id||'—'}
function recordedPlayerLabel(identity,id){return identity.players[id]?.name||id||'—'}
function recordedSeriesLabel(db,rec,game=null){const view=recordedSeriesIdentity(db,rec,game);return [game?.blue||rec.a,game?.red||rec.b].map(id=>recordedTeamLabel(view,id,true)).join(' / ')}
function recordedCompetitionLabel(db,rec,id){const c=recordedSeriesIdentity(db,rec).competition;return c?.id===id?c.name:id}
function recordedSeriesScore(rec,separator=' : '){return isDoubleDisqualification(rec)?'양 팀 실격 · 경기 미진행':rec.score.join(separator);}
function historicalCompetitionSnapshot(db,c){
  const region=db.regions?.[c.region];
  return {id:c.id,name:c.name,short:c.short,tier:c.tier,region:c.region||null,div:c.div||1,international:!!c.international,teams:c.teams.slice(),stages:JSON.parse(JSON.stringify(c.stages)),teamInfo:c.teams.map(id=>{const t=db.teams[id];if(!t)return {id,active:false};return {id,name:t.name,short:t.short,region:t.region,regionName:db.regions?.[t.region]?.name,division:t.division||1,parent:t.parent||null,active:t.active!==false,franchised:!!t.franchised}}),...(region?{regionInfo:{id:region.id,short:region.short,splits:region.splits,name:region.name,leagueName:region.leagueName,splitNames:{...region.splitNames},standingsMode:region.standingsMode,system:region.system,relegate:region.relegate,div2:region.div2}}:{})};
}

// Read-only view for completed standings. No present-day team membership or
// changed competition stages may reclassify already recorded results.
function historicalSeasonView(db,s){
  const snap=s.formatSnapshot;
  if(!snap||snap.id!==s.comp||!Array.isArray(snap.stages)||!Array.isArray(snap.teamInfo)||snap.teamInfo.some(t=>!t||typeof t.id!=='string'))return null;
  const view=Object.create(db);
  view.world={...db.world,year:s.year,seasons:Object.fromEntries(Object.entries(db.world?.seasons||{}).filter(([,x])=>x.year===s.year))};
  view.competitions={...db.competitions,[s.comp]:snap};
  view.teams=Object.fromEntries(Object.keys(db.teams).map(id=>[id,{id,active:false}]));
  for(const t of snap.teamInfo)view.teams[t.id]={...t};
  view.regions={...db.regions,...(snap.regionInfo?{[snap.regionInfo.id]:snap.regionInfo}:{})};
  return view;
}

function seasonDisplayCompetition(db,s){
  if(s.done||s.year<db.year)return s.formatSnapshot||{id:s.comp,name:s.comp,short:s.comp};
  return db.competitions[s.comp]||{id:s.comp,name:s.comp,short:s.comp};
}
