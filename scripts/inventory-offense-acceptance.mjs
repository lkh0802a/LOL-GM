import {runEngineFixture,artifactSource} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const check=(v,m)=>{if(!v)throw Error('INVENTORY_OFFENSE '+m)},near=(a,b)=>Math.abs(a-b)<1e-8;
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,div2:true,system:'franchise'})];cfg.internationals=[];
 const db=buildWorld(cfg),[a,b]=activeTeams(db,'NA',1);setManagedTeam(db,a.id);
 for(const t of [a,b])for(const role of ROLES){const p=genPlayer(db,new RNG('match-history|'+t.id+role),{region:t.region,role,age:22,base:65});signContract(db,p,t,1,3);t.depthChart[role]=p.id}
 db.world={year:db.year,manage:'manual',phase:'season',seasons:{}};
 const player=db.players[a.depthChart.TOP],defs=db.patch.itemDefs,st={t:12,patch:db.patch,sides:[{soul:false,baronUntil:0,elderUntil:0}]};
 const make=c=>({...newPS(player,0,'MID',c.id,db.patch),items:[],starterItem:null,itemSpent:0,gold:500,goldEarned:500,itemActions:[],itemPlan:[],quest:null}),buy=(ps,id)=>{for(const act of itemCraftActions(db.patch,[id]))check(applyItemCraftAction(ps,act),'actual recipe rejected '+id)};
 let cashCases=0;
 for(const c of Object.values(db.patch.champions))for(const lvl of [1,11])for(const completed of [false,true]){
  const ps=make(c);ps.lvl=lvl;ps.quest=createRoleQuest(db.patch,'MID');ps.quest.completed=completed;
  const first=combatStats(st,ps);addGold(ps,6000);const held=combatStats(st,ps);
  check(first.off===held.off&&first.ehp===held.ehp,'cash power '+c.id+'/'+lvl+'/'+completed);cashCases++;
 }
 const c=championByName(db,'Jarvan IV'),ps=make(c);addGold(ps,6000);
 const empty=combatStats(st,ps);buy(ps,'1036');const sword=combatStats(st,ps);
 check(sword.attackStats.ad===c.base.ad+defs['1036'].stats.FlatPhysicalDamageMod&&sword.off>empty.off,'raw AD not consumed');
 check(sword===combatStats(st,ps)&&sword.off===combatStats0(st,ps).off,'purchase cache');
 buy(ps,'1036');check(combatStats(st,ps).attackStats.gear.ad===2*defs['1036'].stats.FlatPhysicalDamageMod,'legal repeated components lost');
 const final=make(c);addGold(final,20000);final.itemActions=itemCraftActions(db.patch,['3072']);advanceItemPurchases(final);
 check(final.items.length===1&&final.items[0]==='3072'&&combatStats(st,final).attackStats.gear.ad===defs['3072'].stats.FlatPhysicalDamageMod,'consumed recipe AD doubled');
 const before=JSON.stringify(final),act=itemCraftActions(db.patch,['3072']).at(-1);check(!applyItemCraftAction(final,act)&&JSON.stringify(final)===before,'duplicate final changed state');
 const poor=make(c);poor.gold=349;const frozen=JSON.stringify(poor);check(!applyItemCraftAction(poor,itemCraftActions(db.patch,['1036']).at(-1))&&JSON.stringify(poor)===frozen,'rejected bank changed power');
 const base=combatStats(st,ps),oldOff=defs['1036'].effects.offense,oldCost=defs['1036'].cost;
 applyNote(db.patch,{type:'item',id:'1036',field:'offense',new:oldOff+.02});check(combatStats(st,ps).off>base.off,'effect delta/cache erased');
 applyNote(db.patch,{type:'item',id:'1036',field:'offense',new:oldOff});check(near(combatStats(st,ps).off,base.off),'effect rollback');
 applyNote(db.patch,{type:'item',id:'1036',field:'cost',new:oldCost+100});check(near(combatStats(st,ps).off,base.off),'owned price changed AD');
 const expensive=make(c);expensive.gold=oldCost;check(!applyItemCraftAction(expensive,itemCraftActions(db.patch,['1036']).at(-1)),'actual patched purchase price ignored');
 applyNote(db.patch,{type:'item',id:'1036',field:'cost',new:oldCost});check(applyItemCraftAction(expensive,itemCraftActions(db.patch,['1036']).at(-1)),'price rollback purchase');
 // Existing AP/AS/crit effects remain aggregate proxies; no spell ratios,
 // champion passive exceptions or critical damage multipliers are invented.
 const proxyRows=[];
 for(const id of ['1052','1042','1018']){
  const q=make(c);addGold(q,6000);const old=combatStats(st,q);buy(q,id);const now=combatStats(st,q);
  check(now.off>old.off&&now.attackStats.ad===c.base.ad,'retained source proxy disconnected '+id);proxyRows.push({id,stats:defs[id].stats,off:now.off});
 }
 for(const id of ['1036','1052']){
  const q=make(c);addGold(q,6000);buy(q,id);q.quest=createRoleQuest(db.patch,'MID');q.questRevision++;
  const initial=combatStats(st,q);q.quest.completed=true;q.questRevision++;
  const done=combatStats(st,q),bonus=q.quest.rules.bonusPower;
  check(done.off>initial.off&&near(done.attackStats.ad,c.base.ad+done.attackStats.gear.ad*(1+bonus)),'existing bonus AD/AP quest lost '+id);
 }
 for(const d of Object.values(defs)){
  const raw=SYSTEM_SOURCE_SNAPSHOT.items[d.id];if(!raw)continue;
  const noAD={...raw,stats:{...raw.stats,FlatPhysicalDamageMod:0}},nonAD=itemEffectsFromSource(noAD).offense;
  check(near(d.effects.offense-d.attackStatEffects.ad,nonAD),'double source AD proxy '+d.id);
  const legacy={...d};delete legacy.attackStatEffects;
  check(JSON.stringify(inventoryAttackStats({[d.id]:legacy},[d.id]))===JSON.stringify(inventoryAttackStats(defs,[d.id])),'legacy split '+d.id);
 }
 const packed=packDB(db),legacy=unpackDB(packed);for(const d of Object.values(legacy.patch.itemDefs))delete d.attackStatEffects;
 check(near(combatStats0(st,ps).off,combatStats0({...st,patch:legacy.patch},ps).off),'old save power mismatch');
 const digest=r=>JSON.stringify({winner:r.winner,duration:r.duration,ending:r.ending,gold:r.goldHist,ps:r.sides.map(s=>s.ps.map(p=>({k:p.k,d:p.d,a:p.a,lvl:p.lvl,xp:p.xp,dmg:p.dmg,items:matchQuestItems(p),ledger:matchGoldLedger(p)})))});
 for(const seed of ['record-official','inventory-offense-1'])for(const ids of [[a.id,b.id],[b.id,a.id]]){
  const r=simulateMatch(db,...ids,seed,null,false),q=simulateMatch(db,...ids,seed,null,true);check(digest(r)===digest(q)&&r.ending?.kind==='nexus','actual logged/quiet terminal parity');
 }
 check(packDB(db)===packed,'simulation changed original world/history');
 const pending=createSeriesSession(db,a.id,b.id,1,'inventory-offense-series',{compId:'offense'});
 db.world.pendingOfficial={queue:[{session:pending}]};const resumed=unpackDB(packDB(db));
 const played=playSeriesSessionGame(resumed,resumed.world.pendingOfficial.queue[0].session,null,false);check(played,'pending session cannot resume');
 const rec=seriesSessionResult(resumed,resumed.world.pendingOfficial.queue[0].session).rec,g=rec.games[0];check(recordedPublicMatch(resumed,rec,g).record,'official source');
 resumed.world.seasons.offense={id:'offense',comp:'offense',region:'NA',done:true,days:[{date:g.date,matches:[{res:rec}]}]};
 for(const region of ['NA','EU']){resumed.world.seasons.offense.region=region;const copy=unpackDB(packDB(resumed)),r=copy.world.seasons.offense.days[0].matches[0].res;check(JSON.stringify(r.games[0].publicRecord)===JSON.stringify(g.publicRecord),'full/lite historical source changed')}
 globalThis.esc=s=>String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 check(!renderPublicMatchReview(resumed,rec,g,{}).includes('<th>아이템'),'item review column restored');
 console.log('INVENTORY_OFFENSE_ACCEPTANCE PASS '+JSON.stringify({cashCases,empty:empty.off,sword:sword.off,rawAD:sword.attackStats.ad,proxyRows,pairedMatches:4,pendingFullLite:true,exactSpellMechanics:false}));
})()`,{timeout:60000,setupSources:[await artifactSource('ui-match-history.js'),await artifactSource('ui-takedown-history.js')]});
