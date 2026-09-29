// D02 medical/rehabilitation contract with the actual bundled game engine.
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {ENGINE_MODULES} from './artifact-modules.mjs';
const dir=resolve(import.meta.dirname,'..','src','artifact');
let source='';
for(const file of ENGINE_MODULES)source+=await readFile(resolve(dir,file),'utf8')+'\n';
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
    restored.players[substitute.id].medicalLoad===substitute.medicalLoad,
    'active health status / training load did not survive save roundtrip');
  const legacy=JSON.parse(packed);
  delete legacy.players[p.id].medical;
  delete legacy.players[p.id].medicalLoad;
  ok(!unpackDB(JSON.stringify(legacy)).players[p.id].medical,
    'older v15 saves without medical fields failed to load');
  const date=addDays(db.worldDate,1);
  ok(applyWorldDailyEffects(db,date),'world did not run medical day');
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
    fivePlayerFloor:true,emergencySubstitute:true,format2Save:true,
    dayIdempotent:true,offseasonRecovery:true,scars:scarCount,samples:600
  }));
})();`;
vm.runInNewContext(source,{console,Date,Math,JSON,Set,Map,WeakMap,Object,
  Array,String,Number,Boolean,RegExp,Error,Intl,performance,crypto},{timeout:90000});
