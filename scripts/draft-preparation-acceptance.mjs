import {runEngineFixture,artifactSources} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
  const check=(ok,msg)=>{if(!ok)throw Error('DRAFT_PREPARATION '+msg)};
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,div2:true,system:'franchise'})];cfg.internationals=[];
  const db=buildWorld(cfg),[a,b]=activeTeams(db,'NA',1),reserve=reserveTeamsOf(db,a)[0];setManagedTeam(db,a.id);
  db.world={year:db.year,seed:'preparation',manage:'manual',phase:'season',seasons:{},steps:[],step:-1};
  for(const t of [a,b,reserve])for(const r of ROLES){const p=genPlayer(db,new RNG('preparation|'+t.id+r),{region:t.region,role:r,age:22,base:65});signContract(db,p,t,1,3);t.depthChart[r]=p.id}
  const blocked=Object.values(db.patch.champions)[0];blocked.proEligibleDate=addDays(db.worldDate,10);
  const ctx={used:[],fearless:true,byTeam:{[a.id]:{won:[],lost:[]},[b.id]:{won:[],lost:[]}}},state=createDraftSession(db,[a.id,b.id],new RNG('live-preparation'),ctx);
  check(!state.champs.some(c=>c.id===blocked.id),'official fixture lacks restriction');
  check(draftPreparationReport(state,0).reason==='ban-turn','ban should not fabricate pick evaluation');
  check(!draftPreparationReport(state,1).allowed&&!draftPreparationReport(state,2).allowed,'forged observer');
  let reports=0,chosen=null,manual=false;
  while(draftTurn(state)){
    const turn=draftTurn(state);
    if(turn.side===0&&turn.kind==='P'){
      const before=packDB(db),snapshot=JSON.stringify({...state,db:null,rng:state.rng,taken:[...state.taken]}),restores=[];
      const trap=(o,k)=>{const d=Object.getOwnPropertyDescriptor(o,k);restores.push(()=>d?Object.defineProperty(o,k,d):delete o[k]);Object.defineProperty(o,k,{configurable:true,get(){throw Error('opponent private '+k)}})};
      for(const p of Object.values(state.roster[1]))for(const k of ['pool','attrs','pot','medical'])trap(p,k);
      trap(state.tacs,1);trap(state.vhat,1);trap(b,'metaKnowledge');
      const report=draftPreparationReport(state,0),mine=state.pickList[0].map(id=>db.patch.champions[id]);
      check(report.allowed&&!report.reason&&report.rows.length,'missing real pick report');
      check(!report.rows.some(x=>x.champ===blocked.id||state.taken.has(x.champ)),'restricted/taken candidate exposed');
      for(const row of report.rows)for(const fit of row.fits){
        check(draftValidateChoice(state,{champ:row.champ,side:0}).ok,'report includes illegal candidate');
        check(JSON.stringify(fit.factors)===JSON.stringify(draftPickValue(state,0,fit.role,row.champ,mine)),'consumer changed actual coefficients');
        check(JSON.stringify(fit.opponentPicks)===JSON.stringify(draftRolePossibilities(state,1,fit.role)),'counter context guesses hidden assignment');
      }
      const candidate=report.rows[0],role=candidate.best.role,scoped=draftPreparationReport(state,0,{role});
      check(scoped.rows.every(x=>x.fits.every(y=>y.role===role)),'role filter changes domain');
      const p=state.roster[0][role],old=p.pool,oldFactors=candidate.best.factors;
      p.pool={...old,[candidate.champ]:{mastery:oldFactors.mastery===.495?25:99}};
      const changed=draftPreparationReport(state,0,{role}).rows.find(x=>x.champ===candidate.champ).best.factors;
      check(changed.mastery!==oldFactors.mastery&&changed.counter===oldFactors.counter&&changed.comp===oldFactors.comp,'own observed mastery not consumed/affected unrelated causes');p.pool=old;
      ctx.byTeam[a.id].lost.push(candidate.champ);const lost=draftPreparationReport(state,0,{role}).rows.find(x=>x.champ===candidate.champ).best;
      check(lost.factors.series===-.06,'actual series evidence not consumed');ctx.byTeam[a.id].lost.pop();
      for(const restore of restores.reverse())restore();
      check(packDB(db)===before&&JSON.stringify({...state,db:null,rng:state.rng,taken:[...state.taken]})===snapshot,'report wrote world/session/random/shortlist');
      DRAFT_UI={db,state,playerSide:0,filter:'ALL',query:'',infoTab:'preparation',locked:true,selected:null};
      const html=draftUiPreparationContent();check(html.includes('상대 공개 픽')&&html.includes('실제 기여')&&html.includes('후보를 누르면'),'real context not rendered');
      const cursor=state.cursor;check(draftUiPreparationSelect(candidate.champ)&&DRAFT_UI.selected===candidate.champ&&DRAFT_UI.infoTab==='analysis'&&state.cursor===cursor&&focus>0,'select should focus existing analysis without locking');
      DRAFT_UI.selected=null;check(!draftUiPreparationSelect(blocked.id)&&!DRAFT_UI.selected,'forged restriction selected');
      if(!manual){
        DRAFT_UI.selected=candidate.champ;draftUiLock();check(state.log.at(-1).champ===candidate.champ&&state.cursor===cursor+1&&state.pickList[0].at(-1)===candidate.champ,'actual existing confirmation writer disconnected');
        check(state.expl.at(-1).utility===candidate.best.score&&state.expl.at(-1).factors.some(x=>x[0]==='숙련도'&&x[1]===candidate.best.factors.mastery),'manual explanation lost displayed actual factors');
        const once=state.cursor;draftUiLock();check(state.cursor===once,'duplicate confirmation applied');chosen=candidate.champ;manual=true;
      }else draftApplyChoice(state,{champ:candidate.champ,side:0,source:'player'});
      check(!draftUiPreparationSelect(candidate.champ),'stale/taken choice accepted');reports++;
    }else{
      if(turn.side===1)check(draftPreparationReport(state,0).reason==='other-turn','other side report');
      draftApplyChoice(state,draftAiChoice(state));
    }
  }
  check(reports===5&&manual,'complete real pick contexts');
  check(draftPreparationReport(state,0).reason==='complete','completed stage');
  const result=draftResult(state);check(result.sequence.events.some(x=>x[2]===0&&x[3]===chosen),'confirmed candidate missing result');
  const match=simulateMatch(db,a.id,b.id,'preparation-confirmed-match',{forced:result,used:[],byTeam:ctx.byTeam},true);recordMeta(db,match);
  check(JSON.stringify(match.draft.picks)===JSON.stringify(result.picks),'played match replaced live choices');
  const copy=unpackDB(packDB(db));check(JSON.stringify(packMetaHistory(copy.metaHistory))===JSON.stringify(packMetaHistory(db.metaHistory)),'actual result history save continuity');
  const practice=createDraftSession(db,[a.id,b.id],new RNG('prep-practice'),{practice:true,used:[],byTeam:{}});
  check(practice.champs.some(c=>c.id===blocked.id),'practice pool lost established distinction');
  while(draftTurn(practice)?.kind!=='P'||draftTurn(practice)?.side!==0)draftApplyChoice(practice,draftAiChoice(practice));
  const oldRoster=practice.roster[0].MID;practice.roster[0].MID=practice.roster[1].MID;
  check(draftPreparationReport(practice,0).reason==='missing-lineup','forged foreign starter');practice.roster[0].MID=oldRoster;
  db.world.fired=true;check(!draftPreparationReport(practice,0).allowed,'fired authority');db.world.fired=false;
  setManagedTeam(db,reserve.id);check(!draftPreparationReport(practice,0).allowed,'reserve cannot read parent');setManagedTeam(db,a.id);
  const reserveState=createDraftSession(db,[reserve.id,b.id],new RNG('prep-reserve'),{practice:true,used:[],byTeam:{}});
  check(draftPreparationReport(reserveState,0).allowed,'owned reserve authority');
  const fearful=createDraftSession(db,[a.id,b.id],new RNG('prep-fearless'),{fearless:true,used:[chosen],byTeam:{}});
  check(!draftValidateChoice(fearful,{champ:chosen,side:0}).ok,'fearless reuse');
  console.log('DRAFT_PREPARATION_ACCEPTANCE PASS actual full draft/confirmed match/save, exact factors, current composition/public flex counter, actual own mastery/series, legal official/practice/Fearless, private traps, pure reads, authority/stale/duplicate selection and detail focus');
})()`,{timeout:60000,setupSources:[String.raw`
let DRAFT_UI=null,focus=0;const esc=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const document={querySelectorAll:()=>[]};const $=s=>s==='#du-analysis'?{focus(){focus++}}:null;
`,...await artifactSources(['ui-draft.js','ui-draft-analysis.js','ui-draft-preparation.js']),
// The fixture runs the actual selection/lock functions; suppress rendering and AI
// stepping only to inspect each subsequent live turn independently.
'function draftUiRender(){}function draftUiAdvanceAi(){}']});
