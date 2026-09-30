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
  'app.js': 22000,
  'ui-state.js': 6500,
  'ui-overlay.js': 6500,
  'random.js': 5000,
  'engine.js': 34000,
  'champion-data.js': 14000,
  'system-data.js': 14000,
  'data.js': 20000,
  'systems.js': 11000,
  'draft.js': 21000,
  'content-naming.js': 16000,
  'meta.js': 14000,
  'patch.js': 9000,
  'patch-balance.js': 22000,
  'patch-content.js': 12500,
  'series.js': 18000,
  'competition.js': 18000,
  'league-aggregation.js': 12000,
  'player.js': 25000,
  'development.js': 14000,
  'player-relations.js': 16000,
  'world.js': 28000,
  'season.js': 24000,
  'offseason.js': 16000,
  'save.js': 10000,
  'save-migration.js': 8000,
  'roster.js': 22000,
  'lineup.js': 12000,
  'state-transaction.js': 9000,
  'state-rollback.js': 8000,
  'state-player-actions.js': 17000,
  'finance.js': 18000,
  'contracts.js': 26000,
  'scouting.js': 14000,
  'scouting-ai.js': 10000,
  'scouting-ai-ops.js': 7000,
  'scouting-ai-reassessment.js': 5000,
  'transfer.js': 26000,
  'contract-window.js': 11000,
  'staff.js': 18000,
  'scrim.js': 10000,
  'features.js': 14000,
  'role-conversion.js': 14000,
  'draft-analysis.js': 18000,
  'ui-patch.js': 30000,
  'ui-market.js': 17000,
  'ui-market-initial.js': 15000,
  'ui-negotiations.js': 9500,
  'ui-market-staff.js': 8500,
  'office-international.js': 18000,
  'office.js': 17000,
  'ui-setup.js': 16000,
  'ui-match.js': 22000,
  'ui-manager.js': 16000,
  'ui-data.js': 12000,
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


const stage2Ownership = [
  ['random.js','engine.js','function makeStreams('],
  ['champion-data.js','data.js','function applyChampionSource('],
  ['system-data.js','data.js','function buildRuneSystems('],
  ['systems.js','draft.js','function selectRunePage('],
  ['systems.js','draft.js','function championSystemMetaProfile('],
  ['patch-balance.js','patch.js','function diagnosePatchMeta('],
  ['patch-content.js','patch.js','function maybeNewChampion('],
  ['office-international.js','office.js','function globalOffice('],
  ['ui-market-initial.js','ui-market.js','function renderInitialRosterMarket('],
  ['ui-negotiations.js','ui-market.js','function renderNegotiations('],
  ['ui-market-staff.js','ui-market.js','function coachBlock('],
];
for (const [owner,former,marker] of stage2Ownership) {
  const ownerSource = await readFile(resolve(artifact,owner),'utf8');
  const formerSource = await readFile(resolve(artifact,former),'utf8');
  if (!ownerSource.includes(marker) || formerSource.includes(marker)) {
    failed=true;
    console.error('Stage 11.5/2 domain boundary violated: '+marker+' must belong to '+owner);
  }
}

const transactionSource = await readFile(resolve(artifact,'state-transaction.js'),'utf8');
for (const marker of ['function validateWorldAction(','function previewWorldAction(','function applyWorldAction(','roster.plan']) {
  if (!transactionSource.includes(marker)) {
    failed = true;
    console.error('Shared world transaction capability missing: '+marker);
  }
}
const rosterSourceForTransactions = await readFile(resolve(artifact,'roster.js'),'utf8');
const rosterUiForTransactions = await readFile(resolve(artifact,'ui-roster.js'),'utf8');
for(const [owner,marker] of [[rosterSourceForTransactions,"actor:'ai'"],[rosterUiForTransactions,"actor:'manager'"]]){
  if(!owner.includes('previewWorldAction(')||!owner.includes('applyWorldAction(')||!owner.includes(marker)){
    failed = true;
    console.error('Shared roster transaction path must be used by AI and manager');
  }
}

const rollbackSource=await readFile(resolve(artifact,'state-rollback.js'),'utf8');
for(const marker of ['function captureWorldActionJournal(','function worldActionScopeErrors(',
  'function actionJournalRestoreObject(','function actionJournalRestoreTeam(']){
  if(!rollbackSource.includes(marker)){
    failed=true;console.error('11.5/3-4 rollback journal helper missing: '+marker);
  }
}
if(!transactionSource.includes('journal=captureWorldActionJournal(')||
   !transactionSource.includes('journal.rollback()')||
   !transactionSource.includes('worldActionScopeErrors(')||
   !transactionSource.includes('saveId:db.saveId||null')){
  failed=true;console.error('11.5/3-4 guarded commit/rollback or save ownership marker missing');
}

const playerActionSource = await readFile(resolve(artifact,'state-player-actions.js'),'utf8');
for(const marker of ['function validatePlayerSignAction(','function validatePlayerTransferAction(',
  'function validatePlayerReleaseAction(','function validatePlayerOptionAction(',
  'function playerActionSnapshot(','function applyPlayerSignAction(','function applyPlayerTransferAction(',
  'function applyPlayerReleaseAction(','function applyPlayerOptionAction(',
  "'player.sign'","'player.transfer'","'player.release'","'player.option'"]){
  if(!playerActionSource.includes(marker)){
    failed=true;console.error('Stage 11.5/3-2 player transaction handler missing: '+marker);
  }
}
for(const file of ['contracts.js','transfer.js','career.js']){
  const owner=await readFile(resolve(artifact,file),'utf8');
  if(!owner.includes('commitWorldAction(')){
    failed=true;console.error('Stage 11.5/3-2 missing command-gateway client: '+file);
  }
}
if(!transactionSource.includes('function commitWorldAction(')){
  failed=true;console.error('Single-step world transaction gateway missing');
}

// 11.5/3-3: a separately versioned save-encoding migration and non-destructive restore.
const saveMigrationSource=await readFile(resolve(artifact,'save-migration.js'),'utf8');
const saveSerializationSource=await readFile(resolve(artifact,'save.js'),'utf8');
const appSaveSource=await readFile(resolve(artifact,'app.js'),'utf8');
const rosterIntegritySource=await readFile(resolve(artifact,'roster.js'),'utf8');
for(const marker of ['const SAVE_FORMAT_VERSION=2','function validateSaveEnvelope(',
  'function normalizeRestoredSave(','function migrateSaveState(',
  'function unpackPlayerSaveFields(']){
  if(!saveMigrationSource.includes(marker)){failed=true;console.error('11.5/3-3 migration gate missing: '+marker)}
}
if(!saveSerializationSource.includes('return migrateSaveState(JSON.parse(str))')||
   !saveSerializationSource.includes('saveFormat:SAVE_FORMAT_VERSION')){
  failed=true;console.error('Save encoding must use explicit version and migration path');
}
if(appSaveSource.includes('purgeLegacySaves(')||
   !appSaveSource.includes('if(invalid.length)')||
   !appSaveSource.includes('const db=DB,slot=SLOT,key=STORE')){
  failed=true;console.error('Storage must preserve invalid/old saves and capture writes by slot');
}
if(rosterIntegritySource.includes('if(db.metaHistoryPacked)')){
  failed=true;console.error('Roster integrity check must be pure: save restoration belongs to save-migration');
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

for (const file of modules.filter(file => !['save.js','save-migration.js'].includes(file))) {
  const source = await readFile(resolve(artifact, file), 'utf8');
  for (const marker of ['secondaryRoles','roleFamiliarity','trainSecondaryRole','officialRoleEligible']) if (source.includes(marker)) {
    failed = true;
    console.error(`Deprecated secondary-role model leaked into ${file}: ${marker}`);
  }
}
const uiSetupSource = await readFile(resolve(artifact, 'ui-setup.js'), 'utf8');
const uiMatchSource = await readFile(resolve(artifact, 'ui-match.js'), 'utf8');
const uiManagerSource = await readFile(resolve(artifact, 'ui-manager.js'), 'utf8');
const uiDataSource = await readFile(resolve(artifact, 'ui-data.js'), 'utf8');
const appSource = await readFile(resolve(artifact, 'app.js'), 'utf8');
const playerSource = await readFile(resolve(artifact, 'player.js'), 'utf8');
const developmentSource = await readFile(resolve(artifact, 'development.js'), 'utf8');
const seasonSource = await readFile(resolve(artifact, 'season.js'), 'utf8');
const offseasonSource = await readFile(resolve(artifact, 'offseason.js'), 'utf8');
const saveSource = await readFile(resolve(artifact, 'save.js'), 'utf8');
const worldSource = await readFile(resolve(artifact, 'world.js'), 'utf8');
const rosterSource = await readFile(resolve(artifact, 'roster.js'), 'utf8');
const metaSource = await readFile(resolve(artifact, 'meta.js'), 'utf8');
const patchSource = await readFile(resolve(artifact, 'patch.js'), 'utf8');
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
for (const marker of ['function metaHistoryIndex(','function recordMeta(','function metaTableFiltered(']) {
  if (!metaSource.includes(marker)) { failed=true; console.error('Meta-domain helper missing: '+marker); }
  if (patchSource.includes(marker)) { failed=true; console.error('Meta responsibility leaked into patch.js: '+marker); }
}
for (const marker of ['function applyNote(','function getPatch(','function patchTick(']) {
  if (!patchSource.includes(marker)) { failed=true; console.error('Patch-domain helper missing: '+marker); }
}
for (const marker of ['function viewMatch(','function renderResult(','function renderSeries(']) {
  if (!uiMatchSource.includes(marker)) { failed=true; console.error('Match UI helper missing: '+marker); }
  if (appSource.includes(marker)) { failed=true; console.error('Match UI leaked back into app.js: '+marker); }
}
for (const marker of ['function managerTeamPicker(','function seasonSetup(']) {
  if (!uiSetupSource.includes(marker)) { failed=true; console.error('Setup UI helper missing: '+marker); }
  if (appSource.includes(marker)) { failed=true; console.error('Setup UI leaked back into app.js: '+marker); }
}
for (const marker of ['function viewData(','function bindData(']) {
  if (!uiDataSource.includes(marker)) { failed=true; console.error('Data UI helper missing: '+marker); }
  if (appSource.includes(marker)) { failed=true; console.error('Data UI leaked back into app.js: '+marker); }
}
const saveVersion = Number(appSource.match(/const SAVE_VERSION=(\d+)/)?.[1]);
const worldVersion = Number(worldSource.match(/version:(\d+),saveId:/)?.[1]);
if (!Number.isInteger(saveVersion) || !Number.isInteger(worldVersion) || saveVersion !== worldVersion) {
  failed = true;
  console.error(`Save schema mismatch: app SAVE_VERSION=${saveVersion}, buildWorld version=${worldVersion}`);
}

// 11.5/4: keep long-career indexes bounded, incremental, and non-persistent.
const balanceIndexSource=await readFile(resolve(artifact,'patch-balance.js'),'utf8');
const patchUiIndexSource=await readFile(resolve(artifact,'ui-patch.js'),'utf8');
const perfIndexSource=await readFile(resolve(root,'scripts','perf.mjs'),'utf8');
for(const [source,marker] of [
  [metaSource,'const META_FILTER_CACHE_LIMIT=64'],
  [metaSource,'const META_HISTORY_CACHE=new WeakMap()'],
  [metaSource,'function metaHistoryFacets('],
  [metaSource,'function metaIndexAddRow('],
  [metaSource,'function historicPatchCacheHit('],
  [patchSource,'rememberHistoricPatch(db,id,P)'],
  [balanceIndexSource,'function patchSystemUsageIndex('],
  [balanceIndexSource,'const SYSTEM_USAGE_INDEX_CACHE=new WeakMap()'],
  [patchUiIndexSource,'metaHistoryFacets(DB)'],
  [perfIndexSource,'meta_incremental_append'],
  [perfIndexSource,'system_usage_reference_scan']
]){
  if(!source.includes(marker)){
    failed=true;console.error('11.5/4 index or performance gate missing: '+marker);
  }
}

// 11.5/5: one canonical regional/transfer-registration rule path, no dead wrappers.
const stage5Finance=await readFile(resolve(artifact,'finance.js'),'utf8');
const stage5Transfer=await readFile(resolve(artifact,'transfer.js'),'utf8');
const stage5Contracts=await readFile(resolve(artifact,'contracts.js'),'utf8');
const stage5Roster=await readFile(resolve(artifact,'roster.js'),'utf8');
const stage5Smoke=await readFile(resolve(root,'scripts','smoke.mjs'),'utf8');
for(const marker of ['function detachPlayerFromRosters(',
  'function localRegistrationError(','function contractedMoveError(',
  'function playerActiveLocalRegion(']){
  if(!stage5Roster.includes(marker)){
    failed=true;console.error('11.5/5 canonical roster helper missing: '+marker);
  }
}
for(const marker of ['localRegistrationError(db,','contractedMoveError(db,','teamNonLocalCount(db,']){
  if(!playerActionSource.includes(marker)){
    failed=true;console.error('11.5/5 player transactions no longer call canonical rules: '+marker);
  }
}
if(playerActionSource.includes('playerActionLocal')||
   playerActionSource.includes('playerActionMoveError')||
   stage5Contracts.includes('playerActionLocalError')||
   stage5Finance.includes('PAY_SCALE')||
   stage5Transfer.includes('function mResign(')||
   !stage5Smoke.includes("typeof PAY_SCALE!=='undefined'")){
  failed=true;console.error('11.5/5 deprecated registration, finance or renewal aliases returned');
}
if(stage5Roster.includes('function contractedMoveCount(db,p){ensurePlayerEligibility')||
   !stage5Roster.includes('Array.isArray(p?.contractedMoves)')||
   !stage5Roster.includes('detachPlayerFromRosters(db,player.id,team.id);')){
  failed=true;console.error('11.5/5 read-only move check or shared roster detachment changed');
}

// 11.5/5-2: Engine module manifest always supplies these domain APIs.
// Remove optional fallbacks: a missing dependency should fail loudly rather
// than quietly skipping contract, staff, draft or player-state rules.
const stage52Hooks=[
  ['system-data.js','const SYSTEM_EFFECT_KEYS='],
  ['player.js','function adaptPlayerPoolsToPatch('],
  ['player-relations.js','function ensureSatisfaction('],
  ['player-relations.js','function onSquadMoveSatisfaction('],
  ['player-relations.js','function pState('],
  ['role-conversion.js','function recordRoleConversionUsage('],
  ['staff.js','function staffProfile('],
  ['staff.js','function migrateLegacyStaffState('],
  ['career.js','function initialSalaryBudget('],
  ['career.js','function initialOfferCheck('],
  ['career.js','function setupTeamsForManager(']
];
for(const [file,marker] of stage52Hooks){
  const s=await readFile(resolve(artifact,file),'utf8');
  if(!s.includes(marker)){failed=true;console.error('11.5/5-2 required engine API missing: '+file+' '+marker)}
}
const obsoleteDomainGuards=/typeof\s+(?:SYSTEM_EFFECT_KEYS|adaptPlayerPoolsToPatch|playerOvr|ensureSatisfaction|staffProfile|resetRoleConversionSeasonLoad|recordRoleConversionUsage|onSquadMoveSatisfaction|pState|migrateLegacyStaffState|initialSalaryBudget|setupTeamsForManager|initialOfferCheck)\s*(?:===|!==)\s*['"](?:function|undefined)['"]/;
for(const file of modules.filter(f=>!['app.js','shell.html'].includes(f))){
  const s=await readFile(resolve(artifact,file),'utf8');
  if(obsoleteDomainGuards.test(s)||s.includes('resetRoleConversionSeasonLoad(')){
    failed=true;console.error('11.5/5-2 obsolete optional hook fallback: '+file);
  }
}

// 11.5/5-3: these obsolete wrappers have no runtime, markup or test caller.
// A search across all 55 canonical engine/UI source modules and the smoke suite
// found zero non-declaration uses. Keep the actual supported entrypoints.
const stage53Removed=[
  'initialSignPlayer','normalizeInitialSalaryFloor','nextMid',
  'scheduledOpeningDraft','movePlayerBetweenSquads','mOffer'
];
for(const file of modules){
  const src=await readFile(resolve(artifact,file),'utf8');
  for(const name of stage53Removed)
    if(new RegExp('\\b'+name+'\\b').test(src)){
      failed=true;console.error('11.5/5-3 obsolete/unreachable API returned in '+file+': '+name);
    }
}
for(const [file,marker] of [
  ['career.js','function initialStartNegotiation('],
  ['career.js','function autoBuildInitialSquad('],
  ['competition.js','function scheduledSeriesSession('],
  ['roster.js','function rosterMoveCheck('],
  ['state-transaction.js','function previewWorldAction('],
  ['transfer.js','function startNegotiation(']
]){
  const src=await readFile(resolve(artifact,file),'utf8');
  if(!src.includes(marker)){
    failed=true;console.error('11.5/5-3 actively used entrypoint missing in '+file+': '+marker);
  }
}
for(const marker of ['autoBuildInitialSquad(db,','rosterMoveCheck(db,'])
  if(!stage5Smoke.includes(marker)){
    failed=true;console.error('11.5/5-3 smoke acceptance lost active caller: '+marker);
  }

const regressionSource = await readFile(resolve(root, 'scripts', 'regression.mjs'), 'utf8');
for (const marker of ['01-world-bootstrap','05-contracts','06-owned-reserve-roster','06c-player-sign-transaction','06d-player-transfer-transaction','06e-ai-transfer-and-move-limit','06f-release-and-option-transaction','06g-save-format-and-cache-isolation','06h-legacy-v15-save-restoration','06i-invalid-and-forward-saves','06j-transaction-transfer-rollback','06k-transaction-roster-rollback','06l-transaction-release-option-rollback','06m-transaction-actor-parity-and-membership-guard','09-patch-baseline','11-draft-series-save','11a-meta-index-incremental-and-bounded','11b-historic-patch-cache-limit','11c-system-usage-index-parity','11d-shared-registration-rule-and-pure-preview','11e-roster-detach-is-single-owner','11f-dead-api-pruned-without-market-breakage','11g-required-domain-hooks-have-real-effects','11h-initial-market-must-use-real-budget-and-team-policy','11i-unreachable-wrappers-removed-and-supported-routes-retained','11j-initial-manager-negotiation-path-after-legacy-removal','11k-scheduled-series-session-after-unused-opener-removal','11l-reserve-preflight-and-transaction-after-legacy-removal','11m-new-procedural-regional-league-and-save-restore','mid-Bo5 session did not survive save/load']) {
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
// 11.5/5-4: multi-year games, current/legacy save restore and consecutive
// rookie/market cycles must be a required check, not an optional smoke run.
// Newly founded professional leagues may come from speculative markets,
// not solely from fixed historical-region labels.
const officeWorldSource=await readFile(resolve(artifact,'office-international.js'),'utf8');
for(const text of ['FUTURE_LEAGUE_MARKETS','newLeagueIdentity(','futureLeagueCandidates(db)',
  'historic.length&&future.length','db.global.foundedLeagueNames']){
  if(!officeWorldSource.includes(text)){
    failed=true;console.error('Speculative league expansion missing: '+text);
  }
}
const careerAcceptanceSource=await readFile(resolve(root,'scripts','career-acceptance.mjs'),'utf8');
for(const marker of ['for(let cycle=0;cycle<2;cycle++)','playDay(db,s)',
  'runOffseason(db)','closeMarket(db)','startWorldSeason(db,teamId,',
  'unpackDB(JSON.stringify(data))','packDB(db)','rosterIntegrityErrors(db)',
  'talentSupplyErrors(db)','CAREER_ACCEPTANCE']){
  if(!careerAcceptanceSource.includes(marker)){
    failed=true;console.error('11.5/5-4 multi-year acceptance missing: '+marker);
  }
}
if(!String(packageJson.scripts?.check||'').includes('scripts/career-acceptance.mjs')||
  !String(packageJson.scripts?.['career:acceptance']||'').includes('scripts/career-acceptance.mjs')){
  failed=true;console.error('11.5/5-4 career acceptance is not wired into npm run check');
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
