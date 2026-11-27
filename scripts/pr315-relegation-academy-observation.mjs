// Run only in an isolated export of PR #315; all teams and results are synthetic.
import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('VN',{teams:10,system:'relegation',div2:true,relegate:1})];cfg.internationals=[];
 const db=buildWorld(cfg),R=db.regions.VN,top=activeTeams(db,'VN',1),lower=activeTeams(db,'VN',2).filter(t=>!t.parent);
 if(top.length<2||lower.length<2)throw Error('synthetic divisions missing');
 const parent=top.at(-1),academy=makeAcademy(db,new RNG('relegation-academy'),parent);
 const p=genPlayer(db,new RNG('relegation-player'),{region:'VN',role:ROLES[0],age:22,base:60});signContract(db,p,academy,1,3);
 db.world={year:db.year,phase:'offseason',manage:'manual',seasons:{}};
 const makeSeason=(id,teams,div)=>{const matches=[];for(let i=0;i<teams.length;i++)for(let j=i+1;j<teams.length;j++){
  const a=teams[i].id,b=teams[j].id;matches.push({id:id+'-'+i+'-'+j,a,b,res:{winner:a,score:[1,0]}});
 }
 db.competitions[id]={id,region:'VN',teams:teams.map(t=>t.id),stages:[{id:'regular',name:'Regular',type:'round_robin',legs:1,bestOf:1}]};
 db.world.seasons[id]={id,comp:id,region:'VN',div,split:1,done:true,champion:teams[0].id,runnerUp:teams[1].id,
   stageData:{regular:{teams:teams.map(t=>t.id)}},days:[{stage:'regular',matches}]};};
 makeSeason('controlled-top',top,1);makeSeason('controlled-lower',lower,2);
 const original=packDB(db),copy=unpackDB(original),events=[],before={parentDivision:copy.teams[parent.id].division,academyDivision:copy.teams[academy.id].division,
  active:copy.teams[academy.id].active,team:copy.players[p.id].team,contract:copy.players[p.id].contract};
 let error=null;try{promotionRelegation(copy,copy.world,new RNG('controlled-relegation'),e=>events.push(e))}catch(e){error=e.message}
 const view=x=>({parentDivision:x.teams[parent.id].division,academyDivision:x.teams[academy.id].division,active:x.teams[academy.id].active,academyOnly:x.teams[academy.id].academyOnly,
  team:x.players[p.id].team,contract:x.players[p.id].contract,closureHistory:x.players[p.id].careerEvents.filter(e=>e.type==='club_closure'),
  closure:x.teams[academy.id].finance.closureSettlement??null});
 // Separate controlled probe of the existing registration initializer.
 const registrationDb=unpackDB(packDB(copy));registrationDb.world.registrationVersion=1;
 const regBefore=registrationDb.teams[academy.id].registration??null;
 // Control isolates service credit caused by this initializer, not historical service.
 registrationDb.players[p.id].localEligibility.service=null;
 const serviceBefore=registrationDb.players[p.id].localEligibility.service;
 initializeOfficialRegistrations(registrationDb);
 const regAfter=registrationDb.teams[academy.id].registration??null;
 const registrationProbe={before:regBefore,after:regAfter,
  containsInjectedPlayer:!!regAfter?.players?.includes(p.id),active:registrationDb.teams[academy.id].active,
  academyOnly:registrationDb.teams[academy.id].academyOnly,
  serviceBefore,serviceAfter:registrationDb.players[p.id].localEligibility.service??null};
 // A global activeTeams filter would also hide a still-existing club from
 // consumers such as financeCloseoutState and runDailyPractice.
 const activeConsumers={clubPresent:activeTeams(copy).some(t=>t.id===academy.id),
  hypotheticalGlobalFilterPresent:activeTeams(copy).filter(t=>!t.academyOnly).some(t=>t.id===academy.id)};
 const lowerCompetition=leagueComp(copy,'VN',2);
 const calendarDb=unpackDB(packDB(copy)),calendarComp=leagueComp(calendarDb,'VN',2);calendarDb.competitions[calendarComp.id]=calendarComp;
 const schedule=newSeason(calendarDb,calendarComp.id,calendarDb.year,'synthetic-next-season','2028-01-14');
 const fixtures=schedule.days.flatMap(d=>d.matches),academyFixtures=fixtures.filter(m=>m.a===academy.id||m.b===academy.id);
 const scheduled={total:academyFixtures.length,againstParent:academyFixtures.filter(m=>[m.a,m.b].includes(parent.id)).length};
 const listedInLower={parent:lowerCompetition.teams.includes(parent.id),academy:lowerCompetition.teams.includes(academy.id)};
 let restored=null,restoreError=null;try{restored=view(unpackDB(packDB(copy)))}catch(e){restoreError=e.message}
 console.log('PR315_RELEGATION_ACADEMY_OBSERVATION '+JSON.stringify({synthetic:true,controlledResults:true,before,after:view(copy),registrationProbe,activeConsumers,listedInLower,scheduled,events,error,restored,restoreError,originalUnchanged:packDB(db)===original}));
})();`);
