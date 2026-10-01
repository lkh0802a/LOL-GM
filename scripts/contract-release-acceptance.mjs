// R03: one release-cost rule for preview/apply/UI, with finance-owned accrual.
import assert from 'node:assert/strict';
import {artifactSources,runEngineFixture} from './test-harness.mjs';

await runEngineFixture(String.raw`(()=>{
  const assert=(ok,msg)=>{if(!ok)throw new Error('CONTRACT_RELEASE '+msg)};
  const db=buildWorld(),team=activeTeams(db,null,1)[0],
    p=Object.values(db.players).find(p=>!p.retired&&!p.team);
  db.world={phase:'market',manage:'auto',year:db.year};
  let cases=0;
  for(const salary of [.3,1.7])for(const left of [-1,0,2])
    for(const mode of ['manager','market','initial','expired','medical_end']){
      const probe={contract:{salary,until:db.year+left}};
      const old=mode==='initial'||mode==='medical_end'?0:
        left>=0?salary*(left+1)*.5:0;
      assert(Object.is(contractReleaseCost(db,probe,mode),old),'release cost or precision changed');
      cases++;
    }
  assert(contractReleaseCost(db,{contract:null})===0&&
    contractReleaseCost(db,{contract:{salary:5,until:db.year+2,medicalReplacement:{}}})===0,
    'no-contract or medical exemption changed');
  signContract(db,p,team,1.7,3);
  const cash=team.finance.cash,prior=team.finance.buyout||0,
    command={type:'player.release',pid:p.id,teamId:team.id,mode:'market',actor:'system'},
    before=JSON.stringify(db),preview=previewWorldAction(db,command);
  assert(preview.ok&&preview.changes[0].cost===contractReleaseCost(db,p,'market'),
    'release preview did not use the canonical rule');
  assert(JSON.stringify(db)===before,'release preview mutated state');
  const result=applyWorldAction(db,preview);
  assert(result.ok&&result.cost===preview.changes[0].cost&&
    team.finance.buyout===prior+result.cost&&team.finance.cash===cash&&!p.team&&!p.contract,
    'release accrual, immediate cash or roster behavior changed');
  const restored=unpackDB(packDB(db));
  assert(restored.teams[team.id].finance.buyout===team.finance.buyout,
    'release liability did not survive save/restore');
  const blank={finance:{}};recordContractReleaseObligation(blank,0);
  assert(!Object.hasOwn(blank.finance,'buyout'),'zero accrual created a ledger field');
  console.log('CONTRACT_RELEASE_ACCEPTANCE '+JSON.stringify({costCases:cases,
    previewApplyParity:true,cashUnchanged:true,saveRestore:true}));
})();`,{filename:'contract-release-acceptance.fixture.js'});

const [ui]=await artifactSources(['ui-market.js']);
assert(ui.includes('cost=contractReleaseCost(DB,p)'),
  'release confirmation must display the same engine cost');
