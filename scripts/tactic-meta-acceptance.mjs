import {runEngineFixture,artifactSource} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error('TACTIC_META '+m)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,div2:true,system:'franchise'}),regionCfg('EU',{teams:4,system:'franchise'})];cfg.internationals=[];
 const db=buildWorld(cfg),a=activeTeams(db,'NA',1)[0],b=activeTeams(db,'EU',1)[0];setManagedTeam(db,a.id);
 // Focused match fixture: exercise both control modes without advancing a season.
 db.world={year:db.year,phase:'season',manage:'manual',seasons:{},steps:[],step:-1};
 for(const t of [a,b])for(const role of ROLES){const p=genPlayer(db,new RNG(t.id+role),{region:t.region,role,age:22,base:65});signContract(db,p,t,1,3);t.depthChart[role]=p.id}
 a.tactics.aggression=80;db.world.manage='manual';const first=simulateMatch(db,a.id,b.id,'tactic-one',null,true);first.metaContext={international:true,season:'TACTICS',year:db.year};
 check(first.sides[0].tacticContext.values[0]===80&&Object.isFrozen(first.sides[0].tacticContext.values)&&first.sides[1].tacticContext===null,'capture mutated settings or included opponent exact values');
 a.tactics.aggression=20;setManagedTeam(db,b.id);recordMeta(db,first);setManagedTeam(db,a.id);
 check(db.metaHistory[0].sides[0].tacticContext.values[0]===80&&!Object.hasOwn(db.metaHistory[0].sides[1],'tacticContext'),'delayed recording inferred current controller/settings or captured foreign values');
 db.worldDate=addDays(db.worldDate,1);db.world.manage='auto';const second=simulateMatch(db,b.id,a.id,'tactic-two',null,true);second.metaContext={international:true,season:'TACTICS',year:db.year};recordMeta(db,second);
 check(second.sides[1].tacticContext.values[0]===20&&db.metaHistory[1].sides[1].tacticContext.observer===a.id,'delegated capture differs from manual authority');
 const pid=a.depthChart.MID,cid=first.sides[0].ps.find(p=>p.p.id===pid).champ.id,filter={team:a.id,opponent:b.id,player:pid,position:'MID',scope:'INTL'},report=ownTacticInsights(db,filter),axis=report.axes.find(x=>x.key==='aggression'),original=JSON.stringify(db.metaHistory),raw=JSON.stringify([db.metaStats,db.regionMetaStats,db.metaGames]);
 check(report.allowed&&report.sample===2&&report.known===2&&report.unknown===0&&axis.distinct===2&&axis.settings.every(x=>x.g===1),'tactical sample/settings grouping wrong');
 check(axis.settings.find(x=>x.value===80).w===(first.winner===0?1:0)&&axis.settings.find(x=>x.value===20).w===(second.winner===1?1:0),'tactic wins assigned to opponent');
 check(ownTacticInsights(db,{...filter,color:'BLUE'}).sample===1&&ownTacticInsights(db,{...filter,color:'RED'}).sample===1&&ownTacticInsights(db,{...filter,region:'EU'}).sample===0,'region/color intersection lost');
 check(ownTacticInsights(db,filter,cid).sample>=1&&ownTacticInsights(db,{...filter,player:b.depthChart.MID},cid).sample===0,'champion/player conditions matched different sides');
 check(!ownTacticInsights(db,{team:b.id}).allowed&&ownTacticInsights(db,{team:b.id}).axes.length===0,'foreign tactic report leaked settings/counts');
 a.tactics.aggression=99;check(ownTacticInsights(db,filter)===report&&axis.settings.every(x=>x.value!==99),'current values replaced archived settings');
 const restored=unpackDB(packDB(db));check(JSON.stringify(ownTacticInsights(restored,filter))===JSON.stringify(report),'full save changed private tactic reports');
 check(JSON.stringify(db.metaHistory)===original&&JSON.stringify([db.metaStats,db.regionMetaStats,db.metaGames])===raw,'query changed original history/raw counts');
 const packed=packMetaHistory(db.metaHistory);check(packed[0][10][0].length===8&&packed[0][10][1].length===6&&JSON.stringify(packMetaHistory(unpackMetaHistory(JSON.parse(JSON.stringify(packed)))))===JSON.stringify(packed),'optional context packing rewrote old side shapes');
 const legacy=JSON.parse(original)[0];for(const s of legacy.sides)delete s.tacticContext;db.metaHistory.push(legacy);const mixed=ownTacticInsights(db,filter);check(mixed.known===2&&mixed.unknown===1&&mixed.sample===3,'legacy settings inferred from today');
 const malformed=JSON.parse(original)[0];malformed.sides[0].tacticContext.values[0]=101;db.metaHistory.push(malformed);check(ownTacticInsights(db,filter).unknown===2,'invalid slider values accepted');
 const provenance=JSON.parse(original)[0];provenance.sides[0].tacticContext.team=b.id;db.metaHistory.push(provenance);check(ownTacticInsights(db,filter).unknown===3,'foreign context attached to wrong historical club');
 const beforeFire=ownTacticInsights(db,filter);db.world.fired=true;check(!ownTacticInsights(db,filter).allowed&&matchTacticSnapshot(db,a)===null,'fired controller read cached report or captured fresh settings');db.world.fired=false;check(ownTacticInsights(db,filter)===beforeFire,'authority restoration changed recorded report');
 setManagedTeam(db,b.id);check(!ownTacticInsights(db,filter).allowed&&ownTacticInsights(db,{}).known===0,'new club accessed foreign cached/private history');setManagedTeam(db,a.id);
 // Existing parent/reserve authority, not invented ownership or contracts.
 const reserve=reserveTeamsOf(db,a)[0];check(!!reserve,'reserve authority fixture missing');reserve.tactics={...a.tactics};const context=matchTacticSnapshot(db,reserve);check(context&&context.observer===a.id&&ownTacticInsights(db,{team:reserve.id}).allowed,'owned reserve tactical authority differs from roster control');setManagedTeam(db,reserve.id);check(!ownTacticInsights(db,{team:a.id}).allowed,'reserve coach read parent exact settings');setManagedTeam(db,a.id);
 const oldShape=JSON.parse(original)[0];for(const s of oldShape.sides){delete s.color;delete s.bans}const sparse=unpackMetaHistory(packMetaHistory([oldShape]))[0];check(sparse.sides[0].tacticContext.values[0]===80&&!Object.hasOwn(sparse.sides[0],'color')&&!Object.hasOwn(sparse.sides[0],'bans'),'context extension manufactured missing color/bans');
 check(stringifyMetaHistory(Array.from({length:520},()=>db.metaHistory[0]))===JSON.stringify(packMetaHistory(Array.from({length:520},()=>db.metaHistory[0]))),'512-row streaming boundary changed context');
 DB=db;PSET={role:'ALL',q:'',region:'GLOBAL',patch:'ALL',comp:'ALL',period:'ALL',year:'',season:'ALL',split:'ALL',league:'ALL',scope:'INTL',position:'MID',team:a.id,player:pid,opponent:b.id,color:'BLUE',playerSearch:'',champ:cid};
 const page=viewPatch();check(page.includes('id="owntacticmeta"')&&page.includes('교전 회피 ↔ 교전 주도')&&page.includes('80 · 1전')&&page.includes('미상 3쪽')&&page.includes('인과적 효과나 추천 점수'),'actual page lost scoped values, unknown coverage or limits');
 const denied=patchOwnTacticCard(db,{team:b.id});check(denied.includes('관리 권한')&&!denied.includes('80 ·'),'foreign page leaked exact tactical values');
 const many=Array.from({length:10},(_,i)=>{const r=JSON.parse(original)[0];r.sides[0].tacticContext.values[0]=i*10;return r}),bounded=ownTacticInsights({...db,metaHistory:many},filter);check(bounded.sample===10&&bounded.axes[0].distinct===10&&bounded.axes[0].settings.length===6,'render bound discarded sample or unique settings');
 db.metaHistory=[legacy];check(ownTacticInsights(db,filter).unknown===1,'replacement retained private cached context');db.metaHistory.length=0;check(ownTacticInsights(db,filter).sample===0,'truncation retained private cached context');for(let i=0;i<90;i++)ownTacticInsights(db,{year:2100+i});check(META_TACTIC_CACHE.get(metaHistoryIndex(db)).queries.size<=META_FILTER_CACHE_LIMIT,'private tactic cache unbounded');
 console.log('TACTIC_META_ACCEPTANCE '+JSON.stringify({realGames:2,immutableCapture:true,delayedController:true,manualDelegatedParity:true,privateAuthority:true,actorAndColor:true,saveAndLegacy:true,invalidUnknown:true,visibleUi:true,cacheBounds:true}));
})();`,{setupSources:["let DB,PSET;const esc=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;');",await artifactSource('ui-patch.js'),await artifactSource('ui-opponent-report.js')]});
