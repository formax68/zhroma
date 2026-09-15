---
phase: 03-the-tint-survives-everything
plan: "02"
subsystem: extension
tags: [lifecycle, mutation-filter, resource-bounds]
requires:
  - phase: 03-01
    provides: Persistent current-table reconciliation
provides:
  - Interpretation-derived mutation filtering and self-marker suppression
  - Idempotent visibility/pagehide/pageshow pause and resume
  - Thirty-switch native/privacy and strong-reference regressions
affects: [03-03, 03-04]
tech-stack:
  added: []
  patterns: [non-resetting coalescing, fixed lifecycle listeners, weak expected-value tracking]
key-files:
  created: []
  modified: [extension/content.js, test/extension/persistent-tint.test.js, test/extension/runtime-contract.test.js, test/extension/initial-tint.test.js]
requirements-completed: [LIVE-01, LIVE-02, LIVE-03, LIVE-04, LIVE-05, FAIL-04]
duration: 4min
completed: 2026-09-09
status: complete
metrics:
  tasks: 2
  extension_tests: 185
  combined_tests: 358
---

# Phase 03 Plan 02 Summary

One event-driven controller revalidates exact current priorities after tab/document return while ignoring unrelated page churn.

## Task Commits

| Task | RED | Implementation |
|---|---|---|
| 1: Mutation filtering and stripped-marker recovery | f9bcbb8 | e14686d |
| 2: Lifecycle and thirty-switch resource bounds | 23d0e6d | See feat(03-02) pause/resume commit immediately preceding this summary |

## Accomplishments and settings

- mutationsAffectInterpretation covers language, identifiers, ancestor roles, spans, candidate-universe changes and retained character data. Self markers use expectedMarkers WeakMap; external stripping recovers and mixed batches retain external changes.
- One zero-delay non-resetting timer; zero idle timers, zero unrelated full-table scans. Native observer tests prove attribute recovery and self-write quiescence.
- pauseController cancels pending work, disconnects observation and clears ownership/candidate. resumeController uses one observer and fresh current DOM. Exactly two window listeners and one document listener remain fixed across thirty transitions.
- Instrumented Set tests expose no strong detached-row ownership at rest; every owned row is connected and current, and pause/non-view has zero owned rows. These are synthetic resource counts, not browser heap proof.
- Fail-on-call privacy/dynamic-code sentinels remain silent across thirty non-view/return cycles for each supported/unsupported test mode. Native DOM, focus and click handlers are preserved.

## Verification

185 extension tests passed. Combined recon command: 65 Node tests plus 293 Vitest tests passed, zero failures/skips. Attribute/lifecycle regressions demonstrably failed before implementation. Manifest and stylesheet unchanged.

## Deviations

Two existing initial-tint test assumptions needed updating for the exact observer attributes and a realistic table-targeted recovery mutation; runtime-contract blank-cell records now use actual childList semantics rather than a null text-node target. No product scope change or new dependencies.

## Remaining gates

Offline bounds do not establish Chrome CPU, garbage collection, layout attribution, authentic live responsiveness or final acceptance. Descriptor-less prohibition remains flagged-unverified judgment for independent review. Requirement metadata records implementation coverage only.

## Self-Check: PASSED

All scoped files and RED/implementation commits exist. Both plan verification commands passed in this run.
