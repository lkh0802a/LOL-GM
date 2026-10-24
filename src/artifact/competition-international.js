// ===== LOL GM: International tournament format policy (D-032) =====
// 국제대회: 팀 목록은 시드 순서(지역 1번 시드 → 2번 시드 …)
function intlStages(fmt,teams,bo,opt={}){
  const n=teams.length, B=Math.max(3,opt.knockoutBo||bo||5);
  const ko=(from,t)=>({id:'knockout',name:'녹아웃',type:'single_elim',from,take:t,bestOf:B,dayGap:[5,5],firstChoice:'coin'});
  const de=(from,t)=>({id:'knockout',name:'브래킷 스테이지',type:'double_elim',from,take:t,bestOf:B,dayGap:[3,3]});
  const grp=(g,extra={})=>({id:'groups',name:'그룹 스테이지',type:'round_robin',legs:1,bestOf:3,groups:g,dayGap:[1,1,2],...extra});
  const sw=(extra={})=>({id:'groups',name:'스위스 스테이지',type:'swiss',bestOf:3,wins:3,losses:3,dayGap:[2],...extra});
  // D-032: these event formats have their own group and advancement contract.
  // Participant qualification remains owned by startInternational.
  const eventGroup=(groups,legs)=>grp(groups,{legs:opt.groupLegs||legs,bestOf:Math.max(3,opt.groupBo||3)});
  if(fmt==='worlds_league_phase'){
    if(n!==24)throw new Error(`월즈 리그 페이즈는 승인된 24팀 구성이 필요합니다 (현재 ${n}팀).`);
    return [{id:'league',name:'리그 페이즈',type:'league_phase',bestOf:3,firstChoice:'coin',dayGap:[1]}, {...ko('league',16),bestOf:5,fixedBracket:true}];
  }
  if(fmt==='msi_swiss_de'){
    if(n!==16)throw new Error(`MSI 스위스는 승인된 16팀 구성이 필요합니다 (현재 ${n}팀).`);
    return [sw({bestOf:1,decidingBo:3}),de('groups',8)];
  }
  if(fmt==='first_stand'||fmt==='open_groups')return [eventGroup(2,1),ko('groups',Math.min(8,n))];
  if(fmt==='masters_groups')return [eventGroup(4,2),ko('groups',Math.min(8,n))];
  if(fmt==='regional_cup')return [eventGroup(2,2),ko('groups',Math.min(4,n))];
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
