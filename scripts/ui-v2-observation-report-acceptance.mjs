import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {runEngineFixture} from './test-harness.mjs';
const sources=await Promise.all(['state','market','contracts','views'].map(p=>readFile(new URL('../src/ui-v2/'+p+'.js',import.meta.url),'utf8')));
const result=await runEngineFixture(String.raw`(()=>{
 const check=(ok,m)=>{if(!ok)throw Error('V2_OBSERVATION_REPORT '+m)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:3,div2:true})];cfg.internationals=[];const db=buildWorld(cfg),[t,other,last]=activeTeams(db,'NA',1);setManagedTeam(db,t.id);db.world={phase:'season',year:db.year,seed:'profile-observed',manage:'manual',registrationVersion:1,seasons:{},offers:[],marketLog:[],steps:[],step:0};setWorldCalendarDate(db,db.year+'-01-10');
 for(const team of activeTeams(db)){for(const role of ROLES){const p=genPlayer(db,new RNG('profile-observed|'+team.id+role),{region:team.region,role,age:22,base:65});signContract(db,p,team,1,2)}initializeDepthChart(db,team,true);team.finance.cash=1000}initializeOfficialRegistrations(db);
 const pid=starterFor(db,other,'TOP').id,p=db.players[pid],cid='profile-public-official';db.competitions[cid]={id:cid,name:'관측 보고서 공식 표본',region:'NA',teams:[other.id,last.id],rules:{fearless:true},stages:[{id:'regular',name:'정규',type:'round_robin',legs:1,bestOf:1}]};const season=newSeason(db,cid,db.year,'profile-public-official',addDays(db.worldDate,1));season.key=cid;season.region='NA';season.div=1;db.world.seasons[cid]=season;const day=season.days[0],match=day.matches[0],stage=db.competitions[cid].stages[0];setWorldCalendarDate(db,day.date);const played=simulateScheduledSeries(db,season,day,match,stage);commitScheduledSeries(db,season,match,played);finalizeCompetitionDay(db,season,day,0,stage);check(played.rec.games[0].publicRecord.ending.kind==='nexus','actual canonical official game');
 mInterest(db,pid,'B');scoutPlayers(db,[pid],40,.1*psOf(db,t.region));mEvaluateTarget(db,pid,t.id);V2.db=db;V2.target=t.id;V2.section='market';V2.tab='관심 선수';V2.pid=pid;
 const view=scoutingReadView(db),report=scoutReport(view,view.players[pid]),pool=publicPlayerChampions(view,view.players[pid]);check(report.sample.g===1&&pool.champions.length===1,'actual official attribution');
 const before=JSON.stringify(db),evaluation=JSON.stringify(db.world.recruitment.targets[pid].evaluation),html=v2PlayerDetail();
 check(html.includes('data-player-observation'),'profile observation entry');
 check(html.includes('data-observation-field="observations">'+report.observations+'회')&&html.includes('data-observation-field="official-games">'+report.sample.g+'경기')&&html.includes(report.lastSeenDate),'canonical report date and independent counters');
 check(html.includes('data-observed-champion="'+pool.champions[0].id+'"')&&html.includes(v2Esc(championLabel(db,pool.champions[0].id)))&&html.includes('표본은 다를 수'),'actual public champion evidence');
 check(html.includes('data-observation-evaluation')&&JSON.stringify(db.world.recruitment.targets[pid].evaluation)===evaluation&&JSON.stringify(db)===before,'saved evaluation and pure render');
 const prior=Object.getOwnPropertyDescriptor(p,'pool'),core=playerCoreMetrics;Object.defineProperty(p,'pool',{get(){throw Error('private foreign mastery read')},enumerable:false,configurable:true});playerCoreMetrics=x=>{check(x!==p,'true foreign core read');return core(x)};
 try{v2PlayerObservationReport(scoutingReadView(db),p,t)}finally{Object.defineProperty(p,'pool',prior);playerCoreMetrics=core}
 const e=db.world.recruitment.targets[pid].evaluation,oldAbility=e.ability; e.ability=[];check(v2PlayerObservationReport(scoutingReadView(db),p,t).includes('범위 근거 없음'),'missing saved range never invented');e.ability=oldAbility;const oldOwner=e.teamId;e.teamId=other.id;check(!v2PlayerObservationReport(scoutingReadView(db),p,t).includes('data-observation-evaluation'),'other squad evaluation hidden');e.teamId=oldOwner;
 db.world.fired=true;check(v2PlayerObservationReport(scoutingReadView(db),p,t)==='','fired no report');delete db.world.fired;check(JSON.stringify(db)===before,'revocation test restore and world unchanged');
 return {actualOfficialNexus:true,publicSource:true,canonicalCounters:true,pure:true,savedEvaluationUnchanged:true,noForeignMasteryOrCore:true,evaluationScope:true,firedRevocation:true,game:packDB(db),pid,target:t.id};
})()`,{setupSources:[...sources,`const window={scrollY:0,scrollTo(){}};const document={getElementById(){return {textContent:''}},querySelectorAll(){return []}};function v2Icon(){return ''}`],timeout:60000});
assert(result.publicSource&&result.pure);
if(process.env.PROFILE_UI_FIXTURE)await writeFile(process.env.PROFILE_UI_FIXTURE,JSON.stringify(result));
const {game,...summary}=result;console.log('UI_V2_OBSERVATION_REPORT_ACCEPTANCE '+JSON.stringify(summary));
