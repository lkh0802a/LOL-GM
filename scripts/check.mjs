import { readFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { ARTIFACT_MODULES } from './artifact-modules.mjs';

const root = resolve(import.meta.dirname, '..');
const artifact = resolve(root, 'src', 'artifact');
const modules = ARTIFACT_MODULES;

let failed = false;
const globalSymbols = new Map();
for (const file of modules) {
  const path = resolve(artifact, file);
  const result = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
  if (result.status !== 0) {
    failed = true;
    console.error(`Syntax check failed: ${file}`);
    console.error(result.stderr || result.stdout);
  }
  const source = await readFile(path, 'utf8');
  const symbols = [
    ...[...source.matchAll(/(?:^|\n)function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(m=>m[1]),
    ...[...source.matchAll(/(?:^|\n)(?:const|let|class)\s+([A-Za-z_$][\w$]*)/g)].map(m=>m[1]),
  ];
  for (const name of symbols) {
    if (globalSymbols.has(name)) {
      failed = true;
      console.error(`Duplicate global symbol ${name}: ${globalSymbols.get(name)} and ${file}`);
    } else globalSymbols.set(name, file);
  }
}

const maintainabilityBudgets = {
  'app.js': 52000,
  'engine.js': 38000,
  'draft.js': 26000,
  'content-naming.js': 16000,
  'patch.js': 40000,
  'series.js': 18000,
  'competition.js': 18000,
  'player.js': 25000,
  'development.js': 14000,
  'player-relations.js': 16000,
  'world.js': 28000,
  'season.js': 24000,
  'offseason.js': 16000,
  'save.js': 10000,
  'roster.js': 22000,
  'lineup.js': 12000,
  'finance.js': 18000,
  'contracts.js': 26000,
  'scouting.js': 14000,
  'transfer.js': 26000,
  'staff.js': 18000,
  'scrim.js': 10000,
  'features.js': 14000,
  'role-conversion.js': 14000,
  'draft-analysis.js': 18000,
  'ui-patch.js': 30000,
  'ui-market.js': 35000,
  'ui-champion.js': 18000,
  'ui-player.js': 18000,
  'ui-roster.js': 18000,
  'ui-draft.js': 22000,
  'ui-season.js': 30000,
};
for (const [file, maxBytes] of Object.entries(maintainabilityBudgets)) {
  const source = await readFile(resolve(artifact, file), 'utf8');
  if (source.length > maxBytes) {
    failed = true;
    console.error(`Maintainability budget exceeded: ${file} > ${maxBytes} characters; split the domain UI instead of growing the monolith`);
  }
}

const draftUiSource = await readFile(resolve(artifact, 'ui-draft.js'), 'utf8');
const draftShellMarkers = ['du-series-meta','du-fearless','du-last-card','du-ban-img','du-pick-img','du-mobile-tabs','safe-area-inset-bottom'];
const draftUiMarkers = ['officialLastGameCard','draftUiSeriesMeta','draftUiFearlessStrip','draftUiAnalysisPanel','draftUiStaffAdvice','draftUiOpponentIntent','draftUiEvidenceSources','draftUiPoolTop','data-du-info','du-info-panel',"reason:'Fearless'"];
for (const marker of draftUiMarkers) if (!draftUiSource.includes(marker)) {
  failed = true;
  console.error(`Interactive draft UI contract missing marker: ${marker}`);
}
const shellSource = await readFile(resolve(artifact, 'shell.html'), 'utf8');
for (const marker of draftShellMarkers) if (!shellSource.includes(marker)) {
  failed = true;
  console.error(`Interactive draft shell contract missing marker: ${marker}`);
}

const setupUiSource = await readFile(resolve(artifact, 'ui-season.js'), 'utf8');
for (const obsoleteId of ['addreg','addintl']) {
  if (setupUiSource.includes(`#${obsoleteId}`)) {
    failed = true;
    console.error(`Removed setup control #${obsoleteId} is still referenced by bindSetup`);
  }
}

for (const file of modules.filter(file => file !== 'save.js')) {
  const source = await readFile(resolve(artifact, file), 'utf8');
  for (const marker of ['secondaryRoles','roleFamiliarity','trainSecondaryRole','officialRoleEligible']) if (source.includes(marker)) {
    failed = true;
    console.error(`Deprecated secondary-role model leaked into ${file}: ${marker}`);
  }
}
const appSource = await readFile(resolve(artifact, 'app.js'), 'utf8');
const playerSource = await readFile(resolve(artifact, 'player.js'), 'utf8');
const developmentSource = await readFile(resolve(artifact, 'development.js'), 'utf8');
const seasonSource = await readFile(resolve(artifact, 'season.js'), 'utf8');
const offseasonSource = await readFile(resolve(artifact, 'offseason.js'), 'utf8');
const saveSource = await readFile(resolve(artifact, 'save.js'), 'utf8');
const worldSource = await readFile(resolve(artifact, 'world.js'), 'utf8');
const rosterSource = await readFile(resolve(artifact, 'roster.js'), 'utf8');
const draftSource = await readFile(resolve(artifact, 'draft.js'), 'utf8');
const seriesSource = await readFile(resolve(artifact, 'series.js'), 'utf8');
const competitionSource = await readFile(resolve(artifact, 'competition.js'), 'utf8');
const financeSource = await readFile(resolve(artifact, 'finance.js'), 'utf8');
const contractsSource = await readFile(resolve(artifact, 'contracts.js'), 'utf8');
const scoutingSource = await readFile(resolve(artifact, 'scouting.js'), 'utf8');
const transferSource = await readFile(resolve(artifact, 'transfer.js'), 'utf8');
const staffSource = await readFile(resolve(artifact, 'staff.js'), 'utf8');
const relationsSource = await readFile(resolve(artifact, 'player-relations.js'), 'utf8');
const scrimSource = await readFile(resolve(artifact, 'scrim.js'), 'utf8');
const featuresSource = await readFile(resolve(artifact, 'features.js'), 'utf8');
const draftAnalysisSource = await readFile(resolve(artifact, 'draft-analysis.js'), 'utf8');
const legacySaveLines = saveSource.split('\n').filter(line => /secondaryRoles|roleFamiliarity/.test(line));
for (const line of legacySaveLines) if (!/delete\s+[^;]*(secondaryRoles|roleFamiliarity)/.test(line)) {
  failed = true;
  console.error('Deprecated secondary-role field is used by save.js outside deletion/migration cleanup: '+line.trim());
}

if (!draftSource.includes('function draftCandidateAnalysis(')) {
  failed = true;
  console.error('Draft candidate analysis domain helper is missing');
}
if (!draftSource.includes('function draftStaffAdvice(')) {
  failed = true;
  console.error('Draft staff advice domain helper is missing');
}
if (!draftAnalysisSource.includes('function draftOpponentIntent(')) {
  failed = true;
  console.error('Opponent draft intent analysis helper is missing');
}
for (const marker of ['function draftMasteryObservation(','function draftCandidateEvidence(','function draftMetaEvidence(']) if (!draftAnalysisSource.includes(marker)) {
  failed = true;
  console.error('Draft evidence/provenance helper is missing: '+marker);
}
for (const marker of ['function draftMasteryObservation(','function draftOpponentIntent(','function draftCandidateEvidence(']) if (featuresSource.includes(marker)) {
  failed = true;
  console.error('Draft-analysis responsibility leaked back into features.js: '+marker);
}
for (const marker of ['function validateRosterPlan(','function applyRosterPlan(','function rosterIntegrityErrors(','function localRegistrationError(']) {
  if (!rosterSource.includes(marker)) {
    failed = true;
    console.error('Roster domain helper is missing: '+marker);
  }
  if (worldSource.includes(marker)) {
    failed = true;
    console.error('Roster-domain responsibility leaked back into world.js: '+marker);
  }
}
for (const marker of ['function genPlayer(','function generateRookieClass(','function playerRoleRating(']) {
  if (!playerSource.includes(marker)) {
    failed = true;
    console.error('Player lifecycle helper is missing: '+marker);
  }
  if (worldSource.includes(marker)) {
    failed = true;
    console.error('Player lifecycle responsibility leaked back into world.js: '+marker);
  }
}
for (const marker of ['function growPlayer(','function defaultTraining(','function ensureFacilities(']) {
  if (!developmentSource.includes(marker)) {
    failed = true;
    console.error('Development helper is missing: '+marker);
  }
  if (worldSource.includes(marker)) {
    failed = true;
    console.error('Development responsibility leaked back into world.js: '+marker);
  }
}
for (const marker of ['function startWorldSeason(','function playWorldDay(','function startInternational(']) {
  if (!seasonSource.includes(marker)) {
    failed = true;
    console.error('Season orchestration helper is missing: '+marker);
  }
  if (worldSource.includes(marker)) {
    failed = true;
    console.error('Season responsibility leaked back into world.js: '+marker);
  }
}
for (const marker of ['function runOffseason(','function closeMarket(','function promotionRelegation(']) {
  if (!offseasonSource.includes(marker)) {
    failed = true;
    console.error('Offseason helper is missing: '+marker);
  }
  if (worldSource.includes(marker)) {
    failed = true;
    console.error('Offseason responsibility leaked back into world.js: '+marker);
  }
}
for (const marker of ['function packDB(','function unpackDB(','function worldForSave(']) {
  if (!saveSource.includes(marker)) {
    failed = true;
    console.error('Save serialization helper is missing: '+marker);
  }
  if (worldSource.includes(marker)) {
    failed = true;
    console.error('Save responsibility leaked back into world.js: '+marker);
  }
}
for (const marker of ['function normalizeContractTerms(','function signContract(','function contractMarket(']) {
  if (!contractsSource.includes(marker)) { failed=true; console.error('Contract-domain helper missing: '+marker); }
  if (financeSource.includes(marker)) { failed=true; console.error('Contract responsibility leaked into finance.js: '+marker); }
}
for (const marker of ['function recruitmentStore(','function startNegotiation(','function doTransfer(']) {
  if (!transferSource.includes(marker)) { failed=true; console.error('Transfer-domain helper missing: '+marker); }
  if (financeSource.includes(marker)||contractsSource.includes(marker)) { failed=true; console.error('Transfer responsibility leaked into finance/contract domain: '+marker); }
}
for (const marker of ['function ensureScoutReport(','function scoutReport(','function observePlayer(']) {
  if (!scoutingSource.includes(marker)) { failed=true; console.error('Scouting-domain helper missing: '+marker); }
  if (financeSource.includes(marker)) { failed=true; console.error('Scouting responsibility leaked into finance.js: '+marker); }
}
for (const marker of ['function ensureSatisfaction(','function updatePlayerUsage(','function afterSeries(']) {
  if (!relationsSource.includes(marker)) { failed=true; console.error('Player-relations helper missing: '+marker); }
  if (featuresSource.includes(marker)) { failed=true; console.error('Player-relations responsibility leaked into features.js: '+marker); }
}
for (const marker of ['function staffProfile(','function ensureStaffRoster(','function aiManageStaff(']) {
  if (!staffSource.includes(marker)) { failed=true; console.error('Staff-domain helper missing: '+marker); }
  if (featuresSource.includes(marker)) { failed=true; console.error('Staff responsibility leaked into features.js: '+marker); }
}
for (const marker of ['function scrimReadiness(','function aiRunScrims(','function recordScrimPractice(']) {
  if (!scrimSource.includes(marker)) { failed=true; console.error('Scrim-domain helper missing: '+marker); }
  if (featuresSource.includes(marker)) { failed=true; console.error('Scrim responsibility leaked into features.js: '+marker); }
}
if (!developmentSource.includes('function dailyRecovery(') || featuresSource.includes('function dailyRecovery(')) {
  failed=true; console.error('Daily recovery must be owned by development/training domain');
}
for (const marker of ['function createSeriesSession(','function playSeriesSessionGame(','function simulateSeries(']) {
  if (!seriesSource.includes(marker)) { failed=true; console.error('Series-domain helper missing: '+marker); }
  if (competitionSource.includes(marker)) { failed=true; console.error('Series responsibility leaked into competition.js: '+marker); }
}
for (const marker of ['function newSeason(','function standings(','function playDay(']) {
  if (!competitionSource.includes(marker)) { failed=true; console.error('Competition helper missing: '+marker); }
}
const saveVersion = Number(appSource.match(/const SAVE_VERSION=(\d+)/)?.[1]);
const worldVersion = Number(worldSource.match(/version:(\d+),saveId:/)?.[1]);
if (!Number.isInteger(saveVersion) || !Number.isInteger(worldVersion) || saveVersion !== worldVersion) {
  failed = true;
  console.error(`Save schema mismatch: app SAVE_VERSION=${saveVersion}, buildWorld version=${worldVersion}`);
}

const regressionSource = await readFile(resolve(root, 'scripts', 'regression.mjs'), 'utf8');
for (const marker of ['01-world-bootstrap','05-contracts','06-owned-reserve-roster','09-patch-baseline','11-draft-series-save','mid-Bo5 session did not survive save/load']) {
  if (!regressionSource.includes(marker)) {
    failed = true;
    console.error('11.5 regression baseline missing marker: '+marker);
  }
}
const packageJson = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
if (!String(packageJson.scripts?.check||'').includes('scripts/regression.mjs')) {
  failed = true;
  console.error('Regression baseline is not wired into npm run check');
}

const shell = await readFile(resolve(artifact, 'shell.html'), 'utf8');
if (!shell.includes('<meta name="viewport"')) {
  failed = true;
  console.error('Missing mobile viewport meta tag');
}
if (!shell.includes('/*CODE*/')) {
  failed = true;
  console.error('Missing /*CODE*/ build placeholder');
}
if (!shell.includes('LOL <span>GM</span>')) {
  failed = true;
  console.error('LOL GM branding is missing from shell');
}

const forbiddenBranding = [
  ['legacy Latin product name', /ROLLFM/i],
  ['legacy Korean product name', /롤FM/i],
  ['legacy storage/product token', /\blolfm\b/i],
];
const docFiles = (await readdir(resolve(root, 'docs'))).filter(file => file.endsWith('.md')).map(file => resolve(root, 'docs', file));
const brandTargets = [
  ...modules.map(file => resolve(artifact, file)),
  resolve(artifact, 'shell.html'),
  resolve(root, 'README.md'),
  resolve(root, 'MIGRATION_REPORT.md'),
  ...docFiles,
];
for (const path of brandTargets) {
  const source = await readFile(path, 'utf8');
  for (const [label, pattern] of forbiddenBranding) {
    if (pattern.test(source)) {
      failed = true;
      console.error(`Forbidden ${label} remains in ${path.slice(root.length + 1)}`);
    }
  }
}

if (failed) process.exit(1);
console.log(`Checked ${modules.length} JavaScript modules and Artifact shell: OK`);
