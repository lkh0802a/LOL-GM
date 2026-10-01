import assert from 'node:assert/strict';
import {artifactSources,runEngineFixture} from './test-harness.mjs';
const [ui,app]=await artifactSources(['ui-market.js','app.js']);
const escaping=app.match(/^const esc=.*$/m)?.[0];
assert(escaping);
await runEngineFixture(String.raw`(()=>{
  const check=(ok,msg)=>{if(!ok)throw new Error('MUTUAL_TERMINATION '+msg)};
  let db=buildWorld();
  const [mine,other]=activeTeams(db,null,1),
    pool=Object.values(db.players).filter(p=>!p.team&&!p.retired).slice(0,4);
  setManagedTeam(db,mine.id);
  db.world={phase:'offseason',manage:'manual',year:db.year};
  for(const [i,p] of pool.entries()){
    signContract(db,p,i===1?other:mine,1.7,3,{releaseGuaranteeRate:1});
    p.careerGoal='stability';p.satisfaction=75;p.wantsOut=false;
  }
  const [leaver,ai,stay,role]=pool;
  leaver.name='<script>leaver</script>';leaver.wantsOut=true;
  role.careerGoal='starter';role.rosterRole='backup';
  const pureBefore=JSON.stringify(db),quote=contractMutualTerminationTerms(db,leaver);
  check(quote.ok&&quote.willing&&quote.guaranteedAmount===5.1&&
    quote.minimumAmount===2.6&&JSON.stringify(db)===pureBefore,'impure or wrong player demand');
  check(contractMutualTerminationTerms(db,role).minimumAmount===3.9,
    'playing opportunity did not affect compensation demand');
  role.rosterRole='core';role.satisfaction=49;
  check(contractMutualTerminationTerms(db,role).minimumAmount===5.1,
    'unhappy player lost guarantee without departure intent');
  const command={type:'player.release',actor:'manager',pid:leaver.id,
    teamId:mine.id,mode:'mutual',amount:quote.minimumAmount};
  const denied=(c,msg)=>{const before=JSON.stringify(db);check(!commitWorldAction(db,c).ok&&
    JSON.stringify(db)===before,msg)};
  for(const amount of [NaN,Infinity,-1,0,quote.minimumAmount-.1,quote.guaranteedAmount+.1])
    denied({...command,amount},'invalid settlement changed world');
  denied({...command,pid:stay.id},'content player forced to consent');
  denied({...command,actor:'ai'},'AI bypassed manual team authority');
  db.world.phase='season';denied(command,'in-season mutual termination accepted');
  db.world.phase='initial_roster';denied(command,'initial roster mutual termination accepted');
  db.world.phase='offseason';
  leaver.contract.medicalReplacement={};denied(command,'medical clause bypassed');
  delete leaver.contract.medicalReplacement;
  db.world.contractAgreements={[leaver.id]:{status:'agreed'}};
  denied(command,'future agreement destroyed');delete db.world.contractAgreements;
  const stale=previewWorldAction(db,command);leaver.wantsOut=false;
  check(!applyWorldAction(db,stale).ok&&leaver.team===mine.id,'stale consent accepted');
  leaver.wantsOut=true;
  const tampered=previewWorldAction(db,command);tampered.command.amount=0;
  check(!applyWorldAction(db,tampered).ok,'preview amount tampering accepted');
  // UI submits the real shared preview and respects cancel before mutation.
  DB=db;
  const beforeRender=JSON.stringify(db),html=renderMutualTermination(mine);
  check(html.includes('data-mutual-submit')&&html.includes('&lt;script&gt;leaver&lt;/script&gt;')&&
    !html.includes('<script>leaver</script>')&&html.includes('상호 해지 불가')&&
    JSON.stringify(db)===beforeRender,'UI unsafe, impure or missing consent state');
  const button={dataset:{mutualSubmit:leaver.id}},messages=[];
  globalThis.document={querySelectorAll:()=>[button],querySelector:()=>({value:String(command.amount)})};
  globalThis.confirm=()=>false;bindMutualTerminationControls(msg=>messages.push(msg));button.onclick();
  check(JSON.stringify(db)===beforeRender&&!messages.length,'cancelled UI committed termination');
  globalThis.confirm=()=>true;const cash=mine.finance.cash;button.onclick();
  delete globalThis.document;delete globalThis.confirm;
  check(leaver.team===null&&leaver.contract===null&&mine.finance.cash===cash&&
    messages.length===1&&mine.finance.buyout===quote.minimumAmount,
    'UI consent did not end contract/accrue exactly once');
  const detail=mine.finance.releaseObligations.at(-1);
  check(detail.mode==='mutual'&&detail.amount===quote.minimumAmount&&
    detail.guaranteedAmount===quote.guaranteedAmount&&detail.consentReason&&
    leaver.careerEvents.at(-1).type==='mutual_termination','consent audit missing');
  denied(command,'duplicate termination accepted');
  ai.wantsOut=true;
  const aiTerms=contractMutualTerminationTerms(db,ai),aiCommand={...command,
    actor:'ai',pid:ai.id,teamId:other.id,amount:aiTerms.minimumAmount};
  check(commitWorldAction(db,aiCommand).ok&&other.finance.releaseObligations.at(-1).mode==='mutual',
    'AI did not use same consent and settlement path');
  // Late writer failure restores the full contract, player and finance ledger.
  role.wantsOut=true;
  const original=removePlayerFromTeam,before=JSON.stringify(db);
  removePlayerFromTeam=(world,p)=>{original(world,p);throw Error('late mutual failure')};
  const failed=commitWorldAction(db,{...command,pid:role.id,
    amount:contractMutualTerminationTerms(db,role).minimumAmount});
  removePlayerFromTeam=original;
  check(!failed.ok&&JSON.stringify(db)===before,'late failure left partial termination');
  db=unpackDB(packDB(db));
  check(db.players[leaver.id].contract===null&&
    db.teams[mine.id].finance.releaseObligations.at(-1).consentReason===detail.consentReason,
    'termination save restoration lost agreement basis');
  for(const t of activeTeams(db))t.finance.cash=10000;
  const team=db.teams[mine.id],forecast=financeForecast(db,team);
  closeFinances(db,{year:db.year,seasons:{}},new RNG('mutual-close'),()=>{});
  const row=team.finance.history.at(-1);
  check(Math.abs(team.finance.cash-forecast.closingCash)<.11&&
    row.releaseSettlement.items.at(-1).mode==='mutual'&&team.finance.buyout===0,
    'mutual settlement charged twice or lost basis');
  closeFinances(db,{year:db.year+1,seasons:{}},new RNG('mutual-next'),()=>{});
  check(team.finance.history.at(-1).exp.buyout===0,'mutual settlement charged again');
  // Drive the production AI market cleanup, not just a hand-built AI command.
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:2,div2:false})];
  cfg.internationals=[];
  const marketDb=buildWorld(cfg),[managerTeam,aiTeam]=activeTeams(marketDb,null,1);
  setManagedTeam(marketDb,managerTeam.id);
  marketDb.world={phase:'market',manage:'manual',year:marketDb.year,marketLog:[]};
  const fixtureRng=new RNG('mutual-ai-supply');
  for(const role of ROLES)for(let i=0;i<3;i++)
    genPlayer(marketDb,fixtureRng,{role,age:23,base:60,region:'NA'});
  const available=Object.values(marketDb.players).filter(p=>!p.retired&&!p.team),chosen=[];
  for(const role of ROLES)chosen.push(available.find(p=>p.role===role));
  chosen.push(...available.filter(p=>!chosen.includes(p)).slice(0,3));
  for(const p of chosen){
    signContract(marketDb,p,aiTeam,.3,3);
    p.wantsOut=true;p.careerGoal='starter';
  }
  const report={expired:[],signings:[],transfers:[],resign:[]};
  contractMarket(marketDb,new RNG('mutual-ai-market'),report,()=>{});
  check(aiTeam.finance.releaseObligations?.filter(x=>x.mode==='mutual').length>=2,
    'production AI roster cleanup bypassed mutual settlement');
  console.log('D04_MUTUAL_TERMINATION_ACCEPTANCE '+JSON.stringify({
    consent:true,offseasonOnly:true,medicalAgreementGuards:true,managerAi:true,
    purePreview:true,staleAndTamper:true,uiSubmitCancel:true,rollback:true,
    saveRestore:true,singleSettlement:true}));
})();`,{filename:'contract-mutual-termination.fixture.js',setupSources:[ui,escaping]});
