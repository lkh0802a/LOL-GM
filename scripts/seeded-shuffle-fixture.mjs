// Shared actual consumer fixture for Node and native browser verification.
export const SEEDED_SHUFFLE_FIXTURE=String.raw`(()=>{
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:3,div2:false})];cfg.internationals=[];
 const base=buildWorld(cfg);for(const t of activeTeams(base))for(const role of ROLES){const p=Object.values(base.players).find(p=>!p.team&&!p.retired&&p.role===role);if(!p)throw Error('roster fixture lacks '+role);signContract(base,p,t,1,2,{promisedRole:'starter'})}for(const t of activeTeams(base))initializeDepthChart(base,t,true);base.saveId='shuffle-fixture';base.world={phase:'market',manage:'ai',year:base.year,seed:'shuffle-career',offers:[],marketLog:[]};
 const check=(v,m)=>{if(!v)throw Error('SHUFFLE_CONSUMER '+m)},copy=()=>unpackDB(packDB(base));
 function probe(seed){
  const db=copy(),rng=new RNG(seed,'gen'),generated=[];
  for(let i=0;i<8;i++)generated.push(genPlayer(db,rng,{region:'NA',role:ROLES[i%5],age:20,base:65}));
  check(Object.keys(base.players).every(id=>JSON.stringify(db.players[id])===JSON.stringify(base.players[id])),'existing players changed');check(new Set(generated.map(p=>p.id)).size===8&&new Set(generated.map(p=>p.name.toLowerCase())).size===8,'new player identity duplicate');
  const pd=copy(),pr=new RNG(seed,'patch'),runes=[];for(let i=0;i<8;i++){const r=generatedRuneDef(pd,pr,pd.year);runes.push(r);applyNote(pd.patch,{type:'rune_new',def:r});check(Object.entries(r.effects).every(([k,v])=>systemEffects(pd.patch.runeDefs,[r.id])[k]===v),'new rune effect not consumed');pd.patches.systemLifeByYear[pd.year]={runeNew:i+1}}
  const diag={champions:Object.values(pd.patch.champions).filter(c=>!c.releaseDate).map(c=>({c,cid:c.id,pres:.1,wr:.5}))},reworks=[];
  for(let i=0;i<80&&reworks.length===0;i++)reworks.push(...maybeChampionRework(pd,pd.worldDate,true,pr,diag));
  check(reworks.length>0,'actual rework branch not observed');for(const note of reworks)applyNote(pd.patch,note);check(reworks.filter(n=>n.type==='kit').every(n=>pd.patch.champions[n.c].kit[n.key]===n.new),'kit writer not applied');
  const sd=copy(),comp=leagueComp(sd,'NA',1);sd.competitions[comp.id]=comp;const season=newSeason(sd,comp.id,sd.year,seed,sd.worldDate);
  const md=copy(),mr=new RNG(seed,'market'),report={expired:[],resign:[],signings:[],released:[],transfers:[]};for(const t of activeTeams(md))t.finance.cash=100;contractMarket(md,mr,report,()=>{});
  check(report.signings.length>0,'no actual market contract');check(report.signings.every(x=>md.players[x.pid].contract&&md.players[x.pid].team===x.team),'report differs from contract ownership');const roundtrip=unpackDB(packDB(md));check(packDB(roundtrip)===packDB(md),'market save roundtrip');
  return {generated,rng:{a:rng.a,sp:rng.sp},runes,reworks,patchRng:{a:pr.a,sp:pr.sp},season,market:packDB(md),report,marketRng:{a:mr.a,sp:mr.sp}};
 }
 const rows=['shuffle-A','shuffle-B','shuffle-C'].map(seed=>({seed,result:probe(seed)}));for(const row of rows)check(JSON.stringify(row.result)===JSON.stringify(probe(row.seed)),'independent result/state differed '+row.seed);return rows;
})()`;
