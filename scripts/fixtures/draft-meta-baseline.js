// Preserved createDraftSession from validated main b9e3a65. Test-only parity reference.
const baselineCreateDraftSession=(function createDraftSession(db,teamIds,rng,ctx){
  ctx=ctx||{used:[],byTeam:{}};
  const evalBase=draftPoolSnapshot(db,ctx),{champs,strengths,mn,mx,byRole}=evalBase;
  const samples=currentPatchMetaSamples(db),MS=samples.stats,G=samples.games,RMS=samples.regional,RMG=samples.regionGames;
  const vhat=teamIds.map(tid=>{const team=db.teams[tid],rid=team.region,an=Math.min(1,staffAnalysisFor(team,'meta')/100+scrimAnalysisBonus(team)),data=Math.min(1,staffAnalysisFor(team,'data')/100+scrimAnalysisBonus(team)),m={};
    const nk=tid+'|'+an,noiseCache=draftNoiseBucket(db);let NZ=noiseCache.get(nk);if(!NZ){NZ={};noiseCache.set(nk,NZ)}
    champs.forEach(c=>{if(NZ[c.id]===undefined)NZ[c.id]=((hashStr(tid+db.patch.id+c.id)%2000)/1000-1)*0.35*(1.1-an);const noise=NZ[c.id];
      let v=clamp((strengths[c.id]-mn)/(mx-mn||1)+noise,0,1);
      const gst=MS[c.id],rst=(RMS[rid]||{})[c.id],rg=RMG[rid]||0,know=((team.metaKnowledge||{})[c.id]||0),counter=((team.metaCounter||{})[c.id]||0);
      const observe=(base,st,g,weight)=>{if(!st||!g)return base;const n=st.p+st.b,w=n/(n+18*(1.35-data)),wr=(st.w+2)/(st.p+4),obs=clamp(0.5+(wr-0.5)*2.2+(n/g)*0.5-0.1,0,1);return base*(1-w*weight)+obs*w*weight};
      v=observe(v,gst,G,.45);v=observe(v,rst,rg,.75);const prePro=c.proEligibleDate&&!championProEligible(db,c),uncertainty=prePro?(know-.5)*.12:0;m[c.id]=clamp(v+know*.08-counter*.035+uncertainty,0,1);
    });return m;
  });
  const roster=teamIds.map(tid=>{const r={};ROLES.forEach(role=>r[role]=starterFor(db,db.teams[tid],role));return r});
  return {db,teamIds,rng,ctx,champs,strengths,mn,mx,byRole,vhat,roster,taken:new Set(ctx.fearless?ctx.used:[]),bans:[[],[]],pickList:[[],[]],expl:[],log:[],tacs:teamIds.map(t=>db.teams[t].tactics),shortlists:{},firstPick:ctx.firstPick||0,cursor:0};
});
