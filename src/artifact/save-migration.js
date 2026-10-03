// ===== LOL GM: versioned save restoration / load-time migrations =====
// The game-world schema remains v15. saveFormat identifies *encoding* revisions,
// not seasons, game rules, or a new world generation format.
const SAVE_FORMAT_VERSION=2;
const SUPPORTED_WORLD_SAVE_VERSION=15;
const SAVE_TRANSIENT_ROOT_FIELDS=[
  '_marketDemandCache','initialPayrollFloorCache','_pre',
  'packed','metaHistoryPacked','coachPool'
];

function saveObject(x){return !!x&&typeof x==='object'&&!Array.isArray(x)}

function validateSaveEnvelope(db){
  if(!saveObject(db))throw new Error('유효한 저장 데이터 객체가 아닙니다');
  if(db.version!==SUPPORTED_WORLD_SAVE_VERSION)
    throw new Error('지원하지 않는 월드 세이브 버전: '+String(db.version)+' (지원: '+SUPPORTED_WORLD_SAVE_VERSION+')');
  const format=db.saveFormat??1;
  if(!Number.isInteger(format)||format<1||format>SAVE_FORMAT_VERSION)
    throw new Error('지원하지 않는 저장 형식 버전: '+String(format));
  for(const name of ['teams','players','regions','patch','worldConfig']){
    if(!saveObject(db[name]))throw new Error('저장 데이터의 '+name+' 항목이 없거나 손상되었습니다');
  }
  if(db.world!==null&&db.world!==undefined&&!saveObject(db.world))
    throw new Error('저장 데이터의 월드 진행 상태가 손상되었습니다');
  if(db.metaHistory!==undefined&&!Array.isArray(db.metaHistory))
    throw new Error('메타 기록 형식이 올바르지 않습니다');
  for(const [id,t] of Object.entries(db.teams)){
    if(!saveObject(t)||!Array.isArray(t.roster))
      throw new Error('구단 로스터 데이터가 손상되었습니다: '+id);
  }
  for(const [id,p] of Object.entries(db.players)){
    // Some supported world snapshots contain provisional player records
    // without generated attributes; preserve them for the domain layer.
    if(!saveObject(p)||p.attrs!=null&&!saveObject(p.attrs)&&!Array.isArray(p.attrs))
      throw new Error('선수 데이터가 손상되었습니다: '+id);
    if(p.loan){
      const l=p.loan,owner=db.teams[l.ownerId],borrower=db.teams[l.borrowerId];
      if(!saveObject(l)||!owner||!borrower||owner===borrower||!p.contract||
        p.team!==l.borrowerId||!borrower.roster.includes(id)||owner.roster.includes(id)||
        !['half','season'].includes(l.duration)||!SQUAD_ROLES.includes(l.promisedRole)||
        !Number.isInteger(l.season)||typeof l.recall!=='boolean'||
        !Number.isFinite(l.salaryShare)||l.salaryShare<0||l.salaryShare>1||
        !Number.isFinite(l.fee)||l.fee<0||
        ![l.startDate,l.lastWageDate,l.endDate].every(d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&
          Number.isFinite(Date.parse(d))&&new Date(d+'T00:00:00Z').toISOString().slice(0,10)===d)||
        l.startDate>l.lastWageDate||l.lastWageDate>l.endDate)
        throw new Error('선수 임대 데이터가 손상되었습니다: '+id);
    }
  }
  return format;
}

function unpackPlayerSaveFields(p){
  delete p.secondaryRoles;delete p.roleFamiliarity;
  if(Array.isArray(p.attrs))p.attrs=Object.fromEntries(ALL_ATTRS.map((a,i)=>[a,p.attrs[i]]));
  if(Array.isArray(p.tend))p.tend=Object.fromEntries(TENDENCIES.map((t,i)=>[t,p.tend[i]]));
  if(p.pool&&saveObject(p.pool))for(const cid of Object.keys(p.pool)){
    const v=p.pool[cid];
    if(Array.isArray(v))p.pool[cid]={
      mastery:v[0],experience:v[1],matchup_knowledge:v[2],
      confidence:v[3],scrimExperience:v[4]||0,
      trainingExperience:v[5]||0,scrimSeason:v[6]||0,
      trainingSeason:v[7]||0,...(v.length>8?{coachingMastery:v[8],coachingResearch:v.length>9?v[9]:0}:{})
    };
  }
  for(const pr of Object.values(p.pool||{}))for(const [key,max] of [['coachingMastery',8],['coachingResearch',5]]){
    if(pr[key]!==undefined&&(!Number.isFinite(pr[key])||pr[key]<0||pr[key]>max))throw Error('Invalid saved champion coaching: '+key);
  }
}

function normalizeRestoredSave(db){
  LOAN_INDEX.delete(db);
  validateStoredTransferState(db);
  validateStoredLocalService(db);
  validateStoredRegistrations(db);
  validateStoredStaffRegistrations(db);
  // World schema v15, format 1: pre-migration JSON saves and packed exports.
  // Format 2 uses the same runtime object model, but strips derived caches.
  for(const k of SAVE_TRANSIENT_ROOT_FIELDS)delete db[k];
  db.worldConfig.changes='normal';
  db.metaHistory=unpackMetaHistory(db.metaHistory||[]);
  for(const c of Object.values(db.competitions||{})){
    const r=db.regions?.[c.region];
    if(!r||c.international||c.div!==2)continue;
    const prior=[`${r.leagueName} 챌린저스`,`${r.leagueName} 2부`];
    if(prior.includes(c.name))c.name=divName(r);
    if(c.short===r.short+'2')c.short=divName(r);
  }
  // Rename only former defaults; IDs, custom names and tournament rules stay.
  for(const [id,oldName] of [['MASTERS','Masters'],['OPEN','Open']]){
    const preset=INTL_PRESETS.find(x=>x.id===id);
    for(const row of [...(db.worldConfig.internationals||[]),
      ...Object.values(db.competitions||{})]){
      if(row.id!==id)continue;
      if(row.name===oldName)row.name=preset.name;
      if(row.short===oldName)row.short=preset.short;
    }
    for(const row of db.history||[])
      if(row.comp===id&&row.compName===oldName)row.compName=preset.name;
    for(const step of db.world?.steps||[])
      if(step.kind==='intl'&&(step.ids||[step.id]).includes(id)&&step.label)
        step.label=step.label.split(' · ').map(x=>x===oldName?preset.name:x).join(' · ');
  }
  for(const t of Object.values(db.teams)){
    ensureFacilities(t);
    t.training=normalizeTraining(t.training);
    ensureClubOwnership(t);
    ensureClubLicense(db,t);
    delete t._pre;
  }
  for(const p of Object.values(db.players)){
    unpackPlayerSaveFields(p);
    ensurePlayerEligibility(p);
  }
  if(saveObject(db.patches)){
    delete db.patches.base;delete db.patches.initialBase;
  }
  if(saveObject(db.world)){
    const w=db.world;
    if(!saveObject(w.negotiations))w.negotiations={};
    if(!saveObject(w.recruitment))w.recruitment={targets:{}};
    else if(!saveObject(w.recruitment.targets))w.recruitment.targets={};
    if(!Array.isArray(w.offers))w.offers=[];
    if(!Array.isArray(w.marketLog))w.marketLog=[];
  }
  if(!saveObject(db.manager))db.manager={id:'manager-human',teamId:null,startMode:null,careerStartedAt:null};
  migrateLegacyStaffState(db);
  const staffErrors=staffStateErrors(db);if(staffErrors.length)throw new Error('스태프 저장 데이터 오류: '+staffErrors.slice(0,3).join(' · '));
  db.saveFormat=SAVE_FORMAT_VERSION;
  return db;
}

function migrateSaveState(db){
  validateSaveEnvelope(db);
  return normalizeRestoredSave(db);
}
