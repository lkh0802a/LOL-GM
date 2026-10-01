// ===== LOL GM: Match lineup assignment =====
// Registered players may occupy any game-role slot. This domain owns unique-five validation,
// role-fit lineup construction and starter assignment; p.role remains the player's primary identity.

function lineupRoleScore(p,role){return playerRoleRating(p,role)-medicalPerformancePenalty(p)*100}
function validLineupPlayer(db,team,p){return !!p&&!p.retired&&!medicalOut(p)&&
  (team.officialRosterView?officialPlayerCanRepresent(db,p,team):p.team===team.id)&&(team.roster||[]).includes(p.id)}
function validateStartingLineup(db,t,assignment=null,rosterOverride=null){
  const team=teamRef(db,t);if(!team)return {ok:false,errors:['팀을 찾을 수 없습니다']};
  const roster=new Set(rosterOverride||team.roster||[]),map=assignment||team.depthChart||{},errors=[],used=new Set(),planned=Array.isArray(rosterOverride);
  for(const role of ROLES){
    const pid=map[role],p=pid&&db.players[pid];
    if(!p||!roster.has(pid)||(!planned&&!(team.officialRosterView?officialPlayerCanRepresent(db,p,team):p.team===team.id)))errors.push(ROLE_KO[role]+' 슬롯에 등록 선수가 필요합니다');
    else if(medicalOut(p))errors.push(p.name+' 선수는 치료 중이어서 출전할 수 없습니다');
    else if(used.has(pid))errors.push(p.name+' 선수를 두 포지션에 동시에 선발할 수 없습니다');
    else used.add(pid);
  }
  return {ok:errors.length===0,errors,assignment:Object.fromEntries(ROLES.map(r=>[r,map[r]||null]))};
}
function bestStartingLineup(db,t,locked={},scrim=false){
  const team=teamRef(db,t);if(!team)return {};
  const eligible=p=>validLineupPlayer(db,team,p)&&(!scrim||!medicalScrimRest(db,p));
  const players=(team.roster||[]).map(id=>db.players[id]).filter(eligible),base={},used=new Set();
  for(const role of ROLES){const p=locked[role]&&db.players[locked[role]];if(eligible(p)&&!used.has(p.id)){base[role]=p.id;used.add(p.id)}}
  const roles=ROLES.filter(r=>!base[r]),available=players.filter(p=>!used.has(p.id));if(available.length<roles.length)return base;
  const scores=Object.fromEntries(available.map(p=>[p.id,Object.fromEntries(roles.map(role=>[role,lineupRoleScore(p,role)]))]));
  let dp=new Map([[0,{score:0,map:{...base}}]]);
  for(const p of available){
    const next=new Map(dp);
    for(const [mask,state] of dp)for(let i=0;i<roles.length;i++){
      const bit=1<<i;if(mask&bit)continue;const role=roles[i],nmask=mask|bit,score=state.score+scores[p.id][role],prev=next.get(nmask);
      if(!prev||score>prev.score)next.set(nmask,{score,map:{...state.map,[role]:p.id}});
    }
    dp=next;
  }
  return dp.get((1<<roles.length)-1)?.map||base;
}
function initializeDepthChart(db,t,force=false){
  const team=teamRef(db,t);if(!team)return;team.depthChart=team.depthChart||{};
  const locked={};if(!force){const used=new Set();for(const role of ROLES){const p=team.depthChart[role]&&db.players[team.depthChart[role]];if(validLineupPlayer(db,team,p)&&!used.has(p.id)){locked[role]=p.id;used.add(p.id)}}}
  team.depthChart=bestStartingLineup(db,team,locked);return team.depthChart;
}
function starterFor(db,team,role){
  if(!team||!ROLES.includes(role))return null;team.depthChart=team.depthChart||{};
  const id=team.depthChart[role],p=id&&db.players[id],unique=id&&ROLES.every(r=>r===role||team.depthChart[r]!==id);
  if(validLineupPlayer(db,team,p)&&unique)return p;
  initializeDepthChart(db,team,false);const fixed=team.depthChart[role]&&db.players[team.depthChart[role]];return validLineupPlayer(db,team,fixed)?fixed:null;
}
function setDepthStarter(db,t,role,p,source='manager',silent=false){
  const team=teamRef(db,t),player=playerRef(db,p);if(!team||!player)return {ok:false,reason:'팀 또는 선수를 찾을 수 없습니다'};
  if(!ROLES.includes(role))return {ok:false,reason:'유효하지 않은 경기 포지션입니다'};
  if(!validLineupPlayer(db,team,player))return {ok:false,reason:'해당 스쿼드 등록 선수가 아닙니다'};
  team.depthChart=team.depthChart||{};const old=team.depthChart[role]||null;
  for(const r of ROLES)if(r!==role&&team.depthChart[r]===player.id)delete team.depthChart[r];
  team.depthChart[role]=player.id;
  if(!silent&&old!==player.id)recordPlayerEvent(player,'starter_change',db.year,{team:team.id,role,from:old,to:player.id,date:db.worldDate,source});
  return {ok:true,old,to:player.id};
}
function lineupAssignmentScore(db,t,map){
  const team=teamRef(db,t);return ROLES.reduce((sum,role)=>{const p=map&&map[role]&&db.players[map[role]];return sum+(validLineupPlayer(db,team,p)?lineupRoleScore(p,role):0)},0);
}
function aiReviewDepthChart(db,t){
  const team=teamRef(db,t);if(!team||team.id===managedTeamId(db))return;initializeDepthChart(db,team,false);
  const cur={...team.depthChart},best=bestStartingLineup(db,team,{}),curScore=lineupAssignmentScore(db,team,cur),bestScore=lineupAssignmentScore(db,team,best);
  const troubled=ROLES.some(role=>{const p=cur[role]&&db.players[cur[role]];return p&&((p.form||0)<=-6||p.condition<60||p.wantsOut)});
  if(!validateStartingLineup(db,team,cur).ok||bestScore-curScore>=5||(troubled&&bestScore-curScore>=3)){
    team.depthChart=best;for(const role of ROLES){const pid=best[role];if(pid&&cur[role]!==pid)recordPlayerEvent(db.players[pid],'starter_change',db.year,{team:team.id,role,from:cur[role]||null,to:pid,date:db.worldDate,source:'ai'})}
  }
}
