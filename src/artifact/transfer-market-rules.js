function transferMarketOpen(db,t){
  // Ordinary contracted-player transfers share the world's exact 28-day UTC
  // window. Phase labels and old regional/loan windows cannot reopen it.
  // True FA signing and pre-agreed loan ownership conversion have other gates.
  try{return globalTransferMarketState(db.worldDate).open}catch{return false}
}
function permanentTransferWindowError(db,p,to){
  if(!transferMarketOpen(db,to))return '계약 선수 이적은 28일 통합 이적시장 개장부터 마감 전까지만 가능합니다';
  if(db.world?.phase==='offseason'&&db.world?.contractWindow?.stage==='exclusive'&&contractExpiresThisSeason(db,p))
    return '만료 예정 선수는 독점 협상 후 미래 계약 절차로 합의해야 합니다';
  return null;
}
