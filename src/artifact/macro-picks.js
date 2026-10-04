// Existing macro pick pool, not physical travel/reach or a new tactical policy.
function selectMacroHunters(st,side,candidates){
  if(matchEnded(st)||![0,1].includes(side)||!Array.isArray(candidates))return [];
  const owned=st.sides[side].ps;
  if(candidates.some(p=>!owned.includes(p)))return [];
  const pool=owned.filter(p=>candidates.includes(p)&&alive(st,p));
  if(pool.length<2)return [];
  // One key per canonical roster actor; comparisons never consume randomness.
  const ranked=pool.map((p,index)=>({p,index,key:st.rng.dec.next()}));
  ranked.sort((a,b)=>b.key-a.key||a.index-b.index);
  return ranked.slice(0,Math.min(3,pool.length)).map(x=>x.p);
}
function recordMacroPick(st,side,lane,target,sides,result){
  if(matchEnded(st)||!result||![0,1].includes(side)||!LANES.includes(lane)||![0,1].includes(result.winner)||!Array.isArray(sides)||sides.length!==2||sides.some((a,i)=>!Array.isArray(a)||a.some(p=>!st.sides[i].ps.includes(p))||new Set(a).size!==a.length)||!sides[1-side].includes(target))return;
  const events=st.macroPickEvents||(st.macroPickEvents=[]);
  events.push({id:'pick:'+(events.length+1),side,lane,minute:st.t,second:st.eventSecond||0,target:target.p.id,hunters:sides[side].map(p=>p.p.id),defenders:sides[1-side].map(p=>p.p.id),winner:result.winner});
}
function publicMacroPicks(r){
  if(!Array.isArray(r.macroPickEvents))return {};
  const a=r.macroPickEvents;
  return {macroPicks:{version:1,basis:'canonical-seeded-keys-v1',count:a.length,events:(a.length>24?[...a.slice(0,12),...a.slice(-12)]:a).map(e=>({...e,hunters:e.hunters.slice(),defenders:e.defenders.slice()}))}};
}
function recordedMacroPicksValid(p){
  if(p.macroPicks===undefined)return true;
  const m=p.macroPicks;
  return m?.version===1&&m.basis==='canonical-seeded-keys-v1'&&Number.isInteger(m.count)&&m.count>=0&&m.count<=180&&Array.isArray(m.events)&&m.events.length===Math.min(m.count,24)&&new Set(m.events.map(e=>e?.id)).size===m.events.length&&m.events.every((e,i)=>{
    const ordinal=m.count>24&&i>=12?m.count-24+i+1:i+1;
    if(!e||e.id!=='pick:'+ordinal||![0,1].includes(e.side)||![0,1].includes(e.winner)||!LANES.includes(e.lane)||!Number.isInteger(e.minute)||e.minute<1||!Number.isInteger(e.second)||e.second<0||e.second>=60||e.minute+e.second/60>p.duration)return false;
    return ['hunters','defenders'].every((k,j)=>Array.isArray(e[k])&&e[k].length>=(j?1:2)&&e[k].length<=(j?5:3)&&new Set(e[k]).size===e[k].length&&e[k].every(id=>p.sides?.[j?1-e.side:e.side]?.players?.some(x=>x[0]===id)))&&e.defenders.includes(e.target);
  });
}
