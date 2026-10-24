// ===== LOL GM: Season / competition orchestration =====
// Owns league and international season construction,
// managed official-match pauses and day-by-day world competition execution.

// 그 해 마지막 스플릿 시즌 (승강·시상·목표 판정 기준)
function finalSeason(w,R,div=1){let best=null;for(const s of Object.values(w.seasons))if(s.region===R.id&&(s.div||1)===div&&s.split&&(!best||s.split>best.split))best=s;return best}

// ---------- 리그/시즌 구성 ----------
function divName(R){
  if(R.tier2Short)return R.tier2Short;
  // Legacy national defaults gain display aliases without rewriting IDs/history.
  const preset=REGION_PRESETS[R.id];
  if(preset&&R.short===preset.short)return preset.tier2Short;
  const legacy={BR:'CBLOL',LA:'LLA',VN:'VCS',TW:'PCS',SEA:'SEAL',TR:'TCL',ME:'AL'};
  if(preset&&R.short===legacy[R.id])return preset.tier2Short;
  // Custom/founded leagues keep their own distinct identity.
  return `${R.short||R.leagueName} CL`;
}
function leagueComp(db,rid,div=1){
  const R=db.regions[rid], teams=activeTeams(db,rid,div).filter(t=>div===1||true).map(t=>t.id);
  return {id:div===2?R.short+'2':R.short,name:div===2?divName(R):R.leagueName,short:div===2?divName(R):R.short,region:rid,div,teams,rules:{fearless:true,staffRegistration:R.staffRegistration||null},stages:leagueStages(R,teams.length,div)};
}
function startWorldSeason(db,myTeam,seed){
  normalizeInternationalConfig(db.worldConfig);
  const medicalRolloverDate=`${db.year}-01-06`;
  medicalOffseasonRecovery(db,medicalRolloverDate);
  if(!db.worldDate||db.worldDate<medicalRolloverDate)setWorldCalendarDate(db,medicalRolloverDate);
  setManagedTeam(db,myTeam);
  activateLocalChoices(db,db.year);
  const regs=Object.values(db.regions), I=db.worldConfig.internationals, maxK=Math.max(...regs.map(r=>r.splits||1));
  const steps=[];
  const intlSteps=tm=>{const tops=I.filter(i=>i.timing===tm&&i.tier!=='low').sort(internationalEventPriority),lows=I.filter(i=>i.timing===tm&&i.tier==='low');
    const out=tops.map(i=>({kind:'intl',ids:[i.id],label:i.name}));
    if(lows.length){if(out.length){const L=out[out.length-1];L.ids.push(...lows.map(i=>i.id));L.label+=` · ${lows.map(i=>i.name).join(' · ')}`}else out.push({kind:'intl',ids:lows.map(i=>i.id),label:lows.map(i=>i.name).join(' · ')})}
    return out};
  // 3스플릿제: 스플릿1(윈터) → 퍼스트 스탠드 → 스플릿2(스프링) → MSI → 스플릿3(서머) → 월즈. 스플릿이 적은 리그는 뒤쪽 스플릿만 치른다
  const tim={1:'early',2:'mid',3:'end'};
  for(let sp=1;sp<=3;sp++){
    if(regs.some(r=>(r.splits||1)>=4-sp))steps.push({kind:'league',split:sp,label:maxK===1?'정규 시즌':SPLIT_NAME[sp]});
    steps.push(...intlSteps(tim[sp]));
  }
  const manage=db.world?db.world.manage:(db.worldConfig.manage||'manual');
  db.world={year:db.year,seed,manage,phase:'season',seasons:{},steps,step:-1,report:null,pendingOfficial:null,lastDate:`${db.year}-01-07`,lastDailyTick:null,majorPatchEvents:[],offers:[],marketLog:[]};
  db.world.registrationVersion=1;initializeOfficialRegistrations(db);
  seasonPatch(db,`${db.year}-01-02`,new RNG(seed+db.year,'patch'));
  setGoals(db);
  advanceStep(db);
}
function seasonLastDate(s){return s.days[s.days.length-1].date}
// 해외 리그 요약에도 저장 계약의 공개 경기 기록과 당시 수동 밴픽 근거를 보존한다.
function compactSeason(db,s){
  if(s.compact)return; const managed=db.teams&&db.teams[managedTeamId(db)],my=managed&&managed.region;
  if(!my||!s.region||s.region===my||db.competitions?.[s.comp]?.international)return;
  const prepared=[];
  for(const d of s.days)for(const m of d.matches)if(m.res)prepared.push([m.res,seriesResultForSave(m.res,true).games]);
  for(const [r,games] of prepared){r.games=games;delete r.tac;r.lite=true}
  s.compact=true;
}
function advanceStep(db){
  const w=db.world;
  for(const s of Object.values(w.seasons))if(s.done)compactSeason(db,s);
  for(const s of Object.values(w.seasons)){const d=seasonLastDate(s);if(d>w.lastDate)w.lastDate=d}
  while(true){
    w.step++;
    if(w.step>=w.steps.length){
      w.phase='offseason';
      processLoanDaily(db);
      initOffseasonContractWindow(db);
      news(db,`${w.year} 시즌 일정이 모두 끝났습니다`);
      return;
    }
    const st=w.steps[w.step], start=addDays(w.lastDate,st.kind==='intl'?18:(w.step===0?7:14));
    if(st.kind==='league'){
      if(st.split>1&&w.step>0){
        // The next bracket is prepared now, but its large patch must not be
        // applied weeks early while the calendar still sits in the break.
        w.majorPatchEvents=w.majorPatchEvents||[];
        w.majorPatchEvents.push({date:start,step:w.step,split:st.split});
      }
      let any=false;
      for(const R of Object.values(db.regions)){
        if((R.splits||1)<4-st.split)continue;
        for(const div of R.div2?[1,2]:[1]){
          if(activeTeams(db,R.id,div).length<2)continue;
          const comp=leagueComp(db,R.id,div); db.competitions[comp.id]=comp;
          const key=comp.id+'-'+st.split, s=newSeason(db,comp.id,w.year,`${w.seed}/${w.year}/${key}`,start,key);
          s.key=key;s.split=st.split;s.region=R.id;s.div=div;s.step=w.step;s.label=(R.splits||1)>1?splitName(R,st.split):'';
          w.seasons[key]=s;any=true;
        }
      }
      if(any){aiReviewCompetitionStaffRegistrations(db);return}
    } else {let any=false;const taken=new Set();for(const id of (st.ids||[st.id]))if(startInternational(db,id,start,taken))any=true;if(any){aiReviewCompetitionStaffRegistrations(db);return}}
  }
}
function placements(db,s){
  if(disqualifiedFinalResult(s))return administrativeTournamentPlacements(db,s);
  const comp=db.competitions[s.comp];const reg=standings(db,s,comp.stages[0].id).map(x=>x.tid);
  const out=[s.champion,s.runnerUp].filter(Boolean);for(const t of reg)if(!out.includes(t))out.push(t);return out;
}
function regionPower(db,R){const h=(db.global&&db.global.power||{})[R.id];return h!==undefined?h:R.strength}
function teamStrength(db,tid){const t=db.teams[tid];return avg(ROLES.map(r=>{const p=starterFor(db,t,r);return p?playerRoleRating(p,r):40}))}
function startInternational(db,id,start,taken=new Set()){
  const rollback=pendingOfficialUndo(db),previousTaken=[...taken];let committed=false;
  try{
  normalizeInternationalConfig(db.worldConfig);
  id=canonicalInternationalId(id);
  const w=db.world, it=db.worldConfig.internationals.find(x=>x.id===id); if(!it)return false;
  // A resumed old bracket retains its original key/seed and must not be
  // replaced by a second canonical bracket in the same season.
  if(Object.values(w.seasons||{}).some(s=>s.year===w.year&&canonicalInternationalId(s.comp)===id))return false;
  const presetEntries=presetInternationalEntries(db,it,taken);
  const legacyExcluded=presetEntries?null:internationalEntryExclusions(db,it,taken);
  const regs=presetEntries?[]:Object.values(db.regions).filter(R=>!it.zone||(INTL_ZONES[it.zone]||[]).includes(R.id)).sort((a,b)=>regionPower(db,b)-regionPower(db,a));
  const topSlots=R=>{const top=db.worldConfig.internationals.find(x=>x.tier!=='low'&&x.timing===it.timing&&x.entry==='slots');return top?Math.max(1,Math.ceil(R.slots*(top.ratio||1))):R.slots};
  const lists=regs.map(R=>{
    if(it.entry==='champions'){
      // Tournament-champion invitations always honor the *last split winner*,
      // even in a region where World slots use accumulated season points.
      const champion=recentSplitChampion(db,R);
      return champion?[champion]:regionPlacements(db,R).slice(0,1);
    }
    if(it.entry==='slots')return regionPlacements(db,R).slice(0,Math.max(1,Math.ceil(R.slots*(it.ratio||1))));
    const per=(it.per||2)*(regs.length<=2?2:1);
    if(it.entry==='div2'&&R.div2){const s=[3,2,1].map(sp=>w.seasons[R.short+'2-'+sp]).find(s=>s&&s.done);if(s)return placements(db,s).filter(t=>!legacyExcluded.has(t)).slice(0,per)}
    // 'next' (또는 하부 리그 없는 지역): 상위 대회 진출권 바로 다음 순위부터, 같은 기간 다른 대회에 이미 나간 팀은 건너뜀
    return regionPlacements(db,R).slice(topSlots(R)).filter(t=>!legacyExcluded.has(t)).slice(0,per);
  }).map(l=>l.filter(t=>!legacyExcluded.has(t)));
  const teams=presetEntries||[];for(let k=0;k<6;k++)for(const l of lists)if(l[k])teams.push(l[k]);
  if(teams.length<4)return false;
  teams.forEach(t=>taken.add(t));
  db.competitions[id]={id,name:it.name,short:it.short||id,teams,rules:{fearless:true,staffRegistration:it.staffRegistration||null},international:true,tier:it.tier||'top',stages:intlStages(it.format,teams,it.bo,it)};
  const s=newSeason(db,id,w.year,`${w.seed}/${w.year}/${id}`,start,id);
  s.key=id;s.label='';s.step=w.step;w.seasons[id]=s;
  // A region can later move or merge. Preserve the participant's event-time
  // region on the season so archived coefficients never inherit a new region.
  s.internationalRegionSnapshot=Object.fromEntries(teams.map(t=>[t,db.teams[t]?.region||null]));
  s.internationalPeriodSnapshot={phase:it.phase??null,timing:it.timing??null};
  s.stagesInfo=db.competitions[id].stages.map(x=>x.name).join(' → ');
  news(db,`${it.name} 개막 — ${teams.length}팀 참가 (${INTL_FORMATS[it.format]||it.format})`);
  committed=true;return true;
  }finally{if(!committed){rollback();taken.clear();for(const t of previousTaken)taken.add(t)}}
}
const INTERNATIONAL_POLICY_DEFAULTS={version:1,windowYears:3,weights:{
  FIRST_STAND:1,MID_SEASON_INVITATIONAL:2,EASTERN_CUP:1,WESTERN_CUP:1,
  WORLD_CHAMPIONSHIP:3,MASTERS:2,OPEN:1
},placementPoints:{champion:8,runnerUp:6,topFour:4,topEight:2,participant:1}};
function internationalPolicy(db){
  normalizeInternationalConfig(db.worldConfig);
  const c=db.worldConfig.internationalPolicy||{};
  db.worldConfig.internationalPolicy={version:1,windowYears:3,
    weights:{...INTERNATIONAL_POLICY_DEFAULTS.weights,...(c.weights||{})},
    placementPoints:{...INTERNATIONAL_POLICY_DEFAULTS.placementPoints,...(c.placementPoints||{})}};
  return db.worldConfig.internationalPolicy;
}
function recordInternationalResults(db,w){
  const policy=internationalPolicy(db),history=db.global.internationalResults||[],known=new Set(history.map(x=>x.eventId));
  for(const s of Object.values(w.seasons||{})){
    const comp=db.competitions[s.comp];if(!comp?.international||!s.done||!s.champion)continue;
    const eventId=`${s.year}:${s.id||s.key||s.comp}`;if(known.has(eventId))continue;
    // Older saves may contain completed events without event-time regions.
    // Do not invent their history from today's team regions or policy.
    if(!s.internationalRegionSnapshot||comp.teams.some(teamId=>!Object.hasOwn(s.internationalRegionSnapshot,teamId)))continue;
    const base=placements(db,s),rankOrder=comp.teams.filter(t=>t!==s.champion&&t!==s.runnerUp)
      .sort((a,b)=>elimReach(db,s,b)-elimReach(db,s,a)||(base.indexOf(a)-base.indexOf(b)));
    const ordered=[...new Set([s.champion,s.runnerUp,...rankOrder])].filter(t=>comp.teams.includes(t));
    const teams=ordered.map((teamId,i)=>({teamId,regionId:s.internationalRegionSnapshot[teamId],
      rank:i+1,points:i===0?policy.placementPoints.champion:i===1?policy.placementPoints.runnerUp:
        i<4?policy.placementPoints.topFour:i<8?policy.placementPoints.topEight:policy.placementPoints.participant}));
    history.push({eventId,year:s.year,competitionId:s.comp,weight:Math.max(0,Number(policy.weights[canonicalInternationalId(s.comp)]??1)),teams});known.add(eventId);
  }
  db.global.internationalResults=history;
}
function internationalRegionRatings(db,year){
  const from=year-internationalPolicy(db).windowYears+1,rollup={};
  for(const event of db.global.internationalResults||[]){if(event.year<from||event.year>year||!Number.isFinite(event.weight)||event.weight<=0)continue;
    const regions={};for(const x of event.teams||[]){if(!x.regionId)continue;const r=regions[x.regionId]||(regions[x.regionId]={p:0,n:0});r.p+=x.points;r.n++}
    for(const [id,r] of Object.entries(regions)){const v=rollup[id]||(rollup[id]={score:0,weight:0});
      v.score+=event.weight*r.p/r.n/2;v.weight+=event.weight;}}
  return Object.fromEntries(Object.entries(rollup).map(([id,v])=>[id,Math.round(v.score/v.weight*100)/100]));
}
function latestWorldsRank(db,id,year){
  const from=year-internationalPolicy(db).windowYears+1;
  const rows=(db.global.internationalResults||[]).filter(e=>e.year>=from&&e.year<=year&&isWorldChampionshipId(e.competitionId));
  if(!rows.length)return Infinity;const newestYear=Math.max(...rows.map(e=>e.year)),e=rows.filter(x=>x.year===newestYear).sort((a,b)=>a.eventId.localeCompare(b.eventId)).at(-1);
  return Math.min(...(e.teams||[]).filter(x=>x.regionId===id).map(x=>x.rank),Infinity);
}
function compareInternationalRegions(db,ratings,a,b,year=db.world?.year){
  const d=(ratings[b.id]||0)-(ratings[a.id]||0);if(Math.abs(d)>1e-9)return d;
  const w=latestWorldsRank(db,a.id,year)-latestWorldsRank(db,b.id,year);return w||a.id.localeCompare(b.id);
}
function activeSeasons(db){return Object.values(db.world.seasons).filter(s=>!s.done)}
function nextDate(db){let next=null;for(const s of Object.values(db.world.seasons)){if(s.done)continue;const d=s.days[s.cur].date;if(next===null||d<next)next=d}return next}
function nextTeamMatch(db,tid){
  let best=null;for(const s of Object.values(db.world?.seasons||{})){if(s.done)continue;for(let i=s.cur;i<s.days.length;i++){const d=s.days[i],m=d.matches.find(x=>!x.res&&(x.a===tid||x.b===tid));if(m&&(!best||d.date<best.date)){best={date:d.date,localDate:m.localDate||d.date,time:m.time||null,timeZone:m.timeZone||null,utcAt:m.utcAt||null,opponent:m.a===tid?m.b:m.a,comp:s.comp};break}}}return best;
}
function daysUntil(db,date){return date?Math.max(0,Math.ceil((new Date(date)-new Date(db.worldDate))/86400000)):99}
function trainingRecommendation(db,t){
  const next=nextTeamMatch(db,t.id),days=daysUntil(db,next?.date),roster=t.roster.map(id=>db.players[id]).filter(Boolean),fat=avg(roster.map(p=>p.fatigue||0)),cond=avg(roster.map(p=>p.condition??96));
  const scrim=days>=1&&fat<54&&cond>70;return {scrim,next,days,fat,cond};
}
function pendingOfficialRefs(db,q){
  const s=db.world?.seasons?.[q?.seasonKey],day=s?.days?.[s.cur],m=day?.matches?.find(x=>x.id===q.matchId);
  if(!s||!m||m.res)return null;const comp=db.competitions?.[s.comp],cfgIdx=Array.isArray(comp?.stages)?comp.stages.findIndex(x=>x?.id===day.stage):-1,cfg=comp?.stages?.[cfgIdx];if(!cfg)return null;
  return {s,day,m,comp,cfg,cfgIdx};
}
// A pending series belongs to its official fixture, not the former manager.
// Missing fixture/date metadata blocks processing instead of inventing it.
function pendingOfficialControl(db){
  const w=db.world,p=w?.pendingOfficial,q=p?.queue?.[0],refs=q&&pendingOfficialRefs(db,q);
  if(!q)return {manual:false,error:null,refs:null};
  if(!refs)return {manual:false,error:'대기 중인 공식 경기 정보를 확인할 수 없습니다.',refs:null};
  if(!['manual','ai'].includes(w.manage))return {manual:false,error:'현재 운영 방식 정보를 확인할 수 없습니다.',refs};
  if(w.phase!=='season'||w.year!==db.year||p.date!==db.worldDate||q.date!==p.date||refs.day.date!==p.date)return {manual:false,error:'대기 경기의 날짜와 현재 시즌이 다릅니다.',refs};
  if([refs.m.a,refs.m.b].some(id=>!db.teams?.[id]||!db.regions?.[db.teams[id].region]))return {manual:false,error:'대기 경기 구단의 지역 정보를 확인할 수 없습니다.',refs};
  if([refs.m.a,refs.m.b].some(id=>db.teams[id].active===false))return {manual:false,error:'대기 경기에 비활성 구단이 포함되어 있습니다.',refs};
  if(q.session&&(q.session.a!==refs.m.a||q.session.b!==refs.m.b||q.session.bestOf!==refs.m.bo||q.session.seed!==`${refs.s.seed}/${refs.s.year}/${refs.m.id}`||q.session.opt?.compId!==refs.s.comp||q.session.opt?.metaContext?.season!==refs.s.id))return {manual:false,error:'대기 세션과 공식 경기 정보가 다릅니다.',refs};
  const t=managedTeam(db),manual=w.manage==='manual'&&!w.fired&&t&&t.active!==false&&(t.id===refs.m.a||t.id===refs.m.b);
  return {manual:!!manual,error:null,refs};
}
// Preserve object identity as well as values if this one-set handoff fails.
// Previously completed sets are outside the operation and remain recorded.
function pendingOfficialUndo(db){
  // Capture the full reachable graph in the same depth-first property order.
  // Primitive values are retained in rows without recursive calls. The stack
  // contains only objects; reverse push preserves getter/alias visit order.
  const seen=new Set(),rows=[],pending=[db];
  while(pending.length){
    const o=pending.pop();if(!o||typeof o!=='object'||seen.has(o))continue;
    seen.add(o);const keys=Object.keys(o),base=rows.length;
    rows.push(o,keys,null);
    for(let i=0;i<keys.length;i++)rows.push(o[keys[i]]);
    rows[base+2]=Array.isArray(o)?o.length:null;
    for(let i=keys.length-1;i>=0;i--){const value=rows[base+3+i];if(value&&typeof value==='object')pending.push(value);}
  }
  return ()=>{
    for(let at=0;at<rows.length;){
      const o=rows[at],keys=rows[at+1],length=rows[at+2],kept=new Set(keys);
      for(const key of Object.keys(o))if(!kept.has(key))delete o[key];
      for(let i=0;i<keys.length;i++)o[keys[i]]=rows[at+3+i];
      if(length!==null)o.length=length;
      at+=keys.length+3;
    }
  };
}

function pendingOfficialSession(db){
  const p=db.world&&db.world.pendingOfficial,q=p&&p.queue&&p.queue[0];if(!q)return null;
  const refs=pendingOfficialRefs(db,q);if(!refs)return null;
  if(!q.session)q.session=scheduledSeriesSession(db,refs.s,refs.m).session;
  return {p,q,refs,session:q.session};
}
function pendingOfficialSelectionSetup(db){
  const x=pendingOfficialSession(db);if(!x)return null;
  const me=managedTeamId(db),prompt=seriesSelectionPrompt(db,x.session,me);if(!prompt)return null;
  const last=x.session.games[x.session.games.length-1]||null,score=[x.session.wins[x.session.a],x.session.wins[x.session.b]];
  return {...x.refs,prompt,session:x.session,game:x.session.g,score,lastGame:last,homeTeam:x.refs.m.a};
}
function applyPendingOfficialSelection(db,choice){
  const x=pendingOfficialSession(db);if(!x)throw new Error('No pending official selection');
  return seriesApplyManagedSelection(db,x.session,managedTeamId(db),choice);
}
function pendingOfficialDraftSetup(db){
  const x=pendingOfficialSession(db);if(!x)return null;
  if(!x.session.current&&!x.session.selectionResolved)return null;
  const cur=seriesSessionPrepareGame(db,x.session);if(!cur)return null;
  return {...x.refs,...cur,draftCtx:cur.snap,session:x.session,seasonKey:x.q.seasonKey,pendingDate:x.p.date,game:x.session.g,score:[x.session.wins[x.session.a],x.session.wins[x.session.b]],fearlessUsed:x.session.ctx.used.slice(),homeTeam:x.refs.m.a};
}
function resolvePendingOfficialMatch(db,forcedDraft){
  const w=db.world,p=w&&w.pendingOfficial,q=p&&p.queue&&p.queue[0];if(!q)throw new Error('No pending official match');
  const refs=pendingOfficialRefs(db,q);if(!refs)throw new Error('Pending official match is stale');
  const administrative=resolvePendingDisqualifiedFinal(db,refs,q);if(administrative)return administrative;
  if(!q.session)q.session=scheduledSeriesSession(db,refs.s,refs.m).session;
  const played=playSeriesSessionGame(db,q.session,forcedDraft,false);
  if(!played.done)return {game:played.game,done:false,score:played.score,pending:w.pendingOfficial};
  const series=seriesSessionResult(db,q.session);commitScheduledSeries(db,refs.s,refs.m,series);
  const finalized=finalizeCompetitionDay(db,refs.s,refs.day,refs.cfgIdx,refs.cfg);if(finalized)scoutFromDay(db,refs.s,refs.day);
  p.queue.shift();if(!p.queue.length){w.pendingOfficial=null;if(!activeSeasons(db).length)advanceStep(db)}
  return {game:played.game,done:true,score:played.score,rec:series.rec,lines:series.lines,finalized,pending:w.pendingOfficial};
}
function playWorldDay(db){
  const w=db.world;if(w.phase!=='season')return null;
  // An unfinished managed Bo3/Bo5 must be resumed before advancing another
  // day; do not apply recovery, patches, or construction a second time.
  if(w.pendingOfficial?.queue?.length){
    const control=pendingOfficialControl(db),date=w.pendingOfficial.date;
    if(control.error)throw new Error(control.error);
    if(control.manual)return {date,played:[],pending:w.pendingOfficial,advanced:false};
    const undo=pendingOfficialUndo(db);
    try{resolvePendingOfficialMatch(db,null);return {date,played:[{s:control.refs.s,day:control.refs.day}],pending:w.pendingOfficial,advanced:false}}catch(e){undo();throw e}
  }
  const d=nextCalendarDate(db);
  if(!d){advanceStep(db);return {date:null,played:[],pending:null,advanced:false}}
  const advanced=applyWorldDailyEffects(db,d);
  const fixture=nextDate(db),played=[],queue=[],me=w.manage==='manual'&&!w.fired?managedTeamId(db):null;
  if(d===fixture){
    for(const [seasonKey,s] of Object.entries(w.seasons))if(!s.done&&s.days[s.cur].date===d){
      const result=playDay(db,s,{deferTeam:me});
      played.push({s,day:result.day});
      if(result.finalized)scoutFromDay(db,s,result.day);
      for(const m of result.pending)queue.push({seasonKey,matchId:m.matchId,date:d});
    }
    if(queue.length)w.pendingOfficial={date:d,queue};
    else if(!activeSeasons(db).length)advanceStep(db);
  }
  return {date:d,played,pending:w.pendingOfficial,advanced};
}
function news(db,text){db.news.unshift({year:db.world?db.world.year:db.year,text});if(db.news.length>250)db.news.length=250}

function stepOf(db,s){
  if(s.step!==undefined)return s.step;
  const w=db.world;
  return w.steps.findIndex(st=>st.kind==='league'?st.split===s.split:(st.ids||[st.id]).some(id=>canonicalInternationalId(id)===canonicalInternationalId(s.comp)));
}
