import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error('ROLE_QUEST_RULES '+m)},patch=buildPatch();
 const before=JSON.stringify(patch.roleQuests),top=createRoleQuest(patch,'TOP');
 const note={type:'role_quest',role:'TOP',field:'threshold',old:1200,new:900};
 applyNote(patch,note);check(top.rules.threshold===1200&&createRoleQuest(patch,'TOP').rules.threshold===900,'match rule snapshot changed');
 applyNote(patch,{...note,new:note.old});check(JSON.stringify(patch.roleQuests)===before,'exact rollback');
 const revision=patch._revision;let rejected=false;try{applyNote(patch,{...note,new:NaN})}catch{rejected=true}
 check(rejected&&patch._revision===revision&&JSON.stringify(patch.roleQuests)===before,'invalid note mutated patch');
 for(const role of ROLES){const quest=createRoleQuest(patch,role);check(quest&&quest.progress===0,'missing role '+role);
   const noProgress=advanceRoleQuest(quest,{sequence:0,minute:20});check(!noProgress&&!quest.completed,'fixed-time completion '+role);
   const action={sequence:1,minute:21,cs:1000,jungleStacks:35,supportGold:1000};
   check(advanceRoleQuest(quest,action)?.role===role&&quest.completed,'action-based completion '+role);
   check(!advanceRoleQuest(quest,action)&&!advanceRoleQuest(quest,{...action,sequence:2}),'duplicate reward '+role);
 }
 const mid=createRoleQuest(patch,'MID');advanceRoleQuest(mid,{sequence:0,minute:2,damage:1000,melee:true});check(mid.progress===30,'melee damage coefficient');
 const invalid=createRoleQuest(patch,'ADC'),saved=JSON.stringify(invalid);try{advanceRoleQuest(invalid,{sequence:0,minute:1,cs:-1})}catch{}
 check(JSON.stringify(invalid)===saved,'invalid event mutated quest');
 const roam=createRoleQuest(patch,'TOP');advanceRoleQuest(roam,{sequence:0,minute:4,level:3,laneSeconds:120});check(roam.roamBank===60,'roam bank cap');
 advanceRoleQuest(roam,{sequence:1,minute:5,level:3,awaySeconds:60});check(roam.roamBank===0&&roam.progress===270,'banked lane rate');
 check(createRoleQuest({id:'legacy'},'TOP')===null,'missing legacy quests silently enabled');
 const db=buildWorld();const generated=maybeRoleQuestChange(db,true,{chance:()=>true,pick:xs=>xs[0]});check(generated?.type==='role_quest'&&generated.new!==generated.old,'quest cadence note');applyNote(db.patch,generated);applyNote(db.patch,{...generated,new:generated.old});db.patches.history=[{id:'27.1',notes:[note]}];const historic=getPatch(db,'27.1');
 check(historic.roleQuests.roles.TOP.threshold===900&&db.patch.roleQuests.roles.TOP.threshold===1200,'historical rules mutated live patch');
 check(unpackDB(packDB(db)).patch.roleQuests.roles.MID.bonusPower===.08,'patch rules save restoration');
 console.log('ROLE_QUEST_RULES_ACCEPTANCE PASS (five roles, patch snapshots/rollback, action progress, idempotence, invalid atomicity, roam bank, save)');
})()`,{filename:'role-quest-rules.vm.js',timeout:120000});
