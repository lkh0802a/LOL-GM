import {runEngineFixture,artifactSources} from './test-harness.mjs';
const ui=await artifactSources(['ui-negotiations.js']);
await runEngineFixture(String.raw`(()=>{
  const check=(ok,msg)=>{if(!ok)throw Error('AGENT_NEGOTIATION_PARITY '+msg)};
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:3,div2:false})];cfg.internationals=[];
  const db=buildWorld(cfg),[owner,buyer,third]=activeTeams(db),year=db.year;
  for(const t of [owner,buyer,third]){t.finance.cash=100000;for(const id of t.roster){
    const existing=db.players[id];if(existing?.contract)existing.contract.until=year+1;}
    for(const role of ROLES){
    const p=genPlayer(db,new RNG(t.id+'/'+role,'agent-fixture'),{region:t.region,role,age:24,base:62});
    signContract(db,p,t,2,2,{promisedRole:'starter'});}
    initializeDepthChart(db,t,true);t.depthChart={};
    for(const role of ROLES)t.depthChart[role]=t.roster.map(id=>db.players[id]).find(p=>p.role===role)?.id;}
  db.world={phase:'offseason',manage:'ai',year,seed:'agent-parity',negotiations:{},recruitment:{targets:{}}};
  const renew=starterFor(db,owner,ROLES[0]);renew.reputation=95;renew.age=26;
  renew.personality={professionalism:50,ambition:90};renew.careerGoal='stability';
  renew.contract.salary=.5;renew.rosterRole='core';delete renew.agent;
  const realUtility=offerUtility,originalConsent=contractTransferConsent,originalCandidates=aiMarketOfferCandidates;
  let counterCalls=0;
  offerUtility=(view,p,t,terms,opt={})=>{
    if(terms.signingBonus>0){counterCalls++;return offerAcceptanceThreshold(view,p,{kind:opt.renewal?'renewal':'fa'})+1}
    return 0;
  };
  const renewalBefore=JSON.stringify(owner.finance),renewal=aiRenewalDecision(db,renew,owner,
    {next:()=>.5,chance:()=>false,range:()=>.96,normal:()=>0});
  offerUtility=realUtility;
  check(renewal.want&&renewal.rounds>1&&renewal.stay&&renew.agent?.clientId===renew.id&&
    renewal.proposal.signingBonus>0&&counterCalls>0,
    "AI renewal did not use representative demand/counter with the player's final utility gate");
  check(JSON.stringify(owner.finance)===renewalBefore,'AI renewal negotiation charged cash before signing');

  const transferPlayer=starterFor(db,owner,ROLES[1]);transferPlayer.reputation=92;
  transferPlayer.personality={professionalism:50,ambition:92};transferPlayer.careerGoal='stability';
  transferPlayer.contract.salary=100;delete transferPlayer.agent;
  let consentCalls=0;
  contractTransferConsent=(view,p,t,terms=null)=>{
    consentCalls++;
    return {ok:true,willing:!!terms?.signingBonus,terms:terms||p.contract,
      reason:terms?.signingBonus?'accepted counter':'initial offer declined'};
  };
  const noCashBefore=JSON.stringify([buyer.finance,owner.finance]),personal=
    aiTransferPersonalTerms(db,transferPlayer,buyer,100,100);
  contractTransferConsent=originalConsent;
  check(personal?.kind==='new'&&personal.rounds>0&&personal.representative===
    ('AGENT_'+transferPlayer.id)&&consentCalls>1,
    'AI transfer personal-terms production helper skipped representative counter');
  check(!transferPlayer.agent&&JSON.stringify([buyer.finance,owner.finance])===noCashBefore,
    'transfer preview created a live agent or charged either club');

  // Force the real AI free-agent market through its representative-counter branch.
  const fa=Object.values(db.players).find(p=>p.id!==renew.id&&!p.team&&!p.retired)||
    genPlayer(db,new RNG('parity-fa','fixture'),{region:owner.region,role:ROLES[2],age:22,base:85});
  if(fa.team)assignPlayerToTeam(db,fa,null);
  fa.reputation=95;fa.personality={professionalism:50,ambition:90};fa.careerGoal='stability';
  delete fa.agent;
  aiMarketOfferCandidates=(view,t,fas,role,budgetRoom)=>role===fa.role&&fas.includes(fa)
    ?[{p:fa,v:999,ask:asking(view,fa,t.region)}]:[];
  offerUtility=(view,p,t,terms,opt={})=>{
    if(terms.signingBonus>0){counterCalls++;return offerAcceptanceThreshold(view,p,{kind:opt.renewal?'renewal':'fa'})+1}
    return 0;
  };
  db.world.manage='ai';db.world.phase='market';
  const preMarketSave=packDB(db);
  const marketBefore=JSON.stringify([owner.finance,buyer.finance,third.finance]),
    report={expired:[],resign:[],signings:[],released:[],transfers:[]};
  contractMarket(db,new RNG('agent-market','market'),report,{});
  offerUtility=realUtility;aiMarketOfferCandidates=originalCandidates;
  check(fa.team&&fa.contract&&fa.agent?.clientId===fa.id&&fa.contract.signingBonus>0&&
    report.signings.some(x=>x.pid===fa.id),
    'autonomous FA market did not execute its representative counter and sign through player policy');
  check(marketBefore!==JSON.stringify([owner.finance,buyer.finance,third.finance]),
    'accepted FA contract did not use ordinary contract settlement');

  // A queued managed-club offer remains exactly the submitted offer. The
  // autonomous counter path cannot silently turn it into an AI-approved deal.
  const humanDb=unpackDB(preMarketSave),humanFa=humanDb.players[fa.id];
  setManagedTeam(humanDb,buyer.id);humanDb.world.manage='manual';humanDb.world.phase='market';
  check(activeTeams(humanDb).every(t=>ROLES.every(role=>starterFor(humanDb,t,role))),
    'managed-offer fixture began with a missing starter');
  humanDb.world.offers=[{pid:humanFa.id,salary:.1,years:1}];
  aiMarketOfferCandidates=()=>[];
  const humanReport={expired:[],resign:[],signings:[],released:[],transfers:[]};
  contractMarket(humanDb,new RNG('managed-offer','market'),humanReport,{});
  offerUtility=realUtility;aiMarketOfferCandidates=originalCandidates;
  check(humanFa.team!==buyer.id&&!humanReport.signings.some(x=>x.pid===humanFa.id&&x.team===buyer.id),
    'managed low offer was rewritten and automatically committed by AI counters: '+
      JSON.stringify({buyer:buyer.id,team:humanFa.team,signings:humanReport.signings.filter(x=>x.pid===humanFa.id)}));

  // A human transfer negotiation identifies the actual representative; cancelling
  // it has no fee, cash or contract side effect. Legacy reads remain self-represented.
  const managed=unpackDB(packDB(db)),hp=managed.players[fa.id];setManagedTeam(managed,buyer.id);
  managed.world.manage='manual';assignPlayerToTeam(managed,hp,managed.teams[owner.id]);
  managed.world.recruitment.targets[hp.id]={pid:hp.id,priority:'A',stage:'evaluated',
    evaluation:{teamId:buyer.id},addedDate:managed.worldDate};
  const before=JSON.stringify([managed.teams[owner.id].finance,managed.teams[buyer.id].finance,hp.contract]),
    started=startNegotiation(managed,hp.id,'transfer',{sellerId:owner.id});
  check(started.ok&&started.neg.representative.id===hp.agent.id,'human transfer negotiation missed actual agent');
  started.neg.stage='player';globalThis.DB=managed;globalThis.esc=x=>String(x);
  check(renderNegotiations().includes(hp.agent.name),'player-facing transfer UI hid the actual representative');
  cancelNegotiation(managed,started.neg.id);
  check(JSON.stringify([managed.teams[owner.id].finance,managed.teams[buyer.id].finance,hp.contract])===before,
    'cancelled personal-terms negotiation created a fee or changed contract/cash');
  const legacy=unpackDB(packDB(managed));delete legacy.players[hp.id].agent;
  const legacySave=packDB(legacy),restored=unpackDB(legacySave),legacyPlayer=restored.players[hp.id];
  check(!legacyPlayer.agent&&!playerAgent(legacyPlayer)&&
    playerRepresentativeText(legacyPlayer)==='선수 직접 협상',
    'legacy/malformed representative fallback created an entity during save restore');
  legacyPlayer.agent={id:'AGENT_OTHER',clientId:'OTHER',name:'잘못된 담당자',profile:{ambition:99,professionalism:99}};
  check(!playerAgent(legacyPlayer)&&negotiationRepresentativeProfile(legacyPlayer)===legacyPlayer.personality,
    'malformed agent identity displaced the self-negotiation profile');
  const malformed=JSON.stringify(legacyPlayer.agent),readBefore=JSON.stringify(legacy);
  contractTransferConsent(legacy,legacyPlayer,legacy.teams[buyer.id]);
  check(JSON.stringify(legacy)===readBefore&&JSON.stringify(legacyPlayer.agent)===malformed,
    'read-only player-consent evaluation repaired or mutated malformed representative data');
  console.log('AGENT_NEGOTIATION_PARITY_ACCEPTANCE '+JSON.stringify({
    aiRenewalCounter:true,aiFaMarketCounter:true,aiTransferPersonalTerms:true,
    samePlayerConsent:true,liveTransferUi:true,saveLegacyFallback:true,
    malformedFallback:true,cancelNoFee:true,noPreviewCashMutation:true}));
})();`,{filename:'agent-negotiation-parity.fixture.js',setupSources:ui});

await runEngineFixture(String.raw`(()=>{
  const check=(ok,msg)=>{if(!ok)throw Error('AGENT_EARLY_FA '+msg)};
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:3,div2:false})];cfg.internationals=[];
  const db=buildWorld(cfg),[incumbent,buyer,other]=activeTeams(db),year=db.year;
  for(const t of [incumbent,buyer,other])t.finance.cash=1000000;
  const p=Object.values(db.players).find(x=>!x.team&&!x.retired);
  check(p,'fixture has no player');signContract(db,p,incumbent,asking(db,p,incumbent.region),1,
    {promisedRole:'starter'});
  p.reputation=95;p.personality={professionalism:50,ambition:90};p.careerGoal='stability';
  delete p.agent;
  const waiver={pid:p.id,incumbentId:incumbent.id,playerId:p.id};
  db.world={year,phase:'offseason',manage:'ai',seed:'early-agent',lastDate:year+'-11-16',
    contractWindow:{stage:'exclusive',seasonYear:year,startSeason:year+1,
      contractExpiryDate:year+'-11-30',effectiveDate:year+'-12-01',
      contactWaivers:{[p.id]:waiver}},contractAgreements:{},negotiations:{},
    recruitment:{targets:{}}};
  setWorldCalendarDate(db,year+'-11-17');
  check(contractExpiresThisSeason(db,p)&&earlyContactAllowed(db,p,buyer),
    'early-contact window fixture did not grant the AI destination contact');
  const initialContract=JSON.stringify(p.contract),cashBefore=JSON.stringify(
    [incumbent.finance,buyer.finance,other.finance]),originalCandidates=aiMarketOfferCandidates,
    originalUtility=offerUtility,originalBudget=salaryBudget;
  let earlyShortlistCalls=0;
  aiMarketOfferCandidates=(view,t,fas,role,room)=>{earlyShortlistCalls++;
    return t.id===buyer.id&&fas.includes(p)&&role===p.role
      ?[{p,v:1000,ask:asking(view,p,t.region)}]:[]};
  offerUtility=(view,player,t,terms)=>terms.signingBonus>0
    ?offerAcceptanceThreshold(view,player,{kind:'early_fa'})+1:0;
  const accepted=aiRunEarlyContactOffers(db),agreement=contractAgreementFor(db,p.id);
  offerUtility=originalUtility;aiMarketOfferCandidates=originalCandidates;
  check(accepted.length===1&&agreement?.status==='agreed'&&agreement.teamId===buyer.id&&
    accepted[0].representative===playerAgent(p)?.id&&accepted[0].negotiationRounds>1&&
    accepted[0].terms.signingBonus>0,
    'actual early-contact AI offer skipped the representative counter: '+
      JSON.stringify({accepted,agreement,agent:p.agent,team:p.team,date:db.worldDate,
        earlyShortlistCalls,room:salaryBudget(db,buyer)-payroll(db,buyer),ask:asking(db,p,buyer.region),
        window:db.world.contractWindow}));
  check(p.team===incumbent.id&&JSON.stringify(p.contract)===initialContract&&
    JSON.stringify([incumbent.finance,buyer.finance,other.finance])===cashBefore,
    'future early-contact agreement moved the player or charged a fee before its effective date');

  const refuseDb=unpackDB(packDB(db)),rp=refuseDb.players[p.id];
  delete refuseDb.world.contractAgreements[rp.id];
  refuseDb.world.contractWindow.contactWaivers[rp.id]=waiver;
  offerUtility=(view,player,t,terms)=>0;
  aiMarketOfferCandidates=(view,t,fas,role)=>t.id===buyer.id&&fas.includes(rp)&&role===rp.role
    ?[{p:rp,v:1000,ask:asking(view,rp,t.region)}]:[];
  const refused=aiRunEarlyContactOffers(refuseDb);
  offerUtility=originalUtility;aiMarketOfferCandidates=originalCandidates;
  check(!refused.length&&!contractAgreementFor(refuseDb,rp.id)&&rp.team===incumbent.id,
    'player refusal was bypassed on the early-contact counter path');

  const lowBudget=unpackDB(packDB(db)),bp=lowBudget.players[p.id];
  delete lowBudget.world.contractAgreements[bp.id];
  lowBudget.world.contractWindow.contactWaivers[bp.id]=waiver;
  salaryBudget=(_db,_team)=>payroll(_db,_team);
  aiMarketOfferCandidates=(view,t,fas,role)=>t.id===buyer.id&&fas.includes(bp)&&role===bp.role
    ?[{p:bp,v:1000,ask:asking(view,bp,t.region)}]:[];
  const blocked=aiRunEarlyContactOffers(lowBudget);
  salaryBudget=originalBudget;aiMarketOfferCandidates=originalCandidates;
  check(!blocked.length&&!contractAgreementFor(lowBudget,bp.id)&&bp.team===incumbent.id,
    'early-contact representative counter exceeded the actual salary budget');

  const managed=unpackDB(packDB(db)),mp=managed.players[p.id];
  delete managed.world.contractAgreements[mp.id];managed.world.contractWindow.contactWaivers[mp.id]=waiver;
  setManagedTeam(managed,buyer.id);managed.world.manage='manual';
  delete mp.agent;
  aiMarketOfferCandidates=(view,t,fas,role)=>t.id===buyer.id&&fas.includes(mp)&&role===mp.role
    ?[{p:mp,v:1000,ask:asking(view,mp,t.region)}]:[];
  const managerBefore=JSON.stringify(managed.world.contractAgreements),managerRows=
    aiRunEarlyContactOffers(managed);
  aiMarketOfferCandidates=originalCandidates;
  check(!managerRows.length&&JSON.stringify(managed.world.contractAgreements)===managerBefore&&
    !mp.agent,'AI early contact signed a future deal for the managed club');
  console.log('AGENT_EARLY_FA_ACCEPTANCE '+JSON.stringify({
    actualCounterAndFutureAgreement:true,playerRefusal:true,salaryBudget:true,
    managedClubAuthority:true,noEarlyFeeOrMove:true}));
})();`,{filename:'agent-early-contact.fixture.js'});
