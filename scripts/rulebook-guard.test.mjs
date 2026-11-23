import test from 'node:test';
import assert from 'node:assert/strict';
import {readDocuments,validateRulebook} from './rulebook-guard.mjs';
import {readFileSync} from 'node:fs';

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
test('travel incident withdrawal keeps real duration, adaptation and collision checks',()=>{
  const file='docs/rulebook/20-CALENDAR.md';
  for(const [before,after] of [
    ['실제 도시·국가 간 이동은 개최지와 경로·거리에 따른 정상 소요시간을 세계 시간에 반영한다','이동은 세계 시간을 소모하지 않는다'],
    ['이동에 따른 여독·피로와 시차 적응을 실제 선수 상태·현지 체류·회복과 함께 판단하고','이동과 시차는 선수 상태에 영향을 주지 않고'],
    ['경기·이동·휴식의 시간 충돌은 사전에 검증한다','일정의 시간 충돌을 확인하지 않는다']
  ]){
    const docs=changed(file,text=>text.replace(before,after));
    assert.notEqual(docs[file],original[file]);
    assert.match(check(docs),/BROKEN_PIN: CAL-006/);
  }
});
test('an independent match exception cannot override the market suspension',()=>{
  const file='docs/rulebook/20-CALENDAR.md';
  const docs=changed(file,text=>text.replace('의 실제 경기는 모두 금지한다','의 실제 경기는 모두 금지한다. 단, 독립 대회의 실제 경기는 허용한다'));
  assert.match(check(docs),/CONFLICTING_MARKET_EXCEPTION: CAL-003/);
  const denial=changed(file,text=>text.replace('의 실제 경기는 모두 금지한다','의 실제 경기는 모두 금지한다. 독립 대회의 실제 경기는 허용하지 않는다'));
  assert.doesNotMatch(check(denial),/CONFLICTING_MARKET_EXCEPTION/);
  for(const expression of ['허용할 수 있다고 보지 않는다','허용한다고 보지 않는다','불허용한다','불가능하다','가능하다고 보지 않는다']){
    const denied=changed(file,text=>text.replace('의 실제 경기는 모두 금지한다','의 실제 경기는 모두 금지한다. 독립 대회의 실제 경기는 '+expression));
    assert.notEqual(denied[file],original[file]);
    assert.doesNotMatch(check(denied),/CONFLICTING_MARKET_EXCEPTION/);
  }
  for(const expression of ['허용할 수 있다','가능하다']){
    const allowed=changed(file,text=>text.replace('의 실제 경기는 모두 금지한다','의 실제 경기는 모두 금지한다. 독립 대회의 실제 경기는 '+expression));
    assert.notEqual(allowed[file],original[file]);
    assert.match(check(allowed),/CONFLICTING_MARKET_EXCEPTION/);
  }
});
test('rulebook links to nonexistent files cannot silently pass',()=>{
  const file='docs/rulebook/README.md';
  const docs=changed(file,text=>text.replace('(00-CORE.md)','(missing-CORE.md)'));
  assert.match(check(docs),/BROKEN_LOCAL_LINK/);
});
test('Codex startup cannot silently drop the rulebook lookup',()=>{
  const docs=changed('AGENTS.md',text=>text.replace('## 게임 제작 단일 진입점','## optional old note'));
  assert.match(check(docs),/CODEX_ENTRY/);
});
test('immutable First Selection and draft policies cannot silently disappear',()=>{
  let docs=changed('docs/rulebook/50-MATCH.md',text=>text.replaceAll('First Selection','Old Selection'));
  assert.match(check(docs),/BROKEN_PIN: MATCH-003/);
  docs=changed('docs/rulebook/50-MATCH.md',text=>text.replaceAll('Fearless Draft','Optional Draft'));
  assert.match(check(docs),/BROKEN_PIN: MATCH-002/);
});
test('First Selection allocation and two-axis choices cannot be silently inverted',()=>{
  const file='docs/rulebook/50-MATCH.md';
  for(const [before,after] of [
    ['국내 더블 라운드로빈 경기에서는 홈팀','국내 더블 라운드로빈 경기에서는 원정팀'],
    ['국내 플레이오프에서는 상위 시드팀','국내 플레이오프에서는 하위 시드팀'],
    ['국제 녹아웃·브래킷에서는 적법하게 기록된 코인 토스 결과','국제 녹아웃·브래킷에서는 사전 무작위 추정'],
    ['둘째 세트 이후에는 직전 세트 패자','둘째 세트 이후에는 직전 세트 승자'],
    ['기존 배분 범주에 해당하지 않는 새로운 경기 형식이 생기면, 기존 First Selection 규칙을 훼손하지 않는 적법한 결정·자격 절차를 먼저 정하고 검증한다','새로운 경기 형식은 절차 없이 임의 배분한다'],
    ['진영(블루/레드) 또는 픽 순서(선픽/후픽) 중 한 축을 먼저 선택하고 상대가 남은 축을 선택','권리자가 두 축을 모두 선택']
  ]){
    const docs=changed(file,text=>text.replace(before,after));
    assert.notEqual(docs[file],original[file]);
    assert.match(check(docs),/BROKEN_PIN: MATCH-003/);
  }
});
test('captain withdrawal preserves actual tactical communication',()=>{
  const file='docs/rulebook/50-MATCH.md';
  for(const [before,after] of [
    ['독립 주장(captain) 직책·임면 제도·주장 전용 사기/관계/팀워크 보너스·주장 이벤트 시스템은 도입하지 않는다','독립 주장(captain) 직책과 보너스는 도입한다'],
    ['전술 지시, 경기의 실제 커뮤니케이션·주요 오더, 선수 성향·코칭·팀워크의 효과는 기존 시스템의 유효한 사건·상태 정보를 통하여 처리하며 주장 전용 보너스로 중복 계산하지 않는다','전술 지시와 실제 소통을 모두 없앤다'],
    ['전술 지시, 경기의 실제 커뮤니케이션·주요 오더, 선수 성향·코칭·팀워크의 효과는 기존 시스템의 유효한 사건·상태 정보를 통하여 처리하며 주장 전용 보너스로 중복 계산하지 않는다','전술과 소통에 주장 전용 보너스를 중복 계산한다']
  ]){
    const docs=changed(file,text=>text.replace(before,after));
    assert.notEqual(docs[file],original[file]);
    assert.match(check(docs),/BROKEN_PIN: MATCH-011/);
  }
});
test('scrim consent, confidentiality and real interruption history survive revision',()=>{
  const file='docs/rulebook/50-MATCH.md';
  for(const [before,after] of [
    ['실제 두 팀의 수락·유효 시간·선수 점유·연습 목적과 경기 로그','한 팀의 일방적 예약'],
    ['두 구단의 상호 동의 없는 전략/비공개 스크림 자료 공개는 불가하다','상대 동의 없이 스크림 전략을 공개한다'],
    ['정당한 중단이 발생한 경우에만 완료된 세트의 경기·시간·피로·성장·관측 이력을 보존하고','중단 시 완료된 세트 이력을 지우고'],
    ['미실시 세트를 임의 결과로 채우지 않으며 시리즈 상태를 중단 또는 미완료로 기록한다','미실시 세트를 가상 결과로 채운다'],
    ['합법적인 취소에는 실제 통보 시각과 계약·관계상의 유효한 취소 조건을 적용한다','합법적인 취소의 통보와 계약을 무시한다']
  ]){
    const docs=changed(file,text=>text.replace(before,after));
    assert.notEqual(docs[file],original[file]);
    assert.match(check(docs),/BROKEN_PIN: MATCH-005/);
  }
});
test('broadcast transition retains valid pre-existing contractual obligations',()=>{
  const file='docs/rulebook/60-BUSINESS.md';
  const before='기존 유효한 광고·계약상 책임은 사전 공표와 합법적인 전환 절차 없이 소급 소멸시키지 않는다';
  const docs=changed(file,text=>text.replace(before,'기존 유효한 광고·계약상 책임은 즉시 소급 소멸시킨다'));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/BROKEN_PIN: BIZ-015/);
});
test('remote scrims retain real scheduling without inventing latency or travel penalties',()=>{
  for(const [file,before,after,id] of [
    ['docs/rulebook/50-MATCH.md','지역 간 네트워크 핑/지연 차이를 게임 내 경기 페널티로 적용하지 않는다','지역 간 네트워크 핑/지연 차이를 경기 페널티로 적용한다','MATCH-006'],
    ['docs/rulebook/50-MATCH.md','원격 스크림 자체를 이유로 국가 간 실제 이동을 강제하지 않는다','원격 스크림 전에 반드시 해외 이동한다','MATCH-006'],
    ['docs/rulebook/50-MATCH.md','시차·팀 수락·선수 일정·회복·실제 이동 점유는 유지한다','시간대와 선수 일정을 무시한다','MATCH-006'],
    ['docs/rulebook/40-PLAYERS.md','국가별 핑 차이 보정은 없다','국가별 핑 차이를 경기 결과에 보정한다','PLAYER-003']
  ]){
    const docs=changed(file,text=>text.replace(before,after));
    assert.notEqual(docs[file],original[file]);
    assert.match(check(docs),new RegExp('BROKEN_PIN: '+id));
  }
});
test('ranked applied patch and tournament pinned patch remain distinct',()=>{
  const file='docs/rulebook/50-MATCH.md';
  for(const [before,after] of [
    ['패치의 예정안·확정·실제 적용은 구별한다','패치 발표와 실제 적용을 동일하게 취급한다'],
    ['통합 랭크도 즉시 해당 패치','통합 랭크는 별도의 지연된 패치'],
    ['해당 대회에 사전 지정된 패치 버전(pinned patch)','대회별 고정 없이 현재 글로벌 패치'],
    ['과거 경기·스크림 기록을 나중 패치로 소급 재계산하지 않는다','과거 경기·스크림 기록을 최신 패치로 재계산한다'],
    ['출전 허용일 도래만으로 진행 중인 공식 대회의 고정 패치·사전 확정 챔피언 풀을 변경하지 아니한다','출전 허용일이 오면 진행 중인 대회의 고정 풀을 자동 변경한다']
  ]){
    const docs=changed(file,text=>text.replace(before,after));
    assert.notEqual(docs[file],original[file]);
    assert.match(check(docs),/BROKEN_PIN: MATCH-007/);
  }
});
test('facility investment cannot discard construction time, actual use or opportunity cost',()=>{
  const file='docs/rulebook/60-BUSINESS.md';
  const before='시설 투자의 판단과 효과는 실제 사용·공사 기간·운영 및 유지비와 대안 비용을 함께 고려한다';
  for(const after of [
    '시설 투자의 효과는 실제 사용과 공사 기간을 무시한다',
    '시설 투자는 운영 및 유지비와 대안 비용을 고려하지 않는다',
    '시설 구매 즉시 무조건 경기 승률을 올린다'
  ]){
    const docs=changed(file,text=>text.replace(before,after));
    assert.notEqual(docs[file],original[file]);
    assert.match(check(docs),/BROKEN_PIN: BIZ-008/);
  }
});
test('personal activity settlement respects performance, claimant and payment state',()=>{
  const file='docs/rulebook/60-BUSINESS.md';
  for(const [before,after] of [
    ['개인 방송·행사·광고의 실제 이행에 따른 수익은 유효한 계약의 권리자에 귀속하고','개인 활동을 이행하지 않아도 구단에 전액 귀속하고'],
    ['현금 수령·미수 및 운영비를 구분하여 원장에 기록하며','미수 수익을 받은 현금으로 기록하며'],
    ['같은 거래를 선수와 구단에 중복 지급하지 않는다','같은 거래를 선수와 구단에 전액 중복 지급한다']
  ]){
    const docs=changed(file,text=>text.replace(before,after));
    assert.notEqual(docs[file],original[file]);
    assert.match(check(docs),/BROKEN_PIN: BIZ-006/);
  }
});
test('club ownership changes cannot automatically erase contracts, licenses or history',()=>{
  const file='docs/rulebook/60-BUSINESS.md';
  for(const [before,after] of [
    ['구단 인수·매각 시 기존 선수·스태프 계약, 참가권·라이선스와 조직·역사의 연속성은 각각 당시 유효한 조건·권한·효력 시각을 확인한다','구단 인수 시 기존 계약과 라이선스를 확인하지 않는다'],
    ['소유권 변경 사실만으로 이를 임의로 소멸하거나 새로 생성하지 않는다','소유권이 바뀌면 기존 계약과 역사를 자동으로 소멸시킨다']
  ]){
    const docs=changed(file,text=>text.replace(before,after));
    assert.notEqual(docs[file],original[file]);
    assert.match(check(docs),/BROKEN_PIN: BIZ-001/);
  }
});
test('rivalries require actual history and cannot force events or results',()=>{
  const file='docs/rulebook/60-BUSINESS.md';
  for(const [before,after] of [
    ['구단 간 라이벌 구도는 실제 상대 전적·결승·이적과 팬 역사 등에 근거하여 형성한다','실제 역사 없이 라이벌 관계를 자동 지정한다'],
    ['라이벌 관계를 이유로 실제 존재하지 않은 사건이나 경기 승패를 강제하지 않는다','라이벌 관계를 이유로 가상 사건과 경기 승패를 강제한다']
  ]){
    const docs=changed(file,text=>text.replace(before,after));
    assert.notEqual(docs[file],original[file]);
    assert.match(check(docs),/BROKEN_PIN: BIZ-007/);
  }
});
test('fan transfer reactions and sponsor trust retain their factual basis',()=>{
  const file='docs/rulebook/60-BUSINESS.md';
  for(const [before,after,id] of [
    ['선수 이적에 대한 팬 집단의 반응은 과거 공헌, 당시 실제 관계·사건과 새 선수단 선택 등 다양한 근거와 관점에 따라 달라질 수 있으며 이적만으로 단일한 고정 반응을 일률적으로 확정하지 않는다','선수 이적은 모든 팬에게 무조건 같은 반응을 만든다','BIZ-007'],
    ['후원 효과와 신뢰는 실제 계약 이행·브랜드 적합성 및 확인된 정당한 권리 침해 사례와 연관하여 판단한다','실제 계약 이행과 무관하게 후원 신뢰를 무조건 부여한다','BIZ-005']
  ]){
    const docs=changed(file,text=>text.replace(before,after));
    assert.notEqual(docs[file],original[file]);
    assert.match(check(docs),new RegExp('BROKEN_PIN: '+id));
  }
});
test('new regional leagues require actual capacity and cannot derive advantages from country ID',()=>{
  const file='docs/rulebook/10-COMPETITIONS.md';
  for(const [before,after] of [
    ['새로운 공식 지역리그의 창설·운영은 실제 선수 공급, 구단과 투자 재정, 시설·운영 여건 및 관할 사무국의 적법한 라이선스 심사에 근거한다','새 지역리그는 선수·구단·시설이나 라이선스 심사 없이 창설한다'],
    ['특정 국가나 식별자만으로 리그 창설·참가권 또는 선수의 능력상 이점을 자동 보장하지 않는다','특정 국가의 식별자만으로 리그와 능력상 이점을 자동 보장한다']
  ]){
    const docs=changed(file,text=>text.replace(before,after));
    assert.notEqual(docs[file],original[file]);
    assert.match(check(docs),/BROKEN_PIN: COMP-002/);
  }
});
test('amateur open-cup evidence is usable without fabricating matches or official status',()=>{
  const file='docs/rulebook/40-PLAYERS.md';
  for(const [before,after] of [
    ['실제 개최된 오픈컵·독립 대회의 관측 가능한 경기 기록은 당시 대회 지위와 합법적 접근 범위·표본·시점에 따라 스카우팅과 장기 경쟁 평가에 활용할 수 있다','실제로 열린 오픈컵 기록은 스카우팅과 무관하다'],
    ['배경 설정이나 치르지 않은 경기는 실제 관측 표본으로 바꾸지 않는다','배경 설정과 미실시 경기는 실제 관측 표본으로 바꾼다'],
    ['공식 지역사무국·정식 3부·공식 국제대회 시드가 자동 창설되지 않는다','공식 지역사무국·정식 3부·공식 국제대회 시드가 자동 창설된다']
  ]){
    const docs=changed(file,text=>text.replace(before,after));
    assert.notEqual(docs[file],original[file]);
    assert.match(check(docs),/BROKEN_PIN: PLAYER-009/);
  }
});
test('long-term league comparison cannot ignore real seasons, sample and talent flows',()=>{
  const file='docs/rulebook/40-PLAYERS.md';
  const before='국가·리그 간 장기 비교는 여러 실제 시즌의 상대 수준과 관측 표본 차이, 인재 교류 및 경제·육성 흐름을 함께 고려한다';
  for(const after of [
    '국가·리그 간 비교는 한 경기 결과만으로 확정한다',
    '상대 수준·표본 차이와 인재 교류를 무시하고 고정 국가 능력으로 비교한다'
  ]){
    const docs=changed(file,text=>text.replace(before,after));
    assert.notEqual(docs[file],original[file]);
    assert.match(check(docs),/BROKEN_PIN: PLAYER-012/);
  }
});
test('emergency replacement requires explicit tournament permission',()=>{
  const docs=changed('docs/rulebook/50-MATCH.md',text=>text.replace('대회가 해당 예외를 명시적으로 허용한 경우에만 의료 확인과 등록 심사','대회의 명시적 허용 없이 등록'));
  assert.match(check(docs),/BROKEN_PIN: MATCH-004/);
});
test('accommodation cannot impose daily manual assignment',()=>{
  const docs=changed('docs/rulebook/40-PLAYERS.md',text=>text.replace('매일 숙소를 수동 배치하도록 강제하거나 방송·기술 장비 관리 업무를 다시 도입하지 않는다','매일 숙소를 수동 배치한다'));
  assert.match(check(docs),/BROKEN_PIN: PLAYER-007/);
});
test('rank correction removes tiers while preserving the approved RP and MMR transitions',()=>{
  const file='docs/rulebook/40-PLAYERS.md';
  for(const [before,after] of [
    ['별도의 티어 승급·강등 체계는 두지 않는다','별도의 티어 승급·강등 체계를 둔다'],
    ['시즌 시작 때 공개 RP는 소프트 리셋하고','시즌 시작 때 공개 RP는 소프트 리셋할 수 있고'],
    ['내부 비공개 MMR은 일부 연속성을 가진다','내부 비공개 MMR은 매 시즌 전부 삭제한다']
  ]){
    const docs=changed(file,text=>text.replace(before,after));
    assert.notEqual(docs[file],original[file]);
    assert.match(check(docs),/BROKEN_PIN: PLAYER-004/);
  }
});
test('rank dodge withdrawal preserves truthful interruption handling',()=>{
  const file='docs/rulebook/40-PLAYERS.md';
  for(const [before,after] of [
    ['이를 항복으로 오인하거나 미실시 경기를 정상 완료로 날조하지 않는다','미실시 경기를 정상 완료로 기록한다'],
    ['실제 중단은 닷지 벌점 시스템을 신설하는 근거가 아니다','실제 중단에 닷지 벌점 시스템을 신설한다'],
    ['실제 중단을 이유로 발생하지 않은 패배나 근거 없는 별도 강제 징벌을 만들어 부과하지 않는다','실제 중단에 가상의 패배와 별도 강제 징벌을 부과한다']
  ]){
    const docs=changed(file,text=>text.replace(before,after));
    assert.notEqual(docs[file],original[file]);
    assert.match(check(docs),/BROKEN_PIN: PLAYER-005/);
  }
});
test('rank identity correction preserves owner identification without mandating real-name publication',()=>{
  const file='docs/rulebook/40-PLAYERS.md';
  for(const [before,after] of [
    ['닉네임 변경·부계정 생성은 허용하지 않는다','닉네임 변경·부계정 생성을 허용한다'],
    ['공개 계정의 소유자를 식별할 수 있으며','공개 계정은 익명으로만 제공하며'],
    ['별도의 실명 필드 생성·실명과 닉네임 병행 공개는 요구하지 않는다','별도의 실명 필드 생성·실명과 닉네임 병행 공개를 요구한다'],
    ['비공개 MMR·실제 능력·잠재력·의료·다른 구단 조사 자료는 그대로 보호한다','비공개 MMR과 의료 정보는 모두 공개한다']
  ]){
    const docs=changed(file,text=>text.replace(before,after));
    assert.notEqual(docs[file],original[file]);
    assert.match(check(docs),/BROKEN_PIN: PLAYER-006/);
  }
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
test('candidate version and changelog cannot silently diverge',()=>{
  const docs=changed('docs/rulebook/README.md',text=>text.replace(/\*\*규정집 후보 버전:\*\* v\d+\.\d+\.\d+/, '**규정집 후보 버전:** v9.9.9'));
  assert.notEqual(docs['docs/rulebook/README.md'],original['docs/rulebook/README.md']);
  assert.match(check(docs),/CHANGELOG: no entry/);
});
test('README does not restore the superseded event cancellation path',()=>{
  const file='docs/rulebook/README.md';
  const docs=changed(file,text=>text.replace(
    '2026-11-14 후속 결정에 따라 시즌 확정 전에 개최 가능성을 검증하고 매년 실제 개최',
    '2026-11-12의 개최 불능 시 회차 취소를 현행 규칙으로 적용'
  ));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/README_EVENT_FINALITY/);
});
test('approved youth compensation and club taxonomy cannot silently regress',()=>{
  const file='docs/rulebook/60-BUSINESS.md';
  let docs=changed(file,text=>text.replace('지급 비율·금액·분할식·자격·발효 시점·재원 및 기금 조성','지급 비율은 확정'));
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
test('development compensation claims remain distinct from estimated amounts',()=>{
  const file='docs/rulebook/60-BUSINESS.md';
  let docs=changed(file,text=>text.replace('확정된 육성 보상 채무와 미확정 추정','확정되지 않은 보상도 전부 지급'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-011/);
  docs=changed(file,text=>text.replace('단순 추정은 확정 채권이나 지급된 현금이 아니다','추정 자체가 확정 현금이다'));
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
test('population law forbids false equalization and QA coverage remains external',()=>{
  const file='docs/rulebook/40-PLAYERS.md';
  let docs=changed(file,text=>text.replace('선수 능력 분포를 맞추기 위한 일괄 강등이나 근거 없는 난이도 보정을 적용하지 않는다','선수 능력을 일괄 강등한다'));
  assert.match(check(docs),/BROKEN_PIN: PLAYER-012/);
  docs=changed(file,text=>text.replace('비공개 실제 능력·잠재력은 해당 정보를 적법하게 관측할 권한이 없는 주체에게 공개하지','모든 주체에게 공개한다'));
  assert.match(check(docs),/BROKEN_PIN: PLAYER-012/);
  const product='docs/implementation-spec/WORLD_ENGINE_AND_PRODUCT_ACCEPTANCE.md';
  docs=changed(product,text=>text.replace('다지역·다시즌 표본','한 시즌만'));
  assert.match(check(docs),/PRODUCT_REQUIREMENT/);
});
test('training compensation comparisons are implementation QA, not game-world laws',()=>{
  const file='docs/implementation-spec/WORLD_ENGINE_AND_PRODUCT_ACCEPTANCE.md';
  let docs=changed(file,text=>text.replace('육성 구단 보상 보고','육성 보상 미표시'));
  assert.match(check(docs),/PRODUCT_REQUIREMENT/);
  docs=changed(file,text=>text.replace('실제 재정 원장과 계약에 근거해','임의의 재정 정보로'));
  assert.match(check(docs),/PRODUCT_REQUIREMENT/);
  docs=changed(file,text=>text.replace('입력 차이가 있다는 사실만으로 다른 결과를 강제하거나 임의 현금을 생성하지 않는다','입력 차이만으로 무작위 현금 생성'));
  assert.match(check(docs),/PRODUCT_REQUIREMENT/);
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
  docs=changed(file,text=>text.replace('실제 선수 성장·지도·선수 공급·지속 투자·입증된 육성 활동','임의의 비공개 기준'));
  assert.match(check(docs),/BROKEN_PIN: BIZ-011/);
  docs=changed(file,text=>text.replace('유효한 규정에 없는 금액·자격이나 배분식을 임의로 확정하지 않는다','임의의 지원 비율을 확정한다'));
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
test('closed-window obligations and insufficient funds stay separate from transfer and credit',()=>{
  for(const [file,from,to,pin] of [
    ['docs/rulebook/30-TRANSFERS.md',
      '이미 성립한 금전·이행 책임을 기록하면서 완전이전·공식 등록은 법적으로 가능한 시점까지 별도로 보류',
      '닫힌 창의 금전·이행 책임을 삭제하고 완전이전과 공식 등록을 자동 확정','TRANS-008'],
    ['docs/rulebook/60-BUSINESS.md',
      '지급 가능 범위를 넘어서는 무근거 자동 당좌대월·제3자 대납을 허용하지 않으며',
      '지급 가능 범위를 넘어서는 무근거 자동 당좌대월과 제3자 대납을 허용하며','BIZ-004']
  ]){
    const docs=changed(file,text=>text.replace(from,to));
    assert.notEqual(docs[file],original[file]);
    assert.match(check(docs),new RegExp('BROKEN_PIN: '+pin));
  }
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
test('active world law protects completed tournament editions and one-sided administrative results',()=>{
  const file='docs/rulebook/10-COMPETITIONS.md';
  for(const [from,to,id] of [
    ['행정승으로 우승을 판정','행정 판정 없이 가상 우승을 부여','COMP-006'],
    ['사전에 확정한 회차를 실제 운영','확정된 대회를 운영하지 않아도 된다','COMP-010'],
    ['실제 적격 참가팀·선수단·대진·예비 경기 슬롯','적격 선수 없이 대진 확정','COMP-010'],
    ['토너먼트 결승에서도 그 행정승이 우승팀을 확정','결승의 적법한 행정승은 인정하지 않는다','COMP-010'],
    ['행정승은 실제 경기를 실시한 기록이 아니며','행정승을 실제 경기 기록으로 만든다','COMP-010'],
    ['정체성·역사·매년 해당 회차의 실제 운영은 보장','공식 국제대회는 개최하지 않아도 된다','COMP-012']
  ]){
    const docs=changed(file,body=>body.replace(from,to));
    assert.notEqual(docs[file],original[file], 'source phrase required: '+from);
    assert.match(check(docs),new RegExp('BROKEN_PIN: '+id));
  }
});

test('approved Worlds boundary ties use real head-to-head, not matches for every tie',()=>{
  const file='docs/rulebook/10-COMPETITIONS.md';
  let docs=changed(file,text=>text.replace('두 팀의 실제 맞대결이 유효하게 승자승을 가를 수 있으면 그 결과를 우선한다','두 팀이면 무조건 BO1을 다시 치른다'));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/BROKEN_PIN: COMP-019/);
  docs=changed(file,text=>text.replace('모든 동률에 별도 결정전을 일률적으로 강제하지 않으며','모든 동률에 별도 결정전을 일률적으로 강제하며'));
  assert.notEqual(docs[file],original[file]);
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
  const docs=changed(file,text=>text.replace('다만 **TRANS-005에 해당하는 프로 라이선스 미보유 팀 계약 선수는 적법한 바이아웃 조항을 전제로 한 자유 접촉·협상 예외**','다만 모든 조기 접촉은 반드시 원팀 동의'));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/BROKEN_PIN: TRANS-003/);
});
test('non-license buyout exception cannot be denied while retaining keywords',()=>{
  const file='docs/rulebook/30-TRANSFERS.md';
  const target='TRANS-005에 해당하는 프로 라이선스 미보유 팀 계약 선수는 적법한 바이아웃 조항을 전제로 한 자유 접촉·협상 예외';
  assert.ok(original[file].includes(target));
  const docs=changed(file,text=>text.replace(target,'TRANS-005에 해당하는 프로 라이선스 미보유 팀 계약 선수도 반드시 원소속 구단의 동의를 받아야 한다'));
  assert.notEqual(docs[file],original[file]);
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
  const docs=changed('docs/rulebook/20-CALENDAR.md',text=>text.replace('다른 국제대회의 확정된 경기까지 연쇄적으로 순연하지 않는다','다른 국제대회의 확정된 경기까지 자동으로 순연한다'));
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
test('external audit summary remains consistent with its declared source-depth tags',()=>{
  const file='docs/rulebook-audit/CLAUSE_DECISION_MATRIX_2026_11_01.md';
  const docs=changed(file,text=>text.replace(/(\| CORE-001 \|[^\n]*\| )이슈·기타( \|)/,'$1댓글 직접 링크$2'));
  assert.match(check(docs),/MATRIX_DEPTH_SUMMARY/);
});
test('adjudication summary cannot overcount reviewed clauses',()=>{
  const file='docs/rulebook-audit/CLAUSE_DECISION_MATRIX_2026_11_01.md';
  const docs=changed(file,text=>text.replace('| 관련 원문 부분대조 | 113 |','| 관련 원문 부분대조 | 112 |'));
  assert.match(check(docs),/MATRIX_SUMMARY: 관련 원문 부분대조/);
});


test('separate balance hotfix system remains abolished, with scheduled patches and match history protected',()=>{
  const file='docs/rulebook/50-MATCH.md';
  for(const [from,to] of [
    ['정기 패치 사이에 별도로 시행하는 밸런스 핫픽스 제도를 두지 않는다','정기 패치 사이에도 밸런스 핫픽스를 발동한다'],
    ['별도의 즉시 밸런스 변경, 긴급 패치 판정, 당일 경기 종료를 조건으로 한 핫픽스 예약·시행 사건을 생성하지 아니한다','세계 공식 경기 종료 후 임시 핫픽스를 자동 시행한다'],
    ['다음 적법하게 예정·확정·적용되는 정기 글로벌 패치','발견 당일 새 임시 글로벌 패치'],
    ['진행 중 공식 대회의 지정 패치를 변경하지 않는다','진행 중 대회의 지정 패치를 중간 변경한다'],
    ['이미 진행한 경기·세트·밴픽·통계·선수 성장 기록은 새 패치로 소급 재계산하지 않는다','기존 경기와 성장 수치를 새 패치로 다시 계산한다']
  ]){
    const docs=changed(file,text=>text.replace(from,to));
    assert.notEqual(docs[file],original[file], 'mutation source must exist: '+from);
    assert.match(check(docs),/BROKEN_PIN: MATCH-008/);
  }
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
  const docs=changed(file,text=>text.replace('실제 위반 사실이 확인되지 않은 출전 부적격·징계·이의신청 사건을 임의로 생성하지 아니한다','위반을 무작위로 발생시켜 사후 징계·이의신청 게임 엔진을 운영한다'));
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
test('implementation guide cannot silently point to a nonexistent canonical file',()=>{
  const file='docs/AI_RULEBOOK_GUIDE.md';
  const docs=changed(file,text=>text.replace('rulebook/README.md','missing-world-rulebook.md'));
  assert.match(check(docs),/BROKEN_LOCAL_LINK/);
});

test('protected international events cannot disappear under a growth or low-audience policy',()=>{
  const file='docs/rulebook/10-COMPETITIONS.md';
  for(const [before,after] of [
    ['매년 해당 회차의 실제 운영은 보장','회차 개최는 매년 임의로 취소 가능'],
    ['정체성·역사·매년 해당 회차의 실제 운영은 보장','공식 국제대회는 매년 반드시 개최할 필요가 없다'],
    ['영구 최대 개수가 아니다','영구 최대 개수다'],
    ['차기 회차의 참가 방식·규모·세부 형식','당시 확정된 모든 회차를 소급 변경한다'],
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
    ['인수인계 기능','직원 업무 인계 절차'],
    ['1·3·6·12개월','단일 월간 보고서'],
  ]){
    const docs=changed(file,text=>text.replaceAll(before,after));
    assert.notEqual(docs[file],original[file]);
    assert.match(check(docs),/PRODUCT_REQUIREMENT/);
  }
});

test('Worlds finals retain actual winner or one-sided administrative champion and dated season finale',()=>{
  const file='docs/rulebook/20-CALENDAR.md';
  for(const [from,to] of [
    ['결승 단계는 구단 공식 대회 시즌의 피날레','Worlds 결승 단계를 시즌 밖으로 이동한다'],
    ['실제 경기 승자 또는 한쪽의 적법한 기권·실격','근거 없이 우승을 추첨으로 결정한다'],
    ['행정승을 얻은 상대 팀을 우승팀으로 확정','행정승을 얻어도 우승팀이 없다'],
    ['실시하지 않은 경기·세트·선수 출전 기록은 기록하지 않는다','실시하지 않은 경기를 선수 출전으로 합산한다'],
    ['기본 공식 국제대회 전체·Worlds 경계 결정전의 최악 경기 수','국제대회 일정 사전 검증을 생략한다']
  ]){
    const docs=changed(file,body=>body.replace(from,to));
    assert.notEqual(docs[file],original[file], 'source phrase required: '+from);
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

test('nation-team statutes cannot contain duplicate or out-of-order numbered paragraphs',()=>{
  const file='docs/rulebook/15-NATIONAL-TEAMS.md';
  const docs=changed(file,text=>text.replace('③ 선수가 적법한 국가대표 공식 경기에','② 선수가 적법한 국가대표 공식 경기에'));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/ARTICLE_PARAGRAPH_ORDER: NAT-004/);
});

test('first-nationality lock, one-time switch and official tournament roster cannot silently change',()=>{
  const file='docs/rulebook/15-NATIONAL-TEAMS.md';
  let docs=changed(file,text=>text.replace('마지막 국가대표 공식 출전 이후 2년 이상 경과','마지막 공식 출전 직후'));
  assert.match(check(docs),/BROKEN_PIN: NAT-004/);
  docs=changed(file,text=>text.replace('경력 중 한 번','무제한 변경'));
  assert.match(check(docs),/BROKEN_PIN: NAT-004/);
  for(const [from,to] of [
    ['이 조의 귀속은 개별 대표팀이 아니라','귀속은 각 대표팀 단위로 정한다'],
    ['등록, 후보 명단 포함, 벤치 대기 또는 연습 경기만으로는 국가 귀속이 확정되지 아니한다','등록만으로 국가 귀속이 확정된다'],
    ['한 선수는 동일한 시각에 둘 이상의 대표팀의 실제 경기에 출전할 수 없다','한 선수는 동일 시각 두 대표팀 경기에 출전할 수 있다'],
    ['이동·등록이나 대회별 명단 변경도 당시 유효한 참가 규정·마감·선수 상태에 따른다','이동과 등록은 유효 규정과 무관하게 언제나 허용된다']
  ]){
    docs=changed(file,text=>text.replace(from,to));
    assert.notEqual(docs[file],original[file]);
    assert.match(check(docs),/BROKEN_PIN: NAT-004/);
  }
  docs=changed(file,text=>text.replace('주전 5명과 교체 선수 2명, 합계 7명','주전 4명과 교체 3명'));
  assert.match(check(docs),/BROKEN_PIN: NAT-011/);
});

test('initial board voting, manager tenure and emergency rules are protected',()=>{
  const file='docs/rulebook/70-GOVERNANCE.md';
  let docs=changed(file,text=>text.replace('중앙 측 7석·최초 주요 지역 대표 각 1석씩 6석','중앙 측 6석·지역 7석'));
  assert.match(check(docs),/BROKEN_PIN: GOV-004/);
  docs=changed(file,text=>text.replace('최초 표준 임기는 **3년**','최초 표준 임기는 **1년**'));
  assert.match(check(docs),/BROKEN_PIN: GOV-007/);
  docs=changed(file,text=>text.replace('최소 범위와 기간의 임시 조치','무기한 제한 없는 개편'));
  assert.match(check(docs),/BROKEN_PIN: GOV-008/);
  docs=changed(file,text=>text.replace('기존 구단도 새 리그의 참가 자격·라이선스 심사를 다시 거쳐야','기존 구단은 자동 참가한다'));
  assert.match(check(docs),/BROKEN_PIN: GOV-008/);
  docs=changed(file,text=>text.replace('완료 경기·우승 역사를 자동 삭제하거나 소급 무효화하는 권한이 아니다','완료 경기·우승 역사를 자동 삭제할 수 있다'));
  assert.match(check(docs),/BROKEN_PIN: GOV-008/);
});

test('first promotion playoff, initial bylaws and temporary license vacancies are protected',()=>{
  let docs=changed('docs/rulebook/10-COMPETITIONS.md',text=>text.replace('기본 승강 결정전은 **상위 부의 적격 강등 대상 팀과 하위 부의 적격 승격 대상 팀 간 BO5**','기본 승강 결정전은 순위 자동 승강'));
  assert.match(check(docs),/BROKEN_PIN: COMP-016/);
  docs=changed('docs/rulebook/10-COMPETITIONS.md',text=>text.replace('조건부 임시 참가권','영구 자동 참가권'));
  assert.match(check(docs),/BROKEN_PIN: COMP-021/);
  docs=changed('docs/rulebook/00-CORE.md',text=>text.replace('사전에 설계되고 상호 정합성을 검증한 초기 세계 상태','AI가 임의로 추첨한 불안정한 초기 세계 상태'));
  assert.match(check(docs),/BROKEN_PIN: CORE-012/);
});

test('initial world preset contract cannot be silently replaced with random regulations',()=>{
  let docs=changed('docs/GAME_IMPLEMENTATION_ENTRYPOINT.md',text=>text.replace(
    'AI가 새 세계마다 규정·숫자·권한을 임의로 뽑지 않는다',
    'AI가 새 세계마다 규정·숫자·권한을 무작위로 만든다'
  ));
  assert.match(check(docs),/INITIAL_PRESET_CONTRACT/);
  docs=changed('docs/rulebook/00-CORE.md',text=>text.replace(
    '적법하게 제정·공표·발효시켜야 한다',
    '후보만 있어도 자동으로 시행한다'
  ));
  assert.match(check(docs),/BROKEN_PIN: CORE-012/);
});

test('approved three-year contract term is not confused with negotiation duration',()=>{
  const docs=changed('docs/rulebook/30-TRANSFERS.md',text=>text.replace(
    '약정 유효기간은 최대 3년',
    '협상 기간은 최대 3년'
  ));
  assert.match(check(docs),/BROKEN_PIN: TRANS-002/);
});

test('buyout discussion is not an automatic transfer without the appropriate club consent',()=>{
  const file='docs/rulebook/30-TRANSFERS.md';
  let docs=changed(file,text=>text.replace(
    '협상 개시권형**은 자유 접촉·협상 근거일 뿐 원소속 구단의 최종 이적 합의를 대체하지 못하며',
    '협상 개시권형**도 원소속 구단의 최종 이적 합의가 필요 없으며'
  ));
  assert.match(check(docs),/BROKEN_PIN: TRANS-005/);
  docs=changed(file,text=>text.replace(
    '구단 거부 불가형**은 명시된 금액',
    '구단 협상 개시형**은 명시된 금액'
  ));
  assert.match(check(docs),/BROKEN_PIN: TRANS-007/);
});

test('Worlds cutline finite-match guarantee does not falsely guarantee calendar feasibility',()=>{
  let docs=changed('docs/GAME_IMPLEMENTATION_ENTRYPOINT.md',text=>text.replace(
    '실제 경기 수의 수학적 유한 상한과 일정 마감은 별개',
    '세계시장 개장 전 언제나 모든 Worlds 경기와 결승이 자동 완료된다'
  ));
  assert.notEqual(docs['docs/GAME_IMPLEMENTATION_ENTRYPOINT.md'],original['docs/GAME_IMPLEMENTATION_ENTRYPOINT.md']);
  assert.match(check(docs),/OPEN_OUTCOME_ACCEPTANCE/);
  docs=changed('docs/rulebook/10-COMPETITIONS.md',text=>text.replace(
    '언제나 세계시장 개장 전에 종료할 수 있다는 시간 보장은 아니다',
    '시장 개장 전 종료를 무조건 보장한다'
  ));
  assert.notEqual(docs['docs/rulebook/10-COMPETITIONS.md'],original['docs/rulebook/10-COMPETITIONS.md']);
  assert.match(check(docs),/BROKEN_PIN: COMP-019/);
});
test('user-approved short national roster and conflict-free substitute cannot silently regress',()=>{
  const nat='docs/rulebook/15-NATIONAL-TEAMS.md';
  let docs=changed(nat,text=>text.replace(
    '5명 또는 6명만 확보한 경우에도 등록을 허용',
    '7명을 모두 확보해야만 등록을 허용'
  ));
  assert.match(check(docs),/BROKEN_PIN: NAT-011/);

  docs=changed(nat,text=>text.replace(
    '마감 시점의 적격 등록 선수가 5명 미만이면',
    '마감 시점의 적격 등록 선수가 4명 미만이면'
  ));
  assert.match(check(docs),/BROKEN_PIN: NAT-011/);

  const gov='docs/rulebook/70-GOVERNANCE.md';
  docs=changed(gov,text=>text.replace(
    '같은 의석군의 이해충돌 없는 적격한 임시 대체 이사',
    '다른 의석군의 임시 대체 이사'
  ));
  assert.match(check(docs),/BROKEN_PIN: GOV-012/);

  docs=changed(gov,text=>text.replace(
    '한 의석에 한 표만 행사',
    '한 의석에 두 표씩 행사'
  ));
  assert.match(check(docs),/BROKEN_PIN: GOV-012/);

  docs=changed(gov,text=>text.replace(
    '대체 선임으로 재적 의석·의결권 수를 늘리거나',
    '대체 선임으로 재적 의석·의결권 수를 늘릴 수 있고'
  ));
  assert.match(check(docs),/BROKEN_PIN: GOV-004/);
});

test('tiebreak award inclusion requires a published explicit scope',()=>{
  const file='docs/rulebook/10-COMPETITIONS.md';
  for(const [before,after] of [
    ['그 결정전을 포함한다고 명시한 경우에만','결정전 포함 여부와 관계없이'],
    ['범위가 없는 상태에서 소급 가산하거나 정규 단계의 수상자·통계를 변경하지 않는다','범위가 없어도 소급 가산한다']
  ]){
    const docs=changed(file,text=>text.replace(before,after));
    assert.notEqual(docs[file],original[file]);
    assert.match(check(docs),/BROKEN_PIN: COMP-022/);
  }
});

test('independent clubs retain authority and rostered national teams use actual people',()=>{
  const cases=[
    ['docs/rulebook/60-BUSINESS.md','각자 독립 경영진·감독과 실제 독자적 인사·전술·계약·예산 결정권을 유지해야 한다','그룹이 인사와 전술을 직접 결정한다','BIZ-010'],
    ['docs/rulebook/60-BUSINESS.md','같은 현금과 채무를 독립 구단과 모구단의 원장에 동시에 생성하거나 중복 지급하지 않는다','같은 현금과 채무를 각 원장에 중복 생성한다','BIZ-010'],
    ['docs/rulebook/60-BUSINESS.md','명목상 별도 경영진이나 동일 명칭 변경만으로 통과시키지 않는다','명목상 경영진만 별도이면 통과시킨다','BIZ-010'],
    ['docs/rulebook/15-NATIONAL-TEAMS.md','부족한 교체 선수를 가상으로 생성하거나 미등록 선수를 출전 가능한 것으로 간주하지 아니한다','부족한 교체 선수를 가상으로 생성한다','NAT-011'],
    ['docs/rulebook/15-NATIONAL-TEAMS.md','참가 불능 사유나 행정 결과를 실제로 진행된 경기의 기록으로 대체하지 않는다','행정 결과를 실제 경기 기록으로 대체한다','NAT-011']
  ];
  for(const [file,before,after,id] of cases){
    const docs=changed(file,text=>text.replace(before,after));
    assert.notEqual(docs[file],original[file]);
    assert.match(check(docs),new RegExp('BROKEN_PIN: '+id));
  }
});

test('local eligibility preserves service boundaries and player choice',()=>{
  const file='docs/rulebook/30-TRANSFERS.md';
  const cases=[
    ['FA 무소속 기간은 기존 근속을 보존하되 추가 누적하지 않는다','FA 무소속 기간에도 근속을 누적한다'],
    ['타지역 임대는 원래 지역의 누적을 정지·보존하되 임대 지역에 새로운 근속을 부여하지 않으며','타지역 임대는 임대 지역에 새 근속을 부여하며'],
    ['타지역의 일반 계약 등록은 구지역 취득 근속을 초기화한다','타지역 일반 계약 등록도 구지역 취득 근속을 이어간다'],
    ['비출신지역 로컬 전환은 **자동 발생하지 않는다**','비출신지역 로컬 전환은 자동 발생한다'],
    ['시즌 중 자격을 취득해도 그 시즌의 활성 로컬을 즉시 바꿀 수 없다','시즌 중 자격을 취득하면 활성 로컬을 즉시 바꾼다']
  ];
  for(const [before,after] of cases){
    const docs=changed(file,text=>text.replace(before,after));
    assert.notEqual(docs[file],original[file]);
    assert.match(check(docs),/BROKEN_PIN: TRANS-014/);
  }
});

test('partial-season tenure cannot be credited multiple times in one season',()=>{
  const file='docs/rulebook/30-TRANSFERS.md';
  let docs=changed(file,text=>text.replace(
    '한 시즌을 둘 이상의 근속 시즌으로 중복 계산하지 않는다',
    '한 시즌에 같은 지역의 세 구단에 근속하면 세 시즌으로 계산한다'
  ));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/BROKEN_PIN: TRANS-014/);

  const guide='docs/GAME_IMPLEMENTATION_ENTRYPOINT.md';
  docs=changed(guide,text=>text.replace(
    '해당 시즌 최대 한 번',
    '해당 시즌 여러 번'
  ));
  assert.notEqual(docs[guide],original[guide]);
  assert.match(check(docs),/DEPTH_TENURE_SCHEDULE_ACCEPTANCE/);

  docs=changed(guide,text=>text.replace(
    '132→240시리즈',
    '132→132시리즈'
  ));
  assert.notEqual(docs[guide],original[guide]);
  assert.match(check(docs),/DEPTH_TENURE_SCHEDULE_ACCEPTANCE/);
});

test('cross-chapter reference to a nonexistent article is rejected',()=>{
  const file='docs/rulebook/30-TRANSFERS.md';
  const docs=changed(file,text=>text.replace('CORE-002·GOV-008','CORE-999·GOV-008'));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/UNKNOWN_CLAUSE_REFERENCE: .*CORE-999/);
});

test('initial-only registration transfer and staff limits cannot become immutable',()=>{
  const transfer='docs/rulebook/30-TRANSFERS.md';
  let docs=changed(transfer,text=>text.replace(
    '당시 유효한 등록 정원 및 비로컬 상한',
    '최초 세계의 정원과 비로컬 상한은 모든 미래 시즌에도 절대 불변'
  ));
  assert.notEqual(docs[transfer],original[transfer]);
  assert.match(check(docs),/BROKEN_PIN: TRANS-013/);

  docs=changed(transfer,text=>text.replace(
    '그 절차로 변경되지 않은 시즌에는 2회 상한을 그대로 적용한다',
    '사무국의 허가가 없더라도 모든 시즌에 이적횟수를 제한 없이 변경할 수 있다'
  ));
  assert.notEqual(docs[transfer],original[transfer]);
  assert.match(check(docs),/BROKEN_PIN: TRANS-012/);

  const staff='docs/rulebook/60-BUSINESS.md';
  docs=changed(staff,text=>text.replace(
    '영구 불변이라는 이유로 정당한 개정을 차단하거나 미발효된 정원 확대를 미리 적용하지 않는다',
    '모든 시즌에 같은 고용 상한이 영구 고정된다'
  ));
  assert.notEqual(docs[staff],original[staff]);
  assert.match(check(docs),/BROKEN_PIN: BIZ-016/);

  docs=changed(staff,text=>text.replace(
    '당시 유효한 코치 상한이 7명인 동안',
    '모든 미래 시즌에 영구히'
  ));
  assert.notEqual(docs[staff],original[staff]);
  assert.match(check(docs),/BROKEN_PIN: BIZ-016/);
});

test('initial ceilings acceptance prevents premature and retroactive changes',()=>{
  const file='docs/GAME_IMPLEMENTATION_ENTRYPOINT.md';
  let docs=changed(file,text=>text.replace(
    '그 시즌에 실제 발효한 비로컬·명단 상한',
    '새로운 제안 단계에서 현재 시즌에도 즉시 바뀐 비로컬·명단 상한'
  ));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/INITIAL_CEILING_ACCEPTANCE/);

  docs=changed(file,text=>text.replace(
    '초기 최대 2회',
    '초기 무제한 이적'
  ));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/INITIAL_CEILING_ACCEPTANCE/);
});

test('source addendum must match current article counts and superseding limits',()=>{
  const file='docs/rulebook-audit/CANON_2026_11_08_ADDENDUM.md';
  let docs=changed(file,text=>text.replace(
    '9개 세계 장 124조 + 별도 UI 10개 = 134개 ID',
    '9개 세계 장 125조 + 별도 UI 10개 = 135개 ID'
  ));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/SOURCE_CURRENT_COUNT/);

  docs=changed(file,text=>text.replace(
    '현재 최초 세계 코치 7명·분석가 4명·스카우트 6명',
    '현재 최초 세계 코치 9명·분석가 4명·스카우트 6명'
  ));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/ADDENDUM_CURRENT_POLICY: BIZ-016/);

  docs=changed(file,text=>text.replace(
    '적격 5~6인 단축 등록 허용',
    '적격 7인만 의무 등록'
  ));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/ADDENDUM_CURRENT_POLICY: NAT-011/);
});



test('global trading market does not erase valid seasonal regional windows',()=>{
  const file='docs/rulebook/30-TRANSFERS.md';
  let docs=changed(file,text=>text.replace(
    '별도로 적법하게 개장한 시즌 중 지역별 이적창',
    '시즌 중에는 전 세계 계약 선수 이적이 언제나 금지'
  ));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/BROKEN_PIN: TRANS-001/);

  docs=changed(file,text=>text.replace(
    '원소속 계약·국제대회 등록 잠금·CAL-003',
    '영입 지역 창 개장만으로 원소속 계약을 무효화하여 CAL-003'
  ));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/BROKEN_PIN: TRANS-001/);
});

test('canonical world law cannot be reduced to UI display text or internal IDs',()=>{
  const file='docs/rulebook/10-COMPETITIONS.md';
  let docs=changed(file,text=>text.replace(
    '과거 회차의 당시 명칭과 대회 정체성·역사는 보존',
    '과거 대회의 이름과 정체성은 소급 삭제'
  ));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/BROKEN_PIN: COMP-015/);

  docs=changed(file,text=>text.replace(
    '현재 유효하지 않은 과거 지역 구분',
    '구형 내부 ID'
  ));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/CANON_TECHNICAL_LEAK/);

  const guide='docs/GAME_IMPLEMENTATION_ENTRYPOINT.md';
  docs=changed(guide,text=>text.replace(
    '구형 표시명을 현재 공표문·일정·뉴스 제목에 혼입하지 않는다',
    '구형 표시명도 최신 대회명과 동등하게 혼용한다'
  ));
  assert.notEqual(docs[guide],original[guide]);
  assert.match(check(docs),/TOURNAMENT_ID_PRESENTATION_ACCEPTANCE/);
});

test('an amateur independent club cannot take a second direct-management slot',()=>{
  const file='docs/rulebook/60-BUSINESS.md';
  let docs=changed(file,text=>text.replace(
    '프로 라이선스 보유 여부와 관계없이 독립된 구단 조직 모두에 적용',
    '프로 라이선스 보유 구단에만 적용'
  ));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/BROKEN_PIN: BIZ-010/);

  docs=changed(file,text=>text.replace(
    '동일 그룹이 동시에 직접 경영할 수 있는 독립 구단은 한 곳뿐',
    '동일 그룹이 여러 독립 구단을 동시에 직접 경영할 수 있다'
  ));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/BROKEN_PIN: BIZ-010/);

  docs=changed(file,text=>text.replace(
    '공식 하부 대회에 출전하더라도 별도 독립 구단이 아니므로',
    '공식 하부 대회에 출전하면 무조건 별도 독립 구단이 되어'
  ));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/BROKEN_PIN: BIZ-010/);

  docs=changed(file,text=>text.replace(
    '이름만 Academy인 실질적 독립 구단',
    '모든 Academy 명칭을 붙인 독립 구단'
  ));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/BROKEN_PIN: BIZ-010/);
});

test('same group management transfer must be atomic and independent of pro labels',()=>{
  const file='docs/rulebook/60-BUSINESS.md';
  for(const [from,to] of [
    ['같은 유효 시점에 일체로 처리','두 구단의 직접 경영을 겹치는 시기에 순차 처리'],
    ['선수·계약·재정·경기 결과·비공개 정보·기금이 자동 공유되지 않는다',
      '선수·계약·재정·경기 결과·비공개 정보·기금이 소유 그룹에 자동 공유된다']
  ]){
    const altered=changed(file,text=>text.replace(from,to));
    assert.notEqual(altered[file],original[file]);
    assert.match(check(altered),/BROKEN_PIN: BIZ-010/);
  }
  const duplicated=changed(file,text=>text.replace(
    '그룹의 재산을 각 구단에 중복 복제하는 것',
    '그룹의 재산을 각 구단에 모두 별도로 제공하는 것'
  ));
  assert.notEqual(duplicated[file],original[file]);
  assert.match(check(duplicated),/BROKEN_PIN: BIZ-014/);
  let docs=changed(file,text=>text.replace(
    '시즌 종료 절차와 차기 시즌 효력',
    '시즌 언제든 즉시 두 구단 경영 허용'
  ));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/BROKEN_PIN: BIZ-010/);

  docs=changed(file,text=>text.replace(
    '다구단 지배·직접 경영 제한은 이 같은 고정 종류가 아니라 BIZ-010의 실제 독립 구단 조직 여부에 따른다',
    '아마추어 구단에는 다구단 직접 경영 제한이 미적용'
  ));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/BROKEN_PIN: BIZ-012/);

  const guide='docs/GAME_IMPLEMENTATION_ENTRYPOINT.md';
  docs=changed(guide,text=>text.replace(
    '아마추어라는 이유로 두 번째 직접 경영 자동 허용 금지',
    '아마추어 운영이면 별도 직접 경영 허용'
  ));
  assert.notEqual(docs[guide],original[guide]);
  assert.match(check(docs),/INDEPENDENT_CLUB_OWNERSHIP_ACCEPTANCE/);
});

test('linked approval audits are part of the rulebook local-link fixture',()=>{
  for(const path of [
    'docs/rulebook-audit/STEP1_I02_OWNERSHIP_PENDING_2026_11_01.md',
    'docs/rulebook-audit/RULEBOOK_FINALIZATION_GATE_2026_11_08.md',
  ]){
    assert.equal(typeof original[path],'string',path);
  }
  const docs=changed('docs/rulebook/CHANGELOG.md',text=>
    text.replace('../rulebook-audit/STEP1_I02_OWNERSHIP_PENDING_2026_11_01.md','../rulebook-audit/FAKE_I02_APPROVAL.md'));
  assert.match(check(docs),/BROKEN_LOCAL_LINK/);
});

test('medical insurance is contractual, not unconditional injury reimbursement',()=>{
  const file='docs/rulebook/60-BUSINESS.md';
  let docs=changed(file,text=>text.replace(
    '유효한 보험 계약을 선택적으로 체결할 수 있다',
    '모든 구단은 의무보험에 자동 가입한다'
  ));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/BROKEN_PIN: BIZ-004/);

  docs=changed(file,text=>text.replace(
    '의료비 전액 자동 보전·보험금 즉시 지급 또는 보편적인 의무보험 가입',
    '의료비와 부상 치료비는 모두 보험으로 자동 전액 보전'
  ));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/BROKEN_PIN: BIZ-004/);
});

test('historically approved spectator and reorderable-tab settings preserve world state',()=>{
  const ui='docs/interface-spec/USER_EXPERIENCE_REQUIREMENTS.md';
  let docs=changed(ui,text=>text.replace(
    '같은 실제 경기의 단일 확정 결과와 난수·세트 기록',
    '다른 속도에서 새 경기 난수와 결과를 다시 시뮬레이션'
  ));
  assert.notEqual(docs[ui],original[ui]);
  assert.match(check(docs),/BROKEN_PIN: UI-007/);

  docs=changed(ui,text=>text.replace(
    '상단 탭의 전체 순서',
    '고정된 변경 불가능한 탭 순서'
  ));
  assert.notEqual(docs[ui],original[ui]);
  assert.match(check(docs),/BROKEN_PIN: UI-001/);

  const contract='docs/implementation-spec/WORLD_ENGINE_AND_PRODUCT_ACCEPTANCE.md';
  docs=changed(contract,text=>text.replace(
    '표시 속도/시각효과',
    '표시 속도/랜덤 결과 변경'
  ));
  assert.notEqual(docs[contract],original[contract]);
  assert.match(check(docs),/HISTORIC_CHOICE_ACCEPTANCE/);
});

test('historic venue, media and facility approvals stay in actual world law',()=>{
  const venue='docs/rulebook/10-COMPETITIONS.md';
  let docs=changed(venue,text=>text.replace(
    '일률적인 중립 개최 의무를 만들지 않는다',
    '모든 공식 대회를 반드시 중립 장소에서 개최한다'
  ));
  assert.notEqual(docs[venue],original[venue]);
  assert.match(check(docs),/BROKEN_PIN: COMP-018/);

  const biz='docs/rulebook/60-BUSINESS.md';
  docs=changed(biz,text=>text.replace(
    '그 리그에 적법하게 공표된 분배 규정',
    '소유 구단의 자동 중계 수익 지급 보장'
  ));
  assert.notEqual(docs[biz],original[biz]);
  assert.match(check(docs),/BROKEN_PIN: BIZ-015/);

  docs=changed(biz,text=>text.replace(
    '실제 사용·용량·노후화·보수 및 유지비',
    '사용하지 않은 가상 시설의 일률적 자동 투자'
  ));
  assert.notEqual(docs[biz],original[biz]);
  assert.match(check(docs),/BROKEN_PIN: BIZ-008/);

  docs=changed(biz,text=>text.replace(
    '구단 프런트가 선수 개인 방송 일정을 일상적으로 조율·예약',
    '구단은 선수의 동의 없이 모든 개인 방송 계약을 자동 체결'
  ));
  assert.notEqual(docs[biz],original[biz]);
  assert.match(check(docs),/BROKEN_PIN: BIZ-006/);
});

test('approved weekly timeline and season report are not lost in compact UI spec',()=>{
  const ui='docs/interface-spec/USER_EXPERIENCE_REQUIREMENTS.md';
  let docs=changed(ui,text=>text.replace(
    '주간 타임라인은 실제 공식 경기·스크림·이동·휴식·시차',
    '주간 타임라인은 가상 경기 시각만 표시'
  ));
  assert.notEqual(docs[ui],original[ui]);
  assert.match(check(docs),/BROKEN_PIN: UI-001/);

  docs=changed(ui,text=>text.replace(
    '시즌 종료 보고서',
    '시즌 종료 기록은 불필요하다'
  ));
  assert.notEqual(docs[ui],original[ui]);
  assert.match(check(docs),/BROKEN_PIN: UI-007/);
});

test('M16C personality and relationship narratives must show observed uncertainty',()=>{
  const file='docs/interface-spec/USER_EXPERIENCE_REQUIREMENTS.md';
  let docs=changed(file,text=>text.replace(
    '당시 근거·표본·관측 시점과 이후 확인된 변화',
    '현재까지 알려진 사실과 과거 미관측 사실을 무조건 동일하게 보이게 한다'
  ));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/BROKEN_PIN: UI-006/);

  docs=changed(file,text=>text.replace(
    '숨은 정확 성향·능력·잠재력',
    '숨은 정확 성향·능력·잠재력을 누구에게나 공개'
  ));
  assert.notEqual(docs[file],original[file]);
  // The extra rule must not be inferred from a coarse substring pin alone.
  assert.match(check(docs),/PRIVATE_INFO_EXPOSURE_UI: UI-006/);
});

test('M26C cannot become omniscient infinite counter-strategy',()=>{
  const file='docs/rulebook/50-MATCH.md';
  const docs=changed(file,text=>text.replace(
    '상대의 비공개 의도나 미래 선택을 정답으로 열람하는 무한 역예측',
    '상대의 비공개 의도와 미래 선택을 정답으로 상시 열람'
  ));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/BROKEN_PIN: MATCH-009/);
});

test('M30C/M31C historical team culture and observer-specific reputation survive',()=>{
  const file='docs/rulebook/60-BUSINESS.md';
  let docs=changed(file,text=>text.replace(
    '감독 교체만으로 구단 문화를 일괄 초기화하거나 육성형·우승형 고정 유형 보너스를 부여하지 않는다',
    '감독 교체 즉시 모든 구단 문화를 리셋한다'
  ));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/BROKEN_PIN: BIZ-012/);

  docs=changed(file,text=>text.replace(
    '팬·구단·시장·언론의 평판',
    '구단 모두에게 똑같이 공개되는 숨은 능력 지표'
  ));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/BROKEN_PIN: BIZ-007/);

  const ui='docs/interface-spec/USER_EXPERIENCE_REQUIREMENTS.md';
  docs=changed(ui,text=>text.replace(
    '모든 원인을 한 감독이나 전술에 확정 귀속하거나',
    '모든 승패 원인을 하나의 감독에게 확정 귀속하고'
  ));
  assert.notEqual(docs[ui],original[ui]);
  assert.match(check(docs),/BROKEN_PIN: UI-007/);
});

test('M18C people cannot know their own hidden future ability omnisciently',()=>{
  const file='docs/rulebook/40-PLAYERS.md';
  const docs=changed(file,text=>text.replace(
    '인물 자신도 스스로의 숨은 실제 능력·미래 성장치를 자동으로 정확히 알지 못하며',
    '인물은 스스로의 미래 성장치를 항상 정확히 안다'
  ));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/BROKEN_PIN: PLAYER-014/);
});

test('M33-M36 cannot impose automatic champion transfer or instant position conversion',()=>{
  const file='docs/rulebook/40-PLAYERS.md';
  let docs=changed(file,text=>text.replace(
    '유사 챔피언 숙련의 전이는 실제 기술 구조·교전 방식·역할',
    '모든 챔피언 숙련은 동일한 비율로 자동 전이'
  ));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/BROKEN_PIN: PLAYER-001/);

  docs=changed(file,text=>text.replace(
    '전향 선언만으로 새 역할의 완전한 숙련을 즉시 부여하지 않는다',
    '포지션 전향 선언 즉시 새 역할의 완전한 숙련을 자동 부여한다'
  ));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/BROKEN_PIN: PLAYER-001/);
});

test('the policy-pin source cannot shadow a clause with duplicate JS object keys',()=>{
  const script=readFileSync(new URL('./rulebook-guard.mjs',import.meta.url),'utf8');
  const ids=[...script.matchAll(/^  '([A-Z]+-\d{3})':\[/gm)].map(x=>x[1]);
  const dupe=ids.filter((id,index)=>ids.indexOf(id)!==index);
  assert.deepEqual(dupe,[],'duplicate object keys shadow earlier policy regression checks');
});

test('R01D after later #234 approval permits eligible lower-division move, not same-tier bypass',()=>{
  const file='docs/rulebook/10-COMPETITIONS.md';
  let docs=changed(file,text=>text.replace(
    '적격한 실제 하위 부로 행정적으로 이동하거나',
    '다른 동급 2부로 임의 이동하거나'
  ));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/BROKEN_PIN: COMP-004/);

  docs=changed(file,text=>text.replace(
    '해당 하위 부의 실재 여부·등록 자격·수용 정원',
    '가상 하부리그에 선수·구단을 자동 편성'
  ));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/BROKEN_PIN: COMP-004/);
});


test('cross-domain counterexample specification and paired execution ledger remain aligned',()=>{
  const spec=readFileSync(new URL('../docs/rulebook-audit/STEP3_CROSS_DOMAIN_COUNTEREXAMPLES_2026_11_10.md',import.meta.url),'utf8');
  const register=readFileSync(new URL('../docs/rulebook-audit/STEP3_COUNTEREXAMPLE_EXECUTION_REGISTER_2026_11_11.md',import.meta.url),'utf8');
  const ids=text=>[...text.matchAll(/^\| (C\d{2}) \|/gm)].map(match=>match[1]);
  const a=ids(spec);
  const b=ids(register);
  assert(a.length>=40,'approved baseline of 40 scenario families including canceled tournaments and bilateral-DQ rejection must not silently disappear');
  const expected=Array.from({length:a.length},(_,i)=>'C'+String(i+1).padStart(2,'0'));
  assert.deepEqual(a,expected,'specification IDs must remain distinct and consecutive');
  assert.deepEqual(b,expected,'paired acceptance ledger IDs must exactly match the specification');
  const cases=register.split('\n').filter(line=>/^\| C\d{2} \|/.test(line));
  assert.equal(cases.length,expected.length);
  const stage=readFileSync(new URL('../docs/rulebook-audit/CANON_COMPLETION_STAGE_EXECUTION_2026_11_10.md',import.meta.url),'utf8');
  const stageRow=stage.split('\n').find(line=>line.startsWith('| **3** |'));
  const checkSummary=row=>{
    const counts=row?.match(/대장 (\d+)쌍 \(P0 (\d+)·P1 (\d+)\)/);
    assert(counts,'current stage 3 must expose the total and priority counts');
    const priorities=cases.map(line=>line.split('|')[2].trim());
    assert.deepEqual(counts.slice(1).map(Number),[cases.length,priorities.filter(p=>p==='P0').length,priorities.filter(p=>p==='P1').length]);
  };
  checkSummary(stageRow);
  assert.throws(()=>checkSummary(stageRow.replace(/대장 \d+쌍/,'대장 0쌍')),'stale totals must fail');
  for(const row of cases){
    const cells=row.split('|').slice(1,-1).map(s=>s.trim());
    assert.equal(cells.length,7,'each row should have ID, priority, domain, positive, negative, oracle, status');
    assert.match(cells[1],/^P[01]$/);
    for(const index of [2,3,4,5]) assert(cells[index].length>4,'test cases need domain, normal/negative conditions and evidence oracle');
    assert.equal(['NOT_RUN','BLOCKED_FIXTURE','FAILED','PASS','PARTIAL_PASS'].includes(cells[6].replaceAll('`','')),true);
  }
});


test('coach FA opens alongside the 28-day player market and protects live employment',()=>{
  const file='docs/rulebook/20-CALENDAR.md';
  let docs=changed(file,text=>text.replace(
    '같은 매년 12월 첫째 화요일 00:00 UTC',
    'World Championship 결승 다음 날 00:00 UTC'
  ));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/BROKEN_PIN: CAL-008/);

  docs=changed(file,text=>text.replace('동일한 정확히 28일 기간','별도의 7일 코치 FA 기간'));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/BROKEN_PIN: CAL-008/);

  docs=changed(file,text=>text.replace(
    '유효한 기존 코치 고용 계약의 만료·해지·무소속화나 자동 재계약',
    '기존 모든 코치의 고용 계약 자동 종료'
  ));
  assert.notEqual(docs[file],original[file]);
  assert.match(check(docs),/BROKEN_PIN: CAL-008/);
});

test('Worlds cutline guarantees every entrant a real BO1 and isolates scoring',()=>{
  const file='docs/rulebook/10-COMPETITIONS.md';
  for(const [from,to] of [
    ['모든 팀에 최소 한 번의 실제 BO1 출전 기회를 보장','상위 포트 팀은 출전 없이 바로 진출 가능'],
    ['부전승만으로 진출·상위 시드 그룹 자격이 확정되는 대진은 금지','부전승도 곧바로 진출 확정'],
    ['정확히 `q`개의','모든 n<2q 동률은 한 경기만 수행'],
    ['`max(n-q,q) ≤ n-1`','결정전을 무제한 반복한다'],
    ['리그 페이즈의 승수·상대 일정 강도·세트 득실·상대 세트 득실·세트 승수·상대전적·정규 순위 산정 원장에 합산하거나 재계산하지 않는다','리그 페이즈의 승수와 득실에 누적한다'],
    ['그 지표를 재사용하여 근거 없는 순위 차이를 만들지 않는다','동일한 지표를 다시 사용해 가상 시드를 만든다'],
    ['대진·부전승의 배정에만','추첨으로 경기 승자와 진출팀 확정에']
  ]){
    const docs=changed(file,text=>text.replace(from,to));
    assert.notEqual(docs[file],original[file], 'mutation target must exist: '+from);
    assert.match(check(docs),/BROKEN_PIN: COMP-019/);
  }
});
test('all-appearance bounded bracket constructive simulation enumerates n and q up to 24 teams',()=>{
  // Pure bracket QA model, not the Rust/legacy match engine.
  for(let n=2;n<=24;n++) for(let q=1;q<n;q++){
    const isWinnerAdvances=n>=2*q;
    const groups=isWinnerAdvances?q:n-q;
    const sizes=Array(groups).fill(2);
    for(let extra=n-2*groups,i=0;extra>0;extra--,i++)sizes[i%groups]++;
    assert.equal(sizes.reduce((a,b)=>a+b,0),n);
    for(const useSecondWinner of [false,true]){
      let nextId=0;
      let matchCount=0;
      const appearances=new Set();
      const qualified=new Set();
      const excluded=new Set();
      for(const size of sizes){
        let active=Array.from({length:size},()=>nextId++);
        while(active.length>1){
          const following=[];
          for(let i=0;i+1<active.length;i+=2){
            const a=active[i],b=active[i+1];
            appearances.add(a);
            appearances.add(b);
            matchCount++;
            const winner=useSecondWinner?b:a,loser=useSecondWinner?a:b;
            if(isWinnerAdvances){
              excluded.add(loser);
              following.push(winner);
            }
            else {
              qualified.add(winner);
              following.push(loser);
            }
          }
          if(active.length%2) following.push(active[active.length-1]); // bye is not a played match
          active=following;
        }
        if(isWinnerAdvances) qualified.add(active[0]);
        else excluded.add(active[0]);
      }
      assert.equal(appearances.size,n,'every tied club must actually play');
      assert.equal(qualified.size,q,'only the cutline q slots are settled');
      assert.equal(excluded.size,n-q);
      assert.equal(matchCount,Math.max(n-q,q));
      assert(matchCount<=n-1);
    }
  }
});

test('Nov 12 approved conflict resolutions P01-P10 stay enforceable across world laws',()=>{
  for(const [file,from,to,pin] of [
    ['docs/rulebook/10-COMPETITIONS.md','참가 보류 후 다음 시즌 처리','보류된 2군을 자동 해체한다','COMP-004'],
    ['docs/rulebook/10-COMPETITIONS.md','매년 해당 회차의 실제 운영은 보장','기본 일곱 대회를 편의상 취소한다','COMP-012'],
    ['docs/rulebook/10-COMPETITIONS.md','승인된 원시 시드 보호·대진 균형','높은 원시 시드는 실제 경기 없이 진출한다','COMP-019'],
    ['docs/rulebook/10-COMPETITIONS.md','리그 페이즈 세부 순위는 기존 공동순위로 남기고','결정전 패배 순서로 정규 순위를 확정한다','COMP-019'],
    ['docs/rulebook/10-COMPETITIONS.md','지급 판정 보류','계약상 확정된 상금도 임의로 지급을 유예한다','COMP-019'],
    ['docs/rulebook/10-COMPETITIONS.md','사전 편성 가능성 심사','시장 시작 후에도 결정전을 무제한 생성한다','COMP-019'],
    ['docs/rulebook/10-COMPETITIONS.md','정규 누적 통계로 산정하지 않는다','결정전 세트도 정규 MVP 누적 통계로 자동 합산한다','COMP-022'],
    ['docs/rulebook/15-NATIONAL-TEAMS.md','실제 개최되는 주요 국가대표 국제대회를 적어도 하나 확보한다','국대 대회 일년 내내 개최하지 않아도 된다','NAT-011'],
    ['docs/rulebook/20-CALENDAR.md','World Championship 결승 단계 종료 이전','World Championship 결승 단계 종료 이후','CAL-004'],
    ['docs/rulebook/30-TRANSFERS.md','화요일 00:00:00 UTC를 계약 종료의 배타적 시각','월요일 23:59:00에 계약 종료한다','TRANS-002'],
    ['docs/rulebook/30-TRANSFERS.md','새 구단으로의 완전이전은 자동 성립하지 않는다','임대 의무매입이면 이적창과 무관하게 자동 이적','TRANS-008'],
    ['docs/rulebook/30-TRANSFERS.md','임대를 무기한 자동 연장하지 않는다','임대는 영구 자동 연장된다','TRANS-012'],
    ['docs/rulebook/60-BUSINESS.md','공통 소유자의 이해충돌 회피 기준','같은 대회에서는 공통 소유자의 이해충돌 검사를 생략한다','BIZ-010']
  ]){
    const docs=changed(file,body=>body.replace(from,to));
    assert.notEqual(docs[file],original[file], 'missing mutation source: '+pin+' '+from);
    assert.match(check(docs),new RegExp('BROKEN_PIN: '+pin));
  }
});

test('Worlds alias remains English and never reverts to Korean transliteration in current world law',()=>{
  const path='docs/rulebook/10-COMPETITIONS.md';
  const originalForm='World Championship(Worlds)';
  const docs=changed(path,body=>body.replace(originalForm,'World Championship(월즈)'));
  assert.notEqual(docs[path],original[path], 'Worlds official shorthand must exist');
  const report=check(docs);
  assert.match(report,/WORLDS_DISPLAY_NAME|BROKEN_PIN: COMP-005/);
});

test('Worlds cutline actual unilateral forfeit is not a synthetic BO1 or bilateral disqualification',()=>{
  const file='docs/rulebook/10-COMPETITIONS.md';
  for(const [from,to] of [
    ['실제 일방 기권의 좁은 예외','다자 동시 기권 허용'],
    ['실제로 적법하게 기권하거나 단독 실격','무작위로 생성한 양팀 실격'],
    ['실제 BO1 출전 횟수·세트/선수 스탯은 0건','가상 선수 성적은 실경기로 기록'],
    ['상대의 실제 기권까지 강제로 실경기 개최했다는 가상 기록','실제 기권한 팀이 있어도 가상의 경기 통계를 만든다']
  ]){
    const docs=changed(file,body=>body.replace(from,to));
    assert.notEqual(docs[file],original[file],'missing mutation phrase: '+from);
    assert.match(check(docs),/BROKEN_PIN: COMP-019/);
  }
});
