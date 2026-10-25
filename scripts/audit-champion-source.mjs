#!/usr/bin/env node
// Read-only schema/coverage audit. Numeric presence never proves executable mechanics.
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const text=value=>typeof value==='string'&&value.trim().length>0;
const numeric=value=>record(value)&&Object.keys(value).length>0;
const slots=['Q','W','E','R'];
const required=['hp','hpg','ad','adg','arm','armg','mr','mrg','as','asg','range','ms'];

export function auditChampionSource(snapshot){
  const missing=[],zeroAdGrowth=[],suspiciousRange=[],noNumeric=[],missingNumeric=[];
  const championMap=record(snapshot?.champions)?snapshot.champions:{};
  const champions=Object.entries(championMap),keys=new Set();
  if(!record(snapshot?.champions)||!champions.length)missing.push('champions');
  if(snapshot?.schema!==2)missing.push('schema');
  if(!/^\d+\.\d+\.\d+$/.test(snapshot?.version||''))missing.push('version');
  if(snapshot?.provider!=='Riot Data Dragon')missing.push('provider');
  if(!/^[a-f0-9]{40}$/i.test(snapshot?.sourceCommit||''))missing.push('sourceCommit');
  let spells=0,withNumeric=0;
  for(const [key,champ] of champions){
    if(!record(champ)){missing.push(key+'.champion');continue;}
    if(!Number.isInteger(champ.riotKey)||champ.riotKey<=0||keys.has(champ.riotKey))
      missing.push(key+'.riotKey');
    keys.add(champ.riotKey);
    if(champ.alias!==key||!text(champ.nameKo)||!text(champ.nameEn))missing.push(key+'.identity');
    for(const stat of required)if(!Number.isFinite(champ.base?.[stat]))missing.push(key+'.base.'+stat);
    if(champ.base?.adg===0)zeroAdGrowth.push(key);
    if(!text(champ.passive?.nameKo)||!text(champ.passive?.descriptionKo))missing.push(key+'.P.identity');
    if(!Array.isArray(champ.spells)||champ.spells.length!==4)missing.push(key+'.spells[Q,W,E,R]');
    let championNumeric=0;
    for(const [idx,slot] of slots.entries()){
      const spell=Array.isArray(champ.spells)?champ.spells[idx]:null;
      if(!record(spell)){missing.push(key+'.'+slot+'.identity');missingNumeric.push(key+'.'+slot);continue;}
      spells++;
      if(spell.slot!==slot||!text(spell.nameKo)||!text(spell.descriptionKo))missing.push(key+'.'+slot+'.identity');
      for(const field of ['cooldown','cost','range']){
        const values=spell[field];
        if(!Array.isArray(values)||!values.length||values.some(n=>!Number.isFinite(n)||n<0))
          missing.push(key+'.'+slot+'.'+field);
      }
      if(numeric(spell.numeric)){withNumeric++;championNumeric++;}
      else missingNumeric.push(key+'.'+slot);
      if(Array.isArray(spell.range)&&spell.range.some(n=>Number.isFinite(n)&&n>10000))
        suspiciousRange.push(key+'.'+slot);
    }
    if(!championNumeric)noNumeric.push(key);
  }
  return {
    source:snapshot?.provider??null,version:snapshot?.version??null,
    sourceCommit:snapshot?.sourceCommit??null,
    // Pin metadata is checked, but no remote original/hash or effect implementation is verified here.
    sourceBytesVerified:false,executableMechanicsVerified:false,
    championCount:champions.length,spellCount:spells,
    growth:{zeroAdGrowthCount:zeroAdGrowth.length,zeroAdGrowthSample:zeroAdGrowth.slice(0,12),
      allZero:champions.length>0&&zeroAdGrowth.length===champions.length},
    mechanics:{spellsWithStructuredNumeric:withNumeric,spellsWithoutStructuredNumeric:missingNumeric.length,
      missingNumericSample:missingNumeric.slice(0,12),championsWithoutStructuredNumeric:noNumeric.length,
      apparentRangeSentinelCount:suspiciousRange.length,rangeSentinelSample:suspiciousRange.slice(0,12)},
    invalidFieldsCount:missing.length,invalidFieldsSample:missing.slice(0,30),
    warnings:[
      ...(zeroAdGrowth.length?['Zero AD growth requires patch-matched source review; no automatic correction']:[]),
      ...(missingNumeric.length?['Some spells lack structured numeric fields; text/cooldown are not executable mechanics']:[]),
      ...(suspiciousRange.length?['Some range arrays contain sentinels; do not interpret them as normal cast range']:[])
    ]
  };
}

export function championSourceAuditExitCode(result,strict=false){
  return result.invalidFieldsCount||!result.championCount||result.spellCount!==result.championCount*4||
    (strict&&result.warnings.length)?1:0;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const source=await readFile(new URL('../src/artifact/champion-source.js',import.meta.url),'utf8');
  const match=source.match(/^const CHAMPION_SOURCE_SNAPSHOT=(.+);\s*$/m);
  if(!match)throw new Error('Pinned champion snapshot constant not found');
  const result=auditChampionSource(JSON.parse(match[1]));
  console.log(JSON.stringify(result,null,2));
  process.exitCode=championSourceAuditExitCode(result,process.argv.includes('--strict'));
}
