// R05: historical market callup parity and shared transaction safety.
import {runEngineFixture} from './test-harness.mjs';

await runEngineFixture(String.raw`(()=>{
  const assert=(ok,msg)=>{if(!ok)throw new Error('MARKET_RESERVE '+msg)};
  const baseline=(db,rep)=>{
    const year=db.year,size=5+(db.worldConfig.subs||0),w=db.world,
      mine=w&&w.manage==='manual'?managedTeamId(db):null;
    for(const a of activeTeams(db).filter(t=>t.parent)){
      const t=db.teams[a.parent];if(!t||t.active===false||t.id===mine)continue;
      for(const role of ROLES){
        const cur=starterFor(db,t,role),cand=a.roster.map(id=>db.players[id])
          .filter(p=>p.role===role).sort((x,y)=>playerOvr(y)-playerOvr(x))[0];
        if(cand&&(!cur||playerOvr(cand)>=playerOvr(cur)+5||
          (playerOvr(cand)>=playerOvr(cur)+3&&((cur.form??0)<=-6||cur.wantsOut)))){
          assignPlayerToTeam(db,cand,t);
          if(cur&&t.roster.length>size)assignPlayerToTeam(db,cur,a);
          rep.signings.push({pid:cand.id,team:t.id,salary:cand.contract?cand.contract.salary:0,
            years:cand.contract?cand.contract.until-year+1:1,callup:true});
        }
      }
    }
  };
  const fixture=(count,gap,form=0)=>{
    const db=buildWorld(),parent=activeTeams(db,null,1).find(t=>reserveTeamsOf(db,t).length),
      reserve=reserveTeamsOf(db,parent)[0];
    for(const t of Object.values(db.teams)){t.roster=[];t.depthChart={}}
    setManagedTeam(db,null);db.world={phase:'market',manage:'auto',year:db.year};
    db.worldConfig.subs=0;
    for(const role of ROLES){
      const players=Object.values(db.players).filter(p=>!p.retired&&!p.team&&p.role===role);
      const down=players[0],up=players[1];
      for(const key of Object.keys(down.attrs))down.attrs[key]=60;
      for(const key of Object.keys(up.attrs))up.attrs[key]=60+gap;
      down.form=form;
      if(parent.roster.length<count)assignPlayerToTeam(db,down,parent);
      assignPlayerToTeam(db,up,reserve);
    }
    return {db,parent,reserve};
  };
  let moves=0;
  for(const [count,gap,form] of [[5,5,0],[5,3,-6],[5,3,0],[4,0,0],[0,0,0]]){
    const {db}=fixture(count,gap,form),old=actionJournalClone(db),expected={signings:[]},actual={signings:[]};
    baseline(old,expected);aiMarketReserveCallups(db,actual);
    assert(JSON.stringify(actual)===JSON.stringify(expected),'market report differs from baseline');
    assert(JSON.stringify(db)===JSON.stringify(old),'rosters/player state/depth/events differ from baseline');
    assert(JSON.stringify(unpackDB(packDB(db)))===JSON.stringify(unpackDB(packDB(old))),
      'market callup save/restore differs');
    moves+=actual.signings.length;
  }
  assert(moves>0,'parity fixtures made no callups');
  const {db,parent,reserve}=fixture(5,5),command={type:'roster.market-callup',actor:'ai',
    parentId:parent.id,reserveId:reserve.id,role:'TOP'};
  const before=JSON.stringify(db),preview=previewWorldAction(db,command);
  assert(preview.ok&&JSON.stringify(db)===before,'preview mutated roster/depth/player state');
  const handler=WORLD_ACTION_HANDLERS[command.type],apply=handler.apply;
  try{
    handler.apply=(state,c)=>{const done=apply(state,c);throw new Error('late callup failure')};
    const failed=applyWorldAction(db,preview);
    assert(!failed.ok&&failed.reason==='apply_failed'&&JSON.stringify(db)===before,
      'late callup failure left a partial swap');
  }finally{handler.apply=apply}
  reserve.roster.reverse();
  assert(applyWorldAction(db,preview).reason!=='stale_preview','roster order alone made preview stale');
  const protectedClub=fixture(5,5);
  protectedClub.db.world.manage='manual';setManagedTeam(protectedClub.db,protectedClub.parent.id);
  const protectedBefore=JSON.stringify(protectedClub.db),protectedReport={signings:[]};
  aiMarketReserveCallups(protectedClub.db,protectedReport);
  assert(!protectedReport.signings.length&&JSON.stringify(protectedClub.db)===protectedBefore,
    'AI modified the managed club');
  assert(!previewWorldAction(protectedClub.db,{...command,parentId:protectedClub.parent.id,
    reserveId:protectedClub.reserve.id}).ok,'direct AI command bypassed manager authority');
  // Market closure already reconciles minimum rosters through system actions.
  // Owned reserves need the same actor as their manually managed parent;
  // ordinary AI offers/options must remain unauthorized for that organization.
  const compliance=fixture(5,0),cd=compliance.db,ct=compliance.parent,cr=compliance.reserve;
  for(const t of activeTeams(cd))if(t.id!==ct.id&&t.id!==cr.id)t.active=false;
  cd.world.manage='manual';cd.world.offers=[];setManagedTeam(cd,ct.id);
  for(const t of [ct,cr])for(const id of t.roster){
    const p=cd.players[id];p.contract=normalizeContractTerms(cd,p,t,.3,2,{});
  }
  const absent=starterFor(cd,cr,'TOP');removePlayerFromTeam(cd,absent);absent.contract=null;
  const optionPlayer=starterFor(cd,cr,'MID');
  optionPlayer.contract.option={type:'team',year:cd.year,salary:.3};
  assert(!shouldAutoExerciseOption(cd,optionPlayer,cr,ct.id),'AI exercised reserve team option');
  const report={expired:[],resign:[],signings:[]};
  contractMarket(cd,new RNG('reserve-market-compliance','fixture'),report,()=>{});
  assert(cr.roster.length===5&&starterFor(cd,cr,'TOP'),'managed reserve minimum reconciliation failed');
  assert(report.signings.some(x=>x.team===cr.id&&x.fill),'reserve fill missing from market report');
  const target=Object.values(cd.players).find(p=>!p.team&&!p.retired&&isLocalPlayer(p,cr.region));
  assert(target,'no free authority probe');
  assert(!previewWorldAction(cd,{type:'player.sign',pid:target.id,teamId:cr.id,
    actor:'ai',kind:'fa',salary:asking(cd,target,cr.region),years:1}).ok,
    'normal AI signing bypassed reserve contract authority');
  // Read indexes preserve every price and the existing cache keys. They end
  // before mutations, so player-count/year/top-tier changes remain visible.
  const pricing=buildWorld(),plain=buildWorld(),plainRead=withMarketDemandReadIndex;
  const snapshotSignature=x=>JSON.stringify(Object.fromEntries(Object.entries(x.byRegion)
    .map(([rid,row])=>[rid,{local:row.local.map(p=>[p.id,p.s]),foreign:row.foreign.map(p=>[p.id,p.s])}])));
  let expectedPricing;const baselinePricingStarted=performance.now();
  try{withMarketDemandReadIndex=(db,read)=>read();expectedPricing=initialMarketSnapshot(plain,activeTeams(plain))}
  finally{withMarketDemandReadIndex=plainRead}
  const baselinePricingMs=Math.round(performance.now()-baselinePricingStarted);
  const pricingStarted=performance.now(),actualPricing=initialMarketSnapshot(pricing,activeTeams(pricing));
  const pricingMs=Math.round(performance.now()-pricingStarted);
  assert(snapshotSignature(actualPricing)===snapshotSignature(expectedPricing),'read index changed regional salaries/order');
  assert(JSON.stringify(pricing._marketDemandCache)===JSON.stringify(plain._marketDemandCache),'read index changed persisted cache inputs');
  const pricingTeam=activeTeams(pricing,'KR',1)[0],plainTeam=plain.teams[pricingTeam.id];
  let expectedFill,expectedOffers;
  try{
    withMarketDemandReadIndex=(db,read)=>read();
    expectedFill=eligibleFillFAs(plain,plainTeam).map(p=>p.id);
    expectedOffers=aiMarketOfferCandidates(plain,plainTeam,expectedPricing.free,'TOP',500);
  }finally{withMarketDemandReadIndex=plainRead}
  assert(JSON.stringify(eligibleFillFAs(pricing,pricingTeam).map(p=>p.id))===JSON.stringify(expectedFill),
    'read index changed fill candidate order');
  assert(JSON.stringify(aiMarketOfferCandidates(pricing,pricingTeam,actualPricing.free,'TOP',500))===JSON.stringify(expectedOffers),
    'read index changed AI candidate prices/values/order');
  assert(JSON.stringify({...pricing,saveId:'storage-only'})===JSON.stringify({...plain,saveId:'storage-only'}),
    'pricing/fill/offer batch changed full generated state');
  assert(!MARKET_DEMAND_READ_INDEX.has(pricing),'read index escaped pricing batch');
  for(const rid of [null,'KR','missing','ALL']){
    invalidateMarketDemand(pricing);const expected=JSON.stringify(marketDemandSnapshot(pricing,rid));
    invalidateMarketDemand(pricing);
    assert(withMarketDemandReadIndex(pricing,()=>JSON.stringify(marketDemandSnapshot(pricing,rid)))===expected,
      'global/unknown-region read parity failed');
  }
  try{withMarketDemandReadIndex(pricing,()=>withMarketDemandReadIndex(pricing,()=>{throw Error('read failed')}))}catch(e){}
  assert(!MARKET_DEMAND_READ_INDEX.has(pricing),'throw/nested read leaked index');
  const rng=new RNG('pricing-topology-change','fixture');
  genPlayer(pricing,rng,{role:'TOP',age:19,base:50,region:'KR'});
  activeTeams(pricing,'KR',1)[0].active=false;pricing.year++;
  marketDemandSnapshot(pricing,'KR');
  assert(pricing._marketDemandCache.KR.key===[pricing.year,'KR',Object.keys(pricing.players).length,
    activeTeams(pricing,'KR',1).length].join('|'),'post-batch topology change remained stale');
  const roundPlain=buildWorld(),roundIndexed=buildWorld();let plainRound;
  const contenders=x=>activeTeams(x,'KR',1).slice(0,6);
  try{
    withMarketDemandReadIndex=(db,read)=>read();
    plainRound=resolveInitialOfferRound(roundPlain,contenders(roundPlain),0,'pricing-round-parity',()=>5);
  }finally{withMarketDemandReadIndex=plainRead}
  const indexedRound=resolveInitialOfferRound(roundIndexed,contenders(roundIndexed),0,'pricing-round-parity',()=>5);
  assert(indexedRound.signed>0&&JSON.stringify(indexedRound)===JSON.stringify(plainRound),
    'read index changed auction offer/signing outcomes');
  assert(JSON.stringify({...roundIndexed,saveId:'storage-only'})===JSON.stringify({...roundPlain,saveId:'storage-only'}),
    'read index changed committed auction world state');
  console.log('MARKET_RESERVE_ACCEPTANCE '+JSON.stringify({parityCases:5,callups:moves,
    purePreview:true,rollback:true,managerProtected:true,saveRestore:true,
    reserveMarketCompliance:true,pricingParity:true,auctionRoundParity:true,baselinePricingMs,pricingMs}));
})();`,{timeout:30000,filename:'market-reserve-acceptance.fixture.js'});
