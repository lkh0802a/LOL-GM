// D03-B3: finance-backed AI scouting target allocation and coverage.
import {runEngineFixture,artifactSource} from './test-harness.mjs';

const fixture=String.raw`(()=>{
  const assert=(x,m)=>{if(!x)throw new Error('D03_SCOUT_OPS '+m)};
  const near=(a,b)=>Math.abs(a-b)<.001;
  const cfg=defaultWorldConfig();
  cfg.regions=[
    regionCfg('NA',{teams:10,splits:1,legs:1,regularBo:1,playoffBo:1,
      playoffTake:4,format:'rr_po',div2:false,system:'franchise'}),
    regionCfg('EU',{teams:10,splits:1,legs:1,regularBo:1,playoffBo:1,
      playoffTake:4,format:'rr_po',div2:false,system:'franchise'})
  ];
  cfg.internationals=[];cfg.subs=1;cfg.changes='none';
  let db=buildWorld(cfg);
  const na=activeTeams(db,'NA',1).slice(0,3),
    manager=activeTeams(db,'EU',1)[0];
  assert(na.length===3&&manager,'fixture missing clubs');
  setManagedTeam(db,manager.id);
  db.world={year:db.year,seed:'d03-b3',manage:'manual',phase:'market',
    seasons:{},steps:[],step:0,report:null,offers:[],marketLog:[]};
  const [strong,weak,poor]=na;
  // No legacy history may be fabricated. The common regional power is neutral
  // until a specific employee actually observes players in that region.
  const euTarget=Object.values(db.players).find(p=>!p.team&&p.region==='EU'),naTarget=Object.values(db.players).find(p=>!p.team&&p.region==='NA');
  assert(scoutingRegionalPower(db,strong,euTarget).power===scoutingPowerForTeam(strong)&&staffByRole(strong,'scout').every(s=>!s.scoutRegions),'legacy expertise fabricated or neutral baseline changed');
  const rowFor=k=>({knowledge:k,observations:12,lastYear:db.year,lastDate:db.worldDate});
  const [euExpert,homeExpert]=staffByRole(strong,'scout');euExpert.scoutRegions={EU:rowFor(90)};homeExpert.scoutRegions={NA:rowFor(90)};
  const regionPlan=regionalScoutingAssignments(db,strong,['NA','EU']);
  assert(regionPlan.find(r=>r.region==='NA').scoutIds[0]===homeExpert.id&&regionPlan.find(r=>r.region==='EU').scoutIds[0]===euExpert.id,'personal expertise did not assign the real investigator');
  assert(scoutingRegionalPower(db,strong,euTarget).power>scoutingPowerForTeam(strong),'regional expertise did not affect actual report gain');
  const capacityProbe={role:'scout',rating:40};assert(scoutRegionalCapacity(capacityProbe)===1&&scoutRegionalCapacity({...capacityProbe,scoutRegions:{EU:rowFor(90)}})>1,'personal ability/experience did not bound coverage');
  const longPlan=regionalScoutingAssignments(db,strong,['NA','EU','R1','R2','R3','R4','R5','R6']);for(const person of staffByRole(strong,'scout'))assert(longPlan.filter(r=>r.scoutIds.includes(person.id)).length<=scoutRegionalCapacity(person),'individual overloaded across regions');
  delete euExpert.scoutRegions;delete homeExpert.scoutRegions;
  ensureFacilities(strong).scouting=5;
  ensureFacilities(weak).scouting=1;
  ensureFacilities(poor).scouting=1;
  for(const s of staffByRole(strong,'scout'))s.rating=94;
  for(const s of staffByRole(weak,'scout'))s.rating=42;
  for(let i=0;i<2;i++)ensureStaffRoster(strong).push({
    id:'D03_EXTRA_SCOUT_'+i,name:'Ops Scout '+i,role:'scout',department:'scout',
    rating:90-i,age:35
  });
  for(const employee of strong.staffRoster)initializeStaffContract(db,strong,employee);
  strong.finance.cash=100;weak.finance.cash=100;poor.finance.cash=0;

  const strongCash=strong.finance.cash,weakCash=weak.finance.cash,
    strongOp=aiRunScoutingOperation(db,strong),
    weakOp=aiRunScoutingOperation(db,weak),
    poorOp=aiRunScoutingOperation(db,poor);
  assert(strongOp&&weakOp&&poorOp,'operation did not return audit state');
  assert(strongOp.capacity>weakOp.capacity&&strongOp.targets.length>weakOp.targets.length,
    'staff/facility resources did not expand target capacity');
  assert(strongOp.assignments.length>weakOp.assignments.length&&
    strongOp.assignments.some(a=>a.region!=='NA'),
    'strong department did not expand regional coverage');
  assert(weakOp.assignments.length===1&&weakOp.assignments[0].region==='NA',
    'basic department escaped its bounded home-region coverage');
  assert(strongOp.assignments.every(a=>Array.isArray(a.leagues)&&
    Array.isArray(a.scoutIds))&&strongOp.assignments.some(a=>a.leagues.length>0),
    'coverage plan did not persist league/staff assignments');

  assert(strongOp.targets.length===strongOp.targetLimit&&
    weakOp.targets.length===weakOp.targetLimit,
    'funded operation did not use its bounded target allocation');
  assert(near(strongOp.spent,aiScoutingBatchCharge(strongOp.unitCost,strongOp.targets.length))&&
    near(weakOp.spent,aiScoutingBatchCharge(weakOp.unitCost,weakOp.targets.length)),
    'operation spending diverged from manager-equivalent batch accounting');
  assert(near(strongCash-strong.finance.cash,strongOp.spent)&&
    near(weakCash-weak.finance.cash,weakOp.spent),
    'scouting did not deduct real club cash');
  assert(near(strong.finance.prepaid.scoutingExpense,strongOp.spent)&&
    near(weak.finance.prepaid.scoutingExpense,weakOp.spent),
    'scouting spend was not recorded in prepaid finance statements');
  assert(poorOp.targetLimit===0&&poorOp.targets.length===0&&poorOp.spent===0&&
    poorOp.reason==='liquidity',
    'liquidity-constrained club spent scouting cash without reserve');
  assert(staffByRole(poor,'scout').every(s=>!s.scoutRegions),'unfunded operation fabricated regional observations');
  assert(strongOp.assignments.some(a=>a.scoutIds.some(id=>strong.staffRoster.find(s=>s.id===id)?.scoutRegions?.[a.region]?.observations>0)),'funded operation did not teach assigned employees');
  const parityDb=unpackDB(packDB(db)),parityHuman=parityDb.teams[manager.id],parityAi=parityDb.teams[strong.id],parityPlayer=parityDb.players[euTarget.id];
  parityHuman.region=parityAi.region;parityHuman.facilities=JSON.parse(JSON.stringify(parityAi.facilities));parityHuman.staffRoster=parityAi.staffRoster.map(s=>({...JSON.parse(JSON.stringify(s)),id:'PARITY_'+s.id}));
  delete parityAi.scoutingState.reports[parityPlayer.id];delete parityDb.scout?.[parityPlayer.id];
  // Preserve historical public baseline differences; compare equal report state.
  ensureScoutReport(parityDb,parityPlayer).knowledge=50;ensureAiScoutReport(parityDb,parityAi,parityPlayer).knowledge=50;
  observePlayer(parityDb,parityPlayer,22,{comp:'parity'});observeAiPlayer(parityDb,parityAi,parityPlayer,22,{comp:'parity'});
  assert(Math.abs(parityDb.scout[parityPlayer.id].knowledge-parityAi.scoutingState.reports[parityPlayer.id].knowledge)<1e-9,'human/AI identical regional profile produced different knowledge gains');
  // Human and AI use the same owner, target location, experience gain and power.
  const parentReserve=reserveTeamsOf(db,strong)[0];if(parentReserve)assert(scoutingRegionalPower(db,parentReserve,euTarget).owner===strong,'reserve did not use parent expertise');
  const humanScout=staffByRole(manager,'scout')[0],humanBefore=JSON.stringify(db),cost=.1*psOf(db,manager.region),observeOriginal=observePlayer;
  observePlayer=(state,p,gain,opt)=>{observeOriginal(state,p,gain,opt);throw Error('injected scouting failure')};
  const fault=scoutPlayers(db,[naTarget.id],40,cost);observePlayer=observeOriginal;
  assert(fault.includes('처리 실패')&&JSON.stringify(db)===humanBefore&&staffByRole(manager,'scout')[0]===humanScout,'manual failure lost cash/report/expertise or staff identity');
  const aiBefore=JSON.stringify(db),payOriginal=payFinancePrepaid;payFinancePrepaid=(t,key,amount)=>{payOriginal(t,key,amount);if(key==='scoutingExpense')throw Error('injected AI payment failure')};
  let aiFailed=false;try{aiRunScoutingOperation(db,strong)}catch{aiFailed=true}payFinancePrepaid=payOriginal;
  assert(aiFailed&&JSON.stringify(db)===aiBefore,'AI late payment failure lost reports, expertise, audit or cash');
  const badBefore=JSON.stringify(db);scoutPlayers(db,[naTarget.id,naTarget.id],40,cost);scoutPlayers(db,['missing'],40,cost);assert(JSON.stringify(db)===badBefore,'invalid manual batch mutated state');
  assert(scoutPlayers(db,[naTarget.id],40,cost).includes('갱신')&&staffByRole(manager,'scout').some(s=>s.scoutRegions?.NA?.observations===1),'human successful visit did not teach responsible scout');
  const moved=db.players[naTarget.id],oldRegion=moved.region;moved.team=manager.id;
  assert(scoutingRegionalPower(db,strong,moved).region===manager.region,'observations used origin rather than current employment region');moved.team=null;moved.region=oldRegion;
  globalThis.DB=db;globalThis.esc=x=>String(x).replaceAll('<','&lt;').replaceAll('>','&gt;');const displayed=staffByRole(manager,'scout').find(s=>s.scoutRegions?.NA);displayed.name='<scout-experience>';
  assert(scoutRegionalSummary(db,naTarget).includes('&lt;scout-experience&gt;')&&staffRegionalKnowledgeSummary(displayed).includes('지역 관찰 경험'),'regional UI missed/failed to escape real employee experience');
  const personal=JSON.stringify(displayed.scoutRegions);manager.finance.cash=1000;const released=commitWorldAction(db,{type:'staff.release',actor:'manager',teamId:manager.id,sid:displayed.id});assert(released.ok&&JSON.stringify(locateStaff(db,displayed.id).staff.scoutRegions)===personal,'release discarded personal experience');
  const acquired=commitWorldAction(db,{type:'staff.sign',actor:'system',teamId:weak.id,sid:displayed.id,years:2,salary:staffAskingSalary(db,weak,displayed)});assert(acquired.ok&&JSON.stringify(displayed.scoutRegions)===personal&&scoutRegionalMembers(db,manager,'NA').every(s=>s.id!==displayed.id),'rehiring erased expertise or prior employer retained employee');

  const covered=new Set(strongOp.assignments.map(a=>a.region));
  assert(strongOp.targets.every(x=>covered.has(x.region)&&x.afterKnowledge>x.beforeKnowledge&&
    x.sourceAfter==='scouted'),
    'target observations escaped assigned coverage or failed to improve reports');
  const targeted=db.players[strongOp.targets[0].pid],
    targetedView=aiMarketObservation(db,targeted,strong);
  assert(targetedView.source==='scouted',
    'market AI did not consume the active scouting report');
  const targetIds=new Set(strongOp.targets.map(x=>x.pid)),
    untouched=Object.values(db.players).find(p=>!p.retired&&!p.team&&
      !targetIds.has(p.id)&&covered.has(aiScoutingTargetRegion(db,p)));
  assert(untouched&&aiMarketObservation(db,untouched,strong).source==='public',
    'active operation refreshed the whole covered region instead of selected targets');

  const state=strong.scoutingState;
  assert(state.lastOperation===strongOp&&state.operations.at(-1)===strongOp,
    'operation audit trail was not retained by the club scouting state');
  const packed=packDB(db);
  db=unpackDB(packed);
  const restored=db.teams[strong.id],restoredOp=restored.scoutingState.lastOperation,
    restoredTarget=db.players[strongOp.targets[0].pid];
  assert(restoredOp.targets.length===strongOp.targets.length&&
    near(restored.finance.prepaid.scoutingExpense,strongOp.spent)&&
    aiMarketObservation(db,restoredTarget,restored).source==='scouted',
    'active scouting operation failed save/restore');
  assert(JSON.stringify(locateStaff(db,displayed.id).staff.scoutRegions)===personal,'save lost transferred scout expertise');
  const damaged=JSON.parse(packDB(db));damaged.teams[weak.id].staffRoster.find(s=>s.id===displayed.id).scoutRegions.NA.knowledge=101;let rejected=false;try{unpackDB(JSON.stringify(damaged))}catch{rejected=true}assert(rejected,'invalid saved expertise accepted');

  console.log('D03_SCOUTING_OPS_ACCEPTANCE '+JSON.stringify({
    strong:{capacity:strongOp.capacity,targets:strongOp.targets.length,
      regions:strongOp.assignments.map(a=>a.region),spent:strongOp.spent,
      scouts:staffByRole(restored,'scout').length,
      knowledgeGain:strongOp.targets.map(x=>x.afterKnowledge-x.beforeKnowledge)},
    weak:{capacity:weakOp.capacity,targets:weakOp.targets.length,
      regions:weakOp.assignments.map(a=>a.region),spent:weakOp.spent},
    poor:{runway:poorOp.runway,targetLimit:poorOp.targetLimit,spent:poorOp.spent},
    unitCost:strongOp.unitCost,visitGain:aiScoutingVisitGain(),
    saveFormat:JSON.parse(packed).saveFormat
  }));
})();`;
await runEngineFixture(fixture,{timeout:30000,filename:'scouting-operations-acceptance.fixture.js',setupSources:[await artifactSource('ui-scouting-regions.js')]});
