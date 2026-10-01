# Reading validation results

CI runs the existing commands through `scripts/ci-run.mjs`. The wrapper does not
replace test assertions, fixture creation, seeds or subprocess exit codes. Tests
remain standalone and local `npm run check` retains all existing coverage.

Each validation job publishes `validation-<job>` (matrix jobs include the shard)
for seven days. It contains `<label>.json` and `<label>.log` for every wrapped
command. JSON records status, exit code/signal, duration, parsed machine-readable
acceptance summaries and a short failure tail. The log retains complete stdout
and stderr. Existing medical/smoke result artifacts and aggregators remain intact.

The Actions step summary identifies the command, result, duration and available
acceptance markers. Failed commands include the last output lines; use the full
log only when the tail is insufficient. A failed command/spawn cannot become a
green check because report generation succeeded. Uploads run with `always()`.

Normal loop: inspect failed job → summary/JSON → relevant log/stack → minimal
local reproduction → fix → final-head Actions. Do not repeatedly fetch all logs
or rerun the full local suite. Successful long simulation, build and parity
evidence should be reused until code or relevant inputs change.

Local observer tests: `node --test scripts/ci-run.test.mjs`. They verify successful
structured output, failed exit-code propagation, preserved errors and failed
process startup. They are also in static/full checks. This wrapper adds one small
Node process per observed command and artifact upload overhead; its purpose is
cheaper diagnosis and evidence retrieval, not faster engine execution.

Standalone publication reuses `index.html` from the production build of the
current run. `scripts/sync-standalone.mjs` checks the checkout against
`GITHUB_SHA`, then fetches main before committing only that file. If main has
advanced, publication is skipped: the newer main run owns its build. Push races
also skip stale publication; other push failures remain failures. No reset,
rebuild, force push or retry against unvalidated source is performed.
Focused tests cover publication, unchanged files, stale runs, push races and
failure propagation, including a disposable real Git remote.

The publishing job runs only after the full `verify` gate succeeds on a main
push. It downloads that run's HTML preview artifact; the build job verifies
byte equality with root `index.html`. Only the publishing job can write repository
contents. PR validation never publishes standalone files.

Publication evaluates with an explicit status-check function and independently
requires successful changes, perf-build and verify results. Optional skipped
parity jobs must not suppress publication after a green main gate. A failure or
cancellation in a required job still prevents publication. PR/manual/docs-only
runs cannot publish. Real Actions evidence must include a completed publishing
job, not just a successful overall run.

## Explicit full and parity runs

Use Actions → CI → Run workflow with the intended branch/ref. Manual dispatch
always runs the complete gate even when the last commit changes only docs.
The optional `smoke_parity` checkbox additionally runs the existing full/core/
patch-system comparison, asserts identical runtime/persisted/RNG fingerprints
and coverage union. The separate `refactor_parity` checkbox runs the same current full smoke and two-season
career fixtures against the pinned R01 engine and current engine, asserting
exact runtime/persisted fingerprints (only wall-clock saveId is omitted).
Checkout includes history for the pinned baseline. Evidence is uploaded in
`validation-smoke-parity`, including `refactor-parity.json` and its log. A requested parity
failure fails `verify`. Leave it off for normal full regression; enable it when
changing shard boundaries. Enable `refactor_parity` only for behavior-preserving
refactors: new gameplay state intentionally differs from the R01 baseline and
must not be judged against its historical exact hashes. Either requested parity
checkbox makes the shared parity job required by `verify`.

For engine optimizations after gameplay additions, set `refactor_baseline` to
the full 40-character commit SHA immediately before the optimization. The default
remains the original R01 SHA for historical refactor verification. The comparison
uses the same current smoke/career oracle against both engines and reports the
chosen baseline in its evidence; no state field, seed or season is relaxed.

Manual runs never publish standalone files. Their concurrency group is separate
from push/PR validation so a diagnostic run cannot cancel main publication.
New runs of the same event/ref still cancel stale runs. Seeds, seasons and
assertions are unchanged; no schedule or extra default matrix is added.
