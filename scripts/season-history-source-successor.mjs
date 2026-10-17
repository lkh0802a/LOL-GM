import {seasonUiSourceHash} from './unemployed-season-source-successor.mjs';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
const reviewed=new Set(['src/artifact/season.js','package.json','index.html','scripts/verify-official-draft-evidence.mjs','scripts/verify-official-edit-evidence.mjs','scripts/verify-squad-draft-recovery-evidence.mjs','scripts/verify-shortlist-comparison-evidence.mjs']);
let evidence;
async function successor(){
  if(evidence)return evidence;
  const e=JSON.parse(await readFile(new URL('docs/evidence/season-history-compaction-2026-10-08.json',root)));
  const compressed=await readFile(new URL(e.archive.path,root));assert.equal(sha(compressed),e.archive.sha256);
  const decoded=gunzipSync(compressed);assert.equal(sha(decoded),e.archive.decodedSha256);
  const rows=JSON.parse(decoded);
  for(const row of rows){const b=Buffer.from(row.base64,'base64');assert.equal(b.length,row.bytes);assert.equal(sha(b),row.sha256)}
  for(const p of reviewed){
    assert(rows.some(r=>r.path==='original/'+p&&r.sha256===e.originals[p]),p+' original retained');
    assert(rows.some(r=>r.path==='current/'+p&&r.sha256===e.sources[p]),p+' reviewed source retained');
    assert.equal(await seasonUiSourceHash(p),e.sources[p],p+' reviewed current source');
  }
  evidence=e;return e;
}
// Historical assertions still check their exact original hashes. Only the
// explicitly archived retention correction may supply its verified base bytes.

// Preserve the October 8 source evidence unchanged. Explicitly reviewed
// successor bytes for the training retirement must match pinned hashes, or
// historical assertions fail rather than silently accepting any new source.
let trainingRetirementEvidence;
async function retiredTrainingSources(){
  if(trainingRetirementEvidence)return trainingRetirementEvidence;
  const m=JSON.parse(await readFile(new URL('docs/evidence/training-retirement-2026-10-17.json',root)));
  assert.equal(m.schema,1);
  assert.equal(m.baseline,'docs/evidence/squad-draft-recovery-2026-10-08.json');
  const baseline=await readFile(new URL(m.baseline,root));
  assert.equal(sha(baseline),m.baselineSha256,'training retirement original evidence must not drift');
  const old=JSON.parse(baseline);
  assert.deepEqual(Object.keys(m.changes),["scripts/squad-staging-acceptance.mjs","src/artifact/calendar.js","src/artifact/development.js","src/artifact/medical.js","src/artifact/offseason.js","src/artifact/practice-resources.js","src/artifact/role-conversion.js","src/artifact/save-migration.js","src/artifact/squad-preparation.js","src/artifact/ui-club-practice.js","src/artifact/ui-squad-preparation.js","src/artifact/world.js"]);
  for(const [path,pin] of Object.entries(m.changes)){
    const former=path.startsWith('src/artifact/')?old.engine[path.slice('src/artifact/'.length)]:null;
    assert.equal(pin.historical,former||old.sources[path],path+' historical proof pin');
    assert.equal(sha(await readFile(new URL(path,root))),pin.current,path+' approved successor digest');
  }
  trainingRetirementEvidence=m.changes;
  return trainingRetirementEvidence;
}
export async function historicalSourceHash(path){
  const approved=await retiredTrainingSources();
  if(Object.hasOwn(approved,path))return approved[path].historical;
  const actual=await seasonUiSourceHash(path);
  if(!reviewed.has(path))return actual;
  const e=await successor();return e.originals[path];
}
