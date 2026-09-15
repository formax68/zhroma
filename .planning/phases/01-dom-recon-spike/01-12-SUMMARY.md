---
phase: 01-dom-recon-spike
plan: 12
status: complete
subsystem: testing
tags: [corpus, provenance, parity]
requires:
  - phase: 01-11
    provides: Shared grammar and idempotent sanitizer
provides: [Re-admitted three-fixture corpus, Honest source declaration, Per-entry byte parity tests]
affects: [01-13, 01-14, 01-15]
tech-stack:
  added: []
  patterns: [Verify second-pass parity before corpus admission]
key-files:
  created: [test/recon/corpus-provenance.test.js, .planning/phases/01-dom-recon-spike/01-12-DECISION.md]
  modified: [test/fixtures/manifest.json, test/fixtures/zendesk-view-priority-present.html, test/fixtures/zendesk-view-priority-absent.html, test/fixtures/zendesk-view-grouped-long.html]
requirements-completed: [RECON-01, RECON-02, RECON-03]
coverage:
  - id: D1
    description: Every corpus entry satisfies the shared grammar and re-sanitizes to exact bytes and checksum.
    verification:
      - kind: integration
        ref: test/recon/corpus-provenance.test.js
        status: pass
    human_judgment: false
  - id: D2
    description: Re-admission source and provenance wording reflect the approved limitation.
    verification: []
    human_judgment: true
    rationale: User answered yes on both source and wording questions; no fresh live capture was performed.
duration: 4 min
completed: 2026-09-05
---

# Phase 01 Plan 12: Corpus Re-admission

**Three existing sanitized fixtures now satisfy the current grammar and exact second-pass parity, with provenance explicitly identifying repository-byte re-admission.**

## Task Commits

1. Source and provenance approval: `248072a` — verbatim answer `yes on both`.
2. Re-admitted fixtures and manifest: `ab6d084`.
3. Parity regression suite: `80ec658`, corrected and verified in `ab6d084`.

## Accomplishments and Verification

- Removed 20 invalid ARIA enum stand-ins; restored the recorded Priority header at index 6 in the two presence fixtures; accepted only the approved 62/170 deterministic text renumberings. A second sanitizer pass was byte-identical for all three candidates before writing repository outputs.
- Manifest changes are confined to `sha256`, `sanitizationMethod`, and `priorityHeaderIndex`. An exact object comparison verified all other fields remained unchanged.
- The 11-test provenance suite covers every manifest entry's grammar, source declaration, bytes, checksum, and Priority presence/absence. A mutated text stand-in fails parity/hash checks; a fourth duplicate entry fails scenario coverage.
- Full suite: **42 Node + 83 Vitest = 125 passed**, zero failures. Final CLI retains `FINAL VERDICT: proceed`; this is still the plan-level gate, not independent phase acceptance. `git diff --check` passes.
- Replaying the corrected harness against the original corpus yields **10 failed / 1 passed**, proving the regressions. Original bytes and hashes remain verified in Git at `f391241`.

## Deviations and Issues

- The user explicitly approved placeholder renumbering after the preview found the plan's first-pass equality requirement impossible. The approved decision requires second-pass equality instead and corrects the false claim that tracked original bytes would be irreversibly destroyed.
- Initial Vitest collection failed because its asset handling rewrote the relative `new URL` fixture reference. Replaced this with the repository-root path convention already used by the suite. Only after this harness correction was the original-corpus RED replay counted as behavioral evidence.

## Next Phase Readiness

Plan 01-13 can enforce the shared grammar in corpus admission. Phase 1 and its requirements remain pending independent verification; historical package approval independence remains not-attested.

## Self-Check: PASSED

All deliverables and task commits exist, the 125-test suite passes, and no dependency changed.
