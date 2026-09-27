// ===== LOL GM: 밴픽 / 시스템 메타 엔진 =====
// 경기 시뮬레이션과 분리된 챔피언 평가, 자동 아이템·룬 환경, 밴픽 의사결정 도메인.

// 포지션별 주전은 Depth Chart에 고정한다. 지정 선수가 이탈한 경우에만 자동 보충한다.
function starterFor(db,team,role){
  if(!team)return null;team.depthChart=team.depthChart||{};
  const id=team.depthChart[role],fixed=id&&db.players[id];
  if(fixed&&fixed.team===team.id&&(team.roster||[]).includes(id)&&fixed.role===role)return fixed;
  let best=null,bo=-1;for(const pid of team.roster||[]){const p=db.players[pid];if(!p||p.role!==role)continue;const o=playerOvr(p);if(o>bo){bo=o;best=p}}
  if(best)team.depthChart[role]=best.id;else delete team.depthChart[role];
  return best;
}

const SYSTEM_META_CACHE=new WeakMap();
const SYSTEM_CHOICE_CACHE=new WeakMap();
const CHAMP_STRENGTH_CACHE=new WeakMap();
const DRAFT_EVAL_CACHE=new WeakMap();
const DRAFT_NOISE_CACHE=new WeakMap();
function revisionBucket(store,key,revision){
  let b=store.get(key);if(!b||b.revision!==revision){b={revision,values:new Map()};store.set(key,b)}return b.values;
}
function draftPatchRevisionKey(patch){return (patch?.id||'')+':'+(patch?._revision||0)+':'+(patch?._systemRevision||0)}
function draftNoiseBucket(db){
  const revision=draftPatchRevisionKey(db.patch);let b=DRAFT_NOISE_CACHE.get(db);
  if(!b||b.revision!==revision){b={revision,values:new Map()};DRAFT_NOISE_CACHE.set(db,b)}return b.values;
}
function buildDraftPoolSnapshot(db,ctx){
  const champs=Object.values(db.patch.champions).filter(c=>championAvailableForContext(db,c,ctx));
  const strengths={};champs.forEach(c=>strengths[c.id]=champStrength(c,db.patch));
  const vals=Object.values(strengths),mn=Math.min(...vals),mx=Math.max(...vals),byRole={};
  ROLES.forEach(r=>byRole[r]=champs.filter(c=>c.roles.includes(r)));
  return {champs,strengths,mn,mx,byRole};
}
function draftPoolSnapshot(db,ctx={}){
  const revision=draftPatchRevisionKey(db.patch)+':'+(db.worldDate||'');
  let b=DRAFT_EVAL_CACHE.get(db);if(!b||b.revision!==revision){b={revision,defaults:{},pools:new WeakMap()};DRAFT_EVAL_CACHE.set(db,b)}
  const mode=ctx.practice?'practice':'official';
  if(Array.isArray(ctx.championPool)){
    let p=b.pools.get(ctx.championPool);if(!p){p={};b.pools.set(ctx.championPool,p)}
    return p[mode]||(p[mode]=buildDraftPoolSnapshot(db,ctx));
  }
  return b.defaults[mode]||(b.defaults[mode]=buildDraftPoolSnapshot(db,ctx));
}

// ---------- 챔피언 평가 (패치 원수치 기반) ----------
function championSkillProfile(c){
  const ss=Object.values(c.skills||{}),n=Math.max(1,ss.length),effects=ss.flatMap(s=>s.effects||[]);
  const structured=ss.filter(s=>(s.baseDamage&&s.baseDamage.length)||Object.keys(s.ratios||{}).length||s.cc||s.heal||s.shield);
  const avgNum=(arr,def=0)=>{const v=(arr||[]).map(Number).filter(Number.isFinite);return v.length?avg(v):def};
  const dmg=structured.reduce((z,s)=>z+avgNum(s.baseDamage)/500,0)/n,ratio=structured.reduce((z,s)=>z+Object.values(s.ratios||{}).reduce((a,b)=>a+(Number(b)||0),0),0)/n;
  const dmgMod=avg(ss.map(s=>s.damageMod??1)),utilityMod=avg(ss.map(s=>s.utilityMod??1)),ccMod=avg(ss.map(s=>s.ccMod??1)),mobilityMod=avg(ss.map(s=>s.mobilityMod??1));
  const healMod=avg(ss.map(s=>s.healMod??1)),shieldMod=avg(ss.map(s=>s.shieldMod??1));
  const cds=ss.map(s=>Number(s.cooldown)).filter(x=>Number.isFinite(x)&&x>0),ranges=ss.flatMap(s=>(s.range||[]).map(Number)).filter(x=>Number.isFinite(x)&&x>=100&&x<5000),costs=ss.flatMap(s=>(s.cost||[]).map(Number)).filter(x=>Number.isFinite(x)&&x>0);
  const uptime=clamp(cds.reduce((z,x)=>z+1/x,0)*2.2,0,1.25),reach=clamp((avgNum(ranges,450)-300)/900,0,1),economy=costs.length?clamp(1-avgNum(costs)/230,.62,1):1;
  const ccStructured=structured.reduce((z,s)=>z+(s.cc?(s.cc.duration||1):0),0)/n,utilStructured=structured.filter(s=>s.heal||s.shield).length/n;
  return {
    power:clamp((ss.reduce((z,s)=>z+(s.power||0),0)/n/10+dmg*.18+ratio*.08)*dmgMod,0,1.7),
    uptime:clamp(uptime*(2-dmgMod*.15),0,1.35),
    cc:clamp((effects.filter(x=>x==='cc'||x==='engage').length/n+ccStructured*.5)*ccMod,0,1.7),
    utility:clamp((effects.filter(x=>['shield','sustain','utility','mobility','poke'].includes(x)).length/n+utilStructured*.5)*utilityMod*((healMod+shieldMod)/2),0,1.7),
    reach, economy, mobility:clamp((effects.filter(x=>x==='mobility').length/n+.2)*mobilityMod,0,1.4), structured:structured.length/n
  };
}
function championSystemMetaProfile(patch,c){
  if(!patch||!patch.itemDefs||!patch.runeDefs)return {power:0,roles:{}};
  const cache=revisionBucket(SYSTEM_META_CACHE,patch,draftPatchRevisionKey(patch));if(cache.has(c.id))return cache.get(c.id);
  const roles=(c.roles&&c.roles.length?c.roles:['MID']),vals=[],byRole={};
  for(const role of roles){
    const pseudo={id:'meta:'+c.id+':'+role},items=selectItemBuild(patch,c,pseudo,role),runes=selectRunePage(patch,c,pseudo,role);
    const ie=systemEffects(patch.itemDefs,items),re=systemEffects(patch.runeDefs,runes),all={};
    for(const k of (typeof SYSTEM_EFFECT_KEYS!=='undefined'?SYSTEM_EFFECT_KEYS:['offense','defense','sustain','utility','haste','mobility','early','scaling']))all[k]=(ie[k]||0)+(re[k]||0);
    const fit=systemChoiceScore(c,all,role),cost=items.length?avg(items.map(id=>patch.itemDefs[id]?.cost||3000)):3000,tempo=clamp((3300-cost)/2600,-.18,.22);
    byRole[role]={fit,cost,items,runes,power:fit*.085+tempo*.025};vals.push(byRole[role].power);
  }
  const result={power:avg(vals),roles:byRole};cache.set(c.id,result);return result;
}
function champStrength(c,patch){
  if(patch){const cache=revisionBucket(CHAMP_STRENGTH_CACHE,patch,patch._revision||0);if(cache.has(c.id))return cache.get(c.id);const v=champStrengthUncached(c,patch);cache.set(c.id,v);return v}
  return champStrengthUncached(c,null);
}
function champStrengthUncached(c,patch){
  const k=c.kit,b=c.base,sp=championSkillProfile(c),sys=championSystemMetaProfile(patch,c);
  const stat=(b.hp+b.hpg*10)/1800*.21+(b.ad+b.adg*10)/110*.21+(b.arm+b.armg*10)/85*.11+((b.mr||30)+(b.mrg||1.3)*10)/60*.07+(b.ms-320)/40*.04+((b.as||.65)*(1+(b.asg||2)*.1))*.04+(b.range-125)/525*.018;
  const kitv=(k.early+k.mid+k.late)/30*.27+(k.burst+k.dps)/20*.16+(k.cc+k.engage+k.peel)/30*.11-k.difficulty/10*.04;
  return stat+kitv+sp.power*.06+sp.uptime*.04+sp.cc*.025+sp.utility*.025+sp.reach*.022+sp.mobility*.012+sp.economy*.012+sys.power;
}

// ---------- 밴픽 ----------
// 진영·픽 순서 균형 계수 (블루/레드, 선픽/후픽 승률을 50%에 맞추도록 튜닝)
const BAL={blue:0.025,counter:0.1,first:0.013};
const DRAFT_ORDER=[['B',0],['B',1],['B',0],['B',1],['B',0],['B',1],['P',0],['P',1],['P',1],['P',0],['P',0],['P',1],['B',1],['B',0],['B',1],['B',0],['P',1],['P',0],['P',0],['P',1]];
function runDraft(db, teamIds, rng, ctx){
  ctx=ctx||{used:[],byTeam:{}};
  if(ctx.forced){const f=ctx.forced;return {bans:f.bans,picks:f.picks,log:[],expl:[{t:0,title:'기록된 밴픽 재현',factors:[],result:''}]}}
  const evalBase=draftPoolSnapshot(db,ctx),{champs,strengths,mn,mx,byRole}=evalBase;
  // 팀별 메타 인식값 V_hat = 패치 직후의 사전 추정(분석력에 따라 오차) + 대회 데이터 관찰(표본이 쌓일수록 비중 증가)
  const MS=db.metaStats||{}, G=db.metaGames||0, RMS=db.regionMetaStats||{}, RMG=db.regionMetaGames||{};
  const vhat=teamIds.map(tid=>{const team=db.teams[tid],rid=team.region,an=Math.min(1,team.coach.analysis/100+scrimAnalysisBonus(team)); const m={};
    const nk=tid+'|'+an,noiseCache=draftNoiseBucket(db);let NZ=noiseCache.get(nk);if(!NZ){NZ={};noiseCache.set(nk,NZ)}
    champs.forEach(c=>{if(NZ[c.id]===undefined)NZ[c.id]=((hashStr(tid+db.patch.id+c.id)%2000)/1000-1)*0.35*(1.1-an);const noise=NZ[c.id];
      let v=clamp((strengths[c.id]-mn)/(mx-mn||1)+noise,0,1);
      const gst=MS[c.id],rst=(RMS[rid]||{})[c.id],rg=RMG[rid]||0,know=((team.metaKnowledge||{})[c.id]||0),counter=((team.metaCounter||{})[c.id]||0);
      const observe=(base,st,g,weight)=>{if(!st||!g)return base;const n=st.p+st.b,w=n/(n+18*(1.35-an)),wr=(st.w+2)/(st.p+4),obs=clamp(0.5+(wr-0.5)*2.2+(n/g)*0.5-0.1,0,1);return base*(1-w*weight)+obs*w*weight};
      v=observe(v,gst,G,.45);v=observe(v,rst,rg,.75);const prePro=c.proEligibleDate&&!championProEligible(db,c),uncertainty=prePro?(know-.5)*.12:0;v=clamp(v+know*.08-counter*.035+uncertainty,0,1);
      m[c.id]=v}); return m});
  const roster=teamIds.map(tid=>{const r={}; ROLES.forEach(role=>r[role]=starterFor(db,db.teams[tid],role)); return r});
  const taken=new Set(ctx.fearless?ctx.used:[]), bans=[[],[]], picks=[{},{}], expl=[];
  const mastery=(p,c)=>p.pool[c]?p.pool[c].mastery:25;
  const tacs=teamIds.map(t=>db.teams[t].tactics);
  function pickValue(side,role,c,mine){
    const p=roster[side][role], ch=db.patch.champions[c], t=tacs[side];
    let comp=0;
    const maxEng=mine.reduce((m,x)=>Math.max(m,x.kit.engage),0); if(maxEng<7) comp+=ch.kit.engage/10*0.5;
    if(!mine.some(x=>x.cls==='tank')&&ch.cls==='tank') comp+=0.35;
    if(mine.length>=2){const ap=mine.filter(x=>x.dmg==='AP').length, ad=mine.length-ap; if(ap===0&&ch.dmg==='AP')comp+=0.3; if(ad===0&&ch.dmg==='AD')comp+=0.3;}
    const scal=(t.scaling_preference-50)/50; comp+=scal*(ch.kit.late-ch.kit.early)/10*0.4;
    const enemy=picks[1-side][role]; let counter=0;
    if(enemy){const e=db.patch.champions[enemy]; counter=((ch.kit.early-e.kit.early)+(ch.kit.poke-e.kit.poke)*0.5)/10*0.5;}
    const flex=ch.roles.length>1?0.04:0;
    const hist=ctx.byTeam[teamIds[side]]||{won:[],lost:[]};
    const series=(hist.won.includes(c)?0.03:0)-(hist.lost.includes(c)?0.06:0);
    const f={meta:vhat[side][c]*0.35, mastery:mastery(p,c)/100*0.5, comp:comp*0.15, counter:counter*BAL.counter, flex, series};
    f.total=f.meta+f.mastery+f.comp+f.counter+f.flex+f.series; return f;
  }
  // 후보 압축: 메타 인식 + 숙련도 상위 챔피언만 정밀 평가
  const SL={};
  function shortlist(side,r){const k=side+r;if(SL[k])return SL[k].filter(c=>!taken.has(c.id)).slice(0,10);
    const p=roster[side][r];SL[k]=byRole[r].map(c=>({c,q:vhat[side][c.id]*0.35+mastery(p,c.id)/200})).sort((a,b)=>b.q-a.q).map(x=>x.c);return SL[k].filter(c=>!taken.has(c.id)).slice(0,10)}
  const log=[];
  const fp=ctx.firstPick||0; // 선픽 팀(진영과 별개)
  for(const [kind,ord] of DRAFT_ORDER){ const side=ord===0?fp:1-fp;
    const tn=db.teams[teamIds[side]], noise=0.08*(1.1-tn.coach.draft/100);
    if(kind==='P'){
      const open=ROLES.filter(r=>!picks[side][r]), mine=Object.values(picks[side]).map(n=>db.patch.champions[n]); let best=null;
      for(const r of open) for(const c of shortlist(side,r)){ if(taken.has(c.id)) continue;
        const f=pickValue(side,r,c.id,mine); const v=f.total+(rng.next()-0.5)*noise*3.46; if(!best||v>best.v) best={v,r,c:c.id,f}; }
      if(!best){ const r=open[0], c=champs.find(x=>!taken.has(x.id)); best={v:0,r,c:c.id,f:{total:0}}; }
      picks[side][best.r]=best.c; taken.add(best.c);
      log.push({kind,side,champ:best.c,role:best.r,player:roster[side][best.r].name});
      expl.push({t:0,title:`${tn.short} 픽: ${championLabel(db,best.c)} (${ROLE_KO[best.r]})`,factors:[['메타 인식',best.f.meta],['숙련도',best.f.mastery],['조합',best.f.comp],['상성',best.f.counter],['유연성',best.f.flex],['시리즈 경험',best.f.series||0]],utility:best.v,result:'PICK'});
    } else {
      const opp=1-side, open=ROLES.filter(r=>!picks[opp][r]), mine=Object.values(picks[opp]).map(n=>db.patch.champions[n]); let best=null;
      const avail={};ROLES.forEach(R=>avail[R]=byRole[R].filter(x=>!taken.has(x.id)).length);
      const need={};ROLES.forEach(R=>need[R]=[0,1].filter(i=>!picks[i][R]).length);
      const safe=c=>c.roles.every(R=>avail[R]-1>=need[R]+1);
      const oh=ctx.byTeam[teamIds[opp]];
      for(const r of open) for(const c of shortlist(opp,r)){ if(taken.has(c.id)||!safe(c)) continue;
        const f=pickValue(opp,r,c.id,mine); f.reveal=oh&&oh.won.includes(c.id)?0.12:0; const v=f.total+f.reveal+(rng.next()-0.5)*noise*3.46; if(!best||v>best.v) best={v,r,c:c.id,f}; }
      if(!best) continue;
      bans[side].push(best.c); taken.add(best.c);
      log.push({kind,side,champ:best.c,role:best.r,player:roster[opp][best.r].name});
      expl.push({t:0,title:`${tn.short} 밴: ${championLabel(db,best.c)} (상대 ${ROLE_KO[best.r]} ${roster[opp][best.r].name} 견제)`,factors:[['상대 픽 가치',best.f.total],['이전 세트 활약',best.f.reveal]],utility:best.v,result:'BAN'});
    }
  }
  return {bans,picks,log,expl};
}

function systemEffects(defs,ids){
  const out=Object.fromEntries((typeof SYSTEM_EFFECT_KEYS!=='undefined'?SYSTEM_EFFECT_KEYS:['offense','defense','sustain','utility','haste','mobility','early','scaling']).map(k=>[k,0]));
  for(const id of ids||[]){const d=defs&&defs[id];if(!d||d.active===false)continue;for(const k in out)out[k]+=Number(d.effects&&d.effects[k])||0}
  return out;
}
function systemChoiceScore(c,e,role){
  const k=c.kit||{},front=['fighter','tank'].includes(c.cls),support=role==='SUP'||c.cls==='enchanter';
  return (e.offense||0)*(.8+(k.burst+k.dps)/16)+(e.defense||0)*(front?1.35:.75)+(e.sustain||0)*(.7+(k.sustain||5)/8)+(e.utility||0)*(support?1.5:.7)+(e.haste||0)*(.8+(k.cc+k.poke)/18)+(e.mobility||0)*(.75+(k.mobility||5)/8)+(e.early||0)*(.65+(k.early||5)/8)+(e.scaling||0)*(.65+(k.late||5)/8);
}
function systemChoiceBase(patch,c,role){
  const cache=revisionBucket(SYSTEM_CHOICE_CACHE,patch,draftPatchRevisionKey(patch)),key=c.id+'|'+role;if(cache.has(key))return cache.get(key);
  const items=(patch.items&&patch.items[c.cls]||[]).filter(id=>patch.itemDefs&&patch.itemDefs[id]&&patch.itemDefs[id].active!==false&&patch.itemDefs[id].shopActive!==false).map(id=>{const d=patch.itemDefs[id];return {id,tier:d.tier,fit:systemChoiceScore(c,d.effects||{},role),cost:d.cost||3000}});
  const roleFit=d=>{const t=new Set(d.tags||[]);if(role==='JGL')return t.has('Jungle')?.12:-.1;if(t.has('Jungle'))return -.18;if(role==='SUP'&&(t.has('GoldPer')||t.has('Vision')))return .08;return 0};
  const starters=Object.values(patch.itemDefs||{}).filter(d=>d.active!==false&&d.shopActive!==false&&d.tier==='starter'&&(!d.requiredChampion||d.requiredChampion===c.name)).map(d=>({id:d.id,fit:systemChoiceScore(c,d.effects||{},role),roleFit:roleFit(d),cost:d.cost||450}));
  const runes={};for(const d of Object.values(patch.runeDefs||{}))if(d.active!==false)runes[d.id]=systemChoiceScore(c,d.effects||{},role);
  const out={items,starters,runes};cache.set(key,out);return out;
}
function selectItemBuild(patch,c,p,role){
  const ranked=systemChoiceBase(patch,c,role).items.map(x=>{const noise=((hashStr((p&&p.id||'')+'|'+c.id+'|'+role+'|'+x.id)%1000)/1000-.5)*.012;return {id:x.id,tier:x.tier,s:x.fit+noise-x.cost/140000+(x.tier==='boots'?.006:0)}}).sort((x,y)=>y.s-x.s);
  const out=[];let boots=false;for(const x of ranked){if(x.tier==='boots'&&boots)continue;out.push(x.id);if(x.tier==='boots')boots=true;if(out.length>=6)break}return out;
}
function selectStarterItem(patch,c,p,role){
  const rows=systemChoiceBase(patch,c,role).starters.map(d=>({id:d.id,s:d.fit+d.roleFit+((hashStr((p&&p.id||'')+'|start|'+d.id)%1000)/1000-.5)*.008-d.cost/40000})).sort((a,b)=>b.s-a.s);
  return rows[0]?.id||null;
}
function itemCraftActions(patch,finalBuild){
  const defs=patch.itemDefs||{},actions=[];
  const craft=id=>{const d=defs[id];if(!d||d.active===false||d.shopActive===false)return;for(const from of d.from||[])craft(from);actions.push({id,cost:Math.max(0,Number(d.recipeCost??d.cost??0)),consume:(d.from||[]).slice(),tier:d.tier})};
  for(const id of finalBuild||[])craft(id);
  return actions;
}
function itemPurchasePlan(patch,finalBuild,starterId){
  const actions=itemCraftActions(patch,finalBuild);let spent=starterId&&patch.itemDefs?.[starterId]?patch.itemDefs[starterId].cost||0:0;
  for(const a of actions){spent+=a.cost;a.threshold=500+spent}
  return actions;
}
function runeChoiceScore(patch,c,p,role,id){
  const d=patch.runeDefs&&patch.runeDefs[id];if(!d||d.active===false)return -Infinity;
  const noise=((hashStr((p&&p.id||'')+'|'+c.id+'|'+role+'|rune|'+id)%1000)/1000-.5)*.01;
  return (systemChoiceBase(patch,c,role).runes[id]??systemChoiceScore(c,d.effects||{},role))+noise;
}
function selectRunePage(patch,c,p,role){
  const styles=Object.values(patch.runes||{}).filter(s=>s&&Array.isArray(s.slots)&&s.slots.length>=4);
  if(styles.length<2)return [];
  const bestIn=(style,slot)=>((style.slots&&style.slots[slot])||[]).filter(id=>patch.runeDefs?.[id]?.active!==false).map(id=>({id,s:runeChoiceScore(patch,c,p,role,id),slot})).sort((x,y)=>y.s-x.s)[0]||null;
  const ranked=styles.map(style=>{const picks=[0,1,2,3].map(slot=>bestIn(style,slot));return {style,picks,score:picks.every(Boolean)?picks.reduce((z,x)=>z+x.s,0):-Infinity}}).filter(x=>Number.isFinite(x.score)).sort((x,y)=>y.score-x.score);
  const primary=ranked[0];if(!primary)return [];
  const secondary=ranked.slice(1).map(x=>{const picks=[1,2,3].map(slot=>bestIn(x.style,slot)).filter(Boolean).sort((u,v)=>v.s-u.s).slice(0,2);return {style:x.style,picks,score:picks.length===2?picks.reduce((z,y)=>z+y.s,0):-Infinity}}).filter(x=>Number.isFinite(x.score)).sort((x,y)=>y.score-x.score)[0];
  return [...primary.picks.map(x=>x.id),...(secondary?secondary.picks.map(x=>x.id):[])];
}
function applyItemCraftAction(ps,a){
  for(const id of a.consume||[]){const i=ps.items.indexOf(id);if(i>=0)ps.items.splice(i,1)}
  ps.items.push(a.id);
  if(ps.items.length>6){const i=ps.items.findIndex(id=>['starter','consumable'].includes(ps.patchRef?.itemDefs?.[id]?.tier));if(i>=0)ps.items.splice(i,1)}
}
