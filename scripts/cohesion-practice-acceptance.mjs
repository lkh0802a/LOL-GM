import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
  const check=(x,m)=>{if(!x)throw Error('COHESION_PRACTICE '+m)};
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:10,div2:false}),regionCfg('KR',{teams:10,div2:false})];cfg.internationals=[];
  const db=buildWorld(cfg),t=activeTeams(db,'NA',1)[0],other=activeTeams(db,'KR',1)[0];
  startCareer(db,t.id,'cohesion-practice');autoBuildInitialSquad(db,t,new RNG('cohesion','squad'),5);finalizeInitialRosters(db);
  db.worldDate=addDays(nextDate(db),-10);
  const ids=ROLES.map(r=>starterFor(db,t,r).id);
  for(const id of ids){Object.assign(db.players[id],{teamAdaptation:60,tacticalAdaptation:60,managerTrust:60})}
  const bonds=v=>{for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++)db.playerRelations[playerRelationKey(ids[i],ids[j])]=v};
  db.playerRelations={};bonds(50);t.synergy=50;
  for(let n=0;n<200;n++)recoverTeamCohesion(db,t,ids);
  check(t.synergy===50,'neutral matches generated an unconditional buff');
  bonds(0);const bad=lineupSynergy(db,t,ids);for(let n=0;n<100;n++)recoverTeamCohesion(db,t,ids);
  check(t.synergy<32&&bad<50,'severe conflict did not lower cohesion');
  bonds(100);const good=lineupSynergy(db,t,ids);for(let n=0;n<500;n++)recoverTeamCohesion(db,t,ids);
  check(good>bad&&t.synergy<85&&t.synergy>75,'recovery or upper limit incorrect');
  const opponent=activeTeams(db,'NA',1).find(x=>x.id!==t.id);
  bonds(0);const poorMatch=simulateMatch(db,t.id,opponent.id,'cohesion-causal',null,true);
  bonds(100);const goodMatch=simulateMatch(db,t.id,opponent.id,'cohesion-causal',null,true);
  check(JSON.stringify(poorMatch.goldHist)!==JSON.stringify(goodMatch.goldHist),'same-seed actual match ignored relations');
  const veteran=t.synergy;for(const id of ids)db.players[id].teamAdaptation=10;
  check(lineupSynergy(db,t,ids)<veteran-7,'new lineup inherited veteran teamwork');
  const p=db.players[ids[0]];ensureSatisfaction(p);bonds(0);
  check(satisfactionIssues(db,p).some(x=>x.code==='teammates'),'conflict absent from satisfaction');
  const beforeRenew=renewalDisposition(p);for(let n=0;n<40;n++)applySatisfaction(db,p);
  check(renewalDisposition(p)<beforeRenew,'conflict did not affect renewal motivation');
  // Only real games spend scrim capacity. Unused capacity never becomes
  // fabricated daily training, coaching mastery or role-conversion progress.
  consumeScrimPractice(db,t,3);
  check(practiceDay(db,t).remaining===70,'scrim time was not charged');
  const base=JSON.parse(JSON.stringify(db));
  runDailyPractice(db);
  check(t.practiceDay.drills===0&&t.practiceDay.scrim===30&&
    t.practiceDay.remaining===0,'unused capacity was minted as drills');
  const once=JSON.stringify(db);runDailyPractice(db);
  check(JSON.stringify(db)===once,'daily closure replayed');
  let blocked=false;try{consumeScrimPractice(db,t,1)}catch{blocked=true}
  check(blocked,'scrim accepted after daily cutoff');
  const restored=unpackDB(packDB(db));
  check(JSON.stringify(restored.teams[t.id].practiceDay)===JSON.stringify(t.practiceDay),
    'real scrim resource ledger lost on load');
  const snapshot=JSON.stringify(restored);
  runDailyPractice(restored);
  check(JSON.stringify(restored)===snapshot,'reload generated artificial practice');
  const learningWorld=()=>{
    const w=unpackDB(packDB(base)),club=w.teams[t.id];
    club.staffRoster=[];delete club.practiceDay;club.scrimLog=[];
    w.manager.teamId=t.id;w.players[p.id].medicalPlan='normal';return w;
  };
  const coached=learningWorld(),plain=learningWorld(),wrong=learningWorld();
  const specialist={id:'LEARNING_COACH',role:positionCoachRole(p.role),rating:99,age:35,
    specialties:{},department:'coach',publicEstimate:80};
  coached.teams[t.id].staffRoster=[JSON.parse(JSON.stringify(specialist))];
  initializeStaffContract(coached,coached.teams[t.id],coached.teams[t.id].staffRoster[0]);
  wrong.teams[t.id].staffRoster=[{...specialist,
    role:positionCoachRole(ROLES.find(r=>r!==p.role))}];
  const cp=coached.players[p.id],np=plain.players[p.id],wp=wrong.players[p.id];
  const learnChamp=Object.keys(cp.pool).sort((x,y)=>cp.pool[y].mastery-cp.pool[x].mastery)[0];
  for(const w of [coached,plain,wrong])runDailyPractice(w);
  check(!cp.pool[learnChamp].coachingMastery&&
    !np.pool[learnChamp].coachingMastery,'unused day generated coached champion training');
  practiceChampion(coached,cp,learnChamp,'scrim',2);
  practiceChampion(plain,np,learnChamp,'scrim',2);
  practiceChampion(wrong,wp,learnChamp,'scrim',2);
  check(cp.pool[learnChamp].coachingMastery>np.pool[learnChamp].coachingMastery&&
    cp.pool[learnChamp].coachingMastery>wp.pool[learnChamp].coachingMastery,
    'position-specific coaching did not help actual scrim play');
  const earned=cp.pool[learnChamp].coachingMastery;
  check(commitWorldAction(coached,{type:'staff.release',actor:'manager',
    teamId:t.id,sid:specialist.id}).ok,'staff release failed');
  check(cp.pool[learnChamp].coachingMastery===earned,'release erased earned learning');
  const stored=unpackDB(packDB(coached));
  check(stored.players[p.id].pool[learnChamp].coachingMastery===earned,
    'save lost actual scrim coaching');
  const freeCoach=coached.staffPool.find(x=>x.id===specialist.id);
  check(commitWorldAction(coached,{type:'staff.sign',actor:'manager',teamId:t.id,
    sid:freeCoach.id,years:2,
    salary:staffAskingSalary(coached,coached.teams[t.id],freeCoach)}).ok,
    'coach rehire failed');
  check(cp.pool[learnChamp].coachingMastery===earned,'rehire backfilled earlier scrims');
  const rested=learningWorld();rested.players[p.id].medicalPlan='rest';
  runDailyPractice(rested);
  check(!rested.players[p.id].pool[learnChamp].coachingMastery,
    'rest day minted coached practice');
  let invalidAmount=false;
  try{practiceChampion(rested,rested.players[p.id],learnChamp,'scrim',Infinity)}
  catch{invalidAmount=true}
  check(invalidAmount,'infinite scrim practice accepted');
  check(!scrimPartnerAssessment(db,t,other).allowed,'remote club bypassed travel');
  const eventId='COHESION_TEST';db.competitions[eventId]={id:eventId,international:true,teams:[t.id,other.id],venueRegion:'KR',timeZone:'Asia/Seoul'};
  db.world.seasons[eventId]={id:eventId,comp:eventId,days:[{date:addDays(db.worldDate,4),matches:[]},{date:addDays(db.worldDate,10),matches:[]}]};
  check(scrimPartnerAssessment(db,t,other).allowed&&scrimTimeOverlap(db,t,other,db.worldDate,'afternoon'),'international visit did not open local scrims');
  const clubs=activeTeams(db),schedule=scrimScheduleContext(db,clubs);
  for(const club of clubs){
    check(JSON.stringify(schedule.venues[club.id])===JSON.stringify(teamPracticeVenue(db,club)),'batched venue differs from direct venue');
    for(const slot of ['afternoon','evening'])check(JSON.stringify(scrimTimeOverlap(db,t,club,db.worldDate,slot,schedule))===JSON.stringify(scrimTimeOverlap(db,t,club,db.worldDate,slot)),'cached slot changes real time overlap');
  }
  const clock=venueToUtc;let clockCalls=0;
  venueToUtc=(...args)=>{clockCalls++;return clock(...args)};
  const cached=scrimScheduleContext(db,clubs),cachedCalls=clockCalls;
  for(const club of clubs)for(const slot of ['afternoon','evening'])scrimTimeOverlap(db,t,club,db.worldDate,slot,cached);
  check(clockCalls===cachedCalls,'batch repeated clock conversions for each candidate');
  clockCalls=0;for(const club of clubs)for(const slot of ['afternoon','evening'])scrimTimeOverlap(db,t,club,db.worldDate,slot);
  check(cachedCalls*5<clockCalls,'clock conversion work was not meaningfully reduced');venueToUtc=clock;
  db.worldDate=addDays(db.worldDate,12);check(!scrimPartnerAssessment(db,t,other).allowed,'foreign practice visit never ended');
  check(!scrimPartnerAssessment(db,t,other,null,null,null,schedule).allowed,'expired batch context ignored a venue change');
  // Role changes progress from appearances in the target role, not a
  // synthetic daily drill. Medical rest cannot generate an appearance.
  const fresh=unpackDB(packDB(base)),light=unpackDB(packDB(base));
  for(const world of [fresh,light]){
    world.manager.teamId=t.id;
    delete world.teams[t.id].practiceDay;
    world.teams[t.id].scrimLog=[];
    world.players[p.id].medicalPlan='normal';
    world.players[p.id].roleConversion={fromRole:p.role,
      targetRole:ROLES.find(r=>r!==p.role),progress:0,trainingDays:0,
      officialGames:0,scrimGames:0};
  }
  consumeScrimPractice(light,light.teams[t.id],6);
  runDailyPractice(fresh);runDailyPractice(light);
  const fp=fresh.players[p.id],lp=light.players[p.id];
  check(fp.roleConversion.trainingDays===0&&lp.roleConversion.trainingDays===0&&
    fp.roleConversion.progress===0&&lp.roleConversion.progress===0,
    'daily scrim capacity fabricated role adaptation');
  recordRoleConversionUsage(fresh,[{pid:fp.id,role:fp.roleConversion.targetRole}],'scrim');
  check(fp.roleConversion.scrimGames===1&&fp.roleConversion.progress>0,
    'actual role appearance failed to progress conversion');
  check(lp.roleConversion.progress===0,
    'unplayed match increased role conversion');
  const convertSave=unpackDB(packDB(fresh));
  check(convertSave.players[p.id].roleConversion.progress===fp.roleConversion.progress,
    'role conversion progress did not survive save');
  const originalProgress=fp.roleConversion.progress;
  fresh.worldDate=addDays(fresh.worldDate,1);fp.medicalPlan='rest';
  runDailyPractice(fresh);
  check(fp.roleConversion.progress===originalProgress,
    'rest day generated artificial role conversion');
  console.log('COHESION_PRACTICE_ACCEPTANCE: PASS (relations, real scrim resources, coaching, role appearances, save, travel)');
})();`);
