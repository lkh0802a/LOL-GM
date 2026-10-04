> Documentation review 2026-10-03: [navigation](README.md), [active priorities and validation](DEVELOPMENT.md). Latest explicit user direction and later confirmed decisions supersede dated instructions; historical evidence is retained.

# LOL GM Item / Rune Data

## Canonical starting source

LOL GM starts its item and rune ecosystem from the same pinned LoL 26.19 / Riot Data Dragon 16.19.1 mirror used by the champion baseline.

- Source commit: `1cf34d485c572a9894c223efd3d66c1e5ad7f22f`
- Map: Summoner's Rift (`11`)
- Embedded purchasable item records: **254**
- Embedded selectable runes: **62**
- Rune styles: **5**
- Runtime source: `src/artifact/system-source.js`

The embedded source is immutable baseline data. Long saves evolve from it through LOL GM patch records; they do not query a live external service.

## Item contract

Every Summoner's Rift item record in the pinned source keeps its Riot ID, Korean name/description, source price, tags, raw stats, recipe inputs and upgrade targets. Runtime derives gameplay-facing fields without replacing source provenance.

Items are classified into starter, component, boots, final, consumable and special records. These choices are engine-owned rather than player-facing management decisions. The simulation selects legal final items/boots from the complete catalog, assigns an appropriate starter, then resolves the actual component recipe before completing the target item. Component effects are active while held. Price and effect patches alter champion performance and therefore draft priority/meta value rather than changing display text only.

Champion-specific or hidden records remain in the complete source catalog but are not exposed as general shop choices.

## Rune contract

All 62 runes remain attached to their original style and slot. The engine automatically resolves a legal page from the complete active pool; the player does not manually manage rune pages:

- one primary style: one rune from each of slots 0–3
- one different secondary style: two runes from two distinct non-keystone slots

Rune effects feed combat and champion meta evaluation through the same system-effect layer as items, so rune patches can move champion tiers indirectly. Removing a rune may not empty a style slot; long-save lifecycle rules preserve a viable rune tree.

## Patch lifecycle

Patch notes may buff/nerf item price or gameplay effects, buff/nerf rune effects, introduce new stable-ID items/runes, or deactivate/remove existing choices. Item removal is guarded so class build pools remain viable; rune removal is guarded so every required style slot remains selectable.

Historical patch reconstruction starts from the pinned baseline and reapplies retained patch notes, so old match replays do not silently use current item/rune state.

## Validation

`scripts/validate-system-snapshot.mjs` hard-fails if the pinned source drifts from 254 items, 62 runes or five complete rune styles. Smoke tests additionally require source consumption, recipe purchase timing, legal six-rune pages, item/rune creation/removal, combat integration and patch-history reconstruction.

## Item legality review — current limit (2026-10-03)

Do not claim all real item restrictions are implemented. `selectItemBuild` avoids
multiple boots, and purchase execution caps inventory at six using atomic recipe
combination. These guarantees do not establish all unique-item/group restrictions.
The dated append-only writer finding was corrected in task 8.2.1 (PR #172):
`commitItemCraftBatch` now validates actual recipe/cost/ingredients, final duplicates,
boots/champion conditions, cash and atomic six-slot combination, debits gold and
invalidates inventory effects. `systemEffects` still sums inventory effects;
reviewed exclusive-group metadata and complete conditional effect adjudication
remain missing. Selection alone is not proof of all restrictions. Original dated
findings and correction evidence remain in DEVELOPMENT.

Next bounded acceptance must check duplicate final items, mutually exclusive
groups, legal repeated components/consumables, missing ingredients, six-slot
combines, starter/quest transformation, champion-specific boots, affordability
and sale/refund behavior actually supported by the engine. Do not ban all repeated
components to emulate unique final items. Acquire patch-specific documented
restrictions before adding group mappings; unknown mappings remain explicit.
Item shopping stays engine-owned; this review does not add player micromanagement.
Static mechanics are distinct from professional-only match calibration described
in [CHAMPION_DATA](CHAMPION_DATA.md#competition-only-calibration).

## Team counter-item and world-rule continuation

User direction: team utility is coordinated, not five independent maximum-score
builds. Healing reduction and applied armor reduction need eligible applicators,
coverage/uptime, patch-specific stacking, opponent sustain/resistances, damage type
and opportunity cost. Personal armor penetration is not team armor reduction.
The current independent `selectItemBuild` and summed `systemEffects` do not prove
this team-level coordination exists. Acquire reviewed mechanics before assigning
coefficients/exclusive groups; add real consumers in fight evaluation and AI.

Minions, jungle monsters, lane waves, camps, towers and neutral objectives must
have rules consumed by the match engine and writable by balance patches where
applicable. `csGold` and several objective spawn/buff rules already have consumers;
current CS/XP approximations, jungle cadence and hardcoded objective rewards are
not a complete camp/wave model. Review spawn/respawn, rewards, health/resistance,
clear/arrival cost, availability, vision, waves and conversion separately.
Documented rules must reach actual income, levels, purchases, pressure and macro
decisions; do not label aggregate camp/CS proxies as exact monster simulation.


## 실제 구매 위치 — 8.2.2 조사 상태

구매 장부 교정은 실제 상점 위치 판정 완료가 아니다. `addGold`와 별도 퀘스트 와드 writer에는 기지/귀환/복귀 상태 확인이 없으며, 실제 재현 결과와 수집 제한은 DEVELOPMENT의 8.2.2에 기록했다. 고정 오른 설명은 전장 비소모품 제작을 허용하지만 일반 선수와 오른이 같은 위치 없는 writer를 사용하는 현재 상태는 합법 예외 구현 증거가 아니다. 고정 귀환/이동/제작 조건의 원자료를 검토하기 전 시간을 발명하지 않는다. 사망 중 구매를 일괄 금지하는 새 정책도 추가하지 않는다.


8.3.3의 `item_stat` 노트는 runtime `itemDefs.stats`의 기존 AD/HP/armor/MR만 변경한다. `itemDefs.source`는 pinned provider/version/map provenance이고 원본 snapshot은 수정하지 않는다. 이는 가상 게임의 밸런스 변경이며 새로운 실제 Riot patch 수집이 아니다. 정규화 효과의 raw 기여/독립 효과 delta를 구분하고 기존 source split을 같은 writer에서 갱신한다. 실제 수용/역사·저장/미완료 AP·공속·치명타 범위는 [개발 가이드8.3.3](DEVELOPMENT.md#833-실제-보유-장비-스탯-패치-작성자소비-연결--2026-10-04)에 기록한다.
