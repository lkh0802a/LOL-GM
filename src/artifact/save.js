// ===== LOL GM: Save serialization =====
// Owns compact persisted views and runtime restoration only.
// Save packing must not mutate live runtime state.

// ---- 저장용 압축: 능력치·성향·챔피언 폭을 배열로 ----
function packMetaHistoryRow(r){
  const row=[
    r.date,r.patch,r.comp,r.season,r.year,r.split,r.stage,r.league,r.international?1:0,r.regions||[],
    (r.sides||[]).map(s=>{const side=[s.team,s.region,s.win?1:0,(s.picks||[]).map(p=>{const x=typeof p==='string'?{champ:p}:p;return [x.champ,x.role||null,x.player||null,x.items||[],x.runes||[]]})];if(Object.hasOwn(s,'bans')||Object.hasOwn(s,'color'))side.push(s.bans??null);if(Object.hasOwn(s,'color')){side.push(s.color);if(!Object.hasOwn(s,'bans'))side.push(1)}if(Object.hasOwn(s,'tacticContext')){while(side.length<7)side.push(null);side[6]=(!Object.hasOwn(s,'bans')?1:0)|(!Object.hasOwn(s,'color')?2:0);side.push(s.tacticContext)}return side}),
    r.bans||[]
  ];
  if(Object.hasOwn(r,'draftSequence'))row.push(r.draftSequence);
  return row;
}
function packMetaHistory(rows){
  return (rows||[]).map(packMetaHistoryRow);
}
function stringifyMetaHistory(rows){
  // Keep only a bounded encoded batch beside live history and output text.
  // String concatenation avoids collecting all encoded rows or a second list
  // of output chunks. This preserves the existing array storage format.
  let text='[';
  for(let i=0;i<rows.length;i+=512){
    const chunk=JSON.stringify(packMetaHistory(rows.slice(i,i+512)));
    text+=(i?',':'')+chunk.slice(1,-1);
  }
  return text+']';
}
function unpackMetaHistory(rows){
  const strings=new Map(),loadouts=new Map(),pickRecords=new Map();
  const intern=x=>{if(typeof x!=='string')return x;const old=strings.get(x);if(old!==undefined)return old;strings.set(x,x);return x};
  const ids=xs=>(xs||[]).map(intern);
  // Historical loadouts are immutable evidence. Share repeated combinations,
  // without retaining an unbounded dictionary of unique builds during loading.
  const remember=(cache,key,value,limit)=>{cache.set(key,value);if(cache.size>limit)cache.delete(cache.keys().next().value);return value};
  const loadout=xs=>{const values=ids(xs),key=JSON.stringify(values),old=loadouts.get(key);if(old)return old;return remember(loadouts,key,Object.freeze(values),4096)};
  rows=rows||[];
  // Restoration owns these parsed rows; replace each encoded row immediately
  // so GC can reclaim it before the entire history has been expanded.
  for(let i=0;i<rows.length;i++){
    const r=rows[i];
    const row=Array.isArray(r)?{date:r[0],patch:r[1],comp:r[2],season:r[3],year:r[4],split:r[5],stage:r[6],league:r[7],international:!!r[8],regions:r[9]||[],sides:(r[10]||[]).map(s=>({team:s[0],region:s[1],win:!!s[2],picks:(s[3]||[]).map(p=>({champ:p[0],role:p[1],player:p[2],items:p[3]||[],runes:p[4]||[]})),...(s.length>4&&!(s[6]&1)?{bans:s[4]}:{}),...(s.length>5&&!(s[6]&2)?{color:s[5]}:{}),...(s.length>7?{tacticContext:s[7]}:{})})),bans:r[11]||[]}:r;
    for(const key of ['date','patch','comp','season','stage','league'])row[key]=intern(row[key]);
    if(Array.isArray(r)&&r.length>12)row.draftSequence=r[12];
    row.regions=ids(row.regions);row.bans=ids(row.bans);
    for(const side of row.sides||[]){
      side.team=intern(side.team);side.region=intern(side.region);
      if(Array.isArray(side.bans))side.bans=ids(side.bans);
      for(let j=0;j<(side.picks||[]).length;j++){let pick=side.picks[j];if(typeof pick==='object'&&pick){
        if(Object.isFrozen(pick))pick={...pick};
        pick.champ=intern(pick.champ);pick.role=intern(pick.role);pick.player=intern(pick.player);
        pick.items=loadout(pick.items);pick.runes=loadout(pick.runes);
        // Only canonical immutable evidence is shared. Extended legacy records
        // retain their own fields and nested values without new aliases.
        const canonical=Object.keys(pick).length===5&&['champ','role','player','items','runes'].every(k=>Object.hasOwn(pick,k))&&['champ','role','player'].every(k=>pick[k]==null||typeof pick[k]==='string')&&[pick.items,pick.runes].every(xs=>xs.every(x=>typeof x==='string'));
        if(canonical){const key=JSON.stringify(pick),old=pickRecords.get(key);side.picks[j]=old||remember(pickRecords,key,Object.freeze(pick),8192)}
        else side.picks[j]=pick;
      }}
    }
    rows[i]=row;
  }
  return rows;
}
const ALL_ATTRS=Object.values(ATTR_GROUPS).flat();
function seriesResultForSave(r,lite){
  const q={...r};delete q.seed;delete q.firstChoice;
  if(lite&&!q.lite){q.games=(q.games||[]).map(g=>({n:g.n,blue:g.blue,red:g.red,winner:g.winner,kills:g.kills,dur:g.dur,mvp:g.mvp,...(g.publicRecord?{date:g.date,patch:g.patch,publicRecord:g.publicRecord}:{}),...(g.draftEvidence?{date:g.date,patch:g.patch,draftEvidence:g.draftEvidence,draftSequence:g.draftSequence,picks:g.picks,bans:g.bans}:{})}));delete q.tac;q.lite=true}
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
    if(p.pool)q.pool=Object.fromEntries(Object.entries(p.pool).map(([c,v])=>[c,[v.mastery,v.experience,v.matchup_knowledge,v.confidence,v.scrimExperience||0,v.trainingExperience||0,v.scrimSeason||0,v.trainingSeason||0,...(v.coachingMastery!==undefined||v.coachingResearch!==undefined?[v.coachingMastery??0,v.coachingResearch??0]:[])]]));
    players[id]=q;
  }
  const scout=Object.fromEntries(Object.entries(db.scout||{}).filter(([id,r])=>db.players[id]&&!db.players[id].retired&&(typeof r==='number'||(r.knowledge||0)>baseScoutKnowledge(db,db.players[id])||(r.observations||0)>0)));
  const teams=Object.fromEntries(Object.entries(db.teams).map(([id,t])=>{const q={...t};delete q._pre;delete q.coach;delete q.staff;if(q.facilities)delete q.facility;return [id,q]}));
  const patches={...(db.patches||{})};delete patches.base;delete patches.initialBase;
  const root={...db};
  // Format/revision fields are storage metadata. Runtime caches, legacy staff pools,
  // transaction previews and historical full patch baselines never enter exports.
  for(const key of SAVE_TRANSIENT_ROOT_FIELDS)delete root[key];
  delete root.metaHistory;
  const body=JSON.stringify({...root,world,teams,players,scout,patches,
    saveFormat:SAVE_FORMAT_VERSION,metaHistoryPacked:1,packed:1});
  return body.slice(0,-1)+',"metaHistory":'+stringifyMetaHistory(db.metaHistory||[])+'}';
}
function unpackDB(str){
  return migrateSaveState(JSON.parse(str));
}
