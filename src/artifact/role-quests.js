// Patch-owned role rules and match-local quest transitions. Engine adapters
// supply measured events; this module never awards permanent player growth.
const ROLE_QUEST_FIELDS=Object.freeze({
  threshold:[1,10000],csPoints:[0,10],takedownPoints:[0,200],epicPoints:[0,200],
  towerPoints:[0,200],platePoints:[0,200],lanePerSecond:[0,5],awayPerSecond:[0,5],
  damageRanged:[0,.1],damageMelee:[0,.1],roamBankCap:[0,120],
  xpReward:[0,2000],xpBonus:[0,.5],takedownXp:[0,500],levelCap:[18,20],
  teleportCooldown:[1,20],bonusPower:[0,.25],goldReward:[0,1000],
  csGold:[0,10],takedownGold:[0,200],monsterGold:[0,100],monsterXp:[0,100],
  smiteDamage:[0,2000],jungleMobility:[0,.2],controlWardCost:[0,100],controlWardCapacity:[0,4]
});
const ROLE_QUEST_LABELS={threshold:'완료 요구량',csPoints:'CS 진척',takedownPoints:'처치 관여 진척',epicPoints:'오브젝트 진척',towerPoints:'포탑 진척',platePoints:'방패 진척',lanePerSecond:'라인 체류 진척',awayPerSecond:'로밍 진척',xpReward:'완료 경험치',xpBonus:'추가 경험치 비율',takedownXp:'처치 관여 경험치',levelCap:'최대 레벨',teleportCooldown:'순간이동 재사용(분)',bonusPower:'추가 공격력·주문력 비율',goldReward:'완료 골드',csGold:'CS 추가 골드',takedownGold:'처치 관여 추가 골드',monsterGold:'대형 몬스터 추가 골드',monsterXp:'대형 몬스터 추가 경험치',smiteDamage:'강타 피해',controlWardCost:'제어 와드 가격',controlWardCapacity:'제어 와드 슬롯',jungleMobility:'정글·강가 이동 속도 비율'};
function maybeRoleQuestChange(db,major,rng){
  if(!db.patch.roleQuests||!rng.chance(major?.25:.015))return null;
  const role=rng.pick(ROLES),fields={TOP:['threshold','xpBonus','teleportCooldown'],MID:['threshold','bonusPower'],ADC:['threshold','goldReward','csGold'],JGL:['threshold','monsterGold'],SUP:['threshold','controlWardCost']},field=rng.pick(fields[role]),old=db.patch.roleQuests.roles[role][field],base=defaultRoleQuestRules().roles[role][field];
  const step=field==='threshold'?(role==='JGL'?1:25):field==='bonusPower'||field==='xpBonus'?.005:field==='teleportCooldown'?.25:field==='csGold'?.25:field==='goldReward'?25:1;
  const value=Math.round(clamp(old+(rng.chance(.5)?step:-step),base*.7,base*1.3)*1000)/1000;
  return value===old?null:{type:'role_quest',role,field,old,new:value,why:'포지션별 성장 시점과 보상 조정'};
}
function defaultRoleQuestRules(){
  const lane={csPoints:2,takedownPoints:15,epicPoints:30,towerPoints:50,platePoints:40,lanePerSecond:1.5,awayPerSecond:1/3,roamBankCap:60};
  return {version:1,sourcePatch:'26.19',roles:{
    TOP:{...lane,threshold:1200,xpReward:600,xpBonus:.11,takedownXp:80,levelCap:20,teleportCooldown:6.5},
    MID:{...lane,threshold:1350,takedownPoints:25,damageRanged:.015,damageMelee:.03,bonusPower:.08},
    ADC:{...lane,threshold:1350,csPoints:3,goldReward:300,csGold:2,takedownGold:40},
    JGL:{threshold:35,monsterGold:10,monsterXp:10,smiteDamage:1400,jungleMobility:.04},
    SUP:{threshold:1000,controlWardCost:40,controlWardCapacity:2}
  }};
}
function validateRoleQuestNote(note){
  const limits=ROLE_QUEST_FIELDS[note.field];
  if(!ROLES.includes(note.role)||!limits||!Number.isFinite(note.new)||note.new<limits[0]||note.new>limits[1]||(['levelCap','controlWardCapacity'].includes(note.field)&&!Number.isInteger(note.new)))throw Error('Invalid role quest patch note');
}
function applyRoleQuestNote(patch,note){
  validateRoleQuestNote(note);
  if(!patch.roleQuests?.roles?.[note.role])throw Error('Role quest rules absent from patch');
  patch.roleQuests.roles[note.role][note.field]=note.new;
}
function createRoleQuest(patch,role){
  const rules=patch.roleQuests?.roles?.[role];if(!rules)return null;
  return {role,patchId:patch.id,rules:Object.freeze({...rules}),progress:0,completed:false,
    completedAt:null,rewardClaimed:false,lastSequence:-1,roamBank:0};
}
function advanceRoleQuest(quest,event){
  if(!quest)return null;
  if(!Number.isSafeInteger(event.sequence)||event.sequence<0)throw Error('Role quest event sequence required');
  if(event.sequence<=quest.lastSequence)return null;
  const amount=k=>{const n=event[k]??0;if(!Number.isFinite(n)||n<0)throw Error('Invalid role quest event '+k);return n};
  // Validate before mutating so malformed/stale adapters cannot half-advance.
  const cs=amount('cs'),takedowns=amount('takedowns'),epics=amount('epics'),towers=amount('towers'),plates=amount('plates'),damage=amount('damage'),lane=amount('laneSeconds'),away=amount('awaySeconds'),stacks=amount('jungleStacks'),support=amount('supportGold');
  if(!Number.isFinite(event.minute)||event.minute<0)throw Error('Invalid quest minute');
  const r=quest.rules;let points=0,bank=quest.roamBank;
  if(quest.role==='JGL')points=stacks;
  else if(quest.role==='SUP')points=support;
  else{
    if(event.level>=3)bank=Math.min(r.roamBankCap??0,bank+lane/2);
    const banked=Math.min(bank,away);bank-=banked;
    points=cs*(r.csPoints||0)+takedowns*(r.takedownPoints||0)+epics*(r.epicPoints||0)+towers*(r.towerPoints||0)+plates*(r.platePoints||0)+damage*(event.melee?r.damageMelee||0:r.damageRanged||0)+(lane+banked)*(r.lanePerSecond||0)+(away-banked)*(r.awayPerSecond||0);
  }
  quest.lastSequence=event.sequence;quest.roamBank=bank;
  if(quest.completed)return null;
  quest.progress=Math.min(r.threshold,quest.progress+points);
  if(quest.progress<r.threshold)return null;
  quest.completed=true;quest.completedAt=event.minute;quest.rewardClaimed=true;
  return {role:quest.role,patchId:quest.patchId,rules:{...r}};
}
