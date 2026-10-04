// Ordered aggregate events, not exact spell/geometry timings. Trace storage is optional.
function matchEnded(st){return !!st.ending}
function matchEventSecond(st,opt){
  if(opt.sec!==undefined)return opt.sec;
  st.eventSecond=Math.min(59,(st.eventSecond||0)+st.rng.log.int(2,7));
  return st.eventSecond;
}
function destroyMatchNexus(st,side){
  if(matchEnded(st)||!st.sides[1-side].nexus)return null;
  st.sides[1-side].nexus=false;
  const second=log(st,`${st.sides[side].team.short} 넥서스 파괴 — 승리`,{side,major:true,kind:'nexus'});
  st.ending={version:1,kind:'nexus',winner:side,minute:st.t,second};
  st.winner=side;
  return 'nexus';
}
