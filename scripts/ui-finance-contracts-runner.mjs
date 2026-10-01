import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {ENGINE_MODULES} from './artifact-modules.mjs';

const acceptances=[
  'bootstrap-seed-acceptance.mjs',
  'ui-state-acceptance.mjs',
  'ui-overlay-acceptance.mjs',
  'ui-async-acceptance.mjs',
  'ui-mobile-a11y-acceptance.mjs',
  'finance-acceptance.mjs',
  'finance-depth-acceptance.mjs',
  'contract-duration-acceptance.mjs',
  'contract-negotiation-state-acceptance.mjs',
  'contract-window-acceptance.mjs',
  'market-reserve-acceptance.mjs',
  'contract-release-acceptance.mjs',
  'contract-release-liability-acceptance.mjs',
  'contract-guarantee-acceptance.mjs',
  'rune-selection-acceptance.mjs'
];

const rows=[];
for(const file of acceptances){
  const started=performance.now();
  await import(new URL('./'+file,import.meta.url));
  rows.push({file,ms:Math.round((performance.now()-started)*10)/10});
}

const {testHarnessStats}=await import('./test-harness.mjs');
const stats=testHarnessStats();
assert.equal(stats.engineCompiles,1,
  'shared domain runner must compile the engine exactly once');
assert(stats.cachedArtifacts>=ENGINE_MODULES.length,
  'shared domain runner did not cache the complete engine source');
assert.equal(stats.contexts,11,
  'eleven engine acceptances must each receive a fresh VM context');

console.log('UI_FINANCE_CONTRACTS_RUNNER '+JSON.stringify({
  acceptances:rows.length,
  engineModules:ENGINE_MODULES.length,
  engineCompiles:stats.engineCompiles,
  freshContexts:stats.contexts,
  artifactReads:stats.reads,
  cachedArtifacts:stats.cachedArtifacts,
  totalMs:Math.round(rows.reduce((n,row)=>n+row.ms,0)*10)/10,
  rows
}));
