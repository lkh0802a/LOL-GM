// ===== LOL GM: Save serialization =====
// Owns compact persisted views and runtime restoration only.
// Save packing must not mutate live runtime state.

// ---- 저장용 압축: 능력치·성향·챔피언 폭을 배열로 ----
function packMetaHistory(rows){
  return (rows||[]).map(r=>[
    r.date,r.patch,r.comp,r.season,r.year,r.split,r.stage,r.league,r.international?1:0,r.regions||[],
    (r.sides||[]).map(s=>[s.team,s.region,s.win?1:0,(s.picks||[]).map(p=>{const x=typeof p==='string'?{champ:p}:p;return [x.champ,x.role||null,x.player||null,x.items||[],x.runes||[]]})]),
    r.bans||[]
  ]);
}
function unpackMetaHistory(rows){
  return (rows||[]).map(r=>Array.isArray(r)?{date:r[0],patch:r[1],comp:r[2],season:r[3],year:r[4],split:r[5],stage:r[6],league:r[7],international:!!r[8],regions:r[9]||[],sides:(r[10]||[]).map(s=>({team:s[0],region:s[1],win:!!s[2],picks:(s[3]||[]).map(p=>({champ:p[0],role:p[1],player:p[2],items:p[3]||[],runes:p[4]||[]}))})),bans:r[11]||[]}:r);
}
const ALL_ATTRS=Object.values(ATTR_GROUPS).flat();
function seriesResultForSave(r,lite){
  const q={...r};delete q.seed;delete q.firstChoice;
  if(lite&&!q.lite){q.games=(q.games||[]).map(g=>({n:g.n,blue:g.blue,red:g.red,winner:g.winner,kills:g.kills,dur:g.dur,mvp:g.mvp}));delete q.tac;q.lite=true}
  return q;
}
function worldForSave(db){
  const w=db.world;if(!w)return w;const managed=db.teams&&db.teams[managedTeamId(db)],my=managed&&managed.region,seasons={};
  for(const [id,s] of Object.entries(w.seasons||{})){
    if(!s.done){seasons[id]=s;continue}
    const lite=!!(my&&s.region&&s.region!==my&&!db.competitions?.[s.comp]?.international);
    const days=(s.days||[]).map(d=>({...d,matches:(d.matches||[]).map(m=>m.res?{...m,res:seriesResultForSave(m.res,lite)}:m)}));
    seasons[id]={...s,days};if(lite)seasons[id].compact=true;
  }
  return {...w,seasons};
}
function packDB(db){
  const world=worldForSave(db);
  const players={};
  for(const [id,p] of Object.entries(db.players)){
    const q={...p};delete q.secondaryRoles;delete q.roleFamiliarity;
    if(p.attrs)q.attrs=ALL_ATTRS.map(a=>p.attrs[a]);
    if(p.tend)q.tend=TENDENCIES.map(t=>p.tend[t]);
    if(p.pool)q.pool=Object.fromEntries(Object.entries(p.pool).map(([c,v])=>[c,[v.mastery,v.experience,v.matchup_knowledge,v.confidence,v.scrimExperience||0,v.trainingExperience||0,v.scrimSeason||0,v.trainingSeason||0]]));
    players[id]=q;
  }
  const scout=Object.fromEntries(Object.entries(db.scout||{}).filter(([id,r])=>db.players[id]&&!db.players[id].retired&&(typeof r==='number'||(r.knowledge||0)>baseScoutKnowledge(db,db.players[id])||(r.observations||0)>0)));
  const teams=Object.fromEntries(Object.entries(db.teams).map(([id,t])=>{const q={...t};delete q._pre;delete q.coach;delete q.staff;if(q.facilities)delete q.facility;return [id,q]}));
  const patches={...(db.patches||{})};delete patches.base;delete patches.initialBase;const metaHistory=packMetaHistory(db.metaHistory||[]);
  const root={...db};
  // Format/revision fields are storage metadata. Runtime caches, legacy staff pools,
  // transaction previews and historical full patch baselines never enter exports.
  for(const key of SAVE_TRANSIENT_ROOT_FIELDS)delete root[key];
  return JSON.stringify({...root,world,teams,players,scout,patches,metaHistory,
    saveFormat:SAVE_FORMAT_VERSION,metaHistoryPacked:1,packed:1});
}
function unpackDB(str){
  return migrateSaveState(JSON.parse(str));
}
