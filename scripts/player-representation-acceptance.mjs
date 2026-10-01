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
  console.log('PLAYER_REPRESENTATION_ACCEPTANCE '+JSON.stringify({
    agentIdentity:true,ordinarySelf:true,actualDemandsRounds:true,clientConsentPolicy:true,
    oralAuthority:true,pureStaleRollback:true,repeatProtected:true,trust:true,
    aiProduction:true,saveLegacy:true,uiConfirmCancel:true}));
})();`,{filename:'player-representation.fixture.js',setupSources:[await artifactSource('ui-player-commitments.js')]});
