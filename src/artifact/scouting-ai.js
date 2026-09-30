// ===== LOL GM: AI scouting ownership / market observation =====
// Split from scouting.js so manager reports and AI organization memory remain
// separately maintainable while sharing the same scouting hooks.

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
  r.snapshots=r.snapshots.slice(-8);return r;
}
function observeAiPlayer(db,t,p,gain,opt={}){
  const owner=aiScoutingOwner(db,t);if(!owner||!p||p.retired||
    owner.id===managedTeamId(db)||aiBaseScoutKnowledge(db,owner,p)>=100)return null;
  const r=ensureAiScoutReport(db,owner,p),before=r.knowledge||0,
    power=scoutingPowerForTeam(owner),diminish=.55+.45*(1-before/100);
  r.knowledge=clamp(before+gain*power*diminish,0,98);r.source='scouted';
  r.observations=(r.observations||0)+1;r.gamesSeen=(r.gamesSeen||0)+(opt.games||0);
  r.lastSeenDate=db.worldDate;r.lastSeenYear=db.year;r.staleYears=0;
  if(opt.comp){
    r.competitions[opt.comp]=(r.competitions[opt.comp]||0)+(opt.games||1);
    ensureAiScoutingState(db,owner).competitions[opt.comp]=db.year;
  }
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
  const base=aiBaseScoutKnowledge(db,owner,p),
    k=Math.round(clamp(Math.max(base,r.knowledge||0),0,98));
  if(r.ability==null||r.potential==null)return aiPublicMarketObservation(db,p,owner);
  const uncertainty=r.source==='founding_dossier'&&!(r.staleYears||0)&&
    Number.isFinite(r.uncertainty)?r.uncertainty:
    aiScoutUncertainty(db,owner,p,k,r.staleYears||0);
  return {ability:r.ability,potential:Math.max(r.ability,r.potential),
    uncertainty,knowledge:k,source:r.source||'scouted',
    lastSeenDate:r.lastSeenDate,staleYears:r.staleYears||0,
    observations:r.observations||0,gamesSeen:r.gamesSeen||0};
}
function ageAiScoutReports(db){
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
function scoutAiFromDay(db,s,day){
  const me=managedTeamId(db),comp=db.competitions[s.comp],
    games=m=>m.res?m.res.games.length:1,
    observers=activeTeams(db,null,1).filter(t=>!t.parent&&t.id!==me);
  for(const m of day.matches){
    const participants=[m.a,m.b],rows=[];
    for(const tid of participants)for(const role of ROLES){
      const p=starterFor(db,db.teams[tid],role);if(p)rows.push(p);
    }
    for(const t of observers){
      const involved=participants.includes(t.id),home=s.region===t.region;
      if(!home&&!(comp.international&&involved))continue;
      const gain=involved?5:comp.international?3.4:(s.div===2?1.4:2.2);
      for(const p of rows)observeAiPlayer(db,t,p,gain,{comp:s.comp,games:games(m)});
    }
  }
}
