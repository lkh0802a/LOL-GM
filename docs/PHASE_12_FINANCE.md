# Phase 12 — Facilities and finance

Phase 12 is an incremental completion pass on Item 7's existing functional training, analysis, recovery and youth infrastructure and the regional economic engine. The underlying world engine and domestic/international competition policies are retained.

## Scope and ownership

- `development.js`: board-funded infrastructure now has a construction schedule (18 + 12 × current tier days). The board deducts investment cash immediately, but the facility's development/analysis/recovery benefit and upkeep tier do **not** increase until a world game day reaches the delivery date. Projects reject duplicate site construction and attempts without sufficient cash. They persist as optional `team.facilityProjects` data; legacy `upgradeFacility(db,team,key)` still offers the synchronous domain command used by existing Item-7 regression probes, while seasonal board automation explicitly selects deferred construction.
- `season.js`: completed construction activates once on the next processed world date. The UI's office/staff panel displays facility tiers, upkeep and outstanding completion dates. This preserves the existing club-board investment policy and avoids forcing the manager to click repetitive infrastructure upgrades.
- `finance.js`: `team.finance.prepaid` captures already-settled facility capex, signing bonuses, transfer fees paid/received and staff severance. The annual P&L now displays these categories, but its cash posting subtracts/reverses already-settled items to prevent double-charging. The pending ledger clears at close and reappears on saves as needed. Historic saves without this optional field are accepted.
- `financeForecast(db,team)`: a conservative, itemized expected income/expense/net/cash outlook from current league interest, fanbase, owner, valid sponsor, known current-season wins, payroll, facility/staff/operations upkeep, spending tax and committed transactions. Uncertain prizes, future victories, uncommitted deals, contingent bonuses and tax redistribution are excluded. A *forecast* is not an official season financial statement and may differ from the final result.
- `ui-manager.js` and `ui-season.js`: on the history tab, players can compare a club forecast to the exact previous season's confirmed revenue, expense and net, plus the SFR top-five cap amount/percentage where applicable. The regional club cash table remains.
- `offseason.js`: the shared infrastructure investment heuristic now requires *both* current liquidity and positive estimated year-end cash above the philosophy-specific reserve; the algorithm is the same for player-controlled and AI boards and respects different regional pay scales.

## Invariants and acceptance

- World save schema **v15**, compact format **2**, historical save migrators and previous league rules remain unchanged.
- No existing match, draft, patch or signing choices are delegated differently.
- `scripts/finance-acceptance.mjs` validates construction lead time, no early buffs, duplicate/insufficient-fund protection, old/new save round-trip, ledger integrity, prepaid-once closeout reconciliation, forecast, UI visibility and board reserve guard.
- `npm run check` also runs the previously established 01–11m regressions, world smoke and two-season career acceptance. `npm run perf` and `npm run build` remain mandatory gates, with post-merge CI and generated standalone parity verified separately.

## Known boundaries

Existing instant `upgradeFacility(db,t,key)` remains supported for old engine callers/test fixtures; the automated board path uses timed delivery. A construction's clock is checked at scheduled world-day progression, so if no day advances, the project is shown as pending even past a calendar date. The forecast is deliberately bounded rather than projecting hypothetical tournament winnings or deals. Full long-horizon 100-season economy tuning remains under the separate long-run QA stage; this phase does not claim that simulation as completed.
