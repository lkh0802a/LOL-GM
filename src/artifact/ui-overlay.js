// ===== LOL GM: single owner for dialog lifecycle, keyboard and focus =====
// Dialog state is transient and is never written into the world/save payload.
let UI_OVERLAY=null;
const UI_OVERLAY_FOCUSABLE='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
function uiOverlayRoot(){
  const root=document.querySelector('#overlay');
  if(!root)throw new Error('Overlay container missing');
  return root;
}
function uiOverlayFocusables(root){
  return [...root.querySelectorAll(UI_OVERLAY_FOCUSABLE)].filter(el=>!el.hidden&&!el.closest('[hidden],[inert]')&&el.getClientRects().length>0);
}
function uiOverlayFocusKey(el){
  if(!el)return null;
  if(el.id)return {id:el.id};
  const keys=['duChamp','duRole','duInfo','duAdvice','choiceKind','choiceValue'];
  const data=keys.filter(k=>el.dataset?.[k]!==undefined).map(k=>[k,el.dataset[k]]);
  return data.length?{data}:null;
}
function uiOverlayRestoreTarget(controls,key){
  if(!key)return null;
  if(key.id)return controls.find(el=>el.id===key.id)||null;
  return controls.find(el=>key.data.every(([k,v])=>el.dataset?.[k]===v))||null;
}
function uiOverlayFocus(root,preferred,key){
  const controls=uiOverlayFocusables(root);
  const pref=preferred?root.querySelector(preferred):null;
  const target=uiOverlayRestoreTarget(controls,key)||
    (pref&&controls.includes(pref)?pref:null)||controls[0]||root;
  target.focus();
}
function uiOverlayBackground(inert){
  for(const selector of ['header','nav','#main']){
    const element=document.querySelector(selector);
    if(element)element.inert=inert;
  }
}
function openUiOverlay({kind,label,html,dismissible=false,onDismiss=null,focusSelector=null}){
  const root=uiOverlayRoot(),previous=UI_OVERLAY;
  // Replacing the selection prompt with the next official draft keeps the original opener.
  const opener=previous?previous.opener:document.activeElement;
  UI_OVERLAY={kind,label,dismissible,onDismiss,opener};
  root.hidden=false;
  root.setAttribute('aria-label',label);
  root.innerHTML=html;
  uiEnhanceScrollRegions(root);
  document.body.classList.add('lock');
  uiOverlayBackground(true);
  uiOverlayFocus(root,focusSelector);
}
function refreshUiOverlay(html,{label=null,focusSelector=null}={}){
  if(!UI_OVERLAY)throw new Error('Cannot refresh a closed overlay');
  const root=uiOverlayRoot();
  const current=document.activeElement;
  const key=root.contains(current)?uiOverlayFocusKey(current):null;
  if(label!==null){UI_OVERLAY.label=label;root.setAttribute('aria-label',label)}
  root.innerHTML=html;
  uiEnhanceScrollRegions(root);
  uiOverlayFocus(root,focusSelector,key);
}
function closeUiOverlay({force=false,restoreFocus=true}={}){
  if(!UI_OVERLAY||(!force&&!UI_OVERLAY.dismissible))return false;
  const root=uiOverlayRoot(),opener=UI_OVERLAY.opener;
  UI_OVERLAY=null;
  root.hidden=true;root.innerHTML='';root.setAttribute('aria-label','시리즈 상세');
  document.body.classList.remove('lock');
  uiOverlayBackground(false);
  if(restoreFocus){
    if(opener?.isConnected&&!opener.closest('[inert]')&&typeof opener.focus==='function')opener.focus();
    else document.querySelector('nav button[aria-current="page"]')?.focus();
  }
  return true;
}
function uiOverlayKeydown(event){
  if(!UI_OVERLAY)return;
  const root=uiOverlayRoot();
  if(event.key==='Escape'){
    event.preventDefault();event.stopPropagation();
    if(UI_OVERLAY.dismissible){
      if(UI_OVERLAY.onDismiss)UI_OVERLAY.onDismiss();
      else closeUiOverlay();
    }
    return;
  }
  if(event.key!=='Tab')return;
  const controls=uiOverlayFocusables(root),first=controls[0],last=controls[controls.length-1],current=document.activeElement;
  if(!first){event.preventDefault();root.focus();return}
  if(event.shiftKey?(current===first||current===root||!root.contains(current)):
    (current===last||current===root||!root.contains(current))){
    event.preventDefault();
    (event.shiftKey?last:first).focus();
  }
}
document.addEventListener('keydown',uiOverlayKeydown);
