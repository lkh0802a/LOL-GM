import './verify-squad-draft-recovery-evidence.mjs';
import {runEngineFixture,artifactSources,artifactSource} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const check=(ok,msg)=>{if(!ok)throw Error('SQUAD_STAGING '+msg)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:6,div2:true,system:'franchise'}),regionCfg('EU',{teams:2,div2:false,system:'franchise'})];cfg.internationals=[];cfg.subs=0;cfg.changes='none';
 const db=buildWorld(cfg),[parent,other]=activeTeams(db,'NA',1),reserve=reserveTeamsOf(db,parent)[0];
 for(const t of [parent,reserve,...activeTeams(db,'EU',1)])for(const role of ROLES){const p=genPlayer(db,new RNG(t.id+role),{region:t.region,role,age:22,base:65});signContract(db,p,t,1,3);t.depthChart[role]=p.id}
 const backup=genPlayer(db,new RNG('staged-backup'),{region:parent.region,role:'MID',age:22,base:60});signContract(db,backup,parent,1,3);
 startWorldSeason(db,parent.id,'squad-staging');DB=db;SQUAD=parent.id;SQUAD_EDIT=null;
 const elements={sq:{},practicefocus:{},trint:{},trleft:{textContent:''},sqapply:{},sqdiscard:{}},
   tactic={dataset:{tac:'aggression'},value:13,previousElementSibling:{querySelector:()=>({})}},
   role={dataset:{srole:backup.id},value:'core'},destination={dataset:{squadDst:backup.id},value:reserve.id},
   lineup={dataset:{lineupPlayer:backup.id},value:'MID'},
   selectors={'[data-tac]':[tactic],'[data-srole]':[role],'[data-squad-dst]':[destination],'[data-lineup-player]':[lineup]};
 $=q=>elements[q.slice(1)]||null;document={querySelector:$,querySelectorAll:q=>selectors[q]||[]};window={};
 const event={stopPropagation(){}};bindSquad();const parentChart={...parent.depthChart},reserveChart={...reserve.depthChart};
 squadEditState(parent);tactic.oninput(event);elements.trint.value='light';elements.trint.onchange({target:elements.trint});role.onchange(event);
 elements.sq.onchange({target:{value:reserve.id}});const er=squadEditState(reserve);
 check(er.tactics.aggression===reserve.tactics.aggression&&er.starters.MID===reserveChart.MID,'parent values leaked into reserve');
 tactic.value=79;tactic.oninput(event);elements.trint.value='high';elements.trint.onchange({target:elements.trint});
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
 const changed=JSON.stringify(db);bindSquad();elements.sqapply.onclick();check(JSON.stringify(db)===changed&&SQUAD_EDIT&&MSG.includes('변경되었습니다'),'stale coaching overwrote current state');
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
 check(!commitWorldAction(db,command).ok,'reserve coach crafted parent control');bindSquad();elements.sqapply.onclick();check(reserve.training.intensity==='light','reserve coaching rejected');
 db.world.fired=true;check(!commitWorldAction(db,{...command,squads:{}}).ok,'fired manager domain bypass');db.world.fired=false;
 const clone=unpackDB(packDB(db));SQUAD_EDIT=squadEditState(reserve);DB=clone;const reset=squadEditState(clone.teams[reserve.id]);check(reset.world===clone&&reset!==coach&&Object.keys(reset.squads).length===0,'replaced DB reused transient edits');
 check(clone.teams[parent.id].tactics.aggression===35&&clone.teams[reserve.id].training.intensity==='light','save/load preparation changed');

 // Review the actual stale draft against current owned values without rebasing.
 DB=clone;SQUAD=reserve.id;SQUAD_EDIT=null;const owned=clone.teams[reserve.id];
 const draft=squadEditState(owned);draft.tactics.aggression=owned.tactics.aggression===23?24:23;draft.training.intensity='high';draft.dirty=true;
 const expected=JSON.stringify(draft.expected),oldDraft=JSON.stringify([draft.tactics,draft.training]);clone.worldDate=addDays(clone.worldDate,1);
 const reviewBefore=JSON.stringify(clone),m=squadDraftReviewModel(owned,draft);
 check(m.stale&&m.errors.some(x=>x.includes('변경되었습니다'))&&m.rows.some(x=>x.item==='공격성 (0–100)'),'stale source review missing');
 check(m.rows.some(x=>x.item==='훈련 강도'&&x.draft==='강하게')&&JSON.stringify(clone)===reviewBefore&&JSON.stringify(draft.expected)===expected,'review mutated DB or rebased expected');
 check(squadDraftReviewModel(clone.teams[parent.id],draft)===null,'reserve review exposed parent coaching');
 const html=squadDraftReview(owned,draft);check(html.includes('현재 적용')&&html.includes('미적용 초안')&&html.includes('sqreviewreset')&&html.includes('scope="col"'),'review table/reset not rendered');
 elements.sqreviewreset={};bindSquad();confirm=()=>false;elements.sqreviewreset.onclick();
 check(SQUAD_EDIT===draft&&JSON.stringify([draft.tactics,draft.training])===oldDraft&&JSON.stringify(clone)===reviewBefore,'review cancellation discarded draft');
 confirm=()=>{clone.worldDate=addDays(clone.worldDate,1);return true};elements.sqreviewreset.onclick();check(SQUAD_EDIT===draft,'confirmation date change discarded draft');
 bindSquad();confirm=()=>true;const resetCallback=elements.sqreviewreset.onclick,resetBefore=JSON.stringify(clone);resetCallback();
 check(SQUAD_EDIT===null&&JSON.stringify(clone)===resetBefore,'explicit reset failed');
 const freshEdit=squadEditState(owned);check(freshEdit.expected.roster.date===clone.worldDate&&freshEdit.tactics.aggression===owned.tactics.aggression&&freshEdit.training.intensity===owned.training.intensity,'fresh editor copied stale proposals');
 resetCallback();check(SQUAD_EDIT===freshEdit,'retained reset callback discarded new editor');
 freshEdit.training.intensity='light';freshEdit.dirty=true;bindSquad();elements.sqapply.onclick();check(owned.training.intensity==='light'&&SQUAD_EDIT===null,'manual re-edit existing writer failed');
 for(const lite of [false,true]){const restored=unpackDB(lite?packDB(clone):JSON.stringify(clone));check(restored.teams[reserve.id].training.intensity==='light'&&restored.teams[parent.id].tactics.aggression===35,'review/re-edit save continuity');}
 const cid='recovery-official',opponent=activeTeams(clone,'NA',2).find(t=>t.id!==owned.id);
 check(!!opponent,'tier-two opponent missing');
 for(const role of ROLES){const p=genPlayer(clone,new RNG('recovery-opponent|'+role),{region:'NA',role,age:22,base:65});signContract(clone,p,opponent,1,3);opponent.depthChart[role]=p.id;}
 delete opponent.registration;initializeOfficialRegistrations(clone);
 for(const team of [owned,opponent])for(const pid of team.roster){const p=clone.players[pid];p.cond=100;p.fatigue=0;}
 clone.competitions[cid]={id:cid,name:'초안 복구 공식 소비',region:'NA',teams:[owned.id,opponent.id],rules:{fearless:true},stages:[{id:'regular',name:'정규',type:'round_robin',legs:1,bestOf:1}]};
 const season=newSeason(clone,cid,clone.year,'recovery-official',addDays(clone.worldDate,1));season.key=cid;season.region='NA';season.div=2;clone.world.seasons[cid]=season;
 const day=season.days[0],match=day.matches[0];setWorldCalendarDate(clone,day.date);for(const team of [owned,opponent])delete team.practiceDay;runDailyPractice(clone);
 check(owned.training.intensity==='light'&&owned.practiceDay.drills===0,'current manual training/official daily consumer');
 const result=simulateScheduledSeries(clone,season,day,match,clone.competitions[cid].stages[0]);commitScheduledSeries(clone,season,match,result);finalizeCompetitionDay(clone,season,day,0,clone.competitions[cid].stages[0]);
 check(result.rec.games.every(g=>g.publicRecord.ending.kind==='nexus'),'recovery official ending');
 const foreignId='recovery-foreign',foreignTeams=activeTeams(clone,'EU',1).slice(0,2);
 clone.competitions[foreignId]={id:foreignId,name:'외부 공식 소비',region:'EU',teams:foreignTeams.map(t=>t.id),rules:{fearless:true},stages:[{id:'regular',name:'정규',type:'round_robin',legs:1,bestOf:1}]};
 const fs=newSeason(clone,foreignId,clone.year,'recovery-foreign',addDays(clone.worldDate,1));fs.key=foreignId;fs.region='EU';fs.div=1;clone.world.seasons[foreignId]=fs;
 const fd=fs.days[0],fm=fd.matches[0];setWorldCalendarDate(clone,fd.date);const fr=simulateScheduledSeries(clone,fs,fd,fm,clone.competitions[foreignId].stages[0]);commitScheduledSeries(clone,fs,fm,fr);finalizeCompetitionDay(clone,fs,fd,0,clone.competitions[foreignId].stages[0]);
 const rawFull=JSON.stringify(clone),packed=packDB(clone),encoded=JSON.parse(packed);
 check(encoded.world.seasons[foreignId].compact&&encoded.world.seasons[foreignId].days[0].matches[0].res.lite&&!encoded.world.seasons[cid].days[0].matches[0].res.lite,'actual foreign lite/owned full packing');
 for(const restored of [unpackDB(rawFull),unpackDB(packed)])check(restored.world.seasons[foreignId].days[0].matches[0].res.games.every(g=>g.publicRecord.ending.kind==='nexus'),'actual foreign lite nexus history');
 for(const lite of [false,true]){const restored=unpackDB(lite?packDB(clone):JSON.stringify(clone));check(restored.world.seasons[cid].days[0].matches[0].res.games.every(g=>g.publicRecord.ending.kind==='nexus')&&restored.teams[owned.id].training.intensity==='light','recovery official save history');}
 console.log('SQUAD_DRAFT_REVIEW PASS clone purity, original expected, current-only reserve authority, source table, cancellation, changed-date confirmation, reset duplicate guard, explicit current re-edit, full/lite');
 console.log('SQUAD_STAGING_ACCEPTANCE PASS actual team/slider/role/destination/apply/discard events, independent pending edits/public navigation, validation+late writer rollback with identities/history, roster+coaching atomicity, stale baseline/membership, reserve/fired authority, world replacement/save');
})();`,{timeout:60000,setupSources:["var SLOT='1',SLOT_SWITCHING=false,UI_RENDER_ID=1,UI_OVERLAY=null,VIEW='squad';let DB,SQUAD,SQUAD_EDIT,OPEN_P,MSG,$,document,window,confirm=()=>true;const originalStarter=setDepthStarter;function nav(){UI_RENDER_ID++;bindSquad()}function navKeepScroll(){UI_RENDER_ID++;bindSquad()}function saveDB(){}function bindScrimPlans(){}function bindRolePromiseControls(){}function bindLoanControls(){}function bindLoanPurchaseControls(){}function bindLocalServiceControls(){}function bindOfficialRegistrationControls(){}",...(await artifactSource('app.js')).split('\n').filter(x=>x.startsWith('const TAC_KO=')||x.startsWith('const esc=')).map(x=>x),...(await artifactSources(['ui-club-medical.js','ui-club-practice.js','ui-squad-controls.js','ui-roster.js','ui-squad-preparation.js']))]});
