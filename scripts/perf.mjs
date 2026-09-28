import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ENGINE_MODULES } from './artifact-modules.mjs';
import vm from 'node:vm';

const root = resolve(import.meta.dirname, '..');
const artifact = resolve(root, 'src', 'artifact');

let source = '';
for (const file of ENGINE_MODULES) source += `${await readFile(resolve(artifact, file), 'utf8')}\n`;

source += `
(()=>{
  const timed=(name,fn,iterations=1)=>{const t0=performance.now();let value;for(let i=0;i<iterations;i++)value=fn(i);const ms=performance.now()-t0;return {name,iterations,ms:Math.round(ms*100)/100,per:Math.round(ms/iterations*1000)/1000,value}};
  const db=buildWorld(),teams=activeTeams(db,null,1).slice(0,2);
  if(teams.length<2)throw new Error('Performance fixture needs two teams');
  const free=Object.values(db.players);
  for(const team of teams){team.roster=[];team.depthChart={};for(const role of ROLES){const p=free.find(x=>!x.team&&x.role===role);if(!p)throw new Error('Performance fixture lacks '+role);p.team=team.id;team.roster.push(p.id);team.depthChart[role]=p.id}}
  const [a,b]=teams.map(t=>t.id);
  const series=timed('bo3_series',i=>simulateSeries(db,a,b,3,'perf-series-'+i,{fearless:true,firstChoice:'coin',replay:true,practice:true}),5);
  const snap=draftPoolSnapshot(db,{});
  const draftCache=timed('draft_pool_cache_hit',()=>{const x=draftPoolSnapshot(db,{});if(x!==snap)throw new Error('Draft snapshot cache missed');return x.champs.length},5000);
  const champ=Object.values(db.patch.champions).find(c=>(db.patch.items?.[c.cls]||[]).length)||Object.values(db.patch.champions)[0],player=starterFor(db,teams[0],champ.roles[0])||db.players[teams[0].roster[0]],role=champ.roles[0];
  const systems=timed('item_rune_selection',()=>{const items=selectItemBuild(db.patch,champ,player,role),runes=selectRunePage(db.patch,champ,player,role);if(!items.length||runes.length!==6)throw new Error('System selection perf fixture failed');return items.length+runes.length},2000);
  const meta=buildWorld(),rid=Object.keys(meta.regions)[0],rows=[];for(let i=0;i<10000;i++)rows.push({date:'2027-'+String(1+(i%12)).padStart(2,'0')+'-'+String(1+(i%28)).padStart(2,'0'),patch:i%3===0?'26.20':'26.19',comp:'PERF_'+(i%4),season:'S'+(i%2),year:2027,split:1,stage:'regular',league:rid,international:false,regions:[rid],sides:[],bans:[]});meta.metaHistory=rows;
  const cold=timed('meta_query_cold',()=>metaRowsFiltered(meta,{patch:'26.19',region:rid,comp:'PERF_1'}).length,1),cachedRows=metaRowsFiltered(meta,{patch:'26.19',region:rid,comp:'PERF_1'});
  const hot=timed('meta_query_cache_hit',()=>{const x=metaRowsFiltered(meta,{patch:'26.19',region:rid,comp:'PERF_1'});if(x!==cachedRows)throw new Error('Meta query cache missed');return x.length},5000);
  const appendIndex=metaHistoryIndex(meta),append=timed('meta_incremental_append',i=>{
    const row={...rows[i%rows.length],comp:'INCREMENTAL_PERF'};
    rows.push(row);
    if(metaHistoryIndex(meta)!==appendIndex)throw new Error('Incremental meta update rebuilt the index');
    return metaRowsFiltered(meta,{comp:'INCREMENTAL_PERF'}).length;
  },250);
  if(append.value!==250)throw new Error('Meta append query lost historical games');
  const facetCache=metaHistoryFacets(meta);
  const facets=timed('meta_facet_hit',()=>{if(metaHistoryFacets(meta)!==facetCache)throw new Error('Facets were rebuilt on hot query');return facetCache.comps.length},2000);
  const patchDb=buildWorld(),champions=Object.values(patchDb.patch.champions),
    finalItems=Object.values(patchDb.patch.itemDefs).filter(d=>['final','boots'].includes(d.tier)&&d.active!==false).slice(0,32).map(d=>d.id),
    runeIds=Object.values(patchDb.patch.runeDefs).filter(d=>d.active!==false).slice(0,20).map(d=>d.id);
  patchDb.patch.id='PERF.PATCH';
  const patchRows=[];
  for(let i=0;i<2500;i++){
    const one=champions[i%champions.length],two=champions[(i*3+7)%champions.length];
    patchRows.push({date:'2027-01-'+String(1+i%28).padStart(2,'0'),patch:'PERF.PATCH',
      comp:'PERF_USAGE',regions:[],bans:[],sides:[
        {win:i%2===0,picks:[{champ:one.id,role:'MID',items:finalItems.slice(i%10,i%10+5),runes:runeIds.slice(i%8,i%8+5)}]},
        {win:i%2!==0,picks:[{champ:two.id,role:'TOP',items:finalItems.slice(i%9,i%9+5),runes:runeIds.slice(i%7,i%7+5)}]}
      ]});
  }
  patchDb.metaHistory=patchRows;
  const officialRows=patchEvidenceRows(patchDb),evidenceIds=[
    ...finalItems.map(id=>['item',id]),...runeIds.map(id=>['rune',id])
  ];
  const legacy=timed('system_usage_reference_scan',()=>{
    const uncached=officialRows.slice();
    return evidenceIds.map(([kind,id])=>systemUsageEvidence(patchDb,kind,id,uncached));
  });
  const indexed=timed('system_usage_indexed',()=>
    evidenceIds.map(([kind,id])=>systemUsageEvidence(patchDb,kind,id,officialRows)));
  if(JSON.stringify(legacy.value)!==JSON.stringify(indexed.value))
    throw new Error('Optimized system usage index changed numerical evidence');
  const evidenceHot=timed('system_usage_cache_hit',()=>
    evidenceIds.map(([kind,id])=>systemUsageEvidence(patchDb,kind,id,officialRows)).length,15);
  const metrics={node:typeof process!=='undefined'?process.version:'vm',champions:Object.keys(db.patch.champions).length,
    series:{ms:series.ms,perSeriesMs:series.per},draftPool:{champions:draftCache.value,totalMs:draftCache.ms,perHitMs:draftCache.per},
    systems:{totalMs:systems.ms,perSelectionMs:systems.per},
    meta:{rows:rows.length,coldMs:cold.ms,resultRows:cold.value,cacheHitsMs:hot.ms,perHitMs:hot.per,
      incrementalAppends:append.iterations,appendAndQueryMs:append.ms,facetCacheHits:facets.iterations,
      facetCacheHitsMs:facets.ms,filterCacheEntries:metaHistoryIndex(meta).filtered.size},
    patchEvidence:{rows:officialRows.length,definitions:evidenceIds.length,referenceScanMs:legacy.ms,
      indexedMs:indexed.ms,indexedHotTotalMs:evidenceHot.ms,indexedHotIterations:evidenceHot.iterations}};
  console.log('PERF_METRICS '+JSON.stringify(metrics));
})()`;

const context = {
  console, Date, Math, JSON, Set, Map, WeakMap, Object, Array, String, Number,
  Boolean, RegExp, Error, Intl, performance, crypto,
};

vm.runInNewContext(source, context, { timeout: 25000 });
