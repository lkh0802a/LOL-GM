// Explicit public draft chronology. Final role order is never chronology.
const META_DRAFT_ORDER_CACHE=new WeakMap();
function validDraftSequence(sequence,picks,bans){
  if(!sequence||sequence.version!==1||![0,1].includes(sequence.firstPick)||!Array.isArray(sequence.events)||sequence.events.length!==DRAFT_ORDER.length)return false;
  const ids=new Set(),seen=[{P:[],B:[]},{P:[],B:[]}];
  for(let i=0;i<sequence.events.length;i++){
    const e=sequence.events[i],[kind,ord]=DRAFT_ORDER[i],side=ord===0?sequence.firstPick:1-sequence.firstPick;
    if(!Array.isArray(e)||e.length!==4||e[0]!==i||e[1]!==kind||e[2]!==side||typeof e[3]!=='string'||!e[3]||ids.has(e[3]))return false;
    ids.add(e[3]);seen[side][kind].push(e[3]);
  }
  const equal=(a,b)=>Array.isArray(b)&&JSON.stringify(a.slice().sort())===JSON.stringify(b.slice().sort());
  return [0,1].every(side=>equal(seen[side].P,picks[side])&&equal(seen[side].B,bans[side]));
}
function copyDraftSequence(sequence){return {version:1,firstPick:sequence.firstPick,events:sequence.events.map(e=>e.slice())}}
function recordedDraftSequence(row){
  const sides=row.sides||[];if(sides.length!==2)return null;
  const picks=sides.map(s=>(s.picks||[]).map(p=>typeof p==='string'?p:p?.champ)),bans=sides.map(s=>s.bans);
  return validDraftSequence(row.draftSequence,picks,bans)?row.draftSequence:null;
}
function draftOrderInsights(db,cid,filter={}){
  const index=metaHistoryIndex(db),key=JSON.stringify([cid,metaFilterKey(filter)]);
  let state=META_DRAFT_ORDER_CACHE.get(index);
  if(!state||state.length!==index.length||state.tail!==index.tail){state={length:index.length,tail:index.tail,queries:new Map()};META_DRAFT_ORDER_CACHE.set(index,state)}
  if(state.queries.has(key)){const hit=state.queries.get(key);state.queries.delete(key);state.queries.set(key,hit);return hit}
  const out={appearances:0,known:0,unknown:0,opening:0,followup:0,openingWins:0,followupWins:0,slots:[0,0,0,0,0],preceding:[]},partners=new Map();
  for(const row of metaRowsFiltered(db,filter))for(let side=0;side<(row.sides||[]).length;side++){
    const s=row.sides[side];if(!metaSideMatches(row,s,filter))continue;
    const anchor=(s.picks||[]).find(p=>{const x=typeof p==='string'?{champ:p}:p;return x?.champ===cid&&(!filter.position||x.role===filter.position)&&(!filter.player||x.player===filter.player)});if(!anchor)continue;
    out.appearances++;const sequence=recordedDraftSequence(row);if(!sequence){out.unknown++;continue}
    const events=sequence.events.filter(e=>e[1]==='P'),own=events.filter(e=>e[2]===side),slot=own.findIndex(e=>e[3]===cid),global=events.findIndex(e=>e[2]===side&&e[3]===cid);
    if(slot<0||global<0){out.unknown++;continue}out.known++;out.slots[slot]++;
    if(global===0){out.opening++;if(s.win)out.openingWins++}else{out.followup++;if(s.win)out.followupWins++}
    for(const e of own.slice(0,slot)){let x=partners.get(e[3]);if(!x){x={champ:e[3],g:0};partners.set(e[3],x)}x.g++}
  }
  out.preceding=[...partners.values()].sort((a,b)=>b.g-a.g||a.champ.localeCompare(b.champ)).slice(0,8);
  return metaCacheRemember(state.queries,key,out,META_FILTER_CACHE_LIMIT);
}
