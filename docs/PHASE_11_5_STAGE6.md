# LOL GM 11.5 / Stage 6 — UI consolidation

Stage 6 preserves world schema **v15**, compact save format **2**, existing engine rules and the supported historical save migrators. Only canonical `src/artifact/*` and test/manifest files are edited; `index.html` is generated from `scripts/build.mjs`.

## Work breakdown

1. **6-1 — Shared UI state and navigation.** Consolidate module-level, transient screen state and the six screen render/bind routes into `ui-state.js`, keeping the existing global variable names and behaviors for the standalone classic-JS bundle. Route top-level navigation and post-slot-change navigation through `navigateTo`. Keep in-view rerenders through `nav`; use a generation guard so an outdated scroll-restoration callback cannot move a newer screen. Invalidate per-world transient details when a save slot or imported world replaces the DB.
2. **6-2 — Modal and keyboard ownership (pending approval).** One overlay manager for match reports, interactive drafts and official choice dialogs; consistent focus entry/return, Escape and focus trapping without dismissing locked official drafts.
3. **6-3 — Asynchronous work and navigation safety (pending approval).** Guard slot loading, saves, simulation batches, pending official draft prompts and long-running Monte Carlo work against stale worlds/routes; test interruption and concurrency.
4. **6-4 — Mobile/accessibility and full acceptance (pending approval).** Mobile-first layout and accessible interaction audit. Execute all draft/season/market/save regressions, complete CI and performance/build checks, and verify post-merge standalone `index.html` synchronization.

### 6-1 acceptance

- `scripts/ui-state-acceptance.mjs` verifies the six view dispatch paths, selected navigation state, invalid routes, safe re-render scroll restoration, stale animation frame rejection, reset of save-scoped transient state, and that screen globals/router are no longer redeclared in domain views.
- The existing checks (`npm run check`), performance probe (`npm run perf`), production build (`npm run build`), and push-to-main standalone synchronization remain required gates.
- There is no game simulation, contract, league, patch, or save-serialization change in 6-1. Stage 6 is **not** considered complete after 6-1.
