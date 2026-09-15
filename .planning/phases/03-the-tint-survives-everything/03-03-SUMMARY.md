---
phase: 03-the-tint-survives-everything
plan: "03"
subsystem: performance
tags: [chrome, cdp, synthetic-workload, evidence]
requires:
  - phase: 03-02
    provides: Filtered persistent controller with lifecycle handling
provides:
  - Isolated loopback Chrome harness with current unmodified runtime bytes
  - All 3600 synthetic timing samples and six complete matrices
  - Separate thirty-switch post-GC profiles with explicit attribution limits
affects: [03-04]
tech-stack:
  added: []
  patterns: [complete callback CPU sums, source-safe evidence merge, isolated temporary profile]
key-files:
  created: [scripts/run-tint-workload.js, test/performance/tint-workload.html, test/performance/tint-workload.js, test/extension/performance-harness.test.js, .planning/phases/03-the-tint-survives-everything/03-PERFORMANCE.md, .planning/phases/03-the-tint-survives-everything/03-PERFORMANCE-SAMPLES.json]
  modified: []
requirements-completed: [LIVE-05, LIVE-03, LIVE-04, FAIL-04]
duration: 12min
completed: 2026-09-09
status: complete
verification_status: human_needed
metrics:
  tasks: 2
  extension_tests: 193
  enabled_samples: 1800
  disabled_samples: 1800
---

# Phase 03 Plan 03 Summary

Complete callback CPU meets the fixed synthetic workload budgets; layout/retainer attribution and authentic live evidence remain open.

## Task Commits

| Task | Commits |
|---|---|
| 1: Local browser driver and measurement contract | 50e02ce RED; 92bce6a implementation |
| 2: Fixed protocol and evidence | ecf8632 |

## Outcomes

- Chrome 152.0.7977.83, Apple M5 Max, darwin 27.0.0 arm64, CPU throttle 1, headless isolated temporary profiles. Built-in Node WebSocket, HTTP and child-process tooling; no dependency or browser installation.
- Every operation/size has ten warmups and 100 retained samples, six operations across 30/200/1000 rows in enabled and disabled modes. Total 3600 measured samples; source identity and all callback segments retained.
- Largest typical 30-row median 1.300 ms; enabled global maximum 15.400 ms. Fixed under-2/under-16 ms timing gates passed. No production optimization or source change was needed.
- Runtime content SHA-256: 85aa975028d5c2653167a5c13a7d9e6031891b43ba0cf03a7ac6285dce5c2ac1. Manifest/CSS hashes match prior accepted assets; full identity in performance artifacts.
- Separate enabled/disabled thirty-switch post-GC snapshots both show 45 row nodes before/after and 2 detached rows before/after. Both traces contain 7 Layout events; enabled has 57 callback markers. These aggregates do not establish extension attribution. Layout and retention remain human_needed, not zero-attributed passes.

## Verification

Chrome smoke passed with a nonzero callback count and declared CSS paint. All six timing commands passed; both profile commands executed with truthful human_needed results. Measurement unit suite: 8 passed; extension suite: 193 passed; recon final gate: proceed. All measured samples retained with no excluded slow observations. The source-safe merge refuses mixed identities or overwriting a prior run.

## Deviations and limitations

The initial sandbox denied loopback listening; the authorized isolated Chrome harness ran successfully after local execution escalation. Profile interpretation remains inconclusive at automatic stack/aggregate-count depth; plan explicitly allows human_needed for missing attribution. Report includes manual DevTools reproduction and does not claim the full synthetic performance gate closed. Raw synthetic traces/snapshots were not retained. Actual live timing, forced layout, thirty-switch memory and visuals are entirely pending. E15 remains unclassified; the finite workload cannot establish all-device responsiveness. Task execution is complete, but these verification dimensions are not accepted. Requirement metadata indicates implementing coverage only.

## Self-Check: PASSED

All six produced files exist, RED/implementation/evidence commits are present, 3600 samples are recorded, all timing commands and runtime tests passed, and both profile statuses are explicitly preserved as human_needed.
