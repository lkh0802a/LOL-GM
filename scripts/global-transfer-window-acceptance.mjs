import {runEngineFixture} from './test-harness.mjs';

const result=await runEngineFixture(String.raw`(()=>{
 const check=(ok,msg)=>{if(!ok)throw Error('GLOBAL_TRANSFER_WINDOW '+msg)};
 function fixture(year){
  const cfg=defaultWorldConfig();cfg.startYear=year;
  cfg.regions=[regionCfg('NA',{teams:3,div2:false})];cfg.internationals=[];
  const db=buildWorld(cfg),[seller,buyer]=activeTeams(db),
   p=Object.values(db.players).find(p=>!p.team&&!p.retired);
  setManagedTeam(db,buyer.id);
  db.world={phase:'market',year,manage:'ai',seed:'global-transfer-'+year,seasons:{},marketLog:[]};
  db.worldDate=globalPlayerFAOpenDate(year);
  for(const t of [seller,buyer])t.finance.cash=1000;
  p.careerGoal='starter';p.personality.ambition=10;
  signContract(db,p,seller,100,2,{promisedRole:'starter',buyout:{type:'release',amount:1}});
  return {db,pid:p.id,sellerId:seller.id,buyerId:buyer.id};
 }
 let blocked=0,committed=0;
 for(const year of [2026,2027,2028]){
  const f=fixture(year),window=globalTransferMarketWindow(year),
   original=packDB(f.db),actions=[
    {type:'player.transfer',pid:f.pid,fromId:f.sellerId,teamId:f.buyerId,fee:1},
    {type:'player.sign',kind:'transfer',pid:f.pid,fromId:f.sellerId,teamId:f.buyerId,
     fee:1,salary:100,years:2,terms:{promisedRole:'starter'}}
   ];
  for(const action of actions)for(const actor of ['manager','ai','system']){
   const db=unpackDB(original),before=packDB(db),command={...action,actor},
    preview=previewWorldAction(db,command);
   check(preview.ok&&packDB(db)===before,'legal opening preview '+year+' '+action.type+' '+actor);
   const last=unpackDB(original);last.worldDate=window.lastOpenDate;
   check(previewWorldAction(last,command).ok,'last open day');
   check(commitWorldAction(last,command).ok,'actual legal transfer writer');
   check(last.players[f.pid].team===f.buyerId&&last.teams[f.sellerId].finance.cash===1001&&
    last.teams[f.buyerId].finance.cash===999,'single fee and actual ownership');
   const restored=unpackDB(packDB(last));
   check(restored.players[f.pid].team===f.buyerId&&restored.players[f.pid].careerEvents.some(e=>e.type==='transfer'),
    'actual transfer and history native restore');committed++;
   for(const date of [addDays(window.opensOn,-1),window.closesOn,year+'-01-10',year+'-07-05']){
    const denied=unpackDB(original);denied.worldDate=date;
    // Obsolete region/loan windows and a stale market phase cannot reopen it.
    denied.regions.NA.transferWindows=[{from:'01-01',through:'12-31'}];
    denied.regions.NA.loanWindows=[{from:'01-01',through:'12-31'}];
    const saved=packDB(denied),world=denied.world,player=denied.players[f.pid],
     out=commitWorldAction(denied,command);
    check(!out.ok&&out.reason==='market_closed'&&packDB(denied)===saved&&
     denied.world===world&&denied.players[f.pid]===player,'closed transfer mutated/accepted '+date);blocked++;
   }
   const stale=unpackDB(original),plan=previewWorldAction(stale,command);
   stale.worldDate=window.closesOn;const saved=packDB(stale);
   check(!applyWorldAction(stale,plan).ok&&packDB(stale)===saved,'held pre-close preview committed after closing');
  }
  const db=unpackDB(original);
  for(const phase of ['offseason','market','preseason','season']){
   db.world.phase=phase;db.worldDate=window.closesOn;
   check(!transferMarketOpen(db,db.teams[f.buyerId]),'phase bypass '+phase);
   db.worldDate=window.opensOn;db.regions.NA.transferWindows=[{from:'07-01',through:'07-14'}];
   check(transferMarketOpen(db,db.teams[f.buyerId]),'old regional window blocked global opening');
  }
  // A direct or stale market-close command must not settle players, move the
  // phase, or write finance/history before the exclusive closing boundary.
  for(const date of [window.opensOn,window.lastOpenDate]){
   const early=unpackDB(original);early.worldDate=date;
   const before=packDB(early),world=early.world,players=early.players;
   let rejected=false;try{closeMarket(early)}catch(error){rejected=/개방 중/.test(error.message)}
   check(rejected&&packDB(early)===before&&early.world===world&&early.players===players,
    'premature market close mutated or accepted '+date);
  }
  for(const date of [null,'invalid',year+'-02-31']){
   db.worldDate=date;const saved=packDB(db);
   check(!transferMarketOpen(db,db.teams[f.buyerId])&&packDB(db)===saved,'bad date did not fail closed');
  }
  // A genuine free agent is outside the contracted-player transfer window.
  db.worldDate=window.closesOn;db.world.phase='market';
  const fa=Object.values(db.players).find(p=>!p.team&&!p.retired);
  fa.careerGoal='starter';
  const signed=commitWorldAction(db,{type:'player.sign',kind:'fa',actor:'manager',pid:fa.id,
   teamId:f.buyerId,salary:100,years:2,terms:{promisedRole:'starter'}});
  check(signed.ok&&fa.team===f.buyerId,'year-round genuine FA signing blocked');
 }
 return {years:3,committed,blocked,managerAiSystem:true,retainedAndNewTerms:true,
  feeOwnershipHistory:true,stalePreviewRejected:true,wholeStateAndReferences:true,
  nativeRestore:true,yearRoundTrueFA:true,unlicensedTeamExceptionImplemented:false};
})()`,{timeout:60000});
console.log('GLOBAL_TRANSFER_WINDOW_ACCEPTANCE '+JSON.stringify(result));
