// ===== LOL GM: Professional meta evidence domain =====
// Owns match-derived meta history, indexes, filtered queries and champion meta insights.

const META_HISTORY_CACHE=new WeakMap();
const EMPTY_META_HISTORY=[];
function patchCache(db){let c=PATCH_CACHE.get(db);if(!c){c=new Map();PATCH_CACHE.set(db,c)}return c}
function clearPatchCache(db){PATCH_CACHE.delete(db)}
function metaHistoryIndex(db){
  const rows=db.metaHistory||EMPTY_META_HISTORY;let c=META_HISTORY_CACHE.get(db);
  if(c&&c.rows===rows&&c.length===rows.length)return c;
  c={rows,length:rows.length,byPatch:new Map(),byComp:new Map(),byRegion:new Map(),filtered:new Map(),patchSorted:new Map()};
  const add=(map,key,row)=>{if(key==null)return;let a=map.get(key);if(!a){a=[];map.set(key,a)}a.push(row)};
  for(const row of rows){add(c.byPatch,row.patch,row);add(c.byComp,row.comp,row);for(const region of row.regions||[])add(c.byRegion,region,row)}
  META_HISTORY_CACHE.set(db,c);return c;
}
function metaFilterKey(filter){
  return ['region','patch','comp','season','year','split','league','scope','from','to','position'].map(k=>String(filter[k]??'')).join('|');
}
function metaRowsFiltered(db,filter={}){
  const c=metaHistoryIndex(db),key=metaFilterKey(filter);if(c.filtered.has(key))return c.filtered.get(key);
  const choices=[c.rows];if(filter.patch)choices.push(c.byPatch.get(filter.patch)||EMPTY_META_HISTORY);if(filter.comp)choices.push(c.byComp.get(filter.comp)||EMPTY_META_HISTORY);if(filter.region)choices.push(c.byRegion.get(filter.region)||EMPTY_META_HISTORY);
  const base=choices.reduce((a,b)=>b.length<a.length?b:a),rows=base.filter(r=>(!filter.region||(r.regions||[]).includes(filter.region))&&(!filter.patch||r.patch===filter.patch)&&(!filter.comp||r.comp===filter.comp)&&(!filter.season||r.season===filter.season)&&(!filter.year||r.year===+filter.year)&&(!filter.split||String(r.split)===String(filter.split))&&(!filter.league||r.league===filter.league)&&(!filter.scope||(filter.scope==='INTL'?r.international:!r.international))&&(!filter.from||r.date>=filter.from)&&(!filter.to||r.date<=filter.to));
  c.filtered.set(key,rows);return rows;
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
  db.metaHistory.push({date:r.date||db.worldDate,patch:r.patch||db.patch.id,comp:r.comp||r.competitionId||null,season:mc.season||null,year:mc.year||+(r.date||db.worldDate).slice(0,4),split:mc.split||null,stage:mc.stage||null,league:mc.league||null,international:!!mc.international,regions,sides:r.sides.map((s,i)=>({team:s.team?.id||null,region:s.team?.region||null,win:r.winner===i,picks:s.ps.map(x=>({champ:x.champ.id,role:x.role||null,player:x.p?.id||null,items:(x.items||[]).slice(),runes:(x.runes||[]).slice()}))})),bans:r.draft.bans.flat()});
  const international=regions.length>1;
  for(const side of r.sides){const t=side.team;if(!t)continue;t.metaKnowledge=t.metaKnowledge||{};t.metaCounter=t.metaCounter||{};for(const os of r.sides){if(os===side)continue;for(const pick of os.ps){const cid=pick.champ.id,success=r.winner===r.sides.indexOf(os),novel=((db.regionMetaStats?.[t.region]||{})[cid]?.p||0)<3,analysis=.65+staffProfile(t).analysis/140,learn=(success?.055:.018)*(novel?1.6:1)*(international?1.35:1)*analysis;t.metaKnowledge[cid]=clamp((t.metaKnowledge[cid]||0)+learn,0,1);if(r.winner!==r.sides.indexOf(side))t.metaCounter[cid]=clamp((t.metaCounter[cid]||0)+.02*analysis,0,1)}}}
}
function metaTableFiltered(db,filter={}){
  const rows=metaRowsFiltered(db,filter);
  if(!rows.length)return metaTable(db,filter.region||null);
  const st={},add=(cid,key)=>{const x=st[cid]||(st[cid]={p:0,w:0,b:0});x[key]++};
  for(const r of rows){for(const side of r.sides){if(filter.region&&side.region!==filter.region)continue;for(const pick of side.picks){const p=typeof pick==='string'?{champ:pick}:pick;if(filter.position&&p.role!==filter.position)continue;add(p.champ,'p');if(side.win)add(p.champ,'w')}}for(const cid of r.bans)add(cid,'b')}
  const G=Math.max(1,rows.length);return Object.values(db.patch.champions).map(c=>{const s=st[c.id]||{p:0,w:0,b:0};return {c,p:s.p,b:s.b,w:s.w,pres:(s.p+s.b)/G,wr:s.p?s.w/s.p:null,sample:G,eligible:championProEligible(db,c)}}).sort((a,b)=>b.pres-a.pres);
}

function championMetaInsights(db,cid,filter={}){
  const players={},teams={},matchups={},recent=[],rows=metaRowsFiltered(db,filter);
  for(const r of rows)for(const side of r.sides||[]){if(filter.region&&side.region!==filter.region)continue;const picks=(side.picks||[]).map(p=>typeof p==='string'?{champ:p}:p),me=picks.find(p=>p.champ===cid&&(!filter.position||p.role===filter.position));if(!me)continue;if(me.player){const x=players[me.player]||(players[me.player]={g:0,w:0});x.g++;if(side.win)x.w++}if(side.team){const x=teams[side.team]||(teams[side.team]={g:0,w:0});x.g++;if(side.win)x.w++}const opp=(r.sides||[]).find(x=>x!==side);if(opp&&me.role){const op=(opp.picks||[]).map(p=>typeof p==='string'?{champ:p}:p).find(p=>p.role===me.role);if(op){const x=matchups[op.champ]||(matchups[op.champ]={g:0,w:0});x.g++;if(side.win)x.w++}}recent.push({date:r.date,win:side.win})}
  const top=o=>Object.entries(o).sort((a,b)=>b[1].g-a[1].g||b[1].w-a[1].w).slice(0,5);return {players:top(players),teams:top(teams),matchups:top(matchups),recent:recent.sort((a,b)=>a.date.localeCompare(b.date)).slice(-10)};
}
function metaTable(db,regionId=null){
  const G=Math.max(1,regionId?(db.regionMetaGames||{})[regionId]||0:db.metaGames||0), st=regionId?((db.regionMetaStats||{})[regionId]||{}):(db.metaStats||{});
  return Object.values(db.patch.champions).map(c=>{const s=st[c.id]||{p:0,w:0,b:0};return {c,p:s.p,b:s.b,w:s.w,pres:(s.p+s.b)/G,wr:s.p?s.w/s.p:null,sample:G,eligible:championProEligible(db,c)}}).sort((a,b)=>b.pres-a.pres);
}
