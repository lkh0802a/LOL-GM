> Documentation review 2026-10-03: [navigation](README.md), [active priorities and validation](DEVELOPMENT.md). Latest explicit user direction and later confirmed decisions supersede dated instructions; historical evidence is retained.

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
- primary/secondary position familiarity was explicit and trainable in the v12 implementation; this permission model is superseded by D-058
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
- Historical baseline: CBLOL was a distinct Brazilian ecosystem. The confirmed 2026-10-04 new-career South American LSA identity supersedes this geography; legacy saves retain their recorded region identities.
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
- The human player occupies the managed club's head-coach role. There is no separate generic senior-assistant role in the target staff model; legacy `team.coach` dependencies must be migrated into specialist staff systems rather than surfaced as a senior assistant.
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
- A player may acquire a non-origin local only through continuous service in one region under qualification terms agreed by that regional office and the international office. Qualification grants a player/agent choice; it does not auto-switch the active local. If qualification is completed mid-season, activation of the newly acquired local is deferred until the next season.
- Only one active local exists at a time. A switch, including restoration of the origin local after an acquired local was active, takes effect from the next season and is chosen during the offseason. An earned non-origin eligibility that was never activated remains available only for its rule-defined validity period; a non-origin local that was actually activated and later relinquished must be earned again from scratch.
- Same-region club movement preserves service. A same-region FA gap preserves progress but adds no service time. Cross-region loan pauses progress without adding service in either region. Registration to another region by normal contract resets the previous region's progress.
- When a qualification rule measures service by seasons, a partial/half season with actual registration and service in that region counts as one service season; paused FA or cross-region-loan time does not create service credit.
- The official first-team registered-roster non-local cap is globally fixed at two; it does not cap the club's total contracted players or reserve/Academy holdings.
- Contracted club-to-club moves are capped at two per player per **season**, measured from season start through season end. A loan departure counts once, while return to the parent club does not add another move. Free-agent signings, same-organization first/reserve movement and league-restructuring movement are not transfers.
- Regional offices own transfer-window timing, official registration windows and broader first/reserve internal-movement windows. Free agents may sign year-round, but official eligibility begins at a valid registration opportunity.
- Official first-team registration is 5–10 players and must contain at least one player eligible for each of TOP/JGL/MID/ADC/SUP. The ten-player cap does not limit the club's total contracted players. A player may occupy only one official roster at a time, so simultaneous first-team and reserve/Academy registration is prohibited. A loanee may be officially registered only by the borrowing club during the loan.
- Domestic official-roster changes have no separate count limit: clubs may change the list freely while a regional registration window is open and cannot make ordinary changes while it is closed. A deregistered player may return when a later registration window opens.
- Emergency replacement rules are office-owned exceptions: the competition office predefines whether a full ten-player roster must first deregister someone or may temporarily exceed ten for the emergency replacement.
- International tournaments lock the initially submitted final roster for the event; only pre-published international-office emergency replacement rules may override the lock.
- Detailed canonical rules are maintained in `docs/ROSTER_TRANSFER_LOCAL_RULES.md`.


## D-048 — Fearless and First Selection are fixed match-system invariants

**Decision:** Fearless and First Selection are core LOL GM match rules, not policy toggles owned by regional or international offices.

- Fearless remains fixed for official series and cannot be enabled/disabled by a league office.
- First Selection's concept and choice procedure remain fixed.
- Game-one source follows D-043: domestic double round-robin home team; explicitly seeded domestic playoff higher seed; international knockout/bracket coin toss after matchup formation.
- Games two onward always assign First Selection to the previous game's loser.
- Offices may schedule competitions and registration rules around these systems but may not replace or disable the systems themselves.


## D-049 — Internal squad assignment is separate from official competition registration

**Decision:** First-team/reserve/Academy squad assignment and official competition registration are separate states.

- Regional offices define broad internal-movement windows for first-team↔reserve/Academy promotion and demotion. These windows should be materially more permissive than official competition-registration windows.
- There is no promotion/demotion count limit inside an open internal-movement window.
- Internal movement can occur while the official registration window is closed if the internal-movement window is still open.
- Such a move changes training/scrim/squad assignment immediately but does not silently change official match eligibility.
- Official match eligibility changes only through an open official registration window or a valid emergency exception.
- Selection changes among players already on the same official roster, including between games of a Bo3/Bo5 where otherwise legal, are not roster-registration changes and have no separate count limit.


## D-050 — Superseded registered-primary-role model

**Status:** **SUPERSEDED by D-058.** This checkpoint documented the earlier registered-primary-role design and is retained only as decision history. Runtime and current rules must not use it as an eligibility source.


## D-051 — Reserve/Academy registration remains region-owned

**Decision:** Reserve/Academy roster structure is not forced to mirror the first team.

- Reserve/Academy official rosters have a global minimum of five players. They do **not** need five different natural primary roles; a match uses five distinct registered players assigned to the five game slots under D-058. Each regional office sets the maximum size and its own non-local rule.
- An organization that directly owns a reserve/Academy team has an integrated organization-roster minimum of **11 players**. This is not a third roster; it is the first team plus owned reserve units viewed as one organization. The extra player above the two five-player minima exists as an emergency-callup buffer so one ordinary temporary absence does not automatically force a first-team or reserve forfeit. Independent second-division clubs do not share this privilege.
- A first-team player may appear in a reserve/Academy official match only when both the internal-movement window and that competition's registration window allow the move.
- Regional offices may set a cooldown between call-up and send-down actions.
- A first-team-registered player may train with the reserve group without automatically losing first-team registration, and reserve players may freely join first-team training/scrims without a formal internal move. Official-match eligibility remains registration-controlled.
- Academy units that are structurally separate from reserve teams are development-only and do not participate in league-pyramid promotion/relegation.
- Internal movement is locked for the duration of an international tournament.
- The managed club and AI clubs use the same reserve/Academy eligibility and movement checks.


## D-052 — Loans and offseason contract exits use explicit clauses

**Decision:** Loan and contract-exit behavior is clause-driven rather than free-form.

- Loans last either half a season or one full season.
- Early recall is legal only when the loan contract contains a recall clause.
- Loan fees may be zero. Salary responsibility is negotiable from 0–100% between parent and borrowing clubs.
- Both optional purchase clauses and mandatory purchase clauses are supported.
- A loan departure consumes one of the player's two allowed contracted moves that season; returning to the parent club does not consume another.
- Mutual contract termination is restricted to the offseason.
- Unilateral club release pays the guaranteed remainder defined by that player's contract guarantee percentage/amount.


## D-053 — Renewal intent and relationship breakdown precede transfer requests

**Decision:** Player dissatisfaction primarily affects relationships and retention, not automatic transfer requests.

- Negative playing time, role, team results, coaching, contract treatment or interpersonal conditions reduce satisfaction and club/player relationship quality.
- The largest sporting-business consequence is lower renewal willingness: higher demands, shorter patience, negotiation breakdown and eventual free departure become more likely.
- Explicit transfer wishes are rare escalation events reserved for severe, sustained breakdowns rather than the default response to dissatisfaction.
- After the season's final international tournament, the incumbent club receives a 14-day exclusive renewal-negotiation period for expiring players. Other clubs may contact/negotiate from day 15 onward. This is exclusivity only, not a right to match or automatic retention.


## D-054 — Matchday use is the registered roster, not a second mini-roster

**Decision:** Official registration is the player-eligibility boundary.

- Every officially registered player is available for match selection; no separate reduced matchday roster is required.
- A game itself has no player substitutions after it starts. Between games of a Bo3/Bo5, registered players may be changed.
- Five eligible starters are sufficient; no minimum bench size exists.
- Fewer than five eligible players means a forfeit unless a pre-published emergency-replacement rule validly restores eligibility.
- Injuries exist but are rare; condition, fatigue and illness are the normal availability pressures.
- The first-team non-local cap is a roster cap, not a starting-lineup cap, so both registered non-local players may start together.


## D-055 — Staff employment is departmental; competition accreditation is office-owned

**Decision:** Club employment limits and competition-event accreditation are separate.

- The managed user is the head coach. The target model has no generic senior assistant.
- Coaching staff are a separate department with up to **9 employed coaches**, allowing strategic/development/performance specialists and all five positional coaches if the club chooses.
- Analysts are a separate department with up to **4 analysts**.
- Scouts are a separate department with up to **6 scouts**.
- These are club employment caps, not mandatory staffing levels; wages and club finances should make full departments expensive.
- Regional/international offices may separately limit how many employed staff can be officially accredited or present for a competition/event.
- Legacy `team.coach` behavior must be migrated into specialist staff attributes before the generic slot is removed from runtime.


## D-056 — Final rule sweep: player, staff, international and governance rules

**Decision:** The remaining 69 pre-implementation choices are frozen by the 2026-09-28 rule sweep.

- Player↔manager uses separate relationship and trust dimensions; all player pairs have relationship state that can affect teamwork.
- There is no formal captain slot. Leadership is emergent and mainly stabilizes morale/relationships.
- Explicit agents are reserved for notable players; others use personal negotiation tendencies.
- Renewal rejection creates cooldowns; fully broken talks reopen only after meaningful context change.
- Contract lengths are negotiated rather than globally fixed. Playing-time/role promises may be contractual or verbal.
- Every permanent transfer requires player consent. Outside pre-contracts open after the incumbent club's 14-day exclusivity period.
- Incoming-region transfer windows govern cross-region transfers; loan-to-purchase conversion does not consume an extra move.
- Position conversion is consensual and completed from long-term training progress, role-fit development, champion preparation and scrim/official use. General secondary-role familiarity is not part of the current model.
- Academy has no global age cap; veteran eligibility is regional policy.
- Earned-but-inactive local eligibility has a validity period. Qualification-rule changes grandfather existing progress.
- Region split/merge lets players choose successor local status, with legacy-local protection through the current contract for players made non-local only by restructuring.
- Staff may hold multiple specialties with diluted effect; duplicate analysts have diminishing returns; pre-hire exact staff ability is hidden.
- International patch lock is seven days before event start. International coefficients use weighted results from the prior three years with tournament-specific weights, with recent Worlds as extra-slot tiebreak.
- International phases pause all top-division domestic official play globally.
- Administrative violations may be adjudicated after submission; clearly illegal state transitions are blocked before submission.
- Injuries are rare and representative; illness is more common; burnout is a rare sustained-overload outcome.

Canonical detail:
- `docs/PLAYER_RELATION_CONTRACT_RULES.md`
- `docs/ROSTER_TRANSFER_LOCAL_RULES.md`
- `docs/STAFF_RULES.md`
- `docs/INTERNATIONAL_OFFICE_RULES.md`
- `docs/GOVERNANCE_RESTRUCTURE_RULES.md`

## D-057 — Initial market, scouting memory, club philosophy and scrim geography follow-up

**Decision:** The 2026-09-28 realism follow-up replaces simplifying defaults with the following rules.

- The first-season AI roster market behaves like a market: clubs make competing offers in rounds and players compare offers instead of clubs receiving players through a fixed sequential draft order.
- AI clubs do not share one fixed roster size. Their target squad depth varies within the legal roster limits from finances, goals and club philosophy.
- Non-local slots are strategic assets, not local-first restrictions. AI recruitment may use them for stars, value signings or prospects according to team philosophy, provided the eventual legal roster remains feasible.
- AI scouting knowledge is persistent per club/player rather than a stateless perfect-information lookup.
- True potential may have a weak indirect effect on the market, but clubs do not read exact hidden potential for decisions.
- Scrims are easiest within the same region, are routinely possible with geographically nearby regions, and become much easier across long distance when teams are co-located for international events or future bootcamps/travel.
- Club philosophy evolves from ownership, finances, results, development structure and club history rather than remaining a permanently random creation-time label.
- Player contracts are freely negotiated within a **maximum duration of three years**.

Implementation must keep these decisions separate from temporary tuning constants and preserve player/AI legality parity.

## D-058 — Match roles are lineup assignments, not registration permissions

**Decision:** A professional player's primary role is identity/specialization, not an official-match eligibility gate.

- A legal match lineup is five distinct registered players assigned one each to TOP/JGL/MID/ADC/SUP. The players do not need matching primary roles.
- First-team and reserve/Academy registration no longer require one natural-primary player for each of the five roles.
- General secondary-role permission/familiarity fields are removed. Off-role performance comes from role-weighted attributes, champion pool, tactics/adaptation and accumulated experience rather than a stored eligibility flag or flat percentage penalty.
- There is no separate emergency-off-role exception. Emergency call-ups use the same lineup rule; if the reserve side has to move another player into the vacated slot, the organization bears the resulting performance cost rather than a forfeit caused solely by primary-role labels.
- Long-term role conversion remains a distinct career/training decision. The manager may propose it and the player may accept or reject it. Conversion is not required for one-off off-role match usage.
- Conversion spam is discouraged by training opportunity cost, adaptation/champion-preparation loss and possible relationship/satisfaction effects, not by a hard system cooldown or a match-eligibility lock.
- Once sustained training and real usage establish the new specialization, the player's primary-role identity may change; this identity update is not tied to a registration window.
- **Role-conversion implementation status:** manager proposals can be accepted or rejected; accepted conversions accumulate daily training plus target-role official/scrim usage, prepare target-role champion pools, consume part of general development opportunity, can be cancelled or redirected with sunk costs, and persist role-change history. AI clubs use the same conversion API and may propose conversions for players they are already using off-role.

## Player champion disclosure refinement (2026-10-03)

Foreign player champion information is public observed identity/count/result/date
history, never hidden pool membership or a mastery ranking. Scouting knowledge
alone cannot turn appearance counts into numerical mastery. Current controlled
squads retain private preparation; owned reserves follow manager scope, outgoing
loans follow their current borrower, and fired managers lose internal access.
Missing player-attributed legacy records remain unknown rather than inferred.
This refinement does not claim the rest of foreign player profiles are protected;
derived traits and exact live fields remain the next documented implementation.

## Observer-safe player profile refinement (2026-10-03)

Foreign derived metrics reuse the existing observed attribute signal; unsupported
exact tendencies/personality/development and live management state are private.
Foreign displayed market value uses observed ability, the displayed potential
range midpoint and neutral form with the existing formula; own values and AI
market decisions remain unchanged. Private management events are filtered from
foreign display without deleting history. Firing removes automatic 100-percent
owned-club knowledge. Draft mastery/pool observation still requires the next
separate information-boundary slice; the whole game is not declared leak-free.

## Draft opponent information refinement (2026-10-03)

Foreign mastery has no saved numerical observation yet. Legacy scouting
knowledge, staff context and public appearances do not imply a mastery estimate.
Use the existing 25 calculation fallback uniformly for unknown foreign mastery,
retain [20,99] only as a compatibility representation of the whole unknown range,
and display unobserved numerical skill explicitly. Ban shortlists and scores use
the observer's meta and neutral unknown opponent scaling, while own skill and
public draft/series information remain legitimate inputs. This intentionally
changes decisions and outcomes. A later bounded scouting-time saved signal may
restore justified numerical estimates; no live foreign skill or unobserved pool
membership is consulted by the corrected draft paths.

## Regional league naming and new-career geography — 2026-10-04

Confirmed by the user: keep familiar LCK/LPL-style identities, use three-letter
L-prefixed league abbreviations, and give tier two distinct names without an
all-D pattern. Initial major pairs: LCK/LKC, LPL/LDL, LEC/LEA, LCS/LNA,
LCP/LPA, LSA/LSC. Newly named competitions are fictional aliases, not asserted
real esports policy. Minor presets also use distinct L-prefixed abbreviations.

New careers include all six major tier-twos. Existing franchise/mixed governance,
owned-reserve authority and independent promotion eligibility determine teams;
a league alias must not assign Korean financial or registration policies.
North America retains LCS; South America replaces Brazil-only CBLOL with LSA.
The LA expansion key becomes Central America/Caribbean, attached to North America.
Its independence does not exhaust or automatically dissolve North America.
Player origin/local identity remains region-based; no country list was fabricated.

Stable BR/LA keys and top-short + 2 competition IDs remain compatible. Loading
old saves only repairs generated default tier-two display names/shorts, keeping
custom names, prior geography, player contracts/eligibility, season keys and
archived result names. Existing careers do not gain new reserve clubs on load.

Every newly founded regional league must create a real tier two and retain it;
only legacy optional structures may still abolish theirs. New founded leagues
receive distinct, collision-checked three-letter L-prefixed aliases for both tiers.

Confirmed next vertical boundary: integrated regions keep a shared top tier but
run country-level tier-two leagues. Add explicit club home-country identity and
country competition membership/schedules/standings; preserve umbrella local
eligibility, owned-club recruitment authority and international regional attribution.
This is authorized but pending; current region-wide tier-twos do not prove it done.

The expanded initial ecosystem reproduced an exhausted local pool during the
first auction. New-world generation now fills a deterministic regional FA supply
shortfall before bidding, using the actual sum of legal minimum targets plus
maximum outside-region non-local capacity. Existing players are retained and
normal generation/salary rules apply. This conservative bound protects roster
formation without changing import caps, minimum squad sizes or club budgets,
but creates a larger FA pool; it is capacity support, not measured pro talent supply.
No athletes are fabricated mid-auction to rescue a failing bid.

2026-10-04 추가 확인: 통합 1부/국가별 2부 연결에서 승강제 규칙은 리그 사무국이
결정한다. 개발자는 참가 자격·승강 인원·선발전·시행 시점의 데이터와 실제 다음 시즌
편성을 연결하며 임의의 고정 승강 규칙을 대신 확정하지 않는다. 소유 2군은
모구단과 같은 1부로 승격할 수 없다. 국가별 하부 편성과 이 사무국 연결은 후속 10.2 범위다.

Country affiliation refinement, confirmed 2026-10-04: club home-country and
reserve development/operating country are independently selectable. Reserves
may develop abroad; league participation needs office approval, and a training
location does not grant athlete nationality or local registration eligibility.
This supersedes the proposed compulsory parent-country reserve assignment.

Broadcast scope correction, confirmed 2026-10-04: prohibit overlapping official
international series broadcasts globally and overlapping series within the same
domestic league. Different domestic leagues may run in parallel. Whole tournament
periods may overlap; Eastern/Western Cup are equal-standing events, not an ordered
higher/lower pair. Add planned-window reservation and actual overrun shifts; merely
staggering starts is insufficient. Preserve venue time zones and UTC/KST views.
This scheduler/overrun connection is pending 10.3, not implemented by whole-event
serialization in the current naming/governance slice.

Default official domestic labels are 스플릿 1/2/3. Regional office `splitNames`
overrides affect generated domestic season labels; historical aliases stay.

## UI 전면 재설계 승인 — 2026-10-04 (Asia/Seoul)

사용자는 내부 구현과 UI 사이의 괴리를 이유로 기존 화면에 부분 수정만 누적하는 대신 UI 전면 재설계를 승인했다. 개발 범위와 순서는 [개발 가이드의 12.3–12.5](DEVELOPMENT.md#ui-전면-재설계--승인된-현재-범위)를 따른다. 구단 운영 흐름 중심으로 정보 구조와 내비게이션, 각 도메인의 화면을 새로 구성하되 검증된 엔진/공유 명령과 저장·기록 호환성을 유지한다.

내부 기능 존재나 시각적 개편만으로 완료로 보지 않는다. 실제 조작, 조건/권한 안내, 엔진 상태 반영, 결과와 이유 표시, 저장·재접속의 일관성이 각 화면 교체의 완료 기준이다. 의미 있는 경영 선택과 직접 운영 권한을 보존하면서 반복 입력/이동/알림을 줄인다. 기능 연결이 검증된 화면부터 순차 교체하고 UI 변경으로 새로운 규칙이나 밸런스 정책을 몰래 도입하지 않는다. 현재 상태는 승인/구현 예정이며 리그 선택 UI 수정은 전면 재설계의 완료 증거가 아니다.

UI 재설계의 추가 확정 기준은 수정 용이성이다. 공통 표현/스타일은 중앙 관리하고 화면별 책임과 엔진 명령 경계를 명확히 하며, 불필요한 프레임워크·깊은 추상화·규칙 복제를 피한다. 화면별 수정 위치와 집중 검증 진입점을 개발 문서에 유지한다.
