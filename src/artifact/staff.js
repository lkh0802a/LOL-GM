// ===== LOL GM: Staff management actions =====
// Core staff model lives here after the Step 2 staff-domain extraction.

function mHireStaff(db,sid){const t=myT(db),s=(db.staffPool||[]).find(x=>x.id===sid);if(!s)return '스태프를 찾을 수 없습니다';if(!staffCanHire(t,s))return (STAFF_DEPT_LABEL[staffDepartment(s.role)]||'스태프')+' 고용 상한에 도달했습니다';const annual=staffSalary(s,psOf(db,t.region));if(t.finance.cash<annual)return '보유 자금이 부족합니다';hireStaff(db,t,s);return `${STAFF_ROLES[s.role]} ${s.name} 선임 · ${STAFF_DEPT_LABEL[staffDepartment(s.role)]} ${staffDeptCount(t,staffDepartment(s.role))}/${STAFF_DEPT_LIMITS[staffDepartment(s.role)]}`}
function mReleaseStaff(db,sid){const t=myT(db),s=teamStaffMembers(t).find(x=>x.id===sid);if(!s)return '스태프를 찾을 수 없습니다';const fee=staffSalary(s,psOf(db,t.region));if(t.finance.cash<fee)return '계약 해지 비용이 부족합니다';t.finance.cash=Math.round((t.finance.cash-fee)*10)/10;releaseStaff(db,t,sid);return `${STAFF_ROLES[s.role]} ${s.name} 계약 해지 · 비용 ${money(fee)}`}
