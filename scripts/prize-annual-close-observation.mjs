// Synthetic legacy annual close observation; closure is controlled, not adjudicated.
import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const check=(v,m)=>{if(!v)throw Error('PRIZE_ANNUAL_CLOSE_OBSERVATION '+m)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,slots:4,div2:false,system:'franchise'})];cfg.internationals=[];
 const db=buildWorld(cfg),clubs=activeTeams(db,'NA',1),id='SYNTHETIC_ANNUAL_PRIZE';
 for(const t of clubs)for(const role of ROLES){const p=genPlayer(db,new RNG('annual-prize|'+t.id+role),{region:t.region,role,age:22,base:65});signContract(db,p,t,1,3);t.depthChart[role]=p.id}
 db.competitions[id]={id,name:'Synthetic annual prize',short:id,region:'NA',teams:clubs.map(t=>t.id),rules:{fearless:true},stages:[{id:'regular',name:'Regular',type:'round_robin',legs:1,bestOf:1}]};
 const s=newSeason(db,id,db.year,'annual-prize',db.worldDate,id);s.key=id;s.region='NA';s.div=1;s.split=3;
 db.world={year:db.year,seed:'annual-prize',manage:'ai',phase:'season',seasons:{[id]:s},steps:[{kind:'league',split:3}],step:0,offers:[],marketLog:[]};
 let days=0;while(!s.done&&days++<100){setWorldCalendarDate(db,s.days[s.cur].date);playDay(db,s)}
 check(s.done&&s.days.every(d=>d.matches.every(m=>m.res)),'incomplete synthetic competition');
 const matches=s.days.reduce((n,d)=>n+d.matches.length,0),old=clubs.find(t=>t.id!==s.champion&&t.id!==s.runnerUp).id;
 const before=packDB(db),baseline=unpackDB(before),changed=unpackDB(before);
 baseline.world.phase='offseason';changed.world.phase='offseason';
 const recorded=JSON.stringify(changed.world.seasons[id].formatSnapshot.teams),planBefore=financeCloseoutPrizes(changed,changed.world)[old]??null;
 foldTeam(changed,changed.teams[old]);check(changed.teams[old].active===false,'controlled closure failed');
 const basePlan=financeCloseoutPrizes(baseline,baseline.world)[old]??null,changedPlan=financeCloseoutPrizes(changed,changed.world)[old]??null;
 const a=runOffseason(baseline),b=runOffseason(changed);
 check(a.year===s.year&&b.year===s.year&&baseline.world.phase==='market'&&changed.world.phase==='market','annual close did not finish');
 const baseRows=baseline.teams[old].finance.history.filter(x=>x.year===s.year),changedRows=changed.teams[old].finance.history.filter(x=>x.year===s.year);
 const reopened=unpackDB(packDB(changed));check(JSON.stringify(reopened.world.seasons[id].formatSnapshot.teams)===recorded,'restore changed snapshot');
 const restoredBefore=packDB(reopened);runOffseason(reopened);check(packDB(reopened)===restoredBefore,'duplicate annual close changed restored state');
 check(packDB(db)===before,'source synthetic world changed');
 console.log('PRIZE_ANNUAL_CLOSE_OBSERVATION '+JSON.stringify({synthetic:true,controlledClosure:true,actualMatches:matches,
  format:'four-team-single-round-bo1',worlds:false,old,planBefore,basePlan,changedPlan,
  baselineAnnualPrize:baseRows.at(-1)?.rev?.prize??null,closedAnnualPrize:changedRows.at(-1)?.rev?.prize??null,
  closedActive:changed.teams[old].active,baselinePhase:baseline.world.phase,closedPhase:changed.world.phase,
  snapshotPreserved:true,syntheticRestore:true,duplicateCloseUnchanged:true,originalUnchanged:true,confirmedPrizeDebt:false,actualUserSave:false}));
})()`,{timeout:120000});
