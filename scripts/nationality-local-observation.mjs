// Synthetic legacy identity observation; no national-team policy is created.
import {runEngineFixture} from './test-harness.mjs';

await runEngineFixture(String.raw`(()=>{
  const cfg=defaultWorldConfig();cfg.regions=['NA','KR'].map(id=>regionCfg(id,{teams:4,div2:false}));cfg.internationals=[];
  const db=buildWorld(cfg),club=activeTeams(db,'NA',1)[0];
  const p=genPlayer(db,new RNG('national-local-observation'),{region:'NA',nationality:'KR',role:'TOP',age:22,base:60});
  signContract(db,p,club,1,3);
  const original=packDB(db),saved=unpackDB(original),restored=saved.players[p.id];
  const snapshot=x=>({nationality:x.nationality,origin:x.originRegion,activeLocal:playerActiveLocalRegion(x),
    localNA:isLocalPlayer(x,'NA',club.id),localKR:isLocalPlayer(x,'KR',club.id)});
  console.log('NATIONALITY_LOCAL_OBSERVATION '+JSON.stringify({synthetic:true,before:snapshot(p),afterRestore:snapshot(restored),
    originalUnchanged:packDB(db)===original}));
})();`);
