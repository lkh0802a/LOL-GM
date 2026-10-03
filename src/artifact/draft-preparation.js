// Read the real live pick context; never create a speculative opponent session.
// This is an explanation consumer of draftPickValue, not another selection policy.
function draftPreparationReport(state,side,{role=null}={}){
  const base={allowed:false,reason:'no-authority',rows:[]};
  if(!state||![0,1].includes(side))return base;
  const db=state.db,team=db.teams[state.teamIds[side]];
  if(db.world?.fired||!team||team.active===false||!managerControlsSquad(db,team))return base;
  const turn=draftTurn(state);
  if(!turn)return {...base,allowed:true,reason:'complete'};
  if(turn.side!==side)return {...base,allowed:true,reason:'other-turn'};
  if(turn.kind!=='P')return {...base,allowed:true,reason:'ban-turn'};
  if(role!==null&&!ROLES.includes(role))return {...base,allowed:true,reason:'invalid-role'};
  // Use the session's actual lineup (including official registration view),
  // without starterFor repairs or private opponent player access.
  const ids=new Set();
  for(const r of ROLES){const p=state.roster[side]?.[r];
    if(!p||db.players[p.id]!==p||!(team.roster||[]).includes(p.id)||ids.has(p.id))return {...base,allowed:true,reason:'missing-lineup'};
    ids.add(p.id);
  }
  const mine=state.pickList[side].map(id=>db.patch.champions[id]).filter(Boolean),rows=[];
  for(const c of draftLegalChampions(state,role)){
    const fits=draftFeasibleRoles(state,side,c.id).filter(r=>!role||r===role).map(r=>{
      const factors=draftPickValue(state,side,r,c.id,mine),player=state.roster[side][r];
      return {role:r,player:player.id,factors,score:factors.total,opponentPicks:draftRolePossibilities(state,1-side,r)};
    }).sort((a,b)=>b.score-a.score||ROLES.indexOf(a.role)-ROLES.indexOf(b.role));
    if(fits.length)rows.push({champ:c.id,best:fits[0],fits});
  }
  rows.sort((a,b)=>b.best.score-a.best.score||a.champ.localeCompare(b.champ));
  return {...base,allowed:true,reason:null,rows,cursor:state.cursor,patch:db.patch.id,
    practice:!!state.ctx.practice,ownPicks:state.pickList[side].slice(),opponentPicks:state.pickList[1-side].slice()};
}
