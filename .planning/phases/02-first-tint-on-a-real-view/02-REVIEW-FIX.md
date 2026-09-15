---
phase: 02-first-tint-on-a-real-view
fixed_at: 2026-09-08T12:37:24Z
review_path: .planning/phases/02-first-tint-on-a-real-view/02-REVIEW.md
iteration: 1
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
independent_rereview: clean
live_acceptance: human_needed
---

# Phase 02: Code Review Fix Report

**Fixed at:** 2026-09-08T12:37:24Z
**Source review:** `.planning/phases/02-first-tint-on-a-real-view/02-REVIEW.md`
**Iteration:** 1

**Summary:** 2 findings in scope; 2 fixed; 0 skipped.

Both reported false-acceptance paths are resolved by focused validator changes and failing-then-passing regressions. `all_fixed` describes this repair pass; independent re-review passed with zero open findings. The original review remains historical evidence until the original reviewer rechecks the fixes. Live product acceptance remains `human_needed` with all eleven checks pending.

## Fixed Issues

### CR-01: Duplicate JSON members can erase a failed observation before validation

**Files modified:** `test/extension/live-acceptance.test.js`
**Commit:** `0ddcc27`
**Status:** fixed: independently reverified
**Applied fix:** Added test-local JSON tokenization before ordinary object parsing, using a separate decoded-name set for every object, including objects nested in arrays. Duplicate escaped-equivalent names are rejected. The existing native parser still validates the full JSON grammar; strings containing JSON-like text remain opaque. Existing duplicate-aware repository helpers parse Markdown fields, so they cannot safely substitute for JSON tokenization. No new helper file or dependency was needed.

**Regression evidence:** Five contradictory records (top-level status, check status, defect inventory, escaped-equivalent key, deeply nested setting) all failed their rejection assertions before the fix and passed afterward. A positive regression retains repeated keys in separate check objects and JSON-like string content. The single-fence requirement remains enforced.

### CR-02: Future dates count as completed live observations

**Files modified:** `test/extension/live-acceptance.test.js`
**Commit:** `a58b826`
**Status:** fixed: independently reverified
**Applied fix:** Completed pass and fail observations must have occurred by the current local calendar date. Validation defaults to the host's timezone, matching the local reviewer date instead of truncating a UTC timestamp. Both `now` and `timeZone` are injectable. Synthetic validator examples use a fixed reference clock; the actual repository report uses the real clock. Pending work retains empty observation fields.

**Regression evidence:** Seven rejection assertions failed before the fix and passed afterward, covering tomorrow, year 2999, future failed observations, and local-midnight boundaries east and west of UTC. Positive tests cover yesterday, today, and the host's local date at midnight. Eleven date tests are included in the final focused suite.

## Verification

- Per-finding source reread, `node -c test/extension/live-acceptance.test.js`, and `git diff --check` passed.
- In isolated worktree `.claude/worktrees/rf-02-acceptance-20260908`, using the existing main-checkout Vitest executable via its absolute path: focused acceptance suite passed 45 tests after CR-01 and 56 after CR-02; the extension suite passed 3 files / 128 tests.
- After fast-forward integration into `main` at `a58b826`, `node node_modules/vitest/vitest.mjs run --config vitest.config.js test/extension` passed again in the main checkout: 3 files / 128 tests, with `LIVE ACCEPTANCE STATUS: human_needed`.
- Both fixes were committed separately with normal Git hooks enabled. Only `test/extension/live-acceptance.test.js` changed in those commits.
- Runtime files, their hashes, fixture provenance, and the live acceptance report are unchanged. Automated output remains `LIVE ACCEPTANCE STATUS: human_needed`.
- Independent code re-review, live human observations, and phase goal verification are separate gates; this repair report does not close them.

---

_Fixer: gsd-code-fixer_
_Iteration: 1_

## Independent closeout

Original reviewer rechecked both commits on 2026-09-08: 56 focused tests and independent duplicate-key/timezone probes passed; current REVIEW.md is clean with zero findings. Orchestrator then ran the bounded full regression command: 65 Node smoke tests plus 236 Vitest tests passed (301 total), with LIVE ACCEPTANCE STATUS: human_needed. Final recon gate returned proceed. Live observations remain pending.
