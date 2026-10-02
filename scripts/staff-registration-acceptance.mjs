import {runEngineFixture,artifactSource} from './test-harness.mjs';
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
 const saved=unpackDB(packDB(db)),savedSeason=staffRegistrationSeason(saved,s.id);check(competitionStaffEntry(saved,savedSeason,mine.id).join(',')===ids.join(','),'save lost staff entries');
 // Submitted staff must affect the real official draft; unregistered staff
 // remain employed and available for ordinary club training and practice.
 for(const t of [mine,ai]){for(const role of ROLES){const p=genPlayer(db,new RNG(t.id+role,'staff-entry-player'),{region:t.region,role,age:22,base:65});signContract(db,p,t,1,2,{})}initializeDepthChart(db,t,true);delete t.registration}
 initializeOfficialRegistrations(db);
 const staffCommand={type:'competition.staff-register',actor:'manager',seasonId:s.id,teamId:mine.id,staffIds:[]};
 check(commitWorldAction(db,staffCommand).ok,'empty on-site list refused');
 const session=createSeriesSession(db,mine.id,ai.id,1,'staff-official',{compId:s.comp,metaContext:{season:s.id}}),view=seriesOfficialView(db,session),ctx=session.ctx;
 check(view.teams[mine.id].staffRoster.length===0&&mine.staffRoster.length>0,'on-site view changed employment or ignored entry');
 const emptyDraft=createDraftSession(view,[mine.id,ai.id],new RNG('staff-draft','draft'),ctx);
 check(!draftStaffAdvice(emptyDraft,0).available,'unregistered advisers appeared in official draft');
 const coach=mine.staffRoster.find(x=>x.role==='strategicCoach'),analyst=mine.staffRoster.find(x=>x.role==='analyst');
 check(commitWorldAction(db,{...staffCommand,staffIds:[coach.id,analyst.id]}).ok,'coach/analyst entry failed');
 const enteredView=seriesOfficialView(db,session),enteredDraft=createDraftSession(enteredView,[mine.id,ai.id],new RNG('staff-draft','draft'),ctx);
 check(draftStaffAdvice(enteredDraft,0).available&&staffProfile(enteredView.teams[mine.id]).analysis>staffProfile(view.teams[mine.id]).analysis,'registered analysis did not reach actual draft');
 const advisers=enteredDraft.db.teams[mine.id].staffRoster,adviceBefore=draftStaffAdvice(enteredDraft,0),specialtyBefore=advisers.map(s=>s.specialties);
 for(const s of advisers)s.specialties={topCoach:90,jglCoach:90,midCoach:90,adcCoach:90,supCoach:90};
 const adviceAfter=draftStaffAdvice(enteredDraft,0);
 check(adviceAfter.available&&adviceAfter.confidence<adviceBefore.confidence&&JSON.stringify(adviceAfter.suggestions)!==JSON.stringify(adviceBefore.suggestions),'actual draft advice bypassed specialization allocation');
 advisers.forEach((s,i)=>s.specialties=specialtyBefore[i]);
 const focusBefore=analyst.analysisFocus,metaDraft=()=>createDraftSession(seriesOfficialView(db,session),[mine.id,ai.id],new RNG('analysis-context','draft'),ctx);
 analyst.analysisFocus='meta';const metaState=metaDraft(),metaAdvice=draftStaffAdvice(metaState,0),metaEvidence=draftMetaEvidence(metaState,0,metaState.champs[0].id);
 analyst.analysisFocus='data';const dataState=metaDraft(),dataAdvice=draftStaffAdvice(dataState,0),cid=dataState.champs[0].id;
 check(metaAdvice.confidence>dataAdvice.confidence&&JSON.stringify(metaState.vhat[0])!==JSON.stringify(dataState.vhat[0]),'meta specialist did not change actual draft evaluation/advice');
 check(draftMetaEvidence(dataState,0,cid).confidence>metaEvidence.confidence,'data specialist did not change actual sample evidence');
 analyst.analysisFocus=focusBefore;
 check(seriesOfficialView(db,{...session,opt:{...session.opt,practice:true}})===db,'practice lost club staff');
 const stage=db.competitions[s.comp].stages[0],match={a:mine.id,b:ai.id,bo:1,id:'staff-field-game'},result=simulateScheduledSeries(db,s,s.days[0],match,stage);
 check(result.lines.length===10&&result.rec.games.length===1,'registered staff path failed actual scheduled game');
 check(Object.values(mine.metaKnowledge||{}).some(v=>v>0),'registered-view opponent learning was not persisted to actual team');
 const observedMatch=simulateMatch(db,mine.id,ai.id,'analysis-observation',null,true),observeWorld=(focus,managerId)=>{
   const w=unpackDB(packDB(db));w.manager.teamId=managerId;
   for(const tid of [mine.id,ai.id]){delete w.teams[tid].metaKnowledge;delete w.teams[tid].metaCounter}
   const observed={...observedMatch,sides:observedMatch.sides.map(x=>({...x,team:{...w.teams[x.team.id],staffRoster:[{...analyst,rating:70,specialties:{},analysisFocus:focus}]}}))};
   recordMeta(w,observed);return w;
 };
 const opponentWorld=observeWorld('opponent',mine.id),dataWorld=observeWorld('data',mine.id),aiObserved=observeWorld('opponent',ai.id),observedCid=observedMatch.sides.find(x=>x.team.id===ai.id).ps[0].champ.id;
 check(opponentWorld.teams[mine.id].metaKnowledge[observedCid]>dataWorld.teams[mine.id].metaKnowledge[observedCid],'opponent specialty did not affect actual recorded observation');
 check(JSON.stringify(opponentWorld.teams[mine.id].metaKnowledge)===JSON.stringify(aiObserved.teams[mine.id].metaKnowledge),'human/AI observation differs');
 check(JSON.stringify(unpackDB(packDB(opponentWorld)).teams[mine.id].metaKnowledge)===JSON.stringify(opponentWorld.teams[mine.id].metaKnowledge),'save lost observed learning');
 check(!coach.career,'simulation before commit invented career');
 commitScheduledSeries(db,s,match,result);check(coach.career[0].series===1&&analyst.career[0].series===1&&coach.career[0].wins===(result.rec.winner===mine.id?1:0),'committed official results lost staff career');
 let duplicateBlocked=false;try{commitScheduledSeries(db,s,match,result)}catch{duplicateBlocked=true}check(duplicateBlocked&&coach.career[0].series===1,'duplicate match doubled staff career');
 check(!officialStaffServiceSnapshot(db,mine.id,ai.id,{practice:true,metaContext:{season:s.id}}),'practice invented professional career');
 const pendingSnapshot=officialStaffServiceSnapshot(db,mine.id,ai.id,{metaContext:{season:s.id}});
 check(pendingSnapshot[mine.id].length===2&&!pendingSnapshot[mine.id].some(x=>x.id===mine.staffRoster.find(x=>x.role==='scout').id),'non-registered staff received match service');
 // AI rechecks changed employees before the deadline through the shared gate.
 const submit=WORLD_ACTION_HANDLERS['competition.staff-register'].apply;let aiSubmissions=0;
 WORLD_ACTION_HANDLERS['competition.staff-register'].apply=(state,c)=>{if(c.actor==='ai')aiSubmissions++;return submit(state,c)};
 delete s.staffEntries[ai.id];aiReviewCompetitionStaffRegistrations(db);
 WORLD_ACTION_HANDLERS['competition.staff-register'].apply=submit;
 check(aiSubmissions>0&&s.staffEntryRecords[ai.id].source==='ai'&&!s.staffEntryRecords[mine.id]?.source?.includes('ai'),'AI bypassed shared gateway or changed manager entry');
 const stale=previewWorldAction(db,staffCommand);s.staffRegistrationPolicy.max=1;check(applyWorldAction(db,stale).reason==='stale_preview','changed published policy accepted old preview');s.staffRegistrationPolicy.max=2;
 for(const bad of [undefined,null,{},'bad',[coach.id,coach.id],[7]])check(!previewWorldAction(db,{...staffCommand,staffIds:bad}).ok,'malformed submission accepted or threw');
 // UI cancellation and authority are exercised on the same production command.
 globalThis.DB=db;globalThis.esc=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');globalThis.MSG='';let saves=0;globalThis.saveDB=()=>saves++;globalThis.navKeepScroll=()=>{};
 const button={dataset:{competitionStaffSubmit:s.id,teamId:mine.id}};
 globalThis.document={querySelectorAll:q=>q==='[data-competition-staff-submit]'?[button]:q.includes(':checked')?[{value:coach.id}]:[]};
 globalThis.confirm=()=>false;bindOfficialRegistrationControls();const cancelled=packDB(db);button.onclick();check(packDB(db)===cancelled&&!saves,'cancelled UI mutated entries');
 globalThis.confirm=()=>true;button.onclick();check(saves===1&&competitionStaffEntry(db,s,mine.id).length===1,'confirmed UI did not submit/save');
 check(!competitionStaffRegistrationPanel(ai).includes('data-competition-staff-submit'),'other team UI offered manager submission');
 check(commitWorldAction(db,{...staffCommand,staffIds:[coach.id,analyst.id]}).ok,'restore two on-site staff failed');
 db.worldDate=s.days[0].date;
 const lockedAi=JSON.stringify(s.staffEntries[ai.id]);ai.staffRoster[0].publicEstimate=100;aiReviewCompetitionStaffRegistrations(db);check(JSON.stringify(s.staffEntries[ai.id])===lockedAi,'AI changed locked on-site entry');
 check(!previewWorldAction(db,{type:'competition.staff-register',actor:'manager',seasonId:s.id,teamId:mine.id,staffIds:[]}).ok,'opening fixture did not lock entry');console.log('STAFF_REGISTRATION_ACCEPTANCE '+JSON.stringify({manager:ids.length}));
 // Departures may reduce active field staff but never invalidate historical
 // entry evidence or allow a replacement after the published lock.
 coach.name='<staff-history>';check(commitWorldAction(db,{type:'staff.release',actor:'manager',teamId:mine.id,sid:coach.id}).ok,'staff departure failed');
 recordStaffMatchService(db,s,{staffService:pendingSnapshot,winner:mine.id});check(coach.career[0].series===2&&analyst.career[0].series===2,'pending series reassigned departed staff contribution');
 check(competitionStaffEntry(db,s,mine.id).includes(coach.id)&&!competitionStaffMatchRoster(db,s,mine).includes(coach),'departure erased history or retained field effect');
 const departedSave=unpackDB(packDB(db));check(competitionStaffEntry(departedSave,staffRegistrationSeason(departedSave,s.id),mine.id).includes(coach.id),'departure made save unloadable');
 s.done=true;db.worldDate=addDays(s.days[0].date,-1);check(!previewWorldAction(db,staffCommand).ok,'completed event allowed resubmission');
 const damaged=JSON.parse(packDB(db));Object.values(damaged.world.seasons)[0].staffEntries[mine.id]={bad:true};let rejected=false;try{unpackDB(JSON.stringify(damaged))}catch{rejected=true}check(rejected,'malformed stored entries accepted');
 // The current competition object may be replaced by a later split. The old
 // season retains its published cap and deadline.
 db.competitions[s.comp].rules.staffRegistration={max:0};check(competitionStaffPolicy(db,s).max===2,'historical policy changed with current competition');
 check(unpackDB(packDB(db)),'historical policy prevented restore');
 // International policy belongs to that event and can publish a deadline
 // earlier than its first fixture; it does not inherit regional staff limits.
 db.competitions.STAFF_INT={id:'STAFF_INT',international:true,name:'Staff international',teams:[mine.id,ai.id],rules:{staffRegistration:{max:1,lockAt:db.year+'-02-01'}},stages:[{id:'rr',type:'round_robin',legs:1,bestOf:1,name:'Test'}]};
 const intl=newSeason(db,'STAFF_INT',db.year,'staff-int',db.year+'-02-07');db.world.seasons.STAFF_INT=intl;db.worldDate=db.year+'-01-25';aiReviewCompetitionStaffRegistrations(db);
 check(competitionStaffEntry(db,intl,ai.id).length===1&&competitionStaffPolicy(db,intl).lockAt===db.year+'-02-01','international policy inherited regional cap or deadline');
 check(commitWorldAction(db,{...staffCommand,seasonId:intl.id,staffIds:[analyst.id]}).ok,'international submission failed');
 db.worldDate=db.year+'-02-01';check(!previewWorldAction(db,{...staffCommand,seasonId:intl.id,staffIds:[]}).ok,'published early deadline ignored');
 check(unpackDB(packDB(db)),'international entries failed restore');
 console.log('STAFF_REGISTRATION_GAMEPLAY: PASS (official draft, practice, AI command, authority, policy snapshot, UI, departed-staff history and saves)');
})();`,{timeout:30000,filename:'staff-registration-acceptance.fixture.js',setupSources:[await artifactSource('ui-registration.js')]});

await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error('STAFF_COVERAGE '+m)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,system:'franchise',staffRegistration:{max:2}})];cfg.internationals=[];
 const db=buildWorld(cfg),[mine,ai]=activeTeams(db,'NA',1);db.manager.teamId=mine.id;startWorldSeason(db,mine.id,'staff-coverage');
 const s=Object.values(db.world.seasons)[0],rng=new RNG('staff-coverage'),make=(id,role,estimate,focus)=>{
  const x=genStaffMember(rng,role,estimate);x.id=id;x.rating=estimate;x.publicEstimate=estimate;x.specialties={};
  if(focus===undefined)delete x.analysisFocus;else x.analysisFocus=focus;
  initializeStaffContract(db,ai,x);return x;
 };
 // The highest raw estimates are a club-only trainer and duplicated strategy.
 const trainer=make('Scoverage-training','developmentCoach',99),coach=make('Scoverage-strategy','strategicCoach',90),duplicate=make('Scoverage-duplicate','strategicCoach',89),analyst=make('Scoverage-analysis','analyst',80);
 ai.staffRoster=[trainer,duplicate,coach,analyst];ai.staffReports={};
 const before=JSON.stringify(db),plan=aiCompetitionStaffPlan(db,s,ai);
 check(plan.join(',')===[coach.id,analyst.id].join(','),'raw estimate defeated complementary coverage');
 check(JSON.stringify(db)===before,'read-only planning mutated state');
 ai.staffRoster.reverse();check(JSON.stringify(aiCompetitionStaffPlan(db,s,ai))===JSON.stringify(plan),'roster ordering changed deterministic selection');
 coach.rating=1;analyst.rating=1;duplicate.rating=99;
 check(JSON.stringify(aiCompetitionStaffPlan(db,s,ai))===JSON.stringify(plan),'selection read hidden primary truth');
 coach.rating=90;analyst.rating=80;
 const managed=JSON.stringify(s.staffEntries[mine.id]);aiReviewCompetitionStaffRegistrations(db);
 check(JSON.stringify(competitionStaffEntry(db,s,ai.id))===JSON.stringify(plan)&&s.staffEntryRecords[ai.id].source==='ai','actual AI review did not use the common writer');
 const records=JSON.stringify(s.staffEntryRecords);aiReviewCompetitionStaffRegistrations(db);check(JSON.stringify(s.staffEntryRecords)===records,'unchanged plan rewrote history');
 check(JSON.stringify(s.staffEntries[mine.id])===managed,'AI altered manual entry');
 const command={type:'competition.staff-register',actor:'ai',seasonId:s.id,teamId:ai.id,staffIds:plan},preview=previewWorldAction(db,command);
 ai.staffReports[analyst.id]={year:db.year,estimate:5,min:1,max:10};
 check(applyWorldAction(db,preview).reason==='stale_preview','changed observed evidence accepted stale AI plan');
 check(aiCompetitionStaffPlan(db,s,ai).includes(duplicate.id)&&!aiCompetitionStaffPlan(db,s,ai).includes(analyst.id),'fresh report did not change actual planner preference');
 delete ai.staffReports[analyst.id];
 const focusPreview=previewWorldAction(db,command);analyst.analysisFocus='meta';check(applyWorldAction(db,focusPreview).reason==='stale_preview','changed public analysis context accepted stale plan');delete analyst.analysisFocus;
 const specialization=previewWorldAction(db,command);coach.specialties={topCoach:90,midCoach:90,adcCoach:90,supCoach:90};
 check(applyWorldAction(db,specialization).reason==='stale_preview'&&aiCompetitionStaffPlan(db,s,ai)[0]===duplicate.id,'dispersion ignored by planning/stale guard');
 const hiddenSecondary=JSON.stringify(aiCompetitionStaffPlan(db,s,ai));coach.specialties={topCoach:1,midCoach:1,adcCoach:1,supCoach:1};
 check(JSON.stringify(aiCompetitionStaffPlan(db,s,ai))===hiddenSecondary,'selection read hidden secondary magnitudes');coach.specialties={};
 const meta=make('Scoverage-meta','analyst',90,'meta'),metaCopy=make('Scoverage-meta-copy','analyst',89,'meta'),data=make('Scoverage-data','analyst',80,'data');
 ai.staffRoster=[metaCopy,data,meta];check(aiCompetitionStaffPlan(db,s,ai).join(',')===[meta.id,data.id].join(','),'duplicate analysis displaced complementary context');
 const secondary=make('Scoverage-secondary','topCoach',99);secondary.specialties={analyst:1};
 ai.staffRoster=[trainer,secondary];check(aiCompetitionStaffPlan(db,s,ai).join(',')===secondary.id,'public secondary role failed to support an official context');
 const scout=make('Scoverage-scout','scout',80),tieA=make('Scoverage-tie-a','strategicCoach',80),tieB=make('Scoverage-tie-b','strategicCoach',80);
 ai.staffRoster=[tieB,tieA];s.staffRegistrationPolicy.max=1;check(aiCompetitionStaffPlan(db,s,ai).join(',')===tieA.id,'equal contribution tie was not ID-stable');s.staffRegistrationPolicy.max=2;
 ai.staffRoster=[trainer,scout];check(aiCompetitionStaffPlan(db,s,ai).join(',')===scout.id,'official scouting context omitted');
 const player=genPlayer(db,new RNG('coverage-observed-player'),{region:mine.region,role:'TOP',age:22,base:65});signContract(db,player,mine,1,2,{});
 const probe={db,teamIds:[ai.id,mine.id],ctx:{byTeam:{}},vhat:[{},{}]},cid=Object.keys(db.patch.champions)[0];
 const scouted=draftMasteryObservation(probe,0,1,player,cid);ai.staffRoster=[trainer];
 check(scouted.confidence>draftMasteryObservation(probe,0,1,player,cid).confidence,'scout selection had no real draft observation effect');
 ai.staffRoster=[trainer];check(aiCompetitionStaffPlan(db,s,ai).length===0,'club-only role invented on-site quota');
 ai.staffRoster=[coach,analyst];coach.retired=true;analyst.contract.until=db.year-1;check(aiCompetitionStaffPlan(db,s,ai).length===0,'retired/expired employees selected');
 delete coach.retired;analyst.contract.until=db.year+1;
 s.staffRegistrationPolicy.max=0;aiReviewCompetitionStaffRegistrations(db);check(competitionStaffEntry(db,s,ai.id).length===0,'published zero cap ignored');s.staffRegistrationPolicy.max=2;
 check(aiCompetitionStaffPlan(db,{comp:'unpublished'},ai).length===0,'unpublished policy invented a cap');
 aiReviewCompetitionStaffRegistrations(db);
 const original=JSON.stringify(db),handler=WORLD_ACTION_HANDLERS['competition.staff-register'],writer=handler.apply;
 handler.apply=(state,c)=>{writer(state,c);throw Error('late selection failure')};
 const fault=applyWorldAction(db,previewWorldAction(db,{...command,staffIds:[]}));handler.apply=writer;
 check(!fault.ok&&JSON.stringify(db)===original,'AI late failure lost registration/history or changed employment');
 // Real official sessions consume the selected staff, not a planner-only score.
 for(const t of [mine,ai]){for(const role of ROLES){const p=genPlayer(db,new RNG(t.id+role,'coverage-player'),{region:t.region,role,age:22,base:65});signContract(db,p,t,1,2,{})}initializeDepthChart(db,t,true);delete t.registration}
 initializeOfficialRegistrations(db);
 const session=createSeriesSession(db,mine.id,ai.id,1,'coverage-official',{compId:s.comp,metaContext:{season:s.id}}),view=seriesOfficialView(db,session),draft=createDraftSession(view,[mine.id,ai.id],new RNG('coverage-draft'),session.ctx);
 while(draftTurn(draft)?.side!==1)draftApplyChoice(draft,draftAiChoice(draft));
 check(view.teams[ai.id].staffRoster.length===2&&draftStaffAdvice(draft,1).available&&staffAnalysisFor(view.teams[ai.id],'data')>42,'observed AI plan did not reach real official draft');
 check(ai.staffRoster.length===2&&seriesOfficialView(db,{...session,opt:{...session.opt,practice:true}})===db,'planning changed employment/practice staffing');
 const stage=db.competitions[s.comp].stages[0],match={a:mine.id,b:ai.id,bo:1,id:'coverage-field-game'},result=simulateScheduledSeries(db,s,s.days[0],match,stage);
 check(result.lines.length===10&&result.rec.games.length===1,'planned official roster failed scheduled match');commitScheduledSeries(db,s,match,result);
 check(coach.career[0].series===1&&analyst.career[0].series===1,'AI selected staff missing from actual career');
 const restored=unpackDB(packDB(db)),rs=staffRegistrationSeason(restored,s.id);
 check(JSON.stringify(competitionStaffEntry(restored,rs,ai.id))===JSON.stringify(plan)&&JSON.stringify(restored.teams[ai.id].staffRoster)===JSON.stringify(ai.staffRoster),'save lost planned entry/employment');
 db.worldDate=s.days[0].date;const locked=JSON.stringify(s.staffEntries[ai.id]);analyst.publicEstimate=1;aiReviewCompetitionStaffRegistrations(db);check(JSON.stringify(s.staffEntries[ai.id])===locked,'observed change bypassed deadline');
 check(commitWorldAction(db,{type:'staff.release',actor:'ai',teamId:ai.id,sid:analyst.id}).ok,'AI departure failed');
 check(competitionStaffEntry(db,s,ai.id).includes(analyst.id)&&!competitionStaffMatchRoster(db,s,ai).includes(analyst),'departure erased submission or retained field effect');
 check(unpackDB(packDB(db)),'saved history invalid after planned staff departed');
 console.log('STAFF_COVERAGE: PASS (public-only selection, complementarity, dispersion, shared writer, actual draft/match, zero/unpublished cap, locks, stale/late rollback, departure/history/save)');
})();`,{timeout:30000,filename:'staff-coverage-acceptance.fixture.js'});
