// ===== LOL GM: Finance / Monte Carlo manager UI =====
function financePanel(t){
  const f=t.finance; if(!f)return '';
  const R=DB.regions[t.region], last=f.history.slice(-1)[0], pay=payroll(DB,t);
  const RK={league:'중계권 분배',sponsor:'스폰서',merch:'굿즈',prize:'상금',owner:'구단주 지원',tax:'사치세 분배'}, EK={salary:'연봉',staff:'코칭 스태프',ops:'운영비',facility:'훈련 시설',floor:'플로어 부담금',buyout:'계약 해지금',tax:'사치세'};
  return `<section><h3>재정</h3><div class="fin">
    <div><span>보유 자금</span><b class="${f.cash<0?'neg':''}">${money(f.cash)}</b></div>
    <div><span>연봉 총액</span><b>${money(pay)}</b><small>${R.spendingRule==='sfr_top5'?`SFR 상위 5인 ${money(regulatedPayroll(DB,t))} · 기준 ${money(R.salaryCap)}${regulatedPayroll(DB,t)>R.salaryCap?' 초과':''}`:'구단 자체 예산'}</small></div>
    <div><span>영입 예산</span><b>${money(Math.max(0,salaryBudget(DB,t)-pay))}</b></div>
    <div><span>구단주 재력</span><b>${t.owner?t.owner.wealth:'—'}</b></div>
  </div>
  ${last?`<div class="rgrid"><div><h4>${last.year} 수입 ${money(Object.values(last.rev).reduce((a,b)=>a+b,0))}</h4>${Object.entries(last.rev).filter(([,v])=>v).map(([k,v])=>`<div class="arow"><span>${RK[k]||k}</span><span class="num">${money(v)}</span></div>`).join('')}</div>
  <div><h4>${last.year} 지출 ${money(Object.values(last.exp).reduce((a,b)=>a+b,0))}</h4>${Object.entries(last.exp).filter(([,v])=>v).map(([k,v])=>`<div class="arow"><span>${EK[k]||k}</span><span class="num">${money(v)}</span></div>`).join('')}<div class="arow"><span><b>순이익</b></span><span class="num ${last.net<0?'lo':'hi'}"><b>${money(last.net)}</b></span></div></div></div>`:'<p class="hint">첫 시즌이 끝나면 결산이 나옵니다.</p>'}</section>`;
}
function financeTable(rid){
  const ts=activeTeams(DB,rid).sort((a,b)=>b.finance.cash-a.finance.cash);
  return `<div class="scroll"><table><thead><tr><th>구단</th><th>팬덤</th><th>보유 자금</th><th>연봉 총액</th><th>지난 시즌 순이익</th></tr></thead><tbody>
  ${ts.map(t=>{const l=t.finance.history.slice(-1)[0];return `<tr class="${t.id===managedTeamId(DB)?'mine':''}"><td><b>${esc(t.name)}</b></td><td class="num">${t.fans??'—'}</td><td class="num">${money(t.finance.cash)}</td><td class="num">${money(payroll(DB,t))}</td><td class="num ${l&&l.net<0?'lo':''}">${l?money(l.net):'—'}</td></tr>`}).join('')}
  </tbody></table></div>`;
}
function viewMC(){
  const act=activeTeams(DB);if(!DB.teams[MC.blue]||DB.teams[MC.blue].active===false)MC.blue=act[0].id;if(!DB.teams[MC.red]||DB.teams[MC.red].active===false)MC.red=act[1].id;
  return `<section class="controls">
    <label>블루<select id="mb">${teamOpts(MC.blue)}</select></label>
    <label>레드<select id="mr">${teamOpts(MC.red)}</select></label>
    <label>반복<select id="mn">${[100,300,1000].map(n=>`<option${n===MC.n?' selected':''}>${n}</option>`).join('')}</select></label>
    <button class="primary" id="mrun">시뮬레이션 실행</button>
  </section>
  <div id="mcout">${MC.res?renderMC(MC.res):'<p class="empty">같은 대진을 여러 번 돌려 승률과 경기 지표의 분포를 확인합니다. 전술이나 능력치를 바꾼 뒤 다시 돌려 비교해 보세요.</p>'}</div>`;
}
function renderMC(a){
  const n=a.n,pct=v=>(v/n*100).toFixed(1)+'%',per=v=>(v/n).toFixed(1);
  const bt=DB.teams[a.blue].short, rt=DB.teams[a.red].short;
  const rows=[['승률',pct(a.wins),pct(n-a.wins)],['평균 킬',per(a.kills[0]),per(a.kills[1])],['평균 포탑',per(a.towers[0]),per(a.towers[1])],['평균 드래곤',per(a.dragons[0]),per(a.dragons[1])],['바론 획득률',pct(a.baron[0]),pct(a.baron[1])],['첫 드래곤',pct(a.fd),pct(n-a.fd)],['첫 포탑',pct(a.ft),pct(n-a.ft)],['퍼스트 블러드',pct(a.fb),pct(n-a.fb)],['한타 승리 (합계)',a.fights[0],a.fights[1]]];
  const bins=new Array(8).fill(0);a.times.forEach(t=>bins[Math.min(7,Math.max(0,Math.floor((t-15)/5)))]++);const bm=Math.max(...bins);
  return `<section class="board mcb"><div class="side blue"><div class="tname">${esc(DB.teams[a.blue].name)}</div></div><div class="score"><span>${(a.wins/n*100).toFixed(0)}</span><i>%</i><div class="dur">${n}경기 · 평균 ${Math.floor(a.time/n)}분 · GD@15 ${a.gd15/n>=0?'+':''}${Math.round(a.gd15/n)}</div></div><div class="side red"><div class="tname">${esc(DB.teams[a.red].name)}</div></div></section>
  <section><div class="scroll"><table class="mct"><thead><tr><th>지표</th><th class="bh">${esc(bt)}</th><th class="rh">${esc(rt)}</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r[0]}</td><td class="num">${r[1]}</td><td class="num">${r[2]}</td></tr>`).join('')}</tbody></table></div></section>
  <section><h3>경기 시간 분포</h3><div class="hist">${bins.map((b,i)=>`<div><i style="height:${bm?b/bm*100:0}%"></i><span>${15+i*5}${i===7?'+':''}</span></div>`).join('')}</div></section>`;
}
function bindMC(){
  $('#mb').onchange=e=>MC.blue=e.target.value;$('#mr').onchange=e=>MC.red=e.target.value;$('#mn').onchange=e=>MC.n=+e.target.value;
  $('#mrun').onclick=()=>{
    if(MC.running)return;
    MC.running=true;
    const btn=$('#mrun'),db=DB,blue=MC.blue,red=MC.red;
    const task=beginUiTask('monte-carlo',()=>{MC.running=false});
    const baseSeed=freshInternalSeed('mc'), acc={wins:0,time:0,gd15:0,fd:0,ft:0,fb:0,baron:[0,0],kills:[0,0],towers:[0,0],dragons:[0,0],fights:[0,0],n:0,times:[],blue,red};
    let i=0;const N=MC.n;
    const step=()=>{
      if(!isUiTaskCurrent(task))return;
      try{
        const end=Math.min(N,i+25);
        for(;i<end;i++){
          const r=simulateMatch(db,blue,red,baseSeed+'#'+i);
          acc.n++;if(r.winner===0)acc.wins++;acc.time+=r.duration;acc.times.push(r.duration);
          acc.gd15+=r.goldHist[14]??r.goldHist[r.goldHist.length-1];
          if(r.firsts.dragon===0)acc.fd++;if(r.firsts.tower===0)acc.ft++;if(r.firsts.blood===0)acc.fb++;
          for(const side of [0,1]){
            acc.baron[side]+=r.sides[side].barons>0?1:0;acc.kills[side]+=r.sides[side].kills;
            acc.towers[side]+=r.sides[side].towersTaken;acc.dragons[side]+=r.sides[side].dragons.length;
          }
          for(const l of r.log)if(l.kind==='fight')acc.fights[l.side]++;
        }
        btn.textContent=`실행 중 ${i}/${N}`;
        if(i<N)setTimeout(step,0);
        else if(finishUiTask(task)){
          MC.res=acc;MC.running=false;btn.textContent='시뮬레이션 실행';
          const output=$('#mcout');if(output)output.innerHTML=renderMC(acc);
        }
      }catch(e){
        finishUiTask(task);MC.running=false;
        btn.textContent='시뮬레이션 실행';
        const output=$('#mcout');if(output)output.textContent='시뮬레이션 오류: '+e.message;
        console.error('LOL GM Monte Carlo failed',e);
      }
    };
    step();
  };
}
