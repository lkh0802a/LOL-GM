// D03-B4: stale reports may rationally mis-rank a player, then fresh scouting revises the real market shortlist.
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {ENGINE_MODULES} from './artifact-modules.mjs';

const root=resolve(import.meta.dirname,'..','src','artifact');
let source='';
for(const file of ENGINE_MODULES)source+=await readFile(resolve(root,file),'utf8')+'\n';
source+=String.raw`(()=>{
  const assert=(x,m)=>{if(!x)throw new Error('D03_REASSESS '+m)};
  const cfg=defaultWorldConfig();
  cfg.regions=[
    regionCfg('NA',{teams:10,splits:1,legs:1,regularBo:1,playoffBo:1,
      playoffTake:4,format:'rr_po',div2:false,system:'franchise'}),
    regionCfg('EU',{teams:10,splits:1,legs:1,regularBo:1,playoffBo:1,
      playoffTake:4,format:'rr_po',div2:false,system:'franchise'})
  ];
  cfg.internationals=[];cfg.subs=1;cfg.changes='none';
  let db=buildWorld(cfg);
  const team=activeTeams(db,'NA',1)[0],manager=activeTeams(db,'EU',1)[0];
  assert(team&&manager,'fixture missing teams');
  setManagedTeam(db,manager.id);
  db.world={year:db.year,seed:'d03-b4',manage:'manual',phase:'market',
    seasons:{},steps:[],step:0,report:null,offers:[],marketLog:[]};
  team.philosophy='win-now';team.finance.cash=100;
  ensureFacilities(team).scouting=5;
  for(const s of staffByRole(team,'scout'))s.rating=94;

  const free=Object.values(db.players).filter(p=>!p.retired&&!p.team&&p.region==='NA');
  const byRole=Object.groupBy(free,p=>p.role);
  const role=ROLES.find(r=>(byRole[r]||[]).length>=2);
  assert(role,'fixture missing same-role free agents');
  const [stalePlayer,alternative]=byRole[role].slice(0,2);
  const setAll=(p,v)=>{for(const k of Object.keys(p.attrs||{}))p.attrs[k]=v};
  stalePlayer.age=25;stalePlayer.reputation=92;setAll(stalePlayer,90);stalePlayer.pot=92;
  alternative.age=25;alternative.reputation=72;setAll(alternative,76);alternative.pot=79;

  // Old observation is genuinely accurate when made.
  observeAiPlayer(db,team,stalePlayer,55,{comp:'NA',games:6});
  const oldReport=aiMarketObservation(db,stalePlayer,team);
  assert(oldReport.source==='scouted'&&oldReport.ability>=80,'failed to seed strong old report');

  // A year passes, then the player's true ability changes out of sight. The
  // club must keep the old estimate rather than magically knowing the decline.
  db.year++;db.world.year=db.year;ageScoutReports(db);
  setAll(stalePlayer,50);stalePlayer.pot=55;
  observeAiPlayer(db,team,alternative,55,{comp:'NA',games:6});
  const staleView=aiMarketObservation(db,stalePlayer,team),
    altView=aiMarketObservation(db,alternative,team),
    actualBefore=[playerOvr(stalePlayer),playerOvr(alternative)];
  assert(staleView.staleYears===1&&staleView.ability===oldReport.ability,
    'stale report was magically refreshed by hidden current ability');
  assert(actualBefore[0]<actualBefore[1],
    'fixture does not contain a real stale-report mistake');

  const budget=1e6,
    before=aiMarketOfferCandidates(db,team,[stalePlayer,alternative],role,budget,db.year);
  assert(before.length===2&&before[0].p.id===stalePlayer.id,
    'production market shortlist did not prefer the stale overestimate');
  const staleChoice={pid:before[0].p.id,value:before[0].v,
    actualOvr:playerOvr(before[0].p),report:staleView.ability};

  // Save before re-check: the mistake itself must be persistent, not a test-only transient.
  const stalePacked=packDB(db);db=unpackDB(stalePacked);
  const rt=db.teams[team.id],rp=db.players[stalePlayer.id],ra=db.players[alternative.id];
  assert(aiMarketOfferCandidates(db,rt,[rp,ra],role,budget,db.year)[0].p.id===rp.id,
    'stale market preference failed save/restore');

  // B3/B4 operation should prioritize the high-reputation stale dossier and
  // record how the exact production shortlist changes after the fresh visit.
  const op=aiRunScoutingOperation(db,rt);
  const reassess=op.reassessments.find(x=>x.pid===rp.id);
  assert(op.targets.some(x=>x.pid===rp.id)&&reassess,
    'active scouting did not re-check and audit the stale target');
  assert(reassess.staleYearsBefore===1&&reassess.valueDelta<0,
    'fresh observation did not revise the stale market valuation downward');

  const after=aiMarketOfferCandidates(db,rt,[rp,ra],role,budget,db.year);
  assert(after.length===2&&after[0].p.id===ra.id,
    'fresh scouting did not change the production market preference');
  const freshView=aiMarketObservation(db,rp,rt);
  assert(freshView.source==='scouted'&&freshView.staleYears===0&&
    freshView.ability<staleView.ability,
    'fresh report did not replace stale confidence with a lower estimate');

  // Use the same production signing transaction on isolated snapshots to show
  // that the information difference changes the player the club would recruit.
  let staleBranch=unpackDB(stalePacked),staleTeam=staleBranch.teams[team.id],
    staleA=staleBranch.players[stalePlayer.id],staleB=staleBranch.players[alternative.id],
    staleRows=aiMarketOfferCandidates(staleBranch,staleTeam,[staleA,staleB],role,budget,staleBranch.year);
  signMarketContract(staleBranch,staleRows[0].p,staleTeam,
    asking(staleBranch,staleRows[0].p,staleTeam.region),1,{},'fa','ai');
  assert(staleRows[0].p.team===staleTeam.id&&staleRows[0].p.id===stalePlayer.id,
    'stale branch did not execute the stale-information recruitment');

  const freshPacked=packDB(db);let freshBranch=unpackDB(freshPacked),
    freshTeam=freshBranch.teams[team.id],
    freshA=freshBranch.players[stalePlayer.id],freshB=freshBranch.players[alternative.id],
    freshRows=aiMarketOfferCandidates(freshBranch,freshTeam,[freshA,freshB],role,budget,freshBranch.year);
  signMarketContract(freshBranch,freshRows[0].p,freshTeam,
    asking(freshBranch,freshRows[0].p,freshTeam.region),1,{},'fa','ai');
  assert(freshRows[0].p.team===freshTeam.id&&freshRows[0].p.id===alternative.id,
    'fresh branch did not execute the revised recruitment');

  db=unpackDB(freshPacked);
  const savedState=db.teams[team.id].scoutingState;
  assert(savedState.reassessments.some(x=>x.pid===stalePlayer.id&&x.valueDelta<0),
    'reassessment evidence failed save/restore');

  console.log('D03_SCOUTING_REASSESSMENT_ACCEPTANCE '+JSON.stringify({
    role,stalePlayer:stalePlayer.id,alternative:alternative.id,
    actualOvr:actualBefore,
    stale:{ability:staleView.ability,value:staleChoice.value,choice:staleChoice.pid},
    fresh:{ability:freshView.ability,value:after.find(x=>x.p.id===rp.id).v,
      choice:after[0].p.id},
    reassessment:{before:reassess.before,after:reassess.after,
      valueDelta:reassess.valueDelta,leaderChanged:reassess.leaderChanged,
      rankChanged:reassess.rankChanged},
    operation:{targets:op.targets.length,spent:op.spent},
    saveFormat:JSON.parse(freshPacked).saveFormat
  }));
})();`;
vm.runInNewContext(source,{console,Date,Math,JSON,Set,Map,WeakMap,Object,
  Array,String,Number,Boolean,RegExp,Error,Intl,performance,crypto},{timeout:30000});
