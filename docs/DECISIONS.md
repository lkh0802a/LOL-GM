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
- browser storage from pre-current development namespaces is not imported
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


## D-023 — Region-first realism

**Supersession note:** D-025 supersedes the policy-output parts of D-023 and D-024. Region names no longer assign derived financial, roster, import, market, or office policies; only observable world-state inputs may differ.

**Decision:** Real-world regional leagues are modeled from their own ecosystem rules and market behavior. LCK is never the generic template for another named region.

- LCK keeps its own integrated first/reserve roster model and Korean SFR interpretation
- LEC uses its own top-five SFR model, including a 50% floor, a 50% excess fee up to 150% of the threshold, a 100% fee above that level, and only half of collected SFR fees returning directly to compliant LEC teams; the rest is treated as ecosystem support
- LCS uses a wider full-roster profile and an open-market recruiting bias instead of inheriting LCK integrated-roster rules
- LCP uses a multi-region/promotion-relegation identity and its own roster profile
- LPL remains a high-spending, high-competition market without silently inheriting Korean SFR parameters
- CBLOL remains a distinct Brazilian ecosystem with a stronger domestic-development bias
- when a current rule cannot be verified, LOL GM uses a neutral global baseline and records the uncertainty rather than copying another region's rule
- fictional regions can choose any model explicitly, but named real-world regions must not receive another region's rules by default

This principle applies to future work on scouting, contracts, Tier 2, finance, league offices, schedules, and international qualification.


## D-024 — Policy engine over global defaults

**Decision:** LOL GM does not use a static global league-policy template when a rule is unspecified.

- verified or intentionally configured regional rules are treated as initial conditions and are locked only for the dimensions explicitly supplied
- missing policy dimensions are inferred independently from the region's own structure and economy
- the policy engine considers first-division team count, owner wealth, top-five payroll dispersion, local talent depth, Tier-2 ownership structure, market scale, and current league system
- it independently resolves roster structure, market profile, import openness, recruiting appetite, and whether a soft spending-control mechanism is justified
- custom/fictional regions are policy-engine-native from creation
- after creation, league-office reforms continue to respond to multi-year regional evidence; weak evidence means no change
- policy changes are component-based rather than choosing a whole 'LCK model', 'LEC model', or 'global model'

The correct fallback for uncertainty is evidence-driven inference or status quo, not copying another region.


## D-025 — Engine owns policy outputs

**Decision:** The simulation engine, not hand-authored regional labels, owns all derived league-policy outputs.

- named-region presets may provide observable world-state inputs such as identity, strength, team count, current competition structure, or whether a Tier-2 scene exists
- presets must not directly assign spending regulation, salary thresholds, market archetype, import appetite, roster-policy profile, office ideology, or regional pay scale
- regional pay scale is derived from market strength, league size, tier and structural context
- roster policy is derived from the actual Tier-2 ownership structure
- market behavior and import policy are derived from local talent depth, fan demand, owner spending power and regional strength
- spending regulation is introduced only when measured payroll dispersion, ownership resources and league size create enough pressure
- spending thresholds, redistribution share, floor and excess burden are calculated from the region's own payroll/fan/talent data
- office style is derived from the same regional conditions rather than assigned by region name
- engine decisions persist their evidence in policyBasis so UI, tests and future systems can explain why a policy exists
- no special-case branch is allowed solely because region id equals KR, CN, EU, NA, AP or BR

Constants may define simulation mechanics, but regional outcomes must result from shared engine logic and observable inputs.


## D-026 — Rookie and scouting pipeline accepted

**Decision:** Major system 4 is complete with an engine-driven long-term talent pipeline and uncertainty-based scouting.

- rookie intake volume is calculated from first-division size, Tier-2 size, current young-player depth, development infrastructure and regional competitive strength
- position generation responds to shortages in the existing young-player pool instead of using a fixed equal quota
- rookie quality follows a shared ordinary → solid → good → rare elite distribution; each regional class also gets an engine-sampled quality wave, so most classes have 0–1 elite prospects but genuine golden generations can produce multiple elite prospects, while weak classes can produce none
- generated rookies are 17–19 and receive the same full player schema: identity, nationality, attributes, potential, personality, champion pool, role familiarity and development profile
- regions with Tier 2 mark rookie entry through the development pipeline; market logic naturally pushes most non-immediate starters toward reserve/second-tier roster filling
- scouting is stored as a player-specific report, not a single fixed percentage
- report uncertainty expands for young, foreign, Tier-2 and low-sample players
- observations from official matches and manual assignments increase knowledge with diminishing returns
- current ability estimates narrow with knowledge; potential always remains a range even at high knowledge
- reports include public official-match samples, recent growth direction and observed champion-pool information
- reports lose knowledge when they become stale
- scouting search supports region, role, competition, contract status, rookie/prospect status, name and an observed-information-only undervalued-prospect filter
- the active save schema is v13 under the lol-gm-v13 namespace; older development saves remain unsupported

Item 5 (contracts / transfer market) is now active.


## D-027 — No hard elite-rookie cap

**Decision:** Rookie quality uses probabilities and class conditions, never a fixed per-region elite quota.

- there is no maximum of one elite rookie per region or per year
- each regional rookie class receives a stochastic class-quality wave derived inside the shared rookie engine
- elite and high-level prospect probabilities respond to regional ecosystem quality and that year's class wave
- most classes naturally produce zero or one elite prospect because elite probability is low, not because of a hard cap
- genuine golden generations may produce multiple elite prospects in one region and year
- weak generations may produce none
- the pro labor market is maintained with enough visible players before the transfer window; per-team emergency player generation is forbidden


## D-028 — No emergency roster generation

**Decision:** A normal LOL GM world must never solve a roster shortage by creating a player at the moment a club needs one.

- structural league changes are finalized before the annual rookie class is generated
- rookie intake calculations include total active pro roster demand, a free-agent labor buffer and position-specific supply
- the engine guarantees enough visible regional ecosystem players to cover all active rosters before the transfer window opens
- final roster filling searches the existing eligible global FA market, subject to import rules, instead of silently creating a local player
- if the invariant is ever broken, the simulation throws a development error so the supply model is repaired rather than hidden
- talent scarcity is allowed to mean a shortage of quality, experience or affordability; it must not mean the world literally runs out of players


## D-029 — Maintain a liquid prospect market

**Decision:** Rookie generation targets a healthy labor market, not merely enough bodies to fill active rosters.

- annual intake has a materially larger natural flow than the minimum roster-replacement requirement
- the engine maintains a free-agent/prospect liquidity buffer of roughly one extra player per active team, adjusted upward by Tier-2 scale and expected turnover
- expected contract expiries and older-player retirement risk increase the next class before shortages occur
- each position keeps additional supply beyond one player per team, so clubs can have actual choices in the market
- the visible pool self-corrects because unsigned careerless players can leave the simulation after prolonged failure to find a club
- quality remains probabilistic: increasing quantity does not directly increase any individual prospect's rating or potential


## D-030 — Cohort-based rookie quality

**Decision:** Rookie supply quantity and rookie-class quality are separate engine processes.

- player quantity is determined by pro labor demand, Tier-2 scale, expected turnover and market liquidity
- class quality is determined by a cohort engine with a shared world-year component plus a regional component
- regional class strength weakly mean-reverts after extreme years, preventing permanent streaks of golden generations without imposing a hard quota
- each role receives its own smaller cohort wave, allowing years such as a strong jungle/support generation but weak mid/ADC generation
- the engine records each regional class as 흉작 / 약한 세대 / 평년 / 풍년 / 황금세대 from the realized quality index
- class-quality waves change the probability distribution and slightly shift within-tier quality; they do not guarantee a number of elite players
- a golden generation may still produce no elite prospect by chance, while multiple elite prospects can appear in the same year
- a global cohort factor can make several regions strong or weak in the same year, while regional shocks preserve independent variation
- cohort volume varies modestly, but it may never reduce generation below the labor-market supply invariant

This replaces the earlier single independent classWave draw with a persistent, explainable cohort model.


## D-031 — Contract and transfer market accepted

**Decision:** Major system 5, `계약 / 이적시장`, is accepted as complete on 2026-09-27.

- player salary demand and market value are derived from ability, age, upside, reputation, recent performance, contract state, role demand and regional economy rather than fixed tables
- contracts support realistic short durations plus optional signing bonus, performance/title/international bonuses, buyout, team/player option and promised roster role; clauses are optional rather than mandatory
- player negotiations are persistent, multi-round exchanges with demands, counteroffers, patience and collapse risk instead of one-click acceptance
- contracted transfers separate club-to-club fee negotiation from player personal terms; seller counteroffers and buyouts are supported
- recruitment follows `interest → observation/scouting → internal evaluation → formal offer → negotiation`; A/B/C priorities persist as the manager shortlist
- rival offers remain intentionally opaque; the player evaluates money, promised role, team strength, international opportunity, facilities/coaching, career goal, contract stability and other relevant terms, and may choose a competitor while talks continue
- renewals are negotiations rather than automatic extensions, while release/expiry and contract options are handled explicitly
- AI clubs use the same market constraints and contract concepts, execute renewals, FA signings, releases and selected contracted transfers, and move to alternatives over market rounds
- AI recruitment of external players uses imperfect market observations instead of reading hidden potential directly
- first-season blank-roster construction now uses the formal contract-negotiation workflow for the player club; AI clubs use the same contract structure and registration/budget constraints
- open negotiations expire at the registration/market deadline and cannot silently remain live into the season
- recruitment and negotiation state survives save round trips
- item 5 is verified by smoke coverage, production build/standalone HTML generation and successful GitHub Actions CI

Item 6 (Tier 1 / Tier 2 / Academy) was accepted complete on 2026-09-27 after ownership/promotion rules, atomic first/reserve roster planning, AI parity, reserve closure handling, repeated lifecycle validation and promotion-cycle pressure tests passed.


## D-UX-001 — Management convenience is part of completion

**Decision:** Management UX is evaluated as part of system completion, not as optional polish.

- prefer staged multi-edit workflows when users naturally make several related choices before committing
- validate the final proposed state atomically when temporary intermediate states may be illegal
- show actionable validation reasons and expected corrections
- preserve list/filter/scroll context across repeated scouting, market and roster actions where practical
- provide batch actions for genuinely repetitive management work
- optimize dense management screens for smartphone portrait rather than treating horizontal desktop tables as the primary interaction
- destructive and financially material actions require clear consequences before commitment
- AI and player actions must converge on the same final domain validation even when their interaction flows differ

This applies retroactively to completed major items during later UI touches and must be checked again in item 22 final integration.


## D-032 — International ecosystem and qualification contract

**Decision:** LOL GM uses three seasonal international phases for first-division professional teams. Competition prestige tiers never mean domestic Tier 2/Academy participation.

- Phase 1: First Stand (`FIRST_STAND`), 12 teams, six core leagues initially receive two slots each. Two groups of six play BO3 single round robin; top four per group advance to an eight-team BO5 single-elimination bracket. Same-league teams are separated across groups.
- Phase 2 Tier 1: Mid-Season Invitational (`MID_SEASON_INVITATIONAL`, display `MSI`), 16 teams. Six core leagues receive two base slots each and four additional slots are distributed by international coefficient/office. All teams enter Swiss; ordinary Swiss matches are BO1 and advancement/elimination matches are BO3. Eight advance to a BO5 double-elimination bracket; the Grand Final has no bracket reset.
- Phase 2 Tier 2: Eastern Cup (`EASTERN_CUP`, `EC`) and Western Cup (`WESTERN_CUP`, `WEC`), eight teams each. Initial regional allocation is 3-3-2 by regional international coefficient. Two groups of four play BO3 double round robin; top two advance to BO5 semifinals/final.
- Phase 3 Tier 1: World Championship (`WORLD_CHAMPIONSHIP`, display `Worlds`), 24 teams. Initially six core leagues receive four slots each and no league may exceed four Worlds slots. The league phase uses three pots of eight; every team plays six BO3s, exactly two opponents from each pot including its own pot, with no rematches and no same-domestic-league pairing. Top 16 advance. At the Round of 16 only, ranks 1–8 are drawn against ranks 9–16; that draw fixes the entire BO5 single-elimination bracket through the Final.
- Worlds league-phase ties use match wins, strength of schedule, set differential, opponents' set differential and set wins. A still-unresolved 8/9 seeding boundary or 16/17 qualification boundary is decided by a BO1 tiebreaker rather than random elimination.
- Phase 3 Tier 2: Masters (`MASTERS`), 16 teams. Six core leagues receive two base slots; four additional slots are coefficient/office allocated, with a hard total maximum of three Masters teams from one league. Four groups of four play BO3 double round robin; top two advance to a BO5 single-elimination bracket.
- Phase 3 Tier 3: Open (`OPEN`), 12 teams. Initially each of the six core leagues receives two slots. Two groups of six play BO3 single round robin; same-league teams are separated and the top four per group advance to a BO5 single-elimination bracket.
- A team may enter only one international competition in the same phase. Slot rights and one-season vacancy filling are separate concepts; league size alone never determines international slots.
- All international knockout series are BO5. Fearless remains fixed.
- International slot allocation is owned by the international office and may evolve from in-world international results. Initial strength seeding is only a bootstrap when no in-world history exists.
- Each domestic league office independently chooses its season structure (one long season, multiple splits, or another format) and its international qualification tournament/competition procedure.
- Direct qualification by regular-season table cutoff is forbidden. League standings may determine qualifier eligibility, seeding or byes, but the international berth itself must be decided through competitive matches such as playoffs or a qualification tournament.
- During every international phase, all first-division domestic official competition pauses globally, including for clubs not attending an international event. Training, scrims, rest and roster management remain available.
- Exact calendar dates, international coefficient arithmetic, tournament patch lock and emergency international roster rules remain to be finalized before major item 19 is accepted.
- These canonical specifications are recorded now; executable tournament scheduling/format support remains owned by the later international-season system rather than being approximated through legacy formats.


## D-033 — Club infrastructure and staff control boundary

**Decision:** Facilities are organization infrastructure, not repetitive manager chores. Training, analysis, recovery and youth facilities have distinct simulation effects and upkeep; club management automatically decides capex from finances and philosophy through the same validated upgrade rules for every club. The player observes infrastructure state/effects but does not manually click upgrades. Sporting staff appointments remain player-controlled because they create meaningful strategic trade-offs. Specialist staff age, circulate through the market and materially affect development, analysis and recovery; AI clubs manage them under the same financial constraints without hidden information.


## 2026-09-27 — Champion/meta simulation rules
- New champions are globally unavailable in professional draft for 14 days after release, then unlock automatically by stable champion ID and date.
- Competitive meta evidence is tracked both globally and per region. Teams learn from both, with their own regional sample weighted more strongly; coach analysis and scrim analysis still control observation noise and adaptation speed.
- Champion base stats and abstract kit dimensions are simulation inputs, not display-only metadata: they feed draft valuation, composition/counter logic, phase scaling, combat offense/EHP, and patch balance changes.


## D-034 — Champion data, eligibility and evolving meta

**Decision:** LOL GM champion/meta simulation uses pinned source data and persistent public-learning state rather than fixed tier labels.

- The initial 26.19 world embeds the complete 173-champion Data Dragon baseline with stable internal IDs and Korean display data.
- Global professional eligibility and tournament champion-pool eligibility are separate; training/scrims may use globally banned new champions before official unlock.
- Tournament champion pools lock at competition start and do not silently expand after a later global unlock.
- Official games preserve long-term champion meta history with competition, season, year, stage, league, region, team, player and actual-position context.
- Team analysis creates persistent meta knowledge; repeated losses create counter-research state, so adoption and answers emerge at different rates by team.
- International games accelerate cross-region learning; tier presentation remains derived from observed presence/performance.
- Major champion reworks are rare stochastic patch events and retain champion identity.


## D-035 — Champion/meta/patch stage accepted

**Decision:** Major system 9, `챔피언 / 메타 / 패치`, is accepted as complete on 2026-09-27.

- The canonical starting dataset is pinned to LoL 26.19 / Riot Data Dragon 16.19.1 and covers all 173 initial champions with stable LOL GM identity, Korean champion/skill names and Korean passive/Q/W/E/R descriptions.
- Source-derived fields and simulation-derived mechanics remain distinguishable. Source descriptions are normalized for safe display; missing mechanics are not falsely labeled as authoritative Riot values.
- Champion source fields materially feed draft/composition/combat calculations; meta tiers remain derived from observed match evidence rather than fixed champion power labels.
- Official meta history supports region, patch, competition, season, year, split, league, domestic/international, period and actual-position analysis, with player/team/matchup/recent champion insights.
- Global pro eligibility, tournament pool locking, practice access, regional learning/counter-research and rare stable-ID reworks remain persistent simulation rules.
- Major system 10 owns the deeper autonomous patch engine: diagnosis, change targeting/magnitude, rollback/oscillation control and long-run balance validation are not implied complete by this decision.


## D-036 — Evidence-driven live patch ecosystem

**Decision:** Major system 10, `패치 엔진`, is accepted as complete on 2026-09-27. LOL GM treats patches as evidence-driven changes to a living champion/item/rune/system ecosystem rather than fixed random ± values.

- Balance diagnosis uses per-patch sample reliability, pick/ban pressure, win rate, recent trend, actual-position flex, regional/international spread, top-team usage, player/team concentration and composition dependence. Win rate alone never determines a patch.
- Same-direction consecutive changes are damped; severe evidence can override the guardrail, while opposite evidence after an overshoot can produce a partial rollback.
- Champion changes may touch base/growth stats, attack range, spell range, resource costs, cooldowns, damage, utility, healing, shielding and mobility. Notes retain exact old→new values and internal size (`micro/small/medium/large`).
- Mid-scope and rare major reworks preserve stable champion IDs and therefore preserve player mastery, career records and historical meta references.
- The canonical 26.19 system baseline is the pinned Riot Data Dragon 16.19.1 Summoner's Rift catalog: 254 purchasable item records and 62 selectable runes across five styles. Item IDs, Korean text, source prices/stats and recipe edges are retained; rune IDs remain attached to their original style/slot. Matches consume this full source automatically by selecting starters, purchasing component recipes toward final/boot builds, and building a legal 4-primary + 2-secondary rune page. Players are not expected to micromanage these choices; system balance changes are intended to shift champion draft value, match performance and the resulting meta. Patches can buff, nerf, add or deactivate/remove stable-ID items/runes, and long-save guardrails keep class build pools and every required rune slot viable.
- New champions target 2–3 releases per year and remain unavailable to professional competition for 14 days after release while practice remains allowed under the Item 9 rule.
- Patch history is reconstructible across seasons from the initial baseline plus retained patch records, so historical replays/spec inspection do not silently use current values.
- Major system 11 now owns the actual LoL-style draft interaction UI; this decision does not mark draft UX complete.


## D-038 — Pre-draft architecture stabilization

**Decision:** Before Major System 11, LOL GM performs a cross-cutting architecture/performance stabilization pass rather than continuing to grow the prototype-shaped global script.

- Persistent state remains world-owned. Reusable caches that depend on a world or patch use WeakMap ownership and revision invalidation; they must not leak values across new games, resets or save slots.
- Draft hot paths may cache the professionally eligible champion pool, champion strengths, role indexes and champion/system fit only while the patch revision and relevant date/pool identity remain valid. Eligibility changes must invalidate or extend cached state without changing deterministic draft results.
- Meta-history readers share a world-owned index/query cache keyed by history identity/length and filter dimensions. Patch diagnosis must not repeatedly scan and resort the complete history when an indexed patch subset is available.
- Historical patch reconstruction uses the pinned source baseline plus retained deltas. Full baseline copies are derived state and are excluded from saves.
- High-volume meta history is compacted only at persistence boundaries and restored losslessly on load; runtime consumers continue to use the normal object schema. Save-only season compaction must not mutate live runtime objects.
- The world save schema and UI save namespace/version are one contract and CI must reject mismatches.
- Artifact module order has one manifest. Build, syntax checks and smoke tests may not maintain independent copies of the module list.
- Large UI domains live in `ui-*.js` modules. Patch/meta, market/roster and season/world/progression surfaces are separated from `app.js`; Item 11 draft UI must be a separate domain module.
- Because the artifact is concatenated into one script, CI rejects duplicate top-level global symbols across source modules.
- Optimization work must preserve deterministic simulation behavior and accepted Items 1–10; performance shortcuts may not remove engine rules or player/AI parity. CI runs a performance probe to record simulation/cache/query costs without using unstable wall-clock thresholds as correctness gates.


## D-039 — Live draft keeps flex positions hidden

**Decision:** Major System 11 stores live picks as ordered champion selections, not fixed lane assignments. A legal five-role assignment is resolved only after all ten picks are complete.

- Every pick must preserve at least one legal one-champion-per-role matching across TOP/JGL/MID/ADC/SUP. An invalid pick is rejected before lock-in.
- A flex champion may remain feasible in multiple roles throughout the draft. The UI does not disclose an internal intended role because no committed role exists yet.
- Draft AI evaluates opponent counters against the set of publicly possible role assignments, not a hidden fixed lane. Internal candidate scoring may consider which of the AI team's own feasible roles would make a pick valuable, but that intent is discarded after lock-in.
- Final role assignment is deterministic and optimizes the team's own player mastery, meta evaluation and champion/system fit. It does not inspect a hidden opponent assignment to gain a second-mover advantage.
- Match simulation, Fearless tracking, meta recording and replays continue to consume the finalized role map; recorded games remain replayable through the existing forced-draft contract.


## D-040 — Champion portrait identity is stable derived presentation

**Decision:** Champion portraits use a stable identity contract without storing binary images in saves.

- Pinned real champions prefer their Riot Data Dragon square champion icon by stable Riot alias. The standalone client supplies a deterministic local SVG fallback when the network image is unavailable.
- Newly generated LOL GM champions receive a versioned visual profile at release: seed, theme, silhouette, weapon, ornament, pose and aura. The profile is stored in patch history so historical reconstruction and save/reload retain the same visual identity.
- The rendered generated portrait is derived presentation data. It is an original high-fantasy painted-card composition produced locally from the stable visual profile; saves do not embed image bytes.
- Major reworks may increment the generated champion's portrait revision while preserving the stable champion ID and visual identity seed.
- Draft cards, pick slots and later champion surfaces must use the shared portrait resolver rather than inventing per-screen placeholders.


## D-041 — Generated content uses semantic naming, not blind prefix/suffix concatenation

**Decision:** Long-save champion, item and rune names are generated from the content's gameplay identity before uniqueness checks.

- New champion naming selects a phonetic family from role, archetype and damage identity, then produces paired internal English and Korean display names. Name candidates are rejected when they are identical or too similar to existing champion names.
- New item naming derives its vocabulary from the strongest gameplay effect and intended class. Offensive, defensive, sustain, mobility, haste, utility, early-game and scaling items therefore draw from different semantic word banks.
- New rune naming derives from both the rune style and its strongest effect; keystones may use a stronger naming form than minor runes.
- Generated definitions persist a small versioned naming profile containing theme/effect and prefix identity. Recent-prefix checks prevent the same naming stem from being emitted repeatedly in sequence.
- Existing official names remain untouched. Generated names are stable after release and are preserved in patch history/save reconstruction.
- CI smoke tests generate batches across champions/items/runes and reject duplicate, near-duplicate or single-language outputs.


## D-042 — Managed official matches pause world progression at the draft boundary

**Decision:** Official matches involving the managed team are deferred before simulation and exposed through a persistent world-level pending queue.

- A competition day may simulate and record AI-only matches while leaving the managed match unresolved. The season day does not advance or run stage-transition logic until every scheduled match on that day has a result.
- The pending official state persists the date plus season/match identifiers. While it is non-empty, world progression returns that pending state without rerunning patch ticks, recovery, training, scrims or reserve management for the date.
- The official draft UI is modal and locked. Reloading reconstructs the pending first-game draft from the stable series seed, side/first-pick rules and tournament champion pool.
- Managed official Bo3/Bo5 series are persisted as game-level series sessions. Every game opens a fresh live draft, then its result updates series score, loser-controlled next-game choice, mental modifiers, series adaptation and Fearless history before the next draft is prepared.
- Every completed game contributes all ten picked champions to the fixed Fearless lock set for later games in that series; regular bans remain additional to those locks.
- Scheduled result commit is guarded against duplication. Statistics, meta, player usage, scouting and stage advancement continue through the same official pipelines after the full series resolves.


## D-043 — First Selection source depends on competition context

**Decision:** Game-one First Selection is assigned by the competition context, while games two onward always belong to the previous game's loser.

- Domestic double round-robin: match side A is the home team and receives game-one First Selection. The return fixture reverses the pairing, so the other club receives the same home advantage once.
- Domestic seeded playoffs may explicitly set `firstChoice: seed`, giving the higher seeded side game-one First Selection.
- International knockout/bracket stages use seeds only for qualification, bracket placement and byes. Once a knockout matchup exists, both single- and double-elimination game-one First Selection use a coin toss; seed order does not carry into that match.
- From game two onward, the previous game's losing team owns First Selection regardless of how game one was assigned.
- First Selection means choosing either side (blue/red) or pick order (first/last). The opponent then chooses the remaining dimension. A managed team gets a UI choice whether it is the First Selection holder or the team making the remaining selection.

## D-045 — Managed-club sporting decisions require explicit player authority

**Decision:** Convenience automation may assist the managed club but may not commit consequential sporting choices on the player's behalf.

- The player is the managed club's head coach and final sporting decision-maker.
- Player signings, transfers, releases, renewals, team-option exercise, roster movement, starters/roles, tactics/training direction and all senior/specialist coaching appointments require explicit player action.
- Staff AI may recommend, filter, rank, prefill, batch administrative steps and surface consequences, but cannot turn a recommendation into a transaction or lineup decision.
- Player options are exercised by the player/agent side, not the club. Contract expiry at the registration/market deadline is a rules consequence rather than an AI roster decision.
- A managed-team staff retirement leaves a vacancy; the engine does not silently generate a replacement. AI clubs may still replace staff automatically.
- For the managed club, the legacy team.coach simulation slot is presented as the senior assistant. The human player occupies the head-coach role.
- Board-owned infrastructure remains outside this sporting-control boundary; its automation is not treated as head-coach convenience automation.


## D-046 — League rules are global capabilities with regional office ownership

**Decision:** A league-rule feature is not complete if it only works for LCK or any other single named region.

- Every active regional league owns its own league-office policy state for every implemented rule category that applies to domestic competition.
- Verified real-world rules may seed a named region's initial state, but they are inputs to the shared rules engine, not special-case engine branches.
- Missing or uncertain regional rules must remain region-local: infer from that region's own structure/evidence or preserve the status quo. Never copy LCK, LPL, LEC, LCS, LCP, CBLOL, or another region merely as a fallback.
- Rule categories include roster/registration, contracts where league-governed, coaching-staff registration, local/non-local eligibility administration, spending controls, Tier-2 ownership and movement, promotion/relegation, domestic competition formats, scheduling, licensing and other office-owned constraints. Fearless and First Selection are fixed match-system concepts and are not regional-office policy.
- International-tournament rules belong to the international office and do not inherit a domestic office rule unless the international rule explicitly references it.
- Human-managed and AI-managed clubs use the same rule checks and transaction/state-transition paths. The only ownership difference is who chooses an action: the player or that club's AI.
- AI clubs are bounded decision-makers, not optimal solvers. Their choices are based on available/scouted information, staff quality, finances, goals and philosophy, so they can make explainable mistakes without bypassing rules.
- Acceptance for a new rule system must include cross-region coverage: at least two different regional policy states, plus parity checks showing human and AI clubs cannot bypass the same constraints.


## D-047 — Local eligibility, transfers and roster registration are separate rule layers

**Decision:** Player identity, local eligibility, transfer counting and competition registration are distinct state machines and must not be inferred from one `player.region` comparison.

- A player keeps nationality/origin identity independently from the one active registration-local eligibility.
- Multi-national players choose one origin local at career start; that first selection remains the permanent origin-local entitlement.
- A player may acquire a non-origin local only through continuous service in one region under qualification terms agreed by that regional office and the international office. Qualification grants a player/agent choice; it does not auto-switch the active local.
- Only one active local exists at a time. Relinquishing an acquired local restores the origin local immediately; a relinquished non-origin local must be earned again from scratch.
- Same-region club movement preserves service. A same-region FA gap preserves progress but adds no service time. Cross-region loan pauses progress without adding service in either region. Registration to another region by normal contract resets the previous region's progress.
- The official registered-roster non-local cap is globally fixed at two.
- Contracted club-to-club permanent transfers are capped at two per player per year. Free-agent signings, same-organization first/reserve movement and league-restructuring movement are not transfers.
- Regional offices own transfer-window timing and domestic registration-window/change-count rules. Free agents may sign year-round, but official eligibility begins at a valid registration opportunity.
- Official first-team registration is 5–10 players; the ten-player cap does not limit the club's total contracted players.
- A domestically deregistered player may be registered again only after skipping at least one registration period and consuming the normal available change allowance.
- International tournaments lock the initially submitted final roster for the event; only pre-published international-office emergency replacement rules may override the lock.
- Detailed canonical rules are maintained in `docs/ROSTER_TRANSFER_LOCAL_RULES.md`.


## D-048 — Fearless and First Selection are fixed match-system invariants

**Decision:** Fearless and First Selection are core LOL GM match rules, not policy toggles owned by regional or international offices.

- Fearless remains fixed for official series and cannot be enabled/disabled by a league office.
- First Selection's concept and choice procedure remain fixed.
- Game-one source follows D-043: domestic double round-robin home team; explicitly seeded domestic playoff higher seed; international knockout/bracket coin toss after matchup formation.
- Games two onward always assign First Selection to the previous game's loser.
- Offices may schedule competitions and registration rules around these systems but may not replace or disable the systems themselves.
