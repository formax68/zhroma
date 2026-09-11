---
phase: 04-honest-failure-and-an-off-switch
plan: "19"
subsystem: extension-runtime-review
tags: [independent-review, security, preference, lifecycle, tdd, halted]
status: halted
completed: null
halted: 2026-09-11
duration: 16min
duration_basis: First task commit 08:11:31Z through halt-report commit 08:27:47Z; initial review/context loading excluded
requires:
  - phase: 04-18
    provides: Assertion-attributed mutation runner and measured historical inventory
provides:
  - Independent integrated counterexamples and 82-threat security register
  - Independently closed restored-page preference freshness repair
  - Partial worker lifetime and post-artwork response repairs with remaining blockers
affects: [04-20]
tech-stack:
  added: []
  patterns: [separate document lifetime and projection generation]
key-files:
  created:
    - .planning/phases/04-honest-failure-and-an-off-switch/04-19-REPAIR1-RED.json
    - .planning/phases/04-honest-failure-and-an-off-switch/04-19-REPAIR2-RED.json
    - .planning/phases/04-honest-failure-and-an-off-switch/04-SECURITY.md
  modified:
    - extension/content.js
    - extension/background.js
    - test/extension/preference-outcome.test.js
    - test/extension/toolbar-popup.test.js
    - test/mutants/preference-outcome.mutants.json
    - .planning/phases/04-honest-failure-and-an-off-switch/04-19-PLAN.md
    - .planning/phases/04-honest-failure-and-an-off-switch/04-REVIEW.md
    - .planning/phases/04-honest-failure-and-an-off-switch/04-GAP-CLOSURE-COVERAGE.md
key-decisions:
  - Apply the mandatory nondecreasing affected-finding stop at two open findings before and after packet 2
  - Preserve all independent counterexamples despite green suites and selected mutation kills
requirements-completed: []
requirements-addressed: [FAIL-01, FAIL-02, FAIL-03, FAIL-05, CTRL-02, CTRL-03, CTRL-04]
verification_status: blocked-independent-recheck
reviewed_revision: 028265ed28b9fbb9c68d37a77af840bf69159421
runtime_digest: f6a4e4bca9a5409e1164f0bc1622c349286a53e9a455fcc23bf08e0ca20573ad
tests_digest: 998fe146818b4ab39352b43daba817364a649bf9d88a89ba332838ff2b29edb7
tools_digest: f7459b816951733542019ffb01d7e249ea8d97dfed0a60621e06cc70e91f3323
plan_head_before: 832926ea274005d36444677717df41d9c570a21b
actuals:
  tokens: 67027
  tasks: 1
  commits: 6
  basis: ceil(268107 realized diff characters / 4), including raw RED evidence; measured before this summary commit
---

# Phase 04 Plan 19: Independent Integrated Review — Halted Summary

Restored pages now wait for a fresh preference before tinting; independent review
still finds stale current-view copy and stale switch certainty after asynchronous
waits, so the mandatory nondecreasing-finding gate stops execution.

**Plan incomplete: 1/3 tasks complete.** Task 1 completed; Task 2 contains two
committed repair packets but is incomplete; Task 3 independent recheck halted.
**04-20 is blocked. No final binding or live acceptance may proceed.**

## Task and repair commits

| Work | Commit | Evidence |
|---|---|---|
| Task 1 independent findings/initial security register | 0407533 | Three runtime blockers and one harness warning; prescribed 234 tests passed and tracer gate independently repeated 234 passes |
| Packet 1 RED | 4965287 | 209 tests, 5 intended failures, 204 passes; RED_EVIDENCE_OK |
| Packet 1 GREEN | 199e642 | 228 focused passes; resume-read-readiness KILLED 1/1 |
| Packet 2 RED | f826775 | 314 tests, 8 intended failures, 306 passes; RED_EVIDENCE_OK |
| Packet 2 GREEN, partial outcome | 028265e | 356 focused passes; three exact selected mutants each KILLED 1/1 |
| Mandatory halt reports | 790872e | Independent affected actionable count 2 -> 2, two high blockers plus warning retained |

The six measured commits are from the per-plan on-disk ledger. The summary commit
is separate and necessarily increases a later HEAD-based count.

## Independent review and present blockers

Independent specialized gsd-code-reviewer used resolved high effort; independent
gsd-security-auditor used resolved xhigh effort. Both inherited the configured
model because resolution deliberately returned an empty model. The executor did
not self-certify the repairs. Code reviewer owns REVIEW; security auditor returned
structured verdicts and the executor wrote SECURITY.

- **CR-19-01 / T-04-05 CLOSED.** A page restored from old ON no longer resumes
  before its fresh read. Both reviewers independently reproduced held-read
  controls across four initial/current booleans. Code recheck: 228 passed and
  exact mutant independently killed. Security recheck: 237 passed including
  registry, exact mutant independently killed, forbidden channels empty.
- **CR-19-02 / T-04-13 OPEN high.** Separate document lifetime now rejects
  navigation/closure/reused-tab acknowledgements. Same-document body/table
  replacement while a successful application response is captured still returns
  working after current markers become empty and toolbar becomes neutral.
- **CR-19-03 / T-04G-23 OPEN high.** Post-icon/title generation check refuses
  old diagnosis. A completed opposite write during the wait still leaves the
  returned unavailable tuple carrying the old enabled boolean. The popup's
  operable, nonmixed checkbox is opposite storage. Security reproduced both
  directions.
- **WR-19-01 OPEN warning.** The inherited chrome-harness.flush drain loops
  indefinitely if a delivered callback continually requeues reads. Independent
  bounded child probe returned ETIMEDOUT/SIGTERM after 1000 ms. Its repair packet
  was not started after the halt.

These are known invalidations before newly constructing a response, outside the
approved already-issued-native-artwork and post-response snapshot limitations.
The next technical direction would require fresh bounded diagnosis and fresh
preference evidence or uncertainty without renewing the 4000 ms budget. No such
additional repair was performed after the stop.

## Exact remaining counterexamples

**CR-19-02:** boot actual worker/content/popup stored=false; hold content-response;
request true and capture its actual successful application; remove all body
children within the same content document; settle; unhold/release response.
Observed stored=true, current markers=[], toolbar neutral/Checking, popup working,
reply saved=true/enabled=true/applied=true/status=working, forbidden=[].

**CR-19-03:** boot stored=P; hold tab 7 icon; open a fresh popup and let its read
capture P; another popup sends set-enabled request 888 for !P and completes; release
icon. Observed storage=!P and the other acknowledged reply=!P, but the first
popup-status is unavailable/enabled=P and its checkbox remains confirmed P.
Independently reproduced P=true and P=false.

These final counterexamples were independent temporary actual-source probes,
**not yet durable named regression tests**. Full recipes and outputs are in
REVIEW/SECURITY. The existing named tests below pass and cover narrower repaired
variants; they must not be represented as failing tests for the remaining bugs:

- captured apply from false after navigation preserves only current application
- captured apply from true after navigation preserves only current application
- corresponding closed/reused/same-document controls in preference-outcome
- popup status after held icon with invalidation true is current
- popup status after held title with invalidation true is current

## Verification and TDD gate compliance

Both RED records retain raw Vitest tap-flat output plus explicitly derived Node
TAP summary counts and both passed the GSD RED_EVIDENCE_OK checker before GREEN.
No unexpected parse/load error, missing test or unrelated assertion authorized
implementation. Repairs were scoped in PLAN before editing, each at most five
files including its RED record.

Initial independent successful-write/failed-read and opposite-readable probes
were exercised through actual stored object, current markers, whole reply,
popup checkbox/copy and forbidden channels in both directions. They validate
pass 2 CR-01 repair without certifying later async freshness.

Packet 2 final focused run: preference-outcome, toolbar-popup, worker-integrity
and mutation-registry, **356/356 passed**; both reviewers independently reran
that focused run. Selected executor measurements:

| Exact mutant | Result and intended assertion |
|---|---|
| resume-read-readiness | KILLED, review:resume-unconfirmed-no-markers |
| apply-document-lifetime | KILLED, review:apply-document-lifetime |
| popup-post-action-status | KILLED, review:popup-post-action-current |
| pending-reopen-certainty | KILLED after refreshing whole-function literal, outcome:pending-reopen-mixed |

Each selected invocation first ran its clean disposable baseline. The independent
reviewers challenged green survivor, intended assertion kill and unrelated-failure
controls; security additionally rejected empty/malformed report, absent/skipped
target, unhandled errors, signal/timeout and marker-only-in-stack false evidence.

Final diff whitespace checks pass and no tracked file was deleted. No production
stub was introduced. The historical placeholder word in a toolbar-test comment
describes the old state and is not an unwired runtime stub.

## Deferred verification and authority

The full **36-entry current registry was not executed after these repairs**.
There is no new full-mutation, complete behavioral/default-suite, whole-inventory
semantic-review or current-binding pass. Task 3 verification and remaining Task 2
completion verification were not performed after the mandatory halt. Prior 04-18
33/33 and 65 smoke + 902/903 Vitest results remain historical, source-qualified
evidence; its sole stale phase-04-live-acceptance binding failure is still pending
04-20 and was not suppressed or rebound.

The obsolete request-id-echo registry note calls request ID the ONLY staleness
key. Reports explicitly supersede it; correcting that source note remains deferred.
04-12 ANY ONE guard promises have mechanism-level rather than fictitious
individual-guard evidence. The two historical excluded survivors remain survivors.
04-14 retention/attempted-call/committed-paint distinctions have behavioral
evidence, but they cannot close the separate current-response defects.

Security register: **82 total; 76 closed or documented accepted; 2 high technical
blockers; 4 high threats deferred/open for 04-20.** All twelve existing accepted-risk
log entries were independently checked without expanded consent. Four deferred
threats cover final identity, validator/promotion, live privacy and authentic
human judgment. They are distinct from implementation blockers.

All seven Phase 4 requirements remain unchecked/unresolved. Seven edge
classifications, prohibition judgments and ACK-04-01 remain pending. AR-04-01
still covers only two original live scenarios. Phase 3 remains human_needed,
eleven passes/nine pending. No tsc run or new package claimed. Shared STATE,
ROADMAP, REQUIREMENTS and WINDOWS are owned by the parent; this executor did not
write them. Parent will record the halt and preserve ledger defects/unrun verifies.
No live tenant, remote publication, immutable historical record or baseline dirt
was modified.

## Deviations from Plan

Two authorized bounded repair packets implemented concrete independent findings.
No contract/schema/permission/product decision changed. Execution stopped under
the plan's explicit Task 3 rule: “stop earlier if the actionable issue count does
not decrease between cycles”. Packet 2 remained 2 -> 2; no automatic waiver or
third attempt was used. The full plan and final-source review remain incomplete.

## Self-Check: PASSED

The three created evidence/report files exist; all six listed task/report commits
resolve; REVIEW and SECURITY name the same final runtime/test/tool aggregates and
reviewed revision; no owned implementation or report changes are left uncommitted
after closeout. This checks the accuracy of a halted handoff, not goal completion.

