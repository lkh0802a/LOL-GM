import {runEngineFixture,artifactSource} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error('PARTICIPANT_META '+m)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,system:'franchise'}),regionCfg('EU',{teams:4,system:'franchise'})];cfg.internationals=[];
 const db=buildWorld(cfg),[a,c]=activeTeams(db,'NA',1),b=activeTeams(db,'EU',1)[0];
 for(const t of [a,b,c])for(const role of ROLES){const p=genPlayer(db,new RNG(t.id+role),{region:t.region,role,age:22,base:65});signContract(db,p,t,1,3);t.depthChart[role]=p.id}
 const play=(x,y,seed)=>{const r=simulateMatch(db,x.id,y.id,seed,null,true);r.metaContext={international:x.region!==y.region,season:'PARTICIPANTS',split:1,year:db.year};recordMeta(db,r);return r};
 const first=play(a,b,'participants-one');db.worldDate=addDays(db.worldDate,1);const second=play(b,a,'participants-two');db.worldDate=addDays(db.worldDate,1);play(a,c,'participants-other');
 const pid=a.depthChart.MID,filter={team:a.id,opponent:b.id,scope:'INTL'},table=metaTableFiltered(db,filter),sum=k=>table.reduce((n,x)=>n+x[k],0),rows=metaRowsFiltered(db,filter),raw=JSON.stringify(db.metaHistory);
 check(rows.length===2&&table.every(x=>x.sample===2)&&sum('p')===10&&sum('b')===20,'head-to-head denominator or selected-side picks wrong');
 check(sum('w')===5*([first,second].filter(r=>r.sides[r.winner].team.id===a.id).length),'selected-side wins mixed with opponent wins');
 check(metaRowsFiltered(db,{opponent:b.id}).length===2&&metaRowsFiltered(db,{team:b.id,opponent:a.id}).length===2,'reverse/opponent-only filter lost games');
 check(metaRowsFiltered(db,{...filter,region:'EU'}).length===0&&metaRowsFiltered(db,{team:a.id,opponent:a.id}).length===0,'incompatible filters matched different sides of one game');
 const playerFilter={...filter,player:pid,position:'MID'},playerTable=metaTableFiltered(db,playerFilter);
 check(playerTable.reduce((n,x)=>n+x.p,0)===2&&playerTable.every(x=>x.sample===2),'player query included teammates or lost denominator');
 check(metaRowsFiltered(db,{...playerFilter,position:'TOP'}).length===0,'player/position conditions matched different picks');
 const cid=first.sides[0].ps.find(x=>x.p.id===pid).champ.id,insight=championMetaInsights(db,cid,playerFilter);
 check(insight.players.length===1&&insight.players[0][0]===pid&&insight.teams.length===1&&insight.teams[0][0]===a.id&&insight.matchups.length&&insight.recent.length,'insights escaped selected player/team/opponent');
 const bans=metaBanAttribution(db,playerFilter);check(bans.own===10&&bans.opponent===10&&bans.unknown===0,'player filter assigned individual bans or opposite-club bans');
 const prior=metaRowsFiltered(db,playerFilter),p=db.players[pid],oldTeam=p.team;p.team=c.id;
 check(metaRowsFiltered(db,playerFilter)===prior&&metaRowsFiltered(db,{team:c.id,player:pid}).length===0,'current player club rewrote historical membership');p.team=oldTeam;
 check(JSON.stringify(db.metaHistory)===raw,'query changed source history');
 const legacy=JSON.parse(raw)[0];legacy.sides[0].team=null;legacy.sides[0].picks=legacy.sides[0].picks.map(x=>x.champ);db.metaHistory.push(legacy);
 check(metaRowsFiltered(db,playerFilter).length===2&&metaRowsFiltered(db,filter).length===2,'unknown legacy identifiers invented selected membership');
 check(metaTableFiltered(db,{}).reduce((n,x)=>n+x.p,0)===40,'unselected legacy picks disappeared');
 const facets=metaHistoryFacets(db);check(facets.teams.includes(a.id)&&facets.players.includes(pid)&&!facets.teams.includes(null),'archive facets replaced by current roster IDs');
 const saved=unpackDB(packDB(db));check(JSON.stringify(metaTableFiltered(saved,playerFilter).map(x=>[x.c.id,x.p,x.b,x.w,x.sample]))===JSON.stringify(metaTableFiltered(db,playerFilter).map(x=>[x.c.id,x.p,x.b,x.w,x.sample])),'save changed actor query');
 check(metaFilterKey({team:'a|b',player:'c'})!==metaFilterKey({team:'a',player:'b|c'}),'participant cache keys collide');
 const state={team:a.id,player:pid,opponent:b.id,playerSearch:''};PSET=state;bindPatchParticipants();
 // Bind the real controls through their actual handlers, without a device run.
 uiNodes['#pteam'].onchange({target:{value:b.id}});uiNodes['#pplayer'].onchange({target:{value:'ALL'}});uiNodes['#popponent'].onchange({target:{value:c.id}});uiNodes['#pplayersearch'].onchange({target:{value:pid}});
 check(state.team===b.id&&state.player==='ALL'&&state.opponent===c.id&&state.playerSearch===pid&&uiNavigations===4,'controls failed to update the query state');
 const html=patchParticipantControls(db,{team:a.id,player:pid,opponent:b.id,playerSearch:pid});
 check(html.includes('id="pteam"')&&html.includes('id="pplayer"')&&html.includes('id="popponent"')&&html.includes('개인의 밴 결정으로 간주하지 않습니다'),'UI lost actor scope or ban explanation');
 const card=patchBanAttributionCard(db,playerFilter);check(card.includes('선택한 쪽의 구단 밴 10회')&&card.includes('상대 구단 밴 10회'),'UI attribution label still assumes regions only');
 DB=db;PSET={role:'ALL',q:'',region:'GLOBAL',patch:'ALL',comp:'ALL',period:'ALL',year:'',season:'ALL',split:'ALL',league:'ALL',scope:'INTL',position:'MID',team:a.id,player:pid,opponent:b.id,playerSearch:'',champ:cid};
 const page=viewPatch();check(page.includes('기록 필터 표본 2판')&&page.includes('선택 선수')&&page.includes('선택한 쪽의 구단 밴 10회'),'actual patch page did not propagate participant filters');
 const appended=JSON.parse(raw)[0];appended.sides[0].team='ARCHIVED_TEAM';appended.sides[0].picks[0].player='ARCHIVED_PLAYER';db.metaHistory.push(appended);
 check(metaHistoryFacets(db).teams.includes('ARCHIVED_TEAM')&&metaRowsFiltered(db,{team:'ARCHIVED_TEAM',player:'ARCHIVED_PLAYER'}).length===1,'append did not increment participant indexes/facets');
 for(let i=0;i<100;i++){const r=JSON.parse(JSON.stringify(appended));r.sides[0].picks[0].player='SEARCH_'+String(i).padStart(3,'0');db.metaHistory.push(r)}
 const bounded=patchParticipantControls(db,{player:'SEARCH_099',playerSearch:'',team:'ALL',opponent:'ALL'});
 check(bounded.includes('80명 표시')&&bounded.includes('value="SEARCH_099" selected'),'bounded choices dropped the current selected player');
 const searched=patchParticipantControls(db,{player:'ALL',playerSearch:'SEARCH_099',team:'ALL',opponent:'ALL'});check(searched.includes('SEARCH_099')&&!searched.includes('SEARCH_098'),'search could not reach older archive IDs');
 db.metaHistory=[appended];check(metaRowsFiltered(db,playerFilter).length===0,'array replacement retained old participant index');db.metaHistory.length=0;check(metaHistoryFacets(db).players.length===0,'truncation retained old participant facets');
 for(let i=0;i<90;i++)metaRowsFiltered(db,{team:'QUERY_'+i});check(metaHistoryIndex(db).filtered.size<=META_FILTER_CACHE_LIMIT,'participant query cache unbounded');
 console.log('PARTICIPANT_META_ACCEPTANCE '+JSON.stringify({realGames:3,selectedSide:true,headToHead:true,playerAndRole:true,legacyUnknown:true,unchangedArchive:true,historicalMembership:true,save:true,indexInvalidation:true,boundedSearch:true,actualBindings:true}));
})();`,{setupSources:["let DB,PSET;const uiNodes={};let uiNavigations=0;const $=id=>uiNodes[id]||(uiNodes[id]={});const nav=()=>{uiNavigations++};const esc=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;');",await artifactSource('ui-patch.js'),await artifactSource('ui-opponent-report.js'),await artifactSource('ui-opponent-draft.js')]});
