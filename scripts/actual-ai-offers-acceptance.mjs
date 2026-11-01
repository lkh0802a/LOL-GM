// #224/51: club proposals precede human contact; only live, funded proposals
// can affect pressure, waiting time or the existing player.sign writer.
import assert from 'node:assert/strict';
import {runEngineFixture} from './test-harness.mjs';

const result=await runEngineFixture(String.raw`(()=>{
 const check=(v,m)=>{if(!v)throw Error('ACTUAL_AI_OFFERS '+m)},
   clone=x=>JSON.parse(JSON.stringify(x)),
   canonical=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)
     ?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('KR',{teams:18,div2:false})];cfg.internationals=[];
 const db=buildWorld(cfg),team=activeTeams(db,'KR',1)[0];
 startCareer(db,team.id,'actual-independent-bid-probe');
 const issued=currentAIMarketOffers(db),byPlayer={};
 check(issued.length===17&&!Object.keys(db.world.negotiations).length,'independent initial entry offers');
 for(const o of issued){check(o.teamId!==team.id&&aiMarketOfferAvailable(db,o),'legal AI authority/funds');(byPlayer[o.pid]??=[]).push(o)}
 const multi=Object.entries(byPlayer).find(([,xs])=>xs.length>=3),
   single=Object.entries(byPlayer).find(([,xs])=>xs.length===1);
 check(multi&&single,'real zero/one/multi fixtures');
 const begin=(d,pid)=>{mInterest(d,pid);mEvaluateTarget(d,pid,team.id);
   const message=initialStartNegotiation(d,pid,team.id),n=d.world.negotiations[negotiationId(d,pid,'initial',team.id)];
   check(n,'real initial negotiation '+message);return n;};
 const originalLedger=canonical(db.contractMarketOffers),n=begin(db,multi[0]);
 check(canonical(db.contractMarketOffers)===originalLedger,'human start created or changed AI offers');
 const live=negotiationCompetition(db,db.players[n.pid],team,null,'initial');
 check(live.length===multi[1].length&&live.length>=3,'all real bidders, no fixed two-club sample');
 for(const o of live)check(issued.some(x=>x.id===o.offerId&&x.teamId===o.teamId&&
   canonical(x.terms)===canonical(o.terms)),'rival terms lack actual issuer');
 const solo=clone(db);check(begin(solo,single[0]).competitors.length===1,'one genuine bidder');
 const legacy=clone(db);delete legacy.contractMarketOffers;
 const legacyN=legacy.world.negotiations[n.id];
 check(legacyN.competitors.length>=3,'legacy fixture snapshot');
 const beforeRead=canonical(legacy);
 check(negotiationCompetition(legacy,legacy.players[n.pid],legacy.teams[team.id],null,'initial').length===0&&
   canonical(legacy)===beforeRead,'legacy phantom offers migrated or reader wrote state');
 const oldHistory=canonical(legacyN.history),oldDemand=canonical(legacyN.demand);
 check(negotiationResponsePlan(legacy,legacyN,{...legacyN.demand}).ok&&
   canonical(legacyN.history)===oldHistory&&canonical(legacyN.demand)===oldDemand,'legacy communicated history/demand');
 const noBids=clone(legacy);noBids.world.negotiations={};
 check(begin(noBids,multi[0]).competitors.length===0&&!noBids.contractMarketOffers,'zero bids stay zero on inquiry');
 const saved=unpackDB(packDB(db));
 check(canonical(saved.contractMarketOffers)===originalLedger&&
   negotiationCompetition(saved,saved.players[n.pid],saved.teams[team.id],null,'initial').length===live.length,'native save/restore');
 const beforeDuplicate=canonical(db);refreshAIMarketOffers(db);
 check(canonical(db)===beforeDuplicate,'same-day planning duplicated bids');
 const repeat=buildWorld(cfg);startCareer(repeat,team.id,'actual-independent-bid-probe');
 check(canonical(repeat.contractMarketOffers)===originalLedger,'same seed independent proposals');
 for(const status of ['withdrawn','rejected','expired']){
   const ended=clone(repeat),o=currentAIMarketOffers(ended)[0];
   closeAIMarketOffer(ended,o,status,'lifecycle_fixture');
   const before=packDB(ended),again=issueAIMarketOffer(ended,ended.teams[o.teamId],ended.players[o.pid],
     o.terms,'day/'+ended.worldDate,o.target,o.choiceValue);
   check(again===null&&packDB(ended)===before,'ended offer ID replay '+status);
 }
 const retry=clone(repeat);delete retry.contractMarketOffers;
 const rt=activeTeams(retry,null,1).find(t=>t.id!==team.id),retrySeed='closed-auction',
   rm=initialMarketSnapshot(retry,[rt]),rp=initialOfferForTeam(retry,rt,0,retrySeed,rm,initialLegalMinimumTarget(retry,rt)),
   retryIssued=issueAIMarketOffer(retry,rt,rp.player,rp.terms,'auction/'+retrySeed+'/0',initialLegalMinimumTarget(retry,rt),rp.value,rm);
 check(retryIssued,'real retry proposal');closeAIMarketOffer(retry,retryIssued,'withdrawn','lifecycle_fixture');
 const retrySaved=unpackDB(packDB(retry)),beforeRetry=packDB(retrySaved),
   retried=resolveInitialOfferRound(retrySaved,[retrySaved.teams[rt.id]],0,retrySeed,t=>initialLegalMinimumTarget(retrySaved,t));
 check(retried.offers===0&&retried.signed===0&&packDB(retrySaved)===beforeRetry,'restored closed auction replay inert');
 const denied=clone(repeat);delete denied.contractMarketOffers;
 const beforeDenied=packDB(denied),issueWriter=issueAIMarketOffer;let refused;
 issueAIMarketOffer=function(d,...args){return d===denied?null:issueWriter(d,...args)};
 try{refused=resolveInitialOfferRound(denied,[denied.teams[rt.id]],0,'issuer-refused',t=>initialLegalMinimumTarget(denied,t))}
 finally{issueAIMarketOffer=issueWriter}
 check(refused.offers===0&&refused.signed===0&&packDB(denied)===beforeDenied,'issuer failure cannot sign unissued proposal');
 const reserveCfg=defaultWorldConfig();reserveCfg.regions=[regionCfg('KR',{teams:3,div2:true})];reserveCfg.internationals=[];
 const reserveWorld=buildWorld(reserveCfg);startCareer(reserveWorld,activeTeams(reserveWorld,'KR',1)[0].id,'review-offer-lifecycle');
 const reserve=activeTeams(reserveWorld).find(t=>t.parent&&!playerActionAuthority(reserveWorld,'ai',t)),
   reserveResult=resolveInitialOfferRound(reserveWorld,[reserve],0,'review-reserve-auction',t=>initialLegalMinimumTarget(reserveWorld,t));
 check(reserveResult.signed===1&&currentAIMarketOffers(reserveWorld).some(o=>o.teamId===reserve.id&&
   o.status==='accepted'&&reserveWorld.players[o.pid].team===reserve.id),'legal reserve auction has issued/accepted offer');
 const auction=clone(repeat),auctionTerms=clone(currentAIMarketOffers(auction)),
   auctionResult=resolveInitialOfferRound(auction,activeTeams(auction,null,1).filter(t=>t.id!==team.id),0,
     auction.world.seed+'|minimum',t=>initialLegalMinimumTarget(auction,t));
 check(auctionResult.signed>0&&currentAIMarketOffers(auction).some(o=>o.status==='accepted'),'independent auction consumes real offers');
 for(const o of currentAIMarketOffers(auction).filter(o=>o.status==='accepted')){
   check(auctionTerms.some(x=>x.id===o.id&&canonical(x.terms)===canonical(o.terms))&&
     auction.players[o.pid].team===o.teamId&&auction.players[o.pid].contract.salary===o.terms.salary,'auction offered terms preserved');
 }
 // Valid JSON formatting cannot change whether the real issued quote won.
 const ordered=unpackDB(canonical(JSON.parse(packDB(repeat)))),
   orderedOffer=currentAIMarketOffers(ordered).find(o=>aiMarketOfferAvailable(ordered,o)),
   orderedTeam=ordered.teams[orderedOffer.teamId],orderedQuote=canonical(orderedOffer.terms),
   orderedResult=resolveInitialOfferRound(ordered,[orderedTeam],0,ordered.world.seed+'|minimum',t=>initialLegalMinimumTarget(ordered,t));
 check(orderedResult.signed===1&&orderedOffer.status==='accepted'&&ordered.players[orderedOffer.pid].team===orderedOffer.teamId&&
   canonical(orderedOffer.terms)===orderedQuote,'native JSON property order preserves accepted quote/history');
 const changed=clone(db);for(const o of currentAIMarketOffers(changed))if(o.pid===n.pid)changed.teams[o.teamId].finance.cash=-1;
 check(!negotiationCompetition(changed,changed.players[n.pid],changed.teams[team.id],null,'initial').length,'unfunded stale offers pressure');
 refreshAIMarketOffers(changed);
 check(currentAIMarketOffers(changed).filter(o=>o.pid===n.pid).every(o=>o.status==='withdrawn'&&o.reason==='conditions_changed'),'withdrawal history');
 const future=clone(db);for(const o of currentAIMarketOffers(future))o.issuedAt=addDays(future.worldDate,1)+'T00:00:00.000Z';
 check(!negotiationCompetition(future,future.players[n.pid],future.teams[team.id],null,'initial').length,'future offers visible');
 const closed=clone(db);closed.world.phase='season';
 check(!currentAIMarketOffers(closed).length&&!negotiationCompetition(closed,closed.players[n.pid],closed.teams[team.id],null,'initial').length,'closed period rivals');
 const authority=clone(db);setManagedTeam(authority,live[0].teamId);
 check(!negotiationCompetition(authority,authority.players[n.pid],authority.teams[team.id],null,'initial').some(o=>o.teamId===live[0].teamId),'AI consumed new manager authority');
 // Use the real submit path, not a mocked signing result. A mild offer is below
 // a real rival's utility while still inside the player's patience boundary.
 const loss=clone(db),ln=loss.world.negotiations[n.id],lp=loss.players[n.pid],lt=loss.teams[team.id];
 ln.round=1;ln.maxRounds=5;ln.patience=5;
 const best=negotiationCompetition(loss,lp,lt,null,'initial')[0];let low=null;
 for(let salary=.1;salary<=ln.demand.salary*2;salary+=.1){
   const terms=normalizeContractTerms(loss,lp,lt,salary,ln.demand.years,{...ln.demand}),u=offerUtility(loss,lp,lt,terms);
   if(u<best.utility-.09&&u>=best.utility-.5&&!negotiationBudgetError(loss,lp,lt,terms,'initial')){low=terms;break}
 }
 check(low,'real mild losing offer');
 const cashBefore=loss.teams[best.teamId].finance.cash,salaryBefore=payroll(loss,loss.teams[best.teamId]);
 const lost=submitNegotiationOffer(loss,ln.id,low);
 check(!lost.ok&&ln.status==='lost'&&lp.team===best.teamId&&lp.contract.salary===best.terms.salary,'real rival selected/signed');
 check(payroll(loss,loss.teams[best.teamId])===salaryBefore+best.terms.salary&&
   Math.abs(loss.teams[best.teamId].finance.cash-(cashBefore-best.terms.signingBonus))<1e-8,'one finite contract writer');
 check(currentAIMarketOffers(loss).some(o=>o.id===best.offerId&&o.status==='accepted')&&
   currentAIMarketOffers(loss).filter(o=>o.pid===lp.id).every(o=>o.status!=='open'),'actual accepted/losing offer history');
 const afterLoss=canonical(loss);check(!submitNegotiationOffer(loss,ln.id,low).ok&&canonical(loss)===afterLoss,'duplicate response signed twice');
 const accepted=currentAIMarketOffers(loss).find(o=>o.status==='accepted'&&o.pid===lp.id);
 check(issueAIMarketOffer(loss,loss.teams[accepted.teamId],lp,accepted.terms,'day/'+loss.worldDate,
   accepted.target,accepted.choiceValue)===null&&canonical(loss)===afterLoss,'actual accepted ID replay inert');
 const rollback=clone(db),ro=negotiationCompetition(rollback,rollback.players[n.pid],rollback.teams[team.id],null,'initial')[0],
   beforeRollback=canonical(rollback),offerRef=currentAIMarketOffers(rollback).find(o=>o.id===ro.offerId),
   scopeCheck=worldActionScopeErrors;
 worldActionScopeErrors=function(d,...args){return d===rollback?['controlled post-sign failure']:scopeCheck(d,...args)};
 let rolledBack;
 try{rolledBack=commitWorldAction(rollback,{type:'player.sign',pid:n.pid,teamId:ro.teamId,
   kind:'initial',actor:'ai',salary:ro.terms.salary,years:ro.terms.years,terms:ro.terms})}
 finally{worldActionScopeErrors=scopeCheck}
 check(!rolledBack.ok&&rolledBack.reason==='apply_failed'&&canonical(rollback)===beforeRollback&&
   currentAIMarketOffers(rollback).find(o=>o.id===ro.offerId)===offerRef,'failed sign restores offers and full original world');
 // Independently planned regular FA proposals reuse the bulk market's proposal
 // terms and need/observation candidate selector, with no human negotiation.
 const faCfg=defaultWorldConfig();faCfg.regions=[regionCfg('KR',{teams:3,div2:false})];faCfg.internationals=[];
 const fa=buildWorld(faCfg),mt=activeTeams(fa,'KR',1)[0];
 startCareer(fa,mt.id,'real-fa-proposals');
 autoBuildInitialSquad(fa,mt,new RNG('real-fa-initial','fixture'),5);finalizeInitialRosters(fa);
 fa.world={year:fa.year,seed:'real-fa-proposals',manage:'manual',phase:'market',seasons:{},offers:[],negotiations:{},marketLog:[]};
 fa.worldDate=fa.year+'-06-01';
 for(const t of activeTeams(fa))for(const id of t.roster)fa.players[id].contract.until=fa.year;
 refreshAIMarketOffers(fa);const faOffers=currentAIMarketOffers(fa);
 check(faOffers.length>0&&!Object.keys(fa.world.negotiations).length,'real FA plans before user contact');
 for(const o of faOffers)check(aiMarketOfferAvailable(fa,o)&&o.kind==='fa'&&o.teamId!==mt.id,'FA need/funds/authority');
 const faBefore=canonical(fa.contractMarketOffers),target=faOffers[0];
 mInterest(fa,target.pid);mEvaluateTarget(fa,target.pid,mt.id);
 const opened=startNegotiation(fa,target.pid,'fa');check(opened.ok&&opened.neg.competitors.some(o=>o.offerId===target.id)&&canonical(fa.contractMarketOffers)===faBefore,'FA consumer invented bidder');
 {
  const taken=unpackDB(packDB(fa)),bid=currentAIMarketOffers(taken).find(o=>o.id===target.id),nid=opened.neg.id;
  const signed=commitWorldAction(taken,{type:'player.sign',pid:bid.pid,teamId:bid.teamId,kind:'fa',actor:'ai',salary:bid.terms.salary,years:bid.terms.years,terms:bid.terms});
  check(signed.ok&&taken.players[bid.pid].team===bid.teamId,'actual rival signed FA');
  const pending=taken.world.negotiations[nid],board=recruitmentTarget(taken,bid.pid);
  check(pending.status==='lost'&&board.stage==='closed'&&board.negotiationId===nid,'rival signing left human negotiation open');
  const saved=unpackDB(packDB(taken));check(saved.world.negotiations[nid].status==='lost','rival result did not survive save');
  const retry=unpackDB(packDB(fa)),retryBid=currentAIMarketOffers(retry).find(o=>o.id===target.id),
    prior=packDB(retry),negRef=retry.world.negotiations[nid],targetRef=recruitmentTarget(retry,retryBid.pid),scope=worldActionScopeErrors;
  worldActionScopeErrors=(d,...args)=>d===retry?['controlled rival failure']:scope(d,...args);
  let failed;try{failed=commitWorldAction(retry,{type:'player.sign',pid:retryBid.pid,teamId:retryBid.teamId,kind:'fa',actor:'ai',salary:retryBid.terms.salary,years:retryBid.terms.years,terms:retryBid.terms})}finally{worldActionScopeErrors=scope}
  check(!failed.ok&&packDB(retry)===prior&&retry.world.negotiations[nid]===negRef&&recruitmentTarget(retry,retryBid.pid)===targetRef,'rival sign failure changed negotiation or board');
  const stale=unpackDB(packDB(fa)),quote=currentAIMarketOffers(stale).find(o=>o.id===target.id),
    preview=previewWorldAction(stale,{type:'player.sign',pid:quote.pid,teamId:quote.teamId,kind:'fa',actor:'ai',salary:quote.terms.salary,years:quote.terms.years,terms:quote.terms});
  check(preview.ok,'rival sign preview');stale.world.negotiations[nid].history.push({side:'manager',result:'new_information'});
  const before=packDB(stale),rejected=applyWorldAction(stale,preview);
  check(!rejected.ok&&rejected.reason==='stale_preview'&&packDB(stale)===before,'stale rival sign preview changed negotiations');
 }
 // An actual year-round FA negotiation opened after a market close belongs to
 // the next boundary, even when a delayed close consumer runs in June.
 const lateClose=clone(fa),lateId=opened.neg.id,lateSnapshot=canonical(lateClose.world.negotiations[lateId]);
 closeOpenNegotiationsForDeadline(lateClose);
 check(canonical(lateClose.world.negotiations[lateId])===lateSnapshot,'post-close FA negotiation survives late close');
 const dueClose=clone(fa),deadline=negotiationMarketDeadline(dueClose.world.negotiations[lateId]);
 dueClose.worldDate=deadline.slice(0,10);closeOpenNegotiationsForDeadline(dueClose);
 check(dueClose.world.negotiations[lateId].status==='expired'&&
  dueClose.world.negotiations[lateId].closedDate===dueClose.worldDate&&
  unpackDB(packDB(dueClose)).world.negotiations[lateId].status==='expired',
  'actual deadline expires original FA negotiation and persists');
 const faRestored=unpackDB(packDB(fa));check(canonical(faRestored.contractMarketOffers)===faBefore,'FA native save');
 const closedFa=clone(fa);closedFa.world.negotiations={};const closedRows=[];
 for(const t of activeTeams(closedFa,null,1).filter(t=>!playerActionAuthority(closedFa,'ai',t)))for(const role of ROLES){
   const candidate=aiMarketOfferCandidates(closedFa,t,Object.values(closedFa.players).filter(p=>!p.retired&&!p.team),role,
     salaryBudget(closedFa,t)-payroll(closedFa,t),closedFa.year)[0];
   if(!candidate)continue;
   const old=currentAIMarketOffers(closedFa).find(o=>o.teamId===t.id&&o.pid===candidate.p.id),
     row=old&&issueAIMarketOffer(closedFa,t,candidate.p,old.terms,'close/0');
   check(row,'actual FA close proposal');closeAIMarketOffer(closedFa,row,'rejected','lifecycle_fixture');
   closedRows.push(clone(row));
 }
 for(const o of currentAIMarketOffers(closedFa))closeAIMarketOffer(closedFa,o,'withdrawn','lifecycle_fixture');
 const closedIds=new Set(closedRows.map(o=>o.id)),marketIssuer=issueAIMarketOffer;let retriedClosed=0,returnedClosed=0;
 issueAIMarketOffer=function(d,t,p,terms,event,...args){
   const result=marketIssuer(d,t,p,terms,event,...args),id=aiMarketOfferPeriod(d)?.id+'/'+event+'/'+t.id+'/'+p.id;
   if(d===closedFa&&closedIds.has(id)){retriedClosed++;if(result)returnedClosed++}
   return result;
 };
 try{contractMarket(closedFa,new RNG('closed-fa-retry'),{expired:[],resign:[],signings:[],transfers:[]},[])}
 finally{issueAIMarketOffer=marketIssuer}
 check(closedRows.length>0&&retriedClosed===closedRows.length&&returnedClosed===0,'actual bulk market rejected all ended ID retries');
 const closedLoaded=unpackDB(packDB(closedFa));
 for(const old of closedRows)check(canonical(currentAIMarketOffers(closedLoaded).find(o=>o.id===old.id))===canonical(old),'ended FA offer history retained after real market/save');
 const closeCfg=defaultWorldConfig();closeCfg.regions=[regionCfg('KR',{teams:4,div2:false})];closeCfg.internationals=[];
 const closedWorld=buildWorld(closeCfg),closeTeam=activeTeams(closedWorld,'KR',1)[0];startCareer(closedWorld,closeTeam.id,'real-fa-period-close');
 autoBuildInitialSquad(closedWorld,closeTeam,new RNG('real-fa-period-close','fixture'),5);finalizeInitialRosters(closedWorld);
 check(closedWorld.contractMarketOffers.periods['initial/'+closedWorld.year].closedAt,'initial period actual closure');
 closedWorld.world.phase='market';closedWorld.world.report={year:closedWorld.year,growth:[],retired:[],signings:[],resign:[],expired:[],transfers:[],events:[]};
 const closeWindow=globalTransferMarketWindow(closedWorld.world.year);
 closedWorld.worldDate=closeWindow.lastOpenDate;
 for(const t of activeTeams(closedWorld))for(const id of t.roster)closedWorld.players[id].contract.until=closedWorld.year;
 refreshAIMarketOffers(closedWorld);const closingPeriod=aiMarketOfferPeriod(closedWorld).id;
 closedWorld.worldDate=closeWindow.closesOn;
 const beforeFailedClose=canonical(closedWorld),beforeWorld=closedWorld.world,
  beforeTeam=closedWorld.teams[closeTeam.id],beforeFinance=beforeTeam.finance,
  originalMarketWriter=contractMarket;let lateCloseFailed=false;
 contractMarket=(state)=>{state.teams[closeTeam.id].finance.cash-=3;throw Error('controlled market settlement failure')};
 try{closeMarket(closedWorld)}catch(error){lateCloseFailed=error.message==='controlled market settlement failure'}
 finally{contractMarket=originalMarketWriter}
 check(lateCloseFailed&&canonical(closedWorld)===beforeFailedClose&&closedWorld.world===beforeWorld&&
  closedWorld.teams[closeTeam.id]===beforeTeam&&beforeTeam.finance===beforeFinance,
  'failed market closure restores world and finance references');
 closeMarket(closedWorld);const endedPeriod=closedWorld.contractMarketOffers.periods[closingPeriod];
 check(closedWorld.world.phase==='preseason'&&endedPeriod.closedAt===negotiationClockAt(closedWorld)&&
   Object.values(endedPeriod.offers).some(o=>o.status==='expired')&&
   Object.values(endedPeriod.offers).every(o=>o.status!=='open'),'real market closure records expiry at actual time');
 check(canonical(unpackDB(packDB(closedWorld)).contractMarketOffers)===canonical(closedWorld.contractMarketOffers),'closed offer history native save');
 const closedSnapshot=canonical(closedWorld),closedWorldRef=closedWorld.world,
  closedOffersRef=closedWorld.contractMarketOffers;let repeatedCloseRejected=false;
 try{closeMarket(closedWorld)}catch(error){repeatedCloseRejected=/진행 중일 때만/.test(error.message)}
 check(repeatedCloseRejected&&canonical(closedWorld)===closedSnapshot&&closedWorld.world===closedWorldRef&&
  closedWorld.contractMarketOffers===closedOffersRef,'duplicate market closure is inert');
 const ended=clone(fa);ended.world.phase='offseason';ended.world.contractWindow={stage:'exclusive'};
 check(!currentAIMarketOffers(ended).length,'exclusive contact bypass');
 const daily=clone(fa);daily.world.phase='offseason';daily.worldDate=daily.year+'-12-01';
 daily.world.contractWindow={stage:'fa',completed:true,seasonYear:daily.year,startSeason:daily.year+1,
   contractExpiryDate:daily.year+'-11-30',outsideContactDate:daily.year+'-12-01'};
 daily.world.negotiations={};
 const beforeFailure=canonical(daily),proposalWriter=aiMarketProposalTerms;let failed=false;
 aiMarketProposalTerms=function(){throw Error('controlled proposal failure')};
 try{advanceOffseasonFreeAgencyDay(daily);}catch(e){failed=e.message==='controlled proposal failure'}
 finally{aiMarketProposalTerms=proposalWriter}
 check(failed&&canonical(daily)===beforeFailure,'daily market failure whole rollback');
 check(advanceOffseasonFreeAgencyDay(daily).ok&&daily.worldDate===daily.year+'-12-02'&&
   currentAIMarketOffers(daily).length>0,'independent FA daily producer');
 const dailySaved=unpackDB(packDB(daily));check(canonical(dailySaved.contractMarketOffers)===canonical(daily.contractMarketOffers),'daily native save');
 const early=clone(daily);early.worldDate=early.world.contractWindow.contractExpiryDate;
 const late=clone(daily);late.worldDate=(late.year+1)+'-01-07';
 check(!currentAIMarketOffers(early).length&&!currentAIMarketOffers(late).length,'FA offers respect actual contact/settlement dates');
 const rollover=clone(fa);rollover.year=fa.year+1;
 check(rollover.world.year===fa.year&&aiMarketOfferPeriod(rollover).id==='market/'+rollover.year&&
   aiMarketOfferPeriod(rollover).year===rollover.year,'annual settlement uses new contract season');
 let marketContracts=0;
 const longMarket=clone(fa);longMarket.world.negotiations={};
 const priorMarketPeriods=Object.keys(longMarket.contractMarketOffers.periods).filter(id=>id.startsWith('market/'));
 for(let cycle=0;cycle<20;cycle++){
   // As in annual rollover, next-season contract years coexist with the
   // closing world's December market. June is no longer a transfer window.
   longMarket.year=fa.year+cycle+1;longMarket.world.year=longMarket.year-1;
   longMarket.worldDate=globalPlayerFAOpenDate(longMarket.world.year);longMarket.world.offers=[];
   // runOffseason supplies a real cohort before each annual market. Reusing
   // one frozen pool for twenty years can exhaust a role after legal transfers.
   for(const region of Object.values(longMarket.regions))
     generateRookieClass(longMarket,region,new RNG('real-market-cohort/'+cycle));
   refreshAIMarketOffers(longMarket);
   const report={expired:[],resign:[],signings:[],transfers:[]};
   contractMarket(longMarket,new RNG('real-market-cycle/'+cycle),report,[]);
   marketContracts+=report.signings.length;
   for(const t of activeTeams(longMarket))check(Number.isFinite(t.finance.cash)&&
     Number.isFinite(payroll(longMarket,t))&&t.roster.length>=5,'20 markets finite money/minimum');
   check(new Set(activeTeams(longMarket).flatMap(t=>t.roster)).size===activeTeams(longMarket).reduce((s,t)=>s+t.roster.length,0),'20 markets duplicate ownership');
   const restored=unpackDB(packDB(longMarket));
   check(canonical(restored.contractMarketOffers)===canonical(longMarket.contractMarketOffers),'20 markets proposal history save');
 }
 const newMarketPeriods=Object.keys(longMarket.contractMarketOffers.periods)
   .filter(id=>id.startsWith('market/')&&!priorMarketPeriods.includes(id));
 check(marketContracts>0&&newMarketPeriods.length===20&&
   priorMarketPeriods.every(id=>longMarket.contractMarketOffers.periods[id]),'20 new real market cycles and retained prior history');
 return {initialOffers:issued.length,multi:live.length,single:1,zero:0,
   realRivalContract:true,finiteFunds:true,nativeSave:true,duplicateInert:true,
   legacyNoPhantoms:true,periodAuthority:true,faOffers:faOffers.length,
   independentAuction:true,dailyRollback:true,failedSignFullRollback:true,
   closedIdsInert:true,restoredAuctionRetry:true,bulkClosedRetries:retriedClosed,
   issuerFailureInert:true,reserveAuctionBacked:true,
   propertyOrderAccepted:true,actualPeriodExpiry:true,
   marketCycles:20,marketContracts,fullWorldSeasons:false};
})()`,{timeout:60000});
assert(result.realRivalContract&&result.faOffers>0);
console.log('ACTUAL_AI_OFFERS_ACCEPTANCE',JSON.stringify(result));
