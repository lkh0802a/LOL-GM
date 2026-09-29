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
  const limited=startMedicalEvent(db,p,'injury','severe',25,db.worldDate);
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
  ok(db.version===15,'world schema changed');
  console.log('D02_MEDICAL_ACCEPTANCE '+JSON.stringify({
    fivePlayerFloor:true,emergencySubstitute:true,individualRest:true,rehab:true,format2Save:true,
    dayIdempotent:true,offseasonRecovery:true,scars:scarCount,samples:600
  }));
})();`;
vm.runInNewContext(source,{console,Date,Math,JSON,Set,Map,WeakMap,Object,
  Array,String,Number,Boolean,RegExp,Error,Intl,performance,crypto},{timeout:90000});
