// D02 medical/rehabilitation contract with the actual bundled game engine.
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {ENGINE_MODULES} from './artifact-modules.mjs';
const dir=resolve(import.meta.dirname,'..','src','artifact');
let source='';
for(const file of ENGINE_MODULES)source+=await readFile(resolve(dir,file),'utf8')+'\n';
const ui=await readFile(resolve(dir,'ui-roster.js'),'utf8');
if(!ui.includes('data-medical-plan')||!ui.includes('p.medicalPlan=e.target.value'))
  throw new Error('D02_MEDICAL player rest controls missing from manager roster');
source+=String.raw`(()=>{
  const ok=(x,msg)=>{if(!x)throw new Error('D02_MEDICAL '+msg)};
  const cfg=defaultWorldConfig();
  cfg.regions=[regionCfg('NA',{teams:10,splits:1,legs:1,regularBo:1,
    playoffBo:1,playoffTake:4,format:'rr_po',div2:false,system:'franchise'})];
  cfg.internationals=[];cfg.subs=0;cfg.changes='none';
  const db=buildWorld(cfg),teams=activeTeams(db,null,1),manager=teams[0];
  startCareer(db,manager.id,'d02-medical');
  autoBuildInitialSquad(db,manager,new RNG('d02','initial'),5);
  finalizeInitialRosters(db);
  ok(manager.roster.length===5,'need a five-person starting baseline');
  const p=db.players[manager.roster[0]],original=playerMod(p);
  const initialCash=manager.finance.cash;
  manager.finance.cash=0; // An unaffordable free agent must not bypass the five-player floor.
  const limited=startMedicalEvent(db,p,'injury','severe',25,db.worldDate);
  manager.finance.cash=initialCash;
  ok(manager.roster.length===5,'unfunded emergency FA was added despite zero cash');
  ok(limited&&!limited.out&&!medicalOut(p)&&limited.severity==='minor',
    'incident left a five-person team unable to compete');
  ok(playerMod(p)<original-.03,'limited participation did not hurt performance');
  ok(validateStartingLineup(db,manager).ok,'protected fifth starter was incorrectly banned');
  ok(medicalPlanFor(db,p)==='rehab','injured player not automatically assigned rehab');
  p.medicalPlan='normal';const normalCare=medicalCare(db,p);
  p.medicalPlan='rehab';ok(medicalCare(db,p)>normalCare+.10,'rehab did not improve treatment rate');
  p.medicalPlan='rest';ok(medicalScrimRest(db,p),'manual rest did not exclude player from scrims');
  ok(validateStartingLineup(db,manager).ok,'medical rest incorrectly blocked official match');
  ok(Object.keys(bestStartingLineup(db,manager,{},true)).length<5,
    'a five-person roster scheduled scrims despite medical rest');
  const baseline=db.players[manager.roster[1]];
  p.fatigue=baseline.fatigue=48;p.condition=baseline.condition=75;
  baseline.medicalPlan='normal';dailyRecovery(db);
  ok(p.fatigue+2<baseline.fatigue&&p.condition>baseline.condition,
    'individual rest did not improve daily fatigue/condition compared with training');
  baseline.medicalPlan='auto';
  let club=teams.find(t=>t.id!==manager.id&&t.roster.length>=6);
  if(!club){
    club=teams[1];const sub=Object.values(db.players).find(x=>!x.team&&!x.retired);
    ok(sub,'need a free-agent substitute fixture');
    sub.team=club.id;club.roster.push(sub.id);initializeDepthChart(db,club,true);
  }
  const role=ROLES[0],injured=starterFor(db,club,role),oldMap={...club.depthChart};
  const absence=startMedicalEvent(db,injured,'illness','moderate',5,db.worldDate);
  ok(absence?.out&&medicalOut(injured),'available bench did not permit medical absence');
  ok(!validateStartingLineup(db,club,oldMap).ok,'unavailable starter still passed validation');
  const substitute=starterFor(db,club,role);
  ok(substitute&&substitute.id!==injured.id&&validateStartingLineup(db,club).ok,
    'legal emergency substitution did not occur');
  const another=db.players[club.roster.find(id=>id!==injured.id&&id!==substitute.id)];
  const guarded=startMedicalEvent(db,another,'burnout','severe',19,db.worldDate);
  ok(guarded&&medicalAvailable(db,club)>=5,
    'multiple absences removed the whole legal starting five');
  medicalExposure(db,substitute,'official',2);
  const load=substitute.medicalLoad;medicalExposure(db,substitute,'scrim',3);
  ok(substitute.medicalLoad>load&&substitute.medicalLoad>=4.9,
    'official and private work did not accumulate risk');
  const packed=packDB(db),restored=unpackDB(packed);
  ok(restored.players[injured.id].medical?.out&&
    restored.players[p.id].medicalPlan==='rest'&&
    restored.players[substitute.id].medicalLoad===substitute.medicalLoad,
    'active health status / training load did not survive save roundtrip');
  const legacy=JSON.parse(packed);
  delete legacy.players[p.id].medical;
  delete legacy.players[p.id].medicalLoad;
  delete legacy.players[p.id].medicalPlan;
  ok(!unpackDB(JSON.stringify(legacy)).players[p.id].medical,
    'older v15 saves without medical fields failed to load');
  const date=addDays(db.worldDate,1);
  ok(applyWorldDailyEffects(db,date),'world did not run medical day');
  ok(p.medicalRestDays===1,'rest day was not counted toward seasonal lost practice');
  ok(medicalPlanFor(db,injured)==='rehab','rival AI ignored injury rehabilitation');
  ok(medicalPlanFor(db,db.players[manager.roster[1]])!=='rehab','healthy player forced into medical rehab');
  const before=JSON.stringify([db.players[injured.id].medical,
    db.players[substitute.id].medicalLoad,db.players[p.id].medical]);
  ok(!applyWorldDailyEffects(db,date),'medical tick repeated on same calendar day');
  ok(before===JSON.stringify([db.players[injured.id].medical,
    db.players[substitute.id].medicalLoad,db.players[p.id].medical]),
    'replayed date re-applied rehab / exposure');
  for(let i=2;i<18&&medicalOut(injured);i++)medicalHeal(db,injured,1,addDays(date,i));
  ok(!medicalOut(injured)&&injured.medicalResidual?.daysLeft>0,
    'player did not recover with temporary post-injury consequences');
  ok(injured.careerEvents.some(e=>e.type==='medical_start')&&
    injured.careerEvents.some(e=>e.type==='medical_return'),
    'medical records were not added to player career events');
  medicalOffseasonRecovery(db,addDays(date,90));
  ok(medicalSummary(p)==='정상'&&medicalSummary(injured)==='정상',
    'offseason date jump froze recovery or lingering health effects');
  const severe={kind:'injury',severity:'severe',site:'wrist',started:date};
  let scarCount=0;
  for(let i=0;i<600;i++){
    const clone={...injured,id:'scar-'+i,age:36,attrs:{...injured.attrs},careerEvents:[]};
    const old=clone.attrs.precision;medicalScar(db,clone,severe,date);
    const lost=old-clone.attrs.precision;
    ok(lost===0||lost===1,'permanent effect exceeded one attribute point');
    scarCount+=lost;
  }
  ok(scarCount>=2&&scarCount<100,'permanent loss was not rare');
  // D02-B3: sign a season-long FA only when academy coverage is unavailable.
  // Exercise both the managed club and a rival under identical market rules.
  const verifyEmergencyFA=(team,label)=>{
    ok(team.roster.length===5&&medicalAvailable(db,team)===5,
      label+' needs an ordinary healthy five-player roster');
    const before=new Set(team.roster),beforePayroll=payroll(db,team);
    team.finance.cash=1000; // Give this deterministic fixture sufficient headroom.
    const victim=db.players[team.roster[0]];
    const priorMedical=victim.medical?{...victim.medical}:null;
    const incident=startMedicalEvent(db,victim,'injury','severe',21,db.worldDate);
    const signed=team.roster.map(id=>db.players[id]).find(p=>!before.has(p.id));
    ok(incident?.out&&incident.severity==='severe'&&medicalOut(victim),
      label+' failed to apply a genuine medical absence: '+JSON.stringify({priorMedical,incident,available:medicalAvailable(db,team),roster:team.roster.length,faCount:Object.values(db.players).filter(x=>!x.team&&!x.retired).length,budget:salaryBudget(db,team)-payroll(db,team)}));
    ok(signed&&signed.team===team.id&&signed.contract?.years===1&&
      signed.contract.until===db.year&&team.roster.length===6,
      label+' did not sign a one-year substitute');
    ok(signed.careerEvents.some(e=>e.type==='medical_emergency_fa'&&
      e.for===victim.id&&e.to===team.id),
      label+' emergency signing lost its reason in player history');
    ok(Math.abs(payroll(db,team)-beforePayroll-signed.contract.salary)<.001,
      label+' substitute contract was not added to the wage bill');
    ok(medicalAvailable(db,team)===5&&validateStartingLineup(db,team).ok,
      label+' failed to maintain an eligible starting lineup');
    ok(rosterIntegrityErrors(db).length===0,
      label+' signing introduced a duplicate or inconsistent registration');
    const saved=unpackDB(packDB(db));
    ok(saved.players[victim.id].medical?.out&&
      saved.players[signed.id].team===team.id&&
      saved.players[signed.id].contract?.until===db.year&&
      saved.teams[team.id].roster.includes(signed.id),
      label+' emergency signing or absence failed the save roundtrip');
  };
  verifyEmergencyFA(manager,'manager');
  const aiClub=teams.find(t=>t.id!==manager.id&&t.id!==club.id&&
    t.roster.length===5&&medicalAvailable(db,t)===5);
  ok(aiClub,'need a five-person AI team for the FA signing test');
  verifyEmergencyFA(aiClub,'AI');
  // D02-B: protected top and reserve squads exchange only surplus healthy
  // players, using the same atomic roster plan as manager and club AI.
  const cfg2=defaultWorldConfig();
  cfg2.regions=[regionCfg('KR',{teams:10,splits:1,legs:1,regularBo:1,
    playoffBo:1,playoffTake:4,format:'rr_po',div2:true,system:'franchise'})];
  cfg2.internationals=[];cfg2.subs=1;cfg2.changes='none';
  const org=buildWorld(cfg2),owner=activeTeams(org,null,1)[0];
  startCareer(org,owner.id,'d02-emergency');
  autoBuildInitialSquad(org,owner,new RNG('d02-callup','squad'),5);
  autoBuildInitialSquad(org,reserveTeamsOf(org,owner)[0],
    new RNG('d02-callup','academy'),6);
  finalizeInitialRosters(org);
  const first=activeTeams(org,null,1).find(t=>t.id!==owner.id&&
    reserveTeamsOf(org,t).some(s=>medicalAvailable(org,s)>5)&&
    (t.roster||[]).length<rosterRulesForTeam(org,t).firstTeamMax);
  ok(first,'no registered club with a surplus owned-reserve substitute');
  const reserve=reserveTeamsOf(org,first).find(s=>medicalAvailable(org,s)>5);
  const spareBefore=medicalAvailable(org,reserve),firstBefore=first.roster.length;
  const need=Math.max(0,medicalAvailable(org,first)-5);
  for(const id of first.roster.slice(0,need))
    ok(startMedicalEvent(org,org.players[id],'illness','moderate',8,org.worldDate)?.out,
      'preparation did not reduce club healthy roster to five');
  ok(medicalAvailable(org,first)===5,'callup setup healthy count incorrect');
  const target=first.roster.map(id=>org.players[id]).find(p=>!medicalOut(p));
  const emergency=startMedicalEvent(org,target,'injury','severe',32,org.worldDate);
  ok(emergency?.out&&emergency.severity==='severe'&&medicalOut(target),
    'available academy player did not allow a genuine absence');
  ok(first.roster.length===firstBefore+1&&medicalAvailable(org,first)===5,
    'first team failed to register a substitute');
  ok(medicalAvailable(org,reserve)===spareBefore-1&&medicalAvailable(org,reserve)>=5,
    'academy was left below its own legal match minimum');
  const promoted=org.players[first.roster.find(id=>
    org.players[id].careerEvents?.some(e=>e.type==='medical_callup'&&e.for===target.id))];
  ok(promoted&&promoted.team===first.id&&
    (reserve.roster||[]).every(id=>id!==promoted.id)&&
    validateStartingLineup(org,first).ok,
    'emergency callup was not an eligible unique-five lineup');
  const restoredOrg=unpackDB(packDB(org));
  ok(restoredOrg.players[target.id].medical?.out&&
    restoredOrg.players[promoted.id].team===first.id&&
    medicalAvailable(restoredOrg,reserveTeamsOf(restoredOrg,first.id)[0])>=5,
    'emergency registration or absence failed the save roundtrip');
  const beforeLoad=promoted.medicalLoad=10;
  medicalDailyTick(org,addDays(org.worldDate,1));
  ok(promoted.medicalLoad<beforeLoad&&promoted.medicalLoad>8.5,
    'medical lottery processed a moved player twice on one day');

    ok(db.version===15,'world schema changed');
  console.log('D02_MEDICAL_ACCEPTANCE '+JSON.stringify({
    fivePlayerFloor:true,emergencySubstitute:true,emergencyFA:true,individualRest:true,rehab:true,format2Save:true,
    dayIdempotent:true,offseasonRecovery:true,scars:scarCount,samples:600
  }));
})();`;
vm.runInNewContext(source,{console,Date,Math,JSON,Set,Map,WeakMap,Object,
  Array,String,Number,Boolean,RegExp,Error,Intl,performance,crypto},{timeout:90000});
