# Codex repository instructions — LOL-GM

## All-domain implementation playbooks

**Detailed domain contracts (read the matching sections before editing any area):** [33-domain index](docs/CODEX_DOMAIN_INDEX.md), [A — game start/players/scouting/transfers/clubs/training](docs/CODEX_DOMAIN_A_CLUB.md), [B — champions/draft/matches/patches/leagues/world/AI/history](docs/CODEX_DOMAIN_B_MATCH_WORLD.md), [C — mobile UI/save/performance/security/CI/Android](docs/CODEX_DOMAIN_C_UI_QA.md).

The index maps every area to source owners, actual action/consumer boundaries, malicious/edge-case tests and GitHub issue ownership. **Do not treat the 33 sections as 33 new independent issues; reuse the already-open issues.** All relevant cross-domain acceptance remains mandatory. The official first implementation issue is still #243, then #244, with #241 continuous.

These are repository-level instructions for implementation agents (Codex and similar). Follow these before changing the game. **The actionable queue and exact first task are in [docs/CODEX_EXECUTION.md](docs/CODEX_EXECUTION.md).** This file does not claim any issue is implemented.

## First action on every new task

1. Read this file, `docs/CODEX_EXECUTION.md`, the top/latest decision sections of `docs/DEVELOPMENT.md`, and the **entire body and relevant comments** of the selected GitHub issue.
2. Inspect the **current working branch, current main, existing PRs/commits and source tests**. Never rely on a dated issue/comment to assert that something is still broken or complete. Avoid simultaneous workers modifying the same functional slice.
3. Pick the **first OPEN unfinished implementation issue in the rank order below** unless the latest explicit user instruction overrides it. If it is already fixed, prove that from executable tests and commits, document that evidence, close only its completed scope, then select the next unfinished issue.
4. Reproduce/test **before** editing; make the smallest implementation patch that closes a real writer → consumer → UI/history/save gap. Treat source-observed risks differently from reproduced failures.
5. Do not skip relevant tests, weaken expectations, hide existing failures, silently alter game rules or say it is deployed without build/CI/deploy evidence.

## Mandatory current priority order (user decision: 2026-10-17)

Tracking issues **[#242](https://github.com/lkh0802a/LOL-GM/issues/242)** and **[#241](https://github.com/lkh0802a/LOL-GM/issues/241)** are *not* a license to stop at a planning/report; #241 is the continuous integration/acceptance gate.

- **P0 implementation:** **[#243](https://github.com/lkh0802a/LOL-GM/issues/243) Bo1 scrim double simulation / displayed-vs-recorded result** → **[#244](https://github.com/lkh0802a/LOL-GM/issues/244) mobile save/background/crash safety**.
- **P1:** [#245 AI loan date](https://github.com/lkh0802a/LOL-GM/issues/245) → [#246 random comparator determinism](https://github.com/lkh0802a/LOL-GM/issues/246) → [#248 scouting/medical information boundary](https://github.com/lkh0802a/LOL-GM/issues/248) → [#249 historical replay/records](https://github.com/lkh0802a/LOL-GM/issues/249) → [#247 mobile deep-copy costs](https://github.com/lkh0802a/LOL-GM/issues/247) → [#234 world clock](https://github.com/lkh0802a/LOL-GM/issues/234) → [#224 time-based transfer negotiation](https://github.com/lkh0802a/LOL-GM/issues/224) → [#225 mobile transfer UI](https://github.com/lkh0802a/LOL-GM/issues/225).
- **P2:** [#250 nickname uniqueness](https://github.com/lkh0802a/LOL-GM/issues/250) → [#233 exact match engine](https://github.com/lkh0802a/LOL-GM/issues/233) → [#232 patch 2.0](https://github.com/lkh0802a/LOL-GM/issues/232) → [#235 strategy AI](https://github.com/lkh0802a/LOL-GM/issues/235) → [#236 player career](https://github.com/lkh0802a/LOL-GM/issues/236) → [#237 club management](https://github.com/lkh0802a/LOL-GM/issues/237) → [#238 scouting 2.0](https://github.com/lkh0802a/LOL-GM/issues/238) → [#239 long-world/history](https://github.com/lkh0802a/LOL-GM/issues/239) → [#240 performance architecture](https://github.com/lkh0802a/LOL-GM/issues/240).

If independent narrowly scoped fixes can be done in parallel without branch/file conflicts, that is allowed; **do not delay P0** for new P2 feature work. Do not create duplicate issues for work already owned by these links. Latest explicit user decisions override older planning text.

## Source, simulation and game rules

- Canonical implementation: `src/artifact/`. Ordered module list: `scripts/artifact-modules.mjs`. Root `index.html` / `dist/index.html` are **generated** by `npm run build`; never hand-edit generated files.
- The game is **mobile-first, offline-first**, world schema **v15** and compact save format **2**. Preserve saves and migrations, slot independence, idempotency, state transactions/rollback, stable IDs, and existing domain ownership. No arbitrary global rewrite.
- Keep user manager decisions explicit, AI and user teams under the same legal/budget/time constraints, opponent private data private, actual competition/calibration sources, original patch and tournament rules, Fearless Draft, and **hotfix only after all official matches of the in-game date finish**.
- Protect existing medically and financially verified rules and training/scrim shared-resource constraints. **Do not add a standalone manager/staff handover feature** (explicit user exclusion).
- Already-implemented features must not be described as missing merely because a deeper engine is planned; distinguish **existing / partially integrated / reproduced bug / unverified risk / enhancement**.

## Definition of done and handoff

For each implementation PR: `issue + reproduction + minimal code change + focused regression + adjacent integration tests + save/load/seed/authority checks + build + exact commit/test evidence + remaining gaps`. Run `npm run check` or full mandatory CI as appropriate; preserve the exact final-head CI/deployment policy in `docs/DEVELOPMENT.md`. Do not reduce tests to pass. Report what was **not** run and why. Long 100-season QA, real-device/TalkBack and Android APK are later acceptance gates, **not** already completed.

When an issue is proven complete, leave evidence and close it only then. Keep partially implemented issues open with clear outstanding steps. Update [#242](https://github.com/lkh0802a/LOL-GM/issues/242) and cross-reference the domain issue / PR. Do not conflate an issue, a commit, a PR, CI success, a merged main branch, and a deployed Pages build.
