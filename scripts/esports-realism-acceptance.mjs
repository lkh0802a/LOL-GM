// Broadcast realism and governance acceptance: shape + timing + invariants.
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {ENGINE_MODULES} from './artifact-modules.mjs';
const artifact=resolve(import.meta.dirname,'..','src','artifact');
let source='';
for(const file of ENGINE_MODULES)source+=await readFile(resolve(artifact,file),'utf8')+'\n';
const scenario=String.raw`(()=>{
  const assert=(x,why)=>{if(!x)throw new Error('ESPORTS_REALISM: '+why)};
  const dayDiff=(a,b)=>(Date.parse(a+'T00:00:00Z')-Date.parse(b+'T00:00:00Z'))/86400000;

  // Different independently configured first-division regions share the same
  // per-team broadcast safety rules. Only capacity changes with league size.
  const cfg=defaultWorldConfig();cfg.internationals=[];
  cfg.regions=[
    regionCfg('NA',{teams:10,div2:false,splits:1,format:'rr_po'}),
    regionCfg('KR',{teams:12,div2:false,splits:1,format:'rr_de'}),
    regionCfg('CN',{teams:16,div2:false,splits:1,format:'rr_po'})
  ];
  const world=buildWorld(cfg);
  for(const R of Object.values(world.regions)){
    const c=leagueComp(world,R.id,1);world.competitions[c.id]=c;
    const s=newSeason(world,c.id,world.year,'broadcast-'+R.id,'2027-01-14');
    const window=broadcastWeekStart('2027-01-14');
    assert(window==='2027-01-20','broadcast start must align to the following Wednesday');
    const active=s.days.filter(d=>d.stage==='regular'),ids=c.teams;
    const cap=Math.max(2,Math.ceil(ids.length/5));
    for(const d of active){
      const dow=new Date(d.date+'T00:00:00Z').getUTCDay();
      assert([0,3,4,5,6].includes(dow),'non-broadcast weekday scheduled: '+R.id+' '+d.date);
      assert(d.matches.length<=cap,'one broadcast day exceeds league-specific concurrent series capacity');
      assert(d.matches.every(m=>m.broadcastTime),'some scheduled series lack a kickoff slot');
      assert(new Set(d.matches.map(m=>m.broadcastTime)).size===d.matches.length,
        'overlapping announced starts within one league/day');
      const appearances=d.matches.flatMap(m=>[m.a,m.b]);
      assert(new Set(appearances).size===appearances.length,'a team plays twice on the same day');
    }
    for(const tid of ids){
      const dates=active.filter(d=>d.matches.some(m=>m.a===tid||m.b===tid)).map(d=>d.date);
      assert(dates.length===(ids.length-1)*c.stages[0].legs,
        'schedule omitted official round-robin fixtures: '+tid);
      for(let i=1;i<dates.length;i++)
        assert(dayDiff(dates[i],dates[i-1])>=2,
          'team booked into consecutive dates: '+tid+' '+dates[i]);
      for(let i=0;i<Math.floor(dates.length/2);i++){
        const first=addDays(window,i*7),end=addDays(first,7);
        assert(dates.filter(d=>d>=first&&d<end).length===2,
          'not exactly two regular series/week for '+tid+' week '+i);
      }
    }
    console.log('BROADCAST_LEAGUE '+JSON.stringify({
      region:R.id,teams:ids.length,series:active.reduce((n,d)=>n+d.matches.length,0),
      broadcastDays:active.length,maxSameDay:Math.max(...active.map(d=>d.matches.length))
    }));
  }
  // Premier international events must not silently ignore their advertised
  // capacities, play West teams in East-only cups, or clone the same team into
  // secondary tournaments of the same international season.
  const iw=buildWorld();iw.world={year:iw.year,seed:'realism-intl',
    seasons:{},step:0,intlParticipation:{},phase:'season'};
  const target={
    FIRST_STAND:12,MID_SEASON_INVITATIONAL:16,EASTERN_CUP:8,
    WESTERN_CUP:8,WORLD_CHAMPIONSHIP:24,MASTERS:16,OPEN:12
  };
  const timingTeams={};
  for(const id of Object.keys(target)){
    assert(startInternational(iw,id,'2027-08-01',new Set()),id+' was not created');
    const season=iw.world.seasons[id],comp=iw.competitions[id];
    assert(comp.teams.length===target[id],
      id+' advertises '+target[id]+' teams but registers '+comp.teams.length);
    const preset=iw.worldConfig.internationals.find(it=>it.id===id),timing=preset.timing,
      used=timingTeams[timing]||(timingTeams[timing]=new Set());
    for(const tid of comp.teams){
      assert(!used.has(tid),'a club was double-entered into same-period events: '+tid);
      used.add(tid);
      if(preset.zone)assert(INTL_ZONES[preset.zone].includes(iw.teams[tid].region),
        'wrong geographic zone represented in '+id+': '+tid);
    }
    if(id==='MID_SEASON_INVITATIONAL')assert(comp.stages[0].type==='swiss'&&
      comp.stages[1].type==='double_elim','MSI event-specific format collapsed');
    if(id==='FIRST_STAND')assert(comp.stages[0].groups===3,'First Stand groups missing');
    if(id==='WORLD_CHAMPIONSHIP'){
      assert(comp.stages[0].type==='league_phase'&&comp.stages[0].matches===6&&
        comp.stages[1].take===16,'Worlds six-round league and 16-team bracket missing');
      const round=season.days.filter(d=>d.stage==='league_phase');
      assert(round.reduce((n,d)=>n+d.matches.length,0)===24*6/2,
        '24 clubs did not each play six distinct league-phase opponents');
      assert(round.every(d=>d.matches.length<=4&&d.matches.every(m=>m.broadcastTime)),
        'Worlds group broadcasts exceed announced slots or lack kickoff');
      const unique=new Set(round.flatMap(d=>d.matches.map(m=>
        [m.a,m.b].sort().join('|'))));
      assert(unique.size===72,'Worlds league stage repeated opponent fixtures');
    }
    console.log('INTERNATIONAL_ENTRY '+id+': '+comp.teams.length);
  }
  // No qualified challenger means no fictional replacement club or dissolved
  // relegated club. If a challenger emerges, swap its division instead.
  const R=world.regions.NA,first=activeTeams(world,R.id,1),count=first.length;
  R.system='relegation';R.div2=false;R.relegate=1;
  world.world={year:world.year,seed:'realism-offseason',seasons:{},
    step:0,phase:'offseason'};
  const mock={region:R.id,div:1,split:3,done:true,comp:R.short,
    stageData:{regular:{type:'round_robin',teams:first.map(t=>t.id)}},
    days:[],year:world.year};
  world.world.seasons[R.short+'-3']=mock;
  const idsBefore=new Set(first.map(t=>t.id)),events=[];
  promotionRelegation(world,world.world,new RNG('promotion-test','office'),
    s=>events.push(s));
  assert(activeTeams(world,R.id,1).length===count&&
    activeTeams(world,R.id,1).every(t=>idsBefore.has(t.id))&&
    events.some(s=>s.includes('승격 구단 없음')),
    'missing second division unexpectedly deleted/replaced first-tier clubs');

  // An investor acquiring a club is not a mandatory rebrand; rescue equity
  // must enter cash but not operating revenue.
  const club=first[0],name=club.name,fans=club.fans;
  club.finance.cash=-3;club.owner.wealth=11;
  world.global.dissolved=[
    ...Object.keys(REGION_PRESETS),...FUTURE_LEAGUE_MARKETS.map(x=>x.id)];
  const rng=new RNG('no-forced-rebrand','office');
  rng.chance=p=>p>0&&p<.05;
  rng.normal=(mu)=>mu;
  worldDecisions(world,rng,1,()=>{});
  assert(club.owner.wealth===58&&club.name===name&&club.fans===fans,
    'ownership change improperly forces a rename and fan loss');
  assert(club.finance.cash>-3&&club.finance.capitalEvents?.some(e=>
    e.type==='ownership'&&e.amount>0),
    'financial rescue by an investor was not registered as capital');
  console.log('GOVERNANCE_REALISM '+JSON.stringify({
    retainedLicensedClubs:count,ownershipNamePreserved:true,capital:true}));
})()`;
vm.runInNewContext(source+'\n'+scenario,{
  console,Date,Math,JSON,Set,Map,Object,Array,String,Number,Boolean,
  RegExp,Error,Intl,performance,crypto
},{timeout:45000});
const [ui,season,competition]=await Promise.all(['ui-season.js','season.js',
  'competition.js'].map(file=>readFile(resolve(artifact,file),'utf8')));
const check=(yes,msg)=>{if(!yes)throw new Error('ESPORTS_REALISM_UI: '+msg)};
check(ui.includes('esc(m.broadcastTime)')&&ui.includes("x.type==='league_phase'"),
  'kickoff labels and Worlds standings not accessible');
check(season.includes('intlParticipation')&&competition.includes("broadcast:'weekly'"),
  'regional scheduling or global event registration not persisted');
console.log('ESPORTS_REALISM_ACCEPTANCE PASS');
