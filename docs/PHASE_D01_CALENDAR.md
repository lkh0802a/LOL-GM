# D01 — Real world calendar / daily simulation acceptance

The retrospective found that `playWorldDay` formerly assigned `db.worldDate = nextDate(db)` directly, meaning a two-week break granted exactly **one** recovery/practice/infrastructure tick. This implementation fixes the underlying world timeline, not only the calendar display.

## Implemented gameplay behavior

- `db.worldDate` is the actual daily world clock. One `playWorldDay(db)` call advances **one UTC date**, including a non-match day. `nextDate(db)` continues to mean the next **fixture**, so existing schedule display and first-selection targeting do not change meaning. `nextCalendarDate(db)` separately resolves the next day and rejects an inconsistent backward world clock.
- `applyWorldDailyEffects(db,date)` applies dated major/minor patches, construction completion, AI training recommendations, player condition/fatigue recovery, AI role reviews, daily role conversion progress, scrim scheduling and reserve management once for each processed date.
- `db.world.lastDailyTick` persists the last processed date. Repeating the same day is idempotent and does not double grant recovery, role practice, facility benefits or meta adjustments. Older supported v15/format-1 and format-2 saves without the new optional marker continue to load. The official game pause is checked **before** any daily work.
- Inter-split major patches are scheduled as `db.world.majorPatchEvents` for their actual calendar effective date; stage/bracket setup never silently applies next month's patch while the previous stage has just ended.
- The club dashboard shows the actual date; the `하루 진행` action advances one calendar day and `다음 경기일` advances through all real intervening days. Existing `내 경기까지`, `이번 단계 끝까지` and `시즌 끝까지` use the same world-day stepping loop, retaining the UI task cancellation/save/official-draft stop conditions. Time skips cannot bypass healing, practice or patches.
- AI scrims have a six-day cooldown and a bounded scheduling probability. Multi-day scrim log entries are retained (40 maximum) for both opponent novelty and actual availability; previously the scrim history was discarded at every new date. This limits needless repeat series simulations during longer breaks.

## Verification requirements

- `scripts/calendar-depth-acceptance.mjs` exercises a real season with ten teams and a blank-roster/market startup; sequentially verifies each date, recovery, role-conversion days, construction completion, ordinary/major patch effective dates, two independent day-advance paths, save round trips and the exact first managed official match pause.
- The same acceptance holds and reloads an unfinished official match, rejects repeated effects, and checks AI scrim rest periods and retained partner history. `scripts/smoke.mjs` was updated to assert a rest day is actually processed before its synthetic Bo5 fixture; the original First Selection, Fearless and save/Bo5 rules remain unchanged.
- Required: `npm run check`, performance probe, standalone build, PR and main CI, auto-sync of `index.html`. No world schema bump (**v15**), compact save format change (**2**) or rewrite of competition/series/match engines.

## Boundaries

D01 addresses the real world-day clock and the existing daily activity hooks. It does not implement future medical absence events (D02), future loans/precontract date triggers (D05), or new overseas scrim geography (D09); those domains must register their daily activities against this clock when implemented. The startup's pre-season base patch is still seeded while preparing the world before competitive dates, and the season bracket is generated ahead of its scheduled opener; the newly scheduled **midseason** balance patch is applied at the actual opener. Multiple-year long-run economy/performance QA (D11) remains separate.

**Do not mark D02–D13 implemented based on this change.**
