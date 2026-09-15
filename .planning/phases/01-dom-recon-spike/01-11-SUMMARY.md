---
phase: 01-dom-recon-spike
plan: 11
subsystem: testing
tags: [sanitizer, privacy, grammar, fixtures]
requires:
  - phase: 01-09
    provides: Production sensitive-data scanner
provides:
  - Unfiltered direct-child Priority indexing with fail-closed cell validation
  - Canonical external denylist custody
  - Shared filesystem-free sanitized-output grammar and idempotent producer
affects: [01-12, 01-13]
tech-stack:
  added: []
  patterns: [Shared producer-consumer grammar, validate before writing]
key-files:
  created: [scripts/sanitized-output-contract.js, test/recon/sanitized-output-contract.test.js]
  modified: [scripts/sanitize-fixture.js, test/recon/sanitize-fixture.test.js]
key-decisions:
  - Share bounded-table parsing and ARIA normalization as well as allowlists so output validation cannot diverge from the producer.
  - Reject denylist custody before input resolution, then check canonical input/output aliases before reads.
  - Preserve only the exact recorded Priority header token in its resolved cell.
requirements-completed: [RECON-01, RECON-02, RECON-03]
coverage:
  - id: D1
    description: Malformed direct children cannot shift Priority indexing.
    requirement: RECON-01
    verification:
      - kind: integration
        ref: test/recon/sanitize-fixture.test.js#rejects a mixed td/th header before it can preserve wrong-column Priority text
        status: pass
    human_judgment: false
  - id: D2
    description: Denylist custody rejects worktree paths and canonical input/output aliases.
    requirement: RECON-01
    verification:
      - kind: integration
        ref: test/recon/sanitize-fixture.test.js#rejects a denylist inside the worktree, directly or through an outside symlink
        status: pass
    human_judgment: false
  - id: D3
    description: The sanitizer validates its own output grammar and produces byte-identical output on re-sanitization.
    requirement: RECON-01
    verification:
      - kind: integration
        ref: npm run test:recon
        status: pass
    human_judgment: false
duration: 8 min
completed: 2026-09-05
status: complete
---

# Phase 01 Plan 11: Fail-Closed Sanitizer and Shared Output Grammar

**The sanitizer validates unfiltered row structure, keeps denylists outside the worktree, and checks its output with one shared grammar before writing.**

## Accomplishments

- Derived the Priority index from unfiltered header children and validated every ticket-row child before indexing. Ticket rows cannot be mistaken for header rows merely because malformed input contains a `th`.
- Canonicalized denylist paths, rejected worktree containment and input/output aliases, and used only the resolved path for stat/read. In-worktree custody is rejected before an absent capture is reported.
- Extracted allowlists, inert parsing, table-boundary validation, and ARIA normalization into `scripts/sanitized-output-contract.js`. The output validator rejects residual text, invalid or unrecognized ARIA, non-allowlisted attributes, comments, extra tables, and wrapper siblings.
- Preserved the exact Priority header in its resolved cell. All other headers remain stand-ins; re-sanitizing a valid 16-column output preserves its exact bytes and checksum.

## Task Commits

| Task | RED | GREEN |
| --- | --- | --- |
| 1: Unfiltered Priority indexing | `2d91722` | `946cdf5` |
| 2: Canonical denylist custody | `dbcdbc1` | `84ffc45` |
| 3: Shared grammar and parity | `e953193` | `02910f2` |

## Verification

- Before Task 1, an isolated synthetic mixed `td`/`th` header was accepted and `<td>Urgent</td>` survived in the wrong column. Afterward the same case rejects `row-children-must-be-cells` through both API and CLI and writes no output. Ticket `th`, retained non-cell, width mismatch, duplicate Priority header, and a correct 16-column/index-6 case are covered.
- Task 1 RED: 3 failed, 33 passed. GREEN full suite: 42 Node + 48 Vitest = 90 passed.
- Task 2 RED: 3 failed, 37 passed in sanitizer suite. GREEN full suite: 42 Node + 52 Vitest = 94 passed.
- Task 2 absent-capture CLI probe: exit 1 with exactly `SANITIZE_FIXTURE_REJECTED denylist-inside-worktree`. External symlink denylists still work. Source inspection confirms stat/read use `denylistRealPath`.
- Task 3 RED: missing grammar module plus two failing sanitizer tests (header preservation and corrupted serialized output). GREEN: grammar acceptance and 17 rejection cases pass; corrupt output is rejected as `output-contract-violated` before writing; output byte/hash parity passes.
- Final full suite: **42 Node + 72 Vitest = 114 passed**, zero failures/skips/todos. Sanitizer suite has 42 active tests. `git diff --check` passes. No package or lockfile changes.
- Shared-module source has no filesystem import; expected exports and the two-table `table-boundary-required` rejection are confirmed.

## Deviations from Plan

- Happy DOM repairs a literal `span` inside a native `tr` before the sanitizer sees it. The retained non-cell test therefore injects an element at the parser seam, proving rejection of a direct non-cell in the parsed DOM. The malformed native `th` and mixed header tests remain real raw-markup reproductions.
- Extracted bounded parsing and ARIA normalization with the allowlists rather than duplicating their rules in the new validator. Sanitizer-facing errors retain `SanitizationError` and their existing codes.
- Updated the old positive test that required redacting the Priority header, because retaining that one token is an explicit output-contract change in this plan. No rejection was weakened.

## Issues Encountered

The committed corpus has not yet been re-admitted; the consumer will not enforce this grammar until Plan 01-13. Do not mistake producer correctness for existing corpus acceptance.

## Next Phase Readiness

Plan 01-12 can prepare and review corpus re-admission. Phase 1 remains incomplete, and the independent-approval limitation in Plan 01-10 remains not-attested. RECON requirements are not advanced by this summary's traceability metadata.

## Self-Check: PASSED

All four owned files exist, six task commits exist, all 114 tests pass, and the locked dependencies remain unchanged.
