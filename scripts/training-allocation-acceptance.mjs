import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {runEngineFixture} from './test-harness.mjs';
// Exact public00554b1 normal-policy reference. Historical controls stay local to this test closure.
const baseline={
  "trainingIntensity": "function trainingIntensity(t){const x=t?.training?.intensity||'normal';return x==='light'?{growth:.9,fatigue:.45,condition:.25}:x==='high'?{growth:1.08,fatigue:1.35,condition:-.35}:{growth:1,fatigue:.8,condition:0}}\n",
  "medicalCare": "function medicalCare(db,p){\n  const t=p.team&&db.teams[p.team];\n  if(!t)return 0.75;\n  const recovery=staffProfile(t).recovery,fac=facilityRecoveryBonus(t),tr=trainingIntensity(t);\n  const plan=medicalPlanFor(db,p);\n  return clamp(.88+(recovery-50)/225+fac*.05+(tr.growth<1?.07:tr.growth>1?-.13:0)-Math.max(0,(p.fatigue||0)-45)/330+\n    (plan==='rehab'?.12:plan==='rest'?.065:plan==='light'?.025:0),.65,1.42);\n}\n",
  "medicalIncidentOdds": "function medicalIncidentOdds(p,t,load,plan){\n  const rest=plan==='rest'||plan==='rehab',high=t.training?.intensity==='high'&&!rest&&plan!=='light';\n  // The same paid recovery staff and facilities that accelerate rehabilitation\n  // also reduce preventable overuse incidents. Bounded to avoid a medical\n  // arms race or eliminating the baseline risk from high-activity schedules.\n  const prevention=clamp(1-(staffProfile(t).recovery-50)*.0017-\n    (ensureFacilities(t).recovery-1)*.022,.79,1.08);\n  const injury=clamp(.000065*(1+load/22)*(1+Math.max(0,p.age-28)*.035)*\n    (high?1.25:1)*(1+Math.max(0,p.fatigue-45)/95)*\n    (rest?.57:plan==='light'?.83:1)*prevention,0,.00042);\n  const illness=.00020*(1+((p.condition??96)<70?.32:0));\n  const burnout=(p.medicalOverloadDays||0)>=14?\n    clamp(.00008*((p.medicalOverloadDays||0)-12)/18*(rest?.45:1)*prevention,0,.00032):0;\n  return {injury,illness,burnout};\n}\n",
  "medicalDailyTick": "function medicalDailyTick(db,date){\n  // Snapshot participants: an emergency organization callup can move a player\n  // between the two squads while this day's health lottery is running.\n  const participants=activeTeams(db).flatMap(t=>(t.roster||[]).map(id=>id));\n  const seen=new Set();\n  for(const id of participants){\n      if(seen.has(id))continue;\n      seen.add(id);\n      const p=db.players[id];if(!p||p.retired)continue;\n      const t=p.team&&db.teams[p.team];if(!t)continue;\n      pState(p);\n      const rng=new RNG((db.world?.seed||'world')+'|'+date+'|'+p.id,'medical');\n      const load=p.medicalLoad||0;\n      const plan=medicalPlanFor(db,p),rest=medicalScrimRest(db,p);\n      p.medicalDayPlan=plan;p.medicalPlanDate=date;\n      const high=t.training?.intensity==='high'&&!rest&&plan!=='light',care=medicalCare(db,p);\n      p.medicalLoad=Math.round(clamp(load*(rest?.73:plan==='light'?.82:.86)+(rest?0:high?.35:plan==='light'?.02:.08),0,38)*100)/100;\n      p.medicalOverloadDays=load>=9&&!rest&&(high||p.fatigue>=38)?\n        Math.min(120,(p.medicalOverloadDays||0)+1):Math.max(0,(p.medicalOverloadDays||0)-(rest?4:2));\n      if(rest)p.medicalRestDays=Math.min(366,(p.medicalRestDays||0)+1);\n      if(p.medical?.daysLeft>0||p.medicalResidual?.daysLeft>0)medicalHeal(db,p,1,date);\n      if(p.medical?.daysLeft>0)continue;\n      if(p.medicalResidual?.daysLeft>0&&rng.chance(.98))continue;\n      const {injury,illness,burnout}=medicalIncidentOdds(p,t,load,plan);\n      const draw=rng.next();let kind;\n      if(draw<injury)kind='injury';\n      else if(draw<injury+illness)kind='illness';\n      else if(draw<injury+illness+burnout)kind='burnout';\n      if(!kind)continue;\n      const severity=kind==='illness'?(rng.chance(.22)?'moderate':'minor'):\n        kind==='burnout'?(rng.chance(.62)?'moderate':'minor'):\n        rng.chance(.10)?'severe':rng.chance(.38)?'moderate':'minor';\n      const duration=kind==='illness'?rng.int(3,7):\n        kind==='burnout'?rng.int(14,28):\n        severity==='severe'?rng.int(22,50):severity==='moderate'?rng.int(7,17):rng.int(3,8);\n      startMedicalEvent(db,p,kind,severity,Math.ceil(duration/clamp(care,.85,1.18)),date,rng);\n  }\n  medicalReplacementDailyTick(db,date);\n}\n",
  "dailyRecovery": "function dailyRecovery(db){\n  for(const t of Object.values(db.teams)){ if(t.active===false)continue;\n    const prof=staffProfile(t),rec=4+(prof.recovery-50)/45+facilityRecoveryBonus(t);\n    const ti=trainingIntensity(t);for(const id of t.roster){const p=db.players[id];if(!p)continue;pState(p);\n      const plan=medicalPlanFor(db,p),off=plan==='rest'||plan==='rehab';\n      p.fatigue=clamp(p.fatigue-rec+(off?0:plan==='light'?ti.fatigue*.4:ti.fatigue)-(plan==='rest'?3:plan==='rehab'?1.7:plan==='light'?.9:0),0,100);\n      p.condition=clamp(p.condition+2.5+(off?.8:plan==='light'?.1:ti.condition),0,100);\n      if(off)p.sharpness=clamp(p.sharpness-.28,0,100);\n      p.form*=.98}\n  }\n}\n"
};
const pins={
  "trainingIntensity": "6b63f94f2791e4eb62a3ec0ae805792beef187b379938b1a51cd957df6504e0c",
  "medicalCare": "3ee0fa463dacc823687dce711e3f8949803d9f2a1136536e2a84cf76cac5898b",
  "medicalIncidentOdds": "179e0021e9f68d6bf707950a34b5f5ab69710db0dd04daea44c581e7015aec97",
  "medicalDailyTick": "29e6fdce716d2d9124366116c7fbc209be26d8e579ff46185ba0bd4018cbeff0",
  "dailyRecovery": "d64d35c400afbfc83fc86ef83e8e6a7dd4b38429abf4ae4157559acb05f0086c"
};
for(const [name,source] of Object.entries(baseline))assert.equal(createHash('sha256').update(source).digest('hex'),pins[name]);
await runEngineFixture(String.raw`(()=>{
 const check=(v,m)=>{if(!v)throw Error('TRAINING_RETIREMENT '+m)};
 check(typeof defaultTraining==='undefined'&&typeof normalizeTraining==='undefined'&&typeof setTrainingAllocation==='undefined'&&typeof trainingIntensity==='undefined'&&typeof advanceRoleConversionPlayer==='undefined','retired controls or free conversion path exposed');
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:6,div2:false})];cfg.internationals=[];cfg.changes='none';
 const db=buildWorld(cfg),teams=activeTeams(db),t=teams[0];
 check(teams.every(t=>!Object.hasOwn(t,'training')),'new teams still carry sliders');
 for(const club of teams)for(const role of ROLES){const p=genPlayer(db,new RNG('retirement/'+club.id+'/'+role),{region:club.region,role,age:22,base:65});signContract(db,p,club,1,3);club.depthChart[role]=p.id}
 startWorldSeason(db,t.id,'retirement-state');db.worldDate=addDays(nextDate(db),-10);
 const p=db.players[t.depthChart.TOP];p.age=19;p.pot=99;for(const key of Object.keys(p.attrs))p.attrs[key]=50;
 for(const player of Object.values(db.players))if(player.team){player.fatigue=0;player.condition=96;player.medicalPlan='auto'}
 const initial=packDB(db),fresh=()=>unpackDB(initial),beforeAttrs=JSON.stringify(p.attrs),legacy=fresh(),lt=legacy.teams[t.id],lp=legacy.players[p.id];
 lt.training={mechanical:NaN,laning:null,combat:'NaN',macro:Infinity,mental:20,intensity:'high',focus:'champions'};
 lt.practiceUsage={year:legacy.year,days:365,individual:99999,scrim:20};lt.practiceDecision={date:legacy.worldDate,focus:'individual'};
 lp.practiceUsage={year:legacy.year,days:365,individual:99999};lp.practiceDay={date:legacy.worldDate,individual:99999};
 for(const pr of Object.values(lp.pool))pr.trainingSeason=99999;
 const legacyBefore=JSON.stringify(legacy),normalized=unpackDB(packDB(legacy));
 check(!Object.hasOwn(normalized.teams[t.id],'training'),'restored legacy control remains active');
 for(const key of ['practiceUsage','practiceDecision'])check(JSON.stringify(normalized.teams[t.id][key])===JSON.stringify(lt[key]),'lost team historical '+key);
 for(const key of ['practiceUsage','practiceDay'])check(JSON.stringify(normalized.players[p.id][key])===JSON.stringify(lp[key]),'lost player historical '+key);
 check(normalized.players[p.id].id===p.id&&normalized.players[p.id].team===t.id&&JSON.stringify(normalized.players[p.id].contract)===JSON.stringify(lp.contract)&&JSON.stringify(normalized.teams[t.id].finance)===JSON.stringify(lt.finance)&&JSON.stringify(legacy)===legacyBefore,'migration or save changes identity/contract/cash/source');
 const idle=fresh(),same=fresh(),ir=new RNG('retired-growth'),lr=new RNG('retired-growth'),control=JSON.stringify([idle.players[p.id].contract,idle.teams[t.id].finance]);
 same.teams[t.id].training=lt.training;same.teams[t.id].practiceUsage=lt.practiceUsage;same.players[p.id].practiceUsage=lp.practiceUsage;
 for(const pr of Object.values(same.players[p.id].pool))pr.trainingSeason=99999;
 growPlayer(idle,idle.players[p.id],ir,0,{});growPlayer(same,same.players[p.id],lr,0,{});
 check(JSON.stringify(idle.players[p.id].attrs)===beforeAttrs,'potential alone creates idle growth');
 check(JSON.stringify(idle.players[p.id].attrs)===JSON.stringify(same.players[p.id].attrs)&&JSON.stringify(idle.players[p.id].pool)===JSON.stringify(same.players[p.id].pool)&&ir.next()===lr.next(),'legacy controls/usage/drills still affect growth or RNG');
 check(JSON.stringify([idle.players[p.id].contract,idle.teams[t.id].finance])===control&&Object.values(idle.players[p.id].attrs).every(Number.isFinite),'growth changes contract/cash or finite attributes');
 const old=fresh(),oldP=old.players[p.id];oldP.age=36;const oldAttrs={...oldP.attrs};growPlayer(old,oldP,new RNG('inactive-aging'),0,{});
 check(oldP.age===37&&Object.keys(oldAttrs).every(k=>oldP.attrs[k]<=oldAttrs[k]),'inactive aging creates free positive growth');
 const official=fresh(),season=Object.values(official.world.seasons).find(s=>s.days.some(d=>d.matches.some(m=>m.a===t.id||m.b===t.id))),day=season.days.find(d=>d.matches.some(m=>m.a===t.id||m.b===t.id)),match=day.matches.find(m=>m.a===t.id||m.b===t.id);
 setWorldCalendarDate(official,day.date);const game=simulateScheduledSeries(official,season,day,match,official.competitions[season.comp].stages.find(s=>s.id===day.stage));commitScheduledSeries(official,season,match,game);
 check(game.rec.games.every(g=>g.publicRecord.ending.kind==='nexus'),'actual official receipt missing');
 const lines=game.lines.filter(l=>l.pid===p.id),champGames={};for(const line of lines)champGames[line.champ]=(champGames[line.champ]||0)+1;
 check(lines.length>0,'official player did not participate');growPlayer(official,official.players[p.id],new RNG('retired-growth'),lines.length,champGames);
 check(JSON.stringify(official.players[p.id].attrs)!==beforeAttrs,'real official participation does not affect growth');
 const scrim=fresh(),own=scrim.teams[t.id],rival=scrim.teams[teams[1].id];let proposal=null;
 for(const id of own.roster){for(const role of ROLES.filter(r=>r!==scrim.players[id].role)){const result=proposeRoleConversion(scrim,id,role,'manager');if(result.accepted){proposal={pid:id,role,from:scrim.players[id].role};break}}if(proposal)break}
 check(proposal,'no actual consenting conversion candidate');
 const convert=scrim.players[proposal.pid],displaced=own.depthChart[proposal.role];
 check(setDepthStarter(scrim,own,proposal.from,displaced).ok&&setDepthStarter(scrim,own,proposal.role,convert).ok,'manual off-role lineup refused');
 const practice=simulateBackgroundScrim(scrim,own,rival,2,new RNG('actual-retirement-scrim'),'afternoon');
 check(practice?.games.length===2&&own.practiceDay.scrim===20&&rival.practiceDay.scrim===20,'actual scrim consumption missing');
 check(convert.role===proposal.from&&convert.roleConversion.scrimGames===2&&convert.roleConversion.progress>0,'actual target-role games did not advance accepted conversion');
 const participation=JSON.stringify(own.roster.map(id=>[scrim.players[id].attrs,scrim.players[id].pool,scrim.players[id].roleConversion])),recorded=scrim.players[p.id],roleProgress=convert.roleConversion.progress;
 runDailyPractice(scrim);check(own.practiceDay.drills===0&&own.practiceDay.remaining===80&&own.practiceDay.completed&&participation===JSON.stringify(own.roster.map(id=>[scrim.players[id].attrs,scrim.players[id].pool,scrim.players[id].roleConversion])),'unused day creates drills/experience/conversion');
 const once=JSON.stringify(scrim);runDailyPractice(scrim);check(JSON.stringify(scrim)===once&&convert.roleConversion.progress===roleProgress,'daily duplicate gifts progression');
 const save=unpackDB(packDB(scrim));check(save.players[convert.id].roleConversion.progress===roleProgress&&save.teams[t.id].practiceDay.scrim===20&&save.players[p.id].id===p.id,'actual activity/conversion save lost');
 check(Object.values(recorded.pool).some(pr=>pr.scrimSeason>0),'real scrim champion experience missing');
 growPlayer(scrim,recorded,new RNG('retired-growth'),0,{});check(JSON.stringify(recorded.attrs)!==beforeAttrs,'real scrim participation does not affect growth');
 const probe=fresh(),pt=probe.teams[t.id],patient=probe.players[p.id];let normalCases=0;
 for(const age of [19,28,29,36])for(const fatigue of [0,38,45,75])for(const load of [0,9,38])for(const plan of ['normal','light','rest','rehab'])for(const level of [1,4])for(const condition of [69,96]){
  Object.assign(patient,{age,fatigue,condition,medicalPlan:plan,medicalOverloadDays:20});pt.facilities.recovery=level;pt.training={intensity:'normal'};
  check(JSON.stringify(medicalIncidentOdds(patient,pt,load,plan))===JSON.stringify(normalMedicalBefore.odds(patient,pt,load,plan))&&medicalCare(probe,patient)===normalMedicalBefore.care(probe,patient),'original normal medical coefficients changed');
  const expected=JSON.stringify(medicalIncidentOdds(patient,pt,load,plan)),care=medicalCare(probe,patient);pt.training.intensity='high';
  check(JSON.stringify(medicalIncidentOdds(patient,pt,load,plan))===expected&&medicalCare(probe,patient)===care,'retired high intensity changes clinical decisions');normalCases++;
 }
 const clinical=fresh();for(const id of clinical.teams[t.id].roster)Object.assign(clinical.players[id],{fatigue:44,medicalLoad:12,medicalOverloadDays:15,medicalPlan:'auto'});
 startMedicalEvent(clinical,clinical.players[p.id],'injury','moderate',10,clinical.worldDate,new RNG('retirement-patient'));
 const raw=packDB(clinical);let normalDays=0;
 for(let seed=0;seed<8;seed++){
  const a=unpackDB(raw),b=unpackDB(raw);a.world.seed=b.world.seed='normal-care-'+seed;
  for(let day=0;day<4;day++){
   const date=addDays(clinical.worldDate,day+1);setWorldCalendarDate(a,date);setWorldCalendarDate(b,date);
   normalMedicalBefore.recover(a);normalMedicalBefore.tick(a,date);dailyRecovery(b);medicalDailyTick(b,date);
   check(JSON.stringify(a)===JSON.stringify(b)&&packDB(a)===packDB(b),'normal recovery/lottery state or save changed');normalDays++;
  }
 }
 console.log('TRAINING_RETIREMENT_ACCEPTANCE '+JSON.stringify({legacyControlsAbsent:true,legacyHistoryRetained:true,idleNoFreeGrowth:true,agingRetained:true,legacyGrowthAndRngInert:true,actualOfficialGames:lines.length,actualScrimGames:2,acceptedRoleParticipation:true,dayDuplicateAndSave:true,normalMedicalCases:normalCases,normalMedicalDays:normalDays,originalNormalMedicalStateAndSaveSame:true}));
})()`, {setupSources:['const normalMedicalBefore=(()=>{'+Object.values(baseline).join('\n')+';return {care:medicalCare,odds:medicalIncidentOdds,tick:medicalDailyTick,recover:dailyRecovery};})()']});
