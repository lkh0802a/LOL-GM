// Synthetic series evidence; does not establish every competition's valid format.
import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:3,div2:false})];cfg.internationals=[];
 const db=buildWorld(cfg),[home,away]=activeTeams(db,'NA',1);setManagedTeam(db,home.id);
 for(const t of [home,away])for(const role of ROLES){const p=genPlayer(db,new RNG('series-observe|'+t.id+role),{region:t.region,role,age:22,base:t.id===home.id?85:45});signContract(db,p,t,1,3);t.depthChart[role]=p.id}
 db.world={year:db.year,phase:'season',seed:'series-evidence',manage:'manual',seasons:{}};
 const original=packDB(db),copy=unpackDB(original),s=createSeriesSession(copy,home.id,away.id,3,'series-evidence-14',{fearless:true,firstChoice:'home'});
 const first=seriesSessionPrepareGame(copy,s),firstChooser=first.chooser,firstResult=playSeriesSessionGame(copy,s),used=s.ctx.used.slice();
 const saved=packDB(copy),restored=unpackDB(saved),savedSession=JSON.stringify(s),resumed=JSON.parse(savedSession);
 const second=seriesSessionPrepareGame(copy,s),secondRestored=seriesSessionPrepareGame(restored,resumed);
 const firstUsed=used[0],draft=createDraftSession(copy,[second.blue,second.red],new RNG(second.gseed,'draft'),{...second.snap,firstPick:second.fpTeam===second.blue?0:1});
 const choice=draftValidateChoice(draft,{champ:firstUsed,side:draftTurn(draft).side});
 const secondResult=playSeriesSessionGame(copy,s),secondRestoredResult=playSeriesSessionGame(restored,resumed);
 console.log('SERIES_SELECTION_OBSERVATION '+JSON.stringify({synthetic:true,firstChooser,home:home.id,loser:firstResult.loser,
  nextChooser:second.chooser,firstUsedCount:used.length,uniqueFirstUsed:new Set(used).size,reuseAccepted:choice.ok,
  restoredSetupMatches:JSON.stringify(second)===JSON.stringify(secondRestored),sameSecondWinner:secondResult.winner===secondRestoredResult.winner,
  sameSecondRecord:JSON.stringify(s.games[1])===JSON.stringify(resumed.games[1]),originalUnchanged:packDB(db)===original}));
})();`);
