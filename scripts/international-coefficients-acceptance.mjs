import {runEngineFixture} from './test-harness.mjs';

await runEngineFixture(String.raw`(()=>{
  const check=(ok,msg)=>{if(!ok)throw Error('INTERNATIONAL_COEFFICIENTS '+msg)};
  const cfg=defaultWorldConfig(),db=buildWorld(cfg),clubs=activeTeams(db),cn=clubs.find(t=>t.region==='CN');
  check(cfg.internationalPolicy.windowYears===3&&cfg.internationalPolicy.weights.WORLD_CHAMPIONSHIP===3,
    'fictional weights/window missing from world config');
  db.world={year:2030,seed:'international-archive',seasons:{},step:0,steps:[]};
  check(startInternational(db,'WORLD_CHAMPIONSHIP','2030-08-01',new Set()),'fixture international event did not start');
  const event=db.world.seasons.WORLD_CHAMPIONSHIP,participants=db.competitions[event.comp].teams,
    krEntry=participants.find(id=>db.teams[id].region==='KR'),cnEntry=participants.find(id=>db.teams[id].region==='CN');
  check(krEntry&&cnEntry,'fixture lacked KR/CN event participants');event.done=true;event.champion=krEntry;event.runnerUp=cnEntry;
  event.stageData={regular:{teams:[krEntry,cnEntry]}};event.days=[];
  db.global={power:{},internationalResults:[]};
  const w=db.world;
  db.teams[krEntry].region='EU';recordInternationalResults(db,w);db.teams[krEntry].region='CN';recordInternationalResults(db,w);
  check(db.global.internationalResults.length===1,'same event archived more than once');
  const archived=db.global.internationalResults[0];
  check(archived.teams[0].regionId==='KR'&&archived.teams[0].rank===1&&archived.teams[0].points===8&&archived.weight===3,
    'event result lost event-time region/rank/config weight');
  const restored=unpackDB(packDB(db));
  check(restored.global.internationalResults[0].teams[0].regionId==='KR'&&
    restored.worldConfig.internationalPolicy.weights.WORLD_CHAMPIONSHIP===3&&
    restored.world.seasons.WORLD_CHAMPIONSHIP.internationalRegionSnapshot[krEntry]==='KR',
    'save/restore lost archive/config/event snapshot');
  const legacyDb={...db,global:{power:{},internationalResults:[]},world:{...w,seasons:{...w.seasons}}};
  legacyDb.world.seasons.WORLD_CHAMPIONSHIP={...event};delete legacyDb.world.seasons.WORLD_CHAMPIONSHIP.internationalRegionSnapshot;
  recordInternationalResults(legacyDb,legacyDb.world);
  check(legacyDb.global.internationalResults.length===0,'legacy event without event-time region snapshot was inferred');

  const policyDb={worldConfig:{},global:{internationalResults:[
    {year:2027,competitionId:'FIRST_STAND',weight:1,teams:[{regionId:'KR',points:8}]},
    {year:2028,competitionId:'WORLD_CHAMPIONSHIP',weight:3,teams:[{regionId:'CN',points:8}]},
    {year:2029,competitionId:'FIRST_STAND',weight:1,teams:[{regionId:'CN',points:1}]},
    {year:2029,competitionId:'FIRST_STAND',weight:1,teams:[{regionId:'EU',points:8}]}
  ]}};
  check(internationalRegionRatings(policyDb,2029).CN===3.13,'tournament coefficient did not affect performance score');
  check(internationalRegionRatings(policyDb,2030).KR===undefined&&internationalRegionRatings(policyDb,2030).CN===3.13,
    'rolling three-year window did not age out the fourth-year result');

  const rankedDb=buildWorld(defaultWorldConfig()),[K,C,E]=['KR','CN','EU'].map(id=>rankedDb.regions[id]);
  rankedDb.world={year:2030,seasons:{}};
  rankedDb.global={power:{},decisions:[],internationalResults:[
    {eventId:'stale:WORLDS',year:2026,competitionId:'WORLD_CHAMPIONSHIP',weight:3,
      teams:[{regionId:'KR',rank:1,points:8},{regionId:'CN',rank:2,points:6},{regionId:'EU',rank:3,points:4}]},
    {eventId:'recent:WORLDS',year:2028,competitionId:'WORLD_CHAMPIONSHIP',weight:3,
      teams:[{regionId:'CN',rank:1,points:8},{regionId:'EU',rank:2,points:6},{regionId:'KR',rank:3,points:4}]}
  ]};
  for(const [regionId,points] of [['CN',4],['EU',6],['KR',8]])for(let i=0;i<3;i++)
    rankedDb.global.internationalResults.push({eventId:regionId+':extra:'+i,year:2029,competitionId:'FIRST_STAND',weight:1,teams:[{regionId,rank:1,points}]});
  const equal=internationalRegionRatings(rankedDb,2030);
  check(equal.CN===3&&equal.EU===3&&equal.KR===3,'slot fixture did not create a real rating tie');
  const order=[K,C,E].sort((a,b)=>compareInternationalRegions(rankedDb,equal,a,b,2030));
  check(order.map(r=>r.id).join(',')==='CN,EU,KR','tie-break used an out-of-window Worlds result');
  const before=rankedDb.regions.CN.slots,season={year:2030,seasons:{}};rankedDb.world=season;
  globalOffice(rankedDb,season,{chance:p=>p===.2,pick:()=>null,int:()=>0},1,()=>{});
  check(rankedDb.regions.CN.slots===before+1,'actual slot reallocation ignored the Worlds tie-break');
  console.log('INTERNATIONAL_COEFFICIENTS_ACCEPTANCE config / event archive / idempotency / event-time region / save / age-out / tournament weight / actual Worlds slot tie-break');
})()`);
