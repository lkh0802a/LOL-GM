// S0 foundation only: identity, pinned metadata and resumable match-local state.
// Physical mechanics/source admission and actual nexus results are later slices.
function matchCoreRecord(x){return x!==null&&typeof x==='object'&&!Array.isArray(x)}
function matchCoreId(x){return typeof x==='string'&&x.length>0}
function matchCoreTime(x){return Number.isSafeInteger(x)&&x>=0}
function matchCoreAssert(ok,message){if(!ok)throw new Error('MATCH_CORE '+message)}
function matchCoreClone(x){return JSON.parse(JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)
  ?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v))}
function matchCoreKeys(x,keys){return matchCoreRecord(x)&&Object.keys(x).every(k=>keys.includes(k))}
function matchCoreCommandKey(teamId,id){return JSON.stringify([teamId,id])}
function matchCoreRequestKey(r){return JSON.stringify([r.type,r.actorId,r.type==='wait'?r.durationMs:r.targetId])}
function createMatchCoreState(spec){
  matchCoreAssert(matchCoreRecord(spec),'invalid match identity');
  const matchId=spec.matchId,seed=spec.seed,p=spec.patchSnapshot,inputTeams=spec.teams;
  matchCoreAssert(matchCoreId(matchId)&&typeof seed==='string','invalid match identity');
  matchCoreAssert(matchCoreRecord(p),'patch metadata required');
  const patchId=p.id,revision=p.revision,sourceVersion=p.sourceVersion;
  matchCoreAssert(matchCoreId(patchId)&&matchCoreTime(revision)&&matchCoreId(sourceVersion),'patch metadata required');
  matchCoreAssert(Array.isArray(inputTeams)&&inputTeams.length===2,'two teams required');
  const teams=[],participants=[],seen=new Set(),teamIds=new Set(),sides=new Set();
  for(const team of inputTeams.slice()){
    matchCoreAssert(matchCoreRecord(team),'invalid team/side');
    const teamId=team.id,side=team.side,inputActors=team.actors;
    matchCoreAssert(matchCoreId(teamId)&&!teamIds.has(teamId)&&
      ['BLUE','RED'].includes(side)&&!sides.has(side),'invalid team/side');
    teamIds.add(teamId);sides.add(side);teams.push(Object.freeze({id:teamId,side}));
    matchCoreAssert(Array.isArray(inputActors)&&inputActors.length===5,'five actors per side required');
    const roles=new Set();
    for(const actor of inputActors.slice()){
      matchCoreAssert(matchCoreRecord(actor),'invalid participant identity/role');
      const id=actor.id,role=actor.role,championId=actor.championId;
      matchCoreAssert(matchCoreId(id)&&!seen.has(id)&&ROLES.includes(role)&&!roles.has(role)&&matchCoreId(championId),'invalid participant identity/role');
      seen.add(id);roles.add(role);participants.push(Object.freeze({id,teamId,role,championId}));
    }
  }
  const compare=(a,b)=>a<b?-1:a>b?1:0;
  teams.sort((a,b)=>compare(a.side,b.side));participants.sort((a,b)=>compare(a.id,b.id));
  const actors=Object.create(null),rng=Object.create(null);
  for(const actor of participants)actors[actor.id]={generation:0,waitingFor:null};
  for(const channel of ['decision','execution'])rng[channel]=new RNG(seed,'match-core-v1/'+channel);
  return {schema:1,engine:'causal-foundation-v1',matchId,seed,
    patchSnapshot:Object.freeze({id:patchId,revision,sourceVersion}),
    mechanicsStatus:'NOT_IMPLEMENTED',result:null,clockMs:0,
    teams:Object.freeze(teams),participants:Object.freeze(participants),actors,
    queue:[],nextEventSeq:0,commands:Object.create(null),receipts:[],rng};
}
