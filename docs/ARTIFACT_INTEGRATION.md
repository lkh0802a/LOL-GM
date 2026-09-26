# Claude Artifact Integration Guide

## Purpose

The Phase 0 repository is an **integration target for a Claude Artifact prototype**.

Do not redesign or replace an approved Artifact UI merely to match this repository. The repository should accept the Artifact as the presentation layer while keeping future LOL GM simulation systems isolated behind stable boundaries.

## Integration sequence

1. Finish/approve the Artifact prototype.
2. Export or copy the Artifact source into the repository.
3. Preserve its visual design and interaction flow first.
4. Move reusable presentation components into `src/components`.
5. Move screen-specific code into the matching `src/features/*` area.
6. Replace Artifact-local mock constants gradually with `src/data` / `src/stores`.
7. Replace direct UI calculations with application/domain calls as real systems are implemented.
8. Keep `src/engine` independent from React/UI code.

## Artifact landing zone

If the exported Artifact structure does not match the planned architecture, it may first be placed under:

`src/artifact/`

This is a temporary migration area, not a permanent architecture.

Integrate it incrementally instead of rewriting everything at once.

## Preserve during migration

- visual hierarchy
- mobile layout
- navigation flow
- screen composition
- reusable UI patterns
- approved labels and information architecture

## Refactor during migration

Refactor only where needed to separate:

- mock data from presentation
- navigation from screen markup
- state mutations from UI components
- simulation/domain rules from React components
- stable entity IDs from display names

## Never do this

- Do not rebuild an approved Artifact from scratch without a concrete reason.
- Do not put match simulation inside match-screen components.
- Do not put player growth calculations inside player UI.
- Do not hardcode league rules into pages.
- Do not make Artifact mock data the permanent database/domain model.
- Do not couple engine modules to React.

## Target boundary

```text
Claude Artifact UI
       ↓ migrate
src/app + src/components + src/features
       ↓
src/stores / application state
       ↓
src/engine
       ↓
src/data + rule/config definitions
```

The Artifact is the UI starting point. The repository architecture is the long-term game foundation.
