import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error('STAFF_REGISTRATION '+m)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,system:'franchise',staffRegistration:{max:2}})];cfg.internationals=[];
 const db=buildWorld(cfg),[mine,ai]=activeTeams(db,'NA',1);db.manager.teamId=mine.id;startWorldSeason(db,mine.id,'staff-entry');
 const s=Object.values(db.world.seasons)[0];check(competitionStaffEntry(db,s,ai.id).length===2&&competitionStaffEntry(db,s,mine.id).length===0,'AI/manual initialization authority wrong');
 const ids=mine.staffRoster.slice(0,2).map(x=>x.id),before=JSON.stringify(db),preview=previewWorldAction(db,{type:'competition.staff-register',actor:'manager',seasonId:s.id,teamId:mine.id,staffIds:ids});
 check(preview.ok&&JSON.stringify(db)===before,'preview rejected or changed state: '+(preview.errors||[]).join(' · '));check(applyWorldAction(db,preview).ok&&competitionStaffEntry(db,s,mine.id).join(',')===ids.join(','),'manager entry failed');
 check(!previewWorldAction(db,{type:'competition.staff-register',actor:'manager',seasonId:s.id,teamId:mine.id,staffIds:mine.staffRoster.slice(0,3).map(x=>x.id)}).ok,'published cap bypassed');
 check(!previewWorldAction(db,{type:'competition.staff-register',actor:'manager',seasonId:s.id,teamId:mine.id,staffIds:[ai.staffRoster[0].id]}).ok,'other club employee registered');
 const original=JSON.stringify(db),handler=WORLD_ACTION_HANDLERS['competition.staff-register'],writer=handler.apply;handler.apply=(state,c)=>{writer(state,c);throw Error('late failure')};const fault=applyWorldAction(db,previewWorldAction(db,{type:'competition.staff-register',actor:'manager',seasonId:s.id,teamId:mine.id,staffIds:[]}));handler.apply=writer;check(!fault.ok&&JSON.stringify(db)===original,'late failure did not restore entries');
 const saved=unpackDB(packDB(db)),savedSeason=staffRegistrationSeason(saved,s.id);check(competitionStaffEntry(saved,savedSeason,mine.id).join(',')===ids.join(','),'save lost staff entries');db.worldDate=s.days[0].date;
 check(!previewWorldAction(db,{type:'competition.staff-register',actor:'manager',seasonId:s.id,teamId:mine.id,staffIds:[]}).ok,'opening fixture did not lock entry');console.log('STAFF_REGISTRATION_ACCEPTANCE '+JSON.stringify({manager:ids.length}));
})();`,{timeout:30000,filename:'staff-registration-acceptance.fixture.js'});
