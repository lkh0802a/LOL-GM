import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {runEngineFixture} from './test-harness.mjs';
const sources=await Promise.all(['state','market','contracts','views','management','champion-art','official'].map(p=>readFile(new URL('../src/ui-v2/'+p+'.js',import.meta.url),'utf8')));
const result=await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error('UI_V2_OFFICIAL '+m)},copy=x=>JSON.parse(JSON.stringify(x));
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:8,div2:false,splits:1,legs:1,regularBo:3,playoffBo:3})];cfg.internationals=[];
 const db=buildWorld(cfg),t=activeTeams(db,'NA',1)[0];startCareer(db,t.id,'ui-v2-official');
 for(const team of activeTeams(db))for(const role of ROLES){const p=Object.values(db.players).find(p=>!p.team&&p.role===role&&p.region===team.region);signContract(db,p,team,1,2,{});initializeDepthChart(db,team,true);}
 startWorldSeason(db,t.id,'ui-v2-official');let days=0;while(!db.world.pendingOfficial&&days++<40)playWorldDay(db);check(db.world.pendingOfficial&&days<40,'실제 경기 대기');V2.db=db;V2.target=t.id;
 const pending=JSON.stringify(db);v2OfficialNotice();check(JSON.stringify(db)===pending,'대기 조회 불변');v2OfficialOpen();check(V2.official&&v2OfficialCurrent(),'수동 준비');
 const opened=JSON.stringify(db),o=V2.official;v2OfficialView();check(JSON.stringify(db)===opened,'준비 조회 불변');o.open=false;v2OfficialOpen();check(V2.official===o&&JSON.stringify(db)===opened,'중단 재개 무작성');
 if(o.mode==='selection'){const expected=copy(db),prompt=o.setup.prompt,choice=prompt.mode==='first'||prompt.remaining==='side'?{kind:'side',value:'blue'}:{kind:'order',value:'first'};applyPendingOfficialSelection(expected,choice);pendingOfficialSelectionSetup(expected);pendingOfficialDraftSetup(expected);v2OfficialSelect(choice.kind,choice.value);check(JSON.stringify(db)===JSON.stringify(expected),'기존 선택과 준비 전체 결과 동일');}
 check(V2.official.mode==='draft','수동 밴픽');
 const visualChampion={id:'champ_ui_visual',name:'아르센',arch:'control',cls:'mage',dmg:'AP'},visualBefore=JSON.stringify(visualChampion),art=v2GeneratedChampionArt(visualChampion);
 check(art.startsWith('data:image/svg+xml')&&art===v2GeneratedChampionArt(visualChampion)&&JSON.stringify(visualChampion)===visualBefore,'생성 외형 동일·게임 입력 무작성');
 check(v2GeneratedChampionArt({...visualChampion,visual:{...generatedChampionVisual(visualChampion),revision:1}})!==art,'실제 외형 개정 반영');
 check(!v2ChampionArtUrl(visualChampion)&&v2ChampionArt(visualChampion).includes('data-art-origin="generated"'),'생성 초상과 원본 출처 구분');
 const fearlessCheck=s=>{const view=v2DraftFearless(s);if(!s.ctx.fearless){check(!view,'규칙 없는 피어리스 잠금 미생성');return;}for(const id of new Set(s.ctx.used)){check(view.includes('data-fearless-champ="'+id+'"'),'실제 이전 세트 상단 표시');check(!draftLegalChampions(s).some(c=>c.id===id),'이전 세트 합법 후보 제외');check(!draftValidateChoice(s,{champ:id,side:V2.official.side}).ok,'강제 이전 챔피언 거절');}check(!view.includes('data-official-champ='),'잠금 초상 수동 선택 연결 없음');};
 fearlessCheck(V2.official.state);const base=JSON.stringify(db);let turns=0;
 while(draftTurn(V2.official.state)&&turns++<21){const active=V2.official,s=active.state;check(draftTurn(s).side===active.side,'현재 감독 차례만 선택');const c=draftLegalChampions(s)[0];check(c,'합법 후보');active.selected=c.id;v2OfficialConfirm();}
 check(turns<21&&!draftTurn(V2.official.state),'전체 밴픽 완료');check(JSON.stringify(db)===base,'경기 결과 선작성 금지');
 const expected=copy(db),draft=draftResult(V2.official.state),wanted=resolvePendingOfficialMatch(expected,draft);check(publicMatchRecord(wanted.game,db.patch.id).ending.kind==='nexus','실제 넥서스 종료');
 const ready=V2.official,readyInputs=JSON.stringify(draftResult(ready.state)),writer=simulateMatch,teamRef=t;simulateMatch=()=>{throw Error('통제된 경기 작성 실패')};v2OfficialFinish();simulateMatch=writer;check(V2.official===ready&&JSON.stringify(db)===base&&db.teams[t.id]===teamRef&&JSON.stringify(draftResult(ready.state))===readyInputs,'실패 전체 상태·객체·수동 입력 복구');
 v2OfficialFinish();check(JSON.stringify(db)===JSON.stringify(expected),'원래 공식 작성자 전체 상태/시드 결과 동일');const after=JSON.stringify(db);v2OfficialFinish();check(JSON.stringify(db)===after,'중복 종료 거절');check(V2.officialResult,'실제 결과 표시');
 const saved=packDB(db);V2.db=unpackDB(saved);V2.official=null;check(JSON.stringify(V2.db)===JSON.stringify(unpackDB(packDB(expected))),'기존 작성자의 전체 저장 복원 상태 동일');
 let games=1;while(V2.db.world.pendingOfficial?.queue?.[0]?.matchId===db.world.pendingOfficial?.queue?.[0]?.matchId&&games<5){
  v2OfficialOpen();if(V2.official.mode==='selection'){const p=V2.official.setup.prompt;v2OfficialSelect(p.mode==='first'||p.remaining==='side'?'side':'order',p.mode==='first'||p.remaining==='side'?'red':'last');}
  fearlessCheck(V2.official.state);let n=0;while(draftTurn(V2.official.state)&&n++<21){V2.official.selected=draftLegalChampions(V2.official.state)[0].id;v2OfficialConfirm();}check(n<21,'다음 게임 밴픽');const e=copy(V2.db);resolvePendingOfficialMatch(e,draftResult(V2.official.state));v2OfficialFinish();check(JSON.stringify(V2.db)===JSON.stringify(e),'다음 게임/시리즈 전체 결과 동일');games++;if(V2.officialResult.done)break;
 }
 check(games<5&&V2.officialResult.done,'실제 시리즈 종료');
 // Recreate the same actual pending fixture; stale context must never rebase inputs.
 V2.db=JSON.parse(pending);V2.official=null;v2OfficialOpen();const start=JSON.stringify(V2.db),active=V2.official;
 for(const mode of ['manager','date','fired','auto','load','pending','session','roster','player']){
  V2.db=JSON.parse(start);V2.official=null;v2OfficialOpen();const current=V2.official;
  if(mode==='manager')V2.db.manager={...V2.db.manager};if(mode==='date')V2.db.worldDate=addDays(V2.db.worldDate,1);if(mode==='fired')V2.db.world.fired=true;if(mode==='auto')V2.db.world.manage='ai';if(mode==='load')V2.db=JSON.parse(JSON.stringify(V2.db));if(mode==='pending')V2.db.world.pendingOfficial={...V2.db.world.pendingOfficial};if(mode==='session')V2.db.world.pendingOfficial.queue[0].session={...V2.db.world.pendingOfficial.queue[0].session};if(mode==='roster')v2Team().roster.reverse();if(mode==='player')V2.db.players[v2Team().roster[0]].fatigue++;
  const before=JSON.stringify(V2.db);check(!v2OfficialCurrent(current),mode+' 현재 문맥 거절');v2OfficialSelect('side','blue');v2OfficialConfirm();v2OfficialFinish();check(JSON.stringify(V2.db)===before,mode+' 이전 입력 무작성');
 }
 return {manualSelectionAndPreparation:true,readPure:true,pauseResume:true,manualDraft:true,generatedArtStable:true,artRevision:true,fearlessActualLocks:true,noEarlyResult:true,wholeWriterParity:true,nexus:true,games,duplicateInert:true,save:true,rollback:true,authorityCases:9,fixture:JSON.parse(pending)};
})()`,{setupSources:[...sources,`const document={getElementById(){return {textContent:''}},querySelectorAll(){return []}};const localStorage={setItem(){}};function v2Icon(){return ''}function v2Render(){}`],timeout:120000});
if(process.env.UI_V2_OFFICIAL_FIXTURE)await writeFile(process.env.UI_V2_OFFICIAL_FIXTURE,JSON.stringify({game:JSON.stringify(result.fixture),read:{}}));delete result.fixture;
assert(result.wholeWriterParity&&result.rollback&&result.nexus);console.log('UI_V2_OFFICIAL_ACCEPTANCE',JSON.stringify(result));
