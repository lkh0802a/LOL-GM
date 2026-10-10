import {stoveSourceHash,stoveSourceText} from './stove-source-successor.mjs';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const root=new URL('../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
const expectedOriginals={"index.html": "f6b123cb1c1616a2161e75d12b921b0c534ba40c5cc4f8ef72e1a0ad9da41e70", "scripts/artifact-modules.mjs": "39e1d0252406e8bb5c1baf429b15d10be9cba223d1e26cf234286c3a000cfcc6", "scripts/check.mjs": "32dc7a7a071c5ca3c555e2de61930dc4ac704a97184feba19cfcf2fd8a168369", "scripts/startup-flow-acceptance.mjs": "a5c2edc669baddb2d631953804f76737ad9013e9887a3968a1c4754b55544b20", "scripts/initial-table-source-successor.mjs": "e2e13d32177af3f2a76195157382b0d6c8e77b711b8b0a159ed5d9f08ec886fb", "src/artifact/ui-data.js": "cf84d7359685f36359654688b9595d79e24568d2f1aa95508f599c0cf38fd7c6"};
let verified;
async function verify(){
 if(verified)return verified;
 const e=JSON.parse(await readFile(new URL('docs/evidence/save-library-2026-10-10.json',root)));
 assert.equal(e.base,'2b3fb246556a5d93ad578dfda80301cc2f2c0503');assert.deepEqual(e.originals,expectedOriginals);
 const zip=await readFile(new URL(e.archive.path,root));assert.equal(zip.length,e.archive.bytes);assert.equal(sha(zip),e.archive.sha256);
 const raw=gunzipSync(zip);assert.equal(sha(raw),e.archive.decodedSha256);const rows=JSON.parse(raw);
 for(const r of rows){const b=Buffer.from(r.base64,'base64');assert.equal(b.length,r.bytes);assert.equal(sha(b),r.sha256)}
 const original=p=>Buffer.from(rows.find(r=>r.path==='original/'+p).base64,'base64').toString();
 for(const [p,h] of Object.entries(e.originals))assert.equal(sha(Buffer.from(original(p))),h,p+' exact original');
 for(const [p,h] of Object.entries(e.sources))assert.equal(await stoveSourceHash(p),h,p+' actual reviewed source');
 const p='scripts/initial-table-source-successor.mjs',prefix="import {saveLibrarySourceHash,saveLibrarySourceText} from './save-library-source-successor.mjs';\n";
 assert.equal(await stoveSourceText(p),prefix+original(p).replaceAll("assert.equal(sha(await readFile(new URL(p,root)))","assert.equal(await saveLibrarySourceHash(p)").replaceAll("(await readFile(new URL(p,root),'utf8')).split","(await saveLibrarySourceText(p)).split").replaceAll("assert.equal(await readFile(new URL(p,root),'utf8'),prefix","assert.equal(await saveLibrarySourceText(p),prefix").replaceAll("||sha(await readFile(new URL(p,root)))","||await saveLibrarySourceHash(p)").replaceAll(":readFile(new URL(p,root),'utf8')",":saveLibrarySourceText(p)"),'기존 source/SHA/assert/archive 검사를 보존하는 정확한 승계');
 for(const p of Object.keys(e.originals).filter(p=>p.endsWith('-acceptance.mjs')))assert.deepEqual((await stoveSourceText(p)).split('\n').filter(l=>l.includes('assert')),original(p).split('\n').filter(l=>l.includes('assert')),'기존 assert 원문 보존 '+p);
 for(const [p,h] of Object.entries(e.engine))assert.equal(sha(await readFile(new URL('src/artifact/'+p,root))),h);assert.equal(Object.keys(e.engine).length,101);
 for(const p of ['docs/README.md','docs/DEVELOPMENT.md'])assert((await readFile(new URL(p,root))).includes(Buffer.from(rows.find(r=>r.path==='original/'+p).base64,'base64')),'전체 승인 원문 연속 보존');
 await import('./save-library-acceptance.mjs');verified={e,rows};return verified;
}
export async function saveLibrarySourceHash(p){const {e}=await verify();return e.originals[p]||await stoveSourceHash(p)}
export async function saveLibrarySourceText(p){const {e,rows}=await verify();return e.originals[p]?Buffer.from(rows.find(r=>r.path==='original/'+p).base64,'base64').toString():stoveSourceText(p)}
