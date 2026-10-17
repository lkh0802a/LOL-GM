import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
let approved;
async function verify(){
  if(approved)return approved;
  const m=JSON.parse(await readFile(new URL('docs/evidence/legacy-import-limit-2026-10-17.json',root)));
  assert.equal(m.schema,1);
  assert.equal(m.baseline,'docs/evidence/squad-draft-recovery-2026-10-08.json');
  const original=await readFile(new URL(m.baseline,root));
  assert.equal(sha(original),m.baselineSha256,'original October 8 proof retained');
  assert.deepEqual(Object.keys(m.changes),['src/artifact/world.js']);
  const pin=m.changes['src/artifact/world.js'],past=JSON.parse(original);
  assert.equal(pin.historical,past.engine['world.js'],'historical world digest preserved');
  const current=await readFile(new URL('src/artifact/world.js',root));
  assert.equal(sha(current),pin.current,'reviewed world source digest');
  assert(!/\bimportLimit\s*:/.test(current.toString())&&!/\bR\.importLimit\s*=/.test(current.toString()),'retired duplicate import limit must remain absent');
  assert(current.includes('FIRST_TEAM_NON_LOCAL_LIMIT'),'active registration limit retained');
  approved=pin;return pin;
}
export async function reviewedLegacyWorldHash(path,expected){
  if(path!=='src/artifact/world.js')return sha(await readFile(new URL(path,root)));
  const pin=await verify();
  assert.equal(expected,pin.historical,'historical source must be independently attested');
  return pin.historical;
}
