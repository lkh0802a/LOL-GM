import {runEngineFixture,artifactSources} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const check=(ok,msg)=>{if(!ok)throw Error('SQUAD_STAGING '+msg)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:6,div2:true,system:'franchise'})];cfg.internationals=[];cfg.subs=0;cfg.changes='none';
 const db=buildWorld(cfg),[parent,other]=activeTeams(db,'NA',1),reserve=reserveTeamsOf(db,parent)[0];
 for(const t of [parent,reserve])for(const role of ROLES){const p=genPlayer(db,new RNG(t.id+role),{region:t.region,role,age:22,base:65});signContract(db,p,t,1,3);t.depthChart[role]=p.id}
 const backup=genPlayer(db,new RNG('staged-backup'),{region:parent.region,role:'MID',age:22,base:60});signContract(db,backup,parent,1,3);
 startWorldSeason(db,parent.id,'squad-staging');DB=db;SQUAD=parent.id;SQUAD_EDIT=null;
 const elements={sq:{},practicefocus:{},trint:{},trleft:{textContent:''},sqapply:{},sqdiscard:{}},
   tactic={dataset:{tac:'aggression'},value:13,previousElementSibling:{querySelector:()=>({})}},
   role={dataset:{srole:backup.id},value:'core'},destination={dataset:{squadDst:backup.id},value:reserve.id},
   lineup={dataset:{lineupPlayer:backup.id},value:'MID'},
   selectors={'[data-tac]':[tactic],'[data-srole]':[role],'[data-squad-dst]':[destination],'[data-lineup-player]':[lineup]};
 $=q=>elements[q.slice(1)]||null;document={querySelectorAll:q=>selectors[q]||[]};window={};
 const event={stopPropagation(){}};bindSquad();const parentChart={...parent.depthChart},reserveChart={...reserve.depthChart};
 squadEditState(parent);tactic.oninput(event);elements.trint.onchange({target:{value:'light'}});role.onchange(event);
 elements.sq.onchange({target:{value:reserve.id}});const er=squadEditState(reserve);
 check(er.tactics.aggression===reserve.tactics.aggression&&er.starters.MID===reserveChart.MID,'parent values leaked into reserve');
 tactic.value=79;tactic.oninput(event);elements.trint.onchange({target:{value:'high'}});
 elements.sq.onchange({target:{value:other.id}});check(squadEditState(other)===null,'foreign team creates editor');
 elements.sq.onchange({target:{value:parent.id}});const ep=squadEditState(parent);
 check(ep.tactics.aggression===13&&ep.training.intensity==='light'&&ep.starters.MID===parentChart.MID&&ep.roles[backup.id]==='core','parent pending edits lost after navigation');
 check(SQUAD_EDIT.squads[reserve.id].tactics.aggression===79,'reserve pending edits lost');
 const starterEvents=organizationRoster(db,parent).reduce((n,pid)=>n+(db.players[pid].careerEvents||[]).filter(x=>x.type==='starter_change').length,0);
 const before=JSON.stringify(db);check(parent.tactics.aggression!==13&&reserve.tactics.aggression!==79,'staging mutated live preparation');
 // Invalid sibling lineup rejects the complete unit and preserves staged corrections.
 ep.squads[reserve.id].starters.MID=parentChart.MID;elements.sqapply.onclick();
 check(JSON.stringify(db)===before&&SQUAD_EDIT&&MSG.includes('슬롯'),'invalid sibling partly committed or lost edits');
 ep.squads[reserve.id].starters.MID=reserveChart.MID;
 // A late domain failure after both coaching writes restores all identities/history.
 const oldWriter=setRosterRole,oldParentTac=parent.tactics,oldReserveTr=reserve.training,oldBackup=db.players[backup.id];
 setRosterRole=(...args)=>{oldWriter(...args);throw Error('injected after role history')};elements.sqapply.onclick();setRosterRole=oldWriter;
 check(JSON.stringify(db)===before&&parent.tactics===oldParentTac&&reserve.training===oldReserveTr&&db.players[backup.id]===oldBackup,'late exception did not restore scoped state and identities');
 check(MSG.includes('되돌렸습니다')&&SQUAD_EDIT?.tactics.aggression===13,'failure feedback or pending edits lost');
 elements.sqapply.onclick();check(SQUAD_EDIT===null&&parent.tactics.aggression===13&&reserve.tactics.aggression===79&&parent.training.intensity==='light'&&reserve.training.intensity==='high'&&backup.rosterRole==='core','atomic multi-squad apply failed');
 check(parent.depthChart.MID===parentChart.MID&&reserve.depthChart.MID===reserveChart.MID,'untouched legal starters changed');
 check(organizationRoster(db,parent).reduce((n,pid)=>n+(db.players[pid].careerEvents||[]).filter(x=>x.type==='starter_change').length,0)===starterEvents,'unchanged starters generated false history');
 // Organization roster plan and per-squad coaching share the same atomic boundary.
 SQUAD=parent.id;const plan=squadEditState(parent);destination.onchange(event);tactic.value=23;tactic.oninput(event);
 const movedBefore=JSON.stringify(db);setDepthStarter=(...args)=>{const result=originalStarter(...args);throw Error('injected after roster move')};
 elements.sqapply.onclick();setDepthStarter=originalStarter;
 check(JSON.stringify(db)===movedBefore&&backup.team===parent.id,'late lineup failure left roster/event changes');
 elements.sqapply.onclick();check(backup.team===reserve.id&&reserve.roster.includes(backup.id)&&parent.tactics.aggression===23,'roster and coaching did not commit together');
 // Baseline stale roster/date/preparation rejects rather than applying old intent.
 const stale=squadEditState(parent);stale.tactics.aggression=34;parent.tactics.aggression=35;
 const changed=JSON.stringify(db);elements.sqapply.onclick();check(JSON.stringify(db)===changed&&SQUAD_EDIT&&MSG.includes('변경되었습니다'),'stale coaching overwrote current state');
 elements.sqdiscard.onclick();check(SQUAD_EDIT===null&&parent.tactics.aggression===35&&MSG.includes('취소'),'discard changed live state');
 const fresh=squadEditState(parent);fresh.starters.MID=backup.id;fresh.dirty=true;const membership=JSON.stringify(db);elements.sqapply.onclick();check(JSON.stringify(db)===membership&&MSG.includes('슬롯'),'stale player membership accepted');elements.sqdiscard.onclick();
 const valid={type:'squad.preparation',actor:'manager',parentId:parent.id,assignments:rosterPlanState(db,parent).assignments,roles:{[backup.id]:backup.rosterRole},squads:{[parent.id]:{starters:{...parent.depthChart},tactics:{...parent.tactics},training:normalizeTraining(parent.training)}}};
 const pure=JSON.stringify(db);for(const bad of [
 {...valid,roles:{[backup.id]:'invalid'}},
 {...valid,squads:{[parent.id]:{...valid.squads[parent.id],tactics:{...parent.tactics,aggression:Infinity}}}},
 {...valid,squads:{[parent.id]:{...valid.squads[parent.id],training:{...normalizeTraining(parent.training),mechanical:101}}}},
 {...valid,squads:{[other.id]:valid.squads[parent.id]}}
 ])check(!previewWorldAction(db,bad).ok,'malformed or foreign preparation accepted');
 check(JSON.stringify(db)===pure,'failed previews mutate world');
 const preview=previewWorldAction(db,valid);check(preview.ok&&JSON.stringify(db)===pure,'valid preview impure');db.worldDate=addDays(db.worldDate,1);
 const later=JSON.stringify(db);check(!applyWorldAction(db,preview).ok&&JSON.stringify(db)===later,'stale date preview applied');
 // Reserve-only authority and fired state are checked by the domain itself.
 db.manager.teamId=reserve.id;SQUAD=reserve.id;const coach=squadEditState(reserve);coach.training.intensity='light';coach.dirty=true;
 const command={type:'squad.preparation',actor:'manager',parentId:parent.id,assignments:coach.rosterPlan.assignments,roles:coach.roles,squads:{[parent.id]:{starters:parent.depthChart,tactics:parent.tactics,training:normalizeTraining(parent.training)}}};
 check(!commitWorldAction(db,command).ok,'reserve coach crafted parent control');elements.sqapply.onclick();check(reserve.training.intensity==='light','reserve coaching rejected');
 db.world.fired=true;check(!commitWorldAction(db,{...command,squads:{}}).ok,'fired manager domain bypass');db.world.fired=false;
 const clone=unpackDB(packDB(db));SQUAD_EDIT=squadEditState(reserve);DB=clone;const reset=squadEditState(clone.teams[reserve.id]);check(reset.world===clone&&reset!==coach&&Object.keys(reset.squads).length===0,'replaced DB reused transient edits');
 check(clone.teams[parent.id].tactics.aggression===35&&clone.teams[reserve.id].training.intensity==='light','save/load preparation changed');
 console.log('SQUAD_STAGING_ACCEPTANCE PASS actual team/slider/role/destination/apply/discard events, independent pending edits/public navigation, validation+late writer rollback with identities/history, roster+coaching atomicity, stale baseline/membership, reserve/fired authority, world replacement/save');
})();`,{timeout:60000,setupSources:["let DB,SQUAD,SQUAD_EDIT,OPEN_P,MSG,$,document,window;const originalStarter=setDepthStarter;function nav(){}function navKeepScroll(){}function saveDB(){}function bindScrimPlans(){}function bindRolePromiseControls(){}function bindLoanControls(){}function bindLoanPurchaseControls(){}function bindLocalServiceControls(){}function bindOfficialRegistrationControls(){}",...(await artifactSources(['ui-club-medical.js','ui-roster.js']))]});
