import {runEngineFixture} from './test-harness.mjs';
const result=await runEngineFixture(String.raw`(()=>{
 const check=(v,m)=>{if(!v)throw Error('CONTRACT_WINDOW_ROLLBACK '+m)};
 function fixture(initialized){
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,div2:false})];cfg.internationals=[];
  const db=buildWorld(cfg),team=activeTeams(db)[0];setManagedTeam(db,team.id);
  for(const t of activeTeams(db)){t.finance.cash=1000;for(const role of ROLES){
   const p=genPlayer(db,new RNG('rollback-'+t.id+role),{region:t.region,role,age:22,base:65});
   signContract(db,p,t,1,1);p.contract.option=null;
  }}
  db.world={year:db.year,seed:'contract-window-rollback',manage:'manual',phase:'offseason',seasons:{},steps:[],step:0,report:null,offers:[],marketLog:[],negotiations:{},recruitment:{},lastDate:db.year+'-11-23'};
  db.worldDate=db.world.lastDate;
  if(initialized)initOffseasonContractWindow(db);
  return unpackDB(packDB(db));
 }
 let cases=0;
 for(const initialized of [false,true])for(const kind of ['day','close']){
  const db=fixture(initialized),world=db.world,team=managedTeam(db),player=db.players[team.roster[0]],cash=team.finance;
  const before=packDB(db),raw=JSON.stringify(db),writer=kind==='day'?processTransferPayments:finalizeExclusiveContractExpiry;
  let reached=false;
  const fail=(...args)=>{const out=writer(...args);reached=true;throw Error('controlled after actual '+kind+' writer');};
  if(kind==='day')processTransferPayments=fail;else finalizeExclusiveContractExpiry=fail;
  let thrown=false;
  try{if(kind==='day')advanceOffseasonContractDay(db);else closeExclusiveContractWindow(db)}catch(e){thrown=e.message==='controlled after actual '+kind+' writer'}
  finally{if(kind==='day')processTransferPayments=writer;else finalizeExclusiveContractExpiry=writer;}
  check(reached&&thrown,'original writer error must propagate');
  check(JSON.stringify(db)===raw&&packDB(db)===before,'failure changed clock/contracts/finance/history or initialized window');
  check(db.world===world&&db.teams[team.id]===team&&db.players[player.id]===player&&team.finance===cash,'failure replaced original references');
  const retry=kind==='day'?advanceOffseasonContractDay(db):closeExclusiveContractWindow(db);
  check(retry.ok,'same operation cannot retry after rollback');
  const loaded=unpackDB(packDB(db));check(packDB(loaded)===packDB(db),'native restore after retry');
  cases++;
 }
 return {cases,realDailyWriter:true,realExpiryWriter:true,initRollback:true,wholeGraphAndReferences:true,originalError:true,retry:true,nativeRestore:true};
})()`,{timeout:30000});
console.log('CONTRACT_WINDOW_ROLLBACK_ACCEPTANCE '+JSON.stringify(result));
