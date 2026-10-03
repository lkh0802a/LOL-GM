> Documentation review 2026-10-03: [navigation](../README.md), [active priorities and validation](../DEVELOPMENT.md). Latest explicit user direction and later confirmed decisions supersede dated instructions; historical evidence is retained.

# Bootstrap determinism investigation — Issue #57

Baseline: main `580956b3e6979749a89c333fa1b354370cf7f717`.
The independent smoke-sharding experiment remains PR #66.

## Reproduction and cause

Three unmodified full-smoke executions, observed with a temporary read-only
phase snapshot wrapper, passed every assertion but ended with 811, 810 and 813
players. The first divergent gameplay field was
`global.rookieCycles[2027]`, before the patch/system probe block. The first two
runs had quality/volume 1.02/0.93 and 0.95/1.00. Team count, date and patch hash
matched. Subsequent auction outcomes changed regional free-agent deficits;
`seedFirstSeasonFreeAgentDepth` fills them in region order and `uniqId` starts
from total player count. This explains shifted region prefixes on generated IDs.

`buildWorld` uses the fixed generation RNG seed `world-v7`, but the pre-career
rookie cohort used wall-clock-derived `saveId` while `db.world` was null.
The initial candidate score and role-conversion threshold had the same fallback.
`saveId` is storage/transaction identity, not simulation entropy.

`worldSimulationSeed` now chooses the existing career seed, or the same canonical
generation seed used by `buildWorld`. It does not add RNG calls, change probability
constants or rewrite saved cohorts. Established career seeds keep their previous
RNG input. Existing unseeded pre-career behavior intentionally stops depending on
creation time; no historical nondeterministic result is blessed as a baseline.

## Evidence and boundaries

- Dedicated acceptance failed before the fix and passes afterwards. It covers
  two different save identities, full generated rookie records, initial candidate
  scores, conversion decisions, explicit-seed cohort RNG parity, distinct career
  seeds and saved cohort/seed preservation. It runs in both full check and the
  shared UI/finance/contracts domain runner (six isolated engine contexts).
- Three fixed full-smoke runs match at every captured phase and final market DB,
  excluding only `saveId` identity fields. Main final DB: 811 players, 111 teams,
  2027-06-15; final market DB: 1124 players, 117 teams, 2028-01-06.
- Diagnostic full-smoke durations on Windows Node 24: before 22.02/20.05/19.70s;
  after 20.70/24.11/21.50s, with other validation running concurrently. These are
  correctness observations, not a speedup claim. CI runs Node 22.
- Audited wall-clock uses: gameplay consumers of `saveId` were these three;
  other engine dates derive from game dates or explicit instants. Performance
  measurements do not feed simulation.
- System meta/choice caches are patch-object-owned WeakMaps with revision keys;
  usage/history caches are DB-owned. No cross-world cache leak explains the
  earliest divergence. Existing cache invalidation/parity assertions stay intact.
- Several seeded RNG sort comparators remain in player generation, scheduling,
  contracts, combat and patch content. Replacing them would change RNG consumption
  and distributions; it is outside this fix. Same-runtime replay is verified,
  not a guarantee across arbitrary JS engines/sort implementations.
- No fixture snapshot, acceptance threshold, seed/season count or game balance
  was changed. Temporary diagnostic wrappers and snapshots are not shipped.

Final CI and medical/career parity evidence are recorded in the PR and Issue #57.
Only after this fix is merged may #66 proceed to full/core canonical parity.
