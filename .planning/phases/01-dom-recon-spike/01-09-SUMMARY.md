---
phase: 01-dom-recon-spike
plan: 09
subsystem: testing
tags: [privacy, unicode, recon, admission, diagnostics]
requires:
  - phase: 01-08
    provides: Shared corpus admission and recon evidence gate
provides:
  - One production sensitive-data policy with canonical Unicode matching
  - Stable value-free recon CLI diagnostics
  - Node engine constraint and private-capture ignore rules
affects: [01-11, 01-13, 01-14, 01-15]
tech-stack:
  added: []
  patterns: [NFC normalization before case folding, fixed error codes]
key-files:
  created: [scripts/sensitive-patterns.js]
  modified: [scripts/sanitize-fixture.js, scripts/fixture-contract.js, scripts/verify-recon-gate.js, test/recon/sensitive-patterns.smoke.js, test/recon/sanitize-fixture.test.js, test/recon/fixture-contract.test.js, test/recon/recon-gate.smoke.js, package.json, .gitignore]
key-decisions:
  - Normalize content before both generic-rule and capture-denylist matching, without changing generic patterns.
  - Detailed CLI diagnostics require ZHROMA_RECON_DEBUG to equal the literal string 1.
requirements-completed: [RECON-01, RECON-02, RECON-03]
coverage:
  - id: D1
    description: Canonical Unicode matches are rejected at both production admission boundaries.
    requirement: RECON-01
    verification:
      - kind: integration
        ref: npm run test:recon
        status: pass
    human_judgment: false
  - id: D2
    description: Recon CLI errors reveal only stable codes unless debug is explicitly enabled.
    requirement: RECON-02
    verification:
      - kind: integration
        ref: node --test test/recon/recon-gate.smoke.js
        status: pass
    human_judgment: false
  - id: D3
    description: The engine declaration matches the locked runner and all three private-capture conventions are ignored.
    verification:
      - kind: other
        ref: Exact package.json engine and pin assertions plus individual git check-ignore probes
        status: pass
    human_judgment: false
duration: 6 min
completed: 2026-09-05
status: complete
---

# Phase 01 Plan 09: Shared Privacy Policy and Safe Diagnostics Summary

**Both admission boundaries now share an NFC-normalizing production scanner, and recon CLI failures emit stable value-free codes.**

## Performance

- Started: 2026-09-05T12:54:41Z
- Completed: 2026-09-05T13:00:21Z
- Tasks: 3/3
- Files: 10 logical files, including the scanner move from the test tree

## Accomplishments

- Moved the only sensitive-data policy to `scripts/sensitive-patterns.js`; both production callers and test imports use it. Both canonical denylist pairings and combined case/normalization are rejected. The sanitizer leaves no output on rejection; corpus admission scans before detached parsing.
- Added `ReconGateError` with fixed message and codes at every explicit gate throw site. Unreadable ledgers, unknown statuses, duplicate IDs, invalid arguments, fixture errors, and unexpected failures produce value-free stderr by default. Underlying detail is available only with `ZHROMA_RECON_DEBUG=1`.
- Constrained Node to `^20.19.0 || ^22.12.0 || >=24.0.0` and ignored `*.private.html`, `*.denylist.txt`, and `private-capture/`, retaining `node_modules/`. Dependency pins and the lockfile are unchanged.

## Task Commits

| Task | RED | GREEN / completed |
| --- | --- | --- |
| 1: Shared normalized scanner | `d83d562` | `c79cef3` |
| 2: Value-free diagnostics | `eb14c04` | `095ef6c` |
| 3: Runtime and private-capture constraints | Existing engine declaration contradicted the exact planned range | `ba7ddeb` |

## Verification

- Task 1 RED: 3 canonical-equivalence Node tests failed; 2 admission-boundary Vitest tests failed while the original 41 passed.
- Task 1 GREEN and tracer feedback: 33 Node + 43 Vitest tests passed (76 total). Direct NFC/NFD probes rejected with exactly the category/code finding; the old test-tree module is absent and production imports contain no test-tree reference.
- Task 2 RED: 16/19 gate tests failed against the old message-based API, including private-path, field-value, unknown-mode, and typed-error checks.
- Task 2 GREEN: all 19 gate tests passed. Debug unset, empty, 0, true, and 2 all produce only a code; literal 1 exposes underlying detail as specified.
- Final `npm run test:recon`: **37 Node + 43 Vitest = 80 passed**, zero failures, skips, or todos. All original 71 tests are retained.
- Evidence CLI: `EVIDENCE READY: 18 terminal entries`, exit 0.
- Missing-ledger CLI: `RECON_GATE_REJECTED ledger-readable-required`, exit 1, no supplied path.
- Exact engine/pin assertions passed; each private-capture path was checked individually with `git check-ignore -q`; lockfile diff is empty; `git diff --check` passed.

## Decisions Made

The corpus generic-rule regression uses the Kelvin sign, whose canonical decomposition is ASCII K, in an email address. NFC is applied to content before generic matching as well as denylist matching. The existing generic expressions are unchanged. This gives a real failing-before/passing-after corpus test with an explicit DOMParser spy.

## Deviations from Plan

- Existing `FixtureContractError` is a named, coded Error produced by a factory, not an exported class. The CLI recognizes its existing name/code shape instead of adding an unrelated class migration; codes must match a lowercase hyphenated format.
- Two sanitizer worktree-boundary tests named the moved scanner as their input. Updated those fixture paths to the new production location so they continue testing an existing in-worktree file.

## Issues Encountered

GSD's fork-base check returned `fork-ref-unknown` because `origin/HEAD` is unresolved, so the run used its documented sequential fallback on `main`. The first local commit encountered the filesystem sandbox; the normal approval mechanism authorized the scoped Git writes. No hooks were bypassed.

## User Setup Required

None for this plan.

## Next Phase Readiness

Plan 01-09 closes CR-02, CR-11, WR-01, and WR-03 at the implementation/test level. Plan 01-10 requires three separate human attestations before its approval record can be written. Plans 01-11 through 01-15 and independent phase verification remain pending. The `requirements-completed` list above is the required plan traceability list, not a claim that the phase requirements have passed independent verification; RECON-01/02 remain pending in REQUIREMENTS.md.

## Self-Check: PASSED

The production module exists, its former test-tree path is absent, all five task commits exist, the 80-test suite passes, and the lockfile remains unchanged.
