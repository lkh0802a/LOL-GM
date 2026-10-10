// Initial recruitment filters read the same observed metrics as candidate detail.
function initialCandidateRoles(s){return (s.roles?.length?s.roles:s.role&&s.role!=='ALL'?[s.role]:[]).filter(r=>ROLES.includes(r))}
function initialMetricConditions(s){
 const rows=[];let valid=true;
 for(const [key,bounds] of Object.entries(s.metricFilters||{})){
  if(!Object.hasOwn(INITIAL_COMPARE_METRICS,key)||!bounds||typeof bounds!=='object'){valid=false;continue}
  const min=bounds.min===''||bounds.min==null?null:Number(bounds.min),max=bounds.max===''||bounds.max==null?null:Number(bounds.max);
  if([min,max].some(x=>x!==null&&(!Number.isInteger(x)||x<1||x>99))||min!==null&&max!==null&&min>max){valid=false;continue}
  if(min!==null||max!==null)rows.push({key,min,max});
 }
 return {valid,rows};
}
function initialCandidateMetrics(view,row){return row.metrics||(row.metrics=observedPlayerCoreMetrics(view,row.p))}
function initialCandidateMetricMatch(view,row,conditions){return conditions.valid&&conditions.rows.every(({key,min,max})=>{const value=initialCandidateMetrics(view,row)[key];return Number.isFinite(value)&&(min===null||value>=min)&&(max===null||value<=max)})}
function initialPositionFilters(){const roles=initialCandidateRoles(INITMK);return `<fieldset class="initial-position-filter"><legend>포지션 · 여러 개 선택</legend>${ROLES.map(r=>`<label><input type="checkbox" id="init-role-${r}" data-init-role="${r}"${roles.includes(r)?' checked':''}>${ROLE_KO[r]}</label>`).join('')}<button class="linklike" id="init-role-all" type="button">전체</button></fieldset>`}
function initialMetricFilterControls(){
 const draft=INITMK.metricDraft||INITMK.metricFilters||{};
 return `<details id="init-metric-filters"><summary>능력 조건${initialMetricConditions(INITMK).rows.length?' · '+initialMetricConditions(INITMK).rows.length+'개 적용':''}</summary><p class="hint">현재 관측 추정치 (1–99). 여러 조건을 모두 충족한 후보를 찾습니다. 빈칸은 제한 없음이며, 설정한 지표의 정보가 없으면 제외합니다.</p><div class="scroll"><table class="initial-metric-filter"><thead><tr><th>지표</th><th>최소</th><th>최대</th></tr></thead><tbody>${Object.entries(INITIAL_COMPARE_METRICS).map(([key,label])=>`<tr><th scope="row">${label}</th>${['min','max'].map(bound=>`<td><input type="number" min="1" max="99" step="1" id="init-metric-${key}-${bound}" data-init-metric="${key}" data-bound="${bound}" value="${esc(draft[key]?.[bound]??'')}" aria-label="${label} ${bound==='min'?'최소':'최대'} 추정치"></td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="controls"><button id="init-metric-apply" type="button">능력 조건 적용</button><button id="init-metric-cancel" class="linklike" type="button">입력 취소</button><button id="init-metric-clear" class="linklike" type="button">능력 조건 초기화</button></div></details>`;
}
function bindInitialCandidateFilters(current,refresh){
 document.querySelectorAll('[data-init-role]').forEach(el=>el.onchange=()=>{if(!current()||!ROLES.includes(el.dataset.initRole))return;const roles=initialCandidateRoles(INITMK);INITMK.role='ALL';INITMK.roles=el.checked?[...new Set([...roles,el.dataset.initRole])]:roles.filter(r=>r!==el.dataset.initRole);INITMK.page=0;refresh(el.id)});
 const all=document.getElementById('init-role-all');if(all)all.onclick=()=>{if(!current())return;INITMK.role='ALL';INITMK.roles=[];INITMK.page=0;refresh(all.id)};
 const inputs=[...document.querySelectorAll('[data-init-metric]')],read=()=>{const draft={};for(const el of inputs){draft[el.dataset.initMetric]||={min:'',max:''};draft[el.dataset.initMetric][el.dataset.bound]=el.value}return draft};
 for(const el of inputs)el.oninput=()=>{if(current()){el.setCustomValidity('');INITMK.metricDraft=read()}};
 const apply=document.getElementById('init-metric-apply');if(apply)apply.onclick=()=>{if(!current())return;for(const el of inputs)if(!el.reportValidity())return;const draft=read();for(const [key,bounds] of Object.entries(draft)){if(!initialMetricConditions({metricFilters:{[key]:bounds}}).valid){const el=inputs.find(x=>x.dataset.initMetric===key&&x.dataset.bound==='max');el.setCustomValidity('최대값은 최소값 이상이어야 합니다');el.reportValidity();return}}INITMK.metricFilters=draft;INITMK.metricDraft=JSON.parse(JSON.stringify(draft));INITMK.page=0;refresh(apply.id)};
 for(const kind of ['cancel','clear']){const el=document.getElementById('init-metric-'+kind);if(el)el.onclick=()=>{if(!current())return;if(kind==='clear'){INITMK.metricFilters={};INITMK.page=0}INITMK.metricDraft=JSON.parse(JSON.stringify(INITMK.metricFilters||{}));refresh(el.id)}}
}

function initialCandidateGuard(){
 const db=DB,world=DB.world,target=INITMK.target,state=INITMK,manager=DB.manager,team=DB.teams[target],slot=typeof SLOT==='undefined'?null:SLOT,render=typeof UI_RENDER_ID==='undefined'?null:UI_RENDER_ID,view=typeof VIEW==='undefined'?null:VIEW,date=DB.worldDate,year=DB.year;return (next=render)=>DB===db&&DB.world===world&&DB.manager===manager&&DB.teams[target]===team&&INITMK===state&&INITMK.target===target&&(typeof SLOT==='undefined'?null:SLOT)===slot&&(typeof UI_RENDER_ID==='undefined'?null:UI_RENDER_ID)===next&&(typeof VIEW==='undefined'?null:VIEW)===view&&DB.worldDate===date&&DB.year===year&&initialCandidateAllowed(DB,DB.teams[target]);
}
