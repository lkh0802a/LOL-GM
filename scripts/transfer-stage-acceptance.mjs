import {runEngineFixture,artifactSources} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
  const check=(ok,msg)=>{if(!ok)throw Error('TRANSFER_STAGE '+msg)};
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:3,div2:false})];cfg.internationals=[];
  const initial=buildWorld(cfg),[owner,buyer,other]=activeTeams(initial),year=initial.year;
  for(const t of [owner,buyer,other]){
    for(const role of ROLES){const p=genPlayer(initial,new RNG(t.id+'/'+role,'fixture'),{region:t.region,role,age:22,base:70});
      signContract(initial,p,t,2,2,{promisedRole:'starter'});}
    initializeDepthChart(initial,t,true);t.finance.cash=100;
  }
  const player=genPlayer(initial,new RNG('stage-player','fixture'),{region:owner.region,role:ROLES[0],age:22,base:45});
  player.personality.ambition=10;player.careerGoal='stability';
  signContract(initial,player,owner,20,2,{promisedRole:'backup'});player.rosterRole='backup';
  initial.world={phase:'season',year,manage:'manual',seasons:{}};setManagedTeam(initial,buyer.id);
  setWorldCalendarDate(initial,year+'-01-10');const raw=packDB(initial),pid=player.id;
  const loan={type:'player.loan',actor:'manager',pid,fromId:owner.id,teamId:buyer.id,
    duration:'half',salaryShare:.5,fee:0,promisedRole:'starter',recall:false,
    purchase:{type:'option',fee:2,salary:30,years:2,terms:{promisedRole:'starter'},
      feePlan:{upfront:1,installments:[{date:year+'-08-01',amount:1}],addOns:[]}}};
  const db=unpackDB(raw),p=db.players[pid],source=db.teams[owner.id],target=db.teams[buyer.id];
  const loanBefore=JSON.stringify(db),loanPlan=previewWorldAction(db,loan);
  check(loanPlan.ok&&JSON.stringify(db)===loanBefore,'purchase clause preview impure or rejected '+JSON.stringify(loanPlan));
  check(!previewWorldAction(db,{...loan,purchase:{...loan.purchase,type:'obligation'},recall:true}).ok,
    'obligation could be cancelled by recall');
  check(commitWorldAction(db,loan).ok,'option loan failed');
  setWorldCalendarDate(db,year+'-02-10');processLoanDaily(db);
  const buyCommand={type:'player.loan-purchase',actor:'manager',pid,fromId:owner.id,teamId:buyer.id},
    buyBefore=JSON.stringify(db),buyPlan=previewWorldAction(db,buyCommand),writer=settleTransferSigningFee;
  check(buyPlan.ok&&JSON.stringify(db)===buyBefore,'outside-window ownership conversion failed pure preview');
  settleTransferSigningFee=(...args)=>{writer(...args);throw Error('late purchase failure')};
  check(!applyWorldAction(db,buyPlan).ok&&JSON.stringify(db)===buyBefore,'purchase did not restore loan, finance and service');
  settleTransferSigningFee=writer;
  check(applyWorldAction(db,buyPlan).ok&&!p.loan&&p.team===buyer.id&&p.contract.salary===30&&
    contractedMoveCount(db,p)===1&&!loanOutgoingPlayers(db,source).length,'purchase changed registration/move count or left return reservation');
  const annualSalary=t=>{const exp=financeOperatingExpense(db,t);return exp.salary+(exp.loanWages||0)+(exp.loanConversion||0)},
    fraction=(Date.parse(year+'-02-10')-Date.UTC(year,0,1))/(Date.UTC(year+1,0,1)-Date.UTC(year,0,1));
  check(Math.abs(annualSalary(source)+annualSalary(target)-(20+20*fraction+30*(1-fraction)))<1e-8,
    'purchase charged both annual contracts or lost prior wages');
  check(source.finance.cash===101&&target.finance.cash===99&&transferPaymentExposure(target).guaranteed===1,
    'purchase installment initial cost/exposure wrong');
  check(unpackDB(packDB(db)).players[pid].careerEvents.some(e=>e.type==='loan_purchase'),'conversion history/save lost');
  // Binding full-season purchase starts the next season contract automatically,
  // including when cash later falls below its original guarantee.
  const mandatory=unpackDB(raw),mp=mandatory.players[pid];
  check(commitWorldAction(mandatory,{...loan,duration:'season',purchase:{...loan.purchase,type:'obligation',feePlan:null}}).ok,
    'binding full-season loan failed');
  mandatory.teams[buyer.id].finance.cash=0;mandatory.world.steps=[];mandatory.world.step=-1;
  mandatory.world.lastDate=year+'-11-01';setWorldCalendarDate(mandatory,year+'-11-01');advanceStep(mandatory);
  check(!mp.loan&&mp.team===buyer.id&&mp.contract.signed===year+1&&mp.contract.until===year+2&&
    contractedMoveCount(mandatory,mp)===1&&mandatory.teams[buyer.id].finance.cash===-2,
    'binding obligation vanished in distress or did not cover next season');
  const mb=financeOperatingExpense(mandatory,mandatory.teams[buyer.id]),mo=financeOperatingExpense(mandatory,mandatory.teams[owner.id]);
  check(Math.abs(mb.salary+mo.salary+(mb.loanWages||0)+(mo.loanWages||0)+(mb.loanConversion||0)+(mo.loanConversion||0)-40)<1e-8,
    'season-end purchase charged future salary in closing year');
  // Production weekly AI exercises an affordable agreed option, while manual
  // manager decisions stay protected. Recall solves a real five-player shortage.
  const automated=unpackDB(raw);check(commitWorldAction(automated,loan).ok,'AI preparation failed');
  automated.teams[buyer.id].finance.cash=1000;automated.teams[buyer.id].depthChart[ROLES[0]]=pid;setWorldCalendarDate(automated,year+'-01-14');
  aiReviewLoanDecisions(automated);check(automated.players[pid].loan,'AI purchased for manual manager');
  setManagedTeam(automated,other.id);aiReviewLoanDecisions(automated);
  check(!automated.players[pid].loan,'production AI did not exercise useful affordable option');
  const recalled=unpackDB(raw);check(commitWorldAction(recalled,{...loan,purchase:null,recall:true}).ok,'recall preparation failed');
  setManagedTeam(recalled,other.id);setWorldCalendarDate(recalled,year+'-01-14');
  const injured=recalled.players[recalled.teams[owner.id].depthChart[ROLES[0]]];injured.medical={daysLeft:30,out:true};
  aiReviewLoanDecisions(recalled);check(!recalled.players[pid].loan&&recalled.players[pid].team===owner.id,'AI shortage recall failed');
  // A permanent transfer offers guaranteed installments plus independent
  // appearance, international and club-title conditions.
  const fees=unpackDB(raw),fp=fees.players[pid],seller=fees.teams[owner.id],club=fees.teams[buyer.id];
  const plan={upfront:3,installments:[{date:year+'-01-31',amount:6}],addOns:[
    {kind:'appearances',threshold:2,amount:2,through:year+'-12-31'},
    {kind:'international',threshold:1,amount:1,through:year+'-01-11'},
    {kind:'titles',threshold:1,amount:1,through:year+'-12-31'}]};
  const transfer={type:'player.transfer',actor:'manager',pid,fromId:owner.id,teamId:buyer.id,fee:9,feePlan:plan},
    transferBefore=JSON.stringify(fees),tp=previewWorldAction(fees,transfer);
  check(tp.ok&&JSON.stringify(fees)===transferBefore,'fee preview mutated world');
  check(!previewWorldAction(fees,{...transfer,feePlan:{...plan,upfront:4}}).ok,'unbalanced guaranteed fee accepted');
  check(applyWorldAction(fees,tp).ok&&seller.finance.cash===103&&club.finance.cash===97,'full fee was prepaid instead of first installment');
  const dealId=transferDealRows(club)[0].id;
  fees.competitions.FEE_TEST={id:'FEE_TEST',international:false};setWorldCalendarDate(fees,year+'-01-12');
  updatePlayerUsage(fees,{comp:'FEE_TEST',year},{a:buyer.id,b:other.id,games:[{winner:buyer.id},{winner:buyer.id}]},
    [{pid,role:ROLES[0],win:true},{pid,role:ROLES[0],win:true}]);
  check(club.finance.cash===95&&transferDealRows(club)[0].rows[1].status==='paid'&&
    transferDealRows(club)[0].rows[2].status==='expired','official conditions were fabricated, missed or paid after expiry');
  const repeated=JSON.stringify(fees);processTransferPayments(fees);check(JSON.stringify(fees)===repeated,'condition paid twice');
  setWorldCalendarDate(fees,year+'-01-31');club.finance.cash=1.5;processTransferPayments(fees);
  check(club.finance.cash===0&&transferDealRows(club)[0].rows[0].paid===1.5&&
    transferPaymentExposure(club).guaranteed===4.5,'cash shortage erased remaining invoice or overdrew club');
  const restored=unpackDB(packDB(fees));check(transferPaymentExposure(restored.teams[buyer.id]).guaranteed===4.5,'partial invoice save lost debt');
  const orphaned=unpackDB(packDB(fees));delete orphaned.players[pid];
  orphaned.teams[buyer.id].active=false;orphaned.teams[buyer.id].finance.cash=5;
  processTransferPayments(orphaned);
  check(transferPaymentExposure(orphaned.teams[buyer.id]).guaranteed===0&&
    orphaned.teams[buyer.id].finance.cash===.5,'retirement/deletion or club closure erased surviving invoice');
  club.finance.cash=10;const payCommand={type:'finance.transfer-payment',actor:'system',pid,fromId:owner.id,teamId:buyer.id,dealId},
    payBefore=JSON.stringify(fees),payPlan=previewWorldAction(fees,payCommand),cashWriter=receiveFinancePrepaidTransfer;
  receiveFinancePrepaidTransfer=(...args)=>{cashWriter(...args);throw Error('late payment failure')};
  check(!applyWorldAction(fees,payPlan).ok&&JSON.stringify(fees)===payBefore,'payment rollback lost ledger/counterparty cash');
  receiveFinancePrepaidTransfer=cashWriter;check(applyWorldAction(fees,payPlan).ok&&club.finance.cash===5.5,'remaining invoice not settled');
  fees.world.seasons.TITLE={id:'TITLE',year,done:true,champion:buyer.id,days:[{date:year+'-02-01'}]};
  setWorldCalendarDate(fees,year+'-02-01');processTransferPayments(fees);
  check(transferDealRows(club)[0].rows[3].status==='paid'&&club.finance.cash===4.5,'actual completed club title did not trigger invoice');
  const pastTitle=unpackDB(raw);pastTitle.world.seasons.PAST={id:'PAST',year,done:true,champion:buyer.id,days:[{date:year+'-01-10'}]};
  check(commitWorldAction(pastTitle,transfer).ok,'title baseline preparation failed');processTransferPayments(pastTitle);
  check(transferDealRows(pastTitle.teams[buyer.id])[0].rows[3].status==='pending','already completed title paid retroactively');
  const damaged=JSON.parse(packDB(fees));damaged.teams[buyer.id].finance.transferDeals[dealId].rows[0].paid=100;
  let denied=false;try{unpackDB(JSON.stringify(damaged))}catch{denied=true}check(denied,'corrupt invoice save accepted');
  // Ordinary moves use the destination window; pre-agreed ownership conversion
  // has no new squad move. An existing future-contract mechanism remains intact.
  const closed=unpackDB(raw);setWorldCalendarDate(closed,year+'-02-01');
  check(!previewWorldAction(closed,{...transfer,feePlan:null}).ok,'closed destination permanent market ignored');
  closed.regions.NA.transferWindows=[{from:'02-01',through:'02-01'}];
  check(previewWorldAction(closed,{...transfer,feePlan:null}).ok,'custom destination opening ignored');
  // Real purchase confirmation cancel/save flow, not just markup checks.
  const ui=unpackDB(raw);check(commitWorldAction(ui,loan).ok,'UI preparation failed');
  globalThis.DB=ui;globalThis.esc=x=>String(x);globalThis.MSG='';let saves=0;
  globalThis.saveDB=()=>saves++;globalThis.navKeepScroll=()=>{};
  const button={dataset:{loanPurchase:pid}};globalThis.document={querySelectorAll:q=>q==='[data-loan-purchase]'?[button]:[],querySelector:()=>null};
  globalThis.confirm=()=>false;bindLoanPurchaseControls();const cancelled=JSON.stringify(ui);button.onclick({stopPropagation(){}});
  check(JSON.stringify(ui)===cancelled&&saves===0,'cancelled purchase committed');
  globalThis.confirm=()=>true;button.onclick({stopPropagation(){}});
  check(!ui.players[pid].loan&&saves===1&&transferPaymentsPanel(ui.teams[buyer.id]).includes('미지급 보장'),'confirmed purchase/financial UI failed');
  console.log('TRANSFER_STAGE_ACCEPTANCE '+JSON.stringify({purchaseConsentRollback:true,ownershipWages:true,
    bindingNextSeason:true,aiPurchaseRecall:true,officialConditions:true,partialDebt:true,
    invoiceRollback:true,saveValidation:true,destinationWindow:true,uiConfirmCancel:true}));
})();`,{filename:'transfer-stage.fixture.js',setupSources:await artifactSources(['ui-transfer-terms.js'])});
