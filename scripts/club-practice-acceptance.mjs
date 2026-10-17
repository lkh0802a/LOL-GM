import {artifactSources,runEngineFixture} from './test-harness.mjs';
const sources=await artifactSources(['ui-roster.js','ui-club-briefing.js','ui-club-home.js','ui-club-practice.js','ui-club-scrim.js','ui-club-recruitment.js','ui-scrim-plans.js','ui-squad-controls.js','app.js']);const app=sources.pop(),esc=app.match(/^const esc=.*$/m)[0];
await runEngineFixture(String.raw`(()=>{
  const check=(ok,msg)=>{if(!ok)throw Error('CLUB_PRACTICE '+msg)};
  const cfg=defaultWorldConfig();cfg.regions=[
    regionCfg('NA',{teams:3,div2:true}),
    regionCfg('EU',{teams:2,div2:false})
  ];cfg.internationals=[];
  DB=buildWorld(cfg);
  let [t,other]=activeTeams(DB,'NA',1);
  const reserve=reserveTeamsOf(DB,t)[0];
  setManagedTeam(DB,t.id);
  DB.world={phase:'season',year:DB.year,seed:'practice-ui',manage:'manual',
    registrationVersion:1,seasons:{},offers:[],marketLog:[],steps:[],step:0};
  setWorldCalendarDate(DB,DB.year+'-01-10');
  for(const team of activeTeams(DB)){
    for(const role of ROLES){
      const p=genPlayer(DB,new RNG('practice-ui|'+team.id+role),
        {region:team.region,role,age:22,base:65});
      signContract(DB,p,team,1,2,{});
    }
    if(reserveTeamsOf(DB,team).length&&!team.parent){
      const p=genPlayer(DB,new RNG('practice-extra|'+team.id),
        {region:team.region,role:'TOP',age:22,base:65});
      signContract(DB,p,team,1,2,{});
    }
    initializeDepthChart(DB,team,true);team.finance.cash=1000;
  }
  initializeOfficialRegistrations(DB);SQUAD=t.id;
  const before=JSON.stringify(DB);
  const model=clubPracticeModel();
  check(model&&model.t.id===t.id&&model.rows.length===6&&
    model.day.remaining===PRACTICE_POINTS&&JSON.stringify(DB)===before,
    'read-only model changed the world or displayed wrong club');
  check(!!clubPracticeModel(DB,reserve.id)&&!clubPracticeModel(DB,other.id),
    'foreign or reserve model access error');
  const briefing=renderClubPracticeBriefing();
  check(briefing.includes('스크림')&&briefing.includes('설정은 사용하지 않습니다'),
    'briefing still advertises obsolete manual training');
  check(openClubPractice(t.id)&&JSON.stringify(DB)===before,
    'opening practice overlay changed simulation');
  check(root.html.includes('스크림')&&root.html.includes('회복')&&
    !root.html.includes('훈련 강도')&&!root.html.includes('훈련 배분')&&
    !root.html.includes('data-practice-allocation')&&
    !root.querySelector('#brief-practice-apply')&&
    !root.querySelector('#brief-practice-intensity'),
    'obsolete training form or write control still visible');
  check(root.html.includes(DB.players[t.roster[0]].name),
    'own roster medical details missing');
  const close=root.querySelector('#brief-practice-close').onclick,shown=UI_OVERLAY;
  UI_OVERLAY={kind:'club-practice'};close();
  check(UI_OVERLAY!==null&&UI_OVERLAY!==shown,
    'stale overlay close closed a replacement dialog');
  UI_OVERLAY=shown;close();
  check(!UI_OVERLAY&&JSON.stringify(DB)===before&&saves===0,
    'closing read-only overlay changed world');
  const p=DB.players[t.roster[0]];
  p.medicalPlan='rest';
  consumeScrimPractice(DB,t,2);
  const snapshot=JSON.stringify(DB),resource=clubPracticeModel();
  check(JSON.stringify(DB)===snapshot&&resource.day.scrim===20&&
    resource.day.remaining===PRACTICE_POINTS-20,
    'real scrim expenditure not represented faithfully');
  runDailyPractice(DB);
  check(t.practiceDay.completed&&t.practiceDay.scrim===20&&
    t.practiceDay.drills===0&&t.practiceDay.remaining===0&&
    !p.practiceDay&&!t.practiceUsage,
    'daily closure generated obsolete individual drills');
  const once=JSON.stringify(DB);
  runDailyPractice(DB);
  check(JSON.stringify(DB)===once,'daily closure not idempotent');
  const restored=unpackDB(packDB(DB));
  check(restored.teams[t.id].practiceDay?.scrim===20&&
    !restored.teams[t.id].practiceUsage&&
    !restored.players[p.id].practiceDay,
    'scrim resource ledger or retired fields lost on restore');
  check(clubPracticeModel(restored,t.id)===null||
    clubPracticeModel(restored,t.id)?.day.scrim===20,
    'restored model failed to read persisted scrim time');
  UI_OVERLAY=null;UI_RENDER_ID++;setManagedTeam(DB,other.id);
  check(!clubPracticeModel(DB,t.id)&&!openClubPractice(t.id),
    'other club accessed owned private scrim status');
  console.log('CLUB_PRACTICE_ACCEPTANCE PASS (ownership, read-only UI, stale close, actual scrim ledger, no drills, restore)');
})();`,{timeout:30000,setupSources:[esc,...sources,String.raw`
var SQUAD,SQUAD_EDIT=null,DB,MSG='',VIEW='season',SLOT='1',SLOT_SWITCHING=false,UI_RENDER_ID=1,UI_OVERLAY=null,confirm=()=>true;const SSET={tab:'table'};let saves=0;
const camel=s=>s.replace(/-([a-z])/g,(_,c)=>c.toUpperCase());
const root={html:'',nodes:[],querySelectorAll(sel){return sel.split(',').flatMap(s=>{s=s.trim();if(s.startsWith('#'))return this.nodes.filter(n=>n.id===s.slice(1));const a=s.match(/^\[([^=\]]+)(?:="([^"]*)")?\]/);if(!a)return [];return this.nodes.filter(n=>Object.hasOwn(n.attrs,a[1])&&(a[2]===undefined||n.attrs[a[1]]===a[2])&&(!s.endsWith(':checked')||n.checked));});},querySelector(s){return this.querySelectorAll(s)[0]||null;}};
const document={querySelector:s=>s==='#overlay'?root:{focus(){}},querySelectorAll:()=>[]};function saveDB(){saves++}function navKeepScroll(){UI_RENDER_ID++}function closeUiOverlay(){UI_OVERLAY=null}function openUiOverlay(o){root.html=o.html;UI_OVERLAY={kind:o.kind};root.nodes=[...o.html.matchAll(/<(button|input|select|p)\b([^>]*)>/g)].map(x=>{const attrs=Object.fromEntries([...x[2].matchAll(/([\w-]+)="([^"]*)"/g)].map(a=>[a[1],a[2]]));return {attrs,dataset:Object.fromEntries(Object.entries(attrs).filter(([k])=>k.startsWith('data-')).map(([k,v])=>[camel(k.slice(5)),v])),id:attrs.id,type:attrs.type||'',getAttribute(k){return attrs[k]},value:attrs.value||'',checked:x[2].includes(' checked'),focus(){}};});}

const $=s=>root.querySelector(s);

`]});
