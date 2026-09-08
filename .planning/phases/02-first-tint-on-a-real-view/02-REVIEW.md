---
phase: 02-first-tint-on-a-real-view
reviewed: 2026-09-08T12:29:33Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - extension/content.js
  - extension/manifest.json
  - extension/zhroma.css
  - test/extension/initial-tint.test.js
  - test/extension/live-acceptance.test.js
  - test/extension/runtime-contract.test.js
  - vitest.config.js
findings:
  critical: 2
  warning: 0
  info: 0
  total: 2
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-09-08T12:29:33Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Narrative Findings (AI reviewer)

### Summary

Reviewed the explicit seven-file implementation scope against the current Phase 02 context, research, plans and summaries, the project instructions in `.claude/CLAUDE.md`, and the admitted selector contract. Traced discovery, whole-table validation, synchronous preflight/rollback, finite startup disposal, the manifest-to-script-to-CSS seam, fixture harness isolation, and live-evidence parsing/disposition. No project skills or root AGENTS.md were present; none of the seven files is ignored. The review found two reproducible false-acceptance paths in the evidence guard. These findings concern test reliability: this test file implements the phase's machine-checked acceptance validator.

The current product acceptance report remains `human_needed` with eleven pending checks. Missing authentic observations, the explicitly heuristic startup parameters, later-phase reapplication, and the approved historical AR-01-13 exception are not reported as new code defects. No source files or acceptance evidence were modified.

### Critical Issues

#### CR-01: Duplicate JSON members can erase a failed observation before validation

**Classification:** BLOCKER
**File:** `/Users/mike/code/zhroma/test/extension/live-acceptance.test.js:26`
**Lines:** 22–29; disposition consumes the result at 62–66.
**Issue:** The evidence parser passes raw JSON directly to `JSON.parse`, which silently keeps the last occurrence of each object member. Therefore a check containing both `"status":"fail"` and a later `"status":"pass"` is admitted as a passing check; similarly, a duplicate defect inventory can replace a nonempty list with an empty list. The downstream exact-key checks cannot detect the discarded declaration. This lets a single canonical record containing contradictory evidence derive `passed`, despite the requirement that an observed failure or unresolved defect prevent acceptance.

**Reproduction:** Using the actual `parseLiveAcceptance` and `validateLiveAcceptance` functions with a synthetic complete record and current runtime hashes, replace the first check's serialized `"status":"pass"` with `"status":"fail","status":"pass"`. Put the result in the single JSON fence and validate it. The observed result is `passed`. The other fields, settings and hashes remain valid. This was an in-memory probe; the repository's pending report was not edited.

**Fix:** Reject duplicate object member names during JSON tokenization/parsing, before materializing an ordinary JavaScript object. Compare decoded names so escaped-equivalent keys are also rejected, and apply the check at every nesting level. A `JSON.parse` reviver is too late because duplicate members have already been discarded. Add regressions for duplicate top-level status, duplicate check status, duplicate defect inventory, and escaped-equivalent names, while retaining the single-record check.

#### CR-02: Future dates count as completed live observations

**Classification:** BLOCKER
**File:** `/Users/mike/code/zhroma/test/extension/live-acceptance.test.js:56`
**Lines:** 56–59; completeness is derived at 64–66.
**Issue:** Completed checks require a syntactically valid calendar date, but the validator never checks whether that date has occurred. An otherwise complete record with every observation dated `2999-01-01` is accepted as `passed` today. This is a detectable temporal inconsistency, independent of the validator's acknowledged inability to prove what a human saw. A scheduled check or mistyped future year can therefore satisfy the completed-live-evidence gate.

**Reproduction:** Using the actual validator and a synthetic complete record with current hashes, assign `check.observed_on = '2999-01-01'` to all eleven checks. `validateLiveAcceptance(record, currentHashes)` returns `passed` on 2026-09-08. The existing malformed-date regression only exercises calendar validity, so it does not catch this false acceptance.

**Fix:** Define the observation-date timezone and reject completed dates later than the current date in that timezone. Supply an injectable validation clock/date so regressions remain deterministic. Test yesterday/today acceptance, tomorrow/future-year rejection, and the date boundary in the chosen timezone. Keep future scheduled work in the existing pending representation until it has actually been observed.

### Verification and limits

- `node node_modules/vitest/vitest.mjs run --config vitest.config.js test/extension` — 3 files, 111 tests passed; output explicitly reported `LIVE ACCEPTANCE STATUS: human_needed`.
- Read-only Node/VM probes executing the actual parser/validator functions — contradictory duplicate check status returned `passed`; future dates returned `passed`.
- Review scope was supplied explicitly and cross-checked by the orchestrator against `608d98e..3776d28`; no heuristic Git scope was introduced.
- No live browser/account operation, dependency installation, implementation edit, evidence update or commit was performed. This report does not claim live appearance acceptance or independent security/goal verification.

---

_Reviewer: gsd-code-reviewer_
_Depth: standard_
