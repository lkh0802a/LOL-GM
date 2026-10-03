> Documentation review 2026-10-03: [navigation](../../README.md), [active priorities and validation](../../DEVELOPMENT.md). Latest explicit user direction and later confirmed decisions supersede dated instructions; historical evidence is retained.

> Dated scope/acceptance record. For current priorities and validation sequencing,
> read [DEVELOPMENT.md](../../DEVELOPMENT.md). This record does not establish whole-game completion.

# LOL GM 11.5 — Stage 2 responsibility-boundary refactor

The 1–11 executable rule baseline, save schema, standalone runtime, and generated `index.html` are preserved. This stage changes source ownership and removes redundant staff-profile evaluation, not simulation logic.

## Domain responsibilities

- `random.js`: shared RNG/hash/number helpers; `engine.js`: one-game match only.
- `data.js`: game reference constants/templates and baseline assembly; `champion-data.js`: champion source normalization; `system-data.js`: item/rune source normalization.
- `draft.js`: draft evaluation and legal decision state; `systems.js`: automated builds, rune selection and cached system-meta evaluation.
- `patch.js`: patch state/snapshot replay/calendar; `patch-balance.js`: metagame evidence and balance tuning; `patch-content.js`: generated champion/item/rune lifecycle.
- `office.js`: regional office and hype; `office-international.js`: global office.
- `ui-market.js`: market listings and dispatch; `ui-market-initial.js`: first roster setup; `ui-negotiations.js`: negotiation forms and bindings; `ui-market-staff.js`: staff/sponsor market and bindings.
- `scripts/check.mjs`: new domain ownership assertions and stricter module size budgets.
- `scripts/artifact-modules.mjs`: authoritative module composition shared by tests and production build.

## Gate

Verify syntax and structure, dedicated 11.5 regression baseline, smoke coverage, performance probe and standalone build via CI. Confirm generated standalone synchronization on `main` before declaring stage 2 complete.

## Deferred

Stage 3: validate/preview/apply API, save migration. Stage 4: indexes/performance. Stage 5: legacy cleanup. Stage 6: shared UI state, modal/responsive/event architecture. These are **not** claimed complete in this stage.
