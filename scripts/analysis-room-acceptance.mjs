import {runEngineFixture,artifactSources} from './test-harness.mjs';
const ui=await artifactSources(['ui-patch.js','ui-opponent-report.js','ui-opponent-draft.js','ui-analysis.js']);
await runEngineFixture(String.raw`(()=>{
  const check=(ok,msg)=>{if(!ok)throw Error('ANALYSIS_ROOM '+msg)};
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:6,div2:true,system:'franchise'})];cfg.internationals=[];
  const db=buildWorld(cfg),[a,b]=activeTeams(db,'NA',1),reserve=reserveTeamsOf(db,a)[0];
  setManagedTeam(db,a.id);db.world={year:db.year,seed:'analysis-room',manage:'manual',phase:'season',seasons:{},steps:[],step:-1};
  for(const t of [a,b,reserve])for(const role of ROLES){
    const p=genPlayer(db,new RNG('analysis-room|'+t.id+'|'+role),{region:t.region,role,age:22,base:65});
    signContract(db,p,t,1,3);t.depthChart[role]=p.id;
  }
  simulateSeries(db,a.id,b.id,1,'analysis-official',{metaContext:{year:db.year,season:'ANALYSIS_ROOM',international:false}});
  const practice=simulateSeries(db,a.id,b.id,1,'analysis-practice',{fearless:true,replay:true,practice:true});
  recordScrimPractice(db,practice.rec,practice.lines);DB=db;
  const before=packDB(db),history=JSON.stringify(db.metaHistory);
  const html=viewAnalysis();
  check(html.includes('<h2>분석실</h2>'),'Korean room title');
  check(html.includes('id="practicecomparison"')&&html.includes('id="owntacticmeta"')&&html.includes('id="analystreport"'),'actual own reports not connected');
  const summary=ownPracticeComparison(db,analysisFilter(db,a));
  check(summary.engine.games===1&&summary.official.games===1&&summary.aggregate.games===0,'actual engine practice/public denominators');
  check(packDB(db)===before&&JSON.stringify(db.metaHistory)===history,'room rendering changed saved/source evidence');
  bindAnalysis();
  document.activeElement={id:'analysis-period'};
  nodes['#analysis-period'].focus=()=>focusRestores++;
  nodes['#analysis-period'].onchange({target:{value:'ALL'}});
  check(focusRestores===1,'filter rerender lost keyboard focus');
  document.activeElement=null;
  nodes['#analysis-position'].onchange({target:{value:'MID'}});
  check(ANALYSIS_SET.period==='ALL'&&analysisFilter(db,a).position==='MID'&&rerenders===2,'real filter bindings');
  nodes['#analysis-patch'].onchange({target:{value:'no-such-patch'}});
  check(ownPracticeComparison(db,analysisFilter(db,a)).engine.games===0&&viewAnalysis().includes('기록 없음'),'missing patch invented evidence');
  nodes['#analysis-patch'].onchange({target:{value:'CURRENT'}});
  modeButtons[1].onclick();
  check(ANALYSIS_SET.mode==='opponent','mode button not bound');
  ANALYSIS_SET.prepTeam=b.id;
  const traps=[];
  const trap=(object,key)=>{const descriptor=Object.getOwnPropertyDescriptor(object,key);traps.push(()=>{if(descriptor)Object.defineProperty(object,key,descriptor);else delete object[key]});Object.defineProperty(object,key,{configurable:true,get(){throw Error('private read '+key)}})};
  trap(b,'practiceEvidence');trap(b,'tactics');
  for(const id of b.roster){trap(db.players[id],'pool');trap(db.players[id],'potential')}
  const opponent=viewAnalysis();
  check(opponent.includes('id="opponentpreparation"')&&opponent.includes('id="opponentdraftreport"'),'actual public opponent reports not connected');
  bindAnalysis();nodes['#pprepteam'].onchange({target:{value:'AUTO'}});
  check(ANALYSIS_SET.prepTeam==='AUTO'&&viewAnalysis().includes('예정된 다음 상대가 없습니다'),'opponent empty state/actual binding');
  for(const restore of traps.reverse())restore();
  ANALYSIS_SET.mode='own';ANALYSIS_SET.team=b.id;
  check(analysisSelectedTeam(db).id===a.id&&!viewAnalysis().includes('<option value="'+b.id+'"'),'forged observer admitted foreign private team');
  const saved=packDB(db);DB=unpackDB(saved);
  check(ownPracticeComparison(DB,{team:a.id}).engine.games===1&&viewAnalysis().includes('id="practicecomparison"'),'saved evidence did not reach room');
  setManagedTeam(DB,reserve.id);ANALYSIS_SET.team=a.id;
  check(analysisSelectedTeam(DB).id===reserve.id&&analysisControlledTeams(DB).length===1,'reserve coach viewed parent private evidence');
  const parentEvidence=DB.teams[a.id].practiceEvidence;
  Object.defineProperty(DB.teams[a.id],'practiceEvidence',{configurable:true,get(){throw Error('reserve coach parent private read')}});
  viewAnalysis();Object.defineProperty(DB.teams[a.id],'practiceEvidence',{configurable:true,value:parentEvidence,writable:true,enumerable:true});
  bindAnalysis();openButtons[0].onclick();
  check(SQUAD===reserve.id&&navigation.at(-1)==='squad','room link selected wrong controlled squad');
  DB.world.fired=true;
  check(viewAnalysis().includes('분석할 관리 구단이 없습니다')&&!viewAnalysis().includes('id="practicecomparison"'),'fired manager retained private room');
  check(JSON.stringify(db.metaHistory)===history,'filters changed public history');
  console.log('ANALYSIS_ROOM_ACCEPTANCE PASS real official/practice, private/public reports, bindings, missing data, forged observer, reserve/fired authority, navigation, source/save continuity');
})()`,{timeout:30000,setupSources:[String.raw`
let DB=null,SQUAD=null,ANALYSIS_SET={mode:'own',team:'AUTO',period:'90',patch:'CURRENT',position:'ALL',prepTeam:'AUTO'};
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
let rerenders=0,focusRestores=0;const navigation=[],nodes={};
const modeButtons=['own','opponent'].map(mode=>({dataset:{analysisMode:mode}}));
const openButtons=['squad','season','patch'].map(view=>({dataset:{analysisOpen:view}}));
const document={querySelectorAll:s=>s==='[data-analysis-mode]'?modeButtons:s==='[data-analysis-open]'?openButtons:[]};
const $=s=>nodes[s]||(nodes[s]={});
function navKeepScroll(){rerenders++}
function navigateTo(view){navigation.push(view);return true}
`,...ui]});
