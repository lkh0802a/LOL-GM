// Synthetic save: inject patchLock only after a real queued game is prepared.
// This does not assert the provenance or prevalence of any user's save.
import {runEngineFixture} from './test-harness.mjs';

await runEngineFixture(String.raw`(()=>{
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:10,div2:false})];cfg.internationals=[];
  const db=buildWorld(cfg),team=activeTeams(db)[0];startCareer(db,team.id,'patch-lock-save');
  autoBuildInitialSquad(db,team,new RNG('patch-lock-save','squad'),5);finalizeInitialRosters(db);
  setManagedTeam(db,null);
  const s=Object.values(db.world.seasons)[0],day=s.days[0],m=day.matches[0];
  setWorldCalendarDate(db,day.date);prepareOfficialClockGame(db,s,m);
  const original=packDB(db),control=unpackDB(original),cs=Object.values(control.world.seasons).find(x=>x.id===s.id),
    cm=cs.days[0].matches.find(x=>x.id===m.id);
  let controlError=null;try{officialQueuedGameError(control,cs,cm,cm.clockGame);}catch(e){controlError=e.name+': '+e.message;}
  const injected=unpackDB(original),is=Object.values(injected.world.seasons).find(x=>x.id===s.id),
    im=is.days[0].matches.find(x=>x.id===m.id),gamePatch=im.clockGame.observation.patch??null;
  is.patchLock={id:'synthetic-patch-id',date:day.date};
  const injectedBytes=packDB(injected),restored=unpackDB(injectedBytes),rs=Object.values(restored.world.seasons).find(x=>x.id===s.id),
    rm=rs.days[0].matches.find(x=>x.id===m.id),before=packDB(restored);
  let error=null;try{playOfficialGamesThrough(restored,rs,rm,rm.clockGame.endAt);}catch(e){error={name:e.name,message:e.message};}
  console.log('PATCH_LOCK_SAVE_OBSERVATION '+JSON.stringify({synthetic:true,actualPreparedGame:!!m.clockGame,
    explicitInjectedLock:true,controlError,restoredLock:rs.patchLock,gamePatch,error,
    restoredStateUnchanged:packDB(restored)===before,originalSyntheticBytesUnchanged:packDB(db)===original}));
})();`,{timeout:120000});
