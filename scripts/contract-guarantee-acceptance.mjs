// Regional common protection; existing signed rights remain binding.
import assert from 'node:assert/strict';
import {artifactSources,runEngineFixture} from './test-harness.mjs';
const [ui,app]=await artifactSources(['ui-negotiations.js','app.js']);
const esc=app.match(/^const esc=.*$/m)?.[0];assert(esc);
await runEngineFixture(String.raw`(()=>{
  const check=(x,m)=>{if(!x)throw new Error('REGIONAL_GUARANTEE '+m)};
  const db=buildWorld(),[mine,other]=activeTeams(db,null,1);
  setManagedTeam(db,mine.id);db.world={phase:'market',manage:'manual',year:db.year,seed:'regional-protection'};
  mine.finance.cash=other.finance.cash=10000;
  const [p,q]=Object.values(db.players).filter(p=>!p.retired&&!p.team);
  signContract(db,p,mine,1.7,3,{releaseGuaranteeRate:1});
  signContract(db,q,other,1.7,3,{releaseGuaranteeRate:.75});
  const oldCost=contractReleaseCost(db,p);
  db.regions[mine.region].releaseGuaranteeRate=.75;
  check(contractReleaseCost(db,p)===oldCost,'office change rewrote signed protection');
  for(const goal of ['titles','stability','development']){
    p.careerGoal=goal;
    check(normalizeContractTerms(db,p,mine,1.7,3,{releaseGuaranteeRate:1}).releaseGuaranteeRate===.75,'player selected different rule');
  }
  for(const [team,player,actor] of [[mine,p,'manager'],[other,q,'ai']]){
    db.regions[team.region].releaseGuaranteeRate=.75;
    const result=commitWorldAction(db,{type:'player.sign',pid:player.id,teamId:team.id,
      actor,kind:'renewal',salary:1.7,years:3,terms:{releaseGuaranteeRate:1}});
    check(result.ok&&player.contract.releaseGuaranteeRate===.75,'actor bypassed regional rule');
  }
  const n=startNegotiation(db,p.id,'renewal');check(n.ok,'negotiation setup failed');
  DB=db;const html=renderNegotiations();
  check(!html.includes('data-neg-guarantee')&&html.includes('방출 보장 75%'),'selector remains or common rule hidden');
  const values={sal:'1.7',years:'3',sign:'0',perf:'0',title:'0',intl:'0',buyout:'0',option:'none',role:'core'};
  globalThis.document={querySelector:s=>({value:values[s.match(/data-neg-([^=]+)/)[1]]})};
  check(!('releaseGuaranteeRate' in negotiationTermsFromDom(n.neg.id)),'UI submits protection choice');
  delete globalThis.document;
  for(const [team,player,actor] of [[mine,p,'manager'],[other,q,'ai']]){
    const before=JSON.stringify(db),command={type:'player.release',pid:player.id,teamId:team.id,actor,mode:actor==='ai'?'market':'manager'};
    const preview=previewWorldAction(db,command);
    check(preview.ok&&JSON.stringify(db)===before,'impure preview');
    check(preview.changes[0].settlement.amount===1.7*3*.75,'wrong compensation');
    const original=removePlayerFromTeam;
    removePlayerFromTeam=(world,player)=>{original(world,player);throw new Error('late failure')};
    check(!commitWorldAction(db,command).ok&&JSON.stringify(db)===before,'rollback lost contract or debt');
    removePlayerFromTeam=original;
    check(commitWorldAction(db,command).ok,'release failed');
  }
  const restored=unpackDB(packDB(db));
  check(restored.regions[mine.region].releaseGuaranteeRate===.75&&restored.teams[mine.id].finance.releaseObligations.at(-1).guaranteeRate===.75,'rule or debt failed restore');
  console.log('D04_REGIONAL_GUARANTEE_ACCEPTANCE: PASS (regional rule, both actors, legacy rights, UI, settlement, rollback, saves)');
})();`,{setupSources:[ui,esc]});
