# Smoke coverage and shard boundary

Prerequisite: #67 fixes pre-career wall-clock seed leakage; its main merge
`84c4044` passed full CI run 36820098204. Existing experiment #66 is continued.

`node scripts/smoke.mjs` defaults to `full`. `npm run check` and the local grouped
regression/smoke/career command still run full smoke. CI runs `SMOKE_MODE=core`
and `SMOKE_MODE=patch-system` in parallel. Both must succeed for the existing
regression/smoke/career gate to pass.

| Mode | Coverage |
| --- | --- |
| full | All eight original phases and every original assertion |
| core | Bootstrap and all later phases except patch-system-cache |
| patch-system | Bootstrap prerequisites and every patch-system-cache assertion |

The patch block's original statement order is unchanged. It owns separate probe
worlds and only reads the shared smoke DB. No save/restore boundary substitutes
for the original fixture. Bootstrap is intentionally repeated in fresh processes.

Run `node scripts/smoke-shard-acceptance.mjs` when changing the boundary. This
opt-in proof executes all three modes and checks phase coverage plus SHA-256
canonical parity of the full runtime DB, final market DB, both persisted DBs,
and series simulation result. Only saveId identity fields are excluded. With
`SMOKE_RESULT_FILE` enabled, the patch block also asserts its shared DB fingerprint
is unchanged. CI uploads the two JSON results and keeps the existing timing log.
The proof is not added to every normal CI run, which would undo the optimization.

Local Node 24 proof after #67: full 17.396s, core 14.521s, patch-system 4.656s.
Ideal parallel simulation path falls 16.5%; total work increases by the repeated
bootstrap. Hosted-runner setup/queue can offset the saving; CI timings belong in
Issue #57. Full/core canonical fingerprints all match exactly:

- runtime DB: `e27fdd90bf8fb6981324779bc745640ae921ee7401b1a07af6b33586f1b66e92`
- market DB: `16f455cdbf9791190919bc5be45483dbac2e9e3b76d3f6d5665336e6e10a5e14`
- series RNG result: `dbc9e4301f53d3558236a0023920444078e90632a755891d6bc839b7d4a4303a`
- persisted DB: `9a5309b172a2c2dcd17364429e528c82f417060a8c17512c8f02f964c4b938ea`
- persisted market: `50a9c86f16b5e69edfc5795bab785ac49d9aa74775e106150be8cb21e20a8af3`

Do not split initial-roster or series/offseason by line number. They mutate the
shared world, and pack/unpack restores/normalizes runtime fields. Any further split
needs separate runtime/persisted state, RNG and cache-ownership proof first.
