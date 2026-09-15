---
phase: 03-the-tint-survives-everything
plan: "01"
subsystem: extension
tags: [mutation-observer, reconciliation, historical-evidence]
requires:
  - phase: 02-first-tint-on-a-real-view
    provides: Exact-English table inspector and accepted CSS
provides:
  - Persistent discovery with fresh whole-table reconciliation and owned-marker cleanup
  - Immutable historical Phase 2 evidence validation
  - Actual-source transition and failure regressions
affects: [03-02, 03-03, 03-04]
tech-stack:
  added: []
  patterns: [synchronous validation, bounded cleanup retry]
key-files:
  created: [test/extension/persistent-tint.test.js]
  modified: [extension/content.js, test/extension/initial-tint.test.js, test/extension/live-acceptance.test.js, test/extension/runtime-contract.test.js]
key-decisions:
  - One immediate removal retry handles transient native failures without retaining failed rows.
  - Historical acceptance reads pinned Git assets and never substitutes current runtime bytes.
requirements-completed: [DETECT-03, DETECT-04, LIVE-01, LIVE-02, LIVE-03, LIVE-04, FAIL-04]
duration: 7min
completed: 2026-09-09
status: complete
metrics:
  tasks: 2
  extension_tests: 172
---

# Phase 03 Plan 01 Summary

Persistent view discovery replaces the one-shot startup deadline; every update validates current table ownership before applying exact-English priority markers.

## Accomplishments

- Late entry after 16000 ms, removal/reinsertion, retained priority/header edits, sorting, Next/Previous, body/table refresh, grouped/empty/single-row cases and unsafe-to-safe recovery run against manifest-declared source.
- Blank values clear their own markers; unsafe tables clear all owned tint. Writes are idempotent and failures clear attempted rows independently.
- Phase 2 historical hashes, settings and palette are independently bound to commit 6fc6161ceff56f6830e23072273676929fecd8e9. Historical acceptance is unchanged.

## Task Commits

| Task | RED | Implementation |
|---|---|---|
| 1: Late-entry tracer and immutable history | b562859 | e421fb7 |
| 2: Transition families and cleanup faults | 613f835 | f39f36a |

## Verification

- Extension suite: 172 tests passed across four files, no skipped tests.
- Final recon gate: FINAL VERDICT: proceed.
- Late-entry tracer failed in both controlled/native observer paths before implementation.
- One-time removal-fault regression failed before bounded retry and passed afterward.

## Decisions and deviations

No scope change. A single bounded removal retry implements the transient-fault obligation; permanent removal failures are released from ownership to prevent reference retention. The workflow automatically degraded isolation because origin/HEAD is unresolved; work executed sequentially on configured main. Existing unrelated dirty planning files were not staged.

## Remaining boundaries

E02–E13 have named actual-source tests. E01 DETECT-03 classification and E14 LIVE-04 classification remain unresolved probe judgments; observed live scrolling retains mounted rows, while insertion/recycling here is synthetic. E16 remains a platform limitation: permanently failing native removal may leave one unremovable marker, explicitly counted by the regression. The descriptor-less prohibition remains flagged-unverified judgment pending independent review. Requirement metadata records implementing coverage, not full phase/live acceptance. CPU, real memory, live visuals, independent code/security and goal verification remain subsequent gates.

Private symbols: startPersistentTint, scheduleReconcile, reconcileCurrentTable, clearOwnedMarkers, ownedRows; inspectCandidateTable and commitSnapshot retained/refined. No exports, dependencies, permissions or palette changes.

## Self-Check: PASSED

All five scoped files exist; all four task commits are present; both planned verification commands passed in this run.
