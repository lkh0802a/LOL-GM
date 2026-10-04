import {readFile} from 'node:fs/promises';
import {runEngineFixture,artifactSources} from './test-harness.mjs';
const ui=await artifactSources(['ui-patch.js','ui-opponent-report.js','ui-opponent-draft.js','ui-analysis.js','ui-match-history.js','ui-takedown-history.js','ui-analysis-tiers.js','ui-analysis-comparison.js']);
const baseline=await readFile(new URL('./fixtures/draft-meta-baseline.js',import.meta.url),'utf8');
await runEngineFixture(String.raw`(()=>{
  const check=(ok,msg)=>{if(!ok)throw Error('ANALYSIS_TIERS '+msg)};
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,div2:true,system:'franchise'})];cfg.internationals=[];
  const db=buildWorld(cfg),[a,b]=activeTeams(db,'NA',1),reserve=reserveTeamsOf(db,a)[0];
  setManagedTeam(db,a.id);db.world={year:db.year,seed:'tiers',manage:'manual',phase:'season',seasons:{},steps:[],step:-1};
  for(const t of [a,b,reserve])for(const role of ROLES){
    const p=genPlayer(db,new RNG('tier|'+t.id+'|'+role),{region:t.region,role,age:22,base:65});signContract(db,p,t,1,3);t.depthChart[role]=p.id;
  }
  simulateSeries(db,a.id,b.id,1,'tier-official',{metaContext:{year:db.year,season:'TIER_TEST'}});
  const ctx={used:[],byTeam:{}},optimized=createDraftSession;
  for(const seed of ['tier-parity-a','tier-parity-b','tier-parity-c']){
    const expected=baselineCreateDraftSession(db,[a.id,b.id],new RNG(seed),ctx),actual=optimized(db,[a.id,b.id],new RNG(seed),ctx);
    check(JSON.stringify(expected.vhat)===JSON.stringify(actual.vhat),'draft meta numeric parity');
    const current=runDraft(db,[a.id,b.id],new RNG(seed),ctx);
    try{createDraftSession=baselineCreateDraftSession;const old=runDraft(db,[a.id,b.id],new RNG(seed),ctx);
      check(JSON.stringify(current)===JSON.stringify(old),'complete seeded picks/bans/assignments/explanations parity');
    }finally{createDraftSession=optimized}
  }
  const before=packDB(db),publicBefore=JSON.stringify(publicChampionTiers(db,{patch:db.patch.id})),report=internalChampionTiers(db,{team:a.id,role:'MID'});
  check(report.allowed&&report.rows.length>10&&!report.reason,'actual internal candidates');
  const session=createDraftSession(db,[a.id,b.id],new RNG('tier-score'),ctx);
  for(const row of report.rows){const exact=draftPickValue(session,0,'MID',row.champ,[]);
    check(row.best.score===exact.total&&JSON.stringify(row.best.factors)===JSON.stringify(exact),'display-to-actual-draft factor parity');
  }
  check(packDB(db)===before,'tier read changed world/lineup/history');
  const mid=db.players[a.depthChart.MID],candidate=report.rows.at(-1).champ,originalPool=JSON.parse(JSON.stringify(mid.pool));
  for(const value of Object.values(mid.pool))value.mastery=20;mid.pool[candidate]={mastery:99};
  const changed=internalChampionTiers(db,{team:a.id,role:'MID'});
  check(changed.rows.find(r=>r.champ===candidate).best.mastery===99,'own practice mastery writer not consumed');
  check(JSON.stringify(publicChampionTiers(db,{patch:db.patch.id}))===publicBefore,'private mastery changed public tier');
  check(changed.rows.find(r=>r.champ===candidate).best.score!==report.rows.find(r=>r.champ===candidate).best.score,'real internal factor did not change');
  mid.pool=originalPool;
  const traps=[],trap=(object,key)=>{const descriptor=Object.getOwnPropertyDescriptor(object,key);traps.push(()=>{if(descriptor)Object.defineProperty(object,key,descriptor);else delete object[key]});Object.defineProperty(object,key,{configurable:true,get(){throw Error('enemy private read '+key)}})};
  for(const key of ['tactics','staff','practiceEvidence','metaKnowledge','metaCounter'])trap(b,key);
  for(const pid of b.roster)for(const key of ['pool','attrs','pot','medical'])trap(db.players[pid],key);
  check(!internalChampionTiers(db,{team:b.id}).allowed,'foreign internal access accepted');
  check(internalChampionTiers(db,{team:a.id}).rows.length>0,'own report required opponent private state');
  publicChampionTiers(db,{patch:db.patch.id});
  const ownDepth={...a.depthChart};a.depthChart.MID=b.roster[0];
  const forged=internalChampionTiers(db,{team:a.id,role:'MID'});
  check(forged.reason==='no-valid-lineup'&&a.depthChart.MID===b.roster[0],'forged lineup read enemy or repaired lineup');
  a.depthChart=ownDepth;for(const restore of traps.reverse())restore();
  const historyBefore=JSON.stringify(db.metaHistory),future=JSON.parse(JSON.stringify(db.metaHistory[0]));future.date='2099-01-01';db.metaHistory.push(future);
  const futureReport=publicChampionTiers(db,{patch:db.patch.id});
  check(futureReport.sample===1&&futureReport.excluded===1,'future public evidence entered sample');
  check(internalChampionTiers(db,{team:a.id}).reason==='unverified-current-evidence','invalid internal evidence presented as matched draft');
  db.metaHistory.pop();check(JSON.stringify(db.metaHistory)===historyBefore,'invalid-evidence guard changed raw history');
  const fresh=unpackDB(packDB(db)),privacyRestores=[];
  const privateTrap=(object,key)=>{const descriptor=Object.getOwnPropertyDescriptor(object,key);privacyRestores.push(()=>{if(descriptor)Object.defineProperty(object,key,descriptor);else delete object[key]});Object.defineProperty(object,key,{configurable:true,get(){throw Error('public private read '+key)}})};
  for(const team of Object.values(fresh.teams))for(const key of ['tactics','staff','practiceEvidence','metaKnowledge','metaCounter'])privateTrap(team,key);
  for(const player of Object.values(fresh.players))for(const key of ['pool','attrs','pot','medical'])privateTrap(player,key);
  check(JSON.stringify(publicChampionTiers(fresh,{patch:fresh.patch.id}))===publicBefore,'public report required any team private data');
  for(const restore of privacyRestores.reverse())restore();
  const oldChart={...a.depthChart};delete a.depthChart.MID;
  const missingBefore=packDB(db);check(internalChampionTiers(db,{team:a.id,role:'MID'}).reason==='no-valid-lineup','missing role fabricated candidates');
  check(packDB(db)===missingBefore,'missing lineup was auto-initialized by reading');a.depthChart=oldChart;
  check(internalChampionTiers(db,{team:a.id,patch:'past-patch'}).reason==='historical-state-unavailable','past private state reconstructed from present');
  DB=db;ANALYSIS_SET.mode='tiers';ANALYSIS_SET.tierView='public';
  check(viewAnalysis().includes('대중 티어')&&viewAnalysis().includes('공식 경기 1전'),'real public panel not shown');
  bindAnalysis();tierButtons[1].onclick();
  check(ANALYSIS_SET.tierView==='internal'&&viewAnalysis().includes('내부 준비도'),'actual internal switch');
  nodes['#analysis-tier-search'].onchange({target:{value:'no-match-query'}});
  check(viewAnalysis().includes('검색 조건에 맞는 챔피언이 없습니다'),'search empty state');ANALYSIS_SET.tierQ='';
  playerButtons[0].dataset.analysisPlayer=a.depthChart.MID;bindAnalysis();playerButtons[0].onclick();
  check(SQUAD===a.id&&OPEN_P===a.depthChart.MID&&navigation.at(-1)==='squad','real player details link');
  championButtons[0].dataset.analysisChampion=report.rows[0].champ;bindAnalysis();championButtons[0].onclick();
  check(PSET.champ===report.rows[0].champ&&navigation.at(-1)==='patch','real champion mechanics link');
  const saved=packDB(db),loaded=unpackDB(saved);
  check(JSON.stringify(internalChampionTiers(loaded,{team:a.id,role:'MID'}))===JSON.stringify(report),'saved owned evidence changed tier');
  setManagedTeam(db,reserve.id);check(!internalChampionTiers(db,{team:a.id}).allowed&&internalChampionTiers(db,{team:reserve.id}).allowed,'reserve coach parent boundary');
  db.world.fired=true;check(!internalChampionTiers(db,{team:reserve.id}).allowed,'fired private tier');publicChampionTiers(db,{patch:db.patch.id});
  console.log('ANALYSIS_TIERS_ACCEPTANCE PASS seeded full draft parity, shared actual factors, own mastery/public independence, private getter traps, forged/missing lineup purity, past-state guard, real UI bindings/links/search, reserve/fired/save');
})()`,{timeout:30000,setupSources:[baseline,String.raw`
let DB=null,SQUAD=null,OPEN_P=null,PSET={champ:null},ANALYSIS_SET={mode:'tiers',team:'AUTO',period:'ALL',patch:'CURRENT',position:'ALL',prepTeam:'AUTO',tierView:'public',tierQ:''};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const nodes={},navigation=[],tierButtons=['public','internal'].map(analysisTier=>({dataset:{analysisTier}})),playerButtons=[{dataset:{}}],championButtons=[{dataset:{}}];
const document={querySelectorAll:s=>s==='[data-analysis-tier]'?tierButtons:s==='[data-analysis-player]'?playerButtons:s==='[data-analysis-champion]'?championButtons:[],activeElement:null};
const $=s=>nodes[s]||(nodes[s]={});function navKeepScroll(){}function navigateTo(v){navigation.push(v)}
`,...ui]});
