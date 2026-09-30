// ===== LOL GM: regional office rules and hype management =====
const OFFICE_STYLES={
  conservative:{label:'보수적',w:{cap:-0.1,floor:-0.1,tax:-0.2,import:-0.2,expand:-0.35,contract:-0.2,playoffs:-0.1,relegation:-0.2,franchise:0.1,mixed:-0.1,div2:-0.1,format:-0.25,splits:-0.2,bo:-0.1}},
  expansion:{label:'확장 지향',w:{cap:-0.1,floor:0.1,tax:-0.1,import:0.2,expand:0.45,contract:-0.3,playoffs:0.1,relegation:-0.1,franchise:0,mixed:0.1,div2:0.3,format:0.1,splits:0.1,bo:0}},
  revenue:{label:'수익 중심',w:{cap:0.2,floor:0,tax:0.1,import:0.1,expand:0.15,contract:0.15,playoffs:0.2,relegation:-0.3,franchise:0.35,mixed:0.15,div2:0,format:0.2,splits:0.3,bo:0.15}},
  balance:{label:'경쟁 균형 중시',w:{cap:0.3,floor:0.3,tax:0.3,import:-0.1,expand:0,contract:0.1,playoffs:0.3,relegation:0.35,franchise:-0.2,mixed:0.2,div2:0.2,format:0.1,splits:0,bo:0.1}}
};
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
    // Cumulative tables already include earlier split results. Summing those
    // tables again would double/triple count prior wins in office metrics.
    const latest=ss.slice().sort((a,b)=>b.split-a.split)[0];
    const tables=latest?.standingsMode==='cumulative'?[latest]:ss;
    for(const season of tables)for(const row of standings(db,season,'regular'))
      if(rec[row.tid]){rec[row.tid].w+=row.w;rec[row.tid].l+=row.l}
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
  if(f<=0||mid)return;
  const thr=.78/f;
  for(const R of Object.values(db.regions)){
    const M=R.metrics&&R.metrics[R.metrics.length-1]; if(!M)continue;
    const prev=R.metrics.length>1?R.metrics[R.metrics.length-2]:null, trend=prev?M.hype-prev.hype:0;
    const S=OFFICE_STYLES[R.office]||OFFICE_STYLES.conservative, n=activeTeams(db,R.id,1).length;
    const faDepth=Object.values(db.players).filter(p=>!p.retired&&!p.team&&isLocalPlayer(p,R.id)&&playerOvr(p)>=R.strength-10).length/Math.max(1,n);
    const weak=activeTeams(db,R.id,1).map(t=>({t,s:teamStrength(db,t.id)})).sort((a,b)=>a.s-b.s);
    const weakGap=weak.length>2?R.strength-weak[0].s:0;
    const H=M.hype, B=M.balance, props=[];
    const grp=k=>({relegation:'system',franchise:'system',mixed:'system'}[k]||k);
    const structural=new Set(['system','expand','contract','div2','format','splits','standingsMode','cap','floor','tax','import']);
    const add=(key,u,apply,why)=>{const g=grp(key),cool=structural.has(g)?4:3,last=(R.decisions||[]).filter(d=>d.key===g).slice(-1)[0];if(!last||db.world.year-last.year>=cool)props.push({key,u:u+(S.w[key]||0)+rng.normal(0,.12),apply,why})};
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
      // 재정 규정은 하드캡이 아니라 상위 5명 기준의 완만한 균형지출 제도로만 진화한다.
      const pays=activeTeams(db,R.id,1).map(t=>topFivePayroll(db,t)).sort((a,b)=>a-b),med=pays[Math.floor(pays.length/2)]||1,disp=(pays[pays.length-1]||1)/Math.max(.1,pays[0]||.1);
      const cashes=activeTeams(db,R.id,1).map(t=>t.finance.cash),neg=cashes.filter(c=>c<0).length/Math.max(1,cashes.length),ps=psOf(db,R.id),rc=v=>Math.round(v);
      if(R.spendingRule!=='sfr_top5')add('cap',(disp-2.8)/1.4+(0.5-B)-.15,()=>{R.spendingRule='sfr_top5';R.sfrMode='engine_progressive';R.sfrTeamShare=.75;R.salaryCap=rc(med*1.45);R.salaryFloor=rc(med*.5);R.luxuryTax=.75;return `균형지출제도 도입 (상위 5인 기준 ${R.salaryCap}억)`},`상위 5인 연봉 격차 ×${disp.toFixed(1)} — 지속가능성 논의`);
      else{
        const over=pays.filter(p=>p>R.salaryCap).length/pays.length;
        add('cap',over*1.5-.55+(H-60)/35,()=>{const o=R.salaryCap;R.salaryCap=rc(o*1.1);R.salaryFloor=rc(Math.min(R.salaryCap*.65,(R.salaryFloor||0)*1.08));return `균형지출 기준선 조정 ${o}억 → ${R.salaryCap}억`},`시장 성장과 초과 구단 비율 ${Math.round(over*100)}% 반영`);
        add('tax',(0.48-B)*1.5+(disp-3)/3-.35,()=>{const o=R.luxuryTax||.75;R.luxuryTax=Math.min(1.25,Math.round((o+.15)*100)/100);return `균형지출 초과 부담률 상향 ${Math.round(o*100)}% → ${Math.round(R.luxuryTax*100)}%`},`경쟁 균형 악화 (균형 ${B})`);
        add('floor',neg*2-.7,()=>{const o=R.salaryFloor;R.salaryFloor=rc(Math.max(0,o*.9));return `지출 권장 하한 ${o}억 → ${R.salaryFloor}억`},`적자 구단 ${Math.round(neg*100)}% — 하한 기준 완화`);
      }
      const regPow=(db.global&&db.global.power[R.id])||1;
      add('import',(1.2-regPow)+(45-H)/25,()=>{const o=R.importRecruitMinGap??2;R.importRecruitMinGap=Math.max(0,o-1);return `비로컬 영입 기준 완화 ${o} → ${R.importRecruitMinGap}`},`국제 경쟁력 보강·해외 스타 유치 (1군 비로컬 상한 2명은 고정)`);
      add('import',faDepth-1.8+(regPow-1.5),()=>{const o=R.importRecruitMinGap??2;R.importRecruitMinGap=Math.min(4,o+1);return `비로컬 영입 기준 강화 ${o} → ${R.importRecruitMinGap}`},`자국 유망주 출전 기회 확대 (1군 비로컬 상한 2명은 고정)`);
      const SPL={1:'단일 시즌제',2:'2스플릿제',3:'3스플릿제'};
      if((R.splits||1)<3) add('splits',(H-58)/15+trend/25,()=>{const o=R.splits||1;R.splits=o+1;return `${SPL[o]} → ${SPL[R.splits]} 전환`},`흥행 호조로 시즌 콘텐츠 확대`);
      if((R.splits||1)>1) add('splits',(38-H)/15-trend/25,()=>{const o=R.splits;R.splits=o-1;return `${SPL[o]} → ${SPL[R.splits]} 전환`},`흥행 부진, 일정 피로도 완화`);
      // The league office—not the manager—may independently revise how
      // completed split results determine annual qualification. Changes are
      // offseason-only, cooldown-governed and effective next season.
      if((R.splits||1)>1){
        const mode=R.standingsMode||'independent';
        const schemes=[
          {key:'points',score:(.58-B)*1.75+(H-48)/37+
            (R.splits===3?.24:0),why:`플레이오프 성과와 스플릿 간 종합 경쟁 반영 (흥행 ${H}, 경쟁 균형 ${B})`},
          {key:'cumulative',score:(H-46)/43+(.6-B)*.75+
            (R.splits===3?.12:0),why:`매 스플릿 정규시즌 전적 승계로 연간 성적 연속성 강화 (흥행 ${H})`},
          {key:'independent',score:(45-H)/30+(B-.48)*1.55+
            (trend<0?-.08:0),why:`기간별 독립 우승 경쟁과 새 출발 강화 (흥행 ${H}, 경쟁 균형 ${B})`}
        ];
        for(const scheme of schemes)if(scheme.key!==mode)
          add('standingsMode',scheme.score,()=>{
            const old=R.standingsMode||'independent';
            R.standingsMode=scheme.key;
            return `성적 집계 방식 변경: ${SPLIT_STANDINGS_MODES[old]} → ${SPLIT_STANDINGS_MODES[scheme.key]} (다음 시즌부터)`;
          },scheme.why);
      }
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
    for(const p of props){if(p.u<thr||done>=1)break;
      if(props.slice(0,props.indexOf(p)).some(q=>grp(q.key)===grp(p.key)))continue;
      const what=p.apply(); R.decisions=[...(R.decisions||[]),{year:db.world.year,key:grp(p.key),what,why:p.why,mid:!!mid}].slice(-12);
      ev(`${R.leagueName} 사무국${mid?' (시즌 중 점검)':''}: ${what} — ${p.why}`); done++; }
  }
}
function officeMidSeason(db,rng,f){officeDecisions(db,rng,f,t=>news(db,t),true)}
function foldTeam(db,t){t.active=false;t.folded=db.year;for(const pid of t.roster.slice()){const p=db.players[pid];if(p){removePlayerFromTeam(db,p);p.faYears=0}}t.roster=[]}

// 세계 단위 결정: 새 지역, 새 국제대회, 구단 인수
