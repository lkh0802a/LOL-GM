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
  'competition.js': 30000,
  'world.js': 85000,
  'lineup.js': 12000,
  'features.js': 30000,
  'role-conversion.js': 14000,
  'draft-analysis.js': 18000,
  'ui-patch.js': 30000,
  'ui-market.js': 35000,
  'ui-champion.js': 18000,
  'ui-roster.js': 26000,
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

for (const file of modules.filter(file => file !== 'world.js')) {
  const source = await readFile(resolve(artifact, file), 'utf8');
  for (const marker of ['secondaryRoles','roleFamiliarity','trainSecondaryRole','officialRoleEligible']) if (source.includes(marker)) {
    failed = true;
    console.error(`Deprecated secondary-role model leaked into ${file}: ${marker}`);
  }
}

const appSource = await readFile(resolve(artifact, 'app.js'), 'utf8');
const worldSource = await readFile(resolve(artifact, 'world.js'), 'utf8');
const draftSource = await readFile(resolve(artifact, 'draft.js'), 'utf8');
const featuresSource = await readFile(resolve(artifact, 'features.js'), 'utf8');
const draftAnalysisSource = await readFile(resolve(artifact, 'draft-analysis.js'), 'utf8');
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
const saveVersion = Number(appSource.match(/const SAVE_VERSION=(\d+)/)?.[1]);
const worldVersion = Number(worldSource.match(/version:(\d+),saveId:/)?.[1]);
if (!Number.isInteger(saveVersion) || !Number.isInteger(worldVersion) || saveVersion !== worldVersion) {
  failed = true;
  console.error(`Save schema mismatch: app SAVE_VERSION=${saveVersion}, buildWorld version=${worldVersion}`);
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
