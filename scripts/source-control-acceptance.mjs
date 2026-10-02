import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
  const check=(x,m)=>{if(!x)throw Error('SOURCE_CONTROL '+m)};
  const source=CHAMPION_SOURCE_SNAPSHOT.champions;
  const skill=(id,slot)=>source[id].spells.find(s=>s.slot===slot);
  const english=sourceSkillControl({descriptionEn:'This ability roots and then disarms enemy champions.'});
  check(english?.types.includes('root')&&english.types.includes('disarm'),'English-only control descriptions');
  check(sourceSkillControl({descriptionKo:'적을 기절시킵니다.',descriptionEn:'This ability stuns an enemy.'}).types.length===1,
    'bilingual descriptions double-counted one control');
  check(sourceSkillControl({descriptionEn:'The caster becomes immune to stuns and slows.'})===null,
    'English self-immunity classified as enemy control');
  check(sourceSkillControl({descriptionEn:'Enemies are not immune to stuns.'})?.types.includes('stun'),
    'English negated immunity dropped an enemy control effect');
  check(sourceSkillControl({descriptionEn:'Deals damage to minions and monsters.'})===null,
    'English minion-only clause classified as champion control');
  const englishNormalized=normalizeSourceSkill('Q',{descriptionKo:'',descriptionEn:'This spell suppresses enemy champions.',cooldown:[10],range:[700]},{});
  check(englishNormalized.sourceDescription.includes('suppresses')&&englishNormalized.sourceControl?.types.includes('suppression'),
    'English fallback normalization');
  for(const [id,slot,type] of [['Xerath','E','stun'],['Xerath','W','slow'],['Morgana','Q','root'],['Malphite','R','airborne'],['Alistar','W','displacement'],['Zoe','E','sleep']])
    check(sourceSkillControl(skill(id,slot))?.types.includes(type),id+' '+slot+' source classification');
  for(const [id,slot] of [['Xerath','R'],['Olaf','R'],['MasterYi','R'],['Morgana','E'],['Alistar','R'],['Aatrox','R']])
    check(sourceSkillControl(skill(id,slot))===null,id+' '+slot+' self restriction/immunity/shield classified as attack control');
  const cc={type:'stun',duration:2};
  const normalized=normalizeSourceSkill('E',{...skill('Xerath','E'),numeric:{cc}}, {cooldown:10,cc:null});
  check(normalized.cc===cc,'explicit numeric CC precedence');
  const clone=JSON.parse(JSON.stringify(normalized));delete clone.sourceControl;
  check(championSkillProfile({skills:{E:normalized}}).cc===championSkillProfile({skills:{E:clone}}).cc,'numeric CC double counted');
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:10,div2:false})];cfg.internationals=[];
  const db=buildWorld(cfg),clubs=activeTeams(db,null,1),a=clubs[0],b=clubs[1];
  startCareer(db,a.id,'source-control');autoBuildInitialSquad(db,a,new RNG('source-control','squad'),5);finalizeInitialRosters(db);
  const xerath=championByName(db,'Xerath');check(xerath,'source champion missing');
  check(xerath.skills.E.sourceControl.types.includes('stun')&&!xerath.skills.R.sourceControl,'normalized source provenance');
  const initial=simulateMatch(db,a.id,b.id,'source-draft',null,true),forced=initial.draft;
  for(const picks of forced.picks)for(const role of ROLES)if(picks[role]===xerath.id)delete picks[role];
  forced.picks[0].MID=xerath.id;
  // Use a legal generated draft with Xerath available, rather than adding duplicate picks.
  const pool=Object.values(db.patch.champions);
  const used=new Set([xerath.id]);
  for(let side=0;side<2;side++)for(const role of ROLES){
    if(side===0&&role==='MID')continue;
    let id=forced.picks[side][role];
    if(!id||used.has(id))id=pool.find(c=>c.roles.includes(role)&&!used.has(c.id)).id;
    forced.picks[side][role]=id;used.add(id);
  }
  forced.bans=forced.bans.map(rows=>rows.filter(id=>!used.has(id)));
  const save=packDB(db),loaded=unpackDB(save);
  check(JSON.stringify(loaded.patch.champions[xerath.id].skills.E.sourceControl)===JSON.stringify(xerath.skills.E.sourceControl),'current source provenance save');
  const legacy=unpackDB(save);delete legacy.patches.sourceControlBaseline;
  for(const s of Object.values(legacy.patch.champions[xerath.id].skills))delete s.sourceControl;
  legacy.patch.id='legacy-current';
  check(!getPatch(legacy,'26.19').champions[xerath.id].skills.E.sourceControl,'legacy historical rebuild acquired new control tags');
  loaded.patch.id='new-current';
  check(getPatch(loaded,'26.19').champions[xerath.id].skills.E.sourceControl?.types.includes('stun'),'new historical rebuild lost source baseline');
  loaded.patch.id=db.patch.id;
  const oldProfile=championSkillProfile(legacy.patch.champions[xerath.id]),profile=championSkillProfile(xerath);
  applyNote(loaded.patch,{type:'skill',c:xerath.id,slot:'E',field:'ccMod',old:1,new:2});
  check(championSkillProfile(loaded.patch.champions[xerath.id]).cc>profile.cc,'source control ignored CC patch');
  applyNote(loaded.patch,{type:'skill',c:xerath.id,slot:'E',field:'ccMod',old:2,new:1});
  check(JSON.stringify(championSkillProfile(loaded.patch.champions[xerath.id]))===JSON.stringify(profile),'source CC reversal');
  check(profile.cc>oldProfile.cc,'source-only control failed to reach profile');
  check(!unpackDB(packDB(legacy)).patch.champions[xerath.id].skills.E.sourceControl,'legacy save retroactively rewritten');
  const results=[];
  for(let i=0;i<4;i++){
    const baseline=simulateMatch(legacy,a.id,b.id,'control-pair-'+i,{forced},true),current=simulateMatch(db,a.id,b.id,'control-pair-'+i,{forced},true);
    results.push(JSON.stringify(baseline.goldHist)!==JSON.stringify(current.goldHist)||baseline.duration!==current.duration);
  }
  check(results.some(Boolean),'source control had no actual match effect');
  const englishMatch=unpackDB(save),localizedMatch=unpackDB(save),englishSkills=englishMatch.patch.champions[xerath.id].skills,
    localizedSkills=localizedMatch.patch.champions[xerath.id].skills;
  for(const s of Object.values(englishSkills))delete s.sourceControl;
  for(const s of Object.values(localizedSkills))delete s.sourceControl;
  englishSkills.E.descriptionKo='';englishSkills.E.descriptionEn='This spell stuns enemy champions.';
  englishSkills.W.descriptionKo='';englishSkills.W.descriptionEn='This spell slows enemy champions.';
  localizedSkills.E.descriptionKo='적을 기절시키고 피해를 입힙니다.';localizedSkills.E.descriptionEn='';
  localizedSkills.W.descriptionKo='적을 둔화시킵니다.';localizedSkills.W.descriptionEn='';
  for(const slot of ['E','W']){
    englishSkills[slot].sourceControl=sourceSkillControl(englishSkills[slot]);
    localizedSkills[slot].sourceControl=sourceSkillControl(localizedSkills[slot]);
  }
  check(JSON.stringify(championSkillProfile(englishMatch.patch.champions[xerath.id]))===
    JSON.stringify(championSkillProfile(localizedMatch.patch.champions[xerath.id])),'English tags did not reach the same aggregate profile');
  const englishResults=Array.from({length:4},(_,i)=>simulateMatch(englishMatch,a.id,b.id,'english-control-'+i,{forced},true)),
    localizedResults=Array.from({length:4},(_,i)=>simulateMatch(localizedMatch,a.id,b.id,'english-control-'+i,{forced},true));
  check(JSON.stringify(englishResults.map(m=>[m.goldHist,m.duration]))===
    JSON.stringify(localizedResults.map(m=>[m.goldHist,m.duration])),'English source changed actual match semantics');
  check(packDB(db)===save,'source inspection/matches mutated world');
  let recognized=0;for(const c of Object.values(source))for(const s of c.spells)if(sourceSkillControl(s))recognized++;
  console.log('SOURCE_CONTROL_ACCEPTANCE '+JSON.stringify({champions:Object.keys(source).length,recognized,pairs:4,profile,oldProfile,englishOnly:true,bilingualDedup:true,negativeClauses:true,legacy:true}));
})()`,{filename:'source-control.fixture.js',timeout:120000});
