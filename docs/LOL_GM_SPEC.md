# LOL GM — Master Specification

> This document is the canonical product/game specification for LOL GM.
> When older notes, prototype behavior, or implementation details conflict with this document, the latest explicit specification wins.

## 0. Product Direction

LOL GM is a mobile-first esports management simulation inspired by the structure and strategic depth of professional League of Legends.

The goal is not a simple match-result generator. The world must form a causal simulation loop:

`players + champions + tactics + teamwork + form → draft + match → real statistics → evaluation/meta/reputation/value → patch/recruitment/development/finance → next match`

Important values must either be source data used by the simulation or derived values with a clear basis. Avoid disconnected decorative ratings.

The player and AI clubs ultimately operate under the same core rules.

---

# 1. Development Phases

`CURRENT_PHASE = PHASE_1_CORE_GAME`

The full document describes the target game. **Do not shallowly implement the whole document at once.**

## Phase 0 — Claude Artifact Migration & App Foundation

An existing Claude Artifact prototype is the current UI/UX starting point.

Purpose: migrate that existing prototype into this repository now, preserve approved mobile UI/UX, establish a runnable application, and then make GitHub the primary development codebase.

After stable migration, Artifact is optional for UI/UX experimentation; GitHub remains the long-term source of truth.

Prototype flow:

`New Game → Team Selection → Dashboard → Roster → Player Detail → Schedule → Draft → Match → Result → Standings`

Phase 0 rules:

- smartphone portrait first
- tablet/desktop responsive second
- mock data is allowed
- mock data must be explicit and replaceable
- navigation/buttons/tabs must actually work
- do not pretend future simulation systems are complete
- preserve approved Artifact visual design during migration
- exported Artifact may initially land in `src/artifact/` when useful, but this is not mandatory
- first establish a runnable build and visual/behavioral parity
- gradually separate presentation, state, domain logic and data after parity
- do not rewrite an approved Artifact from scratch without a concrete reason
- after Phase 0 exit criteria in `docs/DEVELOPMENT.md` are met, continue with `docs/POST_ARTIFACT_ROADMAP.md`

Read `docs/ARTIFACT_INTEGRATION.md`.

## Phase 1 — Core Game

Replace prototype mock state with real game state.

Complete the first real gameplay loop:

`New Game → Team Selection → Date Progression → Roster → Draft → Match → Result/Stats → Standings → Schedule Progression → Playoffs → Season End → Next Season`

No fake UI.

## Phase 2 — Management Simulation

Implement:

- contracts/transfers
- scouting
- player growth
- training
- scrims
- lower divisions/reserves
- facilities
- finance
- club/staff management
- AI club operations

## Phase 3 — Living World

Implement:

- all-world AI leagues
- international tournaments
- patch simulation
- regional meta
- meta diffusion
- new champions/global pro ban
- advanced AI draft adaptation
- long-term history
- long-term ecosystem simulation

## Phase 4 — Production

Only after the core game is stable:

- backend/API
- database
- server saves
- external deployment
- accounts/cloud saves if needed
- PWA
- mobile performance optimization
- security/backups
- production migrations

---

# 2. Architecture Principles

Keep presentation separate from game truth.

```text
Artifact / UI / Features
        ↓
Application State / Services
        ↓
Domain + Simulation Engine
        ↓
World Data / Rules / Config
```

Examples:

- match UI displays a result; it does not decide the winner
- player UI displays development; it does not calculate growth
- draft UI sends actions; draft/domain logic validates legality
- standings UI displays tables; league/rules logic calculates them

Use stable IDs. Never use display names as persistent foreign keys.

Teams, players, champions, leagues, tournaments, patches and rules must be data/config driven where practical.

AI and human presentation/performance optimization may differ, but core rules do not.

---

# 3. New Game & Team Selection

Default top-division sizes:

- LCK: 12
- LPL: 16
- LCP: 12
- LEC: 12
- LCS: 10
- CBLOL: 10

Team counts are data-driven. Do not expose arbitrary team-count setup during new game.

Support:

- existing-roster start
- blank-roster start for the selected club, constrained by budget/contracts/league rules
- selectable top-division independent clubs
- selectable independent second-tier clubs
- non-selectable parent-club reserve/academy teams
- promoted/relegated independent clubs remain playable

Selection hierarchy:

`Region → League → Division → Team`

Clearly communicate:

- first/second tier
- independent/reserve
- franchise/certified status
- promotion/relegation eligibility

Team cards may show finance, roster state, facilities, reputation, recent results and objectives.

---

# 4. Club Branding

Fictional clubs should feel like modern esports brands.

Guidelines:

- short, memorable names
- natural 2–4 letter abbreviations
- avoid repetitive `Region + Gaming/Esports`
- avoid excessive Dragon/Phoenix/Titan clichés
- avoid near-duplicate brands in one region
- independent lower-tier clubs have distinct brands
- reserve teams visibly connect to the parent brand through Academy/Challengers-style naming
- independent brands persist after promotion

---

# 5. Players

Players are persistent career entities.

Core data includes:

- stable ID
- name
- age
- nationality
- positions
- team
- first/reserve status
- contract
- salary
- market value
- reputation

Simulation-linked abilities include:

- laning
- skirmish
- teamfight
- positioning
- damage
- survival
- vision
- objectives
- roaming
- macro
- side-lane play
- decision-making
- stability
- aggression
- concentration
- adaptability
- variance
- champion learning
- meta adaptation

Position-specific weighting is required.

Short-term state may include:

- form
- condition
- fatigue
- morale
- sharpness
- team adaptation
- tactical adaptation

Short-term state must not overpower underlying ability without reason.

## Champion Mastery

Maintain per-player, per-champion mastery.

Influences:

- official matches
- scrims
- training
- prior experience
- traits
- champion difficulty

Mastery must not grow unrealistically fast.

Long non-use, major reworks or role changes may create decay/relearning.

## Match Statistics

Generate statistics from actual simulated matches:

- K/D/A
- KDA
- kill participation
- CS
- CS differential
- gold
- gold differential
- GPM
- damage
- DPM
- damage taken
- vision
- objective involvement
- lane advantage
- teamfight contribution
- match rating

Ratings should use position-aware formulas.

## Growth & Career

Growth depends on:

- age
- hidden potential
- experience
- competition level
- training
- scrims
- coaching
- facilities
- growth style
- current ability

Potential is hidden/uncertain.

Players have different development curves and peak ages.

Position switching is possible.

Lifecycle:

`Newgen → Development → Peak → Decline → Retirement`

Career history stores:

- season
- team
- division
- appearances
- stats
- contracts
- transfers
- titles
- international results
- awards

Reputation is separate from ability.

## Squad Roles & Satisfaction

Roles may include:

- core starter
- starter
- competition
- substitute
- prospect

Promised role versus actual playing time affects satisfaction, renewal and transfer behavior.

Discontent factors can include playing time, reserve demotion, contract, team results, role and international ambition.

Discontent must not appear excessively or automatically destroy performance.

Transfer requests are possible.

---

# 6. Newgens & Scouting

Generate a natural supply of new players by region and position.

Avoid:

- excessive elite prospects
- long-term ability inflation
- persistent positional shortages

Typical pathway:

`Newgen → lower tier/academy → matches → growth → scouting → first team`

True ability and potential are not fully visible.

Uncertainty should generally be higher for:

- younger players
- foreign players
- lower-tier players
- small samples

Scouting narrows estimates but should not fully reveal potential.

Scouting searches may target:

- region
- player
- tournament
- position
- contract situation
- undervalued youth

Reports combine:

- estimated ability
- estimated potential
- real statistics
- trends
- champion pool

Old reports lose reliability.

---

# 7. Contracts & Transfers

Contracts can include:

- realistic term length
- salary
- signing bonus
- performance bonuses
- title bonuses
- international bonuses
- buyout
- options where appropriate

Market value is derived from factors such as:

- age
- ability
- estimated potential
- form
- performance
- contract remaining
- position
- international record
- reputation
- demand
- league economy

Market value is not automatically the transfer fee.

Multiple clubs may pursue the same player.

Interest stages:

`Observing → Evaluation → Formal Offer → Negotiation`

Player decisions can weigh:

- salary
- contract length
- role
- competition
- club/league reputation
- international opportunities
- staff/facilities
- roster quality
- career stage

Exact rival bids should not always be visible.

Delays can cause a target to sign elsewhere.

Own players do not auto-renew.

Support shortlist planning such as Plan A/B/C.

AI re-evaluates when a target is lost.

AI↔AI transfers, free agency, renewals and releases must occur.

Transfer chain reactions are possible.

Loans may exist if league rules support them.

---

# 8. Lower Tiers & Reserve Teams

Major regions require meaningful lower-tier ecosystems containing reserve/academy teams and independent clubs.

Lower tiers have actual:

- schedules
- matches
- standings
- statistics
- drafts
- player growth
- transfers

Competition level matters for development.

Independent clubs may promote when eligible.

Reserve teams generally cannot occupy the same top division as their parent.

EMEA Masters is a lower-tier international competition and is distinct from the planned top-division Masters event.

Reserve requirements derive from license/rules:

- franchise: mandatory
- mixed system certified club: mandatory
- mixed system non-certified club: optional
- ordinary promotion/relegation club: optional

Do not hardcode this by league name.

AI evaluates optional reserve operation based on finances, prospects, facilities, strategy and cost.

Reserve teams have real costs and benefits.

First↔reserve movement follows registration rules and cannot be an unlimited exploit.

Promotion/relegation may affect license, finance, sponsors, player preference and reserve obligations.

---

# 9. Clubs, Facilities & Staff

Team strength is derived rather than represented by one magic rating.

Useful dimensions include:

- early game
- mid game
- late game
- laning
- skirmish
- teamfight
- macro
- objectives
- vision
- side play
- draft
- teamwork
- meta adaptation
- stability

These derive from players, tactics, teamwork, coaching and form.

## Teamwork

Track concepts such as:

- overall cohesion
- pair/positional synergy
- roster continuity
- tactical familiarity
- composition familiarity

Major roster changes reduce cohesion.

## Facilities

Potential facility categories:

- training
- development
- analytics
- scouting

Facilities have:

- actual gameplay effects
- construction/upgrade cost
- upkeep
- upgrade time
- attractiveness effects

## Staff

Keep staff manageable:

- manager
- coach
- analyst
- scout

Staff must have real effects.

AI clubs also hire, renew, move and dismiss staff.

Club goals are contextual:

- title
- playoffs
- internationals
- survival
- promotion
- finance
- youth development

Manager dismissal should not force the save to end. Architect the player-manager separately from the club so a future job market/career system remains possible.

---

# 10. Training

Training is a scarce allocation system, not a meaningless intensity slider.

Possible focuses:

- individual growth
- champion mastery
- teamwork
- draft
- laning
- skirmish
- teamfight
- macro
- objectives
- tactics
- compositions

There must be tradeoffs. Everything cannot be maximized simultaneously.

If training intensity only means `growth up / fatigue up`, remove or integrate it into a richer allocation model.

---

# 11. Scrims

Remove generic friendlies. Non-official team practice is represented as scrims.

Flow:

`Choose actual team → Request → AI accept/reject → Schedule → Series → Roster/Draft/Tactic testing`

Do not use weak/balanced/strong opponent abstractions.

Scrims:

- use actual teams
- are separate from official statistics
- affect mastery/preparation/analysis
- can be requested by AI
- depend on schedule/rest/relationships/team level

Cross-region scrims are supported.

Distance, schedule and environment normally constrain them. During international events, co-located teams can scrim more easily.

Scrims are private by default. Opponents must not magically know exact scrim results or preparations.

---

# 12. Champion Data

UI uses official Korean champion names where applicable while internal logic uses stable IDs.

Champion data should resemble actual LoL stat structure:

- HP / HP growth
- resource / growth / recovery
- attack damage / growth
- armor / growth
- magic resistance / growth
- attack speed / growth
- attack range
- movement speed

Passive/Q/W/E/R are separate data.

Ability data may include only applicable fields:

- level-based base damage
- damage type
- AP ratio
- total AD ratio
- bonus AD ratio
- HP ratio
- resource cost
- cooldown
- range/AOE
- healing/shield
- crowd control/duration
- slow/movement
- charges
- recast
- stacks
- execute

Do not force meaningless fields onto every ability.

Abstract labels such as early/late/poke/teamfight strength should generally be derived/helper values rather than the primary source of truth.

The patch engine changes real champion values and the match engine consumes them.

---

# 13. Champion Statistics & Meta

Track:

- picks
- bans
- pick rate
- ban rate
- presence
- wins/losses
- win rate
- sample size

Korean UI term for presence: **밴픽률**

`presence = (picked games + banned games) / total games × 100`

Filters can include:

- season
- split
- tournament
- domestic/international
- league
- patch
- time
- position

Support top players, top teams, matchups and trends.

Champion tier is derived from current statistics, patch, performance, sample, matchups, position, composition and regional meta. It is not fixed.

Initial meta can resemble real professional LoL, then diverges through the simulated world.

Regional metas can differ on the same patch.

Meta diffusion:

`new pick/comp → success → analysis → spread → counter research`

International events accelerate cross-region meta interaction.

---

# 14. New Champions & Global Pro Ban

New champions cannot immediately appear in professional official matches.

Flow:

`Release → Global Pro Ban → Training/Scrim Research → proEligibleDate → Official Eligibility`

During the global ban, teams may practice the champion in training/scrims.

Because official data does not exist yet, evaluation remains uncertain.

Teams may reach very different preparation/mastery levels by unlock.

Global eligibility and tournament eligibility are separate.

A tournament already locked to a patch/champion pool may keep a champion banned after global eligibility begins.

New champion releases should be rare enough to avoid roster explosion.

Rare champion reworks are possible.

---

# 15. Patch Engine

Patch analysis may use:

- pick rate
- ban rate
- presence
- win rate
- sample size
- position
- league
- international performance
- trend
- previous patch
- top-team usage
- player dependency
- composition dependency
- flex value

Do not force every champion toward exactly 50% win rate.

Diagnose likely causes, then modify relevant actual statistics.

Possible changes include:

- base/growth stats
- damage
- ratios
- resource costs
- cooldown
- heal/shield
- movement
- crowd control

Do not use a universal fixed ±5 adjustment.

Avoid repeated same-direction changes without observation.

Partial rollbacks are possible.

Patch outcomes contain uncertainty.

Target cadence:

- roughly 3 major meta patches per year
- smaller adjustments between them

Store exact old→new patch notes and historical champion specifications.

---

# 16. Draft & Team Compositions

Draft AI must not simply pick champions by tier order.

Consider:

- patch/meta
- player mastery/pool
- own selected champions
- enemy picks
- lane matchups
- composition synergy
- tactics
- flex
- pick order
- opponent pools/recent data

Composition dimensions include:

- engage/counter-engage
- teamfight
- poke
- dive
- side/split
- early priority
- scaling
- lane priority
- objectives
- crowd control
- AD/AP balance
- frontline
- peel
- range
- mobility

Synergy should emerge from champion traits/stats where possible rather than hardcoding every pair.

Ban purposes include:

- remove overpowered priority
- target a player
- remove counter
- pinch champion pool
- protect planned composition
- block expected composition

Flex roles remain unresolved until realistically inferred.

Pick order matters for priority, core pieces, information hiding, counterpick and flex.

Do not store a simplistic permanent blue/red preference rating.

---

# 17. Bo3 / Bo5 / Fearless

Series have memory and adaptation.

Previous games can affect:

- next draft
- tactics
- target bans
- composition reuse
- counter expectations
- player state
- side decisions

AI can reuse successful approaches and abandon failed ones, but should not react perfectly.

Draft formats are data-driven:

- Standard
- Soft Fearless
- Hard Fearless
- custom formats

Fearless rules use actual previously used champions and player pools.

---

# 18. Tactics

The player edits only their own team's tactics.

Tactics must contain tradeoffs, for example:

- aggression ↔ stability
- early ↔ late
- fighting ↔ macro
- concentration ↔ distribution
- objective focus ↔ lane/side investment

There must not be an all-100 optimum.

Remove simplistic focus-lane buffs.

Resource focus should emerge from factors such as:

- jungle pathing
- roaming
- draft
- resource allocation
- carry roles

Composition/tactic alignment matters.

---

# 19. Match Engine

Never resolve a match as:

`team strength + random = winner`

Use:

- player abilities
- champion mastery
- actual current champion specifications
- current patch
- composition synergy
- draft
- lane matchups
- tactics
- teamwork
- form/condition
- current game state
- limited variance

Possible phase model:

`Lane → Early Macro/Jungle → Objectives → Mid Macro/Skirmish → Teamfight → Late Game`

State carries forward between phases.

Model at an appropriate abstraction:

- gold
- gold differential
- resource concentration
- power spikes
- objectives

Comebacks are possible. Small leads are not deterministic.

Mistakes relate to decision-making, stability, fatigue and context plus limited variance.

Post-match explanation should identify meaningful factors such as lane, draft, tactics, player execution, objectives and teamfights.

---

# 20. World AI Simulation

If the player manages one region, all active regions and lower tiers continue to progress.

AI matches generate real:

- rosters
- drafts
- champion usage
- results
- player/team/champion statistics
- form
- growth
- reputation

Background simulation uses the same core model but may use lighter presentation/calculation.

Other leagues feed world/regional meta and patch analysis.

AI participates in:

- recruitment
- contracts
- development
- reserves
- scouting
- facilities
- training
- scrims
- tactics
- draft
- patch adaptation
- lineups
- finance
- internationals

AI strategy differs based on finance, roster and objectives and can change over time.

AI does not cheat by reading:

- hidden true ability/potential
- private scrim information

Rational-but-wrong decisions are allowed because information is uncertain.

Avoid random stupidity and omniscience.

AI performs long-term roster planning, continuity management and replacement planning.

The human player receives no special rules advantage.

---

# 21. Analyst

Analysis must be based on actual data.

Potential analysis areas:

- champions
- pick/ban
- opponents
- own team
- players
- tactics
- scrims
- official matches
- side
- patch

Raw numbers remain truthful.

Analyst ability affects pattern detection and interpretation, not fabrication of raw data.

Communicate sample uncertainty, weak evidence and patch staleness.

---

# 22. Economy

Revenue can include:

- sponsors
- league/media distribution
- domestic prize money
- international prize money
- other club income

Expenses can include:

- player salaries
- staff salaries
- signing costs
- transfers
- facilities
- reserves
- operations

UI should expose useful financial information such as:

- cash
- projections
- payroll
- salary cap where applicable

Do not ask the user to manually define league salary caps/floors at new game. League rules define them.

Economic disparity between leagues may exist, but it should not permanently make movement impossible.

Evaluate real purchasing power relative to salaries, values and transfer fees.

Small clubs/leagues can rise through discovery, results, international success, reputation and sponsorship.

Large clubs can decline.

Financial distress may cause:

- player sales
- payroll reduction
- investment pauses
- optional reserve-team reconsideration

---

# 23. League Rules & License Engine

Rules must be configurable.

Possible fields:

- team count
- format
- Bo format
- playoffs
- promotion/relegation
- franchise/certification
- reserve rules
- promotion eligibility
- import rules
- roster rules
- salary rules
- draft rules
- side selection
- international slots

Example license concepts:

- FRANCHISE
- CERTIFIED
- NON_CERTIFIED
- PROMOTION_RELEGATION

Derive concepts such as:

- reserveTeamRequired
- reserveTeamAllowed
- promotionEligible

Do not hardcode these from league names.

---

# 24. League Office

Regional/domestic governance can control:

- participation/license
- franchise/certification
- first/second-tier structure
- promotion/relegation
- reserve obligations
- roster registration
- registration deadlines
- import rules
- salary rules
- revenue distribution
- prize money
- domestic schedule
- playoffs
- draft/Fearless
- side selection
- patch
- domestic eligibility after global new-champion ban
- discipline if implemented

This is not a random rule-event generator.

Rule changes require a reason, appropriate cycle and advance notice, usually applying from a future season.

Preserve rules by season historically.

---

# 25. International Office

Global/international governance controls competitions such as:

- First Stand
- MSI
- East/West secondary internationals
- Worlds
- Masters
- lower-tier internationals

Responsibilities include:

- slots
- seeds
- eligibility
- draws
- brackets
- international rosters
- tournament patch
- draft/Fearless
- side choice
- global new-champion pro ban
- tournament champion eligibility
- prize
- schedule
- records
- global rules

League Office = regional internal governance.

International Office = international/global governance.

---

# 26. Season & International Structure

Target flow:

`Split 1 → International 1 → Split 2 → International 2 → Split 3 → International 3 → Offseason`

Planned mapping:

- Split 1 → First Stand
- Split 2 → MSI + secondary top-division international
- Split 3 → Worlds + Masters

Secondary Split 2 events:

- East: LCK/LPL/LCP
- West: LEC/LCS/CBLOL

They serve strong teams that did not qualify for MSI.

Masters is a Europa-like top-division secondary event for strong non-Worlds teams.

Worlds and Masters do not overlap for one team.

EMEA Masters remains a distinct lower-tier competition.

Remove completely:

- Mid-Season Challenger Cup
- World Challenger Cup

International qualification uses actual standings/seeding, not random selection.

Tournament formats are configurable:

- round robin
- groups
- Swiss
- single elimination
- double elimination
- Bo1/Bo3/Bo5

Tournament patch locking is supported.

---

# 27. Side Selection

Do not use a permanent team side-preference stat.

Rules determine who owns selection rights through concepts such as:

- seed
- previous game result
- draw
- custom competition rule

AI chooses side based on:

- patch/meta
- player/champion pools
- composition strategy
- actual side performance

---

# 28. Calendar & Offseason

Avoid conflicts among:

- domestic competition
- internationals
- lower tiers
- scrims

Explicit offseason flow:

`Season End → Expiries/Renewals → FA/Transfers → Newgens → Staff/Facilities → Roster Registration → Scrims/Preparation → Next Season`

Calendar exposes important deadlines, internationals and patches.

---

# 29. Game Time Progression

The world uses one shared date/time axis.

Primary controls:

- advance one day
- advance to next major event

All active systems progress together:

- leagues
- contracts
- training
- scrims
- facilities
- tournaments
- AI decisions

Auto-advance stops for required player decisions such as:

- roster deadline
- contract negotiation
- official match
- major offer

A season is continuous world time, not a menu reset.

New seasons preserve persistent state:

- abilities
- mastery
- teamwork history
- finances
- reputation
- facilities
- contracts
- career/history

Only appropriate seasonal short-term state resets or adjusts.

---

# 30. Roster Registration

Support:

- first-team registration
- reserve registration
- tournament entry lists
- deadlines
- Bo3/Bo5 substitutes
- legal between-game changes

Emergency registration exists only where rules permit it.

First↔reserve movement and international rosters cannot bypass rules.

AI follows the same registration constraints.

---

# 31. Statistics & History

Separate competition contexts such as:

- domestic regular season
- domestic playoffs
- top international
- lower domestic
- lower international
- scrims

Filters may include:

- season
- split
- tournament
- league
- patch
- time
- position
- side

Advanced metrics may only be shown if the engine actually generates them.

Always consider sample size.

Historical records include:

- champions
- runners-up
- standings
- MVPs
- rosters
- player totals
- team totals
- internationals
- promotions/relegations
- champion history
- patch history
- records

Create season snapshots.

Optional Hall of Fame uses multi-factor career evaluation.

World/player rankings are informational only and never provide match buffs.

---

# 32. News & UI

Generate news from actual world events:

- transfers
- renewals
- free agency
- debuts
- retirements
- coaches
- promotion/relegation
- titles
- internationals
- patches
- records
- upsets

Alerts can include:

- contract expiry
- rival offer
- discontent
- scrim
- registration
- tournament
- patch
- facility

Support global search, filters, sorting, favorites and player comparison where useful.

Use tooltips for dense information.

Mobile-first remains the primary UX rule.

---

# 33. Save System

Support isolated save slots and deletion confirmation.

Persistent references use stable IDs, not names.

Long saves must preserve:

- season transitions
- save/load integrity
- historical consistency

Use migrations where practical.

## Randomness

Random seed is **not user-facing**.

Do not provide:

- seed input
- seed display
- user seed locking
- same-result guarantees

The same teams/draft/tactics may produce different results due to limited uncertainty.

Internal deterministic RNG control may exist only for implementation/testing and remains hidden from normal players.

---

# 34. Same Rules Principle

AI cannot bypass:

- budget/cash/payroll/cap
- contracts/transfers
- roster registration
- first/reserve rules
- facility costs
- training/mastery acquisition
- growth/aging
- global/tournament champion bans

Teams, player definitions, champion specs, leagues, tournaments, patches and rules should remain separate from core code where practical so fictional additions and format changes do not require rewriting the engine.

---

# 35. Manager Save Continuity

If dismissal is implemented, dismissal does not automatically end the save.

The player-manager is architecturally separate from the currently managed club.

This preserves a path to a future manager job market/career system.

The full manager-career system may be implemented later.

---

# 36. Legacy / Meaningless Features to Remove or Rework

Remove or replace:

- friendlies → scrims
- weak/balanced/strong scrim abstraction
- meaningless training intensity
- simplistic focus-lane bonus
- fixed blue/red preference
- all-100 tactics
- single champion power number as primary truth
- random international qualification
- new-game team-count input
- manual salary cap/floor input
- Mid-Season Challenger Cup
- World Challenger Cup
- editing other teams' tactics
- user-facing random seed
- references to deleted features

---

# 37. Historical Consistency

Preserve historical versions of:

- champion specs by patch
- league rules by season
- player ability/value/reputation history
- team finance/strength history
- league economy/strength history
- rosters
- tournament formats/results

Never rewrite historical seasons using current rules.

Aggregated statistics must remain consistent with underlying match data.

---

# 38. Performance

Use the same conceptual core engine across the world.

The player's current match may receive detailed presentation/calculation while background matches use optimized simulation.

Use caches/aggregates for large statistical workloads while preserving raw match data needed for history and recalculation.

---

# 39. 100-Season Automated Validation

A 100-season continuous simulation is a **developer/QA stability test**, not a player-facing feature.

Validate:

- money inflation
- salary inflation
- market-value inflation
- ability inflation
- elite prospect overgeneration
- positional shortages
- permanent league monopoly
- insolvency
- AI roster collapse
- lower-tier congestion
- meta lock
- permanently dead champions
- patch oscillation
- schedule conflicts
- promotion/license errors
- statistical inconsistency

Debug mode may expose:

- true ability/potential
- AI decision reasons
- patch reasoning
- match calculation summaries

These remain hidden in normal play.

---

# 40. Implementation Order

After Artifact integration, a recommended implementation order is:

1. codebase / migrated Artifact analysis
2. stable IDs and common models
3. player / champion / team / license models
4. first/second-tier league, season and calendar
5. match engine
6. statistics
7. draft/tactics
8. patch/meta
9. growth/training/scrims
10. scouting
11. contracts/transfers
12. facilities/finance
13. league/international offices and tournaments
14. world AI
15. UI/history/news integration
16. save/migrations
17. legacy removal
18. long automated validation

Reorder when architecture safety requires it, but do not shrink the target design merely for convenience.

---

# 41. Completion Conditions

The target product is not considered complete until the implemented world supports, at minimum:

- new game and blank-roster start
- selectable independent first/second-tier clubs
- non-selectable parent academy/reserve clubs
- credible fictional team branding
- active AI leagues
- player lifecycle/newgens/retirement
- scouting uncertainty
- competitive AI transfer market
- meaningful lower-tier development and promotion
- reserve obligations
- facilities and finance
- cross-region scrims
- detailed champion specifications
- new champion global ban → eligibility
- numeric patches and patch history
- regional meta and meta diffusion
- composition-aware drafting
- Bo3/Bo5 adaptation and Fearless
- tactical tradeoffs
- shared core match engine
- complete season/international flow
- league/international office authority
- statistics/history integrity
- long-run ecosystem stability
- no critical build/runtime/null/reference/save-load/season-transition failures

---

# 42. AI Coding Assistant Rule

Before substantial implementation:

1. Read this file.
2. Read `docs/DEVELOPMENT.md`.
3. If importing Claude Artifact code, read `docs/ARTIFACT_INTEGRATION.md`.
4. Inspect the latest relevant GitHub code before changing it.
5. Identify the current phase.
6. Implement primarily the current phase.
7. Do not invent missing product rules when this specification already defines them.
8. Do not implement later phases merely to make the prototype appear more complete.
9. Do not make current-phase architectural decisions that block later phases.
10. Treat work from ChatGPT and Claude as prior work in the same project, not disposable alternative implementations.
11. When existing code conflicts with this specification, explicitly identify the conflict before replacing meaningful working behavior.

---

# 43. ChatGPT + Claude Collaborative Development Workflow

LOL GM is a **single shared project jointly developed with ChatGPT and Claude**, not two separate implementations.

The shared source of truth is:

1. the latest code in this GitHub repository
2. `docs/LOL_GM_SPEC.md`
3. `docs/DEVELOPMENT.md`
4. `docs/ARTIFACT_INTEGRATION.md` when Artifact/UI work is involved

## Collaboration rules

Before either AI starts meaningful work:

- inspect the latest relevant repository code
- read the relevant specification sections
- identify the current development phase
- preserve working behavior unless a requested/specification change requires replacement
- check whether the other AI's previous work already solves part of the task

After either AI finishes meaningful work:

- leave the repository in a coherent, runnable state when possible
- keep naming, types, routes and architectural boundaries consistent
- update documentation when architecture or product rules materially change
- avoid undocumented parallel implementations of the same system
- make the next task understandable from the repository itself rather than relying only on chat history

## Division of work is flexible

ChatGPT and Claude are not permanently assigned separate layers.

Either may work on UI, architecture, game systems, debugging, refactoring or documentation when appropriate. Work should be divided based on the current task and then integrated into the same codebase.

Claude Artifact is primarily the initial UI/UX prototyping surface, but its approved result becomes part of the shared project after migration.

## Handoff rule

A handoff means continuing the same implementation, not recreating it.

When one AI receives work produced by the other:

1. inspect the existing implementation first
2. preserve intentional design and working behavior
3. identify concrete conflicts before replacing substantial code
4. extend/refactor the existing implementation rather than starting a competing version
5. commit or otherwise return changes to the same GitHub project

## User role

The user is the product/game director and final decision-maker.

The user should be able to evaluate the game through a runnable test build and describe desired changes in product terms without needing to manually edit UI/UX or application code.

The intended iteration loop is:

`User direction → ChatGPT/Claude implementation → GitHub → runnable test build → user playtest/feedback → next shared iteration`

## Conflict resolution

If ChatGPT and Claude implementations or recommendations conflict:

1. explicit latest user instruction wins
2. then the latest canonical specification
3. then existing intentional working behavior
4. architectural preference alone is not sufficient reason for a destructive rewrite

Do not silently choose incompatible interpretations of a major game rule. Surface the conflict for a product decision when the specification does not resolve it.
