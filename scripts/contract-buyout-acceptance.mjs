import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
  const check=(ok,msg)=>{if(!ok)throw Error('CONTRACT_BUYOUT '+msg)};
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:3,div2:false})];cfg.internationals=[];
  const db=buildWorld(cfg),[seller,buyer]=activeTeams(db),p=Object.values(db.players).find(x=>!x.team&&!x.retired);
  setManagedTeam(db,buyer.id);db.world={phase:'market',year:db.year,manage:'manual',marketLog:[]};
  for(const t of [seller,buyer])t.finance.cash=100;
  p.attrs=Object.fromEntries(Object.keys(p.attrs).map(k=>[k,90]));p.reputation=90;p.careerGoal='starter';
  const normalized=normalizeContractTerms(db,p,seller,20,2,{buyout:12});
  check(normalized.buyout.amount===12&&normalized.buyout.type==='negotiation','numeric contract value did not retain legacy negotiation meaning');
  const legacy=JSON.parse(JSON.stringify(p));legacy.team=seller.id;legacy.contract={salary:5,until:db.year+1,buyout:12};
  check(normalizeBuyoutClause(legacy.contract.buyout).type==='negotiation','legacy save semantics changed');
  signContract(db,p,seller,5,2,{promisedRole:'starter',buyout:{amount:1,type:'release'}});
  const ask=sellerTransferAsk(db,p,seller);
  check(ask===1,'release clause was treated as a seller asking fee estimate');
  const target=setRecruitmentPriority(db,p.id,'A').target;target.stage='evaluated';target.evaluation={teamId:buyer.id};
  const id=negotiationId(db,p.id,'transfer');p.contract.buyout={amount:2,type:'negotiation'};
  mTransferBid(db,p.id,.9);
  check(negotiationStore(db)[id]?.stage==='club'&&!negotiationStore(db)[id]?.fee,
    'negotiation clause bypassed seller agreement');
  p.contract.buyout={amount:1,type:'release'};mTransferBid(db,p.id,.9);
  check(!negotiationStore(db)[id]?.fee,'below-clause offer bypassed club refusal right');
  const scheduled={upfront:.2,installments:[{amount:.8,date:addDays(db.worldDate,1)}],addOns:[]};
  const accepted=mTransferBid(db,p.id,1,scheduled),neg=negotiationStore(db)[id];
  check(neg.stage==='player'&&neg.fee===1&&neg.releaseClause&&/거부 불가/.test(accepted),
    'release clause did not advance at its full scheduled fee');
  const action={type:'player.sign',actor:'manager',kind:'transfer',pid:p.id,fromId:seller.id,teamId:buyer.id,
    fee:.9,feePlan:{upfront:.2,installments:[{amount:.7,date:addDays(db.worldDate,1)}],addOns:[]},
    salary:100,years:2,terms:{promisedRole:'starter'}};
  const before=JSON.stringify(db),under=commitWorldAction(db,action);
  check(!under.ok&&under.reason==='release_clause'&&JSON.stringify(db)===before,
    'transaction writer accepted less than the binding clause amount');
  action.fee=1;action.feePlan.installments[0].amount=.8;action.salary=.1;
  const refused=commitWorldAction(db,action);
  check(!refused.ok&&refused.reason==='player_consent'&&JSON.stringify(db)===before,
    'buyout clause bypassed independent player consent');
  action.salary=100;
  const preview=previewWorldAction(db,action);
  check(preview.ok&&preview.command.consent.willing,'player consent or installment preview failed');
  p.contract.buyout={amount:1.1,type:'release'};
  check(!applyWorldAction(db,preview).ok,'stale clause change was ignored');
  p.contract.buyout={amount:1,type:'release'};
  const rollbackBefore=JSON.stringify(db),scope=worldActionScopeErrors;
  worldActionScopeErrors=()=>['late transfer failure'];
  const failed=commitWorldAction(db,action);worldActionScopeErrors=scope;
  check(!failed.ok&&JSON.stringify(db)===rollbackBefore,'late transfer failure left partial fee or roster state');
  const result=commitWorldAction(db,action);
  check(result.ok&&p.team===buyer.id&&buyer.finance.cash===99.8&&seller.finance.cash===100.2&&
    seller.finance.transferDeals&&Object.values(seller.finance.transferDeals).some(d=>d.fee===1),
    'full clause amount with split settlement did not transfer atomically');
  const restored=unpackDB(packDB(db));
  check(restored.players[p.id].careerEvents.find(e=>e.type==='transfer')?.consent?.willing&&
    validateStoredTransferState(restored)===undefined,'consent or split deal failed save restore');
  console.log('CONTRACT_BUYOUT_ACCEPTANCE '+JSON.stringify({legacyNumeric:'negotiation',releaseClause:true,
    sellerVetoBypassAtAmount:true,belowAmountRefused:true,splitPayment:true,sharedPlayerConsent:true,
    stalePreview:true,lateRollback:true,saveRestore:true}));
})();`,{filename:'contract-buyout.fixture.js'});
