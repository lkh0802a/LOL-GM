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
`applyItemCraftAction` currently appends the purchased ID; `systemEffects` sums
effects per inventory entry. Runtime normalization does not carry reviewed
exclusive-group rules, and automatic selection alone is not a shared legality gate.

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
