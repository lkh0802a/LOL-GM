// ===== LOL GM: Professional meta evidence domain =====
// Owns match-derived meta history, indexes, filtered queries and champion meta insights.

const META_HISTORY_CACHE=new WeakMap();
const META_PATCH_SAMPLE_INDEX_CACHE=new WeakMap(); // Official views share append-only recorded history.
const EMPTY_META_HISTORY=[];
const META_FILTER_CACHE_LIMIT=64, META_PATCH_SORT_LIMIT=12, PATCH_REPLAY_CACHE_LIMIT=8;
function patchCache(db){let c=PATCH_CACHE.get(db);if(!c){c=new Map();PATCH_CACHE.set(db,c)}return c}
function clearPatchCache(db){PATCH_CACHE.delete(db)}
function rememberHistoricPatch(db,id,patch){
  const cache=patchCache(db);
  cache.delete(id);cache.set(id,patch);
  if(cache.size>PATCH_REPLAY_CACHE_LIMIT)cache.delete(cache.keys().next().value);
  return patch;
}
function historicPatchCacheHit(db,id){
  const cache=patchCache(db),patch=cache.get(id);
  if(patch){cache.delete(id);cache.set(id,patch)}
  return patch||null;
}
function metaIndexAdd(map,key,row){
  if(key==null)return;
  let a=map.get(key);if(!a){a=[];map.set(key,a)}a.push(row);
}
function metaIndexAddRow(index,row){
  metaIndexAdd(index.byPatch,row.patch,row);
  metaIndexAdd(index.byComp,row.comp,row);
  for(const tid of new Set((row.sides||[]).map(s=>s.team).filter(Boolean)))metaIndexAdd(index.byTeam,tid,row);
  for(const pid of new Set((row.sides||[]).flatMap(s=>(s.picks||[]).map(p=>typeof p==='object'?p.player:null)).filter(Boolean)))metaIndexAdd(index.byPlayer,pid,row);
  for(const region of row.regions||[])metaIndexAdd(index.byRegion,region,row);
  for(const key of ['comp','patch','season','split','league']){
    const value=row[key];
    if(value!==undefined&&value!==null&&value!=='')index.facetSets[key].add(value);
  }
}
function metaHistoryIndex(db){
  const rows=db.metaHistory||EMPTY_META_HISTORY;
  let c=META_HISTORY_CACHE.get(db);
  if(c&&c.rows===rows){
    // A normal match records by appending; never rebuild 10k+ historical rows
    // just because a single new professional game has finished.
    if(c.length===rows.length&&c.tail===rows[rows.length-1])return c;
    if(c.length<rows.length&&c.tail===rows[c.length-1]){
      for(let i=c.length;i<rows.length;i++)metaIndexAddRow(c,rows[i]);
      c.length=rows.length;c.tail=rows[rows.length-1];
      c.filtered.clear();c.patchSorted.clear();c.patchSamples.clear();c.banAttribution.clear();c.facets=null;
      return c;
    }
  }
  // Array replacement/truncation or changed tail identity: full safe rebuild.
  c={rows,length:rows.length,tail:rows[rows.length-1],
    byPatch:new Map(),byComp:new Map(),byRegion:new Map(),byTeam:new Map(),byPlayer:new Map(),banAttribution:new Map(),
    filtered:new Map(),patchSorted:new Map(),patchSamples:new Map(),facets:null,
    facetSets:Object.fromEntries(['comp','patch','season','split','league'].map(k=>[k,new Set()]))};
  for(const row of rows)metaIndexAddRow(c,row);
  META_HISTORY_CACHE.set(db,c);return c;
}
function metaHistoryFacets(db){
  const c=metaHistoryIndex(db);
  if(c.facets)return c.facets;
  const sorted=key=>[...c.facetSets[key]].sort();
  return c.facets={
    comps:sorted('comp'),patches:sorted('patch').reverse(),
    seasons:sorted('season').reverse(),splits:sorted('split'),
    leagues:sorted('league'),teams:[...c.byTeam.keys()].sort(),players:[...c.byPlayer.keys()].sort()
  };
}
function metaCacheRemember(cache,key,value,limit){
  if(cache.has(key))cache.delete(key);
  cache.set(key,value);
  if(cache.size>limit)cache.delete(cache.keys().next().value);
  return value;
}
function currentPatchMetaSamples(db){
  const rowsRef=db.metaHistory||EMPTY_META_HISTORY,shared=META_PATCH_SAMPLE_INDEX_CACHE.get(rowsRef);
  if(shared)META_HISTORY_CACHE.set(db,shared);
  const index=metaHistoryIndex(db),patch=db.patch.id;
  META_PATCH_SAMPLE_INDEX_CACHE.set(rowsRef,index);
  if(index.patchSamples.has(patch))return index.patchSamples.get(patch);
  const rows=index.byPatch.get(patch)||EMPTY_META_HISTORY,stats={},regional={},regionGames={},
    add=(bag,cid,key)=>{if(typeof cid!=='string')return;const x=bag[cid]||(bag[cid]={p:0,w:0,b:0});x[key]++};
  for(const row of rows){
    for(const side of row.sides||[])for(const pick of side.picks||[]){const cid=typeof pick==='string'?pick:pick.champ;add(stats,cid,'p');if(side.win)add(stats,cid,'w')}
    for(const cid of row.bans||[])add(stats,cid,'b');
    for(const rid of new Set(row.regions||[])){
      const bag=regional[rid]||(regional[rid]={});regionGames[rid]=(regionGames[rid]||0)+1;
      for(const side of row.sides||[]){if(side.region!==rid)continue;for(const pick of side.picks||[]){const cid=typeof pick==='string'?pick:pick.champ;add(bag,cid,'p');if(side.win)add(bag,cid,'w')}}
      for(const cid of row.bans||[])add(bag,cid,'b');
    }
  }
  // Derived, bounded and never persisted. Unknown legacy patch provenance is
  // not backfilled from the decay counters or today's team region.
  return metaCacheRemember(index.patchSamples,patch,{patch,stats,games:rows.length,regional,regionGames},META_PATCH_SORT_LIMIT);
}
function metaFilterKey(filter){
  return JSON.stringify(['region','patch','comp','season','year','split','league','scope','from','to','position','team','player','opponent'].map(k=>String(filter[k]??'')));
}
function metaSideMatches(row,side,filter){
  return (!filter.region||side.region===filter.region)&&(!filter.team||side.team===filter.team)&&
    (!filter.player||(side.picks||[]).some(p=>typeof p==='object'&&p.player===filter.player&&(!filter.position||p.role===filter.position)))&&
    (!filter.opponent||(row.sides||[]).some(other=>other!==side&&other.team===filter.opponent&&other.team!==side.team));
}
function metaRowsFiltered(db,filter={}){
  const c=metaHistoryIndex(db),key=metaFilterKey(filter);
  if(c.filtered.has(key)){
    const hit=c.filtered.get(key);
    c.filtered.delete(key);c.filtered.set(key,hit);
    return hit;
  }
  const choices=[c.rows];if(filter.patch)choices.push(c.byPatch.get(filter.patch)||EMPTY_META_HISTORY);if(filter.comp)choices.push(c.byComp.get(filter.comp)||EMPTY_META_HISTORY);if(filter.region)choices.push(c.byRegion.get(filter.region)||EMPTY_META_HISTORY);
  if(filter.team)choices.push(c.byTeam.get(filter.team)||EMPTY_META_HISTORY);if(filter.player)choices.push(c.byPlayer.get(filter.player)||EMPTY_META_HISTORY);if(filter.opponent)choices.push(c.byTeam.get(filter.opponent)||EMPTY_META_HISTORY);
  const base=choices.reduce((a,b)=>b.length<a.length?b:a),rows=base.filter(r=>(!filter.region||(r.regions||[]).includes(filter.region))&&(!filter.patch||r.patch===filter.patch)&&(!filter.comp||r.comp===filter.comp)&&(!filter.season||r.season===filter.season)&&(!filter.year||r.year===+filter.year)&&(!filter.split||String(r.split)===String(filter.split))&&(!filter.league||r.league===filter.league)&&(!filter.scope||(filter.scope==='INTL'?r.international:!r.international))&&(!filter.from||r.date>=filter.from)&&(!filter.to||r.date<=filter.to));
  return metaCacheRemember(c.filtered,key,filter.team||filter.player||filter.opponent?rows.filter(row=>(row.sides||[]).some(side=>metaSideMatches(row,side,filter))):rows,META_FILTER_CACHE_LIMIT);
}

function recordMeta(db,r){
  if(!db.metaStats)return;
  db.metaGames=(db.metaGames||0)+1;
  const st=db.metaStats, regions=[...new Set(r.sides.map(s=>s.team&&s.team.region).filter(Boolean))];
  const add=(bag,cid,key)=>{const x=bag[cid]||(bag[cid]={p:0,w:0,b:0});x[key]++};
  r.sides.forEach((s,i)=>s.ps.forEach(p=>{add(st,p.champ.id,'p');if(r.winner===i)add(st,p.champ.id,'w')}));
  r.draft.bans.flat().forEach(c=>add(st,c,'b'));
  db.regionMetaStats=db.regionMetaStats||{};db.regionMetaGames=db.regionMetaGames||{};
  for(const rid of regions){
    const bag=db.regionMetaStats[rid]||(db.regionMetaStats[rid]={});db.regionMetaGames[rid]=(db.regionMetaGames[rid]||0)+1;
    r.sides.forEach((s,i)=>{if(!s.team||s.team.region!==rid)return;s.ps.forEach(p=>{add(bag,p.champ.id,'p');if(r.winner===i)add(bag,p.champ.id,'w')})});
    r.draft.bans.flat().forEach(c=>add(bag,c,'b'));
  }
  db.metaHistory=db.metaHistory||[];
  const mc=r.metaContext||{};
  db.metaHistory.push({date:r.date||db.worldDate,patch:r.patch||db.patch.id,comp:r.comp||r.competitionId||null,season:mc.season||null,year:mc.year||+(r.date||db.worldDate).slice(0,4),split:mc.split||null,stage:mc.stage||null,league:mc.league||null,international:!!mc.international,regions,sides:r.sides.map((s,i)=>({team:s.team?.id||null,region:s.team?.region||null,win:r.winner===i,bans:r.draft.bans[i].slice(),picks:s.ps.map(x=>({champ:x.champ.id,role:x.role||null,player:x.p?.id||null,items:matchQuestItems(x).slice(),runes:(x.runes||[]).slice()}))})),bans:r.draft.bans.flat()});
  const international=regions.length>1;
  for(const side of r.sides){if(!side.team)continue;const t=db.teams[side.team.id]||side.team;t.metaKnowledge=t.metaKnowledge||{};t.metaCounter=t.metaCounter||{};for(const os of r.sides){if(os===side)continue;for(const pick of os.ps){const cid=pick.champ.id,success=r.winner===r.sides.indexOf(os),novel=((db.regionMetaStats?.[t.region]||{})[cid]?.p||0)<3,analysis=.65+staffAnalysisFor(side.team,'opponent')/140,learn=(success?.055:.018)*(novel?1.6:1)*(international?1.35:1)*analysis;t.metaKnowledge[cid]=clamp((t.metaKnowledge[cid]||0)+learn,0,1);if(r.winner!==r.sides.indexOf(side))t.metaCounter[cid]=clamp((t.metaCounter[cid]||0)+.02*analysis,0,1)}}}
}
function metaTableFiltered(db,filter={}){
  const rows=metaRowsFiltered(db,filter);
  if(!rows.length)return metaTable(db,filter.region||null).map(x=>({...x,p:0,b:0,w:0,pres:0,wr:null,sample:0}));
  const st={},add=(cid,key)=>{const x=st[cid]||(st[cid]={p:0,w:0,b:0});x[key]++};
  for(const r of rows){for(const side of r.sides){if(!metaSideMatches(r,side,filter))continue;for(const pick of side.picks){const p=typeof pick==='string'?{champ:pick}:pick;if(filter.position&&p.role!==filter.position||filter.player&&p.player!==filter.player)continue;add(p.champ,'p');if(side.win)add(p.champ,'w')}}for(const cid of r.bans)add(cid,'b')}
  const G=Math.max(1,rows.length);return Object.values(db.patch.champions).map(c=>{const s=st[c.id]||{p:0,w:0,b:0};return {c,p:s.p,b:s.b,w:s.w,pres:(s.p+s.b)/G,wr:s.p?s.w/s.p:null,sample:G,eligible:championProEligible(db,c)}}).sort((a,b)=>b.pres-a.pres);
}

function metaBanAttribution(db,filter={}){
  const index=metaHistoryIndex(db),key=metaFilterKey(filter),cache=index.banAttribution;
  if(cache.has(key)){const hit=cache.get(key);cache.delete(key);cache.set(key,hit);return hit}
  const rows=metaRowsFiltered(db,filter),out={games:rows.length,knownGames:0,unknownGames:0,own:0,opponent:0,unknown:0,champions:{}};
  const add=(cid,kind)=>{const x=out.champions[cid]||(out.champions[cid]={own:0,opponent:0,unknown:0});x[kind]++;out[kind]++};
  for(const row of rows){
    const sides=row.sides||[],flat=row.bans||[],known=sides.length===2&&sides.every(s=>typeof s.region==='string'&&(row.regions||[]).includes(s.region)&&Array.isArray(s.bans)&&s.bans.every(x=>typeof x==='string'))&&JSON.stringify(sides.flatMap(s=>s.bans).slice().sort())===JSON.stringify(flat.slice().sort());
    if(!known){out.unknownGames++;for(const cid of flat)add(cid,'unknown');continue}
    out.knownGames++;
    for(const side of sides)for(const cid of side.bans)add(cid,metaSideMatches(row,side,filter)?'own':'opponent');
  }
  // Separate attribution from existing all-match regional ban exposure. Legacy
  // and inconsistent rows remain unknown; no inferred side or history rewrite.
  return metaCacheRemember(cache,key,out,META_FILTER_CACHE_LIMIT);
}
function championMetaInsights(db,cid,filter={}){
  const players={},teams={},matchups={},recent=[],rows=metaRowsFiltered(db,filter);
  for(const r of rows)for(const side of r.sides||[]){if(!metaSideMatches(r,side,filter))continue;const picks=(side.picks||[]).map(p=>typeof p==='string'?{champ:p}:p),me=picks.find(p=>p.champ===cid&&(!filter.position||p.role===filter.position)&&(!filter.player||p.player===filter.player));if(!me)continue;if(me.player){const x=players[me.player]||(players[me.player]={g:0,w:0});x.g++;if(side.win)x.w++}if(side.team){const x=teams[side.team]||(teams[side.team]={g:0,w:0});x.g++;if(side.win)x.w++}const opp=(r.sides||[]).find(x=>x!==side);if(opp&&me.role){const op=(opp.picks||[]).map(p=>typeof p==='string'?{champ:p}:p).find(p=>p.role===me.role);if(op){const x=matchups[op.champ]||(matchups[op.champ]={g:0,w:0});x.g++;if(side.win)x.w++}}recent.push({date:r.date,win:side.win})}
  const top=o=>Object.entries(o).sort((a,b)=>b[1].g-a[1].g||b[1].w-a[1].w).slice(0,5);return {players:top(players),teams:top(teams),matchups:top(matchups),recent:recent.sort((a,b)=>a.date.localeCompare(b.date)).slice(-10)};
}
function metaTable(db,regionId=null){
  const G=Math.max(1,regionId?(db.regionMetaGames||{})[regionId]||0:db.metaGames||0), st=regionId?((db.regionMetaStats||{})[regionId]||{}):(db.metaStats||{});
  return Object.values(db.patch.champions).map(c=>{const s=st[c.id]||{p:0,w:0,b:0};return {c,p:s.p,b:s.b,w:s.w,pres:(s.p+s.b)/G,wr:s.p?s.w/s.p:null,sample:G,eligible:championProEligible(db,c)}}).sort((a,b)=>b.pres-a.pres);
}
