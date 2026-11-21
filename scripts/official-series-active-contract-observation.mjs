// Synthetic active negotiation and series resumption; no real user save is touched.
import {readFile} from 'node:fs/promises';
import {runEngineFixture} from './test-harness.mjs';
const fixture=JSON.parse(await readFile(new URL('../docs/evidence/unemployed-season-fixture-2026-10-08.json',import.meta.url)));
await runEngineFixture(String.raw`(()=>{
 const db=unpackDB(JSON.stringify(FIXTURE)),team=managedTeamId(db);runOffseason(db);closeMarket(db);startWorldSeason(db,team,'pending-frame-authority-proof');
 const owned=managedTeam(db).roster.map(id=>db.players[id]).find(p=>p?.contract&&!p.retired),target=Object.values(db.players).find(p=>p&&!p.retired&&p.team!==team);
 if(!owned||!target)throw Error('synthetic candidate unavailable');
 const interest=setRecruitmentPriority(db,target.id,'A'),neg=startNegotiation(db,owned.id,'renewal');
 if(!interest.ok||!neg.ok)throw Error('synthetic recruitment/negotiation could not be created: '+(neg.msg||interest.msg));
 const negId=neg.neg.id,targetId=target.id;
 let days=0;while(!db.world.pendingOfficial?.queue?.length&&++days<60)playWorldDay(db);
 if(days>=60)throw Error('synthetic pending match unavailable');
 const firstSelection=pendingOfficialSelectionSetup(db);
 if(firstSelection)applyPendingOfficialSelection(db,firstSelection.prompt.mode==='first'?{kind:'side',value:'blue'}:{kind:firstSelection.prompt.remaining,value:firstSelection.prompt.remaining==='side'?'blue':'first'});
 pendingOfficialDraftSetup(db);resolvePendingOfficialMatch(db,null);
 const q=db.world.pendingOfficial?.queue?.[0];if(!q?.session?.games?.length)throw Error('synthetic first set did not leave a pending series');
 const firstGames=q.session.games.length,snapshot=packDB(db),savedSession=JSON.stringify(q.session),restored=unpackDB(snapshot),rq=restored.world.pendingOfficial.queue[0];
 const restoredMatches=JSON.stringify(rq.session)===savedSession,sourceBefore=packDB(db);
 const beforeRecords=JSON.stringify({neg:db.world.negotiations?.[negId],target:db.world.recruitment?.targets?.[targetId]});
 const restoredRecords=JSON.stringify({neg:restored.world.negotiations?.[negId],target:restored.world.recruitment?.targets?.[targetId]});
 const damaged=unpackDB(snapshot);damaged.world.pendingOfficial.queue[0].session.seed='synthetic-invalid-seed';
 const damagedBefore=packDB(damaged);let damagedError=null;
 try{resolvePendingOfficialMatch(damaged,null)}catch(error){damagedError=error.message}
 const damagedUnchanged=packDB(damaged)===damagedBefore;
 const uninterrupted=resolvePendingOfficialMatch(db,null),resumed=resolvePendingOfficialMatch(restored,null);
 const gameWinner=result=>result.game?.sides?.[result.game.winner]?.team?.id??null;
 const afterA=packDB(db),afterB=packDB(restored),parsedA=JSON.parse(afterA),parsedB=JSON.parse(afterB);
 const changedKeys=Array.from(new Set([...Object.keys(parsedA),...Object.keys(parsedB)])).filter(k=>JSON.stringify(parsedA[k])!==JSON.stringify(parsedB[k]));
 const changedWorldKeys=Array.from(new Set([...Object.keys(parsedA.world||{}),...Object.keys(parsedB.world||{})])).filter(k=>JSON.stringify(parsedA.world?.[k])!==JSON.stringify(parsedB.world?.[k]));
 const fieldShape=(w,k)=>Object.hasOwn(w||{},k)?{present:true,kind:Array.isArray(w[k])?'array':typeof w[k],keys:w[k]&&typeof w[k]==='object'?Object.keys(w[k]):null,targets:w[k]?.targets&&typeof w[k].targets==='object'?Object.keys(w[k].targets).length:null}:{present:false};
 const worldDifference=Object.fromEntries(changedWorldKeys.map(k=>[k,{uninterrupted:fieldShape(parsedA.world,k),resumed:fieldShape(parsedB.world,k)}]));
 const normalizedA=packDB(unpackDB(afterA)),normalizedB=packDB(unpackDB(afterB));
 const recordsAfterA=JSON.stringify({neg:db.world.negotiations?.[negId],target:db.world.recruitment?.targets?.[targetId]}),recordsAfterB=JSON.stringify({neg:restored.world.negotiations?.[negId],target:restored.world.recruitment?.targets?.[targetId]});
 console.log('OFFICIAL_ACTIVE_CONTRACT_OBSERVATION '+JSON.stringify({synthetic:true,days,firstGames,negStatus:JSON.parse(beforeRecords).neg?.status,targetStage:JSON.parse(beforeRecords).target?.stage,recordsRestored:beforeRecords===restoredRecords,recordsMatchAfter:recordsAfterA===recordsAfterB,damagedError,damagedUnchanged,
  restoredMatches,firstGame:JSON.parse(savedSession).games[0],winnerA:gameWinner(uninterrupted),winnerB:gameWinner(resumed),sameWinner:gameWinner(uninterrupted)!==null&&gameWinner(uninterrupted)===gameWinner(resumed),sameScore:JSON.stringify(uninterrupted.score)===JSON.stringify(resumed.score),
  samePackedAfter:afterA===afterB,normalizedAfterEqual:normalizedA===normalizedB,changedKeys,changedWorldKeys,worldDifference,originalSaveBytesUnchanged:snapshot===sourceBefore,sourceChangedByResume:afterA!==sourceBefore}));
})();`,{timeout:180000,setupSources:['const FIXTURE='+JSON.stringify(fixture)+';']});
