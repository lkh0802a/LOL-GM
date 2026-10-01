// ===== LOL GM: World calendar domain =====
// Owns raw clock positioning and in-season daily effects. Positioning alone
// intentionally does not run training, patches or medical daily ticks: the
// contract window and offseason recovery have their own accepted semantics.
// Recovery may temporarily position the clock at the last competition date.
function setWorldCalendarDate(db,date){db.worldDate=date}

// Match dates are fixtures; the authoritative world clock moves through every
// intervening calendar date, including rest days and inter-stage breaks.
function nextCalendarDate(db){
  const fixture=nextDate(db);
  if(fixture===null)return null;
  const previous=db.worldDate||`${db.year}-01-01`;
  if(previous>fixture)throw new Error('월드 날짜가 미진행 공식 경기일보다 늦습니다: '+previous+' > '+fixture);
  if(previous===fixture)return fixture; // legacy saves may be parked on an unplayed match date
  return addDays(previous,1);
}
function applyCalendarPatchEvents(db,date){
  const w=db.world;
  if(!w.majorPatchEvents?.length)return;
  const remaining=[];
  for(const e of w.majorPatchEvents){
    if(e.date>date){remaining.push(e);continue}
    const rng=new RNG(w.seed+w.year+'|'+e.step,'mid');
    const p=newPatch(db,e.date,true,rng);
    db.patches.nextDate=addDays(e.date,db.patches.cadence||14);
    const nc=p.notes.find(n=>n.type==='new');
    news(db,`${SPLIT_NAME[e.split]} 개막 패치 ${p.id}${nc?` — 신규 챔피언 ${nc.def.nameKo||nc.def.name} 출시`:''}`);
    officeMidSeason(db,rng,WORLD_CHANGE_FREQUENCY);
  }
  w.majorPatchEvents=remaining;
}
function applyWorldDailyEffects(db,date){
  const w=db.world;
  if(w.lastDailyTick===date)return false;
  if(w.lastDailyTick&&w.lastDailyTick>date)throw new Error('이미 처리한 날짜를 다시 진행할 수 없습니다');
  setWorldCalendarDate(db,date);
  processLoanDaily(db);
  processTransferPayments(db);
  aiReviewLoanMarket(db);
  aiReviewLoanDecisions(db);
  processLocalServiceDaily(db);
  // A scheduled patch is effective *on* its intended date, never during the
  // preceding break. Then every actual day runs exactly once.
  applyCalendarPatchEvents(db,date);
  patchTick(db,date,new RNG(w.seed+date,'patch'));
  advanceFacilityConstruction(db,date);
  for(const t of activeTeams(db))aiManageTraining(db,t);
  dailyRecovery(db);
  medicalDailyTick(db,date);
  for(const t of activeTeams(db))aiReviewRoleConversions(db,t);
  advanceRoleConversionsDay(db);
  aiRunScrims(db,new RNG(w.seed+date,'scrim'));
  for(const t of activeTeams(db,null,1))aiManageOwnedReserve(db,t);
  aiReviewOfficialRegistrations(db);
  w.lastDailyTick=date;
  return true;
}
