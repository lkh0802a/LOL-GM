# LOL GM — Artifact Migration Report

## Source

This project was migrated from the user-provided Claude Artifact source archive.

The Artifact is a dependency-free browser application built from one HTML/CSS shell plus ordered JavaScript modules. The migration deliberately preserves that implementation instead of rewriting it into a framework during Phase 0.

## Runtime / build

- Runtime: modern browser
- Build tooling: Node.js 20+ only
- Third-party npm dependencies: none
- Canonical migrated source: `src/artifact/`
- Generated development entry: `index.html`
- Production output: `dist/index.html`

Commands:

```bash
npm run check
npm run build
npm run dev
```

## Artifact module order

`engine → data → champs2 → patch → competition → world → office → finance → features → app`

The order is preserved because the Artifact uses shared browser globals rather than ES module imports.

## Preserved functionality

The supplied Artifact already contains substantial prototype/simulation functionality, including:

- world/league configuration
- multi-region league simulation
- three-split scheduling logic
- First Stand / MSI / Worlds timing
- team/player/champion data
- draft/match/series simulation
- standings and season progression
- patches/meta
- finance/contracts/free agency
- league/international office logic
- local save slots and JSON import/export

The current three-split migration logic is preserved:

`Winter → First Stand → Spring → MSI → Summer → Worlds`

## Intentional migration changes

- User-facing product branding changed from `롤FM` to `LOL GM`.
- Added reproducible project build/check/dev scripts.
- Moved canonical Artifact modules under `src/artifact/` to make their migration status explicit.
- No framework rewrite was performed.

## Known specification conflicts retained for follow-up

The migration prioritizes preserving working Artifact behavior. The following existing Artifact behaviors conflict with the current canonical specification and should be handled as targeted follow-up work rather than mixed into the migration:

- user-facing deterministic seed controls are still present
- the UI still labels the standalone match sandbox as `친선전` rather than the final scrim model
- legacy `MCC` / `WCC` competitions still exist in Artifact configuration
- current scrim/training abstractions do not yet match the final training/scrim design
- default major-league team counts differ from the latest canonical target counts
- some long-term systems are implemented in prototype form inside the Artifact architecture and require later domain-boundary review

These are not being represented as final compliant systems.

## Next step

After the files are integrated into GitHub, review against `docs/PHASE_0_ACCEPTANCE_CHECKLIST.md`, then either repair remaining Phase 0 blockers or advance to the Stage 0 audit in `docs/POST_ARTIFACT_ROADMAP.md`.
