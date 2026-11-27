// Synthetic legacy historical snapshot vs mutable competition observation.
import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
  const check=(ok,msg)=>{if(!ok)throw Error('PRIZE_HISTORY_OBSERVATION '+msg)};
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,div2:false})];cfg.internationals=[];
  const db=buildWorld(cfg),clubs=activeTeams(db,'NA',1).slice(0,3),id='synthetic-prize-history';
  check(clubs.length===3,'missing synthetic clubs');
  db.world={year:db.year,phase:'season',manage:'manual',seasons:{}};
  for(const t of clubs.slice(0,2))for(const role of ROLES){
    const p=genPlayer(db,new RNG('prize-history|'+t.id+role),{region:t.region,role,age:22,base:65});
    signContract(db,p,t,1,3);t.depthChart[role]=p.id;
  }
  db.competitions[id]={id,name:'Synthetic historic prize',region:'NA',teams:clubs.slice(0,2).map(t=>t.id),rules:{fearless:true},
    stages:[{id:'regular',name:'Regular',type:'round_robin',legs:1,bestOf:1}]};
  const season=newSeason(db,id,db.year,'prize-history',db.worldDate);
  season.key=id;season.region='NA';season.div=1;db.world.seasons[id]=season;
  playDay(db,season);check(season.done,'competition incomplete');
  const original=JSON.stringify(db),baseline=JSON.parse(original),changed=JSON.parse(original);
  const oldTeam=clubs[1].id,newTeam=clubs[2].id;
  changed.competitions[id].teams=changed.competitions[id].teams.map(t=>t===oldTeam?newTeam:t);
  check(changed.world.seasons[id].formatSnapshot.teams.includes(oldTeam)&&
    !changed.world.seasons[id].formatSnapshot.teams.includes(newTeam),'historical snapshot changed');
  const before=financeCloseoutPrizes(baseline,baseline.world),after=financeCloseoutPrizes(changed,changed.world);
  const beforeHash=JSON.stringify(baseline.world.seasons[id].formatSnapshot);
  closeFinances(baseline,baseline.world,new RNG('prize-history-close','finance'),()=>{});
  closeFinances(changed,changed.world,new RNG('prize-history-close','finance'),()=>{});
  const ledger={oldBaseline:baseline.teams[oldTeam].finance.history.at(-1).rev.prize,
    oldChanged:changed.teams[oldTeam].finance.history.at(-1).rev.prize,
    newBaseline:baseline.teams[newTeam].finance.history.at(-1).rev.prize,
    newChanged:changed.teams[newTeam].finance.history.at(-1).rev.prize};
  const restored=unpackDB(packDB(changed));
  check(JSON.stringify(restored.world.seasons[id].formatSnapshot)===beforeHash,'snapshot changed on restore');
  check(restored.teams[newTeam].finance.history.at(-1).rev.prize===ledger.newChanged,'ledger changed on restore');
  check(JSON.stringify(db)===original,'original synthetic world changed');
  console.log('PRIZE_HISTORY_OBSERVATION '+JSON.stringify({synthetic:true,actualMatch:true,editedCurrentCompetition:true,
    historicalSnapshotUnchanged:true,oldTeam,newTeam,baselinePlan:before,changedPlan:after,ledger,
    participantEffect:ledger.oldBaseline!==ledger.oldChanged||ledger.newBaseline!==ledger.newChanged,
    syntheticSaveRestore:true,originalUnchanged:true,worlds:false,confirmedPrizeDebt:false}));
})();`);
