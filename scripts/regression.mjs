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
    const db=buildWorld(),team=activeTeams(db,null,1)[0],p=Object.values(db.players).find(x=>!x.retired&&!x.team&&playerActionLocal(x,team.region));
    assert(p,'free agent fixture missing');setManagedTeam(db,team.id);db.world.manage='manual';
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
    const p=Object.values(db.players).find(x=>!x.retired&&!x.team&&playerActionLocal(x,buyer.region));
    assert(p,'transfer fixture missing');setManagedTeam(db,buyer.id);db.world.manage='manual';
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
    const p=Object.values(db.players).find(x=>!x.retired&&!x.team&&playerActionLocal(x,buyer.region));
    assert(p,'AI transfer fixture missing');setManagedTeam(db,owner.id);db.world.manage='manual';
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
    setManagedTeam(db,team.id);db.world.manage='manual';
    const p=Object.values(db.players).find(x=>!x.retired&&!x.team&&playerActionLocal(x,team.region));
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

  console.log('11.5 Step 1 regression baseline: OK ('+results.join(', ')+')');
})();
`;

const context={console,structuredClone,performance};
vm.runInNewContext(source,context,{timeout:30000});
