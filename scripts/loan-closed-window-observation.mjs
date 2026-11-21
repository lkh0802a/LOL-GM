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
  // Cash is deliberately changed only in this synthetic copy after agreement.
  // The existing acceptance check at signing does not prove cash at expiry.
  const insufficient=unpackDB(packDB(copy));
  insufficient.teams[buyer.id].finance.cash=0.5;
  const poorBefore={buyerCash:insufficient.teams[buyer.id].finance.cash,ownerCash:insufficient.teams[owner.id].finance.cash};
  const poorResult=commitWorldAction(insufficient,{type:'player.loan-purchase',actor:'system',pid:p.id,fromId:owner.id,teamId:buyer.id});
  const restoredPoor=unpackDB(packDB(insufficient));
  const poorAfter={buyerCash:restoredPoor.teams[buyer.id].finance.cash,ownerCash:restoredPoor.teams[owner.id].finance.cash,
    loan:!!restoredPoor.players[p.id].loan,salary:restoredPoor.players[p.id].contract.salary};
  const poorSaved=packDB(restoredPoor);
  const poorRepeated=commitWorldAction(restoredPoor,{type:'player.loan-purchase',actor:'system',pid:p.id,fromId:owner.id,teamId:buyer.id});
  const poorRepeatUnchanged=packDB(restoredPoor)===poorSaved;
  const openPoor=unpackDB(packDB(copy));
  openPoor.teams[buyer.id].finance.cash=0.5;
  openPoor.regions.NA.transferWindows=[{from:'07-01',through:'07-14'}];
  const openWindowError=permanentTransferWindowError(openPoor,openPoor.players[p.id],openPoor.teams[buyer.id]);
  const openResult=commitWorldAction(openPoor,{type:'player.loan-purchase',actor:'system',pid:p.id,fromId:owner.id,teamId:buyer.id});
  const applied=commitWorldAction(copy,{type:'player.loan-purchase',actor:'system',pid:p.id,fromId:owner.id,teamId:buyer.id});
  const after={team:p.team,loan:!!p.loan,salary:p.contract.salary,lastEvent:p.careerEvents.at(-1)?.type,ownerCash:copy.teams[owner.id].finance.cash,buyerCash:copy.teams[buyer.id].finance.cash};
  const afterFirst=packDB(copy);
  const repeated=commitWorldAction(copy,{type:'player.loan-purchase',actor:'system',pid:p.id,fromId:owner.id,teamId:buyer.id});
  const repeatUnchanged=packDB(copy)===afterFirst;
  const restored=unpackDB(afterFirst),beforeRestoredRepeat=packDB(restored);
  const restoredRepeated=commitWorldAction(restored,{type:'player.loan-purchase',actor:'system',pid:p.id,fromId:owner.id,teamId:buyer.id});
  const restoredRepeatUnchanged=packDB(restored)===beforeRestoredRepeat;
  processLoanDaily(daily);
  const dailyPlayer=daily.players[player.id];
  const afterDaily={team:dailyPlayer.team,loan:!!dailyPlayer.loan,ownerCash:daily.teams[owner.id].finance.cash,buyerCash:daily.teams[buyer.id].finance.cash};
  const dailyAfterFirst=packDB(daily);processLoanDaily(daily);const dailyRepeatUnchanged=packDB(daily)===dailyAfterFirst;
  if(repeated.ok||restoredRepeated.ok||!repeatUnchanged||!restoredRepeatUnchanged||!dailyRepeatUnchanged||poorRepeated.ok||!poorRepeatUnchanged)throw Error('synthetic repeat processing changed the completed loan');
  console.log('LOAN_CLOSED_WINDOW_OBSERVATION '+JSON.stringify({date:copy.worldDate,windowError,before,applied:applied.ok,after,afterDaily,
    insufficientFunds:{before:poorBefore,applied:poorResult.ok,afterRestore:poorAfter,
      repeatAfterRestore:{applied:poorRepeated.ok,unchanged:poorRepeatUnchanged},openWindowControl:{windowError:openWindowError,applied:openResult.ok,buyerCash:openPoor.teams[buyer.id].finance.cash}},
    repeat:{applied:repeated.ok,errors:repeated.errors,unchanged:repeatUnchanged,restoredApplied:restoredRepeated.ok,restoredErrors:restoredRepeated.errors,restoredUnchanged:restoredRepeatUnchanged,dailyRepeatUnchanged},originalUnchanged:packDB(db)===original}));
})();`);
