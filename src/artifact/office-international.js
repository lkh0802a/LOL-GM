// ===== LOL GM: global esports office, region/competition governance =====
// Geographic *markets*, not a list of real-world league brands. They enter only
// through the normal world-office expansion roll, never as a fixed starting league.
const FUTURE_LEAGUE_MARKETS=[
  {id:'IN',name:'인도·남아시아',brand:'South Asian',short:'SAX',strength:63,system:'franchise'},
  {id:'AFR',name:'사하라 이남 아프리카',brand:'African',short:'AFX',strength:61,system:'mixed'},
  {id:'CAR',name:'카리브해',brand:'Caribbean',short:'CRX',strength:60,system:'relegation'},
  {id:'CAS',name:'중앙아시아',brand:'Central Asian',short:'CAX',strength:62,system:'relegation'},
  {id:'AND',name:'안데스',brand:'Andean',short:'ANX',strength:62,system:'mixed'},
  {id:'NOR',name:'북유럽',brand:'Northern',short:'NRX',strength:65,system:'franchise'},
  {id:'GUL',name:'걸프',brand:'Gulf',short:'GFX',strength:62,system:'franchise'},
  {id:'BAL',name:'발트해',brand:'Baltic',short:'BLX',strength:61,system:'relegation'}
];
const FUTURE_LEAGUE_TITLES=['Horizon','Ascension','Frontier','Aurora','Vertex','Nova','Summit','Rising'];
const FUTURE_LEAGUE_FORMATS=['Circuit','League','Championship','Series'];
function newLeagueIdentity(db,rng,market){
  const usedNames=new Set([
    ...Object.values(REGION_PRESETS).map(x=>x.leagueName),
    ...Object.values(db.regions).map(x=>x.leagueName),
    ...(db.global?.foundedLeagueNames||[])
  ]);
  const usedShorts=new Set([
    ...Object.values(REGION_PRESETS).map(x=>x.short),
    ...Object.values(db.regions).map(x=>x.short),
    ...(db.global?.foundedLeagueShorts||[])
  ]);
  let leagueName='';
  for(let i=0;i<40;i++){
    const proposal=market.brand+' '+rng.pick(FUTURE_LEAGUE_TITLES)+' '+rng.pick(FUTURE_LEAGUE_FORMATS);
    if(!usedNames.has(proposal)){leagueName=proposal;break}
  }
  if(!leagueName){
    let n=2;
    while(usedNames.has(market.brand+' Frontier League '+n))n++;
    leagueName=market.brand+' Frontier League '+n;
  }
  let short=market.short,n=2;
  while(usedShorts.has(short))short=market.short+n++;
  return {leagueName,short};
}
function futureLeagueCandidates(db){
  return FUTURE_LEAGUE_MARKETS.filter(m=>!db.regions[m.id]&&
    !(db.global?.dissolved||[]).includes(m.id)).map(m=>({
      id:m.id,P:m,par:null,fictional:true,score:m.strength/10
    })).sort((a,b)=>b.score-a.score);
}
function worldDecisions(db,rng,f,ev){
  if(f<=0)return;
  const gev=(what,why)=>{db.global.decisions=[...(db.global.decisions||[]),{year:db.world.year,what,why}].slice(-15);ev(`국제 e스포츠 사무국: ${what} — ${why}`)};
  const nR=Object.keys(db.regions).length, avgH=db.worldHype/Math.max(1,nR);
  // 새 지역 합류: 모(母)리그가 있는 신흥 지역은 '분리 독립', 없으면 신규 출범
  const historic=Object.keys(REGION_PRESETS).filter(k=>!db.regions[k]&&!(db.global.dissolved||[]).includes(k)).map(id=>{const P=REGION_PRESETS[id],par=P.parent&&db.regions[P.parent],pm=par&&(par.metrics||[]).slice(-1)[0];
    return {id,P,par,fictional:false,score:P.strength/10+(pm?(pm.hype-45)/15:0)+(par?activeTeams(db,par.id,1).length/10:0)}}).sort((a,b)=>b.score-a.score);
  const future=futureLeagueCandidates(db);
  const pJoin=clamp((avgH-40)/50,0,0.35)*f;
  if((historic.length||future.length)&&rng.chance(pJoin)){
    // Speculative leagues are eligible even while historical expansion options remain.
    const pool=historic.length&&future.length?(rng.chance(.5)?future:historic):historic.length?historic:future;
    const c=rng.chance(0.7)?pool[0]:rng.pick(pool),id=c.id,P=c.P,off=rng.pick(Object.keys(OFFICE_STYLES));
    const nSlots=clamp(Math.round((P.strength-58)/3.5),1,3);
    const fictional=c.fictional?newLeagueIdentity(db,rng,P):null;
    const cfg=regionCfg(id,c.fictional?{id,name:P.name,leagueName:fictional.leagueName,
      short:fictional.short,strength:P.strength,tier:'emerging',teams:10,
      system:P.system,div2:false,office:off,slots:nSlots}
      :{div2:false,office:off,slots:nSlots});
    const R=addRegion(db,rng,cfg);
    if(c.fictional){
      (db.global.foundedLeagueNames=db.global.foundedLeagueNames||[]).push(R.leagueName);
      (db.global.foundedLeagueShorts=db.global.foundedLeagueShorts||[]).push(R.short);
    }
    let why=`세계 흥행 평균 ${Math.round(avgH)}`;
    if(c.par){
      // 모리그에서 팬덤이 약한 구단 2곳이 새 리그로 이적 (연고 이전) — 모리그는 신규 창단으로 짝수 유지
      const mv=activeTeams(db,c.par.id,1).filter(t=>!t.franchised).sort((a,b)=>(a.fans||0)-(b.fans||0)).slice(0,activeTeams(db,c.par.id,1).length>=8?2:0);
      for(const t of mv)moveClubForRegionReorganization(db,t,id,'regional-independence');
      recordRegionSuccession(db,c.par.id,[c.par.id,id],'regional-independence');
      // 새 리그 팀 수는 짝수로 맞춘다
      const extra=activeTeams(db,id,1).length-cfg.teams; for(let k=0;k<extra;k++){const w=activeTeams(db,id,1).filter(t=>!mv.includes(t)).sort((a,b)=>(a.fans||0)-(b.fans||0))[0];if(w)foldTeam(db,w)}
      why=`${c.par.leagueName}에서 분리 독립 — ${mv.length?mv.map(t=>t.name).join(', ')+' 연고 이전, ':''}모리그 흥행 ${(c.par.metrics||[]).slice(-1)[0]?.hype??'-'}`;
      // 모리그 빈자리: 흥행이 괜찮으면 시드권을 새로 팔아 원래 규모 유지, 아니면 축소. 6팀 미만이면 모리그 해체 후 새 리그로 합류
      const ph=((c.par.metrics||[]).slice(-1)[0]||{hype:45}).hype, P=c.par;
      if(mv.length&&ph>=40){const nt=[];for(let k=0;k<mv.length;k++){const t=genTeam(db,rng,P.id,P.strength-3);if(P.system==='mixed')t.franchised=false;nt.push(t.name)}why+=` · ${P.leagueName}는 시드권 신규 판매로 ${nt.join(', ')} 창단`}
      else if(mv.length)why+=` · ${P.leagueName}는 흥행 부진으로 ${activeTeams(db,P.id,1).length}팀 체제로 축소`;
      const kids=Object.keys(REGION_PRESETS).filter(k=>REGION_PRESETS[k].parent===P.id);
      if(kids.length&&kids.every(k=>db.regions[k])&&REGION_PRESETS[P.id]&&REGION_PRESETS[P.id].tier==='major'){
        // 권역의 모든 지역이 독립 → 모리그는 역할을 다하고 해체, 남은 구단은 팀 수가 적은 리그부터 나눠 합류, 진출권도 나눠 승계
        const rest=activeTeams(db,P.id,1).sort((a,b)=>(b.fans||0)-(a.fans||0)), got={};
        for(const t of rest){const dst=kids.map(k=>db.regions[k]).sort((a,b)=>activeTeams(db,a.id,1).length-activeTeams(db,b.id,1).length)[0];
          moveClubForRegionReorganization(db,t,dst.id,'parent-region-dissolution');(got[dst.leagueName]=got[dst.leagueName]||[]).push(t.name)}
        for(const t of activeTeams(db,P.id,2))foldTeam(db,t);
        const heirs=kids.map(k=>db.regions[k]).sort((a,b)=>b.strength-a.strength);
        for(let k=0;k<P.slots;k++)heirs[k%heirs.length].slots++;
        for(const k of kids)db.regions[k].parent=null;
        recordRegionSuccession(db,P.id,kids,'parent-region-dissolution',true);
        delete db.regions[P.id];(db.global.dissolved=db.global.dissolved||[]).push(P.id);
        why+=` · 권역의 모든 지역이 독립해 ${P.leagueName} 해체 — 잔여 구단 분산(${Object.entries(got).map(([l,n])=>`${l}: ${n.length}팀`).join(', ')}), 진출권 ${P.slots}장 승계`;
      } else if(activeTeams(db,P.id,1).length<6){
        const rest=activeTeams(db,P.id,1);
        for(const t of rest)moveClubForRegionReorganization(db,t,id,'parent-region-dissolution');
        for(const t of activeTeams(db,P.id,2))foldTeam(db,t);
        R.slots=Math.max(R.slots,P.slots);
        for(const k of Object.keys(REGION_PRESETS))if(REGION_PRESETS[k].parent===P.id&&db.regions[k])db.regions[k].parent=null;
        recordRegionSuccession(db,P.id,[id],'parent-region-dissolution',true);
        delete db.regions[P.id];
        why+=` · ${P.leagueName} 해체 — 잔여 ${rest.length}팀과 진출권 ${P.slots}장을 ${cfg.leagueName}이 승계`;
      }
    }
    gev(`새 지역 리그: ${cfg.name} — ${cfg.leagueName} 출범 (${activeTeams(db,id,1).length}팀, 월즈 ${cfg.slots}장)`,why+` · 진출권은 리그 수준(${P.strength})에 맞춰 배정`);
  }
  // 리그 통합: 흥행이 2년 연속 침체한 두 지역은 하나의 리그로 합친다
  const lowE=Object.values(db.regions).filter(R=>R.tier==='emerging'&&R.parent&&db.regions[R.parent]&&(R.metrics||[]).length>=2&&R.metrics.slice(-2).every(m=>m.hype<28));
  if(lowE.length&&rng.chance(0.5*f)){ // 신흥 리그가 2년 연속 침체하면 모리그로 재통합
    const g=lowE[0], host=db.regions[g.parent];
    const ts=activeTeams(db,g.id,1).sort((a,b)=>(b.fans||0)-(a.fans||0)), keep=ts.slice(0,2);
    for(const t of ts){if(keep.includes(t))moveClubForRegionReorganization(db,t,host.id,'regional-reintegration');else foldTeam(db,t)}
    for(const t of activeTeams(db,g.id))foldTeam(db,t);
    recordRegionSuccession(db,g.id,[host.id],'regional-reintegration',true);
    delete db.regions[g.id];
    gev(`${g.leagueName} 해체 — ${host.leagueName}로 재통합 (${keep.map(t=>t.name).join(', ')} 합류)`,'2년 연속 흥행 침체');
  }
  const low=Object.values(db.regions).filter(R=>(R.metrics||[]).length>=2&&R.metrics.slice(-2).every(m=>m.hype<30)).sort((a,b)=>a.strength-b.strength);
  if(Object.keys(db.regions).length>=5&&low.length>=2&&low.every(R=>R.tier!=='major')&&rng.chance(0.4*f)){
    const [A,B]=low, host=A.strength>=B.strength?A:B, gone=host===A?B:A;
    for(const t of activeTeams(db,gone.id))if(t.region===gone.id)moveClubForRegionReorganization(db,t,host.id,'regional-merger');
    recordRegionSuccession(db,gone.id,[host.id],'regional-merger',true);
    const old=host.leagueName;host.leagueName=`${host.name}·${gone.name} 연합 리그`;host.name=`${host.name}·${gone.name}`;host.slots=Math.min(4,host.slots+1);
    delete db.regions[gone.id];
    gev(`리그 통합: ${old} + ${gone.leagueName} → ${host.leagueName}`,'두 지역 모두 2년 연속 흥행 침체');
  }
  const I=db.worldConfig.internationals, cand=INTL_PRESETS.filter(p=>!I.some(i=>i.id===p.id));
  if(cand.length&&I.length<5&&rng.chance(clamp((avgH-48)/50,0,0.3)*f)){const it={...rng.pick(cand)};I.push(it);gev(`새 국제대회 신설: ${it.name} (${({early:'윈터 이후',mid:'스프링 이후',end:'서머 이후'})[it.timing]})`,`세계 흥행 평균 ${Math.round(avgH)}`)}
  const weakI=I.filter(i=>i.id!=='WORLDS'&&(i.prestige||1)<=1).sort((a,b)=>(a.prestige||1)-(b.prestige||1));
  const avgPrev=Object.values(db.regions).map(R=>(R.metrics||[]).slice(-2)[0]).filter(Boolean).reduce((a,m,_,arr)=>a+m.hype/arr.length,0);
  if(weakI.length&&avgH<32&&avgPrev<32&&rng.chance(0.3*f)){const it=weakI[0];I.splice(I.indexOf(it),1);gev(`${it.name} 폐지`,`세계 흥행 부진 (평균 ${Math.round(avgH)}) — 일정 과밀 해소`)}
  // 구단 인수: 팬은 많은데 성적이 나쁜 구단, 또는 팬이 적은 구단이 매물로
  for(const t of activeTeams(db).filter(t=>!t.parent)){
    const R=db.regions[t.region], s=teamStrength(db,t.id);
    const p=(.004+(t.fans>=45&&s<R.strength-3?.018:0)+(t.fans<12?.015:0))*f;
    if(rng.chance(p)){const old=t.name,on=orgName(db,rng),ownerRng=new RNG(worldSimulationSeed(db)+'/'+db.year+'/'+t.id+'/'+(t.ownershipSerial||0),'ownership');
      transferClubOwnership(db,t,{name:on.name,wealth:ownerRng.int(30,95),reason:'office-approved-acquisition'});t.fans=Math.round(t.fans*0.85);
      ev(`구단 인수: ${old} → ${t.name} (${t.fans>=45?'인기 구단 매각':'저조한 팬덤으로 매각'})`)}
  }
}

// ===== 국제 e스포츠 사무국: 국제대회 진출권·방식·패치 주기·지역 승인 =====
function globalOffice(db,w,rng,f,ev){
  db.global=db.global||{decisions:[],power:{}};
  const gev=(what,why)=>{db.global.decisions=[...db.global.decisions,{year:w.year,what,why}].slice(-15);ev(`국제 e스포츠 사무국: ${what} — ${why}`)};
  // 1) 지역 국제 경쟁력 지수 (최근 국제대회 성적, 명성 가중)
  const score={}, cnt={};
  for(const s of Object.values(w.seasons)){const c=db.competitions[s.comp];if(!c.international||!s.done)continue;
    const it=db.worldConfig.internationals.find(i=>i.id===c.id)||{prestige:1};
    for(const t of c.teams){const rid=db.teams[t].region;score[rid]=(score[rid]||0)+(0.5+elimReach(db,s,t))*(it.prestige||1);cnt[rid]=(cnt[rid]||0)+(it.prestige||1)}}
  for(const R of Object.values(db.regions)){const v=cnt[R.id]?score[R.id]/cnt[R.id]:null;const old=db.global.power[R.id];db.global.power[R.id]=v===null?(old??R.strength/20):Math.round(((old??v)*0.5+v*0.5)*100)/100}
  // 1-2) 월즈 총원 상한·중하위권 대회 규모: 세계 흥행에 따라 확대/축소
  const nReg=Object.keys(db.regions).length, avgHype=avg(Object.values(db.regions).map(R=>((R.metrics||[]).slice(-1)[0]||{hype:45}).hype));
  if(db.global.wcCap===undefined)db.global.wcCap=Math.max(20,Object.values(db.regions).reduce((a,R)=>a+R.slots,0));
  if(avgHype>=55&&db.global.wcCap<Math.min(40,nReg*5)&&rng.chance(.15*f)){db.global.wcCap+=2;gev(`월즈 참가 상한 ${db.global.wcCap}팀으로 확대`,`세계 흥행 평균 ${Math.round(avgHype)} — 더 많은 팀에 국제 무대 제공`)}
  else if(avgHype<30&&db.global.wcCap>16&&rng.chance(.12*f)){db.global.wcCap-=2;gev(`월즈 참가 상한 ${db.global.wcCap}팀으로 축소`,`세계 흥행 평균 ${Math.round(avgHype)} — 일정·비용 부담`)}
  for(const it of db.worldConfig.internationals.filter(i=>i.tier==='low')){
    if(avgHype>=50&&(it.per||2)<6&&rng.chance(.12*f)){it.per=(it.per||2)+1;gev(`${it.name} 지역당 ${it.per}팀으로 확대`,`세계 흥행 평균 ${Math.round(avgHype)} — 중하위권 국제 경험 확대`)}
    else if(avgHype<28&&(it.per||2)>1&&rng.chance(.1*f)){it.per=(it.per||2)-1;gev(`${it.name} 지역당 ${it.per}팀으로 축소`,`세계 흥행 부진 (평균 ${Math.round(avgHype)})`)}
  }
  // 2) 월드 진출권 재배분: 국제 성적 상위 지역 +1, 하위 지역 -1 (넉넉하게: 최소 1, 최대 5)
  const rk=Object.values(db.regions).filter(R=>cnt[R.id]).sort((a,b)=>db.global.power[b.id]-db.global.power[a.id]);
  if(rk.length>=3&&rng.chance(.2*f)){
    const up=rk[0],dn=rk[rk.length-1];
    const total=()=>Object.values(db.regions).reduce((a,R)=>a+R.slots,0), cap=db.global.wcCap;
    if(up.slots<6&&activeTeams(db,up.id,1).length>=up.slots+3){
      if(total()>=cap){const give=rk.slice().reverse().find(R=>R!==up&&R.slots>1);if(give){give.slots--;gev(`${give.name} 진출권 ${give.slots}장으로 조정`,`월즈 규모 상한 ${cap}팀 유지 — ${up.name}에 1장 이전`)}}
      if(total()<cap){up.slots++;gev(`${up.name} 진출권 ${up.slots}장으로 확대`,`국제 경쟁력 지수 1위 (${db.global.power[up.id]})`)}}
    if(dn.slots>1&&dn!==up&&db.global.power[dn.id]<1.2){dn.slots--;gev(`${dn.name} 진출권 ${dn.slots}장으로 축소`,`국제 경쟁력 지수 최하위 (${db.global.power[dn.id]})`)}
  }
  // 3) 국제대회 방식: 참가 팀 수와 지역 간 격차로 판단
  const nR=Object.keys(db.regions).length;
  for(const it of db.worldConfig.internationals){
    if(!rng.chance(.1*f))continue;
    const zr=Object.values(db.regions).filter(R=>!it.zone||(INTL_ZONES[it.zone]||[]).includes(R.id));
    const n=it.entry==='champions'?zr.length:it.tier==='low'?zr.length*(it.per||2)*(zr.length<=2?2:1):zr.reduce((a,R)=>a+Math.max(1,Math.ceil(R.slots*(it.ratio||1))),0);
    if(it.tier==='low'){const want=n>=10?'groups_de':n>=6?'groups_ko':'ko';if(want!==it.format&&rng.chance(0.5)){const o=it.format;it.format=want;gev(`${it.name} 방식 변경: ${INTL_FORMATS[o]} → ${INTL_FORMATS[want]}`,`참가 ${n}팀 규모에 맞춤`)}continue}
    const gap=rk.length>=2?db.global.power[rk[0].id]-db.global.power[rk[rk.length-1].id]:0;
    let want=it.format, why='';
    if(n>=12&&!it.format.startsWith('playin')){want=it.id==='MSI'?'playin_de':'playin_swiss_ko';why=`참가 ${n}팀 — 하위 시드는 플레이인부터`}
    else if(n<10&&it.format.startsWith('playin')){want=n>=8?'groups_ko':'ko';why=`참가 ${n}팀으로 축소 — 플레이인 폐지`}
    else if(gap>1.5&&it.id!=='WORLDS'&&!it.format.endsWith('de')&&n>=8){want=it.format.startsWith('playin')?'playin_de':'groups_de';why=`지역 간 격차 큼 — 패자부활(더블 엘리) 도입`}
    if(want!==it.format){const o=it.format;it.format=want;gev(`${it.name} 방식 변경: ${INTL_FORMATS[o]} → ${INTL_FORMATS[want]}`,why)}
  }
  // 패치 주기는 리그 사무국이 변경하지 않는다. 게임 개발사 패치 캘린더를 따른다.
  reviewLocalServiceAgreements(db,w,f,ev);
  worldDecisions(db,rng,f,ev);
}
