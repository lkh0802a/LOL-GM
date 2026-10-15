import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {runEngineFixture} from './test-harness.mjs';
const sources=await Promise.all(['state','market','contracts','views','management'].map(p=>readFile(new URL('../src/ui-v2/'+p+'.js',import.meta.url),'utf8')));
const result=await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error('UI_V2_MANAGEMENT '+m)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:10,div2:false})];cfg.internationals=[];
 const db=buildWorld(cfg),[t,foreign]=activeTeams(db,'NA',1);setManagedTeam(db,t.id);db.world={phase:'season',year:db.year,seed:'ui-v2-management',manage:'manual',registrationVersion:1,seasons:{},offers:[],marketLog:[],steps:[],step:0};setWorldCalendarDate(db,db.year+'-01-10');
 for(const team of activeTeams(db)){for(const role of ROLES){const p=genPlayer(db,new RNG('ui-v2-management|'+team.id+role),{region:team.region,role,age:22,base:65});signContract(db,p,team,1,2,{})}initializeDepthChart(db,team,true);team.finance.cash=1000;}initializeOfficialRegistrations(db);
 V2.db=db;V2.tab='훈련';const before=packDB(db);v2PreparationView();v2Staff();check(packDB(db)===before,'조회로 게임 상태 변경');
 const d=v2Preparation(),x=d.command.squads[t.id];x.training.intensity='high';x.training.focus='individual';x.tactics.aggression=37;
 check(packDB(db)===before,'편집 초안이 실제 상태 변경');
 const expected=v2Copy(db),original=commitWorldAction(expected,v2Copy(d.command));check(original.ok,'원래 작성자 준비');
 v2ReviewManagement(d.command,'검토',['훈련']);check(packDB(db)===before,'검토에 실제 상태 변경');const reviewed=V2.managementReview;
 check(v2CommitManagement(reviewed).ok,'새 화면 준비 확정');check(packDB(db)===packDB(expected),'원래 작성자 전체 결과와 다름');V2.managementReview=null;V2.preparation=null;
 check(!v2CommitManagement(reviewed).ok,'이전 확정 재사용');
 const restored=unpackDB(packDB(db));check(JSON.stringify(restored.teams[t.id].training)===JSON.stringify(t.training),'훈련 저장 복원');
 const p=db.players[t.roster[0]];p.medicalPlan='rest';consumeScrimPractice(db,t,2);runDailyPractice(db);check(t.practiceDay.drills===80&&t.practiceUsage.individual===64&&!p.practiceDay,'실제 하루 자원·의료 제외 소비');const once=packDB(db);runDailyPractice(db);check(packDB(db)===once,'하루 소비 중복');
 // Current source changes invalidate both the draft and confirmed preview.
 V2.preparation=null;let plan=v2Preparation();plan.command.squads[t.id].training.intensity='light';v2ReviewManagement(plan.command,'검토',['변경']);let r=V2.managementReview;t.training.intensity='normal';let unchanged=packDB(db);check(!v2PreparationCurrent(plan)&&!v2CommitManagement(r).ok&&packDB(db)===unchanged,'현재 준비 변경 거절');V2.preparation=null;V2.managementReview=null;
 for(const kind of ['date','fired','auto','pending','load']){plan=v2Preparation();v2ReviewManagement(plan.command,'검토',['변경']);r=V2.managementReview;const snapshot=packDB(V2.db);if(kind==='date')V2.db.worldDate=addDays(V2.db.worldDate,1);if(kind==='fired')V2.db.world.fired=true;if(kind==='auto')V2.db.world.manage='ai';if(kind==='pending')V2.db.world.pendingOfficial={queue:[]};if(kind==='load')V2.db=unpackDB(packDB(V2.db));unchanged=packDB(V2.db);check(!v2CommitManagement(r).ok&&packDB(V2.db)===unchanged,kind+' 권한/옛 검토 거절');V2.db=unpackDB(snapshot);V2.preparation=null;V2.managementReview=null;}
 // Late original writer failure must retain current objects and all values.
 const live=v2Team();plan=v2Preparation();plan.command.squads[live.id].training.intensity='light';v2ReviewManagement(plan.command,'검토',['변경']);r=V2.managementReview;const writer=WORLD_ACTION_HANDLERS['squad.preparation'].apply,oldTraining=live.training;unchanged=JSON.stringify(V2.db);WORLD_ACTION_HANDLERS['squad.preparation'].apply=(db,c)=>{writer(db,c);throw Error('통제된 준비 작성 실패')};const failure=v2CommitManagement(r);WORLD_ACTION_HANDLERS['squad.preparation'].apply=writer;check(!failure.ok&&JSON.stringify(V2.db)===unchanged&&live.training===oldTraining,'늦은 실패 전체 복구');V2.preparation=null;V2.managementReview=null;
 const staff=V2.db.staffPool.find(s=>s.role==='analyst'),command={type:'staff.sign',actor:'manager',teamId:live.id,sid:staff.id,years:2,salary:staffAskingSalary(V2.db,live,staff)};
 const baseline=packDB(V2.db),staffExpected=v2Copy(V2.db);check(commitWorldAction(staffExpected,command).ok,'원래 직원 계약');v2ReviewManagement(command,'직원 계약',['조건']);check(packDB(V2.db)===baseline,'직원 검토 계약 선작성');r=V2.managementReview;check(v2CommitManagement(r).ok&&packDB(V2.db)===packDB(staffExpected),'기존 직원 계약 전체 결과 동일');V2.managementReview=null;
 check(unpackDB(packDB(V2.db)).teams[live.id].staffRoster.some(s=>s.id===staff.id),'직원 계약 저장 복원');
 const release={type:'staff.release',actor:'manager',teamId:live.id,sid:staff.id};v2ReviewManagement(release,'해지',['보상']);r=V2.managementReview;live.finance.cash+=1;unchanged=packDB(V2.db);check(!v2CommitManagement(r).ok&&packDB(V2.db)===unchanged,'직원 예산 변경 검토 거절');V2.managementReview=null;
 const newBaseline=v2Copy(V2.db),releaseExpected=v2Copy(V2.db);check(commitWorldAction(releaseExpected,release).ok,'원래 직원 해지');v2ReviewManagement(release,'해지',['보상']);check(v2CommitManagement(V2.managementReview).ok&&packDB(V2.db)===packDB(releaseExpected),'직원 해지 보상·역사 전체 동일');V2.managementReview=null;
 const interview={type:'staff.interview',actor:'manager',teamId:live.id,sid:staff.id},interviewExpected=v2Copy(V2.db);check(commitWorldAction(interviewExpected,interview).ok,'원래 직원 면접');v2ReviewManagement(interview,'면접',['기록']);check(v2CommitManagement(V2.managementReview).ok&&packDB(V2.db)===packDB(interviewExpected),'직원 면접 전체 동일');V2.managementReview=null;
 const invalid={...command,sid:V2.db.staffPool.find(s=>s.role==='analyst').id,years:1.5};unchanged=packDB(V2.db);v2ReviewManagement(invalid,'잘못된 기간',[]);check(!V2.managementReview&&packDB(V2.db)===unchanged,'잘못된 기간 거절');
 return {readPure:true,originalPreparationWholeResult:true,dailyPracticeOnce:true,medicalExclusion:true,currentAuthorityCases:5,lateRollback:true,staffWholeResult:true,staffReleaseAndInterviewWholeResult:true,staffBudgetStale:true,saveRestore:true,fixture:packDB(V2.db)};
})()`,{setupSources:[...sources,"function v2Icon(){return ''} function v2Render(){}; const document={getElementById(){return {textContent:''}}};"],timeout:120000});
assert(result.readPure&&result.staffWholeResult&&result.dailyPracticeOnce);
if(process.env.UI_V2_FIXTURE)await writeFile(process.env.UI_V2_FIXTURE,JSON.stringify({game:result.fixture,read:{}}));
delete result.fixture;console.log('UI_V2_MANAGEMENT_ACCEPTANCE',JSON.stringify(result));
