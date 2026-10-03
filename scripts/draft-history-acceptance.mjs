import {runEngineFixture,artifactSources} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error('DRAFT_HISTORY '+m)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,div2:true,system:'franchise'})];cfg.internationals=[];
 const db=buildWorld(cfg),[a,b]=activeTeams(db,'NA',1),reserve=reserveTeamsOf(db,a)[0];setManagedTeam(db,a.id);
 for(const t of [a,b,reserve])for(const role of ROLES){const p=genPlayer(db,new RNG('history|'+t.id+role),{region:t.region,role,age:22,base:65});signContract(db,p,t,1,3);t.depthChart[role]=p.id}
 db.world={year:db.year,seed:'draft-history',phase:'season',manage:'manual',seasons:{}};
 const session=createSeriesSession(db,a.id,b.id,1,'history-official',{fearless:true,compId:'history-cup'}),cur=seriesSessionPrepareGame(db,session),side=cur.blue===a.id?0:1,
   state=createDraftSession(db,[cur.blue,cur.red],new RNG(cur.gseed,'draft'),{...cur.snap,firstPick:cur.fpTeam===cur.blue?0:1});
 while(draftTurn(state)){const t=draftTurn(state),choice=draftAiChoice(state);if(t.side===side&&t.kind==='P')choice.source='player';draftApplyChoice(state,choice)}
 const forced=draftResult(state);check(forced.manualEvidence.length===5,'writer did not capture real own five picks');
 const pristine=packDB(db),plainSession=createSeriesSession(db,a.id,b.id,1,'history-official',{fearless:true,compId:'history-cup'});
 const enemyPick=forced.sequence.events.find(e=>e[1]==='P'&&e[2]!==side),prefix=forced.sequence.events.filter(e=>e[0]<enemyPick[0]&&e[1]==='P'),forgedEnemy={...forced.manualEvidence[0],team:b.id,turn:enemyPick[0],champ:enemyPick[3],ownPicks:prefix.filter(e=>e[2]!==side).map(e=>e[3]),opponentPicks:prefix.filter(e=>e[2]===side).map(e=>e[3]),opponentRoles:[]};
 const plainDb=unpackDB(pristine);playSeriesSessionGame(plainDb,plainSession,{picks:forced.picks,bans:forced.bans,sequence:forced.sequence,manualEvidence:[forgedEnemy]},true);check(!plainSession.games[0].draftEvidence,'foreign forged private writer admitted');
 const played=playSeriesSessionGame(db,session,forced,true),series=seriesSessionResult(db,session),game=series.rec.games[0],report=recordedDraftReview(db,series.rec,game);
 check(played.done&&report.rows.length===5&&validDraftSequence(game.draftSequence,game.picks,game.bans),'official result sequence/evidence');
 check(session.games[0].winner===plainSession.games[0].winner&&JSON.stringify(session.lines)===JSON.stringify(plainSession.lines)&&JSON.stringify(packMetaHistory(db.metaHistory))===JSON.stringify(packMetaHistory(plainDb.metaHistory)),'snapshot changed seeded match or public meta');
 check(!JSON.stringify(db.metaHistory).includes('draftEvidence')&&!game.draftEvidence[b.id],'private evidence entered public meta/opponent report');
 const reportBefore=JSON.stringify(report),oldPool=db.players[a.depthChart.MID].pool;
 db.players[a.depthChart.MID].pool={};a.tactics.scaling_preference=99;
 check(JSON.stringify(recordedDraftReview(db,series.rec,game))===reportBefore,'archive recomputed current private state');db.players[a.depthChart.MID].pool=oldPool;
 const publicSequence=JSON.stringify(game.draftSequence),foreign={...game,draftEvidence:{}};
 Object.defineProperty(foreign.draftEvidence,b.id,{get(){throw Error('foreign private archive read')}});
 check(!recordedDraftReview(db,series.rec,foreign,b.id).allowed,'foreign evidence authority');
 check(recordedDraftReview(db,series.rec,{...game,draftEvidence:undefined}).reason==='not-recorded','legacy invented snapshot');
 const corrupt=JSON.parse(JSON.stringify(game));corrupt.draftEvidence[a.id][0].opponentPicks.push('fake');
 check(recordedDraftReview(db,series.rec,corrupt).rows.length===4,'forged public context admitted');
 const future=JSON.parse(JSON.stringify(game));future.draftEvidence[a.id].forEach(e=>e.date='2099-01-01');
 check(recordedDraftReview(db,series.rec,future).reason==='unverified-source','future snapshot admitted');
 const malformed=JSON.parse(JSON.stringify(game));malformed.draftSequence.events=[];
 check(recordedDraftReview(db,series.rec,malformed).reason==='unverified-source','invalid sequence crashed/accepted');
 check(recordedDraftReview(db,series.rec,{...game,picks:undefined}).reason==='unverified-source','missing saved picks crashed');
 const tiny=seriesResultForSave(series.rec,true);check(tiny.lite&&JSON.stringify(tiny.games[0].draftEvidence)===JSON.stringify(game.draftEvidence)&&JSON.stringify(tiny.games[0].draftSequence)===publicSequence,'lite compaction deleted evidence/identity');
 db.world.seasons.history={id:'history',region:'EU',done:true,comp:'history-cup',days:[{matches:[{res:series.rec}]}]};
 const saved=packDB(db),loaded=unpackDB(saved),restored=loaded.world.seasons.history.days[0].matches[0].res;
 check(restored.lite&&JSON.stringify(recordedDraftReview(loaded,restored,restored.games[0]))===reportBefore,'full lite save continuity');
 check(!series.rec.lite&&game.draftEvidence[a.id].length===5,'save mutated live history');
 // Public sequence and private evidence survive pending-session saves too.
 db.world.pendingOfficial={queue:[{session}]};const pending=unpackDB(packDB(db)).world.pendingOfficial.queue[0].session;
 check(JSON.stringify(pending.games[0].draftEvidence)===JSON.stringify(game.draftEvidence),'pending evidence save');
 DB=db;const html=renderRecordedDraftReview(db,series.rec,game);check(html.includes('당시 수동 밴픽 검토 5건')&&html.includes('최종 역할')&&html.includes('현재 챔피언 정보'),'review UI disconnected');
 const button={dataset:{draftHistoryTeam:a.id,draftHistoryGame:'1',draftHistoryTurn:String(report.rows[0].turn),draftHistoryKind:'champ'}};
 const root={querySelectorAll:()=>[button]};bindRecordedDraftReview(root,series.rec);button.onclick();check(navigation.at(-1)==='patch'&&PSET.champ===report.rows[0].champ,'source navigation');
 button.dataset.draftHistoryTeam=b.id;const oldNav=navigation.length;button.onclick();check(navigation.length===oldNav,'forged source button');
 db.world.fired=true;check(!recordedDraftReview(db,series.rec,game).allowed&&!renderRecordedDraftReview(db,series.rec,game),'fired UI');db.world.fired=false;
 setManagedTeam(db,reserve.id);check(!recordedDraftReview(db,series.rec,game,a.id).allowed,'reserve parent archive');setManagedTeam(db,a.id);
 const frozen=packDB(db);recordedDraftReview(db,series.rec,game);renderRecordedDraftReview(db,series.rec,game);check(packDB(db)===frozen,'review writes world');
 // Complete a genuinely scheduled Bo3 through the pending/commit pipeline.
 const official=buildWorld(cfg),[oa,ob]=activeTeams(official,'NA',1);setManagedTeam(official,oa.id);
 for(const t of [oa,ob])for(const role of ROLES){const p=genPlayer(official,new RNG('scheduled-history|'+t.id+role),{region:t.region,role,age:22,base:65});signContract(official,p,t,1,3);t.depthChart[role]=p.id}
 const cid='scheduled-history';official.competitions[cid]={id:cid,name:'기록 검증 대회',region:'NA',teams:[oa.id,ob.id],rules:{fearless:true},stages:[{id:'group',name:'풀리그',type:'round_robin',legs:2,bestOf:3}]};
 const season=newSeason(official,cid,official.year,'scheduled-history',official.worldDate),day=season.days[0],match=day.matches[0];
 official.world={year:official.year,seed:'scheduled-history',manage:'manual',phase:'season',seasons:{scheduled:season},steps:[],step:-1,pendingOfficial:{date:day.date,queue:[{seasonKey:'scheduled',matchId:match.id}]}};official.worldDate=day.date;
 let completed;
 for(let n=0;n<3&&official.world.pendingOfficial;n++){
  const prompt=pendingOfficialSelectionSetup(official).prompt;applyPendingOfficialSelection(official,{kind:prompt.remaining||'order',value:prompt.remaining==='side'?'blue':'first'});
  const setup=pendingOfficialDraftSetup(official),own=setup.blue===oa.id?0:1,live=createDraftSession(official,[setup.blue,setup.red],new RNG(setup.gseed,'draft'),{...setup.draftCtx,firstPick:setup.fpTeam===setup.blue?0:1});
  while(draftTurn(live)){const t=draftTurn(live),choice=draftAiChoice(live);if(t.side===own&&t.kind==='P')choice.source='player';draftApplyChoice(live,choice)}
  const done=draftResult(live),before=JSON.stringify(live.manualEvidence);let rejected=false;try{draftApplyChoice(live,{champ:done.manualEvidence[0].champ,source:'player'})}catch{rejected=true}
  check(rejected&&JSON.stringify(live.manualEvidence)===before,'duplicate capture after completed draft');
  completed=resolvePendingOfficialMatch(official,done);
  if(!completed.done){const old=packDB(official),rest=unpackDB(old);check(rest.world.pendingOfficial.queue[0].session.games.at(-1).draftEvidence[oa.id].length===5,'actual pending save');}
 }
 check(completed.done&&match.res===completed.rec&&match.res.games.length>=2&&!official.world.pendingOfficial,'official complete/commit/queue');
 check(match.res.games.every(g=>recordedDraftReview(official,match.res,g).rows.length===5),'committed source review');
 const committed=packDB(official);let repeated=false;try{resolvePendingOfficialMatch(official,{})}catch{repeated=true}check(repeated&&packDB(official)===committed,'duplicate official completion');
 const loadedOfficial=unpackDB(committed),loadedRec=loadedOfficial.world.seasons.scheduled.days[0].matches[0].res;
 check(JSON.stringify(recordedDraftReview(loadedOfficial,loadedRec,loadedRec.games[0]))===JSON.stringify(recordedDraftReview(official,match.res,match.res.games[0])),'committed official history reload');
 console.log('DRAFT_HISTORY_ACCEPTANCE PASS actual manual writer/official result/public sequence/private event snapshots, exact seeded lines/meta parity, changed-current-state independence, malformed/future/authority/foreign getter guard, lite/pending/full saves, pure review and source navigation');
})()`,{timeout:60000,setupSources:[`let DB,PSET={},SQUAD,OPEN_P;const navigation=[];const esc=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');function navigateTo(v){navigation.push(v)}`, ...await artifactSources(['ui-draft-history.js'])]});
