---
phase: 01-dom-recon-spike
plan: 13
status: complete
subsystem: testing
tags: [corpus, admission, grammar]
requires:
  - phase: 01-12
    provides: Re-admitted corpus
provides: [Canonical file uniqueness, Shared grammar admission, Priority header and absence contracts, Manifest root validation]
affects: [01-14, 01-15]
tech-stack:
  added: []
  patterns: [Two-pass canonical identity preflight]
key-files:
  created: []
  modified: [scripts/fixture-contract.js, test/recon/fixture-contract.test.js]
requirements-completed: [RECON-01, RECON-02, RECON-03]
coverage:
  - id: D1
    description: Corpus admission rejects malformed structure, aliases, invalid sanitized bytes, and invalid manifest roots.
    verification:
      - kind: integration
        ref: test/recon/fixture-contract.test.js
        status: pass
    human_judgment: false
completed: 2026-09-07
---

# Phase 01 Plan 13: Corpus Admission Contracts

**Admission now checks Priority header identity, genuine absence, canonical file uniqueness, shared sanitized-byte grammar, and manifest root shape.**

## Task Commits

1. Header and scenario contracts: RED `53cf18e`, GREEN `e795cbc`.
2. Canonical identity and shared grammar: RED `e9035a5`, GREEN `29f3da8`.
3. Manifest root shape: RED `f1be9e1`, GREEN `e3b5d88`.

## Verification

- Task RED results: 8, 6, and 5 failing regressions respectively before their fixes.
- Final full suite: **42 Node + 107 Vitest = 149 passed**, zero failures, skips, or todos.
- Negative coverage includes wrong assertion kinds, hidden Priority headers, invalid header indices, relative and symlink aliases, multiple tables, residual text, invalid ARIA, scalar roots, and incomplete matrices.
- `git diff --check` passes. Requirement identifiers above provide traceability; independent phase acceptance is still pending.

## Deviations

- Canonical identities are checked for the entire manifest before reading fixture contents. This gives duplicate aliases a deterministic rejection even if the first aliased file also violates the byte grammar.
- Synthetic positive fixtures were updated to obey the shared grammar. The missing-header regression also redacts body labels so it reaches the intended header-index check without an earlier grammar rejection.

## Next Readiness

Plan 01-14 can bind final evidence to the hardened corpus. Phase 1 remains gaps_found; Phase 2 remains closed. Historical dependency approval independence is still not-attested.

## Self-Check: PASSED

Owned source, regressions, and all six task commits exist. No dependencies changed.
