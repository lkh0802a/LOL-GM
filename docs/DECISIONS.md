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


## D-015 — No legacy save compatibility

**Decision:** During the current pre-release Phase 1 refactor, legacy Artifact saves do not need to remain compatible.

There are no user saves that must be preserved.

Consequences:

- Phase 1 starts a clean save schema at version 10.
- old `lolfm-*` browser storage is not imported
- old save migration helpers are removed rather than carried indefinitely
- schema changes may invalidate current development saves when that produces a cleaner long-term model
- once real user saves matter, explicit save migrations become mandatory again


## D-016 — Stable champion, season and match identity

**Decision:** Phase 1 no longer uses champion display names or season-local match numbers as durable identity.

- champions have stable `ChampionId` values separate from display names
- player champion mastery/pools use `ChampionId`
- draft picks/bans and champion statistics use `ChampionId`
- patch notes target `ChampionId`
- seasons have stable IDs containing year, competition and deterministic identity
- match IDs are namespaced by their season ID and carry season/competition references

These changes intentionally invalidate older development saves, so the active save schema is version 10.


## D-017 — Blank-roster first season and save schema v11

**Decision:** The first season no longer offers an existing-roster start mode. Every active club begins with a blank roster, every generated player enters the global FA pool without a contract, and the season cannot open until registration rules are satisfied.

- the player selects an eligible independent club, then constructs the first-team roster and any owned reserve roster from the global FA pool
- AI clubs construct their rosters from the remaining FA pool under the same core registration constraints
- owned reserve movement is an ownership privilege; independent second-division clubs are manager-selectable but are not call-up/send-down partners
- the common default roster profile is first team 5–10, owned reserve 5–10, integrated organization 11–20, with league-specific profiles available for later overrides
- the active save schema is version 11 under the `lol-gm-v11` namespace
- older development saves remain unsupported


## D-018 — Player domain schema v12

**Decision:** Player-system work uses save schema version 12 under the `lol-gm-v12` namespace.

- player overall ratings are position-weighted rather than a flat average
- primary/secondary position familiarity is explicit and trainable
- nationality is explicit while region remains the registration/scouting origin key
- reputation and market value are distinct from raw ability and feed player-market logic
- form, condition, fatigue, morale, match sharpness, team adaptation and tactical adaptation are bounded match modifiers
- champion profiles retain official, scrim and training experience; learning ability, champion difficulty and meta adaptation affect mastery
- each player has an individualized growth/peak/decline profile; potential is not a guaranteed future rating
- player career snapshots/events preserve team, division/squad, contract, transfers, titles, awards and retirement information
- match lines carry position-sensitive ratings plus gold/GPM/DPM-compatible data

Older development saves remain unsupported.


## D-020 — Player roles and satisfaction accepted

**Decision:** Major item 3, `선수 만족도 / 역할`, is accepted as complete on 2026-09-27.

- roster expectations use five explicit levels: core starter, starter, competition, backup and prospect
- each role carries an expected playing-time share; actual team and player games are accumulated from real series
- satisfaction is persistent and gradual rather than an instant performance-collapse switch
- dissatisfaction can come from playing-time gaps, reserve assignment, under-market contract, weak team results, role mismatch, missing international opportunities and unmet career goals
- players have career goals derived from age, potential, reputation and ambition
- severe unresolved dissatisfaction can produce a transfer request only after persistence; recovered satisfaction can withdraw it
- manager role changes are explicit UI actions and role downgrades can carry a satisfaction cost
- AI clubs rebalance roster roles after offseason market changes
- satisfaction affects renewal and transfer intent while detailed contract negotiation remains reserved for major item 5
- item 3 was verified by smoke tests and a mobile standalone-browser scenario that created and displayed a playing-time-driven transfer request


### D-020a — Conservative LoL roster expectations

LOL GM treats pro LoL lineups as relatively stable rather than football-style rotation squads.

- core starters expect about 90% usage and normal starters about 76%
- competition players expect only limited spot usage; backups and prospects can spend long periods without official games
- ordinary bench usage does not create playing-time complaints
- playing-time dissatisfaction starts primarily for promised core/starter players after a substantial sample of team games
- satisfaction decays slowly and transfer requests require severe dissatisfaction that persists across repeated evaluations
- weak team results, reserve assignment, salary and career-goal complaints also use stricter thresholds so discontent remains exceptional rather than routine


## D-021 — Fixed starting five and conservative dissatisfaction

**Decision:** LOL GM uses a LoL-style persistent starting five rather than FM-style automatic rotation.

- every active squad keeps one explicit starter per TOP/JGL/MID/ADC/SUP in a persistent Depth Chart
- a small OVR change never replaces a valid starter automatically
- the manager changes starters explicitly from the squad screen
- AI reviews starters mainly in the offseason and requires a clear performance/ability reason: roughly a 5-point ability gap, or a 3-point gap combined with severe form/condition/transfer-request trouble
- if a starter leaves the squad, only that now-invalid slot is automatically repaired
- core starters normally expect about 98% availability and starters about 94%; competition/backup roles do not imply football-style rotation
- normal bench life does not create playing-time complaints for backup/prospect players
- playing-time dissatisfaction requires a large, sustained breach of a core/starter promise after a meaningful sample of games
- transfer requests require very low satisfaction and a long unresolved concern streak, and can be withdrawn after conditions recover

This supersedes any interpretation of item 3 that would cause frequent routine starter rotation.


## D-022 — Cross-system realism baseline

**Decision:** Before major item 4, existing simulation systems use a conservative LoL-esports realism baseline rather than FM-style high churn.

- normal live-game patches target a roughly 14-day cadence with occasional longer gaps; league offices cannot dynamically speed up or slow down the developer patch calendar
- ordinary balance patches are smaller, systemic rule changes are rare, and new champions are not tied to every major patch
- current Tier-1 seasonal structure remains three regional splits separated by First Stand and MSI, ending at Worlds; fictional league team counts/formats may intentionally differ
- LCK-style spending regulation is a soft system based on the five highest salaries, not a hard total-payroll registration cap
- spending above the reference line creates a progressive burden that is redistributed only to eligible teams; the recommended floor is not enforced by automatically inflating salaries
- other regions do not automatically inherit Korean spending regulation; fictional league offices may adopt a similar mechanism only as a rare long-term reform
- offseason AI roster moves require materially larger upgrades; academy call-ups need a clear ability/performance reason; contracted transfers are rarer than FA moves
- player contracts are mostly one or two years, with three-year deals concentrated among young or elite players
- annual rookie intake scales from first-division ecosystem size, not total reserve-team count
- league structural reforms occur only in the offseason, at most one material regional change per year, with multi-year cooldowns for repeated reform types
- ownership changes require sustained financial or competitive pressure and are rarer than before

This baseline is a calibration pass, not completion of later dedicated systems such as contracts, finance, patch engine, league office, or season structure.
