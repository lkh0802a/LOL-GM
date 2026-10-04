import {runEngineFixture,artifactSource} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error('ROLE_QUEST_MATCH '+m)},cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:10,div2:false})];cfg.internationals=[];
 const db=buildWorld(cfg),[a,b]=activeTeams(db,null,1);startCareer(db,a.id,'quest');autoBuildInitialSquad(db,a,new RNG('quest-start','squad'),5);finalizeInitialRosters(db);
 globalThis.DB=db;globalThis.esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const first=simulateMatch(db,a.id,b.id,'quest-initial',null,true),forced={bans:first.draft.bans,picks:first.draft.picks},saved=packDB(db);
 const baseline=Array.from({length:4},(_,i)=>simulateMatch(db,a.id,b.id,'quest-pair-'+i,{forced},true));
 check(playerTable(first.sides[0],0).includes('퀘스트')&&noteText({type:'role_quest',role:'MID',field:'bonusPower',old:.08,new:.09}).includes('8% → 9%'),'quest UI or percentage rendering');
 const changed=unpackDB(saved);for(const role of ROLES)applyNote(changed.patch,{type:'role_quest',role,field:'threshold',new:role==='JGL'?60:2500});
 const delayed=Array.from({length:4},(_,i)=>simulateMatch(changed,a.id,b.id,'quest-pair-'+i,{forced},true));
 check(delayed.some((m,i)=>JSON.stringify(m.goldHist)!==JSON.stringify(baseline[i].goldHist)),'patch had no actual match effect');
 for(const role of ROLES)check(delayed.some((m,i)=>m.sides.some((s,j)=>s.ps.find(p=>p.role===role).quest.completedAt!==baseline[i].sides[j].ps.find(p=>p.role===role).quest.completedAt)),'patch did not change '+role+' timing');
 check(packDB(db)===saved,'isolated match mutated career');
 const restored=unpackDB(saved),again=simulateMatch(restored,a.id,b.id,'quest-pair-0',{forced},true);
 check(JSON.stringify(again.goldHist)===JSON.stringify(baseline[0].goldHist),'current save changed quest match');
 for(const match of baseline)for(const side of match.sides)for(const ps of side.ps){
   check(ps.items.length<=6&&ps.lvl<=(ps.role==='TOP'&&ps.quest.completed?20:18),'inventory or level bound');
   check(!ps.items.some(id=>ps.patchRef.itemDefs[id]?.from?.includes('3867')&&ps.role!=='SUP'),'support reward sold to other role');
   if(ps.role==='ADC'&&ps.quest.completed&&ps.questBoots)check(!ps.items.includes(ps.questBoots)&&matchQuestItems(ps).includes(ps.questBoots),'bot boot slot');
   if(ps.role==='MID'&&ps.quest.completed)check(!ps.items.some(id=>roleQuestBootUpgrade(ps.patchRef,id)),'mid boot not upgraded');
   if(ps.role==='SUP'&&ps.quest.completed)check(ps.questSupportItem&&ps.questWards>0,'support reward/ward not used');
 }
 const ps=newPS(Object.values(db.players).find(p=>!p.retired),0,'TOP',forced.picks[0].TOP,db.patch),st={t:20,quiet:true,rng:{log:new RNG('quest-clock','log')},sides:[{ps:[ps],team:a}]};
 matchQuestEvent(st,ps,{cs:10000});addXp(ps,1e6);check(ps.lvl===20,'top level20 reward');
 const xp=ps.xp;roleQuestTakedown(st,ps);check(ps.xp-xp===80,'top takedown xp');
 const joined=roleQuestObjectiveJoin(st,0,[]);check(joined.includes(ps)&&ps.questTeleports===1&&!roleQuestObjectiveJoin(st,0,[]).length,'teleport cooldown');
 const mid=newPS(ps.p,0,'MID',forced.picks[0].MID,db.patch),state={...st,sides:[{ps:[mid],team:a,dragons:[],baronUntil:0,elderUntil:0,soul:false}],patch:db.patch};
 addGold(mid,10000);const before=combatStats(state,mid).off;matchQuestEvent(state,mid,{cs:10000});check(combatStats(state,mid).off>before,'same-tick reward ignored by cache');
 const gold=mid.goldEarned;matchQuestEvent(state,mid,{cs:10000});check(mid.goldEarned===gold,'duplicate completion grant');
 const old=unpackDB(saved);delete old.patch.roleQuests;delete old.patches.roleQuestBaseline;
 check(!getPatch(old,'26.19').roleQuests&&!simulateMatch(old,a.id,b.id,'legacy',{forced},true).sides[0].ps[0].quest,'legacy silently enabled quests');
 console.log('ROLE_QUEST_MATCH_ACCEPTANCE PASS (actual paired effects, five roles, slots/wards/teleport/XP/cache, save and legacy)');
})()`,{filename:'role-quest-match.vm.js',timeout:120000,setupSources:[await artifactSource('ui-match.js'),await artifactSource('ui-patch.js'),await artifactSource('ui-opponent-report.js'),await artifactSource('ui-opponent-draft.js')]});
