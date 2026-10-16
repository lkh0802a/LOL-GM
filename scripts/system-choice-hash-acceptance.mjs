// Compare real item/starter/rune choices and scores with the preceding public
// functions; keep that implementation as an independent archived oracle.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {runEngineFixture} from './test-harness.mjs';
const root=new URL('../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
const evidence=JSON.parse(await readFile(new URL('docs/evidence/system-choice-hash-2026-10-17.json',root)));
const archive=await readFile(new URL(evidence.archive.path,root));
assert.equal(archive.length,evidence.archive.bytes);assert.equal(sha(archive),evidence.archive.sha256);
const original=gunzipSync(archive).toString();assert.equal(sha(original),evidence.predecessorSha256);
assert.equal(sha(await readFile(new URL('src/artifact/systems.js',root))),evidence.currentSha256);
const section=(from,to)=>{const a=original.indexOf(from),b=to?original.indexOf(to,a):original.length;assert(a>=0&&b>a);return original.slice(a,b)};
const prior=(section('function selectItemBuild(', 'function itemCraftActions(')+section('function runeChoiceScore('))
 .replaceAll('selectItemBuild','priorSelectItemBuild').replaceAll('selectStarterItem','priorSelectStarterItem')
 .replaceAll('runeChoiceScore','priorRuneChoiceScore').replaceAll('selectRunePage','priorSelectRunePage');
const result=await runEngineFixture(prior+String.raw`
(()=>{
 const same=(a,b,label)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw Error('SYSTEM_CHOICE_HASH '+label)};
 const strings=['','plain','선수|역할','\ud83d\ude00','\ud800','\udfff','a\u0000b','|rune|'];let hashes=0,choices=0,scores=0;
 for(const a of strings)for(const b of strings){same(systemChoiceHash(hashStr(a),b),hashStr(a+b),'UTF-16 continuation');hashes++;}
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:10,div2:false})];const db=buildWorld(cfg);
 const players=[null,{id:'long-player-prefix-선수-123456789'},{id:'same|champ|MID|rune|'}];
 for(const c of Object.values(db.patch.champions))for(const role of ['TOP','JGL','MID','ADC','SUP'])for(const p of players){
  same(selectItemBuild(db.patch,c,p,role),priorSelectItemBuild(db.patch,c,p,role),'item build');
  same(selectStarterItem(db.patch,c,p,role),priorSelectStarterItem(db.patch,c,p,role),'starter');
  same(selectRunePage(db.patch,c,p,role),priorSelectRunePage(db.patch,c,p,role),'rune page');choices+=3;
  for(const id of Object.keys(db.patch.runeDefs)){same(runeChoiceScore(db.patch,c,p,role,id),priorRuneChoiceScore(db.patch,c,p,role,id),'exact rune score');scores++;}
 }
 // Definitions changed in place must be read immediately; no cached outcome.
 const c=Object.values(db.patch.champions)[0],id=Object.keys(db.patch.runeDefs)[0];db.patch.runeDefs[id].active=false;
 same(runeChoiceScore(db.patch,c,players[1],'MID',id),priorRuneChoiceScore(db.patch,c,players[1],'MID',id),'inactive rune');
 same(selectRunePage(db.patch,c,players[1],'MID'),priorSelectRunePage(db.patch,c,players[1],'MID'),'changed page');
 return {hashes,choices,scores,definitionMutation:true};
})()`,{timeout:120000,filename:'system-choice-hash-acceptance.js'});
console.log('SYSTEM_CHOICE_HASH_ACCEPTANCE '+JSON.stringify(result));
