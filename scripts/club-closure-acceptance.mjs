import assert from 'node:assert/strict';
import {artifactSources,runEngineFixture} from './test-harness.mjs';
const [ui,app]=await artifactSources(['ui-manager.js','app.js']);
const escapeDeclaration=app.match(/^const esc=.*$/m)?.[0];assert(escapeDeclaration);
await runEngineFixture(String.raw`(()=>{
  const check=(ok,msg)=>{if(!ok)throw Error('CLUB_CLOSURE '+msg)},near=(a,b)=>Math.abs(a-b)<1e-8;
  let db=buildWorld();
  const [parent,other]=activeTeams(db,null,1),reserve=reserveTeamsOf(db,parent)[0],
    players=Object.values(db.players).filter(p=>!p.team&&!p.retired).slice(0,4),
    [a,b,c,medical]=players;
  check(reserve,'fixture requires a real owned reserve');
  setManagedTeam(db,parent.id);
  db.world={phase:'offseason',manage:'manual',year:db.year,negotiations:{
    owned:{status:'open',teamId:parent.id,pid:a.id},
    outsider:{status:'open',teamId:other.id,pid:a.id},
    untouched:{status:'open',teamId:other.id,pid:'unrelated'}},contractAgreements:{
      [a.id]:{status:'agreed',teamId:other.id,fromTeamId:parent.id},
      [b.id]:{status:'agreed',teamId:parent.id,fromTeamId:parent.id}}};
  signContract(db,a,parent,2,2,{releaseGuaranteeRate:1});
  signContract(db,b,parent,2,2,{releaseGuaranteeRate:1});
  signContract(db,c,reserve,3,2);signContract(db,medical,reserve,1,1);
  medical.contract.medicalReplacement={paid:.01};
  a.name='<script>creditor</script>';
  parent.finance.cash=3;parent.finance.buyout=2;
  reserve.finance.cash=10;
  const command={type:'club.close',actor:'system',teamId:parent.id},before=JSON.stringify(db),
    preview=previewWorldAction(db,command);
  check(preview.ok&&JSON.stringify(db)===before,'closure preview mutated world');
  const rootPlan=preview.changes.find(x=>x.teamId===parent.id).settlement;
  check(rootPlan.amount===10&&rootPlan.paidAmount===3&&rootPlan.unpaidAmount===7&&
    rootPlan.unattributedAmount===2&&near(rootPlan.items[0].paidAmount,1.2),
    'cash-limited proportional allocation is wrong');
  check(!commitWorldAction(db,{...command,actor:'manager'}).ok&&
    !commitWorldAction(db,{...command,actor:'ai'}).ok,'caller bypassed office authority');
  a.contract.salary=3;
  check(!applyWorldAction(db,preview).ok,'changed guarantee accepted old preview');
  a.contract.salary=2;
  const stale=previewWorldAction(db,command);parent.finance.cash=4;
  check(!applyWorldAction(db,stale).ok,'changed cash accepted old preview');parent.finance.cash=3;
  const original=worldActionScopeErrors;
  worldActionScopeErrors=(world,cmd,ids)=>cmd.type==='club.close'?['late closure failure']:original(world,cmd,ids);
  const rollbackBefore=JSON.stringify(db),failed=commitWorldAction(db,command);
  worldActionScopeErrors=original;
  check(!failed.ok&&JSON.stringify(db)===rollbackBefore,
    'late failure lost contracts, lifecycle, cash, agreement or negotiation state');
  const result=foldTeam(db,parent);
  check(result.ok&&parent.active===false&&reserve.active===false&&db.world.fired&&
    parent.roster.length===0&&reserve.roster.length===0,'organization did not close together');
  for(const p of players)check(p.team===null&&p.contract===null&&
    p.careerEvents.at(-1).type==='club_closure','closure left stale player contract');
  check(parent.finance.cash===0&&parent.finance.buyout===7&&reserve.finance.cash===7&&
    reserve.finance.buyout===0&&near(parent.finance.closureSettlement.unattributedUnpaid,1.4),
    'cash/debt disappeared or was fabricated');
  check(near(financeReleaseObligations(parent).unattributedAmount,1.4)&&
    near(parent.finance.releaseObligations[0].originalAmount,4)&&
    near(parent.finance.releaseObligations[0].amount,2.8),'unpaid claim basis changed');
  check(db.world.negotiations.owned.status==='cancelled'&&
    db.world.negotiations.outsider.status==='cancelled'&&
    db.world.negotiations.untouched.status==='open'&&
    db.world.contractAgreements[b.id].status==='cancelled'&&
    db.world.contractAgreements[a.id].status==='agreed','future/open contracts cancelled incorrectly');
  const duplicate=JSON.stringify(db);foldTeam(db,parent);
  check(JSON.stringify(db)===duplicate&&!commitWorldAction(db,command).ok,'duplicate payout accepted');
  DB=db;const uiBefore=JSON.stringify(db),html=financePanel(parent);
  check(html.includes('해체 구단 미지급 보상')&&html.includes('선수별 지급 내역')&&
    html.includes('&lt;script&gt;creditor&lt;/script&gt;')&&!html.includes('<script>creditor</script>')&&
    !html.includes('예상 수입')&&JSON.stringify(db)===uiBefore,'closed finance UI unsafe or misleading');
  const parentId=parent.id,closureBefore=JSON.stringify(parent.finance.closureSettlement);
  db=unpackDB(packDB(db));
  check(db.teams[parentId].finance.buyout===7&&
    JSON.stringify(db.teams[parentId].finance.closureSettlement)===closureBefore,
    'unpaid/paid closure claims failed save restore');
  const inactiveBefore=JSON.stringify(db.teams[parentId].finance);
  closeFinances(db,{year:db.year+1,seasons:{}},new RNG('closed-annual'),()=>{});
  check(JSON.stringify(db.teams[parentId].finance)===inactiveBefore,
    'inactive club charged or unpaid claims erased next season');
  const sign=commitWorldAction(db,{type:'player.sign',actor:'system',kind:'fa',
    pid:b.id,teamId:other.id,salary:1,years:1,terms:{}});
  check(sign.ok&&db.players[b.id].contract.until===db.year,'released player could not sign anew');
  // A reserve closure cannot dissolve its parent or fire its manager.
  const reserveWorld=buildWorld(),first=activeTeams(reserveWorld,null,1)[0],
    academy=reserveTeamsOf(reserveWorld,first)[0];
  setManagedTeam(reserveWorld,first.id);
  reserveWorld.world={phase:'offseason',fired:false};
  academy.finance.buyout=-1;
  check(!previewWorldAction(reserveWorld,{type:'club.close',actor:'system',teamId:academy.id}).ok,
    'negative legacy claim was accepted');
  academy.finance.buyout=0;
  check(foldTeam(reserveWorld,academy).ok&&first.active!==false&&
    academy.active===false&&!reserveWorld.world.fired,'reserve closure dissolved parent');
  // Existing parent support also funds reserve termination, with actual cash.
  for(const parentCash of [10,2,0,-1]){
    const world=buildWorld(),parent=activeTeams(world,null,1)[0],
      reserve=reserveTeamsOf(world,parent)[0],
      p=Object.values(world.players).find(x=>!x.team&&!x.retired);
    signContract(world,p,reserve,4,2,{releaseGuaranteeRate:1});
    parent.finance.cash=parentCash;parent.finance.buyout=1;reserve.finance.cash=1;
    const action={type:'club.close',teamId:reserve.id,actor:'system'},
      initial=JSON.stringify(world),quote=previewWorldAction(world,action),
      support=Math.min(7,Math.max(0,parentCash-1));
    check(quote.ok&&JSON.stringify(world)===initial&&
      near(quote.changes[0].funding.received,support),'support preview mutated world or spent protected claims');
    parent.finance.cash+=1;
    check(!applyWorldAction(world,quote).ok,'support-parent cash omitted from stale snapshot');
    parent.finance.cash=parentCash;
    const originalScope=worldActionScopeErrors,beforeFailure=JSON.stringify(world);
    worldActionScopeErrors=(db,cmd,ids)=>cmd.type==='club.close'?['support late failure']:originalScope(db,cmd,ids);
    const failed=commitWorldAction(world,action);worldActionScopeErrors=originalScope;
    check(!failed.ok&&JSON.stringify(world)===beforeFailure,'support parent cash/history did not roll back');
    check(commitWorldAction(world,action).ok,'funded reserve closure failed');
    const statement=reserve.finance.closureSettlement;
    check(near(parent.finance.cash,parentCash-support)&&parent.finance.buyout===1&&
      near(statement.paidAmount,1+support)&&near(statement.unpaidAmount,7-support)&&
      near(parent.finance.cash+reserve.finance.cash+statement.paidAmount,parentCash+1),
      'parent support invented cash or lost debt');
    DB=world;const beforeUi=JSON.stringify(world),panel=financePanel(parent);
    check(JSON.stringify(world)===beforeUi&&(!support||panel.includes('2군 종료 정산 지원 내역')),
      'support statement missing or UI mutated world');
    const restored=unpackDB(packDB(world));
    check(JSON.stringify(restored.teams[parent.id].finance)===JSON.stringify(parent.finance)&&
      JSON.stringify(restored.teams[reserve.id].finance)===JSON.stringify(reserve.finance),
      'funding history did not survive save restore');
    const history=JSON.stringify(parent.finance.closureSupportHistory),parentId=parent.id,
      control=unpackDB(packDB(world));
    delete control.teams[parentId].finance.closureSupportHistory;
    closeFinances(world,{year:world.year,seasons:{}},new RNG('funding-close'),()=>{});
    closeFinances(control,{year:control.year,seasons:{}},new RNG('funding-close'),()=>{});
    check(JSON.stringify(world.teams[parentId].finance.closureSupportHistory)===history,
      'annual finance changed closure funding history');
    check(world.teams[parentId].finance.cash===control.teams[parentId].finance.cash,
      'annual finance charged funding history again');
  }
  // Closing the organization can fund a reserve after protecting parent claims.
  const group=buildWorld(),head=activeTeams(group,null,1)[0],
    child=reserveTeamsOf(group,head)[0],free=Object.values(group.players).filter(x=>!x.team&&!x.retired);
  signContract(group,free[0],head,1,2,{releaseGuaranteeRate:1});
  signContract(group,free[1],child,3,2,{releaseGuaranteeRate:1});
  head.finance.cash=5;child.finance.cash=0;
  check(foldTeam(group,head).ok&&head.finance.closureSettlement.paidAmount===2&&
    child.finance.closureSettlement.paidAmount===3&&child.finance.buyout===3&&
    head.finance.cash===0&&child.finance.cash===0,'whole organization funding failed');
  // Solvent and insolvent single-club cases preserve cash and debt independently.
  for(const cash of [7,0,-3]){
    const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:2,div2:false})];
    cfg.internationals=[];
    const world=buildWorld(cfg),t=activeTeams(world)[0],
      p=Object.values(world.players).find(x=>!x.team&&!x.retired);
    signContract(world,p,t,2,2);t.finance.cash=cash;
    const quote=previewWorldAction(world,{type:'club.close',actor:'system',teamId:t.id});
    check(quote.ok&&applyWorldAction(world,quote).ok,'single closure failed without active season');
    const record=t.finance.closureSettlement,paid=Math.min(Math.max(0,cash),2);
    check(record.amount===2&&record.paidAmount===paid&&record.unpaidAmount===2-paid&&
      t.finance.cash===cash-paid&&t.finance.buyout===2-paid,'solvency policy lost cash or guarantee');
  }
  console.log('D04_CLUB_CLOSURE_ACCEPTANCE '+JSON.stringify({purePreview:true,
    parentReserves:true,staleCashContract:true,rollback:true,legacyClaims:true,
    proportionalPayment:true,insolventNoWriteoff:true,medicalExempt:true,
    agreements:true,saveRestore:true,noAnnualDoubleCharge:true,parentFunding:true,
    protectedParentClaims:true,fundingRollback:true,ui:true}));
})();`,{filename:'club-closure.fixture.js',setupSources:[ui,escapeDeclaration]});
