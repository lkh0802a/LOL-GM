// Synthetic international match observation; no real tournament or user save.
import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,div2:false})];cfg.internationals=[];
 const db=buildWorld(cfg),teams=activeTeams(db,'NA',1).slice(0,4);setManagedTeam(db,teams[0].id);
 for(const t of teams)for(const role of ROLES){const p=genPlayer(db,new RNG('intl-observe|'+t.id+role),{region:t.region,role,age:22,base:65});signContract(db,p,t,1,3);t.depthChart[role]=p.id}
 db.world={year:db.year,phase:'season',seed:'intl-selection',manage:'manual',seasons:{}};
 const original=packDB(db),copy=unpackDB(original),id='synthetic-international-selection';
 copy.competitions[id]={id,name:'Synthetic international',region:'NA',international:true,teams:teams.map(t=>t.id),rules:{fearless:true},stages:[{id:'ko',name:'Knockout',type:'single_elim',bestOf:1,firstChoice:'seed'}]};
 const season=newSeason(copy,id,copy.year,'intl-record-seed',copy.worldDate);copy.world.seasons[season.id]=season;
 const day=season.days[season.cur],match=day.matches[0],setup=scheduledSeriesSession(copy,season,match);
 const replayDb=unpackDB(packDB(copy)),replaySeason=replayDb.world.seasons[season.id],replayDay=replaySeason.days[replaySeason.cur],replayMatch=replayDay.matches[0],replaySetup=scheduledSeriesSession(replayDb,replaySeason,replayMatch);
 const replaySeries=simulateScheduledSeries(replayDb,replaySeason,replayDay,replayMatch,replaySetup.cfg);
 const generated=simulateScheduledSeries(copy,season,day,match,setup.cfg);commitScheduledSeries(copy,season,match,generated);
 const observed={matchId:match.id,firstChoice:match.res.firstChoice,firstChooser:match.res.games[0].sideBy,
  expectedChooser:setup.session.chooser,seed:match.res.seed,gameSeed:match.res.games[0].seed,winner:match.res.winner};
 const restored=unpackDB(packDB(copy)),r=restored.world.seasons[season.id].days[season.cur].matches.find(m=>m.id===match.id).res;
 const roundtrip={firstChoice:r.firstChoice,firstChooser:r.games[0].sideBy,seed:r.seed,gameSeed:r.games[0].seed,winner:r.winner};
 const source={firstChoice:observed.firstChoice,firstChooser:observed.firstChooser,seed:observed.seed,gameSeed:observed.gameSeed,winner:observed.winner};
 console.log('INTERNATIONAL_SELECTION_RECORD '+JSON.stringify({synthetic:true,realEngineMatch:true,observed,roundtrip,restoredMatches:JSON.stringify(source)===JSON.stringify(roundtrip),sameSeedSeriesMatches:JSON.stringify(generated.rec)===JSON.stringify(replaySeries.rec),originalUnchanged:packDB(db)===original}));
})();`);
