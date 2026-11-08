import test from 'node:test';
import assert from 'node:assert/strict';
import {readDocuments,validateRulebook} from './rulebook-guard.mjs';

const original=readDocuments();
const check=docs=>validateRulebook(docs).errors.join('\n');
const changed=(file,fn)=>({...original,[file]:fn(original[file])});

test('standalone world rulebook has unique rule identifiers and working local links',()=>{
  const result=validateRulebook(original);
  assert.deepEqual(result.errors,[]);
  assert.equal(result.chapterCount,9);
  assert(result.ruleCount>=113); // protect the reviewed baseline without blocking future approved additions
});
test('duplicate ID cannot pass as a new approved clause',()=>{
  const file='docs/rulebook/20-CALENDAR.md';
  const docs=changed(file,text=>text+'\n### CAL-001 · duplicate\ntext [근거](https://github.com/lkh0802a/LOL-GM/issues/234)\n');
  assert.match(check(docs),/DUPLICATE_ID: CAL-001/);
});
test('missing external audit evidence is rejected without citing approvals inside the law',()=>{
  const file='docs/rulebook-audit/CLAUSE_DECISION_MATRIX_2026_11_01.md';
  const docs=changed(file,text=>text.replace(/(\| MATCH-003 \|[^\n]*?\| )#[0-9]+/,'$1evidence-missing'));
  assert.match(check(docs),/MATRIX_EVIDENCE_MISSING: MATCH-003/);
});
test('an obsolete global FA date cannot silently replace the approved date',()=>{
  const file='docs/rulebook/20-CALENDAR.md';
  const docs=changed(file,text=>text.replace('12월 첫째 화요일 00:00 UTC','11월 셋째 화요일 00:00 UTC'));
  assert.match(check(docs),/BROKEN_PIN: CAL-001/);
});
test('an independent match exception cannot override the market suspension',()=>{
  const file='docs/rulebook/20-CALENDAR.md';
  const docs=changed(file,text=>text.replace('의 실제 경기는 모두 금지한다','의 실제 경기는 모두 금지한다. 단, 독립 대회의 실제 경기는 허용한다'));
  assert.match(check(docs),/CONFLICTING_MARKET_EXCEPTION: CAL-003/);
  const denial=changed(file,text=>text.replace('의 실제 경기는 모두 금지한다','의 실제 경기는 모두 금지한다. 독립 대회의 실제 경기는 허용하지 않는다'));
  assert.doesNotMatch(check(denial),/CONFLICTING_MARKET_EXCEPTION/);
});
test('rulebook links to nonexistent files cannot silently pass',()=>{
  const file='docs/rulebook/README.md';
  const docs=changed(file,text=>text.replace('(00-CORE.md)','(missing-CORE.md)'));
  assert.match(check(docs),/BROKEN_LOCAL_LINK/);
});
test('Codex startup cannot silently drop the rulebook lookup',()=>{
  const docs=changed('AGENTS.md',text=>text.replace('## 규정집 필수 참조','## optional old note'));
  assert.match(check(docs),/CODEX_ENTRY/);
});
test('immutable First Selection and draft policies cannot silently disappear',()=>{
  let docs=changed('docs/rulebook/50-MATCH.md',text=>text.replaceAll('First Selection','Old Selection'));
  assert.match(check(docs),/BROKEN_PIN: MATCH-003/);
  docs=changed('docs/rulebook/50-MATCH.md',text=>text.replaceAll('Fearless Draft','Optional Draft'));
  assert.match(check(docs),/BROKEN_PIN: MATCH-002/);
});
test('emergency replacement requires explicit tournament permission',()=>{
  const docs=changed('docs/rulebook/50-MATCH.md',text=>text.replace('대회가 해당 예외를 명시적으로 허용한 경우에만 의료 확인과 등록 심사','대회의 명시적 허용 없이 등록'));
  assert.match(check(docs),/BROKEN_PIN: MATCH-004/);
});
test('accommodation cannot impose daily manual assignment',()=>{
  const docs=changed('docs/rulebook/40-PLAYERS.md',text=>text.replace('매일 숙소를 수동 배치하도록 강제하거나 방송·기술 장비 관리 업무를 다시 도입하지 않는다','매일 숙소를 수동 배치한다'));
  assert.match(check(docs),/BROKEN_PIN: PLAYER-007/);
});
test('approved seasonal RP reset cannot silently become optional',()=>{
  const docs=changed('docs/rulebook/40-PLAYERS.md',text=>text.replace('시즌 시작 때 공개 RP는 소프트 리셋하고','시즌 시작 때 공개 RP는 소프트 리셋할 수 있고'));
  assert.match(check(docs),/BROKEN_PIN: PLAYER-004/);
});
test('unobserved prospects remain uncertain for both user and AI',()=>{
  const file='docs/rulebook/40-PLAYERS.md';
  let docs=changed(file,text=>text.replace('**미관측 또는 불확실**','확정된 평가'));
  assert.match(check(docs),/BROKEN_PIN: PLAYER-007/);
  docs=changed(file,text=>text.replace('AI도 권한 없이 비공개 실제 능력·잠재력에 직접 접근하지 않으며','AI는 비공개 실제 능력에 직접 접근하며'));
  assert.match(check(docs),/BROKEN_PIN: PLAYER-007/);
});
test('shared facilities cannot erase first-team priority on a real clash',()=>{
  const docs=changed('docs/rulebook/40-PLAYERS.md',text=>text.replace('실제 이용 시간이 충돌하면 1군이 우선','항상 2군이 우선'));
  assert.match(check(docs),/BROKEN_PIN: PLAYER-007/);
});
test('publication version and changelog cannot silently diverge',()=>{
  const docs=changed('docs/rulebook/README.md',text=>text.replace('v0.11.0','v9.9.9'));
  assert.match(check(docs),/CHANGELOG: no entry/);
});
test('approved youth compensation and club taxonomy cannot silently regress',()=>{
  const file='docs/rulebook/60-BUSINESS.md';
  let docs=changed(file,text=>text.replace('지급 비율·금액·분할식·자격·발효 시점·기금 조성은 미확정','지급 비율은 확정'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-011/);
  docs=changed(file,text=>text.replace('프로/세미프로/아마추어','프로/아마추어 고정'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-012/);
});
test('development records do not create or erase acquired claims automatically',()=>{
  const file='docs/rulebook/60-BUSINESS.md';
  let docs=changed(file,text=>text.replace('실제 계약상 채권자와 적법한 권리 승계에 따르며','새 구단에 무조건 지급하며'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-011/);
  docs=changed(file,text=>text.replace('모든 권리의 자동 소멸이나 이전·새 구단에 대한 자동 승계를 가정하지 않는다','매각하면 모든 권리가 자동 소멸한다'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-011/);
});
test('historical evidence depth is tracked only in external audit metadata',()=>{
  const result=validateRulebook(original);
  assert.equal(result.sourceDepth.directCommentLinked+result.sourceDepth.issueOnlyOrOther,result.ruleCount);
  assert(result.sourceDepth.directCommentLinked>0);
});
test('a tournament-wide two-loss cap cannot replace per-bracket elimination policy',()=>{
  const file='docs/rulebook/10-COMPETITIONS.md';
  const docs=changed(file,text=>text.replace('대회 전체에서 2패를 초과할 수 없다는 뜻이 아니다','대회 전체 2패 제한이 적용된다'));
  assert.match(check(docs),/BROKEN_PIN: COMP-006/);
});
test('empty-roster help and important alerts preserve manager choice',()=>{
  const file='docs/interface-spec/USER_EXPERIENCE_REQUIREMENTS.md';
  let docs=changed(file,text=>text.replace('안내 이행이나 영입을 강제하지 않고','안내 이행과 영입을 강제하고'));
  assert.match(check(docs),/BROKEN_PIN: UI-001/);
  docs=changed(file,text=>text.replace('모든 미세 이벤트의 알림을 강제하지 않는다','모든 미세 이벤트를 강제로 알린다'));
  assert.match(check(docs),/BROKEN_PIN: UI-001/);
});
test('automatic advance and inbox preserve required decisions and deadlines',()=>{
  const file='docs/interface-spec/USER_EXPERIENCE_REQUIREMENTS.md';
  let docs=changed(file,text=>text.replace('실제 권한 담당자의 필수 결정을 건너뛰는 권한을 부여하지 않는다','필수 결정을 자동으로 건너뛴다'));
  assert.match(check(docs),/BROKEN_PIN: UI-008/);
  docs=changed(file,text=>text.replace('중요한 의무를 분류 과정에서 누락하지 않고','중요한 의무를 분류 과정에서 숨기고'));
  assert.match(check(docs),/BROKEN_PIN: UI-001/);
  docs=changed(file,text=>text.replace('법적·계약상 응답 기한과 감독의 필수 의사결정 여부','임의의 알림 빈도'));
  assert.match(check(docs),/BROKEN_PIN: UI-001/);
});
test('batch scouting cannot fabricate completed observations or ignore staff constraints',()=>{
  const file='docs/rulebook/40-PLAYERS.md';
  let docs=changed(file,text=>text.replace('스카우팅 담당자의 가용 업무·시간·예산과 관측 권한 범위','직원의 시간과 권한을 무시한 범위'));
  assert.match(check(docs),/BROKEN_PIN: PLAYER-007/);
  docs=changed(file,text=>text.replace('실제로 수행하지 않은 즉시 조사 결과를 만들지 않는다','즉시 조사 결과를 생성한다'));
  assert.match(check(docs),/BROKEN_PIN: PLAYER-007/);
  docs=changed(file,text=>text.replace('수집 배지는 복원하지 않는다','수집 배지를 복원한다'));
  assert.match(check(docs),/BROKEN_PIN: PLAYER-007/);
});
test('scouting decisions retain contemporary evidence and distinguish later revisions',()=>{
  const file='docs/rulebook/40-PLAYERS.md';
  let docs=changed(file,text=>text.replace('자료의 시점·출처와 소유·관측 범위를 근거로 연결','자료의 출처를 생략'));
  assert.match(check(docs),/BROKEN_PIN: PLAYER-007/);
  docs=changed(file,text=>text.replace('후속 실제 평가와 판단 수정 이력을 구분','후속 평가로 과거 판단을 덮어쓴다'));
  assert.match(check(docs),/BROKEN_PIN: PLAYER-007/);
  docs=changed(file,text=>text.replace('다른 구단의 비공개 자료를 당시 판단 근거로 소급해 제시하지 않는다','다른 구단의 비공개 자료를 과거 근거로 공개한다'));
  assert.match(check(docs),/BROKEN_PIN: PLAYER-007/);
});
test('development compensation reports distinguish actual obligations from projections',()=>{
  const file='docs/rulebook/60-BUSINESS.md';
  let docs=changed(file,text=>text.replace('확정 지급과 미확정 추정, 미수 및 지급 시점을 구분','추정액을 확정 지급으로 취급'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-011/);
  docs=changed(file,text=>text.replace('같은 사건의 중복 지급 위험을 표시','중복 지급 위험을 숨긴다'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-011/);
  docs=changed(file,text=>text.replace('실제 없는 재원·금액·비율을 만들어 표시하지 않는다','존재하지 않는 재원을 표시한다'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-011/);
});
test('preseason solvency review does not invent aid or prohibit legitimate financing',()=>{
  const file='docs/rulebook/60-BUSINESS.md';
  let docs=changed(file,text=>text.replace('실제 선수단 유지, 가용 현금과 확정 채무·만기를 함께 살핀다','현금만 확인한다'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-008/);
  docs=changed(file,text=>text.replace('약팀이라는 이유만으로 자동 현금 지원을 만들거나 AI의 무제한 차입을 허용하지 않는다','약팀에 자동 현금을 지원한다'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-008/);
  docs=changed(file,text=>text.replace('실제 재원·승인 권한이 있는 지원이나 차입까지 일률적으로 금지하는 뜻은 아니다','모든 지원과 차입을 금지한다'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-008/);
});
test('training claims do not pay twice or erase distinct real rights',()=>{
  const file='docs/rulebook/60-BUSINESS.md';
  let docs=changed(file,text=>text.replace('같은 실질 소유자에게 같은 사유로 보상을 이중 지급하지 않는다','같은 사유를 모구단과 2군에 각각 지급한다'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-011/);
  docs=changed(file,text=>text.replace('의미 없는 보유 기간만으로 자동 육성 보상을 만들지 않는다','보유 기간만으로 자동 육성 보상을 만든다'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-011/);
  docs=changed(file,text=>text.replace('서로 다른 실제 기여와 유효한 별도 권리까지 일률적으로 삭제하지 않는다','별도 권리도 모두 삭제한다'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-011/);
});
test('player distribution investigations do not force ability reductions or claim long-season coverage',()=>{
  const file='docs/rulebook/40-PLAYERS.md';
  let docs=changed(file,text=>text.replace('선수 능력 일괄 강등이나 억지 난이도 보정을 적용하지 않는다','선수 능력을 일괄 강등한다'));
  assert.match(check(docs),/BROKEN_PIN: PLAYER-012/);
  docs=changed(file,text=>text.replace('제한된 시즌 검사를 다지역 장기 시즌 검증으로 간주하지 않으며','두 시즌만으로 장기 검증을 완료한다'));
  assert.match(check(docs),/BROKEN_PIN: PLAYER-012/);
  docs=changed(file,text=>text.replace('권한 없는 화면에 공개하는 근거로 사용하지 않는다','모든 화면에 공개한다'));
  assert.match(check(docs),/BROKEN_PIN: PLAYER-012/);
});
test('training compensation comparisons control actual evidence without fabricating effects',()=>{
  const file='docs/rulebook/60-BUSINESS.md';
  let docs=changed(file,text=>text.replace('구단 소유·임대, 기간과 당시 근거를 통제한 비교','서로 다른 조건을 그대로 섞은 비교'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-011/);
  docs=changed(file,text=>text.replace('다른 입력이 언제나 다른 결과를 내도록 강제하지 않으며','모든 입력에 다른 결과를 강제하며'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-011/);
  docs=changed(file,text=>text.replace('실제 원장이나 계약이 없는 지급을 검증 결과로 만들어내지 않는다','기록 없는 지급을 만들어낸다'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-011/);
});
test('long-term economics use real evidence without forced equalization or overstated coverage',()=>{
  const file='docs/rulebook/60-BUSINESS.md';
  let docs=changed(file,text=>text.replace('경제력을 강제로 평준화하거나 경기 결과를 보정하지 않는다','경제력과 경기 결과를 강제로 평준화한다'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-008/);
  docs=changed(file,text=>text.replace('제한된 기간의 실행만으로 장기 경제 검증이 완료되었다고 간주하지 않는다','한 시즌으로 장기 경제 검증을 완료한다'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-008/);
  docs=changed(file,text=>text.replace('실제 표본과 원장을 근거로 검토','임의 수치를 근거로 검토'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-008/);
});
test('scouting discovery alone creates no exclusive signing right',()=>{
  const file='docs/rulebook/30-TRANSFERS.md';
  let docs=changed(file,text=>text.replace('먼저 발견했다는 사실만으로 독점 계약 우선권을 자동 부여하지 않는다','먼저 발견하면 독점 계약권을 준다'));
  assert.match(check(docs),/BROKEN_PIN: TRANS-009/);
  docs=changed(file,text=>text.replace('관측 순서만을 이유로 다른 구단의 적법한 제안을 차단하지 않는다','첫 관측 구단 외 제안을 차단한다'));
  assert.match(check(docs),/BROKEN_PIN: TRANS-009/);
  docs=changed(file,text=>text.replace('이미 유효하게 성립한 별도 계약상의 권리는 실제 계약과 적용 규정에 따라 판단한다','별도 계약상의 권리를 모두 없앤다'));
  assert.match(check(docs),/BROKEN_PIN: TRANS-009/);
});
test('cross-league development records do not invent payments or erase valid obligations',()=>{
  const file='docs/rulebook/60-BUSINESS.md';
  let docs=changed(file,text=>text.replace('다른 리그의 실제 육성 기여도 공통 기준에 따른 이력으로 인정','다른 리그의 육성 이력을 무조건 무시'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-011/);
  docs=changed(file,text=>text.replace('리그 간 금전 이전은 승인된 관할·지급 의무·재원을 충족할 때만','리그 간 금전은 무조건 지급하며'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-011/);
  docs=changed(file,text=>text.replace('이미 적법하게 발생한 육성 지원 채무를 임의로 소멸시키지 않는다','이미 발생한 채무를 없앤다'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-011/);
  docs=changed(file,text=>text.replace('확정되지 않은 지원에 없는 돈을 지급하지 않는다','확정되지 않은 지원을 무조건 지급한다'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-011/);
});
test('international travel costs preserve real movement and contracted support',()=>{
  const file='docs/rulebook/60-BUSINESS.md';
  let docs=changed(file,text=>text.replace('국제대회 이동비는 실제 이동 거리와 비용','국제대회 이동비는 대회 수만으로 계산'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-004/);
  docs=changed(file,text=>text.replace('주최자·사무국의 계약상 합법 지원을 구분한다','지원의 계약 여부를 무시한다'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-004/);
  docs=changed(file,text=>text.replace('같은 비용이나 지원을 중복 지급하지 않는다','같은 지원을 중복 지급한다'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-004/);
  docs=changed(file,text=>text.replace('승인되지 않은 거리 요금·지원 비율을 만들지 않는다','임의 요금을 확정한다'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-004/);
});
test('development support and sell-on rights require real evidence and valid terms',()=>{
  const file='docs/rulebook/60-BUSINESS.md';
  let docs=changed(file,text=>text.replace('무상 이적이나 첫 프로 계약에 존재하지 않는 이적료를 만들지 않으며','첫 프로 계약에 임의 이적료를 부과하며'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-011/);
  docs=changed(file,text=>text.replace('재이적 셀온은 실제 유효 계약의 기간·권리 범위·발효 및 종료 조건을 따르며 계약 없는 영구권을 만들지 않는다','모든 구단에 계약 없는 영구권을 준다'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-011/);
  docs=changed(file,text=>text.replace('검증 가능한 기여에 근거한 공개된 합법 규정으로 평가한다','임의의 비공개 기준으로 평가한다'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-011/);
  docs=changed(file,text=>text.replace('미승인 금액·자격이나 배분식을 임의로 확정하지 않는다','임의의 지원 비율을 확정한다'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-011/);
});
test('future scouting demand stays evidence-based and withdrawn alerts stay excluded',()=>{
  const file='docs/interface-spec/USER_EXPERIENCE_REQUIREMENTS.md';
  let docs=changed(file,text=>text.replace('합리적으로 입증된 미래 수요도 고려할 수 있으나','현재 공백만 고려해야 하나'));
  assert.match(check(docs),/BROKEN_PIN: UI-005/);
  docs=changed(file,text=>text.replace('인위적인 수요를 만들지 않는다','인위적인 수요를 만든다'));
  assert.match(check(docs),/BROKEN_PIN: UI-005/);
  docs=changed(file,text=>text.replace('의 도입 결정은 철회되었다','를 강제로 제공한다'));
  assert.match(check(docs),/BROKEN_PIN: UI-005/);
});
test('scrim recommendations and optional match detail retain authority and one result',()=>{
  let docs=changed('docs/rulebook/00-CORE.md',text=>text.replace('관리 구단의 감독이 이를 결정한다','직원이 자동 확정한다'));
  assert.match(check(docs),/BROKEN_PIN: CORE-010/);
  docs=changed('docs/implementation-spec/WORLD_ENGINE_AND_PRODUCT_ACCEPTANCE.md',text=>text.replace('스크림 예약·회의·보고 버튼을 강제하지 않는다','스크림 예약·회의·보고 버튼을 강제한다'));
  assert.match(check(docs),/PRODUCT_REQUIREMENT/);
  docs=changed('docs/interface-spec/USER_EXPERIENCE_REQUIREMENTS.md',text=>text.replace('두 번째 경기를 생성하지 않는다','두 번째 경기를 생성한다'));
  assert.match(check(docs),/BROKEN_PIN: UI-007/);
});
test('leadership changes and counterfactual analysis preserve records and authority',()=>{
  let docs=changed('docs/rulebook/00-CORE.md',text=>text.replace('선수의 실제 전술 숙련과 합법적으로 소유한 자료를 전면 초기화하지 않으며','모든 전술 숙련과 자료를 초기화하며'));
  assert.match(check(docs),/BROKEN_PIN: CORE-010/);
  docs=changed('docs/rulebook/00-CORE.md',text=>text.replace('현 감독의 기존 수동 권한을 무단으로 무력화하지 않는다','현 감독의 수동 권한을 자동으로 제거한다'));
  assert.match(check(docs),/BROKEN_PIN: CORE-010/);
  docs=changed('docs/interface-spec/USER_EXPERIENCE_REQUIREMENTS.md',text=>text.replace('가상의 대안에 대한 승패를 이미 확정된 공식 결과나 역사에 혼입하지 않는다','가상 승패를 공식 역사에 반영한다'));
  assert.match(check(docs),/BROKEN_PIN: UI-007/);
  docs=changed('docs/implementation-spec/WORLD_ENGINE_AND_PRODUCT_ACCEPTANCE.md',text=>text.replace('별도 감독/직원 인수인계 기능','별도 감독/직원 이전 절차'));
  assert.match(check(docs),/PRODUCT_REQUIREMENT/);
});
test('dividends cannot treat accounting profit as unlimited available cash',()=>{
  const docs=changed('docs/rulebook/60-BUSINESS.md',text=>text.replace('구단주가 무제한 인출할 수 있다고 가정하지 않는다','구단주는 무제한 인출할 수 있다'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-014/);
});
test('sponsor benefits and attendance cannot invent cash or ticket sales',()=>{
  const file='docs/rulebook/60-BUSINESS.md';
  let docs=changed(file,text=>text.replace('현물 지원만으로 실재하지 않는 현금을 생성하지 않으며','현물 지원은 동일한 현금을 생성하며'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-005/);
  docs=changed(file,text=>text.replace('팬덤 크기만으로 발생하지 않은 입장권 판매를 기록하지 않는다','팬덤 크기만으로 입장권 판매를 기록한다'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-007/);
});
test('relocation and development reputation preserve history and do not invent cash',()=>{
  const file='docs/rulebook/60-BUSINESS.md';
  let docs=changed(file,text=>text.replace('기존 구단 역사와 계약 원본을 보존한다','기존 역사와 계약을 삭제한다'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-007/);
  docs=changed(file,text=>text.replace('유명해졌다는 사실만으로 자동 현금 보상을 만들지 않는다','유명해지면 자동으로 현금을 지급한다'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-011/);
});
test('double disqualification distinguishes prior rounds from the final',()=>{
  const file='docs/rulebook/10-COMPETITIONS.md';
  let docs=changed(file,text=>text.replace('경기 자리를 승계하여 실제 경기로 진행한다','임의의 팀을 결승으로 진출시킨다'));
  assert.match(check(docs),/BROKEN_PIN: COMP-010/);
  docs=changed(file,text=>text.replace('우승자 없이 종료한다','차순위 팀에 우승을 자동 승계한다'));
  assert.match(check(docs),/BROKEN_PIN: COMP-010/);
});
test('approved Worlds boundary ties use head-to-head before deciding matches',()=>{
  const file='docs/rulebook/10-COMPETITIONS.md';
  let docs=changed(file,text=>text.replace('두 팀이면 실제 승자승을 우선하고 맞대결이 없으면 BO1','두 팀이면 무조건 BO1'));
  assert.match(check(docs),/BROKEN_PIN: COMP-019/);
  docs=changed(file,text=>text.replace('경계와 무관한 동률에 확대하지 않고','모든 동률로 확대하고'));
  assert.match(check(docs),/BROKEN_PIN: COMP-019/);
});
test('relegated parent and academy second-division collision cannot disappear',()=>{
  const file='docs/rulebook/10-COMPETITIONS.md';
  const docs=changed(file,text=>text.replace('적격한 실제 하위 부로 행정적으로 이동하거나, 적법하게 매각 또는 해체','다른 2부로 자동 재배치'));
  assert.match(check(docs),/BROKEN_PIN: COMP-004/);
});
test('official international eligibility and distinct payroll bases are pinned',()=>{
  let docs=changed('docs/rulebook/10-COMPETITIONS.md',text=>text.replace('MSI 미진출팀','MSI 진출팀'));
  assert.match(check(docs),/BROKEN_PIN: COMP-015/);
  docs=changed('docs/rulebook/60-BUSINESS.md',text=>text.replaceAll('상위 5명','전체 선수'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-013/);
});
test('general early-contact consent cannot erase the non-license buyout exception',()=>{
  const file='docs/rulebook/30-TRANSFERS.md';
  const docs=changed(file,text=>text.replace('다만 **TRANS-005에 해당하는 프로 라이선스 미보유 팀 계약 선수는 적법한 바이아웃을 전제로 한 자유 접촉·협상 예외**','다만 모든 조기 접촉은 반드시 원팀 동의'));
  assert.match(check(docs),/BROKEN_PIN: TRANS-003/);
});
test('colloquial vocabulary is rejected in normative chapter prose',()=>{
  const docs=changed('docs/rulebook/60-BUSINESS.md',text=>text.replace("고정된 '프로 구단' 분류","고정된 '프로 구단' 딱지"));
  assert.match(check(docs),/COLLOQUIAL_STYLE/);
});

test('in-game copy cannot be replaced by development-meta text',()=>{
  const file='docs/interface-spec/USER_EXPERIENCE_REQUIREMENTS.md';
  const docs=changed(file,text=>text.replace('게임 세계 밖의 개발·설계 메타 설명','게임 안에 개발·설계 메타 설명'));
  assert.match(check(docs),/BROKEN_PIN: UI-009/);
});
test('reopening an unsent draft cannot revoke signed contracts or committed payments',()=>{
  const file='docs/interface-spec/USER_EXPERIENCE_REQUIREMENTS.md';
  const docs=changed(file,text=>text.replace('이미 제출된 유효 제안, 실제 당사자 합의, 최종 서명, 확정된 지급 및 경과한 세계 시간','미제출 협상 내용'));
  assert.match(check(docs),/BROKEN_PIN: UI-010/);
});

test('a same-league broadcast overlap cannot silently replace sequential play',()=>{
  const docs=changed('docs/rulebook/20-CALENDAR.md',text=>text.replace('서로 겹치지 않도록 순차 편성','일부 겹치도록 편성'));
  assert.match(check(docs),/BROKEN_PIN: CAL-009/);
});
test('independent international events cannot be chained into automatic delay',()=>{
  const docs=changed('docs/rulebook/20-CALENDAR.md',text=>text.replace('연쇄적으로 순연하거나 취소하지 않는다','연쇄적으로 순연한다'));
  assert.match(check(docs),/BROKEN_PIN: CAL-011/);
});
test('automatic promotion and academy promotion cannot return silently',()=>{
  let docs=changed('docs/rulebook/10-COMPETITIONS.md',text=>text.replace('자동 승격·강등시키지 않는다','자동 승격·강등시킨다'));
  assert.match(check(docs),/BROKEN_PIN: COMP-016/);
  docs=changed('docs/rulebook/10-COMPETITIONS.md',text=>text.replace('2군은 공식 지역리그에서 승격하거나 승격 결정전에 참가할 수 없다','2군은 모든 승격 결정전에 자유롭게 참가할 수 있다'));
  assert.match(check(docs),/BROKEN_PIN: COMP-017/);
});


test('approved academy solution cannot be restricted to sale or dissolution only',()=>{
  const docs=changed('docs/rulebook/10-COMPETITIONS.md',text=>text.replace('적격한 실제 하위 부로 행정적으로 이동하거나, 적법하게 매각 또는 해체','적법하게 매각 또는 해체'));
  assert.match(check(docs),/BROKEN_PIN: COMP-004/);
});
test('parent and academy cannot share a lower official tier',()=>{
  const docs=changed('docs/rulebook/10-COMPETITIONS.md',text=>text.replace('같은 공식 지역리그의 동일한 부에 동시에 소속되거나 참가할 수 없다','같은 공식 지역리그의 3부라면 함께 참가할 수 있다'));
  assert.match(check(docs),/BROKEN_PIN: COMP-004/);
});
test('administrative academy relocation requires an actual eligible lower tier',()=>{
  const docs=changed('docs/rulebook/10-COMPETITIONS.md',text=>text.replace('해당 하위 부의 실재 여부·등록 자격·수용 정원과 계약·소유권·재정상 의무','행정 편의만 확인'));
  assert.match(check(docs),/BROKEN_PIN: COMP-004/);
});


test('adjudication matrix cannot duplicate an existing clause id',()=>{
  const file='docs/rulebook-audit/CLAUSE_DECISION_MATRIX_2026_11_01.md';
  const docs=changed(file,text=>text.replace('| CORE-002 |','| CORE-001 |'));
  assert.match(check(docs),/MATRIX_DUPLICATE: CORE-001/);
});
test('adjudication matrix cannot omit a rulebook clause',()=>{
  const file='docs/rulebook-audit/CLAUSE_DECISION_MATRIX_2026_11_01.md';
  const docs=changed(file,text=>text.replace(/^\| UI-010 \|[^\n]*\n/m,''));
  assert.match(check(docs),/SOURCE_AUDIT_MISSING: UI-010/);
});
test('adjudication source type must reflect direct comment links',()=>{
  const file='docs/rulebook-audit/CLAUSE_DECISION_MATRIX_2026_11_01.md';
  const docs=changed(file,text=>text.replace(/(\| CORE-001 \|[^\n]*\| )이슈·기타( \|)/,'$1댓글 직접 링크$2'));
  assert.match(check(docs),/MATRIX_SOURCE_DEPTH: CORE-001/);
});
test('adjudication summary cannot overcount reviewed clauses',()=>{
  const file='docs/rulebook-audit/CLAUSE_DECISION_MATRIX_2026_11_01.md';
  const docs=changed(file,text=>text.replace('| 관련 원문 부분대조 | 113 |','| 관련 원문 부분대조 | 112 |'));
  assert.match(check(docs),/MATRIX_SUMMARY: 관련 원문 부분대조/);
});


test('balance hotfix cannot take effect before every worldwide official series ends',()=>{
  const file='docs/rulebook/50-MATCH.md';
  const docs=changed(file,text=>text.replace('전 세계의 해당 일자 공식 대회 경기와 세트가 모두 종료된 이후','해당 지역의 첫 공식 경기 종료 직후'));
  assert.match(check(docs),/BROKEN_PIN: MATCH-008/);
});
test('unverifiable historical replay cannot be advertised as a perfect reproduction',()=>{
  const file='docs/interface-spec/USER_EXPERIENCE_REQUIREMENTS.md';
  const docs=changed(file,text=>text.replace('완전한 재현에 필요한 근거가 부족한 경우에는 재현의 한계를 명시','근거가 부족해도 전체 사건을 완벽하게 재현했다고 표시'));
  assert.match(check(docs),/BROKEN_PIN: UI-007/);
});


test('CORE-007 cannot forbid newly founded independent events until the next season',()=>{
  const file='docs/rulebook/00-CORE.md';
  const docs=changed(file,text=>text.replace('신규 독립 대회는 당해 시즌에도 신설할 수 있으나','신규 독립 대회도 무조건 다음 시즌에만 신설할 수 있으며'));
  assert.match(check(docs),/BROKEN_PIN: CORE-007/);
});
test('CORE-007 cannot change a currently running independent event retroactively',()=>{
  const file='docs/rulebook/00-CORE.md';
  const docs=changed(file,text=>text.replace('기존 독립 대회의 구조적 개편은 원칙적으로 차기 회차부터','기존 독립 대회의 구조적 개편은 진행 중 회차에도 즉시'));
  assert.match(check(docs),/BROKEN_PIN: CORE-007/);
});
test('COMP-011 must retain the official next-season structural reform rule',()=>{
  const file='docs/rulebook/10-COMPETITIONS.md';
  const docs=changed(file,text=>text.replace('공식 대회 체계의 구조적 개편을 원칙적으로 차기 시즌부터','공식 대회 체계의 구조적 개편을 현재 시즌 즉시'));
  assert.match(check(docs),/BROKEN_PIN: COMP-011/);
});
test('COMP-011 may not omit the global transfer-window match ban for new independent events',()=>{
  const file='docs/rulebook/10-COMPETITIONS.md';
  const docs=changed(file,text=>text.replace('세계 공통 경기 금지 기간의 검증을 통과해야 한다','세계 공통 경기 금지 기간을 무시하고 진행할 수 있다'));
  assert.match(check(docs),/BROKEN_PIN: COMP-011/);
});


test('an independent authorized event cannot be reclassified as an official calendar event',()=>{
  const file='docs/rulebook/10-COMPETITIONS.md';
  const docs=changed(file,text=>text.replace('공식 대회로 편입·전환할 수 없다','사무국 공인만으로 공식 대회로 편입할 수 있다'));
  assert.match(check(docs),/BROKEN_PIN: COMP-018/);
});
test('obsolete 87C must not force all tied teams into tiebreak matches',()=>{
  const file='docs/rulebook/10-COMPETITIONS.md';
  const docs=changed(file,text=>text.replace('모든 동률에 별도 결정전을 일률적으로 강제하지 않으며','모든 동률에 별도 결정전을 일률적으로 강제하며'));
  assert.match(check(docs),/BROKEN_PIN: COMP-019/);
});
test('new academy protection cannot be issued to selected academy teams only',()=>{
  const file='docs/rulebook/10-COMPETITIONS.md';
  const docs=changed(file,text=>text.replace('일부 2군만 선택해 신규 발급할 수 없다','일부 2군만 선택해 신규 발급할 수 있다'));
  assert.match(check(docs),/BROKEN_PIN: COMP-020/);
});
test('lawful individual loss of protection cannot revoke unrelated team licenses as a group',()=>{
  const file='docs/rulebook/10-COMPETITIONS.md';
  const docs=changed(file,text=>text.replace('잔여 구단의 보호권을 일괄 박탈하는 규칙이 아니다','잔여 구단의 보호권도 일괄 박탈한다'));
  assert.match(check(docs),/BROKEN_PIN: COMP-020/);
});
test('protection license cannot expire during the yearly official season',()=>{
  const file='docs/rulebook/10-COMPETITIONS.md';
  const docs=changed(file,text=>text.replace('모든 보호 라이선스 상실의 효력은 연간 경쟁 시즌 종료 이후에만 발생','보호 라이선스 상실은 지역 컵 중간에도 즉시 발생'));
  assert.match(check(docs),/BROKEN_PIN: COMP-021/);
});
test('co-streaming and permanent free VOD cannot be turned into exclusive paid access',()=>{
  const file='docs/rulebook/60-BUSINESS.md';
  const docs=changed(file,text=>text.replace('모든 실제 경기의 다시보기(VOD)는 영구 무료 공개','모든 실제 경기의 다시보기(VOD)는 독점 유료 공개'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-015/);
});
test('elected player representatives cannot be replaced by appointed club agents',()=>{
  const file='docs/rulebook/70-GOVERNANCE.md';
  const docs=changed(file,text=>text.replace('구단별 현역 선수 대표 선출','구단장이 임명한 에이전트 대표'));
  assert.match(check(docs),/BROKEN_PIN: GOV-010/);
});
test('legitimate office review cannot restore withdrawn random violation and sanction events',()=>{
  const file='docs/rulebook/70-GOVERNANCE.md';
  const docs=changed(file,text=>text.replace('불법 출전·무작위 규정 위반을 일부러 발생시키는 사후 징계·이의신청 게임 엔진 승인으로 확대하지 않는다','위반을 무작위로 발생시켜 사후 징계·이의신청 게임 엔진을 운영한다'));
  assert.match(check(docs),/BROKEN_PIN: GOV-011/);
});
test('office leaders cannot ignore disclosure and recusal for conflicts',()=>{
  const file='docs/rulebook/70-GOVERNANCE.md';
  const docs=changed(file,text=>text.replace('공개하고 관련 심의·결정에서 회피','비밀로 하고 스스로 심의·결정'));
  assert.match(check(docs),/BROKEN_PIN: GOV-012/);
});


test('approved payment simplification pays valid funded obligations automatically',()=>{
  const file='docs/rulebook/60-BUSINESS.md';
  const docs=changed(file,text=>text.replace('별도의 반복 조작 없이 기한 내 지급','담당자의 반복 수동 클릭이 있어야만 지급'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-004/);
});
test('unfunded obligations must remain actual outstanding debt',()=>{
  const file='docs/rulebook/60-BUSINESS.md';
  const docs=changed(file,text=>text.replace('자금이 부족하여 이행할 수 없는 확정 의무는 미지급 채무로 기록','자금이 부족한 채무는 무상으로 소멸'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-004/);
});
test('random AI non-payment cannot create artificial defaults',()=>{
  const file='docs/rulebook/60-BUSINESS.md';
  const docs=changed(file,text=>text.replace('AI의 임의 지연이나 시스템상의 지급 누락으로 연체를 생성하지 않는다','AI가 임의로 지급을 건너뛰어 연체를 생성할 수 있다'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-004/);
});
test('subsequent nonpayment cannot automatically revoke executed transfers',()=>{
  const file='docs/rulebook/60-BUSINESS.md';
  const docs=changed(file,text=>text.replace('이미 완료된 이적·출전·경기 결과를 뒤늦은 미지급만으로 자동 소급 취소하지 않는다','뒤늦은 미지급이 있으면 과거 경기·이적을 자동 취소한다'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-004/);
});

test('routine delegation must never override legally reserved final decisions',()=>{
  const file='docs/rulebook/00-CORE.md';
  const docs=changed(file,text=>text.replace('법적 최종 서명·의료상 출전 부적격 판정·참가 자격 검증·선수 동의를 임의로 대체할 수 없다','시스템이 선수 동의와 계약 최종 서명권을 무시하고 즉시 확정한다'));
  assert.match(check(docs),/BROKEN_PIN: CORE-010/);
});
test('normal routine operations cannot erase real costs or world outcomes',()=>{
  const file='docs/rulebook/00-CORE.md';
  const docs=changed(file,text=>text.replace('실제로 발생한 활동·지급·비용·일정·계약 결과','비용과 지급을 발생하지 않은 것으로 취급한다'));
  assert.match(check(docs),/BROKEN_PIN: CORE-010/);
});

// Later direct user approval: regional windows prioritize mid-season international
// events but remain optional/local; transfers must not bypass legal contracts or registration.
test('regional mid-season windows cannot become mandatory on every international event',()=>{
  const file='docs/rulebook/30-TRANSFERS.md';
  const docs=changed(file,text=>text.replace('국제대회마다 의무적으로 개설하거나','국제대회마다 반드시 개설하며'));
  assert.match(check(docs),/BROKEN_PIN: TRANS-011/);
});
test('regional mid-season windows must remain subject to advance local publication',()=>{
  const file='docs/rulebook/30-TRANSFERS.md';
  const docs=changed(file,text=>text.replace('개장 여부, 횟수 및 시작·종료 시각을 사전에 공표','모든 지역이 같은 날짜에 자동 개장'));
  assert.match(check(docs),/BROKEN_PIN: TRANS-011/);
});
test('regional window cannot void the selling club contract rights',()=>{
  const file='docs/rulebook/30-TRANSFERS.md';
  const docs=changed(file,text=>text.replace('영입 지역의 개장만으로 원소속 구단의 계약상 권리','영입 지역 시장은 원소속 구단의 계약상 권리'));
  assert.match(check(docs),/BROKEN_PIN: TRANS-011/);
});
test('international roster locks must not disappear on mid-season transfer',()=>{
  const file='docs/rulebook/30-TRANSFERS.md';
  const docs=changed(file,text=>text.replace('진행 중인 국제대회의 확정 명단을 소급 변경','진행 중인 국제대회의 명단을 자유롭게 변경'));
  assert.match(check(docs),/BROKEN_PIN: TRANS-011/);
});

test('matrix chapter total must match the real number of clauses',()=>{
  const file='docs/rulebook-audit/CLAUSE_DECISION_MATRIX_2026_11_01.md';
  const docs=changed(file,text=>text.replace('### CORE — 10개 조항','### CORE — 9개 조항'));
  assert.match(check(docs),/MATRIX_CHAPTER_COUNT: CORE/);
});

// Audit coverage is a workflow gate, not a declaration that all source decisions are verified.
test('source-adjudication audit must stay available to rulebook readers',()=>{
  const file='docs/rulebook-audit/STEP1_APPROVAL_EFFECT_AUDIT_2026_11_01.md';
  const docs={...original};
  delete docs[file];
  assert.match(check(docs),/FILE_MISSING/);
});
test('approval-audit link cannot silently point to a nonexistent file',()=>{
  const file='docs/rulebook/README.md';
  const docs=changed(file,text=>text.replace('STEP1_APPROVAL_EFFECT_AUDIT_2026_11_01.md','missing-approval-audit.md'));
  assert.match(check(docs),/BROKEN_LOCAL_LINK/);
});

test('protected international events cannot disappear under a growth or low-audience policy',()=>{
  const file='docs/rulebook/10-COMPETITIONS.md';
  for(const [before,after] of [
    ['정체성과 행사 연속성은 영구 보장','정체성과 행사 연속성은 보장하지 않는다'],
    ['저흥행만을 이유로 자동 폐지할 수 없다','저흥행이면 자동 폐지한다'],
    ['영구 최대 개수가 아니다','영구 최대 개수다'],
    ['참가 방식·규모·세부 형식을 재편','참가 방식·규모·세부 형식은 고정'],
  ]){
    const docs=changed(file,text=>text.replace(before,after));
    assert.notEqual(docs[file],original[file]);
    assert.match(check(docs),/BROKEN_PIN: COMP-012/);
  }
});

test('save and UI migration requirements remain outside world law',()=>{
  const file='docs/implementation-spec/WORLD_ENGINE_AND_PRODUCT_ACCEPTANCE.md';
  for(const [before,after] of [
    ['마이그레이션','호환 삭제'],
    ['마지막 성공 스냅샷','모든 저장 제거'],
    ['슬롯 간 격리','슬롯 병합'],
    ['현실 시간 카운트다운','강제 실시간 타이머'],
    ['인수인계 기능','자동 인수인계 기능'],
    ['1·3·6·12개월','단일 월간 보고서'],
  ]){
    const docs=changed(file,text=>text.replace(before,after));
    assert.notEqual(docs[file],original[file]);
    assert.match(check(docs),/PRODUCT_REQUIREMENT/);
  }
});

test('Worlds final disqualification cannot invent a match, winner, or time',()=>{
  const file='docs/rulebook/20-CALENDAR.md';
  for(const [before,after] of [
    ['양 팀의 적법한 실격','양 팀의 자동 승계'],
    ['우승자·경기·경기 시각을 만들어내지 않고 결승 단계의 종료/판정 이력으로 피날레를 확인','가짜 경기와 우승자를 생성'],
    ['COMP-006의 무우승 판정','임의의 재결승'],
  ]){
    const docs=changed(file,text=>text.replace(before,after));
    assert.notEqual(docs[file],original[file]);
    assert.match(check(docs),/BROKEN_PIN: CAL-004/);
  }
});


test('world canon separates national-team competitions from the four club competitions',()=>{
  const result=validateRulebook(original);
  assert.deepEqual(result.errors,[]);
  assert.equal(result.chapterCount,9);
  assert(result.worldRuleCount>=116);
  const club='docs/rulebook/10-COMPETITIONS.md';
  const nation='docs/rulebook/15-NATIONAL-TEAMS.md';
  let docs=changed(nation,text=>text.replace('### NAT-002 ·','### NAT-001 ·'));
  assert.match(check(docs),/DUPLICATE_ID/);
  docs=changed(club,text=>text.replace('**구단 대회**는','**모든 세계 대회**는'));
  assert.notEqual(docs[club],original[club]);
});

test('world-layer addendum is required for every new canonical clause',()=>{
  const audit='docs/rulebook-audit/CANON_2026_11_08_ADDENDUM.md';
  const docs=changed(audit,text=>text.replace(/^\| NAT-010 \|.*\n/m,''));
  assert.match(check(docs),/SOURCE_AUDIT_MISSING|SOURCE_AUDIT_COUNT/);
});

test('UI requirements are separately preserved outside the world rule chapters',()=>{
  const result=validateRulebook(original);
  assert.equal(result.chapterCount,9);
  assert(result.ruleCount>result.worldRuleCount);
  assert.match(original['docs/rulebook/80-EXPERIENCE.md'],/세계관 정본 제외/);
  assert.match(original['docs/interface-spec/USER_EXPERIENCE_REQUIREMENTS.md'],/### UI-001/);
});
