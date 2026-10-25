import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,writeFile,readFile,symlink,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {verifyChampionSourceBundle as verify,inspectChampionSourceDirectory as inspect} from './verify-champion-source-bundle.mjs';

// Byte/identity fixtures only, deliberately without production numeric/mechanic values.
const pin='16.19.1',id='ControlledA';
const raw=(championId=id,key='1',v=pin)=>Buffer.from(JSON.stringify({type:'champion',format:'standAloneComplex',version:v,
  data:{[championId]:{id:championId,key,name:'Controlled fixture'}}}));
const entry=(bytes=raw(),championId=id)=>({championId,path:championId+'.json',
  url:`https://ddragon.leagueoflegends.com/cdn/${pin}/data/en_US/champion/${championId}.json`,
  retrievedAt:'2026-10-25T00:00:00Z',sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,
  rights:{reference:'controlled test fixture; no Riot origin asserted',redistribution:'UNVERIFIED'}});
const manifest=(entries=[entry()])=>({schema:1,provider:'Riot Data Dragon',version:pin,locale:'en_US',files:entries});
const run=(m=manifest(),bytes=raw(),expectedVersion=pin)=>verify(m,{expectedVersion,readBytes:async()=>bytes});
const input=manifest(),before=JSON.stringify(input),good=await run(input);
assert.equal(good.status,'INTEGRITY_CHECKED');assert.equal(good.filesChecked,1);
assert.equal(JSON.stringify(input),before);assert.equal(good.files[0].bytesMatchManifest,true);
for(const key of ['remoteOriginVerified','rightsVerified','numericSemanticsVerified','executableMechanicsVerified'])assert.equal(good[key],false);
const claimed=manifest();claimed.files[0].rights.redistribution='REVIEWED';
const claimReport=await run(claimed);assert.equal(claimReport.rightsVerified,false);assert.equal(claimReport.remoteOriginVerified,false);
let rejected=0;
for(const change of [
 m=>{m.version='latest'},m=>{m.version='16.20.1'},m=>{m.provider='Unknown'},m=>{m.locale='xx_XX'},
 m=>{m.files=[]},m=>{m.files.push({...m.files[0]})},m=>{m.files[0].path='../ControlledA.json'},
 m=>{m.files[0].path='/ControlledA.json'},m=>{m.files[0].url=m.files[0].url.replace(pin,'16.20.1')},
 m=>{m.files[0].url+='?version=latest'},m=>{m.files[0].url=m.files[0].url.replace('https:','http:')},
 m=>{m.files[0].retrievedAt='2026-02-30T00:00:00Z'},m=>{delete m.files[0].sha256},
 m=>{m.files[0].bytes=0},m=>{m.files[0].rights.redistribution='APPROVED_BY_MANIFEST'}
]){
 const m=manifest();change(m);let reads=0;
 const result=await verify(m,{expectedVersion:pin,readBytes:async()=>{reads++;return raw()}});
 assert.equal(result.status,'REJECTED');assert.equal(reads,0,'invalid manifest must not open raw paths');rejected++;
}
for(const m of [null,[],{},manifest()]){
 const result=await run(m,raw(),'latest');assert.equal(result.status,'REJECTED');rejected++;
}
for(const bytes of [Buffer.concat([raw(),Buffer.from(' ')]),Buffer.from('tampered'),Buffer.from('')]){
 assert((await run(manifest(),bytes)).errors.some(e=>e.code==='BYTE_INTEGRITY_MISMATCH'));rejected++;
}
for(const bytes of [raw(id,'1','16.20.1'),raw('ControlledB'),Buffer.from('{'),Buffer.from([0xff]),
 raw(id,'0'),raw(id,'9007199254740992')]){
 assert.equal((await run(manifest([entry(bytes)]),bytes)).status,'REJECTED');rejected++;
}
const other=raw('ControlledB','1'),map=new Map([[id+'.json',raw()],['ControlledB.json',other]]);
const duplicateKey=await verify(manifest([entry(),entry(other,'ControlledB')]),{expectedVersion:pin,readBytes:async path=>map.get(path)});
assert(duplicateKey.errors.some(e=>e.code==='RAW_VERSION_OR_IDENTITY_MISMATCH'));rejected++;
assert((await verify(manifest(),{expectedVersion:pin,readBytes:async()=>{throw Error('missing')}})).errors.some(e=>e.code==='READ_FAILED'));
assert((await run(manifest(),'text, not bytes')).errors.some(e=>e.code==='RAW_BYTES_REQUIRED'));
const mutable=manifest();const detached=await verify(mutable,{expectedVersion:pin,readBytes:async()=>{
 mutable.files[0].sha256='0'.repeat(64);mutable.files[0].rights.reference='changed';return raw();
}});
assert.equal(detached.status,'INTEGRITY_CHECKED');assert.notEqual(detached.files[0].rights.reference,'changed');

const dir=await mkdtemp(join(tmpdir(),'lol-gm-source-bundle-'));
try{
 const root=join(dir,'raw');await mkdir(root);const m=manifest(),manifestFile=join(dir,'manifest.json');
 await writeFile(join(root,id+'.json'),raw());await writeFile(manifestFile,JSON.stringify(m));
 assert.equal((await inspect(m,root,pin)).status,'INTEGRITY_CHECKED');
 const cli=fileURLToPath(new URL('./verify-champion-source-bundle.mjs',import.meta.url));
 const invoke=args=>spawnSync(process.execPath,[cli,...args],{encoding:'utf8'});
 const args=['--manifest',manifestFile,'--root',root,'--version',pin],accepted=invoke(args);
 assert.ifError(accepted.error);assert.equal(accepted.status,0,accepted.stderr);assert.equal(JSON.parse(accepted.stdout).remoteOriginVerified,false);
 assert.deepEqual(await readFile(join(root,id+'.json')),raw());
 assert.equal(await readFile(manifestFile,'utf8'),JSON.stringify(m),'CLI must preserve manifest bytes');
 await writeFile(join(root,id+'.json'),Buffer.from('corrupt'));
 const corrupt=invoke(args);assert.equal(corrupt.status,1);assert.equal(JSON.parse(corrupt.stdout).status,'REJECTED');
 const usage=invoke(args.slice(0,4));assert.equal(usage.status,2);assert.equal(JSON.parse(usage.stdout).executableMechanicsVerified,false);
 await rm(join(root,id+'.json'));await writeFile(join(dir,'outside.json'),raw());
 await symlink(join(dir,'outside.json'),join(root,id+'.json'));
 const escaped=await inspect(m,root,pin);assert(escaped.errors.some(e=>e.code==='READ_FAILED'));
}finally{await rm(dir,{recursive:true,force:true})}
console.log('CHAMPION_SOURCE_BUNDLE_ACCEPTANCE '+JSON.stringify({controlledFixtures:true,invalidCases:rejected,
 byteIntegrity:true,pinIdentity:true,readOnlyCLI:true,pathBoundary:true,producerDetached:true,actualRemoteSourceAcquired:false,executableMechanicsVerified:false}));
