// Stage 11.5/6-4: responsive/accessibility contracts with executable keyboard paths.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root=resolve(import.meta.dirname,'..','src','artifact');
const get=path=>readFile(resolve(root,path),'utf8');
const [shell,uiState,roster,draft,overlay,season,data]=await Promise.all(
  ['shell.html','ui-state.js','ui-roster.js','ui-draft.js','ui-overlay.js','ui-season.js','ui-data.js'].map(get));

for(const marker of [
  '<html lang="ko">','width=device-width, initial-scale=1, viewport-fit=cover',
  'class="skip-link" href="#main"','<nav aria-label="주요 화면">',
  '<main id="main" tabindex="-1" aria-label="게임 콘텐츠">',
  'role="dialog" aria-modal="true"',':focus-visible{outline:3px',
  'min-height:44px','grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))',
  '.cfgs,.rgrid,.fin,.tac{grid-template-columns:minmax(0,1fr)}',
  '@media(max-width:360px)','@media(max-width:640px)',
  'font-size:16px','prefers-reduced-motion:reduce'
]) assert(shell.includes(marker),'missing responsive/accessible shell contract: '+marker);
for(const view of ['season','match','squad','patch','mc','data'])
  assert(shell.includes('type="button" data-v="'+view+'"'),'missing accessible navigation button: '+view);
assert(!/user-scalable\s*=\s*no|maximum-scale\s*=\s*1\b/i.test(shell),'pinch zoom must not be disabled');
assert(shell.includes('.du-last-picks{min-width:0;overflow-x:auto}'),'official draft images must scroll when zoomed');
assert(shell.includes('.du-grid{grid-template-columns:repeat(2,minmax(0,1fr))}'),'very narrow draft grid must remain usable');
assert(shell.includes('animation-duration:.01ms!important'),'reduced-motion users must not see repeated animations');

const luminance=hex=>{
  const channels=hex.slice(1).match(/.{2}/g).map(x=>parseInt(x,16)/255)
    .map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
  return .2126*channels[0]+.7152*channels[1]+.0722*channels[2];
};
const contrast=(a,b)=>{const [hi,lo]=[luminance(a),luminance(b)].sort((a,b)=>b-a);return (hi+.05)/(lo+.05)};
const lightBg=/--brass:(#[0-9A-Fa-f]{6});/.exec(shell)?.[1];
const lightFg=/--on-brass:(#[0-9A-Fa-f]{6});/.exec(shell)?.[1];
const dark=/:root\[data-theme="dark"\]\{([^}]+)\}/.exec(shell)?.[1]||'';
const darkBg=/--brass:(#[0-9A-Fa-f]{6});/.exec(dark)?.[1];
const darkFg=/--on-brass:(#[0-9A-Fa-f]{6})/.exec(dark)?.[1];
assert(lightBg&&lightFg&&darkBg&&darkFg,'missing theme primary button colors');
assert(contrast(lightBg,lightFg)>=4.5,'light primary text/background contrast below 4.5:1');
assert(contrast(darkBg,darkFg)>=4.5,'dark primary text/background contrast below 4.5:1');

// Real router code: focus destination and selectively expose overflowing regions.
{
  const tabs=['season','match','squad','patch','mc','data'].map(v=>({
    dataset:{v},setAttribute(k,x){this[k]=x}
  }));
  const regions=[{scrollWidth:880,clientWidth:320,dataset:{}},{scrollWidth:180,clientWidth:320,dataset:{}}];
  for(const item of regions){
    item.setAttribute=function(k,v){this[k]=v};
    item.removeAttribute=function(k){if(k==='tabindex')delete this.tabIndex;else delete this[k]};
  }
  const main={innerHTML:'',focusCalls:0,focus(options){this.focusCalls++;this.lastFocusOptions=options},
    querySelectorAll:s=>s==='.scroll'?regions:[]};
  const handlers={};
  const document={
    querySelector:s=>s==='#main'?main:null,
    querySelectorAll:s=>s==='nav button'?tabs:[]
  };
  const context=vm.createContext({
    document,window:{scrollY:0,addEventListener:(type,cb)=>handlers[type]=cb,scrollTo(){}},
    DB:{},SLOT:'1',SLOT_SWITCHING:false,UI_OVERLAY:null,
    freshInternalSeed:()=> 'seed',clearInterval:()=>{},
    requestAnimationFrame:()=>{},
    ...Object.fromEntries(['season','match','squad','patch','mc','data'].flatMap(v=>{
      const title={season:'Season',match:'Match',squad:'Squad',patch:'Patch',mc:'MC',data:'Data'}[v];
      return [['view'+title,()=>'<section>'+v+'</section>'],['bind'+title,()=>{}]];
    }))
  });
  vm.runInContext(uiState,context,{filename:'ui-state.js'});
  const run=s=>vm.runInContext(s,context);
  assert.equal(run("navigateTo('squad')"),true);
  assert.equal(main.focusCalls,1,'navigation must focus the new main landmark');
  assert.equal(main.lastFocusOptions.preventScroll,true,'keyboard focus must not undo scroll restoration');
  assert.equal(tabs[2]['aria-current'],'page');
  assert.equal(regions[0].tabIndex,0);
  assert.equal(regions[0].role,'region');
  assert(regions[0]['aria-label'].includes('스크롤'));
  assert.equal(regions[1].tabIndex,undefined,'non-overflowing tables must not add extraneous tab stops');
  regions[0].scrollWidth=300;handlers.resize();
  assert.equal(regions[0].tabIndex,undefined,'no-longer-overflowing tables must relinquish tab stops');
  regions[0].scrollWidth=1200;handlers.resize();
  assert.equal(regions[0].tabIndex,0,'responsive resize must restore keyboard scroll access');
  assert.equal(run("navigateTo('unknown')"),false);
}

// Real roster button event binding, including re-rendered focus and reduced motion.
{
  assert(roster.includes('class="roster-open" data-p-open='));
  assert(roster.includes('aria-expanded=')&&roster.includes('aria-controls="pdetail"'));
  assert(!roster.includes('tr.onclick=open')&&!roster.includes('tr.onkeydown='));
  assert(!roster.includes('tr data-p=')||!roster.includes('tabindex="0"'));
  const match=/  document\.querySelectorAll\('\[data-p-open\]'\)[\s\S]*?\n  \}\);/.exec(roster);
  assert(match,'roster button handler not found');
  let controls=[];
  let focused=null;
  const create=()=>({dataset:{pOpen:'p1'},focus(){focused=this}});
  controls=[create()];
  let scrollBehavior=null;
  const document={querySelectorAll:s=>s==='[data-p-open]'?controls:[]};
  const detail={scrollIntoView:options=>{scrollBehavior=options.behavior}};
  const context=vm.createContext({
    document,$:s=>s==='#pdetail'?detail:null,OPEN_P:null,
    nav:()=>{controls=[create()]},
    window:{matchMedia:()=>({matches:true})}
  });
  vm.runInContext(match[0],context);
  controls[0].onclick();
  assert.equal(vm.runInContext('OPEN_P',context),'p1');
  assert.equal(focused,controls[0],'focus must follow the player button after re-render');
  assert.equal(scrollBehavior,'auto','reduced-motion preference must disable scripted smooth scrolling');
  vm.runInContext(match[0],context);controls[0].onclick();
  assert.equal(vm.runInContext('OPEN_P',context),null,'player details must close from the same button');
}

// Real draft grid rendering exposes selected states and champion identification.
{
  const start=draft.indexOf('function draftUiGrid(){'),end=draft.indexOf('function draftUiRender(){',start);
  assert(start>=0&&end>start);
  const c={id:'sample',name:'테스트 챔피언',roles:['MID']};
  const context=vm.createContext({
    DRAFT_UI:{selected:'sample',state:{db:{patch:{champions:{sample:c}}}}},
    draftUiMatch:()=>true,draftUiChampionState:()=>({disabled:false,reason:''}),
    championDisplayName:champ=>champ.name,championPortraitMarkup:()=>'<span></span>',
    ROLE_KO:{MID:'미드'},esc:s=>String(s)
  });
  vm.runInContext(draft.slice(start,end),context);
  const html=vm.runInContext('draftUiGrid()',context);
  assert(html.includes('data-du-champ="sample" aria-pressed="true"'));
  assert(html.includes('aria-label="테스트 챔피언 · 미드"'));
  assert(draft.includes("x.setAttribute('aria-pressed',String(x===b))"),
    'selecting another champion must update the ARIA pressed state');
  for(const kind of ['analysis','advice','intent'])
    assert(draft.includes('aria-controls="du-info-'+kind+'"')&&draft.includes('id="du-info-'+kind+'"'));
  assert(draft.includes('role="status" aria-live="polite"'),'draft turn changes need an accessible status');
}
assert(overlay.includes("if(typeof uiEnhanceScrollRegions==='function')uiEnhanceScrollRegions(root)"),
  'dialog scroll regions must receive the same keyboard enhancements');
assert(season.includes('role="status"')&&data.includes('role="status"'),
  'season progress and save operations need announced status');
console.log('Stage 11.5/6-4 mobile/a11y acceptance: PASS (320px and zoom CSS contracts, focus/skip, scroll regions, contrast, roster keyboard actions, draft ARIA, reduced motion)');
