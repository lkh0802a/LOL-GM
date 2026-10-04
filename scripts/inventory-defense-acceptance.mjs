import {runEngineFixture,artifactSource} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const check=(v,m)=>{if(!v)throw Error('INVENTORY_DEFENSE '+m)},near=(a,b)=>Math.abs(a-b)<1e-8;
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,div2:true})];cfg.internationals=[];
 const db=buildWorld(cfg),[a,b]=activeTeams(db,'NA',1);setManagedTeam(db,a.id);
 for(const t of [a,b])for(const role of ROLES){const p=genPlayer(db,new RNG('match-history|'+t.id+role),{region:t.region,role,age:22,base:65});signContract(db,p,t,1,3);t.depthChart[role]=p.id}
 db.world={year:db.year,manage:'manual',phase:'season',seasons:{}};
 const p=db.players[a.depthChart.TOP],defs=db.patch.itemDefs;
 const make=name=>{const c=Object.values(db.patch.champions).find(c=>c.id===championId(name==='JarvanIV'?'Jarvan IV':name));check(c,'missing champion '+name);return {...newPS(p,0,'TOP',c.id,db.patch),items:[],starterItem:null,itemActions:[],itemPlan:[],itemSpent:0,gold:500,goldEarned:500,quest:null}};
 const st={t:12,patch:db.patch,sides:[{soul:false,baronUntil:0,elderUntil:0}]},rows=[];
 for(const name of ['JarvanIV','Ornn','Ahri','Jinx','Lulu'])for(const lvl of [1,11]){
  const ps=make(name);ps.lvl=lvl;
  const first=combatStats(st,ps);addGold(ps,6000);const held=combatStats(st,ps);
  check(first.ehp===held.ehp&&JSON.stringify(first.defenseStats)===JSON.stringify(held.defenseStats),'unspent gold gave defense '+name);
  // 8.3.2 removes the remaining offense cash conversion as well.
  check(first.off===held.off,'unspent gold gave offense');
  for(const id of ['1028','1031','1033']){
   const before=combatStats(st,ps),d=defs[id],actions=itemCraftActions(db.patch,[id]);
   for(const action of actions)check(applyItemCraftAction(ps,action),'source purchase rejected '+id);
   const after=combatStats(st,ps),s=d.stats;
   check(near(after.defenseStats.hp-before.defenseStats.hp,s.FlatHPPoolMod||0)&&near(after.defenseStats.armor-before.defenseStats.armor,s.FlatArmorMod||0)&&near(after.defenseStats.mr-before.defenseStats.mr,s.FlatSpellBlockMod||0),'raw stat consumer '+id);
   check(after.ehp>before.ehp&&after===combatStats(st,ps),'purchase/cache defense '+id);
  }
  rows.push({champion:name,level:lvl,emptyEhp:first.ehp,heldGoldEhp:held.ehp,equippedEhp:combatStats(st,ps).ehp,stats:combatStats(st,ps).defenseStats});
 }
 const ps=make('JarvanIV');addGold(ps,6000);ps.itemActions=itemCraftActions(db.patch,['3075']);advanceItemPurchases(ps);
 check(ps.items.length===1&&ps.items[0]==='3075','actual final recipe failed');
 const expected=inventoryDefenseStats(defs,['3075']),actual=combatStats(st,ps).defenseStats.gear;
 check(JSON.stringify(actual)===JSON.stringify(expected),'consumed components double applied');
 const frozen=JSON.stringify(ps.items),cost=defs['1028'].recipeCost;ps.gold=cost-1;
 check(!applyItemCraftAction(ps,itemCraftActions(db.patch,['1028']).at(-1))&&JSON.stringify(ps.items)===frozen,'rejected buy mutated inventory');
 const quest=make('JarvanIV');quest.items=['1031'];quest.questBoots='3047';quest.questRevision=1;
 check(inventoryDefenseStats(defs,matchQuestItems(quest)).armor===(defs['1031'].stats.FlatArmorMod||0)+(defs['3047'].stats.FlatArmorMod||0),'out-of-slot quest boots excluded');
 const split=defs['3075'].defenseStatEffect,base=combatStats(st,ps),old=defs['3075'].effects.defense;
 applyNote(db.patch,{type:'item',id:'3075',field:'defense',new:old+.02});
 const buff=combatStats(st,ps);check(buff.ehp>base.ehp&&defs['3075'].defenseStatEffect===split,'effect patch delta/cache erased');
 applyNote(db.patch,{type:'item',id:'3075',field:'defense',new:old});
 check(near(combatStats(st,ps).ehp,base.ehp),'effect rollback drift');
 const oldCost=defs['3075'].cost;applyNote(db.patch,{type:'item',id:'3075',field:'cost',new:oldCost+100});
 check(near(combatStats(st,ps).ehp,base.ehp),'price directly gave defense');
 applyNote(db.patch,{type:'item',id:'3075',field:'cost',new:oldCost});
 // Source normalization removes only the existing rounded/clamped raw-stat
 // proxy. Shield descriptions and effect-patch changes stay intact.
 for(const d of Object.values(defs)){
  const raw=SYSTEM_SOURCE_SNAPSHOT.items[d.id];if(!raw)continue;
  const nonstat=itemEffectsFromSource({...raw,stats:{...raw.stats,FlatHPPoolMod:0,FlatArmorMod:0,FlatSpellBlockMod:0}}).defense;
  check(near(d.effects.defense-d.defenseStatEffect,nonstat),'duplicate source defense proxy '+d.id);
  const legacy={...d};delete legacy.defenseStatEffect;
  check(JSON.stringify(inventoryDefenseStats({[d.id]:legacy},[d.id]))===JSON.stringify(inventoryDefenseStats(defs,[d.id])),'legacy definition split drift '+d.id);
 }
 const packed=packDB(db),restored=unpackDB(packed),legacy=unpackDB(packed);
 for(const d of Object.values(legacy.patch.itemDefs))delete d.defenseStatEffect;
 const modern=make('JarvanIV');modern.items=['3075'];
 check(near(combatStats0({...st,patch:restored.patch},modern).ehp,combatStats0({...st,patch:legacy.patch},modern).ehp),'legacy save defense mismatch');
 check(packDB(db)===packed,'read mutated source world');
 const digest=r=>JSON.stringify({winner:r.winner,duration:r.duration,ending:r.ending,gold:r.goldHist,ps:r.sides.map(s=>s.ps.map(p=>({k:p.k,d:p.d,a:p.a,lvl:p.lvl,xp:p.xp,dmg:p.dmg,items:matchQuestItems(p),ledger:matchGoldLedger(p)})))});
 for(const seed of ['record-official','inventory-defense-1'])for(const ids of [[a.id,b.id],[b.id,a.id]]){
  const logged=simulateMatch(db,...ids,seed,null,false),quiet=simulateMatch(db,...ids,seed,null,true);
  check(digest(logged)===digest(quiet),'logged/quiet outcome mismatch');
  check(logged.ending?.kind==='nexus','no actual nexus');
 }
 check(packDB(db)===packed,'simulation changed real world/history');
 const session=createSeriesSession(db,a.id,b.id,1,'inventory-defense-series',{compId:'defense'});playSeriesSessionGame(db,session,null,false);
 const rec=seriesSessionResult(db,session).rec,g=rec.games[0];check(recordedPublicMatch(db,rec,g).record,'official source rejected');
 db.world.seasons.defense={id:'defense',comp:'defense',region:'NA',done:true,days:[{date:g.date,matches:[{res:rec}]}]};
 const full=unpackDB(packDB(db)).world.seasons.defense.days[0].matches[0].res;
 check(!full.lite&&JSON.stringify(full.games[0].publicRecord)===JSON.stringify(g.publicRecord),'full history source changed');
 db.world.seasons.defense.region='EU';
 const reloaded=unpackDB(packDB(db)),saved=reloaded.world.seasons.defense.days[0].matches[0].res;
 check(JSON.stringify(saved.games[0].publicRecord)===JSON.stringify(g.publicRecord),'history rewritten through save');
 globalThis.esc=s=>String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 check(!renderPublicMatchReview(reloaded,saved,saved.games[0],{}).includes('<th>아이템'),'removed item column returned');
 console.log('INVENTORY_DEFENSE_ACCEPTANCE PASS '+JSON.stringify({rows,pairedMatches:4,officialSave:true,legacy:true,cashConversionRemoved:true,exactOffensiveMechanicsPending:true}));
})()`,{timeout:60000,setupSources:[await artifactSource('ui-match-history.js'),await artifactSource('ui-takedown-history.js')]});
