# Broadcast-style domestic calendar and chemistry realism (2026-09-29)

## Design basis

Real LoL esports has region-owned, separately programmed broadcast rounds rather than forcing all clubs to play concurrently on an abstract league-round date. Regional competition shapes vary by year, and international First Stand, MSI and Worlds are separated by domestic windows. References: [LoL Esports 2026 handbook](https://lolesports.com/en-GB/season/115547545029543948/handbook) and [2026 MSI/Worlds event schedule](https://lolesports.com/en-US/news/msi-and-worlds-updates).

The LOL GM world deliberately differs from the **actual** 2026 Riot formats: the game starts in 2027, may contain fictional leagues and subsequent office-led league realignments, and carries its own configured domestic league formats. This is a **broadcast plausibility model**, not a claim to reproduce Riot's historical 2026 event dates.

## Rules implemented in this change

- Each domestic league's regular season generates two round-robin fixtures per team in a full seven-day broadcast week. Round pairs are spread across four region-specific on-air dates. For KR, the weekly pattern is Wednesday/Thursday/Saturday/Sunday; CN is Tuesday/Wednesday/Friday/Saturday; EU/NA is Thursday/Friday/Sunday/Monday. Optional `region.broadcastDays` may override weekdays; local time slots appear per match. A match is still one full Bo series and consumes the same one match record.
- Each team has at least two elapsed calendar days between its two weekly series. Week-long gaps return to the next week's regional slate. League size controls series per day (e.g. 10 teams → 2–3 series per on-air day; 16 teams → 4 series per day). Weeknight and weekend windows support several real broadcast series in sequence, **not** simultaneous team matches.
- When a region runs three splits, the opening cup-like split has single-round-robin regular play to avoid pretending three complete double round-robin seasons can fit a calendar year. Later splits and single/two-split leagues retain at least double round robin. International and postseason stages retain their separate competition-defined cadence.
- The interval between completed stages and the following international event is shortened from 18 to 8 days and between events and domestic stages from 14 to 10 days, to avoid multi-week dead zones not representative of a modern esports calendar.
- Team synergy can decline from losing and poor pairwise relationships; positive relationships and winning can rebuild it. Benched ordinary backup/prospect players are not automatically made unhappy simply because they did not play *one* official series. Core/starter expectations are still enforced by the existing longer-term player satisfaction engine.

## Verification and non-goals

The **mandatory** `scripts/broadcast-realism-acceptance.mjs` asserts realistic regional broadcast patterns with 10/12/16-team leagues, official fixture conservation, club-specific twice-weekly matches, no same-day team reappearance, ranked daily airtime slots, opening split length and non-monotonic team synergy. Updated `scripts/calendar-depth-acceptance.mjs` verifies the new per-team weekly schedule with existing D01 progression, scrim limits, pending manual Bo draft, patches, facilities and legacy v15/format-2 saves. Legacy world-generated fixtures retain their saved dates rather than being rewritten on load.

**Separate, still open:** region-specific multi-stream capacity and season-year timing for 18+ clubs, full internationally configured tournament slots/format/coefficient/qualifiers (major Item 19), medical absences (D02), team-owned scouting (D03), contract/loan depth (D04/D05) and international scrim travel (D09). These are not certified completed merely because the calendar and chemistry acceptance passes.
