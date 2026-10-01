import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
  const check=(x,m)=>{if(!x)throw Error('FIRST_SELECTION '+m)};
  const db=buildWorld(),mine=activeTeams(db,'KR',1)[0],enemy=activeTeams(db,'EU',1)[0];
  setManagedTeam(db,mine.id);
  for(const t of [mine,enemy])for(const role of ROLES){
    const p=Object.values(db.players).find(p=>!p.team&&!p.retired&&p.role===role);
    signContract(db,p,t,1,3);t.depthChart[role]=p.id;
  }
  const all=draftPoolSnapshot(db,{practice:true}),pool=[];
  for(const role of ROLES)pool.push(...all.byRole[role].slice(0,3).map(c=>c.id));
  const ids=[...new Set(pool)],ctx={used:[],fearless:true,practice:true,championPool:ids,byTeam:{[mine.id]:{won:[],lost:[]},[enemy.id]:{won:[],lost:[]}}};
  const setMastery=(t,n)=>{for(const id of t.roster){db.players[id].pool={};for(const cid of ids)db.players[id].pool[cid]={mastery:n}}};
  setMastery(mine,25);setMastery(enemy,25);
  const focus=all.byRole.MID.find(c=>ids.includes(c.id));db.players[mine.depthChart.MID].pool[focus.id].mastery=99;
  const before=packDB(db),limited=draftPrefs(db,mine.id,ctx,1,5,new RNG('selection'),enemy.id),limitedChoice=chooseSide(db,mine.id,enemy.id,ctx,1,5,new RNG('selection'));
  check(packDB(db)===before,'selection assessment mutated depth/scouting/world state');
  setMastery(mine,90);
  const wide=draftPrefs(db,mine.id,ctx,1,5,new RNG('selection'),enemy.id),wideChoice=chooseSide(db,mine.id,enemy.id,ctx,1,5,new RNG('selection'));
  check(limited.evidence.scarcity>wide.evidence.scarcity&&wide.evidence.breadth>limited.evidence.breadth,'own champion pool does not affect decision');
  check(limited.first-limited.last>wide.first-wide.last,'single signature pick did not favor first pick');
  let changed=false;
  for(let i=0;i<40;i++){
    setMastery(mine,25);db.players[mine.depthChart.MID].pool[focus.id].mastery=99;
    const a=chooseSide(db,mine.id,enemy.id,ctx,1,5,new RNG('decision-'+i));
    setMastery(mine,90);const b=chooseSide(db,mine.id,enemy.id,ctx,1,5,new RNG('decision-'+i));
    if(a.order!==b.order||a.chose!==b.chose)changed=true;
  }
  check(changed,'AI never changed actual selection across different own pools');
  const observed=firstSelectionEvidence(db,mine.id,enemy.id,ctx);
  setMastery(enemy,99);const threat=firstSelectionEvidence(db,mine.id,enemy.id,ctx);
  check(threat.contested>observed.contested,'opponent pool did not affect contested priority');
  const player=db.players[enemy.depthChart.MID],low=firstSelectionEvidence(db,mine.id,enemy.id,ctx).roles.find(r=>r.role==='MID').confidence;
  db.scout={[player.id]:{knowledge:98}};
  const high=firstSelectionEvidence(db,mine.id,enemy.id,ctx).roles.find(r=>r.role==='MID').confidence;
  check(high>low&&high<100,'opponent decision used exact private mastery');
  setMastery(mine,25);db.players[mine.depthChart.MID].pool[focus.id].mastery=99;
  const blocked={...ctx,used:[focus.id]},available=firstSelectionEvidence(db,mine.id,enemy.id,ctx),depleted=firstSelectionEvidence(db,mine.id,enemy.id,blocked);
  check(depleted.available===available.available-1&&!depleted.roles.some(r=>r.priority===focus.id),'Fearless used champion remains priority');
  check(depleted.scarcity<available.scarcity,'Fearless depletion did not change signature scarcity');
  const previous=firstSelectionEvidence(db,mine.id,enemy.id,ctx);
  applyNote(db.patch,{type:'base',c:focus.id,key:'ad',new:db.patch.champions[focus.id].base.ad+30});
  const patched=firstSelectionEvidence(db,mine.id,enemy.id,ctx);
  check(JSON.stringify(previous)!==JSON.stringify(patched),'patch revision did not change selection assessment');
  for(const kind of ['side','order'])for(const value of kind==='side'?['blue','red']:['first','last']){
    const result=resolveFirstSelection(db,mine.id,enemy.id,ctx,1,5,new RNG('manual'),{kind,value});
    check((kind==='side'?result.side:result.order)===value,'manager choice overridden');
    check(result.evidence.version===1&&result.evidence.options.manual,'manual decision lost opponent assessment');
  }
  for(const bo of [3,5]){
    const session=createSeriesSession(db,mine.id,enemy.id,bo,'selection-bo-'+bo,{practice:true,fearless:true,championPool:ids});
    const prompt=seriesSelectionPrompt(db,session,mine.id);check(prompt.mode==='first','managed first choice missing');
    seriesApplyManagedSelection(db,session,mine.id,{kind:'order',value:'last'});
    const selected=seriesSessionPrepareGame(db,session);
    check(selected.sc.evidence.version===1&&selected.fpTeam===enemy.id,'selected order did not reach series draft');
    db.world={phase:'season',manage:'manual',year:db.year,seed:'selected-save',seasons:{},pendingOfficial:{queue:[{session}]}};
    const resumed=unpackDB(packDB(db)).world.pendingOfficial.queue[0].session;
    check(JSON.stringify(resumed.current.sc)===JSON.stringify(selected.sc),'selection explanation failed save/resume');
  }
  // Use the real official roster view for both AI lead and manager response.
  db.world={registrationVersion:1,phase:'season',year:db.year,seasons:{fixture:{id:'fixture',comp:'fixture-comp'}}};
  db.competitions['fixture-comp']={id:'fixture-comp',international:false};
  for(const t of [mine,enemy])t.registration={year:db.year,players:t.roster.slice(),depthChart:{...t.depthChart},date:db.worldDate,history:[]};
  const unregistered=Object.values(db.players).find(p=>!p.team&&!p.retired&&p.role==='MID');
  signContract(db,unregistered,mine,1,3);mine.depthChart.MID=unregistered.id;
  unregistered.pool=Object.fromEntries(ids.map(cid=>[cid,{mastery:99}]));
  const official=createSeriesSession(db,mine.id,enemy.id,3,'official-evidence',{metaContext:{season:'fixture'}});
  const original=firstSelectionEvidence(seriesOfficialView(db,official),mine.id,enemy.id,official.ctx);
  unregistered.pool=Object.fromEntries(ids.map(cid=>[cid,{mastery:25}]));
  check(JSON.stringify(firstSelectionEvidence(seriesOfficialView(db,official),mine.id,enemy.id,official.ctx))===JSON.stringify(original),'official assessment used training-only player');
  official.chooser=enemy.id;
  const remaining=seriesSelectionPrompt(db,official,mine.id);check(remaining.mode==='remaining'&&official.selectionLead.evidence.version===1,'AI first choice omitted bounded evidence');
  seriesApplyManagedSelection(db,official,mine.id,{kind:remaining.remaining,value:remaining.remaining==='side'?'red':'last'});
  check(official.selectionResolved.evidence.version===1,'manager response discarded AI explanation');
  const replay=createSeriesSession(db,mine.id,enemy.id,5,'recorded-selection',{replay:true,selections:[{blue:enemy.id,firstPick:mine.id,sideBy:enemy.id,sideWhy:'saved decision'}]});
  const replayGame=seriesSessionPrepareGame(db,replay);
  check(replayGame.blue===enemy.id&&replayGame.fpTeam===mine.id&&replayGame.sc.why==='saved decision','replay recomputed historical selection from current pools');
  console.log('FIRST_SELECTION_ACCEPTANCE '+JSON.stringify({pure:true,ownPool:true,opponentBounded:true,changedActualChoice:changed,fearless:true,patch:true,manual:true,bo3Bo5Resume:true,officialRoster:true,aiLead:true,limited:limitedChoice.order,wide:wideChoice.order}));
})();`);
