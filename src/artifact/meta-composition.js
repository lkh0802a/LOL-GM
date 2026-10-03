// Observed same-side champion co-picks. Never a causal synergy/draft-order score.
const META_COMPOSITION_CACHE=new WeakMap();
function championCompositionInsights(db,cid,filter={}){
  const index=metaHistoryIndex(db),key=JSON.stringify([cid,metaFilterKey(filter)]);
  let state=META_COMPOSITION_CACHE.get(index);
  if(!state||state.length!==index.length||state.tail!==index.tail){state={length:index.length,tail:index.tail,queries:new Map()};META_COMPOSITION_CACHE.set(index,state)}
  if(state.queries.has(key)){const hit=state.queries.get(key);state.queries.delete(key);state.queries.set(key,hit);return hit}
  const counts=new Map(),out={sample:0,complete:0,partial:0,unknownPicks:0,pairs:[]};
  for(const row of metaRowsFiltered(db,filter))for(const side of row.sides||[]){
    if(!metaSideMatches(row,side,filter))continue;
    const picks=(side.picks||[]).map(p=>typeof p==='string'?{champ:p}:p),anchor=picks.find(p=>p&&p.champ===cid&&(!filter.position||p.role===filter.position)&&(!filter.player||p.player===filter.player));
    if(!anchor)continue;
    out.sample++;
    const ids=new Set(picks.filter(p=>p&&typeof p.champ==='string'&&p.champ).map(p=>p.champ));
    out.unknownPicks+=picks.filter(p=>!p||typeof p.champ!=='string'||!p.champ).length;
    if(picks.length===5&&ids.size===5)out.complete++;else out.partial++;
    // Player/position selects the anchor; teammates keep their recorded roles.
    // One co-pick per side, even if a malformed legacy list repeats an ID.
    for(const id of ids){if(id===cid)continue;let x=counts.get(id);if(!x){x={champ:id,g:0,w:0};counts.set(id,x)}x.g++;if(side.win)x.w++}
  }
  out.pairs=[...counts.values()].sort((a,b)=>b.g-a.g||a.champ.localeCompare(b.champ)).slice(0,8).map(x=>({...x,wr:x.w/x.g,presence:x.g/out.sample}));
  return metaCacheRemember(state.queries,key,out,META_FILTER_CACHE_LIMIT);
}
