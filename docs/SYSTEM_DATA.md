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

Items are classified into starter, component, boots, final, consumable and special records. Normal builds select legal final items/boots from the complete catalog, select an appropriate starter, then purchase the actual component recipe before completing the target item. Component effects are active while held. Price patches alter recipe timing rather than changing display text only.

Champion-specific or hidden records remain in the complete source catalog but are not exposed as general shop choices.

## Rune contract

All 62 runes remain attached to their original style and slot. A match selects a legal page from the complete active pool:

- one primary style: one rune from each of slots 0–3
- one different secondary style: two runes from two distinct non-keystone slots

Rune effects feed combat through the same system-effect layer as items. Removing a rune may not empty a style slot; long-save lifecycle rules preserve a viable rune tree.

## Patch lifecycle

Patch notes may buff/nerf item price or gameplay effects, buff/nerf rune effects, introduce new stable-ID items/runes, or deactivate/remove existing choices. Item removal is guarded so class build pools remain viable; rune removal is guarded so every required style slot remains selectable.

Historical patch reconstruction starts from the pinned baseline and reapplies retained patch notes, so old match replays do not silently use current item/rune state.

## Validation

`scripts/validate-system-snapshot.mjs` hard-fails if the pinned source drifts from 254 items, 62 runes or five complete rune styles. Smoke tests additionally require source consumption, recipe purchase timing, legal six-rune pages, item/rune creation/removal, combat integration and patch-history reconstruction.
