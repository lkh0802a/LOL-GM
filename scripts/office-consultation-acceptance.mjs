import {runEngineFixture,artifactSource} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
  const check=(ok,msg)=>{if(!ok)throw Error('OFFICE_CONSULTATION '+msg)};
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:6,div2:false,playoffBo:3})];cfg.internationals=[];
  const db=buildWorld(cfg),clubs=activeTeams(db,null,1),t=clubs[0],R=db.regions[t.region];
  db.world={phase:'season',year:db.year,manage:'manual',seasons:{}};setManagedTeam(db,t.id);
  const cmd={type:'office.opinion',actor:'manager',teamId:t.id,values:{playoffBo:5,splits:2}},
    before=JSON.stringify(db),quote=previewWorldAction(db,cmd);
  check(quote.ok&&JSON.stringify(db)===before,'preview was not pure');
  check(!previewWorldAction(db,{...cmd,actor:'ai'}).ok&&!previewWorldAction(db,{...cmd,teamId:clubs[1].id}).ok,
    'human club decision authority bypassed');
  check(!previewWorldAction(db,{...cmd,values:{salaryCap:100}}).ok&&!previewWorldAction(db,{...cmd,values:{playoffBo:7}}).ok,
    'opinion changed a regulation or accepted unsupported value');
  const scope=worldActionScopeErrors;worldActionScopeErrors=()=>['late opinion failure'];
  check(!applyWorldAction(db,quote).ok&&JSON.stringify(db)===before,'new preference failed rollback');worldActionScopeErrors=scope;
  check(applyWorldAction(db,quote).ok&&R.playoffBo===3,'opinion directly changed rules');
  const ref=t.officePreferences,overwrite=previewWorldAction(db,{...cmd,values:{playoffBo:3}}),written=JSON.stringify(db);
  worldActionScopeErrors=()=>['late preference overwrite'];
  check(!applyWorldAction(db,overwrite).ok&&JSON.stringify(db)===written&&t.officePreferences===ref,
    'rollback lost original preference object');worldActionScopeErrors=scope;
  db.world.year++;
  check(!applyWorldAction(db,overwrite).ok&&!Object.keys(clubFormatPreferences(db,t)).length,'expired year reused opinion');db.world.year--;
  const saved=unpackDB(packDB(db));check(clubFormatPreferences(saved,saved.teams[t.id]).playoffBo===5,'save lost current opinion');
  const originalRegion=t.region;t.region='elsewhere';check(!Object.keys(clubFormatPreferences(db,t)).length,'regional move carried old ballot');t.region=originalRegion;
  t.parent=clubs[1].id;check(!previewWorldAction(db,cmd).ok,'reserve spoke for parent club');delete t.parent;
  delete t.officePreferences;
  for(const c of clubs){c.fans=70;c.finance.cash=10;}
  const consultation=officeFormatConsultation(db,R,'playoffBo',3,5),pure=JSON.stringify(db);
  check(consultation.support===5&&consultation.abstain===1&&consultation.votes.find(v=>v.teamId===t.id).source==='abstain',
    'AI filled human opinion or double counted reserve');
  officeFormatConsultation(db,R,'splits',2,3);check(JSON.stringify(db)===pure,'vote calculation mutated world');
  // The office may adopt a close proposal or reject an overwhelmingly unwanted
  // one, while cooldowns and the original utility threshold remain in force.
  const base=packDB(db),decide=opposition=>{
    const w=unpackDB(base),r=w.regions[R.id];r.office='conservative';r.playoffBo=3;
    r.metrics=[{hype:61.8,balance:.8}];
    r.decisions=['expand','contract','system','div2','cap','floor','tax','import','splits','standingsMode','playoffs','format']
      .map(key=>({year:w.world.year,key}));
    for(const c of activeTeams(w,r.id,1))c.officePreferences={year:w.world.year,region:r.id,values:{playoffBo:opposition?3:5}};
    const rng=new RNG('office-actual');rng.normal=()=>0;officeDecisions(w,rng,1,()=>{});
    return {w,r};
  },yes=decide(false),no=decide(true);
  check(yes.r.playoffBo===5&&no.r.playoffBo===3,'advisory evidence did not affect actual close office choice');
  const d=yes.r.decisions.at(-1);
  check(d.consultation.support===6&&d.effectiveYear===db.world.year+1&&Math.abs(d.consultation.adjustment)<=.12,
    'adoption lost bounded consultation or effective season');
  const during=JSON.stringify(no.r);officeDecisions(no.w,new RNG('mid-office'),1,()=>{},true);
  check(JSON.stringify(no.r)===during,'opinion enabled a mid-season format change');
  const once=JSON.stringify(d),boCount=yes.r.decisions.filter(v=>v.key.startsWith('bo')).length;
  officeDecisions(yes.w,new RNG('repeat-office'),1,()=>{});
  check(yes.r.playoffBo===5&&yes.r.decisions.filter(v=>v.key.startsWith('bo')).length===boCount&&JSON.stringify(d)===once,
    'consultation bypassed format cooldown or rewrote prior evidence');
  globalThis.DB=db;globalThis.esc=x=>String(x);globalThis.MSG='';let saves=0;
  globalThis.saveDB=()=>saves++;globalThis.navKeepScroll=()=>{};
  const button={dataset:{officeOpinion:t.id}},select={value:'5',dataset:{officeField:'playoffBo'}};
  globalThis.document={querySelectorAll:selector=>selector==='[data-office-opinion]'?[button]:[select]};
  globalThis.confirm=()=>false;bindOfficeOpinionControls();const cancelled=JSON.stringify(db);button.onclick();
  check(JSON.stringify(db)===cancelled&&saves===0,'UI cancellation submitted opinion');
  globalThis.confirm=()=>true;button.onclick();
  check(saves===1&&clubFormatPreferences(db,t).playoffBo===5&&officeOpinionPanel(R).includes('의견 제출'),
    'UI confirmation failed shared guarded submit');
  console.log('OFFICE_CONSULTATION_ACCEPTANCE pure / authority / saved annual regional opinions / rollback / AI context / bounded actual adoption / cooldown / UI');
})()`,{setupSources:[await artifactSource('ui-office-consultation.js')]});
