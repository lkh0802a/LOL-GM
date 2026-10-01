// Stage 11.5/6-2: single overlay/keyboard owner acceptance.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { UI_MODULES } from './artifact-modules.mjs';

const root=resolve(import.meta.dirname,'..','src','artifact');
const source=await readFile(resolve(root,'ui-overlay.js'),'utf8');
assert.equal(UI_MODULES.filter(name=>name==='ui-overlay.js').length,1);
assert(UI_MODULES.indexOf('ui-season.js')<UI_MODULES.indexOf('ui-overlay.js'));
assert(UI_MODULES.indexOf('ui-overlay.js')<UI_MODULES.indexOf('app.js'));

let active=null;
const listeners=[];
function element(id='',dataset={}){
  return {id,dataset,hidden:false,isConnected:true,inert:false,
    focus(){active=this},
    getClientRects(){return this.hidden?[]:[{}]},
    closest(selector){return selector==='[hidden],[inert]'&&this.hidden?this:null},
    setAttribute(name,value){this[name]=value}};
}
const trigger=element('series-trigger'),navButton=element('current-nav');
const header=element('header'),nav=element('nav'),main=element('main');
const overlay=element('overlay');
overlay.hidden=true;
overlay.children=[];
Object.defineProperty(overlay,'innerHTML',{
  get(){return this.markup||''},
  set(markup){
    for(const el of this.children)el.isConnected=false;
    this.markup=markup;this.children=[];
    const tag=/<(button|input|select|textarea|a)\b([^>]*)>/g;
    for(const match of markup.matchAll(tag)){
      const attrs=match[2],id=/\bid="([^"]+)"/.exec(attrs)?.[1]||'';
      const data={};
      for(const attr of attrs.matchAll(/\bdata-([\w-]+)="([^"]+)"/g)){
        const key=attr[1].replace(/-([a-z])/g,(_,c)=>c.toUpperCase());
        data[key]=attr[2];
      }
      const el=element(id,data);
      el.disabled=/\sdisabled(?:\s|>|$)/.test(attrs);
      if(!el.disabled)this.children.push(el);
    }
  }
});
overlay.querySelectorAll=()=>overlay.children;
overlay.querySelector=selector=>{
  if(selector.startsWith('#'))return overlay.children.find(el=>el.id===selector.slice(1))||null;
  if(selector==='[data-choice-kind]')return overlay.children.find(el=>el.dataset.choiceKind!==undefined)||null;
  return null;
};
overlay.contains=el=>el===overlay||overlay.children.includes(el);
const document={
  get activeElement(){return active},
  querySelector(selector){return {'#overlay':overlay,'header':header,nav,'#main':main,'nav button[aria-current="page"]':navButton}[selector]||null},
  addEventListener(type,fn){listeners.push([type,fn])}
};
const bodyClasses=new Set();
document.body={classList:{add(name){bodyClasses.add(name)},remove(name){bodyClasses.delete(name)}}};
active=trigger;
let scrollEnhancements=0;
const context=vm.createContext({document,uiEnhanceScrollRegions(root){
  assert.equal(root,overlay);scrollEnhancements++;
}});
vm.runInContext(source,context,{filename:'ui-overlay.js'});
const execute=code=>vm.runInContext(code,context);
assert.equal(listeners.length,1,'exactly one overlay keyboard listener');
assert.equal(listeners[0][0],'keydown');
const keydown=(key,shiftKey=false)=>{
  const event={key,shiftKey,prevented:false,stopped:false,
    preventDefault(){this.prevented=true},stopPropagation(){this.stopped=true}};
  listeners[0][1](event);
  return event;
};

execute("openUiOverlay({kind:'series',label:'경기 기록',html:'<button id=\"ovclose\">닫기</button><button id=\"next\">다음</button>',dismissible:true})");
assert.equal(overlay.hidden,false);
assert.equal(overlay['aria-label'],'경기 기록');
assert.equal(active.id,'ovclose','first control must receive initial focus');
assert(header.inert&&nav.inert&&main.inert,'background must be inert');
assert(bodyClasses.has('lock'),'body scroll must lock while dialog is open');
overlay.children[1].focus();
assert(keydown('Tab').prevented,'Tab at final control must be trapped');
assert.equal(active.id,'ovclose');
assert(keydown('Tab',true).prevented,'Shift+Tab at first control must be trapped');
assert.equal(active.id,'next');
assert(keydown('Escape').prevented,'Escape must be handled once');
assert.equal(overlay.hidden,true);
assert.equal(active,trigger,'closing a report must restore the opener');
assert(!header.inert&&!nav.inert&&!main.inert&&!bodyClasses.has('lock'));

execute("openUiOverlay({kind:'selection',label:'세트 선택권',html:'<button data-choice-kind=\"side\" data-choice-value=\"blue\">블루</button><button data-choice-kind=\"side\" data-choice-value=\"red\">레드</button>',dismissible:false,focusSelector:'[data-choice-kind]'})");
assert.equal(active.dataset.choiceValue,'blue');
assert.equal(keydown('Escape').prevented,true);
assert.equal(overlay.hidden,false,'official selection must ignore Escape');
assert.equal(execute('closeUiOverlay()'),false,'locked overlay cannot close without force');
overlay.children[1].focus();
execute("openUiOverlay({kind:'draft',label:'공식 밴픽',html:'<input id=\"du-search\"><button id=\"du-lock\">확정</button>',dismissible:false,focusSelector:'#du-search'})");
assert.equal(active.id,'du-search','new official phase must get accessible initial focus');
assert.equal(keydown('Escape').prevented,true);
assert.equal(overlay.hidden,false,'official draft cannot dismiss on Escape');
overlay.children[1].focus();
execute("refreshUiOverlay('<input id=\"du-search\"><button id=\"du-lock\">확정</button>',{focusSelector:'#du-search'})");
assert.equal(active.id,'du-lock','rerenders must restore focus to the same command');
execute("refreshUiOverlay('<button id=\"du-finish\">경기 진행</button>',{focusSelector:'#du-finish'})");
assert.equal(active.id,'du-finish','completed draft must focus its finishing command');
assert.equal(execute('closeUiOverlay({force:true})'),true,'explicit official completion may force close');
assert.equal(active,trigger,'selection-to-draft transition must preserve original opener');

execute("openUiOverlay({kind:'practice',label:'연습',html:'<button id=\"cancel\">닫기</button>',dismissible:true})");
assert.equal(execute('closeUiOverlay()'),true);
assert.equal(active,trigger);
trigger.isConnected=false;
execute("openUiOverlay({kind:'practice',label:'연습',html:'',dismissible:true})");
assert.equal(active,overlay,'focus must stay inside even when no active controls exist');
assert(keydown('Tab').prevented,'empty dialog must trap keyboard focus');
execute("closeUiOverlay()");
assert.equal(active,navButton,'removed opener falls back to the active navigation tab');

const draft=await readFile(resolve(root,'ui-draft.js'),'utf8');
const season=await readFile(resolve(root,'ui-season.js'),'utf8');
const shell=await readFile(resolve(root,'shell.html'),'utf8');
for(const marker of ["kind:'draft'","kind:'selection'","dismissible:false","closeUiOverlay({force:true,restoreFocus:false})",'refreshUiOverlay(markup']){
  assert(draft.includes(marker),'draft modal integration missing: '+marker);
}
assert(season.includes("kind:'series'")&&season.includes('function closeOv(){closeUiOverlay()}'));
assert(shell.includes('id="overlay" hidden role="dialog" aria-modal="true"')&&shell.includes('tabindex="-1"'));
for(const [name,code] of [['ui-draft.js',draft],['ui-season.js',season]]){
  assert(!code.includes("document.addEventListener('keydown'"),'duplicate keydown owner in '+name);
  assert(!code.includes("document.body.classList.add('lock')"),'duplicated dialog lifecycle in '+name);
  assert(!code.includes("ov.hidden=false"),'direct overlay writes in '+name);
}
assert(scrollEnhancements>0,'overlay must use its required scroll enhancement dependency');
console.log('Stage 11.5/6-2 overlay acceptance: PASS (report, practice, official lock, focus trap/return, render refresh, modal ownership)');
