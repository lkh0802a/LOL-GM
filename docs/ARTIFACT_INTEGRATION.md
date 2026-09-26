# Claude Artifact Integration Guide

## Purpose

An existing Claude Artifact prototype is the **UI/UX starting point** for LOL GM.

The current task is to migrate that existing prototype into this GitHub repository as a runnable application. Do not discard it and build a different application merely to satisfy a preferred repository structure.

Once migration is stable, **GitHub is the primary development codebase**. Artifact may later be used as an optional UI/UX experiment surface.

## Integration sequence

1. Inspect the current Artifact and the latest repository before changing either structure.
2. Bring the existing Artifact source into the repository.
3. Make the repository installable and runnable.
4. Preserve visual design, navigation and interaction flow first.
5. Fix broken imports, assets, routes and runtime/build issues.
6. Separate reusable presentation into `src/components` where useful.
7. Move screen-specific code toward `src/features/*` incrementally.
8. Separate replaceable mock data into `src/data` / application state when useful.
9. Replace direct UI calculations with application/domain calls as real systems are implemented.
10. Keep `src/engine` independent from React/UI code.

Do not turn steps 6–9 into a large migration-time rewrite. Parity and a stable runnable app come first.

## Artifact landing zone

If the exported Artifact structure does not match the planned architecture, it may first be placed under:

`src/artifact/`

This is a temporary migration area, not a permanent architecture and not a mandatory step.

If the Artifact can be integrated cleanly without this landing zone, do not create it just to satisfy the diagram.

## Preserve during migration

- visual hierarchy
- mobile layout
- navigation flow
- screen composition
- reusable UI patterns
- approved labels
- information architecture
- working interactions

## Refactor during migration only when needed

Refactor where necessary to separate:

- mock data from presentation
- navigation from screen markup
- state mutations from UI components
- simulation/domain rules from React components
- stable entity IDs from display names
- app/build configuration from Artifact-only assumptions

## Verification before declaring migration complete

Verify at least:

- dependencies install
- development app starts
- production build succeeds
- primary routes/screens render
- core buttons/tabs/navigation work
- mobile portrait layout is not obviously broken
- imported assets resolve
- no obvious runtime/import errors remain

If deployment requires an external account or permission, document the dependency instead of pretending deployment is complete.

## Never do this

- Do not rebuild the approved Artifact from scratch without a concrete reason.
- Do not expand migration into implementation of the entire master specification.
- Do not put match simulation inside match-screen components.
- Do not put player growth calculations inside player UI.
- Do not hardcode league rules into pages.
- Do not make Artifact mock data the permanent database/domain model.
- Do not couple engine modules to React.
- Do not use display names as persistent foreign keys.
- Do not report migration complete without build/runtime verification.

## Target boundary

```text
Claude Artifact UI
       ↓ migrate
src/app + src/components + src/features
       ↓
src/stores / application services
       ↓
src/engine
       ↓
src/data + rule/config definitions
```

The Artifact is the UI starting point. The repository is the long-term implementation and handoff surface.
