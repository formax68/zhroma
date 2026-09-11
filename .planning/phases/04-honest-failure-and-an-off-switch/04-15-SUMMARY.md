---
phase: 04-honest-failure-and-an-off-switch
plan: "15"
subsystem: ui
tags: [preference, actual-source, tdd, blocking-human]
status: halted
checkpoint: blocking-human
completed_tasks: 1
pending_task: 2
verification_status: gaps_found
requirements-completed: []
requirements-addressed: [CTRL-02, CTRL-03, CTRL-04]
plan_head_before: 8382d826d7d54934d75d8dd5858317866e6f487f
actuals:
  tasks: 1
  commits: 3
key-files:
  created:
    - test/extension/preference-outcome.test.js
    - .planning/phases/04-honest-failure-and-an-off-switch/04-PREFERENCE-CONTRACT.md
    - .planning/phases/04-honest-failure-and-an-off-switch/04-15-RED.json
    - .planning/phases/04-honest-failure-and-an-off-switch/04-15-OPERATIONAL-RED.json
  modified:
    - extension/background.js
    - extension/popup.js
    - test/extension/toggle.test.js
    - test/extension/popup-recovery.test.js
provides:
  - Confirmed save survives failed read-back in both directions
  - Successful acknowledged OFF uses off copy even when worker read-back fails
  - Full outcome table and every-wait inventory with pending uncertainty proposal
affects: [04-16, 04-18, 04-19, 04-20]
coverage:
  - id: D1
    description: Acknowledged preference, application and copy remain distinct across both-direction read/write/application faults
    verification:
      - kind: integration
        ref: test/extension/preference-outcome.test.js
        status: pass
    human_judgment: false
  - id: D2
    description: Unknown-setting copy, mixed disabled switch and native/epoch limitations approved by user
    verification: []
    human_judgment: true
    rationale: Task 2 decision is pending; proposals and tests are not consent
---

# Phase 04 Plan 15: Confirmed Preference Repair — Decision Checkpoint

Task 1 is complete; Task 2 has no user answer. This halted summary records partial
execution, not plan completion or requirement acceptance. Resume Task 2, not Task 1.

## Task commits

- `d2e2c1f` — initial RED: eight new read-fault cases plus both corrected toggle directions.
- `0f0cf05` — additional RED: successful application after a worker-only failed read.
- `0b9ac92` — GREEN: popup evidence precedence, worker operational copy, decision packet.

Three task commits measured against the recorded plan base, before this summary.
Only the named files were staged. Existing config/state.json/.gsd/milestone.lock/
ui-reviews changes remain outside these commits. GSD's unresolved origin/HEAD
base check required sequential execution on existing main; no worktree or remote
publication was created.

## Verified behavior

The returned readable boolean takes precedence. If it is null and saved=true,
the acknowledged desired value is displayed; NOT_SAVED is reserved for saved=false
on this validated reply path. Explicit negative application still uses NOT_APPLIED;
missing/invalid document replies remain unavailable. Worker operation copy uses the
same confirmation precedence without concealing null read-back in its reply.

20 new cases execute real worker/content/popup bytes through the strict tracer.
They jointly check storage, checkbox checked/disabled/indeterminate, copy, markers,
focus, request/reply traffic, write log and forbidden channels in both directions.
The existing popup recovery suite supplies the platform-disabled-focus model;
synthetic focus is not real keyboard/browser acceptance.

## Verification

| Command / record | Observed result |
|---|---|
| preference-outcome + toggle, initial tap-flat RED | 37 executed, 10 intended assertion failures, 27 passed; exit 1 |
| check tdd-red-evidence 04-15-RED.json | RED_EVIDENCE_OK |
| preference-outcome, successful-application expansion RED | 20 executed, 1 intended assertion failure, 19 passed; exit 1 |
| check tdd-red-evidence 04-15-OPERATIONAL-RED.json | RED_EVIDENCE_OK |
| node node_modules/vitest/vitest.mjs run --config vitest.config.js test/extension/preference-outcome.test.js test/extension/toggle.test.js test/extension/popup-recovery.test.js test/extension/worker-integrity.test.js test/extension/toolbar-popup.test.js | 5 files, 153 passed, exit 0 |
| node node_modules/vitest/vitest.mjs run --config vitest.config.js test/extension/phase-04-live-acceptance.test.js | 41 passed, 1 expected source-assets mismatch, exit 1 |
| git diff --check | exit 0 |

RED records retain raw output. Vitest tap-flat omits Node summary comments, so the
records explicitly document appended counts derived from actual result lines.
No discovery/load failure was used as RED. The expected binding failure reflects
background.js/popup.js changes; no acceptance hashes or observations were rebound,
and no mutant kill was claimed. A full-suite or phase-wide green is not claimed.

## Deviations from plan

1. **Rule 1, regression expectation correction:** popup-recovery.test.js contained
   a second test asserting the same false successful-save result as toggle.test.js.
   Corrected that single case and ran its whole suite; production copy unchanged.
2. **Rule 1, related operation-copy defect:** a worker-only failed read with a
   successful OFF application returned Checking this view. Added both-direction
   tests, reproduced one intentional failure, and used acknowledged intent solely
   for operational copy. Raw enabled remains null. Background.js is already in
   plan ownership. A separate RED record/commit documents this extension.
3. Persisted RED evidence artifacts are additional plan-local outputs required by
   the invoked TDD workflow. No dependency/package changes.

## Pending checkpoint — Task 2

See 04-PREFERENCE-CONTRACT.md for the reviewable full outcome matrix and wait
inventory. Proposed exact copy: **Zhroma could not confirm that setting**.
Keep the existing labelled checkbox indeterminate and temporarily disabled;
worker answers within 4000 ms of admission, popup transport fallback stays 5000 ms.
Expire queued requests without later writes; retain raw-write exclusion until the
actual native callback settles. Fresh bounded reopen/focus reads recover only when
the native-write state permits confirmation. A forever-stalled write can keep
mutation unavailable; worker termination loses in-memory exclusion, so no ordering
guarantee spans worker epochs. Delayed native artwork may remain transiently stale
until settlement and current reconciliation.

No unknown_preference decision was written. Neither earlier ratifications nor
AR-04-01 authorize this proposal. No live UAT is requested at this checkpoint.
04-16 is blocked until an actual answer is recorded and its plan matches it.
04-17 has not run; 04-18–20 remain pending. Independent review/security and final
binding remain later gates. Phase 4 remains gaps_found; Phase 3 remains human_needed;
ACK-04-01 and historical observations remain untouched.

## Resume

Verify the three Task 1 commits, read the contract, collect the actual Task 2
answer once, and append attributed unknown_preference fields to DECISIONS.json.
If the proposal is revised, adapt 04-16 before execution. Then finish this summary
and resume remaining waves. Do not rerun Task 1 or treat this halted summary as a
completed plan. Keep requirements-completed empty until acceptance is supported.

## Self-check: Task 1 passed; plan halted

Required repair, tests and contract exist and are committed. Focused verification
passed against repaired bytes. Task 2 authenticity check intentionally cannot pass
without the user's response. No completion/acceptance promotion was performed.
