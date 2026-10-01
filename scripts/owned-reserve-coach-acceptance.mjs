import assert from 'node:assert/strict';
import {artifactSources,runEngineFixture} from './test-harness.mjs';
const sources=await artifactSources(['ui-market.js','ui-market-initial.js','ui-roster.js','ui-setup.js','ui-negotiations.js','app.js']);
const esc=sources.pop().match(/^const esc=.*$/m)?.[0];assert(esc);
await runEngineFixture(String.raw`(()=>{
  const check=(ok,msg)=>{if(!ok)throw Error('OWNED_RESERVE_COACH '+msg)};
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('KR',{teams:8,div2:true,
    splits:1,legs:1,regularBo:1,playoffBo:1,playoffTake:4})];cfg.internationals=[];
  let db=buildWorld(cfg),parent=activeTeams(db,null,1)[0],reserve=reserveTeamsOf(db,parent)[0];
  check(managerSelectableTeams(db,'KR',2).some(t=>t.id===reserve.id),'owned team absent from picker');
  DB=db;SSET={team:reserve.id,region:'KR',division:2};
  check(managerTeamPicker().includes(reserve.name)&&managerTeamPicker().includes('소유 2군도 감독'),
    'real picker omits reserve or authority explanation');
  startCareer(db,reserve.id,'owned-coach-fixture');
  check(managedTeamId(db)===reserve.id&&db.manager.startMode==='academy_coach'&&
    !initialOrganizationErrors(db,reserve).length&&reserve.roster.length>=5&&parent.roster.length>=5,
    'parent did not build legal provided roster');
  const initialHtml=renderInitialRosterMarket();
  check(initialHtml.includes('배정된 선수단으로 시즌 시작')&&!initialHtml.includes('data-init-negotiate')&&
    !initialHtml.includes('data-init-release'),'initial UI exposes recruitment');
  const own=db.players[reserve.roster[0]],parentPlayer=db.players[parent.roster[0]],
    free=genPlayer(db,new RNG('coach-test-free'),{role:'TOP',age:20,base:60,region:'KR'}),
    before=JSON.stringify(db);
  for(const command of [
    {type:'player.sign',pid:free.id,kind:'initial',salary:1,years:1,terms:{}},
    {type:'player.release',pid:own.id,mode:'manager'},
    {type:'player.option',pid:own.id},
    {type:'player.transfer',pid:parentPlayer.id,fromId:parent.id,fee:0}
  ])check(!commitWorldAction(db,{...command,teamId:reserve.id,actor:'manager'}).ok,
    'academy coach bypassed economic authority');
  check(!startNegotiation(db,free.id,'initial',{teamId:reserve.id}).ok&&
    !startNegotiation(db,free.id,'initial',{teamId:parent.id}).ok&&JSON.stringify(db)===before,
    'negotiation bypassed restriction or mutated world');
  const plan=rosterPlanState(db,parent);
  check(!previewWorldAction(db,{type:'roster.plan',actor:'manager',parentId:parent.id,
    assignments:plan.assignments}).ok,'coach can assign parent organization');
  check(!proposeRoleConversion(db,parentPlayer.id,ROLES.find(r=>r!==parentPlayer.role)).ok,
    'coach can train parent players');
  MSG='';nav=()=>{};saveDB=()=>{};navKeepScroll=()=>{};
  document={querySelectorAll:()=>[]};window={scrollTo:()=>{}};
  const finishButton={};$=selector=>selector==='#init-final'?finishButton:null;
  bindInitialRosterMarket();check(typeof finishButton.onclick==='function','provided-roster start button unbound');
  finishButton.onclick();
  check(db.world.phase==='season'&&managedTeamId(db)===reserve.id&&
    managerControlsSquad(db,reserve)&&!managerControlsSquad(db,parent)&&
    managedRecruitmentTeamId(db)===null,'coach lost scope at season start');
  DB=db;SQUAD_EDIT=null;MSG='';nav=()=>{};saveDB=()=>{};
  const parentBefore=JSON.stringify({training:parent.training,tactics:parent.tactics,
    depthChart:parent.depthChart,roles:parent.roster.map(id=>db.players[id].rosterRole)}),
    edit=squadEditState(reserve),key=Object.keys(reserve.tactics)[0];
  edit.training.intensity='light';edit.tactics[key]=17;
  applySquadEdit();
  check(reserve.training.intensity==='light'&&reserve.tactics[key]===17&&
    JSON.stringify({training:parent.training,tactics:parent.tactics,depthChart:parent.depthChart,
      roles:parent.roster.map(id=>db.players[id].rosterRole)})===parentBefore,
    'actual squad apply blocked coaching or altered parent');
  SQUAD_EDIT={...squadEditState(reserve),teamId:parent.id};
  const beforeParentBypass=JSON.stringify(db);applySquadEdit();
  check(JSON.stringify(db)===beforeParentBypass,'crafted squad edit altered parent');
  SQUAD_EDIT=null;
  own.medicalPlan='rest';check(medicalPlanFor(db,own)==='rest','reserve recovery override ignored');
  const restored=unpackDB(packDB(db));
  check(managedTeamId(restored)===reserve.id&&restored.teams[reserve.id].training.intensity==='light',
    'coach save restore failed');
  const marketHtml=renderMarket();
  check(marketHtml.includes('모구단')&&!marketHtml.includes('data-release')&&
    !marketHtml.includes('data-start-fa')&&rosterPlanPanel(reserve).includes('모구단 선수 배치'),
    'market or roster UI exposes forbidden controls');
  // The real reserve competition pauses for the user's official draft.
  let paused=false;
  for(let day=0;day<60&&db.world.phase==='season';day++){
    playWorldDay(db);
    if(db.world.pendingOfficial){paused=true;break}
  }
  check(paused&&[pendingOfficialSession(db).refs.m.a,pendingOfficialSession(db).refs.m.b].includes(reserve.id),
    'reserve official match did not pause for its manager');
  const market=unpackDB(packDB(restored));market.world.phase='market';market.year++;
  market.world.year=market.year;const managed=market.teams[reserve.id];
  for(const pid of managed.roster)market.players[pid].contract.until=market.year-1;
  contractMarket(market,new RNG('owned-coach-market'),
    {resign:[],expired:[],signings:[],transfers:[]},()=>{});
  check(managed.roster.length>=5&&managed.roster.every(pid=>
    market.players[pid].contract?.until>=market.year),'AI neglected managed reserve contracts');
  console.log('OWNED_RESERVE_COACH_ACCEPTANCE '+JSON.stringify({selection:true,
    providedRoster:true,economicAuthority:true,coachingUi:true,parentIsolation:true,
    recovery:true,officialPause:true,aiContracts:true,saveRestore:true}));
})();`,{filename:'owned-reserve-coach.fixture.js',setupSources:[...sources,esc]});
