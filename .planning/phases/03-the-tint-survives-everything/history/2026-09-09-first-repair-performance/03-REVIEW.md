---
phase: 03-the-tint-survives-everything
reviewed: 2026-09-09T12:31:02Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - extension/content.js
  - test/extension/persistent-tint.test.js
  - test/extension/phase-03-live-acceptance.test.js
  - scripts/run-tint-workload.js
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
---

# Phase 03: Runtime Repair Code Review

**Reviewed:** 2026-09-09T12:31:02Z  
**Depth:** standard  
**Files Reviewed:** 4  
**Status:** clean within the explicit repair scope; acceptance remains open.

## Narrative Findings (AI reviewer)

No substantiated actionable correctness, security, or robustness defect remains in the reviewed repairs. Read all four scoped source files in full and checked their interactions with the unchanged stylesheet, runtime-contract and performance-harness tests, Phase 03 context and all four plans. No root AGENTS.md, project skill directories, or .codexignore exist; configured agent skills are empty and none of the scoped files are Git-ignored. No structural pre-pass was supplied.

The original two BLOCKER findings remain preserved in the [pre-repair review](history/2026-09-09-before-runtime-repair/03-REVIEW.md). This report supersedes their disposition for the current source only; it does not erase historical evidence or close Phase 03.

## Original finding disposition

| Historical finding | Current disposition | Independently checked behavior |
|---|---|---|
| CR-01 — copied markers survive whole-table rejection | Resolved in reviewed source | Mounted copied markers enter cleanup alongside tracked detached originals. Unknown, incomplete and unidentified replacements lose every marker; a blank row loses its own marker; a valid changed priority receives its current value. |
| CR-02 — identifier removal cannot resolve ambiguity | Resolved in reviewed source | Table-target changes to either identifying attribute invalidate the candidate universe even with no retained candidate and no final selector match. The sole remaining valid table recovers automatically. |

The runtime changes at `extension/content.js:76-103` adopt only the reserved marker attribute for cleanup, derive retained values from a fresh validated table, update expected marker state, and release cleaned row identities. At `extension/content.js:147-167`, untracked marker mutations and copied marked subtrees become relevant, and table identifier changes trigger recovery. The exact table/priority interpretation and CSS paint boundary are unchanged. Ordinary class/style and unrelated sibling churn remain filtered; expected self-writes quiesce. Source inspection and native-preservation assertions show no writes to ticket data, native attributes, content, or handlers.

`scripts/run-tint-workload.js` threads a per-command timeout through the existing CDP helpers: defaults remain 60 seconds, while the non-profile workload evaluation receives 180 seconds. Thresholds, sample counts, source identity checks, and measurement classification remain unchanged.

The acceptance-test repair builds hypothetical successful samples entirely in memory. Its separate repository-record test still consumes real samples. The historical-preservation test compares the previous live report, performance report, and samples byte-for-byte with commit `e2eb7bab92deb04d1ad5ec1156973426ab0e0e8f`, checks all three old runtime hashes, retains the 16 historical passes and four pending checks, and rejects that record for current-source acceptance.

## Independent reproduction and verification

A temporary inline Node VM reproduction executed both historical and current content-script bytes against the admitted priority-present fixture with a native happy-dom MutationObserver and ordinary asynchronous delivery. It wrote no source or test files. Historical unknown, blank, incomplete and unidentified replacement clones retained `Urgent, High, Normal, Low`; historical ambiguity resolution left all eight rows unmarked. Current results were:

| Transition | Settled current markers |
|---|---|
| Unknown, incomplete, or unidentified clone | All four null |
| Blank first Priority in clone | null, High, Normal, Low |
| Valid first Priority changed to Low | Low, High, Normal, Low |
| Competitor loses data-test-id | Urgent, High, Normal, Low on the remaining candidate; four nulls on the competitor |

Each current reproduction also checked detached originals were cleaned, any strongly owned nodes remaining at rest were connected, observer callbacks stopped after settling, idle timers were zero, and pagehide released every strongly owned node. All assertions passed. Repository native-observer regressions additionally cover separate and same-batch removal of both identifiers, the pre-deferred-write state, untracked markers on blank rows, and copied non-view subtrees with native markup preserved.

Executed:

```sh
node node_modules/vitest/vitest.mjs run --config vitest.config.js test/extension/persistent-tint.test.js test/extension/runtime-contract.test.js test/extension/performance-harness.test.js test/extension/phase-03-live-acceptance.test.js
```

Result: **112 passed, one failed, 113 total**. All persistent runtime tests, runtime-contract tests, performance-harness unit tests, hypothetical acceptance tests, and historical preservation checks passed. The sole failure was the repository live-record check with `PHASE03_ACCEPTANCE_REJECTED performance-source`: canonical performance samples still carried the previous runtime identity during the orchestrator's ongoing refresh. This is an explicitly incomplete evidence update, not a new defect in the reviewed source. The orchestrator must finish the current-source evidence refresh and obtain a passing final suite before claiming verification complete. This review does not claim that rerun occurred.

## Source identity and acceptance limits

Reviewed content.js SHA-256: `3c197baa632eceeb25145a6f64d28cdf6708efa71f2310d1a8dc93451938d2c8`.

Other scoped SHA-256 values:

- persistent-tint.test.js: `a40df279864e5a6b59d22e9143cd578a6bf3c98d9b3015e84d7964590fa34e04`
- phase-03-live-acceptance.test.js: `7a4bf68c472cb78003e594c03ecdf454c41664ed8822c5607b6f96a203cd4c7a`
- run-tint-workload.js: `01352d7c1fef5e9607caf7632c4ee13e452f8d7788958ccedd4f3ce5cc993fb3`

No timing benchmarks, authenticated browser interactions, or manual layout/retainer profiling were performed by this reviewer. Synthetic Chrome measurement is separately owned. The earlier 16 live passes belong to the historical runtime; the repaired source has no confirmed live acceptance. Manual profiling remains deferred, and the documented permanent native-removal failure limitation remains applicable. A clean scoped code review establishes neither completed performance evidence nor Phase 03 acceptance.

Only this review artifact was changed by the reviewer. No implementation, tests, state, or evidence files were modified, and no commit was created.

---

_Reviewer: gsd-code-reviewer_  
_Depth: standard_
