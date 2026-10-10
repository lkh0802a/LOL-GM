// Presentation-only roster controls. Never persist, rebase or submit preparation.
let SQUAD_TABLE={};
function squadTableState(){
  const s=SQUAD_TABLE;if(s.db!==DB||s.world!==DB.world||s.manager!==DB.manager||s.team!==DB.manager?.teamId||s.slot!==SLOT||s.mode!==DB.world?.manage||s.fired!==DB.world?.fired)SQUAD_TABLE={db:DB,world:DB.world,manager:DB.manager,team:DB.manager?.teamId,slot:SLOT,mode:DB.world?.manage,fired:DB.world?.fired,teams:{}};
  return SQUAD_TABLE.teams[SQUAD]||(SQUAD_TABLE.teams[SQUAD]={roles:[],q:'',draftQ:'',page:0,columns:['선발·역할','회복·상태','평가','계약','세부 능력'],visible:[],total:0});
}
function squadTableGuard(){
  const db=DB,world=DB.world,manager=DB.manager,team=DB.manager?.teamId,slot=SLOT,view=VIEW,render=UI_RENDER_ID,squad=SQUAD,date=DB.worldDate,year=DB.year,mode=world?.manage,fired=world?.fired;
  return ()=>DB===db&&DB.world===world&&DB.manager===manager&&DB.manager?.teamId===team&&SLOT===slot&&VIEW===view&&UI_RENDER_ID===render&&SQUAD===squad&&DB.worldDate===date&&DB.year===year&&world?.manage===mode&&world?.fired===fired&&!SLOT_SWITCHING&&!UI_OVERLAY;
}
function squadTableRows(rows,status=null){
  const s=squadTableState(),q=s.q.trim().toLocaleLowerCase();
  const filtered=rows.filter(p=>(!s.roles.length||s.roles.includes(p.role))&&(!q||p.name.toLocaleLowerCase().includes(q))&&(!status||squadStatusMatches(status.rows[p.id],s.statuses)));
  s.total=filtered.length;s.page=Math.max(0,Math.min(s.page,Math.max(0,Math.ceil(s.total/20)-1)));
  const visible=filtered.slice(s.page*20,s.page*20+20);s.visible=visible.map(p=>p.id);return visible;
}
function renderSquadTableControls(mineOrg=false,status=null){
  const s=squadTableState();return `<div class="controls"><label>선수 이름 <input id="sqtq" type="search" value="${esc(s.draftQ)}" placeholder="이름 검색"></label><button id="sqtsearch" type="button">검색 적용</button><button id="sqtclear" class="ghost" type="button">필터 초기화</button></div><details id="sqtoptions"${s.controlsOpen?' open':''}><summary>포지션 · 상태 · 표시 열</summary>${squadStatusControls(status)}<fieldset><legend>포지션 · 복수 선택</legend>${ROLES.map(r=>`<label><input type="checkbox" data-sqt-role="${r}"${s.roles.includes(r)?' checked':''}>${ROLE_KO[r]}</label>`).join(' ')}</fieldset><fieldset><legend>표시 열 · 복수 선택</legend>${(mineOrg?['선발·역할','회복·상태','평가','계약','세부 능력']:['평가','계약','세부 능력']).map(g=>`<label><input type="checkbox" data-sqt-column="${g}"${s.columns.includes(g)?' checked':''}>${g}</label>`).join(' ')}</fieldset></details>`;
}
function renderSquadTablePager(){const s=squadTableState();return `<div class="controls" aria-label="선수단 페이지"><button id="sqtprev" class="ghost" type="button"${s.page?'':' disabled'}>이전</button><span role="status">${s.total}명 · ${s.page+1}/${Math.max(1,Math.ceil(s.total/20))}페이지 · 페이지당 최대 20명</span><button id="sqtnext" class="ghost" type="button"${(s.page+1)*20<s.total?'':' disabled'}>다음</button></div>`}
function squadTableColumnGroup(label){
  if(['경기 슬롯','훈련 선발 초안','공식 등록','공식 선발 · 저장 / 경기뷰','훈련 · 현재 / 초안','역할'].includes(label))return '선발·역할';
  if(['의료 가용','회복 계획','만족도','폼','컨디션','경기 감각','피로','사기'].includes(label))return '회복·상태';
  if(['종합','종합 추정','성장 여지','잠재 추정','명성','시장가치','시장가치 추정'].includes(label))return '평가';
  if(['연봉','계약'].includes(label))return '계약';
  if(Object.values(GROUP_KO).includes(label))return '세부 능력';return null;
}
function squadTableBack(){return '<button type="button" id="sqtback" class="ghost">선수단 목록으로</button>'}
function bindSquadTableControls(root=document){
  // Minimal legacy fixtures without this surface do not acquire presentation state.
  const query=root.querySelector('#sqtq');if(!query)return;
  const s=squadTableState(),current=squadTableGuard(),refresh=selector=>{const y=window.scrollY;s.controlsOpen=root.querySelector('#sqtoptions')?.open??s.controlsOpen;nav();window.scrollTo(0,y);document.querySelector(selector)?.focus?.({preventScroll:true})};
  const options=root.querySelector('#sqtoptions');options.ontoggle=()=>{if(current())s.controlsOpen=options.open};
  const back=root.querySelector('#sqtback');if(back)back.onclick=()=>{if(!current())return;OPEN_P=null;refresh('#sqtq')};
  query.oninput=()=>{if(current())s.draftQ=query.value};
  const search=()=>{if(!current())return;s.draftQ=query.value;s.q=query.value;s.page=0;refresh('#sqtq')};
  query.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();search()}};root.querySelector('#sqtsearch').onclick=search;
  root.querySelector('#sqtclear').onclick=()=>{if(!current())return;s.roles=[];s.statuses=[];s.q='';s.draftQ='';s.page=0;refresh('#sqtclear')};
  root.querySelectorAll('[data-sqt-role]').forEach(el=>el.onchange=()=>{if(!current()||!ROLES.includes(el.dataset.sqtRole))return;s.roles=el.checked?[...new Set([...s.roles,el.dataset.sqtRole])]:s.roles.filter(r=>r!==el.dataset.sqtRole);s.page=0;refresh(`[data-sqt-role="${el.dataset.sqtRole}"]`)});
  root.querySelectorAll('[data-sqt-column]').forEach(el=>el.onchange=()=>{if(!current()||!['선발·역할','회복·상태','평가','계약','세부 능력'].includes(el.dataset.sqtColumn))return;s.columns=el.checked?[...new Set([...s.columns,el.dataset.sqtColumn])]:s.columns.filter(g=>g!==el.dataset.sqtColumn);refresh(`[data-sqt-column="${el.dataset.sqtColumn}"]`)});
  for(const [id,delta] of [['sqtprev',-1],['sqtnext',1]]){const el=root.querySelector('#'+id);el.onclick=()=>{if(!current()||el.disabled)return;s.page+=delta;refresh('#'+id)}}
  bindSquadStatusFilters(root,refresh,current);
  const table=root.querySelector('[data-squad-roster]');if(table){const groups=[...table.querySelectorAll('thead th')].map(th=>squadTableColumnGroup(th.textContent));table.querySelectorAll('tr').forEach(row=>[...row.children].forEach((cell,i)=>{cell.hidden=!!groups[i]&&!s.columns.includes(groups[i])}))}
}
