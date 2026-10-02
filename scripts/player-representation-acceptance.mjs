import {runEngineFixture,artifactSource} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
  const check=(ok,msg)=>{if(!ok)throw Error('PLAYER_REPRESENTATION '+msg)};
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:3,div2:false})];
  cfg.internationals=[];
  const db=buildWorld(cfg),[team,other]=activeTeams(db),
    [p,ordinary]=Object.values(db.players).filter(p=>!p.team&&!p.retired);
  setManagedTeam(db,team.id);db.world={phase:'offseason',manage:'manual',year:db.year,seed:'representatives'};
  p.reputation=90;p.personality={professionalism:50,ambition:90};
  delete p.agent;ordinary.reputation=60;delete ordinary.agent;
  check(!ensurePlayerAgent(ordinary),'ordinary player acquired a fictional celebrity agent');
  signContract(db,p,team,asking(db,p,team.region)*2,1,{promisedRole:'backup'});
  const agent=playerAgent(p),id=agent.id;
  check(agent.clientId===p.id&&id===ensurePlayerAgent(p).id,'representative identity changed');
  const directRounds=negotiationRoundLimit({...p,agent:null}),
    originalPersonality=JSON.stringify(p.personality);
  agent.profile={professionalism:99,ambition:20};
  check(negotiationRoundLimit(p)>directRounds&&JSON.stringify(p.personality)===originalPersonality,
    'agent discretion did not affect rounds or overwrote client personality');
  const represented=negotiationDemand(db,p,team,'renewal',new RNG('agent-demand')),
    self=negotiationDemand(db,{...p,agent:null},team,'renewal',new RNG('agent-demand'));
  check(represented.salary<self.salary,'agent profile never changed actual demands');
  const started=startNegotiation(db,p.id,'renewal');
  check(started.ok&&started.neg.representative.id===id&&
    started.neg.maxRounds===negotiationRoundLimit(p),'real negotiation missed its representative');
  const command={type:'player.promise',pid:p.id,teamId:team.id,role:'starter',actor:'manager'},
    before=JSON.stringify(db),preview=previewWorldAction(db,command);
  check(preview.ok&&JSON.stringify(db)===before,'oral promise preview mutated world');
  check(!commitWorldAction(db,{...command,actor:'ai'}).ok&&
    !commitWorldAction(db,{...command,actor:'system'}).ok,'AI/system created a managed strategic promise');
  const original=worldActionScopeErrors;worldActionScopeErrors=()=>['late promise failure'];
  const failed=applyWorldAction(db,preview);worldActionScopeErrors=original;
  check(!failed.ok&&JSON.stringify(db)===before,'oral promise/event failed atomic rollback');
  usageFor(p,db.year).teamGames=1;
  check(!applyWorldAction(db,preview).ok,'changed usage accepted a stale promise');
  delete p.usage;
  check(commitWorldAction(db,command).ok&&p.contract.promisedRole==='backup'&&
    effectiveRolePromiseStatus(db,p).role==='starter','oral promise rewrote contract or was ignored');
  const active=JSON.stringify(db);
  check(!commitWorldAction(db,command).ok&&JSON.stringify(db)===active,
    'repeat promise reset the evidence window');
  p.usage={year:db.year,teamGames:24,games:0,series:6,teamWins:12};
  const trust=p.managerTrust;applySatisfaction(db,p);
  check(p.satisfactionReasons.includes('playing_time')&&p.managerTrust<trust,
    'oral commitment did not affect real usage/trust');
  const saved=unpackDB(packDB(db));
  check(playerAgent(saved.players[p.id]).id===id&&
    oralRolePromiseStatus(saved,saved.players[p.id]).teamGames===24,
    'agent/promise lost during save restore');
  signContract(db,p,team,p.contract.salary,1,{promisedRole:'backup'});
  check(!p.rolePromise&&p.careerEvents.some(e=>e.type==='role_promise_closed'),
    'new negotiated contract silently retained prior oral agreement');
  // An owned reserve coach may make sporting commitments for their own squad.
  team.parent=other.id;
  check(previewWorldAction(db,command).ok,'owned reserve coach lost sporting promise authority');
  check(!previewWorldAction(db,{...command,teamId:other.id}).ok,'reserve coach promised another squad role');
  // Actual AI role balancing makes a commitment before an earned promotion.
  delete team.parent;setManagedTeam(db,other.id);team.depthChart={[p.role]:p.id};
  rebalanceAiRosterRoles(db,team);
  check(p.rolePromise&&p.rolePromise.issuer==='ai','production AI role balancing skipped commitments');
  closeOralRolePromise(db,p,'fixture');setRosterRole(db,p,'backup','manager',true);
  setManagedTeam(db,team.id);
  globalThis.DB=db;globalThis.esc=x=>String(x);globalThis.MSG='';
  let savedUi=0,refreshed=0;globalThis.saveDB=()=>savedUi++;globalThis.navKeepScroll=()=>refreshed++;
  const button={dataset:{promisePreview:p.id}},select={value:'starter'};
  globalThis.document={querySelectorAll:()=>[button],querySelector:()=>select};
  globalThis.confirm=()=>false;bindRolePromiseControls();
  const cancelBefore=JSON.stringify(db);button.onclick({stopPropagation(){}});
  check(JSON.stringify(db)===cancelBefore&&savedUi===0,'cancelled UI committed or saved promise');
  globalThis.confirm=()=>true;button.onclick({stopPropagation(){}});
  check(p.rolePromise&&savedUi===1&&refreshed===1,'real confirm button failed to commit/save');
  check(playerCommitmentsPanel(p).includes('구두 약속')&&
    !playerCommitmentsPanel(p).includes('data-promise-preview'),
    'panel hid actual commitment or offered a reset');
  const revise={type:'player.promise-revise',pid:p.id,teamId:team.id,role:'competition',actor:'manager'};
  p.contract.salary=asking(db,p,team.region)*3;
  p.satisfaction=85;p.managerTrust=85;p.managerRelationship=85;p.wantsOut=false;
  p.usage={year:db.year,teamGames:48,games:2,unavailableTeamGames:1};
  const beforeRevision=JSON.stringify(db),revision=previewWorldAction(db,revise);
  check(revision.ok&&JSON.stringify(db)===beforeRevision,'revision preview mutated consent or usage');
  check(!previewWorldAction(db,{...revise,role:'starter'}).ok&&
    !previewWorldAction(db,{...revise,actor:'ai'}).ok&&
    !previewWorldAction(db,{...revise,actor:'system'}).ok,'same-role reset or authority bypass accepted');
  p.contract.promisedRole='starter';
  check(!previewWorldAction(db,revise).ok,'oral revision erased signed role rights');
  p.contract.promisedRole='backup';
  const salary=p.contract.salary;p.contract.salary=.1;
  const refused=JSON.stringify(db);
  check(!commitWorldAction(db,revise).ok&&JSON.stringify(db)===refused,'unwilling player forced into reduced role');
  p.contract.salary=salary;
  p.managerTrust--;
  check(!applyWorldAction(db,revision).ok,'changed willingness accepted stale consent');p.managerTrust++;
  const originalScope=worldActionScopeErrors,pRef=p,rollback=JSON.stringify(db);
  worldActionScopeErrors=()=>['late revision failure'];
  check(!applyWorldAction(db,revision).ok&&JSON.stringify(db)===rollback&&db.players[p.id]===pRef,
    'late revision failed player/event rollback');worldActionScopeErrors=originalScope;
  const trustBefore=p.managerTrust,contractBefore=JSON.stringify(p.contract);
  check(applyWorldAction(db,revision).ok&&p.rolePromise.role==='competition'&&
    p.managerTrust===trustBefore&&JSON.stringify(p.contract)===contractBefore,
    'consensual revision changed contract or reset trust');
  const event=p.careerEvents.at(-1);
  check(event.type==='role_promise_revised'&&event.from==='starter'&&event.prior.teamGames===23&&
    event.prior.games===2&&event.consent.willing&&oralRolePromiseStatus(db,p).teamGames===0,
    'revision erased old evidence or applied lower expectation retrospectively');
  check(unpackDB(packDB(db)).players[p.id].careerEvents.at(-1).prior.teamGames===23,
    'save lost revised promise evidence');
  const reviseButton={dataset:{promiseRevise:p.id}};select.value='backup';
  globalThis.document.querySelectorAll=()=>[reviseButton];
  globalThis.confirm=()=>false;bindRolePromiseControls();
  const cancelled=JSON.stringify(db);reviseButton.onclick({stopPropagation(){}});
  check(JSON.stringify(db)===cancelled&&savedUi===1,'cancelled revision committed');
  globalThis.confirm=()=>true;reviseButton.onclick({stopPropagation(){}});
  check(p.rolePromise.role==='backup'&&savedUi===2&&!previewWorldAction(db,{...revise,role:'backup'}).ok,
    'revision confirm/save or repeated-reset protection failed');
  setManagedTeam(db,other.id);p.rolePromise.role='starter';
  check(previewWorldAction(db,{...revise,actor:'ai'}).ok,'AI used different consent policy');
  ordinary.role=p.role;for(const key of Object.keys(ordinary.attrs))ordinary.attrs[key]=99;
  for(const key of Object.keys(p.attrs))p.attrs[key]=30;
  signContract(db,ordinary,team,asking(db,ordinary,team.region),1,{promisedRole:'starter'});
  team.depthChart={[p.role]:ordinary.id};p.rosterRole='starter';
  rebalanceAiRosterRoles(db,team);
  check(SQUAD_ROLE_ORDER[p.rolePromise.role]<SQUAD_ROLE_ORDER.starter&&
    p.careerEvents.some(e=>e.type==='role_promise_revised'&&e.source==='ai'&&e.consent.willing),
    'production AI failed consensual oral role adjustment after losing its starter place');
  console.log('PLAYER_REPRESENTATION_ACCEPTANCE '+JSON.stringify({
    agentIdentity:true,ordinarySelf:true,actualDemandsRounds:true,clientConsentPolicy:true,
    oralAuthority:true,pureStaleRollback:true,repeatProtected:true,trust:true,
    aiProduction:true,saveLegacy:true,uiConfirmCancel:true,consensualRevision:true,
    signedFloor:true,priorEvidence:true,revisionRefusalStaleRollback:true}));
})();`,{filename:'player-representation.fixture.js',setupSources:[await artifactSource('ui-player-commitments.js')]});
