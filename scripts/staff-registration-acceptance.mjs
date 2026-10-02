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
