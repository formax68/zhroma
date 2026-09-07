---
phase: 01-dom-recon-spike
plan: 15
status: complete
subsystem: testing
tags: [verdict, structured-proof, assumptions]
requires:
  - phase: 01-14
    provides: Evidence contracts and deterministic blocker ordering
provides: [Structured fallback and DOM predicates, Parsed assumption rows with bound proof references, Consistent recorded verdict]
affects: [phase-verification]
tech-stack:
  added: []
  patterns: [Closed enum authorization, Exact assumption coverage and proof binding]
key-files:
  created: [.planning/phases/01-dom-recon-spike/01-15-DECISION.md]
  modified: [scripts/verify-recon-gate.js, SELECTORS.md, test/recon/recon-gate.smoke.js]
requirements-completed: [RECON-01, RECON-02, RECON-03]
coverage:
  - id: D1
    description: Structured authorization rejects unsupported fallback and null-shadowRoot proof.
    verification:
      - kind: integration
        ref: test/recon/recon-gate.smoke.js
        status: pass
    human_judgment: false
  - id: D2
    description: Seven declared inputs are parsed; six gating rows require bound test references and the exception must be surfaced.
    verification:
      - kind: integration
        ref: test/recon/recon-gate.smoke.js
        status: pass
    human_judgment: false
  - id: D3
    description: Approved contract change and derived-verdict policy are recorded.
    verification: []
    human_judgment: true
    rationale: User answered approved, carry on to both separately presented questions.
completed: 2026-09-07
---

# Phase 01 Plan 15: Structured Verdict and Declared Inputs

**Final authorization reads structured states and proof references, and every assumptions-table row is now parsed and accounted for.**

## Task Commits

1. Contract approval and initial RED regressions: `53ce62d`.
2. Structured selector and DOM proof: `a7bbeef`.
3. Declared-input RED regressions: `9f6fbe3`; GREEN ledger/parser implementation: `83d2be6`.

## Verification

- Task 2: four regressions failed before implementation; Task 3: five regressions failed before implementation. Final full suite: **58 Node + 107 Vitest = 165 passed**, zero failures, skips, or todos.
- CR-08 before: disproved stable identifiers with intact prose did not produce the selector blocker. After: `selector-fallback-not-matrix-proven` blocks proceed. The Garden rung cannot independently rescue disproved Garden identifier evidence.
- CR-10 before: the seven unresolved rows were ignored. After: an unresolved gating row yields `declared-input-unresolved`; missing/unbound evidence and an unsurfaced exception also block.
- Missing proof files, invalid enums and rung states, null-shadowRoot-only proof, malformed/missing assumptions tables are covered by stable codes.
- Final CLI: `FINAL VERDICT: proceed`, matching the recorded field. Evidence CLI: `EVIDENCE READY: 18 terminal entries`. Corpus validation and all six bound test-reference checks pass through the full suite/final CLI. `git diff --check` passes.

## Decisions and Deviations

- User approved the published contract change and derived-verdict policy with “approved, carry on”. Six rows are resolved and gating; RECON-01/unclassified remains unresolved, non-gating, and explicitly flagged. No Phase 1 SPEC exists to settle it.
- Extended the field-name grammar to admit digits needed by fallback-rung-N. Proof paths are restricted to canonical repository test files relative to the module root, never the caller cwd; synchronous access preserves the synchronous validator API.
- Assumptions are bound to all seven expected identities, their approved gating classifications, and exact proof-reference sets. Referenced files and case/code anchors must exist, preventing row deletion or arbitrary evidence substitution.
- Re-read and corrected corpus provenance prose to state repository-byte re-admission, no fresh live capture, retained originals in Git, and exact second-pass parity.

## Remaining Gates

This summary records implementation completion, not independent acceptance. Code review, security audit, and goal verification remain authoritative. Historical dependency approval independence is still not-attested. Phase 2 remains closed until phase verification resolves.

## Self-Check: PASSED

All task commits, owned files, and approval record exist; active tests pass without todos. No dependency installation or version change occurred.

## Independent Audit Remediation

The first independent review of source `83d2be6` reproduced residual CR-05 (a body row could impersonate a header), CR-08 (unrelated existing test files could prove fallback), CR-09 (arbitrary words inside CSS functions), and new metadata grammar gaps. Those results were not erased by the initial green suite.

- RED `7e97418`: four Node regressions fail and the new header-identity Vitest regression fails.
- GREEN `8572685`: shared structural parser binds actual header identity; numeric CSS color/gradient productions reject arbitrary words; a validator-owned per-rung proof registry replaces mere file existence; unproven proof and flagged metadata use closed tokens. The final paint-owner vocabulary now uses `direct-cells`, matching the shared assessor.
- Full suite after remediation: **64 Node + 108 Vitest = 172 passed**, no failures, skips, or todos. Positive numeric color-space/gradient and direct-cell owner cases prevent a reject-everything workaround.
- Fresh independent rechecks and the canonical phase verification report determine final acceptance; this addendum does not self-certify those gates.

### Final Paint Equivalence Recheck

A second independent probe found that equivalent transparent colors in different CSS spellings could count as distinct states. RED `9d62f94` reproduced it; GREEN `1341022` now admits only the observed computed comma-RGB/RGBA/transparent serialization with `image:none`, bounds numeric channels and alpha, and compares canonical numeric colors (including all alpha-zero colors). Other color spaces and images fail closed until a future contract explicitly supports their canonicalization. This supersedes the preceding addendum's broader color/gradient support claim.

Final suite after this correction: **65 Node + 108 Vitest = 173 passed**, no failures, skips, or todos. Recorded corpus and final verdict are unchanged.
