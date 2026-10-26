// 새 화면 상태. 기존 UI 모듈/렌더러/이벤트 바인딩을 불러오지 않는다.
const V2_LIST_PAGE_SIZE=10;
const V2_STORE='lol-gm-ui-v2-world';
const V2={db:null,worldDraft:null,section:'home',tab:'대시보드',pid:null,q:'',role:'ALL',scope:'region',page:0,target:null,revision:0,message:'',review:null,drafts:{},read:{},mode:'dark',saved:false,busy:false};
const v2Esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const v2Money=value=>{
 if(!Number.isFinite(value))return '정보 없음';
 const n=Math.round(Math.abs(value)*1e8),big=Math.floor(n/1e8),man=Math.floor(n%1e8/1e4),rest=n%1e4;
 const pieces=[big?big.toLocaleString('ko-KR')+'억':'',man?man.toLocaleString('ko-KR')+'만':'',rest?rest.toLocaleString('ko-KR'):''].filter(Boolean);
 return (value<0?'-':'')+(pieces.join(' ')||'0')+' 원';
};
const v2Team=()=>V2.db&&!V2.db.world?.fired?managedTeam(V2.db):null;
function v2ReadView(){return V2.db?scoutingReadView(V2.db):null;}
function v2Guard(){const db=V2.db,w=db?.world,manager=db?.manager,owner=db&&managedTeamId(db),target=V2.target,date=db?.worldDate,phase=w?.phase,revision=V2.revision;return ()=>V2.db===db&&db?.world===w&&db?.manager===manager&&(!db||managedTeamId(db)===owner)&&V2.target===target&&db?.worldDate===date&&w?.phase===phase&&V2.revision===revision&&!V2.busy&&!V2.taskBackPending;}
function v2ManualError(){const db=V2.db,t=v2Team();return !db?.world||!t||db.world.fired||db.world.manage!=='manual'?'현재 감독의 수동 권한이 없습니다':db.world.pendingOfficial?'진행 중인 공식 경기의 준비를 먼저 확인하세요':null;}
function v2Save(){
 if(typeof v2PersistNative==='function')return v2PersistNative();
 try{localStorage.setItem(V2_STORE,JSON.stringify({game:packDB(V2.db),read:V2.read,view:{target:v2Target()?.id||null}}));V2.saved=true;document.getElementById('save-status').textContent='현재 게임 저장 완료';return true}
 catch(error){V2.saved=false;document.getElementById('save-status').textContent='저장하지 못했습니다 · 설정에서 파일로 저장하세요';return false}
}
function v2Tell(message){V2.message=String(message||'');document.getElementById('status').textContent=V2.message;const feedback=document.getElementById('work-feedback');if(feedback)feedback.textContent=V2.message;}
function v2Mutate(action){const error=v2ManualError();if(error)return v2Tell(error);try{const result=action();v2Tell(typeof result==='string'?result:result?.msg||'처리했습니다');v2Save();v2Render()}catch(error){v2Tell(error.message)}}
function v2Bind(selector,fn,root=document){const current=v2Guard();root.querySelectorAll(selector).forEach(el=>el.onclick=e=>{if(!current()||!el.isConnected||el.disabled)return;e.preventDefault();fn(el,e)});}
function v2Navigate(section,tab=null,pid=null,nid=null,comparison=null){
 const menu=V2_MENUS.find(x=>x.id===section);if(!menu)return;
 if(V2.official)V2.official.open=false;v2CaptureDrafts();v2RememberNegotiationList();v2RememberSearch();v2RememberSquad();v2RememberFacilities();if(V2.initialComparison){V2.initialComparison.comparison.open=comparison==='panel';V2.initialComparison.detailReturn=comparison==='detail';}V2.section=section;V2.tab=menu.tabs.includes(tab)?tab:menu.tabs[0];V2.pid=pid;V2.nid=nid;V2.advice=null;V2.review=null;V2.managementReview=null;V2.roleReview=null;v2RestoreSearch();
 const path='#'+[section,encodeURIComponent(V2.tab),pid?encodeURIComponent(pid):'',nid?encodeURIComponent(nid):''].join('/').replace(/\/+$/,'');
 if(location.hash!==path)history.pushState(null,'',path);v2Render();v2FocusLocation();
}
function v2Route(){const [section,tab,pid,nid]=location.hash.slice(1).split('/');let t,p,n;try{t=decodeURIComponent(tab||'');p=pid?decodeURIComponent(pid):null;n=nid?decodeURIComponent(nid):null}catch{return}if(V2_MENUS.some(x=>x.id===section)){const m=V2_MENUS.find(x=>x.id===section);if(V2.official)V2.official.open=false;v2RememberNegotiationList();v2RememberSearch();v2RememberSquad();v2RememberFacilities();if(V2.initialComparison){V2.initialComparison.comparison.open=false;V2.initialComparison.detailReturn=false;}V2.section=section;V2.tab=m.tabs.includes(t)?t:m.tabs[0];V2.pid=p;V2.nid=n;V2.advice=null;V2.review=null;V2.managementReview=null;V2.roleReview=null;v2RestoreSearch();v2Render();v2FocusLocation()}}
function v2SearchKey(){return ['market','scout'].includes(V2.section)&&['선수 검색','관심 선수','선수 탐색'].includes(V2.tab)?V2.section+'|'+V2.tab:null;}
function v2RememberSearch(){const key=v2SearchKey();if(!key||V2.pid||V2.initialComparison?.comparison.open)return;V2.searchViews??={};V2.searchViews[key]={db:V2.db,manager:V2.db?.manager,owner:V2.db&&managedTeamId(V2.db),target:v2Target()?.id,q:V2.q,role:V2.role,page:V2.page,scroll:window.scrollY||0,focus:document.activeElement?.getAttribute?.('data-player')||null};}
function v2CurrentSearchView(){const key=v2SearchKey(),s=key&&V2.searchViews?.[key];return V2.db&&s&&s.db===V2.db&&s.manager===V2.db.manager&&s.owner===managedTeamId(V2.db)&&s.target===v2Target()?.id?s:null;}
function v2RestoreSearch(){if(V2.section==='finance'&&V2.tab==='시설'){const s=V2.facilityListView;V2.returnScroll=!V2.pid&&s?.db===V2.db&&s.manager===V2.db?.manager&&s.team===managedTeamId(V2.db)?s.scroll:0;return;}if(V2.section==='squad'&&V2.tab==='선수 목록'){const s=V2.squadListView;V2.returnScroll=!V2.pid&&s?.db===V2.db&&s.manager===V2.db?.manager&&s.team===managedTeamId(V2.db)?s.scroll:0;return;}if(V2.section==='market'&&V2.tab==='진행 중인 협상'){const s=V2.negotiationListView;V2.returnScroll=!V2.nid&&s?.db===V2.db&&s.manager===V2.db.manager&&s.target===V2.target?s.scroll:0;return;}const s=v2CurrentSearchView();if(s){V2.q=s.q;V2.role=s.role;V2.page=s.page;V2.returnScroll=V2.pid?0:s.scroll;}else {V2.page=0;V2.returnScroll=0;}}
function v2FocusLocation(){if(V2.initialComparison?.comparison.open){document.getElementById('initial-comparison-title')?.focus({preventScroll:true});window.scrollTo(0,0);return;}const s=V2.squadListView,back=V2.section==='squad'&&V2.tab==='선수 목록'&&!V2.pid&&s?.db===V2.db&&s.manager===V2.db?.manager&&s.team===managedTeamId(V2.db)&&s.focus;const el=back&&[...document.querySelectorAll('[data-squad-player]')].find(el=>el.dataset.squadPlayer===s.focus);const f=V2.facilityListView,facilityBack=V2.section==='finance'&&V2.tab==='시설'&&!V2.pid&&f?.db===V2.db&&f.manager===V2.db?.manager&&f.team===managedTeamId(V2.db)&&f.focus,facilityEl=facilityBack&&[...document.querySelectorAll('[data-facility]')].find(el=>el.dataset.facility===f.focus);const search=!V2.pid&&v2CurrentSearchView(),candidate=search?.focus&&[...document.querySelectorAll('[data-player]')].find(el=>el.dataset.player===search.focus);(el||facilityEl||candidate||document.getElementById('app-title')).focus({preventScroll:true});window.scrollTo(0,V2.returnScroll||0);}

function v2RememberNegotiationList(){if(V2.section==='market'&&V2.tab==='진행 중인 협상'&&!V2.nid)V2.negotiationListView={db:V2.db,manager:V2.db?.manager,target:V2.target,scroll:window.scrollY||0};}

function v2RememberSquad(){if(V2.section==='squad'&&V2.tab==='선수 목록'&&!V2.pid)V2.squadListView={db:V2.db,manager:V2.db?.manager,team:V2.db&&managedTeamId(V2.db),scroll:window.scrollY||0,focus:document.activeElement?.getAttribute?.('data-squad-player')||null};}

function v2RememberFacilities(){if(V2.section==='finance'&&V2.tab==='시설'&&!V2.pid)V2.facilityListView={db:V2.db,manager:V2.db?.manager,team:V2.db&&managedTeamId(V2.db),scroll:window.scrollY||0,focus:document.activeElement?.getAttribute?.('data-facility')||null};}

// 파일/로컬 저장 모두 기존 복원·소속 검증을 끝낸 뒤 화면의 세계를 교체한다.
function v2ReadSavedGame(raw){
 const envelope=JSON.parse(raw);
 if(!saveObject(envelope))throw Error('유효한 게임 저장 객체가 아닙니다');
 const db=unpackDB(typeof envelope.game==='string'?envelope.game:raw);
 if(!db.world||!db.manager)throw Error('게임 진행 정보를 확인할 수 없습니다');
 const ids=new Set(Object.keys(db.players));for(const t of Object.values(db.teams))for(const id of t.roster)ids.add(id);
 const errors=worldActionScopeErrors(db,{type:'save.restore'},ids);
 if(errors.length)throw Error('선수 소속 저장 오류 · '+errors.slice(0,3).join(' · '));
 const owner=managedTeamId(db);if(owner&&!managedTeam(db))throw Error('저장된 관리 구단을 확인할 수 없습니다');
 const target=setupTeamsForManager(db).some(t=>t.id===envelope.view?.target)?envelope.view.target:null;
 const read=saveObject(envelope.read)?Object.fromEntries(Object.entries(envelope.read).filter(([,v])=>v===true)):{};
 return {db,read,target};
}
function v2InstallSavedGame(saved){
 Object.assign(V2,saved,{official:null,officialResult:null,searchViews:{},initialComparison:null,drafts:{},review:null,advice:null,nid:null,pid:null,preparation:null,managementReview:null,roleReview:null,staffDrafts:{},roleDrafts:{},medicalDrafts:{},squadListView:null,facilityListView:null,negotiationListView:null,taskReturn:null,taskHistory:null,taskBackPending:false,loadRequest:null,recordPage:0,recordReturn:null,sellerDrafts:{},transactionDrafts:{},scrimDraft:null,careerChoiceReturn:null});
}
async function v2LoadFile(file,current){
 if(!file||!current())return;
 const request={};V2.loadRequest=request;
 const active=()=>V2.loadRequest===request&&current();
 try{
  const raw=await file.text();if(!active())return;
  const saved=v2ReadSavedGame(raw);if(!active())return;
  const before={...V2},url=location.href,routeState=history.state;
  try{v2InstallSavedGame(saved);v2Navigate('home');}
  catch(error){
   for(const key of Object.keys(V2))delete V2[key];Object.assign(V2,before);
   history.replaceState(routeState,'',url);V2.loadRequest=null;v2Render();v2Tell('불러오기 실패 · '+error.message);return;
  }
  v2Tell(await v2Save()?'저장 파일을 불러왔습니다':'파일을 화면에 불러왔지만 기기에 저장하지 못했습니다 · 설정에서 파일로 보관하세요');
 }catch(error){if(active())v2Tell('불러오기 실패 · '+error.message);}
 finally{if(V2.loadRequest===request)V2.loadRequest=null;if(!V2.loadRequest&&V2.nativeRenderPending){V2.nativeRenderPending=false;v2Render();}}
}
