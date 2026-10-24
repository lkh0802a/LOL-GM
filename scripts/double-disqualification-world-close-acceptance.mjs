import assert from 'node:assert/strict';
import {runEngineFixture} from './test-harness.mjs';
const result=await runEngineFixture(String.raw`(()=>{
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,div2:false,splits:1,format:'rr_po',playoffTake:4})];cfg.internationals=[];
 const db=buildWorld(cfg),owner=activeTeams(db,'NA',1)[0];startCareer(db,owner.id,'admin-calendar');for(const t of setupTeamsForManager(db))autoBuildInitialSquad(db,t,new RNG('admin-calendar-roster/'+t.id));finalizeInitialRosters(db);db.world.manage='ai';startWorldSeason(db,owner.id,'admin-calendar');recruitmentStore(db);
 let days=0,season=null;while(db.world.phase==='season'&&days++<250){season=activeSeasons(db)[0];const day=season?.days[season.cur];if(day?.matches.length===1&&officialDisqualificationFinal(db,season,day.matches[0])&&db.world.step===db.world.steps.length-1)break;playWorldDay(db);}
 if(days>=250||!season||db.world.phase!=='season')throw Error('actual final not reached');
 const day=season.days[season.cur],m=day.matches[0];applyWorldDailyEffects(db,day.date);
 // A controlled last-minute shortage after the real daily writer, rather than
 // asserting that this prevalence happens naturally in the four-club sample.
 for(const id of [m.a,m.b]){const ids=officialSeasonRoster(db,db.teams[id],season);for(const [i,pid] of ids.entries()){const p=db.players[pid];p.injury=null;delete p.medical;if(i>=4)p.medical={out:true,daysLeft:20};}}
 const view=officialMatchView(db,season,m.a,m.b),counts=[m.a,m.b].map(id=>medicalAvailable(view,view.teams[id]));if(counts.some(n=>n!==4))throw Error('controlled four/four');
 const prior=season.days.flatMap(d=>d.matches).filter(m=>m.res),original=JSON.stringify(prior),saved=unpackDB(packDB(db));playWorldDay(db);playWorldDay(saved);
 return {recruitmentStoreInitializedByActualConsumer:true,configuredRegions:1,configuredClubs:4,configuredSplits:1,worldCalendarCalls:days,priorSeries:prior.length,actualPlayedSeries:prior.filter(m=>m.res.games.length>0).length,ordinaryForfeits:prior.filter(m=>m.res.forfeit).length,priorResultsValid:prior.every(m=>m.res.forfeit||m.res.games.length>0&&m.res.games.every(g=>g.publicRecord?.ending.kind==='nexus')),actualNexus:prior.reduce((n,m)=>n+m.res.games.filter(g=>g.publicRecord?.ending.kind==='nexus').length,0),counts,seasonDone:season.done,champion:season.champion,score:m.res.score,phase:db.world.phase,nativePhase:saved.world.phase,liveSave:packDB(db),restoredSave:packDB(saved),originalResultsPreserved:JSON.stringify(prior)===original,defaultFullWorldSeason:false};
})()`,{timeout:180000});
assert(result.priorResultsValid&&result.actualNexus>0&&result.seasonDone&&result.champion===null&&result.score===null&&result.phase==='offseason'&&result.nativePhase==='offseason'&&result.originalResultsPreserved);
// JSON object property order is representation metadata. Compare every persisted
// field, array order and value without dropping any part of the saved world.
assert.deepStrictEqual(JSON.parse(result.liveSave),JSON.parse(result.restoredSave));
result.serializedTextEqual=result.liveSave===result.restoredSave;delete result.liveSave;delete result.restoredSave;result.wholePersistedValuesEqual=true;console.log('DOUBLE_DQ_ACTUAL_WORLD_CLOSE',JSON.stringify(result));
