import {artifactSources,runEngineFixture} from './test-harness.mjs';
const [app,setup,season,patch,player,opponent,opponentDraft]=await artifactSources(['app.js','ui-setup.js','ui-season.js','ui-patch.js','ui-player.js','ui-opponent-report.js','ui-opponent-draft.js']);
const esc=app.match(/^const esc=.*$/m)[0];
await runEngineFixture(String.raw`(()=>{
  const check=(x,m)=>{if(!x)throw Error('PUBLIC_INFORMATION '+m)};
  const db=buildWorld(),regional=regionalLevelIndex(db);
  check(Math.max(...Object.values(regional))===100&&new Set(Object.values(regional)).size>1,'blank world level uses fallback 40');
  for(const t of activeTeams(db))check(clubCanBeRelegated(db,t)||t.setupGoal!=='survive','closed league received survival goal');
  globalThis.DB=db;globalThis.SSET={};
  const setupHtml=seasonSetup();
  check(!setupHtml.includes('id="regen"')&&!setupHtml.includes('g.manage'),'duplicate setup or operation selector remains');
  db.worldConfig.manage='ai';const team=managerSelectableTeams(db)[0];
  startCareer(db,team.id,'public-information');
  check(db.world.manage==='manual','new career inherited delegation');
  const free=Object.values(db.players).find(p=>!p.retired&&!p.team);
  const range=scoutAbilityRange(db,free);check(range.length===2&&range[0]<=range[1]&&range[0]>0,'unobserved player has no public estimate');
  const before=range[1]-range[0];observePlayer(db,free,60);
  const after=scoutAbilityRange(db,free);check(after[1]-after[0]<=before,'observation did not narrow public estimate');
  globalThis.PSET={region:'GLOBAL',period:'ALL',patch:'ALL',comp:'ALL',season:'ALL',year:'',split:'ALL',league:'ALL',scope:'ALL',position:'ALL',role:'ALL',q:'',champ:null};
  const html=viewPatch();check(html.includes('현재 패치 예상 티어')&&!html.includes('class="tier t-"'),'initial tier list empty');
  check(!html.includes('패치 엔진은')&&!html.includes('시뮬레이션 해석'),'implementation annotations remain');
  let count=0;for(const c of Object.values(db.patch.champions))for(const slot of ['Q','W','E','R']){
    const skill=c.skills[slot],text=skillRangeText(skill,c);count++;
    check(!text.includes('25000')&&!text.includes('범위 확인 중'),'unreviewed sentinel leaked: '+c.name+'/'+slot);
  }
  check(count===688&&Object.values(CHAMPION_SOURCE_SNAPSHOT.champions).reduce((n,c)=>n+c.spells.length,0)===692,'champion skill coverage changed');
  const a=Object.values(db.patch.champions).find(c=>c.riotAlias==='Aatrox');
  check(skillRangeText(a.skills.E,a)==='돌진 거리 300','dash range incorrect');
  const old=skillRangeText(a.skills.W,a);
  applyNote(db.patch,{type:'skill',c:a.id,slot:'W',field:'range',new:[850,850,850,850,850]});
  check(skillRangeText(a.skills.W,a)!==old&&skillRangeText(a.skills.W,a).includes('850'),'fictional patch displays stale source range');
  check(metaTableFiltered(db,{comp:'missing'}).every(x=>x.sample===0&&x.p===0),'empty history filter leaked unrelated data');
  console.log('CAREER_PUBLIC_INFORMATION_ACCEPTANCE: PASS (new game, manual default, relative levels, valid goals, public estimates, 692 skill labels, tiers, patch changes)');
})();`,{setupSources:[esc,setup,season,patch,player,opponent,opponentDraft]});
