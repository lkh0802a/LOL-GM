import {runEngineFixture} from './test-harness.mjs';
const result=await runEngineFixture(String.raw`(()=>{
 const check=(v,m)=>{if(!v)throw Error('MARKET_DEADLINE_EXPIRY '+m)};
 function fixture(year){
  const cfg=defaultWorldConfig();cfg.startYear=year;cfg.regions=[regionCfg('KR',{teams:4,div2:false})];cfg.internationals=[];
  let db=buildWorld(cfg);const team=activeTeams(db)[0];setManagedTeam(db,team.id);
  for(const t of activeTeams(db))t.finance.cash=1000;
  const p=Object.values(db.players).find(p=>!p.retired&&!p.team);
  signContract(db,p,team,asking(db,p,team.region),1,{promisedRole:'core'});p.contract.option=null;
  db.world={year,seed:'deadline-'+year,manage:'manual',phase:'offseason',seasons:{},steps:[],step:0,negotiations:{},offers:[],marketLog:[],lastDate:year+'-11-16'};
  db.worldDate=db.world.lastDate;initOffseasonContractWindow(db);advanceOffseasonContractWindow(db);
  mInterest(db,p.id);mEvaluateTarget(db,p.id);const opened=startNegotiation(db,p.id,'fa');
  check(opened.ok,'actual observed FA negotiation');
  check(currentAIMarketOffers(db).some(o=>o.status==='open'),'actual independent AI offers');
  return {db:unpackDB(packDB(db)),nid:opened.neg.id,pid:p.id};
 }
 let actualDays=0,restores=0;
 for(const year of [2026,2027,2028]){
  let {db,nid,pid}=fixture(year);const window=globalTransferMarketWindow(year),period=aiMarketOfferPeriod(db).id,
   heldQuote=JSON.parse(JSON.stringify(currentAIMarketOffers(db).find(o=>o.status==='open')));
  const contracts=JSON.stringify(Object.values(db.players).map(p=>[p.id,p.team,p.contract]));
  check(db.worldDate===window.opensOn,'actual global opening');
  for(let day=1;day<=28;day++){
   check(advanceOffseasonFreeAgencyDay(db).ok,'actual FA daily writer');actualDays++;
   const neg=db.world.negotiations[nid];
   if(day<28)check(neg.status==='open'&&neg.round===0,'negotiation expired early or auto-submitted');
   else{
    check(db.worldDate===window.closesOn&&neg.status==='expired'&&neg.closedDate===window.closesOn,'28-day boundary did not expire pending negotiation');
    const store=db.contractMarketOffers.periods[period];
    check(store.closedAt?.startsWith(window.closesOn+'T')&&Object.values(store.offers).every(o=>o.status!=='open'),'actual AI quotes not closed at deadline');
    check(!aiMarketOfferAvailable(db,heldQuote),'stale pre-deadline AI quote still available');
    const quotes=JSON.stringify(store),p=db.players[heldQuote.pid],t=db.teams[heldQuote.teamId];
    check(!issueAIMarketOffer(db,t,p,heldQuote.terms,'late-deadline')&&JSON.stringify(store)===quotes,'closed period issued a new quote');
    check(JSON.stringify(Object.values(db.players).map(p=>[p.id,p.team,p.contract]))===contracts,'deadline signed/moved a player without approval');
    const before=packDB(db);check(!submitNegotiationOffer(db,nid,neg.demand).ok&&packDB(db)===before,'stale offer accepted after deadline');
   }
   if(day===14||day===28){db=unpackDB(packDB(db));restores++;}
  }
  check(db.world.negotiations[nid].status==='expired'&&db.players[pid].team===null,'native restoration reopened proposal or signed player');
  const closed=JSON.stringify(db.world.negotiations[nid]),quotes=JSON.stringify(db.contractMarketOffers.periods[period]);
  check(advanceOffseasonFreeAgencyDay(db).ok&&JSON.stringify(db.world.negotiations[nid])===closed,'year-round FA day changed closed proposal');
  check(JSON.stringify(db.contractMarketOffers.periods[period])===quotes,'later refresh reopened the closed quote period');
 }
 let rollbackCases=0;
 for(const name of ['negotiations','ai']){
  const {db,nid}=fixture(2027);db.worldDate=globalTransferMarketWindow(2027).lastOpenDate;
  const before=packDB(db),world=db.world,club=managedTeam(db),fn=name==='negotiations'?closeOpenNegotiationsForDeadline:expireCurrentAIMarketOffers;
  const failing=(...args)=>{fn(...args);throw Error('controlled deadline '+name)};
  if(name==='negotiations')closeOpenNegotiationsForDeadline=failing;else expireCurrentAIMarketOffers=failing;
  let threw=false;try{advanceOffseasonFreeAgencyDay(db)}catch(e){threw=e.message==='controlled deadline '+name}
  finally{if(name==='negotiations')closeOpenNegotiationsForDeadline=fn;else expireCurrentAIMarketOffers=fn;}
  check(threw&&packDB(db)===before&&db.world===world&&managedTeam(db)===club&&db.world.negotiations[nid].status==='open','deadline failure partially committed');
  check(advanceOffseasonFreeAgencyDay(db).ok&&db.world.negotiations[nid].status==='expired','deadline retry');rollbackCases++;
 }
 const cancelled=fixture(2027);cancelNegotiation(cancelled.db,cancelled.nid);const closed=JSON.stringify(cancelled.db.world.negotiations[cancelled.nid]);
 cancelled.db.worldDate=globalTransferMarketWindow(2027).lastOpenDate;advanceOffseasonFreeAgencyDay(cancelled.db);
 check(JSON.stringify(cancelled.db.world.negotiations[cancelled.nid])===closed,'deadline rewrote cancelled negotiation');
 return {years:3,actualDays,restores,actualHumanAndAIProposals:true,noAutomaticSignature:true,lateSubmissionRejected:true,rollbackCases,cancelledPreserved:true,fullMarketTransitionImplemented:false};
})()`,{timeout:60000});
console.log('MARKET_DEADLINE_EXPIRY_ACCEPTANCE '+JSON.stringify(result));
