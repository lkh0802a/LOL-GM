# LOL GM

Mobile-first esports management simulation, playable as offline standalone HTML.
Desktop/mobile HTML comes first; Android packaging follows later.

## Current work

Continue the complete game scope in the unified numeric development plan, then verified
product/UI/engine refinements. Current priorities and delivery evidence live in
[DEVELOPMENT](docs/DEVELOPMENT.md); the complete design is [LOL_GM_SPEC](docs/LOL_GM_SPEC.md).
Historical scoped acceptance is not whole-game completion. No current global
completion percentage is claimed.

Use [document navigation](docs/README.md) for confirmed rules, code ownership,
data provenance and historical evidence. Latest explicit user instructions take
precedence over dated phase/handoff records. One implementation worker owns each
coherent slice; preserve direct management and the confirmed fictional leagues.

## Run and build

Node.js 20+; dependency-free browser application.

```sh
npm run dev
npm run build
```

Open the address printed by the development server. Canonical code is under
`src/artifact/`; `scripts/artifact-modules.mjs` defines ordered module ownership.
`scripts/build.mjs` generates root `index.html` and `dist/index.html`; do not edit
generated HTML manually. Use the [focused checks](docs/DEVELOPMENT.md#focused-development-map)
for the changed domain; `npm run check` is the full serial local fallback.
All PRs and main pushes receive required complete Actions validation.

## Data and simulation

Champion/item/rune static mechanics are patch-pinned Riot source data; reviewed
supplements and derived simulation fields retain explicit provenance. Draft/match
calibration uses **organized competition records only**, never solo-queue/ranked
statistics. See [source policy](docs/CHAMPION_DATA.md#competition-only-calibration).
Professional source acquisition and validation are not yet complete. The engine
is an aggregate simulation; it does not claim exact spell casts or geometry.

## Saves and delivery

Active world schema v15, compact save format 2, storage namespace `lol-gm-v15`,
three save slots. Supported older v15 encodings normalize on load; arbitrary old
schemas and unknown forward formats are not guaranteed compatible. Save files,
source history and failures are preserved. No runtime external API is required
for offline play.

Read [Android delivery](docs/ANDROID_TARGET.md) for later packaging. Long
100-season, device and TalkBack final QA follow implementation and user playtest
feedback/fixes; focused acceptance is not that final QA.
