// Synthetic legacy settlement observation; no real saves or approved prize rules.
import {runEngineFixture} from './test-harness.mjs';

await runEngineFixture(String.raw`(()=>{
  const check=(ok,msg)=>{if(!ok)throw Error('PRIZE_SETTLEMENT_OBSERVATION '+msg)};
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,div2:false})];cfg.internationals=[];
  const db=buildWorld(cfg),teams=activeTeams(db,'NA',1).slice(0,2);
  check(teams.length===2,'missing clubs');
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
  playDay(db,season);check(season.done,'competition incomplete');
  const original=JSON.stringify(db),copy=JSON.parse(original),control=JSON.parse(original);
  delete control.world.seasons[id];
  const planned=financeCloseoutPrizes(copy,copy.world);
  closeFinances(copy,copy.world,new RNG('prize-settlement','finance'),()=>{});
  closeFinances(control,control.world,new RNG('prize-settlement','finance'),()=>{});
  const observed=teams.map(t=>{
    const row=copy.teams[t.id].finance.history.at(-1),base=control.teams[t.id].finance.history.at(-1);
    check(row?.year===copy.world.year&&base?.year===control.world.year,'missing annual ledger');
    const cashDifference=Math.round((copy.teams[t.id].finance.cash-control.teams[t.id].finance.cash)*10)/10;
    check(planned[t.id]>0&&row.rev.prize===Math.round(planned[t.id]*10)/10&&base.rev.prize===0,
      'unexpected synthetic prize plan or ledger');
    check(cashDifference===row.rev.prize,'unexpected cash difference');
    return {team:t.id,planned:planned[t.id],ledgerPrize:row.rev.prize,controlPrize:base.rev.prize,cashDifference};
  });
  const once=JSON.stringify(copy);closeFinances(copy,copy.world,new RNG('prize-settlement','finance'),()=>{});
  check(JSON.stringify(copy)===once,'duplicate settlement changed state');
  check(JSON.stringify(db)===original,'original synthetic fixture changed');
  const restored=unpackDB(packDB(copy));
  const restoredPrize=teams.map(t=>restored.teams[t.id].finance.history.at(-1)?.rev.prize);
  check(restoredPrize.every((v,i)=>v===observed[i].ledgerPrize),'ledger changed after save restore');
  console.log('PRIZE_SETTLEMENT_OBSERVATION '+JSON.stringify({synthetic:true,actualMatch:true,
    suppliedPrizeTerms:false,worldsTie:false,observed,duplicateUnchanged:true,originalUnchanged:true,
    ledgerRestore:true,actualUserSave:false}));
})();`);
