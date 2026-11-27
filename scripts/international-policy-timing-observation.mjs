// Synthetic policy-timing comparison; no real rule change or user save.
import {runEngineFixture} from './test-harness.mjs';

await runEngineFixture(String.raw`(()=>{
  const cfg=defaultWorldConfig(),db=buildWorld(cfg);
  db.world={year:2030,seed:'policy-timing',seasons:{},step:0,steps:[]};
  if(!startInternational(db,'WORLD_CHAMPIONSHIP','2030-08-01',new Set()))throw Error('fixture event did not start');
  const season=db.world.seasons.WORLD_CHAMPIONSHIP,teams=db.competitions[season.comp].teams;
  season.done=true;season.champion=teams[0];season.runnerUp=teams[1];
  season.stageData={regular:{teams:teams.slice(0,2)}};season.days=[];
  db.global={power:{},internationalResults:[]};
  const original=packDB(db),baseline=unpackDB(original),changed=unpackDB(original);
  changed.worldConfig.internationalPolicy.weights.WORLD_CHAMPIONSHIP=1;
  changed.worldConfig.internationalPolicy.placementPoints.champion=4;
  recordInternationalResults(baseline,baseline.world);
  recordInternationalResults(changed,changed.world);
  const a=baseline.global.internationalResults[0],b=changed.global.internationalResults[0];
  if(!a||!b||a.eventId!==b.eventId||a.teams[0].teamId!==b.teams[0].teamId)
    throw Error('paired synthetic event changed');
  const ranking=x=>{const ratings=internationalRegionRatings(x,2030);return Object.keys(ratings).map(id=>x.regions[id]).filter(Boolean).sort((l,r)=>compareInternationalRegions(x,ratings,l,r,2030)).map(r=>r.id)};
  const baselineOrder=ranking(baseline),changedOrder=ranking(changed);
  const winnerRegion=a.teams[0].regionId;
  const baselineRating=internationalRegionRatings(baseline,2030)[winnerRegion];
  const changedRating=internationalRegionRatings(changed,2030)[winnerRegion];
  changed.worldConfig.internationalPolicy.weights.WORLD_CHAMPIONSHIP=2;
  recordInternationalResults(changed,changed.world);
  const restored=unpackDB(packDB(changed)),saved=restored.global.internationalResults[0];
  console.log('INTERNATIONAL_POLICY_TIMING_OBSERVATION '+JSON.stringify({
    sameEvent:a.eventId===b.eventId,sameChampion:a.teams[0].teamId===b.teams[0].teamId,
    winnerRegion,baselineRating,changedRating,baselineOrder,changedOrder,restoredOrder:ranking(restored),restoredRating:internationalRegionRatings(restored,2030)[winnerRegion],
    baseline:{weight:a.weight,points:a.teams[0].points},changed:{weight:b.weight,points:b.teams[0].points},
    afterLaterPolicyChange:{weight:saved.weight,points:saved.teams[0].points,records:restored.global.internationalResults.length},
    originalUnchanged:packDB(db)===original
  }));
})();`);
