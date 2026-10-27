import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {runEngineFixture} from './test-harness.mjs';
const sources=await Promise.all(['state','market','contracts','views'].map(p=>readFile(new URL('../src/ui-v2/'+p+'.js',import.meta.url),'utf8')));
const result=await runEngineFixture(String.raw`(()=>{
 const check=(ok,m)=>{if(!ok)throw Error('V2_CANDIDATE_IMPACT '+m)},cfg=defaultWorldConfig();cfg.regions=[regionCfg('KR',{teams:4,div2:true}),regionCfg('NA',{teams:4,div2:true})];cfg.internationals=[];
 const db=buildWorld(cfg),team=activeTeams(db,'KR',1)[0];startCareer(db,team.id,'candidate-impact');const p=Object.values(db.players).find(p=>!p.team&&!p.retired&&initialSignCheck(db,p,team).ok),reserve=setupTeamsForManager(db).find(t=>t.parent===team.id);check(p&&reserve,'actual initial candidate and reserve');
 V2.db=db;V2.section='market';V2.tab='선수 검색';V2.target=team.id;V2.pid=p.id;V2.q=p.name;V2.page=2;V2.role=p.role;
 const before=JSON.stringify(db),worldRef=db.world,teamRef=team,expected=initialOfferImpact(db,p.id,team.id),original=initialOfferImpact;check(expected.ok,'existing default conditional writer projection');let calls=0,lastTarget=null;initialOfferImpact=(...args)=>{calls++;lastTarget=args[2];return original(...args)};
 const closed=v2PlayerDetail();check(closed.includes('data-candidate-impact')&&!closed.includes('data-initial-impact>')&&calls===0,'closed disclosure never computes a full-world projection');
 const state=v2InitialCandidateImpactContext(p,team);state.open=true;const html=v2PlayerDetail();check(calls===1&&html.includes('요구 연봉 기준의 가정')&&html.includes('실제 협상 요구·제출 조건과 다를 수'),'one explicit read with honest basis');
 const row=(key,a,b)=>{const part=html.match(new RegExp('data-impact-field="'+key+'"[^]*?</tr>'))?.[0];check(part&&part.includes('<td>'+v2Esc(a)+'</td><td>'+v2Esc(b)+'</td>'),'canonical '+key+' before/after');};
 row('count',expected.before.count+'명',expected.after.count+'명');row('imports',expected.before.imports+'명',expected.after.imports+'명');row('organization',expected.before.organization+'명',expected.after.organization+'명');for(const key of ['pay','budget','cash','tax'])row(key,v2Money(expected.before[key]),v2Money(expected.after[key]));row('room',v2Money(expected.before.budget-expected.before.pay),v2Money(expected.after.budget-expected.after.pay));
 check(html.includes(v2Money(expected.terms.salary))&&html.includes(expected.terms.years+'년')&&html.includes('역할 약속 없음'),'default assumptions without inventing a role promise');check(JSON.stringify(db)===before&&db.world===worldRef&&db.teams[team.id]===teamRef&&V2.q===p.name&&V2.page===2&&V2.role===p.role,'pure world/identity/search context');
 const make=()=>{V2.candidateImpact=null;const c=v2InitialCandidateImpactContext(p,team),body={innerHTML:'untouched'},el={open:false,isConnected:true,querySelector(){return body}};detailElement=el;v2BindInitialCandidateImpact();return {c,el,body,invoke:el.ontoggle};};
 let active=make(),at=calls;active.el.open=true;active.invoke();check(active.c.open&&calls===at+1&&active.body.innerHTML.includes('data-initial-impact'),'real toggle reads existing calculator once');active.invoke();check(calls===at+1,'duplicate native toggle does not calculate again');active.el.open=false;active.invoke();check(!active.c.open&&active.body.innerHTML===''&&calls===at+1,'close is calculation-free');
 const changes=[
  ()=>{const old=V2.db;V2.db=unpackDB(packDB(db));return ()=>{V2.db=old}},
  ()=>{const old=db.world;db.world={...old};return ()=>{db.world=old}},
  ()=>{const old=db.manager;db.manager={...old};return ()=>{db.manager=old}},
  ()=>{const old=managedTeamId(db);setManagedTeam(db,activeTeams(db,'NA',1)[0].id);return ()=>setManagedTeam(db,old)},
  ()=>{const old=V2.target;V2.target=reserve.id;return ()=>{V2.target=old}},
  ()=>{const old=db.worldDate;db.worldDate=addDays(old,1);return ()=>{db.worldDate=old}},
  ()=>{const old=db.world.phase;db.world.phase='season';return ()=>{db.world.phase=old}},
  ()=>{V2.revision++;return ()=>{V2.revision--}},
  ()=>{V2.busy=true;return ()=>{V2.busy=false}},
  ()=>{V2.taskBackPending=true;return ()=>{V2.taskBackPending=false}},
  ()=>{const own=Object.hasOwn(db.world,'fired'),old=db.world.fired;db.world.fired=true;return ()=>{if(own)db.world.fired=old;else delete db.world.fired}},
  ()=>{const own=Object.hasOwn(p,'retired'),old=p.retired;p.retired=true;return ()=>{if(own)p.retired=old;else delete p.retired}},
  ()=>{const old=p.team;p.team=team.id;return ()=>{p.team=old}},
  ()=>{const old=V2.pid;V2.pid=null;return ()=>{V2.pid=old}},
  ()=>{const old=V2.candidateImpact;V2.candidateImpact=null;return ()=>{V2.candidateImpact=old}}
 ];
 for(const change of changes){active=make();at=calls;const undo=change();active.el.open=true;active.invoke();check(!active.c.open&&active.body.innerHTML==='untouched'&&calls===at,'stale callback inert');undo();}
 active=make();at=calls;active.el.isConnected=false;active.el.open=true;active.invoke();check(calls===at&&!active.c.open,'detached disclosure inert');
 V2.candidateImpact=null;const first=v2InitialCandidateImpactContext(p,team);first.open=true;V2.target=reserve.id;const second=v2InitialCandidateImpactContext(p,reserve);check(!second.open&&second.target===reserve.id&&second!==first,'squad context resets expansion');const reserveBefore=JSON.stringify(db),reserveModel=original(db,p.id,reserve.id);second.open=true;const reserveHTML=v2InitialCandidateImpact(p,reserve);check(lastTarget===reserve.id&&(reserveModel.ok?reserveHTML.includes(v2Esc(reserve.name)):reserveHTML.includes('data-initial-impact-rejected')&&reserveHTML.includes(v2Esc(reserveModel.reason)))&&JSON.stringify(db)===reserveBefore,'actual reserve projection uses current squad and original success/refusal');V2.target=team.id;
 V2.section='scout';check(v2InitialCandidateImpact(p,team)==='','market-only boundary');V2.section='market';db.world.phase='season';check(v2InitialCandidateImpact(p,team)==='','initial-only boundary');db.world.phase='initial_roster';
 const manage=db.world.manage;db.world.manage='ai';const autoBefore=JSON.stringify(db);check(v2InitialCandidateImpact(p,team).includes('data-candidate-impact')&&JSON.stringify(db)===autoBefore,'existing AI read permission remains pure');db.world.manage=manage;setManagedTeam(db,reserve.id);check(v2InitialCandidateImpact(p,reserve)==='','managed reserve cannot acquire parent recruitment projection');setManagedTeam(db,team.id);
 const cash=team.finance.cash;team.finance.cash=null;const malformed=JSON.stringify(db),rejected=v2InitialImpactProjection(db,p.id,team.id,null,true);check(rejected.includes('data-initial-impact-rejected')&&rejected.includes('구단 현금 정보가 없습니다')&&JSON.stringify(db)===malformed,'original malformed-input refusal, no writer side effects');team.finance.cash=cash;
 initialOfferImpact=original;const apply=applyWorldAction;let copyWritten=false;applyWorldAction=(copy,plan)=>{check(copy!==db,'projection writer received live database');const out=apply(copy,plan);check(out.ok,'actual projection copy writer');copyWritten=true;throw Error('controlled after projection copy write')};let failed;try{failed=v2InitialImpactProjection(db,p.id,team.id,null,true)}finally{applyWorldAction=apply}check(copyWritten&&failed.includes('data-initial-impact-rejected')&&failed.includes('미리보기를 계산하지 못했습니다')&&JSON.stringify(db)===before,'visible failure after real copy writer, whole live graph unchanged');
 check(JSON.stringify(db)===before&&JSON.stringify(unpackDB(packDB(db)))===JSON.stringify(unpackDB(packDB(JSON.parse(before)))),'whole native save unchanged');const fixture=packDB(db);V2.candidateImpact={open:true};v2InstallSavedGame({db:unpackDB(fixture),target:team.id,read:{}});check(V2.candidateImpact===null,'native installation resets transient disclosure');
 return {canonicalProjection:true,unscoutedEntry:true,lazyRead:true,worldAndNativePure:true,identityAndSearchPreserved:true,staleCases:changes.length+1,squadScoped:true,actualRefusal:true,visibleFailure:true,aiReadPure:true,managedReserveDenied:true,loadReset:true,game:fixture,pid:p.id,target:team.id};
})()`,{setupSources:[...sources,`let detailElement=null;const window={scrollY:0,scrollTo(){}};const document={querySelector(){return detailElement},querySelectorAll(){return []},getElementById(){return {textContent:''}}};function v2Icon(){return ''}`],timeout:60000});
assert(result.canonicalProjection&&result.worldAndNativePure);
if(process.env.UI_V2_CANDIDATE_IMPACT_FIXTURE)await writeFile(process.env.UI_V2_CANDIDATE_IMPACT_FIXTURE,JSON.stringify(result));
const {game,...summary}=result;console.log('UI_V2_CANDIDATE_IMPACT_ACCEPTANCE '+JSON.stringify(summary));
