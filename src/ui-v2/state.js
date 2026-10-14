// 새 화면 상태. 기존 UI 모듈/렌더러/이벤트 바인딩을 불러오지 않는다.
const V2_STORE='lol-gm-ui-v2-world';
const V2={db:null,worldDraft:null,section:'home',tab:'대시보드',pid:null,q:'',role:'ALL',scope:'region',page:0,target:null,revision:0,message:'',review:null,drafts:{},read:{},mode:'dark',saved:false,busy:false};
const v2Esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const v2Money=value=>{
 if(!Number.isFinite(value))return '정보 없음';
 const n=Math.round(Math.abs(value)*1e8),big=Math.floor(n/1e8),man=Math.floor(n%1e8/1e4),rest=n%1e4;
 const pieces=[big?big.toLocaleString('ko-KR')+'억':'',man?man.toLocaleString('ko-KR')+'만':'',rest?rest.toLocaleString('ko-KR'):''].filter(Boolean);
 return (value<0?'-':'')+(pieces.join(' ')||'0')+' 원';
};
const v2Team=()=>V2.db&&managedTeam(V2.db);
function v2ReadView(){const db=V2.db;if(!db)return null;const view=Object.create(db);view.scout=JSON.parse(JSON.stringify(db.scout||{}));view.world={...db.world,recruitment:JSON.parse(JSON.stringify(db.world?.recruitment||{}))};return view;}
function v2Guard(){const db=V2.db,w=db?.world,manager=db?.manager,owner=db&&managedTeamId(db),date=db?.worldDate,phase=w?.phase,revision=V2.revision;return ()=>V2.db===db&&db?.world===w&&db?.manager===manager&&(!db||managedTeamId(db)===owner)&&db?.worldDate===date&&w?.phase===phase&&V2.revision===revision&&!V2.busy;}
function v2ManualError(){const db=V2.db,t=v2Team();return !db?.world||!t||db.world.fired||db.world.manage!=='manual'?'현재 감독의 수동 권한이 없습니다':db.world.pendingOfficial?'진행 중인 공식 경기의 준비를 먼저 확인하세요':null;}
function v2Save(){
 try{localStorage.setItem(V2_STORE,JSON.stringify({game:packDB(V2.db),read:V2.read}));V2.saved=true;document.getElementById('save-status').textContent='현재 게임 저장 완료';return true}
 catch(error){V2.saved=false;document.getElementById('save-status').textContent='저장하지 못했습니다 · 설정에서 파일로 저장하세요';return false}
}
function v2Tell(message){V2.message=String(message||'');document.getElementById('status').textContent=V2.message;}
function v2Mutate(action){const error=v2ManualError();if(error)return v2Tell(error);try{const result=action();v2Tell(typeof result==='string'?result:result?.msg||'처리했습니다');v2Save();v2Render()}catch(error){v2Tell(error.message)}}
function v2Bind(selector,fn,root=document){const current=v2Guard();root.querySelectorAll(selector).forEach(el=>el.onclick=e=>{if(!current()||!el.isConnected||el.disabled)return;e.preventDefault();fn(el,e)});}
function v2Navigate(section,tab=null,pid=null){
 const menu=V2_MENUS.find(x=>x.id===section);if(!menu)return;
 v2CaptureDrafts();V2.section=section;V2.tab=menu.tabs.includes(tab)?tab:menu.tabs[0];V2.pid=pid;V2.review=null;V2.page=0;
 const path='#'+[section,encodeURIComponent(V2.tab),pid?encodeURIComponent(pid):''].filter(Boolean).join('/');
 if(location.hash!==path)history.pushState(null,'',path);v2Render();document.getElementById('app-title').focus({preventScroll:true});window.scrollTo(0,0);
}
function v2Route(){const [section,tab,pid]=location.hash.slice(1).split('/');let t,p;try{t=decodeURIComponent(tab||'');p=pid?decodeURIComponent(pid):null}catch{return}if(V2_MENUS.some(x=>x.id===section)){const m=V2_MENUS.find(x=>x.id===section);V2.section=section;V2.tab=m.tabs.includes(t)?t:m.tabs[0];V2.pid=p;V2.review=null;v2Render()}}
