// Sporting-format opinions are advisory. The office retains final authority.
const OFFICE_OPINION_FIELDS={splits:[1,2,3],playoffBo:[3,5],standingsMode:['independent','points','cumulative']};
const OFFICE_OPINION_LABELS={splits:'연간 스플릿',playoffBo:'플레이오프 세트',standingsMode:'성적 집계'};
function clubFormatPreferences(db,t){
  const p=t.officePreferences;
  if(p?.year!==db.world?.year||p.region!==t.region)return {};
  return Object.fromEntries(Object.entries(p.values||{}).filter(([k,v])=>OFFICE_OPINION_FIELDS[k]?.includes(v)));
}
function officeFormatConsultation(db,R,field,current,target){
  if(!OFFICE_OPINION_FIELDS[field])return null;
  const clubs=activeTeams(db,R.id,1),votes=clubs.map(t=>{
    const manual=db.world?.manage==='manual'&&managedTeamId(db)===t.id,
      stated=clubFormatPreferences(db,t)[field];
    let preferred=stated??null,reason='구단이 제출한 운영 의견';
    if(!manual&&preferred===null){
      const fatigued=avg((t.roster||[]).map(id=>db.players[id]?.fatigue||0))>=34;
      preferred=field==='splits'?(t.finance.cash<0||fatigued?1:(t.fans||30)>=70?3:2):
        field==='playoffBo'?((t.fans||30)>=55&&t.finance.cash>=0?5:3):
        ((R.metrics||[]).at(-1)?.balance<.55?'points':'independent');
      reason=field==='standingsMode'?'공개 경쟁 균형에 따른 구단 의견':
        t.finance.cash<0||fatigued?'운영 여력과 선수 피로 고려':'팬 관심과 경기 콘텐츠 고려';
    }
    const distance=v=>field==='standingsMode'?(v===preferred?0:1):Math.abs(v-preferred),
      vote=preferred===null?0:Math.sign(distance(current)-distance(target));
    return {teamId:t.id,preferred,vote,source:stated!==undefined?'submitted':manual?'abstain':'club',reason};
  });
  const support=votes.filter(v=>v.vote>0).length,oppose=votes.filter(v=>v.vote<0).length;
  // Reuse the existing office utility noise scale as a bounded advisory unit.
  return {field,current,target,effectiveYear:db.world.year+1,votes,support,oppose,
    abstain:votes.length-support-oppose,adjustment:(support-oppose)/Math.max(1,votes.length)*.12};
}
WORLD_ACTION_HANDLERS['office.opinion']={
  validate(db,a){
    const t=db.teams[a.teamId];
    if(!db.world||!t||t.active===false||t.parent||(t.division||1)!==1||!db.regions[t.region])
      return worldActionError('invalid_club','리그 참가 1군 구단의 운영 의견이 필요합니다');
    if(a.actor==='system'||a.actor==='manager'&&managedTeamId(db)!==t.id||
      a.actor==='ai'&&db.world.manage==='manual'&&managedTeamId(db)===t.id)
      return worldActionError('unauthorized','관리 구단의 의견만 직접 제출할 수 있습니다');
    const values=a.values;
    if(!values||typeof values!=='object'||Array.isArray(values)||Object.entries(values).some(([k,v])=>
      !OFFICE_OPINION_FIELDS[k]?.includes(v)))return worldActionError('invalid_opinion','유효한 리그 운영 의견이 필요합니다');
    return {ok:true,teamId:t.id,region:t.region,year:db.world.year,values:{...values}};
  },
  canonical(db,a,v){return {type:a.type,actor:a.actor,teamId:v.teamId,region:v.region,year:v.year,values:v.values}},
  snapshot(db,a){const t=db.teams[a.teamId];return {saveId:db.saveId,year:db.world.year,
    managed:managedTeamId(db),manage:db.world.manage,active:t.active,parent:t.parent||null,
    region:t.region,division:t.division||1,previous:t.officePreferences||null}},
  changes(db,a){return [{kind:'office_opinion',teamId:a.teamId,effectiveYear:a.year+1,values:a.values}]},
  apply(db,a){db.teams[a.teamId].officePreferences={year:a.year,region:a.region,date:db.worldDate||null,values:{...a.values}};
    return {preferences:db.teams[a.teamId].officePreferences}}
};
