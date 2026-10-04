import {runEngineFixture} from './test-harness.mjs';
import {pathToFileURL} from 'node:url';

export async function runSystemPatchExperiments({seeds=8}={}){
  if(!Number.isInteger(seeds)||seeds<2||seeds>64)throw Error('Patch experiment seeds must be 2..64');
  return runEngineFixture(String.raw`(()=>{
    const check=(v,m)=>{if(!v)throw Error('SYSTEM_PATCH '+m)},near=(a,b)=>Math.abs(a-b)<1e-8;
    const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:10,div2:false})];cfg.internationals=[];
    const db=buildWorld(cfg),teams=activeTeams(db,null,1),[a,b]=teams;
    startCareer(db,a.id,'controlled-systems');autoBuildInitialSquad(db,a,new RNG('controlled-systems','squad'),5);finalizeInitialRosters(db);
    const first=simulateMatch(db,a.id,b.id,'system-forced-draft',null,true),forced={bans:first.draft.bans,picks:first.draft.picks};
    const cid=forced.picks[0].TOP,c=db.patch.champions[cid],p=starterFor(db,a,'TOP'),
      build=selectItemBuild(db.patch,c,p,'TOP'),itemId=build.find(id=>db.patch.itemDefs[id].tier==='final'),
      runeId=selectRunePage(db.patch,c,p,'TOP')[0];
    check(itemId&&runeId,'missing target build/rune');
    const item=db.patch.itemDefs[itemId],rune=db.patch.runeDefs[runeId],
      oldOff=item.effects.offense||0,oldRune=rune.effects.offense||0,
      itemBuff={type:'item',id:itemId,field:'offense',new:oldOff+.05},
      costCut={type:'item',id:itemId,field:'cost',new:Math.max(500,item.cost-300)},
      runeBuff={type:'rune',id:runeId,field:'offense',new:oldRune+.05},
      inverses=[{...itemBuff,new:oldOff},{...costCut,new:item.cost},{...runeBuff,new:oldRune}];
    // A missing legacy recipeCost must fall back to the old total, not the
    // updated total plus the price delta a second time.
    const legacy=JSON.parse(JSON.stringify(db.patch));delete legacy.itemDefs[itemId].recipeCost;
    applyNote(legacy,costCut);check(legacy.itemDefs[itemId].recipeCost===costCut.new,'legacy price change counted twice');
    applyNote(legacy,{...costCut,new:item.cost});check(legacy.itemDefs[itemId].recipeCost===item.cost,'legacy price rollback drift');
    let inventoryCases=0;
    for(const champion of Object.values(db.patch.champions))for(const role of champion.roles){
      const ps=newPS(p,0,role,champion.id,db.patch);
      for(const action of ps.itemActions){addGold(ps,Math.max(0,action.threshold-ps.goldEarned));
        check(ps.items.length<=6,'inventory overflow '+champion.id);inventoryCases++}
      check(ps.itemActionIndex===ps.itemActions.length&&
        JSON.stringify(ps.items.slice().sort())===JSON.stringify(ps.itemPlan.slice().sort()),
        'full affordable build stalled or lost ingredients '+champion.id);
    }
    const limited={items:['one','two','three','four','five','a'],gold:0,goldEarned:0,itemActionIndex:0,patchRef:{itemDefs:{b:{cost:1000,recipeCost:1000,from:[]},six:{cost:1500,recipeCost:500,from:['a','b']}}},
      itemActions:[{id:'b',cost:1000,consume:[],threshold:1000},{id:'six',cost:500,consume:['a','b'],threshold:1500}]};
    addGold(limited,1000);check(limited.itemActionIndex===0&&limited.items.length===6,'seventh ingredient bought before combine affordable');
    addGold(limited,499);check(limited.itemActionIndex===0,'combined purchase advanced before threshold');
    addGold(limited,1);check(limited.itemActionIndex===2&&limited.items.length===6&&limited.items.includes('six')&&
      !limited.items.includes('a')&&!limited.items.includes('b'),'affordable atomic combine failed');
    const limitedBefore=JSON.stringify(limited);addGold(limited,0);
    check(JSON.stringify(limited)===limitedBefore,'repeat income duplicated equipment');
    const raw=packDB(db),playerState=JSON.stringify(db.players),notes={control:[],item:[itemBuff],cost:[costCut],
      rune:[runeBuff],combined:[itemBuff,costCut,runeBuff],rollback:[itemBuff,costCut,runeBuff,...inverses]};
    const digest=m=>({winnerTeam:m.sides[m.winner].team.id,duration:m.duration,goldHist:m.goldHist,
      damage:m.sides.map(s=>s.ps.reduce((n,p)=>n+p.dmg,0)),
      builds:m.sides.map(s=>s.ps.map(p=>({pid:p.p.id,champ:p.champ.id,items:p.items.slice(),runes:p.runes.slice()})))});
    const summarize=rows=>({games:rows.length,winsA:rows.filter(r=>r.winnerTeam===a.id).length,
      meanDuration:avg(rows.map(r=>r.duration)),meanDamage:avg(rows.map(r=>r.damage[0]+r.damage[1]))});
    const run=(world,adaptive=false)=>{
      const rows=[];
      for(let i=0;i<${seeds};i++)for(const reverse of [false,true]){
        const teamIds=reverse?[b.id,a.id]:[a.id,b.id],ctx=adaptive?null:{forced:reverse?
          {bans:[forced.bans[1],forced.bans[0]],picks:[forced.picks[1],forced.picks[0]]}:forced};
        const m=simulateMatch(world,...teamIds,'system-pair-'+i,ctx,true);
        check(m.sides.every(s=>s.ps.every(p=>Number.isFinite(p.dmg)&&p.items.length<=6&&p.runes.length===6)),
          'invalid equipment or match stats');
        if(!adaptive)check(JSON.stringify(m.draft.picks)===JSON.stringify(ctx.forced.picks),'fixed draft changed');
        rows.push(digest(m));
      }
      return rows;
    };
    // Inspect the real match at its first income tick, rather than only newPS.
    const income=incomeTick;let starterChecks=0;
    incomeTick=st=>{if(st.t===1)for(const s of st.sides)for(const ps of s.ps){
      check(!ps.starterItem||ps.items.includes(ps.starterItem),'paid starter missing at match start');starterChecks++;
    }return income(st)};
    const baseline=run(db);incomeTick=income;
    check(starterChecks===${seeds}*20,'actual first-tick starter coverage');
    const baselineText=JSON.stringify(baseline),adaptiveBaseline=run(db,true),results=[];
    for(const [name,changes] of Object.entries(notes)){
      const world=unpackDB(raw),champ=world.patch.champions[cid],target=world.players[p.id];
      const warm=championSystemMetaProfile(world.patch,champ),warmStrength=champStrength(champ,world.patch),
        warmPool=draftPoolSnapshot(world),warmBuild=selectItemBuild(world.patch,champ,target,'TOP'),
        warmRunes=selectRunePage(world.patch,champ,target,'TOP');
      for(const n of changes)applyNote(world.patch,n);
      const profile=championSystemMetaProfile(world.patch,champ),pool=draftPoolSnapshot(world),
        cold=JSON.parse(JSON.stringify(world.patch));
      check(JSON.stringify(profile)===JSON.stringify(championSystemMetaProfile(cold,cold.champions[cid])),name+' stale system profile');
      check(near(champStrength(champ,world.patch),champStrength(cold.champions[cid],cold)),name+' stale strength');
      check(JSON.stringify(selectItemBuild(world.patch,champ,target,'TOP'))===JSON.stringify(selectItemBuild(cold,cold.champions[cid],target,'TOP')),
        name+' stale item selector');
      check(JSON.stringify(selectRunePage(world.patch,champ,target,'TOP'))===JSON.stringify(selectRunePage(cold,cold.champions[cid],target,'TOP')),
        name+' stale rune selector');
      if(changes.length)check(pool!==warmPool,name+' stale draft pool');
      const before=packDB(world),rows=run(world),metrics=summarize(rows),
        changed=rows.filter((r,i)=>JSON.stringify(r)!==JSON.stringify(baseline[i])).length;
      check(packDB(world)===before&&JSON.stringify(world.players)===playerState,name+' mutated career players or state');
      if(['control','rollback'].includes(name))check(JSON.stringify(rows)===baselineText,name+' failed exact paired control');
      else check(changed>0,name+' actual matches ignored patch');
      const saved=unpackDB(packDB(world));
      check(JSON.stringify(run(saved))===JSON.stringify(rows),name+' save restored different match trajectory');
      const adapted=run(world,true),draftChanges=adapted.filter((r,i)=>
        JSON.stringify(r.builds.map(s=>s.map(p=>p.champ)))!==JSON.stringify(adaptiveBaseline[i].builds.map(s=>s.map(p=>p.champ)))).length;
      results.push({name,notes:changes,metrics,changedGames:changed,adaptiveDraftChanges:draftChanges,
        systemPowerDelta:profile.power-warm.power,strengthDelta:champStrength(champ,world.patch)-warmStrength,
        selectedBuild:selectItemBuild(world.patch,champ,target,'TOP'),selectedRunes:selectRunePage(world.patch,champ,target,'TOP'),
        priorBuild:warmBuild,priorRunes:warmRunes});
      // Feed actual completed matches into the ordinary public meta evidence.
      const m=simulateMatch(world,a.id,b.id,'system-meta-'+name,{forced},true);recordMeta(world,m);
      const evidence=systemUsageEvidence(world,'rune',runeId,world.metaHistory);
      check(world.metaHistory.length===1&&evidence.uses>0,name+' actual rune evidence missing');
    }
    check(packDB(db)===raw,'baseline career changed');
    return {seeds:${seeds},sideOrders:2,fixedDraft:true,starterChecks,inventoryCases,champion:cid,itemId,runeId,
      baseline:summarize(baseline),experiments:results,
      interpretation:'paired causal fixtures; adaptive draft changes may be zero; not a season balance or win-rate estimate'};
  })()`,{filename:'system-patch-experiments.vm.js',timeout:120000});
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const report=await runSystemPatchExperiments({seeds:Number(process.env.LOL_GM_PATCH_SEEDS||8)});
  console.log('SYSTEM_PATCH_EXPERIMENTS '+JSON.stringify(report));
}
