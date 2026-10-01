// D04-B4b: negotiated protection, actual release settlement and save compatibility.
import assert from 'node:assert/strict';
import {artifactSources,runEngineFixture} from './test-harness.mjs';

const [ui,app]=await artifactSources(['ui-negotiations.js','app.js']);
const escapeDeclaration=app.match(/^const esc=.*$/m)?.[0];
assert(escapeDeclaration,'canonical HTML escaping helper missing');

await runEngineFixture(String.raw`(()=>{
  const check=(ok,msg)=>{if(!ok)throw new Error('CONTRACT_GUARANTEE '+msg)};
  let db=buildWorld();
  const [mine,other]=activeTeams(db,null,1);
  setManagedTeam(db,mine.id);
  db.world={phase:'market',manage:'manual',year:db.year,seed:'guarantee-acceptance'};
  mine.finance.cash=other.finance.cash=10000;
  const [p,bench,aiPlayer]=Object.values(db.players).filter(p=>!p.retired&&!p.team).slice(0,3);
  signContract(db,p,mine,1.7,3);
  signContract(db,bench,mine,1.7,3);
  signContract(db,aiPlayer,other,1.7,3);
  p.careerGoal='stability';
  check(contractGuaranteePolicy(p).preferred===1,'stability preference missing');
  p.careerGoal='development';
  check(contractGuaranteePolicy(p).preferred===.75,'development preference missing');
  p.careerGoal='titles';
  check(contractGuaranteePolicy(p).preferred===.5,'flexible preference missing');
  p.careerGoal='stability';
  const base=normalizeContractTerms(db,p,mine,asking(db,p,mine.region),3,
    {promisedRole:'core'}),full={...base,releaseGuaranteeRate:1};
  check(base.releaseGuaranteeRate===.5&&
    Math.abs(offerUtility(db,p,mine,full)-offerUtility(db,p,mine,base)-.11)<1e-9,
    'protection does not influence acceptance independently of salary');
  const command={type:'player.sign',pid:p.id,teamId:mine.id,actor:'manager',
    kind:'renewal',salary:1.7,years:3,terms:{releaseGuaranteeRate:.75}};
  for(const invalid of [NaN,Infinity,-1,0,.6,1.1,'1']){
    const before=JSON.stringify(db),bad={...command,terms:{releaseGuaranteeRate:invalid}};
    check(!commitWorldAction(db,bad).ok&&JSON.stringify(db)===before,
      'invalid protection committed or mutated world');
  }
  const n=startNegotiation(db,p.id,'renewal');
  check(n.ok&&n.neg.demand.releaseGuaranteeRate===1,'player demand lost protection');
  const counter=negotiationCounter(db,n.neg,base);
  check(counter.releaseGuaranteeRate===1,'counter dropped player demand');
  const generous=negotiationCounter(db,{...n.neg,demand:base},full);
  check(generous.releaseGuaranteeRate===1,'counter reduced a better club guarantee');
  const beforeInvalid=JSON.stringify(db);
  check(!submitNegotiationOffer(db,n.neg.id,{...base,releaseGuaranteeRate:.6}).ok&&
    JSON.stringify(db)===beforeInvalid,'invalid negotiation consumed a round');
  DB=db;
  const html=renderNegotiations(),domValues={guarantee:'.75',sal:'1.7',years:'3',
    sign:'0',perf:'0',title:'0',intl:'0',buyout:'0',option:'none',role:'core'};
  check(html.includes('data-neg-guarantee=')&&html.includes('value="1" selected')&&
    html.includes('75%')&&html.includes('방출 보장 100%'),'UI lost actual demand or choices');
  globalThis.document={querySelector:selector=>({value:domValues[
    selector.match(/data-neg-([^=]+)/)[1]]})};
  check(negotiationTermsFromDom(n.neg.id).releaseGuaranteeRate===.75,
    'UI submitted a different guarantee');
  delete globalThis.document;
  let accepted=null;
  for(let k=10;k<=22;k++){
    const offer={...base,salary:Math.round(base.salary*k)/10,releaseGuaranteeRate:.75};
    if(!negotiationBudgetError(db,p,mine,offer,'renewal')&&
      contractOfferReasonable(db,p,mine,offer,'renewal')&&
      offerUtility(db,p,mine,offer,{renewal:true})>=offerAcceptanceThreshold(db,p,{kind:'renewal'})){
      accepted=offer;break;
    }
  }
  check(accepted,'fixture has no affordable accepted renewal');
  const r=submitNegotiationOffer(db,n.neg.id,accepted);
  check(r.ok&&p.contract.releaseGuaranteeRate===.75&&
    n.neg.acceptedTerms.releaseGuaranteeRate===.75&&
    p.careerEvents.at(-1).releaseGuaranteeRate===.75,'accepted terms not applied or recorded');
  const decision=aiRenewalDecision(db,db.players[other.roster[0]],other,new RNG('guarantee-ai'));
  check(decision.proposal.releaseGuaranteeRate===
    contractGuaranteePolicy(db.players[other.roster[0]]).preferred,'AI renewal bypassed policy');
  const initial=aiInitialContractTerms(db,p,mine,new RNG('guarantee-initial'));
  check(initial.releaseGuaranteeRate===1,'initial AI terms bypassed policy');
  // Both actors release via the real transaction and accrue the agreed basis.
  for(const [team,actor,rate] of [[mine,'manager',.75],[other,'ai',1]]){
    const player=actor==='manager'?p:db.players[team.roster[0]];
    if(actor==='ai')signContract(db,player,team,1.7,3,{releaseGuaranteeRate:rate});
    const before=JSON.stringify(db),cash=team.finance.cash,
      preview=previewWorldAction(db,{type:'player.release',pid:player.id,
        teamId:team.id,actor,mode:actor==='manager'?'manager':'market'});
    check(preview.ok&&JSON.stringify(db)===before,'release preview mutated state');
    const settlement=preview.changes[0].settlement;
    check(settlement.guaranteeRate===rate&&
      settlement.amount===player.contract.salary*3*rate,'release ignored negotiated guarantee');
    check(applyWorldAction(db,preview).ok&&team.finance.cash===cash&&
      team.finance.releaseObligations.at(-1).guaranteeRate===rate,
      'negotiated liability lost or immediately charged');
  }
  const optionPlayer=db.players[mine.roster[0]];
  signContract(db,optionPlayer,mine,1.7,1,{releaseGuaranteeRate:1,option:{type:'team'}});
  db.year++;check(exerciseContractOption(db,optionPlayer,mine)&&
    optionPlayer.contract.releaseGuaranteeRate===1,'option extension lost protection');
  // Omitted legacy terms and medical/initial exemptions preserve old semantics.
  delete optionPlayer.contract.releaseGuaranteeRate;
  check(contractReleaseCost(db,optionPlayer)===1.7*.5,'legacy default changed');
  optionPlayer.contract.releaseGuaranteeRate=1;
  check(contractReleaseCost(db,optionPlayer,'initial')===0&&
    contractReleaseCost(db,optionPlayer,'medical_end')===0,'exempt release charged');
  optionPlayer.contract.medicalReplacement={};
  check(contractReleaseCost(db,optionPlayer)===0,'medical guarantee confused with release guarantee');
  delete optionPlayer.contract.medicalReplacement;
  // A failure after finance accrual must restore the full negotiated contract.
  const original=removePlayerFromTeam,before=JSON.stringify(db);
  removePlayerFromTeam=(world,player)=>{original(world,player);throw new Error('late guarantee failure')};
  const failed=commitWorldAction(db,{type:'player.release',pid:optionPlayer.id,
    teamId:mine.id,actor:'manager',mode:'manager'});
  removePlayerFromTeam=original;
  check(!failed.ok&&JSON.stringify(db)===before,'rollback lost negotiated contract or liability');
  const restored=unpackDB(packDB(db));
  check(restored.players[optionPlayer.id].contract.releaseGuaranteeRate===1&&
    restored.teams[mine.id].finance.releaseObligations.at(-1).guaranteeRate===.75&&
    restored.world.negotiations[n.neg.id].acceptedTerms.releaseGuaranteeRate===.75,
    'active contract, negotiation or pending settlement failed save/restore');
  delete restored.players[optionPlayer.id].contract.releaseGuaranteeRate;
  const legacy=unpackDB(packDB(restored)),legacyPlayer=legacy.players[optionPlayer.id];
  check(contractReleaseCost(legacy,legacyPlayer)===1.7*.5,
    'missing legacy contract term changed after save restoration');
  legacyPlayer.contract.until=legacy.year-1;
  check(contractReleaseCost(legacy,legacyPlayer)===0,'expired contract acquired compensation');
  console.log('D04_CONTRACT_GUARANTEE_ACCEPTANCE '+JSON.stringify({
    choices:[.5,.75,1],negotiated:true,playerUtility:true,managerAiRelease:true,
    uiTerms:true,options:true,legacy:true,medicalExempt:true,rollback:true,saveRestore:true}));
})();`,{filename:'contract-guarantee.fixture.js',setupSources:[ui,escapeDeclaration]});
