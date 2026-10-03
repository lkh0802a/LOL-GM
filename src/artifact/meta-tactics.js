// Internal, game-time tactical context for currently controlled squads only.
const MATCH_TACTIC_FIELDS=['aggression','risk_tolerance','objective_priority','vision_investment','scaling_preference'];
const META_TACTIC_CACHE=new WeakMap();
function validMatchTactics(context,team){
  return !!context&&context.version===1&&context.team===team&&typeof context.observer==='string'&&!!context.observer&&Array.isArray(context.values)&&context.values.length===5&&context.values.every(x=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=100);
}
function matchTacticSnapshot(db,team){
  if(db.world?.fired||!managerControlsSquad(db,team))return null;
  const context={version:1,team:team.id,observer:managedTeamId(db),values:MATCH_TACTIC_FIELDS.map(k=>team.tactics?.[k])};
  return validMatchTactics(context,team.id)?Object.freeze({...context,values:Object.freeze(context.values)}):null;
}
function archivedMatchTactics(side){
  const c=side.tacticContext;
  return validMatchTactics(c,side.team?.id)?{tacticContext:{...c,values:c.values.slice()}}:{};
}
function ownTacticInsights(db,filter={},cid=null){
  const team=filter.team||managedTeamId(db),out={allowed:false,team,sample:0,known:0,unknown:0,axes:[]};
  // Recheck authority before cache access, including firing and club changes.
  if(db.world?.fired||!managerControlsSquad(db,db.teams[team]))return out;
  out.allowed=true;const scoped={...filter,team},index=metaHistoryIndex(db),key=JSON.stringify([managedTeamId(db),metaFilterKey(scoped),cid]);
  let state=META_TACTIC_CACHE.get(index);
  if(!state||state.length!==index.length||state.tail!==index.tail){state={length:index.length,tail:index.tail,queries:new Map()};META_TACTIC_CACHE.set(index,state)}
  if(state.queries.has(key)){const hit=state.queries.get(key);state.queries.delete(key);state.queries.set(key,hit);return hit}
  const axes=MATCH_TACTIC_FIELDS.map(()=>new Map());
  for(const row of metaRowsFiltered(db,scoped))for(const side of row.sides||[]){
    if(!metaSideMatches(row,side,scoped))continue;
    if((cid||scoped.position)&&!(side.picks||[]).some(p=>{const x=typeof p==='string'?{champ:p}:p;return x&&(!cid||x.champ===cid)&&(!scoped.position||x.role===scoped.position)&&(!scoped.player||x.player===scoped.player)}))continue;
    out.sample++;const c=side.tacticContext;
    if(!validMatchTactics(c,side.team)){out.unknown++;continue}out.known++;
    for(let i=0;i<axes.length;i++){let x=axes[i].get(c.values[i]);if(!x){x={value:c.values[i],g:0,w:0};axes[i].set(c.values[i],x)}x.g++;if(side.win)x.w++}
  }
  // Exact settings, ranked by frequency rather than win rate. Display bounds
  // do not remove history or change sample/win denominators.
  out.axes=axes.map((axis,i)=>({key:MATCH_TACTIC_FIELDS[i],distinct:axis.size,settings:[...axis.values()].sort((a,b)=>b.g-a.g||a.value-b.value).slice(0,6).map(x=>({...x,wr:x.w/x.g}))}));
  return metaCacheRemember(state.queries,key,out,META_FILTER_CACHE_LIMIT);
}
