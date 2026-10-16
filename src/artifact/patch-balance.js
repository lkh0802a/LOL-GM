// ===== LOL GM: patch evidence and champion/system balance diagnosis =====
const PATCH_SIZE_KO={micro:'미세',small:'소규모',medium:'중간',large:'대규모'};
const PATCH_SIZE_PROFILE={
  micro:{stat:[.005,.012],cd:[.25,.5],range:[10,20],cost:[5,10],mod:[.01,.018]},
  small:{stat:[.012,.022],cd:[.5,1],range:[15,30],cost:[5,15],mod:[.018,.03]},
  medium:{stat:[.022,.04],cd:[1,1.75],range:[25,50],cost:[10,20],mod:[.03,.05]},
  large:{stat:[.04,.065],cd:[1.5,2.5],range:[40,75],cost:[15,30],mod:[.05,.08]}
};
function patchHistory(db){return db.patches.history&&db.patches.history.length?db.patches.history:db.patches.list||[]}
function patchEvidenceRows(db){
  const c=metaHistoryIndex(db),id=db.patch.id;
  if(c.patchSorted.has(id)){
    const hit=c.patchSorted.get(id);
    c.patchSorted.delete(id);c.patchSorted.set(id,hit);
    return hit;
  }
  const rows=(c.byPatch.get(id)||EMPTY_META_HISTORY).slice().sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  return metaCacheRemember(c.patchSorted,id,rows,META_PATCH_SORT_LIMIT);
}
function patchTeamPower(db,tid){
  const t=db.teams&&db.teams[tid];if(!t)return 0;
  const vals=(t.roster||[]).map(id=>db.players&&db.players[id]).filter(Boolean).map(p=>playerOvr(p));
  return vals.length?avg(vals):Number(t.base||t.reputation||50);
}
function patchEvidenceContext(db,rows){
  const tids=[...new Set(rows.flatMap(r=>(r.sides||[]).map(s=>s.team).filter(Boolean)))],powers=tids.map(t=>patchTeamPower(db,t)).sort((a,b)=>a-b);
  return {topCut:powers.length?powers[Math.floor((powers.length-1)*.75)]:Infinity,regionCount:Math.max(1,Object.keys(db.regions||{}).length)};
}
function patchChampionEvidence(db,cid,rows,ctx){
  rows=rows||patchEvidenceRows(db);ctx=ctx||patchEvidenceContext(db,rows);
  let p=0,w=0,b=0,intl=0,top=0,recentP=0,recentB=0,oldP=0,oldB=0;const pos={},regions={},teams={},players={},partners={};
  const cut=Math.floor(rows.length/2);
  rows.forEach((r,ri)=>{
    const recent=ri>=cut;if((r.bans||[]).includes(cid)){b++;if(recent)recentB++;else oldB++}
    for(const side of r.sides||[]){const picks=(side.picks||[]).map(x=>typeof x==='string'?{champ:x}:x),me=picks.find(x=>x.champ===cid);if(!me)continue;
      p++;if(side.win)w++;if(recent)recentP++;else oldP++;if(r.international)intl++;if(me.role)pos[me.role]=(pos[me.role]||0)+1;if(side.region)regions[side.region]=(regions[side.region]||0)+1;
      if(side.team){teams[side.team]=(teams[side.team]||0)+1;if(patchTeamPower(db,side.team)>=ctx.topCut)top++}if(me.player)players[me.player]=(players[me.player]||0)+1;
      for(const x of picks)if(x.champ!==cid)partners[x.champ]=(partners[x.champ]||0)+1;
    }
  });
  const games=Math.max(1,rows.length),pres=(p+b)/games,wr=p?(w+2)/(p+4):.5,recentGames=Math.max(1,rows.length-cut),oldGames=Math.max(1,cut),recentPres=(recentP+recentB)/recentGames,oldPres=(oldP+oldB)/oldGames,trend=recentPres-oldPres;
  const maxShare=o=>{const v=Object.values(o);return p&&v.length?Math.max(...v)/p:0},playerConc=maxShare(players),teamConc=maxShare(teams),comboConc=maxShare(partners),flex=Object.keys(pos).length,regionSpread=Object.keys(regions).length/ctx.regionCount,intlShare=p?intl/p:0,topShare=p?top/p:0;
  const confidence=clamp((p+b)/(p+b+12)*Math.min(1,rows.length/24),0,1);
  const nerfSignal=pres*1.02+(patchWinInterval(w,p).lower>.53?Math.max(0,wr-.53)*2.4*confidence:0)+Math.max(0,trend)*.8+Math.max(0,flex-1)*.055+intlShare*.07+regionSpread*.05-Math.max(0,playerConc-.45)*.2-Math.max(0,teamConc-.5)*.12-Math.max(0,comboConc-.65)*.08;
  // Low use is an observation, never a buff entitlement. Bans are not performance samples.
  const performance=patchWinInterval(w,p),buffSignal=Math.max(0,.47-wr)*1.7*confidence;
  let dir=0,signal=0;if(rows.length>=8&&nerfSignal>=.48&&nerfSignal-buffSignal>=.16){dir=-1;signal=nerfSignal}else if(rows.length>=12&&performance.upper<.47&&buffSignal>=.2&&buffSignal-nerfSignal*.38>=.07){dir=1;signal=buffSignal}
  const diagnosis=dir<0?(flex>=2&&pres>.25?'플렉스와 프로 우선순위 과다':wr>=.545&&confidence>.25?'실전 성능 과다':topShare>.65?'상위권 중심 우선순위 과다':'밴픽 압력 과다'):(dir>0?'표본 불확실성을 고려한 낮은 실전 성능':'관찰');
  const why='표본 '+rows.length+'경기 · 밴픽 '+Math.round(pres*100)+'% · 승률 '+Math.round(wr*100)+'% · 최근 추세 '+(trend>=0?'+':'')+Math.round(trend*100)+'%p'+(flex>1?' · '+flex+'포지션 플렉스':'')+(intlShare>.2?' · 국제전 비중 '+Math.round(intlShare*100)+'%':'')+(playerConc>.5?' · 특정 선수 의존 '+Math.round(playerConc*100)+'%':'')+(teamConc>.55?' · 특정 팀 의존 '+Math.round(teamConc*100)+'%':'');
  return {c:db.patch.champions[cid],cid,games:rows.length,p,b,w,pres,wr,trend,confidence,flex,regionSpread,intlShare,topShare,playerConc,teamConc,comboConc,nerfSignal,buffSignal,dir,signal,diagnosis,why};
}
function patchSizeForSignal(signal,major){
  let s=signal>=.9?'large':signal>=.68?'medium':signal>=.42?'small':'micro';
  if(major&&s==='micro')s='small';return s;
}
function diagnosePatchMeta(db,major=false){
  const rows=patchEvidenceRows(db),ctx=patchEvidenceContext(db,rows),champions=Object.keys(db.patch.champions).map(id=>patchChampionEvidence(db,id,rows,ctx));
  const reviews=patchReworkReviews(db,champions);
  return {sampleGames:rows.length,rows,ctx,champions,reviews,major:!!major};
}
// Wilson 95% intervals describe observed win uncertainty, not the probability
// of a champion being strong. No manager identity or private practice is read.
function patchWinInterval(wins,games){
  if(!games)return {lower:0,upper:1};
  const z=1.959963984540054,p=wins/games,z2=z*z,den=1+z2/games,
    centre=(p+z2/(2*games))/den,half=z*Math.sqrt(p*(1-p)/games+z2/(4*games*games))/den;
  return {lower:Math.max(0,centre-half),upper:Math.min(1,centre+half)};
}
function patchReworkReviews(db,champions){
  // Reuse the existing two-patch lookback plus the current patch, 24-game
  // observation horizon and 2.5% low-presence label. These are game policy,
  // not empirically calibrated professional balance thresholds.
  const history=patchHistory(db),ids=[...new Set([...history.map(p=>p.id),db.patch.id])].slice(-3),index=metaHistoryIndex(db);
  return champions.map(d=>{
    const c=d.c,windows=ids.map(id=>{
      const rows=(index.byPatch.get(id)||EMPTY_META_HISTORY).filter(r=>
        typeof r.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(r.date)&&r.date<=db.worldDate&&(!c.releaseDate||r.date>=c.releaseDate)&&championProEligible(db,c,r.date));
      let p=0,w=0,b=0;const roles={},matchups={},teams=new Map(),players=new Map();
      for(const row of rows){if((row.bans||[]).includes(d.cid))b++;
        for(const side of row.sides||[]){const picks=(side.picks||[]).map(x=>typeof x==='string'?{champ:x}:x),me=picks.find(x=>x.champ===d.cid);if(!me)continue;
          p++;if(side.win)w++;if(side.team)teams.set(side.team,(teams.get(side.team)||0)+1);if(me.player)players.set(me.player,(players.get(me.player)||0)+1);
          if(me.role){const r=roles[me.role]||(roles[me.role]={p:0,w:0});r.p++;if(side.win)r.w++;
            const opp=(row.sides||[]).find(x=>x!==side),other=(opp?.picks||[]).map(x=>typeof x==='string'?{champ:x}:x).find(x=>x.role===me.role);
            if(other){const m=matchups[me.role+':'+other.champ]||(matchups[me.role+':'+other.champ]={p:0,w:0});m.p++;if(side.win)m.w++}
          }
        }
      }
      return {id,games:rows.length,p,w,b,pres:rows.length?(p+b)/rows.length:0,
        interval:patchWinInterval(w,p),roles,matchups,teams:teams.size,players:players.size,teamConc:p?Math.max(0,...teams.values())/p:0,playerConc:p?Math.max(0,...players.values())/p:0,
        firstDate:rows.reduce((a,r)=>a<r.date?a:r.date,rows[0]?.date||null)};
    });
    const result={cid:d.cid,status:'observe',scope:null,reason:'충분한 관측 기회가 쌓이지 않음',windows};
    if(!championProEligible(db,c)){result.reason='현재 대회 사용 제한';return result}
    if(windows.length<3||windows.some(x=>x.games<24))return result;
    if(windows.some(x=>x.pres>=.025)){result.status='retain';result.reason='최근 선택·밴 또는 활용 증가가 있어 유지';return result}
    if(windows.some(x=>Object.values(x.roles).concat(Object.values(x.matchups)).some(r=>patchWinInterval(r.w,r.p).lower>=.47))){
      result.status='retain';result.reason='실제 포지션·상대 조합에서 성과가 확인된 틈새 픽';return result;
    }
    if(windows.some(x=>!x.p||x.interval.upper>=.47||x.teams<2||x.players<2||x.teamConc>.5||x.playerConc>.45||Object.values(x.roles).reduce((n,r)=>n+r.p,0)!==x.p||
      Object.values(x.roles).some(r=>patchWinInterval(r.w,r.p).upper>=.47))){result.reason='저사용만으로 설계 문제를 단정하지 않음 · 출전·역할·분산 근거 부족';return result}
    const first=windows[0].firstDate,lastChange=[...history].reverse().find(p=>(p.notes||[]).some(n=>n.c===d.cid&&['skill','base','kit','rework'].includes(n.type)));
    if(!lastChange||!lastChange.date||lastChange.date>=first){result.reason='이전 조정 이후의 독립 관측·효과 부족 근거가 더 필요';return result}
    const prior=(lastChange.notes||[]).filter(n=>n.c===d.cid),mid=prior.some(n=>n.type==='rework'&&n.scope==='mid');
    if(!mid&&!prior.some(n=>n.dir===1&&n.category!=='rework')){result.reason='수치 보강을 거치지 않은 저사용은 구조 변경 근거로 쓰지 않음';return result}
    result.status='candidate';result.scope=mid?'major':'mid';
    result.reason=mid?'소규모 업데이트 뒤에도 세 관측 구간의 역할 부진이 지속 · 대규모 검토 후보':'이전 보강 뒤에도 세 관측 구간의 역할 부진이 지속 · 소규모 검토 후보';
    return result;
  });
}
function recentDirectionCount(db,cid,dir,lookback=2){
  return patchHistory(db).slice(-lookback).reduce((z,p)=>z+(p.notes||[]).some(n=>n.c===cid&&n.dir===dir&&['skill','base','kit'].includes(n.type))?1:0,0);
}
function lastChampionChange(db,cid){
  const h=patchHistory(db);for(let i=h.length-1;i>=0;i--)for(let j=(h[i].notes||[]).length-1;j>=0;j--){const n=h[i].notes[j];if(n.c===cid&&n.dir&&['skill','base','kit'].includes(n.type))return {patch:h[i],note:n}}return null;
}
function blendPatchValue(cur,target,f){
  if(Array.isArray(cur)&&Array.isArray(target))return cur.map((x,i)=>Number.isFinite(+x)&&Number.isFinite(+target[i])?Math.round((+x+(+target[i]-+x)*f)*100)/100:x);
  return Number.isFinite(+cur)&&Number.isFinite(+target)?Math.round((+cur+(+target-+cur)*f)*100)/100:cur;
}
function partialChampionRollback(db,diag,rng){
  const hit=lastChampionChange(db,diag.cid);if(!hit||hit.note.dir===diag.dir||hit.note.old==null)return null;const n=hit.note,c=diag.c,f=rng.range(.35,.65),out={...n,dir:diag.dir,size:'micro',category:'rollback',why:'직전 '+hit.patch.id+' 조정의 과도한 반응을 부분 롤백 · '+diag.why,rollbackOf:hit.patch.id};
  if(n.type==='skill'&&c.skills&&c.skills[n.slot]){out.old=JSON.parse(JSON.stringify(c.skills[n.slot][n.field]));out.new=blendPatchValue(out.old,n.old,f)}
  else if(n.type==='base'){out.old=c.base[n.key];out.new=blendPatchValue(out.old,n.old,f)}
  else if(n.type==='kit'){out.old=c.kit[n.key];out.new=Math.round(blendPatchValue(out.old,n.old,f)*10)/10;out.d=out.new-out.old}
  if(JSON.stringify(out.old)===JSON.stringify(out.new))return null;return out;
}
function shiftedArray(old,delta,min=0,max=9999){
  return old.map(x=>{const n=Number(x);if(!Number.isFinite(n)||n<=0)return x;return Math.round(clamp(n+delta,min,max)*100)/100});
}
function championBalanceNote(db,diag,dir,size,rng,category='balance'){
  const c=diag.c,p=PATCH_SIZE_PROFILE[size]||PATCH_SIZE_PROFILE.small,skills=['Q','W','E','R'].map(k=>c.skills&&c.skills[k]).filter(Boolean);
  const rangeSkills=skills.filter(s=>(s.range||[]).some(x=>Number.isFinite(+x)&&+x>=100&&+x<3000)),costSkills=skills.filter(s=>(s.cost||[]).some(x=>Number.isFinite(+x)&&+x>0)),cdSkills=skills.filter(s=>Number.isFinite(+s.cooldown)&&+s.cooldown>1);
  let families=dir<0?['cooldown','damage','base','range','utility','cost']:['damage','cooldown','range','base','cost','utility','mobility'];
  if(diag.flex>=2||diag.pres>.45)families=['range','cooldown','utility','mobility','base','damage','cost'];
  if(diag.wr>=.55&&diag.confidence>.25)families=['damage','base','cooldown','sustain','range','cost'];
  for(let tries=0;tries<10;tries++){
    const fam=rng.pick(families),why=diag.diagnosis+' · '+diag.why;
    if(fam==='cooldown'&&cdSkills.length){const sk=rng.pick(cdSkills),old=+sk.cooldown,step=rng.range(p.cd[0],p.cd[1]),nv=Math.max(1,Math.round((old+(dir<0?step:-step))*4)/4);if(nv!==old)return {type:'skill',c:c.id,slot:sk.slot,field:'cooldown',old,new:nv,dir,size,category,why}}
    if(fam==='range'&&rangeSkills.length){const sk=rng.pick(rangeSkills),old=JSON.parse(JSON.stringify(sk.range)),step=Math.round(rng.range(p.range[0],p.range[1])),nv=old.map(x=>Number.isFinite(+x)&&+x>=100&&+x<3000?Math.max(100,+x+(dir<0?-step:step)):x);if(JSON.stringify(nv)!==JSON.stringify(old))return {type:'skill',c:c.id,slot:sk.slot,field:'range',old,new:nv,dir,size,category,why}}
    if(fam==='cost'&&costSkills.length){const sk=rng.pick(costSkills),old=JSON.parse(JSON.stringify(sk.cost)),step=Math.round(rng.range(p.cost[0],p.cost[1])/5)*5,nv=shiftedArray(old,dir<0?step:-step,0,250);if(JSON.stringify(nv)!==JSON.stringify(old))return {type:'skill',c:c.id,slot:sk.slot,field:'cost',old,new:nv,dir,size,category,why}}
    if(['damage','utility','sustain','mobility'].includes(fam)&&skills.length){const sk=rng.pick(skills),field=fam==='damage'?'damageMod':fam==='utility'?'utilityMod':fam==='sustain'?(rng.chance(.5)?'healMod':'shieldMod'):'mobilityMod',old=Number(sk[field]??1),step=rng.range(p.mod[0],p.mod[1]),nv=Math.round(clamp(old+(dir>0?step:-step),.72,1.3)*1000)/1000;if(nv!==old)return {type:'skill',c:c.id,slot:sk.slot,field,old,new:nv,dir,size,category,why}}
    if(fam==='base'){const keys=['hp','ad','arm','mr','hpg','adg','armg','mrg','ms','range','resource','resourceRegen'].filter(k=>Number.isFinite(c.base[k])&&(k!=='resource'||c.base[k]>0)),key=rng.pick(keys);if(!key)continue;const old=c.base[key];let nv;if(key==='ms')nv=Math.round(clamp(old+(dir>0?rng.int(2,4):-rng.int(2,4)),300,380));else if(key==='range')nv=Math.round(clamp(old+(dir>0?rng.pick([10,15,25]):-rng.pick([10,15,25])),100,700));else{const step=rng.range(p.stat[0],p.stat[1]);nv=Math.round(old*(1+(dir>0?step:-step))*100)/100}if(nv!==old)return {type:'base',c:c.id,key,old,new:nv,d:old?nv/old-1:0,dir,size,category,why}}
  }
  return null;
}
function chooseChampionBalanceChanges(db,diag,major,rng){
  const nerfN=major?rng.int(6,10):rng.int(2,4),buffN=major?rng.int(7,11):rng.int(3,5),out=[];
  const take=(dir,n)=>diag.champions.filter(x=>x.dir===dir).sort((a,b)=>b.signal-a.signal).slice(0,n*3);
  for(const dir of [-1,1]){const limit=dir<0?nerfN:buffN;let count=0;for(const d of take(dir,limit)){if(count>=limit)break;
      const last=lastChampionChange(db,d.cid);if(last&&last.note.dir!==dir){const rb=partialChampionRollback(db,d,rng);if(rb){out.push(rb);count++;continue}}
      const same=recentDirectionCount(db,d.cid,dir,2);if(same&&d.signal<.88)continue;let size=patchSizeForSignal(d.signal,major);if(same&&['medium','large'].includes(size))size='small';
      const n=championBalanceNote(db,d,dir,size,rng);if(n){out.push(n);count++}
    }}
  return out;
}
// Patch notes and patch UI request evidence for every item and rune. Build
// once from the canonical current-patch rows instead of traversing the same
// thousands of picks once per definition. Explicit external rows keep the
// original scan path to avoid stale answers for caller-mutated arrays.
const SYSTEM_USAGE_INDEX_CACHE=new WeakMap();
function patchSystemUsageIndex(db,rows){
  if(rows!==patchEvidenceRows(db))return null;
  const revision=draftPatchRevisionKey(db.patch),old=SYSTEM_USAGE_INDEX_CACHE.get(db);
  if(old&&old.rows===rows&&old.revision===revision)return old;
  const index={rows,revision,all:0,byClass:{},items:{},runes:{}};
  const accumulate=(bag,id,cls,won)=>{
    const row=bag[id]||(bag[id]={});
    const x=row[cls]||(row[cls]={uses:0,wins:0});
    x.uses++;if(won)x.wins++;
  };
  for(const match of rows)for(const side of match.sides||[])for(const raw of side.picks||[]){
    const pick=typeof raw==='string'?{champ:raw}:raw,
      champion=db.patch.champions[pick.champ];
    if(!champion)continue;
    index.all++;
    const cls=champion.cls;index.byClass[cls]=(index.byClass[cls]||0)+1;
    for(const id of new Set(pick.items||[]))accumulate(index.items,id,cls,side.win);
    for(const id of new Set(pick.runes||[]))accumulate(index.runes,id,'all',side.win);
  }
  SYSTEM_USAGE_INDEX_CACHE.set(db,index);
  return index;
}
function systemUsageEvidence(db,kind,id,rows){
  rows=rows||patchEvidenceRows(db);
  const def=kind==='item'?db.patch.itemDefs&&db.patch.itemDefs[id]:db.patch.runeDefs&&db.patch.runeDefs[id];
  if(!def||def.active===false)return {id,uses:0,eligible:0,usage:0,wr:.5,confidence:0};
  if(kind==='item'&&!['final','boots'].includes(def.tier))return {id,uses:0,eligible:0,usage:0,wr:.5,confidence:0};
  const classes=kind==='item'?(def.classes||[]):null;
  let uses=0,wins=0,eligible=0;
  const index=patchSystemUsageIndex(db,rows);
  if(index){
    if(kind==='rune'){
      eligible=index.all;
      uses=index.runes[id]?.all?.uses||0;
      wins=index.runes[id]?.all?.wins||0;
    }else{
      for(const cls of new Set(classes)){
        eligible+=index.byClass[cls]||0;
        uses+=index.items[id]?.[cls]?.uses||0;
        wins+=index.items[id]?.[cls]?.wins||0;
      }
    }
  }else{
    for(const r of rows)for(const side of r.sides||[])for(const raw of side.picks||[]){
      const p=typeof raw==='string'?{champ:raw}:raw,c=db.patch.champions[p.champ];
      if(!c||(classes&&!classes.includes(c.cls)))continue;
      eligible++;
      const arr=kind==='item'?(p.items||[]):p.runes||[];
      if(arr.includes(id)){uses++;if(side.win)wins++}
    }
  }
  const usage=eligible?uses/eligible:0,wr=uses?(wins+2)/(uses+4):.5,
    confidence=clamp(uses/(uses+10)*Math.min(1,eligible/30),0,1);
  return {id,uses,wins,eligible,usage,wr,confidence,
    nerf:Math.max(0,usage-.55)*.8+Math.max(0,wr-.53)*1.5*confidence,
    buff:Math.max(0,.16-usage)*.55+Math.max(0,.47-wr)*1.1*confidence};
}
function lastSystemChange(db,kind,id){
  const h=patchHistory(db);for(let i=h.length-1;i>=0;i--)for(let j=(h[i].notes||[]).length-1;j>=0;j--){const n=h[i].notes[j];if((n.type===kind||(kind==='item'&&n.type==='item_stat'))&&n.id===id&&n.dir)return {patch:h[i],note:n}}return null;
}
function systemBalanceNote(db,kind,ev,dir,size,rng){
  const defs=kind==='item'?db.patch.itemDefs:db.patch.runeDefs,d=defs[ev.id],p=PATCH_SIZE_PROFILE[size]||PATCH_SIZE_PROFILE.small,keys=Object.keys(d.effects||{}).filter(k=>Number.isFinite(d.effects[k]));
  if(kind==='item'&&rng.chance(.35)){const old=d.cost,step={micro:50,small:100,medium:150,large:200}[size]||100,nv=clamp(old+(dir<0?step:-step),Math.min(500,old),Math.max(4500,old));if(nv!==old)return {type:'item',id:ev.id,field:'cost',old,new:nv,dir,size,why:'아이템 사용률 '+Math.round(ev.usage*100)+'% · 승률 '+Math.round(ev.wr*100)+'%'}}
  const field=keys.length?rng.pick(keys):(kind==='item'?'offense':'utility');
  if(kind==='item'&&['offense','defense'].includes(field)){
    const fields=itemRawStatFields(d,field).filter(k=>d.stats[k]>0);
    if(fields.length){const key=rng.pick(fields),old=d.stats[key],step=rng.range(p.stat[0],p.stat[1]),nv=Math.round(old*(1+(dir>0?step:-step))*100)/100;
      if(nv!==old)return {type:'item_stat',id:ev.id,name:d.name,field:key,old,new:nv,source:{...d.source},dir,size,why:'아이템 사용률 '+Math.round(ev.usage*100)+'% · 승률 '+Math.round(ev.wr*100)+'%'};
    }
  }
  const old=Number(d.effects[field]||0),step=rng.range(p.mod[0],p.mod[1])*.6,nv=Math.round(clamp(old+(dir>0?step:-step),0,.14)*1000)/1000;if(nv===old)return null;
  return {type:kind,id:ev.id,field,old,new:nv,dir,size,why:(kind==='item'?'아이템':'룬')+' 사용률 '+Math.round(ev.usage*100)+'% · 승률 '+Math.round(ev.wr*100)+'%'};
}
function chooseSystemBalanceChanges(db,diag,major,rng){
  const planning={...db,patch:{...db.patch,itemDefs:JSON.parse(JSON.stringify(db.patch.itemDefs||{})),runeDefs:JSON.parse(JSON.stringify(db.patch.runeDefs||{}))}};
  const rows=diag.rows,out=[];for(const kind of ['item','rune']){const defs=kind==='item'?db.patch.itemDefs||{}:db.patch.runeDefs||{},evs=Object.keys(defs).map(id=>systemUsageEvidence(db,kind,id,rows)).filter(x=>x.eligible>=12),nerfs=evs.filter(x=>x.nerf>=.055).sort((a,b)=>b.nerf-a.nerf),buffs=evs.filter(x=>x.buff>=.055).sort((a,b)=>b.buff-a.buff),limit=major?2:1;
      for(const [dir,list] of [[-1,nerfs],[1,buffs]]){let n=0;for(const ev of list){if(n>=limit)break;const last=lastSystemChange(db,kind,ev.id);if(last&&last.note.dir===dir&&patchHistory(db).slice(-2).includes(last.patch))continue;const sig=dir<0?ev.nerf:ev.buff,size=patchSizeForSignal(sig*4,major),note=systemBalanceNote(planning,kind,ev,dir,size,rng);if(note){applyNote(planning.patch,note);out.push(note);n++}}}
    }return out;
}
