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
