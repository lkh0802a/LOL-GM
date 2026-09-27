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
- `6. 1부 / 2부 / Academy` — ACTIVE

## UX / Convenience Re-audit (2026-09-27)

Items 1–5 remain engine-complete, but COMPLETE no longer means their current interaction design is frozen. A cross-system convenience audit found follow-up UX debt that must be repaired when the affected surface is touched, and before final integration acceptance:

- squad management currently commits starter, roster-role and training changes immediately; management surfaces should prefer draft/edit → preview → save/apply when several related choices are normally made together
- owned-reserve call-up/send-down must be edited as a batch and validated against the final organization roster, rather than rejecting a legal swap because its first intermediate click is temporarily illegal
- initial roster construction and scouting/market actions rerender after many single actions; preserve context/scroll and add batch actions where repeated observation or shortlist management is expected
- dense roster/scouting tables need stronger mobile-first summaries, filters and compact actions instead of relying on horizontal-table scanning
- destructive/financial actions should continue to show consequences before commitment; multi-term negotiations already use an explicit offer form and should keep that pattern
- validation messages must explain the violated rule and, where practical, the required correction instead of only disabling progression

This is now a standing acceptance rule for all 22 systems: functional correctness, persistence and CI are necessary but not sufficient; ordinary management workflows must also be low-friction on smartphone portrait.

Item 6 progress (2026-09-27): Tier-2 ownership and promotion eligibility are now explicit engine rules. Mixed systems create both certified first-division clubs' required owned reserve teams and independent Tier-2 clubs; franchise systems require owned reserves; open/relegation systems treat reserves as optional. Owned reserves retain stable parent IDs across offseasons and are never promotion-eligible, while independent Tier-2 clubs remain eligible where the regional system allows promotion. Smoke coverage verifies the mixed ecosystem and promotion boundary. Remaining Item 6 work must be completed before marking COMPLETE.

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
