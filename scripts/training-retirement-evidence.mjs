import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
let approved,historicalEnginePins;
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
 // An approved UI-only deletion has its own October 9 original archive.
 // Verify both the immutable evidence manifest and the live replacement bytes.
 assert.equal(m.uiBaseline,'docs/evidence/squad-status-2026-10-09.json');
 const uiBytes=await readFile(new URL(m.uiBaseline,root));
 assert.equal(sha(uiBytes),m.uiBaselineSha256,'original roster evidence manifest');
 const uiBaseline=JSON.parse(uiBytes);
 assert.deepEqual(Object.keys(m.uiSuccessors),['src/artifact/ui-roster.js']);
 for(const [path,pin] of Object.entries(m.uiSuccessors)){
   assert.equal(pin.historical,uiBaseline.sources[path],path+' archived October 9 source pin');
   assert.equal(sha(await readFile(new URL(path,root))),pin.current,path+' approved current UI bytes');
   rows[path]=pin;
 }
 assert.deepEqual(Object.keys(m.successors),["scripts/negotiation-summary-source-successor.mjs","scripts/initial-negotiation-review-source-successor.mjs","scripts/startup-save-source-successor.mjs","scripts/stove-fa-source-successor.mjs"]);
 // The retired squad fixture caused a necessary change in an older,\n // byte-for-byte successor assertion. Verify the Oct 10 reviewed digest\n // and the replacement source before allowing that one exception.\n const intermediaryPath='docs/evidence/stove-fa-daily-2026-10-10.json';\n const intermediaryBytes=await readFile(new URL(intermediaryPath,root));\n assert.equal(sha(intermediaryBytes),m.historicalEvidence[intermediaryPath],'immutable intermediate evidence');\n const intermediary=JSON.parse(intermediaryBytes);\n assert.deepEqual(Object.keys(m.intermediaries),['scripts/squad-status-source-successor.mjs']);\n for(const [path,pin] of Object.entries(m.intermediaries)){\n   assert.equal(pin.historical,intermediary.sources[path],path+' archived reviewed intermediate');\n   assert.equal(sha(await readFile(new URL(path,root))),pin.current,path+' approved retirement verifier');\n   rows[path]=pin;\n }\n for(const [path,pin] of Object.entries(rows)){
   const initial=m.uiSuccessors?.[path]?uiBaseline.sources[path]:m.intermediaries?.[path]?intermediary.sources[path]:m.successors[path]?second.sources[path]:path.startsWith('src/artifact/')?previous.engine[path.slice('src/artifact/'.length)]||previous.sources[path]:previous.sources[path];
   assert.equal(pin.historical,initial,path+' original evidence pin');
   assert.equal(sha(await readFile(new URL(path,root))),pin.current,path+' reviewed current source');
 }
 const oldHashes={};
 for(const [path,proof] of Object.entries(m.historicalEvidence)){
   const bytes=await readFile(new URL(path,root));
   assert.equal(sha(bytes),proof,'historical evidence manifest integrity '+path);
   const prior=JSON.parse(bytes);
   for(const [name,value] of Object.entries(prior.engine||{})){
     const key='src/artifact/'+name;
     if(!Object.hasOwn(rows,key))continue;
     (oldHashes[key]??=new Set([rows[key].historical])).add(value);
   }
   // A historic source may have a different intermediate byte digest from
   // its earlier engine snapshot. Require that exact digest to occur in an
   // immutable, hash-verified historical manifest before accepting it.
   for(const [key,value] of Object.entries(prior.sources||{})){
     if(!Object.hasOwn(rows,key))continue;
     (oldHashes[key]??=new Set([rows[key].historical])).add(value);
   }
 }
 historicalEnginePins=oldHashes;
 approved=rows;return rows;
}
export async function reviewedRetirementSourceHash(path,expected=null){
 const rows=await pins();
 if(Object.hasOwn(rows,path)){
   if(expected!==null){
     assert((historicalEnginePins[path]||new Set([rows[path].historical])).has(expected),path+' expected historical hash must exist in verified proof');
     return expected;
   }
   return rows[path].historical;
 }
 return sha(await readFile(new URL(path,root)));
}
