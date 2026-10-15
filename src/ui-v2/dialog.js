// 한 번에 하나의 집중 작업 창. 실제 계약·직원·경기 작성자는 각 분야 엔진에 둔다.
function v2OpenAdvice(nid){if(V2.review||V2.managementReview||V2.official?.open)return v2Tell('현재 작업 창을 먼저 닫으세요');if(nid&&!v2OwnedNegotiation(nid))return v2Tell('현재 협상을 다시 확인하세요');v2CaptureDrafts();V2.advice={db:V2.db,nid:nid||null,manager:V2.db.manager};v2Render();}
function v2TaskSpec(){
 if(V2.official?.open)return {key:'official',title:'공식 경기 준비',body:v2OfficialView()};
 if(V2.review)return {key:'contract:'+V2.review.nid,title:V2.review.mode==='final'?'최종 계약 검토':'제안 검토',body:v2ContractReviewView()};
 if(V2.managementReview)return {key:'management',title:V2.managementReview.title,body:v2ManagementReview()};
 if(V2.advice){const a=V2.advice,n=a.nid&&v2OwnedNegotiation(a.nid),valid=a.db===V2.db&&a.manager===V2.db.manager&&(!a.nid||n);return {key:'advice:'+a.nid,title:'구단 비서',body:valid?v2Assistant(n):'<p>현재 구단과 협상을 다시 확인하세요.</p>'};}
 return null;
}
function v2ClearTask(){v2CaptureDrafts();if(V2.official?.open)V2.official.open=false;else if(V2.review)V2.review=null;else if(V2.managementReview)V2.managementReview=null;else V2.advice=null;}
function v2CloseTask(){if(V2.taskBackPending)return;if(V2.taskHistory&&history.state?.v2Task===V2.taskHistory){V2.taskBackPending=true;history.back();return;}v2ClearTask();v2Render();}
function v2TaskBack(){if(!V2.taskHistory)return false;const token=V2.taskHistory;if(history.state?.v2Task===token)return false;V2.taskHistory=null;V2.taskBackPending=false;v2ClearTask();v2Render();return true;}
function v2RenderTaskDialog(){
 const dialog=document.getElementById('work-dialog'),content=document.getElementById('work-content'),spec=V2.db&&v2TaskSpec();
 if(!spec){if(V2.taskHistory){if(history.state?.v2Task===V2.taskHistory&&!V2.taskBackPending){V2.taskBackPending=true;history.back();}else if(history.state?.v2Task!==V2.taskHistory){V2.taskHistory=null;V2.taskBackPending=false;}}if(dialog.open)dialog.close();content.innerHTML='';if(V2.taskReturn){const r=V2.taskReturn;V2.taskReturn=null;if(r.db===V2.db){window.scrollTo(0,r.scroll);document.querySelector(r.selector)?.focus({preventScroll:true});}}return;}
 const opening=!dialog.open,scroll=dialog.scrollTop,focused=document.activeElement?.id,selection=document.activeElement?.selectionStart,positions=['.champion-grid','.fearless-list','.side-0 .pick-slots','.side-1 .pick-slots'].map(selector=>{const el=dialog.querySelector(selector);return [selector,el?.scrollLeft||0,el?.scrollTop||0]});
 if(opening)V2.taskMessageAtOpen=V2.message;
 if(opening)V2.taskReturn={db:V2.db,scroll:window.scrollY,selector:spec.key==='official'?'#official-open':spec.key.startsWith('contract:')?(V2.review.mode==='final'?'#review-final':'#review-offer'):spec.key.startsWith('advice:')?(V2.advice.nid?'#contract-advice':'#home-advice'):'#app-title'};
 dialog.dataset.task=spec.key;document.getElementById('work-dialog-title').textContent=spec.title;content.innerHTML=spec.body;document.getElementById('work-feedback').textContent=V2.message===V2.taskMessageAtOpen?'':V2.message;
 dialog.oncancel=e=>{e.preventDefault();v2CloseTask();};
 const close=document.getElementById('work-close');close.onclick=()=>v2CloseTask();
 if(opening){V2.taskHistory='work-'+V2.revision;history.pushState({v2Task:V2.taskHistory},'',location.href);dialog.showModal();document.getElementById('work-dialog-title').focus({preventScroll:true});}else {dialog.scrollTop=scroll;for(const [selector,left,top] of positions){const el=dialog.querySelector(selector);if(el){el.scrollLeft=left;el.scrollTop=top;}}if(focused&&dialog.contains(document.getElementById(focused))){const el=document.getElementById(focused);el.focus({preventScroll:true});if(Number.isInteger(selection)&&el.setSelectionRange)el.setSelectionRange(selection,selection);}}
}
