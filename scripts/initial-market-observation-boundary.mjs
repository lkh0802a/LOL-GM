// Synthetic paired observation: hidden potential and salary quote; no actual user save.
import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:3,div2:false})];cfg.internationals=[];
 const db=buildWorld(cfg),team=activeTeams(db,'NA',1)[0];db.world={year:db.year,phase:'offseason',manage:'manual',seed:'observer-boundary',seasons:{}};
 const p=genPlayer(db,new RNG('observer-boundary-player'),{region:'NA',role:'TOP',age:20,base:60});
 p.reputation=60;p.pot=70;seedInitialAiScoutReport(db,team,p);
 const original=packDB(db),low=unpackDB(original),high=unpackDB(original);
 low.players[p.id].pot=60;high.players[p.id].pot=95;
 const sample=(x,fixedSalary)=>{const q=x.players[p.id],t=x.teams[team.id];return {
  report:aiScoutReport(x,t,q),asking:asking(x,q,t.region),scoreDefault:initialCandidateScore(x,q,t,'paired'),
  scoreFixedSalary:initialCandidateScore(x,q,t,'paired',fixedSalary),potential:q.pot}};
 const lowBefore=packDB(low),highBefore=packDB(high),l=sample(low,10),h=sample(high,10);
 const restoredLow=unpackDB(packDB(low)),restoredHigh=unpackDB(packDB(high));
 const l2=sample(restoredLow,10),h2=sample(restoredHigh,10);
 console.log('INITIAL_MARKET_BOUNDARY '+JSON.stringify({synthetic:true,changedHiddenPotentialOnly:true,
  sameReport:JSON.stringify(l.report)===JSON.stringify(h.report),low:l,high:h,
  restoreMatches:JSON.stringify(l)===JSON.stringify(l2)&&JSON.stringify(h)===JSON.stringify(h2),
  lowBytesUnchanged:packDB(low)===lowBefore,highBytesUnchanged:packDB(high)===highBefore,originalUnchanged:packDB(db)===original}));
})();`);
