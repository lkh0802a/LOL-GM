# LOL GM — Phase 0 Migration Review

## Decision

**PASS — Phase 0 Artifact migration accepted on 2026-09-26.**

The repository advances to:

`CURRENT_PHASE = PHASE_1_CORE_GAME`

## Evidence

### Source preservation

The user-provided Artifact source archive was compared against the migrated canonical source in `src/artifact/`.

All simulation/UI JavaScript modules are identical to the provided Artifact source:

- `engine.js`
- `data.js`
- `champs2.js`
- `patch.js`
- `competition.js`
- `world.js`
- `office.js`
- `finance.js`
- `features.js`
- `app.js`

Intentional source changes:

- document title: `롤FM` → `LOL GM`
- header branding: `롤FM` → `LOL GM`
- Artifact README title updated to LOL GM naming

No other Artifact code changes were introduced during migration.

### Build/runtime verification

Local verification:

- `npm run check` — PASS
- `npm run build` — PASS
- `npm run dev` — PASS
- HTTP request to the development server root — `200 OK`

Repository verification:

- GitHub source blob hashes match the verified local migrated source
- GitHub Actions CI run on `main` — PASS
- CI runs syntax/structure checks, production build, and verifies `dist/index.html`

### Mobile preservation

The migrated `shell.html` preserves the original Artifact HTML/CSS and includes the mobile viewport declaration.

Because the presentation source is preserved from the supplied Artifact rather than reconstructed, Phase 0 does not introduce a competing desktop-first UI.

## Known specification conflicts intentionally carried into Phase 1

The migration preserved working prototype behavior even where the prototype predates the canonical specification.

Targeted cleanup/refactor is required for:

- user-facing deterministic seed controls
- `친선전` standalone match sandbox → final scrim model
- legacy `MCC` / `WCC` competitions
- weak/balanced/strong-style scrim/training abstractions
- simplistic focus-lane tactic control
- default major-league team counts that differ from canonical targets
- prototype systems that currently mix UI/application/domain concerns

These are not accepted as final product rules. They are migration debt to resolve deliberately without breaking working behavior.

## Phase 1 starting point

Follow `docs/POST_ARTIFACT_ROADMAP.md`.

Immediate priorities:

1. audit the migrated codebase and map authoritative state ownership
2. introduce/normalize stable IDs and common contracts only where needed
3. make New Game create a coherent persistent world state
4. consolidate world date/calendar progression
5. ensure schedules/results/standings are derived from authoritative match state
6. progressively remove canonical-spec conflicts while preserving the playable loop

The first Phase 1 target is not a rewrite. It is a vertical conversion of the working prototype into reliable domain-backed gameplay.
