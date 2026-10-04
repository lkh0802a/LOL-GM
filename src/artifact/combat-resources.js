// Ordered aggregate rounds, not exact casts/geometry. A packet prepared while
// alive may resolve after its actor's budget reaches zero in that same round.
function fightPacketOwned(st,f,t){
  return f&&t&&f!==t&&[0,1].includes(f.side)&&t.side===1-f.side&&f.ps?.side===f.side&&t.ps?.side===t.side&&st.sides?.[f.side]?.ps?.includes(f.ps)&&st.sides?.[t.side]?.ps?.includes(t.ps);
}
function applyFightDamage(st,f,t,damage,isTeamfight,prepared=null){
  if(matchEnded(st)||!fightPacketOwned(st,f,t)||!f.alive||!t.alive||!alive(st,f.ps)||!alive(st,t.ps)||!Number.isFinite(f.hp)||!Number.isFinite(t.hp)||f.hp<0||t.hp<=0||!Number.isFinite(damage)||damage<=0||(!(f.hp>0)&&!prepared?.has(f)))return 0;
  const applied=Math.min(damage,t.hp),dealt=Math.round(applied*.9);
  t.hp-=applied;t.hitters.add(f);
  f.ps.dmg+=dealt;matchQuestEvent(st,f.ps,{damage:dealt});t.ps.dmgTaken+=dealt;
  if(isTeamfight)f.ps.teamfightDmg+=dealt;
  if(t.hp<=0)t.last=f;
  return dealt;
}
function applyPreparedFightRound(st,actors,packets,isTeamfight){
  if(matchEnded(st)||!Array.isArray(actors)||!Array.isArray(packets))return false;
  const prepared=new Set(actors.filter(f=>f.alive&&Number.isFinite(f.hp)&&f.hp>0&&alive(st,f.ps)));
  // Whole packet input preflight, before damage/quest/hitters mutate. Callback
  // exceptions are not covered by this guard and no new rollback policy is made.
  if(packets.some(p=>!Array.isArray(p)||p.length!==3||!prepared.has(p[0])||!prepared.has(p[1])||!fightPacketOwned(st,p[0],p[1])||!Number.isFinite(p[2])||p[2]<=0))return false;
  for(const [f,t,d] of packets)applyFightDamage(st,f,t,d,isTeamfight,prepared);
  return true;
}

// Preserve existing nonlethal lane floors, but a cost cannot heal its actor.
// HP is a 0..1 aggregate fraction; no damage-stat/EHP conversion is inferred.
function applyLaningHpCost(st,p,cost,floor){
  if(matchEnded(st)||!p||![0,1].includes(p.side)||!st.sides?.[p.side]?.ps?.includes(p)||!alive(st,p)||!Number.isFinite(p.hp)||p.hp<0||p.hp>1||!Number.isFinite(cost)||cost<0||!Number.isFinite(floor)||floor<0||floor>1)return 0;
  const before=p.hp;p.hp=Math.min(before,Math.max(floor,before-cost));return before-p.hp;
}
