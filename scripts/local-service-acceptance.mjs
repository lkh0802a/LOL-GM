import {runEngineFixture,artifactSources} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
  const check=(ok,msg)=>{if(!ok)throw Error('LOCAL_SERVICE '+msg)};
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:3,div2:false}),regionCfg('KR',{teams:2,div2:false})];cfg.internationals=[];
  const db=buildWorld(cfg),[a,b]=activeTeams(db,'NA'),[c]=activeTeams(db,'KR'),year=db.year;
  db.regions.NA.localServiceRule={seasons:2,days:20,choiceYears:2,effectiveYear:year};
  db.world={phase:'season',year,manage:'manual',seasons:{}};setWorldCalendarDate(db,year+'-01-10');setManagedTeam(db,a.id);
  const p=genPlayer(db,new RNG('service','fixture'),{region:'KR',role:ROLES[0],age:22,base:60});
  p.personality.ambition=10;p.careerGoal='stability';signContract(db,p,a,2,3,{});
  const service=p.localEligibility.service;check(service.region==='NA'&&service.days===0,'registration did not start real service');
  setWorldCalendarDate(db,year+'-01-20');processLocalServiceDaily(db);check(service.days===10,'registered days not accrued');
  removePlayerFromTeam(db,p);setWorldCalendarDate(db,year+'-02-20');processLocalServiceDaily(db);
  check(service.days===10&&service.paused,'FA invented progress or erased service');
  assignPlayerToTeam(db,p,b);setWorldCalendarDate(db,year+'-03-02');processLocalServiceDaily(db);
  check(service.days===20&&service.seasons.length===1&&!p.localEligibility.qualifications.NA,'same region service failed or qualified too early');
  // Cross-region temporary registration preserves the owner's run but earns neither region.
  removePlayerFromTeam(db,p);p.loan={ownerId:b.id,borrowerId:c.id};assignPlayerToTeam(db,p,c);
  setWorldCalendarDate(db,year+'-04-02');processLocalServiceDaily(db);
  check(service.days===20&&service.region==='NA'&&service.paused,'cross-region loan invented residence');
  removePlayerFromTeam(db,p);delete p.loan;assignPlayerToTeam(db,p,b);
  setWorldCalendarDate(db,year+'-04-12');processLocalServiceDaily(db);check(service.days===30,'return failed to resume preserved run');
  // A rule change cannot rewrite terms already accepted by this service run.
  db.regions.NA.localServiceRule={seasons:9,days:900,choiceYears:1,effectiveYear:year+1};
  db.year=year+1;db.world.year=year+1;setWorldCalendarDate(db,(year+1)+'-01-10');processLocalServiceDaily(db);
  const q=p.localEligibility.qualifications.NA;
  check(q&&q.rule.seasons===2&&q.availableFrom===year+2&&playerActiveLocalRegion(p)==='KR','qualification changed old policy or auto-switched local');
  check(!previewWorldAction(db,{type:'player.local-choice',actor:'manager',pid:p.id,region:'NA'}).ok,'midseason local activation accepted');
  db.world.phase='offseason';setManagedTeam(db,b.id);const cmd={type:'player.local-choice',actor:'manager',pid:p.id,region:'NA'},before=JSON.stringify(db),preview=previewWorldAction(db,cmd);
  check(preview.ok&&JSON.stringify(db)===before,'next-season preview mutated eligibility');
  check(!previewWorldAction(db,{...cmd,actor:'system'}).ok,'system forced player choice');
  check(applyWorldAction(db,preview).ok&&playerActiveLocalRegion(p)==='KR'&&projectedPlayerLocal(db,p)==='NA','choice changed active current-season status');
  const loaded=unpackDB(packDB(db));check(loaded.players[p.id].localEligibility.pending.region==='NA','pending save lost');
  activateLocalChoices(db,year+2);check(playerActiveLocalRegion(p)==='NA'&&!p.localEligibility.pending,'next-season activation missing');
  db.year=year+2;db.world.year=year+1;db.world.phase='offseason';
  check(commitWorldAction(db,{...cmd,region:'KR'}).ok,'origin restoration denied willing player');
  activateLocalChoices(db,year+2);check(playerActiveLocalRegion(p)==='KR'&&!p.localEligibility.qualifications.NA&&service.days===0,'relinquished eligibility did not require fresh service');
  // A permanent regional move starts fresh; legacy saves do not invent prior seasons.
  removePlayerFromTeam(db,p);assignPlayerToTeam(db,p,c);check(p.localEligibility.service.region==='KR'&&p.localEligibility.service.days===0,'permanent regional move kept old progress');
  delete p.localEligibility.service;processLocalServiceDaily(db);check(p.localEligibility.service.days===0&&p.localEligibility.service.seasons.length===1,'legacy history was invented');
  const damaged=JSON.parse(packDB(db));damaged.players[p.id].localEligibility.service.days=-1;let denied=false;
  try{unpackDB(JSON.stringify(damaged))}catch{denied=true}check(denied,'corrupt service accepted');
  // Real player choice confirmation controls preserve cancellation and persist success.
  removePlayerFromTeam(db,p);assignPlayerToTeam(db,p,b);p.localEligibility.qualifications.NA={availableFrom:year+2,expiresAfter:year+3};
  setManagedTeam(db,b.id);globalThis.DB=db;globalThis.esc=String;globalThis.MSG='';let saves=0;
  globalThis.saveDB=()=>saves++;globalThis.navKeepScroll=()=>{};const button={dataset:{localChoice:p.id}};
  globalThis.document={querySelectorAll:()=>[button],querySelector:()=>({value:'NA'})};globalThis.confirm=()=>false;
  bindLocalServiceControls();const cancelled=JSON.stringify(db);button.onclick({stopPropagation(){}});check(JSON.stringify(db)===cancelled&&!saves,'cancel committed choice');
  globalThis.confirm=()=>true;button.onclick({stopPropagation(){}});check(saves===1&&localServicePanel(p).includes('다음'),'confirmed UI choice lost');
  db.world.year=year+4;check(!localChoiceOptions(db,p).includes('NA'),'expired unused entitlement remained selectable');
  console.log('LOCAL_SERVICE_ACCEPTANCE '+JSON.stringify({registration:true,faPause:true,crossLoanPause:true,regionalReset:true,grandfather:true,nextSeasonChoice:true,saveValidation:true,uiConfirmCancel:true,expiry:true}));
})();`,{filename:'local-service.fixture.js',setupSources:await artifactSources(['ui-local-service.js'])});
