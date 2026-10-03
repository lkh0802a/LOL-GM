import {runEngineFixture,artifactSource} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error('DRAFT_ORDER_META '+m)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,system:'franchise'}),regionCfg('EU',{teams:4,system:'franchise'})];cfg.internationals=[];
 const db=buildWorld(cfg),a=activeTeams(db,'NA',1)[0],b=activeTeams(db,'EU',1)[0];
 for(const t of [a,b])for(const role of ROLES){const p=genPlayer(db,new RNG(t.id+role),{region:t.region,role,age:22,base:65});signContract(db,p,t,1,3);t.depthChart[role]=p.id}
 const ai=simulateMatch(db,a.id,b.id,'order-ai',{used:[],byTeam:{},firstPick:1},true);ai.metaContext={international:true,season:'ORDER',year:db.year};recordMeta(db,ai);
 const sequence=ai.draft.sequence;check(sequence&&sequence.firstPick===1&&sequence.events.length===20&&sequence.events[6][2]===1,'AI first-pick=1 chronology lost or inferred blue');
 const opening=sequence.events.find(e=>e[1]==='P'),cid=opening[3],pick=ai.sides[1].ps.find(x=>x.champ.id===cid),filter={team:b.id,player:pick.p.id,position:pick.role,color:'RED',scope:'INTL'},stats=draftOrderInsights(db,cid,filter);
 check(stats.appearances===1&&stats.known===1&&stats.opening===1&&stats.followup===0&&stats.slots[0]===1&&stats.openingWins===(ai.winner===1?1:0),'opening result/side/slot wrong');
 const later=sequence.events.filter(e=>e[1]==='P'&&e[2]===1)[2][3],laterStats=draftOrderInsights(db,later,{team:b.id,color:'RED'});check(laterStats.followup===1&&laterStats.opening===0&&laterStats.slots[2]===1&&laterStats.preceding.length===2,'follow-up or preceding teammates wrong');
 check(draftOrderInsights(db,cid,{...filter,color:'BLUE'}).appearances===0&&draftOrderInsights(db,cid,{...filter,region:'NA'}).appearances===0&&draftOrderInsights(db,cid,{...filter,position:pick.role==='MID'?'TOP':'MID'}).appearances===0,'actor/role/color intersections ignored');
 // Complete real legal choices through the manual API using its legal AI
 // candidate selector, not injected event arrays or synthetic role order.
 const ctx={practice:true,used:[],byTeam:{},firstPick:1},state=createDraftSession(db,[b.id,a.id],new RNG('order-manual'),ctx);
 while(draftTurn(state)){const choice=draftAiChoice(state);check(choice,'legal manual candidate missing');draftApplyChoice(state,{kind:choice.kind,side:choice.side,champ:choice.champ,source:'manual'})}
 const manual=draftResult(state);check(manual.sequence&&manual.sequence.events.every((e,i)=>e[0]===i)&&manual.log.every((e,i)=>e.turn===i),'manual choices did not retain actual turn numbers');
 db.worldDate=addDays(db.worldDate,1);const mg=simulateMatch(db,b.id,a.id,'order-manual-game',{forced:manual,firstPick:1},true);recordMeta(db,mg);
 check(JSON.stringify(mg.draft.sequence)===JSON.stringify(manual.sequence)&&mg.draft.sequence!==manual.sequence,'manual forced match lost or aliased captured chronology');
 db.worldDate=addDays(db.worldDate,1);const oldForced={picks:ai.draft.picks,bans:ai.draft.bans},fg=simulateMatch(db,a.id,b.id,'order-no-provenance',{forced:oldForced,firstPick:1},true);fg.metaContext={international:true};recordMeta(db,fg);
 const expected=draftOrderInsights(db,cid,filter);check(expected.appearances===2&&expected.known===1&&expected.unknown===1&&!Object.hasOwn(db.metaHistory[2],'draftSequence'),'production forced role-order path fabricated chronology');
 const saved=unpackDB(packDB(db));check(JSON.stringify(draftOrderInsights(saved,cid,filter))===JSON.stringify(expected),'full save changed opening results');
 const raw=JSON.stringify(db.metaHistory),counters=JSON.stringify([db.metaStats,db.regionMetaStats,db.metaGames]),row=db.metaHistory[0];check(row.draftSequence!==sequence&&row.draftSequence.events[0]!==sequence.events[0],'recording aliases mutable live sequence');
 const packed=packMetaHistory(db.metaHistory);check(packed[0].length===13&&JSON.stringify(packMetaHistory(unpackMetaHistory(JSON.parse(JSON.stringify(packed)))))===JSON.stringify(packed),'extended compact row roundtrip');
 check(stringifyMetaHistory(Array.from({length:520},()=>row))===JSON.stringify(packMetaHistory(Array.from({length:520},()=>row))),'bounded streaming chronology mismatch');
 const legacy=JSON.parse(raw)[0];delete legacy.draftSequence;const legacyDb={...db,metaHistory:[legacy]},ls=draftOrderInsights(legacyDb,cid,filter);check(ls.appearances===1&&ls.known===0&&ls.unknown===1&&packMetaHistory([legacy])[0].length===12,'legacy array order inferred or old row layout rewritten');
 const oldPacked=packMetaHistory([legacy]);check(!Object.hasOwn(unpackMetaHistory(JSON.parse(JSON.stringify(oldPacked)))[0],'draftSequence'),'old compact record gained synthetic chronology');
 const forced=runDraft(db,[a.id,b.id],new RNG('order-old-forced'),{forced:{picks:ai.draft.picks,bans:ai.draft.bans}});check(!forced.sequence&&forced.pickOrder.length===2,'forced role order falsely labeled actual');
 const broken=JSON.parse(raw)[0];broken.draftSequence.events[6][2]=0;check(draftOrderInsights({...db,metaHistory:[broken]},cid,filter).unknown===1,'conflicting actual turn accepted');
 const skipped=JSON.parse(raw)[0];skipped.draftSequence.events.pop();check(draftOrderInsights({...db,metaHistory:[skipped]},cid,filter).unknown===1,'incomplete event log inferred');
 const changed=JSON.parse(raw)[0];changed.sides[1].bans[0]='DIFFERENT';check(draftOrderInsights({...db,metaHistory:[changed]},cid,filter).unknown===1,'sequence final-ban mismatch accepted');
 const oldClub=db.players[pick.p.id].team;db.players[pick.p.id].team=a.id;check(JSON.stringify(draftOrderInsights(db,cid,filter))===JSON.stringify(expected),'current membership changed order history');db.players[pick.p.id].team=oldClub;
 check(JSON.stringify(db.metaHistory)===raw&&JSON.stringify([db.metaStats,db.regionMetaStats,db.metaGames])===counters,'query mutated source/weights');
 DB={...db,metaHistory:[row,legacy]};PSET={role:'ALL',q:'',region:'GLOBAL',patch:'ALL',comp:'ALL',period:'ALL',year:'',season:'ALL',split:'ALL',league:'ALL',scope:'INTL',position:pick.role,team:b.id,player:pick.p.id,opponent:a.id,color:'RED',playerSearch:'',champ:cid};
 const page=viewPatch();check(page.includes('id="champdraftorder"')&&page.includes('순서 확인 1쪽 · 미상 1쪽')&&page.includes('전체 첫 픽 1전')&&page.includes('인과적 우위'),'actual page lost chronology scope/coverage/limits');
 check(patchDraftOrderCard(db,cid,{patch:'unknown'}).includes('출전 0쪽'),'empty report invented sample');
 const cached=draftOrderInsights(db,cid,filter);check(draftOrderInsights(db,cid,filter)===cached,'unchanged order query missed cache');
 const appended=JSON.parse(raw)[0];db.metaHistory.push(appended);check(draftOrderInsights(db,cid,filter).opening===2,'append retained stale chronology');db.metaHistory=[legacy];check(draftOrderInsights(db,cid,filter).unknown===1,'replacement retained stale chronology');db.metaHistory.length=0;check(draftOrderInsights(db,cid,filter).appearances===0,'truncation retained stale chronology');
 for(let i=0;i<90;i++)draftOrderInsights(db,cid,{year:2100+i});check(META_DRAFT_ORDER_CACHE.get(metaHistoryIndex(db)).queries.size<=META_FILTER_CACHE_LIMIT,'order query cache grew unbounded');
 console.log('DRAFT_ORDER_META_ACCEPTANCE '+JSON.stringify({realMatches:3,actualManualChoices:20,firstPickIndependent:true,turnValidation:true,manualForcedPreserved:true,legacyForcedUnknown:true,saveCompatibility:true,sourcePure:true,actualUi:true,appendReplacement:true}));
})();`,{setupSources:["let DB,PSET;const esc=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;');",await artifactSource('ui-patch.js')]});
