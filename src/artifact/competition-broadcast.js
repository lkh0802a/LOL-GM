// ===== LOL GM: regional TV broadcast calendar =====
// Each competition week has two rounds spread across four on-air days.
// Local broadcast blocks: two televised matchdays in each half of the
// competition week. Four days can carry all fixtures of a 10–20 team league,
// while every team plays exactly twice with 2+ full days between its fixtures.
// Regions own the weekly pattern; reserve tiers inherit the regional pattern.
const REGION_BROADCAST_DAYS={
  KR:[3,4,6,0],CN:[2,3,5,6],EU:[4,5,0,1],
  NA:[4,5,0,1],AP:[3,4,6,0],BR:[4,5,0,1]
};
function broadcastDays(R){
  const list=Array.isArray(R?.broadcastDays)?R.broadcastDays:REGION_BROADCAST_DAYS[R?.id]||[3,4,6,0];
  const unique=[...new Set(list)].filter(x=>Number.isInteger(x)&&x>=0&&x<=6);
  return unique.length===4?unique:REGION_BROADCAST_DAYS.KR;
}
// All broadcast days are relative to the competition week start. Sunday is
// offset 6 and Monday offset 7, permitting region-specific Fri–Mon weeks.
function broadcastOffsets(R){
  const weekdays=broadcastDays(R),first=weekdays[0];
  return weekdays.map(day=>(day-first+7)%7);
}
function firstBroadcastWeek(start,R){
  const first=broadcastDays(R)[0];
  const base=new Date(start+'T00:00:00Z'),ahead=(first-base.getUTCDay()+7)%7;
  return addDays(start,ahead);
}
function addBroadcastRoundRobin(db,s,cfg,groups,date){
  const R=db.regions[db.competitions[s.comp].region],offsets=broadcastOffsets(R);
  const start=firstBroadcastWeek(date,R),rounds=groups.map(g=>roundRobin(g,cfg.legs||1)),
    roundCount=Math.max(...rounds.map(rows=>rows.length));
  for(let i=0;i<roundCount;i++){
    const week=Math.floor(i/2),half=i%2,window=half?offsets.slice(2):offsets.slice(0,2);
    const matches=rounds.flatMap(rows=>rows[i]||[]);
    // Do not move a single fixture twice or create one team's two matches
    // on the same broadcast day; round-robin guarantees disjoint pairs.
    const cut=Math.ceil(matches.length/2);
    [matches.slice(0,cut),matches.slice(cut)].forEach((pairs,j)=>{
      if(!pairs.length)return;
      const day=addDays(start,7*week+window[j]);
      pushDay(s,day,cfg.id,`${cfg.name} ${i+1}라운드`,pairs,cfg.bestOf,{broadcast:true});
    });
  }
}
