// Synthetic preview and isolated contract diagnostic; it does not impose a new rule.
import {runEngineFixture} from './test-harness.mjs';

await runEngineFixture(String.raw`(()=>{
  const cfg=defaultWorldConfig();
  cfg.regions=[regionCfg('NA',{teams:10,div2:false,system:'franchise'})];cfg.internationals=[];
  const db=buildWorld(cfg),club=activeTeams(db,'NA',1)[0];
  db.manager.teamId=club.id;club.finance.cash=1000;
  const aiClub=activeTeams(db,'NA',1).find(t=>t.id!==club.id);aiClub.finance.cash=1000;
  const coach=db.staffPool.find(s=>s.role==='strategicCoach');
  if(!coach)throw Error('missing synthetic coach');
  const same=club.staffRoster.find(s=>staffDepartment(s.role)===staffDepartment(coach.role));
  for(const date of ['2026-11-30','2026-12-01','2026-12-28','2026-12-29']){
    setWorldCalendarDate(db,date);
    const intent={type:'staff.sign',actor:'manager',teamId:club.id,sid:coach.id,years:2,
      salary:staffAskingSalary(db,club,coach),...(same?{replaceSid:same.id}:{})};
    const before=JSON.stringify(db),result=previewWorldAction(db,intent);
    if(JSON.stringify(db)!==before)throw Error('preview mutated synthetic state');
    const copy=unpackDB(packDB(db)),preview=previewWorldAction(copy,intent);
    const applied=preview.ok?applyWorldAction(copy,preview):null;
    const employed=!!locateStaff(copy,coach.id)?.team;
    if(JSON.stringify(db)!==before)throw Error('isolated contract mutated original');
    const aiCopy=unpackDB(packDB(db)),aiTeam=aiCopy.teams[aiClub.id],aiCoach=aiCopy.staffPool.find(s=>s.id===coach.id);
    const aiSame=aiTeam.staffRoster.find(s=>staffDepartment(s.role)===staffDepartment(aiCoach.role));
    const aiIntent={type:'staff.sign',actor:'ai',teamId:aiTeam.id,sid:aiCoach.id,years:2,
      salary:staffAskingSalary(aiCopy,aiTeam,aiCoach),...(aiSame?{replaceSid:aiSame.id}:{})};
    const aiBefore=packDB(aiCopy),aiPreview=previewWorldAction(aiCopy,aiIntent),aiPreviewUnchanged=packDB(aiCopy)===aiBefore;
    const aiApplied=aiPreview.ok?applyWorldAction(aiCopy,aiPreview):null;
    const aiSaved=packDB(aiCopy),aiRestored=unpackDB(aiSaved),aiFound=locateStaff(aiRestored,coach.id);
    const ai={preview:aiPreview.ok,reason:aiPreview.reason??null,previewUnchanged:aiPreviewUnchanged,
      applied:aiApplied?.ok??null,team:aiFound?.team?.id??null,expectedTeam:aiTeam.id,
      retainedAfterRestore:aiFound?.team?.id===aiTeam.id,originalUnchanged:JSON.stringify(db)===before};
    console.log('COACH_MARKET_OBSERVATION ' +JSON.stringify({date,ai,ok:result.ok,reason:result.reason??null,
      applied:applied?.ok??null,employed,originalUnchanged:true}));
  }
})();`);
