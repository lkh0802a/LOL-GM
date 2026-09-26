# LOL GM — Development Guide

## Current Phase

`CURRENT_PHASE = PHASE_0_ARTIFACT_INTEGRATION`

The immediate goal is **not to prebuild the final UI in this repository**. Claude Artifact is used to create and validate the mobile-first prototype first. This repository is prepared as a clean landing zone so the approved Artifact can be migrated without a rewrite.

Read `docs/ARTIFACT_INTEGRATION.md` before importing Artifact code.

## Repository responsibility during Phase 0

Prepare boundaries, conventions and migration paths for:

- app shell / routing
- reusable presentation components
- feature screens
- replaceable mock data
- application/game state
- domain types
- simulation engine
- data/config

Do not create competing page designs before the Artifact is imported.

## Planned boundaries

```text
src/
├─ app/          # routes and app shell after Artifact migration
├─ artifact/     # temporary landing zone for exported Artifact code
├─ components/   # reusable presentation extracted from Artifact
├─ features/     # screen/feature modules extracted from Artifact
├─ stores/       # replaceable application/game state
├─ types/        # shared domain contracts
├─ engine/       # UI-independent game/simulation logic
├─ data/         # mock/initial/config data
└─ utils/
```

Directories do not need to exist until code requires them.

## Core separation

```text
Artifact / UI
     ↓
Application State
     ↓
Domain + Simulation Engine
     ↓
World Data / Rules / Config
```

UI must never become the source of truth for simulation rules.

## Phase 0 mock rule

Artifact mock data is allowed and expected.

However:

- identify mock data clearly
- keep it replaceable
- avoid spreading the same mock object across unrelated components
- use stable IDs
- do not treat mock schemas as final domain schemas automatically
- do not fake completed simulation systems

## What happens after Artifact import

The first integration pass should prioritize **visual and behavioral parity with the approved Artifact**.

Only after parity is established should code be reorganized gradually into the long-term boundaries. Avoid a large rewrite during import.

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
