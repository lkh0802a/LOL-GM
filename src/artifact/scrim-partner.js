// ===== LOL GM: competitive scrim partner market =====
// Clubs privately request training partners. Both parties protect imminent
// official match prep; stronger clubs are selective unless they need a reset.

function scrimOfficialRivalWindow(db,aId,bId){
  const today=db.worldDate||`${db.year}-01-01`,past=addDays(today,-3),
    future=addDays(today,14);
  let closest=null;
  for(const season of Object.values(db.world?.seasons||{})){
    for(const day of season.days||[]){
      if(day.date<past||day.date>future)continue;
      if(day.matches?.some(m=>(m.a===aId&&m.b===bId)||(m.a===bId&&m.b===aId))){
        const days=Math.round((new Date(day.date+'T00:00:00Z')-
          new Date(today+'T00:00:00Z'))/86400000);
        if(closest===null||Math.abs(days)<Math.abs(closest))closest=days;
      }
    }
  }
  return closest;
}
function scrimRecentResults(db,tid){
  const recent=[];
  const today=db.worldDate||`${db.year}-01-01`;
  for(const season of Object.values(db.world?.seasons||{}))
    for(const day of season.days||[]){
      if(day.date>today)continue;
      for(const match of day.matches||[]){
        if(!match.res||(match.a!==tid&&match.b!==tid))continue;
        recent.push({date:day.date,win:match.res.winner===tid});
      }
    }
  recent.sort((a,b)=>b.date.localeCompare(a.date));
  const games=recent.slice(0,5);
  let losingStreak=0;
  for(const game of games){if(game.win)break;losingStreak++}
  return {losingStreak,recentWins:games.filter(x=>x.win).length,
    games:games.length};
}
function scrimClubIntent(db,t){
  const starters=ROLES.map(role=>starterFor(db,t,role)).filter(Boolean);
  const morale=starters.length?avg(starters.map(p=>p.morale??65)):65,
    form=scrimRecentResults(db,t.id);
  const confidence=morale<56||form.losingStreak>=3||
    (form.losingStreak>=2&&morale<73);
  return {confidence,morale,form,
    goal:confidence?'자신감 회복':
      t.philosophy==='youth'?'신인·챔피언 실험':'실전 전술 검증'};
}
function scrimPartnerInterest(db,t,other,intent=null,strength=null,otherStrength=null){
  intent=intent||scrimClubIntent(db,t);
  const gap=(otherStrength??teamStrength(db,other.id))-
    (strength??teamStrength(db,t.id));
  let approval,desire,reason=intent.goal;
  if(gap<-7){
    // A powerful club rarely spends its few blocks teaching a far weaker
    // opponent; that changes when its own players need confidence.
    approval=clamp(.84-(-gap-7)*.052,.07,.86);
    desire=clamp(1-(-gap-7)*.035,.36,1);
    if(intent.confidence){
      approval=Math.max(approval,clamp(.83-(-gap-7)*.008,.55,.83));
      desire=clamp(1.3+Math.min(12,-gap)*.02,1.1,1.65);
      reason='연패·침체 후 자신감 회복';
    }else reason='낮은 전력 팀과의 전술 점검';
  }else if(gap>7){
    approval=clamp(.94-(gap-7)*.012,.65,.94);
    desire=clamp(1.27+(Math.min(gap,18)-7)*.012,1.27,1.42);
    reason='강팀 상대 실전 점검';
    if(intent.confidence){desire*=.78;reason='부진 속 고강도 도전'}
  }else{
    approval=.93;
    desire=clamp(1.18+gap*.016,1.06,1.3);
    reason=intent.confidence?'비슷한 상대와 경기력 회복':intent.goal;
  }
  const recent=(t.scrimLog||[]).filter(x=>
    x.opponent===other.id&&x.date>=addDays(db.worldDate,-6)&&
    x.date<=db.worldDate).length;
  desire*=Math.pow(.79,Math.min(5,recent));
  return {approval,desire,reason,goal:intent.goal,
    confidence:intent.confidence,relativeStrength:gap};
}
function scrimPartnerAssessment(db,t,other,intents=null,strengths=null){
  if(!t||!other||t.id===other.id||t.active===false||other.active===false)
    return {allowed:false,reason:'참가 불가 팀'};
  if(t.region!==other.region)
    return {allowed:false,reason:'현지 훈련권역이 다릅니다'};
  const rivalDays=scrimOfficialRivalWindow(db,t.id,other.id);
  if(rivalDays!==null&&rivalDays>=-3&&rivalDays<=7)
    return {allowed:false,reason:'최근 또는 7일 내 공식전 맞대결 상대',
      rivalDays};
  const left=scrimPartnerInterest(db,t,other,intents?.[t.id],
    strengths?.[t.id],strengths?.[other.id]),
    right=scrimPartnerInterest(db,other,t,intents?.[other.id],
      strengths?.[other.id],strengths?.[t.id]);
  // Also avoid giving away strategies shortly before a scheduled showdown
  // outside the strict seven-day embargo.
  const secrecy=rivalDays!==null&&rivalDays>7&&rivalDays<=14?.4:1;
  const acceptance=clamp(left.approval*right.approval*secrecy,.015,.97),
    weight=Math.max(.01,left.desire*right.desire*acceptance);
  return {allowed:true,reason:'양팀 훈련 목적에 부합',acceptance,weight,
    left,right,rivalDays};
}
