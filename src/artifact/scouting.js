// ===== LOL GM: Scouting domain =====
// Owns observation knowledge, uncertainty, reports, report ageing and manual scouting actions.

function sameScoutZone(a,b){if(a===b)return true;return Object.values(INTL_ZONES).some(z=>z.includes(a)&&z.includes(b))}
function scoutingPowerForTeam(t){if(!t)return 1;return clamp(.78+facilityScoutingBonus(t)+staffProfile(t).scouting/250,.8,1.46)}
function scoutingPower(db){return scoutingPowerForTeam(managedTeam(db))}
function baseScoutKnowledge(db,p){const me=managedTeam(db);if(!me)return 0;if(p.team===me.id||(p.team&&db.teams[p.team]&&db.teams[p.team].parent===me.id))return 100;if(p.region===me.region)return 22;return sameScoutZone(p.region,me.region)?10:4}
function ensureScoutReport(db,p){db.scout=db.scout||{};let r=db.scout[p.id];if(typeof r==='number')r=db.scout[p.id]={knowledge:r,lastSeenYear:db.year-1,lastSeenDate:null,observations:0,gamesSeen:0,competitions:{},snapshots:[]};if(!r)r=db.scout[p.id]={knowledge:baseScoutKnowledge(db,p),lastSeenYear:null,lastSeenDate:null,observations:0,gamesSeen:0,competitions:{},snapshots:[]};r.competitions=r.competitions||{};r.snapshots=r.snapshots||[];return r}
function knowledge(db,p){if(!db.world)return 100;const base=baseScoutKnowledge(db,p);if(base>=100)return 100;const r=ensureScoutReport(db,p);return Math.round(clamp(Math.max(base,r.knowledge||0),0,98))}
function scoutSample(db,p){let g=0,k=0,d=0,a=0,min=0,dmg=0,rating=0,csd=0,gd=0;const comps=new Set(),seasons=db.world?Object.values(db.world.seasons):[];for(const s of seasons){const st=s.pstats&&s.pstats[p.id];if(!st||!st.g)continue;g+=st.g;k+=st.k;d+=st.d;a+=st.a;min+=st.min||0;dmg+=st.dmg||0;rating+=st.ratingSum||0;csd+=st.csDiff||0;gd+=st.goldDiff||0;comps.add(s.comp)}if(!g&&p.career&&p.career.length){for(const st of p.career.slice(-3)){g+=st.g||0;k+=st.k||0;d+=st.d||0;a+=st.a||0;min+=st.min||0;dmg+=st.dmg||0;rating+=(st.rating||0)*(st.g||0);csd+=st.csDiff||0;gd+=st.goldDiff||0;if(st.comp)comps.add(st.comp)}}return {g,k,d,a,min,dmg,rating:g?rating/g:null,kda:(k+a)/Math.max(1,d),dpm:min?dmg/min:0,csDiff:g?csd/g:0,goldDiff:g?gd/g:0,competitions:[...comps]}}
function scoutingRisk(db,p){const me=managedTeam(db),k=knowledge(db,p),sample=scoutSample(db,p),tm=p.team&&db.teams[p.team];return (p.age<=20?2.5:0)+(me&&p.region!==me.region?2:0)+(tm&&(tm.division||1)===2?2:0)+(sample.g<8?3:sample.g<20?1.5:0)+(100-k)/20}
function obsAttr(db,p,a,k=knowledge(db,p)){if(k>=99)return p.attrs[a];const risk=scoutingRisk(db,p),n=((hashStr(p.id+a)%2001)/1000-1)*((1-k/100)*11+risk*.3);return Math.round(clamp(p.attrs[a]+n,20,99))}
function obsOvr(db,p,raw=false){const k=raw?Math.min(98,Math.max(knowledge(db,p),30)):knowledge(db,p);if(k>=99)return playerOvr(p);const role=p.role,gw=ROLE_GROUP_WEIGHTS[role]||ROLE_GROUP_WEIGHTS.MID,gs=g=>{const keys=ATTR_GROUPS[g].filter(a=>!(a==='smite_execution'&&role!=='JGL')&&!(a==='csing'&&role==='SUP'));return avg(keys.map(a=>obsAttr(db,p,a,k)))};let base=0,w=0;for(const [g,x] of Object.entries(gw)){base+=gs(g)*x;w+=x}base/=w||1;const keys=ROLE_KEY_ATTRS[role]||[],key=keys.length?avg(keys.map(a=>obsAttr(db,p,a,k))):base;return Math.round(clamp(base*.82+key*.18,20,99))}
function observePlayer(db,p,gain,opt={}){if(!p||p.retired)return;const r=ensureScoutReport(db,p),power=scoutingPower(db),diminish=.55+.45*(1-(r.knowledge||0)/100);r.knowledge=clamp((r.knowledge||0)+gain*power*diminish,0,98);r.observations=(r.observations||0)+1;r.gamesSeen=(r.gamesSeen||0)+(opt.games||0);if(opt.comp)r.competitions[opt.comp]=(r.competitions[opt.comp]||0)+(opt.games||1);r.lastSeenDate=db.worldDate;r.lastSeenYear=db.year;r.snapshots.push({year:db.year,date:db.worldDate,estimate:obsOvr(db,p,true),games:scoutSample(db,p).g});r.snapshots=r.snapshots.slice(-8)}

// AI clubs keep their own reports. A parent organization and its owned reserve
// share one scouting department, while unrelated clubs never share observations.
function aiScoutingOwner(db,t){return t?(parentTeamOf(db,t)||t):null}
function ensureAiScoutingState(db,t){
  const owner=aiScoutingOwner(db,t);if(!owner)return null;
  owner.scoutingState=owner.scoutingState||{homeRegion:owner.region,reports:{},competitions:{}};
  owner.scoutingState.homeRegion=owner.region;
  owner.scoutingState.reports=owner.scoutingState.reports||{};
  owner.scoutingState.competitions=owner.scoutingState.competitions||{};
  return owner.scoutingState;
}
function aiBaseScoutKnowledge(db,t,p){
  const owner=aiScoutingOwner(db,t);if(!owner||!p)return 0;
  if(p.team===owner.id||(p.team&&db.teams[p.team]?.parent===owner.id))return 100;
  if(p.region===owner.region)return 18;
  return sameScoutZone(p.region,owner.region)?7:3;
}
function ensureAiScoutReport(db,t,p){
  const state=ensureAiScoutingState(db,t),base=aiBaseScoutKnowledge(db,t,p);
  if(!state)return null;
  let r=state.reports[p.id];
  if(!r)r=state.reports[p.id]={knowledge:base,ability:null,potential:null,
    observations:0,gamesSeen:0,lastSeenDate:null,lastSeenYear:null,staleYears:0,
    competitions:{},snapshots:[]};
  r.knowledge=Math.max(base,r.knowledge||0);r.competitions=r.competitions||{};
  r.snapshots=r.snapshots||[];return r;
}
function aiScoutUncertainty(db,t,p,k,stale=0){
  const perf=recentMarketPerformance(db,p),sample=Math.min(30,perf.games),
    foreign=p.region!==aiScoutingOwner(db,t)?.region,
    sampleRisk=sample<6?3:sample<15?1.5:0;
  return Math.round(clamp((100-k)/12+(foreign?1.5:.5)+sampleRisk+stale*1.25,1,12)*10)/10;
}
function aiPublicMarketObservation(db,p,t){
  const perf=recentMarketPerformance(db,p),sample=Math.min(30,perf.games),
    foreign=!isLocalPlayer(p,t.region),uncertainty=(foreign?5:3)+(sample<6?3:sample<15?1.5:0),
    noise=((hashStr(t.id+'|'+p.id+'|'+db.year+'|public')%2001)/1000-1),
    performance=(perf.rating-6.5)*4+Math.min(3,perf.intl*.08)+Math.min(3,perf.titles*.8),
    ability=Math.round(clamp((p.reputation??60)+performance+noise*uncertainty,20,99)),
    ageUpside=p.age<=19?8:p.age<=21?5:p.age<=23?3:1,
    pn=((hashStr(t.id+'|'+p.id+'|'+db.year+'|public-potential')%2001)/1000-1),
    potential=Math.round(clamp(ability+ageUpside+pn*(foreign?4:2.5),ability,99));
  return {ability,potential,uncertainty:Math.round(uncertainty*10)/10,
    knowledge:aiBaseScoutKnowledge(db,t,p),source:'public',lastSeenDate:null,staleYears:0};
}
function initialAiMarketDossierSignal(db,p,t){
  // Preserve the accepted first-season auction signal exactly, but create it
  // once inside the scouting domain instead of re-reading hidden ability on
  // every market comparison.
  const perf=recentMarketPerformance(db,p),sample=Math.min(30,perf.games),
    foreign=!isLocalPlayer(p,t.region),
    uncertainty=(foreign?4.5:2.5)+(sample<6?3:sample<15?1.5:0),
    n=((hashStr(t.id+'|'+p.id+'|'+db.year+'|ability')%2001)/1000-1),
    ability=Math.round(clamp(playerOvr(p)+n*uncertainty,20,99)),
    n2=((hashStr(t.id+'|'+p.id+'|'+db.year+'|potential')%2001)/1000-1),
    ageUpside=p.age<=19?9:p.age<=21?6:p.age<=23?3:1,
    potential=Math.round(clamp(ability+ageUpside+n2*(foreign?5:3)+
      (p.reputation-ability)*.08,ability,99));
  return {ability,potential,uncertainty:Math.round(uncertainty*10)/10};
}
function seedInitialAiScoutReport(db,t,p){
  const owner=aiScoutingOwner(db,t),r=ensureAiScoutReport(db,owner,p);
  if(!owner||!r||r.ability!=null&&r.potential!=null)return r;
  const signal=initialAiMarketDossierSignal(db,p,owner);
  r.ability=signal.ability;r.potential=signal.potential;
  r.uncertainty=signal.uncertainty;r.source='founding_dossier';
  r.dossierYear=db.year;r.lastSeenDate=db.worldDate;r.lastSeenYear=db.year;r.staleYears=0;
  r.snapshots.push({year:db.year,date:db.worldDate,knowledge:Math.round(r.knowledge||0),
    ability:r.ability,potential:r.potential,uncertainty:r.uncertainty,source:r.source});
  r.snapshots=r.snapshots.slice(-8);
  return r;
}
function observeAiPlayer(db,t,p,gain,opt={}){
  const owner=aiScoutingOwner(db,t);if(!owner||!p||p.retired||
    owner.id===managedTeamId(db)||aiBaseScoutKnowledge(db,owner,p)>=100)return null;
  const r=ensureAiScoutReport(db,owner,p),before=r.knowledge||0,
    power=scoutingPowerForTeam(owner),diminish=.55+.45*(1-before/100);
  r.knowledge=clamp(before+gain*power*diminish,0,98);r.source='scouted';
  r.observations=(r.observations||0)+1;r.gamesSeen=(r.gamesSeen||0)+(opt.games||0);
  r.lastSeenDate=db.worldDate;r.lastSeenYear=db.year;r.staleYears=0;
  if(opt.comp){r.competitions[opt.comp]=(r.competitions[opt.comp]||0)+(opt.games||1);
    ensureAiScoutingState(db,owner).competitions[opt.comp]=db.year}
  const uncertainty=aiScoutUncertainty(db,owner,p,r.knowledge,0),
    obs=r.observations,
    an=((hashStr(owner.id+'|'+p.id+'|'+db.year+'|'+obs+'|ability')%2001)/1000-1),
    pn=((hashStr(owner.id+'|'+p.id+'|'+db.year+'|'+obs+'|potential')%2001)/1000-1),
    signalAbility=Math.round(clamp(playerOvr(p)+an*uncertainty,20,99)),
    signalPotential=Math.round(clamp((p.pot??signalAbility)+pn*uncertainty*1.15,
      signalAbility,99)),weight=r.ability==null?1:clamp((r.knowledge-before)/18,.12,.62);
  r.ability=r.ability==null?signalAbility:Math.round(r.ability*(1-weight)+signalAbility*weight);
  r.potential=r.potential==null?signalPotential:
    Math.round(clamp(r.potential*(1-weight)+signalPotential*weight,r.ability,99));
  r.uncertainty=uncertainty;
  r.snapshots.push({year:db.year,date:db.worldDate,knowledge:Math.round(r.knowledge),
    ability:r.ability,potential:r.potential,uncertainty});
  r.snapshots=r.snapshots.slice(-8);return r;
}
function aiScoutReport(db,t,p){
  const owner=aiScoutingOwner(db,t);if(!owner)return aiPublicMarketObservation(db,p,t);
  let r=owner.scoutingState?.reports?.[p.id];
  if(db.world?.phase==='initial_roster'&&
    (!r||r.ability==null||r.potential==null))r=seedInitialAiScoutReport(db,owner,p);
  if(!r)return aiPublicMarketObservation(db,p,owner);
  const base=aiBaseScoutKnowledge(db,owner,p),k=Math.round(clamp(Math.max(base,r.knowledge||0),0,98));
  if(r.ability==null||r.potential==null)return aiPublicMarketObservation(db,p,owner);
  const uncertainty=r.source==='founding_dossier'&&!(r.staleYears||0)&&
    Number.isFinite(r.uncertainty)?r.uncertainty:
    aiScoutUncertainty(db,owner,p,k,r.staleYears||0);
  return {ability:r.ability,potential:Math.max(r.ability,r.potential),
    uncertainty,knowledge:k,source:r.source||'scouted',
    lastSeenDate:r.lastSeenDate,staleYears:r.staleYears||0,
    observations:r.observations||0,gamesSeen:r.gamesSeen||0};
}
function ageScoutReports(db){
  for(const [id,r0] of Object.entries(db.scout||{})){const p=db.players[id];if(!p||p.retired){delete db.scout[id];continue}const r=typeof r0==='number'?ensureScoutReport(db,p):r0,base=baseScoutKnowledge(db,p),young=p.age<=20?1.12:1,me=managedTeam(db),decay=8*young+(me&&p.region===me.region?0:3);r.knowledge=Math.max(base,Math.round((r.knowledge||base)-decay));r.staleYears=Math.max(0,db.year-(r.lastSeenYear??db.year))}
  const roots=activeTeams(db,null,1).filter(t=>!t.parent&&t.id!==managedTeamId(db));
  for(const t of roots){
    const state=ensureAiScoutingState(db,t);
    for(const [id,r] of Object.entries(state.reports)){
      const p=db.players[id];if(!p||p.retired){delete state.reports[id];continue}
      const base=aiBaseScoutKnowledge(db,t,p),young=p.age<=20?1.12:1,
        decay=Math.round((p.region===t.region?7:10)*young);
      r.knowledge=Math.max(base,Math.round((r.knowledge||base)-decay));
      r.staleYears=Math.max(0,db.year-(r.lastSeenYear??db.year));
      r.uncertainty=aiScoutUncertainty(db,t,p,r.knowledge,r.staleYears);
    }
  }
}
function scoutFromDay(db,s,day){
  const me=managedTeamId(db),comp=db.competitions[s.comp],games=m=>m.res?m.res.games.length:1;
  if(me){
    const myR=db.teams[me].region,visible=comp.international||s.region===myR;
    if(visible)for(const m of day.matches){
      const involved=m.a===me||m.b===me,gain=involved?9:comp.international?4.5:(s.div===2?2.5:3.2);
      for(const tid of [m.a,m.b])for(const role of ROLES){const p=starterFor(db,db.teams[tid],role);if(p)observePlayer(db,p,gain,{comp:s.comp,games:games(m)})}
    }
  }
  const observers=activeTeams(db,null,1).filter(t=>!t.parent&&t.id!==me);
  for(const m of day.matches){
    const participants=[m.a,m.b],rows=[];
    for(const tid of participants)for(const role of ROLES){const p=starterFor(db,db.teams[tid],role);if(p)rows.push(p)}
    for(const t of observers){
      const involved=participants.includes(t.id),home=s.region===t.region;
      if(!home&&!(comp.international&&involved))continue;
      const gain=involved?5:comp.international?3.4:(s.div===2?1.4:2.2);
      for(const p of rows)observeAiPlayer(db,t,p,gain,{comp:s.comp,games:games(m)});
    }
  }
}
function scoutAbilityRange(db,p){const k=knowledge(db,p),c=obsOvr(db,p),w=Math.max(1,Math.ceil((100-k)/10+scoutingRisk(db,p)*.35));return [Math.max(20,c-w),Math.min(99,c+w)]}
function scoutPotentialRange(db,p){const k=knowledge(db,p),risk=scoutingRisk(db,p),noise=((hashStr(p.id+'pot')%2001)/1000-1)*Math.max(1,(100-k)/13),center=clamp(p.pot+noise,playerOvr(p),99),w=Math.max(3,Math.ceil((100-k)/8+risk*.45));return [Math.max(playerOvr(p),Math.round(center-w)),Math.min(99,Math.round(center+w))]}
function scoutGrowthTrend(p){const a=(p.developmentTrail||[]).slice(-3);if(a.length<2)return {delta:null,label:'표본 부족'};const d=a[a.length-1].ovr-a[0].ovr;return {delta:d,label:d>=3?'빠른 상승':d>=1?'상승':d<=-2?'하락':d<0?'소폭 하락':'정체'}}
function scoutReport(db,p){const r=ensureScoutReport(db,p),sample=scoutSample(db,p),ability=scoutAbilityRange(db,p),potential=scoutPotentialRange(db,p),growth=scoutGrowthTrend(p),champions=Object.entries(p.pool||{}).sort((a,b)=>b[1].mastery-a[1].mastery).slice(0,5).map(([id,v])=>({id,mastery:Math.round(clamp(v.mastery+((hashStr(p.id+id)%1001)/1000-.5)*(100-knowledge(db,p))*.12,20,99))}));return {knowledge:knowledge(db,p),ability,potential,sample,growth,champions,lastSeenDate:r.lastSeenDate,staleYears:r.staleYears||0,observations:r.observations||0,gamesSeen:r.gamesSeen||0}}
function scoutPlayers(db,ids,amt,cost){const t=myT(db);if(t.finance.cash<cost)return '보유 자금이 부족합니다';t.finance.cash=Math.round((t.finance.cash-cost)*10)/10;recordFinancePrepaid(t,'scoutingExpense',cost);for(const id of ids){const p=db.players[id];if(p){observePlayer(db,p,Math.min(24,amt*.55),{games:0,comp:'manual'});syncRecruitmentObservation(db,id)}}return `스카우팅 보고서 갱신 (${money(cost)})`}
