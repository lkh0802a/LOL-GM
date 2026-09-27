# Champion source pipeline

LOL GM must not silently treat generated archetype values as authoritative champion data.

## Source order
1. **Riot Data Dragon (patch-pinned)** — base stats, localized Korean names/descriptions, spell cooldown/cost/range and exposed effect arrays.
2. **CommunityDragon (patch-pinned, reviewed supplement)** — only for mechanics/coefficients that Data Dragon does not expose reliably.
3. **Generated fallback** — game-generated future champions and temporary gaps only; always marked `detailSource: generated_fallback`.

Run `node scripts/sync-champions.mjs <version>` to create a reviewable snapshot under `src/data/`. Do not point production simulation at `latest`; the game dataset must be pinned to a patch/version so saves and patch history remain deterministic.

Imported data is not accepted automatically. Normalization must map each mechanic to LOL GM's explicit skill schema and smoke tests must verify champion count, stable IDs, P/Q/W/E/R presence and numeric fields before a snapshot becomes canonical.

## Snapshot validation
Every imported snapshot must pass `scripts/validate-champion-snapshot.mjs`: pinned version, Riot source marker, at least 160 champions, unique stable Riot keys, required base stats, Korean localization, passive and Q/W/E/R structure. LOL GM patch 26.19 maps explicitly to Data Dragon 16.19.1; future mappings must also be explicit rather than using `latest`.

## Normalized skill mechanics
Each P/Q/W/E/R entry can carry structured mechanics: per-rank `baseDamage`, coefficient map `ratios` (AP/total AD/bonus AD/HP etc.), `cost`, `range`, structured `cc`, `heal`, `shield`, `charges`, and `recast`. Data Dragon fields are retained when exposed; reviewed CommunityDragon supplements may fill missing mechanics. The match engine consumes structured damage/ratio/CC/utility information instead of treating it as display-only metadata.


## Runtime coverage

The embedded 16.19.1 / 26.19 snapshot now covers all 173 initial champions with Korean passive and Q/W/E/R source records. Runtime provenance remains explicit: Data Dragon supplies the pinned source fields, while mechanics not represented by that source remain simulation-derived rather than being presented as authoritative Riot numeric data.
