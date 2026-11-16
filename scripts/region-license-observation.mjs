// Diagnostic only: a deliberately constructed license state in an in-memory
// fixture is not evidence of a real rejection or an approved eligibility rule.
import {runEngineFixture} from './test-harness.mjs';

await runEngineFixture(String.raw`(()=>{
  const cfg=defaultWorldConfig();
  cfg.regions=['NA','EU'].map(id=>regionCfg(id,{teams:10,div2:false,system:'franchise'}));
  cfg.internationals=[];
  const db=buildWorld(cfg);
  db.world={year:db.year,phase:'offseason',seed:'license-observation',seasons:{}};
  const club=activeTeams(db,'NA',1)[0];
  club.competitionLicense.current.status='rejected'; // Hypothetical, not a real decision.
  const before=club.competitionLicense.current.status;
  moveClubForRegionReorganization(db,club,'EU','regional-merger');
  console.log('REGION_LICENSE_OBSERVATION '+JSON.stringify({
    synthetic:true,before,after:club.competitionLicense.current.status,
    destination:club.region,reason:club.competitionLicense.history.at(-1)?.reason
  }));
})();`);
