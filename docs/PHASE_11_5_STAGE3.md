# LOL GM 11.5 / Stage 3: State and transaction unification

## Stage 3-1: roster transaction gateway

Scope: first/team-reserve roster planning and squad movement only. State changes are committed through `validateWorldAction(db, command)`, `previewWorldAction(db, command)` and `applyWorldAction(db, preview)` in `state-transaction.js`.

- Action `roster.plan` uses a copied, canonical set of player-to-team assignments.
- Both the human squad editor and AI reserve-roster manager use the same action and validation path; managed-club authority prevents AI from auto-committing its roster.
- Validation and preview do not write to the world, and an invalid plan leaves membership unchanged.
- The preview lists changed memberships, first/reserve counts and integrated total, and snapshots the source roster memberships plus world date/year.
- Application rejects expired previews before committing and revalidates under the latest world. Replaying a committed preview is rejected.
- Low-level roster helpers remain for bootstrap, world regeneration and contract completion. The gateway currently covers **owned-reserve squad reassignment**, not every mutation.
- No persistent transaction objects or new save fields are introduced.

## Remaining stage 3 work

- 3-2: contract signing, renewal, releases and transfers, and more manager/AI sporting decisions through the same command gateway. Convert direct-mutation code where covered and preserve existing rules.
- 3-3: versioned save migration / load-time normalization; ensure old saves continue to work without serializing transient previews or stale caches.
- 3-4: complete regression matrix (invalid requests, no partial writes, human/AI parity, resumable saves), CI verification and final stage-3 acceptance.

## Stage 3-1 acceptance

Regression suite exercises invalid preview, read-only validation/preview, actor authority, stale world-date rejection, successful first/reserve swap, rejected replay and ownership integrity. Standard smoke/perf/build CI is required before marking the substage complete. **Stage 3 as a whole is not yet complete.**
