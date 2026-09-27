# LOL GM — Development Guide

## Current Phase

`CURRENT_PHASE = PHASE_1_CORE_FOUNDATION`

The Artifact migration is complete and accepted. GitHub is now the primary development codebase.

Current Phase 1 goal: replace prototype-only state with coherent persistent game state and complete the first real gameplay loop.

Development progress is tracked by the 22 major LOL GM systems. Finish one major system completely before moving to the next.

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
- `11. 실제 LoL식 밴픽 UI` — ACTIVE

## Product-wide convenience acceptance rule (2026-09-27)

Every major system, including already engine-complete Items 1–6, is subject to a standing convenience acceptance rule: automate repetitive or administrative actions only when they do not commit a strategic choice; recommendations, batching, sorting and prefill may be automated, but consequential sporting decisions for the managed club require explicit player confirmation; batch repeated actions where practical; preview projected state, cost and consequences before commit; validate the final state rather than transient intermediate clicks; preserve filters/scroll/editing context; and keep mobile decision surfaces compact. Completion status means the engine contract is accepted, not that poor interaction patterns are frozen.

Current retrofit evidence: squad starters/roles/tactics/training and first/reserve assignment use staged apply; roster-plan validation is final-state/atomic; scouting supports multi-select batch observation; initial blank-roster recruitment supports batch interest/scouting; costly release and staff changes preview financial/ability consequences; facility upgrades are automated by club management rather than exposed as repetitive manual administration.

Item 7 acceptance (2026-09-27): clubs have functional training, analysis, recovery and youth infrastructure with direct development/analysis/recovery effects and full upkeep accounting. Infrastructure capex is board-controlled for both player and AI clubs, uses the shared upgrade/cash validation path, respects club philosophy and financial reserves, and removes low-value manual facility clicking. The player is the managed club's head coach. The legacy coach slot is presented as the senior assistant, alongside strategic, analyst, development and performance specialists; these roles materially affect draft/analysis/development/recovery, carry salary/severance costs, persist in saves, age and recycle through the staff market. AI first-division clubs evaluate specialist upgrades using the same staff market while respecting philosophy, improvement threshold and cash reserve. Player-controlled staff changes remain strategic choices and preview ability/cost consequences. Save round-trip and insufficient-funds invariants are smoke-tested; standalone and latest-head CI pass.

Item 8 acceptance (2026-09-27): training combines 100-point focus allocation with light/normal/high intensity, creating a real growth-versus-fatigue/condition trade-off. Schedule-aware recommendations use the next official match and current squad recovery state; player control is preserved while AI uses the same recommendation logic. Scrims remain unofficial but persist champion scrim experience/confidence, player fatigue/condition cost and team analysis intel. Exhausted squads and excessive same-day volume are blocked. Stronger partners can provide more practice value, while repeated partners have diminishing returns; the UI previews this value and AI partner selection uses the same function without hidden information. Smoke coverage locks training automation, scrim development effects, schedule recommendation validity and repeated-partner diminishing value.

Item 9 acceptance (2026-09-27): the initial 26.19 world embeds a patch-pinned Riot Data Dragon 16.19.1 baseline for all 173 champions with stable LOL GM IDs, Korean names, Korean passive/Q/W/E/R descriptions, exposed base stats and spell cooldown/cost/range source fields. Runtime normalization preserves source provenance while simulation-only mechanics remain explicitly derived; champion base/detail data is consumed by draft/composition/combat logic rather than being display-only. Champion detail UI shows authoritative Korean descriptions and distinguishes source fields from simulation interpretation. Official-match meta history persists competition/season/year/split/stage/league/domestic-international/region/team/player/actual-position context with filters and champion player/team/matchup/recent insights. Global professional eligibility, locked tournament champion pools, practice access during the global ban, regional meta evidence, persistent team meta knowledge/counter-research, cross-region learning and stable-ID rare reworks are smoke-covered. This acceptance does not complete Item 10: autonomous patch diagnosis/change selection remains a separate patch-engine system.

Item 10 acceptance (2026-09-27): the patch engine diagnoses the live professional meta from per-patch evidence rather than win rate alone, combining sample confidence, pick-ban pressure, win rate, recent trend, actual-position flex, regional/international spread, top-team usage, player/team concentration and composition dependence. Consecutive same-direction changes are damped, opposite overshoot can generate partial rollback, and micro/small/medium/large magnitudes apply real old→new changes across base/growth stats, attack/spell range, resource costs, cooldowns, damage, utility, healing, shielding, mobility and system rules. Stable-ID mid-scope and rare major reworks preserve history. The 26.19 baseline now embeds the complete pinned Data Dragon 16.19.1 Summoner's Rift purchasable catalog (254 item records) and all 62 selectable runes across five styles, with Riot IDs, Korean text, prices/stats, recipes and rune style/slot structure. Matches choose these automatically: the engine selects a starter, traverses component recipes into legal final/boot builds, and constructs a legal six-rune page (four primary + two secondary from a different style). There is no player-facing item/rune micromanagement requirement; item/rune patches exist to alter champion power, match outcomes, draft priority and the observed meta. Patches can buff/nerf prices/effects, add or deactivate/remove items/runes, while long-save guards prevent class build pools or rune slots from collapsing. New champions target 2–3 releases per year with the Item 9 professional delay. Full patch history reconstructs historical champion/item/rune specs. `scripts/validate-system-snapshot.mjs`, smoke tests, standalone synchronization and latest-head production CI gate completion.

Pre-Item-11 stabilization (2026-09-27): before adding the full draft UI, the runtime/build architecture was refactored without changing accepted Items 1–10. Patch-history caching is world-owned through WeakMap state rather than a shared global object; champion/system evaluation, automatic item/rune fit, same-day draft champion pools and meta-history queries are revision/index cached with explicit invalidation. Draft noise now lazily admits champions that become professionally eligible inside the same patch instead of retaining an incomplete cached champion set. Series simulation no longer JSON deep-clones draft context every game. Derived 26.19 patch baselines are no longer serialized; historical patches rebuild from pinned source plus deltas. Meta-history save records use a reversible compact representation with smoke-tested material size reduction, and save-only season compaction now operates on a serialization view rather than deleting fields from live runtime state. A discovered save bug was fixed by aligning UI SAVE_VERSION/storage namespace 14 with buildWorld schema 14, and CI rejects future schema drift. Patch/meta, roster/market, and season/world/progression UI were extracted from app.js into domain modules; app.js fell from about 82.8 KB to 65.0 KB. Build/check/smoke share one artifact module manifest, CI rejects duplicate cross-module globals, maintainability budgets cover the major engine/UI modules, and CI records a deterministic performance probe for Bo3 simulation, draft-pool cache hits, item/rune selection and 10k-row meta queries. See docs/ARCHITECTURE.md.

## UX / Convenience Re-audit (2026-09-27)

Items 1–5 remain engine-complete, but COMPLETE no longer means their current interaction design is frozen. A cross-system convenience audit found follow-up UX debt that must be repaired when the affected surface is touched, and before final integration acceptance:

- squad management currently commits starter, roster-role and training changes immediately; management surfaces should prefer draft/edit → preview → save/apply when several related choices are normally made together
- owned-reserve call-up/send-down must be edited as a batch and validated against the final organization roster, rather than rejecting a legal swap because its first intermediate click is temporarily illegal
- initial roster construction and scouting/market actions rerender after many single actions; preserve context/scroll and add batch actions where repeated observation or shortlist management is expected
- dense roster/scouting tables need stronger mobile-first summaries, filters and compact actions instead of relying on horizontal-table scanning
- destructive/financial actions should continue to show consequences before commitment; multi-term negotiations already use an explicit offer form and should keep that pattern
- validation messages must explain the violated rule and, where practical, the required correction instead of only disabling progression

This is now a standing acceptance rule for all 22 systems: functional correctness, persistence and CI are necessary but not sufficient; ordinary management workflows must also be low-friction on smartphone portrait.

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

Item 2 acceptance included stable player identity and nationality, primary/secondary position familiarity, position-weighted ratings, detailed core metrics, bounded form/condition/fatigue/morale/sharpness/team/tactical adaptation, reputation and market value, champion official/scrim/training experience and mastery adaptation, individualized growth/peak/decline/retirement lifecycle, full match-derived player metrics, career snapshots/events, save round-trip validation, standalone HTML execution, and successful CI.

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

The canonical first-division international competition contract is now frozen in `INTL_PRESETS` and D-032: First Stand (12), MSI (16), Eastern/Western Cup (8 each), Worlds (24), Masters (16), and Open (12). Official full names are used as internal IDs; display abbreviations are separate.

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


### Item 11 live-draft checkpoint — 2026-09-28

The managed-team official match path now pauses world progression and runs every Bo3/Bo5 game through the interactive draft surface. Fixed Fearless locks all ten picks from each prior game; flex roles remain hidden until legal final assignment; game-one First Selection is home-team in domestic double round-robin, explicit seed only where domestic playoff rules say so, and coin toss for international knockout/bracket matches after seeding has served bracket construction. Games two onward always give First Selection to the previous-game loser. The selection screen shows the previous game's score/picks, and the live draft shows series score, resolved First Selection and the accumulated Fearless lock strip. Item 11 remains ACTIVE pending final draft-information/AI-explanation UX and end-to-end acceptance pass.

### Managed-club authority rule — 2026-09-28

The player is the head coach and retains final authority over consequential sporting decisions for the managed club. Player recruitment, contracted transfers, releases, renewals, team-option exercise, first/reserve movement, starting lineup, roster roles, tactics, training direction, scrim choices, senior-assistant appointment and specialist-staff appointment are never auto-committed by club AI. Staff may recommend, rank, prefill, batch or warn. Player-option decisions belong to the player/agent and regulatory/deadline consequences such as an unrenewed expired contract becoming free agency may resolve automatically. AI clubs remain fully automated. Board-owned infrastructure capex remains outside the head coach's sporting remit unless that ownership model is changed explicitly later.
