// Synthetic read-only legacy planner observation; no real settlement or rule is created.
import {runEngineFixture} from './test-harness.mjs';

await runEngineFixture(String.raw`(()=>{
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,div2:false})];cfg.internationals=[];
  const db=buildWorld(cfg),teams=activeTeams(db,'NA',1).slice(0,2);
  if(teams.length!==2)throw Error('missing synthetic clubs');
  db.world={year:db.year,phase:'season',manage:'manual',seasons:{}};
  for(const t of teams)for(const role of ROLES){
    const p=genPlayer(db,new RNG('prize-audit|'+t.id+role),{region:t.region,role,age:22,base:65});
    signContract(db,p,t,1,3);t.depthChart[role]=p.id;
  }
  const id='synthetic-prize-audit';
  db.competitions[id]={id,name:'Synthetic prize audit',region:'NA',teams:teams.map(t=>t.id),rules:{fearless:true},
    stages:[{id:'regular',name:'Regular',type:'round_robin',legs:1,bestOf:1}]};
  const season=newSeason(db,id,db.year,'prize-audit',db.worldDate);
  season.key=id;season.region='NA';season.div=1;db.world.seasons[id]=season;
  playDay(db,season);
  if(!season.done)throw Error('synthetic competition did not complete');
  const before=JSON.stringify(db),result=financeCloseoutPrizes(db,db.world);
  console.log('PRIZE_PLAN_OBSERVATION '+JSON.stringify({synthetic:true,completed:season.done,
    suppliedPrizeTerms:false,awards:teams.map(t=>result[t.id]??null),readOnly:before===JSON.stringify(db)}));
})();`);
