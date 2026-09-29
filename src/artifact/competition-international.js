// ===== LOL GM: International tournament stage/format policy =====
// 국제대회: 팀 목록은 시드 순서(지역 1번 시드 → 2번 시드 …)
function intlStages(fmt,teams,bo){
  const n=teams.length, B=Math.max(3,bo||5);
  const ko=(from,t)=>({id:'knockout',name:'녹아웃',type:'single_elim',from,take:t,bestOf:B,dayGap:[5,5],firstChoice:'coin'});
  const de=(from,t)=>({id:'knockout',name:'브래킷 스테이지',type:'double_elim',from,take:t,bestOf:B,dayGap:[3,3]});
  const grp=(g,extra={})=>({id:'groups',name:'그룹 스테이지',type:'round_robin',legs:1,bestOf:3,groups:g,dayGap:[1,1,2],...extra});
  const sw=(extra={})=>({id:'groups',name:'스위스 스테이지',type:'swiss',bestOf:3,wins:3,losses:3,dayGap:[2],...extra});
  if(fmt==='first_stand'&&n>=8)return [grp(n>=12?3:2,{bestOf:3}),ko('groups',Math.min(8,Math.floor(n/2)*2))];
  if(fmt==='msi_swiss_de'&&n>=12)return [sw(),de('groups',8)];
  if(fmt==='worlds_league_phase'&&n>=16){
    return [{id:'league_phase',name:'월드 리그 페이즈',type:'league_phase',matches:6,
      bestOf:3,dayGap:[4],broadcastCap:4},ko('league_phase',16)];
  }
  if(fmt==='masters_groups'&&n>=8)return [grp(n>=16?4:2,{legs:2,bestOf:3}),ko('groups',Math.min(8,n/2))];
  if(fmt==='open_groups'&&n>=8)return [grp(n>=12?3:2,{bestOf:3}),ko('groups',Math.min(8,n/2))];
  if(fmt==='regional_cup'&&n>=6)return [grp(2,{bestOf:3}),ko('groups',4)];
  if((fmt==='playin_swiss_ko'||fmt==='swiss_ko')&&n>=12){
    if(n<=16&&fmt==='swiss_ko'&&n===16)return [sw(),ko('groups',8)];
    const adv=Math.max(2,Math.min(8,Math.round((n-16)/3)+2)), direct=teams.slice(0,16-adv), pin=teams.slice(16-adv);
    if(n===16)return [sw(),ko('groups',8)];
    if(pin.length>adv)return [{id:'playin',name:'플레이인',type:'round_robin',legs:1,bestOf:3,groups:Math.max(1,Math.min(adv,Math.ceil(pin.length/6))),dayGap:[1,1]},sw({from:'playin',take:adv,direct}),ko('groups',8)];
  }
  if((fmt==='swiss_ko'||fmt==='playin_swiss_ko')&&n===8)return [sw({wins:2,losses:2}),ko('groups',4)];
  if(fmt==='playin_groups_ko'&&n>=10){
    const size=n>=16?16:8, adv=size===16?4:2, direct=teams.slice(0,size-adv), pin=teams.slice(size-adv);
    if(pin.length>adv)return [{id:'playin',name:'플레이인',type:'round_robin',legs:1,bestOf:3,groups:pin.length>=8?2:1,dayGap:[1,1]},grp(size/4,{from:'playin',take:adv,direct}),ko('groups',size/2)];
  }
  if(fmt==='playin_de'&&n>=6){
    const size=n>=8?8:4, adv=n>8?Math.min(4,Math.max(2,n-size+2)):0;
    if(adv){const direct=teams.slice(0,size-adv), pin=teams.slice(size-adv);
      if(pin.length>adv)return [{id:'playin',name:'플레이인',type:'round_robin',legs:1,bestOf:3,groups:Math.max(1,Math.min(adv,Math.ceil(pin.length/6))),dayGap:[1,1]},{...de('playin',adv),direct}];}
    return [{...de(undefined,size)}];
  }
  if(fmt==='ko'||n<6){let P=4;while(P*2<=n)P*=2;return [{...ko(undefined,P)}]}
  if(fmt==='groups_de'&&n>=8)return [grp(n>=12?4:2),de('groups',8)];
  return [grp(n>=12?4:2),ko('groups',n>=12?8:4)];
}
