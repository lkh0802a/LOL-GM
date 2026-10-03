import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const check=(ok,msg)=>{if(!ok)throw Error('MANUAL_OWNED_COACHING '+msg)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('KR',{teams:8,div2:true,splits:1,legs:1,regularBo:1,playoffBo:1,playoffTake:4})];cfg.internationals=[];cfg.changes='none';
 const db=buildWorld(cfg),parent=activeTeams(db,'KR',1)[0],reserve=reserveTeamsOf(db,parent)[0],rival=activeTeams(db,'KR',1)[1];
 startCareer(db,reserve.id,'owned-coach-fixture');finalizeInitialRosters(db);setManagedTeam(db,parent.id);
 for(const t of [parent,reserve]){t.training={...normalizeTraining(t.training),intensity:'light',focus:'champions'};for(const pid of t.roster){db.players[pid].age=22;db.players[pid].contract.until=db.year+3}}
 rival.training={...normalizeTraining(rival.training),intensity:'light',focus:'champions'};
 const coaching=t=>JSON.stringify({training:t.training,starters:t.depthChart,roles:t.roster.map(pid=>[pid,db.players[pid].rosterRole]),decision:t.practiceDecision});
 const controlled=[coaching(parent),coaching(reserve)],date=addDays(db.worldDate,1),saved=packDB(db),clone=unpackDB(saved);
 check(applyWorldDailyEffects(db,date),'actual daily route did not run');applyWorldDailyEffects(clone,date);
 check(coaching(parent)===controlled[0]&&coaching(reserve)===controlled[1],'daily effects replaced controlled coaching');
 check(reserve.practiceDay.focus==='champions'&&parent.practiceDay.focus==='champions','daily practice used an AI override');
 check(rival.practiceDecision?.date===date&&rival.training.focus!=='champions','opponent daily AI stopped');
 check(JSON.stringify({training:reserve.training,practice:reserve.practiceDay,usage:reserve.practiceUsage})===JSON.stringify({training:clone.teams[reserve.id].training,practice:clone.teams[reserve.id].practiceDay,usage:clone.teams[reserve.id].practiceUsage}),'save resume changed seeded daily outcomes');
 const once=JSON.stringify(db);check(!applyWorldDailyEffects(db,date)&&JSON.stringify(db)===once,'same day repeated coaching or practice');
 // Controlled sports review guards must be pure, including direct AI proposals.
 for(const t of [parent,reserve]){
   const before=JSON.stringify(db);aiManageTraining(db,t);aiReviewDepthChart(db,t);rebalanceAiRosterRoles(db,t);aiReviewRoleConversions(db,t);
   const p=db.players[t.roster[0]],target=ROLES.find(r=>r!==p.role);
   check(!proposeRoleConversion(db,p.id,target,'ai').ok,'AI proposal bypassed controlled coaching');
   check(JSON.stringify(db)===before,'blocked sports review changed state/history');
 }
 const opponent=db.players[rival.roster[0]],proposalBefore=opponent.roleProposalCount||0;
 const proposal=proposeRoleConversion(db,opponent.id,ROLES.find(r=>r!==opponent.role),'ai');
 check(proposal.ok&&(opponent.roleProposalCount||0)>proposalBefore,'opponent AI conversion stopped');
 // Actual competition writers reach a real completed offseason; no fabricated results.
 let dates=0,matches=0;
 while(db.world.phase==='season'&&dates++<120){
   const next=nextDate(db);if(!next){advanceStep(db);continue}setWorldCalendarDate(db,next);
   for(const s of activeSeasons(db).filter(s=>s.days[s.cur].date===next)){
     const result=playDay(db,s);matches+=result.day.matches.filter(m=>!!m.res).length;
   }
   if(!activeSeasons(db).length)advanceStep(db);
 }
 check(db.world.phase==='offseason'&&matches>0&&Object.values(db.world.seasons).every(s=>s.done&&s.champion),'bounded real competition did not reach offseason');
 const trainingBefore=JSON.stringify([parent.training,reserve.training]);runOffseason(db);
 check(db.world.phase==='market'&&JSON.stringify([parent.training,reserve.training])===trainingBefore,'offseason training replaced manual choice');
 // Choose a valid deliberate off-role arrangement that AI would normally reconsider.
 for(const t of [parent,reserve]){
   initializeDepthChart(db,t,false);const ids=ROLES.map(r=>t.depthChart[r]);t.depthChart=Object.fromEntries(ROLES.map((r,i)=>[r,ids[(i+1)%5]]));
   for(const pid of t.roster)setRosterRole(db,pid,'prospect','manager',false);
   check(validateStartingLineup(db,t).ok,'manual rotated lineup not legal');
 }
 const beforeClose=[parent,reserve].map(t=>({chart:{...t.depthChart},training:JSON.stringify(t.training),roles:Object.fromEntries(t.roster.map(pid=>[pid,db.players[pid].rosterRole]))}));closeMarket(db);
 check(db.world.phase==='preseason','actual market close did not finish');
 for(const [i,t] of [parent,reserve].entries()){const before=beforeClose[i];check(JSON.stringify(t.depthChart)===JSON.stringify(before.chart)&&JSON.stringify(t.training)===before.training&&t.roster.filter(pid=>before.roles[pid]).every(pid=>db.players[pid].rosterRole===before.roles[pid]),'market close overwrote retained controlled lineup/roles/training')}
 check(!rosterIntegrityErrors(db).length,'market close broke membership');
 // A reserve-only coach retains sports decisions while the AI parent owns movement.
 const coach=unpackDB(packDB(db));setManagedTeam(coach,reserve.id);
 const a=coach.teams[parent.id],b=coach.teams[reserve.id];
 initializeDepthChart(coach,a,false);initializeDepthChart(coach,b,false);
 for(const t of [a,b])for(const pid of t.roster){const p=coach.players[pid];p.contract.until=coach.year+2;p.medical={};p.condition=100;p.fatigue=0}
 const extras=t=>t.roster.filter(pid=>!Object.values(t.depthChart).includes(pid));
 for(const t of [a,b])if(!extras(t).length){const p=genPlayer(coach,new RNG('coach-extra-'+t.id),{region:t.region,role:'MID',age:22,base:65});signContract(coach,p,t,1,3)}
 const up=extras(b)[0],down=extras(a)[0],plan=rosterPlanState(coach,a),chart={...b.depthChart};plan.assignments[up]=a.id;plan.assignments[down]=b.id;
 const preview=previewWorldAction(coach,{type:'roster.plan',actor:'ai',parentId:a.id,assignments:plan.assignments});check(preview.ok,'AI parent movement forbidden for reserve-only coach');
 const originalInit=initializeDepthChart,beforeMove=JSON.stringify(coach);
 initializeDepthChart=(...args)=>{const out=originalInit(...args);if(args[1].id===b.id)throw Error('injected controlled repair failure');return out};
 const failed=applyWorldAction(coach,preview);initializeDepthChart=originalInit;
 check(!failed.ok&&JSON.stringify(coach)===beforeMove,'late move failure did not restore roster/coaching/history/cache');
 const applied=applyWorldAction(coach,preview);check(applied.ok&&coach.players[up].team===a.id&&coach.players[down].team===b.id,'AI parent economic movement stopped');
 check(JSON.stringify(b.depthChart)===JSON.stringify(chart),'unaffected manual starters reset by AI parent move');
 // Removing a chosen starter repairs that slot while locking surviving legal choices.
 const picked=b.depthChart.MID,back=down;const replacement=rosterPlanState(coach,a);replacement.assignments[picked]=a.id;replacement.assignments[up]=b.id;
 const moved=commitWorldAction(coach,{type:'roster.plan',actor:'ai',parentId:a.id,assignments:replacement.assignments});
 check(moved.ok&&validateStartingLineup(coach,b).ok&&b.depthChart.MID!==picked,'departed starter slot was not repaired');
 for(const role of ROLES.filter(r=>r!=='MID'))check(b.depthChart[role]===chart[role],'repair replaced surviving manual slot '+role);
 const training=JSON.stringify(b.training),roleMap=JSON.stringify(b.roster.map(pid=>[pid,coach.players[pid].rosterRole]));
 aiManageTraining(coach,b);rebalanceAiRosterRoles(coach,b);aiReviewDepthChart(coach,b);
 check(JSON.stringify(b.training)===training&&JSON.stringify(b.roster.map(pid=>[pid,coach.players[pid].rosterRole]))===roleMap,'reserve-only sports choices overwritten');
 a.training={...normalizeTraining(a.training),focus:'champions'};aiManageTraining(coach,a);check(a.practiceDecision?.date===coach.worldDate,'AI parent coaching stopped');
 const restored=unpackDB(packDB(coach));check(managerControlsSquad(restored,reserve.id)&&!managerControlsSquad(restored,parent.id)&&JSON.stringify(restored.teams[reserve.id].depthChart)===JSON.stringify(b.depthChart),'save authority/lineup changed');
 console.log('MANUAL_OWNED_COACHING_ACCEPTANCE PASS real daily focus+practice/idempotence/seeded resume, pure owned training/lineup/roles/conversion guards + opponent AI, '+matches+' real official matches to offseason and actual market close, AI parent economic movement/late rollback/manual survivor locking/departed-slot repair, reserve-only parent AI and save');
})();`,{timeout:60000});
