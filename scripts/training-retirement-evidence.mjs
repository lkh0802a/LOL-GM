import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
let approved;
async function pins(){
 if(approved)return approved;
 const m=JSON.parse(await readFile(new URL('docs/evidence/training-retirement-2026-10-17.json',root)));
 assert.equal(m.schema,1);
 const oldBuffer=await readFile(new URL(m.baseline,root));
 assert.equal(sha(oldBuffer),m.baselineSha256,'original squad archive manifest');
 const previous=JSON.parse(oldBuffer);
 const sourceBuffer=await readFile(new URL(m.sourceBaseline,root));
 assert.equal(sha(sourceBuffer),m.sourceBaselineSha256,'original negotiation archive manifest');
 const second=JSON.parse(sourceBuffer);
 const rows={...m.changes,...m.successors};
 assert.deepEqual(Object.keys(m.successors),["scripts/negotiation-summary-source-successor.mjs","scripts/initial-negotiation-review-source-successor.mjs","scripts/startup-save-source-successor.mjs","scripts/stove-fa-source-successor.mjs"]);
 for(const [path,pin] of Object.entries(rows)){
   const initial=m.successors[path]?second.sources[path]:path.startsWith('src/artifact/')?previous.engine[path.slice('src/artifact/'.length)]||previous.sources[path]:previous.sources[path];
   assert.equal(pin.historical,initial,path+' original evidence pin');
   assert.equal(sha(await readFile(new URL(path,root))),pin.current,path+' reviewed current source');
 }
 approved=rows;return rows;
}
export async function reviewedRetirementSourceHash(path){
 const rows=await pins();
 if(Object.hasOwn(rows,path))return rows[path].historical;
 return sha(await readFile(new URL(path,root)));
}
