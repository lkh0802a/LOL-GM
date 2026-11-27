// Synthetic fixture schedule context, not an enacted tournament regulation.
import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,div2:false})];cfg.internationals=[];
 const db=buildWorld(cfg),teams=activeTeams(db,'NA',1).map(t=>t.id);db.world={year:db.year,phase:'season',manage:'manual',seasons:{}};
 const original=packDB(db),copy=unpackDB(original);
 const make=(id,international,stage)=>{copy.competitions[id]={id,name:id,region:'NA',international,teams:teams.slice(),rules:{fearless:true},stages:[stage]};return newSeason(copy,id,copy.year,'context-seed',copy.worldDate)};
 const domestic=make('synthetic-domestic',false,{id:'regular',name:'Regular',type:'round_robin',legs:2,bestOf:3});
 const matches=domestic.days.flatMap((day,index)=>day.matches.map(m=>({day,index,m})));
 const pair=matches[0],reverse=matches.find(x=>x.m.a===pair.m.b&&x.m.b===pair.m.a);
 const sessionFor=(s,row)=>{s.cur=row.index;const out=scheduledSeriesSession(copy,s,row.m);return {a:row.m.a,b:row.m.b,firstChoice:out.opt.firstChoice,chooser:out.session.chooser,seed:out.seed}};
 const home=[sessionFor(domestic,pair),sessionFor(domestic,reverse)];
 const playoff=make('synthetic-playoffs',false,{id:'playoffs',name:'Playoffs',type:'single_elim',bestOf:3,firstChoice:'seed'});
 const playDay=playoff.days[0],play={day:playDay,index:0,m:playDay.matches[0]},seeded=sessionFor(playoff,play);
 const international=make('synthetic-intl',true,{id:'ko',name:'Knockout',type:'single_elim',bestOf:3,firstChoice:'seed'});
 const intlDay=international.days[0],intl={day:intlDay,index:0,m:intlDay.matches[0]},coin=sessionFor(international,intl);
 const replay=sessionFor(international,intl),stored=JSON.parse(JSON.stringify(replay));
 console.log('SCHEDULED_SELECTION_CONTEXT '+JSON.stringify({synthetic:true,home,reverseFound:!!reverse,seeded,playoffSeeds:playoff.stageData.playoffs.seeds,
  coin,replayMatches:JSON.stringify(coin)===JSON.stringify(replay),sessionCopyChoice:stored.firstChoice,originalUnchanged:packDB(db)===original}));
})();`);
