import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
  const check=(x,m)=>{if(!x)throw Error('FIGHT_SKILLS '+m)};
  const neutral={cc:.6,reach:.4,mobility:.6,uptime:.6},control={...neutral,cc:1.4},ranged={...neutral,reach:1},mobile={...neutral,mobility:1.4},fast={...neutral,uptime:1.3};
  check(fightSkillEngage(control,neutral)>fightSkillEngage(neutral,neutral),'control changes entry');
  check(fightSkillEngage(control,mobile)<fightSkillEngage(control,neutral),'mobility contests entry');
  check(fightSkillPhase(ranged,neutral,'burst',false)>fightSkillPhase(ranged,neutral,'burst',true),'reach matters more when entry fails');
  check(fightSkillPhase(fast,neutral,'ext',true)>fightSkillPhase(neutral,neutral,'ext',true),'cooldowns matter in extended exchanges');
  check(fightSkillPhase(mobile,neutral,'clean',true)>1,'mobility affects cleanup');
  for(const own of [neutral,control,ranged,mobile,fast])for(const enemy of [neutral,control,ranged,mobile,fast])for(const phase of ['burst','ext','clean']){
    const x=fightSkillPhase(own,enemy,phase,false);check(x>=.92&&x<=1.08,'bounded phase multiplier');
    check(Math.abs(fightSkillEngage(own,enemy))<=.08,'bounded entry adjustment');
  }
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:10,div2:false})];cfg.internationals=[];
  const db=buildWorld(cfg),teams=activeTeams(db,null,1),a=teams[0],b=teams[1];startCareer(db,a.id,'skill-phase');autoBuildInitialSquad(db,a,new RNG('skill-start','squad'),5);finalizeInitialRosters(db);
  const champs=Object.values(db.patch.champions);for(const c of champs)for(const v of Object.values(championSkillProfile(c)))check(Number.isFinite(v),'finite source profile '+c.id);
  const initial=simulateMatch(db,a.id,b.id,'fixed-draft',null,true),forced={bans:initial.draft.bans,picks:initial.draft.picks};
  const occupied=[...forced.bans.flat(),...Object.values(forced.picks[0]),...Object.values(forced.picks[1])],controlled=champs.find(c=>c.roles.includes('MID')&&championSkillProfile(c).cc>.1&&championSkillProfile(c).cc<.8&&!occupied.includes(c.id));
  check(controlled,'missing eligible nonzero-control fixture');forced.picks[0].MID=controlled.id;const before=packDB(db);
  const baseline=Array.from({length:8},(_,i)=>simulateMatch(db,a.id,b.id,'skill-paired-'+i,{forced},true));
  check(packDB(db)===before,'isolated matches changed career state');
  const patched=unpackDB(before),cid=forced.picks[0].MID,c=patched.patch.champions[cid],profile=championSkillProfile(c),power=c.kit.burst;
  for(const slot of Object.keys(c.skills)){
    applyNote(patched.patch,{type:'skill',c:cid,slot,field:'ccMod',new:2});
    applyNote(patched.patch,{type:'skill',c:cid,slot,field:'range',new:[1200]});
    applyNote(patched.patch,{type:'skill',c:cid,slot,field:'cooldown',new:20});
  }
  const after=championSkillProfile(c);check(after.reach>=profile.reach&&c.kit.burst===power,'skill patch changed legacy kit');
  const changed=Array.from({length:8},(_,i)=>simulateMatch(patched,a.id,b.id,'skill-paired-'+i,{forced},true));
  check(changed.some((m,i)=>JSON.stringify(m.goldHist)!==JSON.stringify(baseline[i].goldHist)),'paired matches ignored actual skill patch');
  check(changed.every(m=>Number.isFinite(m.duration)&&m.sides.every(s=>s.ps.every(p=>Number.isFinite(p.dmg)))),'invalid match output');
  const restore=unpackDB(packDB(patched));check(JSON.stringify(championSkillProfile(restore.patch.champions[cid]))===JSON.stringify(after),'patched profile restore');
  const metrics=matches=>({blueWins:matches.filter(m=>m.winner===0).length,duration:avg(matches.map(m=>m.duration)),blueDamage:avg(matches.map(m=>m.sides[0].ps.reduce((n,p)=>n+p.dmg,0)))});
  const experiments=[];
  for(const [field,value] of [['ccMod',2],['range',[1200]],['cooldown',20]]){
    const variant=unpackDB(before);for(const slot of Object.keys(variant.patch.champions[cid].skills))applyNote(variant.patch,{type:'skill',c:cid,slot,field,new:value});
    const games=Array.from({length:8},(_,i)=>simulateMatch(variant,a.id,b.id,'skill-paired-'+i,{forced},true));
    check(JSON.stringify(championSkillProfile(variant.patch.champions[cid]))!==JSON.stringify(profile),'individual '+field+' did not change fixture profile');
    const outcome=m=>({gold:m.goldHist,damage:m.sides.map(s=>s.ps.map(p=>p.dmg)),duration:m.duration});
    check(games.some((m,i)=>JSON.stringify(outcome(m))!==JSON.stringify(outcome(baseline[i]))),'individual '+field+' patch did not reach actual match');
    experiments.push({field,profile:championSkillProfile(variant.patch.champions[cid]),metrics:metrics(games)});
  }
  console.log('FIGHT_SKILL_ACCEPTANCE '+JSON.stringify({champions:champs.length,pairs:8,champion:cid,before:profile,after,baseline:metrics(baseline),patched:metrics(changed),experiments,fixedDraft:true,sourceAssumption:'bounded aggregate phase interactions; no individual casts'}));
})()`,{filename:'fight-skill-acceptance.vm.js',timeout:120000});
