// Synthetic legacy observation only: no real ballot, region or save is created.
import {runEngineFixture} from './test-harness.mjs';

await runEngineFixture(String.raw`(()=>{
  const original=buildWorld();original.world={year:original.year,seed:'region-office'};original.worldHype=600;
  const input=packDB(original),db=unpackDB(input),rng=new RNG('league-identity-governance','office');let call=0;
  rng.chance=()=>++call===1;
  const pick=rng.pick.bind(rng);rng.pick=xs=>xs.find?.(x=>x?.id==='LA')||pick(xs);
  const events=[];worldDecisions(db,rng,1,message=>events.push(message));
  const saved=packDB(db),restored=unpackDB(saved);
  const control=unpackDB(input),controlBefore=packDB(control);
  worldDecisions(control,new RNG('league-identity-governance','office'),0,()=>{});
  const controlUnchanged=packDB(control)===controlBefore;
  const inspect=x=>({hasLA:!!x.regions.LA,hasNA:!!x.regions.NA,
    globalKeys:Object.keys(x.global||{}).sort(),decisions:(x.global?.decisions||[]).slice(-1),
    regionOffice:x.regions.LA?.office||null});
  console.log('OFFICE_EXPANSION_OBSERVATION '+JSON.stringify({synthetic:true,providedBoardMembers:false,providedVotes:false,
    beforeKeys:Object.keys(original.global||{}).sort(),after:inspect(db),restored:inspect(restored),eventCount:events.length,
    controlFZeroUnchanged:controlUnchanged,originalUnchanged:packDB(original)===input}));
})();`);
