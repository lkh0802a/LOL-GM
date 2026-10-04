// One acquisition writer for existing aggregate objective rules. Participation
// is supplied by the decision/fight path; this is not physical proximity.
function matchObjectiveToken(st,key){
  const o=st.obj;
  if(key==='dragon'&&!o.soul&&o.dragonAt&&st.t>=o.dragonAt)return key+':'+o.dragonAt+':'+o.dragonIdx;
  if(key==='elder'&&o.soul&&o.elderAt&&st.t>=o.elderAt)return key+':'+o.elderAt;
  if(key==='herald'&&!o.heraldDone&&st.t>=st.patch.rules.heraldSpawn&&st.t<20)return key+':'+st.patch.rules.heraldSpawn;
  if(key==='baron'&&st.t>=o.baronAt)return key+':'+o.baronAt;
  return null;
}
function awardMatchObjective(st,key,w,part,conversion=false,stealer=null){
  if(matchEnded(st)||![0,1].includes(w)||!Array.isArray(part)||!part.length||part.some(p=>!st.sides[w].ps.includes(p)))return false;
  if(stealer!==null&&(conversion||!st.sides[w].ps.includes(stealer)||stealer.role!=='JGL'||!alive(st,stealer)))return false;
  const token=matchObjectiveToken(st,key);
  if(!token||(st.objectiveEvents||[]).some(e=>e.id===token))return false;
  const involved=[...new Set(stealer?[...part,stealer]:part)],o=st.obj,s=st.sides[w],rules=st.patch.rules;
  o.wait[key]=0;
  involved.forEach(p=>{p.objectives++;matchQuestEvent(st,p,{epics:1,jungleStacks:p.role==='JGL'?1:0})});
  let second;
  if(key==='dragon'){
    const type=o.dragonTypes[o.dragonIdx%o.dragonTypes.length];s.dragons.push(type);o.dragonIdx++;
    if(st.firsts.dragon===undefined)st.firsts.dragon=w;
    aliveOf(st,w).forEach(p=>addGold(p,40));
    second=log(st,`${s.team.short} ${type} 드래곤 처치 (${s.dragons.length}스택)`,{side:w,major:true,kind:'obj'});
    if(s.dragons.length>=4){s.soul=true;o.soul=true;o.elderAt=st.t+6;log(st,`${s.team.short} 드래곤 영혼 획득`,{side:w,major:true,kind:'obj'})}
    else o.dragonAt=st.t+rules.dragonRespawn;
  }else if(key==='elder'){
    s.elderUntil=st.t+rules.elderBuff;o.elderAt=st.t+6;
    second=log(st,`${s.team.short} 장로 드래곤 처치`,{side:w,major:true,kind:'obj'});
  }else if(key==='herald'){
    o.heraldDone=true;s.herald++;s.heraldCharge=true;
    second=log(st,`${s.team.short} 협곡의 전령 획득`,{side:w,major:true,kind:'obj'});
  }else{
    s.baronUntil=st.t+rules.baronBuff;s.barons++;o.baronAt=st.t+rules.baronRespawn;
    if(st.firsts.baron===undefined)st.firsts.baron=w;
    aliveOf(st,w).forEach(p=>addGold(p,300));
    second=log(st,`${s.team.short} ${conversion?'한타 승리 후 ':''}바론 처치`,{side:w,major:true,kind:'obj'});
  }
  (st.objectiveEvents||(st.objectiveEvents=[])).push({id:token,key,side:w,minute:st.t,second,participants:involved.map(p=>p.p.id),...(stealer?{stealer:stealer.p.id}:{})});
  return true;
}
function recordedObjectivesValid(p){
  if(p.objectives===undefined)return true;
  const o=p.objectives;
  return o?.version===1&&Array.isArray(o.events)&&o.events.length<=720&&new Set(o.events.map(e=>e?.id)).size===o.events.length&&o.events.every(e=>e&&typeof e.id==='string'&&['dragon','elder','herald','baron'].includes(e.key)&&[0,1].includes(e.side)&&Number.isInteger(e.minute)&&e.minute>=1&&e.minute+e.second/60<=p.duration&&Number.isInteger(e.second)&&e.second>=0&&e.second<60&&(!p.ending||e.minute<p.ending.minute||e.minute===p.ending.minute&&e.second<=p.ending.second)&&Array.isArray(e.participants)&&e.participants.length>0&&e.participants.length<=5&&new Set(e.participants).size===e.participants.length&&e.participants.every(id=>p.sides?.[e.side]?.players?.some(x=>x[0]===id))&&(e.stealer===undefined||typeof e.stealer==='string'&&e.participants.includes(e.stealer)&&p.sides[e.side].players.some(x=>x[0]===e.stealer&&x[2]==='JGL')));
}
