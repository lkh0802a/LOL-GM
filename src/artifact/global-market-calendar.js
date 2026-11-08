// Pure global market rules; no clock, contract, result or state writer.
// Global player FA opens the first Tuesday of December at 00:00 UTC.
// Standard contracts expiring this year end the prior Monday at 23:59 UTC.
function globalPlayerFAOpenDate(year){
  if(!Number.isInteger(year)||year<2000||year>9999)
    throw new Error('유효하지 않은 글로벌 FA 시즌 연도');
  const firstDay=new Date(Date.UTC(year,11,1)).getUTCDay();
  const firstTuesday=1+(2-firstDay+7)%7;
  return new Date(Date.UTC(year,11,firstTuesday)).toISOString().slice(0,10);
}
function globalPlayerContractExpiryDate(year){
  return addDays(globalPlayerFAOpenDate(year),-1);
}
// One UTC boundary shared by market/competition consumers. Closing is
// exclusive, including when the four weeks cross into the next calendar year.
function globalTransferMarketWindow(year){
  const opensOn=globalPlayerFAOpenDate(year),closesOn=addDays(opensOn,28);
  if(!freeAgencyDateValid(closesOn))throw new Error('유효하지 않은 이적시장 종료 연도');
  return {year,opensOn,closesOn,lastOpenDate:addDays(closesOn,-1)};
}
function globalTransferMarketState(date){
  if(!freeAgencyDateValid(date))throw new Error('유효하지 않은 이적시장 UTC 날짜');
  const year=Number(date.slice(0,4)),current=globalTransferMarketWindow(year),
    window=date<current.opensOn&&year>2000?globalTransferMarketWindow(year-1):current;
  return {...window,date,open:date>=window.opensOn&&date<window.closesOn};
}
// A competition session may be resumed directly after native restoration,
// without visiting nextCalendarDate. Check before preparing or playing it.
// Historical replays and private practice do not create competition fixtures.
function assertCompetitionOutsideMarket(db,opt={}){
  if(!opt.compId||opt.replay||opt.practice)return;
  const market=globalTransferMarketState(db.worldDate);
  if(market.open)throw new Error('28일 통합 이적시장 중에는 대회 경기를 진행할 수 없습니다: '+db.worldDate);
}
// Pending proposals expire at the first market closing after creation, just
// as the daily expiry writer does. New year-round FA proposals after a closing
// belong to the next boundary; initial recruitment keeps its existing gate.
function negotiationMarketDeadline(n){
  if(n.kind==='initial')return null;
  if(!freeAgencyDateValid(n.createdDate))throw new Error('협상 개시 날짜를 확인할 수 없습니다');
  let market=globalTransferMarketState(n.createdDate);
  if(n.createdDate>=market.closesOn)market=globalTransferMarketWindow(market.year+1);
  return market.closesOn+'T00:00:00.000Z';
}
function negotiationMarketDeadlineState(db,n){
  try{
    const deadline=negotiationMarketDeadline(n);
    if(n.kind!=='initial'&&n.createdDate>db.worldDate)return {deadline,passed:false,error:'협상 개시 날짜가 현재 날짜보다 늦습니다'};
    return {deadline,passed:!!(deadline&&negotiationClockAt(db)>=deadline),error:null};
  }catch(error){return {deadline:null,passed:false,error:error.message}}
}
function negotiationMarketDeadlineError(db,n){
  const state=negotiationMarketDeadlineState(db,n);
  return state.error||(state.passed?'이적시장 마감이 지나 이 제안을 확정할 수 없습니다':null);
}
