// ===== LOL GM: isolated one-game match simulation =====

const XP_TABLE=[0,280,660,1140,1720,2400,3180,4060,5040,6120,7300,8580,9960,11440,13020,14700,16480,18360,20340,22420];
// Computation guard, not a tournament time limit or a victory rule.
const MATCH_SIMULATION_MAX_MINUTES=180;

// ---------- 경기 엔진 ----------
const at=(ps,a)=>ps.p.attrs[a]/100;
const td=(ps,t)=>ps.p.tend[t]/100;

function newPS(p,side,role,champ,patch){
  const pr=p.pool[champ]||{mastery:25,confidence:40,experience:10},c=patch.champions[champ],itemPlan=selectItemBuild(patch,c,p,role),starterItem=selectStarterItem(patch,c,p,role),itemActions=itemPurchasePlan(patch,itemPlan,starterItem),runes=selectRunePage(patch,c,p,role);
  const itemSpent=starterItem?patch.itemDefs[starterItem].cost:0;
  return {p,side,role,champ:c,prof:pr,quest:createRoleQuest(patch,role),questRevision:0,itemRevision:0,itemSpent,lvl:1,xp:0,gold:500-itemSpent,goldEarned:500,cs:0,k:0,d:0,a:0,dmg:0,dmgTaken:0,vision:0,objectives:0,laneAdv:0,laneSamples:0,teamfightDmg:0,teamfights:0,teamfightWins:0,deadUntil:0,hp:1,flashAt:0,penalty:0,items:starterItem?[starterItem]:[],starterItem,itemPlan,itemActions,itemActionIndex:0,runes,patchRef:patch,recall:false};
}
function alive(st,ps){return ps.deadUntil<=st.t}
function aliveOf(st,side){return st.sides[side].ps.filter(x=>alive(st,x))}

function combatStats(st,ps){
  const sd=st.sides[ps.side], key=st.t*1e6+ps.goldEarned*10+ps.lvl+(ps.questRevision||0)*.00001+(sd.baronUntil>st.t?0.1:0)+(sd.elderUntil>st.t?0.2:0)+(sd.soul?0.4:0);
  const revision=draftPatchRevisionKey(st.patch);
  if(ps._ck===key&&ps._itemRevision===ps.itemRevision&&ps._combatPatch===st.patch&&ps._combatRevision===revision)return ps._cs;
  ps._combatPatch=st.patch;ps._combatRevision=revision;ps._itemRevision=ps.itemRevision;ps._ck=key;return ps._cs=combatStats0(st,ps);
}
function combatStats0(st,ps){
  // Owned AD and defense stats, with explicitly retained AP/AS/crit aggregate
  // proxies. Cash is not a combat stat; no spell ratios are reconstructed here.
  const c=ps.champ,b=c.base,L=ps.lvl,k=c.kit,sp=championSkillProfile(c),equipment=matchQuestItems(ps);
  const ie=systemEffects(st.patch.itemDefs,equipment),re=systemEffects(st.patch.runeDefs,ps.runes),phaseEarly=st.t<15?1:0,phaseLate=st.t>=28?1:0;
  const gear=inventoryDefenseStats(st.patch.itemDefs,equipment),attack=inventoryAttackStats(st.patch.itemDefs,equipment),questBonus=ps.quest?.completed?ps.quest.rules.bonusPower||0:0;
  const ph=st.t<14?k.early:st.t<26?k.mid:k.late,pm=.8+.04*ph,phaseSystem=1+(ie.early+re.early)*phaseEarly+(ie.scaling+re.scaling)*phaseLate;
  const hp=b.hp+b.hpg*(L-1)+gear.hp,arm=b.arm+b.armg*(L-1)+gear.armor,mr=(b.mr||30)+(b.mrg||1.3)*(L-1)+gear.mr,ad=b.ad+b.adg*(L-1)+attack.ad*(1+questBonus);
  const asp=(b.as||.65)*(1+(b.asg||0)*(L-1)/100),resource=(b.resource?clamp((b.resource+(b.resourceg||0)*(L-1))/800+(b.resourceRegen||0)/30,.65,1.18):1)*sp.economy;
  const sysOff=1+ie.offense-attack.adEffect+attack.apEffect*questBonus+re.offense+(ie.haste+re.haste)*.35+(ie.mobility+re.mobility)*.16,sysDef=1+ie.defense-gear.statEffect+re.defense+(ie.sustain+re.sustain)*.55+(ie.utility+re.utility)*.25+(ie.mobility+re.mobility)*.08;
  let off=ad*(.52+.042*(k.burst+k.dps))*pm*(b.range>400?1.1:1)*(.88+asp*.18)*(.94+sp.power*.07+sp.uptime*.04+sp.reach*.025+sp.mobility*.012)*resource*sysOff*phaseSystem;
  const defense=arm*.55+mr*.45;let ehp=hp*(1+defense/100)*(.83+.028*k.sustain)*(.98+sp.utility*.04+sp.cc*.025)*Math.sqrt(pm)*sysDef*Math.sqrt(phaseSystem);
  const s=st.sides[ps.side];
  let buff=1;if(s.soul)buff*=1.08;if(s.baronUntil>st.t)buff*=1.15;if(s.elderUntil>st.t)buff*=1.25;
  const mf=.82+.26*ps.prof.mastery/100+.04*(ps.prof.confidence-50)/50;
  const sk=.84+.32*avg(['positioning','target_selection','teamfight_awareness','combo_execution','reaction','burst_execution','extended_fight'].map(a=>at(ps,a)));
  const fm=1+playerMod(ps.p),md=1+(st.mods?st.mods[ps.side]:0);
  return {off:off*buff*mf*sk*md*fm,ehp:ehp*buff*Math.sqrt(mf),mf,sk,itemEffects:ie,runeEffects:re,skillProfile:sp,defenseStats:{hp,armor:arm,mr,gear},attackStats:{ad,gear:attack,questBonus}};
}
function power(st,ps){const c=combatStats(st,ps);return Math.sqrt(c.off*c.ehp)}
function teamPower(st,side){return aliveOf(st,side).reduce((s,x)=>s+power(st,x)*x.hp**0.5,0)}

// Bounded aggregate interactions, not per-spell casts or geometric hitboxes.
// The same profile used for draft evaluation also affects when a fight pays off.
function fightSkillProfile(st,players,zone){
  const profiles=players.map(p=>{const c=combatStats(st,p);return {...c.skillProfile,
    mobility:clamp(c.skillProfile.mobility+c.itemEffects.mobility+c.runeEffects.mobility+(['dragon','baron'].includes(zone)&&p.role==='JGL'&&p.quest?.completed?p.quest.rules.jungleMobility||0:0),0,1.7)}});
  return Object.fromEntries(['cc','reach','mobility','uptime'].map(k=>[k,avg(profiles.map(p=>p[k]))]));
}
function fightSkillEngage(attacker,defender){
  return clamp((attacker.cc-defender.cc)*.035+(attacker.mobility-defender.mobility)*.02,-.08,.08);
}
function fightSkillPhase(own,enemy,round,engaged){
  const advantage=round==='burst'?(own.reach-enemy.reach)*.06*(engaged?.25:1)+(own.cc-enemy.mobility)*.025:
    round==='ext'?(own.uptime-enemy.uptime)*.035+(own.mobility-enemy.cc)*.015:
    (own.mobility-enemy.mobility)*.03;
  return 1+clamp(advantage,-.08,.08);
}

function fmtTime(m,sec){return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`}
function log(st,text,opt={}){if(matchEnded(st))return null;const sec=matchEventSecond(st,opt);if(!st.quiet)st.log.push({t:st.t,sec,text,side:opt.side??-1,major:!!opt.major,kind:opt.kind||''});return sec}
function expl(st,title,factors,extra={}){if(st.quiet||matchEnded(st))return;st.expl.push({t:st.t,title,factors,...extra})}
function pname(st,ps){return `${st.sides[ps.side].team.short} ${ps.p.name}(${ps.champ.name})`}

function addGold(ps,g){ps.gold+=g;ps.goldEarned+=g;
  advanceItemPurchases(ps);
}
function addXp(ps,x,source='ordinary'){ps.xp+=x*(source==='ordinary'&&ps.quest?.completed?1+(ps.quest.rules.xpBonus||0):1);let l=1;for(let i=1;i<XP_TABLE.length;i++)if(ps.xp>=XP_TABLE[i])l=i+1;ps.lvl=Math.min(ps.quest?.completed?ps.quest.rules.levelCap||18:18,l)}

function killPlayer(st,killer,victim,assists,reason){
  if(matchEnded(st))return;
  const R=st.patch.rules;
  victim.d++; victim.hp=1;
  const sec=victim.lvl*2.5+6+Math.max(0,st.t-15)*0.9;
  victim.deadUntil=st.t+sec/60; victim.penalty=Math.min(1,(sec+25)/60);
  if(killer){killer.k++; addGold(killer,R.killGold); addXp(killer,140+victim.lvl*20,'champion'); st.sides[killer.side].kills++;roleQuestTakedown(st,killer);}
  const as=assists.filter(a=>a!==killer&&a.side!==victim.side);
  as.forEach(a=>{a.a++; addGold(a,Math.round(R.assistGold/as.length)); addXp(a,70,'champion');roleQuestTakedown(st,a)});
  const lane=LANES.find(l=>LANE_ROLES[l].includes(victim.role))||'mid';
  st.lanePush[lane]+= victim.side===0?-0.35:0.35; st.lanePush[lane]=clamp(st.lanePush[lane],-1,1);
  const fb=st.firsts.blood===undefined; if(fb) st.firsts.blood=killer?killer.side:1-victim.side;
  log(st,`${killer?pname(st,killer):'처형'} → ${pname(st,victim)} 처치${fb?' (퍼스트 블러드)':''}${reason?' · '+reason:''}`,{side:killer?killer.side:1-victim.side,major:true,kind:'kill'});
}

// ----- 교전: Setup → Engage → Burst → Extended → Cleanup -----
function fight(st,zone,sideArrs,ctx={}){
  if(matchEnded(st))return null;
  const R=st.rng;
  if(!sideArrs[0].length||!sideArrs[1].length) return null;
  for(const ps of sideArrs.flat()){const lane=LANES.find(l=>LANE_ROLES[l].includes(ps.role));if(lane&&zone!==lane)ps.questAwayUntil=st.t+1}
  const vis=st.vision[zone]||0,isTeamfight=sideArrs[0].length+sideArrs[1].length>=6;
  const initScore=[0,1].map(i=>{const a=sideArrs[i];
    return avg(a.map(p=>(at(p,'anticipation')+at(p,'map_awareness')+at(p,'teamfight_awareness'))/3))*1.0
      +(i===0?vis:-vis)*0.4 +(i===0?BAL.blue:0)+ Math.max(...a.map(p=>p.champ.kit.engage))/10*0.25 + (a.length-sideArrs[1-i].length)*0.12 + R.info.normal(0,0.15)});
  const init=initScore[0]>=initScore[1]?0:1, def=1-init;
  const engager=sideArrs[init].reduce((b,p)=>p.champ.kit.engage*at(p,'engage')>b.champ.kit.engage*at(b,'engage')?p:b);
  const defAvoid=avg(sideArrs[def].map(p=>(at(p,'dodging')+at(p,'positioning'))/2));
  const skillProfiles=sideArrs.map(a=>fightSkillProfile(st,a,zone)),skillEngage=fightSkillEngage(skillProfiles[init],skillProfiles[def]);
  const engP=clamp(0.3+0.45*engager.champ.kit.engage/10*at(engager,'engage')+0.25*(initScore[init]-initScore[def])-0.35*(defAvoid-0.6)+skillEngage,0.08,0.92);
  const engOk=R.exec.chance(engP);
  const mult=[1,1]; mult[init]*=engOk?1.2:0.9; if(!engOk) mult[def]*=1.05;
  if(ctx.defender!==undefined) mult[ctx.defender]*=1.15;
  const F=[];
  for(const i of [0,1]) for(const ps of sideArrs[i]){const cs=combatStats(st,ps);F.push({ps,side:i,max:cs.ehp,hp:cs.ehp*clamp(ps.hp,0,1),off:cs.off,alive:true,hitters:new Set(),last:null})}
  const K=(avg(F.map(f=>f.max))/avg(F.map(f=>f.off)))/4.6;
  const peel=[0,1].map(i=>avg(sideArrs[i].map(p=>p.champ.kit.peel/10*at(p,'peeling'))));
  const pw0=[0,1].map(i=>F.filter(f=>f.side===i).reduce((s,f)=>s+Math.sqrt(f.off*f.hp),0)*mult[i]);
  const rounds=['burst','ext','ext','ext','clean'];
  let disengaged=-1;
  for(let ri=0;ri<rounds.length;ri++){
    const rd=rounds[ri];
    const liv=[0,1].map(i=>F.filter(f=>f.side===i&&f.alive));
    if(!liv[0].length||!liv[1].length)break;
    if(ri>=1&&rd!=='clean'){
      const pw=[0,1].map(i=>liv[i].reduce((s,f)=>s+Math.sqrt(f.off*f.hp),0)*mult[i]);
      const lose=pw[0]<pw[1]?0:1;
      if(pw[lose]/pw[1-lose]<0.6){const dk=avg(liv[lose].map(f=>f.ps.champ.kit.disengage/10*at(f.ps,'disengage')));
        if(R.exec.chance(0.15+0.5*dk)){disengaged=lose;break;}}
    }
    const dmgs=[];
    for(const f of F){ if(!f.alive)continue;
      const en=F.filter(e=>e.side!==f.side&&e.alive); if(!en.length)continue;
      let tgt;
      if(R.dec.chance(0.35+0.55*at(f.ps,'target_selection'))){
        tgt=en.reduce((b,e)=>{const s=(e.off/e.hp)*(1.3-0.6*at(e.ps,'positioning'));return !b||s>b.s?{e,s}:b},null).e;
      } else tgt=R.dec.chance(0.5)?en.reduce((b,e)=>e.hp>b.hp?e:b):R.dec.pick(en);
      const k=f.ps.champ.kit;
      const w=rd==='burst'?0.55+0.09*k.burst:rd==='ext'?0.4+0.07*k.dps:0.5;
      const execRoll=Math.max(0.3,R.mech.normal(1,0.13*(1.25-at(f.ps,'consistency'))));
      let d=f.off*K*w*execRoll*mult[f.side]*fightSkillPhase(skillProfiles[f.side],skillProfiles[1-f.side],rd,engOk);
      if(['ADC','MID'].includes(tgt.ps.role)) d*=1-0.3*peel[tgt.side];
      dmgs.push([f,tgt,d]);
    }
    for(let i=dmgs.length-1;i>0;i--){const j=Math.floor(R.mech.next()*(i+1));[dmgs[i],dmgs[j]]=[dmgs[j],dmgs[i]]}
    for(const [f,t,d] of dmgs)applyFightDamage(st,f,t,d,isTeamfight);
    for(const t of F) if(t.alive&&t.hp<=0){t.alive=false;}
    if(rd==='clean')break;
  }
  const deaths=[0,0];
  for(const f of F){
    if(!f.alive){deaths[f.side]++; killPlayer(st,f.last?f.last.ps:null,f.ps,[...f.hitters].map(h=>h.ps),ctx.label||'')}
    else f.ps.hp=clamp(f.hp/f.max,0,1);
  }
  const sur=[0,1].map(i=>F.filter(f=>f.side===i&&f.alive).length);
  let winner = deaths[0]===deaths[1] ? (sur[0]>=sur[1]? (disengaged===0?1:0):1) : (deaths[0]<deaths[1]?0:1);
  if(deaths[0]===deaths[1]&&disengaged<0) winner = pw0[0]>=pw0[1]?0:1;
  st.vision[zone]=clamp((st.vision[zone]||0)+(winner===0?0.3:-0.3),-1,1);
  if(isTeamfight)for(const f of F){f.ps.teamfights++;if(f.side===winner)f.ps.teamfightWins++}
  const res={winner,deaths,sur,init,engOk,disengaged,skillEngage,n:[sideArrs[0].length,sideArrs[1].length]};
  expl(st,`교전 (${ctx.label||zone}) ${sideArrs[0].length}v${sideArrs[1].length}`,[
    ['선공권 Blue',initScore[0]],['선공권 Red',initScore[1]],['진입 성공확률',engP],['교전 전 전력 Blue',pw0[0]/1000],['교전 전 전력 Red',pw0[1]/1000]],
    {prob:engP,result:`${engOk?'진입 성공':'진입 실패'} · ${['Blue','Red'][winner]} 승리 ${deaths[1]}–${deaths[0]}${disengaged>=0?' (후퇴)':''}`});
  if(isTeamfight)
    log(st,`${ctx.label||'한타'}: ${st.sides[winner].team.short} 승리 (${deaths[1-winner]}킬 / ${deaths[winner]}데스)${disengaged>=0?' · 패배 측 후퇴':''}`,{side:winner,major:true,kind:'fight'});
  return res;
}

// ----- 구조물 -----
function laneProgress(s,l){return s.towers[l].filter(x=>!x).length}
function takeStructure(st,side,opt={}){
  if(matchEnded(st))return;
  const en=st.sides[1-side];
  // 억제기 재생성 처리
  for(const l of LANES) if(!en.towers[l][3]&&en.inhibAt[l]&&st.t>=en.inhibAt[l]){en.towers[l][3]=true;en.inhibAt[l]=0;log(st,`${en.team.short} ${LANE_KO[l]} 억제기 재생성`,{side:1-side})}
  const inhibDown=LANES.some(l=>!en.towers[l][3]);
  if(opt.allowNexus&&inhibDown){
    if(en.nexusT>0){en.nexusT--; st.sides[side].towersTaken++; log(st,`${st.sides[side].team.short} 쌍둥이 포탑 파괴`,{side,major:true,kind:'tower'}); return 'nexusT'}
    return destroyMatchNexus(st,side);
  }
  let lanes=opt.lane?[opt.lane]:LANES.slice();
  lanes=lanes.filter(l=>en.towers[l].some(x=>x));
  if(!lanes.length){ if(opt.lane) return takeStructure(st,side,{...opt,lane:null}); return null; }
  lanes.sort((a,b)=>laneProgress(en,b)-laneProgress(en,a)+(st.rng.dec.next()-0.5)*1.5);
  const l=lanes[0], idx=en.towers[l].findIndex(x=>x);
  if(idx===3&&!opt.allowInhib) return null;
  en.towers[l][idx]=false;
  const names=['1차 포탑','2차 포탑','억제기 포탑','억제기'];
  if(idx===3){en.inhibAt[l]=st.t+st.patch.rules.inhibRespawn; log(st,`${st.sides[side].team.short} ${LANE_KO[l]} 억제기 파괴`,{side,major:true,kind:'tower'});}
  else{ st.sides[side].towersTaken++;
    const ft=st.firsts.tower===undefined; if(ft)st.firsts.tower=side;
    const gold=idx===0?250:idx===1?300:350;
    aliveOf(st,side).forEach(p=>{addGold(p,Math.round(gold/2));const lane=LANES.find(x=>LANE_ROLES[x].includes(p.role));matchQuestEvent(st,p,{towers:lane===l?1:.5})});
    log(st,`${st.sides[side].team.short} ${LANE_KO[l]} ${names[idx]} 파괴${ft?' (첫 포탑)':''}`,{side,major:true,kind:'tower'});
  }
  return l;
}

// ----- 틱: 수입/시야/라인전/정글/오브젝트/운영 -----
function incomeTick(st){
  if(matchEnded(st))return;
  const R=st.patch.rules, lane=st.t<14;
  for(const s of st.sides) for(const ps of s.ps){
    if(!alive(st,ps)){continue}
    const base=lane?{TOP:8.4,JGL:5.8,MID:8.7,ADC:8.9,SUP:0.9}[ps.role]:{TOP:8.0,JGL:6.6,MID:8.3,ADC:9.4,SUP:1.2}[ps.role];
    let cs=base*(0.72+0.38*at(ps,'csing'));
    if(st.t===1)cs*=ps.role==='JGL'?0.4:0.15;
    const ln=LANES.find(l=>LANE_ROLES[l].includes(ps.role));
    if(lane&&ln){const push=st.lanePush[ln]*(ps.side===0?1:-1); cs*=1+0.12*push}
    const recalled=ps.recall;if(recalled){cs*=0.6;ps.recall=false}
    cs*=(1-ps.penalty)*st.rng.mech.range(0.93,1.07); ps.penalty=0;
    ps.cs+=cs;
    addGold(ps,cs*R.csGold+R.passiveGold+(ps.role==='SUP'&&!ps.quest?35:0));
    addXp(ps,cs*58+(ps.role==='JGL'?60:0)+(ps.role==='SUP'?(lane?230:320):0)+(!lane&&ps.role!=='SUP'?40:0));
    roleQuestIncome(st,ps,cs,recalled);
    ps.hp=Math.min(1,ps.hp+0.12);
  }
}
const ZONES=['top','mid','bot','dragon','baron'];
function visionTick(st){
  if(matchEnded(st))return;
  const inv=[0,1].map(i=>{const s=st.sides[i],a=aliveOf(st,i),tac=.7+.6*s.team.tactics.vision_investment/100;
    let questVision=0;for(const p of a){const ward=roleQuestWard(st,p);questVision+=ward;p.vision+=ward+(at(p,'vision_understanding')*(p.role==='SUP'||p.role==='JGL'?1.5:.8))*tac*.65}
    return avg(a.map(p=>at(p,'vision_understanding')*(p.role==='SUP'||p.role==='JGL'?1.5:.8)))*(a.length/5)*tac+questVision*.1});
  for(const z of ZONES){const tgt=(inv[0]-inv[1])*1.6;st.vision[z]=clamp(st.vision[z]+(tgt-st.vision[z])*.35+st.rng.info.normal(0,.08),-1,1)}
}
function visFor(st,side,z){return side===0?st.vision[z]:-st.vision[z]}
function pushFor(st,side,l){return side===0?st.lanePush[l]:-st.lanePush[l]}
function lanePS(st,side,l){return st.sides[side].ps.filter(p=>LANE_ROLES[l].includes(p.role))}

function laningTick(st){
  if(matchEnded(st))return;
  const R=st.rng;
  for(const l of LANES){
    const A=lanePS(st,0,l).filter(p=>alive(st,p)), B=lanePS(st,1,l).filter(p=>alive(st,p));
    if(!A.length||!B.length){ st.lanePush[l]=clamp(st.lanePush[l]+(A.length?0.3:-0.3),-1,1); continue; }
    const wv=a=>avg(a.map(p=>at(p,'wave_control')*0.4+at(p,'pressure')*0.4+p.champ.kit.waveclear/10*0.35+p.champ.kit.early/10*0.25))*Math.sqrt(a.length);
    st.lanePush[l]=clamp(st.lanePush[l]*0.6+(wv(A)-wv(B))*0.9+R.dec.normal(0,0.18),-1,1);
    A.forEach(p=>{p.laneAdv+=st.lanePush[l];p.laneSamples++});B.forEach(p=>{p.laneAdv-=st.lanePush[l];p.laneSamples++});
    const aggr=avg([...A,...B].map(p=>(td(p,'aggression')+td(p,'trading_frequency'))/2));
    if(R.dec.chance(0.25+0.4*aggr)){
      const sc=a=>avg(a.map(p=>(at(p,'trading')*0.4+at(p,'harass')*0.2+at(p,'precision')*0.2+at(p,'skillshot')*0.2)*(0.82+0.26*p.prof.mastery/100)*(0.7+0.06*(p.champ.kit.early+p.champ.kit.poke)/2)))+avg(a.map(p=>p.lvl))*0.03;
      const cons=avg([...A,...B].map(p=>at(p,'consistency')));
      const diff=sc(A)-sc(B)+R.mech.normal(0,0.14*(1.3-cons));
      const W=diff>=0?A:B, L=diff>=0?B:A;
      L.forEach(p=>p.hp=Math.max(0.05,p.hp-Math.min(0.5,0.1+Math.abs(diff)*1.4)));
      W.forEach(p=>p.hp=Math.max(0.1,p.hp-0.07));
      const low=L.reduce((b,p)=>p.hp<b.hp?p:b), win=W.reduce((b,p)=>at(p,'all_in')>at(b,'all_in')?p:b);
      if(low.hp<0.45&&R.dec.chance(td(win,'aggression')*0.45+td(win,'risk_taking')*0.25)){
        let esc=avg([at(low,'dodging'),at(low,'gank_avoidance')]);
        let flash=false;
        if(low.flashAt<=st.t&&R.exec.chance(0.6)){flash=true;low.flashAt=st.t+5;esc+=0.25;log(st,`${pname(st,low)} 점멸 사용`,{side:low.side,kind:'flash'})}
        const p=clamp(0.3+0.55*(1-low.hp)+0.3*(at(win,'all_in')-esc)+(win.lvl-low.lvl)*0.05,0.05,0.9);
        const ok=R.exec.chance(p);
        expl(st,`${LANE_KO[l]} 올인: ${pname(st,win)} → ${low.p.name}`,[['상대 체력',low.hp],['올인 능력',at(win,'all_in')],['회피',esc],['레벨 차',win.lvl-low.lvl],['점멸 사용',flash?1:0]],{prob:p,result:ok?'SUCCESS':'FAIL'});
        if(ok) killPlayer(st,win,low,W,`${LANE_KO[l]} 라인전`);
        else {win.hp=Math.max(0.05,win.hp-0.2); log(st,`${pname(st,win)} 올인 실패`,{side:win.side})}
      }
    }
    for(const p of [...A,...B]) if(alive(st,p)&&p.hp<0.32){
      const good=at(p,'recall_timing'); p.hp=1; p.recall=true; if(good<0.6)p.penalty+=0.1;
      log(st,`${pname(st,p)} 귀환`,{side:p.side,kind:'recall'});
    }
  }
}

function jungleTick(st){
  if(matchEnded(st))return;
  const R=st.rng;
  for(const side of [0,1]){
    const j=st.sides[side].ps.find(p=>p.role==='JGL'); if(!alive(st,j)||st.t<(st.jgNext[side]))continue;
    const ej=st.sides[1-side].ps.find(p=>p.role==='JGL'), t=st.sides[side].team.tactics;
    const noiseSd=0.3*(1.15-0.5*at(j,'map_awareness')-0.5*at(j,'decision_making'));
    const opts=[{kind:'farm',u:0.45+0.25*(1-td(j,'aggression'))+Math.max(0,ej.lvl-j.lvl)*0.12,f:[]}];
    for(const l of LANES){
      const en=lanePS(st,1-side,l).filter(p=>alive(st,p)); if(!en.length)continue;
      const al=lanePS(st,side,l).filter(p=>alive(st,p));
      const tgt=en.reduce((b,p)=>p.hp<b.hp?p:b);
      const pr=-pushFor(st,side,l), hpF=1-tgt.hp, fl=tgt.flashAt>st.t?1:0, vis=visFor(st,side,l);
      const allyCC=al.reduce((s,p)=>s+p.champ.kit.cc,0)/20;
      const f=[['상대 라인 푸시',0.4*pr],['상대 체력',0.5*hpF],['상대 점멸 없음',0.35*fl],['시야',0.3*vis],['아군 CC',allyCC],['공격성',0.2*td(j,'aggression')]];
      const trueU=0.2+f.reduce((s,x)=>s+x[1],0);
      opts.push({kind:'gank',lane:l,tgt,al,en,u:trueU+R.info.normal(0,noiseSd),trueU,f,pr,hpF,fl,vis});
    }
    const ch=opts.reduce((b,o)=>o.u>b.u?o:b);
    if(ch.kind==='farm'){st.jgNext[side]=st.t+R.dec.range(1.5,2.5);continue}
    st.jgNext[side]=st.t+R.dec.range(2,3.2);
    const avoid=avg(ch.en.map(p=>at(p,'gank_avoidance')));
    const eVis=Math.max(0,-ch.vis);
    let p=clamp(0.42+0.22*ch.pr+0.3*ch.hpF+0.15*ch.fl+0.15*ch.vis-0.45*(avoid-0.65)-0.2*eVis+0.15*(at(j,'pressure')-0.6),0.08,0.9);
    let cg=0; if(alive(st,ej)) cg=clamp(0.02+0.16*at(ej,'anticipation')*(1-Math.max(0,ch.vis))+0.06*td(ej,'aggression'),0.02,0.3);
    const roll=R.exec.next();
    let result;
    if(R.info.chance(cg)){
      result='COUNTERGANK';
      log(st,`${pname(st,j)} ${LANE_KO[ch.lane]} 갱킹 → ${ej.p.name} 카운터 정글`,{side,major:true,kind:'gank'});
      const sides=side===0?[[j,...ch.al],[...ch.en,ej]]:[[...ch.en,ej],[j,...ch.al]];
      fight(st,ch.lane,sides,{label:`${LANE_KO[ch.lane]} 카운터 정글`});
    } else if(roll<p){
      result='SUCCESS';
      log(st,`${pname(st,j)} ${LANE_KO[ch.lane]} 갱킹`,{side,kind:'gank'});
      killPlayer(st,j,ch.tgt,[j,...ch.al],`${LANE_KO[ch.lane]} 갱킹`);
      const other=ch.en.find(x=>x!==ch.tgt&&alive(st,x));
      if(other&&R.exec.chance(0.3)) killPlayer(st,R.exec.pick(ch.al.length?ch.al:[j]),other,[j,...ch.al],'더블 킬 갱킹');
    } else {
      result='FAIL';
      if(ch.tgt.flashAt<=st.t){ch.tgt.flashAt=st.t+5; log(st,`${pname(st,j)} ${LANE_KO[ch.lane]} 갱킹 — ${ch.tgt.p.name} 점멸로 생존`,{side,kind:'gank'});}
      else log(st,`${pname(st,j)} ${LANE_KO[ch.lane]} 갱킹 실패`,{side,kind:'gank'});
    }
    expl(st,`${st.sides[side].team.short} 정글 → ${LANE_KO[ch.lane]} 갱킹`,ch.f,{utility:ch.trueU,perceived:ch.u,prob:p,counter:cg,result});
  }
}

function teamCall(st,side,obj,stakeBonus){
  const s=st.sides[side], a=aliveOf(st,side); if(!a.length) return {go:false,part:[],votes:[]};
  const pr=teamPower(st,side)/(teamPower(st,1-side)||1);
  const z=obj==='baron'?'baron':obj==='herald'?'top':'dragon';
  const lanes=obj==='dragon'||obj==='elder'?['bot','mid']:['top','mid'];
  const prio=avg(lanes.map(l=>pushFor(st,side,l)));
  const base=(s.team.tactics.objective_priority/100-0.5)*0.6+(pr-1)*1.6+visFor(st,side,z)*0.4+prio*0.25+(a.length-aliveOf(st,1-side).length)*0.35+stakeBonus;
  let W=0,U=0; const votes=[];
  for(const p of a){
    const u=base+(td(p,'objective_preference')-0.5)*0.4+st.rng.info.normal(0,0.35*(1.15-at(p,'decision_making')));
    const w=(at(p,'shotcalling')*0.6+at(p,'communication')*0.4)*(p.role==='JGL'||p.role==='SUP'?1.2:1);
    votes.push([p,u]); W+=w; U+=u*w;
  }
  const go=U/W>0.05;
  const part=votes.filter(([p,u])=>(u>0.05)===go||st.rng.dec.chance(0.55+0.4*avg([at(p,'communication'),td(p,'teamplay')]))).map(v=>v[0]);
  return {go,part:go?roleQuestObjectiveJoin(st,side,part):[],votes,base,pr};
}

function objectiveTick(st){
  if(matchEnded(st))return;
  const o=st.obj, R=st.rng, rules=st.patch.rules;
  const run=(key,label,z,stake,reward)=>{
    o.wait[key]=(o.wait[key]||0)+1;
    const c=[0,1].map(i=>teamCall(st,i,key,stake(i)+(o.wait[key]-1)*0.25));
    expl(st,`${label} 콜`,c.flatMap((x,i)=>x.votes.map(([p,u])=>[`${['Blue','Red'][i]} ${ROLE_KO[p.role]}`,u])),{result:`Blue ${c[0].go?'싸움':'포기'} / Red ${c[1].go?'싸움':'포기'}`});
    let taker=-1;
    if(c[0].go&&c[1].go&&c[0].part.length&&c[1].part.length){
      for(const i of [0,1]){const n=aliveOf(st,i).length-c[i].part.length; if(n>0&&c[i].part.length<aliveOf(st,i).length) log(st,`${st.sides[i].team.short} 콜 불일치 — ${n}명 합류 실패`,{side:i})}
      const r=fight(st,z,[c[0].part,c[1].part],{label:`${label} 한타`});
      const w=r.winner, wa=c[w].part.filter(p=>alive(st,p));
      if(wa.length){
        taker=w;
        const lj=st.sides[1-w].ps.find(p=>p.role==='JGL');
        if(alive(st,lj)&&R.exec.chance(clamp(0.04+0.12*at(lj,'smite_execution')*(r.deaths[1-w]<=1?1:0.3)+(roleQuestSmite(lj)-roleQuestSmite(st.sides[w].ps.find(p=>p.role==='JGL')))/1400*.04,.01,.25))){taker=1-w;log(st,`${pname(st,lj)} ${label} 스틸!`,{side:1-w,major:true,kind:'obj'})}
      }
    } else if(c[0].go!==c[1].go){
      taker=c[0].go?0:1;
      const giver=1-taker;
      if(st.t>=10&&R.dec.chance(0.45+0.3*avg(aliveOf(st,giver).map(p=>at(p,'crossmap_decision'))))){
        log(st,`${st.sides[giver].team.short} ${label} 포기 → 반대편 교환`,{side:giver});
        takeStructure(st,giver,{lane:key==='baron'||key==='herald'?'bot':'top'});
      }
    }
    if(taker>=0){o.wait[key]=0;const involved=c[taker]&&c[taker].part&&c[taker].part.length?c[taker].part:aliveOf(st,taker);involved.forEach(p=>{p.objectives++;matchQuestEvent(st,p,{epics:1,jungleStacks:p.role==='JGL'?1:0})});reward(taker);}
  };
  if(!o.soul&&o.dragonAt&&st.t>=o.dragonAt){
    const type=o.dragonTypes[o.dragonIdx%o.dragonTypes.length];
    run('dragon',`${type} 드래곤`,'dragon',i=>{const m=st.sides[i].dragons.length,e=st.sides[1-i].dragons.length;return (m===3?0.4:0)+(e===3?0.6:0)},w=>{
      st.sides[w].dragons.push(type); o.dragonIdx++; if(st.firsts.dragon===undefined)st.firsts.dragon=w;
      aliveOf(st,w).forEach(p=>addGold(p,40));
      log(st,`${st.sides[w].team.short} ${type} 드래곤 처치 (${st.sides[w].dragons.length}스택)`,{side:w,major:true,kind:'obj'});
      if(st.sides[w].dragons.length>=4){st.sides[w].soul=true;o.soul=true;o.elderAt=st.t+6;log(st,`${st.sides[w].team.short} 드래곤 영혼 획득`,{side:w,major:true,kind:'obj'})}
      else o.dragonAt=st.t+rules.dragonRespawn;
    });
  }
  if(o.soul&&o.elderAt&&st.t>=o.elderAt){
    run('elder','장로 드래곤','dragon',()=>0.8,w=>{st.sides[w].elderUntil=st.t+rules.elderBuff;o.elderAt=st.t+6;log(st,`${st.sides[w].team.short} 장로 드래곤 처치`,{side:w,major:true,kind:'obj'})});
  }
  if(!o.heraldDone&&st.t>=rules.heraldSpawn&&st.t<20){
    run('herald','협곡의 전령','top',()=>-0.1,w=>{o.heraldDone=true;st.sides[w].herald++;st.sides[w].heraldCharge=true;log(st,`${st.sides[w].team.short} 협곡의 전령 획득`,{side:w,major:true,kind:'obj'})});
  }
  if(st.t>=o.baronAt){
    run('baron','바론','baron',()=>0.1,w=>{st.sides[w].baronUntil=st.t+rules.baronBuff;st.sides[w].barons++;o.baronAt=st.t+rules.baronRespawn;
      if(st.firsts.baron===undefined)st.firsts.baron=w;
      aliveOf(st,w).forEach(p=>addGold(p,300));
      log(st,`${st.sides[w].team.short} 바론 처치`,{side:w,major:true,kind:'obj'})});
  }
}

function convert(st,w,r){
  if(matchEnded(st))return;
  const diff=aliveOf(st,w).length-aliveOf(st,1-w).length;
  if(aliveOf(st,w).length<2||diff<1)return;
  let n=Math.max(1,diff-1);
  if(st.t>=st.obj.baronAt&&diff>=2&&st.rng.dec.chance(0.6)){
    st.sides[w].baronUntil=st.t+st.patch.rules.baronBuff; st.sides[w].barons++; st.obj.baronAt=st.t+st.patch.rules.baronRespawn;
    if(st.firsts.baron===undefined)st.firsts.baron=w;
    aliveOf(st,w).forEach(p=>addGold(p,300));
    log(st,`${st.sides[w].team.short} 한타 승리 후 바론 처치`,{side:w,major:true,kind:'obj'}); n--;
  }
  const buffed=st.sides[w].baronUntil>st.t||st.sides[w].elderUntil>st.t;
  const allowNexus=diff>=3||aliveOf(st,1-w).length<=1||(diff>=2&&(buffed||st.t>=30))||(buffed&&st.t>=30);
  for(let i=0;i<n;i++){const res=takeStructure(st,w,{allowInhib:diff>=2,allowNexus:allowNexus&&i>0});if(res==='nexus')return}
  if(allowNexus) takeStructure(st,w,{allowInhib:true,allowNexus:true});
}

function macroTick(st){
  if(matchEnded(st))return;
  const R=st.rng;
  const gold=[0,1].map(i=>st.sides[i].ps.reduce((s,p)=>s+p.goldEarned,0));
  const force=[0,1].map(i=>{const s=st.sides[i], t=s.team.tactics;
    const pr=teamPower(st,i)/(teamPower(st,1-i)||1);
    const u=(pr-1)*2+(aliveOf(st,i).length-aliveOf(st,1-i).length)*0.4+(s.baronUntil>st.t?0.6:0)+(s.elderUntil>st.t?0.8:0)+(t.aggression/100-0.5)*0.6+(gold[i]-gold[1-i])/12000+(st.t>38?0.3:0)+R.info.normal(0,0.2);
    return {u,pr}});
  const att=force[0].u>=force[1].u?0:1, def=1-att;
  if(force[att].u>0.25&&R.dec.chance(0.3+(st.t>35?0.3:0))){
    const dSide=st.sides[def];
    const later=avg(dSide.ps.map(p=>p.champ.kit.late-p.champ.kit.mid))/10;
    const avoid=clamp(0.2+0.3*avg(aliveOf(st,def).map(p=>p.champ.kit.disengage/10))+0.2*visFor(st,def,'mid')+(st.t<30?later*0.5:0)-(force[att].u-0.15)*0.3,0.05,0.7);
    expl(st,`${st.sides[att].team.short} 교전 강제 시도`,[['전력비',force[att].pr],['강제 효용',force[att].u],['상대 회피 확률',avoid]],{result:''});
    if(R.dec.chance(avoid)){
      log(st,`${dSide.team.short} 교전 회피 — ${st.sides[att].team.short} 압박`,{side:att});
      takeStructure(st,att,{allowInhib:force[att].u>0.8});
    } else {
      const deep=LANES.some(l=>laneProgress(dSide,l)>=2);
      const r=fight(st,'mid',att===0?[aliveOf(st,0),aliveOf(st,1)]:[aliveOf(st,0),aliveOf(st,1)],{label:deep?'수성 한타':'중앙 한타',defender:deep?def:undefined});
      if(r) convert(st,r.winner,r);
    }
    return;
  }
  // 픽 시도
  for(const side of [0,1]){
    const s=st.sides[side]; if(!R.dec.chance(0.12+0.18*s.team.tactics.aggression/100))continue;
    const en=aliveOf(st,1-side), al=aliveOf(st,side); if(!en.length||al.length<2)continue;
    const tgt=en.reduce((b,p)=>{const v=(1-at(p,'map_awareness'))+td(p,'split_preference')*0.5;return !b||v>b.v?{p,v}:b},null).p;
    const lane=LANES.find(l=>LANE_ROLES[l].includes(tgt.role))||'mid';
    const p=clamp(0.25+0.4*visFor(st,side,lane)+0.4*(0.7-at(tgt,'map_awareness'))+0.2*td(tgt,'split_preference'),0.05,0.75);
    const ok=R.exec.chance(p);
    expl(st,`${s.team.short} 끊기 시도 → ${tgt.p.name}`,[['시야',visFor(st,side,lane)],['대상 맵 인지',at(tgt,'map_awareness')],['대상 스플릿 성향',td(tgt,'split_preference')]],{prob:p,result:ok?'SUCCESS':'FAIL'});
    if(ok){
      const hunters=al.slice().sort(()=>R.dec.next()-0.5).slice(0,Math.min(3,al.length));
      const help=en.filter(x=>x!==tgt&&R.dec.chance(0.3*at(x,'rotation')));
      const sides=side===0?[hunters,[tgt,...help]]:[[tgt,...help],hunters];
      const r=fight(st,lane,sides,{label:`${LANE_KO[lane]} 끊기`});
      if(r&&r.winner===side) convert(st,side,r);
      break;
    }
  }
}

function towerTick(st){
  if(matchEnded(st))return;
  const R=st.rng;
  if(st.t<8)return;
  for(const side of [0,1]){
    const s=st.sides[side], en=st.sides[1-side];
    for(const l of LANES){
      const idx=en.towers[l].findIndex(x=>x); if(idx<0||idx>=3)continue;
      let p;
      if(st.t<14){
        const push=pushFor(st,side,l); if(push<0.25)continue;
        const enAlive=lanePS(st,1-side,l).filter(x=>alive(st,x)).length;
        p=(0.05+0.18*push)*(enAlive?0.6:1.8);
      } else {
        const pr=teamPower(st,side)/(teamPower(st,1-side)||1);
        const split=s.ps.some(x=>alive(st,x)&&td(x,'split_preference')>0.65&&LANE_ROLES[l].includes(x.role))?0.06*at(s.ps.find(x=>td(x,'split_preference')>0.65),'sidelane'):0;
        p=0.03+0.12*(pr-1)+0.05*(5-aliveOf(st,1-side).length)+split+(s.baronUntil>st.t?0.3:0);
      }
      if(s.heraldCharge){p+=0.35;}
      p*=[1,0.65,0.4][idx];
      if(R.exec.chance(clamp(p,0,0.8))){ if(s.heraldCharge){s.heraldCharge=false;log(st,`${s.team.short} 전령 사용 (${LANE_KO[l]})`,{side})} takeStructure(st,side,{lane:l}); if(matchEnded(st))return; }
    }
    // 억제기가 밀린 팀은 슈퍼 미니언 압박을 받는다
    const inhibDown=LANES.filter(l=>!en.towers[l][3]).length;
    if(inhibDown&&st.t>=20&&R.exec.chance(0.08*inhibDown+(aliveOf(st,1-side).length<=2?0.35:0))) {takeStructure(st,side,{allowInhib:true,allowNexus:aliveOf(st,1-side).length<=3});if(matchEnded(st))return;}
    if(st.t>=22&&s.baronUntil>st.t&&R.exec.chance(0.3)) takeStructure(st,side,{allowInhib:true});
  }
}

function simulateMatch(db,blueId,redId,seed,ctx,quiet){
  const rng=makeStreams(seed);
  const patch=db.patch;
  const d=runDraft(db,[blueId,redId],rng.draft,ctx);
  const mkSide=(tid,i)=>{const team=db.teams[tid],check=validateStartingLineup(db,team);if(!check.ok)throw new Error('Official lineup invalid: '+tid+' '+check.errors.join(', '));const ps=ROLES.map(r=>newPS(starterFor(db,team,r),i,r,d.picks[i][r],patch));
    return {team,ps,tacticContext:matchTacticSnapshot(db,team),color:i===0?'BLUE':'RED',towers:{top:[1,1,1,1],mid:[1,1,1,1],bot:[1,1,1,1]},inhibAt:{top:0,mid:0,bot:0},nexusT:2,nexus:true,dragons:[],soul:false,baronUntil:0,elderUntil:0,herald:0,heraldCharge:false,barons:0,kills:0,towersTaken:0}};
  const st={t:0,eventSecond:0,ending:null,quiet:!!quiet,seed,rng,patch,sides:[mkSide(blueId,0),mkSide(redId,1)],lanePush:{top:0,mid:0,bot:0},vision:{top:0,mid:0,bot:0,dragon:0,baron:0},
    obj:{dragonAt:patch.rules.dragonSpawn,dragonIdx:0,dragonTypes:rng.dec.chance(0.5)?['화염','대지','바다','바람']:['바다','바람','화염','대지'],soul:false,elderAt:0,heraldDone:false,baronAt:patch.rules.baronSpawn,wait:{}},
    jgNext:[2.6+rng.dec.range(0,1),2.6+rng.dec.range(0,1)],mods:[(ctx&&ctx.mods&&ctx.mods[blueId])||0,(ctx&&ctx.mods&&ctx.mods[redId])||0],log:[],expl:[...d.expl],firsts:{},goldHist:[],winner:-1};
  // 경기 당일 컨디션: 기복(consistency)이 낮은 팀일수록 편차가 크다
  st.mods=st.mods.map((m,i)=>m+(i===((ctx&&ctx.firstPick)||0)?BAL.first:0)+(lineupSynergy(db,st.sides[i].team,st.sides[i].ps.map(p=>p.p.id))-50)/1000+rng.mech.normal(0,0.07*(1.25-avg(st.sides[i].ps.map(p=>at(p,'consistency'))))));
  let t;
  for(t=1;t<=MATCH_SIMULATION_MAX_MINUTES;t++){
    st.t=t; st.eventSecond=rng.log.int(0,12);
    incomeTick(st); visionTick(st);
    if(t>=2&&t<14) laningTick(st);
    if(t>=2&&t<16) jungleTick(st);
    objectiveTick(st);
    if(t>=14) macroTick(st);
    if(!matchEnded(st))towerTick(st);
    // 억제기 재생성
    if(!matchEnded(st))for(const s of st.sides) for(const l of LANES) if(!s.towers[l][3]&&s.inhibAt[l]&&t>=s.inhibAt[l]){s.towers[l][3]=true;s.inhibAt[l]=0}
    const g=st.sides.map(s=>s.ps.reduce((a,p)=>a+p.goldEarned,0)); st.goldHist.push(g[0]-g[1]);
    if(matchEnded(st))break;

  }
  if(st.winner<0)throw new Error('Match unresolved: neither nexus was destroyed within '+MATCH_SIMULATION_MAX_MINUTES+' simulated minutes; no official result produced (seed '+seed+')');
  const endSec=st.ending.second;
  st.log.sort((a,b)=>a.t-b.t||a.sec-b.sec);
  return {seed,winner:st.winner,ending:{...st.ending},damageBasis:'effective-aggregate-v1',duration:t+endSec/60,durationStr:fmtTime(t,endSec),draft:d,sides:st.sides,log:st.log,expl:st.expl,goldHist:st.goldHist,firsts:st.firsts};
}
