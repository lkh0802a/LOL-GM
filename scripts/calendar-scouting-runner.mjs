import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {ENGINE_MODULES} from './artifact-modules.mjs';

const acceptances=[
  'calendar-depth-acceptance.mjs',
  'timezone-calendar-acceptance.mjs',
  'scrim-partner-acceptance.mjs',
  'scrim-plans-acceptance.mjs',
  'fight-skill-acceptance.mjs',
  'system-patch-acceptance.mjs',
  'role-quest-rules-acceptance.mjs',
  'save-history-acceptance.mjs',
  'split-standings-acceptance.mjs',
  'scouting-depth-acceptance.mjs',
  'scouting-operations-acceptance.mjs',
  'scouting-reassessment-acceptance.mjs'
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
  'calendar/scouting runner must compile the engine exactly once');
assert.equal(stats.contexts,acceptances.length,
  'every calendar/scouting acceptance must receive a fresh VM context');
assert(stats.cachedArtifacts>=ENGINE_MODULES.length,
  'calendar/scouting runner did not cache the complete engine source');

console.log('CALENDAR_SCOUTING_RUNNER '+JSON.stringify({
  acceptances:rows.length,
  engineModules:ENGINE_MODULES.length,
  engineCompiles:stats.engineCompiles,
  freshContexts:stats.contexts,
  artifactReads:stats.reads,
  cachedArtifacts:stats.cachedArtifacts,
  totalMs:Math.round(rows.reduce((n,row)=>n+row.ms,0)*10)/10,
  rows
}));
