// Pure structural gate for the non-authoritative legal codification review.
// Usage: node docs/legal-codification-review/validate.mjs
// This does NOT verify the final legal effect of user decisions or real gameplay.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(root, '..', 'rulebook');
const read = x => readFileSync(path.join(root, x), 'utf8');
const text = read('LAW_DRAFT.md');
const mapText = read('LEGACY_MAP.md');
const tech = readFileSync(path.resolve(root, '..', 'interface-spec', 'USER_EXPERIENCE_REQUIREMENTS.md'), 'utf8');
const originalNames = ['00-CORE','10-COMPETITIONS','20-CALENDAR','30-TRANSFERS','40-PLAYERS','50-MATCH','60-BUSINESS','70-GOVERNANCE','80-EXPERIENCE'];
const old = originalNames.flatMap(x => [...readFileSync(path.join(source, x + '.md'),'utf8')
  .matchAll(/^###\s+([A-Z]+-\d{3})\s+·/gm)].map(m => m[1]));
const articles = [...text.matchAll(/^### 제(\d+)조\(([^\n]+)\)/gm)]
  .map(x => ({ n: Number(x[1]), title: x[2] }));
const chapterNums = [...text.matchAll(/^## 제(\d+)장/gm)].map(m => Number(m[1]));
const matches = [...mapText.matchAll(/^\| (본칙|기술요건) \| `([A-Z]+-\d{3})` \|/gm)]
  .map(m => ({ group: m[1], id: m[2] }));
const national = [...mapText.matchAll(/^\| `(NAT-\d{3})` \| 제(\d+)조/gm)].map(m => ({id:m[1],n:Number(m[2])}));
const techIds = [...tech.matchAll(/^## (UI-\d{3}) ·/gm)].map(m => m[1]);
const fail = (name, ok, detail='') => { if(!ok)throw Error(name + ' FAIL ' + detail); };
const distinct = xs => new Set(xs).size===xs.length;
fail('113 original IDs',old.length===113 && distinct(old));
fail('7 chapters',chapterNums.join(',')==='1,2,3,4,5,6,7');
fail('108 law articles',articles.length===108 && distinct(articles.map(x=>x.n)) && articles.every((x,i)=>x.n===i+1));
fail('all legacy IDs mapped',matches.length===113 && distinct(matches.map(x=>x.id)) &&
  old.every(id=>matches.some(x=>x.id===id)));
fail('103 law old + 10 tech old',matches.filter(x=>x.group==='본칙').length===103 &&
  matches.filter(x=>x.group==='기술요건').length===10);
fail('new national rules',national.length===5 && distinct(national.map(x=>x.id)) &&
  national.every((x,i)=>x.id==='NAT-'+String(i+1).padStart(3,'0') && x.n>0 && x.n<=108));
fail('ten external UI contracts',techIds.length===10 && distinct(techIds) &&
  techIds.every(id=>matches.some(x=>x.id===id&&x.group==='기술요건')));
fail('no orphan original IDs in law',!/(?:CORE|COMP|CAL|TRANS|PLAYER|MATCH|BIZ|GOV|UI)-\d{3}/.test(text));
const crossRefs=[...text.matchAll(/제(\d+)조/g)].map(x=>Number(x[1]));
fail('cross references',crossRefs.every(n=>n>=1&&n<=108));
fail('national team multiple teams',text.includes('둘 이상의 국가대표팀'));
fail('market dates and scope',text.includes('구단 대회의 공식 지역·공식 국제·독립 지역·독립 국제 실제 경기') && text.includes('국가대표 대회는 세계 통합 선수 이적시장이 열리는'));
fail('original source trace',mapText.includes('https://github.com/lkh0802a/LOL-GM/blob/'));
console.log(JSON.stringify({status:'STRUCTURAL_PASS',chapters:7,legacy:old.length,statutory:articles.length,technical:techIds.length,national:national.length,notes:'This does not certify user approval finality, semantics, npm check, game tests, CI or merge.'},null,2));
