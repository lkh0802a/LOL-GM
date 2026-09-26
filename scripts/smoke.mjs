import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(import.meta.dirname, '..');
const artifact = resolve(root, 'src', 'artifact');
const modules = [
  'engine.js', 'data.js', 'champs2.js', 'patch.js', 'competition.js',
  'world.js', 'office.js', 'finance.js', 'features.js',
];

let source = '';
for (const file of modules) source += `${await readFile(resolve(artifact, file), 'utf8')}\n`;
source += `\n(()=>{\n  const db=buildWorld();\n  if(!db||db.version!==9) throw new Error('Unexpected save schema');\n  if(!db.manager||db.manager.teamId!==null) throw new Error('Manager bootstrap is invalid');\n  if(!db.worldDate) throw new Error('Missing world date');\n  if(Object.keys(db.teams).length<2) throw new Error('World has too few teams');\n  if(Object.keys(db.players).length<10) throw new Error('World has too few players');\n  if(activeTeams(db).length<2) throw new Error('activeTeams helper failed');\n\n  let rosterErrors=rosterIntegrityErrors(db);\n  if(rosterErrors.length) throw new Error('Initial roster integrity failed: '+rosterErrors.slice(0,5).join(' | '));\n\n  const champions=Object.entries(db.patch.champions);\n  if(champions.length<100) throw new Error('Champion catalog is unexpectedly small');\n  for(const [id,c] of champions){\n    if(c.id!==id||!c.name) throw new Error('Champion ID invariant failed: '+id);\n  }\n  for(const p of Object.values(db.players)){\n    for(const cid of Object.keys(p.pool||{})){\n      if(!db.patch.champions[cid]) throw new Error('Player pool references missing champion ID: '+p.id+' -> '+cid);\n    }\n  }\n\n  const teams=activeTeams(db);\n  const from=teams.find(t=>t.roster.length),to=teams.find(t=>t.id!==from.id);\n  const p=db.players[from.roster[0]],original=from.id;\n  assignPlayerToTeam(db,p,to);\n  if(p.team!==to.id||from.roster.includes(p.id)||to.roster.filter(id=>id===p.id).length!==1) throw new Error('Roster move invariant failed');\n  assignPlayerToTeam(db,p,original);\n  rosterErrors=rosterIntegrityErrors(db);\n  if(rosterErrors.length) throw new Error('Roster restore integrity failed: '+rosterErrors.slice(0,5).join(' | '));\n\n  const series=simulateSeries(db,from.id,to.id,1,'smoke-series',{fearless:true,firstChoice:'seed'});\n  if(!series.rec||series.rec.games.length!==1||!series.lines.length) throw new Error('Series smoke simulation failed');\n  const game=series.rec.games[0];\n  for(const cid of [...game.picks[0],...game.picks[1],...(game.bans[0]||[]),...(game.bans[1]||[])]){\n    if(cid&&!db.patch.champions[cid]) throw new Error('Draft references missing champion ID: '+cid);\n  }\n  for(const line of series.lines){\n    if(!db.patch.champions[line.champ]) throw new Error('Match stat references missing champion ID: '+line.champ);\n  }\n\n  console.log('World smoke test: OK — '+Object.keys(db.teams).length+' teams, '+Object.keys(db.players).length+' players, '+champions.length+' stable champion IDs, roster invariants and Bo1 simulation OK');\n})()`;

const context = {
  console, Date, Math, JSON, Set, Map, Object, Array, String, Number,
  Boolean, RegExp, Error, Intl, performance, crypto,
};

vm.runInNewContext(source, context, { timeout: 5000 });