// Acquisition changes the owner of an existing club, preserving its license,
// registration, employment contracts and historical results under the same ID.
function ensureClubOwnership(t){
  t.ownershipSerial=Number.isInteger(t.ownershipSerial)&&t.ownershipSerial>=0?t.ownershipSerial:0;
  t.owner=t.owner||{wealth:50};
  t.owner.id=t.owner.id||t.id+':owner:'+t.ownershipSerial;
  t.owner.name=t.owner.name||t.name+' 운영법인';
  t.ownershipHistory=t.ownershipHistory||[];
  return t.owner;
}
function transferClubOwnership(db,t,{name,wealth,reason,year=db.year}){
  if(!t||t.active===false||t.parent||typeof name!=='string'||!name.trim()||!Number.isFinite(wealth))
    throw new Error('구단 인수 조건이 올바르지 않습니다');
  const oldName=t.name,previous={...ensureClubOwnership(t)};
  t.ownershipSerial++;
  t.name=name.trim();t.formerNames=[...(t.formerNames||[]),oldName];
  t.owner={id:t.id+':owner:'+t.ownershipSerial,name:t.name+' 운영법인',
    wealth:Math.round(clamp(wealth,10,95)),patience:2};
  const record={year,date:db.worldDate,clubId:t.id,continuity:'same-club',
    region:t.region,division:t.division||1,license:t.license||(t.franchised?'franchise':'open'),
    previousName:oldName,name:t.name,previousOwner:previous,owner:{...t.owner},reason};
  t.ownershipHistory.push(record);
  return record;
}
