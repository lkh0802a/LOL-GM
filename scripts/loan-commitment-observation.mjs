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
  buyer.finance.cash=3;
  const second=genPlayer(db,new RNG('second-obligation'),{region:owner.region,role:ROLES[1],age:22,base:45});
  second.personality.ambition=10;second.careerGoal='stability';signContract(db,second,owner,20,2,{promisedRole:'backup'});
  const before=packDB(db), committed=financeCommittedTransferCash(db,buyer);
  const input={duration:'half',salaryShare:.5,fee:0,promisedRole:'starter',recall:false,purchase:{type:'obligation',fee:2,salary:30,years:2,terms:{promisedRole:'starter'}}};
  const quote=validateLoanPurchaseTerms(db,second,owner,buyer,input,false);
  const cloned=unpackDB(before);
  const action=commitWorldAction(cloned,{type:'player.loan',actor:'manager',pid:second.id,fromId:owner.id,teamId:buyer.id,...input});
  const committedAfter=financeCommittedTransferCash(cloned,cloned.teams[buyer.id]);
  const restored=unpackDB(packDB(cloned));
  const low=unpackDB(before);low.teams[buyer.id].finance.cash=1.5;
  const lowAction=commitWorldAction(low,{type:'player.loan',actor:'manager',pid:second.id,fromId:owner.id,teamId:buyer.id,...input});
  console.log('LOAN_COMMITMENT_OBSERVATION '+JSON.stringify({cash:buyer.finance.cash,existingCommitted:committed,secondFee:2,quoteAccepted:quote.ok,reason:quote.reason||null,actionAccepted:action.ok,actionErrors:action.errors||[],committedAfter,restoredCommitted:financeCommittedTransferCash(restored,restored.teams[buyer.id]),lowCashActionAccepted:lowAction.ok,lowCashErrors:lowAction.errors||[],originalUnchanged:packDB(db)===before}));
})();`);
