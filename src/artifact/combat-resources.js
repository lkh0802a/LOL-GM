// Consume the target's remaining aggregate EHP budget. The existing .9 report
// conversion stays a proxy, not physical HP or per-spell damage. Queued attack
// ordering and RNG are unchanged; a dead target cannot receive another packet.
function applyFightDamage(st,f,t,damage,isTeamfight){
  if(matchEnded(st)||t.hp<=0||!(damage>0))return 0;
  const applied=Math.min(damage,t.hp),dealt=Math.round(applied*.9);
  t.hp-=applied;t.hitters.add(f);
  f.ps.dmg+=dealt;matchQuestEvent(st,f.ps,{damage:dealt});t.ps.dmgTaken+=dealt;
  if(isTeamfight)f.ps.teamfightDmg+=dealt;
  if(t.hp<=0)t.last=f;
  return dealt;
}

