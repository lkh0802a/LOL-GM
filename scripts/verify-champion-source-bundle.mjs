#!/usr/bin/env node
// Offline, read-only integrity inspection. A self-described manifest cannot certify origin or mechanics.
import {readFile,realpath} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const version=x=>typeof x==='string'&&/^\d+\.\d+\.\d+$/.test(x);
const alias=x=>typeof x==='string'&&/^[A-Za-z][A-Za-z0-9]*$/.test(x);
const timestamp=x=>typeof x==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(x)&&
  Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,19)===x.slice(0,19);

export async function verifyChampionSourceBundle(manifest,{expectedVersion,readBytes}={}){
  const errors=[],files=[],paths=new Set(),ids=new Set(),riotKeys=new Set();
  const fail=(path,code)=>errors.push({path,code});
  try{manifest=JSON.parse(JSON.stringify(manifest))}catch{manifest=null}
  if(!version(expectedVersion))fail('expectedVersion','PIN_REQUIRED');
  if(!record(manifest)||manifest.schema!==1||manifest.provider!=='Riot Data Dragon'||
    manifest.version!==expectedVersion||!version(manifest.version)||
    !['en_US','ko_KR'].includes(manifest.locale))fail('manifest','INVALID_PIN_OR_PROVIDER');
  if(!Array.isArray(manifest?.files)||!manifest.files.length)fail('files','EMPTY_BUNDLE');
  // Reject all manifest errors before touching files, including mixed-version URL claims.
  if(Array.isArray(manifest?.files))for(const [i,f] of manifest.files.entries()){
    const path='files['+i+']';
    if(!record(f)||!alias(f.championId)||f.path!==f.championId+'.json'||paths.has(f.path)||ids.has(f.championId)||
      f.url!==`https://ddragon.leagueoflegends.com/cdn/${expectedVersion}/data/${manifest.locale}/champion/${f.championId}.json`||
      !/^[a-f0-9]{64}$/.test(f.sha256||'')||!Number.isSafeInteger(f.bytes)||f.bytes<=0||
      !timestamp(f.retrievedAt)||!record(f.rights)||typeof f.rights.reference!=='string'||!f.rights.reference.trim()||
      !['UNVERIFIED','REVIEWED'].includes(f.rights.redistribution))fail(path,'INVALID_FILE_MANIFEST');
    if(record(f)){paths.add(f.path);ids.add(f.championId)}
  }
  if(!errors.length)for(const f of manifest.files){
    let bytes;
    try{bytes=await readBytes(f.path)}catch{fail(f.path,'READ_FAILED');continue}
    if(!Buffer.isBuffer(bytes)&&!(bytes instanceof Uint8Array)){fail(f.path,'RAW_BYTES_REQUIRED');continue}
    const actualSha256=createHash('sha256').update(bytes).digest('hex');
    const bytesMatchManifest=bytes.byteLength===f.bytes&&actualSha256===f.sha256;
    if(!bytesMatchManifest){fail(f.path,'BYTE_INTEGRITY_MISMATCH');continue}
    let raw;
    try{raw=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes))}catch{fail(f.path,'INVALID_UTF8_JSON');continue}
    const champion=raw?.data?.[f.championId];
    if(!record(raw)||raw.type!=='champion'||raw.format!=='standAloneComplex'||raw.version!==expectedVersion||
      !record(raw.data)||Object.keys(raw.data).length!==1||!record(champion)||champion.id!==f.championId||
      typeof champion.key!=='string'||!/^\d+$/.test(champion.key)||!Number.isSafeInteger(Number(champion.key))||
      Number(champion.key)<=0||riotKeys.has(Number(champion.key))){fail(f.path,'RAW_VERSION_OR_IDENTITY_MISMATCH');continue}
    riotKeys.add(Number(champion.key));
    files.push({path:f.path,championId:f.championId,riotKey:Number(champion.key),url:f.url,
      retrievedAt:f.retrievedAt,sha256:actualSha256,bytes:bytes.byteLength,bytesMatchManifest:true,
      rights:{reference:f.rights.reference,redistribution:f.rights.redistribution}});
  }
  return {schema:1,status:errors.length?'REJECTED':'INTEGRITY_CHECKED',expectedVersion:expectedVersion??null,
    filesChecked:files.length,files,errors,
    // Hash consistency, author-supplied URL/time/rights and raw identity are not authenticity evidence.
    remoteOriginVerified:false,rightsVerified:false,numericSemanticsVerified:false,executableMechanicsVerified:false};
}

export async function inspectChampionSourceDirectory(manifest,root,expectedVersion){
  const canonicalRoot=await realpath(root);
  return verifyChampionSourceBundle(manifest,{expectedVersion,readBytes:async path=>{
    const candidate=await realpath(resolve(canonicalRoot,path));
    if(!candidate.startsWith(canonicalRoot+sep))throw Error('raw path outside bundle');
    return readFile(candidate);
  }});
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2),options={};let valid=args.length===6;
  for(let i=0;i<args.length;i+=2){
    const key=args[i];if(!['--manifest','--root','--version'].includes(key)||key in options||!args[i+1])valid=false;
    options[key]=args[i+1];
  }
  try{
    if(!valid||Object.keys(options).length!==3)throw Error('usage: --manifest FILE --root DIR --version X.Y.Z');
    const manifest=JSON.parse(await readFile(options['--manifest'],'utf8'));
    const result=await inspectChampionSourceDirectory(manifest,options['--root'],options['--version']);
    console.log(JSON.stringify(result,null,2));process.exitCode=result.errors.length?1:0;
  }catch(error){console.log(JSON.stringify({status:'REJECTED',error:String(error.message),remoteOriginVerified:false,
    rightsVerified:false,numericSemanticsVerified:false,executableMechanicsVerified:false}));process.exitCode=2}
}
