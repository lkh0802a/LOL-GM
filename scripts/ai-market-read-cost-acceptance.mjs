import {runEngineFixture} from './test-harness.mjs';

await runEngineFixture(String.raw`(()=>{
  const check=(v,m)=>{if(!v)throw Error('AI_MARKET_READ_COST '+m)};
  // Exact pre-optimization candidate reader, including its repeated legal report.
  const baseline=(db,t,fas,role,budgetRoom,year=db.year)=>{
    const R=db.regions[t.region],cur=starterFor(db,t,role),
      cv=cur?playerValue(db,cur,t):-99,importGap=R.importRecruitMinGap??3,
      imports=teamNonLocalCount(db,t);
    return withMarketDemandReadIndex(db,()=>fas.filter(p=>p.role===role&&
      (projectedPlayerIsLocal(db,p,t)||(aiMarketObservation(db,p,t).ability>=R.strength+importGap&&
        imports<nonLocalLimitForTeam(db,t))))
      .map(p=>({p,v:aiMarketValue(db,p,t),ask:asking(db,p,t.region)}))
      .filter(x=>x.ask<=budgetRoom&&(!cur||cur.wantsOut||cur.contract.until<=year||x.v>cv+5))
      .sort((a,b)=>b.v-a.v||a.p.id.localeCompare(b.p.id)));
  };
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('KR',{teams:6,div2:false}),
    regionCfg('NA',{teams:6,div2:false})];cfg.internationals=[];
  const base=buildWorld(cfg),team=activeTeams(base,'NA',1)[0];
  startCareer(base,team.id,'ai-market-read-cost');
  // Independent integer reference: preserve UTF-16 FNV arithmetic and every seed.
  const keys=['','abc','한국어','😀','a\u0000b','\ud800',...Object.keys(base.players)];
  for(const key of keys){
    const expected=key.split('').reduce((h,c)=>((h^BigInt(c.charCodeAt(0)))*16777619n)&0xffffffffn,2166136261n);
    check(hashStr(key)===Number(expected),'hash/seed changed for '+JSON.stringify(key));
  }
  const baselineSeed=db=>{db.initialPayrollFloorCache={};for(const t of activeTeams(db)){
    const floor=minimumViableInitialPayroll(db,t);
    t.initialPayrollBudget=Math.max(t.initialPayrollBudget||0,floor,salaryBudget(db,t));
  }};
  const oldBudgets=actionJournalClone(base),newBudgets=actionJournalClone(base);
  baselineSeed(oldBudgets);seedInitialPayrollBudgets(newBudgets);
  check(JSON.stringify(newBudgets)===JSON.stringify(oldBudgets),'initial wage envelopes/world changed');
  check(!MARKET_DEMAND_READ_INDEX.has(newBudgets),'initial wage index survived batch');
  const initialFloor=minimumViableInitialPayroll,failedOld=actionJournalClone(base),failedNew=actionJournalClone(base);
  try{
    minimumViableInitialPayroll=()=>{throw Error('controlled pricing failure')};
    for(const [read,db] of [[baselineSeed,failedOld],[seedInitialPayrollBudgets,failedNew]]){
      let failed=false;try{read(db)}catch(e){failed=e.message==='controlled pricing failure'}
      check(failed&&!MARKET_DEMAND_READ_INDEX.has(db),'failed budget read leaked its index');
    }
    check(JSON.stringify(failedOld)===JSON.stringify(failedNew),'failed budget behavior changed');
  }finally{minimumViableInitialPayroll=initialFloor}
  const original=aiMarketObservation,rows=[];
  const signature=xs=>JSON.stringify(xs.map(x=>({pid:x.p.id,v:x.v,ask:x.ask})));
  try{
    for(const phase of ['initial_roster','market']){
      const expected=actionJournalClone(base),actual=actionJournalClone(base);
      expected.world.phase=phase;actual.world.phase=phase;
      let expectedCalls=0,actualCalls=0;
      for(const role of ROLES){
        aiMarketObservation=(...args)=>{expectedCalls++;return original(...args)};
        const want=baseline(expected,expected.teams[team.id],Object.values(expected.players),role,Infinity);
        aiMarketObservation=(...args)=>{actualCalls++;return original(...args)};
        const got=aiMarketOfferCandidates(actual,actual.teams[team.id],Object.values(actual.players),role,Infinity);
        check(signature(got)===signature(want),'candidate order/score/price changed '+phase+'/'+role);
        check(!MARKET_DEMAND_READ_INDEX.has(actual),'pricing index escaped its read scope');
      }
      check(actualCalls<expectedCalls,'duplicate legal observations were not removed');
      check(JSON.stringify(actual)===JSON.stringify(expected),'full world/dossier/cache changed '+phase);
      check(JSON.stringify(unpackDB(packDB(actual)))===JSON.stringify(unpackDB(packDB(expected))),
        'native restored world changed '+phase);
      rows.push({phase,expectedCalls,actualCalls});
    }
  }finally{aiMarketObservation=original}
  console.log('AI_MARKET_READ_COST_ACCEPTANCE '+JSON.stringify({rows,wholeWorldAndNativeEqual:true,
    legalObservationOnly:true,temporaryIndexClosed:true,utf16HashKeys:keys.length,
    initialBudgetsAndFailureSame:true}));
})()`);
