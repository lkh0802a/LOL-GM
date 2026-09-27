#!/usr/bin/env node
import fs from 'node:fs';
const file=process.argv[2];if(!file)throw new Error('snapshot path required');
const x=JSON.parse(fs.readFileSync(file,'utf8')),cs=Object.values(x.champions||{});
if(!/^\d+\.\d+\.\d+$/.test(x.version||''))throw new Error('snapshot version is not pinned');
if(x.source!=='Riot Data Dragon')throw new Error('unexpected champion source');
if(cs.length<160)throw new Error('champion snapshot too small: '+cs.length);
const keys=new Set();
for(const c of cs){if(!Number.isInteger(c.riotKey)||keys.has(c.riotKey))throw new Error('bad/duplicate Riot key: '+c.alias);keys.add(c.riotKey);for(const k of ['hp','hpg','ad','adg','arm','armg','mr','mrg','as','asg','range','ms'])if(!Number.isFinite(c.base?.[k]))throw new Error(c.alias+': missing '+k);if(!c.nameKo||!c.nameEn||!c.passive?.nameKo||!c.passive?.descriptionKo)throw new Error(c.alias+': localization/passive missing');if(c.spells?.length!==4||c.spells.some((s,i)=>s.slot!==['Q','W','E','R'][i]||!s.nameKo||!s.descriptionKo))throw new Error(c.alias+': QWER schema invalid')}
console.log('validated '+cs.length+' champions from Data Dragon '+x.version);
