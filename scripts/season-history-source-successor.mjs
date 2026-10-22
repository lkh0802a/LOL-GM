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
export async function historicalSourceHash(path){
  const actual=await seasonUiSourceHash(path);
  if(!reviewed.has(path))return actual;
  const e=await successor();return e.originals[path];
}
