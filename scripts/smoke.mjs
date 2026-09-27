import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(import.meta.dirname, '..');
const artifact = resolve(root, 'src', 'artifact');
const modules = [
  'engine.js', 'data.js', 'champs2.js', 'patch.js', 'competition.js',
  'world.js', 'office.js', 'finance.js', 'features.js', 'career.js',
];

let source = '';
for (const file of modules) source += `${await readFile(resolve(artifact, file), 'utf8')}\n`;
source += `\n(()=>{
  const db=buildWorld();
  if(!db||db.version!==13) throw new Error('Unexpected save schema');
  if(!db.worldDate||!db.worldConfig.universalLanguage) throw new Error('World bootstrap settings failed');

  const active=activeTeams(db);
  if(active.length<2||active.some(t=>t.roster.length!==0)) throw new Error('First-season teams are not blank');
  const players=Object.values(db.players);
  if(players.length<10||players.some(p=>p.team||p.contract)) throw new Error('Initial player pool is not fully FA');
  for(const R of Object.values(db.regions)){
    if(R.policyMode!=='engine'||!R.policyBasis||R.policyBasis.source!=='engine')throw new Error('Region policy is not engine-owned: '+R.id);
    if(R.payScale==null||R.importLimit==null||R.importRecruitMinGap==null||!R.rosterRuleProfile||!R.marketProfile||!R.office||R.spendingRule==null)throw new Error('Policy engine left unresolved output: '+R.id);
  }
  const namedPolicies=['KR','CN','EU','NA','AP','BR'].map(id=>db.regions[id]).filter(Boolean);
  if(namedPolicies.some(R=>R.sfrMode==='kr_progressive'||R.sfrMode==='lec_50_100'))throw new Error('Named-region hand policy leaked into engine world');
  if(PAY_SCALE.KR||PAY_SCALE.CN||PAY_SCALE.EU||PAY_SCALE.NA)throw new Error('Named regional pay scales are still hardcoded');
  const rookieR=db.regions[Object.keys(db.regions)[0]],rp=rookieIntakeProfile(db,rookieR),rc=generateRookieClass(db,rookieR,new RNG('rookie-smoke','class'));
  if(rc.length!==rp.count||rc.some(p=>p.age<17||p.age>19||!p.rookieTier||p.entryYear!==db.year))throw new Error('Engine rookie class generation failed');
  if(!(rp.ecosystem>0)||!rookieR.rookieIntake.slice(-1)[0].profile.classWave)throw new Error('Rookie class quality wave missing');
  const waves=[];for(let i=0;i<240;i++){const tmp={...rp,classWave:undefined};waves.push(rookieTier(new RNG('elite-wave-'+i,'tier'),tmp,2.1))}if(!waves.includes('elite'))throw new Error('Elite rookie probability collapsed under strong class wave');
  if(ROLES.reduce((n,r)=>n+rc.filter(p=>p.role===r).length,0)!==rc.length)throw new Error('Rookie role supply failed');
  const custom=buildWorld({regions:[regionCfg('ZZ',{id:'ZZ',name:'테스트',leagueName:'ZZL',short:'ZZL',teams:8,strength:66,div2:true,system:'franchise',payScale:.7})],internationals:[],subs:1,changes:'normal',startYear:2027,manage:'manual',universalLanguage:true});
  const z=custom.regions.ZZ;if(!z.policyBasis||z.policyBasis.source!=='engine'||!z.rosterRuleProfile||z.importLimit==null||!z.marketProfile||z.spendingRule==null)throw new Error('Policy engine did not resolve custom-region rules');
  if(z.rosterRuleProfile!=='ENGINE_OWNED_RESERVE')throw new Error('Policy engine ignored owned-reserve structure');
  if((db.patches.cadence||14)!==14)throw new Error('Patch cadence should begin on Riot-style 14-day baseline');
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
  if(!persistedPlayer||persisted.version!==13||persistedPlayer.nationality!==sample.nationality||persistedPlayer.reputation!==sample.reputation||!persistedPlayer.development||!persistedPlayer.roleFamiliarity||!persistedPlayer.pool[poolEntry]||persistedPlayer.pool[poolEntry].trainingExperience!==sample.pool[poolEntry].trainingExperience) throw new Error('Player save round-trip failed');

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

  const reserveParents=activeTeams(db).filter(t=>!t.parent&&reserveTeamsOf(db,t).length);
  if(reserveParents.length){
    const parent=reserveParents[0],reserve=reserveTeamsOf(db,parent)[0],candidate=db.players[reserve.roster[0]];
    const before=[...organizationRoster(db,parent)].sort().join(',');
    const up=rosterMoveCheck(db,candidate,parent);
    if(!up.ok||up.kind!=='callup') throw new Error('Owned reserve call-up failed: '+up.reason);
    movePlayerBetweenSquads(db,candidate,parent);
    const down=rosterMoveCheck(db,candidate,reserve);
    if(!down.ok||down.kind!=='senddown') throw new Error('Owned reserve send-down failed: '+down.reason);
    movePlayerBetweenSquads(db,candidate,reserve);
    if([...organizationRoster(db,parent)].sort().join(',')!==before) throw new Error('Organization roster changed after round trip');
  }

  const rosterErrors=rosterIntegrityErrors(db);
  if(rosterErrors.length) throw new Error('Roster integrity failed: '+rosterErrors.slice(0,5).join(' | '));

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

  console.log('World smoke test: OK — blank rosters, global FA, roster rules, engine-owned regional policy, rookie intake/scouting reports, player identity/role ratings/state/value/development/champion learning/full match metrics/fixed depth charts/roster roles/satisfaction, season bootstrap and Bo1 simulation');
})()`;

const context = {
  console, Date, Math, JSON, Set, Map, Object, Array, String, Number,
  Boolean, RegExp, Error, Intl, performance, crypto,
};

vm.runInNewContext(source, context, { timeout: 8000 });
