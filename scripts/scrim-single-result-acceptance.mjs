import {assertCurrentCheckPlan} from './current-check-plan.mjs';
await assertCurrentCheckPlan();
import {runEngineFixture,artifactSource} from './test-harness.mjs';

const ui=await artifactSource('ui-match.js');
const draftUi=await artifactSource('ui-draft-history.js');
const esc=(await artifactSource('app.js')).split('\n').find(line=>line.startsWith('const esc='));
const currentSeries=await artifactSource('series.js');
const screenSource=ui;
const result=await runEngineFixture(String.raw`(()=>{
  const check=(ok,msg)=>{if(!ok)throw Error('SCRIM_SINGLE_RESULT '+msg)};
  const same=(a,b,msg)=>check(JSON.stringify(a)===JSON.stringify(b),msg);
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:10,splits:1,legs:1,regularBo:1,playoffBo:1,playoffTake:4,format:'rr_po',div2:false,system:'franchise'})];cfg.internationals=[];cfg.subs=0;cfg.changes='none';
  const base=buildWorld(cfg),[a,b]=activeTeams(base,null,1);
  startCareer(base,a.id,'single-scrim');autoBuildInitialSquad(base,a,new RNG('single-start','squad'),5);finalizeInitialRosters(base);
  base.world.seasons={historical:{days:[{date:'2026-12-01',matches:[{a:a.id,b:b.id,res:{winner:a.id,original:'preserved actual history'}}]}]}};base.world.phase='season';base.worldDate='2027-03-01';
  for(const p of Object.values(base.players)){p.fatigue=0;p.condition=96;p.medicalPlan='normal';p.injury=null}
  const saved=packDB(base),originalSim=simulateMatch,originalRecord=recordScrimPractice;
  let calls=[],written=null,writes=0,saves=0,activeSeed='',intervals=[],nodes=new Map();
  const node=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',setAttribute(){},prepend(){},querySelectorAll(){return []}});return nodes.get(id)};
  $=s=>node(s);document={querySelectorAll:()=>[],createElement:()=>({})};
  freshInternalSeed=()=>activeSeed;saveDB=()=>{saves++};nav=()=>{};
  setInterval=fn=>{intervals.push(fn);return intervals.length};clearInterval=()=>{};matchMedia=()=>({matches:true});
  simulateMatch=(...args)=>{const r=originalSim(...args);calls.push({r,quiet:args[5]});return r};
  recordScrimPractice=(db,rec,lines)=>{writes++;written={rec,lines};return originalRecord(db,rec,lines)};
  const cases=[];let colors=new Set();
  for(const [bo,index] of [...Array.from({length:10},(_,i)=>[1,i]),[3,0],[5,0]]){
    DB=unpackDB(saved);SEL={blue:a.id,red:b.id,bo};LAST=null;LASTSER=null;LOGMODE='major';LIVE=null;
    calls=[];written=null;writes=0;saves=0;nodes=new Map();intervals=[];activeSeed='single-scrim-bo'+bo+'-'+index;
    const before=JSON.stringify({meta:DB.metaHistory,seasons:DB.world.seasons}),fatigue=Object.fromEntries(Object.values(DB.players).map(p=>[p.id,p.fatigue]));
    bindMatch();node('#play').onclick();
    check(written&&writes===1&&saves===1,'one practice writer/save per command');
    const {rec,lines}=written,n=rec.games.length;
    check(calls.length===n,'one simulation per actual set '+activeSeed);check(n===bo,'scrim plays every requested set');
    for(let i=0;i<n;i++){
      const g=rec.games[i],r=calls[i].r,winner=r.sides[r.winner].team.id;
      same([g.blue,g.red],r.sides.map(s=>s.team.id),'actual sides');same(g.kills,r.sides.map(s=>s.kills),'actual kills');
      check(g.winner===winner&&g.seed===r.seed&&g.duration===r.duration&&g.dur===r.durationStr,'winner seed duration');
      same(g.bans,r.draft.bans,'bans');same(g.picks,[0,1].map(s=>ROLES.map(role=>r.draft.picks[s][role])),'picks');
      same(g.publicRecord,publicMatchRecord(r,DB.patch.id),'objectives gold players and public record');
      same(lines.filter(l=>l.practiceGame===i+1),seriesResultLines(r,winner,g.mvp).map(l=>({...l,practiceGame:i+1})),'same actual player lines');
      if(i>0)check(!g.picks.flat().some(cid=>rec.games.slice(0,i).flatMap(x=>x.picks.flat()).includes(cid)),'Fearless across sets');
    }
    if(bo===1){
      check(LAST===calls[0].r&&!LASTSER,'screen owns actual single result reference');
      check(calls[0].quiet===false&&LAST.log.length>0&&LAST.goldHist.length>0,'detailed log and gold chart retained');
      same(node('#result').innerHTML,renderResult(LAST),'same detailed renderer');
      check(node('#result').innerHTML.includes('id="watch"')&&node('#watch').onclick,'watch remains bound');
      node('#watch').onclick();check(intervals.length===1,'watch replays existing log');
      colors.add(rec.games[0].blue===a.id?'blue':'red');
    }else check(LAST===null&&LASTSER===rec&&calls.every(x=>x.quiet===true),'multi-set UI and quiet behavior retained');
    for(const tid of [a.id,b.id]){
      const t=DB.teams[tid];check(t.practiceDay.scrim===n*SCRIM_PRACTICE_COST&&t.scrimLog.length===1,'practice resources/log consumed once');check(t.scrimLog[0].wins===rec.wins[tid]&&t.scrimLog[0].losses===n-rec.wins[tid],'summary uses actual set wins');
      for(const id of t.roster){const played=lines.filter(l=>l.pid===id).length;check(Math.abs(DB.players[id].fatigue-fatigue[id]-1.2*played)<1e-8,'fatigue once per played set')}
    }
    const evidence=DB.teams[a.id].practiceEvidence;
    same(evidence[0].games.map(g=>[g.win,g.color,g.picks.map(p=>p.champ)]),rec.games.map(g=>[g.winner===a.id,g.blue===a.id?'BLUE':'RED',lines.filter(l=>l.tid===a.id&&l.practiceGame===g.n).map(l=>l.champ)]),'practice observation matches actual result');
    const state=JSON.stringify(DB);viewMatch();bindMatch();if(bo===1){renderResult(LAST);renderLog(LAST)}else renderSeries(LASTSER,true);
    check(JSON.stringify(DB)===state&&writes===1&&calls.length===n,'rerender does not simulate or consume');
    const restored=unpackDB(packDB(DB));same(restored.teams[a.id].practiceEvidence,evidence,'save restores actual observations');same(restored.teams[a.id].scrimLog,DB.teams[a.id].scrimLog,'save restores summary');
    same({meta:DB.metaHistory,seasons:DB.world.seasons},JSON.parse(before),'practice leaves official history/meta untouched');
    cases.push({bo,seed:activeSeed,sets:n,side:rec.games[0].blue===a.id?'blue':'red'});
  }
  {
    check(colors.size===2,'coin selection covers both actual sides');
    for(const bo of [1,3,5])for(const fearless of [false,true]){
      const db=unpackDB(saved),options={fearless,firstChoice:'seed',replay:true,practice:false};
      calls=[];const old=simulateSeries(db,a.id,b.id,bo,'option-parity-'+bo+'-'+fearless,options);
      const oldCalls=calls.slice();calls=[];
      const detailed=simulateSeries(db,a.id,b.id,bo,'option-parity-'+bo+'-'+fearless,{...options,detailGame:1});
      check(calls.length===detailed.rec.games.length&&detailed.detail===calls[0].r,'detail is actual first set');
      same(detailed.lines,old.lines,'quiet/detail player statistics parity');check(Math.max(...detailed.rec.score)===Math.ceil(bo/2),'official ends at majority wins');
      same(detailed.rec.games.map(({publicRecord,...g})=>g),old.rec.games.map(({publicRecord,...g})=>g),'original rules/selection/Fearless result parity');
      same(calls.map(x=>[x.r.sides.map(s=>[s.kills,s.towersTaken,s.dragons,s.barons,s.herald]),x.r.goldHist]),oldCalls.map(x=>[x.r.sides.map(s=>[s.kills,s.towersTaken,s.dragons,s.barons,s.herald]),x.r.goldHist]),'quiet/detail objectives and gold parity');
      check(!('detail' in simulateSeries(db,a.id,b.id,1,'unused-detail',{...options,detailGame:2})),'unplayed detail absent');
      const manual=createSeriesSession(db,a.id,b.id,bo,'manual-'+bo+'-'+fearless,options);
      seriesApplyManagedSelection(db,manual,a.id,{kind:manual.chooser===a.id?'side':seriesSelectionPrompt(db,manual,a.id).remaining,value:manual.chooser===a.id?'red':seriesSelectionPrompt(db,manual,a.id).remaining==='side'?'blue':'last'});
      const played=playSeriesSessionGame(db,manual,null,false);check(played.game.seed===manual.seed+'/g1','manual selection keeps owning game seed');
    }
  }

  // Save a live practice session at the majority-win boundary: it is still unfinished.
  const sourceDb=unpackDB(saved),live=createSeriesSession(sourceDb,a.id,b.id,5,'practice-resume',{practice:true,replay:true,fearless:true});
  for(let i=0;i<3;i++)playSeriesSessionGame(sourceDb,live);
  check(!seriesSessionDone(live),'three completed sets do not finish a five-set scrim');
  const resumed=JSON.parse(JSON.stringify(live)),resumeDb=unpackDB(packDB(sourceDb));
  while(!seriesSessionDone(live))playSeriesSessionGame(sourceDb,live);
  while(!seriesSessionDone(resumed))playSeriesSessionGame(resumeDb,resumed);
  same(seriesSessionResult(sourceDb,live),seriesSessionResult(resumeDb,resumed),'saved session preserves remaining actual sets');
  const completed=seriesSessionResult(resumeDb,resumed).rec,last=completed.games[4];check(replayGame(resumeDb,completed,last)?.seed===last.seed,'practice replay reaches the fifth actual set');
  const official={...resumed,opt:{...resumed.opt,practice:false},wins:{[a.id]:3,[b.id]:0},games:resumed.games.slice(0,3)};
  check(seriesSessionDone(official),'official five-game maximum still stops at three wins');
  check(seriesSessionPrepareGame(resumeDb,official)===null,'no extra official game');
  for(const limited of [a.id,b.id]){
    DB=unpackDB(saved);SEL={blue:a.id,red:b.id,bo:5};calls=[];writes=0;saves=0;nodes=new Map();
    // A real daily resource constraint, without weakening the production cost.
    DB.teams[limited].practiceDay={...practiceDay(DB,DB.teams[limited]),drills:80,remaining:20};
    const prior=packDB(DB);bindMatch();node('#play').onclick();
    check(calls.length===0&&writes===0&&saves===0,'resource denial precedes match and practice effects');
    same(packDB(DB),prior,'resource denial preserves saved state');
  }

  for(const stale of ['world','slot','switching','manager','ai','fired','foreign','invalid-format']){
    DB=unpackDB(saved);SLOT='1';SLOT_SWITCHING=false;SEL={blue:a.id,red:b.id,bo:1};calls=[];writes=0;saves=0;nodes=new Map();
    bindMatch();const click=node('#play').onclick;
    if(stale==='world')DB=unpackDB(packDB(DB));
    if(stale==='slot')SLOT='2';if(stale==='switching')SLOT_SWITCHING=true;
    if(stale==='manager')DB.manager={...DB.manager};if(stale==='ai')DB.world.manage='ai';if(stale==='fired')DB.world.fired=true;
    if(stale==='foreign')SEL.blue=b.id;if(stale==='invalid-format')SEL.bo=4;
    const before=packDB(DB);click();check(calls.length===0&&writes===0&&saves===0,'stale or unauthorized callback '+stale);same(packDB(DB),before,'stale callback preserves world '+stale);
  }
  return {cases};
})()`,{filename:'scrim-single-result.vm.js',timeout:120000,setupSources:[
  'let DB,SEL,LAST,LASTSER,LOGMODE,LIVE,MSG,$,document,freshInternalSeed,saveDB,nav,setInterval,clearInterval,matchMedia;let SLOT="1",SLOT_SWITCHING=false;',
  currentSeries,esc,draftUi,screenSource
]});
console.log('SCRIM_SINGLE_RESULT_ACCEPTANCE PASS '+JSON.stringify(result));
