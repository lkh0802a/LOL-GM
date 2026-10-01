// D04-B4a: player-level release liabilities, legacy balance and single closeout.
import assert from 'node:assert/strict';
import {artifactSources,runEngineFixture} from './test-harness.mjs';

const [ui,shell,app]=await artifactSources(['ui-manager.js','shell.html','app.js']);
const escapeDeclaration=app.match(/^const esc=.*$/m)?.[0];
assert(escapeDeclaration,'canonical HTML escaping helper missing');

await runEngineFixture(String.raw`(()=>{
  const check=(ok,msg)=>{if(!ok)throw new Error('RELEASE_LIABILITY '+msg)};
  const db=buildWorld(),teams=activeTeams(db,null,1),[mine,other]=teams;
  setManagedTeam(db,mine.id);
  db.world={phase:'market',manage:'manual',year:db.year};
  const players=Object.values(db.players).filter(p=>!p.retired&&!p.team).slice(0,3);
  players[0].name='<script>player</script>';
  for(const [index,actor] of ['manager','ai'].entries()){
    const team=index?other:mine,p=players[index];
    signContract(db,p,team,1.7,3);
    const command={type:'player.release',pid:p.id,teamId:team.id,actor,
      mode:index?'market':'manager'},cash=team.finance.cash,before=JSON.stringify(db),
      preview=previewWorldAction(db,command);
    check(preview.ok&&JSON.stringify(db)===before,'impure or failed release preview');
    const detail=preview.changes[0].settlement;
    check(detail.pid===p.id&&detail.remainingYears===3&&detail.guaranteeRate===.5&&
      Object.is(detail.amount,1.7*3*.5),'missing or rounded contractual basis');
    const applied=applyWorldAction(db,preview),pending=financeReleaseObligations(team);
    check(applied.ok&&pending.items.length===1&&team.finance.cash===cash&&
      pending.amount===detail.amount&&pending.unattributedAmount===0,
      'manager/AI obligation or cash differs');
    check(JSON.stringify(pending.items[0])===JSON.stringify(detail),
      'committed detail differs from preview');
    check(!commitWorldAction(db,command).ok&&pending.amount===team.finance.buyout,
      'duplicate release was accepted');
    const detached=financeReleaseObligations(team);detached.items[0].amount=100;
    check(team.finance.releaseObligations[0].amount===detail.amount,'query leaked mutable record');
  }
  DB=db;
  const beforeRender=JSON.stringify(db),pendingHtml=financePanel(mine);
  check(pendingHtml.includes('결산 예정 선수 방출 보상')&&
    pendingHtml.includes('&lt;script&gt;player&lt;/script&gt;')&&
    !pendingHtml.includes('<script>player</script>')&&JSON.stringify(db)===beforeRender,
    'pending UI is missing, unsafe or mutating');
  // Fail after finance accrual and membership removal: the same action journal
  // must restore both detail and aggregate, including the existing array contents.
  const p=players[2];signContract(db,p,other,2,2);
  const command={type:'player.release',pid:p.id,teamId:other.id,actor:'ai',mode:'market'},
    original=removePlayerFromTeam,before=JSON.stringify(db);
  removePlayerFromTeam=(world,player)=>{original(world,player);throw new Error('late release failure')};
  const failed=commitWorldAction(db,command);removePlayerFromTeam=original;
  check(!failed.ok&&JSON.stringify(db)===before,'late failure lost liability/player state');
  const restored=unpackDB(packDB(db));
  check(JSON.stringify(financeReleaseObligations(restored.teams[mine.id]))===
    JSON.stringify(financeReleaseObligations(mine)),'pending save restoration changed');
  // Older saves retain unattributed balance; never fabricate player/contract detail.
  const old=restored.teams[mine.id];delete old.finance.releaseObligations;
  const legacy=unpackDB(packDB(restored)),legacyView=financeReleaseObligations(legacy.teams[mine.id]);
  check(!legacyView.items.length&&legacyView.unattributedAmount===legacyView.amount,
    'legacy liability disappeared or acquired fictional claimant');
  const settlementDb=unpackDB(packDB(db)),settlementTeam=settlementDb.teams[mine.id];
  // Isolate annual closeout from unrelated solvency interventions.
  for(const team of activeTeams(settlementDb))team.finance.cash=10000;
  const pending=financeReleaseObligations(settlementTeam),
    forecast=financeForecast(settlementDb,settlementTeam),w={year:db.year,seasons:{}};
  closeFinances(settlementDb,w,new RNG('release-liability-close'),()=>{});
  const row=settlementTeam.finance.history.at(-1);
  check(row.exp.buyout===Math.round(pending.amount*10)/10&&
    JSON.stringify(row.releaseSettlement)===JSON.stringify(pending),
    'annual settlement lost contractual detail or amount');
  check(Math.abs(settlementTeam.finance.cash-forecast.closingCash)<.11,
    'annual cash differs from forecast or charged twice');
  check(financeReleaseObligations(settlementTeam).amount===0&&
    settlementTeam.finance.releaseObligations.length===0,'settled obligations remain pending');
  const reopened=unpackDB(packDB(settlementDb));
  check(JSON.stringify(reopened.teams[mine.id].finance.history.at(-1).releaseSettlement)===
    JSON.stringify(pending),'settled save restoration lost detail');
  DB=reopened;
  const settledHtml=financePanel(reopened.teams[mine.id]);
  check(settledHtml.includes('지난 결산 선수 방출 보상')&&
    !settledHtml.includes('결산 예정 선수 방출 보상'),'UI still presents paid liability as pending');
  closeFinances(reopened,{year:db.year+1,seasons:{}},new RNG('release-liability-next'),()=>{});
  check(!reopened.teams[mine.id].finance.history.at(-1).releaseSettlement&&
    reopened.teams[mine.id].finance.history.at(-1).exp.buyout===0,
    'old release was charged in a later year');
  console.log('D04_RELEASE_LIABILITY_ACCEPTANCE '+JSON.stringify({managerAi:true,
    purePreview:true,rollback:true,pendingAndSettledRestore:true,legacyBalance:true,
    oneAnnualCharge:true}));
})();`,{filename:'contract-release-liability.fixture.js',setupSources:[ui,escapeDeclaration]});

assert(ui.includes('financeReleaseObligations(t)')&&ui.includes('last?.releaseSettlement'));
assert(ui.includes('<details')&&ui.includes('esc(row.playerName||row.pid)'));
assert(shell.includes('.release-settlements summary{min-height:44px'));
