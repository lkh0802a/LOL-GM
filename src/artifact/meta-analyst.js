// Fictional interpretation policy, not probabilities or altered source samples.
const ANALYST_REPORT_POLICY=Object.freeze({patchDetail:55,patternDetail:75,smallSample:10,visiblePatches:3});
function ownAnalystInterpretation(db,filter={},cid=null){
  const team=filter.team||managedTeamId(db),out={allowed:false,team,level:0,available:false,evidence:null,warnings:[],patterns:[]};
  if(db.world?.fired||!managerControlsSquad(db,db.teams[team]))return out;
  out.allowed=true;const club=db.teams[team],scoped={...filter,team};
  // The staff reader normally migrates legacy rosters. A shallow view keeps
  // this report pure while reusing the existing specialty/overlap calculation.
  const members=Array.isArray(club.staffRoster)?club.staffRoster:(club.staff&&typeof club.staff==='object'?Object.values(club.staff).filter(Boolean):[]),view={...club,staffRoster:members.slice()};
  out.available=staffByRole(view,'analyst').length>0;
  const ability=staffAnalysisFor(view,'data');
  out.level=out.available?(ability>=ANALYST_REPORT_POLICY.patternDetail?2:ability>=ANALYST_REPORT_POLICY.patchDetail?1:0):0;
  const practice=ownPracticeComparison(db,scoped,cid),tactics=ownTacticInsights(db,scoped,cid),composition=cid?championCompositionInsights(db,cid,scoped):null,order=cid?draftOrderInsights(db,cid,scoped):null,patches=new Map();
  let official=0,unknownPatch=0;
  for(const row of metaRowsFiltered(db,scoped))for(const side of row.sides||[]){
    if(!metaSideMatches(row,side,scoped)||!practicePickMatches(side.picks,scoped,cid))continue;
    official++;if(typeof row.patch!=='string'||!row.patch){unknownPatch++;continue}
    let x=patches.get(row.patch);if(!x){x={patch:row.patch,g:0,w:0};patches.set(row.patch,x)}x.g++;if(side.win)x.w++;
  }
  const practicePatches=new Set();let unknownPracticePatch=0;
  if(!practice.officialOnly)for(const row of Array.isArray(club.practiceEvidence)?club.practiceEvidence:[]){
    if(row?.version!==1||row.team!==team||typeof row.observer!=='string'||!Array.isArray(row.games)||!practiceRowMatches(row,scoped)||!['engine','aggregate'].includes(row.model))continue;
    for(const game of row.games){if(typeof game?.win!=='boolean'||!validPracticePicks(game.picks)||(scoped.color&&game.color!==scoped.color)||!practicePickMatches(game.picks,scoped,cid))continue;
      if(typeof row.patch==='string'&&row.patch)practicePatches.add(row.patch);else unknownPracticePatch++;
    }
  }
  const patchRows=[...patches.values()].sort((a,b)=>b.g-a.g||a.patch.localeCompare(b.patch)),patchIds=new Set([...patches.keys(),...practicePatches]);
  out.evidence={official,practice,tactics:{known:tactics.known,unknown:tactics.unknown},composition:composition?{sample:composition.sample,complete:composition.complete,partial:composition.partial}:null,order:order?{known:order.known,unknown:order.unknown}:null,officialPatches:patches.size,practicePatches:practicePatches.size,combinedPatches:patchIds.size,unknownPatch,unknownPracticePatch,currentPatchGames:patches.get(db.patch.id)?.g||0};
  // Coverage and caution do not disappear when the staff interpretation is weak.
  if(!official)out.warnings.push('no-official');else if(official<ANALYST_REPORT_POLICY.smallSample)out.warnings.push('small-official');
  if(patchIds.size>1)out.warnings.push('mixed-patches');
  if(unknownPatch||unknownPracticePatch)out.warnings.push('unknown-patch');
  if(practice.aggregate.games)out.warnings.push('aggregate-model');
  if(practice.unknownGames||practice.legacyGames)out.warnings.push('unknown-practice');
  if(practice.officialOnly)out.warnings.push('official-filter');
  if(tactics.unknown||(composition&&composition.partial)||(order&&order.unknown))out.warnings.push('incomplete-context');
  if(out.level>=1)for(const p of patchRows.slice(0,ANALYST_REPORT_POLICY.visiblePatches))out.patterns.push({kind:'patch',...p});
  if(out.level>=2){
    if(composition)for(const p of composition.pairs.slice(0,3))out.patterns.push({kind:'copick',champ:p.champ,g:p.g,w:p.w});
    if(order?.known)out.patterns.push({kind:'order',opening:order.opening,openingWins:order.openingWins,followup:order.followup,followupWins:order.followupWins});
    const variable=tactics.axes.filter(x=>x.distinct>1).map(x=>({axis:x.key,settings:x.distinct}));if(variable.length)out.patterns.push({kind:'tactic-context',known:tactics.known,axes:variable});
  }
  return out;
}
