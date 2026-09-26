# LOL GM

Mobile-first esports management simulation.

## Current stage

**Phase 0 — Prototype Foundation**

The repository is intentionally starting small. The first goal is to validate the mobile UI/UX and the core management flow before implementing the full simulation.

Target prototype flow:

`New Game → League/Team Selection → Dashboard → Roster → Player Detail → Schedule → Draft → Match → Result → Standings`

## Architecture principles

- Mobile-first, smartphone portrait first.
- Keep UI/features separate from simulation/game-engine logic.
- Stable IDs are used for entities; names are display data.
- Teams, players, champions, leagues, tournaments, patches and rules should be data/config driven.
- Phase 0 may use explicit mock data.
- Phase 1+ replaces mock state with real game state and simulation.
- Do not implement fake buttons or placeholder features that look complete.
- Human and AI clubs will ultimately follow the same core rules.

## Planned source layout

```text
src/
├─ app/            # routes, app shell, navigation
├─ components/     # reusable UI
├─ features/       # user-facing game features
│  ├─ game/
│  ├─ teams/
│  ├─ players/
│  ├─ leagues/
│  ├─ champions/
│  ├─ draft/
│  ├─ matches/
│  ├─ transfers/
│  └─ statistics/
├─ engine/         # pure simulation/domain logic
│  ├─ calendar/
│  ├─ draft/
│  ├─ match/
│  └─ simulation/
├─ data/           # configs and initial/mock data
├─ types/          # shared domain types
├─ stores/         # application/game state
└─ utils/
docs/
└─ LOL_GM_SPEC.md
```

The folders above are architectural boundaries, not a requirement to create empty directories.

## Development phases

1. **Phase 0 — Prototype:** mobile UI/UX and navigation with explicit mock data.
2. **Phase 1 — Core Game:** real game state and the complete season gameplay loop.
3. **Phase 2 — Management Simulation:** transfers, contracts, scouting, growth, training, scrims, reserves, facilities, finance and club AI.
4. **Phase 3 — Living World:** worldwide leagues, internationals, patches, regional meta, new champions and long-term history.
5. **Phase 4 — Production:** backend/API, database, server saves, deployment, PWA, security and production migrations.

## Working rule for AI coding assistants

Read `docs/LOL_GM_SPEC.md` before substantial implementation.

Work primarily on the current phase. Do not prematurely implement later-phase systems, but do not make architectural decisions that block them.
