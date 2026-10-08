import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const root=new URL('../',import.meta.url),json=path=>JSON.parse(readFileSync(new URL(path,root),'utf8'));
const meta=json('docs/evidence/startup-theme-readability-2026-10-08.json');
assert.equal(sha(readFileSync(new URL(meta.intermediateArchive.path,root))),meta.intermediateArchive.sha256,'actual intermediate gzip bytes retained');
const compressed=readFileSync(new URL(meta.archive.path,root));assert.equal(sha(compressed),meta.archive.sha256);
const bytes=gunzipSync(compressed);assert.equal(sha(bytes),meta.archive.decodedSHA256);assert.equal(bytes.length,meta.archive.decodedBytes);
const raw=JSON.parse(bytes);for(const row of raw.files){const data=Buffer.from(raw.blobs[row.sha256],'base64');assert.equal(data.length,row.bytes);assert.equal(sha(data),row.sha256,row.path)}
for(const row of meta.sources){const data=readFileSync(new URL(row.path,root));assert.equal(sha(data),row.sha256,row.path);assert.equal(data.length,row.bytes)}
const old=raw.files.find(x=>x.path==='/tmp/theme-guide-original-main.md');const original=Buffer.from(raw.blobs[old.sha256],'base64'),current=readFileSync(new URL('docs/DEVELOPMENT.md',root));assert.ok(current.includes(original),'current guide retains entire actual-main original bytes');
assert.equal(meta.engineModules,101);assert.ok(meta.browser.cases>=102);
console.log('STARTUP_THEME_EVIDENCE_PASS',JSON.stringify({files:raw.files.length,sources:meta.sources.length,originalGuideBytes:original.length,browserCases:meta.browser.cases}));
