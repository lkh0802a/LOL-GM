// Current behavioral regression gate. Historical evidence replayers are kept
// separately for provenance audits, not rerun against evolving documentation.
import assert from 'node:assert/strict';
import {REGRESSION_MODULES,runSequential,sourceSnapshot} from './regression-runner.mjs';
import {testHarnessStats} from './test-harness.mjs';

const archivedEvidence = file => /^verify-.*-evidence\.mjs$/.test(file);
export const CURRENT_REGRESSION_MODULES = Object.freeze(
  REGRESSION_MODULES.filter(file => !archivedEvidence(file))
);
const behaviorModules = [
  'club-home-acceptance.mjs',
  'pending-handoff-acceptance.mjs',
  'official-ui-authority-acceptance.mjs',
  'season-progress-acceptance.mjs',
  'unemployed-season-acceptance.mjs',
  'unemployed-season-ui-acceptance.mjs',
  'season-history-compaction-acceptance.mjs',
  'regression.mjs'
];
assert.deepEqual(CURRENT_REGRESSION_MODULES,behaviorModules,
  'The current regression gate must retain all eight behavioral modules');

const before=testHarnessStats();
assert.equal(before.contexts,0,'A fixture ran before regression validation');
const rows=await runSequential(CURRENT_REGRESSION_MODULES,{
  snapshot:sourceSnapshot,
  load:file=>import(new URL(file,import.meta.url)),
  report:row=>console.log('Current regression '+JSON.stringify(row))
});
const after=testHarnessStats();
assert.equal(after.engineCompiles,1,'Compile the engine once across the behavioral tests');
assert.equal(after.contexts,7,'Each of seven engine fixtures needs an isolated VM context');
console.log('CURRENT_REGRESSION_OK '+JSON.stringify({modules:rows.length,freshContexts:after.contexts,engineCompiles:after.engineCompiles,rows}));
