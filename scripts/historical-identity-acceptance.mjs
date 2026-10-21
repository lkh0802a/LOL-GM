import {runEngineFixture,artifactSources} from './test-harness.mjs';
const ui=await artifactSources(['ui-match.js','ui-match-history.js','ui-season.js']);
const sName=(await artifactSources(['app.js']))[0].match(/^function sName.*$/m)[0];
await runEngineFixture(String.raw`(()=>{
 const check=(v,m)=>{if(!v)throw Error('HISTORICAL_IDENTITY '+m)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,div2:false,system:'franchise'})];cfg.internationals=[];
 const db=buildWorld(cfg),teams=activeTeams(db,'NA',1),a=teams[0];setManagedTeam(db,a.id);
 for(const t of teams)for(const role of ROLES){const p=genPlayer(db,new RNG(t.id+role),{region:t.region,role,age:22,base:65});signContract(db,p,t,1,3);t.depthChart[role]=p.id}
 const comp=leagueComp(db,'NA',1);comp.name='당시 공식 리그';comp.stages=[{id:'regular',name:'정규',type:'round_robin',legs:4,bestOf:1}];db.competitions[comp.id]=comp;
 const s=newSeason(db,comp.id,db.year,'historical-identity',db.worldDate);s.key='archive';s.region='NA';s.div=1;s.split=1;
 db.world={year:db.year,seed:'history',manage:'ai',phase:'season',seasons:{archive:s},offers:[],marketLog:[]};
 while(!s.done){setWorldCalendarDate(db,s.days[s.cur].date);playDay(db,s)}
 seasonAwards(db,db.world,{awards:[]});DB=db;
 const source=s.days.flatMap(d=>d.matches).find(m=>m.res&&(m.a===a.id||m.b===a.id)),rec=source.res,g=rec.games[0],originalRecord=JSON.stringify(g.publicRecord),seriesHtml=renderSeries(rec);
 const beforeHistory=JSON.stringify(db.history),beforeAwards=JSON.stringify(db.awards),beforeStats=JSON.stringify(s.pstats),base=packDB(db);
 check(db.history[0].championName&&db.history[0].mvpName&&db.awards.length>0&&db.awards.every(x=>x.playerName),'event writers did not freeze public names');
 SSET.tab='table';const table=seasonTab();SSET.tab='stats';const stats=seasonTab(),historyRows=histTable().split('<p class="hint">')[0];
 check(g.publicRecord.sides.flatMap(side=>side.players).some(p=>stats.includes(p[1])),'actual public player statistics absent');
 const hops=[];
 for(const years of [1,5,20]){
   const copy=unpackDB(base),season=copy.world.seasons.archive,match=season.days.flatMap(d=>d.matches).find(m=>m.id===source.id),r=match.res,game=r.games[0];
   copy.year=db.year+years;copy.world.year=copy.year;copy.worldDate=copy.year+'-12-31';copy.world.phase='market';
   copy.regions.NEW={...copy.regions.NA,id:'NEW',name:'MUTATED_REGION',leagueName:'MUTATED_LEAGUE'};delete copy.regions.NA;
   for(const t of Object.values(copy.teams)){t.name='MUTATED_TEAM';t.short='MUTATED';t.region='NEW';t.roster=[];t.depthChart={}}
   for(const c of Object.values(copy.competitions)){c.name='MUTATED_COMP';c.short='MUTATED';c.region='NEW';c.stages=[];c.teams=[]}
   const attrs=new Map();for(const p of Object.values(copy.players)){attrs.set(p.id,p.attrs);p.name='MUTATED_PLAYER';p.role='SUP';p.retired=true;p.team=null;p.contract=null;Object.defineProperty(p,'attrs',{configurable:true,get(){throw Error('current private attributes read')}})}
   copy.patch={...copy.patch,id:'FUTURE_PATCH'};for(const c of Object.values(copy.patch.champions))c.name='MUTATED_CHAMP';DB=copy;
   const simulate=simulateSeries,patch=getPatch;simulateSeries=()=>{throw Error('past resimulation')};getPatch=()=>{throw Error('current patch lookup')};
   let read;try{read=replayGame(copy,r,game)}finally{simulateSeries=simulate;getPatch=patch}
   check(read.exact===false&&read.basis==='recorded-only'&&JSON.stringify(read.record)===originalRecord,'replay re-evaluates or changes the official source');
   check(renderSeries(r)===seriesHtml,'series header/picks/MVP changed with live maps');
   SSET.tab='table';check(seasonTab()===table,'completed standings reclassified by current region/format');SSET.tab='stats';check(seasonTab()===stats,'old player role/club/name/statistics changed');
   check(histTable().split('<p class="hint">')[0]===historyRows&&JSON.stringify(copy.history)===beforeHistory&&JSON.stringify(copy.awards)===beforeAwards&&JSON.stringify(season.pstats)===beforeStats,'global historical outcome/award/statistics changed');
   const view=recordedSeasonIdentity(copy,season);check(!JSON.stringify(view).includes('MUTATED'),'identity view uses current maps');
   for(const p of Object.values(copy.players))Object.defineProperty(p,'attrs',{value:attrs.get(p.id),writable:true,enumerable:true,configurable:true});
   const packed=packDB(copy),loaded=unpackDB(packed),loadedMatch=loaded.world.seasons.archive.days.flatMap(d=>d.matches).find(m=>m.id===source.id);DB=loaded;
   check(JSON.stringify(recordedPublicMatch(loaded,loadedMatch.res,loadedMatch.res.games[0]).record)===originalRecord,'full/lite save lost event-time source');
   check(loadedMatch.res.seed===rec.seed&&loadedMatch.res.firstChoice===rec.firstChoice&&loadedMatch.res.games[0].seed===g.seed,'full/lite save deleted original series/set identity');
   check(loaded.world.seasons.archive.formatSnapshot.name==='당시 공식 리그','save lost original competition format');
   const prior=JSON.stringify(loaded.world.seasons.archive);delete loaded.world.seasons.archive.formatSnapshot;
   SSET.tab='table';check(seasonTab().includes('현재 규정으로 순위를 다시 계산하지 않습니다'),'legacy format fabricated');
   const legacy={...loadedMatch.res,games:loadedMatch.res.games.map(x=>({...x,publicRecord:undefined}))};check(replayGame(loaded,legacy,legacy.games[0]).reason==='not-recorded'&&!renderSeries(legacy).includes('MUTATED'),'missing archive fabricated from current entities');
   hops.push({years,officialRecord:true,format:true,fullLite:true,sourceChars:originalRecord.length,savedChars:packed.length});
 }
 const career=unpackDB(base),sizes=[];let extraMatches=0;
 for(let year=1;year<=20;year++){
   career.year=db.year+year;career.world.year=career.year;career.worldDate=career.year+'-01-01';
   career.competitions[comp.id].name='후속 리그 '+year;career.competitions[comp.id].stages[0].legs=1;
   for(const t of Object.values(career.teams)){t.name='후속 구단 '+year+' '+t.id;t.short=t.id}
   for(const p of Object.values(career.players))p.name='후속 선수 '+year+' '+p.id;
   const next=newSeason(career,comp.id,career.year,'history-followup-'+year,career.worldDate);next.key='followup-'+year;next.region='NA';next.div=1;next.split=1;career.world.seasons[next.key]=next;
   while(!next.done){setWorldCalendarDate(career,next.days[next.cur].date);playDay(career,next)}
   extraMatches+=next.days.reduce((n,d)=>n+d.matches.length,0);
   if([1,5,20].includes(year)){
     const saved=packDB(career),loaded=unpackDB(saved),old=loaded.world.seasons.archive.days.flatMap(d=>d.matches).find(m=>m.id===source.id);DB=loaded;
     check(JSON.stringify(old.res.games[0].publicRecord)===originalRecord&&renderSeries(old.res)===seriesHtml,'actual later competition changed original archive '+year);
     check(JSON.stringify(loaded.history[0])===JSON.stringify(db.history[0]),'later history writer changed original winner '+year);
     sizes.push({seasonsAfterOriginal:year,actualNewMatches:extraMatches,savedChars:saved.length});
   }
 }
 DB=db;
 const encoded=encodeSeriesIdentity(seriesResultForSave(rec,false)),rawBefore=JSON.stringify(rec);
 check(encoded.seed===undefined&&encoded.firstChoice===undefined&&JSON.stringify(restoreSeriesIdentity(encoded))===rawBefore,'packed identity contract/complete restore');
 check(JSON.stringify(rec)===rawBefore,'identity encoding mutated runtime');
 const numeric={seed:42,firstChoice:'coin',games:[]};check(JSON.stringify(restoreSeriesIdentity(encodeSeriesIdentity(seriesResultForSave(numeric,false))))===JSON.stringify(numeric),'numeric seed lost');
 const optional={label:undefined,seed:'optional',firstChoice:'coin',games:[]};check(JSON.stringify(restoreSeriesIdentity(JSON.parse(JSON.stringify(encodeSeriesIdentity(seriesResultForSave(optional,false))))))===JSON.stringify(optional),'optional field shifted identity positions');
 for(const rows of [[['seed','x',0],['seed','y',1]],[['seed','x',0],['firstChoice','coin',0]],[['seed',{},0]],[['seed','x',999]]]){
   const broken={...encoded,seriesIdentityPacked:rows},before=JSON.stringify(broken);let blocked=false;
   try{restoreSeriesIdentity(broken)}catch(e){blocked=e.message.includes('식별 정보')}
   check(blocked&&JSON.stringify(broken)===before,'malformed identity not rejected atomically');
   const input=JSON.parse(base),stored=input.world.seasons.archive.days.flatMap(d=>d.matches).find(m=>m.id===source.id);stored.res.seriesIdentityPacked=rows;let rejected=false;
   try{unpackDB(JSON.stringify(input))}catch(e){rejected=e.message.includes('식별 정보')}
   check(rejected&&JSON.stringify(rec)===rawBefore,'actual load accepted corrupt identity or changed original runtime');
 }
 const other=teams.filter(t=>t.id!==a.id).slice(0,2),secret={...g,blue:other[0].id,red:other[1].id};Object.defineProperty(secret,'publicRecord',{get(){throw Error('foreign private source read')}});Object.defineProperty(secret,'seed',{get(){throw Error('foreign seed read')}});
 check(replayGame(db,{...rec,practiceModel:'engine'},secret).reason==='no-authority','foreign practice authority bypass');
 for(const key of ['kills','picks'])Object.defineProperty(secret,key,{get(){throw Error('foreign practice detail read')}});
 check(renderSeries({...rec,practiceModel:'engine',games:[secret]}).includes('조회 권한이 없습니다'),'foreign practice summary authority bypass');
 const bad=JSON.parse(JSON.stringify(g));bad.publicRecord.competition.name=1;check(recordedPublicMatch(db,rec,bad).reason==='unverified-source','invalid identity metadata accepted');
 check(JSON.stringify(g.publicRecord)===originalRecord&&JSON.stringify(db.history)===beforeHistory,'query rewrote originals');
 console.log('HISTORICAL_IDENTITY_ACCEPTANCE '+JSON.stringify({actualCompetitionSeasons:21,actualMatches:s.days.reduce((n,d)=>n+d.matches.length,0)+extraMatches,actualCompetitionHistory:sizes,controlledFutureStates:hops,fullWorldCareerNotRun:true,noCurrentSimulation:true,legacyHonest:true,privateAuthority:true}));
})()`,{timeout:60000,setupSources:["let DB,ANALYSIS_SET={},SSET={tab:'table'};const esc=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');function curS(){return DB.world.seasons.archive}function fmtTime(t,s){return t+':'+s}function renderRecordedDraftReview(){return ''}",sName,...ui]});
