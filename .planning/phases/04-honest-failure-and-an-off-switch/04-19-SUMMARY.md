---
phase: 04-honest-failure-and-an-off-switch
plan: "19"
subsystem: extension-runtime-review
tags: [independent-review, security, preference, lifecycle, tdd]
status: complete
completed: 2026-09-11
duration: 69min
duration_basis: First task commit 08:11:31Z through final reports 09:19:23Z; includes first halt and explicitly authorized second attempt
requires:
  - phase: 04-18
    provides: Assertion-attributed mutation runner and measured historical inventory
provides:
  - Independently closed resume, application diagnosis, preference certainty and harness defects
  - Final technical handoff with shared 65-file reviewed identity
  - Preserved human, accepted-risk and deferred validation boundaries
affects: [04-20]
tech-stack:
  added: []
  patterns: [fresh bounded application diagnosis, issued-write certainty epoch, finite FIFO harness drain]
key-files:
  created:
    - .planning/phases/04-honest-failure-and-an-off-switch/04-SECURITY.md
    - .planning/phases/04-honest-failure-and-an-off-switch/04-19-MEASUREMENTS.json
    - test/extension/harness-reliability.test.js
    - test/mutants/harness-reliability.mutants.json
  modified:
    - extension/background.js
    - extension/content.js
    - test/extension/chrome-harness.js
    - test/extension/preference-outcome.test.js
    - test/extension/toolbar-popup.test.js
    - test/mutants/preference-outcome.mutants.json
    - test/mutants/worker-boundary.mutants.json
    - .planning/phases/04-honest-failure-and-an-off-switch/04-19-PLAN.md
    - .planning/phases/04-honest-failure-and-an-off-switch/04-REVIEW.md
    - .planning/phases/04-honest-failure-and-an-off-switch/04-GAP-CLOSURE-COVERAGE.md
key-decisions:
  - Enforced the first attempt's mandatory nondecreasing 2-to-2 halt
  - Started a new bounded attempt only after the user explicitly replied proceed
  - Superseded redundant individual-deletion promises with independently verified mechanisms, preserving measured survivors
requirements-completed: []
requirements-addressed: [FAIL-01, FAIL-02, FAIL-03, FAIL-05, CTRL-02, CTRL-03, CTRL-04]
verification_status: technical-clear-human-and-final-binding-pending
reviewed_revision: 255ba31e2b25f7b8c5bde8a3900fb93151594f50
runtime_digest: 46090012ab1a8ebd265273c327b214afbed0321a2fa149ab801ce8c205891065
tests_digest: a48ee5a0fdfd6d7792879d22c557fceb34b8a221d23833d1c7f2e90bbd49fb66
tools_digest: f7459b816951733542019ffb01d7e249ea8d97dfed0a60621e06cc70e91f3323
plan_head_before: 832926ea274005d36444677717df41d9c570a21b
actuals:
  tokens: 114338
  tasks: 3
  commits: 16
  basis: Measured realized owned-file diff characters divided by four; commits from persisted base through reports, including two parent bookkeeping commits, before this summary commit
---

# Phase 04 Plan 19: Independent Integrated Review Summary

Restored pages await fresh preference confirmation; application replies reobserve
the current diagnosis, competing writes invalidate stale checkbox certainty, and
the test harness now bounds reentrant delivery. Independent code and security
review cleared every plan-19 actionable finding.

**3/3 tasks complete. 04-20 may prepare final source-bound evidence.** This is
technical completion only. The default suite still reports its one expected stale
Phase 4 binding failure; no requirement, live observation or human judgment is
promoted.

## Task and repair commits

| Work | Commit | Evidence |
|---|---|---|
| Task 1 independent integrated findings and initial 82-threat register | 0407533 | Three runtime blockers plus harness warning; prescribed 234 passes and repeated tracer gate |
| First attempt resume RED | 4965287 | 209 tests: 5 intended failures, 204 passes; RED_EVIDENCE_OK |
| Resume GREEN | 199e642 | 228 focused passes, resume-read-readiness killed; both reviewers closed CR-19-01 |
| First worker packet RED | f826775 | 314 tests: 8 intended failures, 306 passes; RED_EVIDENCE_OK |
| First worker packet GREEN | 028265e | 356 focused passes; three selected intended kills; original variants fixed |
| Mandatory halt reports and summary | 790872e, 08ab51a | Independent adjacent same-ID counterexamples left actionable count 2 -> 2; stopped |
| Explicit user-authorized second attempt | 8f77223 | Recorded user proceed before revised source changes |
| Revised exact-counterexample RED | 51bbaac | 326 tests: 11 intended failures, 315 passes; RED_EVIDENCE_OK |
| Revised worker GREEN | 31ed071 | 368 focused passes; five selected intended kills; both reviewers closed runtime 2 -> 0 |
| Harness RED | e2a3edc | Four tests: three intended failures, one pass; RED_EVIDENCE_OK |
| Harness GREEN | 255ba31 | 34 focused passes, two selected intended kills; both reviewers closed warning 1 -> 0 |
| Complete gate evidence | 783b5a1 | Complete mutation/default/focused output and 65-file inventory |
| Task 3 final independent reports and coverage | 6b2d618 | Zero plan-19 actionable/runtime/security blockers; explicit deferred validation and human gates |

Parent-only bookkeeping commits 4779b79 and da52ddf are included in the measured
base-to-report count. The executor did not edit shared STATE/ROADMAP/REQUIREMENTS/
WINDOWS. Parent resumes that bookkeeping from this summary.

## Changes and independent convergence

CR-19-01 clears preference readiness before pageshow reconciliation. Held fresh
reads, failed reads and newer change events cannot resurrect an old ON state.

CR-19-02 separates document lifetime from projection generation, then obtains a
fresh diagnosis after a valid successful application reply. At most two fresh
attempts share the original admission deadline and recheck lifetime. This fixes
both old-document and same-document replacement counterexamples while preserving
successful application despite its own invalidation hint.

CR-19-03 rechecks projection generation after artwork and invalidates captured
preference certainty when another native write was issued, even if it has already
settled. Unknown/mixed/disabled is the approved conservative result; a fresh focus
recovers the actual boolean. Both preference directions, icon/title waits and a
neutral document whose diagnosis does not change are durable regressions.

WR-19-01 validates a finite delivery cap, drains FIFO and preserves undispatched
callbacks. A supervised actual-source child fails if the guard is removed and
the queue hangs; timeout is never credited as a successful test or mutation kill.

Each packet amended at most five concrete files before edits, used measured RED
evidence and exact selected mutants, and returned to separate gsd-code-reviewer
and gsd-security-auditor roles. The first halt was enforced, then explicitly
authorized attempt 2 decreased runtime 2 -> 0 and harness 1 -> 0. No contract,
permission, stored schema, package or product-copy change was introduced.

## Final verification

- Full mutation gate: **39/39 intended behavioral kills**, exit 0.
- Prescribed six suites: **423/423 passed**, exit 0.
- Default command: **65/65 smoke tests**, **941/942 Vitest tests**, exit 1.
- Sole default failure: `test/extension/phase-04-live-acceptance.test.js > the repository record binds to every current shipped byte and reports its actual status`.
- Current-source binding/timing regeneration is assigned to 04-20; default is
  explicitly not green until then.
- Independent packet checks passed 368/368 and 34/34; additional actual-source
  successful-write/failed-read traces in both directions retained acknowledged
  checkbox certainty, truthful saved/not-applied copy, zero markers and zero
  forbidden channels.
- Final independent adjudicator probes rejected malformed/empty reports,
  unrelated failures, absent/skipped execution, timeout, runner errors and
  stack-only markers. Green survived; only intended assertions killed.
- Both reports identify reviewed revision255ba31 and identical runtime11,
  tests42 and tools12 digests; all65 per-file hashes were independently verified.
  Complete output is durable in 04-19-MEASUREMENTS.json.
- Historical and working-tree whitespace checks pass after this final summary
  removes the old halted summary's trailing blank line. No tests were skipped.

The code verdict is clear for 04-20 evidence work, with two existing validator
warnings still explicit. Security remains OPEN_THREATS overall: **66 mitigated,
12 documented accepted, four deferred high threats, zero technical threats**.
T-04G3-21..24 belong to final binding, validator/promotion, live privacy and genuine
ACK/judgment work. Deferred work is not a threat waiver.

## Historical mechanism dispositions and remaining boundaries

Current independent remeasurement retained popup-copy-fallback and
project-guard-after-preference as **SURVIVED**, excluded from39 kills. Exact pair
validation and downstream state/generation/deadline admission/dispatch explain
the redundant sites. The old ANY ONE syntax-deletion promise is explicitly
superseded at mechanism level. Retention and no-committed-paint claims now use
actual Map and action logs under closure/reuse/held boundaries. Already-issued
native effects and cross-worker ordering remain exact approved limits.

The registry's ONLY-request-ID note is corrected; an inherited worker-integrity
test comment retains obsolete explanatory wording, explicitly qualified in
REVIEW. Pass2 IN-02 locale evidence validation and pass1 IN-08 predecessor
provenance remain assigned04-20. IN-05 type tooling remains unimplemented; tsc
was not run. No new package was installed.

All seven canonical requirement statuses and edge classifications remain
unpromoted, as do prohibition judgments, ACK-04-01 and current-build observations.
AR-04-01 still covers only language-icon-copy and structure-copy; synthetic
tests are not live acceptance. Phase3 remains human_needed. The current summaries
do not authorize automatic requirement completion.

## Deviations from Plan

- **Rule 1 — bugs:** Four concrete review findings required the bounded repair
  packets above. No scope beyond the ratified contract was assumed.
- **Mandatory stop and explicit restart:** First attempt halted on nondecreasing
  count. User-approved revised attempt was documented before proceeding.
- **Documentary correction:** Final summary removes a trailing blank line left by
  the halted summary; no reviewed source bytes changed during report closeout.
- Shared state and cross-phase ledgers are parent-owned by explicit orchestration;
  this executor leaves their canonical statuses untouched.

No authentication gate, new threat surface, implementation stub or skipped test
was introduced. The historical word “placeholder” in a test comment describes
superseded copy, not a runtime stub. Baseline unrelated dirt was preserved.

## Self-Check: PASSED

All named created artifacts and listed commits exist. Both report identities
match the durable measurement inventory. No owned source/test/tool edits remain
uncommitted, and final documentation contains the explicit expected binding
failure and deferred human obligations.
