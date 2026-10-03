import {runEngineFixture,artifactSources} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error('CHAMPION_SCOUT '+m)},copy=x=>JSON.parse(JSON.stringify(x));
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,div2:false,system:'franchise',splits:1,legs:1,regularBo:1,playoffBo:1,playoffTake:2})];cfg.internationals=[];cfg.subs=0;cfg.changes='none';
 const db=buildWorld(cfg),[a,b,c,d]=activeTeams(db,'NA',1);setManagedTeam(db,a.id);
 for(const t of [a,b,c,d])for(const role of ROLES){const p=genPlayer(db,new RNG(t.id+role),{region:t.region,role,age:22,base:65});signContract(db,p,t,1,3);t.depthChart[role]=p.id}
 startWorldSeason(db,a.id,'champion-scout-season');DB=db;
 const match=simulateMatch(db,a.id,b.id,'champion-scout-source',null,true);recordMeta(db,match);
 const p=db.players[b.depthChart.MID],pick=db.metaHistory[0].sides.find(s=>s.team===b.id).picks.find(x=>x.player===p.id),cid=pick.champ,
  unknown=Object.keys(db.patch.champions).find(x=>x!==cid),ctx={used:[],byTeam:{[a.id]:{won:[],lost:[]},[b.id]:{won:[],lost:[]}}};
 const state=createDraftSession(db,[a.id,b.id],new RNG('champion-scout-draft'),ctx);
 check(!championScoutObservation(db,a,p,cid).known,'public count became mastery');
 p.pool[cid].mastery=70;p.pool[unknown]={mastery:99};
 const pub=JSON.stringify(publicPlayerChampions(db,p)),cost=.1*psOf(db,a.region);
 check(scoutPlayers(db,[p.id],40,cost).includes('갱신'),'actual paid human visit failed');
 const report=db.scout[p.id],snapshot=report.championObservations[cid],observed=championScoutObservation(db,a,p,cid);
 check(observed.known&&snapshot.observer===a.id&&snapshot.source==='investigation'&&snapshot.appearances===1,'human snapshot provenance missing');
 check(Object.keys(report.championObservations).join()===cid&&!championScoutObservation(db,a,p,unknown).known,'hidden champion identity leaked');
 check(!championScoutObservation(db,c,p,cid).known,'human report leaked into AI');
 observeAiPlayer(db,c,p,22,{comp:'SCOUT:NA',games:0});
 check(championScoutObservation(db,c,p,cid).known&&!championScoutObservation(db,d,p,cid).known&&c.scoutingState.reports[p.id].championObservations[cid]!==snapshot,'AI observers share reports');
 check(championScoutObservation(db,{...c,id:'AI_RESERVE',parent:c.id},p,cid).known,'AI owned reserve did not share parent department');
 const aiState=createDraftSession(db,[c.id,b.id],new RNG('champion-scout-ai-draft'),{used:[],byTeam:{}});
 const ai=championScoutObservation(db,c,p,cid),saved=JSON.stringify(observed),aiSaved=JSON.stringify(ai);p.pool[cid].mastery=25;
 check(JSON.stringify(championScoutObservation(db,a,p,cid))===saved&&JSON.stringify(championScoutObservation(db,c,p,cid))===aiSaved,'reader sampled live mastery');
 const pool=p.pool;Object.defineProperty(p,'pool',{configurable:true,get(){throw Error('reader accessed private pool')}});
 const before=JSON.stringify(db.scout),rng=JSON.stringify(state.rng);
 check(draftMasteryObservation(state,0,1,p,cid).known&&draftMasteryObservation(state,0,1,p,cid).value===observed.value,'draft did not consume saved signal');
 check(draftMasteryObservation(aiState,0,1,p,cid).value===ai.value&&draftValidateChoice(aiState,draftAiChoice(aiState)).ok,'AI draft did not consume its saved observer report');
 const analysis=draftCandidateAnalysis(state,0,cid);check(analysis.opponentPool.some(x=>x.player===p.name&&x.known&&x.selectedRange.join()===observed.range.join()),'ban evidence missing saved range');
 DRAFT_UI={state,playerSide:0,selected:cid};check(draftUiAnalysisContent().includes('숙련 추정'),'ban UI disconnected');
 check(playerChampionPanel(p).includes('저장 숙련 추정')&&scoutReportSummary(p).includes('숙련 추정'),'player UI disconnected');
 draftShortlist(state,1,'MID',0);draftPickValue(state,1,'MID',cid,[],0);firstSelectionEvidence(db,a.id,b.id,ctx);
 check(JSON.stringify(db.scout)===before&&JSON.stringify(state.rng)===rng,'evidence mutated reports/RNG');
 Object.defineProperty(p,'pool',{configurable:true,writable:true,value:pool});
 const restored=unpackDB(packDB(db));check(JSON.stringify(championScoutObservation(restored,restored.teams[a.id],restored.players[p.id],cid))===saved&&JSON.stringify(championScoutObservation(restored,restored.teams[c.id],restored.players[p.id],cid))===aiSaved,'save lost observer signals');
 for(const broken of [{observer:d.id},{player:'missing'},{champ:unknown},{date:addDays(db.worldDate,1)},{date:'2027-02-30'},{estimate:100},{uncertainty:-1},{knowledge:99},{source:'public'},{appearances:0},{evidenceTo:addDays(db.worldDate,1)}]){
   report.championObservations[cid]={...snapshot,...broken};const loaded=unpackDB(packDB(db));check(!championScoutObservation(loaded,loaded.teams[a.id],loaded.players[p.id],cid).known,'invalid saved signal trusted '+JSON.stringify(broken));
 }
 report.championObservations[cid]=snapshot;
 const date=db.worldDate;db.worldDate=addDays(date,730);db.year+=2;ageScoutReports(db);
 const stale=championScoutObservation(db,a,p,cid);check(stale.value===observed.value&&stale.range[0]<=observed.range[0]&&stale.range[1]>=observed.range[1]&&stale.confidence<observed.confidence&&stale.staleYears>=2,'ageing refreshed hidden mastery or failed to widen');
 db.worldDate=date;db.year-=2;
 check(scoutPlayers(db,[p.id],40,cost).includes('갱신')&&championScoutObservation(db,a,p,cid).value!==observed.value,'reobservation did not update actual changed skill');
 check(JSON.stringify(publicPlayerChampions(db,p))===pub,'observation changed public counts');
 // Late batch failure must restore the nested snapshot and original objects.
 const q=db.players[c.depthChart.MID],other=simulateMatch(db,a.id,c.id,'champion-scout-second',null,true);recordMeta(db,other);
 scoutPlayers(db,[q.id],40,cost);const refs=[db.scout,db.scout[p.id],db.scout[p.id].championObservations,db.scout[p.id].championObservations[cid]],full=JSON.stringify(db),original=observePlayer;
 observePlayer=(state,target,gain,opt)=>{original(state,target,gain,opt);if(target.id===q.id)throw Error('late nested snapshot failure')};
 check(scoutPlayers(db,[p.id,q.id],40,cost*2).includes('처리 실패'),'late human failure unhandled');observePlayer=original;
 check(JSON.stringify(db)===full&&refs.every((x,i)=>x===[db.scout,db.scout[p.id],db.scout[p.id].championObservations,db.scout[p.id].championObservations[cid]][i]),'nested report/cash/staff rollback changed state or references');
 // Run the real finance-backed AI operation with one eligible player.
 for(const x of Object.values(db.players))if(!x.team)x.retired=true;
 p.contract.until=db.year-1;c.finance.cash=10000;
 const operation=aiRunScoutingOperation(db,c);check(operation.targets.some(x=>x.pid===p.id),'real AI operation did not observe target');
 const aiFull=JSON.stringify(db),pay=payFinancePrepaid;
 payFinancePrepaid=(t,k,n)=>{pay(t,k,n);if(k==='scoutingExpense')throw Error('late AI payment')};
 let failed=false;try{aiRunScoutingOperation(db,c)}catch{failed=true}payFinancePrepaid=pay;
 check(failed&&JSON.stringify(db)===aiFull,'AI nested report/cash/expertise rollback failed');
 // Actual scheduled series are archived before the production day hook.
 const season=Object.values(db.world.seasons).find(s=>s.region==='NA'&&s.div===1),day=season.days[0];db.worldDate=day.date;
 const played=playDay(db,season);check(played.finalized&&day.matches.some(m=>m.res),'scheduled series not completed');scoutFromDay(db,season,day);
 const official=Object.values(db.scout).flatMap(r=>Object.values(r.championObservations||{})).filter(s=>s.date===day.date&&s.source==='official');
 check(official.length>0&&official.every(s=>s.evidenceTo===day.date),'real day hook omitted attributed champion observations');
 check(activeTeams(db,'NA',1).filter(t=>t.id!==a.id).some(t=>Object.values(t.scoutingState?.reports||{}).some(r=>Object.values(r.championObservations||{}).some(s=>s.source==='official'&&s.date===day.date))),'AI real day observation missing');
 db.world.fired=true;check(!championScoutObservation(db,a,p,cid).known,'fired manager retains private report access');db.world.fired=false;
 const legacy=copy(db.scout[p.id]);db.scout[p.id]=98;check(!championScoutObservation(db,a,p,cid).known,'legacy knowledge becomes numerical estimate');db.scout[p.id]=legacy;
 console.log('CHAMPION_SCOUT_OBSERVATION_ACCEPTANCE PASS paid human/AI snapshots, public identity boundary, independent observers, live pool traps, draft/player UI, save invalid/legacy/future, ageing/reobserve, nested rollback, actual scheduled day hooks');
})();`,{timeout:60000,setupSources:["let DB,DRAFT_UI;const esc=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');",...(await artifactSources(['ui-draft.js','ui-player.js','ui-player-champions.js']))]});
