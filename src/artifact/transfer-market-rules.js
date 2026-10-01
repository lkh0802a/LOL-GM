function transferMarketOpen(db,t){
  const phase=db.world?.phase,policy=db.regions[t.region]?.transferWindows,md=(db.worldDate||'').slice(5),
    activePhase=phase==='market'?'offseason':phase;
  if(!policy&&phase!=='season')return true;
  const windows=policy||db.regions[t.region]?.loanWindows||
    [{from:'01-07',through:'01-31'},{from:'07-01',through:'07-14'}];
  return windows.some(w=>(!w.phase||w.phase===activePhase)&&md>=w.from&&md<=w.through);
}
function permanentTransferWindowError(db,p,to){
  if(!transferMarketOpen(db,to))return '도착 지역의 계약 선수 이적시장이 닫혔습니다';
  if(db.world?.phase==='offseason'&&db.world?.contractWindow?.stage==='exclusive'&&contractExpiresThisSeason(db,p))
    return '만료 예정 선수는 독점 협상 후 미래 계약 절차로 합의해야 합니다';
  return null;
}
