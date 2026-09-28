// ===== LOL GM: Season / competition orchestration =====
// Owns league and international season construction, calendar progression,
// managed official-match pauses and day-by-day world competition execution.

// 그 해 마지막 스플릿 시즌 (승강·시상·목표 판정 기준)
function finalSeason(w,R,div=1){let best=null;for(const s of Object.values(w.seasons))if(s.region===R.id&&(s.div||1)===div&&s.split&&(!best||s.split>best.split))best=s;return best}

// ---------- 리그/시즌 구성 ----------
function divName(R){return R.system==='franchise'?`${R.leagueName} 챌린저스`:`${R.leagueName} 2부`}
function leagueComp(db,rid,div=1){
  const R=db.regions[rid], teams=activeTeams(db,rid,div).filter(t=>div===1||true).map(t=>t.id);
  return {id:div===2?R.short+'2':R.short,name:div===2?divName(R):R.leagueName,short:div===2?R.short+'2':R.short,region:rid,div,teams,rules:{fearless:true},stages:leagueStages(R,teams.length,div)};
}
function startWorldSeason(db,myTeam,seed){
  setManagedTeam(db,myTeam);
  const regs=Object.values(db.regions), I=db.worldConfig.internationals, maxK=Math.max(...regs.map(r=>r.splits||1));
  const steps=[];
  const intlSteps=tm=>{const tops=I.filter(i=>i.timing===tm&&i.tier!=='low').sort((a,b)=>(a.prestige||1)-(b.prestige||1)),lows=I.filter(i=>i.timing===tm&&i.tier==='low');
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
  db.world={year:db.year,seed,manage,phase:'season',seasons:{},steps,step:-1,report:null,pendingOfficial:null,lastDate:`${db.year}-01-07`,offers:[],marketLog:[]};
  seasonPatch(db,`${db.year}-01-02`,new RNG(seed+db.year,'patch'));
  setGoals(db);
  advanceStep(db);
}
function seasonLastDate(s){return s.days[s.days.length-1].date}
// 저장 공간 절약: 내 지역이 아닌 리그 경기는 세트 요약만 남긴다
function compactSeason(db,s){
  if(s.compact)return; const my=db.teams[managedTeamId(db)].region; if(s.region===my||db.competitions[s.comp].international)return;
  for(const d of s.days)for(const m of d.matches)if(m.res){const r=m.res;r.games=r.games.map(g=>({n:g.n,blue:g.blue,red:g.red,winner:g.winner,kills:g.kills,dur:g.dur,mvp:g.mvp}));delete r.tac;r.lite=true}
  s.compact=true;
}
function advanceStep(db){
  const w=db.world;
  for(const s of Object.values(w.seasons))if(s.done)compactSeason(db,s);
  for(const s of Object.values(w.seasons)){const d=seasonLastDate(s);if(d>w.lastDate)w.lastDate=d}
  while(true){
    w.step++;
    if(w.step>=w.steps.length){w.phase='offseason';news(db,`${w.year} 시즌 일정이 모두 끝났습니다`);return}
    const st=w.steps[w.step], start=addDays(w.lastDate,st.kind==='intl'?18:(w.step===0?7:14));
    if(st.kind==='league'){
      if(st.split>1&&w.step>0){ // 스플릿 개막: 대형 패치 + 사무국 중간 점검
        const rng=new RNG(w.seed+w.year,'mid');
        const p=newPatch(db,start,true,rng);db.patches.nextDate=addDays(start,db.patches.cadence||14);
        const nc=p.notes.find(n=>n.type==='new');news(db,`${SPLIT_NAME[st.split]} 개막 패치 ${p.id}${nc?` — 신규 챔피언 ${nc.def.name} 출시`:''}`);
        officeMidSeason(db,rng,CHANGE_F[db.worldConfig.changes]??1);
      }
      let any=false;
      for(const R of Object.values(db.regions)){
        if((R.splits||1)<4-st.split)continue;
        for(const div of R.div2?[1,2]:[1]){
          if(activeTeams(db,R.id,div).length<2)continue;
          const comp=leagueComp(db,R.id,div); db.competitions[comp.id]=comp;
          const key=comp.id+'-'+st.split, s=newSeason(db,comp.id,w.year,`${w.seed}/${w.year}/${key}`,start,key);
          s.key=key;s.split=st.split;s.region=R.id;s.div=div;s.step=w.step;s.label=(R.splits||1)>1?SPLIT_NAME[st.split]:'';
          w.seasons[key]=s;any=true;
        }
      }
      if(any)return;
    } else {let any=false;const taken=new Set();for(const id of (st.ids||[st.id]))if(startInternational(db,id,start,taken))any=true;if(any)return}
  }
}
function placements(db,s){
  const comp=db.competitions[s.comp];const reg=standings(db,s,comp.stages[0].id).map(x=>x.tid);
  const out=[s.champion,s.runnerUp].filter(Boolean);for(const t of reg)if(!out.includes(t))out.push(t);return out;
}
function regionPlacements(db,R){
  const w=db.world, act=activeTeams(db,R.id,1).map(t=>t.id);
  const done=[3,2,1].map(sp=>w.seasons[R.short+'-'+sp]).find(s=>s&&s.done);
  let base=done?placements(db,done):(R.lastPlacement||[]);
  base=base.filter(t=>act.includes(t));
  const rest=act.filter(t=>!base.includes(t)).sort((a,b)=>teamStrength(db,b)-teamStrength(db,a));
  return [...base,...rest];
}
function regionPower(db,R){const h=(db.global&&db.global.power||{})[R.id];return h!==undefined?h:R.strength}
function teamStrength(db,tid){const t=db.teams[tid];return avg(ROLES.map(r=>{const p=starterFor(db,t,r);return p?playerRoleRating(p,r):40}))}
function startInternational(db,id,start,taken=new Set()){
  const w=db.world, it=db.worldConfig.internationals.find(x=>x.id===id); if(!it)return false;
  const regs=Object.values(db.regions).filter(R=>!it.zone||(INTL_ZONES[it.zone]||[]).includes(R.id)).sort((a,b)=>regionPower(db,b)-regionPower(db,a));
  const topSlots=R=>{const top=db.worldConfig.internationals.find(x=>x.tier!=='low'&&x.timing===it.timing&&x.entry==='slots');return top?Math.max(1,Math.ceil(R.slots*(top.ratio||1))):R.slots};
  const lists=regs.map(R=>{
    if(it.entry==='champions')return regionPlacements(db,R).slice(0,1);
    if(it.entry==='slots')return regionPlacements(db,R).slice(0,Math.max(1,Math.ceil(R.slots*(it.ratio||1))));
    const per=(it.per||2)*(regs.length<=2?2:1);
    if(it.entry==='div2'&&R.div2){const s=[3,2,1].map(sp=>w.seasons[R.short+'2-'+sp]).find(s=>s&&s.done);if(s)return placements(db,s).filter(t=>!taken.has(t)).slice(0,per)}
    // 'next' (또는 하부 리그 없는 지역): 상위 대회 진출권 바로 다음 순위부터, 같은 기간 다른 대회에 이미 나간 팀은 건너뜀
    return regionPlacements(db,R).slice(topSlots(R)).filter(t=>!taken.has(t)).slice(0,per);
  }).map(l=>l.filter(t=>!taken.has(t)));
  const teams=[];for(let k=0;k<6;k++)for(const l of lists)if(l[k])teams.push(l[k]);
  if(teams.length<4)return false;
  teams.forEach(t=>taken.add(t));
  db.competitions[id]={id,name:it.name,short:it.short||id,teams,rules:{fearless:true},international:true,tier:it.tier||'top',stages:intlStages(it.format,teams,it.bo)};
  const s=newSeason(db,id,w.year,`${w.seed}/${w.year}/${id}`,start,id);
  s.key=id;s.label='';s.step=w.step;w.seasons[id]=s;
  s.stagesInfo=db.competitions[id].stages.map(x=>x.name).join(' → ');
  news(db,`${it.name} 개막 — ${teams.length}팀 참가 (${INTL_FORMATS[it.format]||it.format})`);
  return true;
}
function activeSeasons(db){return Object.values(db.world.seasons).filter(s=>!s.done)}
function nextDate(db){let next=null;for(const s of Object.values(db.world.seasons)){if(s.done)continue;const d=s.days[s.cur].date;if(next===null||d<next)next=d}return next}
function nextTeamMatch(db,tid){
  let best=null;for(const s of Object.values(db.world?.seasons||{})){if(s.done)continue;for(let i=s.cur;i<s.days.length;i++){const d=s.days[i],m=d.matches.find(x=>!x.res&&(x.a===tid||x.b===tid));if(m&&(!best||d.date<best.date)){best={date:d.date,opponent:m.a===tid?m.b:m.a,comp:s.comp};break}}}return best;
}
function daysUntil(db,date){return date?Math.max(0,Math.ceil((new Date(date)-new Date(db.worldDate))/86400000)):99}
function trainingRecommendation(db,t){
  const next=nextTeamMatch(db,t.id),days=daysUntil(db,next?.date),roster=t.roster.map(id=>db.players[id]).filter(Boolean),fat=avg(roster.map(p=>p.fatigue||0)),cond=avg(roster.map(p=>p.condition??96));
  const intensity=fat>38||cond<84||days<=1?'light':days>=5&&fat<20&&cond>91?'high':'normal';
  const scrim=days>=2&&fat<42&&cond>80;return {intensity,scrim,next,days,fat,cond};
}
function pendingOfficialRefs(db,q){
  const s=db.world.seasons[q.seasonKey],day=s&&s.days[s.cur],m=day&&day.matches.find(x=>x.id===q.matchId);
  if(!s||!m||m.res)return null;const comp=db.competitions[s.comp],cfgIdx=comp.stages.findIndex(x=>x.id===day.stage),cfg=comp.stages[cfgIdx];
  return {s,day,m,comp,cfg,cfgIdx};
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
  if(!q.session)q.session=scheduledSeriesSession(db,refs.s,refs.m).session;
  const played=playSeriesSessionGame(db,q.session,{bans:forcedDraft.bans,picks:forcedDraft.picks},false);
  if(!played.done)return {game:played.game,done:false,score:played.score,pending:w.pendingOfficial};
  const series=seriesSessionResult(db,q.session);commitScheduledSeries(db,refs.s,refs.m,series);
  const finalized=finalizeCompetitionDay(db,refs.s,refs.day,refs.cfgIdx,refs.cfg);if(finalized)scoutFromDay(db,refs.s,refs.day);
  p.queue.shift();if(!p.queue.length){w.pendingOfficial=null;if(!activeSeasons(db).length)advanceStep(db)}
  return {game:played.game,done:true,score:played.score,rec:series.rec,lines:series.lines,finalized,pending:w.pendingOfficial};
}
function playWorldDay(db){
  const w=db.world;if(w.phase!=='season')return null;
  if(w.pendingOfficial&&w.pendingOfficial.queue&&w.pendingOfficial.queue.length)return {date:w.pendingOfficial.date,played:[],pending:w.pendingOfficial};
  const d=nextDate(db);if(!d){advanceStep(db);return {date:null,played:[],pending:null}}
  db.worldDate=d;patchTick(db,d,new RNG(w.seed+d,'patch'));dailyRecovery(db);
  for(const t of activeTeams(db))aiManageTraining(db,t);
  for(const t of activeTeams(db))aiReviewRoleConversions(db,t);
  advanceRoleConversionsDay(db);
  aiRunScrims(db,new RNG(w.seed+d,'scrim'));
  for(const t of activeTeams(db,null,1))aiManageOwnedReserve(db,t);
  const played=[],queue=[],me=managedTeamId(db);
  for(const [seasonKey,s] of Object.entries(w.seasons))if(!s.done&&s.days[s.cur].date===d){
    const r=playDay(db,s,{deferTeam:me});played.push({s,day:r.day});
    if(r.finalized)scoutFromDay(db,s,r.day);
    for(const x of r.pending)queue.push({seasonKey,matchId:x.matchId,date:d});
  }
  if(queue.length)w.pendingOfficial={date:d,queue};
  else if(!activeSeasons(db).length)advanceStep(db);
  return {date:d,played,pending:w.pendingOfficial};
}
function news(db,text){db.news.unshift({year:db.world?db.world.year:db.year,text});if(db.news.length>250)db.news.length=250}

function stepOf(db,s){
  if(s.step!==undefined)return s.step;
  const w=db.world;
  return w.steps.findIndex(st=>st.kind==='league'?st.split===s.split:(st.ids||[st.id]).includes(s.comp));
}
