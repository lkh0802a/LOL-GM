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
  if(!db||db.version!==11) throw new Error('Unexpected save schema');
  if(!db.worldDate||!db.worldConfig.universalLanguage) throw new Error('World bootstrap settings failed');

  const active=activeTeams(db);
  if(active.length<2||active.some(t=>t.roster.length!==0)) throw new Error('First-season teams are not blank');
  const players=Object.values(db.players);
  if(players.length<10||players.some(p=>p.team||p.contract)) throw new Error('Initial player pool is not fully FA');

  const selectable=managerSelectableTeams(db), independent=active.filter(t=>!t.parent);
  if(!selectable.length||selectable.some(t=>t.parent)) throw new Error('Manager-selectable team filter failed');
  if(selectable.length!==independent.length) throw new Error('Independent club selection coverage failed');

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
  const game=series.rec.games[0];
  for(const cid of [...game.picks[0],...game.picks[1],...(game.bans[0]||[]),...(game.bans[1]||[])]) if(cid&&!db.patch.champions[cid]) throw new Error('Draft champion ID missing: '+cid);

  const seasons=Object.values(db.world.seasons);
  if(!seasons.length) throw new Error('World season bootstrap failed');
  const seasonIds=seasons.map(s=>s.id);
  if(new Set(seasonIds).size!==seasonIds.length) throw new Error('Season IDs are not unique');
  const matchIds=seasons.flatMap(s=>s.days.flatMap(d=>d.matches.map(m=>m.id)));
  if(!matchIds.length||new Set(matchIds).size!==matchIds.length) throw new Error('Match IDs are not unique');

  console.log('World smoke test: OK — blank first-season rosters, global FA pool, managed roster construction, AI roster construction, universal pro language, roster rules, season bootstrap and Bo1 simulation');
})()`;

const context = {
  console, Date, Math, JSON, Set, Map, Object, Array, String, Number,
  Boolean, RegExp, Error, Intl, performance, crypto,
};

vm.runInNewContext(source, context, { timeout: 8000 });
