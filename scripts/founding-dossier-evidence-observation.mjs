// Paired synthetic founding-dossier observation, no actual user reports or saves.
import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:3,div2:false})];cfg.internationals=[];
 const db=buildWorld(cfg),[manager,ai]=activeTeams(db,'NA',1);setManagedTeam(db,manager.id);
 db.world={year:db.year,phase:'initial_roster',manage:'manual',seed:'dossier-pair',seasons:{}};
 const p=genPlayer(db,new RNG('dossier-pair-player'),{region:'NA',role:'TOP',age:20,base:60});p.reputation=60;
 const original=packDB(db),low=unpackDB(original),high=unpackDB(original);
 for(const k of Object.keys(p.attrs)){low.players[p.id].attrs[k]=40;high.players[p.id].attrs[k]=90}
 const take=x=>{const q=x.players[p.id],t=x.teams[ai.id];const games=scoutSample(x,q).g,managerEstimate=obsOvr(x,q),beforeAi=packDB(x);
  const report=aiScoutReport(x,t,q),after=packDB(x);
  return {games,managerEstimate,report,aiReportCreationChangedBytes:beforeAi!==after}};
 const l=take(low),h=take(high),lowSaved=packDB(low),highSaved=packDB(high);
 const lowRestored=unpackDB(lowSaved),highRestored=unpackDB(highSaved);
 const restored={low:aiScoutReport(lowRestored,lowRestored.teams[ai.id],lowRestored.players[p.id]),high:aiScoutReport(highRestored,highRestored.teams[ai.id],highRestored.players[p.id])};
 for(const k of Object.keys(p.attrs))high.players[p.id].attrs[k]=40;
 const reread=aiScoutReport(high,high.teams[ai.id],high.players[p.id]);
 console.log('FOUNDING_DOSSIER_OBSERVATION '+JSON.stringify({synthetic:true,low:l,high:h,
  restoredMatches:JSON.stringify(restored.low)===JSON.stringify(l.report)&&JSON.stringify(restored.high)===JSON.stringify(h.report),
  rereadAfterHiddenChangeSame:JSON.stringify(reread)===JSON.stringify(h.report),originalUnchanged:packDB(db)===original}));
})();`);
