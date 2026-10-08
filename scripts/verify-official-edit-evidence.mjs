import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {ENGINE_MODULES} from './artifact-modules.mjs';
const root=new URL('../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
const e=JSON.parse(await readFile(new URL('docs/evidence/official-edit-context-2026-10-08.json',root)));
const zipped=await readFile(new URL(e.archive.path,root));assert.equal(sha(zipped),e.archive.sha256);
const decoded=gunzipSync(zipped);assert.equal(sha(decoded),e.archive.decodedSha256);
const rows=JSON.parse(decoded);
for(const r of rows){const b=Buffer.from(r.base64,'base64');assert.equal(b.length,r.bytes);assert.equal(sha(b),r.sha256);}
for(const [p,h] of Object.entries(e.originals))assert(rows.some(r=>r.path==='original/'+p&&r.sha256===h),p);
const next=JSON.parse(await readFile(new URL('docs/evidence/official-draft-comparison-2026-10-08.json',root)));
for(const [p,h] of Object.entries(e.sources)){
  const current=sha(await readFile(new URL(p,root)));if(current===h)continue;
  assert(['src/artifact/ui-registration.js','src/artifact/ui-club-eligibility.js','scripts/club-eligibility-acceptance.mjs','scripts/registration-acceptance.mjs','scripts/staff-registration-acceptance.mjs','scripts/verify-squad-draft-recovery-evidence.mjs','scripts/verify-official-edit-evidence.mjs','index.html'].includes(p),'reviewed official comparison successor');
  assert.equal(next.originals[p],h);assert.equal(current,next.sources[p],p);
}
assert((await readFile(new URL('docs/DEVELOPMENT.md',root))).includes(Buffer.from(rows.find(r=>r.path==='original/docs/DEVELOPMENT.md').base64,'base64')));
for(const f of ENGINE_MODULES)assert.equal(sha(await readFile(new URL('src/artifact/'+f,root))),e.engine[f],f);
console.log('OFFICIAL_EDIT_EVIDENCE PASS original records, exact source successors, guide and engine bytes');
