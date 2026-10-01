import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
  const check=(ok,msg)=>{if(!ok)throw Error('TRANSFER_CONSENT '+msg)};
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:3,div2:false})];
  cfg.internationals=[];
  const db=buildWorld(cfg),[seller,buyer,owner]=activeTeams(db),
    p=Object.values(db.players).find(p=>!p.team&&!p.retired);
  setManagedTeam(db,buyer.id);db.world={phase:'market',year:db.year,manage:'ai'};
  p.attrs=Object.fromEntries(Object.keys(p.attrs).map(k=>[k,90]));
  p.reputation=90;p.careerGoal='international';
  signContract(db,p,seller,.1,2,{signingBonus:10,promisedRole:'starter'});
  buyer.finance.cash=100;seller.finance.cash=100;
  const before=JSON.stringify(db),refusal=contractTransferConsent(db,p,buyer);
  check(refusal.ok&&!refusal.willing&&refusal.terms.signingBonus===0&&
    JSON.stringify(db)===before,'retained-contract consent mutated state or counted paid bonus');
  const direct={type:'player.transfer',pid:p.id,fromId:seller.id,teamId:buyer.id,fee:1};
  for(const actor of ['manager','ai','system']){
    const denied=commitWorldAction(db,{...direct,actor});
    check(!denied.ok&&denied.reason==='player_consent'&&JSON.stringify(db)===before,
      'actor bypassed player rejection');
  }
  const cheap={...direct,type:'player.sign',actor:'manager',kind:'transfer',
    salary:.1,years:2,terms:{promisedRole:'backup'}};
  check(!commitWorldAction(db,cheap).ok&&JSON.stringify(db)===before,
    'new-terms transfer bypassed consent');
  const salary=Math.ceil(asking(db,p,buyer.region)*2*10)/10,
    command={...cheap,salary,terms:{promisedRole:'starter',releaseGuaranteeRate:1}};
  const planBefore=JSON.stringify(db),personal=aiTransferPersonalTerms(db,p,buyer,salary);
  check(personal?.kind==='new'&&personal.consent.willing&&personal.salary<=salary&&
    personal.terms.signingBonus===0&&JSON.stringify(db)===planBefore,
    'AI new terms are not a pure, affordable, consenting proposal');
  check(!aiTransferPersonalTerms(db,p,buyer,0)&&JSON.stringify(db)===planBefore,
    'AI promised a wage without payroll room');
  const postFeeRoom=aiTransferSalaryRoom(db,buyer,50),cashBefore=buyer.finance.cash;
  buyer.finance.cash-=50;
  check(postFeeRoom===Math.max(0,salaryBudget(db,buyer)-payroll(db,buyer)),
    'AI budget failed to account for actual transfer fee');
  buyer.finance.cash=cashBefore;
  check(JSON.stringify(db)===planBefore,'AI post-fee budget preview mutated world');
  const retainedContract=p.contract;
  p.contract={...p.contract,salary,promisedRole:'starter'};
  check(aiTransferPersonalTerms(db,p,buyer,salary)?.kind==='retained',
    'AI unnecessarily replaced an affordable accepted contract');
  p.contract=retainedContract;
  const previewBefore=JSON.stringify(db),preview=previewWorldAction(db,command);
  check(preview.ok&&preview.command.consent.willing&&JSON.stringify(db)===previewBefore,
    'consenting transfer preview mutated world');
  const originalGoal=p.careerGoal;p.careerGoal='starter';
  check(!applyWorldAction(db,preview).ok,'changed career preference accepted old consent');
  p.careerGoal=originalGoal;
  const original=worldActionScopeErrors,rollbackBefore=JSON.stringify(db);
  worldActionScopeErrors=()=>['late consenting transfer failure'];
  const failed=commitWorldAction(db,command);worldActionScopeErrors=original;
  check(!failed.ok&&JSON.stringify(db)===rollbackBefore,'consenting transfer failed rollback');
  check(applyWorldAction(db,preview).ok&&p.team===buyer.id&&p.contract.salary===salary&&
    p.careerEvents.find(e=>e.type==='transfer').consent.willing,
    'accepted personal terms or consent event did not commit');
  const restored=unpackDB(packDB(db));
  check(restored.players[p.id].careerEvents.find(e=>e.type==='transfer').consent.terms.salary===salary,
    'consent terms lost in save');
  // Future agreements and medical terms cannot be displaced by a transfer.
  db.world.contractAgreements={[p.id]:{status:'agreed',teamId:owner.id}};
  check(!contractTransferConsent(db,p,seller).ok,'pending next contract was bypassed');
  db.world.contractAgreements={};p.contract.medicalReplacement={};
  check(!contractTransferConsent(db,p,seller).ok,'medical replacement was transferred');
  // Production AI must renegotiate, rather than force refused retained terms.
  const market=buildWorld(cfg),[vendor,rich,managed]=activeTeams(market),rng=new RNG('consent-supply');
  setManagedTeam(market,managed.id);
  market.world={phase:'market',manage:'manual',year:market.year,marketLog:[]};
  const stars=[];
  for(const role of ROLES){
    const star=genPlayer(market,rng,{role,age:24,base:90,region:'NA'}),
      weak=genPlayer(market,rng,{role,age:24,base:45,region:'NA'});
    star.careerGoal='international';star.reputation=90;
    signContract(market,star,vendor,.1,3,{promisedRole:'starter'});
    signContract(market,weak,rich,1,3,{promisedRole:'starter'});stars.push(star);
  }
  vendor.finance.cash=10;rich.finance.cash=500;rich.fans=0;
  rich.facilities=Object.fromEntries(FACILITY_TYPES.map(k=>[k,1]));rich.staffRoster=[];
  check(stars.every(p=>!contractTransferConsent(market,p,rich).willing),
    'fixture stars did not reject transfer');
  const report={resign:[],expired:[],signings:[],transfers:[]};
  contractMarket(market,new RNG('consent-production-market'),report,()=>{});
  const starDeals=report.transfers.filter(row=>stars.some(p=>p.id===row.pid));
  check(starDeals.length>0,'production AI never negotiated a new transfer contract');
  for(const deal of starDeals){
    const moved=market.players[deal.pid],event=moved.careerEvents.find(e=>e.type==='transfer');
    check(deal.personalTerms==='new'&&moved.contract.salary>.1&&event.consent.willing&&
      event.consent.terms.salary===moved.contract.salary&&moved.contract.signingBonus===0,
      'production AI forced refused retained terms or lost actual agreed contract');
  }
  const marketLoaded=unpackDB(packDB(market));
  check(starDeals.every(row=>marketLoaded.players[row.pid].contract.salary===row.salary),
    'AI personal contract did not survive save');
  console.log('TRANSFER_CONSENT_ACCEPTANCE '+JSON.stringify({pure:true,
    allActors:true,retainedAndNewTerms:true,paidBonusExcluded:true,stalePreference:true,
    rollback:true,eventSave:true,futureMedicalGuards:true,productionAi:true,
    aiNewTerms:true,actualPayrollRoom:true,retainedPreferred:true}));
})();`,{filename:'transfer-consent.fixture.js'});
