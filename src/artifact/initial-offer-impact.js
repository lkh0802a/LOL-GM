// Shared conditional projection. Existing rules/writer run only on a private copy.
function initialCandidateView(db){const view=Object.create(db);view.scout=JSON.parse(JSON.stringify(db.scout||{}));view.world={...db.world,recruitment:JSON.parse(JSON.stringify(db.world?.recruitment||{})),negotiations:JSON.parse(JSON.stringify(db.world?.negotiations||{}))};view._marketDemandCache={...(db._marketDemandCache||{})};return view}
function initialCandidateAllowed(db,target,p=null){return db.world?.phase==='initial_roster'&&!db.world.fired&&!managedTeam(db)?.parent&&setupTeamsForManager(db).some(t=>t===target)&&(!p||db.players[p.id]===p&&!p.retired&&!p.team)}
function initialOfferImpact(db,pid,tid,input=null){
 const target=db.teams[tid],p=db.players[pid];
 if(!p||!initialCandidateAllowed(db,target,p))return {ok:false,reason:'현재 FA 또는 대상 스쿼드의 영입 권한이 없습니다'};
 const raw=input||{salary:asking(initialCandidateView(db),p,target.region),years:contractDurationPolicy(db,p,target).preferred,signingBonus:0};
 if(!Number.isFinite(+raw.salary)||+raw.salary<=0||!Number.isFinite(+raw.years)||+raw.years<=0||!Number.isFinite(+(raw.signingBonus||0))||+(raw.signingBonus||0)<0||Object.values(raw.bonuses||{}).some(x=>!Number.isFinite(+x)||+x<0))return {ok:false,reason:'연봉·기간·계약금·보너스에 유효한 금액을 입력하세요'};
 if(!Number.isFinite(target.finance?.cash))return {ok:false,reason:'구단 현금 정보가 없습니다'};
 const view=JSON.parse(JSON.stringify(db)),team=view.teams[tid],player=view.players[pid],terms=playerActionTerms(view,player,team,{salary:+raw.salary,years:+raw.years,terms:raw});
 const command={type:'player.sign',actor:'manager',kind:'initial',pid,teamId:tid,salary:terms.salary,years:terms.years,terms};
 const snapshot=()=>({count:team.roster.length,imports:teamNonLocalCount(view,team),pay:payroll(view,team),budget:initialSalaryBudget(view,team),cash:team.finance.cash,roles:Object.fromEntries(ROLES.map(r=>[r,team.roster.filter(id=>view.players[id]?.role===r).length])),organization:organizationRoster(view,parentTeamOf(view,team)).length,errors:initialOrganizationErrors(view,team),tax:spendingTaxForPayroll(view,team,regulatedPayroll(view,team))});
 const before=snapshot(),limits=initialSquadLimits(view,team),local=projectedPlayerIsLocal(view,player,team),error=negotiationBudgetError(view,player,team,terms,'initial'),preview=error?{ok:false,errors:[error]}:previewWorldAction(view,command);
 if(!preview.ok)return {ok:false,reason:(preview.errors||['계약 조건을 확인하세요']).join(' · '),before,terms};
 const applied=applyWorldAction(view,preview);if(!applied.ok)return {ok:false,reason:applied.errors.join(' · '),before,terms};
 return {ok:true,showRole:!!input&&SQUAD_ROLES.includes(raw.promisedRole),pid,tid,name:p.name,team:target.name,date:db.worldDate,terms,before,after:snapshot(),limits,importLimit:nonLocalLimitForTeam(view,team),local,source:input?'작성 조건':'요구 연봉 기준'};
}
