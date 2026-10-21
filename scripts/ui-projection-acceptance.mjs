import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {artifactSources,runEngineFixture} from './test-harness.mjs';

const original=JSON.parse(gunzipSync(await readFile(new URL('../docs/evidence/ui-projections-original-source-2026-10-21.json.gz',import.meta.url))));
assert.equal(original.commit,'4fdb5268616b3bdc67645de4dfc204be6c0e62f6');
const hashes={
 'ui-club-recruitment.js':'017d98c0bde0ed57a83f086525d2babdd0251ad808609cec859e88c36180c829',
 'ui-club-finance.js':'9d4ff037d50b29b0dfda79bf858b17c2740924c0e42609eca7fa662ac6796f9c',
 'ui-squad-status.js':'29c73fd1a4e8ce149468f2a813b3ad69625152c4b437f1757408c15a5def6c30',
 'ui-player.js':'88b42af830d42c906886f8fa16441c4fa4a81493c9fc9472549bb3fb6c1981bc',
 'ui-roster.js':'7d9594b3cc41562d18c73aaa23b91cee45ea2f8a6207ed106ee210330ef82f2d'
};
assert.equal(original.files.length,5);
for(const row of original.files){assert.equal(row.sha256,hashes[row.path.split('/').at(-1)]);assert.equal(createHash('sha256').update(row.source).digest('hex'),row.sha256)}
const legacyNames=['recruitUiStamp','recruitUiGuard','bindRecruitmentControls','clubRecruitModel','clubFinanceModel','clubFinanceStamp','sponsorUiCurrent','bindSponsorControls','clubSponsorProjection','squadStatusModel','scoutingSearchBlock','runScoutReturn'];
const rename=name=>'legacy'+name[0].toUpperCase()+name.slice(1);
const legacy=legacyNames.map(name=>{
 const source=original.files.find(f=>f.source.includes('function '+name+'(')).source,start=source.indexOf('function '+name+'('),next=source.indexOf('\nfunction ',start+1);
 let fn=source.slice(start,next<0?source.length:next);
 for(const old of legacyNames)fn=fn.replaceAll(new RegExp('\\b'+old+'\\b','g'),rename(old));
 return fn;
}).join('\n');
const sources=await artifactSources(['ui-manager.js','ui-transfer-terms.js','ui-club-briefing.js','ui-club-home.js','ui-club-recruitment.js','ui-club-finance.js','ui-shortlist-comparison.js','ui-observed-radar.js','ui-initial-comparison.js','ui-squad-controls.js','ui-squad-status.js','ui-squad-table.js','ui-roster.js','ui-player.js','ui-club-practice.js','app.js']);
const app=sources.pop(),esc=app.match(/^const esc=.*$/m)[0];
await runEngineFixture(String.raw`(()=>{
 const check=(v,m)=>{if(!v)throw Error('UI_PROJECTION '+m)},copy=x=>unpackDB(JSON.stringify(x));
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,div2:false,system:'franchise'})];cfg.internationals=[];
 const db=buildWorld(cfg),teams=activeTeams(db,'NA',1);setManagedTeam(db,teams[0].id);
 for(const t of teams){for(const role of ROLES){const p=genPlayer(db,new RNG(t.id+role),{region:t.region,role,age:22,base:65});signContract(db,p,t,1,3);t.depthChart[role]=p.id}t.finance.cash=1000}
 const t=teams[0],pid=teams[1].roster[0],comp=leagueComp(db,'NA',1);comp.stages=[{id:'regular',name:'조회 수용',type:'round_robin',legs:1,bestOf:1}];db.competitions[comp.id]=comp;
 const season=newSeason(db,comp.id,db.year,'projection-source',db.worldDate);season.key='source';season.region='NA';season.div=1;season.split=1;
 db.world={year:db.year,seed:'projection-source',phase:'season',manage:'ai',seasons:{source:season},negotiations:{},offers:[],marketLog:[],steps:[],step:0};
 while(!season.done){setWorldCalendarDate(db,season.days[season.cur].date);playDay(db,season)}
 db.world.manage='manual';db.world.sponsorOffers=sponsorOffers(db,t);t.sponsor=null;
 mInterest(db,pid,'A');const second=teams[2].roster[0];mInterest(db,second,'B');const base=JSON.stringify(db),effects=[];
 const reset=()=>{DB=copy(JSON.parse(base));SLOT='1';SLOT_SWITCHING=false;VIEW='season';UI_RENDER_ID++;UI_OVERLAY=null;saves=[];messages=[];confirm=()=>true};
 const recruitShape=m=>({total:m.total,pages:m.pages,page:m.page,canAct:m.canAct,rows:m.rows.map(x=>({e:x.e,pid:x.p.id,report:x.report,html:recruitReportHtml(m,x.p,x.e)}))});
 const financeShape=m=>({team:m.team,forecast:m.forecast,prepaid:m.prepaid,releases:m.releases,transfer:m.transfer,committed:m.committed,payroll:m.payroll,offers:m.offers});
 reset();let before=JSON.stringify(DB);
 for(const missing of [null,undefined]){DB.world=missing;const unstarted=JSON.stringify(DB);check(scoutingSearchBlock()===legacyScoutingSearchBlock()&&scoutingSearchBlock()==='','unstarted search must remain empty');check(JSON.stringify(DB)===unstarted,'unstarted search wrote source')}
 reset();before=JSON.stringify(DB);
 DB.world.registrationVersion=1;initializeOfficialRegistrations(DB);
 const registeredBefore=JSON.stringify(DB),officialQuery=officialMatchView(ownedQueryView(DB),null,teams[0].id,teams[1].id);
 check(officialQuery.world===DB.world&&officialQuery.year===DB.year&&officialQuery.regions===DB.regions,'official consumer lost world/year/region context');
 check(JSON.stringify(DB)===registeredBefore,'official query consumer wrote its source');reset();before=JSON.stringify(DB);
 check(JSON.stringify(recruitShape(clubRecruitModel()))===JSON.stringify(recruitShape(legacyClubRecruitModel())),'actual report HTML/model differs from original public source');
 const comparisonState={},comparison=shortlistComparisonState(comparisonState);comparison.ids=[pid,second];comparison.open=true;
 check(shortlistComparisonPanel(clubRecruitModel(),comparisonState)===shortlistComparisonPanel(legacyClubRecruitModel(),comparisonState),'actual comparison/radar/source HTML differs');
 const m=clubFinanceModel(),old=legacyClubFinanceModel();
 check(JSON.stringify(financeShape(m))===JSON.stringify(financeShape(old)),'finance forecast/contract source differs');
 for(const o of m.offers)check(JSON.stringify(clubSponsorProjection(m,o.id))===JSON.stringify(legacyClubSponsorProjection(old,o.id)),'sponsor assumption differs');
 const e={starters:managedTeam(DB).depthChart};check(JSON.stringify(squadStatusModel(managedTeam(DB),e))===JSON.stringify(legacySquadStatusModel(managedTeam(DB),e)),'registration/medical/draft status differs');
 SCOUT_RETURN={};const oldSearch=legacyScoutingSearchBlock();SCOUT_RETURN={};check(scoutingSearchBlock()===oldSearch,'actual search HTML differs');
 check(JSON.stringify(DB)===before,'query changed live state');
 // Missing legacy normalization belongs to the copies, not the current DB.
 delete managedTeam(DB).facilities;delete DB.players[managedTeam(DB).roster[0]].eligibility;
 before=JSON.stringify(DB);check(JSON.stringify(financeShape(clubFinanceModel()))===JSON.stringify(financeShape(legacyClubFinanceModel())),'legacy finance projection differs');
 check(JSON.stringify(squadStatusModel(managedTeam(DB),e))===JSON.stringify(legacySquadStatusModel(managedTeam(DB),e))&&JSON.stringify(DB)===before,'legacy eligibility normalization escaped view');
 // A full JSON clone reads hidden unrelated data even for a public report.
 reset();const foreign=DB.players[pid],descriptors={};let reads=0;
 for(const key of ['attrs','pot','pool','medical','developmentTrail']){descriptors[key]=Object.getOwnPropertyDescriptor(foreign,key);Object.defineProperty(foreign,key,{configurable:true,enumerable:true,get(){reads++;throw Error('foreign private getter '+key)}})}
 let originalRejected=false;try{legacyClubRecruitModel()}catch(e){originalRejected=e.message.includes('foreign private getter')}
 check(originalRejected,'original full clone counterexample missing');reads=0;
 clubRecruitModel();clubFinanceModel();squadStatusModel(managedTeam(DB),e);recruitUiStamp(DB);SCOUT_RETURN={};scoutingSearchBlock();
 check(reads===0,'query/stamp read foreign private fields');
 for(const key of Object.keys(descriptors)){if(descriptors[key])Object.defineProperty(foreign,key,descriptors[key]);else delete foreign[key]}
 // Captured official history is shared with read consumers, never serialized
 // by these views or exposed to a second match/record writer.
 const match=DB.world.seasons.source.days.flatMap(d=>d.matches).find(m=>m.res);
 Object.defineProperty(match.res,'unrelatedPrivateArchive',{configurable:true,enumerable:true,get(){throw Error('archive graph traversed')}});
 clubRecruitModel();clubFinanceModel();squadStatusModel(managedTeam(DB),e);recruitUiStamp(DB);
 delete match.res.unrelatedPrivateArchive;
 // Dismissal revokes the former club's internal dossiers and player/staff
 // access. Public search remains a read, not a full copy of those secrets.
 reset();mEvaluateTarget(DB,pid);DB.world.fired=true;const firedBefore=JSON.stringify(DB),former=managedTeam(DB),formerPlayer=DB.players[former.roster[0]],blocked=[];let revokedReads=0;
 for(const [object,key] of [[DB,'scout'],[formerPlayer,'attrs'],[formerPlayer,'medical'],[former,'staffRoster']]){
  const descriptor=Object.getOwnPropertyDescriptor(object,key);blocked.push({object,key,descriptor});Object.defineProperty(object,key,{configurable:true,enumerable:true,get(){revokedReads++;throw Error('revoked private access '+key)}});
 }
 try{
  const read=scoutingReadView(DB);check(!Object.keys(read.scout).length&&!recruitmentTarget(read,pid),'former club dossier remained readable');
  recruitUiStamp(DB);scoutingEffectStamp(DB);SCOUT_RETURN={};scoutingSearchBlock();check(revokedReads===0,'revoked private getter read');
 }finally{for(const x of blocked){if(x.descriptor)Object.defineProperty(x.object,x.key,x.descriptor);else delete x.object[x.key]}}
 check(JSON.stringify(DB)===firedBefore,'revocation deleted stored former club data');
 reset();const frozenBefore=JSON.stringify(DB),expectedFrozen=recruitShape(legacyClubRecruitModel()),seen=new WeakSet();
 const freeze=node=>{if(!node||typeof node!=='object'||seen.has(node))return;seen.add(node);for(const value of Object.values(node))freeze(value);Object.freeze(node)};freeze(DB);
 check(JSON.stringify(recruitShape(clubRecruitModel()))===JSON.stringify(expectedFrozen),'frozen source report differs');
 clubFinanceModel();squadStatusModel(managedTeam(DB),{starters:managedTeam(DB).depthChart});SCOUT_RETURN={};scoutingSearchBlock();
 check(JSON.stringify(DB)===frozenBefore,'read-only inherited source was changed');
 // Execute the original/current actual click handlers and domain writer once.
 for(const kind of ['interest','priority','evaluate','drop','scout'])for(const accept of [false,true]){
  const outcomes=[];
  for(const bind of [legacyBindRecruitmentControls,bindRecruitmentControls]){
   reset();confirm=()=>accept;const button={dataset:{[kind]:pid},value:'C'};
   const root={querySelectorAll:s=>s==='[data-'+kind+']'?[button]:[]};
   bind((msg,changed)=>{messages.push([String(msg),changed]);if(changed)saveDB()},()=>true,root);
   (kind==='priority'?button.onchange:button.onclick)();
   const once=JSON.stringify(DB),count=saves.length;(kind==='priority'?button.onchange:button.onclick)();
   check(JSON.stringify(DB)===once&&saves.length===count,'duplicate command '+kind);
   outcomes.push(JSON.stringify({db:DB,messages,saves}));
  }
  check(outcomes[0]===outcomes[1],'actual writer/response/save parity '+kind+'/'+accept);effects.push(kind+'/'+accept);
 }
 // Actual per-event patch revisions and controlled source keys must invalidate
 // a held confirmation. No new cache persists across calls, slots or worlds.
 const mutations={
  date:()=>setWorldCalendarDate(DB,addDays(DB.worldDate,1)),
  patch:()=>{DB.patch._revision=(DB.patch._revision||0)+1},
  report:()=>observePlayer(DB,DB.players[pid],1,{games:0,comp:'manual'}),
  staff:()=>{managedTeam(DB).staffRoster[0].contract.salary+=1},
  training:()=>{DB.players[managedTeam(DB).roster[0]].fatigue+=1},
  loan:()=>{DB.players[pid].loan={ownerId:teams[1].id,borrowerId:t.id,endDate:'2028-01-01'}},
  initialRoster:()=>{DB.players[pid].team=t.id},
  history:()=>{DB.metaHistory=DB.metaHistory.slice()},
  slot:()=>{SLOT='2'}
 };
 for(const [kind,change] of Object.entries(mutations)){
  reset();const button={dataset:{scout:pid}},root={querySelectorAll:s=>s==='[data-scout]'?[button]:[]};
  bindRecruitmentControls((msg,changed)=>{if(changed)saveDB()},()=>true,root);
  let external;confirm=()=>{change();external=JSON.stringify(DB);return true};button.onclick();
  check(external&&JSON.stringify(DB)===external&&saves.length===0,'late confirmation crossed '+kind);
 }
 // A changed staffing cost invalidates the finance projection even if the
 // calendar and cash are unchanged. Execute the original missed boundary.
 const sponsorOutcomes=[];
 for(const bind of [legacyBindSponsorControls,bindSponsorControls]){
  reset();const button={dataset:{spon:DB.world.sponsorOffers[0].id}},root={querySelectorAll:s=>s==='[data-spon]'?[button]:[]};
  bind((msg,changed)=>{if(changed)saveDB()},()=>true,root);
  managedTeam(DB).staffRoster[0].contract.salary+=1;const external=JSON.stringify(DB);button.onclick();
  sponsorOutcomes.push({unchanged:JSON.stringify(DB)===external,saves:saves.length});
 }
 check(!sponsorOutcomes[0].unchanged&&sponsorOutcomes[0].saves===1&&sponsorOutcomes[1].unchanged&&sponsorOutcomes[1].saves===0,'finance staffing-cost stale guard missing');
 // Fail first in the preview, then only after the live writer has consumed its
 // real cost/observation. Both must preserve the original rollback/identity.
 for(const failAt of [1,2]){
  reset();const source=JSON.stringify(DB),scout=observePlayer,team=managedTeam(DB),finance=team.finance,dossier=DB.scout;let calls=0;
  observePlayer=(...args)=>{const result=scout(...args);if(++calls===failAt)throw Error('injected observation failure');return result};
  const button={dataset:{scout:pid}},root={querySelectorAll:s=>s==='[data-scout]'?[button]:[]};
  bindRecruitmentControls((msg,changed)=>{messages.push([String(msg),changed]);if(changed)saveDB()},()=>true,root);button.onclick();observePlayer=scout;
  check(calls===failAt&&JSON.stringify(DB)===source&&saves.length===0&&team.finance===finance&&DB.scout===dossier,'failed preview/live observation changed DB or references '+failAt);
 }
 console.log('UI_PROJECTION_ACCEPTANCE '+JSON.stringify({originalCommit:'4fdb526',actualSourceGames:season.days.reduce((n,d)=>n+d.matches.reduce((m,x)=>m+x.res.games.length,0),0),modelHtmlParity:true,foreignGetters:true,firedRevocation:true,frozenSource:true,archiveNotTraversed:true,effects,lateBoundaries:Object.keys(mutations),sponsorStaffBoundary:true,previewAndLiveRollback:true}));
})()`,{timeout:60000,filename:'ui-projection-acceptance.fixture.js',setupSources:[esc,...sources,legacy,String.raw`
var DB,SQUAD,SQUAD_EDIT=null,OPEN_P=null,SCOUTSET={region:'ALL',role:'ALL',contract:'all',competition:'ALL',undervalued:false,q:''},VIEW='season',SLOT='1',SLOT_SWITCHING=false,UI_RENDER_ID=1,UI_OVERLAY=null,MSG='',confirm=()=>true,saves=[],messages=[];
const document={querySelector(){return null},querySelectorAll(){return []}};const $=()=>null;
function saveDB(){saves.push(packDB(DB))}function nav(){UI_RENDER_ID++}function navKeepScroll(){UI_RENDER_ID++}
`]});
