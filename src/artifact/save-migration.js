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
      trainingSeason:v[7]||0
    };
  }
}

function normalizeRestoredSave(db){
  // World schema v15, format 1: pre-migration JSON saves and packed exports.
  // Format 2 uses the same runtime object model, but strips derived caches.
  for(const k of SAVE_TRANSIENT_ROOT_FIELDS)delete db[k];
  db.metaHistory=unpackMetaHistory(db.metaHistory||[]);
  for(const t of Object.values(db.teams)){
    ensureFacilities(t);
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
  db.saveFormat=SAVE_FORMAT_VERSION;
  return db;
}

function migrateSaveState(db){
  validateSaveEnvelope(db);
  return normalizeRestoredSave(db);
}
