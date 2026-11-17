// Synthetic, read-only preview diagnostic; it does not impose a new rule.
import {runEngineFixture} from './test-harness.mjs';

await runEngineFixture(String.raw`(()=>{
  const cfg=defaultWorldConfig();
  cfg.regions=[regionCfg('NA',{teams:10,div2:false,system:'franchise'})];cfg.internationals=[];
  const db=buildWorld(cfg),club=activeTeams(db,'NA',1)[0];
  db.manager.teamId=club.id;club.finance.cash=1000;
  const coach=db.staffPool.find(s=>s.role==='strategicCoach');
  if(!coach)throw Error('missing synthetic coach');
  const same=club.staffRoster.find(s=>staffDepartment(s.role)===staffDepartment(coach.role));
  for(const date of ['2026-11-30','2026-12-01','2026-12-28','2026-12-29']){
    setWorldCalendarDate(db,date);
    const intent={type:'staff.sign',actor:'manager',teamId:club.id,sid:coach.id,years:2,
      salary:staffAskingSalary(db,club,coach),...(same?{replaceSid:same.id}:{})};
    const before=JSON.stringify(db),result=previewWorldAction(db,intent);
    if(JSON.stringify(db)!==before)throw Error('preview mutated synthetic state');
    console.log('COACH_MARKET_OBSERVATION '+JSON.stringify({date,ok:result.ok,reason:result.reason??null}));
  }
})();`);
