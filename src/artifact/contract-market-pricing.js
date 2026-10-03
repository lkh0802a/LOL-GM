// ===== LOL GM: market pricing and scoped topology read index =====
// Owns demand, salary/value estimates and ephemeral pricing-batch indexing.
// Contract consent and roster mutations remain in their existing domains.

function recentMarketPerformance(db,p){
  const rows=(p.career||[]).slice(-6),g=rows.reduce((a,c)=>a+(c.g||0),0);if(!g)return {games:0,rating:6.5,intl:0,titles:0};
  const rating=rows.reduce((a,c)=>a+(c.rating||6.5)*(c.g||0),0)/g,intl=rows.filter(c=>c.international).reduce((a,c)=>a+(c.g||0),0),titles=(p.careerEvents||[]).filter(e=>e.type==='title'&&e.year>=db.year-2).length;
  return {games:g,rating,intl,titles};
}
// Only synchronous, read-only market pricing batches use this index. It stores
// the existing cache key inputs, not prices, and never crosses a mutation/save.
const MARKET_DEMAND_READ_INDEX=new WeakMap();
function withMarketDemandReadIndex(db,read){
  if(MARKET_DEMAND_READ_INDEX.has(db))return read();
  return withActiveTeamReadIndex(db,()=>{
  const topCounts=new Map();let totalTop=0;
  for(const team of activeTeams(db,null,1)){
    totalTop++;topCounts.set(team.region,(topCounts.get(team.region)||0)+1);
  }
  MARKET_DEMAND_READ_INDEX.set(db,{year:db.year,playerCount:Object.keys(db.players).length,topCounts,totalTop});
  try{return read()}finally{MARKET_DEMAND_READ_INDEX.delete(db)}
  });
}
function marketDemandSnapshot(db,rid){
  db._marketDemandCache=db._marketDemandCache||{};
  const index=MARKET_DEMAND_READ_INDEX.get(db),slot=rid||'ALL',
    teamCount=index?(rid?(index.topCounts.get(rid)||0):index.totalTop):activeTeams(db,rid,1).length,
    key=[index?index.year:db.year,slot,index?index.playerCount:Object.keys(db.players).length,teamCount].join('|'),cached=db._marketDemandCache[slot];
  if(cached&&cached.key===key)return cached.values;
  const counts=Object.fromEntries(ROLES.map(r=>[r,0]));
  for(const p of Object.values(db.players))if(!p.retired&&(!rid||p.region===rid)&&(p.age<=30||p.team))counts[p.role]=(counts[p.role]||0)+1;
  const values=Object.fromEntries(ROLES.map(role=>[role,clamp(Math.max(1,teamCount*1.35)/Math.max(1,counts[role]||0),.72,1.38)]));
  db._marketDemandCache[slot]={key,values};return values;
}
function invalidateMarketDemand(db){if(db)db._marketDemandCache={}}
function roleMarketDemand(db,role,rid){return marketDemandSnapshot(db,rid)[role]??1}
function marketSalary(db,p,rid){
  const o=playerOvr(p),region=rid||p.region,ps=psOf(db,region),up=Math.max(0,p.pot-o),perf=recentMarketPerformance(db,p),demand=roleMarketDemand(db,p.role,region);
  const repMul=.82+(p.reputation??o)/220,perfMul=clamp(1+(perf.rating-6.5)*.08+Math.min(.1,perf.intl*.004)+Math.min(.08,perf.titles*.035),.82,1.28),ageMul=p.age<=21?1.02:p.age>=29?.88:1;
  return Math.max(.3*ps,Math.round(.41*Math.exp((o-60)*.13)*(1+up*(p.age<=21?.035:.008))*ps*repMul*perfMul*demand*ageMul*10)/10);
}
function playerMarketValue(db,p){
  const o=playerOvr(p),rep=p.reputation??o,up=Math.max(0,p.pot-o),rid=p.team&&db.teams[p.team]?db.teams[p.team].region:p.region,ps=psOf(db,rid),perf=recentMarketPerformance(db,p),demand=roleMarketDemand(db,p.role,rid);
  const ageMul=p.age<=20?1.25:p.age<=23?1.16:p.age<=26?1:p.age<=29?.82:.58,left=p.contract?Math.max(0,p.contract.until-db.year+1):0,contractMul=p.contract?1+Math.min(3,left)*.14:.68;
  const perfMul=clamp(1+(perf.rating-6.5)*.09+Math.min(.13,perf.intl*.004)+Math.min(.12,perf.titles*.045)+(p.form||0)*.008,.75,1.35);
  const raw=.62*Math.exp((o-60)*.115)*ps*(.76+rep/175)*(1+up*(p.age<=22?.047:.018))*ageMul*contractMul*perfMul*demand*(1-medicalContractRisk(db,p)*.75);
  return Math.round(Math.max(.2*ps,raw)*10)/10;
}
function asking(db,p,rid){return Math.round(marketSalary(db,p,rid)*(1+p.personality.ambition/420)*(.95+(p.reputation??playerOvr(p))/1700)*10)/10}
