// Synthetic legacy postseason ordering observation, not an approved promotion rule.
import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
  const check=(v,msg)=>{if(!v)throw Error('PRIZE_OFFSEASON_OBSERVATION '+msg)};
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,div2:false,system:'relegation',relegate:1})];cfg.internationals=[];
  const db=buildWorld(cfg),clubs=activeTeams(db,'NA',1).slice(0,2),id='synthetic-offseason-prize';
  check(clubs.length===2,'missing clubs');
  db.world={year:db.year,phase:'season',manage:'manual',seasons:{}};
  for(const t of clubs)for(const role of ROLES){
    const p=genPlayer(db,new RNG('offseason-prize|'+t.id+role),{region:t.region,role,age:22,base:65});
    signContract(db,p,t,1,3);t.depthChart[role]=p.id;
  }
  db.competitions[id]={id,name:'Synthetic offseason prize',region:'NA',teams:clubs.map(t=>t.id),rules:{fearless:true},
    stages:[{id:'regular',name:'Regular',type:'round_robin',legs:1,bestOf:1}]};
  const s=newSeason(db,id,db.year,'offseason-prize',db.worldDate);
  s.key=id;s.region='NA';s.div=1;s.split=3;db.world.seasons[id]=s;
  playDay(db,s);check(s.done,'synthetic match not completed');
  const raw=JSON.stringify(db),copy=JSON.parse(raw),w=copy.world,loser=standings(copy,w.seasons[id],'regular').at(-1).tid;
  const prizeBefore=financeCloseoutPrizes(copy,w)[loser]??0,events=[];
  promotionRelegation(copy,w,new RNG('offseason-prize','promotion'),x=>events.push(x));
  const afterTeam=copy.teams[loser],planned=financeCloseoutPrizes(copy,w)[loser]??0;
  const active=activeTeams(copy).some(t=>t.id===loser),beforeHistory=(afterTeam.finance?.history||[]).length;
  closeFinances(copy,w,new RNG('offseason-prize','finance'),()=>{});
  const afterHistory=(copy.teams[loser].finance?.history||[]).length;
  const restored=unpackDB(packDB(copy)),restoredTeam=restored.teams[loser];
  check(restoredTeam?.active===afterTeam.active&&
    (restoredTeam.finance?.history||[]).length===afterHistory,'synthetic restore changed closure or history');
  check(JSON.stringify(db)===raw,'original synthetic world changed');
  console.log('PRIZE_OFFSEASON_OBSERVATION '+JSON.stringify({synthetic:true,actualSingleMatch:true,
    controlledRegionFormat:true,noSeparatePromotionMatch:true,loser,plannedBeforePromotion:prizeBefore,
    plannedAfterPromotion:planned,activeAfterPromotion:active,historyBeforeClose:beforeHistory,
    historyAfterClose:afterHistory,closed:copy.world.financeClosedYear===w.year,
    historicalParticipant:w.seasons[id].formatSnapshot.teams.includes(loser),
    generatedClosureEvents:events.length,syntheticRestore:true,originalUnchanged:true,actualUserSave:false}));
})();`);
