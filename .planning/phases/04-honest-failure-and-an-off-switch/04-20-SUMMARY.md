---
phase: 04-honest-failure-and-an-off-switch
plan: "20"
subsystem: acceptance-validation
tags: [source-binding, canonical-promotion, independent-review, synthetic-timing]
status: complete
halt_reason: null
completed_tasks: 3
total_tasks: 3
checkpoint_task: 2
checkpoint_gate: blocking-human
prepared: 2026-09-11
duration: 27min
duration_basis: First task commit at09:25:12Z through technical preparation commit; initial reading excluded
requires:
  - phase: 04-19
    provides: Independently reviewed final runtime and mutation gate
provides:
  - Final eleven-asset acceptance binding with fourteen observed current-source passes and three pending checks
  - Seven actual Chrome synthetic timing runs with one identity
  - Independently reviewed strict locale and canonical-promotion guard
affects: [04-LIVE-ACCEPTANCE, 04-VALIDATION, 04-VERIFICATION, STATE, REQUIREMENTS, WINDOWS]
tech-stack:
  added: []
  patterns: [exact source and review identity, pure promotion guard, attributed human evidence]
key-files:
  created:
    - .planning/phases/04-honest-failure-and-an-off-switch/04-20-MEASUREMENTS.json
    - .planning/phases/04-honest-failure-and-an-off-switch/04-20-VALIDATOR-REVIEW.md
  modified:
    - test/extension/phase-04-live-acceptance.test.js
    - .planning/phases/04-honest-failure-and-an-off-switch/04-LIVE-ACCEPTANCE.md
    - .planning/phases/04-honest-failure-and-an-off-switch/04-PERFORMANCE-SAMPLES.json
    - .planning/phases/04-honest-failure-and-an-off-switch/04-PERFORMANCE.md
    - .planning/phases/04-honest-failure-and-an-off-switch/04-VALIDATION.md
key-decisions:
  - Unreadable-state observations are required for FAIL-01 and FAIL-05 as well as FAIL-03
  - Runtime repair identity and later Phase3 observation-record identity are independently derived and kept separate
  - No historic live observation or old approval answers Task2 or ACK-04-01
requirements-completed: []
requirements-addressed: [FAIL-01, FAIL-02, FAIL-03, FAIL-05, CTRL-02, CTRL-03, CTRL-04]
plan_head_before: eb209b05ed276131fdaa4a91d2613c5b893dd8bd
actuals:
  tokens: 560185
  tasks: 3
  commits: 4
  basis: Measured2240737characters/4roundedup over realized seven-file diff through Task1 commit; excludes this summary and its metadata commit
---

# Phase 04 Plan 20: Final Evidence Preparation Summary

Final acceptance binds all eleven reviewed assets; seven fresh synthetic Chrome
runs pass, and an independently reviewed promotion guard prevents unsupported
canonical completion. The user completed fourteen current-source live checks and
explicitly deferred the remaining regional-English check as non-blocking. The
two AR-04-01 scenarios remain pending. **Plan 20 is complete; the phase remains
human_needed.**

## Completed work and commits

| Work | Commit |
|---|---|
| Measured locale/scope RED regressions |0bd3587 |
| Locale scope GREEN implementation |3250f93 |
| Measured canonical-promotion RED regressions and Phase3 provenance |b63e5c9 |
| Task1 final binding, reviewed validator, timing and durable measurements |4848b83 |

The authorized scope was the five Task1 files plus bounded measurement, independent
review and checkpoint-summary artifacts. No runtime, package, tool, harness,
registry or prior-phase artifact was changed. Shared STATE/ROADMAP/REQUIREMENTS/
WINDOWS bookkeeping remains parent-owned. Baseline config/state dirt, .gsd,
milestone.lock and ui-reviews were preserved.

## Technical and independent evidence

- Final default suite: **65 smoke checks +994 Vitest tests**,22 files,exit0.
- Final acceptance/promotion suite: **94/94**, independently repeated and repeated
  after result-only appraisal metadata; actual status remains human_needed.
- Complete mutation gate: **39/39 intended assertion kills**,exit0. Validator-only
  repairs did not change any runtime/tool/harness/registry input to that gate.
- Actual Chrome smoke: passed,exit0.
- Seven actual Chrome full synthetic runs:4200 measurements,420 warmups,one
  source/environment/harness identity; largest30-row median1.300ms and largest
  enabled batch13.600ms. Loaded dormant run has zero callbacks,writes,observers,
  pending timers. Temporary complete output was validated before canonical replacement.
- Independent validator review: **4→2→0 actionable findings** over the allowed
  three cycles. Final94tests,21 direct negative controls refused and2 legitimate
  Complete/ACK positive controls accepted. Gate:pass_for_task_2_human_checkpoint.
- Four measured RED records passed RED_EVIDENCE_OK. Raw/normalized outputs are
  retained. Initial module-load errors and unparseable Vitest TAP were not accepted
  as RED; leaf indentation/summary normalization was explicit and evidence-derived.

Reviewed code revision:255ba31e2b25f7b8c5bde8a3900fb93151594f50.
Runtime eleven-asset aggregate:
46090012ab1a8ebd265273c327b214afbed0321a2fa149ab801ce8c205891065.
Final validator SHA256:
534ef7de8c882c82e11b923d3a3c016c4857ac8c95f47969688642322a4c4ca7.
Independently reviewed five-file diff SHA256 before appraisal metadata:
9abf9a910f5eb36140a7d862920194412cad42284820e08fdad67e89ccdd32f4.
The pre-appraisal VALIDATION text is retained in MEASUREMENTS so this snapshot
can be reconstructed. The reviewer explicitly permitted result-only metadata
after recheck; no semantic validator/evidence change followed it.

## Deviations and review repairs

**Rule1 — validator bugs, within Task1 scope.** Independent review required
unreadable-state checks in FAIL-01/FAIL-05, review readiness bound to exact current
runtime plus committed inventory, well-formed BCP47 validation, hypothetical
requirement controls independent of actual completion, exact-one metadata fields,
and acknowledgement controls that permit genuine future progress. Counterexamples
were measured before fixes; the independent findings decreased each cycle.
No runtime/tool defect required return to04-19. No review bound was exceeded.

The actual diff-cost estimate is large because source-bound timing JSON and full
measurement transcripts are realized evidence. It is measured on the plan's
characters/4 scale, not model token usage. No number was rounded toward the estimate.

## Preserved evidence and remaining gates

Previous evidence remains recoverable at70ad1e5 using the exact current evidence
paths. The five-file2026-09-10-before-review-repair history is byte-identical.
Its fourteen genuine attestations still concern77b3a19, not this runtime.

Phase3 runtime382cc881 and observation commit3979fb0730c6f778ddd31ad5ec89cfa997b79cc5
were derived from Git and all three prior runtime hashes checked. Phase3 remains
human_needed,28/34,eleven passes/nine pending,user-skipped UAT; profiling stays
deferred. Synthetic layout and retainer attribution were not taken.

Current Phase4 record:loaded_from_repository:true,source_confirmed_on:2026-09-11,
environment confirmed as Chrome152,macOS27 beta6,30 mounted rows,English/light.
Fourteen of seventeen current-source live checks passed. AR-04-01 still covers
only language-icon-copy and structure-copy; neither is marked passed and no waiver
was expanded. english-regional-locale remains pending after the user explicitly
deferred it as non-blocking. All seven edge classifications and three flagged
prohibition IDs remain explicit. Existing qualified ratifications are preserved
with their source citations.

04-19 code review is technically clear; security still has four deferred final
evidence threats,66 mitigated and12 documented accepted. Task3 supplies current
goal verification in 04-VERIFICATION.md and keeps the result human_needed. No
implementation stub, test skip, installation, remote publication or live account
action was introduced. Filtered RED runs are not permanently skipped tests.

## Final state after Task2 and Task3

ACK-04-01 is acknowledged. The user confirmed the repaired repository build and
unchanged environment numbers, then passed fourteen checks:
working-icon,blank-copy,missing-icon-hint,missing-settle-transition,off-clears,
on-restores,restart-off,restart-on,cross-tab-preference,frozen-resume,
nonreceiver-status,navigation-status,worker-restart,popup-keyboard.

Three checks remain pending. language-icon-copy and structure-copy are the
previously waived AR-04-01 residuals, still not evidence. english-regional-locale
was explicitly deferred by the user as non-blocking because they did not know how
to set that Zendesk context safely.

Task3 reconciled the current evidence in 04-VERIFICATION.md, 04-VALIDATION.md,
STATE, REQUIREMENTS and WINDOWS. No canonical requirement was promoted to
Complete. The final phase disposition is `human_needed`, not `passed` and not
`gaps_found`.

## Self-Check: PASSED

All created artifacts and task commits exist. Reviewed validator hash and eleven
runtime hashes match. Only unrelated baseline dirt remains outside the owned
evidence files. The final record accurately reports fourteen live passes and
three pending checks; no requirement was promoted from unobserved evidence.
