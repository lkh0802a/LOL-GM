import {runEngineFixture,artifactSources,artifactSource} from './test-harness.mjs';
const app=await artifactSource('app.js'),helpers=app.slice(app.indexOf('const teamOpts='),app.indexOf('const n1='))+app.match(/^const TAC_KO=.*$/m)[0]+app.match(/^function ovrTag.*$/m)[0];
await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error('SQUAD_OBSERVER '+m)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:6,div2:true,system:'franchise'})];cfg.internationals=[];cfg.subs=0;cfg.changes='none';
 const db=buildWorld(cfg),[a,b]=activeTeams(db,'NA',1),reserve=reserveTeamsOf(db,a)[0];
 for(const t of [a,b,reserve])for(const role of ROLES){const p=genPlayer(db,new RNG(t.id+role),{region:t.region,role,age:22,base:65});signContract(db,p,t,1,3);t.depthChart[role]=p.id}
 const backup=genPlayer(db,new RNG('squad-own-backup'),{region:a.region,role:'MID',age:22,base:60});signContract(db,backup,a,1,3);
 startWorldSeason(db,a.id,'squad-observer');DB=db;SQUAD=b.id;OPEN_P=null;SQUAD_EDIT=null;
 const second=genPlayer(db,new RNG('squad-second-mid'),{region:b.region,role:'MID',age:22,base:66});signContract(db,second,b,1,3);
 const mids=b.roster.map(id=>db.players[id]).filter(p=>p.role==='MID'),observedDb=squadObservationDb(b),expected=mids.slice().sort((x,y)=>obsOvr(observedDb,y)-obsOvr(observedDb,x)||x.id.localeCompare(y.id));
 const before=JSON.stringify(db),descs=[],trap=(object,key)=>{descs.push([object,key,Object.getOwnPropertyDescriptor(object,key)]);Object.defineProperty(object,key,{configurable:true,get(){throw Error('foreign '+key+' read')}})};
 for(const key of ['tactics','training','scrimLog','depthChart','synergy'])trap(b,key);
 for(const p of b.roster.map(id=>db.players[id]))for(const key of ['pool','rosterRole','condition','fatigue','morale','sharpness','form','satisfaction','medicalPlan'])trap(p,key);
 const html=viewSquad();check(html.includes('공개 로스터')&&html.includes('공개 경기 준비 정보')&&html.includes('다음 공식전')&&html.includes('공식 등록'),'public navigation/registration context lost');
 for(const token of ['data-tac=','data-tr=','data-lineup-player=','data-srole=','data-medical-plan=','scrimrequest','공식전·스크림 일정','<h3>훈련 배분','<th>컨디션</th>','<th>만족도</th>'])check(!html.includes(token),'foreign UI leaked '+token);
 check(html.includes('data-p-open=')&&html.includes('aria-expanded=')&&html.includes('scoutT'),'public roster/scouting/keyboard actions lost');
 check(html.indexOf('data-p="'+expected[0].id+'"')<html.indexOf('data-p="'+expected[1].id+'"'),'foreign order is not observation-based');
 for(const [object,key,desc] of descs){if(desc)Object.defineProperty(object,key,desc);else delete object[key]}
 check(JSON.stringify(db)===before,'foreign renderer mutates world');
 OPEN_P=mids[0].id;const expandedBefore=JSON.stringify(db),expanded=viewSquad();check(expanded.includes('pdet')&&DB===db&&JSON.stringify(db)===expandedBefore,'expanded foreign profile mutated live DB/report/cache');OPEN_P=null;
 const detailRenderer=playerDetail;playerDetail=()=>{throw Error('profile failure')};let profileFailed=false;try{squadObservedDetail(mids[0],squadObservationDb(b))}catch{profileFailed=true}playerDetail=detailRenderer;check(profileFailed&&DB===db,'failed profile render did not restore live DB identity');
 const target=mids[0],value=money(observedPlayerMarketValue(squadObservationDb(b),target));check(html.includes(value)&&html.includes('시장가치 추정'),'observer value missing');
 const history=JSON.stringify(db.metaHistory),oldTactics=b.tactics,oldTraining=b.training,oldChart=b.depthChart,oldState=target.condition;
 b.tactics={...b.tactics,aggression:99};b.training={...b.training,mechanical:99};b.depthChart={...b.depthChart,MID:second.id};target.condition=1;
 check(viewSquad()===html,'private preparation/lineup/condition changes public UI');b.tactics=oldTactics;b.training=oldTraining;b.depthChart=oldChart;target.condition=oldState;
 check(JSON.stringify(db.metaHistory)===history,'renderer changed public history');
 // Own organization retains real coaching controls; a reserve coach cannot edit the parent.
 for(const team of [a,reserve]){SQUAD=team.id;SQUAD_EDIT=null;const own=viewSquad();for(const token of ['data-tac=','data-tr=','data-lineup-player=','data-medical-plan=','scrimrequest','sqapply'])check(own.includes(token),'controlled squad missing '+token)}
 db.manager.teamId=reserve.id;SQUAD=a.id;SQUAD_EDIT=null;const parent=viewSquad();check(parent.includes('공개 로스터')&&!parent.includes('data-tac=')&&!parent.includes('data-official-lineup='),'reserve coach sees parent preparation/control');
 SQUAD=reserve.id;SQUAD_EDIT=null;check(viewSquad().includes('data-tac='),'reserve coaching lost');
 db.world.fired=true;SQUAD_EDIT=null;const firedBefore=JSON.stringify(db),fired=viewSquad();check(!fired.includes('data-tac=')&&!fired.includes('data-tr=')&&!fired.includes('scrimrequest')&&!fired.includes('data-official-lineup=')&&!fired.includes('scoutT'),'fired manager retains controls');
 check(JSON.stringify(db)===firedBefore&&squadEditState(reserve)===null,'fired view initialized private editor/world');
 db.world.fired=false;db.manager.teamId=a.id;SQUAD=b.id;SQUAD_EDIT=null;
 // Actual DOM event handlers enforce authority even for crafted/reused elements.
 const elements={sq:{},practicefocus:{},trint:{},trleft:{textContent:''}},mk=(dataset,value)=>({dataset,value,previousElementSibling:{querySelector:()=>({textContent:''})}}),
  tac=mk({tac:'aggression'},17),train=mk({tr:'mechanical'},12),lineup=mk({lineupPlayer:target.id},'TOP'),role=mk({srole:target.id},'core'),health=mk({medicalPlan:target.id},'rest'),
  selectors={'[data-tac]':[tac],'[data-tr]':[train],'[data-lineup-player]':[lineup],'[data-srole]':[role],'[data-medical-plan]':[health]};
 $=q=>elements[q.slice(1)]||null;document={querySelector:$,querySelectorAll:q=>selectors[q]||[]};window={};bindSquad();
 const event={target:{value:'light'},stopPropagation(){}};const untouched=JSON.stringify(db);
 tac.oninput(event);train.oninput(event);lineup.onchange(event);role.onchange(event);health.onchange({target:health});elements.practicefocus.onchange(event);elements.trint.onchange(event);
 check(SQUAD_EDIT===null&&JSON.stringify(db)===untouched,'crafted foreign controls create editor or mutate world');
 SQUAD=a.id;SQUAD_EDIT=null;bindSquad();const editable=squadEditState(a),key='aggression',prior=a.tactics[key];tac.oninput(event);check(editable.tactics[key]===17&&editable.dirty&&a.tactics[key]===prior,'real tactic handler failed transient edit');
 elements.practicefocus.value='balanced';elements.practicefocus.onchange({target:elements.practicefocus});elements.trint.value='light';elements.trint.onchange({target:elements.trint});train.oninput(event);
 applySquadEdit();if(a.tactics[key]!==17)console.log('APPLY_REASON',MSG);check(a.tactics[key]===17&&a.training.intensity==='light','actual apply did not commit authorized preparation');
 const pending=squadEditState(a);pending.rosterPlan.assignments[backup.id]=reserve.id;
 SQUAD=reserve.id;const destinationEdit=squadEditState(reserve),destinationHtml=viewSquad();
 check(destinationHtml.includes('data-lineup-player="'+backup.id+'"')&&backup.team===a.id,'incoming player absent from planned roster or moved before apply');
 lineup.dataset.lineupPlayer=backup.id;lineup.value='MID';bindSquad();lineup.onchange(event);
 check(destinationEdit.starters.MID===backup.id,'incoming starter selector rejected planned membership');
 SQUAD=a.id;check(!viewSquad().includes('data-lineup-player="'+backup.id+'"'),'outgoing player retained source lineup control');
 applySquadEdit();check(backup.team===reserve.id&&reserve.depthChart.MID===backup.id,'incoming starter and squad move did not commit together');
 db.world.fired=true;SQUAD_EDIT={teamId:a.id,tactics:{aggression:99}};const deny=JSON.stringify(db);tac.oninput(event);train.oninput(event);applySquadEdit();check(JSON.stringify(db)===deny,'fired crafted apply altered world');db.world.fired=false;SQUAD_EDIT=null;
 // Supported saves restore the same public boundary and private management controls.
 const packed=packDB(db),restored=unpackDB(packed);DB=restored;SQUAD=b.id;SQUAD_EDIT=null;const publicRestored=viewSquad();check(publicRestored.includes('공개 로스터')&&!publicRestored.includes('data-tac=')&&publicRestored.includes('시장가치 추정'),'restored public boundary lost');
 SQUAD=a.id;SQUAD_EDIT=null;check(viewSquad().includes('value="17"')&&viewSquad().includes('data-tr='),'restored own preparation lost');
 console.log('SQUAD_OBSERVER_INFORMATION_ACCEPTANCE PASS actual renderer/private getters/order/value/invariance/purity/registration/public schedule, own+owned reserve+reserve coach+fired, crafted events+authorized apply, modern save');
})();`,{timeout:60000,setupSources:["var SLOT='1',SLOT_SWITCHING=false,UI_RENDER_ID=1,UI_OVERLAY=null,VIEW='squad';let DB,SQUAD,OPEN_P,SQUAD_EDIT,MSG,SCOUTSET={region:'ALL',role:'ALL',contract:'ALL',competition:'ALL',undervalued:false,q:''};let document,window,$;const esc=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('\"','&quot;');const tshort=id=>DB.teams[id]?.short||id;function grpAvg(p,g,k=100){return Math.round(avg(ATTR_GROUPS[g].map(a=>obsAttr(DB,p,a,k))))};function nav(){}function navKeepScroll(){}function saveDB(){}",helpers,...(await artifactSources(['ui-club-medical.js','ui-club-practice.js','ui-club-scrim.js','ui-club-recruitment.js','ui-scrim-plans.js','ui-squad-controls.js','ui-roster.js','ui-club-briefing.js','ui-club-home.js','ui-squad-preparation.js','ui-manager.js','ui-official-edit.js','ui-registration.js','ui-player.js','ui-player-champions.js','ui-player-loans.js','ui-transfer-terms.js','ui-player-commitments.js','ui-local-service.js','ui-scouting-regions.js']))]});
