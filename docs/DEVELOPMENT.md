# LOL GM — Development Guide

Latest delivery direction: [playable desktop/mobile HTML first, then Android](ANDROID_TARGET.md).
Use the focused development map below and [CI result guide](CI_RESULTS.md)
to select minimal local checks and reuse Actions evidence. Development-efficiency
Issues #57 and #62 are complete. Continue unfinished gameplay and mobile
UX/performance, deliver playable standalone HTML on desktop/mobile browsers,
then complete Android packaging and real-device installation validation.

## Development ownership and handoff

The user owns game direction and final design. ChatGPT owns project priorities,
technical direction, architecture decisions, code review, Actions management and
result verification, and implements changes directly when that is efficient.
Codex is primarily assigned larger multi-file, structurally complex or repetitive
implementation work. Work is divided by task scope, not by an exclusive developer
role. Do not independently implement the same change in parallel.

Actions handles repeated full regression, long simulation and builds. Whoever
implements a change should use focused reproduction instead of repeated
full-source analysis and routine full local runs. Codex work remains subject to
the same repository review, acceptance and CI gates as direct ChatGPT changes.

Keep each step independently reviewable and commit-ready. At a step boundary,
record the goal, finished/remaining work, changed files, tests and failures,
next candidate, temporary code/TODOs and important decisions in the PR and this
existing guide as needed. Never assume allowance remains long enough to finish
a broad rewrite. Prefer explicit ownership and clear code over temporary hacks,
unexplained constants and session-only knowledge; preserve work for takeover
without continually adding new status documents.

## Current Phase

`CURRENT_PHASE = PHASE_1_CORE_FOUNDATION`

The Artifact migration is complete and accepted. GitHub is now the primary development codebase.

Current Phase 1 goal: replace prototype-only state with coherent persistent game state and complete the first real gameplay loop.

Development progress covers the user's full numbered roadmap through Item 23.
Finish each major system's accepted gameplay loop before advancing. D01–D13
are depth corrections to that roadmap, not a replacement or a stopping point.
Items 13–23 remain in scope; an omitted status row is not evidence of completion.
Use the full specification to verify their names, dependencies and actual code
before assigning acceptance status. Deliver desktop/mobile playable HTML before APK.

- `1. 새 게임 / 팀 선택` — COMPLETE (2026-09-27)
- `2. 선수` — COMPLETE (2026-09-27)
- `3. 선수 만족도 / 역할` — COMPLETE (2026-09-27)
- `4. 신인 / 스카우팅` — COMPLETE (2026-09-27)
- `5. 계약 / 이적시장` — COMPLETE (2026-09-27)
- `6. 1부 / 2부 / Academy` — COMPLETE (2026-09-27)
- `7. 팀 / 시설 / 스태프` — COMPLETE (2026-09-27)
- `8. 훈련 / 스크림` — COMPLETE (2026-09-27)
- `9. 챔피언 / 메타 / 패치` — COMPLETE (2026-09-27)
- `10. 패치 엔진` — COMPLETE (2026-09-27)
- `11. 실제 LoL식 밴픽 UI` — COMPLETE (2026-09-28)
- `11.5. 아키텍처 정리 / UI 통합` — COMPLETE (2026-09-29; steps 1–6)
- `12. 시설 / 재정` — COMPLETE (2026-09-29; Phase 12 acceptance, engine regression, 2-season career, performance and build CI passed). See `docs/PHASE_12_FINANCE.md`.

## Retroactive depth audit of previously accepted Items 1–11 and 11.5 (2026-09-29)

**The historical COMPLETE marks above remain valid as baseline engine and regression acceptances, not certification that every game-design rule has full depth.** Do not infer from these status labels that contract/loan systems, staff negotiations, AI-owned scouting observations, realistic calendar day progression or all champion interactions are finished.

The source-backed discrepancy matrix and executable follow-up backlog are maintained in **[`docs/RETROACTIVE_DEPTH_AUDIT_1_11.md`](RETROACTIVE_DEPTH_AUDIT_1_11.md)**. It separates verified gaps from unverified depth, explicitly preserves existing working systems, and identifies follow-up dependencies and tests. Its P0 findings include calendar gaps, per-club scouting depth, contract/loan terms and staff-market realism; later work must decide scheduling explicitly rather than silently claiming they were completed or rewriting the engine wholesale.

## Functional depth acceptance rule (2026-09-29)

**Existing function/class/UI presence is a baseline, not a completion criterion.** For each of Items 12–23 and any revisit of earlier systems, build and validate a complete cause-and-effect gameplay loop: data/state → engine decision/constraint → interaction with adjacent domains → player-facing consequences → long-save consistency → AI/manager parity → tests under normal and stress conditions. Reusing the existing code is preferred to writing duplicate systems; filling only UI counters or producing documentation is insufficient. Game-world and club-economic outcomes must be emergent from their respective entities' actual context, not universal scripted rewards.

The first Item 12 pass was limited to budget outlooks and prepaid-flow accounting; Item 12-B adds sponsor choices and sport-based payouts, regional commerce, liquidity-sensitive AI policies, a specialized scouting facility and actual parent/academy fiscal transfers. See `docs/PHASE_12_FINANCE.md`. 100-season economy inflation/competitive convergence belongs to the long-run QA stage and must not be claimed as validated by a two-season acceptance alone. Future item completion claims must explain both actual game rules delivered and known boundaries, not simply which existing modules were found.

## Product-wide convenience acceptance rule (2026-09-27)

Every major system, including already engine-complete Items 1–6, is subject to a standing convenience acceptance rule: automate repetitive or administrative actions only when they do not commit a strategic choice; recommendations, batching, sorting and prefill may be automated, but consequential sporting decisions for the managed club require explicit player confirmation; batch repeated actions where practical; preview projected state, cost and consequences before commit; validate the final state rather than transient intermediate clicks; preserve filters/scroll/editing context; and keep mobile decision surfaces compact. Completion status means the engine contract is accepted, not that poor interaction patterns are frozen.

Current retrofit evidence: squad starters/roles/tactics/training and first/reserve assignment use staged apply; roster-plan validation is final-state/atomic; scouting supports multi-select batch observation; initial blank-roster recruitment supports batch interest/scouting; costly release and staff changes preview financial/ability consequences; facility upgrades are automated by club management rather than exposed as repetitive manual administration.

Item 7 acceptance (2026-09-27): clubs have functional training, analysis, recovery and youth infrastructure with direct development/analysis/recovery effects and full upkeep accounting. Infrastructure capex is board-controlled for both player and AI clubs, uses the shared upgrade/cash validation path, respects club philosophy and financial reserves, and removes low-value manual facility clicking. The player is the managed club's head coach. The legacy coach slot is presented as the senior assistant, alongside strategic, analyst, development and performance specialists; these roles materially affect draft/analysis/development/recovery, carry salary/severance costs, persist in saves, age and recycle through the staff market. AI first-division clubs evaluate specialist upgrades using the same staff market while respecting philosophy, improvement threshold and cash reserve. Player-controlled staff changes remain strategic choices and preview ability/cost consequences. Save round-trip and insufficient-funds invariants are smoke-tested; standalone and latest-head CI pass.

Item 8 acceptance (2026-09-27): training combines 100-point focus allocation with light/normal/high intensity, creating a real growth-versus-fatigue/condition trade-off. Schedule-aware recommendations use the next official match and current squad recovery state; player control is preserved while AI uses the same recommendation logic. Scrims remain unofficial but persist champion scrim experience/confidence, player fatigue/condition cost and team analysis intel. Exhausted squads and excessive same-day volume are blocked. Stronger partners can provide more practice value, while repeated partners have diminishing returns; the UI previews this value and AI partner selection uses the same function without hidden information. Smoke coverage locks training automation, scrim development effects, schedule recommendation validity and repeated-partner diminishing value.

Item 9 acceptance (2026-09-27): the initial 26.19 world embeds a patch-pinned Riot Data Dragon 16.19.1 baseline for all 173 champions with stable LOL GM IDs, Korean names, Korean passive/Q/W/E/R descriptions, exposed base stats and spell cooldown/cost/range source fields. Runtime normalization preserves source provenance while simulation-only mechanics remain explicitly derived; champion base/detail data is consumed by draft/composition/combat logic rather than being display-only. Champion detail UI shows authoritative Korean descriptions and distinguishes source fields from simulation interpretation. Official-match meta history persists competition/season/year/split/stage/league/domestic-international/region/team/player/actual-position context with filters and champion player/team/matchup/recent insights. Global professional eligibility, locked tournament champion pools, practice access during the global ban, regional meta evidence, persistent team meta knowledge/counter-research, cross-region learning and stable-ID rare reworks are smoke-covered. This acceptance does not complete Item 10: autonomous patch diagnosis/change selection remains a separate patch-engine system.

Item 10 acceptance (2026-09-27): the patch engine diagnoses the live professional meta from per-patch evidence rather than win rate alone, combining sample confidence, pick-ban pressure, win rate, recent trend, actual-position flex, regional/international spread, top-team usage, player/team concentration and composition dependence. Consecutive same-direction changes are damped, opposite overshoot can generate partial rollback, and micro/small/medium/large magnitudes apply real old→new changes across base/growth stats, attack/spell range, resource costs, cooldowns, damage, utility, healing, shielding, mobility and system rules. Stable-ID mid-scope and rare major reworks preserve history. The 26.19 baseline now embeds the complete pinned Data Dragon 16.19.1 Summoner's Rift purchasable catalog (254 item records) and all 62 selectable runes across five styles, with Riot IDs, Korean text, prices/stats, recipes and rune style/slot structure. Matches choose these automatically: the engine selects a starter, traverses component recipes into legal final/boot builds, and constructs a legal six-rune page (four primary + two secondary from a different style). There is no player-facing item/rune micromanagement requirement; item/rune patches exist to alter champion power, match outcomes, draft priority and the observed meta. Patches can buff/nerf prices/effects, add or deactivate/remove items/runes, while long-save guards prevent class build pools or rune slots from collapsing. New champions target 2–3 releases per year with the Item 9 professional delay. Full patch history reconstructs historical champion/item/rune specs. `scripts/validate-system-snapshot.mjs`, smoke tests, standalone synchronization and latest-head production CI gate completion.

Pre-Item-11 stabilization (2026-09-27): before adding the full draft UI, the runtime/build architecture was refactored without changing accepted Items 1–10. Patch-history caching is world-owned through WeakMap state rather than a shared global object; champion/system evaluation, automatic item/rune fit, same-day draft champion pools and meta-history queries are revision/index cached with explicit invalidation. Draft noise now lazily admits champions that become professionally eligible inside the same patch instead of retaining an incomplete cached champion set. Series simulation no longer JSON deep-clones draft context every game. Derived 26.19 patch baselines are no longer serialized; historical patches rebuild from pinned source plus deltas. Meta-history save records use a reversible compact representation with smoke-tested material size reduction, and save-only season compaction now operates on a serialization view rather than deleting fields from live runtime state. A discovered save bug was fixed by aligning UI SAVE_VERSION/storage namespace 14 with buildWorld schema 14, and CI rejects future schema drift. Patch/meta, roster/market, and season/world/progression UI were extracted from app.js into domain modules; app.js fell from about 82.8 KB to 65.0 KB. Build/check/smoke share one artifact module manifest, CI rejects duplicate cross-module globals, maintainability budgets cover the major engine/UI modules, and CI records a deterministic performance probe for Bo3 simulation, draft-pool cache hits, item/rune selection and 10k-row meta queries. See docs/ARCHITECTURE.md.

## 11.5 Architecture Rebuild

### Step 1 — Freeze / regression baseline

**COMPLETE when the introducing CI run is green.**

- Added `scripts/regression.mjs` as a dedicated executable baseline for confirmed Items 1–11 behavior.
- Wired the regression gate into `npm run check` before the full smoke suite.
- Frozen critical save/load, Bo3/Bo5, Fearless, First Selection, contract, integrated-roster, local-rule, staff-cap, rookie, patch and item/rune invariants.
- Added `docs/REGRESSION_BASELINE.md` to distinguish confirmed invariants from known audit findings that must not be accidentally blessed as legacy behavior.
- Step 2 must not begin until this gate is green.

## UX / Convenience Re-audit (2026-09-27)

Items 1–5 remain engine-complete, but COMPLETE no longer means their current interaction design is frozen. A cross-system convenience audit found follow-up UX debt that must be repaired when the affected surface is touched, and before final integration acceptance:

- squad management currently commits starter, roster-role and training changes immediately; management surfaces should prefer draft/edit → preview → save/apply when several related choices are normally made together
- owned-reserve call-up/send-down must be edited as a batch and validated against the final organization roster, rather than rejecting a legal swap because its first intermediate click is temporarily illegal
- initial roster construction and scouting/market actions rerender after many single actions; preserve context/scroll and add batch actions where repeated observation or shortlist management is expected
- dense roster/scouting tables need stronger mobile-first summaries, filters and compact actions instead of relying on horizontal-table scanning
- destructive/financial actions should continue to show consequences before commitment; multi-term negotiations already use an explicit offer form and should keep that pattern
- validation messages must explain the violated rule and, where practical, the required correction instead of only disabling progression

This is a standing acceptance rule for the entire numbered roadmap through Item 23 and its D-depth follow-ups: functional correctness, persistence and CI are necessary but not sufficient; ordinary management workflows must also be low-friction on smartphone portrait.

Item 6 acceptance (2026-09-27): Tier-2 ownership, reserve requirements and promotion eligibility are explicit engine rules. Franchise systems maintain required owned reserves; mixed systems combine certified clubs' owned reserves with independent Tier-2 clubs; open/relegation systems preserve independent promotion paths. Owned reserves use stable parent IDs, are never manager-selectable as independent clubs, and are never promotion-eligible. Independent Tier-2 clubs can promote through the same promotion/relegation engine, with repeated-cycle smoke coverage verifying that owned reserves cannot leak into the first division and required reserves are reconciled after structural changes. First/reserve player movement is staged as a final-state roster plan: the UI previews projected squad counts, validation reports exact failures, invalid plans have no side effects, and valid plans apply atomically. AI reserve management uses the same validator/apply path, evaluates visible current ability/performance rather than hidden potential, and has a review cooldown. Reserve closure routes players cleanly to free agency while preserving contract terms. Five-year lifecycle checks cover roster integrity, required reserve count, promotion boundaries and reserve recreation. Standalone HTML is synchronized and latest-head CI passes.

Region-first realism rule (2026-09-27): named leagues are researched and modeled independently. LCK is not a fallback template for LPL, LEC, LCS, LCP, CBLOL, or future named regions. Unknown rules fall back to a neutral global profile, not a Korean one.

Policy-engine baseline (2026-09-27): unspecified regional rules no longer fall back to a static global profile. The engine infers missing roster/market/import/spending-policy dimensions from that region's own economy, talent depth, team structure, and Tier-2 organization, while explicit regional rules remain initial conditions.

Engine-owned policy rule (2026-09-27): named regions no longer hardcode derived policy outputs. Region ids provide no special policy branch; the shared engine derives pay scale, roster profile, market behavior, import openness, spending controls and office posture from observable regional state.

Cross-system realism baseline (2026-09-27): before major item 4, existing adjacent systems received a realism calibration pass. The baseline keeps fictional league identities while using current LoL-esports operating principles: roughly biweekly game patches with occasional longer gaps, rare champion releases and rare systemic changes, persistent starting fives, low roster churn, mostly short player contracts, region-specific rather than universal spending rules, LCK-style top-five soft spending regulation instead of a hard team-payroll cap, slower league-governance reform, and rookie intake based on first-division ecosystem size rather than counting reserve clubs as separate talent markets.

Item 1 verified first-season flow:

`World Creation → Team Selection → Global FA Roster Construction → Registration Deadline → Season Start`

Item 1 acceptance included blank rosters for every active club, full global FA initialization, eligible independent-club selection, owned-reserve restrictions, the 5+6 integrated-roster boundary, AI world roster construction, season bootstrap, standalone HTML execution, and successful CI.

No-emergency-roster rule (2026-09-27): the engine must maintain enough visible player supply before each market opens. Clubs may face a shortage of good or affordable players, but the simulation may not create a player on demand just because a roster slot is empty.\n\nProspect-market liquidity rule (2026-09-27): annual rookie intake is intentionally larger than bare roster replacement. The engine carries a dynamic FA/prospect buffer using active-team count, Tier-2 scale, expiring contracts and veteran retirement risk so clubs retain meaningful market choice.\n\nCohort-quality rule (2026-09-27): rookie quantity and quality are independent. Each season has a shared world cohort signal plus regional and role-specific variation, producing natural 흉작/평년/풍년/황금세대 cycles without fixed elite quotas.

Item 4 acceptance included engine-derived annual rookie supply from regional ecosystem state and total pro labor demand, role-gap-sensitive intake with an explicit FA supply buffer, ordinary-to-rare-elite quality distribution with probabilistic class-quality waves instead of a hard elite quota, 17–19-year-old generated entrants with nationality/champion pool/personality/development metadata, Tier-2/Academy-oriented entry paths, player-specific scouting reports, low-sample/youth/foreign/Tier-2 uncertainty, observation-driven narrowing, permanently uncertain potential ranges, official-match sample integration, growth-trend and champion-pool reporting, stale-report decay, region/role/competition/contract/undervalued-prospect search filters, save schema v13, standalone HTML sync, and successful CI.

Item 5 acceptance included market-derived salary and transfer valuation, realistic 1–4 year contract lengths, signing/performance/title/international bonuses, buyouts, team/player options and promised roles, persistent multi-round player negotiations with counteroffers and patience, club-to-club transfer-fee negotiation, A/B/C recruitment priorities, the required interest → observation → internal evaluation → formal offer → negotiation workflow, hidden rival terms and live competition risk, player choice based on pay/role/team strength/international opportunity/facilities/career fit, manual renewals instead of automatic retention, AI renewals/FA signings/releases/contracted transfers with fallback market rounds, no hidden-potential market cheating, first-season blank-roster contracts using the same formal negotiation model, unresolved-deal expiry at the market deadline, save persistence for recruitment/negotiation state, standalone HTML sync, and successful CI.

Item 2 acceptance included stable player identity and nationality, position-weighted ratings, detailed core metrics, bounded form/condition/fatigue/morale/sharpness/team/tactical adaptation, reputation and market value, champion official/scrim/training experience and mastery adaptation, individualized growth/peak/decline/retirement lifecycle, full match-derived player metrics, career snapshots/events, save round-trip validation, standalone HTML execution, and successful CI. The former secondary-position permission model was later superseded by the free lineup-role model.

Item 3 acceptance included five explicit roster roles (핵심 주전/주전/경쟁/후보/유망주), a persistent five-player Depth Chart per squad, explicit manager starter changes, strong AI starter inertia, expected versus actual playing-time tracking, persistent satisfaction and career goals, conservative LoL-style dissatisfaction thresholds, dissatisfaction sources for playing time/reserve assignment/contract/team results/role/international opportunity/career goals, controlled morale impact, rare long-running transfer requests and withdrawals, AI offseason role rebalancing, contract/transfer decision integration, standalone mobile UI verification, and successful CI.

Use `docs/CORE_DOMAIN_MODEL.md` as an architectural guardrail; older roadmap documents are supporting references rather than the active implementation order.

## Phase 0 migration record

The completed Artifact migration preserved these requirements:

- preserve visual/behavioral parity before large refactors
- establish a real app entry point and routing
- make install/dev/build commands work
- keep mock data explicit and replaceable
- introduce stable IDs where needed
- establish application-state and domain boundaries without overengineering
- keep simulation logic out of React/UI components
- verify smartphone portrait behavior
- leave the repository understandable to the next AI

Do not use Phase 0 as an excuse to implement the entire master specification.

## Phase 0 exit criteria

Phase 0 can end when all of the following are true:

- the approved Artifact's core UI/UX is present in the repository
- the app installs and runs from the repository
- a production build succeeds
- core navigation/routes work
- key mobile layouts remain intact
- obvious runtime/import/asset errors are resolved
- mock data is identifiable and replaceable
- stable entity IDs are not replaced by display-name references
- future domain/engine code can be added without being embedded in screen components

These criteria were accepted on 2026-09-26. See `docs/PHASE_0_REVIEW.md`.

Phase 1 is active.

## Planned boundaries

```text
src/
├─ app/          # routes, app shell, providers, navigation
├─ artifact/     # optional temporary landing zone during migration only
├─ components/   # reusable presentation extracted from Artifact
├─ features/     # screen/feature modules
├─ stores/       # application/game state
├─ types/        # shared domain contracts
├─ engine/       # UI-independent game/simulation logic
├─ data/         # mock/initial/config data
└─ utils/
```

Directories do not need to exist until code requires them.

## Core separation

```text
Artifact / UI / Features
          ↓
Application State / Services
          ↓
Domain + Simulation Engine
          ↓
World Data / Rules / Config
```

UI must never become the source of truth for simulation rules.

Examples:

- match screens display simulation outcomes; they do not decide winners
- draft screens issue actions; draft/domain logic validates legality
- standings screens display tables; league logic calculates them
- player screens display growth; development systems calculate it

## Phase 0 mock rule

Artifact mock data is allowed and expected.

However:

- identify mock data clearly
- keep it replaceable
- avoid spreading duplicate mock objects across unrelated components
- use stable IDs
- do not treat prototype schemas as final domain schemas automatically
- do not fake completed simulation systems

## What happens after Artifact import

The first integration pass prioritizes **visual and behavioral parity**.

After parity and build stability:

1. analyze the migrated codebase
2. remove only migration-specific duplication/technical debt that blocks progress
3. adopt stable common models
4. introduce real game state
5. build the first playable season loop in small vertical slices

Do not perform a large rewrite merely to match a preferred architecture.

See:

- `docs/POST_ARTIFACT_ROADMAP.md`
- `docs/CORE_DOMAIN_MODEL.md`

## Future compatibility

The architecture must leave room for:

- real calendar progression
- roster registration
- draft engine
- match engine
- statistics
- league rules
- contracts/transfers
- scouting/development
- reserves
- finance/facilities
- worldwide AI simulation
- patches/meta
- international tournaments
- persistent saves

These systems are not Phase 0 implementation requirements.

## Shared AI development workflow

LOL GM is currently developed primarily by **ChatGPT in this GitHub codebase**.

The repository and canonical docs are the project state. Future external AI assistance, if used, must treat the repository as the handoff surface.

For every substantial task:

1. sync understanding from the latest repository state
2. inspect existing implementation before writing a replacement
3. follow the current phase and canonical specification
4. integrate with existing repository work
5. leave code and documentation understandable to the next assistant
6. prefer one shared implementation over parallel alternatives
7. verify the change instead of reporting completion from code edits alone

The user is the game/product director and tester, not the manual integration layer. The user should not need to edit UI/UX, code, CSS, Git files or build configuration when an AI can perform the work.

The intended loop is:

`User direction → AI implementation → GitHub → runnable build → user playtest → feedback → next iteration`

See `docs/LOL_GM_SPEC.md#43-chatgpt--claude-collaborative-development-workflow` for the full collaboration contract.


### International ecosystem design checkpoint — 2026-09-27

The canonical first-division international competition contract is now frozen in `INTL_PRESETS` and D-032: First Stand (12), MSI (16), Eastern/Western Cup (8 each), Worlds (24), Worlds Masters (16), and Worlds Open (12). Official full names are used as internal IDs; display abbreviations are separate.

Worlds uses a 24-team, three-pot league phase with six BO3 matches per team (two opponents from every pot, including the team's own pot), followed by a one-time seeded Round-of-16 draw and a fixed BO5 knockout bracket. Masters uses 2+coefficient slots with a maximum of three teams per league; Open initially uses two teams per core league.

Domestic league format is office-owned and may be one long season or multiple splits. International qualification cannot be a direct regular-table cutoff: standings may seed or qualify teams into a competitive qualifier/playoff, but the berth is decided by matches. All first-division domestic official play pauses during an international phase.

This checkpoint records the contract only. Major item 6 remains ACTIVE. Exact executable international scheduling, coefficient arithmetic, patch lock and international roster rules belong to major item 19 and must implement this contract without legacy-format approximation.

Top-division structural invariant: every first division has at least 10 teams and an even team count. The office should normally prefer 10–16 teams, but 18, 20 and larger even leagues are legal when world evolution justifies them; 16 is not a hard cap.


### Champion authoritative-data pipeline — 2026-09-27
Patch-pinned Riot Data Dragon import tooling now exists at `scripts/sync-champions.mjs`; source policy is documented in `docs/CHAMPION_DATA.md`. Runtime fallbacks remain explicitly non-authoritative until a reviewed snapshot is normalized and accepted.

- Champion source normalization/merge layer now accepts a patch-pinned Data Dragon snapshot, preserves LOL GM stable champion IDs, replaces authoritative base/detail fields, records source coverage/version, and leaves unmatched champions on explicit fallback data.


## Champion/meta stage checkpoint (2026-09-27)

- Riot Data Dragon 16.19.1 / LoL 26.19 baseline is embedded for all 173 champions, including Korean passive and Q/W/E/R names/descriptions plus exposed base/spell source fields.
- Official champion meta history retains season/year/stage/league/international context plus team, player and actual picked position; history is no longer destructively capped at 5,000 games.
- Meta filtering supports region, patch, competition, period, year, domestic/international scope and actual picked position.
- Team meta learning and counter-research are persistent, and new champions remain practice-usable during the global pro-ban window while tournament pools stay locked.
- Rare major-patch champion reworks preserve stable champion IDs.


### Item 11 live-draft acceptance — 2026-09-28

Item 11 is COMPLETE. Every managed-team official Bo3/Bo5 game pauses world progression at the decision boundary and runs through the interactive LoL-style draft surface. Fixed Fearless accumulates all ten picks from each completed game; flex roles remain unresolved and hidden until a legal final five-role assignment; game-one First Selection is home-team in domestic double round-robin, explicit seed only where domestic playoff configuration says so, and coin toss for international knockout/bracket matches. Games two onward always give First Selection to the previous-game loser, and the managed team explicitly chooses either the first dimension or the remaining side/order dimension.

Draft information is bounded by what the club can legitimately know. Candidate analysis shows own-player champion pools, current composition needs, public matchup possibilities and meta evidence with source/confidence provenance. Opponent champion-pool estimates are scouting-bounded ranges rather than true hidden mastery. Strategic-coach/analyst advice remains advisory and never auto-locks a choice. Opponent-intent explanations use public draft state, series history and available scouting/analysis only; AI internal intent roles and unrevealed flex assignments are not surfaced.

Player and AI choices pass through the same draft validator. Smoke acceptance drives managed-side choices and AI-side choices through the same staged state machine, checks identical rejection reasons for illegal duplicate/wrong-side choices, and completes both official Bo3 and Bo5 pending-series paths. The Bo5 acceptance includes First Selection handoff after every game, accumulated Fearless uniqueness, a mid-series save round-trip, single result commit and world-progression resume. Mobile portrait draft UX uses compact information tabs, two-column team boards, three-column champion browsing on normal phone widths, horizontal role filters, 44px decision controls and safe-area-aware sticky lock controls. Syntax/structure, smoke, performance, production build, generated standalone synchronization and latest-head CI gate acceptance.

### Managed-club authority rule — 2026-09-28

The player is the head coach and retains final authority over consequential sporting decisions for the managed club. Player recruitment, contracted transfers, releases, renewals, team-option exercise, first/reserve movement, starting lineup, roster roles, tactics, training direction, scrim choices, senior-assistant appointment and specialist-staff appointment are never auto-committed by club AI. Staff may recommend, rank, prefill, batch or warn. Player-option decisions belong to the player/agent and regulatory/deadline consequences such as an unrenewed expired contract becoming free agency may resolve automatically. AI clubs remain fully automated. Board-owned infrastructure capex remains outside the head coach's sporting remit unless that ownership model is changed explicitly later.


### Cross-region rule completion gate — 2026-09-28

No regulation feature is accepted as complete when implemented for one named league only. Every new office-owned rule must be represented as a shared engine capability with region-owned policy/config state. Named leagues may start with different verified initial values; unknown values remain local to that region's policy engine rather than inheriting another league's settings. Acceptance requires cross-region regression coverage and human/AI rule-parity checks. International competition rules remain owned by the international office.


### Local eligibility / transfer / roster-registration checkpoint — 2026-09-28

The current design contract is frozen in `docs/ROSTER_TRANSFER_LOCAL_RULES.md` and D-047–D-049. Player origin/nationality must be separated from active local registration eligibility. The first-team official roster is 5–10 players, must cover all five positions, and may contain at most two non-local players. The cap applies to official first-team registration rather than total contracted or reserve holdings. Contracted moves are limited to two per player per season; a loan departure counts once and the return does not. Free-agent signings are not transfers and may occur year-round subject to official registration eligibility.

Domestic official-roster changes use windows rather than a change-count quota: while a regional registration window is open, clubs may revise the official list without a separate count limit; outside it, ordinary official-list changes are locked. First-team↔reserve/Academy squad assignment is a separate state with its own broader regional movement windows and no count quota while open. Internal movement may happen while official registration is closed, but it changes training/squad placement rather than official match eligibility. Emergency rules may still define whether a temporary roster overage beyond ten is allowed. International tournaments lock the initially submitted final roster except for pre-published emergency replacement rules.

Fearless and First Selection are fixed core match-system concepts, not regional-office or international-office toggles. The earlier cross-region rule checkpoint is therefore interpreted only for genuinely office-owned regulation categories.


### Free lineup-role model checkpoint — 2026-09-28

The former registered-primary-role enforcement model was superseded. A player's primary role is now specialization/identity rather than match eligibility. Official lineups require five distinct registered players assigned to TOP/JGL/MID/ADC/SUP, with no natural-role coverage requirement. General secondary-role fields were removed from generated players and save serialization. `lineup.js` owns lineup validation/assignment, and `ui-roster.js` exposes game-slot assignment separately from the player's primary role.

Long-term role conversion is now implemented as a separate career/training decision. The manager proposes a target role and the player may accept or reject it. Accepted plans accumulate daily training progress and accelerate when the player actually plays the target role in official matches or scrims; target-role champion preparation and role-key development also advance. Conversion training consumes part of ordinary development capacity, redirects/cancellation preserve sunk costs through trust/relationship effects, repeated conversions become less efficient, and completion changes only the player's primary-role identity. One-off off-role usage remains legal without conversion.

### Role-conversion implementation — 2026-09-28

`role-conversion.js` now owns proposal acceptance/refusal, conversion progress, role-use acceleration, target-role champion preparation, development opportunity cost, cancellation/redirect handling, AI use of the same API and primary-role history. `competition.js` records the actual game-role slot on player lines, while `features.js` feeds official/scrim evidence into the conversion engine. `ui-roster.js` exposes proposal, progress and cancellation controls without turning conversion into a match-eligibility requirement.

### Contract / retention / staff rule checkpoint — 2026-09-28

Position conversion is a long-term specialization change rather than an eligibility unlock. It may be proposed at any time, the player may accept or refuse, and its cost comes from training opportunity, champion/role preparation, adaptation and relationship effects. Repeated changes remain possible but inefficient.

Loans are half-season or full-season deals. Recall requires a clause; fees may be zero; wage share is negotiable; purchase options and obligations are supported. Mutual termination is offseason-only and unilateral release honors the contract's guaranteed amount. Player dissatisfaction now targets relationship quality and renewal intent first; transfer wishes are rare severe-breakdown events. After the final international event, expiring players have a 14-day incumbent-only renewal period before outside contact opens.

Match eligibility is the official registered roster, with no second matchday mini-roster. Between-game substitutions are legal, in-game player substitutions are not, and fewer than five eligible players forfeits absent a valid emergency exception. Injuries are rare relative to condition/fatigue/illness.

The staff target is now departmental: no generic senior assistant, up to 9 coaches, 4 analysts and 6 scouts employed by a club. Competition staff accreditation limits remain office-owned. Legacy `team.coach` must be migrated rather than abruptly deleted because development, drafting and finance still depend on it.

## Focused development map

Start from latest main and the relevant unfinished row in DEVELOPMENT.md / the
depth audit. Do not reread every source or repeat accepted gameplay work.
`scripts/artifact-modules.mjs` is the executable source-order manifest;
ARCHITECTURE.md records ownership. Canonical code is in `src/artifact/`.

### Entry points and first checks

These are initial local reproductions, not a proof that other domains are
unaffected. Cross-domain changes need their union; unknown/shared engine changes
require full Actions validation. Ready code PRs keep the complete CI gate.

| Change | Read first | First focused command |
| --- | --- | --- |
| World/bootstrap seed | world.js `buildWorld`, player.js, career.js | `node scripts/bootstrap-seed-acceptance.mjs` |
| Navigation/async UI | ui-state.js, ui-overlay.js, app.js | relevant `ui-state`, `ui-overlay`, `ui-async` or `ui-mobile-a11y` acceptance in scripts/ |
| Save slots/storage | app.js `loadDB` / `switchSaveSlot`, ui-data.js | `node scripts/ui-async-acceptance.mjs` |
| Save encoding/migration | save.js `packDB` / `unpackDB`, save-migration.js | Actions regression + career; preserve legacy resume |
| Finance/contracts/market | finance.js, contracts.js, contract-*.js, transfer.js | `node scripts/ui-finance-contracts-runner.mjs` |
| Player transactions | state-transaction.js, state-player-actions.js, state-rollback.js, roster.js | Actions regression + contract domain + career |
| Calendar/scouting/scrim | calendar.js, season.js `advanceStep`, timezone-calendar.js, scouting*.js, scrim-partner.js | `node scripts/calendar-scouting-runner.mjs` |
| Medical/development | medical.js, development.js, calendar.js, season.js | Actions medical core/regional/calendar; reproduce only failing seed locally |
| Match/draft/series/patch | engine.js, draft.js, series.js, meta.js, patch*.js | Actions regression + both smoke shards + career |
| Build/module manifest/shared RNG | scripts/build.mjs, artifact-modules.mjs, random.js | `node scripts/check.mjs`, then full Actions |
| CI report/publisher | scripts/ci-run.mjs, sync-standalone.mjs | corresponding `node --test scripts/<name>.test.mjs` |
| Documentation only | relevant doc and referenced code | links/diff review; CI static gate |

For one known invariant, run its individual acceptance instead of the whole
domain runner. `npm run check` remains the complete serial local fallback, not
the routine edit loop. Use CI_RESULTS.md for small JSON summaries and failed
logs. Actions owns repeated heavy simulations and production builds.

### Narrow discovery

Find paths with `rg --files src/artifact scripts docs`; then search only the
owning modules and relevant acceptance. For example:

```sh
rg -n 'applyWorldAction|validateWorldAction' src/artifact/state-*.js
rg -n 'switchSaveSlot|loadDB|saveDB' src/artifact/app.js scripts/ui-async-acceptance.mjs
```

When the shell does not expand globs, pass an explicit directory and `-g` filter:
`rg -n 'applyWorldAction' src/artifact -g 'state-*.js'`.
Avoid searching generated `index.html`, `dist/`, and the large champion/system
snapshots unless the change concerns generated output or pinned source data.
Do not infer dead code from name counts: HTML handlers and global concatenation
are real callers. The complete manifest ownership/change map is in
[REFACTOR_R01_AUDIT.md](REFACTOR_R01_AUDIT.md#r08-complete-manifest--dependency-and-change-map).

### Current sequence

Issues #57 and #62 are complete. R01 has a code-backed ownership baseline in
REFACTOR_R01_AUDIT.md. R02 mutation ownership guards are in place; R03 has moved
expense/transfer settlements into finance and player negotiation into
contract-negotiation.js. R04 now centralizes raw calendar positioning and in-season daily effects;
R05 AI market callups now use the shared action gateway with exact baseline parity;
release cost and finance accrual/payroll now have single owners.
R06/R07 remove six unused wrappers and required-UI fallbacks while retaining supported
save compatibility. R08 documents all 73 modules and adds exact R01/current
full-smoke and two-season/save checkpoint parity in the opt-in Actions gate.
Final-head full CI, explicit parity and post-merge main CI passed (PR #85).
Preserve accepted D04-B3. Accepted D04-B4a (PR #86) records pending and
settled player release liabilities, preserves aggregate balances in older saves
and exposes the contractual basis in touch-friendly disclosure cards. It keeps
the existing 50% compensation rule. B4b adds negotiated 50/75/100% release
protection with legacy 50% defaults, shared AI/player terms, deferred agreement
activation, save/restore and the same transactional finance settlement.
B4c adds offseason mutual termination through the shared release transaction,
player consent/compensation demands, manager UI and AI cleanup, with preserved
medical/future-contract boundaries, rollback, saves and single annual settlement.
B4d1 adds atomic office-directed closure, cash-limited player claim payments,
preserved unpaid balances and cancellation of closed-club commitments. Remaining
B4 work includes funding/recovery and player consent/agents/promises; D04 is not complete.
Continue the complete numbered roadmap and D follow-ups. Follow ANDROID_TARGET.md
through playable desktop/mobile HTML acceptance before Android production
packaging and real-device offline/save validation.
Manual full/parity support is a follow-up convenience, not a new optimization phase.

### Optimization ownership during development

User decision, 2026-10-01: the development-efficiency optimization phase and
planned ownership refactor are complete. Continue unfinished roadmap features;
do not restart a separate general optimization phase before implementing them.

Remaining engine performance work belongs to the feature being developed.
When implementing or changing season progression, AI clubs, player growth,
match simulation, contracts/market, patch/meta, schedules, statistics or saves,
measure the affected path and fix demonstrated bottlenecks in that work unit.
Avoid speculative caches or rewrites without evidence. Behavior-preserving
optimizations must retain deterministic results, RNG consumption and save
compatibility; intentional gameplay changes use their own acceptance tests.

During mobile HTML UX development, include rendering, CPU/RAM, battery/heat,
idle/background behavior, batching, cache invalidation, save size/load time and
long-career memory retention in the relevant feature work. During Android
packaging, validate lifecycle, forced termination/recovery and those resource
constraints in release mode on an actual device. This is remaining development
and platform acceptance work, not evidence that all game performance is done.

Use focused local measurements and related checks; delegate repeatable full
regression, long simulations and builds to Actions. Record the measured issue,
change, validation and remaining limitations in existing phase/work records.
Complete desktop/mobile standalone HTML acceptance before APK delivery; the
complete Items 1–23 and D follow-up scope remains unchanged. See
[ANDROID_TARGET.md](ANDROID_TARGET.md#performance-work-during-mobile-development).

### Measured engine optimization — rune selection

The existing CI probe measured item/rune selection at about 0.895ms per pair
(run 36836633358), so optimize repeated selector work rather than adding caches
without evidence. Secondary rune selection now reuses the primary ranking's
per-slot winners. It preserves scores, stable ties, rune IDs/order and RNG;
it adds no persistent cache or save fields. The focused acceptance compares the
frozen pre-change selector across every champion/role, player/null context,
save restoration, disabled/incomplete styles, ties and caller mutation.

Local focused evidence: 1,783 exact cases, 98→62 score calls per representative
selection (36.7% less score work); median 200-call sample 61.91→39.13ms (1.58x).
This is selector-level evidence, not a claim that the whole game or CI is 1.58x
faster. Full Actions performance plus exact pre-change smoke/two-season/save
parity are required before accepting the optimization. D04-B4 remains unfinished;
resume its next independent gameplay unit after this bounded optimization.

Tournament naming correction (2026-10-01): display names are Worlds Masters
(월즈 마스터즈) and Worlds Open (월즈 오픈). Keep existing MASTERS/OPEN IDs
for saved schedules and results. Restore old default display names on load;
preserve user-customized names and formats.

World setup decision (2026-10-01): remove the world-change frequency selector
entirely, including advanced settings. New worlds and restored saves use normal
frequency; calendar/offseason evolution always uses the normal multiplier (1).
The manager/AI delegation control remains a separate setting.

Default-world selection update (2026-10-01): Korea/China create owned Tier-2
reserves. The user's revised rule now permits coaching these squads with parent-
controlled recruitment, resolving the prior default Tier-2 selection gap without
inventing independent clubs or changing ownership/promotion rules. Independent
Tier-2 clubs remain selectable in custom worlds; there are currently no such
clubs in the default starting world. Other default core regions lack Tier-2
leagues. Further league composition remains separate design work.


## Realism reference and fictional league priority (2026-10-01)

The user specifies actual LoL esports as the realism reference, while explicitly
preserving this game's fictional league. User-approved fictional formats, world
evolution, competitions and rules take priority. Difference from real leagues
alone is not a defect and does not authorize converting the game to a replica.
Improve internally implausible consequences using real esports as a reference;
verify dated regional official rules before claiming they are actual rules.
Private contract terms and simulation policies must remain clearly distinguished.

The [2026 LCK update](https://lolesports.com/ko-KR/lolesports/news/2026-lck-rulebook-update-notice)
permits some end dates outside the global date, with multi-year constraints.
The current Worlds+14 model remains the fictional game's policy; this source
must not trigger an automatic migration to real-world calendar dates. Revisit
only where the fictional design needs a more coherent rule.

Current batch: D04-B4f2/B4g1 — oral role promises, persistent player agents,
and compact confirmation/status UI. B4f1 passed CI 36870500337 and merged as PR #99.
Main files: player-representation, negotiation, relation/contract lifecycle,
player-commitments UI, roster bindings and representation acceptance. Shared
player consent, atomic journal and usage evidence remain authoritative.
Remaining D04: broader representative/agency lifecycle, promise renegotiation,
insolvency assets/other claims and transfer payment terms; D05 and Items 13–23 follow.

Local D04-B4d1 evidence: static check (74 modules) and the focused UI/finance/contract runner passed (17 acceptances, 13 isolated engine contexts, one engine compile). Full CI acceptance is required before merge.


D04-B4d2 extends existing parent-to-reserve support to closure liabilities using
actual spare cash after protecting parent claims. Parent finance is included in
preview invalidation and rollback; both transfer sides persist and the active
parent UI exposes recent support. No second annual charge or arbitrary equity.
Remaining insolvency scope includes residual cash/asset recovery and other claims.


## Owned reserve coach career (2026-10-01 user rule change)

The user supersedes the prior owned-Academy selection ban: active owned reserves
are selectable coaching jobs, including default KR/CN second divisions. These
remain parent-owned and promotion-ineligible. Their coach controls their own
lineup, tactics, training, recovery and player development. The parent AI owns
player recruitment, contracts, releases and first/reserve movement; the coach
cannot change the parent's squad or bypass recruitment restrictions through commands.

At a first-year academy start, the real initial world market builds all squads.
The coach sees the provided roster and confirms season start instead of recruiting.
Independent-club setup stays manual. Economic AI exclusion uses
managedRecruitmentTeamId rather than the match-coaching team id. Saves continue
using the managed reserve team id so official matches still pause for its draft.

Current implementation files: world/career, transaction and negotiation authority,
contract AI exclusions, medical/role-conversion scope and setup/roster/market UI.
owned-reserve-coach-acceptance covers the real picker, actual initial start button,
provided legal rosters, forbidden economic commands/negotiations, own squad apply,
parent isolation, recovery, official-match pause, real AI contract market and saves.
Full regression and build are Actions-owned. The former independent-only smoke
expectation is replaced with coverage of active independent and parent-owned teams.

Local academy-coach validation: static check and focused UI/finance/contracts runner passed (18 acceptances, 14 engine contexts). Full Actions required before acceptance.


D04-B4d3 unit: recover closing owned-reserve cash after protecting its own claims,
then protect parent claims before supporting other closing reserves. Support for
negative-cash reserves accounts for the liquidity deficit before player payouts.
No invented equity or duplicate annual income. Finance keeps bounded recovery
history; closed statements and UI distinguish returns from support. Focused
closure acceptance verifies cash/debt conservation, rollback, save/UI and annual
accounting. Remaining insolvency work includes independent assets and other claims;
next gameplay candidates include transfer consent and D05 loans.


D04-B4e1 unit: shared pure permanent-transfer consent now guards retained-contract
moves and new transfer contracts for all actors. Use existing negotiation utility
and acceptance/fair-pay policy; do not invent a second player preference formula.
Personal decision evidence is revalidated in canonical previews and saved with
transfer events. AI checks both purchases and proposed swaps before committing.
Focused transfer-consent, owned-reserve-coach and static checks pass; full Actions
is the acceptance gate. Next candidates: AI negotiating new personal terms,
agent/promises, remaining insolvency claims and D05 loans.

B4e1 CI integration: the first regression run rejected legacy transfer fixtures
whose hard-coded pay no longer guaranteed player agreement. Transaction fee,
retained-contract and rollback fixtures now use agreed salary relative to the
actual player asking price; all original financial, stale, move-limit and rollback
assertions remain. Local regression passed after this fixture correction. Full
final-head Actions remains the merge gate.


D04-B4e2 handoff: AI first tries affordable retained terms. If refused or outside
payroll room, it proposes the player's preferred duration, actual squad role and
guarantee preference using the existing expiry-market salary ladder (1/1.05/1.15
of ask). Every proposal uses the shared fair-pay/utility consent and transaction
writer. No fee or contract is written on refusal. Salary room uses actual payroll
and the club's cash after the proposed fee; a possible swap supplies no wage credit.
A dedicated contract-transfer-market module keeps existing domain size limits.
Focused coverage includes pure proposals/budget view, retained preference,
no-budget refusal, production AI new contracts and save restore. Static and
focused transfer/owned-coach checks pass; Actions is the final acceptance gate.
Next independent work: agent/promises and remaining insolvency before D05 loans.


D04-B4f1 handoff: contract promisedRole is independent of the club's current
rosterRole. A downgrade is a visible promise issue; insufficient real official
playing time is judged against the signed role using the existing thresholds and
severity scales. Satisfaction/trust and the existing renewal policy consume the
same issue. The baseline starts at actual signing/retained transfer, not earlier
club usage. Internal first/reserve movement does not create a new agreement.
Unavailable medical games with no appearance are excluded from opportunities;
actual appearances still count. Baselines and absence counters are optional
legacy-compatible fields, pure queries do not invent historic dates. Player UI
separates current role from contract role and shows contract-relative usage.
Focused checks pass for official usage, fulfilled/broken promises, role edits,
medical absences, renewal disposition, resets, pure status and save/legacy data.
The shared runner now has 20 acceptances / 16 isolated engine contexts.
This is contractual role enforcement only: oral promises, agents and complete
promise lifecycle/history remain independent unfinished work. No D04 completion.

B4f1 first CI core smoke found a bench fixture copied a starter contract while
changing only rosterRole to backup. It now explicitly agrees a backup contract;
the no-playing-time-complaint assertion remains. The new focused acceptance
separately covers the opposite case: a backup label cannot erase a starter promise.
Local smoke passed after the fixture correction; final-head Actions is required.


## Development batching (2026-10-01 user direction)
The user requests larger connected batches and detailed reports only on request.
Group related state/engine/UI/save work into one reviewable PR and one final-head
Actions validation. Keep focused local tests; do not run full CI for tiny dependent
substeps. Split unrelated or risky work when independence improves recovery.

D04-B4f2/B4g1 handoff: high-reputation players receive persistent identified
representatives; ordinary players negotiate directly. Independent representative
profiles reuse the existing personality generator distribution and a stable local
RNG stream, leaving world RNG untouched. Representative traits materially control
existing demand premiums/options/buyouts and round patience; final player utility
and consent remain the player's. Negotiations snapshot the representative.
Oral role promises are additional opportunities without rewriting contracts.
They use a new atomic player.promise command with own-squad coaching authority,
pure preview, stale usage checks, rollback and repeat-reset protection. The stricter
contract/oral role shares actual usage/medical evidence and trust/renewal effects.
New agreements/transfers/releases close oral commitments with career evidence;
internal squad moves retain them. AI creates commitments before earned starter
promotions; manager decisions use a compact preview/confirm/cancel surface.
Focused acceptance and the 21-acceptance / 17-context runner pass; static checks
cover 77 modules. Full final-head Actions is required. No D04 completion claim:
agencies with multiple clients, commissions/representative changes, lower-role
mutual renegotiation and broader insolvency remain distinct future work.


## D05-B1 loan gameplay batch (2026-10-01)

Implemented temporary registration as optional player.loan: player.team is the
playing squad, loan.ownerId retains original contract responsibility. Incoming
and outgoing manager proposals, AI window reviews, salary shares 0–100%, zero
fees, half/full-season periods, agreed recalls, automatic returns, roster return
reservations, career history, confirmation UI and packed saves share the existing
command/journal and daily calendar. No second persisted roster ledger. A derived
WeakMap index avoids player scans on every payroll lookup; starts/returns, load
and rollback invalidate it.

Configurable region.loanWindows defaults to Jan 7–31 / Jul 1–14. This is a
fictional game calendar policy, not a real league rule. Only the destination
window matters. Half-season returns July 1 for first-half starts; otherwise at
season end. Full season returns before incumbent-window payroll snapshots;
Dec 31 is the final-date safeguard. AI reviews once per regional window, uses
existing scouting observations, commits at most two deals across the review and
protects manually controlled club economics. AI lenders protect current starters
unless they want out and require half salary or a quarter annual salary as fee.
Manager outgoing proposals instead require AI borrower wage room and sporting
improvement. These are game policies, not universal esports laws.

Budget payroll uses current shares. Annual salary remains with the owner, with
matching day-prorated borrower expense/owner credit recorded by player; no daily
cash writer or double annual/prepaid fee charge. Annual regulated top-five
spending uses accrued shares; close clears settled rows. Borrower games use the
loan opportunity promise and do not satisfy/breach suspended owner contract/oral
promises. Aggregate career usage remains. Borrowers cannot release, renew,
transfer or redistribute players. Return does not consume another seasonal move.
Closure journals both counterparts: borrower closure returns the player; lender
closure terminates its own contract and preserves existing release liability,
including outbound players. Broader insolvency wage/asset claims remain pending.

Major owners: player-loans.js, player-loan-market.js, ui-player-loans.js, finance,
roster, calendar/season, save migration and club-closure composition. Focused
loan acceptance covers pure/stale/late-failure rollback, both manager directions,
production AI, destination windows, 0%/50%/100% wages, matching annual settlement
and no duplicate fee, registration/move caps, reserved places, half/full-season
orchestration, both closure sides, corrupt/legacy saves and real cancel/confirm
UI. Shared runner: 22 acceptances / 18 isolated contexts; static: 80 modules.
Focused checks pass. Final-head Actions remains the merge gate.

This is the first connected loan batch, not all D05. Next: purchase option and
obligation/conversion without another move; conditional/installment transfer
fees; deeper regional market/calendar integration. Continuous local service
accrual remains unimplemented: loans preserve existing qualification without
inventing residence progress. Strategic AI recall and broader insolvency remain
unfinished. HTML/mobile-first delivery and all roadmap Items 1–23 remain in scope.

## D05-B2 / local-service connected gameplay batch (2026-10-02)

The user requested D01–D13 as one continuing development objective with larger
connected batches. Keep independently validated merge boundaries inside that
objective; neither this batch nor the presence of modules proves all D complete.
Long-save/economy and actual mobile play evidence remain acceptance requirements.

Delivered: agreed loan purchase options/obligations, binding season-end conversion,
next-season contract start and annual wage conservation without an extra move;
weekly AI option purchase and shortage recall; guaranteed installments and actual
official appearance/international/title add-ons, mirrored buyer/seller journals,
partial-payment debt retention, cash commitment awareness and rollback. Player
deletion and club closure do not erase invoices. Broader insolvency priority and
asset recovery are still separate work. Default permanent windows reuse regional
loan dates in season; offseason permanent moves use the existing future-contract
and exclusive-renewal guards. Only the destination window applies.

Continuous local service now accrues actual registered days/seasons, pauses
without erasing FA progress, continues across same-region teams/loans, pauses
both regions during cross-region loans and resets on ordinary regional moves.
The service run snapshots its qualifying rules, preserving progress when policy
changes. Earned eligibility never auto-activates: willing players choose during
offseason, with next-season activation, expiry for unused choices and fresh
service after relinquishing an activated acquired local. The configurable default
four-season/two-year-choice rule is fictional game policy. No pre-save service is
invented. Region split/merge successor selection and explicit official roster vs
employment state still remain for D06; unused expired entitlement renewal needs
its own agreed rule before adding it.

Major owners: transfer-payments, transfer-market-rules, loan-purchase, local-service
and compact transfer/local UI modules; existing calendar, finance, negotiation,
roster and save gateways compose them. No timers/background polling introduced.
Focused transfer and local-service acceptances pass, including pure previews,
late failure rollback, production AI, wages, installments/debt, actual conditions,
policy grandfathering, deferred choice, saves and real UI cancel/confirm. Shared
runner: 24 acceptances / 20 isolated contexts; static: 86 modules. Full final-head
Actions remains the merge gate. Next connected target: outstanding D04 insolvency
and representation boundaries, then D06 official registration/employment separation
and regional restructuring, followed by remaining D07–D13 acceptance.

## D06-B1 official registration gameplay batch (2026-10-02)

New seasons explicitly enable registrationVersion 1. team.roster/player.team
remain employment/training assignment; team.registration holds the submitted
domestic list and official starting five. International seasons snapshot entries
before play. Existing in-season saves preserve legacy participation until their
next season, rather than fabricating a past submission or invalidating a live Bo.

Manager/AI submit final organization lists through one atomic roster.register
command. A first/reserve exchange validates the two final lists together, with
5-player minima, region-owned reserve cap/import policy, first-team 10/2 maxima,
contract/loan ownership and single-squad membership. Employment holdings can
exceed official maxima. Owned-reserve coaches control their squad's registration,
while parent club economic/internal-move authority remains unchanged.

Region-owned registrationWindows, internalMoveWindows and internalMoveWaitDays
are separate. The fictional default domestic submission periods reuse Jan 7–31
and Jul 1–14; internal moves default to unrestricted domestic days with zero wait.
International entries and internal moves lock at the first actual UTC fixture,
until tournament completion. Internal moves preserve existing official rights.
Outside-window FA employment does not grant official eligibility or local service.
Official lineups can change outside submission windows; an active set draft locks
its selection. Local-service days now use actual domestic registration.

Official matches and interactive drafts use derived official squad views, retaining
original player objects for real statistics. Employment rosters/depth are not
temporarily overwritten. Explicit medical replacement policy adds exceptional
entries and preserves the other squad's five-player floor; a late entry failure
rolls back the underlying signing/move, finances, service and tournament entries.
Shortage forfeits create no games/appearances. Double shortages are explicitly
flagged and retain scheduled bracket order for administrative advancement, a
fictional fallback requiring later long-run balance review.

Owners: registration.js (policy/commands/AI/save validation), registration-match.js
(derived official views, final entries, medical exception and shortages), compact
ui-registration.js and existing season/competition/series/medical/roster journals.
Focused registry/medical and two-season career checks pass; static: 89 modules.
Full final-head Actions remains the merge gate. D06 is not complete: license and
owner transitions, split/merge successor local choice/history and long-run reserve
regeneration/promotion evidence remain. D04 representation/insolvency and later
D07–D13 work also remain; the whole-D objective stays active.

## Player review corrections and whole-D continuation (2026-10-02)

PR #103 official-registration batch passed all CI and merged as
`7e02d46997af8f40d834cd47d4ec77d0fd515b49`. Continue D01–D13 as the active
objective; finish the requested UI corrections, then prioritize game mechanics.
Do not infer whole-D completion from this review batch or a passing short career.

New games start with manual contract/recruitment operation. The redundant world
generation/reset controls and setup delegation selector are removed; delegation
remains available in the later career market. The standalone repeated-simulation
screen and its route/bindings are removed. Public player estimates exist before
paid scouting, and observation narrows their uncertainty. World strength is a
relative display index whose highest region is 100; blank-roster regions use
their ecosystem strength, without rewriting the player/match balance scale.

New contract protection follows the signing region's common office rule
(default 50%). It is no longer a player preference or selectable contract term.
Existing signed contracts and binding future agreements retain their agreed
rights. Both manager and AI use the same command normalization. Closed/protected
clubs receive an achievable lower-table target rather than fictitious survival;
season-end evaluation uses that same target. The low-table founding roster
strategy retains its previous recruitment target despite the renamed goal.

Champion range audit: 173 source champions / 692 Q/W/E/R entries were compared
against patch-pinned 16.19 client files, with no download/mapping failures.
38 source entries contain a 25000 sentinel and 15 contain zero. Cast limits,
targeting indicators, effect areas and dash distances are distinct quantities;
a numeric disagreement is not automatically a balance bug. Full evidence is in
`src/data/champion-range-audit-16.19.1.json`; rerun with
`node scripts/audit-champion-ranges.mjs`. Rendering uses reviewed descriptions
for global/self/variable skills, including Aatrox's 300 dash and ultimate's 600
fear radius, without replacing a multi-hit attack with its indicator length.
The game currently includes 172 of those source champions (Locke is not in its
curated roster), plus future generated content. Fictional range patches invalidate
source labels rather than showing stale numbers. The audit is a data/semantics
review, not proof of frame-exact reproduction of every live LoL ability.

Champion tiers appear before the first match from current patch strength; actual
competition samples replace the preview basis. Empty historical filters do not
leak unrelated match samples. Dark-theme champion buttons, opposing tactic labels
and 10 isolated save slots are implemented; lengthy implementation annotations
and empty detailed insights are removed from player screens.

Validation: focused office-protection acceptance covers both actors, old rights,
settlement/rollback/save restoration; public-information acceptance checks setup,
goals, estimates, tiers and range changes. Existing contract/UI/registry and
calendar/scouting runners pass. A real Edge browser at 390px in dark mode passed
new game, public estimates, tier display, corrected Aatrox labels and loading
slot 10. This desktop mobile viewport is not real Android/TalkBack acceptance.
Full final-head Actions remains the merge gate. Next: remaining D04 insolvency/
representation, D06 ownership/license/regional history, then D07–D13. Keep the
existing whole-D automation; do not create duplicate recurring jobs.

## D12 contextual First Selection (2026-10-02)

Selection AI now compares current eligible patch picks, its own registered
players' champion mastery, bounded opponent scouting, replacement scarcity,
contested picks, counterpick exposure and remaining Fearless breadth. Manual
side/order choices remain authoritative. Assessment does not repair depth charts
or consume match RNG; the existing selection noise stream remains separate.
Official sessions assess official registration views, including AI-first prompts.
Pending choices and their explanations survive saves; completed games retain
compact decision evidence. Replays retain recorded side and pick order even
when current champion pools differ from the historical match.

Focused acceptance proves actual AI choices change across identical seeds when
mastery breadth changes, opponent estimates remain bounded, patch/Fearless
changes reach assessments, all four manual choices work, and Bo3/Bo5 pending
choices survive saves. Training-only players cannot affect official selection.
Static checks pass for 90 modules; full Actions is the merge gate. This delivers
the contextual selection component, not all D12 or whole-D acceptance. Next:
actual daily-clock long careers, remaining economic/ownership boundaries and
staff/training/match mechanics. The existing two-season shortcut fixture is
not evidence of a 100-season daily-clock career.

Player-reported training NaN: the slider summed the string intensity alongside
numeric group allocations. Allocation now sums only attribute groups and enforces
finite values and the 100-point budget. Restore and growth normalize damaged or
partial old plans; valid zero/underallocated plans and intensity remain intact.
Opponent training controls are disabled. Focused acceptance exercises all three
intensities, invalid saved fields and actual player growth, preventing poisoned
attributes instead of only hiding NaN in the UI.

## D11 actual daily-clock long-career runner (2026-10-02)

PR #105 passed full final-head CI and merged as
`71256de44aecdae0f7ea0aa1807c8b44b13a9d35`. Training input/apply also passed
in a real Edge viewport for all intensities, with five controls on one desktop
row and no mobile horizontal overflow. Latest standalone HTML includes this fix.

`scripts/daily-career-acceptance.mjs` follows `playWorldDay`, daily effects,
managed First Selection and canonical interactive draft/result writers. It never
positions the clock directly on fixtures. Save/resume covers pending official
series, completed season and market boundaries. The bounded starting world has
closed NA, open EU with second division and an eight-team international Swiss
event; ordinary world evolution remains enabled. It exercises real AI operation
and promotion without substituting fabricated champions. Two domestic years and
one international year passed locally; these are short-path evidence only.

Ordinary full CI adds one international career year to its required gate. The
separate manual `long-career.yml` runs three independent seeds for 100 years each
by default, without repeating the expensive run on every PR. Reports checkpoint
each completed year and retain partial progress/error on failure. They include
day/fixture counts, official pending games, champions, patches, active/total
players, team count, ability/cash/salary/value quantiles, champion pick diversity,
save size, runtime and heap use. Review warnings flag a champion winning over
70% of the last ten editions, a champion exceeding 8% of all recorded picks,
median ability rising over 8 points in ten years, or median salary tripling in
ten years. These are investigation triggers, not claims of a realistic target
distribution or automatic balance changes. Budget: 120-minute engine deadline, 125-minute
Actions job, 1.5 GiB observed heap threshold (2 GiB Node heap).

Remaining D11: execute the final merged revision's three 100-season jobs, repair
actual failures and review long-run monopoly/inflation/meta warning trends.
This small-world scenario is not proof of default
six-region Android performance. Whole-D remains active; D04/D06 ownership and
economic boundaries, D07–D10 and D13 real mobile tasks still remain.

PR #106 head `7b6313ed086753090a81d829d510aa017d0a489e` could not run CI:
Actions run 36899884255 failed before any step, with GitHub's annotation
"recent account payments have failed or your spending limit needs to be increased".
This is an account execution block, not a test failure. Do not merge this PR or
claim full CI success. Do not change billing or spending settings automatically.
Local bounded checks remain available; retain long-run partial reports and keep
implementation work independent of this external block.

## D06 ownership continuity (2026-10-02)

Ordinary office-approved acquisitions previously only changed the club name,
leaving the same owner in place. Both those acquisitions and financial rescue
sales now create distinct stable owner identities and append a dated ownership
chain identifying the same continuing club, region/division and license.
They retain the club ID, employment/staff contracts, registration, parent links,
finances and results. Rescue equity remains capital in the existing statement;
ordinary acquisitions do not invent cash revenue. A new board starts with a
fresh patience budget. Owned reserves cannot be sold independently through this
path. Legacy saves gain a current identity without fabricated past acquisitions.

Owners: club-ownership.js, finance.js, office-international.js and save-migration.js.
Focused acceptance covers continuity, sequential identities, legacy/current save
restore, reserve rejection, ordinary production acquisition and real financial
recapitalization/accounting. Finance, the 29-acceptance shared runner (25 engine contexts) and static checks (91 modules) pass.
Remaining D06: license approval/transfer lifecycle and region merge/split successor
history/local eligibility; this batch does not complete those boundaries.

External execution block: PR #106's CI failed before any step on GitHub account
billing/spending restrictions (run 36899884255), not a test failure. Preserve its
branch and do not merge without full CI. Its follow-up local documentation commit
is 115a2c6. A local single-seed 100-season fallback is running as process 26248,
with reports .diagnostics/daily-local-1.json and stdout/stderr files. It loaded
PR #106's engine revision before this ownership change; do not attribute its
results to the new ownership code. Early actual daily-clock seasons passed;
completion and remaining two seeds are still unverified. Do not change account
billing settings automatically. Continue implementation independently.
## D06 region/club organization continuity (2026-10-02)

Region mergers previously promoted every moved second team to division one and
removed its parent; independence could instead close an owned reserve merely
because its parent changed region. All five office-directed relocation paths now
share region-continuity.js: continuing clubs retain IDs, division and employment
organization, with owned reserves moving alongside parents. Destinations retain
second-division support. Each relocated club records a dated same-club region
history. Regional succession records preserve predecessor names and successor
IDs before dissolved region objects are removed, without self-predecessor links.
Ordinary voluntary relocation is not introduced by this administrative path.

Focused acceptance triggers the actual production merger, then checks splitting,
contracts/staff/financial/history continuity, reserve parent/division, successor
save restoration and invalid-destination rejection. Static checks (91 modules)
and the seven-case calendar/scouting runner pass. Whole-D/D06 are not complete:
player successor-local choice, current-contract legacy eligibility and license
approval remain the next connected work. Do not infer that preserving a club
also grants a player new local status; those policies require explicit commands.

The GitHub account execution block persists; this change must remain a draft
until full CI can run. Preserve PR #106 (long careers) and #107 (owners) and their
independent branches. The running process 26248 still targets #106's prior engine,
not this change: 12 seasons through 2038 passed at last observation, with save
size about 25 MB and year-boundary heap about 511 MB. The process working set was
about 2.9 GB, materially higher than heap: later runner reporting should include
RSS/external allocations, and mobile performance acceptance remains unproven.
No duplicate 100-season run should be started while this process is active.

## D06 successor-local and contract protection (2026-10-02)

PR #108 now also grants explicit successor-region choices to players whose native,
active or unexpired earned local region is reorganized. Existing player-choice
commands retain manager/player authority; AI and free agents can choose through
that same path. Choosing a native successor replaces the effective native option
without rewriting historical birthplace. Alternative succession choices are
consumed, including chained reorganizations before activation. Valid independent
qualifications retain their normal expiry. Service progress follows the player's
successor employment region while retaining the snapshotted old rule/days/seasons.

Office-directed club moves protect the old contract's registered-local status
within the continuing employment organization until its original signed/until
identity changes. Exceptions are explicitly scoped to club IDs and do not become
portable region-wide local status or follow an external borrowing club. Renewal
cannot extend the original deadline. Shared registration, roster plans, market
projections and scouting classification now pass the actual destination club;
market capacity also honors a valid next-season choice. A post-reorganization AI
review queues new choices before recruitment, without duplicating existing ones.
Saved malformed contract exceptions fail validation.

Focused acceptance now includes a five-native official squad after relocation,
nonportable/loan guards, renewal boundary, old service-rule continuity, managed
and FA choices, exclusive chained native succession and save validation. Shared
29-acceptance UI/contracts runner, seven calendar/scouting cases, registration,
transfer-stage/local-service and 91-module static checks pass locally. Full CI
remains blocked by the recorded GitHub account execution restriction; #108 stays
draft and latest player-facing HTML remains the verified merged #105 build.
D06 still requires license approval/transfer lifecycle and wider regional-policy
acceptance; no whole-D completion is claimed. The existing #106-engine long run
had reached 20 seasons through 2046 (about 58 MB save / 1.25 GB year-boundary heap)
at last observation, and is not evidence for this new eligibility code.

## D integrated implementation batch (2026-10-02)

Current work is consolidated on feature/d-stage-integration from main
71256de44aecdae0f7ea0aa1807c8b44b13a9d35. This batch combines the actual daily
career clock and long-career QA (#106), ownership continuity (#107), and region
organization/successor-local/current-contract protection (#108). Component
branches remain recoverable; one integration PR becomes the review target.
Those earlier dated entries describe component history, not separate merge plans.

Integration validation passed locally: 30 shared UI/contracts acceptance cases
across 26 engine contexts, seven calendar/scouting cases, 13 CI/publication/
mutation ownership unit tests, and 92-module static/build checks. An actual
daily-clock year with seed d-integration covered 258 official fixtures and save
restoration. A second bounded year with seed d-memory-report verified the new
memory report and resident-memory guard: 258 fixtures, approximately 6 MB save,
136 MB heap and 647 MB RSS at its year boundary. These are desktop Node results,
not mobile performance acceptance or completed multi-seed 100-season validation.

The QA runner now reports heap, RSS, external and array-buffer memory separately;
defaults retain the 1536 MiB heap budget and add a 4096 MiB RSS ceiling. Regional
monopoly warnings accommodate multiple editions per year and avoid duplicate
warnings for one competition/year. Primary files are daily-career-acceptance.mjs,
club-ownership.js, region-continuity.js, shared local-service/roster/market paths,
their acceptance cases and CI/long-career workflows. No temporary engine fork is
introduced. Diagnostic files remain untracked.

GitHub run 36899884255 was blocked before steps by failed account payments or a
spending limit. No unlock/reset time was provided. Full CI remains mandatory for
merging this batch; account billing settings must not be changed automatically.
The prior-engine process 26248 remains the only 100-season run; it does not verify
this integrated code. Preserve its partial reports even on budget failure.
dist/LOL-GM-latest.html remains the verified #105 build; the locally built draft
is separately available as dist/LOL-GM-D-preview.html.

Next connected work: D06 license approval/transfer lifecycle, then remaining
D04/D07-D10 mechanisms and D12/D13 acceptance. D11 requires completed multiple
100-season seeds, and D13 still needs real mobile core tasks/TalkBack evidence.
Neither D06 nor the whole D stage is marked complete by this consolidation.

## D06 competition license lifecycle (2026-10-02)

The integration batch now records a stable same-club competitionLicense ID and
current office approval, region, division, parent, legal holder and policy kind.
Existing franchise/mixed/open/reserve rules determine these states; this does
not add a player-managed license market or change the configured league model.
Ownership changes transfer the legal holder for the parent and owned reserves
without replacing the club's license identity. Region moves, office system
changes and actual promotion/relegation append dated transitions. Closed clubs
return their license alongside existing financial and employment settlement.
Unchanged reviews do not append history. Legacy saves get current approval state
without fabricated prior events, while existing saved history is preserved.

club-license.js owns this record; existing world/office/offseason/ownership/
region/closure writers call it rather than introducing competing actions. Closure
previews reject a changed owner/license state, and the operation-scoped rollback
journal restores license data on a late failure. The acceptance case exercises
franchise/mixed/open policies, a continuing parent/reserve sale and regional move,
production promotion in two regions, mixed protection, reserve exclusion,
old-owner preview rejection, closure rollback and current/legacy save restoration.

Local validation: all 31 shared acceptance cases / 27 fresh engine contexts,
seven calendar/scouting cases and 93-module static/build checks pass. The actual
daily-career seed d-license-integration passed one year, 128 daily ticks, 258
fixtures, 46 managed official games and phase save restoration; boundary save
about 5.9 MB, heap 131 MB / RSS 352 MB. The untracked D preview is updated, while
the verified latest HTML remains #105. The prior-engine process 26248 reached
25 seasons through 2051, about 92 MB save and 942 MB boundary heap, still running;
neither its partial run nor this bounded new-code year proves complete D11.

Continue remaining D04/D07-D10 mechanisms and D12/D13 acceptance. D06 still needs
wider repeated policy/succession acceptance in long careers. Full CI remains an
unexecuted account-blocked merge gate for #109, and real mobile/TalkBack evidence
remains required before whole-D completion.

## Paid Actions cost policy (2026-10-02)

The user approved an account-wide Actions monthly paid budget of $10, with stop
usage enabled at the limit. Payment registration and budget setup restored CI;
#109 passed the full run 36910119137 and merged as
1cd51d8fd80c5dbf2748b2cdb8470fe372534580. No additional budget increase is authorized.

Minimize billed runner minutes: drafts run static/scope checks; documentation and
CI orchestration edits avoid game simulations; UI-only changes select the shared
UI acceptance suite and production build. Engine/unknown ready-PR changes retain
the full required suites. Explicit workflow_dispatch still runs full validation.
All engine changes must merge through a validated PR; direct unvalidated engine
pushes to main are not supported by this publication-only push policy. After a
validated PR merges, main runs static checks/build/publication instead of repeating
the same season and medical suites. Manual long-career runs remain separate and
must not duplicate an active run. Do not retry successful unchanged commits.

Medical core, four seed shards and both aggregate invariants now share one runner
without dropping seeds/assertions. Validation reports expire after three days.
Scope policy is tested for engine/unknown, mixed, UI-only, draft, documentation,
CI tooling, manual dispatch and main publication. The workflow's verify gate still
requires every suite selected by its scope; selected failures cannot be skipped.
The old-policy duplicate main run 36910992603 was canceled to avoid paying for
already successful PR verification. This requires the subsequent lightweight
main publication to refresh the committed standalone HTML.

## D11 long-career memory recovery (2026-10-02)

PR #110 passed its selected three-job run 36912057493 and merged as
4572b15ee9806e8dd403c264377bd50f37f13131. Lightweight main publication
36912274078 succeeded; generated standalone commit 960f46d is the new baseline.
The $10/month stop-at-limit policy and minimal CI selection remain in force.

The prior-engine 100-season process 26248 terminated with native V8 heap exhaustion
after 30 completed seasons through 2056. Its last boundary save was 124,761,960
bytes and heap 1,277,779,048 bytes; fatal GC reached about 2 GB. Its JSON still
says running because native OOM bypassed JavaScript error handling. Preserve the
original .diagnostics/daily-local-1.json and stdout/stderr; do not treat it as a
live process, a passing 100-season run or evidence for the merged engine.

save.js now interns repeated restored meta-history strings and shares immutable
item/rune loadouts. A bounded 4096-combination dictionary avoids retaining every
unique build key while loading. Encoded rows are replaced progressively so old
compact containers can be reclaimed. No historic match, player, item, rune,
patch or query dimension is removed; existing v15/format 1 and 2 saves remain
compatible. Shared loadouts must not be mutated by evidence consumers.

The daily QA runner releases old fixture references and serialized saves before
the next restore, records before-save/before-restore/after-restore memory stages,
checks heap/RSS budgets at these boundaries and reports meta-history row counts.
This distinguishes engine history growth from QA-held copies and preserves the
last observed stage if a native crash bypasses normal failure reporting.

Local evidence: regression passes including 6000-game archive roundtrip, sharing,
immutable evidence, legacy order/duplicate slots, historic query and insight
counts. Static validation checks 93 modules. A separate synthetic 60,000-game
restore probe retained about 382 MB before vs 77 MB after (same 140 MB serialized
history, forced GC for measurement). This is a repeated-loadout synthetic case,
not a mobile benchmark or proof of real 100-season completion. Real daily seed
d-memory-resume passed one season, 128 ticks, 258 fixtures, 46 managed games,
international competition and checkpoint restores; save about 6.1 MB,
heap 160 MB/RSS 714 MB at the reported boundary.

Next: run the final engine PR's required CI once; then validate current-engine
long careers without duplicating runs, including varied loadouts and mobile memory
limits. Remaining D04/D07-D10 mechanisms and D12/D13 remain open. Whole D11/D
must not be marked complete from this memory improvement or a bounded year.

## D07 connected staff employment batch (2026-10-02)

Baseline: generated main 6f0d83d after merged #111. Staff are now continuing
people with a primary job, secondary specialty, public estimate, ambition,
fixed annual wage, 1–3-year contract and dated employment history. Secondary
expertise supplements its corresponding coaching/analysis/recovery/scouting
effect at 35% weight. Old staff retain their IDs and primary ability/effects;
restoration supplies a current two-year employment baseline and public estimate,
without inventing past events. Previously closed legacy clubs return their staff
to the free market instead of inventing new historical compensation claims.

Public/interview estimates are stored observation data. Changing hidden ability
does not silently change an existing dossier or interview. Club-specific annual
interviews narrow uncertainty; AI ranks staff with observations, not exact rating.
The worker's asking wage is a public demand. Personal consent considers wage and
club reputation weighted by ambition. AI cannot poach managed-club staff.

staff-contracts.js owns sign/renew/release/expire/retire/interview commands via
the existing guarded action gate. Payroll uses agreed absolute annual wages,
without applying regional scale twice. Hiring/renewal checks one year's liquidity
and final forecast payroll; the agreed wage is charged through annual finances.
Termination/buyout uses a common 50% of remaining annual wages, without adding
an individually negotiated guarantee setting. Poaching pays the existing finance
transfer writer; termination uses prepaid severance without annual double charge.

At a full department, outgoing termination and incoming employment are one
transaction. The shared preview contains both compensation costs and the final
payroll change. Late failure restores original people, roster/pool identities,
contracts, histories, interviews and finance. AI prefers replacement in the same
primary job and uses this same command. Department limits 9/4/6 remain enforced.
The market exposes year/wage terms, an optional replacement selector, interviews,
guarded confirmation and 20-person pages; exact staff ability is no longer shown.

Expiry and retirement preserve the person and career. AI renews through the same
contract command if affordable; managed appointments expire into free agency
without auto-replacement. Retired people have a separate historical archive.
Club closure includes staff claims in the existing proportional player/staff
allocation and parent/reserve funding. Cash-short unpaid claims remain recorded;
employees return to free agency, and closure rollback restores employment too.
Existing player-only closure arithmetic tests use expired staff contracts to
isolate that policy; new acceptance separately covers nonzero staff creditors.

Local validation: dedicated staff acceptance covers offers/cancel/confirm,
observations, secondary effects, periods/renewal, budget/caps, consensual poaching,
cash conservation, replacement including full-department AI, late rollback,
expiry/retirement, insolvent closure/stale preview/escaped creditor UI, legacy and
current saves. The shared UI/finance/contract runner passed 32 cases in 28 fresh
contexts, regression and core smoke passed; 94-module static validation passes.
Final required CI is the merge gate. Broad long-career staff retention/balance and
actual mobile interaction are not proved by these bounded tests.

D11 updated failure: the single #111-engine local run daily-memory-main-1/PID7512
ended after 23 completed seasons through 2049, during 2050 offseason, with the
old AI hireStaff department-cap exception, not OOM. Its last completed save was
about 56.8 MB/heap 1164 MB/RSS 1987 MB; the final after-restore checkpoint was
heap 615 MB/RSS 1721 MB. Preserve JSON/stdout/stderr/process metadata. This D07
batch replaces that old two-step staff replacement with the atomic command and
tests the full-department production caller. Do not call this failed run passing
100 seasons or evidence for this new engine. Next long run must use a merged,
verified current engine and must not duplicate any live daily-career process.

Remaining: broader staff/AI career and balance evidence in D11, D04 remaining
agency/insolvency mechanisms, D08 relationships, D09 resource commitments,
D10 controlled patch/match experiments, D12/D13 complete task acceptance.
The full D stage remains open.


### D08/D09 connected cohesion and practice batch (2026-10-02)

Base: latest validated main 167a5d3 (generated standalone after #112).
Current lineup cohesion derives a bounded 15–85 target from teammate bonds,
team adaptation and manager trust. Official and private matches use the actual
five, so a replacement does not inherit the departing lineup's entire bonus.
Series and daily recovery approach the target; market close no longer awards
an unconditional seasonal bonus. Severe teammate conflict affects satisfaction,
renewal willingness and prolonged transfer requests using existing state.
Relationship reads are pure, preserving preview/rollback boundaries. AI uses
its own observed bonds/adaptation to choose practice focus, with saved reasons.

practice-resources.js owns the daily 100-point time budget. A scrim set consumes
10 points for both clubs; remaining points are split among individual drills,
champion practice, tactics and teamwork. Existing 100-point attribute allocation
subdivides individual drills. Focus is selectable in squad editing. Daily time
commitments persist through save/reload and cannot run twice or admit a later
scrim after drills consume the day. Individual time contributes to seasonal
growth; champion drills replace the free seasonal training grant for careers
with daily practice evidence. Rest/rehab players skip drills; official days do
not provide drills. Old plans retain attribute allocations and use balanced
focus, with old current-day scrim logs counted as spent time.

International participants use the existing event's host region/time zone from
five days before the first fixture through one day after the last fixture.
Partner assessment, AI candidates and actual clock overlap share that venue;
remote home clubs remain inaccessible unless located in the same host region.
The existing near-official-rival embargo and mutual acceptance remain intact.
This is bounded tournament attendance, not a new flight/visa/travel simulator.

Files: player-relations, engine, offseason, development, calendar, scrim,
scrim-partner, timezone-calendar, practice-resources, ui-roster and test manifest.
Local evidence: same-seed real match changes under different bonds, no neutral
cohesion buff, bounded recovery, new-lineup penalty, satisfaction/renewal, AI
response, resource tradeoffs/idempotence/restore and international entry/exit.
Shared runner 33 acceptances/29 contexts, calendar/scouting 7, regression and
95-module static/build passed. Full required CI remains the merge gate.

Remaining D08/D09: broader relationship-aware recruitment/selection scenarios,
long-term conflict and recovery balance, explicit player-specific conversion
time accounting, manual partner request workflows and actual mobile focus
editing. Do not mark whole D08/D09 or D complete from this bounded batch.

D11 observation: #112's local PID40204 is absent and exec session55031 no longer
exists. Original JSON still says running, but only 34 seasons through 2060 and
an after-restore checkpoint in 2061 exist. No stderr error identifies the cause.
Preserve original files and daily-staff-main-1.observation.json. This is an
interrupted, incomplete run, not a proven OOM or a passing 100 seasons. Do not
restart the same engine automatically or use it for this newer batch.


### D09 conversion time and scrim scheduling batch (2026-10-02)

Base main79aaa5f, after #113's verified engine and standalone publication.
Role conversion now uses 25% of each converting player's individual drill
allocation, rather than an independent pre-scrim daily tick. A normal balanced
100-point day supplies 12.5 conversion points; six scrims leave 5. Progress
scales with available time, while training-day counters count actual attended
days. Rest/rehab and official days do not grant conversion drills. Player-level
remaining individual time is accumulated and used by seasonal growth; the old
flat conversion growth penalty is retained only for legacy accounting, avoiding
a second charge for recorded daily conversion work. Save/reload preserves time
and progress. Remove the unused advanceRoleConversionsDay bypass.

The daily AI scrim batch precomputes tournament venues once and shares two
clock ranges per time zone among candidates. It does not persist a stale cache
in the save. Direct partner assessment and booking still use canonical venue
and time checks; a context from another date falls back to fresh calculation.
Tests compare all clubs and both blocks against uncached venue/time results,
including international visits, and count clock conversions: cached comparisons
add no clock conversions, with over fivefold fewer conversions in the fixture.
This is a reduction in repeated work, not Android battery/performance proof.

Files: practice-resources, role-conversion, development, calendar, scrim,
scrim-partner, timezone-calendar and existing cohesion/practice/partner tests.
Local tests cover time conservation, heavy-scrim opportunity cost, player-level
growth factor, no double penalty, rest/official exclusion and reload idempotence.
Shared 33 acceptances/29 contexts, calendar/scouting7, regression and static
95 modules/build pass. A missing legacy practiceUsage field found by the
training acceptance was fixed before posting final CI. Final required CI is
still the merge gate; do not mark whole D09/D or actual long-career/mobile
validation complete.

Next connected work: manual partner request/consent/scheduling workflow,
relationship-aware recruitment/selection scenarios and supervised long-QA exit
records. No 100-season run was duplicated or restarted during this batch.


### D08 relationship decisions batch (2026-10-02)

Base main261587e, published after verified #114. The role-fit assignment DP
remains additive and deterministic. Two bounded bench-substitution passes then
compare full lineups with at most +/-10 total score from average teammate bonds.
This avoids pretending pair interactions are additive DP terms. Large role-fit
gaps still win; explicit locked starters are preserved and the human club's
selection is never overwritten by AI. Production AI records before/after, score
change and observed relationship reason when it changes the starting five.
This is a bounded local refinement, not an exact globally optimal pair solver.

After real own-team official play or joint drills, clubs record observed pair
relationships. These saved reports belong to one club, retain at most512 recent
pairs, and lose certainty toward neutral over730days. AI recruitment adds at
most +/-2 points using only that club's recorded evidence. Unknown pairs are
neutral and current hidden relationship changes cannot silently update a report.
A player independently remembers their own teammate bonds; these change offer
utility by at most +/-0.2. Changed teammate bands enter negotiation situation
reopening and player action snapshots, preserving stale consent protection.
Personal relationship history itself is not pruned by observation retention.

Files: lineup, player-relations, practice-resources, contracts,
contract-negotiation, state-player-actions, relationship-decisions acceptance
and existing runner/package wiring. The new acceptance checks near-equal bench
choice, strong ability gaps, locks/human authority, actual AI changes, club report
isolation, stale evidence, player willingness, snapshot/reopening and saves.
Shared runner34 acceptances/30contexts, calendar/scouting7, regression and
95-module static/build pass locally. Final whole mandatory CI is the merge gate.

Remaining: D08 long-term conflict/retention/recruitment balance and mobile
workflows, D09 manual partner request/consent/schedule, D11 supervised process
exit evidence and actual multi-seed100seasons. Existing failed/interrupted
diagnostics remain preserved; no long run was duplicated. Whole D remains open.

### D09 manual scrim bookings (2026-10-02)

The squad screen can request 1–3 sets in an afternoon/evening block tomorrow
through seven days ahead. Both clubs must have compatible local practice venues,
overlapping UTC times, healthy rosters and free capacity; scheduled official
matches and the existing competitive secrecy window remain authoritative.
The requesting manager supplies their own consent. The opponent uses its existing
training preferences with a deterministic pair/date/block response. Accepted,
declined and cancelled requests persist in the world ledger. Changing set count,
reversing clubs or cancelling cannot reroll that response. Owned reserve coaches
can arrange their own squad's practice, while AI cannot reserve the human squad
without a manager request. Routine automatic practice remains available.

Accepted bookings run before routine AI practice and drills on the actual daily
tick. Both clubs spend the existing shared practice budget, and private logs occupy
their block. Changed fixtures, health or venue can block execution without a free
practice grant; missed dates do not grant retroactive practice. Cancellation
releases both slots. Old saves have an empty optional ledger. Future responses
remain until their date; finished history retains at most128 rows for14days.
Request/cancel actions use the existing pure preview, stale-state gate and atomic
rollback, preserving the original ledger reference after a late failure.

Files: scrim-plans.js, ui-scrim-plans.js, calendar, state-rollback, ui-roster,
module manifest, package and calendar/scouting acceptance runner. Dedicated
acceptance covers consent/refusal, both-party reservation, authority including
owned reserves, embargo/recovery, cancellation, save/load, stale and late rollback,
actual private games/shared costs, changed fixtures and the production daily tick.
Calendar/scouting8 acceptances pass locally. Full mandatory CI remains the merge
gate; D09 long-term scheduling balance and D13 real mobile task evidence remain
open. D11 supervised execution and actual multi-seed100seasons are still pending;
no long run was started or duplicated by this change.
