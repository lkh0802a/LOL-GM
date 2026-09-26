# LOL GM — Claude Handoff

## Purpose

This file is the shortest operational handoff for Claude after usage limits reset.

Claude should **implement**, not spend its context re-deriving the project direction.

## Current task

Migrate the existing LOL GM Claude Artifact into this repository as a real runnable web application.

Preserve the current Artifact's approved UI/UX and interaction flow.

Do not rebuild the application from scratch unless a concrete technical blocker requires it.

After this migration is stable, **GitHub is the primary codebase**. Artifact becomes optional for future UI/UX experiments.

## Read first

Before implementation, read:

1. `docs/LOL_GM_SPEC.md`
2. `docs/DEVELOPMENT.md`
3. `docs/ARTIFACT_INTEGRATION.md`
4. `docs/PHASE_0_ACCEPTANCE_CHECKLIST.md`

After migration, also read:

5. `docs/POST_ARTIFACT_ROADMAP.md`
6. `docs/CORE_DOMAIN_MODEL.md`

## Important scope rule

`LOL_GM_SPEC.md` defines the target game, not the current task.

Do not implement the entire long-term specification during migration.

The current task ends when the Artifact has been migrated into a runnable repository app and Phase 0 acceptance criteria are satisfied.

## Preserve

Preserve, as closely as practical:

- mobile-first layout
- current screen hierarchy
- navigation
- tabs/buttons/interactions
- information architecture
- current visual language
- existing user flow

Do not convert the project into a generic dashboard redesign.

## Technical expectations

The repository should end up with:

- a real app entry point
- coherent package/dependency configuration
- working development start command
- working production build
- working main routes/navigation
- imported assets resolved
- obvious runtime/import errors fixed
- smartphone portrait viability
- replaceable mock data
- stable entity identity where relevant
- UI/domain boundaries compatible with later simulation work

## Architecture rule

Preferred dependency direction:

```text
UI / Features
     ↓
Application State / Services
     ↓
Domain + Simulation Engine
     ↓
World Data / Rules / Config
```

Do not place permanent simulation truth inside React/UI components.

## User role

The user is not expected to edit code, CSS, Git files, build configuration or manually move project files.

The user gives product direction and playtests.

Claude and ChatGPT perform implementation/integration work.

## ChatGPT + Claude

This is one shared implementation.

Do not create a second version of systems already implemented by ChatGPT.

Likewise, Claude code may later be reviewed, repaired and extended by ChatGPT.

Repository state is the handoff surface.

## Completion

Before reporting completion:

- install dependencies
- start the app
- run the production build
- verify core routes
- verify key interactions
- verify mobile layout
- fix obvious import/runtime/asset failures

Then summarize only:

1. what was migrated
2. whether dev run succeeds
3. whether production build succeeds
4. known remaining issues
5. which data/systems remain mock
6. any external permission required for deployment

ChatGPT will review the result against `docs/PHASE_0_ACCEPTANCE_CHECKLIST.md`.
