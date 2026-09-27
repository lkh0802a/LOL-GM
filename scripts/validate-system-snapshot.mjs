import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import vm from 'node:vm';

const root=resolve(import.meta.dirname,'..');
const file=await readFile(resolve(root,'src','artifact','system-source.js'),'utf8');
const ctx={};vm.runInNewContext(file+'\nthis.snapshot=SYSTEM_SOURCE_SNAPSHOT;',ctx,{filename:'system-source.js'});
const s=ctx.snapshot;
if(!s||s.schema!==1)throw new Error('Unexpected system source schema');
if(s.provider!=='Riot Data Dragon'||s.version!=='16.19.1'||s.mapId!==11)throw new Error('System source pin drift');
const itemIds=Object.keys(s.items||{}),runeIds=Object.keys(s.runes||{}),styles=s.runeStyles||[];
if(itemIds.length!==254)throw new Error('Expected 254 Summoner Rift purchasable item records, got '+itemIds.length);
if(runeIds.length!==62)throw new Error('Expected 62 selectable runes, got '+runeIds.length);
if(styles.length!==5)throw new Error('Expected 5 rune styles, got '+styles.length);
const seenItems=new Set();
for(const id of itemIds){const x=s.items[id];if(seenItems.has(id)||String(x.id)!==id)throw new Error('Item stable ID mismatch: '+id);seenItems.add(id);if(!x.nameKo||!x.gold||!Number.isFinite(x.gold.total)||!Array.isArray(x.tags)||!Array.isArray(x.from)||!Array.isArray(x.into))throw new Error('Item schema incomplete: '+id)}
const slotted=[];
for(const st of styles){if(!st.id||!st.nameKo||!Array.isArray(st.slots)||st.slots.length!==4)throw new Error('Rune style schema incomplete: '+st.id);for(let slot=0;slot<4;slot++){if(!st.slots[slot]?.length)throw new Error('Empty rune slot: '+st.id+'/'+slot);for(const id of st.slots[slot]){const r=s.runes[id];if(!r||String(r.styleId)!==String(st.id)||r.slot!==slot||!r.nameKo||!r.shortDescKo)throw new Error('Rune slot mismatch: '+id);slotted.push(id)}}}
if(slotted.length!==62||new Set(slotted).size!==62||slotted.some(id=>!s.runes[id]))throw new Error('Rune tree does not cover all runes exactly once');
console.log('Validated pinned system snapshot: 254 items, 62 runes, 5 rune styles.');
