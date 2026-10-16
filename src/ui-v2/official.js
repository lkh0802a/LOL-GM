// 공식 선택·밴픽 화면. 경기 결과·선택권·시드·등록 작성자는 기존 엔진만 사용한다.
function v2OfficialError(){
 const db=V2.db;if(!db?.world?.pendingOfficial?.queue?.length)return '준비할 공식 경기가 없습니다';
 const control=pendingOfficialControl(db);return control.error||(manualContactPending(db)?'도착한 선수 연락을 먼저 검토하세요':null)||(!control.manual||!managerControlsSquad(db,v2Team())?'현재 감독이 직접 준비할 수 있는 경기가 아닙니다':null);
}
function v2OfficialContext(){
 const db=V2.db,w=db.world,p=w.pendingOfficial,q=p.queue[0],team=v2Team(),refs=pendingOfficialRefs(db,q);
 const read=()=>JSON.stringify([db.worldDate,db.year,w.year,w.phase,w.manage,w.fired,managedTeamId(db),p,team,db.regions[team.region],refs?.s.cur,refs?.day.date,refs?.m,db.patch.id,db.patch._revision,db.patch._systemRevision,refs?[refs.m.a,refs.m.b].map(id=>[db.teams[id],db.teams[id]?.roster.map(pid=>db.players[pid])]):[]]);
 return {db,w,p,q,session:q.session,manager:db.manager,team,patch:db.patch,read,stamp:read()};
}
function v2OfficialCurrent(o=V2.official){const c=o?.context;return !!c&&V2.db===c.db&&V2.db.world===c.w&&V2.db.manager===c.manager&&v2Team()===c.team&&V2.db.patch===c.patch&&c.w.pendingOfficial===c.p&&c.p.queue?.[0]===c.q&&c.q.session===c.session&&!v2OfficialError()&&c.read()===c.stamp;}
function v2OfficialAi(state,side){let turns=0;while(draftTurn(state)&&draftTurn(state).side!==side){if(++turns>20)throw Error('밴픽 진행 순서를 확인할 수 없습니다');const choice=draftAiChoice(state);if(choice)draftApplyChoice(state,choice);else draftSkipTurn(state);}}
function v2OfficialShow(){V2.section='schedule';V2.tab='경기 일정';V2.pid=null;v2Render();}
function v2OfficialPrepare(){
 if(validManualInflightGame(V2.db))return {mode:'running',open:true,context:v2OfficialContext()};
 const selection=pendingOfficialSelectionSetup(V2.db);let o;
 if(selection)o={mode:'selection',setup:selection};
 else {const setup=pendingOfficialDraftSetup(V2.db);if(!setup)throw Error('현재 경기의 준비 입력을 확인할 수 없습니다');const side=[setup.blue,setup.red].indexOf(managedTeamId(V2.db));if(side<0)throw Error('현재 구단의 공식 경기 준비가 아닙니다');const state=createDraftSession(seriesOfficialView(V2.db,setup.session),[setup.blue,setup.red],new RNG(setup.gseed,'draft'),setup.draftCtx);v2OfficialAi(state,side);o={mode:'draft',setup,state,side,query:'',role:'ALL',selected:null};}
 return {...o,open:true,context:v2OfficialContext()};
}
function v2OfficialOpen(){
 const error=v2OfficialError();if(error)return v2Tell(error);
 if(V2.official){if(!v2OfficialCurrent())return v2Tell('경기 준비 문맥이 바뀌었습니다. 미완료 입력을 취소하고 현재 경기를 다시 확인하세요');V2.official.open=true;v2OfficialShow();return;}
 const undo=pendingOfficialUndo(V2.db);try{V2.official=v2OfficialPrepare();v2Save();v2OfficialShow();}catch(error){undo();V2.official=null;v2Tell('경기 준비 실패 · '+error.message);}
}
function v2OfficialSelect(kind,value){
 const o=V2.official;if(!v2OfficialCurrent(o)||o.mode!=='selection')return v2Tell('현재 경기의 선택권을 다시 확인하세요');
 const undo=pendingOfficialUndo(V2.db);try{applyPendingOfficialSelection(V2.db,{kind,value});const next=v2OfficialPrepare();V2.official=next;v2Save();v2Render();}catch(error){undo();V2.official=o;v2Tell('선택 처리 실패 · '+error.message);}
}
function v2OfficialConfirm(){
 const o=V2.official;if(!v2OfficialCurrent(o)||o.mode!=='draft')return v2Tell('현재 경기 준비를 다시 확인하세요');
 const s=o.state,turn=draftTurn(s),choice={champ:o.selected,side:o.side,source:'player'};
 if(!turn||turn.side!==o.side||!draftValidateChoice(s,choice).ok)return v2Tell('현재 차례에 선택할 수 있는 챔피언을 확인하세요');
 if(turn.kind==='P'){const row=draftPreparationReport(s,o.side).rows.find(x=>x.champ===choice.champ);if(!row)return v2Tell('현재 선수단의 선택 근거를 확인할 수 없습니다');choice.f=row.best.factors;choice.v=row.best.score;}
 const taken=[...s.taken],undo=pendingOfficialUndo(s);try{draftApplyChoice(s,choice);v2OfficialAi(s,o.side);o.selected=null;v2Render();}catch(error){undo();s.taken.clear();for(const id of taken)s.taken.add(id);v2Tell('밴픽 처리 실패 · '+error.message);}
}
function v2OfficialFinish(){
 const o=V2.official;if(!v2OfficialCurrent(o)||o.mode!=='draft'||draftTurn(o.state))return v2Tell('현재 경기의 밴픽을 먼저 확정하세요');
 v2ResolveOfficialGame(draftResult(o.state));
}
function v2ResolveOfficialGame(draft){
 const o=V2.official;if(!v2OfficialCurrent(o))return v2Tell('현재 경기 준비를 다시 확인하세요');
 const previousResult=V2.officialResult,undo=pendingOfficialUndo(V2.db);try{const out=resolvePendingOfficialMatch(V2.db,draft);if(!out.game&&!out.response)throw Error('현재 경기 진행 결과를 확인할 수 없습니다');v2AcceptOfficialOutput(out);}catch(error){undo();V2.official=o;V2.officialResult=previousResult;v2Tell('공식 경기 처리 실패 · '+error.message+' · 완료 기록과 준비 입력은 유지했습니다');}
}
function v2AcceptOfficialOutput(out){
 if(out.game)V2.officialResult={game:publicMatchRecord(out.game,V2.db.patch.id),score:out.score,done:out.done};
 V2.official=null;v2Save();const contact=v2CurrentContact();v2Tell(contact||out.response?'선수 연락에서 진행을 멈췄습니다. 현재 계약을 직접 검토하세요.':'실제 경기 결과를 기록했습니다. 다음 준비와 진행은 직접 선택하세요');
 if(contact)v2OpenNegotiation(contact.id);else if(!v2ShowContractResponse(out))v2Render();
}
function v2OfficialNotice(){
 if(!V2.db.world.pendingOfficial)return '';const contact=v2CurrentContact();if(contact)return '<section class="panel"><h3>선수 연락 도착 · 경기 진행 중단</h3><p>연락을 직접 검토한 뒤 현재 경기 재개를 선택하세요. 이미 시작한 게임의 밴픽을 바꾸지 않습니다.</p><button class="btn btn-primary" id="official-contact">도착한 계약 연락 확인</button></section>';const error=v2OfficialError();
 return `<section class="panel"><div class="panel-heading"><strong>공식 경기 준비 대기</strong></div><p class="hint">${v2Esc(error||'진영·픽 순서와 밴픽을 직접 확정한 뒤 경기를 진행하세요. 다른 날짜로 넘어가지 않습니다.')}</p><div class="tag-flex"><button class="btn btn-primary" id="official-open"${error?' disabled':''}>${V2.official?'중단한 준비 재개':'현재 경기 준비'}</button>${V2.official?'<button class="btn btn-outline" id="official-discard">미완료 준비 입력 취소</button>':''}</div><p class="hint">중단 중인 챔피언 입력은 파일 저장에 포함되지 않습니다. 저장된 세트 선택권과 완료 경기는 유지합니다.</p></section>`;
}
function v2OfficialView(){
 const o=V2.official;if(!v2OfficialCurrent(o))return `<section class="panel"><h2>경기 준비 상태가 바뀌었습니다</h2><p>이전 준비 입력을 현재 경기에 자동 적용하지 않습니다.</p><button class="btn btn-outline" id="official-discard">미완료 준비 입력 취소</button></section>`;
 if(o.mode==='running')return '<section class="panel"><h2>진행 중인 공식 게임</h2><p>시작할 때 확정한 입력을 유지합니다. 아직 끝나지 않은 경기의 결과는 표시하지 않습니다.</p><button class="btn btn-primary" id="official-resume">현재 게임 이어서 진행</button></section>';
 const x=o.setup,header=`<section class="panel"><div class="panel-heading"><strong>${v2Esc(x.comp.name)} · ${x.game}세트</strong><button class="btn btn-outline btn-small" id="official-pause">창 닫기</button></div><p>${v2Esc(V2.db.teams[x.m.a].name)} ${x.score.join(' : ')} ${v2Esc(V2.db.teams[x.m.b].name)}</p></section>`;
 if(o.mode==='selection'){
  const p=x.prompt,options=p.mode==='first'?[['side','blue','블루 진영'],['side','red','레드 진영'],['order','first','선픽'],['order','last','후픽']]:p.remaining==='side'?[['side','blue','블루 진영'],['side','red','레드 진영']]:[['order','first','선픽'],['order','last','후픽']];
  return header+`<section class="panel"><h2>세트 선택권</h2><p class="section-lead">${p.mode==='first'?'진영 또는 픽 순서를 먼저 선택하세요. 상대가 나머지를 결정합니다.':'상대가 먼저 결정한 뒤 남은 항목을 선택합니다.'}</p><div class="detail-grid">${options.map(([kind,value,name])=>`<button class="btn btn-primary" data-official-kind="${kind}" data-official-value="${value}">${name}</button>`).join('')}</div></section>`;
 }
 const s=o.state;
 return header+`<section class="draft-stage">${v2DraftFearless(s)}<div class="draft-bans">${[0,1].map(side=>v2DraftBans(s,side)).join('')}</div><div class="draft-arena">${v2DraftSide(s,0)}${v2DraftCentre(o)}${v2DraftSide(s,1)}</div></section>`;
}
function v2DraftFearless(s){
 if(!s.ctx.fearless)return '';
 const ids=[...new Set(s.ctx.used)];return `<section class="fearless-panel" aria-label="하드 피어리스 사용 제한"><div class="between"><strong>하드 피어리스 · 이전 세트 사용</strong><small>${ids.length}개 잠금</small></div><p class="hint">이전 세트에서 양 팀이 선택한 챔피언입니다. 이번 세트에서 다시 선택할 수 없습니다.</p><div class="fearless-list">${ids.map(id=>`<div class="fearless-champion" data-fearless-champ="${v2Esc(id)}" aria-label="${sv2Name(s,id)} · 이전 세트 사용으로 선택 불가">${v2ChampionArt(s.db.patch.champions[id])}<span>${sv2Name(s,id)}</span><small>잠금</small></div>`).join('')||'<span class="hint">첫 세트 · 아직 사용한 챔피언이 없습니다.</span>'}</div></section>`;
}
function v2DraftBans(s,side){return `<section class="ban-team"><strong>${side?'레드':'블루'} 금지</strong><div class="ban-slots">${Array.from({length:5},(_,i)=>{const c=s.db.patch.champions[s.bans[side][i]];return `<div class="ban-slot ${c?'filled':''}" aria-label="${c?sv2Name(s,c.id):'금지 대기'}">${c?v2ChampionArt(c):'<span>−</span>'}</div>`}).join('')}</div></section>`;}
function sv2Name(s,id){return v2Esc(championLabel(s.db,id));}
function v2DraftSide(s,side){
 const turn=draftTurn(s);return `<section class="draft-team side-${side}"><header><small>${side?'레드 진영':'블루 진영'} · ${s.firstPick===side?'선픽':'후픽'}</small><h2>${v2Esc(s.db.teams[s.teamIds[side]].name)}</h2></header><div class="pick-slots">${Array.from({length:5},(_,i)=>{const id=s.pickList[side][i],c=s.db.patch.champions[id],active=turn?.kind==='P'&&turn.side===side&&s.pickList[side].length===i;return `<article class="pick-slot ${active?'active':''} ${c?'filled':''}">${v2ChampionArt(c,'loading')}<div class="pick-caption"><small>${i+1}번째 선택${active?' · 현재 차례':''}</small><strong>${c?sv2Name(s,id):'선택 대기'}</strong>${c?'<small>'+c.roles.map(r=>v2Esc(ROLE_KO[r]||r)).join(' · ')+'</small>':''}</div></article>`}).join('')}</div></section>`;
}
function v2DraftCentre(o){
 const s=o.state,turn=draftTurn(s),c=s.db.patch.champions[o.selected],query=o.query.trim().toLocaleLowerCase('ko'),rows=turn?draftLegalChampions(s).filter(c=>(o.role==='ALL'||c.roles.includes(o.role))&&(!query||championLabel(s.db,c.id).toLocaleLowerCase('ko').includes(query)||c.name.toLowerCase().includes(query))):[];
 const preview=c?`<figure class="draft-preview">${v2ChampionArt(c,'splash',true)}<figcaption>${sv2Name(s,c.id)}</figcaption></figure>`:'';
 return `<section class="draft-centre panel"><div class="draft-phase"><small>${turn?(turn.index+1)+'/20번째 순서 · 우리 팀 차례':'모든 선택 완료'}</small><h2>${turn?(turn.kind==='B'?'금지할 챔피언 선택':'우리 팀 챔피언 선택'):'밴픽 확정'}</h2><p class="hint">이전 세트 사용 제한 ${s.ctx.fearless?s.ctx.used.length:0}개 · 챔피언 초상을 눌러 검토하세요.</p></div>${preview}${turn?`<label class="field">챔피언 검색<input class="input" id="official-search" value="${v2Esc(o.query)}" autocomplete="off"></label><div class="filter-row">${['ALL',...ROLES].map(r=>`<button class="chip ${o.role===r?'selected':''}" data-official-role="${r}">${r==='ALL'?'전체':v2Esc(ROLE_KO[r])}</button>`).join('')}</div><div class="champion-grid" aria-label="챔피언 선택 목록">${rows.map(c=>`<button class="champion-card" data-official-champ="${c.id}" aria-label="${sv2Name(s,c.id)} 검토" aria-pressed="${o.selected===c.id}">${v2ChampionArt(c)}<span>${sv2Name(s,c.id)}</span></button>`).join('')||'<p>선택할 수 있는 챔피언이 없습니다.</p>'}</div><div class="draft-confirm"><span>${c?sv2Name(s,c.id):'챔피언을 고르세요'}</span><button class="btn btn-primary" id="official-lock"${!c?' disabled':''}>${turn.kind==='B'?'금지':'선택'} 확정</button></div>`:'<p>실제 경기 엔진으로 진행합니다. 승패는 넥서스 종료 결과로 기록합니다.</p><button class="btn btn-primary" id="official-finish">이 밴픽으로 경기 진행</button>'}</section>`;
}

function v2OfficialResultView(){const r=V2.officialResult;if(!r)return '';const g=r.game;return `<section class="panel"><h2>방금 끝난 공식 경기</h2><p>${v2Esc(V2.db.teams[g.winner]?.name||g.winner)} 승 · ${v2Esc(g.ending?.kind==='nexus'?'넥서스 파괴':g.ending?.kind||'종료 사유 확인')}</p><p>${r.score.join(' : ')} · ${r.done?'시리즈 종료':'다음 세트 준비 대기'}</p></section>`;}
function v2BindOfficial(){
 v2Bind('#official-contact',()=>{const c=v2CurrentContact();if(c)v2OpenNegotiation(c.id)});
 v2Bind('#official-resume',()=>{if(V2.official?.mode==='running')v2ResolveOfficialGame(null)});
 v2BindChampionArt();
 v2Bind('#official-open',()=>v2OfficialOpen());v2Bind('#official-pause',()=>{if(V2.official)V2.official.open=false;v2Render();document.getElementById('official-open')?.focus({preventScroll:true});});v2Bind('#official-discard',()=>{V2.official=null;v2Tell('미완료 준비 입력만 취소했습니다. 저장된 경기와 선택권은 유지합니다');v2Render();});
 v2Bind('[data-official-kind]',el=>v2OfficialSelect(el.dataset.officialKind,el.dataset.officialValue));
 v2Bind('[data-official-champ]',el=>{if(!v2OfficialCurrent())return;V2.official.selected=el.dataset.officialChamp;v2Render();});v2Bind('[data-official-role]',el=>{if(!v2OfficialCurrent())return;V2.official.role=el.dataset.officialRole;v2Render();});
 v2Bind('#official-lock',()=>v2OfficialConfirm());v2Bind('#official-finish',()=>v2OfficialFinish());
 const search=document.getElementById('official-search'),current=v2Guard();if(search)search.oninput=()=>{if(!current()||!v2OfficialCurrent())return;V2.official.query=search.value;v2Render();document.getElementById('official-search')?.focus({preventScroll:true});};
}
