// ===== LOL GM: 밴픽 / 시스템 메타 엔진 =====
// 경기 시뮬레이션과 분리된 챔피언 평가, 자동 아이템·룬 환경, 밴픽 의사결정 도메인.

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
function createDraftSession(db,teamIds,rng,ctx){
  ctx=ctx||{used:[],byTeam:{}};
  const evalBase=draftPoolSnapshot(db,ctx),{champs,strengths,mn,mx,byRole}=evalBase;
  const MS=db.metaStats||{},G=db.metaGames||0,RMS=db.regionMetaStats||{},RMG=db.regionMetaGames||{};
  const vhat=teamIds.map(tid=>{const team=db.teams[tid],rid=team.region,an=Math.min(1,staffProfile(team).analysis/100+scrimAnalysisBonus(team)),m={};
    const nk=tid+'|'+an,noiseCache=draftNoiseBucket(db);let NZ=noiseCache.get(nk);if(!NZ){NZ={};noiseCache.set(nk,NZ)}
    champs.forEach(c=>{if(NZ[c.id]===undefined)NZ[c.id]=((hashStr(tid+db.patch.id+c.id)%2000)/1000-1)*0.35*(1.1-an);const noise=NZ[c.id];
      let v=clamp((strengths[c.id]-mn)/(mx-mn||1)+noise,0,1);
      const gst=MS[c.id],rst=(RMS[rid]||{})[c.id],rg=RMG[rid]||0,know=((team.metaKnowledge||{})[c.id]||0),counter=((team.metaCounter||{})[c.id]||0);
      const observe=(base,st,g,weight)=>{if(!st||!g)return base;const n=st.p+st.b,w=n/(n+18*(1.35-an)),wr=(st.w+2)/(st.p+4),obs=clamp(0.5+(wr-0.5)*2.2+(n/g)*0.5-0.1,0,1);return base*(1-w*weight)+obs*w*weight};
      v=observe(v,gst,G,.45);v=observe(v,rst,rg,.75);const prePro=c.proEligibleDate&&!championProEligible(db,c),uncertainty=prePro?(know-.5)*.12:0;m[c.id]=clamp(v+know*.08-counter*.035+uncertainty,0,1);
    });return m;
  });
  const roster=teamIds.map(tid=>{const r={};ROLES.forEach(role=>r[role]=starterFor(db,db.teams[tid],role));return r});
  return {db,teamIds,rng,ctx,champs,strengths,mn,mx,byRole,vhat,roster,taken:new Set(ctx.fearless?ctx.used:[]),bans:[[],[]],pickList:[[],[]],expl:[],log:[],tacs:teamIds.map(t=>db.teams[t].tactics),shortlists:{},firstPick:ctx.firstPick||0,cursor:0};
}
function draftTurn(state){
  if(!state||state.cursor>=DRAFT_ORDER.length)return null;
  const [kind,ord]=DRAFT_ORDER[state.cursor],side=ord===0?state.firstPick:1-state.firstPick;
  return {index:state.cursor,kind,side,teamId:state.teamIds[side]};
}
function draftMastery(p,c){return p&&p.pool&&p.pool[c]?p.pool[c].mastery:25}
function draftAssignmentsFor(state,side,extraChamp=null){
  const ids=state.pickList[side].slice();if(extraChamp)ids.push(extraChamp);
  const out=[],used=new Set(),assign={};
  const ordered=ids.slice().sort((a,b)=>{
    const ca=state.db.patch.champions[a],cb=state.db.patch.champions[b];
    return (ca?.roles?.length||99)-(cb?.roles?.length||99)||ids.indexOf(a)-ids.indexOf(b);
  });
  function walk(i){
    if(i>=ordered.length){out.push({...assign});return}
    const id=ordered[i],c=state.db.patch.champions[id];if(!c)return;
    for(const role of c.roles||[]){if(!ROLES.includes(role)||used.has(role))continue;used.add(role);assign[role]=id;walk(i+1);delete assign[role];used.delete(role)}
  }
  walk(0);return out;
}
function draftCanPick(state,side,champ){return state.pickList[side].length<5&&draftAssignmentsFor(state,side,champ).length>0}
function draftRolePossibilities(state,side,role){
  const ids=new Set();for(const a of draftAssignmentsFor(state,side))if(a[role])ids.add(a[role]);return [...ids];
}
function draftFeasibleRoles(state,side,champ){
  const out=new Set();for(const a of draftAssignmentsFor(state,side,champ))for(const role of ROLES)if(a[role]===champ)out.add(role);return [...out];
}
function draftPickValue(state,side,role,c,mine,observerSide=side){
  const p=state.roster[side][role],ch=state.db.patch.champions[c],t=state.tacs[side],masteryObs=draftMasteryObservation(state,observerSide,side,p,c);let comp=0;
  const maxEng=mine.reduce((m,x)=>Math.max(m,x.kit.engage),0);if(maxEng<7)comp+=ch.kit.engage/10*0.5;
  if(!mine.some(x=>x.cls==='tank')&&ch.cls==='tank')comp+=0.35;
  if(mine.length>=2){const ap=mine.filter(x=>x.dmg==='AP').length,ad=mine.length-ap;if(ap===0&&ch.dmg==='AP')comp+=0.3;if(ad===0&&ch.dmg==='AD')comp+=0.3}
  const scal=(t.scaling_preference-50)/50;comp+=scal*(ch.kit.late-ch.kit.early)/10*0.4;
  const enemy=draftRolePossibilities(state,1-side,role).map(id=>state.db.patch.champions[id]).filter(Boolean);
  let counter=0;if(enemy.length)counter=avg(enemy.map(e=>((ch.kit.early-e.kit.early)+(ch.kit.poke-e.kit.poke)*0.5)/10*0.5));
  const flex=ch.roles.length>1?0.04:0,hist=state.ctx.byTeam[state.teamIds[side]]||{won:[],lost:[]},series=(hist.won.includes(c)?0.03:0)-(hist.lost.includes(c)?0.06:0);
  const f={meta:state.vhat[side][c]*0.35,mastery:masteryObs.value/100*0.5,masteryKnowledge:masteryObs.confidence,comp:comp*0.15,counter:counter*BAL.counter,flex,series};f.total=f.meta+f.mastery+f.comp+f.counter+f.flex+f.series;return f;
}
function draftCandidateAnalysis(state,side,champ){
  const c=state.db.patch.champions[champ];if(!c)return null;
  const turn=draftTurn(state),kind=turn?.kind||'P',roles=(kind==='P'?draftFeasibleRoles(state,side,champ):(c.roles||[]).filter(r=>ROLES.includes(r)));
  const out={champ,kind,meta:Math.round(clamp(state.vhat[side]?.[champ]||0,0,1)*100),roles,early:c.kit.early,mid:c.kit.mid,late:c.kit.late};
  if(kind==='P'){
    const mine=state.pickList[side].map(id=>state.db.patch.champions[id]).filter(Boolean);
    out.roleFits=roles.map(role=>{const p=state.roster[side][role],f=draftPickValue(state,side,role,champ,mine);return {role,player:p?.name||null,mastery:Math.round(draftMastery(p,champ)),comp:Math.round((f.comp||0)*100),counter:Math.round((f.counter||0)*100)}}); 
    out.mastery=out.roleFits.length?Math.max(...out.roleFits.map(x=>x.mastery)):0;
    out.comp=out.roleFits.length?Math.round(avg(out.roleFits.map(x=>x.comp))):0;
    out.counter=out.roleFits.length?Math.round(avg(out.roleFits.map(x=>x.counter))):0;
  }
  return draftCandidateEvidence(state,side,champ,out);
}
function draftStaffAdvice(state,side){
  const turn=draftTurn(state);if(!turn||turn.side!==side)return null;
  const team=state.db.teams[state.teamIds[side]],members=teamStaffMembers(team),strategic=members.filter(s=>s.role==='strategicCoach').sort((a,b)=>b.rating-a.rating)[0]||null,analysts=members.filter(s=>s.role==='analyst').sort((a,b)=>b.rating-a.rating),analyst=analysts[0]||null;
  if(!strategic&&!analyst)return {available:false,kind:turn.kind,confidence:0,suggestions:[]};
  const prof=staffProfile(team),quality=clamp(((strategic?.rating||45)+(analyst?.rating||45))/200,.35,.95),legal=draftLegalChampions(state),opp=1-side,oppHist=state.ctx.byTeam[state.teamIds[opp]]||{won:[],lost:[]},mine=state.pickList[side].map(id=>state.db.patch.champions[id]).filter(Boolean);
  const rows=legal.map(c=>{
    let score=0,factors={meta:Math.round((state.vhat[side][c.id]||0)*100),mastery:null,comp:null,counter:null,revealed:false};
    if(turn.kind==='P'){
      const vals=draftFeasibleRoles(state,side,c.id).map(role=>draftPickValue(state,side,role,c.id,mine));if(!vals.length)return null;
      const best=vals.sort((a,b)=>b.total-a.total)[0];score=best.total;factors.mastery=Math.round(best.mastery*200);factors.comp=Math.round(best.comp*100);factors.counter=Math.round(best.counter*100);
    }else{
      factors.revealed=oppHist.won.includes(c.id)||oppHist.lost.includes(c.id);score=(state.vhat[side][c.id]||0)*.78+(oppHist.won.includes(c.id)?.16:oppHist.lost.includes(c.id)?.06:0)+(c.roles.length>1?.02:0);
    }
    const jitter=((hashStr(state.teamIds[side]+'|staff-advice|'+state.cursor+'|'+c.id)%2001)/1000-1)*(1-quality)*.14;
    return {champ:c.id,score:score+jitter,factors};
  }).filter(Boolean).sort((a,b)=>b.score-a.score||a.champ.localeCompare(b.champ)).slice(0,3);
  return {available:true,kind:turn.kind,confidence:Math.round(clamp((prof.draft+prof.analysis)/2,0,99)),strategic:strategic?{name:strategic.name,rating:strategic.rating}:null,analyst:analyst?{name:analyst.name,rating:analyst.rating}:null,suggestions:rows};
}
function draftShortlist(state,side,role){
  const k=side+role;if(!state.shortlists[k]){const p=state.roster[side][role];state.shortlists[k]=state.byRole[role].map(c=>({c,q:state.vhat[side][c.id]*0.35+draftMastery(p,c.id)/200})).sort((a,b)=>b.q-a.q).map(x=>x.c)}
  return state.shortlists[k].filter(c=>!state.taken.has(c.id)).slice(0,10);
}
function draftValidateChoice(state,choice){
  const turn=draftTurn(state);if(!turn)return {ok:false,reason:'draft_complete'};
  if(!choice||!choice.champ)return {ok:false,reason:'champion_required'};
  if(choice.side!==undefined&&choice.side!==turn.side)return {ok:false,reason:'wrong_side'};
  const c=state.db.patch.champions[choice.champ];if(!c||!state.champs.some(x=>x.id===choice.champ))return {ok:false,reason:'champion_unavailable'};
  if(state.taken.has(choice.champ))return {ok:false,reason:'champion_taken'};
  if(turn.kind==='P'&&!draftCanPick(state,turn.side,choice.champ))return {ok:false,reason:'no_legal_role_assignment'};
  return {ok:true,turn,champion:c};
}
function draftLegalChampions(state,role=null){
  const turn=draftTurn(state);if(!turn)return [];
  return state.champs.filter(c=>!state.taken.has(c.id)&&(turn.kind!=='P'||(draftCanPick(state,turn.side,c.id)&&(!role||draftFeasibleRoles(state,turn.side,c.id).includes(role)))));
}
function draftAiChoice(state){
  const turn=draftTurn(state);if(!turn)return null;
  const {kind,side}=turn,tn=state.db.teams[state.teamIds[side]],noise=0.08*(1.1-staffProfile(tn).draft/100);
  if(kind==='P'){
    const mine=state.pickList[side].map(n=>state.db.patch.champions[n]),seen=new Set(),cands=[];for(const r of ROLES)for(const c of draftShortlist(state,side,r))if(!seen.has(c.id)){seen.add(c.id);cands.push(c)}
    let best=null;
    for(const c of cands){if(state.taken.has(c.id)||!draftCanPick(state,side,c.id))continue;for(const role of draftFeasibleRoles(state,side,c.id)){const f=draftPickValue(state,side,role,c.id,mine),v=f.total+(state.rng.next()-0.5)*noise*3.46;if(!best||v>best.v)best={v,intentRole:role,champ:c.id,f}}}
    if(!best){const c=state.champs.find(x=>!state.taken.has(x.id)&&draftCanPick(state,side,x.id));if(c){const role=draftFeasibleRoles(state,side,c.id)[0];best={v:0,intentRole:role,champ:c.id,f:{total:0}}}}
    return best?{...best,kind,side,source:'ai'}:null;
  }
  const opp=1-side,mine=state.pickList[opp].map(n=>state.db.patch.champions[n]),seen=new Set(),cands=[];for(const r of ROLES)for(const c of draftShortlist(state,opp,r))if(!seen.has(c.id)){seen.add(c.id);cands.push(c)}
  const oh=state.ctx.byTeam[state.teamIds[opp]];let best=null;
  for(const c of cands){if(state.taken.has(c.id)||!draftCanPick(state,opp,c.id))continue;for(const role of draftFeasibleRoles(state,opp,c.id)){const f=draftPickValue(state,opp,role,c.id,mine,side);f.reveal=oh&&oh.won.includes(c.id)?0.12:0;const v=f.total+f.reveal+(state.rng.next()-0.5)*noise*3.46;if(!best||v>best.v)best={v,intentRole:role,champ:c.id,f}}}
  return best?{...best,kind,side,source:'ai'}:null;
}
function draftApplyChoice(state,choice){
  const valid=draftValidateChoice(state,choice);if(!valid.ok)throw new Error('Invalid draft choice: '+valid.reason);
  const {turn}=valid,{kind,side}=turn,tn=state.db.teams[state.teamIds[side]],champ=choice.champ;
  if(kind==='P'){
    state.pickList[side].push(champ);state.taken.add(champ);
    state.log.push({kind,side,champ,role:null,player:null});
    const f=choice.f||{meta:0,mastery:0,comp:0,counter:0,flex:0,series:0};
    state.expl.push({t:0,title:`${tn.short} 픽: ${championLabel(state.db,champ)}`,factors:[['메타 인식',f.meta||0],['숙련도',f.mastery||0],['조합',f.comp||0],['상성',f.counter||0],['유연성',f.flex||0],['시리즈 경험',f.series||0]],utility:choice.v??f.total??0,result:'PICK'});
  }else{
    state.bans[side].push(champ);state.taken.add(champ);
    const role=choice.intentRole||valid.champion.roles[0]||null,target=role&&state.roster[1-side][role];
    state.log.push({kind,side,champ,role:null,player:null});
    const f=choice.f||{total:0,reveal:0};
    state.expl.push({t:0,title:choice.source==='ai'&&role?`${tn.short} 밴: ${championLabel(state.db,champ)} (상대 ${ROLE_KO[role]} 우선 견제)`:`${tn.short} 밴: ${championLabel(state.db,champ)}`,factors:[['상대 픽 가치',f.total||0],['이전 세트 활약',f.reveal||0]],utility:choice.v??0,result:'BAN'});
  }
  state.cursor++;return state;
}
function draftSkipTurn(state){if(draftTurn(state))state.cursor++;return state}
function draftAssignmentValue(state,side,a){
  let v=0;for(const role of ROLES){const id=a[role],c=state.db.patch.champions[id],p=state.roster[side][role],sys=championSystemMetaProfile(state.db.patch,c).roles[role];v+=draftMastery(p,id)/100*.72+(state.vhat[side][id]||0)*.2+(sys?.power||0)}
  return v;
}
function draftFinalAssignment(state,side){
  const rows=draftAssignmentsFor(state,side);if(state.pickList[side].length!==5||!rows.length)throw new Error('Draft ended without legal five-role assignment');
  return rows.map(a=>({a,v:draftAssignmentValue(state,side,a)})).sort((x,y)=>y.v-x.v||ROLES.map(r=>x.a[r]).join('|').localeCompare(ROLES.map(r=>y.a[r]).join('|')))[0].a;
}
function draftResult(state){
  const picks=[draftFinalAssignment(state,0),draftFinalAssignment(state,1)],roleByChamp=picks.map(a=>Object.fromEntries(ROLES.map(r=>[a[r],r])));
  const log=state.log.map(x=>x.kind==='P'?{...x,role:roleByChamp[x.side][x.champ],player:state.roster[x.side][roleByChamp[x.side][x.champ]]?.name||null}:x);
  return {bans:state.bans,picks,log,expl:state.expl,pickOrder:state.pickList.map(x=>x.slice())};
}
function runDraft(db,teamIds,rng,ctx){
  ctx=ctx||{used:[],byTeam:{}};
  if(ctx.forced){const f=ctx.forced;return {bans:f.bans,picks:f.picks,log:[],expl:[{t:0,title:'기록된 밴픽 재현',factors:[],result:''}],pickOrder:[ROLES.map(r=>f.picks[0][r]),ROLES.map(r=>f.picks[1][r])]}}
  const state=createDraftSession(db,teamIds,rng,ctx);
  while(draftTurn(state)){const choice=draftAiChoice(state);if(choice)draftApplyChoice(state,choice);else draftSkipTurn(state)}
  return draftResult(state);
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
