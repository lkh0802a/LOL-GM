import fs from 'node:fs/promises';
import vm from 'node:vm';
const source=await fs.readFile('src/artifact/champion-source.js','utf8');
const snapshot=vm.runInNewContext(source+';CHAMPION_SOURCE_SNAPSHOT');
const version=snapshot.version.split('.').slice(0,2).join('.');
const rows=[],failures=[],aliases=Object.keys(snapshot.champions);let next=0;
await fs.mkdir('.diagnostics/champion-ranges',{recursive:true});
await Promise.all(Array.from({length:6},async()=>{
  while(next<aliases.length){
    const alias=aliases[next++],url=`https://raw.communitydragon.org/${version}/game/data/characters/${alias.toLowerCase()}/${alias.toLowerCase()}.bin.json`;
    try{
      const response=await fetch(url);if(!response.ok)throw new Error(String(response.status));
      const data=await response.json();
      const record=Object.values(data).find(x=>x.__type==='CharacterRecord');
      for(const [i,raw] of snapshot.champions[alias].spells.entries()){
        const path=record?.spells?.[i],spell=data[path]?.mSpell;
        const targeters=spell?.mClientData?.mTargeterDefinitions||[];
        const indicators=targeters.flatMap(t=>[...(t.overrideBaseRange?.mPerLevelValues||[]),...(t.coneRange?[t.coneRange]:[])]).filter(v=>Number.isFinite(v)&&v>0&&v<20000);
        const named=(spell?.DataValues||[]).filter(x=>/range|radius|length|distance/i.test(x.name)).map(x=>({name:x.name,values:[...new Set((x.values||[]).map(v=>Math.round(v*100)/100))]}));
        rows.push({alias,slot:raw.slot,sourceRange:[...new Set(raw.range)],spellPath:path||null,castRange:[...new Set(spell?.castRange||[])],targeting:spell?.mTargetingTypeData?.__type||null,indicators:[...new Set(indicators.map(v=>Math.round(v*100)/100))],named,status:!spell?'unresolved':raw.range.some(v=>v>=20000)?'sentinel':raw.range.every(v=>v===0)?'zero':'numeric',url});
      }
      await fs.writeFile(`.diagnostics/champion-ranges/${alias}.json`,JSON.stringify(data));
    }catch(e){failures.push({alias,error:e.message,url});}
  }
}));
rows.sort((a,b)=>a.alias.localeCompare(b.alias)||'QWER'.indexOf(a.slot)-'QWER'.indexOf(b.slot));
const report={patch:snapshot.version,champions:aliases.length,reviewed:rows.length,failures,rows};
await fs.writeFile('.diagnostics/champion-range-audit.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({patch:report.patch,champions:report.champions,spells:rows.length,failures,statuses:Object.fromEntries(['numeric','sentinel','zero','unresolved'].map(k=>[k,rows.filter(x=>x.status===k).length]))}));
