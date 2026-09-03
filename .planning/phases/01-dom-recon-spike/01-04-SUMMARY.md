---
phase: 01-dom-recon-spike
plan: 04
subsystem: dom-recon
tags: [zendesk, dom, selectors, shadow-dom, privacy, evidence]
status: complete
requires:
  - 01-03
provides:
  - Sanitized three-scenario live DOM evidence for the current English Agent Workspace
  - Ranked Garden and test-id selector candidates with table, row, group, header, and paint topology
  - Completed user-controlled sort/refresh seam with marker-survival result
affects:
  - 01-05
tech-stack:
  added: []
  patterns:
    - Paired Garden/test-id selectors with structural fallback
    - Selected-node root-chain and top-document reachability proof
    - Ephemeral page-local marker with human-controlled authenticated actions
key-files:
  created:
    - .planning/phases/01-dom-recon-spike/01-04-SUMMARY.md
  modified:
    - SELECTORS.md
    - test/recon/recon-gate.smoke.js
key-decisions:
  - The observed ticket list is top-document DOM with a direct Document root chain and no ShadowRoot boundary.
  - Ticket rows require paired tables.row/generic-table-row identifiers so one-cell group rows are excluded.
  - Priority has no observed locale-independent value signal; the v1 fallback is exact English header and value text with an explicit unreadable state.
  - Normal row and cell backgrounds are transparent over the opaque pane; future tinting should target direct cells of positively identified ticket rows.
  - Page-local markers are ephemeral across the user-controlled sort-plus-refresh sequence and must be re-derived idempotently.
  - The verdict remains block until Plan 05 admits sanitized fixtures and resolves the remaining interaction evidence.
metrics:
  duration: 60m
  completed: 2026-09-03
actuals:
  tokens: 12290
  tasks: 2
  commits: 3
---

# Phase 1 Plan 4: Authenticated DOM Recon and Interaction Handoff Summary

Sanitized live inspection established the current English Zendesk table topology, ruled out a Shadow DOM boundary in all three scenarios, and proved that the inert row marker does not survive the user-controlled sort-plus-refresh sequence.

## Performance

- **Duration:** 60 minutes, including the blocking-human interaction interval
- **Started:** 2026-09-03T10:47:38Z
- **Completed:** 2026-09-03T11:47:43Z
- **Tasks:** 2
- **Files modified:** 2 implementation/evidence files

## Accomplishments

- Recorded non-identifying evidence for Priority-present grouped/long, Priority-present ungrouped, and Priority-absent grouped/short views.
- Confirmed every selected ticket row is reachable from the top document, belongs to the current document, remains contained by it, and has the complete root chain `Document` with no ShadowRoot host.
- Identified the ticket table's own header, exact Garden/test identifier pairs, Priority representation, genuine Priority absence, ticket-versus-group row discriminator, sticky header-cell ownership, and non-virtualized 30-row page behavior.
- Established that the pane supplies the opaque normal background while ticket rows and direct cells remain transparent.
- Staged one inert marker, paused for the user's authenticated sort and refresh, then observed marker count zero with the valid table structure restored.
- Updated the repository smoke contract so resolved live entries are terminal while the remaining interaction-specific question stays explicitly unresolved.

## Task Commits

1. **Task 1: Resolve static DOM questions and stage the interaction probe** — `dcc715d`
2. **Task 2: Perform the authenticated sort and refresh actions** — `cc48ae5`

## Files Created/Modified

- `SELECTORS.md` — Sanitized structural ledger, marker baseline, user-action confirmation, and post-refresh result.
- `test/recon/recon-gate.smoke.js` — Contract assertions for admitted static evidence and the remaining open interaction question.
- `.planning/phases/01-dom-recon-spike/01-04-SUMMARY.md` — Execution record and Plan 05 handoff.

## Decisions Made

- Current-shell selectors rank stable `data-garden-id` values first, paired `data-test-id` values second, and a matrix-proven structural predicate last.
- A missing Priority header is reported only after the proven ticket table and header collection succeed; selector failure cannot masquerade as column absence.
- Exact English Priority labels are an explicitly English-only fallback because no locale-independent cell signal was observed.
- Direct ticket cells are the conservative tint seam; group rows and sticky header cells must remain outside that selector.
- The refreshed DOM is authoritative after authenticated actions. Stored row objects and inert attributes are treated as ephemeral.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated the stale pre-recon smoke expectation**

- **Found during:** Task 2 full test run
- **Issue:** A prior smoke test required all live observations to remain unresolved, contradicting Plan 01-04's admission of terminal live evidence.
- **Fix:** Changed the test to require terminal static entries, terminal marker-survival evidence, and only the pending interaction-specific item as unresolved.
- **Files modified:** `test/recon/recon-gate.smoke.js`
- **Commit:** `cc48ae5`

### Safety Deviation

**2. Abandoned unsafe native injection after an unintended read-only navigation**

- **Found during:** Task 1 browser reconnaissance
- **Issue:** A local native-keyboard probe briefly navigated into a ticket instead of executing the intended reversible page-local style probe.
- **Recovery:** Browser Back immediately restored the originating view. No ticket, view, or account mutation occurred, and no identifying content was persisted.
- **Adjustment:** Native injection was abandoned. Textual computed-style evidence established the complete paint stack without retaining a screenshot; the user staged the inert marker through the explicit human seam.
- **Files modified:** `SELECTORS.md`
- **Commit:** `dcc715d`

## Authentication Gates

The authenticated English Agent Workspace session was already open and satisfied the Task 1 precondition. The user alone performed the requested sort and refresh and confirmed that no operational view, ticket, or account configuration changed.

## Verification

- `node scripts/verify-recon-gate.js final SELECTORS.md` — passed with 17 entries and verdict `block`.
- Plan handoff verification — emitted exactly `INTERACTION HANDOFF READY`.
- `npm test` — 17 Node smoke tests and 29 Vitest tests passed.
- Privacy grep found no persisted tenant hostname, ticket URL/id pattern, email-like account text, or raw HTTPS URL in `SELECTORS.md`.

## Known Stubs

None.

## Deferred Issues

- `interaction-and-sticky-states` remains visibly unresolved for hover/selection paint. Sticky ownership itself is terminal; Plan 05 retains the final admission and D-16 verdict gate.
- No fixture, manifest, screenshot, or proceed verdict was created by this plan.

## Tracking Safety

- `.planning/ROADMAP.md` was updated to 4/5 Phase 1 plans complete.
- Pre-existing user/orchestrator changes were already present in `.planning/STATE.md`, `.planning/state.json`, `.planning/REQUIREMENTS.md`, and `.planning/config.json`; this plan did not overwrite or stage them. The orchestrator can reconcile state/session tracking after those changes are resolved.

## Next Phase Readiness

Plan 05 can consume the ranked selectors and sanitized interaction result to build/admit the three fixtures. It must keep the final verdict blocked unless the remaining interaction evidence and fixture-wide checks pass.

## Self-Check: PASSED

- `SELECTORS.md` exists and contains the authenticated interaction handoff.
- `test/recon/recon-gate.smoke.js` exists and the full suite passes.
- Task commits `dcc715d` and `cc48ae5` are present in repository history.
