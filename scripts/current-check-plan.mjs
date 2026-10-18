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
  assert.deepEqual(p.scripts.check.split(' && '),[...commands.filter(c=>!evidence.includes(c)),'node scripts/scrim-single-result-acceptance.mjs'],'all original functional commands and the new focused gate must execute');
}
