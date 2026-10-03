// Explicit recorded blue/red provenance and observational comparison.
function metaSideColor(row,side){
  const sides=row.sides||[];
  // Require explicit complementary provenance. Neither array order nor today's
  // club/first-pick choice identifies an uncertain historical side.
  return sides.length===2&&sides.includes(side)&&sides.every(s=>s.color==='BLUE'||s.color==='RED')&&sides[0].color!==sides[1].color?side.color:null;
}

function metaSideCoverage(db,filter={}){
  const base={...filter};delete base.color;
  const matches=(row,side)=>metaSideMatches(row,side,base)&&(!base.position||(side.picks||[]).some(p=>typeof p==='object'&&p.role===base.position&&(!base.player||p.player===base.player)));
  const rows=metaRowsFiltered(db,base).filter(row=>(row.sides||[]).some(side=>matches(row,side))),out={games:rows.length,knownGames:0,unknownGames:0,unknownSides:0,BLUE:{games:0,wins:0},RED:{games:0,wins:0}};
  for(const row of rows){let known=false,unknown=false;
    for(const side of row.sides||[]){if(!matches(row,side))continue;const color=metaSideColor(row,side);if(color){out[color].games++;if(side.win)out[color].wins++;known=true}else{out.unknownSides++;unknown=true}}
    if(known)out.knownGames++;if(unknown)out.unknownGames++;
  }
  return out;
}
