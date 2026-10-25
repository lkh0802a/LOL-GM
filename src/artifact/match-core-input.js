// Trusted boundary after the existing draft/registration owners have resolved a game.
// Projects identity and pinned metadata only; does not admit physical source data.
function matchCoreInputFromResolvedDraft(matchDb,prepared,draft,matchId){
  matchCoreAssert(matchCoreRecord(matchDb)&&matchCoreRecord(prepared)&&matchCoreRecord(draft),'resolved game required');
  const blue=prepared.blue,red=prepared.red,seed=prepared.gseed,picks=draft.picks,patch=matchDb.patch;
  matchCoreAssert(matchCoreId(matchId)&&typeof seed==='string'&&matchCoreId(blue)&&matchCoreId(red)&&blue!==red,'resolved game identity required');
  matchCoreAssert(matchCoreRecord(patch),'resolved patch required');
  const patchId=patch.id,rawRevision=patch._revision,revision=rawRevision===undefined?0:rawRevision,sourceVersion=patch.championSource?.version;
  matchCoreAssert(matchCoreId(patchId)&&matchCoreTime(revision)&&typeof sourceVersion==='string'&&/^\d+\.\d+\.\d+$/.test(sourceVersion),'pinned patch metadata required');
  matchCoreAssert(Array.isArray(picks)&&picks.length===2,'resolved picks required');
  const seenPlayers=new Set(),seenChampions=new Set();
  const teams=[blue,red].map((teamId,side)=>{
    const team=matchDb.teams?.[teamId],selected=picks[side];
    matchCoreAssert(team?.id===teamId&&matchCoreRecord(selected),'resolved team/picks required');
    // Validate the submitted assignment. starterFor/initializeDepthChart can repair it,
    // so they must not be called from this read-only admission boundary.
    const lineup=validateStartingLineup(matchDb,team);
    matchCoreAssert(lineup.ok,'resolved lineup invalid');
    const actors=ROLES.map(role=>{
      const id=lineup.assignment[role],player=matchDb.players?.[id],championId=selected[role];
      matchCoreAssert(matchCoreId(id)&&player?.id===id&&validLineupPlayer(matchDb,team,player)&&!seenPlayers.has(id),'resolved participant ineligible');
      matchCoreAssert(matchCoreId(championId)&&Object.hasOwn(patch.champions||{},championId)&&
        patch.champions[championId]?.id===championId&&!seenChampions.has(championId),'resolved champion invalid');
      seenPlayers.add(id);seenChampions.add(championId);
      return {id,role,championId};
    });
    return {id:teamId,side:side===0?'BLUE':'RED',actors};
  });
  return {matchId,seed,patchSnapshot:{id:patchId,revision,sourceVersion},teams};
}
