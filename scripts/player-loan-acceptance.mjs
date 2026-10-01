import {runEngineFixture,artifactSource} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
  const check=(ok,msg)=>{if(!ok)throw Error('PLAYER_LOAN '+msg)};
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:3,div2:false})];cfg.internationals=[];
  const db=buildWorld(cfg),[owner,borrower,other]=activeTeams(db);
  for(const t of [owner,borrower,other]){
    for(const role of ROLES){const p=Object.values(db.players).find(p=>!p.team&&!p.retired&&p.role===role&&isLocalPlayer(p,t.region));
      signContract(db,p,t,2,2,{promisedRole:'starter'});p.attrs=Object.fromEntries(Object.keys(p.attrs).map(k=>[k,70]));}
    initializeDepthChart(db,t,true);t.finance.cash=100;
  }
  const p=genPlayer(db,new RNG('loan-fixture','player'),{region:owner.region,role:ROLES[0],age:22,base:45});
  p.attrs=Object.fromEntries(Object.keys(p.attrs).map(k=>[k,45]));p.personality.ambition=10;p.careerGoal='stability';
  signContract(db,p,owner,20,2,{promisedRole:'backup'});p.rosterRole='backup';
  db.world={phase:'season',year:db.year,manage:'manual',seasons:{}};
  setManagedTeam(db,borrower.id);setWorldCalendarDate(db,db.year+'-01-10');
  const command={type:'player.loan',actor:'manager',pid:p.id,fromId:owner.id,teamId:borrower.id,
    duration:'half',salaryShare:.5,fee:2,promisedRole:'starter',recall:false};
  const before=JSON.stringify(db),preview=previewWorldAction(db,command);
  check(preview.ok&&JSON.stringify(db)===before,'valid preview mutated world or refused: '+JSON.stringify(preview));
  const zero=unpackDB(before),zeroOwner=zero.teams[owner.id],zeroBorrower=zero.teams[borrower.id];
  const zeroSourcePay=payroll(zero,zeroOwner),zeroDestPay=payroll(zero,zeroBorrower);
  check(commitWorldAction(zero,{...command,salaryShare:0,fee:5}).ok&&
    payroll(zero,zeroOwner)===zeroSourcePay&&payroll(zero,zeroBorrower)===zeroDestPay,'zero-share negotiated loan rejected or misbudgeted');
  setWorldCalendarDate(zero,zero.year+'-07-01');processLoanDaily(zero);
  check(!zeroOwner.finance.loanWages&&!zeroBorrower.finance.loanWages,'zero-share loan invented wage expense');
  // Invalid terms, destination-only window, and managed economic authority.
  for(const patch of [{salaryShare:-.1},{fee:NaN},{duration:'month'},{actor:'system'}])
    check(!previewWorldAction(db,{...command,...patch}).ok,'invalid loan terms or forced start accepted');
  setWorldCalendarDate(db,db.year+'-02-01');check(!previewWorldAction(db,command).ok,'closed destination window accepted');
  setWorldCalendarDate(db,db.year+'-01-10');
  const originalParent=borrower.parent;
  borrower.parent=other.id;check(!previewWorldAction(db,command).ok,'owned reserve coach recruited loan');borrower.parent=originalParent;
  // Production AI uses observations, cannot touch managed economics, and reviews once.
  const ai=unpackDB(before),aiOwner=ai.teams[owner.id],aiBorrower=ai.teams[borrower.id],aiP=ai.players[p.id];
  setManagedTeam(ai,other.id);aiBorrower.finance.cash=1000;
  for(const id of aiOwner.roster)ai.players[id].attrs=Object.fromEntries(Object.keys(ai.players[id].attrs).map(k=>[k,id===p.id?80:95]));
  aiP.reputation=80;aiP.contract.salary=50;
  const weak=starterFor(ai,aiBorrower,ROLES[0]);weak.attrs=Object.fromEntries(Object.keys(weak.attrs).map(k=>[k,20]));
  initializeDepthChart(ai,aiOwner,true);initializeDepthChart(ai,aiBorrower,true);
  const outbound=unpackDB(packDB(ai));setManagedTeam(outbound,owner.id);
  const outboundBefore=JSON.stringify(outbound),outboundPlan=previewWorldAction(outbound,command);
  check(outboundPlan.ok&&JSON.stringify(outbound)===outboundBefore,'manager outgoing club consent was impure or refused');
  const cross=unpackDB(before),crossBorrower=cross.teams[borrower.id];
  cross.regions.KR={...cross.regions.NA,id:'KR',loanWindows:[{from:'01-10',through:'01-10'}]};
  cross.regions.NA.loanWindows=[{from:'02-01',through:'02-02'}];crossBorrower.region='KR';
  for(const id of crossBorrower.roster)cross.players[id].activeLocalRegion='KR';
  check(previewWorldAction(cross,command).ok,'closed source region incorrectly blocked open destination');
  cross.players[crossBorrower.roster[0]].activeLocalRegion='NA';
  cross.players[crossBorrower.roster[1]].activeLocalRegion='NA';
  check(!previewWorldAction(cross,command).ok,'cross-region foreign registration cap bypassed');
  const aiDeals=aiReviewLoanMarket(ai);
  check(aiDeals>=1&&aiP.loan&&aiP.team===borrower.id,'production AI failed affordable consenting sporting loan');
  check(aiReviewLoanMarket(ai)===0,'AI repeated same window');
  borrower.finance.cash--;check(!applyWorldAction(db,preview).ok,'stale finances accepted');borrower.finance.cash++;
  const writer=loanMovePlayer;
  loanMovePlayer=(...args)=>{writer(...args);throw Error('late fixture failure')};
  check(!applyWorldAction(db,preview).ok&&JSON.stringify(db)===before,'failed assignment did not roll back embedded loan/rosters');
  loanMovePlayer=writer;
  const contract=JSON.stringify(p.contract),local=p.activeLocalRegion,sourcePay=payroll(db,owner),destPay=payroll(db,borrower);
  check(applyWorldAction(db,preview).ok,'valid loan did not commit');
  check(p.team===borrower.id&&p.loan.ownerId===owner.id&&JSON.stringify(p.contract)===contract&&p.activeLocalRegion===local,
    'ownership, contract, or local qualification changed');
  check(owner.finance.cash===102&&borrower.finance.cash===98&&contractedMoveCount(db,p)===1,'fee or move count wrong');
  check(payroll(db,owner)===sourcePay-10&&payroll(db,borrower)===destPay+10,'annual wage-share budget wrong');
  check(effectiveRolePromiseStatus(db,p).role==='starter','borrower role promise not used');
  for(const action of [
    {type:'player.release',pid:p.id,teamId:borrower.id,actor:'manager'},
    {type:'player.sign',pid:p.id,teamId:borrower.id,actor:'manager',kind:'renewal',salary:30,years:2},
    {type:'player.transfer',pid:p.id,fromId:borrower.id,teamId:other.id,fee:0,actor:'system'},
    {type:'player.loan-return',pid:p.id,fromId:borrower.id,teamId:owner.id,actor:'system'}
  ])check(!commitWorldAction(db,action).ok,'loan rights or no-recall clause bypassed '+action.type);
  setWorldCalendarDate(db,db.year+'-02-10');processLoanDaily(db);
  const days=31,yearDays=(Date.UTC(db.year+1,0,1)-Date.UTC(db.year,0,1))/86400000,amount=10*days/yearDays;
  check(Math.abs(owner.finance.loanWages.amount+amount)<1e-9&&Math.abs(borrower.finance.loanWages.amount-amount)<1e-9,
    'actual day wage accrual failed');
  const accrued=JSON.stringify(db);processLoanDaily(db);check(JSON.stringify(db)===accrued,'daily wage accrued twice');
  const saved=unpackDB(packDB(db));
  check(saved.players[p.id].loan.ownerId===owner.id&&payroll(saved,saved.teams[owner.id])===payroll(db,owner),
    'active loan or derived index lost on restore');
  const damaged=JSON.parse(packDB(db));damaged.players[p.id].loan.salaryShare=2;
  let refused=false;try{unpackDB(JSON.stringify(damaged))}catch{refused=true}
  check(refused,'corrupt loan save was accepted');
  p.usage={year:db.year,games:12,teamGames:20,unavailableTeamGames:2};
  setWorldCalendarDate(db,db.year+'-07-01');processLoanDaily(db);
  check(!p.loan&&p.team===owner.id&&contractedMoveCount(db,p)===1&&p.rosterRole==='backup','automatic return changed move count or role');
  check(contractRolePromiseStatus(db,p).games===0&&contractRolePromiseStatus(db,p).teamGames===0,
    'borrower games leaked into original promise');
  check(Math.abs(owner.finance.loanWages.amount+borrower.finance.loanWages.amount)<1e-9,'wage conservation failed');
  check(ownedContractPayroll(db,owner)===sourcePay&&ownedContractPayroll(db,borrower)===destPay,'annual salary baseline doubled loan wages');
  check(financeOperatingExpense(db,owner).loanWages<0&&financeOperatingExpense(db,borrower).loanWages>0,'annual statements omitted wage pair');
  const annual=unpackDB(packDB(db)),annualOwner=annual.teams[owner.id],annualBorrower=annual.teams[borrower.id],
    annualOwnerCash=annualOwner.finance.cash,annualBorrowerCash=annualBorrower.finance.cash;
  closeFinances(annual,{year:annual.year,seasons:{}},new RNG('loan-close','finance'),()=>{});
  const ownerStatement=annualOwner.finance.history.at(-1),borrowerStatement=annualBorrower.finance.history.at(-1);
  check(!annualOwner.finance.loanWages&&!annualBorrower.finance.loanWages&&
    ownerStatement.exp.loanWages===-borrowerStatement.exp.loanWages,'annual close failed matching accrual or clearing settled wages');
  check(Math.abs(annualOwner.finance.cash-annualOwnerCash-ownerStatement.net+2)<.11&&
    Math.abs(annualBorrower.finance.cash-annualBorrowerCash-borrowerStatement.net-2)<.11,
    'annual close charged prepaid loan fee twice');
  closeFinances(annual,{year:annual.year+1,seasons:{}},new RNG('loan-next-close','finance'),()=>{});
  check(!('loanWages' in annualOwner.finance.history.at(-1).exp)&&!('loanWages' in annualBorrower.finance.history.at(-1).exp),
    'next season recharged settled loan wages');
  // Return capacity is reserved, including foreign-player places.
  const again={...command,recall:true,duration:'season'};
  check(commitWorldAction(db,again).ok,'second seasonal move refused');
  check(contractedMoveCount(db,p)===2,'second departure not counted');
  const unowned=Object.values(db.players).filter(x=>!x.team&&!x.retired&&isLocalPlayer(x,owner.region));
  while(owner.roster.length<9)signContract(db,unowned.pop(),owner,1,1);
  check(loanRosterCapacityError(db,owner,unowned[0]),'return slot was not reserved');
  const third=unpackDB(packDB(db));setManagedTeam(third,owner.id);
  check(commitWorldAction(third,{type:'player.loan-return',pid:p.id,fromId:borrower.id,teamId:owner.id,actor:'manager'}).ok,
    'agreed recall refused');
  setManagedTeam(third,borrower.id);
  const limited=previewWorldAction(third,{...command,duration:'season'});
  check(!limited.ok&&limited.errors.some(message=>message.includes('최대 2회')),'third move bypassed season limit');
  const seasonEnd=unpackDB(packDB(db));seasonEnd.world.steps=[];seasonEnd.world.step=-1;
  seasonEnd.world.lastDate=seasonEnd.worldDate;advanceStep(seasonEnd);
  check(!seasonEnd.players[p.id].loan&&seasonEnd.players[p.id].team===owner.id&&
    seasonEnd.world.contractWindow.financePayroll[owner.id].salary===ownedContractPayroll(seasonEnd,seasonEnd.teams[owner.id]),
    'season-end orchestration snapshot ran before full loan return');
  const closeBefore=JSON.stringify(db),close=previewWorldAction(db,{type:'club.close',teamId:borrower.id,actor:'system'});
  check(close.ok&&close.command.financeTeamIds.includes(owner.id)&&JSON.stringify(db)===closeBefore,'closure missed loan counterparty or mutated preview');
  const closer=settleClubClosureFinance;
  settleClubClosureFinance=(...args)=>{closer(...args);throw Error('closure failure')};
  check(!applyWorldAction(db,close).ok&&JSON.stringify(db)===closeBefore,'closure rollback lost loan or counterparty');
  settleClubClosureFinance=closer;
  check(applyWorldAction(db,close).ok&&p.team===owner.id&&p.contract&&!p.loan,'borrower closure terminated owner contract');
  check(!rosterIntegrityErrors(db).length,'loan left duplicate roster membership');
  // Lender closure releases its own contract at the borrower, with owner liability.
  const lenderClosed=unpackDB(packDB(saved)),lp=lenderClosed.players[p.id],lt=lenderClosed.teams[owner.id];
  check(commitWorldAction(lenderClosed,{type:'club.close',teamId:owner.id,actor:'system'}).ok&&
    !lp.team&&!lp.loan&&!lp.contract&&lt.finance.closureSettlement.items.some(row=>row.pid===p.id),
    'lender closure did not terminate borrower registration with owner liability');
  // UI cancel/confirm reaches the same gateway and saves only committed results.
  const uiDb=unpackDB(packDB(saved)),uiP=uiDb.players[p.id];
  uiP.loan.recall=true;setManagedTeam(uiDb,owner.id);
  globalThis.DB=uiDb;globalThis.esc=x=>String(x);globalThis.MSG='';
  let saves=0;globalThis.saveDB=()=>saves++;globalThis.navKeepScroll=()=>{};
  const button={dataset:{loanReturn:p.id}};
  globalThis.document={querySelectorAll:q=>q==='[data-loan-return]'?[button]:[],querySelector:()=>null};
  globalThis.confirm=()=>false;bindLoanControls();const uiBefore=JSON.stringify(uiDb);button.onclick({stopPropagation(){}});
  check(JSON.stringify(uiDb)===uiBefore&&saves===0,'cancel committed or saved recall');
  globalThis.confirm=()=>true;button.onclick({stopPropagation(){}});
  check(!uiP.loan&&uiP.team===owner.id&&saves===1,'confirmed recall did not commit/save');
  const uiStart=unpackDB(before),uiStartP=uiStart.players[p.id];globalThis.DB=uiStart;
  const startButton={dataset:{loanPreview:p.id}},values={duration:{value:'half'},role:{value:'starter'},
    share:{value:'50'},fee:{value:'2'},recall:{checked:false}};
  globalThis.document={querySelectorAll:q=>q==='[data-loan-preview]'?[startButton]:[],
    querySelector:q=>{const key=q.match(/data-loan-([^=]+)/)?.[1];return values[key]||null}};
  globalThis.confirm=()=>false;bindLoanControls();const startBefore=JSON.stringify(uiStart);startButton.onclick({stopPropagation(){}});
  check(JSON.stringify(uiStart)===startBefore&&saves===1,'cancelled UI loan proposal changed world');
  globalThis.confirm=()=>true;startButton.onclick({stopPropagation(){}});
  check(uiStartP.loan&&saves===2&&playerLoanPanel(uiStartP).includes('계약 구단'),'confirmed loan UI failed or hid ownership');
  check(squadLoanPanel(uiStart.teams[owner.id]).includes(uiStartP.name),'outgoing loan missing from original squad');
  console.log('PLAYER_LOAN_ACCEPTANCE '+JSON.stringify({pureStaleRollback:true,ownerContract:true,
    rights:true,wageConservation:true,halfReturn:true,moveLimit:true,reservedCapacity:true,
    closureRollback:true,saveRestore:true,uiConfirmCancel:true,aiProduction:true,windowAuthority:true}));
})();`,{filename:'player-loan.fixture.js',setupSources:[await artifactSource('ui-player-loans.js')]});
