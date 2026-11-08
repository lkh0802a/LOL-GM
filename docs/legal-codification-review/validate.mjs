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
const implementationAcceptance = readFileSync(path.resolve(root, '..', 'implementation-spec', 'NON_NORMATIVE_ACCEPTANCE.md'), 'utf8');
const hierarchy = read('RULE_LEVELS.md');
const delegationAudit = read('DELEGATION_AUDIT.md');
const lifecycle = read('IN_WORLD_RULES_LIFECYCLE.md');
const cases = read('NORMATIVE_CASES.md');
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
const legacyTechIds = techIds.filter(id => Number(id.slice(3))<=10);
const migratedTechIds = techIds.filter(id => Number(id.slice(3))>10);
const acceptanceIds = [...implementationAcceptance.matchAll(/^## (QA-\d{3}) ·/gm)].map(m => m[1]);
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
fail('ten original UI contracts',legacyTechIds.length===10 && distinct(techIds) &&
  legacyTechIds.every(id=>matches.some(x=>x.id===id&&x.group==='기술요건')));
fail('migrated UI requirement retained',migratedTechIds.length===1 && migratedTechIds[0]==='UI-011' && tech.includes('현실 시간 카운트다운'));
fail('non-world acceptance requirements',acceptanceIds.length===5 && acceptanceIds.every((id,i)=>id==='QA-'+String(i+1).padStart(3,'0')));
fail('no orphan original IDs in law',!/(?:CORE|COMP|CAL|TRANS|PLAYER|MATCH|BIZ|GOV|UI)-\d{3}/.test(text));
fail('no mangled article IDs',!/제\d+조[·\/-]\d{2,3}/.test(text));
fail('no obvious punctuation artifact',!/\.{2,}|다\.[가-힣]/.test(text));
fail('no interface or QA prose in the law',!/(?:화면|클릭|버튼|현실 시간 카운트다운)/.test(text));
const crossRefs=[...text.matchAll(/제(\d+)조/g)].map(x=>Number(x[1]));
fail('cross references',crossRefs.every(n=>n>=1&&n<=108));
fail('national team multiple teams',text.includes('둘 이상의 국가대표팀'));
fail('market dates and scope',text.includes('구단 대회의 공식 지역·공식 국제·독립 지역·독립 국제 실제 경기') && text.includes('국가대표 대회는 세계 통합 선수 이적시장이 열리는'));
fail('original source trace',mapText.includes('https://github.com/lkh0802a/LOL-GM/blob/'));
const delegated = [...delegationAudit.matchAll(/^\| 제(\d+)조 \|/gm)].map(m => Number(m[1]));
fail('108 world-layer classifications',delegated.length===108 && delegated.every((n,i)=>n===i+1));
const normativeTypes=['상위 보호·금지 또는 불변','상위 권리·적격성·효력 조건','범위 한정 내부 규정 제정권','개별 행위·처분·계약 구분','초기 설정과 향후 개정권 구분','권한 미정/세부 규정 미제정'];
const auditRows=[...delegationAudit.matchAll(/^\| 제(\d+)조 \| ([^|]+) \| ([^|]+) \|/gm)].map(m=>({n:Number(m[1]),type:m[3].trim()}));
fail('108 statutory character tags',auditRows.length===108 && auditRows.every((r,i)=>r.n===i+1 && normativeTypes.includes(r.type)));
fail('initial world preset and undecided authority',auditRows.some(r=>r.type==='초기 설정과 향후 개정권 구분') && auditRows.filter(r=>r.type==='권한 미정/세부 규정 미제정').length===3);
fail('external vs internal authority',hierarchy.includes('세계 외부 규칙') && hierarchy.includes('세계 내부 규칙') && text.includes('## 규범의 두 층위'));
fail('UI outside both world rule levels',hierarchy.includes('UI') && hierarchy.includes('세계 내부 규칙'));
fail('constitution is externally enacted',text.startsWith('# LOL-GM 세계 외부 헌장') && text.includes('내부 기관의 개별 행정처분'));
fail('in-world enactment lifecycle',lifecycle.includes('제정권') && lifecycle.includes('사전 공표') && lifecycle.includes('APPROVED_NOT_EFFECTIVE') && lifecycle.includes('SUPERSEDED') && lifecycle.includes('세계 내부'));
const hierarchyCases=[...cases.matchAll(/^\| (H-\d{2}) \|/gm)].map(m=>m[1]);
fail('18 acceptance cases indexed',hierarchyCases.length===18 && hierarchyCases.every((id,i)=>id==='H-'+String(i+1).padStart(2,'0')));
fail('protected boundary cases',cases.includes('H-02') && cases.includes('H-03') && cases.includes('H-04') && cases.includes('H-05') && cases.includes('H-13') && cases.includes('H-16'));
console.log(JSON.stringify({status:'STRUCTURAL_PASS',chapters:7,legacy:old.length,statutory:articles.length,legacyUI:legacyTechIds.length,migratedUI:migratedTechIds.length,developmentQA:acceptanceIds.length,national:national.length,hierarchyScenarios:hierarchyCases.length,notes:'Structural check only: does not certify final approval effect, gameplay behavior, CI or merge.'},null,2));
