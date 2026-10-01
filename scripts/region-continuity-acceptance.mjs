import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
  const check=(x,m)=>{if(!x)throw Error('REGION_CONTINUITY '+m)};
  const cfg=defaultWorldConfig();cfg.regions=['VN','JP','OC','TR','ME'].map(id=>regionCfg(id,{teams:10,div2:true,system:'franchise'}));cfg.internationals=[];
  const db=buildWorld(cfg);
  db.world={year:db.year,phase:'offseason',seed:'region-merger',seasons:{}};
  for(const r of Object.values(db.regions)){r.tier='emerging';r.parent=null;r.metrics=[{hype:20},{hype:20}]}
  db.worldHype=100;
  const low=Object.values(db.regions).sort((a,b)=>a.strength-b.strength),[a,b]=low,
    host=a.strength>=b.strength?a:b,gone=host===a?b:a;
  const parent=activeTeams(db,gone.id,1)[0],reserve=reserveTeamsOf(db,parent)[0];
  check(reserve,'missing owned reserve fixture');
  const p=Object.values(db.players).find(p=>!p.retired&&!p.team);signContract(db,p,reserve,1,3);
  const protectedState=()=>JSON.stringify({club:parent.id,reserve:reserve.id,parent:reserve.parent,division:reserve.division,
    roster:reserve.roster,staff:reserve.staff,contract:p.contract,finance:reserve.finance,history:db.history});
  const before=protectedState(),rng=new RNG('region-merger','office');rng.chance=p=>p===.4;
  worldDecisions(db,rng,1,()=>{});
  check(!db.regions[gone.id]&&parent.region===host.id&&reserve.region===host.id,'production merger did not move organization');
  check(reserve.parent===parent.id&&reserve.division===2&&host.div2,'reserve became independent first team');
  check(protectedState()===before,'merger changed employment, financial or historical continuity');
  check(reserve.regionHistory.at(-1).continuity==='same-club'&&db.global.regionHistory.at(-1).source===gone.id,'succession evidence missing');
  const saved=unpackDB(packDB(db));check(saved.teams[reserve.id].parent===parent.id&&saved.global.regionHistory.at(-1).source===gone.id,'save lost successor chain');
  const target=Object.values(db.regions).find(r=>r.id!==host.id);target.div2=false;
  moveClubForRegionReorganization(db,parent,target.id,'regional-independence');
  recordRegionSuccession(db,host.id,[host.id,target.id],'regional-independence');
  check(reserve.region===target.id&&target.div2&&reserve.parent===parent.id,'split lost owned reserve');
  check(!(host.predecessors||[]).includes(host.id),'split created self-predecessor');
  const snap=JSON.stringify(parent);let rejected=false;
  try{moveClubForRegionReorganization(db,parent,'missing','test')}catch{rejected=true}
  check(rejected&&JSON.stringify(parent)===snap,'invalid destination partly moved club');
  // A five-player official squad must retain its current contracts' local
  // protection, without turning that exception into a transferable local.
  const c2=defaultWorldConfig();c2.regions=['KR','EU','NA'].map(id=>regionCfg(id,{teams:10,div2:false}));c2.internationals=[];
  const d=buildWorld(c2),club=activeTeams(d,'KR',1)[0],other=activeTeams(d,'EU',1)[0];
  d.world={year:d.year,phase:'offseason',seed:'successor-local',seasons:{},registrationVersion:1};
  setManagedTeam(d,club.id);
  for(const role of ROLES){const q=Object.values(d.players).find(x=>!x.team&&!x.retired&&x.role===role&&playerActiveLocalRegion(x)==='KR');signContract(d,q,club,3,2);}
  const player=d.players[club.roster[0]],contract={...player.contract};
  player.localEligibility.service={region:'KR',days:300,seasons:[2026,2027],lastDate:d.worldDate,paused:false,rule:{seasons:4,days:365,choiceYears:2,effectiveYear:2026}};
  moveClubForRegionReorganization(d,club,'EU','split');recordRegionSuccession(d,'KR',['KR','EU'],'split');
  check(teamNonLocalCount(d,club)===0&&!officialRegistrationErrors(d,club,club.roster).length,'legacy squad exceeds official import cap');
  check(!isLocalPlayer(player,'EU',other.id)&&!isLocalPlayer(player,'EU'),'legacy exception became portable eligibility');
  const employment=player.team;player.loan={ownerId:club.id,borrowerId:other.id};player.team=other.id;
  check(isLocalPlayer(player,'EU',club.id)&&!isLocalPlayer(player,'EU',other.id),'loan exported contract exception');
  delete player.loan;player.team=employment;
  check(player.localEligibility.service.days===300&&player.localEligibility.service.rule.effectiveYear===2026&&player.localEligibility.service.region==='EU','regional move reset service progress or old rules');
  player.contract.until++;
  check(!isLocalPlayer(player,'EU',club.id),'renewal extended legacy contract rights');player.contract={...contract};
  const restored=unpackDB(packDB(d));check(teamNonLocalCount(restored,restored.teams[club.id])===0,'save lost contract exception');
  check(localChoiceOptions(d,player).includes('EU'),'successor origin not selectable');
  const decision=commitWorldAction(d,{type:'player.local-choice',actor:'manager',pid:player.id,region:'EU'});
  check(decision.ok,'managed successor choice rejected');activateLocalChoices(d,2028);
  check(playerActiveLocalRegion(player)==='EU'&&player.localEligibility.successorOrigin==='EU'&&!localChoiceOptions(d,player).includes('KR'),'successor choice not exclusive');
  const free=Object.values(d.players).find(x=>!x.team&&!x.retired&&playerActiveLocalRegion(x)==='KR');
  aiChooseLocalEligibility(d);check(free.localEligibility.pending?.region==='EU','free agent could not select successor');
  // A second reorganization before the first choice activates must not lose
  // a native player's ancestry or retain deleted intermediate choices.
  recordRegionSuccession(d,'EU',['NA'],'second-merger',true);
  delete d.regions.EU;
  const nested=Object.values(d.players).find(x=>!x.team&&!x.retired&&playerActiveLocalRegion(x)==='KR'&&x.localEligibility.qualifications.NA);
  const nestedDecision=commitWorldAction(d,{type:'player.local-choice',actor:'ai',pid:nested.id,region:'NA'});
  check(nestedDecision.ok,'chained successor consent rejected');activateLocalChoices(d,2028);
  check(nested.localEligibility.successorOrigin==='NA'&&!localChoiceOptions(d,nested).includes('KR'),'chained native choice not exclusive');
  const malformed=JSON.parse(packDB(restored));malformed.players[player.id].localEligibility.legacyContracts[0].teams=null;
  let bad=false;try{unpackDB(JSON.stringify(malformed))}catch{bad=true}check(bad,'malformed legacy save accepted');
  console.log('REGION_CONTINUITY_ACCEPTANCE: PASS (production merger, split organization, owned reserves, contracts/history, saved succession, invalid destination)');
})();`);
