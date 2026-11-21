// Synthetic existing-fixture observation; no user save slots are opened or written.
import {readFile} from 'node:fs/promises';
import {runEngineFixture} from './test-harness.mjs';
const fixture=JSON.parse(await readFile(new URL('../docs/evidence/unemployed-season-fixture-2026-10-08.json',import.meta.url)));
await runEngineFixture(String.raw`(()=>{
 const db=unpackDB(JSON.stringify(FIXTURE)),team=managedTeamId(db);runOffseason(db);closeMarket(db);startWorldSeason(db,team,'pending-frame-authority-proof');
 let days=0;while(!db.world.pendingOfficial?.queue?.length&&++days<60)playWorldDay(db);
 if(days>=60)throw Error('synthetic pending match unavailable');
 const firstSelection=pendingOfficialSelectionSetup(db);
 if(firstSelection)applyPendingOfficialSelection(db,firstSelection.prompt.mode==='first'?{kind:'side',value:'blue'}:{kind:firstSelection.prompt.remaining,value:firstSelection.prompt.remaining==='side'?'blue':'first'});
 pendingOfficialDraftSetup(db);resolvePendingOfficialMatch(db,null);
 const q=db.world.pendingOfficial?.queue?.[0];if(!q?.session?.games?.length)throw Error('synthetic first set did not leave a pending series');
 const firstGames=q.session.games.length,snapshot=packDB(db),savedSession=JSON.stringify(q.session),restored=unpackDB(snapshot),rq=restored.world.pendingOfficial.queue[0];
 const restoredMatches=JSON.stringify(rq.session)===savedSession,sourceBefore=packDB(db);
 const uninterrupted=resolvePendingOfficialMatch(db,null),resumed=resolvePendingOfficialMatch(restored,null);
 const gameWinner=result=>result.game?.sides?.[result.game.winner]?.team?.id??null;
 const afterA=packDB(db),afterB=packDB(restored),parsedA=JSON.parse(afterA),parsedB=JSON.parse(afterB);
 const changedKeys=Array.from(new Set([...Object.keys(parsedA),...Object.keys(parsedB)])).filter(k=>JSON.stringify(parsedA[k])!==JSON.stringify(parsedB[k]));
 const changedWorldKeys=Array.from(new Set([...Object.keys(parsedA.world||{}),...Object.keys(parsedB.world||{})])).filter(k=>JSON.stringify(parsedA.world?.[k])!==JSON.stringify(parsedB.world?.[k]));
 const fieldShape=(w,k)=>Object.hasOwn(w||{},k)?{present:true,kind:Array.isArray(w[k])?'array':typeof w[k],keys:w[k]&&typeof w[k]==='object'?Object.keys(w[k]):null,targets:w[k]?.targets&&typeof w[k].targets==='object'?Object.keys(w[k].targets).length:null}:{present:false};
 const worldDifference=Object.fromEntries(changedWorldKeys.map(k=>[k,{uninterrupted:fieldShape(parsedA.world,k),resumed:fieldShape(parsedB.world,k)}]));
 const normalizedA=packDB(unpackDB(afterA)),normalizedB=packDB(unpackDB(afterB));
 console.log('OFFICIAL_SERIES_RESUME_OBSERVATION '+JSON.stringify({synthetic:true,days,firstGames,
  restoredMatches,firstGame:JSON.parse(savedSession).games[0],winnerA:gameWinner(uninterrupted),winnerB:gameWinner(resumed),sameWinner:gameWinner(uninterrupted)!==null&&gameWinner(uninterrupted)===gameWinner(resumed),sameScore:JSON.stringify(uninterrupted.score)===JSON.stringify(resumed.score),
  samePackedAfter:afterA===afterB,normalizedAfterEqual:normalizedA===normalizedB,changedKeys,changedWorldKeys,worldDifference,originalSaveBytesUnchanged:snapshot===sourceBefore,sourceChangedByResume:afterA!==sourceBefore}));
})();`,{timeout:180000,setupSources:['const FIXTURE='+JSON.stringify(fixture)+';']});
