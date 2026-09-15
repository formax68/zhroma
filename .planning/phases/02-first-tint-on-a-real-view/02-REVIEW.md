---
phase: 02-first-tint-on-a-real-view
reviewed: 2026-09-09T08:59:05Z
initial_reviewed: 2026-09-08T12:29:33Z
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
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
resolved_findings: [CR-01, CR-02]
rereview_commits: [0ddcc27, a58b826]
---

# Phase 02: Code Review Report

**Reviewed:** 2026-09-09T08:59:05Z (standard scope and evidence refresh)
**Initial review:** 2026-09-08T12:29:33Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** clean — both initial findings independently verified as resolved

## Narrative Findings (AI reviewer)

### Summary

Reviewed the explicit seven-file implementation scope against the current Phase 02 context, research, plans and summaries, the project instructions in `.claude/CLAUDE.md`, and the admitted selector contract. Traced discovery, whole-table validation, synchronous preflight/rollback, finite startup disposal, the manifest-to-script-to-CSS seam, fixture harness isolation, and live-evidence parsing/disposition. No project skills or root AGENTS.md were present; none of the seven files is ignored. The initial review found two reproducible false-acceptance paths in the evidence guard. Targeted independent re-review of fixes `0ddcc27` and `a58b826` found both resolved, with no new defect in the changed validator. Frontmatter counts describe current open findings; the original findings and reproductions remain below as history.

The current product acceptance record derives `passed`, with eleven source-bound live checks; UAT separately records twelve explicit decisions. This refresh found no new supported BLOCKER or WARNING within the Phase 2 initial-document scope. The explicitly heuristic startup parameters, deferred Phase 3 reapplication, and approved historical AR-01-13 exception remain limitations. No source files or acceptance evidence were modified by this reviewer.

### Current standard refresh — 2026-09-09

Re-read all seven listed source files and the current 02-01, 02-02 and conditionally resolved 02-03 plans, UAT, live-acceptance record and debug history. Checked the manifest/script/CSS boundary, whole-table refusal and synchronous preflight, marker rollback, finite observer/timer disposal, test fixture isolation, duplicate-key/date guards and final-record source/settings checks. No root AGENTS.md or project skill directories exist; `.planning/config.json` configures no agent skills. The seven files are not Git-ignored. `git diff a58b826 -- extension test/extension vitest.config.js` is empty: runtime and test bytes remain at the previously repaired baseline.

- **G-02-1 classification:** The user explicitly clarified both reports, including the earlier fresh-tab report, as opening Zendesk then clicking the view. The demonstrated in-app table had five High rows, 25 blanks and zero markers; the direct-view control produced five markers. Earlier direct-entry/full-reload controls produced 22 Normal markers and eight unmarked blanks. These are recorded observations from the orchestrator/UAT, not browser operations performed by this reviewer. Reclassification follows the clarified entry sequence, not an inference that successful controls disprove an unresolved direct-load report.
- **Scope remains explicit:** In-app entry, switching views and Next/Previous pagination remain unimplemented Phase 3 liveness work. The finite initial controller does not restart after disposal. No causal injection/disposal timeline, precise startup measurement, naturally delayed-batch coverage, runtime repair or new regression is claimed. The corrected report interpretation makes 02-03's conditional runtime-repair precondition inapplicable; no code change is warranted solely by this report.
- **Evidence consistency:** Current UAT, JSON and final debug disposition agree on Phase 2 acceptance and Phase 3 deferral. Earlier gaps_found judgments and inconclusive investigation entries remain identifiable historical evidence. Runtime hashes and palette/timing settings are checked against actual files; acceptance still represents declared evidence consistency, not automatic proof of a human observation. No expanded compatibility or historical approval independence is claimed.
- **Fresh reviewer verification:** `node node_modules/vitest/vitest.mjs run --config vitest.config.js test/extension` passed all 128 tests across three files and printed `LIVE ACCEPTANCE STATUS: passed`. This includes all 56 evidence-validator tests and the actual-byte runtime/CSS tests. The orchestrator additionally reported 301 combined tests passing earlier this turn; that broader run was not repeated by this reviewer.

Open finding counts remain zero. CR-01 and CR-02 remain repaired; their original reproductions and the prior independent repair verification are retained below. This clean code review does not replace the separate security, visual, or goal-verification dispositions and does not claim Phase 3 works.

### Historical independent re-review — 2026-09-08: both findings resolved

Re-read this review, `02-REVIEW-FIX.md`, the two fix commits and the complete changed `test/extension/live-acceptance.test.js`. The seven-file list preserves the original scope; this follow-up was limited to the two fixes and their affected behavior.

- **CR-01 resolved:** Lines 26–49 tokenize JSON before ordinary parsing and maintain a distinct decoded-name set for each object. Lines 51–59 invoke this check before `JSON.parse`. Duplicate members are rejected at nested array/object boundaries; escaped-equivalent names compare equally. The native parser still rejects invalid JSON grammar, and quoted JSON-like text remains opaque.
- **CR-02 resolved:** Lines 65–72 derive today's date from an injectable clock and timezone, defaulting to the validation host's local calendar. Lines 95–99 retain calendar validation and reject completed observation dates later than that local date. The condition applies to both pass and fail observations. Pending evidence keeps its existing empty-field representation.
- **Focused test evidence:** `node node_modules/vitest/vitest.mjs run --config vitest.config.js test/extension/live-acceptance.test.js` passed 56 tests and printed `LIVE ACCEPTANCE STATUS: human_needed`. These include yesterday/today acceptance, tomorrow/year-2999 rejection, future-fail rejection, host-local today, and Nicosia/Los Angeles midnight boundaries.
- **Independent read-only probes:** Executed the actual parser/validator functions outside the test registrations. Four duplicate-member variants were rejected, including decoded Unicode and backslash equivalents and objects nested in arrays. Three valid JSON controls preserved separate object scopes, escaped/key-like string contents and numeric values. Four additional local-midnight pairs in `Pacific/Kiritimati` (UTC+14) and `Pacific/Pago_Pago` (UTC−11) admitted local today and rejected local tomorrow. Year 2999 was rejected with `observation-date-future`.

No broader implementation re-review was needed for these test-local fixes. Only this review artifact was updated during re-review; implementation, live evidence and unrelated UI review files were preserved. A clean code-review disposition does not complete the separate live acceptance or phase-verification gates.

### Resolved critical findings — original review history

The original descriptions and source coordinates below refer to the pre-fix implementation reviewed at 2026-09-08T12:29:33Z.

#### CR-01: Duplicate JSON members can erase a failed observation before validation

**Current status:** RESOLVED — independently verified at `0ddcc27` plus `a58b826`.
**Classification:** BLOCKER
**File:** `/Users/mike/code/zhroma/test/extension/live-acceptance.test.js:26`
**Lines:** 22–29; disposition consumes the result at 62–66.
**Issue:** The evidence parser passes raw JSON directly to `JSON.parse`, which silently keeps the last occurrence of each object member. Therefore a check containing both `"status":"fail"` and a later `"status":"pass"` is admitted as a passing check; similarly, a duplicate defect inventory can replace a nonempty list with an empty list. The downstream exact-key checks cannot detect the discarded declaration. This lets a single canonical record containing contradictory evidence derive `passed`, despite the requirement that an observed failure or unresolved defect prevent acceptance.

**Reproduction:** Using the actual `parseLiveAcceptance` and `validateLiveAcceptance` functions with a synthetic complete record and current runtime hashes, replace the first check's serialized `"status":"pass"` with `"status":"fail","status":"pass"`. Put the result in the single JSON fence and validate it. The observed result is `passed`. The other fields, settings and hashes remain valid. This was an in-memory probe; the repository's pending report was not edited.

**Fix:** Reject duplicate object member names during JSON tokenization/parsing, before materializing an ordinary JavaScript object. Compare decoded names so escaped-equivalent keys are also rejected, and apply the check at every nesting level. A `JSON.parse` reviver is too late because duplicate members have already been discarded. Add regressions for duplicate top-level status, duplicate check status, duplicate defect inventory, and escaped-equivalent names, while retaining the single-record check.

#### CR-02: Future dates count as completed live observations

**Current status:** RESOLVED — independently verified at `a58b826`.
**Classification:** BLOCKER
**File:** `/Users/mike/code/zhroma/test/extension/live-acceptance.test.js:56`
**Lines:** 56–59; completeness is derived at 64–66.
**Issue:** Completed checks require a syntactically valid calendar date, but the validator never checks whether that date has occurred. An otherwise complete record with every observation dated `2999-01-01` is accepted as `passed` today. This is a detectable temporal inconsistency, independent of the validator's acknowledged inability to prove what a human saw. A scheduled check or mistyped future year can therefore satisfy the completed-live-evidence gate.

**Reproduction:** Using the actual validator and a synthetic complete record with current hashes, assign `check.observed_on = '2999-01-01'` to all eleven checks. `validateLiveAcceptance(record, currentHashes)` returns `passed` on 2026-09-08. The existing malformed-date regression only exercises calendar validity, so it does not catch this false acceptance.

**Fix:** Define the observation-date timezone and reject completed dates later than the current date in that timezone. Supply an injectable validation clock/date so regressions remain deterministic. Test yesterday/today acceptance, tomorrow/future-year rejection, and the date boundary in the chosen timezone. Keep future scheduled work in the existing pending representation until it has actually been observed.

### Initial verification and limits — retained history

- `node node_modules/vitest/vitest.mjs run --config vitest.config.js test/extension` — 3 files, 111 tests passed; output explicitly reported `LIVE ACCEPTANCE STATUS: human_needed`.
- Read-only Node/VM probes executing the actual parser/validator functions — contradictory duplicate check status returned `passed`; future dates returned `passed`.
- Review scope was supplied explicitly and cross-checked by the orchestrator against `608d98e..3776d28`; no heuristic Git scope was introduced.
- No live browser/account operation, dependency installation, implementation edit, evidence update or commit was performed. This report does not claim live appearance acceptance or independent security/goal verification.

---

_Reviewer: gsd-code-reviewer_
_Depth: standard_
