import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {ENGINE_MODULES} from './artifact-modules.mjs';

const acceptances=[
  'bootstrap-seed-acceptance.mjs',
  'ui-state-acceptance.mjs',
  'analysis-room-acceptance.mjs',
  'analysis-tiers-acceptance.mjs',
  'analysis-comparison-acceptance.mjs',
  'draft-preparation-acceptance.mjs',
  'draft-history-acceptance.mjs',
  'match-history-acceptance.mjs',
  'match-adjudication-acceptance.mjs',
  'item-purchase-ledger-acceptance.mjs',
  'inventory-defense-acceptance.mjs',
  'inventory-offense-acceptance.mjs',
  'combat-resource-acceptance.mjs',
  'objective-award-acceptance.mjs',
  'takedown-reward-acceptance.mjs',
  'ui-overlay-acceptance.mjs',
  'ui-async-acceptance.mjs',
  'ui-mobile-a11y-acceptance.mjs',
  'career-public-information-acceptance.mjs',
  'finance-acceptance.mjs',
  'finance-depth-acceptance.mjs',
  'contract-duration-acceptance.mjs',
  'contract-negotiation-state-acceptance.mjs',
  'contract-buyout-acceptance.mjs',
  'contract-window-acceptance.mjs',
  'market-reserve-acceptance.mjs',
  'owned-reserve-coach-acceptance.mjs',
  'contract-release-acceptance.mjs',
  'contract-release-liability-acceptance.mjs',
  'contract-guarantee-acceptance.mjs',
  'contract-mutual-termination-acceptance.mjs',
  'transfer-consent-acceptance.mjs',
  'contract-role-promise-acceptance.mjs',
  'player-representation-acceptance.mjs',
  'agent-negotiation-parity-acceptance.mjs',
  'player-loan-acceptance.mjs',
  'transfer-stage-acceptance.mjs',
  'local-service-acceptance.mjs',
  'registration-acceptance.mjs',
  'first-selection-acceptance.mjs',
  'opponent-intent-acceptance.mjs',
  'draft-observer-information-acceptance.mjs',
  'champion-scout-observation-acceptance.mjs',
  'squad-observer-information-acceptance.mjs',
  'squad-staging-acceptance.mjs',
  'ban-attribution-acceptance.mjs',
  'participant-meta-acceptance.mjs',
  'side-meta-acceptance.mjs',
  'composition-meta-acceptance.mjs',
  'draft-order-meta-acceptance.mjs',
  'tactic-meta-acceptance.mjs',
  'practice-meta-acceptance.mjs',
  'analyst-report-acceptance.mjs',
  'opponent-report-acceptance.mjs',
  'opponent-draft-acceptance.mjs',
  'player-champion-information-acceptance.mjs',
  'observer-player-profile-acceptance.mjs',
  'training-allocation-acceptance.mjs',
  'cohesion-practice-acceptance.mjs',
  'relationship-decisions-acceptance.mjs',
  'club-ownership-acceptance.mjs',
  'staff-contracts-acceptance.mjs',
  'staff-registration-acceptance.mjs',
  'club-license-acceptance.mjs',
  'region-continuity-acceptance.mjs',
  'club-closure-acceptance.mjs',
  'club-estate-acceptance.mjs',
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
assert.equal(stats.contexts,67,
  'all 67 engine fixtures, including independent inventory-defense and analysis/report coverage, must each receive a fresh VM context');

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
