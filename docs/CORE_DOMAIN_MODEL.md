# LOL GM — Core Domain Model

## Status

This is an **implementation guardrail**, not a frozen database schema.

It exists to prevent the migrated UI from accidentally becoming the permanent game model. After Artifact migration, inspect the actual code before choosing exact TypeScript shapes.

The rule is: model only what the current vertical slice needs, while keeping identity and ownership compatible with the long-term specification.

## Implemented in Phase 1 foundation

The migrated runtime now has:

- save schema version 9
- a root `manager` entity separate from club/world state
- `manager.teamId` as the authoritative managed-club reference
- a root `worldDate` field for the shared world timeline
- fresh `lol-gm` browser-storage namespace with no legacy-save import path

Remaining identity normalization work is tracked in `docs/PHASE_1_STATE_AUDIT.md`.

## Identity conventions

Every persistent entity uses an opaque stable ID.

Recommended aliases:

```ts
type PlayerId = string;
type TeamId = string;
type LeagueId = string;
type CompetitionId = string;
type SeasonId = string;
type MatchId = string;
type ChampionId = string;
type PatchId = string;
type SaveId = string;
type ManagerId = string;
```

Display names are never foreign keys.

Bad:

```ts
player.team = "Seoul Nova";
```

Better:

```ts
player.teamId = "team_lck_nova";
```

## Ownership layers

### Config / reference data

Defines relatively static rules/content:

- champions
- league definitions
- competition formats
- license types
- draft formats
- rule sets
- initial world templates

### Persistent world state

Changes during a save:

- world date
- club memberships
- player careers
- contracts
- schedules/results
- standings inputs
- mastery
- finance
- facilities
- history

### Short-term match/session state

Exists during a draft/match/decision flow:

- current draft
- current series
- current match state
- pending decision
- temporary UI selection

Do not mix these layers into one large mutable object without ownership boundaries.

## Minimum GameWorld

Conceptually:

```ts
interface GameWorld {
  saveId: SaveId;
  worldDate: string;
  currentSeasonId: SeasonId;
  humanManagerId: ManagerId;
  managedTeamId: TeamId;

  players: Record<PlayerId, Player>;
  teams: Record<TeamId, Team>;
  leagues: Record<LeagueId, LeagueState>;
  competitions: Record<CompetitionId, CompetitionState>;
  matches: Record<MatchId, MatchState>;

  // Added incrementally as systems become real.
}
```

Do not interpret this as a requirement to keep the entire final world in one in-memory object forever. It describes authoritative relationships.

### Roster ownership

Roster membership is updated atomically through shared helpers. Gameplay code must not directly push/remove a player ID and separately modify the player's team reference.

Current invariant:

- a rostered player appears exactly once in that team's roster
- `player.team` matches the owning team ID
- a free agent has `player.team === null` and appears in no team roster
- moving a player automatically removes stale membership from other teams

CI smoke tests enforce these conditions.

## Player

Minimum persistent identity:

```ts
interface Player {
  id: PlayerId;
  name: string;
  age: number;
  nationality: string;
  primaryPosition: Position;
  secondaryPositions: Position[];
  teamId: TeamId | null;
  squadLevel: "FIRST" | "RESERVE" | null;

  abilities: PlayerAbilities;
  shortTerm: PlayerShortTermState;
  championMastery: Record<ChampionId, number>;
}
```

Long-term additions include contracts, reputation, value, career history, development curve, hidden potential and satisfaction.

Do not expose hidden true potential through normal UI state.

## Team

```ts
interface Team {
  id: TeamId;
  name: string;
  shortName: string;
  regionId: string;
  leagueId: LeagueId;
  licenseType: LicenseType;
  parentTeamId: TeamId | null;

  firstRoster: PlayerId[];
  reserveRoster: PlayerId[];
}
```

Derived concepts such as promotion eligibility or reserve requirement should come from league/license rules, not duplicated booleans unless cached safely.

## League / competition separation

A league is an organizational/rules context. A competition is a specific playable event/season/split.

Example:

- League: LCK-like regional structure
- Competition: 2027 Split 1 regular season/playoffs

This distinction avoids putting season-specific state into permanent league definitions.

## League rules

Rules belong in config/reference data.

Conceptual areas:

- team count
- series format
- playoffs
- promotion/relegation
- roster registration
- import rules
- salary rules
- reserve requirements
- draft/Fearless
- side-selection rules
- international slots

Do not branch on league display names inside engine logic.

## Season

A season is a persistent world period, not a UI menu.

Minimum:

```ts
interface Season {
  id: SeasonId;
  year: number;
  startDate: string;
  endDate: string;
  competitionIds: CompetitionId[];
  status: "UPCOMING" | "ACTIVE" | "COMPLETE";
}
```

Season transition preserves persistent world entities and histories.

## Match

A match record should separate scheduling, participation and outcome.

```ts
interface MatchState {
  id: MatchId;
  competitionId: CompetitionId;
  scheduledAt: string;
  teamAId: TeamId;
  teamBId: TeamId;
  format: "BO1" | "BO3" | "BO5";
  status: "SCHEDULED" | "READY" | "IN_PROGRESS" | "COMPLETE";
  result?: MatchResult;
}
```

A completed match result must be persisted. Navigating back to a result screen must not simulate it again.

## Draft

Draft is a domain state machine.

Conceptually store:

- match/series reference
- side assignment
- phase/index
- picks/bans
- legal champion pool
- previously used champions where Fearless applies
- completion

UI should never be able to create an illegal draft by directly mutating arrays.

## Champion

Champion reference data uses a stable `ChampionId`.

Detailed combat specifications may be introduced incrementally, but the model must allow:

- base/growth stats
- resources
- passive
- Q/W/E/R
- current patch-specific specification
- eligibility state

Do not use a single permanent “champion power” rating as primary truth.

## Patch versioning

Do not overwrite historical champion specifications when patches change.

Conceptually:

```ts
interface PatchSnapshot {
  id: PatchId;
  effectiveDate: string;
  championSpecs: Record<ChampionId, ChampionSpec>;
}
```

Optimization may later use deltas/inheritance, but historical lookup must remain possible.

## Standings

Standings are **derived from competition results/rules**, not authoritative manually edited fields.

Caching is allowed for performance if it can be rebuilt from the authoritative data.

## Statistics

Raw simulated match output is authoritative.

Aggregates are derived/cached:

- player season totals
- team totals
- champion pick/ban/win stats
- league leaderboards

An aggregate must not contradict the underlying match records.

## Human manager

Keep manager identity separate from club identity.

Even before the job market exists:

```ts
interface Manager {
  id: ManagerId;
  managedTeamId: TeamId | null;
}
```

This avoids making dismissal synonymous with save deletion later.

## Application state vs domain state

Application/UI state can contain:

- active tab
- filter
- selected player
- open modal
- temporary form values

These are not game truth.

Domain state contains:

- roster membership
- match result
- world date
- contract state
- standings inputs
- competition state

Do not persist presentation state as if it were domain state.

## Engine dependency rule

`src/engine` must not import React components, route objects or screen-specific code.

Preferred dependency direction:

```text
UI/features
   ↓
application services / store actions
   ↓
domain/engine
   ↓
data + rules/config
```

The engine may return domain events/results that the UI renders.

## Event-friendly evolution

Do not require a full event-sourcing architecture now.

However, future systems become easier if important changes have clear causes, for example:

- match completed
- contract expired
- player transferred
- patch activated
- season ended
- champion became pro-eligible

This supports news, history, debugging and long-save validation later.

## Rules for the first implementation

1. Do not pre-model every Phase 2/3 feature.
2. Do not let Artifact mock-object shape dictate permanent domain design.
3. Introduce stable IDs first.
4. Separate reference config from mutable save state.
5. Persist completed outcomes.
6. Derive standings/stats from real results.
7. Keep UI-only state out of the engine.
8. Keep hidden simulation truth out of normal player-facing view models.
9. Preserve historical versions where future edits would otherwise rewrite the past.
10. Prefer structures that can be serialized and migrated.
