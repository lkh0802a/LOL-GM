> Documentation review 2026-10-03: [navigation](README.md), [active priorities and validation](DEVELOPMENT.md). Latest explicit user direction and later confirmed decisions supersede dated instructions; historical evidence is retained.

# LOL GM 11.5 Regression Baseline

Status: **STEP 1 COMPLETE baseline contract** once CI is green on the commit that introduces this file.

## Purpose

This document freezes confirmed Items 1–11 behavior before the remaining 11.5 architecture rebuild. Refactors after this point may change module boundaries, data access patterns, caches and UI implementation, but they must not silently change the confirmed game rules below.

The executable gate is `scripts/regression.mjs`, which runs inside `npm run check` before the broader smoke suite.

## Frozen executable invariants

1. **World bootstrap** — save schema 15, blank first-season club rosters, 173-champion pinned baseline, 254 item records, 62 runes, global first-team non-local cap 2, and staff department caps 9/4/6.
2. **Player / lineup model** — a player's primary role is identity/specialization, not match eligibility. Five distinct registered players may occupy any five game-role slots without changing `p.role`.
3. **Squad-role / training state** — the five roster-role promises remain available and training recommendations remain bounded to light/normal/high.
4. **Rookie supply** — annual cohort generation produces 17–19-year-old entrants from the shared labor-market engine; no per-team emergency rookie generator may return.
5. **Contracts** — player contracts normalize to the confirmed maximum of three years; clauses survive save/load.
6. **Owned reserve / integrated roster** — owned-reserve organizations retain the 11-player integrated minimum and batch 1st↔reserve swaps apply atomically.
7. **Staff state** — department caps remain coach 9 / analyst 4 / scout 6 and legacy coach/staff fields migrate into the canonical staff roster.
8. **Local / transfer regulation** — first-team non-local cap remains 2 and counted contracted club moves remain capped at two per player per season.
9. **Patch engine** — Riot-style baseline cadence continues to advance and historical patch reconstruction remains reversible.
10. **Item/rune environment** — match-side build/rune selection remains engine-owned, stable-ID backed, and produces legal complete selections.
11. **Draft / series / persistence** — shared draft validation remains legal; domestic regular-season and international knockout First Selection ownership remains distinct; Fearless prevents series pick reuse; Bo3 reaches 2 wins, Bo5 reaches 3 wins; an in-progress Bo5 survives save/load and resumes.

The broad `scripts/smoke.mjs` remains the deeper acceptance suite. The dedicated regression baseline is intentionally smaller and faster so later module moves cannot accidentally delete the most important cross-domain protections.

## Confirmed-rule preservation

The remaining 11.5 refactor must preserve the accepted Fearless, First Selection, free match-role assignment, integrated roster, contract-length, staff-cap, local/non-local, patch, item/rune and save semantics unless a later explicit game-design decision supersedes them.

A refactor that changes one of these results is a regression, not an architecture cleanup.

## Known implementation findings that are **not** blessed as baseline behavior

The baseline deliberately does not freeze implementation behavior already identified as suspect or incomplete. These remain eligible for explicit remediation in later 11.5 work without being treated as accepted design:

- AI draft candidate discovery must not use hidden opponent mastery before scouting-bounded observation.
- AI contract/renewal and recruitment decisions must not read exact hidden potential; indirect market-value effects may remain where already confirmed.
- Pre-hire staff exact ability must remain hidden from the user/AI decision path, and staff contract terms/buyouts still need a complete transaction model.
- AI releases/transfers must respect the confirmed contract guarantees and player-consent rules rather than shortcutting them.
- Loans, precontracts and renewal cooldowns require their confirmed full transaction behavior.
- First Selection preference values should ultimately come from patch/team/player-pool strategy rather than arbitrary fixed preference constants.
- Normal-season nearby-region scrim geography, persistent per-club scouting knowledge and evolving club philosophy remain implementation work.

These are open audit findings, not permission to change unrelated rules during refactoring.
