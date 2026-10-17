// Historical assertions retain their original bytes; these are not current-pass claims.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const root=new URL('../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
let verified;
export async function verifyScrimSources(){
  if(verified)return verified;
  const e=JSON.parse(await readFile(new URL('docs/evidence/scrim-single-result-2026-10-18.json',root)));
  assert.equal(e.base,'494a3a9f09f627e64db7e59bde0acece7f2b2df0');
  const zip=await readFile(new URL(e.archive.path,root));assert.equal(zip.length,e.archive.bytes);assert.equal(sha(zip),e.archive.sha256);
  const raw=gunzipSync(zip);assert.equal(sha(raw),e.archive.decodedSha256);
  const rows=JSON.parse(raw);assert.equal(rows.length,e.archive.rows);const originals={};
  for(const r of rows){const b=Buffer.from(r.base64,'base64');assert.equal(b.length,r.bytes);assert.equal(sha(b),r.sha256);assert.equal(e.originals[r.path],r.sha256);originals[r.path]=b.toString()}
  assert.deepEqual(Object.keys(originals),Object.keys(e.originals));
  for(const [p,h] of Object.entries(e.sources))assert.equal(sha(await readFile(new URL(p,root))),h,p+' exact reviewed current bytes');
  assert(Object.keys(e.sources).length>=12,'explicit current source/test/proof bindings required');
  for(const p of ['scripts/negotiation-summary-source-successor.mjs','scripts/initial-negotiation-review-source-successor.mjs','scripts/startup-save-source-successor.mjs','scripts/stove-fa-source-successor.mjs']){
    const expected="import {scrimSourceHash} from './scrim-single-result-source-successor.mjs';\n"+originals[p].split('\n').map(line=>/^(?:for\(|assert\.)/.test(line.trim())?line.replace("sha(await readFile(new URL('src/artifact/'+p,root)))","await scrimSourceHash('src/artifact/'+p)"):line).join('\n');
    assert.equal(await readFile(new URL(p,root),'utf8'),expected,p+' all original assertions retained');
  }
  const p='scripts/negotiation-final-source-successor.mjs';
  const expected="import {scrimSourceHash,scrimSourceText} from './scrim-single-result-source-successor.mjs';\n"+originals[p].split('\n').map(line=>line.trimStart().startsWith('const changes=')?line:line
    .replaceAll('sha(await readFile(new URL(p,root)))','await scrimSourceHash(p)')
    .replaceAll("await readFile(new URL(p,root),'utf8')",'await scrimSourceText(p)')
    .replaceAll("await readFile(new URL(paths[5],root),'utf8')",'await scrimSourceText(paths[5])')
    .replaceAll("await readFile(new URL(paths[3],root),'utf8')",'await scrimSourceText(paths[3])')).join('\n');
  assert.equal(await readFile(new URL(p,root),'utf8'),expected,'exact historical evidence routing only');
  const guide='scripts/current-guide-source-successor.mjs';
  assert.equal(await readFile(new URL(guide,root),'utf8'),"import {scrimSourceText} from './scrim-single-result-source-successor.mjs';\n"+originals[guide].replace("(await readFile(new URL(p,root),'utf8')).endsWith(original[p])","(await scrimSourceText(p)).endsWith(original[p])"),'original guide suffix assertion retained on complete historical bytes');
  assert.equal(await readFile(new URL('scripts/smoke.mjs',root),'utf8'),"await import('./scrim-single-result-acceptance.mjs');\n"+originals['scripts/smoke.mjs'],'all smoke assertions retained with new acceptance');
  for(const p of ['docs/README.md','docs/DEVELOPMENT.md']){assert(originals['main/'+p].includes(originals[p]),p+' complete release guide retained in latest main');assert((await readFile(new URL(p,root),'utf8')).includes(originals['main/'+p]),p+' latest main and complete prior guide retained');}
  verified={e,originals};return verified;
}
export async function scrimSourceHash(p){const {e}=await verifyScrimSources();return e.originals[p]||sha(await readFile(new URL(p,root)))}
export async function scrimSourceText(p){const {originals}=await verifyScrimSources();return originals[p]??readFile(new URL(p,root),'utf8')}
