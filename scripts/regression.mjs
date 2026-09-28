import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ENGINE_MODULES } from './artifact-modules.mjs';
import vm from 'node:vm';

const root = resolve(import.meta.dirname, '..');
const artifact = resolve(root, 'src', 'artifact');
let source = '';
for (const file of ENGINE_MODULES) source += `${await readFile(resolve(artifact, file), 'utf8')}\n`;

source += `
(()=>{
  const results=[];
  const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
  const test=(id,fn)=>{fn();results.push(id)};
  const teamFixture=db=>{
    const teams=activeTeams(db,null,1).slice(0,2);assert(teams.length===2,'fixture needs two first-division teams');
    const used=new Set();
    for(const t of teams){
      t.roster=[];t.depthChart={};
      for(const role of ROLES){
        const p=Object.values(db.players).find(x=>!x.retired&&!x.team&&!used.has(x.id)&&x.role===role);
        assert(p,'fixture missing '+role+' player');used.add(p.id);assignPlayerToTeam(db,p,t);setDepthStarter(db,t,role,p,'regression',true);
      }
      assert(validateStartingLineup(db,t).ok,'fixture lineup invalid: '+t.id);
    }
    return teams;
  };
  const seriesPicks=rec=>(rec.games||[]).flatMap(g=>(g.picks||[]).flat());
  const uniqueSeriesPicks=rec=>{const p=seriesPicks(rec);return new Set(p).size===p.length};

  const faultAfterActionApply=(db,preview)=>{
    const handler=WORLD_ACTION_HANDLERS[preview.command.type],old=handler.apply;
    let writerFinished=false;
    try{
      handler.apply=(state,command)=>{
        const applied=old(state,command);
        writerFinished=true;
        throw new Error('regression forced late writer failure');
      };
      const result=applyWorldAction(db,preview);
      assert(writerFinished,'fault injection did not reach the completed domain writer: '+preview.command.type);
      return result;
    }finally{handler.apply=old}
  };

  test('01-world-bootstrap',()=>{
    const db=buildWorld();
    assert(db.version===15,'save schema baseline drift');
    assert(Object.values(CHAMPION_SOURCE_SNAPSHOT.champions).length===173,'champion snapshot count drift');
    assert(Object.keys(db.patch.itemDefs||{}).length===254,'item snapshot count drift');
    assert(Object.keys(db.patch.runeDefs||{}).length===62,'rune snapshot count drift');
    assert(activeTeams(db).every(t=>(t.roster||[]).length===0),'first-season rosters must start blank');
    assert(Object.values(db.regions).every(R=>R.importLimit===2),'first-team non-local cap drift');
    assert(STAFF_DEPT_LIMITS.coach===9&&STAFF_DEPT_LIMITS.analyst===4&&STAFF_DEPT_LIMITS.scout===6,'staff department caps drift');
  });

  test('02-player-lineup',()=>{
    const db=buildWorld(),[t]=teamFixture(db),mid=starterFor(db,t,'MID'),top=starterFor(db,t,'TOP');
    assert(mid&&top,'lineup fixture missing starters');
    assert(setDepthStarter(db,t,'TOP',mid,'regression',true).ok,'off-role game-slot assignment was blocked');
    assert(setDepthStarter(db,t,'MID',top,'regression',true).ok,'second free game-slot assignment was blocked');
    assert(validateStartingLineup(db,t).ok,'free-role lineup became invalid');
    assert(mid.role==='MID'&&top.role==='TOP','game-slot assignment changed primary-role identity');
  });

  test('03-roster-role-state',()=>{
    const db=buildWorld(),[t]=teamFixture(db),p=starterFor(db,t,'MID');
    const old=p.rosterRole;
    const r=setRosterRole(db,p,'core','regression',true);
    assert(r.ok&&p.rosterRole==='core','roster-role assignment failed');
    assert(SQUAD_ROLES.length===5&&SQUAD_ROLES.includes(old||recommendedRosterRole(db,p,t)),'roster-role model drift');
    p.fatigue=60;p.condition=75;t.training=defaultTraining();const rec=trainingRecommendation(db,t);
    assert(['light','normal','high'].includes(rec.intensity),'training recommendation invalid');
  });

  test('04-rookie-supply',()=>{
    const db=buildWorld(),R=Object.values(db.regions)[0],before=Object.keys(db.players).length;
    const cls=generateRookieClass(db,R,new RNG('regression-rookie','class')),row=R.rookieIntake.at(-1);
    assert(cls.length===row.profile.count&&cls.length>0,'rookie intake count drift');
    assert(cls.every(p=>p.age>=17&&p.age<=19&&p.rookieTier),'rookie intake schema drift');
    assert(typeof generateEmergencyRookie==='undefined','per-team emergency rookie generator returned');
    assert(Object.keys(db.players).length>before,'rookie class did not enter player pool');
  });

  test('05-contracts',()=>{
    const db=buildWorld(),t=activeTeams(db,null,1)[0],p=Object.values(db.players).find(x=>!x.team);
    const terms=normalizeContractTerms(db,p,t,3.2,9,{signingBonus:.5,bonuses:{performance:.2,title:.3,international:.1},buyout:8,option:{type:'player',salary:3.4},promisedRole:'competition'});
    assert(terms.years===3,'confirmed three-year contract maximum drift');
    assert(terms.option?.type==='player'&&terms.promisedRole==='competition','contract clause normalization drift');
    signContract(db,p,t,terms.salary,terms.years,terms);
    const loaded=unpackDB(packDB(db)),q=loaded.players[p.id];
    assert(q.contract?.years===3&&q.contract?.buyout===8&&q.contract?.option?.type==='player','contract save round-trip drift');
  });

  test('06-owned-reserve-roster',()=>{
    const db=buildWorld(),parent=activeTeams(db,null,1).find(t=>reserveTeamsOf(db,t).length);
    assert(parent,'owned-reserve fixture unavailable');const reserve=reserveTeamsOf(db,parent)[0],free=Object.values(db.players).filter(p=>!p.team).slice(0,11);
    parent.roster=[];reserve.roster=[];for(let i=0;i<10;i++)assignPlayerToTeam(db,free[i],i<5?parent:reserve);
    let plan=rosterPlanState(db,parent),bad=validateRosterPlan(db,parent,plan);
    assert(!bad.ok&&bad.errors.some(x=>x.includes('통합 로스터')),'owned-reserve integrated minimum no longer enforces emergency buffer');
    assignPlayerToTeam(db,free[10],parent);plan=rosterPlanState(db,parent);const good=validateRosterPlan(db,parent,plan);
    assert(good.ok&&good.total===11,'11-player integrated roster baseline failed');
    const up=reserve.roster[0],down=parent.roster[0];plan.assignments[up]=parent.id;plan.assignments[down]=reserve.id;
    const applied=applyRosterPlan(db,parent,plan,'regression');
    assert(applied.moves.length===2&&db.players[up].team===parent.id&&db.players[down].team===reserve.id,'atomic first/reserve swap failed');
  });

  test('06b-roster-transaction',()=>{
    const db=buildWorld(),parent=activeTeams(db,null,1).find(t=>reserveTeamsOf(db,t).length);
    assert(parent,'transaction fixture needs reserve organization');
    const reserve=reserveTeamsOf(db,parent)[0],free=Object.values(db.players).filter(p=>!p.team).slice(0,11);
    for(let i=0;i<free.length;i++)assignPlayerToTeam(db,free[i],i<6?parent:reserve);
    setManagedTeam(db,parent.id);
    const up=reserve.roster[0],down=parent.roster[0],plan=rosterPlanState(db,parent);
    plan.assignments[up]=parent.id;plan.assignments[down]=reserve.id;
    const action={type:'roster.plan',parentId:parent.id,assignments:plan.assignments,actor:'manager'};
    const before=JSON.stringify(rosterActionSnapshot(db,parent.id));
    const wrong=previewWorldAction(db,{...action,assignments:{...plan.assignments,[up]:'UNKNOWN'}});
    assert(!wrong.ok&&wrong.reason==='roster_invalid','invalid roster transaction should reject before applying');
    assert(JSON.stringify(rosterActionSnapshot(db,parent.id))===before,'invalid preview must not mutate organization state');
    const aiBlocked=previewWorldAction(db,{...action,actor:'ai'});
    assert(!aiBlocked.ok&&aiBlocked.reason==='unauthorized','AI cannot commit the managed club roster');
    const preview=previewWorldAction(db,action);
    assert(preview.ok&&preview.changes.length===2&&preview.total===11,'roster transaction preview must report exact moves');
    assert(JSON.stringify(rosterActionSnapshot(db,parent.id))===before,'valid preview must be read-only');
    plan.assignments[up]=reserve.id;
    assert(preview.command.assignments[up]===parent.id,'preview must hold an independent immutable-intent snapshot');
    const saveDate=db.worldDate;db.worldDate='2028-02-01';
    const expired=applyWorldAction(db,preview);
    assert(!expired.ok&&expired.reason==='stale_preview','date drift must reject pending roster application');
    db.worldDate=saveDate;
    assert(JSON.stringify(rosterActionSnapshot(db,parent.id))===before,'stale rejection must not mutate rosters');
    const result=applyWorldAction(db,preview);
    assert(result.ok&&result.moves.length===2&&db.players[up].team===parent.id&&db.players[down].team===reserve.id,'previewed roster swap failed');
    const repeated=applyWorldAction(db,preview);
    assert(!repeated.ok&&repeated.reason==='stale_preview','replaying a committed plan must be rejected');
    assert(!rosterIntegrityErrors(db).length,'committed roster action must retain team/player consistency');
    const unowned=activeTeams(db,null,1).find(t=>t.id!==parent.id);
    const forbidden=previewWorldAction(db,{type:'roster.plan',parentId:unowned.id,assignments:{},actor:'manager'});
    assert(!forbidden.ok&&forbidden.reason==='unauthorized','manager action must not reach unowned teams');
  });


  test('06c-player-sign-transaction',()=>{
    const db=buildWorld(),team=activeTeams(db,null,1)[0],p=Object.values(db.players).find(x=>!x.retired&&!x.team&&isLocalPlayer(x,team.region));
    assert(p,'free agent fixture missing');setManagedTeam(db,team.id);db.world={year:db.year,manage:'manual'};
    const command={type:'player.sign',pid:p.id,teamId:team.id,kind:'fa',actor:'manager',
      salary:3.2,years:2,terms:{signingBonus:1,promisedRole:'starter',buyout:8,bonuses:{title:.2}}};
    team.finance.cash=20;
    const before=JSON.stringify(playerActionSnapshot(db,command));
    const wrong=previewWorldAction(db,{...command,salary:-1});
    assert(!wrong.ok&&wrong.reason==='invalid_terms','negative contract terms must fail');
    const badTarget=previewWorldAction(db,{...command,teamId:activeTeams(db,null,1)[1].id});
    assert(!badTarget.ok&&badTarget.reason==='unauthorized','manager may not sign for another organization');
    const preview=previewWorldAction(db,command);
    assert(preview.ok&&preview.changes[0].salary===3.2&&preview.changes[0].years===2,'signing preview must expose contract effects');
    assert(JSON.stringify(playerActionSnapshot(db,command))===before,'contract preview must be read-only');
    team.finance.cash=0;
    const stale=applyWorldAction(db,preview);
    assert(!stale.ok&&stale.reason==='stale_preview','financial state drift must reject signing');
    team.finance.cash=20;
    assert(JSON.stringify(playerActionSnapshot(db,command))===before,'failed signing must preserve club and player');
    const applied=applyWorldAction(db,preview);
    assert(applied.ok&&p.team===team.id&&p.contract.salary===3.2&&p.contract.years===2,'FA contract commit failed');
    assert(team.finance.cash===19&&team.roster.includes(p.id),'signing bonus or registration missing');
    const replay=applyWorldAction(db,preview);
    assert(!replay.ok&&replay.reason==='stale_preview','signing must not apply twice');
    const renewal=commitWorldAction(db,{type:'player.sign',pid:p.id,teamId:team.id,kind:'renewal',
      actor:'manager',salary:4,years:3,terms:{promisedRole:'core'}});
    assert(renewal.ok&&p.contract.salary===4&&p.contract.years===3&&team.roster.filter(id=>id===p.id).length===1,'renewal must update existing contract without duplicating roster');
    assert(!rosterIntegrityErrors(db).length,'sign and renewal must retain roster integrity');
    const loaded=unpackDB(packDB(db));
    assert(loaded.players[p.id].contract.salary===4,'transaction contract must survive save roundtrip');
  });

  test('06d-player-transfer-transaction',()=>{
    const db=buildWorld(),teams=activeTeams(db,null,1),buyer=teams[0],seller=teams[1];
    const p=Object.values(db.players).find(x=>!x.retired&&!x.team&&isLocalPlayer(x,buyer.region));
    assert(p,'transfer fixture missing');setManagedTeam(db,buyer.id);db.world={year:db.year,manage:'manual'};
    assignPlayerToTeam(db,p,seller);
    p.contract={salary:2,until:db.year+1,years:2,signingBonus:0,promisedRole:'starter'};
    buyer.finance.cash=25;seller.finance.cash=10;
    const command={type:'player.sign',pid:p.id,teamId:buyer.id,fromId:seller.id,
      kind:'transfer',actor:'manager',fee:7,salary:2.5,years:3,
      terms:{signingBonus:1,promisedRole:'starter'}};
    const before=JSON.stringify(playerActionSnapshot(db,command));
    const invalid=previewWorldAction(db,{...command,fee:50});
    assert(!invalid.ok&&invalid.reason==='insufficient_cash','transfer must reject insufficient buyer cash');
    assert(JSON.stringify(playerActionSnapshot(db,command))===before,'invalid transfer preview must preserve player/club state');
    const prev=previewWorldAction(db,command);
    assert(prev.ok&&prev.changes[0].fee===7,'transfer preview must describe the fee');
    p.contract.salary=2.1;
    assert(!applyWorldAction(db,prev).ok,'stale seller terms must block transfer');
    p.contract.salary=2;
    const done=applyWorldAction(db,prev);
    assert(done.ok&&p.team===buyer.id&&p.contract.salary===2.5,'transfer and agreed contract must commit together');
    assert(buyer.finance.cash===17&&seller.finance.cash===17,'transfer fee and contract bonus settlement changed');
    assert(p.contractedMoves?.length===1&&p.contractedMoves[0].fee===7,'transfer move count must be recorded once');
    assert(!seller.roster.includes(p.id)&&buyer.roster.includes(p.id),'transfer registration is inconsistent');
    const old=JSON.stringify(playerActionSnapshot(db,command));
    const reject=commitWorldAction(db,{type:'player.transfer',pid:p.id,fromId:seller.id,teamId:buyer.id,fee:1,actor:'ai'});
    assert(!reject.ok&&JSON.stringify(playerActionSnapshot(db,command))===old,'invalid second transfer must not partially mutate');
    assert(!rosterIntegrityErrors(db).length,'transfer must retain roster integrity');
  });

  test('06e-ai-transfer-and-move-limit',()=>{
    const db=buildWorld(),teams=activeTeams(db,null,1),seller=teams[0],buyer=teams[1],owner=teams[2];
    const p=Object.values(db.players).find(x=>!x.retired&&!x.team&&isLocalPlayer(x,buyer.region));
    assert(p,'AI transfer fixture missing');setManagedTeam(db,owner.id);db.world={year:db.year,manage:'manual'};
    assignPlayerToTeam(db,p,seller);p.contract={salary:1.5,until:db.year+1,years:2};
    const command={type:'player.transfer',pid:p.id,fromId:seller.id,teamId:buyer.id,fee:1.2,actor:'ai'};
    buyer.finance.cash=10;seller.finance.cash=5;
    const preview=previewWorldAction(db,command);
    assert(preview.ok,'AI permanent transfer must share transaction gateway');
    const sent=applyWorldAction(db,preview);
    assert(sent.ok&&p.team===buyer.id&&p.contract.salary===1.5,'AI transfer must retain original contract');
    assert(Math.abs(buyer.finance.cash-8.8)<1e-9&&Math.abs(seller.finance.cash-6.2)<1e-9,'AI transfer fee must settle');
    const back=commitWorldAction(db,{type:'player.transfer',pid:p.id,fromId:buyer.id,teamId:seller.id,fee:0,actor:'ai'});
    assert(back.ok&&p.contractedMoves?.length===2,'AI reciprocal transfer must count as second season move');
    const state=JSON.stringify(playerActionSnapshot(db,command));
    const blocked=commitWorldAction(db,command);
    assert(!blocked.ok&&blocked.reason==='invalid_transfer','third contracted move must be prohibited');
    assert(JSON.stringify(playerActionSnapshot(db,command))===state,'move-limit rejection must leave both clubs unchanged');
    assert(!rosterIntegrityErrors(db).length,'AI transfer must keep roster integrity');
  });

  test('06f-release-and-option-transaction',()=>{
    const db=buildWorld(),teams=activeTeams(db,null,1),team=teams[0],other=teams[1];
    setManagedTeam(db,team.id);db.world={year:db.year,manage:'manual'};
    const p=Object.values(db.players).find(x=>!x.retired&&!x.team&&isLocalPlayer(x,team.region));
    assert(p,'release fixture missing');
    assignPlayerToTeam(db,p,team);team.finance.cash=15;team.finance.buyout=0;
    p.contract={salary:2,until:db.year+1,years:2,option:{type:'team',year:db.year,salary:3}};
    const blocked=commitWorldAction(db,{type:'player.release',pid:p.id,teamId:other.id,mode:'manager',actor:'manager'});
    assert(!blocked.ok&&p.team===team.id,'release of another club player must be blocked');
    const prev=previewWorldAction(db,{type:'player.release',pid:p.id,teamId:team.id,mode:'manager',actor:'manager'});
    assert(prev.ok&&prev.changes[0].cost===2,'release preview must show termination expense');
    const done=applyWorldAction(db,prev);
    assert(done.ok&&!p.team&&!p.contract&&team.finance.buyout===2,'manager release must settle cost and move player to FA');
    assert(!rosterIntegrityErrors(db).length,'release must keep roster integrity');
    assignPlayerToTeam(db,p,team);p.contract={salary:2,until:db.year-1,years:1,option:{type:'team',year:db.year,salary:3}};
    const option=commitWorldAction(db,{type:'player.option',pid:p.id,teamId:team.id,actor:'manager'});
    assert(option.ok&&p.contract.salary===3&&p.contract.option===null,'team option transaction failed');
    const again=commitWorldAction(db,{type:'player.option',pid:p.id,teamId:team.id,actor:'manager'});
    assert(!again.ok&&again.reason==='invalid_option','an exercised option cannot be repeated');
    const expired=commitWorldAction(db,{type:'player.release',pid:p.id,teamId:team.id,mode:'expired',actor:'ai'});
    assert(!expired.ok&&p.team===team.id,'AI may not auto-release nonexpired managed club contracts');
  });

  test('06g-save-format-and-cache-isolation',()=>{
    const db=buildWorld(),team=activeTeams(db)[0],p=Object.values(db.players).find(x=>x&&x.attrs);
    assert(team&&p,'save format test fixture missing');
    db._marketDemandCache={test:123};db.initialPayrollFloorCache={stale:true};
    db.patches.base={test:'do not serialize'};db.patches.initialBase={test:'do not serialize'};
    db.metaHistory=[{date:'2027-02-01',patch:db.patch.id,comp:'SAVE_REGRESSION',
      sides:[{team:team.id,region:team.region,win:true,
        picks:[{champ:Object.keys(db.patch.champions)[0],role:'MID',player:p.id,items:['item-a'],runes:['rune-b']}]}],
      bans:[['BAN']],regions:[team.region],international:false}];
    const original=JSON.stringify(db),packed=packDB(db),stored=JSON.parse(packed);
    assert(JSON.stringify(db)===original,'save packing must not mutate runtime world');
    assert(stored.saveFormat===SAVE_FORMAT_VERSION&&stored.version===15&&stored.packed===1&&stored.metaHistoryPacked===1,
      'save format version or compact metadata drift');
    for(const key of SAVE_TRANSIENT_ROOT_FIELDS)if(key!=='packed'&&key!=='metaHistoryPacked')
      assert(!Object.prototype.hasOwnProperty.call(stored,key),'transient root data leaked: '+key);
    assert(!Object.prototype.hasOwnProperty.call(stored.patches,'base')&&
      !Object.prototype.hasOwnProperty.call(stored.patches,'initialBase'),'large patch baselines leaked');
    const loaded=unpackDB(packed),row=loaded.metaHistory[0];
    assert(loaded.saveFormat===SAVE_FORMAT_VERSION&&
      !Object.prototype.hasOwnProperty.call(loaded,'packed')&&
      !Object.prototype.hasOwnProperty.call(loaded,'metaHistoryPacked')&&
      !Object.prototype.hasOwnProperty.call(loaded,'_marketDemandCache')&&
      !Object.prototype.hasOwnProperty.call(loaded,'initialPayrollFloorCache'),
      'serialized cache or compact marker survived restoration');
    assert(row.sides[0].picks[0].player===p.id&&row.sides[0].picks[0].items[0]==='item-a'&&
      row.sides[0].picks[0].runes[0]==='rune-b','save migration dropped rich meta history');
    assert(!rosterIntegrityErrors(loaded).length,'save restoration damaged roster invariants');
    assert(packDB(loaded).includes('"saveFormat":2'),'normalized save could not be repacked');
  });

  test('06h-legacy-v15-save-restoration',()=>{
    const db=buildWorld(),team=activeTeams(db)[0],p=Object.values(db.players).find(x=>x&&x.attrs);
    const legacy=JSON.parse(JSON.stringify(db));
    delete legacy.saveFormat;delete legacy.packed;delete legacy.metaHistoryPacked;
    legacy.metaHistory=[['2027-03-01','27.1','SAVE_LEGACY','LEGACY',2027,1,'regular',
      'KR',0,['KR'],[[team.id,team.region,1,[['CHAMP','MID',p.id,['sword'],['rune']]]]],[]]];
    legacy.players[p.id].attrs=ALL_ATTRS.map(a=>p.attrs[a]);
    legacy.players[p.id].tend=TENDENCIES.map(k=>p.tend[k]);
    legacy.players[p.id].pool={legacy:[70,3,40,50,2,5,1,2]};
    delete legacy.players[p.id].activeLocalRegion;
    delete legacy.players[p.id].contractedMoves;
    const oldStaff=(legacy.teams[team.id].staffRoster||[])[0];
    delete legacy.teams[team.id].staffRoster;
    legacy.teams[team.id].staff={analyst:oldStaff||{id:'legacy',role:'analyst',rating:55}};
    legacy.teams[team.id].coach={id:'old-coach'};
    legacy.coachPool=[{id:'old-coach'}];
    legacy.world={year:db.year,phase:'season',pendingOfficial:{
      date:'2027-04-02',queue:[{seasonKey:'SAVE_LEGACY',matchId:'M1',session:{g:2,games:[{n:1}]}}]},
      negotiations:{'NEG_TEST':{id:'NEG_TEST',status:'open'}},
      recruitment:{targets:{[p.id]:{stage:'negotiating',negotiationId:'NEG_TEST'}}}};
    const before=JSON.stringify(legacy),loaded=unpackDB(before),lp=loaded.players[p.id];
    assert(JSON.stringify(legacy)===before,'migration mutated its serialized input fixture');
    assert(loaded.saveFormat===2&&!Object.prototype.hasOwnProperty.call(loaded,'coachPool')&&
      !Object.prototype.hasOwnProperty.call(loaded.teams[team.id],'coach')&&
      !Object.prototype.hasOwnProperty.call(loaded.teams[team.id],'staff')&&
      Array.isArray(loaded.teams[team.id].staffRoster),'legacy staff cleanup failed');
    assert(!Array.isArray(lp.attrs)&&lp.attrs[ALL_ATTRS[0]]===p.attrs[ALL_ATTRS[0]]&&
      lp.pool.legacy.scrimSeason===1&&lp.pool.legacy.trainingSeason===2&&
      lp.activeLocalRegion===lp.originLocalRegion&&Array.isArray(lp.contractedMoves),
      'legacy player fields were not restored');
    assert(loaded.metaHistory[0].sides[0].picks[0].runes[0]==='rune'&&
      loaded.world.pendingOfficial.queue[0].session.g===2&&
      loaded.world.negotiations.NEG_TEST.status==='open'&&
      loaded.world.recruitment.targets[p.id].negotiationId==='NEG_TEST',
      'legacy v15 load lost pending match, meta history or ongoing negotiations');
    assert(!rosterIntegrityErrors(loaded).length,'legacy load damaged roster consistency');
  });

  test('06i-invalid-and-forward-saves',()=>{
    const db=buildWorld(),raw=JSON.parse(packDB(db));
    for(const [name,bad] of [
      ['older-unsupported-world',{...raw,version:14}],
      ['future-world',{...raw,version:16}],
      ['future-format',{...raw,saveFormat:99}],
      ['missing-regions',{...raw,regions:null}],
      ['malformed-teams',{...raw,teams:[]}]]){
      let rejected=false;
      try{unpackDB(JSON.stringify(bad))}catch(e){rejected=true}
      assert(rejected,'invalid or unsupported save silently loaded: '+name);
    }
    const integrityProbe=buildWorld();
    integrityProbe.metaHistoryPacked=1;
    integrityProbe.metaHistory=[['legacy',null]];
    const before=JSON.stringify(integrityProbe);
    rosterIntegrityErrors(integrityProbe);
    assert(JSON.stringify(integrityProbe)===before,'roster integrity check must not secretly migrate save records');
  });


  test('06j-transaction-transfer-rollback',()=>{
    for(const kind of ['player.sign','player.transfer']){
      const db=buildWorld(),[buyer,seller]=activeTeams(db,null,1),
        p=Object.values(db.players).find(x=>!x.retired&&!x.team&&isLocalPlayer(x,buyer.region));
      assert(p,'rollback transfer test lacks local FA fixture');
      setManagedTeam(db,buyer.id);db.world={year:db.year,phase:'market',manage:'manual'};
      assignPlayerToTeam(db,p,seller);
      p.contract={salary:2,until:db.year+1,years:2,option:null};
      buyer.finance.cash=40;seller.finance.cash=8;
      db._marketDemandCache={rollbackProbe:1};
      const command={type:kind,pid:p.id,teamId:buyer.id,fromId:seller.id,
        actor:'manager',fee:4,...(kind==='player.sign'?
          {kind:'transfer',salary:3,years:2,terms:{signingBonus:1,promisedRole:'starter'}}:{})};
      const before=JSON.stringify(db),rosterRef=buyer.roster,newsRef=db.news;
      const preview=previewWorldAction(db,command);
      assert(preview.ok,'player transfer rollback preview failed: '+kind);
      assert(JSON.stringify(db)===before,'transfer validation or preview wrote to world: '+kind);
      const failed=faultAfterActionApply(db,preview);
      assert(!failed.ok&&failed.reason==='apply_failed','late transfer error did not report rollback: '+kind);
      assert(JSON.stringify(db)===before,'failed transfer leaked fees, roster, contract, news or move history: '+kind);
      assert(db.players[p.id]===p&&buyer.roster===rosterRef&&db.news===newsRef,
        'failed transfer replaced externally referenced player/roster/news object: '+kind);
      assert(!rosterIntegrityErrors(db).length,'transfer rollback damaged membership: '+kind);
      const retried=applyWorldAction(db,preview);
      assert(retried.ok&&p.team===buyer.id&&seller.finance.cash===12&&buyer.finance.cash===(kind==='player.sign'?35:36),
        'transfer cannot commit after reverted late failure: '+kind);
    }
  });

  test('06k-transaction-roster-rollback',()=>{
    const db=buildWorld(),parent=activeTeams(db,null,1).find(t=>reserveTeamsOf(db,t).length);
    assert(parent,'rollback roster fixture needs owned reserve');
    const reserve=reserveTeamsOf(db,parent)[0],players=Object.values(db.players).filter(p=>!p.team).slice(0,11);
    for(let i=0;i<11;i++)assignPlayerToTeam(db,players[i],i<6?parent:reserve);
    setManagedTeam(db,parent.id);db.world={year:db.year,manage:'manual'};
    const up=reserve.roster[0],down=parent.roster[0],plan=rosterPlanState(db,parent);
    plan.assignments[up]=parent.id;plan.assignments[down]=reserve.id;
    const command={type:'roster.plan',parentId:parent.id,assignments:plan.assignments,actor:'manager'};
    const before=JSON.stringify(db),parentRef=parent.roster,reserveRef=reserve.roster,
      upRef=db.players[up],downRef=db.players[down];
    const preview=previewWorldAction(db,command);
    assert(preview.ok&&JSON.stringify(db)===before,'roster action preview mutated world');
    const rejected=faultAfterActionApply(db,preview);
    assert(!rejected.ok&&rejected.reason==='apply_failed'&&JSON.stringify(db)===before,
      'late roster-swap error left a partial move, satisfaction change, chart or player event');
    assert(db.players[up]===upRef&&db.players[down]===downRef&&parent.roster===parentRef&&reserve.roster===reserveRef,
      'rollback failed to preserve roster and player references');
    const foreign=unpackDB(packDB(db));foreign.saveId='independent-world';
    const foreignBefore=JSON.stringify(foreign);
    const cross=applyWorldAction(foreign,preview);
    assert(!cross.ok&&cross.reason==='stale_preview'&&JSON.stringify(foreign)===foreignBefore,
      'a roster preview must not be applicable to another saved world');
    const completed=applyWorldAction(db,preview);
    assert(completed.ok&&db.players[up].team===parent.id&&db.players[down].team===reserve.id,
      'roster swap could not commit after rollback');
    assert(!rosterIntegrityErrors(db).length,'roster rollback/retry failed integrity');
  });

  test('06l-transaction-release-option-rollback',()=>{
    const db=buildWorld(),t=activeTeams(db,null,1)[0],p=Object.values(db.players).find(x=>!x.team);
    assert(p,'release rollback fixture missing free agent');
    setManagedTeam(db,t.id);db.world={year:db.year,manage:'manual'};
    assignPlayerToTeam(db,p,t);t.finance.buyout=1;
    p.contract={salary:2,until:db.year+1,years:2,
      option:{type:'team',year:db.year,salary:3}};
    db._marketDemandCache={rollbackProbe:2};
    const release={type:'player.release',pid:p.id,teamId:t.id,actor:'manager',mode:'manager'},
      rpreview=previewWorldAction(db,release),before=JSON.stringify(db);
    assert(rpreview.ok,'release rollback preview failed');
    const released=faultAfterActionApply(db,rpreview);
    assert(!released.ok&&released.reason==='apply_failed'&&JSON.stringify(db)===before,
      'failed release left a buyout, role, contract or event mutation');
    const option={type:'player.option',pid:p.id,teamId:t.id,actor:'manager'},
      opreview=previewWorldAction(db,option);
    assert(opreview.ok&&JSON.stringify(db)===before,'option preview changed player state');
    const attempted=faultAfterActionApply(db,opreview);
    assert(!attempted.ok&&attempted.reason==='apply_failed'&&JSON.stringify(db)===before,
      'failed option left a salary/year or event mutation');
    const accepted=applyWorldAction(db,opreview);
    assert(accepted.ok&&p.contract.salary===3&&!p.contract.option,
      'team option could not be exercised after rollback');
    assert(!rosterIntegrityErrors(db).length,'release/option rollback affected roster integrity');
  });

  test('06m-transaction-actor-parity-and-membership-guard',()=>{
    const db=buildWorld(),t=activeTeams(db,null,1)[0],
      p=Object.values(db.players).find(x=>!x.team&&isLocalPlayer(x,t.region));
    assert(p,'actor parity fixture missing FA');
    setManagedTeam(db,t.id);db.world={year:db.year,manage:'ai'};
    t.finance.cash=25;
    const base={type:'player.sign',pid:p.id,teamId:t.id,kind:'fa',salary:3,years:2,
      terms:{promisedRole:'starter',signingBonus:1}};
    const start=JSON.stringify(db),manager=previewWorldAction(db,{...base,actor:'manager'}),
      ai=previewWorldAction(db,{...base,actor:'ai'});
    assert(manager.ok&&ai.ok&&JSON.stringify(manager.changes)===JSON.stringify(ai.changes),
      'AI delegation and manager path produced different contract preview');
    assert(JSON.stringify(db)===start,'actor parity previews mutated world');
    db.world.manage='manual';
    const blocked=previewWorldAction(db,{...base,actor:'ai'});
    assert(!blocked.ok&&blocked.reason==='unauthorized','managed-club manual contracts must reject AI');
    db.world.manage='ai';
    const unrelated=previewWorldAction(db,{...base,actor:'unknown'});
    assert(!unrelated.ok&&unrelated.reason==='invalid_actor','unknown actor must be rejected');
    // A domain writer that returns success with duplicate registrations must
    // be detected and rolled back, not recorded as a committed action.
    const original=WORLD_ACTION_HANDLERS['player.sign'].apply;
    try{
      WORLD_ACTION_HANDLERS['player.sign'].apply=(state,command)=>{
        const result=original(state,command);
        state.teams[command.teamId].roster.push(command.pid);
        return result;
      };
      const rejected=applyWorldAction(db,manager);
      assert(!rejected.ok&&rejected.reason==='apply_failed'&&JSON.stringify(db)===start,
        'post-commit membership violation must roll back all command effects');
    }finally{WORLD_ACTION_HANDLERS['player.sign'].apply=original}
    const success=applyWorldAction(db,ai);
    assert(success.ok&&p.team===t.id&&p.contract.salary===3,'AI delegate signing failed after integrity rollback');
    const replay=applyWorldAction(db,manager);
    assert(!replay.ok&&replay.reason==='stale_preview','manager action duplicated the delegated transaction');
    const resumed=unpackDB(packDB(db));
    assert(resumed.players[p.id].contract.salary===3&&resumed.teams[t.id].roster.includes(p.id)&&
      !rosterIntegrityErrors(resumed).length,'committed shared transaction cannot resume from save');
  });

  test('07-staff-migration-caps',()=>{
    const db=buildWorld(),t=activeTeams(db)[0];t.coach={id:'legacy'};t.staff={analyst:{id:'legacy-a',role:'analyst',rating:60}};
    migrateLegacyStaffState(db);
    assert(!Object.prototype.hasOwnProperty.call(t,'coach')&&!Object.prototype.hasOwnProperty.call(t,'staff'),'legacy staff fields survived migration');
    assert(Array.isArray(t.staffRoster)&&t.staffRoster.some(x=>x.role==='analyst'),'legacy staff roster migration failed');
    assert(!staffCanHire({...t,staffRoster:Array.from({length:4},(_,i)=>({id:'a'+i,role:'analyst',rating:50}))},{role:'analyst'}),'analyst cap guard drift');
  });

  test('08-local-regulation',()=>{
    const db=buildWorld(),R=Object.values(db.regions)[0],foreign=Object.values(db.regions).find(x=>x.id!==R.id),t={id:'REG',region:R.id,division:1,roster:[]};
    const ps=[0,1,2].map(i=>({id:'NL'+i,region:foreign.id,originRegion:foreign.id,originLocalRegion:foreign.id,activeLocalRegion:foreign.id,localEligibility:{origin:foreign.id,active:foreign.id,qualifications:{}},contractedMoves:[]}));
    for(const p of ps)db.players[p.id]=p;t.roster=[ps[0].id,ps[1].id];
    assert(teamNonLocalCount(db,t)===2&&nonLocalLimitForTeam(db,t)===2,'non-local cap baseline drift');
    assert(!!localRegistrationError(db,t,ps[2]),'third non-local registration was not blocked');
    ps[2].contractedMoves=[{season:db.year,kind:'permanent',counts:true},{season:db.year,kind:'loan',counts:true}];
    assert(contractedMoveCount(db,ps[2])===2&&!!contractedMoveError(db,ps[2]),'season contracted-move cap drift');
  });

  test('09-patch-baseline',()=>{
    const db=buildWorld(),rng=new RNG('regression-patch','patch');
    seasonPatch(db,'2027-01-01',rng);const before=db.patches.list.length;
    patchTick(db,'2027-01-15',rng);patchTick(db,'2027-01-29',rng);
    assert(db.patches.list.length>=before+1,'biweekly patch cadence baseline failed');
    const c=Object.values(db.patch.champions)[0],hp=c.base.hp,n={type:'base',c:c.id,key:'hp',old:hp,new:hp+10,dir:1};
    applyNote(db.patch,n);db.patch.id='REG.1';db.patches.history.push({id:'REG.1',date:'2027-02-01',major:false,notes:[n]});
    assert(getPatch(db,'REG.1').champions[c.id].base.hp===hp+10,'historical patch reconstruction drift');
  });

  test('10-system-patch',()=>{
    const p=buildPatch(),c=Object.values(p.champions)[0],player={id:'REG_SYS',role:c.roles[0],attrs:Object.fromEntries(Object.values(ATTR_GROUPS).flat().map(a=>[a,60])),pool:{}};
    const items=selectItemBuild(p,c,player,c.roles[0]),runes=selectRunePage(p,c,player,c.roles[0]);
    assert(items.length>=4&&runes.length===6&&new Set(runes).size===6,'automatic item/rune environment drift');
    assert(items.every(id=>p.itemDefs[id])&&runes.every(id=>p.runeDefs[id]),'system selection returned unknown stable id');
  });

  test('11-draft-series-save',()=>{
    let db=buildWorld();const [a,b]=teamFixture(db);setManagedTeam(db,a.id);
    const domestic={id:'REG_COMP',international:false},intl={id:'REG_INTL',international:true};db.competitions[domestic.id]=domestic;db.competitions[intl.id]=intl;
    assert(scheduledSeriesOptions(db,{comp:domestic.id,year:2027,split:1},{stage:'regular'},{id:'regular',type:'round_robin'}).firstChoice==='home','domestic regular First Selection drift');
    assert(scheduledSeriesOptions(db,{comp:intl.id,year:2027},{stage:'ko'},{id:'ko',type:'single_elim',firstChoice:'seed'}).firstChoice==='coin','international knockout First Selection drift');

    const ds=createDraftSession(db,[a.id,b.id],new RNG('regression-draft','draft'),{used:[],byTeam:{[a.id]:{won:[],lost:[]},[b.id]:{won:[],lost:[]}},fearless:true,firstPick:0,practice:true});
    while(draftTurn(ds)){const choice=draftAiChoice(ds);if(choice){const v=draftValidateChoice(ds,choice);assert(v.ok,'shared draft validator rejected AI choice: '+v.reason);draftApplyChoice(ds,choice)}else draftSkipTurn(ds)}
    const dr=draftResult(ds),all=[...Object.values(dr.picks[0]),...Object.values(dr.picks[1]),...dr.bans[0],...dr.bans[1]];
    assert(Object.values(dr.picks[0]).length===5&&Object.values(dr.picks[1]).length===5&&new Set(all).size===all.length,'staged draft legality drift');

    const bo3=createSeriesSession(db,a.id,b.id,3,'regression-bo3',{fearless:true,firstChoice:'seed',replay:true});
    assert(bo3.chooser===a.id,'seeded First Selection opener drift');let firstLoser=null;
    while(!seriesSessionDone(bo3)){const r=playSeriesSessionGame(db,bo3,null,true);if(!firstLoser){firstLoser=r.loser;assert(bo3.chooser===firstLoser,'previous-game loser did not receive next First Selection')}}
    const r3=seriesSessionResult(db,bo3).rec;
    assert(r3.games.length>=2&&r3.games.length<=3&&Math.max(...r3.score)===2&&uniqueSeriesPicks(r3),'Bo3/Fearless regression');

    const bo5=createSeriesSession(db,a.id,b.id,5,'regression-bo5',{fearless:true,firstChoice:'coin',replay:true});
    playSeriesSessionGame(db,bo5,null,true);
    db.world={year:db.year,seed:'regression',manage:'manual',phase:'season',seasons:{},steps:[],step:0,report:null,pendingOfficial:{date:db.worldDate,queue:[{seasonKey:'REG',matchId:'REG',session:bo5}]},lastDate:db.worldDate,offers:[],marketLog:[]};
    db=unpackDB(packDB(db));const resumed=db.world.pendingOfficial.queue[0].session;
    assert(resumed.games.length===1&&resumed.g===2,'mid-Bo5 session did not survive save/load');
    while(!seriesSessionDone(resumed))playSeriesSessionGame(db,resumed,null,true);
    const r5=seriesSessionResult(db,resumed).rec;
    assert(r5.games.length>=3&&r5.games.length<=5&&Math.max(...r5.score)===3&&uniqueSeriesPicks(r5),'Bo5/Fearless regression after save/load');
  });


  test('11a-meta-index-incremental-and-bounded',()=>{
    const db=buildWorld(),region=Object.keys(db.regions)[0],rows=[];
    for(let i=0;i<6000;i++)rows.push({
      date:'2027-01-'+String(1+i%28).padStart(2,'0'),
      patch:'META.'+(i%4),comp:'COMP.'+(i%3),season:'S'+(i%2),split:1,
      league:region,regions:[region],international:false,sides:[],bans:[]
    });
    db.metaHistory=rows;
    const index=metaHistoryIndex(db),filtered=metaRowsFiltered(db,{patch:'META.1',comp:'COMP.2'}),
      facets=metaHistoryFacets(db);
    assert(filtered.length===500&&facets.patches[0]==='META.3'&&facets.comps.length===3,
      'historical index/filter/facet baseline mismatch');
    const append={date:'2027-04-07',patch:'META.1',comp:'NEW_COMP',
      season:'NEW_SEASON',split:2,league:'NEW_LEAGUE',
      regions:[region],international:false,sides:[],bans:[]};
    rows.push(append);
    assert(metaHistoryIndex(db)===index&&index.length===6001,
      'appending one match rebuilt the entire meta-history index');
    const updated=metaRowsFiltered(db,{patch:'META.1',comp:'COMP.2'});
    assert(updated!==filtered&&updated.length===filtered.length,
      'incremental append did not invalidate cached query');
    const newer=metaRowsFiltered(db,{patch:'META.1',comp:'NEW_COMP'});
    assert(newer.length===1&&newer[0]===append,'incremental by-patch/competition indexes lost appended row');
    const newFacets=metaHistoryFacets(db);
    assert(newFacets!==facets&&newFacets.comps.includes('NEW_COMP')&&newFacets.seasons.includes('NEW_SEASON')&&
      newFacets.leagues.includes('NEW_LEAGUE')&&newFacets.splits.includes(2),
      'incremental facets did not receive new competition dimensions');
    for(let i=0;i<META_FILTER_CACHE_LIMIT+35;i++)
      metaRowsFiltered(db,{from:'2027-'+String(i).padStart(3,'0')});
    assert(index.filtered.size===META_FILTER_CACHE_LIMIT,'filtered-index LRU capacity is unbounded');
    const fresh=rows.slice(-5);db.metaHistory=fresh;
    assert(metaHistoryIndex(db)!==index&&metaRowsFiltered(db,{comp:'NEW_COMP'}).length===1,
      'history array replacement must trigger a safe full reindex');
    const reindexed=metaHistoryIndex(db);
    fresh.splice(0,1);
    assert(metaHistoryIndex(db)!==reindexed,'history truncation must trigger a full reindex');
    const restored=unpackDB(packDB(db));
    assert(metaRowsFiltered(restored,{comp:'NEW_COMP'}).length===1&&
      !Object.prototype.hasOwnProperty.call(JSON.parse(packDB(db)),'byPatch'),
      'incremental meta indexes leaked into persisted state');
  });

  test('11b-historic-patch-cache-limit',()=>{
    const db=buildWorld(),champ=Object.values(db.patch.champions)[0],
      base=champ.base.hp,keys=[];
    for(let i=0;i<PATCH_REPLAY_CACHE_LIMIT+5;i++){
      const id='PERF.'+(i+1),hp=base+i+1;
      db.patches.history.push({id,date:'2027-04-01',major:false,
        notes:[{type:'base',c:champ.id,key:'hp',old:hp-1,new:hp,dir:1}]});
      keys.push(id);
    }
    for(let i=0;i<keys.length;i++){
      const historic=getPatch(db,keys[i]);
      assert(historic.id===keys[i]&&historic.champions[champ.id].base.hp===base+i+1,
        'historical patch cache returned an incorrect patch revision');
      assert(patchCache(db).size<=PATCH_REPLAY_CACHE_LIMIT,
        'historical patch snapshots grew without a size limit');
    }
    const last=getPatch(db,keys.at(-1));
    assert(last===getPatch(db,keys.at(-1)),'hot historical patch snapshot did not hit cache');
    const old=getPatch(db,keys[0]);
    assert(old.id===keys[0]&&old.champions[champ.id].base.hp===base+1,
      'evicted patch could not reconstruct from retained notes');
    assert(patchCache(db).size===PATCH_REPLAY_CACHE_LIMIT&&
      !patchCache(db).has(keys[1]),'LRU reconstruction did not evict the oldest snapshot');
    clearPatchCache(db);
    assert(patchCache(db).size===0,'world patch cache did not release memory on reset');
  });

  test('11c-system-usage-index-parity',()=>{
    const db=buildWorld(),champs=Object.values(db.patch.champions),
      ids=Object.values(db.patch.itemDefs).filter(d=>['final','boots'].includes(d.tier)&&d.active!==false).slice(0,12).map(d=>d.id),
      runes=Object.values(db.patch.runeDefs).filter(d=>d.active!==false).slice(0,8).map(d=>d.id);
    assert(ids.length===12&&runes.length===8,'system evidence fixture missing definitions');
    db.patch.id='REG.PERF';db.metaHistory=[];
    for(let i=0;i<100;i++){
      const a=champs[i%champs.length],b=champs[(i*7+3)%champs.length];
      db.metaHistory.push({
        date:'2027-03-'+String(1+i%28).padStart(2,'0'),patch:db.patch.id,
        comp:'REG_COMP',regions:[],sides:[
          {team:'A',region:'A',win:i%2===0,picks:[{champ:a.id,role:'TOP',items:ids.slice(i%5,i%5+3),runes:runes.slice(i%4,i%4+3)}]},
          {team:'B',region:'B',win:i%2!==0,picks:[{champ:b.id,role:'MID',items:ids.slice(i%4,i%4+3),runes:runes.slice(i%3,i%3+3)}]}
        ],bans:[]
      });
    }
    const rows=patchEvidenceRows(db);
    for(const [kind,list] of [['item',ids],['rune',runes]]){
      for(const id of list){
        const indexed=systemUsageEvidence(db,kind,id,rows),
          direct=systemUsageEvidence(db,kind,id,rows.slice());
        assert(JSON.stringify(indexed)===JSON.stringify(direct),
          'indexed '+kind+' evidence changed original statistical meaning: '+id);
      }
    }
    const cached=patchSystemUsageIndex(db,rows);
    assert(cached===patchSystemUsageIndex(db,rows),
      'per-world system evidence cache misses same patch/rows');
    const def=db.patch.itemDefs[ids[0]],old=def.cost;
    applyNote(db.patch,{type:'item',id:ids[0],field:'cost',old,new:old+50,dir:-1});
    assert(patchSystemUsageIndex(db,rows)!==cached,
      'item cost/revision change did not invalidate system evidence index');
    const appended={...db.metaHistory[0],date:'2027-04-03'};
    db.metaHistory.push(appended);
    const more=patchEvidenceRows(db);
    assert(more!==rows&&more.length===rows.length+1&&patchSystemUsageIndex(db,more).all===202,
      'new match did not invalidate indexed system usage');
    const indexed=systemUsageEvidence(db,'rune',runes[0],more),
      direct=systemUsageEvidence(db,'rune',runes[0],more.slice());
    assert(JSON.stringify(indexed)===JSON.stringify(direct),'appended match changed rune evidence parity');
    const facets=metaHistoryFacets(db),saved=packDB(db);
    assert(facets.comps.includes('REG_COMP')&&saved.length>0,
      'system/meta caches could not coexist with save serialization');
  });


  test('11d-shared-registration-rule-and-pure-preview',()=>{
    const db=buildWorld(),t=activeTeams(db,null,1)[0],
      foreignR=Object.values(db.regions).find(r=>r.id!==t.region),
      legacy={id:'REG_LEGACY_LOCAL',region:t.region,contractedMoves:{obsolete:true}},
      other={id:'REG_LEGACY_FOREIGN',originRegion:foreignR.id,region:foreignR.id};
    const beforeLegacy=JSON.stringify([legacy,other]);
    assert(isLocalPlayer(legacy,t.region)&&!isLocalPlayer(other,t.region)&&
      playerActiveLocalRegion(legacy)===t.region&&
      contractedMoveCount(db,legacy)===0&&!contractedMoveError(db,legacy),
      'read-only local-region and move-count defaults changed for legacy records');
    assert(JSON.stringify([legacy,other])===beforeLegacy,
      'registration or move-count lookup unexpectedly migrated a player');
    const foreign=Object.values(db.players).filter(p=>!p.retired&&!p.team&&!isLocalPlayer(p,t.region)).slice(0,3);
    assert(foreign.length===3,'foreign free-agent regression fixture incomplete');
    for(const p of foreign.slice(0,2))assignPlayerToTeam(db,p,t);
    setManagedTeam(db,t.id);db.world={year:db.year,manage:'manual'};
    t.finance.cash=80;
    const candidate=foreign[2],
      command={type:'player.sign',pid:candidate.id,teamId:t.id,actor:'manager',
        kind:'fa',salary:2,years:2,terms:{promisedRole:'starter'}};
    const expected=localRegistrationError(db,t,candidate),before=JSON.stringify(db),
      invalid=previewWorldAction(db,command);
    assert(expected&&invalid.reason==='registration_limit'&&invalid.errors[0]===expected,
      'transaction and roster registration limits differ');
    assert(JSON.stringify(db)===before,'foreign-cap validation mutated player eligibility or finances');
    // Residency change takes effect through the same single regional rule, not
    // a second transaction-only reimplementation.
    candidate.activeLocalRegion=t.region;
    const qualifiedBefore=JSON.stringify(db),accepted=previewWorldAction(db,command);
    assert(accepted.ok&&!localRegistrationError(db,t,candidate)&&
      JSON.stringify(db)===qualifiedBefore,
      'residency qualification did not use the canonical local rule');
    const local=Object.values(db.players).find(p=>!p.team&&isLocalPlayer(p,t.region));
    const seller=activeTeams(db,null,1).find(x=>x.id!==t.id);
    assert(local&&seller,'move-limit comparison fixture missing');
    assignPlayerToTeam(db,local,seller);
    local.contract={salary:2,until:db.year+1,years:2};
    local.contractedMoves=[{season:db.year,counts:true},{season:db.year,counts:true}];
    const moveBefore=JSON.stringify(db),domainError=contractedMoveError(db,local),
      blocked=previewWorldAction(db,{type:'player.sign',pid:local.id,teamId:t.id,
        fromId:seller.id,kind:'transfer',actor:'manager',fee:1,salary:2,years:2,
        terms:{promisedRole:'starter'}});
    assert(blocked.reason==='move_limit'&&blocked.errors[0]===domainError&&
      contractedMoveCount(db,local)===2,'seasonal two-move ceiling differs between paths');
    assert(JSON.stringify(db)===moveBefore,'move-limit validation mutated world state');
  });

  test('11e-roster-detach-is-single-owner',()=>{
    const db=buildWorld(),[one,two,three]=activeTeams(db,null,1),
      [p,q]=Object.values(db.players).filter(x=>!x.team).slice(0,2);
    assert(p&&q&&one&&two&&three,'roster detachment test fixtures missing');
    assignPlayerToTeam(db,p,one);
    assignPlayerToTeam(db,q,two);
    // A legacy/corrupt duplicate should be cleared by both transfer and release
    // via the one canonical detachment function.
    two.roster.push(p.id);
    assignPlayerToTeam(db,p,three);
    assert(p.team===three.id&&three.roster.filter(x=>x===p.id).length===1&&
      !one.roster.includes(p.id)&&!two.roster.includes(p.id)&&
      q.team===two.id&&two.roster.includes(q.id),
      'reassignment did not detach stale entries or altered another player');
    one.roster.push(p.id);two.roster.push(p.id);
    const old=removePlayerFromTeam(db,p);
    assert(old===three.id&&p.team===null&&
      [one,two,three].every(team=>!team.roster.includes(p.id))&&
      q.team===two.id&&two.roster.includes(q.id),
      'release did not use the shared detachment path');
    assert(!rosterIntegrityErrors(db).length,'shared detachment left invalid memberships');
    const restored=unpackDB(packDB(db));
    assert(!rosterIntegrityErrors(restored).length&&restored.players[q.id].team===two.id,
      'reassigned rosters cannot resume after save/restore');
  });

  test('11f-dead-api-pruned-without-market-breakage',()=>{
    assert(typeof PAY_SCALE==='undefined'&&typeof mResign==='undefined',
      'dead regional salary table or unused renewal wrapper returned');
    const db=buildWorld(),t=activeTeams(db,null,1)[0],p=Object.values(db.players).find(x=>!x.team);
    assert(t&&p,'renewal compatibility fixture missing');
    assert(psOf(db,t.region)===(db.regions[t.region].payScale??.5),
      'salary pricing no longer delegates to active regional policy');
    setManagedTeam(db,t.id);
    db.world={year:db.year,seed:'legacy-cleanup-neg',phase:'market',
      manage:'manual',negotiations:{},recruitment:{targets:{}}};
    assignPlayerToTeam(db,p,t);
    p.contract={salary:2,until:db.year+1,years:2};
    const renewed=startNegotiation(db,p.id,'renewal');
    assert(renewed.ok&&renewed.neg.kind==='renewal'&&
      db.world.negotiations[renewed.neg.id]===renewed.neg,
      'removing unused renewal wrapper broke the authoritative negotiation path');
  });

  test('11g-required-domain-hooks-have-real-effects',()=>{
    const db=buildWorld(),team=activeTeams(db,null,1)[0],
      free=Object.values(db.players).find(p=>!p.team&&!p.retired);
    assert(team&&free,'domain hook fixture missing');
    assert(Array.isArray(SYSTEM_EFFECT_KEYS)&&SYSTEM_EFFECT_KEYS.includes('offense')&&
      SYSTEM_EFFECT_KEYS.includes('scaling')&&SYSTEM_EFFECT_KEYS.length===8,
      'item/rune engine effect dimensions must be a required system-data module');
    // The player-state module must always run for roster assignments;
    // a missing hook may not silently skip adaptation and state initialization.
    for(const key of ['condition','fatigue','sharpness','teamAdaptation','tacticalAdaptation'])delete free[key];
    assignPlayerToTeam(db,free,team);
    assert(free.condition===96&&free.sharpness===55&&free.teamAdaptation===55&&
      free.tacticalAdaptation===58,
      'required state hook was skipped on player assignment');
    free.rosterRole='starter';delete free.satisfaction;delete free.managerTrust;
    const changed=setRosterRole(db,free,'backup','regression');
    assert(changed.ok&&free.satisfaction!==undefined&&free.managerTrust!==undefined&&
      free.careerEvents.some(e=>e.type==='roster_role'),
      'required satisfaction hook was skipped after explicit roster-role change');
    const cid=Object.keys(db.patch.champions)[0],
      champ=db.patch.champions[cid];
    free.pool={[cid]:{mastery:78,confidence:75}};
    free.attrs.meta_adaptation=40;
    const oldMastery=free.pool[cid].mastery;
    adaptPlayerPoolsToPatch(db,[{type:'rework',c:cid,scope:'major'}],true);
    assert(free.pool[cid].mastery<oldMastery,
      'player champion rework adaptation ceased to function');
    const selected=selectRunePage(db.patch,champ,free,champ.roles[0]);
    assert(selected.length===6,'item/rune rules drifted when removing optional effect-key fallback');
    assert(!rosterIntegrityErrors(db).length,'required domain hooks damaged roster membership');
  });

  test('11h-initial-market-must-use-real-budget-and-team-policy',()=>{
    const db=buildWorld(),t=activeTeams(db,null,1)[0],
      other=activeTeams(db,null,1).find(x=>x.id!==t.id),
      local=Object.values(db.players).find(p=>!p.team&&!p.retired&&isLocalPlayer(p,t.region));
    assert(t&&other&&local,'initial market policy fixture missing');
    setManagedTeam(db,t.id);
    db.world={year:db.year,seed:'stage5-2',phase:'initial_roster',manage:'manual',
      recruitment:{targets:{}},negotiations:{}};
    t.finance.cash=10000;
    t.initialPayrollBudget=salaryBudget(db,t)+100;
    assert(initialSalaryBudget(db,t)===t.initialPayrollBudget&&
      setupTeamsForManager(db).some(x=>x.id===t.id),
      'initial roster salary budget or managed organization API missing');
    const valid=initialOfferCheck(db,local,t,{salary:1.5,signingBonus:0});
    assert(valid.ok,'initial offer fixture cannot sign a local player');
    const budgetGate=negotiationBudgetError(db,local,t,{salary:1.5,signingBonus:0},'initial');
    assert(!budgetGate,'negotiation budget disagrees with available initial budget');
    const blocked=negotiationBudgetError(db,local,t,{
      salary:initialSalaryBudget(db,t)*4,signingBonus:0
    },'initial');
    assert(blocked==='연봉 예산을 초과합니다',
      'initial offer was not checked against authoritative initial budget');
    const unauthorized=startNegotiation(db,local.id,'initial',{teamId:other.id});
    assert(!unauthorized.ok&&unauthorized.msg==='내 구단 조직의 스쿼드만 계약 대상이 될 수 있습니다',
      'initial negotiations accepted a club outside the managed organization');
  });

  console.log('11.5 Step 1 regression baseline: OK ('+results.join(', ')+')');
})();
`;

const context={console,structuredClone,performance};
vm.runInNewContext(source,context,{timeout:30000});
