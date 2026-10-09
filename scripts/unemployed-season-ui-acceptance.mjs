import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {runEngineFixture,artifactSources} from './test-harness.mjs';
const root=new URL('../',import.meta.url),e=JSON.parse(await readFile(new URL('docs/evidence/unemployed-season-context-2026-10-08.json',root)));
const rows=JSON.parse(gunzipSync(await readFile(new URL(e.archive.path,root))));
const original=Buffer.from(rows.find(r=>r.path==='original/src/artifact/ui-season.js').base64,'base64').toString();
const current=(await artifactSources(['ui-season.js']))[0];
const fixture=JSON.parse(await readFile(new URL('docs/evidence/unemployed-season-fixture-2026-10-08.json',root)));
const popupSource=current.slice(current.indexOf('function findMatch('),current.indexOf('function openSeries('))+current.match(/^function bindSeasonTab.*$/m)[0];
await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error('SEASON_UI '+m)},copy=x=>unpackDB(packDB(x));
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:2,div2:true,system:'franchise',splits:1})];cfg.internationals=[];
 const originalDb=buildWorld(cfg),a=managerSelectableTeams(originalDb)[0],b=managerSelectableTeams(originalDb).find(t=>t.id!==a.id);startWorldSeason(originalDb,a.id,'season-ui-guards');originalDb.world.phase='pick';
 DB=copy(originalDb);nodes.get('#pickteam').value=b.id;originalBindSeason();const staleOriginal=nodes.get('#pickgo').onclick;DB=copy(DB);saves=0;staleOriginal();check(managedTeamId(DB)===b.id&&saves===1,'original retained choice writes new loaded DB');
 console.log('SEASON_UI_ORIGINAL_COUNTEREXAMPLE '+JSON.stringify({loadedOverwrite:true,saves}));
 for(const mode of ['load','date','year','manager','team','slot','render','view','overlay','phase','manage','fired','pending','eligibility','region']){
  DB=copy(originalDb);VIEW='season';SLOT='1';SLOT_SWITCHING=false;UI_RENDER_ID++;UI_OVERLAY=null;bindSeason();const cb=nodes.get('#pickgo').onclick;
  if(mode==='load')DB=copy(DB);if(mode==='date')DB.worldDate='2099-01-01';if(mode==='year')DB.year++;if(mode==='manager')DB.manager={...DB.manager};if(mode==='team')setManagedTeam(DB,null);if(mode==='slot')SLOT='2';if(mode==='render')UI_RENDER_ID++;if(mode==='view')VIEW='data';if(mode==='overlay')UI_OVERLAY={kind:'foreign'};if(mode==='phase')DB.world.phase='preseason';if(mode==='manage')DB.world.manage='ai';if(mode==='fired')DB.world.fired=true;if(mode==='pending')DB.world.pendingOfficial={queue:[{}]};if(mode==='eligibility')DB.teams[b.id].active=false;if(mode==='region')DB.teams[b.id].region='missing';
  const before=JSON.stringify(DB);saves=0;cb();check(JSON.stringify(DB)===before&&saves===0,'stale choice '+mode);
 }
 DB=copy(originalDb);VIEW='season';SLOT='1';UI_RENDER_ID++;UI_OVERLAY=null;nodes.get('#pickteam').value='missing';bindSeason();const before=JSON.stringify(DB);saves=0;nodes.get('#pickgo').onclick();check(JSON.stringify(DB)===before&&saves===0&&nodes.get('#pickmsg').textContent,'invalid current choice refusal');
 DB=copy(originalDb);nodes.get('#pickteam').value=b.id;bindSeason();const expected=copy(DB);setManagedTeam(expected,b.id);expected.world.fired=false;expected.teams[b.id].owner.patience=2;expected.world.phase='preseason';saves=0;const choose=nodes.get('#pickgo').onclick;choose();check(JSON.stringify(DB)===JSON.stringify(expected)&&saves===1,'actual existing manual writer whole DB equality');choose();check(saves===1,'duplicate choice inert');
 DB=copy(originalDb);VIEW='season';SLOT='1';UI_OVERLAY=null;const academy=managerSelectableTeams(DB).find(t=>t.parent),parent=DB.teams[academy.parent],parentBefore=JSON.stringify(parent);nodes.get('#pickteam').value=academy.id;bindSeason();nodes.get('#pickgo').onclick();
 check(managedTeamId(DB)===academy.id&&managerControlsSquad(DB,academy)&&!managerControlsSquad(DB,parent)&&managedRecruitmentTeamId(DB)===null,'actual reserve choice retains squad-only authority');
 check(JSON.stringify(parent)===parentBefore&&managedTeamId(copy(DB))===academy.id,'parent untouched and actual compact career continuity');
 for(const priorPicking of [undefined,false,'retained']){
  DB=copy(originalDb);DB.world.phase='preseason';if(priorPicking!==undefined)DB.world.picking=priorPicking;else delete DB.world.picking;setManagedTeam(DB,null);const before=JSON.stringify(DB);saves=0;bindSeason();nodes.get('#sreset').onclick();check(DB.world.phase==='pick'&&managedTeamId(DB)===null,'manual choice starts without assignment');bindSeason();nodes.get('#pickcancel').onclick();check(JSON.stringify(DB)===before&&saves===2,'cancel restores whole original DB and picking presence');
 }
 DB=copy(originalDb);DB.world.phase='preseason';setManagedTeam(DB,null);bindSeason();nodes.get('#sreset').onclick();DB.worldDate='2099-01-01';check(!seasonChoiceReturnCurrent(),'changed date discards old return context');
 DB=copy(originalDb);DB.world.phase='preseason';setManagedTeam(DB,null);bindSeason();nodes.get('#sreset').onclick();DB.manager={...DB.manager};check(!seasonChoiceReturnCurrent(),'replaced manager identity discards old return context');bindSeason();const replacedBefore=JSON.stringify(DB);saves=0;nodes.get('#pickcancel').onclick();check(JSON.stringify(DB)===replacedBefore&&saves===0,'fresh retained cancel cannot restore previous manager phase');
 const matchButton={dataset:{m:FIXTURE.world.seasons['compact-official'].days[0].matches[0].id}};document.querySelectorAll=selector=>selector==='#stab [data-m]'?[matchButton]:[];
 for(const mode of ['current','load','date','team','slot','render','view','overlay']){
  DB=copy(FIXTURE);SSET.view='compact-official';VIEW='season';SLOT='1';UI_RENDER_ID++;UI_OVERLAY=null;opened=[];bindSeasonTab();const cb=matchButton.onclick;
  if(mode==='load')DB=copy(DB);if(mode==='date')DB.worldDate='2099-01-01';if(mode==='team')setManagedTeam(DB,null);if(mode==='slot')SLOT='2';if(mode==='render')UI_RENDER_ID++;if(mode==='view')VIEW='data';if(mode==='overlay')UI_OVERLAY={kind:'foreign'};
  const before=JSON.stringify(DB);cb();check(JSON.stringify(DB)===before&&opened.length===(mode==='current'?1:0),'actual recorded popup context '+mode);
  if(mode==='current')check(opened[0].res.games[0].publicRecord.ending.kind==='nexus','current actual recorded nexus');
 }
 DB=copy(FIXTURE);SSET.view='missing';check(findMatch(matchButton.dataset.m)===null,'missing selected competition safe');
 console.log('무소속 시즌 UI 수용 통과: 원본 로드 후 덮어쓰기 반례, 새 선택15 stale 문맥·거절·중복·기존 writer wholeDB·명시 취소/반환');
})()`,{timeout:30000,setupSources:[String.raw`
let opened=[];function openSeries(m){opened.push(m)}
function curS(){return DB.world?.seasons[SSET.view]}
let DB,VIEW='season',SLOT='1',SLOT_SWITCHING=false,UI_RENDER_ID=1,UI_OVERLAY=null,saves=0,MSG='';
const SSET={view:null,tab:'sched'},nodes=new Map();
for(const id of ['#pickteam','#pickgo','#pickcancel','#pickmsg','#snew','#sreset','#stab'])nodes.set(id,{value:'',textContent:'',focus(){},innerHTML:''});
const $=s=>nodes.get(s)||null,document={querySelectorAll:()=>[]};
function nav(){UI_RENDER_ID++}function saveDB(){saves++;return packDB(DB)}function bindClubBriefing(){}function bindOfficeOpinionControls(){}
function bindSeasonTab(){}function esc(x){return String(x)}function teamOpts(){return ''}
`,original.slice(original.indexOf('function bindSeason(){')).replace('function bindSeason(){','function originalBindSeason(){'),current.slice(current.indexOf('function bindSeason(){')),popupSource,'const FIXTURE='+JSON.stringify(fixture)+';']});
