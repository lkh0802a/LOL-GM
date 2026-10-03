> Documentation review 2026-10-03: [navigation](../../README.md), [active priorities and validation](../../DEVELOPMENT.md). Latest explicit user direction and later confirmed decisions supersede dated instructions; historical evidence is retained.

> Dated scope/acceptance record. For current priorities and validation sequencing,
> read [DEVELOPMENT.md](../../DEVELOPMENT.md). This record does not establish whole-game completion.

# LOL GM 11.5 / Stage 4: Long-career performance and bounded caches

## Scope

Preserve stages 1–11 and stage 3 world schema **15**, save encoding **2**, battle/draft/contract outcomes, and full historical records. This stage fixes query patterns that become disproportionately expensive after many seasons. No match, champion, rune, salary or rookie rule has been retuned.

### 1. Meta-history: incremental indexing and bounded results

- `metaHistoryIndex(db)` builds patch/competition/region indexes once per world, then extends those same arrays when new matches are appended. It fully rebuilds on array replacement, truncation or tail-object identity changes.
- Every append clears outdated filtered-query results and sorted patch lists. Filtered results have a **64-entry** LRU bound; current-patch sorted evidence has a **12-entry** LRU bound.
- `metaHistoryFacets(db)` maintains patch/competition/season/split/league options from the index, so the patch UI no longer scans the entire match history on every navigation.
- All caches remain weakly attached to the game world and absent from saves. The game never discards historical match data to achieve this.

### 2. Historical patch replay: bounded snapshots

- Current patch data remains live in `db.patch`.
- Reconstructed historical patch objects are held in a per-world **8-entry** LRU instead of one large snapshot for every patch in a multi-decade career.
- Evicted revisions can always be rebuilt from the retained patch-notes history. Their computed stats and IDs are required to match the unbounded implementation.
- A new game or restored world starts with an independent empty cache; existing snapshots are not serialized.

### 3. Item and rune evidence: one scan per patch

- `patchSystemUsageIndex(db, rows)` indexes the canonical sorted rows for the current patch into champion-class participation, item use, rune use and corresponding win counts.
- `systemUsageEvidence` can then answer all item/rune balances and patch UI usage statistics without rescanning the matches for each definition.
- The index expires when current-patch row identity or patch revision changes. Explicit external row arrays use the historical direct-scan code to avoid stale results from caller mutations.
- Pick participation, class eligibility, binary per-pick item/rune usage, smoothing, confidence, and buff/nerf formulas remain unchanged.

## Verification

- Regression cases `11a`–`11c`: 6,000-row append preservation, full rebuild on replacement/truncation, query/facet eviction, cross-save behavior, accurate historical patch reconstruction after eviction, and byte-for-byte statistical parity between indexed and direct item/rune evidence before and after patch changes and match appends.
- Existing regression coverage `01`–`11`, including ownership, atomic transaction rollback, save migrations, draft, and series resume, must continue to pass.
- `npm run perf` reports incremental appends, repeat facet queries, direct vs indexed item/rune evidence timing, and cache hit measurements alongside series, draft, and item/rune selection baseline metrics. Performance numbers are diagnostic, not brittle fixed-duration CI gates.
- The acceptance gate is green PR CI, green main CI, production HTML verification and standalone auto-sync.

## Out of scope

Stage 5 legacy removal, stage 6 UI-state consolidation, new gameplay features, and a change to historical-save schema. Never shrink the player's match, patch, transfer or career history to hit a performance budget.
