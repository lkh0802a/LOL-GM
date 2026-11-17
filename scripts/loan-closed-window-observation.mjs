// Synthetic legacy behavior observation; no real contracts or save slots are opened.
import {runEngineFixture} from './test-harness.mjs';

await runEngineFixture(String.raw`(()=>{
  const cfg=defaultWorldConfig();cfg.startYear=2027;
  cfg.regions=[regionCfg('NA',{teams:3,div2:false})];cfg.internationals=[];
  const db=buildWorld(cfg),[owner,buyer]=activeTeams(db);
  for(const t of [owner,buyer]){
    for(const role of ROLES){const p=genPlayer(db,new RNG(t.id+'/'+role,'loan-window'),{region:t.region,role,age:22,base:70});signContract(db,p,t,2,2,{promisedRole:'starter'})}
    initializeDepthChart(db,t,true);t.finance.cash=1000;
  }
  const player=genPlayer(db,new RNG('loan-window-player'),{region:owner.region,role:ROLES[0],age:22,base:45});
  player.personality.ambition=10;player.careerGoal='stability';signContract(db,player,owner,20,2,{promisedRole:'backup'});player.rosterRole='backup';
  db.world={phase:'season',year:2027,manage:'manual',seasons:{}};setManagedTeam(db,buyer.id);setWorldCalendarDate(db,'2027-01-07');
  db.regions.NA.transferWindows=[{from:'01-07',through:'01-31'}];
  const loan=commitWorldAction(db,{type:'player.loan',actor:'manager',pid:player.id,fromId:owner.id,teamId:buyer.id,
    duration:'half',salaryShare:.5,fee:0,promisedRole:'starter',recall:false,
    purchase:{type:'obligation',fee:2,salary:30,years:2,terms:{promisedRole:'starter'}}});
  if(!loan.ok)throw Error('synthetic loan setup failed: '+JSON.stringify(loan.errors));
  const original=packDB(db),copy=unpackDB(original),p=copy.players[player.id];
  setWorldCalendarDate(copy,p.loan.endDate);
  const windowError=permanentTransferWindowError(copy,p,copy.teams[buyer.id]);
  const before={team:p.team,owner:p.loan.ownerId,loan:!!p.loan,salary:p.contract.salary,ownerCash:copy.teams[owner.id].finance.cash,buyerCash:copy.teams[buyer.id].finance.cash};
  const daily=unpackDB(packDB(copy));
  const applied=commitWorldAction(copy,{type:'player.loan-purchase',actor:'system',pid:p.id,fromId:owner.id,teamId:buyer.id});
  const after={team:p.team,loan:!!p.loan,salary:p.contract.salary,lastEvent:p.careerEvents.at(-1)?.type,ownerCash:copy.teams[owner.id].finance.cash,buyerCash:copy.teams[buyer.id].finance.cash};
  processLoanDaily(daily);
  const dailyPlayer=daily.players[player.id];
  const afterDaily={team:dailyPlayer.team,loan:!!dailyPlayer.loan,ownerCash:daily.teams[owner.id].finance.cash,buyerCash:daily.teams[buyer.id].finance.cash};
  console.log('LOAN_CLOSED_WINDOW_OBSERVATION '+JSON.stringify({date:copy.worldDate,windowError,before,applied:applied.ok,after,afterDaily,originalUnchanged:packDB(db)===original}));
})();`);
