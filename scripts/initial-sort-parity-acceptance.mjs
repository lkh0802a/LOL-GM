import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {artifactSources,compiledEngine} from './test-harness.mjs';
const ctx=vm.createContext({console,Date,Math,JSON,Set,Map,WeakMap,Object,Array,String,Number,Boolean,RegExp,Error,Intl,performance,crypto});
(await compiledEngine()).runInContext(ctx,{timeout:30000});
for(const s of await artifactSources(['ui-initial-comparison.js','ui-initial-filters.js','ui-initial-table.js','ui-initial-candidates.js']))new vm.Script(s).runInContext(ctx);
const baseline=await readFile(new URL('./initial-sort-baseline-source.js',import.meta.url),'utf8');
const current=(await artifactSources(['ui-initial-candidates.js']))[0];
function audit(s,name){return s.slice(s.indexOf('function initialCandidatePage('),s.indexOf('function initialObservedRange')).replace('function initialCandidatePage(',`function ${name}(`).replace('return {allowed:true,rows:','return {allowed:true,allRows:valued,rows:')}
new vm.Script(audit(baseline,'baselinePage')+audit(current,'cachedPage')).runInContext(ctx);
new vm.Script(String.raw`(()=>{
let checks=0;const same=(a,b)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw Error('정렬 결과 불일치');checks++};
for(const size of ['small','default']){const cfg=defaultWorldConfig();if(size==='small'){cfg.regions=[regionCfg('KR',{teams:3,div2:true}),regionCfg('NA',{teams:3,div2:true})];cfg.internationals=[]}const db=buildWorld(cfg),t=activeTeams(db,'KR',1)[0];startCareer(db,t.id,'initial-sort-parity');
const cases=size==='small'?Object.keys(INITIAL_CANDIDATE_SORTS).flatMap(sort=>['asc','desc'].map(direction=>({sort,direction}))):['ability','salary','potential'].flatMap(sort=>['asc','desc'].map(direction=>({sort,direction})));
cases.push({sort:'salary',direction:'desc',multiSort:true,secondary:[{key:'ability',direction:'asc'},{key:'name',direction:'desc'}]},{sort:'potential',direction:'asc',roles:['JGL','SUP'],metricFilters:{vision:{min:40,max:99}}});
for(const c of cases){const state={...initialCandidateUiState(),target:t.id,scope:'all',...c},before=JSON.stringify(db),a=baselinePage(db,state,t),b=cachedPage(db,state,t);same(a.allRows.map(x=>[x.p.id,x.value]),b.allRows.map(x=>[x.p.id,x.value]));same([a.total,a.pages,a.page],[b.total,b.pages,b.page]);same(JSON.stringify(db),before);for(const page of [0,Math.floor(a.pages/2),Math.max(0,a.pages-1)])same(initialCandidatePage(db,{...state,page},t).rows.map(x=>[x.p.id,x.value]),a.allRows.slice(page*25,(page+1)*25).map(x=>[x.p.id,x.value]));}
const f=initialCandidateSortValue;initialCandidateSortValue=(v,x,k,target)=>x.p.id.endsWith('1')?NaN:f(v,x,k,target);for(const direction of ['asc','desc']){const state={...initialCandidateUiState(),target:t.id,scope:'all',sort:'salary',direction};same(baselinePage(db,state,t).allRows.map(x=>[x.p.id,x.value]),cachedPage(db,state,t).allRows.map(x=>[x.p.id,x.value]))}initialCandidateSortValue=f;
const state={...initialCandidateUiState(),target:t.id,scope:'all',sort:'salary'};cachedPage(db,state,t);db.teams[t.id].cash+=1;const p=Object.values(db.players).find(p=>!p.team&&!p.retired);scoutPlayers(db,[p.id],20,.1);same(baselinePage(db,state,t).allRows.map(x=>[x.p.id,x.value]),cachedPage(db,state,t).allRows.map(x=>[x.p.id,x.value]));}
console.log('INITIAL_SORT_PARITY '+JSON.stringify({checks,fullOrdering:true,missingBothDirections:true,freshReadAfterWriter:true}));})()`).runInContext(ctx,{timeout:120000});
