import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const root=new URL('../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
const summary=JSON.parse(await readFile(new URL('docs/evidence/shortlist-comparison-2026-10-08.json',root)));
const pieces=summary.archive.parts?await Promise.all(summary.archive.parts.map(async row=>{const b=await readFile(new URL(row.path,root));assert.equal(sha(b),row.sha256,row.path);assert.equal(b.length,row.bytes,row.path);return b;})):null;
const compressed=pieces?Buffer.concat(pieces):await readFile(new URL(summary.archive.path,root));assert.equal(sha(compressed),summary.archive.compressedSha256);
const bytes=gunzipSync(compressed);assert.equal(sha(bytes),summary.archive.decodedSha256);assert.equal(bytes.length,summary.archive.decodedBytes);
const archive=JSON.parse(bytes),raw=archive.rawBytesBySha256;
for(const [hash,row] of Object.entries(raw)){const b=Buffer.from(row.text,row.encoding==='base64'?'base64':'utf8');assert.equal(sha(b),hash);}
for(const [path,row] of Object.entries(archive.rawFileIndex)){assert(raw[row.sha256],path);const r=raw[row.sha256];assert.equal(Buffer.from(r.text,r.encoding==='base64'?'base64':'utf8').length,row.bytes,path);}
assert.equal(sha(archive.originalGuide.text),summary.originalGuideSha256);assert.equal(Buffer.byteLength(archive.originalGuide.text),archive.originalGuide.bytes);
const guide=await readFile(new URL('docs/DEVELOPMENT.md',root));assert(guide.includes(Buffer.from(archive.originalGuide.text)),'current-main original guide bytes must remain contiguous in order');
// 12.5.4.4 changes only the UI registry and adds a bounded theme file budget.
// Keep the original evidence and compare these two current files to exact reviewed edits.
const themeEvidence=JSON.parse(await readFile(new URL('docs/evidence/startup-theme-readability-2026-10-08.json',root)));
for(const [path,row] of Object.entries(archive.sources)){
  assert.equal(sha(row.text),row.sha256,path);assert.equal(Buffer.byteLength(row.text),row.bytes,path);
  let expected=path==='scripts/verify-shortlist-comparison-evidence.mjs'?summary.verifierSource.sha256:row.sha256;
  if(path==='scripts/artifact-modules.mjs')expected=sha(row.text.replace('export const UI_MODULES = [',"export const UI_MODULES = [\n  'ui-theme.js',"));
  if(path==='scripts/check.mjs')expected=sha(row.text.replace("  'ui-startup.js': 7000,","  'ui-startup.js': 7000,\n  'ui-theme.js': 1500,"));
  if(path==='scripts/verify-shortlist-comparison-evidence.mjs'){
    const successor=themeEvidence.sources.find(x=>x.path===path);assert(successor,'reviewed current verifier source');expected=successor.sha256;
  }
  assert.equal(sha(await readFile(new URL(path,root))),expected,path);
}

for(const [path,row] of Object.entries(archive.originalSources))if(!row.absentAtBase)assert.equal(sha(row.text),row.sha256,path);
const api=JSON.parse(raw[archive.rawFileIndex['/tmp/shortlist-preparation-api.json'].sha256].text);assert.equal(JSON.parse(api.main).object.sha,summary.base);
const automation=JSON.parse(raw[archive.rawFileIndex['/tmp/shortlist-automation-original.json'].sha256].text)[0];assert.equal(automation.prompt.length,19719);assert(automation.is_enabled);assert.equal(automation.default_timezone,'Asia/Seoul');
assert.deepEqual(summary.accepted,archive.accepted);assert(archive.accepted.raw.endings.flat().every(x=>x.kind==='nexus'));
for(const capture of summary.captures)assert.equal(sha(await readFile(new URL(capture.path,root))),capture.sha256);
console.log('관심 후보 비교 원본 검증 '+JSON.stringify({rawFiles:Object.keys(archive.rawFileIndex).length,rawUnique:Object.keys(raw).length,originalGuide:true,currentSources:true,temporaryFilesRequired:false}));
