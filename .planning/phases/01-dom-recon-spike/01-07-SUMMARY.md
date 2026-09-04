---
phase: 01-dom-recon-spike
plan: 07
subsystem: testing
tags: [sanitizer, privacy, happy-dom, aria, dom-boundary, tdd]

requires:
  - phase: 01-dom-recon-spike/01-05
    provides: Live-derived table topology, selector evidence, and the admitted three-scenario fixture corpus
provides:
  - Cwd-independent sanitizer CLI execution with value-free diagnostics and checksum reporting
  - Single-table capture admission with owned headers, positively identified ticket rows, and sibling exclusion
  - Explicit textual, reference, state, and numeric ARIA policy with fail-closed unknown handling
  - Priority-label preservation restricted to resolved ticket-row Priority cells
affects: [01-08, fixture-readmission, selector-recon, phase-02]

actuals:
  tokens: 4732
  tasks: 2
  commits: 5

tech-stack:
  added: []
  patterns:
    - Module-relative CLI and worktree boundary discovery
    - DOM ownership resolution before sanitization
    - Explicit allowlist validation for state-bearing ARIA
    - Scan-before-write admission with immutable private input

key-files:
  created:
    - .planning/phases/01-dom-recon-spike/01-07-SUMMARY.md
  modified:
    - scripts/sanitize-fixture.js
    - test/recon/sanitize-fixture.test.js

key-decisions:
  - "Resolve both direct CLI execution and the Git worktree boundary from the sanitizer module URL, never from the caller's cwd."
  - "Admit exactly one owned table whose wrapper chain has no sibling elements or non-whitespace text."
  - "Rewrite all textual ARIA, remove reference-bearing ARIA, normalize only explicit state and numeric classes, and reject every unknown aria-* name."
  - "Preserve an English Priority word only when the exact cell text belongs to a positively identified ticket row at the uniquely resolved Priority header index."

patterns-established:
  - "Capture admission: resolve table ownership, header shape, ticket-row identity, and Priority cells before any attribute or text transformation."
  - "ARIA admission: classify by semantic channel, normalize validated state, and fail closed on unknown names or invalid values."

requirements-completed: [RECON-01, RECON-02, RECON-03]

coverage:
  - id: D1
    description: "The sanitizer CLI executes and validates from any caller cwd, producing a checksum only after a new output is written."
    requirement: RECON-01
    verification:
      - kind: integration
        ref: "test/recon/sanitize-fixture.test.js#the CLI executes invalid invocations from outside the repository"
        status: pass
      - kind: integration
        ref: "test/recon/sanitize-fixture.test.js#the CLI creates and checksums output from outside the repository"
        status: pass
    human_judgment: false
  - id: D2
    description: "Capture admission rejects broad roots and mixed ownership, retaining only one complete table boundary."
    requirement: RECON-01
    verification:
      - kind: unit
        ref: "test/recon/sanitize-fixture.test.js#rejects an app root containing unrelated sibling UI"
        status: pass
      - kind: unit
        ref: "test/recon/sanitize-fixture.test.js#rejects mixed table ownership instead of combining a header and row"
        status: pass
    human_judgment: false
  - id: D3
    description: "ARIA channels are deterministically rewritten, removed, normalized, or rejected before output admission."
    requirement: RECON-01
    verification:
      - kind: unit
        ref: "test/recon/sanitize-fixture.test.js#rewrites textual ARIA, removes references, and preserves validated state"
        status: pass
      - kind: unit
        ref: "test/recon/sanitize-fixture.test.js#rejects unclassified or invalid ARIA"
        status: pass
    human_judgment: false
  - id: D4
    description: "Urgent, High, Normal, and Low survive only in resolved Priority cells of positively identified ticket rows."
    requirement: RECON-02
    verification:
      - kind: unit
        ref: "test/recon/sanitize-fixture.test.js#preserves Priority words only inside resolved ticket-row Priority cells"
        status: pass
      - kind: integration
        ref: "npm --prefix . run test:recon"
        status: pass
    human_judgment: false

duration: 8 min
completed: 2026-09-04
status: complete
---

# Phase 01 Plan 07: Fail-Closed Fixture Sanitizer Summary

**Cwd-independent CLI execution, single-table DOM ownership, explicit ARIA classification, and Priority labels confined to proven ticket cells**

## Performance

- **Duration:** 8 min
- **Started:** 2026-09-04T05:54:16Z
- **Completed:** 2026-09-04T06:01:50Z
- **Tasks:** 2
- **Files modified:** 2 implementation/test files plus this summary

## Accomplishments

- Closed the silent outside-cwd CLI success path and verified both rejection and successful checksum-producing execution from a temporary directory.
- Replaced broad-root probing with one-table ownership checks covering the wrapper chain, header row, ticket rows, cell widths, and unique Priority index.
- Replaced permissive `aria-*` handling with deterministic textual replacement, reference removal, normalized state/number validation, and fail-closed unknown handling.
- Restricted the four English Priority labels to the resolved Priority cells of positively identified ticket rows while proving rejected inputs remain unchanged and produce no output.

## Task Commits

Each TDD gate and completed task was committed atomically:

1. **Task 1 RED: Reproduce outside-cwd CLI bypass** — `1eee9fd` (test)
2. **Task 1 GREEN: Make sanitizer CLI cwd-independent** — `d58032f` (fix)
3. **Task 2 RED: Cover sanitizer admission boundaries** — `b019aa4` (test)
4. **Task 2 GREEN: Enforce table, ARIA, and Priority-cell boundaries** — `30a80ce` (fix)

## Files Created/Modified

- `scripts/sanitize-fixture.js` — Resolves execution and worktree identity from the module, validates table ownership and ARIA classes, and scopes Priority preservation.
- `test/recon/sanitize-fixture.test.js` — Adds outside-cwd subprocess and adversarial DOM/ARIA/Priority regressions, including source immutability and no-write assertions.
- `.planning/phases/01-dom-recon-spike/01-07-SUMMARY.md` — Records execution evidence, decisions, and traceability.

## Decisions Made

- The sanitizer module location is the authority for CLI identity and repository containment; the caller's working directory is untrusted execution context.
- A valid capture contains one selected table and only a sibling-free wrapper chain around it. Headers and ticket rows must be owned by that table.
- ARIA handling is semantic and exhaustive: known textual values are tokenized, references are removed, allowed states/numbers are normalized, and everything else fails closed.
- Priority preservation requires an exact `Priority` header, a positively identified ticket row, the corresponding direct cell, and an exact standalone English label.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed the second caller-cwd dependency from worktree discovery**
- **Found during:** Task 1 GREEN
- **Issue:** Fixing direct-entry detection made valid outside-cwd calls execute, but `findGitWorktreeRoot(process.cwd())` then rejected them with `worktree-unavailable`.
- **Fix:** Resolve the worktree from the sanitizer module directory while retaining the existing input-inside-worktree prohibition.
- **Files modified:** `scripts/sanitize-fixture.js`
- **Verification:** Both outside-cwd subprocess tests and the complete focused suite pass.
- **Committed in:** `d58032f`

**2. [Rule 1 - Bug] Kept the unsafe-attribute regression inside valid table markup**
- **Found during:** Task 2 GREEN
- **Issue:** Happy DOM foster-parented an invalid `<div>` child of `<tbody>` outside the table, causing the new boundary gate to reject before the intended unsafe-attribute assertion.
- **Fix:** Put the unsafe attribute on a structurally valid table row so the test continues to exercise the attribute classifier directly.
- **Files modified:** `test/recon/sanitize-fixture.test.js`
- **Verification:** The test reports `unsafe-attribute`; all 30 focused tests pass.
- **Committed in:** `30a80ce`

**3. [Rule 1 - Bug] Corrected the out-of-order state position after the SDK advance**
- **Found during:** Plan closeout
- **Issue:** `state.advance-plan` incremented the stale sequential counter from Plan 1 to Plan 2 even though Plan 01-07 had just completed while Plan 01-06 remained at a blocking-human checkpoint.
- **Fix:** Retained the SDK's metric, decision, progress, and session updates but corrected Current Position to Plan 7 and explicitly preserved the Plan 01-06 gate.
- **Files modified:** `.planning/STATE.md`
- **Verification:** STATE records 6/8 completed summaries, the Plan 01-07 metric, and the unresolved Plan 01-06 checkpoint without claiming Phase 1 completion.
- **Committed in:** Plan metadata commit where permitted by dirty-tree isolation.

---

**Total deviations:** 3 auto-fixed (3 Rule 1 bugs).
**Impact on plan:** Both fixes were required to make the planned regression paths non-vacuous; neither changed the approved dependency set or widened the capture boundary.

## Issues Encountered

- Duplicate HTML attributes are collapsed by the parser before sanitizer validation. The invalid-number regression replaces the original `aria-rowcount` instead of adding a duplicate, ensuring it exercises the validator.

## Verification

- `node node_modules/vitest/vitest.mjs run --config vitest.config.js test/recon/sanitize-fixture.test.js` — 1 file, 30 tests passed.
- `npm --prefix . run test:recon` — 24 Node smoke tests and 38 Vitest tests passed; zero failures, skips, or todos.

## TDD Gate Compliance

- Task 1: RED `1eee9fd` precedes GREEN `d58032f`.
- Task 2: RED `b019aa4` precedes GREEN `30a80ce`.
- No refactor commit was needed; the final implementation remained green after the last test change.

## Known Stubs

None. Matches for `placeholder` are the ARIA attribute class under test and the intentionally removed HTML attribute name; there are no TODOs, skipped tests, or mock data paths.

## Threat Flags

None. The modified file-access and DOM-admission surfaces are all registered in the plan threat model and covered by fail-before-write tests.

## User Setup Required

None - no package, secret, service, or authenticated browser action is required.

## Next Phase Readiness

- The sanitizer defects CR-01 through CR-04 are closed by non-vacuous tests.
- Plan 01-06 remains paused at its blocking-human interaction checkpoint and its owned smoke test was not modified.
- Plan 01-08 may consume this hardened sanitizer when re-admitting and validating the fixture corpus; Phase 2 remains gated by the broader Phase 1 verdict.

## Self-Check: PASSED

Both task-owned files and this summary exist, and commits `1eee9fd`, `d58032f`, `b019aa4`, and `30a80ce` are present in Git history. No tracked file deletion occurred.

---
*Phase: 01-dom-recon-spike*
*Completed: 2026-09-04*
