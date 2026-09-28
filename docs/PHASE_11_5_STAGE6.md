# LOL GM 11.5 / Stage 6 — UI consolidation

Stage 6 preserves world schema **v15**, compact save format **2**, existing engine rules and the supported historical save migrators. Only canonical `src/artifact/*` and test/manifest files are edited; `index.html` is generated from `scripts/build.mjs`.

## Work breakdown

1. **6-1 — Shared UI state and navigation (implemented).** Consolidate module-level, transient screen state and the six screen render/bind routes into `ui-state.js`, keeping the existing global variable names and behaviors for the standalone classic-JS bundle. Route top-level navigation and post-slot-change navigation through `navigateTo`. Keep in-view rerenders through `nav`; use a generation guard so an outdated scroll-restoration callback cannot move a newer screen. Invalidate per-world transient details when a save slot or imported world replaces the DB.
2. **6-2 — Modal and keyboard ownership (implemented).** One overlay manager for match reports, interactive drafts and official choice dialogs; consistent focus entry/return, Escape and focus trapping without dismissing locked official drafts.
3. **6-3 — Asynchronous work and navigation safety (implemented).** Guard slot loading, saves, simulation batches, pending official draft prompts and long-running Monte Carlo work against stale worlds/routes; test interruption and concurrency.
4. **6-4 — Mobile/accessibility and full acceptance (implemented; CI verification required).** Mobile-first layout and accessible interaction audit. Execute all draft/season/market/save regressions, complete CI and performance/build checks, and verify post-merge standalone `index.html` synchronization.

### 6-1 acceptance

- `scripts/ui-state-acceptance.mjs` verifies the six view dispatch paths, selected navigation state, invalid routes, safe re-render scroll restoration, stale animation frame rejection, reset of save-scoped transient state, and that screen globals/router are no longer redeclared in domain views.
- The existing checks (`npm run check`), performance probe (`npm run perf`), production build (`npm run build`), and push-to-main standalone synchronization remain required gates.
- There is no game simulation, contract, league, patch, or save-serialization change in 6-1. Stage 6 is **not** considered complete after 6-1.

### 6-2 acceptance

- `ui-overlay.js` is the sole owner of the existing `#overlay` dialog's open/refresh/close lifecycle, background `inert`/scroll lock, Escape and Tab/Shift+Tab keyboard handling. `ui-season.js` no longer handles modal Escape or document body locks itself; `ui-draft.js` delegates official First Selection, official (locked) drafts and practice drafts to the shared controller.
- The active dialog is labeled and focused on a meaningful control. During a draft rerender, focus is restored by the previous control's ID or semantic `data-*` key when possible. After a dismissible dialog closes, focus returns to the opening control, or to the selected navigation tab if that control has been removed.
- Escape dismisses match reports and practice drafts. It is intercepted but **never dismisses** an official selection or official locked draft. Only explicit confirmed draft completion closes the locked dialog with `force: true`; the callback still resolves the official match using the unchanged engine. The original opener is retained when First Selection transitions directly into a draft.
- `scripts/ui-overlay-acceptance.mjs` exercises opening, keyboard trapping, locked Escape, protected programmatic dismissal, focus preservation through rerenders, explicit completion, focus restoration and the single-handler ownership guard. It runs inside `npm run check`, alongside existing draft/series/gameplay and v15 save regressions.
- This substage does **not** change modal content, game timing, rules, serialization or the world schema. Simulation/slot loading race cancellation remains scoped to 6-3, while broad responsive and accessibility review remains 6-4.

### 6-3 acceptance

- `ui-state.js` owns transient task tokens. Each token captures the active DB object, save slot, screen, and render generation. Re-rendering or changing screens cancels scheduled date-progression and Monte Carlo batches; their next callback cannot mutate a different world, write into a stale view, or publish an incomplete result. Completed season days are scheduled for save on cancellation.
- `ui-season.js` verifies the pending official draft's DB identity, screen and render generation at animation-frame time, so leaving the screen cannot unexpectedly open a dialog. Locked official selections and drafts remain governed by the 6-2 overlay rules.
- `app.js` queues snapshot writes by storage key. Serialized strings and slot metadata are captured before queuing so older in-flight saves cannot overwrite a newer snapshot. If an IndexedDB write fails, the local fallback becomes the preferred restore source; after a successful IndexedDB save, the fallback is removed. The prior namespace and save migration rules remain intact.
- Switching slots is an atomic, exclusive operation: cancel transient work, prevent UI interactions during I/O, persist the outgoing slot, read the target using an explicit key, and **only then** change the active slot and DB. Concurrent clicks are rejected. If save or load fails, the active slot/world remain unchanged, and invalid original data are not deleted.
- `scripts/ui-async-acceptance.mjs` exercises deferred/out-of-order IndexedDB writes, local fallback precedence, concurrent and invalid slot swaps, simulation cancellation and resume, stale official draft callbacks, and guarded navigation. It is mandatory within `npm run check`; existing engine/smoke/2-season save acceptance, perf and build still run.
- Stage 6-4 mobile and broader accessibility acceptance is still pending user approval. No game engine rules or world-v15/save-format-2 serialization changes are intended.

### 6-4 responsive and accessibility acceptance

- The canonical `shell.html` now offers a keyboard skip link, a labeled navigation landmark, a focusable labeled main landmark, responsive grids that cannot enforce a width larger than their container, 44px phone touch targets, mobile input sizing, safe horizontal scrolling and a very-narrow-width layout. Both system color schemes remain supported. The light primary-button gold is darkened so white text clears the 4.5:1 normal-text contrast threshold.
- Route changes move keyboard focus into main; only horizontally overflowing `.scroll` regions are given a keyboard tab stop and an accessible region label. Resize reverses or restores these tab stops as overflow changes. Overlays reuse the same enhancement on open and refresh.
- The roster no longer binds click/Enter to entire table rows (which also contain interactive selects); a dedicated native player button advertises its expanded state, restores focus after rendering and respects reduced-motion when scrolling details. Interactive draft champions expose a name/role label and pressed state, updated when selecting without a full rerender; mobile info controls reference their content and draft turn announcements expose a status region.
- `scripts/ui-mobile-a11y-acceptance.mjs` verifies the source responsive contracts, both theme button contrast ratios, native navigation controls, real router focus/scroll-region behavior at narrow widths and resize, actual roster button actions, draft grid output and ARIA updates, and reduced-motion protection. It is required by `npm run check` alongside the 6-1/6-2/6-3 acceptances, snapshot validators, engine regression, smoke and two-season career coverage. `npm run perf` and `npm run build` remain separate CI gates.
- These automated checks validate specified keyboard/markup/CSS properties. They do not assert exhaustive WCAG conformity or certify every device/browser layout; manual device + assistive-technology testing remains valuable for further improvements.
- **Release gate:** CI on the branch, merge, CI on `main` and generated `index.html` synchronization must pass before 11.5/6-4 (and thus phase 11.5) is reported complete. Do not edit `index.html` directly. Engine behavior, world schema v15, save format 2 and historical migration rules are preserved.
