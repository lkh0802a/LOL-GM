// Synthetic corrupted-save observation; no real slot, contract or migration.
import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:3,div2:false}),regionCfg('KR',{teams:2,div2:false})];cfg.internationals=[];
 const db=buildWorld(cfg),[team]=activeTeams(db,'NA'),year=db.year;
 db.regions.NA.localServiceRule={seasons:2,days:0,choiceYears:2,effectiveYear:year};
 db.world={phase:'season',year,manage:'manual',seasons:{}};setWorldCalendarDate(db,year+'-01-10');setManagedTeam(db,team.id);
 const p=genPlayer(db,new RNG('duplicate-local-service','fixture'),{region:'KR',role:ROLES[0],age:22,base:60});
 signContract(db,p,team,2,3,{});
 const original=packDB(db),input=JSON.parse(original),service=input.players[p.id].localEligibility.service;
 if(service.seasons.length!==1)throw Error('fixture must begin with one actual service season');
 service.seasons.push(service.seasons[0]);
 const suspect=JSON.stringify(input),control=unpackDB(original);let result,loaded;
 try{loaded=unpackDB(suspect);const candidate=loaded.players[p.id];processLocalServiceDaily(loaded);
   result={accepted:true,seasonEntries:candidate.localEligibility.service.seasons,qualification:!!candidate.localEligibility.qualifications.NA};
 }catch(e){result={accepted:false,error:e.message};}
 processLocalServiceDaily(control);
 console.log('LOCAL_SERVICE_DUPLICATE_OBSERVATION '+JSON.stringify({controlSeasonCount:control.players[p.id].localEligibility.service.seasons.length,controlQualification:!!control.players[p.id].localEligibility.qualifications.NA,result,inputUnchanged:JSON.stringify(input)===suspect,originalUnchanged:packDB(db)===original}));
})();`);
