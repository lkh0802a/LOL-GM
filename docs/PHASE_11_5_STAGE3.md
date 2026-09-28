# LOL GM 11.5 / Stage 3: State and transaction unification

## Stage 3-1: roster transaction gateway

Scope: first/team-reserve roster planning and squad movement only. State changes are committed through `validateWorldAction(db, command)`, `previewWorldAction(db, command)` and `applyWorldAction(db, preview)` in `state-transaction.js`.

- Action `roster.plan` uses a copied, canonical set of player-to-team assignments.
- Both the human squad editor and AI reserve-roster manager use the same action and validation path; managed-club authority prevents AI from auto-committing its roster.
- Validation and preview do not write to the world, and an invalid plan leaves membership unchanged.
- The preview lists changed memberships, first/reserve counts and integrated total, and snapshots the source roster memberships, save identity, and world date/year.
- Application rejects expired previews before committing and revalidates under the latest world. Replaying a committed preview is rejected.
- Low-level roster helpers remain for bootstrap, world regeneration and contract completion. The gateway currently covers **owned-reserve squad reassignment**, not every mutation.
- No persistent transaction objects or new save fields are introduced.

## Stage 3-2: player-contract and transfer commands

The same command gateway now handles four additional operations:

- `player.sign`: FA/initial signings, renewals, and an accepted transfer fee plus player contract in one validated commit. AI free-agent and initial-roster markets and human negotiations share this path.
- `player.transfer`: club-to-club permanent transfer without renegotiating the existing contract, used by the AI trade market.
- `player.release`: manager-requested release, first-season release, offseason roster maintenance and expired-contract cleanup; fee/event semantics remain mode-specific.
- `player.option`: manager team-option action and AI/player-side option exercising.

Player actions snapshot source/destination membership and finances, contract, move history, world year and date; read-only preview prevents accidental write, while applying a stale preview or committing after a conflicting state change is rejected. The gateway preserves the existing low-level contract, transfer and roster writers and the same salary/contract, foreign-player and two-contracted-moves rules. Engine-enforced emergency roster maintenance uses the distinct `system` actor so the existing minimum-player safeguards remain operative. No save schema or stored command log is introduced.

**Scope:** contracted player decisions and initial roster market, not retirement processing, region/club restructure or every direct world-bootstrap assignment. Validation guards known failure cases before applying domain writes; transaction rollback and save migration are handled in 3-3/3-4.

## Stage 3-3: versioned persistence restoration

The world/schema version remains **15** and the browser's current namespace remains unchanged. Storage encoding now has an independent `saveFormat:2` marker. Existing same-schema format-1 saves, compressed and uncompressed, are accepted and normalized by `save-migration.js` before entering the simulation. A missing encoding marker is format 1.

- Normalize historical packed player attributes, tendencies and champion practice pools; staff roster/facilities, local eligibility and contracted-move history; legacy packed meta rows; and missing safe recruitment/negotiation containers.
- Preserve mid-series draft progress, active negotiations, cash, contracts, career events and world/competition scheduling.
- Exclude known transient root caches, legacy staff pools and patch baseline snapshots from exports without mutating the active game state. Roster integrity validation no longer has hidden meta-history migration side effects.
- Reject structurally corrupt or unsupported world/encoding formats explicitly instead of resetting and overwriting the stored world. New slots with no stored records still initialize normally.
- Keep older browser storage namespaces untouched; **world versions 14 and older are not automatically upgraded** because a rule/schema compatibility migration is not yet verified. Version 15 saves from before the encoding marker remain loadable.
- Capture the save-slot destination key with each deferred write; failed slot switches restore the previous slot and DB and leave the invalid target slot untouched.

Acceptance: regression cases 06g–06i test compact and uncompressed legacy v15 restores, retained match/negotiation state, cache stripping, unsupported-version rejection, nonmutating pack and pure integrity checks. CI must pass check/regression/smoke, performance, build and generated standalone verification.

## Stage 3-4: atomic commit and integrated acceptance

`state-rollback.js` adds an operation-scoped undo journal for the shared transaction gateway. After revalidating the preview, a command snapshots its affected player records, team rosters, squad depth charts, team finance records, news and derived market-demand cache references before the domain writer runs. If the writer throws, reports failure, or leaves duplicate/mismatched player registrations, the scope is restored and `apply_failed` is returned. Player/roster object references remain stable for existing callers. Validation and preview continue to be read-only. The `roster.plan` snapshot additionally includes `saveId` to reject previews from another world.

Integration regression cases 06j–06m deliberately inject errors *after* contract/fee settlement, squad changes, releases, and option exercise; verify full world serialization is unchanged after rollback and the same proposal can be applied successfully afterward. They also verify manager/AI-delegation parity, post-write duplicate-registration rejection, cross-save stale previews, replay rejection, roster integrity, and save/load of a committed contract. Existing 01–11, 06b–06i tests protect the rest of the simulation and version-15 save compatibility.

**Scope:** transactional guarantee applies to command gateway actions (`roster.plan`, `player.sign`, `player.transfer`, `player.release`, `player.option`). World bootstrap, retirements, league restructures, and other engine-only world mutations still use their established domain paths. This is not an all-world undo system. World schema stays 15, encoding stays 2, and no preview or transaction log is serialized.

**Acceptance gate:** full syntax/structure and source-system validation, the 11.5 regression suite, smoke suite (including season and transfer market), performance probe, production build, production artifact verification, successful PR CI, successful main CI and generated `index.html` auto-sync. No stage 11.5 step 4/5/6 work is included.

## Stage 3-1 acceptance

Regression suite exercises invalid preview, read-only validation/preview, actor authority, stale world-date rejection, successful first/reserve swap, rejected replay and ownership integrity. Standard smoke/perf/build CI is required before marking the substage complete. Stage 3 completion is gated on the integrated acceptance suite and a green main build.

Stage 3-2 acceptance: regression tests cover read-only signing previews, invalid financial conditions, stale contracts, renewal, AI and manager transfers with move limits, release costs and team options. Syntax/structure, regression, smoke, performance, production build and GitHub CI are required.
