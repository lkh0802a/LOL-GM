// R02 migration baseline, not permission to add more direct writers.
// Shrink this inventory when a caller moves to its canonical domain API.
// This is a conservative source-text guard, not an alias-aware JS call graph.
export const MUTATION_OWNERSHIP={
  'contract-window.js':{date:3},
  'contracts.js':{assign:3},
  'development.js':{cash:1},
  'finance.js':{cash:2},
  'medical.js':{cash:1},
  'office.js':{remove:1},
  'offseason.js':{date:3,remove:1},
  'player.js':{assign:1},
  'scouting-ai-ops.js':{cash:1},
  'scouting.js':{cash:1},
  'season.js':{date:2},
  'staff.js':{cash:2},
  'state-player-actions.js':{cash:1,remove:1},
  'transfer.js':{assign:1}
};

export function mutationInventory(source){
  // Include literal bracket-property spelling as well as dot-property spelling.
  const text=source.replace(/\[\s*(['"])(finance|cash|worldDate)\1\s*\]/g,'.$2');
  const write='(?:\\+\\+|--|(?:(?:\\*\\*|&&|\\|\\||\\?\\?|[+\\-*/%&|^])=|(?<![=!<>])=(?![=>])))';
  const patterns={
    cash:new RegExp('\\.\\s*finance\\s*\\.\\s*cash\\s*'+write,'g'),
    date:new RegExp('\\.\\s*worldDate\\s*'+write,'g'),
    assign:/\bassignPlayerToTeam\s*\(/g,
    remove:/\bremovePlayerFromTeam\s*\(/g
  };
  const inventory={};
  for(const [kind,pattern] of Object.entries(patterns)){
    const matches=[...text.matchAll(pattern)].filter(match=>
      !/\bfunction\s*$/.test(text.slice(0,match.index)));
    if(matches.length)inventory[kind]=matches.length;
  }
  return inventory;
}

export function assertMutationOwnership(sources,baseline=MUTATION_OWNERSHIP){
  const failures=[];
  for(const file of Object.keys(baseline)){
    if(!sources.has(file))failures.push(`${file}: baseline owner missing from module manifest`);
  }
  for(const [file,source] of sources){
    const actual=mutationInventory(source),expected=baseline[file]||{};
    const kinds=new Set([...Object.keys(actual),...Object.keys(expected)]);
    for(const kind of kinds){
      if((actual[kind]||0)!==(expected[kind]||0))
        failures.push(`${file}: ${kind} expected ${expected[kind]||0}, found ${actual[kind]||0}`);
    }
  }
  if(failures.length)throw new Error('Mutation ownership changed; review the domain boundary and baseline:\n'+failures.join('\n'));
}
