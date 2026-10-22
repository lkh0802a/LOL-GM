// Partner choice uses each club's own information, never the rival's private
// lineup, health or attributes. Public roster estimates are not a lineup claim.
function scrimOwnStarters(db,t){
  const view={...t,depthChart:{...(t.depthChart||{})}};
  return ROLES.map(role=>starterFor(db,view,role));
}
function scrimObservedTeamStrength(db,observer,target){
  const human=!db.world?.fired&&db.world?.manage==='manual'&&managerControlsSquad(db,observer),
    internal=human?managerControlsSquad(db,target):parentTeamOf(db,observer)?.id===parentTeamOf(db,target)?.id;
  if(internal)return avg(scrimOwnStarters(db,target).map((p,i)=>p?playerRoleRating(p,ROLES[i]):40));
  const owner=aiScoutingOwner(db,observer),read=human?{...db,scout:{}}:db,scores={};
  for(const id of target.roster||[]){
    const p=db.players[id];if(!p||p.team!==target.id||p.retired||!ROLES.includes(p.role))continue;
    let score;
    if(human){
      const report=db.scout?.[id];if(report!=null)read.scout[id]=typeof report==='object'?{...report}:report;
      score=obsOvr(read,p);if(!Number.isFinite(score))score=scoutPublicSignal(read,p).ability;
    }else{
      const report=owner?.scoutingState?.reports?.[id];
      score=(Number.isFinite(report?.ability)&&Number.isFinite(report?.potential)?aiMarketObservation(db,p,owner):aiPublicMarketObservation(db,p,owner)).ability;
    }
    scores[p.role]=Math.max(scores[p.role]??-Infinity,score);
  }
  return avg(ROLES.map(role=>scores[role]??40));
}
function scrimStrengthReader(db){
  const values=new Map();
  return (observer,target)=>{
    const key=JSON.stringify([observer.id,target.id]);
    if(!values.has(key))values.set(key,scrimObservedTeamStrength(db,observer,target));
    return values.get(key);
  };
}
