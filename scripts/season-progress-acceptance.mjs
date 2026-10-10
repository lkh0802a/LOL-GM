import {readFile} from 'node:fs/promises';
import {runEngineFixture,artifactSources} from './test-harness.mjs';
const fixture=JSON.parse(await readFile(new URL('../docs/evidence/unemployed-season-fixture-2026-10-08.json',import.meta.url)));
const baselineUi=await readFile(new URL('../docs/evidence/season-progress-original-ui-2026-10-09.js',import.meta.url),'utf8');
const [ui,state]=await artifactSources(['ui-season.js','ui-state.js']);
await runEngineFixture(String.raw`(()=>{
 const check=(ok,msg)=>{if(!ok)throw Error('PROGRESS '+msg)},copy=x=>unpackDB(JSON.stringify(x));
 DB=copy(FIXTURE);setManagedTeam(DB,null);runOffseason(DB);closeMarket(DB);startWorldSeason(DB,null,'async-manager-proof');
 const prepared=JSON.stringify(DB),reset=()=>{cancelUiTasks();callbacks.length=0;DB=copy(JSON.parse(prepared));VIEW='season';SLOT='1';SLOT_SWITCHING=false;UI_RENDER_ID++;UI_OVERLAY=null;MSG='';saves.length=0;bindSeason()};
 reset();originalBindSeason();nodes.get('#send').onclick();DB.manager={...DB.manager};const originalBefore=JSON.stringify(DB);callbacks.shift()();check(DB.worldDate==='2028-01-10'&&JSON.stringify(DB)!==originalBefore,'retained exact validated main actually consumes dates after manager replacement');console.log('PROGRESS_ORIGINAL_COUNTEREXAMPLE '+JSON.stringify({beforeDate:'2028-01-08',afterDate:DB.worldDate,continued:true}));
 for(const mode of ['manager','team','manage','fired','world','load','slot','render','view','switching','overlay','externalDay','year','phase','step','pending']){
  reset();nodes.get('#send').onclick();check(callbacks.length===1,'actual held continuation '+mode);check(DB.worldDate==='2028-01-08','actual initial two days');
  if(mode==='manager')DB.manager={...DB.manager};if(mode==='team')setManagedTeam(DB,Object.keys(DB.teams).find(id=>DB.teams[id].active!==false));if(mode==='manage')DB.world.manage=DB.world.manage==='manual'?'ai':'manual';if(mode==='fired')DB.world.fired=!DB.world.fired;
  if(mode==='world')DB.world={...DB.world};if(mode==='load')DB=copy(DB);if(mode==='slot')SLOT='2';if(mode==='render')UI_RENDER_ID++;if(mode==='view')VIEW='data';if(mode==='switching')SLOT_SWITCHING=true;if(mode==='overlay')UI_OVERLAY={kind:'foreign'};
  if(mode==='externalDay')playWorldDay(DB);if(mode==='year')DB.year++;if(mode==='phase')DB.world.phase='offseason';if(mode==='step')DB.world.step++;if(mode==='pending')DB.world.pendingOfficial={date:DB.worldDate,queue:[]};
  const before=JSON.stringify(DB),world=DB.world;callbacks.shift()();check(JSON.stringify(DB)===before,'whole DB unchanged after external '+mode);
  const same=['manager','team','manage','fired','overlay','externalDay','year','phase','step','pending'].includes(mode);check(saves.length===(same?1:0),'completed save target '+mode);
  if(same){check(UI_TASKS.size===0,'interrupted task removed '+mode);check(JSON.stringify(unpackDB(saves[0]))===JSON.stringify(unpackDB(packDB(DB))),'actual compact snapshot '+mode)}
  if(mode==='overlay')check(UI_OVERLAY.kind==='foreign','foreign dialog retained');
  cancelUiTasks();const cancelSave=same||['render','view'].includes(mode);check(saves.length===(cancelSave?1:0),'navigation retains completed history; changed load/world/slot never written '+mode);
  console.log('PROGRESS_CONTEXT '+JSON.stringify({mode,date:DB.worldDate,saves:saves.length,wholeDbUnchanged:JSON.stringify(DB)===before}));
 }
 reset();nodes.get('#send').onclick();const before=JSON.stringify(DB),pause=nodes.get('#spause').onclick;check(!nodes.get('#spause').disabled,'pause actionable');pause();check(JSON.stringify(DB)===before&&saves.length===1&&UI_TASKS.size===0,'actual manual pause preserves completed whole DB');callbacks.shift()();pause();check(JSON.stringify(DB)===before&&saves.length===1,'duplicate pause and held continuation inert');
 bindSeason();nodes.get('#sday').onclick();check(DB.worldDate==='2028-01-09'&&saves.length===2,'explicit resume uses current context and one actual day');
 const expected=copy(JSON.parse(prepared));playWorldDay(expected);playWorldDay(expected);playWorldDay(expected);check(JSON.stringify(DB)===JSON.stringify(expected),'same actual writer/seed outcome whole DB parity after pause resume');
 check(JSON.stringify(unpackDB(packDB(DB)).history)===JSON.stringify(unpackDB(packDB(expected)).history),'compact archived history parity');
 console.log('PROGRESS_PAUSE_RAW '+JSON.stringify({actual:DB,expected,packed:JSON.parse(saves.at(-1))}));
 reset();nodes.get('#send').onclick();callbacks.shift()();check(DB.worldDate==='2028-01-10'&&callbacks.length===1,'intentional internal dates remain supported');nodes.get('#spause').onclick();
 for(const mode of ['club','region','active']){
  reset();const id=Object.keys(DB.teams).find(id=>DB.teams[id].active!==false);setManagedTeam(DB,id);bindSeason();nodes.get('#send').onclick();
  if(mode==='club')DB.teams[id]={...DB.teams[id]};if(mode==='region')DB.teams[id].region='missing-region';if(mode==='active')DB.teams[id].active=false;
  const before=JSON.stringify(DB);callbacks.shift()();check(JSON.stringify(DB)===before&&saves.length===1&&UI_TASKS.size===0,'actual managed club boundary '+mode);
 }
 reset();const actualDay=playWorldDay;let injected=0;playWorldDay=db=>{const result=actualDay(db);if(++injected===1)db.manager={...db.manager};return result};
 nodes.get('#send').onclick();playWorldDay=actualDay;check(DB.worldDate==='2028-01-07'&&injected===1&&saves.length===1,'authority checked between actual daily writers');
 const afterOne=copy(JSON.parse(prepared));playWorldDay(afterOne);afterOne.manager={...afterOne.manager};check(JSON.stringify(DB)===JSON.stringify(afterOne),'single completed day retained without rollback');
 reset();nodes.get('#sfixture').onclick();let bounded=0;while(callbacks.length&&++bounded<30)callbacks.shift()();check(bounded<30&&UI_TASKS.size===0,'bounded actual first professional fixture');
 const official=Object.values(DB.world.seasons).flatMap(s=>s.days.flatMap(d=>d.matches)).filter(m=>m.res);check(official.length>0&&official.every(m=>m.res.games.every(g=>g.publicRecord?.ending?.kind==='nexus')),'actual organized fixture finishes with recorded nexus');
 const officialBefore=JSON.stringify(official.map(m=>m.res));bindSeason();nodes.get('#send').onclick();nodes.get('#spause').onclick();callbacks.shift()?.();
 const pauseDb=JSON.stringify(DB),currentMatches=Object.values(DB.world.seasons).flatMap(s=>s.days.flatMap(d=>d.matches));check(JSON.stringify(official.map(m=>currentMatches.find(x=>x.id===m.id).res))===officialBefore,'completed official records remain after pause');
 for(const source of [DB,FIXTURE])for(const owner of [null,official[0].a]){const retained=copy(source);setManagedTeam(retained,owner);const restored=unpackDB(packDB(retained));for(const s of Object.values(retained.world.seasons))for(const d of s.days)for(const m of d.matches)if(m.res){const saved=restored.world.seasons[s.key].days.flatMap(d=>d.matches).find(x=>x.id===m.id).res,region=retained.teams[owner]?.region,lite=!!(region&&s.region&&s.region!==region&&!retained.competitions[s.comp]?.international);check(JSON.stringify(saved)===JSON.stringify(s.done?seriesResultForSave(m.res,lite):m.res),'actual completed full/lite versus live existing official save contract')}}
 check(JSON.stringify(DB)===pauseDb,'private save probes do not mutate active world');console.log('PROGRESS_OFFICIAL_RAW '+JSON.stringify({db:DB,packed:JSON.parse(packDB(DB)),officialBefore:JSON.parse(officialBefore)}));
 reset();const initialStep=DB.world.step;nodes.get('#sstep').onclick();let stageBound=0;while(callbacks.length&&++stageBound<80)callbacks.shift()();check(stageBound<80&&UI_TASKS.size===0&&DB.world.step!==initialStep&&saves.length===1,'actual internal stage transition finishes and saves');
 const expectedStage=copy(JSON.parse(prepared));let dayBound=0;while(expectedStage.world.phase==='season'&&expectedStage.world.step===initialStep&&++dayBound<160)playWorldDay(expectedStage);check(dayBound<160&&JSON.stringify(DB)===JSON.stringify(expectedStage),'same seed actual stage writer whole DB equality');
 const stageSaved=unpackDB(saves[0]);for(const s of Object.values(DB.world.seasons))for(const d of s.days)for(const m of d.matches)if(m.res){const saved=stageSaved.world.seasons[s.key].days.flatMap(d=>d.matches).find(x=>x.id===m.id).res;check(JSON.stringify(saved)===JSON.stringify(s.done?seriesResultForSave(m.res,false):m.res),'actual stage compact/source save continuity')}
 console.log('PROGRESS_STAGE_RAW '+JSON.stringify({stepBefore:initialStep,stepAfter:DB.world.step,date:DB.worldDate,actual:DB,expected:expectedStage,packed:JSON.parse(saves[0])}));
 console.log('협력 날짜 진행 수용 통과: 실제 외부 문맥16개·구단3경계·수동 중단/중복/재개·기존 writer 전체DB/시드/공식 nexus/압축history');
})()`,{timeout:120000,setupSources:[(await artifactSources(['ui-transfer-page.js']))[0],String.raw`
let DB,VIEW='season',SLOT='1',SLOT_SWITCHING=false,UI_RENDER_ID=1,UI_OVERLAY=null,MSG='';
const SSET={view:null,tab:'sched'},callbacks=[],nodes=new Map(),saves=[];
for(const id of ['#sday','#sfixture','#smine','#sstep','#send','#sprog','#spause'])nodes.set(id,{value:'',textContent:'',disabled:false});
const $=s=>nodes.get(s)||null,document={querySelector:s=>$(s),querySelectorAll:()=>[]};
function nav(){UI_RENDER_ID++}function saveDB(){saves.push(packDB(DB))}function bindClubBriefing(){}function bindOfficeOpinionControls(){}function bindSeasonTab(){}
function setTimeout(fn){callbacks.push(fn)}function requestAnimationFrame(fn){}function esc(x){return String(x)}function teamOpts(){return ''}
`,state.slice(state.indexOf('const UI_TASKS='),state.indexOf('let UI_RENDER_ID=')),baselineUi.slice(baselineUi.indexOf('function bindSeason(){'),baselineUi.indexOf('// 시즌 조회')).replace('function bindSeason(){','function originalBindSeason(){'),ui.slice(ui.indexOf('function bindSeason(){')),'const FIXTURE='+JSON.stringify(fixture)+';']});
