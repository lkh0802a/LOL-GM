# LOL GM — Post-Artifact Roadmap

## Purpose

This document defines the first implementation sequence **after the existing Claude Artifact has been migrated and Phase 0 exit criteria are satisfied**.

It is intentionally narrower than `LOL_GM_SPEC.md`.

The objective is to reach the first genuine playable LOL GM loop without prematurely building transfers, scouting, world AI, patches or the full long-term ecosystem.

## First playable milestone

The first real milestone is:

`New Game → Team Selection → World Creation → Date Progression → Schedule → Match Preparation → Draft → Match Simulation → Result/Stats → Standings → Next Match → Season Progression`

A screen does not count as implemented merely because it exists. The underlying state must persist coherently through the loop.

## Stage 0 — Migrated codebase audit

Do immediately after Artifact integration.

Check:

- actual framework/build stack
- routes and screen ownership
- local/global state
- mock-data locations
- duplicate entity definitions
- name-based references that need stable IDs
- UI calculations that are actually domain rules
- dead Artifact-only code
- build/runtime warnings
- mobile regressions

Output should be a small list of concrete changes, not a rewrite proposal.

## Stage 1 — Identity and shared contracts

Establish stable IDs and minimum shared contracts for:

- Save/GameWorld
- Player
- Team
- League
- Competition/Season
- Match
- Champion
- Patch reference
- League rules/license reference

Do not model every future field yet.

Rules:

- IDs are opaque stable strings, not display names.
- Cross-entity references use IDs.
- UI view models may be richer/different from domain models.
- Mock fixtures conform to the same identity rules as future real data.
- Domain contracts must not import React.

Use `docs/CORE_DOMAIN_MODEL.md` as guidance.

## Stage 2 — New game and world state

Turn New Game into a real state transition.

Minimum behavior:

1. choose region/league/team from data
2. support existing-roster start first
3. create one persistent GameWorld/save state
4. assign the human manager to the selected club
5. initialize world date, season and schedule references
6. route to the club dashboard from real state

Blank-roster mode may follow once the basic world creation path is reliable.

Do not create arbitrary league-size setup.

## Stage 3 — Calendar and date progression

Implement one shared world clock.

Minimum:

- current world date
- advance one day
- advance to next major event
- scheduled match dates
- stop when a user decision is required
- no menu-based fake season reset

At this stage, only the systems that actually exist need daily processing hooks.

Design the scheduler so later systems can register processing without rewriting the clock.

## Stage 4 — League schedule and standings

Implement a minimal real domestic competition.

Minimum:

- configurable league membership
- schedule generation or configured schedule input
- completed/upcoming match state
- win/loss/set/game record required by the chosen format
- standings derived from match results
- no standings values manually edited by UI

Start with one league/rule configuration if needed, but keep rules data-driven.

## Stage 5 — Draft domain

Implement a legal draft state machine before sophisticated draft AI.

Minimum:

- sides/teams
- phase/order
- available champion pool
- picks
- bans
- turn validation
- duplicate prevention
- completion state
- configurable draft format hooks
- stable champion IDs

The UI sends draft actions; domain logic validates them.

Fearless can be added after a normal series draft works, but the model must not block it.

## Stage 6 — First match engine

Build the first real simulation vertically.

Do **not** start with a single `teamPower + random` formula.

Minimum conceptual phases:

`Lane → Early Macro/Jungle → Objectives → Mid/Skirmish → Teamfight → Late`

First version may be coarse, but it must:

- use player/team inputs
- use drafted champions in some meaningful way
- carry game state between phases
- maintain gold/objective/state concepts
- allow limited variance
- generate a winner from the simulated state
- return an explanation/debug summary

Do not yet attempt final realism.

## Stage 7 — Match statistics

Generate statistics from the simulated match, not independently.

Minimum per-player output where supported:

- K/D/A
- CS
- gold
- damage
- vision/basic support contribution
- match rating

Minimum team/match output:

- winner
- game time
- gold
- objectives
- phase/event summary

Derived statistics must reconcile with raw match output.

## Stage 8 — Series and result persistence

Connect draft + match + competition state.

Minimum:

- Bo series structure where required
- result persistence
- update standings from results
- player/team match-history entries
- next scheduled match remains accessible
- replaying/navigation must not silently reroll a completed result

Series adaptation and Fearless can then be layered onto this stable base.

## Stage 9 — Season progression

Complete a minimal continuous season.

Minimum:

- regular schedule completion
- playoffs or a deliberately minimal configured end stage
- champion/result history
- season end
- next-season transition
- persistent players/teams/world identity across transition

Do not yet build full transfer/offseason simulation just to demonstrate transition. Use explicit temporary rules where necessary and label them as temporary.

## Stage 10 — Save integrity checkpoint

Before management simulation expands, verify that real world state can be serialized/restored or otherwise persisted in the chosen client architecture.

At minimum test:

- new game
- mid-season state
- completed match state
- season transition state

Do not wait until the full game exists to discover that core world state cannot be migrated safely.

## Definition of the first playable core

The first playable core is complete when the user can:

1. create a game
2. select a club
3. see a real roster/world state
4. advance the date
5. reach an official match
6. complete a legal draft
7. simulate/play through the match flow
8. receive persistent results and statistics
9. see standings update
10. continue to later matches
11. complete a season and transition without corrupting the save

## Explicitly later

Do not pull these into the core milestone unless required by an architectural dependency:

- full transfer market
- contracts/renewals
- scouting
- newgens/retirement
- advanced growth
- training
- scrims
- facilities
- finance
- reserve ecosystems
- all-world AI
- patch/meta simulation
- new champion release system
- full internationals
- news/history polish

Their target behavior remains defined in `LOL_GM_SPEC.md`.
