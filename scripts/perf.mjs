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
  const metrics={node:typeof process!=='undefined'?process.version:'vm',champions:Object.keys(db.patch.champions).length,series:{ms:series.ms,perSeriesMs:series.per},draftPool:{champions:draftCache.value,totalMs:draftCache.ms,perHitMs:draftCache.per},systems:{totalMs:systems.ms,perSelectionMs:systems.per},meta:{rows:rows.length,coldMs:cold.ms,resultRows:cold.value,cacheHitsMs:hot.ms,perHitMs:hot.per}};
  console.log('PERF_METRICS '+JSON.stringify(metrics));
})()`;

const context = {
  console, Date, Math, JSON, Set, Map, WeakMap, Object, Array, String, Number,
  Boolean, RegExp, Error, Intl, performance, crypto,
};

vm.runInNewContext(source, context, { timeout: 25000 });
