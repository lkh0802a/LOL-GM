import {artifactSources,runEngineFixture} from './test-harness.mjs';
const sources=await artifactSources(['ui-club-briefing.js','ui-club-home.js']);
await runEngineFixture(String.raw`(()=>{
 const check=(v,m)=>{if(!v)throw Error('CLUB_HOME '+m)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:3,div2:true})];cfg.internationals=[];DB=buildWorld(cfg);const [t,other]=activeTeams(DB,'NA',1);setManagedTeam(DB,t.id);DB.world={phase:'season',year:DB.year,seed:'home-ui',manage:'manual',registrationVersion:1,seasons:{},offers:[],marketLog:[],steps:[],step:0};setWorldCalendarDate(DB,DB.year+'-01-10');
 const initial=JSON.stringify(DB);check(renderClubHomeDetails('원래 상세').includes('원래 상세')&&!clubHomeUiState().open&&JSON.stringify(DB)===initial,'collapsed complete read pure');
 bindClubHome();detail.open=true;detail.ontoggle();check(clubHomeUiState().open&&renderClubHomeDetails('상세').includes(' open'),'manual disclosure survives same context');
 const oldJump=jump.onclick;oldJump();check(VIEW==='squad'&&SQUAD===t.id&&JSON.stringify(DB)===initial,'owned squad navigation no writer');bindClubHome();back.onclick();check(VIEW==='season'&&clubHomeUiState().open&&JSON.stringify(DB)===initial,'actual route context return no writer');
 clubHomeUiState().open=false;detail.open=false;clubHomeRevealTarget({closest:()=>detail});check(detail.open&&clubHomeUiState().open&&JSON.stringify(DB)===initial,'existing action reveals return target without writer');
 const fixture=packDB(DB);const failures=[];
 for(const kind of ['load','manager','team','date','slot','render','ai','fired','phase','year','pending','world','switching','overlay']){
  DB=unpackDB(fixture);VIEW='season';SLOT='1';UI_RENDER_ID++;UI_OVERLAY=null;SLOT_SWITCHING=false;bindClubHome();const cb=jump.onclick;
  if(kind==='load')DB=unpackDB(packDB(DB));if(kind==='manager')DB.manager={...DB.manager};if(kind==='team')setManagedTeam(DB,other.id);if(kind==='date')DB.worldDate=addDays(DB.worldDate,1);if(kind==='slot')SLOT='2';if(kind==='render')UI_RENDER_ID++;if(kind==='ai')DB.world.manage='ai';if(kind==='fired')DB.world.fired=true;if(kind==='phase')DB.world.phase='offseason';if(kind==='year')DB.year++;if(kind==='pending')DB.world.pendingOfficial={queue:[]};if(kind==='world')DB.world={...DB.world};if(kind==='switching')SLOT_SWITCHING=true;if(kind==='overlay')UI_OVERLAY={kind:'existing'};
  const before=JSON.stringify(DB),oldSquad=SQUAD;cb();check(JSON.stringify(DB)===before&&VIEW==='season'&&SQUAD===oldSquad,kind+' retained button inert');failures.push(kind);
 }
 UI_OVERLAY=null;SLOT_SWITCHING=false;DB=unpackDB(fixture);SLOT='1';VIEW='season';UI_RENDER_ID++;check(!clubHomeUiState().open,'loaded new world resets transient disclosure');
 const before=JSON.stringify(DB);bindClubHome();jump.onclick();check(VIEW==='squad'&&JSON.stringify(DB)===before,'current after stale works');
 for(const restored of [JSON.parse(JSON.stringify(DB)),unpackDB(packDB(DB))])check(JSON.stringify(restored.manager)===JSON.stringify(DB.manager),'actual raw JSON and compact save current career ownership');
 console.log('CLUB_HOME_ACCEPTANCE '+JSON.stringify({pure:true,ownedRoute:true,manualDisclosure:true,returnTarget:true,stale:failures,save:true}));
})()`,{timeout:30000,setupSources:[...sources,String.raw`
var DB,VIEW='season',SQUAD=null,SLOT='1',SLOT_SWITCHING=false,UI_RENDER_ID=1,UI_OVERLAY=null;
const detail={open:false},jump={},back={};const document={querySelectorAll:()=>[detail],querySelector:s=>s==='[data-club-home-squad]'?jump:s==='[data-club-home-return]'?back:null};
function navigateTo(view){VIEW=view;UI_RENDER_ID++;} 
`]});
