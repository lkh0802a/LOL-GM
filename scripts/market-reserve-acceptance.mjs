// R05: historical market callup parity and shared transaction safety.
import {runEngineFixture} from './test-harness.mjs';

await runEngineFixture(String.raw`(()=>{
  const assert=(ok,msg)=>{if(!ok)throw new Error('MARKET_RESERVE '+msg)};
  const baseline=(db,rep)=>{
    const year=db.year,size=5+(db.worldConfig.subs||0),w=db.world,
      mine=w&&w.manage==='manual'?managedTeamId(db):null;
    for(const a of activeTeams(db).filter(t=>t.parent)){
      const t=db.teams[a.parent];if(!t||t.active===false||t.id===mine)continue;
      for(const role of ROLES){
        const cur=starterFor(db,t,role),cand=a.roster.map(id=>db.players[id])
          .filter(p=>p.role===role).sort((x,y)=>playerOvr(y)-playerOvr(x))[0];
        if(cand&&(!cur||playerOvr(cand)>=playerOvr(cur)+5||
          (playerOvr(cand)>=playerOvr(cur)+3&&((cur.form??0)<=-6||cur.wantsOut)))){
          assignPlayerToTeam(db,cand,t);
          if(cur&&t.roster.length>size)assignPlayerToTeam(db,cur,a);
          rep.signings.push({pid:cand.id,team:t.id,salary:cand.contract?cand.contract.salary:0,
            years:cand.contract?cand.contract.until-year+1:1,callup:true});
        }
      }
    }
  };
  const fixture=(count,gap,form=0)=>{
    const db=buildWorld(),parent=activeTeams(db,null,1).find(t=>reserveTeamsOf(db,t).length),
      reserve=reserveTeamsOf(db,parent)[0];
    for(const t of Object.values(db.teams)){t.roster=[];t.depthChart={}}
    setManagedTeam(db,null);db.world={phase:'market',manage:'auto',year:db.year};
    db.worldConfig.subs=0;
    for(const role of ROLES){
      const players=Object.values(db.players).filter(p=>!p.retired&&!p.team&&p.role===role);
      const down=players[0],up=players[1];
      for(const key of Object.keys(down.attrs))down.attrs[key]=60;
      for(const key of Object.keys(up.attrs))up.attrs[key]=60+gap;
      down.form=form;
      if(parent.roster.length<count)assignPlayerToTeam(db,down,parent);
      assignPlayerToTeam(db,up,reserve);
    }
    return {db,parent,reserve};
  };
  let moves=0;
  for(const [count,gap,form] of [[5,5,0],[5,3,-6],[5,3,0],[4,0,0],[0,0,0]]){
    const {db}=fixture(count,gap,form),old=actionJournalClone(db),expected={signings:[]},actual={signings:[]};
    baseline(old,expected);aiMarketReserveCallups(db,actual);
    assert(JSON.stringify(actual)===JSON.stringify(expected),'market report differs from baseline');
    assert(JSON.stringify(db)===JSON.stringify(old),'rosters/player state/depth/events differ from baseline');
    assert(JSON.stringify(unpackDB(packDB(db)))===JSON.stringify(unpackDB(packDB(old))),
      'market callup save/restore differs');
    moves+=actual.signings.length;
  }
  assert(moves>0,'parity fixtures made no callups');
  const {db,parent,reserve}=fixture(5,5),command={type:'roster.market-callup',actor:'ai',
    parentId:parent.id,reserveId:reserve.id,role:'TOP'};
  const before=JSON.stringify(db),preview=previewWorldAction(db,command);
  assert(preview.ok&&JSON.stringify(db)===before,'preview mutated roster/depth/player state');
  const handler=WORLD_ACTION_HANDLERS[command.type],apply=handler.apply;
  try{
    handler.apply=(state,c)=>{const done=apply(state,c);throw new Error('late callup failure')};
    const failed=applyWorldAction(db,preview);
    assert(!failed.ok&&failed.reason==='apply_failed'&&JSON.stringify(db)===before,
      'late callup failure left a partial swap');
  }finally{handler.apply=apply}
  reserve.roster.reverse();
  assert(applyWorldAction(db,preview).reason!=='stale_preview','roster order alone made preview stale');
  const protectedClub=fixture(5,5);
  protectedClub.db.world.manage='manual';setManagedTeam(protectedClub.db,protectedClub.parent.id);
  const protectedBefore=JSON.stringify(protectedClub.db),protectedReport={signings:[]};
  aiMarketReserveCallups(protectedClub.db,protectedReport);
  assert(!protectedReport.signings.length&&JSON.stringify(protectedClub.db)===protectedBefore,
    'AI modified the managed club');
  assert(!previewWorldAction(protectedClub.db,{...command,parentId:protectedClub.parent.id,
    reserveId:protectedClub.reserve.id}).ok,'direct AI command bypassed manager authority');
  console.log('MARKET_RESERVE_ACCEPTANCE '+JSON.stringify({parityCases:5,callups:moves,
    purePreview:true,rollback:true,managerProtected:true,saveRestore:true}));
})();`,{timeout:30000,filename:'market-reserve-acceptance.fixture.js'});
