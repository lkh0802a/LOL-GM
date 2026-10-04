import {runEngineFixture,artifactSource} from './test-harness.mjs';
import {writeFile} from 'node:fs/promises';
const report=await runEngineFixture(String.raw`(()=>{
 const check=(v,m)=>{if(!v)throw Error('ITEM_STAT_PATCH '+m)},near=(a,b)=>Math.abs(a-b)<1e-8;
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,div2:true,system:'franchise'})];cfg.internationals=[];
 const db=buildWorld(cfg),[a,b]=activeTeams(db,'NA',1);setManagedTeam(db,a.id);
 for(const t of [a,b])for(const role of ROLES){const p=genPlayer(db,new RNG('stat-patch|'+t.id+role),{region:t.region,role,age:22,base:65});signContract(db,p,t,1,3);t.depthChart[role]=p.id}
 db.world={year:db.year,manage:'manual',phase:'season',seasons:{}};
 const P=db.patch,c=championByName(db,'Jarvan IV'),player=db.players[a.depthChart.TOP],source=JSON.stringify(SYSTEM_SOURCE_SNAPSHOT),rows=[];
 const state={t:12,patch:P,sides:[{soul:false,baronUntil:0,elderUntil:0}]},make=()=>({...newPS(player,0,'TOP',c.id,P),items:[],starterItem:null,quest:null,itemActions:[],itemPlan:[],gold:20000,goldEarned:20000});
 const note=(d,k,newValue)=>({type:'item_stat',id:d.id,name:d.name,field:k,old:d.stats[k],new:newValue,source:{...d.source},dir:1,size:'small',why:'실제 작성자 수용 시나리오'});
 for(const [id,k] of [['3072','FlatPhysicalDamageMod'],['1028','FlatHPPoolMod'],['1029','FlatArmorMod'],['1033','FlatSpellBlockMod']]){
  const d=P.itemDefs[id],ps=make();for(const act of itemCraftActions(P,[id]))check(applyItemCraftAction(ps,act),'purchase '+id);
  const empty=make(),before=combatStats(state,ps),noItem=combatStats(state,empty),original=JSON.stringify(d),fit=systemChoiceScore(c,d.effects,'TOP'),cached=systemChoiceBase(P,c,'TOP'),draftBefore=championSystemMetaProfile(P,c);
  // Existing effect patches must survive stat buffs, rollback and legacy split recovery.
  const effectKey=k==='FlatPhysicalDamageMod'?'offense':'defense',effect=d.effects[effectKey];applyNote(P,{type:'item',id,field:effectKey,new:effect+.02});
  const classStates=[...new Set(Object.values(P.champions).map(x=>x.dmg))].flatMap(type=>[1,11].map(lvl=>({...ps,champ:Object.values(P.champions).find(x=>x.dmg===type),lvl}))),classBefore=classStates.map(q=>combatStats(state,q));
  const withEffect=combatStats(state,ps),n=note(d,k,d.stats[k]*1.02);check(applyNote(P,n),'stat writer '+k);
  const after=combatStats(state,ps),current=combatStats0(state,ps);
  classStates.forEach((q,i)=>{const now=combatStats(state,q);check(k==='FlatPhysicalDamageMod'?now.off>classBefore[i].off:now.ehp>classBefore[i].ehp,'damage class/level consumer '+q.champ.dmg+'/'+q.lvl)});
  check(after!==withEffect&&near(after.off,current.off)&&near(after.ehp,current.ehp),'stale combat cache '+k);
  check(k==='FlatPhysicalDamageMod'?after.off>withEffect.off:after.ehp>withEffect.ehp,'owned raw stat consumer '+k);
  check(noItem.off===combatStats(state,empty).off&&noItem.ehp===combatStats(state,empty).ehp,'nonowner changed '+k);
  check(championSystemMetaProfile(P,c)!==draftBefore,'draft cache stale '+k);
  check(systemChoiceBase(P,c,'TOP')!==cached&&systemChoiceScore(c,d.effects,'TOP')>fit,'selection cache/fit '+k);
  const raw={...d,gold:{total:d.cost}},normalized=itemEffectsFromSource(raw),split=itemAttackStatEffects(raw);
  check(near(d.effects[effectKey]-normalized[effectKey],.02),'independent effect lost '+k);
  check(near(d.defenseStatEffect,itemDefenseStatEffect(raw))&&near(d.attackStatEffects.ad,split.ad),'split stale '+k);
  const legacy={...d};delete legacy.defenseStatEffect;delete legacy.attackStatEffects;
  check(JSON.stringify(inventoryDefenseStats({[id]:legacy},[id]))===JSON.stringify(inventoryDefenseStats(P.itemDefs,[id]))&&JSON.stringify(inventoryAttackStats({[id]:legacy},[id]))===JSON.stringify(inventoryAttackStats(P.itemDefs,[id])),'legacy split '+k);
  const frozen=JSON.stringify(P);for(const bad of [n,{...n,old:n.new,new:NaN},{...n,old:n.new,new:-1},{...n,old:n.new,field:'FlatMagicDamageMod'},{...n,old:n.new,source:{...n.source,version:'unknown'}},{...n,id:'missing'}])check(applyNote(P,bad)===false&&JSON.stringify(P)===frozen,'rejection mutated '+k);
  const cash=combatStats(state,ps);ps.gold+=6000;ps.goldEarned+=6000;check(cash.off===combatStats(state,ps).off&&cash.ehp===combatStats(state,ps).ehp,'cash power');
  check(applyNote(P,{...n,old:n.new,new:n.old,dir:-1}),'inverse');check(near(combatStats(state,ps).off,withEffect.off)&&near(combatStats(state,ps).ehp,withEffect.ehp),'raw rollback');
  applyNote(P,{type:'item',id,field:effectKey,new:effect});check(JSON.stringify(d)===original&&near(combatStats(state,ps).off,before.off)&&near(combatStats(state,ps).ehp,before.ehp),'original item rollback');
  rows.push({id,field:k,source:n.source,old:n.old,new:n.new,before:{off:withEffect.off,ehp:withEffect.ehp},after:{off:after.off,ehp:after.ehp},fitBefore:fit,damageClassLevels:classStates.map(q=>[q.champ.dmg,q.lvl])});
 }
 const quest=make();quest.questBoots='3047';quest.questRevision=1;const boots=P.itemDefs['3047'],questBefore=combatStats(state,quest),questNote=note(boots,'FlatArmorMod',boots.stats.FlatArmorMod*1.02);
 check(applyNote(P,questNote)&&combatStats(state,quest).ehp>questBefore.ehp,'out-of-slot quest stat/cache');check(applyNote(P,{...questNote,old:questNote.new,new:questNote.old})&&near(combatStats(state,quest).ehp,questBefore.ehp),'quest rollback');
 // Rounded/clamped source contribution must be removed exactly once even at saturation.
 const saturated=JSON.parse(JSON.stringify(P)),d=saturated.itemDefs['3072'];d.stats.FlatPhysicalDamageMod=200;d.effects.offense=itemEffectsFromSource({...d,gold:{total:d.cost}}).offense+.02;d.attackStatEffects=itemAttackStatEffects({...d,gold:{total:d.cost}});
 check(applyNote(saturated,note(d,'FlatPhysicalDamageMod',201))&&near(d.effects.offense-d.attackStatEffects.ad,itemEffectsFromSource({...d,stats:{...d.stats,FlatPhysicalDamageMod:0},gold:{total:d.cost}}).offense+.02),'saturated double contribution');
 const generated={id:'fictional',active:true,stats:{FlatPhysicalDamageMod:10},effects:{offense:.01},source:{provider:'fictional'}};check(!itemRawStatFields(generated).length,'fabricated source accepted');
 // Exercise the actual balance-note selector with seeded RNG and labeled synthetic usage inputs.
 const selected=[];for(let i=0;i<64;i++){const ev={id:'3072',usage:.3,wr:.52},n=systemBalanceNote(db,'item',ev,i%2?1:-1,'small',new RNG('stat-selector-'+i));if(n?.type==='item_stat'){check(n.field==='FlatPhysicalDamageMod'&&n.source.version===P.itemDefs['3072'].source.version,'wrong selector source');selected.push(n)}}
 check(selected.length>0,'actual selector never emits stat notes');
 const plannedWorld=packDB(db),planned=chooseSystemBalanceChanges(db,{rows:[]},false,new RNG('stat-empty-selector'));check(packDB(db)===plannedWorld,'balance planning mutated world');
 const mainNote=note(P.itemDefs['3072'],'FlatPhysicalDamageMod',P.itemDefs['3072'].stats.FlatPhysicalDamageMod*1.02),oldId=P.id;
 const historic=JSON.stringify(getPatch(db,oldId).itemDefs);check(applyNote(P,mainNote),'persisted note');P.id='26.stat-fixture';
 const record={id:P.id,date:db.worldDate,notes:[mainNote],analysis:{itemChanges:[mainNote.id]}};db.patches.list.push(record);db.patches.history.push(record);clearPatchCache(db);
 const packed=packDB(db),copy=unpackDB(packed);check(copy.patch.itemDefs['3072'].stats.FlatPhysicalDamageMod===mainNote.new,'save current');
 check(JSON.stringify(getPatch(copy,oldId).itemDefs)===historic,'old snapshot rewritten');
 const replay=JSON.parse(JSON.stringify(copy));replay.patch=buildPatch();check(getPatch(replay,P.id).itemDefs['3072'].stats.FlatPhysicalDamageMod===mainNote.new,'history note replay');
 const savedAfter='26.stat-follow';copy.patches.history.push({id:savedAfter,notes:[]});copy.patch.id=savedAfter;clearPatchCache(copy);check(getPatch(copy,P.id).itemDefs['3072'].stats.FlatPhysicalDamageMod===mainNote.new,'later historical stat lost');
 check(lastSystemChange(db,'item','3072').note.type==='item_stat','cooldown source misses stat');
 const outcomes=[],digest=r=>JSON.stringify({winner:r.winner,duration:r.duration,ending:r.ending,gold:r.goldHist,objectives:r.objectiveEvents,takedowns:r.takedownEvents,players:r.sides.map(s=>s.ps.map(p=>({k:p.k,d:p.d,a:p.a,lvl:p.lvl,xp:p.xp,dmg:p.dmg,items:matchQuestItems(p),ledger:matchGoldLedger(p)})))});
 for(const seed of ['record-official','item-stat-match-1'])for(const ids of [[a.id,b.id],[b.id,a.id]]){const r=simulateMatch(db,...ids,seed,null,false),q=simulateMatch(db,...ids,seed,null,true);check(digest(r)===digest(q)&&r.ending?.kind==='nexus','logged quiet');outcomes.push({seed,teams:ids,winner:r.winner,ending:r.ending,gold:r.goldHist.at(-1)})}
 check(packDB(db)===packed&&JSON.stringify(SYSTEM_SOURCE_SNAPSHOT)===source,'world/pinned source mutation');
 const pending=createSeriesSession(db,a.id,b.id,1,'item-stat-official',{compId:'stats'});db.world.pendingOfficial={queue:[{session:pending}]};const resumed=unpackDB(packDB(db));check(playSeriesSessionGame(resumed,resumed.world.pendingOfficial.queue[0].session,null,false),'official resume');
 const rec=seriesSessionResult(resumed,resumed.world.pendingOfficial.queue[0].session).rec,g=rec.games[0];check(g.patch===P.id&&recordedPublicMatch(resumed,rec,g).record,'official pinned patch');resumed.world.seasons.stats={id:'stats',comp:'stats',region:'NA',done:true,days:[{date:g.date,matches:[{res:rec}]}]};
 for(const region of ['NA','EU']){resumed.world.seasons.stats.region=region;const loaded=unpackDB(packDB(resumed));check(JSON.stringify(loaded.world.seasons.stats.days[0].matches[0].res.games[0].publicRecord)===JSON.stringify(g.publicRecord)&&loaded.patch.itemDefs['3072'].stats.FlatPhysicalDamageMod===mainNote.new,'full lite history')}
 globalThis.DB=db;globalThis.esc=s=>String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const malformedText=noteText({...mainNote,old:'<img src=x onerror=alert(1)>',new:'<script>bad</script>'});check(!malformedText.includes('<img')&&!malformedText.includes('<script>')&&malformedText.includes('&lt;img'),'saved note text escaped');
 const text=noteText(mainNote);check(text.includes('공격력')&&text.includes('16.19.1')&&text.includes('게임 내 조정')&&text.includes('→'),'rendered units/source');
 return {scope:'8.3.3 AD/HP/armor/MR only; intentional patch behavior extension',rows,selectorStatNotes:selected.length,selected,outcomes,pendingFullLite:true,oldHistoryUnchanged:true,sourceImmutable:true,limits:['AP/AS/crit remain aggregate proxies','no exact spell geometry','shop and waves metadata still missing','no professional calibration']};
})()`,{timeout:60000,setupSources:[await artifactSource('ui-patch.js')]});
const index=process.argv.indexOf('--evidence');if(index>=0)await writeFile(process.argv[index+1],JSON.stringify(report,null,2)+'\n');
console.log('ITEM_STAT_PATCH_ACCEPTANCE PASS '+JSON.stringify({rows:report.rows,selectorStatNotes:report.selectorStatNotes,pairedMatches:report.outcomes.length,pendingFullLite:report.pendingFullLite}));
