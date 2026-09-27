import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(import.meta.dirname, '..');
const artifact = resolve(root, 'src', 'artifact');
const modules = [
  'champion-source.js', 'engine.js', 'data.js', 'champs2.js', 'patch.js', 'competition.js',
  'world.js', 'office.js', 'finance.js', 'features.js', 'career.js',
];

let source = '';
for (const file of modules) source += `${await readFile(resolve(artifact, file), 'utf8')}\n`;
source += `\n(()=>{
  const db=buildWorld();
  if(db.patch.championSource.matched<170||db.patch.championSource.matched!==db.patch.championSource.total)throw new Error('Authoritative champion baseline coverage incomplete: '+JSON.stringify(db.patch.championSource));
  if(!db||db.version!==14) throw new Error('Unexpected save schema');
  if(!db.worldDate||!db.worldConfig.universalLanguage) throw new Error('World bootstrap settings failed');
  const intl=Object.fromEntries(db.worldConfig.internationals.map(x=>[x.id,x]));
  const expectedIntl=['FIRST_STAND','MID_SEASON_INVITATIONAL','EASTERN_CUP','WESTERN_CUP','WORLD_CHAMPIONSHIP','MASTERS','OPEN'];
  if(expectedIntl.some(id=>!intl[id]))throw new Error('Canonical international ecosystem missing');
  if(intl.FIRST_STAND.teams!==12||intl.FIRST_STAND.baseSlots!==2||intl.FIRST_STAND.groupBo!==3||intl.FIRST_STAND.knockoutBo!==5)throw new Error('First Stand spec drift');
  if(intl.MID_SEASON_INVITATIONAL.teams!==16||intl.MID_SEASON_INVITATIONAL.baseSlots!==2||intl.MID_SEASON_INVITATIONAL.extraSlots!==4||intl.MID_SEASON_INVITATIONAL.knockoutBo!==5)throw new Error('MSI spec drift');
  if(intl.EASTERN_CUP.teams!==8||intl.WESTERN_CUP.teams!==8)throw new Error('Regional Cup spec drift');
  if(intl.WORLD_CHAMPIONSHIP.teams!==24||intl.WORLD_CHAMPIONSHIP.baseSlots!==4||intl.WORLD_CHAMPIONSHIP.maxSlots!==4||intl.WORLD_CHAMPIONSHIP.pots!==3||intl.WORLD_CHAMPIONSHIP.potSize!==8||intl.WORLD_CHAMPIONSHIP.leagueMatches!==6||intl.WORLD_CHAMPIONSHIP.leagueBo!==3||intl.WORLD_CHAMPIONSHIP.knockoutTake!==16)throw new Error('Worlds spec drift');
  if(intl.MASTERS.teams!==16||intl.MASTERS.baseSlots!==2||intl.MASTERS.maxSlots!==3||intl.MASTERS.extraSlots!==4)throw new Error('Masters slot spec drift');
  if(intl.OPEN.teams!==12||intl.OPEN.baseSlots!==2||intl.OPEN.maxSlots!==2)throw new Error('Open slot spec drift');

  const active=activeTeams(db);
  if(active.length<2||active.some(t=>t.roster.length!==0)) throw new Error('First-season teams are not blank');
  for(const R of Object.values(db.regions)){const first=activeTeams(db,R.id,1);if(first.length<10||first.length!==R.teams)throw new Error('Top-league size invariant failed: '+R.id+' '+first.length+'/'+R.teams)}
  const players=Object.values(db.players);
  if(players.length<10||players.some(p=>p.team||p.contract)) throw new Error('Initial player pool is not fully FA');
  for(const R of Object.values(db.regions)){
    if(R.policyMode!=='engine'||!R.policyBasis||R.policyBasis.source!=='engine')throw new Error('Region policy is not engine-owned: '+R.id);
    if(R.payScale==null||R.importLimit==null||R.importRecruitMinGap==null||!R.rosterRuleProfile||!R.marketProfile||!R.office||R.spendingRule==null)throw new Error('Policy engine left unresolved output: '+R.id);
  }
  const namedPolicies=['KR','CN','EU','NA','AP','BR'].map(id=>db.regions[id]).filter(Boolean);
  if(namedPolicies.some(R=>R.sfrMode==='kr_progressive'||R.sfrMode==='lec_50_100'))throw new Error('Named-region hand policy leaked into engine world');
  if(PAY_SCALE.KR||PAY_SCALE.CN||PAY_SCALE.EU||PAY_SCALE.NA)throw new Error('Named regional pay scales are still hardcoded');
  const rookieR=db.regions[Object.keys(db.regions)[0]],rp=rookieIntakeProfile(db,rookieR),rc=generateRookieClass(db,rookieR,new RNG('rookie-smoke','class')),ri=rookieR.rookieIntake.slice(-1)[0];
  if(rc.length!==ri.profile.count||rc.some(p=>p.age<17||p.age>19||!p.rookieTier||p.entryYear!==db.year))throw new Error('Engine rookie class generation failed');
  if(rp.freeBuffer<rp.teams*.75)throw new Error('Rookie market liquidity buffer is too small');
  if(ri.profile.count<Math.max(ri.profile.totalGap,Math.max(5,Math.round(ri.profile.first*.55))))throw new Error('Rookie cohort volume broke labor-market floor');
  if(!(rp.ecosystem>0)||!ri.profile.classWave||!ri.label||!ri.profile.roleWaves)throw new Error('Rookie cohort engine state missing');
  if(!['흉작','약한 세대','평년','풍년','황금세대'].includes(ri.label))throw new Error('Rookie class label invalid');
  if(typeof generateEmergencyRookie!=='undefined')throw new Error('Per-team emergency rookie generation still exists');
  const supplyCheck=talentSupplyErrors(db);if(supplyCheck.length)throw new Error('Talent supply invariant failed: '+supplyCheck.slice(0,5).join(' | '));
  const waves=[],labels=new Set();for(let i=0;i<320;i++){const tmp={...rp},tr=new RNG('elite-wave-'+i,'tier');waves.push(rookieTier(tr,tmp,2.1));labels.add(rookieClassLabel(clamp(Math.exp(tr.normal(0,.34)),.48,1.85)))}if(!waves.includes('elite'))throw new Error('Elite rookie probability collapsed under strong class wave');if(!labels.has('흉작')||!labels.has('풍년'))throw new Error('Rookie year variance collapsed');
  if(ROLES.reduce((n,r)=>n+rc.filter(p=>p.role===r).length,0)!==rc.length)throw new Error('Rookie role supply failed');
  const custom=buildWorld({regions:[regionCfg('ZZ',{id:'ZZ',name:'테스트',leagueName:'ZZL',short:'ZZL',teams:10,strength:66,div2:true,system:'franchise',payScale:.7})],internationals:[],subs:1,changes:'normal',startYear:2027,manage:'manual',universalLanguage:true});
  if(Object.values(custom.regions).some(r=>r.teams<10)) throw new Error('Top-league minimum team count failed');
  for(const n of [18,20]){
    const large=buildWorld({regions:[regionCfg('LG'+n,{id:'LG'+n,name:'대형 테스트 '+n,leagueName:'L'+n,short:'L'+n,teams:n,strength:66,div2:false,system:'franchise',payScale:.7})],internationals:[],subs:1,changes:'normal',startYear:2027,manage:'manual',universalLanguage:true});
    const lr=large.regions['LG'+n],lt=activeTeams(large,'LG'+n,1);
    if(lr.teams!==n||lt.length!==n)throw new Error('Expanded top league failed at '+n+' teams');
    const stages=leagueStages(lr,lt.length,1),rr=stages.find(x=>x.id==='regular');
    if(!rr||roundRobin(lt.map(t=>t.id),rr.legs||1).length!==(n-1)*(rr.legs||1))throw new Error('Expanded league schedule failed at '+n+' teams');
  }
  const z=custom.regions.ZZ;if(!z.policyBasis||z.policyBasis.source!=='engine'||!z.rosterRuleProfile||z.importLimit==null||!z.marketProfile||z.spendingRule==null)throw new Error('Policy engine did not resolve custom-region rules');
  if(z.rosterRuleProfile!=='ENGINE_OWNED_RESERVE')throw new Error('Policy engine ignored owned-reserve structure');
  if((db.patches.cadence||14)!==14)throw new Error('Patch cadence should begin on Riot-style 14-day baseline');const champDetail=Object.values(db.patch.champions);if(champDetail.some(c=>!c.skills||['P','Q','W','E','R'].some(k=>!c.skills[k])||!Number.isFinite(c.base.mr)||!Number.isFinite(c.base.mrg)||!Number.isFinite(c.base.asg)||c.base.resource===undefined))throw new Error('Champion detail schema incomplete');if(champDetail.some(c=>!['curated','generated_fallback','riot_ddragon'].includes(c.detailSource)))throw new Error('Champion detail provenance missing');const probeBase=buildPatch(),probeChamp=Object.values(probeBase.champions)[0],probeAlias=probeChamp.name.replace(/[^a-z0-9]/gi,'');const probeSnap={version:CHAMPION_SOURCE_PATCH,champions:{probe:{riotKey:999999,alias:probeAlias,nameKo:'검증',base:{hp:777,hpg:99,ad:66,adg:3,arm:35,armg:4,mr:31,mrg:1.5,as:.7,asg:2.5,range:500,ms:340,resource:400,resourceg:20,resourceRegen:8},passive:{nameKo:'패시브',nameEn:'Passive'},spells:['Q','W','E','R'].map(slot=>({slot,nameKo:slot+'스킬',nameEn:slot+' Spell',cooldown:[9]}))}}};const sourced=buildPatch(probeSnap),sc=sourced.champions[probeChamp.id];if(sc.detailSource!=='riot_ddragon'||sc.base.hp!==777||sc.skills.Q.cooldown!==9||sourced.championSource.matched!==1)throw new Error('Champion source merge failed');if(championLabel({patch:sourced},sc.id)!=='검증'||championDisplayName(sc)!=='검증')throw new Error('Champion Korean display-name preference failed');const structuredRaw={slot:'Q',nameKo:'구조화Q',cooldown:[8],cost:[40],range:[900],numeric:{baseDamage:[80,120,160,200,240],ratios:{ap:.7},cc:{type:'slow',duration:1.5},recast:true},provider:'CommunityDragon'};const normalized=normalizeSourceSkill('Q',structuredRaw,sc.skills.Q),structuredChamp={...sc,skills:{...sc.skills,Q:normalized}},sp0=championSkillProfile(sc),sp1=championSkillProfile(structuredChamp);if(normalized.baseDamage[4]!==240||normalized.ratios.ap!==.7||!normalized.recast||sp1.structured<=sp0.structured||sp1.power<=sp0.power)throw new Error('Structured champion skill data not consumed');const metaFilterProbe={...db,metaHistory:[]};recordMeta(metaFilterProbe,{date:'2026-01-02',patch:db.patch.id,comp:'FILTER_TEST',winner:0,sides:[{team:{region:'LCK'},ps:[{champ:sc}]},{team:{region:'LPL'},ps:[{champ:probeChamp}]}],draft:{bans:[[sc.id],[]]}});const filtered=metaTableFiltered(metaFilterProbe,{region:'LCK',comp:'FILTER_TEST',from:'2026-01-01',to:'2026-01-03'}).find(x=>x.c.id===sc.id);if(!filtered||filtered.p!==1||filtered.w!==1||filtered.b!==1)throw new Error('Filtered champion meta history failed');const cp=championSkillProfile(champDetail[0]);if(!Number.isFinite(cp.power)||!Number.isFinite(cp.uptime))throw new Error('Champion skill profile failed');
  const metaProbe=buildWorld(),mc=Object.values(metaProbe.patch.champions)[0];mc.proEligibleDate='2027-02-01';metaProbe.worldDate='2027-01-20';if(championProEligible(metaProbe,mc))throw new Error('Global pro ban failed before eligibility date');metaProbe.worldDate='2027-02-01';if(!championProEligible(metaProbe,mc))throw new Error('Champion did not unlock on pro eligibility date');const lockProbe=buildWorld(),lc=Object.values(lockProbe.patch.champions)[0];lc.proEligibleDate='2027-02-01';lockProbe.worldDate='2027-01-20';const lockTeams=activeTeams(lockProbe).slice(0,2).map(t=>t.id),lockComp={id:'LOCK',teams:lockTeams,stages:[{id:'rr',name:'RR',type:'round_robin',legs:1,bo:1}]};lockProbe.competitions={LOCK:lockComp};newSeason(lockProbe,'LOCK',2027,'lock','2027-01-20');if(lockComp.championPool.includes(lc.id))throw new Error('Tournament pool included globally banned champion');lockProbe.worldDate='2027-02-05';if(!championProEligible(lockProbe,lc)||lockComp.championPool.includes(lc.id))throw new Error('Tournament pool did not remain locked after global unlock');lockProbe.worldDate='2027-01-20';if(!championAvailableForContext(lockProbe,lc,{practice:true})||championAvailableForContext(lockProbe,lc,{championPool:lockComp.championPool}))throw new Error('Practice/global-ban champion availability rules failed');
  const mA=activeTeams(metaProbe)[0],mB=activeTeams(metaProbe).find(t=>t.region!==mA.region);if(mA&&mB){const fake={winner:0,sides:[{team:mA,ps:[{champ:mc}]},{team:mB,ps:[{champ:mc}]}],draft:{bans:[[mc.id],[]]}};recordMeta(metaProbe,fake);if(!metaProbe.regionMetaStats[mA.region]?.[mc.id]||!metaProbe.regionMetaStats[mB.region]?.[mc.id])throw new Error('Regional meta tracking failed');if(metaTable(metaProbe,mA.region)[0].sample<1)throw new Error('Regional meta sample missing');const before=metaTable(metaProbe,mA.region).find(x=>x.c.id===mc.id);if(!before||before.p<1||before.b<1)throw new Error('Regional meta detail counts missing')}
  const patchDates=['2027-01-01','2027-01-15','2027-01-29'];const pDb=buildWorld();const prng=new RNG('patch-realism','p');seasonPatch(pDb,patchDates[0],prng);const p0=pDb.patches.list.length;patchTick(pDb,patchDates[1],prng);patchTick(pDb,patchDates[2],prng);if(pDb.patches.list.length<p0+1)throw new Error('Biweekly patch cadence failed');
  if(players.some(p=>!p.nationality||!p.roleFamiliarity||p.roleFamiliarity[p.role]!==100||!p.development||p.reputation===undefined||!Array.isArray(p.careerEvents))) throw new Error('Player identity/development schema failed');
  const sample=players[0];pState(sample);
  for(const key of ['form','condition','fatigue','morale','sharpness','teamAdaptation','tacticalAdaptation']) if(sample[key]===undefined) throw new Error('Player state missing: '+key);
  if(playerMod(sample)<-.111||playerMod(sample)>.091) throw new Error('Player state modifier escaped bounded range');
  const synthetic={id:'synthetic',role:'JGL',attrs:Object.fromEntries(ALL_ATTRS.map(a=>[a,50])),roleFamiliarity:{JGL:100,ADC:100},secondaryRoles:['ADC']};
  synthetic.attrs.smite_execution=99;synthetic.attrs.objective_setup=99;synthetic.attrs.map_awareness=92;synthetic.attrs.crossmap_decision=92;
  if(playerRoleRating(synthetic,'JGL')<=playerRoleRating(synthetic,'ADC')) throw new Error('Position-specific player rating failed');
  const secRole=SECONDARY_ROLE_OPTIONS[sample.role][0],secBefore=roleFamiliarity(sample,secRole);trainSecondaryRole(sample,secRole,4);
  if(roleFamiliarity(sample,secRole)<=secBefore) throw new Error('Secondary-role learning failed');
  const poolEntry=Object.keys(sample.pool)[0],practiceBefore=(sample.pool[poolEntry].trainingExperience||0);practiceChampion(db,sample,poolEntry,'training',3);
  if((sample.pool[poolEntry].trainingExperience||0)<=practiceBefore) throw new Error('Champion training experience failed');
  const intensityProbe=active.find(t=>t.id!==managedTeamId(db));if(intensityProbe){intensityProbe.training=defaultTraining();for(const id of intensityProbe.roster){const p=db.players[id];if(p){p.fatigue=55;p.condition=78}}aiManageTraining(db,intensityProbe);if(intensityProbe.training.intensity!=='light')throw new Error('AI did not reduce training under fatigue')}
  if(intensityProbe){const rr=trainingRecommendation(db,intensityProbe);if(!['light','normal','high'].includes(rr.intensity)||typeof rr.scrim!=='boolean')throw new Error('Training recommendation invalid')}
  const scrimReady=t=>ROLES.every(role=>starterFor(db,t,role)),scrimA=active.find(scrimReady),scrimB=active.find(t=>t.id!==scrimA?.id&&scrimReady(t));if(scrimA&&scrimB){const v0=scrimValue(db,scrimA.id,scrimB.id);scrimA.scrimLog=[{date:db.worldDate,games:1,opponent:scrimB.id},{date:db.worldDate,games:1,opponent:scrimB.id},{date:db.worldDate,games:1,opponent:scrimB.id}];const v1=scrimValue(db,scrimA.id,scrimB.id);if(!(v1<v0))throw new Error('Repeated scrim partner did not lose practice value');scrimA.scrimLog=[]}if(scrimA&&scrimB){const scrimSeries=simulateSeries(db,scrimA.id,scrimB.id,1,'smoke-scrim',{fearless:true,firstChoice:'coin',replay:true}),scrimLine=scrimSeries.lines[0],scrimPlayer=db.players[scrimLine.pid],scrimProfile=ensureChampionProfile(db,scrimPlayer,scrimLine.champ),scrimBefore=scrimProfile.scrimExperience||0,fatigueBefore=scrimPlayer.fatigue||0;recordScrimPractice(db,scrimSeries.rec,scrimSeries.lines);if(scrimProfile.scrimExperience<=scrimBefore||scrimPlayer.fatigue<=fatigueBefore||!(db.teams[scrimLine.tid].scrimIntel>0))throw new Error('Scrim practice effects failed')}
  if(!(playerMarketValue(db,sample)>0)||!['신인','성장','전성기','쇠퇴'].includes(careerStage(sample))) throw new Error('Player value/lifecycle failed');
  const veteranStage=careerStage({...sample,age:27,proSeasons:0,development:{...sample.development,peakAge:25}});if(veteranStage==='신인')throw new Error('Veteran lifecycle incorrectly classified as rookie');
  ensureSatisfaction(sample);if(!SQUAD_ROLES.includes(recommendedRosterRole(db,sample,active[0]))||!CAREER_GOAL_KO[playerCareerGoal(sample)]) throw new Error('Player roster role/career goal failed');
  const core=playerCoreMetrics(sample),coreKeys=['laning','skirmish','teamfight','positioning','damage','survival','vision','objective','roaming','macro','sidelane','decision','stability','aggression','concentration','adaptability','volatility','championLearning','metaAdaptation'];
  if(coreKeys.some(k=>!Number.isFinite(core[k])||core[k]<0||core[k]>100)) throw new Error('Player core metric derivation failed');
  const patchProbe=JSON.parse(JSON.stringify(sample)),patchBefore=patchProbe.pool[poolEntry].mastery;
  patchProbe.attrs.meta_adaptation=20;adaptPlayerPoolsToPatch({players:{probe:patchProbe}},[{type:'kit',c:poolEntry}],true);
  if(patchProbe.pool[poolEntry].mastery>patchBefore) throw new Error('Patch re-adaptation failed');
  const growthProbe=JSON.parse(JSON.stringify(sample)),growthAge=growthProbe.age,growthExp=growthProbe.pool[poolEntry].experience;
  growthProbe.team=null;growthProbe.contract=null;growPlayer(db,growthProbe,new RNG('player-growth-smoke','growth'),12,{[poolEntry]:6});
  if(growthProbe.age!==growthAge+1||growthProbe.pool[poolEntry].experience<=growthExp) throw new Error('Player lifecycle/champion growth failed');
  recordPlayerEvent(growthProbe,'transfer',db.year,{from:'A',to:'B',fee:1});
  if(!growthProbe.careerEvents.some(e=>e.type==='transfer'&&e.to==='B')) throw new Error('Player career event persistence failed');
  const persisted=unpackDB(packDB(db)),persistedPlayer=persisted.players[sample.id];
  if(!persistedPlayer||persisted.version!==14||persistedPlayer.nationality!==sample.nationality||persistedPlayer.reputation!==sample.reputation||!persistedPlayer.development||!persistedPlayer.roleFamiliarity||!persistedPlayer.pool[poolEntry]||persistedPlayer.pool[poolEntry].trainingExperience!==sample.pool[poolEntry].trainingExperience) throw new Error('Player save round-trip failed');

  const selectable=managerSelectableTeams(db), independent=active.filter(t=>!t.parent);
  if(!selectable.length||selectable.some(t=>t.parent)) throw new Error('Manager-selectable team filter failed');
  if(selectable.length!==independent.length) throw new Error('Independent club selection coverage failed');

  const ownedReserveFixture=active.find(t=>t.parent);
  if(ownedReserveFixture){
    const originalParent=ownedReserveFixture.parent;
    ownedReserveFixture.parent=null;
    const div2Selectable=managerSelectableTeams(db,ownedReserveFixture.region,2);
    if(!isManagerSelectableTeam(db,ownedReserveFixture)||!div2Selectable.some(t=>t.id===ownedReserveFixture.id)) throw new Error('Independent second-division club selection failed');
    const fixtureRules=rosterRulesForTeam(db,ownedReserveFixture),fixtureLimits=initialSquadLimits(db,ownedReserveFixture);
    if(fixtureLimits.min!==fixtureRules.firstTeamMin||fixtureLimits.max!==fixtureRules.firstTeamMax) throw new Error('Independent second-division club did not use first-team roster limits');
    ownedReserveFixture.parent=originalParent;
    if(isManagerSelectableTeam(db,ownedReserveFixture)) throw new Error('Owned reserve became manager-selectable after fixture restore');
  }

  const careerTeam=selectable.find(t=>!t.parent&&reserveTeamsOf(db,t).length===1)||selectable.find(t=>!t.parent&&reserveTeamsOf(db,t).length)||selectable[0];
  startCareer(db,careerTeam.id,'smoke-world');
  if(db.world.phase!=='initial_roster'||db.manager.startMode!=='blank_roster') throw new Error('Initial roster phase did not start');

  const mine=setupTeamsForManager(db);
  if(!mine.length) throw new Error('Managed organization has no setup squads');
  const userRng=new RNG('smoke-user-roster','user');
  const managedRoot=parentTeamOf(db,careerTeam)||careerTeam,ownedReserves=reserveTeamsOf(db,managedRoot);

  // 첫 시즌도 즉시계약이 아니라 관심 → 관찰 → 내부평가 → 공식 협상을 실제로 거친다.
  const initialFa=Object.values(db.players).filter(p=>!p.retired&&!p.team).find(p=>initialSignCheck(db,p,managedRoot).ok);
  if(!initialFa)throw new Error('No affordable initial-roster FA target');
  if(!setRecruitmentPriority(db,initialFa.id,'A').ok)throw new Error('Initial recruitment interest failed');
  observePlayer(db,initialFa,90,{comp:'initial-market-smoke',games:4});syncRecruitmentObservation(db,initialFa.id);
  const initialEval=recruitmentEvaluation(db,initialFa.id,managedRoot.id);if(!initialEval.ok||initialEval.target.evaluation?.teamId!==managedRoot.id)throw new Error('Initial internal evaluation failed');
  const initialNeg=startNegotiation(db,initialFa.id,'initial',{teamId:managedRoot.id});if(!initialNeg.ok||initialNeg.neg.kind!=='initial')throw new Error('Initial formal negotiation failed to start');
  const initialDemand=initialNeg.neg.demand,initialOffer={...initialDemand,salary:Math.min(initialDemand.salary,Math.max(.1,initialSalaryCeiling(db,managedRoot)-payroll(db,managedRoot)))};
  const initialResult=submitNegotiationOffer(db,initialNeg.neg.id,initialOffer);
  if(!initialResult.ok||initialFa.team!==managedRoot.id||!initialFa.contract)throw new Error('Initial formal contract negotiation did not sign player');
  if(recruitmentTarget(db,initialFa.id)?.result!=='signed')throw new Error('Initial recruitment target did not close after signing');
  if(ownedReserves.length){
    autoBuildInitialSquad(db,managedRoot,userRng,5);
    autoBuildInitialSquad(db,ownedReserves[0],userRng,6);
    for(const t of ownedReserves.slice(1)) autoBuildInitialSquad(db,t,userRng,5);
    if(managedRoot.roster.length!==5||ownedReserves[0].roster.length!==6) throw new Error('5+6 owned-reserve boundary roster setup failed');
  } else autoBuildInitialSquad(db,managedRoot,userRng,INITIAL_ROSTER_TARGET);
  const myErrors=initialOrganizationErrors(db,careerTeam);
  if(myErrors.length) throw new Error('Managed initial roster invalid: '+myErrors.join(' | '));

  finalizeInitialRosters(db);
  if(db.world.phase!=='season'||!db.manager.careerStartedAt) throw new Error('Season did not start after roster finalization');
  const scoutTarget=Object.values(db.players).find(p=>p.team&&p.team!==managedTeamId(db)&&!(db.teams[p.team]&&db.teams[p.team].parent===managedTeamId(db)));
  if(!scoutTarget)throw new Error('No scouting target');
  const k0=knowledge(db,scoutTarget),pr0=scoutPotentialRange(db,scoutTarget);observePlayer(db,scoutTarget,20,{comp:'test',games:3});const k1=knowledge(db,scoutTarget),pr1=scoutPotentialRange(db,scoutTarget),sr=scoutReport(db,scoutTarget);
  if(k1<=k0||!sr||sr.observations<1||pr1[1]-pr1[0]>pr0[1]-pr0[0])throw new Error('Scouting observation did not narrow report');
  const y0=db.year;db.year++;ageScoutReports(db);if(knowledge(db,scoutTarget)>=k1)throw new Error('Stale scouting report did not decay');db.year=y0;
  const krTeam=activeTeams(db,'KR',1)[0];if(regulatedPayroll(db,krTeam)>payroll(db,krTeam)+.001)throw new Error('SFR payroll exceeds total payroll');
  if(db.regions.KR.spendingRule==='sfr_top5'&&regulatedPayroll(db,krTeam)!==krTeam.roster.map(id=>db.players[id].contract.salary).sort((a,b)=>b-a).slice(0,5).reduce((a,b)=>a+b,0))throw new Error('SFR is not based on top five salaries');
  for(const t of activeTeams(db)){initializeDepthChart(db,t,false);for(const role of ROLES)if(!starterFor(db,t,role))throw new Error('Depth chart missing starter: '+t.id+' '+role);for(const id of t.roster){const p=db.players[id];ensureSatisfaction(p);if(!SQUAD_ROLES.includes(p.rosterRole)||p.satisfaction<0||p.satisfaction>100)throw new Error('Initial player role/satisfaction failed')}}
  const satTeam=managedRoot,satP=db.players[satTeam.roster[0]],originalSatRole=satP.rosterRole;setRosterRole(db,satP,'core','manager',false);const su=usageFor(satP,db.year);su.teamGames=32;su.games=3;su.series=20;su.teamWins=9;satP.satisfaction=14;satP.concernStreak=9;applySatisfaction(db,satP);
  if(!satP.wantsOut||!satP.satisfactionReasons.includes('playing_time'))throw new Error('Long-term playing-time dissatisfaction did not create transfer request');
  const offIssues=satisfactionIssues(db,satP,{offseason:true,year:db.year});if(!offIssues.some(x=>x.code==='playing_time'))throw new Error('Offseason satisfaction ignored completed-season usage');
  su.games=28;su.teamWins=20;satP.satisfaction=55;applySatisfaction(db,satP);if(satP.wantsOut)throw new Error('Transfer request withdrawal failed');
  const benchProbe={...satP,id:'bench-probe',rosterRole:'backup',satisfaction:70,satisfactionReasons:[],concernStreak:0,wantsOut:false,wantsOutReason:null,usage:{year:db.year,teamGames:30,games:0,series:15,wins:0,teamWins:15,intlGames:0,teamIntlGames:0,firstTeamGames:0,reserveGames:0}};if(satisfactionIssues(db,benchProbe).some(x=>x.code==='playing_time'))throw new Error('Backup player complained about normal bench usage');
  const dupTeam=activeTeams(db).find(t=>ROLES.some(r=>t.roster.filter(id=>db.players[id]&&db.players[id].role===r).length>=2));
  if(dupTeam){const role=ROLES.find(r=>dupTeam.roster.filter(id=>db.players[id]&&db.players[id].role===r).length>=2),pair=dupTeam.roster.map(id=>db.players[id]).filter(p=>p.role===role),fixed=pair[0],other=pair[1];setDepthStarter(db,dupTeam,role,fixed,'test',true);const before=starterFor(db,dupTeam,role);if(before!==fixed)throw new Error('Manual depth chart starter was not respected');for(const a of Object.keys(other.attrs))other.attrs[a]=Math.min(99,other.attrs[a]+2);if(starterFor(db,dupTeam,role)!==fixed)throw new Error('Small OVR change incorrectly auto-swapped fixed starter');setDepthStarter(db,dupTeam,role,other,'test',true);if(starterFor(db,dupTeam,role)!==other)throw new Error('Explicit starter change failed');}
  setRosterRole(db,satP,originalSatRole||recommendedRosterRole(db,satP,satTeam),'manager',true);satP.usage={year:db.year,teamGames:0,games:0,series:0,wins:0,teamWins:0,intlGames:0,teamIntlGames:0,firstTeamGames:0,reserveGames:0};
  for(const t of activeTeams(db)){
    const e=initialSquadErrors(db,t);
    if(e.length) throw new Error('Final initial roster invalid: '+t.id+' '+e.join(' | '));
  }

  const staffTeam=managedRoot;ensureTeamStaff(db,staffTeam,new RNG('staff-smoke','staff'));genStaffPool(db,new RNG('staff-pool-smoke','staff'));
  const profile0=staffProfile(staffTeam),staffCandidate=(db.staffPool||[]).find(x=>x.role==='analyst');if(!staffCandidate)throw new Error('Staff market missing analyst');
  const oldAnalyst=staffTeam.staff.analyst;staffCandidate.rating=95;hireStaff(db,staffTeam,staffCandidate);if(staffProfile(staffTeam).analysis<=profile0.analysis)throw new Error('Analyst hire did not improve analysis effect');
  const fac=ensureFacilities(staffTeam),oldTrain=fac.training,oldCash=staffTeam.finance.cash;staffTeam.finance.cash=Math.max(oldCash,facilityCost(db,staffTeam,'training')*2);if(oldTrain<5){const mul0=facilityMul(staffTeam);upgradeFacility(db,staffTeam,'training');if(facilityMul(staffTeam)<=mul0)throw new Error('Training facility upgrade had no development effect')}
  if(!Number.isFinite(staffCost(db,staffTeam))||staffCost(db,staffTeam)<=0)throw new Error('Full staff cost invalid');
  staffTeam.staff.analyst=oldAnalyst;staffTeam.finance.cash=oldCash;
  const aiStaffTeam=activeTeams(db,null,1).find(t=>t.id!==managedTeamId(db));if(!aiStaffTeam)throw new Error('AI staff test team missing');ensureTeamStaff(db,aiStaffTeam,new RNG('ai-staff','staff'));genStaffPool(db,new RNG('ai-staff-pool','staff'));aiStaffTeam.finance.cash=Math.max(aiStaffTeam.finance.cash,500*psOf(db,aiStaffTeam.region));const role='analyst',beforeStaff=aiStaffTeam.staff[role];const elite=genStaffMember(new RNG('elite-ai-staff','staff'),role,95);elite.rating=95;db.staffPool.push(elite);aiManageStaff(db,aiStaffTeam,new RNG('ai-staff-manage','staff'));if(aiStaffTeam.staff[role].rating<beforeStaff.rating)throw new Error('AI staff management downgraded role');
  const staffAge=aiStaffTeam.staff[role].age;ageStaff(db,new RNG('staff-age','staff'));if(aiStaffTeam.staff[role].age<staffAge)throw new Error('Staff lifecycle age regressed');
  const staffRoundTrip=unpackDB(packDB(db)),rt=staffRoundTrip.teams[staffTeam.id];if(!rt.staff||!rt.staff.analyst||!rt.facilities||!['training','analysis','recovery','youth'].every(k=>Number.isFinite(rt.facilities[k])))throw new Error('Staff/facility save round-trip failed');
  const poorTeam=activeTeams(db,null,1).find(t=>t.id!==staffTeam.id&&t.id!==aiStaffTeam.id);if(poorTeam){ensureFacilities(poorTeam);poorTeam.finance.cash=0;const before=JSON.stringify(poorTeam.facilities);for(const k of ['training','analysis','recovery','youth']){try{upgradeFacility(db,poorTeam,k)}catch(e){}}if(JSON.stringify(poorTeam.facilities)!==before)throw new Error('Facility upgraded without funds')}

  const reserveParents=activeTeams(db).filter(t=>!t.parent&&reserveTeamsOf(db,t).length);
  if(reserveParents.length){
    const parent=reserveParents[0],reserve=reserveTeamsOf(db,parent)[0],up=db.players[reserve.roster[0]],down=db.players[parent.roster[0]];
    const plan=rosterPlanState(db,parent),beforeParent=parent.roster.slice(),beforeReserve=reserve.roster.slice();
    plan.assignments[up.id]=parent.id;plan.assignments[down.id]=reserve.id;
    const valid=validateRosterPlan(db,parent,plan);if(!valid.ok)throw new Error('Valid batch roster swap rejected: '+valid.errors.join(' | '));
    const applied=applyRosterPlan(db,parent,plan);if(applied.moves.length!==2||up.team!==parent.id||down.team!==reserve.id)throw new Error('Atomic roster swap failed');
    const bad=rosterPlanState(db,parent);for(const pid of reserve.roster.slice())bad.assignments[pid]=parent.id;
    const snapP=parent.roster.slice(),snapR=reserve.roster.slice(),invalid=validateRosterPlan(db,parent,bad);if(invalid.ok)throw new Error('Invalid roster plan accepted');
    try{applyRosterPlan(db,parent,bad);throw new Error('Invalid roster plan mutated state')}catch(e){}
    if(parent.roster.join(',')!==snapP.join(',')||reserve.roster.join(',')!==snapR.join(','))throw new Error('Invalid roster plan had side effects');
    const restore=rosterPlanState(db,parent);restore.assignments[up.id]=reserve.id;restore.assignments[down.id]=parent.id;applyRosterPlan(db,parent,restore);
    if(parent.roster.length!==beforeParent.length||reserve.roster.length!==beforeReserve.length)throw new Error('Roster swap changed organization size');
  }
  const aiReserveParent=activeTeams(db,null,1).find(t=>t.id!==managedTeamId(db)&&reserveTeamsOf(db,t).length);
  if(aiReserveParent){
    const reserve=reserveTeamsOf(db,aiReserveParent)[0],rules=rosterRulesForTeam(db,aiReserveParent);
    const role=ROLES.find(r=>(aiReserveParent.roster||[]).some(id=>db.players[id]?.role===r)&&(reserve.roster||[]).some(id=>db.players[id]?.role===r));
    if(role){
      const first=(aiReserveParent.roster||[]).map(id=>db.players[id]).filter(p=>p&&p.role===role).sort((a,b)=>playerOvr(b)-playerOvr(a));
      const second=(reserve.roster||[]).map(id=>db.players[id]).filter(p=>p&&p.role===role).sort((a,b)=>playerOvr(b)-playerOvr(a));
      if(first.length&&second.length&&aiReserveParent.roster.length<rules.firstTeamMax&&reserve.roster.length>rules.reserveTeamMin){
        for(const a of Object.keys(second[0].attrs))second[0].attrs[a]=Math.max(second[0].attrs[a],Math.min(99,(first[0].attrs[a]||50)+8));
        const pid=second[0].id,legal=rosterMoveCheck(db,second[0],aiReserveParent);
        if(legal.ok){
          const moves=aiManageOwnedReserve(db,aiReserveParent);
          if(!moves.some(m=>m.pid===pid&&m.kind==='callup')||db.players[pid].team!==aiReserveParent.id)throw new Error('AI failed to call up clearly superior reserve player');
        }
      }
    }
  }
  const rosterErrorsAfterAi=rosterIntegrityErrors(db);
  if(rosterErrorsAfterAi.length) throw new Error('AI reserve management broke roster integrity: '+rosterErrorsAfterAi.slice(0,5).join(' | '));


  const mixedRegion=Object.values(db.regions).find(r=>r.system==='mixed');
  if(mixedRegion){
    if(!mixedRegion.div2)createDiv2(db,new RNG('smoke-mixed-tier2'),mixedRegion);
    const tier2=activeTeams(db,mixedRegion.id,2),owned=tier2.filter(t=>t.parent),independent=tier2.filter(t=>!t.parent);
    if(!owned.length||!independent.length)throw new Error('Mixed Tier-2 ecosystem must contain owned reserves and independent clubs');
    if(owned.some(t=>promotionEligible(db,t)))throw new Error('Owned reserve incorrectly became promotion eligible');
    if(independent.some(t=>!promotionEligible(db,t)))throw new Error('Independent Tier-2 club incorrectly blocked from promotion');
    const parent=db.teams[owned[0].parent];
    if(reserveRequirement(db,parent)!=='required')throw new Error('Certified mixed-system club lost mandatory reserve requirement');
    const ownedId=owned[0].id,parentId=owned[0].parent,foldedPlayers=owned[0].roster.map(id=>db.players[id]).filter(Boolean),foldedContracts=new Map(foldedPlayers.map(p=>[p.id,p.contract&&{...p.contract}]));
    db.teams[parentId].division=2;
    reconcileTier2Structure(db,new RNG('smoke-tier2-reconcile'),mixedRegion);
    if(db.teams[ownedId]&&db.teams[ownedId].active!==false)throw new Error('Reserve survived after parent lost first-division eligibility');
    if(foldedPlayers.some(p=>p.team!==null||p.faYears!==0))throw new Error('Folded reserve players did not become clean free agents');
    if(foldedPlayers.some(p=>JSON.stringify(p.contract)!==JSON.stringify(foldedContracts.get(p.id))))throw new Error('Folded reserve unexpectedly destroyed player contract terms');
    db.teams[parentId].division=1;db.teams[parentId].franchised=true;
    reconcileTier2Structure(db,new RNG('smoke-tier2-recreate'),mixedRegion);
    if(!reserveTeamsOf(db,parentId).length)throw new Error('Required reserve was not restored after first-division certification');
    inferRegionPolicy(db,mixedRegion);
    if(mixedRegion.rosterRuleProfile!=='ENGINE_OWNED_RESERVE'||!mixedRegion.policyBasis?.reserveOwned)throw new Error('Mixed-system owned reserves were ignored by policy engine');
  }


  const lifecycle=unpackDB(packDB(db)),lrng=new RNG('tier2-lifecycle-long','world');
  for(let i=0;i<5;i++){
    for(const R of Object.values(lifecycle.regions))if(R.div2)reconcileTier2Structure(lifecycle,lrng,R);
    const errs=rosterIntegrityErrors(lifecycle);if(errs.length)throw new Error('Tier-2 lifecycle integrity failed in year '+i+': '+errs.slice(0,4).join(' | '));
    for(const R of Object.values(lifecycle.regions))if(R.div2&&['franchise','mixed'].includes(R.system)){
      for(const t of activeTeams(lifecycle,R.id,1))if(reserveRequirement(lifecycle,t)==='required'&&reserveTeamsOf(lifecycle,t).length!==1)throw new Error('Required reserve count drifted in '+R.id);
      if(activeTeams(lifecycle,R.id,2).some(t=>t.parent&&promotionEligible(lifecycle,t)))throw new Error('Owned reserve became promotion eligible in '+R.id);
    }
    lifecycle.year++;if(lifecycle.world)lifecycle.world.year=lifecycle.year;
  }

  const promoDb=unpackDB(packDB(db)),promoR=Object.values(promoDb.regions).find(R=>R.div2&&['mixed','relegation'].includes(R.system));
  if(promoR){
    const prng2=new RNG('promotion-pressure','world'),events=[];
    const fakeSeason=(id,comp,region,div,teams,winner,loser)=>{const matches=[];for(let i=0;i<teams.length;i++)for(let j=i+1;j<teams.length;j++){const a=teams[i].id,b=teams[j].id,aw=a===winner||b===loser||(a!==loser&&b!==winner&&i<j),w=aw?a:b;matches.push({id:id+'-'+i+'-'+j,a,b,res:{winner:w,score:w===a?[1,0]:[0,1]}})}return {id,comp,region,div,split:99,done:true,champion:winner,runnerUp:null,stageData:{regular:{teams:teams.map(t=>t.id)}},days:[{stage:'regular',matches}]};};
    for(let cycle=0;cycle<5;cycle++){
      const first=activeTeams(promoDb,promoR.id,1),second=activeTeams(promoDb,promoR.id,2),eligible=second.filter(t=>promotionEligible(promoDb,t));
      if(first.length>=2&&eligible.length){
        const down=first.find(t=>!(promoR.system==='mixed'&&t.franchised))||first[0],up=eligible[cycle%eligible.length];
        promoDb.world.seasons['pressure-1']=fakeSeason('pressure-1','PRESSURE1',promoR.id,1,first,first.find(t=>t.id!==down.id).id,down.id);
        promoDb.world.seasons['pressure-2']=fakeSeason('pressure-2','PRESSURE2',promoR.id,2,second,up.id,second.find(t=>t.id!==up.id)?.id);
        promoDb.competitions.PRESSURE1={id:'PRESSURE1',stages:[{id:'regular'}]};promoDb.competitions.PRESSURE2={id:'PRESSURE2',stages:[{id:'regular'}]};
        const ownedIds=new Set(second.filter(t=>t.parent).map(t=>t.id));
        if(ownedIds.has(up.id))throw new Error('Pressure fixture selected owned reserve as promotion candidate');
        promotionRelegation(promoDb,promoDb.world,prng2,x=>events.push(x));
        if((promoDb.teams[up.id].division||1)!==1)throw new Error('Eligible independent Tier-2 club failed to promote');
        if(activeTeams(promoDb,promoR.id,1).some(t=>t.parent))throw new Error('Owned reserve entered first division after promotion cycle');
        for(const t of activeTeams(promoDb,promoR.id,1))if(reserveRequirement(promoDb,t)==='required'&&reserveTeamsOf(promoDb,t).length!==1)throw new Error('Promotion cycle broke required reserve ownership');
        const pe=rosterIntegrityErrors(promoDb);if(pe.length)throw new Error('Promotion cycle roster integrity failed: '+pe.slice(0,4).join(' | '));
        promoDb.year++;promoDb.world.year=promoDb.year;
      }
    }
    if(!events.length)throw new Error('Promotion pressure test did not execute');
  }

  const champions=Object.entries(db.patch.champions);
  if(champions.length<100||champions.some(([id,c])=>c.id!==id||!c.name)) throw new Error('Champion ID invariant failed');

  const teams=activeTeams(db).filter(t=>t.roster.length>=5);
  const series=simulateSeries(db,teams[0].id,teams[1].id,1,'smoke-series',{fearless:true,firstChoice:'seed'});
  if(!series.rec||series.rec.games.length!==1||!series.lines.length) throw new Error('Series smoke simulation failed');
  if(series.lines.some(l=>!(l.rating>=3&&l.rating<=10)||!(l.gold>0)||l.kp<0||['csDiff','goldDiff','dmgTaken','vision','objectives','laneAdv','teamfightDmg','teamfights','teamfightWins','teamfightShare'].some(k=>!Number.isFinite(l[k])))) throw new Error('Player game rating/stat line failed');
  if(!series.lines.some(l=>l.vision>0)||!series.lines.some(l=>l.objectives>0)) throw new Error('Player vision/objective tracking failed');
  const game=series.rec.games[0];
  for(const cid of [...game.picks[0],...game.picks[1],...(game.bans[0]||[]),...(game.bans[1]||[])]) if(cid&&!db.patch.champions[cid]) throw new Error('Draft champion ID missing: '+cid);

  const seasons=Object.values(db.world.seasons);
  if(!seasons.length) throw new Error('World season bootstrap failed');
  const seasonIds=seasons.map(s=>s.id);
  if(new Set(seasonIds).size!==seasonIds.length) throw new Error('Season IDs are not unique');
  const matchIds=seasons.flatMap(s=>s.days.flatMap(d=>d.matches.map(m=>m.id)));
  if(!matchIds.length||new Set(matchIds).size!==matchIds.length) throw new Error('Match IDs are not unique');

  const marketDb=unpackDB(packDB(db));runOffseason(marketDb);
  if(marketDb.world.phase!=='market')throw new Error('Offseason did not open transfer market');
  const preMarketSupply=talentSupplyErrors(marketDb);if(preMarketSupply.length)throw new Error('Pre-market labor supply failed: '+preMarketSupply.slice(0,5).join(' | '));
  if(!marketDb.world.report.rookieGlobal||!marketDb.world.report.rookies.every(x=>x.label&&x.tiers))throw new Error('Offseason rookie cohort report missing');

  // 계약/이적시장: 관심 → 관찰 → 내부평가 → 공식 협상, 다회 역제안, A/B/C 후보 상태를 검증한다.
  const marketTeam=managedTeam(marketDb),faTarget=Object.values(marketDb.players).find(p=>!p.retired&&!p.team);
  if(!marketTeam||!faTarget)throw new Error('No FA target for contract-market smoke');
  const interest=setRecruitmentPriority(marketDb,faTarget.id,'A');if(!interest.ok||recruitmentTarget(marketDb,faTarget.id).priority!=='A')throw new Error('Recruitment shortlist priority failed');
  if(startNegotiation(marketDb,faTarget.id,'fa').ok)throw new Error('Official negotiation started before internal evaluation');
  observePlayer(marketDb,faTarget,80,{comp:'market-smoke',games:4});syncRecruitmentObservation(marketDb,faTarget.id);
  const evaluation=recruitmentEvaluation(marketDb,faTarget.id);if(!evaluation.ok||evaluation.target.stage!=='evaluated'||!evaluation.target.evaluation)throw new Error('Recruitment internal evaluation failed');
  const started=startNegotiation(marketDb,faTarget.id,'fa');if(!started.ok||started.neg.status!=='open'||started.neg.stage!=='player')throw new Error('FA negotiation did not start');
  const low={...started.neg.demand,salary:Math.max(.1,started.neg.demand.salary*.78),signingBonus:0,bonuses:{performance:0,title:0,international:0},option:null,buyout:null};
  const counter=negotiationCounter(marketDb,started.neg,normalizeContractTerms(marketDb,faTarget,marketTeam,low.salary,low.years,low));
  if(!(counter.salary>low.salary)||!SQUAD_ROLES.includes(counter.promisedRole))throw new Error('Negotiation counter-offer failed');
  cancelNegotiation(marketDb,started.neg.id);if(recruitmentTarget(marketDb,faTarget.id).stage!=='evaluated')throw new Error('Cancelled negotiation did not restore evaluated target');
  const clauseProbe=normalizeContractTerms(marketDb,faTarget,marketTeam,asking(marketDb,faTarget,marketTeam.region),2,{signingBonus:.5,bonuses:{performance:.2,title:.3,international:.1},buyout:5,option:{type:'player'},promisedRole:'competition'});
  if(clauseProbe.signingBonus!==.5||clauseProbe.bonuses.title!==.3||clauseProbe.buyout!==5||clauseProbe.option?.type!=='player'||clauseProbe.promisedRole!=='competition')throw new Error('Contract clause normalization failed');
  const marketRoundTrip=unpackDB(packDB(marketDb));if(!marketRoundTrip.world.recruitment?.targets?.[faTarget.id]||!marketRoundTrip.world.negotiations?.[started.neg.id])throw new Error('Recruitment/negotiation save round-trip failed');
  const transferTarget=Object.values(marketDb.players).find(p=>p.team&&p.team!==marketTeam.id&&p.contract&&sellerTransferAsk(marketDb,p,marketDb.teams[p.team])<=marketTeam.finance.cash*.7);
  if(transferTarget){setRecruitmentPriority(marketDb,transferTarget.id,'B');observePlayer(marketDb,transferTarget,80,{comp:'transfer-smoke',games:4});syncRecruitmentObservation(marketDb,transferTarget.id);if(!recruitmentEvaluation(marketDb,transferTarget.id).ok)throw new Error('Transfer target evaluation failed');const ask=sellerTransferAsk(marketDb,transferTarget,marketDb.teams[transferTarget.team]);mTransferBid(marketDb,transferTarget.id,ask*1.2);const tn=negotiationStore(marketDb)[negotiationId(marketDb,transferTarget.id,'transfer')];if(!tn||tn.status!=='open'||tn.stage!=='player'||!(tn.fee>0))throw new Error('Club transfer-fee negotiation failed');cancelNegotiation(marketDb,tn.id)}
  closeMarket(marketDb);
  const targetSize=5+(marketDb.worldConfig.subs||0);
  for(const t of activeTeams(marketDb)){
    if(t.roster.length<targetSize)throw new Error('Market closed with short roster: '+t.id+' '+t.roster.length+'/'+targetSize);
    for(const role of ROLES)if(!starterFor(marketDb,t,role))throw new Error('Market closed without '+role+' starter: '+t.id);
  }
  if(Object.values(marketDb.players).some(p=>p.entryPath==='emergency'))throw new Error('Emergency-generated player exists after market');

  console.log('World smoke test: OK — blank rosters, global FA, roster rules, engine-owned regional policy, workforce-backed rookie intake/scouting reports, no emergency roster generation, offseason market closure, player identity/role ratings/state/value/development/champion learning/full match metrics/fixed depth charts/roster roles/satisfaction, season bootstrap and Bo1 simulation');
})()`;

const context = {
  console, Date, Math, JSON, Set, Map, Object, Array, String, Number,
  Boolean, RegExp, Error, Intl, performance, crypto,
};

vm.runInNewContext(source, context, { timeout: 25000 });
