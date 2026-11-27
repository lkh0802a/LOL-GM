// Synthetic legacy regional tie observation; no prize contract or real save.
import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
  const check=(ok,msg)=>{if(!ok)throw Error('PRIZE_TIE_OBSERVATION '+msg)};
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,div2:false})];cfg.internationals=[];
  const seed=buildWorld(cfg),clubs=activeTeams(seed,'NA',1).slice(0,2),id='synthetic-prize-tie';
  check(clubs.length===2,'missing clubs');
  seed.world={year:seed.year,phase:'season',manage:'manual',seasons:{}};
  for(const t of clubs)for(const role of ROLES){
    const p=genPlayer(seed,new RNG('prize-tie|'+t.id+role),{region:t.region,role,age:22,base:65});
    signContract(seed,p,t,1,3);t.depthChart[role]=p.id;
  }
  seed.competitions[id]={id,name:'Synthetic tied prize audit',region:'NA',teams:clubs.map(t=>t.id),rules:{fearless:true},
    stages:[{id:'regular',name:'Regular',type:'round_robin',legs:2,bestOf:1}]};
  const base=JSON.stringify(seed);let db=null,season=null,rows=null,attempt=0;
  for(attempt=0;attempt<20;attempt++){
    const trial=JSON.parse(base),s=newSeason(trial,id,trial.year,'prize-tie-'+attempt,trial.worldDate);
    s.key=id;s.region='NA';s.div=1;trial.world.seasons[id]=s;
    for(let d=0;!s.done&&d<20;d++)playDay(trial,s);
    check(s.done,'competition incomplete');
    const st=standings(trial,s,'regular');
    if(st.length===2&&st.every(r=>r.w===1&&r.l===1&&r.gw===1&&r.gl===1&&Object.values(r.h2h).every(v=>v===0))){db=trial;season=s;rows=st;break;}
  }
  check(db!==null,'no actual tied match result in 20 controlled seeds');
  const original=JSON.stringify(db),copy=JSON.parse(original),plan=financeCloseoutPrizes(copy,copy.world);
  const matches=season.days.flatMap(d=>d.matches).map(m=>({winner:m.res?.winner,score:m.res?.score}));
  check(matches.length===2&&matches.every(m=>m.winner),'missing real match result');
  closeFinances(copy,copy.world,new RNG('prize-tie-close','finance'),()=>{});
  const payouts=clubs.map(t=>({team:t.id,planned:plan[t.id]??null,ledger:copy.teams[t.id].finance.history.at(-1)?.rev.prize}));
  check(payouts.every(x=>Number.isFinite(x.planned)&&x.planned>0&&Number.isFinite(x.ledger)&&x.ledger>0),'expected legacy payout observation missing');
  const once=JSON.stringify(copy);closeFinances(copy,copy.world,new RNG('prize-tie-close','finance'),()=>{});
  check(JSON.stringify(copy)===once,'duplicate close changed state');
  const restored=unpackDB(packDB(copy));
  check(payouts.every(x=>x.ledger===restored.teams[x.team].finance.history.at(-1)?.rev.prize),'restore changed ledger');
  check(JSON.stringify(db)===original,'synthetic source mutated');
  console.log('PRIZE_TIE_OBSERVATION '+JSON.stringify({synthetic:true,seed:'prize-tie-'+attempt,
    regularRecords:rows.map(r=>({team:r.tid,wins:r.w,losses:r.l,setWins:r.gw,setLosses:r.gl,h2h:r.h2h})),matches,
    engineChampion:season.champion,engineRunnerUp:season.runnerUp,payouts,
    explicitPrizeTerms:false,confirmedDebt:false,worlds:false,originalUnchanged:true,duplicateUnchanged:true,ledgerRestore:true}));
})();`);
