# LOL GM — Phase 0 Artifact Migration Acceptance Checklist

## Purpose

Use this checklist when Claude reports that the existing Artifact has been migrated into GitHub.

A migration is not accepted merely because source files were copied. The repository must be a runnable application that preserves the prototype and is safe to continue developing.

## A. Repository / build

- [ ] A real app project exists in the repository.
- [ ] Package/dependency manifest is present and coherent.
- [ ] Dependency installation succeeds.
- [ ] Development server starts.
- [ ] Production build succeeds.
- [ ] No blocking TypeScript/build errors remain.
- [ ] No obvious broken imports remain.
- [ ] Required assets resolve.
- [ ] App entry point is clear.
- [ ] The repository contains instructions sufficient for the next AI to run/verify it.

### Reject if

- code was copied but cannot be run
- build success was claimed without verification
- essential source/assets remain only inside Artifact and not in the repository

## B. Artifact parity

Compare against the approved/current Artifact.

- [ ] Core visual hierarchy is preserved.
- [ ] Smartphone portrait layout is preserved.
- [ ] Navigation flow is preserved.
- [ ] Existing screens were not arbitrarily redesigned.
- [ ] Existing working buttons/tabs/interactions remain functional.
- [ ] Labels/information architecture are materially consistent.
- [ ] Any intentional visual changes have a concrete reason.

### Reject if

- the Artifact was replaced with a generic new dashboard
- significant screens/interactions disappeared without justification
- desktop layout was prioritized at the expense of mobile

## C. Navigation / main flow

Verify whichever parts already exist in the Artifact:

- [ ] New Game
- [ ] League/team selection
- [ ] Dashboard/home
- [ ] Roster
- [ ] Player detail
- [ ] Schedule
- [ ] Draft
- [ ] Match
- [ ] Result
- [ ] Standings

Not every future feature must be implemented. The check is whether existing Artifact routes/flows survived migration and whether unavailable future systems are not falsely presented as complete.

## D. Data and identity

- [ ] Mock data is clearly identifiable.
- [ ] Mock data can be replaced later without rewriting every screen.
- [ ] Persistent/cross-entity references use stable IDs where migration touched them.
- [ ] Display names are not introduced as permanent foreign keys.
- [ ] Duplicate copies of the same core entity are not spreading across unrelated screens.
- [ ] Prototype mock shape is not falsely declared the final domain schema.

## E. Architecture boundary

- [ ] React/UI code does not contain a newly invented final match engine.
- [ ] Player UI does not own growth calculations.
- [ ] Standings UI does not own league rule truth.
- [ ] Draft UI is not treated as the permanent legality/rules engine.
- [ ] Future domain/engine modules can be added independently of screen components.
- [ ] Engine/domain code, if introduced, does not import React.

Do not reject a migration merely because every ideal folder has not been created. Boundaries matter more than empty directories.

## F. State and interactions

- [ ] Existing interactive state survives navigation where expected.
- [ ] No obvious screen-level state reset bugs were introduced.
- [ ] Buttons that look actionable either work or are clearly not presented as completed features.
- [ ] Completed prototype interactions do not silently depend on inaccessible Artifact runtime behavior.

## G. Mobile verification

At minimum inspect a smartphone portrait viewport.

- [ ] No major horizontal overflow.
- [ ] Main navigation remains usable.
- [ ] Important text is not clipped.
- [ ] Cards/tables have a deliberate mobile treatment.
- [ ] Modal/sheet/dialog content is usable.
- [ ] Tap targets are reasonably usable.
- [ ] Fixed/sticky elements do not obscure primary content.

## H. Technical debt allowed during migration

The following are acceptable temporarily if explicit and non-blocking:

- mock data
- temporary `src/artifact/` landing area
- prototype component naming
- incomplete final domain types
- client-only state
- placeholder data for unimplemented systems

They are not acceptable if represented as finished long-term systems.

## I. Phase 0 exit decision

Phase 0 passes when:

1. Artifact UI/UX parity is materially preserved.
2. the repository runs independently of the Artifact editor/runtime.
3. production build succeeds.
4. core navigation works.
5. mobile layout is viable.
6. obvious runtime/import/asset failures are resolved.
7. mock data and future engine boundaries remain replaceable.

If these pass:

- set `CURRENT_PHASE = PHASE_1_CORE_GAME`
- perform Stage 0 audit in `docs/POST_ARTIFACT_ROADMAP.md`
- begin stable identity/common-model work
- use `docs/CORE_DOMAIN_MODEL.md` as a guardrail, not a forced rewrite

## J. ChatGPT review report format

When reviewing Claude's migration, report:

### PASS
What is correctly migrated and verified.

### ISSUES
Concrete failures, regressions or architectural risks.

### FIX NOW
Issues ChatGPT can safely repair immediately.

### CLAUDE FOLLOW-UP
Only high-value work that benefits from Claude's limited usage.

### PHASE DECISION
Either:

- remain in `PHASE_0_ARTIFACT_INTEGRATION`, with exact blockers

or

- advance to `PHASE_1_CORE_GAME`, with the first Stage 0/1 task.
