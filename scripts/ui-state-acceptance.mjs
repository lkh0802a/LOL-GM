// Stage 11.5/6-1: isolated routing/state contract for the standalone UI.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { UI_MODULES } from './artifact-modules.mjs';

const root=resolve(import.meta.dirname,'..','src','artifact');
const source=await readFile(resolve(root,'ui-state.js'),'utf8');
assert(UI_MODULES.indexOf('ui-state.js')===UI_MODULES.length-2,'UI state must load immediately before app bootstrap');
const calls=[],frames=[],tabs=['season','match','squad','patch','data'].map(v=>({
  dataset:{v},attrs:{},setAttribute(k,value){this.attrs[k]=value}
}));
const main={innerHTML:''};
const window={scrollY:70,scrollTo(x,y){this.scrollY=y;calls.push('scroll:'+x+':'+y)}};
const document={querySelector(s){return s==='#main'?main:null},querySelectorAll(s){return s==='nav button'?tabs:[]}};
const context=vm.createContext({
  document,window,
  DB:{test:true},SLOT:'1',SLOT_SWITCHING:false,UI_OVERLAY:null,
  clearUiOverlay:()=>{},closeUiOverlay:()=>{},
  clearInterval:n=>calls.push('interval:'+n),
  requestAnimationFrame:f=>frames.push(f),
  freshInternalSeed:()=> 'test-world-seed',
  ...Object.fromEntries(['season','match','squad','patch','data'].flatMap(v=>[
    ['view'+({season:'Season',match:'Match',squad:'Squad',patch:'Patch',mc:'MC',data:'Data'}[v]),()=>{calls.push('render:'+v);return '<section>'+v+'</section>'}],
    ['bind'+({season:'Season',match:'Match',squad:'Squad',patch:'Patch',mc:'MC',data:'Data'}[v]),()=>calls.push('bind:'+v)]
  ]))
});
vm.runInContext(source,context,{filename:'ui-state.js'});
const run=s=>vm.runInContext(s,context);
const value=s=>vm.runInContext(s,context);

assert.equal(value('VIEW'),'season');
assert.equal(value('SSET.seed'),'test-world-seed');
assert.deepEqual(Array.from(value('Object.keys(UI_ROUTES)')),['season','match','squad','patch','data']);
run('LIVE=42;nav()');
assert.equal(main.innerHTML,'<section>season</section>');
assert(calls.includes('interval:42'),'rerender must clear match playback interval');
assert.equal(tabs[0].attrs['aria-current'],'page');
assert.equal(tabs[1].attrs['aria-current'],'false');
assert.deepEqual(calls.slice(-2),['render:season','bind:season']);

assert.equal(value("navigateTo('data')"),true);
assert.equal(value('VIEW'),'data');
assert.equal(main.innerHTML,'<section>data</section>');
assert.equal(window.scrollY,0);
assert.equal(tabs[4].attrs['aria-current'],'page');
const count=calls.length;
assert.equal(value("navigateTo('nonexistent')"),false);
assert.equal(value("navigateTo('mc')"),false,'removed simulation screen cannot be opened');
assert.equal(value('VIEW'),'data');
assert.equal(calls.length,count,'invalid route must not rerender or scroll');

window.scrollY=211;
run('navKeepScroll()');
assert.equal(main.innerHTML,'<section>data</section>');
assert.equal(frames.length,1);
frames.shift()();
assert.equal(window.scrollY,211,'in-screen rerender must keep the scroll position');

window.scrollY=300;
run('navKeepScroll()');
assert.equal(frames.length,1);
assert.equal(value("navigateTo('match')"),true);
frames.shift()();
assert.equal(window.scrollY,0,'stale animation frame must not move a newer screen');

run("LAST={x:1};LASTSER={x:2};OPEN_P='p1';SQUAD_EDIT={parentId:'old',squads:{first:{starters:{MID:'old'},tactics:{aggression:13}},reserve:{training:{intensity:'high'}}},rosterPlan:{assignments:{old:'reserve'}}};MSG='error';MC.res={n:5};SSET.view='sample';PSET.team='old-team';PSET.player='old-player';PSET.opponent='old-opponent';PSET.playerSearch='old';resetUiForWorld()");
for(const key of ['team','player','opponent','color'])assert.equal(value('PSET.'+key),'ALL','new world retained old participant '+key);
assert.equal(value('PSET.playerSearch'),'');
run("PSET.color='BLUE';PSET.prepTeam='old-rival';resetUiForWorld()");
assert.equal(value('PSET.color'),'ALL','new world retained old side selection');
assert.equal(value('PSET.prepTeam'),'AUTO','new world retained selected preparation rival');
for(const expression of ['LAST','LASTSER','OPEN_P','SQUAD_EDIT','MC.res','SSET.view'])assert.equal(value(expression),null,expression+' must be reset on world replacement');
assert.equal(value('MSG'),'');
assert.equal(value('VIEW'),'match','world replacement does not silently navigate');

for (const [path,obsolete] of Object.entries({
  'app.js':["let DB=null, LAST", "function navKeepScroll(", "function nav(", "let SSET="],
  'ui-match.js':["let SEL=", "let LIVE="],
  'ui-market.js':["let MK="],
  'ui-roster.js':["let MC="],
  'ui-patch.js':["let PSET="],
  'ui-draft.js':["let DRAFT_UI="]
})){
  const code=await readFile(resolve(root,path),'utf8');
  for(const marker of obsolete)assert(!code.includes(marker),'duplicated UI state/router in '+path+': '+marker);
}
const app=await readFile(resolve(root,'app.js'),'utf8');
assert(app.includes("b.onclick=()=>navigateTo(b.dataset.v)"),'navigation buttons must use the common route');
const data=await readFile(resolve(root,'ui-data.js'),'utf8');
assert(data.includes("saveDB();navigateTo('season')"),'slot switches must route through the common controller');
console.log('Stage 11.5/6-1 UI routing/state acceptance: PASS (routes, tab state, scroll races, state reset, ownership)');
