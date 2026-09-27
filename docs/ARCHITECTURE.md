# LOL GM Architecture Guardrails

## Purpose

LOL GM remains a standalone-first simulation, but standalone delivery does not justify a single monolithic source file. Canonical source is split by simulation domain and concatenated only at build time.

## Module boundaries

The authoritative module order lives in `scripts/artifact-modules.mjs`.

- source snapshots: `champion-source.js`, `system-source.js`
- simulation core: `engine.js`
- baseline/domain data: `data.js`, `champs2.js`
- patch/meta: `patch.js`
- competition/world: `competition.js`, `world.js`
- management domains: `office.js`, `finance.js`, `features.js`, `career.js`
- domain UI: `ui-patch.js`, `ui-market.js`
- application shell/controller: `app.js`

New large UI surfaces should be added as `ui-<domain>.js` modules instead of extending `app.js`. The actual LoL-style draft UI for Item 11 follows this rule.

## State and cache rules

Persistent game state lives under the world DB object. Module-level caches must never own persistent state.

Caches that depend on a world or patch use `WeakMap` ownership so a reset/new save can be garbage-collected and cannot reuse another world's values. Cached champion/system evaluation is invalidated by patch revision counters.

Historical patch objects are reconstructed from the pinned 26.19 source plus retained patch deltas. A full baseline copy is not serialized into every save.

## Save rules

`SAVE_VERSION` and the `buildWorld().version` schema must match; CI rejects drift.

High-volume records may use a compact persisted representation only when `unpackDB` restores the exact runtime structure. Meta-history packing preserves date, patch/competition dimensions, teams, players, positions, items, runes and bans.

Derived caches and baseline snapshots must not be serialized.

## Build and CI rules

`scripts/artifact-modules.mjs` is the only module-order manifest used by build/check/smoke tooling.

CI rejects:

- JavaScript syntax failures
- duplicate top-level global symbols across concatenated artifact modules
- save-schema version mismatch
- incomplete pinned champion/item/rune source coverage
- core UI monolith growth past the maintainability budget
- smoke-test violations including patch-cache isolation and save round trips

The generated root `index.html` is a deployment artifact. Canonical edits belong in `src/artifact/*`.
