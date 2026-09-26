// ===== 롤FM: 흥행 / 리그 사무국 =====
const OFFICE_STYLES={
  conservative:{label:'보수적',w:{cap:-0.1,floor:-0.1,tax:-0.2,import:-0.2,fearless:-0.2,expand:-0.35,contract:-0.2,playoffs:-0.1,relegation:-0.2,franchise:0.1,mixed:-0.1,div2:-0.1,format:-0.25,splits:-0.2,bo:-0.1}},
  expansion:{label:'확장 지향',w:{cap:-0.1,floor:0.1,tax:-0.1,import:0.2,fearless:0.1,expand:0.45,contract:-0.3,playoffs:0.1,relegation:-0.1,franchise:0,mixed:0.1,div2:0.3,format:0.1,splits:0.1,bo:0}},
  revenue:{label:'수익 중심',w:{cap:0.2,floor:0,tax:0.1,import:0.1,fearless:0.2,expand:0.15,contract:0.15,playoffs:0.2,relegation:-0.3,franchise:0.35,mixed:0.15,div2:0,format:0.2,splits:0.3,bo:0.15}},
  balance:{label:'경쟁 균형 중시',w:{cap:0.3,floor:0.3,tax:0.3,import:-0.1,fearless:0,expand:0,contract:0.1,playoffs:0.3,relegation:0.35,franchise:-0.2,mixed:0.2,div2:0.2,format:0.1,splits:0,bo:0.1}}
};
const PRESET_OFFICE={KR:'conservative',CN:'expansion',EU:'balance',NA:'revenue'};
function baseFans(strength,rng){return Math.round(clamp(20+(strength-60)*1.6+rng.normal(0,8),5,90))}
function hypeLabel(h){return h>=70?'매우 높음':h>=55?'높음':h>=40?'보통':h>=28?'낮음':'침체'}

// 한 해 성적으로 구단 팬덤과 리그 지표를 갱신
function updateHype(db,w){
  const intlReach={};
  for(const s of Object.values(w.seasons)){const c=db.competitions[s.comp];if(!c.international||!s.done)continue;
    const pr=(db.worldConfig.internationals.find(i=>i.id===c.id)||{prestige:1}).prestige||1;
    for(const t of c.teams)intlReach[t]=(intlReach[t]||0)+(0.5+elimReach(db,s,t))*Math.min(1,pr);}
  const out={};
  for(const R of Object.values(db.regions)){
    const ts=activeTeams(db,R.id,1); if(!ts.length)continue;
    const ss=Object.values(w.seasons).filter(s=>s.region===R.id&&(s.div||1)===1&&s.split&&s.done);
    const rec={};ts.forEach(t=>rec[t.id]={w:0,l:0});
    for(const s of ss)for(const r of standings(db,s,'regular'))if(rec[r.tid]){rec[r.tid].w+=r.w;rec[r.tid].l+=r.l}
    const pct=ts.map(t=>{const x=rec[t.id];return x.w+x.l?x.w/(x.w+x.l):0.5});
    const sd=Math.sqrt(avg(pct.map(p=>(p-0.5)**2)));
    // 독주: 같은 팀이 연속 우승하면 균형 점수 하락
    const champs=db.history.filter(h=>h.region===R.id).slice(-4).map(h=>h.champion);
    const dyn=champs.length>=3&&champs.slice(-3).every(c=>c===champs[champs.length-1])?0.15:0;
    const balance=clamp(1-(sd-0.12)/0.2-dyn,0,1);
    // 구단 팬덤
    ts.forEach((t,i)=>{
      const title=ss.filter(s=>s.champion===t.id).length, star=t.roster.filter(id=>{const p=db.players[id];return p&&playerOvr(p)>=R.strength+8}).length;
      const g=(pct[i]-0.5)*14+title*4+(intlReach[t.id]||0)*2+star*0.8;
      t.fans=Math.round(clamp((t.fans??30)*0.9+3+g+rng01(db,t.id)*2,3,100));
    });
    const stars=Object.values(db.players).filter(p=>!p.retired&&p.team&&db.teams[p.team].region===R.id&&(db.teams[p.team].division||1)===1&&playerOvr(p)>=78).length;
    const intl=avg(ts.map(t=>intlReach[t.id]||0));
    const fans=avg(ts.map(t=>t.fans));
    const hype=Math.round(clamp(fans*(0.7+0.4*balance)+intl*5+Math.min(stars,10)*0.8,0,100));
    const m={year:w.year,hype,balance:Math.round(balance*100)/100,fans:Math.round(fans),stars,intl:Math.round(intl*100)/100,teams:ts.length};
    R.metrics=[...(R.metrics||[]),m].slice(-12); out[R.id]=m;
  }
  db.worldHype=Math.round(Object.values(out).reduce((a,m)=>a+m.hype,0));
  return out;
}
function rng01(db,k){return (hashStr(k+db.year)%1000)/1000-0.5}

// 사무국 결정: 지표 → 안건별 효용 → 문턱을 넘는 안건만 채택
function officeDecisions(db,rng,f,ev,mid){
  if(f<=0)return;
  const thr=(mid?0.95:0.55)/f;
  for(const R of Object.values(db.regions)){
    const M=R.metrics&&R.metrics[R.metrics.length-1]; if(!M)continue;
    const prev=R.metrics.length>1?R.metrics[R.metrics.length-2]:null, trend=prev?M.hype-prev.hype:0;
    const S=OFFICE_STYLES[R.office]||OFFICE_STYLES.conservative, n=activeTeams(db,R.id,1).length;
    const faDepth=Object.values(db.players).filter(p=>!p.retired&&!p.team&&p.region===R.id&&playerOvr(p)>=R.strength-10).length/Math.max(1,n);
    const weak=activeTeams(db,R.id,1).map(t=>({t,s:teamStrength(db,t.id)})).sort((a,b)=>a.s-b.s);
    const weakGap=weak.length>2?R.strength-weak[0].s:0;
    const H=M.hype, B=M.balance, props=[];
    const recent=new Set((R.decisions||[]).filter(d=>db.world.year-d.year<2).map(d=>d.key)); // 같은 종류 안건은 2년 유예
    const grp=k=>({relegation:'system',franchise:'system',mixed:'system'}[k]||k);
    const add=(key,u,apply,why)=>{if(!recent.has(grp(key)))props.push({key,u:u+(S.w[key]||0)+rng.normal(0,0.15),apply,why})};
    const takes=[4,6,8].filter(x=>x<=n), up=takes.find(x=>x>R.playoffTake);
    if(!mid){
      if(n<=12) add('expand',(H-55)/18+faDepth*0.3+trend/20-Math.max(0,n-8)*0.3,()=>{const nm=[];for(let i=0;i<2;i++){const t=genTeam(db,rng,R.id,R.strength-3);nm.push(t.name);if(R.system==='mixed')t.franchised=true;if(R.div2&&R.system==='franchise')makeAcademy(db,rng,t)}return `확장팀 ${nm.join(', ')} 창단`},`흥행 ${H}, 영입 가능한 인재 풀 충분`);
      const broke=activeTeams(db,R.id,1).sort((a,b)=>a.finance.cash-b.finance.cash);
      if(n>=8&&prev&&prev.hype<40) add('contract',(35-H)/15+weakGap/14+(broke[0].finance.cash<0?0.3:0)-0.3,()=>{const x=[broke[0],broke.find(t=>t!==broke[0]&&t===weak[0].t)||broke[1]];x.forEach(t=>{foldTeam(db,t);activeTeams(db,R.id,2).filter(a=>a.parent===t.id).forEach(a=>foldTeam(db,a))});return `${x.map(t=>t.name).join(', ')} 리그 퇴출 (2팀 축소)`},`흥행 ${hypeLabel(H)}, 재정난·전력 격차 구단 정리`);
      if(R.system!=='relegation') add('relegation',weakGap/10+(0.6-B)*1.5-0.4,()=>{R.system='relegation';R.relegate=1;return '완전 승강제 도입'},`하위권 경쟁력 부족 (최약체 격차 ${weakGap.toFixed(0)})`);
      if(R.system!=='franchise') add('franchise',(45-H)/15+0.1,()=>{R.system='franchise';return '프랜차이즈 전환 (강등 폐지)'},`스폰서 안정성 확보 (흥행 ${hypeLabel(H)})`);
      if(R.system!=='mixed') add('mixed',(0.55-B)*1.2+(H-45)/30,()=>{R.system='mixed';markFranchised(db,R);return '혼합 리그 전환 — 팬덤 상위 절반은 프랜차이즈 보호, 나머지는 승강 경쟁'},`인기 구단의 안정성과 하위권 경쟁을 함께 확보`);
      if(!R.div2) add('div2',(H-50)/15+faDepth*0.5+(n>=10?0.3:0)-0.2,()=>{createDiv2(db,rng,R);return R.system==='franchise'?`${divName(R)} 창설 — 구단별 2군 참가`:`${divName(R)} 창설 — 승강 연결`},`유망주 육성 무대 필요 (FA 인재 ${faDepth.toFixed(1)}명/팀)`);
      else add('div2',(32-H)/12-0.2,()=>{abolishDiv2(db,R);return `${divName(R)} 폐지`},`흥행 부진으로 운영비 절감`);
      // 재정 규정: 연봉 격차·구단 재정 건전성·흥행을 보고 캡/플로어/사치세/외국인/피어리스 결정
      const pays=activeTeams(db,R.id,1).map(t=>payroll(db,t)).sort((a,b)=>a-b), med=pays[Math.floor(pays.length/2)]||1, disp=(pays[pays.length-1]||1)/Math.max(0.1,pays[0]||0.1);
      const cashes=activeTeams(db,R.id,1).map(t=>t.finance.cash), neg=cashes.filter(c=>c<0).length/Math.max(1,cashes.length);
      const ps=psOf(db,R.id), rc=v=>Math.round(v);
      if(!R.salaryCap) add('cap',(disp-2.2)/1.2+(0.55-B),()=>{R.salaryCap=rc(med*1.6);R.luxuryTax=0.5;return `샐러리캡 도입 (${R.salaryCap}억, 초과분 사치세 50%)`},`연봉 격차 ×${disp.toFixed(1)} — 전력 평준화 필요`);
      else {
        const over=pays.filter(p=>p>R.salaryCap).length/pays.length;
        add('cap',over*2-0.4+(H-55)/30,()=>{const o=R.salaryCap;R.salaryCap=rc(o*1.15);return `샐러리캡 인상 ${o}억 → ${R.salaryCap}억`},`구단 ${Math.round(over*100)}%가 상한 초과 — 시장 성장 반영`);
        add('cap',(1.5-disp)*1.5-0.2,()=>{const o=R.salaryCap;R.salaryCap=0;return `샐러리캡 폐지 (기존 ${o}억)`},`연봉 격차 ×${disp.toFixed(1)}로 충분히 고름`);
        add('tax',(0.5-B)*2+(disp-2.5)/2-0.3,()=>{const o=R.luxuryTax||0.5;R.luxuryTax=Math.min(1,Math.round((o+0.25)*100)/100);return `사치세율 ${Math.round(o*100)}% → ${Math.round(R.luxuryTax*100)}%`},`상위 구단 독주 (균형 ${B})`);
      }
      if(!R.salaryFloor) add('floor',((med*0.45)-pays[0])/Math.max(1,med*0.2)+(0.5-B)*0.8,()=>{R.salaryFloor=rc(med*0.6);return `샐러리플로어 도입 (${R.salaryFloor}억)`},`하위 구단 투자 부족 (최저 ${pays[0].toFixed(1)}억, 중간값 ${med.toFixed(1)}억)`);
      else {
        add('floor',neg*3-0.5,()=>{const o=R.salaryFloor;R.salaryFloor=rc(o*0.8);return `샐러리플로어 인하 ${o}억 → ${R.salaryFloor}억`},`적자 구단 ${Math.round(neg*100)}% — 재정 부담 완화`);
        add('floor',(avg(cashes)/(20*ps))-1.2+(0.5-B),()=>{const o=R.salaryFloor;R.salaryFloor=rc(o*1.2);return `샐러리플로어 인상 ${o}억 → ${R.salaryFloor}억`},`구단 재정 여유 — 투자 확대 요구`);
      }
      const regPow=(db.global&&db.global.power[R.id])||1;
      add('import',(1.2-regPow)+(45-H)/25-(R.importLimit>=3?0.6:0),()=>{const o=R.importLimit??2;R.importLimit=o+1;return `외국인 선수 한도 ${o} → ${R.importLimit}명`},`국제 경쟁력 보강·해외 스타 유치 (지수 ${regPow})`);
      if((R.importLimit??2)>1) add('import',faDepth-1.8+(regPow-1.5),()=>{const o=R.importLimit??2;R.importLimit=o-1;return `외국인 선수 한도 ${o} → ${R.importLimit}명`},`자국 유망주 출전 기회 확대 (FA 인재 ${faDepth.toFixed(1)}명/팀)`);
      const SPL={1:'단일 시즌제',2:'2스플릿제',3:'3스플릿제'};
      if((R.splits||1)<3) add('splits',(H-58)/15+trend/25,()=>{const o=R.splits||1;R.splits=o+1;return `${SPL[o]} → ${SPL[R.splits]} 전환`},`흥행 호조로 시즌 콘텐츠 확대`);
      if((R.splits||1)>1) add('splits',(38-H)/15-trend/25,()=>{const o=R.splits;R.splits=o-1;return `${SPL[o]} → ${SPL[R.splits]} 전환`},`흥행 부진, 일정 피로도 완화`);
    }
    if(up!==undefined) add('playoffs',(0.55-B)*3+(H<45?0.2:0),()=>{const o=R.playoffTake;R.playoffTake=up;return `플레이오프 ${o}팀 → ${up}팀 확대`},`순위 경쟁 약화 (균형 ${B})`);
    if(R.playoffTake>4) add('playoffs',(B-0.75)*3-0.2,()=>{const o=R.playoffTake;R.playoffTake=takes.filter(x=>x<o&&x>0).pop()||4;return `플레이오프 ${o}팀 → ${R.playoffTake}팀 축소`},`정규 시즌 경쟁이 충분히 치열함 (균형 ${B})`);
    // 진행 방식: 균형이 낮으면 두 번째 기회(더블 엘리), 팀이 많으면 그룹으로 일정 압축, 흥행이 낮으면 단순화
    const fmtU={rr_de:(0.5-B)*2+(H>50?0.2:0),groups_po:(n>=12?0.6:n>=10?0.1:-9)+(H-50)/40,rr_po:(42-H)/20+(B-0.6)};
    const fmt=Object.entries(fmtU).filter(([k])=>k!==(R.format||'rr_po')).sort((a,b)=>b[1]-a[1])[0];
    if(fmt) add('format',fmt[1]-0.1,()=>{const o=R.format||'rr_po';R.format=fmt[0];if(!R.playoffTake)R.playoffTake=4;return `진행 방식 변경: ${LEAGUE_FORMATS[o]} → ${LEAGUE_FORMATS[fmt[0]]}`},fmt[0]==='rr_de'?`하위 시드에 두 번째 기회 — 흥행 반전 기대 (균형 ${B})`:fmt[0]==='groups_po'?`참가 팀 증가로 일정 압축 (${n}팀)`:'단순한 방식으로 복귀');
    if(R.playoffBo===3) add('bo',(H-50)/15,()=>{R.playoffBo=5;return '플레이오프 Bo5 도입'},`흥행 호조 — 결승 무대 강화`);
    else add('bo',(33-H)/15,()=>{R.playoffBo=3;return '플레이오프 초반 라운드 Bo3로 축소'},`제작 비용 절감`);
    props.sort((a,b)=>b.u-a.u);
    let done=0;
    for(const p of props){ if(p.u<thr+done*0.3||done>=(mid?1:4))break;
      if(props.slice(0,props.indexOf(p)).some(q=>grp(q.key)===grp(p.key)))continue;
      const what=p.apply(); R.decisions=[...(R.decisions||[]),{year:db.world.year,key:grp(p.key),what,why:p.why,mid:!!mid}].slice(-12);
      ev(`${R.leagueName} 사무국${mid?' (시즌 중 점검)':''}: ${what} — ${p.why}`); done++; }
  }
}
function officeMidSeason(db,rng,f){officeDecisions(db,rng,f,t=>news(db,t),true)}
function foldTeam(db,t){t.active=false;t.folded=db.year;t.roster.forEach(pid=>{const p=db.players[pid];if(p){p.team=null;p.faYears=0}});t.roster=[]}

// 세계 단위 결정: 새 지역, 새 국제대회, 구단 인수
function worldDecisions(db,rng,f,ev){
  if(f<=0)return;
  const gev=(what,why)=>{db.global.decisions=[...(db.global.decisions||[]),{year:db.world.year,what,why}].slice(-15);ev(`국제 e스포츠 사무국: ${what} — ${why}`)};
  const nR=Object.keys(db.regions).length, avgH=db.worldHype/Math.max(1,nR);
  // 새 지역 합류: 모(母)리그가 있는 신흥 지역은 '분리 독립', 없으면 신규 출범
  const pool=Object.keys(REGION_PRESETS).filter(k=>!db.regions[k]&&!(db.global.dissolved||[]).includes(k)).map(id=>{const P=REGION_PRESETS[id],par=P.parent&&db.regions[P.parent],pm=par&&(par.metrics||[]).slice(-1)[0];
    return {id,P,par,score:P.strength/10+(pm?(pm.hype-45)/15:0)+(par?activeTeams(db,par.id,1).length/10:0)}}).sort((a,b)=>b.score-a.score);
  const pJoin=clamp((avgH-40)/50,0,0.35)*f;
  if(pool.length&&rng.chance(pJoin)){
    const c=rng.chance(0.7)?pool[0]:rng.pick(pool), id=c.id, off=rng.pick(Object.keys(OFFICE_STYLES));
    const nSlots=clamp(Math.round((REGION_PRESETS[id].strength-58)/3.5),1,3), cfg=regionCfg(id,{div2:false,office:off,slots:nSlots});
    const R=addRegion(db,rng,cfg);
    let why=`세계 흥행 평균 ${Math.round(avgH)}`;
    if(c.par){
      // 모리그에서 팬덤이 약한 구단 2곳이 새 리그로 이적 (연고 이전) — 모리그는 신규 창단으로 짝수 유지
      const mv=activeTeams(db,c.par.id,1).filter(t=>!t.franchised).sort((a,b)=>(a.fans||0)-(b.fans||0)).slice(0,activeTeams(db,c.par.id,1).length>=8?2:0);
      for(const t of mv){t.region=id;t.division=1;t.roster.forEach(pid=>{const p=db.players[pid];if(p)p.region=id});activeTeams(db,c.par.id,2).filter(a=>a.parent===t.id).forEach(a=>foldTeam(db,a))}
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
          t.region=dst.id;t.division=1;t.roster.forEach(pid=>{const p=db.players[pid];if(p)p.region=dst.id});(got[dst.leagueName]=got[dst.leagueName]||[]).push(t.name)}
        for(const t of activeTeams(db,P.id,2))foldTeam(db,t);
        Object.values(db.players).filter(p=>!p.retired&&!p.team&&p.region===P.id).forEach(p=>p.region=kids[0]);
        const heirs=kids.map(k=>db.regions[k]).sort((a,b)=>b.strength-a.strength);
        for(let k=0;k<P.slots;k++)heirs[k%heirs.length].slots++;
        for(const k of kids)db.regions[k].parent=null;
        delete db.regions[P.id];(db.global.dissolved=db.global.dissolved||[]).push(P.id);
        why+=` · 권역의 모든 지역이 독립해 ${P.leagueName} 해체 — 잔여 구단 분산(${Object.entries(got).map(([l,n])=>`${l}: ${n.length}팀`).join(', ')}), 진출권 ${P.slots}장 승계`;
      } else if(activeTeams(db,P.id,1).length<6){
        const rest=activeTeams(db,P.id,1);
        for(const t of rest){t.region=id;t.roster.forEach(pid=>{const p=db.players[pid];if(p)p.region=id})}
        for(const t of activeTeams(db,P.id,2))foldTeam(db,t);
        Object.values(db.players).filter(p=>!p.retired&&!p.team&&p.region===P.id).forEach(p=>p.region=id);
        R.slots=Math.max(R.slots,P.slots);
        for(const k of Object.keys(REGION_PRESETS))if(REGION_PRESETS[k].parent===P.id&&db.regions[k])db.regions[k].parent=null;
        delete db.regions[P.id];
        why+=` · ${P.leagueName} 해체 — 잔여 ${rest.length}팀과 진출권 ${P.slots}장을 ${cfg.leagueName}이 승계`;
      }
    }
    gev(`새 지역 리그: ${cfg.name} — ${cfg.leagueName} 출범 (${activeTeams(db,id,1).length}팀, 월즈 ${cfg.slots}장)`,why+` · 진출권은 리그 수준(${REGION_PRESETS[id].strength})에 맞춰 배정`);
  }
  // 리그 통합: 흥행이 2년 연속 침체한 두 지역은 하나의 리그로 합친다
  const lowE=Object.values(db.regions).filter(R=>R.tier==='emerging'&&R.parent&&db.regions[R.parent]&&(R.metrics||[]).length>=2&&R.metrics.slice(-2).every(m=>m.hype<28));
  if(lowE.length&&rng.chance(0.5*f)){ // 신흥 리그가 2년 연속 침체하면 모리그로 재통합
    const g=lowE[0], host=db.regions[g.parent];
    const ts=activeTeams(db,g.id,1).sort((a,b)=>(b.fans||0)-(a.fans||0)), keep=ts.slice(0,2);
    for(const t of ts){if(keep.includes(t)){t.region=host.id;t.division=1;t.roster.forEach(id=>{const p=db.players[id];if(p)p.region=host.id})}else foldTeam(db,t)}
    for(const t of activeTeams(db,g.id))foldTeam(db,t);
    Object.values(db.players).filter(p=>!p.retired&&!p.team&&p.region===g.id).forEach(p=>p.region=host.id);
    delete db.regions[g.id];
    gev(`${g.leagueName} 해체 — ${host.leagueName}로 재통합 (${keep.map(t=>t.name).join(', ')} 합류)`,'2년 연속 흥행 침체');
  }
  const low=Object.values(db.regions).filter(R=>(R.metrics||[]).length>=2&&R.metrics.slice(-2).every(m=>m.hype<30)).sort((a,b)=>a.strength-b.strength);
  if(Object.keys(db.regions).length>=5&&low.length>=2&&low.every(R=>R.tier!=='major')&&rng.chance(0.4*f)){
    const [A,B]=low, host=A.strength>=B.strength?A:B, gone=host===A?B:A;
    for(const t of activeTeams(db,gone.id)){t.region=host.id;t.division=1;t.parent=null;t.roster.forEach(id=>{const p=db.players[id];if(p)p.region=host.id})}
    Object.values(db.players).filter(p=>!p.retired&&!p.team&&p.region===gone.id).forEach(p=>p.region=host.id);
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
    const p=(0.012+(t.fans>=45&&s<R.strength-2?0.05:0)+(t.fans<15?0.04:0))*f;
    if(rng.chance(p)){const old=t.name,on=orgName(db,rng);t.name=on.name;t.formerNames=[...(t.formerNames||[]),old];t.fans=Math.round(t.fans*0.85);
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
  if(avgHype>=50&&db.global.wcCap<Math.min(40,nReg*5)&&rng.chance(0.5*f)){db.global.wcCap+=2;gev(`월즈 참가 상한 ${db.global.wcCap}팀으로 확대`,`세계 흥행 평균 ${Math.round(avgHype)} — 더 많은 팀에 국제 무대 제공`)}
  else if(avgHype<34&&db.global.wcCap>16&&rng.chance(0.4*f)){db.global.wcCap-=2;gev(`월즈 참가 상한 ${db.global.wcCap}팀으로 축소`,`세계 흥행 평균 ${Math.round(avgHype)} — 일정·비용 부담`)}
  for(const it of db.worldConfig.internationals.filter(i=>i.tier==='low')){
    if(avgHype>=44&&(it.per||2)<6&&rng.chance(0.35*f)){it.per=(it.per||2)+1;gev(`${it.name} 지역당 ${it.per}팀으로 확대`,`세계 흥행 평균 ${Math.round(avgHype)} — 중하위권 국제 경험 확대`)}
    else if(avgHype<30&&(it.per||2)>1&&rng.chance(0.3*f)){it.per=(it.per||2)-1;gev(`${it.name} 지역당 ${it.per}팀으로 축소`,`세계 흥행 부진 (평균 ${Math.round(avgHype)})`)}
  }
  // 2) 월드 진출권 재배분: 국제 성적 상위 지역 +1, 하위 지역 -1 (넉넉하게: 최소 1, 최대 5)
  const rk=Object.values(db.regions).filter(R=>cnt[R.id]).sort((a,b)=>db.global.power[b.id]-db.global.power[a.id]);
  if(rk.length>=3&&rng.chance(0.55*f)){
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
    if(!rng.chance(0.25*f))continue;
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
  // 4) 패치 주기: 메타가 고이면 더 자주, 너무 요동치면 느리게
  const mt=metaTable(db).slice(0,10), conc=mt.reduce((a,x)=>a+x.pres,0)/10;
  const pt=db.patches, cad=pt.cadence||14;
  if(conc>0.4&&cad>10&&rng.chance(0.5*f)){pt.cadence=cad-3;gev(`패치 주기 ${pt.cadence}일로 단축`,`상위 챔피언 밴픽률 평균 ${Math.round(conc*100)}% — 메타 고착`)}
  else if(conc<0.2&&cad<21&&rng.chance(0.4*f)){pt.cadence=cad+3;gev(`패치 주기 ${pt.cadence}일로 연장`,`메타 다양성 충분 (상위 밴픽률 ${Math.round(conc*100)}%)`)}
  worldDecisions(db,rng,f,ev);
}
