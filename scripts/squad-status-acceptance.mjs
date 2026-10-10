import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {artifactSources,compiledEngine} from './test-harness.mjs';
import vm from 'node:vm';
async function runStatusFixture(fixture,{timeout,setupSources}){
 const context=vm.createContext({console,Date,Math,JSON,Set,Map,WeakMap,Object,Array,String,Number,Boolean,RegExp,Error,Intl,performance,crypto});
 const start=performance.now(),remaining=()=>Math.max(1,timeout-(performance.now()-start));
 (await compiledEngine()).runInContext(context,{timeout:Math.ceil(remaining())});
 for(const source of setupSources)new vm.Script(source).runInContext(context,{timeout:Math.ceil(remaining())});
 const result=new vm.Script(fixture,{filename:'squad-status-independent.fixture.js'}).runInContext(context,{timeout:Math.ceil(remaining())});
 console.log('선수단 상태 독립 새 VM 1개·기존 러너89개 계수 보존');return result;
}
const archive=JSON.parse(gunzipSync(await readFile(new URL('../docs/evidence/squad-status-2026-10-09.raw.json.gz',import.meta.url))));
const originalPanel=Buffer.from(archive.find(r=>r.path==='original/src/artifact/ui-registration.js').base64,'base64').toString().replace('function officialRegistrationPanel(', 'function originalOfficialRegistrationPanel(');
const sources=await artifactSources(['ui-official-edit.js','ui-squad-status.js','ui-squad-table.js','ui-registration.js']);
const roster=await readFile(new URL('../src/artifact/ui-roster.js',import.meta.url),'utf8'),baseRoster=Buffer.from(archive.find(r=>r.path==='original/src/artifact/ui-roster.js').base64,'base64').toString();
const detail=s=>s.slice(s.indexOf('function squadObservedDetail('),s.indexOf('function squadEditState('));
sources.push(detail(roster),detail(baseRoster).replace('function squadObservedDetail(', 'function originalSquadObservedDetail('),"function playerDetail(p){starterFor(DB,DB.teams[p.team],'TOP');return p.id}");

await runStatusFixture(String.raw`(()=>{
 const check=(ok,msg)=>{if(!ok)throw Error('선수단 상태 '+msg)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:3,div2:true}),regionCfg('EU',{teams:2,div2:false,system:'franchise'})];cfg.internationals=[];
 DB=buildWorld(cfg);const [t,opponent]=activeTeams(DB,'NA',1),reserve=reserveTeamsOf(DB,t)[0];setManagedTeam(DB,t.id);
 DB.world={phase:'season',year:DB.year,manage:'manual',registrationVersion:1,seasons:{}};setWorldCalendarDate(DB,DB.year+'-01-10');
 for(const team of activeTeams(DB))for(const role of ROLES){const p=genPlayer(DB,new RNG(team.id+'status'+role),{region:team.region,role,age:22,base:65});signContract(DB,p,team,1,3,{});team.depthChart[role]=p.id}
 const spare=genPlayer(DB,new RNG('status-spare'),{region:'NA',role:'TOP',age:22,base:60});signContract(DB,spare,t,1,3,{});initializeOfficialRegistrations(DB);
 const edit={starters:{...t.depthChart,TOP:spare.id},rosterPlan:{assignments:Object.fromEntries(t.roster.map(id=>[id,t.id]))}};
 let before=JSON.stringify(DB),m=squadStatusModel(t,edit);check(JSON.stringify(DB)===before,'조회 순수성');
 check(m.rows[spare.id].changed&&m.rows[spare.id].draft[0]==='TOP'&&m.rows[spare.id].current.length===0,'훈련 현재/미적용 분리');
 const baseExpected=JSON.stringify(edit),old=t.depthChart.TOP;t.registration.depthChart={...t.depthChart};
 DB.players[old].medical={daysLeft:3.1,out:true,site:'wrist'};m=squadStatusModel(t,edit);check(m.rows[old].out&&m.rows[old].days===4&&m.rows[old].declared.includes('TOP')&&!m.rows[old].resolved.includes('TOP'),'의료 가용/저장 선발/보정 분리');
 DB.players[old].medical.daysLeft=0;check(!squadStatusModel(t,edit).rows[old].out,'잔여0일 outflag 출전 불가 아님');delete DB.players[old].medical;
 const moved=DB.players[t.depthChart.JGL];t.roster=t.roster.filter(x=>x!==moved.id);reserve.roster.push(moved.id);moved.team=reserve.id;
 m=squadStatusModel(t,edit);check(m.rows[moved.id].registered&&m.rows[moved.id].training===reserve.short,'훈련 소속과 공식 등록 분리');
 check(JSON.stringify(edit)===baseExpected,'초안 expected 재설정 없음');
 const cid='status-international';DB.competitions[cid]={id:cid,name:'가상 공식 국제대회',international:true,teams:[t.id,opponent.id],rules:{fearless:true},stages:[{id:'regular',name:'정규',type:'round_robin',legs:1,bestOf:1}]};
 const s=newSeason(DB,cid,DB.year,'status-official',DB.worldDate);s.key=cid;DB.world.seasons[cid]=s;s.entries={[t.id]:Object.values(t.depthChart),[opponent.id]:Object.values(opponent.depthChart)};
 setWorldCalendarDate(DB,s.days[0].date);t.registration.players=t.registration.players.filter(id=>id!==old&&id!==spare.id);t.registration.players.push(spare.id);
 before=JSON.stringify(DB);m=squadStatusModel(t,edit);const html=officialRegistrationPanel(t);
 check(m.international&&m.rows[old].registered&&!m.rows[old].domestic&&!m.rows[spare.id].registered&&m.rows[spare.id].domestic,'국제 엔트리/구단 명단 구분');
 const originalHtml=originalOfficialRegistrationPanel(t);const originalTop=originalHtml.match(/<select data-official-role="TOP">([\s\S]*?)<\/select>/)[1];check(originalTop.includes('value="'+spare.id+'"')&&!originalTop.includes('value="'+old+'"'),'원본 국내 선택/국제 적용 불일치 재현');
 const selects=[...html.matchAll(/<select data-official-role="([^"]+)">([\s\S]*?)<\/select>/g)];check(selects.length===5,'공식 선발 5슬롯');
 for(const [,role,options] of selects){check(options.includes('value="'+old+'"')&&!options.includes('value="'+spare.id+'"'),'화면=명령 국제 엔트리')}
 check(JSON.stringify(DB)===before,'공식 화면 및 상태 읽기 무변경');
 const invalid=previewWorldAction(DB,{type:'roster.official-lineup',actor:'manager',teamId:t.id,lineup:{...t.depthChart,TOP:spare.id}});check(!invalid.ok&&JSON.stringify(DB)===before,'국내만 등록된 선수 거절');
 const projection=JSON.parse(JSON.stringify(DB)),command={type:'roster.official-lineup',actor:'manager',teamId:t.id,lineup:{...t.depthChart}},expected=commitWorldAction(projection,command),actual=commitWorldAction(DB,command);check(expected.ok&&actual.ok&&JSON.stringify(DB)===JSON.stringify(projection),'기존 수동 writer 전체 결과');
 const context=squadStatusModel(t,edit);check(squadStatusMatches(context.rows[old],['registered','out'])&&!squadStatusMatches(context.rows[spare.id],['registered','out']),'복수 상태 OR 의미');
 const rowBefore=JSON.stringify(DB);SQUAD=t.id;squadTableState().statuses=['unregistered'];squadTableState().roles=['TOP'];squadTableState().q=spare.name;check(squadTableRows(t.roster.map(id=>DB.players[id]),context).every(p=>p.id===spare.id),'포지션/검색 AND 상태 OR');check(JSON.stringify(DB)===rowBefore,'필터 저장/DB 무변경');
 check(squadStatusSources(context).includes('확정 복귀일이 아니며')&&squadStatusCells(context,DB.players[old]).includes('등록'),'날짜/단위/불확실성 렌더');
 const foreign=activeTeams(DB,'EU',1)[0];check(squadStatusModel(foreign,edit)===null,'외부 비공개 상태 없음');setManagedTeam(DB,reserve.id);check(squadStatusModel(t,edit)===null,'리저브 계약/모구단 대행 없음');setManagedTeam(DB,t.id);
 const day=s.days[0],match=day.matches[0],result=simulateScheduledSeries(DB,s,day,match,DB.competitions[cid].stages[0]);commitScheduledSeries(DB,s,match,result);finalizeCompetitionDay(DB,s,day,0,DB.competitions[cid].stages[0]);
 check(result.rec.games.length===1&&result.rec.games[0].publicRecord.ending.kind==='nexus','공식 실제 넥서스');
 for(const restored of [unpackDB(JSON.stringify(DB)),unpackDB(packDB(DB))])check(restored.world.seasons[cid].days[0].matches[0].res.games[0].publicRecord.ending.kind==='nexus'&&restored.teams[t.id].registration.depthChart.TOP===old,'기존 실제 저장/공식 기록');
 const guardState=JSON.stringify(DB),guardChanges=[
 ()=>DB=JSON.parse(JSON.stringify(DB)),()=>DB.world={...DB.world},()=>DB.manager={...DB.manager},()=>DB.manager.teamId=null,
 ()=>SLOT='2',()=>VIEW='season',()=>UI_RENDER_ID++,()=>SQUAD=null,()=>DB.worldDate=addDays(DB.worldDate,1),()=>DB.year++,
 ()=>DB.world.manage='ai',()=>DB.world.fired=true,()=>SLOT_SWITCHING=true,()=>UI_OVERLAY={kind:'other'},
 ()=>DB.teams[managedTeamId(DB)]={...managedTeam(DB)},()=>DB.world.phase='initial_roster',
 ()=>managedTeam(DB).registration.players=[]];
 for(const change of guardChanges){DB=JSON.parse(guardState);SQUAD=managedTeamId(DB);SLOT='1';VIEW='squad';UI_RENDER_ID=1;SLOT_SWITCHING=false;UI_OVERLAY=null;
  const guard=officialEditGuard(()=>true,{querySelector:()=>null});check(guard(),'현행 공식 guard');change();const state=JSON.stringify(DB);check(!guard()&&JSON.stringify(DB)===state,'17종 공식 문맥 거절/읽기 무변경')}
 DB=JSON.parse(guardState);SQUAD=managedTeamId(DB);SLOT='1';VIEW='squad';UI_RENDER_ID=1;SLOT_SWITCHING=false;UI_OVERLAY=null;
 const owned=managedTeam(DB),pid=owned.roster[0];DB.players[pid].medical={daysLeft:2,out:true};owned.depthChart.TOP=pid;
 const detailBefore=JSON.stringify(DB),depthIdentity=owned.depthChart;
 originalSquadObservedDetail(DB.players[pid],Object.create(DB));check(JSON.stringify(DB)!==detailBefore&&owned.depthChart!==depthIdentity,'원본 상세의 실제 starterFor 공유 구단 쓰기 재현');
 DB=JSON.parse(detailBefore);const keptTeam=managedTeam(DB),keptDepth=keptTeam.depthChart;
 squadObservedDetail(DB.players[pid],Object.create(DB));check(JSON.stringify(DB)===detailBefore&&keptTeam.depthChart===keptDepth,'현재 상세는 실제 starterFor 쓰기를 복사본에 격리');
 console.log('선수단 상태 수용 통과: 국내/국제 명단·저장/보정 선발·의료 일수·훈련/초안·복수 상태·수동 명령·공식 넥서스·저장');
})();`,{timeout:60000,setupSources:["let DB,SQUAD;var SLOT='1',VIEW='squad',UI_RENDER_ID=1,SLOT_SWITCHING=false,UI_OVERLAY=null;const esc=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('\"','&quot;');",...sources,originalPanel]});

const tableSource=await readFile(new URL('../src/artifact/ui-squad-table.js',import.meta.url),'utf8'),statusSource=await readFile(new URL('../src/artifact/ui-squad-status.js',import.meta.url),'utf8');
function nativeOpenFixture(source){
 const elements=Object.fromEntries(['#sqtq','#sqtoptions','#sqtsearch','#sqtclear','#sqtprev','#sqtnext'].map(k=>[k,{value:'',disabled:false}]));
 elements['#sqtoptions'].open=true;
 const root={querySelector:k=>elements[k]||null,querySelectorAll:()=>[]},context=vm.createContext({DB:{world:{manage:'manual'},manager:{teamId:'a'},year:2028,worldDate:'2028-01-08'},SQUAD:'a',SLOT:'1',VIEW:'squad',UI_RENDER_ID:1,SLOT_SWITCHING:false,UI_OVERLAY:null,ROLES:[],ROLE_KO:{},GROUP_KO:{},esc:String,window:{scrollY:0,scrollTo(){}},document:{querySelector:()=>null},root});
 context.nav=()=>{context.observedOpen=vm.runInContext('squadTableState().controlsOpen',context);context.UI_RENDER_ID++};
 vm.runInContext(statusSource+'\n'+source+'\nsquadTableState().controlsOpen=false;bindSquadTableControls(root)',context);
 elements['#sqtsearch'].onclick();return context.observedOpen;
}
const syncOpen="s.controlsOpen=root.querySelector('#sqtoptions')?.open??s.controlsOpen;";
assert.equal(nativeOpenFixture(tableSource.replace(syncOpen,'')),false,'비동기 native toggle 전 원래 갱신은 닫힌값 사용');
assert.equal(nativeOpenFixture(tableSource),true,'실제 DOM 열린값을 갱신 직전에 보존');
console.log('선수단 native details 지연 toggle 반례/현재 동기 보존 통과');
