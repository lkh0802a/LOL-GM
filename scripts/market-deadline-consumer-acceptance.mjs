import {runEngineFixture} from './test-harness.mjs';
const result=await runEngineFixture(String.raw`(()=>{
 const check=(v,m)=>{if(!v)throw Error('MARKET_DEADLINE_CONSUMER '+m)};
 function fixture(year,yearRound=false){
  const cfg=defaultWorldConfig();cfg.startYear=year;cfg.regions=[regionCfg('KR',{teams:4,div2:false})];cfg.internationals=[];
  let db=buildWorld(cfg);const t=activeTeams(db)[0];setManagedTeam(db,t.id);
  for(const team of activeTeams(db))team.finance.cash=100000;
  const p=Object.values(db.players).find(p=>!p.retired&&!p.team);
  if(!yearRound){signContract(db,p,t,asking(db,p,t.region),1,{promisedRole:'core'});p.contract.option=null;}
  db.world={year,seed:'deadline-consumer-'+year,manage:'manual',phase:'offseason',seasons:{},steps:[],step:0,negotiations:{},offers:[],marketLog:[],lastDate:year+'-11-16'};
  if(yearRound){db.world.phase='season';db.worldDate=year+'-07-01';scoutPlayers(db,[p.id],40,0);scoutPlayers(db,[p.id],40,0);}
  else{db.worldDate=db.world.lastDate;initOffseasonContractWindow(db);advanceOffseasonContractWindow(db);}
  mInterest(db,p.id);mEvaluateTarget(db,p.id);const opened=startNegotiation(db,p.id,'fa');check(opened.ok,'real observed FA start');
  const n=opened.neg;n.maxRounds=2;let terms;
  for(const factor of [1,1.2,1.5,2]){
   const clone=JSON.parse(JSON.stringify(db)),offer={...n.demand,salary:n.demand.salary*factor},r=submitNegotiationOffer(clone,n.id,offer);
   if(r.ok&&clone.world.negotiations[n.id].status==='accepted'){terms=offer;break}
  }
  check(terms,'actual acceptable offer');return {db,nid:n.id,pid:p.id,terms};
 }
 let blocked=0;
 for(const year of [2026,2027,2028]){
  const f=fixture(year),deadline=globalTransferMarketWindow(year).closesOn+'T00:00:00.000Z';
  check(stageNegotiationOffer(f.db,f.nid,f.terms).agreed,'actual agreement before deadline');
  const beforeBoundary=unpackDB(packDB(f.db));beforeBoundary.worldDate=addDays(deadline.slice(0,10),-1);beforeBoundary.world.negotiationClock={at:new Date(Date.parse(deadline)-1).toISOString()};
  check(finalizeStagedNegotiation(beforeBoundary,f.nid).ok,'last legal millisecond final');
  for(const at of [deadline,new Date(Date.parse(deadline)+1).toISOString()])for(const direct of [false,true]){
   const db=unpackDB(packDB(f.db));db.worldDate=at.slice(0,10);db.world.negotiationClock={at};
   const before=packDB(db),world=db.world,team=managedTeam(db),n=db.world.negotiations[f.nid];
   const r=direct?finalizeNegotiation(db,n,n.agreedTerms):finalizeStagedNegotiation(db,f.nid);
   check(!r.ok&&packDB(db)===before&&db.world===world&&managedTeam(db)===team,'late restored final mutated/signed or accepted');blocked++;
  }
  const raw=fixture(year);raw.db.worldDate=deadline.slice(0,10);raw.db.world.negotiationClock={at:deadline};
  const before=packDB(raw.db);check(!submitNegotiationOffer(raw.db,raw.nid,raw.terms).ok&&packDB(raw.db)===before,'raw submission bypass');blocked++;
  const delayed=fixture(year);delayed.db.world.negotiations[delayed.nid].maxRounds=3;
  check(stageNegotiationOffer(delayed.db,delayed.nid,delayed.terms).waiting,'real asynchronous response');
  const restored=unpackDB(packDB(delayed.db));restored.worldDate=deadline.slice(0,10);restored.world.negotiationClock={at:deadline};
  const saved=packDB(restored),r=resolveDueNegotiationResponse(restored);
  check(r?.blocked&&!r.ok&&packDB(restored)===saved,'late restored response mutated/reopened agreement');blocked++;
  // A new true-FA negotiation after the market closes remains legal.
  const fresh=fixture(year);cancelNegotiation(fresh.db,fresh.nid);fresh.db.worldDate=deadline.slice(0,10);fresh.db.world.negotiationClock={at:deadline};
  const next=startNegotiation(fresh.db,fresh.pid,'fa');check(next.ok,'year-round true FA start');next.neg.maxRounds=2;
  check(stageNegotiationOffer(fresh.db,next.neg.id,fresh.terms).agreed&&finalizeStagedNegotiation(fresh.db,next.neg.id).ok,'year-round true FA agreement/final');
  const older=fixture(year,true);check(stageNegotiationOffer(older.db,older.nid,older.terms).agreed,'actual earlier year-round FA agreement');
  const loaded=unpackDB(packDB(older.db));loaded.worldDate=deadline.slice(0,10);loaded.world.negotiationClock={at:deadline};
  const prior=packDB(loaded);check(!finalizeStagedNegotiation(loaded,older.nid).ok&&packDB(loaded)===prior,'older year-round proposal bypassed next market closing');blocked++;
 }
 const transfer=fixture(2027),seller=activeTeams(transfer.db).find(t=>t.id!==managedTeamId(transfer.db)),p=Object.values(transfer.db.players).find(p=>!p.retired&&!p.team&&p.id!==transfer.pid);
 signContract(transfer.db,p,seller,asking(transfer.db,p,seller.region),2,{buyout:null,promisedRole:'starter'});
 mInterest(transfer.db,p.id);scoutPlayers(transfer.db,[p.id],40,0);scoutPlayers(transfer.db,[p.id],40,0);mEvaluateTarget(transfer.db,p.id);
 const ask=sellerTransferAsk(transfer.db,p,seller);mTransferBid(transfer.db,p.id,ask*.5);
 const tid=negotiationId(transfer.db,p.id,'transfer');check(transfer.db.world.negotiations[tid]?.clubCounter>0,'actual seller counter');
 const moved=unpackDB(packDB(transfer.db)),date=globalTransferMarketWindow(2027).closesOn;moved.worldDate=date;moved.world.negotiationClock={at:date+'T00:00:00.000Z'};
 for(const invoke of [()=>acceptSellerCounter(moved,tid),()=>mTransferBid(moved,p.id,ask)]){
  const before=packDB(moved),r=invoke();check(r.includes('마감')&&packDB(moved)===before,'late seller counter/bid mutated or agreed');blocked++;
 }
 let corruptCases=0;
 for(const date of [null,'2027-02-31','2027-12-08'])for(const staged of [false,true]){
  const f=fixture(2027);f.db.world.negotiations[f.nid].createdDate=date;
  const before=packDB(f.db),r=staged?stageNegotiationOffer(f.db,f.nid,f.terms):submitNegotiationOffer(f.db,f.nid,f.terms);
  check(!r.ok&&packDB(f.db)===before,'missing/malformed/future creation date was inferred or mutated');corruptCases++;
 }
 let aiCases=0;
 for(const year of [2026,2027,2028]){
  const f=fixture(year),db=f.db,o=currentAIMarketOffers(db).find(o=>o.status==='open'),held=JSON.parse(JSON.stringify(o)),deadline=globalTransferMarketWindow(year).closesOn+'T00:00:00.000Z';
  db.worldDate=addDays(deadline.slice(0,10),-1);db.world.negotiationClock={at:new Date(Date.parse(deadline)-1).toISOString()};
  check(aiMarketOfferAvailable(db,o),'AI quote before closing');
  db.worldDate=deadline.slice(0,10);db.world.negotiationClock={at:deadline};
  check(!db.contractMarketOffers.periods[o.period].closedAt,'expiry callback intentionally not consumed');
  const before=packDB(db),world=db.world;
  check(!aiMarketOfferAvailable(db,held)&&!negotiationCompetition(db,db.players[o.pid],managedTeam(db),null,'fa').some(x=>x.offerId===o.id),'clock-only restored AI quote still available/competing');
  check(packDB(db)===before&&db.world===world,'AI deadline reader mutated state');
  const contracts=JSON.stringify(Object.values(db.players).map(p=>[p.id,p.team,p.contract]));
  refreshAIMarketOffers(db);
  check(db.contractMarketOffers.periods[o.period].offers[o.id].status==='expired','refresh did not expire actual overdue quote');
  check(JSON.stringify(Object.values(db.players).map(p=>[p.id,p.team,p.contract]))===contracts,'expiry refresh signed or moved players');
  const fresh=issueAIMarketOffer(db,db.teams[o.teamId],db.players[o.pid],o.terms,'new-year-round');
  check(fresh&&aiMarketOfferAvailable(db,fresh)&&fresh.issuedAt>=deadline,'new year-round AI FA quote blocked');
  check(!aiMarketOfferAvailable(db,held),'fresh quote revived stale held terms');
  const saved=unpackDB(packDB(db));check(saved.contractMarketOffers.periods[o.period].offers[o.id].status==='expired'&&aiMarketOfferAvailable(saved,saved.contractMarketOffers.periods[fresh.period].offers[fresh.id]),'AI quote expiry/fresh availability lost on native restore');aiCases++;
 }
 return {years:3,blocked,corruptCases,aiCases,lastLegalMillisecond:true,restoredAgreementAndResponse:true,legacyFinalAndSubmit:true,sellerCounterAndBid:true,wholeStateAndReferences:true,yearRoundTrueFA:true};
})()`,{timeout:60000});
console.log('MARKET_DEADLINE_CONSUMER_ACCEPTANCE '+JSON.stringify(result));
