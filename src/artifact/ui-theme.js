// ===== 화면 색상 설정: current render and existing local preference only =====
function applyStartupTheme(value){
  if(!['auto','dark','light'].includes(value))return false;
  document.documentElement.setAttribute('data-theme',value);
  try{localStorage.setItem('lol-gm-theme',value);return true}catch(e){return false}
}
function bindAppThemePreference(theme,render){
  let value='auto';try{value=localStorage.getItem('lol-gm-theme')||'auto'}catch(e){}
  theme.value=['auto','dark','light'].includes(value)?value:'auto';
  document.documentElement?.setAttribute('data-theme',theme.value);
  const db=DB,slot=SLOT;
  theme.onchange=()=>{
    if(DB!==db||SLOT!==slot||UI_RENDER_ID!==render||SLOT_SWITCHING||document.querySelector('#app-theme')!==theme)return;
    const ok=applyStartupTheme(theme.value),status=document.querySelector('#app-theme-status');
    if(status){status.textContent=ok?'':'현재 화면에 적용했습니다. 설정 저장은 실패했습니다.';status.hidden=ok}
  };
}
