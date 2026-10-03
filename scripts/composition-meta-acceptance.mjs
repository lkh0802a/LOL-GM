import {runEngineFixture,artifactSource} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error('COMPOSITION_META '+m)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,system:'franchise'}),regionCfg('EU',{teams:4,system:'franchise'})];cfg.internationals=[];
 const db=buildWorld(cfg),[a,c]=activeTeams(db,'NA',1),b=activeTeams(db,'EU',1)[0];
 for(const t of [a,b,c])for(const role of ROLES){const p=genPlayer(db,new RNG(t.id+role),{region:t.region,role,age:22,base:65});signContract(db,p,t,1,3);t.depthChart[role]=p.id}
 const play=(x,y,seed,forced)=>{const r=simulateMatch(db,x.id,y.id,seed,forced?{forced}:null,true);r.metaContext={international:x.region!==y.region,season:'PAIRS',year:db.year,split:1};recordMeta(db,r);return r};
 const first=play(a,b,'pairs-one');db.worldDate=addDays(db.worldDate,1);const second=play(b,a,'pairs-two',{picks:[first.draft.picks[1],first.draft.picks[0]],bans:[first.draft.bans[1],first.draft.bans[0]]});db.worldDate=addDays(db.worldDate,1);play(a,c,'pairs-other');
 const pid=a.depthChart.MID,cid=first.sides[0].ps.find(p=>p.p.id===pid).champ.id,teammates=first.sides[0].ps.filter(p=>p.p.id!==pid).map(p=>p.champ.id),filter={team:a.id,opponent:b.id,player:pid,position:'MID',scope:'INTL'},raw=JSON.stringify(db.metaHistory),counters=JSON.stringify([db.metaStats,db.regionMetaStats,db.metaGames]);
 const result=championCompositionInsights(db,cid,filter),wins=[first,second].filter(r=>r.sides[r.winner].team.id===a.id).length;
 check(result.sample===2&&result.complete===2&&result.partial===0&&result.pairs.length===4,'same-side sample or complete composition wrong');
 for(const id of teammates){const p=result.pairs.find(x=>x.champ===id);check(p&&p.g===2&&p.w===wins&&p.wr===wins/2&&p.presence===1,'pair result or denominator wrong')}
 check(!result.pairs.some(x=>first.sides[1].ps.some(p=>p.champ.id===x.champ))&&!result.pairs.some(x=>x.champ===cid),'opponent or anchor counted as a teammate');
 check(championCompositionInsights(db,cid,{...filter,color:'BLUE'}).sample===1&&championCompositionInsights(db,cid,{...filter,color:'RED'}).sample===1,'colors collided in cache');
 check(championCompositionInsights(db,cid,{...filter,region:'EU'}).sample===0&&championCompositionInsights(db,cid,{...filter,position:'TOP'}).sample===0&&championCompositionInsights(db,cid,{...filter,player:b.depthChart.MID}).sample===0,'actor filters matched different sides/picks');
 check(championCompositionInsights(db,cid,{...filter,from:'2999-01-01'}).sample===0&&championCompositionInsights(db,cid,{...filter,patch:'unknown'}).sample===0,'temporal/patch filters ignored');
 check(championCompositionInsights(db,cid,filter)===result,'unchanged query missed cache');
 const restored=unpackDB(packDB(db));check(JSON.stringify(championCompositionInsights(restored,cid,filter))===JSON.stringify(result),'full save changed composition results');
 const draftState=createDraftSession(db,[a.id,b.id],new RNG('pairs-visible-draft'),{practice:true,used:[],byTeam:{[a.id]:{won:[],lost:[]},[b.id]:{won:[],lost:[]}}});
 // An injected public-pick state exercises the real candidate/UI path; it is
 // not claimed as a played manual draft sequence.
 draftState.pickList[0]=[teammates[0]];draftState.taken.add(teammates[0]);draftState.cursor=6;
 const live=draftCompositionEvidence(draftState,0,cid,.12),samePatch=championCompositionInsights(db,cid,{team:a.id,patch:db.patch.id});
 check(live.score===.12&&live.observed.sample===samePatch.sample&&live.observed.pairs.some(x=>x.champ===teammates[0]&&x.g>=2),'live draft lost recorded own-club/current-patch co-pick evidence');
 DRAFT_UI={state:draftState,playerSide:0,selected:cid};const draftPage=draftUiAnalysisContent();check(draftPage.includes('이번 패치 우리 구단의 후보 출전')&&draftPage.includes('추천 점수로 환산하지 않습니다'),'actual candidate UI omitted observed history or its limits');
 const ownEvidence=JSON.stringify(live.observed);for(const id of b.roster)for(const v of Object.values(db.players[id].pool||{}))v.mastery=99;check(JSON.stringify(draftCompositionEvidence(draftState,0,cid,.12).observed)===ownEvidence,'hidden opponent mastery changed observed own-club co-picks');
 const firstRow=JSON.parse(raw)[0],legacy=JSON.parse(raw)[0];for(const s of legacy.sides){s.picks=s.picks.map(p=>p.champ);delete s.color}
 const legacyDb={...db,metaHistory:[legacy]};check(championCompositionInsights(legacyDb,cid,{}).sample===1&&championCompositionInsights(legacyDb,cid,{}).pairs.length===4,'known legacy co-picks discarded');
 check(championCompositionInsights(legacyDb,cid,{player:pid}).sample===0&&championCompositionInsights(legacyDb,cid,{position:'MID'}).sample===0&&championCompositionInsights(legacyDb,cid,{color:'BLUE'}).sample===0,'legacy actor/role/color inferred');
 const incomplete=JSON.parse(raw)[0];incomplete.sides[0].picks=[incomplete.sides[0].picks.find(p=>p.champ===cid),incomplete.sides[0].picks.find(p=>p.champ===teammates[0]),null,{champ:null},incomplete.sides[0].picks.find(p=>p.champ===teammates[0])];
 const partial=championCompositionInsights({...db,metaHistory:[incomplete]},cid,filter);check(partial.sample===1&&partial.partial===1&&partial.unknownPicks===2&&partial.pairs.length===1&&partial.pairs[0].g===1,'partial/duplicate source fabricated complete pair counts');
 const oldTeam=db.players[pid].team;db.players[pid].team=c.id;check(championCompositionInsights(db,cid,filter)===result&&championCompositionInsights(db,cid,{team:c.id,player:pid,opponent:b.id}).sample===0,'current club changed archival composition');db.players[pid].team=oldTeam;
 check(JSON.stringify(db.metaHistory)===raw&&JSON.stringify([db.metaStats,db.regionMetaStats,db.metaGames])===counters,'read-only analysis changed source/counters');
 DB=db;PSET={role:'ALL',q:'',region:'GLOBAL',patch:'ALL',comp:'ALL',period:'ALL',year:'',season:'ALL',split:'ALL',league:'ALL',scope:'INTL',position:'MID',team:a.id,player:pid,opponent:b.id,color:'BLUE',playerSearch:'',champ:cid};
 const page=viewPatch();check(page.includes('id="champcomposition"')&&page.includes('선택 챔피언 출전 1쪽')&&page.includes('함께 1전')&&page.includes('다른 포지션도 포함')&&page.includes('인과적 시너지나 픽 순서를 뜻하지 않습니다'),'actual page missing scoped counts or interpretation');
 PSET.color='RED';check(viewPatch().includes('선택 챔피언 출전 1쪽'),'page failed reverse-color query');
 const empty=patchCompositionCard(db,cid,{...filter,patch:'unknown'});check(empty.includes('출전 0쪽')&&empty.includes('표본 없음')&&!empty.includes('NaN'),'empty report invented statistics');
 const archived=JSON.parse(raw)[0];archived.sides[0].picks.find(p=>p.champ===teammates[0]).champ='<ARCHIVED>';const unknownHtml=patchCompositionCard({...db,metaHistory:[archived]},cid,filter);check(unknownHtml.includes('&lt;ARCHIVED&gt;')&&!unknownHtml.includes('· <ARCHIVED>'),'archived ID fallback unescaped or missing');
 const many=Array.from({length:20},(_,i)=>{const r=JSON.parse(raw)[0];r.sides[0].picks.find(p=>p.champ===teammates[0]).champ='ARCHIVE_PAIR_'+String(i).padStart(2,'0');return r}),bounded=championCompositionInsights({...db,metaHistory:many},cid,filter);
 check(bounded.sample===20&&bounded.pairs.length===8&&bounded.pairs.some(x=>x.g===20)&&bounded.pairs.every(x=>x.presence===x.g/20),'display bound changed archive totals or denominator');
 db.metaHistory.push(firstRow);const appended=championCompositionInsights(db,cid,filter);check(appended!==result&&appended.sample===3&&appended.pairs.every(x=>x.g===3),'append retained stale composition query');
 const view={...db};currentPatchMetaSamples(db);currentPatchMetaSamples(view);check(championCompositionInsights(view,cid,filter)===appended,'official shared history view duplicated composition cache');
 db.metaHistory=[firstRow];check(championCompositionInsights(db,cid,filter).sample===1,'replacement retained old cached pairs');db.metaHistory.length=0;check(championCompositionInsights(db,cid,filter).sample===0,'truncation retained old cached pairs');
 for(let i=0;i<90;i++)championCompositionInsights(db,cid,{year:2100+i});check(META_COMPOSITION_CACHE.get(metaHistoryIndex(db)).queries.size<=META_FILTER_CACHE_LIMIT,'composition cache unbounded');
 console.log('COMPOSITION_META_ACCEPTANCE '+JSON.stringify({actualGames:3,controlledDraftRepeat:true,sameSidePairs:true,actorAndColor:true,countsWinsDenominators:true,legacyUnknown:true,partialDuplicates:true,save:true,sourcePure:true,visibleUi:true,liveDraftEvidence:true,hiddenMasteryIndependent:true,boundedDisplay:true,cacheInvalidation:true}));
})();`,{setupSources:["let DB,PSET,DRAFT_UI;const esc=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');",await artifactSource('ui-patch.js'),await artifactSource('ui-draft.js')]});
