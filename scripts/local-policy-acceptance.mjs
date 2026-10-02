import {runEngineFixture,artifactSources} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
  const check=(ok,msg)=>{if(!ok)throw Error('LOCAL_POLICY '+msg)};
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:6,div2:false}),regionCfg('KR',{teams:6,div2:false})];cfg.internationals=[];
  const db=buildWorld(cfg),R=db.regions.NA,year=db.year,t=activeTeams(db,'NA',1)[0];
  db.world={year,phase:'offseason',manage:'manual',seasons:{}};setManagedTeam(db,t.id);
  R.metrics=[{year:year-1,hype:40,balance:.6},{year,hype:40,balance:.6}];
  const local=Object.values(db.players).filter(p=>!p.retired&&!p.team&&isLocalPlayer(p,'NA'));
  local.forEach(p=>p.retired=true);db.global={decisions:[],power:{NA:.8,KR:2}};
  const old=genPlayer(db,new RNG('old-policy'),{region:'KR',role:ROLES[0],age:21,base:60});
  assignPlayerToTeam(db,old,t);localServiceRegistration(db,old,t,true);
  const oldRule=old.localEligibility.service.rule,untouched=JSON.stringify(db),quote=localPolicyAgreement(db,R,year);
  check(JSON.stringify(db)===untouched&&quote.rule.seasons===3&&quote.internationalResponse.result==='accepted','proposal impure or no international agreement');
  let events=[];reviewLocalServiceAgreements(db,db.world,0,x=>events.push(x));check(!R.localServicePending,'disabled policy changed rules');
  reviewLocalServiceAgreements(db,db.world,1,x=>events.push(x));
  check(events.length===1&&R.localServicePending.effectiveYear===year+1&&localServicePolicy(db,'NA').seasons===4,'future rule applied early or notice missing');
  const before=JSON.stringify(R);reviewLocalServiceAgreements(db,db.world,1,()=>{});check(JSON.stringify(R)===before,'repeat review duplicated agreement');
  const interim=genPlayer(db,new RNG('interim-policy'),{region:'KR',role:ROLES[1],age:21,base:60});
  assignPlayerToTeam(db,interim,t);localServiceRegistration(db,interim,t,true);
  check(interim.localEligibility.service.rule.seasons===4,'announced future policy rewrote current entrant');
  db.year=year+1;db.world.year=year+1;setWorldCalendarDate(db,(year+1)+'-01-06');
  const fresh=genPlayer(db,new RNG('new-policy'),{region:'KR',role:ROLES[2],age:21,base:60});
  assignPlayerToTeam(db,fresh,t);localServiceRegistration(db,fresh,t,true);
  processLocalServiceDaily(db);
  check(fresh.localEligibility.service.rule.seasons===3&&old.localEligibility.service.rule===oldRule&&oldRule.seasons===4&&interim.localEligibility.service.rule.seasons===4,'new policy failed grandfathering');
  const restored=unpackDB(packDB(db));check(localServicePolicy(restored,'NA').seasons===3&&restored.players[old.id].localEligibility.service.rule.seasons===4&&restored.regions.NA.localServiceAgreements.length===1,'save lost active policy or old rights');
  const dissolved=unpackDB(packDB(db));delete dissolved.regions.NA;
  check(dissolved.global.localServiceAgreements[0].region==='NA'&&dissolved.global.localServiceAgreements[0].agreement.rule.seasons===3,
    'global archive lost a dissolved region agreement');
  const corrupted=JSON.parse(packDB(db));corrupted.regions.NA.localServicePending.seasons=0;
  let denied=false;try{unpackDB(JSON.stringify(corrupted))}catch{denied=true}check(denied,'corrupt scheduled policy loaded');
  const legacy=JSON.parse(packDB(db));delete legacy.regions.NA.localServicePending;delete legacy.regions.NA.localServiceAgreements;
  check(localServicePolicy(unpackDB(JSON.stringify(legacy)),'NA').seasons===4,'legacy rule was invented');
  // A strong region's regional shortcut is countered by the international office.
  delete R.localServicePending;delete R.localServiceAgreements;R.localServiceRule={seasons:4,days:20,choiceYears:2,effectiveYear:year};db.global.power.NA=2;
  const counter=localPolicyAgreement(db,R,year+4);
  check(counter.regionalProposal.seasons===3&&counter.rule.seasons===4&&counter.rule.days===20&&counter.rule.choiceYears===2&&counter.internationalResponse.result==='counter','joint review erased conditions or bypassed international consent');
  // The actual global-office path owns the review; no user regulation command.
  db.world.year=year+4;db.year=year+5;globalOffice(db,db.world,new RNG('joint-production'),1,()=>{});
  check(R.localServiceAgreements.at(-1).internationalResponse.result==='counter'&&R.localServicePending.effectiveYear===year+5,'production office missed agreed policy');
  globalThis.DB=db;globalThis.esc=String;
  check(officeCard(R).includes('공동 합의')&&officeCard(R).includes('지역 제안 3 → 합의 4'),'office UI hid international counter and effective year');
  for(let i=0;i<20;i++)genPlayer(db,new RNG('policy-local-'+i),{region:'NA',role:ROLES[i%5],age:21,base:90});
  const abundant=localPolicyAgreement(db,R,year+8);
  check(abundant&&abundant.regionalProposal.seasons===5&&abundant.rule.seasons===5,
    'local talent protection proposal missing or overruled without reason');
  console.log('LOCAL_POLICY_ACCEPTANCE pure / agreed-counter / future-effective / cooldown / production office / grandfather / save-legacy / corrupt / UI');
})()`,{setupSources:await artifactSources(['ui-office-consultation.js','ui-season.js'])});
