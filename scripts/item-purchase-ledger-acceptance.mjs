import {runEngineFixture,artifactSource} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 globalThis.esc=s=>String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const check=(v,m)=>{if(!v)throw Error('ITEM_LEDGER '+m)},near=(a,b)=>Math.abs(a-b)<1e-6;
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,div2:true,system:'franchise'})];cfg.internationals=[];
 const db=buildWorld(cfg),[a,b]=activeTeams(db,'NA',1);setManagedTeam(db,a.id);
 for(const t of [a,b])for(const role of ROLES){const p=genPlayer(db,new RNG('match-history|'+t.id+role),{region:t.region,role,age:22,base:65});signContract(db,p,t,1,3);t.depthChart[role]=p.id}
 db.world={year:db.year,manage:'manual',phase:'season',seasons:{}};
 const player=db.players[a.depthChart.TOP],cid=Object.keys(db.patch.champions).find(id=>db.patch.champions[id].name!=='Cassiopeia'),make=role=>{
  const ps=newPS(player,0,role||'TOP',cid,db.patch);return {...ps,items:[],starterItem:null,itemSpent:0,gold:500,goldEarned:500,itemActions:[],itemPlan:[],quest:null};
 },action=id=>itemCraftActions(db.patch,[id]).at(-1),ledger=ps=>{const v=matchGoldLedger(ps);check(v.held>=0&&near(v.earned,v.items+v.wards+v.held),'money not conserved');return v};
 const cash=make();cash.itemActions=[action('1001')];cash.itemActions[0].threshold=99999;
 advanceItemPurchases(cash);check(cash.items[0]==='1001'&&cash.gold===200&&cash.itemSpent===300,'writer ignored actual cash or added500 gate');ledger(cash);
 const no=make();for(const bad of [{...action('3008')}, {...action('1001'),cost:1}, {...action('1001'),consume:['missing']}, {...action('1001'),id:'missing'}]){
  const before=JSON.stringify(no);check(!applyItemCraftAction(no,bad)&&JSON.stringify(no)===before,'invalid craft changed cash/inventory/quest');
 }
 no.gold=299;const before=JSON.stringify(no);check(!applyItemCraftAction(no,action('1001'))&&JSON.stringify(no)===before,'unaffordable craft changed state');
 const repeats=make();addGold(repeats,200);check(applyItemCraftAction(repeats,action('1036'))&&applyItemCraftAction(repeats,action('1036'))&&repeats.items.length===2&&repeats.gold===0,'legitimate repeated components rejected');ledger(repeats);
 const final=make();addGold(final,20000);final.itemActions=itemCraftActions(db.patch,['3072']);advanceItemPurchases(final);
 check(final.items.includes('3072'),'recipe ingredients stalled');const dup=JSON.stringify(final);check(!applyItemCraftAction(final,action('3072'))&&JSON.stringify(final)===dup,'duplicate final writer accepted');
 const boot=make();boot.champ={...boot.champ,name:'Cassiopeia'};check(!applyItemCraftAction(boot,action('1001')),'champion boot writer restriction omitted');
 const full=make();full.items=['3008','3156','3072','3087','1036','1033'];full.gold=549;full.goldEarned=549;
 full.itemActions=[action('1036'),action('3155')];const frozen=JSON.stringify(full);advanceItemPurchases(full);
 check(JSON.stringify(full)===frozen,'unaffordable six-slot preview partially committed');
 addGold(full,1);check(full.itemActionIndex===2&&full.items.length===5&&full.items.includes('3155')&&full.gold===0&&full.itemSpent===550,'six-slot exact repeated ingredient combine failed');ledger(full);
 const done=JSON.stringify(full);addGold(full,0);check(JSON.stringify(full)===done,'duplicate advance changed state');
 for(const role of ['MID','ADC']){
  const ps=make(role);ps.quest=createRoleQuest(db.patch,role);ps.quest.completed=true;ps.itemPlan=['3008'];ps.itemActions=itemCraftActions(db.patch,ps.itemPlan);
  advanceItemPurchases(ps);check(ps.items.includes('1001')&&!ps.questBoots&&ps.itemActionIndex===1,'quest consumed unfinished recipe');
  addGold(ps,500);check(ps.itemActionIndex===2&&ps.itemSpent===1000&&ps.gold===0,'quest purchase double charged/stalled');
  check(role==='ADC'?ps.questBoots==='3008'&&!ps.items.includes('3008'):ps.items.includes(roleQuestBootUpgrade(db.patch,'3008')),'actual free quest equipment lost');ledger(ps);
 }
 const sup=make('SUP');sup.quest=createRoleQuest(db.patch,'SUP');sup.quest.completed=true;
 const price=sup.quest.rules.controlWardCost;sup.gold=price-1;sup.goldEarned=price-1;const st={t:20,sides:[{team:a}]};
 const wardBefore=JSON.stringify(sup);check(roleQuestWard(st,sup)===0&&JSON.stringify(sup)===wardBefore,'ward used stale virtual bank');
 addGold(sup,1);check(roleQuestWard(st,sup)>0&&sup.gold===0&&sup.questWardSpent===price,'ward bank not debited');ledger(sup);
 const paid=JSON.stringify(sup);check(roleQuestWard(st,sup)===0&&JSON.stringify(sup)===paid,'same-time ward paid twice');
 const cache=make(),combat={t:12,patch:db.patch,sides:[{soul:false,baronUntil:0,elderUntil:0}]};
 const old=combatStats(combat,cache).off;check(applyItemCraftAction(cache,action('1036')),'cache fixture buy');
 check(combatStats(combat,cache).off!==old&&combatStats(combat,cache).off===combatStats0(combat,cache).off,'same-earned inventory cache stale');ledger(cache);
 const saved=packDB(db),signature=r=>JSON.stringify({winner:r.winner,duration:r.duration,ending:r.ending,gold:r.goldHist,ps:r.sides.map(s=>s.ps.map(p=>({k:p.k,d:p.d,a:p.a,xp:p.xp,lvl:p.lvl,dmg:p.dmg,items:matchQuestItems(p),ledger:matchGoldLedger(p),quest:p.quest})))});
 let paidActions=0;const commit=commitItemCraftBatch;
 commitItemCraftBatch=(ps,actions,next)=>{const gold=ps.gold,spent=ps.itemSpent||0,cost=actions.reduce((s,a)=>s+a.cost,0),ok=commit(ps,actions,next);if(ok){paidActions+=actions.length;check(near(gold-ps.gold,cost)&&near(ps.itemSpent-spent,cost),'actual simulated batch cost mismatch');ledger(ps)}return ok};
 for(const seed of ['record-official','ledger-side-1'])for(const ids of [[a.id,b.id],[b.id,a.id]]){
  const r=simulateMatch(db,...ids,seed,null,false),q=simulateMatch(db,...ids,seed,null,true);
  check(signature(r)===signature(q),'quiet/logger changed actual purchase result');r.sides.forEach(s=>s.ps.forEach(ledger));
 }
 commitItemCraftBatch=commit;check(paidActions>100&&packDB(db)===saved,'real purchase coverage or world purity');
 const sess=createSeriesSession(db,a.id,b.id,1,'record-official',{compId:'ledger'});playSeriesSessionGame(db,sess,null,false);
 const rec=seriesSessionResult(db,sess).rec,g=rec.games[0],pub=recordedPublicMatch(db,rec,g).record;
 check(pub?.resources&&recordedGoldLedgerValid(pub),'official ledger writer/read');
 for(const row of pub.sides.flatMap(s=>s.players)){const p=pub.resources.players[row[0]];check(near(p.earned,p.items+p.wards+p.held),'public money conservation')}
 const html=renderPublicMatchReview(db,rec,g,{});check(html.includes('종료 당시 골드 사용')&&html.includes('미사용')&&!html.includes('<th>아이템'),'source UI missing or item column restored');
 const bad=JSON.parse(JSON.stringify(g));bad.publicRecord.resources.players[player.id].held+=1;check(recordedPublicMatch(db,rec,bad).reason==='unverified-source','forged public ledger accepted');
 const legacy=JSON.parse(JSON.stringify(g));delete legacy.publicRecord.resources;check(recordedPublicMatch(db,rec,legacy).record&&renderPublicMatchReview(db,rec,legacy,{}).includes('저장되지 않았습니다'),'legacy evidence reconstructed/rejected');
 db.world.seasons.ledger={id:'ledger',comp:'ledger',region:'EU',done:true,days:[{date:g.date,matches:[{res:rec}]}]};
 const restored=unpackDB(packDB(db)),lite=restored.world.seasons.ledger.days[0].matches[0].res;
 check(lite.lite&&JSON.stringify(lite.games[0].publicRecord.resources)===JSON.stringify(pub.resources),'lite/save ledger loss');
 const practice={...rec,practiceModel:true},fired=unpackDB(packDB(db));fired.world.fired=true;
 check(recordedPublicMatch(fired,practice,g).reason==='no-authority','practice ledger permission leak');
 console.log('ITEM_LEDGER_ACCEPTANCE PASS actual cost/cash/conservation, strict recipe/affordability/repeat/final/champion, six-slot atomic/failed preview/idempotence, MID/ADC free equipment, ward/cache,4 paired matches/'+paidActions+' actual actions, official UI/source/lite/legacy/privacy');
})()`,{timeout:60000,setupSources:[await artifactSource('ui-match-history.js'),await artifactSource('ui-takedown-history.js')]});
