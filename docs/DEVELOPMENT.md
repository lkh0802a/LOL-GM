# LOL GM — Development Guide

Latest delivery direction: [playable desktop/mobile HTML first, then Android](ANDROID_TARGET.md).
Use the focused development map below and [CI result guide](CI_RESULTS.md)
to select minimal local checks and reuse Actions evidence. Development-efficiency
Issues #57 and #62 are complete. Continue unfinished gameplay and mobile
UX/performance, deliver playable standalone HTML on desktop/mobile browsers,
then complete Android packaging and real-device installation validation.

## Development ownership and handoff

The user owns game direction and final design. ChatGPT owns project priorities,
technical direction, architecture decisions, code review, Actions management and
result verification, and implements changes directly when that is efficient.
Codex is primarily assigned larger multi-file, structurally complex or repetitive
implementation work. Work is divided by task scope, not by an exclusive developer
role. Do not independently implement the same change in parallel.

Actions handles repeated full regression, long simulation and builds. Whoever
implements a change should use focused reproduction instead of repeated
full-source analysis and routine full local runs. Codex work remains subject to
the same repository review, acceptance and CI gates as direct ChatGPT changes.

Keep each step independently reviewable and commit-ready. At a step boundary,
record the goal, finished/remaining work, changed files, tests and failures,
next candidate, temporary code/TODOs and important decisions in the PR and this
existing guide as needed. Never assume allowance remains long enough to finish
a broad rewrite. Prefer explicit ownership and clear code over temporary hacks,
unexplained constants and session-only knowledge; preserve work for takeover
without continually adding new status documents.

## Current Phase

### Current implementation slice — observed champion co-picks (2026-10-03)

Scope estimate: 50 minutes, one implementation worker, baseline main
`01d66dba860d46be2b4f9220b3c6a1f323ab5834`. Actual origin/fetched main matched
the clean managed checkout. No AGENTS.md or competing implementation PR was
found; only historical unrelated #27/#28 remain open. Runtime network policy
and actual Git/GitHub reads were checked. Previous publication passed complete
main Actions `37080932372`. No local-only source or scheduler migration was assumed.

Item 21 now derives observed champion teammates from professional same-side
picks. `championCompositionInsights` uses shared row and side predicates across
patch/date/season/scope/region/team/player/opponent/color. Player/position selects
the anchor champion's recorded appearance; teammates retain their other roles.
Each side contributes one appearance and each distinct teammate contributes one
co-pick/win, even if a malformed source duplicates an ID. Self/opposing picks are
excluded. Co-pick win-rate denominators are the pair appearances; presence uses
all selected-anchor side appearances. Five distinct valid picks mark complete
records; incomplete/unknown picks are counted and never inferred or rewritten.
Known string-shaped legacy co-picks remain usable without invented actor/role/
color provenance. Current roster changes do not reattribute historical pairs.

Results show up to eight teammates by observed frequency, with deterministic
ID tie order rather than win-rate promotion. The display bound does not limit
history or denominators. A transient WeakMap keyed by shared history indexes
holds at most 64 query results and invalidates on append/replacement/truncation.
No save-format, raw/decaying counter, legal draft, scoring or patch weight changes
are introduced. Complete save restoration rederives identical reports.

The actual champion detail shows pair counts/wins/frequency and complete/partial/
unknown-pick coverage, empty states and escaped archived IDs. Explanations warn
that partial evidence does not establish a missing teammate, that patches and
opponents confound results, and that co-pick outcomes imply neither causal
synergy nor draft chronology. The real draft candidate explanation reuses this
report for our club/current patch, intersecting the displayed top eight with
current public picks. No displayed overlap does not mean never played together.
It exposes no hidden opponent mastery and does not convert outcomes into scores.

Files: new `meta-composition.js`, common index/side null guards, draft analysis,
patch/draft UI, module manifest and new bounded-module check, new focused
acceptance and shared UI runner. Three actual short simulated matches include a
controlled repeat of the first match's legal draft with reversed clubs; the third
has another opponent. Fixture dates advance directly, not through played seasons.
Injected partial/string/archive/search variants are compatibility fixtures, not
played history. An injected public-pick draft state exercises the real candidate
and UI path, not a completed manual draft sequence. Checks cover pairs/wins/
denominators, actor/color/temporal contradictions, save, source purity, current
roster independence, archived-ID escaping, actual page/draft rendering, hidden
mastery independence, eight-row rendering and 64-result cache bounds.

Failure retained: the first focused test with a null pick exposed a preexisting
participant-index null dereference. Common index and player-side selection now
skip null identifiers without altering the source archive. Focused acceptance
and the 107-module static check pass after the fix. An earlier shared run passed
43 acceptances in 42 fresh VMs; the final live-draft integration is under the
same full head CI gate. Preserve diagnostics; no budgets/billing were raised,
paid runners added or long/device/TalkBack QA started.

Precise next slice (estimate 50 minutes): Item 21 actual draft chronology analysis.
`draftResult` has real choice logs and side-specific pick order, while the forced
replay path synthesizes role order and `recordMeta` does not archive chronology.
Recheck main/rules/PRs. Capture explicit actual public pick/ban events and first/
follow-up provenance on newly played drafts, retain optional compact-save fields,
and expose filtered opening/follow-up counts with unknown legacy/forced coverage.
Do not infer chronology from final role assignments or a forced replay's synthetic
order. Verify manual/AI, firstPick=1 and save continuity with short real drafts.
All 23 stages are not declared complete; final QA follows features and user feedback.

### Current implementation slice — explicit blue/red analysis (2026-10-03)

Scope estimate: 50 minutes, one implementation worker, baseline main
`1e677d9a8778b87f92222e7d248cab772ae224e1`. The managed runtime became ready,
origin/fetched main matched the clean checkout and only unrelated old PRs
#27/#28 were open. No AGENTS.md was found. Runtime policy and actual Git/GitHub
access were inspected; no prior local-only files or automatic scheduler transfer
were assumed. Previous publication passed complete main Actions `37077741071`.

Item 21's blue/red dimension now starts at actual `simulateMatch` construction,
independently of club identity and first-pick choice. `recordMeta` copies explicit
color provenance rather than backfilling uncertain history from array order.
Queries require two explicitly complementary colors; missing, partial, invalid
or duplicate colors remain unknown. The common side predicate intersects color
with recorded region/team/player/opponent and the same player's actual position.
Filtered picks, wins, champion player/team/matchup/recent insights and direct club
bans use the selected side; table bans retain existing full-match exposure.
Unselected raw/decaying counters and draft weights remain unchanged.

New compact side tuples optionally append color after the existing ban slot.
Four-slot old records and five-slot ban records retain their old shape when they
lack color; the save-format-2 envelope and bounded 512-row streaming stay intact.
A color-only side uses a null ban placeholder plus an optional trailing absence
marker, preserving the difference between absent and explicitly invalid null
bans rather than inventing an empty list. Object/compact history and saves keep
explicit colors while unknown legacy sides stay unknown. This is forward loading
compatibility; old clients cannot display the new dimension.

The actual patch page binds a blue/red/all control, propagates it through all
query consumers and clears it on world replacement. An observational comparison
uses the same non-color conditions, gives each side's match wins/games, and shows
known/unknown provenance coverage. Position comparison requires a matching
recorded pick; legacy unknown positions are not inferred. Explanations separate
selected-side picks/direct bans from full-match ban exposure and warn that small
samples, patch/opponent differences and observed win rates do not establish
causal side advantage. No hidden AI/player information is exposed or changed.

Files: `engine.js`, `meta.js`, new `meta-side.js`, `save.js`, patch/UI state,
module manifest, static budget, focused side acceptance, existing ban/state tests
and shared UI runner. Two actual simulated matches reverse club order with
firstPick=1. Focused checks cover actual color, actor/position intersections,
wins/ban conservation, insights, coverage, conflicting/partial legacy records,
explicit-color array reversal, old compact layouts, full-save/streaming parity,
actual page/handler behavior, reset and bounded query-cache invalidation. Fixture
dates advance directly; these are short matches, not a played season/device QA.
Synthetic history variants prove compatibility, not a real historical career.

Failures retained: initial static check exceeded `meta.js`'s 14,000-character
budget; color/coverage moved to `meta-side.js` with its own 5,000-character budget,
without increasing existing budgets. Initial shared UI run exposed the old ban
test's fixed tuple-length assumption: its legacy fixture now removes both new
fields, preserving its four-slot check, while new tuples are checked at six
slots with actual color. Focused acceptance/static checks pass; the shared runner
then passed 42 acceptances in 41 fresh VMs with 81 engine modules compiled once.
Archive restoration and engine regression acceptance pass. Final review adds
explicit-null-ban preservation and unknown-position comparison coverage.
No diagnostics/records were removed,
billing changed, paid runners added or final long/device/TalkBack QA started.

Precise next slice (estimate 50 minutes): Item 21 recorded composition analysis.
Current `draftCompositionEvidence` explains current public picks/kit/tactic fit;
it is not a historical co-pick/outcome report. Recheck main/rules/competing PRs,
then derive observed teammate champion pairs from recorded same-side picks using
the shared participant/color filters, expose counts/wins and sample limits in
champion insights, and prove save/filter/legacy purity with actual short matches.
Do not invent draft chronology, hidden opponent skill or causal synergy from
observed wins. This does not declare all 23 stages complete; final QA remains
after implementation and user playtest feedback/fixes.

Delivery: PR #147 exact final head
`82d4285e9ca1a62b7165ca5aeaaf083e17156e33` passed complete Actions
`37080526269`, including medical core, four seed samples, two aggregates,
42 UI acceptances and verify. Main still matched the inspected baseline before
sequential merge `992f3795111d0fe264e2b255acef0e6d64fdb8e8`.
Standalone HTML was rebuilt from the integrated 106-module manifest and its
publication head must pass complete main CI. The code/acceptance/docs slice,
rather than CI wait/merge/HTML alone, is this run's implementation delivery.
The precise next 50-minute composition slice above is retained for the next run;
another complete 45–55-minute unit cannot fit this hourly run's remaining time.

### Current implementation slice — participant and head-to-head meta queries (2026-10-02)

Scope estimate: 50 minutes, one implementation worker, baseline main `4f91a47`.
Managed environment became ready; origin/latest main matched a clean checkout,
no AGENTS.md was found and only old unrelated PRs #27/#28 were open. Restricted
runtime network policy was checked and Git fetch/GitHub reads succeeded. Previous
publication `4f91a479e508cf5856cc53ad700e1adbae7e308d` passed complete main
Actions `37072853692`; no local/unpushed work or scheduler migration was assumed.

`metaRowsFiltered` now accepts recorded team, player and opponent IDs. A common
side predicate intersects team/player/region/opponent conditions on the same
side; player/position must identify the same recorded pick. Opponent-only queries
select the side facing that opponent. Self-opponent and incompatible conditions
yield no matches. Filtered tables and champion player/team/matchup/recent insights
count only selected-side/player picks and their wins; the denominator is the
matching recorded games. Ban table counts retain full-match exposure. Existing
ban attribution separates the selected side's club bans from opposing club bans;
player selection does not assert that an individual player made those decisions.
No default raw/decaying counters, current-patch draft weighting, legal/manual
draft actions, save schema or archived observations are rewritten.

Recorded team/player indexes and facets are transient on the existing shared
WeakMap history index. Appends are incremental, replacement/truncation rebuild,
query caches retain the existing 64-entry limit and JSON-encoded dimension keys
avoid separator collisions. These extra indexes hold references proportional to
history, not a fixed-memory archive; final 100-season resource proof remains
deferred. Missing legacy player/team IDs are not inferred from current rosters;
unselected older string-shaped picks still count. Historical IDs remain selectable
even when the current registry no longer supplies a name.

The actual patch page and controls propagate all three dimensions. Player search
examines all recorded IDs/names, displays up to 80 matching choices and keeps an
already selected player outside that window. This is a UI rendering bound, not a
history/gameplay cap. New-world replacement clears participant selections/search.
Sample labels distinguish recorded filters from the mixed/decaying reference view
instead of calling every selected statistic a current-patch game. The UI explains
which side supplies picks/wins, all-match ban exposure and unknown-ID exclusion.

Files: `meta.js`, `ui-patch.js`, `ui-state.js`, new focused
`participant-meta-acceptance.mjs`, shared runner and existing UI state acceptance.
Three real simulated matches with both club orders and two different opponents
prove denominators, wins, selected player/position, reverse/opponent-only queries,
incompatible filters, attributed bans, save continuity and source purity. Fixture
dates are advanced directly for these matches, not a played calendar/season.
A synthetic current player club edit, restored immediately, proves archival
independence rather than a real transfer. Injected legacy/archived/search records
exercise ID provenance and UI bounds, not played historical seasons. The real
page renderer and input handlers, world reset, append/replacement/truncation and
cache bounds are tested. Focused/static/UI-state/old ban attribution checks,
UI/finance/contracts 41 acceptances in 40 fresh VMs and engine regression pass.
Final review strengthened full-page propagation, sample labels and the distinct
opponent condition; focused/static checks pass afterward. No new test failures,
diagnostic removal, budget increases or long/device/TalkBack QA occurred.

Delivery: PR #146 final head `9819d12e1e25bd0c3f06c4385466ff77bb3c2332`
passed complete Actions `37076870010`, including medical core, four seed
samples, two aggregates, UI acceptance and verify. The exact-head gate passed
before sequential merge `fe748476c444cda688f152f1ca5d1b3c28cdc3f7`.
The integrated standalone HTML was rebuilt from all 105 modules for publication;
its publication head remains subject to complete main CI. Implementation and
focused acceptance are this run's delivered slice; merge/build follow-through
does not count as another slice. Remaining hourly time cannot fit another
coherent 45–55-minute implementation, so the precise continuation is below.

Precise next slice (estimate 50 minutes): Item 21 blue/red analysis. Current
match construction maps side 0 to blue and side 1 to red, but professional
history/compact side tuples lack explicit color provenance, and meta queries/UI
have no side filter. Recheck current main, rules and competing PRs. Add explicit
new-record side attribution, compatible optional saved data and a common side
filter across participant statistics/insights/ban ownership with sample coverage.
Do not infer uncertain legacy colors merely from current club/order, alter old
raw counts or claim all 23 stages complete. Preserve standalone/CI gates and
defer final QA until features and user playtest feedback/fixes are complete.

### Continued implementation slice — regional ban provenance (2026-10-02)

After PR #144 merged and its HTML was published, remaining time allowed a
second connected implementation slice, estimate 50 minutes, single worker,
baseline `b98ae9d`. That first publication's full main Actions `37071469950`
passed on exact head `b98ae9dbd4951c1a353f2c660ae188c39e75eec3` while
implementation continued. No parallel implementation agents were used.

Existing regional bans mean exposure to every ban in a match that region
participated in. `recordMeta`, filtered tables, raw/decaying counters and
current-patch draft weighting retain that meaning. New professional history
also stores each actual blue/red side's own bans with its game-time club/region.
`metaBanAttribution` distinguishes selected-region bans, other-region bans and
unknown attribution across existing patch/season/split/league/date/scope filters.
Global attributed bans conserve the total; domestic sides in the same region
both contribute to that region. No lane is inferred for bans. Complete side
lists must match the flattened archive before attribution is trusted; legacy,
partial or inconsistent lists remain unknown and retain their original counts.

Compact side tuples gain an optional fifth ban slot; older four-slot rows stay
four-slot rows and receive no invented attribution. Save format 2/envelope and
512-row streaming remain. Current engine backward reading and new-field
roundtrips are tested; older engines have not been taught the optional field.
The derived cache stays transient on the existing shared WeakMap index, is
bounded by the existing 64-query limit, and clears on append/replacement/truncate.
Its own map avoids mixing array query results and attribution objects or region
key collisions. No persisted derived cache or history deletion is introduced.

The existing patch page shows a separate recorded-game attribution summary,
selected-region preferred bans and selected-champion counts with known/unknown
coverage. It explicitly explains that the original ban table measures exposure.
This summary uses the filtered archive, separately from any mixed/decaying raw
counter view. It does not retroactively change the game's draft weighting or
assert analyst omniscience. Files: `meta.js`, `save.js`, `ui-patch.js`, new
`ban-attribution-acceptance.mjs`, shared UI runner and this guide.

Acceptance records a real cross-region match with reversed club/first-pick
order; proves side attribution, global conservation, unchanged regional ban
exposure, unknown legacy coverage, save/compact batch continuity, UI wording,
shared-view cache identity and append/replacement/truncation/bounds. A synthetic
current club region edit only verifies archival attribution independence, not
a played regional migration; it is restored immediately. Injected legacy and
inconsistent rows only test provenance fallback, not historical seasons.
Synthetic same-region and empty-ban rows also check aggregation boundaries;
they are not claims of played domestic seasons.
Focused attribution/save/First Selection/opponent intent/static checks, shared
UI/finance/contracts 40 acceptances in 39 isolated VMs and engine regression
pass. Review separated the attribution cache from generic filtered-row entries;
focused/static checks pass after that change. No new test failure, budget/seed
change, production GC, diagnostic removal or final long/device QA occurred.
PR #145 final head `6e69396147d7d8eb1cd0ff5aaca87ba9ea623316` passed
full Actions `37072377544`, including medical core, all four seed shards,
both aggregates and `verify`. Exact PR/run heads and unchanged main baseline
were confirmed before sequential merge `07d2d1130bc2c5f1a26f64a93f5620e78c4991cb`.
Standalone HTML was rebuilt from integrated main. Both connected implementation
slices delivered code, focused acceptance and documentation; CI/merge/HTML alone
were not counted as an implementation slice. No third 50-minute slice is started
in the remaining run time; the precise continuation below is recorded.

Precise next implementation slice (estimate 50 minutes): Item 13/21 team/player
and head-to-head meta queries. `metaFilterKey`/`metaRowsFiltered` currently lack
team/player/opponent filters; the page shows aggregate top teams/players but
cannot select their observed picks against a specific opponent. Recheck latest
main/rules/PRs, then connect recorded game-time team/player identifiers to a
coherent filtered view, distinguish selected-side picks/own bans from opponent
exposure, and preserve legacy unknown identifiers, historical transfers,
cache/save conservation and UI sample explanations. Do not infer completion of
all 23 stages; stop for playtest only after actual remaining features are done.

### Current implementation slice — observer-specific opponent intent (2026-10-02)

Scope estimate: 50 minutes, one implementation worker, baseline main `e86bfef9`.
Cloud became ready; the checkout was clean and origin/latest main matched.
Only historical PRs #27/#28 were open, with no competing intent implementation.
The runtime network policy was inspected; Git fetch and GitHub reads succeeded.
No local/unpushed files, secrets or migrated scheduler state were assumed.

The preceding precise continuation is implemented: `draftOpponentIntent` no
longer calls the managed club's `scoutReport` for every observer. It consumes
the existing observer-aware `draftMasteryObservation`, retains public champion
role candidates, and exposes uncertainty ranges using the existing scouting
width policy. The lower end of the range, rather than a hidden/exact mastery,
supports the high-mastery explanation. Opponent analysis expertise uses the
common specialty/secondary/diminishing-return calculation. Existing interpretation
weights and caps remain; official series views exclude unregistered staff.
Public opposing series picks and the observing club's earlier winning picks
support separate reasons. Current-patch actual pick/ban counts and missing
samples are explicit provenance, separate from the perceived patch evaluation.
The UI shows ranges and sources and labels confidence as a simulated
interpretation score, not a probability or a statistical interval.

Files: `draft-analysis.js`, `ui-draft.js`, new focused
`opponent-intent-acceptance.mjs`, shared UI runner and the existing staff rules.
Acceptance drives eight legal draft turns with both sides and a manual pick, proves unrelated
managed scout reports cannot affect AI observations, tests both sides' specialty
effects and own-report range narrowing, series evidence, a real recorded match,
save/reconstructed legal choices, poisoned hidden log fields, pure observation,
visible UI provenance and real official series staff filtering. Existing bounded
mastery estimation remains a simulation heuristic, not independent real scouting
measurement. Draft choice algorithms, manual authority, raw history, save schema
and legal/Fearless rules are unchanged. This does not declare all 23 stages done.

Focused acceptance, First Selection/patch evidence, static 105-module check,
and UI/finance/contracts 39 acceptances in 38 isolated engine contexts pass.
Failures preserved: the initial fixture replaced complete champion profiles with
mastery-only objects, producing invalid quest damage; complete fields are now
preserved. Save comparison initially mixed a frozen pre-match draft evaluation
with newly recorded match learning; the save case now tests the actual pre-match
chronology separately. Official filtering fixtures initially lacked the published
policy and an employed valid contract; existing employed analysts and the real
published-policy view now exercise inclusion/exclusion. No production validation,
history, medical coverage or budget was weakened to conceal these failures.
Final review added a manual legal choice and removed the unsupported fallback
claim that an opponent deliberately hides its composition. The manual fixture
first looked for an unpersisted source field; it now verifies the chosen champion
in the real public log. Focused/static checks pass after these review changes.
PR #144 final head `66944f02550e08f5c22515b2f7cc0d95c6cdb938` passed
full Actions `37070772459`: medical core, all four seed shards, both aggregates
and final `verify` succeeded and the exact PR/run heads matched. It merged
sequentially as `ebc30a05b55eef3cf20cd9c8dae947602fd2163e`; standalone
HTML was rebuilt from integrated main. Earlier run `37070603813` was cancelled
after review changes and is not final-head evidence.

Precise next slice (estimate 50 minutes): region-specific ban provenance for
Item 13/21 analysis. Actual inspection finds `recordMeta`, current patch samples
and filtered tables count all international match bans as exposure for each
participating region, while history only stores a flattened ban list. Preserve
that historical exposure meaning; add explicit side/region ban attribution for
new records and queries so regional preferences can be distinguished from
opponent bans. Show unknown attribution for legacy rows instead of inventing it.
Check actual draft side order, global count conservation, region moves, shared
cache/save/compact history continuity and UI explanation. Recheck latest rules
and other PRs before editing; do not silently redefine prior statistics. Final
100-season/device/mobile/TalkBack QA remains deferred until features and playtest
feedback/fixes are complete.

### Continued implementation slice — current-patch draft evidence (2026-10-02)

After PR #142 passed its exact-head gate, merged and standalone was synchronized,
remaining run time allowed a second connected implementation slice. Scope
estimate: 50 minutes, single worker, baseline `35c86a2`. Actual inspection found
`newPatch` divides both global/regional counters by three; it does not reset
them. Existing draft evaluation, First Selection and evidence interpreted those
mixed effective observations without distinguishing current-patch records.

`currentPatchMetaSamples` derives current-patch picks/wins/bans and regional
games from existing professional `metaHistory` and its patch index. Recorded
game-time regions remain authoritative. The derived cache lives only on the
existing WeakMap index, uses the existing 12-entry patch cache bound, invalidates
on append/replacement/truncation and does not change saves or raw history.
Official shallow DB views share the history array's WeakMap-backed index, avoiding
full historical reindex per view; the focused test proves shared cache identity.
Legacy counters without recorded patch provenance supply zero attributed games,
not invented current-patch observations. String-shaped older pick records remain
supported. Official recording still excludes practice and replay.

Actual draft sample weighting and First Selection now use that same current-patch
source; First Selection's sample weight uses eligible data analysis expertise.
Patch strength, observation noise, own research/counter knowledge and registered
staff effects remain. This is an intentional decision-behavior change, not a
baseline-parity refactor or a claim of optimal picks. Raw decay counters remain
for existing patch diagnosis and historical reference. Evidence UI identifies
the current patch, current global/regional pick/ban observations, missing samples
and separately labelled mixed/decay reference. Old counts do not inflate current
statistical sample weight or confidence. Existing bounded analyst/research
confidence is a simulated interpretation score, not a statistical interval.

Files: `meta.js`, `draft.js`, `draft-analysis.js`, `first-selection.js`, existing
First Selection acceptance, shared runner count and this guide. A second isolated
fixture runs real matches and a real patch transition, verifies old counters do
not change current actual vhat/selection values, then verifies newly recorded
current games change them. Save, legacy unknown provenance, public actor parity,
cache hits/invalidation/bounds and historical regional attribution are covered.
Synthetic injected mixed counters and a synthetic cross-region history row only
test arithmetic/provenance; they are not played-season or international QA.
Shared runner now expects exactly 37 fresh contexts for its 38 acceptances;
compile-once and context isolation guards remain. No seed/budget/history removal.
Focused First Selection/patch evidence, staff registration/coverage and static
105-module checks pass. UI-finance-contracts 38/37 isolated VMs,
calendar-scouting 17, engine regressions and `git diff --check` also pass locally.
PR #143 strengthened final head `886a674a432cafaed9dc8fff83cd7b4cc2755f24`
passed full Actions `37066936654`, including medical core, four seed shards,
both aggregates and final `verify`. Exact current PR head matched before
sequential merge as `8563bffdb809add45fb7f5004bbb84cfada52629`. Standalone
HTML rebuilt from integrated main. Both coherent implementation slices were
delivered by the single worker; merge/HTML sync alone was not counted as a slice.
No new long100-season, device/mobile/TalkBack QA is started.
Review strengthened the current-sample contrast: `recordMeta` also updates own
research, so a detached comparison view holds that prior research/counter state
fixed while preserving live recorded learning and history. This independently
isolates sample effects on actual draft/selection. Initial Actions `37066410343`
is superseded by the strengthened acceptance head and is not final-head evidence.

Precise next slice (estimate 50 minutes): real patch evidence in opponent-intent
reasoning. Current `draftOpponentIntent` uses generic `staffProfile.analysis`
rather than opponent specialty and calls managed-club `scoutReport` even though
it accepts an arbitrary observer side. Recheck those actual call/authority paths,
then use existing observer-aware mastery evidence and connect revealed series picks,
public current-patch tendencies and bounded mastery observations to distinct
reasons/confidence, preserving hidden roles/abilities and manager manual choices.
Verify causes in legal draft turns, public human/AI/save continuity and history,
rather than adding a cosmetic confidence badge. If already complete in current
main, select the next real Item 13–23/D gap; do not infer completion from labels.

### Current implementation slice — freely negotiated staff duration (2026-10-02)

Scope estimate: 50 minutes, one implementation worker, baseline main `37fbe8b`.
Managed runtime/network policy, clean checkout/origin and latest open PRs were
rechecked; only unrelated historical #27/#28 remain. Fixed staff rules require
free term negotiation; both offer and save validation plus UI still capped 1–3.

The same sign/renew command now accepts positive whole-year negotiated duration
while guarding safe integer year and nominal salary arithmetic. There is no new
league maximum; a valid 100-year preview proves absence of an artificial cap,
not a recommendation or forecast of century-long employment. Annual salary is
normalized before validity checks, so rounding to zero is rejected. Existing
salary ceiling, salary/move consent, department limits, annual cash/forecast
gate, atomic replacement, snapshots and rollback remain authoritative.

Stored duration uses the same safety helper and safe positive end year, allowing
longer contracts to reload. Existing legacy terms, missing original start year,
initial two-year contracts and autonomous AI two-year offers remain unchanged;
no historical terms or future results are fabricated. The annual budget check
does not establish affordability in all future years. UI uses a whole-year
number input and confirms end year, nominal total (not prepaid) and existing
50% remaining-salary release guarantee. Actual remaining term still determines
poach/release/closure liabilities through existing finance writers.

Files: `staff-contracts.js`, `ui-market-staff.js`, existing staff-contracts
acceptance and fixed staff rules/this guide. Focused cases now execute manager
7-year FA/5-year renewal/8-year poach, AI 12-year sign and annual continuity,
9-year closure claims with partial/unpaid balances, 6-year UI confirm/cancel,
long-term saves, invalid fraction/negative/unsafe years and malformed saved terms,
stale/late rollback, budget/authority/cap and legacy migration. Existing true
ratings remain hidden. One added 100-year fixture initially reused another
candidate's salary and was refused by the correct salary-consent gate; use the
actual candidate's asking salary, retain the consent assertion and production
policy. No failed evidence is counted as success and no budgets were raised.

Focused staff contracts/registration/coverage and static 105-module/diff checks
pass. UI-finance-contracts (38 acceptances, 36 isolated contexts) and
calendar-scouting (17) passed locally. Complete required Actions on the final
exact PR head passed: PR #142 head
`9c1bc52ee23728f7ccf82d84315cb068aa0163c9`, full Actions `37064610607`,
including medical core, four seeds, both aggregates and `verify`. Exact head
matched before sequential merge as `bd85a78ea65d22b08f410a74fbf33ec3db8da7c3`;
standalone HTML rebuilt from integrated main.
Published main `35c86a22ca367a43f756a591ce99b688f40ed7d0` then passed
complete post-publication CI `37065400906` while the next implementation proceeded.
Long100-season/real-device/mobile/TalkBack final QA remains after all feature implementation and playtest
feedback/fixes. This closes the fixed staff-duration discrepancy, not all D07
or all 23 stages.

Precise next coherent slice (estimate 50 minutes): patch-scoped public draft
analysis evidence. Inspection finds `draftMetaEvidence` reads global/regional
aggregate `metaStats`, while `recordMeta` also stores per-game patch in the
existing indexed `metaHistory`. Recheck whether any patch transition resets the
aggregates before selecting the scope; do not duplicate an implemented reset.
If aggregate evidence spans older patches, connect current-patch public sample
counts/uncertainty to actual draft evidence and evaluation, retaining separate
historical information, legacy unknown provenance and registered analyst effects.
Use existing history indexes/bounded caches, test old-vs-current patch samples,
new-patch low evidence, manager/AI/save parity and real draft consequences. No
invented historical games, deletion of records, hidden opponent truth or long QA.

### Current implementation slice — observed AI on-site staff coverage (2026-10-02)

Scope estimate: 50 minutes, single worker, clean main baseline `34f9dfd`.
Fetched origin/main and inspected open PRs: only unrelated historical #27/#28;
no duplicate implementation or agents. Re-read fixed staff rules and traced
official draft/series effects before changing selection.

AI now chooses positive marginal official coverage rather than raw estimate top-N.
Public observed primary ability, public secondary field names, existing .35
secondary weight/specialty dispersion, analysis focus and duplicate diminishing
returns feed strategy, three analysis contexts and scouting channels. Explicit
fictional objective weights are 1, 1/3 each and .25 respectively. No hidden rating
or secondary ability numbers, staffing quotas, new event caps or global optimum
claims. Training/recovery-only staff do not displace useful field staff; full
employment/payroll/practice stay unchanged. Existing official views consume the
resulting entry. IDs break ties; selection stops when no positive gain remains.

The existing manager/AI registration command remains the only writer, preserving
published zero caps, deadlines, manual authority, historical records, departure
eligibility and save compatibility. Unchanged selections do not rewrite records.
Snapshot now guards submitted identity and, for AI, observed coverage inputs;
changed public evaluation/focus/specialties reject stale previews. Late failures
restore entry and evidence through the existing rollback journal. UI explains
manual choice versus observed AI policy and displays registered analyst focus.

Files: `staff-registration.js`, `ui-registration.js`, existing
`staff-registration-acceptance.mjs`, `STAFF_RULES.md` and this guide. Focused
acceptance checks deterministic complementary selection, context duplication,
specialty dispersion, report changes, hidden-primary/secondary independence,
scout observation, actual official draft/match/career, employment/practice,
zero/unpublished caps, shared writer, stale/late rollback, departure/history/save.
Initial local new fixture called adviser output on the wrong draft turn and got
null; advance through the actual legal draft action to the AI's turn. A subsequent
scout contrast initially had no player because this fixture had not populated a
roster; generate/sign the observed player before checking actual confidence. These
are fixture corrections, not changed production behavior, removed assertions or budgets.
Required full exact-head CI remains the merge gate; long100-season/device/mobile/
TalkBack final QA remains deferred until implementation plus playtest feedback.
Local staff registration/coverage, staff contracts, 105-module static checks and
calendar-scouting (17) passed; `git diff --check` is clean. UI-finance-contracts
ran its domain cases but its final harness assertion failed: the new independent
coverage fixture creates a 36th fresh VM, while the runner expected 35. Updated
the exact expected context count to 36, retaining compile-once and context-isolation
guards. Corrected UI-finance-contracts passed all 38 acceptances with 36 fresh
contexts and one engine compile. PR #141 final head
`7a03743ffee901c9b761b334406b861e20f3d4b4` passed complete Actions
`37059471843`: medical core, four seed shards, both aggregates and final `verify`
all succeeded. Exact current PR head matched that run before sequential merge
as `e2490f01d727200f944677773b8569281187e99e`. Standalone HTML was rebuilt
from integrated main. Initial run `37059343401` and local failure notes remain;
they are not represented as successful final-head evidence. No long final QA or
new infrastructure was started.

Precise next slice (estimate 50 minutes): staff negotiated contract duration.
Fixed `STAFF_RULES.md` says terms are freely negotiated, whereas current contract
validation/UI still offers only 1–3 years. Inspect actual latest command, consent,
exit liability, AI budget and save constraints; replace that fixed restriction
with safe explicit negotiated terms through the same atomic writer, test user/AI
authority, salary/remaining-term compensation and stale/late/save cases. Do not
invent a mandatory agency fee, rewrite existing contracts or claim all D07/23
stages complete. If another PR already implements it, inspect the next real gap.
Read-only continuation checks located the fixed range in `staff-contracts.js`
offer validation and saved-state validation, plus `ui-market-staff.js`'s 1/2/3
selector. `aiManageStaff` and annual renewal both currently submit two years;
`staffConsent` currently evaluates salary/move only. `staffExitFee` already uses
actual remaining years at the common 50% guarantee. Keep that existing policy,
initial two-year contracts and old records intact; test expanded manager/AI terms
through sign/renew/poach, annual expiry, closure claims, pure preview and actual UI
confirm/cancel. Do not merely relax the offer check while save still rejects it.
This next connected slice remains estimated 50 minutes including acceptance and
required CI; it is not split into a tiny post-merge patch to fill the current run.

### Current implementation slice — analyst context specialization (2026-10-02)

Scope estimate: 50 minutes, single worker, baseline `db2a152`. Rechecked clean
main, origin, open PRs and fixed staff rules; only unrelated historical #27/#28
remain. Explicit optional `analysisFocus` distinguishes opponent, meta and data.
New generated analysts receive a deterministic ID-derived focus without changing
other RNG draws. Legacy missing focus remains generic and numerically neutral.
Context contribution uses existing specialty dispersion and duplicate diminishing
returns, then virtual matching 1.2/nonmatching 0.75 and existing bounds.

Opponent expertise affects real committed-match observation learning; meta affects
draft evaluation noise, recommendations and First Selection; data affects public
sample weight and draft evidence confidence. Existing scrim analysis bonus stays
in both meta/data paths. Official registered views remain authoritative. Inspection
found first learning could be assigned only on the shallow filtered team view;
keep eligible staff calculation on the view but write learned state to real team.
No history backfill, hidden opponent truth, new fees or administrative clicks.

AI public evaluation weights the currently undersupported analysis contexts;
true ratings are not used in hiring comparison. UI displays focus or generic,
including secondary analyst expertise. Employment/save validation preserves known
focus and rejects malformed explicit values; department cap 4 and existing
contract/rollback writers stay in use.

Files: `staff.js`, `staff-contracts.js`, `meta.js`, `draft.js`, `draft-analysis.js`,
`first-selection.js`, `ui-market-staff.js`, existing staff contract/registration
acceptances and `STAFF_RULES.md`. Tests cover context contrast, legacy equality,
public AI complementarity, saved focus, malformed values, release retention,
actual draft vhat/advice/evidence, observed match learning, human/AI parity and
save persistence. Initial evidence test read two states sharing current employee
references after changing focus; capture evidence at each actual appointment
boundary rather than comparing both under the same later focus. No production
threshold or budget changed for that fixture correction. Static 105 modules,
staff contracts/registration, UI-finance-contracts 38 and calendar-scouting 17
passed. PR #140 final head `b34d6edd5d3ce61db8242acaaff422ebfa852e0d` passed
complete CI run `37052643677`, including medical core, four seeds, two aggregates
and `verify`. Merged as `d07c532ed0bb5180faffee237da6c58fe21b6305`; standalone
HTML rebuilt from integrated source. Long100-season/device/mobile/TalkBack QA
remains deferred until feature implementation and user playtest feedback/fixes.

Precise next slice (estimate 50 minutes): observed AI competition staff allocation.
`aiReviewCompetitionStaffRegistrations` currently sorts only public raw estimate
and takes the first cap; this can fill a scarce official list with duplicated
training/scouting expertise while excluding complementary strategy/analysis.
Use observed allocated role contributions and published event constraints to
score marginal lineup coverage, keep identical registration command/locks and
managed manual authority, and validate real official draft/match effects, cap,
departure/stale rollback, save/history and current-head CI. Do not change the
employment roster or fabricate a required adviser quota; recheck latest PRs first.

### Current implementation slice — staff multi-specialty dispersion (2026-10-02)

Scope estimate: 50 minutes, single worker, baseline `5af4ee4`. Rechecked clean
main, origin and open PRs; only unrelated historical #27/#28 remain. The confirmed
staff rule requires each contribution to spread across fields; the previous
primary rating ignored every secondary field. Common `staffRoleAbility` now
applies bounded virtual allocation `1/(1+0.35*valid secondary count)` to primary
and secondary contributions while retaining secondary weighting and duplicate
diminishing returns. Single-field employees keep their prior effect. Unknown,
zero and duplicate-primary legacy fields do not dilute or create an effect.

AI compares publicly observed primary contributions under the same allocation,
not hidden rating. User employment remains manual; UI explains the tradeoff.
Known specialty bounds are validated for employed/free/retired staff. No source
ratings or original specialty records are rewritten; historical player reports
and earned champion assistance remain untouched. Contracts, department caps,
registration selection, fees and original costs remain in use.

Self-review found a raw-rating bypass in draft-advice adviser selection and
recommendation noise. Select primary/secondary advisers and compute advice quality
through the common allocated role ability; official registered-staff views remain
authoritative. A real draft acceptance verifies confidence and recommendations
change under broader expertise without adding unregistered advisers.

Files: `staff.js`, `staff-contracts.js`, `draft.js`, `ui-market-staff.js`, existing
staff contract/registration and source-control acceptances, and `STAFF_RULES.md`.
Acceptance covers primary/secondary
dispersion, total equal-rating contribution, single/legacy fields, duplicate
returns, coaching/scouting/analysis, observed AI, save and corruption, alongside
existing real employment/rollback tests. Static 105 modules, staff contracts,
registration, cohesion practice, UI-finance-contracts 38 and calendar-scouting 17
passed. PR #139 final head `292533bfe1f6d13b6957dad78c5dcba2679f38e6` passed
complete CI run `37045694410`, including medical core, four seeds, two aggregates
and `verify`. Merged as `90ab08ed5c01c6386ad96b0fcc4229fffc29f785`; standalone
HTML rebuilt from integrated source. No long 100-season, device/mobile or TalkBack
QA started. The failed earlier-head job remains documented below, not counted as
final-head success.
Initial head `3f9e849` CI run `37045308644` failed source-control acceptance:
under the changed staffing/draft equilibrium all four source-CC pairs retained
the same gold/duration. Reproduction confirms those coarse outcomes are not an
adequate observation of continuous fight effects. Keep four pairs, require
identical draft picks, isolate patch identity, and explicitly require an actual
per-player damage difference (as the existing controlled skill-patch acceptance
already measures). No engine CC multiplier, budget, sample count or production
record was changed to hide this failure; gold/duration differences remain recorded.

The analyst-context continuation is implemented in the newer slice above.

### Current implementation slice — position coaching / champion learning (2026-10-02)

Scope estimate: 50 minutes, single worker, baseline `a82baac`; current main and
open PRs inspected before changes (only unrelated historical #27/#28). Connect
the confirmed position-coach rule to actual champion practice, not extra practice
time or a season-end staffing bonus. `practiceChampion` records bounded earned
mastery/research assistance using current-role staff expertise at practice time;
`growPlayer` settles it with player learning/difficulty and existing growth caps.
Raw work, official game experience, shared daily points, rest and medical gates
remain unchanged. Departure does not erase earned work or apply future bonuses.
Packed champion saves append two optional bounded fields; old eight-field saves
restore neutral zero. UI explains actual practice and employment boundaries.

Files: `staff.js`, `player.js`, `development.js`, `save.js`, `save-migration.js`,
`ui-roster.js`, existing cohesion-practice acceptance and `STAFF_RULES.md`.
Focused acceptance covers same-role/wrong-role, human/AI, raw work equality,
real release, saved earned learning, legacy no-backfill, invalid saved values,
actual mastery/research settlement, cap/reset, rehire, scrim coefficients and rest.
Focused cohesion-practice, static, UI-finance-contracts (38 acceptances) and
calendar-scouting (17 acceptances) passed. PR #138 final head
`6835e536c3caa80843ac31176668345daf092e75` passed complete CI run `37039060781`,
including medical core, four seeds, two aggregates and `verify`. Merged as
`84a272eff31a7a8abafc1a24dfd7f8ce769f53d2`; standalone HTML rebuilt from this
integrated source. No long/device/TalkBack QA started.
Initial calendar regression found that appending default zero fields to untouched
legacy champion pools changed the pure control-experiment clone. Preserve absent
fields and old eight-value tuples until actual practice creates earned learning;
missing values are read as neutral zero without mutating historical profiles.
Existing seasonal legacy practice estimation is preserved but explicitly opts
out of new coaching assistance because its actual practice-time staffing is unknown.

The multi-specialty continuation is implemented in the newer slice above.

### Current implementation slice — scout regional expertise (2026-10-02)

Scope estimate: 50 minutes, single worker, baseline `8e8b9ba`. Rechecked current
main and open PRs (#27/#28 are unrelated historical branches). Implemented the
confirmed staff-rule gap: real investigator observations create personal bounded
regional knowledge; current player location, personal specialization/knowledge
and bounded individual multi-region capacity drive investigator assignment.
The existing D03 capacity, public target ranking, report memory, costs, liquidity
and founding dossier remain in use. Human and AI observations share the same
regional power/learning functions. Missing legacy experience remains neutral.

Employment changes keep the person's expertise; former employers lose the active
employee effect, not their previously recorded player reports. Saves validate
regional bounds for employed/free/retired staff. Compact UI explanations show
recorded knowledge and observations without hidden staff ratings; an extracted
`ui-scouting-regions.js` stays inside a separate small maintainability budget.

Focused existing operations acceptance now covers neutral legacy values, actual
assigned employee learning, personal capacity, regional allocation, human/AI gain
parity, current vs origin region, manual/AI late failure rollback, invalid batches,
cash/report/audit/staff-reference preservation, escaped UI, release/re-hire and
saved expertise corruption. Preliminary tests found an absent-field JSON clone
error and audit-reference replacement during rollback; changed the scoped journal
to preserve original object graph references. A near-full AI operations module
exceeded its existing budget; moved shared batch finance helpers into scouting
without increasing budgets. These failures are documented, not hidden.
Self-review added an owned-reserve boundary case: parent investigators and the
managed reserve's existing manual cash/report path must both be journaled.
Corrected owner-vs-actor detection and captured both finance layers; fault-injection
acceptance verifies the parent experience and reserve cash/report restore together.

Files: `scouting.js`, `scouting-ai.js`, `scouting-ai-ops.js`, `staff-contracts.js`,
three UI modules, artifact manifest/check, existing scouting/staff acceptances and
`STAFF_RULES.md`. Focused scouting depth/operations/reassessment, staff contracts,
core smoke, calendar-scouting, UI-finance-contracts and static checks passed.
PR #137 final head `6a0a42e33c975343ad5c778c48840b55a99f1e0a` passed full CI
run `37033029237`, including medical core, four seeds, two aggregates and `verify`.
Merged as `105d3009fc3a39426041aefa90c6140e99adb685`; standalone HTML rebuilt
from that integrated source. The superseded initial-head CI was cancelled after
the owned-reserve self-review correction; it is not final-head evidence.
No long 100-season, device or TalkBack QA started. Remaining limits: no fabricated
historical expertise, no extra travel/camp mechanics, no new manual administrative
assignment clicks, no claim that every roadmap system is complete.

The recorded position-coaching continuation is implemented in the newer slice
above; keep its original scope and acceptance evidence rather than repeating it.

### Current implementation slice — staff career / retirement (2026-10-02)

Scope estimate: 50 minutes, single worker, baseline `3203bbf`. Existing D07
retirement only read age; the fixed staff rules require age, known career,
performance and motivation. This slice records actual official on-site series
service at the shared committed-result boundary, including pending-series staff
snapshots, and uses recent team results plus observed employment spans and
existing ambition in an explicit fictional annual retirement model.

Employed and free staff share the system-only retirement command, identity/history
preservation, stale-preview protection and rollback journal. Annual repeat calls
do not age/review the same person twice. Managed vacancies remain manual choices;
active cards and retirement notices explain evidence without exposing hidden skill.
Save validation includes archived staff identity and result/review bounds.

Files: `staff.js`, `staff-contracts.js`, `series.js`, `competition.js`,
`ui-market-staff.js`, both existing staff acceptance fixtures and `STAFF_RULES.md`.
Focused acceptance covers each retirement input independently, unemployment,
recorded employment gaps, legacy no-backfill, free/managed authority, late rollback,
stale motivation, annual deduplication, official/practice distinction, actual
committed results, repeated-match rejection, departed pending staff and save errors.
No long final QA started. Head CI / merge evidence is recorded after completion.

Initial head `f29172f` CI run `37024929296` failed core smoke: its copied staff
world had already reviewed that same year, so the new annual idempotence guard
correctly skipped the artificial retirement. Corrected the fixture to advance
one year before its retirement scenario; retained the exact no-auto-replacement
assertion. Failed run/log/artifact remain preserved; a new full-head CI is required.
Self-review also preserved known departure/employer tenure bounds in staff events:
poaching, expiry, release, atomic replacement and closure must not lose existing
tenure when a later signing resets `since`. Focused employment-gap tests passed.

Delivery: PR #136 final head `dc27443726bdcdc802649bf9fdd3cec4d52a3cf1`,
full CI `37025660839` **success**, including static, UI/finance/contracts,
calendar/scouting, regression, core/patch smoke, daily career, career, perf/build,
medical core, regional/calendar shards 0/1, both medical aggregates and `verify`.
Merged sequentially as `9074eea54e84e9c01b3efeddd0e041b1133a46ce`; standalone
HTML rebuilt from that merged source. Previous failed/cancelled runs remain intact.

Precise next slice (estimated 50 minutes): individual scout regional expertise.
Confirmed gap: `STAFF_RULES.md` requires personal regional knowledge to affect
coverage/accuracy; `aiScoutingCoveragePlan` currently distributes IDs by modulo
and region slots depend on team-wide capacity, while `scoutingPowerForTeam` has
no target-region/personal-knowledge input. Reuse the existing D03 operations,
reports, costs and liquidity gates; do not rewrite accepted market scouting.
Next run should inspect current main/PRs again, then connect real recorded regional
observation knowledge to personal coverage allocation and shared human/AI scouting
effects, with neutral legacy migration, ownership changes, save preservation and
focused existing scouting/staff fixtures. Main is the continuation baseline;
no unfinished code, staged edits, extra worker or new long QA is left running.

Limits: historical events without captured employees are not reconstructed;
series wins describe team results, not isolated staff causal credit. The model
weights are fictional and documented, not claimed to be real league regulations.
Next selection must inspect remaining roadmap rules against current code; this
slice does not certify every D07 rule or all Items 13–23 as complete.

`CURRENT_PHASE = PHASE_1_CORE_FOUNDATION`

The Artifact migration is complete and accepted. GitHub is now the primary development codebase.

Current Phase 1 goal: replace prototype-only state with coherent persistent game state and complete the first real gameplay loop.

Development progress covers the user's full numbered roadmap through Item 23.
Finish each major system's accepted gameplay loop before advancing. D01–D13
are depth corrections to that roadmap, not a replacement or a stopping point.
Items 13–23 remain in scope; an omitted status row is not evidence of completion.
Use the full specification to verify their names, dependencies and actual code
before assigning acceptance status. Deliver desktop/mobile playable HTML before APK.

- `1. 새 게임 / 팀 선택` — COMPLETE (2026-09-27)
- `2. 선수` — COMPLETE (2026-09-27)
- `3. 선수 만족도 / 역할` — COMPLETE (2026-09-27)
- `4. 신인 / 스카우팅` — COMPLETE (2026-09-27)
- `5. 계약 / 이적시장` — COMPLETE (2026-09-27)
- `6. 1부 / 2부 / Academy` — COMPLETE (2026-09-27)
- `7. 팀 / 시설 / 스태프` — COMPLETE (2026-09-27)
- `8. 훈련 / 스크림` — COMPLETE (2026-09-27)
- `9. 챔피언 / 메타 / 패치` — COMPLETE (2026-09-27)
- `10. 패치 엔진` — COMPLETE (2026-09-27)
- `11. 실제 LoL식 밴픽 UI` — COMPLETE (2026-09-28)
- `11.5. 아키텍처 정리 / UI 통합` — COMPLETE (2026-09-29; steps 1–6)
- `12. 시설 / 재정` — COMPLETE (2026-09-29; Phase 12 acceptance, engine regression, 2-season career, performance and build CI passed). See `docs/PHASE_12_FINANCE.md`.

## Retroactive depth audit of previously accepted Items 1–11 and 11.5 (2026-09-29)

**The historical COMPLETE marks above remain valid as baseline engine and regression acceptances, not certification that every game-design rule has full depth.** Do not infer from these status labels that contract/loan systems, staff negotiations, AI-owned scouting observations, realistic calendar day progression or all champion interactions are finished.

The source-backed discrepancy matrix and executable follow-up backlog are maintained in **[`docs/RETROACTIVE_DEPTH_AUDIT_1_11.md`](RETROACTIVE_DEPTH_AUDIT_1_11.md)**. It separates verified gaps from unverified depth, explicitly preserves existing working systems, and identifies follow-up dependencies and tests. Its P0 findings include calendar gaps, per-club scouting depth, contract/loan terms and staff-market realism; later work must decide scheduling explicitly rather than silently claiming they were completed or rewriting the engine wholesale.

## Functional depth acceptance rule (2026-09-29)

**Existing function/class/UI presence is a baseline, not a completion criterion.** For each of Items 12–23 and any revisit of earlier systems, build and validate a complete cause-and-effect gameplay loop: data/state → engine decision/constraint → interaction with adjacent domains → player-facing consequences → long-save consistency → AI/manager parity → tests under normal and stress conditions. Reusing the existing code is preferred to writing duplicate systems; filling only UI counters or producing documentation is insufficient. Game-world and club-economic outcomes must be emergent from their respective entities' actual context, not universal scripted rewards.

The first Item 12 pass was limited to budget outlooks and prepaid-flow accounting; Item 12-B adds sponsor choices and sport-based payouts, regional commerce, liquidity-sensitive AI policies, a specialized scouting facility and actual parent/academy fiscal transfers. See `docs/PHASE_12_FINANCE.md`. 100-season economy inflation/competitive convergence belongs to the long-run QA stage and must not be claimed as validated by a two-season acceptance alone. Future item completion claims must explain both actual game rules delivered and known boundaries, not simply which existing modules were found.

## Product-wide convenience acceptance rule (2026-09-27)

Every major system, including already engine-complete Items 1–6, is subject to a standing convenience acceptance rule: automate repetitive or administrative actions only when they do not commit a strategic choice; recommendations, batching, sorting and prefill may be automated, but consequential sporting decisions for the managed club require explicit player confirmation; batch repeated actions where practical; preview projected state, cost and consequences before commit; validate the final state rather than transient intermediate clicks; preserve filters/scroll/editing context; and keep mobile decision surfaces compact. Completion status means the engine contract is accepted, not that poor interaction patterns are frozen.

Current retrofit evidence: squad starters/roles/tactics/training and first/reserve assignment use staged apply; roster-plan validation is final-state/atomic; scouting supports multi-select batch observation; initial blank-roster recruitment supports batch interest/scouting; costly release and staff changes preview financial/ability consequences; facility upgrades are automated by club management rather than exposed as repetitive manual administration.

Item 7 acceptance (2026-09-27): clubs have functional training, analysis, recovery and youth infrastructure with direct development/analysis/recovery effects and full upkeep accounting. Infrastructure capex is board-controlled for both player and AI clubs, uses the shared upgrade/cash validation path, respects club philosophy and financial reserves, and removes low-value manual facility clicking. The player is the managed club's head coach. The legacy coach slot is presented as the senior assistant, alongside strategic, analyst, development and performance specialists; these roles materially affect draft/analysis/development/recovery, carry salary/severance costs, persist in saves, age and recycle through the staff market. AI first-division clubs evaluate specialist upgrades using the same staff market while respecting philosophy, improvement threshold and cash reserve. Player-controlled staff changes remain strategic choices and preview ability/cost consequences. Save round-trip and insufficient-funds invariants are smoke-tested; standalone and latest-head CI pass.

Item 8 acceptance (2026-09-27): training combines 100-point focus allocation with light/normal/high intensity, creating a real growth-versus-fatigue/condition trade-off. Schedule-aware recommendations use the next official match and current squad recovery state; player control is preserved while AI uses the same recommendation logic. Scrims remain unofficial but persist champion scrim experience/confidence, player fatigue/condition cost and team analysis intel. Exhausted squads and excessive same-day volume are blocked. Stronger partners can provide more practice value, while repeated partners have diminishing returns; the UI previews this value and AI partner selection uses the same function without hidden information. Smoke coverage locks training automation, scrim development effects, schedule recommendation validity and repeated-partner diminishing value.

Item 9 acceptance (2026-09-27): the initial 26.19 world embeds a patch-pinned Riot Data Dragon 16.19.1 baseline for all 173 champions with stable LOL GM IDs, Korean names, Korean passive/Q/W/E/R descriptions, exposed base stats and spell cooldown/cost/range source fields. Runtime normalization preserves source provenance while simulation-only mechanics remain explicitly derived; champion base/detail data is consumed by draft/composition/combat logic rather than being display-only. Champion detail UI shows authoritative Korean descriptions and distinguishes source fields from simulation interpretation. Official-match meta history persists competition/season/year/split/stage/league/domestic-international/region/team/player/actual-position context with filters and champion player/team/matchup/recent insights. Global professional eligibility, locked tournament champion pools, practice access during the global ban, regional meta evidence, persistent team meta knowledge/counter-research, cross-region learning and stable-ID rare reworks are smoke-covered. This acceptance does not complete Item 10: autonomous patch diagnosis/change selection remains a separate patch-engine system.

Item 10 acceptance (2026-09-27): the patch engine diagnoses the live professional meta from per-patch evidence rather than win rate alone, combining sample confidence, pick-ban pressure, win rate, recent trend, actual-position flex, regional/international spread, top-team usage, player/team concentration and composition dependence. Consecutive same-direction changes are damped, opposite overshoot can generate partial rollback, and micro/small/medium/large magnitudes apply real old→new changes across base/growth stats, attack/spell range, resource costs, cooldowns, damage, utility, healing, shielding, mobility and system rules. Stable-ID mid-scope and rare major reworks preserve history. The 26.19 baseline now embeds the complete pinned Data Dragon 16.19.1 Summoner's Rift purchasable catalog (254 item records) and all 62 selectable runes across five styles, with Riot IDs, Korean text, prices/stats, recipes and rune style/slot structure. Matches choose these automatically: the engine selects a starter, traverses component recipes into legal final/boot builds, and constructs a legal six-rune page (four primary + two secondary from a different style). There is no player-facing item/rune micromanagement requirement; item/rune patches exist to alter champion power, match outcomes, draft priority and the observed meta. Patches can buff/nerf prices/effects, add or deactivate/remove items/runes, while long-save guards prevent class build pools or rune slots from collapsing. New champions target 2–3 releases per year with the Item 9 professional delay. Full patch history reconstructs historical champion/item/rune specs. `scripts/validate-system-snapshot.mjs`, smoke tests, standalone synchronization and latest-head production CI gate completion.

Pre-Item-11 stabilization (2026-09-27): before adding the full draft UI, the runtime/build architecture was refactored without changing accepted Items 1–10. Patch-history caching is world-owned through WeakMap state rather than a shared global object; champion/system evaluation, automatic item/rune fit, same-day draft champion pools and meta-history queries are revision/index cached with explicit invalidation. Draft noise now lazily admits champions that become professionally eligible inside the same patch instead of retaining an incomplete cached champion set. Series simulation no longer JSON deep-clones draft context every game. Derived 26.19 patch baselines are no longer serialized; historical patches rebuild from pinned source plus deltas. Meta-history save records use a reversible compact representation with smoke-tested material size reduction, and save-only season compaction now operates on a serialization view rather than deleting fields from live runtime state. A discovered save bug was fixed by aligning UI SAVE_VERSION/storage namespace 14 with buildWorld schema 14, and CI rejects future schema drift. Patch/meta, roster/market, and season/world/progression UI were extracted from app.js into domain modules; app.js fell from about 82.8 KB to 65.0 KB. Build/check/smoke share one artifact module manifest, CI rejects duplicate cross-module globals, maintainability budgets cover the major engine/UI modules, and CI records a deterministic performance probe for Bo3 simulation, draft-pool cache hits, item/rune selection and 10k-row meta queries. See docs/ARCHITECTURE.md.

## 11.5 Architecture Rebuild

### Step 1 — Freeze / regression baseline

**COMPLETE when the introducing CI run is green.**

- Added `scripts/regression.mjs` as a dedicated executable baseline for confirmed Items 1–11 behavior.
- Wired the regression gate into `npm run check` before the full smoke suite.
- Frozen critical save/load, Bo3/Bo5, Fearless, First Selection, contract, integrated-roster, local-rule, staff-cap, rookie, patch and item/rune invariants.
- Added `docs/REGRESSION_BASELINE.md` to distinguish confirmed invariants from known audit findings that must not be accidentally blessed as legacy behavior.
- Step 2 must not begin until this gate is green.

## UX / Convenience Re-audit (2026-09-27)

Items 1–5 remain engine-complete, but COMPLETE no longer means their current interaction design is frozen. A cross-system convenience audit found follow-up UX debt that must be repaired when the affected surface is touched, and before final integration acceptance:

- squad management currently commits starter, roster-role and training changes immediately; management surfaces should prefer draft/edit → preview → save/apply when several related choices are normally made together
- owned-reserve call-up/send-down must be edited as a batch and validated against the final organization roster, rather than rejecting a legal swap because its first intermediate click is temporarily illegal
- initial roster construction and scouting/market actions rerender after many single actions; preserve context/scroll and add batch actions where repeated observation or shortlist management is expected
- dense roster/scouting tables need stronger mobile-first summaries, filters and compact actions instead of relying on horizontal-table scanning
- destructive/financial actions should continue to show consequences before commitment; multi-term negotiations already use an explicit offer form and should keep that pattern
- validation messages must explain the violated rule and, where practical, the required correction instead of only disabling progression

This is a standing acceptance rule for the entire numbered roadmap through Item 23 and its D-depth follow-ups: functional correctness, persistence and CI are necessary but not sufficient; ordinary management workflows must also be low-friction on smartphone portrait.

Item 6 acceptance (2026-09-27): Tier-2 ownership, reserve requirements and promotion eligibility are explicit engine rules. Franchise systems maintain required owned reserves; mixed systems combine certified clubs' owned reserves with independent Tier-2 clubs; open/relegation systems preserve independent promotion paths. Owned reserves use stable parent IDs, are never manager-selectable as independent clubs, and are never promotion-eligible. Independent Tier-2 clubs can promote through the same promotion/relegation engine, with repeated-cycle smoke coverage verifying that owned reserves cannot leak into the first division and required reserves are reconciled after structural changes. First/reserve player movement is staged as a final-state roster plan: the UI previews projected squad counts, validation reports exact failures, invalid plans have no side effects, and valid plans apply atomically. AI reserve management uses the same validator/apply path, evaluates visible current ability/performance rather than hidden potential, and has a review cooldown. Reserve closure routes players cleanly to free agency while preserving contract terms. Five-year lifecycle checks cover roster integrity, required reserve count, promotion boundaries and reserve recreation. Standalone HTML is synchronized and latest-head CI passes.

Region-first realism rule (2026-09-27): named leagues are researched and modeled independently. LCK is not a fallback template for LPL, LEC, LCS, LCP, CBLOL, or future named regions. Unknown rules fall back to a neutral global profile, not a Korean one.

Policy-engine baseline (2026-09-27): unspecified regional rules no longer fall back to a static global profile. The engine infers missing roster/market/import/spending-policy dimensions from that region's own economy, talent depth, team structure, and Tier-2 organization, while explicit regional rules remain initial conditions.

Engine-owned policy rule (2026-09-27): named regions no longer hardcode derived policy outputs. Region ids provide no special policy branch; the shared engine derives pay scale, roster profile, market behavior, import openness, spending controls and office posture from observable regional state.

Cross-system realism baseline (2026-09-27): before major item 4, existing adjacent systems received a realism calibration pass. The baseline keeps fictional league identities while using current LoL-esports operating principles: roughly biweekly game patches with occasional longer gaps, rare champion releases and rare systemic changes, persistent starting fives, low roster churn, mostly short player contracts, region-specific rather than universal spending rules, LCK-style top-five soft spending regulation instead of a hard team-payroll cap, slower league-governance reform, and rookie intake based on first-division ecosystem size rather than counting reserve clubs as separate talent markets.

Item 1 verified first-season flow:

`World Creation → Team Selection → Global FA Roster Construction → Registration Deadline → Season Start`

Item 1 acceptance included blank rosters for every active club, full global FA initialization, eligible independent-club selection, owned-reserve restrictions, the 5+6 integrated-roster boundary, AI world roster construction, season bootstrap, standalone HTML execution, and successful CI.

No-emergency-roster rule (2026-09-27): the engine must maintain enough visible player supply before each market opens. Clubs may face a shortage of good or affordable players, but the simulation may not create a player on demand just because a roster slot is empty.\n\nProspect-market liquidity rule (2026-09-27): annual rookie intake is intentionally larger than bare roster replacement. The engine carries a dynamic FA/prospect buffer using active-team count, Tier-2 scale, expiring contracts and veteran retirement risk so clubs retain meaningful market choice.\n\nCohort-quality rule (2026-09-27): rookie quantity and quality are independent. Each season has a shared world cohort signal plus regional and role-specific variation, producing natural 흉작/평년/풍년/황금세대 cycles without fixed elite quotas.

Item 4 acceptance included engine-derived annual rookie supply from regional ecosystem state and total pro labor demand, role-gap-sensitive intake with an explicit FA supply buffer, ordinary-to-rare-elite quality distribution with probabilistic class-quality waves instead of a hard elite quota, 17–19-year-old generated entrants with nationality/champion pool/personality/development metadata, Tier-2/Academy-oriented entry paths, player-specific scouting reports, low-sample/youth/foreign/Tier-2 uncertainty, observation-driven narrowing, permanently uncertain potential ranges, official-match sample integration, growth-trend and champion-pool reporting, stale-report decay, region/role/competition/contract/undervalued-prospect search filters, save schema v13, standalone HTML sync, and successful CI.

Item 5 acceptance included market-derived salary and transfer valuation, realistic 1–4 year contract lengths, signing/performance/title/international bonuses, buyouts, team/player options and promised roles, persistent multi-round player negotiations with counteroffers and patience, club-to-club transfer-fee negotiation, A/B/C recruitment priorities, the required interest → observation → internal evaluation → formal offer → negotiation workflow, hidden rival terms and live competition risk, player choice based on pay/role/team strength/international opportunity/facilities/career fit, manual renewals instead of automatic retention, AI renewals/FA signings/releases/contracted transfers with fallback market rounds, no hidden-potential market cheating, first-season blank-roster contracts using the same formal negotiation model, unresolved-deal expiry at the market deadline, save persistence for recruitment/negotiation state, standalone HTML sync, and successful CI.

Item 2 acceptance included stable player identity and nationality, position-weighted ratings, detailed core metrics, bounded form/condition/fatigue/morale/sharpness/team/tactical adaptation, reputation and market value, champion official/scrim/training experience and mastery adaptation, individualized growth/peak/decline/retirement lifecycle, full match-derived player metrics, career snapshots/events, save round-trip validation, standalone HTML execution, and successful CI. The former secondary-position permission model was later superseded by the free lineup-role model.

Item 3 acceptance included five explicit roster roles (핵심 주전/주전/경쟁/후보/유망주), a persistent five-player Depth Chart per squad, explicit manager starter changes, strong AI starter inertia, expected versus actual playing-time tracking, persistent satisfaction and career goals, conservative LoL-style dissatisfaction thresholds, dissatisfaction sources for playing time/reserve assignment/contract/team results/role/international opportunity/career goals, controlled morale impact, rare long-running transfer requests and withdrawals, AI offseason role rebalancing, contract/transfer decision integration, standalone mobile UI verification, and successful CI.

Use `docs/CORE_DOMAIN_MODEL.md` as an architectural guardrail; older roadmap documents are supporting references rather than the active implementation order.

## Phase 0 migration record

The completed Artifact migration preserved these requirements:

- preserve visual/behavioral parity before large refactors
- establish a real app entry point and routing
- make install/dev/build commands work
- keep mock data explicit and replaceable
- introduce stable IDs where needed
- establish application-state and domain boundaries without overengineering
- keep simulation logic out of React/UI components
- verify smartphone portrait behavior
- leave the repository understandable to the next AI

Do not use Phase 0 as an excuse to implement the entire master specification.

## Phase 0 exit criteria

Phase 0 can end when all of the following are true:

- the approved Artifact's core UI/UX is present in the repository
- the app installs and runs from the repository
- a production build succeeds
- core navigation/routes work
- key mobile layouts remain intact
- obvious runtime/import/asset errors are resolved
- mock data is identifiable and replaceable
- stable entity IDs are not replaced by display-name references
- future domain/engine code can be added without being embedded in screen components

These criteria were accepted on 2026-09-26. See `docs/PHASE_0_REVIEW.md`.

Phase 1 is active.

## Planned boundaries

```text
src/
├─ app/          # routes, app shell, providers, navigation
├─ artifact/     # optional temporary landing zone during migration only
├─ components/   # reusable presentation extracted from Artifact
├─ features/     # screen/feature modules
├─ stores/       # application/game state
├─ types/        # shared domain contracts
├─ engine/       # UI-independent game/simulation logic
├─ data/         # mock/initial/config data
└─ utils/
```

Directories do not need to exist until code requires them.

## Core separation

```text
Artifact / UI / Features
          ↓
Application State / Services
          ↓
Domain + Simulation Engine
          ↓
World Data / Rules / Config
```

UI must never become the source of truth for simulation rules.

Examples:

- match screens display simulation outcomes; they do not decide winners
- draft screens issue actions; draft/domain logic validates legality
- standings screens display tables; league logic calculates them
- player screens display growth; development systems calculate it

## Phase 0 mock rule

Artifact mock data is allowed and expected.

However:

- identify mock data clearly
- keep it replaceable
- avoid spreading duplicate mock objects across unrelated components
- use stable IDs
- do not treat prototype schemas as final domain schemas automatically
- do not fake completed simulation systems

## What happens after Artifact import

The first integration pass prioritizes **visual and behavioral parity**.

After parity and build stability:

1. analyze the migrated codebase
2. remove only migration-specific duplication/technical debt that blocks progress
3. adopt stable common models
4. introduce real game state
5. build the first playable season loop in small vertical slices

Do not perform a large rewrite merely to match a preferred architecture.

See:

- `docs/POST_ARTIFACT_ROADMAP.md`
- `docs/CORE_DOMAIN_MODEL.md`

## Future compatibility

The architecture must leave room for:

- real calendar progression
- roster registration
- draft engine
- match engine
- statistics
- league rules
- contracts/transfers
- scouting/development
- reserves
- finance/facilities
- worldwide AI simulation
- patches/meta
- international tournaments
- persistent saves

These systems are not Phase 0 implementation requirements.

## Shared AI development workflow

LOL GM is currently developed primarily by **ChatGPT in this GitHub codebase**.

The repository and canonical docs are the project state. Future external AI assistance, if used, must treat the repository as the handoff surface.

For every substantial task:

1. sync understanding from the latest repository state
2. inspect existing implementation before writing a replacement
3. follow the current phase and canonical specification
4. integrate with existing repository work
5. leave code and documentation understandable to the next assistant
6. prefer one shared implementation over parallel alternatives
7. verify the change instead of reporting completion from code edits alone

The user is the game/product director and tester, not the manual integration layer. The user should not need to edit UI/UX, code, CSS, Git files or build configuration when an AI can perform the work.

The intended loop is:

`User direction → AI implementation → GitHub → runnable build → user playtest → feedback → next iteration`

See `docs/LOL_GM_SPEC.md#43-chatgpt--claude-collaborative-development-workflow` for the full collaboration contract.


### International ecosystem design checkpoint — 2026-09-27

The canonical first-division international competition contract is now frozen in `INTL_PRESETS` and D-032: First Stand (12), MSI (16), Eastern/Western Cup (8 each), Worlds (24), Worlds Masters (16), and Worlds Open (12). Official full names are used as internal IDs; display abbreviations are separate.

Worlds uses a 24-team, three-pot league phase with six BO3 matches per team (two opponents from every pot, including the team's own pot), followed by a one-time seeded Round-of-16 draw and a fixed BO5 knockout bracket. Masters uses 2+coefficient slots with a maximum of three teams per league; Open initially uses two teams per core league.

Domestic league format is office-owned and may be one long season or multiple splits. International qualification cannot be a direct regular-table cutoff: standings may seed or qualify teams into a competitive qualifier/playoff, but the berth is decided by matches. All first-division domestic official play pauses during an international phase.

This checkpoint records the contract only. Major item 6 remains ACTIVE. Exact executable international scheduling, coefficient arithmetic, patch lock and international roster rules belong to major item 19 and must implement this contract without legacy-format approximation.

Top-division structural invariant: every first division has at least 10 teams and an even team count. The office should normally prefer 10–16 teams, but 18, 20 and larger even leagues are legal when world evolution justifies them; 16 is not a hard cap.


### Champion authoritative-data pipeline — 2026-09-27
Patch-pinned Riot Data Dragon import tooling now exists at `scripts/sync-champions.mjs`; source policy is documented in `docs/CHAMPION_DATA.md`. Runtime fallbacks remain explicitly non-authoritative until a reviewed snapshot is normalized and accepted.

- Champion source normalization/merge layer now accepts a patch-pinned Data Dragon snapshot, preserves LOL GM stable champion IDs, replaces authoritative base/detail fields, records source coverage/version, and leaves unmatched champions on explicit fallback data.


## Champion/meta stage checkpoint (2026-09-27)

- Riot Data Dragon 16.19.1 / LoL 26.19 baseline is embedded for all 173 champions, including Korean passive and Q/W/E/R names/descriptions plus exposed base/spell source fields.
- Official champion meta history retains season/year/stage/league/international context plus team, player and actual picked position; history is no longer destructively capped at 5,000 games.
- Meta filtering supports region, patch, competition, period, year, domestic/international scope and actual picked position.
- Team meta learning and counter-research are persistent, and new champions remain practice-usable during the global pro-ban window while tournament pools stay locked.
- Rare major-patch champion reworks preserve stable champion IDs.


### Item 11 live-draft acceptance — 2026-09-28

Item 11 is COMPLETE. Every managed-team official Bo3/Bo5 game pauses world progression at the decision boundary and runs through the interactive LoL-style draft surface. Fixed Fearless accumulates all ten picks from each completed game; flex roles remain unresolved and hidden until a legal final five-role assignment; game-one First Selection is home-team in domestic double round-robin, explicit seed only where domestic playoff configuration says so, and coin toss for international knockout/bracket matches. Games two onward always give First Selection to the previous-game loser, and the managed team explicitly chooses either the first dimension or the remaining side/order dimension.

Draft information is bounded by what the club can legitimately know. Candidate analysis shows own-player champion pools, current composition needs, public matchup possibilities and meta evidence with source/confidence provenance. Opponent champion-pool estimates are scouting-bounded ranges rather than true hidden mastery. Strategic-coach/analyst advice remains advisory and never auto-locks a choice. Opponent-intent explanations use public draft state, series history and available scouting/analysis only; AI internal intent roles and unrevealed flex assignments are not surfaced.

Player and AI choices pass through the same draft validator. Smoke acceptance drives managed-side choices and AI-side choices through the same staged state machine, checks identical rejection reasons for illegal duplicate/wrong-side choices, and completes both official Bo3 and Bo5 pending-series paths. The Bo5 acceptance includes First Selection handoff after every game, accumulated Fearless uniqueness, a mid-series save round-trip, single result commit and world-progression resume. Mobile portrait draft UX uses compact information tabs, two-column team boards, three-column champion browsing on normal phone widths, horizontal role filters, 44px decision controls and safe-area-aware sticky lock controls. Syntax/structure, smoke, performance, production build, generated standalone synchronization and latest-head CI gate acceptance.

### Managed-club authority rule — 2026-09-28

The player is the head coach and retains final authority over consequential sporting decisions for the managed club. Player recruitment, contracted transfers, releases, renewals, team-option exercise, first/reserve movement, starting lineup, roster roles, tactics, training direction, scrim choices, senior-assistant appointment and specialist-staff appointment are never auto-committed by club AI. Staff may recommend, rank, prefill, batch or warn. Player-option decisions belong to the player/agent and regulatory/deadline consequences such as an unrenewed expired contract becoming free agency may resolve automatically. AI clubs remain fully automated. Board-owned infrastructure capex remains outside the head coach's sporting remit unless that ownership model is changed explicitly later.


### Cross-region rule completion gate — 2026-09-28

No regulation feature is accepted as complete when implemented for one named league only. Every new office-owned rule must be represented as a shared engine capability with region-owned policy/config state. Named leagues may start with different verified initial values; unknown values remain local to that region's policy engine rather than inheriting another league's settings. Acceptance requires cross-region regression coverage and human/AI rule-parity checks. International competition rules remain owned by the international office.


### Local eligibility / transfer / roster-registration checkpoint — 2026-09-28

The current design contract is frozen in `docs/ROSTER_TRANSFER_LOCAL_RULES.md` and D-047–D-049. Player origin/nationality must be separated from active local registration eligibility. The first-team official roster is 5–10 players, must cover all five positions, and may contain at most two non-local players. The cap applies to official first-team registration rather than total contracted or reserve holdings. Contracted moves are limited to two per player per season; a loan departure counts once and the return does not. Free-agent signings are not transfers and may occur year-round subject to official registration eligibility.

Domestic official-roster changes use windows rather than a change-count quota: while a regional registration window is open, clubs may revise the official list without a separate count limit; outside it, ordinary official-list changes are locked. First-team↔reserve/Academy squad assignment is a separate state with its own broader regional movement windows and no count quota while open. Internal movement may happen while official registration is closed, but it changes training/squad placement rather than official match eligibility. Emergency rules may still define whether a temporary roster overage beyond ten is allowed. International tournaments lock the initially submitted final roster except for pre-published emergency replacement rules.

Fearless and First Selection are fixed core match-system concepts, not regional-office or international-office toggles. The earlier cross-region rule checkpoint is therefore interpreted only for genuinely office-owned regulation categories.


### Free lineup-role model checkpoint — 2026-09-28

The former registered-primary-role enforcement model was superseded. A player's primary role is now specialization/identity rather than match eligibility. Official lineups require five distinct registered players assigned to TOP/JGL/MID/ADC/SUP, with no natural-role coverage requirement. General secondary-role fields were removed from generated players and save serialization. `lineup.js` owns lineup validation/assignment, and `ui-roster.js` exposes game-slot assignment separately from the player's primary role.

Long-term role conversion is now implemented as a separate career/training decision. The manager proposes a target role and the player may accept or reject it. Accepted plans accumulate daily training progress and accelerate when the player actually plays the target role in official matches or scrims; target-role champion preparation and role-key development also advance. Conversion training consumes part of ordinary development capacity, redirects/cancellation preserve sunk costs through trust/relationship effects, repeated conversions become less efficient, and completion changes only the player's primary-role identity. One-off off-role usage remains legal without conversion.

### Role-conversion implementation — 2026-09-28

`role-conversion.js` now owns proposal acceptance/refusal, conversion progress, role-use acceleration, target-role champion preparation, development opportunity cost, cancellation/redirect handling, AI use of the same API and primary-role history. `competition.js` records the actual game-role slot on player lines, while `features.js` feeds official/scrim evidence into the conversion engine. `ui-roster.js` exposes proposal, progress and cancellation controls without turning conversion into a match-eligibility requirement.

### Contract / retention / staff rule checkpoint — 2026-09-28

Position conversion is a long-term specialization change rather than an eligibility unlock. It may be proposed at any time, the player may accept or refuse, and its cost comes from training opportunity, champion/role preparation, adaptation and relationship effects. Repeated changes remain possible but inefficient.

Loans are half-season or full-season deals. Recall requires a clause; fees may be zero; wage share is negotiable; purchase options and obligations are supported. Mutual termination is offseason-only and unilateral release honors the contract's guaranteed amount. Player dissatisfaction now targets relationship quality and renewal intent first; transfer wishes are rare severe-breakdown events. After the final international event, expiring players have a 14-day incumbent-only renewal period before outside contact opens.

Match eligibility is the official registered roster, with no second matchday mini-roster. Between-game substitutions are legal, in-game player substitutions are not, and fewer than five eligible players forfeits absent a valid emergency exception. Injuries are rare relative to condition/fatigue/illness.

The staff target is now departmental: no generic senior assistant, up to 9 coaches, 4 analysts and 6 scouts employed by a club. Competition staff accreditation limits remain office-owned. Legacy `team.coach` must be migrated rather than abruptly deleted because development, drafting and finance still depend on it.

## Focused development map

Start from latest main and the relevant unfinished row in DEVELOPMENT.md / the
depth audit. Do not reread every source or repeat accepted gameplay work.
`scripts/artifact-modules.mjs` is the executable source-order manifest;
ARCHITECTURE.md records ownership. Canonical code is in `src/artifact/`.

### Entry points and first checks

These are initial local reproductions, not a proof that other domains are
unaffected. Cross-domain changes need their union; unknown/shared engine changes
require full Actions validation. Ready code PRs keep the complete CI gate.

| Change | Read first | First focused command |
| --- | --- | --- |
| World/bootstrap seed | world.js `buildWorld`, player.js, career.js | `node scripts/bootstrap-seed-acceptance.mjs` |
| Navigation/async UI | ui-state.js, ui-overlay.js, app.js | relevant `ui-state`, `ui-overlay`, `ui-async` or `ui-mobile-a11y` acceptance in scripts/ |
| Save slots/storage | app.js `loadDB` / `switchSaveSlot`, ui-data.js | `node scripts/ui-async-acceptance.mjs` |
| Save encoding/migration | save.js `packDB` / `unpackDB`, save-migration.js | Actions regression + career; preserve legacy resume |
| Finance/contracts/market | finance.js, contracts.js, contract-*.js, transfer.js | `node scripts/ui-finance-contracts-runner.mjs` |
| Player transactions | state-transaction.js, state-player-actions.js, state-rollback.js, roster.js | Actions regression + contract domain + career |
| Calendar/scouting/scrim | calendar.js, season.js `advanceStep`, timezone-calendar.js, scouting*.js, scrim-partner.js | `node scripts/calendar-scouting-runner.mjs` |
| Medical/development | medical.js, development.js, calendar.js, season.js | Actions medical core/regional/calendar; reproduce only failing seed locally |
| Match/draft/series/patch | engine.js, draft.js, series.js, meta.js, patch*.js | Actions regression + both smoke shards + career |
| Build/module manifest/shared RNG | scripts/build.mjs, artifact-modules.mjs, random.js | `node scripts/check.mjs`, then full Actions |
| CI report/publisher | scripts/ci-run.mjs, sync-standalone.mjs | corresponding `node --test scripts/<name>.test.mjs` |
| Documentation only | relevant doc and referenced code | links/diff review; CI static gate |

For one known invariant, run its individual acceptance instead of the whole
domain runner. `npm run check` remains the complete serial local fallback, not
the routine edit loop. Use CI_RESULTS.md for small JSON summaries and failed
logs. Actions owns repeated heavy simulations and production builds.

### Narrow discovery

Find paths with `rg --files src/artifact scripts docs`; then search only the
owning modules and relevant acceptance. For example:

```sh
rg -n 'applyWorldAction|validateWorldAction' src/artifact/state-*.js
rg -n 'switchSaveSlot|loadDB|saveDB' src/artifact/app.js scripts/ui-async-acceptance.mjs
```

When the shell does not expand globs, pass an explicit directory and `-g` filter:
`rg -n 'applyWorldAction' src/artifact -g 'state-*.js'`.
Avoid searching generated `index.html`, `dist/`, and the large champion/system
snapshots unless the change concerns generated output or pinned source data.
Do not infer dead code from name counts: HTML handlers and global concatenation
are real callers. The complete manifest ownership/change map is in
[REFACTOR_R01_AUDIT.md](REFACTOR_R01_AUDIT.md#r08-complete-manifest--dependency-and-change-map).

### Current sequence

Issues #57 and #62 are complete. R01 has a code-backed ownership baseline in
REFACTOR_R01_AUDIT.md. R02 mutation ownership guards are in place; R03 has moved
expense/transfer settlements into finance and player negotiation into
contract-negotiation.js. R04 now centralizes raw calendar positioning and in-season daily effects;
R05 AI market callups now use the shared action gateway with exact baseline parity;
release cost and finance accrual/payroll now have single owners.
R06/R07 remove six unused wrappers and required-UI fallbacks while retaining supported
save compatibility. R08 documents all 73 modules and adds exact R01/current
full-smoke and two-season/save checkpoint parity in the opt-in Actions gate.
Final-head full CI, explicit parity and post-merge main CI passed (PR #85).
Preserve accepted D04-B3. Accepted D04-B4a (PR #86) records pending and
settled player release liabilities, preserves aggregate balances in older saves
and exposes the contractual basis in touch-friendly disclosure cards. It keeps
the existing 50% compensation rule. B4b adds negotiated 50/75/100% release
protection with legacy 50% defaults, shared AI/player terms, deferred agreement
activation, save/restore and the same transactional finance settlement.
B4c adds offseason mutual termination through the shared release transaction,
player consent/compensation demands, manager UI and AI cleanup, with preserved
medical/future-contract boundaries, rollback, saves and single annual settlement.
B4d1 adds atomic office-directed closure, cash-limited player claim payments,
preserved unpaid balances and cancellation of closed-club commitments. Remaining
B4 work includes funding/recovery and player consent/agents/promises; D04 is not complete.
Continue the complete numbered roadmap and D follow-ups. Follow ANDROID_TARGET.md
through playable desktop/mobile HTML acceptance before Android production
packaging and real-device offline/save validation.
Manual full/parity support is a follow-up convenience, not a new optimization phase.

### Optimization ownership during development

User decision, 2026-10-01: the development-efficiency optimization phase and
planned ownership refactor are complete. Continue unfinished roadmap features;
do not restart a separate general optimization phase before implementing them.

Remaining engine performance work belongs to the feature being developed.
When implementing or changing season progression, AI clubs, player growth,
match simulation, contracts/market, patch/meta, schedules, statistics or saves,
measure the affected path and fix demonstrated bottlenecks in that work unit.
Avoid speculative caches or rewrites without evidence. Behavior-preserving
optimizations must retain deterministic results, RNG consumption and save
compatibility; intentional gameplay changes use their own acceptance tests.

During mobile HTML UX development, include rendering, CPU/RAM, battery/heat,
idle/background behavior, batching, cache invalidation, save size/load time and
long-career memory retention in the relevant feature work. During Android
packaging, validate lifecycle, forced termination/recovery and those resource
constraints in release mode on an actual device. This is remaining development
and platform acceptance work, not evidence that all game performance is done.

Use focused local measurements and related checks; delegate repeatable full
regression, long simulations and builds to Actions. Record the measured issue,
change, validation and remaining limitations in existing phase/work records.
Complete desktop/mobile standalone HTML acceptance before APK delivery; the
complete Items 1–23 and D follow-up scope remains unchanged. See
[ANDROID_TARGET.md](ANDROID_TARGET.md#performance-work-during-mobile-development).

### Measured engine optimization — rune selection

The existing CI probe measured item/rune selection at about 0.895ms per pair
(run 36836633358), so optimize repeated selector work rather than adding caches
without evidence. Secondary rune selection now reuses the primary ranking's
per-slot winners. It preserves scores, stable ties, rune IDs/order and RNG;
it adds no persistent cache or save fields. The focused acceptance compares the
frozen pre-change selector across every champion/role, player/null context,
save restoration, disabled/incomplete styles, ties and caller mutation.

Local focused evidence: 1,783 exact cases, 98→62 score calls per representative
selection (36.7% less score work); median 200-call sample 61.91→39.13ms (1.58x).
This is selector-level evidence, not a claim that the whole game or CI is 1.58x
faster. Full Actions performance plus exact pre-change smoke/two-season/save
parity are required before accepting the optimization. D04-B4 remains unfinished;
resume its next independent gameplay unit after this bounded optimization.

Tournament naming correction (2026-10-01): display names are Worlds Masters
(월즈 마스터즈) and Worlds Open (월즈 오픈). Keep existing MASTERS/OPEN IDs
for saved schedules and results. Restore old default display names on load;
preserve user-customized names and formats.

World setup decision (2026-10-01): remove the world-change frequency selector
entirely, including advanced settings. New worlds and restored saves use normal
frequency; calendar/offseason evolution always uses the normal multiplier (1).
The manager/AI delegation control remains a separate setting.

Default-world selection update (2026-10-01): Korea/China create owned Tier-2
reserves. The user's revised rule now permits coaching these squads with parent-
controlled recruitment, resolving the prior default Tier-2 selection gap without
inventing independent clubs or changing ownership/promotion rules. Independent
Tier-2 clubs remain selectable in custom worlds; there are currently no such
clubs in the default starting world. Other default core regions lack Tier-2
leagues. Further league composition remains separate design work.


## Realism reference and fictional league priority (2026-10-01)

The user specifies actual LoL esports as the realism reference, while explicitly
preserving this game's fictional league. User-approved fictional formats, world
evolution, competitions and rules take priority. Difference from real leagues
alone is not a defect and does not authorize converting the game to a replica.
Improve internally implausible consequences using real esports as a reference;
verify dated regional official rules before claiming they are actual rules.
Private contract terms and simulation policies must remain clearly distinguished.

The [2026 LCK update](https://lolesports.com/ko-KR/lolesports/news/2026-lck-rulebook-update-notice)
permits some end dates outside the global date, with multi-year constraints.
The current Worlds+14 model remains the fictional game's policy; this source
must not trigger an automatic migration to real-world calendar dates. Revisit
only where the fictional design needs a more coherent rule.

Current batch: D04-B4f2/B4g1 — oral role promises, persistent player agents,
and compact confirmation/status UI. B4f1 passed CI 36870500337 and merged as PR #99.
Main files: player-representation, negotiation, relation/contract lifecycle,
player-commitments UI, roster bindings and representation acceptance. Shared
player consent, atomic journal and usage evidence remain authoritative.
Remaining D04: broader representative/agency lifecycle, promise renegotiation,
insolvency assets/other claims and transfer payment terms; D05 and Items 13–23 follow.

Local D04-B4d1 evidence: static check (74 modules) and the focused UI/finance/contract runner passed (17 acceptances, 13 isolated engine contexts, one engine compile). Full CI acceptance is required before merge.


D04-B4d2 extends existing parent-to-reserve support to closure liabilities using
actual spare cash after protecting parent claims. Parent finance is included in
preview invalidation and rollback; both transfer sides persist and the active
parent UI exposes recent support. No second annual charge or arbitrary equity.
Remaining insolvency scope includes residual cash/asset recovery and other claims.


## Owned reserve coach career (2026-10-01 user rule change)

The user supersedes the prior owned-Academy selection ban: active owned reserves
are selectable coaching jobs, including default KR/CN second divisions. These
remain parent-owned and promotion-ineligible. Their coach controls their own
lineup, tactics, training, recovery and player development. The parent AI owns
player recruitment, contracts, releases and first/reserve movement; the coach
cannot change the parent's squad or bypass recruitment restrictions through commands.

At a first-year academy start, the real initial world market builds all squads.
The coach sees the provided roster and confirms season start instead of recruiting.
Independent-club setup stays manual. Economic AI exclusion uses
managedRecruitmentTeamId rather than the match-coaching team id. Saves continue
using the managed reserve team id so official matches still pause for its draft.

Current implementation files: world/career, transaction and negotiation authority,
contract AI exclusions, medical/role-conversion scope and setup/roster/market UI.
owned-reserve-coach-acceptance covers the real picker, actual initial start button,
provided legal rosters, forbidden economic commands/negotiations, own squad apply,
parent isolation, recovery, official-match pause, real AI contract market and saves.
Full regression and build are Actions-owned. The former independent-only smoke
expectation is replaced with coverage of active independent and parent-owned teams.

Local academy-coach validation: static check and focused UI/finance/contracts runner passed (18 acceptances, 14 engine contexts). Full Actions required before acceptance.


D04-B4d3 unit: recover closing owned-reserve cash after protecting its own claims,
then protect parent claims before supporting other closing reserves. Support for
negative-cash reserves accounts for the liquidity deficit before player payouts.
No invented equity or duplicate annual income. Finance keeps bounded recovery
history; closed statements and UI distinguish returns from support. Focused
closure acceptance verifies cash/debt conservation, rollback, save/UI and annual
accounting. Remaining insolvency work includes independent assets and other claims;
next gameplay candidates include transfer consent and D05 loans.


D04-B4e1 unit: shared pure permanent-transfer consent now guards retained-contract
moves and new transfer contracts for all actors. Use existing negotiation utility
and acceptance/fair-pay policy; do not invent a second player preference formula.
Personal decision evidence is revalidated in canonical previews and saved with
transfer events. AI checks both purchases and proposed swaps before committing.
Focused transfer-consent, owned-reserve-coach and static checks pass; full Actions
is the acceptance gate. Next candidates: AI negotiating new personal terms,
agent/promises, remaining insolvency claims and D05 loans.

B4e1 CI integration: the first regression run rejected legacy transfer fixtures
whose hard-coded pay no longer guaranteed player agreement. Transaction fee,
retained-contract and rollback fixtures now use agreed salary relative to the
actual player asking price; all original financial, stale, move-limit and rollback
assertions remain. Local regression passed after this fixture correction. Full
final-head Actions remains the merge gate.


D04-B4e2 handoff: AI first tries affordable retained terms. If refused or outside
payroll room, it proposes the player's preferred duration, actual squad role and
guarantee preference using the existing expiry-market salary ladder (1/1.05/1.15
of ask). Every proposal uses the shared fair-pay/utility consent and transaction
writer. No fee or contract is written on refusal. Salary room uses actual payroll
and the club's cash after the proposed fee; a possible swap supplies no wage credit.
A dedicated contract-transfer-market module keeps existing domain size limits.
Focused coverage includes pure proposals/budget view, retained preference,
no-budget refusal, production AI new contracts and save restore. Static and
focused transfer/owned-coach checks pass; Actions is the final acceptance gate.
Next independent work: agent/promises and remaining insolvency before D05 loans.


D04-B4f1 handoff: contract promisedRole is independent of the club's current
rosterRole. A downgrade is a visible promise issue; insufficient real official
playing time is judged against the signed role using the existing thresholds and
severity scales. Satisfaction/trust and the existing renewal policy consume the
same issue. The baseline starts at actual signing/retained transfer, not earlier
club usage. Internal first/reserve movement does not create a new agreement.
Unavailable medical games with no appearance are excluded from opportunities;
actual appearances still count. Baselines and absence counters are optional
legacy-compatible fields, pure queries do not invent historic dates. Player UI
separates current role from contract role and shows contract-relative usage.
Focused checks pass for official usage, fulfilled/broken promises, role edits,
medical absences, renewal disposition, resets, pure status and save/legacy data.
The shared runner now has 20 acceptances / 16 isolated engine contexts.
This is contractual role enforcement only: oral promises, agents and complete
promise lifecycle/history remain independent unfinished work. No D04 completion.

B4f1 first CI core smoke found a bench fixture copied a starter contract while
changing only rosterRole to backup. It now explicitly agrees a backup contract;
the no-playing-time-complaint assertion remains. The new focused acceptance
separately covers the opposite case: a backup label cannot erase a starter promise.
Local smoke passed after the fixture correction; final-head Actions is required.


## Development batching (2026-10-01 user direction)
The user requests larger connected batches and detailed reports only on request.
Group related state/engine/UI/save work into one reviewable PR and one final-head
Actions validation. Keep focused local tests; do not run full CI for tiny dependent
substeps. Split unrelated or risky work when independence improves recovery.

D04-B4f2/B4g1 handoff: high-reputation players receive persistent identified
representatives; ordinary players negotiate directly. Independent representative
profiles reuse the existing personality generator distribution and a stable local
RNG stream, leaving world RNG untouched. Representative traits materially control
existing demand premiums/options/buyouts and round patience; final player utility
and consent remain the player's. Negotiations snapshot the representative.
Oral role promises are additional opportunities without rewriting contracts.
They use a new atomic player.promise command with own-squad coaching authority,
pure preview, stale usage checks, rollback and repeat-reset protection. The stricter
contract/oral role shares actual usage/medical evidence and trust/renewal effects.
New agreements/transfers/releases close oral commitments with career evidence;
internal squad moves retain them. AI creates commitments before earned starter
promotions; manager decisions use a compact preview/confirm/cancel surface.
Focused acceptance and the 21-acceptance / 17-context runner pass; static checks
cover 77 modules. Full final-head Actions is required. No D04 completion claim:
agencies with multiple clients, commissions/representative changes, lower-role
mutual renegotiation and broader insolvency remain distinct future work.


## D05-B1 loan gameplay batch (2026-10-01)

Implemented temporary registration as optional player.loan: player.team is the
playing squad, loan.ownerId retains original contract responsibility. Incoming
and outgoing manager proposals, AI window reviews, salary shares 0–100%, zero
fees, half/full-season periods, agreed recalls, automatic returns, roster return
reservations, career history, confirmation UI and packed saves share the existing
command/journal and daily calendar. No second persisted roster ledger. A derived
WeakMap index avoids player scans on every payroll lookup; starts/returns, load
and rollback invalidate it.

Configurable region.loanWindows defaults to Jan 7–31 / Jul 1–14. This is a
fictional game calendar policy, not a real league rule. Only the destination
window matters. Half-season returns July 1 for first-half starts; otherwise at
season end. Full season returns before incumbent-window payroll snapshots;
Dec 31 is the final-date safeguard. AI reviews once per regional window, uses
existing scouting observations, commits at most two deals across the review and
protects manually controlled club economics. AI lenders protect current starters
unless they want out and require half salary or a quarter annual salary as fee.
Manager outgoing proposals instead require AI borrower wage room and sporting
improvement. These are game policies, not universal esports laws.

Budget payroll uses current shares. Annual salary remains with the owner, with
matching day-prorated borrower expense/owner credit recorded by player; no daily
cash writer or double annual/prepaid fee charge. Annual regulated top-five
spending uses accrued shares; close clears settled rows. Borrower games use the
loan opportunity promise and do not satisfy/breach suspended owner contract/oral
promises. Aggregate career usage remains. Borrowers cannot release, renew,
transfer or redistribute players. Return does not consume another seasonal move.
Closure journals both counterparts: borrower closure returns the player; lender
closure terminates its own contract and preserves existing release liability,
including outbound players. Broader insolvency wage/asset claims remain pending.

Major owners: player-loans.js, player-loan-market.js, ui-player-loans.js, finance,
roster, calendar/season, save migration and club-closure composition. Focused
loan acceptance covers pure/stale/late-failure rollback, both manager directions,
production AI, destination windows, 0%/50%/100% wages, matching annual settlement
and no duplicate fee, registration/move caps, reserved places, half/full-season
orchestration, both closure sides, corrupt/legacy saves and real cancel/confirm
UI. Shared runner: 22 acceptances / 18 isolated contexts; static: 80 modules.
Focused checks pass. Final-head Actions remains the merge gate.

This is the first connected loan batch, not all D05. Next: purchase option and
obligation/conversion without another move; conditional/installment transfer
fees; deeper regional market/calendar integration. Continuous local service
accrual remains unimplemented: loans preserve existing qualification without
inventing residence progress. Strategic AI recall and broader insolvency remain
unfinished. HTML/mobile-first delivery and all roadmap Items 1–23 remain in scope.

## D05-B2 / local-service connected gameplay batch (2026-10-02)

The user requested D01–D13 as one continuing development objective with larger
connected batches. Keep independently validated merge boundaries inside that
objective; neither this batch nor the presence of modules proves all D complete.
Long-save/economy and actual mobile play evidence remain acceptance requirements.

Delivered: agreed loan purchase options/obligations, binding season-end conversion,
next-season contract start and annual wage conservation without an extra move;
weekly AI option purchase and shortage recall; guaranteed installments and actual
official appearance/international/title add-ons, mirrored buyer/seller journals,
partial-payment debt retention, cash commitment awareness and rollback. Player
deletion and club closure do not erase invoices. Broader insolvency priority and
asset recovery are still separate work. Default permanent windows reuse regional
loan dates in season; offseason permanent moves use the existing future-contract
and exclusive-renewal guards. Only the destination window applies.

Continuous local service now accrues actual registered days/seasons, pauses
without erasing FA progress, continues across same-region teams/loans, pauses
both regions during cross-region loans and resets on ordinary regional moves.
The service run snapshots its qualifying rules, preserving progress when policy
changes. Earned eligibility never auto-activates: willing players choose during
offseason, with next-season activation, expiry for unused choices and fresh
service after relinquishing an activated acquired local. The configurable default
four-season/two-year-choice rule is fictional game policy. No pre-save service is
invented. Region split/merge successor selection and explicit official roster vs
employment state still remain for D06; unused expired entitlement renewal needs
its own agreed rule before adding it.

Major owners: transfer-payments, transfer-market-rules, loan-purchase, local-service
and compact transfer/local UI modules; existing calendar, finance, negotiation,
roster and save gateways compose them. No timers/background polling introduced.
Focused transfer and local-service acceptances pass, including pure previews,
late failure rollback, production AI, wages, installments/debt, actual conditions,
policy grandfathering, deferred choice, saves and real UI cancel/confirm. Shared
runner: 24 acceptances / 20 isolated contexts; static: 86 modules. Full final-head
Actions remains the merge gate. Next connected target: outstanding D04 insolvency
and representation boundaries, then D06 official registration/employment separation
and regional restructuring, followed by remaining D07–D13 acceptance.

## D06-B1 official registration gameplay batch (2026-10-02)

New seasons explicitly enable registrationVersion 1. team.roster/player.team
remain employment/training assignment; team.registration holds the submitted
domestic list and official starting five. International seasons snapshot entries
before play. Existing in-season saves preserve legacy participation until their
next season, rather than fabricating a past submission or invalidating a live Bo.

Manager/AI submit final organization lists through one atomic roster.register
command. A first/reserve exchange validates the two final lists together, with
5-player minima, region-owned reserve cap/import policy, first-team 10/2 maxima,
contract/loan ownership and single-squad membership. Employment holdings can
exceed official maxima. Owned-reserve coaches control their squad's registration,
while parent club economic/internal-move authority remains unchanged.

Region-owned registrationWindows, internalMoveWindows and internalMoveWaitDays
are separate. The fictional default domestic submission periods reuse Jan 7–31
and Jul 1–14; internal moves default to unrestricted domestic days with zero wait.
International entries and internal moves lock at the first actual UTC fixture,
until tournament completion. Internal moves preserve existing official rights.
Outside-window FA employment does not grant official eligibility or local service.
Official lineups can change outside submission windows; an active set draft locks
its selection. Local-service days now use actual domestic registration.

Official matches and interactive drafts use derived official squad views, retaining
original player objects for real statistics. Employment rosters/depth are not
temporarily overwritten. Explicit medical replacement policy adds exceptional
entries and preserves the other squad's five-player floor; a late entry failure
rolls back the underlying signing/move, finances, service and tournament entries.
Shortage forfeits create no games/appearances. Double shortages are explicitly
flagged and retain scheduled bracket order for administrative advancement, a
fictional fallback requiring later long-run balance review.

Owners: registration.js (policy/commands/AI/save validation), registration-match.js
(derived official views, final entries, medical exception and shortages), compact
ui-registration.js and existing season/competition/series/medical/roster journals.
Focused registry/medical and two-season career checks pass; static: 89 modules.
Full final-head Actions remains the merge gate. D06 is not complete: license and
owner transitions, split/merge successor local choice/history and long-run reserve
regeneration/promotion evidence remain. D04 representation/insolvency and later
D07–D13 work also remain; the whole-D objective stays active.

## Player review corrections and whole-D continuation (2026-10-02)

PR #103 official-registration batch passed all CI and merged as
`7e02d46997af8f40d834cd47d4ec77d0fd515b49`. Continue D01–D13 as the active
objective; finish the requested UI corrections, then prioritize game mechanics.
Do not infer whole-D completion from this review batch or a passing short career.

New games start with manual contract/recruitment operation. The redundant world
generation/reset controls and setup delegation selector are removed; delegation
remains available in the later career market. The standalone repeated-simulation
screen and its route/bindings are removed. Public player estimates exist before
paid scouting, and observation narrows their uncertainty. World strength is a
relative display index whose highest region is 100; blank-roster regions use
their ecosystem strength, without rewriting the player/match balance scale.

New contract protection follows the signing region's common office rule
(default 50%). It is no longer a player preference or selectable contract term.
Existing signed contracts and binding future agreements retain their agreed
rights. Both manager and AI use the same command normalization. Closed/protected
clubs receive an achievable lower-table target rather than fictitious survival;
season-end evaluation uses that same target. The low-table founding roster
strategy retains its previous recruitment target despite the renamed goal.

Champion range audit: 173 source champions / 692 Q/W/E/R entries were compared
against patch-pinned 16.19 client files, with no download/mapping failures.
38 source entries contain a 25000 sentinel and 15 contain zero. Cast limits,
targeting indicators, effect areas and dash distances are distinct quantities;
a numeric disagreement is not automatically a balance bug. Full evidence is in
`src/data/champion-range-audit-16.19.1.json`; rerun with
`node scripts/audit-champion-ranges.mjs`. Rendering uses reviewed descriptions
for global/self/variable skills, including Aatrox's 300 dash and ultimate's 600
fear radius, without replacing a multi-hit attack with its indicator length.
The game currently includes 172 of those source champions (Locke is not in its
curated roster), plus future generated content. Fictional range patches invalidate
source labels rather than showing stale numbers. The audit is a data/semantics
review, not proof of frame-exact reproduction of every live LoL ability.

Champion tiers appear before the first match from current patch strength; actual
competition samples replace the preview basis. Empty historical filters do not
leak unrelated match samples. Dark-theme champion buttons, opposing tactic labels
and 10 isolated save slots are implemented; lengthy implementation annotations
and empty detailed insights are removed from player screens.

Validation: focused office-protection acceptance covers both actors, old rights,
settlement/rollback/save restoration; public-information acceptance checks setup,
goals, estimates, tiers and range changes. Existing contract/UI/registry and
calendar/scouting runners pass. A real Edge browser at 390px in dark mode passed
new game, public estimates, tier display, corrected Aatrox labels and loading
slot 10. This desktop mobile viewport is not real Android/TalkBack acceptance.
Full final-head Actions remains the merge gate. Next: remaining D04 insolvency/
representation, D06 ownership/license/regional history, then D07–D13. Keep the
existing whole-D automation; do not create duplicate recurring jobs.

## D12 contextual First Selection (2026-10-02)

Selection AI now compares current eligible patch picks, its own registered
players' champion mastery, bounded opponent scouting, replacement scarcity,
contested picks, counterpick exposure and remaining Fearless breadth. Manual
side/order choices remain authoritative. Assessment does not repair depth charts
or consume match RNG; the existing selection noise stream remains separate.
Official sessions assess official registration views, including AI-first prompts.
Pending choices and their explanations survive saves; completed games retain
compact decision evidence. Replays retain recorded side and pick order even
when current champion pools differ from the historical match.

Focused acceptance proves actual AI choices change across identical seeds when
mastery breadth changes, opponent estimates remain bounded, patch/Fearless
changes reach assessments, all four manual choices work, and Bo3/Bo5 pending
choices survive saves. Training-only players cannot affect official selection.
Static checks pass for 90 modules; full Actions is the merge gate. This delivers
the contextual selection component, not all D12 or whole-D acceptance. Next:
actual daily-clock long careers, remaining economic/ownership boundaries and
staff/training/match mechanics. The existing two-season shortcut fixture is
not evidence of a 100-season daily-clock career.

Player-reported training NaN: the slider summed the string intensity alongside
numeric group allocations. Allocation now sums only attribute groups and enforces
finite values and the 100-point budget. Restore and growth normalize damaged or
partial old plans; valid zero/underallocated plans and intensity remain intact.
Opponent training controls are disabled. Focused acceptance exercises all three
intensities, invalid saved fields and actual player growth, preventing poisoned
attributes instead of only hiding NaN in the UI.

## D11 actual daily-clock long-career runner (2026-10-02)

PR #105 passed full final-head CI and merged as
`71256de44aecdae0f7ea0aa1807c8b44b13a9d35`. Training input/apply also passed
in a real Edge viewport for all intensities, with five controls on one desktop
row and no mobile horizontal overflow. Latest standalone HTML includes this fix.

`scripts/daily-career-acceptance.mjs` follows `playWorldDay`, daily effects,
managed First Selection and canonical interactive draft/result writers. It never
positions the clock directly on fixtures. Save/resume covers pending official
series, completed season and market boundaries. The bounded starting world has
closed NA, open EU with second division and an eight-team international Swiss
event; ordinary world evolution remains enabled. It exercises real AI operation
and promotion without substituting fabricated champions. Two domestic years and
one international year passed locally; these are short-path evidence only.

Ordinary full CI adds one international career year to its required gate. The
separate manual `long-career.yml` runs three independent seeds for 100 years each
by default, without repeating the expensive run on every PR. Reports checkpoint
each completed year and retain partial progress/error on failure. They include
day/fixture counts, official pending games, champions, patches, active/total
players, team count, ability/cash/salary/value quantiles, champion pick diversity,
save size, runtime and heap use. Review warnings flag a champion winning over
70% of the last ten editions, a champion exceeding 8% of all recorded picks,
median ability rising over 8 points in ten years, or median salary tripling in
ten years. These are investigation triggers, not claims of a realistic target
distribution or automatic balance changes. Budget: 120-minute engine deadline, 125-minute
Actions job, 1.5 GiB observed heap threshold (2 GiB Node heap).

Remaining D11: execute the final merged revision's three 100-season jobs, repair
actual failures and review long-run monopoly/inflation/meta warning trends.
This small-world scenario is not proof of default
six-region Android performance. Whole-D remains active; D04/D06 ownership and
economic boundaries, D07–D10 and D13 real mobile tasks still remain.

PR #106 head `7b6313ed086753090a81d829d510aa017d0a489e` could not run CI:
Actions run 36899884255 failed before any step, with GitHub's annotation
"recent account payments have failed or your spending limit needs to be increased".
This is an account execution block, not a test failure. Do not merge this PR or
claim full CI success. Do not change billing or spending settings automatically.
Local bounded checks remain available; retain long-run partial reports and keep
implementation work independent of this external block.

## D06 ownership continuity (2026-10-02)

Ordinary office-approved acquisitions previously only changed the club name,
leaving the same owner in place. Both those acquisitions and financial rescue
sales now create distinct stable owner identities and append a dated ownership
chain identifying the same continuing club, region/division and license.
They retain the club ID, employment/staff contracts, registration, parent links,
finances and results. Rescue equity remains capital in the existing statement;
ordinary acquisitions do not invent cash revenue. A new board starts with a
fresh patience budget. Owned reserves cannot be sold independently through this
path. Legacy saves gain a current identity without fabricated past acquisitions.

Owners: club-ownership.js, finance.js, office-international.js and save-migration.js.
Focused acceptance covers continuity, sequential identities, legacy/current save
restore, reserve rejection, ordinary production acquisition and real financial
recapitalization/accounting. Finance, the 29-acceptance shared runner (25 engine contexts) and static checks (91 modules) pass.
Remaining D06: license approval/transfer lifecycle and region merge/split successor
history/local eligibility; this batch does not complete those boundaries.

External execution block: PR #106's CI failed before any step on GitHub account
billing/spending restrictions (run 36899884255), not a test failure. Preserve its
branch and do not merge without full CI. Its follow-up local documentation commit
is 115a2c6. A local single-seed 100-season fallback is running as process 26248,
with reports .diagnostics/daily-local-1.json and stdout/stderr files. It loaded
PR #106's engine revision before this ownership change; do not attribute its
results to the new ownership code. Early actual daily-clock seasons passed;
completion and remaining two seeds are still unverified. Do not change account
billing settings automatically. Continue implementation independently.
## D06 region/club organization continuity (2026-10-02)

Region mergers previously promoted every moved second team to division one and
removed its parent; independence could instead close an owned reserve merely
because its parent changed region. All five office-directed relocation paths now
share region-continuity.js: continuing clubs retain IDs, division and employment
organization, with owned reserves moving alongside parents. Destinations retain
second-division support. Each relocated club records a dated same-club region
history. Regional succession records preserve predecessor names and successor
IDs before dissolved region objects are removed, without self-predecessor links.
Ordinary voluntary relocation is not introduced by this administrative path.

Focused acceptance triggers the actual production merger, then checks splitting,
contracts/staff/financial/history continuity, reserve parent/division, successor
save restoration and invalid-destination rejection. Static checks (91 modules)
and the seven-case calendar/scouting runner pass. Whole-D/D06 are not complete:
player successor-local choice, current-contract legacy eligibility and license
approval remain the next connected work. Do not infer that preserving a club
also grants a player new local status; those policies require explicit commands.

The GitHub account execution block persists; this change must remain a draft
until full CI can run. Preserve PR #106 (long careers) and #107 (owners) and their
independent branches. The running process 26248 still targets #106's prior engine,
not this change: 12 seasons through 2038 passed at last observation, with save
size about 25 MB and year-boundary heap about 511 MB. The process working set was
about 2.9 GB, materially higher than heap: later runner reporting should include
RSS/external allocations, and mobile performance acceptance remains unproven.
No duplicate 100-season run should be started while this process is active.

## D06 successor-local and contract protection (2026-10-02)

PR #108 now also grants explicit successor-region choices to players whose native,
active or unexpired earned local region is reorganized. Existing player-choice
commands retain manager/player authority; AI and free agents can choose through
that same path. Choosing a native successor replaces the effective native option
without rewriting historical birthplace. Alternative succession choices are
consumed, including chained reorganizations before activation. Valid independent
qualifications retain their normal expiry. Service progress follows the player's
successor employment region while retaining the snapshotted old rule/days/seasons.

Office-directed club moves protect the old contract's registered-local status
within the continuing employment organization until its original signed/until
identity changes. Exceptions are explicitly scoped to club IDs and do not become
portable region-wide local status or follow an external borrowing club. Renewal
cannot extend the original deadline. Shared registration, roster plans, market
projections and scouting classification now pass the actual destination club;
market capacity also honors a valid next-season choice. A post-reorganization AI
review queues new choices before recruitment, without duplicating existing ones.
Saved malformed contract exceptions fail validation.

Focused acceptance now includes a five-native official squad after relocation,
nonportable/loan guards, renewal boundary, old service-rule continuity, managed
and FA choices, exclusive chained native succession and save validation. Shared
29-acceptance UI/contracts runner, seven calendar/scouting cases, registration,
transfer-stage/local-service and 91-module static checks pass locally. Full CI
remains blocked by the recorded GitHub account execution restriction; #108 stays
draft and latest player-facing HTML remains the verified merged #105 build.
D06 still requires license approval/transfer lifecycle and wider regional-policy
acceptance; no whole-D completion is claimed. The existing #106-engine long run
had reached 20 seasons through 2046 (about 58 MB save / 1.25 GB year-boundary heap)
at last observation, and is not evidence for this new eligibility code.

## D integrated implementation batch (2026-10-02)

Current work is consolidated on feature/d-stage-integration from main
71256de44aecdae0f7ea0aa1807c8b44b13a9d35. This batch combines the actual daily
career clock and long-career QA (#106), ownership continuity (#107), and region
organization/successor-local/current-contract protection (#108). Component
branches remain recoverable; one integration PR becomes the review target.
Those earlier dated entries describe component history, not separate merge plans.

Integration validation passed locally: 30 shared UI/contracts acceptance cases
across 26 engine contexts, seven calendar/scouting cases, 13 CI/publication/
mutation ownership unit tests, and 92-module static/build checks. An actual
daily-clock year with seed d-integration covered 258 official fixtures and save
restoration. A second bounded year with seed d-memory-report verified the new
memory report and resident-memory guard: 258 fixtures, approximately 6 MB save,
136 MB heap and 647 MB RSS at its year boundary. These are desktop Node results,
not mobile performance acceptance or completed multi-seed 100-season validation.

The QA runner now reports heap, RSS, external and array-buffer memory separately;
defaults retain the 1536 MiB heap budget and add a 4096 MiB RSS ceiling. Regional
monopoly warnings accommodate multiple editions per year and avoid duplicate
warnings for one competition/year. Primary files are daily-career-acceptance.mjs,
club-ownership.js, region-continuity.js, shared local-service/roster/market paths,
their acceptance cases and CI/long-career workflows. No temporary engine fork is
introduced. Diagnostic files remain untracked.

GitHub run 36899884255 was blocked before steps by failed account payments or a
spending limit. No unlock/reset time was provided. Full CI remains mandatory for
merging this batch; account billing settings must not be changed automatically.
The prior-engine process 26248 remains the only 100-season run; it does not verify
this integrated code. Preserve its partial reports even on budget failure.
dist/LOL-GM-latest.html remains the verified #105 build; the locally built draft
is separately available as dist/LOL-GM-D-preview.html.

Next connected work: D06 license approval/transfer lifecycle, then remaining
D04/D07-D10 mechanisms and D12/D13 acceptance. D11 requires completed multiple
100-season seeds, and D13 still needs real mobile core tasks/TalkBack evidence.
Neither D06 nor the whole D stage is marked complete by this consolidation.

## D06 competition license lifecycle (2026-10-02)

The integration batch now records a stable same-club competitionLicense ID and
current office approval, region, division, parent, legal holder and policy kind.
Existing franchise/mixed/open/reserve rules determine these states; this does
not add a player-managed license market or change the configured league model.
Ownership changes transfer the legal holder for the parent and owned reserves
without replacing the club's license identity. Region moves, office system
changes and actual promotion/relegation append dated transitions. Closed clubs
return their license alongside existing financial and employment settlement.
Unchanged reviews do not append history. Legacy saves get current approval state
without fabricated prior events, while existing saved history is preserved.

club-license.js owns this record; existing world/office/offseason/ownership/
region/closure writers call it rather than introducing competing actions. Closure
previews reject a changed owner/license state, and the operation-scoped rollback
journal restores license data on a late failure. The acceptance case exercises
franchise/mixed/open policies, a continuing parent/reserve sale and regional move,
production promotion in two regions, mixed protection, reserve exclusion,
old-owner preview rejection, closure rollback and current/legacy save restoration.

Local validation: all 31 shared acceptance cases / 27 fresh engine contexts,
seven calendar/scouting cases and 93-module static/build checks pass. The actual
daily-career seed d-license-integration passed one year, 128 daily ticks, 258
fixtures, 46 managed official games and phase save restoration; boundary save
about 5.9 MB, heap 131 MB / RSS 352 MB. The untracked D preview is updated, while
the verified latest HTML remains #105. The prior-engine process 26248 reached
25 seasons through 2051, about 92 MB save and 942 MB boundary heap, still running;
neither its partial run nor this bounded new-code year proves complete D11.

Continue remaining D04/D07-D10 mechanisms and D12/D13 acceptance. D06 still needs
wider repeated policy/succession acceptance in long careers. Full CI remains an
unexecuted account-blocked merge gate for #109, and real mobile/TalkBack evidence
remains required before whole-D completion.

## CI validation policy (user-directed update, 2026-10-02)

The earlier cost-based scope and main-only-lightweight restrictions are retired.
Every PR, including draft, documentation, UI, CI and engine changes, runs static,
UI/contract, calendar/scouting, medical, regression, smoke, career, performance,
build and verify jobs. Main pushes repeat the same required gate before standalone
publication. PRs validate the exact proposed head; main publication remains a
separate action after the validated merge. Required jobs run in parallel, matrix
shards stay enabled, and new runs cancel stale runs for the same event/ref.

Preserve medical core, four seed shards and both aggregate invariants. The medical
workflow currently covers core plus two regional and two calendar shards and both
aggregators. `validation-<job>` report artifacts expire after three days.
`scripts/ci-scope.mjs`
reports paths for evidence only; path category and draft state never skip a job.
The user removed GitHub payment details and explicitly authorized standard public
`ubuntu-latest` Actions use. Do not register a card, change billing/budget, use
paid runner classes or assert usage is free. If GitHub blocks a run, report the
actual restriction. Long-career 100-season and real-device/TalkBack acceptance
remain deferred until all roadmap features and user playtest feedback.

## D11 long-career memory recovery (2026-10-02)

PR #110 passed its selected three-job run 36912057493 and merged as
4572b15ee9806e8dd403c264377bd50f37f13131. Lightweight main publication
36912274078 succeeded; generated standalone commit 960f46d is the new baseline.
Those Actions settings describe the policy at that time and are superseded by the
full-run validation policy above.

The prior-engine 100-season process 26248 terminated with native V8 heap exhaustion
after 30 completed seasons through 2056. Its last boundary save was 124,761,960
bytes and heap 1,277,779,048 bytes; fatal GC reached about 2 GB. Its JSON still
says running because native OOM bypassed JavaScript error handling. Preserve the
original .diagnostics/daily-local-1.json and stdout/stderr; do not treat it as a
live process, a passing 100-season run or evidence for the merged engine.

save.js now interns repeated restored meta-history strings and shares immutable
item/rune loadouts. A bounded 4096-combination dictionary avoids retaining every
unique build key while loading. Encoded rows are replaced progressively so old
compact containers can be reclaimed. No historic match, player, item, rune,
patch or query dimension is removed; existing v15/format 1 and 2 saves remain
compatible. Shared loadouts must not be mutated by evidence consumers.

The daily QA runner releases old fixture references and serialized saves before
the next restore, records before-save/before-restore/after-restore memory stages,
checks heap/RSS budgets at these boundaries and reports meta-history row counts.
This distinguishes engine history growth from QA-held copies and preserves the
last observed stage if a native crash bypasses normal failure reporting.

Local evidence: regression passes including 6000-game archive roundtrip, sharing,
immutable evidence, legacy order/duplicate slots, historic query and insight
counts. Static validation checks 93 modules. A separate synthetic 60,000-game
restore probe retained about 382 MB before vs 77 MB after (same 140 MB serialized
history, forced GC for measurement). This is a repeated-loadout synthetic case,
not a mobile benchmark or proof of real 100-season completion. Real daily seed
d-memory-resume passed one season, 128 ticks, 258 fixtures, 46 managed games,
international competition and checkpoint restores; save about 6.1 MB,
heap 160 MB/RSS 714 MB at the reported boundary.

Next: run the final engine PR's required CI once; then validate current-engine
long careers without duplicating runs, including varied loadouts and mobile memory
limits. Remaining D04/D07-D10 mechanisms and D12/D13 remain open. Whole D11/D
must not be marked complete from this memory improvement or a bounded year.

## D07 connected staff employment batch (2026-10-02)

Baseline: generated main 6f0d83d after merged #111. Staff are now continuing
people with a primary job, secondary specialty, public estimate, ambition,
fixed annual wage, 1–3-year contract and dated employment history. Secondary
expertise supplements its corresponding coaching/analysis/recovery/scouting
effect at 35% weight. Old staff retain their IDs and primary ability/effects;
restoration supplies a current two-year employment baseline and public estimate,
without inventing past events. Previously closed legacy clubs return their staff
to the free market instead of inventing new historical compensation claims.

Public/interview estimates are stored observation data. Changing hidden ability
does not silently change an existing dossier or interview. Club-specific annual
interviews narrow uncertainty; AI ranks staff with observations, not exact rating.
The worker's asking wage is a public demand. Personal consent considers wage and
club reputation weighted by ambition. AI cannot poach managed-club staff.

staff-contracts.js owns sign/renew/release/expire/retire/interview commands via
the existing guarded action gate. Payroll uses agreed absolute annual wages,
without applying regional scale twice. Hiring/renewal checks one year's liquidity
and final forecast payroll; the agreed wage is charged through annual finances.
Termination/buyout uses a common 50% of remaining annual wages, without adding
an individually negotiated guarantee setting. Poaching pays the existing finance
transfer writer; termination uses prepaid severance without annual double charge.

At a full department, outgoing termination and incoming employment are one
transaction. The shared preview contains both compensation costs and the final
payroll change. Late failure restores original people, roster/pool identities,
contracts, histories, interviews and finance. AI prefers replacement in the same
primary job and uses this same command. Department limits 9/4/6 remain enforced.
The market exposes year/wage terms, an optional replacement selector, interviews,
guarded confirmation and 20-person pages; exact staff ability is no longer shown.

Expiry and retirement preserve the person and career. AI renews through the same
contract command if affordable; managed appointments expire into free agency
without auto-replacement. Retired people have a separate historical archive.
Club closure includes staff claims in the existing proportional player/staff
allocation and parent/reserve funding. Cash-short unpaid claims remain recorded;
employees return to free agency, and closure rollback restores employment too.
Existing player-only closure arithmetic tests use expired staff contracts to
isolate that policy; new acceptance separately covers nonzero staff creditors.

Local validation: dedicated staff acceptance covers offers/cancel/confirm,
observations, secondary effects, periods/renewal, budget/caps, consensual poaching,
cash conservation, replacement including full-department AI, late rollback,
expiry/retirement, insolvent closure/stale preview/escaped creditor UI, legacy and
current saves. The shared UI/finance/contract runner passed 32 cases in 28 fresh
contexts, regression and core smoke passed; 94-module static validation passes.
Final required CI is the merge gate. Broad long-career staff retention/balance and
actual mobile interaction are not proved by these bounded tests.

D11 updated failure: the single #111-engine local run daily-memory-main-1/PID7512
ended after 23 completed seasons through 2049, during 2050 offseason, with the
old AI hireStaff department-cap exception, not OOM. Its last completed save was
about 56.8 MB/heap 1164 MB/RSS 1987 MB; the final after-restore checkpoint was
heap 615 MB/RSS 1721 MB. Preserve JSON/stdout/stderr/process metadata. This D07
batch replaces that old two-step staff replacement with the atomic command and
tests the full-department production caller. Do not call this failed run passing
100 seasons or evidence for this new engine. Next long run must use a merged,
verified current engine and must not duplicate any live daily-career process.

Remaining: broader staff/AI career and balance evidence in D11, D04 remaining
agency/insolvency mechanisms, D08 relationships, D09 resource commitments,
D10 controlled patch/match experiments, D12/D13 complete task acceptance.
The full D stage remains open.

## D07 competition staff registration (2026-10-02)

Club employment and tournament on-site registration are now separate state.
An office may publish a per-region or international `staffRegistration.max`
policy; no cap is fabricated when the policy is absent. Before the first
fixture, managers select only their current employees in the roster screen and
AI clubs submit their own bounded list from the same employment roster. The
entry locks at the first fixture, so an international event remains fixed for
its duration. Existing employment, salaries, department limits and player
registration stay unchanged.

The guarded `competition.staff-register` command validates authority, club
employment, duplicate IDs and the published cap. Its preview is read-only;
late writer failure restores every season's staff entry. Current saves retain
entries and malformed stored entries are rejected. Focused acceptance covers
AI/manual authority, cap and foreign-employer rejection, preview/rollback,
save restore and first-fixture lock. The shared UI/finance/contracts runner
passes 38 acceptances in 35 isolated engine contexts, and static validation
checks 104 modules. This records registration administration; field-effect
balance and long-career/mobile evidence remain D07/D11/D13 work.


### D08/D09 connected cohesion and practice batch (2026-10-02)

Base: latest validated main 167a5d3 (generated standalone after #112).
Current lineup cohesion derives a bounded 15–85 target from teammate bonds,
team adaptation and manager trust. Official and private matches use the actual
five, so a replacement does not inherit the departing lineup's entire bonus.
Series and daily recovery approach the target; market close no longer awards
an unconditional seasonal bonus. Severe teammate conflict affects satisfaction,
renewal willingness and prolonged transfer requests using existing state.
Relationship reads are pure, preserving preview/rollback boundaries. AI uses
its own observed bonds/adaptation to choose practice focus, with saved reasons.

practice-resources.js owns the daily 100-point time budget. A scrim set consumes
10 points for both clubs; remaining points are split among individual drills,
champion practice, tactics and teamwork. Existing 100-point attribute allocation
subdivides individual drills. Focus is selectable in squad editing. Daily time
commitments persist through save/reload and cannot run twice or admit a later
scrim after drills consume the day. Individual time contributes to seasonal
growth; champion drills replace the free seasonal training grant for careers
with daily practice evidence. Rest/rehab players skip drills; official days do
not provide drills. Old plans retain attribute allocations and use balanced
focus, with old current-day scrim logs counted as spent time.

International participants use the existing event's host region/time zone from
five days before the first fixture through one day after the last fixture.
Partner assessment, AI candidates and actual clock overlap share that venue;
remote home clubs remain inaccessible unless located in the same host region.
The existing near-official-rival embargo and mutual acceptance remain intact.
This is bounded tournament attendance, not a new flight/visa/travel simulator.

Files: player-relations, engine, offseason, development, calendar, scrim,
scrim-partner, timezone-calendar, practice-resources, ui-roster and test manifest.
Local evidence: same-seed real match changes under different bonds, no neutral
cohesion buff, bounded recovery, new-lineup penalty, satisfaction/renewal, AI
response, resource tradeoffs/idempotence/restore and international entry/exit.
Shared runner 33 acceptances/29 contexts, calendar/scouting 7, regression and
95-module static/build passed. Full required CI remains the merge gate.

Remaining D08/D09: broader relationship-aware recruitment/selection scenarios,
long-term conflict and recovery balance, explicit player-specific conversion
time accounting, manual partner request workflows and actual mobile focus
editing. Do not mark whole D08/D09 or D complete from this bounded batch.

D11 observation: #112's local PID40204 is absent and exec session55031 no longer
exists. Original JSON still says running, but only 34 seasons through 2060 and
an after-restore checkpoint in 2061 exist. No stderr error identifies the cause.
Preserve original files and daily-staff-main-1.observation.json. This is an
interrupted, incomplete run, not a proven OOM or a passing 100 seasons. Do not
restart the same engine automatically or use it for this newer batch.


### D09 conversion time and scrim scheduling batch (2026-10-02)

Base main79aaa5f, after #113's verified engine and standalone publication.
Role conversion now uses 25% of each converting player's individual drill
allocation, rather than an independent pre-scrim daily tick. A normal balanced
100-point day supplies 12.5 conversion points; six scrims leave 5. Progress
scales with available time, while training-day counters count actual attended
days. Rest/rehab and official days do not grant conversion drills. Player-level
remaining individual time is accumulated and used by seasonal growth; the old
flat conversion growth penalty is retained only for legacy accounting, avoiding
a second charge for recorded daily conversion work. Save/reload preserves time
and progress. Remove the unused advanceRoleConversionsDay bypass.

The daily AI scrim batch precomputes tournament venues once and shares two
clock ranges per time zone among candidates. It does not persist a stale cache
in the save. Direct partner assessment and booking still use canonical venue
and time checks; a context from another date falls back to fresh calculation.
Tests compare all clubs and both blocks against uncached venue/time results,
including international visits, and count clock conversions: cached comparisons
add no clock conversions, with over fivefold fewer conversions in the fixture.
This is a reduction in repeated work, not Android battery/performance proof.

Files: practice-resources, role-conversion, development, calendar, scrim,
scrim-partner, timezone-calendar and existing cohesion/practice/partner tests.
Local tests cover time conservation, heavy-scrim opportunity cost, player-level
growth factor, no double penalty, rest/official exclusion and reload idempotence.
Shared 33 acceptances/29 contexts, calendar/scouting7, regression and static
95 modules/build pass. A missing legacy practiceUsage field found by the
training acceptance was fixed before posting final CI. Final required CI is
still the merge gate; do not mark whole D09/D or actual long-career/mobile
validation complete.

Next connected work: manual partner request/consent/scheduling workflow,
relationship-aware recruitment/selection scenarios and supervised long-QA exit
records. No 100-season run was duplicated or restarted during this batch.


### D08 relationship decisions batch (2026-10-02)

Base main261587e, published after verified #114. The role-fit assignment DP
remains additive and deterministic. Two bounded bench-substitution passes then
compare full lineups with at most +/-10 total score from average teammate bonds.
This avoids pretending pair interactions are additive DP terms. Large role-fit
gaps still win; explicit locked starters are preserved and the human club's
selection is never overwritten by AI. Production AI records before/after, score
change and observed relationship reason when it changes the starting five.
This is a bounded local refinement, not an exact globally optimal pair solver.

After real own-team official play or joint drills, clubs record observed pair
relationships. These saved reports belong to one club, retain at most512 recent
pairs, and lose certainty toward neutral over730days. AI recruitment adds at
most +/-2 points using only that club's recorded evidence. Unknown pairs are
neutral and current hidden relationship changes cannot silently update a report.
A player independently remembers their own teammate bonds; these change offer
utility by at most +/-0.2. Changed teammate bands enter negotiation situation
reopening and player action snapshots, preserving stale consent protection.
Personal relationship history itself is not pruned by observation retention.

Files: lineup, player-relations, practice-resources, contracts,
contract-negotiation, state-player-actions, relationship-decisions acceptance
and existing runner/package wiring. The new acceptance checks near-equal bench
choice, strong ability gaps, locks/human authority, actual AI changes, club report
isolation, stale evidence, player willingness, snapshot/reopening and saves.
Shared runner34 acceptances/30contexts, calendar/scouting7, regression and
95-module static/build pass locally. Final whole mandatory CI is the merge gate.

Remaining: D08 long-term conflict/retention/recruitment balance and mobile
workflows, D09 manual partner request/consent/schedule, D11 supervised process
exit evidence and actual multi-seed100seasons. Existing failed/interrupted
diagnostics remain preserved; no long run was duplicated. Whole D remains open.

### D09 manual scrim bookings (2026-10-02)

The squad screen can request 1–3 sets in an afternoon/evening block tomorrow
through seven days ahead. Both clubs must have compatible local practice venues,
overlapping UTC times, healthy rosters and free capacity; scheduled official
matches and the existing competitive secrecy window remain authoritative.
The requesting manager supplies their own consent. The opponent uses its existing
training preferences with a deterministic pair/date/block response. Accepted,
declined and cancelled requests persist in the world ledger. Changing set count,
reversing clubs or cancelling cannot reroll that response. Owned reserve coaches
can arrange their own squad's practice, while AI cannot reserve the human squad
without a manager request. Routine automatic practice remains available.

Accepted bookings run before routine AI practice and drills on the actual daily
tick. Both clubs spend the existing shared practice budget, and private logs occupy
their block. Changed fixtures, health or venue can block execution without a free
practice grant; missed dates do not grant retroactive practice. Cancellation
releases both slots. Old saves have an empty optional ledger. Future responses
remain until their date; finished history retains at most128 rows for14days.
Request/cancel actions use the existing pure preview, stale-state gate and atomic
rollback, preserving the original ledger reference after a late failure.

Files: scrim-plans.js, ui-scrim-plans.js, calendar, state-rollback, ui-roster,
module manifest, package and calendar/scouting acceptance runner. Dedicated
acceptance covers consent/refusal, both-party reservation, authority including
owned reserves, embargo/recovery, cancellation, save/load, stale and late rollback,
actual private games/shared costs, changed fixtures and the production daily tick.
Calendar/scouting8 acceptances pass locally. Full mandatory CI remains the merge
gate; D09 long-term scheduling balance and D13 real mobile task evidence remain
open. D11 supervised execution and actual multi-seed100seasons are still pending;
no long run was started or duplicated by this change.

### D11 supervised run evidence (2026-10-02)

The existing ci-run observer now writes an atomic `<label>.process.json` before
completion: parent/child PID, start time, tracked source revision/dirty status,
runtime and career seed/budgets. Daily-career commands also fingerprint the engine
module source at spawn with SHA-256. Keep the checkout stable during startup:
this fingerprint identifies the pre-spawn source, not edits made while a child
loads its own VM. A 30-second unreferenced timer records liveness without busy
polling. Normal child closure records end time, exact exit code/signal and spawn
error; the existing final JSON/log, evidence markers and command exit behavior
remain available. If the observer itself disappears, a stale `running` record is
still incomplete evidence: check both PIDs and logs, and retain unknown cause.

The manual long-career workflow uses this observer, explicit1536MiB heap and
4096MiB RSS limits, and3-day report retention. It does not dispatch automatically.
Files: scripts/ci-run.mjs, scripts/ci-run.test.mjs and long-career workflow.
Tests cover success, failure, failed spawn, a live child observed before completion
and forced child termination on Windows. All10 runner/scope checks and97-module
static checks pass locally. A Windows unsigned process exit differs from the
signed child error code; lifecycle tests compare the exact recorded child outcome.
CI orchestration changes use the existing static/scope gate, without repeating
game suites. Before a real run, check that prior PIDs are absent, use a fresh label
and reports directory under preserved .diagnostics, and run a single validated
engine. This change does not prove100seasons or explain the earlier missing parent.

### D10 aggregate skill interactions across fight phases (2026-10-02)

Fight entry now compares each side's current skill control and mobility profile,
including equipped item/rune mobility. The existing cached combat calculation
exposes its skill profile; this avoids a second skill extraction per participant.
Entry probability changes by at most0.08. Burst exchanges give reach more weight
when engagement fails, control contests opposing mobility, extended exchanges
compare cooldown uptime and escape/control, and cleanup compares mobility.
Every phase multiplier stays within0.92–1.08. These are explicit game simulation
assumptions layered onto the existing kit model, not Riot damage/cast formulas,
spell cooldown clocks, hitbox geometry or full individual Q/W/E/R reproduction.
No additional random stream is consumed, and saved career data needs no migration.

The dedicated acceptance checks opposing control/mobility, failed-entry reach,
extended cooldown effects, cleanup, bounds and finite profiles for172 current
champions. Eight paired seeds preserve players, draft, RNG seed and base kit while
actual applyNote skill patches alter control, range and cooldown independently.
Each patch changes actual match gold trajectories; combined and separate metrics
report damage, duration and wins. These small causal fixtures do not prove win-rate
balance or that damage totals must rise after a buff: fights may end earlier.
Patch profile save/restore and match isolation are also covered.

Files: engine.js, fight-skill acceptance, calendar/scouting runner and package.
Local calendar/scouting9 acceptances, shared34 acceptances/30contexts, regression,
97-module static/build pass; final whole mandatory CI gates merge. Further D10
draft/meta/item/rune controlled experiments and multi-patch balance remain open.
The existing single100season QA continues with the source loaded before this
change and must not be used as evidence for these new fight mechanics. D remains
open, including actual mobile/TalkBack and multi-seed100season proof.

### D11 observed save peak and bounded encoding (2026-10-02)

The supervised #116-engine run completed32seasons through2058 and failed during
2059 offseason at before-restore: heap1,644,354,104bytes exceeded the unchanged
1536MiB QA budget; RSS2,226,302,976bytes remained below4096MiB. The observer
recorded exit1/signal null at2026-10-02T00:17:36.099Z, so this failure has a known
invariant cause rather than unexplained disappearance or native V8 OOM.
Original .diagnostics/daily-supervised-main-1 reports/logs remain preserved.
This was not100seasons and did not exercise the later #118 fight changes.

packDB previously expanded the entire history into encoded arrays alongside the
live history and complete JSON output. It now serializes at most512 history rows
per batch and appends their JSON array content to the root JSON. packMetaHistory
remains the ordinary array API; stringifyMetaHistory owns bounded packing. Format2,
metaHistoryPacked1, every row and nested item/rune evidence remain unchanged;
root property order may differ. No forced GC, archive truncation or memory-budget
increase is used in production. A Proxy prototype produced no measurable peak
improvement and is absent from the final implementation.

Separate Node24 processes with60,000 synthetic rows produced identical140,220,001
byte history text and SHA256. Observed additional heap fell230.35→144.52MB;
total observed heap388.01→302.18MB, elapsed714→635ms. This desktop synthetic
fixture measures encoding, not mobile performance or100season retained memory.
The benchmark uses forced GC only before measurement; production does not.
Dedicated acceptance covers exact history JSON parity across batch boundaries,
512-row limits, source purity and full current-save restoration. Existing6000-row
archive/legacy/current regression and97-module static/build pass. Calendar/scouting
runner now10acceptances. Full mandatory CI remains the merge gate. Another actual
long run is only meaningful after the corrected engine is validated; do not erase
the32season failure or claim this change proves100seasons.

### D04 recovered cash after club closure (2026-10-02)

Closed clubs retain mirrored transfer receivables and payables. The existing
daily transfer-payment pass now follows collection/payment with a system-only
estate distribution. Actual remaining cash above existing guaranteed transfer
commitments pays remaining player, staff and unattributed legacy release claims
in the same proportions as the initial closure policy. Pending, unearned bonuses
do not become guaranteed debt; agreed installment dates remain unchanged.
No facility valuation, owner donation, debt cancellation or fictional cash is
introduced. Closed estate cash retains fractional proportional balances when
receiving or paying decimal invoices, avoiding rounding money into existence.

finance-estate.js owns the recovery plan, command and accounting. The original
closure settlement stays immutable; cumulative recovered payouts and a bounded
20-entry distribution journal are separate. Remaining obligations and legacy
unattributed balances continue to be the unpaid balance source of truth. Pure
previews, authority checks, financial snapshots and the existing rollback journal
prevent stale or partially applied distributions. Saves need no schema migration;
repeated dates cannot repeat completed payouts.

Acceptance exercises actual closure, two later receivable installments, an outgoing
guaranteed installment and an unearned bonus, proportional player/staff/legacy
payouts, fractional conservation, complete payment, current save, stale plans and
injected late failures restoring the original finance reference. Shared35
acceptances/31 engine contexts and98-module static/build pass locally; final full
mandatory CI gates merge. D04 remains open: initial closure funding does not yet
combine all transfer creditors into one insolvency waterfall or liquidate assets.
This recovery policy protects existing guaranteed commitments after closure
rather than declaring a general creditor-priority or accelerated-invoice policy.

The single daily-batch-save-main-1 long QA remains on its original #119 source;
it does not validate this estate change. No second long run or paid long workflow
was launched. Long-career balance, other D work and real mobile evidence remain.

Estate UI follow-up shows cumulative initial plus recovered payouts and the current
unpaid balance. Initial itemized distributions are explicitly historical; recent
additional payouts appear separately. A local render fixture checks current totals,
escaping and read-only rendering; existing closure acceptance and build pass.
This separate UI-only change uses selected UI/build CI, preserving the successful
engine validation instead of repeating paid medical and seasonal suites.

The first UI run exposed a scope bug: a newer standalone publication on main
appeared in a two-tip diff as a change from the older UI branch, selecting full
CI unnecessarily. PR scope now diffs its merge base to its head; push scope still
uses before/after. A real temporary Git-branch fixture reproduces base-only
publication and verifies it is excluded without hiding unknown head changes.
The superseded UI run is cancelled by concurrency when this correction is pushed;
the estate engine's already successful mandatory run is not repeated.

### D10 controlled item/rune patches and actual inventory (2026-10-02)

The reusable system-patch experiment runs8 paired seeds in both side orders.
Players, teams and fixed drafts stay unchanged across no-op, item effect, item
cost, rune effect, combined and exact reverse-patch scenarios. An additional
adaptive draft path reports changed champion selections without requiring every
small adjustment to cross a pick threshold. Warm system/profile/strength/selector
caches are compared with cold equivalent patches. Save restoration must reproduce
the same actual match trajectories, inventories and rune pages; isolated runs
must not mutate the career. Completed matches feed the existing public meta
evidence. Damage, duration, wins and changed-match counts are descriptive causal
fixtures; this intentionally fixed roster is not a balanced population, and its
16/16 team wins cannot estimate real win rates or prove long-term patch balance.

These experiments exposed three equipment issues. simulateMatch discarded every
starter immediately after newPS had selected and charged for it. Starters now
remain equipped. Component crafting could expose seven or more items when a game
ended midway through a recipe. advanceItemPurchases now waits for sufficient gold
to combine a full-inventory component chain atomically into at most six items;
an affordable final build must still complete. Finally, cost patches with missing
legacy recipeCost applied the price delta twice. applyNote now bases the fallback
recipe on the old total price, and forward/reverse changes preserve it exactly.
Starter disposal uses the existing inventory rule without inventing resale cash.

Acceptance covers160 actual first-tick player inventories and8181 source-champion/
role purchase thresholds, full affordable builds, an explicit blocked-seventh-slot
recipe, exact gold threshold and repeated-income idempotence. The four independent/
combined treatments each change actual fixed-draft matches; no-op and rollback
reproduce the baseline exactly. The default experiment finishes locally in about
8seconds; npm run qa:system-patches accepts LOL_GM_PATCH_SEEDS=2..64 for explicit
additional paired samples. It is developer QA, not a restored simulation game menu.
Calendar/scouting11 acceptance contexts, regression and98-module static/build
pass locally; the final mandatory CI gates merge. No balance constants change.

The live single100season run still loads the #119 engine and cannot prove this
equipment change or estate recovery. D10 long-run balance, D11 multi-seed100season
proof and D13 real mobile tasks remain incomplete, as do other documented D gaps.

### D11 batch-save long-run failure preserved (2026-10-02)

daily-batch-save-main-1 on #119 completed36 annual rows through2062 and failed
the1536MiB heap invariant after the2062 annual report/market-save-size measurement.
The observer recorded exit1/signal null at01:34:37.989UTC; both processes14124/3280
are gone. The final row has53873 history rows,116444134 save bytes, heap1732736088
bytes (memory.heapUsed1732736352), RSS2420989952 and arrayBuffers116587745.
The preceding2063-01-06 market after-restore checkpoint had heap1366938560 and
RSS1917472768. Thus the stale last checkpoint is not the over-budget sample;
the annual row is. This is a known explicit QA failure, not native V8 OOM or
unknown termination. All original .diagnostics/daily-batch-save-main-1 files are
preserved; no budget increase, forced GC, archive removal or replacement long
run was used. The next memory investigation should distinguish retained history,
save encoding/materialization and the extra TextEncoder size-measurement buffer
without treating removal of a measurement as proof of mobile or100season safety.
This old-source execution is not evidence for estate recovery or this D10 change.


### D11 rolling restoration windows (2026-10-02)

The short cohort probe reproduced a restoration defect: the first4096 unique
loadouts filled the dictionary permanently, so later seasons never shared new
recurring builds. Restoration now evicts the oldest dictionary insertion at4096
loadouts and8192 canonical player/champion pick records. These temporary FIFO
windows disappear after loading; every historical row remains present. Shared
records and loadouts are immutable. Extended legacy records retain separate
identity and all extra fields; restoring already-frozen evidence works again.
No save schema, archive retention, production GC or QA memory budget changes.

The preserved desktop probe uses54000 rows, nine successive512-build cohorts.
Original versus final restored retained heap after benchmark-only GC was
138132176 versus49430960 bytes (about64% less). Output remains120586801 bytes
with identical SHA256 ab510b4ba8fbf149b1508672afde59a6983c32a4f1c22cf1dbab52bf789ea3fa.
Combined restoration/serialization/size-measurement elapsed time increased from
2808 to4052ms in these single runs; sharing trades extra lookup work for lower
retained memory. Automatic GC timing differed during TextEncoder measurement,
so those samples are not a reliable peak reduction claim. The extra120MB buffer
still exists. This synthetic cohort fixture does not prove that the preserved
36-season failure is solved, nor establish100season or mobile memory safety.
The reference source, probe and final JSON remain in .diagnostics; no new long
run has been started before validating the engine change.

save.js owns restoration sharing. save-history-acceptance covers late cohorts
beyond both window sizes, exact evidence and item order/duplicates, separate
players, frozen repeated restoration, extended legacy identity, format parity
and full-save restore. Related acceptance, regression and98-module static/build
passed locally; final required CI must pass before merge. D11 actual multi-seed
100seasons and D13 real mobile tasks, plus other documented D gaps, remain open.


### User priority: patchable role quests (2026-10-02)

The user explicitly requires LoL role quests for TOP/JGL/MID/ADC/SUP, and their
progression conditions and rewards must change through the game's patch system.
This is the next D10 connected implementation, not a completed feature. Use
existing match income, damage/takedowns, objectives, equipment and vision events;
do not complete quests merely at a fixed match minute. Quests belong to the
selected match role, including off-role champions. Rewards must affect actual
experience/level limits, equipment/economy and relevant combat/map decisions.
Expose progress/completion in the existing match UI without restoring the removed
simulation menu. Preserve deterministic seeds, current/legacy saves and official
series restoration; prove one-time rewards, changed completion timing, patch
rollback and historical rules retained after later patches.

Keep quest rules in the patch-owned baseline/notes/snapshot pipeline, rather than
hard-coded per-role buffs. Respect existing immutable patch history and cache
invalidation; old saves need an explicit compatible default. Match-local quest
state and reward equipment must remain separate from permanent player growth.
The aggregate engine has minute ticks rather than geometric lane positions:
document measured lane/roam proxies and avoid claiming literal client parity.

Official sources checked: Riot26.1 introduces quests;
https://www.leagueoflegends.com/en-us/news/game-updates/patch-26-1-notes/
Riot26.9 changes lane/roam progression, top XP, mid reward and bot takedown gold;
https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-9-notes/
Riot26.11 updates mid bonus AD/AP;26.16 updates boots/support progression;
https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-11-notes/
https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-16-notes/
Riot26.19 updates top quest teleport cooldown. Read full relevant source sections
before finalizing constants; do not ship26.1 rewards as current26.19 rules.
https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-19-notes/

Memory PR123 passed all required CI36954074617 and merged as91ca28db9c9260e746ae7cf4d3696037024ef036.
A single same-seed local100season run now uses that source: daily-rolling-history-main-1,
parent33552/child21132, started02:13:19.199UTC, source hash012a48fa3c5186c99bcbef3cc7cad76a5b740fd3a63768222c95e70ec24fe3e0.
Original1536MiB heap/4096MiB RSS QA budgets remain. The initial restored2027
checkpoint passed. All .diagnostics output remains preserved. This running VM
cannot validate subsequent role-quest code; do not start a second long run or
interpret running/partial reports as100season completion.


### Validation sequencing changed by user (2026-10-02)

The user explicitly instructed: finish all feature implementation first, then
perform100season and actual mobile/TalkBack validation. Do not launch further
long-career or real-device/TalkBack runs during feature development. Retain short
change-specific correctness checks and the minimal required CI merge gates.
Prioritize patchable role quests and remaining D game mechanisms.

The live daily-rolling-history-main-1 was deliberately stopped at the user's
request on02:22:10UTC. Child21132 and observer33552 are now absent. The observer
captured forced termination exit4294967295/signal null; the cancellation.json
records the user-requested reason. The last report had at least11 completed
seasons; the original running career JSON is partial, not success. This is a
cancelled validation run, not a newly diagnosed engine/memory failure. Preserve
all existing reports and leave full D acceptance pending until final validation.


User clarified the final sequence: complete the entire roadmap through phase23,
provide the playable HTML for their playtest, receive and address their feedback,
then run the deferred final long-career and actual mobile/TalkBack validation.
D-stage feature completion alone must not trigger those deferred tests. Keep
short change-specific checks and minimal required CI during implementation.
Android packaging/installation final evidence remains required at the appropriate
roadmap/final validation step; do not call the game fully complete beforehand.


### Role-quest domain foundation (2026-10-02, work in progress)

feature/patchable-role-quests now contains role-quests.js with patch-owned rules
for all five roles, bounded validated role_quest notes, per-match immutable rule
snapshots and action-derived progress. Sequenced events reject duplicate awards;
malformed events are rejected before state mutation. Lane/roam bank, melee/ranged
damage coefficients and role-specific gold/stacks are domain inputs, not a
fixed-time completion shortcut. buildPatch owns default26.19 role data and
applyNote participates in historical replay/reversal. Missing old quest rules
remain absent rather than being silently enabled by createRoleQuest.

Short acceptance passes all five action transitions, no-action/no-completion,
patch snapshot isolation/exact reversal/invalid atomicity, duplicate rewards,
roam banking, historical patch isolation and current-save restoration.99-module
static checks pass. The new fixture joins the existing calendar/scouting runner.
No new paid CI or long/mobile validation was launched.

This is a commit-ready domain foundation, not a playable quest feature. Next:
wire engine events and one-time rewards into actual income/experience/damage/
objectives and inventory; handle boots/reward slots without breaking six normal
slots, update combat cache identity after rewards, implement generated patch
changes and concise match/patch UI, and prove actual paired match causality.
Confirm full official reward/boot data and legacy historical-rule policy before
marking runtime complete. Final ready PR bundles this with those adapters.


### Role quests connected to actual matches (2026-10-02)

The five-role domain now receives actual income/CS, champion damage and takedown,
structure and epic-objective events. Completion changes match experience/levels,
item-derived mid power, bot bonus income and separate boot slot, jungle income/
smite/river-fight mobility, support reward selection and paid control-ward vision,
and top objective-call teleport joins. No extra random stream is introduced.
Generated seasonal/minor patch notes can adjust progress requirements and rewards
within bounded baseline-relative ranges. Patch UI names these changes; player
results show progress or completion minute. Match rule copies remain isolated
from later patch notes; initial quest baseline is persisted for historical replay.

Quest upgrades exposed an existing data issue: source tier3 boots and support
reward items were treated as ordinary shop purchases. New quest-enabled games
select tier2 boots; mid upgrades them free after completion (including later
purchase), bot moves boots out of six regular slots and extends its final build,
and support reserves its World Atlas slot and replaces it with a source reward.
Bootless Cassiopeia does not gain an extra normal slot. Ward expenses reduce the
existing purchase threshold budget rather than providing unearned spending.
All quest equipment participates in combat and archived item evidence.

This remains the existing minute-based aggregate model. Lane absence is inferred
from actual off-lane fights and recalls; jungle camps are CS-derived equivalents
plus a bounded treat proxy; support charge consumption is a live-partner proxy.
There is no geometric lane-swap, spell choice/shield or precise pet/ward placement
simulation. Mid bonus AP/AD uses the model's item-derived offensive-stat surrogate.
These assumptions are explicit rather than literal client parity claims. Existing
old saves without role rules stay on their legacy behavior, including historical
patch replay; fresh games use26.19 rules. Future compatibility changes must not
silently rewrite those old matches.

Short fixtures cover all-five-role completion timing changes in four paired
actual games, isolated career state, current-save exact trajectory, legacy absence,
normal six-slot/quest-boot separation, support upgrades/paid wards, top level20/
takedown XP/teleport cooldown and same-tick combat-cache reward invalidation.
Rules and system-patch fixtures plus100-module static/build passed locally.
Full required CI gates final merge; no100season/mobile/TalkBack run is scheduled
until phase23 implementation and the user's playtest feedback have been addressed.
Remaining broader D work and final balance acceptance are still open.


Connected calendar/scouting validation passed13 isolated contexts. A prior skill
fixture implicitly selected Xerath (current aggregate CC profile0), so a scalar
CC buff was mathematically a no-op; it also required every cooldown change to
change gold instead of damage. The fixture now explicitly picks a nonzero-control
champion and requires both a profile change and an actual damage/gold/duration
change. It does not lower the eight paired seeds. The observed source-profile
limitation remains a follow-up for richer skill inference, not a claim that
Xerath has no crowd control in real LoL. The diagnostic probe is preserved.

PR124's first full CI36959095461 passed the quest, calendar, regression and other
game checks but the regional medical observer crashed on its same-day emergency
registration fallback: trackExposure referenced a DB outside its lexical scope.
The observer now receives the current DB explicitly. A short real-engine fixture
exercises missing daily-plan fallback and verifies one registered athlete-day
without fabricating prior healthy exposure or lottery odds. The original medical
seeds and aggregate acceptance requirements are unchanged; final CI remains a
merge gate. Long-season and mobile validation remain deferred by user request.

### D04 initial closure funding protects transfer commitments (2026-10-02)

Initial club closure now reserves existing guaranteed mirrored transfer invoices
before proportional player/staff/legacy release payments. Parent support needs
include those invoice commitments, and closing reserves cannot return protected
invoice cash as surplus. An active parent protects its own committed transfers
and obligatory loan purchases before supporting a closing reserve. Closing loans
return first; their unactivated purchase obligations are not invented as debt.
No invoices are accelerated or written off, contingent unearned bonuses remain
contingent, and no asset price or cash is fabricated. This extends the existing
fictional reservation policy used by post-closure estate recovery, not a claim
about real insolvency law or a new general creditor priority waterfall.

The closure statement records reservedTransferAmount and totalClaimAmount beside
the unchanged release-payment totals; missing legacy fields remain compatible.
Preview includes funding and reservation, current finance snapshots reject stale
invoice changes, and existing rollback keeps original finance object references.
Short fixtures cover active-parent support with both parties owing invoices,
whole-organization closure without stealing reserve invoice cash, the original
payment date and mirrored creditor receipt, current-save restoration, stale
invoice rejection and late rollback. Existing closure/estate tests pass locally.
General insolvency restructuring, asset recovery and representative/promise
extensions remain open. Final required CI gates merge; long/mobile checks wait
until phase23 implementation and user playtest feedback as directed.

### D04 consensual oral role revision (2026-10-02)

An active oral role commitment can now be reduced only through explicit player
consent under the existing renewal utility/market-floor policy. Same/higher-role
requests cannot reset the usage window, signed role rights cannot be reduced by
an oral agreement, loan/medical contracts and unauthorized callers remain blocked.
Current salary and remaining contract terms are evaluated without a new signing
bonus, cash payment or invented agency commission. Player decisions use detached
views; the preview snapshots the consent result as well as ownership and usage.

The player/coach confirmation surface uses the shared guarded action, and AI role
balancing uses the same consent when a player loses their starting opportunity.
AI proposals stop at the signed role floor. Accepted revisions begin future usage
at the agreement date; the old fulfilled/broken usage evidence and consent are
preserved in a career event, while already-earned satisfaction/trust consequences,
salary and signed contract remain unchanged. New contracts still use the existing
negotiated writer. No promise can be silently replaced to erase prior evidence.

Short fixtures cover accept/refuse, signed floor, same-role reset protection,
manual/AI/owned-squad authority, stale willingness, late rollback/player identity,
prior medical-adjusted usage, current saves, UI cancel/confirm/save and production
AI roster adjustment. Existing signed-role acceptance passes. Full CI gates merge;
long-season/mobile validation remains deferred until23 and playtest feedback.
This addresses oral revision, not unspecified multi-client agency fees or all
remaining insolvency and later-roadmap functionality.

### D06 club sporting-format consultation (2026-10-02)

Independent first-division clubs can submit annual regional preferences for
number of splits, playoff series length and standings aggregation. Human clubs
abstain unless they explicitly submit; AI clubs use their own operating funds,
roster fatigue and public fan/balance indicators. Reserves do not cast an extra
parent vote. Moving regions or advancing the year expires old preferences, and
legacy saves without preferences remain compatible.

The existing offseason office proposals consume these advisory opinions with
a bounded +/-0.12 utility adjustment, reusing the existing noise scale. Final
office authority, reasons, original adoption threshold, cooldowns and one-decision
limit remain. Adopted changes record club support/opposition/abstention, the
announcement date and next effective season. There is no midseason change or
binding majority veto. This is a fictional implementation of the confirmed
consultation rule, currently scoped to three sporting-format fields; it does not
claim all financial/ownership regulations have a consultation workflow.

The season office card exposes a compact opinion form with guarded preview and
confirmation. Opinion submission cannot itself change league rules. Detached
assignment and the existing action journal restore the original preferences
reference after late failures. Short fixtures cover authority, purity, invalid
values, stale year/region, save restoration, same-group cooldown, midseason
protection, actual close-proposal adoption versus rejection, and UI cancel/submit.
The isolated async-route fixture now supplies the added office binder dependency;
real office submission is exercised separately. Existing 14 calendar/scouting
contexts, regression and 102-module static/build checks pass locally. Required
CI remains the merge gate; long-season and real-device/TalkBack validation stays
deferred until phase23 implementation and user playtest feedback.

### D06 joint local-service policy (2026-10-02)

The international office now reviews a regional local-service proposal in the
existing offseason path after two observed regional seasons. The game baseline
is four service seasons; regional scarcity/abundance may propose one fewer/more
season (three/five), while the international office counters a shortening from
a competitively strong region at the four-season baseline. This is an explicit
fictional policy, not a claim about real Riot residency requirements. Candidate
depth uses the existing office's local FA strength threshold and per-club depth
measure; abundance uses the existing 1.8 import-policy depth boundary and the
international counter uses the existing 1.2 weak-region strength boundary. Days
and inactive-choice validity stay as already agreed; no invented fee or cash.

Reviews are deterministic, require a changed regional request, use a four-year
review cooldown and retain both the regional proposal and international response
with evidence, announcement date, previous terms and next effective season. The
current rule remains available before that year; new service runs then consume
the pending rule. Existing service-run snapshots, earned qualifications, progress
and active local choice remain unchanged. Subsequent reviews promote the active
terms before announcing their next rule. Regional history and a permanent global
archive preserve agreements even if their region later dissolves. Legacy saves
without scheduled rules retain their original behavior; invalid pending/history
records are rejected on load. The office card shows the current requirement and
latest proposed/agreed terms and effective season.

Focused tests cover shortage agreement, competitive-region counter, abundant
local protection, no early application, old/new entrants with grandfathered
terms, no duplicate review, disabled changes, real global-office invocation,
current/legacy/corrupt saves, global archive and UI. Existing local-service and
region-continuity acceptance,15 calendar/scouting contexts, regression and103
module static/build checks pass locally. Required final-head CI gates merge;
100-season and real-device/TalkBack checks stay deferred until all23 stages and
user playtest feedback. This adds joint service-rule administration, not every
remaining office disciplinary or insolvency feature.

### D10 source-described control effects (2026-10-02)

Source normalization now records conservative Korean Data Dragon control-action
tags for stun/root/airborne/displacement/sleep/taunt/fear/silence/slow. The existing
snapshot contains173 champions and162 recognized spell descriptions. This is not
a claim that every source ability is detected. Xerath E/W previously had no
structured CC and no generated CC effects, leaving its aggregate control at zero.
Source tags now feed the existing bounded profile and actual fight phases.

Explicit numeric CC retains priority and is never counted twice. Missing numeric
duration is not filled with invented seconds: each recognized source-only spell
uses the profile's existing one-unit fallback before its averaging/0.5 conversion
and CC patch multiplier. Multiple control types in one spell do not multiply that
unit. This is an aggregate presence assumption; slow and hard control timings,
conditional casts, hit chance and geometry are not individually reproduced.
Self restriction, immunity, protective shields and Aatrox's minion-only fear do
not create opponent champion control. Conditional enemy effects remain aggregate.

Newly normalized champions retain source provenance; current saves preserve it.
Existing saved patch champions without tags remain unchanged. New worlds record
sourceControlBaseline=1; old worlds without it strip the new tags when rebuilding
historical patch baselines, preventing replay from silently acquiring new effects.
Short fixtures
cover known positive/negative source cases, explicit numeric precedence, patch
effect/reversal, current/legacy restoration, pure assessment and four paired
actual matches. Existing eight-pair fight patches and103-module static checks
pass; broader regression and final required CI remain gates. No long QA or actual
mobile/TalkBack checks are started. All23 features, user feedback and fixes still
precede final verification. Public standard runner CI is used after the user's
authorized visibility change; GitHub payment/card and billing details are removed.


### D10 source-control bilingual fallback (2026-10-02)

Pinned spell descriptions can now be classified from Korean or English source
text. When both are present, recognized types are deduplicated. The classifier
adds source-presence tags for suppression and disarm without assigning them
invented durations or treating multiple tags in one spell as extra control.
English self-immunity, negated control, and minion-only descriptions are checked
separately; “not immune to stun” remains a positive enemy effect.

The source-control acceptance covers English-only normalization, mixed-language
deduplication, negative clauses, suppression/disarm, the existing numeric-CC
precedence, patch reversal and legacy save behavior. A paired Xerath fixture
produces the same aggregate profile and actual match trajectory from equivalent
English and Korean descriptions. Existing four-seed source-only versus legacy
matches still demonstrate delivery into combat. The pinned snapshot remains173
champions; source detection now recognizes163 spell descriptions, up from162.
This does not claim full textual coverage or per-spell timing, cast choice, hit
chance, or geometry. Focused source-control, regression/smoke, static/build and
exact-head required Actions remain the validation path; final long/mobile QA is
still deferred until all23 features and user playtest fixes are complete.


## Cloud continuation — transfer clauses, international coefficients and CI (2026-10-02)

Current source baseline is `main` 0c9b8ab, matching cloud checkout commit
0c9b8ab. The latest merged PR #129 head 4a9e596 has completed required run
36971949894 successfully. Current work is integrated locally on
`codex/cloud-continuation`; exact-head PR validation is still pending.

D04 contract buyouts now store amount and type separately. Release clauses let a
transfer proceed without separate seller assent only after the full amount is
scheduled; the player must still consent and negotiate personal terms. Negotiation
clauses keep the fee as the seller's asking basis. Existing numeric saved values
remain asking-fee clauses; they do not gain a new veto-free right retroactively.
Shared manager/AI transaction validation, split settlement, stale checks, rollback
and save restoration have a focused fixture. Exact-head Actions run 36988106693
exposed two older assertions that expected numeric buyouts after the contract
schema began persisting `{amount, type}`. Regression save/restore and core smoke
expectations now assert the explicit negotiation type as well as amount. Both
focused reruns pass locally; updated exact-head Actions remain pending. This closes
one D04 contract-rule gap, not all D04.

International coefficients now use explicit fictional weights in
`worldConfig.internationalPolicy`, immutable completed-event snapshots, event-time
region attribution and a current-plus-prior-two-year weighted result window.
The actual Worlds slot reallocation uses most-recent Worlds ranks on rating ties,
then region ID. Missing history in old saves is not invented. Dedicated acceptance
covers configuration, archive idempotency, region changes, save/restore, aging,
tournament weights and slot order; it is registered in calendar/scouting and full
checks. This does not claim any real Riot coefficient values.

Independent review caught two boundary cases; both are fixed. The newest Worlds
tie-break now uses the same three-year window as ratings, and completed legacy
events without a full event-time region snapshot are skipped rather than inferred.
The acceptance now changes a participant region before archive, verifies legacy
skip behavior, and proves an out-of-window Worlds result cannot change the tie.
The acceptance is registered in both the calendar/scouting runner and full check.
`node scripts/check.mjs`, `node scripts/ui-finance-contracts-runner.mjs`,
`node scripts/calendar-scouting-runner.mjs`, and `git diff --check` passed before
the first PR run. The stale buyout-shape assertions have been updated; rerun both
failed suites and required exact-head GitHub Actions before merge.

The user removed GitHub payment details while explicitly authorizing standard
public `ubuntu-latest` Actions. Cost-driven path/draft skipping and the main-only
light gate are removed: every PR and main push selects all required validation,
with parallel shards and stale-run cancellation preserved. Docs-only main pushes
also validate/build before standalone publication. `node --test
scripts/ci-scope.test.mjs` passes locally; the full current-head Actions run is still
required before merge. No billing, budget or paid-runner setting is changed.

Cloud runtime and repository were confirmed running/connected; GitHub API access
reports administrator permissions. Shell GitHub transport failed because the
configured proxy port 8080 did not accept connections, so use the authenticated
GitHub connector for branch/PR operations if that remains unavailable. No
`.diagnostics` source was found in this checkout; do not recreate, delete or claim
to preserve the prior machine's original diagnostics.

Next connected candidates remain unfinished D04 representation/insolvency work,
D05 purchase options/conditional transfers, then remaining D06/D07–D13 and Items
13–23. All23 roadmap features still precede user playtest feedback and fixes;
100-season and real mobile/TalkBack verification remain last.


## D05 strategic AI loan recall follow-up (2026-10-02)

During its existing weekly loan review, an AI lender may now recall a loaned
player with an agreed recall clause when the current owned starter is materially
weaker according to that lender's saved scouting observations. The comparison
reuses the existing AI recruitment margin of three points; it does not inspect
hidden player ability or add a second quality scale. Existing medical-shortage
recall remains. A missing or invalid current owned starter cannot trigger the
quality comparison. No-recall terms, binding purchase obligations, inactive
clubs, and human-controlled lender authority remain protected by the same
command validation.

The existing `transfer-stage-acceptance.mjs` now checks actual weekly AI
execution for a better observed player, no sporting need, no recall permission,
and a human-controlled lender, alongside the prior medical shortage, purchase,
loan, transfer-payment, save and rollback cases. Local evidence: transfer-stage
and player-loan acceptances, regression, smoke, 103-module static validation and
`git diff --check` pass. Required exact-PR-head CI remains the merge gate.

This changes the AI lender's use of a negotiated recall clause; it does not
implement a general agency/insolvency policy, alter loan clauses, promise that a
recall is optimal in every career, or complete D05 or the 23-stage roadmap.
The deferred long-run, mobile and TalkBack checks remain after all features and
user playtest fixes.

D05 follow-up test note: D01 calendar acceptance now selects mutually ready
clubs with a shared time block before asserting practice reservation. Initial
exact-head Actions run 36999290633 failed because its fixture selected an allowed
but not practice-ready pair after AI roster changes; the same acceptance passed
against the pre-change engine. The original run and artifact remain in Actions.
The corrected focused acceptance passes locally; the current full-head run is
recorded in the PR checks.


### D04 AI representative negotiation parity (2026-10-02)

Autonomous AI renewals, free-agent and early-FA offers, and permanent-transfer
personal terms now use the existing player-side demand, counter and round-limit
functions when their first offer fails the current player-utility/reasonableness
check. The player keeps final acceptance authority through the same utility and
transfer-consent rules.
Counters remain inside each path's existing salary/cash budget. The AI reuses the
existing random draw sequence; representative generation uses its established
stable player-keyed stream. A managed club's submitted FA offer is never rewritten
or auto-approved by the autonomous counter path, and its prior signing payload is
preserved when the offer itself qualifies.

The AI report records representative identity and counter rounds in its transient
decision report; no new persisted negotiation fields were introduced. Transfer
counter evaluation works on detached player/team views, so rejected offers do not
create a live agent or change cash. `agent-negotiation-parity-acceptance.mjs` runs
the actual AI renewal, FA market, early-FA and AI transfer-term paths, then checks managed
offer authority, the player-facing transfer representative, cancellation without
fees/cash changes, save/legacy fallback, malformed representative fallback and
read-only consent purity. The broader agency market, agent authority/fees, insolvency
claims/assets and remaining D04/D05 work stay open. This does not complete D04.

### D07 on-site staff gameplay and historical continuity (2026-10-02)

Base: main `541f237`, including PR #134. That batch stored an on-site list,
but official matches still used every employed coach/analyst. Its save validator
also compared historical entries to today's employer, making saves unloadable
after registered staff left a club.

Official series and draft views now derive staff from the submitted entry and
current employment. Registered coaches/analysts supply existing advice, draft
quality and analysis effects; departed staff no longer supply field effects.
Club employment, payroll, ordinary training and private practice keep their
full staff. Events without an explicitly published policy keep prior behavior.
Legacy seasons without an entry snapshot remain compatible.

Each new event snapshots its published cap and deadline so a later split's
competition object cannot rewrite earlier rules. AI submits and refreshes
its list before the deadline through the same guarded action as managers;
manual lists remain user decisions. Submission preserves employee ID, name and
role as compact evidence. Completed/locked events cannot be resubmitted.
Historical entries survive departures without requiring their IDs to match
current employment. Rollback restores both lists and records on late failure.
Policy and authority changes invalidate a pending preview.

Focused acceptance runs an actual scheduled game and official draft, compares
advice/analysis with and without registered staff, preserves practice staffing,
exercises AI through the shared writer, UI cancel/confirm, malformed inputs,
late rollback, locked AI, departure/save restore, old policy snapshots and
international deadlines. Shared UI/finance/contracts checks and 104-module
static validation passed locally. Required CI on the current PR head remains
the merge gate. This completes the configured on-site registration connection;
default office cap selection, wider staff career balance and deferred final
device/100-season checks remain outside this slice. Continue the 23-stage
implementation before user playtest and final QA.

PR #135 head `c5fdcf4483e5627c980508ab42b082b4ff470524` passed complete
Actions run `37020614180`, including medical core, all four seed shards,
both aggregate checks and final verify. It merged as `f401a579b6070c04c827d11f9bf2e51367514ccd`.
Standalone HTML was then rebuilt from merged main.
