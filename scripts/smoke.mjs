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
source += `\n(()=>{\n  const db=buildWorld();\n  if(!db||db.version!==9) throw new Error('Unexpected save schema');\n  if(!db.manager||db.manager.teamId!==null) throw new Error('Manager bootstrap is invalid');\n  if(!db.worldDate) throw new Error('Missing world date');\n  if(Object.keys(db.teams).length<2) throw new Error('World has too few teams');\n  if(Object.keys(db.players).length<10) throw new Error('World has too few players');\n  if(activeTeams(db).length<2) throw new Error('activeTeams helper failed');\n  const champValues=Object.values(db.patch.champions);\n  if(!champValues.length||champValues.some(c=>!c.id||db.patch.champions[c.id]!==c||c.id===c.name)) throw new Error('Champion stable IDs are invalid');\n  if(Object.values(db.players).some(p=>p.pool&&Object.keys(p.pool).some(id=>!db.patch.champions[id]))) throw new Error('Player champion pool contains non-ID references');\n  const simTeams=activeTeams(db).slice(0,2);\n  const sim=simulateMatch(db,simTeams[0].id,simTeams[1].id,'champ-id-smoke');\n  const draftIds=[...sim.draft.bans.flat(),...Object.values(sim.draft.picks[0]),...Object.values(sim.draft.picks[1])];\n  if(draftIds.some(id=>!db.patch.champions[id])) throw new Error('Draft emitted non-ID champion reference');\n  if(sim.sides.some(side=>side.ps.some(ps=>!ps.champ.id||!db.patch.champions[ps.champ.id]))) throw new Error('Match state lost champion ID');\n  let rosterErrors=rosterIntegrityErrors(db);\n  if(rosterErrors.length) throw new Error('Initial roster integrity failed: '+rosterErrors.slice(0,5).join(' | '));\n  const teams=activeTeams(db);\n  const from=teams.find(t=>t.roster.length),to=teams.find(t=>t.id!==from.id);\n  const p=db.players[from.roster[0]],original=from.id;\n  assignPlayerToTeam(db,p,to);\n  if(p.team!==to.id||from.roster.includes(p.id)||to.roster.filter(id=>id===p.id).length!==1) throw new Error('Roster move invariant failed');\n  assignPlayerToTeam(db,p,original);\n  rosterErrors=rosterIntegrityErrors(db);\n  if(rosterErrors.length) throw new Error('Roster restore integrity failed: '+rosterErrors.slice(0,5).join(' | '));\n  console.log('World smoke test: OK — '+Object.keys(db.teams).length+' teams, '+Object.keys(db.players).length+' players, roster invariants OK');\n})()`;

const context = {
  console, Date, Math, JSON, Set, Map, Object, Array, String, Number,
  Boolean, RegExp, Error, Intl, performance, crypto,
};

vm.runInNewContext(source, context, { timeout: 5000 });