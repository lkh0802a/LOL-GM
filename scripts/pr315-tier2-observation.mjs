// Run inside an isolated export of PR #315 at the exact reviewed HEAD.
// Synthetic inputs; no real regulations, user saves or registrations.
import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('VN',{teams:10,system:'franchise',div2:false})];cfg.internationals=[];
 const db=buildWorld(cfg),R=db.regions.VN,top=activeTeams(db,'VN',1)[0],academy=reserveTeamsOf(db,top)[0];
 const p=genPlayer(db,new RNG('tier-owned-fixture'),{region:'VN',role:ROLES[0],age:22,base:60});signContract(db,p,academy,1,3);
 if(!academy||!academy.academyOnly||R.div2)throw Error('synthetic one-tier academy setup missing');
 const before=packDB(db),draft=unpackDB(before),A=draft.teams[academy.id],L=draft.regions.VN;
 const snapshot=x=>({div2:x.regions.VN.div2,academyOnly:x.teams[academy.id].academyOnly,parent:x.teams[academy.id].parent,roster:[...x.teams[academy.id].roster],license:x.teams[academy.id].competitionLicense,registration:x.teams[academy.id].registration??null});
 const original=snapshot(db),beforeCreate=snapshot(draft);createDiv2(draft,new RNG('tier-create-probe'),L);
 const afterCreate=snapshot(draft),comp=leagueComp(draft,'VN',2),post=packDB(draft),restored=unpackDB(post);
 if(packDB(db)!==before)throw Error('synthetic source changed');
 console.log('TIER2_CREATION_OBSERVATION '+JSON.stringify({synthetic:true,initial:beforeCreate,after:afterCreate,competitionContainsAcademy:comp.teams.includes(academy.id),competitionTeams:comp.teams.length,restored:snapshot(restored),originalUnchanged:packDB(db)===before,originalMatches:JSON.stringify(snapshot(db))===JSON.stringify(original)}));
})();`);
