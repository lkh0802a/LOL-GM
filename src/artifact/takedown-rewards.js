// Existing aggregate payouts, not exact server rounding or physical assist range.
function matchTakedownActors(st,killer,victim,assists){
  if(matchEnded(st)||!victim||![0,1].includes(victim.side)||!st.sides[victim.side].ps.includes(victim)||!alive(st,victim)||!Array.isArray(assists))return null;
  const enemy=st.sides[1-victim.side].ps;
  if(killer&&!enemy.includes(killer)||assists.some(p=>!p||![0,1].includes(p.side)||!st.sides[p.side].ps.includes(p)))return null;
  const rules=st.patch.rules;
  if(![rules.killGold,rules.assistGold].every(x=>Number.isFinite(x)&&x>=0))return null;
  return [...new Set(assists)].filter(p=>p!==killer&&p.side!==victim.side);
}
function killPlayer(st,killer,victim,assists,reason){
  const eligible=matchTakedownActors(st,killer,victim,assists);
  if(!eligible)return false;
  victim.d++; victim.hp=1;
  const sec=victim.lvl*2.5+6+Math.max(0,st.t-15)*0.9;
  victim.deadUntil=st.t+sec/60; victim.penalty=Math.min(1,(sec+25)/60);
  const payouts=[],r=st.patch.rules,credit=(p,kind,gold,xp)=>{
    if(kind==='kill'){p.k++;st.sides[p.side].kills++}else p.a++;
    addGold(p,gold);addXp(p,xp,'champion');
    const beforeGold=p.goldEarned,beforeXp=p.xp;roleQuestTakedown(st,p);
    payouts.push({player:p.p.id,kind,gold,xp,questGold:p.goldEarned-beforeGold,questXp:p.xp-beforeXp});
  };
  if(killer)credit(killer,'kill',r.killGold,140+victim.lvl*20);
  for(const p of eligible)credit(p,'assist',Math.round(r.assistGold/eligible.length),70);
  const receipt={id:victim.p.id+':'+victim.d,side:1-victim.side,victim:victim.p.id,killer:killer?.p.id||null,assistPool:r.assistGold,assistPaid:payouts.filter(x=>x.kind==='assist').reduce((n,x)=>n+x.gold,0),payouts};
  const lane=LANES.find(l=>LANE_ROLES[l].includes(victim.role))||'mid';
  st.lanePush[lane]+= victim.side===0?-0.35:0.35; st.lanePush[lane]=clamp(st.lanePush[lane],-1,1);
  const fb=st.firsts.blood===undefined; if(fb) st.firsts.blood=killer?killer.side:1-victim.side;
  const second=log(st,`${killer?pname(st,killer):'처형'} → ${pname(st,victim)} 처치${fb?' (퍼스트 블러드)':''}${reason?' · '+reason:''}`,{side:killer?killer.side:1-victim.side,major:true,kind:'kill'});
  (st.takedownEvents||(st.takedownEvents=[])).push({...receipt,minute:st.t,second});
  return true;
}


function recordedTakedownsValid(p){
  if(p.takedowns===undefined)return true;
  const t=p.takedowns;
  return t?.version===1&&Number.isInteger(t.count)&&t.count>=0&&t.count===p.sides?.flatMap(s=>s.players||[]).reduce((n,x)=>n+x[5],0)&&Array.isArray(t.events)&&t.events.length===Math.min(24,t.count)&&new Set(t.events.map(e=>e?.id)).size===t.events.length&&t.events.every(e=>{
    if(!e||typeof e.id!=='string'||![0,1].includes(e.side)||!Number.isInteger(e.minute)||e.minute<1||!Number.isInteger(e.second)||e.second<0||e.second>=60||e.minute+e.second/60>p.duration||!Number.isFinite(e.assistPool)||e.assistPool<0||!Number.isFinite(e.assistPaid)||e.assistPaid<0||!p.sides?.[1-e.side]?.players?.some(x=>x[0]===e.victim)||!Array.isArray(e.payouts)||e.payouts.length>5||e.payouts.some(x=>!x||typeof x!=='object')||new Set(e.payouts.map(x=>x?.player)).size!==e.payouts.length)return false;
    const kills=e.payouts.filter(x=>x.kind==='kill'),assists=e.payouts.filter(x=>x.kind==='assist');
    return (e.killer===null?kills.length===0:kills.length===1&&kills[0].player===e.killer)&&assists.length<=(e.killer===null?5:4)&&e.assistPaid===assists.reduce((n,x)=>n+x.gold,0)&&e.payouts.every(x=>p.sides[e.side]?.players?.some(v=>v[0]===x.player)&&['kill','assist'].includes(x.kind)&&['gold','xp','questGold','questXp'].every(k=>Number.isFinite(x[k])&&x[k]>=0)&&(x.kind!=='assist'||x.gold===Math.round(e.assistPool/assists.length)));
  });
}
