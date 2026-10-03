// Event-time explanations are team-owned observations, not public meta or
// replayed estimates. No new score coefficient, random draw or match effect.
function manualDraftEvidence(state,choice){
  if(choice.source!=='player'||draftTurn(state)?.kind!=='P')return null;
  const side=draftTurn(state).side,report=draftPreparationReport(state,side),row=report.rows.find(x=>x.champ===choice.champ);
  if(!row)return null;
  const fit=row.best,meta=draftMetaEvidence(state,side,row.champ),comp=draftCompositionEvidence(state,side,row.champ,fit.factors.comp);
  return {version:1,source:'live-manual-pick',team:state.teamIds[side],turn:state.cursor,
    date:state.db.worldDate,patch:state.db.patch.id,champ:row.champ,role:fit.role,player:fit.player,
    playerName:state.roster[side][fit.role].name,champName:championDisplayName(state.db.patch.champions[row.champ]),
    ownPicks:report.ownPicks,opponentPicks:report.opponentPicks,opponentRoles:fit.opponentPicks,
    factors:{...fit.factors},meta:{globalSample:meta.globalSample,regionalSample:meta.regionalSample,confidence:meta.confidence},
    reasons:comp.reasons.slice()};
}
function recordedManualDraftEvidence(forced,game){
  if(!Array.isArray(forced?.manualEvidence)||![game?.picks,game?.bans].every(a=>Array.isArray(a)&&a.length===2&&a.every(Array.isArray))||!validDraftSequence(game.draftSequence,game.picks,game.bans))return null;
  const out={},seen=new Set();
  for(const e of forced.manualEvidence.slice(0,10)){
    const side=e?.team===game.blue?0:e?.team===game.red?1:-1,
      event=game.draftSequence.events.find(x=>x[0]===e?.turn),f=e?.factors,
      keys=['meta','mastery','comp','counter','flex','series'];
    if(e?.version!==1||e.source!=='live-manual-pick'||side<0||!event||event[1]!=='P'||event[2]!==side||event[3]!==e.champ||seen.has(e.turn)||!ROLES.includes(e.role)||typeof e.player!=='string'||typeof e.playerName!=='string'||typeof e.champName!=='string'||
      !/^\d{4}-\d{2}-\d{2}$/.test(e.date||'')||typeof e.patch!=='string'||e.date!==game.date||e.patch!==game.patch||
      !f||![...keys,'total'].every(k=>Number.isFinite(f[k]))||Math.abs(f.total-keys.reduce((n,k)=>n+f[k],0))>1e-9||
      !['ownPicks','opponentPicks','opponentRoles'].every(k=>Array.isArray(e[k])&&e[k].length<=5&&e[k].every(x=>typeof x==='string'))||
      !Array.isArray(e.reasons)||!e.reasons.every(x=>typeof x==='string')||!e.meta||!['globalSample','regionalSample','confidence'].every(k=>Number.isFinite(e.meta[k])))continue;
    const prefix=game.draftSequence.events.filter(x=>x[0]<e.turn&&x[1]==='P');
    if(JSON.stringify(e.ownPicks)!==JSON.stringify(prefix.filter(x=>x[2]===side).map(x=>x[3]))||
      JSON.stringify(e.opponentPicks)!==JSON.stringify(prefix.filter(x=>x[2]!==side).map(x=>x[3]))||
      !e.opponentRoles.every(id=>e.opponentPicks.includes(id)))continue;
    seen.add(e.turn);(out[e.team]||(out[e.team]=[])).push({version:1,source:e.source,team:e.team,turn:e.turn,date:e.date,patch:e.patch,champ:e.champ,role:e.role,player:e.player,playerName:e.playerName,champName:e.champName,
      ownPicks:e.ownPicks.slice(),opponentPicks:e.opponentPicks.slice(),opponentRoles:e.opponentRoles.slice(),
      factors:Object.fromEntries([...keys,'total'].map(k=>[k,f[k]])),meta:Object.fromEntries(['globalSample','regionalSample','confidence'].map(k=>[k,e.meta[k]])),reasons:e.reasons.slice(0,6)});
  }
  return Object.keys(out).length?out:null;
}
function recordedDraftReview(db,rec,game,team=managedTeamId(db)){
  const club=db.teams[team],base={allowed:false,reason:'no-authority',rows:[]};
  // Check observer before touching any team's stored private evidence.
  if(db.world?.fired||!club||club.active===false||!managerControlsSquad(db,club)||![game?.blue,game?.red].includes(team))return base;
  const rows=game.draftEvidence?.[team];if(!rows?.length)return {...base,allowed:true,reason:'not-recorded'};
  const clean=recordedManualDraftEvidence({manualEvidence:rows},game)?.[team]||[],side=game.blue===team?0:1;
  const valid=clean.filter(e=>e.patch===rec.patch&&observedMetaDate(db,e));
  return {...base,allowed:true,reason:valid.length?null:'unverified-source',rows:valid.map(e=>({...e,
    finalRole:ROLES[game.picks?.[side]?.indexOf(e.champ)]||null})),team};
}
