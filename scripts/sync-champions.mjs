#!/usr/bin/env node
/**
 * LOL GM champion-data importer.
 * Fetches patch-pinned Riot Data Dragon champion data and emits a normalized
 * snapshot that can be reviewed before replacing simulation fallbacks.
 * Usage: node scripts/sync-champions.mjs <ddragon-version>
 */
import fs from 'node:fs/promises';
const version=process.argv[2];
if(!version)throw new Error('Pass a pinned Data Dragon version, e.g. 16.17.1');
const base=`https://ddragon.leagueoflegends.com/cdn/${version}/data`;
const get=async url=>{const r=await fetch(url);if(!r.ok)throw new Error(`${r.status} ${url}`);return r.json()};
const summary=await get(`${base}/en_US/champion.json`);
const out={schema:1,version,locale:'ko_KR',source:'Riot Data Dragon',generatedAt:new Date().toISOString(),champions:{}};
for(const alias of Object.keys(summary.data).sort()){
  const [en,ko]=await Promise.all([get(`${base}/en_US/champion/${alias}.json`),get(`${base}/ko_KR/champion/${alias}.json`)]);
  const x=en.data[alias],k=ko.data[alias]||x,s=x.stats;
  out.champions[alias]={
    riotKey:Number(x.key),alias,nameKo:k.name,nameEn:x.name,
    base:{hp:s.hp,hpg:s.hpperlevel,resource:s.mp,resourceg:s.mpperlevel,resourceRegen:s.mpregen,ad:s.attackdamage,adg:s.attackdamageperlevel,arm:s.armor,armg:s.armorperlevel,mr:s.spellblock,mrg:s.spellblockperlevel,as:s.attackspeed,asg:s.attackspeedperlevel,range:s.attackrange,ms:s.movespeed},
    passive:{nameKo:k.passive?.name||'',descriptionKo:k.passive?.description||'',nameEn:x.passive?.name||'',descriptionEn:x.passive?.description||''},
    spells:x.spells.map((sp,i)=>({slot:['Q','W','E','R'][i],nameKo:k.spells?.[i]?.name||sp.name,descriptionKo:k.spells?.[i]?.description||'',nameEn:sp.name,descriptionEn:sp.description||'',cooldown:sp.cooldown||[],cost:sp.cost||[],range:sp.range||[],effectBurn:sp.effectBurn||[],vars:sp.vars||[]}))
  };
}
await fs.mkdir('src/data',{recursive:true});
await fs.writeFile(`src/data/champions-ddragon-${version}.json`,JSON.stringify(out,null,2)+'\n');
console.log(`wrote ${Object.keys(out.champions).length} champions for ${version}`);
