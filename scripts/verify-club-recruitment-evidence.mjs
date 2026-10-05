// Verify durable raw evidence without assuming any /tmp original survives.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url),directory=new URL('docs/evidence/',root);
const diagnostic=JSON.parse(await readFile(new URL('club-recruitment-briefing-diagnostics.json',directory),'utf8'));
const acceptance=JSON.parse(await readFile(new URL('club-recruitment-briefing.json',directory),'utf8'));
const sha=data=>createHash('sha256').update(data).digest('hex');
const metadata=diagnostic.rawTextPartsArtifact;
assert.equal(metadata.path,'club-recruitment-raw-text.json.gz');
const compressed=await readFile(new URL(metadata.path,directory));
assert.equal(sha(compressed),metadata.gzipSha256);
assert.equal(compressed.length,metadata.gzipBytes);
const decoded=gunzipSync(compressed);
assert.equal(sha(decoded),metadata.decodedSha256);
assert.equal(decoded.length,metadata.decodedBytes);
const archive=JSON.parse(decoded.toString('utf8')),parts=archive.rawTextParts;
for(const [hash,text] of Object.entries(parts))assert.equal(sha(text),hash);
function restore(row){
  const text=row.parts.map(hash=>{assert(Object.hasOwn(parts,hash));return parts[hash]}).join('');
  assert.equal(Buffer.byteLength(text),row.bytes);
  return text;
}
for(const [hash,row] of Object.entries(archive.rawFilesBySha256))assert.equal(sha(restore(row)),hash);
for(const [path,hash] of Object.entries(diagnostic.rawFileSha256))assert(Object.hasOwn(archive.rawFilesBySha256,hash),path);
for(const [name,row] of Object.entries(acceptance.rawSnapshots)){
  assert.deepEqual(row,archive.rawSnapshots[name]);
  assert.equal(sha(restore(row)),row.sha256);
  JSON.parse(restore(row));
}
assert.equal(restore(acceptance.rawSnapshots.expected),restore(acceptance.rawSnapshots.after));
for(const [path,hash] of Object.entries(acceptance.sourceHashes)){
  assert.equal(sha(archive.finalSources[path]),hash,path);
  if(process.argv.includes('--current'))assert.equal(sha(await readFile(new URL(path,root))),hash,path);
}
for(const [path,row] of Object.entries(diagnostic.originalSources))assert.equal(sha(row.text),row.sha256,path);
console.log('관측 영입 원본 증거 검증 '+JSON.stringify({rawFiles:Object.keys(archive.rawFilesBySha256).length,rawSegments:Object.keys(parts).length,wholeStates:Object.keys(archive.rawSnapshots).length,archivedSources:Object.keys(acceptance.sourceHashes).length,currentSourceCheck:process.argv.includes('--current'),temporaryFilesRequired:false}));
