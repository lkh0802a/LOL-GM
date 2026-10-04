import {runEngineFixture,artifactSources} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error('MATCH_HISTORY '+m)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,div2:true,system:'franchise'})];cfg.internationals=[];
 const db=buildWorld(cfg),[a,b]=activeTeams(db,'NA',1);setManagedTeam(db,a.id);
 for(const t of [a,b])for(const role of ROLES){const p=genPlayer(db,new RNG('match-history|'+t.id+role),{region:t.region,role,age:22,base:65});signContract(db,p,t,1,3);t.depthChart[role]=p.id}
 db.world={year:db.year,manage:'manual',phase:'season',seasons:{}};
 const pristine=packDB(db),sess=createSeriesSession(db,a.id,b.id,1,'record-official',{compId:'history'}),played=playSeriesSessionGame(db,sess,null,false),rec=seriesSessionResult(db,sess).rec,g=rec.games[0],read=recordedPublicMatch(db,rec,g);
 check(read.record&&read.record.sides[0].players.length===5,'actual official snapshot');
 check(read.record.sides.every((s,i)=>s.players.every((x,j)=>x[7]===Math.round(played.game.sides[i].ps[j].cs)&&x[8]===Math.round(played.game.sides[i].ps[j].goldEarned))),'actual stats');
 check(read.record.events.length<=24&&read.record.events.some(x=>x[2]==='nexus'),'bounded real ending');
 check(!JSON.stringify(read.record).includes('mastery')&&!JSON.stringify(read.record).includes('attrs'),'private snapshot fields');
 // Quiet vs logged series execution must retain official observable outcomes.
 const quietDb=unpackDB(pristine),quiet=createSeriesSession(quietDb,a.id,b.id,1,'record-official',{compId:'history'});playSeriesSessionGame(quietDb,quiet,null,true);
 check(quiet.games[0].winner===g.winner,'quiet winner differs');
 const originalCapture=publicMatchRecord;publicMatchRecord=()=>({});const without=unpackDB(pristine),withoutSession=createSeriesSession(without,a.id,b.id,1,'record-official',{compId:'history'});try{playSeriesSessionGame(without,withoutSession,null,false)}finally{publicMatchRecord=originalCapture}
 check(JSON.stringify(withoutSession.lines)===JSON.stringify(sess.lines)&&JSON.stringify(packMetaHistory(without.metaHistory))===JSON.stringify(packMetaHistory(db.metaHistory)),'capture changed seeded lines/meta');
 check(quiet.games[0].publicRecord.events.length===0,'quiet fabricated timeline');
 db.world.seasons.history={id:'history',comp:'history',region:'EU',done:true,days:[{date:db.worldDate,matches:[{res:rec}]}]};db.competitions.history={name:'기록 대회'};DB=db;
 const original=JSON.stringify(read.record),saved=packDB(db),loaded=unpackDB(saved),lr=loaded.world.seasons.history.days[0].matches[0].res;
 check(lr.lite&&JSON.stringify(recordedPublicMatch(loaded,lr,lr.games[0]).record)===original,'lite save source loss');
 for(const p of Object.values(db.players))p.pool={};check(JSON.stringify(recordedPublicMatch(db,rec,g).record)===original,'current mastery rewrote archive');
 const oldAttrs=Object.getOwnPropertyDescriptor(db.players[b.depthChart.MID],'attrs');Object.defineProperty(db.players[b.depthChart.MID],'attrs',{get(){throw Error('enemy hidden ability read')},configurable:true});
 const html=renderPublicMatchReview(db,rec,g);check(html.includes('당시 확정된 경기 기록')&&!html.includes('현재 재생 숙련'),'review private disclosure');
 for(const p of played.game.sides.find(s=>s.team.id===b.id).ps)Object.defineProperty(p.prof,'mastery',{get(){throw Error('opponent mastery getter read')},configurable:true});
 const draftHtml=renderDraft(played.game);check(played.game.sides.find(s=>s.team.id===b.id).ps.every(p=>!draftHtml.includes(p.p.name+' · 현재 재생 숙련')),'opponent mastery UI');Object.defineProperty(db.players[b.depthChart.MID],'attrs',oldAttrs);
 const empty=renderPublicMatchReview(db,rec,{...g,publicRecord:undefined});check(empty.includes('당시 상세 기록이 없습니다'),'legacy reconstruction');
 const corrupt=JSON.parse(JSON.stringify(g));corrupt.publicRecord.events[0][0]=Infinity;check(recordedPublicMatch(db,rec,corrupt).reason==='unverified-source','bad source accepted');
 check(officialMatchReviews(db,a.id,{patch:rec.patch}).length===1&&officialMatchReviews(db,b.id).length===0,'observer source ownership');
 ANALYSIS_SET={review:JSON.stringify(['history',0,0,0])};check(analysisMatchPanel(db,a,{}).includes('당시 확정된 경기 기록'),'analysis consumer');
 const frozen=packDB(db);officialMatchReviews(db,a.id);renderPublicMatchReview(db,rec,g);check(packDB(db)===frozen,'reads mutate history');
 db.world.fired=true;check(officialMatchReviews(db,a.id).length===0,'fired owner');
 console.log('MATCH_HISTORY_ACCEPTANCE PASS actual public stats/events, bounded real nexus, unchanged seeded capture/no-capture lines, no hidden fields/re-evaluation, public getter traps, original/lite/legacy save, analysis ownership and pure reads; snapshotChars='+JSON.stringify(g.publicRecord).length);
})()`,{timeout:60000,setupSources:[`let DB,ANALYSIS_SET={};const esc=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');function fmtTime(t,s){return t+':'+s};function renderRecordedDraftReview(){return ''}`, ...await artifactSources(['ui-match.js','ui-match-history.js'])]});
