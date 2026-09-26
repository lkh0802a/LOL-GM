# LOL GM — Development Guide

## Current Phase

`CURRENT_PHASE = PHASE_0_PROTOTYPE`

Phase 0 exists to establish a durable mobile-first product shell and validate the core game flow.

### Build now

- New game entry
- Region / league / team selection
- Main dashboard
- Roster
- Player detail
- Schedule
- Standings
- Draft shell
- Match shell
- Result shell
- Navigation to transfers, champions and statistics
- Responsive mobile-first layout
- Explicit mock data/state where real systems do not exist yet

### Do not build yet

Do not pretend the following systems are complete during Phase 0:

- full match simulation
- world AI simulation
- transfer market AI
- scouting uncertainty
- long-term player development
- patch/meta simulation
- complete financial simulation
- production backend/database/authentication

Their future boundaries should be respected in the architecture.

## Core separation

UI components must not become the source of truth for simulation rules.

```text
UI / Features
      ↓
Game State / Application Services
      ↓
Domain + Simulation Engine
      ↓
Config / World Data
```

Examples:

- A match screen displays a match result; it does not decide the winner.
- A player card displays ability data; it does not calculate player growth.
- A draft screen sends draft actions; draft legality belongs to draft/domain logic.
- League screens display standings; competition rules belong to league/rules logic.

## Data rules

- Use stable IDs for persistent entities.
- Do not use display names as foreign keys.
- Avoid league-name hardcoding for rules.
- Keep fictional league/team/champion additions data-driven.
- Preserve a path toward save migrations and historical snapshots.
- Mock data must be clearly identifiable and replaceable.

## UX rules

- Smartphone portrait is the primary viewport.
- Important actions must be usable without hover.
- Dense management data should remain readable on narrow screens.
- Desktop layouts may expose more columns/panels but must not define the information architecture.
- Avoid decorative complexity that reduces information density or navigation speed.

## Definition of Phase 0 done

A user can navigate the complete prototype flow:

`New Game → Team Selection → Dashboard → Roster → Player → Schedule → Draft → Match → Result → Standings`

The flow must be interactive and coherent on a phone-sized viewport. Mock data is acceptable, but fake completed simulation systems are not.
