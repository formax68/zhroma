---
phase: 03-the-tint-survives-everything
reviewed: 2026-09-09T11:57:48Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - extension/content.js
  - test/extension/initial-tint.test.js
  - test/extension/persistent-tint.test.js
  - test/extension/runtime-contract.test.js
  - test/extension/live-acceptance.test.js
  - scripts/run-tint-workload.js
  - test/performance/tint-workload.html
  - test/performance/tint-workload.js
  - test/extension/performance-harness.test.js
  - test/extension/phase-03-live-acceptance.test.js
findings:
  critical: 2
  warning: 0
  info: 0
  total: 2
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-09-09T11:57:48Z
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Narrative Findings (AI reviewer)

Read all ten explicitly scoped source files, Phase 03 plans, and the unchanged stylesheet used to establish paint behavior. No root AGENTS.md or project skill directories were present; configured reviewer skill query returned no additions. No scoped files were ignored. No structural pre-pass was supplied.

Two runtime correctness defects were reproduced using the actual shipped content.js in a Node VM, the admitted priority-present fixture, and a native happy-dom MutationObserver with ordinary asynchronous delivery. These are synthetic reproductions, not claims about the user's live Zendesk session. Existing live and profiling gaps remain separate acceptance limitations. No production source or tests were modified, and no commit was created.

## Critical Issues

### CR-01: Replacement clones retain stale priority paint after whole-table rejection

**Classification:** BLOCKER

**File:** `/Users/mike/code/zhroma/extension/content.js:80-83`

**Related:** `/Users/mike/code/zhroma/extension/content.js:121-124`, `/Users/mike/code/zhroma/extension/content.js:193-198`

**Issue:** Cleanup visits only node identities already in ownedRows. Host DOM cloning or serialization copies the extension's marker attribute onto new identities, which are absent from that set. Replacing a tinted table with such a clone whose first Priority is now Unknown causes inspection to reject the whole table; cleanup removes markers from the detached original only. All four mounted clone rows retain their old markers and still match the shipped paint selectors. The first row consequently presents Urgent paint for an unsupported current value. A cloned blank row has the same problem because commitSnapshot skips null-priority rows without adopting or clearing their copied markers. This violates D-01/D-02 and FAIL-04: stale urgency remains visible after rejection.

**Reproduction:** Load the admitted priority-present fixture and settle the actual runtime. Let `original = document.querySelector('table')`, `replacement = original.cloneNode(true)`. Set `replacement.querySelector('tbody tr').children[6].textContent = 'Unknown'`; call `original.replaceWith(replacement)` and allow native observer and timer delivery. Observed mounted markers remain `['Urgent', 'High', 'Normal', 'Low']`; expected `[null, null, null, null]`. No native API failure was injected.

**Coverage gap:** The replacement test in persistent-tint.test.js explicitly strips cloned markers before insertion, and the competing-table transition test checks original row identities rather than every painted mounted row. Neither exercises copied extension state.

**Fix:** Reconcile the reserved marker attribute on newly encountered mounted nodes as well as tracked originals. During relevant invalidation, remove copied markers unless that exact row has a freshly validated recognized priority; continue clearing tracked detached rows. Preserve the rule that only the extension's marker may be removed, and never infer priority from its old value. Add actual-observer regressions for a marked clone containing Unknown, a blank Priority, and an incomplete table; assert no stale CSS-matching mounted markers before the deferred positive pass and after settlement. Also verify normal valid clone replacement still recovers.

### CR-02: Resolving table ambiguity through an identifier change never schedules recovery

**Classification:** BLOCKER

**File:** `/Users/mike/code/zhroma/extension/content.js:143-146`

**Related:** `/Users/mike/code/zhroma/extension/content.js:26-28`

**Issue:** Inspection returns an unsafe result with `table: null` when two matching tables exist. If one table subsequently loses data-test-id or data-garden-id, the attribute filter evaluates only its current selectors: it no longer matches TABLE, contains no matching descendant, and has no matching ancestor. Since candidate is null, every condition is false and the callback returns without a fresh scan. One fully valid table now remains, but it stays untinted indefinitely until another qualifying mutation or lifecycle event occurs. This violates D-04's recovery from unsafe markup and the planned candidate-universe filtering guarantee.

**Reproduction:** Start the actual runtime with two unmarked copies of the admitted priority-present table, then settle. Remove data-test-id from the second table and settle native observer delivery. The first table's markers remain `[null, null, null, null]`, despite being the sole matching valid table. Changing its first Priority text to High then triggers recovery and produces `['High', 'High', 'Normal', 'Low']`, confirming the lost invalidation rather than invalid remaining topology.

**Fix:** Treat removal/change of either identifying attribute on a table element as candidate-universe invalidation even when its final selectors no longer match and no unique candidate is retained. A bounded table-target identifier check is sufficient for this reproduction; alternatively retain enough previous-match information without retaining detached tables. Keep unrelated class/style churn filtered. Add native-observer regressions resolving two-table ambiguity by separately removing each identifier and by removing both identifiers before one observer delivery; the untouched valid table must recover automatically with one coalesced pending pass.

---

_Reviewer: gsd-code-reviewer_
_Depth: standard_
