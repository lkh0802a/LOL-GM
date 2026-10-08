import {readFile} from 'node:fs/promises';
import {runEngineFixture,artifactSources} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const check=(ok,msg)=>{if(!ok)throw Error('SEASON_HISTORY '+msg)},copy=x=>JSON.parse(JSON.stringify(x));
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:2,div2:false,system:'franchise',splits:1}),regionCfg('EU',{teams:2,div2:false,system:'franchise',splits:1})];cfg.internationals=[];
 const db=buildWorld(cfg),own=activeTeams(db,'NA',1)[0],foreign=activeTeams(db,'EU',1);
 for(const t of activeTeams(db))for(const role of ROLES){const p=genPlayer(db,new RNG('compact|'+t.id+role),{region:t.region,role,age:22,base:65});signContract(db,p,t,1,3);t.depthChart[role]=p.id}
 startWorldSeason(db,own.id,'compact-history');
 const cid='compact-official';db.competitions[cid]={id:cid,name:'공식 기록 보존 검증 대회',region:'EU',teams:foreign.map(t=>t.id),rules:{fearless:true},stages:[{id:'group',name:'풀리그',type:'round_robin',legs:1,bestOf:1}]};
 const s=newSeason(db,cid,db.year,'compact-official',db.worldDate);s.region='EU';s.key=cid;db.world.seasons[cid]=s;
 const day=s.days[0],match=day.matches[0];setWorldCalendarDate(db,day.date);setManagedTeam(db,foreign[0].id);
 db.world.pendingOfficial={date:day.date,queue:[{seasonKey:cid,matchId:match.id}]};
 const selection=pendingOfficialSelectionSetup(db).prompt;applyPendingOfficialSelection(db,{kind:selection.remaining||'order',value:selection.remaining==='side'?'blue':'first'});
 const setup=pendingOfficialDraftSetup(db),side=setup.blue===foreign[0].id?0:1,live=createDraftSession(db,[setup.blue,setup.red],new RNG(setup.gseed,'draft'),{...setup.draftCtx,firstPick:setup.fpTeam===setup.blue?0:1});
 while(draftTurn(live)){const t=draftTurn(live),choice=draftAiChoice(live);if(t.side===side&&t.kind==='P')choice.source='player';draftApplyChoice(live,choice)}
 const done=resolvePendingOfficialMatch(db,draftResult(live));check(done.done&&s.done&&match.res===done.rec,'actual scheduled manual completion');
 const rec=match.res,game=rec.games[0];check(game.publicRecord?.ending?.kind==='nexus'&&game.draftEvidence[foreign[0].id].length===5,'actual nexus and own manual evidence');
 for(const season of Object.values(db.world.seasons))while(!season.done){setWorldCalendarDate(db,season.days[season.cur].date);playDay(db,season)}
 setManagedTeam(db,own.id);const pristine=JSON.stringify(db),expected=seriesResultForSave(rec,true),sampleBefore=JSON.stringify(scoutSample(db,db.players[game.publicRecord.sides[0].players[0][0]]));
 const historyBefore=JSON.stringify(db.history),metaBefore=JSON.stringify(db.metaHistory),staffBefore=JSON.stringify(Object.values(db.teams).map(t=>[t.id,(t.staffRoster||[]).map(p=>[p.id,p.career])]));
 const originalGames=copy(rec.games),originalSeed=rec.seed,firstChoice=copy(rec.firstChoice),readBefore=JSON.stringify(recordedPublicMatch(db,rec,game));
 const archiveView=copy(db);setManagedTeam(archiveView,foreign[0].id);const draftBefore=JSON.stringify(recordedDraftReview(archiveView,archiveView.world.seasons[cid].days[0].matches[0].res,game));
 const noManager=copy(db);setManagedTeam(noManager,null);const noManagerBefore=JSON.stringify(noManager);let noManagerError=null;try{advanceStep(noManager)}catch(error){noManagerError=String(error)}
 const progressed=copy(db);let progressError=null;try{advanceStep(progressed)}catch(error){progressError=String(error)}
 const after=progressed.world.seasons[cid].days[0].matches[0].res;
 console.log('COMPACTION_SOURCE_EVIDENCE '+JSON.stringify({source:'startWorldSeason/pendingOfficial/manual draft/playDay/advanceStep',nexusBefore:game.publicRecord.ending,nexusAfter:after.games[0].publicRecord?.ending||null,manualBefore:game.draftEvidence[foreign[0].id].length,manualAfter:after.games[0].draftEvidence?.[foreign[0].id]?.length||0,noManagerError,noManagerUnchangedOnFailure:JSON.stringify(noManager)===noManagerBefore,progressError,before:rec,after}));
 if(typeof COMPACTION_BASELINE!=='undefined')return;
 check(!progressError&&progressed.world.phase==='offseason','actual season transition');check(JSON.stringify(progressed.history)===historyBefore&&JSON.stringify(progressed.metaHistory)===metaBefore&&JSON.stringify(Object.values(progressed.teams).map(t=>[t.id,(t.staffRoster||[]).map(p=>[p.id,p.career])]))===staffBefore,'official summary/raw samples/staff career history unchanged');
 const dayProgress=copy(db);setManagedTeam(dayProgress,null);const dayResult=playWorldDay(dayProgress);check(dayResult.date===null&&dayProgress.world.phase==='offseason'&&JSON.stringify(dayProgress.world.seasons[cid])===JSON.stringify(db.world.seasons[cid]),'actual unemployed calendar day consumer');
 check(!noManagerError&&noManager.world.phase==='offseason','unemployed actual transition');
 check(JSON.stringify(noManager.world.seasons[cid].days[0].matches[0].res)===JSON.stringify(rec),'unemployed retains full original result');for(const key of Object.keys(db.world.seasons))check(JSON.stringify(noManager.world.seasons[key])===JSON.stringify(db.world.seasons[key]),'unemployed preserves every region full '+key);
 check(JSON.stringify(after.games)===JSON.stringify(expected.games)&&after.lite&&progressed.world.seasons[cid].compact,'reuse existing save game contract');
 check(after.seed===originalSeed&&JSON.stringify(after.firstChoice)===JSON.stringify(firstChoice),'live series identity retained');
 check(JSON.stringify(recordedPublicMatch(progressed,after,after.games[0]))===readBefore,'public consumer preserves source');
 check(JSON.stringify(scoutSample(progressed,progressed.players[game.publicRecord.sides[0].players[0][0]]))===sampleBefore,'official sample consumer parity');
 check(JSON.stringify(db)===pristine,'cloned investigation does not write baseline');
 const outcomes=x=>Object.values(x.world.seasons).flatMap(s=>s.days.flatMap(d=>d.matches.filter(m=>m.res).map(m=>({id:m.id,seed:m.res.seed,winner:m.res.winner,score:m.res.score,games:m.res.games.map(g=>({n:g.n,blue:g.blue,red:g.red,winner:g.winner,kills:g.kills,dur:g.dur,mvp:g.mvp}))}))));
 check(JSON.stringify(outcomes(progressed))===JSON.stringify(outcomes(db)),'seeded outcomes unchanged by retention correction');
 for(const key of Object.keys(db.world.seasons))if(db.world.seasons[key].region==='EU')for(const d of db.world.seasons[key].days)for(const m of d.matches)if(m.res){const rr=progressed.world.seasons[key].days.find(x=>x.date===d.date).matches.find(x=>x.id===m.id).res;check(JSON.stringify(rr.games)===JSON.stringify(seriesResultForSave(m.res,true).games),'AI/player same retained game contract '+m.id)}
 const full=unpackDB(JSON.stringify(progressed)),packed=unpackDB(packDB(progressed));
 for(const restored of [full,packed]){
  const r=restored.world.seasons[cid].days[0].matches[0].res,g=r.games[0];check(JSON.stringify(recordedPublicMatch(restored,r,g))===readBefore,'raw/compact public source continuity');
  setManagedTeam(restored,foreign[0].id);check(JSON.stringify(recordedDraftReview(restored,r,g))===draftBefore,'actual manual archive authority/source continuity');
  check(officialMatchReviews(restored,foreign[0].id,{comp:cid}).length===1,'analysis room official result list');
  if(typeof COMPACTION_BROWSER!=='undefined')console.log('COMPACT_BROWSER_DB '+JSON.stringify(restored));DB=restored;check(renderPublicMatchReview(restored,r,g).includes('넥서스 파괴'),'recorded source UI');
  check(renderRecordedDraftReview(restored,r,g).includes('당시 수동 밴픽 검토 5건'),'manual source UI');
  setManagedTeam(restored,own.id);check(!recordedDraftReview(restored,r,g,foreign[0].id).allowed,'foreign private permission unchanged');
 }
 const ownedKey=Object.keys(db.world.seasons).find(k=>db.world.seasons[k].region==='NA');check(JSON.stringify(progressed.world.seasons[ownedKey])===JSON.stringify(db.world.seasons[ownedKey]),'owned full live history retained');
 const international=copy(db);international.competitions[cid].international=true;const internationalBefore=JSON.stringify(international.world.seasons[cid]);compactSeason(international,international.world.seasons[cid]);check(JSON.stringify(international.world.seasons[cid])===internationalBefore,'international full history');
 for(const mode of ['missing-team','missing-region','missing-managed-region','already-compact']){const x=copy(db),sx=x.world.seasons[cid];if(mode==='missing-team')x.manager.teamId='missing';if(mode==='missing-region')delete sx.region;if(mode==='missing-managed-region')delete x.teams[own.id].region;if(mode==='already-compact')sx.compact=true;const before=JSON.stringify(x);compactSeason(x,sx);check(JSON.stringify(x)===before,'retention metadata '+mode);if(mode!=='already-compact'){const retained=JSON.stringify(sx.days[0].matches[0].res);advanceStep(x);check(x.world.phase==='offseason'&&JSON.stringify(sx.days[0].matches[0].res)===retained,'actual transition with metadata gap '+mode)}}
 const legacy=copy(db),lr=legacy.world.seasons[cid].days[0].matches[0].res;lr.games=lr.games.map(g=>({n:g.n,blue:g.blue,red:g.red,winner:g.winner,kills:g.kills,dur:g.dur,mvp:g.mvp}));lr.lite=true;compactSeason(legacy,legacy.world.seasons[cid]);check(!lr.games[0].publicRecord&&recordedPublicMatch(legacy,lr,lr.games[0]).reason==='not-recorded','legacy missing evidence not invented');
 const repeated=JSON.stringify(progressed.world.seasons);compactSeason(progressed,progressed.world.seasons[cid]);check(JSON.stringify(progressed.world.seasons)===repeated,'idempotent completion');
 const invalid=copy(db),badSeason=invalid.world.seasons[cid];badSeason.days[0].matches.push({id:'invalid-record',res:{games:{invalid:true}}});const invalidBefore=JSON.stringify(invalid);let rejected=false;try{compactSeason(invalid,badSeason)}catch{rejected=true}check(rejected&&JSON.stringify(invalid)===invalidBefore,'all history prepared before mutation on late invalid source');
 check(JSON.stringify(originalGames)===JSON.stringify(rec.games),'original result preserved');
 console.log('SEASON_HISTORY_ACCEPTANCE PASS actual professional completion, manual/AI public nexus, advanceStep/managerless progress, raw/compact history, source UI, permissions, seed outcome parity, legacy and failed preparation');
})()`,{timeout:120000,setupSources:[`let DB;const esc=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');function fmtTime(t,s){return t+':'+s}`, ...await artifactSources(['ui-match.js','ui-match-history.js','ui-takedown-history.js','ui-draft-history.js']),...(process.env.COMPACTION_BROWSER?['const COMPACTION_BROWSER=true;']:[]),...(process.env.COMPACTION_BASELINE?[(await readFile(process.env.COMPACTION_BASELINE_SOURCE,'utf8')).split('function compactSeason(db,s){')[1].split('function advanceStep(db){')[0].replace(/^/,'function compactSeason(db,s){'),'const COMPACTION_BASELINE=true;']:[])]});
