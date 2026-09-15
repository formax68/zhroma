---
phase: 01-dom-recon-spike
plan: 14
status: complete
subsystem: testing
tags: [evidence, privacy, final-gate]
requires:
  - phase: 01-13
    provides: Hardened corpus admission
provides: [Shared production interaction grammar, Per-ID evidence contracts, Deterministic blocker ordering, Adversarial gate regression group]
affects: [01-15]
tech-stack:
  added: []
  patterns: [Closed evidence contracts, Single production assessor]
key-files:
  created: [scripts/interaction-evidence.js]
  modified: [scripts/verify-recon-gate.js, test/recon/interaction-evidence.smoke.js, test/recon/recon-gate.smoke.js]
requirements-completed: [RECON-01, RECON-02, RECON-03]
coverage:
  - id: D1
    description: Final mode rejects paint grammar bypasses and required evidence relabeling.
    verification:
      - kind: integration
        ref: test/recon/recon-gate.smoke.js
        status: pass
    human_judgment: false
  - id: D2
    description: One production assessor validates interaction paint with coded value-free rejections.
    verification:
      - kind: unit
        ref: test/recon/interaction-evidence.smoke.js
        status: pass
    human_judgment: false
completed: 2026-09-07
---

# Phase 01 Plan 14: Final Evidence Contracts

**Final mode now uses the production paint/privacy assessor and binds all fifteen required live evidence IDs to their recorded scope, terminal status, and exact scenario set.**

## Task Commits

1. Shared interaction grammar: RED `f47a5e9`, GREEN `fbe631a`.
2. Per-ID evidence and stable blockers: RED `955dba8`, GREEN `2b5a5c8`.
3. Named audit regression group: `52654bb`.

## Verification

- Both paint bypass regressions failed before production integration. Four contract/ordering tests failed before the contract implementation; the existing empty-input behavior already passed.
- Full suite: **50 Node + 107 Vitest = 157 passed**, zero failures or skips; **two explicit todos** owned by Plan 01-15 (CR-08 and CR-10).
- Evidence CLI: `EVIDENCE READY: 18 terminal entries`. Final CLI currently returns `FINAL VERDICT: proceed`; remaining fallback and assumptions-table bypasses still require Plan 01-15, so this is not phase acceptance.
- Exactly one `function assessInteractionEvidence` definition exists, under scripts. Its eight original smoke cases and a canonicalization regression pass.
- All fifteen contracts match the recorded scope, status, and scenarios; header topology, scrolling/recycling, and inert attribute survival retain their valid disproved findings.
- Swapping ledger sections preserves the ordered blocker array. Private-path diagnostics stay value-free unless explicit debug is exactly 1. `git diff --check` passes.

## Deviations and Issues

- Whitespace canonicalization also removes spacing around punctuation after validating the original closed grammar. The direct canonicalization test initially inserted spaces at structural delimiters, correctly triggering grammar rejection; adjusted it to valid color-argument whitespace before counting its passing distinctness assertion.
- Required-ID scenario mutations now yield the dedicated contract blocker; the pre-existing fabricated-scenario expectation was updated accordingly. Localization exemptions remain scope-gated for non-required entries.
- Contract arrays and error blocker arrays are frozen; duplicate scenario items are rejected.

## Next Readiness

Plan 01-15's contract decision is pending. Requirement identifiers above provide traceability only: Phase 1 remains gaps_found, Phase 2 remains closed, and historical dependency approval independence is not-attested.

## Self-Check: PASSED

All owned deliverables and task commits exist; active regressions pass and remaining bypasses are explicitly tracked. No dependencies changed.
