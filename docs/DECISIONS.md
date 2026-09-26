# LOL GM — Decision Log

This file records high-impact product/development decisions that future AI work should not repeatedly reopen without new user direction.

## D-001 — Product name

**Decision:** The game/project name is **LOL GM**.

Repository: `LOL-GM`

Canonical master specification: `docs/LOL_GM_SPEC.md`

## D-002 — Development surface

**Decision:** GitHub is the long-term primary codebase.

The existing Claude Artifact is not discarded. It is migrated into GitHub as the current UI/UX starting point.

After migration, Artifact is optional for prototyping/experimentation rather than the primary source of truth.

## D-003 — User role

**Decision:** The user is the game/product director and tester, not the manual developer/integrator.

Do not require routine manual coding, CSS editing, Git manipulation or file transfer when the AI can perform the work.

## D-004 — AI collaboration

**Decision:** ChatGPT and Claude collaborate on the **same repository and implementation**.

There are no separate ChatGPT and Claude versions of LOL GM.

A handoff means continuing existing work.

## D-005 — Claude usage strategy

**Decision:** Claude usage is relatively constrained, so prefer using Claude for high-value implementation work such as:

- difficult UI/UX implementation
- complex multi-file implementation
- architectural refactors
- hard debugging

ChatGPT should reduce ambiguity beforehand, inspect/review afterwards, and handle work that does not require scarce Claude usage.

This is a workflow preference, not a permanent technical ownership boundary.

## D-006 — Current Phase 0 direction

**Decision:** Do not continue expanding the Artifact indefinitely before migration.

The current Artifact should be migrated into GitHub now.

Phase 0 ends when the migration is runnable, stable, mobile-viable and passes the acceptance criteria.

## D-007 — Mobile-first

**Decision:** LOL GM is a mobile-first web game.

Primary UX target: smartphone portrait.

Tablet/desktop support follows responsively.

## D-008 — Engine separation

**Decision:** UI is not game truth.

Simulation, rules, draft legality, standings calculation, growth and other domain logic must be separable from presentation.

## D-009 — Stable identity

**Decision:** Persistent entities use stable IDs.

Display names are presentation data and must not be permanent cross-entity keys.

## D-010 — First real playable milestone

**Decision:** After migration, priority is a real core loop:

`New Game → Team Selection → World Creation → Date Progression → Schedule → Draft → Match → Result/Stats → Standings → Continue Season`

Management depth comes after this loop has real persistent state.

## D-011 — Long-term scope is preserved

**Decision:** The master specification remains the target.

Do not delete previously requested systems merely because they are deferred to later phases.

Deferral is not deletion.

## D-012 — Validation philosophy

**Decision:** A feature is not complete merely because UI exists.

Important systems must produce real state changes/results and survive navigation, season progression and later save/load work.

A 100-season automated simulation is a developer/QA validation target, not a player-facing mode.


## D-013 — Current implementation ownership

**Decision:** ChatGPT is the current primary implementation, GitHub integration, review and debugging agent.

Claude/GitHub integration is not available in the current workflow and is not required for progress.

If Claude or another external AI is used later, it is an optional specialist contributor. It must receive a bounded task and return work that continues the same GitHub implementation.

## D-014 — Artifact migration accepted

**Decision:** Phase 0 Artifact migration was accepted on 2026-09-26.

Evidence:

- migrated source modules match the supplied Artifact source byte-for-byte except the intentional product branding change in `shell.html` and Artifact README
- `npm run check` succeeds locally
- `npm run build` succeeds locally
- `npm run dev` serves the app successfully
- GitHub Actions CI succeeds on `main`
- generated source and repository source blob hashes match

The project advances to `PHASE_1_CORE_GAME`.
