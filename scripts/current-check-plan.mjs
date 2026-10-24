// #256 separates historical source provenance from current behavioral gates.
// Keep every original behavioral command and the exact historical entry point.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export async function assertCurrentCheckPlan(){
  const p=JSON.parse(await readFile(new URL('../package.json',import.meta.url)));
  const historical=p.scripts['check:historical'];
  assert.equal(createHash('sha256').update(historical).digest('hex'),'5e27d00e9b5c0428f5ff464613cf94cfd664df0e98043807b9696c50e766f56f','the original full command must remain byte-for-byte available');
  const evidence=["verify-club-home-evidence.mjs", "verify-pending-handoff-evidence.mjs", "verify-official-ui-evidence.mjs", "verify-season-progress-evidence.mjs", "verify-unemployed-season-evidence.mjs", "verify-season-history-evidence.mjs"].map(f=>'node scripts/'+f);
  const commands=historical.split(' && ');
  assert.deepEqual(commands.filter(c=>evidence.includes(c)),evidence,'only the six approved archived provenance replayers are separate');
  assert.deepEqual(p.scripts.check.split(' && '),[...commands.filter(c=>!evidence.includes(c)),'node scripts/scrim-single-result-acceptance.mjs','node scripts/save-recovery-acceptance.mjs','node scripts/save-checkpoint-acceptance.mjs','node scripts/loan-calendar-acceptance.mjs','node scripts/seeded-shuffle-acceptance.mjs','node scripts/negotiation-final-acceptance.mjs','node scripts/official-undo-clock-acceptance.mjs','node scripts/system-choice-hash-acceptance.mjs','node scripts/draft-staff-profile-acceptance.mjs','node scripts/remote-scrim-acceptance.mjs','node scripts/scouting-coverage-cost-acceptance.mjs','node scripts/scrim-observer-acceptance.mjs','node scripts/training-allocation-acceptance.mjs','node scripts/playoff-integrity-acceptance.mjs','node scripts/international-group-formats-acceptance.mjs','node scripts/international-entry-acceptance.mjs','node scripts/msi-swiss-format-acceptance.mjs','node scripts/worlds-league-phase-acceptance.mjs','node scripts/worlds-tiebreak-acceptance.mjs','node scripts/double-disqualification-acceptance.mjs','node scripts/double-disqualification-world-close-acceptance.mjs','node scripts/qualification-succession-acceptance.mjs'],'all original functional commands and the new focused gate must execute');
}
