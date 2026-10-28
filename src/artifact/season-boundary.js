// Read-only official calendar closing gate for the global FA handoff.
// Does not schedule matches, award wins, mutate contracts, or rewrite history.
function validatedWorldsClosingDate(db,finished,worlds){
  const endDate=s=>s.days[s.days.length-1].date,
    worldsFinal=worlds.map(endDate).sort().at(-1),
    others=Object.values(db.world.seasons||{}).filter(s=>s?.days?.length&&!worlds.includes(s)),
    incomplete=others.filter(s=>!s.done);
  if(incomplete.length)throw new Error('월즈 결승 뒤에 미완료 공식 대회가 남았습니다: '+
    incomplete.map(s=>s.comp).join(', '));
  // With a same-day different tournament, the true last match is not known
  // from the date-only season snapshot; reject instead of assuming an order.
  const conflict=others.filter(s=>endDate(s)>=worldsFinal);
  if(conflict.length)throw new Error('월즈 결승 이후 또는 같은 날에 다른 공식 경기가 있습니다: '+
    conflict.map(s=>s.comp+':'+endDate(s)).join(', '));
  return worldsFinal;
}
