# LOL GM — Phase 1 State Ownership Audit

## Status

Stage 0 audit completed after the Artifact migration.

This document records the current authoritative-state map and the next normalization targets. It is intentionally based on the migrated code rather than an idealized rewrite.

## Changes already applied

### Clean save boundary

Phase 1 starts a clean schema:

- save version: `9`
- browser namespace: `lol-gm`
- no import from old `lolfm-*` keys
- legacy save migration helpers removed
- old development saves are intentionally unsupported

### Manager separated from club

The managed club is no longer stored as `world.myTeam`.

Authoritative ownership:

```text
db.manager.id
db.manager.teamId
```

Helpers:

```text
managedTeamId(db)
managedTeam(db)
setManagedTeam(db, teamId)
```

This keeps manager identity separate from the club and preserves the future path to dismissal/job-market/career gameplay.

### Shared world date

The root save now contains:

```text
db.worldDate
```

It is advanced as official world days are processed.

The existing `world.lastDate` field remains a schedule-generation cursor, not the canonical user-facing world date.

## Current ownership map

### Root database/save

Authoritative for:

- schema/save identity
- manager identity
- current world date
- teams
- players
- regions
- competition definitions
- patch state
- world configuration
- history/news
- scouting knowledge

### `db.world`

Authoritative for the active season lifecycle:

- year
- internal RNG seed
- management mode
- phase
- active season instances
- global season-step sequence
- offseason/market working state

The internal seed remains hidden from normal player-facing setup.

### Teams

`db.teams[teamId]` owns club-specific mutable state such as:

- roster ID list
- region/division
- parent club
- coach
- tactics
- training allocation
- finance/facility state
- goals and club metadata

### Players

`db.players[playerId]` owns player-specific state such as:

- abilities
- age/form/fatigue/morale
- team ID
- champion pool/mastery
- contract/career data

### Competitions and seasons

`db.competitions[competitionId]` currently stores the active competition definition.

`db.world.seasons[seasonKey]` owns the active season instance:

- schedule
- stage state
- series results
- player statistics
- champion/runner-up

Standings are derived from match results rather than manually owned by UI.

## Remaining structural risks

### P1 — Team membership has two writable representations

Current state contains both:

```text
team.roster -> PlayerId[]
player.team -> TeamId | null
```

Both are written by transfer/retirement/team-generation code.

Risk: they can diverge.

Next action: introduce one roster-membership service/invariant layer so all sign/release/move operations update the relationship atomically.

### P1 — Champion identity is still display-name based

Current structures commonly use champion names as keys:

- `patch.champions[name]`
- player champion pool keys
- pick/ban sets
- champion statistics

Risk: rename/rework/localization can break historical references.

Next action: introduce stable `ChampionId` while retaining Korean/display names as presentation fields.

### P1 — Match IDs are only local to a season

Schedules currently generate IDs such as `m0`, `m1`.

Risk: there is no globally stable match identity for news/history/save references.

Next action: generate stable match IDs containing season/competition identity or an opaque unique ID.

### P1 — Season keys are reusable labels, not durable historical IDs

Examples such as `LCK-1` identify the current world's split instance but are not globally unique across years.

Risk: durable references become ambiguous once full raw history is preserved.

Next action: add stable `SeasonId` / competition-instance IDs containing year and competition identity.

### P1 — Competition definitions are overwritten in-place

`db.competitions[competitionId]` is rebuilt for current seasons.

Risk: future rule/format changes can erase the exact historical definition unless snapshots are preserved.

Next action: separate reference competition definitions from season-specific competition snapshots.

### P2 — Active match data is nested only under season days

There is no root `matches: Record<MatchId, Match>` yet.

This is acceptable for the current prototype but makes global history, search and cross-system references harder.

Next action: decide whether Phase 1 should introduce a root match registry or a stable season-owned match index before save/history expansion.

### P2 — UI and domain code remain bundled in Artifact modules

The migration intentionally preserved the existing source rather than rewriting it.

Domain logic is already partly separated into `engine.js`, `competition.js`, `world.js`, etc., but the source is still one browser bundle with global symbols.

Next action: refactor by vertical slice only. Do not perform a framework rewrite merely for folder aesthetics.

## Recommended next implementation order

1. roster membership invariants / transfer-safe ownership
2. stable champion IDs
3. stable season and match IDs
4. persistent match/result registry or durable season result index
5. New Game → World creation contract cleanup
6. calendar stop/decision model
7. draft legality state machine
8. first match-engine iteration tied to durable result/stat records

## Non-goals

Do not start with:

- React/Next/Vite rewrite
- database/backend
- full transfer-market rewrite
- full international-office rewrite
- all-world AI rewrite

The goal is to progressively convert the working game into a reliable domain-backed simulation without throwing away working UI and systems.
