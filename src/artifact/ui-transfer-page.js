// Contextual recruitment screen; saved phase and existing writers retain authority.
function transferTabAllowed(){return !!DB?.world&&!DB.world.fired&&!!managedTeam(DB)&&['initial_roster','offseason','market'].includes(DB.world.phase)}
function syncTransferTab(){
 const box=document.querySelector('#app-nav > div');if(!box||typeof document.createElement!=='function')return;
 let b=box.querySelector('[data-v="transfer"]');if(!b&&transferTabAllowed()){b=document.createElement('button');b.type='button';b.dataset.v='transfer';b.textContent='이적시장';box.querySelector('[data-v="squad"]')?.after(b)}
 if(b){b.hidden=!transferTabAllowed();b.onclick=()=>{if(transferTabAllowed())navigateTo('transfer')}}
}
function initialScreenRoute(){
 syncTransferTab();if(typeof START_UI!=='undefined'&&START_UI.active)return {render:viewStartup,bind:bindStartup};
 return VIEW==='transfer'?{render:renderTransferPage,bind:bindTransferPage}:UI_ROUTES[VIEW];
}
function renderTransferEntry(){return transferTabAllowed()?'<p><button type="button" class="linklike" id="open-transfer">이적시장 열기</button></p>':''}
function bindTransferEntry(current){const b=document.querySelector('#open-transfer');if(b)b.onclick=()=>{if(current()&&transferTabAllowed())navigateTo('transfer')}}
function renderInitialSetupHome(){return `<section class="teamhead"><h2>첫 시즌 준비</h2><p>선수를 영입하고 선수단 구성을 확인하세요.</p></section><section class="controls"><button id="open-transfer" class="primary" type="button">이적시장</button><button id="initial-open-squad" type="button">선수단</button></section>`}
function bindInitialSetupHome(){const current=seasonUiGuard();bindTransferEntry(current);document.getElementById('initial-open-squad').onclick=()=>{if(current())navigateTo('squad')}}
function renderTransferPage(){
 if(!transferTabAllowed())return '<section><h2>이적시장</h2><p>현재 영입 화면을 열 수 없습니다. 일정·대회에서 현재 진행 상태를 확인하세요.</p></section>';
 if(DB.world.phase==='initial_roster')return renderInitialRosterMarket();
 if(DB.world.manage!=='manual')return '<section><h2>이적시장</h2><p>현재 구단 운영이 위임되어 있습니다. 일정·대회에서 운영 방식을 직접 선택하세요.</p></section>';
 const actual=DB;try{DB=JSON.parse(JSON.stringify(actual));return DB.world.phase==='market'?renderMarket():DB.world.contractWindow?renderStove()+renderContractWindow():'<section><h2>이적시장</h2><p>일정·대회에서 계약 협상 기간을 시작하세요.</p></section>'}finally{DB=actual}
}
function bindTransferPage(){
 if(!transferTabAllowed())return;if(DB.world.phase==='initial_roster'){bindInitialRosterMarket();return}
 if(DB.world.manage!=='manual')return;
 const current=seasonUiGuard();if(DB.world.phase==='market')bindMarket(current);else if(DB.world.contractWindow){bindStove(current);bindContractWindow(current);}
 const root=document.querySelector('#main');root?.querySelectorAll('button,input,select').forEach(el=>{for(const key of ['onclick','oninput','onchange','onkeydown']){const f=el[key];if(typeof f==='function')el[key]=function(e){if(current())return f.call(this,e)}}});
}
