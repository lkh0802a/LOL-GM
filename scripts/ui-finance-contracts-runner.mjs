import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {ENGINE_MODULES} from './artifact-modules.mjs';

const acceptances=[
  'ui-state-acceptance.mjs',
  'ui-overlay-acceptance.mjs',
  'ui-async-acceptance.mjs',
  'ui-mobile-a11y-acceptance.mjs',
  'finance-acceptance.mjs',
  'finance-depth-acceptance.mjs',
  'contract-duration-acceptance.mjs',
  'contract-negotiation-state-acceptance.mjs',
  'contract-window-acceptance.mjs'
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

console.log('UI_FINANCE_CONTRACTS_RUNNER '+JSON.stringify({
  acceptances:rows.length,
  engineModules:ENGINE_MODULES.length,
  engineCompiles:stats.engineCompiles,
  artifactReads:stats.reads,
  cachedArtifacts:stats.cachedArtifacts,
  totalMs:Math.round(rows.reduce((n,row)=>n+row.ms,0)*10)/10,
  rows
}));
