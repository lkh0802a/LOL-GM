// Diagnostic only: a synthetic pending-event shape, not a user save or a
// claim that current saves contain patchLock. Earlier gates are stubbed to
// isolate the guarded consumer of that field.
import {runEngineFixture} from './test-harness.mjs';

await runEngineFixture(String.raw`(()=>{
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:3,div2:false})];cfg.internationals=[];
  const db=buildWorld(cfg),[a,b]=activeTeams(db).map(t=>t.id),id='controlled-match';
  db.world={phase:'season',year:2027,seasons:{}};
  const s={id:'controlled-season',comp:'controlled-comp',year:2027,seed:'controlled',patchLock:{id:'synthetic-patch',date:'2027-01-01'}};
  const m={id,a,b,bo:1,utcAt:'2027-01-01T00:00:00Z'};
  const event={endAt:'2027-01-01T00:00:00Z',session:{a,b,bestOf:1,seed:'controlled/2027/'+id,
    opt:{compId:s.comp,metaContext:{season:s.id}},games:[{patch:'synthetic-patch'}]},
    observation:{date:'2027-01-01',patch:'synthetic-patch'}};
  const originalCheck=officialResourceStartCheck,originalTime=officialGameTimeRecord;
  const before=JSON.stringify(db);let error=null;
  try{
    officialResourceStartCheck=()=>{};
    officialGameTimeRecord=()=>({gameTimeThrough:'2027-01-01T00:00:00Z'});
    officialQueuedGameError(db,s,m,event);
  }catch(e){error={name:e.name,message:e.message};}
  finally{officialResourceStartCheck=originalCheck;officialGameTimeRecord=originalTime;}
  console.log('PATCH_LOCK_REFERENCE_OBSERVATION '+JSON.stringify({synthetic:true,earlierGatesStubbed:true,
    resolverType:typeof internationalMatchPatch,error,stateUnchanged:JSON.stringify(db)===before}));
})();`);
