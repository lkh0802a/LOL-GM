await import('./official-undo-acceptance.mjs');
import assert from 'node:assert/strict';
import {runEngineFixture} from './test-harness.mjs';
const result=await runEngineFixture(String.raw`(()=>{
 const cfg=defaultWorldConfig();cfg.regions=['NA','BR'].map(id=>regionCfg(id,{teams:10,div2:false,regularBo:5}));cfg.internationals=[];
 const db=buildWorld(cfg),club=activeTeams(db,'NA',1)[0];startCareer(db,club.id,'active-leagues-div2-patch-2026-10-16');autoBuildInitialSquad(db,club,new RNG('carry-fixture','squad'),5);finalizeInitialRosters(db);setManagedTeam(db,null);
 const original=prepareOfficialClockGame,trace=[];
 prepareOfficialClockGame=function(d,s,m){const prepared=!!m.clockGame;const result=original(d,s,m);if(d===db&&!prepared){const expected=(officialGameTimeRecord(m,m.clockSession?.games||[])?.gameTimeThrough||officialActualStart(m)).slice(0,10);if(m.clockGame.observation.date!==expected)throw Error('CARRY actual start date lost');trace.push({season:s.id,fixtureDate:s.days[s.cur].date,date:d.worldDate,startDate:expected});}return result;};
 try{const through=addDays(nextDate(db),5);let calls=0;while(db.worldDate<through){if(++calls>30)throw Error('CARRY bounded native dates');playWorldDay(db);}
 const saved=unpackDB(packDB(db));if(stringifyMetaHistory(saved.metaHistory)!==stringifyMetaHistory(db.metaHistory))throw Error('CARRY save observations changed');
 return {games:db.metaHistory.length,date:db.worldDate,preparations:trace.length,oldFixtureAfterMidnight:trace.filter(x=>x.fixtureDate<x.date).length,actualStartDates:true,fullMetaSave:true,trace};
 }finally{prepareOfficialClockGame=original;}
})()`,{timeout:120000});
assert(result.games>0&&result.oldFixtureAfterMidnight>0&&result.actualStartDates&&result.fullMetaSave);console.log('PATCH_CALENDAR_CARRY_ACCEPTANCE '+JSON.stringify(result));
