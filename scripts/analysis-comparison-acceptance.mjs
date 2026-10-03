import {runEngineFixture,artifactSources} from './test-harness.mjs';
const ui=await artifactSources(['ui-patch.js','ui-opponent-report.js','ui-opponent-draft.js','ui-analysis.js','ui-analysis-tiers.js','ui-analysis-comparison.js']);
await runEngineFixture(String.raw`(()=>{
  const check=(ok,msg)=>{if(!ok)throw Error('ANALYSIS_COMPARISON '+msg)};
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,div2:true,system:'franchise'})];cfg.internationals=[];
  const db=buildWorld(cfg),[a,b]=activeTeams(db,'NA',1),reserve=reserveTeamsOf(db,a)[0];
  setManagedTeam(db,a.id);db.world={year:db.year,seed:'comparison',manage:'manual',phase:'season',seasons:{},steps:[],step:-1};
  for(const t of [a,b,reserve])for(const role of ROLES){const p=genPlayer(db,new RNG('comparison|'+t.id+'|'+role),{region:t.region,role,age:22,base:65});signContract(db,p,t,1,3);t.depthChart[role]=p.id}
  const comp='analysis-cup';db.competitions[comp]={id:comp,name:'분석 컵'};db.competitions['second-event']={id:'second-event',name:'두 번째 대회'};
  simulateSeries(db,a.id,b.id,1,'comparison-official-a',{compId:comp,metaContext:{year:db.year,season:'COMPARE_A'}});
  simulateSeries(db,a.id,b.id,1,'comparison-official-b',{compId:'second-event',metaContext:{year:db.year,season:'COMPARE_B'}});
  const filter={patch:db.patch.id,comp},before=packDB(db),report=championTierComparison(db,{team:a.id,filter,role:'MID'}),own=internalChampionTiers(db,{team:a.id,role:'MID'});
  check(report.public.sample===1&&publicChampionTiers(db,{patch:db.patch.id}).sample===2,'public competition denominator');
  check(JSON.stringify(report.internal)===JSON.stringify(own),'public scope rewrote private current evaluation');
  for(const row of report.rows){check(row.public.champ===row.champ,'public candidate join');if(row.internal)check(row.internal.champ===row.champ&&row.internal.best.role==='MID','private candidate/role join')}
  const groups=publicTierSourceGroups(db,filter);
  check(groups.length===1&&groups[0].comp===comp&&groups[0].patch===db.patch.id&&groups[0].games===1&&groups[0].from===db.worldDate,'real source grouping');
  check(packDB(db)===before,'comparison/source reads mutated saved world');
  const future=JSON.parse(JSON.stringify(db.metaHistory[0]));future.date='2099-01-01';db.metaHistory.push(future);
  check(publicTierSourceGroups(db,filter)[0].games===1&&!publicTierSourceGroups(db,filter)[0].navigationSafe,'raw destination would reintroduce future sample');
  db.metaHistory.pop();check(packDB(db)===before,'source guard deleted/rewrote raw evidence');
  const missing=championTierComparison(db,{team:a.id,filter:{patch:db.patch.id,comp:'absent'}});
  check(!missing.public.observed&&missing.public.sample===0&&publicTierSourceGroups(db,{comp:'absent'}).length===0,'empty public context fabricated source');
  check(championTierComparison(db,{team:a.id,filter:{patch:'past'}}).internal.reason==='historical-state-unavailable','past private reconstruction');
  // Exercise the established accrual writer -> seasonal mastery writer ->
  // actual draft consumer, without inventing a new immediate practice bonus.
  const training=unpackDB(before),mid=training.players[a.depthChart.MID],eligible=Object.keys(mid.pool).find(c=>training.patch.champions[c]?.roles.includes('MID')&&mid.pool[c].mastery<90);
  check(!!eligible,'fixture lacks trainable observed candidate');
  const old=internalChampionTiers(training,{team:a.id,role:'MID'}).rows.find(r=>r.champ===eligible),publicOld=JSON.stringify(publicChampionTiers(training,filter));
  practiceChampion(training,mid,eligible,'training',20,false);
  growPlayer(training,mid,new RNG('comparison-season-growth'),0,{});
  const learned=internalChampionTiers(training,{team:a.id,role:'MID'}).rows.find(r=>r.champ===eligible);
  check(learned.best.mastery>old.best.mastery&&learned.best.score!==old.best.score,'real practice/growth writers not reflected in comparison');
  check(JSON.stringify(publicChampionTiers(training,filter))===publicOld,'private growth leaked to public output');
  const restores=[],trap=(o,k)=>{const d=Object.getOwnPropertyDescriptor(o,k);restores.push(()=>d?Object.defineProperty(o,k,d):delete o[k]);Object.defineProperty(o,k,{configurable:true,get(){throw Error('foreign private '+k)}})};
  for(const k of ['tactics','staff','practiceEvidence','metaKnowledge','metaCounter'])trap(b,k);
  for(const pid of b.roster)for(const k of ['pool','attrs','pot','medical'])trap(db.players[pid],k);
  check(championTierComparison(db,{team:a.id,filter}).rows.length>0,'own comparison depended on opponent private state');
  check(!championTierComparison(db,{team:b.id,filter}).internal.allowed,'forged observer obtained private comparison');
  for(const restore of restores.reverse())restore();
  DB=db;ANALYSIS_SET.mode='tiers';ANALYSIS_SET.tierView='compare';ANALYSIS_SET.position='MID';ANALYSIS_SET.comp=comp;
  const futureOnly={...future,comp:'future-only'};db.metaHistory.push(futureOnly);check(!viewAnalysis().includes('<option value="future-only"'),'future-only competition leaked through selector');db.metaHistory.pop();
  const html=viewAnalysis();check(html.includes('대중·팀 내부 티어 비교')&&html.includes('공식 1전')&&html.includes('실제 공개 표본 출처')&&html.includes('밴픽 효용'),'actual compared screen');
  bindAnalysis();document.activeElement={id:'analysis-comp'};nodes['#analysis-comp'].focus=()=>focus++;
  nodes['#analysis-comp'].onchange({target:{value:'absent'}});
  check(analysisFilter(db,a).comp==='absent'&&focus===1&&viewAnalysis().includes('공개 원자료가 없습니다'),'real competition filter/focus/empty state');
  document.activeElement=null;ANALYSIS_SET.comp=comp;sourceButton.dataset={analysisSourceComp:comp,analysisSourcePatch:db.patch.id};bindAnalysis();
  const navigationBefore=navigation.length;sourceButton.dataset.analysisSourceComp='second-event';sourceButton.onclick();check(navigation.length===navigationBefore,'forged source scope navigated');
  sourceButton.dataset.analysisSourceComp=comp;db.metaHistory.push(future);sourceButton.onclick();check(navigation.length===navigationBefore,'invalid-date raw source admitted');db.metaHistory.pop();sourceButton.onclick();
  check(navigation.at(-1)==='patch'&&PSET.comp===comp&&PSET.patch===db.patch.id&&PSET.team==='ALL'&&PSET.player==='ALL'&&PSET.position==='ALL'&&PSET.role==='MID','actual source navigation changed public denominator/leaked old filters');
  check(metaRowsFiltered(db,{comp:PSET.comp,patch:PSET.patch}).length===1,'destination source filter mismatch');
  const loaded=unpackDB(before);check(JSON.stringify(championTierComparison(loaded,{team:a.id,filter,role:'MID'}))===JSON.stringify(report),'comparison save continuity');
  setManagedTeam(db,reserve.id);check(!championTierComparison(db,{team:a.id,filter}).internal.allowed,'reserve parent private boundary');
  db.world.fired=true;check(!championTierComparison(db,{team:reserve.id,filter}).internal.allowed,'fired comparison');
  console.log('ANALYSIS_COMPARISON_ACCEPTANCE PASS two actual competition scopes, candidate/role join, unchanged current draft scores, real practice-growth consumer, pure/private/save boundaries, rendered comparison, filter focus, verified source navigation');
})()`,{timeout:30000,setupSources:[String.raw`
let DB=null,PSET={team:'stale',player:'stale',position:'TOP'},SQUAD=null,OPEN_P=null,ANALYSIS_SET={mode:'tiers',team:'AUTO',period:'ALL',patch:'CURRENT',position:'ALL',prepTeam:'AUTO',tierView:'compare',tierQ:'',comp:'ALL'};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const nodes={},navigation=[],sourceButton={dataset:{}},document={activeElement:null,querySelectorAll:s=>s==='[data-analysis-source-comp]'?[sourceButton]:[]};let focus=0;
const $=s=>nodes[s]||(nodes[s]={});function navKeepScroll(){}function navigateTo(v){navigation.push(v)}
`,...ui]});
