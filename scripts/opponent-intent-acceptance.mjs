import {runEngineFixture,artifactSource} from './test-harness.mjs';

await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error('OPPONENT_INTENT '+m)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,system:'franchise'})];cfg.internationals=[];
 const db=buildWorld(cfg),[a,b,manager]=activeTeams(db,'NA',1),teams=[a,b];setManagedTeam(db,manager.id);
 for(const t of teams){
   const analyst=t.staffRoster.find(s=>s.role==='analyst');check(analyst,'employed analyst missing');analyst.rating=70;analyst.specialties={};analyst.analysisFocus='opponent';t.staffRoster=[analyst];
   for(const role of ROLES){const p=genPlayer(db,new RNG(t.id+role),{region:t.region,role,age:22,base:65});signContract(db,p,t,1,3);t.depthChart[role]=p.id;for(const c of Object.values(db.patch.champions))p.pool[c.id]={experience:60,matchup_knowledge:60,confidence:60,scrimExperience:0,trainingExperience:0,scrimSeason:0,trainingSeason:0,...p.pool[c.id],mastery:80}}
 }
 const ctx={practice:true,used:[],fearless:false,byTeam:{[a.id]:{won:[],lost:[]},[b.id]:{won:[],lost:[]}}};
 const state=createDraftSession(db,teams.map(t=>t.id),new RNG('intent-legal'),ctx);
 let manualChamp=null;
 while(draftTurn(state)&&!teams.every((t,i)=>state.log.some(x=>x.side===i&&x.kind==='P'))){let choice=draftAiChoice(state);if(choice.kind==='P'&&!manualChamp){manualChamp=draftLegalChampions(state).at(-1).id;choice={champ:manualChamp,side:choice.side,source:'player'}}check(draftValidateChoice(state,choice).ok,'legal fixture rejected');draftApplyChoice(state,choice)}
 check(state.log.some(x=>x.kind==='P'&&x.champ===manualChamp),'manual legal pick was overridden');
 const original=JSON.stringify(db),rng=JSON.stringify(state.rng),beforeLog=JSON.stringify(state.log),rows=[0,1].map(side=>draftOpponentIntent(state,side,20));
 check(JSON.stringify(db)===original&&JSON.stringify(state.rng)===rng&&JSON.stringify(state.log)===beforeLog,'explanation mutated game/history/random state');
 for(const side of [0,1]){
   const pick=rows[side].find(x=>x.kind==='P'),c=db.patch.champions[pick.champ];
   check(JSON.stringify(pick.roles)===JSON.stringify(c.roles.filter(r=>ROLES.includes(r))),'hidden role narrowed public flex');
   check(pick.observations.every(o=>o.confidence<100&&o.range[0]<o.range[1]&&o.sources.length),'exact private mastery or missing provenance');
   check(!['intentRole','player','mastery','actualMastery'].some(k=>Object.hasOwn(pick,k)),'private truth exposed');
   check(pick.sources.includes('현재 패치 표본 없음')&&pick.globalSample===0,'unknown patch provenance was fabricated');
 }
 db.scout=Object.fromEntries(teams.flatMap(t=>t.roster).map(id=>[id,{knowledge:98,gamesSeen:999}]));
 check(JSON.stringify([0,1].map(side=>draftOpponentIntent(state,side,20)))===JSON.stringify(rows),'unrelated managed-club scout reports leaked to AI observer');
 // The same opponent-specialty contrast applies to each actual observer side.
 for(const side of [0,1]){
   const analyst=teams[side].staffRoster[0],specialized=draftOpponentIntent(state,side,20);
   analyst.analysisFocus='data';const generic=draftOpponentIntent(state,side,20);analyst.analysisFocus='opponent';
   check(specialized.some((x,i)=>x.confidence>generic[i].confidence)&&specialized.every((x,i)=>x.analysis>generic[i].analysis),'opponent expertise did not affect interpretation');
 }
 setManagedTeam(db,a.id);db.scout={};const low=draftOpponentIntent(state,0,20).find(x=>x.kind==='P');
 db.scout=Object.fromEntries(b.roster.map(id=>[id,{knowledge:98,gamesSeen:12,observations:3}]));
 const high=draftOpponentIntent(state,0,20).find(x=>x.kind==='P');
 check(high.information>low.information&&high.confidence>low.confidence&&high.observations.every((o,i)=>o.range[1]-o.range[0]<low.observations[i].range[1]-low.observations[i].range[0]),'own scouting did not narrow ranges and improve interpretation');
 ctx.byTeam[b.id].lost.push(high.champ);const revealed=draftOpponentIntent(state,0,20).find(x=>x.kind==='P');
 check(revealed.reasons.some(x=>x.includes('공개된 상대 픽 재선택')),'revealed opponent series pick ignored');
 const ban=draftOpponentIntent(state,0,20).find(x=>x.kind==='B');ctx.byTeam[a.id].won.push(ban.champ);
 const won=draftOpponentIntent(state,0,20).find(x=>x.champ===ban.champ);
 check(won.confidence>ban.confidence&&won.reasons.some(x=>x.includes('이전 세트 승리')),'observer victory evidence ignored');
 const savedExpected=JSON.stringify(draftOpponentIntent(state,0,20)),saved=unpackDB(packDB(db)),resumed=createDraftSession(saved,[a.id,b.id],new RNG('intent-legal'),JSON.parse(JSON.stringify(ctx)));
 for(const x of state.log){check(draftValidateChoice(resumed,x).ok,'save replay lost legality');draftApplyChoice(resumed,x)}
 check(JSON.stringify(draftOpponentIntent(resumed,0,20))===savedExpected,'save/reconstruction changed observer explanation');
 // A real recorded match supplies current-patch evidence without inventing counters.
 const match=simulateMatch(db,a.id,b.id,'intent-official-record',null,true);recordMeta(db,match);
 const samples=currentPatchMetaSamples(db),known=state.log.find(x=>x.side===1&&samples.stats[x.champ]);
 check(known,'recorded fixture did not overlap public draft');
 const observed=draftOpponentIntent(state,0,20).find(x=>x.champ===known.champ);
 check(observed.globalSample>0&&observed.patch===db.patch.id&&observed.sources.some(x=>x.includes('현재 패치 프로 표본')),'real patch provenance omitted');
 const expected=JSON.stringify(draftOpponentIntent(state,0,20));
 DRAFT_UI={state,playerSide:0};const html=draftUiOpponentIntent();
 check(html.includes('관찰 숙련')&&html.includes('상대 분석팀')&&html.includes('현재 패치')&&html.includes('통계적 확률'),'visible UI lost ranges, provenance or interpretation limits');
 const poisoned=state.log.map(x=>({...x,intentRole:'PRIVATE',player:'PRIVATE',mastery:99}));state.log=poisoned;
 check(JSON.stringify(draftOpponentIntent(state,0,20))===expected,'hidden log fields affected public explanation');
 check(draftOpponentIntent(state,0,0).length===0&&draftOpponentIntent(state,2).length===0,'invalid observer/zero limit returned evidence');
 // Official eligibility uses the same real series view as live draft creation.
 db.world={registrationVersion:1,year:db.year,seasons:{fixture:{id:'fixture',comp:'fixture-comp',staffRegistrationPolicy:{max:2,lockAt:db.year+'-02-01'},staffEntries:{[a.id]:[],[b.id]:[]}}}};
 db.competitions['fixture-comp']={id:'fixture-comp',international:false};
 for(const t of teams)t.registration={year:db.year,players:t.roster.slice(),depthChart:{...t.depthChart},date:db.worldDate,history:[]};
 const session=createSeriesSession(db,a.id,b.id,1,'intent-registration',{metaContext:{season:'fixture'}});
 const view=seriesOfficialView(db,session),official=createDraftSession(view,[a.id,b.id],new RNG('intent-field'),ctx);official.log=state.log;
 const absent=draftOpponentIntent(official,0,20);a.staffRoster[0].rating=99;
 check(JSON.stringify(draftOpponentIntent(official,0,20))===JSON.stringify(absent),'unregistered employee changed official interpretation');
 db.world.seasons.fixture.staffEntries[a.id]=[a.staffRoster[0].id];
 const entered=createDraftSession(seriesOfficialView(db,session),[a.id,b.id],new RNG('intent-field'),ctx);entered.log=state.log;
 check(draftOpponentIntent(entered,0,20).some((x,i)=>x.confidence>absent[i].confidence),'registered opponent analyst did not reach official interpretation');
 console.log('OPPONENT_INTENT_ACCEPTANCE '+JSON.stringify({legalTurns:state.cursor,bothObservers:true,foreignReportIsolation:true,specialty:true,boundedScouting:true,publicSeries:true,currentPatch:true,pure:true,save:true,registeredStaff:true}));
})();`,{setupSources:["let DRAFT_UI=null;const esc=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;');",await artifactSource('ui-draft.js')]});
