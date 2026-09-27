# Champion source pipeline

LOL GM must not silently treat generated archetype values as authoritative champion data.

## Source order
1. **Riot Data Dragon (patch-pinned)** — base stats, localized Korean names/descriptions, spell cooldown/cost/range and exposed effect arrays.
2. **CommunityDragon (patch-pinned, reviewed supplement)** — only for mechanics/coefficients that Data Dragon does not expose reliably.
3. **Generated fallback** — game-generated future champions and temporary gaps only; always marked `detailSource: generated_fallback`.

Run `node scripts/sync-champions.mjs <version>` to create a reviewable snapshot under `src/data/`. Do not point production simulation at `latest`; the game dataset must be pinned to a patch/version so saves and patch history remain deterministic.

Imported data is not accepted automatically. Normalization must map each mechanic to LOL GM's explicit skill schema and smoke tests must verify champion count, stable IDs, P/Q/W/E/R presence and numeric fields before a snapshot becomes canonical.
